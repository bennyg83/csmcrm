import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from "typeorm";

export type EntityFileOwnerType = "task" | "project" | "account";

@Entity("entity_files")
export class EntityFile {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  storedPath!: string;

  @Column()
  originalName!: string;

  @Column({ nullable: true })
  mimeType?: string;

  @Column({ type: "int", default: 0 })
  size!: number;

  @Column({ type: "varchar", length: 20 })
  entityType!: EntityFileOwnerType;

  @Column("uuid")
  entityId!: string;

  /** When true (project/account only): file is visible from child entities (tasks under project; projects and tasks under account). */
  @Column({ type: "boolean", default: false })
  visibleToChildren!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @Column({ type: "uuid", nullable: true })
  createdById?: string;
}
