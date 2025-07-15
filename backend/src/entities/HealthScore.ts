import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn
} from "typeorm";
import { Min, Max } from "class-validator";

@Entity("health_scores")
export class HealthScore {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  accountId!: string;

  @Column({ type: "int" })
  @Min(0)
  @Max(100)
  score!: number;

  @Column({ type: "json", default: [] })
  factors!: string[];

  @Column({ type: "date" })
  date!: Date;

  @CreateDateColumn()
  createdAt!: Date;

  @ManyToOne("Account", "healthScores")
  @JoinColumn({ name: "accountId" })
  account!: any;
} 