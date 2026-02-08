# 🎯 Payment Methods Quick Reference

## Component Structure

```
ClinicPayment Screen
├── DentalCover
├── Back Button
└── Main Card
    ├── Title & Subtitle
    ├── Plan Summary Box
    ├── Features List (5 items)
    ├── 🆕 Payment Methods Section
    │   ├── "Choose Payment Method" Title
    │   ├── Grid of Tiles
    │   │   ├── Card [Icon + Label]
    │   │   ├── Apple Pay [Icon + Label] (iOS only)
    │   │   ├── PayPal [Icon + Label]
    │   │   └── Google Pay [Icon + Label] (Android only)
    │   └── Prompt Message (dynamic)
    │
    ├── 🆕 Card Details Section (conditional)
    │   ├── Name Input
    │   ├── Card Number Input
    │   ├── [Expiry Input] [CVC Input]
    │   └── Total Due Display
    │
    └── Confirm Button (intelligent state)
```

---

## State Flow

```
┌─ No Method Selected ─┐
│                      │
│   Button: DISABLED   │
│   (gray)             │
│                      │
└──────────────────────┘
         ↓ (tap method)
         
┌─ Method Selected ─┐
│ (non-card)        │
│                   │
│ Button: ENABLED   │
│ (blue)            │
│ Prompt: Shows     │
│                   │
└───────────────────┘
         ↓ (tap Card method)
         
┌─ Card Method Selected ─┐
│                        │
│ Card fields appear     │
│ Button: disabled       │
│ (waiting for valid)    │
│                        │
└────────────────────────┘
         ↓ (enter valid data)
         
┌─ Valid Card Data ──┐
│                    │
│ Button: ENABLED    │
│ (blue, ready)      │
│                    │
└────────────────────┘
         ↓ (tap confirm)
         
┌─ Processing ────┐
│                 │
│ Button: shows   │
│ spinner         │
│ disabled        │
│                 │
└─────────────────┘
         ↓ (payment complete)
         
┌─ Success ──────┐
│                │
│ Navigate to    │
│ feedback page  │
│                │
└────────────────┘
```

---

## Tile Design

```
      ┌─────────────┐
      │             │
      │    🎨 Icon  │  32x32
      │   (Colored  │
      │   when sel) │
      │             │
      │   Label     │
      │   12px      │
      │             │
      └─────────────┘
      
  Selection: Blue border 3px
  Unselected: Input border 2px
```

### Icons Used (MaterialCommunityIcons)
- **Card**: `credit-card`
- **Apple Pay**: `apple`
- **PayPal**: `paypal`
- **Google Pay**: `google-pay`

---

## Validation Rules

### Card Method
```
✓ Name: length >= 2
✓ Card: 15-19 digits
✓ Expiry: MM/YY or MM/YYYY
✓ CVC: 3-4 digits
```

### Other Methods
```
✓ Just need selection
```

### Button Enable Logic
```typescript
cardValid() {
  if (selectedPaymentMethod !== 'card') 
    return selectedPaymentMethod !== null;  // Just needs selection
  
  // Full validation for card
  return cardNum ✓ && expiry ✓ && cvc ✓ && name ✓ && !loading
}
```

---

## Prompt Messages

| Selection | Message |
|-----------|---------|
| None | (empty) |
| Card | "Ready to process card payment" |
| Apple Pay | "Redirecting to Apple Pay…" |
| PayPal | "Redirecting to PayPal…" |
| Google Pay | "Redirecting to Google Pay…" |

---

## Payment Method Handlers

```typescript
handlePaymentMethodChange(method)
  ↓
  set selectedPaymentMethod
  set paymentPrompt (from messages object)

handleProcessPayment()
  ↓
  if (paymentMethod) {
    switch (selectedPaymentMethod) {
      case 'card':        → confirmSubscription() [direct]
      case 'apple-pay':   → simulateApplePayFlow() → Alert
      case 'paypal':      → simulatePayPalFlow() → Alert
      case 'google-pay':  → simulateGooglePayFlow() → Alert
    }
  }
```

