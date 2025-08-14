import React, { useMemo, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Box,
  Chip,
  LinearProgress,
  IconButton,
  Tooltip
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Flag as FlagIcon } from '@mui/icons-material';
import { Task, Category } from '../types';

interface SortConfig {
  key: keyof Task;
  direction: 'asc' | 'desc';
}

interface TaskTableProps {
  tasks: Task[];
  categories: Category[];
  onRowClick?: (task: Task) => void;
  onEdit?: (task: Task) => void;
  onDelete?: (taskId: string) => void;
}

const TaskTable: React.FC<TaskTableProps> = ({ tasks, categories, onRowClick, onEdit, onDelete }) => {
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'dueDate', direction: 'asc' });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'success';
      case 'In Progress': return 'warning';
      case 'To Do': return 'default';
      case 'Cancelled': return 'error';
      default: return 'default';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'error';
      case 'Medium': return 'warning';
      case 'Low': return 'success';
      default: return 'default';
    }
  };

  const getCategoryDisplay = (task: Task) => {
    if (!task.categoryId) return null;
    const category = categories.find(c => c.id === task.categoryId);
    if (!category) return null;
    return (
      <Chip
        label={category.name}
        size="small"
        sx={{ backgroundColor: category.color, color: 'white', '& .MuiChip-label': { color: 'white' } }}
      />
    );
  };

  const isOverdue = (dueDate: string, status: string) => {
    return new Date(dueDate) < new Date() && status !== 'Completed';
  };

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString();

  const getAssignedToDisplay = (task: Task) => Array.isArray(task.assignedTo) ? task.assignedTo.join(', ') : task.assignedTo;

  const handleSort = (key: keyof Task) => {
    setSortConfig(prev => ({ key, direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc' }));
  };

  const sortedTasks = useMemo(() => {
    const arr = [...tasks];
    arr.sort((a, b) => {
      const aValue = a[sortConfig.key] as any;
      const bValue = b[sortConfig.key] as any;
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const comp = aValue.localeCompare(bValue);
        return sortConfig.direction === 'asc' ? comp : -comp;
      }
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        const comp = aValue - bValue;
        return sortConfig.direction === 'asc' ? comp : -comp;
      }
      const aTime = new Date(aValue).getTime();
      const bTime = new Date(bValue).getTime();
      const comp = aTime - bTime;
      return sortConfig.direction === 'asc' ? comp : -comp;
    });
    return arr;
  }, [tasks, sortConfig]);

  const SortableHeader: React.FC<{ field: keyof Task; width?: string; children: React.ReactNode }> = ({ field, width, children }) => (
    <TableCell
      sx={{ cursor: 'pointer', userSelect: 'none', width, '&:hover': { backgroundColor: 'action.hover' } }}
      onClick={() => handleSort(field)}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        {children}
      </Box>
    </TableCell>
  );

  if (sortedTasks.length === 0) {
    return (
      <Paper>
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No tasks found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Adjust filters or create a new task
          </Typography>
        </Box>
      </Paper>
    );
  }

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <SortableHeader field="title" width="20%">Title</SortableHeader>
            <SortableHeader field="accountName" width="12%">Account</SortableHeader>
            <SortableHeader field="status" width="8%">Status</SortableHeader>
            <SortableHeader field="priority" width="8%">Priority</SortableHeader>
            <TableCell width="8%">Category</TableCell>
            <SortableHeader field="progress" width="8%">Progress</SortableHeader>
            <SortableHeader field="dueDate" width="10%">Due Date</SortableHeader>
            <SortableHeader field="assignedTo" width="12%">Assigned To</SortableHeader>
            <TableCell width="4%">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {sortedTasks.map((task) => (
            <TableRow
              key={task.id}
              hover
              sx={{ cursor: onRowClick ? 'pointer' : 'default', '&:hover': { backgroundColor: 'action.hover' } }}
              onClick={() => onRowClick && onRowClick(task)}
            >
              <TableCell>
                <Box>
                  <Typography variant="subtitle2" sx={{ '&:hover': { textDecoration: onRowClick ? 'underline' : 'none' } }}>
                    {task.title}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {task.description.substring(0, 50)}...
                  </Typography>
                </Box>
              </TableCell>
              <TableCell>
                <Typography variant="body2">{task.accountName}</Typography>
              </TableCell>
              <TableCell>
                <Chip label={task.status} color={getStatusColor(task.status) as any} size="small" />
              </TableCell>
              <TableCell>
                <Chip label={task.priority} color={getPriorityColor(task.priority) as any} size="small" />
              </TableCell>
              <TableCell>{getCategoryDisplay(task)}</TableCell>
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LinearProgress variant="determinate" value={task.progress} sx={{ width: 60, height: 8 }} />
                  <Typography variant="caption">{task.progress}%</Typography>
                </Box>
              </TableCell>
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Typography
                    variant="body2"
                    sx={{ color: isOverdue(task.dueDate, task.status) ? 'error.main' : 'inherit' }}
                  >
                    {formatDate(task.dueDate)}
                  </Typography>
                  {isOverdue(task.dueDate, task.status) && task.status !== 'Completed' && (
                    <FlagIcon sx={{ fontSize: 16, color: 'error.main' }} />
                  )}
                </Box>
              </TableCell>
              <TableCell>
                <Typography variant="body2">{getAssignedToDisplay(task)}</Typography>
              </TableCell>
              <TableCell>
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                  {onEdit && (
                    <Tooltip title="Edit Task">
                      <IconButton size="small" onClick={(e) => { e.stopPropagation(); onEdit(task); }} color="primary">
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                  {onDelete && (
                    <Tooltip title="Delete Task">
                      <IconButton size="small" onClick={(e) => { e.stopPropagation(); onDelete(task.id); }} color="error">
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default TaskTable;


