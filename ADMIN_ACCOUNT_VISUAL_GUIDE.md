# 🎯 Admin Account Setup - Visual Guide

## 🚀 5-Minute Setup (No Coding Required!)

This visual guide shows you **exactly** what to click and type to create your admin test account.

---

## 📸 Step-by-Step Screenshots Guide

### STEP 1: Create Firebase Auth User (2 minutes)

**1.1 Open Firebase Console**
```
URL: https://console.firebase.google.com/project/dental-jawad/authentication/users
```

**1.2 Click "Add User" button**
- Look for blue "Add user" button in top-right corner
- Click it

**1.3 Fill in the form**
```
┌─────────────────────────────────────┐
│  Add user                      [X]  │
├─────────────────────────────────────┤
│                                     │
│  Email                              │
│  ┌────────────────────────────────┐│
│  │ jawadfarran9@gmail.com         ││
│  └────────────────────────────────┘│
│                                     │
│  Password                           │
│  ┌────────────────────────────────┐│
│  │ jawadfarran9                   ││
│  └────────────────────────────────┘│
│                                     │
│         [Cancel]  [Add user]        │
└─────────────────────────────────────┘
```

**1.4 Click "Add user" button**

**1.5 COPY THE USER UID** ⚠️ IMPORTANT!
- After creating the user, you'll see a list of users
- Find the row with `jawadfarran9@gmail.com`
- Look for the **User UID** column (looks like: `abc123xyz789...`)
- Click the UID to select it
- Press `Ctrl+C` to copy
- Paste it in Notepad temporarily - you'll need it next!

```
Example UID: kF7mN2pQ8rS1tU3vW4xY5zA
             ↑ Copy this whole thing!
```

---

### STEP 2: Create Firestore Documents (3 minutes)

**2.1 Open Firestore Console**
```
URL: https://console.firebase.google.com/project/dental-jawad/firestore
```

**2.2 You'll see existing collections. We need to create 4 documents.**

---

#### 📄 DOCUMENT 1 of 4: Clinic Document

**Click on collection:** `clinics`

**Click:** "Add document" button

**Fill in the form:**

```
Document ID: clinic_[PASTE_YOUR_UID]_admin
             ↑ Replace [PASTE_YOUR_UID] with the UID you copied

Example: clinic_kF7mN2pQ8rS1tU3vW4xY5zA_admin
```

**Add these fields (click "Add field" for each):**

```
┌────────────────────┬──────────┬─────────────────────────────┐
│ Field              │ Type     │ Value                       │
├────────────────────┼──────────┼─────────────────────────────┤
│ clinicId           │ string   │ clinic_[UID]_admin          │
│ ownerId            │ string   │ [UID]                       │
│ clinicName         │ string   │ Admin Test Clinic           │
│ clinicCode         │ string   │ ADMIN001                    │
│ subscribed         │ boolean  │ true  ← Select from dropdown│
│ subscriptionPlan   │ string   │ PRO_AI                      │
│ subscriptionStatus │ string   │ active                      │
│ aiProEnabled       │ boolean  │ true  ← Select from dropdown│
│ tier               │ string   │ pro                         │
│ phone              │ string   │ +971501234567               │
│ email              │ string   │ jawadfarran9@gmail.com      │
│ address            │ string   │ Admin Test Location         │
│ country            │ string   │ AE                          │
│ city               │ string   │ Dubai                       │
│ heroImageUrl       │ string   │ https://images.unsplash...  │
│ logoUrl            │ string   │ https://images.unsplash...  │
└────────────────────┴──────────┴─────────────────────────────┘
```

**⚠️ CRITICAL: Boolean Fields**
When adding `subscribed`, `aiProEnabled`:
1. Click "Add field"
2. Field name: `subscribed`
3. Type: Select **"boolean"** from dropdown (NOT string!)
4. Value: Select **"true"** from dropdown
5. Repeat for `aiProEnabled`

**Click "Save"**

---

#### 📄 DOCUMENT 2 of 4: Clinic Member Document

**Click on collection:** `clinic_members`

**Click:** "Add document" button

**Fill in:**

```
Document ID: member_[UID]_clinic_[UID]_admin

Example: member_kF7mN2pQ8rS1tU3vW4xY5zA_clinic_kF7mN2pQ8rS1tU3vW4xY5zA_admin
```

**Add these fields:**

