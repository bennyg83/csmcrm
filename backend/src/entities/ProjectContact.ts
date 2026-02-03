import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { MinLength, IsOptional } from "class-validator";

export type ProjectContactRole =
  | "sponsor"
  | "technical"
  | "business"
  | "internal_csm"
  | "internal_am"
  | "internal_se"
  | "other";

@Entity("project_contacts")
export class ProjectContact {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  projectId!: string;

  @Column({ nullable: true })
  @IsOptional()
  contactId?: string;

  @Column({ nullable: true })
  @IsOptional()
  userId?: string;

  @Column({
    type: "enum",
    enum: ["sponsor", "technical", "business", "internal_csm", "internal_am", "internal_se", "other"],
    default: "other",
  })
  role!: ProjectContactRole;

  @Column({ nullable: true })
  @IsOptional()
  notes?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @ManyToOne("Project", "projectContacts")
  @JoinColumn({ name: "projectId" })
  project!: any;

  @ManyToOne("Contact", { nullable: true })
  @JoinColumn({ name: "contactId" })
  contact!: any;

  @ManyToOne("User", { nullable: true })
  @JoinColumn({ name: "userId" })
  user!: any;
}
