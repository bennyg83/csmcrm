import { AppDataSource } from "../config/data-source";
import { User } from "../entities/User";
import { Role } from "../entities/Role";

async function fixAdminUser() {
  try {
    await AppDataSource.initialize();
    console.log("Database connected");

    const userRepository = AppDataSource.getRepository(User);
    const roleRepository = AppDataSource.getRepository(Role);

    // Find admin user
    const adminUser = await userRepository.findOne({ where: { email: "admin@crm.com" } });
    if (!adminUser) {
      console.log("Admin user not found");
      return;
    }

    console.log("Found admin user:", adminUser.email);
    console.log("Current legacyRole:", adminUser.legacyRole);
    console.log("Current roleId:", adminUser.roleId);

    // Find or create admin role
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
      console.log("Admin role created with ID:", adminRole.id);
    } else {
      console.log("Found admin role:", adminRole.name, "ID:", adminRole.id);
    }

    // Update admin user
    adminUser.legacyRole = "admin";
    adminUser.roleId = adminRole.id;
    await userRepository.save(adminUser);

    console.log("Admin user updated successfully!");
    console.log("New legacyRole:", adminUser.legacyRole);
    console.log("New roleId:", adminUser.roleId);

    process.exit(0);
  } catch (error) {
    console.error("Error fixing admin user:", error);
    process.exit(1);
  }
}

fixAdminUser(); 