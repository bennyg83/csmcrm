import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany
} from "typeorm";
import { MinLength, Min } from "class-validator";
@Entity("account_tiers")
export class AccountTier {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  @MinLength(2)
  name!: string;

  @Column({ type: "text", nullable: true })
  description?: string;

  @Column({ type: "int" })
  @Min(1)
  slaHours!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @OneToMany("Account", "tier")
  accounts!: any[];
} 