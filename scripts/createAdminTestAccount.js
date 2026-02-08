/**
 * Admin Test Account Setup Script
 * 
 * Creates a fully-configured admin account with:
 * - Firebase Auth user
 * - Firestore user document
 * - Firestore clinic document (subscribed = true)
 * - Clinic member document (OWNER_ADMIN role)
 * - Public clinic document
 * - Bypasses all paywalls and subscription requirements
 * 
 * Email: jawadfarran9@gmail.com
 * Password: jawadfarran9
 * 
 * Usage: node scripts/createAdminTestAccount.js
 */

const admin = require('firebase-admin');
const readline = require('readline');

// Initialize Firebase Admin SDK
// Note: You'll need to download your service account key from Firebase Console
// Project Settings > Service Accounts > Generate New Private Key
const serviceAccount = require('./firebase-admin-key.json'); // You'll need to add this file

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'dental-jawad'
});

const auth = admin.auth();
const db = admin.firestore();

// Configuration
const ADMIN_CONFIG = {
  email: 'jawadfarran9@gmail.com',
  password: 'jawadfarran9',
  displayName: 'Admin Test Account',
  clinic: {
    clinicName: 'Admin Test Clinic',
    clinicCode: 'ADMIN001',
    subscribed: true, // ✅ Bypass paywall
    tier: 'pro', // Full features
    aiProEnabled: true, // AI Pro access
  }
};

