import { Request, Response } from 'express';
import { Repository } from 'typeorm';
import { AppDataSource } from '../config/data-source';
import { ExternalUser, ExternalUserStatus, ExternalUserRole } from '../entities/ExternalUser';
import { Account } from '../entities/Account';
import { Contact } from '../entities/Contact';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { SystemEmailService } from '../services/systemEmailService';

export class ExternalAuthController {
  private externalUserRepository: Repository<ExternalUser>;
  private accountRepository: Repository<Account>;
  private contactRepository: Repository<Contact>;

  constructor() {
    this.externalUserRepository = AppDataSource.getRepository(ExternalUser);
    this.accountRepository = AppDataSource.getRepository(Account);
    this.contactRepository = AppDataSource.getRepository(Contact);
  }

  // External user login
  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      const externalUser = await this.externalUserRepository.findOne({
        where: { email },
        relations: ['account', 'contact']
      });

      if (!externalUser) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      if (externalUser.status !== ExternalUserStatus.ACTIVE) {
        return res.status(401).json({ error: 'Account is not active' });
      }

      const isValidPassword = await bcrypt.compare(password, externalUser.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Update last login
      externalUser.lastLoginAt = new Date();
      await this.externalUserRepository.save(externalUser);

      // Generate JWT token
      const token = jwt.sign(
        {
          userId: externalUser.id,
          email: externalUser.email,
          accountId: externalUser.accountId,
          role: externalUser.role,
          type: 'external'
        },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '7d' }
      );

