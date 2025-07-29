import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToMany,
  JoinTable
} from "typeorm";
import { IsNotEmpty, IsOptional } from "class-validator";
import { User } from "./User";
import { Permission } from "./Permission";

@Entity("roles")
export class Role {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ unique: true })
  @IsNotEmpty()
  name!: string;

  @Column({ nullable: true })
  @IsOptional()
  description?: string;

  @Column({ default: false })
  isSystemRole!: boolean;

  @Column({ default: true })
  isActive!: boolean;

  @Column({ type: "jsonb", nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // Relationships
  @OneToMany(() => User, user => user.role)
  users!: User[];

  @ManyToMany(() => Permission, permission => permission.roles)
  @JoinTable({
    name: "role_permissions",
    joinColumn: { name: "roleId", referencedColumnName: "id" },
    inverseJoinColumn: { name: "permissionId", referencedColumnName: "id" }
  })
  permissions!: Permission[];

  // Helper methods
  hasPermission(permissionName: string): boolean {
    return this.permissions?.some(p => p.name === permissionName) || false;
  }

  hasAnyPermission(permissionNames: string[]): boolean {
    return this.permissions?.some(p => permissionNames.includes(p.name)) || false;
  }

  hasAllPermissions(permissionNames: string[]): boolean {
    return permissionNames.every(name => this.hasPermission(name));
  }
} 