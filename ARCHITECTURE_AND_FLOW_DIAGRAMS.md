# 🏗️ CLOUD FUNCTION v2.0 - ARCHITECTURE & FLOW DIAGRAMS

**Version:** 2.0  
**Created:** January 2, 2026  
**Purpose:** Visual guides for understanding AI Pro Cloud Function implementation

---

## 1. High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER DEVICES                             │
│                                                                 │
│  ┌──────────────────────┐     ┌──────────────────────┐         │
│  │   Mobile App (iOS)   │     │   Mobile App (Android)          │
│  │  React Native        │     │  React Native        │         │
│  └──────────────────────┘     └──────────────────────┘         │
│           │                              │                      │
│           └──────────────┬───────────────┘                      │
│                          │ HTTP POST                            │
│                          ↓                                      │
└─────────────────────────────────────────────────────────────────┘
                          │
                          │ /api/aiChat
                          │ Request: {message, includeAIPro?, ...}
                          │
┌─────────────────────────────────────────────────────────────────┐
│                  FIREBASE CLOUD FUNCTIONS                       │
│                                                                 │
│  ┌────────────────────────────────────────────────────────┐   │
│  │                POST /aiChat Handler                    │   │
│  │                                                        │   │
│  │  1. Parse request body                               │   │
│  │  2. Determine Pro status                             │   │
│  │  3. Get OpenAI parameters                            │   │
│  │  4. Call OpenAI API                                  │   │
│  │  5. Stream response                                  │   │
│  │  6. Log to Firestore                                 │   │
│  │  7. Return with X-AI-Pro header                      │   │
│  └────────────────────────────────────────────────────────┘   │
│                          │                                      │
└──────────────────────────┼──────────────────────────────────────┘
                          │
         ┌────────────────┼────────────────┐
         │                │                │
         ↓ (read)         ↓ (write)        ↓ (call)
    ┌─────────┐       ┌─────────┐      ┌──────────┐
    │ Firestore   │   │ Firestore   │  │ OpenAI   │
    │ clinics │   │ ai_logs │      │ API      │
    └─────────┘   └─────────┘      └──────────┘
         ▲
         │ read
         │ clinics/{id}
         │ .includeAIPro
         │ (if missing in
         │  request body)
         │
    ┌─────────────────────┐
    │ Clinic Database    │
    └─────────────────────┘
         ▲
         │
    ┌──────────────┐
    │ Subscription │
    │ Info         │
    └──────────────┘
