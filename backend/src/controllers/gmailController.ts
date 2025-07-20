import { Request, Response } from "express";
import { GmailService, EmailMessage } from "../services/gmailService";
import { EmailService } from "../services/emailService";
import { User } from "../entities/User";
import { Contact } from "../entities/Contact";
import { AppDataSource } from "../config/data-source";

const gmailService = new GmailService();
const emailService = new EmailService();

/**
 * Get recent emails for the authenticated user
 */
export const getRecentEmails = async (req: Request, res: Response) => {
  try {
    const user = req.user as User;
    
    if (!user || !user.googleAccessToken) {
      return res.status(401).json({ error: "Google authentication required" });
    }

    const maxResults = parseInt(req.query.limit as string) || 20;
    const query = req.query.q as string;

    const emails = await gmailService.getRecentEmails(
      user.googleAccessToken,
      user.googleRefreshToken || '',
      maxResults,
      query
    );

    res.json({ emails, count: emails.length });
  } catch (error) {
    console.error("Failed to get recent emails:", error);
    res.status(500).json({ error: "Failed to fetch emails" });
  }
};

/**
 * Get a specific email by ID
 */
export const getEmailById = async (req: Request, res: Response) => {
  try {
    const user = req.user as User;
    const { emailId } = req.params;
    
    if (!user || !user.googleAccessToken) {
      return res.status(401).json({ error: "Google authentication required" });
    }

    const email = await gmailService.getEmailById(
      user.googleAccessToken,
      user.googleRefreshToken || '',
      emailId
    );

    if (!email) {
      return res.status(404).json({ error: "Email not found" });
    }

    res.json({ email });
  } catch (error) {
    console.error("Failed to get email:", error);
    res.status(500).json({ error: "Failed to fetch email" });
  }
};

/**
 * Send an email
 */
export const sendEmail = async (req: Request, res: Response) => {
  try {
    const user = req.user as User;
    
    if (!user || !user.googleAccessToken) {
      return res.status(401).json({ error: "Google authentication required" });
    }

    const { to, cc, bcc, subject, body, bodyHtml } = req.body;

    // Validate required fields
    if (!to || !Array.isArray(to) || to.length === 0) {
      return res.status(400).json({ error: "Recipients (to) are required" });
    }
    
    if (!subject || !body) {
      return res.status(400).json({ error: "Subject and body are required" });
    }

    const email: EmailMessage = {
      subject,
      from: { email: user.email, name: user.name },
      to: to.map((recipient: any) => ({
        email: recipient.email,
        name: recipient.name
      })),
      cc: cc ? cc.map((recipient: any) => ({
        email: recipient.email,
        name: recipient.name
      })) : undefined,
      bcc: bcc ? bcc.map((recipient: any) => ({
        email: recipient.email,
        name: recipient.name
      })) : undefined,
      body,
      bodyHtml,
      date: new Date()
    };

    const messageId = await gmailService.sendEmail(
      user.googleAccessToken,
      user.googleRefreshToken || '',
      email
    );

    res.json({ 
      success: true, 
      messageId,
      message: "Email sent successfully" 
    });
  } catch (error) {
    console.error("Failed to send email:", error);
    res.status(500).json({ error: "Failed to send email" });
  }
};

/**
 * Reply to an email
 */
export const replyToEmail = async (req: Request, res: Response) => {
  try {
    const user = req.user as User;
    const { emailId } = req.params;
    const { body } = req.body;
    
    if (!user || !user.googleAccessToken) {
      return res.status(401).json({ error: "Google authentication required" });
    }

    if (!body) {
      return res.status(400).json({ error: "Reply body is required" });
    }

    // Get the original email
    const originalEmail = await gmailService.getEmailById(
      user.googleAccessToken,
      user.googleRefreshToken || '',
      emailId
    );

    if (!originalEmail) {
      return res.status(404).json({ error: "Original email not found" });
    }

    const replyMessageId = await gmailService.replyToEmail(
      user.googleAccessToken,
      user.googleRefreshToken || '',
      originalEmail,
      body
    );

    res.json({ 
      success: true, 
      messageId: replyMessageId,
      message: "Reply sent successfully" 
    });
  } catch (error) {
    console.error("Failed to reply to email:", error);
    res.status(500).json({ error: "Failed to send reply" });
  }
};

