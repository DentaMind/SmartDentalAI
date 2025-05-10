/**
 * Script to seed sample X-rays for testing the X-ray comparison feature
 */

import { pool, db } from './server/db.js';
import { xrays } from './shared/schema.js';
import { eq } from 'drizzle-orm';

async function seedSampleXrays() {
  console.log('Starting to seed sample X-rays...');
  
  try {
    // Check if there are already X-rays in the database
    const existingXrays = await db.select().from(xrays);
    
    if (existingXrays.length > 0) {
      console.log(`Database already has ${existingXrays.length} X-rays. Skipping seeding.`);
      console.log('Existing X-rays:');
      for (const xray of existingXrays) {
        console.log(`- Type: ${xray.type}, Patient ID: ${xray.patientId}, Date: ${xray.date}`);
      }
      return;
    }

    // Get all patients
    const patients = await db.query.patients.findMany();
    
    if (patients.length === 0) {
      console.log('No patients found in the database. Please run seed-test-patients.js first.');
      return;
    }
    
    console.log(`Found ${patients.length} patients in the database.`);
    
    // Select the first patient to add X-rays to
    const patient = patients[0];
    console.log(`Adding X-rays for patient ID: ${patient.id}`);
    
    // Sample X-ray data
    const sampleXrays = [
      {
        patientId: patient.id,
        type: 'BWX',
        date: new Date(2023, 1, 15), // February 15, 2023
        provider: 'Dr. Smith',
        description: 'Bitewing X-rays showing molar region',
        imageUrl: 'https://dentalmirror.org/wp-content/uploads/2014/05/BW-Xray.jpg',
        aiAnalyzed: true,
        aiFindings: JSON.stringify(['Caries detected on tooth #30', 'Bone loss between #19-20']),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        patientId: patient.id,
        type: 'BWX',
        date: new Date(2023, 7, 20), // August 20, 2023
        provider: 'Dr. Johnson',
        description: 'Follow-up bitewing X-rays',
        imageUrl: 'https://dentalmirror.org/wp-content/uploads/2014/05/BW-Xray-2.jpg',
        aiAnalyzed: true,
        aiFindings: JSON.stringify(['Caries on tooth #30 has progressed', 'New caries detected on tooth #31']),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        patientId: patient.id,
        type: 'PA',
        date: new Date(2023, 2, 10), // March 10, 2023
        provider: 'Dr. Smith',
        description: 'Periapical X-ray of anterior region',
        imageUrl: 'https://www.researchgate.net/publication/328570383/figure/fig3/AS:686370868523008@1540684197297/Periapical-radiograph-showing-the-maxillary-anterior-region-Tooth-21-is-replanted-and.png',
        aiAnalyzed: false,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        patientId: patient.id,
        type: 'FMX',
        date: new Date(2023, 4, 5), // May 5, 2023
        provider: 'Dr. Wilson',
        description: 'Full mouth series',
        imageUrl: 'https://www.dentalcare.com/~/media/images/en-us/-/media/dentalcareus/education/ce-courses/ce569/image009.jpg',
        aiAnalyzed: true,
        aiFindings: JSON.stringify(['Multiple caries detected', 'Moderate bone loss in posterior regions', 'Periapical radiolucency on tooth #8']),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    
    // Insert X-rays into database
    for (const xrayData of sampleXrays) {
      await db.insert(xrays).values(xrayData);
      console.log(`Added ${xrayData.type} X-ray dated ${xrayData.date.toISOString().split('T')[0]}`);
    }
    
    console.log('Successfully seeded sample X-rays!');
    console.log('You can now test the X-ray comparison feature using the sample X-rays.');
    console.log(`Patient ID to use: ${patient.id}`);
  } catch (error) {
    console.error('Error seeding sample X-rays:', error);
  } finally {
    // Close the database connection
    await pool.end();
  }
}

// Execute the seeding function
seedSampleXrays().catch(console.error);