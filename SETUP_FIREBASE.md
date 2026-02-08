# Firebase Setup Guide

## Current Issue
You're getting **"Network request failed"** because:
1. Firebase Functions endpoint (`FUNCTIONS_BASE`) is not configured correctly
2. Firebase credentials in `firebaseConfig.ts` are placeholders
3. Cloud Functions may not be deployed yet

## Prerequisites

### 1. Install Firebase CLI
```powershell
npm install -g firebase-tools
```

### 2. Login to Firebase
```powershell
firebase login
```

### 3. Get Your Firebase Project Details

Go to [Firebase Console](https://console.firebase.google.com):
- Click your project (or create new project)
- Go to **Project Settings** (gear icon)
- Copy these values:
  - **Project ID** (e.g., `dental-clinic-12345`)
  - **Web API Key**
  - **App ID**
  - **Messaging Sender ID**

---

## Step 1: Configure Firebase Credentials

### Update `firebaseConfig.ts`

Replace the placeholder values with your actual Firebase config:

```typescript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXX", // From Firebase Console
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID", // e.g., dental-clinic-12345
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:xxxxxxxxxxxxx",
};
```

---

## Step 2: Initialize Firebase in Project

```powershell
cd "c:\Users\jawad\AppData\Local\SquadGame\Saved\SaveGames\dental-app"
firebase init
```

When prompted:
- Select: **Functions**, **Firestore**, **Storage**
- Choose: **Use an existing project**
- Select your project from the list
- Accept defaults for other prompts

---

## Step 3: Deploy Cloud Functions

```powershell
cd functions
npm install
cd ..
firebase deploy --only functions
```

After deployment, you'll see output like:
```
✔  Deploy complete!

Function URL (api): https://us-central1-YOUR_PROJECT_ID.cloudfunctions.net/api
```

**Copy this URL!**

---

## Step 4: Configure FUNCTIONS_BASE

### Option A: Use Deployed Functions (Recommended)

Open `app/config.ts` and set:

```typescript
export const FUNCTIONS_BASE = 'https://us-central1-YOUR_PROJECT_ID.cloudfunctions.net/api';
```

Replace `YOUR_PROJECT_ID` with your actual project ID.

### Option B: Use Local Emulator (For Development)

1. Get your PC's IP address:
```powershell
ipconfig | findstr "IPv4"
```
Output example: `192.168.1.150`

2. Start emulator:
```powershell
firebase emulators:start
```

3. Set `FUNCTIONS_BASE` in `app/config.ts`:
```typescript
export const FUNCTIONS_BASE = 'http://192.168.1.150:5001/YOUR_PROJECT_ID/us-central1/api';
```

4. **Important**: Phone and PC must be on **same WiFi network**

---

## Step 5: Test the Setup

### Test 1: Check if Functions are Reachable

Open phone browser and visit:
```
https://us-central1-YOUR_PROJECT_ID.cloudfunctions.net/api
```

You should see a response (even if it's an error, it means server is reachable).

### Test 2: Try Clinic Signup

1. Open DentalFlow app
2. Go to "Clinic Subscription"
3. Fill in clinic details
4. Press "Start Subscription"
5. Should redirect to clinic dashboard (no "Network request failed")

---

## Troubleshooting

### "Network request failed" Error

**Check 1: FUNCTIONS_BASE is correct**
- Open `app/config.ts`
- Verify it's not using placeholder values
- Should NOT contain `localhost` (won't work on phone)
- Should NOT have `<YOUR_PROJECT_ID>` - must be real ID

**Check 2: Firebase credentials are set**
- Open `firebaseConfig.ts`
- Verify no `YOUR_API_KEY` placeholders remain
- All values should be from Firebase Console

**Check 3: Functions are deployed**
```powershell
firebase functions:list
```
Should show: `api(us-central1)` with status `DEPLOYED`

**Check 4: CORS is enabled**
- Open `functions/index.js`
- Verify: `app.use(cors({ origin: true }));` is present

**Check 5: Test endpoint manually**
```powershell
curl https://us-central1-YOUR_PROJECT_ID.cloudfunctions.net/api
```

### "Firebase: Error (auth/invalid-api-key)"

Your `apiKey` in `firebaseConfig.ts` is wrong. Get correct key from Firebase Console.

### Functions not deploying

```powershell
cd functions
npm install
cd ..
firebase deploy --only functions --debug
```

### Emulator not accessible from phone

1. Check Windows Firewall:
   - Allow Node.js through firewall
   - Or temporarily disable firewall for testing

2. Verify phone is on same WiFi as PC

3. Test from PC browser first:
   - Visit: `http://localhost:5001/YOUR_PROJECT_ID/us-central1/api`
   - Should see response

---

## Quick Commands Reference

```powershell
# Check Firebase CLI version
firebase --version

# List projects
firebase projects:list

# Check current project
firebase use

# Deploy functions only
firebase deploy --only functions

# Start emulator
firebase emulators:start

# View function logs
firebase functions:log

# Get PC IP address
ipconfig | findstr "IPv4"
```

---

## Next Steps After Setup

1. ✅ Firebase credentials configured in `firebaseConfig.ts`
2. ✅ Cloud Functions deployed
3. ✅ `FUNCTIONS_BASE` set to deployed URL
4. ✅ Test clinic signup successfully
5. ✅ Create first test patient
6. ✅ Test patient login with code

---

## Need Help?

- Firebase Documentation: https://firebase.google.com/docs/functions
- Functions Setup: https://firebase.google.com/docs/functions/get-started
- Expo + Firebase: https://docs.expo.dev/guides/using-firebase/
