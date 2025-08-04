import { Router } from "express";
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
router.post("/login", portalLogin);
router.post("/setup", setupPortalAccess);

// Protected routes (require portal authentication)
router.use(portalAuth);

router.get("/tasks", getPortalTasks);
router.patch("/tasks/:taskId/status", updateTaskStatus);
router.post("/tasks/:taskId/comments", addTaskComment);
router.get("/tasks/:taskId/comments", getTaskComments);

export default router;