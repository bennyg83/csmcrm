import { MigrationInterface, QueryRunner, Table, TableIndex } from "typeorm";

export class AddEmails1752598149917 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: "emails",
                columns: [
                    {
                        name: "id",
                        type: "uuid",
                        isPrimary: true,
                        generationStrategy: "uuid",
                        default: "gen_random_uuid()"
                    },
                    {
                        name: "gmail_message_id",
                        type: "varchar",
                        isNullable: true
                    },
                    {
                        name: "gmail_thread_id",
                        type: "varchar",
                        isNullable: true
                    },
                    {
                        name: "subject",
                        type: "varchar"
                    },
                    {
                        name: "body",
                        type: "text"
                    },
                    {
                        name: "body_html",
                        type: "text",
                        isNullable: true
                    },
                    {
                        name: "sender_email",
                        type: "varchar"
                    },
                    {
                        name: "sender_name",
                        type: "varchar",
                        isNullable: true
                    },
                    {
                        name: "recipient_emails",
                        type: "text",
                        isArray: true
                    },
                    {
                        name: "recipient_names",
                        type: "text",
                        isArray: true,
                        isNullable: true
                    },
                    {
                        name: "cc_emails",
                        type: "text",
                        isArray: true,
                        isNullable: true
                    },
                    {
                        name: "cc_names",
                        type: "text",
                        isArray: true,
                        isNullable: true
                    },
                    {
                        name: "date_sent",
                        type: "timestamp"
                    },
                    {
                        name: "is_sent",
                        type: "boolean",
                        default: false
                    },
                    {
                        name: "is_read",
                        type: "boolean",
                        default: false
                    },
                    {
                        name: "gmail_labels",
                        type: "text",
                        isArray: true,
                        isNullable: true
                    },
                    {
                        name: "snippet",
                        type: "varchar",
                        isNullable: true
                    },
                    {
                        name: "contact_id",
                        type: "uuid",
                        isNullable: true
                    },
                    {
                        name: "account_id",
                        type: "uuid",
                        isNullable: true
                    },
                    {
                        name: "user_id",
                        type: "uuid",
                        isNullable: true
                    },
                    {
                        name: "created_at",
                        type: "timestamp",
                        default: "now()"
                    },
                    {
                        name: "updated_at",
                        type: "timestamp",
                        default: "now()"
                    }
                ],
                foreignKeys: [
                    {
                        columnNames: ["contact_id"],
                        referencedTableName: "contacts",
                        referencedColumnNames: ["id"],
                        onDelete: "SET NULL"
                    },
                    {
                        columnNames: ["account_id"],
                        referencedTableName: "accounts",
                        referencedColumnNames: ["id"],
                        onDelete: "SET NULL"
                    },
                    {
                        columnNames: ["user_id"],
                        referencedTableName: "users",
                        referencedColumnNames: ["id"],
                        onDelete: "SET NULL"
                    }
                ]
            }),
            true
        );

        // Create indexes for better performance
        await queryRunner.createIndex("emails", new TableIndex({
            name: "IDX_emails_gmail_message_id",
            columnNames: ["gmail_message_id"]
        }));

        await queryRunner.createIndex("emails", new TableIndex({
            name: "IDX_emails_contact_id",
            columnNames: ["contact_id"]
        }));

        await queryRunner.createIndex("emails", new TableIndex({
            name: "IDX_emails_account_id",
            columnNames: ["account_id"]
        }));

        await queryRunner.createIndex("emails", new TableIndex({
            name: "IDX_emails_sender_email",
            columnNames: ["sender_email"]
        }));

        await queryRunner.createIndex("emails", new TableIndex({
            name: "IDX_emails_date_sent",
            columnNames: ["date_sent"]
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable("emails");
    }
} 