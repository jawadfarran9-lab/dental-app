# PHASE H: Quick Reference

## Files Changed

### New
- **[src/components/ClinicReviewSheet.tsx](src/components/ClinicReviewSheet.tsx)** (272 lines)
  - Reusable bottom-sheet modal component
  - Tap + swipe star rating interaction
  - Feedback textarea
  - Thank you confirmation state
  - Theme-aware colors, RTL/i18n support

### Modified
- **[app/public/clinic/[publicId].tsx](app/public/clinic/[publicId].tsx)**
  - Import `ClinicReviewSheet` component
  - Add state: `showReviewSheet`, `hasSubmittedReview`
  - Add "Rate clinic" button to actions row
  - Add "Highly rated" badge (conditional)
  - Add `<ClinicReviewSheet />` modal at bottom
  - New styles: `ratingBadgeRow`, `ratingBadgeText`

## Component API

```typescript
// Usage in [publicId].tsx
<ClinicReviewSheet
  visible={showReviewSheet}
  clinicName={clinic?.name || ''}
  clinicHeroImage={clinic?.heroImage}
  onClose={() => setShowReviewSheet(false)}
  onSubmit={(rating, feedback) => {
    setHasSubmittedReview(true); // Show badge
  }}
/>
```

## What Users Can Do

1. **Tap "Rate clinic"** button on public clinic profile
2. **Rate**: Tap or swipe across 5 stars (Light=Blue, Dark=Gold)
3. **Feedback**: Type optional feedback in textarea
4. **Submit**: Hit "Submit" (disabled until rating >= 1)
5. **Confirm**: See "Thank you" message + stars, auto-close after 2s
6. **Badge**: "Highly rated" badge shows below action buttons (session-only)

## Interaction Flows

### Rating Interaction
- **Tap star**: Sets rating immediately, animates fill
- **Swipe left/right**: Continuous drag updates rating
- **RTL swipe**: Direction auto-reversed for AR/HE
- **Color**: Filled=Blue/Gold, Unfilled=Gray

### Submit Flow
1. Modal opens with clinic hero
2. User selects rating (1–5 stars required)
3. User optionally types feedback
4. Tap "Submit" → Thank you state
5. Show submitted stars + success message
6. Auto-close after 2s
7. Badge displays on public profile (local state)

### Later / Close
- **"Later"**: Closes modal, resets form, no badge shown
- **"Close"**: Only available in thank you state, closes modal

## Dark/Light Colors

| Element           | Light Mode      | Dark Mode       |
|-------------------|-----------------|-----------------|
| Filled stars      | `#0a7ea4` (Blue)| `#D4AF37` (Gold)|
| Unfilled stars    | `#cbd5e1` (Gray)| `#4b5563` (Gray)|
| Badge background  | `#d1fae5` (LtGrn) | `#065f46` (DkGrn) |
| Badge text        | `#059669` (Grn) | `#10b981` (BrtGrn) |
| Modal background  | `#fff`          | `#1f2937`       |
| Text              | `#0b0f18`       | `#f9fafb`       |

## i18n (Inline Strings, No Keys)

- Modal title: "Did you like this clinic?" / "هل أعجبتك العيادة؟"
- Placeholder: "Write your feedback…" / "اكتب رأيك هنا…"
- Buttons: Submit/Later/Close (AR translations included)
- Badge: "Highly rated" / "عيادة مميزة"
- Thank you: "Thank you!" / "شكراً لك!"

## No Backend

- ✅ No Firestore writes
- ✅ No HTTP calls
- ✅ No auth checks
- ✅ Feedback not saved
- ✅ Badge only in session (resets on reload)

## Verification

✅ No TypeScript errors  
✅ No console errors  
✅ Dark/light themes work  
✅ RTL layout correct  
✅ Modal animations smooth  
✅ Swipe interaction responds  
✅ Star colors correct  
✅ Badge shows/hides properly  

---

**PHASE H COMPLETE. Paused for review before PHASE I.**
