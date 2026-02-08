BeSmile Branding Integration

Updated in this pass
- App display name: BeSmile (app.json)
- Default hero fallback: splash-icon.png used as branded placeholder
- Public clinic thumbnail fallback: splash-icon.png used for empty heroImage
- DentalCover default image: splash-icon.png

What you can drop in next (optional but recommended)
- App icon: Replace assets/images/icon.png with BeSmile icon, or add assets/branding/besmile-icon.png and update expo.icon.
- Splash logo: Replace assets/images/splash-icon.png with BeSmile logo (transparent PNG, good margins, 1024x1024 preferred). No tinting applied.
- Android adaptive icons: Provide foreground/background/monochrome variants and update android.adaptiveIcon in app.json.

Paths referenced now
- Icon: assets/images/icon.png
- Splash: assets/images/splash-icon.png

Notes
- Public profile header shows a branded image if clinic.heroImage is missing.
- Clinic list circles show a branded image if heroImage is missing.
- No backend or data changes were made.
