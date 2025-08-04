import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  BeforeInsert,
  BeforeUpdate
} from "typeorm";
import { MinLength, IsEmail, IsOptional } from "class-validator";
import * as bcrypt from "bcryptjs";

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

  // Portal access fields
  @Column({ default: false })
  hasPortalAccess!: boolean;

  @Column({ nullable: true })
  @IsOptional()
  portalPassword?: string;

  @Column({ nullable: true })
  @IsOptional()
  lastPortalLogin?: Date;

  @Column({ default: true })
  isPortalActive!: boolean;

  @Column({ nullable: true })
  @IsOptional()
  portalInviteToken?: string;

  @Column({ nullable: true })
  @IsOptional()
  portalInviteExpiry?: Date;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @ManyToOne("Account", "contacts")
  @JoinColumn({ name: "accountId" })
  account!: any;

  @OneToMany("Note", "contact")
  notes!: any[];

  @OneToMany("Email", "contact")
  emails!: any[];

  @BeforeInsert()
  @BeforeUpdate()
  async hashPortalPassword() {
    if (this.portalPassword && this.hasPortalAccess) {
      this.portalPassword = await bcrypt.hash(this.portalPassword, 10);
    }
  }

  async comparePortalPassword(password: string): Promise<boolean> {
    if (!this.portalPassword) return false;
    return bcrypt.compare(password, this.portalPassword);
  }

  // Helper method to generate portal invite token
  generatePortalInviteToken(): string {
    const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    this.portalInviteToken = token;
    this.portalInviteExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    return token;
  }

  // Check if portal invite is valid
  isPortalInviteValid(): boolean {
    return !!(this.portalInviteToken && this.portalInviteExpiry && this.portalInviteExpiry > new Date());
  }
} 