# AI Pro QA & UX - Quick Integration Guide

**Quick reference for using the new components and analytics**

---

## 🚀 Using the New Components

### 1. Success Modal (After Subscription)

```tsx
// Import
import { AIProSuccessModal } from '@/src/components/AIProSuccessModal';

// In your subscription/checkout screen:
const [showSuccess, setShowSuccess] = useState(false);

<AIProSuccessModal
  visible={showSuccess}
  planName="Premium AI Pro"
  onClose={() => setShowSuccess(false)}
  onStartChat={() => {
    setShowSuccess(false);
    router.push('/(tabs)/ai');
  }}
/>

// Show after payment success:
// setShowSuccess(true);
```

---

### 2. PRO Badge (Header/Profile)

```tsx
// Import
import { AIProBadge } from '@/src/components/AIProBadge';

// In your header:
{hasAIPro && <AIProBadge size="small" animated={true} />}

// In user profile:
<AIProBadge size="medium" showLabel={true} />

// In profile without label:
<AIProBadge size="large" showLabel={false} />
```

**Sizes:**
- `small` - 20px (badges in lists)
- `medium` - 28px (default)
- `large` - 36px (prominent displays)

---

### 3. Feature Tooltip (Chat Responses)

```tsx
// Import
import { AIProFeatureTooltip } from '@/src/components/AIProFeatureTooltip';

// Show when Pro response received:
const [showTooltip, setShowTooltip] = useState(false);

<AIProFeatureTooltip
  visible={showTooltip && hasAIPro}
  message="AI Pro features enabled"
  autoHide={true}
  duration={3000}
  position="top"
/>

// Trigger on first Pro response:
// if (hasAIPro && firstProResponse) {
//   setShowTooltip(true);
// }
```

---

## 📊 Analytics Events

### Available Events

| Event | When | How to Track |
|-------|------|------------|
| `AI_PRO_BANNER_SHOWN` | User views home (Pro) | ✅ Already integrated in home.tsx |
| `UPGRADE_PROMPT_SHOWN` | Non-Pro user tries chat | ✅ Already integrated in ai.tsx |
| `AI_CHAT_STARTED` | User sends first message | ✅ Already integrated in ai.tsx |
| `AI_FEATURE_USED` | Pro response received | ✅ Already integrated in ai.tsx |
| `AI_PRO_UPGRADED` | Subscription purchased | Use after payment |
| `UPGRADE_PROMPT_CLICKED` | User clicks upgrade button | Use on button click |

---

### Track Manual Events

```tsx
// Import
import {
  trackAIProUpgraded,
  trackUpgradePromptClicked,
} from '@/src/utils/aiProAnalytics';

// After payment success:
await trackAIProUpgraded(clinicId, 'premium');

// On upgrade button click:
const handleUpgradeClick = async () => {
  await trackUpgradePromptClicked(clinicId);
  router.push('/subscription');
};
```

---

### Event Payload

All events automatically include:
```typescript
{
  event: string;           // Event type (e.g., 'AI_CHAT_STARTED')
  clinicId: string;        // User's clinic ID
  userId?: string;         // User ID from auth
  timestamp: number;       // Current time in ms
  featureName?: string;    // Feature used (for AI_FEATURE_USED)
  metadata?: object;       // Additional data
}
```

---

## 🔍 Checking Analytics Data

### View Stored Events

```tsx
import AsyncStorage from '@react-native-async-storage/async-storage';

// Get all stored analytics events
const events = await AsyncStorage.getItem('aiProAnalytics:events');
console.log(JSON.parse(events || '[]'));
```

### Clear Analytics (Development Only)

```tsx
await AsyncStorage.removeItem('aiProAnalytics:events');
```

---

## 📋 File Locations

**Components:**
```
src/components/
├── AIProSuccessModal.tsx       (150 lines)
├── AIProBadge.tsx              (80 lines)
└── AIProFeatureTooltip.tsx     (100 lines)
```

**Already Integrated:**
```
app/(tabs)/
├── home.tsx                    ✅ Banner tracking
└── ai.tsx                      ✅ Upgrade + chat + feature tracking
```

**Analytics Utility:**
```
src/utils/
└── aiProAnalytics.ts           (All event types available)
```

**QA Testing:**
```
AI_PRO_QA_TESTING_PLAN.md       (27 test cases, 4-6 hours)
```

---

## 🧪 Testing Checklist

### Component Testing
- [ ] Modal shows on successful subscription
- [ ] Modal buttons navigate correctly
- [ ] Badge displays in header/profile
- [ ] Tooltip auto-hides after 3 seconds
- [ ] All components work in dark/light mode
- [ ] All components work in EN/AR languages

### Analytics Testing
- [ ] Events appear in AsyncStorage
- [ ] No console errors
- [ ] Events include clinicId and timestamp
- [ ] Events don't block UI

### Full QA (27 Tests)
See: `AI_PRO_QA_TESTING_PLAN.md`
- Time: 4-6 hours
- Categories: 8
- Test cases: 27

---

## ⚡ Common Integration Patterns

### Pattern 1: Show Success After Payment
```tsx
// In checkout/subscription screen:
const handlePaymentSuccess = async (result) => {
  // Update Firestore with AI Pro flag
  await updateClinicAIPro(clinicId, true);
  
  // Show success modal
  setShowSuccess(true);
  
  // Track the upgrade
  await trackAIProUpgraded(clinicId, 'premium');
};
```

### Pattern 2: Track Feature Usage
```tsx
// In ai.tsx when response arrives:
useEffect(() => {
  if (responseText && hasAIPro && clinicId) {
    trackAIFeatureUsed('detailed-analysis', clinicId)
      .catch(() => {}); // Silent failure
  }
}, [responseText, hasAIPro, clinicId]);
```

### Pattern 3: Display Pro Status
```tsx
// In header component:
<View style={styles.header}>
  <Text>{userRole}</Text>
  {hasAIPro && <AIProBadge size="small" animated />}
</View>
```

---

## 🐛 Troubleshooting

### Components Not Showing
- Check imports: `import { AIProBadge } from '@/src/components/AIProBadge'`
- Verify props are correct
- Check theme context is available

### Analytics Not Recording
- Verify clinicId is available: `console.log(clinicId)`
- Check AsyncStorage: Use DevTools
- Ensure useEffect dependencies are correct

### Styling Issues
- Verify theme colors in context
- Check dark/light mode: `useTheme().colors`
- Test RTL: Check `i18n.language` is 'ar'

---

## 📚 Documentation Files

1. **AI_PRO_QA_TESTING_PLAN.md**
   - 27 comprehensive test cases
   - Step-by-step testing guide
   - Test result template
   - Sign-off checklist

2. **AI_PRO_QA_AND_UX_COMPLETE.md**
   - Complete implementation summary
   - Component specifications
   - Analytics data flow
   - Integration status

3. **This File**
   - Quick reference
   - Code examples
   - Common patterns
   - Troubleshooting

---

## ✅ Status

**✅ COMPLETE & READY FOR INTEGRATION**

- Components: Ready to use
- Analytics: Already tracking (home.tsx + ai.tsx)
- Documentation: Comprehensive guides provided
- QA Plan: 27 test cases ready

**Next Steps:**
1. Integrate components into screens (1-2 hours)
2. Run full QA testing (4-6 hours)
3. Validate analytics dashboard
4. Deploy to production

---

*Quick Reference Guide v1.0*
*AI Pro Subscription Feature - Phase 2*
