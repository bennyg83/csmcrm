import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPortalAccessAndTaskComments1752598149924 implements MigrationInterface {
    name = 'AddPortalAccessAndTaskComments1752598149924'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add portal access fields to contacts table
        await queryRunner.query(`
            ALTER TABLE "contacts" 
            ADD COLUMN "hasPortalAccess" boolean NOT NULL DEFAULT false,
            ADD COLUMN "portalPassword" varchar,
            ADD COLUMN "lastPortalLogin" timestamp,
            ADD COLUMN "isPortalActive" boolean NOT NULL DEFAULT true,
            ADD COLUMN "portalInviteToken" varchar,
            ADD COLUMN "portalInviteExpiry" timestamp
        `);

        // Create task_comments table
        await queryRunner.query(`
            CREATE TABLE "task_comments" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "taskId" uuid NOT NULL,
                "content" text NOT NULL,
                "authorType" varchar NOT NULL DEFAULT 'internal',
                "authorId" uuid,
                "authorName" varchar NOT NULL,
                "authorEmail" varchar,
                "attachments" jsonb,
                "isPrivate" boolean NOT NULL DEFAULT false,
                "createdAt" timestamp NOT NULL DEFAULT now(),
                "updatedAt" timestamp NOT NULL DEFAULT now(),
                CONSTRAINT "PK_task_comments" PRIMARY KEY ("id")
            )
        `);

        // Add foreign key constraint for task_comments
        await queryRunner.query(`
            ALTER TABLE "task_comments" 
            ADD CONSTRAINT "FK_task_comments_task" 
            FOREIGN KEY ("taskId") REFERENCES "tasks"("id") 
            ON DELETE CASCADE
        `);

        // Add check constraints
        await queryRunner.query(`
            ALTER TABLE "task_comments" 
            ADD CONSTRAINT "CHK_task_comments_author_type" 
            CHECK ("authorType" IN ('internal', 'external'))
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop task_comments table
        await queryRunner.query(`DROP TABLE "task_comments"`);
        
        // Remove portal access fields from contacts table
        await queryRunner.query(`
            ALTER TABLE "contacts" 
            DROP COLUMN "hasPortalAccess",
            DROP COLUMN "portalPassword",
            DROP COLUMN "lastPortalLogin",
            DROP COLUMN "isPortalActive",
            DROP COLUMN "portalInviteToken",
            DROP COLUMN "portalInviteExpiry"
        `);
    }
}