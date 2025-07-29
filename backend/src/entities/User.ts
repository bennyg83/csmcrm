import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
  BeforeUpdate,
  ManyToOne,
  JoinColumn
} from "typeorm";
import { IsEmail, MinLength, IsOptional } from "class-validator";
import * as bcrypt from "bcryptjs";
import { Role } from "./Role";

@Entity("users")
export class User {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ unique: true })
  @IsEmail()
  email!: string;

  @Column()
  @MinLength(2)
  name!: string;

  @Column({ nullable: true })
  @MinLength(6)
  @IsOptional()
  password?: string;

  @Column({ nullable: true })
  @IsOptional()
  legacyRole?: "admin" | "user" | "manager" | "sales" | "support";

  // New RBAC relationship
  @Column({ nullable: true })
  roleId?: string;

  // RBAC relationship
  @ManyToOne(() => Role, role => role.users, { nullable: true })
  @JoinColumn({ name: "roleId" })
  role?: Role;

  // Google SSO fields
  @Column({ nullable: true, unique: true })
  @IsOptional()
  googleId?: string;

  @Column({ nullable: true })
  @IsOptional()
  googleAccessToken?: string;

  @Column({ nullable: true })
  @IsOptional()
  googleRefreshToken?: string;

  @Column({ nullable: true })
  @IsOptional()
  googleTokenExpiry?: Date;

  @Column({ nullable: true })
  @IsOptional()
  avatar?: string;

  @Column({ default: false })
  isGoogleUser!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword() {
    // Only hash password if it exists and user is not a Google user
    if (this.password && !this.isGoogleUser) {
      this.password = await bcrypt.hash(this.password, 10);
    }
  }

  async comparePassword(password: string): Promise<boolean> {
    if (!this.password) return false;
    return bcrypt.compare(password, this.password);
  }

  // Helper method to update Google tokens
  updateGoogleTokens(accessToken: string, refreshToken?: string, expiryDate?: Date) {
    this.googleAccessToken = accessToken;
    if (refreshToken) {
      this.googleRefreshToken = refreshToken;
    }
    if (expiryDate) {
      this.googleTokenExpiry = expiryDate;
    }
  }

  // Check if Google token is expired
  isGoogleTokenExpired(): boolean {
    if (!this.googleTokenExpiry) return true;
    return new Date() >= this.googleTokenExpiry;
  }

  // RBAC helper methods
  getRoleName(): string {
    return this.role?.name || this.legacyRole || 'user';
  }

  hasPermission(permissionName: string): boolean {
    return this.role?.hasPermission(permissionName) || false;
  }

  hasAnyPermission(permissionNames: string[]): boolean {
    return this.role?.hasAnyPermission(permissionNames) || false;
  }

  hasAllPermissions(permissionNames: string[]): boolean {
    return this.role?.hasAllPermissions(permissionNames) || false;
  }

  isAdmin(): boolean {
    return this.getRoleName() === 'admin' || this.legacyRole === 'admin';
  }

  isManager(): boolean {
    return this.getRoleName() === 'manager' || this.legacyRole === 'manager';
  }
} 