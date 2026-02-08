# Messages Inbox Feature - Verification Checklist & Firestore Setup

## ✅ File Structure Verified

### Moved Files
- ✅ `src/utils/threadsHelper.ts` - Helper functions for thread management
- ✅ All imports updated to use `@/src/utils/threadsHelper`

### Updated Files
- ✅ `app/clinic/messages.tsx` - Inbox screen with thread list
- ✅ `app/clinic/[patientId].tsx` - Chat sync with threads collection
- ✅ `app/patient/[patientId].tsx` - Chat sync with threads collection
- ✅ `app/clinic/index.tsx` - Added Messages button

## 🔧 Firestore Configuration Required

### Collection: `threads`

**Document ID Format:** `{clinicId}_{patientId}`

**Required Composite Index:**
- Collection: `threads`
- Fields:
  1. `clinicId` (Ascending)
  2. `lastMessageAt` (Descending)

**Why needed:** Used in query:
```typescript
query(
  collection(db, 'threads'),
  where('clinicId', '==', clinicId),
  orderBy('lastMessageAt', 'desc')
)
```

**How to create:**
1. Run the app and attempt to load messages
2. Firestore will show an error with a link to create the index
3. Click the link and confirm creation (takes ~1-2 minutes)
4. Refresh the app

**Or manually:**
1. Go to Firebase Console → Firestore Database → Indexes (Composite)
2. Create Index:
   - Collection: `threads`
   - Field: `clinicId` - Ascending
   - Field: `lastMessageAt` - Descending

## 📋 Testing Checklist

### Test 1: First Message Creates Thread

**Scenario:** Patient sends first message to clinic

**Expected Results:**
```
threads/{clinicId}_{patientId} document created with:
{
  "clinicId": "clinic-123",
  "patientId": "patient-456",
  "patientName": "John Doe",
  "lastMessageText": "[message text]",
  "lastMessageSender": "patient",
  "lastMessageAt": timestamp,
  "unreadForClinic": 1,
  "unreadForPatient": 0,
  "createdAt": timestamp
}
```

**How to verify:**
1. Log in as patient
2. Send a message to clinic
3. Go to Firebase Console → Firestore → threads collection
4. Check the document `{clinicId}_{patientId}` exists with correct fields

---

### Test 2: Unread Counter - Patient Message

**Scenario:** Patient sends message while clinic hasn't read

**Expected Results:**
- `unreadForClinic` increments by 1 each message
- `lastMessageText` updates
- `lastMessageAt` updates to current timestamp

**How to verify:**
1. Patient sends 3 messages
2. Check thread document: `unreadForClinic` should be 3

---

### Test 3: Blue Dot Badge

**Scenario:** Clinic views messages inbox with unread messages

**Expected Results:**
- Blue dot (10×10px) appears on threads with `unreadForClinic > 0`
- No dot on threads with `unreadForClinic == 0`
- Thread sorted by `lastMessageAt` descending (newest first)

**How to verify:**
1. Patient sends message to clinic
2. Clinic taps Messages button
3. Blue dot appears next to thread
4. Check correct styling (clean white background, blue dot on right)

---

### Test 4: Tap Thread Navigation

**Scenario:** Clinic taps a thread from inbox

**Expected Results:**
- Navigates to `/clinic/{patientId}?tab=chat`
- **Chat tab automatically opens** (not timeline)
- `unreadForClinic` is set to 0
- Blue dot disappears

**How to verify:**
1. Clinic is in messages inbox with unread threads
2. Tap any thread
3. Confirm chat tab is visible (not timeline)
4. Go back to messages → blue dot is gone from that thread

---

### Test 5: Clinic Message - Unread for Patient

**Scenario:** Clinic sends message while patient hasn't read

**Expected Results:**
- `unreadForPatient` increments by 1
- `lastMessageSender` = 'clinic'
- Thread updates in database

**How to verify:**
1. Patient and clinic have an open thread
2. Clinic sends message
3. Check thread: `unreadForPatient` increments

---

### Test 6: Patient Opens Chat - Resets Unread

**Scenario:** Patient opens chat with unread clinic messages

**Expected Results:**
- `unreadForPatient` is set to 0
- Patient can see all messages from clinic
- No badge/indicator shown

**How to verify:**
1. Clinic sends messages to patient
2. Patient opens the patient app and navigates to chat
3. Check Firestore: `unreadForPatient` = 0

---

### Test 7: Message Order in Inbox

**Scenario:** Multiple threads exist with different last message times

**Expected Results:**
- Threads appear in descending order by `lastMessageAt`
- Most recent message at top
- Sorting is correct even with new messages

**How to verify:**
1. Have 3+ active threads with patients
2. Patient A messages clinic, then Patient B messages clinic
3. Messages inbox should show Patient B thread at top

---

## 🐛 Common Issues & Solutions

### Issue: "Query requires an index"
**Solution:**
1. Copy the link from Firebase error message
2. Click it and create the composite index
3. Wait 1-2 minutes for creation
4. Refresh app

### Issue: Blue dot not showing
**Verify:**
- `unreadForClinic > 0` in Firestore
- Check thread document exists and has correct data
- Clear app cache and reload

### Issue: Chat tab not auto-opening
**Check:**
- URL params include `?tab=chat`
- `[patientId].tsx` reads `tabParam` from `useLocalSearchParams()`
- Initial state is set to `chat` if param exists

### Issue: Thread not created on first message
**Check:**
- `clinicId` is correctly passed to `updateThreadOnMessage()`
- Patient object has `clinicId` field
- Firestore write permissions allow creating in `threads` collection

---

## 📝 Implementation Notes

**Thread ID Format:** `${clinicId}_${patientId}`
- Simple string key makes document IDs predictable
- No duplicate threads possible
- Easy to query by clinicId

**Unread Logic:**
- `unreadForClinic`: Increments on patient messages, resets to 0 when clinic opens chat
- `unreadForPatient`: Increments on clinic messages, resets to 0 when patient opens chat
- Both initialized based on who sends the first message

**No Cloud Functions:**
- All updates happen client-side
- Reduces latency and complexity
- Relies on client code to update threads collection

**Message Sync:**
- Messages stay in `patients/{patientId}/messages` (original location)
- Threads collection is metadata-only for fast inbox queries
- Both collections must be updated together in client code
