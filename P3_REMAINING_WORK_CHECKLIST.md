# P3 Theme Consistency - Remaining Work Checklist

## High Priority (Direct UI Theme Impact)

### [ ] ReportGenerator.tsx
Location: `app/components/ReportGenerator.tsx`
- [ ] Convert isDark ternaries to theme tokens in styles (lines 121-229)
- [ ] Replace #D4AF37 colors with colors.buttonBackground
- [ ] Replace backgroundColor isDark ternaries with theme tokens
- [ ] Update icon colors (calendar-today at line 307)
- [ ] Update toggle track/thumb colors

**Impact**: Used in multiple clinic reports and timeline exports

### [ ] DateRangePicker.tsx
Location: `app/components/DateRangePicker.tsx`
- [ ] Convert isDark ternaries in styles (lines 125-264)
- [ ] Replace #D4AF37 with theme colors
- [ ] Update calendar background/border colors
- [ ] Update selected date background colors

**Impact**: Used in patient history and report filtering

### [ ] ColorPicker.tsx
Location: `app/components/ColorPicker.tsx`
- [ ] Convert isDark ternaries in styles (lines 69-107)
- [ ] Update border colors to use theme tokens
- [ ] Update background colors for picker options

**Impact**: Clinic settings color customization

## Medium Priority (Important But Secondary)

### [ ] clinic/settings.tsx
Location: `app/clinic/settings.tsx`
- [ ] Convert form styling (isDark ternaries throughout)
- [ ] Update button colors (#D4AF37 references)
- [ ] Update input styling to use theme tokens
- [ ] Icon colors (lock icon at line 590)

**Impact**: Clinic admin interface for theme customization

### [ ] clinic/index.tsx (Partial - keep role/status colors)
Location: `app/clinic/index.tsx`
- [ ] Convert main container background (isDark ternaries)
- [ ] Update card backgrounds and borders
- [ ] KEEP: Status colors (#10b981 complete, #9ca3af pending, etc) - these are semantic
- [ ] KEEP: Role badge colors - semantic/branded
- [ ] KEEP: Phone color (#0ea5e9) - informational semantic color

**Impact**: Clinic dashboard main view

### [ ] clinic/team.tsx (Keep role colors semantic)
Location: `app/clinic/team.tsx`
- [ ] Convert form styling to theme tokens
- [ ] Update border colors to cardBorder token
- [ ] KEEP: Role background colors (#0B6EF3, #059669, etc) - semantic/role-based
- [ ] KEEP: Action button status colors (#10B981, #EF4444, #DC2626) - semantic

**Impact**: Team management interface

### [ ] clinic/[patientId].tsx
Location: `app/clinic/[patientId].tsx`
- [ ] Update container background colors
- [ ] Convert hardcoded hex (#f5f5f5, #f0f7ff, #2196F3) to theme tokens
- [ ] Update button colors to use theme
- [ ] Session item styling

**Impact**: Patient detail screen in clinic view

## Lower Priority (Public/Browse UI)

### [ ] public/clinic/[publicId].tsx
- Featured badges and styling
- Action button colors (#1B3C73 = brand, #25D366 = WhatsApp, #2563eb = Maps)
- Rating display styling
- Trust/verified badges
- **Decision needed**: Keep brand colors or use theme?

### [ ] public/stories.tsx
- Pro badge styling
- Circle wrap styling
- **Decision needed**: Keep #D4AF37 brand gold or use theme?

### [ ] public/clinics.tsx
- Filter chip styling
- Featured clinic badge
- **Decision needed**: Theme or brand colors?

## Optional/Low Impact

- [ ] ChatBubble.tsx - Message styling (currently hardcoded)
- [ ] kids/index.tsx - Kids section styling
- [ ] patient/index.tsx - Patient home page
- [ ] subscribe.tsx, checkout.tsx - Subscription flow
- [ ] usage.tsx - Trial/usage dashboard

## Notes on Color Categories

### Theme Colors (MUST use tokens)
- Container backgrounds
- Text colors
- Card backgrounds/borders
- Input field styling
- Overlay/modal backgrounds
- Primary buttons

### Semantic Colors (Keep as hex)
- Success green (#10b981)
- Error red (#ef4444)
- Warning orange (#f97316)
- Status indicators
- Role-based colors

### Brand/Marketing Colors (Decision needed)
- #1B3C73 (brand blue)
- #D4AF37 (brand gold - also theme button in dark)
- #25D366 (WhatsApp integration)
- #2563eb (Google Maps)

## Testing Checklist

After conversions:
- [ ] Toggle light/dark mode - verify all colors update correctly
- [ ] Check buttons are consistently colored across themes
- [ ] Verify modal overlays show scrim properly
- [ ] Check banner overlays display gold-tinted background
- [ ] Verify input fields have proper contrast in both modes
- [ ] Check card shadows and borders are visible in both themes
- [ ] Test semantic colors (status, role, etc) are visible in both modes

## Command to Verify Progress

Check remaining isDark ternary colors in UI components:
```bash
grep -r "isDark ? '#[0-9a-fA-F]\{6\}'" app/**/*.tsx --include="*.tsx"
```

Check remaining hardcoded button golds:
```bash
grep -r "'#D4AF37'" app/**/*.tsx
grep -r '"#D4AF37"' app/**/*.tsx
```

## Estimated Effort
- High Priority: ~3-4 hours (ReportGenerator, DateRangePicker, ColorPicker)
- Medium Priority: ~2-3 hours (settings, index, team, [patientId])
- Low Priority: ~1-2 hours (public screens and other components)
- Testing: ~1 hour
- **Total remaining**: ~7-10 hours

## Current Progress
- Components migrated: 9/~25+ UI components
- Tokens defined: 20+ (complete)
- Design spec adherence: 40%
- Estimated completion: 50% through the work
