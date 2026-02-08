import { db } from '@/firebaseConfig';
import i18n from '@/i18n';
import { useTheme } from '@/src/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import { doc, setDoc } from 'firebase/firestore';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, BackHandler, Image, KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

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
  const [clinicImageUrl, setClinicImageUrl] = useState<string | null>(null);

  // ✅ NEW: Additional fields for detailed confirmation
  const [clinicName, setClinicName] = useState('');
  const [clinicPhone, setClinicPhone] = useState('');
  const [personalPhone, setPersonalPhone] = useState('');  // ✅ Personal/Account phone
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [clinicType, setClinicType] = useState<'dental' | 'beauty' | 'laser' | ''>('');  // ✅ Clinic type for navigation

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
          const imageUrl = results[8]?.[1] || null;
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

          console.log('[CONFIRM] ====== PRICE CALCULATION DEBUG ======');
          console.log('[CONFIRM] Raw AsyncStorage values:', {
            'pendingSubscriptionPrice (base)': basePriceStr,
            'pendingSubscriptionPriceWithAIPro': priceWithAIProStr,
            'pendingFinalPrice (after coupon)': actualFinalPriceStr,
            'pendingAppliedCoupon': coupon,
          });
          console.log('[CONFIRM] Calculated values:', {
            baseNum,
            finalNum,
            discount,
            isFreeSubscription,
          });
          console.log('[CONFIRM] Plan info:', {
            planName,
            paymentMethod: method,
          });
          console.log('[CONFIRM] =====================================');

          setPlanLabel(planName);
          setBasePrice(baseNum.toFixed(2));
          setFinalPrice(finalNum.toFixed(2));
          setDiscountAmount(discount > 0 ? discount.toFixed(2) : '0');
          setPaymentMethod(method);
          setAppliedCoupon(coupon);
          setEmail(userEmail);
          setClinicId(cId);
          setIncludeAIPro(hasAIPro);
          setClinicImageUrl(imageUrl);
          
          // ✅ Set additional fields
          setClinicName(cName);
          setClinicPhone(cPhone);
          setPersonalPhone(pPhone);  // ✅ Personal phone
          setFirstName(fName);
          setLastName(lName);
          setCountry(countryCode);
          setCity(cityName);
          setClinicType(cType);  // ✅ Set clinic type for navigation

          // ✅ CRITICAL: Log clinicId status
          console.log('[CONFIRM] ====== CLINIC ID CHECK ======');
          console.log('[CONFIRM] clinicId from AsyncStorage:', cId || 'EMPTY/NULL');
          if (!cId) {
            console.error('[CONFIRM] WARNING: No clinicId found in AsyncStorage!');
          }
          console.log('[CONFIRM] ================================');

          console.log('[CONFIRM] Loaded subscription data:', {
            clinicId: cId || 'MISSING',
            planName,
            basePrice: baseNum.toFixed(2),
            finalPrice: finalNum.toFixed(2),
            discount: discount > 0 ? discount.toFixed(2) : '0',
            coupon,
            email: userEmail,
            includeAIPro: hasAIPro,
            clinicImageUrl: imageUrl ? 'present' : 'none',
            isFreeSubscription: finalNum === 0,
            clinicName: cName,
            clinicPhone: cPhone,
            personalPhone: pPhone,
            firstName: fName,
            lastName: lName,
            country: countryCode,
            city: cityName,
          });
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
      console.log('[EMAIL] Sending confirmation email to:', userEmail);
      console.log('[EMAIL] Subscription details:', subscriptionDetails);

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

      console.log('[EMAIL] Email content:', emailContent);

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

      console.log('[CONFIRM] Starting subscription confirmation for clinic:', clinicId);

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

      console.log('[CONFIRM] Sending confirmation email with data:', emailData);
      await sendConfirmationEmail(email, emailData);

      // ✅ CRITICAL: Mark subscription as confirmed in Firestore
      // This MUST succeed for the subscription to be valid
      console.log('[CONFIRM] Updating Firestore with subscribed=true for clinic:', clinicId);
      
      await setDoc(doc(db, 'clinics', clinicId), {
        subscribed: true,
        subscriptionConfirmedAt: Date.now(),
        subscriptionPlan: planLabel.includes('Annual') ? 'YEARLY' : 'MONTHLY',
        appliedCoupon: appliedCoupon || null,
        finalPrice: parseFloat(finalPrice),
        basePrice: parseFloat(basePrice),
        // ✅ Also mark setup as complete if basic info exists
        setupComplete: true,
      }, { merge: true });

      console.log('[CONFIRM] ✅ SUCCESS: Subscription confirmed in Firestore for clinic:', clinicId);

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

      console.log('[CONFIRM] Cleared pending subscription data from AsyncStorage');
      console.log('[CONFIRM] Confirmed clinic ID preserved:', confirmedClinicId);

      setConfirming(false);
      
      // ✅ Determine navigation route based on clinic type
      const getHomeRoute = (type: string): string => {
        switch (type) {
          case 'dental':
            return '/clinic/dental-home';
          case 'beauty':
            return '/clinic/beauty-home';
          case 'laser':
            return '/clinic/laser-home';
          default:
            return '/clinic/login';  // Fallback to login
        }
      };
      
      const homeRoute = getHomeRoute(clinicType);
      console.log('[CONFIRM] Clinic type:', clinicType, '-> Navigating to:', homeRoute);
      
      // Show success message and navigate based on clinic type
      Alert.alert(
        t('common.success', 'Success'),
        t('subscription.confirmationSuccess', 'Your subscription has been confirmed! Please log in to access your dashboard.'),
        [{ 
          text: t('auth.login', 'Log In'), 
          onPress: () => router.replace(homeRoute as any)
        }]
      );

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
    <SafeAreaView style={[{ backgroundColor: colors.background }, { flex: 1 }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.cardBorder }]}>
            <TouchableOpacity style={styles.headerBackBtn} onPress={goBack} disabled={confirming}>
              <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>BeSmile AI</Text>
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

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* SECTION 1: CLINIC INFO */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              <View style={styles.sectionHeader}>
                <View style={[styles.sectionIconBox, { backgroundColor: '#3b82f6' }]}>
                  <Ionicons name="business" size={20} color="#fff" />
                </View>
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                  {isRTL ? 'معلومات العيادة' : 'Clinic Info'}
                </Text>
              </View>

              {/* Clinic Image */}
              {clinicImageUrl && (
                <View style={styles.clinicImageWrapper}>
                  <Image
                    source={{ uri: clinicImageUrl }}
                    style={styles.clinicImageSmall}
                    resizeMode="cover"
                  />
                </View>
              )}

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
            </View>

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* SECTION 2: ACCOUNT INFO */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              <View style={styles.sectionHeader}>
                <View style={[styles.sectionIconBox, { backgroundColor: '#8b5cf6' }]}>
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
            </View>

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* SECTION 3: PLAN INFO */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            <View
              style={[
                styles.sectionCard,
                {
                  backgroundColor: colors.card,
                  borderColor: parseFloat(finalPrice) === 0 ? '#10b981' : colors.accentBlue,
                  borderWidth: 2,
                },
              ]}
            >
              <View style={styles.sectionHeader}>
                <View style={[styles.sectionIconBox, { backgroundColor: parseFloat(finalPrice) === 0 ? '#10b981' : colors.accentBlue }]}>
                  <Ionicons name="card" size={20} color="#fff" />
                </View>
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                  {isRTL ? 'معلومات الاشتراك' : 'Plan Info'}
                </Text>
                {/* Badge */}
                <View style={[styles.planBadge, { backgroundColor: parseFloat(finalPrice) === 0 ? '#10b981' : colors.accentBlue }]}>
                  <Text style={styles.planBadgeText}>
                    {parseFloat(finalPrice) === 0 ? 'FREE' : 'PAID'}
                  </Text>
                </View>
              </View>

              {/* Plan Type */}
              <View style={[styles.infoRow, { borderBottomColor: colors.cardBorder }]}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                  {isRTL ? 'نوع الخطة' : 'Plan Type'}
                </Text>
                <Text style={[styles.infoValue, { color: parseFloat(finalPrice) === 0 ? '#10b981' : colors.accentBlue, fontWeight: '700' }]}>
                  {parseFloat(finalPrice) === 0 ? (isRTL ? 'اشتراك مجاني' : 'Free Subscription') : planLabel}
                </Text>
              </View>

              {/* Base Price */}
              <View style={[styles.infoRow, { borderBottomColor: colors.cardBorder }]}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                  {isRTL ? 'السعر الأساسي' : 'Base Price'}
                </Text>
                <Text style={[styles.infoValue, { color: colors.textPrimary }]}>
                  ${basePrice}
                </Text>
              </View>

              {/* Applied Coupon (if exists) */}
              {appliedCoupon && parseFloat(discountAmount) > 0 && (
                <View style={[styles.infoRow, { borderBottomColor: colors.cardBorder }]}>
                  <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                    {isRTL ? 'كوبون الخصم' : 'Coupon Applied'}
                  </Text>
                  <View style={styles.couponBadgeRow}>
                    <View style={[styles.couponBadge, { backgroundColor: '#10b981' }]}>
                      <Ionicons name="pricetag" size={12} color="#fff" style={{ marginRight: 4 }} />
                      <Text style={styles.couponBadgeText}>{appliedCoupon}</Text>
                    </View>
                    <Text style={[styles.discountText, { color: '#10b981' }]}>
                      -${discountAmount}
                    </Text>
                  </View>
                </View>
              )}

              {/* Final Price */}
              <View style={[styles.finalPriceBox, { backgroundColor: parseFloat(finalPrice) === 0 ? '#dcfce7' : (isDark ? '#1e3a8a' : '#dbeafe') }]}>
                <Text style={[styles.finalPriceLabel, { color: parseFloat(finalPrice) === 0 ? '#166534' : (isDark ? '#93c5fd' : '#1e40af') }]}>
                  {isRTL ? 'المبلغ النهائي' : 'Final Price'}
                </Text>
                <Text style={[styles.finalPriceValue, { color: parseFloat(finalPrice) === 0 ? '#16a34a' : colors.accentBlue }]}>
                  {parseFloat(finalPrice) === 0 ? (isRTL ? 'مجاني ✓' : 'FREE ✓') : `$${finalPrice}`}
                </Text>
              </View>

              {/* Payment Method */}
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                  {isRTL ? 'طريقة الدفع' : 'Payment Method'}
                </Text>
                <View style={styles.paymentMethodRow}>
                  <Ionicons 
                    name={parseFloat(finalPrice) === 0 ? 'gift' : (paymentMethod === 'apple-pay' ? 'logo-apple' : 'card')} 
                    size={18} 
                    color={colors.textPrimary} 
                    style={{ marginRight: 6 }} 
                  />
                  <Text style={[styles.infoValue, { color: colors.textPrimary }]}>
                    {parseFloat(finalPrice) === 0 
                      ? (isRTL ? 'خصم 100%' : '100% Discount') 
                      : (paymentMethod === 'apple-pay' ? 'Apple Pay' : paymentMethod === 'card' ? 'Credit Card' : paymentMethod)
                    }
                  </Text>
                </View>
              </View>

              {/* AI Pro Status */}
              {includeAIPro && (
                <View style={[styles.aiProBadge, { backgroundColor: '#fef3c7', borderColor: '#f59e0b' }]}>
                  <Ionicons name="sparkles" size={16} color="#d97706" style={{ marginRight: 6 }} />
                  <Text style={{ color: '#92400e', fontWeight: '700', fontSize: 13 }}>
                    AI Pro {isRTL ? 'مُفعّل' : 'Enabled'}
                  </Text>
                </View>
              )}
            </View>

            {/* Info Box */}
            <View
              style={[
                styles.infoBox,
                {
                  backgroundColor: isDark ? '#1e3a8a' : '#eff6ff',
                  borderColor: isDark ? '#3b82f6' : '#60a5fa',
                },
              ]}
            >
              <Ionicons
                name="information-circle"
                size={20}
                color={colors.accentBlue}
                style={{ marginRight: 12 }}
              />
              <Text
                style={[
                  styles.infoText,
                  { color: isDark ? '#bfdbfe' : '#1e40af' },
                ]}
              >
                {parseFloat(finalPrice) === 0
                  ? (isRTL ? 'اشتراكك مجاني. انقر للتأكيد وتفعيل حسابك.' : 'Your subscription is free. Click confirm to activate your account.')
                  : (isRTL ? 'انقر للتأكيد وإتمام الاشتراك.' : 'Click confirm to complete your subscription.')}
              </Text>
            </View>

            {/* Confirm Button */}
            <TouchableOpacity
              style={[
                styles.confirmButton,
                {
                  backgroundColor: parseFloat(finalPrice) === 0 ? '#10b981' : colors.accentBlue,
                  opacity: confirming ? 0.6 : 1,
                },
              ]}
              onPress={handleConfirmSubscription}
              disabled={confirming}
              activeOpacity={0.8}
            >
              {confirming ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.confirmButtonText}>
                  {parseFloat(finalPrice) === 0 
                    ? (isRTL ? 'تأكيد الاشتراك المجاني ✓' : 'Complete FREE Subscription ✓')
                    : t('subscription.confirm', 'Confirm Subscription')}
                </Text>
              )}
            </TouchableOpacity>

            {/* Back Button */}
            <TouchableOpacity
              style={styles.backButton}
              onPress={goBack}
              disabled={confirming}
            >
              <Text style={[styles.backButtonText, { color: colors.accentBlue }]}>
                {t('common.back', 'Go Back')}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
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
    paddingVertical: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 24,
  },
  clinicImageContainer: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  clinicImage: {
    width: '100%',
    height: '100%',
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
    marginBottom: 20,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  confirmButton: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
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
  clinicImageWrapper: {
    width: '100%',
    height: 140,
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 12,
  },
  clinicImageSmall: {
    width: '100%',
    height: '100%',
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
    fontSize: 14,
    fontWeight: '700',
  },
  finalPriceBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: 10,
    marginVertical: 12,
  },
  finalPriceLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  finalPriceValue: {
    fontSize: 22,
    fontWeight: '800',
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
});
