import { db } from '@/firebaseConfig';
import i18n from '@/i18n';
import { useAuth } from '@/src/context/AuthContext';
import { useTheme } from '@/src/context/ThemeContext';
import { SUBSCRIPTION_PRICING } from '@/src/types/subscription';
import { useClinicRoleGuard } from '@/src/utils/navigationGuards';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, BackHandler, InteractionManager, KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, useColorScheme, View } from 'react-native';

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
  const colorScheme = useColorScheme();
  const { clinicId } = useAuth();
  const isRTL = ['ar', 'he', 'fa', 'ur'].includes(i18n.language);
  
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
  const [currentPlanId, setCurrentPlanId] = useState<'standard' | 'pro' | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<'standard' | 'pro'>('pro');
  const [includeAIPro, setIncludeAIPro] = useState(false);
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
      <SafeAreaView style={{ backgroundColor: '#fff' }}>
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 16,
          height: 60
        }}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={{ fontSize: 18 }}>{'<'} Back</Text>
          </TouchableOpacity>

          <Text style={{ fontSize: 20, fontWeight: 'bold' }}>BeSmile AI</Text>

          {/* Spacer to balance header layout */}
          <View style={{ width: 50 }} />
        </View>
      </SafeAreaView>
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
      const planIdentifier = selectedPlan === 'pro' ? 'YEARLY' : 'MONTHLY';

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

  if (loadingPlan) {
    return (
      <View style={[styles.container, { backgroundColor: isDark ? '#111' : '#fff' }]}>
        <Text style={{ color: textPrimary }}>Loading...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={[{ backgroundColor: colors.background }, { flex: 1 }]}>
      <ScrollView 
        style={[styles.container, { backgroundColor: isDark ? '#111' : '#fff' }]} 
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        bounces={false}
        overScrollMode="never"
      >
        {/* Clean Header (Exact component as requested) */}
        <UpgradeHeader />

      {/* Plan Comparison */}
      <View style={styles.comparisonContainer}>
        {/* Current Plan (Left) */}
        <View style={[styles.planColumn, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          <Text style={[styles.columnTitle, { color: muted }]}>
            {t('upgrade.currentPlanLabel', 'Current Plan')}
          </Text>
          <Text style={[styles.columnPlanName, { color: textPrimary }]}>
            {t('upgrade.monthlyName', 'Monthly')}
          </Text>
          <Text style={[styles.columnPrice, { color: textPrimary }]}>
            ${(SUBSCRIPTION_PRICING.monthly + (includeAIPro ? SUBSCRIPTION_PRICING.aiPro : 0)).toFixed(2)}
          </Text>
          <Text style={[styles.columnPeriod, { color: muted }]}>/month</Text>
          {includeAIPro && (
            <Text style={[styles.columnBreakdown, { color: muted }]}>
              ${SUBSCRIPTION_PRICING.monthly.toFixed(2)} + ${SUBSCRIPTION_PRICING.aiPro.toFixed(2)} AI Pro
            </Text>
          )}
        </View>

        {/* Arrow */}
        <View style={styles.arrowContainer}>
          <Ionicons name="arrow-forward" size={24} color={textPrimary} />
        </View>

        {/* Target Plan (Right) */}
        <View 
          style={[
            styles.planColumn, 
            { 
              backgroundColor: cardBg, 
              borderColor: selectedPlan === 'pro' ? '#D4AF37' : cardBorder,
              borderWidth: selectedPlan === 'pro' ? 2 : 1,
            }
          ]}
        >
          <Text style={[styles.columnTitle, { color: muted }]}>
            {t('upgrade.targetPlanLabel', 'Upgrade to')}
          </Text>
          <View style={styles.targetPlanRow}>
            <Text style={[styles.columnPlanName, { color: selectedPlan === 'pro' ? '#D4AF37' : textPrimary }]}>
              {selectedPlan === 'pro' ? t('upgrade.yearlyName', 'Yearly') : t('upgrade.monthlyName', 'Monthly')}
            </Text>
            {selectedPlan === 'pro' && (
              <View style={styles.proPill}>
                <Text style={styles.proPillText}>YEARLY</Text>
              </View>
            )}
          </View>
          <Text style={[styles.columnPrice, { color: textPrimary }]}>
            ${(selectedPlan === 'pro' ? SUBSCRIPTION_PRICING.yearly : SUBSCRIPTION_PRICING.monthly + (includeAIPro ? SUBSCRIPTION_PRICING.aiPro : 0)).toFixed(2)}
          </Text>
          <Text style={[styles.columnPeriod, { color: muted }]}>{selectedPlan === 'pro' ? '/year' : '/month'}</Text>
          {includeAIPro && (
            <Text style={[styles.columnBreakdown, { color: muted }]}>
              ${(selectedPlan === 'pro' ? SUBSCRIPTION_PRICING.yearly : SUBSCRIPTION_PRICING.monthly).toFixed(2)} + ${SUBSCRIPTION_PRICING.aiPro.toFixed(2)} AI Pro
            </Text>
          )}
        </View>
      </View>

      {/* Plan Selection Tabs */}
      <View style={styles.planTabs}>
        {plans.map((plan) => {
          const displayName = plan.id === 'standard' ? t('upgrade.monthlyName', 'Monthly') : t('upgrade.yearlyName', 'Yearly');
          return (
            <TouchableOpacity
              key={plan.id}
              style={[
                styles.planTab,
                {
                  backgroundColor: selectedPlan === plan.id 
                    ? (plan.isPro ? '#D4AF37' : '#2563eb')
                    : cardBg,
                  borderColor: selectedPlan === plan.id 
                    ? (plan.isPro ? '#D4AF37' : '#2563eb')
                    : cardBorder,
                }
              ]}
              onPress={() => setSelectedPlan(plan.id)}
            >
              <Text 
                style={[
                  styles.planTabText,
                  { 
                    color: selectedPlan === plan.id ? '#fff' : textPrimary,
                    fontWeight: selectedPlan === plan.id ? '700' : '600',
                  }
                ]}
              >
                {displayName}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* AI Pro Toggle */}
      <View style={[styles.aiProSection, { backgroundColor: cardBg, borderColor: cardBorder }]}>
        <View style={styles.aiProHeader}>
          <View>
            <Text style={[styles.aiProTitle, { color: textPrimary }]}>
              {t('upgrade.aiProTitle', 'AI Pro Add-on')}
            </Text>
            <Text style={[styles.aiProSubtitle, { color: muted }]}>
                {selectedPlan === 'pro' 
                  ? `+$${SUBSCRIPTION_PRICING.aiProYearly.toFixed(2)}/year` 
                  : `+$${SUBSCRIPTION_PRICING.aiPro.toFixed(2)}/month`}
            </Text>
          </View>
          <TouchableOpacity
            style={[
              styles.aiProToggle,
              {
                backgroundColor: includeAIPro ? '#D4AF37' : '#e5e7eb',
                borderColor: includeAIPro ? '#D4AF37' : '#d1d5db',
              }
            ]}
            onPress={() => setIncludeAIPro(!includeAIPro)}
          >
            <Ionicons 
              name={includeAIPro ? 'checkmark' : 'close'} 
              size={16} 
              color={includeAIPro ? '#1a1513' : muted}
            />
          </TouchableOpacity>
        </View>
        <Text style={[styles.aiProDescription, { color: muted }]}>
          {t('upgrade.aiProDesc', 'Advanced AI templates, automations, and priority support')}
        </Text>
      </View>

      {/* Payment Form wrapped to avoid keyboard overlap */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? 120 : 0} style={{ flex: 1 }}>
      {/* Payment Card Section */}
      <View style={[styles.paymentCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
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
                  backgroundColor: paymentMethod === 'card' ? (isDark ? '#1e40af' : '#dbeafe') : cardBg,
                  borderColor: paymentMethod === 'card' ? '#3b82f6' : cardBorder,
                }
              ]}
              onPress={() => setPaymentMethod('card')}
            >
              <Ionicons name="card" size={24} color={paymentMethod === 'card' ? '#3b82f6' : muted} />
              <Text style={[styles.paymentMethodText, { color: paymentMethod === 'card' ? textPrimary : muted }]}>
                Card
              </Text>
            </TouchableOpacity>

            {/* Apple Pay */}
            <TouchableOpacity
              style={[
                styles.paymentMethodBtn,
                {
                  backgroundColor: paymentMethod === 'apple' ? (isDark ? '#1e293b' : '#f1f5f9') : cardBg,
                  borderColor: paymentMethod === 'apple' ? '#0f172a' : cardBorder,
                }
              ]}
              onPress={() => setPaymentMethod('apple')}
            >
              <Ionicons name="logo-apple" size={24} color={paymentMethod === 'apple' ? '#0f172a' : muted} />
              <Text style={[styles.paymentMethodText, { color: paymentMethod === 'apple' ? textPrimary : muted }]}>
                Apple Pay
              </Text>
            </TouchableOpacity>

            {/* PayPal */}
            <TouchableOpacity
              style={[
                styles.paymentMethodBtn,
                {
                  backgroundColor: paymentMethod === 'paypal' ? (isDark ? '#1e3a8a' : '#dbeafe') : cardBg,
                  borderColor: paymentMethod === 'paypal' ? '#0070ba' : cardBorder,
                }
              ]}
              onPress={() => setPaymentMethod('paypal')}
            >
              <Ionicons name="logo-paypal" size={24} color={paymentMethod === 'paypal' ? '#0070ba' : muted} />
              <Text style={[styles.paymentMethodText, { color: paymentMethod === 'paypal' ? textPrimary : muted }]}>
                PayPal
              </Text>
            </TouchableOpacity>

            {/* Google Pay */}
            <TouchableOpacity
              style={[
                styles.paymentMethodBtn,
                {
                  backgroundColor: paymentMethod === 'google' ? (isDark ? '#1e3a1e' : '#dcfce7') : cardBg,
                  borderColor: paymentMethod === 'google' ? '#16a34a' : cardBorder,
                }
              ]}
              onPress={() => setPaymentMethod('google')}
            >
              <Ionicons name="logo-google" size={24} color={paymentMethod === 'google' ? '#16a34a' : muted} />
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
          <View style={styles.paymentMethodInfo}>
            <Ionicons name="information-circle" size={20} color="#3b82f6" />
            <Text style={[styles.paymentMethodInfoText, { color: textPrimary }]}>
              {paymentMethod === 'apple' && t('upgrade.applePayInfo', 'You will be redirected to Apple Pay to complete your purchase.')}
              {paymentMethod === 'paypal' && t('upgrade.paypalInfo', 'You will be redirected to PayPal to complete your purchase.')}
              {paymentMethod === 'google' && t('upgrade.googlePayInfo', 'You will be redirected to Google Pay to complete your purchase.')}
            </Text>
          </View>
        )}
      </View>

      </KeyboardAvoidingView>
      </ScrollView>

      {/* Bottom Bar: Keep confirm button visible */}
      <View style={[styles.bottomBar, { backgroundColor: isDark ? '#111' : '#fff', borderTopColor: cardBorder }]}> 
        <TouchableOpacity
          style={[
            styles.changePlanBtn,
            {
              backgroundColor: (paymentMethod === 'card' ? cardValid() : true) ? '#D4AF37' : '#d1d5db',
              opacity: (paymentMethod === 'card' ? cardValid() : true) ? 1 : 0.6,
            }
          ]}
          onPress={handleUpgrade}
          disabled={(paymentMethod === 'card' && !cardValid()) || saving}
        >
          <Text style={[styles.changePlanBtnText, { color: '#1a1513' }]}> 
            {saving ? t('common.loading', 'Processing...') : t('upgrade.changePlanButton', 'Confirm Plan Change')}
          </Text>
        </TouchableOpacity>

        <Text style={[styles.disclaimer, { color: muted }]}> 
          {t('upgrade.disclaimer', 'Your plan change will be effective immediately after confirmation.')}
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 32 },

  // Bottom bar to anchor confirm button
  bottomBar: {
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
  },
  
  // Clean Header (legacy styles removed; using provided component)
  
  // Old Header (keep for compatibility)
  header: { 
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: { 
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  backBtnText: { 
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
  },

  // Title
  titleBlock: { marginBottom: 24 },
  title: { fontSize: 28, fontWeight: '800', marginBottom: 4 },
  subtitle: { fontSize: 14, fontWeight: '500' },

  // Comparison
  comparisonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  planColumn: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    alignItems: 'center',
  },
  columnTitle: { fontSize: 12, fontWeight: '600', marginBottom: 4 },
  columnPlanName: { fontSize: 18, fontWeight: '800', marginBottom: 8 },
  columnPrice: { fontSize: 16, fontWeight: '700' },
  columnPeriod: { fontSize: 12, fontWeight: '500', marginTop: 2 },
  columnBreakdown: { fontSize: 10, fontWeight: '400', marginTop: 4 },
  arrowContainer: { marginHorizontal: 12, marginTop: -8 },
  targetPlanRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  proPill: {
    backgroundColor: '#D4AF37',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  proPillText: { color: '#1a1513', fontSize: 10, fontWeight: '800' },

  // Plan Tabs
  planTabs: { 
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  planTab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  planTabText: { fontSize: 14, fontWeight: '700' },

  // AI Pro Section
  aiProSection: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 20,
  },
  aiProHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  aiProTitle: { fontSize: 16, fontWeight: '700' },
  aiProSubtitle: { fontSize: 12, fontWeight: '500', marginTop: 2 },
  aiProToggle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiProDescription: { fontSize: 13, fontWeight: '500', lineHeight: 18 },

  // Payment Card
  paymentCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 20,
  },
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
    borderRadius: 10,
    borderWidth: 2,
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
    backgroundColor: '#eff6ff',
    padding: 12,
    borderRadius: 8,
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
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    fontWeight: '500',
  },
  rowInputs: { flexDirection: 'row' },

  // Change Plan Button
  changePlanBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  changePlanBtnText: { fontSize: 16, fontWeight: '800' },

  // Disclaimer
  disclaimer: { fontSize: 12, fontWeight: '500', textAlign: 'center' },
});
