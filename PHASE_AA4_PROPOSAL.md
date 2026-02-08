# Phase AA-4: Advanced Dental-Specific Features
## Proposal & Sub-Phase Breakdown

**Status:** AWAITING APPROVAL  
**Date:** December 15, 2025  
**Scope:** Advanced dental features + daily doctor workflow efficiency  

---

## Phase AA-4 Overview

Building on the productivity foundation of AA-3, Phase AA-4 introduces advanced dental-specific features that streamline the daily doctor workflow by providing intelligent tools for patient management, session planning, and clinical insights.

### Design Principles
- **Doctor-Centric:** Features designed for daily clinical use
- **Non-Blocking:** No payments, no monetization gates
- **Role-Safe:** Existing role guards maintained
- **Audit-Ready:** All actions logged via existing audit system
- **Performance:** One-time queries where possible, minimal listeners

### Out of Scope
- ❌ Payments or monetization
- ❌ Security rule changes (unless explicitly requested)
- ❌ Authentication changes
- ❌ Firestore schema expansion
- ❌ New backend functions

---

## Proposed Sub-Phases (AA-4.1 through AA-4.5)

### **AA-4.1: Patient Health Notes & Medical History** 🏥
**Purpose:** Quick access to patient medical context during sessions

**Features:**
1. **Patient Medical Profile Card**
   - Allergies (expandable list)
   - Regular medications
   - Dental history summary (# of sessions, last visit)
   - Age/gender/notes
   - Display on patient detail view (new tab or collapsed section)

2. **Quick Medical Summary**
   - One-line summary: "Allergies: Penicillin | Meds: Aspirin | Last Visit: 3 days ago"
   - Visible in patient list header for quick scanning
   - Color-coded alert icons (red for critical allergies)

**Data Model:**
- Uses existing patient document fields (already stores name, age, gender, notes, medication, allergies, allergyDetails)
- No new Firestore collections
- Display-only (read from existing data)

**Impact on Workflow:**
- Doctor sees allergies/meds at a glance during session
- Prevents dangerous drug interactions
- Reduces need to search for patient history

**Estimated Complexity:** Low (data already exists, UI only)

---

### **AA-4.2: Session Templates & Quick Type Selection** ⚡
**Purpose:** Accelerate session creation with pre-configured templates

**Features:**
1. **Dental Session Templates**
   - Pre-defined types with descriptions:
     - Cleaning (Prophylaxis)
     - Exam & Consultation
     - Filling/Restoration
     - Root Canal Therapy
     - Crown/Bridge Prep
     - Extraction
     - Whitening
     - Emergency
     - Follow-up
   - Show as grid/list on session creation screen

2. **One-Tap Session Creation**
   - Tap template → Auto-populate type
   - Pre-filled description template (editable)
   - Faster than typing each time

3. **Custom Templates**
   - Owner-admin can add custom templates per clinic
   - Stored in clinic settings (new sub-collection: clinics/{clinicId}/templates)
   - Available to all doctors in clinic

**Data Model:**
- New: `clinics/{clinicId}/templates` sub-collection
- Fields: `id, name, description, category, createdBy, createdAt`
- Default templates seeded on first use

**Impact on Workflow:**
- Session creation 50% faster
- Consistent session naming across clinic
- Reduces data entry errors

**Estimated Complexity:** Medium (new collection, UI integration)

---

### **AA-4.3: Session Status Dashboard** 📊
**Purpose:** Real-time overview of today's and upcoming sessions

**Features:**
1. **Today's Sessions View**
   - New tab in clinic dashboard
   - Shows: Patient name, session time, type, status (pending/completed/edited)
   - Color-coded: Green (done), Yellow (in-progress), Gray (pending)
   - Tap to open session details
   - Pull-to-refresh

2. **Session Status Indicators**
   - Status field on each session (pending → in-progress → completed)
   - Doctor can update status with one tap
   - Timestamp recorded for each status change (via SESSION_STATUS_CHANGED audit)

3. **Statistics Card**
   - Total sessions today
   - Completed count
   - In-progress count
   - Pending count
   - Progress bar

**Data Model:**
- Add `status` field to Session: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED'
- Add `statusUpdatedAt` timestamp
- Use existing SESSION_EDITED audit, add SESSION_STATUS_CHANGED action

**Impact on Workflow:**
- Doctor knows workload at a glance
- Can prioritize sessions
- Track productivity throughout day

**Estimated Complexity:** Medium (new field, status management, UI)

---

### **AA-4.4: Patient Appointment Scheduler** 📅
**Purpose:** Simple appointment management for scheduling follow-ups

**Features:**
1. **Appointment List**
   - New screen: `/clinic/appointments`
   - Shows upcoming appointments (next 30 days)
   - Sortable by date, patient, status

2. **Quick Scheduling**
   - Button in patient detail view: "Schedule Next Visit"
   - Modal: Pick date + session type
   - Appointment stored in new `appointments` collection
   - Confirmation sent (audit logged)

3. **Appointment Reminders**
   - Upcoming appointments badge on clinic dashboard
   - Count of appointments in next 7 days
   - Visual indicator if overdue

4. **Appointment Status**
   - Status: scheduled, completed, cancelled
   - Doctor can mark completed or cancel
   - Links to session when completed

**Data Model:**
- New: `patients/{patientId}/appointments` sub-collection
- Fields: `id, clinicId, patientId, patientName, appointmentDate, sessionType, notes, status, createdAt, createdBy, completedAt`

**Impact on Workflow:**
- Reduces manual scheduling overhead
- Helps with patient retention (follow-up reminders)
- Integrates with session workflow

**Estimated Complexity:** Medium-High (new collection, calendar UI, status tracking)

---

### **AA-4.5: Session Notes & Observations** 📝
**Purpose:** Quick clinical notes during sessions for future reference

**Features:**
1. **Session Notes Section**
   - New tab in session detail view: "Notes & Observations"
   - Text area to add/edit notes
   - Markdown support (bold, lists, links)
   - Auto-save drafts

2. **Observation Tags**
   - Pre-defined clinical tags:
     - Follow-up required
     - Patient education given
     - Complications noted
     - Referral recommended
     - Good healing progress
   - Click to add tags (multi-select)

3. **Notes Timeline**
   - Show all note edits with timestamps
   - Read-only history (for audit trail)
   - Doctor name who edited

4. **Quick Observations**
   - Common observations as buttons: "Healing good", "Infection present", "Tooth sensitivity", "Medication recommended"
   - One-tap to add + auto-populate note template

**Data Model:**
- Add `notes: string` field to Session
- Add `observations: string[]` array to Session
- Add `notesUpdatedAt` timestamp
- Use SESSION_EDITED audit (notes change)

**Impact on Workflow:**
- Clinical documentation faster
- Better continuity of care
- Easier follow-up planning

**Estimated Complexity:** Low-Medium (new fields, rich text editor)

---

## Sub-Phase Dependencies & Sequencing

```
AA-4.1: Patient Health Notes
├─ No dependencies
└─ Can start immediately

AA-4.2: Session Templates
├─ Depends on: None
└─ Can start immediately (after AA-4.1 approval)

AA-4.3: Session Status Dashboard
├─ Depends on: Session model update
└─ Should follow AA-4.2 (session types integrated)

AA-4.4: Patient Appointment Scheduler
├─ Depends on: Patient + Session models
└─ Should follow AA-4.3 (status tracking useful for appointments)

AA-4.5: Session Notes & Observations
├─ Depends on: Session model update
└─ Can follow AA-4.1 or run parallel with AA-4.3
```

### **Recommended Execution Order:**
1. **AA-4.1** (Patient Health Notes) - Low risk, high value
2. **AA-4.2** (Session Templates) - Quick win, improves UX
3. **AA-4.3** (Session Status Dashboard) - Core workflow feature
4. **AA-4.5** (Session Notes) - Documentation feature
5. **AA-4.4** (Appointment Scheduler) - Most complex, good final piece

---

## Constraints & Guardrails

### Data Model
- ❌ No new top-level Firestore collections (all under existing docs)
- ❌ No changes to existing document fields without migration plan
- ✅ Add optional fields to Session, Patient, Clinic
- ✅ Create sub-collections under existing docs

### Performance
- ✅ One-time queries for today's sessions
- ✅ Local filtering and sorting
- ⚠️ Appointment scheduler may use pagination (manage carefully)
- ❌ No new real-time listeners without explicit approval

### Security & Audit
- ✅ Maintain existing role guards (DOCTOR, OWNER_ADMIN)
- ✅ Log all status changes and note edits via audit
- ✅ No changes to Firestore security rules
- ❌ No new auth requirements

### Monetization
- ❌ None of these features trigger payment gates
- ❌ All features available to trial + active clinics
- ✅ Usage stats can track (optional) but not block

---

## Estimated Effort & Timeline

| Sub-Phase | Complexity | Estimated Time | Files Modified |
|-----------|-----------|-----------------|-----------------|
| AA-4.1 | Low | 30-45 min | 3-4 |
| AA-4.2 | Medium | 1.5-2 hrs | 5-6 |
| AA-4.3 | Medium | 1.5-2 hrs | 6-8 |
| AA-4.4 | Medium-High | 2-3 hrs | 8-10 |
| AA-4.5 | Low-Medium | 1-1.5 hrs | 4-5 |
| **AA-4 Total** | **Medium** | **~7-9 hrs** | **~30 files** |

---

## Global Rules Compliance

✅ **No New Payments:** All features are info/management only
✅ **No Auth Changes:** Existing role guards maintained
✅ **No Breaking Changes:** All additions are optional fields
✅ **Type Safe:** All new types defined upfront
✅ **Audit Trail:** All status/note changes logged
✅ **Performance:** Optimized queries, minimal listeners
✅ **Role Safe:** Doctors see only their data, owners see clinic-wide
✅ **Backward Compatible:** Existing functionality unchanged

---

## Next Steps

### For User Approval:
1. **Review** this breakdown
2. **Approve/Modify** sub-phases (remove, reorder, adjust scope)
3. **Prioritize** which sub-phases to implement
4. **Clarify** any specific requirements or constraints

### Upon Approval:
1. Create detailed spec for each approved sub-phase
2. Begin implementation in approved sequence
3. Comprehensive testing for each sub-phase
4. Final verification before Phase AA-5

---

## Questions for User

Before proceeding, clarify:

1. **Priority:** Which sub-phases are highest priority?
2. **Scope:** Any features you'd like to add or remove?
3. **Constraints:** Any additional guardrails beyond listed?
4. **Timeline:** Preferred completion timeline?
5. **Testing:** Any specific test scenarios you want covered?

---

**Status: ⏸️ AWAITING APPROVAL**

Please review this breakdown and let me know:
- ✅ Approve all sub-phases as-is
- 📝 Request modifications to specific sub-phases
- ❌ Remove sub-phases you don't want
- ➕ Add new sub-phases you'd like included
- 🎯 Confirm prioritization order

Once approved, I will proceed with detailed specifications and implementation for each sub-phase in sequence.
