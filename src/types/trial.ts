// PHASE AA-2: Trial & Usage Tracking (No Payments)

export interface TrialStatus {
  clinicId: string;
  trialActive: boolean;
  trialStartedAt?: number; // Unix timestamp
  trialEndsAt?: number;    // Unix timestamp (30 days from start by default)
  trialDaysRemaining?: number; // Calculated field
  createdAt?: number;
  updatedAt?: number;
}

export interface UsageStats {
  clinicId: string;
  patientsCount: number;
  sessionsCount: number;
  messagesCount: number;
  lastUpdatedAt?: number;
}

export const TRIAL_DURATION_DAYS = 30; // Trial is 30 days
export const SOFT_LIMIT_PATIENTS = 100; // Warning if > 100
export const SOFT_LIMIT_SESSIONS = 500;
export const SOFT_LIMIT_MESSAGES = 5000;
