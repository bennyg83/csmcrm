import apiService from './api';

export interface EmailAddress {
  email: string;
  name?: string;
}

export interface EmailMessage {
  id?: string;
  threadId?: string;
  subject: string;
  from: EmailAddress;
  to: EmailAddress[];
  cc?: EmailAddress[];
  bcc?: EmailAddress[];
  body: string;
  bodyHtml?: string;
  date: Date;
  isRead?: boolean;
  labels?: string[];
  snippet?: string;
}

export interface ContactInfo {
  email: string;
  name?: string;
  phone?: string;
  company?: string;
  title?: string;
  domain?: string;
}

export interface SendEmailRequest {
  to: EmailAddress[];
  cc?: EmailAddress[];
  bcc?: EmailAddress[];
  subject: string;
  body: string;
  bodyHtml?: string;
}

export class GmailService {
  private static instance: GmailService;

  private constructor() {}

  public static getInstance(): GmailService {
    if (!GmailService.instance) {
      GmailService.instance = new GmailService();
    }
    return GmailService.instance;
  }

  /**
   * Get recent emails
   */
  async getRecentEmails(limit: number = 20, query?: string): Promise<EmailMessage[]> {
    try {
      const response = await apiService.getRecentEmails(limit, query);
      return response.emails.map((email: any) => ({
        ...email,
        date: new Date(email.date)
      }));
    } catch (error) {
      console.error('Failed to get recent emails:', error);
      throw new Error('Failed to fetch emails');
    }
  }

  /**
   * Get specific email by ID
   */
  async getEmailById(emailId: string): Promise<EmailMessage> {
    try {
      const response = await apiService.getEmailById(emailId);
      return {
        ...response.email,
        date: new Date(response.email.date)
      };
    } catch (error) {
      console.error('Failed to get email:', error);
      throw new Error('Failed to fetch email');
    }
  }

  /**
   * Send an email
   */
  async sendEmail(emailData: SendEmailRequest): Promise<string> {
    try {
      const response = await apiService.sendEmail(emailData);
      return response.messageId;
    } catch (error) {
      console.error('Failed to send email:', error);
      throw new Error('Failed to send email');
    }
  }

  /**
   * Reply to an email
   */
  async replyToEmail(emailId: string, body: string): Promise<string> {
    try {
      const response = await apiService.replyToEmail(emailId, body);
      return response.messageId;
    } catch (error) {
      console.error('Failed to reply to email:', error);
      throw new Error('Failed to send reply');
    }
  }

  /**
   * Search emails
   */
  async searchEmails(query: string, limit: number = 10): Promise<EmailMessage[]> {
    try {
      const response = await apiService.searchEmails(query, limit);
      return response.emails.map((email: any) => ({
        ...email,
        date: new Date(email.date)
      }));
    } catch (error) {
      console.error('Failed to search emails:', error);
      throw new Error('Failed to search emails');
    }
  }

  /**
   * Discover contacts from emails
   */
  async discoverContacts(maxEmails: number = 50): Promise<ContactInfo[]> {
    try {
      const response = await apiService.discoverContacts(maxEmails);
      return response.contacts;
    } catch (error) {
      console.error('Failed to discover contacts:', error);
      throw new Error('Failed to discover contacts');
    }
  }

  /**
   * Get Gmail labels
   */
  async getGmailLabels(): Promise<Array<{ id: string; name: string }>> {
    try {
      const response = await apiService.getGmailLabels();
      return response.labels;
    } catch (error) {
      console.error('Failed to get Gmail labels:', error);
      throw new Error('Failed to get Gmail labels');
    }
  }

  /**
   * Format email address for display
   */
  formatEmailAddress(address: EmailAddress): string {
    if (address.name) {
      return `${address.name} <${address.email}>`;
    }
    return address.email;
  }

  /**
   * Parse email address string into EmailAddress object
   */
  parseEmailAddress(emailStr: string): EmailAddress {
    const match = emailStr.match(/^(.*?)\s*<(.+?)>$/) || emailStr.match(/^(.+)$/);
    if (match) {
      if (match[2]) {
        return { email: match[2].trim(), name: match[1].trim() };
      } else {
        return { email: match[1].trim() };
      }
    }
    return { email: emailStr.trim() };
  }

  /**
   * Extract domain from email address
   */
  extractDomain(email: string): string {
    return email.split('@')[1] || '';
  }

  /**
   * Check if email is from a specific domain
   */
  isFromDomain(email: EmailMessage, domain: string): boolean {
    return this.extractDomain(email.from.email).toLowerCase() === domain.toLowerCase();
  }

  /**
   * Group emails by thread
   */
  groupEmailsByThread(emails: EmailMessage[]): Map<string, EmailMessage[]> {
    const threads = new Map<string, EmailMessage[]>();
    
    for (const email of emails) {
      const threadId = email.threadId || email.id || 'no-thread';
      if (!threads.has(threadId)) {
        threads.set(threadId, []);
      }
      threads.get(threadId)!.push(email);
    }
    
    return threads;
  }
}

export const gmailService = GmailService.getInstance(); 