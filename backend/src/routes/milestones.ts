import { Router } from "express";
import {
  getMilestoneById,
  updateMilestone,
  deleteMilestone,
} from "../controllers/milestoneController";
import { auth } from "../middleware/auth";

const router = Router();

router.use(auth);

router.get("/:id", getMilestoneById);
router.patch("/:id", updateMilestone);
router.delete("/:id", deleteMilestone);

export default router;
