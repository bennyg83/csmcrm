import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany
} from "typeorm";
import { MinLength, IsOptional } from "class-validator";

@Entity("categories")
export class Category {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  @MinLength(2)
  name!: string;

  @Column({ type: "text", nullable: true })
  @IsOptional()
  description?: string;

  @Column({ default: "#1976d2" })
  color!: string;

  @Column({ default: true })
  isActive!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @OneToMany("Task", "category")
  tasks!: any[];
} 