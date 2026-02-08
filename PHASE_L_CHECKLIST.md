# Phase L — Visual Testing Checklist ✅

## 🎯 Use this checklist while testing

---

## 📱 CLINIC USER TESTS

### Test 1: Media Upload
- [ ] Open app, login as clinic
- [ ] Navigate to patient details
- [ ] Tap "Media" tab
- [ ] See "Add Image" button (top-left)
- [ ] See "New Session" button (top-right)
- [ ] Tap "Add Image"
- [ ] Choose "Gallery" or "Camera"
- [ ] Select an image
- [ ] See upload progress indicator
- [ ] Image appears in grid
- [ ] Image has date overlay
- [ ] Timeline shows "Image Uploaded" entry

**Status:** ⬜ Not Tested | ✅ Pass | ❌ Fail

---

### Test 2: Image Annotation
- [ ] Tap on uploaded image (opens fullscreen)
- [ ] See image metadata (date, uploaded by)
- [ ] See "Annotate" button (bottom-right)
- [ ] Tap "Annotate" button
- [ ] Annotation canvas opens
- [ ] See color picker (5 colors)
- [ ] See stroke width selector (3 sizes)
- [ ] See undo button
- [ ] See clear button
- [ ] See save button
- [ ] See cancel button
- [ ] Draw on canvas with finger
- [ ] Change color (tap different color)
- [ ] Change stroke width (tap different size)
- [ ] Test undo (removes last stroke)
- [ ] Test clear (removes all strokes)
- [ ] Draw 2-3 strokes
- [ ] Tap "Save"
- [ ] See saving indicator
- [ ] See success message
- [ ] Return to media grid
- [ ] Image now has "ANNOTATED" badge (golden badge)
- [ ] Timeline shows "Image Annotated" entry

**Status:** ⬜ Not Tested | ✅ Pass | ❌ Fail

---

### Test 3: View Annotated Image
- [ ] Tap the annotated image
- [ ] Image opens in fullscreen
- [ ] Annotations are visible on image
- [ ] Metadata shows "Annotated" status
- [ ] Can still tap "Annotate" to edit further

**Status:** ⬜ Not Tested | ✅ Pass | ❌ Fail

---

### Test 4: Delete Image (Clinic Only)
- [ ] Hover/long-press on an image in grid
- [ ] See red delete button (bottom-right of image)
- [ ] Tap delete button
- [ ] See confirmation dialog
- [ ] Confirm deletion
- [ ] Image removed from grid
- [ ] Timeline updated

**Status:** ⬜ Not Tested | ✅ Pass | ❌ Fail

---

### Test 5: Create Session
- [ ] Tap "New Session" button
- [ ] Modal opens
- [ ] Enter session title
- [ ] Enter session description (optional)
- [ ] Tap "Save"
- [ ] Session created
- [ ] Timeline shows session entry

**Status:** ⬜ Not Tested | ✅ Pass | ❌ Fail

---

## 👤 PATIENT USER TESTS

### Test 6: Patient View (Read-Only)
- [ ] Logout from clinic
- [ ] Login as patient (or access patient portal)
- [ ] Navigate to patient view
- [ ] See timeline with images (if applicable)
- [ ] Tap on an image
- [ ] Image opens in fullscreen
- [ ] **VERIFY:** NO "Annotate" button visible
- [ ] **VERIFY:** NO "Delete" button visible
- [ ] **VERIFY:** NO "Add Image" button visible
- [ ] **VERIFY:** Annotations ARE visible (read-only)
- [ ] Can view image and zoom
- [ ] Can close image
- [ ] Can view all images but NOT edit

**Status:** ⬜ Not Tested | ✅ Pass | ❌ Fail

---

## 🎥 VIDEO RECORDING CHECKLIST

**Record ONE video (10-15 seconds) showing:**

- [ ] Start on Media tab (show grid)
- [ ] Tap "Add Image" button
- [ ] Select image from gallery
- [ ] Show upload progress (brief)
- [ ] Tap uploaded image to open fullscreen
- [ ] Tap "Annotate" button
- [ ] Draw 2-3 quick strokes (different colors if possible)
- [ ] Tap "Save" button
- [ ] Show success message
- [ ] Show grid with "ANNOTATED" badge on image

