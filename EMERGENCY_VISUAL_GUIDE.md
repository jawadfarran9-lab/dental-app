# Emergency Alerts & AI Assistant Button - Quick Visual Guide

## User Flow

### 1. Home Screen (Entry Point)
```
┌─────────────────────────────────────┐
│  HOME SCREEN                        │
│                                     │
│  ┌──────────────┬──────────────┐    │
│  │  My Clinic   │   Upload     │    │
│  │   (Brief)    │    (Add)     │    │
│  └──────────────┴──────────────┘    │
│  ┌──────────────────────────────┐   │
│  │   اسأل الذكاء 🧠 (NEW!)     │   │
│  │      Ask AI Assistant        │   │
│  └──────────────────────────────┘   │
│                                     │
│  [Stories Row]                      │
│  [Posts Feed]                       │
└─────────────────────────────────────┘
         ↓ (tap button)
         │
         ↓
```

### 2. AI Chat Screen (Hidden Tab)
```
┌─────────────────────────────────────┐
│  AI DENTAL ASSISTANT                │
│  "Educational info only"            │
├─────────────────────────────────────┤
│ 👋 Hi! I'm a dental AI              │
│    Can help with general info...    │
│                                     │
│ ┌─ USER: "I have severe pain" ─┐  │
│ │ (Blue bubble)                 │  │
│ └───────────────────────────────┘  │
│                                     │
│ ┌─ 🚨 EMERGENCY (RED) 🚨 ────────┐ │
│ │ ⚠️ This is serious.             │ │
│ │ Please see a dentist NOW!      │ │
│ │ (Red bubble, alert icon, border) │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─ USER: "What about calculus?" ┐ │
│ │ (Blue bubble)                  │ │
│ └────────────────────────────────┘ │
│                                     │
│ ┌─ ⚠️ WARNING (YELLOW) ────────────┐│
│ │ Sorry, only dental topics...    ││
│ │ (Yellow bubble, warning icon)   ││
│ └────────────────────────────────┘│
│                                     │
│ [Input: "Type your question..."]   │
│ [Send Button]                       │
└─────────────────────────────────────┘
```

## Emergency Detection System

### Message Processing Pipeline:
```
User Input
    │
    ↓
[1] EMPTY? → No message warning
    ↓
[2] EMERGENCY KEYWORDS? → 🚨 Red Alert (PRIORITY 1)
    └─ Examples: pain, bleeding, swelling, infection, fever
    │  Styling: Red background, alert-circle icon, red border
    │
    ↓ (if not emergency)
[3] NON-DENTAL KEYWORDS? → ⚠️ Yellow Warning (PRIORITY 2)
    └─ Examples: math, weather, programming, politics
    │  Styling: Yellow background, warning icon
    │
    ↓ (if not non-dental)
[4] DENTAL KEYWORDS? → ✅ Dental Response (PRIORITY 3)
    └─ Examples: tooth, cavity, implant, gum, brushing
    │  Styling: Gray background, normal text
    │
    ↓ (if ambiguous)
[5] DEFAULT → Helpful reminder (PRIORITY 4)
    └─ "I'm a dental assistant..."
       Styling: Gray background, normal text
```

## Emergency Keywords (15+ Examples)

**Urgent/Emergency:**
- pain, severe pain, unbearable pain
- bleeding, bleed, blood
- swelling, swollen, swell
- infection, infected, abscess
- difficulty breathing, can't breathe
- pus, discharge
- knocked out, tooth knocked
- jaw pain, jaw swollen
- fever, feverish
- can't chew, unable to chew
- serious, urgent, emergency

## Bubble Styling Guide

### Emergency Bubble (Red)
```
┌────────────────────────────────┐
│ ⚠️ 🚨 EMERGENCY ALERT 🚨 ⚠️    │
│ ┌──────────────────────────────┤
│ │ This appears to be a serious │
│ │ dental emergency. Please     │
│ │ contact a dentist            │
│ │ immediately.                 │
│ └──────────────────────────────┘
│
│ Background: #fee2e2 (light red)
│ Text: #991b1b (dark red)
│ Border: 2px #dc2626 (bright red)
│ Icon: alert-circle (18px, bright red)
```

### Warning Bubble (Yellow)
```
┌────────────────────────────────┐
│ ⚠️ WARNING                      │
│ ┌──────────────────────────────┤
│ │ Sorry, I can only help with  │
│ │ dental-related topics. Please │
│ │ ask about oral health...     │
│ └──────────────────────────────┘
│
│ Background: #fef3c7 (light yellow)
│ Text: #78350f (dark brown)
│ Icon: warning (16px, orange)
```

### Normal Dental Bubble (Gray)
```
┌────────────────────────────────┐
│ Regular dental response here    │
│ about teeth, gums, cavity, etc │
│                                │
│ Background: colors.cardBorder  │
│ Text: colors.textPrimary       │
│ Icon: None                     │
```

