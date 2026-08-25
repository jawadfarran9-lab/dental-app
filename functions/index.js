const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const Stripe = require('stripe');

// Initialize admin SDK
admin.initializeApp();

// OpenAI integration (install: npm install openai in functions/)
let openai;
try {
  const { OpenAI } = require('openai');
  const openaiKey = (functions.config() && functions.config().openai && functions.config().openai.key) || process.env.OPENAI_API_KEY || '';
  if (openaiKey) {
    openai = new OpenAI({ apiKey: openaiKey });
  }
} catch (err) {
  console.warn('[aiChat] OpenAI package not installed or key missing. Install: npm install openai');
}

// Use Stripe secret from functions config (set via firebase CLI)
const stripeSecret = (functions.config() && functions.config().stripe && functions.config().stripe.secret) || process.env.STRIPE_SECRET || "sk_test_PLACEHOLDER";
const stripe = Stripe(stripeSecret);

const app = express();
app.use(cors({ origin: true }));
app.use(bodyParser.json());

// A placeholder Stripe webhook handler.
// In production you must verify the webhook signature using functions.config().stripe.webhook_secret
app.post('/stripeWebhook', bodyParser.raw({ type: 'application/json' }), async (req, res) => {
  // NOTE: For simplicity this is a placeholder. Verify signatures in production.
  let event;
  try {
    event = JSON.parse(req.body.toString());
  } catch (err) {
    console.error('Webhook parse error', err);
    return res.status(400).send('invalid payload');
  }

  // Example: handle checkout.session.completed
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    // TODO: Create clinic record and send email to clinic with access code/password
    // e.g. admin.firestore().collection('clinics').doc(...).set({...})
    console.log('Checkout session completed:', session.id);
  }

  res.status(200).send('ok');
});

// exports.api = functions.https.onRequest(app);  // TEMP: disabled — HTTP fn fails to deploy on Node 20 (deprecated functions.config()); re-enable after migrating Stripe/AI-chat config to env params

// You can add more functions here: create clinic user, set custom claims for clinics, etc.

// ============================================================
// AI CHAT ENDPOINT - Streaming Support (SSE) with AI Pro
// ============================================================
/**
 * POST /aiChat
 * Body: {
 *   message: string,
 *   user: { id, role },
 *   clinic: { id, name },
 *   language: string,
 *   history: Array<{ role, content }>,
 *   includeAIPro?: boolean  // NEW: AI Pro subscription flag
 * }
 * 
 * If includeAIPro is not provided, fetches from Firestore:
 *   - clinics/{clinic.id}.includeAIPro
 * 
 * Returns: SSE stream with delta chunks and category
 *   - If Pro: Advanced responses with detailed analysis
 *   - If Free: Basic responses with upgrade prompt
 */
