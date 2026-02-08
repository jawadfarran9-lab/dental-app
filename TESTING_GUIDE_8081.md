# 🚀 TESTING GUIDE - BeSmile AI Subscription Flow

**Status**: Expo Server Ready on Port 8081
**Date**: January 14, 2026
**Test Target**: Both FREE and PAID subscription flows

---

## 📱 HOW TO TEST

### **Step 1: Connect to Expo Server**
1. **On your phone**: Open Expo Go app
2. **Scan QR code** from terminal showing: `exp://your-ip:8081`
3. **Wait for app to load** (takes 30-60 seconds on first run)

---

## ✅ TEST 1: FREE SUBSCRIPTION (100% COUPON)

### **Scenario**: Subscribe for FREE using LIFETIME100 coupon

**Actions**:
1. Open app → Navigate to **Home tab**
2. Tap **"Subscribe"** button
3. Select plan: **"Monthly Plan - $19.99/month"**
4. Fill signup form:
   - **Clinic Name**: "Test Free Clinic"
   - **Email**: "free@test.com"
   - **Password**: "Test@1234"
   - **Payment Method**: Leave BLANK (should not be required) ✅
5. **DO NOT enter card details**
6. Tap **"Apply Coupon"** button
7. Enter coupon: **"LIFETIME100"**
8. **Verify**:
   - Final Price: **$0.00** ✅
   - "Start Subscription" button: **ENABLED** ✅
9. Tap **"Start Subscription"**
10. **Confirmation page** should show:
    - Plan: **Monthly Plan - $19.99/month** ✅
    - Base Price: **$19.99** ✅
    - Discount: **-$19.99 (LIFETIME100)** ✅
    - Final Price: **$0.00** ✅
    - AI Pro: **✓ ENABLED** ✅
11. Tap **"Confirm Subscription"**
12. **EXPECTED**: Navigate to **Dashboard** ✅
13. **NO ERROR**: "clinic not found" should NOT appear ✅

### **Console Logs to Check**:
```
[SIGNUP] isFreeSubscription: true
[SIGNUP] Payment method skipped for free subscription
[SIGNUP] AI Pro enabled by default for free subscription: true
[CONFIRM] Loaded subscription data: { includeAIPro: true ... }
[EMAIL] Email content: AI Pro: ✓ ENABLED
```

**Result**: ✅ PASS or ❌ FAIL

---

## ✅ TEST 2: PAID SUBSCRIPTION (NO COUPON)

### **Scenario**: Subscribe with card payment (no coupon)

**Actions**:
1. Restart app and go back to Home
2. Tap **"Subscribe"** button
3. Select plan: **"Yearly Plan - $199.99/year"**
4. Fill signup form:
   - **Clinic Name**: "Test Paid Clinic"
   - **Email**: "paid@test.com"
   - **Password**: "Test@1234"
   - **Payment Method**: Select **"Card"** (REQUIRED) ✅
5. **Enter test card**:
   - Card Number: **4242 4242 4242 4242**
   - Expiry: **12/25**
   - CVC: **123**
6. **DO NOT apply coupon**
7. **Verify**:
   - Final Price: **$199.99** ✅
   - "Start Subscription" button: **ENABLED** ✅
8. Tap **"Start Subscription"**
9. **Confirmation page** should show:
    - Plan: **Yearly Plan - $199.99/year** ✅
    - Base Price: **$199.99** ✅
    - Discount: **None** ✅
    - Final Price: **$199.99** ✅
    - AI Pro: Based on selection ✅
10. Tap **"Confirm Subscription"**
11. **EXPECTED**: Navigate to **Dashboard** ✅
12. **NO ERROR**: "clinic not found" should NOT appear ✅

### **Console Logs to Check**:
```
[SIGNUP] isFreeSubscription: false
[SIGNUP] Payment method required for paid subscription: Card
[SIGNUP] Card validated: 4242 4242 4242 4242
[CONFIRM] Loaded subscription data: { finalPrice: 199.99 ... }
[EMAIL] Email content: Plan details with payment method
```

**Result**: ✅ PASS or ❌ FAIL

---

## 🐛 ERROR CHECKS - What Should NOT Happen

