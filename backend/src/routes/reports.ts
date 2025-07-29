import { Router } from 'express';
import { 
  getReports, 
  getReport, 
  createReport, 
  updateReport, 
  deleteReport, 
  executeReport,
  getReportTemplates
} from '../controllers/reportController';
import { auth } from '../middleware/auth';

const router = Router();

// Apply authentication middleware to all routes
router.use(auth);

// Report CRUD operations
router.get('/', getReports);
router.get('/templates', getReportTemplates);
router.get('/:id', getReport);
router.post('/', createReport);
router.put('/:id', updateReport);
router.delete('/:id', deleteReport);

// Report execution
router.post('/:id/execute', executeReport);

export default router; 