app.post('/aiChat', async (req, res) => {
  let logData = {
    startTime: new Date(),
    status: 'started',
  };

  try {
    const { message, user, clinic, language, history, includeAIPro: requestIncludeAIPro } = req.body;

    // Validate required fields
    if (!message || typeof message !== 'string') {
      console.error('[aiChat] Invalid request: message required');
      return res.status(400).json({ error: 'message_required', message: 'message field is required' });
    }

    // Verify OpenAI is available
    if (!openai) {
      console.error('[aiChat] OpenAI not configured. Set OPENAI_API_KEY or firebase config.');
      return res.status(503).json({ 
        error: 'ai_service_unavailable',
        message: 'OpenAI service not configured. Please contact support.',
      });
    }

    // Determine AI Pro status
    let includeAIPro = requestIncludeAIPro === true; // explicit true from client
    let aiProSource = 'request';

    // If not provided in request, check Firestore as fallback
    if (requestIncludeAIPro === undefined && clinic?.id) {
      try {
        const db = admin.firestore();
        const clinicRef = db.collection('clinics').doc(clinic.id);
        const clinicSnap = await clinicRef.get();
        
        if (clinicSnap.exists) {
          includeAIPro = clinicSnap.data().includeAIPro === true;
          aiProSource = 'firestore';
          logData.firestoreRead = true;
        }
      } catch (err) {
        console.warn('[aiChat] Failed to read includeAIPro from Firestore:', err.message);
        logData.firestoreError = err.message;
        aiProSource = 'firestore_fallback';
      }
    }

    logData.includeAIPro = includeAIPro;
    logData.aiProSource = aiProSource;

    // Build context-aware system prompt
    const systemPrompt = buildAISystemPrompt(user, clinic, language, includeAIPro);

    // Build conversation history for OpenAI
    const messages = [
      { role: 'system', content: systemPrompt },
      ...(history || []).slice(-10).map(h => ({ role: h.role, content: h.content })),
      { role: 'user', content: message },
    ];

    // Set OpenAI parameters based on AI Pro status
    const openaiParams = getOpenAIParams(includeAIPro);
    logData.model = openaiParams.model;
    logData.maxTokens = openaiParams.max_tokens;

    // Set up SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-AI-Pro', includeAIPro ? 'true' : 'false');
    res.flushHeaders();

    let fullText = '';
    let category = 'dental'; // default

    // Stream from OpenAI
    console.log(`[aiChat] Streaming response (Pro: ${includeAIPro}, Model: ${openaiParams.model})`);
    
    const stream = await openai.chat.completions.create({
      model: openaiParams.model,
      messages,
      temperature: openaiParams.temperature,
      max_tokens: openaiParams.max_tokens,
      stream: true,
    });

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content || '';
      if (delta) {
        fullText += delta;
        res.write(`data: ${JSON.stringify({ delta })}\n\n`);
      }
    }

    // Classify response after completion
    category = classifyAIResponse(fullText, message);

    // If not Pro user, optionally add upgrade suggestion
    if (!includeAIPro && category === 'dental') {
      const upgradeSuggestion = buildUpgradeSuggestion(language);
      res.write(`data: ${JSON.stringify({ delta: `\n\n${upgradeSuggestion}` })}\n\n`);
      fullText += `\n\n${upgradeSuggestion}`;
    }

    // Send final category and done signal
    res.write(`data: ${JSON.stringify({ category })}\n\n`);
    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();

    logData.status = 'success';
    logData.category = category;
    logData.responseLength = fullText.length;
    logData.endTime = new Date();

    // Log interaction for audit and analytics
    const db = admin.firestore();
    await db.collection('ai_logs').add({
      userId: user?.id,
      clinicId: clinic?.id,
      message,
      response: fullText,
      category,
      language,
      includeAIPro,
      aiProSource,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      ...logData,
    }).catch(err => {
      console.warn('[aiChat] Log write failed:', err.message);
      logData.logError = err.message;
    });

    console.log(`[aiChat] Success (Pro: ${includeAIPro}, Category: ${category}, Length: ${fullText.length})`);

  } catch (err) {
    logData.status = 'error';
    logData.error = err.message;
    logData.errorCode = err.code;
    logData.endTime = new Date();

    console.error('[aiChat] Error:', err.message, err);
    
    // If headers not sent, return JSON error
    if (!res.headersSent) {
      return res.status(500).json({ 
        error: 'ai_request_failed', 
        details: err.message,
        logId: logData.timestamp 
      });
    }
    
    // If streaming started, send error event
    res.write(`data: ${JSON.stringify({ error: 'stream_failed', done: true })}\n\n`);
    res.end();
  }
});

/**
 * Build system prompt based on user context and AI Pro status
 */
function buildAISystemPrompt(user, clinic, language, includeAIPro) {
  const lang = language || 'en';
  const role = user?.role || 'patient';
  const clinicName = clinic?.name || 'dental clinic';

  const basePrompts = {
    en: {
      base: `You are a helpful dental assistant for ${clinicName}. The user is a ${role}.`,
      guidance: `Provide accurate, professional dental advice. If the question is urgent (pain, bleeding, trauma), 
mark it as emergency. If it's not dental-related, politely redirect. Keep responses concise and helpful.`,
      pro: `You have access to advanced features. Provide detailed, comprehensive responses with:
- Specific treatment recommendations
- Condition analysis and explanations
- Preventive care suggestions
- Relevant medical references`,
    },
    ar: {
      base: `أنت مساعد طبي للأسنان في ${clinicName}. المستخدم هو ${role === 'patient' ? 'مريض' : 'طبيب'}.`,
      guidance: `قدم نصائح طبية دقيقة ومهنية. إذا كان السؤال عاجلاً (ألم، نزيف، صدمة)، وضّح الطوارئ.
إذا لم يكن متعلقاً بالأسنان، أعِد التوجيه بلطف. اجعل الردود موجزة ومفيدة.`,
      pro: `لديك إمكانية الوصول إلى ميزات متقدمة. قدم ردوداً تفصيلية وشاملة تشمل:
- توصيات العلاج المحددة
- تحليل الحالات والشروحات
- اقتراحات الرعاية الوقائية
- المراجع الطبية ذات الصلة`,
    },
  };

  const prompts = basePrompts[lang] || basePrompts.en;
  let fullPrompt = `${prompts.base} ${prompts.guidance}`;
  
  if (includeAIPro) {
    fullPrompt += ` ${prompts.pro}`;
  }

  return fullPrompt;
}

