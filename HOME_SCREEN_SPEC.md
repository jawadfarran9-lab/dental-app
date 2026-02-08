# 🏠 HOME SCREEN - FINAL SPECIFICATIONS

## ✅ STAGE 2 — HOME SCREEN COMPLETE

### 1️⃣ TOP BAR (Header)

**Layout:**
- Left: ❤️ Favorites icon (22px)
- Center: **BeSmile** logo (26px, bold)
- Right: ➕ Create icon (22px)
- Padding: 16px horizontal

**Colors:**
- Light: Text #111111, Icons #111111
- Dark: Text #FFFFFF, Icons #FFFFFF

**Measurements:**
- Height: 56px (12px padding top/bottom)
- Border bottom: 1px (theme cardBorder)

---

### 2️⃣ STORIES ROW (Instagram-style)

**Circle Specifications:**
- Diameter: 70px
- Border ring: 4px
- Active (unviewed): **#1E66FF** (Blue light) / **#D4AF37** (Gold dark)
- Viewed: **#C7C7CC** (Gray)

**Layout:**
- Horizontal scroll (FlatList)
- Gap between circles: 12px
- Padding horizontal: 12px
- Margin bottom: 8px per circle

**First Circle (Your Story):**
- Gray background
- Small **+** icon (16px) centered
- Label: "Your story"

**Other Circles:**
- Emoji avatar inside (32px)
- Clinic name below (13px font, max 1 line)

**Interactions:**
- **Tap**: Opens Story Viewer modal (fullscreen)
- **Long Press**: Opens Bottom Sheet with clinic actions
  - Add to Favorites ❤️ (toggle)
  - View Profile 👤
  - Cancel

---

### 3️⃣ POST FEED

**Post Card Layout:**

**Header:**
- Avatar: 36px circle
- Clinic name: 15px bold
- Timestamp: 12px regular
- More menu (⋮): optional

**Image/Video:**
- Aspect ratio: 1:1 (square)
- Width: 100% (no padding)
- Border radius: 0 (sharp edges)
- Background: Light gray (#f0f0f0)

**Image Videos:**
- If unviewed: Play icon (80px, theme accentBlue)
- If finished: Replay button overlay (center, semi-transparent)
  - Circle: 56px diameter
  - Background: rgba(0,0,0,0.3)
  - Icon: Play ▶️ (28px, white)

**Actions Row (Below Image):**
- Gap between icons: 18px
- Icon sizes: 24px
- Interactions:
  - ❤️ Like (toggles red #FF6B6B, updates count)
  - 💬 Comment
  - 📤 Share

**Caption Section:**
- Clinic name: 14px bold
- Description: 14px regular
- Padding: 12px horizontal

---

### 4️⃣ BOTTOM TAB BAR

**Configuration:**

| Tab | Icon | Function |
|-----|------|----------|
| Clinic | medkit | Doctor/Patient selector + Languages |
| Home | home | Feed (current) |
| CREATE | ➕ | Post/Story modal |
| Subscription | card | Plans |
| AI Pro | sparkles | AI Chat |
| Clinics | grid | Discovery |

**Tab Bar Specifications:**
- Height: 68px
- Icon size: 24px (regular tabs), 26px (+ button)
- Active color: **#1E66FF** (accentBlue)
- Inactive color: **#9AA0A6**
- Background: theme.background
- Border: 1px top (theme.cardBorder)

**Center "+" Button:**
- Position: Floating center
- Diameter: 56px
- Offset: -12px (raised above bar)
- Background: **#1E66FF** (accentBlue)
- Icon: + (26px, white)
- Shadow: Elevation 5

**Create Modal (Triggered by +):**
- Bottom sheet style
- Options:
  - 📷 Create Post
  - 📹 Create Story
  - ✖️ Cancel
- Transparent overlay: rgba(0,0,0,0.5)

---

### 5️⃣ COLOR PALETTE

**Light Mode:**
```
Background: #FFFFFF
Text Primary: #111111
Text Secondary: #1F2937
Accent (Blue): #1E66FF
Card Background: #FFFFFF
Card Border: #E5E7EB
```

**Dark Mode:**
```
Background: #000000
Text Primary: #FFFFFF
Text Secondary: #E5E7EB
Accent (Gold): #D4AF37
Card Background: #0F0F10
Card Border: #1F1F23
```

---

### ✅ ACCEPTANCE CHECKLIST

- ✅ Home Screen renders without errors
- ✅ Stories row: 70px circles, 4px borders, correct colors
- ✅ Stories gap: 12px between each
- ✅ Stories font: 13px, centered below
- ✅ Post feed: Avatar 36px, name 15px bold
- ✅ Post image: 1:1 aspect ratio, no radius
- ✅ Like/Comment/Share: 24px icons, 18px gap
- ✅ Replay button: Center, 56px, semi-transparent, 28px icon
- ✅ Bottom tabs: 24px icons, 68px height
- ✅ + Button: 56px, -12px offset, white icon
- ✅ Top bar: Logo center (26px), icons left/right (22px)
- ✅ Colors: Exact hex values verified
- ✅ Zero TypeScript errors
- ✅ No crashes on startup
- ✅ No navigation changes made
- ✅ Theme colors applied consistently

---

## 📱 Ready for Device Testing

**Tunnel URL:** `exp://ou98que-anonymous-8081.exp.direct`

**Next Steps:**
1. Scan QR code on iOS Camera / Android Expo Go
2. Verify Light mode: Blue stories, White background
3. Verify Dark mode: Gold stories, Black background
4. Test story interactions (tap, long-press)
5. Test post like button toggle
6. Test video replay button
7. Test + button opens create sheet

**NO NAVIGATION CHANGES — Awaiting approval to proceed to next stage.**
