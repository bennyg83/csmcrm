import { MigrationInterface, QueryRunner } from "typeorm";

export class AddGoogleCalendarEventId1752598149918 implements MigrationInterface {
    name = 'AddGoogleCalendarEventId1752598149918'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tasks" ADD "googleCalendarEventId" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tasks" DROP COLUMN "googleCalendarEventId"`);
    }
} 