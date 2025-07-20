import { Request, Response } from "express";
import { AppDataSource } from "../config/data-source";
import { User } from "../entities/User";
import { GoogleOAuthService } from "../services/googleOAuthService";
import jwt from "jsonwebtoken";

// Extend Request interface to include user property
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

const googleOAuthService = GoogleOAuthService.getInstance();

/**
 * Initiate Google OAuth2 authentication
 */
export const initiateGoogleAuth = async (req: Request, res: Response) => {
  try {
    const authUrl = googleOAuthService.generateAuthUrl();
    // Redirect directly to Google OAuth instead of returning JSON
    res.redirect(authUrl);
  } catch (error) {
    console.error("Google auth initiation error:", error);
    res.status(500).json({ error: "Failed to initiate Google authentication" });
  }
};

/**
 * Handle Google OAuth2 callback
 */
export const handleGoogleCallback = async (req: Request, res: Response) => {
  try {
    const { code } = req.query;

    if (!code || typeof code !== 'string') {
      return res.status(400).json({ error: "Authorization code is required" });
    }

    // Exchange code for tokens
    const tokens = await googleOAuthService.getTokens(code);
    
    // Get user profile
    const googleProfile = await googleOAuthService.getUserProfile(tokens.access_token);

    if (!googleProfile.verified_email) {
      return res.status(400).json({ error: "Email not verified with Google" });
    }

    const userRepository = AppDataSource.getRepository(User);

    // Check if user exists by Google ID or email
    let user = await userRepository.findOne({
      where: [
        { googleId: googleProfile.id },
        { email: googleProfile.email }
      ]
    });

    const expiryDate = new Date(tokens.expiry_date);

    if (user) {
      // Update existing user with Google info
      user.googleId = googleProfile.id;
      user.googleAccessToken = tokens.access_token;
      user.googleRefreshToken = tokens.refresh_token || user.googleRefreshToken;
      user.googleTokenExpiry = expiryDate;
      user.avatar = googleProfile.picture || user.avatar;
      user.isGoogleUser = true;
      user.name = googleProfile.name; // Update name from Google

      await userRepository.save(user);
    } else {
      // Create new user
      user = userRepository.create({
        email: googleProfile.email,
        name: googleProfile.name,
        googleId: googleProfile.id,
        googleAccessToken: tokens.access_token,
        googleRefreshToken: tokens.refresh_token,
        googleTokenExpiry: expiryDate,
        avatar: googleProfile.picture,
        isGoogleUser: true,
        role: 'user' // Default role for Google users
      });

      await userRepository.save(user);
    }

    // Generate JWT token with proper options
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error("JWT_SECRET is not configured");
    }

    const payload = { 
      userId: user.id, 
      email: user.email, 
      role: user.role,
      isGoogleUser: true 
    };

    const jwtToken = jwt.sign(payload, jwtSecret, { expiresIn: '7d' });

    // Redirect to frontend with token
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendUrl}/auth/google/success?token=${jwtToken}`);

  } catch (error) {
    console.error("Google callback error:", error);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendUrl}/auth/google/error`);
  }
};

/**
 * Get current user's Google auth status
 */
export const getGoogleAuthStatus = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const isGoogleConnected = !!user.googleId && !!user.googleAccessToken;
    let isTokenValid = false;

    if (isGoogleConnected && user.googleAccessToken) {
      isTokenValid = await googleOAuthService.verifyTokens(user.googleAccessToken);
      
      // If token is invalid but we have a refresh token, try to refresh
      if (!isTokenValid && user.googleRefreshToken) {
        try {
          const newTokens = await googleOAuthService.refreshAccessToken(user.googleRefreshToken);
          
          // Update user with new tokens
          const userRepository = AppDataSource.getRepository(User);
          user.googleAccessToken = newTokens.access_token;
          user.googleTokenExpiry = new Date(newTokens.expiry_date);
          if (newTokens.refresh_token) {
            user.googleRefreshToken = newTokens.refresh_token;
          }
          await userRepository.save(user);
          
          isTokenValid = true;
        } catch (refreshError) {
          console.error("Token refresh failed:", refreshError);
        }
      }
    }

    res.json({
      isGoogleConnected,
      isTokenValid,
      userEmail: user.email,
      userName: user.name,
      avatar: user.avatar
    });

  } catch (error) {
    console.error("Google auth status error:", error);
    res.status(500).json({ error: "Failed to get Google auth status" });
  }
};

/**
 * Disconnect Google account
 */
export const disconnectGoogle = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    // Revoke Google tokens
    if (user.googleAccessToken) {
      try {
        await googleOAuthService.revokeTokens(user.googleAccessToken);
      } catch (revokeError) {
        console.error("Token revocation failed:", revokeError);
        // Continue with disconnection even if revocation fails
      }
    }

    // Clear Google-related fields
    const userRepository = AppDataSource.getRepository(User);
    user.googleId = undefined;
    user.googleAccessToken = undefined;
    user.googleRefreshToken = undefined;
    user.googleTokenExpiry = undefined;
    
    // Don't set isGoogleUser to false if user doesn't have a password
    if (user.password) {
      user.isGoogleUser = false;
    }

    await userRepository.save(user);

    res.json({ message: "Google account disconnected successfully" });

  } catch (error) {
    console.error("Google disconnect error:", error);
    res.status(500).json({ error: "Failed to disconnect Google account" });
  }
};

/**
 * Refresh Google access token
 */
export const refreshGoogleToken = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    
    if (!user || !user.googleRefreshToken) {
      return res.status(400).json({ error: "No refresh token available" });
    }

    const newTokens = await googleOAuthService.refreshAccessToken(user.googleRefreshToken);
    
    // Update user with new tokens
    const userRepository = AppDataSource.getRepository(User);
    user.googleAccessToken = newTokens.access_token;
    user.googleTokenExpiry = new Date(newTokens.expiry_date);
    if (newTokens.refresh_token) {
      user.googleRefreshToken = newTokens.refresh_token;
    }
    
    await userRepository.save(user);

    res.json({ 
      message: "Token refreshed successfully",
      expiresAt: user.googleTokenExpiry
    });

  } catch (error) {
    console.error("Token refresh error:", error);
    res.status(500).json({ error: "Failed to refresh Google token" });
  }
}; 