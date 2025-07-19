import React, { useState, useEffect } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  closestCenter,
  useSensor,
  useSensors,
  PointerSensor,
  KeyboardSensor,
  DragOverlay,
  useDroppable,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import {
  CSS,
} from '@dnd-kit/utilities';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Avatar,
  IconButton,
  Tooltip,
  Paper,
  Badge,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  Schedule as ScheduleIcon,
  Flag as FlagIcon,
} from '@mui/icons-material';
import { Task } from '../types';

interface KanbanBoardProps {
  tasks: Task[];
  onTaskUpdate: (taskId: string, updates: Partial<Task>) => void;
  onTaskClick: (task: Task) => void;
  onTaskEdit: (task: Task) => void;
}

interface TaskCardProps {
  task: Task;
  onTaskClick: (task: Task) => void;
  onTaskEdit: (task: Task) => void;
}

interface DroppableColumnProps {
  id: string;
  children: React.ReactNode;
  status: string;
}

const DroppableColumn: React.FC<DroppableColumnProps> = ({ id, children, status }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
  });

  return (
    <Box
      ref={setNodeRef}
      sx={{
        minHeight: 200,
        backgroundColor: isOver ? 'action.hover' : 'transparent',
        transition: 'background-color 0.2s ease',
        borderRadius: 1,
      }}
    >
      {children}
    </Box>
  );
};

