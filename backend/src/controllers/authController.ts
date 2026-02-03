import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { AppDataSource } from "../config/data-source";
import { User } from "../entities/User";
import { AuthRequest } from "../middleware/auth";
import { Not } from "typeorm";
import bcrypt from "bcryptjs";
import { SystemEmailService } from "../services/systemEmailService";

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({ where: { email } });

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // For regular users, validate password
    if (!user.isGoogleUser) {
      if (!password) {
        return res.status(400).json({ error: "Password is required" });
      }

      const isValidPassword = await user.comparePassword(password);
      if (!isValidPassword) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
    }

    // Ensure JWT secret is configured
    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is not configured");
      return res.status(500).json({ error: "Server misconfiguration" });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.legacyRole, type: 'internal' },
      process.env.JWT_SECRET!,
      { expiresIn: "24h" }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.legacyRole,
        isGoogleUser: user.isGoogleUser
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const logout = async (req: Request, res: Response) => {
  try {
    // In a real application, you might want to blacklist the token
    // For now, we'll just return a success response
    res.json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    res.json({
      user: {
        id: req.user.id,
        email: req.user.email,
        name: req.user.name,
        role: req.user.legacyRole,
        isGoogleUser: req.user.isGoogleUser
      }
    });
  } catch (error) {
    console.error("Get me error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Get all users (Admin only)
 */
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const userRepository = AppDataSource.getRepository(User);
    
    // Get all users excluding sensitive data
    const users = await userRepository.find({
      select: {
        id: true,
        name: true,
        email: true,
        legacyRole: true,
        roleId: true,
        isGoogleUser: true,
        avatar: true,
        createdAt: true,
        updatedAt: true
      },
      relations: ['role'],
      order: { createdAt: 'DESC' }
    });

    res.json(users);
  } catch (error) {
    console.error('Failed to get users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

/**
 * Create a new internal user (Admin only)
 */
export const createUser = async (req: Request, res: Response) => {
  try {
    const { name, email, role, password } = req.body;

    // Validate required fields
    if (!name || !email || !role) {
      return res.status(400).json({ error: 'Name, email, and role are required' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Validate role
    const validRoles = ['admin', 'user', 'manager', 'sales', 'support'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Must be one of: ' + validRoles.join(', ') });
    }

    const userRepository = AppDataSource.getRepository(User);

    // Check if user already exists
    const existingUser = await userRepository.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Create new user
    const user = new User();
    user.name = name;
    user.email = email;
    user.role = role as any;
    user.isGoogleUser = false;

    // Set password (hash it if provided, otherwise generate temporary password)
    let tempPassword: string | undefined;
    if (password) {
      user.password = await bcrypt.hash(password, 10);
    } else {
      // Generate temporary password
      tempPassword = Math.random().toString(36).slice(-8);
      user.password = await bcrypt.hash(tempPassword, 10);
      console.log(`Temporary password for ${email}: ${tempPassword}`);
    }

    const savedUser = await userRepository.save(user);

    // Send welcome email to new user
    try {
      const systemEmailService = new SystemEmailService();
      const adminUser = req.user as User; // The admin creating the user
      
      await systemEmailService.sendWelcomeEmail({
        userEmail: savedUser.email,
        userName: savedUser.name,
        tempPassword: password ? undefined : tempPassword, // Only include if temp password was generated
        adminEmail: adminUser.email,
        adminName: adminUser.name,
        appUrl: process.env.FRONTEND_URL || 'http://localhost:5173'
      });
      
      console.log(`Welcome email sent to ${savedUser.email}`);
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
      // Don't fail the user creation if email fails
      // Just log the error and continue
    }

    // Return user without password
    const { password: _, ...userWithoutPassword } = savedUser;
    res.status(201).json(userWithoutPassword);
  } catch (error) {
    console.error('Failed to create user:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
};

/**
 * Update a user (Admin only)
 */
export const updateUser = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { name, email, role, password } = req.body;

    const userRepository = AppDataSource.getRepository(User);

    const user = await userRepository.findOne({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update fields if provided
    if (name) user.name = name;
    if (email) {
      // Check if new email is already taken by another user
      const existingUser = await userRepository.findOne({ 
        where: { email, id: Not(userId) } 
      });
      if (existingUser) {
        return res.status(400).json({ error: 'Email already taken by another user' });
      }
      user.email = email;
    }
    if (role) {
      const validRoles = ['admin', 'user', 'manager', 'sales', 'support'];
      if (!validRoles.includes(role)) {
        return res.status(400).json({ error: 'Invalid role. Must be one of: ' + validRoles.join(', ') });
      }
      user.role = role as any;
    }
    if (password) {
      user.password = await bcrypt.hash(password, 10);
    }

    const updatedUser = await userRepository.save(user);

    // Return user without password
    const { password: _, ...userWithoutPassword } = updatedUser;
    res.json(userWithoutPassword);
  } catch (error) {
    console.error('Failed to update user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
};

/**
 * Delete a user (Admin only)
 */
export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const currentUser = req.user as User;

    // Prevent self-deletion
    if (currentUser.id === userId) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    const userRepository = AppDataSource.getRepository(User);

    const user = await userRepository.findOne({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await userRepository.remove(user);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Failed to delete user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
}; 