/**
 * Get OpenAI parameters based on AI Pro status
 */
function getOpenAIParams(includeAIPro) {
  return {
    model: 'gpt-4o',
    temperature: includeAIPro ? 0.6 : 0.7,  // More consistent for Pro
    max_tokens: includeAIPro ? 1000 : 500,  // Double tokens for Pro users
  };
}

/**
 * Build upgrade suggestion based on language
 */
function buildUpgradeSuggestion(language) {
  const lang = language || 'en';
  
  const suggestions = {
    en: `\n✨ **Upgrade to AI Pro** to unlock advanced features:\n- Detailed treatment recommendations\n- In-depth condition analysis\n- Preventive care suggestions\n- And much more!`,
    ar: `\n✨ **ترقيَّة إلى AI Pro** لفتح ميزات متقدمة:\n- توصيات علاج تفصيلية\n- تحليل شامل للحالات\n- اقتراحات العناية الوقائية\n- والمزيد!`,
  };

  return suggestions[lang] || suggestions.en;
}

/**
 * Classify AI response into categories
 */
function classifyAIResponse(response, userMessage) {
  const text = (response + ' ' + userMessage).toLowerCase();

  // Emergency keywords
  const emergencyKeywords = [
    'emergency', 'urgent', 'severe pain', 'bleeding', 'trauma', 'swelling',
    'طوارئ', 'عاجل', 'ألم شديد', 'نزيف', 'صدمة', 'تورم',
  ];
  if (emergencyKeywords.some(kw => text.includes(kw))) {
    return 'emergency';
  }

  // Warning keywords
  const warningKeywords = [
    'caution', 'warning', 'consult', 'dentist', 'doctor',
    'تحذير', 'احذر', 'استشر', 'طبيب',
  ];
  if (warningKeywords.some(kw => text.includes(kw))) {
    return 'warning';
  }

  // Off-topic keywords
  const offTopicKeywords = [
    'not dental', 'unrelated', 'off-topic', 'غير متعلق', 'ليس عن الأسنان',
  ];
  if (offTopicKeywords.some(kw => text.includes(kw))) {
    return 'off-topic';
  }

  return 'dental'; // default
}

// ============================================================
// assignOwnerClaims — HTTPS callable (v1)
// ============================================================
// Stamps { role: 'owner', clinicId } onto the caller's Firebase Auth
// token. Verifies the caller via context.auth.uid (never trusts input),
// locates the caller's clinic by ownerUid, preserves any pre-existing
// custom claims, and is idempotent by construction.
//
// Returns: { clinicId }
exports.assignOwnerClaims = functions.https.onCall(async (_data, context) => {
  if (!context.auth) {
    console.error('[assignOwnerClaims] unauthenticated caller');
    throw new functions.https.HttpsError(
      'unauthenticated',
      'Sign in required to assign owner claims.'
    );
  }

  const uid = context.auth.uid;
  const db = admin.firestore();

  const snap = await db
    .collection('clinics')
    .where('ownerUid', '==', uid)
    .limit(2)
    .get();

  if (snap.empty) {
    console.error(`[assignOwnerClaims] no clinic found for uid=${uid}`);
    throw new functions.https.HttpsError(
      'not-found',
      'No clinic is owned by this account yet.'
    );
  }

  if (snap.size > 1) {
    console.error(`[assignOwnerClaims] multiple clinics found for uid=${uid}`);
    throw new functions.https.HttpsError(
      'failed-precondition',
      'Multiple clinics are owned by this account; cannot assign automatically.'
    );
  }

  const clinicId = snap.docs[0].id;

  const user = await admin.auth().getUser(uid);
  const existing = user.customClaims || {};

  await admin.auth().setCustomUserClaims(uid, {
    ...existing,
    role: 'owner',
    clinicId,
  });

  console.log(`[assignOwnerClaims] uid=${uid} clinicId=${clinicId}`);
  return { clinicId };
});