const TaskCard: React.FC<TaskCardProps> = ({ task, onTaskClick, onTaskEdit }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'error';
      case 'Medium': return 'warning';
      case 'Low': return 'success';
      default: return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'To Do': return 'primary';
      case 'In Progress': return 'warning';
      case 'Completed': return 'success';
      case 'Cancelled': return 'error';
      default: return 'default';
    }
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      sx={{
        mb: 2,
        cursor: 'grab',
        '&:active': { cursor: 'grabbing' },
        '&:hover': { boxShadow: 2 },
      }}
      onClick={() => onTaskClick(task)}
    >
      <CardContent sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
          <Box 
            sx={{ flex: 1 }}
            {...attributes}
            {...listeners}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              {task.title}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <Tooltip title="Edit Task">
              <IconButton
                size="small"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onTaskEdit(task);
                }}
                color="primary"
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        <Box {...attributes} {...listeners}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            {task.description.substring(0, 100)}...
          </Typography>

          <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap' }}>
            <Chip
              label={task.status}
              color={getStatusColor(task.status) as any}
              size="small"
            />
            <Chip
              label={task.priority}
              color={getPriorityColor(task.priority) as any}
              size="small"
            />
          </Box>

          {task.dueDate && (
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <ScheduleIcon sx={{ fontSize: 14, mr: 0.5, color: 'text.secondary' }} />
              <Typography variant="caption" color="text.secondary">
                {new Date(task.dueDate).toLocaleDateString()}
              </Typography>
            </Box>
          )}

          {task.assignedTo && (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <PersonIcon sx={{ fontSize: 14, mr: 0.5, color: 'text.secondary' }} />
                <Typography variant="caption" color="text.secondary">
                  {Array.isArray(task.assignedTo) ? task.assignedTo.join(', ') : task.assignedTo}
                </Typography>
              </Box>
              <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem' }}>
                {Array.isArray(task.assignedTo) 
                  ? task.assignedTo[0]?.charAt(0) || '?'
                  : task.assignedTo?.charAt(0) || '?'
                }
              </Avatar>
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

const KanbanBoard: React.FC<KanbanBoardProps> = ({ tasks, onTaskUpdate, onTaskClick, onTaskEdit }) => {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [columns, setColumns] = useState({
    'To Do': tasks.filter(task => task.status === 'To Do'),
    'In Progress': tasks.filter(task => task.status === 'In Progress'),
    'Completed': tasks.filter(task => task.status === 'Completed'),
    'Cancelled': tasks.filter(task => task.status === 'Cancelled'),
  });

  // Update columns when tasks prop changes
  useEffect(() => {
    setColumns({
      'To Do': tasks.filter(task => task.status === 'To Do'),
      'In Progress': tasks.filter(task => task.status === 'In Progress'),
      'Completed': tasks.filter(task => task.status === 'Completed'),
      'Cancelled': tasks.filter(task => task.status === 'Cancelled'),
    });
  }, [tasks]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor)
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    if (activeId === overId) return;

    // Check if we're dropping on a task or a column
    const task = tasks.find(t => t.id === activeId);
    const targetTask = tasks.find(t => t.id === overId);
    
    if (!task) {
      console.warn('Task not found:', activeId);
      return;
    }

    let newStatus: 'To Do' | 'In Progress' | 'Completed' | 'Cancelled';

    if (targetTask) {
      // Dropping on another task - use that task's status
      newStatus = targetTask.status;
    } else {
      // Dropping on a column - overId should be the status
      if (overId === 'To Do' || overId === 'In Progress' || overId === 'Completed' || overId === 'Cancelled') {
        newStatus = overId;
      } else {
        console.warn('Invalid status value:', { overId });
        return;
      }
    }

    // Validate that newStatus is a valid column key
    if (!Object.keys(columns).includes(newStatus)) {
      console.warn('Invalid status:', { newStatus, taskId: activeId });
      return;
    }
    
    if (newStatus !== task.status) {
      // Update the task status
      onTaskUpdate(activeId, { status: newStatus });
      
      // Update local state
      setColumns(prev => {
        const newColumns = { ...prev };
        
        // Remove from old column
        Object.keys(newColumns).forEach(status => {
          if (Array.isArray(newColumns[status as keyof typeof columns])) {
            newColumns[status as keyof typeof columns] = newColumns[status as keyof typeof columns].filter(t => t.id !== activeId);
          }
        });
        
        // Add to new column
        const updatedTask = { ...task, status: newStatus };
        if (Array.isArray(newColumns[newStatus])) {
          newColumns[newStatus] = [...newColumns[newStatus], updatedTask];
        } else {
          // Fallback: ensure the column is an array
          newColumns[newStatus] = [updatedTask];
        }
        
        return newColumns;
      });
    }
  };

  const getColumnTitle = (status: string) => {
    switch (status) {
      case 'To Do': return 'To Do';
      case 'In Progress': return 'In Progress';
      case 'Completed': return 'Completed';
      case 'Cancelled': return 'Cancelled';
      default: return status;
    }
  };

  const getColumnColor = (status: string) => {
    switch (status) {
      case 'To Do': return '#1976d2';
      case 'In Progress': return '#ed6c02';
      case 'Completed': return '#2e7d32';
      case 'Cancelled': return '#d32f2f';
      default: return '#666';
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <Box sx={{ display: 'flex', gap: 2, height: 'calc(100vh - 300px)', overflow: 'auto' }}>
        {Object.entries(columns).map(([status, columnTasks]) => (
          <Paper
            key={status}
            sx={{
              minWidth: 300,
              maxWidth: 350,
              height: 'fit-content',
              backgroundColor: 'background.paper',
              border: `2px solid ${getColumnColor(status)}20`,
            }}
          >
            <Box
              sx={{
                p: 2,
                borderBottom: `2px solid ${getColumnColor(status)}`,
                backgroundColor: `${getColumnColor(status)}10`,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="h6" sx={{ fontWeight: 600, color: getColumnColor(status) }}>
                  {getColumnTitle(status)}
                </Typography>
                <Badge badgeContent={columnTasks.length} color="primary" />
              </Box>
            </Box>
            
            <DroppableColumn id={`column-${status}`} status={status}>
              <Box sx={{ p: 2 }}>
                <SortableContext items={columnTasks.map(task => task.id)} strategy={verticalListSortingStrategy}>
                  {columnTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onTaskClick={onTaskClick}
                      onTaskEdit={onTaskEdit}
                    />
                  ))}
                </SortableContext>
                
                {columnTasks.length === 0 && (
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: 100,
                      border: '2px dashed #ddd',
                      borderRadius: 1,
                      color: 'text.secondary',
                    }}
                  >
                    <Typography variant="body2">No tasks</Typography>
                  </Box>
                )}
              </Box>
            </DroppableColumn>
          </Paper>
        ))}
      </Box>
      
      <DragOverlay>
        {activeId ? (
          <Card sx={{ width: 300, opacity: 0.8 }}>
            <CardContent>
              <Typography variant="subtitle2">
                {tasks.find(t => t.id === activeId)?.title}
              </Typography>
            </CardContent>
          </Card>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

export default KanbanBoard; 