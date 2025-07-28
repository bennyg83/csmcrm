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
  Snackbar,
  Paper,
  Divider,
  IconButton,
  Tooltip,
  Avatar,
  Badge,
  ListItemAvatar,
  ListItemSecondaryAction,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput,
  Checkbox,
  ListItemText as MuiListItemText,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  LinearProgress,
  Skeleton
} from '@mui/material';
import {
  Email as EmailIcon,
  Send as SendIcon,
  Reply as ReplyIcon,
  Search as SearchIcon,
  ContactMail as ContactIcon,
  Refresh as RefreshIcon,
  Sync as SyncIcon,
  ExpandMore as ExpandMoreIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  Schedule as ScheduleIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  AttachFile as AttachFileIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  Delete as DeleteIcon,
  Archive as ArchiveIcon,
  MarkEmailRead as MarkReadIcon,
  MarkEmailUnread as MarkUnreadIcon,
  FilterList as FilterIcon,
  Sort as SortIcon,
  Add as AddIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { gmailService, EmailMessage, ContactInfo } from '../services/gmailService';
import { apiService } from '../services/api';

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
  const [showEmailDetail, setShowEmailDetail] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [usePreview, setUsePreview] = useState(true);

  // Compose email state
  const [composeForm, setComposeForm] = useState({
    to: '',
    cc: '',
    bcc: '',
    subject: '',
    body: ''
  });

  // Reply state
  const [replyForm, setReplyForm] = useState({
    body: ''
  });

  useEffect(() => {
    loadEmails();
  }, [usePreview]);

  const loadEmails = async () => {
    try {
      setLoading(true);
      setError('');
      const emailData = await gmailService.getRecentEmails(20, undefined, usePreview);
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
      const recipients = composeForm.to.split(',').map(email => ({ email: email.trim() }));
      const ccRecipients = composeForm.cc ? composeForm.cc.split(',').map(email => ({ email: email.trim() })) : undefined;
      const bccRecipients = composeForm.bcc ? composeForm.bcc.split(',').map(email => ({ email: email.trim() })) : undefined;

      await gmailService.sendEmail({
        to: recipients,
        cc: ccRecipients,
        bcc: bccRecipients,
        subject: composeForm.subject,
        body: composeForm.body
      });
      
      setShowCompose(false);
      setComposeForm({ to: '', cc: '', bcc: '', subject: '', body: '' });
      loadEmails();
      setSnackbarMessage('Email sent successfully!');
    } catch (err: any) {
      setError(err.message || 'Failed to send email');
    }
  };

  const handleReplyToEmail = async () => {
    if (!selectedEmail) return;
    
    try {
      setError('');
      await gmailService.replyToEmail(selectedEmail.id!, replyForm.body);
      setShowEmailDetail(false);
      setReplyForm({ body: '' });
      loadEmails();
      setSnackbarMessage('Reply sent successfully!');
    } catch (err: any) {
      setError(err.message || 'Failed to send reply');
    }
  };

  const handleViewEmail = async (email: EmailMessage) => {
    if (usePreview && email.body === '') {
      // Load full email content
      try {
        const fullEmail = await gmailService.getEmailById(email.id!);
        setSelectedEmail(fullEmail);
      } catch (err: any) {
        setError('Failed to load email content');
        return;
      }
    } else {
      setSelectedEmail(email);
    }
    setShowEmailDetail(true);
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
      
      loadEmails();
    } catch (err: any) {
      setError(err.message || 'Failed to sync emails');
    } finally {
      setSyncing(false);
    }
  };

  const filteredEmails = emails.filter(email => {
    const matchesSearch = email.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         email.from.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         email.from.name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = filterType === 'all' || 
                         (filterType === 'unread' && !email.isRead) ||
                         (filterType === 'read' && email.isRead);
    
    return matchesSearch && matchesFilter;
  });

  const sortedEmails = [...filteredEmails].sort((a, b) => {
    switch (sortBy) {
      case 'date':
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      case 'subject':
        return a.subject.localeCompare(b.subject);
      case 'sender':
        return a.from.email.localeCompare(b.from.email);
      default:
        return 0;
    }
  });

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

  /**
   * Convert URLs in text to clickable links
   */
  const convertUrlsToLinks = (text: string): React.ReactNode => {
    if (!text) return text;
    
    // URL regex pattern - matches http/https URLs
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    
    const parts = text.split(urlRegex);
    
    return parts.map((part, index) => {
      if (urlRegex.test(part)) {
        return (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: '#1976d2',
              textDecoration: 'underline',
              wordBreak: 'break-all'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {part}
          </a>
        );
      }
      return part;
    });
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
                        backgroundColor: selectedEmail?.id === email.id 
                          ? 'primary.50' 
                          : !email.isRead 
                            ? 'action.selected' 
                            : 'transparent',
                        borderLeft: selectedEmail?.id === email.id ? 4 : 0,
                        borderColor: 'primary.main',
                        '&:hover': { 
                          backgroundColor: selectedEmail?.id === email.id 
                            ? 'primary.100' 
                            : 'action.hover' 
                        }
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
                            <Typography variant="body2" color="text.primary">
                              To: {email.to.map(formatEmailAddress).join(', ')}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" noWrap>
                              {email.snippet || email.body?.substring(0, 150) + '...'}
                            </Typography>
                            {email.body && email.body.length > 150 && (
                              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                {convertUrlsToLinks(email.body.substring(0, 150) + '...')}
                              </Typography>
                            )}
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
                    onClick={() => {
                      setSelectedEmail(selectedEmail);
                      setShowEmailDetail(true);
                    }}
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
                  <Typography 
                    variant="body1" 
                    style={{ 
                      whiteSpace: 'pre-wrap',
                      fontFamily: 'inherit',
                      lineHeight: 1.6
                    }}
                  >
                    {convertUrlsToLinks(selectedEmail.body)}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>

      {/* Compose Email Dialog */}
      <Dialog open={showCompose} onClose={() => setShowCompose(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Compose Email</Typography>
            <IconButton onClick={() => setShowCompose(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label="To"
              value={composeForm.to}
              onChange={(e) => setComposeForm({ ...composeForm, to: e.target.value })}
              fullWidth
              placeholder="recipient@example.com, another@example.com"
              helperText="Separate multiple emails with commas"
            />
            <TextField
              label="CC"
              value={composeForm.cc}
              onChange={(e) => setComposeForm({ ...composeForm, cc: e.target.value })}
              fullWidth
              placeholder="cc@example.com"
            />
            <TextField
              label="BCC"
              value={composeForm.bcc}
              onChange={(e) => setComposeForm({ ...composeForm, bcc: e.target.value })}
              fullWidth
              placeholder="bcc@example.com"
            />
            <TextField
              label="Subject"
              value={composeForm.subject}
              onChange={(e) => setComposeForm({ ...composeForm, subject: e.target.value })}
              fullWidth
            />
            <TextField
              label="Body"
              value={composeForm.body}
              onChange={(e) => setComposeForm({ ...composeForm, body: e.target.value })}
              fullWidth
              multiline
              rows={8}
              placeholder="Write your email here..."
            />
          </Box>
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

      {/* Email Detail Dialog */}
      <Dialog open={showEmailDetail} onClose={() => setShowEmailDetail(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">{selectedEmail?.subject}</Typography>
            <IconButton onClick={() => setShowEmailDetail(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedEmail && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  {selectedEmail.from.name?.charAt(0) || selectedEmail.from.email.charAt(0).toUpperCase()}
                </Avatar>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    {selectedEmail.from.name || selectedEmail.from.email}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {new Date(selectedEmail.date).toLocaleString()}
                  </Typography>
                </Box>
              </Box>
              
              <Divider />
              
              <Box sx={{ p: 2 }}>
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                  {convertUrlsToLinks(selectedEmail.body || 'No content available')}
                </Typography>
              </Box>

              <Divider />

              <Box sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>Reply</Typography>
                <TextField
                  label="Your reply"
                  value={replyForm.body}
                  onChange={(e) => setReplyForm({ body: e.target.value })}
                  fullWidth
                  multiline
                  rows={4}
                  placeholder="Write your reply..."
                />
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowEmailDetail(false)}>Close</Button>
          <Button 
            onClick={handleReplyToEmail} 
            variant="contained"
            startIcon={<ReplyIcon />}
            disabled={!replyForm.body}
          >
            Send Reply
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
      >
        <Alert onClose={() => setSnackbarMessage(null)} severity="success">
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default EmailPage; 