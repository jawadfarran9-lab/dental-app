# 🔄 Clinic Image Upload Flow Diagram

## Complete Data Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                          SIGNUP SCREEN                              │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  1. User fills in clinic details                            │   │
│  │  2. User clicks "Upload Image" button                       │   │
│  │  3. Image Picker opens → User selects image                 │   │
│  │  4. Image preview shown (80x80px thumbnail)                 │   │
│  │  5. User confirms signup                                    │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                              ↓                                        │
│                    clinicImage = {uri}                              │
│                    ↓                                                 │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
        ┌─────────────────────┴──────────────────────┐
        │                                           │
┌───────▼─────────────┐              ┌──────────────▼────────┐
│   Firebase Auth     │              │   Firestore: clinics  │
│  (Create clinic     │              │   - firstName         │
│   document)         │              │   - lastName          │
└───────┬─────────────┘              │   - email             │
        │                            │   - password          │
        │                            │   - clinicName        │
        │                            └──────────┬────────────┘
        │                                       │
        └───────────────┬───────────────────────┘
                        ↓
          ┌─────────────────────────┐
          │ completePaymentAndLogin │
          └─────────────┬───────────┘
                        ↓
              ┌──────────────────────────┐
              │ CHECK: clinicImage exists?
              └──────────┬───────────────┘
                         ↓
        ┌────────────────┴────────────────┐
        │ YES                            │ NO
        ↓                                ↓
    ┌───────────────────┐         ┌──────────────┐
    │ UPLOAD TO STORAGE │         │  Skip upload │
    └─────┬─────────────┘         │  (optional)  │
          ↓                       └──────┬───────┘
    storage/clinics/              │
    {clinicId}/                   │
    clinicImage.jpg               │
          ↓                        │
    ┌─────────────────────┐       │
    │ Get Download URL    │       │
    └─────┬───────────────┘       │
          ↓                        │
    imageUrl = "https://..."      │
          ↓                        │
    ┌──────────────────────────┐   │
    │ SAVE TO FIRESTORE        │   │
    │ clinicData.imageUrl =    │   │
    │  imageUrl                │   │
    │ clinicData.imageUploadedAt│  │
    │  = timestamp             │   │
    └──────────┬───────────────┘   │
               ↓                    │
    ┌──────────────────────────┐   │
    │ SAVE TO ASYNC STORAGE    │   │
    │ clinicImageUrl =         │   │
    │  imageUrl                │   │
    └──────────┬───────────────┘   │
               │                   │
               └────────┬──────────┘
                        ↓
        ┌──────────────────────────┐
        │ NAVIGATE TO CONFIRMATION │
        └──────────┬───────────────┘
                   ↓
    ┌──────────────────────────────────┐
    │   CONFIRMATION SCREEN            │
    │  ┌────────────────────────────┐  │
    │  │  Clinic Image Display      │  │
    │  │  (200px height)            │  │
    │  │  From: AsyncStorage        │  │
    │  └────────────────────────────┘  │
    │                                  │
    │  Subscription Details            │
    │  - Plan: Monthly                 │
    │  - Price: $19.99                 │
    │  - etc.                          │
    │                                  │
    │  [Confirm Subscription Button]   │
    └──────────────┬───────────────────┘
                   ↓
    ┌──────────────────────────┐
    │ UPDATE FIRESTORE         │
    │ subscribed: true         │
    │ subscriptionConfirmedAt: │
    │  timestamp               │
    └──────────┬───────────────┘
               ↓
    ┌──────────────────────────────────┐
    │   DASHBOARD SCREEN               │
    │  ┌────────────────────────────┐  │
    │  │  Clinic Image Display      │  │
    │  │  (from clinic.imageUrl)    │  │
    │  │  From: Firestore           │  │
    │  └────────────────────────────┘  │
    │                                  │
    │  Patients List                   │
    │  Dashboard Stats                 │
    │  etc.                            │
    │                                  │
    └──────────────────────────────────┘
