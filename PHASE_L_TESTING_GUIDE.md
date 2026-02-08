# Phase L — Quick Testing Guide 🎯

## ✅ Expo Status: RUNNING CLEAN on port 8081

---

## 📱 Testing Instructions

### **Step 1: Login as Clinic User**
1. Open Expo Go app on your device
2. Scan QR code from terminal
3. Login as clinic user
4. Navigate to a patient's details

---

### **Step 2: Navigate to Media Tab**
1. From patient details screen
2. Tap **"Media"** tab at the top
3. You should see:
   - "Add Image" button (top-left)
   - "New Session" button (top-right)
   - Grid of existing images (if any)

---

### **Step 3: Upload Image**
1. Tap **"Add Image"** button
2. Choose **Camera** or **Gallery**
3. Select/capture an image
4. Watch upload progress
5. ✅ Verify image appears in grid
6. ✅ Verify timeline shows "Image Uploaded"

---

### **Step 4: Annotate Image**
1. Tap on the uploaded image to open fullscreen
2. Tap **"Annotate"** button (bottom-right)
3. Draw on the image:
   - Try different colors (tap color circles at top)
   - Try different stroke widths (small/medium/large)
   - Test undo button (removes last stroke)
   - Test clear button (removes all strokes)
4. Tap **"Save"** button
5. Wait for upload to complete
6. ✅ Verify success message
7. ✅ Verify image now has "ANNOTATED" badge

---

### **Step 5: Verify Clinic Permissions**
**You should be able to:**
- ✅ Upload images
- ✅ Annotate images
- ✅ Delete images (tap red X on image)
- ✅ Create sessions
- ✅ View all media
- ✅ View timeline

---

### **Step 6: Test Patient View (View-Only)**
1. Logout from clinic
2. Login as patient (or use patient portal)
3. Navigate to patient view
4. Find an image in the timeline
5. Tap to open the image

**Verify Patient Restrictions:**
- ❌ NO "Add Image" button
- ❌ NO "Annotate" button when viewing image
- ❌ NO "Delete" button on images
- ❌ NO "New Session" button
- ✅ CAN view images (read-only)
- ✅ CAN see annotations (read-only)

---

## 🎥 Video Recording Instructions

**Record 10-15 second video showing:**
1. Start on Media tab (show grid)
2. Tap "Add Image"
3. Select image from gallery
4. Show upload progress
5. Tap uploaded image to open fullscreen
6. Tap "Annotate" button
7. Draw some quick annotations (2-3 strokes)
8. Tap "Save"
9. Show success message
10. Show image with "ANNOTATED" badge in grid

**Tips:**
- Use screen recording on your device
- Keep it smooth and quick (10-15 seconds)
- Show the entire flow in one take

---

## 📸 Screenshot Requirements

### **Screenshot 1: Media Grid**
**Show:**
- 2-column grid with images
- "Add Image" and "New Session" buttons
- At least 1 image with "ANNOTATED" badge
- Date overlay on images

### **Screenshot 2: Fullscreen with Annotate Button**
**Show:**
- Image opened in fullscreen
- "Annotate" button visible (bottom)
- Image metadata (date, uploaded by)
- Clear view of the image

### **Screenshot 3: After-Save View**
**Show:**
- Media grid after saving annotation
- Image with "ANNOTATED" badge highlighted
- Timeline showing "Image Annotated" entry (if visible)

### **Screenshot 4: Patient View (View-Only)**
**Show:**
- Same image opened in PATIENT view
- NO "Annotate" button visible
- NO "Delete" button visible
- Annotations visible (read-only)
- Patient interface clearly visible

---

## ✅ Quick Verification Checklist

Before recording, verify:

**Clinic User:**
- [ ] Can upload images
- [ ] Can see "Add Image" button
- [ ] Can annotate images
- [ ] Can see "Annotate" button in fullscreen
- [ ] Can save annotations
- [ ] Can delete images
- [ ] Can create sessions

**Patient User:**
- [ ] Can view images
- [ ] CANNOT see "Add Image" button
- [ ] CANNOT see "Annotate" button
- [ ] CANNOT see "Delete" button
- [ ] CAN see annotations (read-only)

---

## 🚀 Ready to Test!

1. **Open Expo Go** on your device
2. **Scan QR code** from terminal
3. **Follow steps above**
4. **Record video** (10-15 seconds)
5. **Take 4 screenshots**
6. **Share with me**

Once verified ✅, we proceed to **Phase M — Timeline & Sessions**!

---

## ⚡ Troubleshooting

**If you don't see Media tab:**
- Make sure you're logged in as clinic user
- Navigate to patient details first
- Look for tab bar at top with "Timeline | Media | Chat"

**If upload fails:**
- Check internet connection
- Check Firebase configuration
- Check console for errors

**If annotations don't save:**
- Make sure you drew something
- Wait for upload to complete
- Check Firebase Storage rules

**If patient can annotate (should NOT):**
- This is a bug - report immediately
- Check if logged in as correct user type

---

## 📞 Need Help?

If you encounter any issues:
1. Check terminal for errors (red text)
2. Share error messages with me
3. Describe what step failed
4. I'll help troubleshoot immediately

Let's get this tested! 🎉
