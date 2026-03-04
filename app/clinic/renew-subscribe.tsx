/**
 * Renew Subscription — Plan Selection Screen (Phase R2)
 *
 * Reached after successful Firebase Auth sign-in from the Renew Login Sheet.
 * Allows inactive clinics to choose a new plan + AI Pro toggle, then
 * writes pending keys to AsyncStorage and navigates to the payment screen.
 *
 * No Firestore writes. No upgrade-screen reuse.
 */

import { db } from '@/firebaseConfig';
import GlassCard from '@/src/components/GlassCard';
import { PremiumGradientBackground } from '@/src/components/PremiumGradientBackground';
import { useAuth } from '@/src/context/AuthContext';
import { useTheme } from '@/src/context/ThemeContext';
import { SUBSCRIPTION_PRICING, SUBSCRIPTION_PRICING_OLD } from '@/src/types/subscription';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    ActivityIndicator,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

// ── Constants ────────────────────────────────────────────────────────────

const ACCENT = '#3D9EFF';
const ACCENT_SOFT = 'rgba(61,158,255,0.12)';
const ACCENT_BORDER = 'rgba(61,158,255,0.35)';

type PlanPeriod = 'MONTHLY' | 'ANNUAL';

// ── Component ────────────────────────────────────────────────────────────

