import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn
} from "typeorm";
import { MinLength, Min, Max, IsOptional } from "class-validator";

@Entity("tasks")
export class Task {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  @MinLength(2)
  title!: string;

  @Column({ type: "text" })
  description!: string;

  @Column({
    type: "enum",
    enum: ["To Do", "In Progress", "Completed", "Cancelled"],
    default: "To Do"
  })
  status!: "To Do" | "In Progress" | "Completed" | "Cancelled";

  @Column({
    type: "enum",
    enum: ["Low", "Medium", "High"],
    default: "Medium"
  })
  priority!: "Low" | "Medium" | "High";

  @Column({ type: "timestamp" })
  dueDate!: Date;

  @Column({ type: "json", default: [] })
  assignedTo!: string[];

  @Column({ type: "json", nullable: true })
  @IsOptional()
  assignedToClient?: string[];

  @Column({ nullable: true })
  @IsOptional()
  accountId?: string;

  @Column({ nullable: true })
  @IsOptional()
  accountName?: string;

  @Column({ type: "json", default: [] })
  subTasks!: any[];

  @Column({ type: "json", default: [] })
  dependencies!: string[];

  @Column({ default: false })
  isDependent!: boolean;

  @Column({ type: "json", default: [] })
  @IsOptional()
  tags?: string[];

  @Column({ nullable: true })
  @IsOptional()
  categoryId?: string;

  @Column({ nullable: true })
  @IsOptional()
  projectId?: string;

  @Column({ nullable: true })
  @IsOptional()
  milestoneId?: string;

  @Column({ nullable: true })
  @IsOptional()
  googleCalendarEventId?: string;

  @Column({ type: "int" })
  @Min(0)
  @Max(100)
  progress!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @ManyToOne("Account", "tasks")
  @JoinColumn({ name: "accountId" })
  account!: any;

  @ManyToOne("Category", "tasks")
  @JoinColumn({ name: "categoryId" })
  category!: any;

  @ManyToOne("Project", "tasks")
  @JoinColumn({ name: "projectId" })
  project!: any;

  @ManyToOne("Milestone", "tasks")
  @JoinColumn({ name: "milestoneId" })
  milestone!: any;

  @OneToMany("TaskComment", "task")
  comments!: any[];
} 