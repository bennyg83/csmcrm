import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from "typeorm";
import { MinLength, IsOptional } from "class-validator";

export type ProjectType = "Onboarding" | "Expansion" | "POV_POC" | "Risk" | "Adoption";
export type ProjectStatus = "Planning" | "Active" | "On Hold" | "Completed" | "Cancelled";

@Entity("projects")
export class Project {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  accountId!: string;

  @Column({
    type: "enum",
    enum: ["Onboarding", "Expansion", "POV_POC", "Risk", "Adoption"],
  })
  type!: ProjectType;

  @Column()
  @MinLength(2)
  name!: string;

  @Column({ type: "text", nullable: true })
  @IsOptional()
  description?: string;

  @Column({
    type: "enum",
    enum: ["Planning", "Active", "On Hold", "Completed", "Cancelled"],
    default: "Planning",
  })
  status!: ProjectStatus;

  @Column({ type: "timestamp", nullable: true })
  @IsOptional()
  startDate?: Date;

  @Column({ type: "timestamp", nullable: true })
  @IsOptional()
  targetDate?: Date;

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

  @ManyToOne("Account", "projects")
  @JoinColumn({ name: "accountId" })
  account!: any;

  @OneToMany("Milestone", "project")
  milestones!: any[];

  @OneToMany("Task", "project")
  tasks!: any[];

  @OneToMany("ProjectContact", "project")
  projectContacts!: any[];
}
