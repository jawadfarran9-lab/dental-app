# 🧪 Payment Methods Testing & Demo Guide

## Quick Start Testing

### Prerequisites
```bash
cd c:\Users\jawad\dental-app
npm install  # Already done
npx expo start -c --port 8081
```

### Test on Different Devices

#### iOS (Real or Simulator)
```bash
npx expo start --ios
```
- ✅ Should see: Card, Apple Pay, PayPal tiles
- ✅ Google Pay hidden
- ✅ Platform-aware rendering working

#### Android (Real or Emulator)
```bash
npx expo start --android
```
- ✅ Should see: Card, PayPal, Google Pay tiles
- ✅ Apple Pay hidden
- ✅ Platform-aware rendering working

---

## Test Scenarios

### Scenario 1: Card Payment Flow
**Goal**: Verify card input validation and processing

**Steps**:
1. Navigate to payment screen (complete signup first)
2. Tap **"Card"** tile
   - ✅ Tile border turns blue (3px)
   - ✅ Icon turns blue
   - ✅ Prompt shows: "Ready to process card payment"
   - ✅ Card input fields appear below

3. Verify button is **disabled** (gray)
   ```
   [Cardholder Name]: (empty)
   [Card Number]: (empty)
   [MM/YY] [CVC]: (empty)
   ```

4. Enter **invalid card data**:
   - Name: "A" (too short)
   - Card: "1234" (too short)
   - Expiry: "13/25" (invalid month)
   - CVC: "12" (too short)
   - ✅ Button stays **disabled**

5. Enter **valid card data**:
   ```
   Cardholder Name: John Smith
   Card Number: 4532015112830366
   Expiry: 12/25
   CVC: 123
   ```
   - ✅ Button turns **blue** (enabled)
   - ✅ Shows: "Pay $19.99 now"

6. Tap **"Pay $19.99 now"**
   - ✅ Button shows spinner
   - ✅ Button disabled during processing
   - ✅ Subscription confirmation email received
   - ✅ Navigate to feedback screen

### Scenario 2: Apple Pay Flow (iOS Only)
**Goal**: Verify Apple Pay simulation

**Steps**:
1. Navigate to payment screen
2. Tap **"Apple Pay"** tile
   - ✅ Tile border turns blue
   - ✅ Icon turns blue
   - ✅ Prompt shows: "Redirecting to Apple Pay…"
   - ✅ No card input fields appear

3. Verify **Confirm button is enabled** (just needs selection)

4. Tap **"Pay $19.99 now"**
   - ✅ Alert dialog appears: "Apple Pay"
   - ✅ Message: "In a real app, Apple Pay would open here..."
   - ✅ Two buttons: [Cancel] [Complete Payment]

5. Tap **[Complete Payment]**
   - ✅ Alert dismisses
   - ✅ Subscription processed
   - ✅ Email receipt sent with method: "APPLE_PAY"
   - ✅ Navigate to feedback screen

6. (Optional) Tap **[Cancel]**
   - ✅ Dialog closes
   - ✅ Stay on payment screen
   - ✅ Can try different method

### Scenario 3: PayPal Flow (All Platforms)
**Goal**: Verify PayPal simulation

**Steps**:
1. Navigate to payment screen
2. Tap **"PayPal"** tile
   - ✅ Tile border turns blue
   - ✅ Icon turns blue
   - ✅ Prompt shows: "Redirecting to PayPal…"

3. Tap **"Pay $19.99 now"**
   - ✅ Alert dialog appears: "PayPal"
   - ✅ Message: "In a real app, you would be redirected to PayPal..."
   - ✅ Buttons: [Cancel] [Complete Payment]

4. Tap **[Complete Payment]**
   - ✅ Process completes
   - ✅ Email receipt with method: "PAYPAL"

### Scenario 4: Google Pay Flow (Android Only)
**Goal**: Verify Google Pay simulation

**Steps**:
1. Navigate to payment screen (Android)
2. Tap **"Google Pay"** tile
   - ✅ Tile border turns blue
   - ✅ Icon turns blue
   - ✅ Prompt shows: "Redirecting to Google Pay…"

3. Tap **"Pay $19.99 now"**
   - ✅ Alert dialog appears: "Google Pay"
   - ✅ Message: "In a real app, Google Pay would open..."

4. Tap **[Complete Payment]**
   - ✅ Process completes
   - ✅ Email receipt with method: "GOOGLE_PAY"

### Scenario 5: Method Switching
**Goal**: Verify user can switch between methods

**Steps**:
1. Select **Card** method
   - ✅ Card fields appear
   - ✅ Prompt: "Ready to process card payment"

