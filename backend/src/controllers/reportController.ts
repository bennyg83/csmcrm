import { Response } from 'express';
import { AppDataSource } from '../config/data-source';
import { Report } from '../entities/Report';
import { Account } from '../entities/Account';
import { Contact } from '../entities/Contact';
import { Task } from '../entities/Task';
import { Lead } from '../entities/Lead';
import { User } from '../entities/User';
import { AuthRequest } from '../middleware/auth';

const reportRepository = AppDataSource.getRepository(Report);
const accountRepository = AppDataSource.getRepository(Account);
const contactRepository = AppDataSource.getRepository(Contact);
const taskRepository = AppDataSource.getRepository(Task);
const leadRepository = AppDataSource.getRepository(Lead);
const userRepository = AppDataSource.getRepository(User);

// Get all reports
export const getReports = async (req: AuthRequest, res: Response) => {
  try {
    const reports = await reportRepository.find({
      order: { createdAt: 'DESC' }
    });

    res.json(reports);
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
};

// Get a single report by ID
export const getReport = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const report = await reportRepository.findOne({ where: { id } });

    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    res.json(report);
  } catch (error) {
    console.error('Error fetching report:', error);
    res.status(500).json({ error: 'Failed to fetch report' });
  }
};

// Create a new report
export const createReport = async (req: AuthRequest, res: Response) => {
  try {
    const reportData = {
      ...req.body,
      createdBy: req.user?.id,
      createdByName: req.user?.name || req.user?.email
    };

    const report = reportRepository.create(reportData);
    const savedReport = await reportRepository.save(report);

    res.status(201).json(savedReport);
  } catch (error) {
    console.error('Error creating report:', error);
    res.status(500).json({ error: 'Failed to create report' });
  }
};

// Update a report
export const updateReport = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const report = await reportRepository.findOne({ where: { id } });

    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    reportRepository.merge(report, req.body);
    const updatedReport = await reportRepository.save(report);

    res.json(updatedReport);
  } catch (error) {
    console.error('Error updating report:', error);
    res.status(500).json({ error: 'Failed to update report' });
  }
};

// Delete a report
export const deleteReport = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const report = await reportRepository.findOne({ where: { id } });

    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    await reportRepository.remove(report);
    res.json({ message: 'Report deleted successfully' });
  } catch (error) {
    console.error('Error deleting report:', error);
    res.status(500).json({ error: 'Failed to delete report' });
  }
};

// Execute a report and return data
export const executeReport = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const report = await reportRepository.findOne({ where: { id } });

    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    // Update view count and last viewed
    report.viewCount += 1;
    report.lastViewed = new Date();
    await reportRepository.save(report);

    // Execute report based on type
    let data;
    switch (report.reportType) {
      case 'Account':
        data = await executeAccountReport(report);
        break;
      case 'Contact':
        data = await executeContactReport(report);
        break;
      case 'Task':
        data = await executeTaskReport(report);
        break;
      case 'Lead':
        data = await executeLeadReport(report);
        break;
      case 'User':
        data = await executeUserReport(report);
        break;
      case 'Revenue':
        data = await executeRevenueReport(report);
        break;
      case 'Health Score':
        data = await executeHealthScoreReport(report);
        break;
      default:
        return res.status(400).json({ error: 'Invalid report type' });
    }

    res.json({
      report,
      data,
      executedAt: new Date()
    });
  } catch (error) {
    console.error('Error executing report:', error);
    res.status(500).json({ error: 'Failed to execute report' });
  }
};

// Execute account report
async function executeAccountReport(report: Report) {
  const queryBuilder = accountRepository.createQueryBuilder('account');

  // Apply filters
  if (report.filters) {
    for (const filter of report.filters) {
      switch (filter.operator) {
        case 'equals':
          queryBuilder.andWhere(`account.${filter.field} = :${filter.field}`, { [filter.field]: filter.value });
          break;
        case 'contains':
          queryBuilder.andWhere(`account.${filter.field} ILIKE :${filter.field}`, { [filter.field]: `%${filter.value}%` });
          break;
        case 'greater_than':
          queryBuilder.andWhere(`account.${filter.field} > :${filter.field}`, { [filter.field]: filter.value });
          break;
        case 'less_than':
          queryBuilder.andWhere(`account.${filter.field} < :${filter.field}`, { [filter.field]: filter.value });
          break;
      }
    }
  }

  // Apply sorting
  if (report.sortBy && report.sortBy.length > 0) {
    for (const sort of report.sortBy) {
      queryBuilder.addOrderBy(`account.${sort.field}`, sort.direction.toUpperCase() as 'ASC' | 'DESC');
    }
  }

  return await queryBuilder.getMany();
}

// Execute contact report
async function executeContactReport(report: Report) {
  const queryBuilder = contactRepository.createQueryBuilder('contact')
    .leftJoinAndSelect('contact.account', 'account');

  // Apply filters
  if (report.filters) {
    for (const filter of report.filters) {
      switch (filter.operator) {
        case 'equals':
          queryBuilder.andWhere(`contact.${filter.field} = :${filter.field}`, { [filter.field]: filter.value });
          break;
        case 'contains':
          queryBuilder.andWhere(`contact.${filter.field} ILIKE :${filter.field}`, { [filter.field]: `%${filter.value}%` });
          break;
      }
    }
  }

  return await queryBuilder.getMany();
}

