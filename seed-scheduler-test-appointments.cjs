/**
 * Script to seed sample appointments for testing the enhanced scheduler
 * Creates sample appointments for Dr. Abdin and Mary RDH (Hygienist)
 */

const { db } = require('./server/db');
const { appointments, users } = require('./shared/schema');
const { eq, and, between } = require('drizzle-orm');
const { format, addDays, parseISO, setHours, setMinutes } = require('date-fns');

async function seedSchedulerTestAppointments() {
  console.log('Connecting to database for seeding test appointments...');
  
  try {
    // First, ensure we have the provider accounts
    const providers = await db.select().from(users).where(
      eq(users.role, 'doctor')
    );
    
    const drAbdin = providers.find(p => p.username === 'drabdin');
    const maryRDH = await db.select().from(users).where(
      eq(users.username, 'maryrdh')
    ).then(results => results[0]);
    
    if (!drAbdin) {
      console.error('Dr. Abdin account not found. Please run seed-test-data.js first.');
      return;
    }
    
    if (!maryRDH) {
      console.error('Mary RDH account not found. Creating it now...');
      // Create Mary RDH account if it doesn't exist
      const newMaryRDH = await db.insert(users).values({
        username: 'maryrdh',
        email: 'mary@dentamind.com',
        firstName: 'Mary',
        lastName: 'Smith',
        passwordHash: '$2b$10$zxE8RrldWGJv.bK.m19iIO6lp1rRFzwKQ9zKdQIqxQTfAm9jW9YZu', // 'password'
        role: 'staff',
        specialization: 'hygienist',
        mfaEnabled: false,
        mfaSecret: '',
        createdAt: new Date(),
        updatedAt: new Date(),
      }).returning();
      
      console.log('Created Mary RDH account:', newMaryRDH[0]);
    }
    
    // Get patients
    const patients = await db.query.patients.findMany();
    
    if (patients.length < 2) {
      console.error('Not enough patients found. Please run seed-test-patients.js first.');
      return;
    }
    
    console.log(`Found ${patients.length} patients for test appointments.`);
    
    // Clear existing appointments for today to avoid duplicates
    const today = new Date();
    const todayStr = format(today, 'yyyy-MM-dd');
    
    await db.delete(appointments).where(
      and(
        between(
          appointments.date, 
          parseISO(`${todayStr}T00:00:00`), 
          parseISO(`${todayStr}T23:59:59`)
        )
      )
    );
    
    console.log('Cleared existing appointments for today.');
    
    // Create Dr. Abdin's schedule as specified
    console.log('Creating Dr. Abdin\'s schedule...');
    const drAbdinAppointments = [
      {
        patientId: patients[0].id,
        doctorId: drAbdin.id,
        date: setMinutes(setHours(today, 8), 0),
        duration: 60,
        procedureType: 'Comprehensive Exam', 
        notes: 'Comprehensive exam - new patient',
        status: 'confirmed',
        operatory: 'Room 1',
      },
      {
        patientId: patients[1].id,
        doctorId: drAbdin.id,
        date: setMinutes(setHours(today, 9), 0),
        duration: 90,
        procedureType: 'Crown Prep',
        notes: 'Crown prep for tooth #19',
        status: 'confirmed',
        operatory: 'Room 2',
      },
      {
        patientId: patients[0].id,
        doctorId: drAbdin.id,
        date: setMinutes(setHours(today, 10), 30),
        duration: 90,
        procedureType: 'Root Canal',
        notes: 'Root canal treatment on tooth #14',
        status: 'confirmed',
        operatory: 'Room 1',
      },
      {
        patientId: patients[1].id,
        doctorId: drAbdin.id,
        date: setMinutes(setHours(today, 12), 0),
        duration: 30,
        procedureType: 'Composite',
        notes: 'Composite filling on tooth #30',
        status: 'confirmed',
        operatory: 'Room 2',
      },
      {
        patientId: patients[0].id,
        doctorId: drAbdin.id,
        date: setMinutes(setHours(today, 12), 30),
        duration: 30,
        procedureType: 'Recement Crown',
        notes: 'Recement crown on tooth #3',
        status: 'confirmed',
        operatory: 'Room 1',
      },
      {
        patientId: patients[1].id,
        doctorId: drAbdin.id,
        date: setMinutes(setHours(today, 12), 30),
        duration: 30,
        procedureType: 'Recement Crown',
        notes: 'Recement crown on tooth #14',
        status: 'confirmed',
        operatory: 'Room 2',
      },
      // 1-2pm: Break (no appointments)
    ];
    
    // Insert Dr. Abdin's appointments
    for (const appt of drAbdinAppointments) {
      await db.insert(appointments).values(appt);
    }
    
    // Create Mary RDH's schedule (one-hour appointments from 7am-5pm)
    console.log('Creating Mary RDH\'s schedule...');
    const maryRDHAppointments = [];
    
    // Generate appointments for each hour from 7am to 5pm (excluding lunch hour)
    for (let hour = 7; hour < 17; hour++) {
      // Skip lunch hour
      if (hour === 12) continue;
      
      maryRDHAppointments.push({
        patientId: patients[hour % patients.length].id,
        doctorId: maryRDH.id,
        date: setMinutes(setHours(today, hour), 0),
        duration: 60,
        procedureType: hour % 3 === 0 ? 'Prophylaxis' : 'Perio Maintenance',
        notes: hour % 3 === 0 ? 'Regular cleaning' : 'Periodontal maintenance',
        status: 'confirmed',
        operatory: 'Hygiene Room 1',
      });
    }
    
    // Insert Mary RDH's appointments
    for (const appt of maryRDHAppointments) {
      await db.insert(appointments).values(appt);
    }
    
    console.log('Successfully created test appointments!');
    console.log(`Created ${drAbdinAppointments.length} appointments for Dr. Abdin`);
    console.log(`Created ${maryRDHAppointments.length} appointments for Mary RDH`);
    
    console.log('Sample schedule created! Log in with:');
    console.log('Dr. Abdin: username=drabdin, password=password');
    console.log('Mary RDH: username=maryrdh, password=password');
    
  } catch (error) {
    console.error('Error seeding test appointments:', error);
  }
}

// Run the seeding function
seedSchedulerTestAppointments()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Critical error during seeding:', error);
    process.exit(1);
  });