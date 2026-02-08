# 📋 FIRESTORE INTEGRATION GUIDE - AI PRO CLOUD FUNCTION

**Purpose:** Setup Firestore collections and fields for Cloud Function AI Pro feature

---

## Collections Overview

### 1. `clinics` Collection

**Purpose:** Store clinic information including AI Pro subscription status

**Structure:**
```firestore
clinics/{clinicId}
├── includeAIPro: boolean               [NEW - Required for fallback]
├── name: string
├── subscriptionPlan: 'free' | 'pro' | 'enterprise'
├── subscriptionPriceWithAIPro: number
├── phoneNumber: string
├── address: string
├── logo: string
└── ...other fields...
```

**Field Details:**

| Field | Type | Required? | Purpose |
|-------|------|-----------|---------|
| `includeAIPro` | boolean | Optional* | Flags if clinic has AI Pro subscription |
| `name` | string | Yes | Clinic display name |
| `subscriptionPlan` | string | Yes | Pricing tier |
| `subscriptionPriceWithAIPro` | number | For Pro | Monthly price for AI Pro add-on |

*Optional at field level, but recommended to avoid costly Firestore reads when not provided.

### 2. `ai_logs` Collection [NEW]

**Purpose:** Audit trail for all AI chat requests and responses

**Structure:**
```firestore
ai_logs/{docId}
├── userId: string
├── clinicId: string
├── message: string                     [User's question]
├── response: string                    [AI's answer]
├── category: string                    [Response classification]
├── language: string                    ['en' | 'ar']
├── includeAIPro: boolean               [Was Pro enabled?]
├── aiProSource: string                 ['request' | 'firestore' | 'firestore_fallback']
├── model: string                       ['gpt-4o']
├── maxTokens: number                   [500 or 1000]
├── responseLength: number              [Character count of response]
├── status: string                      ['success' | 'error']
├── error?: string                      [Error message if failed]
├── errorCode?: string                  [Error code if failed]
├── firestoreRead?: boolean             [Did we read clinic doc?]
├── firestoreError?: string             [If Firestore read failed]
├── logError?: string                   [If log write failed]
├── startTime: timestamp                [When request started]
├── endTime: timestamp                  [When response completed]
└── timestamp: timestamp                [Server timestamp]
```

---

## Setup Instructions

### Step 1: Update `clinics` Collection

Add the `includeAIPro` field to existing clinic documents:

#### Option A: Firebase Console (Manual)

1. Go to **Firestore Database**
2. Open **clinics** collection
3. For each clinic document:
   - Click **Edit** (pencil icon)
   - Click **Add field**
   - Field name: `includeAIPro`
   - Type: **boolean**
   - Value: `true` or `false`
   - Click **Save**

#### Option B: Script (Bulk Update)

```bash
# Run via Firebase Shell or Admin SDK
firebase firestore:start --emulator
```

```javascript
// admin-update-clinics.js
const admin = require('firebase-admin');

async function updateClinics() {
  const db = admin.firestore();
  const clinicsRef = db.collection('clinics');
  
  try {
    const snapshot = await clinicsRef.get();
    const batch = db.batch();
    
    snapshot.docs.forEach(doc => {
      batch.update(doc.ref, {
        includeAIPro: false  // Default to free tier
      });
    });
    
    await batch.commit();
    console.log(`Updated ${snapshot.docs.length} clinics`);
  } catch (err) {
    console.error('Update failed:', err);
  }
}

updateClinics();
```

#### Option C: Selective Update

```javascript
// Update specific clinics to Pro
const db = admin.firestore();

// Single clinic
await db.collection('clinics').doc('clinic123').update({
  includeAIPro: true
});

// Multiple clinics
const batch = db.batch();
['clinic1', 'clinic2', 'clinic3'].forEach(clinicId => {
  batch.update(db.collection('clinics').doc(clinicId), {
    includeAIPro: true
  });
});
await batch.commit();
```

### Step 2: Create `ai_logs` Collection

The collection auto-creates on first write from Cloud Function. To pre-create:

```javascript
const db = admin.firestore();

// Create a placeholder document
await db.collection('ai_logs').doc('_placeholder').set({
  placeholder: true,
  createdAt: admin.firestore.FieldValue.serverTimestamp()
});

// Then delete placeholder
await db.collection('ai_logs').doc('_placeholder').delete();
```

### Step 3: Set Firestore Rules

Update your Firestore security rules to allow reads/writes:

```firestore
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Clinics - Cloud Function can read
    match /clinics/{clinicId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == resource.data.adminId;
    }
    
    // AI Logs - Cloud Function can write
    match /ai_logs/{document=**} {
      allow read, write: if request.auth != null;
      allow read, write: if request.auth.token.claims.isCloudFunction == true;
    }
    
  }
}
```

---

## Data Validation

### Clinic Document Validation

Ensure each clinic has:

```javascript
async function validateClinicData(clinicId) {
  const db = admin.firestore();
  const clinicRef = db.collection('clinics').doc(clinicId);
  const clinicSnap = await clinicRef.get();
  
  if (!clinicSnap.exists) {
    console.error(`Clinic ${clinicId} not found`);
    return false;
  }
  
  const data = clinicSnap.data();
  
  // Check required fields
  const checks = {
    hasName: !!data.name,
    hasIncludeAIPro: typeof data.includeAIPro === 'boolean',
  };
  
  console.log(`Clinic ${clinicId}:`, checks);
  return Object.values(checks).every(v => v);
}

// Validate all clinics
async function validateAllClinics() {
  const db = admin.firestore();
  const clinicsRef = db.collection('clinics');
  const snapshot = await clinicsRef.get();
  
  let valid = 0;
  let invalid = 0;
  
  for (const doc of snapshot.docs) {
    const isValid = await validateClinicData(doc.id);
    isValid ? valid++ : invalid++;
  }
  
  console.log(`Valid: ${valid}, Invalid: ${invalid}`);
}

validateAllClinics();
```

---

## Querying Data

### Query Pro Usage

```javascript
// Count Pro vs Free requests
const snapshot = await db.collection('ai_logs')
  .where('includeAIPro', '==', true)
  .count()
  .get();

console.log(`Pro requests: ${snapshot.data().count}`);

const freeSnapshot = await db.collection('ai_logs')
  .where('includeAIPro', '==', false)
  .count()
  .get();

console.log(`Free requests: ${freeSnapshot.data().count}`);
```

### Query by Clinic

```javascript
// Get all requests from a clinic
const clinicLogs = await db.collection('ai_logs')
  .where('clinicId', '==', 'clinic123')
  .orderBy('timestamp', 'desc')
  .limit(100)
  .get();

clinicLogs.docs.forEach(doc => {
  const log = doc.data();
  console.log(`${log.timestamp}: ${log.message.slice(0, 50)}...`);
});
```

### Query Errors

```javascript
// Get all errors
const errorLogs = await db.collection('ai_logs')
  .where('status', '==', 'error')
  .orderBy('timestamp', 'desc')
  .limit(50)
  .get();

errorLogs.docs.forEach(doc => {
  const log = doc.data();
  console.log(`[${log.errorCode}] ${log.error}`);
});
```

### Query by Pro Source

```javascript
// See how Pro status is determined
const fromRequest = await db.collection('ai_logs')
  .where('aiProSource', '==', 'request')
  .count()
  .get();

const fromFirestore = await db.collection('ai_logs')
  .where('aiProSource', '==', 'firestore')
  .count()
  .get();

console.log(`From request: ${fromRequest.data().count}`);
console.log(`From Firestore: ${fromFirestore.data().count}`);
```

---

## Monitoring & Analytics

### Setup Firestore Indexes (if needed)

Some queries may require composite indexes. Firebase will prompt you to create them when needed:

```firestore
# Suggested index for filtering + ordering
clinicId + includeAIPro + timestamp (DESC)

# Query:
db.collection('ai_logs')
  .where('clinicId', '==', 'clinic123')
  .where('includeAIPro', '==', true)
  .orderBy('timestamp', 'desc')
  .limit(50)
```

### Create Dashboard Queries

```javascript
// Monthly usage stats
async function getMonthlystats(month) {
  const db = admin.firestore();
  const startDate = new Date(new Date().getFullYear(), month, 1);
  const endDate = new Date(new Date().getFullYear(), month + 1, 0);
  
  const stats = await db.collection('ai_logs')
    .where('timestamp', '>=', startDate)
    .where('timestamp', '<=', endDate)
    .select('includeAIPro', 'responseLength', 'status')
    .get();
  
  let proCount = 0, freeCount = 0;
  let totalLength = 0;
  let errors = 0;
  
  stats.docs.forEach(doc => {
    const data = doc.data();
    if (data.includeAIPro) proCount++;
    else freeCount++;
    totalLength += data.responseLength || 0;
    if (data.status === 'error') errors++;
  });
  
  return {
    totalRequests: stats.docs.length,
    proRequests: proCount,
    freeRequests: freeCount,
    proPercentage: (proCount / stats.docs.length * 100).toFixed(2),
    avgResponseLength: (totalLength / stats.docs.length).toFixed(0),
    errorCount: errors,
    errorRate: (errors / stats.docs.length * 100).toFixed(2)
  };
}
```

