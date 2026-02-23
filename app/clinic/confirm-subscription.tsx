import { db } from '@/firebaseConfig';
import i18n from '@/i18n';
import { PremiumGradientBackground } from '@/src/components/PremiumGradientBackground';
import { useTheme } from '@/src/context/ThemeContext';
import { ensureClinicPublished } from '@/src/services/clinicDirectorySync';

/** Subscription-wide primary blue — matches subscribe.tsx ACCENT */
const SUBSCRIPTION_BLUE = '#3D9EFF';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter, Stack } from 'expo-router';
import { doc, setDoc } from 'firebase/firestore';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, Animated, BackHandler, KeyboardAvoidingView, Modal, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import GlassCardPro from '@/src/components/GlassCardPro';

/**
 * SUBSCRIPTION CONFIRMATION PAGE
 * 
 * Shows subscription details before final confirmation
 * Sends confirmation email
 * Routes to dashboard after confirmation
 */
export default function ConfirmSubscription() {
  const router = useRouter();
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const isRTL = ['ar', 'he', 'fa', 'ur'].includes(i18n.language);

  const [planLabel, setPlanLabel] = useState('');
  const [basePrice, setBasePrice] = useState('');
  const [discountAmount, setDiscountAmount] = useState('0');
  const [finalPrice, setFinalPrice] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [clinicId, setClinicId] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [includeAIPro, setIncludeAIPro] = useState(false);

  // ✅ NEW: Additional fields for detailed confirmation
  const [clinicName, setClinicName] = useState('');
  const [clinicPhone, setClinicPhone] = useState('');
  const [personalPhone, setPersonalPhone] = useState('');  // ✅ Personal/Account phone
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [clinicType, setClinicType] = useState<'dental' | 'beauty' | 'laser' | ''>('');  // ✅ Clinic type for navigation
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [priceReady, setPriceReady] = useState(false);

  // ── Price animation refs (UI-only, no recalculation) ──
  const basePriceOpacity = useRef(new Animated.Value(0)).current;
  const discountOpacity = useRef(new Animated.Value(0)).current;
  const finalPriceOpacity = useRef(new Animated.Value(0)).current;
  const finalPriceScale = useRef(new Animated.Value(0.95)).current;

  // ── Button press animation (UI-only) ──
  const buttonScale = useRef(new Animated.Value(1)).current;
  // ── Modal entrance animation (UI-only) ──
  const modalScale = useRef(new Animated.Value(0.85)).current;
  const modalOpacity = useRef(new Animated.Value(0)).current;
  const checkScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!priceReady) return;
    basePriceOpacity.setValue(0);
    discountOpacity.setValue(0);
    finalPriceOpacity.setValue(0);
    finalPriceScale.setValue(0.95);
    Animated.stagger(200, [
      Animated.timing(basePriceOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.timing(discountOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.parallel([
        Animated.timing(finalPriceOpacity, { toValue: 1, duration: 350, useNativeDriver: true }),
        Animated.spring(finalPriceScale, { toValue: 1, friction: 6, useNativeDriver: true }),
      ]),
    ]).start();
  }, [priceReady]);

  // ── Modal entrance animation ──
  useEffect(() => {
    if (!showSuccessModal) {
      modalScale.setValue(0.92);
      modalOpacity.setValue(0);
      checkScale.setValue(0.95);
      return;
    }
    Animated.parallel([
      Animated.spring(modalScale, { toValue: 1, friction: 9, tension: 80, useNativeDriver: true }),
      Animated.timing(modalOpacity, { toValue: 1, duration: 150, useNativeDriver: true }),
    ]).start(() => {
      Animated.sequence([
        Animated.timing(checkScale, { toValue: 1.08, duration: 120, useNativeDriver: true }),
        Animated.spring(checkScale, { toValue: 1, friction: 5, useNativeDriver: true }),
      ]).start();
    });
  }, [showSuccessModal]);

  // ── Button press handlers (UI-only) ──
  const buttonOpacity = useRef(new Animated.Value(1)).current;
  const onButtonPressIn = () => {
    Animated.parallel([
      Animated.timing(buttonScale, { toValue: 0.97, duration: 120, useNativeDriver: true }),
      Animated.timing(buttonOpacity, { toValue: 0.82, duration: 100, useNativeDriver: true }),
    ]).start();
  };
  const onButtonPressOut = () => {
    Animated.parallel([
      Animated.spring(buttonScale, { toValue: 1, friction: 5, tension: 100, useNativeDriver: true }),
      Animated.timing(buttonOpacity, { toValue: 1, duration: 140, useNativeDriver: true }),
    ]).start();
  };

  // ── Plan Theme (unified blue) ────────────────────────────────
  const getPlanTheme = (_label: string, price: number, hasAIPro: boolean) => {
    const badge = price === 0 ? 'FREE' : hasAIPro ? 'PRO' : 'PAID';
    const icon: 'gift' | 'sparkles' | 'card' = price === 0 ? 'gift' : hasAIPro ? 'sparkles' : 'card';
    return {
      primary: SUBSCRIPTION_BLUE, primaryDark: '#1E6BFF',
      tint: 'rgba(61,158,255,0.10)', tintDark: 'rgba(30,107,255,0.18)',
      gradient: ['#3D9EFF', '#1E6BFF', '#1a5fd8'] as const,
      badge, icon,
    };
  };

  const priceNum = parseFloat(finalPrice);
  const isFree = !isNaN(priceNum) && priceNum === 0;
  const theme = getPlanTheme(planLabel, isNaN(priceNum) ? -1 : priceNum, includeAIPro);

  const getHomeRoute = (type: string): string => {
    switch (type) {
      case 'dental': return '/clinic/dental-home';
      case 'beauty': return '/clinic/beauty-home';
      case 'laser': return '/clinic/laser-home';
      default: return '/clinic/login';
    }
  };
  const homeRoute = getHomeRoute(clinicType);

  // Load subscription details from AsyncStorage
  useFocusEffect(
    useCallback(() => {
      const loadSubscriptionData = async () => {
        try {
          const results = await AsyncStorage.multiGet([
            'pendingSubscriptionPlanName',  // 0
            'pendingSubscriptionPrice',      // 1
            'pendingSubscriptionPriceWithAIPro', // 2
            'pendingPaymentMethod',          // 3
            'pendingAppliedCoupon',          // 4
            'pendingSubscriptionEmail',      // 5
            'clinicId',                      // 6
            'pendingIncludeAIPro',           // 7
            'clinicImageUrl',                // 8
            'pendingFinalPrice',             // 9
            'pendingClinicName',             // 10
            'pendingClinicPhone',            // 11
            'pendingFirstName',              // 12
            'pendingLastName',               // 13
            'pendingCountry',                // 14
            'pendingCity',                   // 15
            'pendingPhone',                  // 16 ✅ Personal phone
            'pendingClinicType',             // 17 ✅ Clinic type for navigation
          ]);

          const planName = results[0]?.[1] || 'Monthly';
          const basePriceStr = results[1]?.[1] || '0';
          const priceWithAIProStr = results[2]?.[1] || '0';
          const method = results[3]?.[1] || 'Not selected';
          const coupon = results[4]?.[1] || null;
          const userEmail = results[5]?.[1] || '';
          const cId = results[6]?.[1] || '';
          const aiProStr = results[7]?.[1] || 'false';
          const actualFinalPriceStr = results[9]?.[1] || null;
          const cName = results[10]?.[1] || '';
          const cPhone = results[11]?.[1] || '';
          const fName = results[12]?.[1] || '';
          const lName = results[13]?.[1] || '';
          const countryCode = results[14]?.[1] || '';
          const cityName = results[15]?.[1] || '';
          const pPhone = results[16]?.[1] || '';  // Personal phone
          const cType = results[17]?.[1] as 'dental' | 'beauty' | 'laser' | '' || '';  // Clinic type
          const hasAIPro = aiProStr === 'true';

          // ✅ SIMPLIFIED: Use pendingFinalPrice directly - no fallbacks!
          // pendingFinalPrice contains the FINAL price after any coupon discount
          // If it's '0', that means 100% discount was applied
          const baseNum = parseFloat(basePriceStr) || parseFloat(priceWithAIProStr) || 19.99;
          
          // ✅ CRITICAL FIX: Parse finalPrice directly from pendingFinalPrice
          // Do NOT use || fallback because parseFloat('0') = 0 is falsy!
          let finalNum: number;
          if (actualFinalPriceStr !== null && actualFinalPriceStr !== '') {
            finalNum = Number(actualFinalPriceStr);  // Use Number() instead of parseFloat()
            if (isNaN(finalNum)) {
              finalNum = baseNum;  // Only fallback if NaN
            }
          } else {
            // No pendingFinalPrice saved - use base price
            finalNum = baseNum;
          }
          
          const discount = baseNum - finalNum;
          
          // ✅ SIMPLE CHECK: If finalNum is exactly 0, it's a free subscription
          const isFreeSubscription = finalNum === 0;


          setPlanLabel(planName);
          setBasePrice(baseNum.toFixed(2));
          setFinalPrice(finalNum.toFixed(2));
          setDiscountAmount(discount > 0 ? discount.toFixed(2) : '0');
          setPaymentMethod(method);
          setAppliedCoupon(coupon);
          setEmail(userEmail);
          setClinicId(cId);
          setIncludeAIPro(hasAIPro);
          
          // ✅ Set additional fields
          setClinicName(cName);
          setClinicPhone(cPhone);
          setPersonalPhone(pPhone);  // ✅ Personal phone
          setFirstName(fName);
          setLastName(lName);
          setCountry(countryCode);
          setCity(cityName);
          setClinicType(cType);  // ✅ Set clinic type for navigation
          setPriceReady(true);

          // ✅ CRITICAL: Log clinicId status
          if (!cId) {
            console.error('[CONFIRM] WARNING: No clinicId found in AsyncStorage!');
          }

        } catch (error) {
          console.error('[CONFIRM] Error loading subscription data:', error);
          Alert.alert('Error', 'Failed to load subscription details. Please try again.');
        }
      };

      loadSubscriptionData();

      // Intercept hardware back button
      const onBackPress = () => {
        if (!confirming) {
          router.back();
        }
        return true;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [confirming])
  );

  const sendConfirmationEmail = async (userEmail: string, subscriptionDetails: any) => {
    try {
      // TEMP: Mock email sending - in production, use Firebase Cloud Functions or EmailJS

      // Mock success - in real implementation, call Cloud Function
      // Example: await fetch('https://your-function.cloudfunctions.net/sendConfirmationEmail', {...})

      const emailContent = `
Dear Clinic Owner,

Thank you for subscribing to BeSmile AI!

Subscription Confirmation:
- Plan: ${subscriptionDetails.planName}
- Base Price: $${subscriptionDetails.basePrice}
${subscriptionDetails.discount > 0 ? `- Discount Applied: -$${subscriptionDetails.discount} (${subscriptionDetails.coupon})` : ''}
- Final Price: $${subscriptionDetails.finalPrice}
- Payment Method: ${subscriptionDetails.paymentMethod}
${subscriptionDetails.includeAIPro ? '- AI Pro: ✓ ENABLED' : '- AI Pro: Not included'}

Your account is now active and ready to use. Log in to your clinic dashboard to get started.

Thank you for choosing BeSmile AI!

Best regards,
BeSmile AI Team
      `;


      // In production, this would call a Cloud Function:
      // await fetch(
      //   'https://region-project-id.cloudfunctions.net/sendConfirmationEmail',
      //   {
      //     method: 'POST',
      //     headers: { 'Content-Type': 'application/json' },
      //     body: JSON.stringify({
      //       email: userEmail,
      //       subject: 'BeSmile AI Subscription Confirmation',
      //       planName: subscriptionDetails.planName,
      //       basePrice: subscriptionDetails.basePrice,
      //       discount: subscriptionDetails.discount,
      //       coupon: subscriptionDetails.coupon,
      //       finalPrice: subscriptionDetails.finalPrice,
      //       paymentMethod: subscriptionDetails.paymentMethod,
      //       includeAIPro: subscriptionDetails.includeAIPro,
      //     }),
      //   }
      // );

      return true;
    } catch (error) {
      console.error('[EMAIL] Error sending confirmation email:', error);
      // Don't fail the subscription if email fails - it's optional for now
      return false;
    }
  };

  const handleConfirmSubscription = async () => {
    if (confirming) return;

    // ✅ CRITICAL: Verify clinicId exists before proceeding
    if (!clinicId) {
      console.error('[CONFIRM] ERROR: No clinicId found! Cannot confirm subscription.');
      Alert.alert(
        'Error',
        'Session expired. Please go back and complete the signup process again.',
        [{ text: 'OK', onPress: () => router.replace('/clinic/signup' as any) }]
      );
      return;
    }

    try {
      setConfirming(true);


      // Send confirmation email
      const emailData = {
        planName: planLabel,
        basePrice,
        discount: discountAmount,
        coupon: appliedCoupon,
        finalPrice,
        paymentMethod,
        includeAIPro,
      };

      await sendConfirmationEmail(email, emailData);

      // ✅ CRITICAL: Mark subscription as confirmed in Firestore
      // This MUST succeed for the subscription to be valid
      
      await setDoc(doc(db, 'clinics', clinicId), {
        subscribed: true,
        subscriptionConfirmedAt: Date.now(),
        subscriptionPlan: planLabel.includes('Annual') ? 'ANNUAL' : 'MONTHLY',
        appliedCoupon: appliedCoupon || null,
        finalPrice: parseFloat(finalPrice),
        basePrice: parseFloat(basePrice),
        // ✅ Also mark setup as complete if basic info exists
        setupComplete: true,
      }, { merge: true });


      // Auto-publish to clinics directory (fire-and-forget)
      ensureClinicPublished(clinicId).catch(() => {});

      // ✅ Store clinicId temporarily for login redirect
      const confirmedClinicId = clinicId;

      // Clear ONLY pending subscription data from AsyncStorage
      // NOTE: Keep clinicId for the login flow to work properly
      await AsyncStorage.multiRemove([
        'pendingSubscriptionPlan',
        'pendingSubscriptionPlanName',
        'pendingSubscriptionPrice',
        'pendingSubscriptionPriceWithAIPro',
        'pendingIncludeAIPro',
        'pendingPaymentMethod',
        'pendingAppliedCoupon',
        'pendingFinalPrice',
        'pendingClinicName',
        'pendingClinicPhone',
        'pendingSubscriptionEmail',
        'pendingCardName',
        'pendingCardNumber',
        'pendingCardExpiry',
        'pendingFirstName',
        'pendingLastName',
        'pendingCountry',
        'pendingCity',
        'pendingPhone',
        'pendingClinicType',  // ✅ Also clear clinic type
      ]);


      setConfirming(false);
      setShowSuccessModal(true);

    } catch (error) {
      console.error('[CONFIRM] Error confirming subscription:', error);
      setConfirming(false);
      Alert.alert(
        t('common.error', 'Error'),
        'Failed to confirm subscription. Please try again.'
      );
    }
  };

  const goBack = () => {
    if (!confirming) {
      router.back();
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <Stack.Screen options={{ headerShown: false }} />
      <PremiumGradientBackground isDark={isDark} showSparkles={!isDark} />
      <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }]}>
            <TouchableOpacity style={styles.headerBackBtn} onPress={goBack} disabled={confirming}>
              <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
              {t('subscription.confirmationTitle', 'Confirm Subscription')}
            </Text>
            <View style={{ width: 44 }} />
          </View>

          {/* Main Content */}
          <View style={[styles.container, { paddingHorizontal: 16 }]}>
            {/* Title */}
            <Text style={[styles.title, { color: colors.textPrimary }]}>
              {t('subscription.confirmationTitle', 'Confirm Your Subscription')}
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {t('subscription.confirmationSubtitle', 'Review all your details before confirming')}
            </Text>

            {/* ── Hero Section ── */}
            <View style={[styles.heroContainer, { backgroundColor: isDark ? 'rgba(0,0,0,0.28)' : 'rgba(255,255,255,0.72)' }]}>
              <LinearGradient
                colors={['rgba(61,158,255,0.14)', 'rgba(30,107,255,0.05)'] as const}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
              {/* Floating blur circles — static depth */}
              <View style={styles.heroBlurCircle1} />
              <View style={styles.heroBlurCircle2} />
              <View style={[styles.heroBadgePill, { backgroundColor: SUBSCRIPTION_BLUE, shadowColor: SUBSCRIPTION_BLUE, shadowOpacity: 0.35, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 3 }]}>
                <Ionicons
                  name="shield-checkmark"
                  size={14}
                  color="#fff"
                  style={{ marginRight: 5 }}
                />
                <Text style={styles.heroBadgePillText}>
                  {theme.badge}
                </Text>
              </View>
              <Text style={[styles.heroHeadline, { color: colors.textPrimary }]}>
                {isFree
                  ? (isRTL ? 'تم تفعيل الوصول المجاني' : 'Free Access Activated')
                  : includeAIPro
                    ? (isRTL ? 'تم فتح AI Pro' : 'AI Pro Unlocked')
                    : planLabel.toLowerCase().includes('6 month')
                      ? (isRTL ? 'تم تفعيل الوصول المميز' : 'Premium Access Activated')
                      : (isRTL ? 'تم تأكيد الاشتراك' : 'Subscription Confirmed')}
              </Text>
              <Text style={[styles.heroSubline, { color: colors.textSecondary }]}>
                {isFree
                  ? (isRTL ? 'أنت جاهز للبدء. لا حاجة للدفع.' : "You're ready to start. No payment required.")
                  : includeAIPro
                    ? (isRTL ? 'أنت الآن تعمل بكامل القوة.' : "You're now running at full power.")
                    : planLabel.toLowerCase().includes('6 month')
                      ? (isRTL ? 'استمتع بالميزات المميزة الكاملة لمدة 6 أشهر.' : 'Enjoy full premium features for 6 months.')
                      : (isRTL ? 'خطتك نشطة وجاهزة للاستخدام.' : 'Your plan is active and ready to use.')}
              </Text>
            </View>

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* SECTION 1: CLINIC INFO */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            <GlassCardPro accent="blue" isDark={isDark}>
              <View style={styles.sectionHeader}>
                <View style={[styles.sectionIconBox, { backgroundColor: SUBSCRIPTION_BLUE }]}>
                  <Ionicons name="business" size={20} color="#fff" />
                </View>
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                  {isRTL ? 'معلومات العيادة' : 'Clinic Info'}
                </Text>
              </View>

              {/* Clinic Name */}
              <View style={[styles.infoRow, { borderBottomColor: colors.cardBorder }]}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                  {isRTL ? 'اسم العيادة' : 'Clinic Name'}
                </Text>
                <Text style={[styles.infoValue, { color: colors.textPrimary }]}>
                  {clinicName || '—'}
                </Text>
              </View>

              {/* Clinic Phone */}
              <View style={[styles.infoRow, { borderBottomColor: colors.cardBorder }]}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                  {isRTL ? 'هاتف العيادة' : 'Clinic Phone'}
                </Text>
                <Text style={[styles.infoValue, { color: colors.textPrimary }]}>
                  {clinicPhone || '—'}
                </Text>
              </View>

              {/* Country + City */}
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                  {isRTL ? 'الموقع' : 'Location'}
                </Text>
                <Text style={[styles.infoValue, { color: colors.textPrimary }]}>
                  {country && city ? `${city}, ${country}` : country || city || '—'}
                </Text>
              </View>
            </GlassCardPro>

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* SECTION 2: ACCOUNT INFO */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            <GlassCardPro accent="blue" isDark={isDark}>
              <View style={styles.sectionHeader}>
                <View style={[styles.sectionIconBox, { backgroundColor: SUBSCRIPTION_BLUE }]}>
                  <Ionicons name="person" size={20} color="#fff" />
                </View>
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                  {isRTL ? 'معلومات الحساب' : 'Account Info'}
                </Text>
              </View>

              {/* Full Name */}
              <View style={[styles.infoRow, { borderBottomColor: colors.cardBorder }]}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                  {isRTL ? 'الاسم الكامل' : 'Full Name'}
                </Text>
                <Text style={[styles.infoValue, { color: colors.textPrimary }]}>
                  {firstName && lastName ? `${firstName} ${lastName}` : firstName || lastName || '—'}
                </Text>
              </View>

              {/* Email */}
              <View style={[styles.infoRow, { borderBottomColor: colors.cardBorder }]}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                  {isRTL ? 'البريد الإلكتروني' : 'Email'}
                </Text>
                <Text style={[styles.infoValue, { color: colors.textPrimary, fontSize: 13 }]}>
                  {email || '—'}
                </Text>
              </View>

              {/* Personal Phone */}
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                  {isRTL ? 'الهاتف الشخصي' : 'Personal Phone'}
                </Text>
                <Text style={[styles.infoValue, { color: colors.textPrimary }]}>
                  {personalPhone || '—'}
                </Text>
              </View>
            </GlassCardPro>

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* SECTION 3: PLAN INFO */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            <GlassCardPro accent="blue" isDark={isDark}>
              <View style={styles.sectionHeader}>
                <View style={[styles.sectionIconBox, { backgroundColor: theme.primary }]}>
                  <Ionicons name={theme.icon} size={20} color="#fff" />
                </View>
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                  {isRTL ? 'معلومات الاشتراك' : 'Plan Info'}
                </Text>
                {/* Badge */}
                <View style={[styles.planBadge, { backgroundColor: theme.primary }]}>
                  <Text style={styles.planBadgeText}>
                    {theme.badge}
                  </Text>
                </View>
              </View>

              {/* Plan Type */}
              <View style={[styles.infoRow, { borderBottomColor: colors.cardBorder }]}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                  {isRTL ? 'نوع الخطة' : 'Plan Type'}
                </Text>
                <Text style={[styles.infoValue, { color: theme.primary, fontWeight: '700' }]}>
                  {isFree ? (isRTL ? 'اشتراك مجاني' : 'Free Subscription') : planLabel}
                </Text>
              </View>

              {/* Base Price — animated (secondary) */}
              <Animated.View style={[styles.infoRow, { borderBottomColor: colors.cardBorder, opacity: basePriceOpacity }]}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                  {isRTL ? 'السعر الأساسي' : 'Base Price'}
                </Text>
                <Text style={[styles.infoValue, { color: colors.textSecondary, fontWeight: '500' }]}>
                  ${basePrice}
                </Text>
              </Animated.View>

              {/* Applied Coupon — animated fade-in */}
              {appliedCoupon && parseFloat(discountAmount) > 0 && (
                <Animated.View style={[styles.infoRow, { borderBottomColor: colors.cardBorder, opacity: discountOpacity }]}>
                  <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                    {isRTL ? 'كوبون الخصم' : 'Coupon Applied'}
                  </Text>
                  <View style={styles.couponBadgeRow}>
                    <View style={[styles.couponBadge, { backgroundColor: SUBSCRIPTION_BLUE }]}>
                      <Ionicons name="pricetag" size={12} color="#fff" style={{ marginRight: 4 }} />
                      <Text style={styles.couponBadgeText}>{appliedCoupon}</Text>
                    </View>
                    <Text style={[styles.discountText, { color: SUBSCRIPTION_BLUE }]}>
                      -${discountAmount}
                    </Text>
                  </View>
                </Animated.View>
              )}

              {/* Final Price Divider */}
              <View style={[styles.finalPriceDivider, { backgroundColor: isDark ? 'rgba(61,158,255,0.12)' : 'rgba(61,158,255,0.10)' }]} />

              {/* Final Price — animated scale + fade */}
              <Animated.View style={[styles.finalPriceBox, { opacity: finalPriceOpacity, transform: [{ scale: finalPriceScale }], overflow: 'hidden' as const }]}>
                <LinearGradient
                  colors={isDark ? (['rgba(30,107,255,0.18)', 'rgba(61,158,255,0.08)'] as const) : (['rgba(61,158,255,0.10)', 'rgba(61,158,255,0.04)'] as const)}
                  style={StyleSheet.absoluteFill}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                />
                <Text style={[styles.finalPriceLabel, { color: isDark ? SUBSCRIPTION_BLUE : '#1E6BFF' }]}>
                  {isRTL ? 'المبلغ النهائي' : 'Final Price'}
                </Text>
                <Text style={[styles.finalPriceValue, { color: SUBSCRIPTION_BLUE }]}>
                  {isFree ? (isRTL ? 'مجاني ✓' : 'FREE ✓') : `$${finalPrice}`}
                </Text>
              </Animated.View>

              {/* Payment Method */}
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                  {isRTL ? 'طريقة الدفع' : 'Payment Method'}
                </Text>
                <View style={styles.paymentMethodRow}>
                  <Ionicons 
                    name={isFree ? 'gift' : (paymentMethod === 'apple-pay' ? 'logo-apple' : 'card')} 
                    size={18} 
                    color={colors.textPrimary} 
                    style={{ marginRight: 6 }} 
                  />
                  <Text style={[styles.infoValue, { color: colors.textPrimary }]}>
                    {isFree 
                      ? (isRTL ? 'خصم 100%' : '100% Discount') 
                      : (paymentMethod === 'apple-pay' ? 'Apple Pay' : paymentMethod === 'card' ? 'Credit Card' : paymentMethod)
                    }
                  </Text>
                </View>
              </View>

              {/* AI Pro Status */}
              {includeAIPro && (
                <View style={[styles.aiProBadge, { backgroundColor: 'rgba(61,158,255,0.08)', borderColor: 'rgba(61,158,255,0.25)' }]}>
                  <Ionicons name="sparkles" size={16} color={SUBSCRIPTION_BLUE} style={{ marginRight: 6 }} />
                  <Text style={{ color: SUBSCRIPTION_BLUE, fontWeight: '700', fontSize: 13 }}>
                    AI Pro {isRTL ? 'مُفعّل' : 'Enabled'}
                  </Text>
                </View>
              )}
            </GlassCardPro>

            {/* Info Box */}
            <View
              style={[
                styles.infoBox,
                {
                  backgroundColor: isDark ? 'rgba(61,158,255,0.08)' : 'rgba(61,158,255,0.06)',
                  borderColor: isDark ? 'rgba(61,158,255,0.35)' : 'rgba(61,158,255,0.25)',
                },
              ]}
            >
              <Ionicons
                name="information-circle"
                size={20}
                color={SUBSCRIPTION_BLUE}
                style={{ marginRight: 12 }}
              />
              <Text
                style={[
                  styles.infoText,
                  { color: isDark ? 'rgba(61,158,255,0.85)' : '#1e40af' },
                ]}
              >
                {isFree
                  ? (isRTL ? 'اشتراكك مجاني. انقر للتأكيد وتفعيل حسابك.' : 'Your subscription is free. Click confirm to activate your account.')
                  : (isRTL ? 'انقر للتأكيد وإتمام الاشتراك.' : 'Click confirm to complete your subscription.')}
              </Text>
            </View>

            {/* Confirm Button */}
            <Animated.View style={{ transform: [{ scale: buttonScale }], opacity: buttonOpacity }}>
              <TouchableOpacity
                style={[
                  styles.confirmButton,
                  {
                    backgroundColor: confirming ? 'rgba(61,158,255,0.5)' : SUBSCRIPTION_BLUE,
                  },
                ]}
                onPress={handleConfirmSubscription}
                onPressIn={onButtonPressIn}
                onPressOut={onButtonPressOut}
                disabled={confirming}
                activeOpacity={0.85}
              >
                {confirming ? (
                  <View style={styles.confirmButtonInner}>
                    <ActivityIndicator size="small" color="#fff" />
                    <Text style={[styles.confirmButtonText, { marginLeft: 10 }]}>
                      {isRTL ? 'جارٍ المعالجة...' : 'Processing...'}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.confirmButtonInner}>
                    <Ionicons
                      name={isFree ? 'checkmark-circle' : 'lock-closed'}
                      size={18}
                      color="#fff"
                      style={{ marginRight: 8 }}
                    />
                    <Text style={styles.confirmButtonText}>
                      {isFree
                        ? (isRTL ? 'تفعيل الوصول المجاني' : 'Activate Free Access')
                        : (isRTL ? 'تأكيد والدفع بأمان' : 'Confirm & Pay Securely')}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </Animated.View>

            {/* Trust Indicators */}
            <View style={styles.trustRow}>
              <View style={styles.trustItem}>
                <Ionicons name="shield-checkmark" size={13} color={isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.3)'} />
                <Text style={[styles.trustText, { color: isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.3)' }]}>
                  {isRTL ? 'آمن ومشفر' : 'Secure & encrypted'}
                </Text>
              </View>
              <View style={[styles.trustDot, { backgroundColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)' }]} />
              <View style={styles.trustItem}>
                <Ionicons name="flash" size={13} color={isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.3)'} />
                <Text style={[styles.trustText, { color: isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.3)' }]}>
                  {isRTL ? 'تفعيل فوري' : 'Instant activation'}
                </Text>
              </View>
              <View style={[styles.trustDot, { backgroundColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)' }]} />
              <View style={styles.trustItem}>
                <Ionicons name="refresh" size={13} color={isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.3)'} />
                <Text style={[styles.trustText, { color: isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.3)' }]}>
                  {isRTL ? 'إلغاء في أي وقت' : 'Cancel anytime'}
                </Text>
              </View>
            </View>

            {/* Back Button */}
            <TouchableOpacity
              style={styles.backButton}
              onPress={goBack}
              disabled={confirming}
            >
              <Text style={[styles.backButtonText, { color: SUBSCRIPTION_BLUE }]}>
                {t('common.back', 'Go Back')}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Success Modal */}
      <Modal
        visible={showSuccessModal}
        transparent
        animationType="none"
        statusBarTranslucent
      >
        <View style={styles.modalOverlay}>
          <Animated.View style={[styles.modalCard, { backgroundColor: colors.card, opacity: modalOpacity, transform: [{ scale: modalScale }] }]}>
            <LinearGradient
              colors={theme.gradient}
              style={styles.modalIconCircle}
            >
              <Animated.View style={{ transform: [{ scale: checkScale }] }}>
                <Ionicons name="checkmark" size={40} color="#fff" />
              </Animated.View>
            </LinearGradient>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
              {isFree
                ? (isRTL ? 'تم التفعيل!' : 'Activated!')
                : (isRTL ? 'تم بنجاح!' : 'Success!')}
            </Text>
            <Text style={[styles.modalMessage, { color: colors.textSecondary }]}>
              {isFree
                ? (isRTL ? 'حسابك المجاني جاهز للاستخدام.' : 'Your free account is ready to use.')
                : (isRTL ? 'تم تأكيد اشتراكك بنجاح!' : 'Your subscription has been confirmed!')}
            </Text>
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: SUBSCRIPTION_BLUE }]}
              onPress={() => {
                setShowSuccessModal(false);
                router.replace(homeRoute as any);
              }}
              activeOpacity={0.8}
            >
              <View style={styles.confirmButtonInner}>
                <Ionicons name="arrow-forward" size={18} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.modalButtonText}>
                  {isRTL ? 'المتابعة إلى لوحة التحكم' : 'Continue to Dashboard'}
                </Text>
              </View>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerBackBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  container: {
    flex: 1,
    paddingTop: 24,
    paddingBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 24,
    opacity: 0.7,
  },

  detailsCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  freeBadge: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'center',
  },
  freeBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  finalPriceRow: {
    paddingVertical: 14,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginVertical: 8,
  },
  infoBox: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 24,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  confirmButton: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#3D9EFF',
    shadowOpacity: 0.40,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  confirmButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  backButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
  // ── Trust Indicators ─────────────────────────────────────────────
  trustRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 8,
    paddingHorizontal: 8,
  },
  trustItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trustText: {
    fontSize: 11,
    fontWeight: '500',
  },
  trustDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    marginHorizontal: 8,
  },
  // ✅ NEW: Section Card styles for detailed confirmation
  sectionCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  sectionIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  infoLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'right',
    maxWidth: '60%',
  },

  planBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  planBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  couponBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  couponBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  couponBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  discountText: {
    fontSize: 13,
    fontWeight: '600',
  },
  finalPriceDivider: {
    height: 1,
    marginTop: 12,
    marginHorizontal: 4,
  },
  finalPriceBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginTop: 12,
    marginBottom: 16,
  },
  finalPriceLabel: {
    fontSize: 15,
    fontWeight: '700',
  },
  finalPriceValue: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  paymentMethodRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  aiProBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 8,
  },

  // ── Hero Section ─────────────────────────────────────────────────
  heroContainer: {
    borderRadius: 22,
    marginBottom: 24,
    paddingVertical: 28,
    paddingHorizontal: 28,
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(61,158,255,0.18)',
    shadowColor: '#3D9EFF',
    shadowOpacity: 0.14,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
  },
  heroBlurCircle1: {
    position: 'absolute',
    top: -20,
    right: -30,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(61,158,255,0.03)',
  },
  heroBlurCircle2: {
    position: 'absolute',
    bottom: -15,
    left: -25,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(61,158,255,0.03)',
  },
  heroBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    marginBottom: 14,
  },
  heroBadgePillText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  heroHeadline: {
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  heroSubline: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 20,
  },

  // ── Success Modal ────────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 12,
  },
  modalIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 8,
  },
  modalMessage: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  modalButton: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
});
