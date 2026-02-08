# Network Configuration Guide for Physical Device Testing

## Problem: "Network request failed" Error

This error occurs when your phone cannot reach the Cloud Functions endpoint. Follow the steps below to fix it.

---

## Step 1: Get Your PC's LAN IP Address

### On Windows (PowerShell):
```powershell
ipconfig | findstr "IPv4"
```

Look for a local IP address like: `192.168.1.100` or `192.168.0.50`

### Example Output:
```
IPv4 Address. . . . . . . . . . . : 192.168.1.100
```

---

## Step 2: Choose Your Setup Method

### Option A: Local Testing (Firebase Emulator) - **EASIEST FOR DEVELOPMENT**

**Best for:** Testing on your physical phone during development

**Requirements:**
- PC and phone on same WiFi network
- Firebase Emulator Suite installed

**Steps:**

1. **Get your PC's LAN IP** (see Step 1 above)

2. **Update `app/config.ts`:**
   ```typescript
   export const FUNCTIONS_BASE = 'http://192.168.1.100:5001/your-project-id/us-central1/api';
   ```
   - Replace `192.168.1.100` with YOUR PC's IP
   - Replace `your-project-id` with your Firebase project ID

3. **Start Firebase Emulator:**
   ```bash
   firebase emulators:start
   ```

4. **Note the emulator output:**
   ```
   ✔  emulators started, it will accept connections
   ┌─────────────────────────────────────────────────────────┐
   │ ✔ Authentication Emulator running on http://localhost:9099 │
   │ ✔ Firestore Emulator running on http://localhost:8080    │
   │ ✔ Storage Emulator running on http://localhost:9199      │
   │ ✔ Functions running on http://localhost:5001             │
   └─────────────────────────────────────────────────────────┘
   ```

5. **Open Expo Go on your phone:**
   - Scan the QR code from Expo
   - Or manually enter your PC IP: `exp://192.168.1.100:8081`

6. **Test the app:**
   - Go to Clinic Subscription
   - Create an account - should work without network errors

---

### Option B: Production Deployment - **FOR LIVE USERS**

**Best for:** When app is ready for real users

**Steps:**

1. **Deploy Cloud Functions:**
   ```bash
   firebase deploy --only functions
   ```

2. **Copy the deployed URL from output:**
   ```
   Function URL (api): https://us-central1-your-project-id.cloudfunctions.net/api
   ```

3. **Update `app/config.ts`:**
   ```typescript
   export const FUNCTIONS_BASE = 'https://us-central1-your-project-id.cloudfunctions.net/api';
   ```

4. **Update Firebase config in `firebaseConfig.ts`:**
   - Replace all `YOUR_*` placeholders with real credentials from Firebase Console

5. **Restart Expo:**
   ```bash
   npx expo start --clear
   ```

6. **Test the app:**
   - Works from anywhere (no WiFi requirement)
   - Phone can be on different network than PC

---

## Step 3: Fix Firebase Credentials

Even with correct FUNCTIONS_BASE, you need valid Firebase credentials.

**Get credentials from Firebase Console:**
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Click ⚙️ (Settings) → Project Settings
4. Scroll to "Your apps" → Web app
5. Copy the config values

**Update `firebaseConfig.ts`:**
```typescript
const firebaseConfig = {
  apiKey: "YOUR_ACTUAL_API_KEY",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abcdef123456",
};
```

---

## Step 4: Enable Firestore & Storage

Make sure your Firebase project has these enabled:

1. **Firestore Database:**
   - Firebase Console → Build → Firestore Database
   - Create in test mode (for development)

2. **Cloud Storage:**
   - Firebase Console → Build → Storage
   - Create bucket

3. **Authentication:**
   - Firebase Console → Build → Authentication
   - Enable: Email/Password

---

## Troubleshooting

### "Network request failed" error persists

**Check 1: Can your phone reach your PC?**
```bash
# On phone, open browser and visit:
http://192.168.1.100:5001/your-project-id/us-central1/api
```
You should see a Cloud Function response (or CORS error is fine, means it reached the server).

**Check 2: Same WiFi?**
- Your PC and phone must be on the same WiFi network
- Not mobile data, not different WiFi networks
- Type in Android Settings → Settings → WiFi to verify

**Check 3: Firewall?**
- Windows Firewall might block port 5001
- Temporarily disable it (or add firewall rule for Node.js/firebase)
- Or use Deployed option (Option B) instead

**Check 3: Firebase Emulator running?**
```bash
firebase emulators:start --verbose
```
Should show "Functions running on http://localhost:5001"

### Port 5001 already in use

```bash
# Kill the process using port 5001
# On Windows PowerShell:
Get-Process | Where-Object { $_.ProcessName -eq 'node' } | Stop-Process -Force

# Or use a different port:
firebase emulators:start --only functions,firestore,auth --project=your-project --inspect-functions
```

---

## Quick Reference

| Scenario | FUNCTIONS_BASE | Firebase Emulator? | Phone WiFi | Works Offline |
|----------|---|---|---|---|
| Development (Local) | `http://PC_IP:5001/...` | ✅ Yes | Same as PC | ❌ No |
| Development (Deployed) | `https://us-central1-...` | ❌ No | Any | ✅ Yes |
| Production | `https://us-central1-...` | ❌ No | Any | ✅ Yes |

---

## After Setup

1. **Restart TypeScript Server:**
   - Ctrl+Shift+P → "TypeScript: Restart TS Server"

2. **Clear Expo Cache:**
   ```bash
   npx expo start --clear
   ```

3. **Test End-to-End:**
   - Clinic signup → Create account
   - Patient login → Enter numeric code
   - Both should work without "Network request failed" errors

---

## Still Having Issues?

Check the browser console on your phone (if using Expo web):
- Chrome DevTools → Network tab
- Look for the failing fetch request to `FUNCTIONS_BASE`
- Check the response for actual error message

Or enable verbose logging:
```typescript
// In signup or patient login screen
console.log('Calling:', `${FUNCTIONS_BASE}/clinicSignup`);
console.log('Response:', await res.text()); // Log raw response
```

