/**
 * PHASE 1 — READ-ONLY AUDIT: Clinic Status Field Analysis
 *
 * Scans every document in the `clinics` collection and reports:
 *   - Whether `status` field exists and its value
 *   - Whether `subscribed` field exists and its value
 *   - Classification into categories (active / pending_subscription / missing / other)
 *
 * SAFETY: This script performs ZERO writes. Read-only analysis only.
 *
 * Usage:  node scripts/auditClinicStatus.js
 */

const { initializeApp } = require('firebase/app');
const { collection, getDocs, getFirestore } = require('firebase/firestore');

// ── Firebase config (same as app) ────────────────────────────────────────
const firebaseConfig = {
  apiKey: 'AIzaSyCyei5KZ_ROWZfBbMClSY02tgVHgtGblag',
  authDomain: 'dental-jawad.firebaseapp.com',
  projectId: 'dental-jawad',
  storageBucket: 'dental-jawad.appspot.com',
  messagingSenderId: '256500365668',
  appId: '1:256500365668:web:9410f076de32a7bc51e271',
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ── Helpers ──────────────────────────────────────────────────────────────
function separator(title) {
  console.log('\n' + '='.repeat(70));
  console.log(`  ${title}`);
  console.log('='.repeat(70));
}

// ── Main audit ───────────────────────────────────────────────────────────
async function runAudit() {
  separator('PHASE 1 — CLINIC STATUS AUDIT (READ-ONLY)');
  console.log('Scanning clinics collection...\n');

  const snapshot = await getDocs(collection(db, 'clinics'));

  const totalDocs = snapshot.size;
  console.log(`Total clinic documents: ${totalDocs}\n`);

  if (totalDocs === 0) {
    console.log('No clinic documents found. Audit complete.');
    process.exit(0);
  }

  // Buckets
  const categories = {
    active: [],
    pending_subscription: [],
    missing_status: [],
    other: [],
  };

  let subscribedFieldMissing = 0;

  snapshot.forEach((docSnap) => {
    const id = docSnap.id;
    const data = docSnap.data();

    const hasStatus = data.status !== undefined && data.status !== null;
    const statusVal = hasStatus ? data.status : undefined;
    const hasSubscribed = data.subscribed !== undefined;
    const subscribedVal = hasSubscribed ? data.subscribed : undefined;

    if (!hasSubscribed) subscribedFieldMissing++;

    const entry = {
      id,
      status: hasStatus ? statusVal : '(missing)',
      subscribed: hasSubscribed ? subscribedVal : '(missing)',
      ownerUid: data.ownerUid || '(missing)',
    };

    if (!hasStatus) {
      categories.missing_status.push(entry);
    } else if (statusVal === 'active') {
      categories.active.push(entry);
    } else if (statusVal === 'pending_subscription') {
      categories.pending_subscription.push(entry);
    } else {
      categories.other.push(entry);
    }
  });

  // ── Report ─────────────────────────────────────────────────────────────
  separator('CATEGORY COUNTS');
  console.log(`  active:                ${categories.active.length}`);
  console.log(`  pending_subscription:  ${categories.pending_subscription.length}`);
  console.log(`  missing status:        ${categories.missing_status.length}`);
  console.log(`  other values:          ${categories.other.length}`);
  console.log(`  ────────────────────────────`);
  console.log(`  TOTAL:                 ${totalDocs}`);

  separator('SUBSCRIBED FIELD CHECK');
  if (subscribedFieldMissing === 0) {
    console.log('  Every document contains the `subscribed` field.');
  } else {
    console.log(`  ${subscribedFieldMissing} document(s) are MISSING the \`subscribed\` field.`);
  }

  // Detail: active
  if (categories.active.length > 0) {
    separator('ACTIVE DOCUMENTS');
    categories.active.forEach((d) => {
      console.log(`  ${d.id}  |  subscribed=${d.subscribed}  |  ownerUid=${d.ownerUid}`);
    });
  }

  // Detail: pending_subscription
  if (categories.pending_subscription.length > 0) {
    separator('PENDING_SUBSCRIPTION DOCUMENTS');
    categories.pending_subscription.forEach((d) => {
      console.log(`  ${d.id}  |  subscribed=${d.subscribed}  |  ownerUid=${d.ownerUid}`);
    });
  }

  // Detail: missing status
  if (categories.missing_status.length > 0) {
    separator('MISSING STATUS DOCUMENTS');
    console.log('  These documents need backfill:\n');
    categories.missing_status.forEach((d) => {
      console.log(`  { id: "${d.id}", subscribed: ${d.subscribed} }`);
    });
  }

  // Detail: other/unexpected
  if (categories.other.length > 0) {
    separator('OTHER / UNEXPECTED STATUS VALUES');
    categories.other.forEach((d) => {
      console.log(`  ${d.id}  |  status="${d.status}"  |  subscribed=${d.subscribed}`);
    });
  }

  separator('AUDIT COMPLETE — NO DATA WAS MODIFIED');
  console.log('  Ready for Phase 2 review.\n');

  process.exit(0);
}

runAudit().catch((err) => {
  console.error('Audit failed:', err);
  process.exit(1);
});
