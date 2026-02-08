# PHASE M - Pro Conversion Engine (UI-only)

## Scope
- M1: Contextual Pro value moments.
- M2: Visual comparison (Standard vs Pro).
- M3: Pro progress indicator (motivational).
- M4: Owner insights -> Pro hooks.
- M5: Soft upgrade entry points + placeholder route.
- Constraints: UI-only, RTL/i18n, dark/light respected.

## Changes
- app/clinic/dashboard.tsx
  - Added "Where Pro helps most" value-moment cards (context-aware cues).
  - Added insights -> Pro hook row inside the review insights card with a soft CTA.
  - Added Pro progress indicator vs 70+ target with soft link to the preview.
  - Added Standard vs Pro comparison card (UI-only) and kept Pro benefits grid/CTA.
  - Added soft upgrade entry points that route to the placeholder preview only.
- app/clinic/upgrade.tsx
  - UI-only upgrade placeholder remains; RTL-aware back navigation; no billing calls.
- Documentation: PHASE_M_COMPLETE.md (this file).

## QA Notes (UI-only)
- Theme: all new cards/buttons respect dark/light colors.
- RTL/i18n: headers, pills, and icons align for Arabic/Hebrew; fallback strings provided.
- Pro progress: bar fills to current score; marker at 70; CTA opens placeholder route only.
- Comparison: table shows Standard vs Pro text; no functional gating.
- Upgrade route: back button works; shows placeholder copy; no payments or backend calls.
 - Scope guard: UI-only; no backend/auth/payment wiring.
