/**
 * ═══════════════════════════════════════════════════════════════════
 *  testCreateDoctor.js — Phase 4.1 verification
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
 *    1. HAPPY — owner calls → returns { memberId }; doctor can sign in;
 *       doctor claims are role='doctor' + clinicId=owner's clinic;
 *       user doc + member doc have NO `password` field.
 *    2. NON-OWNER (unauthenticated) → unauthenticated.
 *       NON-OWNER (signed in as the doctor) → permission-denied.
 *    3. CROSS-TENANT — bogus clinicId in data is IGNORED; the
 *       created doctor's clinicId equals the owner's clinic.
 *    4. DUP EMAIL — second call with same email → already-exists.
 *    5. BAD INPUT — empty email or password<6 → invalid-argument.
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
  getIdTokenResult,
} = require('firebase/auth');
const {
  getFirestore,
  connectFirestoreEmulator,
  collection,
  addDoc,
  doc,
  getDoc,
} = require('firebase/firestore');
const {
  getFunctions,
  connectFunctionsEmulator,
  httpsCallable,
} = require('firebase/functions');

// ── Inline config (do NOT import firebaseConfig.ts — TS + aliases) ──
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
console.log('║  testCreateDoctor — EMULATOR-ONLY                                ║');
console.log(`║  Auth emulator:      ${AUTH_HOST.padEnd(43)}║`);
console.log(`║  Firestore emulator: ${FIRESTORE_HOST}:${FIRESTORE_PORT}${' '.repeat(43 - `${FIRESTORE_HOST}:${FIRESTORE_PORT}`.length)}║`);
console.log(`║  Functions emulator: ${FUNCTIONS_HOST}:${FUNCTIONS_PORT}${' '.repeat(43 - `${FUNCTIONS_HOST}:${FUNCTIONS_PORT}`.length)}║`);
console.log(`║  Project namespace:  ${firebaseConfig.projectId.padEnd(43)}║`);
console.log('╚══════════════════════════════════════════════════════════════════╝');

const app = initializeApp(firebaseConfig, 'create-doctor-test');
const auth = getAuth(app);
const db = getFirestore(app);
const functions = getFunctions(app);

// ── The safety model — these three calls must run BEFORE any other IO
connectAuthEmulator(auth, AUTH_HOST, { disableWarnings: true });
connectFirestoreEmulator(db, FIRESTORE_HOST, FIRESTORE_PORT);
connectFunctionsEmulator(functions, FUNCTIONS_HOST, FUNCTIONS_PORT);

const assignOwnerClaims = httpsCallable(functions, 'assignOwnerClaims');
const createDoctorAccount = httpsCallable(functions, 'createDoctorAccount');

// ── Helpers ─────────────────────────────────────────────────────────
const RUN_ID = Date.now();
function emailFor(tag) {
  return `${tag}-${RUN_ID}@create-doctor-test.local`;
}
const OWNER_PASSWORD = 'test-owner-1234';
const DOCTOR_PASSWORD = 'test-doctor-1234';

const results = [];
function record(name, passed, reason) {
  results.push({ name, passed, reason });
  const tag = passed ? 'PASS' : 'FAIL';
  console.log(`  [${tag}] ${name} — ${reason}`);
}

async function refreshedClaims(user) {
  await getIdToken(user, true);
  const tokenResult = await getIdTokenResult(user, true);
  return tokenResult.claims;
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
  await getIdToken(cred.user, true); // refresh token so claims land
  return { email, password: OWNER_PASSWORD, user: cred.user, uid, clinicId };
}

// ── Main ────────────────────────────────────────────────────────────
(async () => {
  console.log('');
  console.log('  Running checks...');
  console.log('');

  let owner = null;
  let doctorEmail = null;
  let doctorUid = null;

  // ── SETUP: create owner A with claims ─────────────────────────────
  try {
    owner = await createOwnerWithClinic('owner');
    console.log(`  [setup] owner uid=${owner.uid} clinicId=${owner.clinicId}`);
  } catch (err) {
    console.error('  FATAL setup: —', err.code || '', err.message);
    console.error('  If this is ECONNREFUSED, the emulator is not running.');
    process.exit(1);
  }

  // ── CHECK 1 — HAPPY ───────────────────────────────────────────────
  {
    const name = 'CHECK 1 — happy path (owner creates doctor)';
    try {
      doctorEmail = emailFor('doc1');
      const res = await createDoctorAccount({ email: doctorEmail, password: DOCTOR_PASSWORD });
      const memberId = res?.data?.memberId;
      if (!memberId) throw new Error(`missing memberId in response: ${JSON.stringify(res?.data)}`);
      doctorUid = memberId;

      // sign in as the doctor and check claims
      await signOut(auth);
      const doctorCred = await signInWithEmailAndPassword(auth, doctorEmail, DOCTOR_PASSWORD);
      if (doctorCred.user.uid !== memberId) {
        throw new Error(`doctor uid ${doctorCred.user.uid} != memberId ${memberId}`);
      }
      const claims = await refreshedClaims(doctorCred.user);
      const claimsOk = claims.role === 'doctor' && claims.clinicId === owner.clinicId;

      // check user doc has NO password field (read while signed in as doctor)
      const userSnap = await getDoc(doc(db, 'users', memberId));
      const userData = userSnap.exists() ? userSnap.data() : null;
      const userNoPw = userData && !('password' in userData);

      // check member doc has NO password field
      const memberSnap = await getDoc(doc(db, `clinics/${owner.clinicId}/members`, memberId));
      const memberData = memberSnap.exists() ? memberSnap.data() : null;
      const memberNoPw = memberData && !('password' in memberData);

      if (claimsOk && userNoPw && memberNoPw) {
        record(name, true, `uid=${memberId} role=doctor clinicId=${owner.clinicId}; no password in either doc`);
      } else {
        record(name, false, `claimsOk=${claimsOk} userNoPw=${userNoPw} memberNoPw=${memberNoPw} claims=${JSON.stringify(claims)} userKeys=${userData ? Object.keys(userData).join(',') : '(none)'} memberKeys=${memberData ? Object.keys(memberData).join(',') : '(none)'}`);
      }
    } catch (err) {
      record(name, false, `threw ${err.code || ''} ${err.message}`);
    }
  }

  // ── CHECK 2a — signed in as the doctor, cannot create ─────────────
  {
    const name = 'CHECK 2a — non-owner (doctor) → permission-denied';
    try {
      // still signed in as the doctor from CHECK 1
      await createDoctorAccount({ email: emailFor('doc-should-fail'), password: DOCTOR_PASSWORD });
      record(name, false, 'call succeeded, expected rejection');
    } catch (err) {
      const code = err.code || '(no code)';
      const matches = /permission-denied/.test(code);
      record(name, matches, `actual code = ${code}${matches ? '' : ' (expected …permission-denied)'}`);
    }
  }

  // ── CHECK 2b — unauthenticated ────────────────────────────────────
  {
    const name = 'CHECK 2b — unauthenticated → unauthenticated';
    try {
      await signOut(auth);
      await createDoctorAccount({ email: emailFor('doc-anon'), password: DOCTOR_PASSWORD });
      record(name, false, 'call succeeded, expected rejection');
    } catch (err) {
      const code = err.code || '(no code)';
      const matches = /unauthenticated/.test(code);
      record(name, matches, `actual code = ${code}${matches ? '' : ' (expected …unauthenticated)'}`);
    }
  }

  // ── Re-sign in as owner for remaining checks ──────────────────────
  try {
    const cred = await signInWithEmailAndPassword(auth, owner.email, owner.password);
    await getIdToken(cred.user, true);
    owner.user = cred.user;
  } catch (err) {
    console.error('  FATAL: could not re-sign-in as owner —', err.code || '', err.message);
    process.exit(1);
  }

  // ── CHECK 3 — CROSS-TENANT: bogus clinicId in data is ignored ────
  {
    const name = "CHECK 3 — ⚠ ATTACK: caller-supplied clinicId must be IGNORED";
    try {
      const bogusClinic = 'bogus-clinic-nonexistent';
      const email = emailFor('doc-crosstenant');
      const res = await createDoctorAccount({ email, password: DOCTOR_PASSWORD, clinicId: bogusClinic });
      const memberId = res?.data?.memberId;
      if (!memberId) throw new Error('no memberId returned');

      // sign in as new doctor and check claim
      await signOut(auth);
      const doctorCred = await signInWithEmailAndPassword(auth, email, DOCTOR_PASSWORD);
      const claims = await refreshedClaims(doctorCred.user);

      if (claims.clinicId === bogusClinic) {
        console.error('');
        console.error('  ╔══════════════════════════════════════════════════════════════╗');
        console.error('  ║  ⚠⚠⚠ CATASTROPHIC SECURITY FAILURE ⚠⚠⚠                      ║');
        console.error('  ║  A caller-supplied clinicId was honored — tenant isolation    ║');
        console.error('  ║  is BROKEN. DO NOT DEPLOY.                                    ║');
        console.error('  ╚══════════════════════════════════════════════════════════════╝');
        console.error('');
        record(name, false, `doctor.claims.clinicId === bogus (${bogusClinic}) — SEIZURE SUCCEEDED`);
      } else if (claims.clinicId === owner.clinicId && claims.role === 'doctor') {
        record(name, true, `doctor got owner's clinic (${owner.clinicId}); bogus (${bogusClinic}) was ignored`);
      } else {
        record(name, false, `unexpected claims=${JSON.stringify(claims)}`);
      }

      // re-sign in as owner for remaining checks
      await signOut(auth);
      const cred = await signInWithEmailAndPassword(auth, owner.email, owner.password);
      await getIdToken(cred.user, true);
      owner.user = cred.user;
    } catch (err) {
      record(name, false, `threw ${err.code || ''} ${err.message}`);
    }
  }

  // ── CHECK 4 — DUP EMAIL ───────────────────────────────────────────
  {
    const name = 'CHECK 4 — duplicate email → already-exists';
    try {
      // re-use the doctorEmail from CHECK 1
      await createDoctorAccount({ email: doctorEmail, password: DOCTOR_PASSWORD });
      record(name, false, 'call succeeded, expected rejection');
    } catch (err) {
      const code = err.code || '(no code)';
      const matches = /already-exists/.test(code);
      record(name, matches, `actual code = ${code}${matches ? '' : ' (expected …already-exists)'}`);
    }
  }

  // ── CHECK 5a — BAD INPUT: empty email ─────────────────────────────
  {
    const name = 'CHECK 5a — empty email → invalid-argument';
    try {
      await createDoctorAccount({ email: '', password: DOCTOR_PASSWORD });
      record(name, false, 'call succeeded, expected rejection');
    } catch (err) {
      const code = err.code || '(no code)';
      const matches = /invalid-argument/.test(code);
      record(name, matches, `actual code = ${code}${matches ? '' : ' (expected …invalid-argument)'}`);
    }
  }

  // ── CHECK 5b — BAD INPUT: short password ──────────────────────────
  {
    const name = 'CHECK 5b — password < 6 chars → invalid-argument';
    try {
      await createDoctorAccount({ email: emailFor('doc-shortpw'), password: 'abc' });
      record(name, false, 'call succeeded, expected rejection');
    } catch (err) {
      const code = err.code || '(no code)';
      const matches = /invalid-argument/.test(code);
      record(name, matches, `actual code = ${code}${matches ? '' : ' (expected …invalid-argument)'}`);
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
