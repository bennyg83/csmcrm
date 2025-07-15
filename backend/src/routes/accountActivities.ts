import express from "express";
import {
  getAllAccountActivities,
  getAccountActivityById,
  createAccountActivity,
  updateAccountActivity,
  deleteAccountActivity
} from "../controllers/accountActivityController";

const router = express.Router();

// Get all account activities
router.get("/", getAllAccountActivities);

// Get account activity by ID
router.get("/:id", getAccountActivityById);

// Create account activity for an account
router.post("/accounts/:accountId/activities", createAccountActivity);

// Update account activity
router.patch("/:id", updateAccountActivity);

// Delete account activity
router.delete("/:id", deleteAccountActivity);

export default router; 