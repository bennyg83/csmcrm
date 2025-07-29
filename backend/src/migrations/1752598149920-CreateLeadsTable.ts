import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateLeadsTable1752598149920 implements MigrationInterface {
    name = 'CreateLeadsTable1752598149920'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TYPE "public"."leads_status_enum" AS ENUM('New', 'Qualified', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost')
        `);
        
        await queryRunner.query(`
            CREATE TYPE "public"."leads_type_enum" AS ENUM('Upsell', 'Cross-sell', 'Renewal', 'New Product')
        `);
        
        await queryRunner.query(`
            CREATE TYPE "public"."leads_priority_enum" AS ENUM('Low', 'Medium', 'High')
        `);

        await queryRunner.query(`
            CREATE TABLE "leads" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "title" character varying NOT NULL,
                "description" text NOT NULL,
                "status" "public"."leads_status_enum" NOT NULL DEFAULT 'New',
                "type" "public"."leads_type_enum" NOT NULL DEFAULT 'Upsell',
                "priority" "public"."leads_priority_enum" NOT NULL DEFAULT 'Medium',
                "estimatedValue" decimal(10,2) NOT NULL DEFAULT '0',
                "actualValue" decimal(10,2) NOT NULL DEFAULT '0',
                "expectedCloseDate" TIMESTAMP,
                "closedDate" TIMESTAMP,
                "probability" integer NOT NULL DEFAULT '0',
                "accountId" uuid,
                "accountName" character varying,
                "contactId" uuid,
                "contactName" character varying,
                "contactEmail" character varying,
                "contactPhone" character varying,
                "assignedTo" uuid,
                "assignedToName" character varying,
                "createdBy" uuid,
                "createdByName" character varying,
                "tags" json DEFAULT '[]',
                "notes" json DEFAULT '[]',
                "activities" json DEFAULT '[]',
                "customFields" json,
                "nextSteps" text,
                "objections" text,
                "competitiveInfo" text,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_leads_id" PRIMARY KEY ("id")
            )
        `);

        await queryRunner.query(`
            ALTER TABLE "leads" ADD CONSTRAINT "FK_leads_account" 
            FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE SET NULL
        `);

        await queryRunner.query(`
            ALTER TABLE "leads" ADD CONSTRAINT "FK_leads_contact" 
            FOREIGN KEY ("contactId") REFERENCES "contacts"("id") ON DELETE SET NULL
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "leads" DROP CONSTRAINT "FK_leads_contact"`);
        await queryRunner.query(`ALTER TABLE "leads" DROP CONSTRAINT "FK_leads_account"`);
        await queryRunner.query(`DROP TABLE "leads"`);
        await queryRunner.query(`DROP TYPE "public"."leads_priority_enum"`);
        await queryRunner.query(`DROP TYPE "public"."leads_type_enum"`);
        await queryRunner.query(`DROP TYPE "public"."leads_status_enum"`);
    }
} 