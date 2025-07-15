import { Router } from "express";
import {
  getAllTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
} from "../controllers/taskController";
// import { auth } from "../middleware/auth";

const router = Router();

// All routes require authentication
// router.use(auth);

// Task routes
router.get("/", getAllTasks);
router.get("/:id", getTaskById);
router.post("/", createTask);
router.patch("/:id", updateTask);
router.delete("/:id", deleteTask);

export default router; 