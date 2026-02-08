# Clock Sticker Feature

## Overview

The Clock Sticker is a premium feature in the Story Editor with **8 fully dynamic clock designs**. The time is rendered **inside the clock design itself** - not as an overlay.

## Fully Dynamic Rendering

Each clock type uses a completely different rendering approach:

| Style | Type | Description |
|-------|------|-------------|
| 1 | **Analog - Luxury** | Rolex-style watch with rotating hour/minute hands |
| 2 | **Flip Clock** | Airport-style flip digits with split panels |
| 3 | **Cloud/Dreamy** | Soft cloud layers with embedded time |
| 4 | **Analog - Vintage** | Classic alarm clock with rotating hands |
| 5 | **Neon Sign** | Glowing neon effect with layered shadows |
| 6 | **Minimalist** | Clean white card with subtle styling |
| 7 | **Retro LED** | Green LED display like old digital clocks |
| 8 | **Artistic** | Hand-drawn style with serif typography |

## Time Sources

| Image Source | Time Displayed |
|--------------|----------------|
| Camera capture | Device time at moment of capture |
| Gallery selection | Image's original creation time (from EXIF/MediaLibrary) |

## User Interactions

- **Tap** → Cycle to next clock design (loops through all 8 styles)
- **Drag** → Reposition the sticker
- **Pinch** → Scale up or down
- **Two-finger rotate** → Adjust angle

## Technical Implementation

### Analog Clocks (Styles 1 & 4)
```tsx
// Hour hand rotation: 30° per hour + minute adjustment
const hourRotation = (hours * 30) + (minutes * 0.5);

// Minute hand rotation: 6° per minute
const minuteRotation = minutes * 6;
```

The analog clocks feature:
- Rotating hour and minute hands
- 12 hour markers (bold for 12, 3, 6, 9)
- Center dot and bezel styling
- Luxury (gold on dark) vs Vintage (brown on cream) variants

### Flip Clock (Style 2)
- Split digit panels with top/bottom halves
- Divider line between halves
- Colon with animated dots
- Dark background with subtle shadows

### Digital Clocks (Styles 5, 6, 7, 8)
Each has unique styling:
- **Neon**: Multiple glow layers for realistic neon effect
- **Minimalist**: Clean white design with light shadows
- **Retro LED**: Green monospace text with CRT-like glow
- **Artistic**: Serif font on cream background

## Adding New Designs

To add a new clock design:

1. Create a new component (e.g., `NewClock`)
2. Add its StyleSheet
3. Add a case in `ClockStickerDesign` switch statement
4. Update `ClockStickerStyleType` type

## Legacy PNG Files

The PNG files (TIME1-TIME8.png) in this folder are **no longer used**.
All clocks are now rendered dynamically with React Native components.


