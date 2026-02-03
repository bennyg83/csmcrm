import React, { useEffect, useState } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  LinearProgress,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
  Button,
  Alert,
  Skeleton
} from '@mui/material';
import {
  Assignment as TaskIcon,
  CheckCircle as CompletedIcon,
  Schedule as PendingIcon,
  Warning as OverdueIcon,
  TrendingUp as ProgressIcon,
  Business as AccountIcon,
  CalendarToday as CalendarIcon,
  Assessment as HealthIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';

interface TaskStats {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  overdueTasks: number;
  averageProgress: number;
  completionRate: number;
}

interface AccountOverview {
  id: string;
  name: string;
  industry: string;
  status: string;
  health: number;
  renewalDate: string;
}

interface RecentTask {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate: string;
  progress: number;
}

export const ClientDashboardPage: React.FC = () => {
  const [stats, setStats] = useState<TaskStats | null>(null);
  const [accountOverview, setAccountOverview] = useState<AccountOverview | null>(null);
  const [recentTasks, setRecentTasks] = useState<RecentTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch task statistics
        const statsResponse = await apiService.get('/external/tasks/stats');
        setStats(statsResponse.data);
        
        // Fetch account overview
        const accountResponse = await apiService.get('/external/account/overview');
        setAccountOverview(accountResponse.data.account);
        setRecentTasks(accountResponse.data.recentTasks);
        
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'in_progress': return 'primary';
      case 'pending': return 'warning';
      case 'overdue': return 'error';
      default: return 'default';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const handleViewAllTasks = () => {
    navigate('/client/tasks');
  };

  const handleViewTask = (taskId: string) => {
    navigate(`/client/tasks/${taskId}`);
  };

  if (loading) {
    return (
      <Box>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Skeleton variant="rectangular" height={200} />
          </Grid>
          <Grid item xs={12} md={4}>
            <Skeleton variant="rectangular" height={200} />
          </Grid>
          <Grid item xs={12}>
            <Skeleton variant="rectangular" height={300} />
          </Grid>
        </Grid>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Welcome back, {user?.firstName}!
      </Typography>
      
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Here's an overview of your account and tasks
      </Typography>

      <Grid container spacing={3}>
        {/* Task Statistics */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6">
                Task Overview
              </Typography>
              <Button variant="outlined" onClick={handleViewAllTasks}>
                View All Tasks
              </Button>
            </Box>
            
            <Grid container spacing={2}>
              <Grid item xs={6} sm={3}>
                <Card sx={{ textAlign: 'center' }}>
                  <CardContent>
                    <Typography variant="h4" color="primary">
                      {stats?.totalTasks || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Tasks
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={6} sm={3}>
                <Card sx={{ textAlign: 'center' }}>
                  <CardContent>
                    <Typography variant="h4" color="success.main">
                      {stats?.completedTasks || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Completed
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={6} sm={3}>
                <Card sx={{ textAlign: 'center' }}>
                  <CardContent>
                    <Typography variant="h4" color="warning.main">
                      {stats?.inProgressTasks || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      In Progress
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={6} sm={3}>
                <Card sx={{ textAlign: 'center' }}>
                  <CardContent>
                    <Typography variant="h4" color="error.main">
                      {stats?.overdueTasks || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Overdue
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            <Box sx={{ mt: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="body2">Overall Progress</Typography>
                <Typography variant="body2">{stats?.averageProgress || 0}%</Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={stats?.averageProgress || 0} 
                sx={{ height: 8, borderRadius: 4 }}
              />
            </Box>
          </Paper>
        </Grid>

        {/* Account Overview */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <AccountIcon sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="h6">Account Info</Typography>
            </Box>
            
            {accountOverview && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  {accountOverview.name}
                </Typography>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Industry: {accountOverview.industry}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Status: <Chip label={accountOverview.status} size="small" color="primary" />
                  </Typography>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <HealthIcon sx={{ mr: 1, fontSize: 16 }} />
                    <Typography variant="body2">Health Score</Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={accountOverview.health} 
                    color={accountOverview.health > 70 ? 'success' : accountOverview.health > 40 ? 'warning' : 'error'}
                    sx={{ height: 6, borderRadius: 3 }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    {accountOverview.health}/100
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <CalendarIcon sx={{ mr: 1, fontSize: 16 }} />
                  <Typography variant="body2" color="text.secondary">
                    Renewal: {formatDate(accountOverview.renewalDate)}
                  </Typography>
                </Box>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Recent Tasks */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Recent Tasks
            </Typography>
            
            {recentTasks.length > 0 ? (
              <List>
                {recentTasks.map((task) => (
                  <ListItem 
                    key={task.id} 
                    button 
                    onClick={() => handleViewTask(task.id)}
                    sx={{ border: 1, borderColor: 'divider', borderRadius: 1, mb: 1 }}
                  >
                    <ListItemIcon>
                      <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
                        <TaskIcon fontSize="small" />
                      </Avatar>
                    </ListItemIcon>
                    
                    <ListItemText
                      primary={task.title}
                      secondary={
                        <Box>
                          <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                            <Chip 
                              label={task.status} 
                              size="small" 
                              color={getStatusColor(task.status) as any}
                            />
                            <Chip 
                              label={task.priority} 
                              size="small" 
                              color={getPriorityColor(task.priority) as any}
                            />
                            <Typography variant="caption" color="text.secondary">
                              Due: {formatDate(task.dueDate)}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <ProgressIcon sx={{ fontSize: 16 }} />
                            <Typography variant="caption">
                              Progress: {task.progress}%
                            </Typography>
                          </Box>
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <TaskIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                <Typography variant="body1" color="text.secondary">
                  No tasks assigned yet
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Tasks will appear here once they're assigned to you
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};
