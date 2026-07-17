// firebaseConfig.ts - Firebase client initialization
import { initializeApp } from "firebase/app";
import { connectAuthEmulator, getAuth } from "firebase/auth";
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
export const auth = getAuth(app);
export const functions = getFunctions(app);

const useEmulator =
  __DEV__ && process.env.EXPO_PUBLIC_USE_EMULATOR === 'true';

if (useEmulator) {
  const host = process.env.EXPO_PUBLIC_EMULATOR_HOST || '127.0.0.1';
  connectAuthEmulator(auth, `http://${host}:9099`, { disableWarnings: true });
  connectFirestoreEmulator(db, host, 8080);
  connectStorageEmulator(storage, host, 9199);
  connectFunctionsEmulator(functions, host, 5001);
  console.warn(`[firebase] EMULATOR MODE — host=${host}`);
} else {
  console.log('[firebase] production mode — project=dental-jawad');
}

export { app };
