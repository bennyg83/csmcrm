import { Router } from "express";
import {
  getRecentEmails,
  getEmailById,
  sendEmail,
  replyToEmail,
  searchEmails,
  discoverContacts,
  getGmailLabels,
  syncEmailsWithContacts,
  getContactEmails,
  getAccountEmails,
  getAccountEmailSummary,
  sendEmailToContact,
  markEmailAsRead,
  debugEmailSync,
  debugContactInfo
} from "../controllers/gmailController";
import { auth } from "../middleware/auth";

const router = Router();

/**
 * @route   GET /api/gmail/emails
 * @desc    Get recent emails for authenticated user
 * @access  Private
 * @params  ?limit=20&q=search_query
 */
router.get("/emails", auth, getRecentEmails);

/**
 * @route   GET /api/gmail/emails/:emailId
 * @desc    Get specific email by ID
 * @access  Private
 */
router.get("/emails/:emailId", auth, getEmailById);

/**
 * @route   POST /api/gmail/emails/send
 * @desc    Send a new email
 * @access  Private
 * @body    { to, cc, bcc, subject, body, bodyHtml }
 */
router.post("/emails/send", auth, sendEmail);

/**
 * @route   POST /api/gmail/emails/:emailId/reply
 * @desc    Reply to an email
 * @access  Private
 * @body    { body }
 */
router.post("/emails/:emailId/reply", auth, replyToEmail);

/**
 * @route   GET /api/gmail/search
 * @desc    Search emails
 * @access  Private
 * @params  ?query=search_term&limit=10
 */
router.get("/search", auth, searchEmails);

/**
 * @route   GET /api/gmail/contacts/discover
 * @desc    Discover contacts from recent emails
 * @access  Private
 * @params  ?maxEmails=50
 */
router.get("/contacts/discover", auth, discoverContacts);

/**
 * @route   GET /api/gmail/labels
 * @desc    Get Gmail labels
 * @access  Private
 */
router.get("/labels", auth, getGmailLabels);

/**
 * @route   POST /api/gmail/sync
 * @desc    Sync emails from Gmail and link to contacts
 * @access  Private
 * @params  ?maxEmails=20
 */
router.post("/sync", auth, syncEmailsWithContacts);

/**
 * @route   POST /api/gmail/debug-sync
 * @desc    Debug email sync - shows detailed logs of what emails are being processed
 * @access  Private
 * @params  ?maxEmails=10
 */
router.post("/debug-sync", auth, debugEmailSync);

/**
 * @route   GET /api/gmail/contacts/:contactId/emails
 * @desc    Get emails for a specific contact
 * @access  Private
 * @params  ?limit=20
 */
router.get("/contacts/:contactId/emails", auth, getContactEmails);

/**
 * @route   GET /api/gmail/accounts/:accountId/emails
 * @desc    Get emails for a specific account
 * @access  Private
 * @params  ?limit=50
 */
router.get("/accounts/:accountId/emails", auth, getAccountEmails);

/**
 * @route   GET /api/gmail/accounts/:accountId/email-summary
 * @desc    Get email summary for an account
 * @access  Private
 * @params  ?days=30
 */
router.get("/accounts/:accountId/email-summary", auth, getAccountEmailSummary);

/**
 * @route   POST /api/gmail/contacts/:contactId/send
 * @desc    Send email to a specific contact
 * @access  Private
 * @body    { subject, body, bodyHtml }
 */
router.post("/contacts/:contactId/send", auth, sendEmailToContact);

/**
 * @route   PATCH /api/gmail/emails/:emailId/read
 * @desc    Mark email as read
 * @access  Private
 */
router.patch("/emails/:emailId/read", auth, markEmailAsRead);

/**
 * @route   GET /api/gmail/debug/contacts/:contactId
 * @desc    Debug contact information - shows contact details
 * @access  Private
 */
router.get("/debug/contacts/:contactId", auth, debugContactInfo);

export default router; 