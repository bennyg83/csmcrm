import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from "typeorm";

export class CreateExternalUsers1703123456789 implements MigrationInterface {
    name = 'CreateExternalUsers1703123456789'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create external_users table
        await queryRunner.createTable(
            new Table({
                name: "external_users",
                columns: [
                    {
                        name: "id",
                        type: "uuid",
                        isPrimary: true,
                        generationStrategy: "uuid",
                        default: "uuid_generate_v4()"
                    },
                    {
                        name: "email",
                        type: "varchar",
                        isUnique: true
                    },
                    {
                        name: "password",
                        type: "varchar"
                    },
                    {
                        name: "firstName",
                        type: "varchar"
                    },
                    {
                        name: "lastName",
                        type: "varchar"
                    },
                    {
                        name: "phone",
                        type: "varchar",
                        isNullable: true
                    },
                    {
                        name: "status",
                        type: "enum",
                        enum: ["active", "inactive", "pending", "suspended"],
                        default: "'pending'"
                    },
                    {
                        name: "role",
                        type: "enum",
                        enum: ["client_admin", "client_user", "client_viewer"],
                        default: "'client_user'"
                    },
                    {
                        name: "accountId",
                        type: "uuid"
                    },
                    {
                        name: "contactId",
                        type: "uuid",
                        isNullable: true
                    },
                    {
                        name: "notes",
                        type: "text",
                        isNullable: true
                    },
                    {
                        name: "lastLoginAt",
                        type: "timestamp",
                        isNullable: true
                    },
                    {
                        name: "passwordResetToken",
                        type: "varchar",
                        isNullable: true
                    },
                    {
                        name: "passwordResetExpires",
                        type: "timestamp",
                        isNullable: true
                    },
                    {
                        name: "emailVerified",
                        type: "boolean",
                        default: false
                    },
                    {
                        name: "emailVerifiedAt",
                        type: "timestamp",
                        isNullable: true
                    },
                    {
                        name: "createdAt",
                        type: "timestamp",
                        default: "CURRENT_TIMESTAMP"
                    },
                    {
                        name: "updatedAt",
                        type: "timestamp",
                        default: "CURRENT_TIMESTAMP"
                    }
                ]
            }),
            true
        );

        // Create indexes
        await queryRunner.createIndex(
            "external_users",
            new TableIndex({
                name: "IDX_EXTERNAL_USERS_EMAIL",
                columnNames: ["email"]
            })
        );

        await queryRunner.createIndex(
            "external_users",
            new TableIndex({
                name: "IDX_EXTERNAL_USERS_ACCOUNT_ID",
                columnNames: ["accountId"]
            })
        );

        await queryRunner.createIndex(
            "external_users",
            new TableIndex({
                name: "IDX_EXTERNAL_USERS_CONTACT_ID",
                columnNames: ["contactId"]
            })
        );

        await queryRunner.createIndex(
            "external_users",
            new TableIndex({
                name: "IDX_EXTERNAL_USERS_STATUS",
                columnNames: ["status"]
            })
        );

        // Create foreign key constraints
        await queryRunner.createForeignKey(
            "external_users",
            new TableForeignKey({
                columnNames: ["accountId"],
                referencedColumnNames: ["id"],
                referencedTableName: "accounts",
                onDelete: "CASCADE"
            })
        );

        await queryRunner.createForeignKey(
            "external_users",
            new TableForeignKey({
                columnNames: ["contactId"],
                referencedColumnNames: ["id"],
                referencedTableName: "contacts",
                onDelete: "SET NULL"
            })
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop foreign keys first
        const table = await queryRunner.getTable("external_users");
        if (table) {
            const foreignKeys = table.foreignKeys;
            for (const foreignKey of foreignKeys) {
                await queryRunner.dropForeignKey("external_users", foreignKey);
            }
        }

        // Drop indexes
        await queryRunner.dropIndex("external_users", "IDX_EXTERNAL_USERS_EMAIL");
        await queryRunner.dropIndex("external_users", "IDX_EXTERNAL_USERS_ACCOUNT_ID");
        await queryRunner.dropIndex("external_users", "IDX_EXTERNAL_USERS_CONTACT_ID");
        await queryRunner.dropIndex("external_users", "IDX_EXTERNAL_USERS_STATUS");

        // Drop table
        await queryRunner.dropTable("external_users");
    }
}
