import React, { useState, useEffect } from 'react';
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
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Tooltip,
  Tabs,
  Tab
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Settings as SettingsIcon,
  People as PeopleIcon,
  Category as CategoryIcon,
  Security as SecurityIcon,
  Description as DescriptionIcon
} from '@mui/icons-material';
import { apiService } from '../services/api';
import { AccountTier, Template } from '../types';
import UserManagement from '../components/UserManagement';
import RBACManager from '../components/RBACManager';
import { forceLogout } from '../utils/forceLogout';

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
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const SettingsPage: React.FC = () => {
  const [currentTab, setCurrentTab] = useState(0);
  const [tiers, setTiers] = useState<AccountTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedTier, setSelectedTier] = useState<AccountTier | null>(null);
  const [editForm, setEditForm] = useState<Partial<AccountTier>>({});

  // Note templates (Phase 1 CSM – note type only)
  const [noteTemplates, setNoteTemplates] = useState<Template[]>([]);
  const [templateEditOpen, setTemplateEditOpen] = useState(false);
  const [templateDeleteOpen, setTemplateDeleteOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [templateForm, setTemplateForm] = useState({ name: '', body: '' });

  useEffect(() => {
    if (currentTab === 1) { // Account Tiers tab
      fetchTiers();
    } else if (currentTab === 3) { // Note templates tab
      apiService.getTemplates('note').then(setNoteTemplates).catch(() => setNoteTemplates([]));
    } else {
      // For User Management tab (currentTab === 0), set loading to false
      setLoading(false);
    }
  }, [currentTab]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  const fetchTiers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getAccountTiers();
      setTiers(data);
    } catch (err) {
      console.error('Error fetching tiers:', err);
      setError('Failed to load account tiers');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTier = () => {
    setEditForm({
      name: '',
      description: '',
      slaHours: 24
    });
    setSelectedTier(null);
    setEditOpen(true);
  };

  const handleEditTier = (tier: AccountTier) => {
    setEditForm({
      name: tier.name,
      description: tier.description,
      slaHours: tier.slaHours
    });
    setSelectedTier(tier);
    setEditOpen(true);
  };

  const handleDeleteTier = (tier: AccountTier) => {
    setSelectedTier(tier);
    setDeleteOpen(true);
  };

  const handleEditSave = async () => {
    try {
      if (selectedTier) {
        await apiService.updateAccountTier(selectedTier.id, editForm);
      } else {
        await apiService.createAccountTier(editForm);
      }
      setEditOpen(false);
      fetchTiers();
    } catch (err) {
      alert('Failed to save tier');
    }
  };

  const handleDeleteConfirm = async () => {
    if (selectedTier) {
      try {
        await apiService.deleteAccountTier(selectedTier.id);
        setDeleteOpen(false);
        fetchTiers();
      } catch (err) {
        alert('Failed to delete tier');
      }
    }
  };

  const handleAddTemplate = () => {
    setTemplateForm({ name: '', body: '' });
    setSelectedTemplate(null);
    setTemplateEditOpen(true);
  };

  const handleEditTemplate = (t: Template) => {
    setTemplateForm({ name: t.name, body: t.body });
    setSelectedTemplate(t);
    setTemplateEditOpen(true);
  };

  const handleTemplateSave = async () => {
    try {
      if (selectedTemplate) {
        await apiService.updateTemplate(selectedTemplate.id, templateForm);
      } else {
        await apiService.createTemplate({ ...templateForm, type: 'note' });
      }
      setTemplateEditOpen(false);
      const list = await apiService.getTemplates('note');
      setNoteTemplates(list);
    } catch (err) {
      alert('Failed to save template');
    }
  };

  const handleTemplateDeleteConfirm = async () => {
    if (selectedTemplate) {
      try {
        await apiService.deleteTemplate(selectedTemplate.id);
        setTemplateDeleteOpen(false);
        setSelectedTemplate(null);
        const list = await apiService.getTemplates('note');
        setNoteTemplates(list);
      } catch (err) {
        alert('Failed to delete template');
      }
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
          Settings
        </Typography>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h3" gutterBottom sx={{ fontWeight: 700 }}>
            <SettingsIcon sx={{ mr: 1, verticalAlign: 'bottom' }} />
            Settings
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage users, account tiers, and system configuration
          </Typography>
        </Box>
        <Button
          variant="outlined"
          color="error"
          onClick={forceLogout}
          sx={{ px: 3, py: 1, borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
        >
          Force Logout
        </Button>
      </Box>

      {/* Settings Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={currentTab} onChange={handleTabChange}>
          <Tab 
            icon={<PeopleIcon />} 
            label="User Management" 
            id="settings-tab-0"
            aria-controls="settings-tabpanel-0"
          />
          <Tab 
            icon={<CategoryIcon />} 
            label="Account Tiers" 
            id="settings-tab-1"
            aria-controls="settings-tabpanel-1"
          />
          <Tab 
            icon={<SecurityIcon />} 
            label="RBAC" 
            id="settings-tab-2"
            aria-controls="settings-tabpanel-2"
          />
          <Tab 
            icon={<DescriptionIcon />} 
            label="Note templates" 
            id="settings-tab-3"
            aria-controls="settings-tabpanel-3"
          />
        </Tabs>
      </Box>

      {/* User Management Tab */}
      <TabPanel value={currentTab} index={0}>
        <UserManagement />
      </TabPanel>

      {/* Account Tiers Tab */}
      <TabPanel value={currentTab} index={1}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            Account Tiers
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddTier}
            sx={{ px: 3, py: 1, borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
          >
            Add Tier
          </Button>
        </Box>
        
        <Paper>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem' }}>Name</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem' }}>Description</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem' }}>SLA Hours</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tiers.map((tier) => (
                  <TableRow key={tier.id} hover>
                    <TableCell>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        {tier.name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {tier.description || 'No description'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {tier.slaHours} hours
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Tooltip title="Edit Tier">
                          <IconButton size="small" onClick={() => handleEditTier(tier)}>
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete Tier">
                          <IconButton size="small" onClick={() => handleDeleteTier(tier)} color="error">
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </TabPanel>

      {/* RBAC Tab */}
      <TabPanel value={currentTab} index={2}>
        <RBACManager />
      </TabPanel>

      {/* Note templates Tab (Phase 1 CSM – note only, no email) */}
      <TabPanel value={currentTab} index={3}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            Note templates
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddTemplate}
            sx={{ px: 3, py: 1, borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
          >
            Add template
          </Button>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Templates can be inserted when adding a note on an account (Account detail → Add note → Insert template).
        </Typography>
        <Paper>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Body (preview)</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {noteTemplates.map((t) => (
                  <TableRow key={t.id} hover>
                    <TableCell>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{t.name}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: 400 }}>
                        {t.body?.slice(0, 80)}{(t.body?.length ?? 0) > 80 ? '…' : ''}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Tooltip title="Edit">
                        <IconButton size="small" onClick={() => handleEditTemplate(t)}>
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton size="small" onClick={() => { setSelectedTemplate(t); setTemplateDeleteOpen(true); }} color="error">
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
        {noteTemplates.length === 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            No note templates. Add one to use when adding notes on accounts.
          </Typography>
        )}
      </TabPanel>

      {/* Edit/Create Tier Modal */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedTier ? 'Edit Account Tier' : 'Create Account Tier'}
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <TextField
            label="Name"
            value={editForm.name || ''}
            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
            fullWidth
            size="small"
          />
          <TextField
            label="Description"
            value={editForm.description || ''}
            onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
            fullWidth
            size="small"
            multiline
            minRows={2}
          />
          <TextField
            label="SLA Hours"
            type="number"
            value={editForm.slaHours || ''}
            onChange={(e) => setEditForm({ ...editForm, slaHours: Number(e.target.value) })}
            fullWidth
            size="small"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)}>Cancel</Button>
          <Button onClick={handleEditSave} variant="contained">
            {selectedTier ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete Account Tier</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{selectedTier?.name}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} variant="contained" color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit/Create Note template Modal */}
      <Dialog open={templateEditOpen} onClose={() => setTemplateEditOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{selectedTemplate ? 'Edit note template' : 'Add note template'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <TextField
            label="Name"
            value={templateForm.name}
            onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
            fullWidth
            size="small"
            placeholder="e.g. QBR follow-up"
          />
          <TextField
            label="Body"
            value={templateForm.body}
            onChange={(e) => setTemplateForm({ ...templateForm, body: e.target.value })}
            fullWidth
            size="small"
            multiline
            minRows={4}
            placeholder="Template text inserted when adding a note..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTemplateEditOpen(false)}>Cancel</Button>
          <Button onClick={handleTemplateSave} variant="contained" disabled={!templateForm.name.trim()}>
            {selectedTemplate ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete note template confirmation */}
      <Dialog open={templateDeleteOpen} onClose={() => { setTemplateDeleteOpen(false); setSelectedTemplate(null); }} maxWidth="xs" fullWidth>
        <DialogTitle>Delete note template</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{selectedTemplate?.name}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setTemplateDeleteOpen(false); setSelectedTemplate(null); }}>Cancel</Button>
          <Button onClick={handleTemplateDeleteConfirm} variant="contained" color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SettingsPage; 