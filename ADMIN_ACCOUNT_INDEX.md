# 📚 Admin Test Account - Documentation Index

**Created:** January 2, 2026  
**Purpose:** Complete setup resources for creating an admin test account with full access

---

## 🎯 Quick Navigation

**New to this?** → Start with [Visual Guide](#-visual-guide-recommended)

**Just need fields?** → Go to [Quick Reference](#-quick-reference)

**Want automation?** → See [Scripts](#-scripts)

**Need details?** → Read [Complete Guide](#-complete-guide)

---

## 📖 Available Documents

### 🌟 Visual Guide (RECOMMENDED)
**File:** `ADMIN_ACCOUNT_VISUAL_GUIDE.md`  
**Best for:** First-time setup  
**Time:** 5 minutes  

**What's inside:**
- 📸 Screenshot descriptions of Firebase Console
- ✅ Step-by-step clicking instructions
- 🔍 Visual examples of field types
- 🐛 Common mistakes and how to avoid them
- ✨ Verification checklist

**Start here if you:**
- Haven't created Firebase users before
- Want the safest, clearest instructions
- Prefer visual learning

**Quick link:** [Open ADMIN_ACCOUNT_VISUAL_GUIDE.md](./ADMIN_ACCOUNT_VISUAL_GUIDE.md)

---

### 📄 Quick Reference
**File:** `ADMIN_ACCOUNT_QUICK_REFERENCE.md`  
**Best for:** Quick copy-paste setup  
**Time:** 5 minutes  

**What's inside:**
- 📋 Tables with all field names and values
- 🔗 Direct Firebase Console links
- ⚡ Condensed instructions
- ⚠️ Critical field type warnings
- ✅ Verification checklist

**Start here if you:**
- Already know Firebase Console
- Just need the field values
- Want fastest setup

**Quick link:** [Open ADMIN_ACCOUNT_QUICK_REFERENCE.md](./ADMIN_ACCOUNT_QUICK_REFERENCE.md)

---

### 📖 Complete Guide
**File:** `ADMIN_ACCOUNT_SETUP_GUIDE.md`  
**Best for:** Understanding the full process  
**Time:** 15-20 minutes to read  

**What's inside:**
- 🏗️ Architecture explanation
- 🔐 Security notes and best practices
- 🛠️ Three setup methods compared
- 🧪 Testing scenarios
- 📚 Troubleshooting guide
- 🔍 Deep dive into each component

**Read this if you:**
- Want to understand WHY each step is needed
- Need to create multiple admin accounts
- Want to customize the setup process
- Are setting up for production

**Quick link:** [Open ADMIN_ACCOUNT_SETUP_GUIDE.md](./ADMIN_ACCOUNT_SETUP_GUIDE.md)

---

## 🤖 Scripts

### 📜 PowerShell Interactive Script
**File:** `scripts/setupAdminAccount.ps1`  
**Best for:** Guided setup with templates  
**Time:** 7 minutes  

**What it does:**
- Prompts you to create Firebase Auth user
- Generates all document templates with correct IDs
- Opens Notepad windows with JSON data
- Provides copy-paste ready content
- Guides you through Firebase Console steps

**How to use:**
```powershell
.\scripts\setupAdminAccount.ps1
```

**Prerequisites:**
- None! Just run it

**Output:**
- 4 JSON files with your specific User UID
- Step-by-step instructions printed to console
- Auto-opens Notepad for easy copying

---

### ⚙️ Node.js Automation Script
**File:** `scripts/createAdminTestAccount.js`  
**Best for:** Full automation  
**Time:** 2 minutes (after setup)  

**What it does:**
- Creates Firebase Auth user automatically
- Creates all 4 Firestore documents
- Sets all fields with correct types
- Verifies setup success
- Prints account details

**How to use:**
```bash
# 1. Install Firebase Admin SDK
npm install firebase-admin --save-dev

# 2. Download service account key from Firebase Console:
#    Project Settings → Service Accounts → Generate New Private Key
#    Save as: scripts/firebase-admin-key.json

# 3. Run the script
node scripts/createAdminTestAccount.js
```

**Prerequisites:**
- Node.js installed
- Firebase Admin SDK installed
- Service account key downloaded

**Output:**
```
✅ ADMIN TEST ACCOUNT CREATED SUCCESSFULLY!

📋 Account Details:
   Email:      jawadfarran9@gmail.com
   Password:   jawadfarran9
   User ID:    abc123xyz...
   Clinic ID:  clinic_abc123_admin

🔐 Access Level:
   Role:       OWNER_ADMIN (Full Access)
   Subscription: ACTIVE ✅
   AI Pro:     ENABLED ✅
```

---

## 📋 Account Credentials

**Email:** `jawadfarran9@gmail.com`  
**Password:** `jawadfarran9`

**Access Level:**
- ✅ OWNER_ADMIN role (full permissions)
- ✅ Active PRO_AI subscription (bypasses paywall)
- ✅ AI Pro enabled
- ✅ PRO tier (all features)
- ✅ Published clinic in public directory

---

## 🗺️ Setup Process Overview

All methods follow the same basic flow:

```
┌─────────────────────────────────────────┐
│  STEP 1: Create Firebase Auth User     │
│  • Email: jawadfarran9@gmail.com        │
│  • Password: jawadfarran9               │
│  • Copy User UID                        │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  STEP 2: Create Firestore Documents    │
│  • clinics/clinic_[UID]_admin           │
│  • clinic_members/member_[UID]_...      │
│  • clinics_public/clinic_[UID]_admin    │
│  • users/[UID]                          │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  STEP 3: Test Login                    │
│  • Open app                             │
│  • Tap "Clinic Login"                   │
│  • Enter credentials                    │
│  • Verify full access                   │
└─────────────────────────────────────────┘
```

---

## 🎯 Which Method Should I Use?

### Choose based on your situation:

**I've never used Firebase Console before:**
→ Use **Visual Guide** (ADMIN_ACCOUNT_VISUAL_GUIDE.md)

**I know Firebase but want quick setup:**
→ Use **Quick Reference** (ADMIN_ACCOUNT_QUICK_REFERENCE.md)

**I want templates generated for me:**
→ Run **PowerShell Script** (scripts/setupAdminAccount.ps1)

**I need complete automation:**
→ Run **Node.js Script** (scripts/createAdminTestAccount.js)

**I want to understand the architecture:**
→ Read **Complete Guide** (ADMIN_ACCOUNT_SETUP_GUIDE.md)

---

## ✅ Verification Checklist

After setup, verify all these are complete:

### Firebase Console - Authentication
- [ ] User exists: `jawadfarran9@gmail.com`
- [ ] User UID copied

### Firebase Console - Firestore
- [ ] `clinics/clinic_[UID]_admin` created
  - [ ] Field `subscribed` is **boolean** `true`
  - [ ] Field `aiProEnabled` is **boolean** `true`
- [ ] `clinic_members/member_[UID]_...` created
  - [ ] Field `role` is `OWNER_ADMIN`
  - [ ] Field `status` is `ACTIVE`
- [ ] `clinics_public/clinic_[UID]_admin` created
  - [ ] Field `isPublished` is **boolean** `true`
- [ ] `users/[UID]` created

### App Testing
- [ ] Login successful with credentials
- [ ] Main dashboard appears (NOT subscription screen)
- [ ] Bottom tabs visible
- [ ] No paywall prompts
- [ ] AI Assistant accessible
- [ ] Settings accessible
- [ ] Can create patients/sessions

---

## 🐛 Troubleshooting

**Problem:** Can't login  
**Solution:** Check Visual Guide → Troubleshooting section

**Problem:** Redirects to subscription screen  
**Solution:** `subscribed` field must be **boolean** `true`, not string

**Problem:** Some features locked  
**Solution:** Check `role` is `OWNER_ADMIN` and `status` is `ACTIVE`

**Full troubleshooting:** See ADMIN_ACCOUNT_VISUAL_GUIDE.md → Troubleshooting

---

## 📚 Related Documentation

After setting up the admin account, you may want to review:

- **Clinics Tab Architecture:** [CLINICS_TAB_DOCUMENTATION.md](./CLINICS_TAB_DOCUMENTATION.md)
- **Authentication Flow:** [CLINIC_AUTH_FLOW_SUMMARY.md](./CLINIC_AUTH_FLOW_SUMMARY.md)
- **Subscription Pricing:** [SUBSCRIPTION_PRICING_UPDATE_COMPLETE.md](./SUBSCRIPTION_PRICING_UPDATE_COMPLETE.md)
- **Complete Setup Guide:** [COMPLETE_SETUP_GUIDE.md](./COMPLETE_SETUP_GUIDE.md)

---

## 🚀 Quick Start (Right Now!)

**Ready to create your admin account?**

### Option 1: Visual Setup (Easiest)
1. Open: [ADMIN_ACCOUNT_VISUAL_GUIDE.md](./ADMIN_ACCOUNT_VISUAL_GUIDE.md)
2. Follow the screenshots and instructions
3. Takes 5 minutes
4. Done!

### Option 2: Quick Copy-Paste
1. Open: [ADMIN_ACCOUNT_QUICK_REFERENCE.md](./ADMIN_ACCOUNT_QUICK_REFERENCE.md)
2. Create Firebase Auth user
3. Copy-paste fields from tables
4. Done!

### Option 3: PowerShell Interactive
```powershell
.\scripts\setupAdminAccount.ps1
```
Follow the prompts!

### Option 4: Full Automation
```bash
# Setup (one time)
npm install firebase-admin --save-dev
# Download service account key to scripts/firebase-admin-key.json

# Run
node scripts/createAdminTestAccount.js
```

---

## 📞 Need Help?

**Start with:**
1. [ADMIN_ACCOUNT_VISUAL_GUIDE.md](./ADMIN_ACCOUNT_VISUAL_GUIDE.md) → Troubleshooting section
2. [ADMIN_ACCOUNT_SETUP_GUIDE.md](./ADMIN_ACCOUNT_SETUP_GUIDE.md) → Full guide

**Common issues:**
- Boolean vs string field types
- Document ID formatting
- Role/status capitalization

**All issues covered in the Visual Guide!**

---

## 🎉 Success Criteria

**You'll know it worked when:**
- ✅ Login successful
- ✅ Main clinic dashboard appears
- ✅ Bottom tabs visible
- ✅ No "Subscribe" or "Upgrade" prompts
- ✅ All features accessible
- ✅ AI Assistant works
- ✅ Can navigate all screens

**That's it! You're ready to test!** 🚀

---

**Last Updated:** January 2, 2026  
**Next:** Open ADMIN_ACCOUNT_VISUAL_GUIDE.md and get started! →
