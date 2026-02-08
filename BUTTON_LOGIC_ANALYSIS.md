# 🧠 Subscription Button Logic - Complete Analysis

## Overview
The "Start Subscription" button on the **Clinic Details screen** (signup.tsx) is a split button with:
- **Left side**: Action button labeled "Start Subscription"
- **Right side**: Price display (e.g., "$19.99/month")

---

## 1. Button Text & Label Source

### Where does it come from?
**File**: [app/clinic/signup.tsx](app/clinic/signup.tsx#L595)  
**Lines**: 595-598

```tsx
<Text style={[styles.subscriptionButtonText, { color: colors.buttonText }]}>
  {t('auth.startSubscription', 'Start Subscription')}
</Text>
```

### What it shows:
- **Always displays**: `"Start Subscription"` (hardcoded text from translations)
- **NO price inside the button** - price is on the right side only
- Uses i18n translation key: `'auth.startSubscription'`
- Default fallback: `'Start Subscription'`

---

## 2. Price Display Logic

### Where does the price come from?
**File**: [app/clinic/signup.tsx](app/clinic/signup.tsx#L95-L134)  
**Function**: `useFocusEffect()` hook (lines 95-134)  
**Source**: AsyncStorage (set by Plan Selection screen)

### How it loads:
```tsx
const results = await AsyncStorage.multiGet([
  'pendingSubscriptionPlan',        // 'MONTHLY' or 'YEARLY'
  'pendingSubscriptionPlanName',    // 'Monthly' or 'Annual'
  'pendingSubscriptionPrice',       // Base price (e.g., '19.99')
  'pendingSubscriptionPriceWithAIPro', // Price with AI Pro add-on
]);
```

### Price Priority Logic:
1. **First choice**: `priceWithAIPro` (if user selected AI Pro on previous screen)
2. **Second choice**: `basePrice` (if no AI Pro)
3. **Fallback**: Derived price based on plan ID
   - If `YEARLY`: `'230.88'`
   - If `MONTHLY`: `'19.99'`

### Stored State:
```tsx
const [planLabel, setPlanLabel] = useState('Monthly');  // 'Monthly' or 'Annual'
const [planPrice, setPlanPrice] = useState('19.99');    // Price as string
```

### Display on Button:
**File**: [app/clinic/signup.tsx](app/clinic/signup.tsx#L600-L605)  
**Lines**: 600-605

```tsx
<Text style={[styles.displayPriceValue, { color: colors.buttonText }]}>
  ${planPrice}
</Text>
<Text style={[styles.displayPricePeriod, { color: colors.buttonText }]}>
  {(planLabel || 'Monthly').toLowerCase().includes('year') ? '/year' : '/month'}
</Text>
```

**Displays**: `$19.99/month` or `$230.88/year` or `$29.98/month` (with AI Pro)

---

## 3. Plan Sync & Data Flow

### How it syncs with selected plan:

**Source Screen**: Plan Selection (`app/clinic/subscribe.tsx`)
1. User selects plan (Monthly/Yearly)
2. Optionally adds AI Pro
3. Clicks "Subscribe" button

**Data saved to AsyncStorage** (lines 173-189):
```tsx
await AsyncStorage.multiSet([
  ['pendingSubscriptionPlan', plan.id],              // 'MONTHLY' or 'YEARLY'
  ['pendingSubscriptionPlanName', plan.name],       // 'Monthly' or 'Annual'
  ['pendingSubscriptionPrice', plan.basePrice.toFixed(2)],
  ['pendingSubscriptionPriceWithAIPro', finalPrice.toFixed(2)],
  ['pendingIncludeAIPro', String(selectedAIPro)],
]);
```

**Destination Screen**: Clinic Details (`app/clinic/signup.tsx`)
1. Screen mounts
2. `useFocusEffect` hook triggers (runs on every focus)
3. Loads plan data from AsyncStorage
4. Updates `planLabel` and `planPrice` state
5. Button displays updated price

### Timing:
- Plan loads **every time user focuses** on Clinic Details screen
- Allows user to go back and change plan, then return with new pricing
- Uses `useFocusEffect` (not `useEffect`) for this reason

---

## 4. Button Enable/Disable Conditions

### Function: `isFormValid()`
**File**: [app/clinic/signup.tsx](app/clinic/signup.tsx#L155-L163)  
**Lines**: 155-163

```tsx
const isFormValid = () => {
  const emailOk = email && email.includes('@') && email.includes('.');
  const passwordOk = password && password.length >= 6;
  const paymentMethodOk = selectedPaymentMethod !== null;
  const cardOk = isCardValid();
  const allFieldsOk = firstName && lastName && emailOk && passwordOk && paymentMethodOk;
  const cardOrOtherPayment = selectedPaymentMethod === 'card' ? cardOk : true;
  return Boolean(allFieldsOk && cardOrOtherPayment && !loading);
};
```

### Button Disabled Logic:
**File**: [app/clinic/signup.tsx](app/clinic/signup.tsx#L582)

```tsx
disabled={!isFormValid() || loading}
```

### Button Enables When ALL of these are true:
✅ Form is valid (`isFormValid()` returns true)  
✅ NOT currently loading (`!loading`)

---

## 5. Required Fields

### For ANY payment method:
- ✅ **First Name** (non-empty)
- ✅ **Last Name** (non-empty)
- ✅ **Email** (contains `@` AND `.`)
- ✅ **Password** (at least 6 characters)
- ✅ **Payment Method Selected** (one of: Card, Apple Pay, PayPal, Google Pay)

### If Payment Method = "Card":
- ✅ **Card Name** (2+ characters)
- ✅ **Card Number** (15-19 digits)
- ✅ **Card Expiry** (format: MM/YY or MM/YYYY)
- ✅ **Card CVC** (3-4 digits)

### If Payment Method = Apple Pay / PayPal / Google Pay:
- ❌ **NO card details required** - shows mock dialog only

### Optional Fields (NOT checked):
- Clinic Name
- Clinic Phone
- Phone (personal)
- Country
- City

---

## 6. Payment Validations

### Card Validation Function: `isCardValid()`
**File**: [app/clinic/signup.tsx](app/clinic/signup.tsx#L146-L154)  
**Lines**: 146-154

```tsx
const isCardValid = (): boolean => {
  if (selectedPaymentMethod !== 'card') return true; // Skip if not card
  const num = cardNumber.replace(/\s+/g, '');
  const numOk = /^\d{15,19}$/.test(num);                    // 15-19 digits
  const expOk = /^(0[1-9]|1[0-2])\/(\d{2}|\d{4})$/.test(cardExpiry); // MM/YY or MM/YYYY
  const cvcOk = /^\d{3,4}$/.test(cardCvc);                  // 3-4 digits
  const nameOk = cardName.trim().length >= 2;              // 2+ characters
  return numOk && expOk && cvcOk && nameOk;
};
```

### Validation Rules:
| Field | Rule | Example |
|-------|------|---------|
| **Card Number** | 15-19 digits | `4532123456789010` |
| **Expiry** | MM/YY or MM/YYYY | `12/25` or `12/2025` |
| **CVC** | 3-4 digits | `123` or `1234` |
| **Name** | 2+ characters | `John Doe` |

### Double Validation:
**In `onSignup()` function** (lines 175-180), validation is checked AGAIN:
```tsx
if (selectedPaymentMethod === 'card' && !isCardValid()) {
  return Alert.alert(
    t('payment.invalidCard', 'Invalid Card'), 
    t('payment.checkCardDetails', 'Please enter valid card details.')
  );
}
```

---

## 7. Button Click Routing

### When User Clicks "Start Subscription":
**Handler Function**: `onSignup()`  
**File**: [app/clinic/signup.tsx](app/clinic/signup.tsx#L165-L260)  
**Lines**: 165-260

### Step-by-Step Flow:

#### Step 1: Validation (lines 167-182)
```tsx
if (!email || !password || !firstName || !lastName) → Alert & return
if (selectedPaymentMethod === null) → Alert & return
if (selectedPaymentMethod === 'card' && !isCardValid()) → Alert & return
```

#### Step 2: Set Loading State (line 184)
```tsx
setLoading(true);  // Disables button, shows spinner
```

#### Step 3: Get Clinic ID (lines 186-194)
```tsx
const existingClinicId = await AsyncStorage.getItem('clinicId');
if (!existingClinicId) throw new Error('No clinic found...');
```

#### Step 4: Save Data to AsyncStorage (lines 196-208)
```tsx
await AsyncStorage.multiSet([
  ['pendingClinicName', clinicName.trim() || 'Clinic'],
  ['pendingClinicPhone', clinicPhone.trim() || ''],
  ['pendingSubscriptionEmail', email.toLowerCase().trim()],
  ['pendingPaymentMethod', selectedPaymentMethod || 'card'],
  // Card details if Card selected
]);
```

#### Step 5: Update Firestore (lines 210-224)
```tsx
await updateDoc(doc(db, 'clinics', existingClinicId), {
  firstName, lastName, clinicName, clinicPhone,
  email, password, phone, country, city,
  accountCreatedAt: Date.now(),
  status: 'active',
});
```

#### Step 6: Process Payment (line 227)
```tsx
await processPayment();  // Routes to payment handler
```

---

## 8. Logic & APIs Triggered

### `processPayment()` Function
**File**: [app/clinic/signup.tsx](app/clinic/signup.tsx#L229-L250)  
**Lines**: 229-250

```tsx
const processPayment = async () => {
  switch (selectedPaymentMethod) {
    case 'apple-pay':
      await simulateApplePayFlow();     // Shows mock dialog
      break;
    case 'paypal':
      await simulatePayPalFlow();       // Shows mock dialog
      break;
    case 'google-pay':
      await simulateGooglePayFlow();    // Shows mock dialog
      break;
    case 'card':
    default:
      await completePaymentAndLogin();  // Completes immediately
      return;
  }
};
```

### Mock Payment Flows:
- **Apple Pay** (lines 252-279): Shows dialog → user taps "Complete Payment"
- **PayPal** (lines 281-308): Shows dialog → user taps "Complete Payment"
- **Google Pay** (lines 310-337): Shows dialog → user taps "Complete Payment"
- **Card** (line 247): Skips dialog, goes directly to login

### All payment methods call:
```tsx
await completePaymentAndLogin();  // Lines 339-349
```

---

## 9. Next Navigation (Where User Goes)

### After Successful Payment:
**Function**: `completePaymentAndLogin()`  
**File**: [app/clinic/signup.tsx](app/clinic/signup.tsx#L339-L349)  
**Lines**: 339-349

```tsx
const completePaymentAndLogin = async () => {
  setLoading(false);
  Alert.alert(
    t('common.success'),
    'Payment successful! Your clinic account is ready.',
    [{ 
      text: t('common.ok'), 
      onPress: () => {
        router.push('/clinic/dashboard' as any);  // ← ROUTES HERE
      } 
    }]
  );
};
```

### Next Screen:
📍 **Route**: `/clinic/dashboard`  
📍 **Purpose**: Clinic owner dashboard (post-login)

### Navigation Chain:
```
Plan Selection (subscribe.tsx)
    ↓ (Save plan)
Clinic Details (signup.tsx)
    ↓ (Start Subscription button)
Process Payment
    ↓ (Payment successful)
Clinic Dashboard (/clinic/dashboard)
```

---

## 10. File & Function Map

### Key Files:

| File | Purpose | Key Functions |
|------|---------|---------------|
| [app/clinic/subscribe.tsx](app/clinic/subscribe.tsx) | Plan Selection Screen | `handleSubscribe()`, `calculateSubscriptionPrice()`, `getButtonText()` |
| [app/clinic/signup.tsx](app/clinic/signup.tsx) | Clinic Details Screen | `loadPlan()` (useFocusEffect), `isFormValid()`, `isCardValid()`, `onSignup()`, `processPayment()` |
| [src/types/subscription.ts](src/types/subscription.ts) | Pricing Constants | `SUBSCRIPTION_PRICING`, `SUBSCRIPTION_PRICING_OLD` |

### Function Flow:

```
Plan Selection Screen
├─ User selects plan
└─ handleSubscribe(plan)
   └─ Saves to AsyncStorage
   └─ Routes to /clinic/signup

Clinic Details Screen
├─ Screen loads
├─ useFocusEffect hook
│  └─ loadPlan() reads AsyncStorage
│     └─ Sets planLabel & planPrice state
│
├─ User fills form
├─ isFormValid() checks all conditions
│  ├─ checks: firstName, lastName, email, password
│  ├─ checks: paymentMethodOk
│  └─ checks: cardOk (if payment method = card)
│
├─ User clicks "Start Subscription"
└─ onSignup() handler
   ├─ Validates all fields (double-check)
   ├─ Saves clinic data + payment info to AsyncStorage
   ├─ Updates Firestore clinic document
   ├─ processPayment()
   │  └─ Shows mock payment dialog or processes card
   │     └─ completePaymentAndLogin()
   │        └─ Routes to /clinic/dashboard
```

---

## 11. State Variables Used

### Plan & Pricing State:
```tsx
const [planLabel, setPlanLabel] = useState('Monthly');      // Current plan name
const [planPrice, setPlanPrice] = useState('19.99');        // Current plan price
```

### User Input State:
```tsx
const [firstName, setFirstName] = useState('');
const [lastName, setLastName] = useState('');
const [email, setEmail] = useState('');
const [password, setPassword] = useState('');
const [phone, setPhone] = useState('');
const [country, setCountry] = useState('');
const [city, setCity] = useState('');
const [clinicName, setClinicName] = useState('');
const [clinicPhone, setClinicPhone] = useState('');
```

### Payment State:
```tsx
const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'card' | 'apple-pay' | 'paypal' | 'google-pay' | null>(null);
const [cardName, setCardName] = useState('');
const [cardNumber, setCardNumber] = useState('');
const [cardExpiry, setCardExpiry] = useState('');
const [cardCvc, setCardCvc] = useState('');
```

### UI State:
```tsx
const [loading, setLoading] = useState(false);              // Button spinner/disabled state
const [showPassword, setShowPassword] = useState(false);    // Password visibility toggle
```

---

## Summary

**Button Component**: Split layout (action + price display)  
**Button Text**: Static "Start Subscription" (no price inside)  
**Price Source**: AsyncStorage data from Plan Selection screen  
**Enable/Disable**: `isFormValid()` checks required fields + payment validation  
**Click Handler**: `onSignup()` → Firestore update → Payment processing → Dashboard  
**Next Route**: `/clinic/dashboard`  

All data flows through **AsyncStorage** and **Firestore**, with proper validation at each step.