export default function RenewSubscribeScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const { clinicId } = useAuth();

  // ── Guard state ────────────────────────────────────────────────────
  const [guardLoading, setGuardLoading] = useState(true);
  const [clinicName, setClinicName] = useState('');
  const [clinicEmail, setClinicEmail] = useState('');
  const [clinicPhone, setClinicPhone] = useState('');
  const [clinicType, setClinicType] = useState<'dental' | 'beauty' | 'laser' | ''>('');

  // ── Plan selection state ───────────────────────────────────────────
  const [selectedPeriod, setSelectedPeriod] = useState<PlanPeriod | null>(null);
  const [includeAIPro, setIncludeAIPro] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Payment method state ───────────────────────────────────────────
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'card' | 'apple-pay' | 'paypal' | 'google-pay' | null>(null);
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');

  // ── Coupon state ───────────────────────────────────────────────────
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [couponMessage, setCouponMessage] = useState('');
  const [couponError, setCouponError] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);

  // ── Plans ─────────────────────────────────────────────────────────
  const plans = useMemo(() => [
    {
      id: 'MONTHLY' as PlanPeriod,
      name: t('subscription.monthlyPlan', 'Monthly'),
      basePrice: SUBSCRIPTION_PRICING.monthly,
      oldPrice: SUBSCRIPTION_PRICING_OLD.monthly,
      period: t('subscription.perMonth', '/month'),
      badge: t('subscription.recommended', 'Best value'),
    },
    {
      id: 'ANNUAL' as PlanPeriod,
      name: t('subscription.yearlyPlan', 'Annual'),
      basePrice: SUBSCRIPTION_PRICING.yearly,
      oldPrice: SUBSCRIPTION_PRICING_OLD.yearly,
      period: t('subscription.perYear', '/year'),
      equivalent: `$${SUBSCRIPTION_PRICING.yearlyMonthlyEquivalent.toFixed(2)}/mo`,
      savings: `Save $${SUBSCRIPTION_PRICING.savingsAmount.toFixed(2)}`,
      badge: t('subscription.bestDeal', 'Best deal'),
    },
  ], [t]);

  // ── Guard: Only cancelled clinics may access ──────────────────────
  useEffect(() => {
    const checkAccess = async () => {
      try {
        const targetId = clinicId || (await AsyncStorage.getItem('clinicId'));
        if (!targetId) {
          router.replace('/clinic/subscribe' as any);
          return;
        }

        const snap = await getDoc(doc(db, 'clinics', targetId));
        if (!snap.exists()) {
          router.replace('/clinic/subscribe' as any);
          return;
        }

        const data = snap.data();
        const INACTIVE_STATUSES = ['cancelled', 'expired', 'inactive', 'past_due'];
        if (!INACTIVE_STATUSES.includes(data.status)) {
          // Active or unknown — send to home or subscribe
          router.replace('/(tabs)/home' as any);
          return;
        }

        // Stash clinic data for pending keys
        setClinicName((data.clinicName as string) || '');
        setClinicEmail((data.email as string) || '');
        setClinicPhone((data.clinicPhone as string) || '');
        setClinicType((data.clinicType as 'dental' | 'beauty' | 'laser' | '') || '');
        setGuardLoading(false);
      } catch (err) {
        console.error('[RenewSubscribe] Guard error:', err);
        router.replace('/clinic/subscribe' as any);
      }
    };

    checkAccess();
  }, [clinicId]);

  // ── Computed price (includes coupon discount) ──────────────────────
  const computedPrice = useMemo(() => {
    if (!selectedPeriod) return null;
    const plan = plans.find(p => p.id === selectedPeriod);
    if (!plan) return null;
    const aiAdd = selectedPeriod === 'ANNUAL'
      ? SUBSCRIPTION_PRICING.aiProYearly
      : SUBSCRIPTION_PRICING.aiPro;
    const base = includeAIPro ? plan.basePrice + aiAdd : plan.basePrice;
    // Apply coupon discount
    const final = discountPercent > 0
      ? parseFloat((base * (1 - discountPercent / 100)).toFixed(2))
      : base;
    return {
      base,
      final,
      period: plan.period,
      name: plan.name,
    };
  }, [selectedPeriod, includeAIPro, plans, discountPercent]);

  // ── Coupon logic ──────────────────────────────────────────────────
  const applyCouponCode = () => {
    const code = couponCode.trim().toUpperCase();
    if (!code) {
      setCouponError('Please enter a coupon code');
      setCouponMessage('');
      return;
    }

    let isValid = false;
    let percent = 0;

    if (code === 'FREE1YEAR' || code === 'FREEYEAR' || code === 'LIFETIME100') {
      percent = 100;
      isValid = true;
    } else if (code === 'DEMO50') {
      percent = 50;
      isValid = true;
    }

    if (isValid) {
      setAppliedCoupon(code);
      setDiscountPercent(percent);
      setCouponMessage(`✓ Coupon Applied! (${percent}% off)`);
      setCouponError('');
    } else {
      setCouponError('Invalid Coupon Code');
      setCouponMessage('');
      setAppliedCoupon(null);
      setDiscountPercent(0);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setDiscountPercent(0);
    setCouponCode('');
    setCouponMessage('');
    setCouponError('');
  };

  // ── Card validation ───────────────────────────────────────────────
  const isCardValid = () => {
    if (selectedPaymentMethod !== 'card') return true;
    const num = cardNumber.replace(/\s+/g, '');
    const numOk = /^\d{15,19}$/.test(num);
    const expOk = /^(0[1-9]|1[0-2])\/(\d{2}|\d{4})$/.test(cardExpiry);
    const cvcOk = /^\d{3,4}$/.test(cardCvc);
    const nameOk = cardName.trim().length >= 2;
    return numOk && expOk && cvcOk && nameOk;
  };

  // ── Can confirm ───────────────────────────────────────────────────
  const canConfirm = selectedPeriod !== null
    && selectedPaymentMethod !== null
    && (selectedPaymentMethod !== 'card' || isCardValid())
    && !isSubmitting;

  // ── Confirm handler ───────────────────────────────────────────────
  const handleConfirm = async () => {
    if (!selectedPeriod || !computedPrice) return;
    if (!selectedPaymentMethod) {
      setError('Please select a payment method.');
      return;
    }
    if (selectedPaymentMethod === 'card' && !isCardValid()) {
      setError('Please fill in valid card details.');
      return;
    }
    setError(null);

    try {
      setIsSubmitting(true);

      const targetClinicId = clinicId || (await AsyncStorage.getItem('clinicId')) || '';

      // Write ALL pending keys that confirm-subscription.tsx expects (20 keys)
      const pendingKeys: [string, string][] = [
        ['pendingSubscriptionPlan', selectedPeriod],
        ['pendingSubscriptionPlanName', computedPrice.name],
        ['pendingSubscriptionPrice', computedPrice.base.toFixed(2)],
        ['pendingSubscriptionPriceWithAIPro', computedPrice.final.toFixed(2)],
        ['pendingFinalPrice', computedPrice.final.toFixed(2)],
        ['pendingIncludeAIPro', String(includeAIPro)],
        ['pendingClinicName', clinicName || ''],
        ['pendingSubscriptionEmail', clinicEmail],
        ['pendingPaymentMethod', selectedPaymentMethod],
        ['pendingAppliedCoupon', appliedCoupon || ''],
        ['pendingClinicPhone', clinicPhone],
        ['pendingClinicType', clinicType],
        // Card details (empty strings if not using card)
        ['pendingCardName', selectedPaymentMethod === 'card' ? cardName : ''],
        ['pendingCardNumber', selectedPaymentMethod === 'card' ? cardNumber : ''],
        ['pendingCardExpiry', selectedPaymentMethod === 'card' ? cardExpiry : ''],
        // Renew flow — no credential linking needed (user already authenticated)
        ['pendingPassword', ''],
        // Personal info from Firestore (already exists for existing clinics)
        ['pendingFirstName', ''],
        ['pendingLastName', ''],
        ['pendingCountry', ''],
        ['pendingCity', ''],
        ['pendingPhone', ''],
        ['pendingWorkingHours', ''],
        ['clinicId', targetClinicId],
      ];

      await AsyncStorage.multiSet(pendingKeys);

      // Small delay to ensure AsyncStorage flush
      await new Promise(r => setTimeout(r, 80));

      router.replace('/clinic/confirm-subscription' as any);
    } catch (err) {
      console.error('[RenewSubscribe] Confirm error:', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Loading state ─────────────────────────────────────────────────
  if (guardLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={ACCENT} />
      </View>
    );
  }

  // ── Render ────────────────────────────────────────────────────────
  return (
    <View style={{ flex: 1 }}>
      <PremiumGradientBackground isDark={isDark} showSparkles={!isDark} />

      <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Header ── */}
          <View style={[styles.header, { borderBottomColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }]}>
            <TouchableOpacity style={styles.headerBackBtn} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Renew Subscription</Text>
            <View style={{ width: 44 }} />
          </View>

          <View style={styles.cardContainer}>
            {/* ── Section Title ── */}
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Choose Your Plan</Text>

            {/* ── Plan Cards ── */}
            <View style={styles.planGrid}>
              {plans.map((plan) => {
                const isSelected = selectedPeriod === plan.id;
                return (
                  <TouchableOpacity
                    key={plan.id}
                    activeOpacity={0.88}
                    onPress={() => setSelectedPeriod(plan.id)}
                    style={{ width: '48%' }}
                  >
                    <GlassCard
                      intensity={isSelected ? 55 : 35}
                      tint={isDark ? 'dark' : 'light'}
                      borderRadius={22}
                      style={[
                        styles.planCardGlass,
                        isSelected
                          ? styles.planCardSelected
                          : {
                              borderColor: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.08)',
                              borderWidth: 1,
                            },
                      ]}
                    >
                      {/* Glass reflection */}
                      <LinearGradient
                        colors={[
                          isDark ? 'rgba(255,255,255,0.045)' : 'rgba(255,255,255,0.32)',
                          'transparent',
                        ]}
                        style={styles.planReflection}
                        pointerEvents="none"
                      />

                      <View style={styles.planHeader}>
                        <Text style={[styles.planName, { color: colors.textPrimary }]}>{plan.name}</Text>
                        {plan.badge && (
                          <View style={[styles.badge, { backgroundColor: isDark ? 'rgba(61,158,255,0.18)' : 'rgba(61,158,255,0.14)', borderColor: isDark ? 'rgba(61,158,255,0.45)' : ACCENT_BORDER, borderWidth: 1 }]}>
                            <Text style={[styles.badgeText, { color: isDark ? '#6DB8FF' : ACCENT }]}>{plan.badge}</Text>
                          </View>
                        )}
                      </View>

                      {/* Price */}
                      <View style={styles.priceSection}>
                        <View style={styles.priceRow}>
                          <Text
                            style={[styles.planPrice, { color: colors.textPrimary }]}
                            numberOfLines={1}
                            adjustsFontSizeToFit
                            minimumFontScale={0.7}
                          >
                            ${plan.basePrice.toFixed(2)}
                          </Text>
                          <Text style={[styles.planPeriod, { color: isDark ? '#E5E7EB' : '#4B5563' }]}>
                            {plan.period}
                          </Text>
                        </View>
                        <Text style={[styles.oldPrice, { color: isDark ? 'rgba(255,255,255,0.22)' : 'rgba(156,163,175,0.6)' }]}>
                          <Text style={{ textDecorationLine: 'line-through' }}>${plan.oldPrice.toFixed(2)}</Text>
                        </Text>
                        {plan.equivalent && (
                          <Text style={[styles.equivalent, { color: isDark ? 'rgba(255,255,255,0.35)' : '#9CA3AF' }]}>{plan.equivalent}</Text>
                        )}
                        {plan.savings && (
                          <Text style={[styles.savings, { color: isDark ? 'rgba(61,158,255,0.85)' : ACCENT }]}>{plan.savings}</Text>
                        )}
                      </View>

                      {/* Selected indicator */}
                      {isSelected && (
                        <View style={[styles.selectedChip, { borderColor: ACCENT, backgroundColor: ACCENT_SOFT }]}>
                          <Ionicons name="checkmark-circle" size={14} color={ACCENT} />
                          <Text style={[styles.selectedChipText, { color: ACCENT }]}>Selected</Text>
                        </View>
                      )}
                    </GlassCard>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* ── Divider + AI Pro ── */}
            <View style={[styles.divider, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' }]} />
            <Text style={[styles.sectionLabel, { color: isDark ? 'rgba(255,255,255,0.32)' : '#9CA3AF' }]}>ADD-ONS</Text>

            <GlassCard
              intensity={includeAIPro ? 55 : 45}
              tint={isDark ? 'dark' : 'light'}
              borderRadius={22}
              style={[styles.aiProGlass, {
                borderColor: includeAIPro ? ACCENT : isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)',
                borderWidth: includeAIPro ? 1.5 : StyleSheet.hairlineWidth,
              }]}
            >
              <View style={styles.aiProHeader}>
                <View style={styles.aiProTitleRow}>
                  <View style={[styles.aiProIconWrap, { backgroundColor: ACCENT_SOFT }]}>
                    <Ionicons name="sparkles" size={16} color={ACCENT} />
                  </View>
                  <Text style={[styles.aiProTitle, { color: colors.textPrimary }]}>
                    {t('subscription.aiProAddOn', `AI Pro - $${SUBSCRIPTION_PRICING.aiPro.toFixed(2)}`)}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[
                    styles.aiProSwitch,
                    { backgroundColor: includeAIPro ? ACCENT : isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.16)' },
                  ]}
                  onPress={() => setIncludeAIPro(prev => !prev)}
                  activeOpacity={0.7}
                >
                  <View style={[
                    styles.aiProSwitchKnob,
                    { backgroundColor: '#fff', transform: [{ translateX: includeAIPro ? 18 : 2 }] },
                  ]} />
                </TouchableOpacity>
              </View>

              <Text style={[styles.aiProDesc, { color: isDark ? 'rgba(255,255,255,0.52)' : colors.textSecondary }]}>
                {t('subscription.aiProDescription', 'Advanced AI features for your clinic')}
              </Text>

              <View style={styles.aiProFeatures}>
                {[
                  t('subscription.aiProFeature1', 'Intelligent note generation'),
                  t('subscription.aiProFeature2', 'Patient message analysis'),
                  t('subscription.aiProFeature3', 'Treatment recommendations'),
                ].map((feat, idx) => (
                  <View key={idx} style={styles.aiProFeatureItem}>
                    <Ionicons name="checkmark-circle" size={15} color={ACCENT} />
                    <Text style={[styles.aiProFeatureText, { color: isDark ? 'rgba(255,255,255,0.74)' : colors.textPrimary }]}>{feat}</Text>
                  </View>
                ))}
              </View>
            </GlassCard>

            {/* ── Error banner ── */}
            {error && (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle" size={16} color="#ef4444" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* ── Payment Method Selection ── */}
            <View style={[styles.divider, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' }]} />
            <Text style={[styles.sectionLabel, { color: isDark ? 'rgba(255,255,255,0.32)' : '#9CA3AF' }]}>PAYMENT</Text>

            <GlassCard
              intensity={45}
              tint={isDark ? 'dark' : 'light'}
              borderRadius={22}
              style={[styles.paymentSection]}
            >
              <Text style={[styles.paymentSectionTitle, { color: colors.textPrimary }]}>
                {t('payment.chooseMethod', 'Payment Method')}
              </Text>

              {/* Free subscription banner */}
              {computedPrice && computedPrice.final === 0 && (
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
                  onPress={() => setSelectedPaymentMethod('card')}
                  disabled={isSubmitting}
                  activeOpacity={0.7}
                >
                  <View style={[styles.paymentMethodIcon, selectedPaymentMethod === 'card' && styles.paymentMethodIconSelected]}>
                    <MaterialCommunityIcons name="credit-card" size={26} color={selectedPaymentMethod === 'card' ? '#fff' : ACCENT} />
                  </View>
                  <Text style={[styles.paymentMethodLabelText, { color: colors.textPrimary }]}>{t('payment.card', 'Card')}</Text>
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
                  onPress={() => setSelectedPaymentMethod('apple-pay')}
                  disabled={isSubmitting}
                  activeOpacity={0.7}
                >
                  <View style={[styles.paymentMethodIcon, { backgroundColor: 'rgba(0,0,0,0.05)' }, selectedPaymentMethod === 'apple-pay' && { backgroundColor: '#000' }]}>
                    <MaterialCommunityIcons name="apple" size={26} color={selectedPaymentMethod === 'apple-pay' ? '#fff' : '#000'} />
                  </View>
                  <Text style={[styles.paymentMethodLabelText, { color: colors.textPrimary }]}>{t('payment.applePay', 'Apple Pay')}</Text>
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
                  onPress={() => setSelectedPaymentMethod('paypal')}
                  disabled={isSubmitting}
                  activeOpacity={0.7}
                >
                  <View style={[styles.paymentMethodIcon, { backgroundColor: 'rgba(0,48,135,0.1)' }, selectedPaymentMethod === 'paypal' && { backgroundColor: '#003087' }]}>
                    <MaterialCommunityIcons name="credit-card-outline" size={26} color={selectedPaymentMethod === 'paypal' ? '#fff' : '#003087'} />
                  </View>
                  <Text style={[styles.paymentMethodLabelText, { color: colors.textPrimary }]}>{t('payment.paypal', 'PayPal')}</Text>
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
                  onPress={() => setSelectedPaymentMethod('google-pay')}
                  disabled={isSubmitting}
                  activeOpacity={0.7}
                >
                  <View style={[styles.paymentMethodIcon, { backgroundColor: 'rgba(66,133,244,0.1)' }, selectedPaymentMethod === 'google-pay' && { backgroundColor: '#4285f4' }]}>
                    <MaterialCommunityIcons name="wallet-outline" size={26} color={selectedPaymentMethod === 'google-pay' ? '#fff' : '#4285f4'} />
                  </View>
                  <Text style={[styles.paymentMethodLabelText, { color: colors.textPrimary }]}>{t('payment.googlePay', 'Google Pay')}</Text>
                  {selectedPaymentMethod === 'google-pay' && (
                    <View style={[styles.paymentCheckmark, { backgroundColor: '#4285f4' }]}>
                      <Ionicons name="checkmark" size={14} color="#fff" />
                    </View>
                  )}
                </TouchableOpacity>
              </View>

              {!selectedPaymentMethod && (
                <Text style={[styles.validationHint, { color: '#ef4444' }]}>
                  {t('payment.selectMethod', 'Please select a payment method')}
                </Text>
              )}
            </GlassCard>

            {/* ── Card Details (only when card selected) ── */}
            {selectedPaymentMethod === 'card' && (
              <GlassCard
                intensity={45}
                tint={isDark ? 'dark' : 'light'}
                borderRadius={22}
                style={[styles.paymentSection]}
              >
                <Text style={[styles.paymentSectionTitle, { color: colors.textPrimary }]}>
                  {t('payment.cardDetails', 'Card Details')}
                </Text>

                <TextInput
                  style={[styles.cardInput, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.9)', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)', color: colors.textPrimary }]}
                  placeholder={t('payment.nameOnCard', 'Name on card')}
                  placeholderTextColor={isDark ? 'rgba(255,255,255,0.35)' : '#9CA3AF'}
                  value={cardName}
                  onChangeText={setCardName}
                  editable={!isSubmitting}
                  autoCapitalize="words"
                />
                <TextInput
                  style={[styles.cardInput, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.9)', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)', color: colors.textPrimary }]}
                  placeholder={t('payment.cardNumber', 'Card number')}
                  placeholderTextColor={isDark ? 'rgba(255,255,255,0.35)' : '#9CA3AF'}
                  keyboardType="number-pad"
                  value={cardNumber}
                  onChangeText={setCardNumber}
                  editable={!isSubmitting}
                  maxLength={19}
                />
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <TextInput
                    style={[styles.cardInput, { flex: 1, backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.9)', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)', color: colors.textPrimary }]}
                    placeholder={t('payment.expiry', 'MM/YY')}
                    placeholderTextColor={isDark ? 'rgba(255,255,255,0.35)' : '#9CA3AF'}
                    keyboardType="number-pad"
                    value={cardExpiry}
                    onChangeText={setCardExpiry}
                    editable={!isSubmitting}
                    maxLength={7}
                  />
                  <TextInput
                    style={[styles.cardInput, { flex: 1, backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.9)', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)', color: colors.textPrimary }]}
                    placeholder={t('payment.cvc', 'CVC')}
                    placeholderTextColor={isDark ? 'rgba(255,255,255,0.35)' : '#9CA3AF'}
                    keyboardType="number-pad"
                    value={cardCvc}
                    onChangeText={setCardCvc}
                    editable={!isSubmitting}
                    maxLength={4}
                  />
                </View>

                {computedPrice && (
                  <View style={styles.totalRow}>
                    <Text style={[styles.totalLabel, { color: isDark ? 'rgba(255,255,255,0.52)' : colors.textSecondary }]}>
                      {t('payment.totalDue', 'Total due today')}
                    </Text>
                    <Text style={[styles.totalValue, { color: colors.textPrimary }]}>
                      ${computedPrice.final.toFixed(2)}
                    </Text>
                  </View>
                )}
              </GlassCard>
            )}

            {/* ── Coupon Code Section ── */}
            <View style={[styles.divider, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' }]} />
            <Text style={[styles.sectionLabel, { color: isDark ? 'rgba(255,255,255,0.32)' : '#9CA3AF' }]}>PROMO</Text>

            <GlassCard
              intensity={40}
              tint={isDark ? 'dark' : 'light'}
              borderRadius={22}
              style={[styles.paymentSection]}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                <Ionicons name="pricetag-outline" size={18} color={colors.textSecondary} style={{ marginRight: 8 }} />
                <Text style={[styles.paymentSectionTitle, { color: colors.textPrimary, marginBottom: 0 }]}>
                  {t('payment.couponCode', 'Coupon Code')}
                </Text>
              </View>

              <View style={{ flexDirection: 'row', gap: 10, marginBottom: 8 }}>
                <TextInput
                  style={[styles.couponInput, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.9)', borderColor: appliedCoupon ? '#10b981' : isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)', color: colors.textPrimary, borderWidth: appliedCoupon ? 2 : 1 }]}
                  placeholder={t('payment.enterCoupon', 'Enter coupon code...')}
                  placeholderTextColor={isDark ? 'rgba(255,255,255,0.35)' : '#9CA3AF'}
                  value={couponCode}
                  onChangeText={setCouponCode}
                  editable={!isSubmitting && !appliedCoupon}
                  maxLength={20}
                />
                {!appliedCoupon ? (
                  <TouchableOpacity
                    style={[styles.couponApplyBtn, { backgroundColor: ACCENT }]}
                    onPress={applyCouponCode}
                    disabled={isSubmitting || !couponCode.trim()}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.couponBtnText}>{t('payment.apply', 'Apply')}</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={[styles.couponApplyBtn, { backgroundColor: '#ef4444' }]}
                    onPress={removeCoupon}
                    disabled={isSubmitting}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.couponBtnText}>{t('payment.remove', 'Remove')}</Text>
                  </TouchableOpacity>
                )}
              </View>

              {couponMessage ? (
                <View style={styles.couponSuccessBadge}>
                  <View style={styles.couponBadgeIconCircle}>
                    <Ionicons name="checkmark" size={12} color="#10b981" />
                  </View>
                  <Text style={styles.couponSuccessText}>{couponMessage}</Text>
                </View>
              ) : null}

              {couponError ? (
                <View style={styles.couponErrorBadge}>
                  <Ionicons name="alert-circle" size={14} color="#ef4444" />
                  <Text style={styles.couponErrorText}>{couponError}</Text>
                </View>
              ) : null}
            </GlassCard>

            {/* ── Confirm Button ── */}
            <TouchableOpacity
              style={[
                styles.confirmBtn,
                {
                  backgroundColor: canConfirm ? ACCENT : isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                  opacity: canConfirm ? 1 : 0.5,
                },
              ]}
              onPress={handleConfirm}
              activeOpacity={0.85}
              disabled={!canConfirm}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={[styles.confirmBtnText, { color: canConfirm ? '#fff' : colors.textSecondary }]}>
                  {computedPrice
                    ? `Continue – $${computedPrice.final.toFixed(2)}${computedPrice.period}`
                    : 'Select a plan'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerBackBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  cardContainer: {
    paddingHorizontal: 16,
    paddingVertical: 24,
    gap: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 0.2,
    textAlign: 'center',
  },

  /* ── Plan Grid ── */
  planGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
  },
  planCardGlass: {
    padding: 16,
    overflow: 'hidden',
  },
  planCardSelected: {
    borderColor: '#3D9EFF',
    borderWidth: 2,
    shadowColor: '#3D9EFF',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  planReflection: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '35%',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  planName: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  priceSection: {
    marginBottom: 12,
    gap: 1,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 2,
  },
  planPrice: {
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: -0.6,
    flexShrink: 1,
  },
  planPeriod: {
    fontSize: 18,
    fontWeight: '500',
    opacity: 0.6,
    marginLeft: 6,
    flexShrink: 0,
  },
  oldPrice: {
    fontSize: 12,
    fontWeight: '500',
    opacity: 0.45,
    marginBottom: 2,
  },
  equivalent: {
    fontSize: 11,
    fontWeight: '500',
    opacity: 0.55,
    marginBottom: 1,
  },
  savings: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 3,
    opacity: 0.85,
  },
  selectedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  selectedChipText: {
    fontSize: 11,
    fontWeight: '700',
  },

  /* ── Divider + Section Label ── */
  divider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: 8,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.6,
    marginBottom: -8,
    marginLeft: 4,
  },

  /* ── AI Pro ── */
  aiProGlass: {},
  aiProHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  aiProTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  aiProIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  aiProTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  aiProSwitch: {
    width: 44,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
  },
  aiProSwitchKnob: {
    width: 22,
    height: 22,
    borderRadius: 11,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  aiProDesc: {
    fontSize: 12,
    fontWeight: '500',
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  aiProFeatures: {
    gap: 6,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  aiProFeatureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  aiProFeatureText: {
    fontSize: 12,
    fontWeight: '600',
  },

  /* ── Error ── */
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(239,68,68,0.1)',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },

  /* ── Confirm Button ── */
  confirmBtn: {
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  confirmBtnText: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
  },

  /* ── Payment Method ── */
  paymentSection: {
    padding: 16,
  },
  paymentSectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 14,
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
  paymentMethodSelected: {
    borderWidth: 2,
    borderColor: '#3D9EFF',
    shadowColor: '#3D9EFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  paymentMethodIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(61,158,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  paymentMethodIconSelected: {
    backgroundColor: '#3D9EFF',
  },
  paymentMethodLabelText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  paymentCheckmark: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#3D9EFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  validationHint: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 4,
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

  /* ── Card Form ── */
  cardInput: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    fontSize: 15,
    marginBottom: 10,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '800',
  },

  /* ── Coupon ── */
  couponInput: {
    flex: 1,
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
    shadowColor: '#3D9EFF',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  couponBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  couponSuccessBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(16,185,129,0.06)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.15)',
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
  couponErrorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(239,68,68,0.04)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.12)',
  },
  couponErrorText: {
    color: '#dc2626',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
});
