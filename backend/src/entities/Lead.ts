import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany
} from "typeorm";
import { MinLength, Min, Max, IsOptional, IsEmail } from "class-validator";

@Entity("leads")
export class Lead {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  @MinLength(2)
  title!: string;

  @Column({ type: "text" })
  description!: string;

  @Column({
    type: "enum",
    enum: ["New", "Qualified", "Proposal", "Negotiation", "Closed Won", "Closed Lost"],
    default: "New"
  })
  status!: "New" | "Qualified" | "Proposal" | "Negotiation" | "Closed Won" | "Closed Lost";

  @Column({
    type: "enum",
    enum: ["Upsell", "Cross-sell", "Renewal", "New Product"],
    default: "Upsell"
  })
  type!: "Upsell" | "Cross-sell" | "Renewal" | "New Product";

  @Column({
    type: "enum",
    enum: ["Low", "Medium", "High"],
    default: "Medium"
  })
  priority!: "Low" | "Medium" | "High";

  @Column({ type: "decimal", precision: 10, scale: 2, default: 0 })
  estimatedValue!: number;

  @Column({ type: "decimal", precision: 10, scale: 2, default: 0 })
  actualValue!: number;

  @Column({ type: "timestamp", nullable: true })
  @IsOptional()
  expectedCloseDate?: Date;

  @Column({ type: "timestamp", nullable: true })
  @IsOptional()
  closedDate?: Date;

  @Column({ type: "int", default: 0 })
  @Min(0)
  @Max(100)
  probability!: number;

  @Column({ nullable: true })
  @IsOptional()
  accountId?: string;

  @Column({ nullable: true })
  @IsOptional()
  accountName?: string;

  @Column({ nullable: true })
  @IsOptional()
  contactId?: string;

  @Column({ nullable: true })
  @IsOptional()
  contactName?: string;

  @Column({ nullable: true })
  @IsOptional()
  contactEmail?: string;

  @Column({ nullable: true })
  @IsOptional()
  contactPhone?: string;

  @Column({ nullable: true })
  @IsOptional()
  assignedTo?: string;

  @Column({ nullable: true })
  @IsOptional()
  assignedToName?: string;

  @Column({ nullable: true })
  @IsOptional()
  createdBy?: string;

  @Column({ nullable: true })
  @IsOptional()
  createdByName?: string;

  @Column({ type: "json", default: [] })
  @IsOptional()
  tags?: string[];

  @Column({ type: "json", default: [] })
  @IsOptional()
  notes?: Array<{
    content: string;
    author: string;
    timestamp: Date;
  }>;

  @Column({ type: "json", default: [] })
  @IsOptional()
  activities?: Array<{
    type: string;
    description: string;
    date: Date;
    outcome?: string;
  }>;

  @Column({ type: "json", nullable: true })
  @IsOptional()
  customFields?: Record<string, any>;

  @Column({ type: "text", nullable: true })
  @IsOptional()
  nextSteps?: string;

  @Column({ type: "text", nullable: true })
  @IsOptional()
  objections?: string;

  @Column({ type: "text", nullable: true })
  @IsOptional()
  competitiveInfo?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @ManyToOne("Account", "leads")
  @JoinColumn({ name: "accountId" })
  account!: any;

  @ManyToOne("Contact", "leads")
  @JoinColumn({ name: "contactId" })
  contact!: any;
} 