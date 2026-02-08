# Visual Testing Guide - Instagram-Style Home Screen

## 🚀 How to Test

1. **Ensure Expo is Running**
   - Terminal shows: `Metro waiting on exp://10.0.0.2:8081`
   - You should see the QR code

2. **On Your Device**
   - **Android**: Open Expo Go → Scan QR code → App loads
   - **iOS**: Open Camera app → Scan QR code → Tap notification → Opens in Expo Go

3. **Navigate to Home Screen**
   - Tap the **Home** tab (house icon) in the bottom tab bar

---

## 🎨 Visual Elements to Verify

### Light Mode (Default)
- **Story Rings**: Should be **BLUE** color (#007AFF or accentBlue)
- **Header**: White background with black text
- **Feed**: Light gray cards with thin borders
- **Buttons**: Blue-tinted for primary actions

### Dark Mode
1. Tap the three-line menu (⚙️) icon
2. Toggle Dark Mode ON
3. **Story Rings**: Should turn **GOLD/YELLOW** color (promo color)
4. **Header**: Dark gray/black with white text
5. **Feed**: Dark gray cards with subtle borders
6. **Buttons**: Gold/warm tones

---

## 📱 Screen Elements Checklist

### Header Section
- [ ] Text reads "Feed" (English) or "الفيد" (Arabic)
- [ ] **+** button (Create Post) visible on the right
- [ ] Header styled with proper theme colors

### Stories Row
- [ ] Shows 4 clinic avatars in a horizontal row
- [ ] Each has a circular ring border (blue light mode / gold dark mode)
- [ ] Clinic names appear below each avatar: "Smile Dental", "Happy Teeth", "Dental Plus", "Shine Clinic"
- [ ] Can scroll horizontally (on larger screens)
- [ ] **Tap any story**: Bottom sheet modal opens

### Feed Posts

#### Post #1 (Image)
- [ ] **Header**:
  - Clinic avatar with ring (small 40x40)
  - Clinic name: "Smile Dental"
  - Timestamp: "2 hours ago"
  - PRO badge visible (star icon + "Pro" text)
- [ ] **Media**: Image placeholder (400x300 area)
- [ ] **Caption**: "Beautiful smile transformation! 😊"
- [ ] **Actions**: 
  - Heart (like) icon showing "234" likes
  - Chat bubble (comment) icon showing "12" comments
  - Share icon (styled)
- [ ] Tap heart icon: Should toggle red/gray and increment like count

#### Post #2 (Video)
- [ ] **Header**:
  - Clinic avatar with ring (small 40x40)
  - Clinic name: "Happy Teeth"
  - Timestamp: "4 hours ago"
  - NO Pro badge (free tier clinic)
- [ ] **Media**: 
  - Placeholder image (400x300 area)
  - Play icon (▶️) overlay visible
- [ ] **Caption**: "New treatment technology available"
- [ ] **Actions**: Same as post #1 (234 likes, 12 comments)

---

## 🎯 Interactive Tests

### Test 1: Tap Story Circle
1. Tap any story avatar (e.g., "Smile Dental")
2. **Expected Result**:
   - ✅ Bottom sheet modal appears from bottom
   - ✅ Shows clinic avatar (large)
   - ✅ Shows clinic name ("Smile Dental")
   - ✅ Shows clinic bio ("Professional dental care")
   - ✅ Shows 2 buttons:
     - "Add to favorites" (white button)
     - "View profile" (blue button)
   - ✅ Shows "Cancel" option at bottom

### Test 2: Add to Favorites
1. With bottom sheet open, tap "Add to favorites"
2. **Expected Result**:
   - ✅ Button text changes to "Added to favorites"
   - ✅ Button color changes to darker/highlighted
   - ✅ Close modal (tap Cancel or X)
   - ✅ Tap same story again → "Added to favorites" still shows
   - ✅ Ring around favorite story is thicker/different color

### Test 3: View Profile Navigation
1. With bottom sheet open, tap "View profile"
2. **Expected Result**:
   - ✅ Modal closes
   - ✅ Navigates to clinic profile page: `/public/clinic/[id]`
   - ✅ Should show clinic details (if implemented)
   - ✅ Can tap back arrow to return to Home

### Test 4: Like Post
1. Tap the heart icon on any post
2. **Expected Result**:
   - ✅ Heart turns red/filled
   - ✅ Like count increases by 1
   - ✅ Tap again: Heart turns gray/outline, count decreases

### Test 5: Create Post
1. Tap the **+** button (top-right of header)
2. **Expected Result**:
   - ✅ Modal appears (slide up animation)
   - ✅ Shows "New Post" title
   - ✅ Image placeholder with icon + text "Tap to select photo"
   - ✅ "Caption" section with input field
   - ✅ 3 option rows:
     - 🎵 Music icon + "Add music"
     - 👥 People icon + "Tag people"
     - 📍 Location icon + "Add location"
   - ✅ "Share" button (blue) in top right
   - ✅ Can type in caption field (TextField active)

### Test 6: Close Create Post
1. With Create Post modal open, tap:
   - [ ] **X button** (top-left) → Should close
   - [ ] **Share button** (top-right) → Should close
   - [ ] Tap outside modal → Should close
2. **Expected Result**:
   - ✅ Modal slides down and closes
   - ✅ Returns to Home feed
   - ✅ Post caption input is cleared

### Test 7: Video Finished Overlay
1. Locate the video post (#2 "Happy Teeth")
2. Imagine the video finished playing
3. **Expected Result** (if you can trigger video finished state):
   - ✅ Overlay appears with 2 buttons:
     - "Watch again" button
     - "Watch more reels" button
   - ✅ Buttons are styled prominently
   - ✅ Tapping "Watch again" resets the overlay

---

## 🌍 Internationalization Tests

### English Mode (Default)
- [ ] All text displays in English:
  - "Feed" (header)
  - "Add to favorites" / "Added to favorites"
  - "View profile"
  - "Watch again" / "Watch more reels"
  - "New Post" (Create Post title)
  - "Share" button
  - Clinic names and captions visible

### Arabic Mode (RTL)
1. Open app settings/menu
2. Select **Arabic** language
3. **Expected Result**:
   - ✅ **All text RIGHT-aligned** (not left)
   - ✅ **Tab bar icons reversed** (if using directional layout)
   - ✅ **Buttons flip** (action buttons reverse order)
   - ✅ **Modal sheets position correctly** (not cut off)
   - ✅ All text translates:
     - "الفيد" (Feed)
     - "أضف إلى المفضلة" (Add to favorites)
     - "عرض الملف" (View profile)
     - "شاهد مرة أخرى" (Watch again)
     - "منشور جديد" (New Post)
     - "شارك" (Share)
   - ✅ **Tap stories and navigate**: All interactions work in RTL

---

## 🔧 Troubleshooting

### If "Feed" shows as raw key "home.feedTitle"
- ✅ This means i18n is NOT loading
- **Fix**: 
  - Restart Expo: Press `r` in terminal
  - Check i18n initialization in `app/_layout.tsx`
  - Verify `app/i18n/en.json` and `app/i18n/ar.json` are valid JSON

### If Bottom Sheet doesn't appear
- ✅ Check Modal visibility state
- **Fix**:
  - Verify `selectedStory` state updates when tapping story
  - Check if `Modal` component is rendered
  - Try tapping story circle (gray area around avatar)

### If Create Post modal doesn't open
- ✅ Check `createPostVisible` state
- **Fix**:
  - Verify **+** button `onPress` triggers `setCreatePostVisible(true)`
  - Check if modal is rendered below home content
  - Try reloading app (press `r` in Expo terminal)

### If Colors don't match (rings not blue/gold)
- ✅ Check theme context
- **Fix**:
  - Verify `isDark` flag updates when switching dark mode
  - Check `colors.accentBlue` and `colors.promo` in `ThemeContext`
  - Clear Expo cache: Delete `.expo` folder, restart

### If RTL text is wrong direction
- ✅ Language detection issue
- **Fix**:
  - Verify language is set to Arabic in app settings
  - Check `i18n.language` value in console
  - Restart app and reselect Arabic

---

## 📊 Screenshots to Capture

1. **Home Light Mode**
   - Stories row (blue rings)
   - Feed posts
   - Header with + button

2. **Home Dark Mode**
   - Stories row (gold rings)
   - Feed posts
   - Check color contrast

3. **Bottom Sheet Modal**
   - Story detail with avatar
   - Favorite button
   - View profile button

4. **Create Post Modal**
   - Image placeholder
   - Caption input
   - Option rows

5. **Arabic RTL**
   - Text right-aligned
   - Buttons reversed
   - All interactions working

6. **Like/Unlike Post**
   - Red heart (liked)
   - Gray heart (not liked)
   - Like count updated

---

## ✅ Final Sign-Off

Once all tests pass:
1. ✅ Home screen displays without errors
2. ✅ Stories row works (tap → bottom sheet)
3. ✅ Feed posts display with proper styling
4. ✅ Like button toggles and updates count
5. ✅ Create Post modal opens/closes
6. ✅ All text uses i18n (no raw keys)
7. ✅ Dark mode colors are correct
8. ✅ Arabic RTL layout works
9. ✅ Bottom tabs navigate correctly
10. ✅ Navigation to clinic profile works

**Status**: Ready for visual verification! 🎉