2. Tap **PayPal** method
   - ✅ Card fields disappear
   - ✅ Card border returns to default
   - ✅ PayPal border turns blue
   - ✅ Prompt changes: "Redirecting to PayPal…"

3. Tap **Apple Pay** (iOS)
   - ✅ PayPal border returns to default
   - ✅ Apple Pay border turns blue
   - ✅ Prompt: "Redirecting to Apple Pay…"

4. Back to **Card**
   - ✅ Card fields reappear
   - ✅ Prompt: "Ready to process card payment"

---

## Visual Verification Checklist

### Layout & Spacing
- [ ] Payment method tiles are evenly spaced
- [ ] Tiles wrap cleanly on small screens
- [ ] No tiles overlap
- [ ] Card input section has proper margin
- [ ] Button spans full width minus padding

### Colors & Borders
- [ ] Unselected tiles have light gray border (2px)
- [ ] Selected tile has blue border (3px)
- [ ] Selected icon is blue
- [ ] Prompt text is blue
- [ ] Card fields have proper borders

### Typography
- [ ] "Choose Payment Method" title is bold (700)
- [ ] Tile labels are 12px
- [ ] Prompt text is 13px
- [ ] Button text is 16px bold
- [ ] Input placeholders are visible

### Icons
- [ ] Card icon: credit card symbol
- [ ] Apple Pay icon: Apple logo
- [ ] PayPal icon: PayPal logo
- [ ] Google Pay icon: Google Pay symbol
- [ ] Icons are centered in tiles
- [ ] Icons are 32x32 size

---

## Mobile-Specific Checks

### iOS
```
Portrait Mode:
  ✅ 4 tiles fit in 1 row
  ✅ Scroll is smooth
  ✅ Keyboard doesn't overlap fields
  
Landscape Mode:
  ✅ 4 tiles visible
  ✅ Layout adapts
  ✅ No horizontal scrolling needed
```

### Android
```
Portrait Mode:
  ✅ 3 tiles visible (no Apple Pay)
  ✅ Wrap to 2-3 rows
  ✅ Scrollable
  
Landscape Mode:
  ✅ Tiles displayed efficiently
  ✅ Layout adapts
```

---

## Validation Testing

### Card Number Validation
```
Valid Patterns:
  ✅ 4532015112830366 (16 digits)
  ✅ 378282246310005 (15 digits - Amex)
  ✅ 6011111111111117 (16 digits - Discover)

Invalid Patterns:
  ❌ 1234 (4 digits)
  ❌ 12345678901234567890 (20 digits)
  ❌ 123456789012a56 (contains letter)
  ❌ (empty)
```

### Expiry Validation
```
Valid Patterns:
  ✅ 01/25
  ✅ 12/2025
  ✅ 09/99

Invalid Patterns:
  ❌ 13/25 (month > 12)
  ❌ 00/25 (month = 0)
  ❌ 1/25 (missing leading zero)
  ❌ 12-25 (wrong separator)
  ❌ (empty)
```

### CVC Validation
```
Valid Patterns:
  ✅ 123 (3 digits)
  ✅ 1234 (4 digits - Amex)

Invalid Patterns:
  ❌ 12 (2 digits)
  ❌ 12345 (5 digits)
  ❌ abc (letters)
  ❌ (empty)
```

### Cardholder Name
```
Valid:
  ✅ "John Smith" (2+ characters)
  ✅ "J. Smith"
  ✅ "Maria José González"

Invalid:
  ❌ "J" (1 character)
  ❌ "" (empty)
  ❌ "   " (whitespace only)
```

---

## Error Handling Tests

### What Should Happen on Error

1. **Network Error During Payment**
   - Alert shows: "Error: Payment failed. Please try again."
   - Button returns to enabled state
   - User can retry

2. **Invalid Firebase Credentials**
   - Alert shows: "Error: Permission denied..."
   - Subscription not created
   - User can try again

3. **AsyncStorage Failure**
   - Alert shown
   - Error logged to console
   - User can retry

---

## Data Verification

### Check Firebase Firestore
After successful payment, verify clinic document contains:

```
clinics/{clinicId}
├── subscribed: true ✅
├── subscriptionPlan: 'MONTHLY' or 'YEARLY' ✅
├── subscriptionPrice: 19.99 ✅
├── subscriptionPriceWithAIPro: 19.99 or 29.98 ✅
├── paymentMethod: 'card' | 'apple-pay' | 'paypal' | 'google-pay' ✅
├── subscriptionUpdatedAt: timestamp ✅
├── status: 'active' ✅
```

