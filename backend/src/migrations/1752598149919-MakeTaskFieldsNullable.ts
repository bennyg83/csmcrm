import { MigrationInterface, QueryRunner } from "typeorm";

export class MakeTaskFieldsNullable1752598149919 implements MigrationInterface {
    name = 'MakeTaskFieldsNullable1752598149919'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tasks" ALTER COLUMN "accountId" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "tasks" ALTER COLUMN "accountName" DROP NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tasks" ALTER COLUMN "accountName" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "tasks" ALTER COLUMN "accountId" SET NOT NULL`);
    }
} 