| Error | What it means | Action |
|-------|---|---|
| ❌ "clinic not found" | Clinic document creation failed | FAIL - Report issue |
| ❌ Button disabled with coupon | Validation logic broken | FAIL - Check [SIGNUP] logs |
| ❌ "Payment required for free" | Conditional validation failed | FAIL - Check form validation |
| ❌ Dashboard not loading | Navigation broken | FAIL - Check routing |
| ❌ App crash | Code error | FAIL - Check console for TypeScript errors |

---

## 📊 SUCCESS CRITERIA

### **FREE Path** - ALL Must Pass ✅
- [ ] Payment method field NOT required
- [ ] Coupon LIFETIME100 accepted
- [ ] Final price shows $0.00
- [ ] "Start Subscription" button ENABLED
- [ ] AI Pro shown as ✓ ENABLED
- [ ] Confirmation page displays correctly
- [ ] Email sent (logged in console with [EMAIL] prefix)
- [ ] Dashboard loads after confirmation
- [ ] NO "clinic not found" error

### **PAID Path** - ALL Must Pass ✅
- [ ] Payment method field REQUIRED
- [ ] Card validation works
- [ ] Final price shows $199.99
- [ ] "Start Subscription" button ENABLED
- [ ] Confirmation page displays correctly
- [ ] Email sent (logged in console with [EMAIL] prefix)
- [ ] Dashboard loads after confirmation
- [ ] NO "clinic not found" error

### **Both Paths** - Critical ✅
- [ ] No TypeScript errors in console
- [ ] No "clinic not found" errors
- [ ] No uncaught exceptions
- [ ] All [SUBSCRIBE], [SIGNUP], [CONFIRM], [EMAIL] logs present

---

## 🔍 HOW TO VIEW CONSOLE LOGS

1. **On Phone**: 
   - Shake device or tap 3 fingers
   - Select "Show Developer Menu"
   - Tap "Show Element Inspector"
   - Or open Expo Go app and view logs

2. **On Computer**:
   - Watch terminal where you ran `npm start`
   - Look for logs with prefixes: `[SUBSCRIBE]`, `[SIGNUP]`, `[CONFIRM]`, `[EMAIL]`

3. **React Native Debugger**:
   - Download: `react-native-debugger`
   - Connect to localhost:8081 debugger

---

## 📋 TEST COMPLETION CHECKLIST

### Before Testing
- [ ] Port 8081 is free (process killed)
- [ ] Expo server started with `npm start`
- [ ] QR code visible in terminal
- [ ] Expo Go app installed on phone
- [ ] Phone connected to same WiFi as computer

### During Testing
- [ ] FREE path: All 9 checkboxes marked ✅
- [ ] PAID path: All 9 checkboxes marked ✅
- [ ] Both paths: All 3 critical items marked ✅
- [ ] Console logs show no errors

### After Testing
- [ ] Document which tests PASSED
- [ ] Document which tests FAILED (if any)
- [ ] Collect any error messages
- [ ] Screenshot confirmation screens

---

## 🎯 FINAL SUCCESS CONFIRMATION

When all tests pass, you'll see:

✅ **FREE SUBSCRIPTION FLOW**: COMPLETE
- Coupon accepted, no card required, $0 final price, AI Pro enabled, dashboard accessible

✅ **PAID SUBSCRIPTION FLOW**: COMPLETE
- Card accepted, $199.99 final price, email sent, dashboard accessible

✅ **NO ERRORS DETECTED**
- No "clinic not found" messages
- No validation errors
- No navigation issues
- All console logs clean

✅ **READY FOR NEXT FEATURE**
- Both paths verified working
- Clinic creation working
- AI Pro handling working
- Email confirmation ready

---

## 📞 TROUBLESHOOTING

**Problem**: App won't load
- Solution: Check terminal for build errors, refresh Expo Go

**Problem**: Port 8081 still in use
- Solution: Run `netstat -ano | findstr :8081` then `taskkill /PID [PID] /F`

**Problem**: "clinic not found" error
- Solution: Check Firestore rules, verify clinic creation in subscribe.tsx

**Problem**: Button stays disabled
- Solution: Check console for [SIGNUP] logs, verify form fields filled

**Problem**: Email doesn't show AI Pro status
- Solution: Check [EMAIL] logs in console, verify confirm-subscription.tsx enhanced

---

**Current Status**: Expo server ready on port 8081
**Next Action**: Open Expo Go and test both flows!

🚀 Let's verify everything works! 🚀
