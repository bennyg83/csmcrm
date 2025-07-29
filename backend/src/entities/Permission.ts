import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
  JoinTable
} from "typeorm";
import { IsNotEmpty, IsOptional } from "class-validator";
import { Role } from "./Role";

@Entity("permissions")
export class Permission {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ unique: true })
  @IsNotEmpty()
  name!: string;

  @Column({ nullable: true })
  @IsOptional()
  description?: string;

  @Column({ nullable: true })
  @IsOptional()
  resource?: string;

  @Column({ nullable: true })
  @IsOptional()
  action?: string;

  @Column({ default: false })
  isSystemPermission!: boolean;

  @Column({ default: true })
  isActive!: boolean;

  @Column({ type: "jsonb", nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // Relationships
  @ManyToMany(() => Role, role => role.permissions)
  @JoinTable({
    name: "role_permissions",
    joinColumn: { name: "permissionId", referencedColumnName: "id" },
    inverseJoinColumn: { name: "roleId", referencedColumnName: "id" }
  })
  roles!: Role[];

  // Helper methods
  getFullPermissionName(): string {
    return `${this.resource}:${this.action}`;
  }

  matches(resource: string, action: string): boolean {
    return this.resource === resource && this.action === action;
  }
} 