import React, { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { apiService } from '../services/api';
import { Account } from '../types';

const CreateProjectPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const stateAccountId = (location.state as { accountId?: string })?.accountId;
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [form, setForm] = useState({
    accountId: stateAccountId || '',
    type: 'Onboarding' as const,
    name: '',
    description: '',
    status: 'Planning' as const,
  });

  useEffect(() => {
    apiService
      .getAccounts()
      .then(setAccounts)
      .catch(() => setErr('Failed to load accounts'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (stateAccountId && !form.accountId) {
      setForm((f) => ({ ...f, accountId: stateAccountId }));
    }
  }, [stateAccountId]);

  const handleSubmit = async () => {
    if (!form.accountId || !form.name) return;
    setSaving(true);
    setErr(null);
    try {
      const p = await apiService.createProject({
        accountId: form.accountId,
        type: form.type,
        name: form.name,
        description: form.description || undefined,
        status: form.status,
      });
      navigate(`/projects/${p.id}`);
    } catch {
      setErr('Failed to create project');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" py={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        New project
      </Typography>
      {err && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {err}
        </Alert>
      )}
      <Card sx={{ maxWidth: 560 }}>
        <CardContent>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Account</InputLabel>
            <Select
              value={form.accountId}
              label="Account"
              onChange={(e) => setForm((f) => ({ ...f, accountId: e.target.value }))}
            >
              <MenuItem value="">Select account</MenuItem>
              {accounts.map((a) => (
                <MenuItem key={a.id} value={a.id}>
                  {a.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Type</InputLabel>
            <Select
              value={form.type}
              label="Type"
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as typeof form.type }))}
            >
              {['Onboarding', 'Expansion', 'POV_POC', 'Risk', 'Adoption'].map((t) => (
                <MenuItem key={t} value={t}>
                  {t}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            fullWidth
            label="Name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Description"
            multiline
            rows={2}
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={form.status}
              label="Status"
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as typeof form.status }))}
            >
              {['Planning', 'Active', 'On Hold', 'Completed', 'Cancelled'].map((s) => (
                <MenuItem key={s} value={s}>
                  {s}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button onClick={() => navigate('/projects')}>Cancel</Button>
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={!form.accountId || !form.name || saving}
            >
              {saving ? 'Creating…' : 'Create'}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default CreateProjectPage;
