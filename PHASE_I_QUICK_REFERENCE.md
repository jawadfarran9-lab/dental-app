# PHASE I: Quick Reference

## Overview
Reviews + Trust + Pro Signals system for public clinic profiles. All UI-only with mocked data (avgRating: 4.6, reviewCount: 127).

## Files

### Created
- **[src/components/ReviewsList.tsx](src/components/ReviewsList.tsx)** (349 lines)
  - Mocked reviews modal with 5 bilingual reviews
  - Verified badge, avatar, stars, text, date
  - Dark/light theme adaptive, RTL-safe

### Modified
- **[app/public/clinic/[publicId].tsx](app/public/clinic/[publicId].tsx)**
  - Add ReviewsList import
  - Add `showReviewsList` state
  - Add Reviews Summary card (I1)
  - Add Trust badge (I4)
  - Add modal integration (I2)
  - 11 new styles

## What Users See

### I1: Reviews Summary Card
```
┌────────────────────────────┐
│ 4.6  127 ratings ⭐⭐⭐⭐ │
│       View reviews →       │
└────────────────────────────┘
```
- Tap → Opens ReviewsList modal
- Shows: Gold rating circle, count, stars

### I2: Reviews List Modal
```
┌──────────────────────────────┐
│ ← Reviews (Clinic Name)      │
├──────────────────────────────┤
│ Summary: 4.6 ⭐ 127 reviews  │
├──────────────────────────────┤
│ [Avatar] Ahmed Mohammed ✓    │
│ 2 weeks ago                  │
│ ⭐⭐⭐⭐⭐                    │
│ Excellent service & staff... │
│ ✓ Verified                   │
│                              │
│ [Avatar] Fatima Hassan ✓     │
│ 1 month ago                  │
│ ⭐⭐⭐⭐                      │
│ Great clinic with...         │
│ ✓ Verified                   │
│                              │
│ ... (5 total mocked reviews) │
└──────────────────────────────┘
```

### I3: Rate Clinic (Reused from H)
- "Rate clinic" button in actions row
- Opens ClinicReviewSheet
- Stars (tap/swipe), textarea, submit
- Thank you state on submit

### I4: Trust Badge
```
┌─────────────────────┐
│ 🛡️ Trusted Clinic  │ (Blue)
└─────────────────────┘
```
- Shows if: avgRating >= 4.2 AND isPro
- Different from H5 "Highly rated" (green)

## Interaction Flow

1. User views public clinic profile
2. Sees Reviews Summary card with rating
3. Taps "View reviews" → ReviewsList modal opens
4. Sees mocked reviews (5 total, all verified)
5. Taps back to close
6. Taps "Rate clinic" → ClinicReviewSheet opens
7. Rates (tap/swipe) + submits
8. Sees thank you message
9. "Highly rated" badge appears (green, session state)
10. Sees "Trusted Clinic" badge if conditions met (blue, computed)

## Key Data Points

| Property       | Value        | Mocked |
|----------------|--------------|--------|
| avgRating      | 4.6          | ✅     |
| reviewCount    | 127          | ✅     |
| Reviews        | 5 (AR + EN)  | ✅     |
| Trust threshold| 4.2          | ✅     |

## Colors

### Light Mode
- Filled stars: `#0a7ea4` (Blue)
- Unfilled stars: `#cbd5e1` (Gray)
- Verified: `#d1fae5` bg, `#059669` text (Green)
- Trust: `#dbeafe` bg, `#0284c7` text (Blue)

### Dark Mode
- Filled stars: `#D4AF37` (Gold)
- Unfilled stars: `#4b5563` (Gray)
- Verified: `#065f46` bg, `#10b981` text (Green)
- Trust: `#1e40af` bg, `#60a5fa` text (Blue)

## i18n

| Element         | AR                    | EN           |
|-----------------|----------------------|--------------|
| View reviews    | عرض التقييمات       | View reviews |
| Verified        | موثق                | Verified     |
| Reviews title   | التقييمات           | Reviews      |
| Rating count    | 127 تقييم            | 127 reviews  |
| Trusted Clinic  | عيادة موثوقة        | Trusted Clinic |

## No Backend

✅ No Firestore reads/writes  
✅ No HTTP calls  
✅ No auth checks  
✅ Reviews not saved  
✅ All mocked data  

## Verification

✅ No TS errors  
✅ No console errors  
✅ Dark/light themes  
✅ RTL support  
✅ i18n complete  
✅ Navigation works  

---

**PHASE I COMPLETE. Paused for review.**