```

---

## Data Sources by Screen

```
┌────────────────────────────────────────────────────────┐
│               IMAGE SOURCES BY LOCATION                │
└────────────────────────────────────────────────────────┘

SIGNUP SCREEN
└─ SOURCE: Local device via Image Picker
└─ STORAGE: React state (clinicImage)
└─ DISPLAY: 80x80px thumbnail

UPLOAD PROCESS
└─ SOURCE: React state (clinicImage)
└─ UPLOAD: Firebase Storage (clinics/{id}/clinicImage.jpg)
└─ URL GENERATION: Firebase getDownloadURL()

CONFIRMATION SCREEN
├─ SOURCE 1: AsyncStorage (clinicImageUrl) - PRIMARY
└─ DISPLAY: 200px height, full width

DASHBOARD SCREEN
├─ SOURCE 1: Firestore (clinic.imageUrl) - PRIMARY
├─ SOURCE 2: Firestore (clinic.heroImageUrl) - FALLBACK
├─ SOURCE 3: Firestore (clinic.logoUrl) - FALLBACK
└─ DISPLAY: Hero/Header section

FUTURE: SETTINGS
├─ SOURCE: Firestore (clinic.logoUrl)
└─ DISPLAY: Settings profile section
```

---

## File Modification Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                      MODIFIED FILES                                 │
└─────────────────────────────────────────────────────────────────────┘

1. app/clinic/signup.tsx
   ├─ ADD: import uploadClinicImage
   └─ UPDATE: completePaymentAndLogin()
      └─ ADD: Image upload to Firebase Storage
      └─ ADD: Save URL to Firestore
      └─ ADD: Save URL to AsyncStorage

2. app/clinic/confirm-subscription.tsx
   ├─ ADD: Image component import
   ├─ ADD: State variable (clinicImageUrl)
   ├─ UPDATE: useFocusEffect to load image URL
   ├─ ADD: UI section to display image
   └─ ADD: Styles for image container

3. app/clinic/index.tsx
   ├─ UPDATE: Clinic data fetch
   └─ CHANGE: Image source priority
      └─ FROM: heroImageUrl || logoUrl
      └─ TO: imageUrl || heroImageUrl || logoUrl

NEW FILES CREATED:

4. src/utils/firebaseStorageUtils.ts
   ├─ uploadClinicImage(localUri, clinicId)
   └─ deleteClinicImage(clinicId)

5. src/utils/clinicDataUtils.ts
   ├─ fetchClinicData(clinicId)
   └─ getClinicImageUrl(clinicId)
```

---

## Database Schema

```
FIRESTORE: clinics collection
┌─────────────────────────────────────────┐
│ Document ID: {clinicId}                 │
├─────────────────────────────────────────┤
│ firstName: string                       │
│ lastName: string                        │
│ email: string                           │
│ password: string                        │
│ clinicName: string                      │
│ clinicPhone: string                     │
│ phone: string                           │
│ countryCode: string                     │
│ city: string                            │
│                                         │
│ ✨ NEW FIELDS:                          │
│ imageUrl: string                        │ ← From signup
│ imageUploadedAt: timestamp              │
│                                         │
│ Existing Image Fields:                  │
│ heroImageUrl: string                    │ ← From public profile
│ logoUrl: string                         │ ← From settings
│                                         │
│ subscribed: boolean                     │
│ subscriptionConfirmedAt: timestamp      │
│ subscriptionPlan: 'MONTHLY' | 'YEARLY'  │
│ appliedCoupon: string                   │
│ finalPrice: number                      │
│ basePrice: number                       │
│ status: string                          │
│ createdAt: timestamp                    │
│ accountCreatedAt: timestamp             │
└─────────────────────────────────────────┘

FIREBASE STORAGE
┌─────────────────────────────────────────┐
│ clinics/                                │
│ ├─ {clinicId}/                          │
│ │  └─ clinicImage.jpg ✨ NEW            │
│ └─ ...                                  │
└─────────────────────────────────────────┘

ASYNC STORAGE (Session)
┌─────────────────────────────────────────┐
│ clinicId: string                        │
│ clinicImageUrl: string ✨ NEW           │ ← Cached from Firebase
│ pendingSubscriptionEmail: string        │
│ pendingSubscriptionPlanName: string     │
│ pendingSubscriptionPrice: string        │
│ pendingIncludeAIPro: boolean            │
│ ... other pending data                  │
└─────────────────────────────────────────┘
```

