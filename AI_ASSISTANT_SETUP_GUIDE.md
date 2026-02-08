# 🤖 AI Assistant Integration - Complete Setup Guide

## ✅ التكامل مكتمل!

تم بناء المساعد الذكي بالكامل مع دعم البث المباشر (Streaming) عبر OpenAI.

---

## 📁 الملفات المُنفذة

### 1. **Backend (Cloud Function)**
- **الملف:** `functions/index.js`
- **Endpoint:** `POST /aiChat`
- **الميزات:**
  - ✅ دعم OpenAI GPT-4o
  - ✅ البث المباشر عبر SSE
  - ✅ تصنيف تلقائي للردود (dental/warning/emergency/off-topic)
  - ✅ تسجيل المحادثات في Firestore
  - ✅ دعم سياق اللغة والمستخدم

### 2. **Frontend (UI)**
- **الملف:** `app/(tabs)/ai.tsx`
- **الميزات:**
  - ✅ عرض الردود مباشرة أثناء البث (live tokens)
  - ✅ زر "إيقاف التوليد" (Stop Generating)
  - ✅ أيقونات التصنيف (🦷 dental, ⁉️ warning, ⚠️ emergency)
  - ✅ معالجة الأخطاء والـ timeout
  - ✅ حفظ المحادثات في AsyncStorage حسب اللغة
  - ✅ دعم RTL كامل

### 3. **Utilities**
- **الملف:** `src/utils/aiAssistant.ts`
- **الوظيفة:** `sendMessageToAIStream()` - client للـ streaming
- **الميزات:**
  - ✅ دعم SSE / chunked JSON / plain JSON
  - ✅ AbortController للإيقاف
  - ✅ Callbacks: `onDelta`, `onCategory`
  - ✅ Timeout: 60 ثانية (قابل للتعديل)

### 4. **Configuration**
- **الملف:** `app/config.ts`
- **المتغيرات:**
  - `AI_CHAT_ENDPOINT` - عنوان الـ endpoint
  - `AI_TIMEOUT_MS` - مدة timeout
  - `FUNCTIONS_BASE` - يتبدل بين emulator و production

---

## ⚙️ الإعداد المطلوب

### **خطوة 1: تثبيت OpenAI في Functions**

```bash
cd functions
npm install openai
```

### **خطوة 2: إعداد OpenAI API Key**

#### أ) **عبر Firebase Config (Production)**
```bash
firebase functions:config:set openai.key="sk-proj-YOUR_OPENAI_API_KEY"
```

#### ب) **عبر Environment Variable (Emulator)**
```bash
# في ملف .env داخل مجلد functions:
OPENAI_API_KEY=sk-proj-YOUR_OPENAI_API_KEY
```

أو تشغيل الـ emulator مع المتغير:
```powershell
$env:OPENAI_API_KEY="sk-proj-YOUR_KEY"; firebase emulators:start --only functions,firestore,auth,storage
```

### **خطوة 3: تشغيل Emulators**

```bash
cd c:\Users\jawad\dental-app
firebase emulators:start --only functions,firestore,auth,storage
```

**Output المتوقع:**
```
✔  functions[aiChat]: http function initialized (http://127.0.0.1:5001/dental-jawad/us-central1/aiChat).
```

### **خطوة 4: تشغيل التطبيق**

```bash
npx expo start --clear
```

---

## 🧪 الاختبار

### **Test Case 1: رسالة عادية**
1. افتح تطبيق الـ AI
2. أرسل: "ما هي أفضل طريقة لتنظيف الأسنان؟"
3. **النتيجة المتوقعة:**
   - البث المباشر يظهر (live streaming text)
   - يتم عرض زر "إيقاف التوليد"
   - الرد النهائي يظهر مع أيقونة 🦷
   - التصنيف: `dental`

### **Test Case 2: رسالة طارئة**
1. أرسل: "أعاني من ألم شديد في ضرسي!"
2. **النتيجة المتوقعة:**
   - الرد يظهر مع أيقونة ⚠️
   - لون الخلفية أحمر فاتح
   - التصنيف: `emergency`

### **Test Case 3: زر Stop**
1. أرسل سؤال طويل
2. اضغط "إيقاف التوليد" أثناء البث
3. **النتيجة المتوقعة:**
   - البث يتوقف فوراً
   - الرد الجزئي يُحفظ في المحادثة

### **Test Case 4: خطأ شبكة**
1. أوقف الـ emulator
2. أرسل رسالة
3. **النتيجة المتوقعة:**
   - رسالة خطأ تظهر: "عذراً، لم نتمكن من الاتصال"
   - fallback message من `clinicAI.responses.fallback`

