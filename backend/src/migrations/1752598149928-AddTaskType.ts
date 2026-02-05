import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTaskType1752598149928 implements MigrationInterface {
  name = "AddTaskType1752598149928";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "tasks" ADD "taskType" character varying(64)`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "tasks" DROP COLUMN "taskType"`);
  }
}
