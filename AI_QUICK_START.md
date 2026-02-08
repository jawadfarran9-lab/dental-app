# 🚀 Quick Start - AI Assistant

## ⚡ التشغيل السريع (5 دقائق)

### 1️⃣ تثبيت OpenAI Package
```powershell
cd functions
npm install
# سيقوم بتثبيت openai تلقائياً من package.json
```

### 2️⃣ إعداد OpenAI API Key

**احصل على API Key من:** https://platform.openai.com/api-keys

**ثم:**

```powershell
# أ) للـ Emulator (التطوير)
cd c:\Users\jawad\dental-app
$env:OPENAI_API_KEY="sk-proj-YOUR_ACTUAL_KEY_HERE"
firebase emulators:start --only functions,firestore,auth,storage

# أو ب) للـ Production
firebase functions:config:set openai.key="sk-proj-YOUR_KEY"
firebase deploy --only functions
```

### 3️⃣ تشغيل التطبيق
```powershell
# في terminal جديد
npx expo start --clear
```

### 4️⃣ الاختبار
1. افتح التطبيق في Expo Go
2. اذهب لتبويب "AI Pro"
3. أرسل رسالة: "ما هي أفضل طريقة لتنظيف الأسنان؟"
4. **يجب أن ترى:**
   - "المساعد يكتب..."
   - البث المباشر للنص
   - زر "إيقاف التوليد"
   - أيقونة 🦷 عند اكتمال الرد

---

## ✅ Checklist

- [ ] تثبيت `npm install` في `/functions`
- [ ] تعيين `OPENAI_API_KEY`
- [ ] تشغيل emulators
- [ ] تشغيل expo
- [ ] اختبار رسالة واحدة
- [ ] اختبار زر Stop
- [ ] اختبار رسالة طارئة ("ألم شديد")
- [ ] اختبار تغيير اللغة

---

## 🔍 التحقق من النجاح

### ✅ Functions Emulator يعمل
```
✔  functions[aiChat]: http function initialized (http://127.0.0.1:5001/...)
```

### ✅ التطبيق متصل
في console الـ app:
```
[AI] Connecting to: http://127.0.0.1:5001/dental-jawad/us-central1/aiChat
```

### ✅ البث يعمل
في console الـ functions:
```
[aiChat] Received message from user123
[aiChat] Streaming response...
```

---

## 🚨 حل المشاكل السريع

| المشكلة | الحل |
|---------|------|
| "OpenAI not configured" | تأكد من `$env:OPENAI_API_KEY` قبل `firebase emulators:start` |
| "fetch failed" | تأكد أن emulator يعمل على port 5001 |
| "timeout" | زد `AI_TIMEOUT_MS` في `app/config.ts` |
| لا يظهر بث مباشر | تحقق من SSE headers في functions/index.js |
| رسائل بالإنجليزي رغم اختيار العربية | تأكد من `i18n.language` في AuthContext |

---

## 📌 الخطوة التالية

بعد التأكد من عمل النظام:
1. راجع [AI_ASSISTANT_SETUP_GUIDE.md](AI_ASSISTANT_SETUP_GUIDE.md) للتفاصيل الكاملة
2. اقرأ [app/config.ts](app/config.ts) لتخصيص الإعدادات
3. راجع `functions/index.js` لتعديل System Prompt
4. جرب Test Cases في دليل الإعداد

---

**جاهز؟ ابدأ الآن! ⬆️**
