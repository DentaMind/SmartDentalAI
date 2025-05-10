import { format, addMinutes, parseISO } from 'date-fns';
import { apiClient } from '@/lib/api';
import { getRandomInt } from '@/lib/utils';

// Types for scheduler
export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  providerId: string;
  operatoryId: string;
  date: string; // ISO string
  duration: number; // in minutes
  bufferTime: number; // in minutes
  reasonForVisit: string;
  status: AppointmentStatus;
  notes?: string;
  procedures?: Procedure[];
  isRecurring?: boolean;
  recurringPattern?: RecurringPattern;
  insuranceVerified?: boolean;
  checkedIn?: boolean;
  checkedInTime?: string; // ISO string
  created: string; // ISO string
  updated: string; // ISO string
}

export type AppointmentStatus = 
  | 'scheduled' 
  | 'confirmed' 
  | 'checkedIn' 
  | 'inProgress' 
  | 'completed' 
  | 'cancelled' 
  | 'noShow';

export interface Provider {
  id: string;
  name: string;
  title: string;
  specialties: string[];
  color: string;
  availability?: Availability[];
}

export interface Operatory {
  id: string;
  name: string;
  type: OperatoryType;
  equipment: string[];
  isActive: boolean;
}

export type OperatoryType = 
  | 'general' 
  | 'hygiene' 
  | 'surgical' 
  | 'pediatric' 
  | 'ortho' 
  | 'radiology';

export interface AppointmentType {
  id: string;
  name: string;
  color: string;
  duration: number; // in minutes
  bufferTime: number; // in minutes
  procedures?: string[]; // procedure codes
  requiresOperatoryType?: OperatoryType;
  description?: string;
}

export interface Procedure {
  code: string;
  description: string;
  tooth?: string;
  surfaces?: string[];
  fee: number;
}

export interface Availability {
  dayOfWeek: number; // 0-6, where 0 is Sunday
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  unavailable?: boolean;
  reason?: string;
}

export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  phoneNumber?: string;
  email?: string;
  preferredName?: string;
  gender?: string;
  insuranceProvider?: string;
  insuranceMemberId?: string;
}

export interface RecurringPattern {
  frequency: 'daily' | 'weekly' | 'monthly';
  interval: number;
  endDate: string; // ISO string
  daysOfWeek?: number[]; // 0-6, where 0 is Sunday
}

export interface TimeSlot {
  time: string; // ISO string
  duration: number;
  isAvailable: boolean;
  appointments: Appointment[];
}

// Scheduler service class
class SchedulerService {
  private useMockData: boolean;
  private readonly mockDelay: number = 500; // Simulated API delay in ms

  constructor() {
    // Use mock data in development or when API_URL is not configured
    this.useMockData = process.env.NODE_ENV === 'development' || !apiClient.defaults.baseURL;
  }

  // Create a promise that resolves after the mock delay
  private delay = (ms: number = this.mockDelay) => new Promise(resolve => setTimeout(resolve, ms));

  // APPOINTMENT METHODS

