import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  LinearProgress,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider,
  Alert,
  CircularProgress,
  Fab,
  Badge,
  Tooltip,
  IconButton
} from '@mui/material';
import {
  Assignment as TaskIcon,
  Comment as CommentIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
  Add as AddIcon,
  Send as SendIcon,
  AttachFile as AttachFileIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { format } from 'date-fns';

interface Task {
  id: string;
  title: string;
  description: string;
  status: 'To Do' | 'In Progress' | 'Completed' | 'Cancelled';
  priority: 'Low' | 'Medium' | 'High';
  dueDate: string;
  progress: number;
  assignedTo: string[];
  assignedToClient: string[];
  accountId: string;
  accountName: string;
  createdAt: string;
  updatedAt: string;
  comments: Comment[];
}

interface Comment {
  id: string;
  content: string;
  authorType: 'internal' | 'external';
  authorName: string;
  authorEmail: string;
  createdAt: string;
  attachments?: Array<{
    filename: string;
    originalName: string;
    url: string;
  }>;
}

interface PortalDashboardProps {
  contact: any;
  onLogout: () => void;
}

const PortalDashboard: React.FC<PortalDashboardProps> = ({ contact, onLogout }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [commentDialogOpen, setCommentDialogOpen] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('portalToken');
      const response = await fetch('/api/portal/tasks', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch tasks');
      }

      const data = await response.json();
      setTasks(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const updateTaskStatus = async (taskId: string, status: string) => {
    try {
      const token = localStorage.getItem('portalToken');
      const response = await fetch(`/api/portal/tasks/${taskId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        throw new Error('Failed to update task status');
      }

      await fetchTasks();
      if (selectedTask && selectedTask.id === taskId) {
        setSelectedTask(prev => prev ? { ...prev, status: status as any } : null);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update task status');
    }
  };

  const addComment = async () => {
    if (!selectedTask || !newComment.trim()) return;

    try {
      setSubmittingComment(true);
      const token = localStorage.getItem('portalToken');
      const response = await fetch(`/api/portal/tasks/${selectedTask.id}/comments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: newComment }),
      });

      if (!response.ok) {
        throw new Error('Failed to add comment');
      }

      setNewComment('');
      setCommentDialogOpen(false);
      await fetchTasks();
      
      // Update selected task with new comments
      const updatedTask = tasks.find(t => t.id === selectedTask.id);
      if (updatedTask) {
        setSelectedTask(updatedTask);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to add comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'To Do': return 'default';
      case 'In Progress': return 'warning';
      case 'Completed': return 'success';
      case 'Cancelled': return 'error';
      default: return 'default';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'error';
      case 'Medium': return 'warning';
      case 'Low': return 'success';
      default: return 'default';
    }
  };

  const openTaskDetails = (task: Task) => {
    setSelectedTask(task);
    setTaskDialogOpen(true);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      {/* Header */}
      <Box sx={{ 
        backgroundColor: 'white', 
        borderBottom: '1px solid #e0e0e0',
        p: 3,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
            Client Portal
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Welcome back, {contact.firstName} {contact.lastName}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Tooltip title="Refresh Tasks">
            <IconButton onClick={fetchTasks}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Button variant="outlined" onClick={onLogout}>
            Logout
          </Button>
        </Box>
      </Box>

      <Box sx={{ p: 3 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Summary Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={4}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: 'primary.light' }}>
                    <TaskIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                      {tasks.length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Tasks
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: 'warning.light' }}>
                    <ScheduleIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                      {tasks.filter(t => t.status === 'In Progress').length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      In Progress
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: 'success.light' }}>
                    <CheckCircleIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                      {tasks.filter(t => t.status === 'Completed').length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Completed
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Tasks List */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              Your Tasks
            </Typography>
            
            {tasks.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body1" color="text.secondary">
                  No tasks assigned to you at the moment.
                </Typography>
              </Box>
            ) : (
              <Grid container spacing={2}>
                {tasks.map((task) => (
                  <Grid item xs={12} md={6} lg={4} key={task.id}>
                    <Card 
                      sx={{ 
                        cursor: 'pointer',
                        '&:hover': { boxShadow: 4 },
                        transition: 'box-shadow 0.2s'
                      }}
                      onClick={() => openTaskDetails(task)}
                    >
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                          <Typography variant="h6" sx={{ fontWeight: 600, flex: 1 }}>
                            {task.title}
                          </Typography>
                          {task.comments && task.comments.length > 0 && (
                            <Badge badgeContent={task.comments.length} color="primary">
                              <CommentIcon />
                            </Badge>
                          )}
                        </Box>
                        
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          {task.description.length > 100 
                            ? `${task.description.substring(0, 100)}...` 
                            : task.description}
                        </Typography>

                        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                          <Chip 
                            label={task.status} 
                            color={getStatusColor(task.status) as any}
                            size="small"
                          />
                          <Chip 
                            label={task.priority} 
                            color={getPriorityColor(task.priority) as any}
                            size="small"
                            variant="outlined"
                          />
                        </Box>

                        <Box sx={{ mb: 2 }}>
                          <Typography variant="caption" color="text.secondary">
                            Progress: {task.progress}%
                          </Typography>
                          <LinearProgress 
                            variant="determinate" 
                            value={task.progress} 
                            sx={{ mt: 0.5 }}
                          />
                        </Box>

                        <Typography variant="caption" color="text.secondary">
                          Due: {format(new Date(task.dueDate), 'MMM dd, yyyy')}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </CardContent>
        </Card>
      </Box>

      {/* Task Details Dialog */}
      <Dialog 
        open={taskDialogOpen} 
        onClose={() => setTaskDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        {selectedTask && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {selectedTask.title}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Chip 
                    label={selectedTask.status} 
                    color={getStatusColor(selectedTask.status) as any}
                    size="small"
                  />
                  <Chip 
                    label={selectedTask.priority} 
                    color={getPriorityColor(selectedTask.priority) as any}
                    size="small"
                    variant="outlined"
                  />
                </Box>
              </Box>
            </DialogTitle>
            <DialogContent>
              <Typography variant="body1" sx={{ mb: 3 }}>
                {selectedTask.description}
              </Typography>

              <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Due Date
                  </Typography>
                  <Typography variant="body1">
                    {format(new Date(selectedTask.dueDate), 'MMM dd, yyyy')}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Progress
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LinearProgress 
                      variant="determinate" 
                      value={selectedTask.progress} 
                      sx={{ flex: 1 }}
                    />
                    <Typography variant="body2">
                      {selectedTask.progress}%
                    </Typography>
                  </Box>
                </Grid>
              </Grid>

              {/* Status Update */}
              {selectedTask.status !== 'Completed' && selectedTask.status !== 'Cancelled' && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Update Status
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    {selectedTask.status === 'To Do' && (
                      <Button
                        variant="contained"
                        color="warning"
                        onClick={() => updateTaskStatus(selectedTask.id, 'In Progress')}
                      >
                        Start Task
                      </Button>
                    )}
                    {selectedTask.status === 'In Progress' && (
                      <Button
                        variant="contained"
                        color="success"
                        onClick={() => updateTaskStatus(selectedTask.id, 'Completed')}
                      >
                        Mark Complete
                      </Button>
                    )}
                  </Box>
                </Box>
              )}

              {/* Comments Section */}
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="subtitle2">
                    Comments ({selectedTask.comments?.length || 0})
                  </Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<AddIcon />}
                    onClick={() => setCommentDialogOpen(true)}
                  >
                    Add Comment
                  </Button>
                </Box>

                {selectedTask.comments && selectedTask.comments.length > 0 ? (
                  <List sx={{ maxHeight: 300, overflow: 'auto' }}>
                    {selectedTask.comments.map((comment, index) => (
                      <React.Fragment key={comment.id}>
                        <ListItem alignItems="flex-start" sx={{ px: 0 }}>
                          <ListItemAvatar>
                            <Avatar>
                              {comment.authorType === 'external' ? <PersonIcon /> : <CommentIcon />}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                  {comment.authorName}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {format(new Date(comment.createdAt), 'MMM dd, yyyy HH:mm')}
                                </Typography>
                              </Box>
                            }
                            secondary={
                              <Typography variant="body2" sx={{ mt: 1 }}>
                                {comment.content}
                              </Typography>
                            }
                          />
                        </ListItem>
                        {index < selectedTask.comments.length - 1 && <Divider />}
                      </React.Fragment>
                    ))}
                  </List>
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                    No comments yet. Be the first to add a comment!
                  </Typography>
                )}
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setTaskDialogOpen(false)}>
                Close
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Add Comment Dialog */}
      <Dialog 
        open={commentDialogOpen} 
        onClose={() => setCommentDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add Comment</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Your comment"
            fullWidth
            multiline
            rows={4}
            variant="outlined"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Share updates, ask questions, or provide feedback..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCommentDialogOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={addComment}
            variant="contained"
            disabled={!newComment.trim() || submittingComment}
            startIcon={submittingComment ? <CircularProgress size={16} /> : <SendIcon />}
          >
            {submittingComment ? 'Posting...' : 'Post Comment'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PortalDashboard;