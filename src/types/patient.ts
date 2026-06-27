import type { Timestamp } from 'firebase/firestore';

export type PatientGender = 'male' | 'female' | 'other';

export interface Patient {
  id: string;                       // Firestore doc id (added at read time)
  clinicId: string;                 // redundant with parent path, kept for convenience
  code: string;                     // login key — "1300XXXX" (string, numeric chars)
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  occupation: string | null;
  notes: string | null;
  dateOfBirth: string | null;       // "YYYY-MM-DD"
  gender: PatientGender;
  hasRegularMedication: boolean;
  regularMedicationDetails: string | null;
  hasAllergy: boolean;
  allergyDetails: string | null;
  emergencyContactName: string | null;
  emergencyContactRelationship: string | null;
  emergencyContactPhone: string | null;
  imageUrl?: string;                // optional, not written today
  createdAt: Timestamp;
}

export type PatientCreateInput = Omit<Patient, 'id' | 'createdAt'>;
