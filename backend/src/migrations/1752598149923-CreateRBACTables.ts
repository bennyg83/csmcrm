import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateRBACTables1752598149923 implements MigrationInterface {
    name = 'CreateRBACTables1752598149923'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create permissions table
        await queryRunner.query(`
            CREATE TABLE "permissions" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying NOT NULL,
                "description" character varying,
                "resource" character varying,
                "action" character varying,
                "isSystemPermission" boolean NOT NULL DEFAULT false,
                "isActive" boolean NOT NULL DEFAULT true,
                "metadata" jsonb,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_permissions_name" UNIQUE ("name"),
                CONSTRAINT "PK_permissions" PRIMARY KEY ("id")
            )
        `);

        // Create roles table
        await queryRunner.query(`
            CREATE TABLE "roles" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying NOT NULL,
                "description" character varying,
                "isSystemRole" boolean NOT NULL DEFAULT false,
                "isActive" boolean NOT NULL DEFAULT true,
                "metadata" jsonb,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_roles_name" UNIQUE ("name"),
                CONSTRAINT "PK_roles" PRIMARY KEY ("id")
            )
        `);

        // Create role_permissions junction table
        await queryRunner.query(`
            CREATE TABLE "role_permissions" (
                "roleId" uuid NOT NULL,
                "permissionId" uuid NOT NULL,
                CONSTRAINT "PK_role_permissions" PRIMARY KEY ("roleId", "permissionId")
            )
        `);

        // Add foreign key constraints
        await queryRunner.query(`
            ALTER TABLE "role_permissions" 
            ADD CONSTRAINT "FK_role_permissions_roleId" 
            FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);

        await queryRunner.query(`
            ALTER TABLE "role_permissions" 
            ADD CONSTRAINT "FK_role_permissions_permissionId" 
            FOREIGN KEY ("permissionId") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);

        // Add roleId column to users table
        await queryRunner.query(`
            ALTER TABLE "users" 
            ADD COLUMN "roleId" uuid,
            ADD COLUMN "legacyRole" character varying
        `);

        // Add foreign key constraint for users.roleId
        await queryRunner.query(`
            ALTER TABLE "users" 
            ADD CONSTRAINT "FK_users_roleId" 
            FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE SET NULL ON UPDATE NO ACTION
        `);

        // Create indexes for better performance
        await queryRunner.query(`
            CREATE INDEX "IDX_permissions_name" ON "permissions" ("name")
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_roles_name" ON "roles" ("name")
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_users_roleId" ON "users" ("roleId")
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_role_permissions_roleId" ON "role_permissions" ("roleId")
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_role_permissions_permissionId" ON "role_permissions" ("permissionId")
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop indexes
        await queryRunner.query(`DROP INDEX "IDX_role_permissions_permissionId"`);
        await queryRunner.query(`DROP INDEX "IDX_role_permissions_roleId"`);
        await queryRunner.query(`DROP INDEX "IDX_users_roleId"`);
        await queryRunner.query(`DROP INDEX "IDX_roles_name"`);
        await queryRunner.query(`DROP INDEX "IDX_permissions_name"`);

        // Drop foreign key constraints
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_users_roleId"`);
        await queryRunner.query(`ALTER TABLE "role_permissions" DROP CONSTRAINT "FK_role_permissions_permissionId"`);
        await queryRunner.query(`ALTER TABLE "role_permissions" DROP CONSTRAINT "FK_role_permissions_roleId"`);

        // Drop columns from users table
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "legacyRole"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "roleId"`);

        // Drop tables
        await queryRunner.query(`DROP TABLE "role_permissions"`);
        await queryRunner.query(`DROP TABLE "roles"`);
        await queryRunner.query(`DROP TABLE "permissions"`);
    }
} 