# 🚀 ADMIN ACCOUNT - QUICK SETUP REFERENCE

## 📋 CREDENTIALS
```
Email:    jawadfarran9@gmail.com
Password: jawadfarran9
```

---

## ⚡ FASTEST METHOD (5 minutes)

### Step 1: Create Firebase Auth User
1. Open: https://console.firebase.google.com/project/dental-jawad/authentication/users
2. Click **"Add User"**
3. Email: `jawadfarran9@gmail.com`
4. Password: `jawadfarran9`
5. Click **"Add User"**
6. **COPY THE USER UID** (e.g., `abc123xyz...`)

---

### Step 2: Create Firestore Documents

**Replace `[USER_UID]` with the UID you copied above**

Open Firestore: https://console.firebase.google.com/project/dental-jawad/firestore

---

#### 🏥 Document 1: CLINIC

**Collection:** `clinics`  
**Document ID:** `clinic_[USER_UID]_admin`

**Fields to add:**

| Field | Type | Value |
|-------|------|-------|
| `clinicId` | string | `clinic_[USER_UID]_admin` |
| `ownerId` | string | `[USER_UID]` |
| `clinicName` | string | `Admin Test Clinic` |
| `clinicCode` | string | `ADMIN001` |
| ✅ `subscribed` | **boolean** | `true` |
| `subscriptionPlan` | string | `PRO_AI` |
| `subscriptionStatus` | string | `active` |
| ✅ `aiProEnabled` | **boolean** | `true` |
| `tier` | string | `pro` |
| `phone` | string | `+971501234567` |
| `email` | string | `jawadfarran9@gmail.com` |
| `address` | string | `Admin Test Location` |
| `country` | string | `AE` |
| `city` | string | `Dubai` |
| `heroImageUrl` | string | `https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=1200` |
| `logoUrl` | string | `https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=400` |

---

#### 👤 Document 2: CLINIC MEMBER

**Collection:** `clinic_members`  
**Document ID:** `member_[USER_UID]_clinic_[USER_UID]_admin`

**Fields to add:**

| Field | Type | Value |
|-------|------|-------|
| `memberId` | string | `member_[USER_UID]_clinic_[USER_UID]_admin` |
| `clinicId` | string | `clinic_[USER_UID]_admin` |
| `userId` | string | `[USER_UID]` |
| `email` | string | `jawadfarran9@gmail.com` |
| `displayName` | string | `Admin Test Account` |
| `role` | string | `OWNER_ADMIN` |
| `status` | string | `ACTIVE` |

---

#### 🌍 Document 3: PUBLIC CLINIC

**Collection:** `clinics_public`  
**Document ID:** `clinic_[USER_UID]_admin`

**Fields to add:**

| Field | Type | Value |
|-------|------|-------|
| `clinicId` | string | `clinic_[USER_UID]_admin` |
| `ownerId` | string | `[USER_UID]` |
| `name` | string | `Admin Test Clinic` |
| ✅ `isPublished` | **boolean** | `true` |
| `tier` | string | `pro` |
| `phone` | string | `+971501234567` |
| `whatsapp` | string | `+971501234567` |
| `email` | string | `jawadfarran9@gmail.com` |
| `address` | string | `Admin Test Location, Dubai, UAE` |
| `geo` | **map** | See below ⬇️ |
| `geohash` | string | `thrwmzx` |
| `heroImage` | string | `https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=1200` |
| `averageRating` | **number** | `5.0` |
| `totalReviews` | **number** | `100` |
| `specialty` | string | `general` |

**For `geo` field (type: map):**
- Click "Add field" → Field name: `geo` → Type: **map**
- Inside the map, add:
  - `lat` (number): `25.2048`
  - `lng` (number): `55.2708`

---

#### 📝 Document 4: USER PROFILE

**Collection:** `users`  
**Document ID:** `[USER_UID]`

**Fields to add:**

| Field | Type | Value |
|-------|------|-------|
| `userId` | string | `[USER_UID]` |
| `email` | string | `jawadfarran9@gmail.com` |
| `displayName` | string | `Admin Test Account` |
| `role` | string | `clinic` |
| `clinicId` | string | `clinic_[USER_UID]_admin` |
| `memberId` | string | `member_[USER_UID]_clinic_[USER_UID]_admin` |

---

## ✅ VERIFICATION CHECKLIST

After creating all documents:

- [ ] Firebase Auth user exists: `jawadfarran9@gmail.com`
- [ ] User UID copied (starts with random letters/numbers)
- [ ] Document `clinics/clinic_[UID]_admin` created
  - [ ] Field `subscribed` is **boolean** `true` (NOT string)
- [ ] Document `clinic_members/member_[UID]_...` created
  - [ ] Field `role` is `OWNER_ADMIN`
  - [ ] Field `status` is `ACTIVE`
- [ ] Document `clinics_public/clinic_[UID]_admin` created
  - [ ] Field `isPublished` is **boolean** `true`
  - [ ] Field `geo` is a **map** with `lat` and `lng` numbers
- [ ] Document `users/[UID]` created

---

## 📱 TEST LOGIN

1. **Open the app**
2. **Tap "Clinic Login"**
3. **Enter:**
   - Email: `jawadfarran9@gmail.com`
   - Password: `jawadfarran9`
4. **Tap Login**

### ✅ Expected Result:
- Login successful
- Redirects to **main clinic dashboard** (NOT subscription screen)
- Bottom tabs visible
- All screens accessible
- No paywall prompts

### ❌ If it doesn't work:
1. Check `clinics/clinic_[UID]_admin` → `subscribed` field:
   - Must be **boolean** `true`
   - NOT string `"true"`
2. Check all document IDs match the pattern
3. Check `role` is `OWNER_ADMIN`
4. Check `status` is `ACTIVE`

---

## 🔍 COMMON MISTAKES TO AVOID

### ❌ WRONG:
- `subscribed: "true"` (string) ← **WRONG**
- `isPublished: "true"` (string) ← **WRONG**
- `aiProEnabled: "true"` (string) ← **WRONG**
- `geo: {lat: "25.2048", lng: "55.2708"}` (strings) ← **WRONG**

### ✅ CORRECT:
- `subscribed: true` (boolean) ← **CORRECT**
- `isPublished: true` (boolean) ← **CORRECT**
- `aiProEnabled: true` (boolean) ← **CORRECT**
- `geo: {lat: 25.2048, lng: 55.2708}` (numbers) ← **CORRECT**

---

## 🎯 QUICK FIELD REFERENCE

**String fields (yellow quotes icon):**
- clinicName, email, role, status, tier, etc.

**Boolean fields (green checkbox icon):**
- subscribed, isPublished, aiProEnabled
- Use dropdown: select `true`

**Number fields (blue # icon):**
- averageRating, totalReviews, geo.lat, geo.lng
- Type raw number: `5.0` or `100`

**Map fields (purple brackets icon):**
- geo
- Click map field → Add nested fields inside

---

## 📞 NEED HELP?

Check full guide: `ADMIN_ACCOUNT_SETUP_GUIDE.md`

Or run interactive script:
```powershell
.\scripts\setupAdminAccount.ps1
```

---

**Last Updated:** January 2, 2026
