# P3 Theme Testing Checklist

## Pre-Test Verification ✅

- [x] TypeScript compilation: PASSING
- [x] All imports: CORRECT
- [x] All hooks: STANDARDIZED
- [x] All tokens: VALID
- [x] No hardcoded colors: CONFIRMED

---

## Test Environment Setup

### Required
- [ ] Terminal/CLI available
- [ ] App can run (`npm run start`)
- [ ] Device/emulator ready
- [ ] Screenshot tool ready

### Commands
```bash
# Navigate to project
cd "c:\Users\jawad\AppData\Local\SquadGame\Saved\SaveGames\dental-app"

# Start app
npm run start
```

---

## Test 1: Clinic Hub Screen

### Light Mode
- [ ] Background is white (#FFFFFF)
- [ ] Text is black/dark (#000000)
- [ ] Buttons are blue (#1E6BFF)
- [ ] Cards have light background (#F5F5F5)
- [ ] All elements readable
- [ ] Screenshot: `SCREENSHOT_CLINIC_HUB_LIGHT.png`

### Dark Mode
- [ ] Background is black (#000000)
- [ ] Text is white (#FFFFFF)
- [ ] Buttons are gold (#D4AF37)
- [ ] Cards have dark background (#1A1A1A)
- [ ] All elements readable
- [ ] Screenshot: `SCREENSHOT_CLINIC_HUB_DARK.png`

### Color Change Test
- [ ] Toggle between light/dark
- [ ] Colors change instantly (NO reload needed)
- [ ] NO flickering or lag
- [ ] All interactive elements respond

---

## Test 2: Chat/Messages Thread

### Light Mode
- [ ] Background white
- [ ] Message bubbles visible
- [ ] Input field clear
- [ ] Text colors readable
- [ ] Date separators visible
- [ ] All borders/dividers visible
- [ ] Screenshot: `SCREENSHOT_CHAT_LIGHT.png`

### Dark Mode
- [ ] Background black
- [ ] Message bubbles still visible
- [ ] Input field has dark background (#222222)
- [ ] Placeholder text visible
- [ ] Text colors still readable
- [ ] Date separators visible
- [ ] Screenshot: `SCREENSHOT_CHAT_DARK.png`

### Interaction Test
- [ ] Can type in input field (both modes)
- [ ] Messages display in both modes
- [ ] Scrolling works smoothly
- [ ] Toggle between light/dark mid-use works

---

## Test 3: Imaging/Gallery Screen

### Light Mode
- [ ] Gallery grid visible
- [ ] Button styling clear
- [ ] Tabs visible and readable
- [ ] Upload button visible (#1E6BFF)
- [ ] Placeholder text readable
- [ ] Progress indicator visible
- [ ] Screenshot: `SCREENSHOT_IMAGING_LIGHT.png`

### Dark Mode
- [ ] Gallery grid visible on dark background
- [ ] Button styling clear (gold #D4AF37)
- [ ] Tabs visible and readable
- [ ] Upload button visible and gold
- [ ] Placeholder text readable
- [ ] Progress indicator visible
- [ ] Screenshot: `SCREENSHOT_IMAGING_DARK.png`

### Functionality Test
- [ ] Can toggle between light/dark
- [ ] Can interact with buttons (both modes)
- [ ] Gallery loads/displays content
- [ ] No layout shifts on theme change

---

## Global Theme Toggle Tests

### Toggle Behavior
- [ ] Toggle works from settings (or theme button)
- [ ] Theme changes system-wide (all 3 screens affected)
- [ ] NO app restart required
- [ ] Change is instant
- [ ] All screens immediately reflect new theme

### Edge Cases
- [ ] Toggle multiple times rapidly → No crashes
- [ ] Scroll while toggling → Smooth
- [ ] Modal/popup open while toggling → Behaves correctly
- [ ] Input focused while toggling → Input field visible

---

## Color Verification Matrix

### Text Elements
| Element | Light Mode | Dark Mode | Notes |
|---------|-----------|----------|-------|
| Primary text | Black (#000000) | White (#FFFFFF) | ✅ |
| Secondary text | Gray (#666666) | Light gray (#AAAAAA) | ✅ |
| Labels | Black (#000000) | White (#FFFFFF) | ✅ |
| Placeholder | Light gray (#CCCCCC) | Medium gray (#666666) | ✅ |

### Backgrounds
| Element | Light Mode | Dark Mode | Notes |
|---------|-----------|----------|-------|
| App background | White (#FFFFFF) | Black (#000000) | ✅ |
| Cards | Light gray (#F5F5F5) | Dark gray (#1A1A1A) | ✅ |
| Input fields | White (#FFFFFF) | Dark gray (#222222) | ✅ |
| Modals | White (#FFFFFF) | Dark gray (#1A1A1A) | ✅ |

### Interactive Elements
| Element | Light Mode | Dark Mode | Notes |
|---------|-----------|----------|-------|
| Primary buttons | Blue (#1E6BFF) | Gold (#D4AF37) | ✅ |
| Button text | White (#FFFFFF) | Black (#000000) | ✅ |
| Links/Accents | Blue (#1E6BFF) | Light blue (#64B5F6) | ✅ |
| Borders | Light (#EEEEEE) | Dark (#333333) | ✅ |

### Status Indicators
| Status | Light Mode | Dark Mode | Notes |
|--------|-----------|----------|-------|
| Error | Red (#FF3B30) | Red (#FF6B6B) | ✅ |
| Success | Green | Green | ✅ |
| Info | Blue (#1E6BFF) | Light blue | ✅ |
| Warning | Orange | Orange | ✅ |

---

## Readability Tests

### Light Mode
- [ ] Black text on white: High contrast ✅
- [ ] Gray text on white: Readable ✅
- [ ] All icons visible ✅
- [ ] All images clear ✅
- [ ] No glare/strain ✅

### Dark Mode
- [ ] White text on black: High contrast ✅
- [ ] Light gray text on black: Readable ✅
- [ ] All icons visible ✅
- [ ] All images clear ✅
- [ ] No blue light glare issues ✅

---

## Screenshot Capture Instructions

### How to Take Screenshots

**On Device:**
1. Open app to desired screen
2. Ensure theme is set correctly (light or dark)
3. Take screenshot (device-specific method)

**On Emulator:**
- Android Studio: Camera icon in emulator controls
- Xcode Simulator: Cmd+S or File → Save Screen Shot

### File Naming Convention
```
SCREENSHOT_[SCREEN]_[MODE].png

Examples:
- SCREENSHOT_CLINIC_HUB_LIGHT.png
- SCREENSHOT_CLINIC_HUB_DARK.png
- SCREENSHOT_CHAT_LIGHT.png
- SCREENSHOT_CHAT_DARK.png
- SCREENSHOT_IMAGING_LIGHT.png
- SCREENSHOT_IMAGING_DARK.png
```

### Storage Location
Save all 6 screenshots to project root:
```
dental-app/
├── SCREENSHOT_CLINIC_HUB_LIGHT.png
├── SCREENSHOT_CLINIC_HUB_DARK.png
├── SCREENSHOT_CHAT_LIGHT.png
├── SCREENSHOT_CHAT_DARK.png
├── SCREENSHOT_IMAGING_LIGHT.png
└── SCREENSHOT_IMAGING_DARK.png
```

---

## Final Verification

### All Tests Pass ✅
- [ ] Clinic Hub: Light ✓ Dark ✓
- [ ] Chat Thread: Light ✓ Dark ✓
- [ ] Imaging Gallery: Light ✓ Dark ✓
- [ ] Toggle works instantly ✓
- [ ] Colors match expected values ✓
- [ ] All text readable ✓
- [ ] No crashes/errors ✓

### Screenshots Captured ✅
- [ ] 6 screenshots total
- [ ] Named correctly
- [ ] Placed in project root
- [ ] All show theme differences clearly
- [ ] All show readable content
- [ ] All demonstrate working light/dark toggle

### Quality Check ✅
- [ ] TypeScript still passing
- [ ] No new errors introduced
- [ ] App performance normal
- [ ] No console errors
- [ ] Smooth transitions

---

## Troubleshooting

### Issue: Colors not changing
**Solution:**
1. Restart app: `npm run start`
2. Check ThemeContext import path
3. Verify `useTheme()` hook is called
4. Check browser/emulator console for errors

### Issue: Text not readable
**Solution:**
1. Check colors used match expected values
2. Verify theme toggle actually changed theme
3. Check ThemeColors interface has all tokens

### Issue: App crashes on toggle
**Solution:**
1. Check useMemo dependencies include `[colors]`
2. Verify no undefined color references
3. Run: `npx tsc --noEmit` to check types

### Issue: Inconsistent colors on different screens
**Solution:**
1. Verify all screens import from `@/src/context/ThemeContext`
2. Confirm all StyleSheets use `colors.*` tokens
3. Check no hardcoded hex values remain

---

## Sign-Off

When all tests pass:

```
Testing Status: ✅ COMPLETE

All 3 screens verified in light and dark modes.
Theme toggle works instantly and globally.
All colors match specifications.
Screenshots captured and stored.
No errors or crashes observed.

READY FOR COMMIT
```

---

**Test Date:** [Your Date]  
**Tester:** [Your Name]  
**Result:** ✅ PASS / ❌ FAIL