---

## Error Handling Flow

```
┌─────────────────────────────────────────────────────┐
│          IMAGE UPLOAD ERROR HANDLING                │
└─────────────────────────────────────────────────────┘

User Confirms Signup
    ↓
Has clinicImage?
    ├─ YES → Start Upload
    │        ↓
    │        Try Upload to Firebase Storage
    │        ├─ SUCCESS
    │        │  ├─ Get Download URL
    │        │  ├─ Save to Firestore
    │        │  ├─ Save to AsyncStorage
    │        │  └─ Continue to Confirmation
    │        └─ ERROR
    │           ├─ Log Error
    │           ├─ Show Alert to User
    │           │  "Could not upload image, but account created"
    │           ├─ Continue to Confirmation (NO IMAGE)
    │           └─ ⚠️ Subscription NOT blocked
    │
    └─ NO → Skip Upload
           └─ Continue to Confirmation (NO IMAGE)

Result:
✅ Upload succeeds → Image displays in all screens
⚠️ Upload fails → Signup continues, image not displayed
✅ No image selected → Normal signup flow, no image
```

---

## Display Priority Logic

```
DASHBOARD IMAGE SELECTION:

clinicImage = 
  clinicData.imageUrl
  || clinicData.heroImageUrl      // From public profile settings
  || clinicData.logoUrl           // From clinic settings
  || ''                           // Empty (no image)

Priority Order:
1. imageUrl (Signup image)         ← HIGHEST PRIORITY
2. heroImageUrl (Settings)
3. logoUrl (Settings)
4. None                            ← LOWEST PRIORITY
```

---

## Sequence Diagram: Signup to Dashboard

```
User          Signup       Firebase      Firestore    AsyncStorage    Confirmation   Dashboard
 │              │           Storage         DB              │              │            │
 │              │              │             │               │              │            │
 ├─ Select ────→│              │             │               │              │            │
 │  Image       │              │             │               │              │            │
 │              │              │             │               │              │            │
 ├─ Confirm ───→│              │             │               │              │            │
 │  Signup      │              │             │               │              │            │
 │              │              │             │               │              │            │
 │              ├─ Create ─────→│             │               │              │            │
 │              │  Doc          │             │               │              │            │
 │              │              │             │               │              │            │
 │              ├─ Update ─────────────────→ │               │              │            │
 │              │  Account Data           │               │              │            │
 │              │              │             │               │              │            │
 │              ├─ Upload ─────→│             │               │              │            │
 │              │  Image        │             │               │              │            │
 │              │              │             │               │              │            │
 │              │←─ URL ────────┤             │               │              │            │
 │              │              │             │               │              │            │
 │              ├─ Save URL ───────────────→ │               │              │            │
 │              │              │             │               │              │            │
 │              ├─ Save URL ───────────────────────────────→│              │            │
 │              │              │             │               │              │            │
 │              │              │             │               ├─ Navigate ──→│            │
 │              │              │             │               │              │            │
 │              │              │             │               │    Load ────→│            │
 │              │              │             │               │    Image     │            │
 │              │              │             │               │              │ Display   │
 │              │              │             │               │              ├─ Fetch ──→│
 │              │              │             │               │              │  Image    │
 │              │              │             │               │              │ Display   │
 │              │              │             │              │              │    ✓      │
 │              │              │             │               │              │            │
```

---

## Success Criteria ✅

- [x] Image uploads to Firebase Storage
- [x] Download URL saved to Firestore
- [x] Image displays on confirmation page
- [x] Image displays on dashboard
- [x] Error handling is non-blocking
- [x] Multi-source fallback works
- [x] Type safety implemented
- [x] AsyncStorage caching works
- [x] All screens render correctly
