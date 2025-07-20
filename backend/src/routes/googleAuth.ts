import { Router } from "express";
import {
  initiateGoogleAuth,
  handleGoogleCallback,
  getGoogleAuthStatus,
  disconnectGoogle,
  refreshGoogleToken
} from "../controllers/googleAuthController";
import { auth } from "../middleware/auth";

const router = Router();

/**
 * @route   GET /api/auth/google
 * @desc    Initiate Google OAuth2 authentication
 * @access  Public
 */
router.get("/google", initiateGoogleAuth);

/**
 * @route   GET /api/auth/google/callback
 * @desc    Handle Google OAuth2 callback
 * @access  Public
 */
router.get("/google/callback", handleGoogleCallback);

/**
 * @route   GET /api/auth/google/status
 * @desc    Get current user's Google authentication status
 * @access  Private
 */
router.get("/google/status", auth, getGoogleAuthStatus);

/**
 * @route   POST /api/auth/google/disconnect
 * @desc    Disconnect Google account from user
 * @access  Private
 */
router.post("/google/disconnect", auth, disconnectGoogle);

/**
 * @route   POST /api/auth/google/refresh
 * @desc    Refresh Google access token
 * @access  Private
 */
router.post("/google/refresh", auth, refreshGoogleToken);

export default router; 