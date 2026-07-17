/**
 * ═══════════════════════════════════════════════════════════════════
 *  testOwnerClaims.js — Stage 3b verification
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
 *    1. Happy path — an owner gets { role:'owner', clinicId } claims.
 *    2. ⚠ ATTACK — a caller CANNOT seize another owner's clinic by
 *       supplying its id in `data`. This is the critical test.
 *    3. No clinic → not-found.
 *    4. Two clinics → failed-precondition.
 *    5. Unauthenticated → unauthenticated.
 *    6. Idempotent — calling twice yields the same claims, no error.
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
console.log('║  testOwnerClaims — EMULATOR-ONLY                                 ║');
console.log(`║  Auth emulator:      ${AUTH_HOST.padEnd(43)}║`);
console.log(`║  Firestore emulator: ${FIRESTORE_HOST}:${FIRESTORE_PORT}${' '.repeat(43 - `${FIRESTORE_HOST}:${FIRESTORE_PORT}`.length)}║`);
console.log(`║  Functions emulator: ${FUNCTIONS_HOST}:${FUNCTIONS_PORT}${' '.repeat(43 - `${FUNCTIONS_HOST}:${FUNCTIONS_PORT}`.length)}║`);
console.log(`║  Project namespace:  ${firebaseConfig.projectId.padEnd(43)}║`);
console.log('╚══════════════════════════════════════════════════════════════════╝');

const app = initializeApp(firebaseConfig, 'claims-test');
const auth = getAuth(app);
const db = getFirestore(app);
const functions = getFunctions(app);

// ── The safety model — these three calls must run BEFORE any other IO
connectAuthEmulator(auth, AUTH_HOST, { disableWarnings: true });
connectFirestoreEmulator(db, FIRESTORE_HOST, FIRESTORE_PORT);
connectFunctionsEmulator(functions, FUNCTIONS_HOST, FUNCTIONS_PORT);

const assignOwnerClaims = httpsCallable(functions, 'assignOwnerClaims');

// ── Helpers ─────────────────────────────────────────────────────────
const RUN_ID = Date.now();
function emailFor(tag) {
  return `${tag}-${RUN_ID}@claims-test.local`;
}
const PASSWORD = 'test-password-1234';

const results = [];
function record(name, passed, reason) {
  results.push({ name, passed, reason });
  const tag = passed ? 'PASS' : 'FAIL';
  console.log(`  [${tag}] ${name} — ${reason}`);
}

async function createOwner(tag) {
  const email = emailFor(tag);
  const cred = await createUserWithEmailAndPassword(auth, email, PASSWORD);
  return { email, user: cred.user };
}

async function createClinicDoc(ownerUid) {
  const ref = await addDoc(collection(db, 'clinics'), {
    ownerUid,
    subscribed: false,
    status: 'pending_subscription',
    createdAt: Date.now(),
  });
  return ref.id;
}

async function refreshedClaims(user) {
  await getIdToken(user, true);
  const tokenResult = await getIdTokenResult(user, true);
  return tokenResult.claims;
}

// ── Checks ──────────────────────────────────────────────────────────

async function check1_happyPath() {
  const name = 'CHECK 1 — happy path';
  try {
    const { user: A } = await createOwner('a');
    const clinicA = await createClinicDoc(A.uid);
    const result = await assignOwnerClaims({});
    const returned = result?.data?.clinicId;
    const claims = await refreshedClaims(A);
    if (claims.role === 'owner' && claims.clinicId === clinicA && returned === clinicA) {
      record(name, true, `role=owner clinicId=${clinicA}`);
    } else {
      record(name, false, `claims=${JSON.stringify(claims)} returned=${returned} expected=${clinicA}`);
    }
    return { userA: A, clinicA };
  } catch (err) {
    record(name, false, `threw ${err.code || ''} ${err.message}`);
    return { userA: null, clinicA: null };
  }
}

async function check2_attack(clinicA) {
  const name = 'CHECK 2 — ⚠ ATTACK: caller-supplied clinicId must be IGNORED';
  try {
    const { user: B } = await createOwner('b');
    const clinicB = await createClinicDoc(B.uid);
    // B attempts to seize A's clinic by passing its id.
    await assignOwnerClaims({ clinicId: clinicA });
    const claims = await refreshedClaims(B);

    if (claims.clinicId === clinicA) {
      console.error('');
      console.error('  ╔══════════════════════════════════════════════════════════════╗');
      console.error('  ║  ⚠⚠⚠ CATASTROPHIC SECURITY FAILURE ⚠⚠⚠                      ║');
      console.error('  ║  User B was granted ownership of user A\'s clinic by          ║');
      console.error('  ║  supplying its id in the callable payload.                   ║');
      console.error('  ║  The function is NOT SAFE. DO NOT DEPLOY.                    ║');
      console.error('  ╚══════════════════════════════════════════════════════════════╝');
      console.error('');
      record(name, false, `B.claims.clinicId === clinicA (${clinicA}) — SEIZURE SUCCEEDED`);
    } else if (claims.clinicId === clinicB && claims.role === 'owner') {
      record(name, true, `B got B's own clinic (${clinicB}); A's id (${clinicA}) was ignored`);
    } else {
      record(name, false, `unexpected claims=${JSON.stringify(claims)}`);
    }
  } catch (err) {
    record(name, false, `threw ${err.code || ''} ${err.message}`);
  }
}

async function check3_noClinic() {
  const name = 'CHECK 3 — no clinic → not-found';
  try {
    await createOwner('c');
    await assignOwnerClaims({});
    record(name, false, 'call succeeded, expected rejection');
  } catch (err) {
    const code = err.code || '(no code)';
    const matches = /not-found/.test(code);
    record(name, matches, `actual code = ${code}${matches ? '' : ' (expected …not-found)'}`);
  }
}

async function check4_twoClinics() {
  const name = 'CHECK 4 — two clinics → failed-precondition';
  try {
    const { user: D } = await createOwner('d');
    await createClinicDoc(D.uid);
    await createClinicDoc(D.uid);
    await assignOwnerClaims({});
    record(name, false, 'call succeeded, expected rejection');
  } catch (err) {
    const code = err.code || '(no code)';
    const matches = /failed-precondition/.test(code);
    record(name, matches, `actual code = ${code}${matches ? '' : ' (expected …failed-precondition)'}`);
  }
}

async function check5_unauthenticated() {
  const name = 'CHECK 5 — unauthenticated → unauthenticated';
  try {
    await signOut(auth);
    await assignOwnerClaims({});
    record(name, false, 'call succeeded, expected rejection');
  } catch (err) {
    const code = err.code || '(no code)';
    const matches = /unauthenticated/.test(code);
    record(name, matches, `actual code = ${code}${matches ? '' : ' (expected …unauthenticated)'}`);
  }
}

async function check6_idempotent(userA, clinicA, emailA) {
  const name = 'CHECK 6 — idempotent (second call = same claims, no error)';
  try {
    if (!emailA) {
      record(name, false, 'CHECK 1 did not produce a user; skipping');
      return;
    }
    const cred = await signInWithEmailAndPassword(auth, emailA, PASSWORD);
    await assignOwnerClaims({});
    const claims = await refreshedClaims(cred.user);
    if (claims.role === 'owner' && claims.clinicId === clinicA) {
      record(name, true, `still role=owner clinicId=${clinicA}`);
    } else {
      record(name, false, `claims=${JSON.stringify(claims)} expected clinicId=${clinicA}`);
    }
  } catch (err) {
    record(name, false, `threw ${err.code || ''} ${err.message}`);
  }
}

// ── Main ────────────────────────────────────────────────────────────
(async () => {
  console.log('');
  console.log('  Running checks...');
  console.log('');

  let emailA = null;
  try {
    const { user: A } = await createOwner('a');
    emailA = A.email;
    const clinicA = await createClinicDoc(A.uid);
    // CHECK 1 inline (so we retain emailA/clinicA for CHECK 6)
    try {
      const result = await assignOwnerClaims({});
      const returned = result?.data?.clinicId;
      const claims = await refreshedClaims(A);
      if (claims.role === 'owner' && claims.clinicId === clinicA && returned === clinicA) {
        record('CHECK 1 — happy path', true, `role=owner clinicId=${clinicA}`);
      } else {
        record('CHECK 1 — happy path', false, `claims=${JSON.stringify(claims)} returned=${returned} expected=${clinicA}`);
      }
    } catch (err) {
      record('CHECK 1 — happy path', false, `threw ${err.code || ''} ${err.message}`);
    }

    await check2_attack(clinicA);
    await check3_noClinic();
    await check4_twoClinics();
    await check5_unauthenticated();
    await check6_idempotent(A, clinicA, emailA);
  } catch (err) {
    console.error('');
    console.error('  FATAL: setup failure —', err.code || '', err.message);
    console.error('  If this is ECONNREFUSED, the emulator is not running.');
    console.error('');
    process.exit(1);
  }

  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  console.log('');
  console.log('  ═══════════════════════════════════════════════════════════════');
  console.log(`  Summary: ${passed}/${total} passed`);
  console.log('  ═══════════════════════════════════════════════════════════════');

  const check2 = results.find(r => r.name.startsWith('CHECK 2'));
  if (check2 && !check2.passed) {
    console.log('');
    console.log('  ⚠ CHECK 2 (the attack) FAILED — the function is NOT SAFE.');
  }

  process.exit(passed === total ? 0 : 1);
})();
