// firebaseConfig.ts - Firebase client initialization
import Constants from 'expo-constants';
import { initializeApp } from "firebase/app";
import { connectAuthEmulator, getAuth, initializeAuth, getReactNativePersistence } from "firebase/auth";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { connectFirestoreEmulator, getFirestore } from "firebase/firestore";
import { connectFunctionsEmulator, getFunctions } from "firebase/functions";
import { connectStorageEmulator, getStorage } from "firebase/storage";

// Firebase project: dental-jawad (project number: 256500365668)
const firebaseConfig = {
  apiKey: "AIzaSyCyei5KZ_ROWZfBbMClSY02tgVHgtGblag",
  authDomain: "dental-jawad.firebaseapp.com",
  projectId: "dental-jawad",
  storageBucket: "dental-jawad.firebasestorage.app",
  messagingSenderId: "256500365668",
  appId: "1:256500365668:web:9410f076de32a7bc51e271",
};

// Initialize Firebase app (ONLY ONCE)
const app = initializeApp(firebaseConfig);

// Export Firebase services
export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = (() => {
  try {
    return initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });
  } catch {
    // Fast-refresh / already-initialized: reuse the existing instance
    return getAuth(app);
  }
})();
export const functions = getFunctions(app);

const useEmulator =
  __DEV__ && process.env.EXPO_PUBLIC_USE_EMULATOR === 'true';

function resolveEmulatorHost(): { host: string; source: string } {
  const c: any = Constants;
  const hostUri =
    c?.expoConfig?.hostUri ||
    c?.manifest2?.extra?.expoClient?.hostUri ||
    c?.manifest?.debuggerHost;
  const detected =
    typeof hostUri === 'string' ? hostUri.split(':')[0] : undefined;
  if (detected) return { host: detected, source: 'expo' };
  if (process.env.EXPO_PUBLIC_EMULATOR_HOST)
    return { host: process.env.EXPO_PUBLIC_EMULATOR_HOST, source: 'env' };
  return { host: '127.0.0.1', source: 'default' };
}

if (useEmulator) {
  const { host, source } = resolveEmulatorHost();
  connectAuthEmulator(auth, `http://${host}:9099`, { disableWarnings: true });
  connectFirestoreEmulator(db, host, 8080);
  connectStorageEmulator(storage, host, 9199);
  connectFunctionsEmulator(functions, host, 5001);
  console.warn(`[firebase] EMULATOR MODE — host=${host} (source=${source})`);
} else {
  console.log('[firebase] production mode — project=dental-jawad');
}

export { app };

