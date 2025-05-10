/**
 * Seed script to create test users, patients, and appointments
 * for testing the enhanced scheduler
 */

const { db } = require('./server/db');
const { users, patients, appointments } = require('./shared/schema');
const { format, parseISO, setHours, setMinutes } = require('date-fns');
const { eq, and, between } = require('drizzle-orm');
const bcrypt = require('bcrypt');

async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

async function main() {
  console.log('Connecting to database for seeding test data...');

  try {
    // Create test users if they don't exist
    const existingDentist = await db.query.users.findFirst({
      where: eq(users.username, 'dentist')
    });

    if (!existingDentist) {
      console.log('Creating dentist user...');
      await db.insert(users).values({
        username: 'dentist',
        passwordHash: await hashPassword('password'),
        email: 'dentist@dentamind.com',
        firstName: 'John',
        lastName: 'Dentist',
        role: 'doctor',
        specialization: 'General Dentist',
        mfaEnabled: false,
        mfaSecret: '',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log('Created dentist user');
    } else {
      console.log('Dentist user already exists with id:', existingDentist.id);
    }

    // Create Dr. Abdin if doesn't exist
    const existingDrAbdin = await db.query.users.findFirst({
      where: eq(users.username, 'drabdin')
    });

    if (!existingDrAbdin) {
      console.log('Creating Dr. Abdin user...');
      await db.insert(users).values({
        username: 'drabdin',
        passwordHash: await hashPassword('password'),
        email: 'drabdin@dentamind.com',
        firstName: 'Dr.',
        lastName: 'Abdin',
        role: 'doctor',
        specialization: 'General Dentist',
        mfaEnabled: false,
        mfaSecret: '',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log('Created Dr. Abdin user');
    } else {
      console.log('Dr. Abdin already exists with id:', existingDrAbdin.id);
    }

    // Create Mary RDH if doesn't exist
    const existingMaryRDH = await db.query.users.findFirst({
      where: eq(users.username, 'maryrdh')
    });

    if (!existingMaryRDH) {
      console.log('Creating Mary RDH user...');
      await db.insert(users).values({
        username: 'maryrdh',
        passwordHash: await hashPassword('password'),
        email: 'mary@dentamind.com',
        firstName: 'Mary',
        lastName: 'RDH',
        role: 'staff',
        specialization: 'hygienist',
        mfaEnabled: false,
        mfaSecret: '',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log('Created Mary RDH user');
    } else {
      console.log('Mary RDH already exists with id:', existingMaryRDH.id);
    }

    // Create test patients
    console.log('Creating test patients...');
    
    // Check if Sarah Johnson exists
    const existingSarah = await db.query.patients.findFirst({
      where: eq(patients.firstName, 'Sarah')
    });

    let sarahId;
    if (!existingSarah) {
      const sarahResult = await db.insert(patients).values({
        firstName: 'Sarah',
        lastName: 'Johnson',
        email: 'sarah.johnson@example.com',
        phoneNumber: '555-123-4567',
        dateOfBirth: '1985-05-12',
        homeAddress: '123 Main St, Anytown, USA',
        insuranceProvider: 'Delta Dental',
        insuranceNumber: 'DD12345678',
        allergies: 'Penicillin',
        emergencyContactName: 'John Johnson',
        emergencyContactPhone: '555-123-9876',
        emergencyContactRelationship: 'Husband',
        lastDentalVisit: '2023-10-15',
        chiefComplaint: 'Sensitivity in upper right molar',
        currentSymptoms: 'Pain when eating cold foods',
        previousDentalProcedures: 'Regular cleanings, one root canal (2021)'
      }).returning();
      sarahId = sarahResult[0].id;
      console.log('Created patient: Sarah Johnson');
    } else {
      sarahId = existingSarah.id;
      console.log('Sarah Johnson already exists with id:', sarahId);
    }

    // Check if Michael Williams exists
    const existingMichael = await db.query.patients.findFirst({
      where: eq(patients.firstName, 'Michael')
    });

    let michaelId;
    if (!existingMichael) {
      const michaelResult = await db.insert(patients).values({
        firstName: 'Michael',
        lastName: 'Williams',
        email: 'michael.williams@example.com',
        phoneNumber: '555-987-6543',
        dateOfBirth: '1975-08-23',
        homeAddress: '456 Oak St, Anytown, USA',
        insuranceProvider: 'Cigna Dental',
        insuranceNumber: 'CG987654321',
        allergies: 'Latex, Codeine',
        emergencyContactName: 'Robert Johnson',
        emergencyContactPhone: '555-222-3333',
        emergencyContactRelationship: 'Brother',
        lastDentalVisit: '2023-08-22',
        chiefComplaint: 'Broken filling',
        currentSymptoms: 'Sharp edge on lower left molar',
        previousDentalProcedures: 'Multiple fillings, crown on tooth #19'
      }).returning();
      michaelId = michaelResult[0].id;
      console.log('Created patient: Michael Williams');
    } else {
      michaelId = existingMichael.id;
      console.log('Michael Williams already exists with id:', michaelId);
    }

    // Get provider IDs
    const drAbdin = await db.query.users.findFirst({
      where: eq(users.username, 'drabdin')
    });

    const maryRDH = await db.query.users.findFirst({
      where: eq(users.username, 'maryrdh')
    });

    if (!drAbdin || !maryRDH) {
      console.error('Could not find necessary providers');
      return;
    }

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
        patientId: sarahId,
        doctorId: drAbdin.id,
        date: setMinutes(setHours(today, 8), 0),
        duration: 60,
        procedureType: 'Comprehensive Exam', 
        notes: 'Comprehensive exam - new patient',
        status: 'confirmed',
        operatory: 'Room 1',
      },
      {
        patientId: michaelId,
        doctorId: drAbdin.id,
        date: setMinutes(setHours(today, 9), 0),
        duration: 90,
        procedureType: 'Crown Prep',
        notes: 'Crown prep for tooth #19',
        status: 'confirmed',
        operatory: 'Room 2',
      },
      {
        patientId: sarahId,
        doctorId: drAbdin.id,
        date: setMinutes(setHours(today, 10), 30),
        duration: 90,
        procedureType: 'Root Canal',
        notes: 'Root canal treatment on tooth #14',
        status: 'confirmed',
        operatory: 'Room 1',
      },
      {
        patientId: michaelId,
        doctorId: drAbdin.id,
        date: setMinutes(setHours(today, 12), 0),
        duration: 30,
        procedureType: 'Composite',
        notes: 'Composite filling on tooth #30',
        status: 'confirmed',
        operatory: 'Room 2',
      },
      {
        patientId: sarahId,
        doctorId: drAbdin.id,
        date: setMinutes(setHours(today, 12), 30),
        duration: 30,
        procedureType: 'Recement Crown',
        notes: 'Recement crown on tooth #3',
        status: 'confirmed',
        operatory: 'Room 1',
      },
      {
        patientId: michaelId,
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
        patientId: hour % 2 === 0 ? sarahId : michaelId,
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
    
    console.log('Database seeding completed. Login with:');
    console.log('- Dentist: username=dentist, password=password');
    console.log('- Dr. Abdin: username=drabdin, password=password');
    console.log('- Mary RDH: username=maryrdh, password=password');

  } catch (error) {
    console.error('Error seeding database:', error);
  }
}

main().then(() => process.exit(0)).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});