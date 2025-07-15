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
  ListItemText as MuiListItemText
} from '@mui/material';
import {
  Business as BusinessIcon,
  Assignment as TaskIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
  AttachMoney as MoneyIcon,
  Favorite as HealthIcon,
  Schedule as ScheduleIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { apiService } from '../services/api';
import { DashboardMetrics } from '../types';
import { Account } from '../types';
import CircleIcon from '@mui/icons-material/Circle';
import { Task } from '../types';
import SearchIcon from '@mui/icons-material/Search';

const CSM_OPTIONS = ['Amanda Lee', 'Robert Taylor', 'Jennifer Smith', 'Michael Chen'];
const AM_OPTIONS = ['Michael Chen', 'David Wilson', 'Sarah Johnson'];
const SE_OPTIONS = ['Alex Thompson', 'Tom Anderson', 'Rachel Green'];
const TIER_OPTIONS = ['Enterprise', 'Business', 'Starter'];
const HEALTH_OPTIONS = ['Healthy', 'At Risk', 'Critical'];

const DashboardPage: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCSMs, setSelectedCSMs] = useState<string[]>([]);
  const [selectedAM, setSelectedAM] = useState('');
  const [selectedSE, setSelectedSE] = useState('');
  const [selectedTier, setSelectedTier] = useState('');
  const [selectedHealth, setSelectedHealth] = useState('');
  const navigate = useNavigate();

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

  const MetricCard = ({ 
    title, 
    value, 
    icon, 
    color = 'primary', 
    subtitle = '',
    trend = null 
  }: {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
    subtitle?: string;
    trend?: { value: number; positive: boolean } | null;
  }) => (
    <Card sx={{ height: '100%' }}>
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
        </Box>
      </Box>
      {/* Accounts Table Section - at the top */}
      <Box sx={{ mb: 6 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            Accounts
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/accounts')}
            sx={{ px: 3, py: 1, borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
          >
            Add Account
          </Button>
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
      {/* Tasks Table Section - below accounts */}
      <Box sx={{ mb: 6 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            Tasks
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => console.log('Add Task clicked (dashboard)')}
            sx={{ px: 3, py: 1, borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
          >
            Add Task
          </Button>
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
      {/* ... existing dashboard metrics, charts, and activities ... */}
      <Box>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h3" gutterBottom sx={{ fontWeight: 700 }}>
            Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Welcome back! Here's an overview of your CRM performance.
          </Typography>
        </Box>
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <MetricCard
              title="Total Accounts"
              value={metrics?.totalAccounts || 0}
              icon={<BusinessIcon />}
              color="primary"
              subtitle="Active customers"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <MetricCard
              title="Total Tasks"
              value={metrics?.totalTasks || 0}
              icon={<TaskIcon />}
              color="secondary"
              subtitle="Open items"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <MetricCard
              title="Active Accounts"
              value={metrics?.activeAccounts || 0}
              icon={<TrendingUpIcon />}
              color="success"
              subtitle="Healthy customers"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <MetricCard
              title="At Risk"
              value={metrics?.atRiskAccounts || 0}
              icon={<WarningIcon />}
              color="warning"
              subtitle="Needs attention"
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
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <MetricCard
              title="Avg Health Score"
              value={`${Math.round(metrics?.averageHealthScore || 0)}%`}
              icon={<HealthIcon />}
              color="primary"
              subtitle="Customer satisfaction"
            />
          </Grid>
        </Grid>
        {/* Recent Activities */}
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
                      <ListItem sx={{ px: 0, py: 1.5 }}>
                        <ListItemText
                          primary={
                            <Typography variant="body1" sx={{ fontWeight: 500 }}>
                              {activity.description}
                            </Typography>
                          }
                          secondary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                              <Chip
                                label={activity.type}
                                size="small"
                                color="primary"
                                variant="outlined"
                                sx={{ fontSize: '0.75rem' }}
                              />
                              <Typography variant="caption" color="text.secondary">
                                {new Date(activity.date).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </Typography>
                            </Box>
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
      </Box>
    </Box>
  );
};

export default DashboardPage; 