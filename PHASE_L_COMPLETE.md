# PHASE L — Reviews → Growth Engine (UI-only)

## Scope
- L1: Context-aware review prompts.
- L2: Quality chips to guide better reviews.
- L3: Visual weighting for reviews (no ranking logic).
- L4: Social proof micro-messages.
- L5: Owner motivation notifications (UI-only).
- RTL + i18n + dark/light respected. No backend or auth changes.

## Changes
- `src/components/ClinicReviewSheet.tsx`
  - Added context-aware prompt block that adapts to the selected rating and clinic name.
  - Added guidance chips to quickly insert high-quality details into feedback, respecting RTL/theme.
- `src/components/ReviewsList.tsx`
  - Added social proof micro-messages under the summary.
  - Render visual weighting bars for each review using existing quality calculation (UI-only, no ordering changes).
- `app/clinic/dashboard.tsx`
  - Added owner motivation notification cards to nudge fresh, specific, and responsive reviews.
- Documentation: `PHASE_L_COMPLETE.md` (this file).

## QA Notes (UI-only)
- Open Review sheet: prompt text updates when selecting stars; chips append text without duplicates; works in light/dark and RTL.
- Reviews list: social proof pills render; each review shows a weighting bar; list ordering unchanged.
- Dashboard: motivation cards render with icons/badges; no navigation logic added.
- No backend calls or auth logic touched.
