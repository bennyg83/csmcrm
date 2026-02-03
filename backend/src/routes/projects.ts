import { Router } from "express";
import {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
} from "../controllers/projectController";
import {
  getMilestonesByProject,
  createMilestone,
} from "../controllers/milestoneController";
import {
  getProjectContacts,
  addProjectContact,
} from "../controllers/projectContactController";
import { auth } from "../middleware/auth";

const router = Router();

router.use(auth);

// More specific routes first
router.get("/:projectId/milestones", getMilestonesByProject);
router.post("/:projectId/milestones", createMilestone);
router.get("/:projectId/contacts", getProjectContacts);
router.post("/:projectId/contacts", addProjectContact);

// Project CRUD
router.get("/", getProjects);
router.post("/", createProject);
router.get("/:id", getProjectById);
router.patch("/:id", updateProject);
router.delete("/:id", deleteProject);

export default router;
