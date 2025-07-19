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
  MenuItem,
  OutlinedInput,
  Checkbox,
  ListItemText as MuiListItemText
} from '@mui/material';
import { 
  Add as AddIcon,
  Business as BusinessIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
  Circle as CircleIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import { Account } from '../types';
import OnboardingQuestionnaire from '../components/OnboardingQuestionnaire';

const CSM_OPTIONS = ['Amanda Lee', 'Robert Taylor', 'Jennifer Smith', 'Michael Chen'];
const AM_OPTIONS = ['Michael Chen', 'David Wilson', 'Sarah Johnson'];
const SE_OPTIONS = ['Alex Thompson', 'Tom Anderson', 'Rachel Green'];
const TIER_OPTIONS = ['Enterprise', 'Business', 'Starter'];
const HEALTH_OPTIONS = ['Healthy', 'At Risk', 'Critical'];

const AccountsPage: React.FC = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addAccountOpen, setAddAccountOpen] = useState(false);
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [addAccountForm, setAddAccountForm] = useState<Partial<Account>>({});
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  // Filter state
  const [selectedCSMs, setSelectedCSMs] = useState<string[]>([]);
  const [selectedAM, setSelectedAM] = useState('');
  const [selectedSE, setSelectedSE] = useState('');
  const [selectedTier, setSelectedTier] = useState('');
  const [selectedHealth, setSelectedHealth] = useState('');

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

  // Filter accounts based on search and selected filters
  const filteredAccounts = accounts.filter(account => {
    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      if (!account.name.toLowerCase().includes(searchLower) &&
          !(account.email && account.email.toLowerCase().includes(searchLower)) &&
          !(account.customerSuccessManager && account.customerSuccessManager.toLowerCase().includes(searchLower)) &&
          !(account.accountManager && account.accountManager.toLowerCase().includes(searchLower)) &&
          !(account.salesEngineer && account.salesEngineer.toLowerCase().includes(searchLower))) {
        return false;
      }
    }
    // CSM filter
    if (selectedCSMs.length > 0 && !selectedCSMs.includes(account.customerSuccessManager || '')) {
      return false;
    }
    
    // Account Manager filter
    if (selectedAM && account.accountManager !== selectedAM) {
      return false;
    }
    
    // Solutions Engineer filter
    if (selectedSE && account.salesEngineer !== selectedSE) {
      return false;
    }
    
    // Tier filter
    if (selectedTier && account.tierId !== selectedTier) {
      return false;
    }
    
    // Health filter
    if (selectedHealth) {
      const health = account.health;
      if (selectedHealth === 'Healthy' && health < 80) return false;
      if (selectedHealth === 'At Risk' && (health >= 80 || health < 60)) return false;
      if (selectedHealth === 'Critical' && health >= 60) return false;
    }
    
    return true;
  });

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

  const handleOnboardingSuccess = () => {
    // Refresh accounts list
    const fetchAccounts = async () => {
      try {
        const data = await apiService.getAccounts();
        setAccounts(data);
      } catch (err) {
        console.error('Error fetching accounts:', err);
      }
    };
    fetchAccounts();
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
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => setOnboardingOpen(true)}
            sx={{ 
              px: 3, 
              py: 1.5,
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600
            }}
          >
            Onboarding Questionnaire
          </Button>
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
            Quick Add Account
          </Button>
        </Box>
      </Box>

      {/* Search Bar and Filters */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <TextField
            fullWidth
            placeholder="Search accounts or contacts..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
              sx: { borderRadius: 8, background: '#fff' }
            }}
            sx={{ mr: 0, flex: 1, borderRadius: 8 }}
          />
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
                  <MuiListItemText primary={name} />
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
              <MenuItem value=""><em>None</em></MenuItem>
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
              <MenuItem value=""><em>None</em></MenuItem>
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
              <MenuItem value=""><em>None</em></MenuItem>
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
              <MenuItem value=""><em>None</em></MenuItem>
              {HEALTH_OPTIONS.map(name => (
                <MenuItem key={name} value={name}>{name}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Box>

      {/* Results Summary */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Showing {filteredAccounts.length} of {accounts.length} accounts
        </Typography>
      </Box>

      {/* Accounts Table */}
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
                <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredAccounts.map((account) => (
                <TableRow key={account.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                        <BusinessIcon sx={{ fontSize: 16 }} />
                      </Avatar>
                      <Typography
                        variant="body2"
                        sx={{ 
                          fontWeight: 600, 
                          cursor: 'pointer',
                          '&:hover': { color: 'primary.main' }
                        }}
                        onClick={() => navigate(`/accounts/${account.id}`)}
                      >
                        {account.name}
                      </Typography>
                    </Box>
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
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Tooltip title="View Details">
                        <IconButton
                          size="small"
                          onClick={() => navigate(`/accounts/${account.id}`)}
                        >
                          <BusinessIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Add Account Dialog */}
      <Dialog 
        open={addAccountOpen} 
        onClose={() => setAddAccountOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Add New Account</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mt: 1 }}>
            <TextField
              label="Account Name"
              value={addAccountForm.name || ''}
              onChange={(e) => handleAddAccountChange('name', e.target.value)}
              fullWidth
            />
            <TextField
              label="Email"
              type="email"
              value={addAccountForm.email || ''}
              onChange={(e) => handleAddAccountChange('email', e.target.value)}
              fullWidth
            />
            <TextField
              label="Phone"
              value={addAccountForm.phone || ''}
              onChange={(e) => handleAddAccountChange('phone', e.target.value)}
              fullWidth
            />
            <TextField
              label="Industry"
              value={addAccountForm.industry || ''}
              onChange={(e) => handleAddAccountChange('industry', e.target.value)}
              fullWidth
            />
            <TextField
              label="Website"
              value={addAccountForm.website || ''}
              onChange={(e) => handleAddAccountChange('website', e.target.value)}
              fullWidth
            />
            <TextField
              label="Account Manager"
              value={addAccountForm.accountManager || ''}
              onChange={(e) => handleAddAccountChange('accountManager', e.target.value)}
              fullWidth
            />
            <TextField
              label="Customer Success Manager"
              value={addAccountForm.customerSuccessManager || ''}
              onChange={(e) => handleAddAccountChange('customerSuccessManager', e.target.value)}
              fullWidth
            />
            <TextField
              label="Sales Engineer"
              value={addAccountForm.salesEngineer || ''}
              onChange={(e) => handleAddAccountChange('salesEngineer', e.target.value)}
              fullWidth
            />
            <TextField
              label="Health Score"
              type="number"
              value={addAccountForm.health || 75}
              onChange={(e) => handleAddAccountChange('health', parseInt(e.target.value))}
              fullWidth
            />
            <TextField
              label="ARR"
              type="number"
              value={addAccountForm.arr || 0}
              onChange={(e) => handleAddAccountChange('arr', parseInt(e.target.value))}
              fullWidth
            />
            <TextField
              label="Renewal Date"
              type="date"
              value={addAccountForm.renewalDate || ''}
              onChange={(e) => handleAddAccountChange('renewalDate', e.target.value)}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Employees"
              type="number"
              value={addAccountForm.employees || 0}
              onChange={(e) => handleAddAccountChange('employees', parseInt(e.target.value))}
              fullWidth
            />
            <TextField
              label="Address"
              value={addAccountForm.address || ''}
              onChange={(e) => handleAddAccountChange('address', e.target.value)}
              fullWidth
              multiline
              rows={2}
            />
            <TextField
              label="Description"
              value={addAccountForm.description || ''}
              onChange={(e) => handleAddAccountChange('description', e.target.value)}
              fullWidth
              multiline
              rows={2}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddAccountOpen(false)}>Cancel</Button>
          <Button onClick={handleAddAccountSave} variant="contained">Add Account</Button>
        </DialogActions>
      </Dialog>

      {/* Onboarding Questionnaire Dialog */}
      <OnboardingQuestionnaire
        open={onboardingOpen}
        onClose={() => setOnboardingOpen(false)}
        onSuccess={handleOnboardingSuccess}
      />
    </Box>
  );
};

export default AccountsPage; 