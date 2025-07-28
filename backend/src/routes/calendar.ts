import { Router } from 'express';
import { 
  getCalendarEvents,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
  getCalendarList,
  checkCalendarConnection
} from '../controllers/calendarController';
import { auth } from '../middleware/auth';

const router = Router();

// All calendar routes require authentication
router.use(auth);

// Check calendar connection status
router.get('/status', checkCalendarConnection);

// Get user's calendar list
router.get('/calendars', getCalendarList);

// Get calendar events
router.get('/events', getCalendarEvents);

// Create new calendar event
router.post('/events', createCalendarEvent);

// Update calendar event
router.put('/events/:eventId', updateCalendarEvent);

// Delete calendar event
router.delete('/events/:eventId', deleteCalendarEvent);

export default router; 