```

---

## 2. Request Processing Flow

```
START
  │
  ├─ Client sends POST /aiChat
  │  {
  │    message: "What causes toothache?",
  │    includeAIPro: true,              ← Optional
  │    clinic: {id: "clinic123"},
  │    language: "en"
  │  }
  │
  ↓ Cloud Function receives request
  │
  ├─ VALIDATE REQUEST
  │  │ Is message provided? 
  │  ├─ YES → Continue
  │  └─ NO → Return 400 error
  │
  ↓
  ├─ DETERMINE PRO STATUS
  │  │
  │  ├─ Is includeAIPro in request?
  │  │  ├─ YES → Use value (fastest path)
  │  │  │        includeAIPro = true
  │  │  │        aiProSource = 'request'
  │  │  │
  │  │  └─ NO → Check Firestore fallback
  │  │         │
  │  │         ├─ Read: clinics/{clinic.id}
  │  │         │
  │  │         ├─ Found & has includeAIPro?
  │  │         │  ├─ YES → Use value
  │  │         │  │        includeAIPro = true/false
  │  │         │  │        aiProSource = 'firestore'
  │  │         │  │
  │  │         │  └─ NO → Default to false
  │  │         │           includeAIPro = false
  │  │         │           aiProSource = 'firestore_fallback'
  │  │         │
  │  │         └─ Firestore read failed?
  │  │            └─ YES → Default to false
  │  │                     includeAIPro = false
  │  │                     aiProSource = 'error_fallback'
  │  │                     (log error)
  │
  ↓
  ├─ GET OPENAI PARAMETERS
  │  │
  │  └─ Call getOpenAIParams(includeAIPro)
  │     │
  │     ├─ If Pro (true):
  │     │  {
  │     │    model: 'gpt-4o',
  │     │    temperature: 0.6,
  │     │    max_tokens: 1000
  │     │  }
  │     │
  │     └─ If Free (false):
  │        {
  │          model: 'gpt-4o',
  │          temperature: 0.7,
  │          max_tokens: 500
  │        }
  │
  ↓
  ├─ BUILD SYSTEM PROMPT
  │  │
  │  └─ Call buildAISystemPrompt(user, clinic, language, includeAIPro)
  │     │
  │     ├─ If Pro → Include advanced instructions
  │     │           ("detailed analysis", "treatment options", ...)
  │     │
  │     └─ If Free → Basic instructions only
  │                   ("provide help", "contact dentist", ...)
  │
  ↓
  ├─ CALL OPENAI API (with parameters)
  │  │
  │  ├─ Send: messages array + system prompt + params
  │  ├─ Receive: Stream of response chunks
  │  │
  │  └─ Stream response to client (SSE)
  │
  ↓
  ├─ PROCESS RESPONSE
  │  │
  │  ├─ Collect all response text
  │  ├─ Classify category (dental, emergency, etc.)
  │  │
  │  ├─ If Free tier AND category is dental:
  │  │  └─ Append upgrade suggestion
  │  │     Call buildUpgradeSuggestion(language)
  │  │
  │  └─ Send "done" event to client
  │
  ↓
  ├─ LOGGING
  │  │
  │  └─ Create log document with:
  │     - userId, clinicId, message, response
  │     - category, language
  │     - includeAIPro, aiProSource
  │     - model, maxTokens
  │     - status, timestamp, etc.
  │
  ├─ Write to Firestore: ai_logs/{docId}
  │  │
  │  ├─ Success → Continue
  │  └─ Failure → Log error (but don't fail request)
  │
  ↓
  ├─ SEND RESPONSE
  │  │
  │  ├─ Headers:
  │  │  ├─ Content-Type: text/event-stream
  │  │  ├─ X-AI-Pro: true/false
  │  │  └─ Cache-Control: no-cache
  │  │
  │  └─ All data already streamed above
  │
  ↓
END (success)


ERROR HANDLING (at any point):
  │
  ├─ Validation error → Return 400 with error message
  ├─ OpenAI error → Stream error event, log error
  ├─ Firestore error → Log error, use default (free)
  └─ Unknown error → Return 500 with generic message
```

---

## 3. Pro Status Detection Flowchart

```
                   START
                     │
                     ↓
         ┌──────────────────────┐
         │ Is includeAIPro in   │
         │ request body?        │
         └──────────────────────┘
              YES│      │NO
                 │      │
                 ↓      ↓
            ┌─────────────────────┐
            │ Use request value   │ ┌───────────────────────────┐
            │ aiProSource =       │ │ Does clinic.id exist?     │
            │ 'request'           │ └───────────────────────────┘
            │                     │        YES│       │NO
            └─────────────────────┘          │        │
                     ↓                        │        │
                   DONE                       ↓        ↓
            (Pro=request value)    ┌────────────────────────────┐
                                   │ includeAIPro = false       │
                   ┌───────────────┤ aiProSource = 'default'    │
                   │               │ DONE                       │
                   │               └────────────────────────────┘
                   │
              TRY FIRESTORE READ
              clinics/{clinic.id}
                   │
         ┌─────────┴─────────┐
         │                   │
      SUCCESS           FAILURE
         │                   │
         ↓                   ↓
    ┌──────────────┐    ┌──────────────┐
    │ Document     │    │ Log error,   │
    │ found?       │    │ includeAIPro │
    └──────────────┘    │ = false      │
      YES│     │NO      │ aiProSource  │
         │      │       │ = 'error'    │
         ↓      ↓       └──────────────┘
    ┌──────────┐ ┌────────────┐        │
    │Has field │ │includeAIPro│        │
    │?         │ │= false     │        │
    └──────────┘ │aiProSource │        │
      YES│ │NO   │= 'fallback'│        │
         │ │      └────────────┘        │
         ↓ ↓           ↓                │
      ┌────────┐ ┌────────┐ ┌────────┐ │
      │Use     │ │Use     │ │All 3   │ │
      │value   │ │false   │ │paths   │ │
      │from    │ │(no     │ │lead    │ │
      │Firebase│ │field)  │ │to DONE │ │
      │        │ │        │ │        │ │
      └────────┘ └────────┘ └────────┘ │
         ↓         ↓                   │
      ┌────────────────────────────┐  │
      │ aiProSource = 'firestore'  │◄─┘
      │ DONE                       │
      └────────────────────────────┘
```

---

## 4. OpenAI Parameter Selection

```
INPUT: includeAIPro: boolean

Decision Tree:
│
├─ includeAIPro === true
│  │
│  └─ RETURN Pro Settings:
│     {
│       model: 'gpt-4o',
│       temperature: 0.6,      ← More consistent, less random
│       max_tokens: 1000       ← 2x longer responses
│     }
│     
│     Use case: Detailed, consistent responses for paying users
│
│
└─ includeAIPro === false
   │
   └─ RETURN Free Settings:
      {
        model: 'gpt-4o',       ← Same model (quality same)
        temperature: 0.7,      ← Default, more varied
        max_tokens: 500        ← Shorter, controlled responses
      }
      
      Use case: Concise, limited responses for free users


IMPACT ANALYSIS:

Parameter        │ Free (0.5) │ Pro (1000) │ Impact
─────────────────┼────────────┼───────────┼──────────────────────
max_tokens       │ 500        │ 1000      │ Pro gets 2x content
temperature      │ 0.7        │ 0.6       │ Pro more consistent
Token cost       │ ~$0.001    │ ~$0.002   │ 2x cost per Pro user
Response time    │ ~1s        │ ~2s       │ Proportional to length
User perception  │ Basic      │ Advanced  │ Higher satisfaction
```

---

## 5. Response Generation Process

```
SYSTEM PROMPT GENERATION:
┌─────────────────────────────────────────────────────────┐
│ buildAISystemPrompt(user, clinic, language, includeAIPro)
│                                                         │
│ Load base prompt templates for language                 │
│ (en_US.json, ar_SA.json, etc.)                         │
│                                                         │
│ IF includeAIPro === true:                              │
│   basePrompt += advanced_features_text                 │
│   (mentions: detailed analysis, treatment plans,       │
│    medical references, preventive care, etc.)          │
│                                                         │
│ IF includeAIPro === false:                             │
│   basePrompt += basic_features_text                    │
│   (mentions: general guidance, recommend dentist, etc.)│
│                                                         │
│ IF user.role === 'doctor':                             │
│   basePrompt += doctor_specific_context                │
│                                                         │
│ RETURN completed system prompt                         │
└─────────────────────────────────────────────────────────┘
         ↓
      (passed to OpenAI)


STREAMING RESPONSE:
┌─────────────────────────────────────────────────────────┐
│ OpenAI API Stream Events                               │
│                                                         │
│ client.chat.completions.create({                       │
│   stream: true,                  ← Key for streaming   │
│   model: openaiParams.model,                           │
│   temperature: openaiParams.temperature,               │
│   max_tokens: openaiParams.max_tokens,                 │
│   system: systemPrompt,                                │
│   messages: [...]                                      │
│ })                                                     │
│                                                         │
│ FOR EACH chunk in stream:                              │
│   EXTRACT delta (text increment)                       │
│   SEND to client via SSE: data: {delta: "..."}         │
│   ACCUMULATE in fullText                               │
└─────────────────────────────────────────────────────────┘
         ↓


RESPONSE ENRICHMENT (Post-streaming):
┌─────────────────────────────────────────────────────────┐
│ IF includeAIPro === false AND                           │
│    category === 'dental':                              │
│                                                         │
│   CALL buildUpgradeSuggestion(language)               │
│   RESULT: "✨ **Upgrade to AI Pro** to unlock:"         │
│            - Detailed treatment recommendations         │
│            - Medical references                         │
│            - And more...                               │
│                                                         │
│   APPEND to response via SSE event                      │
│   ACCUMULATE in fullText                               │
│                                                         │
│ ELSE (Pro user or non-dental):                         │
│   No upgrade suggestion needed                          │
└─────────────────────────────────────────────────────────┘
         ↓


FINAL RESPONSE:
┌─────────────────────────────────────────────────────────┐
│ SSE Event Stream:                                       │
│                                                         │
│ data: {"delta": "Your toothache could "}               │
│ data: {"delta": "stem from several causes:\n"}         │
│ data: {"delta": "1. Dental caries...\n"}               │
│ ...more delta events...                                │
│ data: {"category": "dental"}                           │
│ data: {"done": true}                                   │
└─────────────────────────────────────────────────────────┘
```

---

## 6. Logging Architecture

```
                 REQUEST RECEIVED
                      │
                      ↓
              CREATE logData OBJECT
                      │
         ┌────────────┼────────────┐
         │            │            │
         ↓            ↓            ↓
    TRACK         TRACK         TRACK
    REQUEST       PROCESSING    RESPONSE
    │             │             │
    ├─ userId     ├─ startTime  ├─ fullText
    ├─ clinicId   ├─ model      ├─ responseLength
    ├─ message    ├─ maxTokens  ├─ category
    ├─ language   ├─ temperate  └─ endTime
    ├─ history    │
    └─ sources    │
                  │
                  ├─ Firestore read?
                  ├─ Errors?
                  └─ Duration?


                   FIRESTORE WRITE
                      │
         ┌────────────┴────────────┐
         │                         │
      SUCCESS                   FAILURE
         │                        │
         ↓                        ↓
    Log written             Log error,
    to ai_logs              continue
    collection              processing
         │                        │
         └────────────┬──────────┘
                      │
                      ↓
         RESPONSE ALREADY SENT
         (logging doesn't block)
         
         
FIRESTORE DOCUMENT STRUCTURE:

ai_logs/{autoId}
├─ userId: "user123"
├─ clinicId: "clinic456"
├─ message: "What causes toothache?"
├─ response: "Your toothache could stem from..."
├─ category: "dental"
├─ language: "en"
├─ includeAIPro: true                      ← PRO FEATURE
├─ aiProSource: "request"                  ← PRO FEATURE
├─ model: "gpt-4o"
├─ maxTokens: 1000
├─ responseLength: 1234
├─ status: "success"
├─ timestamp: 2026-01-02T10:30:45Z
├─ startTime: 2026-01-02T10:30:40Z
├─ endTime: 2026-01-02T10:30:45Z
├─ firestoreRead: true
├─ firestoreError: null
└─ error: null
```

---

## 7. Error Handling Paths

```
ERROR SCENARIOS:

1. MISSING MESSAGE
   │
   └─ Return 400 Bad Request
      ├─ Body: {error: "message_required"}
      └─ No logging (request invalid)


2. OPENAI API ERROR
   │
   ├─ Catch exception
   ├─ Log error to console
   ├─ Send SSE error event: {"error": "..."}
   ├─ Log to ai_logs with status="error"
   └─ Request fails (client knows)


3. FIRESTORE READ ERROR (includeAIPro lookup)
   │
   ├─ Catch exception
   ├─ Log warning to console
   ├─ Set includeAIPro = false (fallback)
   ├─ Set aiProSource = "error_fallback"
   ├─ Continue processing (request succeeds)
   └─ Free tier response delivered


4. FIRESTORE WRITE ERROR (logging)
   │
   ├─ Catch exception
   ├─ Log error to console
   ├─ Set logError = "Firestore write failed"
   ├─ Response already sent (async write)
   └─ Request succeeds (user unaffected)


5. INVALID OPENAI PARAMS
   │
   ├─ Validation fails
   ├─ Return 503 Service Unavailable
   ├─ Body: {error: "ai_service_unavailable"}
   └─ No logging


6. STREAMING ERROR
   │
   ├─ Error during chunk streaming
   ├─ Send SSE error event
   ├─ Close stream
   ├─ Log error to Firestore
   └─ Client sees partial response + error


PRIORITY: Request succeeds for user even if logging fails
```

---

## 8. Firestore Data Flow

```
CLINIC DOCUMENT READ:
┌────────────────────────────────────┐
│ clinics/{clinicId}                 │
│                                    │
│ ├─ name: "Smile Dental"            │
│ ├─ subscriptionPlan: "pro"         │
│ ├─ includeAIPro: true    ← READ    │
│ └─ ...other fields...              │
└────────────────────────────────────┘
         ↑
         │ (if not in request)
         │
    CLOUD FUNCTION


LOGGING DATA WRITE:
┌────────────────────────────────────┐
│ ai_logs/{autoGeneratedId}          │
│                                    │
│ ├─ userId: "user123"               │
│ ├─ clinicId: "clinic456"           │
│ ├─ message: "What is..."           │
│ ├─ response: "Your answer..."      │
│ ├─ includeAIPro: true     ← WRITE  │
│ ├─ aiProSource: "firestore"        │
│ ├─ timestamp: serverTimestamp()    │
│ └─ ...20+ fields...                │
└────────────────────────────────────┘
         ↑
         │
    CLOUD FUNCTION
    (after streaming completes)


QUERY EXAMPLE:
Select Pro usage:
  db.collection('ai_logs')
    .where('includeAIPro', '==', true)
    .orderBy('timestamp', 'desc')
    .limit(100)
    .get()

Select clinic usage:
  db.collection('ai_logs')
    .where('clinicId', '==', 'clinic456')
    .orderBy('timestamp', 'desc')
    .limit(50)
    .get()

Select errors:
  db.collection('ai_logs')
    .where('status', '==', 'error')
    .orderBy('timestamp', 'desc')
    .limit(50)
    .get()
```

---

## 9. Sequence Diagram (Pro User Request)

```
CLIENT              CLOUD FUNCTION           FIRESTORE           OPENAI
  │                        │                    │                  │
  ├─ POST /aiChat ─────────→                    │                  │
  │  {                       │                  │                  │
  │   message: "...",        │                  │                  │
  │   includeAIPro: true     │                  │                  │
  │  }                       │                  │                  │
  │                          │                  │                  │
  │                ┌─ Parse request            │                  │
  │                │ includeAIPro = true       │                  │
  │                │ aiProSource = 'request'   │                  │
  │                └─ (no Firestore read)      │                  │
  │                          │                  │                  │
  │                ┌─ getOpenAIParams(true)    │                  │
  │                │ {                         │                  │
  │                │  max_tokens: 1000,        │                  │
  │                │  temperature: 0.6         │                  │
  │                │ }                         │                  │
  │                └─                          │                  │
  │                          │                  │                  │
  │                ┌─ buildAISystemPrompt      │                  │
  │                │ (with Pro instructions)   │                  │
  │                └─                          │                  │
  │                          │                  │                  │
  │                          │                  │                  │
  │                ┌─ START streaming ─────────────────→          │
  │                │                            │        (create   │
  │                │                            │         stream)  │
  │  ← SSE stream ─┤                            │                  │
  │  {delta: "..."}│← stream chunks ←────────────────────────────│
  │  {delta: "..."}│                            │                  │
  │  {delta: "..."}│                            │                  │
  │                │ [response complete]       │                  │
  │  ← category ───┤                            │                  │
  │  {category}    │                            │                  │
  │                │ ┌─ No upgrade prompt      │                  │
  │                │ │ (Pro user)              │                  │
  │                │ └─                        │                  │
  │  ← done ───────┤                            │                  │
  │  {done: true}  │                            │                  │
  │                │ ┌─ CREATE logData ────────→ WRITE ────→      │
  │                │ │  - includeAIPro: true   │ ai_logs│         │
  │                │ │  - aiProSource: 'req'   │{doc} ──→        │
  │                │ │  - responseLength: ...  │        │         │
  │                │ └─ (async)                │ DONE ←──        │
  │                │                           │                  │
  │                └─ Request complete         │                  │
  │                                            │                  │
  ✓ Success                                    │                  │
```

---

## 10. Sequence Diagram (Free User Request with Firestore Fallback)

```
CLIENT              CLOUD FUNCTION           FIRESTORE           OPENAI
  │                        │                    │                  │
  ├─ POST /aiChat ─────────→                    │                  │
  │  {                       │                  │                  │
  │   message: "...",        │                  │                  │
  │   clinic: {              │                  │                  │
  │     id: "clinic456"      │                  │                  │
  │   }                      │                  │                  │
  │  }                       │                  │                  │
  │                          │ (no includeAIPro)│                  │
  │                ┌─ Parse request            │                  │
  │                │ includeAIPro = undefined  │                  │
  │                └─ Try Firestore fallback   │                  │
  │                          │                  │                  │
  │                          ├─ READ ──────────→ clinics/clinic456 │
  │                          │  .includeAIPro   │                  │
  │                          │ ←────── false ───┤                  │
  │                          │                  │                  │
  │                ┌─ includeAIPro = false      │                  │
  │                │ aiProSource = 'firestore' │                  │
  │                └─                          │                  │
  │                          │                  │                  │
  │                ┌─ getOpenAIParams(false)   │                  │
  │                │ {                         │                  │
  │                │  max_tokens: 500,         │                  │
  │                │  temperature: 0.7         │                  │
  │                │ }                         │                  │
  │                └─                          │                  │
  │                          │                  │                  │
  │                ┌─ buildAISystemPrompt      │                  │
  │                │ (basic instructions)      │                  │
  │                └─                          │                  │
  │                          │                  │                  │
  │                ┌─ START streaming ─────────────────→          │
  │                │                            │        (create   │
  │  ← SSE stream ─┤                            │         stream)  │
  │  {delta: "..."}│← stream chunks ←────────────────────────────│
  │  {delta: "..."}│                            │                  │
  │                │ [response complete]       │                  │
  │                │ ┌─ APPEND upgrade prompt  │                  │
  │                │ │ buildUpgradeSuggestion  │                  │
  │  {delta:"✨ Up"}┤   → English/Arabic        │                  │
  │  {delta:"grade"}│                           │                  │
  │  {delta:"..."}  │                           │                  │
  │                │ └─                        │                  │
  │  ← category ───┤                            │                  │
  │  {category}    │                            │                  │
  │  ← done ───────┤                            │                  │
  │  {done: true}  │                            │                  │
  │                │ ┌─ CREATE logData ────────→ WRITE ────→      │
  │                │ │  - includeAIPro: false  │ ai_logs│         │
  │                │ │  - aiProSource: 'fs'    │{doc} ──→        │
  │                │ │  - firestoreRead: true  │        │         │
  │                │ │  - responseLength: ...  │ DONE ←──        │
  │                │ └─ (async)                │                  │
  │                │                           │                  │
  │                └─ Request complete         │                  │
  │                                            │                  │
  ✓ Success (with upgrade prompt)               │                  │
```

---

## 11. Data Structure Reference

```
REQUEST BODY EXAMPLE (Pro User):
{
  "message": "What causes gingivitis?",
  "user": {
    "id": "patient123",
    "role": "patient"
  },
  "clinic": {
    "id": "clinic456",
    "name": "Smile Dental"
  },
  "language": "en",
  "includeAIPro": true,         ← Pro flag (explicit)
  "history": [
    {
      "role": "user",
      "content": "I have sore gums"
    },
    {
      "role": "assistant",
      "content": "Let me help you..."
    }
  ]
}


RESPONSE HEADERS:
HTTP/1.1 200 OK
Content-Type: text/event-stream
Content-Encoding: identity
Cache-Control: no-cache
Connection: keep-alive
X-AI-Pro: true                  ← NEW: Pro indicator


FIRESTORE CLINIC DOCUMENT:
clinics/clinic456 {
  name: "Smile Dental",
  subscriptionPlan: "pro",
  includeAIPro: true,           ← NEW: Required for fallback
  subscriptionPriceWithAIPro: 9.99,
  phoneNumber: "+1-555-0123",
  address: "123 Main St",
  logo: "https://..."
}


FIRESTORE LOG DOCUMENT:
ai_logs/auto-id-xyz {
  userId: "patient123",
  clinicId: "clinic456",
  message: "What causes gingivitis?",
  response: "Gingivitis is inflammation of the gums...",
  category: "dental",
  language: "en",
  
  // NEW PRO FIELDS
  includeAIPro: true,
  aiProSource: "request",
  
  // MODEL INFO
  model: "gpt-4o",
  maxTokens: 1000,
  
  // METRICS
  responseLength: 1234,
  
  // TIMING
  startTime: Timestamp(2026, 1, 2, 10, 30, 40),
  endTime: Timestamp(2026, 1, 2, 10, 30, 45),
  timestamp: Timestamp(2026, 1, 2, 10, 30, 45),
  
  // STATUS
  status: "success",
  
  // DEBUGGING
  firestoreRead: true,
  firestoreError: null,
  error: null,
  errorCode: null,
  logError: null
}
```

---

**All diagrams and flows are documentation-ready.**  
**Version:** 2.0  
**Status:** ✅ Complete
