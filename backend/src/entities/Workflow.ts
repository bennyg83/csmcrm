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

@Entity("workflows")
export class Workflow {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  @MinLength(2)
  name!: string;

  @Column({ type: "text" })
  description!: string;

  @Column({
    type: "enum",
    enum: ["Account", "Contact", "Task", "Lead", "Email", "Health Score"],
    default: "Account"
  })
  triggerType!: "Account" | "Contact" | "Task" | "Lead" | "Email" | "Health Score";

  @Column({
    type: "enum",
    enum: ["Active", "Inactive", "Draft"],
    default: "Draft"
  })
  status!: "Active" | "Inactive" | "Draft";

  @Column({ type: "json" })
  conditions!: Array<{
    field: string;
    operator: "equals" | "not_equals" | "contains" | "greater_than" | "less_than" | "is_empty" | "is_not_empty";
    value: any;
    logicalOperator?: "AND" | "OR";
  }>;

  @Column({ type: "json" })
  actions!: Array<{
    type: "create_task" | "send_email" | "update_field" | "assign_user" | "send_notification" | "create_lead" | "update_health_score";
    config: Record<string, any>;
    delay?: number; // Delay in minutes
  }>;

  @Column({ type: "int", default: 0 })
  priority!: number;

  @Column({ default: true })
  isEnabled!: boolean;

  @Column({ type: "json", nullable: true })
  @IsOptional()
  schedule?: {
    type: "immediate" | "delayed" | "recurring";
    delayMinutes?: number;
    cronExpression?: string;
    timezone?: string;
  };

  @Column({ type: "json", nullable: true })
  @IsOptional()
  targetUsers?: string[];

  @Column({ type: "json", nullable: true })
  @IsOptional()
  targetRoles?: string[];

  @Column({ type: "int", default: 0 })
  executionCount!: number;

  @Column({ type: "timestamp", nullable: true })
  @IsOptional()
  lastExecuted?: Date;

  @Column({ type: "json", nullable: true })
  @IsOptional()
  executionHistory?: Array<{
    timestamp: Date;
    trigger: string;
    result: "success" | "failed";
    error?: string;
  }>;

  @Column({ nullable: true })
  @IsOptional()
  createdBy?: string;

  @Column({ nullable: true })
  @IsOptional()
  createdByName?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
} 