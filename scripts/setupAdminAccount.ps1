# Admin Test Account Setup - PowerShell Script
# Creates admin account using Firebase REST APIs
# No Node.js dependencies required!

Write-Host "`n" -ForegroundColor Cyan
Write-Host "══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  ADMIN TEST ACCOUNT SETUP" -ForegroundColor Yellow
Write-Host "══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Configuration
$EMAIL = "jawadfarran9@gmail.com"
$PASSWORD = "jawadfarran9"
$PROJECT_ID = "dental-jawad"

Write-Host "📋 Account Details:" -ForegroundColor Green
Write-Host "   Email:    $EMAIL" -ForegroundColor White
Write-Host "   Password: $PASSWORD" -ForegroundColor White
Write-Host "   Project:  $PROJECT_ID" -ForegroundColor White
Write-Host ""

Write-Host "⚠️  IMPORTANT INSTRUCTIONS:" -ForegroundColor Yellow
Write-Host ""
Write-Host "This script will guide you through creating the admin account." -ForegroundColor White
Write-Host "Since Firebase Auth requires admin credentials, you'll need to:" -ForegroundColor White
Write-Host ""
Write-Host "OPTION 1: Manual Setup (Recommended - 5 minutes)" -ForegroundColor Cyan
Write-Host "  1. Open Firebase Console: https://console.firebase.google.com" -ForegroundColor White
Write-Host "  2. Select project: dental-jawad" -ForegroundColor White
Write-Host "  3. Go to Authentication → Users" -ForegroundColor White
Write-Host "  4. Click 'Add User'" -ForegroundColor White
Write-Host "  5. Email: $EMAIL" -ForegroundColor White
Write-Host "  6. Password: $PASSWORD" -ForegroundColor White
Write-Host "  7. Click 'Add User'" -ForegroundColor White
Write-Host "  8. Copy the User UID (you'll need this)" -ForegroundColor Yellow
Write-Host ""

$response = Read-Host "Have you created the Firebase Auth user? (y/n)"

if ($response -ne 'y') {
    Write-Host ""
    Write-Host "❌ Please create the Firebase Auth user first, then run this script again." -ForegroundColor Red
    Write-Host ""
    Write-Host "Quick Link: https://console.firebase.google.com/project/dental-jawad/authentication/users" -ForegroundColor Cyan
    Write-Host ""
    exit
}

Write-Host ""
$USER_UID = Read-Host "Enter the User UID you copied from Firebase Console"

if ([string]::IsNullOrWhiteSpace($USER_UID)) {
    Write-Host ""
    Write-Host "❌ User UID is required. Please run the script again." -ForegroundColor Red
    Write-Host ""
    exit
}

Write-Host ""
Write-Host "🚀 Creating Firestore documents..." -ForegroundColor Green
Write-Host ""

# Generate IDs
$CLINIC_ID = "clinic_${USER_UID}_admin"
$MEMBER_ID = "member_${USER_UID}_${CLINIC_ID}"

Write-Host "📝 Generated IDs:" -ForegroundColor Yellow
Write-Host "   User ID:   $USER_UID" -ForegroundColor White
Write-Host "   Clinic ID: $CLINIC_ID" -ForegroundColor White
Write-Host "   Member ID: $MEMBER_ID" -ForegroundColor White
Write-Host ""

# Create Firestore documents JSON
Write-Host "📄 Creating Firestore document templates..." -ForegroundColor Green

# 1. Clinic Document
$clinicDoc = @"
{
  "clinicId": "$CLINIC_ID",
  "ownerId": "$USER_UID",
  "clinicName": "Admin Test Clinic",
  "clinicCode": "ADMIN001",
  "subscribed": true,
  "subscriptionPlan": "PRO_AI",
  "subscriptionStatus": "active",
  "aiProEnabled": true,
  "tier": "pro",
  "phone": "+971501234567",
  "email": "$EMAIL",
  "address": "Admin Test Location",
  "country": "AE",
  "city": "Dubai",
  "heroImageUrl": "https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=1200",
  "logoUrl": "https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=400"
}
"@

# 2. Clinic Member Document
$memberDoc = @"
{
  "memberId": "$MEMBER_ID",
  "clinicId": "$CLINIC_ID",
  "userId": "$USER_UID",
  "email": "$EMAIL",
  "displayName": "Admin Test Account",
  "role": "OWNER_ADMIN",
  "status": "ACTIVE"
}
"@

# 3. Public Clinic Document
$publicClinicDoc = @"
{
  "clinicId": "$CLINIC_ID",
  "ownerId": "$USER_UID",
  "name": "Admin Test Clinic",
  "isPublished": true,
  "tier": "pro",
  "phone": "+971501234567",
  "whatsapp": "+971501234567",
  "email": "$EMAIL",
  "address": "Admin Test Location, Dubai, UAE",
  "geo": {
    "lat": 25.2048,
    "lng": 55.2708
  },
  "geohash": "thrwmzx",
  "heroImage": "https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=1200",
  "averageRating": 5.0,
  "totalReviews": 100,
  "specialty": "general"
}
"@