// Execute task report
async function executeTaskReport(report: Report) {
  const queryBuilder = taskRepository.createQueryBuilder('task')
    .leftJoinAndSelect('task.account', 'account');

  // Apply filters
  if (report.filters) {
    for (const filter of report.filters) {
      switch (filter.operator) {
        case 'equals':
          queryBuilder.andWhere(`task.${filter.field} = :${filter.field}`, { [filter.field]: filter.value });
          break;
        case 'contains':
          queryBuilder.andWhere(`task.${filter.field} ILIKE :${filter.field}`, { [filter.field]: `%${filter.value}%` });
          break;
      }
    }
  }

  return await queryBuilder.getMany();
}

// Execute lead report
async function executeLeadReport(report: Report) {
  const queryBuilder = leadRepository.createQueryBuilder('lead')
    .leftJoinAndSelect('lead.account', 'account')
    .leftJoinAndSelect('lead.contact', 'contact');

  // Apply filters
  if (report.filters) {
    for (const filter of report.filters) {
      switch (filter.operator) {
        case 'equals':
          queryBuilder.andWhere(`lead.${filter.field} = :${filter.field}`, { [filter.field]: filter.value });
          break;
        case 'contains':
          queryBuilder.andWhere(`lead.${filter.field} ILIKE :${filter.field}`, { [filter.field]: `%${filter.value}%` });
          break;
      }
    }
  }

  return await queryBuilder.getMany();
}

// Execute user report
async function executeUserReport(report: Report) {
  const queryBuilder = userRepository.createQueryBuilder('user');

  // Apply filters
  if (report.filters) {
    for (const filter of report.filters) {
      switch (filter.operator) {
        case 'equals':
          queryBuilder.andWhere(`user.${filter.field} = :${filter.field}`, { [filter.field]: filter.value });
          break;
        case 'contains':
          queryBuilder.andWhere(`user.${filter.field} ILIKE :${filter.field}`, { [filter.field]: `%${filter.value}%` });
          break;
      }
    }
  }

  return await queryBuilder.getMany();
}

// Execute revenue report
async function executeRevenueReport(report: Report) {
  const queryBuilder = accountRepository.createQueryBuilder('account')
    .select([
      'account.name',
      'account.revenue',
      'account.arr',
      'account.health',
      'account.renewalDate'
    ]);

  // Apply filters
  if (report.filters) {
    for (const filter of report.filters) {
      switch (filter.operator) {
        case 'greater_than':
          queryBuilder.andWhere(`account.${filter.field} > :${filter.field}`, { [filter.field]: filter.value });
          break;
        case 'less_than':
          queryBuilder.andWhere(`account.${filter.field} < :${filter.field}`, { [filter.field]: filter.value });
          break;
      }
    }
  }

  return await queryBuilder.getMany();
}

// Execute health score report
async function executeHealthScoreReport(report: Report) {
  const queryBuilder = accountRepository.createQueryBuilder('account')
    .select([
      'account.name',
      'account.health',
      'account.riskScore',
      'account.lastTouchpoint',
      'account.nextScheduled'
    ]);

  // Apply filters
  if (report.filters) {
    for (const filter of report.filters) {
      switch (filter.operator) {
        case 'greater_than':
          queryBuilder.andWhere(`account.${filter.field} > :${filter.field}`, { [filter.field]: filter.value });
          break;
        case 'less_than':
          queryBuilder.andWhere(`account.${filter.field} < :${filter.field}`, { [filter.field]: filter.value });
          break;
      }
    }
  }

  return await queryBuilder.getMany();
}

// Get report templates
export const getReportTemplates = async (req: AuthRequest, res: Response) => {
  try {
    const templates = [
      {
        name: 'Account Health Overview',
        description: 'Overview of account health scores and risk levels',
        reportType: 'Health Score',
        displayType: 'Chart',
        columns: [
          { field: 'name', label: 'Account Name', type: 'string', sortable: true, filterable: true },
          { field: 'health', label: 'Health Score', type: 'number', sortable: true, filterable: true },
          { field: 'riskScore', label: 'Risk Score', type: 'number', sortable: true, filterable: true }
        ],
        chartConfig: {
          type: 'bar',
          xAxis: 'name',
          yAxis: 'health'
        }
      },
      {
        name: 'Revenue Pipeline',
        description: 'Revenue analysis by account and ARR',
        reportType: 'Revenue',
        displayType: 'Chart',
        columns: [
          { field: 'name', label: 'Account Name', type: 'string', sortable: true, filterable: true },
          { field: 'revenue', label: 'Revenue', type: 'number', sortable: true, filterable: true },
          { field: 'arr', label: 'ARR', type: 'number', sortable: true, filterable: true }
        ],
        chartConfig: {
          type: 'pie',
          xAxis: 'name',
          yAxis: 'revenue'
        }
      },
      {
        name: 'Lead Conversion',
        description: 'Lead status and conversion rates',
        reportType: 'Lead',
        displayType: 'Table',
        columns: [
          { field: 'title', label: 'Lead Title', type: 'string', sortable: true, filterable: true },
          { field: 'status', label: 'Status', type: 'string', sortable: true, filterable: true },
          { field: 'estimatedValue', label: 'Estimated Value', type: 'number', sortable: true, filterable: true },
          { field: 'probability', label: 'Probability', type: 'number', sortable: true, filterable: true }
        ]
      }
    ];

    res.json(templates);
  } catch (error) {
    console.error('Error fetching report templates:', error);
    res.status(500).json({ error: 'Failed to fetch report templates' });
  }
}; 