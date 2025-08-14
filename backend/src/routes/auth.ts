import { Router } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { validate } from "../middleware/validate";
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

// Basic rate limiter for login to mitigate brute-force
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
});

// Auth routes
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

router.post("/login", loginLimiter, validate(loginSchema), login);
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