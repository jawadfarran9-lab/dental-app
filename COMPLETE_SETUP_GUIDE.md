# DentalFlow - Complete Setup & Deployment Guide

## ✅ What Has Been Fixed

### 1. Firebase Functions Configuration
- **File:** `app/config.ts`
- **Status:** ✅ Simplified to one line configuration
- **Current Value:** `export const FUNCTIONS_BASE = 'http://YOUR_IP:5001/dental-clinic-app/us-central1/api';`

### 2. Cloud Functions Endpoints
- ✅ `/clinicSignup` - Creates new clinic account
- ✅ `/patientLogin` - Authenticates patient with code
- ✅ `/createPatient` - Creates new patient record
- All endpoints configured for Firebase Emulator

### 3. Image Assets
- **Location:** `assets/images/dental-cover.svg`
- **Status:** ✅ Used on landing and signup screens
- **Resolution:** Professional dental image with tooth and instruments

### 4. Patient Login Screen
- ✅ Back to Home button added (← Back to Home)
- ✅ Clean, simple UI for entering patient code
- ✅ Network error detection and helpful messages

### 5. UI Improvements
- ✅ Password visibility toggle on clinic signup form
- ✅ Professional color scheme (#1B3C73, #2E8BFD, #f5f7fb)
- ✅ Consistent button styling across all screens
- ✅ Loading states and error handling

---

## 🚀 Quick Start for Physical Phone Testing

### Step 1: Get Your PC's IP Address

Open PowerShell and run:
```powershell
ipconfig | findstr "IPv4"
```

Look for a local IP like `192.168.1.100` or `192.168.0.50`

### Step 2: Update Configuration

Edit `app/config.ts` and replace `YOUR_IP` with your actual PC IP:

**Before:**
```typescript
export const FUNCTIONS_BASE = 'http://YOUR_IP:5001/dental-clinic-app/us-central1/api';
```

**After (example with IP 192.168.1.100):**
```typescript
export const FUNCTIONS_BASE = 'http://192.168.1.100:5001/dental-clinic-app/us-central1/api';
```

### Step 3: Start Firebase Emulator

In your project terminal:
```powershell
firebase emulators:start
```

You should see:
```
✔  Firestore Emulator started at http://localhost:8080
✔  Functions emulator started at http://localhost:5001
✔  Authentication emulator started at http://localhost:9099
```

### Step 4: Start Expo Dev Server

In another terminal:
```powershell
npx expo start --clear
```

This shows a QR code.

### Step 5: Test on Phone

1. **Make sure your phone is on the SAME WiFi as your PC**
2. **Open Expo Go app** on your phone
3. **Scan the QR code** from the Expo terminal
4. App should load without network errors

---

## 📋 Navigation Flow

```
Index (/index.tsx)
  ↓
Clinic Subscription Landing (/clinic/subscribe.tsx)
  ↓ "Start Subscription"
Clinic Details Form (/clinic/signup.tsx)
  ↓ "Start Subscription - $30/month"
Clinic Dashboard (/clinic/index.tsx)

OR

Patient Login (/patient/index.tsx)
  ↓ Enter patient code
Patient Dashboard (/patient/[patientId].tsx)
```

---

## 🧪 Testing Checklist

### Configuration
- [ ] PC IP address identified (e.g., 192.168.1.100)
- [ ] `app/config.ts` updated with your PC IP
- [ ] Firebase Emulator running: `firebase emulators:start`
- [ ] Expo dev server running: `npx expo start --clear`

### UI/Navigation
- [ ] App loads without errors
- [ ] Clinic Subscription landing page shows dental image
- [ ] "Start Subscription" button navigates to form
- [ ] Clinic signup form shows password toggle (eye icon)
- [ ] Patient Login page has "← Back to Home" button
- [ ] Back button returns to landing page

### API/Network
- [ ] Clinic signup submits form successfully
- [ ] Patient login accepts 4-digit code
- [ ] No "Network request failed" errors
- [ ] Error messages are helpful and descriptive

### TypeScript
- [ ] No TypeScript errors in terminal
- [ ] No module resolution errors
- [ ] All imports resolve correctly

---

## 📁 Modified Files

### Core Configuration
- `app/config.ts` - Firebase Functions endpoint (simplified)
- `firebaseConfig.ts` - Firebase initialization (unchanged, needs real credentials)

### Screens
- `app/index.tsx` - Entry point (unchanged)
- `app/clinic/subscribe.tsx` - Landing page with dental image
- `app/clinic/signup.tsx` - Clinic details form with password toggle
- `app/patient/index.tsx` - Patient login with back button

### Backend
- `functions/index.js` - Cloud Functions (unchanged, already has endpoints)

---

## 🔧 Troubleshooting

### "Network request failed" Error

**Check List:**
1. ✅ Firebase Emulator is running: `firebase emulators:start`
2. ✅ `FUNCTIONS_BASE` in `app/config.ts` uses correct IP (not `YOUR_IP`)
3. ✅ Phone is on SAME WiFi as PC
4. ✅ Windows Firewall allows port 5001

**Test Connection:**
On your phone, open browser and visit:
```
http://192.168.1.100:5001/
```
You should see an Emulator UI or redirect message.

### Port Already in Use

If port 5001 is in use:
```powershell
# Kill Node processes
Get-Process node | Stop-Process -Force

# Or use different port
firebase emulators:start --only functions --project=dental-clinic-app
```

### Firebase Module Errors

Make sure all Firebase modules are installed:
```powershell
npm install firebase
```

---

## 📱 App Features

### For Clinics
1. **Sign Up:** Create clinic account with name, dentist name, email, password
2. **Dashboard:** View all patients, create new patients
3. **Patient Management:** Add sessions, upload photos, send messages

### For Patients
1. **Login:** Enter 4-digit patient code (e.g., 1000)
2. **Dashboard:** View treatment timeline, sessions, photos
3. **Messaging:** Private chat with clinic

---

## 🎨 Design Specifications

### Colors
- Primary: `#1B3C73` (Dark blue)
- Secondary: `#2E8BFD` (Bright blue)
- Background: `#f5f7fb` (Light gray)
- Text: `#333` (Dark gray)
- Disabled: `#999` (Medium gray)

### Typography
- Titles: 28px, Bold (#1B3C73)
- Subtitles: 16px, Regular (#666)
- Body: 14-16px, Regular (#333)
- Buttons: 16px, Bold (#fff on blue)

### Spacing
- Padding: 16-20px
- Margins: 8-24px
- Border Radius: 8px
- Button Height: 14-16px padding vertical

---

## 🔐 Security Notes

### Firebase Rules (To Be Updated)
- `firestore.rules` - Restrict patient data access
- `storage.rules` - Restrict image access
- Authentication - Email/password for clinics, custom tokens for patients

### .env (To Be Created)
For production, create `.env.local`:
```
REACT_APP_API_KEY=<your-api-key>
REACT_APP_PROJECT_ID=<your-project-id>
REACT_APP_FUNCTIONS_BASE=<deployed-url>
```

---

## 📞 Support

For issues, check:
1. `SETUP_FIREBASE.md` - Detailed Firebase setup
2. `NETWORK_SETUP.md` - Network troubleshooting
3. `SUBSCRIPTION_FLOW.md` - Navigation flow details
4. `CLINIC_SUBSCRIPTION_UPDATES.md` - Recent changes

---

## ✨ Next Steps

1. Update `app/config.ts` with your PC IP
2. Start Firebase Emulator: `firebase emulators:start`
3. Start Expo: `npx expo start --clear`
4. Scan QR code on phone
5. Test clinic signup flow
6. Test patient login with code
7. Verify no network errors
8. Deploy to production when ready

Happy testing! 🎉
