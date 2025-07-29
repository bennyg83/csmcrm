import React, { useState, useEffect, useMemo } from 'react';
import { 
  Typography, 
  Box, 
  Button, 
  Card,
  CircularProgress, 
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip
} from '@mui/material';
import { 
  Add as AddIcon,
  CalendarToday as CalendarIcon
} from '@mui/icons-material';
import { Calendar, dateFnsLocalizer, Views } from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { apiService } from '../services/api';
import { Task, Account, User, Category } from '../types';
import UserAutocomplete from '../components/UserAutocomplete';
import { usePermissions } from '../utils/rbac';

const locales = {
  'en-US': enUS,
};
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
});

const CalendarPage: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Form state for task creation/editing
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    status: 'To Do' as 'To Do' | 'In Progress' | 'Completed',
    priority: 'Medium' as 'Low' | 'Medium' | 'High',
    dueDate: new Date(),
    assignedTo: [] as string[],
    assignedToClient: [] as string[],
    accountId: '',
    categoryId: '',
    tags: [] as string[],
    progress: 0
  });

  const { canCreate } = usePermissions();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const [tasksData, accountsData, usersData, categoriesData] = await Promise.all([
          apiService.getTasks(),
          apiService.getAccounts(),
          apiService.getAllUsers(),
          apiService.getCategories()
        ]);
        setTasks(tasksData);
        setAccounts(accountsData);
        setUsers(usersData);
        setCategories(categoriesData);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Map tasks to calendar events
  const calendarEvents = useMemo(() =>
    tasks.map(task => ({
      id: task.id,
      title: task.title,
      start: new Date(task.dueDate),
      end: new Date(task.dueDate),
      allDay: true,
      resource: task,
    })),
    [tasks]
  );

  // Handler for clicking a date slot in the calendar
  const handleCalendarSelectSlot = (slotInfo: any) => {
    setTaskForm({
      ...taskForm,
      dueDate: slotInfo.start,
      title: '',
      description: '',
      status: 'To Do',
      priority: 'Medium',
      assignedTo: [],
      assignedToClient: [],
      accountId: '',
      categoryId: '',
      tags: [],
      progress: 0
    });
    setEditingTask(null);
    setTaskDialogOpen(true);
  };

  // Handler for clicking an event
  const handleCalendarSelectEvent = (event: any) => {
    const task = tasks.find(t => t.id === event.id);
    if (task) {
      setEditingTask(task);
      setTaskForm({
        title: task.title,
        description: task.description,
        status: task.status as any,
        priority: task.priority as any,
        dueDate: new Date(task.dueDate),
        assignedTo: Array.isArray(task.assignedTo) ? task.assignedTo : [task.assignedTo],
        assignedToClient: Array.isArray(task.assignedToClient) ? task.assignedToClient : [task.assignedToClient],
        accountId: task.accountId || '',
        categoryId: task.categoryId || '',
        tags: task.tags || [],
        progress: task.progress || 0
      });
      setTaskDialogOpen(true);
    }
  };

  const handleSaveTask = async () => {
    try {
      if (editingTask) {
        const updatedTask = await apiService.updateTask(editingTask.id, taskForm);
        setTasks(prev => prev.map(task => task.id === editingTask.id ? updatedTask : task));
      } else {
        const newTask = await apiService.createTask(taskForm);
        setTasks(prev => [newTask, ...prev]);
      }
      setTaskDialogOpen(false);
      setEditingTask(null);
    } catch (err) {
      console.error('Error saving task:', err);
      alert('Failed to save task');
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          Calendar
        </Typography>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
              Calendar
            </Typography>
            <Typography variant="body1" color="text.secondary">
              View and manage your tasks in calendar format
            </Typography>
          </Box>
                      {canCreate('tasks') && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                setTaskForm({
                  title: '',
                  description: '',
                  status: 'To Do',
                  priority: 'Medium',
                  dueDate: new Date(),
                  assignedTo: [],
                  assignedToClient: [],
                  accountId: '',
                  categoryId: '',
                  tags: [],
                  progress: 0
                });
                setEditingTask(null);
                setTaskDialogOpen(true);
              }}
              sx={{ 
                px: 3, 
                py: 1.5,
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600
              }}
            >
              Add Task
            </Button>
          )}
        </Box>

        {/* Calendar */}
        <Card sx={{ p: 2 }}>
          <Calendar
            localizer={localizer}
            events={calendarEvents}
            startAccessor="start"
            endAccessor="end"
            style={{ height: 700 }}
            selectable
            onSelectSlot={handleCalendarSelectSlot}
            onSelectEvent={handleCalendarSelectEvent}
            views={[Views.MONTH, Views.WEEK, Views.DAY]}
            popup
            defaultView={Views.MONTH}
          />
        </Card>

        {/* Task Dialog */}
        <Dialog 
          open={taskDialogOpen} 
          onClose={() => setTaskDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            {editingTask ? 'Edit Task' : 'Create New Task'}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <TextField
                label="Title"
                value={taskForm.title}
                onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                fullWidth
                required
              />
              <TextField
                label="Description"
                value={taskForm.description}
                onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                fullWidth
                multiline
                rows={3}
              />
              <Box sx={{ display: 'flex', gap: 2 }}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={taskForm.status}
                    onChange={(e) => setTaskForm({ ...taskForm, status: e.target.value as any })}
                    label="Status"
                  >
                    <MenuItem value="To Do">To Do</MenuItem>
                    <MenuItem value="In Progress">In Progress</MenuItem>
                    <MenuItem value="Completed">Completed</MenuItem>
                  </Select>
                </FormControl>
                <FormControl fullWidth>
                  <InputLabel>Priority</InputLabel>
                  <Select
                    value={taskForm.priority}
                    onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value as any })}
                    label="Priority"
                  >
                    <MenuItem value="Low">Low</MenuItem>
                    <MenuItem value="Medium">Medium</MenuItem>
                    <MenuItem value="High">High</MenuItem>
                  </Select>
                </FormControl>
              </Box>
              <DateTimePicker
                label="Due Date"
                value={taskForm.dueDate}
                onChange={(newValue) => setTaskForm({ ...taskForm, dueDate: newValue || new Date() })}
                slotProps={{ textField: { fullWidth: true } }}
              />
              <FormControl fullWidth>
                <InputLabel>Account</InputLabel>
                <Select
                  value={taskForm.accountId}
                  onChange={(e) => setTaskForm({ ...taskForm, accountId: e.target.value })}
                  label="Account"
                >
                  <MenuItem value=""><em>None</em></MenuItem>
                  {accounts.map(account => (
                    <MenuItem key={account.id} value={account.id}>{account.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <UserAutocomplete
                label="Assigned To"
                value={taskForm.assignedTo}
                onChange={(value) => setTaskForm({ ...taskForm, assignedTo: value })}
                users={users}
                multiple
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setTaskDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveTask} variant="contained">
              {editingTask ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

export default CalendarPage; 