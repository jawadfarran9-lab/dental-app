# Messages Inbox - Quick Reference Guide

## 📁 File Locations

```
src/utils/threadsHelper.ts             ← Core thread logic
app/clinic/messages.tsx                ← Inbox screen (NEW)
app/clinic/[patientId].tsx             ← Chat (UPDATED)
app/patient/[patientId].tsx            ← Chat (UPDATED)
app/clinic/index.tsx                   ← Dashboard (UPDATED)
```

## 🎯 Three Functions in `threadsHelper.ts`

```typescript
// 1. Create or update thread on message send
updateThreadOnMessage(
  clinicId: string,
  patientId: string,
  patientName: string,
  messageText: string,
  senderType: 'clinic' | 'patient'
)

// 2. Mark thread read for clinic (reset blue dot)
markThreadReadForClinic(clinicId: string, patientId: string)

// 3. Mark thread read for patient (reset unread counter)
markThreadReadForPatient(clinicId: string, patientId: string)
```

## 🔄 When Each Function Is Called

| Function | Called From | When |
|----------|------------|------|
| `updateThreadOnMessage('clinic', ...)` | `app/clinic/[patientId].tsx` | After clinic sends message |
| `updateThreadOnMessage('patient', ...)` | `app/patient/[patientId].tsx` | After patient sends message |
| `markThreadReadForClinic()` | `app/clinic/messages.tsx` | Clinic taps a thread |
| `markThreadReadForClinic()` | `app/clinic/[patientId].tsx` | Chat tab opens in clinic |
| `markThreadReadForPatient()` | `app/patient/[patientId].tsx` | Chat tab opens in patient |

## 📊 Firestore Structure

```
threads/
├── clinic-abc_patient-123/
│   ├── clinicId: "clinic-abc"
│   ├── patientId: "patient-123"
│   ├── patientName: "John Doe"
│   ├── lastMessageText: "Hello..."
│   ├── lastMessageSender: "patient"
│   ├── lastMessageAt: Timestamp
│   ├── unreadForClinic: 1
│   ├── unreadForPatient: 0
│   └── createdAt: Timestamp
└── clinic-abc_patient-456/
    └── ... (similar structure)
```

## 🚀 Quick Start - After File Updates

1. **Deploy code** - All files are ready
2. **Create Firestore index:**
   ```
   Collection: threads
   Field 1: clinicId (Ascending)
   Field 2: lastMessageAt (Descending)
   ```
3. **Test on device:**
   - Patient sends message
   - Clinic sees blue dot
   - Clinic taps thread → chat opens
   - Blue dot disappears

## ⚡ Blue Dot Logic

```
Blue dot appears when:  unreadForClinic > 0

Blue dot disappears when:
- Clinic opens inbox and taps thread
- markThreadReadForClinic() resets to 0

How it resets:
1. Clinic taps thread in inbox
2. markThreadReadForClinic() called
3. Firestore: unreadForClinic = 0
4. UI re-renders: no dot
```

## 📱 Navigation Flows

### Clinic Flow
```
Dashboard ("Messages" button)
    ↓
/clinic/messages (Inbox)
    ↓ (tap thread)
/clinic/[patientId]?tab=chat (Chat auto-opens)
```

### Patient Flow
```
Patient App
    ↓ (open chat)
/patient/[patientId] (Chat tab)
    ↓
Mark thread as read
```

## 🔍 Query Used in Inbox

```typescript
where('clinicId', '==', clinicId)
orderBy('lastMessageAt', 'desc')
```

**Index required:** YES (composite)

## ⚙️ Configuration Checklist

- [ ] `src/utils/threadsHelper.ts` exists
- [ ] Imports use `@/src/utils/threadsHelper`
- [ ] `app/clinic/messages.tsx` created
- [ ] `app/clinic/[patientId].tsx` updated
- [ ] `app/patient/[patientId].tsx` updated
- [ ] `app/clinic/index.tsx` has Messages button
- [ ] Firestore composite index created
- [ ] Firestore rules allow threads collection access

## 🧪 Test Commands (Manually)

1. **Patient sends message:**
   - Check: `threads/{clinicId}_{patientId}` created
   - Check: `unreadForClinic = 1`

2. **Clinic opens messages:**
   - Check: Blue dot appears
   - Check: Patient name and preview show

3. **Clinic taps thread:**
   - Check: Navigates to /clinic/[patientId]?tab=chat
   - Check: Chat tab auto-opens
   - Check: Firestore unreadForClinic = 0

4. **Clinic sends message:**
   - Check: unreadForPatient = 1

5. **Patient opens chat:**
   - Check: Firestore unreadForPatient = 0

## 💡 Troubleshooting

| Issue | Solution |
|-------|----------|
| Blue dot not showing | Check unreadForClinic > 0 in Firestore |
| Chat tab not opening | Verify tabParam = 'chat' in useLocalSearchParams |
| Thread not created | Check clinicId is passed to updateThreadOnMessage |
| Index error | Create composite index in Firebase Console |
| Import errors | Use @/src/utils/ path, not @/app/utils/ |

## 📞 Support Resources

- `MESSAGES_VERIFICATION.md` - Full testing guide
- `MESSAGES_IMPLEMENTATION.md` - Architecture details
- `MESSAGES_CODE_FLOW.md` - Step-by-step code walkthrough
- `THREADS_SETUP.md` - Firestore schema reference

## ✅ Pre-Release Checklist

- [ ] Composite index active in Firestore
- [ ] Tested on physical device
- [ ] Blue dot appears/disappears correctly
- [ ] Chat tab auto-opens
- [ ] Message history loads
- [ ] No console errors
- [ ] Performance acceptable
- [ ] Ready for production

