# Phase B1 — BeSmile Branding (UI-only)

Completed Changes
- App Display Name: BeSmile (app.json)
- App Icon/Splash: Using existing BeSmile logo assets (icon.png, splash-icon.png); splash centered, contain, white/black backgrounds
- Placeholder Clinic Images: Branded fallback used for hero and thumbnails (no tints; aspect preserved)
- Remove DentalFlow: Replaced visible app name references; updated legacy i18n strings
- Overlays/Tints: Removed scrim/tinted overlays to keep images identical in light/dark
- Locales: Updated `landing.appName` to BeSmile across app locales; English footer string updated

Files Touched
- app.json
- app/i18n/en.json, ar.json, de.json, es.json, fr.json, he.json, it.json, ja.json, ko.json, pt-BR.json, ru.json, tr.json, zh-CN.json
- src/i18n/en.json
- app/components/DentalCover.tsx
- app/public/clinic/[publicId].tsx
- app/public/clinics.tsx
- app/clinic/media.tsx
- locales/en.json
- BRANDING_TODO.md

Verification
- TypeScript/ESLint: No errors detected by workspace checker.

Next Asset Notes
- To finalize icon/splash, drop BeSmile logo PNGs at:
  - assets/images/icon.png
  - assets/images/splash-icon.png
- For Android adaptive icons, provide foreground/background/monochrome PNGs and update app.json.

Screenshots to Capture
- Home icon grid showing BeSmile under the icon
- Splash (light) and Splash (dark)
- Clinic Login header area (shows BeSmile; no DentalFlow)
- Public clinic profile hero (shows clinic photo or branded fallback)

Suggested Commit Message
- "B1 Branding: BeSmile name, locales update, remove overlays, branded fallbacks for clinic hero & thumbnails, splash verified"
