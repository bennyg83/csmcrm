import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  CircularProgress,
  Alert,
  Fab,
  Grid,
  Snackbar
} from '@mui/material';
import {
  Email as EmailIcon,
  Send as SendIcon,
  Reply as ReplyIcon,
  Search as SearchIcon,
  ContactMail as ContactIcon,
  Refresh as RefreshIcon,
  Sync as SyncIcon
} from '@mui/icons-material';
import { gmailService, EmailMessage, ContactInfo } from '../services/gmailService';
import apiService from '../services/api';

const EmailPage: React.FC = () => {
  const [emails, setEmails] = useState<EmailMessage[]>([]);
  const [contacts, setContacts] = useState<ContactInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [selectedEmail, setSelectedEmail] = useState<EmailMessage | null>(null);
  const [showCompose, setShowCompose] = useState(false);
  const [showContacts, setShowContacts] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState<string | null>(null);

  // Compose email state
  const [composeForm, setComposeForm] = useState({
    to: '',
    subject: '',
    body: ''
  });

  useEffect(() => {
    loadEmails();
  }, []);

  const loadEmails = async () => {
    try {
      setLoading(true);
      setError('');
      const emailData = await gmailService.getRecentEmails(10);
      setEmails(emailData);
    } catch (err: any) {
      setError(err.message || 'Failed to load emails');
    } finally {
      setLoading(false);
    }
  };

  const loadContacts = async () => {
    try {
      setError('');
      const contactData = await gmailService.discoverContacts(20);
      setContacts(contactData);
      setShowContacts(true);
    } catch (err: any) {
      setError(err.message || 'Failed to discover contacts');
    }
  };

  const handleSendEmail = async () => {
    try {
      setError('');
      await gmailService.sendEmail({
        to: [{ email: composeForm.to }],
        subject: composeForm.subject,
        body: composeForm.body
      });
      
      setShowCompose(false);
      setComposeForm({ to: '', subject: '', body: '' });
      loadEmails(); // Refresh emails
      alert('Email sent successfully!');
    } catch (err: any) {
      setError(err.message || 'Failed to send email');
    }
  };

  const handleReplyToEmail = async (email: EmailMessage) => {
    try {
      setError('');
      const replyBody = prompt('Enter your reply:');
      if (replyBody) {
        await gmailService.replyToEmail(email.id!, replyBody);
        alert('Reply sent successfully!');
        loadEmails(); // Refresh emails
      }
    } catch (err: any) {
      setError(err.message || 'Failed to send reply');
    }
  };

  const syncEmailsWithContacts = async () => {
    try {
      setSyncing(true);
      setError('');
      
      const result = await apiService.syncEmailsWithContacts(20);
      
      setSnackbarMessage(
        `Sync completed! ${result.summary.totalEmailsProcessed} emails processed, ` +
        `${result.summary.linkedToContacts} linked to contacts, ` +
        `${result.summary.linkedToAccounts} linked to accounts`
      );
      
      // Refresh the email list after sync
      loadEmails();
    } catch (err: any) {
      setError(err.message || 'Failed to sync emails');
    } finally {
      setSyncing(false);
    }
  };

  const debugEmailSync = async () => {
    try {
      setSyncing(true);
      setError('');
      
      const result = await apiService.debugEmailSync(10);
      
      console.log('=== DEBUG EMAIL SYNC RESULTS ===');
      console.log('Summary:', result.summary);
      console.log('Email Details:', result.summary.emailDetails);
      console.log('Link Results:', result.summary.linkResults);
      
      setSnackbarMessage(
        `Debug sync completed! Check browser console for detailed logs. ` +
        `${result.summary.totalEmailsProcessed} emails processed, ` +
        `${result.summary.linkedToContacts} linked to contacts`
      );
      
      // Refresh the email list after sync
      loadEmails();
    } catch (err: any) {
      setError(err.message || 'Failed to debug sync emails');
    } finally {
      setSyncing(false);
    }
  };

  const formatEmailAddress = (address: { email: string; name?: string }) => {
    return address.name ? `${address.name} <${address.email}>` : address.email;
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>Loading emails...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          <EmailIcon sx={{ mr: 1, verticalAlign: 'bottom' }} />
          Gmail Integration
        </Typography>
        
        <Box>
          <Button
            variant="outlined"
            startIcon={<ContactIcon />}
            onClick={loadContacts}
            sx={{ mr: 2 }}
          >
            Discover Contacts
          </Button>
          <Button
            variant="outlined"
            startIcon={syncing ? <CircularProgress size={16} /> : <SyncIcon />}
            onClick={syncEmailsWithContacts}
            disabled={syncing}
            sx={{ mr: 2 }}
          >
            {syncing ? 'Syncing...' : 'Sync Emails'}
          </Button>
          <Button
            variant="outlined"
            color="secondary"
            startIcon={syncing ? <CircularProgress size={16} /> : <SearchIcon />}
            onClick={debugEmailSync}
            disabled={syncing}
            sx={{ mr: 2 }}
          >
            {syncing ? 'Debugging...' : 'Debug Sync'}
          </Button>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadEmails}
            sx={{ mr: 2 }}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<SendIcon />}
            onClick={() => setShowCompose(true)}
          >
            Compose Email
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Emails ({emails.length})
              </Typography>
              
              {emails.length === 0 ? (
                <Typography color="text.secondary">
                  No emails found. Make sure you're logged in with Google.
                </Typography>
              ) : (
                <List>
                  {emails.map((email) => (
                    <ListItem
                      key={email.id}
                      divider
                      sx={{
                        cursor: 'pointer',
                        '&:hover': { backgroundColor: 'action.hover' }
                      }}
                      onClick={() => setSelectedEmail(email)}
                    >
                      <ListItemText
                        primary={
                          <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Typography variant="subtitle2" noWrap>
                              {email.subject || '(No Subject)'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {formatDate(email.date)}
                            </Typography>
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.primary">
                              From: {formatEmailAddress(email.from)}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" noWrap>
                              {email.snippet || email.body?.substring(0, 100) + '...'}
                            </Typography>
                          </Box>
                        }
                        primaryTypographyProps={{ component: 'div' }}
                        secondaryTypographyProps={{ component: 'div' }}
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          {selectedEmail && (
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
                  <Typography variant="h6">
                    {selectedEmail.subject || '(No Subject)'}
                  </Typography>
                  <Button
                    size="small"
                    startIcon={<ReplyIcon />}
                    onClick={() => handleReplyToEmail(selectedEmail)}
                  >
                    Reply
                  </Button>
                </Box>
                
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  <strong>From:</strong> {formatEmailAddress(selectedEmail.from)}
                </Typography>
                
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  <strong>To:</strong> {selectedEmail.to.map(formatEmailAddress).join(', ')}
                </Typography>
                
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  <strong>Date:</strong> {selectedEmail.date.toLocaleString()}
                </Typography>
                
                <Box sx={{ mt: 2, p: 2, backgroundColor: 'grey.50', borderRadius: 1 }}>
                  <Typography variant="body1" style={{ whiteSpace: 'pre-wrap' }}>
                    {selectedEmail.body}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>

      {/* Compose Email Dialog */}
      <Dialog open={showCompose} onClose={() => setShowCompose(false)} maxWidth="md" fullWidth>
        <DialogTitle>Compose Email</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="To"
            value={composeForm.to}
            onChange={(e) => setComposeForm({ ...composeForm, to: e.target.value })}
            margin="normal"
            placeholder="recipient@example.com"
          />
          <TextField
            fullWidth
            label="Subject"
            value={composeForm.subject}
            onChange={(e) => setComposeForm({ ...composeForm, subject: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Message"
            multiline
            rows={6}
            value={composeForm.body}
            onChange={(e) => setComposeForm({ ...composeForm, body: e.target.value })}
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCompose(false)}>Cancel</Button>
          <Button
            onClick={handleSendEmail}
            variant="contained"
            startIcon={<SendIcon />}
            disabled={!composeForm.to || !composeForm.subject || !composeForm.body}
          >
            Send Email
          </Button>
        </DialogActions>
      </Dialog>

      {/* Contacts Dialog */}
      <Dialog open={showContacts} onClose={() => setShowContacts(false)} maxWidth="md" fullWidth>
        <DialogTitle>Discovered Contacts ({contacts.length})</DialogTitle>
        <DialogContent>
          {contacts.length === 0 ? (
            <Typography>No contacts discovered from recent emails.</Typography>
          ) : (
            <List>
              {contacts.map((contact, index) => (
                <ListItem key={index} divider>
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="subtitle2">
                          {contact.name || contact.email}
                        </Typography>
                        {contact.company && (
                          <Chip label={contact.company} size="small" variant="outlined" />
                        )}
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2">{contact.email}</Typography>
                        {contact.phone && (
                          <Typography variant="body2" color="text.secondary">
                            {contact.phone}
                          </Typography>
                        )}
                        {contact.domain && (
                          <Chip label={contact.domain} size="small" sx={{ mt: 0.5 }} />
                        )}
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowContacts(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Sync Notification Snackbar */}
      <Snackbar
        open={!!snackbarMessage}
        autoHideDuration={6000}
        onClose={() => setSnackbarMessage(null)}
        message={snackbarMessage}
      />
    </Box>
  );
};

export default EmailPage; 