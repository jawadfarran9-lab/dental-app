const { initializeTestEnvironment, assertSucceeds, assertFails } = require('@firebase/rules-unit-testing');
const { readFileSync } = require('fs');
const { ref, uploadString, getBytes } = require('firebase/storage');

const PROJECT_ID = 'demo-rules-test', HOST = '127.0.0.1', PORT = 9199;
let passed = 0, failed = 0;
async function check(name, p) { try { await p; console.log('  PASS:', name); passed++; } catch (e) { console.error('  FAIL:', name, '-', e.message); failed++; } }

async function main() {
  const env = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    storage: { rules: readFileSync('firebase/storage.rules.candidate', 'utf8'), host: HOST, port: PORT }
  });
  await env.clearStorage();

  const ownerA  = env.authenticatedContext('ownerA',  { role: 'owner',  clinicId: 'clinicA' }).storage();
  const doctorA = env.authenticatedContext('doctorA', { role: 'doctor', clinicId: 'clinicA' }).storage();
  const p1      = env.authenticatedContext('P1',      { role: 'patient', clinicId: 'clinicA', patientId: 'P1' }).storage();
  const p2      = env.authenticatedContext('P2',      { role: 'patient', clinicId: 'clinicA', patientId: 'P2' }).storage();
  const ownerB  = env.authenticatedContext('ownerB',  { role: 'owner',  clinicId: 'clinicB' }).storage();
  const guest   = env.unauthenticatedContext().storage();

  const up = (s, path) => uploadString(ref(s, path), 'data');
  const rd = (s, path) => getBytes(ref(s, path));

  await env.withSecurityRulesDisabled(async (ctx) => {
    const s = ctx.storage();
    // Public + clinic-level assets
    await uploadString(ref(s, 'public/clinics/clinicA/hero.jpg'), 'hero');
    await uploadString(ref(s, 'clinics/clinicA/profile.jpg'), 'profile');
    await uploadString(ref(s, 'clinics/clinicA/branding/logo.png'), 'brand');
    await uploadString(ref(s, 'clinics/clinicA/stories/st1.jpg'), 'story');
    // Patient-scoped seeds
    await uploadString(ref(s, 'clinics/clinicA/patients/P1/messages/seed.jpg'), 'msg');
    await uploadString(ref(s, 'clinics/clinicA/patients/P1/sessions/S1/photos/seed.jpg'), 'sess');
    await uploadString(ref(s, 'clinics/clinicA/patients/P1/xrays/seed.jpg'), 'xray');
    await uploadString(ref(s, 'clinics/clinicA/patients/P1/images/seed.jpg'), 'img');
    // Other clinic asset (catch-all)
    await uploadString(ref(s, 'clinics/clinicA/highlights/h1.jpg'), 'h');
  });

  console.log('\n── clinic profile.jpg (public read, owner write) ─────────');
  await check('profile: guest reads',                    assertSucceeds(rd(guest, 'clinics/clinicA/profile.jpg')));
  await check('profile: p1 reads',                       assertSucceeds(rd(p1, 'clinics/clinicA/profile.jpg')));
  await check('profile: ownerA writes',                  assertSucceeds(up(ownerA, 'clinics/clinicA/profile.jpg')));
  await check('profile: doctorA DENIED write',           assertFails(up(doctorA, 'clinics/clinicA/profile.jpg')));
  await check('profile: ownerB DENIED write clinicA',    assertFails(up(ownerB, 'clinics/clinicA/profile.jpg')));
  await check('profile: p1 DENIED write',                assertFails(up(p1, 'clinics/clinicA/profile.jpg')));

  console.log('\n── public/clinics/{cid}/** (public read, owner write) ───');
  await check('public: guest reads hero.jpg',            assertSucceeds(rd(guest, 'public/clinics/clinicA/hero.jpg')));
  await check('public: ownerA writes hero.jpg',          assertSucceeds(up(ownerA, 'public/clinics/clinicA/hero2.jpg')));
  await check('public: ownerB DENIED write clinicA',     assertFails(up(ownerB, 'public/clinics/clinicA/evil.jpg')));
  await check('public: doctorA DENIED write clinicA',    assertFails(up(doctorA, 'public/clinics/clinicA/doctorAsset.jpg')));
  await check('public: guest DENIED write',              assertFails(up(guest, 'public/clinics/clinicA/guest.jpg')));

  console.log('\n── branding (staff+patient-of-clinic read, owner write) ─');
  await check('branding: ownerA writes',                 assertSucceeds(up(ownerA, 'clinics/clinicA/branding/logo.png')));
  await check('branding: doctorA reads',                 assertSucceeds(rd(doctorA, 'clinics/clinicA/branding/logo.png')));
  await check('branding: p1 reads (patient of A)',       assertSucceeds(rd(p1, 'clinics/clinicA/branding/logo.png')));
  await check('branding: guest DENIED read',             assertFails(rd(guest, 'clinics/clinicA/branding/logo.png')));
  await check('branding: ownerB DENIED read clinicA',    assertFails(rd(ownerB, 'clinics/clinicA/branding/logo.png')));
  await check('branding: doctorA DENIED write',          assertFails(up(doctorA, 'clinics/clinicA/branding/new.png')));
  await check('branding: p1 DENIED write',               assertFails(up(p1, 'clinics/clinicA/branding/new.png')));

  console.log('\n── stories (public read, owner write) ────────────────────');
  await check('stories: guest reads',                    assertSucceeds(rd(guest, 'clinics/clinicA/stories/st1.jpg')));
  await check('stories: p1 reads',                       assertSucceeds(rd(p1, 'clinics/clinicA/stories/st1.jpg')));
  await check('stories: ownerA writes',                  assertSucceeds(up(ownerA, 'clinics/clinicA/stories/new.jpg')));
  await check('stories: ownerB DENIED write clinicA',    assertFails(up(ownerB, 'clinics/clinicA/stories/evil.jpg')));
  await check('stories: doctorA DENIED write',           assertFails(up(doctorA, 'clinics/clinicA/stories/doctor.jpg')));

  console.log('\n── patients/{pid}/messages (staff or that-patient) ──────');
  await check('msg: ownerA writes',                       assertSucceeds(up(ownerA, 'clinics/clinicA/patients/P1/messages/m2.jpg')));
  await check('msg: doctorA writes',                      assertSucceeds(up(doctorA, 'clinics/clinicA/patients/P1/messages/m3.jpg')));
  await check('msg: p1 writes own',                       assertSucceeds(up(p1, 'clinics/clinicA/patients/P1/messages/m1.jpg')));
  await check('msg: p1 reads own',                        assertSucceeds(rd(p1, 'clinics/clinicA/patients/P1/messages/seed.jpg')));
  await check('msg: ownerA reads',                        assertSucceeds(rd(ownerA, 'clinics/clinicA/patients/P1/messages/seed.jpg')));
  await check('msg: p2 DENIED write P1 msg',              assertFails(up(p2, 'clinics/clinicA/patients/P1/messages/x.jpg')));
  await check('msg: p2 DENIED read P1 msg',               assertFails(rd(p2, 'clinics/clinicA/patients/P1/messages/seed.jpg')));
  await check('msg: ownerB DENIED read P1 msg',           assertFails(rd(ownerB, 'clinics/clinicA/patients/P1/messages/seed.jpg')));
  await check('msg: ownerB DENIED write P1 msg',          assertFails(up(ownerB, 'clinics/clinicA/patients/P1/messages/evil.jpg')));
  await check('msg: guest DENIED read',                   assertFails(rd(guest, 'clinics/clinicA/patients/P1/messages/seed.jpg')));
  await check('msg: guest DENIED write',                  assertFails(up(guest, 'clinics/clinicA/patients/P1/messages/g.jpg')));

  console.log('\n── patients/{pid}/sessions/{sid}/photos (staff write, staff+patient read) ─');
  await check('sess-photo: ownerA writes',                assertSucceeds(up(ownerA, 'clinics/clinicA/patients/P1/sessions/S1/photos/x.jpg')));
  await check('sess-photo: doctorA writes',               assertSucceeds(up(doctorA, 'clinics/clinicA/patients/P1/sessions/S1/photos/y.jpg')));
  await check('sess-photo: p1 reads own',                 assertSucceeds(rd(p1, 'clinics/clinicA/patients/P1/sessions/S1/photos/seed.jpg')));
  await check('sess-photo: ownerA reads',                 assertSucceeds(rd(ownerA, 'clinics/clinicA/patients/P1/sessions/S1/photos/seed.jpg')));
  await check('sess-photo: p1 DENIED write',              assertFails(up(p1, 'clinics/clinicA/patients/P1/sessions/S1/photos/z.jpg')));
  await check('sess-photo: p2 DENIED read',               assertFails(rd(p2, 'clinics/clinicA/patients/P1/sessions/S1/photos/seed.jpg')));
  await check('sess-photo: ownerB DENIED read',           assertFails(rd(ownerB, 'clinics/clinicA/patients/P1/sessions/S1/photos/seed.jpg')));
  await check('sess-photo: guest DENIED read',            assertFails(rd(guest, 'clinics/clinicA/patients/S1/sessions/S1/photos/seed.jpg')));

  console.log('\n── patients/{pid}/xrays (staff-only catch-all) ──────────');
  await check('xray: ownerA writes',                      assertSucceeds(up(ownerA, 'clinics/clinicA/patients/P1/xrays/xr1.jpg')));
  await check('xray: doctorA writes',                     assertSucceeds(up(doctorA, 'clinics/clinicA/patients/P1/xrays/xr2.jpg')));
  await check('xray: ownerA reads',                       assertSucceeds(rd(ownerA, 'clinics/clinicA/patients/P1/xrays/seed.jpg')));
  await check('xray: p1 DENIED read own xray',            assertFails(rd(p1, 'clinics/clinicA/patients/P1/xrays/seed.jpg')));
  await check('xray: p1 DENIED write',                    assertFails(up(p1, 'clinics/clinicA/patients/P1/xrays/z.jpg')));
  await check('xray: ownerB DENIED read',                 assertFails(rd(ownerB, 'clinics/clinicA/patients/P1/xrays/seed.jpg')));
  await check('xray: ownerB DENIED write',                assertFails(up(ownerB, 'clinics/clinicA/patients/P1/xrays/evil.jpg')));

  console.log('\n── patients/{pid}/images (staff-only catch-all) ─────────');
  await check('img: ownerA writes',                       assertSucceeds(up(ownerA, 'clinics/clinicA/patients/P1/images/a.jpg')));
  await check('img: ownerA reads',                        assertSucceeds(rd(ownerA, 'clinics/clinicA/patients/P1/images/seed.jpg')));
  await check('img: p1 DENIED read',                      assertFails(rd(p1, 'clinics/clinicA/patients/P1/images/seed.jpg')));
  await check('img: p1 DENIED write',                     assertFails(up(p1, 'clinics/clinicA/patients/P1/images/b.jpg')));
  await check('img: ownerB DENIED read',                  assertFails(rd(ownerB, 'clinics/clinicA/patients/P1/images/seed.jpg')));
  await check('img: ownerB DENIED write',                 assertFails(up(ownerB, 'clinics/clinicA/patients/P1/images/evil.jpg')));

  console.log('\n── clinics/{cid}/<other>/** (clinic catch-all: staff read, owner write) ─');
  await check('other: ownerA reads',                      assertSucceeds(rd(ownerA, 'clinics/clinicA/highlights/h1.jpg')));
  await check('other: doctorA reads',                     assertSucceeds(rd(doctorA, 'clinics/clinicA/highlights/h1.jpg')));
  await check('other: p1 DENIED read',                    assertFails(rd(p1, 'clinics/clinicA/highlights/h1.jpg')));
  await check('other: ownerB DENIED read',                assertFails(rd(ownerB, 'clinics/clinicA/highlights/h1.jpg')));
  await check('other: guest DENIED read',                 assertFails(rd(guest, 'clinics/clinicA/highlights/h1.jpg')));
  await check('other: ownerA writes',                     assertSucceeds(up(ownerA, 'clinics/clinicA/highlights/h2.jpg')));
  await check('other: doctorA DENIED write (owner-only)', assertFails(up(doctorA, 'clinics/clinicA/highlights/hDoc.jpg')));
  await check('other: p1 DENIED write',                   assertFails(up(p1, 'clinics/clinicA/highlights/hP1.jpg')));
  await check('other: ownerB DENIED write clinicA',       assertFails(up(ownerB, 'clinics/clinicA/highlights/evil.jpg')));

  await env.cleanup();
  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
}
main().catch((e) => { console.error(e); process.exit(1); });
