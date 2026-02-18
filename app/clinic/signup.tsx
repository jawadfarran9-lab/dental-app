import { db } from '@/firebaseConfig';
import { useTheme } from '@/src/context/ThemeContext';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { addDoc, collection, doc, setDoc } from 'firebase/firestore';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, Animated, BackHandler, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import PremiumGradientBackground from '@/src/components/PremiumGradientBackground';
import CountrySelect from '../components/CountrySelect';

// ── Unified accent color ──
const ACCENT = '#3D9EFF';

/**
 * CLINIC SIGNUP - FIRESTORE ONLY (No Firebase Auth)
 * 
 * Saves clinic data directly to Firestore:
 * - No Firebase Auth user creation
 * - Password stored in Firestore (hashed in production)
 * - Login will query Firestore by email/password
 * 
 * PHASE F: Prevents patients from accessing this page
 */

// Clinic type options for selection
type ClinicType = 'dental' | 'beauty' | 'laser' | '';

export default function ClinicSignup() {
  const [clinicType, setClinicType] = useState<ClinicType>('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [clinicName, setClinicName] = useState('');
  const [clinicPhone, setClinicPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState('');
  const [countryError, setCountryError] = useState('');
  const [city, setCity] = useState('');
  const [planLabel, setPlanLabel] = useState('Monthly');
  const [planPrice, setPlanPrice] = useState('19.99');
  const [basePlanPrice, setBasePlanPrice] = useState('19.99');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [couponMessage, setCouponMessage] = useState('');
  const [couponError, setCouponError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'card' | 'apple-pay' | 'paypal' | 'google-pay' | null>(null);
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [cardNameError, setCardNameError] = useState('');
  const [cardNumberError, setCardNumberError] = useState('');
  const [cardExpiryError, setCardExpiryError] = useState('');
  const [cardCvcError, setCardCvcError] = useState('');
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const router = useRouter();
  const params = useLocalSearchParams<{
    plan?: string;
    billing?: string;
    pickedLat?: string;
    pickedLng?: string;
    pickedAddress?: string;
  }>();
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();

  // ── Location picker state ──
  const [clinicLocation, setClinicLocation] = useState<{
    lat: number;
    lng: number;
    address: string;
  } | null>(null);
  const locationConsumed = useRef(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);

  // ── Phase 3: Entrance animation ──
  const entranceScale = useRef(new Animated.Value(0.97)).current;
  const entranceFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entrance scale 0.97 → 1 + fade in
    Animated.parallel([
      Animated.spring(entranceScale, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(entranceFade, {
        toValue: 1,
        duration: 450,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Payment section uses conditional rendering only — no animated layout transitions.

  // ── Phase 3: Premium input focus style helper (visual only) ──
  // Uses onFocus/onBlur only — no onChangeText dependency.
  const getInputFocusStyle = (fieldName: string) => {
    if (focusedField !== fieldName) return {};
    return {
      borderColor: ACCENT,
      borderWidth: 2,
      shadowColor: ACCENT,
      shadowOffset: { width: 0, height: 0 } as const,
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 4,
    };
  };

  // NOTE: Do NOT use useClinicGuard here - signup must be accessible from Subscribe page
  // Guard is only enforced at login level to prevent patient access post-auth

  /**
   * Disable hardware back button during signup to prevent returning to subscribe flow.
   */
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        if (loading) {
          // Prevent back press while loading
          return true;
        }
        // Allow back press if not loading
        return false;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [loading])
  );

  // ── Pick up returned location params ──
  useFocusEffect(
    React.useCallback(() => {
      if (
        params.pickedLat &&
        params.pickedLng &&
        params.pickedAddress &&
        !locationConsumed.current
      ) {
        const lat = parseFloat(params.pickedLat);
        const lng = parseFloat(params.pickedLng);
        if (!isNaN(lat) && !isNaN(lng)) {
          setClinicLocation({ lat, lng, address: params.pickedAddress });
          locationConsumed.current = true;
        }
      }
      return () => {
        // Reset guard so future returns are captured
        locationConsumed.current = false;
      };
    }, [params.pickedLat, params.pickedLng, params.pickedAddress])
  );

  // Clear sensitive inputs when navigating back
  // Also reset country error to allow clean signup attempts
  useFocusEffect(
    React.useCallback(() => {
      setCountryError(''); // Reset country error on focus
      return () => {
        setFirstName('');
        setLastName('');
        setClinicName('');
        setClinicPhone('');
        setEmail('');
        setPassword('');
        setPhone('');
        setCountry('');
        setCountryError('');
        setCity('');
        setShowPassword(false);
      };
    }, [])
  );

  // Load selected plan summary for CTA pricing
  useFocusEffect(
    useCallback(() => {
      const loadPlan = async () => {
        try {
          const results = await AsyncStorage.multiGet([
            'pendingSubscriptionPlan',
            'pendingSubscriptionPlanName',
            'pendingSubscriptionPrice',
            'pendingSubscriptionPriceWithAIPro',
          ]);
          
          console.log('[SIGNUP] Raw AsyncStorage results:', results);
          
          // Extract values from [[key, value], ...] format
          const planId = results[0]?.[1];
          const planName = results[1]?.[1];
          const basePrice = results[2]?.[1];
          const priceWithAIPro = results[3]?.[1];
          
          console.log('[SIGNUP] Extracted values:', {
            planId: `"${planId}"`,
            planName: `"${planName}"`,
            basePrice: `"${basePrice}"`,
            priceWithAIPro: `"${priceWithAIPro}"`,
          });
          
          // Choose the price: AI Pro price if available and non-null, else base price
          let finalPrice = priceWithAIPro ?? basePrice;
          
          // If still no price from AsyncStorage, use the derived price
          if (!finalPrice || finalPrice === 'null') {
            const derivedPrice = planId === 'ANNUAL' ? '230.88' : '19.99';
            console.log('[SIGNUP] No price in AsyncStorage, using derived:', derivedPrice);
            finalPrice = derivedPrice;
          }
          
          const finalName = planName || (planId === 'ANNUAL' ? 'Annual' : 'Monthly');
          
          console.log('[SIGNUP] Setting UI state:', { name: finalName, price: finalPrice });
          setPlanLabel(finalName);
          setPlanPrice(finalPrice);
          setBasePlanPrice(finalPrice);  // Store base price for coupon calculations
          setCouponMessage('');  // Clear coupon message on plan change
          setCouponError('');
          setAppliedCoupon(null);
          setCouponCode('');
        } catch (error) {
          console.error('[SIGNUP] Error loading plan:', error);
          setPlanLabel('Monthly');
          setPlanPrice('19.99');
          setBasePlanPrice('19.99');
        }
      };
      loadPlan();
    }, [])
  );

  const isCardValid = (): boolean => {
    // TEMP: Skip card validation if subscription is free (100% discount)
    const isFreeSubscription = parseFloat(planPrice) === 0;
    if (isFreeSubscription) {
      console.log('[CARD VALIDATION] Free subscription - skipping card validation');
      return true;
    }
    
    if (selectedPaymentMethod !== 'card') return true; // Card validation only needed if card selected
    const num = cardNumber.replace(/\s+/g, '');
    const numOk = /^\d{15,19}$/.test(num);
    const expOk = /^(0[1-9]|1[0-2])\/(\d{2}|\d{4})$/.test(cardExpiry);
    const cvcOk = /^\d{3,4}$/.test(cardCvc);
    const nameOk = cardName.trim().length >= 2;
    return numOk && expOk && cvcOk && nameOk;
  };

  // Real-time card field validators
  const validateCardName = (value: string) => {
    setCardName(value);
    if (selectedPaymentMethod !== 'card') return;
    if (value.trim().length === 0) {
      setCardNameError('');
    } else if (value.trim().length < 2) {
      setCardNameError('Card name must be at least 2 characters');
    } else {
      setCardNameError('');
    }
  };

  const validateCardNumber = (value: string) => {
    setCardNumber(value);
    if (selectedPaymentMethod !== 'card') return;
    const num = value.replace(/\s+/g, '');
    if (num.length === 0) {
      setCardNumberError('');
    } else if (num.length < 15) {
      setCardNumberError('Card number must be at least 15 digits');
    } else if (!/^\d+$/.test(num)) {
      setCardNumberError('Card number must contain only digits');
    } else {
      setCardNumberError('');
    }
  };

  const validateCardExpiry = (value: string) => {
    setCardExpiry(value);
    if (selectedPaymentMethod !== 'card') return;
    if (value.length === 0) {
      setCardExpiryError('');
    } else if (!/^(0[1-9]|1[0-2])\/(\d{2}|\d{4})$/.test(value)) {
      setCardExpiryError('Invalid expiry format. Use MM/YY');
    } else {
      setCardExpiryError('');
    }
  };

  const validateCardCvc = (value: string) => {
    setCardCvc(value);
    if (selectedPaymentMethod !== 'card') return;
    if (value.length === 0) {
      setCardCvcError('');
    } else if (!/^\d{3,4}$/.test(value)) {
      setCardCvcError('CVC must be 3 or 4 digits');
    } else {
      setCardCvcError('');
    }
  };

  const applyCoupon = () => {
    const code = couponCode.trim().toUpperCase();
    
    if (!code) {
      setCouponError('Please enter a coupon code');
      setCouponMessage('');
      return;
    }

    let newPrice = basePlanPrice;
    let isValid = false;
    let discountPercent = 0;

    // Check coupon codes - 100% discount coupons work for ANY plan (Monthly or Yearly)
    if (code === 'FREE1YEAR' || code === 'FREEYEAR' || code === 'LIFETIME100') {
      // 100% discount - works for ANY plan
      newPrice = '0';
      discountPercent = 100;
      isValid = true;
      console.log('[COUPON] 100% discount coupon applied to:', planLabel, 'Original price:', basePlanPrice);
    } else if (code === 'DEMO50') {
      // 50% discount
      const basePrice = parseFloat(basePlanPrice);
      const discountedPrice = (basePrice * 0.5).toFixed(2);
      newPrice = discountedPrice;
      discountPercent = 50;
      isValid = true;
    }

    if (isValid) {
      setAppliedCoupon(code);
      setPlanPrice(newPrice);
      // ✅ IMPORTANT: Do NOT change planLabel - keep original plan name (Monthly/Annual)
      // The plan name should stay the same, only the price changes
      setCouponMessage(`✓ Coupon Applied Successfully! (${discountPercent}% off)`);
      setCouponError('');
      console.log('[COUPON] Applied:', { code, newPrice, originalPlan: planLabel, discountPercent });
    } else {
      setCouponError('Invalid Coupon Code');
      setCouponMessage('');
      setAppliedCoupon(null);
      setPlanPrice(basePlanPrice);
      console.log('[COUPON] Invalid code:', code);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setPlanPrice(basePlanPrice);
    // ✅ Don't modify planLabel - it should stay as the original plan name
    setCouponCode('');
    setCouponMessage('');
    setCouponError('');
    console.log('[COUPON] Removed - price restored to:', basePlanPrice);
  };


  const isFormValid = () => {
    // Clinic type MUST be selected
    if (!clinicType) {
      return false;
    }
    
    const emailOk = email && email.includes('@') && email.includes('.');
    const passwordOk = password && password.length >= 6;
    const isFreeSubscription = parseFloat(planPrice) === 0;
    
    // Core fields: firstName, lastName, email, password - ALWAYS required
    const coreFieldsOk = firstName && lastName && emailOk && passwordOk;
    
    // Location is always required
    const locationOk = !!clinicLocation?.lat && !!clinicLocation?.lng && !!clinicLocation?.address;

    // For FREE subscriptions: Only core fields + location required (NO payment method needed)
    if (isFreeSubscription) {
      const isValid = Boolean(coreFieldsOk && locationOk && !loading);
      console.log('[FORM VALIDATION] Free subscription', {
        clinicType,
        coreFieldsOk,
        locationOk,
        isValid,
        firstName: !!firstName,
        lastName: !!lastName,
      });
      return isValid;
    }
    
    // For PAID subscriptions: Core fields + payment method + card details (if card selected)
    const paymentMethodSelected = selectedPaymentMethod !== null;
    
    let paymentOk = false;
    if (selectedPaymentMethod === 'card') {
      // Card payment: Must have valid card details
      const cardNameOk = cardName.trim().length >= 2;
      const cardNumberOk = cardNumber.replace(/\s+/g, '').length >= 15;
      const cardExpiryOk = /^(0[1-9]|1[0-2])\/(\d{2}|\d{4})$/.test(cardExpiry);
      const cardCvcOk = /^\d{3,4}$/.test(cardCvc);
      paymentOk = cardNameOk && cardNumberOk && cardExpiryOk && cardCvcOk;
      
      console.log('[FORM VALIDATION] Paid with card', {
        cardNameOk,
        cardNumberOk,
        cardExpiryOk,
        cardCvcOk,
        paymentOk,
      });
    } else if (paymentMethodSelected) {
      // Other payment methods (Apple Pay, PayPal, Google Pay): Just need method selected
      paymentOk = true;
      console.log('[FORM VALIDATION] Paid with', selectedPaymentMethod);
    }
    
    const isValid = Boolean(coreFieldsOk && locationOk && paymentMethodSelected && paymentOk && !loading);
    
    console.log('[FORM VALIDATION] Paid subscription final', {
      coreFieldsOk,
      locationOk,
      paymentMethodSelected,
      paymentOk,
      isValid,
    });
    
    return isValid;
  };

  const onSignup = async () => {
    setSubmitAttempted(true);

    // Validation: Clinic type is REQUIRED
    if (!clinicType) {
      return Alert.alert(
        t('clinic.validation', 'Validation'),
        t('clinic.selectClinicType', 'Please select a clinic type to continue')
      );
    }
    
    // Validation: Email is REQUIRED and must be valid
    if (!email || !email.trim()) {
      return Alert.alert(t('common.validation'), t('common.required'));
    }
    
    if (!email.includes('@') || !email.includes('.')) {
      return Alert.alert(t('common.validation'), t('common.required'));
    }
    
    if (!password || !firstName || !lastName) {
      return Alert.alert(t('common.validation'), t('common.required'));
    }

    // Check if subscription is free
    const isFree = parseFloat(planPrice) === 0;
    
    // Payment method required only for paid subscriptions
    if (!isFree && !selectedPaymentMethod) {
      return Alert.alert(t('payment.selectMethod', 'Payment Required'), t('payment.selectPaymentMethod', 'Please select a payment method.'));
    }

    // Card validation required only for paid card subscriptions
    if (!isFree && selectedPaymentMethod === 'card' && !isCardValid()) {
      return Alert.alert(t('payment.invalidCard', 'Invalid Card'), t('payment.checkCardDetails', 'Please enter valid card details.'));
    }

    // Location is required
    if (!clinicLocation?.lat || !clinicLocation?.lng) {
      return Alert.alert(
        'Location Required',
        'Please select your clinic location before continuing.'
      );
    }

    setLoading(true);
    try {
      console.log('[SIGNUP] Starting clinic account setup with payment...');
      
      // Get or create clinic ID
      let existingClinicId = await AsyncStorage.getItem('clinicId');
      
      if (!existingClinicId) {
        // Create new clinic document if doesn't exist
        console.log('[SIGNUP] No clinic ID found, creating new clinic document...');
        const newClinicRef = await addDoc(collection(db, 'clinics'), {
          subscribed: false,
          createdAt: Date.now(),
          status: 'pending_subscription',
        });
        existingClinicId = newClinicRef.id;
        await AsyncStorage.setItem('clinicId', existingClinicId);
        console.log('[SIGNUP] Created new clinic document:', existingClinicId);
      }

      // Persist clinic + contact info + payment method and card details for confirmation
      const storageData: [string, string][] = [
        ['pendingClinicName', clinicName.trim() || 'Clinic'],
        ['pendingClinicPhone', clinicPhone.trim() || ''],
        ['pendingSubscriptionEmail', email.toLowerCase().trim()],
        ['pendingPaymentMethod', selectedPaymentMethod || 'card'],
        ['pendingAppliedCoupon', appliedCoupon || ''],
        ['pendingFinalPrice', planPrice],
        ['pendingSubscriptionPriceWithAIPro', planPrice],
        // ✅ Ensure plan name and base price are preserved for confirmation page
        ['pendingSubscriptionPlanName', planLabel],
        ['pendingSubscriptionPrice', basePlanPrice],  // Original base price before any discount
        // ✅ Additional fields for detailed confirmation page
        ['pendingFirstName', firstName.trim() || ''],
        ['pendingLastName', lastName.trim() || ''],
        ['pendingCountry', country || ''],
        ['pendingCity', city || ''],
        ['pendingPhone', phone.trim() || ''],  // ✅ Personal/Account phone
        ['pendingClinicType', clinicType || ''],  // ✅ Clinic type (dental/beauty/laser)
      ];

      // For free subscriptions, enable AI Pro by default
      if (isFree) {
        storageData.push(['pendingIncludeAIPro', 'true']);
        console.log('[SIGNUP] Free subscription - AI Pro enabled by default');
      }
      
      if (selectedPaymentMethod === 'card') {
        storageData.push(
          ['pendingCardName', cardName],
          ['pendingCardNumber', cardNumber],
          ['pendingCardExpiry', cardExpiry]
        );
      }
      
      await AsyncStorage.multiSet(storageData);

      console.log('[SIGNUP] ====== SAVED TO ASYNC STORAGE ======');
      console.log('[SIGNUP] Pricing data saved:', {
        pendingFinalPrice: planPrice,
        pendingSubscriptionPrice: basePlanPrice,
        pendingAppliedCoupon: appliedCoupon,
        pendingSubscriptionPlanName: planLabel,
        isFreeSubscription: parseFloat(planPrice) === 0,
      });
      console.log('[SIGNUP] =====================================');

      console.log(`[SIGNUP] Updating clinic ${existingClinicId} with account credentials...`);

      // Update existing clinic document with account credentials (use merge to avoid "No document" error)
      await setDoc(doc(db, 'clinics', existingClinicId), {
        firstName,
        lastName,
        clinicName: clinicName.trim() || null,
        clinicPhone: clinicPhone.trim() || null,
        clinicType: clinicType, // ✅ Save clinic type to Firestore
        email: email.toLowerCase().trim(),
        password, // In production, hash this password
        phone: phone || null,
        countryCode: country || null,
        city: city || null,
        location: {
          lat: clinicLocation?.lat ?? null,
          lng: clinicLocation?.lng ?? null,
          address: clinicLocation?.address ?? null,
        },
        accountCreatedAt: Date.now(),
        status: 'active', // Mark as fully active
      }, { merge: true });

      console.log(`[SIGNUP] Account setup complete for clinic: ${existingClinicId}`);

      // ✅ CRITICAL: Verify clinicId is saved before navigating
      const verifyClinicId = await AsyncStorage.getItem('clinicId');
      console.log('[SIGNUP] ====== CLINIC ID VERIFICATION ======');
      console.log('[SIGNUP] existingClinicId variable:', existingClinicId);
      console.log('[SIGNUP] clinicId in AsyncStorage:', verifyClinicId);
      if (verifyClinicId !== existingClinicId) {
        console.error('[SIGNUP] WARNING: clinicId mismatch!');
      }
      console.log('[SIGNUP] =====================================');

      // Check if subscription is free (100% coupon applied)
      
      if (isFree) {
        // Free subscription - skip payment, mark as subscribed immediately
        console.log('[SIGNUP] Free subscription detected, clinicId:', existingClinicId);
        console.log('[SIGNUP] Navigating to confirmation page...');
        setLoading(false);
        
        // Navigate to confirmation page (instead of dashboard)
        router.push('/clinic/confirm-subscription' as any);
      } else {
        // Paid subscription - process payment
        await processPayment();
      }
    } catch (err: any) {
      console.error('clinic signup error', err);
      setLoading(false);
      
      let errorMsg = t('auth.signupError');
      if (err.message) {
        errorMsg = err.message;
      }
      Alert.alert(t('common.error'), errorMsg);
    }
  };

  const processPayment = async () => {
    // TEMP: Bypass payment processing for free subscriptions ($0 price)
    const pendingFinalPrice = parseFloat(planPrice);
    if (pendingFinalPrice === 0) {
      console.log('[PAYMENT] Final price is $0 - bypassing payment processing');
      await completePaymentAndLogin();
      return;
    }
    
    if (!selectedPaymentMethod) {
      console.log('[PAYMENT] No payment method selected, likely a free subscription');
      return;
    }
    
    try {
      switch (selectedPaymentMethod) {
        case 'apple-pay':
          await simulateApplePayFlow();
          break;
        case 'paypal':
          await simulatePayPalFlow();
          break;
        case 'google-pay':
          await simulateGooglePayFlow();
          break;
        case 'card':
        default:
          // Process card payment directly
          await completePaymentAndLogin();
          return;
      }
    } catch (err) {
      console.error('[PAYMENT ERROR]:', err);
      setLoading(false);
      Alert.alert(t('common.error', 'Error'), t('payment.failed', 'Payment failed. Please try again.'));
    }
  };

  const simulateApplePayFlow = async () => {
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        Alert.alert(
          t('payment.applePayTitle', 'Apple Pay'),
          t('payment.applePayMessage', 'In a real app, Apple Pay would open here for biometric authentication.'),
          [
            {
              text: t('common.cancel', 'Cancel'),
              onPress: () => {
                setLoading(false);
                resolve();
              },
            },
            {
              text: t('payment.complete', 'Complete Payment'),
              onPress: async () => {
                await completePaymentAndLogin();
                resolve();
              },
              style: 'default',
            },
          ]
        );
      }, 500);
    });
  };

  const simulatePayPalFlow = async () => {
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        Alert.alert(
          t('payment.paypalTitle', 'PayPal'),
          t('payment.paypalMessage', 'In a real app, you would be redirected to PayPal for secure authentication.'),
          [
            {
              text: t('common.cancel', 'Cancel'),
              onPress: () => {
                setLoading(false);
                resolve();
              },
            },
            {
              text: t('payment.complete', 'Complete Payment'),
              onPress: async () => {
                await completePaymentAndLogin();
                resolve();
              },
              style: 'default',
            },
          ]
        );
      }, 500);
    });
  };

  const simulateGooglePayFlow = async () => {
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        Alert.alert(
          t('payment.googlePayTitle', 'Google Pay'),
          t('payment.googlePayMessage', 'In a real app, Google Pay would open for payment confirmation.'),
          [
            {
              text: t('common.cancel', 'Cancel'),
              onPress: () => {
                setLoading(false);
                resolve();
              },
            },
            {
              text: t('payment.complete', 'Complete Payment'),
              onPress: async () => {
                await completePaymentAndLogin();
                resolve();
              },
              style: 'default',
            },
          ]
        );
      }, 500);
    });
  };

  const completePaymentAndLogin = async () => {
    setLoading(false);
    
    try {
      console.log('[SIGNUP] completePaymentAndLogin called');
      setLoading(false);
    } catch (err: any) {
      console.error('[SIGNUP] Error in completePaymentAndLogin:', err);
      console.error('[SIGNUP] Error details:', err?.message);
      setLoading(false);
    }
    
    // Navigate to confirmation page
    console.log('[SIGNUP] Payment completed, navigating to confirmation page');
    router.push('/clinic/confirm-subscription' as any);
  };

  const goBack = () => {
    // Only allow back if not loading
    if (!loading) {
      router.back();
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: isDark ? colors.background : '#E0F2FE' }}>
      <PremiumGradientBackground isDark={isDark} showSparkles={!isDark} />
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
      >
        <ScrollView 
          contentContainerStyle={styles.container} 
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
        <Animated.View style={{ transform: [{ scale: entranceScale }], opacity: entranceFade }}>
        {/* ===== Fixed Header Container ===== */}
        <View style={styles.headerContainer}>
          {/* Back Button — absolute positioned */}
          <TouchableOpacity style={styles.backButton} onPress={goBack} disabled={loading}>
            <View style={[styles.backButtonCircle, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.85)' }]}>
              <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
            </View>
          </TouchableOpacity>

          <Text style={[styles.title, { color: colors.textPrimary }]}>BeSmile AI</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            {t('clinic.fillDataAccurately', 'Fill in your subscription details accurately.')}
          </Text>
        </View>

        {/* ===== Clinic Type Selection Section ===== */}
        <View style={styles.clinicTypeSection}>
          <Text style={[styles.clinicTypeTitle, { color: colors.textPrimary }]}>
            {t('clinic.selectClinicTypeTitle', 'Select Your Clinic Type')}
          </Text>
          
          <View style={styles.clinicTypeGrid}>
            {/* Dental Clinic */}
            <TouchableOpacity
              style={[
                styles.clinicTypeCard,
                clinicType === 'dental'
                  ? [
                      styles.clinicTypeCardSelected,
                      {
                        backgroundColor: isDark ? 'rgba(61,158,255,0.12)' : 'rgba(255,255,255,0.88)',
                        borderColor: 'rgba(61,158,255,0.85)',
                        borderWidth: 2.5,
                      },
                    ]
                  : [
                      styles.clinicTypeCardUnselected,
                      {
                        backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.5)',
                        borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                        borderWidth: 1,
                      },
                    ],
              ]}
              onPress={() => setClinicType('dental')}
              activeOpacity={0.85}
              disabled={loading}
            >
              <View style={[
                styles.clinicTypeIconContainer,
                clinicType === 'dental'
                  ? { backgroundColor: isDark ? 'rgba(61,158,255,0.2)' : 'rgba(61,158,255,0.12)' }
                  : { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)' },
              ]}>
                <Text style={styles.clinicTypeEmoji}>🦷</Text>
              </View>
              <Text style={[
                styles.clinicTypeLabel,
                { color: clinicType === 'dental' ? (isDark ? '#fff' : colors.textPrimary) : colors.textSecondary },
              ]}>
                {t('clinic.dentalClinic', 'Dental Clinic')}
              </Text>
              {clinicType === 'dental' && (
                <View style={styles.clinicTypeCheckmark}>
                  <View style={styles.clinicTypeCheckmarkBg}>
                    <Ionicons name="checkmark" size={13} color="#fff" />
                  </View>
                </View>
              )}
            </TouchableOpacity>

            {/* Beauty Clinic */}
            <TouchableOpacity
              style={[
                styles.clinicTypeCard,
                clinicType === 'beauty'
                  ? [
                      styles.clinicTypeCardSelected,
                      {
                        backgroundColor: isDark ? 'rgba(61,158,255,0.12)' : 'rgba(255,255,255,0.88)',
                        borderColor: 'rgba(61,158,255,0.85)',
                        borderWidth: 2.5,
                      },
                    ]
                  : [
                      styles.clinicTypeCardUnselected,
                      {
                        backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.5)',
                        borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                        borderWidth: 1,
                      },
                    ],
              ]}
              onPress={() => setClinicType('beauty')}
              activeOpacity={0.85}
              disabled={loading}
            >
              <View style={[
                styles.clinicTypeIconContainer,
                clinicType === 'beauty'
                  ? { backgroundColor: isDark ? 'rgba(61,158,255,0.2)' : 'rgba(61,158,255,0.12)' }
                  : { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)' },
              ]}>
                <Text style={styles.clinicTypeEmoji}>💄</Text>
              </View>
              <Text style={[
                styles.clinicTypeLabel,
                { color: clinicType === 'beauty' ? (isDark ? '#fff' : colors.textPrimary) : colors.textSecondary },
              ]}>
                {t('clinic.beautyClinic', 'Beauty Clinic')}
              </Text>
              {clinicType === 'beauty' && (
                <View style={styles.clinicTypeCheckmark}>
                  <View style={styles.clinicTypeCheckmarkBg}>
                    <Ionicons name="checkmark" size={13} color="#fff" />
                  </View>
                </View>
              )}
            </TouchableOpacity>

            {/* Laser Clinic */}
            <TouchableOpacity
              style={[
                styles.clinicTypeCard,
                clinicType === 'laser'
                  ? [
                      styles.clinicTypeCardSelected,
                      {
                        backgroundColor: isDark ? 'rgba(61,158,255,0.12)' : 'rgba(255,255,255,0.88)',
                        borderColor: 'rgba(61,158,255,0.85)',
                        borderWidth: 2.5,
                      },
                    ]
                  : [
                      styles.clinicTypeCardUnselected,
                      {
                        backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.5)',
                        borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                        borderWidth: 1,
                      },
                    ],
              ]}
              onPress={() => setClinicType('laser')}
              activeOpacity={0.85}
              disabled={loading}
            >
              <View style={[
                styles.clinicTypeIconContainer,
                clinicType === 'laser'
                  ? { backgroundColor: isDark ? 'rgba(61,158,255,0.2)' : 'rgba(61,158,255,0.12)' }
                  : { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)' },
              ]}>
                <Text style={styles.clinicTypeEmoji}>✨</Text>
              </View>
              <Text style={[
                styles.clinicTypeLabel,
                { color: clinicType === 'laser' ? (isDark ? '#fff' : colors.textPrimary) : colors.textSecondary },
              ]}>
                {t('clinic.laserClinic', 'Laser Clinic')}
              </Text>
              {clinicType === 'laser' && (
                <View style={styles.clinicTypeCheckmark}>
                  <View style={styles.clinicTypeCheckmarkBg}>
                    <Ionicons name="checkmark" size={13} color="#fff" />
                  </View>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.section, styles.glassCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.50)' }]}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            {t('auth.personalInfo', 'Personal Information')}
          </Text>
          <TextInput 
            style={[styles.input, styles.glassInput, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.9)', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)', color: colors.textPrimary }, getInputFocusStyle('firstName')]} 
            placeholder={t('auth.firstName')} 
            placeholderTextColor={colors.inputPlaceholder} 
            value={firstName} 
            onChangeText={setFirstName} 
            onFocus={() => setFocusedField('firstName')}
            onBlur={() => setFocusedField(null)}
            editable={!loading} 
          />
          <TextInput 
            style={[styles.input, styles.glassInput, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.9)', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)', color: colors.textPrimary }, getInputFocusStyle('lastName')]} 
            placeholder={t('auth.lastName')} 
            placeholderTextColor={colors.inputPlaceholder} 
            value={lastName} 
            onChangeText={setLastName} 
            onFocus={() => setFocusedField('lastName')}
            onBlur={() => setFocusedField(null)}
            editable={!loading} 
          />
        </View>

        <View style={[styles.section, styles.glassCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.048)' : 'rgba(255,255,255,0.48)' }]}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{t('auth.accountDetails')}</Text>
          <View style={styles.inputWithIcon}>
            <Ionicons name="mail-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
            <TextInput 
              style={[styles.inputIconField, styles.glassInput, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.9)', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)', color: colors.textPrimary }, getInputFocusStyle('email')]} 
              placeholder={t('auth.email')} 
              placeholderTextColor={colors.inputPlaceholder} 
              keyboardType="email-address" 
              value={email} 
              onChangeText={setEmail} 
              onFocus={() => setFocusedField('email')}
              onBlur={() => setFocusedField(null)}
              editable={!loading} 
              autoCapitalize="none" 
            />
          </View>
          
          {/* Password Field with Show/Hide Toggle */}
          <View style={[styles.passwordContainer, styles.glassInput, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.9)', borderColor: focusedField === 'password' ? ACCENT : isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }, focusedField === 'password' && { borderWidth: 2 }]}>
            <Ionicons name="lock-closed-outline" size={20} color={focusedField === 'password' ? ACCENT : colors.textSecondary} style={{ marginLeft: 12 }} />
            <TextInput 
              style={[styles.passwordInput, { color: colors.textPrimary }]} 
              placeholder={t('auth.password')} 
              placeholderTextColor={colors.inputPlaceholder}
              secureTextEntry={!showPassword}
              value={password} 
              onChangeText={setPassword} 
              onFocus={() => setFocusedField('password')}
              onBlur={() => setFocusedField(null)}
              editable={!loading} 
            />
            <TouchableOpacity 
              style={styles.passwordToggle}
              onPress={() => setShowPassword(!showPassword)}
              disabled={loading}
            >
              <Ionicons 
                name={showPassword ? 'eye-off' : 'eye'} 
                size={20} 
                color={colors.textSecondary} 
              />
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.section, styles.glassCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.7)' }]}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{t('auth.contactOptional')}</Text>
          
          <View style={styles.inputWithIcon}>
            <Ionicons name="call-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
            <TextInput 
              style={[styles.inputIconField, styles.glassInput, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.9)', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)', color: colors.textPrimary }, getInputFocusStyle('phone')]} 
              placeholder={t('auth.phone')} 
              placeholderTextColor={colors.inputPlaceholder} 
              keyboardType="phone-pad" 
              value={phone} 
              onChangeText={setPhone} 
              onFocus={() => setFocusedField('phone')}
              onBlur={() => setFocusedField(null)}
              editable={!loading} 
            />
          </View>
          
          <View style={styles.inputWithIcon}>
            <Ionicons name="business-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
            <TextInput 
              style={[styles.inputIconField, styles.glassInput, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.9)', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)', color: colors.textPrimary }, getInputFocusStyle('clinicName')]} 
              placeholder={t('auth.clinicName')} 
              placeholderTextColor={colors.inputPlaceholder} 
              value={clinicName} 
              onChangeText={setClinicName} 
              onFocus={() => setFocusedField('clinicName')}
              onBlur={() => setFocusedField(null)}
              editable={!loading} 
            />
          </View>
          
          <View style={styles.inputWithIcon}>
            <Ionicons name="call-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
            <TextInput 
              style={[styles.inputIconField, styles.glassInput, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.9)', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)', color: colors.textPrimary }, getInputFocusStyle('clinicPhone')]} 
              placeholder={t('auth.clinicPhone')} 
              placeholderTextColor={colors.inputPlaceholder} 
              keyboardType="phone-pad" 
              value={clinicPhone} 
              onChangeText={setClinicPhone} 
              onFocus={() => setFocusedField('clinicPhone')}
              onBlur={() => setFocusedField(null)}
              editable={!loading} 
            />
          </View>
          
          {/* Country Selector - Using CountrySelect Component */}
          <CountrySelect
            value={country}
            onChange={(code) => {
              setCountry(code);
              setCountryError(''); // Clear error when user selects a country
            }}
            placeholder={t('auth.selectCountry')}
            disabled={loading}
            error={countryError}
          />
          
          <View style={styles.inputWithIcon}>
            <Ionicons name="location-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
            <TextInput 
              style={[styles.inputIconField, styles.glassInput, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.9)', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)', color: colors.textPrimary }, getInputFocusStyle('city')]} 
              placeholder={t('auth.city')} 
              placeholderTextColor={colors.inputPlaceholder} 
              value={city} 
              onChangeText={setCity} 
              onFocus={() => setFocusedField('city')}
              onBlur={() => setFocusedField(null)}
              editable={!loading} 
            />
          </View>
        </View>

        {/* ── Clinic Location ── */}
        <View style={[styles.section, styles.glassCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.50)' }]}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Clinic Location</Text>

          {clinicLocation ? (
            <>
              {/* Static map preview */}
              <View style={[styles.mapPreview, { backgroundColor: isDark ? 'rgba(61,158,255,0.08)' : 'rgba(61,158,255,0.06)', borderColor: isDark ? 'rgba(61,158,255,0.18)' : 'rgba(61,158,255,0.14)' }]}>
                <View style={styles.mapPreviewPinRing}>
                  <Ionicons name="location-sharp" size={26} color={ACCENT} />
                </View>
                <Text style={[styles.mapPreviewLabel, { color: colors.textSecondary }]}>Map preview</Text>
              </View>

              {/* Address */}
              <View style={styles.locationAddressRow}>
                <Ionicons name="location" size={16} color={ACCENT} style={{ marginTop: 2 }} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.locationAddressText, { color: colors.textPrimary }]} numberOfLines={2}>
                    {clinicLocation.address}
                  </Text>
                  <Text style={[styles.locationCoordsText, { color: colors.textSecondary }]}>
                    {clinicLocation.lat.toFixed(4)}, {clinicLocation.lng.toFixed(4)}
                  </Text>
                </View>
              </View>

              {/* Change button */}
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() =>
                  router.push({
                    pathname: '/clinic/location-picker' as any,
                    params: { lat: String(clinicLocation.lat), lng: String(clinicLocation.lng) },
                  })
                }
                style={[styles.locationBtn, styles.locationBtnOutline, { borderColor: ACCENT }]}
              >
                <Ionicons name="navigate-outline" size={16} color={ACCENT} />
                <Text style={[styles.locationBtnText, { color: ACCENT }]}>Change Location</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              {/* Empty state preview */}
              <View style={[styles.mapPreviewEmpty, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.025)', borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}>
                <Ionicons name="location-outline" size={30} color={isDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.12)'} />
                <Text style={[styles.mapPreviewEmptyLabel, { color: colors.textSecondary }]}>
                  Choose clinic location on map
                </Text>
              </View>

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => router.push('/clinic/location-picker' as any)}
                style={[styles.locationBtn, { backgroundColor: ACCENT }]}
              >
                <Ionicons name="navigate-outline" size={16} color="#FFF" />
                <Text style={[styles.locationBtnText, { color: '#FFF' }]}>Choose Location</Text>
              </TouchableOpacity>

              {/* Validation hint — shown only after submit attempt */}
              {submitAttempted && !clinicLocation && (
                <Text style={[styles.validationHint, { color: '#ef4444', marginTop: 8, marginBottom: 0, marginHorizontal: 0 }]}>
                  Location is required to complete signup
                </Text>
              )}
            </>
          )}
        </View>

        {/* Payment Method Selection */}
        <View style={[styles.section, styles.glassCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.055)' : 'rgba(255,255,255,0.55)' }]}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{t('payment.chooseMethod', 'Payment Method')}</Text>
          
          {/* Show message if subscription is free */}
          {parseFloat(planPrice) === 0 && (
            <View style={styles.freeSubscriptionBanner}>
              <Ionicons name="checkmark-circle" size={20} color="#10b981" />
              <Text style={styles.freeSubscriptionText}>
                ✓ Payment not required - 100% discount applied!
              </Text>
            </View>
          )}
          
          <View style={styles.paymentMethodsGrid}>
            {/* Card */}
            <TouchableOpacity 
              style={[
                styles.paymentMethodTile,
                selectedPaymentMethod === 'card'
                  ? [styles.paymentMethodSelected, { backgroundColor: isDark ? 'rgba(61,158,255,0.12)' : 'rgba(61,158,255,0.06)' }]
                  : { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.75)', borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' },
              ]}
              onPress={() => {
                setSelectedPaymentMethod('card');
                setCardNameError('');
                setCardNumberError('');
                setCardExpiryError('');
                setCardCvcError('');
              }}
              disabled={loading}
              activeOpacity={0.7}
            >
              <View style={[styles.paymentMethodIcon, selectedPaymentMethod === 'card' && styles.paymentMethodIconSelected]}>
                <MaterialCommunityIcons name="credit-card" size={26} color={selectedPaymentMethod === 'card' ? '#fff' : ACCENT} />
              </View>
              <Text style={[styles.paymentMethodLabel, { color: colors.textPrimary }]}>{t('payment.card', 'Card')}</Text>
              {selectedPaymentMethod === 'card' && (
                <View style={styles.paymentCheckmark}>
                  <Ionicons name="checkmark" size={14} color="#fff" />
                </View>
              )}
            </TouchableOpacity>

            {/* Apple Pay */}
            <TouchableOpacity 
              style={[
                styles.paymentMethodTile,
                selectedPaymentMethod === 'apple-pay'
                  ? [styles.paymentMethodSelected, { backgroundColor: isDark ? 'rgba(61,158,255,0.12)' : 'rgba(61,158,255,0.06)' }]
                  : { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.75)', borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' },
              ]}
              onPress={() => {
                setSelectedPaymentMethod('apple-pay');
                setCardNameError('');
                setCardNumberError('');
                setCardExpiryError('');
                setCardCvcError('');
              }}
              disabled={loading}
              activeOpacity={0.7}
            >
              <View style={[styles.paymentMethodIcon, { backgroundColor: 'rgba(0,0,0,0.05)' }, selectedPaymentMethod === 'apple-pay' && { backgroundColor: '#000' }]}>
                <MaterialCommunityIcons name="apple" size={26} color={selectedPaymentMethod === 'apple-pay' ? '#fff' : '#000'} />
              </View>
              <Text style={[styles.paymentMethodLabel, { color: colors.textPrimary }]}>{t('payment.applePay', 'Apple Pay')}</Text>
              {selectedPaymentMethod === 'apple-pay' && (
                <View style={[styles.paymentCheckmark, { backgroundColor: '#000' }]}>
                  <Ionicons name="checkmark" size={14} color="#fff" />
                </View>
              )}
            </TouchableOpacity>

            {/* PayPal */}
            <TouchableOpacity 
              style={[
                styles.paymentMethodTile,
                selectedPaymentMethod === 'paypal'
                  ? [styles.paymentMethodSelected, { backgroundColor: isDark ? 'rgba(61,158,255,0.12)' : 'rgba(61,158,255,0.06)' }]
                  : { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.75)', borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' },
              ]}
              onPress={() => {
                setSelectedPaymentMethod('paypal');
                setCardNameError('');
                setCardNumberError('');
                setCardExpiryError('');
                setCardCvcError('');
              }}
              disabled={loading}
              activeOpacity={0.7}
            >
              <View style={[styles.paymentMethodIcon, { backgroundColor: 'rgba(0,48,135,0.1)' }, selectedPaymentMethod === 'paypal' && { backgroundColor: '#003087' }]}>
                <MaterialCommunityIcons name="credit-card-outline" size={26} color={selectedPaymentMethod === 'paypal' ? '#fff' : '#003087'} />
              </View>
              <Text style={[styles.paymentMethodLabel, { color: colors.textPrimary }]}>{t('payment.paypal', 'PayPal')}</Text>
              {selectedPaymentMethod === 'paypal' && (
                <View style={[styles.paymentCheckmark, { backgroundColor: '#003087' }]}>
                  <Ionicons name="checkmark" size={14} color="#fff" />
                </View>
              )}
            </TouchableOpacity>

            {/* Google Pay */}
            <TouchableOpacity 
              style={[
                styles.paymentMethodTile,
                selectedPaymentMethod === 'google-pay'
                  ? [styles.paymentMethodSelected, { backgroundColor: isDark ? 'rgba(61,158,255,0.12)' : 'rgba(61,158,255,0.06)' }]
                  : { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.75)', borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' },
              ]}
              onPress={() => {
                setSelectedPaymentMethod('google-pay');
                setCardNameError('');
                setCardNumberError('');
                setCardExpiryError('');
                setCardCvcError('');
              }}
              disabled={loading}
              activeOpacity={0.7}
            >
              <View style={[styles.paymentMethodIcon, { backgroundColor: 'rgba(66,133,244,0.1)' }, selectedPaymentMethod === 'google-pay' && { backgroundColor: '#4285f4' }]}>
                <MaterialCommunityIcons name="wallet-outline" size={26} color={selectedPaymentMethod === 'google-pay' ? '#fff' : '#4285f4'} />
              </View>
              <Text style={[styles.paymentMethodLabel, { color: colors.textPrimary }]}>{t('payment.googlePay', 'Google Pay')}</Text>
              {selectedPaymentMethod === 'google-pay' && (
                <View style={[styles.paymentCheckmark, { backgroundColor: '#4285f4' }]}>
                  <Ionicons name="checkmark" size={14} color="#fff" />
                </View>
              )}
            </TouchableOpacity>
          </View>
          {!selectedPaymentMethod && (
            <Text style={[styles.validationHint, { color: '#ef4444', marginTop: 8 }]}>
              {t('payment.selectMethod', 'Please select a payment method')}
            </Text>
          )}
        </View>
        {/* Card Entry Section (only shown when Card is selected) */}
        {selectedPaymentMethod === 'card' && (
          <View style={[styles.section, styles.glassCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.50)' }]}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{t('payment.cardDetails', 'Card Details')}</Text>
            
            {/* Card Name */}
            <View style={styles.inputWithIcon}>
              <Ionicons name="person-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={[styles.inputIconField, styles.glassInput, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.9)', borderColor: cardNameError ? '#ef4444' : isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)', color: colors.textPrimary }, !cardNameError && getInputFocusStyle('cardName')]}
                placeholder={t('payment.nameOnCard', 'Name on card')}
                placeholderTextColor={colors.inputPlaceholder}
                value={cardName}
                onChangeText={validateCardName}
                onFocus={() => setFocusedField('cardName')}
                onBlur={() => setFocusedField(null)}
                editable={!loading}
                autoCapitalize="words"
              />
            </View>
            {cardNameError && (
              <Text style={[styles.validationHint, { color: '#ef4444', marginTop: -6, marginBottom: 8 }]}>
                {cardNameError}
              </Text>
            )}
            
            {/* Card Number */}
            <View style={styles.inputWithIcon}>
              <Ionicons name="card-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={[styles.inputIconField, styles.glassInput, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.9)', borderColor: cardNumberError ? '#ef4444' : isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)', color: colors.textPrimary }, !cardNumberError && getInputFocusStyle('cardNumber')]}
                placeholder={t('payment.cardNumber', 'Card number')}
                placeholderTextColor={colors.inputPlaceholder}
                keyboardType="number-pad"
                value={cardNumber}
                onChangeText={validateCardNumber}
                onFocus={() => setFocusedField('cardNumber')}
                onBlur={() => setFocusedField(null)}
                editable={!loading}
                maxLength={19}
              />
            </View>
            {cardNumberError && (
              <Text style={[styles.validationHint, { color: '#ef4444', marginTop: -6, marginBottom: 8 }]}>
                {cardNumberError}
              </Text>
            )}
            
            {/* Expiry and CVC */}
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <TextInput
                  style={[styles.inputHalf, styles.glassInput, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.9)', borderColor: cardExpiryError ? '#ef4444' : isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)', color: colors.textPrimary }, !cardExpiryError && getInputFocusStyle('cardExpiry')]}
                  placeholder={t('payment.expiry', 'MM/YY')}
                  placeholderTextColor={colors.inputPlaceholder}
                  keyboardType="number-pad"
                  value={cardExpiry}
                  onChangeText={validateCardExpiry}
                  onFocus={() => setFocusedField('cardExpiry')}
                  onBlur={() => setFocusedField(null)}
                  editable={!loading}
                  maxLength={7}
                />
                {cardExpiryError && (
                  <Text style={[styles.validationHint, { color: '#ef4444', marginTop: 4, fontSize: 11 }]}>
                    {cardExpiryError}
                  </Text>
                )}
              </View>
              <View style={{ flex: 1 }}>
                <TextInput
                  style={[styles.inputHalf, styles.glassInput, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.9)', borderColor: cardCvcError ? '#ef4444' : isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)', color: colors.textPrimary }, !cardCvcError && getInputFocusStyle('cardCvc')]}
                  placeholder={t('payment.cvc', 'CVC')}
                  placeholderTextColor={colors.inputPlaceholder}
                  keyboardType="number-pad"
                  value={cardCvc}
                  onChangeText={validateCardCvc}
                  onFocus={() => setFocusedField('cardCvc')}
                  onBlur={() => setFocusedField(null)}
                  editable={!loading}
                  maxLength={4}
                />
                {cardCvcError && (
                  <Text style={[styles.validationHint, { color: '#ef4444', marginTop: 4, fontSize: 11 }]}>
                    {cardCvcError}
                  </Text>
                )}
              </View>
            </View>
          </View>
        )}

        {/* Coupon Code Section */}
        <View style={[styles.section, styles.glassCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.042)' : 'rgba(255,255,255,0.42)' }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <Ionicons name="pricetag-outline" size={20} color={colors.textSecondary} style={{ marginRight: 8 }} />
            <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginBottom: 0 }]}>
              {t('payment.couponCode', 'Coupon Code')}
            </Text>
          </View>
          
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 8 }}>
            <TextInput
              style={[styles.inputCoupon, styles.glassInput, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.9)', borderColor: appliedCoupon ? '#10b981' : isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)', color: colors.textPrimary, flex: 1, borderWidth: appliedCoupon ? 2 : 1 }, !appliedCoupon && getInputFocusStyle('coupon')]}
              placeholder={t('payment.enterCoupon', 'Enter coupon code...')}
              placeholderTextColor={colors.inputPlaceholder}
              value={couponCode}
              onChangeText={setCouponCode}
              onFocus={() => setFocusedField('coupon')}
              onBlur={() => setFocusedField(null)}
              editable={!loading && !appliedCoupon}
              maxLength={20}
            />
            {!appliedCoupon ? (
              <TouchableOpacity 
                style={[styles.couponApplyBtn, { backgroundColor: ACCENT }]}
                onPress={applyCoupon}
                disabled={loading || !couponCode.trim()}
                activeOpacity={0.7}
              >
                <Text style={[styles.couponBtnText, { color: '#fff' }]}>{t('payment.apply', 'Apply')}</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity 
                style={[styles.couponApplyBtn, { backgroundColor: '#ef4444' }]}
                onPress={removeCoupon}
                disabled={loading}
                activeOpacity={0.7}
              >
                <Text style={[styles.couponBtnText, { color: '#fff' }]}>{t('payment.remove', 'Remove')}</Text>
              </TouchableOpacity>
            )}
          </View>

          {couponMessage && (
            <View style={styles.couponSuccessBadge}>
              <View style={styles.couponBadgeIconCircle}>
                <Ionicons name="checkmark" size={12} color="#10b981" />
              </View>
              <Text style={styles.couponSuccessText}>
                {couponMessage}
              </Text>
            </View>
          )}

          {couponError && (
            <View style={styles.couponErrorBadge}>
              <View style={[styles.couponBadgeIconCircle, { backgroundColor: 'rgba(239,68,68,0.1)' }]}>
                <Ionicons name="close" size={12} color="#ef4444" />
              </View>
              <Text style={styles.couponErrorText}>
                {couponError}
              </Text>
            </View>
          )}
        </View>

        {/* Validation Hint Glass Card */}
        {(!firstName || !lastName || !email || !email.includes('@') || !password || password.length < 6) && (
          <View style={[styles.validationGlassCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.45)' }]}>
            <Ionicons name="information-circle-outline" size={16} color={isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.35)'} style={{ marginRight: 8, marginTop: 1 }} />
            <Text style={[styles.validationGlassText, { color: isDark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.4)' }]}>
              {!firstName || !lastName ? 'Please enter your first and last name' : ''}
              {firstName && lastName && (!email || !email.includes('@')) ? 'Please enter a valid email address' : ''}
              {email && email.includes('@') && (!password || password.length < 6) ? 'Password must be at least 6 characters' : ''}
            </Text>
          </View>
        )}
        </Animated.View>
      </ScrollView>

      {/* ===== Sticky CTA Dock ===== */}
      <View style={[
        styles.stickyCtaDock,
        { backgroundColor: isDark ? 'rgba(20,20,30,0.85)' : 'rgba(255,255,255,0.78)' },
      ]}>
        <TouchableOpacity 
          style={[
            styles.stickyCtaButton,
            (!isFormValid() || loading) && styles.stickyCtaButtonDisabled,
          ]} 
          onPress={onSignup} 
          disabled={!isFormValid() || loading}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={isFormValid() ? [ACCENT, '#6366f1'] : [isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)', isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.stickyCtaGradient}
          >
            {loading ? (
              <ActivityIndicator color={isFormValid() ? '#fff' : colors.textSecondary} size="small" />
            ) : (
              <View style={styles.subscribeButtonContent}>
                <View style={styles.subscribeTextContainer}>
                  <Text style={[
                    styles.subscribePrimaryText,
                    !isFormValid() && { color: isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.3)' },
                  ]}>
                    {t('auth.startSubscription', 'Subscribe Now')}
                  </Text>
                  <Text style={[
                    styles.subscribeSecondaryText,
                    !isFormValid() && { color: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)' },
                  ]}>
                    {parseFloat(planPrice) === 0 
                      ? 'Free • Forever' 
                      : `$${planPrice}/${(planLabel || 'Monthly').toLowerCase().includes('year') ? 'yr' : 'mo'}`
                    }
                  </Text>
                </View>
                <View style={[
                  styles.subscribeArrowCircle,
                  !isFormValid() && { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' },
                ]}>
                  <Ionicons name="arrow-forward" size={20} color={isFormValid() ? '#fff' : isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.2)'} />
                </View>
              </View>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>

    </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 0, paddingTop: 0, paddingBottom: 110, flexGrow: 1 },
  // ===== Header Container =====
  headerContainer: {
    minHeight: 175,
    paddingTop: 68,
    paddingBottom: 28,
    paddingHorizontal: 16,
    marginBottom: 0,
    borderWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  backButton: { 
    position: 'absolute',
    top: 60,
    left: 20,
    zIndex: 10,
  },
  title: { fontSize: 28, fontWeight: '800', marginBottom: 4, textAlign: 'center', letterSpacing: -0.5 },
  headerSubtitle: { fontSize: 13, fontWeight: '500', textAlign: 'center', opacity: 0.65, marginBottom: 12 },
  section: { marginBottom: 16, paddingHorizontal: 16 },
  sectionTitle: { fontSize: 17, fontWeight: '700', marginBottom: 14, color: '#1f2937' },
  input: { borderWidth: 1, padding: 14, borderRadius: 14, marginBottom: 10, fontSize: 16 },
  inputHalf: { 
    flex: 1, 
    borderWidth: 1, 
    padding: 14, 
    borderRadius: 14,
    fontSize: 16,
    textAlign: 'center',
  },
  passwordContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    borderWidth: 1, 
    borderRadius: 14, 
    marginBottom: 10,
    paddingRight: 8,
  },
  passwordInput: { 
    flex: 1, 
    paddingVertical: 14,
    paddingHorizontal: 14,
    paddingLeft: 44,
    fontSize: 16,
  },
  passwordToggle: {
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  paymentMethodsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  paymentMethodTile: {
    width: '48%',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  paymentMethodLabel: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  inputCoupon: {
    borderWidth: 1,
    padding: 14,
    borderRadius: 14,
    fontSize: 15,
  },
  couponApplyBtn: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 90,
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  couponBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  validationHint: { fontSize: 12, fontWeight: '500', marginHorizontal: 16, marginBottom: 12, minHeight: 16, textAlign: 'center' },
  
  // ===== Clinic Type Selection Styles =====
  clinicTypeSection: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    marginTop: 0,
    marginBottom: 16,
    backgroundColor: 'transparent',
    borderRadius: 0,
    borderWidth: 0,
  },
  clinicTypeTitle: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: -0.2,
  },
  clinicTypeGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  clinicTypeCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 8,
    borderRadius: 18,
    minHeight: 116,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  clinicTypeCardSelected: {
    shadowColor: ACCENT,
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
    transform: [{ scale: 1.01 }],
  },
  clinicTypeCardUnselected: {
    transform: [{ scale: 1 }],
  },
  clinicTypeIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  clinicTypeEmoji: {
    fontSize: 26,
  },
  clinicTypeLabel: {
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.1,
  },
  clinicTypeCheckmark: {
    position: 'absolute',
    top: 7,
    right: 7,
  },
  clinicTypeCheckmarkBg: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  
  // ===== Glassmorphism & Modern UI Styles =====
  glassCard: {
    borderRadius: 22,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  glassInput: {
    borderRadius: 14,
    borderWidth: 1,
  },
  backButtonCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  inputIcon: {
    position: 'absolute',
    left: 14,
    zIndex: 1,
  },
  inputIconField: {
    flex: 1,
    paddingLeft: 44,
    padding: 14,
    fontSize: 16,
    borderWidth: 1,
    borderRadius: 14,
  },
  
  // ===== Payment Method Modern Styles =====
  paymentMethodSelected: {
    borderWidth: 2,
    borderColor: ACCENT,
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  paymentMethodIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: `rgba(61,158,255,0.1)`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  paymentMethodIconSelected: {
    backgroundColor: ACCENT,
  },
  paymentCheckmark: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  freeSubscriptionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 14,
    backgroundColor: 'rgba(16,185,129,0.1)',
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.3)',
  },
  freeSubscriptionText: {
    color: '#059669',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  
  // ===== Coupon Badge Styles =====
  couponSuccessBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(16,185,129,0.06)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.15)',
  },
  couponErrorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(239,68,68,0.04)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.12)',
  },
  couponBadgeIconCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(16,185,129,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  couponSuccessText: {
    color: '#059669',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
    opacity: 0.85,
  },
  couponErrorText: {
    color: '#dc2626',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
    opacity: 0.75,
  },
  
  // ===== Validation Glass Card =====
  validationGlassCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  validationGlassText: {
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
    lineHeight: 18,
  },
  
  // ===== Sticky CTA Dock =====
  stickyCtaDock: {
    position: 'absolute',
    bottom: 12,
    left: 16,
    right: 16,
    borderRadius: 28,
    padding: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  stickyCtaButton: {
    borderRadius: 22,
    overflow: 'hidden',
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  stickyCtaButtonDisabled: {
    shadowOpacity: 0,
    shadowColor: 'transparent',
  },
  stickyCtaGradient: {
    paddingVertical: 16,
    paddingHorizontal: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subscribeButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  subscribeTextContainer: {
    flex: 1,
  },
  subscribePrimaryText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 2,
  },
  subscribeSecondaryText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    fontWeight: '600',
  },
  subscribeArrowCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Clinic Location card ──
  mapPreview: {
    borderRadius: 18,
    borderWidth: 1,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 12,
    overflow: 'hidden',
  },
  mapPreviewPinRing: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(61,158,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  mapPreviewLabel: {
    fontSize: 12,
    fontWeight: '600',
    opacity: 0.6,
  },
  locationAddressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 12,
  },
  locationAddressText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 19,
  },
  locationCoordsText: {
    fontSize: 11,
    fontWeight: '500',
    opacity: 0.55,
    marginTop: 2,
  },
  mapPreviewEmpty: {
    borderRadius: 18,
    borderWidth: 1,
    borderStyle: 'dashed',
    height: 90,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 12,
  },
  mapPreviewEmptyLabel: {
    fontSize: 13,
    fontWeight: '500',
    opacity: 0.6,
  },
  locationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 14,
    paddingVertical: 12,
  },
  locationBtnOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
  },
  locationBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
