# PHASE G: Pro/Standard Tiers & Public Discovery — COMPLETE

## Overview

**Phase G** adds comprehensive Pro/Standard tier visual differentiation and public clinic discovery across the app—**entirely UI-only** with no backend, auth, payments, or Firestore rules changes. Clinics can preview "Pro" styling based on profile completeness, and patients/guests can easily discover clinics via Stories and Explorer.

---

## Completed Phases

### G1: Pro/Standard Visual Signals (UI-only)

**Goal**: Add tier badges and styling to public surfaces without backend changes.

**Implementation**:
- Added optional `tier?: 'pro' | 'standard'` field to `PublicClinic` type
- **Stories list**: Pro clinics show luxury dark ring with gold border + "PRO" badge
- **Public profile**: Tier pill near hero ("PRO" gold or "Standard" white)
- **Owner dashboard**: Pro benefits card with 4 key benefits + "Learn more & upgrade" CTA
- Demo flags: `demo-pro-1`, `demo-pro-2` show Pro for testing

**Files**:
- [src/services/publicClinics.ts](src/services/publicClinics.ts): Added `tier` field
- [app/public/stories.tsx](app/public/stories.tsx): Pro ring + badge
- [app/public/clinic/[publicId].tsx](app/public/clinic/[publicId].tsx): Tier pill
- [app/clinic/dashboard.tsx](app/clinic/dashboard.tsx): Pro benefits card

---

### G2: Upgrade/Plans UX (UI-only)

**Goal**: Owner-facing upgrade screen comparing Standard vs Pro plans.

**Implementation**:
- New screen: [app/clinic/upgrade.tsx](app/clinic/upgrade.tsx)
  - Side-by-side plan cards (Standard current, Pro coming soon)
  - Feature comparison with checkmarks/crosses
  - Selected plan indicator
  - Disabled "Upgrade (Coming Soon)" CTA → Alert
  - "Why upgrade to Pro?" benefits card
- **Entry points**:
  - Dashboard: "Learn more & upgrade" button
  - Public profile editor: Gold Pro teaser card with "Learn more" link

**Files**:
- [app/clinic/upgrade.tsx](app/clinic/upgrade.tsx): New upgrade screen
- [app/clinic/dashboard.tsx](app/clinic/dashboard.tsx): Active upgrade CTA
- [app/clinic/public-profile.tsx](app/clinic/public-profile.tsx): Pro teaser

---

### G3: Pro Preview UI Signals (Computed)

**Goal**: Show "Featured/Pro Preview" styling on public surfaces based on profile completeness.

**Implementation**:
- **Helper function**: [src/utils/promoTier.ts](src/utils/promoTier.ts)
  - `isProPreviewClinic(clinic)`: returns true if `heroImage + phone + address` present
  - `getClinicTier(clinic)`: respects explicit `tier` field, else computes from completeness
- **Stories list**: Pro preview clinics show dark ring + "PRO" badge (computed)
- **Clinics explorer**: Pro preview clinics show dark ring + "Featured" chip
- **Public profile**: Pro preview clinics show "Pro (Preview)" pill

**Computed logic** (no new Firestore fields):
```typescript
proPreview = !!(clinic.heroImage && clinic.phone && clinic.address)
```

**Files**:
- [src/utils/promoTier.ts](src/utils/promoTier.ts): Helper functions
- [app/public/stories.tsx](app/public/stories.tsx): Pro preview styling
- [app/public/clinics.tsx](app/public/clinics.tsx): Featured chip
- [app/public/clinic/[publicId].tsx](app/public/clinic/[publicId].tsx): Pro Preview pill

---

### G4: Owner Pro Readiness (UI-only)

**Goal**: Help owners understand what makes their profile "Pro Preview" and what's missing.

