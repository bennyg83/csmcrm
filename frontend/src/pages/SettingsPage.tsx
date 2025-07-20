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
  Category as CategoryIcon
} from '@mui/icons-material';
import { apiService } from '../services/api';
import { AccountTier } from '../types';
import UserManagement from '../components/UserManagement';

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

  useEffect(() => {
    if (currentTab === 1) { // Account Tiers tab
      fetchTiers();
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
    </Box>
  );
};

export default SettingsPage; 