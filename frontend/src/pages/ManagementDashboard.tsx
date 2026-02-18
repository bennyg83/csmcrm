import React, { useState, useEffect, useMemo } from 'react';
import {
  Typography,
  Box,
  Grid,
  Paper,
  Card,
  CardContent,
  Avatar,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  LinearProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  IconButton,
  Tooltip,
  TextField,
  OutlinedInput,
  Checkbox
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  People as PeopleIcon,
  AccountBalance as RevenueIcon,
  Task as TaskIcon,
  Assessment as AssessmentIcon,
  Business as BusinessIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Refresh as RefreshIcon,
  GetApp as ExportIcon,
  Search as SearchIcon,
  FilterList as FilterIcon
} from '@mui/icons-material';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { apiService } from '../services/api';
import { usePermissions } from '../utils/rbac';

// Filter options - these would typically come from the API
const CSM_OPTIONS = ['Ben Goldberg', 'Sarah Johnson', 'Mike Chen', 'Emily Davis'];
const AM_OPTIONS = ['John Smith', 'Lisa Wang', 'David Brown', 'Maria Garcia'];
const SE_OPTIONS = ['Alex Turner', 'Rachel Green', 'Tom Wilson', 'Kate Miller'];
const TIER_OPTIONS = ['Enterprise', 'Professional', 'Standard', 'Starter'];
const HEALTH_OPTIONS = ['Healthy', 'At Risk', 'Critical'];

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  ChartTooltip,
  Legend,
  ArcElement
);

interface ManagementMetrics {
  // Team Performance
  teamMetrics: {
    totalUsers: number;
    activeUsers: number;
    averageTasksPerUser: number;
    topPerformers: Array<{
      name: string;
      completedTasks: number;
      accountsManaged: number;
    }>;
  };
  
  // Revenue & Account Analytics
  revenueMetrics: {
    totalRevenue: number;
    monthlyRecurring: number;
    growthRate: number;
    churnRate: number;
    revenueByTier: Array<{
      tier: string;
      revenue: number;
      accounts: number;
    }>;
    revenueByCSM: Array<{
      csm: string;
      revenue: number;
      accounts: number;
      avgHealthScore: number;
    }>;
  };
  
  // Operational Metrics
  operationalMetrics: {
    totalAccounts: number;
    /** Accounts with status === 'active' (vs healthyAccounts = health >= 70) */
    activeAccountsByStatus: number;
    healthyAccounts: number;
    atRiskAccounts: number;
    criticalAccounts: number;
    taskCompletionRate: number;
    averageResponseTime: number;
    ticketResolutionRate: number;
  };
  
  // Time-based Analytics
  timeBasedMetrics: {
    accountsCreatedThisMonth: number;
    tasksCompletedThisMonth: number;
    monthlyTrends: Array<{
      month: string;
      accounts: number;
      revenue: number;
      tasks: number;
    }>;
  };
}

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  color: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, subtitle, icon, color, trend }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            {title}
          </Typography>
          <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
            {value}
          </Typography>
          {subtitle && (
            <Typography variant="body2" color="text.secondary">
              {subtitle}
            </Typography>
          )}
          {trend && (
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
              {trend.isPositive ? (
                <TrendingUpIcon color="success" sx={{ fontSize: 16, mr: 0.5 }} />
              ) : (
                <TrendingDownIcon color="error" sx={{ fontSize: 16, mr: 0.5 }} />
              )}
              <Typography 
                variant="caption" 
                color={trend.isPositive ? 'success.main' : 'error.main'}
                sx={{ fontWeight: 600 }}
              >
                {Math.abs(trend.value)}%
              </Typography>
            </Box>
          )}
        </Box>
        <Avatar sx={{ bgcolor: `${color}.light`, color: `${color}.main`, width: 56, height: 56 }}>
          {icon}
        </Avatar>
      </Box>
    </CardContent>
  </Card>
);

const ManagementDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<ManagementMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const { canView } = usePermissions();

  // Filter state
  const [search, setSearch] = useState('');
  const [selectedCSMs, setSelectedCSMs] = useState<string[]>([]);
  const [selectedAM, setSelectedAM] = useState('');
  const [selectedSE, setSelectedSE] = useState('');
  const [selectedTier, setSelectedTier] = useState('');
  const [selectedHealth, setSelectedHealth] = useState('');

  // Raw data state for filtering
  const [rawAccounts, setRawAccounts] = useState<any[]>([]);
  const [rawTasks, setRawTasks] = useState<any[]>([]);
  const [rawUsers, setRawUsers] = useState<any[]>([]);

  // Check if user has management permissions
  const hasManagementAccess = canView('reports') || canView('users') || canView('analytics');

  useEffect(() => {
    if (!hasManagementAccess) {
      setError('You do not have permission to view management metrics');
      setLoading(false);
      return;
    }

    fetchManagementMetrics();
  }, [hasManagementAccess, timeRange]);

  const fetchManagementMetrics = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch data from multiple endpoints
      const [accounts, tasks, users] = await Promise.all([
        apiService.getAccounts(),
        apiService.getTasks(),
        apiService.getAllUsers()
      ]);

      // Store raw data for filtering
      setRawAccounts(accounts);
      setRawTasks(tasks);
      setRawUsers(users);

      // Calculate management metrics will be done in useMemo based on filtered data
    } catch (err: any) {
      setError(err.message || 'Failed to load management metrics');
    } finally {
      setLoading(false);
    }
  };

  // Filter accounts based on search and selected filters
  const filteredAccounts = useMemo(() => {
    let filtered = [...rawAccounts];

    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(account =>
        account.name.toLowerCase().includes(searchLower) ||
        (account.email && account.email.toLowerCase().includes(searchLower)) ||
        (account.customerSuccessManager && account.customerSuccessManager.toLowerCase().includes(searchLower)) ||
        (account.accountManager && account.accountManager.toLowerCase().includes(searchLower)) ||
        (account.salesEngineer && account.salesEngineer.toLowerCase().includes(searchLower))
      );
    }

    // CSM filter
    if (selectedCSMs.length > 0) {
      filtered = filtered.filter(account =>
        selectedCSMs.includes(account.customerSuccessManager || '')
      );
    }

    // Account Manager filter
    if (selectedAM) {
      filtered = filtered.filter(account => account.accountManager === selectedAM);
    }

    // Solutions Engineer filter
    if (selectedSE) {
      filtered = filtered.filter(account => account.salesEngineer === selectedSE);
    }

    // Tier filter
    if (selectedTier) {
      filtered = filtered.filter(account => account.tierId === selectedTier);
    }

    // Health filter
    if (selectedHealth) {
      filtered = filtered.filter(account => {
        const health = account.health;
        if (selectedHealth === 'Healthy') return health >= 70;
        if (selectedHealth === 'At Risk') return health >= 40 && health < 70;
        if (selectedHealth === 'Critical') return health < 40;
        return true;
      });
    }

    return filtered;
  }, [rawAccounts, search, selectedCSMs, selectedAM, selectedSE, selectedTier, selectedHealth]);

  // Calculate metrics based on filtered data
  const filteredMetrics = useMemo(() => {
    if (rawAccounts.length === 0 || rawTasks.length === 0 || rawUsers.length === 0) {
      return null;
    }

    const filteredTasks = rawTasks.filter(task => 
      filteredAccounts.some(account => account.id === task.accountId)
    );

    const managementMetrics: ManagementMetrics = {
        teamMetrics: {
          totalUsers: rawUsers.length,
          activeUsers: rawUsers.filter(u => u.lastLogin).length,
          averageTasksPerUser: filteredTasks.length / rawUsers.length,
          topPerformers: rawUsers
            .map(user => {
              const userId = (user as { id?: string }).id;
              const userName = (user as { name?: string }).name ?? '';
              const isAssignedToUser = (t: { assignedTo?: string | string[]; status?: string }) => {
                if (!t.assignedTo) return false;
                const arr = Array.isArray(t.assignedTo) ? t.assignedTo : [t.assignedTo];
                return arr.some((id: string) => id === userId || id === userName);
              };
              return {
                name: userName,
                completedTasks: filteredTasks.filter(t => isAssignedToUser(t) && t.status === 'Completed').length,
                accountsManaged: filteredAccounts.filter(a =>
                  a.accountManager === userName ||
                  a.customerSuccessManager === userName ||
                  a.salesEngineer === userName
                ).length
              };
            })
            .sort((a, b) => (b.completedTasks + b.accountsManaged) - (a.completedTasks + a.accountsManaged))
            .slice(0, 5)
        },
        
        revenueMetrics: {
          totalRevenue: filteredAccounts.reduce((sum, acc) => sum + (Number(acc.revenue) || 0), 0),
          monthlyRecurring: filteredAccounts.reduce((sum, acc) => sum + (Number(acc.arr) || 0), 0),
          growthRate: 12.5, // Calculate based on historical data
          churnRate: 2.3, // Calculate based on account status changes
          revenueByTier: [], // Group by account tier
          revenueByCSM: [] // Group by CSM
        },
        
        operationalMetrics: {
          totalAccounts: filteredAccounts.length,
          activeAccountsByStatus: filteredAccounts.filter(a => a.status === 'active').length,
          healthyAccounts: filteredAccounts.filter(a => a.health >= 70).length,
          atRiskAccounts: filteredAccounts.filter(a => a.health >= 40 && a.health < 70).length,
          criticalAccounts: filteredAccounts.filter(a => a.health < 40).length,
          taskCompletionRate: filteredTasks.length > 0 ? (filteredTasks.filter(t => t.status === 'Completed').length / filteredTasks.length) * 100 : 0,
          averageResponseTime: 2.4, // Hours - calculate from actual data
          ticketResolutionRate: 94.2 // Percentage - calculate from actual data
        },
        
        timeBasedMetrics: {
          accountsCreatedThisMonth: filteredAccounts.filter(a => 
            new Date(a.createdAt).getMonth() === new Date().getMonth()
          ).length,
          tasksCompletedThisMonth: filteredTasks.filter(t => 
            t.status === 'Completed' && 
            new Date(t.updatedAt).getMonth() === new Date().getMonth()
          ).length,
          monthlyTrends: [] // Calculate monthly trends
        }
      };

      return managementMetrics;
  }, [filteredAccounts, rawTasks, rawUsers]);

  // Update metrics when filtered metrics change
  useEffect(() => {
    setMetrics(filteredMetrics);
  }, [filteredMetrics]);

  const exportReport = () => {
    // Implement CSV/PDF export functionality
    console.log('Exporting management report...');
  };

  if (!hasManagementAccess) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          Management Dashboard
        </Typography>
        <Alert severity="error">
          Access Denied: You need management permissions to view this dashboard.
        </Alert>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          Management Dashboard
        </Typography>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h3" gutterBottom sx={{ fontWeight: 700 }}>
            Management Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Executive overview of business performance and team metrics
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Time Range</InputLabel>
            <Select
              value={timeRange}
              label="Time Range"
              onChange={(e) => setTimeRange(e.target.value as any)}
            >
              <MenuItem value="7d">Last 7 days</MenuItem>
              <MenuItem value="30d">Last 30 days</MenuItem>
              <MenuItem value="90d">Last 90 days</MenuItem>
              <MenuItem value="1y">Last year</MenuItem>
            </Select>
          </FormControl>
          <Tooltip title="Refresh Data">
            <IconButton onClick={fetchManagementMetrics}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Button
            variant="outlined"
            startIcon={<ExportIcon />}
            onClick={exportReport}
          >
            Export Report
          </Button>
        </Box>
      </Box>

      {/* Search Bar and Filters */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <TextField
            fullWidth
            placeholder="Search accounts, CSMs, or managers..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
              sx: { borderRadius: 8, background: '#fff' }
            }}
            sx={{ mr: 2, flex: 1, borderRadius: 8 }}
          />
          <Tooltip title="Filter Data">
            <IconButton>
              <FilterIcon />
            </IconButton>
          </Tooltip>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <FormControl sx={{ minWidth: 160 }} size="small">
            <InputLabel>CSM</InputLabel>
            <Select
              multiple
              value={selectedCSMs}
              onChange={e => setSelectedCSMs(typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value)}
              input={<OutlinedInput label="CSM" />}
              renderValue={selected => (selected as string[]).join(', ')}
            >
              {CSM_OPTIONS.map(name => (
                <MenuItem key={name} value={name}>
                  <Checkbox checked={selectedCSMs.indexOf(name) > -1} />
                  <Typography>{name}</Typography>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl sx={{ minWidth: 160 }} size="small">
            <InputLabel>Account Manager</InputLabel>
            <Select
              value={selectedAM}
              onChange={e => setSelectedAM(e.target.value)}
              label="Account Manager"
            >
              <MenuItem value=""><em>All</em></MenuItem>
              {AM_OPTIONS.map(name => (
                <MenuItem key={name} value={name}>{name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl sx={{ minWidth: 160 }} size="small">
            <InputLabel>Solutions Engineer</InputLabel>
            <Select
              value={selectedSE}
              onChange={e => setSelectedSE(e.target.value)}
              label="Solutions Engineer"
            >
              <MenuItem value=""><em>All</em></MenuItem>
              {SE_OPTIONS.map(name => (
                <MenuItem key={name} value={name}>{name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl sx={{ minWidth: 120 }} size="small">
            <InputLabel>Tier</InputLabel>
            <Select
              value={selectedTier}
              onChange={e => setSelectedTier(e.target.value)}
              label="Tier"
            >
              <MenuItem value=""><em>All</em></MenuItem>
              {TIER_OPTIONS.map(name => (
                <MenuItem key={name} value={name}>{name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl sx={{ minWidth: 120 }} size="small">
            <InputLabel>Health</InputLabel>
            <Select
              value={selectedHealth}
              onChange={e => setSelectedHealth(e.target.value)}
              label="Health"
            >
              <MenuItem value=""><em>All</em></MenuItem>
              {HEALTH_OPTIONS.map(name => (
                <MenuItem key={name} value={name}>{name}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Box>

      {/* Results Summary */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="body2" color="text.secondary">
          Showing data for {filteredAccounts.length} of {rawAccounts.length} accounts
          {search && ` (filtered by "${search}")`}
        </Typography>
      </Box>

      {/* Key Performance Indicators */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Total ARR"
            value={`$${(() => { const n = Number(metrics?.revenueMetrics?.monthlyRecurring); return Number.isFinite(n) ? n : 0; })().toLocaleString()}`}
            subtitle="Annual recurring revenue"
            icon={<RevenueIcon />}
            color="success"
            trend={{ value: metrics?.revenueMetrics.growthRate || 0, isPositive: true }}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Active Accounts"
            value={metrics?.operationalMetrics.activeAccountsByStatus ?? 0}
            subtitle={`${metrics?.operationalMetrics.totalAccounts ?? 0} total accounts`}
            icon={<BusinessIcon />}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Team Performance"
            value={`${Math.round(metrics?.operationalMetrics.taskCompletionRate || 0)}%`}
            subtitle="Task completion rate"
            icon={<PeopleIcon />}
            color="secondary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="At Risk Accounts"
            value={metrics?.operationalMetrics.atRiskAccounts || 0}
            subtitle="Need immediate attention"
            icon={<WarningIcon />}
            color="warning"
          />
        </Grid>
      </Grid>

      {/* Charts and Analytics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Account Health Distribution */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Account Health Distribution
              </Typography>
              <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Doughnut
                  data={{
                    labels: ['Healthy', 'At Risk', 'Critical'],
                    datasets: [
                      {
                        data: [
                          metrics?.operationalMetrics.healthyAccounts || 0,
                          metrics?.operationalMetrics.atRiskAccounts || 0,
                          metrics?.operationalMetrics.criticalAccounts || 0
                        ],
                        backgroundColor: ['#4caf50', '#ff9800', '#f44336'],
                      },
                    ],
                  }}
                  options={chartOptions}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Top Performers */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Top Performers
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell align="right">Tasks</TableCell>
                      <TableCell align="right">Accounts</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {metrics?.teamMetrics.topPerformers.map((performer, index) => (
                      <TableRow key={index}>
                        <TableCell>{performer.name}</TableCell>
                        <TableCell align="right">
                          <Chip 
                            label={performer.completedTasks} 
                            size="small" 
                            color="success" 
                          />
                        </TableCell>
                        <TableCell align="right">{performer.accountsManaged}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Operational Metrics */}
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Operational Metrics
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={4}>
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Task Completion Rate</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {Math.round(metrics?.operationalMetrics.taskCompletionRate || 0)}%
                      </Typography>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={metrics?.operationalMetrics.taskCompletionRate || 0}
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                  </Box>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Ticket Resolution Rate</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {metrics?.operationalMetrics.ticketResolutionRate}%
                      </Typography>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={metrics?.operationalMetrics.ticketResolutionRate || 0}
                      color="success"
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                  </Box>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Average Response Time</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {metrics?.operationalMetrics.averageResponseTime}h
                      </Typography>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={85} // Convert hours to percentage for visualization
                      color="warning"
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ManagementDashboard;