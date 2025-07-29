import { AppDataSource } from "../config/data-source";
import { User } from "../entities/User";
import { Role } from "../entities/Role";

async function fixCurrentUser() {
  try {
    await AppDataSource.initialize();
    console.log("Database connected");

    const userRepository = AppDataSource.getRepository(User);
    const roleRepository = AppDataSource.getRepository(Role);

    // Find the current user (admin@crm.com)
    const currentUser = await userRepository.findOne({ where: { email: "admin@crm.com" } });
    if (!currentUser) {
      console.log("Current user not found");
      return;
    }

    console.log("Found current user:", currentUser.email);
    console.log("Current legacyRole:", currentUser.legacyRole);
    console.log("Current roleId:", currentUser.roleId);

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

    // Update current user to be admin
    currentUser.legacyRole = "admin";
    currentUser.roleId = adminRole.id;
    await userRepository.save(currentUser);

    console.log("Current user updated successfully!");
    console.log("New legacyRole:", currentUser.legacyRole);
    console.log("New roleId:", currentUser.roleId);

    // Verify the update
    const updatedUser = await userRepository.findOne({ 
      where: { email: "admin@crm.com" },
      relations: ['role']
    });
    
    if (updatedUser) {
      console.log("Verification - Updated user:");
      console.log("Email:", updatedUser.email);
      console.log("LegacyRole:", updatedUser.legacyRole);
      console.log("RoleId:", updatedUser.roleId);
      console.log("Role Name:", updatedUser.role?.name);
      console.log("Is Admin:", updatedUser.isAdmin());
    }

    process.exit(0);
  } catch (error) {
    console.error("Error fixing current user:", error);
    process.exit(1);
  }
}

fixCurrentUser(); 