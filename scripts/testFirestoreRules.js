const { initializeTestEnvironment, assertSucceeds, assertFails } = require('@firebase/rules-unit-testing');
const { readFileSync } = require('fs');
const { doc, getDoc, setDoc, collection, query, where, getDocs } = require('firebase/firestore');

const PROJECT_ID = 'demo-rules-test', HOST = '127.0.0.1', PORT = 8080;
let passed = 0, failed = 0;
async function check(name, p) { try { await p; console.log('  PASS:', name); passed++; } catch (e) { console.error('  FAIL:', name, '-', e.message); failed++; } }

async function main() {
  const env = await initializeTestEnvironment({ projectId: PROJECT_ID, firestore: { rules: readFileSync('firebase/firestore.rules.candidate', 'utf8'), host: HOST, port: PORT } });
  await env.clearFirestore();

  const ownerA = env.authenticatedContext('ownerA', { role: 'owner', clinicId: 'clinicA' }).firestore();
  const doctorA = env.authenticatedContext('doctorA', { role: 'doctor', clinicId: 'clinicA' }).firestore();
  const p1 = env.authenticatedContext('P1', { role: 'patient', clinicId: 'clinicA', patientId: 'P1' }).firestore();
  const p2 = env.authenticatedContext('P2', { role: 'patient', clinicId: 'clinicA', patientId: 'P2' }).firestore();
  const ownerB = env.authenticatedContext('ownerB', { role: 'owner', clinicId: 'clinicB' }).firestore();
  const ownerA_noclaim = env.authenticatedContext('ownerA', {}).firestore();
  const guest = env.unauthenticatedContext().firestore();

  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, 'clinics/clinicA'), { ownerUid: 'ownerA', name: 'A' });
    await setDoc(doc(db, 'clinics/clinicB'), { ownerUid: 'ownerB', name: 'B' });
    await setDoc(doc(db, 'clinics_public/clinicA'), { name: 'A' });
    await setDoc(doc(db, 'clinics/clinicA/patients/P1'), { phone: 'x' });
    await setDoc(doc(db, 'clinics/clinicA/patients/P1/sessions/S1'), { date: 1 });
    await setDoc(doc(db, 'clinics/clinicA/media/M1'), { url: 'x' });
    await setDoc(doc(db, 'clinics/clinicA/media/M1/likes/L1'), { by: 'g' });
    await setDoc(doc(db, 'clinics/clinicA/settings/profile'), { a: 1 });
    await setDoc(doc(db, 'clinics/clinicA/highlights/H1'), { a: 1 });
    await setDoc(doc(db, 'users/ownerA'), { clinicId: 'clinicA', role: 'owner' });
    await setDoc(doc(db, 'patients/P1/messages/msg1'), { text: 'hi' });
    await setDoc(doc(db, 'threads/clinicA_P1'), { a: 1 });
    await setDoc(doc(db, 'patientCodes/CODE1'), { clinicId: 'clinicA', patientId: 'P1' });
    await setDoc(doc(db, 'ai_logs/L1'), { a: 1 });
  });

  await check('public: guest reads clinics_public', assertSucceeds(getDoc(doc(guest, 'clinics_public/clinicA'))));
  await check('public: ownerA writes own clinics_public', assertSucceeds(setDoc(doc(ownerA, 'clinics_public/clinicA'), { name: 'A2' })));
  await check('public: ownerB CANNOT write clinicA public', assertFails(setDoc(doc(ownerB, 'clinics_public/clinicA'), { name: 'x' })));
  await check('public: guest CANNOT write clinics_public', assertFails(setDoc(doc(guest, 'clinics_public/clinicA'), { name: 'x' })));

  await check('clinic: ownerA reads clinicA', assertSucceeds(getDoc(doc(ownerA, 'clinics/clinicA'))));
  await check('clinic: doctorA reads clinicA', assertSucceeds(getDoc(doc(doctorA, 'clinics/clinicA'))));
  await check('clinic: P1 reads clinicA', assertSucceeds(getDoc(doc(p1, 'clinics/clinicA'))));
  await check('clinic: ownerB CANNOT read clinicA', assertFails(getDoc(doc(ownerB, 'clinics/clinicA'))));
  await check('clinic: guest CANNOT read clinicA', assertFails(getDoc(doc(guest, 'clinics/clinicA'))));
  await check('clinic bootstrap: ownerA(no claims) reads own clinicA', assertSucceeds(getDoc(doc(ownerA_noclaim, 'clinics/clinicA'))));
  await check('clinic: ownerA writes clinicA', assertSucceeds(setDoc(doc(ownerA, 'clinics/clinicA'), { ownerUid: 'ownerA', name: 'A3' })));
  await check('clinic: doctorA CANNOT write clinicA', assertFails(setDoc(doc(doctorA, 'clinics/clinicA'), { ownerUid: 'ownerA', name: 'x' })));

  await check('patientDoc: ownerA reads P1', assertSucceeds(getDoc(doc(ownerA, 'clinics/clinicA/patients/P1'))));
  await check('patientDoc: P1 reads own', assertSucceeds(getDoc(doc(p1, 'clinics/clinicA/patients/P1'))));
  await check('patientDoc: P2 CANNOT read P1', assertFails(getDoc(doc(p2, 'clinics/clinicA/patients/P1'))));
  await check('patientDoc: ownerB CANNOT read P1', assertFails(getDoc(doc(ownerB, 'clinics/clinicA/patients/P1'))));
  await check('patientDoc: P1 CANNOT write own record', assertFails(setDoc(doc(p1, 'clinics/clinicA/patients/P1'), { phone: 'y' })));
  await check('patientDoc: ownerA writes P1', assertSucceeds(setDoc(doc(ownerA, 'clinics/clinicA/patients/P1'), { phone: 'y' })));
  await check('sessions: P1 reads own session', assertSucceeds(getDoc(doc(p1, 'clinics/clinicA/patients/P1/sessions/S1'))));
  await check('sessions: P1 CANNOT write session', assertFails(setDoc(doc(p1, 'clinics/clinicA/patients/P1/sessions/S1'), { date: 2 })));

  await check('media: guest reads media', assertSucceeds(getDoc(doc(guest, 'clinics/clinicA/media/M1'))));
  await check('media: ownerA writes media', assertSucceeds(setDoc(doc(ownerA, 'clinics/clinicA/media/M1'), { url: 'y' })));
  await check('media: guest CANNOT write media', assertFails(setDoc(doc(guest, 'clinics/clinicA/media/M1'), { url: 'z' })));
  await check('likes: guest reads likes', assertSucceeds(getDoc(doc(guest, 'clinics/clinicA/media/M1/likes/L1'))));

  await check('settings: ownerA reads', assertSucceeds(getDoc(doc(ownerA, 'clinics/clinicA/settings/profile'))));
  await check('settings: P1 CANNOT read', assertFails(getDoc(doc(p1, 'clinics/clinicA/settings/profile'))));
  await check('highlights: ownerB CANNOT read clinicA', assertFails(getDoc(doc(ownerB, 'clinics/clinicA/highlights/H1'))));

  await check('users: self reads own', assertSucceeds(getDoc(doc(ownerA, 'users/ownerA'))));
  await check('users: guest CANNOT read', assertFails(getDoc(doc(guest, 'users/ownerA'))));

  await check('msg: P1 reads own messages', assertSucceeds(getDoc(doc(p1, 'patients/P1/messages/msg1'))));
  await check('msg: P1 writes own message', assertSucceeds(setDoc(doc(p1, 'patients/P1/messages/msg2'), { text: 'hey' })));
  await check('msg: ownerA reads P1 messages', assertSucceeds(getDoc(doc(ownerA, 'patients/P1/messages/msg1'))));
  await check('msg: ownerB CANNOT read P1 messages', assertFails(getDoc(doc(ownerB, 'patients/P1/messages/msg1'))));
  await check('msg: guest CANNOT read messages', assertFails(getDoc(doc(guest, 'patients/P1/messages/msg1'))));

  await check('thread: ownerA reads clinicA_P1', assertSucceeds(getDoc(doc(ownerA, 'threads/clinicA_P1'))));
  await check('thread: P1 reads clinicA_P1', assertSucceeds(getDoc(doc(p1, 'threads/clinicA_P1'))));
  await check('thread: ownerB CANNOT read clinicA_P1', assertFails(getDoc(doc(ownerB, 'threads/clinicA_P1'))));

  await check('codes: ownerA reads own clinic code', assertSucceeds(getDoc(doc(ownerA, 'patientCodes/CODE1'))));
  await check('codes: ownerB CANNOT read clinicA code', assertFails(getDoc(doc(ownerB, 'patientCodes/CODE1'))));
  await check('codes: guest CANNOT read code', assertFails(getDoc(doc(guest, 'patientCodes/CODE1'))));

  await check('ai_logs: ownerA CANNOT read', assertFails(getDoc(doc(ownerA, 'ai_logs/L1'))));

  // ── QUERY tests (login-critical + collection scoping) ──
  await check('query: ownerA finds own clinic by ownerUid (LOGIN query)', assertSucceeds(getDocs(query(collection(ownerA, 'clinics'), where('ownerUid', '==', 'ownerA')))));
  await check('query: no-claim user finds own clinic by ownerUid (bootstrap login)', assertSucceeds(getDocs(query(collection(ownerA_noclaim, 'clinics'), where('ownerUid', '==', 'ownerA')))));
  await check('query: doctorA login clinics query returns empty (allowed)', assertSucceeds(getDocs(query(collection(doctorA, 'clinics'), where('ownerUid', '==', 'doctorA')))));
  await check('query: ownerB scoped clinics query (own only)', assertSucceeds(getDocs(query(collection(ownerB, 'clinics'), where('ownerUid', '==', 'ownerB')))));
  await check('query: ownerA CANNOT list ALL clinics unscoped', assertFails(getDocs(collection(ownerA, 'clinics'))));
  await check('query: ownerA lists own clinic patients', assertSucceeds(getDocs(collection(ownerA, 'clinics/clinicA/patients'))));
  await check('query: P1 CANNOT list all clinicA patients', assertFails(getDocs(collection(p1, 'clinics/clinicA/patients'))));
  await check('query: P1 lists own sessions', assertSucceeds(getDocs(collection(p1, 'clinics/clinicA/patients/P1/sessions'))));
  await check('query: P1 queries own messages', assertSucceeds(getDocs(collection(p1, 'patients/P1/messages'))));
  await check('query: ownerA queries own-clinic patient messages', assertSucceeds(getDocs(collection(ownerA, 'patients/P1/messages'))));
  await check('query: guest reads public media collection', assertSucceeds(getDocs(collection(guest, 'clinics/clinicA/media'))));
  await check('query: guest CANNOT list clinic settings', assertFails(getDocs(collection(guest, 'clinics/clinicA/settings'))));

  // ── onboarding bootstrap (writes that happen BEFORE owner claims) ──
  await check('bootstrap: no-claim owner publishes own clinics_public', assertSucceeds(setDoc(doc(ownerA_noclaim, 'clinics_public/clinicA'), { name: 'pub' }, { merge: true })));
  await check('bootstrap: ownerB CANNOT publish clinicA public (cross-tenant)', assertFails(setDoc(doc(ownerB, 'clinics_public/clinicA'), { name: 'x' }, { merge: true })));
  await check('bootstrap: no-claim owner merges own clinic without restating ownerUid', assertSucceeds(setDoc(doc(ownerA_noclaim, 'clinics/clinicA'), { subscribed: true }, { merge: true })));

  await env.cleanup();
  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
}
main().catch((e) => { console.error(e); process.exit(1); });
