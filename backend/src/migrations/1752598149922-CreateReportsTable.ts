import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateReportsTable1752598149922 implements MigrationInterface {
    name = 'CreateReportsTable1752598149922'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TYPE "public"."reports_report_type_enum" AS ENUM('Account', 'Contact', 'Task', 'Lead', 'User', 'Activity', 'Revenue', 'Health Score')
        `);
        
        await queryRunner.query(`
            CREATE TYPE "public"."reports_display_type_enum" AS ENUM('Table', 'Chart', 'Dashboard', 'Export')
        `);

        await queryRunner.query(`
            CREATE TABLE "reports" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying NOT NULL,
                "description" text NOT NULL,
                "reportType" "public"."reports_report_type_enum" NOT NULL DEFAULT 'Account',
                "displayType" "public"."reports_display_type_enum" NOT NULL DEFAULT 'Table',
                "columns" json NOT NULL,
                "filters" json,
                "sortBy" json,
                "groupBy" json,
                "aggregations" json,
                "chartConfig" json,
                "schedule" json,
                "isPublic" boolean NOT NULL DEFAULT true,
                "isDefault" boolean NOT NULL DEFAULT false,
                "permissions" json,
                "customQuery" json,
                "viewCount" integer NOT NULL DEFAULT '0',
                "lastViewed" TIMESTAMP,
                "lastGenerated" TIMESTAMP,
                "createdBy" uuid,
                "createdByName" character varying,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_reports_id" PRIMARY KEY ("id")
            )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "reports"`);
        await queryRunner.query(`DROP TYPE "public"."reports_display_type_enum"`);
        await queryRunner.query(`DROP TYPE "public"."reports_report_type_enum"`);
    }
} 