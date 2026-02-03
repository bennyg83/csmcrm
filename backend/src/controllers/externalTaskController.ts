import { Request, Response } from 'express';
import { Repository } from 'typeorm';
import { AppDataSource } from '../config/data-source';
import { Task } from '../entities/Task';
import { ExternalUser } from '../entities/ExternalUser';
import { Account } from '../entities/Account';

export class ExternalTaskController {
  private taskRepository: Repository<Task>;
  private externalUserRepository: Repository<ExternalUser>;
  private accountRepository: Repository<Account>;

  constructor() {
    this.taskRepository = AppDataSource.getRepository(Task);
    this.externalUserRepository = AppDataSource.getRepository(ExternalUser);
    this.accountRepository = AppDataSource.getRepository(Account);
  }

  // Get tasks assigned to external user
  async getMyTasks(req: Request, res: Response) {
    try {
      const userId = (req as any).user.userId;
      const { status, priority, search } = req.query;

      // Get external user with account info
      const externalUser = await this.externalUserRepository.findOne({
        where: { id: userId },
        relations: ['account', 'contact']
      });

      if (!externalUser) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Build query for tasks assigned to this user's contact
      const queryBuilder = this.taskRepository
        .createQueryBuilder('task')
        .leftJoinAndSelect('task.account', 'account')
        .leftJoinAndSelect('task.category', 'category')
        .where('task.accountId = :accountId', { accountId: externalUser.accountId });

      // Get all tasks for the account first
      let allTasks = await queryBuilder.getMany();

      // If user has a contact, filter tasks assigned to that contact
      if (externalUser.contact) {
        const contactName = `${externalUser.contact.firstName} ${externalUser.contact.lastName}`;
        const contactId = externalUser.contact.id;
        allTasks = allTasks.filter(task => {
          if (!task.assignedToClient || !Array.isArray(task.assignedToClient)) return false;
          // Check if task is assigned to this contact by name or ID
          return task.assignedToClient.includes(contactName) || task.assignedToClient.includes(contactId);
        });
      }

      // Apply additional filters
      let filteredTasks = allTasks;
      if (status) {
        filteredTasks = filteredTasks.filter(t => t.status === status);
      }

      if (priority) {
        filteredTasks = filteredTasks.filter(t => t.priority === priority);
      }

      if (search && typeof search === 'string') {
        filteredTasks = filteredTasks.filter(t => 
          t.title.toLowerCase().includes(search.toLowerCase()) ||
          t.description.toLowerCase().includes(search.toLowerCase())
        );
      }

      // Sort by due date and priority
      filteredTasks.sort((a, b) => {
        if (a.dueDate && b.dueDate) {
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        }
        return 0;
      });

      // Sort by priority (High > Medium > Low)
      const priorityOrder = { 'High': 3, 'Medium': 2, 'Low': 1 };
      filteredTasks.sort((a, b) => {
        return (priorityOrder[b.priority as keyof typeof priorityOrder] || 0) - (priorityOrder[a.priority as keyof typeof priorityOrder] || 0);
      });

      res.json(filteredTasks.map(task => ({
        id: task.id,
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate,
        progress: task.progress,
        category: task.category?.name,
        accountName: task.account?.name,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt
      })));
    } catch (error) {
      console.error('Get my tasks error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Get task details
  async getTaskDetails(req: Request, res: Response) {
    try {
      const userId = (req as any).user.userId;
      const { taskId } = req.params;

      // Task entity has "comments" (TaskComment), not "notes"
      const task = await this.taskRepository.findOne({
        where: { id: taskId },
        relations: ['account', 'category', 'comments']
      });

      if (!task) {
        return res.status(404).json({ error: 'Task not found' });
      }

      // Verify user has access to this task
      if (!task.assignedToClient?.includes(userId)) {
        return res.status(403).json({ error: 'Access denied' });
      }

      res.json({
        id: task.id,
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate,
        progress: task.progress,
        category: task.category?.name,
        accountName: task.account?.name,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt
      });
    } catch (error) {
      console.error('Get task details error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Update task progress/status
  async updateTask(req: Request, res: Response) {
    try {
      const userId = (req as any).user.userId;
      const { taskId } = req.params;
      const { status, progress, notes } = req.body;

      const task = await this.taskRepository.findOne({
        where: { id: taskId }
      });

      if (!task) {
        return res.status(404).json({ error: 'Task not found' });
      }

      // Verify user has access to this task
      if (!task.assignedToClient?.includes(userId)) {
        return res.status(403).json({ error: 'Access denied' });
      }

      // Only allow certain fields to be updated by external users
      if (status) {
        // External users can only set status to 'In Progress', 'Completed', or 'Cancelled'
        const allowedStatuses = ['In Progress', 'Completed', 'Cancelled'];
        if (!allowedStatuses.includes(status)) {
          return res.status(400).json({ error: 'Invalid status for external users' });
        }
        task.status = status;
      }

      if (progress !== undefined) {
        task.progress = Math.max(0, Math.min(100, progress));
      }

      // Add note if provided
      if (notes) {
        // Create a new note for the task
        const noteRepository = AppDataSource.getRepository('Note');
        const note = noteRepository.create({
          content: notes,
          taskId: task.id,
          createdBy: `External User: ${userId}`,
          accountId: task.accountId
        });
        await noteRepository.save(note);
      }

      await this.taskRepository.save(task);

      res.json({
        message: 'Task updated successfully',
        task: {
          id: task.id,
          status: task.status,
          progress: task.progress,
          updatedAt: task.updatedAt
        }
      });
    } catch (error) {
      console.error('Update task error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Get task statistics for external user
  async getTaskStats(req: Request, res: Response) {
    try {
      const userId = (req as any).user.userId;

      // Get external user with account info
      const externalUser = await this.externalUserRepository.findOne({
        where: { id: userId },
        relations: ['contact']
      });

      if (!externalUser) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Build query for tasks assigned to this user's contact
      let tasks: any[] = [];
      if (externalUser.contact) {
        const contactName = `${externalUser.contact.firstName} ${externalUser.contact.lastName}`;
        const contactId = externalUser.contact.id;
        // Get all tasks for the account and filter in memory
        const allTasks = await this.taskRepository.find({
          where: {
            accountId: externalUser.accountId
          }
        });
        
        // Filter tasks that are assigned to this contact
        tasks = allTasks.filter(task => {
          if (!task.assignedToClient || !Array.isArray(task.assignedToClient)) return false;
          // Check if task is assigned to this contact by name or ID
          return task.assignedToClient.includes(contactName) || task.assignedToClient.includes(contactId);
        });
      }

      // Calculate statistics
      const totalTasks = tasks.length;
      const completedTasks = tasks.filter(t => t.status === 'Completed').length;
      const inProgressTasks = tasks.filter(t => t.status === 'In Progress').length;
      const overdueTasks = tasks.filter(t => {
        if (t.status === 'Completed') return false;
        return t.dueDate && new Date(t.dueDate) < new Date();
      }).length;

      const averageProgress = totalTasks > 0 
        ? Math.round(tasks.reduce((sum, t) => sum + (t.progress || 0), 0) / totalTasks)
        : 0;

      res.json({
        totalTasks,
        completedTasks,
        inProgressTasks,
        overdueTasks,
        averageProgress,
        completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
      });
    } catch (error) {
      console.error('Get task stats error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Get account overview for external user
  async getAccountOverview(req: Request, res: Response) {
    try {
      const userId = (req as any).user.userId;

      // Get external user with account info
      const externalUser = await this.externalUserRepository.findOne({
        where: { id: userId },
        relations: ['account', 'contact']
      });

      if (!externalUser) {
        return res.status(404).json({ error: 'User not found' });
      }

      const account = externalUser.account;
      if (!account) {
        return res.status(404).json({ error: 'Account not found' });
      }

      // Get recent tasks assigned to this user's contact
      let recentTasks: any[] = [];
      if (externalUser.contact) {
        const contactName = `${externalUser.contact.firstName} ${externalUser.contact.lastName}`;
        const contactId = externalUser.contact.id;
        // Use a simpler approach - get all tasks for the account and filter in memory
        const allTasks = await this.taskRepository.find({
          where: {
            accountId: account.id
          },
          order: { updatedAt: 'DESC' },
          take: 20
        });
        
        // Filter tasks that are assigned to this contact
        recentTasks = allTasks.filter(task => {
          if (!task.assignedToClient || !Array.isArray(task.assignedToClient)) return false;
          // Check if task is assigned to this contact by name or ID
          return task.assignedToClient.includes(contactName) || task.assignedToClient.includes(contactId);
        }).slice(0, 5);
      }

      res.json({
        account: {
          id: account.id,
          name: account.name,
          industry: account.industry,
          status: account.status,
          health: account.health,
          renewalDate: account.renewalDate
        },
        recentTasks: recentTasks.map(task => ({
          id: task.id,
          title: task.title,
          status: task.status,
          priority: task.priority,
          dueDate: task.dueDate,
          progress: task.progress
        }))
      });
    } catch (error) {
      console.error('Get account overview error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}
