import { Request, Response } from 'express';
import { AppDataSource } from '../config/data-source';
import { Lead } from '../entities/Lead';
import { Account } from '../entities/Account';
import { Contact } from '../entities/Contact';
import { User } from '../entities/User';
import { AuthRequest } from '../middleware/auth';

const leadRepository = AppDataSource.getRepository(Lead);
const accountRepository = AppDataSource.getRepository(Account);
const contactRepository = AppDataSource.getRepository(Contact);
const userRepository = AppDataSource.getRepository(User);

// Get all leads with filtering and pagination
export const getLeads = async (req: AuthRequest, res: Response) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      type,
      priority,
      assignedTo,
      accountId,
      search
    } = req.query;

    const queryBuilder = leadRepository.createQueryBuilder('lead')
      .leftJoinAndSelect('lead.account', 'account')
      .leftJoinAndSelect('lead.contact', 'contact');

    // Apply filters
    if (status) {
      queryBuilder.andWhere('lead.status = :status', { status });
    }
    if (type) {
      queryBuilder.andWhere('lead.type = :type', { type });
    }
    if (priority) {
      queryBuilder.andWhere('lead.priority = :priority', { priority });
    }
    if (assignedTo) {
      queryBuilder.andWhere('lead.assignedTo = :assignedTo', { assignedTo });
    }
    if (accountId) {
      queryBuilder.andWhere('lead.accountId = :accountId', { accountId });
    }
    if (search) {
      queryBuilder.andWhere(
        '(lead.title ILIKE :search OR lead.description ILIKE :search OR account.name ILIKE :search OR contact.firstName ILIKE :search OR contact.lastName ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    // Apply pagination
    const skip = (Number(page) - 1) * Number(limit);
    queryBuilder.skip(skip).take(Number(limit));

    // Apply sorting
    queryBuilder.orderBy('lead.createdAt', 'DESC');

    const [leads, total] = await queryBuilder.getManyAndCount();

    res.json({
      leads,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching leads:', error);
    res.status(500).json({ error: 'Failed to fetch leads' });
  }
};

// Get a single lead by ID
export const getLead = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const lead = await leadRepository.findOne({
      where: { id },
      relations: ['account', 'contact']
    });

    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    res.json(lead);
  } catch (error) {
    console.error('Error fetching lead:', error);
    res.status(500).json({ error: 'Failed to fetch lead' });
  }
};

// Create a new lead
export const createLead = async (req: AuthRequest, res: Response) => {
  try {
    const leadData = {
      ...req.body,
      createdBy: req.user?.id,
      createdByName: req.user?.name || req.user?.email
    };

    // Validate account exists if provided
    if (leadData.accountId) {
      const account = await accountRepository.findOne({ where: { id: leadData.accountId } });
      if (!account) {
        return res.status(400).json({ error: 'Account not found' });
      }
      leadData.accountName = account.name;
    }

    // Validate contact exists if provided
    if (leadData.contactId) {
      const contact = await contactRepository.findOne({ where: { id: leadData.contactId } });
      if (!contact) {
        return res.status(400).json({ error: 'Contact not found' });
      }
      leadData.contactName = `${contact.firstName} ${contact.lastName}`.trim();
      leadData.contactEmail = contact.email;
      leadData.contactPhone = contact.phone;
    }

    // Validate assigned user exists if provided
    if (leadData.assignedTo) {
      const user = await userRepository.findOne({ where: { id: leadData.assignedTo } });
      if (!user) {
        return res.status(400).json({ error: 'Assigned user not found' });
      }
      leadData.assignedToName = user.name || user.email;
    }

    const lead = leadRepository.create(leadData);
    const savedLead = await leadRepository.save(lead);

    // Fetch the saved lead with relations
    const fullLead = await leadRepository.findOne({
      where: { id: savedLead.id },
      relations: ['account', 'contact']
    });

    res.status(201).json(fullLead);
  } catch (error) {
    console.error('Error creating lead:', error);
    res.status(500).json({ error: 'Failed to create lead' });
  }
};

