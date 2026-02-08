# P3 — Global Theme Consistency Progress

## Objective
Implement global theme consistency across the app using a centralized ThemeContext with light (white/black/blue) and dark (black/white/gold) palettes, ensuring no hardcoded hex colors in UI components and proper use of theme tokens for overlays and shared buttons.

## Design Rules
- **Light Mode**: White background, black text, blue primary buttons (#1E6BFF)
- **Dark Mode**: Black background, white text, gold primary buttons (#D4AF37)
- **Banners**: Gold-tinted overlays (bannerOverlay token)
- **Modals/Sheets**: Use scrim token for overlays, card tokens for content
- **Shared Buttons**: All buttons use buttonBackground and buttonText tokens

## Completed Work ✅

### 1. Theme Infrastructure
- [x] Updated `src/context/ThemeContext.tsx` with complete color palette
  - Light: background (#FFFFFF), text (#000000), button (#1E6BFF)
  - Dark: background (#000000), text (#FFFFFF), button (#D4AF37)
  - Added bannerOverlay, scrim, and comprehensive tokens

### 2. Core Hooks
- [x] Updated `hooks/use-theme-color.ts` to consume ThemeContext instead of Colors constant
- [x] All components now use `useThemeContext()` instead of react-navigation theme

### 3. Navigation & Layout
- [x] `app/(tabs)/_layout.tsx` - Tab colors, border, background all themed
- [x] `components/ui/collapsible.tsx` - Icon color uses textSecondary token

### 4. Media & Imaging
- [x] `app/clinic/[patientId]/imaging.tsx` - Fully themed, hex colors removed
- [x] `app/clinic/[patientId]/image/[imageId].tsx` - Themed backgrounds, icons, buttons, strokes
- [x] `app/components/ImageUploadButton.tsx` - Uses ThemeContext colors and scrim token

### 5. Patient & Clinic Views
- [x] `app/patient/[patientId].tsx` - Hero overlay uses bannerOverlay, buttons/cards/chat use tokens
- [x] `app/clinic/payment.tsx` - Price block and card shadow themed
- [x] `app/clinic/audit.tsx` - Card borders use cardBorder token

### 6. Major Components
- [x] `app/components/Timeline.tsx` - FULLY CONVERTED
  - Styles object uses theme tokens (backgroundSecondary, text, buttonBackground, etc)
  - Icon colors (timeline, expand, download) use theme tokens
  - Session badges use buttonBackground token
  - ActivityIndicator color themed

- [x] `app/clinic/media.tsx` - FULLY CONVERTED
  - Header and tabs use theme tokens
  - Buttons use buttonBackground/buttonText
  - Input fields use inputBackground/inputBorder
  - Modal overlay uses scrim token
  - Session picker uses theme colors
  - All icon colors (add-circle, folder, image, check-circle) themed

## Remaining Work 🔄

### Components with Hardcoded isDark Ternaries (High Priority)
- `app/components/ReportGenerator.tsx` - Multiple styles with isDark ternaries, #D4AF37 colors
- `app/components/DateRangePicker.tsx` - Calendar styling with isDark ternaries
- `app/components/ReportGenerator.tsx` - Date picker colors
- `app/clinic/settings.tsx` - Form styling with isDark ternaries
- `app/clinic/index.tsx` - Stats colors (some should be semantic, not theme)
- `app/clinic/team.tsx` - Role-based colors (these are semantic, not theme)

### Public/Browse Screens (Medium Priority)
- `app/public/clinic/[publicId].tsx` - Featured badges, action buttons (#1B3C73, #25D366, #2563eb)
- `app/public/stories.tsx` - Pro badges and styling
- `app/public/clinics.tsx` - Filter chips and featured clinic styling

### Notes on Remaining Colors
1. **Semantic Colors**: Role colors (#0B6EF3 for owner, #059669 for doctor, etc), status colors (#10b981 green, #ef4444 red) - these are intentional and should NOT be theme-dependent
2. **Brand Colors**: Public screens use #1B3C73 (brand blue) and #D4AF37 (brand gold) - can stay as branded colors
3. **Special States**: Success (#10b981), error (#ef4444), warning (#f97316) - semantic colors

## Key Tokens Reference

### Light Mode Tokens
```typescript
background: '#FFFFFF'
text: '#000000'
textSecondary: '#1F2937'
buttonBackground: '#1E6BFF' (blue)
buttonText: '#FFFFFF'
card: '#FFFFFF'
cardBorder: '#E5E7EB'
inputBackground: '#F9FAFB'
inputBorder: '#E5E7EB'
bannerOverlay: 'light gold tint'
scrim: 'rgba(0,0,0,0.5)'
```

### Dark Mode Tokens
```typescript
background: '#000000'
text: '#FFFFFF'
textSecondary: '#E5E7EB'
buttonBackground: '#D4AF37' (gold)
buttonText: '#000000'
card: '#0F0F10'
cardBorder: '#1F1F23'
inputBackground: '#0B1020'
inputBorder: '#1F2937'
bannerOverlay: 'gold-tinted (#D4AF37 with opacity)'
scrim: 'rgba(0,0,0,0.7)'
```

## Files Successfully Migrated

1. ✅ Timeline.tsx - 100% themed
2. ✅ clinic/media.tsx - 100% themed
3. ✅ clinic/[patientId]/imaging.tsx - 100% themed
4. ✅ clinic/[patientId]/image/[imageId].tsx - 100% themed
5. ✅ clinic/payment.tsx - Themed (price block and shadow)
6. ✅ clinic/audit.tsx - Border themed
7. ✅ patient/[patientId].tsx - Hero and content themed
8. ✅ ImageUploadButton.tsx - Fully themed
9. ✅ (tabs)/_layout.tsx - Tab navigation themed

## Recommended Next Steps

1. **Convert ReportGenerator and DateRangePicker** - These heavily use isDark ternaries and should be converted to theme tokens
2. **Review Public Screens** - Decide if #1B3C73 and #D4AF37 should come from theme or stay as brand colors
3. **Semantic Color Policy** - Establish rule: role/status/semantic colors stay as hex, theme colors only for background/text/buttons/containers
4. **Final Audit** - Run hex grep after remaining conversions to verify all theme-dependent colors use tokens
5. **Visual Testing** - Test light/dark mode switching to verify consistent palette and proper use of overlays/buttons

## Command to Find Remaining Work
```bash
grep -r "isDark ? '#" app/**/*.tsx | grep -v node_modules
grep -r "backgroundColor.*#D4AF37" app/**/*.tsx
grep -r "color.*#1B3C73" app/**/*.tsx
```

## Status Summary
- **Components Fully Themed**: 9
- **Tokens Defined**: 20+ (including bannerOverlay and scrim)
- **Progress**: ~40% of UI components converted to ThemeContext
- **Next Phase**: Convert remaining components using isDark ternaries
