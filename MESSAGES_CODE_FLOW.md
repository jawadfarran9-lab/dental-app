# Messages Inbox - Code Flow Documentation

## 1️⃣ Patient Sends First Message

### Code Path: `app/patient/[patientId].tsx` → `sendMessage()`

```typescript
const sendMessage = async () => {
  const text = msgText.trim();
  if (!text || !authenticatedPatientId || !patient) return;
  setMsgText('');
  
  // STEP 1: Write message to messages collection
  await addDoc(collection(db, `patients/${authenticatedPatientId}/messages`), {
    from: 'patient',
    text,
    createdAt: Date.now(),
  });

  // STEP 2: Update threads collection
  if (patient.clinicId) {
    await updateThreadOnMessage(
      patient.clinicId,              // clinicId
      authenticatedPatientId,        // patientId
      patient.name,                  // patientName
      text,                          // messageText
      'patient'                      // senderType
    );
  }
};
```

### What Happens in `updateThreadOnMessage()`:

```typescript
// Check if thread exists
const threadSnap = await getDoc(doc(db, 'threads', `${clinicId}_${patientId}`));

if (threadSnap.exists()) {
  // Thread already exists, update it
  await updateDoc(threadRef, {
    lastMessageText: text,                    // Updated
    lastMessageSender: 'patient',             // Updated
    lastMessageAt: serverTimestamp(),         // Updated
    unreadForClinic: increment(1),            // Incremented!
  });
} else {
  // First message, create thread
  await setDoc(threadRef, {
    clinicId: 'clinic-abc',
    patientId: 'patient-xyz',
    patientName: 'John Doe',
    lastMessageText: 'Hello doctor',
    lastMessageSender: 'patient',
    lastMessageAt: serverTimestamp(),
    unreadForClinic: 1,                       // Set to 1
    unreadForPatient: 0,
    createdAt: serverTimestamp(),
  });
}
```

### Firestore Result:

**Document:** `threads/clinic-abc_patient-xyz`
```json
{
  "clinicId": "clinic-abc",
  "patientId": "patient-xyz",
  "patientName": "John Doe",
  "lastMessageText": "Hello doctor",
  "lastMessageSender": "patient",
  "lastMessageAt": Timestamp(1702374600),
  "unreadForClinic": 1,
  "unreadForPatient": 0,
  "createdAt": Timestamp(1702374600)
}
```

---

## 2️⃣ Clinic Opens Messages Inbox

### Code Path: `app/clinic/messages.tsx` → `useEffect`

```typescript
useEffect(() => {
  // ... auth checks ...
  
  // Query threads for this clinic
  const q = query(
    collection(db, 'threads'),
    where('clinicId', '==', clinicId),        // Filter by clinic
    orderBy('lastMessageAt', 'desc')          // Newest first
  );

  // Subscribe to real-time updates
  const unsub = onSnapshot(q, (snapshot) => {
    const docs: Thread[] = snapshot.docs.map((d) => {
      const data = d.data() as any;
      return {
        id: d.id,                             // 'clinic-abc_patient-xyz'
        patientId: data.patientId,
        patientName: data.patientName,        // 'John Doe'
        lastMessageText: data.lastMessageText, // 'Hello doctor'
        lastMessageSender: data.lastMessageSender,
        lastMessageAt: data.lastMessageAt,
        unreadForClinic: data.unreadForClinic,  // 1
        unreadForPatient: data.unreadForPatient,
      };
    });
    setThreads(docs);
  });

  return () => unsub();
}, [clinicId, authLoading]);
```

### What Renders in UI:

```typescript
const renderThread = ({ item }: { item: Thread }) => {
  const hasUnread = item.unreadForClinic > 0;  // true (=== 1)
  const messagePreview = item.lastMessageText.substring(0, 50); // 'Hello doctor'

  return (
    <TouchableOpacity
      style={[styles.threadItem, hasUnread && styles.threadItemUnread]}
      onPress={() => handleThreadPress(item)}
    >
      <View style={styles.threadContent}>
        <Text style={styles.patientName}>{item.patientName}</Text>
        {/* Shows: "John Doe" */}
        <Text style={styles.messagePreview} numberOfLines={1}>
          {item.lastMessageSender === 'clinic' ? 'You: ' : ''}{messagePreview}
        </Text>
        {/* Shows: "Hello doctor" (no "You:" prefix) */}
        <Text style={styles.timeText}>{formatTime(item.lastMessageAt)}</Text>
        {/* Shows: "2h" or "1d" etc */}
      </View>

      {hasUnread && (
        <View style={styles.unreadBadge} />  {/* Blue dot appears! */}
      )}
    </TouchableOpacity>
  );
};
```

### UI Output:
```
┌─────────────────────────────────────────┐
│ John Doe                          ● (blue)
│ Hello doctor                         2h
└─────────────────────────────────────────┘
```

---

## 3️⃣ Clinic Taps Thread

### Code Path: `app/clinic/messages.tsx` → `handleThreadPress()`

```typescript
const handleThreadPress = async (thread: Thread) => {
  // STEP 1: Mark as read BEFORE navigating
  await markThreadReadForClinic(clinicId!, thread.patientId);
  
  // STEP 2: Navigate to chat with tab=chat parameter
  router.push(`/clinic/${thread.patientId}?tab=chat`);
};
```

### In `markThreadReadForClinic()`:

```typescript
export async function markThreadReadForClinic(clinicId: string, patientId: string) {
  try {
    const threadId = `${clinicId}_${patientId}`;
    const threadRef = doc(db, 'threads', threadId);
    
    await updateDoc(threadRef, { 
      unreadForClinic: 0  // Reset from 1 to 0
    });
  } catch (err) {
    console.error('markThreadReadForClinic error:', err);
  }
}
```

