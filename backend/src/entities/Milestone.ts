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

export type MilestoneStatus = "Pending" | "In Progress" | "Done" | "Skipped";

@Entity("milestones")
export class Milestone {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  projectId!: string;

  @Column()
  @MinLength(2)
  name!: string;

  @Column({ type: "text", nullable: true })
  @IsOptional()
  deliverable?: string;

  @Column({ type: "timestamp" })
  dueDate!: Date;

  @Column({
    type: "enum",
    enum: ["Pending", "In Progress", "Done", "Skipped"],
    default: "Pending",
  })
  status!: MilestoneStatus;

  @Column({ type: "int", default: 0 })
  sortOrder!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @ManyToOne("Project", "milestones")
  @JoinColumn({ name: "projectId" })
  project!: any;

  @OneToMany("Task", "milestone")
  tasks!: any[];
}
