import { db } from '../db';
import { patients } from '@shared/schema';

export async function getPatientById(id: string) {
  try {
    const patient = await db.query.patients.findFirst({
      where: (patients, { eq }) => eq(patients.id, id)
    });
    return patient;
  } catch (error) {
    console.error('Error fetching patient:', error);
    throw error;
  }
} 