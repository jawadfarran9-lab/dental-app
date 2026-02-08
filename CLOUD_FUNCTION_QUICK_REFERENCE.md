# 🔧 CLOUD FUNCTION v2.0 - QUICK REFERENCE

**Purpose:** Quick lookup for Cloud Function changes in AI Pro update

---

## Request Body Changes

### Before (v1.0)
```typescript
{
  message: string;
  user?: object;
  clinic?: object;
  language?: string;
  history?: array;
}
```

### After (v2.0) - NEW FIELD
```typescript
{
  message: string;
  user?: object;
  clinic?: object;
  language?: string;
  history?: array;
  includeAIPro?: boolean;  // ← NEW
}
```

---

## Response Behavior

### For Free Users (`includeAIPro: false`)
```
Token Limit:     500 tokens
Temperature:     0.7
Response Style:  Concise, brief
Includes:        + Upgrade prompt at end
Length:          ~200-400 chars
```

### For Pro Users (`includeAIPro: true`)
```
Token Limit:     1000 tokens (2x)
Temperature:     0.6 (more consistent)
Response Style:  Detailed, analysis-heavy
Includes:        Medical references, treatment options
Length:          ~800-1600 chars
```

---

## Pro Status Detection Flow

```
Request arrives with includeAIPro field
    ↓
Is includeAIPro provided?
    ├─ YES → Use request value (fastest)
    └─ NO → Check Firestore fallback
           ↓
        Read clinics/{clinic.id}.includeAIPro
           ↓
        Found? → Use Firestore value
        Not found? → Default to false (free tier)
           ↓
        Apply OpenAI parameters based on status
```

---

## Code Location in Cloud Function

**File:** `functions/index.js`

### Endpoint
- **Line:** ~270-365
- **Function:** `POST /aiChat`
- **Size:** 225 lines (updated from 95)

### Helper Functions
- **buildAISystemPrompt()** - Generates system prompt (Pro vs Free)
- **getOpenAIParams()** - Returns model settings based on Pro status
- **buildUpgradeSuggestion()** - Creates upgrade message for free users

### Key Additions
1. `logData` object for comprehensive audit
2. Firestore read fallback with error handling
3. Dynamic OpenAI parameters
4. `X-AI-Pro` response header
5. Upgrade suggestion injection

---

## Testing Checklist

- [ ] Pro user sends `includeAIPro: true` → Gets 1000 tokens
- [ ] Free user sends `includeAIPro: false` → Gets 500 tokens + upgrade
- [ ] No flag sent → Reads Firestore for Pro status
- [ ] Firestore has no clinic → Defaults to free tier
- [ ] Firestore read fails → Logs error, defaults to free
- [ ] Arabic language works for both Pro/Free
- [ ] Response headers include `X-AI-Pro: true/false`
- [ ] Logs written to `ai_logs` collection
- [ ] Error scenarios handled gracefully

---

## Logs to Monitor

**Success log:**
```
[aiChat] Success (Pro: true, Category: dental, Length: 1234)
```

**Firestore fallback:**
```
[aiChat] Read includeAIPro from Firestore: true
```

**Firestore error:**
```
[aiChat] Failed to read includeAIPro from Firestore: network error
```

**Log write failure:**
```
[aiChat] Log write failed: permission denied
```

---

## Firestore Schema Updates

### Clinics Collection
```firestore
clinics/{clinicId}
├── includeAIPro: boolean          ← NEW (optional)
├── name: string
├── subscriptionPlan: string
└── ...existing fields...
```

### Logs Collection
```firestore
ai_logs/{docId}                    ← NEW collection
├── userId: string
├── clinicId: string
├── message: string
├── response: string
├── category: string
├── includeAIPro: boolean          ← NEW
├── aiProSource: string            ← NEW ('request'|'firestore'|'fallback')
├── model: string                  ← NEW ('gpt-4o')
├── maxTokens: number              ← NEW (500 or 1000)
├── timestamp: timestamp
└── ...error/timing fields...
```

