import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn
} from "typeorm";
import { MinLength } from "class-validator";

@Entity("account_activities")
export class AccountActivity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  accountId!: string;

  @Column()
  @MinLength(2)
  type!: string;

  @Column({ type: "text" })
  description!: string;

  @Column({ type: "timestamp" })
  date!: Date;

  @CreateDateColumn()
  createdAt!: Date;

  @ManyToOne("Account", "activities")
  @JoinColumn({ name: "accountId" })
  account!: any;
} 