**Implementation**:
- **Pro Readiness Card** in [app/clinic/public-profile.tsx](app/clinic/public-profile.tsx):
  - Status: "Pro Preview: Ready" (green) or "Not ready" (amber)
  - Checklist: Hero image ✅/⭕, Phone ✅/⭕, Address ✅/⭕, WhatsApp (optional) ✅/⭕
  - Progress bar: 0–100% based on completed items
  - **Preview widget**: Shows clinic's story circle (standard vs Pro ring + badge)
  - **CTAs**:
    - "Complete profile" button (blue): alerts to missing field
    - "Upgrade" button (gold): navigates to upgrade screen

**Computed in real-time** from form state (no writes):
```typescript
isReady = !!(heroImage && phone?.trim() && address?.trim())
progress = (completed / 3) * 100
```

**Files**:
- [app/clinic/public-profile.tsx](app/clinic/public-profile.tsx): Readiness card + preview

---

### G5: Navigation Wiring & Public Entry Points

**Goal**: Make public clinics discovery obvious from the first screen.

**Implementation**:
- **Landing screen** ([app/index.tsx](app/index.tsx)):
  - New **"Discover Clinics"** section at top (before Clinic Owners)
  - Two prominent tiles:
    - **"Stories"** (primary, blue): opens `/public/stories`
    - **"Search"** (secondary, bordered): opens `/public/clinics`
  - Section visible to all users (guests, patients, clinic owners)
- **Deep-link consistency** verified:
  - Stories item tap → `/public/clinic/[publicId]`
  - Explorer item tap → `/public/clinic/[publicId]`
  - All CTAs in profile functional: `tel:`, `https://wa.me/`, Google Maps

**Files**:
- [app/index.tsx](app/index.tsx): Public discovery section

---

## Navigation Map

```
Landing Screen (app/index.tsx)
├─ Discover Clinics Section (G5) ⭐ NEW
│  ├─ Stories Button → /public/stories (G1, G3)
│  │  └─ Tap story → /public/clinic/[publicId] (G1, G3)
│  │     ├─ Call/WhatsApp/Maps CTAs
│  │     └─ Pro Preview pill (if complete)
│  │
│  └─ Search Button → /public/clinics (G3)
│     └─ Tap clinic → /public/clinic/[publicId] (G3)
│        ├─ Call/WhatsApp/Maps CTAs
│        └─ Featured chip (if Pro preview)
│
├─ For Clinic Owners
│  ├─ Login → /clinic/login
│  └─ Subscribe → /clinic/subscribe
│
├─ Kids Corner → /kids
│
└─ For Patients → /patient

Owner Dashboard (/clinic/dashboard) (G1, G2)
├─ Pro Benefits Card
│  └─ "Learn more & upgrade" → /clinic/upgrade (G2)
│
└─ Metrics, Highlights, Nudges

Owner Public Profile Editor (/clinic/public-profile) (G2, G4)
├─ Pro Teaser Card (G2)
│  └─ "Learn more" → /clinic/upgrade
│
├─ Pro Readiness Card (G4) ⭐ NEW
│  ├─ Status + Checklist + Progress
│  ├─ Preview Widget (story circle)
│  ├─ "Complete profile" button
│  └─ "Upgrade" button → /clinic/upgrade
│
└─ Form Fields (hero, phone, address, etc.)

Upgrade Screen (/clinic/upgrade) (G2)
├─ Standard Plan Card (current)
├─ Pro Plan Card (coming soon)
├─ Feature Comparison
├─ "Upgrade (Coming Soon)" CTA → Alert
└─ "Why upgrade to Pro?" benefits
```

---

## Key Features

### Public Surfaces (G1, G3, G5)

**Landing Screen** (`/`):
- **Discover Clinics section** at top (G5)
- Stories button (primary, blue)
- Search button (secondary, bordered)
- Visible to all users (no auth)

**Stories List** (`/public/stories`):
- Pro/Pro Preview clinics: Dark ring with gold border + "PRO" badge
- Standard clinics: Normal gold ring
- Optional "Near me" sorting (device location)

**Clinics Explorer** (`/public/clinics`):
- Pro Preview clinics: Dark ring with gold border + "Featured" chip
- Standard clinics: Normal gold ring
- Search by name/city
- Filter by country
- Optional "Near me" sorting