# 4. User Profile Document
$userDoc = @"
{
  "userId": "$USER_UID",
  "email": "$EMAIL",
  "displayName": "Admin Test Account",
  "role": "clinic",
  "clinicId": "$CLINIC_ID",
  "memberId": "$MEMBER_ID"
}
"@

# Save to temp files
$tempDir = Join-Path $env:TEMP "dental-admin-setup"
New-Item -ItemType Directory -Force -Path $tempDir | Out-Null

$clinicDoc | Out-File -FilePath "$tempDir\clinic.json" -Encoding UTF8
$memberDoc | Out-File -FilePath "$tempDir\member.json" -Encoding UTF8
$publicClinicDoc | Out-File -FilePath "$tempDir\public_clinic.json" -Encoding UTF8
$userDoc | Out-File -FilePath "$tempDir\user.json" -Encoding UTF8

Write-Host "✅ Document templates created in: $tempDir" -ForegroundColor Green
Write-Host ""

Write-Host "══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  NEXT STEPS - ADD FIRESTORE DOCUMENTS" -ForegroundColor Yellow
Write-Host "══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "Go to Firebase Console → Firestore Database:" -ForegroundColor White
Write-Host "https://console.firebase.google.com/project/dental-jawad/firestore" -ForegroundColor Cyan
Write-Host ""

Write-Host "1️⃣  Create CLINIC document:" -ForegroundColor Yellow
Write-Host "   • Collection: clinics" -ForegroundColor White
Write-Host "   • Document ID: $CLINIC_ID" -ForegroundColor Green
Write-Host "   • Copy fields from: $tempDir\clinic.json" -ForegroundColor White
Write-Host ""

Write-Host "2️⃣  Create CLINIC MEMBER document:" -ForegroundColor Yellow
Write-Host "   • Collection: clinic_members" -ForegroundColor White
Write-Host "   • Document ID: $MEMBER_ID" -ForegroundColor Green
Write-Host "   • Copy fields from: $tempDir\member.json" -ForegroundColor White
Write-Host ""

Write-Host "3️⃣  Create PUBLIC CLINIC document:" -ForegroundColor Yellow
Write-Host "   • Collection: clinics_public" -ForegroundColor White
Write-Host "   • Document ID: $CLINIC_ID" -ForegroundColor Green
Write-Host "   • Copy fields from: $tempDir\public_clinic.json" -ForegroundColor White
Write-Host ""

Write-Host "4️⃣  Create USER PROFILE document:" -ForegroundColor Yellow
Write-Host "   • Collection: users" -ForegroundColor White
Write-Host "   • Document ID: $USER_UID" -ForegroundColor Green
Write-Host "   • Copy fields from: $tempDir\user.json" -ForegroundColor White
Write-Host ""

Write-Host "══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  FIELD TYPES (Important!)" -ForegroundColor Yellow
Write-Host "══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "When adding fields in Firebase Console, use these types:" -ForegroundColor White
Write-Host ""
Write-Host "✅ Boolean fields:" -ForegroundColor Yellow
Write-Host "   • subscribed → boolean: true" -ForegroundColor White
Write-Host "   • aiProEnabled → boolean: true" -ForegroundColor White
Write-Host "   • isPublished → boolean: true" -ForegroundColor White
Write-Host ""
Write-Host "✅ String fields:" -ForegroundColor Yellow
Write-Host "   • All text fields (clinicName, email, role, etc.)" -ForegroundColor White
Write-Host ""
Write-Host "✅ Number fields:" -ForegroundColor Yellow
Write-Host "   • averageRating → number: 5.0" -ForegroundColor White
Write-Host "   • totalReviews → number: 100" -ForegroundColor White
Write-Host "   • geo.lat → number: 25.2048" -ForegroundColor White
Write-Host "   • geo.lng → number: 55.2708" -ForegroundColor White
Write-Host ""
Write-Host "✅ Map fields (nested objects):" -ForegroundColor Yellow
Write-Host "   • geo → map {lat: 25.2048, lng: 55.2708}" -ForegroundColor White
Write-Host ""

Write-Host "══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

Write-Host "Opening document templates..." -ForegroundColor Green
Start-Process "notepad.exe" "$tempDir\clinic.json"
Start-Sleep -Seconds 1
Start-Process "notepad.exe" "$tempDir\member.json"
Start-Sleep -Seconds 1
Start-Process "notepad.exe" "$tempDir\public_clinic.json"
Start-Sleep -Seconds 1
Start-Process "notepad.exe" "$tempDir\user.json"

Write-Host ""
Write-Host "✅ Documents opened in Notepad" -ForegroundColor Green
Write-Host ""
Write-Host "After creating all documents in Firebase Console:" -ForegroundColor Yellow
Write-Host ""
Write-Host "📱 LOGIN TO THE APP:" -ForegroundColor Cyan
Write-Host "   1. Open the dental app" -ForegroundColor White
Write-Host "   2. Tap 'Clinic Login'" -ForegroundColor White
Write-Host "   3. Email: $EMAIL" -ForegroundColor Green
Write-Host "   4. Password: $PASSWORD" -ForegroundColor Green
Write-Host "   5. ✅ Full access to all screens!" -ForegroundColor White
Write-Host ""
Write-Host "══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
