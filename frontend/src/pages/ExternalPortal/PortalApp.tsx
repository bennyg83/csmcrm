import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { PortalAuthProvider, usePortalAuth } from '../../contexts/PortalAuthContext';
import PortalLogin from './PortalLogin';
import PortalDashboard from './PortalDashboard';
import PortalSetup from './PortalSetup';

// Protected Route Component for Portal
const PortalProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = usePortalAuth();
  
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        Loading...
      </div>
    );
  }
  
  return isAuthenticated ? <>{children}</> : <Navigate to="/portal/login" replace />;
};

// Portal theme (slightly different from main app)
const portalTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2', // Blue theme for portal
      light: '#42a5f5',
      dark: '#1565c0',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#9c27b0', // Purple accent
      light: '#ba68c8',
      dark: '#7b1fa2',
      contrastText: '#ffffff',
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
    text: {
      primary: '#212121',
      secondary: '#757575',
    },
    success: {
      main: '#4caf50',
      light: '#81c784',
      dark: '#388e3c',
    },
    warning: {
      main: '#ff9800',
      light: '#ffb74d',
      dark: '#f57c00',
    },
    error: {
      main: '#f44336',
      light: '#e57373',
      dark: '#d32f2f',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
      fontSize: '2.5rem',
    },
    h2: {
      fontWeight: 600,
      fontSize: '2rem',
    },
    h3: {
      fontWeight: 600,
      fontSize: '1.75rem',
    },
    h4: {
      fontWeight: 600,
      fontSize: '1.5rem',
    },
    h5: {
      fontWeight: 600,
      fontSize: '1.25rem',
    },
    h6: {
      fontWeight: 600,
      fontSize: '1rem',
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          borderRadius: 8,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          borderRadius: 12,
        },
      },
    },
  },
});

const PortalRoutes: React.FC = () => {
  const { contact, login, logout } = usePortalAuth();

  return (
    <Routes>
      <Route path="/login" element={<PortalLogin onLogin={login} />} />
      <Route path="/setup" element={<PortalSetup />} />
      <Route
        path="/dashboard"
        element={
          <PortalProtectedRoute>
            <PortalDashboard contact={contact} onLogout={logout} />
          </PortalProtectedRoute>
        }
      />
      <Route path="/" element={<Navigate to="/portal/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/portal/dashboard" replace />} />
    </Routes>
  );
};

const PortalApp: React.FC = () => {
  return (
    <ThemeProvider theme={portalTheme}>
      <CssBaseline />
      <PortalAuthProvider>
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <PortalRoutes />
        </Router>
      </PortalAuthProvider>
    </ThemeProvider>
  );
};

export default PortalApp;