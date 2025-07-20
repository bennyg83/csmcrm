import { Repository } from 'typeorm';
import { AppDataSource } from '../config/data-source';
import { Email } from '../entities/Email';
import { Contact } from '../entities/Contact';
import { Account } from '../entities/Account';
import { User } from '../entities/User';
import { EmailMessage } from './gmailService';

export interface EmailLinkResult {
  email: Email;
  linkedContact: Contact | null;
  linkedAccount: Account | null;
}

export class EmailService {
  private emailRepository: Repository<Email>;
  private contactRepository: Repository<Contact>;
  private accountRepository: Repository<Account>;
  private userRepository: Repository<User>;

  constructor() {
    this.emailRepository = AppDataSource.getRepository(Email);
    this.contactRepository = AppDataSource.getRepository(Contact);
    this.accountRepository = AppDataSource.getRepository(Account);
    this.userRepository = AppDataSource.getRepository(User);
  }

  /**
   * Save an email from Gmail and link it to contacts/accounts
   */
  async saveAndLinkEmail(
    gmailMessage: EmailMessage,
    userId: string
  ): Promise<EmailLinkResult> {
    try {
      // Check if email already exists
      const existingEmail = await this.emailRepository.findOne({
        where: { gmailMessageId: gmailMessage.id }
      });

      if (existingEmail) {
        return {
          email: existingEmail,
          linkedContact: existingEmail.contactId ? await this.contactRepository.findOne({
            where: { id: existingEmail.contactId },
            relations: ['account']
          }) : null,
          linkedAccount: existingEmail.accountId ? await this.accountRepository.findOne({
            where: { id: existingEmail.accountId }
          }) : null
        };
      }

      // Create new email record
      const email = new Email();
      email.gmailMessageId = gmailMessage.id || '';
      email.gmailThreadId = gmailMessage.threadId || '';
      email.subject = gmailMessage.subject;
      email.body = gmailMessage.body;
      email.bodyHtml = gmailMessage.bodyHtml || '';
      email.senderEmail = gmailMessage.from.email;
      email.senderName = gmailMessage.from.name || '';
      email.recipientEmails = gmailMessage.to.map(addr => addr.email);
      email.recipientNames = gmailMessage.to.map(addr => addr.name || '');
      email.ccEmails = gmailMessage.cc?.map(addr => addr.email) || [];
      email.ccNames = gmailMessage.cc?.map(addr => addr.name || '') || [];
      email.dateSent = gmailMessage.date;
      email.isRead = gmailMessage.isRead || false;
      email.gmailLabels = gmailMessage.labels || [];
      email.snippet = gmailMessage.snippet || '';
      email.userId = userId;

      // Determine if email was sent by us
      const user = await this.userRepository.findOne({ where: { id: userId } });
      email.isSent = user?.email === gmailMessage.from.email;

      // Find matching contacts and accounts
      const linkResult = await this.findContactAndAccountMatches(email);
      
      // Set the foreign keys
      email.contactId = linkResult.linkedContact?.id || '';
      email.accountId = linkResult.linkedAccount?.id || '';

      // Save the email
      const savedEmail = await this.emailRepository.save(email);

      return {
        email: savedEmail,
        linkedContact: linkResult.linkedContact,
        linkedAccount: linkResult.linkedAccount
      };
    } catch (error) {
      console.error('Failed to save and link email:', error);
      throw new Error('Failed to save email');
    }
  }

