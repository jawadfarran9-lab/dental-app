import { Platform } from 'react-native';

export type CreatePatientUserParams = {
  clinicId: string;
  patientId: string;
  email: string;
  tempPassword?: string;
};

export async function createPatientUser(params: CreatePatientUserParams): Promise<{ uid: string }> {
  const baseUrl = getFunctionsBaseUrl();
  const res = await fetch(`${baseUrl}/createPatientUser`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const err = await safeJson(res);
    throw new Error(err?.error || `request_failed_${res.status}`);
  }
  return res.json();
}

function getFunctionsBaseUrl(): string {
  // In production, this should be your deployed functions URL
  // For local emulator, use http://localhost:5001/<project>/us-central1/api
  // Fallback reads from app.json or env if available
  // Keeping simple: expect same host path when served via hosting
  // You can adjust as needed for your setup.
  if (Platform.OS === 'web') {
    return '/api';
  }
  // Native: hardcode your region URL or use a config
  return 'https://us-central1-<your-project-id>.cloudfunctions.net/api';
}

async function safeJson(res: Response): Promise<any | null> {
  try { return await res.json(); } catch { return null; }
}