async function createAdminAccount() {
  console.log('\n🚀 Starting Admin Test Account Creation...\n');

  try {
    let userId;
    let clinicId;
    let memberId;

    // Step 1: Check if user already exists
    console.log('📧 Step 1: Checking if user exists...');
    try {
      const existingUser = await auth.getUserByEmail(ADMIN_CONFIG.email);
      console.log(`✅ User already exists: ${existingUser.uid}`);
      userId = existingUser.uid;
      
      // Update password
      await auth.updateUser(userId, { password: ADMIN_CONFIG.password });
      console.log('🔑 Password updated');
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        // Create new user
        const userRecord = await auth.createUser({
          email: ADMIN_CONFIG.email,
          password: ADMIN_CONFIG.password,
          displayName: ADMIN_CONFIG.displayName,
          emailVerified: true, // Skip email verification
        });
        userId = userRecord.uid;
        console.log(`✅ Created new user: ${userId}`);
      } else {
        throw error;
      }
    }

    // Step 2: Create/Update Clinic Document
    console.log('\n🏥 Step 2: Creating clinic document...');
    clinicId = `clinic_${userId}_admin`;
    
    const clinicData = {
      clinicId: clinicId,
      ownerId: userId,
      clinicName: ADMIN_CONFIG.clinic.clinicName,
      clinicCode: ADMIN_CONFIG.clinic.clinicCode,
      
      // ✅ SUBSCRIPTION BYPASS - Set to true
      subscribed: true,
      subscriptionPlan: 'PRO_AI',
      subscriptionStatus: 'active',
      subscriptionStartDate: admin.firestore.FieldValue.serverTimestamp(),
      
      // ✅ AI PRO ACCESS
      aiProEnabled: true,
      
      // Full clinic details
      phone: '+971501234567',
      email: ADMIN_CONFIG.email,
      address: 'Admin Test Location',
      country: 'AE',
      city: 'Dubai',
      
      // Branding
      heroImageUrl: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=1200',
      logoUrl: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=400',
      
      // Metadata
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      
      // Settings
      workingHours: {
        sunday: { open: '09:00', close: '17:00', isClosed: false },
        monday: { open: '09:00', close: '17:00', isClosed: false },
        tuesday: { open: '09:00', close: '17:00', isClosed: false },
        wednesday: { open: '09:00', close: '17:00', isClosed: false },
        thursday: { open: '09:00', close: '17:00', isClosed: false },
        friday: { open: '09:00', close: '17:00', isClosed: true },
        saturday: { open: '09:00', close: '17:00', isClosed: true },
      },
      
      // Analytics
      totalPatients: 0,
      totalSessions: 0,
    };

    await db.collection('clinics').doc(clinicId).set(clinicData, { merge: true });
    console.log(`✅ Clinic document created/updated: ${clinicId}`);

    // Step 3: Create Clinic Member (OWNER_ADMIN role)
    console.log('\n👤 Step 3: Creating clinic member document...');
    memberId = `member_${userId}_${clinicId}`;
    
    const memberData = {
      memberId: memberId,
      clinicId: clinicId,
      userId: userId,
      email: ADMIN_CONFIG.email,
      displayName: ADMIN_CONFIG.displayName,
      
      // ✅ OWNER_ADMIN role - Full access
      role: 'OWNER_ADMIN',
      status: 'ACTIVE',
      
      // Permissions
      permissions: {
        canManageTeam: true,
        canManageSettings: true,
        canViewReports: true,
        canManagePatients: true,
        canManageSessions: true,
        canManageFinances: true,
      },
      
      // Metadata
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      lastLogin: admin.firestore.FieldValue.serverTimestamp(),
      invitedBy: userId,
      invitedAt: admin.firestore.FieldValue.serverTimestamp(),
      joinedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await db.collection('clinic_members').doc(memberId).set(memberData, { merge: true });
    console.log(`✅ Member document created: ${memberId}`);

    // Step 4: Create Public Clinic (for Clinics tab)
    console.log('\n🌍 Step 4: Creating public clinic document...');
    
    const publicClinicData = {
      clinicId: clinicId,
      ownerId: userId,
      name: ADMIN_CONFIG.clinic.clinicName,
      
      // ✅ PUBLISHED - Visible in public directory
      isPublished: true,
      tier: 'pro',
      
      // Contact info
      phone: '+971501234567',
      whatsapp: '+971501234567',
      email: ADMIN_CONFIG.email,
      address: 'Admin Test Location, Dubai, UAE',
      
      // Location
      geo: {
        lat: 25.2048,
        lng: 55.2708,
      },
      geohash: 'thrwmzx',
      
      // Branding
      heroImage: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=1200',
      
      // Ratings
      averageRating: 5.0,
      totalReviews: 100,
      
      // Specialty
      specialty: 'general',
      
      // Metadata
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await db.collection('clinics_public').doc(clinicId).set(publicClinicData, { merge: true });
    console.log(`✅ Public clinic created: ${clinicId}`);

    // Step 5: Create User Profile Document
    console.log('\n📝 Step 5: Creating user profile document...');
    
    const userProfileData = {
      userId: userId,
      email: ADMIN_CONFIG.email,
      displayName: ADMIN_CONFIG.displayName,
      role: 'clinic', // Clinic owner role
      
      // Linked clinic
      clinicId: clinicId,
      memberId: memberId,
      
      // Metadata
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      lastLogin: admin.firestore.FieldValue.serverTimestamp(),
    };

    await db.collection('users').doc(userId).set(userProfileData, { merge: true });
    console.log(`✅ User profile created: ${userId}`);

    // Success Summary
    console.log('\n' + '═'.repeat(60));
    console.log('✅ ADMIN TEST ACCOUNT CREATED SUCCESSFULLY!');
    console.log('═'.repeat(60));
    console.log('\n📋 Account Details:');
    console.log('   Email:      ', ADMIN_CONFIG.email);
    console.log('   Password:   ', ADMIN_CONFIG.password);
    console.log('   User ID:    ', userId);
    console.log('   Clinic ID:  ', clinicId);
    console.log('   Member ID:  ', memberId);
    console.log('\n🔐 Access Level:');
    console.log('   Role:       OWNER_ADMIN (Full Access)');
    console.log('   Subscription: ACTIVE (Paywall Bypassed ✅)');
    console.log('   AI Pro:     ENABLED ✅');
    console.log('   Tier:       PRO ✅');
    console.log('\n📱 Ready to use:');
    console.log('   1. Open the app');
    console.log('   2. Tap "Clinic Login"');
    console.log('   3. Enter credentials above');
    console.log('   4. Access all screens without restrictions');
    console.log('\n' + '═'.repeat(60));
    console.log('🎉 You can now test all features!\n');

  } catch (error) {
    console.error('\n❌ Error creating admin account:', error);
    process.exit(1);
  }
}

// Run the script
createAdminAccount()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
