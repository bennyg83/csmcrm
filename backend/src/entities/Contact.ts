import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn
} from "typeorm";
import { MinLength, IsEmail, IsOptional } from "class-validator";

@Entity("contacts")
export class Contact {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  accountId!: string;

  @Column()
  @MinLength(2)
  firstName!: string;

  @Column()
  @MinLength(2)
  lastName!: string;

  @Column()
  @IsEmail()
  email!: string;

  @Column()
  phone!: string;

  @Column({ nullable: true })
  @IsOptional()
  title?: string;

  @Column({ default: false })
  isPrimary!: boolean;

  @Column({ type: "json", default: [] })
  contactTypes!: string[];

  @Column({ nullable: true })
  @IsOptional()
  otherType?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @ManyToOne("Account", "contacts")
  @JoinColumn({ name: "accountId" })
  account!: any;

  @OneToMany("Note", "contact")
  notes!: any[];
} 