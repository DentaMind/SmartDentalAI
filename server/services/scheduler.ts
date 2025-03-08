
import { storage } from "../storage";
import { z } from "zod";
import dayjs from "dayjs";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import isBetween from "dayjs/plugin/isBetween";

// Initialize dayjs plugins
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);
dayjs.extend(isBetween);

// Schemas for validation
const timeSlotSchema = z.object({
  startTime: z.string(),  // ISO format
  endTime: z.string(),    // ISO format
  doctorId: z.number(),
  available: z.boolean().default(true),
});

const appointmentRequestSchema = z.object({
  patientId: z.number(),
  doctorId: z.number(),
  startTime: z.string(),  // ISO format
  endTime: z.string(),    // ISO format
  type: z.enum(["check_up", "cleaning", "filling", "root_canal", "extraction", "consultation", "follow_up", "emergency"]),
  notes: z.string().optional(),
  isOnline: z.boolean().default(false),
  insuranceVerificationRequired: z.boolean().default(true),
});

const recurrencePatternSchema = z.object({
  frequency: z.enum(["daily", "weekly", "monthly"]),
  interval: z.number().min(1).default(1),
  endDate: z.string().optional(),  // ISO format
  daysOfWeek: z.array(z.number().min(0).max(6)).optional(),  // 0 = Sunday, 6 = Saturday
});

class SchedulerService {
  private APPOINTMENT_DURATION_MAP = {
    check_up: 30,       // 30 minutes
    cleaning: 60,       // 60 minutes
    filling: 60,        // 60 minutes
    root_canal: 90,     // 90 minutes
    extraction: 45,     // 45 minutes
    consultation: 30,   // 30 minutes
    follow_up: 20,      // 20 minutes
    emergency: 45,      // 45 minutes
  };
  
  private BUFFER_TIME = 10; // 10 minutes buffer between appointments
  
  async getAvailableSlots(doctorId: number, date: string, duration: number) {
    try {
      // Get doctor's schedule
      const doctorSchedule = await this.getDoctorSchedule(doctorId, date);
      
      if (!doctorSchedule.isWorkDay) {
        return { 
          date, 
          availableSlots: [], 
          message: "The selected doctor is not available on this date." 
        };
      }
      
      // Get existing appointments for this doctor on this date
      const existingAppointments = await storage.getDoctorAppointmentsByDate(doctorId, date);
      
      // Convert schedule into available slots
      const availableSlots = this.calculateAvailableSlots(
        doctorSchedule.startTime,
        doctorSchedule.endTime,
        existingAppointments,
        duration
      );
      
      return {
        date,
        availableSlots,
        doctorName: doctorSchedule.doctorName
      };
    } catch (error) {
      console.error("Error getting available slots:", error);
      throw new Error(error instanceof Error ? error.message : "Failed to get available slots");
    }
  }
  
  async scheduleAppointment(appointmentData: z.infer<typeof appointmentRequestSchema>) {
    try {
      // Validate appointment data
      const validData = appointmentRequestSchema.parse(appointmentData);
      
      // Check if the time slot is available
      const isAvailable = await this.checkSlotAvailability(
        validData.doctorId,
        validData.startTime,
        validData.endTime
      );
      
      if (!isAvailable) {
        throw new Error("The requested time slot is not available");
      }
      
      // Create the appointment
      const appointment = await storage.createAppointment({
        patientId: validData.patientId,
        doctorId: validData.doctorId,
        date: new Date(validData.startTime),
        status: "scheduled",
        notes: validData.notes || "",
        isOnline: validData.isOnline,
        insuranceVerified: !validData.insuranceVerificationRequired
      });
      
      // If insurance verification is required, trigger verification process
      if (validData.insuranceVerificationRequired) {
        await this.triggerInsuranceVerification(appointment.id);
      }
      
      // Send appointment notification (would integrate with notification service)
      this.sendAppointmentNotification(appointment.id, "scheduled");
      
      return {
        ...appointment,
        startTime: validData.startTime,
        endTime: validData.endTime,
        type: validData.type
      };
    } catch (error) {
      console.error("Error scheduling appointment:", error);
      throw new Error(error instanceof Error ? error.message : "Failed to schedule appointment");
    }
  }
  
  async rescheduleAppointment(
    appointmentId: number, 
    newStartTime: string, 
    newEndTime: string
  ) {
    try {
      // Get the existing appointment
      const appointment = await storage.getAppointment(appointmentId);
      
      if (!appointment) {
        throw new Error("Appointment not found");
      }
      
      // Check if the new time slot is available
      const isAvailable = await this.checkSlotAvailability(
        appointment.doctorId,
        newStartTime,
        newEndTime
      );
      
      if (!isAvailable) {
        throw new Error("The requested time slot is not available");
      }
      
      // Update the appointment
      const updatedAppointment = await storage.updateAppointment(appointmentId, {
        date: new Date(newStartTime),
        status: "rescheduled"
      });
      
      // Send notification
      this.sendAppointmentNotification(appointmentId, "rescheduled");
      
      return {
        ...updatedAppointment,
        startTime: newStartTime,
        endTime: newEndTime
      };
    } catch (error) {
      console.error("Error rescheduling appointment:", error);
      throw new Error(error instanceof Error ? error.message : "Failed to reschedule appointment");
    }
  }
  
