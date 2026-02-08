# ✅ QA TESTING PLAN - AI Pro Feature

**Date:** January 2, 2026  
**Feature:** AI Pro Subscription & Feature Gating  
**Version:** Phase 2 - QA Verification

---

## 📋 TEST CASES

### 1. AI Pro Toggle & Flag Verification

#### Test 1.1: AI Pro Toggle in Firestore
**Objective:** Verify that `includeAIPro` flag is correctly stored and retrieved  
**Steps:**
1. In Firebase Console, navigate to `clinics/{clinicId}`
2. Verify the `includeAIPro` field exists
3. Toggle value between `true` and `false`
4. Refresh app and verify the change is reflected in UI

**Expected Result:**
- ✅ Field exists and changes immediately reflect in app
- ✅ `useAIProStatus` hook reads correct value
- ✅ No errors in console

---

#### Test 1.2: AI Pro Status Hook (useAIProStatus)
**Objective:** Verify hook returns correct Pro status  
**Steps:**
1. For clinic user: Check `hasAIPro` returns `true` when flag is `true`
2. For clinic user: Check `hasAIPro` returns `false` when flag is `false`
3. For patient user: Check `hasAIPro` always returns `true` (demo access)
4. Check `aiProPrice` returns `9.99`
5. Check `isLoading` transitions correctly

**Expected Result:**
- ✅ Clinic users get correct Pro status from Firestore
- ✅ Patients get demo access (`true`)
- ✅ Price always returns `9.99`
- ✅ Loading states transition properly

---

### 2. Dynamic Pricing Logic

#### Test 2.1: Price Calculation Without AI Pro
**Objective:** Verify pricing when AI Pro is disabled  
**Steps:**
1. Set clinic `includeAIPro: false`
2. Set `subscriptionPlan: "PRO"` (price: $19.99)
3. Check `finalPrice` in subscription screen
4. Verify payment amount in checkout

**Expected Result:**
- ✅ `finalPrice` = $19.99 (base price only)
- ✅ No additional $9.99 AI Pro charge
- ✅ Checkout shows correct amount

---

#### Test 2.2: Price Calculation With AI Pro
**Objective:** Verify pricing when AI Pro is enabled  
**Steps:**
1. Set clinic `includeAIPro: true`
2. Set `subscriptionPlan: "PRO"` 
3. Check `subscriptionPriceWithAIPro` field (should be $29.99)
4. Check `finalPrice` in subscription screen
5. Verify payment amount in checkout

**Expected Result:**
- ✅ `finalPrice` = $29.99 ($19.99 + $9.99)
- ✅ Or directly from `subscriptionPriceWithAIPro` if set
- ✅ Checkout shows correct total
- ✅ No double-charging

---

#### Test 2.3: Subscription Plan Variations
**Objective:** Test pricing across different subscription tiers  
**Steps:**
1. Test with `subscriptionPlan: "PRO_AI"` + `includeAIPro: true`
   - Expected: $29.99 or custom price
2. Test with `subscriptionPlan: "PRO_AI"` + `includeAIPro: false`
   - Expected: Base price only
3. Test with `subscriptionPlan: "ENTERPRISE"` + `includeAIPro: true`
   - Expected: Custom enterprise price + $9.99

**Expected Result:**
- ✅ All combinations calculate correctly
- ✅ Consistent pricing across different plan types

---

### 3. AI Chat Feature Gating

#### Test 3.1: Chat Access for Pro Users
**Objective:** Verify Pro users get full AI chat access  
**Steps:**
1. Set clinic `includeAIPro: true`
2. Navigate to AI Chat screen
3. Type a question: "What is gingivitis?"
4. Verify response is detailed (longer response, ~1000 tokens)
5. Verify no upgrade prompt is shown
6. Send multiple messages and verify all work

**Expected Result:**
- ✅ Chat loads without prompts
- ✅ Responses are detailed and comprehensive
- ✅ No upgrade/blocking messages
- ✅ Full conversational flow works

---

#### Test 3.2: Chat Access for Free Users
**Objective:** Verify free users see upgrade prompt  
**Steps:**
1. Set clinic `includeAIPro: false`
2. Navigate to AI Chat screen
3. Type a question: "What causes tooth pain?"
4. Verify response is concise (~500 tokens)
5. Verify upgrade prompt appears after response
6. Attempt to send another message - verify works or shows prompt

**Expected Result:**
- ✅ Chat loads but shows limitation notice
- ✅ Responses are shorter and basic
- ✅ Upgrade prompt displays with upgrade button
- ✅ Clicking upgrade navigates to subscription screen

---

