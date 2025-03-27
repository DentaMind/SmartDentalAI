/**
 * Script to add AI-analyzed X-rays to existing patients in DentaMind
 * 
 * This script adds sample X-rays with AI analysis results to demonstrate
 * the X-ray analysis and comparison features.
 */
require('dotenv').config();
const { Pool } = require('pg');
const crypto = require('crypto');
const { promisify } = require('util');

const scryptAsync = promisify(crypto.scrypt);

async function hashPassword(password) {
  const salt = crypto.randomBytes(8).toString("hex");
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString("hex")}.${salt}`;
}

async function addXrayAnalysis() {
  console.log('Starting to add X-rays with AI analysis for existing patients...');
  
  try {
    // Connect to the database
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });

    // Get all patients
    const patientResult = await pool.query(`
      SELECT id, user_id FROM patients LIMIT 3
    `);

    if (patientResult.rows.length === 0) {
      console.error('No patients found in the database!');
      await pool.end();
      return;
    }

    console.log(`Found ${patientResult.rows.length} patients in the database`);
    
    // Add X-rays for each patient
    for (const patient of patientResult.rows) {
      console.log(`Adding X-rays for patient ID: ${patient.id}`);
      
      // Get doctor ID for X-ray attribution
      const doctorResult = await pool.query(`
        SELECT id FROM users WHERE role = 'doctor' LIMIT 1
      `);
      
      const doctorId = doctorResult.rows.length > 0 ? doctorResult.rows[0].id : 1;
      
      // Sample X-ray data per patient with AI findings
      const patientXrays = [
        {
          patientId: patient.id,
          doctorId: doctorId,
          type: 'BWX',
          date: new Date(2024, 11, 15), // December 15, 2024
          notes: 'Bitewing X-rays showing posterior regions',
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
          patientId: patient.id,
          doctorId: doctorId,
          type: 'PA',
          date: new Date(2025, 1, 20), // February 20, 2025
          notes: 'Periapical X-ray of tooth #14',
          imageUrl: 'https://www.researchgate.net/publication/328570383/figure/fig3/AS:686370868523008@1540684197297/Periapical-radiograph-of-a-maxillary-right-first-molar-showing-apical-periodontitis.png',
          aiAnalyzed: true,
          aiAnalysis: JSON.stringify({
            findings: [
              {
                type: "periapical", 
                location: "Tooth #14 Apex", 
                description: "Periapical radiolucency has increased in size since previous image",
                confidence: 0.95,
                severity: "moderate"
              },
              {
                type: "root_canal", 
                location: "Tooth #14", 
                description: "Previous root canal treatment with possible incomplete fill",
                confidence: 0.88,
                severity: "moderate"
              }
            ],
            analysis: "Follow-up periapical radiograph of tooth #14 shows enlargement of the periapical radiolucency compared to previous imaging. The existing root canal treatment appears to have incomplete fill in the distal canal. This may indicate persistent infection.",
            recommendations: [
              "Consider endodontic retreatment of tooth #14",
              "Evaluate for possible apicoectomy if retreatment fails",
              "Schedule follow-up radiograph in 6 months"
            ]
          }),
          analysisDate: new Date(),
          pathologyDetected: true
        },
        {
          patientId: patient.id,
          doctorId: doctorId,
          type: 'FMX',
          date: new Date(2025, 2, 5), // March 5, 2025
          notes: 'Full mouth series for comprehensive evaluation',
          imageUrl: 'https://img.medicalexpo.com/images_me/photo-mg/70823-16445365.jpg',
          aiAnalyzed: true,
          aiAnalysis: JSON.stringify({
            findings: [
              {
                type: "generalized_bone_loss", 
                location: "All quadrants", 
                description: "Generalized moderate horizontal bone loss",
                confidence: 0.94,
                severity: "moderate"
              },
              {
                type: "caries", 
                location: "Multiple posterior teeth", 
                description: "Multiple interproximal carious lesions",
                confidence: 0.91,
                severity: "moderate"
              },
              {
                type: "retained_root", 
                location: "Tooth #32 area", 
                description: "Retained root tip",
                confidence: 0.87,
                severity: "mild"
              },
              {
                type: "impaction", 
                location: "Tooth #17", 
                description: "Mesioangular impaction",
                confidence: 0.96,
                severity: "moderate"
              }
            ],
            analysis: "Full mouth series reveals generalized moderate horizontal bone loss consistent with chronic periodontitis. Multiple interproximal carious lesions are present on posterior teeth. A retained root tip is visible in the #32 area. Tooth #17 shows mesioangular impaction with potential risk to the adjacent second molar.",
            recommendations: [
              "Comprehensive periodontal therapy including scaling and root planing",
              "Restorative treatment for all carious lesions",
              "Surgical extraction of the retained root tip",
              "Consider extraction of impacted third molar #17",
              "Regular periodontal maintenance every 3 months"
            ]
          }),
          analysisDate: new Date(),
          pathologyDetected: true
        }
      ];
      
      // Insert X-rays for each patient
      for (const xray of patientXrays) {
        await pool.query(`
          INSERT INTO xrays (
            patient_id, doctor_id, type, date, notes, image_url, 
            ai_analysis, analysis_date, pathology_detected
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `, [
          xray.patientId, 
          xray.doctorId, 
          xray.type, 
          xray.date, 
          xray.notes, 
          xray.imageUrl,
          xray.aiAnalysis,
          xray.analysisDate,
          xray.pathologyDetected
        ]);
        
        console.log(`Added ${xray.type} X-ray for patient ID: ${xray.patientId}`);
      }
    }

    console.log('Successfully added X-rays with AI analysis!');
    console.log('You can now test the X-ray analysis and comparison features.');
    
    await pool.end();
  } catch (error) {
    console.error('Error adding X-rays with AI analysis:', error);
  }
}

// Run the script
addXrayAnalysis().catch(console.error);