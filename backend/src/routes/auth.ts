import express from "express";
import { login, getMe, getAllUsers } from "../controllers/authController";
import { auth } from "../middleware/auth";

const router = express.Router();

router.post("/login", login);
router.get("/me", auth, getMe);
router.get("/users", auth, getAllUsers);
// Public route for development/testing (remove in production)
router.get("/users/public", getAllUsers);

export default router; 