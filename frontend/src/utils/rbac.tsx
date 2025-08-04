import React from 'react';
import { useAuth } from '../contexts/AuthContext';

// Permission-based UI control utility
export const usePermissions = () => {
  const { user } = useAuth();

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;

    // Admin users have all permissions
    if (user.role === 'admin' || user.role === 'Admin') {
      return true;
    }

    // Define role-based permissions
    const rolePermissions: Record<string, string[]> = {
      'manager': ['accounts.read', 'accounts.write', 'contacts.read', 'contacts.write', 'tasks.read', 'tasks.write', 'reports.read', 'users.read', 'analytics.read'],
      'Manager': ['accounts.read', 'accounts.write', 'contacts.read', 'contacts.write', 'tasks.read', 'tasks.write', 'reports.read', 'users.read', 'analytics.read'],
      'sales': ['accounts.read', 'accounts.write', 'contacts.read', 'contacts.write', 'tasks.read', 'tasks.write'],
      'Sales': ['accounts.read', 'accounts.write', 'contacts.read', 'contacts.write', 'tasks.read', 'tasks.write'],
      'support': ['accounts.read', 'contacts.read', 'tasks.read', 'tasks.write'],
      'Support': ['accounts.read', 'contacts.read', 'tasks.read', 'tasks.write'],
      'user': ['accounts.read', 'contacts.read', 'tasks.read'],
      'User': ['accounts.read', 'contacts.read', 'tasks.read']
    };

    const userPermissions = rolePermissions[user.role || 'user'] || [];
    return userPermissions.includes(permission);
  };

  const canRead = (resource: string): boolean => {
    return hasPermission(`${resource}.read`);
  };

  const canWrite = (resource: string): boolean => {
    return hasPermission(`${resource}.write`);
  };

  const canCreate = (resource: string): boolean => {
    return canWrite(resource);
  };

  const canUpdate = (resource: string): boolean => {
    return canWrite(resource);
  };

  const canDelete = (resource: string): boolean => {
    return canWrite(resource);
  };

  const canView = (resource: string): boolean => {
    return canRead(resource);
  };

  return {
    hasPermission,
    canRead,
    canWrite,
    canCreate,
    canUpdate,
    canDelete,
    canView,
    user
  };
};

// Simple permission check component
export const RequirePermission: React.FC<{
  permission: string;
  children: React.ReactNode;
}> = ({ permission, children }) => {
  const { hasPermission } = usePermissions();
  
  if (!hasPermission(permission)) {
    return null;
  }
  
  return <React.Fragment>{children}</React.Fragment>;
}; 