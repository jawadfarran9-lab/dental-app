# Phase F: Testing & Verification Checklist

## Pre-Test Preparation

### Files Modified/Created:
✅ `src/context/AuthContext.tsx` - NEW (comprehensive auth state)
✅ `src/utils/navigationGuards.ts` - NEW (route protection hooks)
✅ `app/_layout.tsx` - Updated (AuthProvider added)
✅ `app/index.tsx` - Updated (startup check + auto-redirect)
✅ `app/clinic/login.tsx` - Updated (useClinicGuard + setClinicAuth)
✅ `app/clinic/subscribe.tsx` - Updated (useClinicGuard added)
✅ `app/clinic/signup.tsx` - Updated (useClinicGuard added)
✅ `app/clinic/payment.tsx` - Updated (useClinicGuard + access validation)
✅ `app/patient/index.tsx` - Updated (usePatientGuard + setPatientAuth)

### Code Quality:
✅ No compile errors
✅ No TypeScript type issues
✅ All imports correct
✅ All hooks properly used

---

## Test Scenario 1: New Clinic Registration

### Setup:
- Fresh app install (no prior session)
- Clinic account doesn't exist yet

### Flow:
1. App launches → Home screen displays (auth check completes)
2. Tap "Create Clinic Subscription" tile
   - Expected: `/clinic/subscribe` page loads
   - ✓ No redirect (not subscribed, no pending subscription)

3. On subscribe page → Tap "Next" / "Start" button
   - Expected: `/clinic/signup` page loads (clinic details form)

4. Fill form with:
   - First Name: "John"
   - Last Name: "Doe"
   - Clinic Name: "Main Dental"
   - Email: "john@example.com"
   - Password: "test123"
   - (Other fields optional)

5. Submit form
   - Expected: Alert "Success" → Redirect to `/clinic/payment`
   - ✓ Must validate: `clinicIdPendingSubscription` is set

6. On payment page
   - Expected: Payment form displays (not blocked)
   - Try refreshing page → Should NOT redirect (ID still in AsyncStorage)

7. Tap "Confirm Subscription" button
   - Expected: Loading indicator
   - Firestore updates: `subscribed=true`
   - Auto-redirect to `/clinic/login`

8. On clinic login page
   - Expected: Login form displays
   - Tap "Signup" → Should NOT loop back (subscription complete)

9. Login with credentials from step 4:
   - Email: "john@example.com"
   - Password: "test123"
   - Expected: Loading indicator
   - Auth state updated via `setClinicAuth()`
   - Auto-redirect to clinic dashboard `/clinic/{clinicId}`

10. On clinic dashboard
    - Expected: Patients list loads
    - Can see clinic name displayed
    - Can navigate to create patient, messages, etc.

### Verification Points:
- ✅ Startup check doesn't interfere (loading state prevents flicker)
- ✅ Payment page can only be accessed after signup
- ✅ Subscription flow is linear (no shortcuts)
- ✅ Auto-redirect works after login
- ✅ Dashboard is accessible
- ✅ Console shows: [PHASE F] Clinic login, [STARTUP CHECK] Clinic with subscription → Dashboard

---

## Test Scenario 2: Existing Clinic Login

### Setup:
- Clinic from Scenario 1 still exists in Firestore
- Fresh app session (no AsyncStorage data)

### Flow:
1. App launches → Home screen displays

2. Tap "Clinic Login" tile
   - Expected: `/clinic/login` page loads

3. Login with:
   - Email: "john@example.com"
   - Password: "test123"
   - Expected: Loading indicator
   - Auth state updated via `setClinicAuth()`
   - Auto-redirect to clinic dashboard

4. On clinic dashboard
   - Expected: Loads immediately (no manual navigation needed)
   - Shows patients list

### Verification Points:
- ✅ Instant auto-redirect after login (startup check triggers)
- ✅ No extra clicks needed to reach dashboard
- ✅ No reload/loading screens
- ✅ Console shows: [PHASE F] Clinic login, [STARTUP CHECK] Clinic with subscription → Dashboard

---

## Test Scenario 3: Patient Login

### Setup:
- Patient code exists in Firestore (must create one manually in database or via clinic app)
- Assume patient code: "12345"

### Flow:
1. App launches → Home screen displays

2. Tap "I'm a Patient" tile
   - Expected: `/patient` (patient login page) loads

3. On patient login page
   - Expected: Code input field visible
   - Enter patient code: "12345"
   - Tap Login
   - Expected: Loading indicator
   - Auth state updated via `setPatientAuth()`
   - Auto-redirect to patient view

4. On patient view
   - Expected: Treatment timeline/chat loads
   - Can see sessions and messages
   - Can send messages

### Verification Points:
- ✅ Instant auto-redirect after login
- ✅ Patient view displays correctly
- ✅ No flicker during redirect
- ✅ Console shows: [PHASE F] Patient logged in, [STARTUP CHECK] Patient → Patient View

---

## Security Test Cases

### Test 4: Patient Blocks from Clinic Routes

**Setup:** Complete Scenario 3 (patient logged in)

**Actions:**
1. Try manually navigating to `/clinic/login`
   - Expected: Immediate redirect to `/patient` with console log [PHASE F] Patient attempting...

2. Try manually navigating to `/clinic/subscribe`
   - Expected: Immediate redirect to `/patient`

3. Try manually navigating to `/clinic/payment`
   - Expected: Immediate redirect to `/patient`

**Verification:** ✅ All clinic routes blocked for patients

---

### Test 5: Clinic Blocks from Patient Route

**Setup:** Complete Scenario 2 (clinic logged in)

