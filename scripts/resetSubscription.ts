/**
 * SUBSCRIPTION RESET UTILITY
 * 
 * Use this to completely reset subscription state for testing.
 * 
 * Usage:
 * 1. Update CLINIC_ID with your test clinic ID
 * 2. Run: npx ts-node scripts/resetSubscription.ts
 * 3. Restart the app to test fresh subscription flow
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApp } from 'firebase/app';
import { doc, getFirestore, updateDoc } from 'firebase/firestore';

// Firebase config (copy from your firebaseConfig.ts)
const firebaseConfig = {
  // Add your config here or import from firebaseConfig
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// CHANGE THIS to your test clinic ID
const CLINIC_ID = 'your-clinic-id-here';

async function resetSubscription() {
  try {
    console.log('🔄 Resetting subscription state...\n');
    
    // 1. Clear AsyncStorage subscription keys
    console.log('📱 Clearing AsyncStorage...');
    const keysToRemove = [
      'pendingSubscriptionPlan',
      'pendingSubscriptionPlanName',
      'pendingSubscriptionPrice',
      'pendingSubscriptionPriceWithAIPro',
      'pendingIncludeAIPro',
      'pendingClinicName',
      'pendingClinicPhone',
      'pendingSubscriptionEmail',
      'pendingPaymentMethod',
    ];
    
    await AsyncStorage.multiRemove(keysToRemove);
    console.log('✅ AsyncStorage cleared\n');
    
    // 2. Reset Firestore clinic subscription fields
    if (CLINIC_ID && CLINIC_ID !== 'your-clinic-id-here') {
      console.log(`🔥 Resetting Firestore clinic: ${CLINIC_ID}...`);
      const clinicRef = doc(db, 'clinics', CLINIC_ID);
      
      await updateDoc(clinicRef, {
        subscribed: false,
        subscriptionPlan: null,
        subscriptionPrice: null,
        subscriptionPriceWithAIPro: null,
        includeAIPro: false,
        paymentMethod: null,
        subscriptionUpdatedAt: null,
        subscribedAt: null,
        status: 'trial', // or 'pending'
      });
      
      console.log('✅ Firestore clinic reset\n');
    } else {
      console.log('⚠️  Skipping Firestore reset - update CLINIC_ID first\n');
    }
    
    console.log('✨ Subscription reset complete!');
    console.log('📲 Restart the app to test fresh subscription flow.\n');
    
  } catch (error) {
    console.error('❌ Error resetting subscription:', error);
  }
}

// Run if called directly
if (require.main === module) {
  resetSubscription();
}

export { resetSubscription };
