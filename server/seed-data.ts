import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { InsertUser, InsertPatient } from "@shared/schema";

// Create our own password hashing function for seeding
const scryptAsync = promisify(scrypt);

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(8).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

/**
 * Seeds the database with initial data for testing purposes
 */
export async function seedDatabase() {
  try {
    console.log("Seeding database with initial test data...");
    
    // Create a provider/dentist user
    const dentistData: Omit<InsertUser, "passwordHash"> & { password: string } = {
      username: "dentist",
      password: "dentist123", // Plain text for seeding
      email: "dentist@example.com",
      firstName: "John",
      lastName: "Smith",
      role: "doctor",
      phoneNumber: "555-123-4567",
      dateOfBirth: "1980-01-01",
      specialization: "General Dentistry",
      licenseNumber: "DDS12345"
    };
    
    // Hash the password for storage
    const passwordHash = await hashPassword(dentistData.password);
    
    // Create the dentist user
    const dentist = await storage.createUserDb({
      username: dentistData.username,
      email: dentistData.email,
      firstName: dentistData.firstName,
      lastName: dentistData.lastName,
      role: dentistData.role,
      passwordHash,
      mfaSecret: "",
      mfaEnabled: false,
      specialization: dentistData.specialization,
      licenseNumber: dentistData.licenseNumber
    });
    
    console.log(`Created dentist user: ${dentist.username} (ID: ${dentist.id})`);
    
    // Create some test patients
    const patientData: Partial<InsertPatient>[] = [
      {
        userId: dentist.id + 1, // User ID for this patient
        homeAddress: "123 Main St, Anytown, USA",
        emergencyContactName: "Jane Smith",
        emergencyContactPhone: "555-987-6543",
        emergencyContactRelationship: "Spouse",
        insuranceProvider: "Delta Dental",
        insuranceNumber: "DD123456789",
        allergies: "Penicillin",
        adverseAnestheticReaction: false,
        currentMedications: "Lisinopril 10mg daily",
        pastSurgeries: "Appendectomy (2015)",
        smokesTobacco: false,
        useAlcohol: true,
        isPregnantOrNursing: false,
        lastDentalVisit: "2023-10-15",
        chiefComplaint: "Sensitivity in upper right molar",
        currentSymptoms: "Pain when eating cold foods",
        previousDentalProcedures: "Regular cleanings, one root canal (2021)",
        highBloodPressure: true
      },
      {
        userId: dentist.id + 2, // User ID for this patient
        homeAddress: "456 Oak St, Anytown, USA",
        emergencyContactName: "Robert Johnson",
        emergencyContactPhone: "555-222-3333",
        emergencyContactRelationship: "Brother",
        insuranceProvider: "Cigna Dental",
        insuranceNumber: "CG987654321",
        allergies: "Latex, Codeine",
        adverseAnestheticReaction: true,
        currentMedications: "Metformin 500mg twice daily, Atorvastatin 20mg daily",
        diabetes: true,
        heartDisease: false,
        highBloodPressure: true,
        smokesTobacco: true,
        useAlcohol: false,
        lastDentalVisit: "2023-08-22",
        chiefComplaint: "Broken filling",
        currentSymptoms: "Sharp edge on lower left molar",
        previousDentalProcedures: "Multiple fillings, crown on tooth #19"
      }
    ];
    
    // Create user accounts for the patients
    for (let i = 0; i < patientData.length; i++) {
      const patientUserData: Omit<InsertUser, "passwordHash"> & { password: string } = {
        username: `patient${i+1}`,
        password: "patient123", // Plain text for seeding
        email: `patient${i+1}@example.com`,
        firstName: i === 0 ? "Sarah" : "Michael",
        lastName: i === 0 ? "Johnson" : "Williams",
        role: "patient",
        phoneNumber: i === 0 ? "555-111-2222" : "555-333-4444",
        dateOfBirth: i === 0 ? "1985-05-15" : "1972-12-03"
      };
      
      // Hash the password for storage
      const patientPasswordHash = await hashPassword(patientUserData.password);
      
      // Create the patient user
      const patientUser = await storage.createUserDb({
        username: patientUserData.username,
        email: patientUserData.email,
        firstName: patientUserData.firstName,
        lastName: patientUserData.lastName,
        role: patientUserData.role,
        passwordHash: patientPasswordHash,
        mfaSecret: "",
        mfaEnabled: false
      });
      
      console.log(`Created patient user: ${patientUser.username} (ID: ${patientUser.id})`);
      
      // Create the patient record
      const patient = await storage.createPatient({
        ...patientData[i],
        userId: patientUser.id
      });
      
      console.log(`Created patient record: ${patientUser.firstName} ${patientUser.lastName} (ID: ${patient.id})`);
    }
    
    console.log("Database seeding completed successfully");
    
    // Return the test credentials for easy reference
    return {
      dentist: {
        username: dentistData.username,
        password: dentistData.password
      },
      patients: [
        { username: "patient1", password: "patient123" },
        { username: "patient2", password: "patient123" }
      ]
    };
  } catch (error) {
    console.error("Error seeding database:", error);
    throw error;
  }
}