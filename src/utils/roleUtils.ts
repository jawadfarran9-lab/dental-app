import AsyncStorage from '@react-native-async-storage/async-storage';

export type UserRole = 'clinicOwner' | 'patient';

const ROLE_KEY = 'userRole';

/**
 * Get the stored user role from AsyncStorage
 * Returns null if no role is stored
 */
export async function getRole(): Promise<UserRole | null> {
  try {
    const role = await AsyncStorage.getItem(ROLE_KEY);
    return (role as UserRole) || null;
  } catch (err) {
    // Error logging disabled for production
    return null;
  }
}

/**
 * Set the user role in AsyncStorage
 */
export async function setRole(role: UserRole): Promise<void> {
  try {
    await AsyncStorage.setItem(ROLE_KEY, role);
  } catch (err) {
    // Error logging disabled for production
    throw err;
  }
}

/**
 * Clear the stored user role
 */
export async function clearRole(): Promise<void> {
  try {
    await AsyncStorage.removeItem(ROLE_KEY);
    console.log('[roleUtils] Role cleared');
  } catch (err) {
    // Error logging disabled for production
  }
}

/**
 * Check if the user is a clinic owner
 */
export async function isClinicOwner(): Promise<boolean> {
  const role = await getRole();
  return role === 'clinicOwner';
}

/**
 * Check if the user is a patient
 */
export async function isPatient(): Promise<boolean> {
  const role = await getRole();
  return role === 'patient';
}

/**
 * Check if clinic setup is complete
 */
const SETUP_COMPLETE_KEY = 'clinicSetupComplete';

export async function isSetupComplete(): Promise<boolean> {
  try {
    const setupComplete = await AsyncStorage.getItem(SETUP_COMPLETE_KEY);
    return setupComplete === 'true';
  } catch (err) {
    console.error('[roleUtils] Error checking setup status:', err);
    return false;
  }
}

export async function markSetupComplete(): Promise<void> {
  try {
    await AsyncStorage.setItem(SETUP_COMPLETE_KEY, 'true');
    console.log('[roleUtils] Setup marked as complete');
  } catch (err) {
    console.error('[roleUtils] Error marking setup complete:', err);
    throw err;
  }
}
