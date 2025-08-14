import React, { useEffect, useState, useMemo } from 'react';
import { Typography, Box, CircularProgress, Alert, Chip, Grid, Paper, Divider, Card, CardContent, Avatar, Button, List, ListItem, ListItemText, Checkbox, TextField, IconButton, Menu, MenuItem, FormControl, InputLabel, Select, OutlinedInput, ListItemText as MuiListItemText, Dialog, DialogTitle, DialogContent, DialogActions, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, LinearProgress, Switch, FormControlLabel, ToggleButton, ToggleButtonGroup } from '@mui/material';
import { useParams } from 'react-router-dom';
import { apiService } from '../services/api';
import { Account, Contact, Task } from '../types';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import PersonIcon from '@mui/icons-material/Person';
import AddIcon from '@mui/icons-material/Add';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { Link as RouterLink } from 'react-router-dom';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { 
  Save as SaveIcon, 
  History as HistoryIcon, 
  Download as DownloadIcon,
  RestoreFromTrash as RestoreIcon,
  ViewKanban as KanbanIcon,
  ViewList as ListIcon,
  Search as SearchIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import UserAutocomplete from '../components/UserAutocomplete';
import { usePermissions } from '../utils/rbac';

const CONTACT_TYPE_OPTIONS = [
  'DM',
  'Budget Holder',
  'Finance',
  'System User',
  'Champion',
  'Lead',
  'Other',
];

interface NoteHistory {
  id: string;
  content: string;
  timestamp: string;
  version: number;
}

const AccountDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [account, setAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newTask, setNewTask] = useState<{ [contactId: string]: string }>({});
  const [menuAnchor, setMenuAnchor] = useState<{ [contactId: string]: HTMLElement | null }>({});
  const [contactTypes, setContactTypes] = useState<{ [contactId: string]: string[] }>({});
  const [otherType, setOtherType] = useState<{ [contactId: string]: string }>({});
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Account>>({});
  const [addContactOpen, setAddContactOpen] = useState(false);
  const [addContactForm, setAddContactForm] = useState<Partial<Contact>>({});
  const [notes, setNotes] = useState('');
  const [noteHistory, setNoteHistory] = useState<NoteHistory[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [newAccountTask, setNewAccountTask] = useState<{ title: string; dueDate: string; priority: 'Low' | 'Medium' | 'High'; assignedTo: string[]; assignedToClient: string[] }>({ 
    title: '', 
    dueDate: '', 
    priority: 'Medium',
    assignedTo: [],
    assignedToClient: []
  });
  const [showEditTask, setShowEditTask] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [editTaskForm, setEditTaskForm] = useState<Partial<Task>>({});

  // Task table filter states
  const [taskViewMode, setTaskViewMode] = useState<'table' | 'kanban'>('table');
  const [taskSearch, setTaskSearch] = useState('');
  const [taskStatusFilter, setTaskStatusFilter] = useState<string[]>([]);
  const [taskPriorityFilter, setTaskPriorityFilter] = useState<string[]>([]);
  const [showCompletedTasks, setShowCompletedTasks] = useState(true);
  const [showOverdueTasks, setShowOverdueTasks] = useState(true);

  // Quill editor configuration
  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'align': [] }],
      ['link', 'image'],
      ['clean']
    ],
  };

  const quillFormats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list', 'bullet',
    'color', 'background',
    'align',
    'link', 'image'
  ];

  useEffect(() => {
    const fetchAccount = async () => {
      try {
        setLoading(true);
        setError(null);
        if (id) {
          const data = await apiService.getAccount(id);
          setAccount(data);
          // Load notes from account data
          if (data.accountNotes) {
            setNotes(data.accountNotes);
          }
          // Load notes history from localStorage for now (could be moved to backend later)
          const savedHistory = localStorage.getItem(`account-notes-history-${id}`);
          if (savedHistory) {
            setNoteHistory(JSON.parse(savedHistory));
          }
        }
      } catch (err) {
        setError('Failed to load account details');
      } finally {
        setLoading(false);
      }
    };
    fetchAccount();
  }, [id]);

  const calculateDaysUntilRenewal = (renewalDate: string) => {
    const renewal = new Date(renewalDate);
    const today = new Date();
    const diffTime = renewal.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getRenewalStatus = (days: number) => {
    if (days < 0) return { status: 'Overdue', color: 'error' as const };
    if (days <= 30) return { status: 'Due Soon', color: 'warning' as const };
    if (days <= 90) return { status: 'Upcoming', color: 'info' as const };
    return { status: 'Active', color: 'success' as const };
  };

  const handleSaveNotes = async (saveToHistory: boolean = false) => {
    if (id && account) {
      try {
        if (saveToHistory && notes.trim()) {
          // Save current notes to history
          const newHistoryEntry: NoteHistory = {
            id: Date.now().toString(),
            content: notes,
            timestamp: new Date().toISOString(),
            version: noteHistory.length + 1
          };
          const updatedHistory = [newHistoryEntry, ...noteHistory];
          setNoteHistory(updatedHistory);
          localStorage.setItem(`account-notes-history-${id}`, JSON.stringify(updatedHistory));
        }
        
        // Save current notes to backend
        await apiService.updateAccount(account.id, { accountNotes: notes });
        
        // Update local account state
        setAccount((prev) => prev ? { ...prev, accountNotes: notes } : prev);
        
        alert(saveToHistory ? 'Notes saved with history!' : 'Notes saved!');
      } catch (err) {
        alert('Failed to save notes');
      }
    }
  };

  const handleRestoreFromHistory = (historyEntry: NoteHistory) => {
    if (confirm('Are you sure you want to restore this version? Current notes will be lost.')) {
      setNotes(historyEntry.content);
      setShowHistory(false);
    }
  };

  const handleExportNotes = () => {
    const element = document.createElement('a');
    const file = new Blob([notes], { type: 'text/html' });
    element.href = URL.createObjectURL(file);
    element.download = `${account?.name}-notes-${new Date().toISOString().slice(0, 10)}.html`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleTaskInputChange = (contactId: string, value: string) => {
    setNewTask((prev) => ({ ...prev, [contactId]: value }));
  };

  const handleAddTask = async (contactId: string) => {
    if (newTask[contactId] && account) {
      try {
        const contact = account.contacts?.find((c) => c.id === contactId);
        if (contact) {
          await apiService.createTask({
            title: newTask[contactId],
            description: `Task for ${contact.firstName} ${contact.lastName}`,
            status: 'To Do',
            priority: 'Medium',
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
            assignedTo: ['Current User'], // This could be dynamic
            assignedToClient: [contact.id],
            accountId: account.id,
            accountName: account.name,
            subTasks: [],
            dependencies: [],
            isDependent: false,
            progress: 0
          });
          
          // Clear the input
          setNewTask((prev) => ({ ...prev, [contactId]: '' }));
          
          // Refresh account data to get the new task
          if (id) {
            const updatedAccount = await apiService.getAccount(id);
            setAccount(updatedAccount);
          }
        }
      } catch (err) {
        console.error('Failed to create task:', err);
        alert('Failed to create task');
      }
    }
  };

  const handleToggleTask = async (taskId: string) => {
    try {
      const task = account?.tasks?.find((t: Task) => t.id === taskId);
      if (task) {
        const newStatus = task.status === 'Completed' ? 'To Do' : 'Completed';
        await apiService.updateTask(taskId, { status: newStatus });
        
        // Refresh account data to get updated task status
        if (id) {
          const updatedAccount = await apiService.getAccount(id);
          setAccount(updatedAccount);
        }
      }
    } catch (err) {
      console.error('Failed to update task status:', err);
      alert('Failed to update task status');
    }
  };

  // Hamburger menu handlers
  const handleMenuOpen = (contactId: string, event: React.MouseEvent<HTMLElement>) => {
    setMenuAnchor((prev) => ({ ...prev, [contactId]: event.currentTarget }));
  };
  const handleMenuClose = (contactId: string) => {
    setMenuAnchor((prev) => ({ ...prev, [contactId]: null }));
  };
  const handleEditContact = (contact: Contact) => {
    console.log('Edit contact:', contact);
    handleMenuClose(contact.id);
  };
  const handleDeleteContact = (contact: Contact) => {
    console.log('Delete contact:', contact);
    handleMenuClose(contact.id);
  };

  // Contact type handlers
  const handleContactTypeChange = async (contactId: string, value: string[]) => {
    if (!canUpdate('contacts')) return;
    setContactTypes((prev) => ({ ...prev, [contactId]: value }));
    const contact = account?.contacts?.find((c) => c.id === contactId);
    if (contact) {
      try {
        await apiService.updateContact(contact.accountId, contact.id, {
          contactTypes: value,
          otherType: value.includes('Other') ? otherType[contactId] : undefined,
        });
        // Optionally update local account state
        setAccount((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            contacts: prev.contacts?.map((c) =>
              c.id === contactId ? { ...c, contactTypes: value, otherType: value.includes('Other') ? otherType[contactId] : undefined } : c
            ),
          };
        });
      } catch (err) {
        console.error('Failed to update contact type', err);
      }
    }
  };
  const handleOtherTypeChange = async (contactId: string, value: string) => {
    if (!canUpdate('contacts')) return;
    setOtherType((prev) => ({ ...prev, [contactId]: value }));
    const contact = account?.contacts?.find((c) => c.id === contactId);
    if (contact && (contactTypes[contactId] || []).includes('Other')) {
      try {
        await apiService.updateContact(contact.accountId, contact.id, {
          contactTypes: contactTypes[contactId],
          otherType: value,
        });
        setAccount((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            contacts: prev.contacts?.map((c) =>
              c.id === contactId ? { ...c, contactTypes: contactTypes[contactId], otherType: value } : c
            ),
          };
        });
      } catch (err) {
        console.error('Failed to update contact other type', err);
      }
    }
  };

  const handleEditOpen = () => {
    if (account) {
      setEditForm({
        name: account.name,
        email: account.email,
        phone: account.phone,
        address: account.address,
        industry: account.industry,
        website: account.website,
        description: account.description,
        businessUseCase: account.businessUseCase,
        techStack: account.techStack,
        health: account.health,
        revenue: account.revenue,
        renewalDate: account.renewalDate,
        arr: account.arr,
        riskScore: account.riskScore,
        lastTouchpoint: account.lastTouchpoint,
        nextScheduled: account.nextScheduled,
        accountManager: account.accountManager,
        customerSuccessManager: account.customerSuccessManager,
        salesEngineer: account.salesEngineer,
        tierId: account.tierId,
        status: account.status,
        employees: account.employees,
        accountNotes: account.accountNotes,
      });
      setEditOpen(true);
    }
  };
  const handleEditClose = () => setEditOpen(false);
  const handleEditChange = (field: keyof Account, value: any) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  };
  const handleEditSave = async () => {
    if (account) {
      try {
        const updated = await apiService.updateAccount(account.id, editForm);
        setAccount((prev) => prev ? { ...prev, ...updated } : prev);
        setEditOpen(false);
      } catch (err) {
        alert('Failed to update account');
      }
    }
  };

  const handleAddContactOpen = () => {
    setAddContactForm({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      title: '',
      isPrimary: false,
      contactTypes: [],
      otherType: ''
    });
    setAddContactOpen(true);
  };

  const handleAddContactClose = () => setAddContactOpen(false);

  const handleAddContactChange = (field: keyof Contact, value: any) => {
    setAddContactForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddContactSave = async () => {
    if (account) {
      try {
        await apiService.createContact(account.id, addContactForm);
        setAddContactOpen(false);
        
        // Refresh account data to get the new contact
        if (id) {
          const updatedAccount = await apiService.getAccount(id);
          setAccount(updatedAccount);
        }
      } catch (err) {
        alert('Failed to create contact');
      }
    }
  };

  const handleCreateAccountTask = async () => {
    if (account && newAccountTask.title && newAccountTask.dueDate) {
      try {
        await apiService.createTask({
          title: newAccountTask.title,
          description: `Task for ${account.name}`,
          status: 'To Do',
          priority: newAccountTask.priority,
          dueDate: newAccountTask.dueDate,
          assignedTo: newAccountTask.assignedTo,
          assignedToClient: newAccountTask.assignedToClient,
          accountId: account.id,
          accountName: account.name,
          subTasks: [],
          dependencies: [],
          isDependent: false,
          progress: 0
        });
        
        setShowCreateTask(false);
        // Clear the input
        setNewAccountTask({ title: '', dueDate: '', priority: 'Medium', assignedTo: [], assignedToClient: [] });
        
        // Refresh account data to get the new task
        if (id) {
          const updatedAccount = await apiService.getAccount(id);
          setAccount(updatedAccount);
        }
      } catch (err) {
        console.error('Failed to create task:', err);
        alert('Failed to create task');
      }
    }
  };

  const handleEditTask = (task: Task) => {
    setSelectedTask(task);
    setEditTaskForm({
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate,
      assignedTo: Array.isArray(task.assignedTo) ? task.assignedTo : task.assignedTo ? [task.assignedTo] : [],
      assignedToClient: Array.isArray(task.assignedToClient) ? task.assignedToClient : task.assignedToClient ? [task.assignedToClient] : [],
      accountId: task.accountId,
      accountName: task.accountName,
      progress: task.progress || 0
    });
    setShowEditTask(true);
  };

  const handleEditTaskSave = async () => {
    if (selectedTask && editTaskForm && account) {
      try {
        // Ensure account relationship is maintained
        const taskUpdateData = {
          ...editTaskForm,
          accountId: account.id,
          accountName: account.name
        };
        await apiService.updateTask(selectedTask.id, taskUpdateData);
        setShowEditTask(false);
        setSelectedTask(null);
        setEditTaskForm({});
        // Refresh account data
        if (id) {
          const updatedAccount = await apiService.getAccount(id);
          setAccount(updatedAccount);
        }
      } catch (err) {
        alert('Failed to update task');
      }
    }
  };

  const handleDeleteTask = async () => {
    if (selectedTask && confirm('Are you sure you want to delete this task?')) {
      try {
        await apiService.deleteTask(selectedTask.id);
        setShowEditTask(false);
        setSelectedTask(null);
        setEditTaskForm({});
        // Refresh account data
        if (id) {
          const updatedAccount = await apiService.getAccount(id);
          setAccount(updatedAccount);
        }
      } catch (err) {
        alert('Failed to delete task');
      }
    }
  };

  const { canUpdate, canCreate, canDelete } = usePermissions();

  // Filtered tasks logic
  const filteredTasks = useMemo(() => {
    if (!account?.tasks) return [];

    let filtered = [...account.tasks];

    // Search filter
    if (taskSearch) {
      const searchLower = taskSearch.toLowerCase();
      filtered = filtered.filter(task =>
        task.title.toLowerCase().includes(searchLower) ||
        task.description.toLowerCase().includes(searchLower) ||
        (task.assignedTo && Array.isArray(task.assignedTo) ? task.assignedTo.join(' ').toLowerCase().includes(searchLower) : task.assignedTo?.toLowerCase().includes(searchLower)) ||
        (task.assignedToClient && Array.isArray(task.assignedToClient) ? task.assignedToClient.join(' ').toLowerCase().includes(searchLower) : task.assignedToClient?.toLowerCase().includes(searchLower))
      );
    }

    // Status filter
    if (taskStatusFilter.length > 0) {
      filtered = filtered.filter(task => taskStatusFilter.includes(task.status));
    }

    // Priority filter
    if (taskPriorityFilter.length > 0) {
      filtered = filtered.filter(task => taskPriorityFilter.includes(task.priority));
    }

    // Completed tasks filter
    if (!showCompletedTasks) {
      filtered = filtered.filter(task => task.status !== 'Completed');
    }

    // Overdue tasks filter - if showOverdueTasks is false, hide overdue tasks
    if (!showOverdueTasks) {
      filtered = filtered.filter(task => {
        const dueDate = new Date(task.dueDate);
        const now = new Date();
        const isOverdue = dueDate < now && task.status !== 'Completed';
        return !isOverdue;
      });
    }

    return filtered.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }, [account?.tasks, taskSearch, taskStatusFilter, taskPriorityFilter, showCompletedTasks, showOverdueTasks]);

  // Get task status and priority options
  const statusOptions = ['To Do', 'In Progress', 'Completed', 'Cancelled'];
  const priorityOptions = ['Low', 'Medium', 'High'];

  // Helper functions for task display
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'success';
      case 'In Progress': return 'warning';
      case 'Cancelled': return 'error';
      default: return 'default';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'error';
      case 'Medium': return 'warning';
      default: return 'default';
    }
  };

  const isTaskOverdue = (task: Task) => {
    const dueDate = new Date(task.dueDate);
    const now = new Date();
    return dueDate < now && task.status !== 'Completed';
  };

  const resolveContactNames = (idsOrNames: string | string[] | undefined) => {
    if (!idsOrNames) return '';
    const arr = Array.isArray(idsOrNames) ? idsOrNames : [idsOrNames];
    // Map IDs to names where possible; if not an ID match, use the value as-is (backward compatibility)
    const names = arr.map((value) => {
      const match = account?.contacts?.find((c) => c.id === value);
      return match ? `${match.firstName} ${match.lastName}` : value;
    });
    return names.join(', ');
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
          Account Details
        </Typography>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!account) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          Account Details
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Account not found.
        </Typography>
      </Box>
    );
  }

  const daysUntilRenewal = calculateDaysUntilRenewal(account.renewalDate);
  const renewalStatus = getRenewalStatus(daysUntilRenewal);

  return (
    <Box>
      <Box display="flex" alignItems="center" gap={2}>
        <Typography variant="h4" gutterBottom>
          {account.name}
        </Typography>
                 {canUpdate('accounts') && (
            <Button variant="outlined" size="small" onClick={handleEditOpen}>Edit</Button>
         )}
      </Box>
      
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 1 }}>
              Account Info
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Typography variant="body1"><b>Industry:</b> {account.industry || 'N/A'}</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Typography variant="body1"><b>Status:</b></Typography>
              <Chip label={account.status} color={account.status === 'active' ? 'success' : account.status === 'at-risk' ? 'warning' : 'default'} size="small" />
            </Box>
            <Typography variant="body1"><b>Health:</b> {account.health}%</Typography>
            <Typography variant="body1"><b>Revenue:</b> ${account.revenue.toLocaleString()}</Typography>
            <Typography variant="body1"><b>License ARR:</b> ${account.arr.toLocaleString()}</Typography>
            <Typography variant="body1"><b>Renewal Date:</b> {new Date(account.renewalDate).toLocaleDateString()}</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Typography variant="body1"><b>Days Until Renewal:</b></Typography>
              <Chip 
                label={`${daysUntilRenewal} days (${renewalStatus.status})`} 
                color={renewalStatus.color} 
                size="small" 
              />
            </Box>
            <Typography variant="body1"><b>Employees:</b> {account.employees}</Typography>
            <Typography variant="body1"><b>Account Manager:</b> {account.accountManager}</Typography>
            <Typography variant="body1"><b>Customer Success:</b> {account.customerSuccessManager}</Typography>
            <Typography variant="body1"><b>Sales Engineer:</b> {account.salesEngineer}</Typography>
            <Typography variant="body1"><b>Email:</b> {account.email}</Typography>
            <Typography variant="body1"><b>Phone:</b> {account.phone}</Typography>
            <Typography variant="body1"><b>Address:</b> {account.address}</Typography>
            <Typography variant="body1"><b>Website:</b> {account.website || 'N/A'}</Typography>
          </Paper>
        </Grid>
                <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 1 }}>
              Description
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Typography variant="body2" color="text.secondary">
              {account.description || 'No description provided.'}
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Tasks Section - full width to match Notes width */}
      <Box sx={{ mb: 4 }}>
        <Paper sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Account Tasks ({filteredTasks.length})
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
                <Button variant="contained" size="small" onClick={() => setShowCreateTask(true)}>
                  Create Task
                </Button>
              )}
            </Box>
          </Box>

          {/* Task Filters */}
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap', alignItems: 'center' }}>
              <TextField
                size="small"
                placeholder="Search tasks..."
                value={taskSearch}
                onChange={(e) => setTaskSearch(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                }}
                sx={{ minWidth: 200 }}
              />
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Status</InputLabel>
                <Select
                  multiple
                  value={taskStatusFilter}
                  onChange={(e) => setTaskStatusFilter(typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value)}
                  input={<OutlinedInput label="Status" />}
                  renderValue={(selected) => (selected as string[]).join(', ')}
                >
                  {statusOptions.map((status) => (
                    <MenuItem key={status} value={status}>
                      <Checkbox checked={taskStatusFilter.indexOf(status) > -1} />
                      <MuiListItemText primary={status} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Priority</InputLabel>
                <Select
                  multiple
                  value={taskPriorityFilter}
                  onChange={(e) => setTaskPriorityFilter(typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value)}
                  input={<OutlinedInput label="Priority" />}
                  renderValue={(selected) => (selected as string[]).join(', ')}
                >
                  {priorityOptions.map((priority) => (
                    <MenuItem key={priority} value={priority}>
                      <Checkbox checked={taskPriorityFilter.indexOf(priority) > -1} />
                      <MuiListItemText primary={priority} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={showCompletedTasks}
                    onChange={(e) => setShowCompletedTasks(e.target.checked)}
                    size="small"
                  />
                }
                label="Show Completed"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={showOverdueTasks}
                    onChange={(e) => setShowOverdueTasks(e.target.checked)}
                    size="small"
                  />
                }
                label="Show Overdue"
              />
            </Box>
          </Box>

          {/* Task Table/Kanban View */}
          {taskViewMode === 'table' ? (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Task</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Priority</TableCell>
                    <TableCell>Due Date</TableCell>
                    <TableCell>Assigned To</TableCell>
                    <TableCell>Progress</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredTasks.length > 0 ? (
                    filteredTasks.map((task) => (
                      <TableRow key={task.id} hover>
                        <TableCell>
                          <Box>
                            <Typography 
                              variant="subtitle2" 
                              sx={{ 
                                cursor: 'pointer',
                                '&:hover': { textDecoration: 'underline' },
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1
                              }}
                              onClick={() => handleEditTask(task)}
                            >
                              {isTaskOverdue(task) && (
                                <WarningIcon color="error" fontSize="small" />
                              )}
                              {task.title}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {task.description.substring(0, 50)}...
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={task.status} 
                            color={getStatusColor(task.status) as any}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={task.priority} 
                            color={getPriorityColor(task.priority) as any}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color={isTaskOverdue(task) ? 'error' : 'inherit'}>
                            {new Date(task.dueDate).toLocaleDateString()}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box>
                            {task.assignedTo && (
                              <Typography variant="caption" color="primary">
                                {Array.isArray(task.assignedTo) ? task.assignedTo.join(', ') : task.assignedTo}
                              </Typography>
                            )}
                            {task.assignedToClient && (
                              <Typography variant="caption" color="text.secondary" display="block">
                                Client: {resolveContactNames(task.assignedToClient)}
                              </Typography>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <LinearProgress 
                              variant="determinate" 
                              value={task.progress || 0} 
                              sx={{ width: 60, height: 6 }}
                            />
                            <Typography variant="caption">
                              {task.progress || 0}%
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <IconButton size="small" onClick={() => handleEditTask(task)}>
                            <PersonIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        <Typography variant="body2" color="text.secondary">
                          No tasks found matching the current filters.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Box sx={{ display: 'flex', gap: 2, overflowX: 'auto', pb: 2 }}>
              {statusOptions.map((status) => (
                <Paper key={status} sx={{ minWidth: 250, p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    {status} ({filteredTasks.filter(t => t.status === status).length})
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {filteredTasks
                      .filter(task => task.status === status)
                      .map((task) => (
                        <Card 
                          key={task.id} 
                          sx={{ 
                            p: 2, 
                            cursor: 'pointer',
                            '&:hover': { boxShadow: 2 },
                            borderLeft: isTaskOverdue(task) ? '4px solid red' : 'none'
                          }}
                          onClick={() => handleEditTask(task)}
                        >
                          <Typography variant="subtitle2" gutterBottom>
                            {task.title}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" paragraph>
                            {task.description.substring(0, 80)}...
                          </Typography>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Chip 
                              label={task.priority} 
                              color={getPriorityColor(task.priority) as any}
                              size="small"
                            />
                            <Typography variant="caption" color={isTaskOverdue(task) ? 'error' : 'text.secondary'}>
                              {new Date(task.dueDate).toLocaleDateString()}
                            </Typography>
                          </Box>
                          <LinearProgress 
                            variant="determinate" 
                            value={task.progress || 0} 
                            sx={{ mt: 1, height: 4 }}
                          />
                        </Card>
                      ))}
                  </Box>
                </Paper>
              ))}
            </Box>
          )}
        </Paper>
      </Box>

      {/* Notes Section */}
      <Box sx={{ mb: 4 }}>
        <Paper sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Notes
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                startIcon={<HistoryIcon />}
                onClick={() => setShowHistory(!showHistory)}
                size="small"
              >
                {showHistory ? 'Hide History' : 'Show History'}
              </Button>
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={handleExportNotes}
                size="small"
              >
                Export
              </Button>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={() => handleSaveNotes(false)}
                size="small"
              >
                Save
              </Button>
              <Button
                variant="contained"
                startIcon={<HistoryIcon />}
                onClick={() => handleSaveNotes(true)}
                size="small"
              >
                Save with History
              </Button>
            </Box>
          </Box>
          <Divider sx={{ mb: 2 }} />
          
          <Box sx={{ mb: 3 }}>
            <ReactQuill
              theme="snow"
              value={notes}
              onChange={setNotes}
              modules={quillModules}
              formats={quillFormats}
              style={{ height: '200px', marginBottom: '50px' }}
            />
          </Box>

          {/* Notes History */}
          {showHistory && noteHistory.length > 0 && (
            <Box sx={{ mt: 4 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Notes History
              </Typography>
              <Divider sx={{ mb: 2 }} />
              {noteHistory.map((entry) => (
                <Card key={entry.id} sx={{ mb: 2 }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Version {entry.version} - {new Date(entry.timestamp).toLocaleString()}
                      </Typography>
                      <Button
                        variant="outlined"
                        startIcon={<RestoreIcon />}
                        onClick={() => handleRestoreFromHistory(entry)}
                        size="small"
                      >
                        Restore
                      </Button>
                    </Box>
                    <Divider sx={{ mb: 1 }} />
                    <Box 
                      dangerouslySetInnerHTML={{ __html: entry.content }}
                      sx={{ 
                        maxHeight: '150px', 
                        overflow: 'auto',
                        '& img': { maxWidth: '100%', height: 'auto' }
                      }}
                    />
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}
        </Paper>
      </Box>

      {/* Contact Cards Section */}
      <Box sx={{ mt: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            Contacts
          </Typography>
          {canCreate('contacts') && (
            <Button variant="contained" startIcon={<AddIcon />} onClick={handleAddContactOpen}>
              Add Contact
            </Button>
          )}
        </Box>
        <Grid container spacing={3}>
          {account.contacts && account.contacts.length > 0 ? (
            account.contacts.map((contact: Contact) => {
              const types = contactTypes[contact.id] ?? contact.contactTypes ?? [];
              const other = otherType[contact.id] ?? contact.otherType ?? '';
              return (
                <Grid item xs={12} md={6} lg={4} key={contact.id}>
                  <Card sx={{ p: 2 }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                        <Avatar sx={{ bgcolor: contact.isPrimary ? 'primary.main' : 'grey.300', color: 'white', width: 48, height: 48 }}>
                          <PersonIcon />
                        </Avatar>
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            <Button component={RouterLink} to={`/contacts/${contact.id}`} sx={{ p: 0, minWidth: 0, textTransform: 'none' }}>
                              {contact.firstName} {contact.lastName}
                            </Button>
                          </Typography>
                          <Typography variant="body2" color="text.secondary">{contact.title || ''}</Typography>
                          {contact.isPrimary && (
                            <Box sx={{ mt: 0.5 }}>
                              <Chip label="Primary" color="primary" size="small" />
                            </Box>
                          )}
                        </Box>
                        <IconButton onClick={(e) => handleMenuOpen(contact.id, e)}>
                          <MoreVertIcon />
                        </IconButton>
                        <Menu
                          anchorEl={menuAnchor[contact.id]}
                          open={Boolean(menuAnchor[contact.id])}
                          onClose={() => handleMenuClose(contact.id)}
                          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                        >
                          {canUpdate('contacts') && (
                            <MenuItem onClick={() => handleEditContact(contact)}>Edit Contact</MenuItem>
                          )}
                          {canDelete('contacts') && (
                            <MenuItem onClick={() => handleDeleteContact(contact)}>Delete Contact</MenuItem>
                          )}
                        </Menu>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                        <Button href={`mailto:${contact.email}`} startIcon={<EmailIcon />} size="small">Email</Button>
                        <Button href={`tel:${contact.phone}`} startIcon={<PhoneIcon />} size="small">Call</Button>
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        {contact.email} | {contact.phone}
                      </Typography>
                      {/* Contact Type Multi-Select */}
                      {canUpdate('contacts') ? (
                        <>
                          <FormControl sx={{ mt: 1, mb: 2, width: '100%' }} size="small">
                            <InputLabel>Contact Type</InputLabel>
                            <Select
                              multiple
                              value={types}
                              onChange={(e) => handleContactTypeChange(contact.id, typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value as string[])}
                              input={<OutlinedInput label="Contact Type" />}
                              renderValue={(selected) => (selected as string[]).join(', ')}
                            >
                              {CONTACT_TYPE_OPTIONS.map((type) => (
                                <MenuItem key={type} value={type}>
                                  <Checkbox checked={types.indexOf(type) > -1} />
                                  <MuiListItemText primary={type} />
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                          {/* If 'Other' is selected, show free text input */}
                          {types.includes('Other') && (
                            <TextField
                              size="small"
                              variant="outlined"
                              label="Other Type"
                              value={other}
                              onChange={(e) => handleOtherTypeChange(contact.id, e.target.value)}
                              sx={{ mb: 2, width: '100%' }}
                            />
                          )}
                        </>
                      ) : (
                        <Box sx={{ mt: 1, mb: 2 }}>
                          <Typography variant="body2" color="text.secondary">
                            <strong>Contact Types:</strong> {types.join(', ')}
                            {types.includes('Other') && other && ` (${other})`}
                          </Typography>
                        </Box>
                      )}
                      {/* Tasks for this contact */}
                      <Divider sx={{ my: 2 }} />
                      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>Tasks</Typography>
                      <List dense>
                        {account.tasks && account.tasks.filter((t: Task) => {
                          const assignedClients = Array.isArray(t.assignedToClient) ? t.assignedToClient : t.assignedToClient ? [t.assignedToClient] : [];
                          return assignedClients.includes(contact.id) || assignedClients.includes(`${contact.firstName} ${contact.lastName}`);
                        }).length > 0 ? (
                          account.tasks.filter((t: Task) => {
                            const assignedClients = Array.isArray(t.assignedToClient) ? t.assignedToClient : t.assignedToClient ? [t.assignedToClient] : [];
                            return assignedClients.includes(contact.id) || assignedClients.includes(`${contact.firstName} ${contact.lastName}`);
                          }).map((task: Task) => (
                            <ListItem key={task.id} disableGutters secondaryAction={null}>
                              <Checkbox
                                edge="start"
                                checked={task.status === 'Completed'}
                                tabIndex={-1}
                                disableRipple
                                onChange={() => handleToggleTask(task.id)}
                              />
                              <ListItemText
                                primary={task.title}
                                secondary={task.status}
                              />
                            </ListItem>
                          ))
                        ) : (
                          <ListItem>
                            <ListItemText primary="No tasks assigned." />
                          </ListItem>
                        )}
                      </List>
                      <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                        <TextField
                          size="small"
                          variant="outlined"
                          placeholder="Add new task..."
                          value={newTask[contact.id] || ''}
                          onChange={(e) => handleTaskInputChange(contact.id, e.target.value)}
                          sx={{ flexGrow: 1 }}
                        />
                        <Button
                          variant="contained"
                          size="small"
                          startIcon={<AddIcon />}
                          onClick={() => handleAddTask(contact.id)}
                          disabled={!newTask[contact.id]}
                        >
                          Add
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })
          ) : (
            <Grid item xs={12}>
              <Paper sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="body1" color="text.secondary">
                  No contacts found for this account.
                </Typography>
                {canCreate('contacts') && (
                  <Button variant="contained" startIcon={<AddIcon />} sx={{ mt: 2 }} onClick={handleAddContactOpen}>
                    Add Contact
                  </Button>
                )}
              </Paper>
            </Grid>
          )}
        </Grid>
      </Box>

      {/* Edit Account Modal */}
      <Dialog open={editOpen} onClose={handleEditClose} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Account</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField label="Name" value={editForm.name || ''} onChange={e => handleEditChange('name', e.target.value)} fullWidth size="small" />
          <TextField label="Email" value={editForm.email || ''} onChange={e => handleEditChange('email', e.target.value)} fullWidth size="small" />
          <TextField label="Phone" value={editForm.phone || ''} onChange={e => handleEditChange('phone', e.target.value)} fullWidth size="small" />
          <TextField label="Address" value={editForm.address || ''} onChange={e => handleEditChange('address', e.target.value)} fullWidth size="small" />
          <TextField label="Industry" value={editForm.industry || ''} onChange={e => handleEditChange('industry', e.target.value)} fullWidth size="small" />
          <TextField label="Website" value={editForm.website || ''} onChange={e => handleEditChange('website', e.target.value)} fullWidth size="small" />
          <TextField label="Description" value={editForm.description || ''} onChange={e => handleEditChange('description', e.target.value)} fullWidth size="small" multiline minRows={2} />
          <TextField label="Business Use Case" value={editForm.businessUseCase || ''} onChange={e => handleEditChange('businessUseCase', e.target.value)} fullWidth size="small" />
          <TextField label="Tech Stack" value={editForm.techStack || ''} onChange={e => handleEditChange('techStack', e.target.value)} fullWidth size="small" />
          <TextField label="Health" type="number" value={editForm.health || ''} onChange={e => handleEditChange('health', Number(e.target.value))} fullWidth size="small" />
          <TextField label="Revenue" type="number" value={editForm.revenue || ''} onChange={e => handleEditChange('revenue', Number(e.target.value))} fullWidth size="small" />
          <TextField label="License ARR" type="number" value={editForm.arr || ''} onChange={e => handleEditChange('arr', Number(e.target.value))} fullWidth size="small" />
          <TextField label="Renewal Date" type="date" value={editForm.renewalDate ? editForm.renewalDate.slice(0,10) : ''} onChange={e => handleEditChange('renewalDate', e.target.value)} fullWidth size="small" InputLabelProps={{ shrink: true }} />
          <TextField label="Risk Score" type="number" value={editForm.riskScore || ''} onChange={e => handleEditChange('riskScore', Number(e.target.value))} fullWidth size="small" />
          <TextField label="Last Touchpoint" type="datetime-local" value={editForm.lastTouchpoint ? editForm.lastTouchpoint.slice(0,16) : ''} onChange={e => handleEditChange('lastTouchpoint', e.target.value)} fullWidth size="small" InputLabelProps={{ shrink: true }} />
          <TextField label="Next Scheduled" type="datetime-local" value={editForm.nextScheduled ? editForm.nextScheduled.slice(0,16) : ''} onChange={e => handleEditChange('nextScheduled', e.target.value)} fullWidth size="small" InputLabelProps={{ shrink: true }} />
          <TextField label="Account Manager" value={editForm.accountManager || ''} onChange={e => handleEditChange('accountManager', e.target.value)} fullWidth size="small" />
          <TextField label="Customer Success Manager" value={editForm.customerSuccessManager || ''} onChange={e => handleEditChange('customerSuccessManager', e.target.value)} fullWidth size="small" />
          <TextField label="Sales Engineer" value={editForm.salesEngineer || ''} onChange={e => handleEditChange('salesEngineer', e.target.value)} fullWidth size="small" />
          <TextField label="Tier ID" value={editForm.tierId || ''} onChange={e => handleEditChange('tierId', e.target.value)} fullWidth size="small" />
          <FormControl fullWidth size="small">
            <InputLabel>Status</InputLabel>
            <Select value={editForm.status || ''} label="Status" onChange={e => handleEditChange('status', e.target.value)}>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="at-risk">At Risk</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
            </Select>
          </FormControl>
          <TextField label="Employees" type="number" value={editForm.employees || ''} onChange={e => handleEditChange('employees', Number(e.target.value))} fullWidth size="small" />
          <TextField label="Notes" value={editForm.accountNotes || ''} onChange={e => handleEditChange('accountNotes', e.target.value)} fullWidth size="small" multiline minRows={4} />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleEditClose}>Cancel</Button>
          <Button onClick={handleEditSave} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>

      {/* Add Contact Modal */}
      <Dialog open={addContactOpen} onClose={handleAddContactClose} maxWidth="sm" fullWidth>
        <DialogTitle>Add Contact</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="First Name"
            value={addContactForm.firstName || ''}
            onChange={(e) => handleAddContactChange('firstName', e.target.value)}
            fullWidth
            size="small"
          />
          <TextField
            label="Last Name"
            value={addContactForm.lastName || ''}
            onChange={(e) => handleAddContactChange('lastName', e.target.value)}
            fullWidth
            size="small"
          />
          <TextField
            label="Title"
            value={addContactForm.title || ''}
            onChange={(e) => handleAddContactChange('title', e.target.value)}
            fullWidth
            size="small"
          />
          <TextField
            label="Email"
            value={addContactForm.email || ''}
            onChange={(e) => handleAddContactChange('email', e.target.value)}
            fullWidth
            size="small"
          />
          <TextField
            label="Phone"
            value={addContactForm.phone || ''}
            onChange={(e) => handleAddContactChange('phone', e.target.value)}
            fullWidth
            size="small"
          />
          <FormControl fullWidth size="small">
            <InputLabel>Contact Type</InputLabel>
            <Select
              multiple
              value={addContactForm.contactTypes || []}
              onChange={(e) => handleAddContactChange('contactTypes', typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value as string[])}
              input={<OutlinedInput label="Contact Type" />}
              renderValue={(selected) => (selected as string[]).join(', ')}
            >
              {CONTACT_TYPE_OPTIONS.map((type) => (
                <MenuItem key={type} value={type}>
                  <Checkbox checked={(addContactForm.contactTypes || []).indexOf(type) > -1} />
                  <MuiListItemText primary={type} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          {(addContactForm.contactTypes || []).includes('Other') && (
            <TextField
              label="Other Type"
              value={addContactForm.otherType || ''}
              onChange={(e) => handleAddContactChange('otherType', e.target.value)}
              fullWidth
              size="small"
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleAddContactClose}>Cancel</Button>
          <Button onClick={handleAddContactSave} variant="contained">Add Contact</Button>
        </DialogActions>
      </Dialog>

      {/* Create Account Task Modal */}
      <Dialog open={showCreateTask} onClose={() => setShowCreateTask(false)}>
        <DialogTitle>Create Task</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField label="Title" value={newAccountTask.title} onChange={e => setNewAccountTask(t => ({ ...t, title: e.target.value }))} fullWidth size="small" />
          <TextField label="Due Date" type="datetime-local" value={newAccountTask.dueDate} onChange={e => setNewAccountTask(t => ({ ...t, dueDate: e.target.value }))} fullWidth size="small" InputLabelProps={{ shrink: true }} />
          <FormControl fullWidth size="small">
            <InputLabel>Priority</InputLabel>
            <Select value={newAccountTask.priority} label="Priority" onChange={e => setNewAccountTask(t => ({ ...t, priority: e.target.value as 'Low' | 'Medium' | 'High' }))}>
              <MenuItem value="Low">Low</MenuItem>
              <MenuItem value="Medium">Medium</MenuItem>
              <MenuItem value="High">High</MenuItem>
            </Select>
          </FormControl>
          <UserAutocomplete
            label="Assigned To (Internal)"
            value={newAccountTask.assignedTo}
            onChange={(value) => setNewAccountTask(t => ({ ...t, assignedTo: value }))}
            context="internal"
          />
          <UserAutocomplete
            label="Assigned To Client"
            value={newAccountTask.assignedToClient}
            onChange={(value) => setNewAccountTask(t => ({ ...t, assignedToClient: value }))}
            context="external"
            accountId={account?.id}
            accountContacts={account?.contacts}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCreateTask(false)}>Cancel</Button>
          <Button onClick={handleCreateAccountTask} variant="contained" disabled={!newAccountTask.title || !newAccountTask.dueDate}>Create</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Task Modal */}
      <Dialog open={showEditTask} onClose={() => setShowEditTask(false)} maxWidth="md" fullWidth>
        <DialogTitle>Edit Task</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField 
            label="Title" 
            value={editTaskForm.title || ''} 
            onChange={e => setEditTaskForm(prev => ({ ...prev, title: e.target.value }))} 
            fullWidth 
            size="small" 
          />
          <TextField 
            label="Description" 
            value={editTaskForm.description || ''} 
            onChange={e => setEditTaskForm(prev => ({ ...prev, description: e.target.value }))} 
            fullWidth 
            size="small" 
            multiline 
            minRows={3}
          />
          <FormControl fullWidth size="small">
            <InputLabel>Status</InputLabel>
            <Select 
              value={editTaskForm.status || ''} 
              label="Status" 
              onChange={e => setEditTaskForm(prev => ({ ...prev, status: e.target.value as 'To Do' | 'In Progress' | 'Completed' }))}
            >
              <MenuItem value="To Do">To Do</MenuItem>
              <MenuItem value="In Progress">In Progress</MenuItem>
              <MenuItem value="Completed">Completed</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth size="small">
            <InputLabel>Priority</InputLabel>
            <Select 
              value={editTaskForm.priority || ''} 
              label="Priority" 
              onChange={e => setEditTaskForm(prev => ({ ...prev, priority: e.target.value as 'Low' | 'Medium' | 'High' }))}
            >
              <MenuItem value="Low">Low</MenuItem>
              <MenuItem value="Medium">Medium</MenuItem>
              <MenuItem value="High">High</MenuItem>
            </Select>
          </FormControl>
          <TextField 
            label="Due Date" 
            type="datetime-local" 
            value={editTaskForm.dueDate ? editTaskForm.dueDate.slice(0,16) : ''} 
            onChange={e => setEditTaskForm(prev => ({ ...prev, dueDate: e.target.value }))} 
            fullWidth 
            size="small" 
            InputLabelProps={{ shrink: true }} 
          />
          <TextField 
            label="Progress (%)" 
            type="number" 
            value={editTaskForm.progress || 0} 
            onChange={e => setEditTaskForm(prev => ({ ...prev, progress: parseInt(e.target.value) || 0 }))} 
            fullWidth 
            size="small" 
            inputProps={{ min: 0, max: 100 }}
          />
          <TextField 
            label="Account" 
            value={editTaskForm.accountName || account?.name || ''} 
            fullWidth 
            size="small" 
            disabled
            helperText="Task is assigned to this account"
          />
          <UserAutocomplete
            label="Assigned To (Internal)"
            value={Array.isArray(editTaskForm.assignedTo) ? editTaskForm.assignedTo : editTaskForm.assignedTo ? [editTaskForm.assignedTo] : []}
            onChange={(value) => setEditTaskForm(prev => ({ ...prev, assignedTo: value }))}
            context="internal"
          />
          <UserAutocomplete
            label="Assigned To Client"
            value={Array.isArray(editTaskForm.assignedToClient) ? editTaskForm.assignedToClient : editTaskForm.assignedToClient ? [editTaskForm.assignedToClient] : []}
            onChange={(value) => setEditTaskForm(prev => ({ ...prev, assignedToClient: value }))}
            context="external"
            accountId={account?.id}
            accountContacts={account?.contacts}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowEditTask(false)}>Cancel</Button>
          <Button onClick={handleDeleteTask} color="error">Delete</Button>
          <Button onClick={handleEditTaskSave} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AccountDetailPage; 