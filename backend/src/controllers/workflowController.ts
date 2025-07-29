import { Response } from 'express';
import { AppDataSource } from '../config/data-source';
import { Workflow } from '../entities/Workflow';
import { AuthRequest } from '../middleware/auth';

const workflowRepository = AppDataSource.getRepository(Workflow);

// Get all workflows
export const getWorkflows = async (req: AuthRequest, res: Response) => {
  try {
    const workflows = await workflowRepository.find({
      order: { priority: 'DESC', createdAt: 'DESC' }
    });

    res.json(workflows);
  } catch (error) {
    console.error('Error fetching workflows:', error);
    res.status(500).json({ error: 'Failed to fetch workflows' });
  }
};

// Get a single workflow by ID
export const getWorkflow = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const workflow = await workflowRepository.findOne({ where: { id } });

    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' });
    }

    res.json(workflow);
  } catch (error) {
    console.error('Error fetching workflow:', error);
    res.status(500).json({ error: 'Failed to fetch workflow' });
  }
};

// Create a new workflow
export const createWorkflow = async (req: AuthRequest, res: Response) => {
  try {
    const workflowData = {
      ...req.body,
      createdBy: req.user?.id,
      createdByName: req.user?.name || req.user?.email
    };

    const workflow = workflowRepository.create(workflowData);
    const savedWorkflow = await workflowRepository.save(workflow);

    res.status(201).json(savedWorkflow);
  } catch (error) {
    console.error('Error creating workflow:', error);
    res.status(500).json({ error: 'Failed to create workflow' });
  }
};

// Update a workflow
export const updateWorkflow = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const workflow = await workflowRepository.findOne({ where: { id } });

    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' });
    }

    workflowRepository.merge(workflow, req.body);
    const updatedWorkflow = await workflowRepository.save(workflow);

    res.json(updatedWorkflow);
  } catch (error) {
    console.error('Error updating workflow:', error);
    res.status(500).json({ error: 'Failed to update workflow' });
  }
};

// Delete a workflow
export const deleteWorkflow = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const workflow = await workflowRepository.findOne({ where: { id } });

    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' });
    }

    await workflowRepository.remove(workflow);
    res.json({ message: 'Workflow deleted successfully' });
  } catch (error) {
    console.error('Error deleting workflow:', error);
    res.status(500).json({ error: 'Failed to delete workflow' });
  }
};

// Toggle workflow status
export const toggleWorkflow = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const workflow = await workflowRepository.findOne({ where: { id } });

    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' });
    }

    workflow.isEnabled = !workflow.isEnabled;
    const updatedWorkflow = await workflowRepository.save(workflow);

    res.json(updatedWorkflow);
  } catch (error) {
    console.error('Error toggling workflow:', error);
    res.status(500).json({ error: 'Failed to toggle workflow' });
  }
};

// Get workflow statistics
export const getWorkflowStats = async (req: AuthRequest, res: Response) => {
  try {
    const stats = await workflowRepository
      .createQueryBuilder('workflow')
      .select([
        'workflow.status as status',
        'workflow.triggerType as triggerType',
        'COUNT(*) as count',
        'SUM(CASE WHEN workflow.isEnabled = true THEN 1 ELSE 0 END) as enabledCount'
      ])
      .groupBy('workflow.status, workflow.triggerType')
      .getRawMany();

    // Calculate summary stats
    const summary = await workflowRepository
      .createQueryBuilder('workflow')
      .select([
        'COUNT(*) as totalWorkflows',
        'SUM(CASE WHEN workflow.isEnabled = true THEN 1 ELSE 0 END) as enabledWorkflows',
        'SUM(workflow.executionCount) as totalExecutions',
        'AVG(workflow.executionCount) as averageExecutions'
      ])
      .getRawOne();

    res.json({
      stats,
      summary
    });
  } catch (error) {
    console.error('Error fetching workflow stats:', error);
    res.status(500).json({ error: 'Failed to fetch workflow statistics' });
  }
};

// Test workflow execution
export const testWorkflow = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const workflow = await workflowRepository.findOne({ where: { id } });

    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' });
    }

    // Simulate workflow execution
    const testResult = {
      workflowId: workflow.id,
      workflowName: workflow.name,
      triggerType: workflow.triggerType,
      conditions: workflow.conditions,
      actions: workflow.actions,
      executionTime: new Date(),
      result: 'success',
      message: 'Workflow test executed successfully'
    };

    // Update execution count
    workflow.executionCount += 1;
    workflow.lastExecuted = new Date();
    await workflowRepository.save(workflow);

    res.json(testResult);
  } catch (error) {
    console.error('Error testing workflow:', error);
    res.status(500).json({ error: 'Failed to test workflow' });
  }
}; 