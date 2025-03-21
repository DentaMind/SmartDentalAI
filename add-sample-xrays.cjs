/**
 * Script to add sample X-rays for testing the X-ray comparison feature
 * in DentaMind
 */

require('dotenv').config();
const { Pool } = require('pg');

// Initialize database connection
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Sample X-ray URLs (using public domain dental X-ray examples for testing)
const SAMPLE_XRAYS = [
  {
    patientId: 1, // Test patient
    doctorId: 4, // Test doctor
    imageUrl: 'https://i.imgur.com/6QwNfDO.jpeg', // Panoramic X-ray
    date: '2024-03-01',
    notes: 'Initial panoramic x-ray. Shows potential wisdom teeth issues.',
    type: 'panoramic'
  },
  {
    patientId: 1,
    doctorId: 4,
    imageUrl: 'https://i.imgur.com/R6oJPZy.jpeg', // Bitewing X-ray 
    date: '2024-03-01',
    notes: 'Right bitewing. No immediate concerns.',
    type: 'bitewing'
  },
  {
    patientId: 1,
    doctorId: 4,
    imageUrl: 'https://i.imgur.com/jFiIuJO.jpeg', // Bitewing X-ray
    date: '2024-03-01',
    notes: 'Left bitewing. Potential early caries on tooth #19.',
    type: 'bitewing'
  },
  {
    patientId: 1,
    doctorId: 4,
    imageUrl: 'https://i.imgur.com/yIuuM9r.jpeg', // Periapical X-ray
    date: '2024-03-01',
    notes: 'Periapical x-ray of tooth #8 and #9. No periapical pathology.',
    type: 'periapical'
  },
  // Follow-up X-rays from a later date
  {
    patientId: 1,
    doctorId: 4,
    imageUrl: 'https://i.imgur.com/6QwNfDO.jpeg', // Panoramic X-ray (same image for testing comparison)
    date: '2024-06-15',
    notes: 'Follow-up panoramic x-ray. Wisdom teeth showing progression.',
    type: 'panoramic'
  },
  {
    patientId: 1,
    doctorId: 4, 
    imageUrl: 'https://i.imgur.com/R6oJPZy.jpeg', // Bitewing X-ray (same image for testing comparison)
    date: '2024-06-15',
    notes: 'Follow-up right bitewing. No changes observed.',
    type: 'bitewing'
  }
];

/**
 * Add sample X-ray records to the database
 */
async function addSampleXrays() {
  const client = await pool.connect();
  
  try {
    console.log('Adding sample X-rays for test patients...');

    // Check for existing X-rays to avoid duplicates
    const existingResult = await client.query('SELECT COUNT(*) FROM xrays');
    const existingCount = parseInt(existingResult.rows[0].count);
    console.log(`Found ${existingCount} existing X-rays`);

    if (existingCount > 0) {
      console.log('Sample X-rays already exist. Skipping insertion.');
      return;
    }

    // Insert sample X-rays
    for (const xray of SAMPLE_XRAYS) {
      const query = `
        INSERT INTO xrays (patient_id, doctor_id, image_url, date, notes, type)
        VALUES ($1, $2, $3, $4, $5, $6)
      `;
      
      const values = [
        xray.patientId,
        xray.doctorId,
        xray.imageUrl,
        xray.date,
        xray.notes,
        xray.type
      ];
      
      await client.query(query, values);
      console.log(`Added X-ray of type ${xray.type} for patient ${xray.patientId}`);
    }

    console.log('Successfully added sample X-rays!');
  } catch (error) {
    console.error('Error adding sample X-rays:', error);
  } finally {
    client.release();
    // Close the database connection pool
    await pool.end();
  }
}

// Run the script
addSampleXrays().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
});