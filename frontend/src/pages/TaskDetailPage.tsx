import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Chip,
  Button,
  CircularProgress,
  Alert,
  Divider,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Paper,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  LinearProgress
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Assignment as TaskIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  Flag as FlagIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { apiService } from '../services/api';
import { Task, Account, User } from '../types';
import { EntityFiles } from '../components/EntityFiles';

const TaskDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [task, setTask] = useState<Task | null>(null);
  const [account, setAccount] = useState<Account | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    status: 'To Do' as 'To Do' | 'In Progress' | 'Completed',
    priority: 'Medium' as 'Low' | 'Medium' | 'High',
    dueDate: new Date(),
    assignedTo: [] as string[],
    progress: 0
  });

  useEffect(() => {
    const fetchTaskData = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // Fetch task details
        const taskData = await apiService.getTask(id);
        setTask(taskData);
        
        // Set edit form with current values
        setEditForm({
          title: taskData.title,
          description: taskData.description || '',
          status: taskData.status,
          priority: taskData.priority,
          dueDate: new Date(taskData.dueDate),
          assignedTo: taskData.assignedTo || [],
          progress: taskData.progress || 0
        });
        
        // Fetch account if available
        if (taskData.accountId) {
          try {
            const accountData = await apiService.getAccount(taskData.accountId);
            setAccount(accountData);
          } catch (err) {
            console.warn('Could not fetch account:', err);
          }
        }
        
        // Fetch users for assignment
        try {
          const usersData = await apiService.getAllUsers();
          setUsers(usersData);
        } catch (err) {
          console.warn('Could not fetch users:', err);
        }
        
      } catch (err) {
        console.error('Error fetching task:', err);
        setError('Failed to load task details');
      } finally {
        setLoading(false);
      }
    };

    fetchTaskData();
  }, [id]);

  const handleSaveTask = async () => {
    if (!task) return;
    
    try {
      const updatedTask = await apiService.updateTask(task.id, editForm);
      setTask(updatedTask);
      setEditDialogOpen(false);
    } catch (err) {
      console.error('Error updating task:', err);
      setError('Failed to update task');
    }
  };

  const handleDeleteTask = async () => {
    if (!task) return;
    
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await apiService.deleteTask(task.id);
        navigate('/tasks');
      } catch (err) {
        console.error('Error deleting task:', err);
        setError('Failed to delete task');
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'success';
      case 'In Progress': return 'warning';
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Completed': return <CheckCircleIcon />;
      case 'In Progress': return <ScheduleIcon />;
      default: return <InfoIcon />;
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !task) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error || 'Task not found'}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/tasks')}
          sx={{ mr: 2 }}
        >
          Back to Tasks
        </Button>
        <Typography variant="h4" sx={{ flexGrow: 1, fontWeight: 700 }}>
          {task.title}
        </Typography>
        <Button
          startIcon={<EditIcon />}
          onClick={() => setEditDialogOpen(true)}
          variant="outlined"
          sx={{ mr: 1 }}
        >
          Edit
        </Button>
        <Button
          startIcon={<DeleteIcon />}
          onClick={handleDeleteTask}
          variant="outlined"
          color="error"
        >
          Delete
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* Main Task Information */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Task Details
              </Typography>
              
              <Box sx={{ mb: 3 }}>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {task.description || 'No description provided'}
                </Typography>
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <TaskIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      Status
                    </Typography>
                  </Box>
                  <Chip
                    icon={getStatusIcon(task.status)}
                    label={task.status}
                    color={getStatusColor(task.status) as any}
                    sx={{ fontWeight: 500 }}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <FlagIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      Priority
                    </Typography>
                  </Box>
                  <Chip
                    label={task.priority}
                    color={getPriorityColor(task.priority) as any}
                    sx={{ fontWeight: 500 }}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <ScheduleIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      Due Date
                    </Typography>
                  </Box>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'Not set'}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <PersonIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      Assigned To
                    </Typography>
                  </Box>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {task.assignedTo || 'Unassigned'}
                  </Typography>
                </Grid>
              </Grid>

              {/* Progress */}
              {task.progress !== undefined && (
                <Box sx={{ mt: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Progress
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {task.progress}%
                    </Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={task.progress} 
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} md={4}>
          {/* Account Information */}
          {account && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                  Related Account
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <BusinessIcon sx={{ mr: 1, color: 'text.secondary' }} />
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {account.name}
                  </Typography>
                </Box>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => navigate(`/accounts/${account.id}`)}
                  fullWidth
                >
                  View Account
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Files */}
          {id && (
            <Box sx={{ mb: 3 }}>
              <EntityFiles entityType="task" entityId={id} title="Files" />
            </Box>
          )}

          {/* Task Metadata */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Task Information
              </Typography>
              
              <List dense>
                <ListItem sx={{ px: 0 }}>
                  <ListItemText
                    primary="Created"
                    secondary={task.createdAt ? new Date(task.createdAt).toLocaleDateString() : 'Unknown'}
                  />
                </ListItem>
                <ListItem sx={{ px: 0 }}>
                  <ListItemText
                    primary="Last Updated"
                    secondary={task.updatedAt ? new Date(task.updatedAt).toLocaleDateString() : 'Unknown'}
                  />
                </ListItem>
                {task.categoryId && (
                  <ListItem sx={{ px: 0 }}>
                    <ListItemText
                      primary="Category"
                      secondary={task.categoryId}
                    />
                  </ListItem>
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Edit Dialog */}
      <Dialog 
        open={editDialogOpen} 
        onClose={() => setEditDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Edit Task</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Title"
                value={editForm.title}
                onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={3}
                value={editForm.description}
                onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={editForm.status}
                  onChange={(e) => setEditForm(prev => ({ ...prev, status: e.target.value as any }))}
                  label="Status"
                >
                  <MenuItem value="To Do">To Do</MenuItem>
                  <MenuItem value="In Progress">In Progress</MenuItem>
                  <MenuItem value="Completed">Completed</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Priority</InputLabel>
                <Select
                  value={editForm.priority}
                  onChange={(e) => setEditForm(prev => ({ ...prev, priority: e.target.value as any }))}
                  label="Priority"
                >
                  <MenuItem value="Low">Low</MenuItem>
                  <MenuItem value="Medium">Medium</MenuItem>
                  <MenuItem value="High">High</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Due Date"
                type="date"
                value={editForm.dueDate.toISOString().split('T')[0]}
                onChange={(e) => setEditForm(prev => ({ ...prev, dueDate: new Date(e.target.value) }))}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Progress (%)"
                type="number"
                value={editForm.progress}
                onChange={(e) => setEditForm(prev => ({ ...prev, progress: parseInt(e.target.value) || 0 }))}
                inputProps={{ min: 0, max: 100 }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveTask} variant="contained">Save Changes</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TaskDetailPage; 