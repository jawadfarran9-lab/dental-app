# 🚀 AI CHAT CLOUD FUNCTION - API DOCUMENTATION (Updated)

**Last Updated:** January 2, 2026  
**Version:** 2.0 (AI Pro Support)  
**Status:** Production Ready

---

## Overview

The AI Chat Cloud Function is an Express.js HTTP endpoint that provides streaming AI responses for dental-related questions. **NEW in v2.0:** Now supports AI Pro subscription feature gating with advanced AI behaviors.

**Endpoint:** `POST /aiChat`  
**Response Type:** Server-Sent Events (SSE) - Streaming  
**Auth:** Firebase Auth (via custom token or OAuth)

---

## Request Format

### URL
```
POST /api/aiChat
```

### Headers
```
Content-Type: application/json
Authorization: Bearer {firebase_token}  (optional, depends on setup)
```

### Body (JSON)

```typescript
{
  // Required
  message: string;              // User's question/message (max 1000 chars)
  
  // Optional - User context
  user?: {
    id?: string;                // Firebase UID or custom user ID
    role?: 'patient' | 'doctor' | 'clinic'; // User role
  };
  
  // Optional - Clinic context
  clinic?: {
    id?: string;                // Firestore clinic document ID
    name?: string;              // Clinic display name
  };
  
  // Optional - Localization
  language?: 'en' | 'ar';       // Default: 'en'
  
  // Optional - Conversation history
  history?: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
  
  // NEW - AI Pro subscription flag
  includeAIPro?: boolean;       // Whether user has AI Pro subscription
}
```

### Example Request

```bash
curl -X POST "http://localhost:5001/dental-app/us-central1/api/aiChat" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "I have a toothache, what should I do?",
    "user": {
      "id": "patient123",
      "role": "patient"
    },
    "clinic": {
      "id": "clinic456",
      "name": "Smile Dental"
    },
    "language": "en",
    "includeAIPro": true,
    "history": []
  }'
```

---

## Response Format

### Response Type
**Server-Sent Events (SSE)** - Streaming response over HTTP

### Headers
```
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive
X-AI-Pro: true|false    (NEW: Indicates if Pro features were used)
```

### Response Events

The function sends multiple SSE events as the AI generates the response:

#### 1. Delta Events (Streaming text chunks)
```json
data: {"delta": "This is a chunk of "}
data: {"delta": "the AI response text."}
```

#### 2. Category Event (Response classification)
```json
data: {"category": "dental"}
```

**Categories:**
- `dental` - Dental-related content
- `emergency` - Emergency situation detected
- `warning` - Warning/caution needed
- `off-topic` - Non-dental content

#### 3. Done Event (Stream end signal)
```json
data: {"done": true}
```

#### 4. Error Event (If streaming fails)
```json
data: {"error": "stream_failed", "done": true}
```

### Example Response Stream

```
data: {"delta": "To address your toothache, "}
data: {"delta": "I recommend the following steps:\n"}
data: {"delta": "1. Rinse with warm salt water\n"}
data: {"delta": "2. Take over-the-counter pain relief\n"}
data: {"delta": "3. Apply a cold compress\n"}
data: {"category": "dental"}
data: {"done": true}
```

### Enhanced Response (AI Pro enabled)

When `includeAIPro: true`, responses are more detailed:

```
data: {"delta": "Your toothache could stem from several causes:\n"}
data: {"delta": "\n## Possible Causes:\n"}
data: {"delta": "1. **Dental Caries** - Most common cause\n"}
data: {"delta": "2. **Gum Inflammation** - May indicate gingivitis\n"}
data: {"delta": "3. **Bruxism** - Grinding habits\n"}
data: {"delta": "\n## Immediate Relief:\n"}
data: {"delta": "- Warm salt water rinses (3-4x daily)\n"}
data: {"delta": "- NSAIDs for pain management\n"}
data: {"delta": "- Avoid hard/sticky foods\n"}
data: {"delta": "\n## Professional Recommendation:\n"}
data: {"delta": "Schedule appointment within 24-48 hours for comprehensive evaluation.\n"}
data: {"category": "dental"}
data: {"done": true}
```

### Free User Response (AI Pro disabled)

When `includeAIPro: false` or not provided, responses are concise + upgrade prompt:

```
data: {"delta": "Rinse with warm salt water and take "}
data: {"delta": "over-the-counter pain relief. "}
data: {"delta": "See your dentist as soon as possible.\n"}
data: {"delta": "\n✨ **Upgrade to AI Pro** to unlock advanced features:\n"}
data: {"delta": "- Detailed treatment recommendations\n"}
data: {"delta": "- In-depth condition analysis\n"}
data: {"delta": "- Preventive care suggestions\n"}
data: {"delta": "- And much more!"}
data: {"category": "dental"}
data: {"done": true}
```

---

## AI Pro Feature Behavior

### How `includeAIPro` Works

1. **Client provides flag:** App sends `includeAIPro: true/false` in request
2. **Firestore fallback:** If flag not provided, Cloud Function checks Firestore
   - Reads: `clinics/{clinic.id}.includeAIPro`
