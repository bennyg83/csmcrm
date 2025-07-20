import { Router } from "express";
import { 
  login, 
  logout, 
  getMe, 
  getAllUsers, 
  createUser, 
  updateUser, 
  deleteUser 
} from "../controllers/authController";
import { auth, adminOnly } from "../middleware/auth";

const router = Router();

// Auth routes
router.post("/login", login);
router.post("/logout", logout);
router.get("/me", auth, getMe);

// User management routes (Admin only)
router.get("/users", auth, adminOnly, getAllUsers);
router.post("/users", auth, adminOnly, createUser);
router.put("/users/:userId", auth, adminOnly, updateUser);
router.delete("/users/:userId", auth, adminOnly, deleteUser);

// Public route for development/testing
router.get("/users/public", getAllUsers);

export default router; 