#### Test 3.3: Chat Forced Gating
**Objective:** Verify chat is blocked unless user is Pro or Patient (demo)  
**Steps:**
1. Create clinic with NO subscription at all
2. Navigate to AI Chat
3. Attempt to type message

**Expected Result:**
- ✅ Message shows: "Upgrade to AI Pro to continue using AI chat"
- ✅ Input is disabled or shows clear limitation
- ✅ Upgrade button is prominent

---

#### Test 3.4: Patient Demo Access
**Objective:** Verify patients get demo access to AI chat  
**Steps:**
1. Log in as patient user
2. Navigate to AI Chat
3. Send a message
4. Verify response appears (demo access)
5. Check if `hasAIPro` is `true` for patient role

**Expected Result:**
- ✅ Patients can use AI chat without subscription
- ✅ Chat shows "Demo" or "Trial" badge
- ✅ No upgrade prompt for patients

---

### 4. Firestore Storage Verification

#### Test 4.1: AI Pro Flag Storage
**Objective:** Verify flag is correctly stored in Firestore  
**Steps:**
1. In Firebase Console, check `clinics/{clinicId}` document
2. Verify structure:
   ```
   clinics/{clinicId}
   ├─ includeAIPro: boolean
   ├─ subscriptionPrice: number
   ├─ subscriptionPriceWithAIPro: number
   └─ subscriptionPlan: string
   ```

**Expected Result:**
- ✅ All fields exist
- ✅ `includeAIPro` is boolean (not string)
- ✅ Prices are numbers (not strings)
- ✅ No null/undefined critical fields

---

#### Test 4.2: AsyncStorage Caching
**Objective:** Verify offline caching works  
**Steps:**
1. Load app and verify Pro status is fetched
2. Check AsyncStorage in DevTools:
   - `clinicIncludeAIPro` should be "true" or "false"
   - `clinicSubscriptionTier` should be set
   - `clinicFinalPrice` should be number
3. Go offline (airplane mode)
4. Restart app
5. Verify cached values are used

**Expected Result:**
- ✅ Values are cached in AsyncStorage
- ✅ Offline access works with cached data
- ✅ Cache survives app restart

---

### 5. Checkout & Subscription Flow

#### Test 5.1: Subscription Without AI Pro
**Objective:** Test subscription purchase without AI Pro  
**Steps:**
1. Go to Settings → Subscription
2. Select "PRO" plan ($19.99)
3. Do NOT add AI Pro
4. Complete payment
5. Verify clinic is updated with:
   - `subscriptionPlan: "PRO"`
   - `includeAIPro: false`
   - `subscriptionPrice: 19.99`

**Expected Result:**
- ✅ Payment processes for base price only
- ✅ Firestore is updated correctly
- ✅ No AI Pro flag is set

---

#### Test 5.2: Subscription With AI Pro Add-on
**Objective:** Test subscription purchase with AI Pro  
**Steps:**
1. Go to Settings → Subscription
2. Select "PRO" plan
3. Check "Add AI Pro" toggle
4. Verify price shows: $29.99
5. Complete payment
6. Verify clinic is updated with:
   - `subscriptionPlan: "PRO"`
   - `includeAIPro: true`
   - `subscriptionPriceWithAIPro: 29.99`

**Expected Result:**
- ✅ Payment processes for $19.99 + $9.99
- ✅ Firestore is updated with AI Pro flag
- ✅ AI chat immediately becomes available

---

#### Test 5.3: Upgrading Existing Subscription to AI Pro
**Objective:** Test upgrading an existing subscription with AI Pro  
**Steps:**
1. Start with clinic: `subscriptionPlan: "PRO"`, `includeAIPro: false`
2. Go to Settings → Subscription
3. Click "Upgrade to AI Pro"
4. Verify price shows: $9.99 (upgrade charge only)
5. Complete payment
6. Verify clinic updated:
   - `includeAIPro: true`
   - `subscriptionPriceWithAIPro: 29.99`

**Expected Result:**
- ✅ Only charged $9.99 (not full price)
- ✅ AI Pro flag is set to true
- ✅ AI chat becomes available immediately

---

### 6. Language & Localization Testing

#### Test 6.1: English (EN) Translations
**Objective:** Verify all AI Pro text is translated in English  
**Steps:**
1. Set language to English
2. Check AI chat screen:
   - Welcome message in English
   - Upgrade prompt in English
   - AI Pro banner in English
3. Check home screen AI Pro banner
4. Check subscription screen

**Expected Result:**
- ✅ All text is in English
- ✅ No missing translations
- ✅ Spelling and grammar correct

---

