import React, { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Grid,
  Divider,
  Alert,
  CircularProgress,
  Switch,
  FormControlLabel,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from '@mui/material';
import {
  Email as EmailIcon,
  CalendarToday as CalendarIcon,
  Security as SecurityIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Settings as SettingsIcon,
  Refresh as RefreshIcon,
  Link as LinkIcon,
  LinkOff as LinkOffIcon
} from '@mui/icons-material';
import { apiService } from '../services/api';

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  status: 'connected' | 'disconnected' | 'error';
  lastSync?: string;
  settings?: Record<string, any>;
}

const IntegrationsPage: React.FC = () => {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);

  useEffect(() => {
    loadIntegrations();
  }, []);

  const loadIntegrations = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Check Gmail connection (using existing user data)
      const gmailStatus = 'connected'; // Assuming Gmail is connected if user is authenticated
      
      // Check Google Calendar connection
      let calendarStatus = 'disconnected';
      let calendarLastSync = undefined;
      
      try {
        const calendarResponse = await apiService.checkCalendarConnection();
        if (calendarResponse.connected) {
          calendarStatus = 'connected';
          calendarLastSync = calendarResponse.lastSync;
        }
      } catch (calendarErr) {
        console.log('Calendar not connected:', calendarErr);
      }
      
      const integrations: Integration[] = [
        {
          id: 'gmail',
          name: 'Gmail',
          description: 'Connect your Gmail account to sync emails and contacts',
          icon: <EmailIcon />,
          status: gmailStatus as 'connected' | 'disconnected' | 'error',
          lastSync: gmailStatus === 'connected' ? new Date().toISOString() : undefined,
          settings: {
            syncEmails: true,
            syncContacts: true,
            autoSync: true
          }
        },
        {
          id: 'google-calendar',
          name: 'Google Calendar',
          description: 'Sync your Google Calendar for meeting scheduling',
          icon: <CalendarIcon />,
          status: calendarStatus as 'connected' | 'disconnected' | 'error',
          lastSync: calendarLastSync,
          settings: {
            syncMeetings: true,
            createEvents: false
          }
        },
        {
          id: 'sso',
          name: 'Single Sign-On',
          description: 'Configure SSO for enterprise authentication',
          icon: <SecurityIcon />,
          status: 'error',
          settings: {
            provider: 'google',
            domain: 'company.com'
          }
        }
      ];
      
      setIntegrations(integrations);
    } catch (err) {
      console.error('Error loading integrations:', err);
      setError('Failed to load integrations');
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (integration: Integration) => {
    try {
      if (integration.id === 'gmail' || integration.id === 'google-calendar') {
        // Redirect to backend OAuth endpoint (same logic as LoginPage)
        const normalizeApiBase = (value: string): string => {
          let v = (value || '').trim();
          if (!v) return 'http://localhost:3002/api';
          if (v.startsWith('http')) {
            if (/^https?:\/\/[^/]+:\/?($|[^0-9])/.test(v)) {
              v = v.replace(/^(https?:\/\/[^/]+):(?=\/|$)/, '$1:3002');
            }
            return v;
          }
          const origin = window.location.origin || 'http://localhost:5173';
          return new URL(v, origin).toString();
        };

        const rawApiBaseUrl = (import.meta.env.VITE_API_URL as string) ?? '';
        const resolvedBase = normalizeApiBase(rawApiBaseUrl);
        const apiRoot = resolvedBase.endsWith('/api') ? resolvedBase : resolvedBase.replace(/\/+$/, '') + '/api';
        window.location.href = `${apiRoot}/auth/google`;
      } else {
        setSelectedIntegration(integration);
        setSettingsOpen(true);
      }
    } catch (err) {
      console.error('Error connecting integration:', err);
      setError('Failed to connect integration');
    }
  };

  const handleDisconnect = async (integration: Integration) => {
    try {
      // Mock disconnect - in real app, this would call API
      setIntegrations(prev => prev.map(integ => 
        integ.id === integration.id 
          ? { ...integ, status: 'disconnected' as const }
          : integ
      ));
    } catch (err) {
      console.error('Error disconnecting integration:', err);
      setError('Failed to disconnect integration');
    }
  };

  const handleSync = async (integration: Integration) => {
    try {
      // Mock sync - in real app, this would call API
      setIntegrations(prev => prev.map(integ => 
        integ.id === integration.id 
          ? { ...integ, lastSync: new Date().toISOString() }
          : integ
      ));
    } catch (err) {
      console.error('Error syncing integration:', err);
      setError('Failed to sync integration');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircleIcon color="success" />;
      case 'error':
        return <ErrorIcon color="error" />;
      default:
        return <LinkOffIcon color="disabled" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return 'success';
      case 'error':
        return 'error';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h3" gutterBottom sx={{ fontWeight: 700 }}>
            <SettingsIcon sx={{ mr: 1, verticalAlign: 'bottom' }} />
            Integrations
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Connect and manage external services and APIs
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={loadIntegrations}
        >
          Refresh
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {integrations.map((integration) => (
          <Grid item xs={12} md={6} lg={4} key={integration.id}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Box sx={{ mr: 2, color: 'primary.main' }}>
                    {integration.icon}
                  </Box>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" component="h3" sx={{ fontWeight: 600 }}>
                      {integration.name}
                    </Typography>
                    <Chip
                      icon={getStatusIcon(integration.status)}
                      label={integration.status}
                      color={getStatusColor(integration.status)}
                      size="small"
                      sx={{ mt: 0.5 }}
                    />
                  </Box>
                </Box>
                
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {integration.description}
                </Typography>

                {integration.lastSync && (
                  <Typography variant="caption" color="text.secondary">
                    Last synced: {new Date(integration.lastSync).toLocaleString()}
                  </Typography>
                )}
              </CardContent>

              <CardActions sx={{ p: 2, pt: 0 }}>
                {integration.status === 'connected' ? (
                  <Box sx={{ display: 'flex', gap: 1, width: '100%' }}>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => handleSync(integration)}
                      startIcon={<RefreshIcon />}
                      sx={{ flex: 1 }}
                    >
                      Sync
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      color="error"
                      onClick={() => handleDisconnect(integration)}
                      startIcon={<LinkOffIcon />}
                      sx={{ flex: 1 }}
                    >
                      Disconnect
                    </Button>
                  </Box>
                ) : (
                  <Button
                    size="small"
                    variant="contained"
                    onClick={() => handleConnect(integration)}
                    startIcon={<LinkIcon />}
                    sx={{ width: '100%' }}
                  >
                    Connect
                  </Button>
                )}
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Settings Dialog */}
      <Dialog 
        open={settingsOpen} 
        onClose={() => setSettingsOpen(false)} 
        maxWidth="sm" 
        fullWidth
        disableRestoreFocus
        disableAutoFocus
      >
        <DialogTitle>
          Configure {selectedIntegration?.name}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Configure settings for {selectedIntegration?.name} integration.
          </Typography>
          {/* Add configuration fields here based on integration type */}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSettingsOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => setSettingsOpen(false)}>
            Save Settings
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default IntegrationsPage; 