import { AppDataSource } from "../config/data-source";
import { User } from "../entities/User";
import jwt from "jsonwebtoken";

async function testLogin() {
  try {
    await AppDataSource.initialize();
    console.log("Database connected");

    const userRepository = AppDataSource.getRepository(User);

    // Find the admin user
    const user = await userRepository.findOne({ where: { email: "admin@crm.com" } });
    if (!user) {
      console.log("Admin user not found");
      return;
    }

    console.log("Found user:", user.email);
    console.log("LegacyRole:", user.legacyRole);
    console.log("RoleId:", user.roleId);
    console.log("Is Admin:", user.isAdmin());

    // Generate a token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.legacyRole },
      process.env.JWT_SECRET!,
      { expiresIn: "24h" }
    );

    console.log("\n=== GENERATED TOKEN ===");
    console.log(token);
    console.log("\n=== TOKEN DECODED ===");
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    console.log("Decoded token:", {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      exp: new Date(decoded.exp * 1000).toISOString()
    });

    console.log("\n=== TEST API CALL ===");
    console.log("You can test this token with:");
    console.log(`curl -H "Authorization: Bearer ${token}" http://localhost:3000/api/auth/me`);

    process.exit(0);
  } catch (error) {
    console.error("Error testing login:", error);
    process.exit(1);
  }
}

testLogin(); 