const { initializeTestEnvironment, assertSucceeds, assertFails } = require('@firebase/rules-unit-testing');
const { readFileSync } = require('fs');
const { ref, uploadString, getBytes } = require('firebase/storage');

const PROJECT_ID = 'demo-rules-test', HOST = '127.0.0.1', PORT = 9199;
let passed = 0, failed = 0;
async function check(name, p) { try { await p; console.log('  PASS:', name); passed++; } catch (e) { console.error('  FAIL:', name, '-', e.message); failed++; } }

async function main() {
  const env = await initializeTestEnvironment({ projectId: PROJECT_ID, storage: { rules: readFileSync('firebase/storage.rules.candidate', 'utf8'), host: HOST, port: PORT } });
  await env.clearStorage();

  const ownerA = env.authenticatedContext('ownerA', { role: 'owner', clinicId: 'clinicA' }).storage();
  const doctorA = env.authenticatedContext('doctorA', { role: 'doctor', clinicId: 'clinicA' }).storage();
  const p1 = env.authenticatedContext('P1', { role: 'patient', clinicId: 'clinicA', patientId: 'P1' }).storage();
  const p2 = env.authenticatedContext('P2', { role: 'patient', clinicId: 'clinicA', patientId: 'P2' }).storage();
  const ownerB = env.authenticatedContext('ownerB', { role: 'owner', clinicId: 'clinicB' }).storage();
  const guest = env.unauthenticatedContext().storage();

  const up = (s, path) => uploadString(ref(s, path), 'data');
  const rd = (s, path) => getBytes(ref(s, path));

  await env.withSecurityRulesDisabled(async (ctx) => {
    const s = ctx.storage();
    await uploadString(ref(s, 'clinics/clinicA/profile.jpg'), 'p');
    await uploadString(ref(s, 'clinics/clinicA/patients/P1/messages/seed.jpg'), 'm');
    await uploadString(ref(s, 'clinics/clinicA/patients/P1/images/seed.jpg'), 'i');
  });

  await check('P1 writes own chat image', assertSucceeds(up(p1, 'clinics/clinicA/patients/P1/messages/m1.jpg')));
  await check('P1 reads own chat image', assertSucceeds(rd(p1, 'clinics/clinicA/patients/P1/messages/seed.jpg')));
  await check('ownerA writes patient chat image', assertSucceeds(up(ownerA, 'clinics/clinicA/patients/P1/messages/m2.jpg')));
  await check('doctorA writes patient chat image', assertSucceeds(up(doctorA, 'clinics/clinicA/patients/P1/messages/m3.jpg')));
  await check('P2 CANNOT write P1 chat image', assertFails(up(p2, 'clinics/clinicA/patients/P1/messages/x.jpg')));
  await check('ownerB CANNOT write clinicA chat image', assertFails(up(ownerB, 'clinics/clinicA/patients/P1/messages/x.jpg')));
  await check('guest CANNOT write chat image', assertFails(up(guest, 'clinics/clinicA/patients/P1/messages/x.jpg')));
  await check('guest CANNOT read chat image', assertFails(rd(guest, 'clinics/clinicA/patients/P1/messages/seed.jpg')));

  await check('ownerA writes patient clinical image', assertSucceeds(up(ownerA, 'clinics/clinicA/patients/P1/images/a.jpg')));
  await check('P1 reads own clinical image', assertSucceeds(rd(p1, 'clinics/clinicA/patients/P1/images/seed.jpg')));
  await check('P1 CANNOT write clinical image', assertFails(up(p1, 'clinics/clinicA/patients/P1/images/b.jpg')));

  await check('guest reads clinic profile.jpg', assertSucceeds(rd(guest, 'clinics/clinicA/profile.jpg')));
  await check('ownerA writes clinic profile.jpg', assertSucceeds(up(ownerA, 'clinics/clinicA/profile.jpg')));
  await check('doctorA CANNOT write clinic profile.jpg', assertFails(up(doctorA, 'clinics/clinicA/profile.jpg')));
  await check('ownerB CANNOT write clinicA profile.jpg', assertFails(up(ownerB, 'clinics/clinicA/profile.jpg')));

  await env.cleanup();
  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
}
main().catch((e) => { console.error(e); process.exit(1); });