**Actions:**
1. Try manually navigating to `/patient`
   - Expected: Immediate redirect to `/clinic/login` with console log [PHASE F] Clinic user attempting...

**Verification:** ✅ Patient route blocked for clinics

---

### Test 6: Direct Payment Access Blocked

**Setup:** Fresh app, no session

**Actions:**
1. Try manually navigating to `/clinic/payment`
   - Expected: Shows error alert: "Invalid access. Please start from subscription page."
   - Auto-redirects to `/clinic/subscribe`
   - Console shows: [PHASE F] Payment access denied

**Verification:** ✅ Direct payment access prevented

---

### Test 7: Subscription Flow Lock (No Back)

**Setup:** In progress subscription (on payment page with valid clinicIdPendingSubscription)

**Actions:**
1. On payment page
2. Try Android back button or iOS back gesture
   - Expected: Goes to home, NOT to signup
   - (Reason: used router.replace, not router.push)

**Verification:** ✅ Back button lock works

---

### Test 8: Cross-Patient Access Blocked

**Setup:** Patient 1 logged in (patientId="111")

**Actions:**
1. Try manually navigating to `/patient/999` (different patient)
   - Expected: Shows alert "Access Denied. You can only view your own data."
   - Redirects to `/patient` (login page)
   - Clears patientId from AsyncStorage

**Verification:** ✅ Cross-patient access prevented

---

## App Restart Tests

### Test 9: Resume with Clinic Session

**Setup:** Complete Scenario 2, then:
1. Don't logout
2. Force-close app
3. Reopen app

**Expected:**
- App loads home screen
- Startup check runs immediately
- Within 300ms: Auto-redirect to clinic dashboard
- No manual navigation needed

**Verification:** ✅ Session resumed automatically

---

### Test 10: Resume with Patient Session

**Setup:** Complete Scenario 3, then:
1. Don't logout
2. Force-close app
3. Reopen app

**Expected:**
- App loads home screen
- Startup check runs immediately
- Within 300ms: Auto-redirect to patient view
- No manual navigation needed

**Verification:** ✅ Session resumed automatically

---

### Test 11: Resume with No Session

**Setup:**
1. Logout from any screen (if logout option exists)
2. Clear AsyncStorage (clinic ID and patient ID)
3. Reopen app

**Expected:**
- App loads home screen
- Startup check runs
- No redirect (no user role detected)
- Home screen stays visible (allows new login)

**Verification:** ✅ No redirect when not logged in

---

## Console Log Verification

### Expected Logs for Test Scenario 1:
```
[PHASE F] Clinic login: abc123def456, subscribed=true
[STARTUP CHECK] Clinic with subscription → Dashboard
```

### Expected Logs for Test Scenario 2:
```
[PHASE F] Clinic login: abc123def456, subscribed=true
[STARTUP CHECK] Clinic with subscription → Dashboard
```

### Expected Logs for Test Scenario 3:
```
[PHASE F] Patient logged in: xyz789abc123
[STARTUP CHECK] Patient → Patient View
```

### Expected Logs for Security Tests:
```
[PHASE F] Patient attempting to access clinic page - redirecting
[PHASE F] Clinic user attempting to access patient page - redirecting
[PHASE F] Payment access denied - no pending subscription
```

---

## Video Recording Checklist

**Record a video showing:**

1. **Segment 1: New Clinic (15-20 sec)**
   - Open app → Home screen
   - Tap "Create Clinic Subscription"
   - Fill signup form
   - Confirm payment
   - Auto-redirect to login
   - Login → auto-redirect to dashboard
   - Show clinic name displayed

2. **Segment 2: Patient Login (10 sec)**
   - Go home
   - Tap "I'm a Patient"
   - Enter patient code
   - Auto-redirect to patient view
   - Show treatment timeline

3. **Segment 3: Security (10 sec)**
   - Open patient login
   - Try typing URL to `/clinic/login`
   - Show redirect back to patient login
   - (Or show alert if access blocked)

**Total Video Length:** 35-50 seconds

---

## Final Sign-Off

### All Tests Pass? 
- [ ] Scenario 1: New Clinic Registration ✓
- [ ] Scenario 2: Existing Clinic Login ✓
- [ ] Scenario 3: Patient Login ✓
- [ ] Test 4: Patient Blocks from Clinic Routes ✓
- [ ] Test 5: Clinic Blocks from Patient Route ✓
- [ ] Test 6: Direct Payment Access Blocked ✓
- [ ] Test 7: Subscription Flow Lock (No Back) ✓
- [ ] Test 8: Cross-Patient Access Blocked ✓
- [ ] Test 9: Resume with Clinic Session ✓
- [ ] Test 10: Resume with Patient Session ✓
- [ ] Test 11: Resume with No Session ✓
- [ ] Console Logs Correct ✓
- [ ] Video Recorded ✓

### Phase F Status:
**[ ] READY FOR DEPLOYMENT**
- No bugs found
- All security checks pass
- No flicker or loading issues
- Auto-redirects working perfectly
- No UI/color changes
- No new features (security only)

---

## Notes for Test Execution

1. **Use Expo DevTools:**
   - Check browser console for logs
   - Verify network tab shows no redirect loops

2. **Test on Both Platforms:**
   - iOS simulator
   - Android emulator (if possible)

3. **Test Connection States:**
   - Online (normal testing)
   - Offline → retry on reconnect

4. **Load Testing:**
   - Open browser developer tools
   - Watch network requests
   - Ensure no waterfall of redirects

5. **Error Handling:**
   - Verify error alerts are clear
   - Verify redirects happen after alert dismissed
   - Check no console errors/warnings

6. **Accessibility:**
   - Tab order correct in forms
   - Alerts dismissible
   - No infinite loading states
