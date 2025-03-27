/**
 * Comprehensive Test Patient Creation Script for DentaMind
 * 
 * This script creates test patients with complete chart data:
 * - Basic patient info with complete medical histories
 * - Periodontal charts with pocket depths, bleeding points, etc.
 * - Restorative charts with fillings, crowns, etc.
 * - X-rays with AI analysis results
 * - Medical notes and treatment plans
 * 
 * Use this script to create demo patients that integrate with all AI systems
 */

import { pool, db } from './server/db.js';
import { patients, users, periodontalCharts, restorativeCharts, xrays, medicalNotes, treatmentPlans } from './shared/schema.js';
import bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';

// Helper function to hash passwords
async function hashPassword(password) {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}

// Helper function to get a patient's medical history
async function getPatientMedicalHistory(patientId) {
  try {
    const patient = await db.query.patients.findFirst({
      where: eq(patients.id, patientId)
    });
    
    if (!patient || !patient.medicalHistory) {
      return {};
    }
    
    return typeof patient.medicalHistory === 'string' 
      ? JSON.parse(patient.medicalHistory)
      : patient.medicalHistory;
  } catch (error) {
    console.error('Error getting patient medical history:', error);
    return {};
  }
}

async function seedTestPatientsWithCharts() {
  console.log('Starting to seed comprehensive test patients with charts...');
  
  try {
    // Check if there are already patients in the database
    const existingPatients = await db.select().from(patients);
    
    if (existingPatients.length > 0) {
      console.log(`Database already has ${existingPatients.length} patients. Continuing with X-ray additions.`);
    } else {
      console.log('No patients found. Creating test patients...');
      
      // Create test users first (patients need user accounts)
      const hashedPassword = await hashPassword('password');
      
      const testUsers = [
        {
          username: 'patient1',
          password: hashedPassword,
          role: 'patient',
          language: 'en',
          firstName: 'John',
          lastName: 'Smith',
          email: 'jsmith@example.com',
          phoneNumber: '555-123-4567',
          dateOfBirth: new Date('1985-04-15'),
          insuranceProvider: 'Delta Dental',
          insuranceNumber: 'DD123456789'
        },
        {
          username: 'patient2',
          password: hashedPassword,
          role: 'patient',
          language: 'en',
          firstName: 'Mary',
          lastName: 'Johnson',
          email: 'mjohnson@example.com',
          phoneNumber: '555-234-5678',
          dateOfBirth: new Date('1975-07-22'),
          insuranceProvider: 'Cigna',
          insuranceNumber: 'CI987654321'
        },
        {
          username: 'patient3',
          password: hashedPassword,
          role: 'patient',
          language: 'en',
          firstName: 'Robert',
          lastName: 'Williams',
          email: 'rwilliams@example.com',
          phoneNumber: '555-345-6789',
          dateOfBirth: new Date('1990-11-08'),
          insuranceProvider: 'Aetna',
          insuranceNumber: 'AE456789123'
        }
      ];
      
      const createdUsers = [];
      
      // Insert users
      for (const userData of testUsers) {
        const [user] = await db.insert(users).values(userData).returning();
        createdUsers.push(user);
        console.log(`Created user ${user.firstName} ${user.lastName} (ID: ${user.id})`);
      }
      
      // Create patients linked to the users
      const testPatients = [
        {
          // Patient 1: Severe periodontal disease, X-ray shows bone loss
          userId: createdUsers[0].id,
          medicalHistory: JSON.stringify({
            systemicConditions: ["Diabetes Type 2"],
            medications: ["Metformin", "Lisinopril"],
            allergies: ["Penicillin"],
            smoking: true,
            vitalSigns: {
              bloodPressure: "142/88",
              heartRate: 78
            }
          }),
          allergies: JSON.stringify(["Penicillin", "Sulfa"]),
          bloodType: 'A+',
          currentMedications: JSON.stringify(["Metformin", "Lisinopril"]),
          lastDentalVisit: new Date('2024-11-10'),
          chiefComplaint: 'Bleeding gums and sensitivity',
          hypertension: true,
          diabetes: true,
          heartDisease: false,
          asthma: false,
          arthritis: false,
          cancer: false,
          stroke: false,
          kidneyDisease: false,
          liverDisease: false,
          thyroidDisease: false,
          mentalIllness: false,
          seizures: false,
          bleedingDisorders: false,
          autoimmune: false,
          hepatitis: false,
          hivAids: false,
          lungDisease: false,
          osteoporosis: false
        },
        {
          // Patient 2: Mild periodontal disease with receding gums
          userId: createdUsers[1].id,
          medicalHistory: JSON.stringify({
            systemicConditions: ["Hypertension"],
            medications: ["Amlodipine"],
            allergies: ["Latex"],
            smoking: false,
            vitalSigns: {
              bloodPressure: "138/85",
              heartRate: 72
            }
          }),
          allergies: JSON.stringify(["Latex", "Ibuprofen"]),
          bloodType: 'O-',
          currentMedications: JSON.stringify(["Amlodipine"]),
          lastDentalVisit: new Date('2024-09-15'),
          chiefComplaint: 'Sensitivity to cold',
          hypertension: true,
          diabetes: false,
          heartDisease: false,
          asthma: false,
          arthritis: false,
          cancer: false,
          stroke: false,
          kidneyDisease: false,
          liverDisease: false,
          thyroidDisease: false,
          mentalIllness: false,
          seizures: false,
          bleedingDisorders: false,
          autoimmune: false,
          hepatitis: false,
          hivAids: false,
          lungDisease: false,
          osteoporosis: false
        },
        {
          // Patient 3: Multiple restorative needs (multiple caries)
          userId: createdUsers[2].id,
          medicalHistory: JSON.stringify({
            systemicConditions: [],
            medications: [],
            allergies: [],
            smoking: false,
            vitalSigns: {
              bloodPressure: "120/80",
              heartRate: 68
            }
          }),
          allergies: JSON.stringify([]),
          bloodType: 'B+',
          currentMedications: JSON.stringify([]),
          lastDentalVisit: new Date('2024-10-22'),
          chiefComplaint: 'Toothache on right side',
          hypertension: false,
          diabetes: false,
          heartDisease: false,
          asthma: false,
          arthritis: false,
          cancer: false,
          stroke: false,
          kidneyDisease: false,
          liverDisease: false,
          thyroidDisease: false,
          mentalIllness: false,
          seizures: false,
          bleedingDisorders: false,
          autoimmune: false,
          hepatitis: false,
          hivAids: false,
          lungDisease: false,
          osteoporosis: false
        }
      ];
      
      const createdPatients = [];
      
      // Insert patients
      for (const patientData of testPatients) {
        const [patient] = await db.insert(patients).values(patientData).returning();
        createdPatients.push(patient);
        console.log(`Created patient record for user ID: ${patient.userId} (Patient ID: ${patient.id})`);
      }
      
      // Create periodontal charts
      const perioCharts = [
        {
          // Severe periodontal disease
          patientId: createdPatients[0].id,
          date: new Date('2025-03-20'),
          chartData: JSON.stringify({
            probingDepths: {
              "1": {"facial": [5, 6, 5], "lingual": [4, 7, 5]},
              "2": {"facial": [5, 7, 5], "lingual": [5, 6, 5]},
              "3": {"facial": [6, 7, 5], "lingual": [5, 6, 5]},
              "14": {"facial": [6, 7, 5], "lingual": [5, 6, 5]},
              "15": {"facial": [5, 7, 5], "lingual": [5, 6, 5]},
              "30": {"facial": [5, 6, 5], "lingual": [4, 6, 5]},
              "31": {"facial": [5, 6, 5], "lingual": [4, 6, 5]}
            }
          }),
          notes: 'Patient has generalized severe chronic periodontitis with bone loss visible on radiographs. Recommended scaling and root planing all quadrants followed by periodontal maintenance every 3 months.',
          providerId: 1, // Assuming dentist user has ID 1
          bleedingPoints: JSON.stringify({
            "1": {"facial": [true, true, true], "lingual": [true, true, false]},
            "2": {"facial": [true, true, false], "lingual": [true, false, false]},
            "3": {"facial": [true, true, true], "lingual": [true, true, false]}
          }),
          mobility: JSON.stringify({
            "1": 2, "2": 1, "3": 2, "14": 1, "15": 1, "30": 1, "31": 2
          }),
          furcation: JSON.stringify({
            "3": {"facial": 2, "lingual": 1},
            "14": {"facial": 1, "lingual": 0},
            "30": {"facial": 1, "lingual": 1}
          })
        },
        {
          // Mild periodontal disease
          patientId: createdPatients[1].id,
          date: new Date('2025-03-21'),
          chartData: JSON.stringify({
            probingDepths: {
              "1": {"facial": [3, 4, 3], "lingual": [2, 3, 3]},
              "2": {"facial": [3, 4, 3], "lingual": [3, 3, 3]},
              "3": {"facial": [4, 5, 4], "lingual": [3, 4, 3]},
              "14": {"facial": [4, 5, 4], "lingual": [3, 4, 3]},
              "15": {"facial": [3, 4, 3], "lingual": [3, 3, 3]},
              "30": {"facial": [3, 4, 3], "lingual": [3, 3, 3]},
              "31": {"facial": [3, 4, 3], "lingual": [3, 3, 3]}
            }
          }),
          notes: 'Patient shows localized mild periodontitis with gingival recession on #7, #8, #9, #10. Recommended scaling and improved home care techniques.',
          providerId: 1,
          bleedingPoints: JSON.stringify({
            "7": {"facial": [false, true, false], "lingual": [false, true, false]},
            "8": {"facial": [false, true, false], "lingual": [false, false, false]},
            "9": {"facial": [false, true, false], "lingual": [false, false, false]},
            "10": {"facial": [false, true, false], "lingual": [false, true, false]}
          }),
          mobility: JSON.stringify({
            "3": 1, "19": 1
          }),
          furcation: JSON.stringify({
            "3": {"facial": 1, "lingual": 0},
            "19": {"facial": 1, "lingual": 0}
          })
        }
      ];
      
      // Insert periodontal charts
      for (const chartData of perioCharts) {
        const [chart] = await db.insert(periodontalCharts).values(chartData).returning();
        console.log(`Created periodontal chart for patient ID: ${chart.patientId} (Chart ID: ${chart.id})`);
      }
      
      // Create restorative charts
      const restorativeChartsData = [
        {
          // Multiple caries
          patientId: createdPatients[2].id,
          date: new Date('2025-03-22'),
          chartData: JSON.stringify({
            restorations: {
              "2": {"occlusal": "caries", "mesial": "caries"},
              "3": {"occlusal": "caries", "distal": "caries"},
              "14": {"occlusal": "caries", "buccal": "caries"},
              "15": {"occlusal": "caries", "mesial": "caries"},
              "18": {"occlusal": "amalgam", "distal": "amalgam"},
              "19": {"occlusal": "amalgam", "mesial": "amalgam"},
              "20": {"occlusal": "caries", "buccal": "caries"},
              "29": {"facial": "caries", "mesial": "caries"},
              "30": {"occlusal": "caries", "distal": "caries", "lingual": "caries"}
            }
          }),
          notes: 'Multiple carious lesions detected. Recommended treatment plan includes composite restorations on teeth #2, #3, #14, #15, #20, #29, #30.',
          providerId: 1
        },
        {
          // Mixed needs (senior patient)
          patientId: createdPatients[1].id,
          date: new Date('2025-03-22'),
          chartData: JSON.stringify({
            restorations: {
              "2": {"occlusal": "composite", "mesial": "composite"},
              "3": {"occlusal": "crown", "distal": "crown", "mesial": "crown", "buccal": "crown", "lingual": "crown"},
              "5": {"missing": true},
              "12": {"occlusal": "crown", "distal": "crown", "mesial": "crown", "buccal": "crown", "lingual": "crown"},
              "30": {"occlusal": "crown", "distal": "crown", "mesial": "crown", "buccal": "crown", "lingual": "crown"}
            }
          }),
          notes: 'Patient has multiple existing restorations in good condition. Recommended maintenance of existing restorations.',
          providerId: 1
        }
      ];
      
      // Insert restorative charts
      for (const chartData of restorativeChartsData) {
        const [chart] = await db.insert(restorativeCharts).values(chartData).returning();
        console.log(`Created restorative chart for patient ID: ${chart.patientId} (Chart ID: ${chart.id})`);
      }
    }

    // Now create X-rays with AI analysis for each patient
    const patientsForXrays = await db.select().from(patients).limit(3);
    
    for (const patient of patientsForXrays) {
      console.log(`Adding X-rays for patient ID: ${patient.id}`);
      
      // Get the patient's medical history for AI context
      const medicalHistory = await getPatientMedicalHistory(patient.id);
      
      // Sample X-ray data per patient with AI findings
      const patientXrays = [
        {
          // Patient 1 - Severe periodontal case
          patientId: patient.id,
          type: 'BWX',
          date: new Date(2024, 11, 15), // December 15, 2024
          provider: 'Dr. Smith',
          description: 'Bitewing X-rays showing posterior regions',
          imageUrl: 'https://dentalmirror.org/wp-content/uploads/2014/05/BW-Xray.jpg',
          aiAnalyzed: true,
          aiAnalysis: JSON.stringify({
            findings: [
              {
                type: "bone_loss", 
                location: "Teeth #19-20", 
                description: "Moderate horizontal bone loss between molars",
                confidence: 0.92,
                severity: "moderate"
              },
              {
                type: "caries", 
                location: "Tooth #30 Occlusal", 
                description: "Occlusal caries reaching dentin",
                confidence: 0.89,
                severity: "moderate"
              },
              {
                type: "periapical", 
                location: "Tooth #14", 
                description: "Small periapical radiolucency",
                confidence: 0.78,
                severity: "mild"
              }
            ],
            analysis: "The X-ray shows signs of periodontal disease with moderate horizontal bone loss in the posterior regions. There is also occlusal caries on tooth #30 that reaches the dentin, requiring restoration. A small periapical radiolucency is noted on tooth #14, which may indicate early periapical pathology.",
            recommendations: [
              "Schedule scaling and root planing for all quadrants",
              "Restore caries on tooth #30",
              "Monitor tooth #14 for pulpal symptoms",
              "Consider full-mouth series for comprehensive evaluation"
            ]
          }),
          analysisDate: new Date(),
          pathologyDetected: true
        },
        {
          // Follow-up X-ray
          patientId: patient.id,
          type: 'PA',
          date: new Date(2025, 1, 20), // February 20, 2025
          provider: 'Dr. Johnson',
          description: 'Periapical X-ray of tooth #14',
          imageUrl: 'https://www.researchgate.net/publication/328570383/figure/fig3/AS:686370868523008@1540684197297/Periapical-radiograph-showing-the-maxillary-anterior-region-Tooth-21-is-replanted-and.png',
          aiAnalyzed: true,
          aiAnalysis: JSON.stringify({
            findings: [
              {
                type: "periapical", 
                location: "Tooth #14", 
                description: "Periapical radiolucency has increased in size",
                confidence: 0.94,
                severity: "moderate"
              },
              {
                type: "root_canal", 
                location: "Tooth #14", 
                description: "Pulp chamber appears narrowed",
                confidence: 0.88,
                severity: "moderate"
              }
            ],
            analysis: "The periapical X-ray of tooth #14 shows an increased periapical radiolucency compared to the previous examination. The pulp chamber appears narrowed, suggesting pulpal changes. These findings are consistent with progressive pulpal and periapical pathology.",
            recommendations: [
              "Recommended endodontic evaluation for tooth #14",
              "Consider root canal therapy",
              "Clinical testing for pulp vitality is advised"
            ],
            comparison: {
              changes: ["Periapical radiolucency has increased in size", "Pulp chamber appears narrower"],
              progression: "worsened"
            }
          }),
          analysisDate: new Date(),
          pathologyDetected: true
        }
      ];
      
      // Insert X-rays for this patient
      for (const xrayData of patientXrays) {
        const [xray] = await db.insert(xrays).values(xrayData).returning();
        console.log(`Added ${xrayData.type} X-ray dated ${xrayData.date.toISOString().split('T')[0]} for patient ID: ${patient.id} (X-ray ID: ${xray.id})`);
      }
      
      // Add medical notes for context
      const medicaNoteData = {
        patientId: patient.id,
        provider: 'Dr. Smith',
        providerRole: 'doctor',
        category: 'diagnostic',
        noteText: `Patient presents with symptoms of periodontal disease. X-rays show bone loss in posterior regions. 
        Recommended comprehensive periodontal treatment including scaling and root planing.
        AI analysis suggests moderate to severe periodontitis with potential endodontic issues on tooth #14.`,
        date: new Date(),
        private: false
      };
      
      const [note] = await db.insert(medicalNotes).values(medicaNoteData).returning();
      console.log(`Added medical note for patient ID: ${patient.id} (Note ID: ${note.id})`);
      
      // Add treatment plan based on AI findings
      const treatmentPlanData = {
        patientId: patient.id,
        createdBy: 1, // Assuming dentist user has ID 1
        title: 'Comprehensive Treatment Plan',
        description: 'Based on clinical examination and AI X-ray analysis',
        procedures: JSON.stringify([
          {
            toothNumber: '14',
            procedure: 'Root Canal Therapy',
            status: 'recommended',
            urgency: 'high',
            estimatedCost: 1200,
            insuranceEstimate: 800,
            aiRecommended: true
          },
          {
            toothNumber: '30',
            procedure: 'Composite Restoration',
            status: 'recommended',
            urgency: 'medium',
            estimatedCost: 250,
            insuranceEstimate: 175,
            aiRecommended: true
          },
          {
            quadrants: ['UL', 'UR', 'LL', 'LR'],
            procedure: 'Scaling and Root Planing',
            status: 'recommended',
            urgency: 'high',
            estimatedCost: 1000,
            insuranceEstimate: 800,
            aiRecommended: true
          }
        ]),
        totalEstimate: 2450,
        insuranceCoverage: 1775,
        patientResponsibility: 675,
        approvedDate: null,
        completedDate: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const [plan] = await db.insert(treatmentPlans).values(treatmentPlanData).returning();
      console.log(`Added treatment plan for patient ID: ${patient.id} (Plan ID: ${plan.id})`);
      
      break; // Just do one patient for now to test
    }
    
    console.log('Successfully seeded test patients with charts and X-rays!');
    console.log('You can now test the patient directory and X-ray analysis features.');
  } catch (error) {
    console.error('Error seeding test patients with charts:', error);
  } finally {
    // Close the database connection
    await pool.end();
  }
}

// Execute the seeding function
seedTestPatientsWithCharts().catch(console.error);