---

## Example Requests

### Pro User (Explicit)
```bash
curl -X POST "http://localhost:5001/.../api/aiChat" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Explain gingivitis",
    "includeAIPro": true,
    "clinic": {"id": "clinic123"},
    "language": "en"
  }'
```

### Free User (Explicit)
```bash
curl -X POST "http://localhost:5001/.../api/aiChat" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Explain gingivitis",
    "includeAIPro": false,
    "clinic": {"id": "clinic123"},
    "language": "en"
  }'
```

### Auto-detect (Firestore Fallback)
```bash
curl -X POST "http://localhost:5001/.../api/aiChat" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Explain gingivitis",
    "clinic": {"id": "clinic123"},
    "language": "en"
  }'
```

---

## Response Headers

### All Responses Include
```
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive
X-AI-Pro: true|false    ← NEW: Indicates Pro feature usage
```

---

## Integration Checklist

- [ ] Frontend sends `includeAIPro` in request body
- [ ] Cloud Function updated with new logic
- [ ] Firestore `clinics` collection has `includeAIPro` field
- [ ] `ai_logs` collection created (auto-created on first write)
- [ ] OpenAI API key configured
- [ ] Logs readable and queryable
- [ ] Error handling tested
- [ ] Monitored for 24 hours post-deploy

---

## Rollback Plan

If issues occur:

```bash
# 1. Stop accepting includeAIPro flag
#    (revert Cloud Function)
# 2. All requests default to free tier (500 tokens)
# 3. No breaking changes for existing code
# 4. Firestore fallback disabled
# 5. Logs continue to work
```

No data migration needed - fully backwards compatible.

---

## Performance Impact

- **Request processing:** +5-10ms (Firestore read if needed)
- **Response size:** Same or slightly larger (Pro = more tokens)
- **Token usage:** Pro users = 2x tokens, Free = baseline
- **Firestore reads:** 1 read per request without includeAIPro flag
- **Logging:** Adds 1 Firestore write per request

**Optimization:** Have clients always send `includeAIPro` to skip Firestore read.

---

## Monitoring Dashboard

### Query Template (Firestore)
```javascript
// Pro vs Free split
db.collection('ai_logs')
  .aggregate([
    { groupBy: 'includeAIPro', count: 'count' }
  ])

// Average response length by tier
db.collection('ai_logs')
  .aggregate([
    { groupBy: 'includeAIPro', avg: 'responseLength' }
  ])

// Error rate
db.collection('ai_logs')
  .where('status', '==', 'error')
  .aggregate([{ count: 'count' }])

// Most used feature
db.collection('ai_logs')
  .aggregate([
    { groupBy: 'category', count: 'count' },
    { limit: 10 }
  ])
```

---

## Deployment Checklist

- [ ] Test all 3 Pro status detection paths
- [ ] Verify OpenAI parameters change based on Pro status
- [ ] Check Firestore read handles missing fields
- [ ] Confirm error logging works
- [ ] Validate response headers include X-AI-Pro
- [ ] Test with both EN and AR languages
- [ ] Monitor logs for 24 hours post-deploy
- [ ] Set up alerts for error spikes

---

## FAQ

**Q: What if client doesn't send includeAIPro?**  
A: Cloud Function checks Firestore. If not there, defaults to false (free tier).

**Q: What if Firestore read fails?**  
A: Error is logged, function defaults to free tier, request succeeds.

**Q: Do old clients break?**  
A: No. All changes backwards compatible. Old requests get free tier automatically.

**Q: How is Pro status tracked?**  
A: `aiProSource` field in logs shows if it came from request or Firestore.

**Q: Can I query Pro usage?**  
A: Yes. Query `ai_logs` collection: `where('includeAIPro', '==', true)`

---

**Last Updated:** January 2, 2026  
**Status:** ✅ Production Ready