3. **Behavior changes:** AI model parameters adjust based on status

### Parameter Differences

| Parameter | Free Tier | AI Pro |
|-----------|-----------|--------|
| Model | gpt-4o | gpt-4o |
| Temperature | 0.7 | 0.6 |
| Max Tokens | 500 | 1000 |
| Response Style | Concise | Detailed + Medical References |
| Upgrade Prompt | Yes | No |

### Advanced Features (Pro Only)

When `includeAIPro: true`, AI provides:
- **Detailed analysis** of dental conditions
- **Treatment options** with pros/cons
- **Preventive recommendations** tailored to condition
- **Medical references** for credibility
- **Longer responses** (up to 1000 tokens vs 500)

---

## AI Pro Status Detection

### Priority Order

1. **Request Body** (Highest priority)
   - If `includeAIPro` is provided, use it immediately
   - No Firestore read needed

2. **Firestore** (Fallback)
   - If `includeAIPro` not in request, read from Firestore
   - Checks: `clinics/{clinic.id}.includeAIPro`
   - Cached in logs for audit

3. **Default** (Lowest priority)
   - If Firestore read fails or clinic ID not provided
   - Defaults to `false` (Free tier)

### Example: Determining Status

```javascript
// Scenario 1: Client provides flag (fastest)
includeAIPro = request.includeAIPro === true;  // Uses client value

// Scenario 2: Firestore read (if not provided)
if (request.includeAIPro === undefined) {
  const clinicDoc = await firestore.collection('clinics').doc(clinic.id).get();
  includeAIPro = clinicDoc.data().includeAIPro === true;
}

// Scenario 3: Default (if all else fails)
// includeAIPro remains false
```

---

## Error Handling

### Request Validation Errors

#### Missing message field
```json
{
  "error": "message_required",
  "message": "message field is required"
}
```
**Status:** 400 Bad Request

#### OpenAI not configured
```json
{
  "error": "ai_service_unavailable",
  "message": "OpenAI service not configured. Please contact support."
}
```
**Status:** 503 Service Unavailable

#### Invalid request format
```json
{
  "error": "ai_request_failed",
  "details": "Error message from OpenAI"
}
```
**Status:** 500 Internal Server Error

### Streaming Errors

If error occurs during streaming:
```
data: {"error": "stream_failed", "done": true}
```

---

## Logging & Audit

### What Gets Logged

Every request is logged to `ai_logs` collection in Firestore:

```firestore
{
  // Request info
  userId: string,
  clinicId: string,
  message: string,
  language: string,
  
  // Response info
  response: string,
  category: string,
  responseLength: number,
  
  // AI Pro info (NEW)
  includeAIPro: boolean,
  aiProSource: 'request' | 'firestore' | 'firestore_fallback',
  
  // Timing
  startTime: timestamp,
  endTime: timestamp,
  timestamp: serverTimestamp,
  
  // Model info
  model: 'gpt-4o',
  maxTokens: 500 | 1000,
  
  // Status
  status: 'success' | 'error',
  error?: string,
  errorCode?: string,
  
  // Debugging
  firestoreRead?: boolean,
  firestoreError?: string,
  logError?: string,
}
```

### Querying Logs

```javascript
// Get all Pro usage
db.collection('ai_logs')
  .where('includeAIPro', '==', true)
  .get();

// Get errors
db.collection('ai_logs')
  .where('status', '==', 'error')
  .get();

// Get usage by clinic
db.collection('ai_logs')
  .where('clinicId', '==', 'clinic456')
  .orderBy('timestamp', 'desc')
  .limit(100)
  .get();
```

---

## Implementation Guide

### For Frontend (React Native App)

The app sends `includeAIPro` with every request:

```typescript
import { sendMessageToAIStream } from '@/src/utils/aiAssistant';
import { useAIProStatus } from '@/src/hooks/useAIProStatus';

export function AIChatScreen() {
  const { hasAIPro } = useAIProStatus();  // Get AI Pro status
  
  const handleSendMessage = async (message: string) => {
    const result = await sendMessageToAIStream(
      message,
      {
        hasAIPro,  // Passed to Cloud Function as includeAIPro
        userId: 'patient123',
        clinicId: 'clinic456',
        language: 'en',
      },
      { /* options */ }
    );
  };
}
```

### For Backend Integration

Ensure Firestore has clinic data with `includeAIPro` field:

```firestore
clinics/{clinicId}
├── includeAIPro: boolean
├── subscriptionPlan: string
└── subscriptionPriceWithAIPro: number
```

### Configuration

Set OpenAI API key:

```bash
# Option 1: Firebase Config
firebase functions:config:set openai.key="sk-..."

# Option 2: Environment Variable
export OPENAI_API_KEY="sk-..."
```

---

## Testing

### Test Case 1: Pro User Request

```bash
curl -X POST "http://localhost:5001/dental-app/us-central1/api/aiChat" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What causes gingivitis?",
    "includeAIPro": true,
    "clinic": {"id": "clinic456"},
    "language": "en"
  }'
```