**Public Clinic Profile** (`/public/clinic/[publicId]`):
- Pro/Pro Preview: "Pro (Preview)" pill (gold on dark)
- Standard: "Standard" pill (white on translucent)
- Hero image, contact CTAs (Call/WhatsApp/Maps)
- Services chips, trust badges, highlights
- Featured pill (if hero + phone present)

### Owner Surfaces (G1, G2, G4)

**Owner Dashboard** (`/clinic/dashboard`):
- Pro benefits card with 4 key benefits
- "Learn more & upgrade" CTA
- Metrics, highlights, profile nudges

**Public Profile Editor** (`/clinic/public-profile`):
- Pro teaser card (G2)
- **Pro Readiness Card** (G4):
  - Real-time status: Ready/Not ready
  - Checklist: Hero, Phone, Address, WhatsApp (optional)
  - Progress bar (0–100%)
  - Preview widget: Shows how clinic appears in stories
  - CTAs: "Complete profile" / "Upgrade"

**Upgrade Screen** (`/clinic/upgrade`):
- Side-by-side Standard vs Pro comparison
- Feature lists with checkmarks/crosses
- Selected plan indicator
- Disabled "Upgrade (Coming Soon)" CTA
- Benefits card

---

## Pro Preview Logic (Computed, No Backend)

```typescript
// G3, G4: Computed locally (no Firestore writes)
isProPreviewClinic(clinic) {
  return !!(clinic.heroImage && clinic.phone && clinic.address);
}

getClinicTier(clinic) {
  // Respects explicit tier field (G1) or computes (G3)
  if (clinic.tier === 'pro') return 'pro';
  return isProPreviewClinic(clinic) ? 'pro' : 'standard';
}
```

**No new Firestore fields required.** All Pro Preview styling is computed client-side from existing data.

---

## Constraints Met ✅

**All G-phases**:
- ✅ UI-only changes (no backend logic)
- ✅ No Firestore rules changes
- ✅ No new collections or mandatory fields
- ✅ No auth or entitlement changes
- ✅ No payments or subscriptions (upgrade CTAs disabled/alert-only)
- ✅ RTL + i18n compatible (EN/AR ready)
- ✅ Dark/light theme support
- ✅ No new API calls beyond existing public clinic reads

---

## Files Modified/Created

**Created**:
- [src/utils/promoTier.ts](src/utils/promoTier.ts): Pro preview helper functions
- [app/clinic/upgrade.tsx](app/clinic/upgrade.tsx): Upgrade screen
- PHASE_G1_COMPLETE.md: G1 documentation
- PHASE_G2_COMPLETE.md: G2 documentation
- PHASE_G5_COMPLETE.md: This summary

**Modified**:
- [src/services/publicClinics.ts](src/services/publicClinics.ts): Added `tier` field
- [app/public/stories.tsx](app/public/stories.tsx): Pro ring + badge (G1, G3)
- [app/public/clinics.tsx](app/public/clinics.tsx): Featured chip (G3)
- [app/public/clinic/[publicId].tsx](app/public/clinic/[publicId].tsx): Tier pill (G1, G3)
- [app/clinic/dashboard.tsx](app/clinic/dashboard.tsx): Pro benefits card (G1, G2)
- [app/clinic/public-profile.tsx](app/clinic/public-profile.tsx): Pro teaser + readiness card (G2, G4)
- [app/index.tsx](app/index.tsx): Public discovery section (G5) ⭐

---

## Summary

**Phase G** successfully implements comprehensive Pro/Standard tier differentiation and public clinic discovery—entirely UI-only with no backend, payments, or auth changes. Owners can preview Pro styling by completing their profile (hero + phone + address), see readiness metrics, and explore upgrade benefits. Patients/guests can easily discover clinics via Stories and Explorer from the landing screen, with clear visual differentiation for Pro preview clinics.

**All constraints met. Ready for production as UI-only tier preview foundation.**

**Phase G COMPLETE. Awaiting approval before next phase.**
