import React, { useState, useEffect, useMemo } from 'react';
import { 
  Typography, 
  Box, 
  Button, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper, 
  Chip, 
  CircularProgress, 
  Alert,
  LinearProgress,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
  Grid,
  Card,
  CardContent,
  Divider,
  Badge,
  Tabs,
  Tab,
  Fab,
  Drawer,
  List,
  ListItem,
  ListItemText,
  Checkbox,
  FormGroup,
  FormControlLabel,
  Slider,
  Switch,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import { 
  Add as AddIcon, 
  FilterList as FilterIcon,
  Sort as SortIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  ExpandMore as ExpandMoreIcon,
  CalendarToday as CalendarIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  Flag as FlagIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Category as CategoryIcon
} from '@mui/icons-material';
import { apiService } from '../services/api';
import { Task, Account, User, Contact, Category } from '../types';
import UserAutocomplete from '../components/UserAutocomplete';
import CategoryManager from '../components/CategoryManager';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

interface SortConfig {
  key: keyof Task;
  direction: 'asc' | 'desc';
}

interface FilterConfig {
  search: string;
  status: string[];
  priority: string[];
  assignedTo: string[];
  accountId: string[];
  categoryId: string[];
  tags: string[];
  dueDateRange: [Date | null, Date | null];
  dueIn: {
    value: number;
    unit: 'days' | 'weeks' | 'months';
  } | null;
  progressRange: [number, number];
  showOverdue: boolean;
  showCompleted: boolean;
}

const TasksPage: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'dueDate', direction: 'asc' });
  const [filterConfig, setFilterConfig] = useState<FilterConfig>({
    search: '',
    status: [],
    priority: [],
    assignedTo: [],
    accountId: [],
    categoryId: [],
    tags: [],
    dueDateRange: [null, null],
    dueIn: null,
    progressRange: [0, 100],
    showOverdue: false,
    showCompleted: true
  });
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [categoryManagerOpen, setCategoryManagerOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'kanban' | 'calendar'>('list');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

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

  // Filtered and sorted tasks
  const filteredTasks = useMemo(() => {
    let filtered = tasks.filter(task => {
      // Search filter
      if (filterConfig.search) {
        const searchLower = filterConfig.search.toLowerCase();
        if (!task.title.toLowerCase().includes(searchLower) &&
            !task.description.toLowerCase().includes(searchLower) &&
            !task.accountName.toLowerCase().includes(searchLower)) {
          return false;
        }
      }

      // Status filter
      if (filterConfig.status.length > 0 && !filterConfig.status.includes(task.status)) {
        return false;
      }

      // Priority filter
      if (filterConfig.priority.length > 0 && !filterConfig.priority.includes(task.priority)) {
        return false;
      }

      // Assigned to filter
      if (filterConfig.assignedTo.length > 0) {
        const assignedToArray = Array.isArray(task.assignedTo) ? task.assignedTo : [task.assignedTo];
        if (!filterConfig.assignedTo.some(id => assignedToArray.includes(id))) {
          return false;
        }
      }

      // Account filter
      if (filterConfig.accountId.length > 0 && !filterConfig.accountId.includes(task.accountId)) {
        return false;
      }

      // Category filter
      if (filterConfig.categoryId.length > 0 && !filterConfig.categoryId.includes(task.categoryId || '')) {
        return false;
      }

      // Tags filter
      if (filterConfig.tags.length > 0) {
        const taskTags = task.tags || [];
        if (!filterConfig.tags.some(tag => taskTags.includes(tag))) {
          return false;
        }
      }

      // Progress range filter
      if (task.progress < filterConfig.progressRange[0] || task.progress > filterConfig.progressRange[1]) {
        return false;
      }

      // Overdue filter
      if (filterConfig.showOverdue) {
        const isOverdue = new Date(task.dueDate) < new Date() && task.status !== 'Completed';
        if (!isOverdue) return false;
      }

      // Completed filter
      if (!filterConfig.showCompleted && task.status === 'Completed') {
        return false;
      }

      // Due date range filter
      if (filterConfig.dueDateRange[0] || filterConfig.dueDateRange[1]) {
        const taskDate = new Date(task.dueDate);
        if (filterConfig.dueDateRange[0] && taskDate < filterConfig.dueDateRange[0]) {
          return false;
        }
        if (filterConfig.dueDateRange[1] && taskDate > filterConfig.dueDateRange[1]) {
          return false;
        }
      }

      // Due in filter
      if (filterConfig.dueIn) {
        const now = new Date();
        const taskDate = new Date(task.dueDate);
        const diffTime = taskDate.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        let targetDays: number;
        switch (filterConfig.dueIn.unit) {
          case 'days':
            targetDays = filterConfig.dueIn.value;
            break;
          case 'weeks':
            targetDays = filterConfig.dueIn.value * 7;
            break;
          case 'months':
            targetDays = filterConfig.dueIn.value * 30; // Approximate
            break;
          default:
            targetDays = filterConfig.dueIn.value;
        }
        
        // Filter tasks that are due within the specified time range
        if (diffDays < 0 || diffDays > targetDays) {
          return false;
        }
      }

      return true;
    });

    // Sort
    filtered.sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const comparison = aValue.localeCompare(bValue);
        return sortConfig.direction === 'asc' ? comparison : -comparison;
      }
      
      if (aValue instanceof Date && bValue instanceof Date) {
        const comparison = aValue.getTime() - bValue.getTime();
        return sortConfig.direction === 'asc' ? comparison : -comparison;
      }
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        const comparison = aValue - bValue;
        return sortConfig.direction === 'asc' ? comparison : -comparison;
      }
      
      return 0;
    });

    return filtered;
  }, [tasks, sortConfig, filterConfig]);

  const handleSort = (key: keyof Task) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleFilterChange = (key: keyof FilterConfig, value: any) => {
    setFilterConfig(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilterConfig({
      search: '',
      status: [],
      priority: [],
      assignedTo: [],
      accountId: [],
      categoryId: [],
      tags: [],
      dueDateRange: [null, null],
      dueIn: null,
      progressRange: [0, 100],
      showOverdue: false,
      showCompleted: true
    });
  };

  const openTaskDialog = (task?: Task) => {
    if (task) {
      setEditingTask(task);
      setTaskForm({
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        dueDate: new Date(task.dueDate),
        assignedTo: Array.isArray(task.assignedTo) ? task.assignedTo : [task.assignedTo],
        assignedToClient: Array.isArray(task.assignedToClient) ? task.assignedToClient : [],
        accountId: task.accountId,
        categoryId: task.categoryId || '',
        tags: task.tags || [],
        progress: task.progress
      });
    } else {
      setEditingTask(null);
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
    }
    setTaskDialogOpen(true);
  };

  const handleSaveTask = async () => {
    try {
      const taskData = {
        ...taskForm,
        dueDate: taskForm.dueDate.toISOString()
      };

      if (editingTask) {
        await apiService.updateTask(editingTask.id, taskData);
      } else {
        await apiService.createTask(taskData);
      }

      // Refresh tasks
      const updatedTasks = await apiService.getTasks();
      setTasks(updatedTasks);
      setTaskDialogOpen(false);
    } catch (error) {
      console.error('Error saving task:', error);
      setError('Failed to save task');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await apiService.deleteTask(taskId);
        const updatedTasks = await apiService.getTasks();
        setTasks(updatedTasks);
      } catch (error) {
        console.error('Error deleting task:', error);
        setError('Failed to delete task');
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'success';
      case 'In Progress':
        return 'warning';
      case 'To Do':
        return 'default';
      default:
        return 'default';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High':
        return 'error';
      case 'Medium':
        return 'warning';
      case 'Low':
        return 'success';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date();
  };

  const getAssignedToDisplay = (task: Task) => {
    if (Array.isArray(task.assignedTo)) {
      return task.assignedTo.join(', ');
    }
    return task.assignedTo;
  };

  const getCategoryDisplay = (task: Task) => {
    if (task.categoryId) {
      const category = categories.find(c => c.id === task.categoryId);
      return category ? (
        <Chip
          label={category.name}
          size="small"
          sx={{
            backgroundColor: category.color,
            color: 'white',
            '& .MuiChip-label': { color: 'white' }
          }}
        />
      ) : null;
    }
    return null;
  };

  const getTagsDisplay = (task: Task) => {
    if (task.tags && task.tags.length > 0) {
      return task.tags.map((tag, index) => (
        <Chip
          key={index}
          label={tag}
          size="small"
          variant="outlined"
          sx={{ mr: 0.5, mb: 0.5 }}
        />
      ));
    }
    return null;
  };

  const SortableHeader: React.FC<{ 
    field: keyof Task; 
    children: React.ReactNode; 
    width?: string;
  }> = ({ field, children, width }) => (
    <TableCell 
      sx={{ 
        cursor: 'pointer', 
        userSelect: 'none',
        width,
        '&:hover': { backgroundColor: 'action.hover' }
      }}
      onClick={() => handleSort(field)}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        {children}
        <SortIcon 
          sx={{ 
            fontSize: 16,
            opacity: sortConfig.key === field ? 1 : 0.3,
            transform: sortConfig.key === field && sortConfig.direction === 'desc' ? 'rotate(180deg)' : 'none'
          }} 
        />
      </Box>
    </TableCell>
  );

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
          Tasks
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
          <Typography variant="h4">
            Tasks ({filteredTasks.length})
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<CategoryIcon />}
              onClick={() => setCategoryManagerOpen(true)}
            >
              Categories
            </Button>
            <Button
              variant="outlined"
              startIcon={<FilterIcon />}
              onClick={() => setFilterDrawerOpen(true)}
            >
              Filters
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => openTaskDialog()}
            >
              Add Task
            </Button>
          </Box>
        </Box>

        {/* Search and Quick Filters */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  placeholder="Search tasks..."
                  value={filterConfig.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  InputProps={{
                    startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                  }}
                />
              </Grid>
              <Grid item xs={12} md={8}>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {filterConfig.status.length > 0 && (
                    <Chip 
                      label={`Status: ${filterConfig.status.join(', ')}`} 
                      onDelete={() => handleFilterChange('status', [])}
                      size="small"
                    />
                  )}
                  {filterConfig.priority.length > 0 && (
                    <Chip 
                      label={`Priority: ${filterConfig.priority.join(', ')}`} 
                      onDelete={() => handleFilterChange('priority', [])}
                      size="small"
                    />
                  )}
                  {filterConfig.categoryId.length > 0 && (
                    <Chip 
                      label={`Category: ${categories.find(c => c.id === filterConfig.categoryId[0])?.name}`} 
                      onDelete={() => handleFilterChange('categoryId', [])}
                      size="small"
                    />
                  )}
                  {filterConfig.showOverdue && (
                    <Chip 
                      label="Overdue Only" 
                      onDelete={() => handleFilterChange('showOverdue', false)}
                      size="small"
                      color="error"
                    />
                  )}
                  {(filterConfig.search || filterConfig.status.length > 0 || filterConfig.priority.length > 0 || filterConfig.categoryId.length > 0 || filterConfig.showOverdue) && (
                    <Button
                      size="small"
                      startIcon={<ClearIcon />}
                      onClick={clearFilters}
                    >
                      Clear All
                    </Button>
                  )}
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Tasks Table */}
        {filteredTasks.length === 0 ? (
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No tasks found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {filterConfig.search || filterConfig.status.length > 0 || filterConfig.priority.length > 0 
                  ? 'Try adjusting your filters' 
                  : 'Create your first task to get started'}
              </Typography>
            </CardContent>
          </Card>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <SortableHeader field="title" width="20%">Title</SortableHeader>
                  <SortableHeader field="accountName" width="12%">Account</SortableHeader>
                  <SortableHeader field="status" width="8%">Status</SortableHeader>
                  <SortableHeader field="priority" width="8%">Priority</SortableHeader>
                  <TableCell width="8%">Category</TableCell>
                  <SortableHeader field="progress" width="8%">Progress</SortableHeader>
                  <SortableHeader field="dueDate" width="10%">Due Date</SortableHeader>
                  <SortableHeader field="assignedTo" width="12%">Assigned To</SortableHeader>
                  <TableCell width="4%">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredTasks.map((task) => (
                  <TableRow 
                    key={task.id} 
                    hover
                  >
                    <TableCell>
                      <Box>
                        <Typography 
                          variant="subtitle2" 
                          sx={{ 
                            cursor: 'pointer',
                            '&:hover': { textDecoration: 'underline' }
                          }}
                          onClick={() => setSelectedTask(task)}
                        >
                          {task.title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {task.description.substring(0, 50)}...
                        </Typography>
                        {getTagsDisplay(task)}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{task.accountName}</Typography>
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
                      {getCategoryDisplay(task)}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LinearProgress 
                          variant="determinate" 
                          value={task.progress} 
                          sx={{ width: 60, height: 8 }}
                        />
                        <Typography variant="caption">{task.progress}%</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Typography 
                          variant="body2"
                          sx={{ 
                            color: isOverdue(task.dueDate) && task.status !== 'Completed' 
                              ? 'error.main' 
                              : 'inherit'
                          }}
                        >
                          {formatDate(task.dueDate)}
                        </Typography>
                        {isOverdue(task.dueDate) && task.status !== 'Completed' && (
                          <FlagIcon sx={{ fontSize: 16, color: 'error.main' }} />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{getAssignedToDisplay(task)}</Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <Tooltip title="View Details">
                          <IconButton 
                            size="small" 
                            onClick={() => setSelectedTask(task)}
                          >
                            <ViewIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit Task">
                          <IconButton 
                            size="small" 
                            onClick={() => openTaskDialog(task)}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete Task">
                          <IconButton 
                            size="small" 
                            onClick={() => handleDeleteTask(task.id)}
                            color="error"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Filter Drawer */}
        <Drawer
          anchor="right"
          open={filterDrawerOpen}
          onClose={() => setFilterDrawerOpen(false)}
          PaperProps={{ sx: { width: 350 } }}
        >
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Filters
            </Typography>
            
            <Accordion defaultExpanded>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography>Status</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <FormGroup>
                  {['To Do', 'In Progress', 'Completed'].map((status) => (
                    <FormControlLabel
                      key={status}
                      control={
                        <Checkbox
                          checked={filterConfig.status.includes(status)}
                          onChange={(e) => {
                            const newStatus = e.target.checked
                              ? [...filterConfig.status, status]
                              : filterConfig.status.filter(s => s !== status);
                            handleFilterChange('status', newStatus);
                          }}
                        />
                      }
                      label={status}
                    />
                  ))}
                </FormGroup>
              </AccordionDetails>
            </Accordion>

            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography>Priority</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <FormGroup>
                  {['Low', 'Medium', 'High'].map((priority) => (
                    <FormControlLabel
                      key={priority}
                      control={
                        <Checkbox
                          checked={filterConfig.priority.includes(priority)}
                          onChange={(e) => {
                            const newPriority = e.target.checked
                              ? [...filterConfig.priority, priority]
                              : filterConfig.priority.filter(p => p !== priority);
                            handleFilterChange('priority', newPriority);
                          }}
                        />
                      }
                      label={priority}
                    />
                  ))}
                </FormGroup>
              </AccordionDetails>
            </Accordion>

            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography>Category</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <FormGroup>
                  {categories.map((category) => (
                    <FormControlLabel
                      key={category.id}
                      control={
                        <Checkbox
                          checked={filterConfig.categoryId.includes(category.id)}
                          onChange={(e) => {
                            const newCategoryId = e.target.checked
                              ? [...filterConfig.categoryId, category.id]
                              : filterConfig.categoryId.filter(id => id !== category.id);
                            handleFilterChange('categoryId', newCategoryId);
                          }}
                        />
                      }
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box
                            sx={{
                              width: 12,
                              height: 12,
                              borderRadius: '50%',
                              backgroundColor: category.color
                            }}
                          />
                          {category.name}
                        </Box>
                      }
                    />
                  ))}
                </FormGroup>
              </AccordionDetails>
            </Accordion>

            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography>Account</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <FormGroup>
                  {accounts.map((account) => (
                    <FormControlLabel
                      key={account.id}
                      control={
                        <Checkbox
                          checked={filterConfig.accountId.includes(account.id)}
                          onChange={(e) => {
                            const newAccountId = e.target.checked
                              ? [...filterConfig.accountId, account.id]
                              : filterConfig.accountId.filter(id => id !== account.id);
                            handleFilterChange('accountId', newAccountId);
                          }}
                        />
                      }
                      label={account.name}
                    />
                  ))}
                </FormGroup>
              </AccordionDetails>
            </Accordion>

            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography>Progress Range</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Box sx={{ px: 2 }}>
                  <Slider
                    value={filterConfig.progressRange}
                    onChange={(_, value) => handleFilterChange('progressRange', value)}
                    valueLabelDisplay="auto"
                    min={0}
                    max={100}
                  />
                  <Typography variant="body2" color="text.secondary">
                    {filterConfig.progressRange[0]}% - {filterConfig.progressRange[1]}%
                  </Typography>
                </Box>
              </AccordionDetails>
            </Accordion>

            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography>Due In</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <TextField
                    type="number"
                    label="Value"
                    value={filterConfig.dueIn?.value || ''}
                    onChange={(e) => {
                      const value = parseInt(e.target.value);
                      if (!isNaN(value) && value > 0) {
                        handleFilterChange('dueIn', {
                          value,
                          unit: filterConfig.dueIn?.unit || 'days'
                        });
                      } else {
                        handleFilterChange('dueIn', null);
                      }
                    }}
                    sx={{ width: 80 }}
                    size="small"
                  />
                  <FormControl size="small" sx={{ minWidth: 100 }}>
                    <InputLabel>Unit</InputLabel>
                    <Select
                      value={filterConfig.dueIn?.unit || 'days'}
                      onChange={(e) => {
                        if (filterConfig.dueIn) {
                          handleFilterChange('dueIn', {
                            ...filterConfig.dueIn,
                            unit: e.target.value as 'days' | 'weeks' | 'months'
                          });
                        }
                      }}
                      label="Unit"
                    >
                      <MenuItem value="days">Days</MenuItem>
                      <MenuItem value="weeks">Weeks</MenuItem>
                      <MenuItem value="months">Months</MenuItem>
                    </Select>
                  </FormControl>
                  {filterConfig.dueIn && (
                    <IconButton
                      size="small"
                      onClick={() => handleFilterChange('dueIn', null)}
                      sx={{ ml: 1 }}
                    >
                      <ClearIcon />
                    </IconButton>
                  )}
                </Box>
                {filterConfig.dueIn && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Show tasks due within {filterConfig.dueIn.value} {filterConfig.dueIn.unit}
                  </Typography>
                )}
              </AccordionDetails>
            </Accordion>

            <Box sx={{ mt: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={filterConfig.showOverdue}
                    onChange={(e) => handleFilterChange('showOverdue', e.target.checked)}
                  />
                }
                label="Show Overdue Only"
              />
            </Box>

            <Box sx={{ mt: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={filterConfig.showCompleted}
                    onChange={(e) => handleFilterChange('showCompleted', e.target.checked)}
                  />
                }
                label="Show Completed Tasks"
              />
            </Box>

            <Box sx={{ mt: 3, display: 'flex', gap: 1 }}>
              <Button
                fullWidth
                variant="outlined"
                onClick={clearFilters}
              >
                Clear All
              </Button>
              <Button
                fullWidth
                variant="contained"
                onClick={() => setFilterDrawerOpen(false)}
              >
                Apply
              </Button>
            </Box>
          </Box>
        </Drawer>

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
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Title"
                  value={taskForm.title}
                  onChange={(e) => setTaskForm(prev => ({ ...prev, title: e.target.value }))}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  multiline
                  rows={3}
                  value={taskForm.description}
                  onChange={(e) => setTaskForm(prev => ({ ...prev, description: e.target.value }))}
                />
              </Grid>
              <Grid item xs={6}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={taskForm.status}
                    onChange={(e) => setTaskForm(prev => ({ ...prev, status: e.target.value as any }))}
                  >
                    <MenuItem value="To Do">To Do</MenuItem>
                    <MenuItem value="In Progress">In Progress</MenuItem>
                    <MenuItem value="Completed">Completed</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6}>
                <FormControl fullWidth>
                  <InputLabel>Priority</InputLabel>
                  <Select
                    value={taskForm.priority}
                    onChange={(e) => setTaskForm(prev => ({ ...prev, priority: e.target.value as any }))}
                  >
                    <MenuItem value="Low">Low</MenuItem>
                    <MenuItem value="Medium">Medium</MenuItem>
                    <MenuItem value="High">High</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Account</InputLabel>
                  <Select
                    value={taskForm.accountId}
                    onChange={(e) => setTaskForm(prev => ({ ...prev, accountId: e.target.value }))}
                  >
                    {accounts.map((account) => (
                      <MenuItem key={account.id} value={account.id}>
                        {account.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={taskForm.categoryId}
                    onChange={(e) => setTaskForm(prev => ({ ...prev, categoryId: e.target.value }))}
                  >
                    <MenuItem value="">No Category</MenuItem>
                    {categories.map((category) => (
                      <MenuItem key={category.id} value={category.id}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box
                            sx={{
                              width: 12,
                              height: 12,
                              borderRadius: '50%',
                              backgroundColor: category.color
                            }}
                          />
                          {category.name}
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Tags (comma-separated)"
                  value={taskForm.tags.join(', ')}
                  onChange={(e) => setTaskForm(prev => ({ 
                    ...prev, 
                    tags: e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
                  }))}
                  placeholder="bug, frontend, urgent"
                />
              </Grid>
              <Grid item xs={12}>
                <DateTimePicker
                  label="Due Date"
                  value={taskForm.dueDate}
                  onChange={(newValue) => setTaskForm(prev => ({ ...prev, dueDate: newValue || new Date() }))}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </Grid>
              <Grid item xs={12}>
                <UserAutocomplete
                  label="Assigned To (Internal)"
                  value={taskForm.assignedTo}
                  onChange={(value) => setTaskForm(prev => ({ ...prev, assignedTo: value }))}
                  context="internal"
                />
              </Grid>
              <Grid item xs={12}>
                <UserAutocomplete
                  label="Assigned To Client"
                  value={taskForm.assignedToClient}
                  onChange={(value) => setTaskForm(prev => ({ ...prev, assignedToClient: value }))}
                  context="external"
                  accountId={taskForm.accountId}
                  accountContacts={accounts.find(a => a.id === taskForm.accountId)?.contacts || []}
                />
              </Grid>
              <Grid item xs={12}>
                <Typography gutterBottom>Progress</Typography>
                <Slider
                  value={taskForm.progress}
                  onChange={(_, value) => setTaskForm(prev => ({ ...prev, progress: value as number }))}
                  valueLabelDisplay="auto"
                  min={0}
                  max={100}
                />
                <Typography variant="body2" color="text.secondary">
                  {taskForm.progress}%
                </Typography>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setTaskDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveTask} variant="contained">
              {editingTask ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Task Detail Dialog */}
        <Dialog
          open={!!selectedTask}
          onClose={() => setSelectedTask(null)}
          maxWidth="md"
          fullWidth
        >
          {selectedTask && (
            <>
              <DialogTitle>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h6">{selectedTask.title}</Typography>
                  <IconButton onClick={() => setSelectedTask(null)}>
                    <ClearIcon />
                  </IconButton>
                </Box>
              </DialogTitle>
              <DialogContent>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Typography variant="body1" paragraph>
                      {selectedTask.description}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">Status</Typography>
                    <Chip 
                      label={selectedTask.status} 
                      color={getStatusColor(selectedTask.status) as any}
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">Priority</Typography>
                    <Chip 
                      label={selectedTask.priority} 
                      color={getPriorityColor(selectedTask.priority) as any}
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">Account</Typography>
                    <Typography variant="body2">{selectedTask.accountName}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">Due Date</Typography>
                    <Typography variant="body2">{formatDate(selectedTask.dueDate)}</Typography>
                  </Grid>
                  {selectedTask.categoryId && (
                    <Grid item xs={6}>
                      <Typography variant="subtitle2" color="text.secondary">Category</Typography>
                      {getCategoryDisplay(selectedTask)}
                    </Grid>
                  )}
                  {selectedTask.tags && selectedTask.tags.length > 0 && (
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="text.secondary">Tags</Typography>
                      <Box sx={{ mt: 1 }}>
                        {getTagsDisplay(selectedTask)}
                      </Box>
                    </Grid>
                  )}
                </Grid>
              </DialogContent>
            </>
          )}
        </Dialog>

        {/* Category Manager */}
        <CategoryManager
          open={categoryManagerOpen}
          onClose={() => setCategoryManagerOpen(false)}
        />
      </Box>
    </LocalizationProvider>
  );
};

export default TasksPage; 