# Phase M — Testing Guide 🎯

## ✅ Expo Status: Running on port 8081

---

## 🧪 Testing Instructions

### **Test 1: Timeline Filters**

1. **Login as Clinic user**
2. Navigate to Patient → Media tab
3. Tap "Timeline" tab at top
4. **Verify filter bar shows:**
   - All (with count)
   - Sessions (with count)
   - Images (with count)
   - Annotations (with count)

5. **Tap each filter:**
   - ✅ "All" → Shows all entries
   - ✅ "Sessions" → Shows only session entries
   - ✅ "Images" → Shows only image upload entries
   - ✅ "Annotations" → Shows only annotated image entries

6. **Verify:**
   - Filter button highlights in gold when active
   - Counts are accurate
   - Timeline updates correctly

**Screenshot Required:** Timeline with filter bar visible

---

### **Test 2: Session Expansion**

1. **On Timeline tab**
2. Find a session entry
3. **Verify session header shows:**
   - Session title
   - Date
   - Description (if any)
   - Media count (e.g., "3 images")
   - Expand/collapse icon (chevron)

4. **Tap expand icon (chevron down)**
5. **Verify:**
   - ✅ Session expands
   - ✅ Thumbnail grid appears below
   - ✅ Shows all images in session
   - ✅ Annotated images have "A" badge

6. **Tap thumbnail**
7. **Verify:**
   - ✅ Image opens in fullscreen viewer
   - ✅ Can view/annotate (if clinic)

8. **Return to timeline, tap chevron again**
9. **Verify:**
   - ✅ Session collapses
   - ✅ Thumbnail grid hides

**Screenshot Required:** Expanded session showing thumbnail grid

---

### **Test 3: Create New Session**

1. **On Media tab (top tab)**
2. Tap **"New Session"** button
3. **Verify modal opens with:**
   - "Create New Session" title
   - Session Title input
   - Description input (multiline)
   - Cancel button
   - Create button

4. **Enter:**
   - Title: "Initial Consultation"
   - Description: "First visit with patient"

5. **Tap "Create" button**
6. **Verify:**
   - ✅ Success message appears
   - ✅ Modal closes
   - ✅ Session appears in timeline

**Screenshot:** Session creation modal filled out

---

### **Test 4: Upload with Session Assignment**

1. **On Media tab**
2. Tap **"Add Image"** button
3. **Select image from gallery/camera**
4. **Verify Session Picker Modal appears:**
   - "Assign to Session" title
   - Hint text: "Choose a session or upload without session"
   - "No Session" option (with image icon)
   - List of existing sessions (with folder icon)
   - Each session shows:
     - Title
     - Date
     - Media count
   - Cancel button
   - Upload button

5. **Test "No Session" option:**
   - Tap "No Session"
   - ✅ Verify gold border + check icon
   - Tap "Upload"
   - ✅ Verify image uploads
   - ✅ Verify NO sessionId assigned

6. **Test with session assignment:**
   - Select another image
   - Choose an existing session
   - ✅ Verify gold border + check icon on selected
   - Tap "Upload"
   - ✅ Verify image uploads
   - ✅ Switch to Timeline tab
   - ✅ Expand that session
   - ✅ Verify image appears in session's thumbnail grid

**Screenshot Required:** Session Picker Modal with session selected

---

### **Test 5: Complete Upload Flow**

**Record this as video (10-15 seconds):**

1. Start on Media tab
2. Tap "New Session" → Enter "Follow-up Visit" → Create
3. Tap "Add Image" → Select image
4. Session Picker opens → Select "Follow-up Visit"
5. Tap "Upload" → Wait for upload
6. Success message appears
7. Switch to "Timeline" tab
8. Find "Follow-up Visit" session
9. Tap to expand session
10. Show image appears in grid
11. (Optional) Quick switch to patient view showing read-only

**Video Required:** 10-15 seconds showing this flow

---

### **Test 6: Timeline Performance**

1. **Create multiple sessions** (3-5 sessions)
2. **Upload multiple images** (10-15 images)
3. **Annotate 2-3 images**
4. **Switch to Timeline tab**
5. **Verify:**
   - ✅ Timeline loads quickly (< 2 seconds)
   - ✅ Scrolling is smooth (no lag)
   - ✅ Expanding sessions is instant
   - ✅ Filter changes are instant
   - ✅ No UI freezing

**Test with 50+ entries if possible**

---

### **Test 7: Patient View (Read-Only)**

