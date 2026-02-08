import { db } from '@/firebaseConfig';
import i18n from '@/i18n';
import { useTheme } from '@/src/context/ThemeContext';
import { uploadClinicImage } from '@/src/utils/firebaseStorageUtils';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { addDoc, collection, doc, setDoc } from 'firebase/firestore';
import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, BackHandler, Image, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import CountrySelect from '../components/CountrySelect';

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
  const [clinicImage, setClinicImage] = useState<string | null>(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const router = useRouter();
  const { plan, billing } = useLocalSearchParams<{ plan?: string; billing?: string }>();
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const isRTL = ['ar', 'he', 'fa', 'ur'].includes(i18n.language);

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
            const derivedPrice = planId === 'YEARLY' ? '230.88' : '19.99';
            console.log('[SIGNUP] No price in AsyncStorage, using derived:', derivedPrice);
            finalPrice = derivedPrice;
          }
          
          const finalName = planName || (planId === 'YEARLY' ? 'Annual' : 'Monthly');
          
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

  const pickClinicImage = async () => {
    try {
      // Request permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please allow access to your photo library to upload a clinic image.'
        );
        return;
      }

      // Launch image picker - get base64 data for Firebase upload
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
        base64: true, // ✅ Request base64 data for Firebase upload
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        console.log('[IMAGE PICKER] Selected image URI:', asset.uri?.substring(0, 80));
        
        // Use base64 data URL for Firebase upload
        if (asset.base64) {
          const mimeType = asset.mimeType || 'image/jpeg';
          const dataUrl = `data:${mimeType};base64,${asset.base64}`;
          console.log('[IMAGE PICKER] Using base64 data URL, length:', dataUrl.length);
          setClinicImage(dataUrl);
        } else {
          // Fallback to URI if base64 not available
          console.log('[IMAGE PICKER] base64 not available, using URI');
          setClinicImage(asset.uri);
        }
      }
    } catch (error) {
      console.error('[IMAGE PICKER] Error:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
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
    
    // For FREE subscriptions: Only core fields required (NO payment method needed)
    if (isFreeSubscription) {
      const isValid = Boolean(coreFieldsOk && !loading);
      console.log('[FORM VALIDATION] Free subscription', {
        clinicType,
        coreFieldsOk,
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
    
    const isValid = Boolean(coreFieldsOk && paymentMethodSelected && paymentOk && !loading);
    
    console.log('[FORM VALIDATION] Paid subscription final', {
      coreFieldsOk,
      paymentMethodSelected,
      paymentOk,
      isValid,
    });
    
    return isValid;
  };

  const onSignup = async () => {
    // Validation: Clinic type is REQUIRED
    if (!clinicType) {
      return Alert.alert(
        t('clinic.validation', 'Validation'),
        t('clinic.selectClinicType', 'Please select clinic type to continue / يرجى اختيار نوع العيادة للمتابعة')
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
      const isFree = parseFloat(planPrice) === 0;
      
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
      // Get clinic ID and upload image if one was selected
      const clinicId = await AsyncStorage.getItem('clinicId');
      
      console.log('[SIGNUP] completePaymentAndLogin called');
      console.log('[SIGNUP] clinicId:', clinicId);
      console.log('[SIGNUP] clinicImage exists:', !!clinicImage);
      console.log('[SIGNUP] clinicImage value:', clinicImage ? clinicImage.substring(0, 100) + '...' : 'null');
      
      if (clinicId && clinicImage) {
        console.log('[SIGNUP] Uploading clinic image to Firebase Storage...');
        setLoading(true);
        
        try {
          // Upload image to Firebase Storage
          const imageUrl = await uploadClinicImage(clinicImage, clinicId);
          
          // Save image URL to Firestore clinic document (use merge to avoid "No document" error)
          console.log('[SIGNUP] Saving image URL to Firestore...');
          await setDoc(doc(db, 'clinics', clinicId), {
            clinicImageUrl: imageUrl,  // ✅ Use clinicImageUrl for consistency
            imageUrl: imageUrl,        // Also keep imageUrl for backward compatibility
            imageUploadedAt: Date.now(),
          }, { merge: true });
          
          console.log('[SIGNUP] Image uploaded and saved successfully:', imageUrl);
          await AsyncStorage.setItem('clinicImageUrl', imageUrl);
        } catch (imageError: any) {
          console.error('[SIGNUP] Warning: Image upload failed:', imageError);
          console.error('[SIGNUP] Error code:', imageError?.code);
          console.error('[SIGNUP] Error message:', imageError?.message);
          Alert.alert(
            'Image Upload',
            `Could not upload clinic image: ${imageError?.message || 'Unknown error'}. Your account was created successfully.`,
            [{ text: 'OK' }]
          );
        }
      } else {
        console.log('[SIGNUP] Skipping image upload - clinicId:', !!clinicId, 'clinicImage:', !!clinicImage);
      }
      
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

  const goToLogin = () => router.push('/clinic/login' as any);
  const goBack = () => {
    // Only allow back if not loading
    if (!loading) {
      router.back();
    }
  };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1, backgroundColor: isDark ? colors.background : '#f0f4ff' }} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
    >
      <ScrollView 
        contentContainerStyle={[styles.container, { backgroundColor: isDark ? colors.background : '#f0f4ff' }]} 
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Back Button */}
        <TouchableOpacity style={styles.backButton} onPress={goBack} disabled={loading}>
          <View style={[styles.backButtonCircle, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.8)' }]}>
            <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
          </View>
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>BeSmile AI</Text>
        </View>

        {/* ===== Clinic Type Selection Section ===== */}
        <View style={styles.clinicTypeSection}>
          <Text style={[styles.clinicTypeTitle, { color: colors.textPrimary }]}>
            {t('clinic.selectClinicTypeTitle', 'اختر نوع العيادة للمتابعة')}
          </Text>
          <Text style={[styles.clinicTypeSubtitle, { color: colors.textSecondary }]}>
            {t('clinic.fillDataAccurately', 'املأ بيانات الاشتراك بدقة.')}
          </Text>
          
          <View style={styles.clinicTypeGrid}>
            {/* Dental Clinic */}
            <TouchableOpacity
              style={[
                styles.clinicTypeCard,
                { 
                  backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(173,216,230,0.3)',
                  borderColor: clinicType === 'dental' ? '#3b82f6' : 'transparent',
                  borderWidth: clinicType === 'dental' ? 3 : 0,
                },
                clinicType === 'dental' && styles.clinicTypeCardSelected,
              ]}
              onPress={() => setClinicType('dental')}
              activeOpacity={0.7}
              disabled={loading}
            >
              <View style={[
                styles.clinicTypeIconContainer,
                { backgroundColor: isDark ? 'rgba(173,216,230,0.2)' : 'rgba(173,216,230,0.5)' }
              ]}>
                <Text style={styles.clinicTypeEmoji}>🦷</Text>
              </View>
              <Text style={[styles.clinicTypeLabel, { color: colors.textPrimary }]}>
                {t('clinic.dentalClinic', 'عيادة أسنان')}
              </Text>
              {clinicType === 'dental' && (
                <View style={styles.clinicTypeCheckmark}>
                  <Ionicons name="checkmark-circle" size={24} color="#3b82f6" />
                </View>
              )}
            </TouchableOpacity>

            {/* Beauty Clinic */}
            <TouchableOpacity
              style={[
                styles.clinicTypeCard,
                { 
                  backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,182,193,0.3)',
                  borderColor: clinicType === 'beauty' ? '#ec4899' : 'transparent',
                  borderWidth: clinicType === 'beauty' ? 3 : 0,
                },
                clinicType === 'beauty' && styles.clinicTypeCardSelected,
              ]}
              onPress={() => setClinicType('beauty')}
              activeOpacity={0.7}
              disabled={loading}
            >
              <View style={[
                styles.clinicTypeIconContainer,
                { backgroundColor: isDark ? 'rgba(255,182,193,0.2)' : 'rgba(255,182,193,0.5)' }
              ]}>
                <Text style={styles.clinicTypeEmoji}>💄</Text>
              </View>
              <Text style={[styles.clinicTypeLabel, { color: colors.textPrimary }]}>
                {t('clinic.beautyClinic', 'عيادة تجميل')}
              </Text>
              {clinicType === 'beauty' && (
                <View style={styles.clinicTypeCheckmark}>
                  <Ionicons name="checkmark-circle" size={24} color="#ec4899" />
                </View>
              )}
            </TouchableOpacity>

            {/* Laser Clinic */}
            <TouchableOpacity
              style={[
                styles.clinicTypeCard,
                { 
                  backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(175,238,238,0.3)',
                  borderColor: clinicType === 'laser' ? '#06b6d4' : 'transparent',
                  borderWidth: clinicType === 'laser' ? 3 : 0,
                },
                clinicType === 'laser' && styles.clinicTypeCardSelected,
              ]}
              onPress={() => setClinicType('laser')}
              activeOpacity={0.7}
              disabled={loading}
            >
              <View style={[
                styles.clinicTypeIconContainer,
                { backgroundColor: isDark ? 'rgba(175,238,238,0.2)' : 'rgba(175,238,238,0.5)' }
              ]}>
                <Text style={styles.clinicTypeEmoji}>✨</Text>
              </View>
              <Text style={[styles.clinicTypeLabel, { color: colors.textPrimary }]}>
                {t('clinic.laserClinic', 'عيادة ليزر')}
              </Text>
              {clinicType === 'laser' && (
                <View style={styles.clinicTypeCheckmark}>
                  <Ionicons name="checkmark-circle" size={24} color="#06b6d4" />
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.section, styles.glassCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.7)' }]}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            {t('auth.personalInfo', 'املأ بيانات الاشتراك بدقة')}
          </Text>
          <TextInput 
            style={[styles.input, styles.glassInput, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.9)', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)', color: colors.textPrimary }]} 
            placeholder={t('auth.firstName')} 
            placeholderTextColor={colors.inputPlaceholder} 
            value={firstName} 
            onChangeText={setFirstName} 
            editable={!loading} 
          />
          <TextInput 
            style={[styles.input, styles.glassInput, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.9)', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)', color: colors.textPrimary }]} 
            placeholder={t('auth.lastName')} 
            placeholderTextColor={colors.inputPlaceholder} 
            value={lastName} 
            onChangeText={setLastName} 
            editable={!loading} 
          />
        </View>

        <View style={[styles.section, styles.glassCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.7)' }]}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{t('auth.accountDetails')}</Text>
          <View style={styles.inputWithIcon}>
            <Ionicons name="mail-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
            <TextInput 
              style={[styles.inputIconField, styles.glassInput, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.9)', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)', color: colors.textPrimary }]} 
              placeholder={t('auth.email')} 
              placeholderTextColor={colors.inputPlaceholder} 
              keyboardType="email-address" 
              value={email} 
              onChangeText={setEmail} 
              editable={!loading} 
              autoCapitalize="none" 
            />
          </View>
          
          {/* Password Field with Show/Hide Toggle */}
          <View style={[styles.passwordContainer, styles.glassInput, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.9)', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }]}>
            <Ionicons name="lock-closed-outline" size={20} color={colors.textSecondary} style={{ marginLeft: 12 }} />
            <TextInput 
              style={[styles.passwordInput, { color: colors.textPrimary }]} 
              placeholder={t('auth.password')} 
              placeholderTextColor={colors.inputPlaceholder}
              secureTextEntry={!showPassword}
              value={password} 
              onChangeText={setPassword} 
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
              style={[styles.inputIconField, styles.glassInput, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.9)', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)', color: colors.textPrimary }]} 
              placeholder={t('auth.phone')} 
              placeholderTextColor={colors.inputPlaceholder} 
              keyboardType="phone-pad" 
              value={phone} 
              onChangeText={setPhone} 
              editable={!loading} 
            />
          </View>
          
          <View style={styles.inputWithIcon}>
            <Ionicons name="business-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
            <TextInput 
              style={[styles.inputIconField, styles.glassInput, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.9)', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)', color: colors.textPrimary }]} 
              placeholder={t('auth.clinicName')} 
              placeholderTextColor={colors.inputPlaceholder} 
              value={clinicName} 
              onChangeText={setClinicName} 
              editable={!loading} 
            />
          </View>
          
          <View style={styles.inputWithIcon}>
            <Ionicons name="call-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
            <TextInput 
              style={[styles.inputIconField, styles.glassInput, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.9)', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)', color: colors.textPrimary }]} 
              placeholder={t('auth.clinicPhone')} 
              placeholderTextColor={colors.inputPlaceholder} 
              keyboardType="phone-pad" 
              value={clinicPhone} 
              onChangeText={setClinicPhone} 
              editable={!loading} 
            />
          </View>
          
          {/* Clinic Image Upload */}
          <View style={styles.imageUploadSection}>
            <View style={styles.imageUploadHeader}>
              <Ionicons name="image-outline" size={20} color={colors.textSecondary} />
              <Text style={[styles.imageLabel, { color: colors.textSecondary }]}>
                {t('clinic.uploadImage', 'تحضير الصور')}
              </Text>
            </View>
            <View style={styles.imageUploadContent}>
              <TouchableOpacity
                style={[styles.uploadButton, { 
                  backgroundColor: isDark ? 'rgba(59,130,246,0.2)' : 'rgba(59,130,246,0.1)', 
                  borderColor: '#3b82f6',
                }]}
                onPress={pickClinicImage}
                disabled={loading}
                activeOpacity={0.7}
              >
                <Ionicons name="cloud-upload-outline" size={24} color="#3b82f6" />
                <Text style={{ color: '#3b82f6', fontWeight: '600', fontSize: 14, marginTop: 4 }}>
                  {clinicImage ? t('clinic.changeImage', 'Change') : t('clinic.uploadImage', 'تحضير الصور')}
                </Text>
              </TouchableOpacity>
              
              {clinicImage && (
                <View style={styles.thumbnailContainer}>
                  <TouchableOpacity onPress={() => setShowImageModal(true)} activeOpacity={0.8}>
                    <Image 
                      source={{ uri: clinicImage }} 
                      style={styles.thumbnailImage}
                    />
                    <View style={styles.thumbnailOverlay}>
                      <Text style={styles.thumbnailLabel}>BS</Text>
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => setClinicImage(null)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="close" size={12} color="#fff" />
                  </TouchableOpacity>
                </View>
              )}
            </View>
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
              style={[styles.inputIconField, styles.glassInput, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.9)', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)', color: colors.textPrimary }]} 
              placeholder={t('auth.city')} 
              placeholderTextColor={colors.inputPlaceholder} 
              value={city} 
              onChangeText={setCity} 
              editable={!loading} 
            />
          </View>
        </View>

        {/* Payment Method Selection */}
        <View style={[styles.section, styles.glassCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.7)' }]}>
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
                { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.95)' },
                selectedPaymentMethod === 'card' && styles.paymentMethodSelected
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
                <MaterialCommunityIcons name="credit-card" size={26} color={selectedPaymentMethod === 'card' ? '#fff' : '#3b82f6'} />
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
                { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.95)' },
                selectedPaymentMethod === 'apple-pay' && styles.paymentMethodSelected
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
                { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.95)' },
                selectedPaymentMethod === 'paypal' && styles.paymentMethodSelected
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
                { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.95)' },
                selectedPaymentMethod === 'google-pay' && styles.paymentMethodSelected
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
          <View style={[styles.section, styles.glassCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.7)' }]}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{t('payment.cardDetails', 'Card Details')}</Text>
            
            {/* Card Name */}
            <View style={styles.inputWithIcon}>
              <Ionicons name="person-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={[styles.inputIconField, styles.glassInput, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.9)', borderColor: cardNameError ? '#ef4444' : isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)', color: colors.textPrimary }]}
                placeholder={t('payment.nameOnCard', 'Name on card')}
                placeholderTextColor={colors.inputPlaceholder}
                value={cardName}
                onChangeText={validateCardName}
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
                style={[styles.inputIconField, styles.glassInput, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.9)', borderColor: cardNumberError ? '#ef4444' : isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)', color: colors.textPrimary }]}
                placeholder={t('payment.cardNumber', 'Card number')}
                placeholderTextColor={colors.inputPlaceholder}
                keyboardType="number-pad"
                value={cardNumber}
                onChangeText={validateCardNumber}
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
                  style={[styles.inputHalf, styles.glassInput, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.9)', borderColor: cardExpiryError ? '#ef4444' : isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)', color: colors.textPrimary }]}
                  placeholder={t('payment.expiry', 'MM/YY')}
                  placeholderTextColor={colors.inputPlaceholder}
                  keyboardType="number-pad"
                  value={cardExpiry}
                  onChangeText={validateCardExpiry}
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
                  style={[styles.inputHalf, styles.glassInput, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.9)', borderColor: cardCvcError ? '#ef4444' : isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)', color: colors.textPrimary }]}
                  placeholder={t('payment.cvc', 'CVC')}
                  placeholderTextColor={colors.inputPlaceholder}
                  keyboardType="number-pad"
                  value={cardCvc}
                  onChangeText={validateCardCvc}
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
        <View style={[styles.section, styles.glassCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.7)' }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <Ionicons name="pricetag-outline" size={20} color={colors.textSecondary} style={{ marginRight: 8 }} />
            <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginBottom: 0 }]}>
              {t('payment.couponCode', 'كود الخصم')}
            </Text>
          </View>
          
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 8 }}>
            <TextInput
              style={[styles.inputCoupon, styles.glassInput, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.9)', borderColor: appliedCoupon ? '#10b981' : isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)', color: colors.textPrimary, flex: 1, borderWidth: appliedCoupon ? 2 : 1 }]}
              placeholder={t('payment.enterCoupon', 'أدخل كود الخصم...')}
              placeholderTextColor={colors.inputPlaceholder}
              value={couponCode}
              onChangeText={setCouponCode}
              editable={!loading && !appliedCoupon}
              maxLength={20}
            />
            {!appliedCoupon ? (
              <TouchableOpacity 
                style={[styles.couponApplyBtn, { backgroundColor: '#3b82f6' }]}
                onPress={applyCoupon}
                disabled={loading || !couponCode.trim()}
                activeOpacity={0.7}
              >
                <Text style={[styles.couponBtnText, { color: '#fff' }]}>{t('payment.apply', 'تطبيق')}</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity 
                style={[styles.couponApplyBtn, { backgroundColor: '#ef4444' }]}
                onPress={removeCoupon}
                disabled={loading}
                activeOpacity={0.7}
              >
                <Text style={[styles.couponBtnText, { color: '#fff' }]}>{t('payment.remove', 'إزالة')}</Text>
              </TouchableOpacity>
            )}
          </View>

          {couponMessage && (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, padding: 10, backgroundColor: 'rgba(16,185,129,0.1)', borderRadius: 10 }}>
              <Ionicons name="checkmark-circle" size={18} color="#10b981" style={{ marginRight: 8 }} />
              <Text style={[styles.validationHint, { color: '#10b981', marginBottom: 0, marginHorizontal: 0 }]}>
                {couponMessage}
              </Text>
            </View>
          )}

          {couponError && (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, padding: 10, backgroundColor: 'rgba(239,68,68,0.1)', borderRadius: 10 }}>
              <Ionicons name="alert-circle" size={18} color="#ef4444" style={{ marginRight: 8 }} />
              <Text style={[styles.validationHint, { color: '#ef4444', marginBottom: 0, marginHorizontal: 0 }]}>
                {couponError}
              </Text>
            </View>
          )}
        </View>

        {/* Modern Gradient Subscription Button */}
        <TouchableOpacity 
          style={[
            styles.modernSubscribeButton,
            (!isFormValid() || loading) && styles.modernSubscribeButtonDisabled
          ]} 
          onPress={onSignup} 
          disabled={!isFormValid() || loading}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={isFormValid() ? ['#06b6d4', '#8b5cf6'] : ['#9ca3af', '#6b7280']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.subscribeGradient}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <View style={styles.subscribeButtonContent}>
                <View style={styles.subscribeTextContainer}>
                  <Text style={styles.subscribePrimaryText}>
                    {t('auth.startSubscription', 'اشترك الآن')}
                  </Text>
                  <Text style={styles.subscribeSecondaryText}>
                    {parseFloat(planPrice) === 0 
                      ? 'مجاناً • للأبد' 
                      : `$${planPrice}/${(planLabel || 'Monthly').toLowerCase().includes('year') ? 'سنة' : 'شهر'}`
                    }
                  </Text>
                </View>
                <View style={styles.subscribeArrowCircle}>
                  <Ionicons name="arrow-forward" size={20} color="#fff" />
                </View>
              </View>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <Text style={[styles.validationHint, { color: colors.textSecondary, textAlign: 'center', marginTop: 12 }]}>
          {!firstName || !lastName ? '⚠️ يرجى إدخال الاسم الأول والأخير' : ''}
          {firstName && lastName && (!email || !email.includes('@')) ? '⚠️ يرجى إدخال بريد إلكتروني صحيح' : ''}
          {email && email.includes('@') && (!password || password.length < 6) ? '⚠️ كلمة المرور يجب أن تكون 6 أحرف على الأقل' : ''}
        </Text>
      </ScrollView>

      {/* Image Preview Modal */}
      <Modal
        visible={showImageModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowImageModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowImageModal(false)}
        >
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={[styles.modalCloseButton, { backgroundColor: colors.card }]}
              onPress={() => setShowImageModal(false)}
            >
              <Ionicons name="close" size={28} color={colors.textPrimary} />
            </TouchableOpacity>
            
            {clinicImage && (
              <Image 
                source={{ uri: clinicImage }} 
                style={styles.fullImage}
                resizeMode="contain"
              />
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 0, paddingVertical: 20, flexGrow: 1 },
  backButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 16, 
    paddingTop: 12, 
    paddingBottom: 8 
  },
  backButtonText: { 
    marginLeft: 8, 
    fontWeight: '600' 
  },
  header: { marginBottom: 28, paddingBottom: 16, borderBottomWidth: 0, paddingHorizontal: 16, marginTop: 8, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 32, fontWeight: '800', marginBottom: 6, textAlign: 'center', letterSpacing: -0.5 },
  subtitle: { fontSize: 16, marginBottom: 4 },
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
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  couponBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  btn: { padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 16, marginBottom: 8, marginHorizontal: 16 },
  subscriptionActionBox: {
    flexDirection: 'row',
    marginTop: 16,
    marginBottom: 8,
    marginHorizontal: 16,
    borderRadius: 8,
    overflow: 'hidden',
    height: 80,
  },
  subscriptionButtonLeft: {
    flex: 0.6,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRightWidth: 1,
    borderRightColor: 'rgba(255, 255, 255, 0.2)',
  },
  subscriptionButtonText: {
    fontWeight: '700',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 16,
  },
  subscriptionPriceDisplay: {
    flex: 0.4,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    borderLeftWidth: 1,
  },
  displayPriceValue: {
    fontSize: 20,
    fontWeight: '800',
  },
  displayPricePeriod: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  uploadButton: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: 'dashed',
    minWidth: 100,
    minHeight: 80,
  },
  thumbnailImage: {
    width: 70,
    height: 70,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#3b82f6',
  },
  removeImageButton: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  imageLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    height: '80%',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseButton: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  fullImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  validationHint: { fontSize: 12, fontWeight: '500', marginHorizontal: 16, marginBottom: 12, minHeight: 16, textAlign: 'center' },
  btnDisabled: { opacity: 0.7 },
  btnText: { fontWeight: '700', fontSize: 16 },
  link: { textAlign: 'center', fontWeight: '600', paddingHorizontal: 16, paddingBottom: 16 },
  
  // ===== Clinic Type Selection Styles =====
  clinicTypeSection: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 10,
    marginBottom: 8,
  },
  clinicTypeTitle: {
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 6,
  },
  clinicTypeSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 20,
    opacity: 0.8,
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
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderRadius: 16,
    minHeight: 110,
    position: 'relative',
    // Glassmorphism effect
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  clinicTypeCardSelected: {
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
    transform: [{ scale: 1.02 }],
  },
  clinicTypeIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  clinicTypeEmoji: {
    fontSize: 28,
  },
  clinicTypeLabel: {
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  clinicTypeCheckmark: {
    position: 'absolute',
    top: 6,
    right: 6,
  },
  
  // ===== Glassmorphism & Modern UI Styles =====
  glassCard: {
    borderRadius: 20,
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
  
  // ===== Image Upload Modern Styles =====
  imageUploadSection: {
    marginTop: 12,
    marginBottom: 12,
  },
  imageUploadHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  imageUploadContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  thumbnailContainer: {
    position: 'relative',
  },
  thumbnailOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(59,130,246,0.9)',
    paddingVertical: 4,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    alignItems: 'center',
  },
  thumbnailLabel: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  
  // ===== Payment Method Modern Styles =====
  paymentMethodSelected: {
    borderWidth: 2,
    borderColor: '#3b82f6',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  paymentMethodIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(59,130,246,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  paymentMethodIconSelected: {
    backgroundColor: '#3b82f6',
  },
  paymentCheckmark: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#3b82f6',
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
  
  // ===== Modern Subscribe Button =====
  modernSubscribeButton: {
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 8,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  modernSubscribeButtonDisabled: {
    shadowOpacity: 0.1,
    shadowColor: '#000',
  },
  subscribeGradient: {
    paddingVertical: 18,
    paddingHorizontal: 24,
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
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 2,
  },
  subscribeSecondaryText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 14,
    fontWeight: '600',
  },
  subscribeArrowCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