---

## Troubleshooting

### Issue: Cloud Function can't read clinic.includeAIPro

**Possible Causes:**
1. Field doesn't exist on clinic document
2. Firestore rules deny read access
3. Clinic ID is incorrect or missing

**Solution:**
```javascript
// Check if field exists
const clinicSnap = await db.collection('clinics').doc('clinic123').get();
console.log('Field exists:', 'includeAIPro' in clinicSnap.data());
```

### Issue: ai_logs collection is empty

**Possible Causes:**
1. Firestore rules deny write access
2. Log document structure is wrong
3. Cloud Function error before logging

**Solution:**
```javascript
// Check permissions with test write
try {
  await db.collection('ai_logs').doc('test').set({
    test: true,
    timestamp: admin.firestore.FieldValue.serverTimestamp()
  });
  console.log('Write successful');
  await db.collection('ai_logs').doc('test').delete();
} catch (err) {
  console.error('Write failed:', err.message);
}
```

### Issue: Firestore read timeout in Cloud Function

**Possible Causes:**
1. Network issue
2. Firestore overloaded
3. Too many concurrent reads

**Solution:**
```javascript
// Add timeout handling
const timeoutPromise = new Promise((_, reject) =>
  setTimeout(() => reject(new Error('Firestore read timeout')), 5000)
);

try {
  const clinicSnap = await Promise.race([
    db.collection('clinics').doc(clinic.id).get(),
    timeoutPromise
  ]);
} catch (err) {
  console.warn('Firestore read timeout, using default');
  includeAIPro = false;
}
```

---

## Data Retention Policy

### Recommended Retention

```firestore
ai_logs collection:
- Keep all documents for 90 days
- Archive to BigQuery after 30 days for analytics
- Delete after 90 days (GDPR compliant)
```

### Setup Auto-Delete (TTL)

```javascript
// Add TTL field to logs (requires Firestore auto-delete feature)
const logDoc = {
  // ... other fields ...
  timestamp: admin.firestore.FieldValue.serverTimestamp(),
  ttl: admin.firestore.Timestamp.now().seconds + (90 * 24 * 60 * 60) // 90 days
};
```

---

## Migration from v1 to v2

### Step 1: Backup existing data

```bash
gcloud firestore export gs://your-bucket/backup-$(date +%s)
```

### Step 2: Add includeAIPro field

```javascript
// Default all existing clinics to free tier
const clinicsRef = db.collection('clinics');
const snapshot = await clinicsRef.get();

const batch = db.batch();
snapshot.docs.forEach(doc => {
  if (!doc.data().includeAIPro) {
    batch.update(doc.ref, { includeAIPro: false });
  }
});
await batch.commit();
```

### Step 3: Verify before deploying

```bash
# Run validation script
node admin-validate-clinics.js
```

### Step 4: Deploy Cloud Function

No data migration needed - backwards compatible!

---

## Security Considerations

### Firestore Rules

```firestore
// Restrict clinic reads
match /clinics/{clinicId} {
  // Only clinic admins can read/write
  allow read, write: if request.auth.uid == resource.data.adminId;
  
  // Cloud Function can read specific fields
  allow read: if get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
}

// Restrict log writes
match /ai_logs/{logId} {
  // Only Cloud Function can write (via Cloud Task or trigger)
  allow read: if request.auth != null;
  allow write: if request.auth.token.claims.isCloudFunction == true;
}
```

### Field-Level Security

```firestore
// Mask sensitive fields in logs
match /ai_logs/{logId} {
  allow read: if request.auth != null {
    // Hide user IDs from non-admins
    return request.auth.token.claims.admin == true;
  };
}
```

---

## Performance Optimization

### Indexing Strategy

```firestore
# Create composite index for common queries
Index 1: clinicId, timestamp (DESC)
Index 2: includeAIPro, timestamp (DESC)
Index 3: status, timestamp (DESC)
Index 4: clinicId, includeAIPro, timestamp (DESC)
```

### Sharding for High Write Volume

```javascript
// If ai_logs gets >1000 writes/sec, use sharding
const shardId = Math.floor(Math.random() * 10); // 10 shards
const logPath = `ai_logs_${shardId}/${docId}`;
```

---

**Last Updated:** January 2, 2026  
**Status:** ✅ Ready to Implement
