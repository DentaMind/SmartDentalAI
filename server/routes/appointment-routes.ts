import express from 'express';
import { storage } from '../storage';
import { z } from 'zod';
import { DateTime } from 'luxon';

// Schema for appointment request validation
const appointmentRequestSchema = z.object({
  patientId: z.number(),
  patientName: z.string(),
  patientEmail: z.string().email().nullable(),
  patientPhone: z.string().nullable(),
  preferredDate: z.date(),
  preferredTimeSlot: z.string(),
  alternateDate: z.date().optional(),
  alternateTimeSlot: z.string().optional(),
  reasonForVisit: z.string().min(5).max(500),
  additionalNotes: z.string().max(1000).optional(),
  urgency: z.enum(["normal", "urgent"]).default("normal"),
  preferredDoctor: z.string().optional(),
  formattedPreferredDate: z.string(),
  formattedAlternateDate: z.string(),
  submittedAt: z.string(),
});

export function setupAppointmentRoutes(router: express.Router) {
  // Get appointments for the logged-in user or for a specific patient
  router.get('/appointments', async (req, res) => {
    try {
      const userId = req.session?.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const userRole = req.session?.user?.role;
      
      let appointments;
      if (userRole === 'patient') {
        // Get patient profile for the user
        const patientProfile = await storage.getPatientByUserId(userId);
        if (!patientProfile) {
          return res.status(404).json({ error: 'Patient profile not found' });
        }
        
        // Get appointments for the patient
        appointments = await storage.getPatientAppointments(patientProfile.id);
      } else if (userRole === 'doctor') {
        // Get appointments for the doctor
        appointments = await storage.getDoctorAppointments(userId);
      } else {
        // For staff or admin, return all appointments
        appointments = await storage.getAllAppointments();
      }
      
      res.json(appointments);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Get upcoming appointments for the logged-in patient
  router.get('/appointments/upcoming', async (req, res) => {
    try {
      const userId = req.session?.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const userRole = req.session?.user?.role;
      
      if (userRole !== 'patient') {
        return res.status(403).json({ error: 'Access denied' });
      }
      
      // Get patient profile for the user
      const patientProfile = await storage.getPatientByUserId(userId);
      if (!patientProfile) {
        return res.status(404).json({ error: 'Patient profile not found' });
      }
      
      // Get all appointments for the patient
      const allAppointments = await storage.getPatientAppointments(patientProfile.id);
      
      // Filter to only include upcoming appointments
      const now = new Date();
      const upcomingAppointments = allAppointments.filter(appointment => 
        new Date(appointment.date) > now && appointment.status !== 'cancelled'
      );
      
      // Sort by date (closest first)
      upcomingAppointments.sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );
      
      res.json(upcomingAppointments);
    } catch (error) {
      console.error('Error fetching upcoming appointments:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Create appointment request (for patients)
  router.post('/appointments/request', async (req, res) => {
    try {
      const userId = req.session?.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      // Validate request data
      const validationResult = appointmentRequestSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          error: 'Invalid appointment request data',
          details: validationResult.error.errors 
        });
      }
      
      const requestData = validationResult.data;
      
      // Send email notification to the clinic
      await sendAppointmentRequestEmail(requestData);
      
      // Store the request in the database for tracking
      // This is a simplified version - in a production system you would 
      // create a specific table for appointment requests
      const appointmentRequest = {
        type: 'appointment_request',
        patientId: requestData.patientId,
        content: JSON.stringify(requestData),
        createdAt: new Date()
      };
      
      // Add to notifications table as a message
      await storage.createNotification({
        userId: 1, // Admin or clinic notification
        title: `New Appointment Request from ${requestData.patientName}`,
        message: `Requested for ${requestData.formattedPreferredDate} at ${requestData.preferredTimeSlot}. Reason: ${requestData.reasonForVisit.substring(0, 50)}${requestData.reasonForVisit.length > 50 ? '...' : ''}`,
        type: requestData.urgency === 'urgent' ? 'warning' : 'info',
        source: 'appointment_request',
        sourceId: requestData.patientId.toString(),
        read: false,
        createdAt: new Date(),
        priority: requestData.urgency === 'urgent' ? 'high' : 'medium',
        actions: [
          {
            label: 'View Details',
            action: 'view_appointment_request',
            data: JSON.stringify(requestData)
          },
          {
            label: 'Create Appointment',
            action: 'create_appointment',
            data: JSON.stringify({ 
              patientId: requestData.patientId,
              preferredDate: requestData.preferredDate,
              preferredTime: requestData.preferredTimeSlot,
              reason: requestData.reasonForVisit
            })
          }
        ]
      });
      
      res.status(200).json({ 
        message: 'Appointment request submitted successfully',
        requestId: Date.now().toString() // Simulated ID
      });
    } catch (error) {
      console.error('Error submitting appointment request:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
}

// Helper function to send email notification
async function sendAppointmentRequestEmail(requestData: any) {
  // In a production environment, this would use a real email service
  // For demonstration purposes, we'll just log the email content
  console.log('========================');
  console.log('NEW APPOINTMENT REQUEST');
  console.log('========================');
  console.log(`From: ${requestData.patientName}`);
  console.log(`Email: ${requestData.patientEmail}`);
  console.log(`Phone: ${requestData.patientPhone}`);
  console.log(`Preferred Date: ${requestData.formattedPreferredDate} at ${requestData.preferredTimeSlot}`);
  
  if (requestData.alternateDate) {
    console.log(`Alternate Date: ${requestData.formattedAlternateDate} at ${requestData.alternateTimeSlot || 'Any time'}`);
  }
  
  console.log(`Urgency: ${requestData.urgency}`);
  console.log(`Reason: ${requestData.reasonForVisit}`);
  
  if (requestData.additionalNotes) {
    console.log(`Additional Notes: ${requestData.additionalNotes}`);
  }
  
  if (requestData.preferredDoctor) {
    console.log(`Preferred Doctor: ${requestData.preferredDoctor}`);
  }
  
  console.log('========================');
  
  return true; // Simulate successful email sending
}