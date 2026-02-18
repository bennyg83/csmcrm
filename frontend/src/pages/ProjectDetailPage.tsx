import React, { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Alert,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import FlagIcon from '@mui/icons-material/Flag';
import PeopleIcon from '@mui/icons-material/People';
import AssignmentIcon from '@mui/icons-material/Assignment';
import AddIcon from '@mui/icons-material/Add';
import { useNavigate, useParams } from 'react-router-dom';
import { apiService } from '../services/api';

const PROJECT_STATUSES = ['Planning', 'Active', 'On Hold', 'Completed', 'Cancelled'] as const;

const ProjectDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<any>(null);
  const [milestones, setMilestones] = useState<any[]>([]);
  const [projectContacts, setProjectContacts] = useState<any[]>([]);
  const [projectTasks, setProjectTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', description: '', status: 'Planning' as const });
  const [addTaskOpen, setAddTaskOpen] = useState(false);
  const [addTaskForm, setAddTaskForm] = useState<{ title: string; dueDate: string; priority: 'Low' | 'Medium' | 'High' }>({ title: '', dueDate: '', priority: 'Medium' });
  const [addTaskSaving, setAddTaskSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [proj, miles, contacts, tasks] = await Promise.all([
          apiService.getProject(id),
          apiService.getProjectMilestones(id),
          apiService.getProjectContacts(id),
          apiService.getTasks({ projectId: id }),
        ]);
        setProject(proj);
        setMilestones(miles || []);
        setProjectContacts(contacts || []);
        setProjectTasks(tasks || []);
        setEditForm({
          name: proj.name || '',
          description: proj.description || '',
          status: (proj.status || 'Planning') as typeof editForm.status,
        });
      } catch (e) {
        console.error(e);
        setError('Failed to load project');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleSaveEdit = async () => {
    if (!id) return;
    setSaving(true);
    try {
      const updated = await apiService.updateProject(id, {
        name: editForm.name,
        description: editForm.description,
        status: editForm.status,
      });
      setProject(updated);
      setEditOpen(false);
    } catch {
      setError('Failed to update project');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    setSaving(true);
    try {
      await apiService.deleteProject(id);
      setDeleteConfirmOpen(false);
      navigate('/projects');
    } catch {
      setError('Failed to delete project');
    } finally {
      setSaving(false);
    }
  };

  const handleAddTask = async () => {
    if (!id || !project || !addTaskForm.title.trim() || !addTaskForm.dueDate) return;
    setAddTaskSaving(true);
    try {
      await apiService.createTask({
        title: addTaskForm.title.trim(),
        description: `Task for project ${project.name}`,
        status: 'To Do',
        priority: addTaskForm.priority,
        dueDate: addTaskForm.dueDate,
        projectId: id,
        accountId: project.accountId || project.account?.id,
        accountName: project.account?.name || '',
        assignedTo: [],
        subTasks: [],
        dependencies: [],
        isDependent: false,
        progress: 0,
      });
      const tasks = await apiService.getTasks({ projectId: id });
      setProjectTasks(tasks || []);
      setAddTaskOpen(false);
      setAddTaskForm({ title: '', dueDate: '', priority: 'Medium' });
    } catch {
      setError('Failed to create task');
    } finally {
      setAddTaskSaving(false);
    }
  };

  const formatDate = (d: string | Date | null | undefined) =>
    d ? new Date(d).toLocaleDateString() : '—';

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (error || !project) {
    return (
      <Box>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/projects')} sx={{ mb: 2 }}>
          Back to projects
        </Button>
        <Alert severity="error">{error || 'Project not found'}</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/projects')}>
          Projects
        </Button>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
              <FolderOpenIcon color="primary" sx={{ fontSize: 32 }} />
              <Box>
                <Typography variant="h4" gutterBottom>
                  {project.name}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                  <Chip label={project.type} color="primary" variant="outlined" size="small" />
                  <Chip label={project.status} size="small" />
                  {project.account && (
                    <Chip
                      label={project.account.name}
                      size="small"
                      variant="outlined"
                      onClick={() => project.accountId && navigate(`/accounts/${project.accountId}`)}
                      sx={{ cursor: 'pointer' }}
                    />
                  )}
                </Box>
                {(project.startDate || project.targetDate) && (
                  <Typography variant="body2" color="text.secondary">
                    {project.startDate && `Start: ${formatDate(project.startDate)}`}
                    {project.startDate && project.targetDate && ' · '}
                    {project.targetDate && `Target: ${formatDate(project.targetDate)}`}
                  </Typography>
                )}
              </Box>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                size="small"
                startIcon={<EditIcon />}
                onClick={() => setEditOpen(true)}
              >
                Edit
              </Button>
              <Button
                variant="outlined"
                color="error"
                size="small"
                startIcon={<DeleteIcon />}
                onClick={() => setDeleteConfirmOpen(true)}
              >
                Delete
              </Button>
            </Box>
          </Box>
          {project.description && (
            <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
              {project.description}
            </Typography>
          )}
        </CardContent>
      </Card>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <FlagIcon fontSize="small" /> Milestones
            </Typography>
            {milestones.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No milestones yet.
              </Typography>
            ) : (
              <List dense disablePadding>
                {milestones.map((m) => (
                  <ListItem key={m.id} divider>
                    <ListItemText
                      primary={m.name}
                      secondary={
                        <>
                          {formatDate(m.dueDate)} · <Chip size="small" label={m.status || 'Pending'} sx={{ ml: 0.5 }} />
                        </>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <PeopleIcon fontSize="small" /> Project contacts
            </Typography>
            {projectContacts.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No contacts linked.
              </Typography>
            ) : (
              <List dense disablePadding>
                {projectContacts.map((pc) => (
                  <ListItem key={pc.id} divider>
                    <ListItemText
                      primary={pc.contact?.firstName != null ? `${pc.contact.firstName} ${pc.contact.lastName}` : pc.user?.name || 'Unknown'}
                      secondary={pc.role && `Role: ${pc.role}`}
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </CardContent>
        </Card>
      </Box>

      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1, mb: 1 }}>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AssignmentIcon fontSize="small" /> Tasks ({projectTasks.length})
            </Typography>
            <Button
              size="small"
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => {
                setAddTaskForm({
                  title: '',
                  dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
                  priority: 'Medium',
                });
                setAddTaskOpen(true);
              }}
            >
              Add task
            </Button>
          </Box>
          {projectTasks.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No tasks linked to this project.
            </Typography>
          ) : (
            <List dense disablePadding>
              {projectTasks.map((t) => (
                <ListItem
                  key={t.id}
                  divider
                  sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
                  onClick={() => navigate(`/tasks/${t.id}`)}
                >
                  <ListItemText
                    primary={t.title}
                    secondary={
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 0.5 }}>
                        <Chip size="small" label={t.status} />
                        <Chip size="small" label={t.priority} variant="outlined" />
                        {t.dueDate && (
                          <Typography component="span" variant="caption" color="text.secondary">
                            Due: {formatDate(t.dueDate)}
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    <IconButton edge="end" size="small" onClick={(e) => { e.stopPropagation(); navigate(`/tasks/${t.id}`); }}>
                      Open
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          )}
        </CardContent>
      </Card>

      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit project</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Name"
            value={editForm.name}
            onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
            sx={{ mt: 1, mb: 2 }}
          />
          <TextField
            fullWidth
            label="Description"
            multiline
            rows={2}
            value={editForm.description}
            onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth>
            <InputLabel>Status</InputLabel>
            <Select
              value={editForm.status}
              label="Status"
              onChange={(e) => setEditForm((f) => ({ ...f, status: e.target.value as typeof editForm.status }))}
            >
              {PROJECT_STATUSES.map((s) => (
                <MenuItem key={s} value={s}>{s}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveEdit} disabled={saving || !editForm.name}>
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
        <DialogTitle>Delete project?</DialogTitle>
        <DialogContent>
          <Typography>
            Delete &quot;{project.name}&quot;? This cannot be undone. Tasks linked to this project will not be deleted.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDelete} disabled={saving}>
            {saving ? 'Deleting…' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={addTaskOpen} onClose={() => setAddTaskOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add task to project</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            This task will be linked to &quot;{project.name}&quot; and the account.
          </Typography>
          <TextField
            fullWidth
            size="small"
            label="Title"
            required
            value={addTaskForm.title}
            onChange={(e) => setAddTaskForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="Task title"
          />
          <TextField
            fullWidth
            size="small"
            label="Due date"
            type="datetime-local"
            value={addTaskForm.dueDate}
            onChange={(e) => setAddTaskForm((f) => ({ ...f, dueDate: e.target.value }))}
            InputLabelProps={{ shrink: true }}
          />
          <FormControl fullWidth size="small">
            <InputLabel>Priority</InputLabel>
            <Select
              value={addTaskForm.priority}
              label="Priority"
              onChange={(e) => setAddTaskForm((f) => ({ ...f, priority: e.target.value as 'Low' | 'Medium' | 'High' }))}
            >
              <MenuItem value="Low">Low</MenuItem>
              <MenuItem value="Medium">Medium</MenuItem>
              <MenuItem value="High">High</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddTaskOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleAddTask}
            disabled={!addTaskForm.title.trim() || !addTaskForm.dueDate || addTaskSaving}
          >
            {addTaskSaving ? 'Creating…' : 'Create task'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProjectDetailPage;
