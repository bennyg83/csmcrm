import { Request, Response, NextFunction } from "express";
import { AuthRequest } from "./auth";
import { AppDataSource } from "../config/data-source";

export interface RBACRequest extends AuthRequest {
  requiredPermissions?: string[];
  requiredRole?: string;
}

// Enhanced admin middleware
export const requireAdmin = async (req: RBACRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // Use the User entity's isAdmin method
    if (!req.user.isAdmin()) {
      return res.status(403).json({ 
        error: "Admin access required",
        userRole: req.user.getRoleName()
      });
    }

    next();
  } catch (error) {
    console.error("Admin check error:", error);
    res.status(500).json({ error: "Admin check failed" });
  }
};

// Manager or Admin middleware
export const requireManagerOrAdmin = async (req: RBACRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const userRole = req.user.getRoleName();
    if (userRole !== 'admin' && userRole !== 'manager') {
      return res.status(403).json({ 
        error: "Manager or Admin access required",
        userRole: userRole
      });
    }

    next();
  } catch (error) {
    console.error("Manager/Admin check error:", error);
    res.status(500).json({ error: "Role check failed" });
  }
};

// Role-based middleware
export const requireRole = (roleName: string) => {
  return async (req: RBACRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const userRole = req.user.getRoleName();
      if (userRole !== roleName) {
        return res.status(403).json({ 
          error: "Insufficient role",
          requiredRole: roleName,
          userRole: userRole
        });
      }

      next();
    } catch (error) {
      console.error("Role check error:", error);
      res.status(500).json({ error: "Role check failed" });
    }
  };
};

// Multiple roles middleware (any of the roles)
export const requireAnyRole = (roleNames: string[]) => {
  return async (req: RBACRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const userRole = req.user.getRoleName();
      if (!roleNames.includes(userRole)) {
        return res.status(403).json({ 
          error: "Insufficient role",
          requiredRoles: roleNames,
          userRole: userRole
        });
      }

      next();
    } catch (error) {
      console.error("Role check error:", error);
      res.status(500).json({ error: "Role check failed" });
    }
  };
};

// Sales or Manager or Admin middleware
export const requireSalesOrManagerOrAdmin = async (req: RBACRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const userRole = req.user.role || req.user.legacyRole;
    if (!['admin', 'manager', 'sales'].includes(userRole)) {
      return res.status(403).json({ 
        error: "Sales, Manager, or Admin access required",
        userRole: userRole
      });
    }

    next();
  } catch (error) {
    console.error("Sales/Manager/Admin check error:", error);
    res.status(500).json({ error: "Role check failed" });
  }
};

// Support or Manager or Admin middleware
export const requireSupportOrManagerOrAdmin = async (req: RBACRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const userRole = req.user.role || req.user.legacyRole;
    if (!['admin', 'manager', 'support'].includes(userRole)) {
      return res.status(403).json({ 
        error: "Support, Manager, or Admin access required",
        userRole: userRole
      });
    }

    next();
  } catch (error) {
    console.error("Support/Manager/Admin check error:", error);
    res.status(500).json({ error: "Role check failed" });
  }
};

// Permission-based middleware
export const requirePermission = (permissionName: string) => {
  return async (req: RBACRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Authentication required" });
      }

      // Admin users have all permissions
      if (req.user.isAdmin()) {
        return next();
      }

      // Check if user has the required permission through their role
      const userRole = req.user.role;
      if (userRole && typeof userRole === 'object' && userRole.permissions) {
        const hasPermission = userRole.permissions.some((perm: any) => 
          perm.name === permissionName && perm.isActive
        );
        
        if (hasPermission) {
          return next();
        }
      }

      // Fallback to legacy role-based permissions
      const userLegacyRole = req.user.legacyRole;
      if (userLegacyRole && userLegacyRole.toLowerCase() === 'admin') {
        return next(); // Admin has all permissions
      }

      // For now, use role-based fallback until RBAC is fully implemented
      const rolePermissions: Record<string, string[]> = {
        'manager': ['accounts.read', 'accounts.write', 'contacts.read', 'contacts.write', 'tasks.read', 'tasks.write'],
        'sales': ['accounts.read', 'accounts.write', 'contacts.read', 'contacts.write', 'tasks.read', 'tasks.write'],
        'support': ['accounts.read', 'contacts.read', 'tasks.read', 'tasks.write'],
        'user': ['accounts.read', 'contacts.read', 'tasks.read']
      };

      const normalizedRole = (userLegacyRole || 'user').toLowerCase();
      const userPermissions = rolePermissions[normalizedRole] || [];
      if (userPermissions.includes(permissionName)) {
        return next();
      }

      return res.status(403).json({ 
        error: "Insufficient permissions",
        requiredPermission: permissionName,
        userRole: req.user.getRoleName() || 'unknown'
      });

    } catch (error) {
      console.error("Permission check error:", error);
      res.status(500).json({ error: "Permission check failed" });
    }
  };
}; 