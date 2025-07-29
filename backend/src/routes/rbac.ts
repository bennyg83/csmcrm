import express from "express";
import {
  getAllRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
  getAllPermissions,
  createPermission,
  assignRoleToUser,
  getUserPermissions,
  initializeSystemRBAC
} from "../controllers/rbacController";
import { auth } from "../middleware/auth";
import { requireAdmin } from "../middleware/rbac";

const router = express.Router();

// Role management routes (Admin only)
router.get("/roles", auth, requireAdmin, getAllRoles);
router.get("/roles/:id", auth, requireAdmin, getRoleById);
router.post("/roles", auth, requireAdmin, createRole);
router.put("/roles/:id", auth, requireAdmin, updateRole);
router.delete("/roles/:id", auth, requireAdmin, deleteRole);

// Permission management routes (Admin only)
router.get("/permissions", auth, requireAdmin, getAllPermissions);
router.post("/permissions", auth, requireAdmin, createPermission);

// User role assignment (Admin only)
router.post("/assign-role", auth, requireAdmin, assignRoleToUser);

// Get current user permissions (Authenticated users)
router.get("/my-permissions", auth, getUserPermissions);

// Initialize system RBAC (Admin only)
router.post("/initialize", auth, requireAdmin, initializeSystemRBAC);

export default router; 