# 🔄 SUBSCRIPTION RESET GUIDE

## Quick Manual Reset (Recommended)

### Step 1: Clear AsyncStorage in App

Add this temporary button to your app (e.g., in Settings or Debug menu):

```tsx
import AsyncStorage from '@react-native-async-storage/async-storage';

// Add this button temporarily
<TouchableOpacity 
  onPress={async () => {
    await AsyncStorage.multiRemove([
      'pendingSubscriptionPlan',
      'pendingSubscriptionPlanName',
      'pendingSubscriptionPrice',
      'pendingSubscriptionPriceWithAIPro',
      'pendingIncludeAIPro',
      'pendingClinicName',
      'pendingClinicPhone',
      'pendingSubscriptionEmail',
      'pendingPaymentMethod',
    ]);
    Alert.alert('Reset', 'Subscription state cleared!');
  }}
>
  <Text>Reset Subscription (Debug)</Text>
</TouchableOpacity>
```

### Step 2: Reset Firestore (Firebase Console)

1. Open [Firebase Console](https://console.firebase.google.com/)
2. Navigate to: **Firestore Database** → **clinics** collection
3. Find your test clinic document
4. Update these fields:
   - `subscribed`: `false`
   - `subscriptionPlan`: delete or set to `null`
   - `includeAIPro`: `false`
   - `paymentMethod`: delete or set to `null`
   - `status`: `"trial"`

### Step 3: Restart App

Close and restart the app completely. You should now see the fresh subscription flow.

---

## Alternative: Use Expo Dev Client

In Expo Go or Dev Client, you can shake the device and select:
- **Debug** → **Clear AsyncStorage**
- Then manually reset Firestore as above

---

## Verification

After reset, the app should:
1. Show subscription plans on `/clinic/subscribe`
2. Not show active subscription status
3. Allow you to select plan → signup → payment fresh

---

**Tip**: For non-card methods (PayPal, Apple Pay), the app currently shows placeholder dialogs. These can be enhanced with actual SDK integrations later.