/**
 * Search emails
 */
export const searchEmails = async (req: Request, res: Response) => {
  try {
    const user = req.user as User;
    
    if (!user || !user.googleAccessToken) {
      return res.status(401).json({ error: "Google authentication required" });
    }

    const { query } = req.query;
    const maxResults = parseInt(req.query.limit as string) || 10;

    if (!query) {
      return res.status(400).json({ error: "Search query is required" });
    }

    const emails = await gmailService.searchEmails(
      user.googleAccessToken,
      user.googleRefreshToken || '',
      query as string,
      maxResults
    );

    res.json({ emails, count: emails.length, query });
  } catch (error) {
    console.error("Failed to search emails:", error);
    res.status(500).json({ error: "Failed to search emails" });
  }
};

/**
 * Discover contacts from emails
 */
export const discoverContacts = async (req: Request, res: Response) => {
  try {
    const user = req.user as User;
    
    if (!user || !user.googleAccessToken) {
      return res.status(401).json({ error: "Google authentication required" });
    }

    const maxEmails = parseInt(req.query.maxEmails as string) || 50;

    const contacts = await gmailService.discoverContactsFromEmails(
      user.googleAccessToken,
      user.googleRefreshToken || '',
      maxEmails
    );

    res.json({ 
      contacts, 
      count: contacts.length,
      message: `Discovered ${contacts.length} contacts from ${maxEmails} recent emails`
    });
  } catch (error) {
    console.error("Failed to discover contacts:", error);
    res.status(500).json({ error: "Failed to discover contacts" });
  }
};

/**
 * Get Gmail labels
 */
export const getGmailLabels = async (req: Request, res: Response) => {
  try {
    const user = req.user as User;
    
    if (!user || !user.googleAccessToken) {
      return res.status(401).json({ error: "Google authentication required" });
    }

    // This would call Gmail API to get labels
    // For now, return common labels
    const labels = [
      { id: 'INBOX', name: 'Inbox' },
      { id: 'SENT', name: 'Sent' },
      { id: 'DRAFT', name: 'Drafts' },
      { id: 'SPAM', name: 'Spam' },
      { id: 'TRASH', name: 'Trash' },
      { id: 'IMPORTANT', name: 'Important' },
      { id: 'STARRED', name: 'Starred' }
    ];

    res.json({ labels });
  } catch (error) {
    console.error("Failed to get Gmail labels:", error);
    res.status(500).json({ error: "Failed to get Gmail labels" });
  }
};

/**
 * Sync emails from Gmail and link to contacts
 */
export const syncEmailsWithContacts = async (req: Request, res: Response) => {
  try {
    const user = req.user as User;
    
    if (!user || !user.googleAccessToken) {
      return res.status(401).json({ error: "Google authentication required" });
    }

    const maxEmails = parseInt(req.query.maxEmails as string) || 20;

    // Get recent emails from Gmail
    const emails = await gmailService.getRecentEmails(
      user.googleAccessToken,
      user.googleRefreshToken || '',
      maxEmails
    );

    // Save and link emails to contacts
    const linkResults = await emailService.bulkSaveEmails(emails, user.id);

    const summary = {
      totalEmailsProcessed: linkResults.length,
      linkedToContacts: linkResults.filter(r => r.linkedContact).length,
      linkedToAccounts: linkResults.filter(r => r.linkedAccount).length,
      unlinked: linkResults.filter(r => !r.linkedContact && !r.linkedAccount).length
    };

    res.json({ 
      success: true, 
      summary,
      linkedEmails: linkResults.slice(0, 10) // Return first 10 for preview
    });
  } catch (error) {
    console.error("Failed to sync emails:", error);
    res.status(500).json({ error: "Failed to sync emails with contacts" });
  }
};