**Expected:** Detailed response with medical analysis (1000 tokens max)

### Test Case 2: Free User Request

```bash
curl -X POST "http://localhost:5001/dental-app/us-central1/api/aiChat" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What causes gingivitis?",
    "includeAIPro": false,
    "clinic": {"id": "clinic456"},
    "language": "en"
  }'
```

**Expected:** Concise response (500 tokens max) + upgrade prompt

### Test Case 3: Firestore Fallback

```bash
curl -X POST "http://localhost:5001/dental-app/us-central1/api/aiChat" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What causes gingivitis?",
    "clinic": {"id": "clinic456"},
    "language": "en"
  }'
```

**Expected:** Reads `clinics/clinic456.includeAIPro` from Firestore and adjusts response

### Test Case 4: Arabic Language (Pro)

```bash
curl -X POST "http://localhost:5001/dental-app/us-central1/api/aiChat" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "ما الذي يسبب التهاب اللثة؟",
    "includeAIPro": true,
    "language": "ar"
  }'
```

**Expected:** Detailed response in Arabic with system prompt in Arabic

---

## Monitoring & Metrics

### Key Metrics to Track

```javascript
// Pro vs Free usage
const proCalls = await db.collection('ai_logs')
  .where('includeAIPro', '==', true)
  .count()
  .get();

// Average response time
const logs = await db.collection('ai_logs').limit(100).get();
const avgTime = logs.docs.reduce((sum, doc) => {
  const data = doc.data();
  return sum + (data.endTime - data.startTime);
}, 0) / logs.docs.length;

// Error rate
const errors = await db.collection('ai_logs')
  .where('status', '==', 'error')
  .count()
  .get();
const errorRate = errors.count / totalRequests;

// Most common categories
const categories = {};
logs.docs.forEach(doc => {
  const cat = doc.data().category;
  categories[cat] = (categories[cat] || 0) + 1;
});
```

---

## Troubleshooting

### Issue: Always returning Free tier response

**Cause:** `includeAIPro` not being sent or Firestore read failing

**Solution:**
1. Verify client is sending `includeAIPro: true`
2. Check Firestore `clinics/{clinicId}.includeAIPro` field exists
3. Check logs for `firestoreError`

### Issue: OpenAI errors

**Cause:** API key not configured or rate limited

**Solution:**
1. Verify `OPENAI_API_KEY` environment variable is set
2. Check OpenAI account quota and limits
3. Monitor error logs

### Issue: Streaming disconnects

**Cause:** Network timeout or client disconnect

**Solution:**
1. Increase `max_tokens` carefully (may timeout on slow networks)
2. Implement client-side retry logic
3. Check Cloud Function logs for errors

---

## Version History

### v2.0 (Current) - January 2026
- ✅ Added AI Pro subscription support
- ✅ Added `includeAIPro` flag to request/response
- ✅ Added Firestore fallback for AI Pro status
- ✅ Enhanced system prompts for Pro users
- ✅ Comprehensive logging with AI Pro tracking
- ✅ Upgrade prompts for free users
- ✅ Double token allowance for Pro users
- ✅ Detailed audit trail

### v1.0 - Previous
- Basic AI chat endpoint
- Simple streaming responses
- Basic error handling

---

## API Changelog

### What Changed in v2.0

#### New Request Fields
- `includeAIPro?: boolean` - Optional flag from client

#### New Response Headers
- `X-AI-Pro: true|false` - Indicates Pro feature usage

#### Enhanced Logging
- `includeAIPro` field
- `aiProSource` field (request/firestore/fallback)
- `model`, `maxTokens` tracking
- Timing metrics

#### Behavioral Changes
- Pro users: 1000 tokens max, detailed responses
- Free users: 500 tokens max + upgrade prompt
- Firestore fallback for missing `includeAIPro`

---

## Migration Guide (v1.0 → v2.0)

### No Breaking Changes

Existing clients continue to work:
- Old requests without `includeAIPro` still work
- Default to free tier (500 tokens)
- Firestore fallback enables gradual migration

### To Enable AI Pro

**Step 1:** Update client to send `includeAIPro`
```typescript
const { hasAIPro } = useAIProStatus();
// Pass to Cloud Function
includeAIPro: hasAIPro
```

**Step 2:** Update Firestore (if using fallback)
```firestore
clinics/{clinicId}: {
  includeAIPro: boolean
}
```

**Step 3:** Monitor logs
```javascript
const logs = await db.collection('ai_logs')
  .where('aiProSource', '==', 'firestore')
  .get();
```

---

## Support & Documentation

- **Client Integration:** See `AI_PRO_QUICK_REFERENCE.md`
- **Feature Gating:** See `AI_PRO_FEATURE_GATING_COMPLETE.md`
- **Architecture:** See `AI_PRO_INTEGRATION_MAP.md`
- **Debugging:** Check Cloud Function logs via Firebase Console

---

**Status:** ✅ Production Ready  
**Last Tested:** January 2, 2026  
**Next Review:** January 2027