### **Test Case 5: تعدد اللغات**
1. غيّر اللغة إلى العربية
2. أرسل رسالة بالعربية
3. **النتيجة المتوقعة:**
   - الرد بالعربية
   - المحادثة تُحفظ في `aiChatHistory:ar`

---

## 🎯 Request/Response Format

### **Request (من التطبيق)**
```json
POST http://127.0.0.1:5001/dental-jawad/us-central1/aiChat
Content-Type: application/json
Authorization: Bearer {firebase_token}

{
  "message": "ما هي أعراض تسوس الأسنان؟",
  "user": {
    "id": "user123",
    "role": "patient"
  },
  "clinic": {
    "id": "clinic456",
    "name": "BeSmile Dental"
  },
  "language": "ar",
  "history": [
    { "role": "user", "content": "مرحبا" },
    { "role": "assistant", "content": "مرحباً بك! كيف يمكنني مساعدتك؟" }
  ]
}
```

### **Response (SSE Stream)**
```
data: {"delta": "أعراض"}
data: {"delta": " تسوس"}
data: {"delta": " الأسنان"}
data: {"delta": " تشمل:"}
...
data: {"category": "dental"}
data: {"done": true}
```

### **Response (Fallback JSON)**
إذا فشل SSE:
```json
{
  "message": "أعراض تسوس الأسنان تشمل...",
  "category": "dental"
}
```

---

## 🛠️ التخصيص

### **تغيير الـ Model**
في `functions/index.js` (السطر ~245):
```javascript
const stream = await openai.chat.completions.create({
  model: 'gpt-4o',  // غيّر إلى 'gpt-3.5-turbo' للأرخص
  messages,
  temperature: 0.7,
  max_tokens: 500,
  stream: true,
});
```

### **تغيير الـ Timeout**
في `app/config.ts`:
```typescript
export const AI_TIMEOUT_MS = 60000; // 60 ثانية (غيّر حسب الحاجة)
```

### **تعديل System Prompt**
في `functions/index.js` - دالة `buildAISystemPrompt()`:
```javascript
const prompts = {
  en: `Your custom prompt in English...`,
  ar: `التعليمات المخصصة بالعربية...`,
};
```

### **إضافة تصنيفات جديدة**
في `functions/index.js` - دالة `classifyAIResponse()`:
```javascript
// مثال: تصنيف "معلومات عامة"
const generalKeywords = ['general', 'عام', 'معلومات'];
if (generalKeywords.some(kw => text.includes(kw))) {
  return 'general';
}
```

---

## 🚨 استكشاف الأخطاء

### **خطأ: "OpenAI not configured"**
- **السبب:** لم يتم تعيين `OPENAI_API_KEY`
- **الحل:** راجع "خطوة 2" أعلاه

### **خطأ: "fetch failed" أو timeout**
- **السبب:** الـ emulator غير مشغل أو عنوان خاطئ
- **الحل:**
  1. تأكد من تشغيل `firebase emulators:start`
  2. تأكد من `FUNCTIONS_BASE` في `app/config.ts`

### **خطأ: "AI stream failed: 401"**
- **السبب:** مشكلة في Auth header
- **الحل:** تأكد من `session.token` في `AuthContext`

### **الردود لا تظهر مباشرة**
- **السبب:** SSE لا يعمل
- **الحل:** تأكد من headers في `functions/index.js`:
  ```javascript
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  ```

---

## 📊 Logging & Monitoring

### **سجلات الـ Function**
```bash
firebase functions:log
```

### **سجلات المحادثات**
في Firestore → `ai_logs` collection:
```json
{
  "userId": "user123",
  "clinicId": "clinic456",
  "message": "السؤال...",
  "response": "الرد...",
  "category": "dental",
  "language": "ar",
  "timestamp": "2025-12-27T12:00:00Z"
}
```

---

## 🎉 الميزات الإضافية المستقبلية

- [ ] دعم الصور (Vision API)
- [ ] تحليل الأشعة السينية
- [ ] ترجمة تلقائية بين اللغات
- [ ] اقتراحات علاجات من الـ clinic
- [ ] تكامل مع جدول المواعيد

---

## 📝 ملاحظات

1. **التكلفة:** GPT-4o أغلى من 3.5-turbo - راقب الاستخدام
2. **الأمان:** API Key محمي في server-side فقط
3. **Privacy:** المحادثات تُحفظ في Firestore - أضف Privacy Policy
4. **Rate Limiting:** أضف حماية من spam في المستقبل

---

**✅ التكامل جاهز للإنتاج!**

بمجرد إعداد OpenAI API Key، يمكنك البدء بالاختبار مباشرة 🚀
