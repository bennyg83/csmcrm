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
  Divider,
  TextField,
  Autocomplete
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Business as BusinessIcon,
  Assignment as TaskIcon,
  Settings as SettingsIcon,
  IntegrationInstructions as IntegrationIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  Email as EmailIcon,
  BarChart as ManagementIcon,
  FolderOpen as ProjectsIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { apiService } from '../services/api';
import { Account, Contact, Task } from '../types';
import { gmailService } from '../services/gmailService';
import SearchIcon from '@mui/icons-material/Search';

interface LayoutProps {
  children: React.ReactNode;
}

const drawerWidth = 220;

const navItems = [
  { path: '/', label: 'Dashboard', icon: <DashboardIcon /> },
  { path: '/management', label: 'Management', icon: <ManagementIcon />, management: true },
  { path: '/accounts', label: 'Accounts', icon: <BusinessIcon /> },
  { path: '/projects', label: 'Projects', icon: <ProjectsIcon /> },
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
        {navItems.filter(item => 
          (!item.admin || userRole === 'admin') && 
          (!item.management || userRole === 'admin' || userRole === 'manager')
        ).map((item) => (
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
  const [searchInput, setSearchInput] = React.useState('');
  const [searchOptions, setSearchOptions] = React.useState<any[]>([]);
  const [searchLoading, setSearchLoading] = React.useState(false);

  const handleSearch = async (value: string) => {
    setSearchInput(value);
    if (!value || value.length < 2) {
      setSearchOptions([]);
      return;
    }
    setSearchLoading(true);
    try {
      const [accounts, tasks, emails] = await Promise.all([
        apiService.getAccounts(),
        apiService.getTasks(),
        gmailService.searchEmails(value, 5).catch(() => [])
      ]);
      const contacts: Contact[] = accounts.flatMap(a => a.contacts || []);
      const q = value.toLowerCase();
      const results: any[] = [];
      accounts.forEach((a: Account) => {
        if (
          a.name.toLowerCase().includes(q) ||
          a.email?.toLowerCase().includes(q)
        ) {
          results.push({ type: 'account', id: a.id, label: `Account: ${a.name}` });
        }
      });
      contacts.forEach((c: Contact) => {
        const name = `${c.firstName} ${c.lastName}`;
        if (name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q)) {
          results.push({ type: 'contact', id: c.id, accountId: c.accountId, label: `Contact: ${name}` });
        }
      });
      tasks.forEach((t: Task) => {
        if (
          t.title.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q)
        ) {
          results.push({ type: 'task', id: t.id, accountId: t.accountId, label: `Task: ${t.title}` });
        }
      });
      // Emails
      (emails as any[]).forEach((e: any) => {
        results.push({ type: 'email', id: e.id, label: `Email: ${e.subject || '(No Subject)'} from ${e.from?.email || ''}`, q: e.subject || e.from?.email || value });
      });
      setSearchOptions(results.slice(0, 20));
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSearchSelect = (event: any, option: any) => {
    if (!option) return;
    switch (option.type) {
      case 'account':
        navigate(`/accounts/${option.id}`);
        break;
      case 'contact':
        navigate(`/contacts/${option.id}`);
        break;
      case 'task':
        navigate(`/tasks/${option.id}`);
        break;
      case 'email':
        navigate(`/email?q=${encodeURIComponent(option.q || '')}`);
        break;
      default:
        break;
    }
  };

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
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '50%' }}>
              <Autocomplete
                freeSolo
                options={searchOptions}
                getOptionLabel={(o) => (typeof o === 'string' ? o : o.label)}
                loading={searchLoading}
                onChange={handleSearchSelect}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    size="small"
                    placeholder="Search accounts, contacts, tasks..."
                    onChange={(e) => handleSearch(e.target.value)}
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: <SearchIcon sx={{ mr: 1 }} />,
                    }}
                    sx={{ backgroundColor: 'white', borderRadius: 1, minWidth: 320 }}
                  />
                )}
              />
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