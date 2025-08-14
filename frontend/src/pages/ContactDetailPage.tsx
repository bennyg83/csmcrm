import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import { apiService } from '../services/api';
import { Contact, Account } from '../types';
import { usePermissions } from '../utils/rbac';
import { Box, Typography, CircularProgress, Alert, Card, CardContent, Avatar, Chip, Divider, Button, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, FormControl, InputLabel, Select, OutlinedInput, MenuItem, Checkbox, ListItemText as MuiListItemText, Grid, ToggleButtonGroup, ToggleButton, Paper } from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import EditIcon from '@mui/icons-material/Edit';
import ListIcon from '@mui/icons-material/List';
import KanbanIcon from '@mui/icons-material/ViewColumn';
import EmailHistory from '../components/EmailHistory';
import { Task, Category } from '../types';
import TaskTable from '../components/TaskTable';
import KanbanBoard from '../components/KanbanBoard';

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
  const { canUpdate, canCreate } = usePermissions();
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [showContactKanban, setShowContactKanban] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [taskViewMode, setTaskViewMode] = useState<'table' | 'kanban'>('table');
  const [showCreateTask, setShowCreateTask] = useState(false);

  // Filtered tasks for this contact
  const filteredTasks = useMemo(() => {
    if (!account?.tasks || !contact) return [];
    return account.tasks.filter((t: Task) => {
      const assignedClients = Array.isArray(t.assignedToClient) ? t.assignedToClient : t.assignedToClient ? [t.assignedToClient] : [];
      const isAssignedToContact = assignedClients.includes(contact.id);
      const isAssignedToContactByName = assignedClients.includes(`${contact.firstName} ${contact.lastName}`);
      return isAssignedToContact || isAssignedToContactByName;
    });
  }, [account?.tasks, contact]);

  useEffect(() => {
    const fetchContact = async () => {
      try {
        setLoading(true);
        setError(null);
        if (id) {
          const [accounts, cats] = await Promise.all([apiService.getAccounts(), apiService.getCategories()]);
          setCategories(cats);
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
          // Load full account with tasks for this contact's account
          if (foundAccount) {
            const fullAccount = await apiService.getAccount(foundAccount.id);
            setAccount(fullAccount);
          } else {
            setAccount(null);
          }
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

  const handleCreateTaskForContact = async () => {
    if (!contact || !account || !newTaskTitle.trim()) return;
    try {
      await apiService.createTask({
        title: newTaskTitle.trim(),
        description: `Task for ${contact.firstName} ${contact.lastName}`,
        status: 'To Do',
        priority: 'Medium',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        assignedTo: [],
        assignedToClient: [contact.id],
        accountId: account.id,
        accountName: account.name,
        subTasks: [],
        dependencies: [],
        isDependent: false,
        progress: 0
      });
      setNewTaskTitle('');
      // refresh account to surface tasks created under this account
      const updatedAcc = await apiService.getAccount(account.id);
      setAccount(updatedAcc);
    } catch (err) {
      alert('Failed to create task');
    }
  };

  const handleCreateTask = () => {
    setShowCreateTask(true);
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
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2"><b>Status:</b></Typography>
                  <Chip label={account.status} color={account.status === 'active' ? 'success' : account.status === 'at-risk' ? 'warning' : 'default'} size="small" />
                </Box>
                <Typography variant="body2"><b>Health:</b> {account.health}%</Typography>
                <Typography variant="body2"><b>Revenue:</b> ${account.revenue.toLocaleString()}</Typography>
                <Typography variant="body2"><b>Account Manager:</b> {account.accountManager}</Typography>
                <Typography variant="body2"><b>Customer Success:</b> {account.customerSuccessManager}</Typography>
                <Typography variant="body2"><b>Sales Engineer:</b> {account.salesEngineer}</Typography>
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>

      {/* Tasks Section - full width to match Notes width */}
      {account && (
        <Box sx={{ mb: 4 }}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Tasks for this contact ({filteredTasks.length})
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <ToggleButtonGroup
                  value={taskViewMode}
                  exclusive
                  onChange={(_, newMode) => newMode && setTaskViewMode(newMode)}
                  size="small"
                >
                  <ToggleButton value="table">
                    <ListIcon fontSize="small" />
                  </ToggleButton>
                  <ToggleButton value="kanban">
                    <KanbanIcon fontSize="small" />
                  </ToggleButton>
                </ToggleButtonGroup>
                {canCreate('tasks') && (
                  <Button variant="contained" size="small" onClick={handleCreateTask}>
                    Create Task
                  </Button>
                )}
              </Box>
            </Box>

            {/* Task Table/Kanban View */}
            {taskViewMode === 'table' ? (
              <TaskTable
                tasks={filteredTasks}
                categories={categories}
                onRowClick={() => {}}
                onEdit={async (task) => {
                  try {
                    const updated = await apiService.updateTask(task.id, task);
                    const updatedAcc = await apiService.getAccount(account.id);
                    setAccount(updatedAcc);
                  } catch {}
                }}
                onDelete={async (taskId) => {
                  if (!confirm('Delete this task?')) return;
                  try {
                    await apiService.deleteTask(taskId);
                    const updatedAcc = await apiService.getAccount(account.id);
                    setAccount(updatedAcc);
                  } catch {}
                }}
              />
            ) : (
              <KanbanBoard
                tasks={filteredTasks}
                onTaskUpdate={async (taskId, updates) => {
                  try {
                    await apiService.updateTask(taskId, updates);
                    const updatedAcc = await apiService.getAccount(account.id);
                    setAccount(updatedAcc);
                  } catch {}
                }}
                onTaskClick={() => {}}
                onTaskEdit={() => {}}
              />
            )}
          </Paper>
        </Box>
      )}

      {/* Email History Section */}
      <Box sx={{ mb: 4 }}>
        <EmailHistory contactId={contact.id} title="Email History" />
      </Box>

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