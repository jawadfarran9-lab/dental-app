# DentalFlow — Local Testing Guide

This README provides exact copy/paste commands and the minimal happy-path to test the clinic + patient flows locally using the Firebase Emulator and Expo.

> Platform: Windows PowerShell (tested commands below)

---

## 1) Files to configure before running

- `app/firebaseConfig.ts` — replace placeholders with your Firebase client config (from Firebase Console -> Project settings):
  - `apiKey`, `authDomain`, `projectId`, `storageBucket`, `messagingSenderId`, `appId`
- `app/config.ts` — set the functions base URL used by the frontend:
  - For emulator: `http://localhost:5001/<PROJECT_ID>/us-central1/api`
  - For deployed functions: `https://us-central1-<PROJECT_ID>.cloudfunctions.net/api`
- `.env` (optional) — copy `.env.example` and fill values when you deploy or want to run functions with real Stripe keys or service account secrets.

Note: `CLINIC_ID` is no longer required — clinic identity is provided by Firebase Auth after signup/login.

---

## 2) Install dependencies (copy/paste)

Open PowerShell in the project root and run:

```powershell
cd 'C:\Users\jawad\AppData\Local\SquadGame\Saved\SaveGames\dental-app'
npm install
npx expo install expo-image-picker
cd functions
npm install
cd ..
```

If you don't have the Firebase CLI:

```powershell
npm install -g firebase-tools
firebase login
```

---

## 3) Start local services (emulator + Expo)

1) Start the Firebase Emulator suite (Auth, Firestore, Functions, Storage):

```powershell
# from project root
firebase emulators:start --only firestore,functions,storage,auth
```

Keep that terminal open. The emulator will host functions at a URL like:
`http://localhost:5001/<YOUR_PROJECT_ID>/us-central1/api`

2) Update `app/config.ts` to point `FUNCTIONS_BASE` to the emulator URL above.

3) Start the Expo app (in a separate terminal):

```powershell
cd 'C:\Users\jawad\AppData\Local\SquadGame\Saved\SaveGames\dental-app'
# If PowerShell blocks npx, run with bypass
powershell -NoProfile -ExecutionPolicy Bypass -Command "npx expo start"
```

Press `w` to open in the browser or scan the QR code to open on Expo Go.

---

## 4) Minimal happy-path test (end-to-end)

Follow these steps in the app UI or by navigating to routes:

1. Clinic signup
   - Open `/clinic/login` and click **Sign up**.
   - Example values:
     - Email: `test-clinic@example.com`
     - Password: `password123`
     - Clinic name: `Test Dental Clinic`
   - Expected: `/clinicSignup` function runs, creates Auth user and `clinics/{clinicId}` doc, and sets the `clinicId` custom claim.

2. Clinic login
   - Sign in with the same email/password.
   - Expected: redirected to `/clinic` (patients list). Your authenticated clinic email appears in the header.

3. Create a patient
   - Click **+ New Patient** → fill `name`, (optional) phone/email/notes → Create.
   - Expected: frontend calls `${FUNCTIONS_BASE}/createPatient` and you receive an alert with the generated numeric code (1000+). A `patients/{patientId}` doc is created with field `code`.

4. Add a session and upload an image
   - Open the newly created patient (`/clinic/{patientId}`), create a session (type + description).
   - Use **Add Image** to choose a picture — it uploads to Storage under `clinics/{clinicId}/patients/{patientId}/sessions/{sessionId}/...` and stores the download URL in the session doc.

5. Patient login by code (secure)
   - Open `/patient` (patient login), enter the numeric code you were given, and press **Log in**.
   - Expected: frontend calls `${FUNCTIONS_BASE}/patientLogin`, receives a custom token, signs in with `signInWithCustomToken`, and is redirected to `/patient/{patientId}`.

6. Patient view
   - Patient sees treatment timeline (sessions + uploaded images) and a chat UI. Messages are saved to `patients/{patientId}/messages`.

7. Logout
   - Use **Log out** in clinic or patient views to return to the login screen.

---

## 5) Files & routes quick reference

- Cloud Functions endpoints (HTTP):
  - `POST /clinicSignup` — create clinic auth user and clinic doc
  - `POST /createPatient` — generate numeric code and create patient doc
  - `POST /patientLogin` — validate code and mint custom token

- App routes (expo-router):
  - `/clinic/signup` — Clinic signup screen
  - `/clinic/login`  — Clinic login screen
  - `/clinic`        — Clinic patients list (authenticated)
  - `/clinic/create` — Create patient
  - `/clinic/{patientId}` — Clinic view: patient details & sessions
  - `/patient`       — Patient login by code
  - `/patient/{patientId}` — Patient dashboard after secure login

---

## 6) Helpful troubleshooting

- If `createPatient` returns an error, ensure `FUNCTIONS_BASE` is set to the correct emulator or deployed URL and the emulator is running.
- If images fail to upload, check Storage emulator logs and your `app/firebaseConfig.ts` storage bucket value.
- If patient login fails, check functions logs to see whether the code lookup returned a patient and whether the custom token was created.

---

If you'd like, I can now run a short live walkthrough (start the emulator + expo here) and create a test clinic + patient for you to inspect. Otherwise, follow this README locally and tell me any issues you hit — I’ll help debug step-by-step.

Thanks — excited to see your app working locally! 💚
# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
