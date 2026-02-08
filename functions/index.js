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

// Helper: atomically generate next patient code for a clinic
// Uses a counter document at clinics/{clinicId}/counters/patient_code
async function generateNextPatientCode(clinicId) {
  const db = admin.firestore();
  const counterRef = db.doc(`clinics/${clinicId}/counters/patient_code`);

  const newCode = await db.runTransaction(async (tx) => {
    const snap = await tx.get(counterRef);
    if (!snap.exists) {
      // initialize starting value at 1000
      tx.set(counterRef, { last: 1000 });
      return 1000;
    }
    const last = snap.data().last || 1000;
    const next = last + 1;
    tx.update(counterRef, { last: next });
    return next;
  });

  return newCode;
}

// HTTP endpoint to create a new patient for a clinic (used by your backend/frontend with clinic auth)
// Expects JSON: { clinicId, name, phone, dob, notes }
app.post('/createPatient', async (req, res) => {
  try {
    const { clinicId, name, phone, dob, notes } = req.body;
    if (!clinicId || !name) return res.status(400).send({ error: 'clinicId and name required' });

    const db = admin.firestore();
    const code = await generateNextPatientCode(clinicId);

    const patientRef = db.collection('patients').doc();
    const patientData = {
      clinicId,
      name,
      phone: phone || null,
      dob: dob || null,
      notes: notes || null,
      code: code,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await patientRef.set(patientData);

    return res.status(200).send({ patientId: patientRef.id, code });
  } catch (err) {
    console.error(err);
    return res.status(500).send({ error: 'internal_error' });
  }
});

// Clinic signup endpoint: creates Firebase Auth user, clinic document, and sets custom claims
// Expects JSON: { email, password, clinicName, dentistName, phone, country, city }
// Returns: { clinicId, uid }
app.post('/clinicSignup', async (req, res) => {
  try {
    const { email, password, clinicName, dentistName, phone, country, city } = req.body;
    if (!email || !password || !clinicName) {
      return res.status(400).send({ error: 'email, password, and clinicName required' });
    }

    const db = admin.firestore();

    // Create Firebase Auth user
    let user;
    try {
      user = await admin.auth().createUser({ email, password });
    } catch (authErr) {
      if (authErr.code === 'auth/email-already-exists') {
        return res.status(400).send({ error: 'email_already_registered' });
      }
      throw authErr;
    }

    const clinicId = user.uid;

    // Create clinic document
    await db.collection('clinics').doc(clinicId).set({
      uid: clinicId,
      email,
      clinicName,
      dentistName: dentistName || null,
      phone: phone || null,
      country: country || null,
      city: city || null,
      isActive: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Set custom claim on the user
    await admin.auth().setCustomUserClaims(clinicId, { clinicId });

    return res.status(200).send({ clinicId, uid: clinicId });
  } catch (err) {
    console.error('clinicSignup error', err);
    return res.status(500).send({ error: 'internal_error' });
  }
});

// Secure patient login endpoint: validates patient code and mints a short-lived custom token
// Expects JSON: { code: numeric_patient_code }
// Returns: { token, patientId, patientName, clinicId }
app.post('/patientLogin', async (req, res) => {
  try {
    const { code } = req.body;
    if (typeof code !== 'number' && !Number.isInteger(parseInt(code, 10))) {
      return res.status(400).send({ error: 'code must be a number' });
    }

    const db = admin.firestore();
    const numCode = parseInt(code, 10);

    // Query for patient with the given code
    const q = db.collection('patients').where('code', '==', numCode);
    const snap = await q.get();

    if (snap.empty) {
      return res.status(401).send({ error: 'invalid_code' });
    }

    const patientDoc = snap.docs[0];
    const patientData = patientDoc.data();
    const patientId = patientDoc.id;
    const clinicId = patientData.clinicId;

    // Mint a short-lived custom token (default 1 hour)
    // The token includes custom claims: patientId and clinicId
    const token = await admin.auth().createCustomToken(patientId, {
      patientId: patientId,
      clinicId: clinicId,
    });

    return res.status(200).send({
      token,
      patientId,
      patientName: patientData.name,
      clinicId,
    });
  } catch (err) {
    console.error('patientLogin error', err);
    return res.status(500).send({ error: 'internal_error' });
  }
});

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

exports.api = functions.https.onRequest(app);

// You can add more functions here: create clinic user, set custom claims for clinics, etc.

// Create a Firebase Auth patient user linked to existing patientId
// Expects JSON: { clinicId, patientId, email, tempPassword? }
// Returns: { uid }
app.post('/createPatientUser', async (req, res) => {
  try {
    const { clinicId, patientId, email, tempPassword } = req.body;
    if (!clinicId || !patientId || !email) {
      return res.status(400).send({ error: 'clinicId, patientId, and email required' });
    }

    const db = admin.firestore();

    // Ensure patient exists and belongs to clinic
    const patRef = db.collection('patients').doc(patientId);
    const patSnap = await patRef.get();
    if (!patSnap.exists) {
      return res.status(404).send({ error: 'patient_not_found' });
    }
    const pat = patSnap.data();
    if (pat.clinicId !== clinicId) {
      return res.status(403).send({ error: 'clinic_patient_mismatch' });
    }

    const password = tempPassword && typeof tempPassword === 'string' && tempPassword.length >= 6
      ? tempPassword
      : Math.random().toString(36).slice(-8);

    // Create Firebase Auth user
    let user;
    try {
      user = await admin.auth().createUser({ email, password, emailVerified: false });
    } catch (authErr) {
      if (authErr.code === 'auth/email-already-exists') {
        return res.status(400).send({ error: 'email_already_registered' });
      }
      throw authErr;
    }

    const uid = user.uid;

    // Set custom claims for role and linkage
    await admin.auth().setCustomUserClaims(uid, {
      role: 'patient',
      clinicId,
      patientId,
      mustChangePassword: true,
    });

    // Store linkage in Firestore (users collection)
    await db.collection('users').doc(uid).set({
      uid,
      email,
      role: 'patient',
      clinicId,
      patientId,
      tempPasswordSet: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Update patient doc for convenience
    await patRef.update({ userId: uid });

    return res.status(200).send({ uid });
  } catch (err) {
    console.error('createPatientUser error', err);
    return res.status(500).send({ error: 'internal_error' });
  }
});
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