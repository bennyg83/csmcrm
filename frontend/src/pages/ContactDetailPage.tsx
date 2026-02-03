import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import { apiService } from '../services/api';
import { Contact, Account } from '../types';
import { usePermissions } from '../utils/rbac';
import { Box, Typography, CircularProgress, Alert, Card, CardContent, Avatar, Chip, Divider, Button, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, FormControl, InputLabel, Select, OutlinedInput, MenuItem, Checkbox, ListItemText as MuiListItemText, Grid, ToggleButtonGroup, ToggleButton, Paper, Tooltip } from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import EditIcon from '@mui/icons-material/Edit';
import ListIcon from '@mui/icons-material/List';
import KanbanIcon from '@mui/icons-material/ViewColumn';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import EmailHistory from '../components/EmailHistory';
import { Task, Category } from '../types';
import TaskTable from '../components/TaskTable';
import KanbanBoard from '../components/KanbanBoard';
import UserAutocomplete from '../components/UserAutocomplete';

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
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskStatus, setNewTaskStatus] = useState<'To Do' | 'In Progress' | 'Completed'>('To Do');
  const [newTaskPriority, setNewTaskPriority] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [newTaskDueDate, setNewTaskDueDate] = useState(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
  const [newTaskProgress, setNewTaskProgress] = useState(0);
  const [newTaskAssignedToInternal, setNewTaskAssignedToInternal] = useState<string[]>([]);
  const [newTaskAssignedToClient, setNewTaskAssignedToClient] = useState<string[]>([]);
  const [showContactKanban, setShowContactKanban] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [taskViewMode, setTaskViewMode] = useState<'table' | 'kanban'>('table');
  const [showCreateTask, setShowCreateTask] = useState(false);
  
  // Task editing state
  const [taskEditOpen, setTaskEditOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [taskEditForm, setTaskEditForm] = useState<Partial<Task>>({});
  
  // External user creation state
  const [showCreateExternalUser, setShowCreateExternalUser] = useState(false);
  const [externalUserForm, setExternalUserForm] = useState({
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    role: 'client_user'
  });
  
  // External user status state
  const [externalUserStatus, setExternalUserStatus] = useState<{
    hasExternalUser: boolean;
    externalUserId?: string;
    status?: string;
    role?: string;
  } | null>(null);

  // Projects this contact is involved in (project-contacts)
  const [contactProjects, setContactProjects] = useState<any[]>([]);
  // Notes linked to this contact
  const [contactNotes, setContactNotes] = useState<any[]>([]);

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
    if (!id) return;
    let cancelled = false;
    apiService.getProjectContactsByContact(id).then((data) => {
      if (!cancelled) setContactProjects(data);
    }).catch(() => { if (!cancelled) setContactProjects([]); });
    return () => { cancelled = true; };
  }, [id]);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    apiService.getNotes({ contactId: id }).then((data) => {
      if (!cancelled) setContactNotes(data);
    }).catch(() => { if (!cancelled) setContactNotes([]); });
    return () => { cancelled = true; };
  }, [id]);

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
            
            // Check if contact has external user access
            try {
              const externalUsers = await apiService.getExternalUsers(foundAccount.id);
              const contactExternalUser = externalUsers.find((eu: any) => eu.contactId === id);
              if (contactExternalUser) {
                setExternalUserStatus({
                  hasExternalUser: true,
                  externalUserId: contactExternalUser.id,
                  status: contactExternalUser.status,
                  role: contactExternalUser.role
                });
              } else {
                setExternalUserStatus({ hasExternalUser: false });
              }
            } catch (error) {
              console.log('Could not check external user status:', error);
              setExternalUserStatus({ hasExternalUser: false });
            }
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
        description: newTaskDescription.trim() || `Task for ${contact.firstName} ${contact.lastName}`,
        status: newTaskStatus,
        priority: newTaskPriority,
        dueDate: newTaskDueDate.toISOString(),
        assignedTo: newTaskAssignedToInternal,
        assignedToClient: newTaskAssignedToClient.length > 0 ? newTaskAssignedToClient : [contact.id],
        accountId: account.id,
        accountName: account.name,
        subTasks: [],
        dependencies: [],
        isDependent: false,
        progress: newTaskProgress
      });
      
      // Reset form
      setNewTaskTitle('');
      setNewTaskDescription('');
      setNewTaskStatus('To Do');
      setNewTaskPriority('Medium');
      setNewTaskDueDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
      setNewTaskProgress(0);
      setNewTaskAssignedToInternal([]);
      setNewTaskAssignedToClient([]);
      
      // Close dialog
      setShowCreateTask(false);
      
      // refresh account to surface tasks created under this account
      const updatedAcc = await apiService.getAccount(account.id);
      setAccount(updatedAcc);
    } catch (err) {
      alert('Failed to create task');
    }
  };

  const handleCreateTask = () => {
    // Reset form to default values
    setNewTaskTitle('');
    setNewTaskDescription('');
    setNewTaskStatus('To Do');
    setNewTaskPriority('Medium');
    setNewTaskDueDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
    setNewTaskProgress(0);
    setNewTaskAssignedToInternal([]);
    setNewTaskAssignedToClient([contact?.id || '']);
    setShowCreateTask(true);
  };

  // Task editing handlers
  const handleTaskEdit = (task: Task) => {
    setEditingTask(task);
    setTaskEditForm({
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate,
      progress: task.progress
    });
    setTaskEditOpen(true);
  };

  const handleTaskEditSave = async () => {
    if (!editingTask || !account) return;
    
    try {
      await apiService.updateTask(editingTask.id, taskEditForm);
      const updatedAcc = await apiService.getAccount(account.id);
      setAccount(updatedAcc);
      setTaskEditOpen(false);
      setEditingTask(null);
      setTaskEditForm({});
    } catch (err) {
      alert('Failed to update task');
    }
  };

  const handleTaskEditClose = () => {
    setTaskEditOpen(false);
    setEditingTask(null);
    setTaskEditForm({});
  };

  // External user creation handlers
  const handleCreateExternalUser = async () => {
    if (!contact || !account) return;
    
    try {
      const response = await apiService.createExternalUser({
        ...externalUserForm,
        accountId: account.id,
        contactId: contact.id
      });
      
      alert(`External user created successfully! Temporary password: ${response.tempPassword}`);
      setShowCreateExternalUser(false);
      setExternalUserForm({
        email: '',
        firstName: '',
        lastName: '',
        phone: '',
        role: 'client_user'
      });
    } catch (err: any) {
      alert(`Failed to create external user: ${err.response?.data?.error || err.message}`);
    }
  };

  const handleExternalUserFormChange = (field: string, value: string) => {
    setExternalUserForm(prev => ({ ...prev, [field]: value }));
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
          <Card sx={{ minWidth: 400, maxWidth: 500, position: 'relative' }}>
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
                  <Box sx={{ display: 'flex', gap: 1, mt: 0.5, flexWrap: 'wrap' }}>
                    {contact.isPrimary && <Chip label="Primary" color="primary" size="small" />}
                    {externalUserStatus?.hasExternalUser && (
                      <Tooltip title={`Status: ${externalUserStatus.status}, Role: ${externalUserStatus.role}`}>
                        <Chip 
                          label="External User" 
                          color="success" 
                          size="small" 
                          variant="outlined"
                          icon={<PersonIcon />}
                        />
                      </Tooltip>
                    )}
                  </Box>
                </Box>
              </Box>
              <Divider sx={{ mb: 2 }} />
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>{contact.email} | {contact.phone}</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 2 }}>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Button href={`mailto:${contact.email}`} startIcon={<EmailIcon />} size="small">Email</Button>
                  <Button href={`tel:${contact.phone}`} startIcon={<PhoneIcon />} size="small">Call</Button>
                </Box>
                {externalUserStatus?.hasExternalUser ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Button 
                      variant="outlined" 
                      size="small" 
                      startIcon={<PersonAddIcon />}
                      onClick={async () => {
                        try {
                          await apiService.resendPasswordReset(contact.email || '');
                          // Show success message
                          alert('Password reset email sent successfully!');
                        } catch (error: any) {
                          console.error('Failed to send password reset:', error);
                          alert('Failed to send password reset email. Please try again.');
                        }
                      }}
                      fullWidth
                      sx={{ 
                        borderColor: 'warning.main',
                        color: 'warning.main',
                        backgroundColor: 'rgba(255, 152, 0, 0.04)',
                        '&:hover': {
                          borderColor: 'warning.dark',
                          backgroundColor: 'rgba(255, 152, 0, 0.08)',
                          color: 'warning.dark'
                        }
                      }}
                    >
                      Resend Password Reset
                    </Button>
                    <Button 
                      variant="outlined" 
                      size="small" 
                      startIcon={<PersonIcon />}
                      onClick={async () => {
                        if (confirm('Are you sure you want to revoke external user access for this contact? This will remove their ability to log into the client portal.')) {
                          try {
                            await apiService.revokeExternalUser(externalUserStatus.externalUserId!);
                            // Update local state
                            setExternalUserStatus({ hasExternalUser: false });
                            // Show success message
                            alert('External user access revoked successfully!');
                          } catch (error: any) {
                            console.error('Failed to revoke external user:', error);
                            alert('Failed to revoke external user access. Please try again.');
                          }
                        }
                      }}
                      fullWidth
                      sx={{ 
                        borderColor: 'error.main',
                        color: 'error.main',
                        backgroundColor: 'rgba(244, 67, 54, 0.04)',
                        '&:hover': {
                          borderColor: 'error.dark',
                          backgroundColor: 'rgba(244, 67, 54, 0.08)',
                          color: 'error.dark'
                        }
                      }}
                    >
                      Revoke External Access
                    </Button>
                  </Box>
                ) : (
                  <Button 
                    variant="outlined" 
                    size="small" 
                    startIcon={<PersonAddIcon />}
                    onClick={() => {
                      console.log('Create External User button clicked for contact:', contact.id);
                      setExternalUserForm({
                        email: contact.email || '',
                        firstName: contact.firstName || '',
                        lastName: contact.lastName || '',
                        phone: contact.phone || '',
                        role: 'client_user'
                      });
                      setShowCreateExternalUser(true);
                    }}
                    fullWidth
                    sx={{ 
                      borderColor: 'primary.main',
                      color: 'primary.main',
                      backgroundColor: 'rgba(25, 118, 210, 0.04)',
                      '&:hover': {
                        borderColor: 'primary.dark',
                        backgroundColor: 'rgba(25, 118, 210, 0.08)',
                        color: 'primary.dark'
                      }
                    }}
                  >
                    Create External User
                  </Button>
                )}
                <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>
                  {externalUserStatus?.hasExternalUser 
                    ? 'Manage this contact\'s external user access'
                    : 'Give this contact access to the client portal'
                  }
                </Typography>
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

      {/* Projects this contact is involved in */}
      <Box sx={{ mb: 4 }}>
        <Paper sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Projects ({contactProjects.length})
            </Typography>
          </Box>
          {contactProjects.length === 0 ? (
            <Typography variant="body2" color="text.secondary">This contact is not linked to any projects yet. Add them from a project&apos;s Contacts section.</Typography>
          ) : (
            <List dense disablePadding>
              {contactProjects.map((pc: any) => (
                <ListItem
                  key={pc.id}
                  divider
                  sx={{ cursor: 'pointer' }}
                  component={RouterLink}
                  to={`/projects/${pc.project?.id || pc.projectId}`}
                >
                  <ListItemText
                    primary={pc.project?.name || 'Project'}
                    secondary={pc.role ? `Role: ${pc.role}` : undefined}
                  />
                  <Chip size="small" label={pc.project?.status || ''} variant="outlined" sx={{ ml: 1 }} />
                </ListItem>
              ))}
            </List>
          )}
        </Paper>
      </Box>

      {/* Notes linked to this contact */}
      <Box sx={{ mb: 4 }}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Notes ({contactNotes.length})
          </Typography>
          {contactNotes.length === 0 ? (
            <Typography variant="body2" color="text.secondary">No notes linked to this contact yet. Add notes from the account page and link them to this contact.</Typography>
          ) : (
            <List dense disablePadding>
              {contactNotes.map((note: any) => (
                <ListItem key={note.id} divider>
                  <ListItemText
                    primary={note.content?.slice(0, 120) + (note.content?.length > 120 ? '...' : '')}
                    secondary={`${note.type} · ${note.author} · ${new Date(note.createdAt).toLocaleDateString()}`}
                  />
                </ListItem>
              ))}
            </List>
          )}
        </Paper>
      </Box>

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
                onEdit={handleTaskEdit}
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

      {/* Task Edit Modal */}
      <Dialog open={taskEditOpen} onClose={handleTaskEditClose} maxWidth="md" fullWidth>
        <DialogTitle>Edit Task</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <TextField
            label="Title"
            value={taskEditForm.title || ''}
            onChange={(e) => setTaskEditForm({ ...taskEditForm, title: e.target.value })}
            fullWidth
            size="small"
          />
          <TextField
            label="Description"
            value={taskEditForm.description || ''}
            onChange={(e) => setTaskEditForm({ ...taskEditForm, description: e.target.value })}
            fullWidth
            multiline
            rows={3}
            size="small"
          />
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <FormControl size="small" fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={taskEditForm.status || ''}
                  onChange={(e) => setTaskEditForm({ ...taskEditForm, status: e.target.value })}
                  input={<OutlinedInput label="Status" />}
                >
                  <MenuItem value="To Do">To Do</MenuItem>
                  <MenuItem value="In Progress">In Progress</MenuItem>
                  <MenuItem value="Completed">Completed</MenuItem>
                  <MenuItem value="Cancelled">Cancelled</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <FormControl size="small" fullWidth>
                <InputLabel>Priority</InputLabel>
                <Select
                  value={taskEditForm.priority || ''}
                  onChange={(e) => setTaskEditForm({ ...taskEditForm, priority: e.target.value })}
                  input={<OutlinedInput label="Priority" />}
                >
                  <MenuItem value="Low">Low</MenuItem>
                  <MenuItem value="Medium">Medium</MenuItem>
                  <MenuItem value="High">High</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                label="Due Date"
                type="date"
                value={taskEditForm.dueDate ? new Date(taskEditForm.dueDate).toISOString().split('T')[0] : ''}
                onChange={(e) => setTaskEditForm({ ...taskEditForm, dueDate: e.target.value })}
                fullWidth
                size="small"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Progress (%)"
                type="number"
                value={taskEditForm.progress || 0}
                onChange={(e) => setTaskEditForm({ ...taskEditForm, progress: parseInt(e.target.value) || 0 })}
                fullWidth
                size="small"
                inputProps={{ min: 0, max: 100 }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleTaskEditClose}>Cancel</Button>
          <Button onClick={handleTaskEditSave} variant="contained">Save Changes</Button>
        </DialogActions>
      </Dialog>

      {/* Create External User Modal */}
      <Dialog open={showCreateExternalUser} onClose={() => setShowCreateExternalUser(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create External User for {contact?.firstName} {contact?.lastName}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
                        <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    label="First Name"
                    value={externalUserForm.firstName}
                    onChange={(e) => handleExternalUserFormChange('firstName', e.target.value)}
                    fullWidth
                    size="small"
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    label="Last Name"
                    value={externalUserForm.lastName}
                    onChange={(e) => handleExternalUserFormChange('lastName', e.target.value)}
                    fullWidth
                    size="small"
                  />
                </Grid>
              </Grid>
              <TextField
                label="Email"
                value={externalUserForm.email}
                onChange={(e) => handleExternalUserFormChange('email', e.target.value)}
                fullWidth
                size="small"
                type="email"
              />
              <TextField
                label="Phone"
                value={externalUserForm.phone}
                onChange={(e) => handleExternalUserFormChange('phone', e.target.value)}
                fullWidth
                size="small"
              />
          <FormControl size="small" fullWidth>
            <InputLabel>Role</InputLabel>
            <Select
              value={externalUserForm.role}
              onChange={(e) => handleExternalUserFormChange('role', e.target.value)}
              input={<OutlinedInput label="Role" />}
            >
              <MenuItem value="client_user">Client User</MenuItem>
              <MenuItem value="client_admin">Client Admin</MenuItem>
              <MenuItem value="client_viewer">Client Viewer</MenuItem>
            </Select>
          </FormControl>
          <Alert severity="info">
            An external user account will be created with a temporary password. 
            The user will receive an email with login instructions.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCreateExternalUser(false)}>Cancel</Button>
          <Button onClick={handleCreateExternalUser} variant="contained">Create User</Button>
        </DialogActions>
      </Dialog>

      {/* Create Task Modal */}
      <Dialog open={showCreateTask} onClose={() => setShowCreateTask(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create Task for {contact?.firstName} {contact?.lastName}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <TextField
            label="Title"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            fullWidth
            size="small"
            placeholder="Enter task title..."
          />
          <TextField
            label="Description"
            value={newTaskDescription}
            onChange={(e) => setNewTaskDescription(e.target.value)}
            multiline
            minRows={3}
            fullWidth
            size="small"
            placeholder="Enter task description..."
          />
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select 
                  value={newTaskStatus} 
                  label="Status"
                  onChange={(e) => setNewTaskStatus(e.target.value as 'To Do' | 'In Progress' | 'Completed')}
                >
                  <MenuItem value="To Do">To Do</MenuItem>
                  <MenuItem value="In Progress">In Progress</MenuItem>
                  <MenuItem value="Completed">Completed</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Priority</InputLabel>
                <Select 
                  value={newTaskPriority} 
                  label="Priority"
                  onChange={(e) => setNewTaskPriority(e.target.value as 'Low' | 'Medium' | 'High')}
                >
                  <MenuItem value="Low">Low</MenuItem>
                  <MenuItem value="Medium">Medium</MenuItem>
                  <MenuItem value="High">High</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
          <TextField
            label="Due Date"
            type="datetime-local"
            value={newTaskDueDate.toISOString().slice(0, 16)}
            onChange={(e) => setNewTaskDueDate(new Date(e.target.value))}
            fullWidth
            size="small"
            InputLabelProps={{ shrink: true }}
          />
          <UserAutocomplete
            label="Assigned To (Internal)"
            value={newTaskAssignedToInternal}
            onChange={(value) => setNewTaskAssignedToInternal(value)}
            context="internal"
          />
          <UserAutocomplete
            label="Assigned To Client"
            value={newTaskAssignedToClient}
            onChange={(value) => setNewTaskAssignedToClient(value)}
            context="external"
            accountId={account?.id}
            accountContacts={account?.contacts || []}
          />
          <Alert severity="info">
            This task will be automatically assigned to {contact?.firstName} {contact?.lastName} and associated with {account?.name}
          </Alert>
          <TextField
            label="Progress (%)"
            type="number"
            value={newTaskProgress}
            onChange={(e) => setNewTaskProgress(parseInt(e.target.value) || 0)}
            fullWidth
            size="small"
            InputProps={{
              inputProps: { min: 0, max: 100 }
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setShowCreateTask(false);
            // Reset form when canceling
            setNewTaskTitle('');
            setNewTaskDescription('');
            setNewTaskStatus('To Do');
            setNewTaskPriority('Medium');
            setNewTaskDueDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
            setNewTaskProgress(0);
            setNewTaskAssignedToInternal([]);
            setNewTaskAssignedToClient([]);
          }}>Cancel</Button>
          <Button onClick={handleCreateTaskForContact} variant="contained" disabled={!newTaskTitle.trim()}>
            Create Task
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ContactDetailPage; 