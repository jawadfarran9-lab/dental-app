# Custom Sticker Pack

This folder was used for PNG sticker assets. We've now migrated to **SVG-based React Native components** for better quality and scalability.

## Current Implementation

Sticker components are now located at:
```
src/components/stickers/index.tsx
```

## Available Stickers (10 total)

| ID | Label | Description |
|----|-------|-------------|
| `good_morning` | Good Morning | Yellow/orange gradient with sun rays |
| `good_night` | Good Night | Purple/blue gradient with moon |
| `omg` | OMG | Red/orange gradient with drip effect |
| `tysm` | TYSM | Pink/magenta gradient with hearts |
| `yay` | Yay! | Rainbow gradient with stars |
| `tuesday` | Tuesday | Purple/magenta retro style |
| `sound_on` | Sound On | Teal gradient with speaker icon |
| `lol` | LOL | Yellow/orange with tear drops |
| `eyes` | Eyes | Classic cartoon eyes |
| `four_k` | 4K | Blue/purple TV icon |

## Usage

Stickers are rendered as SVG components in the Story Editor sticker tray.
They support a `size` prop for scaling.

```tsx
import { GoodMorningSticker, STICKER_COMPONENTS } from '@/src/components/stickers';

// Single sticker
<GoodMorningSticker size={100} />

// All stickers with metadata
STICKER_COMPONENTS.map(({ id, label, Component }) => (
  <Component key={id} size={90} />
))
```
