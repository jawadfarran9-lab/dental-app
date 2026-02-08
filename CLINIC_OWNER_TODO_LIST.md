# 🔨 قائمة المهام الفورية – ما يجب إنجازه

## ✅ الحالة الحالية

### ✨ **ما هو موجود وجاهز (لا يحتاج شيء):**
- ✅ تسجيل الدخول (`login.tsx`) - **كامل**
- ✅ لوحة المرضى (`index.tsx`) - **كامل 95%**
- ✅ إنشاء مريض (`create.tsx`) - **كامل**
- ✅ تفاصيل المريض (`[patientId].tsx`) - **كامل**
- ✅ إدارة الفريق (`team.tsx`) - **كامل**
- ✅ الإعدادات (`settings.tsx`) - **كامل 95%**
- ✅ جميع الحماية والحراس - **كامل 90%**

---

## 🔴 **المهام الضرورية (يجب إنجازها الآن):**

### **المهمة 1: إصلاح صفحة الرسائل** 
**Priority: 🔴 CRITICAL**  
**Time: ~1-2 ساعة**  
**File:** `app/clinic/messages.tsx`

#### المشكلة:
```javascript
// الحالي (خاطئ):
const messages = [
  { id: 'p1', title: 'John Doe', lastMessage: 'Thank you, doctor!', unread: 2 },
  { id: 'p2', title: 'Jane Smith', lastMessage: 'Can we reschedule?', unread: 0 },
];
// ✗ بيانات mock فقط!
```

#### الحل:
```typescript
// يجب أن تصبح:

import { useEffect, useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/firebaseConfig';
import { useClinic } from '@/context/ClinicContext';

export default function ClinicMessages() {
  const { clinicId } = useClinic();
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!clinicId) return;
    
    // 1. استعلام جميع المرضى
    // 2. لكل مريض → آخر رسالة
    // 3. عد غير المقروء
    // 4. عرض في List
  }, [clinicId]);

  // ... باقي الكود
}
```

#### المطلوب بالضبط:
1. ✅ استعلام `collection('patients')` where `clinicId == current`
2. ✅ لكل مريض → استعلام `collection('patients/{id}/messages')`
3. ✅ الحصول على آخر رسالة (`orderBy('createdAt', 'desc').limit(1)`)
4. ✅ عد غير المقروء (`where('readByClinic', '==', false)`)
5. ✅ عرض في List مع نفس الـ styling من `index.tsx`

---

### **المهمة 2: إضافة تحقق من كلمة المرور**
**Priority: 🟠 HIGH**  
**Time: ~1 ساعة**  
**Files:** 
- `app/clinic/settings.tsx` (تعديل)
- `app/clinic/index.tsx` (تعديل الزر)
- `components/AuthPromptModal.tsx` (ملف جديد)

#### المشكلة:
```typescript
// الحالي (غير آمن):
<TouchableOpacity 
  onPress={() => router.push('/clinic/settings')}
>
  <Text>Settings</Text>
</TouchableOpacity>
// ✗ مباشر بدون تحقق!
```

#### الحل:
```typescript
// يجب أن يصبح:

import AuthPromptModal from '../components/AuthPromptModal';

export default function ClinicHome() {
  const [authPromptVisible, setAuthPromptVisible] = useState(false);
  const [authAction, setAuthAction] = useState('');
  
  const handleSettingsPress = () => {
    setAuthAction('settings');
    setAuthPromptVisible(true);
  };
  
  const handleAuthSuccess = () => {
    setAuthPromptVisible(false);
    if (authAction === 'settings') {
      router.push('/clinic/settings');
    } else if (authAction === 'create-doctor') {
      router.push('/clinic/team');
    }
  };

  return (
    <>
      <TouchableOpacity onPress={handleSettingsPress}>
        <Text>⚙️ Settings</Text>
      </TouchableOpacity>

      <AuthPromptModal 
        visible={authPromptVisible}
        onSuccess={handleAuthSuccess}
        onCancel={() => setAuthPromptVisible(false)}
      />
    </>
  );
}
```

