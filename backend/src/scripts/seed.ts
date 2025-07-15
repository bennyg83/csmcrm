import "reflect-metadata";
import { AppDataSource } from "../config/data-source";
import { User } from "../entities/User";
import { AccountTier } from "../entities/AccountTier";
import { config } from "dotenv";

config();

async function seed() {
  try {
    await AppDataSource.initialize();
    console.log("✅ Database connected for seeding");

    const userRepository = AppDataSource.getRepository(User);
    const tierRepository = AppDataSource.getRepository(AccountTier);

    // Create default account tiers
    const tiers = [
      {
        name: "Enterprise",
        description: "Enterprise level support with 24/7 SLA",
        slaHours: 4
      },
      {
        name: "Professional",
        description: "Professional support with business hours SLA",
        slaHours: 8
      },
      {
        name: "Starter",
        description: "Basic support with standard SLA",
        slaHours: 24
      }
    ];

    for (const tierData of tiers) {
      const existingTier = await tierRepository.findOne({ where: { name: tierData.name } });
      if (!existingTier) {
        const tier = tierRepository.create(tierData);
        await tierRepository.save(tier);
        console.log(`✅ Created tier: ${tierData.name}`);
      }
    }

    // Create default admin user
    const existingAdmin = await userRepository.findOne({ where: { email: "admin@crm.com" } });
    if (!existingAdmin) {
      const adminUser = userRepository.create({
        email: "admin@crm.com",
        name: "Admin User",
        password: "admin123",
        role: "admin"
      });
      await userRepository.save(adminUser);
      console.log("✅ Created admin user: admin@crm.com / admin123");
    }

    // Create default regular user
    const existingUser = await userRepository.findOne({ where: { email: "user@crm.com" } });
    if (!existingUser) {
      const regularUser = userRepository.create({
        email: "user@crm.com",
        name: "Regular User",
        password: "user123",
        role: "user"
      });
      await userRepository.save(regularUser);
      console.log("✅ Created regular user: user@crm.com / user123");
    }

    console.log("🎉 Seeding completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding error:", error);
    process.exit(1);
  }
}

seed(); 