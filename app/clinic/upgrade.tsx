import { db } from '@/firebaseConfig';
import GlassCard from '@/src/components/GlassCard';
import { PremiumGradientBackground } from '@/src/components/PremiumGradientBackground';
import { useAuth } from '@/src/context/AuthContext';
import { useTheme } from '@/src/context/ThemeContext';
import { SUBSCRIPTION_PRICING } from '@/src/types/subscription';
import { useClinicRoleGuard } from '@/src/utils/navigationGuards';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Animated, BackHandler, InteractionManager, KeyboardAvoidingView, LayoutChangeEvent, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

// ── Brand accent palette (matches Clinics / Subscription screens) ──
const ACCENT = '#3D9EFF';
const ACCENT_SOFT = 'rgba(61,158,255,0.12)';
const ACCENT_BORDER = 'rgba(61,158,255,0.35)';
const ACCENT_BORDER_LIGHT = 'rgba(61,158,255,0.18)';

type PlanFeature = {
  key: string;
  text: string;
  included: boolean;
};

type Plan = {
  id: 'standard' | 'pro';
  name: string;
  tagline: string;
  price: string;
  priceValue: number;
  features: PlanFeature[];
  isPro: boolean;
};

export default function UpgradeScreen() {
  useClinicRoleGuard(['owner']);
  const router = useRouter();
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const { clinicId } = useAuth();
  
  // Handle hardware back button
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        InteractionManager.runAfterInteractions(() => {
          router.back();
        });
        return true;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [router])
  );

  // State management
  const [selectedPlan, setSelectedPlan] = useState<'standard' | 'pro'>('pro');
  const [includeAIPro, setIncludeAIPro] = useState(false);
  const [storedAIPro, setStoredAIPro] = useState(false); // persisted value from Firestore — used only for Hero left card
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCVC, setCVC] = useState('');
  const [saving, setSaving] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'apple' | 'paypal' | 'google'>('card');

  // Load current subscription on mount
  useEffect(() => {
    const loadCurrentPlan = async () => {
      try {
        if (!clinicId) return;
        const clinicSnap = await getDoc(doc(db, 'clinics', clinicId));
        if (clinicSnap.exists()) {
          const data = clinicSnap.data();
          // Check if they have AI Pro add-on
          const hasAIPro = data.includeAIPro === true;
          setIncludeAIPro(hasAIPro);
          setStoredAIPro(hasAIPro);
          // Default selection is Pro if not already subscribed
          setSelectedPlan('pro');
        }
      } catch (error) {
        console.error('Error loading current plan:', error);
      } finally {
        setLoadingPlan(false);
      }
    };
    
    loadCurrentPlan();
  }, [clinicId]);

  // Custom header component per design
  function UpgradeHeader() {
    const router = useRouter();
    
    return (
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        height: 56,
      }}>
        <TouchableOpacity onPress={() => router.back()} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Ionicons name="chevron-back" size={22} color={textPrimary} />
          <Text style={{ fontSize: 16, fontWeight: '600', color: textPrimary }}>Back</Text>
        </TouchableOpacity>

        <Text style={{ fontSize: 18, fontWeight: '700', color: textPrimary }}>BeSmile AI</Text>

        {/* Spacer to balance header layout */}
        <View style={{ width: 50 }} />
      </View>
    );
  }
  const plans: Plan[] = [
    {
      id: 'standard',
      name: t('upgrade.monthlyName', 'Monthly'),
      tagline: t('upgrade.monthlyTagline', 'Billed monthly'),
      price: `$${SUBSCRIPTION_PRICING.monthly}/mo`,
      priceValue: SUBSCRIPTION_PRICING.monthly,
      isPro: false,
      features: [
        { key: 'listing', text: t('upgrade.standardF1', 'Public clinic listing'), included: true },
        { key: 'basic-profile', text: t('upgrade.standardF2', 'Basic profile with contact info'), included: true },
        { key: 'hero', text: t('upgrade.standardF3', 'Hero image & address'), included: true },
        { key: 'stories', text: t('upgrade.standardF4', 'Appear in clinic stories'), included: true },
        { key: 'pro-badge', text: t('upgrade.standardF5', 'Pro badge & luxury ring'), included: false },
        { key: 'featured', text: t('upgrade.standardF6', 'Featured placement'), included: false },
        { key: 'analytics', text: t('upgrade.standardF7', 'Advanced analytics'), included: false },
        { key: 'ab-testing', text: t('upgrade.standardF8', 'A/B testing'), included: false },
      ],
    },
    {
      id: 'pro',
      name: t('upgrade.yearlyName', 'Yearly'),
      tagline: t('upgrade.yearlyTagline', 'Billed annually'),
      price: `$${SUBSCRIPTION_PRICING.yearly}/yr`,
      priceValue: SUBSCRIPTION_PRICING.yearly,
      isPro: true,
      features: [
        { key: 'listing', text: t('upgrade.proF1', 'Everything in Monthly'), included: true },
        { key: 'pro-badge', text: t('upgrade.proF2', 'Pro badge & luxury dark-gold ring'), included: true },
        { key: 'featured', text: t('upgrade.proF3', 'Priority placement in stories & search'), included: true },
        { key: 'trust', text: t('upgrade.proF4', 'Enhanced trust badges row'), included: true },
        { key: 'promo-pill', text: t('upgrade.proF5', 'Premium profile styling'), included: true },
        { key: 'analytics', text: t('upgrade.proF6', 'Advanced analytics & heatmaps'), included: true },
        { key: 'ab-testing', text: t('upgrade.proF7', 'Profile A/B testing'), included: true },
        { key: 'support', text: t('upgrade.proF8', 'Priority support'), included: true },
      ],
    },
  ];

  const handleUpgrade = async () => {
    // Validate payment method selection and details
    if (paymentMethod === 'card') {
      if (!cardValid()) {
        Alert.alert(
          t('common.error', 'Error'),
          t('upgrade.invalidCard', 'Please fill in all card details correctly.'),
          [{ text: t('common.ok', 'OK') }]
        );
        return;
      }
      // Prevent storing card details in this implementation
      // In production, use a secure payment gateway like Stripe
    }

    try {
      setSaving(true);
      const selectedPlanData = plans.find(p => p.id === selectedPlan);
      if (!selectedPlanData) {
        throw new Error('Plan not found');
      }

      const totalPrice = calculatePrice();
      const planIdentifier = selectedPlan === 'pro' ? 'ANNUAL' : 'MONTHLY';

      // Store payment details in AsyncStorage for next step
      await AsyncStorage.multiSet([
        ['pendingSubscriptionPlan', planIdentifier],
        ['pendingSubscriptionPlanName', selectedPlanData.name],
        ['pendingSubscriptionPrice', String(selectedPlanData.priceValue)],
        ['pendingSubscriptionPriceWithAIPro', String(totalPrice)],
        ['pendingIncludeAIPro', String(includeAIPro)],
        ['pendingPaymentMethod', paymentMethod],
      ]);

      // Handle different payment methods
      if (paymentMethod === 'apple') {
        // Apple Pay - would integrate with Apple Pay SDK
        Alert.alert(
          t('upgrade.applePayTitle', 'Apple Pay'),
          t('upgrade.applePayNotAvailable', 'Apple Pay integration coming soon. Please use another payment method.'),
          [{ text: t('common.ok', 'OK') }]
        );
        setSaving(false);
        return;
      } else if (paymentMethod === 'paypal') {
        // PayPal - would redirect to PayPal flow
        Alert.alert(
          t('upgrade.paypalTitle', 'PayPal'),
          t('upgrade.paypalNotAvailable', 'PayPal integration coming soon. Please use another payment method.'),
          [{ text: t('common.ok', 'OK') }]
        );
        setSaving(false);
        return;
      } else if (paymentMethod === 'google') {
        // Google Pay - would integrate with Google Pay SDK
        Alert.alert(
          t('upgrade.googlePayTitle', 'Google Pay'),
          t('upgrade.googlePayNotAvailable', 'Google Pay integration coming soon. Please use another payment method.'),
          [{ text: t('common.ok', 'OK') }]
        );
        setSaving(false);
        return;
      } else if (paymentMethod === 'card') {
        // Card payment - would integrate with Stripe or similar
        // For now, simulate processing
        await new Promise(resolve => setTimeout(resolve, 1500));
      }

      // Navigate to payment screen for confirmation
      router.push('/clinic/payment');
    } catch (error) {
      console.error('Error preparing upgrade:', error);
      Alert.alert(
        t('common.error', 'Error'),
        t('upgrade.errorMessage', 'Could not prepare upgrade. Please try again.'),
        [{ text: t('common.ok', 'OK') }]
      );
    } finally {
      setSaving(false);
    }
  };

  // Calculate price with AI Pro if needed
  const calculatePrice = (): number => {
    const basePlan = selectedPlan === 'pro' ? SUBSCRIPTION_PRICING.yearly : SUBSCRIPTION_PRICING.monthly;
      const aiProPrice = includeAIPro 
        ? (selectedPlan === 'pro' ? SUBSCRIPTION_PRICING.aiProYearly : SUBSCRIPTION_PRICING.aiPro) 
        : 0;
    return basePlan + aiProPrice;
  };

  // Card validation function
  const cardValid = (): boolean => {
    const nameOk = cardName.trim().length > 2;
    const numberOk = /^\d{13,19}$/.test(cardNumber.replace(/\s/g, ''));
    const expiryOk = /^\d{2}\/\d{2}$/.test(cardExpiry);
    const cvcOk = /^\d{3,4}$/.test(cardCVC);
    
    // Check expiry date is not expired
    if (expiryOk) {
      const [month, year] = cardExpiry.split('/');
      const currentYear = new Date().getFullYear() % 100;
      const currentMonth = new Date().getMonth() + 1;
      const expYear = parseInt(year);
      const expMonth = parseInt(month);
      
      if (expYear < currentYear || (expYear === currentYear && expMonth < currentMonth)) {
        return false;
      }
    }
    
    return nameOk && numberOk && expiryOk && cvcOk;
  };

  // Card number formatting (spaces every 4 digits)
  const formatCardNumber = (val: string): string => {
    const cleaned = val.replace(/\D/g, '').slice(0, 19);
    const chunks = cleaned.match(/.{1,4}/g) || [];
    return chunks.join(' ');
  };

  // Card expiry formatting (MM/YY)
  const formatExpiry = (val: string): string => {
    const cleaned = val.replace(/\D/g, '').slice(0, 4);
    if (cleaned.length <= 2) return cleaned;
    return cleaned.slice(0, 2) + '/' + cleaned.slice(2);
  };

  const cardBg = isDark ? '#1f1f23' : '#f8fafc';
  const cardBorder = isDark ? '#2d2d32' : '#e5e7eb';
  const muted = isDark ? '#9ca3af' : '#6b7280';
  const textPrimary = isDark ? '#f9fafb' : '#0f172a';

  // ── Segmented Control (extracted for clean JSX) ──
  function SegmentedControl({
    plans: segPlans,
    selectedPlan: selPlan,
    onSelect,
    isDark: dk,
    textPrimary: tp,
    muted: mt,
    t: tFn,
  }: {
    plans: Plan[];
    selectedPlan: 'standard' | 'pro';
    onSelect: (id: 'standard' | 'pro') => void;
    isDark: boolean;
    textPrimary: string;
    muted: string;
    t: (key: string, fallback: string) => string;
  }) {
    const pillX = useRef(new Animated.Value(selPlan === 'pro' ? 1 : 0)).current;
    const [segWidth, setSegWidth] = useState(0);

    const handleLayout = (e: LayoutChangeEvent) => {
      setSegWidth(e.nativeEvent.layout.width);
    };

    const handleSelect = (id: 'standard' | 'pro') => {
      Animated.timing(pillX, {
        toValue: id === 'pro' ? 1 : 0,
        duration: 140,
        useNativeDriver: false,
      }).start();
      onSelect(id);
    };

    const pillWidth = segWidth > 0 ? (segWidth - 8) / 2 : 0;
    const translateX = pillX.interpolate({
      inputRange: [0, 1],
      outputRange: [4, pillWidth + 4],
    });

    return (
      <GlassCard
        intensity={48}
        tint={dk ? 'dark' : 'light'}
        borderRadius={16}
        style={[styles.segmentedGlass, { borderColor: dk ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }]}
      >
        <View style={styles.segmentedTrack} onLayout={handleLayout}>
          {/* Animated Pill */}
          {segWidth > 0 && (
            <Animated.View
              style={[
                styles.segmentedPill,
                {
                  width: pillWidth,
                  transform: [{ translateX }],
                  backgroundColor: ACCENT,
                },
              ]}
            />
          )}
          {segPlans.map((plan) => {
            const isActive = selPlan === plan.id;
            const label = plan.id === 'standard' ? tFn('upgrade.monthlyName', 'Monthly') : tFn('upgrade.yearlyName', 'Yearly');
            return (
              <TouchableOpacity
                key={plan.id}
                activeOpacity={0.8}
                style={styles.segmentedItem}
                onPress={() => handleSelect(plan.id)}
              >
                <Text
                  style={[
                    styles.segmentedLabel,
                    { color: isActive ? '#fff' : tp, fontWeight: isActive ? '700' : '600' },
                  ]}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </GlassCard>
    );
  }

  if (loadingPlan) {
    return (
      <View style={[styles.container, { backgroundColor: 'transparent' }]}>
        <PremiumGradientBackground isDark={isDark} showSparkles={false} />
        <Text style={{ color: textPrimary, textAlign: 'center', marginTop: 48 }}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <PremiumGradientBackground isDark={isDark} showSparkles={!isDark} />
      <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }}>
      <ScrollView 
        style={[styles.container, { backgroundColor: 'transparent' }]} 
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        bounces={false}
        overScrollMode="never"
      >
        {/* Clean Header */}
        <UpgradeHeader />

      {/* ── Upgrade Hero ── */}
      <GlassCard
        intensity={58}
        tint={isDark ? 'dark' : 'light'}
        borderRadius={24}
        style={[styles.heroGlass, { borderColor: isDark ? ACCENT_BORDER : ACCENT_BORDER_LIGHT }]}
      >
        {/* Savings badge — only visible when yearly is selected */}
        {selectedPlan === 'pro' && SUBSCRIPTION_PRICING.savingsAmount > 0 && (
          <View style={styles.savingsBadge}>
            <Ionicons name="pricetag" size={12} color={ACCENT} style={{ marginRight: 4 }} />
            <Text style={styles.savingsBadgeText}>
              {t('upgrade.saveBadge', 'Save ${{amount}}/yr ({{pct}}%)', {
                amount: SUBSCRIPTION_PRICING.savingsAmount.toFixed(2),
                pct: SUBSCRIPTION_PRICING.savingsPercent,
              })}
            </Text>
          </View>
        )}

        <View style={styles.comparisonContainer}>
          {/* Current Plan (Left) — reflects persisted subscription only */}
          <View style={[styles.planColumn, { borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}>
            <Text style={[styles.columnTitle, { color: muted }]}>
              {t('upgrade.currentPlanLabel', 'Current Plan')}
            </Text>
            <Text style={[styles.columnPlanName, { color: textPrimary }]}>
              {t('upgrade.monthlyName', 'Monthly')}
            </Text>
            <Text style={[styles.columnPrice, { color: textPrimary }]}>
              ${(SUBSCRIPTION_PRICING.monthly + (storedAIPro ? SUBSCRIPTION_PRICING.aiPro : 0)).toFixed(2)}
            </Text>
            <Text style={[styles.columnPeriod, { color: muted }]}>/month</Text>
            {storedAIPro && (
              <Text style={[styles.columnBreakdown, { color: muted }]}>
                ${SUBSCRIPTION_PRICING.monthly.toFixed(2)} + ${SUBSCRIPTION_PRICING.aiPro.toFixed(2)} AI Pro
              </Text>
            )}
          </View>

          {/* Arrow */}
          <View style={styles.arrowContainer}>
            <View style={styles.arrowCircle}>
              <Ionicons name="arrow-forward" size={18} color="#fff" />
            </View>
          </View>

          {/* Target Plan (Right) */}
          <View 
            style={[
              styles.planColumn, 
              { 
                borderColor: selectedPlan === 'pro' ? ACCENT_BORDER : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'),
                borderWidth: selectedPlan === 'pro' ? 1.5 : 1,
              }
            ]}
          >
            <Text style={[styles.columnTitle, { color: muted }]}>
              {t('upgrade.targetPlanLabel', 'Upgrade to')}
            </Text>
            <View style={styles.targetPlanRow}>
              <Text style={[styles.columnPlanName, { color: selectedPlan === 'pro' ? ACCENT : textPrimary }]}>
                {selectedPlan === 'pro' ? t('upgrade.yearlyName', 'Yearly') : t('upgrade.monthlyName', 'Monthly')}
              </Text>
              {selectedPlan === 'pro' && (
                <View style={styles.proPill}>
                  <Text style={styles.proPillText}>YEARLY</Text>
                </View>
              )}
            </View>
            <Text style={[styles.columnPrice, { color: textPrimary }]}>
              ${calculatePrice().toFixed(2)}
            </Text>
            <Text style={[styles.columnPeriod, { color: muted }]}>{selectedPlan === 'pro' ? '/year' : '/month'}</Text>
            {includeAIPro && (
              <Text style={[styles.columnBreakdown, { color: muted }]}>
                ${(selectedPlan === 'pro' ? SUBSCRIPTION_PRICING.yearly : SUBSCRIPTION_PRICING.monthly).toFixed(2)} + ${(selectedPlan === 'pro' ? SUBSCRIPTION_PRICING.aiProYearly : SUBSCRIPTION_PRICING.aiPro).toFixed(2)} AI Pro
              </Text>
            )}
          </View>
        </View>

        {/* Delta savings indicator — visible when yearly is selected */}
        {selectedPlan === 'pro' && (() => {
          const currentMonthly = SUBSCRIPTION_PRICING.monthly + (storedAIPro ? SUBSCRIPTION_PRICING.aiPro : 0);
          const currentAnnualized = currentMonthly * 12;
          const newYearly = calculatePrice();
          const delta = currentAnnualized - newYearly;
          if (delta > 0) {
            return (
              <View style={styles.deltaRow}>
                <Ionicons name="trending-down-outline" size={14} color={ACCENT} />
                <Text style={[styles.deltaText, { color: ACCENT }]}>
                  {t('upgrade.deltaSavings', 'You save ${{amount}}/yr vs monthly', {
                    amount: delta.toFixed(2),
                  })}
                </Text>
              </View>
            );
          }
          return null;
        })()}
      </GlassCard>

      {/* ── Premium Segmented Control ── */}
      <SegmentedControl
        plans={plans}
        selectedPlan={selectedPlan}
        onSelect={setSelectedPlan}
        isDark={isDark}
        textPrimary={textPrimary}
        muted={muted}
        t={t}
      />

      {/* AI Pro Toggle — wrapped in GlassCard */}
      <GlassCard
        intensity={includeAIPro ? 55 : 45}
        tint={isDark ? 'dark' : 'light'}
        borderRadius={22}
        style={[styles.glassSection, {
          borderColor: includeAIPro ? ACCENT : (isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)'),
          borderWidth: includeAIPro ? 1.5 : StyleSheet.hairlineWidth,
        }]}
      >
        <View style={styles.aiProHeader}>
          <View>
            <Text style={[styles.aiProTitle, { color: textPrimary }]}>
              {t('upgrade.aiProTitle', 'AI Pro Add-on')}
            </Text>
            <Text style={[styles.aiProSubtitle, { color: muted }]}>
                {`+$${SUBSCRIPTION_PRICING.aiPro.toFixed(2)}/month`}
            </Text>
            {selectedPlan === 'pro' && (
              <Text style={[styles.aiProBilledLabel, { color: muted }]}>
                {t('upgrade.billedAnnually', 'Billed annually')}
              </Text>
            )}
          </View>
          <TouchableOpacity
            style={[
              styles.aiProToggle,
              {
                backgroundColor: includeAIPro ? ACCENT : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)'),
                borderColor: includeAIPro ? ACCENT : (isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)'),
              }
            ]}
            onPress={() => setIncludeAIPro(!includeAIPro)}
          >
            <Ionicons 
              name={includeAIPro ? 'checkmark' : 'close'} 
              size={16} 
              color={includeAIPro ? '#fff' : muted}
            />
          </TouchableOpacity>
        </View>
        <Text style={[styles.aiProDescription, { color: muted }]}>
          {t('upgrade.aiProDesc', 'Advanced AI templates, automations, and priority support')}
        </Text>
      </GlassCard>

      {/* Payment Form wrapped to avoid keyboard overlap */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? 120 : 0} style={{ flex: 1 }}>
      {/* Payment Card Section — wrapped in GlassCard */}
      <GlassCard
        intensity={50}
        tint={isDark ? 'dark' : 'light'}
        borderRadius={24}
        style={[styles.glassSection, { borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }]}
      >
        <Text style={[styles.paymentTitle, { color: textPrimary }]}>
          {t('upgrade.paymentDetails', 'Payment Information')}
        </Text>

        {/* Payment Method Selection */}
        <View style={styles.paymentMethodsContainer}>
          <Text style={[styles.inputLabel, { color: muted, marginBottom: 12 }]}>
            {t('upgrade.paymentMethod', 'Payment Method')}
          </Text>
          <View style={styles.paymentMethodsGrid}>
            {/* Card */}
            <TouchableOpacity
              style={[
                styles.paymentMethodBtn,
                {
                  backgroundColor: paymentMethod === 'card' ? ACCENT_SOFT : 'transparent',
                  borderColor: paymentMethod === 'card' ? ACCENT : (isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.08)'),
                }
              ]}
              onPress={() => setPaymentMethod('card')}
            >
              <Ionicons name="card" size={24} color={paymentMethod === 'card' ? ACCENT : muted} />
              <Text style={[styles.paymentMethodText, { color: paymentMethod === 'card' ? textPrimary : muted }]}>
                Card
              </Text>
            </TouchableOpacity>

            {/* Apple Pay */}
            <TouchableOpacity
              style={[
                styles.paymentMethodBtn,
                {
                  backgroundColor: paymentMethod === 'apple' ? ACCENT_SOFT : 'transparent',
                  borderColor: paymentMethod === 'apple' ? ACCENT : (isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.08)'),
                }
              ]}
              onPress={() => setPaymentMethod('apple')}
            >
              <Ionicons name="logo-apple" size={24} color={paymentMethod === 'apple' ? ACCENT : muted} />
              <Text style={[styles.paymentMethodText, { color: paymentMethod === 'apple' ? textPrimary : muted }]}>
                Apple Pay
              </Text>
            </TouchableOpacity>

            {/* PayPal */}
            <TouchableOpacity
              style={[
                styles.paymentMethodBtn,
                {
                  backgroundColor: paymentMethod === 'paypal' ? ACCENT_SOFT : 'transparent',
                  borderColor: paymentMethod === 'paypal' ? ACCENT : (isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.08)'),
                }
              ]}
              onPress={() => setPaymentMethod('paypal')}
            >
              <Ionicons name="logo-paypal" size={24} color={paymentMethod === 'paypal' ? ACCENT : muted} />
              <Text style={[styles.paymentMethodText, { color: paymentMethod === 'paypal' ? textPrimary : muted }]}>
                PayPal
              </Text>
            </TouchableOpacity>

            {/* Google Pay */}
            <TouchableOpacity
              style={[
                styles.paymentMethodBtn,
                {
                  backgroundColor: paymentMethod === 'google' ? ACCENT_SOFT : 'transparent',
                  borderColor: paymentMethod === 'google' ? ACCENT : (isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.08)'),
                }
              ]}
              onPress={() => setPaymentMethod('google')}
            >
              <Ionicons name="logo-google" size={24} color={paymentMethod === 'google' ? ACCENT : muted} />
              <Text style={[styles.paymentMethodText, { color: paymentMethod === 'google' ? textPrimary : muted }]}>
                Google Pay
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Show card inputs only if card method selected */}
        {paymentMethod === 'card' && (
          <>
        {/* Card Holder Name */}
        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: muted }]}>
            {t('upgrade.cardholderName', 'Card Holder Name')}
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: isDark ? '#0f172a' : '#fff',
                borderColor: cardBorder,
                color: textPrimary,
              }
            ]}
            placeholder={t('upgrade.cardholderPlaceholder', 'Name on card')}
            placeholderTextColor={muted}
            value={cardName}
            onChangeText={setCardName}
          />
        </View>

        {/* Card Number */}
        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: muted }]}>
            {t('upgrade.cardNumber', 'Card Number')}
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: isDark ? '#0f172a' : '#fff',
                borderColor: cardBorder,
                color: textPrimary,
                textAlign: 'left',
                writingDirection: 'ltr',
              }
            ]}
            placeholder={t('upgrade.cardNumberPlaceholder', '1234 5678 9012 3456')}
            placeholderTextColor={muted}
            value={cardNumber}
            onChangeText={(val) => setCardNumber(formatCardNumber(val))}
            keyboardType="number-pad"
            maxLength={19}
            textContentType="creditCardNumber"
            autoComplete="cc-number"
          />
        </View>

        {/* Expiry & CVC Row */}
        <View style={styles.rowInputs}>
          <View style={[styles.inputGroup, { flex: 1, marginRight: 12 }]}>
            <Text style={[styles.inputLabel, { color: muted }]}>
              {t('upgrade.expiry', 'Expiry (MM/YY)')}
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: isDark ? '#0f172a' : '#fff',
                  borderColor: cardBorder,
                  color: textPrimary,
                  textAlign: 'left',
                  writingDirection: 'ltr',
                }
              ]}
              placeholder="MM/YY"
              placeholderTextColor={muted}
              value={cardExpiry}
              onChangeText={(val) => setCardExpiry(formatExpiry(val))}
              keyboardType="number-pad"
              maxLength={5}
              textContentType="none"
            />
          </View>

          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={[styles.inputLabel, { color: muted }]}>
              {t('upgrade.cvc', 'CVC')}
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: isDark ? '#0f172a' : '#fff',
                  borderColor: cardBorder,
                  color: textPrimary,
                  textAlign: 'left',
                  writingDirection: 'ltr',
                }
              ]}
              placeholder="123"
              placeholderTextColor={muted}
              value={cardCVC}
              onChangeText={(val) => setCVC(val.replace(/\D/g, '').slice(0, 4))}
              keyboardType="number-pad"
              maxLength={4}
              secureTextEntry
              textContentType="none"
            />
          </View>
        </View>
          </>
        )}
        
        {/* Show message for other payment methods */}
        {paymentMethod !== 'card' && (
          <View style={[styles.paymentMethodInfo, { backgroundColor: ACCENT_SOFT }]}>
            <Ionicons name="information-circle" size={20} color={ACCENT} />
            <Text style={[styles.paymentMethodInfoText, { color: textPrimary }]}>
              {paymentMethod === 'apple' && t('upgrade.applePayInfo', 'You will be redirected to Apple Pay to complete your purchase.')}
              {paymentMethod === 'paypal' && t('upgrade.paypalInfo', 'You will be redirected to PayPal to complete your purchase.')}
              {paymentMethod === 'google' && t('upgrade.googlePayInfo', 'You will be redirected to Google Pay to complete your purchase.')}
            </Text>
          </View>
        )}
      </GlassCard>

      </KeyboardAvoidingView>
      </ScrollView>

      {/* Bottom Bar: Keep confirm button visible */}
      <View style={[styles.bottomBar, { backgroundColor: 'transparent', borderTopColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }]}> 
        <TouchableOpacity
          style={[
            styles.changePlanBtn,
            {
              backgroundColor: (paymentMethod === 'card' ? cardValid() : true) ? ACCENT : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'),
              opacity: (paymentMethod === 'card' ? cardValid() : true) ? 1 : 0.5,
            }
          ]}
          onPress={handleUpgrade}
          disabled={(paymentMethod === 'card' && !cardValid()) || saving}
        >
          <Text style={[styles.changePlanBtnText, { color: '#fff' }]}> 
            {saving
              ? t('common.loading', 'Processing...')
              : `${selectedPlan === 'pro'
                  ? t('upgrade.upgradeToYearly', 'Upgrade to Yearly')
                  : t('upgrade.switchToMonthly', 'Switch to Monthly')
                } — $${calculatePrice().toFixed(2)}`
            }
          </Text>
        </TouchableOpacity>

        <Text style={[styles.disclaimer, { color: muted }]}> 
          {t('upgrade.disclaimer', 'Your plan change will be effective immediately after confirmation.')}
        </Text>
      </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },

  // Shared GlassCard section wrapper
  glassSection: {
    padding: 16,
    marginBottom: 24,
  },

  // ── Upgrade Hero ──
  heroGlass: {
    padding: 18,
    marginBottom: 24,
  },
  savingsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: ACCENT_SOFT,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 14,
  },
  savingsBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: ACCENT,
  },
  arrowCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Segmented Control ──
  segmentedGlass: {
    padding: 0,
    marginBottom: 24,
  },
  segmentedTrack: {
    flexDirection: 'row',
    height: 48,
    borderRadius: 14,
    overflow: 'hidden',
    position: 'relative',
  },
  segmentedPill: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    borderRadius: 11,
  },
  segmentedItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  segmentedLabel: {
    fontSize: 14,
    letterSpacing: 0.2,
  },

  // Bottom bar to anchor confirm button
  bottomBar: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 18,
  },

  // Comparison
  comparisonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  planColumn: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  columnTitle: { fontSize: 12, fontWeight: '600', marginBottom: 6 },
  columnPlanName: { fontSize: 18, fontWeight: '800', marginBottom: 4 },
  columnPrice: { fontSize: 16, fontWeight: '700' },
  columnPeriod: { fontSize: 12, fontWeight: '500', marginTop: 2 },
  columnBreakdown: { fontSize: 10, fontWeight: '400', marginTop: 4 },
  arrowContainer: { marginHorizontal: 12 },
  targetPlanRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  proPill: {
    backgroundColor: ACCENT,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  proPillText: { color: '#fff', fontSize: 10, fontWeight: '800' },

  // Delta savings row
  deltaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 14,
  },
  deltaText: {
    fontSize: 12,
    fontWeight: '700',
  },

  // AI Pro Section
  aiProHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  aiProTitle: { fontSize: 16, fontWeight: '700' },
  aiProSubtitle: { fontSize: 12, fontWeight: '500', marginTop: 2 },
  aiProBilledLabel: { fontSize: 11, fontWeight: '500', marginTop: 2, fontStyle: 'italic' },
  aiProToggle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiProDescription: { fontSize: 13, fontWeight: '500', lineHeight: 18 },

  // Payment
  paymentTitle: { fontSize: 16, fontWeight: '700', marginBottom: 16 },
  
  // Payment Methods
  paymentMethodsContainer: {
    marginBottom: 20,
  },
  paymentMethodsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'space-between',
  },
  paymentMethodBtn: {
    width: '23%',
    aspectRatio: 1,
    borderRadius: 12,
    borderWidth: 1.5,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  paymentMethodText: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  paymentMethodInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 10,
    marginTop: 12,
  },
  paymentMethodInfoText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },

  // Input Fields
  inputGroup: { marginBottom: 14 },
  inputLabel: { fontSize: 12, fontWeight: '600', marginBottom: 6 },
  input: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    fontWeight: '500',
  },
  rowInputs: { flexDirection: 'row' },

  // Change Plan Button
  changePlanBtn: {
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  changePlanBtnText: { fontSize: 16, fontWeight: '800' },

  // Disclaimer
  disclaimer: { fontSize: 12, fontWeight: '500', textAlign: 'center' },
});
