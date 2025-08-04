import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn
} from "typeorm";
import { MinLength, IsOptional } from "class-validator";

@Entity("task_comments")
export class TaskComment {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  taskId!: string;

  @Column({ type: "text" })
  @MinLength(1)
  content!: string;

  @Column({
    type: "enum",
    enum: ["internal", "external"],
    default: "internal"
  })
  authorType!: "internal" | "external";

  @Column({ nullable: true })
  @IsOptional()
  authorId?: string; // User ID for internal, Contact ID for external

  @Column()
  authorName!: string;

  @Column({ nullable: true })
  @IsOptional()
  authorEmail?: string;

  @Column({ type: "json", nullable: true })
  @IsOptional()
  attachments?: Array<{
    filename: string;
    originalName: string;
    url: string;
    size: number;
    mimeType: string;
  }>;

  @Column({ default: false })
  isPrivate!: boolean; // Private comments only visible to internal users

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @ManyToOne("Task", "comments")
  @JoinColumn({ name: "taskId" })
  task!: any;
}