### What `router.push()` Does:

Navigates to: `/clinic/patient-xyz?tab=chat`

---

## 4️⃣ Chat Screen Opens with Auto-Select Tab

### Code Path: `app/clinic/[patientId].tsx` → Initialization

```typescript
export default function PatientDetails() {
  // Read URL parameters
  const { patientId, tab: tabParam } = useLocalSearchParams();
  
  // Set initial tab based on URL param
  const [tab, setTab] = useState<'timeline' | 'chat'>(
    (tabParam as any) === 'chat' ? 'chat' : 'timeline'  // 'chat' is selected!
  );

  // Auto-read when chat tab is opened
  useEffect(() => {
    if (tab === 'chat' && clinicId) {
      markThreadReadForClinic(clinicId, patientId as string);
    }
  }, [tab, clinicId, patientId]);

  return (
    <View>
      <TabHeader
        tabs={[
          { key: 'timeline', label: 'Timeline' },
          { key: 'chat', label: 'Chat' },  // This one is active
        ]}
        activeTab={tab}  // 'chat'
        onTabChange={(k: string) => setTab(k as 'timeline' | 'chat')}
      />

      {tab === 'chat' && (
        <>
          {/* Chat UI renders here */}
          <FlatList data={messages} /* ... */ />
          {/* Message input */}
        </>
      )}
    </View>
  );
}
```

### Firestore Update:

**Document:** `threads/clinic-abc_patient-xyz`
```json
{
  // ... other fields ...
  "unreadForClinic": 0  // Reset from 1 to 0!
}
```

### Result:
- Blue dot disappears from inbox
- Chat tab is selected and visible
- Message history shows for patient

---

## 5️⃣ Clinic Sends Message

### Code Path: `app/clinic/[patientId].tsx` → `sendClinicMessage()`

```typescript
const sendClinicMessage = async () => {
  const text = msgText.trim();
  if (!text || !patientId) return;
  setMsgText('');
  
  // STEP 1: Write message to messages collection
  await addDoc(collection(db, `patients/${patientId}/messages`), {
    from: 'clinic',
    text,
    createdAt: Date.now(),
  });

  // STEP 2: Update thread
  if (clinicId && patient) {
    await updateThreadOnMessage(
      clinicId,
      patientId as string,
      patient.name,
      text,
      'clinic'  // Sender type is 'clinic'
    );
  }
};
```

### What Happens in Thread:

```typescript
// In updateThreadOnMessage with senderType='clinic':
await updateDoc(threadRef, {
  lastMessageText: "Your teeth look good!",
  lastMessageSender: 'clinic',
  lastMessageAt: serverTimestamp(),
  unreadForPatient: increment(1),  // Patient now has unread!
});
```

### Firestore Result:

**Document:** `threads/clinic-abc_patient-xyz`
```json
{
  // ... other fields ...
  "lastMessageText": "Your teeth look good!",
  "lastMessageSender": "clinic",
  "lastMessageAt": Timestamp(1702374700),
  "unreadForClinic": 0,
  "unreadForPatient": 1  // Incremented!
}
```

---

## 6️⃣ Patient Opens Chat (Reverse Flow)

### Code Path: `app/patient/[patientId].tsx` → Chat Opens

```typescript
// When patient opens chat tab
useEffect(() => {
  if (tab === 'chat' && authenticatedPatientId && patient) {
    markThreadReadForPatient(patient.clinicId, authenticatedPatientId);
  }
}, [tab, authenticatedPatientId, patient]);
```

### In `markThreadReadForPatient()`:

```typescript
export async function markThreadReadForPatient(clinicId: string, patientId: string) {
  try {
    const threadId = `${clinicId}_${patientId}`;
    const threadRef = doc(db, 'threads', threadId);
    
    await updateDoc(threadRef, { 
      unreadForPatient: 0  // Reset from 1 to 0
    });
  } catch (err) {
    console.error('markThreadReadForPatient error:', err);
  }
}
```

### Final Firestore State:

**Document:** `threads/clinic-abc_patient-xyz`
```json
{
  "clinicId": "clinic-abc",
  "patientId": "patient-xyz",
  "patientName": "John Doe",
  "lastMessageText": "Your teeth look good!",
  "lastMessageSender": "clinic",
  "lastMessageAt": Timestamp(1702374700),
  "unreadForClinic": 0,          // Clinic read
  "unreadForPatient": 0,         // Patient read
  "createdAt": Timestamp(1702374600)
}
```

---

## 📊 Summary State Machine

```
Initial (No thread)
    ↓
Patient sends message
    ↓
Thread created: unreadForClinic=1, unreadForPatient=0
    ↓
Clinic opens messages → blue dot shows
    ↓
Clinic taps thread → markThreadReadForClinic() → unreadForClinic=0
    ↓
Blue dot disappears, chat tab opens
    ↓
Clinic sends message → unreadForPatient=1
    ↓
Patient opens chat → markThreadReadForPatient() → unreadForPatient=0
    ↓
Both read: unreadForClinic=0, unreadForPatient=0
```

---

## 🔑 Key Points

1. **Thread ID:** `${clinicId}_${patientId}` (deterministic, no duplicates)
2. **Unread Logic:** 
   - Increments on message send
   - Resets to 0 when recipient opens chat
3. **Blue Dot:** Shows only when `unreadForClinic > 0` for clinic inbox
4. **Auto-Tab:** `?tab=chat` parameter auto-selects chat tab
5. **Both Collections Updated:** Messages AND threads both updated on send
6. **No Cloud Functions:** All logic is client-side

