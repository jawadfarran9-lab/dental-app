// firebaseConfig.ts - Firebase client initialization (Firestore only)
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Firebase project: dental-jawad (project number: 256500365668)
const firebaseConfig = {
  apiKey: "AIzaSyCyei5KZ_ROWZfBbMClSY02tgVHgtGblag",
  authDomain: "dental-jawad.firebaseapp.com",
  projectId: "dental-jawad",
  storageBucket: "dental-jawad.appspot.com",
  messagingSenderId: "256500365668",
  appId: "1:256500365668:web:9410f076de32a7bc51e271",
};

// Initialize Firebase app (ONLY ONCE)
const app = initializeApp(firebaseConfig);

// Export Firebase services (NO AUTH)
export const db = getFirestore(app);
export const storage = getStorage(app);
export { app };

