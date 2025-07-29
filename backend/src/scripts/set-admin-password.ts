import { AppDataSource } from "../config/data-source";
import { User } from "../entities/User";

async function setAdminPassword() {
  try {
    await AppDataSource.initialize();
    console.log("Database connected");

    const userRepository = AppDataSource.getRepository(User);

    // Find the admin user
    const adminUser = await userRepository.findOne({ where: { email: "admin@crm.com" } });
    if (!adminUser) {
      console.log("Admin user not found");
      return;
    }

    console.log("Found admin user:", adminUser.email);
    console.log("Current password set:", !!adminUser.password);

    // Set the password to "admin123"
    adminUser.password = "admin123";
    await userRepository.save(adminUser);

    console.log("Admin password set successfully!");
    console.log("You can now login with:");
    console.log("Email: admin@crm.com");
    console.log("Password: admin123");

    process.exit(0);
  } catch (error) {
    console.error("Error setting admin password:", error);
    process.exit(1);
  }
}

setAdminPassword(); 