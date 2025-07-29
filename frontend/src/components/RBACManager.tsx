import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Chip,
  Alert,
  Snackbar,
  Tabs,
  Tab
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Security as SecurityIcon,
  Person as PersonIcon,
  Group as GroupIcon
} from '@mui/icons-material';
import { apiService } from '../services/api';

interface Permission {
  id: string;
  name: string;
  description?: string;
  resource?: string;
  action?: string;
}

interface Role {
  id: string;
  name: string;
  description?: string;
  permissions: Permission[];
}

interface User {
  id: string;
  name: string;
  email: string;
  role?: string | { id: string; name: string };
  legacyRole?: string;
}

const RBACManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  // Role management
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [roleForm, setRoleForm] = useState({
    name: '',
    description: '',
    permissions: [] as string[]
  });
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  // User role assignment
  const [showUserRoleDialog, setShowUserRoleDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedRoleId, setSelectedRoleId] = useState<string>('');

  useEffect(() => {
    loadData();
  }, []);





  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load roles with permissions from backend
      try {
        const rolesData = await apiService.getRBACRoles();
        setRoles(rolesData);
      } catch (err) {
        console.log('Using mock roles data');
        setRoles([
          { id: '1', name: 'admin', description: 'System Administrator', permissions: [
            { id: '1', name: 'accounts:read', description: 'Read accounts', resource: 'accounts', action: 'read' },
            { id: '2', name: 'accounts:write', description: 'Create/update accounts', resource: 'accounts', action: 'write' },
            { id: '3', name: 'users:read', description: 'Read users', resource: 'users', action: 'read' },
            { id: '4', name: 'users:write', description: 'Create/update users', resource: 'users', action: 'write' }
          ]},
          { id: '2', name: 'manager', description: 'Team Manager', permissions: [
            { id: '1', name: 'accounts:read', description: 'Read accounts', resource: 'accounts', action: 'read' },
            { id: '2', name: 'accounts:write', description: 'Create/update accounts', resource: 'accounts', action: 'write' }
          ]},
          { id: '3', name: 'sales', description: 'Sales Representative', permissions: [
            { id: '1', name: 'accounts:read', description: 'Read accounts', resource: 'accounts', action: 'read' }
          ]},
          { id: '4', name: 'support', description: 'Support Representative', permissions: [
            { id: '1', name: 'accounts:read', description: 'Read accounts', resource: 'accounts', action: 'read' }
          ]},
          { id: '5', name: 'user', description: 'Standard User', permissions: [] }
        ]);
      }

      // Load permissions from backend
      try {
        const permissionsData = await apiService.getRBACPermissions();
        setPermissions(permissionsData);
      } catch (err) {
        console.log('Using mock permissions data');
        setPermissions([
          { id: '1', name: 'accounts:read', description: 'Read accounts', resource: 'accounts', action: 'read' },
          { id: '2', name: 'accounts:write', description: 'Create/update accounts', resource: 'accounts', action: 'write' },
          { id: '3', name: 'accounts:delete', description: 'Delete accounts', resource: 'accounts', action: 'delete' },
          { id: '4', name: 'contacts:read', description: 'Read contacts', resource: 'contacts', action: 'read' },
          { id: '5', name: 'contacts:write', description: 'Create/update contacts', resource: 'contacts', action: 'write' },
          { id: '6', name: 'tasks:read', description: 'Read tasks', resource: 'tasks', action: 'read' },
          { id: '7', name: 'tasks:write', description: 'Create/update tasks', resource: 'tasks', action: 'write' },
          { id: '8', name: 'users:read', description: 'Read users', resource: 'users', action: 'read' },
          { id: '9', name: 'users:write', description: 'Create/update users', resource: 'users', action: 'write' },
          { id: '10', name: 'roles:read', description: 'Read roles', resource: 'roles', action: 'read' },
          { id: '11', name: 'roles:write', description: 'Create/update roles', resource: 'roles', action: 'write' },
          { id: '12', name: 'system:admin', description: 'Full system access', resource: 'system', action: 'admin' }
        ]);
      }

      const usersData = await apiService.getAllUsers();
      setUsers(usersData);
    } catch (err: any) {
      setError(err.message || 'Failed to load RBAC data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRole = () => {
    setEditingRole(null);
    setRoleForm({ name: '', description: '', permissions: [] });
    setSelectedPermissions([]);
    setShowRoleDialog(true);
  };

  const handleEditRole = (role: Role) => {
    setEditingRole(role);
    setRoleForm({
      name: role.name,
      description: role.description || '',
      permissions: role.permissions.map(p => p.id)
    });
    setSelectedPermissions(role.permissions.map(p => p.id));
    setShowRoleDialog(true);
  };

  const handleDeleteRole = async (roleId: string) => {
    if (window.confirm('Are you sure you want to delete this role?')) {
      try {
        await apiService.deleteRBACRole(roleId);
        setSuccess('Role deleted successfully');
        loadData();
      } catch (err: any) {
        setError(err.message || 'Failed to delete role');
      }
    }
  };

  const handleSaveRole = async () => {
    try {
      if (editingRole) {
        await apiService.updateRBACRole(editingRole.id, roleForm);
        setSuccess('Role updated successfully');
      } else {
        await apiService.createRBACRole(roleForm);
        setSuccess('Role created successfully');
      }
      setShowRoleDialog(false);
      setEditingRole(null);
      loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to save role');
    }
  };

  const handleAssignRole = (user: User) => {
    setSelectedUser(user);
    // Extract role ID from user.role (could be object or string)
    let roleId = '';
    if (user.role) {
      if (typeof user.role === 'object' && 'id' in user.role) {
        roleId = user.role.id;
      } else if (typeof user.role === 'string') {
        // If it's a string, we need to find the role by name to get the ID
        const role = roles.find(r => r.name === user.role);
        roleId = role?.id || '';
      }
    }
    setSelectedRoleId(roleId);
    setShowUserRoleDialog(true);
  };

  const handleSaveUserRole = async () => {
    try {
      if (selectedUser && selectedRoleId) {
        await apiService.assignRoleToUser(selectedUser.id, selectedRoleId);
        setSuccess('Role assigned successfully');
      }
      setShowUserRoleDialog(false);
      loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to assign role');
    }
  };

  const handleInitializeRBAC = async () => {
    try {
      await apiService.initializeRBAC();
      setSuccess('System RBAC initialized successfully');
      loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to initialize RBAC');
    }
  };

  const getRoleName = (role: any) => {
    if (!role) return null;
    
    // Handle case where role is an object (from relations)
    if (typeof role === 'object' && role.name) {
      return role.name;
    }
    
    // Handle case where role is a string
    if (typeof role === 'string') {
      return role;
    }
    
    return null;
  };

  const getRoleColor = (roleName: string) => {
    const colors: Record<string, "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning"> = {
      admin: 'error',
      manager: 'warning',
      sales: 'success',
      support: 'info',
      user: 'default'
    };
    return colors[roleName] || 'default';
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography>Loading RBAC data...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          <SecurityIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Role-Based Access Control
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={handleInitializeRBAC}
          startIcon={<SecurityIcon />}
        >
          Initialize System RBAC
        </Button>
      </Box>
      


      <Paper sx={{ width: '100%' }}>
        <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
          <Tab label="Roles" icon={<GroupIcon />} />
          <Tab label="Permissions" icon={<SecurityIcon />} />
          <Tab label="User Assignments" icon={<PersonIcon />} />
        </Tabs>

        {/* Roles Tab */}
        {activeTab === 0 && (
          <Box p={3}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">Roles Management</Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleCreateRole}
              >
                Create Role
              </Button>
            </Box>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>Permissions</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {roles.map((role) => (
                    <TableRow key={role.id}>
                      <TableCell>
                        <Typography variant="subtitle2">{role.name}</Typography>
                      </TableCell>
                      <TableCell>{role.description}</TableCell>
                      <TableCell>
                        <Box display="flex" flexWrap="wrap" gap={0.5}>
                          {role.permissions.length > 0 ? (
                            <>
                              {role.permissions.slice(0, 3).map((perm) => (
                                <Chip
                                  key={perm.id}
                                  label={perm.name}
                                  size="small"
                                  variant="outlined"
                                  color="primary"
                                />
                              ))}
                              {role.permissions.length > 3 && (
                                <Chip
                                  label={`+${role.permissions.length - 3} more`}
                                  size="small"
                                  variant="outlined"
                                  color="secondary"
                                />
                              )}
                            </>
                          ) : (
                            <Typography variant="caption" color="text.secondary">
                              No permissions
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Button 
                          size="small" 
                          onClick={() => handleEditRole(role)} 
                          sx={{ mr: 1 }}
                          startIcon={<EditIcon />}
                        >
                          Edit
                        </Button>
                        <IconButton onClick={() => handleDeleteRole(role.id)} color="error">
                          <DeleteIcon />
                        </IconButton>

                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {/* Permissions Tab */}
        {activeTab === 1 && (
          <Box p={3}>
            <Typography variant="h6" mb={2}>Permissions Management</Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>Resource</TableCell>
                    <TableCell>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {permissions.map((permission) => (
                    <TableRow key={permission.id}>
                      <TableCell>
                        <Typography variant="subtitle2">{permission.name}</Typography>
                      </TableCell>
                      <TableCell>{permission.description}</TableCell>
                      <TableCell>{permission.resource}</TableCell>
                      <TableCell>{permission.action}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {/* User Assignments Tab */}
        {activeTab === 2 && (
          <Box p={3}>
            <Typography variant="h6" mb={2}>User Role Assignments</Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Current Role</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Chip
                          label={getRoleName(user.role || user.legacyRole) || 'No Role'}
                          color={getRoleColor(getRoleName(user.role || user.legacyRole) || '')}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => handleAssignRole(user)}
                        >
                          Assign Role
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}
      </Paper>

      {/* Role Dialog */}
      <Dialog 
        open={showRoleDialog} 
        onClose={(event, reason) => {
          console.log('Dialog closing, reason:', reason);
          setShowRoleDialog(false);
        }} 
        maxWidth="md" 
        fullWidth
        disableEscapeKeyDown={false}
        keepMounted={false}
      >
        <DialogTitle>{editingRole ? 'Edit Role' : 'Create Role'}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Role Name"
            value={roleForm.name}
            onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })}
            sx={{ mt: 2, mb: 2 }}
          />
          <TextField
            fullWidth
            label="Description"
            multiline
            rows={3}
            value={roleForm.description}
            onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })}
            sx={{ mb: 2 }}
          />
          
          <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
            Permissions
          </Typography>
          <Box sx={{ maxHeight: 300, overflow: 'auto', border: '1px solid #ddd', borderRadius: 1, p: 1 }}>
            {permissions.map((permission) => (
              <Box key={permission.id} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <input
                  type="checkbox"
                  id={`perm-${permission.id}`}
                  checked={roleForm.permissions.includes(permission.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setRoleForm({
                        ...roleForm,
                        permissions: [...roleForm.permissions, permission.id]
                      });
                    } else {
                      setRoleForm({
                        ...roleForm,
                        permissions: roleForm.permissions.filter(id => id !== permission.id)
                      });
                    }
                  }}
                  style={{ marginRight: 8 }}
                />
                <label htmlFor={`perm-${permission.id}`} style={{ cursor: 'pointer', flex: 1 }}>
                  <Typography variant="body2" fontWeight="bold">
                    {permission.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {permission.description}
                  </Typography>
                </label>
              </Box>
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowRoleDialog(false)}>Cancel</Button>
          <Button onClick={handleSaveRole} variant="contained">
            {editingRole ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* User Role Assignment Dialog */}
      <Dialog open={showUserRoleDialog} onClose={() => setShowUserRoleDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Assign Role to User</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1 }}>
            <Typography variant="subtitle1" gutterBottom>
              User: {selectedUser?.name} ({selectedUser?.email})
            </Typography>
            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel>Role</InputLabel>
              <Select
                value={selectedRoleId}
                onChange={(e) => setSelectedRoleId(e.target.value)}
                label="Role"
              >
                <MenuItem value="">
                  <em>No Role</em>
                </MenuItem>
                {roles.map((role) => (
                  <MenuItem key={role.id} value={role.id}>
                    {role.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowUserRoleDialog(false)}>Cancel</Button>
          <Button onClick={handleSaveUserRole} variant="contained">
            Assign Role
          </Button>
        </DialogActions>
      </Dialog>

      {/* Notifications */}
      <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError('')}>
        <Alert onClose={() => setError('')} severity="error">
          {error}
        </Alert>
      </Snackbar>

      <Snackbar open={!!success} autoHideDuration={6000} onClose={() => setSuccess('')}>
        <Alert onClose={() => setSuccess('')} severity="success">
          {success}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default RBACManager; 