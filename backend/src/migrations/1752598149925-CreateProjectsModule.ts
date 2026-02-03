import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateProjectsModule1752598149925 implements MigrationInterface {
  name = "CreateProjectsModule1752598149925";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "public"."projects_type_enum" AS ENUM(
        'Onboarding', 'Expansion', 'POV_POC', 'Risk', 'Adoption'
      )
    `);
    await queryRunner.query(`
      CREATE TYPE "public"."projects_status_enum" AS ENUM(
        'Planning', 'Active', 'On Hold', 'Completed', 'Cancelled'
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "projects" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "accountId" uuid NOT NULL,
        "type" "public"."projects_type_enum" NOT NULL,
        "name" varchar NOT NULL,
        "description" text,
        "status" "public"."projects_status_enum" NOT NULL DEFAULT 'Planning',
        "startDate" timestamp,
        "targetDate" timestamp,
        "createdBy" varchar,
        "createdByName" varchar,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "PK_projects" PRIMARY KEY ("id"),
        CONSTRAINT "FK_projects_account" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "public"."milestones_status_enum" AS ENUM(
        'Pending', 'In Progress', 'Done', 'Skipped'
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "milestones" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "projectId" uuid NOT NULL,
        "name" varchar NOT NULL,
        "deliverable" text,
        "dueDate" timestamp NOT NULL,
        "status" "public"."milestones_status_enum" NOT NULL DEFAULT 'Pending',
        "sortOrder" int NOT NULL DEFAULT 0,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "PK_milestones" PRIMARY KEY ("id"),
        CONSTRAINT "FK_milestones_project" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "public"."project_contacts_role_enum" AS ENUM(
        'sponsor', 'technical', 'business', 'internal_csm', 'internal_am', 'internal_se', 'other'
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "project_contacts" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "projectId" uuid NOT NULL,
        "contactId" uuid,
        "userId" uuid,
        "role" "public"."project_contacts_role_enum" NOT NULL DEFAULT 'other',
        "notes" varchar,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "PK_project_contacts" PRIMARY KEY ("id"),
        CONSTRAINT "FK_project_contacts_project" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_project_contacts_contact" FOREIGN KEY ("contactId") REFERENCES "contacts"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_project_contacts_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "tasks"
      ADD COLUMN "projectId" uuid,
      ADD COLUMN "milestoneId" uuid
    `);
    await queryRunner.query(`
      ALTER TABLE "tasks"
      ADD CONSTRAINT "FK_tasks_project" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE SET NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "tasks"
      ADD CONSTRAINT "FK_tasks_milestone" FOREIGN KEY ("milestoneId") REFERENCES "milestones"("id") ON DELETE SET NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "tasks" DROP CONSTRAINT IF EXISTS "FK_tasks_milestone"`);
    await queryRunner.query(`ALTER TABLE "tasks" DROP CONSTRAINT IF EXISTS "FK_tasks_project"`);
    await queryRunner.query(`ALTER TABLE "tasks" DROP COLUMN IF EXISTS "milestoneId"`);
    await queryRunner.query(`ALTER TABLE "tasks" DROP COLUMN IF EXISTS "projectId"`);
    await queryRunner.query(`DROP TABLE "project_contacts"`);
    await queryRunner.query(`DROP TYPE "public"."project_contacts_role_enum"`);
    await queryRunner.query(`DROP TABLE "milestones"`);
    await queryRunner.query(`DROP TYPE "public"."milestones_status_enum"`);
    await queryRunner.query(`DROP TABLE "projects"`);
    await queryRunner.query(`DROP TYPE "public"."projects_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."projects_type_enum"`);
  }
}
