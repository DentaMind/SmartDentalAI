import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Divider,
  useTheme
} from '@mui/material';
import { format, eachHourOfInterval, startOfDay, endOfDay, addHours } from 'date-fns';
import { Droppable } from 'react-beautiful-dnd';

import { AppointmentCard } from './AppointmentCard';

interface TimeGridProps {
  selectedDate: Date;
  appointments: Appointment[];
  availability: Record<string, TimeSlot[]>;
  businessHours: {
    start: number;
    end: number;
  };
  isLoading: boolean;
  onTimeSlotClick: (time: Date) => void;
}

const HOUR_HEIGHT = 60; // Height in pixels for one hour
const TIME_SLOT_HEIGHT = 15; // Height in pixels for 15-minute slots

export const TimeGrid: React.FC<TimeGridProps> = ({
  selectedDate,
  appointments,
  availability,
  businessHours,
  isLoading,
  onTimeSlotClick
}) => {
  const theme = useTheme();
  
  // Generate hours for the day
  const dayStart = startOfDay(selectedDate);
  const dayEnd = endOfDay(selectedDate);
  const hours = eachHourOfInterval({
    start: addHours(dayStart, businessHours.start),
    end: addHours(dayStart, businessHours.end)
  });
  
  // Get available time slots for the day
  const dayAvailability = availability[format(selectedDate, 'yyyy-MM-dd')] || [];
  
  // Filter appointments for the selected day
  const dayAppointments = appointments.filter(
    (appt) => format(new Date(appt.start_time), 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd')
  );
  
  return (
    <Box sx={{ position: 'relative', height: (businessHours.end - businessHours.start) * HOUR_HEIGHT }}>
      {/* Time markers */}
      <Box sx={{ position: 'absolute', left: 0, top: 0, width: '60px', height: '100%' }}>
        {hours.map((hour) => (
          <Box
            key={hour.toISOString()}
            sx={{
              height: HOUR_HEIGHT,
              borderBottom: `1px solid ${theme.palette.divider}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Typography variant="caption">
              {format(hour, 'h a')}
            </Typography>
          </Box>
        ))}
      </Box>
      
      {/* Time slots grid */}
      <Droppable droppableId="time-grid" direction="vertical">
        {(provided) => (
          <Box
            ref={provided.innerRef}
            {...provided.droppableProps}
            sx={{
              marginLeft: '60px',
              height: '100%',
              position: 'relative',
              backgroundColor: theme.palette.background.default
            }}
          >
            {/* Time slot lines */}
            {hours.map((hour) => (
              <React.Fragment key={hour.toISOString()}>
                {[0, 15, 30, 45].map((minutes) => {
                  const slotTime = addHours(hour, minutes / 60);
                  const isAvailable = dayAvailability.some(
                    (slot) =>
                      format(new Date(slot.start_time), 'HH:mm') ===
                      format(slotTime, 'HH:mm')
                  );
                  
                  return (
                    <Box
                      key={`${hour.toISOString()}-${minutes}`}
                      onClick={() => onTimeSlotClick(slotTime)}
                      sx={{
                        position: 'absolute',
                        top: (hour.getHours() - businessHours.start) * HOUR_HEIGHT + (minutes / 60) * HOUR_HEIGHT,
                        left: 0,
                        right: 0,
                        height: TIME_SLOT_HEIGHT,
                        borderBottom: `1px dashed ${theme.palette.divider}`,
                        backgroundColor: isAvailable
                          ? theme.palette.success.light
                          : 'transparent',
                        opacity: 0.1,
                        cursor: 'pointer',
                        '&:hover': {
                          opacity: 0.2
                        }
                      }}
                    />
                  );
                })}
              </React.Fragment>
            ))}
            
            {/* Appointments */}
            {dayAppointments.map((appointment) => {
              const start = new Date(appointment.start_time);
              const end = new Date(appointment.end_time);
              const duration = (end.getTime() - start.getTime()) / (1000 * 60); // Duration in minutes
              const topPosition =
                (start.getHours() - businessHours.start) * HOUR_HEIGHT +
                (start.getMinutes() / 60) * HOUR_HEIGHT;
              const height = (duration / 60) * HOUR_HEIGHT;
              
              return (
                <AppointmentCard
                  key={appointment.id}
                  appointment={appointment}
                  style={{
                    position: 'absolute',
                    top: topPosition,
                    height: height,
                    left: 0,
                    right: 0,
                    margin: '0 8px'
                  }}
                />
              );
            })}
            {provided.placeholder}
          </Box>
        )}
      </Droppable>
    </Box>
  );
};

export default TimeGrid; 