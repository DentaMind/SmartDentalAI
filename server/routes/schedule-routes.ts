import express from 'express';
import { z } from 'zod';
import { storage } from '../storage';

const router = express.Router();

// Schema for appointment data
const appointmentSchema = z.object({
  patientId: z.number().optional(),
  patientName: z.string(),
  providerIndex: z.number(),
  time: z.string(),
  status: z.enum(['confirmed', 'unconfirmed', 'cancelled', 'no_show', 'block_out']),
  reason: z.string(),
  date: z.string().optional(),
  duration: z.number().optional(),
  notes: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  insurance: z.string().nullable().optional(),
  isBlockOut: z.boolean().optional(),
  aiFlags: z.array(
    z.object({
      type: z.string(),
      severity: z.enum(['low', 'medium', 'high']),
      message: z.string()
    })
  ).optional()
});

// Get all appointments
router.get('/', async (req, res) => {
  try {
    // Normally we'd fetch from the DB, for now return mock data for testing
    const appointments = [
      {
        id: 1,
        patientId: 101,
        patientName: "John Smith",
        time: "9:00",
        providerIndex: 0,
        status: "confirmed",
        reason: "Cleaning",
        phone: "555-123-4567",
        insurance: "Delta Dental",
        notes: "Patient prefers afternoon appointments",
        aiFlags: [
          {
            type: "insurance",
            severity: "medium",
            message: "Insurance expires in 30 days"
          }
        ]
      },
      {
        id: 2,
        patientId: 102,
        patientName: "Sarah Johnson",
        time: "10:00",
        providerIndex: 0,
        status: "unconfirmed",
        reason: "Crown preparation",
        phone: "555-987-6543",
        insurance: "Aetna",
        notes: ""
      },
      {
        id: 3,
        patientId: 103,
        patientName: "Robert Brown",
        time: "11:00",
        providerIndex: 0,
        status: "cancelled",
        reason: "Root canal",
        phone: "555-456-7890",
        insurance: "MetLife",
        notes: "Needs to reschedule"
      },
      {
        id: 4,
        patientId: 104,
        patientName: "Jessica Williams",
        time: "10:00",
        providerIndex: 1,
        status: "confirmed",
        reason: "Filling",
        phone: "555-234-5678",
        insurance: "Cigna",
        notes: ""
      },
      {
        id: 5,
        patientId: 105,
        patientName: "Michael Davis",
        time: "14:00",
        providerIndex: 2,
        status: "no_show",
        reason: "Extraction",
        phone: "555-345-6789",
        insurance: "Guardian",
        notes: "Second no-show",
        aiFlags: [
          {
            type: "attendance",
            severity: "high",
            message: "Multiple no-shows, consider requiring prepayment"
          }
        ]
      },
      {
        id: 6,
        patientName: "Lunch Break",
        time: "12:00",
        providerIndex: 0,
        status: "block_out",
        reason: "Lunch",
        isBlockOut: true,
        notes: "Daily lunch break"
      }
    ];
    
    res.json(appointments);
  } catch (error) {
    console.error("Error fetching appointments:", error);
    res.status(500).json({ error: "Failed to fetch appointments" });
  }
});

// Get appointments for a specific patient
router.get('/:patientId', async (req, res) => {
  try {
    const patientId = parseInt(req.params.patientId);
    
    // Normally we'd query the DB for this patient's appointments
    // For now return mock data for testing
    const appointments = [
      {
        id: 1,
        patientId: patientId,
        patientName: "Patient Name", // Would be fetched from patient record
        date: "2025-04-15",
        time: "10:00 AM",
        provider: "Dr. Smith",
        status: "scheduled",
        reason: "Regular check-up",
        duration: 30,
        procedures: ["Cleaning", "X-rays"]
      },
      {
        id: 2,
        patientId: patientId,
        patientName: "Patient Name",
        date: "2025-05-20",
        time: "2:30 PM",
        provider: "Dr. Johnson",
        status: "confirmed",
        reason: "Filling",
        duration: 60,
        procedures: ["Composite filling"]
      }
    ];
    
    res.json(appointments);
  } catch (error) {
    console.error(`Error fetching appointments for patient ${req.params.patientId}:`, error);
    res.status(500).json({ error: "Failed to fetch patient appointments" });
  }
});

// Create a new appointment
router.post('/', async (req, res) => {
  try {
    const appointmentData = appointmentSchema.parse(req.body);
    
    // In a real implementation, we would save to the database
    // For demo purposes, just return success with a mock ID
    res.status(201).json({ 
      id: Math.floor(Math.random() * 1000),
      ...appointmentData,
      message: "Appointment created successfully" 
    });
  } catch (error) {
    console.error("Error creating appointment:", error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: "Invalid appointment data", details: error.errors });
    } else {
      res.status(500).json({ error: "Failed to create appointment" });
    }
  }
});

// Update an existing appointment
router.put('/:id', async (req, res) => {
  try {
    const appointmentId = parseInt(req.params.id);
    const appointmentData = appointmentSchema.parse(req.body);
    
    // In a real implementation, we would update the database
    // For demo purposes, just return success
    res.json({ 
      id: appointmentId,
      ...appointmentData,
      message: "Appointment updated successfully" 
    });
  } catch (error) {
    console.error(`Error updating appointment ${req.params.id}:`, error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: "Invalid appointment data", details: error.errors });
    } else {
      res.status(500).json({ error: "Failed to update appointment" });
    }
  }
});

// Delete an appointment
router.delete('/:id', async (req, res) => {
  try {
    const appointmentId = parseInt(req.params.id);
    
    // In a real implementation, we would delete from the database
    // For demo purposes, just return success
    res.json({ 
      id: appointmentId,
      message: "Appointment deleted successfully" 
    });
  } catch (error) {
    console.error(`Error deleting appointment ${req.params.id}:`, error);
    res.status(500).json({ error: "Failed to delete appointment" });
  }
});

// Create block-out times
router.post('/blockout', async (req, res) => {
  try {
    const blockOuts = z.array(appointmentSchema).parse(req.body.blockOuts);
    
    // In a real implementation, we would save to the database
    // For demo purposes, just return success with mock IDs
    const createdBlockOuts = blockOuts.map((blockOut, index) => ({
      id: Math.floor(Math.random() * 1000) + index,
      ...blockOut,
      isBlockOut: true
    }));
    
    res.status(201).json({ 
      blockOuts: createdBlockOuts,
      message: "Block-out times created successfully" 
    });
  } catch (error) {
    console.error("Error creating block-out times:", error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: "Invalid block-out data", details: error.errors });
    } else {
      res.status(500).json({ error: "Failed to create block-out times" });
    }
  }
});

export default router;