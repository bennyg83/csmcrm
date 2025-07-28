import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Box, CircularProgress, Typography, Alert } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';

const GoogleAuthSuccess: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { setUser } = useAuth();

  useEffect(() => {
    const handleGoogleCallback = async () => {
      const urlParams = new URLSearchParams(location.search);
      const token = urlParams.get('token');

      if (token) {
        try {
          localStorage.setItem('token', token);
          
          // Get user data with the new token
          const userData = await apiService.getMe();
          setUser(userData);
          
          navigate('/dashboard');
        } catch (error) {
          console.error('Failed to get user data:', error);
          navigate('/auth/google/error');
        }
      } else {
        navigate('/auth/google/error');
      }
    };

    handleGoogleCallback();
  }, [location, navigate, setUser]);

  return (
    <Box 
      display="flex" 
      flexDirection="column" 
      alignItems="center" 
      justifyContent="center" 
      minHeight="100vh"
      gap={2}
    >
      <CircularProgress />
      <Typography variant="h6">Completing Google Authentication...</Typography>
    </Box>
  );
};

const GoogleAuthError: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/login');
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <Box 
      display="flex" 
      flexDirection="column" 
      alignItems="center" 
      justifyContent="center" 
      minHeight="100vh"
      gap={2}
      p={3}
    >
      <Alert severity="error" sx={{ mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          Google Authentication Failed
        </Typography>
        <Typography variant="body2">
          There was an error authenticating with Google. You will be redirected to the login page.
        </Typography>
      </Alert>
      
      <Typography variant="body2" color="text.secondary">
        Redirecting in 3 seconds...
      </Typography>
    </Box>
  );
};

export { GoogleAuthSuccess, GoogleAuthError }; 