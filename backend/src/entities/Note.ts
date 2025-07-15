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

@Entity("notes")
export class Note {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  accountId!: string;

  @Column({ nullable: true })
  @IsOptional()
  contactId?: string;

  @Column({ type: "text" })
  @MinLength(1)
  content!: string;

  @Column()
  author!: string;

  @Column({
    type: "enum",
    enum: ["general", "meeting", "call", "email"],
    default: "general"
  })
  type!: "general" | "meeting" | "call" | "email";

  @Column({ type: "json", default: [] })
  tags!: string[];

  @Column({ default: false })
  isPrivate!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @ManyToOne("Account", "notes")
  @JoinColumn({ name: "accountId" })
  account!: any;

  @ManyToOne("Contact", "notes")
  @JoinColumn({ name: "contactId" })
  contact?: any;
} 