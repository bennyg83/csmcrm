import { Request, Response } from "express";
import { AppDataSource } from "../config/data-source";
import { In } from "typeorm";
import { User } from "../entities/User";
import { Role } from "../entities/Role";
import { Permission } from "../entities/Permission";
import { AuthRequest } from "../middleware/auth";

// Get all roles
export const getAllRoles = async (req: Request, res: Response) => {
  try {
    const roleRepository = AppDataSource.getRepository(Role);
    const roles = await roleRepository.find({
      relations: ["permissions"],
      order: { name: "ASC" }
    });

    res.json(roles);
  } catch (error) {
    console.error("Get all roles error:", error);
    res.status(500).json({ error: "Failed to fetch roles" });
  }
};

// Get role by ID
export const getRoleById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const roleRepository = AppDataSource.getRepository(Role);
    const role = await roleRepository.findOne({
      where: { id },
      relations: ["permissions", "users"]
    });

    if (!role) {
      return res.status(404).json({ error: "Role not found" });
    }

    res.json(role);
  } catch (error) {
    console.error("Get role by ID error:", error);
    res.status(500).json({ error: "Failed to fetch role" });
  }
};

// Create new role
export const createRole = async (req: Request, res: Response) => {
  try {
    const { name, description, permissions } = req.body;

    if (!name) {
      return res.status(400).json({ error: "Role name is required" });
    }

    const roleRepository = AppDataSource.getRepository(Role);
    const permissionRepository = AppDataSource.getRepository(Permission);

    // Check if role already exists
    const existingRole = await roleRepository.findOne({ where: { name } });
    if (existingRole) {
      return res.status(400).json({ error: "Role with this name already exists" });
    }

    // Create new role
    const newRole = roleRepository.create({
      name,
      description,
      isSystemRole: false
    });

    // Add permissions if provided
    if (permissions && Array.isArray(permissions)) {
      const permissionEntities = await permissionRepository.findByIds(permissions);
      newRole.permissions = permissionEntities;
    }

    const savedRole = await roleRepository.save(newRole);
    res.status(201).json(savedRole);
  } catch (error) {
    console.error("Create role error:", error);
    res.status(500).json({ error: "Failed to create role" });
  }
};

// Update role
export const updateRole = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, permissions, isActive } = req.body;

    const roleRepository = AppDataSource.getRepository(Role);
    const permissionRepository = AppDataSource.getRepository(Permission);

    const role = await roleRepository.findOne({
      where: { id },
      relations: ["permissions"]
    });

    if (!role) {
      return res.status(404).json({ error: "Role not found" });
    }

    if (role.isSystemRole) {
      return res.status(400).json({ error: "Cannot modify system roles" });
    }

    // Update role properties
    if (name !== undefined) role.name = name;
    if (description !== undefined) role.description = description;
    if (isActive !== undefined) role.isActive = isActive;

    // Update permissions if provided
    if (permissions && Array.isArray(permissions)) {
      const permissionEntities = await permissionRepository.findByIds(permissions);
      role.permissions = permissionEntities;
    }

    const updatedRole = await roleRepository.save(role);
    res.json(updatedRole);
  } catch (error) {
    console.error("Update role error:", error);
    res.status(500).json({ error: "Failed to update role" });
  }
};

// Delete role
export const deleteRole = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const roleRepository = AppDataSource.getRepository(Role);
    const userRepository = AppDataSource.getRepository(User);

    const role = await roleRepository.findOne({
      where: { id },
      relations: ["users"]
    });

    if (!role) {
      return res.status(404).json({ error: "Role not found" });
    }

    if (role.isSystemRole) {
      return res.status(400).json({ error: "Cannot delete system roles" });
    }

    // Check if role is assigned to any users
    if (role.users && role.users.length > 0) {
      return res.status(400).json({ 
        error: "Cannot delete role that is assigned to users",
        userCount: role.users.length
      });
    }

    await roleRepository.remove(role);
    res.json({ message: "Role deleted successfully" });
  } catch (error) {
    console.error("Delete role error:", error);
    res.status(500).json({ error: "Failed to delete role" });
  }
};

// Get all permissions
export const getAllPermissions = async (req: Request, res: Response) => {
  try {
    const permissionRepository = AppDataSource.getRepository(Permission);
    const permissions = await permissionRepository.find({
      order: { name: "ASC" }
    });

    res.json(permissions);
  } catch (error) {
    console.error("Get all permissions error:", error);
    res.status(500).json({ error: "Failed to fetch permissions" });
  }
};

// Create new permission
export const createPermission = async (req: Request, res: Response) => {
  try {
    const { name, description, resource, action } = req.body;

    if (!name) {
      return res.status(400).json({ error: "Permission name is required" });
    }

    const permissionRepository = AppDataSource.getRepository(Permission);

    // Check if permission already exists
    const existingPermission = await permissionRepository.findOne({ where: { name } });
    if (existingPermission) {
      return res.status(400).json({ error: "Permission with this name already exists" });
    }

    const newPermission = permissionRepository.create({
      name,
      description,
      resource,
      action,
      isSystemPermission: false
    });

    const savedPermission = await permissionRepository.save(newPermission);
    res.status(201).json(savedPermission);
  } catch (error) {
    console.error("Create permission error:", error);
    res.status(500).json({ error: "Failed to create permission" });
  }
};

