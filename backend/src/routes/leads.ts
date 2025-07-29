import { Router } from 'express';
import { 
  getLeads, 
  getLead, 
  createLead, 
  updateLead, 
  deleteLead, 
  getLeadStats,
  addLeadNote,
  addLeadActivity
} from '../controllers/leadController';
import { auth } from '../middleware/auth';

const router = Router();

// Apply authentication middleware to all routes
router.use(auth);

// Lead CRUD operations
router.get('/', getLeads);
router.get('/stats', getLeadStats);
router.get('/:id', getLead);
router.post('/', createLead);
router.put('/:id', updateLead);
router.delete('/:id', deleteLead);

// Lead notes and activities
router.post('/:id/notes', addLeadNote);
router.post('/:id/activities', addLeadActivity);

export default router; 