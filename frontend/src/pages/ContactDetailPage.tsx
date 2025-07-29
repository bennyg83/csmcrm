import React, { useEffect, useState } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import { apiService } from '../services/api';
import { Contact, Account } from '../types';
import { usePermissions } from '../utils/rbac';
import { Box, Typography, CircularProgress, Alert, Card, CardContent, Avatar, Chip, Divider, Button, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, FormControl, InputLabel, Select, OutlinedInput, MenuItem, Checkbox, ListItemText as MuiListItemText, Grid } from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import EditIcon from '@mui/icons-material/Edit';
import EmailHistory from '../components/EmailHistory';

const CONTACT_TYPE_OPTIONS = [
  'DM',
  'Budget Holder',
  'Finance',
  'System User',
  'Champion',
  'Lead',
  'Other',
];

const ContactDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [contact, setContact] = useState<Contact | null>(null);
  const [account, setAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Contact>>({});
  const { canUpdate } = usePermissions();

  useEffect(() => {
    const fetchContact = async () => {
      try {
        setLoading(true);
        setError(null);
        if (id) {
          const accounts = await apiService.getAccounts();
          let foundContact: Contact | null = null;
          let foundAccount: Account | null = null;
          for (const acc of accounts) {
            if (acc.contacts) {
              const c = acc.contacts.find((ct) => ct.id === id);
              if (c) {
                foundContact = c;
                foundAccount = acc;
                break;
              }
            }
          }
          setContact(foundContact);
          setAccount(foundAccount);
        }
      } catch (err) {
        setError('Failed to load contact details');
      } finally {
        setLoading(false);
      }
    };
    fetchContact();
  }, [id]);

  const handleEditOpen = () => {
    if (contact) {
      setEditForm({
        firstName: contact.firstName,
        lastName: contact.lastName,
        email: contact.email,
        phone: contact.phone,
        title: contact.title,
        contactTypes: contact.contactTypes || [],
        otherType: contact.otherType || '',
      });
      setEditOpen(true);
    }
  };
  const handleEditClose = () => setEditOpen(false);

  const handleEditChange = (field: keyof Contact, value: any) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleEditSave = async () => {
    if (!canUpdate('contacts')) return;
    if (contact && account) {
      try {
        const updated = await apiService.updateContact(account.id, contact.id, editForm);
        setContact(updated);
        setEditOpen(false);
      } catch (err) {
        alert('Failed to update contact');
      }
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          Contact Details
        </Typography>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!contact) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          Contact Details
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Contact not found.
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        {contact.firstName} {contact.lastName}
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          {/* Contact Info Card */}
          <Card sx={{ minWidth: 320, maxWidth: 400, position: 'relative' }}>
            <CardContent>
                              {canUpdate('contacts') && (
                  <IconButton onClick={handleEditOpen} sx={{ position: 'absolute', top: 8, right: 8 }}>
                    <EditIcon />
                  </IconButton>
                )}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Avatar sx={{ bgcolor: contact.isPrimary ? 'primary.main' : 'grey.300', color: 'white', width: 56, height: 56 }}>
                  <PersonIcon />
                </Avatar>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>{contact.firstName} {contact.lastName}</Typography>
                  <Typography variant="body2" color="text.secondary">{contact.title || ''}</Typography>
                  {contact.isPrimary && <Chip label="Primary" color="primary" size="small" sx={{ mt: 0.5 }} />}
                </Box>
              </Box>
              <Divider sx={{ mb: 2 }} />
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>{contact.email} | {contact.phone}</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Button href={`mailto:${contact.email}`} startIcon={<EmailIcon />} size="small">Email</Button>
                <Button href={`tel:${contact.phone}`} startIcon={<PhoneIcon />} size="small">Call</Button>
              </Box>
              
              {contact.contactTypes && contact.contactTypes.length > 0 && (
                <Box sx={{ mb: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>Contact Type:</Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 0.5 }}>
                    {contact.contactTypes.map((type) => (
                      <Chip key={type} label={type === 'Other' && contact.otherType ? contact.otherType : type} size="small" color="secondary" />
                    ))}
                  </Box>
                </Box>
              )}
              <Typography variant="body2" color="text.secondary">{contact.title}</Typography>
              <Typography variant="body2" color="text.secondary">Created: {new Date(contact.createdAt).toLocaleDateString()}</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          {/* Account Info Card */}
          {account && (
            <Card sx={{ minWidth: 320, maxWidth: 400 }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                  Account Info
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Typography variant="body1"><b>Name:</b> <Button component={RouterLink} to={`/accounts/${account.id}`}>{account.name}</Button></Typography>
                <Typography variant="body2"><b>Industry:</b> {account.industry || 'N/A'}</Typography>
                <Typography variant="body2"><b>Status:</b> <Chip label={account.status} color={account.status === 'active' ? 'success' : account.status === 'at-risk' ? 'warning' : 'default'} size="small" /></Typography>
                <Typography variant="body2"><b>Health:</b> {account.health}%</Typography>
                <Typography variant="body2"><b>Revenue:</b> ${account.revenue.toLocaleString()}</Typography>
                <Typography variant="body2"><b>Account Manager:</b> {account.accountManager}</Typography>
                <Typography variant="body2"><b>Customer Success:</b> {account.customerSuccessManager}</Typography>
                <Typography variant="body2"><b>Sales Engineer:</b> {account.salesEngineer}</Typography>
              </CardContent>
            </Card>
          )}
        </Grid>

        <Grid item xs={12}>
          {/* Email History */}
          <EmailHistory contactId={contact.id} title="Email History" />
        </Grid>
      </Grid>
        {/* Edit Contact Modal */}
        <Dialog open={editOpen} onClose={handleEditClose} maxWidth="xs" fullWidth>
          <DialogTitle>Edit Contact</DialogTitle>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="First Name"
              value={editForm.firstName || ''}
              onChange={(e) => handleEditChange('firstName', e.target.value)}
              fullWidth
              size="small"
            />
            <TextField
              label="Last Name"
              value={editForm.lastName || ''}
              onChange={(e) => handleEditChange('lastName', e.target.value)}
              fullWidth
              size="small"
            />
            <TextField
              label="Title"
              value={editForm.title || ''}
              onChange={(e) => handleEditChange('title', e.target.value)}
              fullWidth
              size="small"
            />
            <TextField
              label="Email"
              value={editForm.email || ''}
              onChange={(e) => handleEditChange('email', e.target.value)}
              fullWidth
              size="small"
            />
            <TextField
              label="Phone"
              value={editForm.phone || ''}
              onChange={(e) => handleEditChange('phone', e.target.value)}
              fullWidth
              size="small"
            />
            <FormControl size="small" fullWidth>
              <InputLabel>Contact Type</InputLabel>
              <Select
                multiple
                value={editForm.contactTypes || []}
                onChange={(e) => handleEditChange('contactTypes', typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value as string[])}
                input={<OutlinedInput label="Contact Type" />}
                renderValue={(selected) => (selected as string[]).join(', ')}
              >
                {CONTACT_TYPE_OPTIONS.map((type) => (
                  <MenuItem key={type} value={type}>
                    <Checkbox checked={(editForm.contactTypes || []).indexOf(type) > -1} />
                    <MuiListItemText primary={type} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {(editForm.contactTypes || []).includes('Other') && (
              <TextField
                label="Other Type"
                value={editForm.otherType || ''}
                onChange={(e) => handleEditChange('otherType', e.target.value)}
                fullWidth
                size="small"
              />
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleEditClose}>Cancel</Button>
            <Button onClick={handleEditSave} variant="contained">Save</Button>
          </DialogActions>
        </Dialog>
    </Box>
  );
};

export default ContactDetailPage; 