**Video Status:** ⬜ Not Recorded | ✅ Recorded

---

## 📸 SCREENSHOT CHECKLIST

### Screenshot 1: Media Grid View
**Must show:**
- [ ] 2-column grid layout
- [ ] Multiple images (if available)
- [ ] "Add Image" button visible (top-left)
- [ ] "New Session" button visible (top-right)
- [ ] At least ONE image with "ANNOTATED" badge
- [ ] Date overlays on images
- [ ] Clean, clear view

**Status:** ⬜ Not Taken | ✅ Taken

---

### Screenshot 2: Fullscreen with Annotation Button
**Must show:**
- [ ] Image opened in fullscreen
- [ ] Black background
- [ ] Image metadata visible (date, uploaded by)
- [ ] "Annotate" button visible (bottom area)
- [ ] "Close" button visible (top-left)
- [ ] If annotated, "ANNOTATED" status shown
- [ ] Clear view of entire interface

**Status:** ⬜ Not Taken | ✅ Taken

---

### Screenshot 3: Annotation Canvas
**Must show:**
- [ ] Image with annotation canvas overlay
- [ ] Color picker visible (5 colors)
- [ ] Stroke width selector visible (3 sizes)
- [ ] Drawing strokes on image
- [ ] Undo/Clear/Save/Cancel buttons visible
- [ ] Clear view of annotation interface

**Status:** ⬜ Not Taken | ✅ Taken

---

### Screenshot 4: Patient View (View-Only)
**Must show:**
- [ ] Image opened in PATIENT view
- [ ] **NO "Annotate" button** (crucial!)
- [ ] **NO "Delete" button** (crucial!)
- [ ] Annotations visible on image (read-only)
- [ ] Only "Close" button visible
- [ ] Patient interface clearly shown

**Status:** ⬜ Not Taken | ✅ Taken

---

## ⚠️ CRITICAL CHECKS

### Permission Enforcement (Must Verify!)
- [ ] ✅ Clinic sees "Add Image" button
- [ ] ✅ Clinic sees "Annotate" button in fullscreen
- [ ] ✅ Clinic sees "Delete" button on images
- [ ] ✅ Clinic can save annotations
- [ ] ❌ Patient does NOT see "Add Image" button
- [ ] ❌ Patient does NOT see "Annotate" button
- [ ] ❌ Patient does NOT see "Delete" button
- [ ] ✅ Patient CAN view images (read-only)
- [ ] ✅ Patient CAN see annotations (read-only)

**All checks must pass for Phase L to be complete!**

---

## 🐛 ISSUES ENCOUNTERED

**If you encounter any issues, note them here:**

### Issue 1:
- **What happened:** _____________________
- **When:** _____________________
- **Error message (if any):** _____________________

### Issue 2:
- **What happened:** _____________________
- **When:** _____________________
- **Error message (if any):** _____________________

---

## ✅ FINAL VERIFICATION

### Before submitting, verify:
- [ ] All clinic tests passed ✅
- [ ] All patient tests passed ✅
- [ ] Video recorded (10-15 seconds)
- [ ] 4 screenshots taken
- [ ] All screenshots show required elements
- [ ] No critical errors encountered
- [ ] Permissions properly enforced
- [ ] Ready to proceed to Phase M

---

## 📤 SUBMIT

Once all checks are complete:

1. ✅ Confirm all tests passed
2. 📹 Share video file
3. 📸 Share 4 screenshots
4. 📝 Report any issues (if any)
5. ✅ Confirm ready for Phase M

**Submission Status:** ⬜ Pending | ✅ Submitted

---

## 🎉 COMPLETION

**Phase L Status:** ⬜ In Progress | ✅ Complete | ❌ Failed

**Notes:**
_____________________
_____________________
_____________________

**Next Step:** Phase M — Timeline & Sessions Enhancement 🚀

---

Thank you for thorough testing! 🙏
