import express from "express";
import {
  getAllAccountTiers,
  getAccountTierById,
  createAccountTier,
  updateAccountTier,
  deleteAccountTier
} from "../controllers/accountTierController";

const router = express.Router();

// Get all account tiers
router.get("/", getAllAccountTiers);

// Get account tier by ID
router.get("/:id", getAccountTierById);

// Create account tier
router.post("/", createAccountTier);

// Update account tier
router.patch("/:id", updateAccountTier);

// Delete account tier
router.delete("/:id", deleteAccountTier);

export default router; 