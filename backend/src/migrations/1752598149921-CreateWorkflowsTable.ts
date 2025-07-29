import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateWorkflowsTable1752598149921 implements MigrationInterface {
    name = 'CreateWorkflowsTable1752598149921'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TYPE "public"."workflows_trigger_type_enum" AS ENUM('Account', 'Contact', 'Task', 'Lead', 'Email', 'Health Score')
        `);
        
        await queryRunner.query(`
            CREATE TYPE "public"."workflows_status_enum" AS ENUM('Active', 'Inactive', 'Draft')
        `);

        await queryRunner.query(`
            CREATE TABLE "workflows" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying NOT NULL,
                "description" text NOT NULL,
                "triggerType" "public"."workflows_trigger_type_enum" NOT NULL DEFAULT 'Account',
                "status" "public"."workflows_status_enum" NOT NULL DEFAULT 'Draft',
                "conditions" json NOT NULL,
                "actions" json NOT NULL,
                "priority" integer NOT NULL DEFAULT '0',
                "isEnabled" boolean NOT NULL DEFAULT true,
                "schedule" json,
                "targetUsers" json,
                "targetRoles" json,
                "executionCount" integer NOT NULL DEFAULT '0',
                "lastExecuted" TIMESTAMP,
                "executionHistory" json,
                "createdBy" uuid,
                "createdByName" character varying,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_workflows_id" PRIMARY KEY ("id")
            )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "workflows"`);
        await queryRunner.query(`DROP TYPE "public"."workflows_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."workflows_trigger_type_enum"`);
    }
} 