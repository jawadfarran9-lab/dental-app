export type ClinicTypeKey = 'dental' | 'laser' | 'beauty';

export interface ClinicTypeInfo {
  label: string;
  emoji: string;
  textColor: string;
  backgroundColor: string;
}

const CLINIC_TYPE_CONFIG: Record<ClinicTypeKey, ClinicTypeInfo> = {
  dental: {
    label: 'Dental Clinic',
    emoji: '🦷',
    textColor: '#3D9EFF',
    backgroundColor: 'rgba(61,158,255,0.12)',
  },
  laser: {
    label: 'Laser Clinic',
    emoji: '⚡',
    textColor: '#F5A623',
    backgroundColor: 'rgba(245,166,35,0.12)',
  },
  beauty: {
    label: 'Beauty Clinic',
    emoji: '✨',
    textColor: '#A855F7',
    backgroundColor: 'rgba(168,85,247,0.12)',
  },
};

const FALLBACK: ClinicTypeInfo = {
  label: 'Clinic',
  emoji: '🏥',
  textColor: '#828282',
  backgroundColor: 'rgba(130,130,130,0.12)',
};

export function getClinicTypeInfo(key?: string | null): ClinicTypeInfo | null {
  if (!key) return null;
  return CLINIC_TYPE_CONFIG[key as ClinicTypeKey] ?? FALLBACK;
}

/**
 * Home-screen specific copy per clinic type (used by ClinicHomeScreen).
 * Separate from CLINIC_TYPE_CONFIG so existing consumers of `label`/`emoji`
 * stay untouched.
 */
export interface ClinicHomeInfo {
  emoji: string;
  name: string;
  subtitle: string;
  patientsLabel: string;
}

export const CLINIC_HOME_CONFIG: Record<ClinicTypeKey, ClinicHomeInfo> = {
  dental: {
    emoji: '🦷',
    name: 'Dental Clinic',
    subtitle: 'Manage patients, appointments, X-ray analysis and more.',
    patientsLabel: 'Patients',
  },
  beauty: {
    emoji: '💄',
    name: 'Beauty Clinic',
    subtitle: 'Manage clients, beauty treatments, skincare analysis and more.',
    patientsLabel: 'Clients',
  },
  laser: {
    emoji: '✨',
    name: 'Laser Clinic',
    subtitle: 'Manage clients, laser sessions, progress tracking and more.',
    patientsLabel: 'Clients',
  },
};

export function getClinicHomeInfo(key: ClinicTypeKey): ClinicHomeInfo {
  return CLINIC_HOME_CONFIG[key];
}
