import express from "express";
import {
  getAllHealthScores,
  getHealthScoreById,
  createHealthScore,
  updateHealthScore,
  deleteHealthScore
} from "../controllers/healthScoreController";

const router = express.Router();

// Get all health scores
router.get("/", getAllHealthScores);

// Get health score by ID
router.get("/:id", getHealthScoreById);

// Create health score for an account
router.post("/accounts/:accountId/health-scores", createHealthScore);

// Update health score
router.patch("/:id", updateHealthScore);

// Delete health score
router.delete("/:id", deleteHealthScore);

export default router; 