      res.json({
        token,
        user: {
          id: externalUser.id,
          email: externalUser.email,
          firstName: externalUser.firstName,
          lastName: externalUser.lastName,
          role: externalUser.role,
          accountId: externalUser.accountId,
          accountName: externalUser.account?.name
        }
      });
    } catch (error) {
      console.error('External user login error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Create external user (admin only)
  async createExternalUser(req: Request, res: Response) {
    try {
      const { email, firstName, lastName, accountId, contactId, role, phone, notes } = req.body;

      if (!email || !firstName || !lastName || !accountId) {
        return res.status(400).json({ error: 'Email, firstName, lastName, and accountId are required' });
      }

      // Check if account exists
      const account = await this.accountRepository.findOne({ where: { id: accountId } });
      if (!account) {
        return res.status(404).json({ error: 'Account not found' });
      }

      // Check if contact exists (if provided)
      if (contactId) {
        const contact = await this.contactRepository.findOne({ where: { id: contactId } });
        if (!contact) {
          return res.status(404).json({ error: 'Contact not found' });
        }
      }

      // Check if email already exists
      const existingUser = await this.externalUserRepository.findOne({ where: { email } });
      if (existingUser) {
        return res.status(400).json({ error: 'Email already registered' });
      }

      // Generate temporary password
      const tempPassword = Math.random().toString(36).slice(-8);
      const hashedPassword = await bcrypt.hash(tempPassword, 10);

      // Debug logging
      console.log('Creating external user with data:', {
        email,
        firstName,
        lastName,
        accountId,
        contactId,
        role: role || 'client_user',
        phone,
        notes,
        status: 'pending'
      });
      console.log('Enum values:', {
        CLIENT_USER: 'client_user',
        PENDING: 'pending'
      });

      const externalUser = this.externalUserRepository.create({
        email,
        firstName,
        lastName,
        password: hashedPassword,
        accountId,
        contactId,
        role: role || 'client_user',
        phone,
        notes,
        status: ExternalUserStatus.PENDING
      });

      const savedUser = await this.externalUserRepository.save(externalUser);

      // Send welcome email
      try {
        const systemEmailService = new SystemEmailService();
        await systemEmailService.sendExternalUserWelcomeEmail({
          userEmail: savedUser.email,
          userName: savedUser.fullName,
          tempPassword,
          accountName: account.name,
          appUrl: process.env.FRONTEND_URL || 'http://localhost:5173'
        });
        console.log('Welcome email sent successfully to:', savedUser.email);
      } catch (emailError) {
        console.error('Failed to send welcome email:', emailError);
        // Don't fail user creation if email fails
      }

      res.status(201).json({
        message: 'External user created successfully',
        user: {
          id: savedUser.id,
          email: savedUser.email,
          firstName: savedUser.firstName,
          lastName: savedUser.lastName,
          role: savedUser.role,
          status: savedUser.status
        },
        tempPassword
      });
    } catch (error) {
      console.error('Create external user error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Public registration method for external users
  async registerExternalUser(req: Request, res: Response) {
    try {
      const { email, password, firstName, lastName, accountId, contactId, phone } = req.body;

      if (!email || !password || !firstName || !lastName || !accountId) {
        return res.status(400).json({ error: 'Email, password, firstName, lastName, and accountId are required' });
      }

      // Check if account exists
      const account = await this.accountRepository.findOne({ where: { id: accountId } });
      if (!account) {
        return res.status(404).json({ error: 'Account not found' });
      }

      // Check if contact exists (if provided)
      if (contactId) {
        const contact = await this.contactRepository.findOne({ where: { id: contactId } });
        if (!contact) {
          return res.status(404).json({ error: 'Contact not found' });
        }
      }

      // Check if email already exists
      const existingUser = await this.externalUserRepository.findOne({ where: { email } });
      if (existingUser) {
        return res.status(400).json({ error: 'Email already registered' });
      }

      // Hash the provided password
      const hashedPassword = await bcrypt.hash(password, 10);

      const externalUser = this.externalUserRepository.create({
        email,
        firstName,
        lastName,
        password: hashedPassword,
        accountId,
        contactId,
        phone,
        role: 'client_user',
        status: 'active' // Auto-activate for public registration
      });

      const savedUser = await this.externalUserRepository.save(externalUser);

      // Send welcome email (temporarily disabled for testing)
      try {
        console.log('External user registered successfully. Email sending temporarily disabled.');
        console.log('User details:', {
          email: savedUser.email,
          accountName: account.name
        });
        // TODO: Re-enable email sending once SMTP is properly configured
        // const systemEmailService = new SystemEmailService();
        // await systemEmailService.sendExternalUserWelcomeEmail({
        //   userEmail: savedUser.email,
        //   userName: savedUser.fullName,
        //   tempPassword: null, // No temp password for public registration
        //   accountName: account.name,
        //   appUrl: process.env.FRONTEND_URL || 'http://localhost:5173'
        // });
      } catch (emailError) {
        console.error('Failed to send welcome email:', emailError);
        // Don't fail user creation if email fails
      }

      res.status(201).json({
        message: 'External user registered successfully',
        user: {
          id: savedUser.id,
          email: savedUser.email,
          firstName: savedUser.firstName,
          lastName: savedUser.lastName,
          role: savedUser.role,
          status: savedUser.status
        }
      });
    } catch (error) {
      console.error('Register external user error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Get external user profile
  async getProfile(req: Request, res: Response) {
    try {
      const userId = (req as any).user.userId;
      
      const externalUser = await this.externalUserRepository.findOne({
        where: { id: userId },
        relations: ['account', 'contact']
      });

      if (!externalUser) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({
        id: externalUser.id,
        email: externalUser.email,
        firstName: externalUser.firstName,
        lastName: externalUser.lastName,
        role: externalUser.role,
        phone: externalUser.phone,
        accountId: externalUser.accountId,
        accountName: externalUser.account?.name,
        contactId: externalUser.contactId,
        status: externalUser.status,
        lastLoginAt: externalUser.lastLoginAt,
        createdAt: externalUser.createdAt
      });
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Update external user profile
  async updateProfile(req: Request, res: Response) {
    try {
      const userId = (req as any).user.userId;
      const { firstName, lastName, phone } = req.body;

      const externalUser = await this.externalUserRepository.findOne({
        where: { id: userId }
      });

      if (!externalUser) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Update allowed fields
      if (firstName) externalUser.firstName = firstName;
      if (lastName) externalUser.lastName = lastName;
      if (phone !== undefined) externalUser.phone = phone;

      await this.externalUserRepository.save(externalUser);

      res.json({
        message: 'Profile updated successfully',
        user: {
          id: externalUser.id,
          email: externalUser.email,
          firstName: externalUser.firstName,
          lastName: externalUser.lastName,
          phone: externalUser.phone
        }
      });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Change password
  async changePassword(req: Request, res: Response) {
    try {
      const userId = (req as any).user.userId;
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: 'Current password and new password are required' });
      }

      const externalUser = await this.externalUserRepository.findOne({
        where: { id: userId }
      });

      if (!externalUser) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Verify current password
      const isValidPassword = await bcrypt.compare(currentPassword, externalUser.password);
      if (!isValidPassword) {
        return res.status(400).json({ error: 'Current password is incorrect' });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      externalUser.password = hashedPassword;

      await this.externalUserRepository.save(externalUser);

      res.json({ message: 'Password changed successfully' });
    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Request password reset
  async requestPasswordReset(req: Request, res: Response) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ error: 'Email is required' });
      }

      const externalUser = await this.externalUserRepository.findOne({
        where: { email }
      });

      if (!externalUser) {
        // Don't reveal if user exists
        return res.json({ message: 'If an account with that email exists, a password reset link has been sent' });
      }

      // Generate reset token
      const resetToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      externalUser.passwordResetToken = resetToken;
      externalUser.passwordResetExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      await this.externalUserRepository.save(externalUser);

      // Send password reset email
      try {
        const systemEmailService = new SystemEmailService();
        await systemEmailService.sendPasswordResetEmail({
          userEmail: externalUser.email,
          userName: externalUser.fullName,
          resetToken,
          appUrl: process.env.FRONTEND_URL || 'http://localhost:5173'
        });
      } catch (emailError) {
        console.error('Failed to send password reset email:', emailError);
      }

      res.json({ message: 'If an account with that email exists, a password reset link has been sent' });
    } catch (error) {
      console.error('Request password reset error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Reset password with token
  async resetPassword(req: Request, res: Response) {
    try {
      const { token, newPassword } = req.body;

      if (!token || !newPassword) {
        return res.status(400).json({ error: 'Token and new password are required' });
      }

      const externalUser = await this.externalUserRepository.findOne({
        where: { passwordResetToken: token }
      });

      if (!externalUser) {
        return res.status(400).json({ error: 'Invalid or expired reset token' });
      }

      if (!externalUser.passwordResetExpires || externalUser.passwordResetExpires < new Date()) {
        return res.status(400).json({ error: 'Reset token has expired' });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      externalUser.password = hashedPassword;
      externalUser.passwordResetToken = null;
      externalUser.passwordResetExpires = null;

      await this.externalUserRepository.save(externalUser);

      res.json({ message: 'Password reset successfully' });
    } catch (error) {
      console.error('Reset password error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Get external users for an account (admin only)
  async getAccountExternalUsers(req: Request, res: Response) {
    try {
      const { accountId } = req.params;

      const externalUsers = await this.externalUserRepository.find({
        where: { accountId },
        relations: ['contact'],
        order: { createdAt: 'DESC' }
      });

      res.json(externalUsers.map(user => ({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        status: user.status,
        phone: user.phone,
        contactId: user.contactId,
        contactName: user.contact ? `${user.contact.firstName} ${user.contact.lastName}` : null,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt
      })));
    } catch (error) {
      console.error('Get account external users error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Update external user status (admin only)
  async updateExternalUserStatus(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const { status } = req.body;

      if (!Object.values(ExternalUserStatus).includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
      }

      const externalUser = await this.externalUserRepository.findOne({
        where: { id: userId }
      });

      if (!externalUser) {
        return res.status(404).json({ error: 'User not found' });
      }

      externalUser.status = status;
      await this.externalUserRepository.save(externalUser);

      res.json({
        message: 'User status updated successfully',
        user: {
          id: externalUser.id,
          email: externalUser.email,
          status: externalUser.status
        }
      });
    } catch (error) {
      console.error('Update external user status error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Revoke external user access (admin only)
  async revokeExternalUser(req: Request, res: Response) {
    try {
      const { userId } = req.params;

      const externalUser = await this.externalUserRepository.findOne({
        where: { id: userId }
      });

      if (!externalUser) {
        return res.status(404).json({ error: 'External user not found' });
      }

      // Delete the external user
      await this.externalUserRepository.remove(externalUser);

      res.json({
        message: 'External user access revoked successfully'
      });
    } catch (error) {
      console.error('Revoke external user error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}