/**
 * Debug endpoint to see what emails are being synced
 */
export const debugEmailSync = async (req: Request, res: Response) => {
  try {
    const user = req.user as User;
    
    if (!user || !user.googleAccessToken) {
      return res.status(401).json({ error: "Google authentication required" });
    }

    const maxEmails = parseInt(req.query.maxEmails as string) || 10;

    // Get recent emails from Gmail
    const emails = await gmailService.getRecentEmails(
      user.googleAccessToken,
      user.googleRefreshToken || '',
      maxEmails,
      'in:inbox OR in:sent' // Include both inbox and sent emails
    );

    console.log(`\n=== DEBUG EMAIL SYNC ===`);
    console.log(`Found ${emails.length} emails to process`);
    
    emails.forEach((email, index) => {
      console.log(`\n--- Email ${index + 1} ---`);
      console.log(`ID: ${email.id}`);
      console.log(`Subject: ${email.subject}`);
      console.log(`From: ${email.from.email} (${email.from.name || 'No name'})`);
      console.log(`To: ${email.to.map(addr => `${addr.email} (${addr.name || 'No name'})`).join(', ')}`);
      console.log(`Date: ${email.date}`);
      console.log(`Snippet: ${email.snippet}`);
    });

    // Save and link emails to contacts
    const linkResults = await emailService.bulkSaveEmails(emails, user.id);

    console.log(`\n=== LINK RESULTS ===`);
    linkResults.forEach((result, index) => {
      console.log(`\n--- Result ${index + 1} ---`);
      console.log(`Email ID: ${result.email.id}`);
      console.log(`Subject: ${result.email.subject}`);
      console.log(`Linked Contact: ${result.linkedContact ? `${result.linkedContact.firstName} ${result.linkedContact.lastName} (${result.linkedContact.email})` : 'None'}`);
      console.log(`Linked Account: ${result.linkedAccount ? result.linkedAccount.name : 'None'}`);
    });

    const summary = {
      totalEmailsProcessed: linkResults.length,
      linkedToContacts: linkResults.filter(r => r.linkedContact).length,
      linkedToAccounts: linkResults.filter(r => r.linkedAccount).length,
      unlinked: linkResults.filter(r => !r.linkedContact && !r.linkedAccount).length,
      emailDetails: emails.map(email => ({
        id: email.id,
        subject: email.subject,
        from: email.from.email,
        to: email.to.map(addr => addr.email),
        date: email.date
      })),
      linkResults: linkResults.map(result => ({
        emailId: result.email.id,
        subject: result.email.subject,
        linkedContactEmail: result.linkedContact?.email || null,
        linkedAccountName: result.linkedAccount?.name || null
      }))
    };

    res.json({ 
      success: true, 
      summary
    });
  } catch (error) {
    console.error("Failed to debug email sync:", error);
    res.status(500).json({ error: "Failed to debug email sync" });
  }
};

/**
 * Debug endpoint to check a specific contact's details
 */
export const debugContactInfo = async (req: Request, res: Response) => {
  try {
    const { contactId } = req.params;
    
    const contactRepository = AppDataSource.getRepository(Contact);
    const contact = await contactRepository.findOne({
      where: { id: contactId },
      relations: ['account']
    });

    if (!contact) {
      return res.status(404).json({ error: "Contact not found" });
    }

    console.log(`\n=== DEBUG CONTACT INFO ===`);
    console.log(`Contact ID: ${contact.id}`);
    console.log(`Contact Name: ${contact.firstName} ${contact.lastName}`);
    console.log(`Contact Email: ${contact.email}`);
    console.log(`Account: ${contact.account?.name || 'No account'}`);

    res.json({
      success: true,
      contact: {
        id: contact.id,
        firstName: contact.firstName,
        lastName: contact.lastName,
        email: contact.email,
        accountName: contact.account?.name || null,
        accountId: contact.account?.id || null
      }
    });
  } catch (error) {
    console.error("Failed to get contact info:", error);
    res.status(500).json({ error: "Failed to get contact info" });
  }
};

