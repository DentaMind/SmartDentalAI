import React from 'react';
import {
  Box,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  useTheme
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as ConfirmIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { Draggable } from 'react-beautiful-dnd';

interface AppointmentCardProps {
  appointment: Appointment;
  style?: React.CSSProperties;
  onEdit?: () => void;
  onDelete?: () => void;
  onConfirm?: () => void;
  onCancel?: () => void;
}

const statusColors = {
  scheduled: 'primary',
  confirmed: 'success',
  completed: 'info',
  cancelled: 'error'
} as const;

export const AppointmentCard: React.FC<AppointmentCardProps> = ({
  appointment,
  style,
  onEdit,
  onDelete,
  onConfirm,
  onCancel
}) => {
  const theme = useTheme();
  
  return (
    <Draggable draggableId={`appointment-${appointment.id}`} index={appointment.id}>
      {(provided, snapshot) => (
        <Box
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          sx={{
            backgroundColor: theme.palette[statusColors[appointment.status]].light,
            borderLeft: `4px solid ${theme.palette[statusColors[appointment.status]].main}`,
            borderRadius: 1,
            padding: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: 0.5,
            cursor: 'grab',
            '&:hover': {
              boxShadow: theme.shadows[3]
            },
            ...style
          }}
        >
          {/* Time */}
          <Typography variant="caption" color="textSecondary">
            {format(new Date(appointment.start_time), 'h:mm a')} -{' '}
            {format(new Date(appointment.end_time), 'h:mm a')}
          </Typography>
          
          {/* Type & Status */}
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
            <Chip
              label={appointment.type}
              size="small"
              color={statusColors[appointment.status]}
            />
            <Chip
              label={appointment.status}
              size="small"
              variant="outlined"
              color={statusColors[appointment.status]}
            />
          </Box>
          
          {/* Actions */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 0.5,
              mt: 'auto'
            }}
          >
            {appointment.status === 'scheduled' && (
              <Tooltip title="Confirm">
                <IconButton
                  size="small"
                  color="success"
                  onClick={(e) => {
                    e.stopPropagation();
                    onConfirm?.();
                  }}
                >
                  <ConfirmIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            
            {['scheduled', 'confirmed'].includes(appointment.status) && (
              <>
                <Tooltip title="Edit">
                  <IconButton
                    size="small"
                    color="primary"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit?.();
                    }}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                
                <Tooltip title="Cancel">
                  <IconButton
                    size="small"
                    color="error"
                    onClick={(e) => {
                      e.stopPropagation();
                      onCancel?.();
                    }}
                  >
                    <CancelIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </>
            )}
            
            {appointment.status === 'cancelled' && (
              <Tooltip title="Delete">
                <IconButton
                  size="small"
                  color="error"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete?.();
                  }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </Box>
      )}
    </Draggable>
  );
};

export default AppointmentCard; 