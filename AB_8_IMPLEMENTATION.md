# AB-8 Implementation

Date: 2025-12-15

## AB-8.1 Patient Account Creation (Doctor/Owner)
- Added Cloud Function endpoint: `POST /createPatientUser` in `functions/index.js`.
  - Creates Firebase Auth user with email + optional temp password.
  - Sets custom claims: `{ role: 'patient', clinicId, patientId, mustChangePassword: true }`.
  - Writes `users/{uid}` doc and links `patients/{patientId}.userId = uid`.
- Client service: `src/services/patientAccounts.ts` with `createPatientUser()`.
- Clinic-side UI: `app/clinic/[patientId].tsx` form under quick actions for Owner/Doctor to input email and optional temp password.

Notes:
- The temp password is generated if not provided.
- First-login password change is enforced via `mustChangePassword` claim (client enforcement to be handled on login screens in a later step if needed).

## AB-8.2 Patient Timeline Clarity
- Enhanced patient session timeline in `app/patient/[patientId].tsx`:
  - Clear headers: type + date.
  - Added read-only "Doctor Notes" section when `dentistNotes` exists.
  - Preserved existing flows; UI-only changes.

## Compilation
- Functions and app compile with existing known typing warning in `app/clinic/[patientId].tsx` (FlatList `ref`). This warning predates AB-8 and remains out of scope.

Status: Implemented. Paused for review.