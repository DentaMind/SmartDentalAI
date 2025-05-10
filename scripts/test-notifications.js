import { storage } from '../server/storage.js';

async function testNotifications() {
  console.log('Testing notification system...\n');

  // Test 1: Diagnosis Notification
  console.log('1. Testing Diagnosis Notification...');
  await storage.notifyDiagnosisAdded({
    id: 101,
    patientId: 5,
    doctorId: 2,
    diagnosis: 'Cavity in tooth #3',
    date: new Date(),
    status: 'active',
    notes: 'Requires filling',
    createdAt: new Date(),
    updatedAt: new Date()
  });
  console.log('✅ Diagnosis notification triggered\n');

  // Test 2: Insurance Rejection
  console.log('2. Testing Insurance Rejection...');
  await storage.notifyInsuranceClaimRejected({
    id: 77,
    patientId: 12,
    claimNumber: 'CLAIM-3344',
    status: 'rejected',
    amount: 150.00,
    submissionDate: new Date(),
    rejectionDate: new Date(),
    rejectionReason: 'Procedure not covered',
    createdAt: new Date(),
    updatedAt: new Date()
  });
  console.log('✅ Insurance rejection notification triggered\n');

  // Test 3: Appointment
  console.log('3. Testing Appointment Notification...');
  await storage.notifyAppointmentCreated({
    id: 301,
    patientId: 15,
    doctorId: 4,
    date: new Date('2025-04-17'),
    status: 'scheduled',
    type: 'checkup',
    notes: 'Regular cleaning',
    createdAt: new Date(),
    updatedAt: new Date()
  });
  console.log('✅ Appointment notification triggered\n');

  // Test 4: Lab Case Overdue
  console.log('4. Testing Lab Case Overdue...');
  await storage.notifyLabCaseOverdue({
    id: 9001,
    patientId: 5,
    caseNumber: 'LAB-2024A',
    status: 'overdue',
    dueDate: new Date('2024-03-01'),
    labName: 'Dental Lab Inc',
    description: 'Crown fabrication',
    createdAt: new Date(),
    updatedAt: new Date()
  });
  console.log('✅ Lab case overdue notification triggered\n');

  console.log('All notification tests completed!');
  console.log('\nPlease check your notification bell to verify:');
  console.log('1. All notifications appear with correct messages');
  console.log('2. Patient names are displayed');
  console.log('3. Clicking navigates to correct patient charts');
  console.log('4. Notifications clear when marked as read');
}

// Run the tests
testNotifications().catch(console.error); 