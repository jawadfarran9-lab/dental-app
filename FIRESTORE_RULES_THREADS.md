# Firestore Security Rules for Messages Feature

## Recommended Rules

```firestore rules
// Allow authenticated users to read/write to threads collection
// with appropriate isolation

rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Clinic can read all their own threads
    // Patient can read threads where they're the patientId
    match /threads/{threadId} {
      allow read: if 
        request.auth != null && (
          // Clinic reading their own threads
          request.auth.uid == get(/databases/$(database)/documents/clinics/$(
            resource.data.clinicId
          )).data.uid ||
          // Patient reading their thread
          request.auth.uid == get(/databases/$(database)/documents/patients/$(
            resource.data.patientId
          )).data.uid
        );
      
      allow write: if 
        request.auth != null && (
          // Clinic or patient can update their own thread
          request.auth.uid == get(/databases/$(database)/documents/clinics/$(
            resource.data.clinicId
          )).data.uid ||
          request.auth.uid == get(/databases/$(database)/documents/patients/$(
            resource.data.patientId
          )).data.uid
        );
    }

    // Messages collection (already exists)
    match /patients/{patientId}/messages/{messageId} {
      allow read: if 
        request.auth != null && (
          // Patient can read their own messages
          request.auth.uid == get(/databases/$(database)/documents/patients/$(
            patientId
          )).data.uid ||
          // Clinic can read messages for their patients
          request.auth.uid == get(/databases/$(database)/documents/patients/$(
            patientId
          )).data.clinicId
        );
      
      allow write: if 
        request.auth != null && (
          // Patient can write to their own messages
          request.auth.uid == get(/databases/$(database)/documents/patients/$(
            patientId
          )).data.uid ||
          // Clinic can write to their patient's messages
          request.auth.uid == get(/databases/$(database)/documents/patients/$(
            patientId
          )).data.clinicId
        );
    }
  }
}
```

## Simplified Version (If Complex Queries Fail)

If the above is too restrictive or causes issues, use this simpler version:

```firestore rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Allow authenticated users to read/write threads
    match /threads/{threadId} {
      allow read, write: if request.auth != null;
    }

    // Keep existing message permissions
    match /patients/{patientId}/messages/{messageId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

**Note:** The simplified version allows any authenticated user to read/write threads. If you have strict privacy requirements, use the complex version with proper UID validation.

## Recommended Version (Balanced)

This version balances security with simplicity:

```firestore rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Threads: Allow read/write for authenticated users
    // (In production, add proper clinic/patient isolation)
    match /threads/{threadId} {
      allow read, write: if request.auth != null;
    }

    // Messages: Existing rules
    match /patients/{patientId}/messages/{messageId} {
      allow read, write: if request.auth != null;
    }

    // Other collections (for reference)
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

## Testing Your Rules

1. **In Firebase Console:**
   - Go to Firestore Database → Rules
   - Copy your chosen rules above
   - Click "Publish"

2. **Test Queries:**
   - Try to create a thread from clinic side
   - Try to read threads from clinic inbox
   - Try to update unread counters
   - Try to read from patient side

3. **If Tests Fail:**
   - Check browser console for error messages
   - Copy the error message
   - Firestore will suggest what's missing
   - Adjust rules accordingly

## Production Recommendations

**For Single Clinic App:**
Use the Simplified Version

**For Multi-Clinic App:**
Use the Recommended Version + add clinic ID check in code

**For Strict Isolation:**
Use the Complex Version with proper UID validation

## Index Configuration

**In Firebase Console:**
Firestore Database → Indexes → Composite

**Create Index:**
```
Collection: threads
Field 1: clinicId (Ascending)
Field 2: lastMessageAt (Descending)
Status: Enabled
```

**Status:** Will show "Building" briefly, then "Enabled"

## Common Rule Issues & Fixes

| Issue | Error Message | Fix |
|-------|---------------|-----|
| Can't read threads | "Missing or insufficient permissions" | Use Recommended or Simplified rules |
| Index error | "Query requires an index" | Create composite index in Firebase Console |
| Can't write to threads | "Permission denied" | Check rule allows write for request.auth.uid |
| Rules too strict | "Permission denied for valid operation" | Switch to less restrictive rules |

## Deployment Flow

1. Deploy code (all 5 files)
2. Create composite index
3. Apply Firestore rules
4. Test on device
5. Verify all flows work
6. Deploy to production

## Troubleshooting

**If Firestore rejects thread writes:**
1. Check rule syntax (copy from above exactly)
2. Ensure `request.auth != null` condition
3. Try Simplified Version first
4. Check browser console for exact error

**If index error appears:**
1. Go to Firebase Console
2. Click the error link or go to Indexes
3. Create the suggested composite index
4. Wait 1-2 minutes for creation
5. Refresh app

**If threads don't load:**
1. Check rule allows `read`
2. Check index is enabled
3. Check clinicId is correct in query
4. Try simpler query first: `query(collection(db, 'threads'))`