1. **Logout from clinic**
2. **Login as patient**
3. **Navigate to patient view**
4. **Verify patient CANNOT see:**
   - ❌ "Add Image" button
   - ❌ "New Session" button
   - ❌ "Annotate" button (when viewing image)
   - ❌ Delete buttons

5. **Verify patient CAN:**
   - ✅ View timeline
   - ✅ Filter timeline
   - ✅ Expand sessions
   - ✅ View images in sessions
   - ✅ View fullscreen images
   - ✅ See annotations (read-only)

**Screenshot Required:** Patient view showing read-only timeline

---

## 📸 Screenshot Requirements

### **Screenshot 1: Timeline with Filters**
**Must show:**
- [ ] Filter bar at top (All, Sessions, Images, Annotations)
- [ ] Filter counts visible
- [ ] Active filter highlighted in gold
- [ ] Timeline entries visible below
- [ ] Mix of sessions, images, annotations

### **Screenshot 2: Expanded Session**
**Must show:**
- [ ] Session header (title, date, description)
- [ ] Media count (e.g., "3 images")
- [ ] Expanded thumbnail grid
- [ ] Multiple thumbnails visible
- [ ] "A" badge on annotated images
- [ ] Expand/collapse icon (chevron up)

### **Screenshot 3: Session Picker Modal**
**Must show:**
- [ ] "Assign to Session" title
- [ ] "No Session" option
- [ ] 2-3 existing sessions listed
- [ ] Selected option with gold border
- [ ] Check icon on selected option
- [ ] Session details (date, media count)
- [ ] Cancel and Upload buttons

### **Screenshot 4: Patient View**
**Must show:**
- [ ] Timeline visible
- [ ] NO "Add Image" button
- [ ] NO "New Session" button
- [ ] Expanded session showing images
- [ ] Patient interface (clearly different from clinic)

---

## 🎥 Video Requirements

**Duration:** 10-15 seconds  
**Content:** Complete flow from session creation → upload → view in timeline

**Script:**
```
0:00 - Show Media tab
0:02 - Tap "New Session", create quickly
0:04 - Tap "Add Image", select image
0:06 - Session Picker appears
0:07 - Select session, tap "Upload"
0:09 - Switch to Timeline tab
0:11 - Find session, tap to expand
0:13 - Show image in session grid
0:15 - Done!
```

**Tips:**
- Keep it smooth and quick
- Show the key features clearly
- One continuous take preferred
- Screen recording recommended

---

## ✅ Quick Verification Checklist

Before submitting, verify:

### **Timeline:**
- [ ] Filters work (All, Sessions, Images, Annotations)
- [ ] Filter counts accurate
- [ ] Sessions expandable/collapsible
- [ ] Thumbnail grids display correctly
- [ ] Smooth scrolling

### **Session Management:**
- [ ] Can create new sessions
- [ ] Session picker appears on upload
- [ ] "No Session" option works
- [ ] Session assignment works
- [ ] Images appear in session grids

### **Permissions:**
- [ ] Clinic can create/upload/annotate
- [ ] Patient view-only (no edit buttons)

### **Performance:**
- [ ] Timeline loads fast
- [ ] No lag when scrolling
- [ ] Filters change instantly
- [ ] Expansion is smooth

### **Localization:**
- [ ] English works
- [ ] Arabic works (RTL layout correct)

---

## 🐛 Common Issues & Solutions

### **Session Picker doesn't appear:**
- Reload the app
- Check that sessions exist (create one first)
- Check console for errors

### **Images not appearing in session grid:**
- Verify image was uploaded with sessionId
- Check Firestore: session.mediaIds array should contain image ID
- Reload timeline data

### **Filters not working:**
- Verify entries exist for each type
- Check console for filter logic errors
- Try "All" filter first

### **Patient can edit (shouldn't):**
- **This is a bug!** Report immediately
- Verify logged in as patient, not clinic
- Check `isClinic` prop

---

## 📞 Need Help?

**If you encounter issues:**
1. Check terminal for errors
2. Try reloading the app
3. Share error messages
4. Describe what step failed
5. Take screenshot of error

---

## 🎉 Ready to Test!

1. Open Expo Go on your device
2. Scan QR code (port 8081)
3. Follow tests above
4. Record video (10-15 seconds)
5. Take 4 screenshots
6. Confirm all features work ✅
7. Report any issues

Once verified, we proceed to **Phase N — Reports & Export**! 🚀
