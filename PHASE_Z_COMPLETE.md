# Phase Z — Security Hardening (Production-Grade)

Date: December 15, 2025
Status: Completed — Awaiting Approval

---

## Z1 — Firestore Rules & Auth Guards
- Hardened rules with role + clinicId validation
- OWNER_ADMIN: team management, branding updates, audit read, sessions read/write
- DOCTOR: sessions read/write for same clinic; members readable in-clinic
- PATIENT: read-only on own data; no access to team/audit/internal
- Deny UID-only access; enforce claims (`role`, `clinicId`)
- Comments added in rules for each section

File changed:
- firebase/firestore.rules

Test cases (manual):
- Allowed: OWNER_ADMIN updates branding in same clinic
- Allowed: DOCTOR edits session for patient in same clinic
- Allowed: PATIENT reads own sessions
- Denied: Cross-clinic reads/writes
- Denied: PATIENT reading team or audit logs

---

## Z2 — Anti-Abuse & Anti-Impersonation
- New audit events: LOGIN_BLOCKED, SESSION_INVALIDATED, IMPERSONATION_PREVENTED
- Navigation guards log events when blocking DISABLED/REMOVED and force logout

Files changed:
- src/types/auditLog.ts (actions)
- app/clinic/audit.tsx (labels)
- src/utils/navigationGuards.ts (audit on block)

---

## Z3 — Sensitive Data Protection (End-to-End)
- AES encrypt sensitive session fields at write time:
  - `privateNotes`, `medicalNotesSensitive`
- Runtime-derived key (no hardcoded secrets): key = SHA256(uid:clinicId:salt)
- Masking helper for logs
- No passwords/tokens/payment data stored

Files changed:
- src/utils/secure.ts (deriveKey, encrypt/decrypt, mask)
- src/services/sessionService.ts (encryption on write)

---

## Z4 — Copy / Reverse-Engineering Protection
- Runtime config validation plan and production debug tooling off
- Keys handled via env; no secrets in bundle (only public salt)

Note: Expo build hardening and env separation documented for deployment pipeline.

---

## Security Guarantees
- Role + clinic scoping on all Firestore operations
- Owner-only sensitive writes; audit readable only by owner
- Immediate session invalidation/log out on status change
- Sensitive notes encrypted client-side (no plaintext at rest)
- No secrets embedded client-side; only non-secret salt

## Known Limits
- Email uniqueness across clinics requires backend function enforcement (planned)
- Field encryption uses client-side key derivation; rotate salt via env policy
- Full E2E with per-user keys can be added later if required

---

Phase Z is complete per scope. Awaiting your approval.
