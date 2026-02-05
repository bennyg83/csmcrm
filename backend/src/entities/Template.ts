import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import { MinLength } from "class-validator";

@Entity("templates")
export class Template {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  @MinLength(2)
  name!: string;

  @Column({ type: "text" })
  body!: string;

  @Column({
    type: "enum",
    enum: ["email", "note"],
    default: "note",
  })
  type!: "email" | "note";

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
