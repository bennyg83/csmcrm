import { Router } from 'express';
import { 
  getWorkflows, 
  getWorkflow, 
  createWorkflow, 
  updateWorkflow, 
  deleteWorkflow, 
  toggleWorkflow,
  getWorkflowStats,
  testWorkflow
} from '../controllers/workflowController';
import { auth } from '../middleware/auth';

const router = Router();

// Apply authentication middleware to all routes
router.use(auth);

// Workflow CRUD operations
router.get('/', getWorkflows);
router.get('/stats', getWorkflowStats);
router.get('/:id', getWorkflow);
router.post('/', createWorkflow);
router.put('/:id', updateWorkflow);
router.delete('/:id', deleteWorkflow);

// Workflow management
router.patch('/:id/toggle', toggleWorkflow);
router.post('/:id/test', testWorkflow);

export default router; 