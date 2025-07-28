import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemText,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  CircularProgress,
  Alert,
  IconButton,
  Collapse,
  Divider
} from '@mui/material';
import {
  Email as EmailIcon,
  Send as SendIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Reply as ReplyIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { apiService } from '../services/api';

interface Email {
  id: string;
  subject: string;
  senderEmail: string;
  senderName?: string;
  recipientEmails: string[];
  body: string;
  bodyHtml?: string;
  dateSent: string;
  isSent: boolean;
  isRead: boolean;
  snippet?: string;
}

interface EmailHistoryProps {
  contactId?: string;
  accountId?: string;
  title?: string;
  allowCompose?: boolean;
}

const EmailHistory: React.FC<EmailHistoryProps> = ({ 
  contactId, 
  accountId, 
  title = "Email History",
  allowCompose = true 
}) => {
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [expandedEmails, setExpandedEmails] = useState<Set<string>>(new Set());
  const [showCompose, setShowCompose] = useState(false);
  const [composeForm, setComposeForm] = useState({
    subject: '',
    body: ''
  });

  useEffect(() => {
    loadEmails();
  }, [contactId, accountId]);

  const loadEmails = async () => {
    try {
      setLoading(true);
      setError('');
      
      let response;
      if (contactId) {
        response = await apiService.getContactEmails(contactId, 20);
      } else if (accountId) {
        response = await apiService.getAccountEmails(accountId, 20);
      } else {
        throw new Error('Either contactId or accountId must be provided');
      }
      
      setEmails(response.emails || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load emails');
    } finally {
      setLoading(false);
    }
  };

  const toggleEmailExpansion = (emailId: string) => {
    const newExpanded = new Set(expandedEmails);
    if (newExpanded.has(emailId)) {
      newExpanded.delete(emailId);
    } else {
      newExpanded.add(emailId);
    }
    setExpandedEmails(newExpanded);
  };

  const handleSendEmail = async () => {
    try {
      if (!contactId) {
        setError('Can only send emails to contacts');
        return;
      }

      setError('');
      await apiService.sendEmailToContact(contactId, {
        subject: composeForm.subject,
        body: composeForm.body
      });
      
      setShowCompose(false);
      setComposeForm({ subject: '', body: '' });
      loadEmails(); // Refresh emails
      alert('Email sent successfully!');
    } catch (err: any) {
      setError(err.message || 'Failed to send email');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatEmailAddress = (email: string, name?: string) => {
    return name ? `${name} <${email}>` : email;
  };

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
            <CircularProgress />
            <Typography variant="h6" sx={{ ml: 2 }}>Loading emails...</Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6" component="h3">
            <EmailIcon sx={{ mr: 1, verticalAlign: 'bottom' }} />
            {title} ({emails.length})
          </Typography>
          
          <Box>
            <IconButton onClick={loadEmails} title="Refresh">
              <RefreshIcon />
            </IconButton>
            {allowCompose && contactId && (
              <Button
                variant="contained"
                startIcon={<SendIcon />}
                onClick={() => setShowCompose(true)}
                size="small"
                sx={{ ml: 1 }}
              >
                Send Email
              </Button>
            )}
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {emails.length === 0 ? (
          <Typography color="text.secondary" textAlign="center" py={4}>
            No emails found for this {contactId ? 'contact' : 'account'}.
          </Typography>
        ) : (
          <List>
            {emails.map((email, index) => (
              <Box key={email.id}>
                <ListItem
                  sx={{
                    cursor: 'pointer',
                    '&:hover': { backgroundColor: 'action.hover' },
                    flexDirection: 'column',
                    alignItems: 'stretch'
                  }}
                >
                  <Box 
                    display="flex" 
                    justifyContent="space-between" 
                    alignItems="center" 
                    width="100%"
                    onClick={() => toggleEmailExpansion(email.id)}
                  >
                    <Box flexGrow={1}>
                      <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {email.subject || '(No Subject)'}
                        {!email.isRead && (
                          <Chip label="Unread" size="small" color="primary" />
                        )}
                        <Chip 
                          label={email.isSent ? 'Sent' : 'Received'} 
                          size="small" 
                          color={email.isSent ? 'success' : 'default'} 
                        />
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {email.isSent ? 'To:' : 'From:'} {formatEmailAddress(
                          email.isSent ? email.recipientEmails[0] : email.senderEmail,
                          email.isSent ? undefined : email.senderName
                        )}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatDate(email.dateSent)}
                      </Typography>
                    </Box>
                    
                    <IconButton size="small">
                      {expandedEmails.has(email.id) ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    </IconButton>
                  </Box>

                  <Collapse in={expandedEmails.has(email.id)}>
                    <Box sx={{ mt: 2, p: 2, backgroundColor: 'grey.50', borderRadius: 1 }}>
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                        {email.body}
                      </Typography>
                      
                      {email.bodyHtml && (
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="caption" color="text.secondary">
                            HTML Content:
                          </Typography>
                          <Box 
                            sx={{ mt: 0.5, maxHeight: '200px', overflow: 'auto' }}
                            dangerouslySetInnerHTML={{ __html: email.bodyHtml }}
                          />
                        </Box>
                      )}

                      {contactId && !email.isSent && (
                        <Box sx={{ mt: 2 }}>
                          <Button
                            size="small"
                            startIcon={<ReplyIcon />}
                            onClick={() => {
                              setComposeForm({
                                subject: email.subject.startsWith('Re:') ? email.subject : `Re: ${email.subject}`,
                                body: `\n\n--- Original Message ---\nFrom: ${email.senderEmail}\nDate: ${formatDate(email.dateSent)}\nSubject: ${email.subject}\n\n${email.body}`
                              });
                              setShowCompose(true);
                            }}
                          >
                            Reply
                          </Button>
                        </Box>
                      )}
                    </Box>
                  </Collapse>
                </ListItem>
                
                {index < emails.length - 1 && <Divider />}
              </Box>
            ))}
          </List>
        )}

        {/* Compose Email Dialog */}
        <Dialog open={showCompose} onClose={() => setShowCompose(false)} maxWidth="md" fullWidth>
          <DialogTitle>Send Email</DialogTitle>
          <DialogContent>
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
              rows={8}
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
              disabled={!composeForm.subject || !composeForm.body}
            >
              Send Email
            </Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default EmailHistory; 