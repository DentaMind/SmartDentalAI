import { calendarService } from '../calendarService';
import { Provider, AppointmentSlot, SlotBooking } from '../../types/calendar';

// Mock the fetch function
global.fetch = jest.fn();

describe('calendarService', () => {
  const mockProvider: Provider = {
    id: 1,
    name: 'Dr. Smith',
    specialty: 'Dentist',
    email: 'dr.smith@example.com',
    phone: '123-456-7890',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  };

  const mockAppointmentSlot: AppointmentSlot = {
    id: 1,
    provider_id: 1,
    start_time: '2024-01-01T09:00:00Z',
    end_time: '2024-01-01T10:00:00Z',
    appointment_type: 'Check-up',
    is_available: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  };

  const mockBooking: SlotBooking = {
    patient_id: 1,
    notes: 'Regular check-up'
  };

  beforeEach(() => {
    (global.fetch as jest.Mock).mockClear();
  });

  describe('Provider endpoints', () => {
    it('should fetch providers', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([mockProvider])
      });

      const providers = await calendarService.getProviders();
      expect(providers).toEqual([mockProvider]);
      expect(global.fetch).toHaveBeenCalledWith('/api/calendar/providers');
    });

    it('should fetch a single provider', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockProvider)
      });

      const provider = await calendarService.getProvider(1);
      expect(provider).toEqual(mockProvider);
      expect(global.fetch).toHaveBeenCalledWith('/api/calendar/providers/1');
    });

    it('should create a provider', async () => {
      const newProvider = {
        name: 'Dr. Johnson',
        specialty: 'Orthodontist',
        email: 'dr.johnson@example.com',
        phone: '987-654-3210'
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ ...newProvider, id: 2 })
      });

      const provider = await calendarService.createProvider(newProvider);
      expect(provider).toEqual({ ...newProvider, id: 2 });
      expect(global.fetch).toHaveBeenCalledWith('/api/calendar/providers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newProvider)
      });
    });

    it('should update a provider', async () => {
      const updatedProvider = {
        name: 'Dr. Smith Jr.',
        specialty: 'Dentist',
        email: 'dr.smith@example.com',
        phone: '123-456-7890'
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ ...updatedProvider, id: 1 })
      });

      const provider = await calendarService.updateProvider(1, updatedProvider);
      expect(provider).toEqual({ ...updatedProvider, id: 1 });
      expect(global.fetch).toHaveBeenCalledWith('/api/calendar/providers/1', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedProvider)
      });
    });

    it('should delete a provider', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true
      });

      await calendarService.deleteProvider(1);
      expect(global.fetch).toHaveBeenCalledWith('/api/calendar/providers/1', {
        method: 'DELETE'
      });
    });
  });

  describe('Appointment slot endpoints', () => {
    it('should fetch appointment slots', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([mockAppointmentSlot])
      });

      const slots = await calendarService.getAppointmentSlots();
      expect(slots).toEqual([mockAppointmentSlot]);
      expect(global.fetch).toHaveBeenCalledWith('/api/calendar/slots');
    });

    it('should fetch a single appointment slot', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockAppointmentSlot)
      });

      const slot = await calendarService.getAppointmentSlot(1);
      expect(slot).toEqual(mockAppointmentSlot);
      expect(global.fetch).toHaveBeenCalledWith('/api/calendar/slots/1');
    });

    it('should fetch provider slots', async () => {
      const startTime = new Date('2024-01-01T00:00:00Z');
      const endTime = new Date('2024-01-02T00:00:00Z');

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([mockAppointmentSlot])
      });

      const slots = await calendarService.getProviderSlots(1, startTime, endTime);
      expect(slots).toEqual([mockAppointmentSlot]);
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/calendar/providers/1/slots?start_time=2024-01-01T00:00:00.000Z&end_time=2024-01-02T00:00:00.000Z'
      );
    });

    it('should create an appointment slot', async () => {
      const newSlot = {
        provider_id: 1,
        start_time: new Date('2024-01-01T09:00:00Z'),
        end_time: new Date('2024-01-01T10:00:00Z'),
        appointment_type: 'Check-up'
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ ...newSlot, id: 2 })
      });

      const slot = await calendarService.createAppointmentSlot(newSlot);
      expect(slot).toEqual({ ...newSlot, id: 2 });
      expect(global.fetch).toHaveBeenCalledWith('/api/calendar/slots', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newSlot)
      });
    });

    it('should update an appointment slot', async () => {
      const updatedSlot = {
        provider_id: 1,
        start_time: new Date('2024-01-01T10:00:00Z'),
        end_time: new Date('2024-01-01T11:00:00Z'),
        appointment_type: 'Cleaning'
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ ...updatedSlot, id: 1 })
      });

      const slot = await calendarService.updateAppointmentSlot(1, updatedSlot);
      expect(slot).toEqual({ ...updatedSlot, id: 1 });
      expect(global.fetch).toHaveBeenCalledWith('/api/calendar/slots/1', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedSlot)
      });
    });

    it('should delete an appointment slot', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true
      });

      await calendarService.deleteAppointmentSlot(1);
      expect(global.fetch).toHaveBeenCalledWith('/api/calendar/slots/1', {
        method: 'DELETE'
      });
    });

    it('should book an appointment slot', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ ...mockAppointmentSlot, is_available: false })
      });

      const slot = await calendarService.bookAppointmentSlot(1, mockBooking);
      expect(slot).toEqual({ ...mockAppointmentSlot, is_available: false });
      expect(global.fetch).toHaveBeenCalledWith('/api/calendar/slots/1/book', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(mockBooking)
      });
    });

    it('should cancel an appointment slot', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ ...mockAppointmentSlot, is_available: true })
      });

      const slot = await calendarService.cancelAppointmentSlot(1);
      expect(slot).toEqual({ ...mockAppointmentSlot, is_available: true });
      expect(global.fetch).toHaveBeenCalledWith('/api/calendar/slots/1/cancel', {
        method: 'POST'
      });
    });
  });

  describe('Error handling', () => {
    it('should throw an error when the response is not ok', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404
      });

      await expect(calendarService.getProvider(1)).rejects.toThrow(
        'Failed to fetch provider'
      );
    });
  });
}); 