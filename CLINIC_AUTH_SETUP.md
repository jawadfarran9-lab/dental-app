# DentalFlow App - Clinic Authentication & Setup Guide

## Overview

You now have a fully functional DentalFlow app with:
- **Clinic signup/login** (Firebase Auth with email/password)
- **Clinic dashboard** (authenticated, shows only their patients)
- **Patient creation** with auto-generated numeric codes (1000+)
- **Patient sessions** management with image uploads
- **Secure patient login** by numeric code
- **Real-time chat** between patient and clinic

## Architecture

### Authentication Flow

#### Clinic:
1. Clinic signs up with email/password → `/clinicSignup` Cloud Function creates Auth user + clinic document + sets custom claim `clinicId`
2. Clinic logs in with email/password → `signInWithEmailAndPassword` from Firebase Auth
3. Token automatically includes custom claim `clinicId` (set by Cloud Function)
4. Firestore rules enforce that clinic can only access patients with matching `clinicId`

#### Patient:
1. Patient enters numeric code → `/patientLogin` Cloud Function validates code + mints short-lived custom token with `patientId` claim
2. Patient signs in with custom token → `signInWithCustomToken`
3. Patient can only access `patients/{patientId}` and subcollections

### Files Modified/Created

**Cloud Functions:**
- `functions/index.js` — Added `/clinicSignup` and `/patientLogin` endpoints

**Frontend - Auth Context:**
- `app/context/ClinicContext.tsx` — React Context for authenticated clinic state (`clinicUser`, `clinicId`, `logout`)

**Frontend - Clinic Screens:**
- `app/clinic/login.tsx` — Clinic login form (email + password)
- `app/clinic/signup.tsx` — Clinic signup form (email, password, clinic details)
- `app/clinic/index.tsx` — Patients list (uses authenticated `clinicId` from context)
- `app/clinic/create.tsx` — Create patient form (uses authenticated `clinicId`)
- `app/clinic/[patientId].tsx` — Patient details & sessions (uses authenticated `clinicId`)

**Frontend - Patient Screens:**
- `app/patient/index.tsx` — Patient login by code (calls `/patientLogin`)
- `app/patient/[patientId].tsx` — Patient dashboard (reads authenticated user via `auth.onAuthStateChanged`)

**Root Layout:**
- `app/_layout.tsx` — Wrapped with `ClinicProvider` and added screen configs

**Firestore Rules:**
- `firebase/firestore.rules` — Updated with `clinicId` and `patientId` claim enforcement

## Quick Start (Local Development)

### Prerequisites

1. **Firebase Project**
   - Create a Firebase project at https://console.firebase.google.com
   - Enable Authentication (Email/Password)
   - Enable Firestore Database
   - Enable Cloud Storage
   - Enable Cloud Functions

2. **Configure Firebase Locally**
   - Update `app/firebaseConfig.ts` with your Firebase config (from Firebase console)
   - Update `app/config.ts`:
     ```typescript
     export const FUNCTIONS_BASE = 'http://localhost:5001/<YOUR_PROJECT_ID>/us-central1/api';
     export const CLINIC_ID = '<not_needed_now>'; // Not used anymore
     ```

3. **Install Dependencies**
   ```powershell
   cd 'C:\Users\jawad\AppData\Local\SquadGame\Saved\SaveGames\dental-app'
   npm install firebase
   npx expo install expo-image-picker
   cd functions
   npm install
   ```

### Run Locally with Firebase Emulator (Recommended)

```powershell
# Start Firebase emulator (Auth, Firestore, Functions, Storage)
cd 'C:\Users\jawad\AppData\Local\SquadGame\Saved\SaveGames\dental-app'
firebase emulators:start --only firestore,functions,storage,auth
```

In a **new terminal**:
```powershell
cd 'C:\Users\jawad\AppData\Local\SquadGame\Saved\SaveGames\dental-app'
npx expo start
```

Press `w` to open in web browser or scan the QR code with Expo Go app.

### Test Clinic Signup & Login

1. **From the app home**, navigate to **Clinic Login** (add a navigation button or manually go to `/clinic/login`).
2. Click **"Sign up"** to create a clinic account:
   - Email: `test-clinic@example.com`
   - Password: `password123`
   - Clinic Name: `Test Dental Clinic`
   - Other fields: optional
3. After signup, you're automatically logged in → redirected to clinic dashboard.
4. Click **"+ New Patient"** to create a patient:
   - Name: `John Doe`
   - Phone, email, notes: optional
   - The system generates a numeric code (e.g., 1000)
5. See the patient in the list. Click to view details and add sessions.

### Test Patient Login

1. **From the app home**, navigate to **Patient Login** (manually go to `/patient`).
2. Enter the numeric patient code you just created (e.g., 1000).
3. Click **"Log in"** → calls `/patientLogin` → receives custom token → redirected to patient dashboard.
4. Patient sees their treatment timeline, images, and can send messages.

### Test Logging Out

- **Clinic**: Click **"Log out"** on the patients list → redirected to login screen.
- **Patient**: Click **"Log out"** on the patient dashboard → redirected to login screen.

## Deploy to Firebase (Production)

### 1. Deploy Functions & Rules

```powershell
cd 'C:\Users\jawad\AppData\Local\SquadGame\Saved\SaveGames\dental-app'
firebase deploy --only firestore:rules,storage:rules,functions
```

### 2. Update Frontend Config

After deployment, update `app/config.ts`:
```typescript
export const FUNCTIONS_BASE = 'https://us-central1-<YOUR_PROJECT_ID>.cloudfunctions.net/api';
```

Also update `app/firebaseConfig.ts` with your production Firebase config.

### 3. Deploy to Hosting (Optional)

If you want a web version:
```powershell
firebase deploy --only hosting
```

## Firestore Rules Summary

- **Clinics**: Only clinic users with matching `clinicId` custom claim can read/write their clinic document.
- **Patients**: 
  - Clinic users can create, read, update, delete patients with their `clinicId`.
  - Patients can read only their own document (via `patientId` custom claim).
- **Sessions**: Same as patients (clinic can full CRUD, patient can read-only).
- **Messages**: Both clinic and patient can read/create, clinic can delete.

## Security Notes

- Patient codes are unique per clinic (enforced by counter transaction).
- Custom tokens for patients are short-lived (Firebase default: 1 hour).
- All Firestore operations are protected by security rules based on authenticated custom claims.
- Firebase Auth handles secure password storage and token management.

## Next Steps

1. **Test end-to-end** with the emulator.
2. **Deploy** to your Firebase project.
3. **Implement Stripe subscription** (optional, see Stripe integration notes).
4. **Polish UI** (styling, RTL for Arabic, etc.).
5. **Add push notifications** for new messages (optional).

## Troubleshooting

- **"Clinic ID not configured"**: This message is outdated. You should now see the clinic login screen. Update root app layout if needed.
- **"Cannot create patient"**: Ensure clinic is authenticated. Check that `clinicId` is available in context.
- **"Patient code not found"**: Verify the code exists in Firestore. Patient codes are per-clinic.
- **Emulator not working**: Run `firebase emulators:start` first, then start Expo in a separate terminal.

---

For more details on specific screens or flows, refer to individual file comments or reach out!