  /**
   * Find contacts and accounts that match the email addresses
   * Enhanced to handle CSM-to-Client scenarios where emails FROM admin TO contacts should also be linked
   */
  private async findContactAndAccountMatches(email: Email): Promise<{
    linkedContact: Contact | null;
    linkedAccount: Account | null;
  }> {
    // Collect all email addresses from the email
    const allEmailAddresses = [
      email.senderEmail,
      ...email.recipientEmails,
      ...email.ccEmails
    ].filter(Boolean);

    console.log(`\n--- EMAIL MATCHING DEBUG ---`);
    console.log(`Email Subject: ${email.subject}`);
    console.log(`Sender: ${email.senderEmail}`);
    console.log(`Recipients: ${email.recipientEmails.join(', ')}`);
    console.log(`CC: ${email.ccEmails.join(', ')}`);
    console.log(`All email addresses to match: ${allEmailAddresses.join(', ')}`);
    console.log(`Email is sent by user: ${email.isSent}`);

    // Find contacts that match any of these email addresses
    const matchingContacts = await this.contactRepository.find({
      where: allEmailAddresses.map(emailAddr => ({ email: emailAddr })),
      relations: ['account']
    });

    console.log(`Found ${matchingContacts.length} matching contacts:`);
    matchingContacts.forEach((contact, index) => {
      console.log(`  Contact ${index + 1}: ${contact.firstName} ${contact.lastName} (${contact.email})`);
    });

    if (matchingContacts.length > 0) {
      // Use the first matching contact (you could implement more sophisticated logic here)
      const primaryContact = matchingContacts[0];
      console.log(`Selected contact: ${primaryContact.firstName} ${primaryContact.lastName} (${primaryContact.email})`);
      return {
        linkedContact: primaryContact,
        linkedAccount: primaryContact.account
      };
    }

    console.log(`No direct contact matches found. Checking for CSM-to-Client scenario...`);

    // CSM-to-Client Enhancement: If this is an email FROM our system TO a contact
    // Try to find the contact by looking at recipient emails (when user sends to client)
    if (email.isSent && email.recipientEmails.length > 0) {
      console.log(`This is a sent email. Checking if any recipients are contacts...`);
      
      const recipientContacts = await this.contactRepository.find({
        where: email.recipientEmails.map(emailAddr => ({ email: emailAddr })),
        relations: ['account']
      });

      console.log(`Found ${recipientContacts.length} contacts among recipients:`);
      recipientContacts.forEach((contact, index) => {
        console.log(`  Recipient Contact ${index + 1}: ${contact.firstName} ${contact.lastName} (${contact.email})`);
      });

      if (recipientContacts.length > 0) {
        const primaryRecipientContact = recipientContacts[0];
        console.log(`Linking email to recipient contact: ${primaryRecipientContact.firstName} ${primaryRecipientContact.lastName} (${primaryRecipientContact.email})`);
        return {
          linkedContact: primaryRecipientContact,
          linkedAccount: primaryRecipientContact.account
        };
      }
    }

    // Client-to-CSM Enhancement: If this is an email TO our system FROM a contact
    // The sender might be a contact we want to track
    if (!email.isSent && email.senderEmail) {
      console.log(`This is a received email from: ${email.senderEmail}. Checking if sender is a contact...`);
      
      const senderContact = await this.contactRepository.findOne({
        where: { email: email.senderEmail },
        relations: ['account']
      });

      if (senderContact) {
        console.log(`Found sender as contact: ${senderContact.firstName} ${senderContact.lastName} (${senderContact.email})`);
        return {
          linkedContact: senderContact,
          linkedAccount: senderContact.account
        };
      }
    }

    console.log(`No matching contacts found for email addresses: ${allEmailAddresses.join(', ')}`);

    // If no contact match, try to find account by domain
    const domains = allEmailAddresses
      .map(email => email.split('@')[1])
      .filter(Boolean);

    console.log(`Trying domain matching with domains: ${domains.join(', ')}`);

    if (domains.length > 0) {
      // Try to find account by website domain
      const matchingAccounts = await this.accountRepository.find({
        where: domains.map(domain => ({ website: `%${domain}%` }))
      });

      console.log(`Found ${matchingAccounts.length} matching accounts by domain`);

      if (matchingAccounts.length > 0) {
        return {
          linkedContact: null,
          linkedAccount: matchingAccounts[0]
        };
      }
    }

    console.log(`No matches found - email will be unlinked`);
    return {
      linkedContact: null,
      linkedAccount: null
    };
  }

  /**
   * Get emails for a specific contact
   */
  async getEmailsForContact(contactId: string, limit: number = 20): Promise<Email[]> {
    return this.emailRepository.find({
      where: { contactId },
      order: { dateSent: 'DESC' },
      take: limit,
      relations: ['contact', 'account', 'user']
    });
  }

  /**
   * Get emails for a specific account
   */
  async getEmailsForAccount(accountId: string, limit: number = 50): Promise<Email[]> {
    return this.emailRepository.find({
      where: { accountId },
      order: { dateSent: 'DESC' },
      take: limit,
      relations: ['contact', 'account', 'user']
    });
  }

  /**
   * Get recent email activity summary for an account
   */
  async getAccountEmailSummary(accountId: string, days: number = 30): Promise<{
    totalEmails: number;
    sentEmails: number;
    receivedEmails: number;
    recentEmails: Email[];
  }> {
    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - days);

    const emails = await this.emailRepository.find({
      where: { 
        accountId,
        dateSent: dateFrom // This would need proper TypeORM date filtering
      },
      order: { dateSent: 'DESC' },
      take: 10,
      relations: ['contact']
    });

    const sentEmails = emails.filter(e => e.isSent);
    const receivedEmails = emails.filter(e => !e.isSent);

    return {
      totalEmails: emails.length,
      sentEmails: sentEmails.length,
      receivedEmails: receivedEmails.length,
      recentEmails: emails.slice(0, 5)
    };
  }

  /**
   * Mark email as read
   */
  async markEmailAsRead(emailId: string): Promise<void> {
    await this.emailRepository.update(emailId, { isRead: true });
  }

  /**
   * Bulk save emails from Gmail sync
   */
  async bulkSaveEmails(
    gmailMessages: EmailMessage[],
    userId: string
  ): Promise<EmailLinkResult[]> {
    const results: EmailLinkResult[] = [];
    
    for (const message of gmailMessages) {
      try {
        const result = await this.saveAndLinkEmail(message, userId);
        results.push(result);
      } catch (error) {
        console.error(`Failed to save email ${message.id}:`, error);
      }
    }

    return results;
  }

  /**
   * Helper to get contact email
   */
  private async getContactEmail(contactId: string): Promise<string> {
    const contact = await this.contactRepository.findOne({ 
      where: { id: contactId },
      select: ['email']
    });
    return contact?.email || '';
  }

  /**
   * Helper to get contact email as array for IN query
   */
  private async getContactEmailArray(contactId: string): Promise<string[]> {
    const email = await this.getContactEmail(contactId);
    return email ? [email] : [];
  }

  /**
   * Find emails that mention a specific account or contact
   */
  async findEmailsMentioning(searchTerm: string, userId: string): Promise<Email[]> {
    return this.emailRepository
      .createQueryBuilder('email')
      .where('email.userId = :userId', { userId })
      .andWhere(
        '(email.subject ILIKE :searchTerm OR email.body ILIKE :searchTerm)',
        { searchTerm: `%${searchTerm}%` }
      )
      .orderBy('email.dateSent', 'DESC')
      .take(20)
      .getMany();
  }

  /**
   * Get email thread
   */
  async getEmailThread(threadId: string): Promise<Email[]> {
    return this.emailRepository.find({
      where: { gmailThreadId: threadId },
      order: { dateSent: 'ASC' },
      relations: ['contact', 'account']
    });
  }
} 