// ─────────────────────────────────────────────────────────────
// Phase 4.1 — owner-only creation of a real Firebase Auth doctor account.
// Clinic is taken from the OWNER's token (not input) → tenant isolation.
// No password is ever stored in Firestore.
// ─────────────────────────────────────────────────────────────
exports.createDoctorAccount = functions.https.onCall(async (data, context) => {
  // 1) must be authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Sign in required.');
  }
  // 2) must be a clinic owner; clinicId comes from the owner's verified token
  const callerRole = context.auth.token.role;
  const clinicId = context.auth.token.clinicId;
  if (callerRole !== 'owner' || !clinicId) {
    throw new functions.https.HttpsError('permission-denied', 'Only a clinic owner can create doctor accounts.');
  }
  // 3) validate input
  const email = (data && data.email ? String(data.email) : '').trim().toLowerCase();
  const password = data && data.password ? String(data.password) : '';
  if (!email || password.length < 6) {
    throw new functions.https.HttpsError('invalid-argument', 'A valid email and a password of at least 6 characters are required.');
  }

  // 4) create the Auth user (handle duplicate email)
  let userRecord;
  try {
    userRecord = await admin.auth().createUser({ email, password, emailVerified: false });
  } catch (e) {
    if (e && e.code === 'auth/email-already-exists') {
      // Auto-reclaim a stale email left by a removed/orphaned account.
      // Safe ONLY if the existing account is not active anywhere:
      // users/{uid} missing OR status === 'REMOVED'. An active account
      // (this clinic or another) is a real duplicate → refuse.
      try {
        const existingUser = await admin.auth().getUserByEmail(email);
        const uSnap = await admin.firestore().doc(`users/${existingUser.uid}`).get();
        const uStatus = uSnap.exists ? (uSnap.data() || {}).status : null;
        if (!uSnap.exists || uStatus === 'REMOVED') {
          await admin.auth().deleteUser(existingUser.uid);
          userRecord = await admin.auth().createUser({ email, password, emailVerified: false });
          console.log('[createDoctorAccount] reclaimed stale email for uid=' + existingUser.uid);
        } else {
          throw new functions.https.HttpsError('already-exists', 'A user with this email already exists.');
        }
      } catch (reclaimErr) {
        if (reclaimErr instanceof functions.https.HttpsError) throw reclaimErr;
        console.error('[createDoctorAccount] email reclaim failed', reclaimErr);
        throw new functions.https.HttpsError('already-exists', 'A user with this email already exists.');
      }
    } else {
      throw new functions.https.HttpsError('internal', 'Could not create the account.');
    }
  }
  const uid = userRecord.uid;

  // 5) stamp doctor claims (uid-as-memberId model)
  await admin.auth().setCustomUserClaims(uid, {
    role: 'doctor',
    clinicId,
    mustChangePassword: true,
  });

  // 6) derive a display name from the email local-part
  const local = email.split('@')[0] || 'Doctor';
  const displayName = local.charAt(0).toUpperCase() + local.slice(1);
  const db = admin.firestore();
  const { FieldValue } = require('firebase-admin/firestore');
  const ts = FieldValue.serverTimestamp();

  // 7) member doc (NO password field)
  await db.doc(`clinics/${clinicId}/members/${uid}`).set({
    id: uid, clinicId, displayName, email,
    role: 'doctor', status: 'ACTIVE',
    createdAt: ts, updatedAt: ts,
  }, { merge: true });

  // 8) user doc (NO password field)
  await db.doc(`users/${uid}`).set({
    clinicId, role: 'doctor', status: 'ACTIVE',
    email, displayName, lastLoginAt: null,
  }, { merge: true });

  console.log(`[createDoctorAccount] created doctor uid=${uid} for clinic=${clinicId}`);
  return { memberId: uid };
});

