import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AppointmentSlotList } from '../AppointmentSlotList';
import { calendarService } from '../../services/calendarService';

// Mock the calendar service
jest.mock('../../services/calendarService');

describe('AppointmentSlotList', () => {
  const mockProviders = [
    {
      id: 1,
      name: 'Dr. Smith',
      specialty: 'Dentist',
      email: 'dr.smith@example.com',
      phone: '123-456-7890',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    }
  ];

  const mockSlots = [
    {
      id: 1,
      provider_id: 1,
      start_time: '2024-01-01T09:00:00Z',
      end_time: '2024-01-01T10:00:00Z',
      appointment_type: 'Check-up',
      is_available: true,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    },
    {
      id: 2,
      provider_id: 1,
      start_time: '2024-01-01T11:00:00Z',
      end_time: '2024-01-01T12:00:00Z',
      appointment_type: 'Cleaning',
      is_available: false,
      patient_id: 1,
      notes: 'Regular cleaning',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    }
  ];

  beforeEach(() => {
    (calendarService.getProviders as jest.Mock).mockResolvedValue(mockProviders);
    (calendarService.getAppointmentSlots as jest.Mock).mockResolvedValue(mockSlots);
  });

  it('should render the list of appointment slots', async () => {
    render(<AppointmentSlotList />);

    // Wait for the slots to be loaded
    await waitFor(() => {
      expect(screen.getByText('Dr. Smith')).toBeInTheDocument();
    });

    // Check if appointment types are displayed
    expect(screen.getByText('Check-up')).toBeInTheDocument();
    expect(screen.getByText('Cleaning')).toBeInTheDocument();

    // Check if times are displayed
    expect(screen.getByText('1/1/2024, 9:00:00 AM - 1/1/2024, 10:00:00 AM')).toBeInTheDocument();
    expect(screen.getByText('1/1/2024, 11:00:00 AM - 1/1/2024, 12:00:00 PM')).toBeInTheDocument();

    // Check if booking status is displayed
    expect(screen.getByText('Booked')).toBeInTheDocument();
  });

  it('should open the add slot dialog when clicking the add button', async () => {
    render(<AppointmentSlotList />);

    // Wait for the slots to be loaded
    await waitFor(() => {
      expect(screen.getByText('Dr. Smith')).toBeInTheDocument();
    });

    // Click the add button
    fireEvent.click(screen.getByText('Add Slot'));

    // Check if the dialog is opened
    expect(screen.getByText('Add Appointment Slot')).toBeInTheDocument();
  });

  it('should open the edit slot dialog when clicking the edit button', async () => {
    render(<AppointmentSlotList />);

    // Wait for the slots to be loaded
    await waitFor(() => {
      expect(screen.getByText('Dr. Smith')).toBeInTheDocument();
    });

    // Click the edit button
    const editButtons = screen.getAllByLabelText('edit');
    fireEvent.click(editButtons[0]);

    // Check if the dialog is opened with the correct title
    expect(screen.getByText('Edit Appointment Slot')).toBeInTheDocument();
  });

  it('should delete a slot when clicking the delete button', async () => {
    render(<AppointmentSlotList />);

    // Wait for the slots to be loaded
    await waitFor(() => {
      expect(screen.getByText('Dr. Smith')).toBeInTheDocument();
    });

    // Mock the delete function
    (calendarService.deleteAppointmentSlot as jest.Mock).mockResolvedValue(undefined);

    // Click the delete button
    const deleteButtons = screen.getAllByLabelText('delete');
    fireEvent.click(deleteButtons[0]);

    // Check if the slot was deleted
    await waitFor(() => {
      expect(calendarService.deleteAppointmentSlot).toHaveBeenCalledWith(1);
    });
  });

  it('should book a slot when clicking the book button', async () => {
    render(<AppointmentSlotList />);

    // Wait for the slots to be loaded
    await waitFor(() => {
      expect(screen.getByText('Dr. Smith')).toBeInTheDocument();
    });

    // Mock the book function
    (calendarService.bookAppointmentSlot as jest.Mock).mockResolvedValue({
      ...mockSlots[0],
      is_available: false
    });

    // Click the book button
    const bookButtons = screen.getAllByLabelText('book');
    fireEvent.click(bookButtons[0]);

    // Check if the slot was booked
    await waitFor(() => {
      expect(calendarService.bookAppointmentSlot).toHaveBeenCalledWith(1, {
        patient_id: 1,
        notes: ''
      });
    });
  });

  it('should cancel a slot when clicking the cancel button', async () => {
    render(<AppointmentSlotList />);

    // Wait for the slots to be loaded
    await waitFor(() => {
      expect(screen.getByText('Dr. Smith')).toBeInTheDocument();
    });

    // Mock the cancel function
    (calendarService.cancelAppointmentSlot as jest.Mock).mockResolvedValue({
      ...mockSlots[1],
      is_available: true
    });

    // Click the cancel button
    const cancelButtons = screen.getAllByLabelText('cancel');
    fireEvent.click(cancelButtons[0]);

    // Check if the slot was cancelled
    await waitFor(() => {
      expect(calendarService.cancelAppointmentSlot).toHaveBeenCalledWith(2);
    });
  });

  it('should show an error message when fetching slots fails', async () => {
    // Mock the getAppointmentSlots function to throw an error
    (calendarService.getAppointmentSlots as jest.Mock).mockRejectedValue(
      new Error('Failed to fetch appointment slots')
    );

    render(<AppointmentSlotList />);

    // Wait for the error message to be displayed
    await waitFor(() => {
      expect(screen.getByText('Failed to fetch appointment slots')).toBeInTheDocument();
    });
  });

  it('should show an error message when creating a slot fails', async () => {
    render(<AppointmentSlotList />);

    // Wait for the slots to be loaded
    await waitFor(() => {
      expect(screen.getByText('Dr. Smith')).toBeInTheDocument();
    });

    // Click the add button
    fireEvent.click(screen.getByText('Add Slot'));

    // Fill in the form
    fireEvent.change(screen.getByLabelText('Appointment Type'), {
      target: { value: 'New Appointment' }
    });

    // Mock the createAppointmentSlot function to throw an error
    (calendarService.createAppointmentSlot as jest.Mock).mockRejectedValue(
      new Error('Failed to create appointment slot')
    );

    // Submit the form
    fireEvent.click(screen.getByText('Add'));

    // Wait for the error message to be displayed
    await waitFor(() => {
      expect(screen.getByText('Failed to create appointment slot')).toBeInTheDocument();
    });
  });

  it('should show an error message when updating a slot fails', async () => {
    render(<AppointmentSlotList />);

    // Wait for the slots to be loaded
    await waitFor(() => {
      expect(screen.getByText('Dr. Smith')).toBeInTheDocument();
    });

    // Click the edit button
    const editButtons = screen.getAllByLabelText('edit');
    fireEvent.click(editButtons[0]);

    // Change the appointment type
    fireEvent.change(screen.getByLabelText('Appointment Type'), {
      target: { value: 'Updated Appointment' }
    });

    // Mock the updateAppointmentSlot function to throw an error
    (calendarService.updateAppointmentSlot as jest.Mock).mockRejectedValue(
      new Error('Failed to update appointment slot')
    );

    // Submit the form
    fireEvent.click(screen.getByText('Update'));

    // Wait for the error message to be displayed
    await waitFor(() => {
      expect(screen.getByText('Failed to update appointment slot')).toBeInTheDocument();
    });
  });

  it('should show an error message when booking a slot fails', async () => {
    render(<AppointmentSlotList />);

    // Wait for the slots to be loaded
    await waitFor(() => {
      expect(screen.getByText('Dr. Smith')).toBeInTheDocument();
    });

    // Mock the bookAppointmentSlot function to throw an error
    (calendarService.bookAppointmentSlot as jest.Mock).mockRejectedValue(
      new Error('Failed to book appointment slot')
    );

    // Click the book button
    const bookButtons = screen.getAllByLabelText('book');
    fireEvent.click(bookButtons[0]);

    // Wait for the error message to be displayed
    await waitFor(() => {
      expect(screen.getByText('Failed to book appointment slot')).toBeInTheDocument();
    });
  });

  it('should show an error message when cancelling a slot fails', async () => {
    render(<AppointmentSlotList />);

    // Wait for the slots to be loaded
    await waitFor(() => {
      expect(screen.getByText('Dr. Smith')).toBeInTheDocument();
    });

    // Mock the cancelAppointmentSlot function to throw an error
    (calendarService.cancelAppointmentSlot as jest.Mock).mockRejectedValue(
      new Error('Failed to cancel appointment slot')
    );

    // Click the cancel button
    const cancelButtons = screen.getAllByLabelText('cancel');
    fireEvent.click(cancelButtons[0]);

    // Wait for the error message to be displayed
    await waitFor(() => {
      expect(screen.getByText('Failed to cancel appointment slot')).toBeInTheDocument();
    });
  });
}); 