---

## Platform Behavior

```
iOS:
  ✓ Card
  ✓ Apple Pay (rendered)
  ✓ PayPal
  ✗ Google Pay (hidden)
  
Android:
  ✓ Card
  ✗ Apple Pay (hidden)
  ✓ PayPal
  ✓ Google Pay (rendered)
```

Uses `Platform.OS` check:
```typescript
{Platform.OS === 'ios' && (
  <TouchableOpacity>Apple Pay</TouchableOpacity>
)}

{Platform.OS === 'android' && (
  <TouchableOpacity>Google Pay</TouchableOpacity>
)}
```

---

## Color Palette

```typescript
// Default (unselected)
borderColor: colors.inputBorder        // Light gray
backgroundColor: colors.inputBackground // White/Dark bg
icon color: colors.textPrimary         // Text color

// Selected
borderColor: colors.accentBlue         // Bright blue
borderWidth: 3                         // 3px border
icon color: colors.accentBlue          // Blue icon
prompt color: colors.accentBlue        // Blue text
```

---

## Firebase/AsyncStorage

### Stored On Completion
```typescript
clinicDocument.paymentMethod = 'apple-pay' | 'card' | 'paypal' | 'google-pay'

emailReceipt.method = 'APPLE_PAY' | 'CARD' | 'PAYPAL' | 'GOOGLE_PAY'
```

### Pending Clear After Confirmation
```typescript
multiRemove([
  'pendingSubscriptionPlan',
  'pendingSubscriptionPlanName',
  'pendingSubscriptionPrice',
  'pendingSubscriptionPriceWithAIPro',
  'pendingIncludeAIPro',
  'pendingClinicName',
  'pendingClinicPhone',
])
```

---

## Code Locations

| Feature | File | Lines |
|---------|------|-------|
| State | `payment.tsx` | 28-42 |
| Imports | `payment.tsx` | 1-15 |
| Handlers | `payment.tsx` | 85-220 |
| JSX Section | `payment.tsx` | 430-490 |
| Card Details | `payment.tsx` | 495-533 |
| Styles | `payment.tsx` | 708-755 |

---

## Testing Commands

```bash
# Build
npm run build

# Test on iOS
npm run ios

# Test on Android
npm run android

# Web preview
npx expo start --web
```

---

## Common Customizations

### Change Tile Size
```typescript
paymentMethodTile: {
  minWidth: '22%',  // ← Change this (currently 22% of row)
  aspectRatio: 1,    // ← 1 = square, 1.5 = portrait, 0.8 = landscape
}
```

### Change Icon Size
```typescript
<MaterialCommunityIcons name="..." size={32} />  // ← Change 32
```

### Change Layout (2 columns instead of 4)
```typescript
paymentMethodsGrid: {
  flexWrap: 'wrap',
  gap: 12,
  justifyContent: 'space-between'  // ← Add this
}
paymentMethodTile: {
  minWidth: '45%',  // ← Change to 45% for 2 cols
}
```

### Add More Payment Methods
```typescript
// Add to JSX
<TouchableOpacity onPress={() => handlePaymentMethodChange('crypto')}>
  <MaterialCommunityIcons name="bitcoin" size={32} />
  <Text>Crypto</Text>
</TouchableOpacity>

// Add to type
selectedPaymentMethod: useState<'...' | 'crypto' | null>(null)

// Add to messages object
const messages = {
  ...
  'crypto': 'Redirecting to blockchain wallet…'
}

// Add to handler
case 'crypto': await simulateCryptoFlow(); break;
```

---

## UX Enhancements (Future)

- [ ] Payment method remembering (save preference)
- [ ] Biometric payment confirmation
- [ ] Real payment receipts (PDF download)
- [ ] Payment history dashboard
- [ ] Subscription management (upgrade/downgrade)
- [ ] Multiple payment methods on file
- [ ] Payment method edit/delete

---

**Last Updated**: January 9, 2026  
**Status**: ✅ Production Ready
