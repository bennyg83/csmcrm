import { AppDataSource } from "../config/data-source";
import { User } from "../entities/User";
import { Role } from "../entities/Role";

async function promoteAdmins(emails: string[]) {
  try {
    await AppDataSource.initialize();
    const userRepository = AppDataSource.getRepository(User);
    const roleRepository = AppDataSource.getRepository(Role);

    let adminRole = await roleRepository.findOne({ where: { name: "admin" } });
    if (!adminRole) {
      adminRole = roleRepository.create({ name: "admin", description: "System Administrator", isSystemRole: true, isActive: true });
      await roleRepository.save(adminRole);
    }

    for (const email of emails) {
      const user = await userRepository.findOne({ where: { email } });
      if (!user) {
        console.log(`User not found: ${email}`);
        continue;
      }
      user.legacyRole = "admin";
      user.roleId = adminRole.id;
      await userRepository.save(user);
      console.log(`Promoted to admin: ${email}`);
    }

    await AppDataSource.destroy();
    console.log("Done");
    process.exit(0);
  } catch (err) {
    console.error("Failed to promote admins:", err);
    process.exit(1);
  }
}

const args = process.argv.slice(2);
promoteAdmins(args);