  async cancelAppointment(appointmentId: number, reason?: string) {
    try {
      // Get the existing appointment
      const appointment = await storage.getAppointment(appointmentId);
      
      if (!appointment) {
        throw new Error("Appointment not found");
      }
      
      // Update appointment status
      const updatedAppointment = await storage.updateAppointment(appointmentId, {
        status: "cancelled",
        notes: reason ? `${appointment.notes}\nCancellation reason: ${reason}` : appointment.notes
      });
      
      // Send notification
      this.sendAppointmentNotification(appointmentId, "cancelled");
      
      return updatedAppointment;
    } catch (error) {
      console.error("Error cancelling appointment:", error);
      throw new Error(error instanceof Error ? error.message : "Failed to cancel appointment");
    }
  }
  
  async createRecurringAvailability(
    doctorId: number,
    startDate: string,
    startTime: string,
    endTime: string,
    recurrencePattern: z.infer<typeof recurrencePatternSchema>
  ) {
    try {
      // Validate recurrence pattern
      const validPattern = recurrencePatternSchema.parse(recurrencePattern);
      
      const start = dayjs(startDate);
      const end = validPattern.endDate ? dayjs(validPattern.endDate) : start.add(3, 'month');
      
      const availabilitySlots = [];
      let current = start;
      
      while (current.isSameOrBefore(end, 'day')) {
        // Check if day matches pattern (for weekly recurrence with specific days)
        let includeDay = true;
        
        if (validPattern.frequency === "weekly" && validPattern.daysOfWeek && validPattern.daysOfWeek.length > 0) {
          const dayOfWeek = current.day(); // 0 = Sunday, 6 = Saturday
          includeDay = validPattern.daysOfWeek.includes(dayOfWeek);
        }
        
        if (includeDay) {
          // Create availability slot
          const slot = await storage.createAvailabilitySlot({
            doctorId,
            date: current.format('YYYY-MM-DD'),
            startTime: `${current.format('YYYY-MM-DD')}T${startTime}`,
            endTime: `${current.format('YYYY-MM-DD')}T${endTime}`
          });
          
          availabilitySlots.push(slot);
        }
        
        // Increment according to frequency
        switch (validPattern.frequency) {
          case "daily":
            current = current.add(validPattern.interval, 'day');
            break;
          case "weekly":
            current = current.add(validPattern.interval, 'week');
            break;
          case "monthly":
            current = current.add(validPattern.interval, 'month');
            break;
        }
      }
      
      return availabilitySlots;
    } catch (error) {
      console.error("Error creating recurring availability:", error);
      throw new Error(error instanceof Error ? error.message : "Failed to create recurring availability");
    }
  }
  
  private async getDoctorSchedule(doctorId: number, date: string) {
    // This would normally query a doctor's schedule from the database
    // For now, we'll return mock data
    const doctorData = await storage.getUser(doctorId);
    
    return {
      doctorId,
      doctorName: doctorData ? `${doctorData.firstName} ${doctorData.lastName}` : `Doctor #${doctorId}`,
      date,
      isWorkDay: !this.isWeekend(date), // Assuming doctors don't work on weekends
      startTime: "09:00",
      endTime: "17:00",
      lunchStart: "12:00",
      lunchEnd: "13:00"
    };
  }
  
  private isWeekend(dateStr: string) {
    const date = dayjs(dateStr);
    const day = date.day();
    return day === 0 || day === 6; // 0 = Sunday, 6 = Saturday
  }
  
  private calculateAvailableSlots(
    startTime: string,
    endTime: string,
    existingAppointments: any[],
    durationMinutes: number
  ) {
    // Parse the start and end times
    const [startHour, startMin] = startTime.split(":").map(Number);
    const [endHour, endMin] = endTime.split(":").map(Number);
    
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    
    // Create blocked time ranges from existing appointments
    const blockedRanges = existingAppointments.map(appointment => {
      const appStartTime = new Date(appointment.date);
      const appEndTime = new Date(appointment.date);
      appEndTime.setMinutes(appEndTime.getMinutes() + this.APPOINTMENT_DURATION_MAP[appointment.type] || 60);
      
      return {
        start: appStartTime,
        end: appEndTime
      };
    });
    
    // Generate time slots
    const slots = [];
    const totalMinutes = endMinutes - startMinutes;
    const slotCount = Math.floor(totalMinutes / (durationMinutes + this.BUFFER_TIME));
    
    for (let i = 0; i < slotCount; i++) {
      const slotStart = new Date();
      slotStart.setHours(startHour);
      slotStart.setMinutes(startMin + i * (durationMinutes + this.BUFFER_TIME));
      
      const slotEnd = new Date(slotStart);
      slotEnd.setMinutes(slotStart.getMinutes() + durationMinutes);
      
      // Check if slot overlaps with any blocked range
      const isBlocked = blockedRanges.some(range => {
        return (slotStart >= range.start && slotStart < range.end) ||
               (slotEnd > range.start && slotEnd <= range.end) ||
               (slotStart <= range.start && slotEnd >= range.end);
      });
      
      if (!isBlocked) {
        slots.push({
          startTime: slotStart.toISOString(),
          endTime: slotEnd.toISOString(),
          duration: durationMinutes
        });
      }
    }
    
    return slots;
  }
  
