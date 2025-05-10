import express from 'express';
import { z } from 'zod';
import { storage } from '../storage';
import { requireAuth } from '../middleware/auth';

const router = express.Router();

// Schema for creating new post-op instructions
const createPostOpInstructionsSchema = z.object({
  patientId: z.number(),
  procedureId: z.number(),
  procedureName: z.string(),
  appointmentDate: z.string(),
  doctorName: z.string(),
  procedureType: z.string(),
  generalInstructions: z.string(),
  specificInstructions: z.array(z.string()),
  medications: z.array(z.object({
    name: z.string(),
    dosage: z.string(),
    frequency: z.string(),
    purpose: z.string(),
    duration: z.string(),
    specialInstructions: z.string().optional(),
  })),
  restrictions: z.array(z.string()),
  followUpRequired: z.boolean(),
  followUpTimeline: z.string().optional(),
  followUpDetails: z.string().optional(),
  emergencyContact: z.string(),
});

// Mock post-op instructions for demo purposes
// Note: This will be replaced with actual database storage in production
const mockPostOpInstructions = new Map();

// Generate a unique ID (in production, this would be handled by the database)
function generateId() {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

// Get all post-op instructions for a patient
router.get('/patients/:patientId/post-op-instructions', requireAuth, async (req, res) => {
  try {
    const patientId = parseInt(req.params.patientId);
    if (isNaN(patientId)) {
      return res.status(400).json({ message: 'Invalid patient ID' });
    }

    // In a real implementation, we would query the database for post-op instructions
    // associated with this patient ID
    const patientInstructions = Array.from(mockPostOpInstructions.values())
      .filter(instruction => instruction.patientId === patientId);

    // Sort instructions by appointment date (most recent first)
    patientInstructions.sort((a, b) => 
      new Date(b.appointmentDate).getTime() - new Date(a.appointmentDate).getTime()
    );
    
    res.json(patientInstructions);
  } catch (error) {
    console.error('Failed to get post-op instructions:', error);
    res.status(500).json({ 
      message: 'Failed to retrieve post-operative instructions',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get a specific post-op instruction by ID
router.get('/patients/:patientId/post-op-instructions/:instructionId', requireAuth, async (req, res) => {
  try {
    const instructionId = req.params.instructionId;
    const instruction = mockPostOpInstructions.get(instructionId);
    
    if (!instruction) {
      return res.status(404).json({ message: 'Post-operative instruction not found' });
    }
    
    res.json(instruction);
  } catch (error) {
    console.error('Failed to get post-op instruction:', error);
    res.status(500).json({ 
      message: 'Failed to retrieve post-operative instruction',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Create new post-op instructions
router.post('/patients/:patientId/post-op-instructions', requireAuth, async (req, res) => {
  try {
    // Validate request body against schema
    const validatedData = createPostOpInstructionsSchema.parse(req.body);
    
    // Generate a unique ID
    const id = generateId();
    
    // Create the instruction object with timestamp
    const instruction = {
      id,
      ...validatedData,
      dateCreated: new Date().toISOString(),
    };
    
    // In a real implementation, we would store this in the database
    mockPostOpInstructions.set(id, instruction);
    
    res.status(201).json({ 
      message: 'Post-operative instructions created successfully',
      id 
    });
  } catch (error) {
    console.error('Failed to create post-op instructions:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        message: 'Invalid request data',
        details: error.errors 
      });
    }
    
    res.status(500).json({ 
      message: 'Failed to create post-operative instructions',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Mark post-op instructions as read
router.post('/patients/:patientId/post-op-instructions/:instructionId/read', requireAuth, async (req, res) => {
  try {
    const instructionId = req.params.instructionId;
    const instruction = mockPostOpInstructions.get(instructionId);
    
    if (!instruction) {
      return res.status(404).json({ message: 'Post-operative instruction not found' });
    }
    
    // Update the lastViewed timestamp
    instruction.lastViewed = new Date().toISOString();
    mockPostOpInstructions.set(instructionId, instruction);
    
    res.json({ 
      message: 'Post-operative instruction marked as read',
      lastViewed: instruction.lastViewed
    });
  } catch (error) {
    console.error('Failed to mark post-op instruction as read:', error);
    res.status(500).json({ 
      message: 'Failed to mark post-operative instruction as read',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Email post-op instructions to the patient
router.post('/patients/:patientId/post-op-instructions/:instructionId/email', requireAuth, async (req, res) => {
  try {
    const patientId = parseInt(req.params.patientId);
    const instructionId = req.params.instructionId;
    
    if (isNaN(patientId)) {
      return res.status(400).json({ message: 'Invalid patient ID' });
    }
    
    const instruction = mockPostOpInstructions.get(instructionId);
    if (!instruction) {
      return res.status(404).json({ message: 'Post-operative instruction not found' });
    }
    
    // In a real implementation, we would:
    // 1. Get the patient's email from their user account
    // 2. Format the instructions as a nice HTML email
    // 3. Send the email using a service like SendGrid, Mailgun, etc.
    
    // For now, we'll just simulate a successful email send
    console.log(`[MOCK] Email sent to patient ${patientId} with post-op instructions ${instructionId}`);
    
    res.json({ 
      message: 'Post-operative instructions emailed successfully',
    });
  } catch (error) {
    console.error('Failed to email post-op instructions:', error);
    res.status(500).json({ 
      message: 'Failed to email post-operative instructions',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Create some example data when the server starts (for demonstration purposes)
// This is for testing only and would be removed in production
function createExamplePostOpInstructions() {
  // Example 1: Dental Extraction
  const extraction = {
    id: generateId(),
    patientId: 1, // This should match an actual patient ID in your system
    procedureId: 101,
    procedureName: "Tooth Extraction (Molar #18)",
    appointmentDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
    doctorName: "Sarah Johnson",
    procedureType: "Extraction",
    generalInstructions: "To ensure proper healing after your tooth extraction, please follow these instructions carefully. The initial healing period typically takes one to two weeks, and you'll likely experience some swelling and discomfort. These instructions will help minimize discomfort and prevent complications.",
    specificInstructions: [
      "Bite firmly on the gauze pad placed by your dentist for 30-60 minutes after the appointment.",
      "Replace gauze as needed until bleeding subsides to a slight ooze.",
      "Avoid rinsing or spitting forcefully for 24 hours to avoid dislodging the blood clot.",
      "After 24 hours, rinse gently with warm salt water (1/2 teaspoon salt in 8 oz water) 2-3 times daily.",
      "Apply ice packs to the face for 20 minutes on, 20 minutes off during the first 24 hours.",
      "Elevate your head with extra pillows when lying down to reduce swelling.",
      "Eat soft, cool foods for the first day. Gradually return to normal diet as healing progresses.",
      "Avoid using straws, smoking, or drinking alcohol for at least 72 hours.",
      "Brush and floss normally, but avoid the extraction site for the first day."
    ],
    medications: [
      {
        name: "Ibuprofen (Advil, Motrin)",
        dosage: "600mg",
        frequency: "Every 6 hours as needed for pain",
        purpose: "Pain relief and reducing inflammation",
        duration: "3-5 days or as needed",
        specialInstructions: "Take with food to reduce stomach irritation"
      },
      {
        name: "Amoxicillin",
        dosage: "500mg",
        frequency: "Every 8 hours",
        purpose: "Preventing infection",
        duration: "7 days (complete entire course)",
        specialInstructions: "Take until completely finished, even if you feel better"
      }
    ],
    restrictions: [
      "No strenuous activity or exercise for 48-72 hours",
      "No spitting, using straws, or creating suction in your mouth for 72 hours",
      "No smoking or tobacco use for at least 72 hours (ideally longer)",
      "No alcohol consumption while taking prescribed antibiotics or pain medication",
      "Avoid hard, crunchy, spicy, or acidic foods for the first week"
    ],
    followUpRequired: true,
    followUpTimeline: "Return in 7-10 days for suture removal and healing check",
    followUpDetails: "Please call our office if you experience severe pain, excessive bleeding, or signs of infection (increased swelling after 2-3 days, fever, or pus).",
    emergencyContact: "For emergencies after hours, call (555) 123-4567 or go to your nearest emergency room if you cannot reach us.",
    dateCreated: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  };
  
  // Example 2: Root Canal
  const rootCanal = {
    id: generateId(),
    patientId: 1, // This should match an actual patient ID in your system
    procedureId: 102,
    procedureName: "Root Canal Treatment (Tooth #9)",
    appointmentDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days ago
    doctorName: "Michael Chen",
    procedureType: "Endodontic",
    generalInstructions: "You've just completed a root canal treatment which has removed the infected pulp tissue from your tooth and sealed the canals. Your tooth may feel sensitive for a few days, which is normal. These instructions will help ensure proper healing and comfort during your recovery period.",
    specificInstructions: [
      "Take all medications as prescribed.",
      "The numbness from the anesthetic should wear off within 2-4 hours.",
      "Your tooth may feel sensitive for the next few days, especially to biting pressure.",
      "Avoid chewing on the treated tooth until your permanent restoration (crown) is placed.",
      "Continue your normal oral hygiene routine, brushing and flossing carefully around the treated area.",
      "Rinse with warm salt water (1/2 teaspoon in 8 oz water) 2-3 times daily to reduce inflammation.",
      "A temporary filling has been placed; avoid sticky or hard foods that could dislodge it.",
      "Schedule your follow-up appointment for the permanent restoration as recommended."
    ],
    medications: [
      {
        name: "Acetaminophen (Tylenol)",
        dosage: "500mg",
        frequency: "Every 6 hours as needed",
        purpose: "Pain relief",
        duration: "2-3 days or as needed"
      }
    ],
    restrictions: [
      "Avoid chewing on the treated tooth until your permanent restoration is placed",
      "Avoid very hot foods and drinks while you're still numb to prevent burns",
      "Avoid sticky or hard foods that could damage or dislodge your temporary filling"
    ],
    followUpRequired: true,
    followUpTimeline: "Return within 2-4 weeks for permanent crown placement",
    followUpDetails: "It's essential to complete your treatment with a permanent restoration to protect the tooth from fracture and reinfection.",
    emergencyContact: "If you experience severe pain, swelling, or if your temporary filling comes out, please call (555) 123-4567 to schedule an emergency appointment.",
    dateCreated: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    lastViewed: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString() // Viewed 12 days ago
  };
  
  // Store the examples
  mockPostOpInstructions.set(extraction.id, extraction);
  mockPostOpInstructions.set(rootCanal.id, rootCanal);
}

// Create example data when server starts
createExamplePostOpInstructions();

export default router;