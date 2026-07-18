/**
 * ═══════════════════════════════════════════════════════════════════
 *  testUpdateDoctorPassword.js — Phase 4.4-b verification
 *
 *  ⚠ EMULATOR-ONLY. NEVER RUN AGAINST PRODUCTION.
 *
 *  Safety is STRUCTURAL: the three connect*Emulator calls below
 *  redirect ALL Firebase traffic to 127.0.0.1. Reaching production
 *  becomes impossible by construction. If the emulator is down, calls
 *  fail with ECONNREFUSED — a safe failure. DO NOT REMOVE OR WEAKEN
 *  those connect calls; they ARE the safety model.
 *
 *  What this proves:
 *    1. UNAUTH — no auth → unauthenticated.
 *    2. NON-OWNER — signed in as a doctor → permission-denied.
 *    3. CROSS-TENANT — owner A tries to reset a doctor in clinic B → not-found.
 *       ← the critical security check.
 *    4. HAPPY — owner resets their own doctor's password → { ok: true }, and
 *       signing in as that doctor with the NEW password succeeds.
 *    5. BAD INPUT — missing uid or password<6 → invalid-argument (2 sub-checks).
 *    6. NO-AUTH-ACCOUNT — uid with a member doc but no Auth user → not-found.
 * ═══════════════════════════════════════════════════════════════════
 */

const { initializeApp } = require('firebase/app');
const {
  getAuth,
  connectAuthEmulator,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  getIdToken,
} = require('firebase/auth');
const {
  getFirestore,
  connectFirestoreEmulator,
  collection,
  addDoc,
  doc,
  setDoc,
} = require('firebase/firestore');
const {
  getFunctions,
  connectFunctionsEmulator,
  httpsCallable,
} = require('firebase/functions');

const firebaseConfig = {
  apiKey: 'AIzaSyCyei5KZ_ROWZfBbMClSY02tgVHgtGblag',
  projectId: 'dental-jawad',
};

const AUTH_HOST = 'http://127.0.0.1:9099';
const FIRESTORE_HOST = '127.0.0.1';
const FIRESTORE_PORT = 8080;
const FUNCTIONS_HOST = '127.0.0.1';
const FUNCTIONS_PORT = 5001;

console.log('╔══════════════════════════════════════════════════════════════════╗');
console.log('║  testUpdateDoctorPassword — EMULATOR-ONLY                        ║');
console.log(`║  Auth emulator:      ${AUTH_HOST.padEnd(43)}║`);
console.log(`║  Firestore emulator: ${FIRESTORE_HOST}:${FIRESTORE_PORT}${' '.repeat(43 - `${FIRESTORE_HOST}:${FIRESTORE_PORT}`.length)}║`);
console.log(`║  Functions emulator: ${FUNCTIONS_HOST}:${FUNCTIONS_PORT}${' '.repeat(43 - `${FUNCTIONS_HOST}:${FUNCTIONS_PORT}`.length)}║`);
console.log(`║  Project namespace:  ${firebaseConfig.projectId.padEnd(43)}║`);
console.log('╚══════════════════════════════════════════════════════════════════╝');

const app = initializeApp(firebaseConfig, 'update-doctor-password-test');
const auth = getAuth(app);
const db = getFirestore(app);
const functions = getFunctions(app);

connectAuthEmulator(auth, AUTH_HOST, { disableWarnings: true });
connectFirestoreEmulator(db, FIRESTORE_HOST, FIRESTORE_PORT);
connectFunctionsEmulator(functions, FUNCTIONS_HOST, FUNCTIONS_PORT);

const assignOwnerClaims = httpsCallable(functions, 'assignOwnerClaims');
const createDoctorAccount = httpsCallable(functions, 'createDoctorAccount');
const updateDoctorPassword = httpsCallable(functions, 'updateDoctorPassword');

const RUN_ID = Date.now();
function emailFor(tag) {
  return `${tag}-${RUN_ID}@update-doctor-password-test.local`;
}
const OWNER_PASSWORD = 'test-owner-1234';
const DOCTOR_PASSWORD = 'test-doctor-1234';
const NEW_DOCTOR_PASSWORD = 'new-doctor-9999';

const results = [];
function record(name, passed, reason) {
  results.push({ name, passed, reason });
  const tag = passed ? 'PASS' : 'FAIL';
  console.log(`  [${tag}] ${name} — ${reason}`);
}

