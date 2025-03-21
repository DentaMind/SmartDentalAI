/**
 * Script to add sample X-rays for testing the X-ray comparison feature
 * in DentaMind
 */

require('dotenv').config();
const { db } = require('./server/db');
const { xrays } = require('./shared/schema');

// Sample X-ray URLs (placeholder URLs - replace with actual URLs in production)
const SAMPLE_XRAYS = [
  {
    patientId: 1, // Test patient
    doctorId: 4, // Test doctor
    imageUrl: 'https://i.imgur.com/6QwNfDO.jpeg', // Panoramic X-ray
    date: new Date('2024-03-01'),
    notes: 'Initial panoramic x-ray. Shows potential wisdom teeth issues.',
    type: 'panoramic'
  },
  {
    patientId: 1,
    doctorId: 4,
    imageUrl: 'https://i.imgur.com/R6oJPZy.jpeg', // Bitewing X-ray 
    date: new Date('2024-03-01'),
    notes: 'Right bitewing. No immediate concerns.',
    type: 'bitewing'
  },
  {
    patientId: 1,
    doctorId: 4,
    imageUrl: 'https://i.imgur.com/jFiIuJO.jpeg', // Bitewing X-ray
    date: new Date('2024-03-01'),
    notes: 'Left bitewing. Potential early caries on tooth #19.',
    type: 'bitewing'
  },
  {
    patientId: 1,
    doctorId: 4,
    imageUrl: 'https://i.imgur.com/yIuuM9r.jpeg', // Periapical X-ray
    date: new Date('2024-03-01'),
    notes: 'Periapical x-ray of tooth #8 and #9. No periapical pathology.',
    type: 'periapical'
  },
  // Follow-up X-rays from a later date
  {
    patientId: 1,
    doctorId: 4,
    imageUrl: 'https://i.imgur.com/6QwNfDO.jpeg', // Panoramic X-ray (same image for testing comparison)
    date: new Date('2024-06-15'),
    notes: 'Follow-up panoramic x-ray. Wisdom teeth showing progression.',
    type: 'panoramic'
  },
  {
    patientId: 1,
    doctorId: 4, 
    imageUrl: 'https://i.imgur.com/R6oJPZy.jpeg', // Bitewing X-ray (same image for testing comparison)
    date: new Date('2024-06-15'),
    notes: 'Follow-up right bitewing. No changes observed.',
    type: 'bitewing'
  }
];

/**
 * Add sample X-ray records to the database
 */
async function addSampleXrays() {
  try {
    console.log('Adding sample X-rays for test patients...');

    // Check for existing X-rays to avoid duplicates
    const existingXrays = await db.select().from(xrays);
    console.log(`Found ${existingXrays.length} existing X-rays`);

    if (existingXrays.length > 0) {
      console.log('Sample X-rays already exist. Skipping insertion.');
      return;
    }

    // Insert sample X-rays
    for (const xrayData of SAMPLE_XRAYS) {
      await db.insert(xrays).values(xrayData);
      console.log(`Added X-ray of type ${xrayData.type} for patient ${xrayData.patientId}`);
    }

    console.log('Successfully added sample X-rays!');
  } catch (error) {
    console.error('Error adding sample X-rays:', error);
  } finally {
    // Close the database connection
    process.exit(0);
  }
}

// Run the script
addSampleXrays();