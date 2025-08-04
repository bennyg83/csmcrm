import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Container,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Stepper,
  Step,
  StepLabel
} from '@mui/material';
import { CheckCircle as CheckCircleIcon, VpnKey as KeyIcon } from '@mui/icons-material';
import { useNavigate, useSearchParams } from 'react-router-dom';

const PortalSetup: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setError('Invalid or missing invitation token');
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/portal/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Setup failed');
      }

      setSuccess(true);
      setTimeout(() => {
        navigate('/portal/login');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Setup failed');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <Container component="main" maxWidth="sm">
        <Box
          sx={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Alert severity="error">
            Invalid or missing invitation token. Please check your invitation link.
          </Alert>
        </Box>
      </Container>
    );
  }

  if (success) {
    return (
      <Container component="main" maxWidth="sm">
        <Box
          sx={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Card sx={{ width: '100%', maxWidth: 450 }}>
            <CardContent sx={{ p: 4, textAlign: 'center' }}>
              <CheckCircleIcon 
                sx={{ 
                  fontSize: 64, 
                  color: 'success.main',
                  mb: 2
                }} 
              />
              <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
                Setup Complete!
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                Your portal access has been set up successfully. You will be redirected to the login page shortly.
              </Typography>
              <CircularProgress size={24} />
            </CardContent>
          </Card>
        </Box>
      </Container>
    );
  }

  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          padding: 3
        }}
      >
        <Card sx={{ width: '100%', maxWidth: 450 }}>
          <CardContent sx={{ p: 4 }}>
            {/* Header */}
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <KeyIcon 
                sx={{ 
                  fontSize: 64, 
                  color: 'primary.main',
                  mb: 2,
                  border: '2px solid',
                  borderColor: 'primary.main',
                  borderRadius: '50%',
                  p: 1.5
                }} 
              />
              <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
                Portal Setup
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Set up your password to access the client portal
              </Typography>
            </Box>

            {/* Progress Stepper */}
            <Stepper activeStep={1} sx={{ mb: 4 }}>
              <Step completed>
                <StepLabel>Invitation Sent</StepLabel>
              </Step>
              <Step>
                <StepLabel>Set Password</StepLabel>
              </Step>
              <Step>
                <StepLabel>Portal Access</StepLabel>
              </Step>
            </Stepper>

            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Password"
                type="password"
                id="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                sx={{ mb: 2 }}
                helperText="Password must be at least 6 characters long"
              />
              <TextField
                margin="normal"
                required
                fullWidth
                name="confirmPassword"
                label="Confirm Password"
                type="password"
                id="confirmPassword"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
                sx={{ mb: 3 }}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ 
                  mt: 3, 
                  mb: 2, 
                  py: 1.5,
                  fontSize: '1.1rem',
                  fontWeight: 600
                }}
                disabled={loading || !password || !confirmPassword}
              >
                {loading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  'Complete Setup'
                )}
              </Button>
              
              <Box sx={{ textAlign: 'center', mt: 3 }}>
                <Typography variant="caption" color="text.secondary">
                  Need help? Contact your account manager for assistance.
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
};

export default PortalSetup;