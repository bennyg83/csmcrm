import { google, gmail_v1 } from 'googleapis';
import { GoogleOAuthService } from './googleOAuthService';

export interface EmailAttachment {
  filename: string;
  mimeType: string;
  data: string; // base64 encoded
  size: number;
}

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
  attachments?: EmailAttachment[];
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

export class GmailService {
  private googleOAuthService: GoogleOAuthService;

  constructor() {
    this.googleOAuthService = GoogleOAuthService.getInstance();
  }

  /**
   * Send an email through Gmail API
   */
  async sendEmail(
    userAccessToken: string,
    userRefreshToken: string,
    email: EmailMessage
  ): Promise<string> {
    try {
      const gmail = this.googleOAuthService.getGmailClient(userAccessToken, userRefreshToken);
      
      // Create email content
      const emailContent = this.createEmailContent(email);
      
      const response = await gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: Buffer.from(emailContent).toString('base64url')
        }
      });

      return response.data.id!;
    } catch (error) {
      console.error('Failed to send email:', error);
      throw new Error('Failed to send email');
    }
  }

  /**
   * Get recent emails from Gmail with optimized batch processing
   */
  async getRecentEmails(
    userAccessToken: string,
    userRefreshToken: string,
    maxResults: number = 20,
    query?: string
  ): Promise<EmailMessage[]> {
    try {
      const gmail = this.googleOAuthService.getGmailClient(userAccessToken, userRefreshToken);
      
      // Get list of messages with metadata to avoid full message fetch
      const response = await gmail.users.messages.list({
        userId: 'me',
        maxResults,
        q: query || 'in:inbox OR in:sent'
      });

      if (!response.data.messages) {
        return [];
      }

      // Use batch request to get multiple emails at once
      const messageIds = response.data.messages.slice(0, maxResults).map(msg => msg.id!);
      const emails: EmailMessage[] = [];

      // Process in batches of 10 to avoid rate limits
      const batchSize = 10;
      for (let i = 0; i < messageIds.length; i += batchSize) {
        const batch = messageIds.slice(i, i + batchSize);
        
        // Create batch request for multiple emails
        const batchPromises = batch.map(async (messageId) => {
          try {
            const emailData = await this.getEmailById(userAccessToken, userRefreshToken, messageId);
            return emailData;
          } catch (error) {
            console.error(`Failed to fetch email ${messageId}:`, error);
            return null;
          }
        });

        const batchResults = await Promise.all(batchPromises);
        emails.push(...batchResults.filter(email => email !== null) as EmailMessage[]);
      }

      return emails;
    } catch (error) {
      console.error('Failed to get recent emails:', error);
      throw new Error('Failed to fetch emails');
    }
  }

  /**
   * Get a specific email by ID
   */
  async getEmailById(
    userAccessToken: string,
    userRefreshToken: string,
    messageId: string
  ): Promise<EmailMessage | null> {
    try {
      const gmail = this.googleOAuthService.getGmailClient(userAccessToken, userRefreshToken);
      
      const response = await gmail.users.messages.get({
        userId: 'me',
        id: messageId,
        format: 'full'
      });

      return this.parseGmailMessage(response.data);
    } catch (error) {
      console.error(`Failed to get email ${messageId}:`, error);
      return null;
    }
  }

  /**
   * Get email previews (lightweight version for faster loading)
   */
  async getEmailPreviews(
    userAccessToken: string,
    userRefreshToken: string,
    maxResults: number = 20,
    query?: string
  ): Promise<EmailMessage[]> {
    try {
      const gmail = this.googleOAuthService.getGmailClient(userAccessToken, userRefreshToken);
      
      const response = await gmail.users.messages.list({
        userId: 'me',
        maxResults,
        q: query || 'in:inbox OR in:sent'
      });

      if (!response.data.messages) {
        return [];
      }

      // Get full message details for proper headers and content
      const previewPromises = response.data.messages.slice(0, maxResults).map(async (message) => {
        try {
          const response = await gmail.users.messages.get({
            userId: 'me',
            id: message.id!,
            format: 'full' // Get full content with headers
          });

          return this.parseGmailMessagePreview(response.data);
        } catch (error) {
          console.error(`Failed to fetch email preview ${message.id}:`, error);
          return null;
        }
      });

      const previews = await Promise.all(previewPromises);
      return previews.filter(email => email !== null) as EmailMessage[];
    } catch (error) {
      console.error('Failed to get email previews:', error);
      throw new Error('Failed to fetch email previews');
    }
  }

  /**
   * Search emails with specific query
   */
  async searchEmails(
    userAccessToken: string,
    userRefreshToken: string,
    query: string,
    maxResults: number = 10
  ): Promise<EmailMessage[]> {
    return this.getRecentEmails(userAccessToken, userRefreshToken, maxResults, query);
  }

  /**
   * Reply to an email
   */
  async replyToEmail(
    userAccessToken: string,
    userRefreshToken: string,
    originalEmail: EmailMessage,
    replyContent: string
  ): Promise<string> {
    const replyEmail: EmailMessage = {
      subject: originalEmail.subject.startsWith('Re:') ? originalEmail.subject : `Re: ${originalEmail.subject}`,
      from: { email: 'me' }, // Gmail API will use the authenticated user's email
      to: [originalEmail.from],
      body: replyContent,
      date: new Date(),
      threadId: originalEmail.threadId
    };

    return this.sendEmail(userAccessToken, userRefreshToken, replyEmail);
  }

  /**
   * Discover contacts from email content
   */
  async discoverContactsFromEmails(
    userAccessToken: string,
    userRefreshToken: string,
    maxEmails: number = 50
  ): Promise<ContactInfo[]> {
    try {
      const emails = await this.getRecentEmails(userAccessToken, userRefreshToken, maxEmails);
      const contacts: Map<string, ContactInfo> = new Map();

      for (const email of emails) {
        // Extract contacts from sender
        const senderContact = this.extractContactFromEmail(email.from, email.body || email.snippet || '');
        if (senderContact && senderContact.email !== 'me') {
          contacts.set(senderContact.email, senderContact);
        }

        // Extract contacts from recipients
        for (const recipient of email.to || []) {
          const recipientContact = this.extractContactFromEmail(recipient, email.body || email.snippet || '');
          if (recipientContact) {
            contacts.set(recipientContact.email, recipientContact);
          }
        }

        // Extract contacts from CC
        for (const ccRecipient of email.cc || []) {
          const ccContact = this.extractContactFromEmail(ccRecipient, email.body || email.snippet || '');
          if (ccContact) {
            contacts.set(ccContact.email, ccContact);
          }
        }

        // Parse email signature for additional contact info
        const signatureContacts = this.parseEmailSignature(email.body || '');
        for (const contact of signatureContacts) {
          if (contacts.has(contact.email)) {
            // Merge additional info
            const existing = contacts.get(contact.email)!;
            contacts.set(contact.email, { ...existing, ...contact });
          } else {
            contacts.set(contact.email, contact);
          }
        }
      }

      return Array.from(contacts.values());
    } catch (error) {
      console.error('Failed to discover contacts:', error);
      return [];
    }
  }

  /**
   * Parse Gmail message preview (full content version)
   */
  private parseGmailMessagePreview(gmailMessage: gmail_v1.Schema$Message): EmailMessage | null {
    try {
      const headers = gmailMessage.payload?.headers || [];
      const getHeader = (name: string) => headers.find(h => h.name?.toLowerCase() === name.toLowerCase())?.value || '';

      const subject = getHeader('Subject');
      const fromHeader = getHeader('From');
      const toHeader = getHeader('To');
      const ccHeader = getHeader('Cc');
      const dateHeader = getHeader('Date');

      // Parse email addresses
      const from = this.parseEmailAddress(fromHeader);
      const to = this.parseEmailAddresses(toHeader);
      const cc = this.parseEmailAddresses(ccHeader);

      // Extract full email body
      const { body, bodyHtml } = this.extractEmailBody(gmailMessage.payload);
      
      // Use full body or snippet as fallback
      const emailContent = body || gmailMessage.snippet || 'No content available';

      // Decode HTML entities in all text fields
      const decodedSubject = this.decodeHtmlEntities(subject);
      const decodedEmailContent = this.decodeHtmlEntities(emailContent);
      const decodedSnippet = this.decodeHtmlEntities(gmailMessage.snippet || '');

      const email: EmailMessage = {
        id: gmailMessage.id || undefined,
        threadId: gmailMessage.threadId || undefined,
        subject: decodedSubject,
        from,
        to,
        cc: cc.length > 0 ? cc : undefined,
        body: decodedEmailContent,
        bodyHtml: bodyHtml ? this.decodeHtmlEntities(bodyHtml) : decodedEmailContent,
        date: dateHeader ? new Date(dateHeader) : new Date(),
        isRead: !gmailMessage.labelIds?.includes('UNREAD'),
        labels: gmailMessage.labelIds || undefined,
        snippet: decodedSnippet
      };

      return email;
    } catch (error) {
      console.error('Failed to parse Gmail message preview:', error);
      return null;
    }
  }

  /**
   * Parse Gmail message format to our EmailMessage format
   */
  private parseGmailMessage(gmailMessage: gmail_v1.Schema$Message): EmailMessage | null {
    try {
      const headers = gmailMessage.payload?.headers || [];
      const getHeader = (name: string) => headers.find(h => h.name?.toLowerCase() === name.toLowerCase())?.value || '';

      const subject = getHeader('Subject');
      const fromHeader = getHeader('From');
      const toHeader = getHeader('To');
      const ccHeader = getHeader('Cc');
      const dateHeader = getHeader('Date');

      // Parse email addresses
      const from = this.parseEmailAddress(fromHeader);
      const to = this.parseEmailAddresses(toHeader);
      const cc = this.parseEmailAddresses(ccHeader);

      // Get email body
      const { body, bodyHtml } = this.extractEmailBody(gmailMessage.payload);

      // Decode HTML entities in all text fields
      const decodedSubject = this.decodeHtmlEntities(subject);
      const decodedBody = this.decodeHtmlEntities(body);
      const decodedBodyHtml = bodyHtml ? this.decodeHtmlEntities(bodyHtml) : undefined;
      const decodedSnippet = this.decodeHtmlEntities(gmailMessage.snippet || '');

      const email: EmailMessage = {
        id: gmailMessage.id || undefined,
        threadId: gmailMessage.threadId || undefined,
        subject: decodedSubject,
        from,
        to,
        cc: cc.length > 0 ? cc : undefined,
        body: decodedBody,
        bodyHtml: decodedBodyHtml,
        date: dateHeader ? new Date(dateHeader) : new Date(),
        isRead: !gmailMessage.labelIds?.includes('UNREAD'),
        labels: gmailMessage.labelIds || undefined,
        snippet: decodedSnippet
      };

      return email;
    } catch (error) {
      console.error('Failed to parse Gmail message:', error);
      return null;
    }
  }

  /**
   * Extract email body from Gmail message payload
   */
  private extractEmailBody(payload: gmail_v1.Schema$MessagePart | undefined): { body: string; bodyHtml?: string } {
    if (!payload) return { body: '' };

    // If it's a simple message with body
    if (payload.body?.data) {
      let body = Buffer.from(payload.body.data, 'base64url').toString();
      body = this.decodeHtmlEntities(body);
      return { body, bodyHtml: payload.mimeType === 'text/html' ? body : undefined };
    }

    // If it's a multipart message
    if (payload.parts) {
      let textBody = '';
      let htmlBody = '';

      for (const part of payload.parts) {
        if (part.mimeType === 'text/plain' && part.body?.data) {
          textBody = Buffer.from(part.body.data, 'base64url').toString();
          textBody = this.decodeHtmlEntities(textBody);
        } else if (part.mimeType === 'text/html' && part.body?.data) {
          htmlBody = Buffer.from(part.body.data, 'base64url').toString();
          htmlBody = this.decodeHtmlEntities(htmlBody);
        }
      }

      return {
        body: textBody || this.stripHtml(htmlBody),
        bodyHtml: htmlBody || undefined
      };
    }

    return { body: '' };
  }

  /**
   * Create email content in RFC 2822 format
   */
  private createEmailContent(email: EmailMessage): string {
    const lines: string[] = [];
    
    lines.push(`To: ${email.to.map(addr => this.formatEmailAddress(addr)).join(', ')}`);
    
    if (email.cc && email.cc.length > 0) {
      lines.push(`Cc: ${email.cc.map(addr => this.formatEmailAddress(addr)).join(', ')}`);
    }
    
    if (email.bcc && email.bcc.length > 0) {
      lines.push(`Bcc: ${email.bcc.map(addr => this.formatEmailAddress(addr)).join(', ')}`);
    }
    
    lines.push(`Subject: ${email.subject}`);
    lines.push(`Date: ${email.date.toUTCString()}`);
    lines.push('MIME-Version: 1.0');
    lines.push('Content-Type: text/plain; charset=utf-8');
    lines.push('');
    lines.push(email.body);

    return lines.join('\r\n');
  }

  /**
   * Parse email address from string
   */
  private parseEmailAddress(emailStr: string): EmailAddress {
    if (!emailStr) return { email: '' };
    
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
   * Parse multiple email addresses from string
   */
  private parseEmailAddresses(emailStr: string): EmailAddress[] {
    if (!emailStr) return [];
    return emailStr.split(',').map(email => this.parseEmailAddress(email.trim()));
  }

  /**
   * Format email address for sending
   */
  private formatEmailAddress(addr: EmailAddress): string {
    if (addr.name) {
      return `${addr.name} <${addr.email}>`;
    }
    return addr.email;
  }

  /**
   * Extract contact information from email address and content
   */
  private extractContactFromEmail(emailAddr: EmailAddress, content: string): ContactInfo | null {
    if (!emailAddr.email || emailAddr.email === 'me') return null;

    const contact: ContactInfo = {
      email: emailAddr.email,
      name: emailAddr.name,
      domain: emailAddr.email.split('@')[1]
    };

    // Try to extract additional info from email signature
    const signature = this.extractSignatureInfo(content);
    if (signature) {
      contact.phone = signature.phone;
      contact.company = signature.company;
      contact.title = signature.title;
    }

    return contact;
  }

  /**
   * Parse email signature for contact information
   */
  private parseEmailSignature(emailBody: string): ContactInfo[] {
    // This is a simplified signature parser
    // In a real implementation, you'd use more sophisticated parsing
    const contacts: ContactInfo[] = [];
    
    // Look for common signature patterns
    const signaturePatterns = [
      /(\w+(?:\s+\w+)*)\s*\n.*?([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g,
      /Best regards,\s*\n\s*(\w+(?:\s+\w+)*)/g,
      /Thanks,\s*\n\s*(\w+(?:\s+\w+)*)/g
    ];

    // This is a basic implementation - you could enhance this significantly
    return contacts;
  }

  /**
   * Extract signature information from email content
   */
  private extractSignatureInfo(content: string): { phone?: string; company?: string; title?: string } | null {
    // Basic signature parsing - could be enhanced significantly
    const phoneMatch = content.match(/(\+?1?[-.\s]?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4})/);
    const companyMatch = content.match(/(?:at|@)\s+([A-Z][a-zA-Z\s&]+(?:Inc|LLC|Corp|Company|Ltd))/);
    
    if (phoneMatch || companyMatch) {
      return {
        phone: phoneMatch?.[1],
        company: companyMatch?.[1]
      };
    }
    
    return null;
  }

  /**
   * Strip HTML tags from text
   */
  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
  }

  /**
   * Decode HTML entities to readable text
   */
  private decodeHtmlEntities(text: string): string {
    if (!text) return text;
    
    const entities: { [key: string]: string } = {
      '&amp;': '&',
      '&lt;': '<',
      '&gt;': '>',
      '&quot;': '"',
      '&#39;': "'",
      '&apos;': "'",
      '&nbsp;': ' ',
      '&copy;': '©',
      '&reg;': '®',
      '&trade;': '™',
      '&hellip;': '...',
      '&mdash;': '—',
      '&ndash;': '–',
      '&lsquo;': "'",
      '&rsquo;': "'",
      '&ldquo;': '"',
      '&rdquo;': '"'
    };

    // First handle numeric entities like &#39;
    let decoded = text.replace(/&#(\d+);/g, (match, code) => {
      return String.fromCharCode(parseInt(code));
    });

    // Then handle named entities
    decoded = decoded.replace(/&[a-zA-Z0-9]+;/g, (match) => {
      return entities[match] || match;
    });

    return decoded;
  }
} 