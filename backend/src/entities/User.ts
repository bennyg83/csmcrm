import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
  BeforeUpdate
} from "typeorm";
import { IsEmail, MinLength, IsOptional } from "class-validator";
import * as bcrypt from "bcryptjs";

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

  @Column({
    type: "enum",
    enum: ["admin", "user", "manager", "sales", "support"],
    default: "user"
  })
  role!: "admin" | "user" | "manager" | "sales" | "support";

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
} 