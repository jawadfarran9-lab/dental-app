# 🚀 AI PRO QUICK START GUIDE

## For Frontend Developers

### Import & Use in Any Screen

#### Option 1: Show Upgrade Prompt Modal
```tsx
import { AIProUpgradePrompt } from '@/src/components/AIProUpgradePrompt';

export function MyScreen() {
  const [showUpgrade, setShowUpgrade] = useState(false);
  const { clinicId } = useAuth();

  return (
    <>
      <Button onPress={() => setShowUpgrade(true)}>
        Use AI Feature
      </Button>

      <AIProUpgradePrompt
        visible={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        clinicId={clinicId}
        context="my_feature"
      />
    </>
  );
}
```

#### Option 2: Gate a Feature
```tsx
import { AIProFeatureGate } from '@/src/components/AIProFeatureGate';
import { useAIProStatus } from '@/src/hooks/useAIProStatus';

export function MyScreen() {
  const { hasAIPro } = useAIProStatus();
  const { clinicId } = useAuth();

  return (
    <AIProFeatureGate
      hasAIPro={hasAIPro}
      clinicId={clinicId}
      featureName="Advanced Analysis"
      context="analysis_screen"
    >
      <MyAdvancedComponent />
    </AIProFeatureGate>
  );
}
```

#### Option 3: Check Pro Status
```tsx
import { useAIProStatus } from '@/src/hooks/useAIProStatus';

export function MyScreen() {
  const { hasAIPro, isLoading } = useAIProStatus();

  if (isLoading) return <Loading />;

  return (
    <View>
      {hasAIPro ? (
        <Text>Pro Feature Available</Text>
      ) : (
        <Text>Upgrade to use this feature</Text>
      )}
    </View>
  );
}
```

#### Option 4: Track Custom Event
```tsx
import { trackAIFeatureUsed } from '@/src/utils/aiProAnalytics';

const handleFeatureUse = async () => {
  await trackAIFeatureUsed(clinicId, 'my_feature_name');
  // Use feature
};
```

---

## For Backend Team

### What You Receive

Every message to AI now includes:
```json
{
  "message": "user message text",
  "language": "en",
  "clinicId": "clinic123",
  "includeAIPro": true,
  "history": [...],
  "user": { "id": "user123", "role": "patient" }
}
```

### What You Should Do

Check the `includeAIPro` flag:

```javascript
// Cloud Function code
exports.aiChat = functions.https.onRequest(async (req, res) => {
  const { includeAIPro, message } = req.body;

  if (includeAIPro) {
    // Unlock Pro features
    const response = await getAdvancedAIResponse(message);
    return res.json(response);
  } else {
    // Basic features only
    const response = await getBasicAIResponse(message);
    return res.json(response);
  }
});
```

---

## Component Props Reference

### AIProUpgradePrompt
```tsx
interface Props {
  visible: boolean;           // Modal visibility
  onClose: () => void;        // Close callback
  clinicId?: string;          // For analytics
  context?: string;           // Analytics context
}
```

### AIProFeatureGate
```tsx
interface Props extends ViewProps {
  hasAIPro: boolean;          // Pro status
  clinicId?: string;          // Clinic ID for analytics
  context?: string;           // Feature context
  featureName?: string;       // Feature name for display
  showLocked?: boolean;       // Show locked state (default true)
  children: ReactNode;        // Content to gate
}
```

### AIProBanner
```tsx
interface Props {
  visible: boolean;           // Banner visibility
  clinicId: string;          // Clinic ID for analytics
  onPress?: () => void;      // Tap callback
}
```

### useAIProStatus
```tsx
interface Returns {
  hasAIPro: boolean;          // Pro status
  aiProPrice: number;         // 9.99
  subscriptionTier?: string;  // Pro tier name
  finalPrice?: number;        // Final price
  isLoading: boolean;         // Loading state
  error: Error | null;        // Error if any
}
```

---

## Analytics Events

### Automatic (No Code Needed)
- Banner shown → `ai_pro_banner_shown`
- Banner clicked → `ai_pro_banner_clicked`
- Prompt shown → `upgrade_prompt_shown`
- Prompt clicked → `upgrade_prompt_clicked`

### Manual (Call Manually)
```tsx
import { trackAIFeatureUsed } from '@/src/utils/aiProAnalytics';

await trackAIFeatureUsed(clinicId, 'feature_name');
```

### All Available Events
```typescript
import { 
  trackAIProSelected,
  trackAIProUpgraded,
  trackAIFeatureUsed,
  trackAIChatStarted,
} from '@/src/utils/aiProAnalytics';

// Selection in subscription flow
await trackAIProSelected(clinicId);

// After upgrade complete
await trackAIProUpgraded(clinicId);

// When using advanced feature
await trackAIFeatureUsed(clinicId, 'feature_name');

// When chat session starts
await trackAIChatStarted(clinicId);
```

---

## Firestore Data

### Required Fields in Firestore

Location: `clinics/{clinicId}`

```javascript
{
  "includeAIPro": true,                    // boolean
  "subscriptionPlan": "PRO_AI",           // string
  "subscriptionPriceWithAIPro": 9.99      // number
}
```

### Where useAIProStatus Looks

