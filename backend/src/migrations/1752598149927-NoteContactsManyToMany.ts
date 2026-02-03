import { MigrationInterface, QueryRunner } from "typeorm";

export class NoteContactsManyToMany1752598149927 implements MigrationInterface {
  name = "NoteContactsManyToMany1752598149927";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "note_contacts" (
        "noteId" uuid NOT NULL,
        "contactId" uuid NOT NULL,
        CONSTRAINT "PK_note_contacts" PRIMARY KEY ("noteId", "contactId"),
        CONSTRAINT "FK_note_contacts_note" FOREIGN KEY ("noteId") REFERENCES "notes"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_note_contacts_contact" FOREIGN KEY ("contactId") REFERENCES "contacts"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      INSERT INTO "note_contacts" ("noteId", "contactId")
      SELECT id, "contactId" FROM notes WHERE "contactId" IS NOT NULL
    `);
    await queryRunner.query(`ALTER TABLE "notes" DROP COLUMN IF EXISTS "contactId"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "notes" ADD COLUMN "contactId" uuid`);
    await queryRunner.query(`
      UPDATE notes n SET "contactId" = (
        SELECT nc."contactId" FROM note_contacts nc WHERE nc."noteId" = n.id LIMIT 1
      )
    `);
    await queryRunner.query(`DROP TABLE IF EXISTS "note_contacts"`);
  }
}