```
┌────────────┬────────┬─────────────────────────────────────────┐
│ Field      │ Type   │ Value                                   │
├────────────┼────────┼─────────────────────────────────────────┤
│ memberId   │ string │ member_[UID]_clinic_[UID]_admin         │
│ clinicId   │ string │ clinic_[UID]_admin                      │
│ userId     │ string │ [UID]                                   │
│ email      │ string │ jawadfarran9@gmail.com                  │
│ displayName│ string │ Admin Test Account                      │
│ role       │ string │ OWNER_ADMIN  ← Type exactly as shown    │
│ status     │ string │ ACTIVE       ← Type exactly as shown    │
└────────────┴────────┴─────────────────────────────────────────┘
```

**Click "Save"**

---

#### 📄 DOCUMENT 3 of 4: Public Clinic Document

**Click on collection:** `clinics_public`

**Click:** "Add document" button

**Fill in:**

```
Document ID: clinic_[UID]_admin
```

**Add these fields:**

```
┌───────────────┬─────────┬─────────────────────────────────────┐
│ Field         │ Type    │ Value                               │
├───────────────┼─────────┼─────────────────────────────────────┤
│ clinicId      │ string  │ clinic_[UID]_admin                  │
│ ownerId       │ string  │ [UID]                               │
│ name          │ string  │ Admin Test Clinic                   │
│ isPublished   │ boolean │ true  ← Select from dropdown        │
│ tier          │ string  │ pro                                 │
│ phone         │ string  │ +971501234567                       │
│ whatsapp      │ string  │ +971501234567                       │
│ email         │ string  │ jawadfarran9@gmail.com              │
│ address       │ string  │ Admin Test Location, Dubai, UAE     │
│ geo           │ map     │ See below ↓                         │
│ geohash       │ string  │ thrwmzx                             │
│ heroImage     │ string  │ https://images.unsplash.com/...     │
│ averageRating │ number  │ 5.0     ← Type as number            │
│ totalReviews  │ number  │ 100     ← Type as number            │
│ specialty     │ string  │ general                             │
└───────────────┴─────────┴─────────────────────────────────────┘
```

**⚠️ SPECIAL: Map Field (geo)**

1. Click "Add field"
2. Field name: `geo`
3. Type: Select **"map"** from dropdown
4. A nested structure will appear
5. Inside the map, add TWO fields:

```
geo (map)
  ├─ lat (number): 25.2048
  └─ lng (number): 55.2708
```

To add nested fields:
- Click on the `geo` field name
- You'll see "+ Add field to geo"
- Click it
- Add `lat` as **number** with value `25.2048`
- Add `lng` as **number** with value `55.2708`

**Click "Save"**

---

#### 📄 DOCUMENT 4 of 4: User Profile Document

**Click on collection:** `users`

**Click:** "Add document" button

**Fill in:**

```
Document ID: [UID]  ← Just the UID, no prefix

Example: kF7mN2pQ8rS1tU3vW4xY5zA
```

**Add these fields:**

```
┌─────────────┬────────┬────────────────────────────────┐
│ Field       │ Type   │ Value                          │
├─────────────┼────────┼────────────────────────────────┤
│ userId      │ string │ [UID]                          │
│ email       │ string │ jawadfarran9@gmail.com         │
│ displayName │ string │ Admin Test Account             │
│ role        │ string │ clinic                         │
│ clinicId    │ string │ clinic_[UID]_admin             │
│ memberId    │ string │ member_[UID]_clinic_[UID]_admin│
└─────────────┴────────┴────────────────────────────────┘
```

**Click "Save"**

---

## ✅ VERIFICATION

After creating all 4 documents, verify:

### Check Firebase Console - Authentication
```
Go to: Authentication → Users
✅ You should see: jawadfarran9@gmail.com
```

### Check Firebase Console - Firestore
```
Go to: Firestore Database → Data

✅ clinics/clinic_[UID]_admin
   → subscribed: true (with green checkmark icon)

✅ clinic_members/member_[UID]_...
   → role: "OWNER_ADMIN"
   → status: "ACTIVE"

✅ clinics_public/clinic_[UID]_admin
   → isPublished: true (with green checkmark icon)
   → geo: map with lat and lng numbers

✅ users/[UID]
   → role: "clinic"
```

---

## 📱 TEST IN APP

### Open Your App

**1. Find the "Clinic Login" button**
- Should be on the welcome/landing screen
- Tap it