### Check AsyncStorage
```
clinicSubscriptionPlan: 'MONTHLY'
clinicSubscriptionPrice: '19.99'
clinicSubscriptionPriceWithAIPro: '19.99'
```

### Check Email (Mock)
```
Email Received:
  Subject: ✅ BeSmile AI Subscription Confirmation
  
  Content:
    Clinic Name: ✅
    Plan: ✅ Monthly or Yearly
    Amount: ✅ Correct price
    Payment Method: ✅ Card/Apple Pay/PayPal/Google Pay
    Date: ✅ Current date
```

---

## Performance Testing

### Metrics to Check
- [ ] Payment screen loads in < 1 second
- [ ] Tapping tiles responds instantly (< 100ms)
- [ ] Button state updates immediately
- [ ] Input validation happens in real-time
- [ ] Payment processing takes < 3 seconds

### Monitor Console
```bash
# Check for:
✅ No duplicate renders
✅ No memory leaks
✅ No unhandled promises
❌ No error logs related to payment
❌ No console warnings about missing props
```

---

## Regression Testing Checklist

- [ ] Subscribe flow still works (signup → details → payment)
- [ ] Plan selection visible before payment
- [ ] Total amount displays correctly
- [ ] Features list shows
- [ ] Back button works (before payment)
- [ ] Access guard prevents direct entry
- [ ] Confirmation screen loads after success

---

## Browser Testing (Web Preview)

```bash
npx expo start --web
# Opens http://localhost:19006
```

**Expected Issues (Acceptable)**:
- Apple Pay not functional (iOS only)
- Google Pay not functional (Android only)
- Payment alerts show in browser alert format

**Should Work**:
- All tiles visible
- Selection logic works
- Card validation works
- Navigation works

---

## Test Data

### Sample Cards (Stripe Test Cards)
```
Visa:
  4532015112830366 / 12/25 / 123

Mastercard:
  5425233010103442 / 12/25 / 123

American Express:
  378282246310005 / 12/25 / 1234

Discover:
  6011111111111117 / 12/25 / 123
```

### Sample Cardholder Names
```
John Smith
Maria González
Dr. David Lee
Clinic Owner
```

---

## Troubleshooting

### Issue: Tiles not showing
```
Check:
  ✓ Platform.OS is correct
  ✓ Colors are loading
  ✓ PaymentMethodsGrid style is applied
  ✓ No CSS conflicts
```

### Issue: Button not enabling
```
Check:
  ✓ cardValid() logic
  ✓ selectedPaymentMethod is set
  ✓ Card validation (if card selected)
  ✓ State updates properly
```

### Issue: Icons not showing
```
Check:
  ✓ MaterialCommunityIcons imported
  ✓ Icon names are correct
  ✓ Icon size is set (32)
  ✓ Color props are correct
```

### Issue: Card fields not appearing
```
Check:
  ✓ Conditional render: selectedPaymentMethod === 'card'
  ✓ State updates when card selected
  ✓ Component re-renders
```

---

## Sign-Off Criteria

Before marking as complete:

- [ ] All 4 payment methods functional
- [ ] Platform-specific rendering works (iOS/Android)
- [ ] Card validation works correctly
- [ ] Button states work correctly
- [ ] Selection UI clear (blue border)
- [ ] Prompt messages update
- [ ] Payment processes successfully
- [ ] Firestore updates with payment method
- [ ] Email receipt sent with correct method
- [ ] No console errors
- [ ] Responsive on all screen sizes

---

## Demo Script

**For stakeholders/clients:**

```
1. "Let me show you our new payment checkout system..."

2. Navigate to subscription page
   "First, users select their plan and fill in details"

3. Navigate to payment screen
   "Now they choose how to pay. We support 4 methods:"

4. Show Card tiles
   - Tap Card: "Integrated card form with full validation"
   - Show validation: "We validate all fields in real-time"
   - Enter valid card: "Button enables when data is correct"

5. Show Apple Pay (iOS)
   - Tap Apple Pay: "On iOS, users see Apple Pay option"
   - "Clicking pay triggers Apple Pay's secure dialog"

6. Show PayPal
   - "PayPal works on both iOS and Android"
   - "Real implementation would redirect to PayPal's app"

7. Show Google Pay (Android)
   - "On Android, Google Pay option appears"
   - "Users authenticate with their saved payment method"

8. Complete payment
   - Process payment
   - Show confirmation
   - "User receives email receipt"

9. "Each payment method is recorded, enabling analytics"
```

---

**Last Updated**: January 9, 2026  
**Status**: Ready for QA & Testing
