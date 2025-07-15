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
import { MinLength, Min, Max, IsEmail, IsOptional } from "class-validator";

@Entity("accounts")
export class Account {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  @MinLength(2)
  name!: string;

  @Column()
  @IsEmail()
  email!: string;

  @Column()
  phone!: string;

  @Column({ type: "text" })
  address!: string;

  @Column({ nullable: true })
  @IsOptional()
  industry?: string;

  @Column({ nullable: true })
  @IsOptional()
  website?: string;

  @Column({ type: "text", nullable: true })
  @IsOptional()
  description?: string;

  @Column()
  businessUseCase!: string;

  @Column()
  techStack!: string;

  @Column({ type: "int" })
  @Min(0)
  @Max(100)
  health!: number;

  @Column({ type: "decimal", precision: 15, scale: 2 })
  revenue!: number;

  @Column({ type: "date" })
  renewalDate!: Date;

  @Column({ type: "decimal", precision: 15, scale: 2 })
  arr!: number;

  @Column({ type: "int" })
  @Min(0)
  @Max(100)
  riskScore!: number;

  @Column({ type: "timestamp", nullable: true })
  @IsOptional()
  lastTouchpoint?: Date;

  @Column({ type: "timestamp", nullable: true })
  @IsOptional()
  nextScheduled?: Date;

  @Column()
  accountManager!: string;

  @Column()
  customerSuccessManager!: string;

  @Column()
  salesEngineer!: string;

  @Column()
  tierId!: string;

  @Column({
    type: "enum",
    enum: ["active", "at-risk", "inactive"],
    default: "active"
  })
  status!: "active" | "at-risk" | "inactive";

  @Column({ type: "int" })
  @Min(1)
  employees!: number;

  @Column({ type: "text", nullable: true })
  @IsOptional()
  accountNotes?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @ManyToOne("AccountTier", "accounts")
  @JoinColumn({ name: "tierId" })
  tier!: any;

  @OneToMany("Contact", "account")
  contacts!: any[];

  @OneToMany("Task", "account")
  tasks!: any[];

  @OneToMany("Note", "account")
  notes!: any[];

  @OneToMany("HealthScore", "account")
  healthScores!: any[];

  @OneToMany("AccountActivity", "account")
  activities!: any[];
} 