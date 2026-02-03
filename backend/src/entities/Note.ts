import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  ManyToMany,
  JoinColumn,
  JoinTable,
} from "typeorm";
import { MinLength } from "class-validator";

@Entity("notes")
export class Note {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  accountId!: string;

  @Column({ type: "text" })
  @MinLength(1)
  content!: string;

  @Column()
  author!: string;

  @Column({
    type: "enum",
    enum: ["general", "meeting", "call", "email"],
    default: "general",
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

  @ManyToMany("Contact", "notes", { cascade: true })
  @JoinTable({
    name: "note_contacts",
    joinColumn: { name: "noteId", referencedColumnName: "id" },
    inverseJoinColumn: { name: "contactId", referencedColumnName: "id" },
  })
  contacts!: any[];
} 