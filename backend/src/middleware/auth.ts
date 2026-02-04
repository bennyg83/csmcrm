import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import { AppDataSource } from '../config/data-source';
import { ExternalUser } from '../entities/ExternalUser';
import { User } from '../entities/User';

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export interface AuthRequest extends Request {
  user?: any;
}

interface JwtPayload {
  userId: string;
  email: string;
  accountId: string;
  role: string;
  type: 'internal' | 'external';
}

/**
 * Authenticate internal users (admin, manager, etc.)
 */
export const authenticateUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const token = authHeader.substring(7);
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as JwtPayload;
      
      if (decoded.type !== 'internal') {
        return res.status(403).json({ error: 'Invalid token type for internal routes' });
      }

      // Get user from database
      const userRepository = AppDataSource.getRepository(User);
      const user = await userRepository.findOne({ where: { id: decoded.userId } });
      
      if (!user) {
        return res.status(401).json({ error: 'User not found' });
      }

      req.user = user;
      next();
    } catch (jwtError) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
};

/**
 * Authenticate external users (clients)
 */
export const authenticateExternalUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const token = authHeader.substring(7);
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as JwtPayload;
      
      if (decoded.type !== 'external') {
        return res.status(403).json({ error: 'Invalid token type for external routes' });
      }

      // Get external user from database
      const externalUserRepository = AppDataSource.getRepository(ExternalUser);
      const externalUser = await externalUserRepository.findOne({ 
        where: { id: decoded.userId },
        relations: ['account']
      });
      
      if (!externalUser) {
        return res.status(401).json({ error: 'External user not found' });
      }

      if (externalUser.status !== 'active') {
        return res.status(403).json({ error: 'Account is not active' });
      }

      req.user = {
        userId: externalUser.id,
        email: externalUser.email,
        firstName: externalUser.firstName,
        lastName: externalUser.lastName,
        role: externalUser.role,
        accountId: externalUser.accountId,
        accountName: externalUser.account?.name
      };
      
      next();
    } catch (jwtError) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
  } catch (error) {
    console.error('External authentication error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
};

/**
 * Check if user has required role
 */
export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
};

/**
 * Check if user is admin (supports legacyRole and role relation)
 */
export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const roleName = typeof req.user.role === 'object' && req.user.role?.name
    ? req.user.role.name
    : req.user.legacyRole ?? '';
  if (roleName !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  next();
};

/**
 * Check if user can access account
 */
export const canAccessAccount = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const accountId = req.params.accountId || req.body.accountId;
  
  if (!accountId) {
    return res.status(400).json({ error: 'Account ID required' });
  }

  // Internal users can access any account
  if (req.user.type === 'internal') {
    return next();
  }

  // External users can only access their own account
  if (req.user.accountId !== accountId) {
    return res.status(403).json({ error: 'Access denied to this account' });
  }

  next();
};

// Export aliases for backward compatibility
export const auth = authenticateUser;
export const adminOnly = requireAdmin; 