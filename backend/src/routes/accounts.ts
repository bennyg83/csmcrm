import { Router } from "express";
import {
  getAllAccounts,
  getAccountById,
  createAccount,
  updateAccount,
  deleteAccount,
  getRecentActivities,
} from "../controllers/accountController";
// import { auth } from "../middleware/auth";

const router = Router();

// All routes require authentication
// router.use(auth);

// Account routes
router.get("/", getAllAccounts);
router.get("/recent-activities", getRecentActivities);
router.get("/:id", getAccountById);
router.post("/", createAccount);
router.patch("/:id", updateAccount);
router.delete("/:id", deleteAccount);

export default router; 