import { AppDataSource } from "../config/data-source";
import { User } from "../entities/User";
import { config } from "dotenv";
config();

async function setAdminPassword() {
  try {
    await AppDataSource.initialize();
    console.log("Database connected");

    const userRepository = AppDataSource.getRepository(User);

    // Resolve email and password from env or defaults
    const email = process.env.ADMIN_EMAIL || "admin@crm.com";
    const newPassword = process.env.ADMIN_PASSWORD || "admin123";

    // Find the admin user
    const adminUser = await userRepository.findOne({ where: { email } });
    if (!adminUser) {
      console.log("Admin user not found:", email);
      return;
    }

    console.log("Found admin user:", adminUser.email);
    console.log("Current password set:", !!adminUser.password);

    // Set the password (User entity hook will hash it)
    adminUser.password = newPassword;
    await userRepository.save(adminUser);

    console.log("Admin password set successfully!");
    console.log("You can now login with:");
    console.log("Email:", email);
    console.log("Password:", newPassword);

    await AppDataSource.destroy();
    process.exit(0);
  } catch (error) {
    console.error("Error setting admin password:", error);
    try { await AppDataSource.destroy(); } catch {}
    process.exit(1);
  }
}

setAdminPassword(); 