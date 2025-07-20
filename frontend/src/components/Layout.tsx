import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Container,
  Avatar,
  Chip,
  IconButton,
  Tooltip,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Business as BusinessIcon,
  Assignment as TaskIcon,
  Settings as SettingsIcon,
  IntegrationInstructions as IntegrationIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  Email as EmailIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
}

const drawerWidth = 220;

const navItems = [
  { path: '/', label: 'Dashboard', icon: <DashboardIcon /> },
  { path: '/accounts', label: 'Accounts', icon: <BusinessIcon /> },
  { path: '/tasks', label: 'Tasks', icon: <TaskIcon /> },
  { path: '/calendar', label: 'Calendar', icon: <CalendarIcon /> },
  { path: '/email', label: 'Email', icon: <EmailIcon /> },
  { path: '/settings', label: 'Settings', icon: <SettingsIcon />, admin: true },
  { path: '/integrations', label: 'Integrations', icon: <IntegrationIcon /> },
];

const Sidebar: React.FC<{ userRole: string; activePath: string; onNavigate: (path: string) => void }> = ({ userRole, activePath, onNavigate }) => (
  <Drawer
    variant="permanent"
    sx={{
      width: drawerWidth,
      flexShrink: 0,
      [`& .MuiDrawer-paper`]: {
        width: drawerWidth,
        boxSizing: 'border-box',
        backgroundColor: '#fff',
        borderRight: '1px solid #e2e8f0',
        pt: 2,
      },
    }}
  >
    <Toolbar />
    <Box sx={{ overflow: 'auto', px: 1 }}>
      <List>
        {navItems.filter(item => !item.admin || userRole === 'admin').map((item) => (
          <ListItem key={item.path} disablePadding>
            <ListItemButton
              selected={activePath === item.path}
              onClick={() => onNavigate(item.path)}
              sx={{
                borderRadius: 2,
                mx: 1,
                my: 0.5,
                color: activePath === item.path ? 'primary.main' : 'text.secondary',
                backgroundColor: activePath === item.path ? 'action.selected' : 'transparent',
                '&:hover': {
                  backgroundColor: 'action.hover',
                },
              }}
            >
              <ListItemIcon sx={{ color: 'inherit', minWidth: 36 }}>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} primaryTypographyProps={{ fontWeight: activePath === item.path ? 600 : 500 }} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Divider sx={{ my: 2 }} />
    </Box>
  </Drawer>
);

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: 'background.default' }}>
      <Sidebar userRole={user?.role || 'user'} activePath={location.pathname} onNavigate={navigate} />
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <AppBar 
          position="fixed"
          elevation={0}
          sx={{ 
            backgroundColor: 'primary.main',
            color: 'white',
            zIndex: (theme) => theme.zIndex.drawer + 1,
            boxShadow: 'none',
            borderBottom: '1px solid #e2e8f0',
          }}
        >
          <Toolbar sx={{ justifyContent: 'space-between', minHeight: 64 }}>
            <Typography 
              variant="h6" 
              component="div" 
              sx={{ fontWeight: 700, letterSpacing: 1 }}
            >
              CRM
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Chip
                label={user?.role === 'admin' ? 'Admin' : 'User'}
                size="small"
                color={user?.role === 'admin' ? 'secondary' : 'default'}
                sx={{ fontWeight: 500, color: 'white', backgroundColor: 'primary.dark' }}
              />
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Avatar 
                  sx={{ 
                    width: 32, 
                    height: 32, 
                    bgcolor: 'secondary.main',
                    fontSize: '0.875rem'
                  }}
                >
                  {user?.name?.charAt(0) || 'U'}
                </Avatar>
                <Typography variant="body2" sx={{ fontWeight: 500, color: 'white' }}>
                  {user?.name}
                </Typography>
              </Box>
              <Tooltip title="Logout">
                <IconButton
                  onClick={handleLogout}
                  sx={{ color: 'white', '&:hover': { color: 'error.main' } }}
                >
                  <PersonIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Toolbar>
        </AppBar>
        <Toolbar />
        <Container 
          component="main" 
          sx={{ 
            flexGrow: 1, 
            py: 4,
            px: { xs: 2, sm: 3, md: 4 },
            maxWidth: '1400px',
            mt: 2
          }}
        >
          {children}
        </Container>
      </Box>
    </Box>
  );
};

export default Layout; 