import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToOne,
  JoinColumn
} from 'typeorm';
import { Account } from './Account';
import { Contact } from './Contact';
import { Task } from './Task';

export enum ExternalUserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING = 'pending',
  SUSPENDED = 'suspended'
}

export enum ExternalUserRole {
  CLIENT_ADMIN = 'client_admin',
  CLIENT_USER = 'client_user',
  CLIENT_VIEWER = 'client_viewer'
}

@Entity('external_users')
export class ExternalUser {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  email!: string;

  @Column()
  password!: string;

  @Column()
  firstName!: string;

  @Column()
  lastName!: string;

  @Column({ nullable: true })
  phone?: string;

  @Column({
    type: 'enum',
    enum: ['active', 'inactive', 'pending', 'suspended'],
    default: 'pending'
  })
  status!: ExternalUserStatus;

  @Column({
    type: 'enum',
    enum: ['client_admin', 'client_user', 'client_viewer'],
    default: 'client_user'
  })
  role!: ExternalUserRole;

  @Column({ type: 'uuid' })
  accountId!: string;

  @ManyToOne(() => Account, account => account.externalUsers)
  @JoinColumn({ name: 'accountId' })
  account!: Account;

  @Column({ type: 'uuid', nullable: true })
  contactId?: string;

  @ManyToOne(() => Contact, contact => contact.externalUser)
  @JoinColumn({ name: 'contactId' })
  contact?: Contact;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'timestamp', nullable: true })
  lastLoginAt?: Date;

  @Column({ type: 'varchar', nullable: true })
  passwordResetToken?: string;

  @Column({ type: 'timestamp', nullable: true })
  passwordResetExpires?: Date;

  @Column({ default: false })
  emailVerified!: boolean;

  @Column({ type: 'timestamp', nullable: true })
  emailVerifiedAt?: Date;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // Virtual property for full name
  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  // Virtual property for display name
  get displayName(): string {
    return this.fullName;
  }
}