async function createOwnerWithClinic(tag) {
  const email = emailFor(tag);
  const cred = await createUserWithEmailAndPassword(auth, email, OWNER_PASSWORD);
  const uid = cred.user.uid;
  await addDoc(collection(db, 'clinics'), {
    ownerUid: uid,
    subscribed: false,
    status: 'pending_subscription',
    createdAt: Date.now(),
  });
  const result = await assignOwnerClaims({});
  const clinicId = result?.data?.clinicId;
  await getIdToken(cred.user, true);
  return { email, password: OWNER_PASSWORD, user: cred.user, uid, clinicId };
}

async function signInAsOwner(owner) {
  await signOut(auth);
  const cred = await signInWithEmailAndPassword(auth, owner.email, owner.password);
  await getIdToken(cred.user, true);
  owner.user = cred.user;
}

(async () => {
  console.log('');
  console.log('  Running checks...');
  console.log('');

  let ownerA = null;
  let ownerB = null;
  let doctorAEmail = null;
  let doctorAUid = null;
  let doctorBUid = null;

  // ── SETUP: two owners (A and B) each with their own clinic + doctor ──
  try {
    ownerA = await createOwnerWithClinic('ownerA');
    console.log(`  [setup] ownerA uid=${ownerA.uid} clinicId=${ownerA.clinicId}`);
    doctorAEmail = emailFor('docA');
    const resA = await createDoctorAccount({ email: doctorAEmail, password: DOCTOR_PASSWORD });
    doctorAUid = resA?.data?.memberId;
    console.log(`  [setup] doctorA uid=${doctorAUid} in ownerA's clinic`);

    await signOut(auth);
    ownerB = await createOwnerWithClinic('ownerB');
    console.log(`  [setup] ownerB uid=${ownerB.uid} clinicId=${ownerB.clinicId}`);
    const doctorBEmail = emailFor('docB');
    const resB = await createDoctorAccount({ email: doctorBEmail, password: DOCTOR_PASSWORD });
    doctorBUid = resB?.data?.memberId;
    console.log(`  [setup] doctorB uid=${doctorBUid} in ownerB's clinic`);
  } catch (err) {
    console.error('  FATAL setup:', err.code || '', err.message);
    console.error('  If this is ECONNREFUSED, the emulator is not running.');
    process.exit(1);
  }

  // ── CHECK 1 — UNAUTH ─────────────────────────────────────────────
  {
    const name = 'CHECK 1 — unauthenticated → unauthenticated';
    try {
      await signOut(auth);
      await updateDoctorPassword({ uid: doctorAUid, password: NEW_DOCTOR_PASSWORD });
      record(name, false, 'call succeeded, expected rejection');
    } catch (err) {
      const code = err.code || '(no code)';
      const matches = /unauthenticated/.test(code);
      record(name, matches, `actual code = ${code}${matches ? '' : ' (expected …unauthenticated)'}`);
    }
  }

  // ── CHECK 2 — NON-OWNER (doctor) ─────────────────────────────────
  {
    const name = 'CHECK 2 — non-owner (doctor) → permission-denied';
    try {
      await signOut(auth);
      const docCred = await signInWithEmailAndPassword(auth, doctorAEmail, DOCTOR_PASSWORD);
      await getIdToken(docCred.user, true);
      await updateDoctorPassword({ uid: doctorAUid, password: NEW_DOCTOR_PASSWORD });
      record(name, false, 'call succeeded, expected rejection');
    } catch (err) {
      const code = err.code || '(no code)';
      const matches = /permission-denied/.test(code);
      record(name, matches, `actual code = ${code}${matches ? '' : ' (expected …permission-denied)'}`);
    }
  }

  // ── CHECK 3 — CROSS-TENANT: ownerB tries to reset doctorA ────────
  {
    const name = 'CHECK 3 — ⚠ ATTACK: cross-tenant reset must be blocked';
    try {
      await signInAsOwner(ownerB);
      await updateDoctorPassword({ uid: doctorAUid, password: 'attacker-value' });
      console.error('');
      console.error('  ╔══════════════════════════════════════════════════════════════╗');
      console.error('  ║  ⚠⚠⚠ CATASTROPHIC SECURITY FAILURE ⚠⚠⚠                      ║');
      console.error('  ║  Owner B reset Owner A\'s doctor. Cross-tenant isolation      ║');
      console.error('  ║  is BROKEN. DO NOT DEPLOY.                                    ║');
      console.error('  ╚══════════════════════════════════════════════════════════════╝');
      console.error('');
      record(name, false, 'cross-tenant reset SUCCEEDED — seizure worked');
    } catch (err) {
      const code = err.code || '(no code)';
      const matches = /not-found/.test(code);
      record(name, matches, `actual code = ${code}${matches ? '' : ' (expected …not-found — guard blocks it)'}`);
    }
  }

  // ── CHECK 4 — HAPPY: ownerA resets doctorA + doctor logs in with new pw ──
  {
    const name = 'CHECK 4 — happy path: owner resets doctor pw, doctor signs in with NEW pw';
    try {
      await signInAsOwner(ownerA);
      const res = await updateDoctorPassword({ uid: doctorAUid, password: NEW_DOCTOR_PASSWORD });
      const ok = res?.data?.ok === true;
      if (!ok) throw new Error(`unexpected response: ${JSON.stringify(res?.data)}`);

      await signOut(auth);
      const docCred = await signInWithEmailAndPassword(auth, doctorAEmail, NEW_DOCTOR_PASSWORD);
      if (docCred.user.uid !== doctorAUid) throw new Error(`uid mismatch: ${docCred.user.uid} != ${doctorAUid}`);
      record(name, true, `ok=true, doctor signed in with new password (uid=${doctorAUid})`);
    } catch (err) {
      record(name, false, `threw ${err.code || ''} ${err.message}`);
    }
  }

  // Re-sign in as ownerA for remaining checks
  try {
    await signInAsOwner(ownerA);
  } catch (err) {
    console.error('  FATAL: could not re-sign-in as ownerA —', err.code || '', err.message);
    process.exit(1);
  }

  // ── CHECK 5a — BAD INPUT: missing uid ────────────────────────────
  {
    const name = 'CHECK 5a — missing uid → invalid-argument';
    try {
      await updateDoctorPassword({ password: NEW_DOCTOR_PASSWORD });
      record(name, false, 'call succeeded, expected rejection');
    } catch (err) {
      const code = err.code || '(no code)';
      const matches = /invalid-argument/.test(code);
      record(name, matches, `actual code = ${code}${matches ? '' : ' (expected …invalid-argument)'}`);
    }
  }

  // ── CHECK 5b — BAD INPUT: password too short ─────────────────────
  {
    const name = 'CHECK 5b — password < 6 chars → invalid-argument';
    try {
      await updateDoctorPassword({ uid: doctorAUid, password: 'abc' });
      record(name, false, 'call succeeded, expected rejection');
    } catch (err) {
      const code = err.code || '(no code)';
      const matches = /invalid-argument/.test(code);
      record(name, matches, `actual code = ${code}${matches ? '' : ' (expected …invalid-argument)'}`);
    }
  }

  // ── CHECK 6 — NO-AUTH-ACCOUNT: member doc exists but no Auth user ──
  {
    const name = 'CHECK 6 — member doc without Auth user → not-found';
    try {
      const orphanUid = `orphan-${RUN_ID}`;
      // Write a doctor member doc for ownerA's clinic, but no Auth user with this uid.
      await setDoc(doc(db, `clinics/${ownerA.clinicId}/members/${orphanUid}`), {
        id: orphanUid,
        clinicId: ownerA.clinicId,
        displayName: 'Orphan',
        email: emailFor('orphan'),
        role: 'doctor',
        status: 'ACTIVE',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      await updateDoctorPassword({ uid: orphanUid, password: NEW_DOCTOR_PASSWORD });
      record(name, false, 'call succeeded, expected rejection');
    } catch (err) {
      const code = err.code || '(no code)';
      const matches = /not-found/.test(code);
      record(name, matches, `actual code = ${code}${matches ? '' : ' (expected …not-found)'}`);
    }
  }

  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  console.log('');
  console.log('  ═══════════════════════════════════════════════════════════════');
  console.log(`  Summary: ${passed}/${total} passed`);
  console.log(passed === total ? '  ALL PASS' : '  SOME FAILED');
  console.log('  ═══════════════════════════════════════════════════════════════');

  const attack = results.find(r => r.name.startsWith('CHECK 3'));
  if (attack && !attack.passed) {
    console.log('');
    console.log('  ⚠ CHECK 3 (the cross-tenant attack) FAILED — the function is NOT SAFE.');
  }

  process.exit(passed === total ? 0 : 1);
})();
