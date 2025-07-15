import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCategories1752598149916 implements MigrationInterface {
    name = 'AddCategories1752598149916'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "categories" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "description" text, "color" character varying NOT NULL DEFAULT '#1976d2', "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_24dbc6126a28ff948da33e97d3b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "tasks" ADD "tags" json NOT NULL DEFAULT '[]'`);
        await queryRunner.query(`ALTER TABLE "tasks" ADD "categoryId" uuid`);
        await queryRunner.query(`ALTER TABLE "accounts" ADD "accountNotes" text`);
        await queryRunner.query(`ALTER TABLE "contacts" ADD "contactTypes" json NOT NULL DEFAULT '[]'`);
        await queryRunner.query(`ALTER TABLE "contacts" ADD "otherType" character varying`);
        await queryRunner.query(`ALTER TABLE "tasks" DROP COLUMN "assignedTo"`);
        await queryRunner.query(`ALTER TABLE "tasks" ADD "assignedTo" json NOT NULL DEFAULT '[]'`);
        await queryRunner.query(`ALTER TABLE "tasks" DROP COLUMN "assignedToClient"`);
        await queryRunner.query(`ALTER TABLE "tasks" ADD "assignedToClient" json`);
        await queryRunner.query(`ALTER TABLE "tasks" ADD CONSTRAINT "FK_8ae9301033f772a42330e917a7d" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tasks" DROP CONSTRAINT "FK_8ae9301033f772a42330e917a7d"`);
        await queryRunner.query(`ALTER TABLE "tasks" DROP COLUMN "assignedToClient"`);
        await queryRunner.query(`ALTER TABLE "tasks" ADD "assignedToClient" character varying`);
        await queryRunner.query(`ALTER TABLE "tasks" DROP COLUMN "assignedTo"`);
        await queryRunner.query(`ALTER TABLE "tasks" ADD "assignedTo" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "contacts" DROP COLUMN "otherType"`);
        await queryRunner.query(`ALTER TABLE "contacts" DROP COLUMN "contactTypes"`);
        await queryRunner.query(`ALTER TABLE "accounts" DROP COLUMN "accountNotes"`);
        await queryRunner.query(`ALTER TABLE "tasks" DROP COLUMN "categoryId"`);
        await queryRunner.query(`ALTER TABLE "tasks" DROP COLUMN "tags"`);
        await queryRunner.query(`DROP TABLE "categories"`);
    }

}
