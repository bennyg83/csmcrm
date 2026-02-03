import React, { useState, useEffect } from 'react';
import { 
  Typography, 
  Box, 
  Grid, 
  Paper, 
  CircularProgress, 
  Alert, 
  List, 
  ListItem, 
  ListItemText, 
  Divider,
  Card,
  CardContent,
  Avatar,
  Chip,
  Link,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Button,
  TextField,
  InputAdornment,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  OutlinedInput,
  Checkbox,
  ListItemText as MuiListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab
} from '@mui/material';
import {
  Business as BusinessIcon,
  Assignment as TaskIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
  AttachMoney as MoneyIcon,
  Favorite as HealthIcon,
  Schedule as ScheduleIcon,
  Add as AddIcon,
  Dashboard as DashboardIcon,
  List as ListIcon
} from '@mui/icons-material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { apiService } from '../services/api';
import { DashboardMetrics } from '../types';
import { Account } from '../types';
import CircleIcon from '@mui/icons-material/Circle';
import { Task, User } from '../types';
import SearchIcon from '@mui/icons-material/Search';
import UserAutocomplete from '../components/UserAutocomplete';
import { usePermissions } from '../utils/rbac';

const CSM_OPTIONS = ['Amanda Lee', 'Robert Taylor', 'Jennifer Smith', 'Michael Chen'];
const AM_OPTIONS = ['Michael Chen', 'David Wilson', 'Sarah Johnson'];
const SE_OPTIONS = ['Alex Thompson', 'Tom Anderson', 'Rachel Green'];
const TIER_OPTIONS = ['Enterprise', 'Business', 'Starter'];
const HEALTH_OPTIONS = ['Healthy', 'At Risk', 'Critical'];

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`dashboard-tabpanel-${index}`}
      aria-labelledby={`dashboard-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `dashboard-tab-${index}`,
    'aria-controls': `dashboard-tabpanel-${index}`,
  };
}

const DashboardPage: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [search, setSearch] = useState('');
  const [tabValue, setTabValue] = useState(0);
  
  // RBAC permissions
  const { canCreate } = usePermissions();
  const [selectedCSMs, setSelectedCSMs] = useState<string[]>([]);
  const [selectedAM, setSelectedAM] = useState('');
  const [selectedSE, setSelectedSE] = useState('');
  const [selectedTier, setSelectedTier] = useState('');
  const [selectedHealth, setSelectedHealth] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const navigate = useNavigate();

  // Task form state
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

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch accounts for metrics
        const accountsData = await apiService.getAccounts();
        setAccounts(accountsData);
        const tasksData = await apiService.getTasks();
        setTasks(tasksData);
        const recentActivities = await apiService.getRecentActivities();
        
        // Fetch users for task assignment
        try {
          const usersData = await apiService.getAllUsers();
          setUsers(usersData);
        } catch (err) {
          console.warn('Could not fetch users:', err);
        }
        
        // Calculate metrics
        const totalAccounts = accountsData.length;
        const totalTasks = tasksData.length;
        const activeAccounts = accountsData.filter(acc => acc.status === 'active').length;
        const atRiskAccounts = accountsData.filter(acc => acc.status === 'at-risk').length;
        
        setMetrics({
          totalAccounts,
          totalTasks,
          activeAccounts,
          atRiskAccounts,
          totalRevenue: accountsData.reduce((sum, acc) => sum + Number(acc.revenue), 0),
          averageHealthScore: accountsData.reduce((sum, acc) => sum + acc.health, 0) / accountsData.length || 0,
          recentActivities
        });
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Filter data based on selected filters
  const getFilteredData = () => {
    let filteredAccounts = [...accounts];
    let filteredTasks = [...tasks];

    // Filter by search
    if (search) {
      const searchLower = search.toLowerCase();
      filteredAccounts = filteredAccounts.filter(account =>
        account.name.toLowerCase().includes(searchLower) ||
        account.email.toLowerCase().includes(searchLower) ||
        account.industry?.toLowerCase().includes(searchLower)
      );
      filteredTasks = filteredTasks.filter(task =>
        task.title.toLowerCase().includes(searchLower) ||
        task.description.toLowerCase().includes(searchLower)
      );
    }

    // Filter by CSM
    if (selectedCSMs.length > 0) {
      filteredAccounts = filteredAccounts.filter(account =>
        selectedCSMs.includes(account.customerSuccessManager)
      );
    }

    // Filter by Account Manager
    if (selectedAM) {
      filteredAccounts = filteredAccounts.filter(account =>
        account.accountManager === selectedAM
      );
    }

    // Filter by Solutions Engineer
    if (selectedSE) {
      filteredAccounts = filteredAccounts.filter(account =>
        account.salesEngineer === selectedSE
      );
    }

    // Filter by Tier
    if (selectedTier) {
      filteredAccounts = filteredAccounts.filter(account =>
        account.tier?.name === selectedTier
      );
    }

    // Filter by Health
    if (selectedHealth) {
      filteredAccounts = filteredAccounts.filter(account => {
        if (selectedHealth === 'Healthy') return account.health >= 70;
        if (selectedHealth === 'At Risk') return account.health >= 40 && account.health < 70;
        if (selectedHealth === 'Critical') return account.health < 40;
        return true;
      });
    }

    // Filter by Status
    if (selectedStatus) {
      filteredAccounts = filteredAccounts.filter(account =>
        account.status === selectedStatus
      );
    }

    // Filter by Team Members (users)
    if (selectedUsers.length > 0) {
      filteredAccounts = filteredAccounts.filter(account =>
        selectedUsers.includes(account.accountManager) ||
        selectedUsers.includes(account.customerSuccessManager) ||
        selectedUsers.includes(account.salesEngineer)
      );
    }

    return { filteredAccounts, filteredTasks };
  };

  // Calculate filtered metrics
  const getFilteredMetrics = () => {
    const { filteredAccounts, filteredTasks } = getFilteredData();
    
    return {
      totalAccounts: filteredAccounts.length,
      totalTasks: filteredTasks.length,
      activeAccounts: filteredAccounts.filter(acc => acc.status === 'active').length,
      atRiskAccounts: filteredAccounts.filter(acc => acc.status === 'at-risk').length,
      totalRevenue: filteredAccounts.reduce((sum, acc) => sum + Number(acc.revenue), 0),
      averageHealthScore: filteredAccounts.reduce((sum, acc) => sum + acc.health, 0) / filteredAccounts.length || 0,
      recentActivities: metrics?.recentActivities || []
    };
  };

  const MetricCard = ({ 
    title, 
    value, 
    icon, 
    color = 'primary', 
    subtitle = '',
    trend = null,
    onClick
  }: {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
    subtitle?: string;
    trend?: { value: number; positive: boolean } | null;
    onClick?: () => void;
  }) => (
    <Card 
      sx={{ 
        height: '100%',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s ease-in-out',
        '&:hover': onClick ? {
          transform: 'translateY(-4px)',
          boxShadow: 4
        } : {}
      }}
      onClick={onClick}
    >
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Avatar 
            sx={{ 
              bgcolor: `${color}.light`, 
              color: `${color}.main`,
              width: 48,
              height: 48
            }}
          >
            {icon}
          </Avatar>
          {trend && (
            <Chip
              label={`${trend.positive ? '+' : ''}${trend.value}%`}
              size="small"
              color={trend.positive ? 'success' : 'error'}
              sx={{ fontSize: '0.75rem' }}
            />
          )}
        </Box>
        
        <Typography variant="h4" component="div" sx={{ fontWeight: 700, mb: 0.5 }}>
          {value}
        </Typography>
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          {title}
        </Typography>
        
        {subtitle && (
          <Typography variant="caption" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  );

  // Helper for status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'at-risk':
        return 'warning';
      case 'inactive':
        return 'error';
      default:
        return 'default';
    }
  };
  const getHealthColor = (health: number) => {
    if (health >= 80) return 'success.main';
    if (health >= 60) return 'warning.main';
    return 'error.main';
  };

  const handleRemoveChip = (type: string, value: string) => {
    if (type === 'CSM') setSelectedCSMs(selectedCSMs.filter((csm) => csm !== value));
    if (type === 'AM') setSelectedAM('');
    if (type === 'SE') setSelectedSE('');
    if (type === 'Tier') setSelectedTier('');
    if (type === 'Health') setSelectedHealth('');
    if (type === 'Status') setSelectedStatus('');
    if (type === 'User') setSelectedUsers(selectedUsers.filter((userId) => userId !== value));
  };

  // Handler for clicking metric cards
  const handleMetricClick = (metricType: string) => {
    switch (metricType) {
      case 'totalAccounts':
        // Navigate to accounts page with no filters (show all)
        navigate('/accounts');
        break;
      case 'totalTasks':
        // Navigate to tasks page
        navigate('/tasks');
        break;
      case 'activeAccounts':
        // Navigate to accounts page filtered by active status
        navigate('/accounts?status=active');
        break;
      case 'atRiskAccounts':
        // Navigate to accounts page filtered by at-risk status
        navigate('/accounts?status=at-risk');
        break;
      case 'totalRevenue':
        // Navigate to accounts page (could add sort by revenue later)
        navigate('/accounts');
        break;
      case 'averageHealthScore':
        // Navigate to accounts page filtered by healthy accounts
        navigate('/accounts?health=Healthy');
        break;
      default:
        break;
    }
  };

  const openTaskDialog = () => {
    console.log('openTaskDialog called');
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
    setTaskDialogOpen(true);
  };

  const handleSaveTask = async () => {
    try {
      const taskData = {
        ...taskForm,
        dueDate: taskForm.dueDate.toISOString()
      };

      await apiService.createTask(taskData);

      // Refresh tasks
      const updatedTasks = await apiService.getTasks();
      setTasks(updatedTasks);
      setTaskDialogOpen(false);
    } catch (error) {
      console.error('Error saving task:', error);
      setError('Failed to save task');
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
          Dashboard
        </Typography>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" gutterBottom sx={{ fontWeight: 700 }}>
          Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Welcome back! Here's an overview of your CRM performance.
        </Typography>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange} 
          aria-label="dashboard tabs"
          sx={{
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '1rem',
              minHeight: 48
            }
          }}
        >
          <Tab 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <DashboardIcon sx={{ fontSize: 20 }} />
                Overview
              </Box>
            } 
            {...a11yProps(0)} 
          />
          <Tab 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <ListIcon sx={{ fontSize: 20 }} />
                Accounts & Tasks
              </Box>
            } 
            {...a11yProps(1)} 
          />
        </Tabs>
      </Box>

      {/* Tab Panels */}
      <TabPanel value={tabValue} index={0}>
        {/* Overview Tab - Metrics and Recent Activities */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <MetricCard
              title="Total Accounts"
              value={metrics?.totalAccounts || 0}
              icon={<BusinessIcon />}
              color="primary"
              subtitle="Active customers"
              onClick={() => handleMetricClick('totalAccounts')}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <MetricCard
              title="Total Tasks"
              value={metrics?.totalTasks || 0}
              icon={<TaskIcon />}
              color="secondary"
              subtitle="Open items"
              onClick={() => handleMetricClick('totalTasks')}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <MetricCard
              title="Active Accounts"
              value={metrics?.activeAccounts || 0}
              icon={<TrendingUpIcon />}
              color="success"
              subtitle="Healthy customers"
              onClick={() => handleMetricClick('activeAccounts')}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <MetricCard
              title="At Risk"
              value={metrics?.atRiskAccounts || 0}
              icon={<WarningIcon />}
              color="warning"
              subtitle="Needs attention"
              onClick={() => handleMetricClick('atRiskAccounts')}
            />
          </Grid>
        </Grid>
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={6}>
            <MetricCard
              title="Total Revenue"
              value={`$${metrics?.totalRevenue?.toLocaleString() || 0}`}
              icon={<MoneyIcon />}
              color="success"
              subtitle="Annual recurring revenue"
              onClick={() => handleMetricClick('totalRevenue')}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <MetricCard
              title="Avg Health Score"
              value={`${Math.round(metrics?.averageHealthScore || 0)}%`}
              icon={<HealthIcon />}
              color="primary"
              subtitle="Customer satisfaction"
              onClick={() => handleMetricClick('averageHealthScore')}
            />
          </Grid>
        </Grid>
        {/* Recent Activities */}
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <Avatar sx={{ bgcolor: 'primary.light', color: 'primary.main', mr: 2 }}>
                    <ScheduleIcon />
                  </Avatar>
                  <Typography variant="h5" sx={{ fontWeight: 600 }}>
                    Recent Activities
                  </Typography>
                </Box>
                
                {metrics?.recentActivities && metrics.recentActivities.length > 0 ? (
                  <List sx={{ p: 0 }}>
                    {metrics.recentActivities.map((activity, index) => (
                      <React.Fragment key={activity.id}>
                        <ListItem 
                          sx={{ 
                            px: 0, 
                            py: 1.5,
                            cursor: 'pointer',
                            '&:hover': {
                              backgroundColor: 'action.hover'
                            }
                          }}
                          onClick={() => {
                            if (activity.accountId) {
                              // Navigate to account detail page
                              navigate(`/accounts/${activity.accountId}`);
                            }
                          }}
                        >
                          <ListItemText
                            primary={
                              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                {activity.description}
                              </Typography>
                            }
                            secondary={
                              <Typography variant="caption" color="text.secondary" component="div">
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                                  <Chip
                                    label={activity.type}
                                    size="small"
                                    color="primary"
                                    variant="outlined"
                                    sx={{ fontSize: '0.75rem' }}
                                  />
                                  {activity.account && (
                                    <Chip
                                      label={activity.account.name}
                                      size="small"
                                      color="secondary"
                                      variant="outlined"
                                      sx={{ fontSize: '0.75rem', cursor: 'pointer' }}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (activity.accountId) {
                                          navigate(`/accounts/${activity.accountId}`);
                                        }
                                      }}
                                    />
                                  )}
                                  <Typography variant="caption" color="text.secondary">
                                    {new Date(activity.date).toLocaleDateString('en-US', {
                                      year: 'numeric',
                                      month: 'short',
                                      day: 'numeric'
                                    })}
                                  </Typography>
                                </Box>
                              </Typography>
                            }
                          />
                        </ListItem>
                        {index < metrics.recentActivities.length - 1 && (
                          <Divider sx={{ my: 1 }} />
                        )}
                      </React.Fragment>
                    ))}
                  </List>
                ) : (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      No recent activities
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        {/* Accounts & Tasks Tab - Search, Filters, and Tables */}
        {/* Search and Filters */}
        <Box sx={{ mb: 4 }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search accounts or contacts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
              sx: { backgroundColor: 'white', borderRadius: 2 }
            }}
          />
          {/* Filter Chips */}
          <Box sx={{ mt: 2, mb: 1, display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            {selectedCSMs.length > 0 && (
              <Chip
                label={
                  <span>
                    <b>CSM:</b> {selectedCSMs.join(', ')}
                  </span>
                }
                onDelete={() => setSelectedCSMs([])}
                color="primary"
              />
            )}
            {selectedAM && (
              <Chip
                label={<span><b>AM:</b> {selectedAM}</span>}
                onDelete={() => setSelectedAM('')}
                color="primary"
              />
            )}
            {selectedSE && (
              <Chip
                label={<span><b>SE:</b> {selectedSE}</span>}
                onDelete={() => setSelectedSE('')}
                color="primary"
              />
            )}
            {selectedTier && (
              <Chip
                label={<span><b>Tier:</b> {selectedTier}</span>}
                onDelete={() => setSelectedTier('')}
                color="primary"
              />
            )}
            {selectedHealth && (
              <Chip
                label={<span><b>Health:</b> {selectedHealth}</span>}
                onDelete={() => setSelectedHealth('')}
                color="primary"
              />
            )}
            {selectedStatus && (
              <Chip
                label={<span><b>Status:</b> {selectedStatus === 'active' ? 'Active' : selectedStatus === 'at-risk' ? 'At Risk' : selectedStatus}</span>}
                onDelete={() => setSelectedStatus('')}
                color="primary"
              />
            )}
            {selectedUsers.length > 0 && (
              <Chip
                label={
                  <span>
                    <b>Team:</b> {selectedUsers.map(userId => users.find(u => u.id === userId)?.name || userId).join(', ')}
                  </span>
                }
                onDelete={() => setSelectedUsers([])}
                color="primary"
              />
            )}
          </Box>
          {/* Filter Controls */}
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 1 }}>
            <FormControl sx={{ minWidth: 180 }} size="small">
              <InputLabel>CSM</InputLabel>
              <Select
                multiple
                value={selectedCSMs}
                onChange={(e) => setSelectedCSMs(typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value)}
                input={<OutlinedInput label="CSM" />}
                renderValue={(selected) => (selected as string[]).join(', ')}
              >
                {CSM_OPTIONS.map((name) => (
                  <MenuItem key={name} value={name}>
                    <Checkbox checked={selectedCSMs.indexOf(name) > -1} />
                    <MuiListItemText primary={name} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl sx={{ minWidth: 180 }} size="small">
              <InputLabel>Account Manager</InputLabel>
              <Select
                value={selectedAM}
                onChange={(e) => setSelectedAM(e.target.value)}
                label="Account Manager"
              >
                <MenuItem value=""><em>None</em></MenuItem>
                {AM_OPTIONS.map((name) => (
                  <MenuItem key={name} value={name}>{name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl sx={{ minWidth: 180 }} size="small">
              <InputLabel>Solutions Engineer</InputLabel>
              <Select
                value={selectedSE}
                onChange={(e) => setSelectedSE(e.target.value)}
                label="Solutions Engineer"
              >
                <MenuItem value=""><em>None</em></MenuItem>
                {SE_OPTIONS.map((name) => (
                  <MenuItem key={name} value={name}>{name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl sx={{ minWidth: 140 }} size="small">
              <InputLabel>Tier</InputLabel>
              <Select
                value={selectedTier}
                onChange={(e) => setSelectedTier(e.target.value)}
                label="Tier"
              >
                <MenuItem value=""><em>None</em></MenuItem>
                {TIER_OPTIONS.map((name) => (
                  <MenuItem key={name} value={name}>{name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl sx={{ minWidth: 140 }} size="small">
              <InputLabel>Health</InputLabel>
              <Select
                value={selectedHealth}
                onChange={(e) => setSelectedHealth(e.target.value)}
                label="Health"
              >
                <MenuItem value=""><em>None</em></MenuItem>
                {HEALTH_OPTIONS.map((name) => (
                  <MenuItem key={name} value={name}>{name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl sx={{ minWidth: 180 }} size="small">
              <InputLabel>Team Member</InputLabel>
              <Select
                multiple
                value={selectedUsers}
                onChange={(e) => setSelectedUsers(typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value)}
                input={<OutlinedInput label="Team Member" />}
                renderValue={(selected) => (selected as string[]).map(userId => users.find(u => u.id === userId)?.name || userId).join(', ')}
              >
                {users.map((user) => (
                  <MenuItem key={user.id} value={user.id}>
                    <Checkbox checked={selectedUsers.indexOf(user.id) > -1} />
                    <MuiListItemText primary={user.name} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </Box>

        {/* Accounts Table Section */}
        <Box sx={{ mb: 6 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Link
              component={RouterLink}
              to="/accounts"
              underline="none"
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                cursor: 'pointer',
                px: 0.5,
                borderRadius: 1,
                transition: 'background 0.2s, color 0.2s',
                '&:hover': {
                  backgroundColor: 'action.hover',
                  color: 'primary.main',
                  textDecoration: 'none',
                  '& .section-icon': {
                    transform: 'translateX(2px)'
                  }
                }
              }}
            >
              <Typography
                variant="h5"
                sx={{ fontWeight: 600, transition: 'color 0.2s ease' }}
              >
                Accounts
              </Typography>
              <OpenInNewIcon
                className="section-icon"
                sx={{ fontSize: 18, color: 'text.secondary', transition: 'transform 0.2s, color 0.2s' }}
              />
            </Link>
            {canCreate('accounts') && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => navigate('/accounts')}
                sx={{ px: 3, py: 1, borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
              >
                Add Account
              </Button>
            )}
          </Box>
          <Card>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem' }}>Account Name</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem' }}>Industry</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem' }}>AM</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem' }}>CS</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem' }}>SE/PS</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem' }}>Health</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem' }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem' }}>ARR</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem' }}>Renewal</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {accounts.slice(0, 5).map((account) => (
                    <TableRow key={account.id} hover>
                      <TableCell>
                        <Link
                          component={RouterLink}
                          to={`/accounts/${account.id}`}
                          sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 0.5 }}
                          underline="hover"
                        >
                          {account.name}
                          <OpenInNewIcon sx={{ fontSize: 16, ml: 0.5 }} />
                        </Link>
                      </TableCell>
                      <TableCell>{account.industry || 'N/A'}</TableCell>
                      <TableCell>{account.accountManager || 'N/A'}</TableCell>
                      <TableCell>{account.customerSuccessManager || 'N/A'}</TableCell>
                      <TableCell>{account.salesEngineer || 'N/A'}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <CircleIcon sx={{ fontSize: 12, color: getHealthColor(account.health) }} />
                          <Typography variant="body2" sx={{ fontWeight: 600, color: getHealthColor(account.health) }}>
                            {account.health}%
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={account.status}
                          color={getStatusColor(account.status) as any}
                          size="small"
                          sx={{ fontSize: '0.75rem', fontWeight: 500 }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          ${account.arr.toLocaleString()}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {(() => {
                            const renewal = new Date(account.renewalDate);
                            const today = new Date();
                            const diffTime = renewal.getTime() - today.getTime();
                            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                            return `${diffDays} days`;
                          })()}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </Box>

        {/* Tasks Table Section */}
        <Box sx={{ mb: 6 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Link
              component={RouterLink}
              to="/tasks"
              underline="none"
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                cursor: 'pointer',
                px: 0.5,
                borderRadius: 1,
                transition: 'background 0.2s, color 0.2s',
                '&:hover': {
                  backgroundColor: 'action.hover',
                  color: 'primary.main',
                  textDecoration: 'none',
                  '& .section-icon': {
                    transform: 'translateX(2px)'
                  }
                }
              }}
            >
              <Typography
                variant="h5"
                sx={{ fontWeight: 600, transition: 'color 0.2s ease' }}
              >
                Tasks
              </Typography>
              <OpenInNewIcon 
                className="section-icon"
                sx={{ 
                  fontSize: 18, 
                  color: 'text.secondary',
                  transition: 'transform 0.2s ease, color 0.2s ease'
                }} 
              />
            </Link>
            {canCreate('tasks') && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={openTaskDialog}
                sx={{ px: 3, py: 1, borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
              >
                Add Task
              </Button>
            )}
          </Box>
          <Card>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem' }}>Title</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem' }}>Account</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem' }}>Assigned To</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem' }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem' }}>Priority</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem' }}>Due Date</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {tasks
                    .slice()
                    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
                    .slice(0, 5)
                    .map((task) => (
                      <TableRow key={task.id} hover>
                        <TableCell>
                          <Link
                            component={RouterLink}
                            to={`/tasks/${task.id}`}
                            sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 0.5 }}
                            underline="hover"
                          >
                            {task.title}
                            <OpenInNewIcon sx={{ fontSize: 16, ml: 0.5 }} />
                          </Link>
                        </TableCell>
                        <TableCell>{task.accountName || 'N/A'}</TableCell>
                        <TableCell>{task.assignedTo || 'N/A'}</TableCell>
                        <TableCell>
                          <Chip
                            label={task.status}
                            color={task.status === 'Completed' ? 'success' : task.status === 'In Progress' ? 'warning' : 'default'}
                            size="small"
                            sx={{ fontSize: '0.75rem', fontWeight: 500 }}
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={task.priority}
                            color={task.priority === 'High' ? 'error' : task.priority === 'Medium' ? 'warning' : 'default'}
                            size="small"
                            sx={{ fontSize: '0.75rem', fontWeight: 500 }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'N/A'}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </Box>
      </TabPanel>

      {/* Task Creation Dialog */}
      <Dialog 
        open={taskDialogOpen} 
        onClose={() => setTaskDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Create New Task
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
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Due Date"
                type="datetime-local"
                value={taskForm.dueDate.toISOString().slice(0, 16)}
                onChange={(e) => setTaskForm(prev => ({ ...prev, dueDate: new Date(e.target.value) }))}
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Account</InputLabel>
                <Select
                  value={taskForm.accountId}
                  onChange={(e) => setTaskForm(prev => ({ ...prev, accountId: e.target.value }))}
                >
                  <MenuItem value=""><em>None</em></MenuItem>
                  {accounts.map((account) => (
                    <MenuItem key={account.id} value={account.id}>{account.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
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
                accountContacts={accounts.find(acc => acc.id === taskForm.accountId)?.contacts}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTaskDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveTask} variant="contained">
            Create Task
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DashboardPage; 