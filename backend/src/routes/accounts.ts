import { Router } from "express";
import { z } from "zod";
import { validate } from "../middleware/validate";
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
import { getAllNotes, createNote } from "../controllers/noteController";
import { auth } from "../middleware/auth";
import { requirePermission } from "../middleware/rbac";

const router = Router();

// All routes require authentication
router.use(auth);

// Account routes - Read operations (require accounts.read permission)
router.get("/", requirePermission("accounts.read"), getAllAccounts);
router.get("/recent-activities", requirePermission("accounts.read"), getRecentActivities);
// Account notes – so frontend can call GET/POST /api/accounts/:accountId/notes (Log call, etc.)
router.get("/:accountId/notes", requirePermission("accounts.read"), (req, res, next) => {
  req.query = { ...req.query, accountId: req.params.accountId };
  getAllNotes(req, res, next);
});
router.post("/:accountId/notes", requirePermission("accounts.write"), createNote);
router.get("/:id", requirePermission("accounts.read"), getAccountById);

// Account routes - Write operations (require accounts.write permission)
const createAccountSchema = z.object({
  name: z.string().min(1),
  status: z.string().optional(),
  health: z.number().min(0).max(100).optional(),
});

const updateAccountSchema = z.object({
  name: z.string().min(1).optional(),
  status: z.string().optional(),
  health: z.number().min(0).max(100).optional(),
});

router.post("/", requirePermission("accounts.write"), validate(createAccountSchema), createAccount);
router.patch("/:id", requirePermission("accounts.write"), validate(updateAccountSchema), updateAccount);
router.delete("/:id", requirePermission("accounts.write"), deleteAccount);

// Bulk operations - Write operations (require accounts.write permission)
router.post("/bulk/update", requirePermission("accounts.write"), bulkUpdateAccounts);
router.post("/bulk/delete", requirePermission("accounts.write"), bulkDeleteAccounts);
router.post("/bulk/export", requirePermission("accounts.read"), bulkExportAccounts);
router.post("/bulk/import", requirePermission("accounts.write"), bulkImportAccounts);

export default router; 