# Firestore Threads Index Setup

## Cloud Firestore Collections

### Required Collection: `threads`

This collection stores message thread metadata for fast inbox queries.

#### Document Structure

**Collection:** `threads`  
**Document ID:** `{clinicId}_{patientId}`

**Fields:**
```
{
  "clinicId": string,                    // Doctor's clinic ID
  "patientId": string,                   // Patient ID
  "patientName": string,                 // Patient name (denormalized for display)
  "lastMessageText": string,             // Preview of last message
  "lastMessageSender": 'clinic' | 'patient',  // Who sent the last message
  "lastMessageAt": timestamp,            // Firestore serverTimestamp()
  "unreadForClinic": number,             // Unread count for doctor (0 when read)
  "unreadForPatient": number,            // Unread count for patient (0 when read)
  "createdAt": timestamp                 // Thread creation time
}
```

#### Index Configuration (if using automatic indexing)

Create a composite index for fast inbox queries:

**Collection:** `threads`  
**Query scope:** Collection

**Indexes needed:**
1. `clinicId` (Ascending) + `lastMessageAt` (Descending) - for clinic inbox list

Most modern Firestore setups will auto-create this index on first query. If you get a "missing index" error, follow the link in Firebase console to create it.

## Client-Side Logic

The threads collection is maintained purely through **client-side updates** (no Cloud Functions):

1. **Patient sends message:**
   - Write to `patients/{patientId}/messages`
   - Update thread: increment `unreadForClinic`, update `lastMessageText` and `lastMessageAt`

2. **Clinic sends message:**
   - Write to `patients/{patientId}/messages`
   - Update thread: increment `unreadForPatient`, update `lastMessageText` and `lastMessageAt`

3. **Clinic opens chat:**
   - Set `unreadForClinic = 0` in thread

4. **Patient opens chat:**
   - Set `unreadForPatient = 0` in thread

## Files Implementing Threads

- **`app/utils/threadsHelper.ts`** - Thread helper functions
- **`app/clinic/messages.tsx`** - Clinic inbox UI
- **`app/clinic/[patientId].tsx`** - Updated to sync messages to threads
- **`app/patient/[patientId].tsx`** - Updated to sync messages to threads
- **`app/clinic/index.tsx`** - Added Messages button

## Testing

1. Clinic sends message → Check `threads/{clinicId}_{patientId}` is created with correct data
2. Patient sends message → Check `unreadForClinic` increments
3. Clinic opens messages inbox → Check threads load with correct order (newest first)
4. Clinic taps a thread → Check chat opens and `unreadForClinic` resets to 0
5. Blue dot badge disappears when unread count is 0
