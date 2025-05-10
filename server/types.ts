import {
  User,
  InsertUser,
  Patient,
  InsertPatient,
  InsuranceVerification,
  InsertInsuranceVerification,
  Appointment,
  InsertAppointment,
  Diagnosis,
  InsertDiagnosis,
  PeriodontalChart,
  InsertPeriodontalChart,
  RestorativeChartEntry,
  InsertRestorativeChartEntry,
  PerioChartEntry,
  InsertPerioChartEntry,
  XrayAiFinding,
  InsertXrayAiFinding,
  ChartingNote,
  InsertChartingNote
} from "@shared/schema";

export interface IStorage {
  // User management
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Patient management
  getPatient(id: number): Promise<(Patient & { user: User }) | undefined>;
  createPatient(patient: InsertPatient): Promise<Patient>;
  getAllPatients(): Promise<(Patient & { user: User })[]>;
  getPatientByUserId(userId: number): Promise<Patient | undefined>;
  
  // Appointment management
  createAppointment(appointment: InsertAppointment): Promise<Appointment>;
  getAppointment(appointmentId: number): Promise<Appointment | undefined>;
  updateAppointment(appointmentId: number, updates: Partial<InsertAppointment>): Promise<Appointment | undefined>;
  getDoctorAppointments(doctorId: number): Promise<Appointment[]>;
  getPatientAppointments(patientId: number): Promise<Appointment[]>;
  getAllAppointments(): Promise<Appointment[]>;
  
  // Insurance verification management
  createInsuranceVerification(verification: InsertInsuranceVerification): Promise<InsuranceVerification>;
  getInsuranceVerification(id: number): Promise<InsuranceVerification | undefined>;
  updateInsuranceVerification(id: number, updates: Partial<InsuranceVerification>): Promise<InsuranceVerification | undefined>;
  getActiveInsuranceVerifications(): Promise<InsuranceVerification[]>;
  getPatientInsuranceVerificationHistory(patientId: number): Promise<InsuranceVerification[]>;
  
  // Diagnosis management
  createDiagnosis(diagnosis: InsertDiagnosis): Promise<Diagnosis>;
  getDiagnosisById(id: number): Promise<Diagnosis | undefined>;
  getDiagnosesForPatient(patientId: number): Promise<Diagnosis[]>;
  updateDiagnosis(id: number, updates: Partial<Diagnosis>): Promise<Diagnosis | undefined>;
  
  // Periodontal chart management
  createPeriodontalChart(chart: InsertPeriodontalChart): Promise<PeriodontalChart>;
  getPeriodontalChart(id: number): Promise<PeriodontalChart | undefined>;
  getPatientPeriodontalCharts(patientId: number): Promise<PeriodontalChart[]>;
  updatePeriodontalChart(id: number, updates: Partial<PeriodontalChart>): Promise<PeriodontalChart | undefined>;
  getLatestPeriodontalChart(patientId: number): Promise<PeriodontalChart | undefined>;
  
  // Restorative Chart Entry management
  createRestorativeChartEntry(entry: InsertRestorativeChartEntry): Promise<RestorativeChartEntry>;
  getRestorativeChartEntry(id: number): Promise<RestorativeChartEntry | undefined>;
  getPatientRestorativeChartEntries(patientId: number): Promise<RestorativeChartEntry[]>;
  getPatientRestorativeChartEntriesByTooth(patientId: number, toothNumber: string): Promise<RestorativeChartEntry[]>;
  updateRestorativeChartEntry(id: number, updates: Partial<RestorativeChartEntry>): Promise<RestorativeChartEntry | undefined>;
  
  // Perio Chart Entry management
  createPerioChartEntry(entry: InsertPerioChartEntry): Promise<PerioChartEntry>;
  getPerioChartEntry(id: number): Promise<PerioChartEntry | undefined>;
  getPatientPerioChartEntries(patientId: number): Promise<PerioChartEntry[]>;
  getPatientPerioChartEntriesByTooth(patientId: number, toothNumber: string): Promise<PerioChartEntry[]>;
  updatePerioChartEntry(id: number, updates: Partial<PerioChartEntry>): Promise<PerioChartEntry | undefined>;
  
  // X-ray AI Findings management
  createXrayAiFinding(finding: InsertXrayAiFinding): Promise<XrayAiFinding>;
  getXrayAiFinding(id: number): Promise<XrayAiFinding | undefined>;
  getXrayAiFindings(xrayId: number): Promise<XrayAiFinding[]>;
  updateXrayAiFinding(id: number, updates: Partial<XrayAiFinding>): Promise<XrayAiFinding | undefined>;
  
  // Charting Notes management
  createChartingNote(note: InsertChartingNote): Promise<ChartingNote>;
  getChartingNote(id: number): Promise<ChartingNote | undefined>;
  getPatientChartingNotes(patientId: number): Promise<ChartingNote[]>;
  updateChartingNote(id: number, updates: Partial<ChartingNote>): Promise<ChartingNote | undefined>;
  approveChartingNote(id: number, approvedBy: number): Promise<ChartingNote | undefined>;
}