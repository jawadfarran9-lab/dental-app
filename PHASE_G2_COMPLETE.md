# PHASE G2: Upgrade/Plans UX (UI-only) — COMPLETE

## Implementation Summary

Created owner-facing **Upgrade to Pro** screen with Standard vs Pro plan comparison. All UI-only—no payments, no entitlements, no backend changes.

### Changes Made

1. **New Screen: Upgrade/Plans** ([app/clinic/upgrade.tsx](app/clinic/upgrade.tsx))
   - Two-column plan cards: **Standard** (current) and **Pro** (coming soon)
   - Standard card: basic features, normal styling
   - Pro card: luxury gold styling, "Coming Soon" badge, enhanced benefits
   - Feature comparison with checkmarks/crosses
   - Selected plan indicator
   - Disabled upgrade CTA for Pro ("Coming Soon" alert)
   - i18n-ready strings, RTL-safe layout, dark/light theme
   - Back navigation

2. **Dashboard Entry Point** ([app/clinic/dashboard.tsx](app/clinic/dashboard.tsx))
   - Changed Pro benefits card CTA from disabled "Coming soon" to active "Learn more & upgrade"
   - Button navigates to `/clinic/upgrade`

3. **Public Profile Editor Entry Point** ([app/clinic/public-profile.tsx](app/clinic/public-profile.tsx))
   - Added **Pro teaser card** at top of editor
   - Gold border, star icon, "Want to stand out?" copy
   - "Learn more" link navigates to `/clinic/upgrade`
   - Dark/light theme compatible

### Pro Plan Benefits (UI Copy)

Displayed on upgrade screen:
- ✅ Everything in Standard
- ✅ Pro badge & luxury dark-gold ring
- ✅ Priority placement in stories & search
- ✅ Enhanced trust badges row
- ✅ Premium profile styling
- ✅ Advanced analytics & heatmaps
- ✅ Profile A/B testing
- ✅ Priority support

### Standard Plan Features (UI Copy)

- ✅ Public clinic listing
- ✅ Basic profile with contact info
- ✅ Hero image & address
- ✅ Appear in clinic stories
- ❌ Pro badge & luxury ring (Pro only)
- ❌ Featured placement (Pro only)
- ❌ Advanced analytics (Pro only)
- ❌ A/B testing (Pro only)

### User Flow

1. Owner opens **Dashboard** → sees Pro benefits card → taps "Learn more & upgrade"
2. OR Owner opens **Public Profile Editor** → sees Pro teaser at top → taps "Learn more"
3. Upgrade screen opens with side-by-side plan comparison
4. Owner can tap Pro plan card → shows as selected
5. Tap "Upgrade (Coming Soon)" → Alert: "Pro upgrade will be available soon. Stay tuned!"
6. Back button returns to previous screen

### Constraints Met ✓

- ✅ UI-only changes (no backend logic)
- ✅ No new Firestore fields or writes
- ✅ No payment integration
- ✅ No auth or entitlement changes
- ✅ RTL + i18n compatible (EN/AR ready)
- ✅ Dark/light theme support
- ✅ Disabled/locked upgrade CTA (coming soon)
- ✅ Existing flows untouched

---

## G2 Verification Checklist

### 1. Upgrade Screen (`/clinic/upgrade`)
- [ ] Opens from Dashboard Pro card "Learn more & upgrade" button
- [ ] Opens from Public Profile Editor "Learn more" link
- [ ] Shows two plan cards side-by-side: Standard (left) & Pro (right)
- [ ] Pro card has gold border, "Coming Soon" badge, PRO pill
- [ ] Standard card shows "Current plan" price, Pro shows "Coming soon"
- [ ] Feature list shows checkmarks for included, crosses for excluded
- [ ] Tap plan card → shows "Selected" indicator at bottom
- [ ] Tap "Upgrade (Coming Soon)" on Pro → Alert: "Coming Soon" message
- [ ] Standard plan CTA shows "Current Plan" (disabled)
- [ ] Back button returns to previous screen
- [ ] "Why upgrade to Pro?" benefits card at bottom with 4 benefits
- [ ] Dark/light mode: card backgrounds and text adapt
- [ ] RTL mode: layout flips correctly, Arabic text renders

### 2. Dashboard Entry Point (`/clinic/dashboard`)
- [ ] Pro benefits card at top of "Pro (Coming Soon)" section
- [ ] CTA button now says "Learn more & upgrade" (not "Coming soon")
- [ ] Button is active (not disabled/dimmed)
- [ ] Tap button → navigates to `/clinic/upgrade`
- [ ] No regression to existing dashboard metrics/nudges

### 3. Public Profile Editor Entry Point (`/clinic/public-profile`)
- [ ] Gold teaser card appears at top (below title, above hero image)
- [ ] Shows star icon, "Want to stand out?" title, subtitle
- [ ] "Learn more" link in blue
- [ ] Tap link → navigates to `/clinic/upgrade`
- [ ] Dark/light mode: teaser card colors adapt (dark bg in dark mode, cream in light)
- [ ] RTL mode: icon and text align correctly

### 4. Cross-cutting
- [ ] No console errors or warnings
- [ ] No new Firestore reads/writes
- [ ] All text is i18n-ready (uses `t()` with fallbacks)
- [ ] Apostrophes in strings properly escaped (no TS errors)
- [ ] Navigation works: back button, deep links, router.push
- [ ] Consistent gold accent color (#D4AF37) for Pro branding

---

## Next Steps (Awaiting Approval)

**G3**: TBD—user will specify scope after G2 review.

Possible directions:
- Patient-facing discovery filters (Pro tier badge filter in stories/search)
- Owner analytics preview (UI placeholders for Pro insights)
- Notification/waitlist for Pro launch (email collection, UI-only)

**Pause here.** Ready for G2 review and approval before proceeding to G3.