// ─────────────────────────────────────────────────────────────
// Phase 4.4-b — owner-only password reset for a doctor in the owner's clinic.
// Updates the doctor's REAL Firebase Auth password. Cross-tenant guarded:
// the target uid MUST be a doctor member of the caller-owner's clinic.
// No password is ever stored in Firestore.
// ─────────────────────────────────────────────────────────────
exports.updateDoctorPassword = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Sign in required.');
  }
  const callerRole = context.auth.token.role;
  const clinicId = context.auth.token.clinicId;
  if (callerRole !== 'owner' || !clinicId) {
    throw new functions.https.HttpsError('permission-denied', 'Only a clinic owner can change a doctor password.');
  }
  const uid = data && data.uid ? String(data.uid) : '';
  const password = data && data.password ? String(data.password) : '';
  if (!uid || password.length < 6) {
    throw new functions.https.HttpsError('invalid-argument', 'A valid doctor id and a password of at least 6 characters are required.');
  }

  const db = admin.firestore();
  const memberSnap = await db.doc(`clinics/${clinicId}/members/${uid}`).get();
  if (!memberSnap.exists) {
    throw new functions.https.HttpsError('not-found', 'No such doctor in your clinic.');
  }
  const member = memberSnap.data() || {};
  if (member.role !== 'doctor' || member.status === 'REMOVED') {
    throw new functions.https.HttpsError('failed-precondition', 'Target is not an active doctor in your clinic.');
  }

  try {
    await admin.auth().updateUser(uid, { password });
  } catch (e) {
    if (e && e.code === 'auth/user-not-found') {
      throw new functions.https.HttpsError('not-found', 'This doctor has no login account yet.');
    }
    if (e && e.code === 'auth/invalid-password') {
      throw new functions.https.HttpsError('invalid-argument', 'The password is not valid.');
    }
    throw new functions.https.HttpsError('internal', 'Could not update the password.');
  }

  const { FieldValue } = require('firebase-admin/firestore');
  await db.doc(`clinics/${clinicId}/members/${uid}`).set({ updatedAt: FieldValue.serverTimestamp() }, { merge: true });

  console.log(`[updateDoctorPassword] reset password for doctor uid=${uid} in clinic=${clinicId}`);
  return { ok: true };
});

// ─────────────────────────────────────────────────────────────
// Owner-only hard-delete of a doctor's Firebase Auth account.
// Frees the email (so it can be reused), revokes login, and clears
// custom claims. Firestore member/user docs are kept as REMOVED for
// history. Cross-tenant guarded: the target memberId MUST be a doctor
// member of the caller-owner's clinic.
// ─────────────────────────────────────────────────────────────
exports.removeDoctorAccount = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Sign in required.');
  }
  const callerRole = context.auth.token.role;
  const clinicId = context.auth.token.clinicId;
  if (callerRole !== 'owner' || !clinicId) {
    throw new functions.https.HttpsError('permission-denied', 'Only a clinic owner can remove doctor accounts.');
  }
  const memberId = (data && data.memberId ? String(data.memberId) : '').trim();
  if (!memberId) {
    throw new functions.https.HttpsError('invalid-argument', 'memberId is required.');
  }

  const db = admin.firestore();
  const memberSnap = await db.doc(`clinics/${clinicId}/members/${memberId}`).get();
  if (!memberSnap.exists) {
    throw new functions.https.HttpsError('not-found', 'Member not found.');
  }
  const member = memberSnap.data() || {};
  if (member.role !== 'doctor') {
    throw new functions.https.HttpsError('failed-precondition', 'Only doctor members can be removed.');
  }

  try {
    await admin.auth().deleteUser(memberId);
  } catch (e) {
    if (!e || e.code !== 'auth/user-not-found') {
      console.error('[removeDoctorAccount] deleteUser failed memberId=' + memberId, e);
      throw new functions.https.HttpsError('internal', 'Could not remove the account.');
    }
  }

  const { FieldValue } = require('firebase-admin/firestore');
  const ts = FieldValue.serverTimestamp();
  await db.doc(`clinics/${clinicId}/members/${memberId}`).set({ status: 'REMOVED', updatedAt: ts }, { merge: true });
  await db.doc(`users/${memberId}`).set({ status: 'REMOVED', updatedAt: ts }, { merge: true });

  console.log('[removeDoctorAccount] removed doctor uid=' + memberId + ' clinic=' + clinicId);
  return { memberId };
});

