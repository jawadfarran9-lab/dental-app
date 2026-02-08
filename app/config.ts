// App Configuration
// Environment-specific settings for the dental app

/**
 * Firebase Functions Base URL
 * - Production: https://us-central1-dental-jawad.cloudfunctions.net
 * - Emulator: http://127.0.0.1:5001/dental-jawad/us-central1
 */
export const FUNCTIONS_BASE =
  __DEV__
    ? 'http://127.0.0.1:5001/dental-jawad/us-central1'
    : 'https://us-central1-dental-jawad.cloudfunctions.net';

/**
 * AI Assistant Endpoint
 * Streaming endpoint for AI chat
 */
export const AI_CHAT_ENDPOINT = `${FUNCTIONS_BASE}/aiChat`;

/**
 * AI Request Timeout (milliseconds)
 * Default: 60 seconds
 */
export const AI_TIMEOUT_MS = 60000;

/**
 * API Endpoints
 */
export const API = {
  clinicSignup: `${FUNCTIONS_BASE}/clinicSignup`,
  createPatient: `${FUNCTIONS_BASE}/createPatient`,
  patientLogin: `${FUNCTIONS_BASE}/patientLogin`,
  createPatientUser: `${FUNCTIONS_BASE}/createPatientUser`,
  aiChat: AI_CHAT_ENDPOINT,
};

export default API;
