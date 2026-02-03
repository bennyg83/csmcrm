import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import DashboardPage from './pages/DashboardPage';
import ManagementDashboard from './pages/ManagementDashboard';
import AccountsPage from './pages/AccountsPage';
import AccountDetailPage from './pages/AccountDetailPage';
import TasksPage from './pages/TasksPage';
import TaskDetailPage from './pages/TaskDetailPage';
import CalendarPage from './pages/CalendarPage';
import EmailPage from './pages/EmailPage';
import SettingsPage from './pages/SettingsPage';
import IntegrationsPage from './pages/IntegrationsPage';
import LoginPage from './pages/LoginPage';
import Layout from './components/Layout';
import ContactDetailPage from './pages/ContactDetailPage';
import { GoogleAuthSuccess, GoogleAuthError } from './pages/GoogleAuthCallback';
import PortalApp from './pages/ExternalPortal/PortalApp';
import { ClientPortalLayout } from './components/ClientPortalLayout';
import { ClientLoginPage } from './pages/ClientLoginPage';
import { ClientDashboardPage } from './pages/ClientDashboardPage';
import PasswordResetPage from './pages/PasswordResetPage';
import ProjectsPage from './pages/ProjectsPage';
import ProjectDetailPage from './pages/ProjectDetailPage';
import CreateProjectPage from './pages/CreateProjectPage';

// Protected Route Component
// Minimal theme to avoid React hooks issues
const minimalTheme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#1976d2' },
    secondary: { main: '#dc004e' },
  },
});

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

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
  
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};



const App: React.FC = () => {
  return (
    <ThemeProvider theme={minimalTheme}>
      <CssBaseline />
      <AuthProvider>
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Routes>
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout>
                    <DashboardPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Layout>
                    <DashboardPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/management"
              element={
                <ProtectedRoute>
                  <Layout>
                    <ManagementDashboard />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/accounts"
              element={
                <ProtectedRoute>
                  <Layout>
                    <AccountsPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/accounts/:id"
              element={
                <ProtectedRoute>
                  <Layout>
                    <AccountDetailPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/tasks"
              element={
                <ProtectedRoute>
                  <Layout>
                    <TasksPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/tasks/:id"
              element={
                <ProtectedRoute>
                  <Layout>
                    <TaskDetailPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/projects"
              element={
                <ProtectedRoute>
                  <Layout>
                    <ProjectsPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/projects/new"
              element={
                <ProtectedRoute>
                  <Layout>
                    <CreateProjectPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/projects/:id"
              element={
                <ProtectedRoute>
                  <Layout>
                    <ProjectDetailPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/contacts/:id"
              element={
                <ProtectedRoute>
                  <Layout>
                    <ContactDetailPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/calendar"
              element={
                <ProtectedRoute>
                  <Layout>
                    <CalendarPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/email"
              element={
                <ProtectedRoute>
                  <Layout>
                    <EmailPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <Layout>
                    <SettingsPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/integrations"
              element={
                <ProtectedRoute>
                  <Layout>
                    <IntegrationsPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            {/* Auth routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/auth/google/success" element={<GoogleAuthSuccess />} />
            <Route path="/auth/google/error" element={<GoogleAuthError />} />
            
            {/* External Portal routes */}
            <Route path="/portal/*" element={<PortalApp />} />
            
            {/* Client Portal routes */}
            <Route path="/client/login" element={<ClientLoginPage />} />
            <Route path="/client/password-reset" element={<PasswordResetPage />} />
            <Route
              path="/client/dashboard"
              element={
                <ProtectedRoute>
                  <ClientPortalLayout>
                    <ClientDashboardPage />
                  </ClientPortalLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/client/tasks"
              element={
                <ProtectedRoute>
                  <ClientPortalLayout>
                    <ClientDashboardPage />
                  </ClientPortalLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/client/account"
              element={
                <ProtectedRoute>
                  <ClientPortalLayout>
                    <ClientDashboardPage />
                  </ClientPortalLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/client/profile"
              element={
                <ProtectedRoute>
                  <ClientPortalLayout>
                    <ClientDashboardPage />
                  </ClientPortalLayout>
                </ProtectedRoute>
              }
            />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App; 