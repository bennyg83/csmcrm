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
  Chip, 
  CircularProgress, 
  Alert,
  Card,
  CardContent,
  Avatar,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { 
  Add as AddIcon,
  Business as BusinessIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
  Circle as CircleIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import { Account } from '../types';

const AccountsPage: React.FC = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addAccountOpen, setAddAccountOpen] = useState(false);
  const [addAccountForm, setAddAccountForm] = useState<Partial<Account>>({});
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await apiService.getAccounts();
        setAccounts(data);
      } catch (err) {
        console.error('Error fetching accounts:', err);
        setError('Failed to load accounts');
      } finally {
        setLoading(false);
      }
    };

    fetchAccounts();
  }, []);

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

  const handleAddAccount = () => {
    setAddAccountForm({
      name: '',
      email: '',
      phone: '',
      address: '',
      industry: '',
      website: '',
      description: '',
      businessUseCase: '',
      techStack: '',
      health: 75,
      revenue: 0,
      renewalDate: new Date().toISOString().slice(0, 10),
      arr: 0,
      riskScore: 50,
      accountManager: '',
      customerSuccessManager: '',
      salesEngineer: '',
      tierId: '', // This should be populated from available tiers
      status: 'active',
      employees: 0
    });
    setAddAccountOpen(true);
  };

  const handleAddAccountChange = (field: keyof Account, value: any) => {
    setAddAccountForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddAccountSave = async () => {
    try {
      const newAccount = await apiService.createAccount(addAccountForm);
      setAddAccountOpen(false);
      setAccounts((prev) => [newAccount, ...prev]);
      navigate(`/accounts/${newAccount.id}`);
    } catch (err) {
      alert('Failed to create account');
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
          Accounts
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
            Accounts
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage your customer accounts and relationships
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddAccount}
          sx={{ 
            px: 3, 
            py: 1.5,
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 600
          }}
        >
          Add Account
        </Button>
      </Box>
      
      {accounts.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 8 }}>
            <Avatar 
              sx={{ 
                width: 80, 
                height: 80, 
                bgcolor: 'primary.light', 
                color: 'primary.main',
                mx: 'auto',
                mb: 2
              }}
            >
              <BusinessIcon sx={{ fontSize: 40 }} />
            </Avatar>
            <Typography variant="h6" gutterBottom>
              No accounts found
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Create your first account to get started with customer relationship management.
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAddAccount}
              sx={{ 
                px: 3, 
                py: 1.5,
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600
              }}
            >
              Create First Account
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem' }}>Account</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem' }}>Industry</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem' }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem' }}>Health</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem' }}>Revenue</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem' }}>License ARR</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem' }}>Renewal</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem' }}>Employees</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem' }}>Account Manager</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {accounts.map((account) => (
                  <TableRow 
                    key={account.id} 
                    hover 
                    onClick={() => navigate(`/accounts/${account.id}`)}
                    sx={{ 
                      cursor: 'pointer',
                      '&:hover': {
                        backgroundColor: 'action.hover',
                      }
                    }}
                  >
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar 
                          sx={{ 
                            bgcolor: 'primary.light', 
                            color: 'primary.main',
                            width: 40,
                            height: 40
                          }}
                        >
                          {account.name.charAt(0)}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                            {account.name}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                            <EmailIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                            <Typography variant="caption" color="text.secondary">
                              {account.email}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={account.industry || 'N/A'} 
                        size="small"
                        variant="outlined"
                        sx={{ fontSize: '0.75rem' }}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={account.status} 
                        color={getStatusColor(account.status) as any}
                        size="small"
                        icon={account.status === 'active' ? <TrendingUpIcon /> : <WarningIcon />}
                        sx={{ 
                          fontSize: '0.75rem',
                          fontWeight: 500
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CircleIcon 
                          sx={{ 
                            fontSize: 12, 
                            color: getHealthColor(account.health) 
                          }} 
                        />
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            fontWeight: 600,
                            color: getHealthColor(account.health)
                          }}
                        >
                          {account.health}%
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        ${account.revenue.toLocaleString()}
                      </Typography>
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
                    <TableCell>
                      <Typography variant="body2">
                        {account.employees.toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {account.accountManager}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {/* Add Account Modal */}
      <Dialog open={addAccountOpen} onClose={() => setAddAccountOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create New Account</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="Account Name"
            value={addAccountForm.name || ''}
            onChange={(e) => handleAddAccountChange('name', e.target.value)}
            fullWidth
            size="small"
          />
          <TextField
            label="Email"
            value={addAccountForm.email || ''}
            onChange={(e) => handleAddAccountChange('email', e.target.value)}
            fullWidth
            size="small"
          />
          <TextField
            label="Phone"
            value={addAccountForm.phone || ''}
            onChange={(e) => handleAddAccountChange('phone', e.target.value)}
            fullWidth
            size="small"
          />
          <TextField
            label="Address"
            value={addAccountForm.address || ''}
            onChange={(e) => handleAddAccountChange('address', e.target.value)}
            fullWidth
            size="small"
          />
          <TextField
            label="Industry"
            value={addAccountForm.industry || ''}
            onChange={(e) => handleAddAccountChange('industry', e.target.value)}
            fullWidth
            size="small"
          />
          <TextField
            label="Website"
            value={addAccountForm.website || ''}
            onChange={(e) => handleAddAccountChange('website', e.target.value)}
            fullWidth
            size="small"
          />
          <TextField
            label="Description"
            value={addAccountForm.description || ''}
            onChange={(e) => handleAddAccountChange('description', e.target.value)}
            fullWidth
            size="small"
            multiline
            minRows={2}
          />
          <TextField
            label="Business Use Case"
            value={addAccountForm.businessUseCase || ''}
            onChange={(e) => handleAddAccountChange('businessUseCase', e.target.value)}
            fullWidth
            size="small"
          />
          <TextField
            label="Tech Stack"
            value={addAccountForm.techStack || ''}
            onChange={(e) => handleAddAccountChange('techStack', e.target.value)}
            fullWidth
            size="small"
          />
          <TextField
            label="Health Score"
            type="number"
            value={addAccountForm.health || ''}
            onChange={(e) => handleAddAccountChange('health', Number(e.target.value))}
            fullWidth
            size="small"
          />
          <TextField
            label="Revenue"
            type="number"
            value={addAccountForm.revenue || ''}
            onChange={(e) => handleAddAccountChange('revenue', Number(e.target.value))}
            fullWidth
            size="small"
          />
          <TextField
            label="License ARR"
            type="number"
            value={addAccountForm.arr || ''}
            onChange={(e) => handleAddAccountChange('arr', Number(e.target.value))}
            fullWidth
            size="small"
          />
          <TextField
            label="Renewal Date"
            type="date"
            value={addAccountForm.renewalDate || ''}
            onChange={(e) => handleAddAccountChange('renewalDate', e.target.value)}
            fullWidth
            size="small"
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="Risk Score"
            type="number"
            value={addAccountForm.riskScore || ''}
            onChange={(e) => handleAddAccountChange('riskScore', Number(e.target.value))}
            fullWidth
            size="small"
          />
          <TextField
            label="Employees"
            type="number"
            value={addAccountForm.employees || ''}
            onChange={(e) => handleAddAccountChange('employees', Number(e.target.value))}
            fullWidth
            size="small"
          />
          <TextField
            label="Account Manager"
            value={addAccountForm.accountManager || ''}
            onChange={(e) => handleAddAccountChange('accountManager', e.target.value)}
            fullWidth
            size="small"
          />
          <TextField
            label="Customer Success Manager"
            value={addAccountForm.customerSuccessManager || ''}
            onChange={(e) => handleAddAccountChange('customerSuccessManager', e.target.value)}
            fullWidth
            size="small"
          />
          <TextField
            label="Sales Engineer"
            value={addAccountForm.salesEngineer || ''}
            onChange={(e) => handleAddAccountChange('salesEngineer', e.target.value)}
            fullWidth
            size="small"
          />
          <TextField
            label="Tier ID"
            value={addAccountForm.tierId || ''}
            onChange={(e) => handleAddAccountChange('tierId', e.target.value)}
            fullWidth
            size="small"
          />
          <FormControl fullWidth size="small">
            <InputLabel>Status</InputLabel>
            <Select
              value={addAccountForm.status || ''}
              label="Status"
              onChange={(e) => handleAddAccountChange('status', e.target.value)}
            >
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="at-risk">At Risk</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddAccountOpen(false)}>Cancel</Button>
          <Button onClick={handleAddAccountSave} variant="contained">Create Account</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AccountsPage; 