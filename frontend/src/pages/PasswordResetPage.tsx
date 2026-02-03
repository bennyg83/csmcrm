import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Container,
  Card,
  CardContent,
} from '@mui/material';
import { LockReset as LockResetIcon } from '@mui/icons-material';
import { apiService } from '../services/api';

const PasswordResetPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    token: '',
    password: '',
    confirmPassword: '',
  });

  useEffect(() => {
    // Get token from URL params
    const token = searchParams.get('token');
    if (token) {
      setFormData(prev => ({ ...prev, token }));
    }
  }, [searchParams]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await apiService.resetPassword(formData.token, formData.password);
      setSuccess(true);
      
             // Redirect to client login after 3 seconds
       setTimeout(() => {
         navigate('/client/login');
       }, 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Container maxWidth="sm">
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          minHeight="100vh"
          gap={3}
        >
          <Card sx={{ width: '100%', textAlign: 'center' }}>
            <CardContent>
              <LockResetIcon color="success" sx={{ fontSize: 64, mb: 2 }} />
              <Typography variant="h4" gutterBottom color="success.main">
                Password Reset Successful!
              </Typography>
                             <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                 Your password has been successfully reset. You will be redirected to the client login page shortly.
               </Typography>
                             <Button
                 variant="contained"
                 onClick={() => navigate('/client/login')}
                 sx={{ mt: 2 }}
               >
                 Go to Client Login
               </Button>
            </CardContent>
          </Card>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm">
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        minHeight="100vh"
        gap={3}
      >
        <Card sx={{ width: '100%' }}>
          <CardContent sx={{ p: 4 }}>
            <Box textAlign="center" mb={3}>
              <LockResetIcon color="primary" sx={{ fontSize: 48, mb: 2 }} />
              <Typography variant="h4" gutterBottom>
                Reset Your Password
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Enter your new password below
              </Typography>
            </Box>

            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              <TextField
                fullWidth
                label="Reset Token"
                value={formData.token}
                onChange={(e) => handleInputChange('token', e.target.value)}
                margin="normal"
                required
                placeholder="Enter the reset token from your email"
                disabled={!!searchParams.get('token')}
              />
              
              <TextField
                fullWidth
                label="New Password"
                type="password"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                margin="normal"
                required
                placeholder="Enter your new password"
                inputProps={{ minLength: 8 }}
                helperText="Password must be at least 8 characters long"
              />
              
              <TextField
                fullWidth
                label="Confirm New Password"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                margin="normal"
                required
                placeholder="Confirm your new password"
                error={formData.confirmPassword !== '' && formData.password !== formData.confirmPassword}
                helperText={
                  formData.confirmPassword !== '' && formData.password !== formData.confirmPassword
                    ? 'Passwords do not match'
                    : ''
                }
              />

              <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => navigate('/client/login')}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  fullWidth
                  type="submit"
                  variant="contained"
                  disabled={loading || !formData.token || !formData.password || !formData.confirmPassword}
                >
                  {loading ? <CircularProgress size={24} /> : 'Reset Password'}
                </Button>
              </Box>
            </form>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
};

export default PasswordResetPage;
