import { Router } from "express";
import rateLimit from "express-rate-limit";
import { 
  portalLogin, 
  setupPortalAccess, 
  getPortalTasks, 
  updateTaskStatus,
  addTaskComment,
  getTaskComments
} from "../controllers/portalAuthController";
import { portalAuth } from "../middleware/portalAuth";

const router = Router();

// Public routes (no authentication required)
const portalLoginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100, standardHeaders: true, legacyHeaders: false });
router.post("/login", portalLoginLimiter, portalLogin);
router.post("/setup", setupPortalAccess);

// Protected routes (require portal authentication)
router.use(portalAuth);

router.get("/tasks", getPortalTasks);
router.patch("/tasks/:taskId/status", updateTaskStatus);
router.post("/tasks/:taskId/comments", addTaskComment);
router.get("/tasks/:taskId/comments", getTaskComments);

export default router;