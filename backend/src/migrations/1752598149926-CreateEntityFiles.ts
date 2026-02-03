import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateEntityFiles1752598149926 implements MigrationInterface {
  name = "CreateEntityFiles1752598149926";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "entity_files" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "storedPath" varchar NOT NULL,
        "originalName" varchar NOT NULL,
        "mimeType" varchar,
        "size" int NOT NULL DEFAULT 0,
        "entityType" varchar(20) NOT NULL,
        "entityId" uuid NOT NULL,
        "visibleToChildren" boolean NOT NULL DEFAULT false,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "createdById" uuid,
        CONSTRAINT "PK_entity_files" PRIMARY KEY ("id")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "entity_files"`);
  }
}
