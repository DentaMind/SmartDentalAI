import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  ChevronLeft as PrevIcon,
  ChevronRight as NextIcon,
  Add as AddIcon,
  Event as EventIcon,
  AccessTime as TimeIcon
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, addDays, subDays, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

import { fetchProviders, fetchAppointments, fetchAvailability } from '@/api/scheduler';
import { AppointmentDialog } from './AppointmentDialog';
import { TimeGrid } from './TimeGrid';
import { AppointmentCard } from './AppointmentCard';
import { ErrorBoundary } from '@/components/ErrorBoundary';

interface Provider {
  id: number;
  name: string;
  role: string;
  specialties: string[];
}

interface Appointment {
  id: number;
  provider_id: number;
  patient_id: number;
  start_time: string;
  end_time: string;
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
  type: string;
  notes?: string;
}

interface TimeSlot {
  start_time: string;
  end_time: string;
  is_available: boolean;
}

const BUSINESS_HOURS = {
  start: 8, // 8 AM
  end: 18   // 6 PM
};

const ProviderCalendar: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedProvider, setSelectedProvider] = useState<number | null>(null);
  const [showAppointmentDialog, setShowAppointmentDialog] = useState(false);
  const [draggedAppointment, setDraggedAppointment] = useState<Appointment | null>(null);
  
  const queryClient = useQueryClient();
  
  // Fetch providers
  const {
    data: providers,
    isLoading: providersLoading,
    error: providersError
  } = useQuery<Provider[]>(['providers'], fetchProviders);
  
  // Fetch appointments for the selected week
  const weekStart = startOfWeek(selectedDate);
  const weekEnd = endOfWeek(selectedDate);
  
  const {
    data: appointments,
    isLoading: appointmentsLoading,
    error: appointmentsError
  } = useQuery<Appointment[]>(
    ['appointments', selectedProvider, weekStart, weekEnd],
    () => fetchAppointments(selectedProvider, weekStart, weekEnd),
    { enabled: !!selectedProvider }
  );
  
  // Fetch availability
  const {
    data: availability,
    isLoading: availabilityLoading,
    error: availabilityError
  } = useQuery<Record<string, TimeSlot[]>>(
    ['availability', selectedProvider, weekStart, weekEnd],
    () => fetchAvailability(selectedProvider!, weekStart, weekEnd),
    { enabled: !!selectedProvider }
  );
  
  // Navigation handlers
  const handlePrevWeek = () => setSelectedDate(subDays(selectedDate, 7));
  const handleNextWeek = () => setSelectedDate(addDays(selectedDate, 7));
  const handleToday = () => setSelectedDate(new Date());
  
  // Appointment handlers
  const handleNewAppointment = () => setShowAppointmentDialog(true);
  
  const handleDragEnd = (result: any) => {
    if (!result.destination || !draggedAppointment) return;
    
    // Calculate new appointment time based on drop location
    const newTime = calculateNewTime(result.destination.droppableId);
    
    // Update appointment through API
    updateAppointment.mutate({
      ...draggedAppointment,
      start_time: newTime.start,
      end_time: newTime.end
    });
    
    setDraggedAppointment(null);
  };
  
  // Update appointment mutation
  const updateAppointment = useMutation(
    (appointment: Appointment) => updateAppointmentApi(appointment),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['appointments']);
        queryClient.invalidateQueries(['availability']);
      }
    }
  );
  
  if (providersLoading || !providers) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }
  
  if (providersError) {
    return <Alert severity="error">Error loading providers</Alert>;
  }
  
  return (
    <ErrorBoundary>
      <Box sx={{ p: 3 }}>
        {/* Calendar Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4 }}>
          <Typography variant="h4" component="h1">
            Provider Calendar
          </Typography>
          <Box>
            <Button
              variant="outlined"
              startIcon={<EventIcon />}
              onClick={handleToday}
              sx={{ mr: 2 }}
            >
              Today
            </Button>
            <IconButton onClick={handlePrevWeek}>
              <PrevIcon />
            </IconButton>
            <IconButton onClick={handleNextWeek}>
              <NextIcon />
            </IconButton>
          </Box>
        </Box>
        
        {/* Provider Selector */}
        <Box sx={{ mb: 4 }}>
          <FormControl fullWidth>
            <InputLabel>Select Provider</InputLabel>
            <Select
              value={selectedProvider || ''}
              onChange={(e) => setSelectedProvider(e.target.value as number)}
            >
              {providers.map((provider) => (
                <MenuItem key={provider.id} value={provider.id}>
                  {provider.name} ({provider.role})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
        
        {/* Calendar Grid */}
        <DragDropContext onDragEnd={handleDragEnd}>
          <Paper sx={{ p: 2 }}>
            <TimeGrid
              selectedDate={selectedDate}
              appointments={appointments || []}
              availability={availability || {}}
              businessHours={BUSINESS_HOURS}
              isLoading={appointmentsLoading || availabilityLoading}
              onTimeSlotClick={(time) => {
                setDraggedAppointment(null);
                setShowAppointmentDialog(true);
              }}
            />
          </Paper>
        </DragDropContext>
        
        {/* New Appointment Button */}
        <Box sx={{ position: 'fixed', bottom: 24, right: 24 }}>
          <Tooltip title="New Appointment">
            <IconButton
              color="primary"
              size="large"
              onClick={handleNewAppointment}
              sx={{
                bgcolor: 'primary.main',
                color: 'white',
                '&:hover': { bgcolor: 'primary.dark' }
              }}
            >
              <AddIcon />
            </IconButton>
          </Tooltip>
        </Box>
        
        {/* Appointment Dialog */}
        <AppointmentDialog
          open={showAppointmentDialog}
          onClose={() => setShowAppointmentDialog(false)}
          providerId={selectedProvider}
          initialDate={selectedDate}
          onSave={async (appointmentData) => {
            // Handle appointment creation
            await createAppointment(appointmentData);
            setShowAppointmentDialog(false);
            queryClient.invalidateQueries(['appointments']);
          }}
        />
      </Box>
    </ErrorBoundary>
  );
};

export default ProviderCalendar; 