// Assign role to user
export const assignRoleToUser = async (req: Request, res: Response) => {
  try {
    const { userId, roleId } = req.body;

    if (!userId || !roleId) {
      return res.status(400).json({ error: "User ID and Role ID are required" });
    }

    const userRepository = AppDataSource.getRepository(User);
    const roleRepository = AppDataSource.getRepository(Role);

    const user = await userRepository.findOne({ where: { id: userId } });
    const role = await roleRepository.findOne({ where: { id: roleId } });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (!role) {
      return res.status(404).json({ error: "Role not found" });
    }

    user.roleId = roleId;
    user.legacyRole = role.name as any; // Update legacyRole to match the role name
    await userRepository.save(user);

    res.json({ message: "Role assigned successfully", user, role });
  } catch (error) {
    console.error("Assign role to user error:", error);
    res.status(500).json({ error: "Failed to assign role to user" });
  }
};

// Get user permissions
export const getUserPermissions = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({
      where: { id: req.user.id },
      relations: ["role", "role.permissions"]
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const permissions = user.role?.permissions || [];
    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role?.name || user.legacyRole
      },
      permissions: permissions.map(p => ({
        id: p.id,
        name: p.name,
        description: p.description,
        resource: p.resource,
        action: p.action
      }))
    });
  } catch (error) {
    console.error("Get user permissions error:", error);
    res.status(500).json({ error: "Failed to fetch user permissions" });
  }
};

// Initialize system roles and permissions
export const initializeSystemRBAC = async (req: Request, res: Response) => {
  try {
    const roleRepository = AppDataSource.getRepository(Role);
    const permissionRepository = AppDataSource.getRepository(Permission);

    // Create system permissions
    const systemPermissions = [
      { name: "accounts:read", description: "Read accounts", resource: "accounts", action: "read" },
      { name: "accounts:write", description: "Create/update accounts", resource: "accounts", action: "write" },
      { name: "accounts:delete", description: "Delete accounts", resource: "accounts", action: "delete" },
      { name: "contacts:read", description: "Read contacts", resource: "contacts", action: "read" },
      { name: "contacts:write", description: "Create/update contacts", resource: "contacts", action: "write" },
      { name: "contacts:delete", description: "Delete contacts", resource: "contacts", action: "delete" },
      { name: "tasks:read", description: "Read tasks", resource: "tasks", action: "read" },
      { name: "tasks:write", description: "Create/update tasks", resource: "tasks", action: "write" },
      { name: "tasks:delete", description: "Delete tasks", resource: "tasks", action: "delete" },
      { name: "users:read", description: "Read users", resource: "users", action: "read" },
      { name: "users:write", description: "Create/update users", resource: "users", action: "write" },
      { name: "users:delete", description: "Delete users", resource: "users", action: "delete" },
      { name: "roles:read", description: "Read roles", resource: "roles", action: "read" },
      { name: "roles:write", description: "Create/update roles", resource: "roles", action: "write" },
      { name: "roles:delete", description: "Delete roles", resource: "roles", action: "delete" },
      { name: "reports:read", description: "Read reports", resource: "reports", action: "read" },
      { name: "reports:write", description: "Create/update reports", resource: "reports", action: "write" },
      { name: "system:admin", description: "Full system access", resource: "system", action: "admin" }
    ];

    // Create permissions
    for (const permData of systemPermissions) {
      const existingPerm = await permissionRepository.findOne({ where: { name: permData.name } });
      if (!existingPerm) {
        const permission = permissionRepository.create({
          ...permData,
          isSystemPermission: true
        });
        await permissionRepository.save(permission);
      }
    }

    // Create system roles
    const adminPermissions = await permissionRepository.find({ where: { isSystemPermission: true } });
    const managerPermissions = await permissionRepository.find({ 
      where: { 
        name: In([
          "accounts:read", "accounts:write", "contacts:read", "contacts:write",
          "tasks:read", "tasks:write", "users:read", "reports:read", "reports:write"
        ])
      }
    });
    const salesPermissions = await permissionRepository.find({ 
      where: { 
        name: In([
          "accounts:read", "accounts:write", "contacts:read", "contacts:write",
          "tasks:read", "tasks:write", "reports:read"
        ])
      }
    });
    const supportPermissions = await permissionRepository.find({ 
      where: { 
        name: In([
          "accounts:read", "contacts:read", "contacts:write",
          "tasks:read", "tasks:write"
        ])
      }
    });
    const userPermissions = await permissionRepository.find({ 
      where: { 
        name: In([
          "accounts:read", "contacts:read", "tasks:read", "tasks:write"
        ])
      }
    });

    // Create roles
    const systemRoles = [
      { name: "admin", description: "System Administrator", permissions: adminPermissions },
      { name: "manager", description: "Team Manager", permissions: managerPermissions },
      { name: "sales", description: "Sales Representative", permissions: salesPermissions },
      { name: "support", description: "Support Representative", permissions: supportPermissions },
      { name: "user", description: "Standard User", permissions: userPermissions }
    ];

    for (const roleData of systemRoles) {
      const existingRole = await roleRepository.findOne({ where: { name: roleData.name } });
      if (!existingRole) {
        const role = roleRepository.create({
          name: roleData.name,
          description: roleData.description,
          permissions: roleData.permissions,
          isSystemRole: true
        });
        await roleRepository.save(role);
      }
    }

    res.json({ message: "System RBAC initialized successfully" });
  } catch (error) {
    console.error("Initialize system RBAC error:", error);
    res.status(500).json({ error: "Failed to initialize system RBAC" });
  }
}; 