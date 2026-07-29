# BeSmile AI — Security Rules Launch Checklist (Phase 6 activation)

Status: rules are DRAFTED and TESTED in isolation. Live rules remain OPEN for
development. This checklist activates them at go-live. Nothing is deployed until
the final step, which requires explicit owner approval.

## Already done (committed on phase-g9-0b-3-trim)
- Patient identity: issuePatientToken callable + patientAuth/patientDb/patientStorage
  (secondary Firebase app); patient login/logout wired to a real Firebase identity,
  coexisting with the clinic session.
- Patient Firestore reads/writes routed through patientDb; on-mount reads gated on
  usePatientAuthReady (no permission-denied race).
- Clinic-restore fallback claim-gated to owners.
- Firestore rules candidate: firebase/firestore.rules.candidate — scripts/testFirestoreRules.js
  (isolated project demo-rules-test): 53/53 (doc + query, incl. login query + cross-tenant).
- Storage rules candidate: firebase/storage.rules.candidate — scripts/testStorageRules.js
  (isolated, port 9199): 15/15.
- Live firebase/firestore.rules and firebase/storage.rules are still OPEN (dev).

## Activation steps (in order, at launch)

### 1. Wire patient storage to patientStorage
- DONE (prep): sendImageMessage already accepts an optional trailing storageInstance = storage
  (backward-compatible; default unchanged).
- REMAINING at launch: pass patientStorage as the 3rd arg in the two patient callers:
  - app/patient/conversation.tsx
  - app/patient/chat-camera.tsx
- tsc EXIT 0. Must land TOGETHER with step 2 (under locked storage rules a patient upload via
  the default storage would be denied).

### 2. Swap candidates into the live rule files
- firebase/firestore.rules.candidate -> firebase/firestore.rules
- firebase/storage.rules.candidate  -> firebase/storage.rules

### 3. MANDATORY live emulator validation under the locked rules
- Owner: signup, login, create/edit patient, create doctor, subscription screens.
- Doctor: login, patient management, chat.
- Patient: phone+code login, view record + sessions, chat send/receive text + image.
- Guest: public clinic directory + public wall load.
- Cross-tenant: clinic A actor cannot read clinic B data.

#### Onboarding bootstrap — RESOLVED in the candidate (block 6.4d); confirm live
Full timeline traced. Under the candidate rules:
- clinics/{clinicId} signup writes + confirm-subscription merge: PASS (ownerUid bootstrap disjunct).
- clinics_public/{clinicId} (published at confirm-subscription, before claims): now PASS via the
  ownsClinicDoc() bootstrap disjunct added in block 6.4d.
- clinics/{clinicId}/members/{uid} + users/{uid}: first written at LOGIN, after claims — never a gap.
Verified by the isolated suite (56 passed). Live validation only needs to confirm onboarding
end-to-end; no remaining code/rules change expected for the bootstrap.

### 4. Deploy (LIVE BOMB — explicit owner approval only)
- firebase deploy --only firestore:rules,storage:rules
- Only when going to production, and only after step 3 is fully green.

## Open items (intentionally deferred)
- media likes + users/{uid}/saved are intentionally OPEN (guest/device-keyed engagement).
- mustChangePassword is stamped for doctors but never enforced client-side (separate ticket).
- Legacy pre-claims accounts (if any in prod) will be locked out — none in the emulator.
