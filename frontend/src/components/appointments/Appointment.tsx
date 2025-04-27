import React from 'react';
import { useAppointmentEvents } from '@/hooks/useAppointmentEvents';
import { useQuery } from 'react-query';
import { apiRequest } from '@/lib/apiRequest';
import { queryClient } from '@/lib/queryClient';

export const Appointment: React.FC<{ patientId: number; appointmentId: number }> = ({ patientId, appointmentId }) => {
  const {
    collectAppointmentUpdated,
    collectAppointmentCancelled,
    collectAppointmentRescheduled,
    collectAppointmentConfirmed,
    collectAppointmentCheckedIn,
    collectAppointmentCompleted,
    collectAppointmentNoteAdded,
    collectAppointmentNoteUpdated,
    collectReminderSent,
    collectDurationChanged,
    collectLocationChanged
  } = useAppointmentEvents();

  const { data: appointment, isLoading } = useQuery<Appointment>(
    ['appointment', appointmentId],
    () => fetchAppointment(appointmentId)
  );

  const handleAppointmentUpdate = async (updates: Partial<Appointment>) => {
    try {
      const response = await apiRequest('PATCH', `/api/appointments/${appointmentId}`, updates);
      await collectAppointmentUpdated(patientId, appointmentId, {
        originalValue: appointment,
        newValue: { ...appointment, ...updates },
        source: 'user'
      });
      queryClient.invalidateQueries(['appointment', appointmentId]);
    } catch (error) {
      console.error('Failed to update appointment:', error);
    }
  };

  const handleAppointmentCancel = async (reason: string) => {
    try {
      const response = await apiRequest('POST', `/api/appointments/${appointmentId}/cancel`, { reason });
      await collectAppointmentCancelled(patientId, appointmentId, reason, {
        source: 'user'
      });
      queryClient.invalidateQueries(['appointment', appointmentId]);
    } catch (error) {
      console.error('Failed to cancel appointment:', error);
    }
  };

  const handleAppointmentReschedule = async (newDateTime: Date) => {
    try {
      const response = await apiRequest('POST', `/api/appointments/${appointmentId}/reschedule`, { dateTime: newDateTime });
      await collectAppointmentRescheduled(patientId, appointmentId, {
        originalValue: appointment?.dateTime,
        newValue: newDateTime,
        source: 'user'
      });
      queryClient.invalidateQueries(['appointment', appointmentId]);
    } catch (error) {
      console.error('Failed to reschedule appointment:', error);
    }
  };

  const handleAppointmentConfirm = async () => {
    try {
      const response = await apiRequest('POST', `/api/appointments/${appointmentId}/confirm`);
      await collectAppointmentConfirmed(patientId, appointmentId, {
        source: 'user'
      });
      queryClient.invalidateQueries(['appointment', appointmentId]);
    } catch (error) {
      console.error('Failed to confirm appointment:', error);
    }
  };

  const handleAppointmentCheckIn = async () => {
    try {
      const response = await apiRequest('POST', `/api/appointments/${appointmentId}/check-in`);
      await collectAppointmentCheckedIn(patientId, appointmentId, {
        source: 'user'
      });
      queryClient.invalidateQueries(['appointment', appointmentId]);
    } catch (error) {
      console.error('Failed to check in appointment:', error);
    }
  };

  const handleAppointmentComplete = async () => {
    try {
      const response = await apiRequest('POST', `/api/appointments/${appointmentId}/complete`);
      await collectAppointmentCompleted(patientId, appointmentId, {
        source: 'user'
      });
      queryClient.invalidateQueries(['appointment', appointmentId]);
    } catch (error) {
      console.error('Failed to complete appointment:', error);
    }
  };

  const handleNoteAdd = async (noteContent: string) => {
    try {
      const response = await apiRequest('POST', `/api/appointments/${appointmentId}/notes`, { content: noteContent });
      await collectAppointmentNoteAdded(patientId, appointmentId, response.data.noteId, {
        source: 'user'
      });
      queryClient.invalidateQueries(['appointment', appointmentId]);
    } catch (error) {
      console.error('Failed to add note:', error);
    }
  };

  const handleNoteUpdate = async (noteId: number, updates: any) => {
    try {
      const response = await apiRequest('PATCH', `/api/appointments/${appointmentId}/notes/${noteId}`, updates);
      await collectAppointmentNoteUpdated(patientId, appointmentId, noteId, {
        originalValue: appointment?.notes?.find(n => n.id === noteId),
        newValue: updates,
        source: 'user'
      });
      queryClient.invalidateQueries(['appointment', appointmentId]);
    } catch (error) {
      console.error('Failed to update note:', error);
    }
  };

  const handleReminderSend = async (reminderType: string) => {
    try {
      const response = await apiRequest('POST', `/api/appointments/${appointmentId}/reminders`, { type: reminderType });
      await collectReminderSent(patientId, appointmentId, reminderType, {
        source: 'user'
      });
    } catch (error) {
      console.error('Failed to send reminder:', error);
    }
  };

  const handleDurationChange = async (duration: number) => {
    try {
      const response = await apiRequest('PATCH', `/api/appointments/${appointmentId}`, { duration });
      await collectDurationChanged(patientId, appointmentId, duration, {
        originalValue: appointment?.duration,
        newValue: duration,
        source: 'user'
      });
      queryClient.invalidateQueries(['appointment', appointmentId]);
    } catch (error) {
      console.error('Failed to change duration:', error);
    }
  };

  const handleLocationChange = async (location: string) => {
    try {
      const response = await apiRequest('PATCH', `/api/appointments/${appointmentId}`, { location });
      await collectLocationChanged(patientId, appointmentId, location, {
        originalValue: appointment?.location,
        newValue: location,
        source: 'user'
      });
      queryClient.invalidateQueries(['appointment', appointmentId]);
    } catch (error) {
      console.error('Failed to change location:', error);
    }
  };

  return (
    // ... existing JSX ...
  );
}; 