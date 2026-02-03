import { AppDataSource } from '../config/data-source';

async function runMigration() {
  try {
    console.log('Initializing database connection...');
    await AppDataSource.initialize();
    
    console.log('Running migration: CreateExternalUsers...');
    const queryRunner = AppDataSource.createQueryRunner();
    
    // Create external_users table
    await queryRunner.createTable(
      {
        name: "external_users",
        columns: [
          { name: "id", type: "uuid", isPrimary: true, generationStrategy: "uuid", default: "uuid_generate_v4()" },
          { name: "email", type: "varchar", isUnique: true },
          { name: "password", type: "varchar" },
          { name: "firstName", type: "varchar" },
          { name: "lastName", type: "varchar" },
          { name: "phone", type: "varchar", isNullable: true },
          { name: "status", type: "enum", enum: ["active", "inactive", "pending", "suspended"], default: "'pending'" },
          { name: "role", type: "enum", enum: ["client_admin", "client_user", "client_viewer"], default: "'client_user'" },
          { name: "accountId", type: "uuid" },
          { name: "contactId", type: "uuid", isNullable: true },
          { name: "notes", type: "text", isNullable: true },
          { name: "lastLoginAt", type: "timestamp", isNullable: true },
          { name: "passwordResetToken", type: "varchar", isNullable: true },
          { name: "passwordResetExpires", type: "timestamp", isNullable: true },
          { name: "emailVerified", type: "boolean", default: false },
          { name: "emailVerifiedAt", type: "timestamp", isNullable: true },
          { name: "createdAt", type: "timestamp", default: "CURRENT_TIMESTAMP" },
          { name: "updatedAt", type: "timestamp", default: "CURRENT_TIMESTAMP" }
        ]
      },
      true
    );
    
    // Create indexes
    await queryRunner.createIndex("external_users", { name: "IDX_EXTERNAL_USERS_EMAIL", columnNames: ["email"] });
    await queryRunner.createIndex("external_users", { name: "IDX_EXTERNAL_USERS_ACCOUNT_ID", columnNames: ["accountId"] });
    await queryRunner.createIndex("external_users", { name: "IDX_EXTERNAL_USERS_CONTACT_ID", columnNames: ["contactId"] });
    await queryRunner.createIndex("external_users", { name: "IDX_EXTERNAL_USERS_STATUS", columnNames: ["status"] });
    
    // Create foreign key constraints
    await queryRunner.createForeignKey("external_users", { 
      columnNames: ["accountId"], 
      referencedColumnNames: ["id"], 
      referencedTableName: "accounts", 
      onDelete: "CASCADE" 
    });
    
    await queryRunner.createForeignKey("external_users", { 
      columnNames: ["contactId"], 
      referencedColumnNames: ["id"], 
      referencedTableName: "contacts", 
      onDelete: "SET NULL" 
    });
    
    console.log('Migration completed successfully!');
    
    await queryRunner.release();
    await AppDataSource.destroy();
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
