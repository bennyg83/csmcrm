import React, { useState } from 'react';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Container,
  Alert,
  Divider,
  CircularProgress
} from '@mui/material';
import { Google as GoogleIcon } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    setGoogleLoading(true);
    setError('');
    
    // Resolve API base URL to a full origin (with port) even if it's relative like "/api"
    const normalizeApiBase = (value: string): string => {
      let v = (value || '').trim();
      if (!v) return 'http://localhost:3002/api';
      if (v.startsWith('http')) {
        // Fix invalid patterns like http://localhost:/api (missing port after colon)
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
    
    // Ensure we have an /api root, then append auth path
    const apiRoot = resolvedBase.endsWith('/api')
      ? resolvedBase
      : resolvedBase.replace(/\/+$/, '') + '/api';
    
    const finalUrl = `${apiRoot}/auth/google`;
    console.log('Google auth redirect:', finalUrl);
    window.location.href = finalUrl;
  };

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper
          elevation={3}
          sx={{
            padding: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
          }}
        >
          <Typography component="h1" variant="h5">
            CRM Login
          </Typography>
          
          {error && (
            <Alert severity="error" sx={{ mt: 2, mb: 2, width: '100%' }}>
              {error}
            </Alert>
          )}

          {/* Google Login - hidden until configured */}
          {false && (
            <>
              <Button
                fullWidth
                variant="outlined"
                startIcon={googleLoading ? <CircularProgress size={20} /> : <GoogleIcon />}
                onClick={handleGoogleLogin}
                disabled={googleLoading || loading}
                sx={{
                  mt: 2,
                  mb: 2,
                  borderColor: '#4285f4',
                  color: '#4285f4',
                  '&:hover': {
                    borderColor: '#3367d6',
                    backgroundColor: 'rgba(66, 133, 244, 0.04)',
                  },
                }}
              >
                {googleLoading ? 'Connecting to Google...' : 'Sign in with Google'}
              </Button>
              <Divider sx={{ width: '100%', my: 2 }}>OR</Divider>
            </>
          )}

          {/* Regular Login Form */}
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1, width: '100%' }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              type="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading || googleLoading}
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </Button>
            {/* Dev only: logs token, sessionStorage keys, and cookies to the browser console for auth debugging */}
            {import.meta.env.DEV && (
              <Box sx={{ mt: 2, textAlign: 'center' }}>
                <Button
                  variant="text"
                  size="small"
                  onClick={() => {
                    console.log('=== DEBUG AUTH STATE ===');
                    console.log('localStorage token:', localStorage.getItem('token'));
                    console.log('sessionStorage:', Object.keys(sessionStorage));
                    console.log('cookies:', document.cookie);
                  }}
                >
                  Debug Auth State
                </Button>
              </Box>
            )}
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default LoginPage; 