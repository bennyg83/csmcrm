import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Contact } from './Contact';
import { Account } from './Account';
import { User } from './User';

@Entity('emails')
export class Email {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'gmail_message_id', nullable: true })
  gmailMessageId!: string;

  @Column({ name: 'gmail_thread_id', nullable: true })
  gmailThreadId!: string;

  @Column()
  subject!: string;

  @Column({ type: 'text' })
  body!: string;

  @Column({ name: 'body_html', type: 'text', nullable: true })
  bodyHtml!: string;

  @Column({ name: 'sender_email' })
  senderEmail!: string;

  @Column({ name: 'sender_name', nullable: true })
  senderName!: string;

  @Column({ name: 'recipient_emails', type: 'text', array: true })
  recipientEmails!: string[];

  @Column({ name: 'recipient_names', type: 'text', array: true, nullable: true })
  recipientNames!: string[];

  @Column({ name: 'cc_emails', type: 'text', array: true, nullable: true })
  ccEmails!: string[];

  @Column({ name: 'cc_names', type: 'text', array: true, nullable: true })
  ccNames!: string[];

  @Column({ name: 'date_sent', type: 'timestamp' })
  dateSent!: Date;

  @Column({ name: 'is_sent', type: 'boolean', default: false })
  isSent!: boolean; // true if sent by us, false if received

  @Column({ name: 'is_read', type: 'boolean', default: false })
  isRead!: boolean;

  @Column({ name: 'gmail_labels', type: 'text', array: true, nullable: true })
  gmailLabels!: string[];

  @Column({ name: 'snippet', nullable: true })
  snippet!: string;

  // Foreign Keys
  @Column({ name: 'contact_id', nullable: true })
  contactId!: string;

  @Column({ name: 'account_id', nullable: true })
  accountId!: string;

  @Column({ name: 'user_id', nullable: true })
  userId!: string; // User who sent/received the email

  // Relations
  @ManyToOne(() => Contact, contact => contact.emails, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'contact_id' })
  contact!: Contact;

  @ManyToOne(() => Account, account => account.emails, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'account_id' })
  account!: Account;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
} 