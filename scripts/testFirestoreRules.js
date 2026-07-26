const { initializeTestEnvironment, assertSucceeds } = require('@firebase/rules-unit-testing');
const { readFileSync } = require('fs');
const { doc, getDoc } = require('firebase/firestore');

const PROJECT_ID = 'dental-jawad';
const HOST = '127.0.0.1';
const PORT = 8080;

async function main() {
  const testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: { rules: readFileSync('firebase/firestore.rules', 'utf8'), host: HOST, port: PORT },
  });
  let passed = 0, failed = 0;
  async function check(name, p) {
    try { await p; console.log('  PASS:', name); passed++; }
    catch (e) { console.error('  FAIL:', name, '-', e.message); failed++; }
  }
  const unauth = testEnv.unauthenticatedContext();
  await check('baseline: unauth read succeeds under current open rules',
    assertSucceeds(getDoc(doc(unauth.firestore(), 'clinics/testClinic'))));
  await testEnv.cleanup();
  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
}
main().catch((e) => { console.error(e); process.exit(1); });