  private async checkSlotAvailability(
    doctorId: number,
    startTime: string,
    endTime: string
  ) {
    // Get date from start time
    const date = dayjs(startTime).format('YYYY-MM-DD');
    
    // Get existing appointments for this doctor on this date
    const existingAppointments = await storage.getDoctorAppointmentsByDate(doctorId, date);
    
    // Check if any existing appointment overlaps with the requested slot
    const requestedStart = new Date(startTime);
    const requestedEnd = new Date(endTime);
    
    const isOverlapping = existingAppointments.some(appointment => {
      const appStartTime = new Date(appointment.date);
      const appEndTime = new Date(appointment.date);
      appEndTime.setMinutes(appEndTime.getMinutes() + this.APPOINTMENT_DURATION_MAP[appointment.type] || 60);
      
      return (requestedStart >= appStartTime && requestedStart < appEndTime) ||
             (requestedEnd > appStartTime && requestedEnd <= appEndTime) ||
             (requestedStart <= appStartTime && requestedEnd >= appEndTime);
    });
    
    return !isOverlapping;
  }
  
  private async triggerInsuranceVerification(appointmentId: number) {
    // This would integrate with the insurance verification service
    console.log(`Triggering insurance verification for appointment ${appointmentId}`);
    
    // Simulate verification process (would be replaced with actual API call)
    setTimeout(async () => {
      await storage.updateAppointment(appointmentId, {
        insuranceVerified: true
      });
      
      // Send notification
      this.sendAppointmentNotification(appointmentId, "insurance_verified");
    }, 5000);
  }
  
  private sendAppointmentNotification(appointmentId: number, event: string) {
    // This would integrate with the notification service
    console.log(`Sending notification for appointment ${appointmentId}, event: ${event}`);
    
    // Notification logic would go here
  }
  
  // Schedule appointment reminders to run periodically
  async setupAutomatedReminders() {
    try {
      console.log('Setting up automated appointment reminders');
      
      // Import notification service
      const { notificationService } = await import('./notifications');
      
      // Set up interval for reminder checks (run every hour)
      const REMINDER_INTERVAL_MS = 60 * 60 * 1000; // 1 hour
      
      // Initialize reminder scheduler
      const reminderScheduler = setInterval(async () => {
        try {
          console.log('Running scheduled appointment reminders check');
          const result = await notificationService.sendAppointmentReminders();
          console.log(`Reminders sent: ${result.count} (24h: ${result.breakdown['24h']}, 48h: ${result.breakdown['48h']}, 1week: ${result.breakdown['1week']})`);
        } catch (error) {
          console.error('Error in scheduled reminders:', error);
        }
      }, REMINDER_INTERVAL_MS);
      
      // Run immediately on startup
      try {
        console.log('Running initial appointment reminders check');
        const result = await notificationService.sendAppointmentReminders();
        console.log(`Initial reminders sent: ${result.count} (24h: ${result.breakdown['24h']}, 48h: ${result.breakdown['48h']}, 1week: ${result.breakdown['1week']})`);
      } catch (error) {
        console.error('Error in initial reminders:', error);
      }
      
      return { 
        success: true, 
        message: 'Automated appointment reminders scheduled',
        interval: REMINDER_INTERVAL_MS
      };
    } catch (error) {
      console.error('Failed to set up automated reminders:', error);
      throw error;
    }
  }
  
  // Return reminder settings and stats
  async getReminderSettings() {
    return {
      enabled: true,
      reminderTypes: [
        { timeframe: '24h', priority: 'high', method: 'email,sms' },
        { timeframe: '48h', priority: 'medium', method: 'email' },
        { timeframe: '1week', priority: 'medium', method: 'email' }
      ],
      lastRunTime: new Date().toISOString(),
      remindersSentToday: 12, // This would be actual stats in production
      remindersSentThisWeek: 87, // This would be actual stats in production
      deliveryStats: {
        email: { sent: 75, opened: 52, failureRate: 0.04 },
        sms: { sent: 24, delivered: 23, failureRate: 0.04 }
      }
    };
  }
}

export const schedulerService = new SchedulerService();