/**
 * Get emails for a specific contact
 */
export const getContactEmails = async (req: Request, res: Response) => {
  try {
    const user = req.user as User;
    const { contactId } = req.params;
    
    if (!user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const limit = parseInt(req.query.limit as string) || 20;
    const emails = await emailService.getEmailsForContact(contactId, limit);

    res.json({ emails, count: emails.length });
  } catch (error) {
    console.error("Failed to get contact emails:", error);
    res.status(500).json({ error: "Failed to get contact emails" });
  }
};

/**
 * Get emails for a specific account
 */
export const getAccountEmails = async (req: Request, res: Response) => {
  try {
    const user = req.user as User;
    const { accountId } = req.params;
    
    if (!user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const limit = parseInt(req.query.limit as string) || 50;
    const emails = await emailService.getEmailsForAccount(accountId, limit);

    res.json({ emails, count: emails.length });
  } catch (error) {
    console.error("Failed to get account emails:", error);
    res.status(500).json({ error: "Failed to get account emails" });
  }
};

/**
 * Get email summary for an account
 */
export const getAccountEmailSummary = async (req: Request, res: Response) => {
  try {
    const user = req.user as User;
    const { accountId } = req.params;
    
    if (!user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const days = parseInt(req.query.days as string) || 30;
    const summary = await emailService.getAccountEmailSummary(accountId, days);

    res.json({ summary });
  } catch (error) {
    console.error("Failed to get account email summary:", error);
    res.status(500).json({ error: "Failed to get account email summary" });
  }
};

/**
 * Send email to a contact
 */
export const sendEmailToContact = async (req: Request, res: Response) => {
  try {
    const user = req.user as User;
    const { contactId } = req.params;
    const { subject, body, bodyHtml } = req.body;
    
    if (!user || !user.googleAccessToken) {
      return res.status(401).json({ error: "Google authentication required" });
    }

    // Get contact details to send email
    const contact = await emailService['contactRepository'].findOne({
      where: { id: contactId },
      relations: ['account']
    });

    if (!contact) {
      return res.status(404).json({ error: "Contact not found" });
    }

    if (!subject || !body) {
      return res.status(400).json({ error: "Subject and body are required" });
    }

    const email: EmailMessage = {
      subject,
      from: { email: user.email, name: user.name },
      to: [{ email: contact.email, name: `${contact.firstName} ${contact.lastName}` }],
      body,
      bodyHtml,
      date: new Date()
    };

    // Send email through Gmail
    const messageId = await gmailService.sendEmail(
      user.googleAccessToken,
      user.googleRefreshToken || '',
      email
    );

    // Save sent email to database and link to contact
    await emailService.saveAndLinkEmail(email, user.id);

    res.json({ 
      success: true, 
      messageId,
      message: `Email sent to ${contact.firstName} ${contact.lastName}` 
    });
  } catch (error) {
    console.error("Failed to send email to contact:", error);
    res.status(500).json({ error: "Failed to send email to contact" });
  }
};

/**
 * Mark email as read
 */
export const markEmailAsRead = async (req: Request, res: Response) => {
  try {
    const user = req.user as User;
    const { emailId } = req.params;
    
    if (!user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    await emailService.markEmailAsRead(emailId);

    res.json({ success: true, message: "Email marked as read" });
  } catch (error) {
    console.error("Failed to mark email as read:", error);
    res.status(500).json({ error: "Failed to mark email as read" });
  }
}; 