1. **Firestore**: `clinics/{clinicId}`
2. **AsyncStorage Cache Keys**:
   - `clinicIncludeAIPro` → boolean
   - `clinicSubscriptionTier` → string
   - `clinicFinalPrice` → number

---

## Theming

### Colors Used
```typescript
// Magenta theme for AI Pro
primary: '#d946ef'           // Main magenta
light: '#f5e6ff'            // Light background
dark: '#2e1065'             // Dark background
```

### Dark Mode Support
All components automatically support dark mode:
- Light theme: Bright backgrounds
- Dark theme: Dark backgrounds
- Proper contrast maintained

### RTL Support
All components support RTL languages (Arabic, Hebrew, etc):
- Text alignment auto-flips
- Icons positioned correctly
- Layout mirrors properly

---

## Common Patterns

### Pattern 1: Show feature only for Pro
```tsx
{hasAIPro && <ProFeature />}
```

### Pattern 2: Show disabled state for non-Pro
```tsx
<AIProFeatureGate hasAIPro={hasAIPro}>
  <MyFeature />
</AIProFeatureGate>
```

### Pattern 3: Conditional UI based on Pro
```tsx
if (hasAIPro) {
  return <ProVersion />;
} else {
  return <BasicVersion />;
}
```

### Pattern 4: Check before action
```tsx
const handleProAction = async () => {
  if (!hasAIPro) {
    setShowUpgradePrompt(true);
    return;
  }
  // Execute Pro action
};
```

---

## Testing

### Test AI Pro Enabled
1. Go to Firestore
2. Find clinic document
3. Set `includeAIPro: true`
4. App will show:
   - Banner on home
   - Full AI features
   - Pro badge

### Test AI Pro Disabled
1. Set `includeAIPro: false`
2. App will show:
   - No banner
   - Upgrade prompt
   - Feature locked

### Test Analytics
```typescript
import { getStoredAnalyticsLogs } from '@/src/utils/aiProAnalytics';

// In your app
const logs = await getStoredAnalyticsLogs();
console.log('Analytics logs:', logs);

// Clear logs
await clearAnalyticsLogs();
```

---

## Troubleshooting

### Issue: "hasAIPro is always false"
**Check:**
1. Firestore has `includeAIPro: true`
2. User is logged in (clinicId available)
3. Check console for Firestore errors

### Issue: "Modal won't close"
**Check:**
1. onClose callback is being called
2. State is being updated
3. No overlapping modals

### Issue: "Analytics not logging"
**Check:**
1. AsyncStorage permissions granted
2. clinicId is available
3. Check AsyncStorage contents

### Issue: "Banner not showing"
**Check:**
1. hasAIPro is true
2. clinicId is available
3. Banner container visible

---

## Performance Tips

1. **Cache Pro Status**
   - useAIProStatus automatically caches to AsyncStorage
   - No need to refetch constantly

2. **Lazy Load Modals**
   - Only render when visible
   - Use conditional rendering

3. **Batch Analytics**
   - Events stored locally
   - Upload to Firebase in batches

4. **Optimize Re-renders**
   - Use useMemo for expensive computations
   - Memoize callbacks

---

## File Locations

```
src/
├── components/
│   ├── AIProUpgradePrompt.tsx     ← Main modal
│   ├── AIProFeatureGate.tsx       ← Gate wrapper
│   └── AIProBanner.tsx            ← Home banner
├── hooks/
│   └── useAIProStatus.ts          ← Status hook
└── utils/
    ├── aiProAnalytics.ts          ← Analytics
    └── aiAssistant.ts             ← Backend integration

app/(tabs)/
├── ai.tsx                         ← Chat with prompt
└── home.tsx                       ← Home with banner
```

---

## API Reference Summary

### Hook: useAIProStatus
```tsx
const {
  hasAIPro,          // boolean
  aiProPrice,        // 9.99
  subscriptionTier,  // string
  finalPrice,        // number
  isLoading,         // boolean
  error              // Error | null
} = useAIProStatus();
```

### Component: AIProUpgradePrompt
```tsx
<AIProUpgradePrompt
  visible={boolean}
  onClose={() => {}}
  clinicId="string"
  context="string"
/>
```

### Component: AIProFeatureGate
```tsx
<AIProFeatureGate
  hasAIPro={boolean}
  clinicId="string"
  context="string"
  featureName="string"
  showLocked={boolean}
>
  {children}
</AIProFeatureGate>
```

### Function: Track Event
```tsx
await trackAIFeatureUsed(clinicId, 'feature_name');
```

---

## Deployment Checklist

- [ ] Firestore has includeAIPro field for clinics
- [ ] Cloud Function updated to read flag
- [ ] Backend feature unlock logic implemented
- [ ] Testing on dev/staging environment
- [ ] Analytics dashboard setup
- [ ] A/B testing configured (optional)
- [ ] Monitoring alerts set up
- [ ] Release notes prepared

---

## Support

For issues or questions:
1. Check the comprehensive guide: `AI_PRO_FEATURE_GATING_COMPLETE.md`
2. Review code examples in this file
3. Check test checklist for debugging

---

*Quick reference for implementing AI Pro features across the app.*