// ─────────────────────────────────────────────────────────────
// Phase 5b — issuePatientToken (HTTPS callable, v1)
// ─────────────────────────────────────────────────────────────
// Mints a Firebase custom token for a validated patient so the client can
// call signInWithCustomToken and hold a real Firebase Auth identity with
// { role: 'patient', clinicId, patientId } claims (required by Phase 6
// Firestore/Storage rules — see firebase/storage.rules `isPatientOwner`).
//
// INTENTIONAL EXCEPTION: this callable does NOT require context.auth.
// It is the identity-bootstrap entry for patients, who have no Firebase
// Auth session yet. All trust flows from the server-side lookup:
// patientCodes/{code} -> clinics/{clinicId} (countryCode) +
// clinics/{clinicId}/patients/{patientId} (phone) -> phone equality.
// Client-supplied patientId is never trusted.
//
// Client contract: `{ code, phone }` ONLY. countryCode is derived
// server-side from `clinics/{clinicId}.countryCode` — the Admin SDK
// bypasses Firestore rules, so the client no longer needs to read the
// clinic doc before it has an identity (Phase-6-safe).
//
// Phone normalization MIRRORS the client's toStoredPhone at
// src/utils/phone.ts:23-33 (both sides normalized before compare) so a
// doc stored via either branch of toStoredPhone (E.164 via
// libphonenumber-js parsePhoneNumber, or digits-only fallback via
// String.replace(/\D/g,'')) matches.
const { parsePhoneNumber: _parsePhoneNumber, isSupportedCountry: _isSupportedCountry } = require('libphonenumber-js');

function _normalizePhone(raw) {
  return String(raw || '').replace(/\D/g, '');
}
function _toStoredPhone(raw, country) {
  if (country && _isSupportedCountry(country)) {
    try {
      const p = _parsePhoneNumber(raw, country);
      if (p && p.isValid()) return p.number;
    } catch (_) { /* fall through */ }
  }
  return _normalizePhone(raw);
}

exports.issuePatientToken = functions.https.onCall(async (data, _context) => {
  const code = data && typeof data.code === 'string' ? data.code.trim() : '';
  const phone = data && typeof data.phone === 'string' ? data.phone.trim() : '';
  if (!code || !phone) {
    console.error('[issuePatientToken] invalid-argument: code/phone required');
    throw new functions.https.HttpsError('invalid-argument', 'code and phone are required.');
  }

  const db = admin.firestore();

  // (a) patientCodes/{code}
  const codeSnap = await db.doc(`patientCodes/${code}`).get();
  if (!codeSnap.exists) {
    console.error(`[issuePatientToken] invalid code=${code}`);
    throw new functions.https.HttpsError('not-found', 'Invalid code.');
  }
  const { clinicId, patientId } = codeSnap.data() || {};
  if (!clinicId || !patientId) {
    console.error(`[issuePatientToken] malformed patientCodes doc for code=${code}`);
    throw new functions.https.HttpsError('not-found', 'Invalid code.');
  }

  // (b) clinics/{clinicId} — server-derived countryCode (Phase-6-safe).
  const clinicSnap = await db.doc(`clinics/${clinicId}`).get();
  if (!clinicSnap.exists) {
    console.error(`[issuePatientToken] clinic missing clinicId=${clinicId}`);
    throw new functions.https.HttpsError('not-found', 'Clinic not found.');
  }
  const countryCode = (clinicSnap.data() || {}).countryCode ?? null;

  // (c) clinics/{clinicId}/patients/{patientId}
  const patientSnap = await db.doc(`clinics/${clinicId}/patients/${patientId}`).get();
  if (!patientSnap.exists) {
    console.error(`[issuePatientToken] patient missing clinicId=${clinicId} patientId=${patientId}`);
    throw new functions.https.HttpsError('not-found', 'Patient not found.');
  }
  const storedPhone = String((patientSnap.data() || {}).phone || '');

  // Normalize BOTH sides through _toStoredPhone using the SERVER-derived countryCode.
  if (_toStoredPhone(phone, countryCode) !== _toStoredPhone(storedPhone, countryCode)) {
    console.error(`[issuePatientToken] phone mismatch clinicId=${clinicId} patientId=${patientId}`);
    throw new functions.https.HttpsError('permission-denied', 'Phone does not match.');
  }

  // Mint the token — patientId doubles as the Firebase uid.
  const token = await admin.auth().createCustomToken(patientId, {
    role: 'patient',
    clinicId,
    patientId,
  });

  console.log(`[issuePatientToken] issued token clinicId=${clinicId} patientId=${patientId}`);
  return { token, clinicId, patientId };
});