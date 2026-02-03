import React, { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ProjectIcon from '@mui/icons-material/FolderOpen';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import { Account } from '../types';

const PROJECT_TYPES = ['Onboarding', 'Expansion', 'POV_POC', 'Risk', 'Adoption'] as const;
const PROJECT_STATUSES = ['Planning', 'Active', 'On Hold', 'Completed', 'Cancelled'] as const;

const ProjectsPage: React.FC = () => {
  const [projects, setProjects] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accountFilter, setAccountFilter] = useState<string>('');
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [projRes, accRes] = await Promise.all([
          apiService.getProjects(accountFilter || undefined),
          apiService.getAccounts(),
        ]);
        setProjects(projRes);
        setAccounts(accRes);
      } catch (e) {
        console.error(e);
        setError('Failed to load projects');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [accountFilter]);

  const handleCreate = () => {
    navigate('/projects/new');
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
        <Typography variant="h4" gutterBottom>Projects</Typography>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
            Projects
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Onboarding, expansions, POV/POC, risk, and adoption initiatives by account
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreate}
          sx={{ textTransform: 'none', fontWeight: 600 }}
        >
          New project
        </Button>
      </Box>

      <Box sx={{ mb: 3 }}>
        <FormControl size="small" sx={{ minWidth: 280 }}>
          <InputLabel>Account</InputLabel>
          <Select
            value={accountFilter}
            label="Account"
            onChange={(e) => setAccountFilter(e.target.value)}
          >
            <MenuItem value="">All accounts</MenuItem>
            {accounts.map((a) => (
              <MenuItem key={a.id} value={a.id}>{a.name}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <Card>
        <CardContent>
          {projects.length === 0 ? (
            <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
              No projects yet. Create one to track onboarding, expansions, POV/POC, risk, or adoption.
            </Typography>
          ) : (
            <List disablePadding>
              {projects.map((p) => (
                <ListItem
                  key={p.id}
                  divider
                  sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
                  onClick={() => navigate(`/projects/${p.id}`)}
                >
                  <Box sx={{ mr: 2, color: 'primary.main' }}>
                    <ProjectIcon />
                  </Box>
                  <ListItemText
                    primary={p.name}
                    secondary={
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 0.5 }}>
                        <Chip size="small" label={p.type} color="primary" variant="outlined" />
                        <Chip size="small" label={p.status} />
                        {p.account?.name && (
                          <Typography component="span" variant="caption" color="text.secondary">
                            • {p.account.name}
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    <IconButton edge="end" size="small" onClick={(e) => { e.stopPropagation(); navigate(`/projects/${p.id}`); }}>
                      Open
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default ProjectsPage;
