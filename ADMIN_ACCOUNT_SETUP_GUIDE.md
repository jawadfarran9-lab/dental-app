# 🔐 Admin Test Account Setup Guide

**Created:** January 2, 2026  
**Purpose:** Create a fully-configured admin account with bypass to all subscription/paywall restrictions

---

## 📋 Account Credentials

```
Email:    jawadfarran9@gmail.com
Password: jawadfarran9
```

**Access Level:**
- ✅ OWNER_ADMIN role (full permissions)
- ✅ Subscription ACTIVE (bypasses paywall)
- ✅ AI Pro ENABLED
- ✅ PRO tier (all features unlocked)
- ✅ Published clinic in public directory

---

## 🚀 Setup Methods

You have **3 options** to create this account:

### **Option 1: Firebase Console (Manual - Easiest)**
**Best for:** Quick setup without coding

1. **Create Firebase Auth User**
   - Go to [Firebase Console](https://console.firebase.google.com)
   - Select project: `dental-jawad`
   - Navigate to: **Authentication** → **Users** tab
   - Click **Add User**
   - Email: `jawadfarran9@gmail.com`
   - Password: `jawadfarran9`
   - Click **Add User**
   - Copy the **User UID** (you'll need this)

2. **Create Firestore Documents**
   
   Navigate to: **Firestore Database** → **Data** tab

   **A. Create Clinic Document:**
   - Collection: `clinics`
   - Document ID: `clinic_[USER_UID]_admin` (replace `[USER_UID]` with copied UID)
   - Fields to add:
   ```json
   {
     "clinicId": "clinic_[USER_UID]_admin",
     "ownerId": "[USER_UID]",
     "clinicName": "Admin Test Clinic",
     "clinicCode": "ADMIN001",
     "subscribed": true,
     "subscriptionPlan": "PRO_AI",
     "subscriptionStatus": "active",
     "aiProEnabled": true,
     "tier": "pro",
     "phone": "+971501234567",
     "email": "jawadfarran9@gmail.com",
     "address": "Admin Test Location",
     "country": "AE",
     "city": "Dubai",
     "heroImageUrl": "https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=1200",
     "logoUrl": "https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=400",
     "createdAt": [server timestamp],
     "updatedAt": [server timestamp]
   }
   ```

   **B. Create Clinic Member Document:**
   - Collection: `clinic_members`
   - Document ID: `member_[USER_UID]_clinic_[USER_UID]_admin`
   - Fields to add:
   ```json
   {
     "memberId": "member_[USER_UID]_clinic_[USER_UID]_admin",
     "clinicId": "clinic_[USER_UID]_admin",
     "userId": "[USER_UID]",
     "email": "jawadfarran9@gmail.com",
     "displayName": "Admin Test Account",
     "role": "OWNER_ADMIN",
     "status": "ACTIVE",
     "createdAt": [server timestamp],
     "lastLogin": [server timestamp]
   }
   ```

   **C. Create Public Clinic Document:**
   - Collection: `clinics_public`
   - Document ID: `clinic_[USER_UID]_admin` (same as clinic ID)
   - Fields to add:
   ```json
   {
     "clinicId": "clinic_[USER_UID]_admin",
     "ownerId": "[USER_UID]",
     "name": "Admin Test Clinic",
     "isPublished": true,
     "tier": "pro",
     "phone": "+971501234567",
     "whatsapp": "+971501234567",
     "email": "jawadfarran9@gmail.com",
     "address": "Admin Test Location, Dubai, UAE",
     "geo": {
       "lat": 25.2048,
       "lng": 55.2708
     },
     "geohash": "thrwmzx",
     "heroImage": "https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=1200",
     "averageRating": 5.0,
     "totalReviews": 100,
     "specialty": "general",
     "createdAt": [server timestamp],
     "updatedAt": [server timestamp]
   }
   ```

   **D. Create User Profile Document:**
   - Collection: `users`
   - Document ID: `[USER_UID]`
   - Fields to add:
   ```json
   {
     "userId": "[USER_UID]",
     "email": "jawadfarran9@gmail.com",
     "displayName": "Admin Test Account",
     "role": "clinic",
     "clinicId": "clinic_[USER_UID]_admin",
     "memberId": "member_[USER_UID]_clinic_[USER_UID]_admin",
     "createdAt": [server timestamp],
     "lastLogin": [server timestamp]
   }
   ```

3. **Done!** The account is ready to use.

---

### **Option 2: Node.js Script (Automated - Recommended)**
**Best for:** Complete automation with one command

**Prerequisites:**
1. Install Firebase Admin SDK:
   ```bash
   npm install firebase-admin --save-dev
   ```

2. Download Service Account Key:
   - Go to [Firebase Console](https://console.firebase.google.com)
   - Project Settings → Service Accounts
   - Click **Generate New Private Key**
   - Save as: `scripts/firebase-admin-key.json`
   - ⚠️ **NEVER commit this file to git!**

3. Add to `.gitignore`:
   ```
   scripts/firebase-admin-key.json
   ```

**Run the Script:**
```bash
node scripts/createAdminTestAccount.js
```

**What it does:**
- ✅ Creates Firebase Auth user
- ✅ Creates all Firestore documents automatically
- ✅ Sets subscription to ACTIVE
- ✅ Configures OWNER_ADMIN role
- ✅ Publishes clinic to public directory
- ✅ Enables AI Pro access
- ✅ Prints success summary

**Output:**
```
═══════════════════════════════════════════════════
✅ ADMIN TEST ACCOUNT CREATED SUCCESSFULLY!
═══════════════════════════════════════════════════

📋 Account Details:
   Email:       jawadfarran9@gmail.com
   Password:    jawadfarran9
   User ID:     abc123xyz...
   Clinic ID:   clinic_abc123_admin
   Member ID:   member_abc123_clinic_abc123_admin

🔐 Access Level:
   Role:        OWNER_ADMIN (Full Access)
   Subscription: ACTIVE (Paywall Bypassed ✅)
   AI Pro:      ENABLED ✅
   Tier:        PRO ✅

📱 Ready to use:
   1. Open the app
   2. Tap "Clinic Login"
   3. Enter credentials above
   4. Access all screens without restrictions
```

---

### **Option 3: Firebase CLI + Firestore Import (Advanced)**
**Best for:** Bulk data import or CI/CD pipelines

1. Install Firebase CLI:
   ```bash
   npm install -g firebase-tools
   ```

2. Login:
   ```bash
   firebase login
   ```

3. Create Auth user via REST API:
   ```bash
   # Get ID token first
   firebase login:ci
   
   # Use Firebase Admin REST API to create user
   # (Complex - Option 1 or 2 recommended instead)
   ```

4. Import Firestore data:
   ```bash
   firebase firestore:import admin-account-data.json
   ```

---

## 🔍 Verification Steps

After creating the account, verify it works:

### 1. **Check Firebase Console**
- Authentication → Users → Should see `jawadfarran9@gmail.com`
- Firestore → Collections:
  - `clinics/clinic_[UID]_admin` → `subscribed: true` ✅
  - `clinic_members/member_[UID]_...` → `role: OWNER_ADMIN` ✅
  - `clinics_public/clinic_[UID]_admin` → `isPublished: true` ✅
  - `users/[UID]` → `role: clinic` ✅

### 2. **Test Login in App**
1. Open app
2. Tap **"Clinic Login"**
3. Enter:
   - Email: `jawadfarran9@gmail.com`
   - Password: `jawadfarran9`
4. Tap **Login**

**Expected Result:**
- ✅ Login successful
- ✅ Redirects to main clinic dashboard (NOT subscription screen)
- ✅ Bottom tabs visible: Home, AI Assistant, Clinics, Create, Subscription
- ✅ No paywall prompts
- ✅ All screens accessible

### 3. **Test Navigation**
Navigate to each screen and verify access:

| Screen | Path | Expected |
|--------|------|----------|
| **Home/Patients** | `/clinic` | ✅ Shows patient list |
| **AI Assistant** | `/ai` | ✅ AI chat works, no "Upgrade" prompt |
| **Clinics** | `/clinics` | ✅ Shows public clinics |
| **Create** | `/create` | ✅ Create patient/session works |
| **Subscription** | `/subscription` | ✅ Shows "Active PRO_AI" status |
| **Settings** | `/clinic/settings` | ✅ Full settings access |
| **Team** | `/clinic/team` | ✅ Team management access |
| **Reports** | (if exists) | ✅ Financial reports access |

### 4. **Test Subscription Bypass**
- Navigate to: `/clinic/subscribe`
- **Expected:** Should see "Already Subscribed" or redirect to main app
- **NOT Expected:** Payment form, "Subscribe Now" buttons

---

## 🧪 Testing Scenarios

Use this account to test:

### ✅ **Authentication Flow**
- Login/logout
- Session persistence
- Role verification

### ✅ **Subscription Features**
- AI Assistant (with AI Pro)
- Advanced analytics
- Team management
- All premium features unlocked

### ✅ **Navigation**
- All tabs accessible
- No paywall redirects
- Settings screens work
- Deep linking

### ✅ **CRUD Operations**
- Create patients
- Create sessions
- Upload images
- Send messages
- Manage team members

### ✅ **Public Features**
- Clinic appears in public directory
- Clinic detail page shows correct info
- Ratings/reviews work

---

## 🔐 Security Notes

⚠️ **IMPORTANT:**

1. **Service Account Key:**
   - NEVER commit `firebase-admin-key.json` to git
   - Store securely (use environment variables in production)
   - Rotate key if accidentally exposed

2. **Test Account Password:**
   - Change `jawadfarran9` to a stronger password in production
   - Use Firebase Console → Authentication → Users → Edit User

3. **Firestore Security Rules:**
   - Ensure your security rules allow admin account to read/write
   - Test with Firebase Emulator first if unsure

4. **Production vs Development:**
   - Use this account ONLY in development
   - Delete or disable before production deployment
   - Create separate admin accounts for each environment

---

## 🛠️ Troubleshooting

### **Problem: "Email already in use"**
**Solution:**
- User already exists
- Option 1: Use different email
- Option 2: Delete existing user in Firebase Console → Authentication
- Option 3: Update password for existing user

### **Problem: "Cannot login - redirects to subscription"**
**Solution:**
- Check Firestore: `clinics/[clinicId]` → `subscribed` field must be `true` (boolean, not string)
- Check: `subscriptionStatus` = `"active"`
- Verify clinic ID matches in all collections

### **Problem: "User not found" error**
**Solution:**
- Firebase Auth user not created
- Go to Firebase Console → Authentication → Add user manually
- Copy User UID and use in Firestore documents

### **Problem: "Access denied" on certain screens**
**Solution:**
- Check: `clinic_members/[memberId]` → `role` = `"OWNER_ADMIN"`
- Check: `status` = `"ACTIVE"`
- Verify member document exists

### **Problem: "Clinic not found"**
**Solution:**
- Ensure clinic document ID matches the ID stored in:
  - `users/[userId]` → `clinicId`
  - `clinic_members/[memberId]` → `clinicId`
- Use consistent ID format: `clinic_[userId]_admin`

### **Problem: Script fails with "Permission denied"**
**Solution:**
- Service account key missing or invalid
- Download new key from Firebase Console
- Save as `scripts/firebase-admin-key.json`
- Ensure correct file path in script

---

## 📝 Next Steps After Setup

Once the account is created and verified:

1. **Test Core Flows:**
   - Create a test patient
   - Create a test session
   - Upload test images
   - Test AI Assistant
   - Test team invites

2. **Verify Data Persistence:**
   - Logout and login again
   - Check if data persists
   - Test AsyncStorage session management

3. **Test Edge Cases:**
   - Network offline mode
   - Multiple logins
   - Session expiry
   - Concurrent edits

4. **Performance Testing:**
   - Large patient lists (100+)
   - Image upload speed
   - Search functionality
   - Filter performance

5. **UI/UX Review:**
   - Navigation flow
   - Loading states
   - Error handling
   - RTL language support

---

## ✅ Checklist

Before considering setup complete, verify:

- [ ] Firebase Auth user created
- [ ] Firestore `clinics` document created with `subscribed: true`
- [ ] Firestore `clinic_members` document created with `role: OWNER_ADMIN`
- [ ] Firestore `clinics_public` document created with `isPublished: true`
- [ ] Firestore `users` document created
- [ ] Login works in app
- [ ] No paywall/subscription redirects
- [ ] All tabs accessible
- [ ] AI Assistant works without upgrade prompts
- [ ] Settings and team management accessible
- [ ] Clinic appears in public directory
- [ ] Service account key secured (not in git)

---

## 📚 Related Documentation

- [Authentication Flow](./CLINIC_AUTH_FLOW_SUMMARY.md)
- [Subscription System](./SUBSCRIPTION_PRICING_UPDATE_COMPLETE.md)
- [Clinics Tab](./CLINICS_TAB_DOCUMENTATION.md)
- [Firebase Setup](./COMPLETE_SETUP_GUIDE.md)

---

## 🎉 Success!

Once all checkboxes are complete, you have a fully functional admin test account ready for development and testing!

**Email:** `jawadfarran9@gmail.com`  
**Password:** `jawadfarran9`

**Access Level:** OWNER_ADMIN with PRO_AI subscription ✅

---

**Questions or Issues?** Check the Troubleshooting section or review the related documentation.