#### Test 6.2: Arabic (AR) Translations
**Objective:** Verify all AI Pro text is translated in Arabic  
**Steps:**
1. Set language to Arabic
2. Check AI chat screen:
   - Welcome message in Arabic (RTL)
   - Upgrade prompt in Arabic (RTL)
   - AI Pro banner in Arabic (RTL)
3. Check home screen AI Pro banner
4. Check subscription screen
5. Verify text flows right-to-left correctly

**Expected Result:**
- ✅ All text is in Arabic
- ✅ RTL layout is correct
- ✅ No missing translations
- ✅ Text alignment is proper

---

#### Test 6.3: Language Switching Mid-Session
**Objective:** Verify language switching works without app restart  
**Steps:**
1. Start in English, send message
2. Switch to Arabic
3. Verify UI updates to Arabic
4. Continue chatting
5. Switch back to English
6. Verify UI updates to English

**Expected Result:**
- ✅ Language switches immediately
- ✅ Chat history persists
- ✅ New messages in correct language
- ✅ No crashes or errors

---

### 7. Dark Mode & Light Mode

#### Test 7.1: AI Chat Dark Mode
**Objective:** Verify AI Pro components work in dark mode  
**Steps:**
1. Enable dark mode in settings
2. Go to AI Chat screen
3. Check AI Pro banner/badge colors
4. Check upgrade prompt colors
5. Check text contrast and readability
6. Send a message and verify colors

**Expected Result:**
- ✅ All text is readable
- ✅ Colors are dark mode appropriate
- ✅ No contrast issues
- ✅ Buttons are clearly visible

---

#### Test 7.2: AI Chat Light Mode
**Objective:** Verify AI Pro components work in light mode  
**Steps:**
1. Enable light mode in settings
2. Go to AI Chat screen
3. Check colors and contrast
4. Verify readability in bright light
5. Send message and verify display

**Expected Result:**
- ✅ All text is readable
- ✅ Light mode colors are appropriate
- ✅ No contrast issues
- ✅ Professional appearance

---

#### Test 7.3: Home Screen Dark/Light Mode
**Objective:** Verify AI Pro banner displays correctly in both modes  
**Steps:**
1. Toggle between dark and light mode
2. Check AI Pro banner on home screen
3. Verify colors and readability
4. Check any badges or indicators

**Expected Result:**
- ✅ Banner visible in both modes
- ✅ Colors are appropriate
- ✅ Text is readable
- ✅ Smooth transition between modes

---

### 8. Error Handling & Edge Cases

#### Test 8.1: Missing Firestore Data
**Objective:** Verify app handles missing AI Pro data  
**Steps:**
1. Delete `includeAIPro` field from clinic document
2. Restart app
3. Check that it defaults to `false`
4. Chat should show upgrade prompt

**Expected Result:**
- ✅ App doesn't crash
- ✅ Defaults to free tier
- ✅ Cache is used if available
- ✅ User can still see upgrade option

---

#### Test 8.2: Network Error While Checking Pro Status
**Objective:** Verify offline fallback works  
**Steps:**
1. Enable airplane mode
2. Restart app
3. Go to AI Chat
4. Verify cached status is used
5. Disable airplane mode
6. Refresh and verify latest status

**Expected Result:**
- ✅ Cached data is used offline
- ✅ App remains functional
- ✅ No crash or error screen
- ✅ Syncs when online

---

#### Test 8.3: Large Chat History
**Objective:** Verify performance with many messages  
**Steps:**
1. Send 50+ messages in chat
2. Verify app doesn't lag
3. Scroll through history
4. Verify memory usage is reasonable
5. Close and reopen chat

**Expected Result:**
- ✅ Chat remains smooth
- ✅ No memory leaks
- ✅ Scrolling is fluid
- ✅ History loads quickly

---

## 📊 Test Results Template

```
Test Case: [Test Name]
Date: [Date]
Tester: [Name]
Device: [Device Model & OS]
Language: [EN/AR]
Dark Mode: [Yes/No]
Network: [WiFi/LTE/Offline]

Result: ✅ PASS / ❌ FAIL
Issues: [List any issues found]
Notes: [Additional observations]
```

---

## ✅ Sign-Off Checklist

- [ ] All test cases passed (or documented as known issues)
- [ ] No crashes or errors
- [ ] Pricing is accurate
- [ ] Chat gating works correctly
- [ ] Translations are complete
- [ ] Dark/Light mode works
- [ ] Offline caching works
- [ ] Firestore data is correct
- [ ] Performance is acceptable
- [ ] UI is polished and professional

---

**Status:** Ready for Testing  
**Estimated Time:** 4-6 hours  
**Date:** January 2, 2026
