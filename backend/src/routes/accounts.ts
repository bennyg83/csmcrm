import { Router } from "express";
import {
  getAllAccounts,
  getAccountById,
  createAccount,
  updateAccount,
  deleteAccount,
  getRecentActivities,
  bulkUpdateAccounts,
  bulkDeleteAccounts,
  bulkExportAccounts,
  bulkImportAccounts,
} from "../controllers/accountController";
import { auth } from "../middleware/auth";
import { requirePermission } from "../middleware/rbac";

const router = Router();

// All routes require authentication
router.use(auth);

// Account routes - Read operations (require accounts.read permission)
router.get("/", requirePermission("accounts.read"), getAllAccounts);
router.get("/recent-activities", requirePermission("accounts.read"), getRecentActivities);
router.get("/:id", requirePermission("accounts.read"), getAccountById);

// Account routes - Write operations (require accounts.write permission)
router.post("/", requirePermission("accounts.write"), createAccount);
router.patch("/:id", requirePermission("accounts.write"), updateAccount);
router.delete("/:id", requirePermission("accounts.write"), deleteAccount);

// Bulk operations - Write operations (require accounts.write permission)
router.post("/bulk/update", requirePermission("accounts.write"), bulkUpdateAccounts);
router.post("/bulk/delete", requirePermission("accounts.write"), bulkDeleteAccounts);
router.post("/bulk/export", requirePermission("accounts.read"), bulkExportAccounts);
router.post("/bulk/import", requirePermission("accounts.write"), bulkImportAccounts);

export default router; 