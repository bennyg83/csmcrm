import { AppDataSource } from "../config/data-source";
import { User } from "../entities/User";
import { Role } from "../entities/Role";
import { Permission } from "../entities/Permission";

async function initializeRBAC() {
  try {
    await AppDataSource.initialize();
    console.log("Database connected");

    // Get repositories
    const userRepository = AppDataSource.getRepository(User);
    const roleRepository = AppDataSource.getRepository(Role);
    const permissionRepository = AppDataSource.getRepository(Permission);

    // Check if admin user exists
    const adminUser = await userRepository.findOne({ where: { email: "admin@crm.com" } });
    if (!adminUser) {
      console.log("Admin user not found, creating...");
      const newAdminUser = userRepository.create({
        name: "Test Admin",
        email: "admin@crm.com",
        password: "admin123",
        legacyRole: "admin",
        isGoogleUser: false
      });
      await userRepository.save(newAdminUser);
      console.log("Admin user created");
    } else {
      console.log("Admin user found:", adminUser.email);
    }

    // Create admin role if it doesn't exist
    let adminRole = await roleRepository.findOne({ where: { name: "admin" } });
    if (!adminRole) {
      console.log("Creating admin role...");
      adminRole = roleRepository.create({
        name: "admin",
        description: "System Administrator",
        isSystemRole: true,
        isActive: true
      });
      await roleRepository.save(adminRole);
      console.log("Admin role created");
    } else {
      console.log("Admin role found:", adminRole.name);
    }

    // Create basic permissions if they don't exist
    const basicPermissions = [
      { name: "accounts.read", description: "Read accounts", resource: "accounts", action: "read" },
      { name: "accounts.write", description: "Write accounts", resource: "accounts", action: "write" },
      { name: "contacts.read", description: "Read contacts", resource: "contacts", action: "read" },
      { name: "contacts.write", description: "Write contacts", resource: "contacts", action: "write" },
      { name: "tasks.read", description: "Read tasks", resource: "tasks", action: "read" },
      { name: "tasks.write", description: "Write tasks", resource: "tasks", action: "write" },
      { name: "rbac.manage", description: "Manage RBAC", resource: "rbac", action: "manage" }
    ];

    for (const permData of basicPermissions) {
      let permission = await permissionRepository.findOne({ where: { name: permData.name } });
      if (!permission) {
        permission = permissionRepository.create({
          ...permData,
          isSystemPermission: true,
          isActive: true
        });
        await permissionRepository.save(permission);
        console.log(`Permission created: ${permData.name}`);
      }
    }

    // Assign all permissions to admin role
    const allPermissions = await permissionRepository.find();
    adminRole.permissions = allPermissions;
    await roleRepository.save(adminRole);
    console.log("All permissions assigned to admin role");

    // Assign admin role to admin user
    const updatedAdminUser = await userRepository.findOne({ where: { email: "admin@crm.com" } });
    if (updatedAdminUser) {
      updatedAdminUser.roleId = adminRole.id;
      await userRepository.save(updatedAdminUser);
      console.log("Admin role assigned to admin user");
    }

    console.log("RBAC initialization completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error initializing RBAC:", error);
    process.exit(1);
  }
}

initializeRBAC(); 