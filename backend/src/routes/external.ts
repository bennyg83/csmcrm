import { Router } from 'express';
import { ExternalAuthController } from '../controllers/externalAuthController';
import { ExternalTaskController } from '../controllers/externalTaskController';
import { authenticateExternalUser, authenticateUser } from '../middleware/auth';

const router = Router();
const externalAuthController = new ExternalAuthController();
const externalTaskController = new ExternalTaskController();

// Public routes (no authentication required)
router.post('/auth/register', externalAuthController.registerExternalUser.bind(externalAuthController));
router.post('/auth/login', externalAuthController.login.bind(externalAuthController));
router.post('/auth/forgot-password', externalAuthController.requestPasswordReset.bind(externalAuthController));
router.post('/auth/reset-password', externalAuthController.resetPassword.bind(externalAuthController));

// Admin routes for creating external users (requires internal user authentication)
router.post('/auth/create-user', authenticateUser, externalAuthController.createExternalUser.bind(externalAuthController));
router.get('/auth/users/:accountId', authenticateUser, externalAuthController.getAccountExternalUsers.bind(externalAuthController));
router.delete('/auth/users/:userId', authenticateUser, externalAuthController.revokeExternalUser.bind(externalAuthController));

// Protected routes (authentication required)
router.use(authenticateExternalUser);

// User profile routes
router.get('/auth/profile', externalAuthController.getProfile.bind(externalAuthController));
router.put('/auth/profile', externalAuthController.updateProfile.bind(externalAuthController));
router.put('/auth/change-password', externalAuthController.changePassword.bind(externalAuthController));

// Task management routes
router.get('/tasks', externalTaskController.getMyTasks.bind(externalTaskController));
router.get('/tasks/:taskId', externalTaskController.getTaskDetails.bind(externalTaskController));
router.put('/tasks/:taskId', externalTaskController.updateTask.bind(externalTaskController));
router.get('/tasks/stats', externalTaskController.getTaskStats.bind(externalTaskController));

// Account overview routes
router.get('/account/overview', externalTaskController.getAccountOverview.bind(externalTaskController));

export default router;
