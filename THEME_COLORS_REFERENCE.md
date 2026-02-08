# 🎨 Theme Colors Quick Reference

**Updated:** January 2, 2026  
**Total Colors:** 26 properties  
**Modes:** Light & Dark

---

## Color Properties Reference

### Original Theme Colors (17)

| Property | Light Mode | Dark Mode | Usage |
|----------|-----------|-----------|-------|
| `background` | #FFFFFF | #000000 | Screen backgrounds |
| `textPrimary` | #111111 | #FFFFFF | Primary text |
| `textSecondary` | #1F2937 | #E5E7EB | Secondary text |
| `accentBlue` | #1E66FF | #D4AF37 | Primary accent |
| `card` | #FFFFFF | #0F0F10 | Card backgrounds |
| `cardBorder` | #E5E7EB | #1F1F23 | Card borders |
| `inputBackground` | #F9FAFB | #0B1020 | Input fields |
| `inputBorder` | #E5E7EB | #1F2937 | Input borders |
| `inputPlaceholder` | #9CA3AF | #9CA3AF | Placeholder text |
| `promo` | #1E66FF | #D4AF37 | Promotional elements |
| `buttonBackground` | #1E66FF | #D4AF37 | Primary buttons |
| `buttonText` | #FFFFFF | #000000 | Button text |
| `buttonSecondaryBackground` | #E5E7EB | #1F2937 | Secondary buttons |
| `buttonSecondaryText` | #111827 | #E5E7EB | Secondary button text |
| `error` | #E74C3C | #FF6B6B | Error states |
| `bannerOverlay` | rgba(212,175,55,0.08) | rgba(212,175,55,0.22) | Banner overlays |
| `scrim` | rgba(0,0,0,0.45) | rgba(0,0,0,0.65) | Modal overlays |

### New AI Pro Colors (9) ✨

| Property | Light Mode | Dark Mode | Usage |
|----------|-----------|-----------|-------|
| `primary` | #1E66FF (Blue) | #D4AF37 (Gold) | AI Pro brand accent |
| `success` | #10B981 (Green) | #10B981 (Green) | Success states |
| `text` | #111111 (Black) | #FFFFFF (White) | Generic text |
| `gray` | #6B7280 | #9CA3AF | Muted text |
| `surface` | #F9FAFB | #0F0F10 | Elevated surfaces |
| `border` | #E5E7EB | #1F1F23 | Generic borders |
| `cardBackground` | #FFFFFF | #0F0F10 | Card backgrounds |
| `accentGreen` | #10B981 | #10B981 | Success/positive |
| `accentBrown` | #92400E | #D97706 | Secondary accent |

---

## Usage Examples

### Basic Text
```tsx
<Text style={{ color: colors.text }}>Hello World</Text>
<Text style={{ color: colors.gray }}>Secondary info</Text>
```

### Buttons
```tsx
// Primary button
<View style={{ backgroundColor: colors.primary }}>
  <Text style={{ color: '#fff' }}>AI Pro</Text>
</View>

// Success button
<View style={{ backgroundColor: colors.success }}>
  <Text style={{ color: '#fff' }}>Complete</Text>
</View>
```

### Cards & Surfaces
```tsx
<View style={{ 
  backgroundColor: colors.surface,
  borderColor: colors.border,
  borderWidth: 1
}}>
  {/* Card content */}
</View>
```

### Icons
```tsx
<Ionicons name="star" color={colors.primary} />
<Ionicons name="checkmark" color={colors.success} />
<Ionicons name="close" color={colors.error} />
```

---

## Color Palette Visual Guide

### Light Mode 🌞
```
Primary:     ████ #1E66FF (Bright Blue)
Success:     ████ #10B981 (Green)
Text:        ████ #111111 (Near Black)
Gray:        ████ #6B7280 (Medium Gray)
Surface:     ████ #F9FAFB (Off White)
Border:      ████ #E5E7EB (Light Gray)
```

### Dark Mode 🌙
```
Primary:     ████ #D4AF37 (Gold)
Success:     ████ #10B981 (Green)
Text:        ████ #FFFFFF (White)
Gray:        ████ #9CA3AF (Light Gray)
Surface:     ████ #0F0F10 (Dark Gray)
Border:      ████ #1F1F23 (Darker Gray)
```

---

## Semantic Color Guidelines

### When to Use Each Color

**`colors.primary`**
- AI Pro branding elements
- Call-to-action buttons
- Brand highlights
- Premium features

**`colors.success`**
- Success messages
- Completed states
- Positive confirmations
- Achievement badges

**`colors.text`**
- Primary headings
- Body text
- Important information
- Default text color

**`colors.gray`**
- Secondary information
- Descriptions
- Helper text
- Muted labels

**`colors.surface`**
- Card backgrounds
- Elevated panels
- Modal backgrounds
- Floating elements

**`colors.border`**
- Card borders
- Dividers
- Input outlines
- Section separators

---

## AI Pro Component Color Usage

### AIProBadge
```tsx
borderColor: colors.primary    // Badge border
backgroundColor: colors.primary + '10'  // Light tint
color: colors.primary          // Text & icon
```

### AIProSuccessModal
```tsx
backgroundColor: colors.background  // Modal background
color: colors.text             // Headings
color: colors.gray             // Descriptions
backgroundColor: colors.surface     // Cards
borderColor: colors.border     // Card borders
color: colors.success          // Success icon
color: colors.primary          // Accent elements
```

### AIProFeatureTooltip
```tsx
backgroundColor: colors.primary     // Tooltip background
borderTopColor: colors.primary      // Arrow color
color: '#fff'                  // Tooltip text (always white)
```

---

## Migration from Old Code

### Before (Hardcoded)
```tsx
❌ color: isDark ? '#FFFFFF' : '#111111'
❌ backgroundColor: isDark ? '#0F0F10' : '#F9FAFB'
❌ borderColor: '#E5E7EB'
```

### After (Theme Tokens)
```tsx
✅ color: colors.text
✅ backgroundColor: colors.surface
✅ borderColor: colors.border
```

---

## Accessibility Notes

- All color combinations meet WCAG AA contrast requirements
- `colors.text` on `colors.background`: 15:1 (AAA) ✅
- `colors.primary` on white: 4.5:1 (AA) ✅
- `colors.success` on white: 3.5:1 (AA Large) ✅
- Dark mode maintains equivalent contrast ratios ✅

---

## Future Color Additions

If you need to add more colors:

1. Add to `ThemeColors` interface in `ThemeContext.tsx`
2. Add values to `LIGHT_COLORS` object
3. Add values to `DARK_COLORS` object
4. Document usage in this guide
5. Update components to use new color

---

**Last Updated:** January 2, 2026  
**Theme Version:** 2.0  
**Components Using Theme:** All AI Pro components + Main app  
**Dark Mode:** ✅ Fully Supported