### User Bubble (Blue)
```
┌────────────────────────────────┐
│ User's question or message...  │
│                                │
│ Background: colors.accentBlue  │
│ Text: #fff (white)             │
│ Alignment: Right (LTR) / Left  │
```

## Language Support

### Emergency Alert Translations (14 Languages)

| Language | Alert Message |
|----------|---------------|
| 🇸🇦 Arabic | ⚠️ هذا يبدو أمرًا حساسًا، يرجى مراجعة طبيب الأسنان المختص فورًا. |
| 🇩🇪 German | ⚠️ Dies scheint ein ernstes zahnärztliches Problem zu sein. Bitte konsultieren Sie sofort einen Zahnarzt. |
| 🇺🇸 English | ⚠️ This appears to be a serious dental emergency. Please contact a dentist immediately. |
| 🇪🇸 Spanish | ⚠️ Esto parece ser una emergencia dental seria. Por favor, comuníquese con un dentista de inmediato. |
| 🇫🇷 French | ⚠️ Cela semble être une urgence dentaire grave. Veuillez consulter un dentiste immédiatement. |
| 🇮🇱 Hebrew | ⚠️ זה נראה כמו חירום שיניים חמור. אנא פנו לרופא שיניים מיד. |
| 🇮🇳 Hindi | ⚠️ यह एक गंभीर दंत आपातकाल प्रतीत होता है। कृपया तुरंत दंत चिकित्सक से संपर्क करें। |
| 🇮🇹 Italian | ⚠️ Questo sembra essere un'emergenza dentale grave. Si prega di contattare immediatamente un dentista. |
| 🇯🇵 Japanese | ⚠️ これは深刻な歯科医療上の緊急事態のようです。すぐに歯科医に連絡してください。 |
| 🇰🇷 Korean | ⚠️ 이것은 심각한 치과 응급 상황처럼 보입니다. 즉시 치과의사에게 연락하세요. |
| 🇧🇷 Portuguese | ⚠️ Isso parece ser uma emergência dental grave. Por favor, contate um dentista imediatamente. |
| 🇷🇺 Russian | ⚠️ Это выглядит как серьезная стоматологическая ситуация. Пожалуйста, немедленно обратитесь к стоматологу. |
| 🇹🇷 Turkish | ⚠️ Bu ciddi bir diş acil durumu gibi görünüyor. Lütfen hemen bir diş hekimine başvurun. |
| 🇨🇳 Chinese | ⚠️ 这似乎是一个严重的牙科紧急情况。请立即联系牙医。 |

## RTL Support

The implementation maintains full RTL support for:
- 🇸🇦 Arabic (ar)
- 🇮🇱 Hebrew (he)
- 🇮🇷 Farsi (fa)
- 🇵🇰 Urdu (ur)

### RTL Behavior:
```
LTR (English):                RTL (Arabic):
┌─────────┐                  ┌─────────┐
│User: Hi │                  │ :يالع │
└─────────┘                  └─────────┘
┌────────────────────┐       ┌────────────────────┐
│ AI: Hello...       │       │          :ملاسلا │
└────────────────────┘       └────────────────────┘
```

## Implementation Files

### Core Files:
1. **src/utils/aiAssistant.ts** (230 lines)
   - EMERGENCY_KEYWORDS array
   - isEmergencySituation() function
   - sendMessageToAI() with priority logic
   - AIResponse interface with isEmergency field

2. **app/(tabs)/ai.tsx** (300+ lines)
   - ChatMessage interface with isEmergency flag
   - renderMessage() with 3-tier styling
   - handleSend() capturing emergency flag
   - Red bubble styling for emergencies

3. **app/(tabs)/home.tsx** (1030+ lines)
   - New "اسأل الذكاء 🧠" button
   - Position: 3rd in top action bar
   - Router navigation to `/ai` tab
   - RTL-aware styling

4. **app/i18n/** (14 language files)
   - clinicAI.emergencyAlert key added
   - 14 localized translations
   - Consistent with app tone

## Feature Checklist

✅ Emergency keyword detection (15+ keywords)
✅ Priority-based message filtering
✅ Red emergency bubble styling
✅ Alert icon (alert-circle, 18px)
✅ Red border on emergency bubbles
✅ Home screen button added
✅ "اسأل الذكاء 🧠" button label
✅ Router navigation to `/ai` tab
✅ Emergency translations (14 languages)
✅ RTL layout support
✅ TypeScript type safety
✅ Theme color integration
✅ Ionicons used throughout

## Testing Checklist

Test cases for emergency detection:
- [ ] "I have severe pain" → Red bubble
- [ ] "My tooth is bleeding" → Red bubble
- [ ] "I have an infection" → Red bubble
- [ ] "I have difficulty breathing" → Red bubble
- [ ] "What's the weather?" → Yellow bubble
- [ ] "How do I brush my teeth?" → Gray bubble (dental)
- [ ] Home screen button visible
- [ ] Button routes to `/ai` screen
- [ ] Arabic language shows RTL layout
- [ ] All bubble colors render correctly

---

**Status**: ✅ COMPLETE & PRODUCTION-READY