**2. Enter credentials:**
```
┌─────────────────────────────────┐
│  Clinic Login                   │
├─────────────────────────────────┤
│  Email                          │
│  ┌────────────────────────────┐│
│  │ jawadfarran9@gmail.com     ││
│  └────────────────────────────┘│
│                                 │
│  Password                       │
│  ┌────────────────────────────┐│
│  │ jawadfarran9               ││
│  └────────────────────────────┘│
│                                 │
│      [Login]                    │
└─────────────────────────────────┘
```

**3. Tap "Login"**

### ✅ Success Indicators:

**YOU SHOULD SEE:**
- ✅ Login successful
- ✅ Main clinic dashboard appears
- ✅ Bottom navigation tabs visible:
  - Home (patients list)
  - AI Assistant
  - Clinics
  - Create
  - Subscription (shows "Active")
- ✅ No paywall or "Subscribe Now" screens
- ✅ All features unlocked

**YOU SHOULD NOT SEE:**
- ❌ "Subscribe to continue" prompts
- ❌ Redirect to payment screen
- ❌ "Upgrade to Pro" messages
- ❌ Locked features

---

## 🐛 TROUBLESHOOTING

### Problem: "Invalid credentials" when logging in

**Check:**
1. Email typed correctly: `jawadfarran9@gmail.com` (no spaces)
2. Password typed correctly: `jawadfarran9` (all lowercase)
3. User exists in Firebase Console → Authentication → Users

---

### Problem: Login works but redirects to subscription/payment screen

**This means:** `subscribed` field is NOT set correctly

**Fix:**
1. Go to Firestore: `clinics/clinic_[UID]_admin`
2. Find field: `subscribed`
3. Check type: Must be **boolean** (NOT string)
4. Check value: Must be **true** (with green checkmark icon)
5. If it's a string `"true"`, DELETE the field and add again:
   - Type: **boolean**
   - Value: **true**

---

### Problem: "Clinic not found" error

**This means:** Document IDs don't match

**Fix:**
1. Check User UID in Authentication
2. Verify all document IDs use the SAME UID:
   - `clinics/clinic_[UID]_admin`
   - `clinic_members/member_[UID]_clinic_[UID]_admin`
   - `clinics_public/clinic_[UID]_admin`
   - `users/[UID]`
3. Make sure you copied the entire UID (no spaces, no truncation)

---

### Problem: Login works but some features locked

**This means:** Role or permissions not set correctly

**Fix:**
1. Go to Firestore: `clinic_members/member_[UID]_...`
2. Check field: `role`
3. Must be exactly: `OWNER_ADMIN` (all caps, underscore)
4. Check field: `status`
5. Must be exactly: `ACTIVE` (all caps)

---

## 📊 Field Type Reference

When adding fields in Firebase Console, use these types:

```
Field Type Guide:

📝 string   → Yellow quotes icon   → "text value"
🔢 number   → Blue # icon          → 123 or 5.0
✅ boolean  → Green checkmark icon → true or false
🗺️  map     → Purple brackets icon → { nested: "object" }
📅 timestamp→ Clock icon           → Auto-generated
```

**Common mistakes:**
- ❌ `subscribed: "true"` (string) → Should be boolean
- ❌ `lat: "25.2048"` (string) → Should be number
- ❌ `role: owner_admin` (lowercase) → Should be `OWNER_ADMIN`

---

## 🎉 YOU'RE DONE!

If login works and you see the main dashboard, **congratulations!** 🎊

Your admin test account is fully configured with:
- ✅ Full OWNER_ADMIN permissions
- ✅ Active PRO_AI subscription (no paywall)
- ✅ AI Pro enabled
- ✅ Published clinic in public directory
- ✅ Access to ALL screens and features

**Now you can:**
- Test all app features
- Navigate freely between screens
- Create patients and sessions
- Use AI Assistant
- Manage team members
- Access settings and reports

**Happy testing!** 🚀

---

## 📚 Need More Help?

See the full documentation:
- **Quick Reference:** `ADMIN_ACCOUNT_QUICK_REFERENCE.md`
- **Complete Guide:** `ADMIN_ACCOUNT_SETUP_GUIDE.md`

Or run the interactive script:
```powershell
.\scripts\setupAdminAccount.ps1
```

---

**Created:** January 2, 2026  
**Last Updated:** January 2, 2026
