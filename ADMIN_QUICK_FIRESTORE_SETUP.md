# 🚀 ADMIN ACCOUNT - QUICK SETUP (2 Minutes)

## ⚡ FASTEST METHOD - Firebase Console

Your app uses **Firestore-only login** (no Firebase Auth), so setup is even simpler!

### Step 1: Open Firestore Console
```
https://console.firebase.google.com/project/dental-jawad/firestore
```

### Step 2: Create Clinic Document

1. **Find or create the `clinics` collection**
2. **Click "Add document"**
3. **Document ID:** `admin_test_clinic_001`
4. **Add these fields exactly:**

```
┌────────────────────┬──────────┬─────────────────────────────────────────┐
│ Field              │ Type     │ Value                                   │
├────────────────────┼──────────┼─────────────────────────────────────────┤
│ email              │ string   │ jawadfarran9@gmail.com                  │
│ password           │ string   │ jawadfarran9                            │
│ clinicName         │ string   │ Admin Test Clinic                       │
│ clinicCode         │ string   │ ADMIN001                                │
│ subscribed         │ boolean  │ true ← MUST BE BOOLEAN!                 │
│ subscriptionPlan   │ string   │ PRO_AI                                  │
│ subscriptionStatus │ string   │ active                                  │
│ ownerId            │ string   │ admin_user_001                          │
│ phone              │ string   │ +971501234567                           │
│ country            │ string   │ AE                                      │
│ city               │ string   │ Dubai                                   │
│ address            │ string   │ Test Location, Dubai                    │
└────────────────────┴──────────┴─────────────────────────────────────────┘
```

### ⚠️ CRITICAL: Field Types

When adding the `subscribed` field:
1. Field name: `subscribed`
2. Type: Select **"boolean"** from dropdown (NOT string!)
3. Value: Select **"true"** from dropdown

### Step 3: Save

Click **"Save"** button

### Step 4: Test Login

1. Open your app
2. Go to **Clinic Login**
3. Enter:
   - Email: `jawadfarran9@gmail.com`
   - Password: `jawadfarran9`
4. Tap **Login**
5. ✅ You should be logged in with full access!

---

## 🐛 Troubleshooting

### "Invalid credentials" error
- Check email is exactly: `jawadfarran9@gmail.com` (lowercase)
- Check password is exactly: `jawadfarran9`
- Verify document exists in `clinics` collection

### Redirects to subscription screen
- The `subscribed` field MUST be **boolean** `true`
- NOT string `"true"`
- Delete and re-add the field if needed, selecting **boolean** type

### "Account disabled" error
- Check if there's a `status` field
- Remove it or set to `"ACTIVE"`

---

## ✅ Verification

After creating the document, verify in Firebase Console:

```
clinics/admin_test_clinic_001
  ├─ email: "jawadfarran9@gmail.com" (string)
  ├─ password: "jawadfarran9" (string)
  ├─ subscribed: true (boolean) ← Green checkmark icon
  └─ subscriptionPlan: "PRO_AI" (string)
```

---

## 📱 Login

**Email:** `jawadfarran9@gmail.com`  
**Password:** `jawadfarran9`

**Access:** Full admin access, no subscription prompts!

---

**Time:** 2 minutes  
**Status:** Ready to use immediately after creating the document!
