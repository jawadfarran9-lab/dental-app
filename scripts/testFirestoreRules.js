const { initializeTestEnvironment, assertSucceeds, assertFails } = require('@firebase/rules-unit-testing');
const { readFileSync } = require('fs');
const { doc, getDoc, setDoc, addDoc, updateDoc, deleteDoc, collection, collectionGroup, query, where, orderBy, getDocs } = require('firebase/firestore');

const PROJECT_ID = 'demo-rules-test', HOST = '127.0.0.1', PORT = 8080;
let passed = 0, failed = 0;
async function check(name, p) { try { await p; console.log('  PASS:', name); passed++; } catch (e) { console.error('  FAIL:', name, '-', e.message); failed++; } }

async function main() {
  const env = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: { rules: readFileSync('firebase/firestore.rules.candidate', 'utf8'), host: HOST, port: PORT }
  });
  await env.clearFirestore();

  // ── Auth contexts ──────────────────────────────────────────────────────
  const ownerA         = env.authenticatedContext('ownerA',  { role: 'owner',   clinicId: 'clinicA' }).firestore();
  const doctorA        = env.authenticatedContext('doctorA', { role: 'doctor',  clinicId: 'clinicA' }).firestore();
  const p1             = env.authenticatedContext('P1',      { role: 'patient', clinicId: 'clinicA', patientId: 'P1' }).firestore();
  const p2             = env.authenticatedContext('P2',      { role: 'patient', clinicId: 'clinicA', patientId: 'P2' }).firestore();
  const ownerB         = env.authenticatedContext('ownerB',  { role: 'owner',   clinicId: 'clinicB' }).firestore();
  const ownerA_noclaim = env.authenticatedContext('ownerA',  {}).firestore();
  const guest          = env.unauthenticatedContext().firestore();

  // ── Seed data (rules disabled) ─────────────────────────────────────────
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    // Clinic roots
    await setDoc(doc(db, 'clinics/clinicA'), { ownerUid: 'ownerA', name: 'A' });
    await setDoc(doc(db, 'clinics/clinicB'), { ownerUid: 'ownerB', name: 'B' });
    await setDoc(doc(db, 'clinics_public/clinicA'), { name: 'A' });
    await setDoc(doc(db, 'clinics_public/clinicB'), { name: 'B' });
    // Members
    await setDoc(doc(db, 'clinics/clinicA/members/M1'), { role: 'doctor' });
    // Patients + nested
    await setDoc(doc(db, 'clinics/clinicA/patients/P1'), { phone: 'x', clinicId: 'clinicA' });
    await setDoc(doc(db, 'clinics/clinicA/patients/P2'), { phone: 'y', clinicId: 'clinicA' });
    await setDoc(doc(db, 'clinics/clinicB/patients/PB'), { phone: 'b', clinicId: 'clinicB' });
    await setDoc(doc(db, 'clinics/clinicA/patients/P1/sessions/S1'), { date: 1 });
    await setDoc(doc(db, 'clinics/clinicA/patients/P1/sessions/S1/private/main'), { note: 'private' });
    await setDoc(doc(db, 'clinics/clinicA/patients/P1/sessions/S1/photos/PH1'), { url: 'u' });
    await setDoc(doc(db, 'clinics/clinicA/patients/P1/timeline/T1'), { at: 1 });
    await setDoc(doc(db, 'clinics/clinicA/patients/P1/media/MD1'), { url: 'x' });
    await setDoc(doc(db, 'clinics/clinicA/patients/P1/images/IMG1'), { url: 'i' });
    // Owner-only clinic subcollections
    await setDoc(doc(db, 'clinics/clinicA/settings/profile'), { a: 1 });
    await setDoc(doc(db, 'clinics/clinicA/analytics/timeManagement'), { a: 1 });
    await setDoc(doc(db, 'clinics/clinicA/usage/stats'), { a: 1 });
    await setDoc(doc(db, 'clinics/clinicA/trial/status'), { a: 1 });
    await setDoc(doc(db, 'clinics/clinicA/invites/I1'), { email: 'x@y' });
    await setDoc(doc(db, 'clinics/clinicA/questionResponses/QR1'), { a: 1 });
    await setDoc(doc(db, 'clinics/clinicA/auditLogs/AL1'), { a: 1 });
    await setDoc(doc(db, 'clinics/clinicA/archive/Ar1'), { a: 1 });
    await setDoc(doc(db, 'clinics/clinicA/branding/logo'), { url: 'x' });
    // Public-read clinic subcollections
    await setDoc(doc(db, 'clinics/clinicA/highlights/H1'), { a: 1 });
    await setDoc(doc(db, 'clinics/clinicA/stories/ST1'), { a: 1 });
    await setDoc(doc(db, 'clinics/clinicA/media/M1'), { url: 'x' });
    await setDoc(doc(db, 'clinics/clinicA/media/M1/likes/L1'), { by: 'g' });
    // users mirror
    await setDoc(doc(db, 'users/ownerA'), { clinicId: 'clinicA', role: 'owner' });
    await setDoc(doc(db, 'users/ownerA/saved/PP1'), { at: 1 });
    // Top-level messages/appointments — F2 stamps clinicId
    await setDoc(doc(db, 'patients/P1/messages/msg1'), { text: 'hi', clinicId: 'clinicA' });
    await setDoc(doc(db, 'patients/P2/messages/msgP2'), { text: 'bye', clinicId: 'clinicA' });
    await setDoc(doc(db, 'patients/P1/appointments/AP1'), { dateTime: 1, clinicId: 'clinicA' });
    await setDoc(doc(db, 'patients/QQ/appointments/AP2'), { dateTime: 2, clinicId: 'clinicB' });
    // threads
    await setDoc(doc(db, 'threads/clinicA_P1'), { clinicId: 'clinicA', lastMessageAt: 1 });
    await setDoc(doc(db, 'threads/clinicB_XX'), { clinicId: 'clinicB', lastMessageAt: 1 });
    // patientCodes
    await setDoc(doc(db, 'patientCodes/CODE1'), { clinicId: 'clinicA', patientId: 'P1' });
    // ai_logs
    await setDoc(doc(db, 'ai_logs/L1'), { a: 1 });
  });

  console.log('\n── clinics/{cid} root doc ──────────────────────────────────');
  await check('clinic: ownerA gets clinicA',                assertSucceeds(getDoc(doc(ownerA, 'clinics/clinicA'))));
  await check('clinic: doctorA gets clinicA',               assertSucceeds(getDoc(doc(doctorA, 'clinics/clinicA'))));
  await check('clinic: P1 gets clinicA (isPatientOfClinic)',assertSucceeds(getDoc(doc(p1, 'clinics/clinicA'))));
  await check('clinic: ownerB DENIED gets clinicA',         assertFails(getDoc(doc(ownerB, 'clinics/clinicA'))));
  await check('clinic: guest DENIED gets clinicA',          assertFails(getDoc(doc(guest, 'clinics/clinicA'))));
  await check('clinic bootstrap: no-claim owner gets own',  assertSucceeds(getDoc(doc(ownerA_noclaim, 'clinics/clinicA'))));
  await check('clinic: ownerA updates clinicA',             assertSucceeds(setDoc(doc(ownerA, 'clinics/clinicA'), { name: 'A2' }, { merge: true })));
  await check('clinic: doctorA DENIED update clinicA',      assertFails(setDoc(doc(doctorA, 'clinics/clinicA'), { name: 'x' }, { merge: true })));
  await check('clinic bootstrap: no-claim owner merges own',assertSucceeds(setDoc(doc(ownerA_noclaim, 'clinics/clinicA'), { subscribed: true }, { merge: true })));
  await check('clinic bootstrap: create with own ownerUid', assertSucceeds(setDoc(doc(ownerA_noclaim, 'clinics/newCid'), { ownerUid: 'ownerA', name: 'New' })));
  await check('clinic bootstrap: create with OTHER ownerUid DENIED', assertFails(setDoc(doc(ownerA_noclaim, 'clinics/otherCid'), { ownerUid: 'someoneElse', name: 'X' })));
  await check('clinic: list DENIED for ownerA',             assertFails(getDocs(collection(ownerA, 'clinics'))));
  await check('clinic: list DENIED for guest',              assertFails(getDocs(collection(guest, 'clinics'))));

  console.log('\n── clinics/{cid}/members ────────────────────────────────────');
  await check('members: ownerA reads',                       assertSucceeds(getDoc(doc(ownerA, 'clinics/clinicA/members/M1'))));
  await check('members: doctorA reads',                      assertSucceeds(getDoc(doc(doctorA, 'clinics/clinicA/members/M1'))));
  await check('members: P1 DENIED reads',                    assertFails(getDoc(doc(p1, 'clinics/clinicA/members/M1'))));
  await check('members: guest DENIED reads',                 assertFails(getDoc(doc(guest, 'clinics/clinicA/members/M1'))));
  await check('members bootstrap: no-claim owner reads own', assertSucceeds(getDoc(doc(ownerA_noclaim, 'clinics/clinicA/members/M1'))));
  await check('members bootstrap: no-claim owner cross-tenant DENIED', assertFails(getDoc(doc(ownerA_noclaim, 'clinics/clinicB/members/whatever'))));
  await check('members: ownerA writes',                      assertSucceeds(setDoc(doc(ownerA, 'clinics/clinicA/members/M2'), { role: 'doctor' })));
  await check('members: doctorA DENIED writes',              assertFails(setDoc(doc(doctorA, 'clinics/clinicA/members/M3'), { role: 'doctor' })));

  console.log('\n── clinics/{cid}/patients ──────────────────────────────────');
  await check('patient: ownerA reads P1',                    assertSucceeds(getDoc(doc(ownerA, 'clinics/clinicA/patients/P1'))));
  await check('patient: doctorA reads P1',                   assertSucceeds(getDoc(doc(doctorA, 'clinics/clinicA/patients/P1'))));
  await check('patient: P1 reads own',                       assertSucceeds(getDoc(doc(p1, 'clinics/clinicA/patients/P1'))));
  await check('patient: P2 DENIED reads P1',                 assertFails(getDoc(doc(p2, 'clinics/clinicA/patients/P1'))));
  await check('patient: ownerB DENIED reads P1',             assertFails(getDoc(doc(ownerB, 'clinics/clinicA/patients/P1'))));
  await check('patient: P1 DENIED writes own',               assertFails(setDoc(doc(p1, 'clinics/clinicA/patients/P1'), { phone: 'z' }, { merge: true })));
  await check('patient: ownerA writes P1',                   assertSucceeds(setDoc(doc(ownerA, 'clinics/clinicA/patients/P1'), { phone: 'z' }, { merge: true })));
  await check('patient: doctorA writes P1',                  assertSucceeds(setDoc(doc(doctorA, 'clinics/clinicA/patients/P1'), { phone: 'w' }, { merge: true })));

  console.log('\n── sessions + private + photos + timeline + media + images ─');
  await check('session: P1 reads own session',               assertSucceeds(getDoc(doc(p1, 'clinics/clinicA/patients/P1/sessions/S1'))));
  await check('session: P1 DENIED writes session',           assertFails(setDoc(doc(p1, 'clinics/clinicA/patients/P1/sessions/S1'), { date: 2 }, { merge: true })));
  await check('session: P1 reads own session photo',         assertSucceeds(getDoc(doc(p1, 'clinics/clinicA/patients/P1/sessions/S1/photos/PH1'))));
  await check('session: P1 DENIED reads private/main',       assertFails(getDoc(doc(p1, 'clinics/clinicA/patients/P1/sessions/S1/private/main'))));
  await check('session: doctorA reads private/main',         assertSucceeds(getDoc(doc(doctorA, 'clinics/clinicA/patients/P1/sessions/S1/private/main'))));
  await check('session: P2 DENIED reads P1 session',         assertFails(getDoc(doc(p2, 'clinics/clinicA/patients/P1/sessions/S1'))));
  await check('timeline: P1 DENIED reads',                   assertFails(getDoc(doc(p1, 'clinics/clinicA/patients/P1/timeline/T1'))));
  await check('timeline: doctorA reads',                     assertSucceeds(getDoc(doc(doctorA, 'clinics/clinicA/patients/P1/timeline/T1'))));
  await check('patient media: P1 DENIED reads',              assertFails(getDoc(doc(p1, 'clinics/clinicA/patients/P1/media/MD1'))));
  await check('patient media: doctorA reads',                assertSucceeds(getDoc(doc(doctorA, 'clinics/clinicA/patients/P1/media/MD1'))));
  await check('patient images: P1 DENIED reads',             assertFails(getDoc(doc(p1, 'clinics/clinicA/patients/P1/images/IMG1'))));
  await check('patient images: doctorA reads',               assertSucceeds(getDoc(doc(doctorA, 'clinics/clinicA/patients/P1/images/IMG1'))));

  console.log('\n── settings / analytics / usage / trial / invites / QR / audit / archive ──');
  await check('settings: ownerA reads',                      assertSucceeds(getDoc(doc(ownerA, 'clinics/clinicA/settings/profile'))));
  await check('settings: doctorA reads',                     assertSucceeds(getDoc(doc(doctorA, 'clinics/clinicA/settings/profile'))));
  await check('settings: P1 DENIED reads',                   assertFails(getDoc(doc(p1, 'clinics/clinicA/settings/profile'))));
  await check('settings: ownerA writes',                     assertSucceeds(setDoc(doc(ownerA, 'clinics/clinicA/settings/profile'), { a: 2 }, { merge: true })));
  await check('settings: doctorA DENIED writes',             assertFails(setDoc(doc(doctorA, 'clinics/clinicA/settings/profile'), { a: 3 }, { merge: true })));
  await check('settings bootstrap: no-claim owner writes',   assertSucceeds(setDoc(doc(ownerA_noclaim, 'clinics/clinicA/settings/profile'), { a: 4 }, { merge: true })));
  await check('analytics: doctorA writes (staff)',           assertSucceeds(setDoc(doc(doctorA, 'clinics/clinicA/analytics/timeManagement'), { a: 2 }, { merge: true })));
  await check('analytics: doctorA reads (staff)',            assertSucceeds(getDoc(doc(doctorA, 'clinics/clinicA/analytics/timeManagement'))));
  await check('analytics: p1 DENIED reads',                  assertFails(getDoc(doc(p1, 'clinics/clinicA/analytics/timeManagement'))));
  await check('analytics: ownerA writes',                    assertSucceeds(setDoc(doc(ownerA, 'clinics/clinicA/analytics/timeManagement'), { a: 3 }, { merge: true })));
  await check('usage: doctorA DENIED writes',                assertFails(setDoc(doc(doctorA, 'clinics/clinicA/usage/stats'), { a: 2 }, { merge: true })));
  await check('usage: ownerA writes',                        assertSucceeds(setDoc(doc(ownerA, 'clinics/clinicA/usage/stats'), { a: 3 }, { merge: true })));
  await check('trial: doctorA DENIED writes',                assertFails(setDoc(doc(doctorA, 'clinics/clinicA/trial/status'), { a: 2 }, { merge: true })));
  await check('trial: ownerA writes',                        assertSucceeds(setDoc(doc(ownerA, 'clinics/clinicA/trial/status'), { a: 3 }, { merge: true })));
  await check('invites: doctorA DENIED writes',              assertFails(setDoc(doc(doctorA, 'clinics/clinicA/invites/I2'), { email: 'z@x' })));
  await check('invites: ownerA writes',                      assertSucceeds(setDoc(doc(ownerA, 'clinics/clinicA/invites/I3'), { email: 'z@x' })));
  await check('questionResponses: doctorA writes (staff)',   assertSucceeds(setDoc(doc(doctorA, 'clinics/clinicA/questionResponses/QR2'), { a: 1 })));
  await check('questionResponses: doctorA reads (staff)',    assertSucceeds(getDoc(doc(doctorA, 'clinics/clinicA/questionResponses/QR1'))));
  await check('questionResponses: p1 DENIED reads',          assertFails(getDoc(doc(p1, 'clinics/clinicA/questionResponses/QR1'))));
  await check('questionResponses: guest DENIED reads',       assertFails(getDoc(doc(guest, 'clinics/clinicA/questionResponses/QR1'))));
  await check('questionResponses: ownerA writes',            assertSucceeds(setDoc(doc(ownerA, 'clinics/clinicA/questionResponses/QR3'), { a: 1 })));
  await check('auditLogs: ownerA reads',                     assertSucceeds(getDoc(doc(ownerA, 'clinics/clinicA/auditLogs/AL1'))));
  await check('auditLogs: doctorA DENIED reads',             assertFails(getDoc(doc(doctorA, 'clinics/clinicA/auditLogs/AL1'))));
  await check('auditLogs: doctorA creates (staff)',          assertSucceeds(setDoc(doc(doctorA, 'clinics/clinicA/auditLogs/AL2'), { action: 'X' })));
  await check('auditLogs: ownerA cannot update',             assertFails(setDoc(doc(ownerA, 'clinics/clinicA/auditLogs/AL1'), { action: 'Y' }, { merge: true })));
  await check('archive: ownerA writes',                      assertSucceeds(setDoc(doc(ownerA, 'clinics/clinicA/archive/Ar2'), { a: 1 })));
  await check('archive: doctorA writes (staff)',             assertSucceeds(setDoc(doc(doctorA, 'clinics/clinicA/archive/Ar3'), { a: 1 })));
  await check('archive: doctorA reads (staff)',              assertSucceeds(getDoc(doc(doctorA, 'clinics/clinicA/archive/Ar1'))));
  await check('archive: p1 DENIED reads',                    assertFails(getDoc(doc(p1, 'clinics/clinicA/archive/Ar1'))));
  await check('branding: patient of A reads',                assertSucceeds(getDoc(doc(p1, 'clinics/clinicA/branding/logo'))));
  await check('branding: patient of B DENIED reads clinicA', assertFails(getDoc(doc(ownerB, 'clinics/clinicA/branding/logo'))) /* ownerB isn't patient; test any non-clinicA actor */);

  console.log('\n── highlights / stories / clinic media (public reads) ──────');
  await check('highlights: guest reads',                     assertSucceeds(getDoc(doc(guest, 'clinics/clinicA/highlights/H1'))));
  await check('highlights: ownerA writes',                   assertSucceeds(setDoc(doc(ownerA, 'clinics/clinicA/highlights/H2'), { a: 1 })));
  await check('highlights: doctorA writes (staff)',          assertSucceeds(setDoc(doc(doctorA, 'clinics/clinicA/highlights/H_docA'), { a: 1 })));
  await check('highlights: ownerB DENIED write clinicA',     assertFails(setDoc(doc(ownerB, 'clinics/clinicA/highlights/H3'), { a: 1 })));
  await check('highlights: p1 DENIED write',                 assertFails(setDoc(doc(p1, 'clinics/clinicA/highlights/H_p1'), { a: 1 })));
  await check('stories: guest reads',                        assertSucceeds(getDoc(doc(guest, 'clinics/clinicA/stories/ST1'))));
  await check('stories: ownerA writes',                      assertSucceeds(setDoc(doc(ownerA, 'clinics/clinicA/stories/ST2'), { a: 1 })));
  await check('stories: doctorA writes (staff)',             assertSucceeds(setDoc(doc(doctorA, 'clinics/clinicA/stories/ST_docA'), { a: 1 })));
  await check('stories: ownerB DENIED write clinicA',        assertFails(setDoc(doc(ownerB, 'clinics/clinicA/stories/ST_evil'), { a: 1 })));
  await check('clinic media: guest reads',                   assertSucceeds(getDoc(doc(guest, 'clinics/clinicA/media/M1'))));
  await check('clinic media: guest DENIED writes',           assertFails(setDoc(doc(guest, 'clinics/clinicA/media/MX'), { url: 'z' })));
  await check('clinic media: ownerA writes',                 assertSucceeds(setDoc(doc(ownerA, 'clinics/clinicA/media/M2'), { url: 'y' })));
  await check('clinic media: doctorA writes (staff)',        assertSucceeds(setDoc(doc(doctorA, 'clinics/clinicA/media/M_docA'), { url: 'y' })));
  await check('clinic media: ownerB DENIED write clinicA',   assertFails(setDoc(doc(ownerB, 'clinics/clinicA/media/M_evil'), { url: 'z' })));
  await check('clinic media likes: guest reads',             assertSucceeds(getDoc(doc(guest, 'clinics/clinicA/media/M1/likes/L1'))));
  await check('clinic media likes: ownerA writes',           assertSucceeds(setDoc(doc(ownerA, 'clinics/clinicA/media/M1/likes/L2'), { by: 'u' })));
  await check('clinic media likes: guest DENIED writes',     assertFails(setDoc(doc(guest, 'clinics/clinicA/media/M1/likes/LG'), { by: 'g' })));

  console.log('\n── patients/{pid}/messages (top-level) ─────────────────────');
  await check('msg: P1 reads own msg1',                      assertSucceeds(getDoc(doc(p1, 'patients/P1/messages/msg1'))));
  await check('msg: ownerA reads P1 msg1 (clinicA)',         assertSucceeds(getDoc(doc(ownerA, 'patients/P1/messages/msg1'))));
  await check('msg: doctorA reads P1 msg1 (clinicA)',        assertSucceeds(getDoc(doc(doctorA, 'patients/P1/messages/msg1'))));
  await check('msg: ownerB DENIED reads P1 msg1',            assertFails(getDoc(doc(ownerB, 'patients/P1/messages/msg1'))));
  await check('msg: P2 DENIED reads P1 msg1',                assertFails(getDoc(doc(p2, 'patients/P1/messages/msg1'))));
  await check('msg: guest DENIED reads msg1',                assertFails(getDoc(doc(guest, 'patients/P1/messages/msg1'))));
  await check('msg: P1 creates with clinicId=A',             assertSucceeds(setDoc(doc(p1, 'patients/P1/messages/newP1A'), { text: 'a', clinicId: 'clinicA' })));
  await check('msg: P1 DENIED create with clinicId=B',       assertFails(setDoc(doc(p1, 'patients/P1/messages/newP1B'), { text: 'b', clinicId: 'clinicB' })));
  await check('msg: P1 DENIED create WITHOUT clinicId',      assertFails(setDoc(doc(p1, 'patients/P1/messages/newP1none'), { text: 'x' })));
  await check('msg: ownerA creates for P1 with clinicId=A',  assertSucceeds(setDoc(doc(ownerA, 'patients/P1/messages/newOA'), { text: 'x', clinicId: 'clinicA' })));
  await check('msg: ownerB DENIED forge clinicA for P1',     assertFails(setDoc(doc(ownerB, 'patients/P1/messages/newOB_forgeA'), { text: 'x', clinicId: 'clinicA' })));
  await check('msg: ownerB DENIED stamp clinicB for P1 (P1 not under clinicB)', assertFails(setDoc(doc(ownerB, 'patients/P1/messages/newOB_crossPid'), { text: 'x', clinicId: 'clinicB' })));
  await check('msg: ownerB creates for PB stamped clinicB',  assertSucceeds(setDoc(doc(ownerB, 'patients/PB/messages/newOB_ownB'), { text: 'x', clinicId: 'clinicB' })));
  await check('msg: P1 lists own messages',                  assertSucceeds(getDocs(collection(p1, 'patients/P1/messages'))));
  await check('msg: ownerA lists P1 messages (clinicA-scoped)', assertSucceeds(getDocs(query(collection(ownerA, 'patients/P1/messages'), where('clinicId', '==', 'clinicA')))));
  await check('msg: ownerA UNSCOPED list of P1 (ownsPatient)', assertSucceeds(getDocs(collection(ownerA, 'patients/P1/messages'))));
  await check('msg: ownerB UNSCOPED list of P1 DENIED (cross-tenant)', assertFails(getDocs(collection(ownerB, 'patients/P1/messages'))));
  await check('msg: p1 UNSCOPED list of own (isPatient)',    assertSucceeds(getDocs(collection(p1, 'patients/P1/messages'))));
  await check('msg: p2 UNSCOPED list of P1 DENIED',          assertFails(getDocs(collection(p2, 'patients/P1/messages'))));
  await check('msg: ownerB DENIED list P1 messages',         assertFails(getDocs(collection(ownerB, 'patients/P1/messages'))));
  await check('msg: P2 DENIED list P1 messages',             assertFails(getDocs(collection(p2, 'patients/P1/messages'))));

  console.log('\n── patients/{pid}/appointments (top-level + collectionGroup) ──');
  await check('appt: P1 reads own AP1',                      assertSucceeds(getDoc(doc(p1, 'patients/P1/appointments/AP1'))));
  await check('appt: ownerA reads AP1 (clinicA)',            assertSucceeds(getDoc(doc(ownerA, 'patients/P1/appointments/AP1'))));
  await check('appt: ownerB DENIED reads AP1',               assertFails(getDoc(doc(ownerB, 'patients/P1/appointments/AP1'))));
  await check('appt: ownerA DENIED reads AP2 (clinicB)',     assertFails(getDoc(doc(ownerA, 'patients/QQ/appointments/AP2'))));
  await check('appt: P1 creates with clinicId=A',            assertSucceeds(setDoc(doc(p1, 'patients/P1/appointments/AP_new'), { dateTime: 3, clinicId: 'clinicA' })));
  await check('appt: P1 DENIED create with clinicId=B',      assertFails(setDoc(doc(p1, 'patients/P1/appointments/AP_bad'), { dateTime: 3, clinicId: 'clinicB' })));
  await check('appt: P1 DENIED create WITHOUT clinicId',     assertFails(setDoc(doc(p1, 'patients/P1/appointments/AP_none'), { dateTime: 3 })));
  await check('appt: ownerA creates for P1 with clinicId=A', assertSucceeds(setDoc(doc(ownerA, 'patients/P1/appointments/AP_OA'), { dateTime: 4, clinicId: 'clinicA' })));
  await check('appt: ownerB DENIED forge clinicA for P1',    assertFails(setDoc(doc(ownerB, 'patients/P1/appointments/AP_OB_forgeA'), { dateTime: 5, clinicId: 'clinicA' })));
  await check('appt: ownerB DENIED stamp clinicB for P1 (P1 not under clinicB)', assertFails(setDoc(doc(ownerB, 'patients/P1/appointments/AP_OB_crossPid'), { dateTime: 5, clinicId: 'clinicB' })));
  await check('appt: ownerB creates for PB stamped clinicB', assertSucceeds(setDoc(doc(ownerB, 'patients/PB/appointments/AP_OB_ownB'), { dateTime: 6, clinicId: 'clinicB' })));
  await check('appt: ownerA UNSCOPED list of P1 (ownsPatient)', assertSucceeds(getDocs(collection(ownerA, 'patients/P1/appointments'))));
  await check('appt: ownerB UNSCOPED list of P1 DENIED (cross-tenant)', assertFails(getDocs(collection(ownerB, 'patients/P1/appointments'))));
  await check('appt: p1 UNSCOPED list of own (isPatient)',   assertSucceeds(getDocs(collection(p1, 'patients/P1/appointments'))));
  await check('appt: p2 UNSCOPED list of P1 DENIED',         assertFails(getDocs(collection(p2, 'patients/P1/appointments'))));
  await check('cg-appt: ownerA lists where clinicId==A',     assertSucceeds(getDocs(query(collectionGroup(ownerA, 'appointments'), where('clinicId', '==', 'clinicA')))));
  await check('cg-appt: doctorA lists where clinicId==A',    assertSucceeds(getDocs(query(collectionGroup(doctorA, 'appointments'), where('clinicId', '==', 'clinicA')))));
  await check('cg-appt: ownerA UNSCOPED list DENIED',        assertFails(getDocs(collectionGroup(ownerA, 'appointments'))));
  await check('cg-appt: ownerB DENIED list clinicA appts',   assertFails(getDocs(query(collectionGroup(ownerB, 'appointments'), where('clinicId', '==', 'clinicA')))));
  await check('cg-appt: P1 DENIED collectionGroup list',     assertFails(getDocs(query(collectionGroup(p1, 'appointments'), where('clinicId', '==', 'clinicA')))));

  console.log('\n── threads ────────────────────────────────────────────────');
  await check('thread: ownerA reads clinicA_P1',             assertSucceeds(getDoc(doc(ownerA, 'threads/clinicA_P1'))));
  await check('thread: P1 reads clinicA_P1',                 assertSucceeds(getDoc(doc(p1, 'threads/clinicA_P1'))));
  await check('thread: ownerB DENIED read clinicA_P1',       assertFails(getDoc(doc(ownerB, 'threads/clinicA_P1'))));
  await check('thread: ownerA lists own',                    assertSucceeds(getDocs(query(collection(ownerA, 'threads'), where('clinicId', '==', 'clinicA')))));
  await check('thread: ownerB DENIED list clinicA',          assertFails(getDocs(query(collection(ownerB, 'threads'), where('clinicId', '==', 'clinicA')))));
  await check('thread: ownerA creates for clinicA',          assertSucceeds(setDoc(doc(ownerA, 'threads/clinicA_new'), { clinicId: 'clinicA', lastMessageAt: 2 })));
  await check('thread: ownerB DENIED create for clinicA',    assertFails(setDoc(doc(ownerB, 'threads/clinicA_evil'), { clinicId: 'clinicA', lastMessageAt: 2 })));

  console.log('\n── clinics_public ─────────────────────────────────────────');
  await check('public: guest reads clinics_public',          assertSucceeds(getDoc(doc(guest, 'clinics_public/clinicA'))));
  await check('public: ownerA writes own',                   assertSucceeds(setDoc(doc(ownerA, 'clinics_public/clinicA'), { name: 'A3' }, { merge: true })));
  await check('public: ownerB DENIED write clinicA',         assertFails(setDoc(doc(ownerB, 'clinics_public/clinicA'), { name: 'X' }, { merge: true })));
  await check('public: guest DENIED writes',                 assertFails(setDoc(doc(guest, 'clinics_public/clinicA'), { name: 'X' }, { merge: true })));
  await check('public bootstrap: no-claim owner writes own', assertSucceeds(setDoc(doc(ownerA_noclaim, 'clinics_public/clinicA'), { name: 'A4' }, { merge: true })));

  console.log('\n── users/{uid} + users/{uid}/saved ────────────────────────');
  await check('users: self reads own',                        assertSucceeds(getDoc(doc(ownerA, 'users/ownerA'))));
  await check('users: self writes own',                       assertSucceeds(setDoc(doc(ownerA, 'users/ownerA'), { clinicId: 'clinicA' }, { merge: true })));
  await check('users: ownerB DENIED reads users/ownerA',      assertFails(getDoc(doc(ownerB, 'users/ownerA'))));
  await check('users: guest DENIED reads users/ownerA',       assertFails(getDoc(doc(guest, 'users/ownerA'))));
  await check('users/saved: guest reads',                     assertSucceeds(getDoc(doc(guest, 'users/ownerA/saved/PP1'))));
  await check('users/saved: guest writes',                    assertSucceeds(setDoc(doc(guest, 'users/deviceX/saved/PPnew'), { at: 2 })));
  await check('users/saved: ownerB reads (public sub)',       assertSucceeds(getDoc(doc(ownerB, 'users/ownerA/saved/PP1'))));

  console.log('\n── patientCodes (fully server-only) ───────────────────────');
  // Every actor: DENIED on every op. patientCodes now server-only via CF.
  await check('codes: guest DENIED get',                      assertFails(getDoc(doc(guest, 'patientCodes/CODE1'))));
  await check('codes: guest DENIED list',                     assertFails(getDocs(collection(guest, 'patientCodes'))));
  await check('codes: guest DENIED create',                   assertFails(setDoc(doc(guest, 'patientCodes/CODE_g'), { clinicId: 'clinicA' })));
  await check('codes: guest DENIED update',                   assertFails(setDoc(doc(guest, 'patientCodes/CODE1'), { clinicId: 'clinicA' }, { merge: true })));
  await check('codes: guest DENIED delete',                   assertFails(deleteDoc(doc(guest, 'patientCodes/CODE1'))));
  await check('codes: ownerA DENIED get',                     assertFails(getDoc(doc(ownerA, 'patientCodes/CODE1'))));
  await check('codes: ownerA DENIED list',                    assertFails(getDocs(collection(ownerA, 'patientCodes'))));
  await check('codes: ownerA DENIED create',                  assertFails(setDoc(doc(ownerA, 'patientCodes/CODE_oA'), { clinicId: 'clinicA', patientId: 'P2' })));
  await check('codes: ownerA DENIED update',                  assertFails(setDoc(doc(ownerA, 'patientCodes/CODE1'), { clinicId: 'clinicA' }, { merge: true })));
  await check('codes: ownerA DENIED delete',                  assertFails(deleteDoc(doc(ownerA, 'patientCodes/CODE1'))));
  await check('codes: doctorA DENIED get',                    assertFails(getDoc(doc(doctorA, 'patientCodes/CODE1'))));
  await check('codes: doctorA DENIED list',                   assertFails(getDocs(collection(doctorA, 'patientCodes'))));
  await check('codes: doctorA DENIED create',                 assertFails(setDoc(doc(doctorA, 'patientCodes/CODE_dA'), { clinicId: 'clinicA' })));
  await check('codes: doctorA DENIED update',                 assertFails(setDoc(doc(doctorA, 'patientCodes/CODE1'), { clinicId: 'clinicA' }, { merge: true })));
  await check('codes: doctorA DENIED delete',                 assertFails(deleteDoc(doc(doctorA, 'patientCodes/CODE1'))));
  await check('codes: P1 DENIED get',                         assertFails(getDoc(doc(p1, 'patientCodes/CODE1'))));
  await check('codes: P1 DENIED list',                        assertFails(getDocs(collection(p1, 'patientCodes'))));
  await check('codes: P1 DENIED create',                      assertFails(setDoc(doc(p1, 'patientCodes/CODE_p1'), { clinicId: 'clinicA' })));
  await check('codes: P1 DENIED update',                      assertFails(setDoc(doc(p1, 'patientCodes/CODE1'), { clinicId: 'clinicA' }, { merge: true })));
  await check('codes: P1 DENIED delete',                      assertFails(deleteDoc(doc(p1, 'patientCodes/CODE1'))));

  console.log('\n── ai_logs ────────────────────────────────────────────────');
  await check('ai_logs: ownerA DENIED reads',                 assertFails(getDoc(doc(ownerA, 'ai_logs/L1'))));
  await check('ai_logs: ownerA DENIED writes',                assertFails(setDoc(doc(ownerA, 'ai_logs/L2'), { a: 1 })));
  await check('ai_logs: guest DENIED reads',                  assertFails(getDoc(doc(guest, 'ai_logs/L1'))));

  console.log('\n── list scoping (defense-in-depth) ────────────────────────');
  await check('list: ownerA lists own patients',              assertSucceeds(getDocs(collection(ownerA, 'clinics/clinicA/patients'))));
  await check('list: P1 DENIED list all clinicA patients',    assertFails(getDocs(collection(p1, 'clinics/clinicA/patients'))));
  await check('list: P1 lists own sessions',                  assertSucceeds(getDocs(collection(p1, 'clinics/clinicA/patients/P1/sessions'))));
  await check('list: guest DENIED lists clinic settings',     assertFails(getDocs(collection(guest, 'clinics/clinicA/settings'))));
  await check('list: guest reads clinic media collection',    assertSucceeds(getDocs(collection(guest, 'clinics/clinicA/media'))));

  await env.cleanup();
  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
}
main().catch((e) => { console.error(e); process.exit(1); });