  async fetchAppointments(
    startDate: Date,
    endDate: Date,
    providerId?: string,
    operatoryId?: string
  ): Promise<Appointment[]> {
    if (this.useMockData) {
      await this.delay();
      return this.getMockAppointments(startDate, endDate, providerId, operatoryId);
    }

    try {
      const params = {
        startDate: format(startDate, 'yyyy-MM-dd'),
        endDate: format(endDate, 'yyyy-MM-dd'),
        providerId,
        operatoryId
      };

      const response = await apiClient.get('/api/appointments', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching appointments:', error);
      throw error;
    }
  }

  async createAppointment(appointment: Omit<Appointment, 'id' | 'created' | 'updated'>): Promise<Appointment> {
    if (this.useMockData) {
      await this.delay();
      const newAppointment: Appointment = {
        ...appointment,
        id: `appt-${Date.now()}`,
        created: new Date().toISOString(),
        updated: new Date().toISOString()
      };
      return newAppointment;
    }

    try {
      const response = await apiClient.post('/api/appointments', appointment);
      return response.data;
    } catch (error) {
      console.error('Error creating appointment:', error);
      throw error;
    }
  }

  async updateAppointment(appointment: Appointment): Promise<Appointment> {
    if (this.useMockData) {
      await this.delay();
      return {
        ...appointment,
        updated: new Date().toISOString()
      };
    }

    try {
      const response = await apiClient.put(`/api/appointments/${appointment.id}`, appointment);
      return response.data;
    } catch (error) {
      console.error('Error updating appointment:', error);
      throw error;
    }
  }

  async deleteAppointment(appointmentId: string): Promise<void> {
    if (this.useMockData) {
      await this.delay();
      return;
    }

    try {
      await apiClient.delete(`/api/appointments/${appointmentId}`);
    } catch (error) {
      console.error('Error deleting appointment:', error);
      throw error;
    }
  }

  async changeAppointmentStatus(
    appointmentId: string, 
    status: AppointmentStatus
  ): Promise<Appointment> {
    if (this.useMockData) {
      await this.delay();
      return {
        id: appointmentId,
        patientId: 'mock-patient',
        patientName: 'Mock Patient',
        providerId: 'mock-provider',
        operatoryId: 'mock-operatory',
        date: new Date().toISOString(),
        duration: 30,
        bufferTime: 5,
        reasonForVisit: 'Status update test',
        status,
        created: new Date().toISOString(),
        updated: new Date().toISOString()
      };
    }

    try {
      const response = await apiClient.patch(`/api/appointments/${appointmentId}/status`, { status });
      return response.data;
    } catch (error) {
      console.error('Error changing appointment status:', error);
      throw error;
    }
  }

  // PROVIDER METHODS

  async fetchProviders(): Promise<Provider[]> {
    if (this.useMockData) {
      await this.delay();
      return this.getMockProviders();
    }

    try {
      const response = await apiClient.get('/api/providers');
      return response.data;
    } catch (error) {
      console.error('Error fetching providers:', error);
      throw error;
    }
  }

  // OPERATORY METHODS

  async fetchOperatories(): Promise<Operatory[]> {
    if (this.useMockData) {
      await this.delay();
      return this.getMockOperatories();
    }

    try {
      const response = await apiClient.get('/api/operatories');
      return response.data;
    } catch (error) {
      console.error('Error fetching operatories:', error);
      throw error;
    }
  }

  // APPOINTMENT TYPE METHODS

  async fetchAppointmentTypes(): Promise<AppointmentType[]> {
    if (this.useMockData) {
      await this.delay();
      return this.getMockAppointmentTypes();
    }

    try {
      const response = await apiClient.get('/api/appointment-types');
      return response.data;
    } catch (error) {
      console.error('Error fetching appointment types:', error);
      throw error;
    }
  }

  // PATIENT METHODS

  async searchPatients(query: string): Promise<Patient[]> {
    if (this.useMockData) {
      await this.delay();
      return this.getMockPatients().filter(patient => 
        patient.firstName.toLowerCase().includes(query.toLowerCase()) || 
        patient.lastName.toLowerCase().includes(query.toLowerCase())
      );
    }

    try {
      const response = await apiClient.get('/api/patients/search', { params: { query } });
      return response.data;
    } catch (error) {
      console.error('Error searching patients:', error);
      throw error;
    }
  }

  async fetchPatientById(patientId: string): Promise<Patient> {
    if (this.useMockData) {
      await this.delay();
      const patient = this.getMockPatients().find(p => p.id === patientId);
      if (!patient) {
        throw new Error(`Patient with ID ${patientId} not found`);
      }
      return patient;
    }

    try {
      const response = await apiClient.get(`/api/patients/${patientId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching patient with ID ${patientId}:`, error);
      throw error;
    }
  }

  // TIME SLOT METHODS

  async fetchAvailableTimeSlots(
    date: Date,
    duration: number,
    providerId?: string,
    operatoryId?: string
  ): Promise<TimeSlot[]> {
    if (this.useMockData) {
      await this.delay();
      return this.getMockTimeSlots(date, duration, providerId);
    }

    try {
      const params = {
        date: format(date, 'yyyy-MM-dd'),
        duration,
        providerId,
        operatoryId
      };

      const response = await apiClient.get('/api/appointments/available-slots', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching available time slots:', error);
      throw error;
    }
  }

  // UTIL METHODS

  getAppointmentTimes(appointment: Appointment): { start: Date; end: Date } {
    const start = parseISO(appointment.date);
    const end = addMinutes(start, appointment.duration + (appointment.bufferTime || 0));
    return { start, end };
  }

  // MOCK DATA METHODS

  private getMockProviders(): Provider[] {
    return [
      {
        id: 'prov-1',
        name: 'Dr. Sara Johnson',
        title: 'Dentist',
        specialties: ['General Dentistry', 'Cosmetic Dentistry'],
        color: '#4caf50'
      },
      {
        id: 'prov-2',
        name: 'Dr. Michael Chen',
        title: 'Orthodontist',
        specialties: ['Orthodontics', 'Invisalign'],
        color: '#2196f3'
      },
      {
        id: 'prov-3',
        name: 'Samantha Davis',
        title: 'Dental Hygienist',
        specialties: ['Cleaning', 'Periodontal Treatments'],
        color: '#9c27b0'
      },
      {
        id: 'prov-4',
        name: 'Dr. James Wilson',
        title: 'Oral Surgeon',
        specialties: ['Extractions', 'Implants', 'Wisdom Teeth'],
        color: '#f44336'
      }
    ];
  }

  private getMockOperatories(): Operatory[] {
    return [
      {
        id: 'op-1',
        name: 'Room 1',
        type: 'general',
        equipment: ['Standard Dental Unit', 'Digital X-ray', 'Intraoral Camera'],
        isActive: true
      },
      {
        id: 'op-2',
        name: 'Room 2',
        type: 'surgical',
        equipment: ['Surgical Dental Unit', 'Advanced Monitoring', 'Sterilization Station'],
        isActive: true
      },
      {
        id: 'op-3',
        name: 'Hygiene Room',
        type: 'hygiene',
        equipment: ['Standard Dental Unit', 'Ultrasonic Scaler', 'Air Polisher'],
        isActive: true
      },
      {
        id: 'op-4',
        name: 'X-ray Room',
        type: 'radiology',
        equipment: ['Panoramic X-ray', 'Cone Beam CT', 'Digital Sensors'],
        isActive: true
      },
      {
        id: 'op-5',
        name: 'Ortho Bay',
        type: 'ortho',
        equipment: ['Ortho Chair', 'Wire Bending Station', 'Digital Scanning Unit'],
        isActive: true
      }
    ];
  }

  private getMockAppointmentTypes(): AppointmentType[] {
    return [
      {
        id: 'type-1',
        name: 'New Patient Exam',
        color: '#4caf50',
        duration: 60,
        bufferTime: 10,
        description: 'Comprehensive exam for new patients'
      },
      {
        id: 'type-2',
        name: 'Regular Cleaning',
        color: '#2196f3',
        duration: 45,
        bufferTime: 5,
        description: 'Standard dental prophylaxis'
      },
      {
        id: 'type-3',
        name: 'Filling',
        color: '#ff9800',
        duration: 60,
        bufferTime: 10,
        description: 'Composite or amalgam filling for cavity'
      },
      {
        id: 'type-4',
        name: 'Crown Preparation',
        color: '#9c27b0',
        duration: 90,
        bufferTime: 15,
        description: 'Preparation for crown placement'
      },
      {
        id: 'type-5',
        name: 'Crown Delivery',
        color: '#673ab7',
        duration: 45,
        bufferTime: 10,
        description: 'Permanent crown placement'
      },
      {
        id: 'type-6',
        name: 'Root Canal',
        color: '#f44336',
        duration: 120,
        bufferTime: 20,
        description: 'Endodontic treatment'
      },
      {
        id: 'type-7',
        name: 'Extraction',
        color: '#795548',
        duration: 45,
        bufferTime: 15,
        description: 'Simple tooth extraction'
      },
      {
        id: 'type-8',
        name: 'Orthodontic Adjustment',
        color: '#00bcd4',
        duration: 30,
        bufferTime: 5,
        description: 'Regular adjustment for braces or aligners'
      }
    ];
  }

  private getMockPatients(): Patient[] {
    return [
      {
        id: 'pat-1',
        firstName: 'John',
        lastName: 'Smith',
        dateOfBirth: '1985-06-15',
        phoneNumber: '555-123-4567',
        email: 'john.smith@example.com',
        gender: 'Male',
        insuranceProvider: 'Delta Dental'
      },
      {
        id: 'pat-2',
        firstName: 'Emily',
        lastName: 'Johnson',
        dateOfBirth: '1992-03-22',
        phoneNumber: '555-987-6543',
        email: 'emily.johnson@example.com',
        gender: 'Female',
        insuranceProvider: 'Cigna Dental'
      },
      {
        id: 'pat-3',
        firstName: 'Robert',
        lastName: 'Williams',
        dateOfBirth: '1978-11-08',
        phoneNumber: '555-456-7890',
        email: 'robert.williams@example.com',
        gender: 'Male',
        insuranceProvider: 'Aetna'
      },
      {
        id: 'pat-4',
        firstName: 'Maria',
        lastName: 'Garcia',
        dateOfBirth: '1990-08-17',
        phoneNumber: '555-789-0123',
        email: 'maria.garcia@example.com',
        gender: 'Female',
        insuranceProvider: 'MetLife'
      },
      {
        id: 'pat-5',
        firstName: 'David',
        lastName: 'Chen',
        dateOfBirth: '1965-04-30',
        phoneNumber: '555-234-5678',
        email: 'david.chen@example.com',
        gender: 'Male',
        insuranceProvider: 'Guardian'
      }
    ];
  }

  private getMockProcedures(): Procedure[] {
    return [
      {
        code: 'D0150',
        description: 'Comprehensive Oral Evaluation',
        fee: 125.00
      },
      {
        code: 'D1110',
        description: 'Prophylaxis - Adult',
        fee: 95.00
      },
      {
        code: 'D2150',
        description: 'Amalgam - Two Surfaces',
        tooth: '19',
        surfaces: ['O', 'D'],
        fee: 165.00
      },
      {
        code: 'D2330',
        description: 'Resin-Based Composite - One Surface, Anterior',
        tooth: '8',
        surfaces: ['F'],
        fee: 150.00
      },
      {
        code: 'D2740',
        description: 'Crown - Porcelain/Ceramic',
        tooth: '14',
        fee: 1200.00
      }
    ];
  }

  private getMockAppointments(
    startDate: Date,
    endDate: Date,
    providerId?: string,
    operatoryId?: string
  ): Appointment[] {
    const providers = this.getMockProviders();
    const operatories = this.getMockOperatories();
    const appointmentTypes = this.getMockAppointmentTypes();
    const patients = this.getMockPatients();
    
    // Filter providers and operatories if specified
    const filteredProviders = providerId 
      ? providers.filter(provider => provider.id === providerId)
      : providers;
    
    const filteredOperatories = operatoryId
      ? operatories.filter(operatory => operatory.id === operatoryId)
      : operatories;
    
    // Generate 20-30 random appointments
    const count = getRandomInt(20, 30);
    const appointments: Appointment[] = [];
    
    for (let i = 0; i < count; i++) {
      // Random provider
      const provider = filteredProviders[getRandomInt(0, filteredProviders.length - 1)];
      
      // Random operatory
      const operatory = filteredOperatories[getRandomInt(0, filteredOperatories.length - 1)];
      
      // Random appointment type
      const appointmentType = appointmentTypes[getRandomInt(0, appointmentTypes.length - 1)];
      
      // Random patient
      const patient = patients[getRandomInt(0, patients.length - 1)];
      
      // Random date between start and end date
      const totalDays = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const randomDay = getRandomInt(0, totalDays);
      const appointmentDate = new Date(startDate);
      appointmentDate.setDate(appointmentDate.getDate() + randomDay);
      
      // Random hour between 8am and 5pm
      const hour = getRandomInt(8, 16);
      // Random minute (0, 15, 30, 45)
      const minute = getRandomInt(0, 3) * 15;
      
      appointmentDate.setHours(hour, minute, 0, 0);
      
      // Random status weighted towards 'scheduled' and 'confirmed'
      const statusRandom = Math.random();
      let status: AppointmentStatus;
      
      if (statusRandom < 0.4) {
        status = 'scheduled';
      } else if (statusRandom < 0.7) {
        status = 'confirmed';
      } else if (statusRandom < 0.8) {
        status = 'completed';
      } else if (statusRandom < 0.9) {
        status = 'inProgress';
      } else if (statusRandom < 0.95) {
        status = 'cancelled';
      } else {
        status = 'noShow';
      }
      
      // Create the appointment
      appointments.push({
        id: `appt-${i + 1}`,
        patientId: patient.id,
        patientName: `${patient.firstName} ${patient.lastName}`,
        providerId: provider.id,
        operatoryId: operatory.id,
        date: appointmentDate.toISOString(),
        duration: appointmentType.duration,
        bufferTime: appointmentType.bufferTime,
        reasonForVisit: appointmentType.name,
        status,
        notes: Math.random() > 0.7 ? `Mock notes for ${appointmentType.name}` : undefined,
        created: new Date(appointmentDate.getTime() - 1000 * 60 * 60 * 24 * 7).toISOString(), // 1 week before
        updated: new Date(appointmentDate.getTime() - 1000 * 60 * 60 * 24 * 3).toISOString() // 3 days before
      });
    }
    
    return appointments;
  }

  private getMockTimeSlots(
    date: Date,
    duration: number,
    providerId?: string
  ): TimeSlot[] {
    // Generate time slots from 8am to 5pm in 15-minute increments
    const slots: TimeSlot[] = [];
    const startHour = 8;
    const endHour = 17;
    
    // Get mock appointments for this date
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);
    
    const appointments = this.getMockAppointments(startDate, endDate, providerId);
    
    // Create slots
    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const slotTime = new Date(date);
        slotTime.setHours(hour, minute, 0, 0);
        
        // Find appointments that overlap with this slot
        const slotAppointments = appointments.filter(appointment => {
          const appointmentTime = this.getAppointmentTimes(appointment);
          return (
            appointmentTime.start <= new Date(slotTime.getTime() + 15 * 60 * 1000) &&
            appointmentTime.end > slotTime
          );
        });
        
        // Determine if the slot is available for the requested duration
        let isAvailable = true;
        
        // Check if any slots in the duration are occupied
        for (let i = 0; i < duration; i += 15) {
          const checkTime = new Date(slotTime.getTime() + i * 60 * 1000);
          
          const conflictingAppointments = appointments.filter(appointment => {
            const appointmentTime = this.getAppointmentTimes(appointment);
            return (
              appointmentTime.start <= checkTime &&
              appointmentTime.end > checkTime
            );
          });
          
          if (conflictingAppointments.length > 0) {
            isAvailable = false;
            break;
          }
        }
        
        // Add lunch break (not available)
        if (hour === 12) {
          isAvailable = false;
        }
        
        slots.push({
          time: slotTime.toISOString(),
          duration: 15,
          isAvailable,
          appointments: slotAppointments
        });
      }
    }
    
    return slots;
  }
}

// Create a singleton instance
export const schedulerService = new SchedulerService(); 