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

@Entity("reports")
export class Report {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  @MinLength(2)
  name!: string;

  @Column({ type: "text" })
  description!: string;

  @Column({
    type: "enum",
    enum: ["Account", "Contact", "Task", "Lead", "User", "Activity", "Revenue", "Health Score"],
    default: "Account"
  })
  reportType!: "Account" | "Contact" | "Task" | "Lead" | "User" | "Activity" | "Revenue" | "Health Score";

  @Column({
    type: "enum",
    enum: ["Table", "Chart", "Dashboard", "Export"],
    default: "Table"
  })
  displayType!: "Table" | "Chart" | "Dashboard" | "Export";

  @Column({ type: "json" })
  columns!: Record<string, any>[];

  @Column({ type: "json", nullable: true })
  @IsOptional()
  filters?: Record<string, any>[];

  @Column({ type: "json", nullable: true })
  @IsOptional()
  sortBy?: Record<string, any>[];

  @Column({ type: "json", nullable: true })
  @IsOptional()
  groupBy?: string[];

  @Column({ type: "json", nullable: true })
  @IsOptional()
  aggregations?: Record<string, any>[];

  @Column({ type: "json", nullable: true })
  @IsOptional()
  chartConfig?: Record<string, any>;

  @Column({ type: "json", nullable: true })
  @IsOptional()
  schedule?: Record<string, any>;

  @Column({ default: true })
  isPublic!: boolean;

  @Column({ default: false })
  isDefault!: boolean;

  @Column({ type: "json", nullable: true })
  @IsOptional()
  permissions?: Record<string, any>;

  @Column({ type: "json", nullable: true })
  @IsOptional()
  customQuery?: string;

  @Column({ type: "int", default: 0 })
  viewCount!: number;

  @Column({ type: "timestamp", nullable: true })
  @IsOptional()
  lastViewed?: Date;

  @Column({ type: "timestamp", nullable: true })
  @IsOptional()
  lastGenerated?: Date;

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