#### المكون الجديد (Component):
```typescript
// app/components/AuthPromptModal.tsx

import React, { useState } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useAuth } from '@/src/context/AuthContext';
import { useTheme } from '@/src/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

export default function AuthPromptModal({ visible, onSuccess, onCancel }) {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { clinicUser } = useAuth();
  const { colors } = useTheme();

  const handleVerify = async () => {
    if (!password) {
      Alert.alert('Validation', 'Please enter your password');
      return;
    }

    setLoading(true);
    try {
      // التحقق من كلمة المرور مع Firestore
      // استعلام clinicMembers حيث email = clinicUser.email و password = input
      
      // إذا صحيحة:
      setPassword('');
      onSuccess?.();
    } catch (error) {
      Alert.alert('Error', 'Password is incorrect');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}>
        <View style={{ backgroundColor: colors.card, padding: 20, borderRadius: 12, width: '80%' }}>
          <Text style={{ fontSize: 18, fontWeight: '700', color: colors.textPrimary, marginBottom: 12 }}>
            Verify Your Identity
          </Text>
          
          <TextInput
            placeholder="Enter your password"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            style={{ borderWidth: 1, borderColor: colors.cardBorder, padding: 12, borderRadius: 8, marginBottom: 16 }}
          />

          <View style={{ flexDirection: 'row', gap: 12 }}>
            <TouchableOpacity 
              style={{ flex: 1, backgroundColor: colors.accentBlue, padding: 12, borderRadius: 8 }}
              onPress={handleVerify}
              disabled={loading}
            >
              <Text style={{ color: '#fff', textAlign: 'center', fontWeight: '700' }}>
                {loading ? 'Verifying...' : 'Verify'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={{ flex: 1, borderWidth: 1, borderColor: colors.cardBorder, padding: 12, borderRadius: 8 }}
              onPress={onCancel}
            >
              <Text style={{ color: colors.textPrimary, textAlign: 'center', fontWeight: '700' }}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
```

---

### **المهمة 3: الأزرار الثلاثة في الرأس** (اختياري - تنظيم)
**Priority: 🟢 NICE TO HAVE**  
**Time: ~30 دقيقة**  
**File:** `app/clinic/index.tsx`

#### الحالي:
```
[🆕 Patient] [💬 Messages] [👨‍⚕️ Team] [⚙️ Settings]
```

#### المطلوب:
```
الترتيب الأفضل:

الصف الأول:
[⚙️ Settings]  [👨‍⚕️ Doctor]  [🆕 Patient]

أو في صف واحد مع scrollable horizontal
```

---

## ✅ **التحقق النهائي قبل الإطلاق:**

### **قائمة الاختبار (Testing Checklist):**

```
من شاشة الترحيب:
□ الضغط على "أنا مشترك" → يذهب إلى تسجيل الدخول ✅
□ إدخال البريد + كلمة المرور → يسجل الدخول بنجاح ✅
□ ينقل إلى لوحة المرضى ✅

في لوحة المرضى:
□ شبكة المرضى تعرض بشكل صحيح ✅
□ كل مريض قابل للضغط عليه ✅
□ زر "نشئ مريض جديد" يعمل ✅
□ زر "الرسائل" يعرض محادثات حقيقية (بعد الإصلاح) ✅
□ زر "الفريق" يعمل ✅
□ الضغط على "الإعدادات" → يطلب تحقق من كلمة المرور ✅

في صفحة إنشاء مريض:
□ إدخال البيانات → ينشئ مريض بنجاح ✅
□ يعطي رمز فريد ✅

في تفاصيل المريض:
□ عرض معلومات المريض ✅
□ عرض الجلسات ✅
□ إرسال واستقبال الرسائل ✅
□ إضافة جلسة جديدة ✅

في إدارة الفريق:
□ دعوة عضو جديد يعمل ✅
□ تغيير الأدوار يعمل ✅

في الإعدادات:
□ تحديث بيانات العيادة ✅
□ تغيير الصورة ✅
□ الألوان تُحفظ بشكل صحيح ✅
```

---

## 📊 **ملخص المهام:**

| المهمة | الأولوية | الوقت | الحالة |
|-------|----------|-------|--------|
| إصلاح صفحة الرسائل | 🔴 Critical | 1-2 ساعة | ⏳ يحتاج عمل |
| تحقق من كلمة المرور | 🟠 High | 1 ساعة | ⏳ يحتاج عمل |
| تحسين الأزرار | 🟢 Nice | 30 دقيقة | ✅ اختياري |
| الاختبار الشامل | 🟠 High | 1-2 ساعة | ⏳ ضروري |

**الإجمالي: 3-5 ساعات للإنتاج** 🚀

---

## 🎯 **الأولوية القصوى:**

1. **اليوم:** إصلاح الرسائل + تحقق كلمة المرور
2. **غداً:** اختبار شامل + إطلاق

**أنا جاهز للبدء الآن!** ✅

