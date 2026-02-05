import React, { useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Checkbox,
  FormControlLabel,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Typography,
  Alert,
  Chip,
  Grid,
  Divider
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
  CheckBox as CheckBoxIcon,
  CheckBoxOutlineBlank as CheckBoxOutlineBlankIcon
} from '@mui/icons-material';
import { Account, AccountTier } from '../types';
import { apiService } from '../services/api';

interface BulkAccountOperationsProps {
  accounts: Account[];
  accountTiers: AccountTier[];
  onAccountsUpdated: () => void;
}

const BulkAccountOperations: React.FC<BulkAccountOperationsProps> = ({
  accounts,
  accountTiers,
  onAccountsUpdated
}) => {
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  const [bulkEditDialog, setBulkEditDialog] = useState(false);
  const [bulkDeleteDialog, setBulkDeleteDialog] = useState(false);
  const [bulkImportDialog, setBulkImportDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Bulk edit form state
  const [bulkEditForm, setBulkEditForm] = useState({
    tierId: '',
    status: '',
    health: '' as string | number,
    accountManager: '',
    customerSuccessManager: '',
    salesEngineer: ''
  });

  // Import state
  const [importData, setImportData] = useState('');

  const handleSelectAll = () => {
    if (selectedAccounts.length === accounts.length) {
      setSelectedAccounts([]);
    } else {
      setSelectedAccounts(accounts.map(account => account.id));
    }
  };

  const handleSelectAccount = (accountId: string) => {
    setSelectedAccounts(prev => 
      prev.includes(accountId) 
        ? prev.filter(id => id !== accountId)
        : [...prev, accountId]
    );
  };

  const handleBulkEdit = async () => {
    if (selectedAccounts.length === 0) {
      setMessage({ type: 'error', text: 'Please select accounts to edit' });
      return;
    }

    setLoading(true);
    try {
      const updates: Partial<Account> = {};
      
      // Only include fields that have values
      if (bulkEditForm.tierId) updates.tierId = bulkEditForm.tierId;
      if (bulkEditForm.status) updates.status = bulkEditForm.status as any;
      const healthNum = bulkEditForm.health === '' ? undefined : Number(bulkEditForm.health);
      if (healthNum !== undefined && !Number.isNaN(healthNum)) updates.health = Math.min(100, Math.max(0, healthNum));
      if (bulkEditForm.accountManager) updates.accountManager = bulkEditForm.accountManager;
      if (bulkEditForm.customerSuccessManager) updates.customerSuccessManager = bulkEditForm.customerSuccessManager;
      if (bulkEditForm.salesEngineer) updates.salesEngineer = bulkEditForm.salesEngineer;

      if (Object.keys(updates).length === 0) {
        setMessage({ type: 'error', text: 'Please provide at least one field to update' });
        return;
      }

      const result = await apiService.bulkUpdateAccounts(selectedAccounts, updates);
      
      setMessage({ 
        type: 'success', 
        text: `Successfully updated ${result.affectedCount} accounts` 
      });
      
      setBulkEditDialog(false);
      setSelectedAccounts([]);
      setBulkEditForm({
        tierId: '',
        status: '',
        health: '',
        accountManager: '',
        customerSuccessManager: '',
        salesEngineer: ''
      });
      
      onAccountsUpdated();
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Failed to update accounts' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedAccounts.length === 0) {
      setMessage({ type: 'error', text: 'Please select accounts to delete' });
      return;
    }

    setLoading(true);
    try {
      const result = await apiService.bulkDeleteAccounts(selectedAccounts);
      
      setMessage({ 
        type: 'success', 
        text: `Successfully deleted ${result.deletedCount} accounts` 
      });
      
      setBulkDeleteDialog(false);
      setSelectedAccounts([]);
      onAccountsUpdated();
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Failed to delete accounts' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBulkExport = async (format: 'json' | 'csv' = 'json') => {
    try {
      const data = await apiService.bulkExportAccounts(
        selectedAccounts.length > 0 ? selectedAccounts : undefined,
        format
      );

      if (format === 'csv') {
        // Create and download CSV file
        const blob = new Blob([data], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `accounts-export-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        // Download JSON file
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `accounts-export-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }

      setMessage({ 
        type: 'success', 
        text: `Successfully exported ${selectedAccounts.length || accounts.length} accounts` 
      });
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Failed to export accounts' 
      });
    }
  };

  const handleBulkImport = async () => {
    if (!importData.trim()) {
      setMessage({ type: 'error', text: 'Please provide import data' });
      return;
    }

    setLoading(true);
    try {
      let accounts: Partial<Account>[];
      
      try {
        accounts = JSON.parse(importData);
        if (!Array.isArray(accounts)) {
          throw new Error('Data must be an array of accounts');
        }
      } catch (parseError) {
        setMessage({ type: 'error', text: 'Invalid JSON format' });
        return;
      }

      const result = await apiService.bulkImportAccounts(accounts);
      
      setMessage({ 
        type: 'success', 
        text: `Import completed: ${result.results.created} created, ${result.results.updated} updated` 
      });
      
      setBulkImportDialog(false);
      setImportData('');
      onAccountsUpdated();
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Failed to import accounts' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      {/* Message Display */}
      {message && (
        <Alert 
          severity={message.type} 
          onClose={() => setMessage(null)}
          sx={{ mb: 2 }}
        >
          {message.text}
        </Alert>
      )}

      {/* Selection Controls */}
      <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
        <FormControlLabel
          control={
            <Checkbox
              checked={selectedAccounts.length === accounts.length && accounts.length > 0}
              indeterminate={selectedAccounts.length > 0 && selectedAccounts.length < accounts.length}
              onChange={handleSelectAll}
              icon={<CheckBoxOutlineBlankIcon />}
              checkedIcon={<CheckBoxIcon />}
            />
          }
          label={`Select All (${selectedAccounts.length}/${accounts.length})`}
        />

        {selectedAccounts.length > 0 && (
          <>
            <Divider orientation="vertical" flexItem />
            <Typography variant="body2" color="text.secondary">
              {selectedAccounts.length} account(s) selected
            </Typography>
          </>
        )}
      </Box>

      {/* Bulk Operation Buttons */}
      {selectedAccounts.length > 0 && (
        <Box sx={{ mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            startIcon={<EditIcon />}
            onClick={() => setBulkEditDialog(true)}
            disabled={loading}
          >
            Bulk Edit ({selectedAccounts.length})
          </Button>
          
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={() => setBulkDeleteDialog(true)}
            disabled={loading}
          >
            Bulk Delete ({selectedAccounts.length})
          </Button>
          
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={() => handleBulkExport('csv')}
            disabled={loading}
          >
            Export Selected (CSV)
          </Button>
        </Box>
      )}

      {/* Global Export/Import */}
      <Box sx={{ mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        <Button
          variant="outlined"
          startIcon={<DownloadIcon />}
          onClick={() => handleBulkExport('json')}
          disabled={loading}
        >
          Export All (JSON)
        </Button>
        
        <Button
          variant="outlined"
          startIcon={<UploadIcon />}
          onClick={() => setBulkImportDialog(true)}
          disabled={loading}
        >
          Import Accounts
        </Button>
      </Box>

      {/* Account Selection List */}
      <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
        {accounts.map((account) => (
          <Box
            key={account.id}
            sx={{
              display: 'flex',
              alignItems: 'center',
              p: 1,
              border: '1px solid',
              borderColor: selectedAccounts.includes(account.id) ? 'primary.main' : 'divider',
              borderRadius: 1,
              mb: 1,
              backgroundColor: selectedAccounts.includes(account.id) ? 'primary.50' : 'background.paper'
            }}
          >
            <Checkbox
              checked={selectedAccounts.includes(account.id)}
              onChange={() => handleSelectAccount(account.id)}
            />
            <Box sx={{ flex: 1, ml: 1 }}>
              <Typography variant="subtitle2">{account.name}</Typography>
              <Typography variant="body2" color="text.secondary">
                {account.email} • {account.industry} • Health: {account.health}
              </Typography>
            </Box>
            <Chip 
              label={account.status} 
              size="small" 
              color={account.status === 'active' ? 'success' : 'default'}
            />
          </Box>
        ))}
      </Box>

      {/* Bulk Edit Dialog */}
      <Dialog open={bulkEditDialog} onClose={() => setBulkEditDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Bulk Edit Accounts</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Update {selectedAccounts.length} selected accounts
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Account Tier</InputLabel>
                <Select
                  value={bulkEditForm.tierId}
                  onChange={(e) => setBulkEditForm(prev => ({ ...prev, tierId: e.target.value }))}
                  label="Account Tier"
                >
                  <MenuItem value="">No Change</MenuItem>
                  {accountTiers.map((tier) => (
                    <MenuItem key={tier.id} value={tier.id}>
                      {tier.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={bulkEditForm.status}
                  onChange={(e) => setBulkEditForm(prev => ({ ...prev, status: e.target.value }))}
                  label="Status"
                >
                  <MenuItem value="">No Change</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="at-risk">At Risk</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                type="number"
                inputProps={{ min: 0, max: 100 }}
                label="Set health (0–100)"
                value={bulkEditForm.health}
                onChange={(e) => setBulkEditForm(prev => ({ ...prev, health: e.target.value }))}
                placeholder="Leave empty for no change"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Account Manager"
                value={bulkEditForm.accountManager}
                onChange={(e) => setBulkEditForm(prev => ({ ...prev, accountManager: e.target.value }))}
                placeholder="Leave empty for no change"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Reassign CSM (Customer Success Manager)"
                value={bulkEditForm.customerSuccessManager}
                onChange={(e) => setBulkEditForm(prev => ({ ...prev, customerSuccessManager: e.target.value }))}
                placeholder="Leave empty for no change"
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Sales Engineer"
                value={bulkEditForm.salesEngineer}
                onChange={(e) => setBulkEditForm(prev => ({ ...prev, salesEngineer: e.target.value }))}
                placeholder="Leave empty for no change"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkEditDialog(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleBulkEdit} variant="contained" disabled={loading}>
            {loading ? 'Updating...' : 'Update Accounts'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Delete Dialog */}
      <Dialog open={bulkDeleteDialog} onClose={() => setBulkDeleteDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Confirm Bulk Delete</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            This action cannot be undone. You are about to delete {selectedAccounts.length} account(s).
          </Alert>
          <Typography variant="body2">
            Are you sure you want to delete the selected accounts? This will also remove all associated contacts, tasks, and notes.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkDeleteDialog(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleBulkDelete} variant="contained" color="error" disabled={loading}>
            {loading ? 'Deleting...' : 'Delete Accounts'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Import Dialog */}
      <Dialog open={bulkImportDialog} onClose={() => setBulkImportDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Import Accounts</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Paste JSON array of accounts to import. Include 'id' field to update existing accounts.
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={10}
            value={importData}
            onChange={(e) => setImportData(e.target.value)}
            placeholder='[{"name": "Account Name", "email": "contact@account.com", ...}]'
            variant="outlined"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkImportDialog(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleBulkImport} variant="contained" disabled={loading}>
            {loading ? 'Importing...' : 'Import Accounts'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BulkAccountOperations; 