// Update a lead
export const updateLead = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const lead = await leadRepository.findOne({ where: { id } });

    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    // Update account name if accountId changed
    if (req.body.accountId && req.body.accountId !== lead.accountId) {
      const account = await accountRepository.findOne({ where: { id: req.body.accountId } });
      if (account) {
        req.body.accountName = account.name;
      }
    }

    // Update contact info if contactId changed
    if (req.body.contactId && req.body.contactId !== lead.contactId) {
      const contact = await contactRepository.findOne({ where: { id: req.body.contactId } });
      if (contact) {
        req.body.contactName = `${contact.firstName} ${contact.lastName}`.trim();
        req.body.contactEmail = contact.email;
        req.body.contactPhone = contact.phone;
      }
    }

    // Update assigned user name if assignedTo changed
    if (req.body.assignedTo && req.body.assignedTo !== lead.assignedTo) {
      const user = await userRepository.findOne({ where: { id: req.body.assignedTo } });
      if (user) {
        req.body.assignedToName = user.name || user.email;
      }
    }

    // Set closed date if status changed to Closed Won or Closed Lost
    if (req.body.status && ['Closed Won', 'Closed Lost'].includes(req.body.status)) {
      req.body.closedDate = new Date();
    }

    leadRepository.merge(lead, req.body);
    const updatedLead = await leadRepository.save(lead);

    // Fetch the updated lead with relations
    const fullLead = await leadRepository.findOne({
      where: { id: updatedLead.id },
      relations: ['account', 'contact']
    });

    res.json(fullLead);
  } catch (error) {
    console.error('Error updating lead:', error);
    res.status(500).json({ error: 'Failed to update lead' });
  }
};

// Delete a lead
export const deleteLead = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const lead = await leadRepository.findOne({ where: { id } });

    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    await leadRepository.remove(lead);
    res.json({ message: 'Lead deleted successfully' });
  } catch (error) {
    console.error('Error deleting lead:', error);
    res.status(500).json({ error: 'Failed to delete lead' });
  }
};

// Get lead statistics
export const getLeadStats = async (req: AuthRequest, res: Response) => {
  try {
    const stats = await leadRepository
      .createQueryBuilder('lead')
      .select([
        'lead.status as status',
        'lead.type as type',
        'lead.priority as priority',
        'COUNT(*) as count',
        'SUM(lead.estimatedValue) as totalEstimatedValue',
        'SUM(lead.actualValue) as totalActualValue'
      ])
      .groupBy('lead.status, lead.type, lead.priority')
      .getRawMany();

    // Calculate summary stats
    const summary = await leadRepository
      .createQueryBuilder('lead')
      .select([
        'COUNT(*) as totalLeads',
        'SUM(CASE WHEN lead.status IN (\'Closed Won\') THEN 1 ELSE 0 END) as wonLeads',
        'SUM(CASE WHEN lead.status IN (\'Closed Lost\') THEN 1 ELSE 0 END) as lostLeads',
        'SUM(lead.estimatedValue) as totalEstimatedValue',
        'SUM(lead.actualValue) as totalActualValue',
        'AVG(lead.probability) as averageProbability'
      ])
      .getRawOne();

    res.json({
      stats,
      summary
    });
  } catch (error) {
    console.error('Error fetching lead stats:', error);
    res.status(500).json({ error: 'Failed to fetch lead statistics' });
  }
};

// Add note to lead
export const addLeadNote = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    const lead = await leadRepository.findOne({ where: { id } });
    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    const note = {
      content,
      author: req.user?.name || req.user?.email || 'Unknown',
      timestamp: new Date()
    };

    lead.notes = [...(lead.notes || []), note];
    const updatedLead = await leadRepository.save(lead);

    res.json(updatedLead);
  } catch (error) {
    console.error('Error adding lead note:', error);
    res.status(500).json({ error: 'Failed to add note to lead' });
  }
};

// Add activity to lead
export const addLeadActivity = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { type, description, outcome } = req.body;

    const lead = await leadRepository.findOne({ where: { id } });
    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    const activity = {
      type,
      description,
      date: new Date(),
      outcome
    };

    lead.activities = [...(lead.activities || []), activity];
    const updatedLead = await leadRepository.save(lead);

    res.json(updatedLead);
  } catch (error) {
    console.error('Error adding lead activity:', error);
    res.status(500).json({ error: 'Failed to add activity to lead' });
  }
}; 