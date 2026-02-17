import { db } from '@/firebaseConfig';
import { useAuth } from '@/src/context/AuthContext';
import { useTheme } from '@/src/context/ThemeContext';
import { ensureClinicPublished } from '@/src/services/clinicDirectorySync';
import { sendSubscriptionReceiptMock } from '@/src/services/emailServiceMock';
import { useClinicGuard, useClinicRoleGuard } from '@/src/utils/navigationGuards';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import { doc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, BackHandler, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import DentalCover from '../components/DentalCover';

/**
 * CLINIC SUBSCRIPTION PAYMENT SCREEN
 * 
 * This screen appears after clinic signup.
 * Shows subscription details and confirms subscription.
 * On completion, marks clinic as subscribed and navigates to clinic details.
 * 
 * PHASE F: Prevent direct access without going through signup + prevent patient access
 */

export default function ClinicPayment() {
  const router = useRouter();
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const [loading, setLoading] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);
  const [accessReason, setAccessReason] = useState<'noPlan' | 'noAccount' | null>(null);
  const [planLabelText, setPlanLabelText] = useState('');
  const [billingLabelText, setBillingLabelText] = useState('');
  const [finalAmount, setFinalAmount] = useState<string>('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'card' | 'apple-pay' | 'paypal' | 'google-pay' | null>(null);
  const [paymentPrompt, setPaymentPrompt] = useState('');
  const { clinicId, memberId } = useAuth();

  // PHASE F: Guard - prevent patients from accessing clinic pages
  useClinicGuard();
  // Owner-only access to payment
  useClinicRoleGuard(['owner']);

  /**
   * Disable hardware back button during confirmation to prevent returning to subscribe flow.
   * This ensures users cannot go back after confirming subscription.
   */
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        if (loading) {
          // Prevent back press while loading
          return true;
        }
        // Allow back press if not loading (user can go back before confirming)
        return false;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [loading])
  );

  useEffect(() => {
    const guardAccess = async () => {
      const entries = await AsyncStorage.multiGet([
        'pendingSubscriptionPlan',
        'pendingSubscriptionPlanName',
        'pendingSubscriptionPrice',
        'pendingSubscriptionPriceWithAIPro',
        'pendingClinicName',
        'pendingSubscriptionEmail',
        'pendingPaymentMethod',
        'clinicId',
      ]);
      const map = Object.fromEntries(entries);
      const hasPlan = !!map.pendingSubscriptionPlan;
      const hasClinic = !!map.clinicId;
      const hasAccountBits = !!map.pendingClinicName && !!map.pendingSubscriptionEmail;
      if (!hasPlan || !hasClinic) {
        setAccessDenied(true);
        setAccessReason('noPlan');
      } else if (!hasAccountBits) {
        setAccessDenied(true);
        setAccessReason('noAccount');
      } else {
        const planId = (map.pendingSubscriptionPlan || 'MONTHLY').toUpperCase();
        const planName = map.pendingSubscriptionPlanName || planId;
        const billingText = planId === 'YEARLY' ? t('subscription.yearly', 'Yearly') : t('subscription.monthly', 'Monthly');
        setPlanLabelText(planName);
        setBillingLabelText(billingText);
        const amount = map.pendingSubscriptionPriceWithAIPro || map.pendingSubscriptionPrice || '19.99';
        setFinalAmount(amount);
        // Load payment method from signup page
        const savedPaymentMethod = map.pendingPaymentMethod as 'card' | 'apple-pay' | 'paypal' | 'google-pay' | null;
        if (savedPaymentMethod) {
          setSelectedPaymentMethod(savedPaymentMethod);
        }
      }
    };
    guardAccess();
  }, [t]);

  const cardValid = () => {
    if (selectedPaymentMethod !== 'card') return selectedPaymentMethod !== null;
    const num = cardNumber.replace(/\s+/g, '');
    const numOk = /^\d{15,19}$/.test(num);
    const expOk = /^(0[1-9]|1[0-2])\/(\d{2}|\d{4})$/.test(cardExpiry);
    const cvcOk = /^\d{3,4}$/.test(cardCvc);
    const nameOk = cardName.trim().length >= 2;
    return numOk && expOk && cvcOk && nameOk && !loading;
  };

  const handlePaymentMethodChange = (method: 'card' | 'apple-pay' | 'paypal' | 'google-pay') => {
    setSelectedPaymentMethod(method);
    
    const messages: Record<string, string> = {
      'card': t('payment.cardReady', 'Ready to process card payment'),
      'apple-pay': t('payment.redirectingApple', 'Redirecting to Apple Pay…'),
      'paypal': t('payment.redirectingPaypal', 'Redirecting to PayPal…'),
      'google-pay': t('payment.redirectingGoogle', 'Redirecting to Google Pay…'),
    };
    setPaymentPrompt(messages[method] || '');
  };

  const handleProcessPayment = async () => {
    if (!selectedPaymentMethod) return;
    
    setLoading(true);
    try {
      // Simulate different payment method flows
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
          await confirmSubscription();
          return;
      }
    } catch (err) {
      console.error('[PAYMENT ERROR]:', err);
      setLoading(false);
      Alert.alert(t('common.error', 'Error'), t('payment.failed', 'Payment failed. Please try again.'));
    }
  };

  const simulateApplePayFlow = async () => {
    // Simulate Apple Pay dialog delay
    return new Promise((resolve) => {
      setTimeout(() => {
        Alert.alert(
          t('payment.applePayTitle', 'Apple Pay'),
          t('payment.applePayMessage', 'In a real app, Apple Pay would open here for biometric authentication.'),
          [
            {
              text: t('common.cancel', 'Cancel'),
              onPress: () => {
                setLoading(false);
                resolve(null);
              },
            },
            {
              text: t('payment.complete', 'Complete Payment'),
              onPress: async () => {
                await confirmSubscription();
                resolve(null);
              },
              style: 'default',
            },
          ]
        );
      }, 500);
    });
  };

  const simulatePayPalFlow = async () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        Alert.alert(
          t('payment.paypalTitle', 'PayPal'),
          t('payment.paypalMessage', 'In a real app, you would be redirected to PayPal for secure authentication.'),
          [
            {
              text: t('common.cancel', 'Cancel'),
              onPress: () => {
                setLoading(false);
                resolve(null);
              },
            },
            {
              text: t('payment.complete', 'Complete Payment'),
              onPress: async () => {
                await confirmSubscription();
                resolve(null);
              },
              style: 'default',
            },
          ]
        );
      }, 500);
    });
  };

  const simulateGooglePayFlow = async () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        Alert.alert(
          t('payment.googlePayTitle', 'Google Pay'),
          t('payment.googlePayMessage', 'In a real app, Google Pay would open for payment confirmation.'),
          [
            {
              text: t('common.cancel', 'Cancel'),
              onPress: () => {
                setLoading(false);
                resolve(null);
              },
            },
            {
              text: t('payment.complete', 'Complete Payment'),
              onPress: async () => {
                await confirmSubscription();
                resolve(null);
              },
              style: 'default',
            },
          ]
        );
      }, 500);
    });
  };

  const confirmSubscription = async () => {
    try {
      // Load pending subscription and clinic details from AsyncStorage
      const [
        targetPlan,
        planName,
        basePrice,
        finalPrice,
        includeAIPro,
        clinicName,
        clinicPhone,
        pendingEmail,
        storedClinicId
      ] = await AsyncStorage.multiGet([
        'pendingSubscriptionPlan',
        'pendingSubscriptionPlanName',
        'pendingSubscriptionPrice',
        'pendingSubscriptionPriceWithAIPro',
        'pendingIncludeAIPro',
        'pendingClinicName',
        'pendingClinicPhone',
        'pendingSubscriptionEmail',
        'clinicId'
      ]);

      const plan = targetPlan[1] || 'MONTHLY';
      const amount = parseFloat(finalPrice[1] || basePrice[1] || '19.99');
      const aiPro = includeAIPro[1] === 'true';
      const clinicNameValue = clinicName[1] || 'Clinic';
      const userEmail = (pendingEmail[1] || '').toLowerCase();
      const targetClinicId = clinicId || storedClinicId[1];

      if (!targetClinicId) {
        setLoading(false);
        setAccessDenied(true);
        return;
      }

      // Create or update clinic document with subscription and details
      const payload = {
        subscribed: true,
        subscriptionPlan: plan,
        subscriptionPlanName: planName[1] || plan,
        subscriptionPrice: parseFloat(basePrice[1] || '19.99'),
        subscriptionPriceWithAIPro: amount,
        includeAIPro: aiPro,
        subscriptionCurrency: 'USD',
        subscriptionUpdatedAt: Date.now(),
        subscribedAt: serverTimestamp(),
        clinicName: clinicNameValue,
        clinicPhone: clinicPhone[1] || null,
        detailsCompletedAt: Date.now(),
        paymentMethod: selectedPaymentMethod,
        status: 'active',
      };

      try {
        await updateDoc(doc(db, 'clinics', targetClinicId), payload);
      } catch {
        await setDoc(doc(db, 'clinics', targetClinicId), payload, { merge: true });
      }

      // Auto-publish to clinics directory (fire-and-forget)
      ensureClinicPublished(targetClinicId).catch(() => {});

      // Save to AsyncStorage
      await AsyncStorage.multiSet([
        ['clinicSubscriptionPlan', plan],
        ['clinicSubscriptionPrice', String(parseFloat(basePrice[1] || '19.99'))],
        ['clinicSubscriptionPriceWithAIPro', String(amount)],
        ['clinicIncludeAIPro', String(aiPro)],
        ['clinicSubscriptionUpdatedAt', String(payload.subscriptionUpdatedAt)],
        ['clinicId', targetClinicId],
        ['subscriptionSummaryPlan', plan],
        ['subscriptionSummaryPlanName', planName[1] || plan],
        ['subscriptionSummaryPrice', String(amount)],
        ['subscriptionSummaryIncludeAIPro', String(aiPro)],
        ['subscriptionSummaryEmail', userEmail || ''],
        ['subscriptionSummaryClinicName', clinicNameValue],
      ]);

      // Send styled email confirmation
      await sendSubscriptionReceiptMock({
        clinicId: targetClinicId,
        actorId: memberId || targetClinicId,
        actorName: 'Owner',
        payload: {
          clinicName: clinicNameValue,
          plan: plan as 'MONTHLY' | 'YEARLY',
          amount,
          method: (selectedPaymentMethod?.toUpperCase() || 'CARD') as 'PAYPAL' | 'CARD' | 'BANK',
          includeAIPro: aiPro,
        },
      });

      // Clear pending data
      await AsyncStorage.multiRemove([
        'pendingSubscriptionPlan',
        'pendingSubscriptionPlanName',
        'pendingSubscriptionPrice',
        'pendingSubscriptionPriceWithAIPro',
        'pendingIncludeAIPro',
        'pendingClinicName',
        'pendingClinicPhone',
      ]);

      setLoading(false);
      router.push('/clinic/feedback' as any);
    } catch (err: any) {
      console.error('[SUBSCRIPTION ERROR]:', err);
      setLoading(false);
      
      let errorMsg = err.message || t('subscription.confirmFailed', 'Failed to confirm subscription. Please try again.');
      if (err.code === 'permission-denied') {
        errorMsg = t('subscription.permissionDenied', 'Permission denied. Please check your account permissions.');
      }
      
      Alert.alert(t('common.error', 'Error'), errorMsg || t('subscription.confirmFailed', 'Failed to confirm subscription. Please try again.'));
    }
  };

  const goBack = () => {
    // Only allow back button before subscription is confirmed
    if (!loading) {
      router.back();
    }
  };

  // If access was denied, show a soft redirect message
  if (accessDenied) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', padding: 24 }]}>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}> 
          {accessReason === 'noPlan' ? (
            <>
              <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Please start from Subscription</Text>
              <Text style={[styles.cardSubtitle, { color: colors.textSecondary, marginTop: 4 }]}>We could not find your plan selection. Restart the flow to continue.</Text>
              <TouchableOpacity style={[styles.btn, { backgroundColor: colors.buttonBackground, marginTop: 12 }]} onPress={() => router.replace('/clinic/subscribe' as any)}>
                <Text style={[styles.btnText, { color: colors.buttonText }]}>Go to Subscription</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Complete your account first</Text>
              <Text style={[styles.cardSubtitle, { color: colors.textSecondary, marginTop: 4 }]}>We need your clinic details and email to proceed.</Text>
              <TouchableOpacity style={[styles.btn, { backgroundColor: colors.buttonBackground, marginTop: 12 }]} onPress={() => router.replace('/clinic/signup' as any)}>
                <Text style={[styles.btnText, { color: colors.buttonText }]}>Go to Signup</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={{ flexGrow: 1 }}>
      <DentalCover />

      {/* Back Button */}
      <TouchableOpacity style={styles.backButton} onPress={goBack} disabled={loading}>
        <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
      </TouchableOpacity>

      {/* Subscription Card */}
      <View style={styles.cardContainer}>
        <View style={[styles.card, { backgroundColor: colors.card, shadowColor: colors.textPrimary }]}>
          {/* Title */}
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>{t('subscription.title', 'Complete Your Subscription')}</Text>
          
          {/* Subtitle */}
          <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>{t('subscription.subtitle', 'Confirm your plan and complete payment')}</Text>

          {/* Selected plan summary */}
          <View style={[styles.summaryBox, { borderColor: colors.cardBorder }]}> 
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>{t('subscription.selectedPlan', 'Selected Plan')}</Text>
              <Text style={[styles.summaryValue, { color: colors.textPrimary }]}>{planLabelText || t('subscription.plan', 'Plan')}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>{t('subscription.billingPeriod', 'Billing Period')}</Text>
              <Text style={[styles.summaryValue, { color: colors.textPrimary }]}>{billingLabelText || t('subscription.monthly', 'Monthly')}</Text>
            </View>
          </View>

          {/* Features List */}
          <View style={styles.featuresList}>
            <FeatureItem icon="✓" text={t('subscription.unlimitedPatients', 'Unlimited patient records')} colors={colors} />
            <FeatureItem icon="✓" text={t('subscription.secureCodes', 'Secure access codes')} colors={colors} />
            <FeatureItem icon="✓" text={t('subscription.hipaaStorage', 'HIPAA-compliant storage')} colors={colors} />
            <FeatureItem icon="✓" text={t('subscription.photoDoc', 'Photo documentation')} colors={colors} />
            <FeatureItem icon="✓" text={t('subscription.privateChat', 'Private patient messaging')} colors={colors} />
          </View>

          {/* Payment Method Summary */}
          <View style={[styles.paymentMethodSection]}>
            <Text style={[styles.paymentMethodTitle, { color: colors.textPrimary }]}>{t('payment.paymentMethod', 'Payment Method')}</Text>
            <View style={[styles.paymentMethodSummary, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                {selectedPaymentMethod === 'card' && <MaterialCommunityIcons name="credit-card" size={24} color={colors.accentBlue} />}
                {selectedPaymentMethod === 'apple-pay' && <MaterialCommunityIcons name="apple" size={24} color={colors.accentBlue} />}
                {selectedPaymentMethod === 'paypal' && <MaterialCommunityIcons name="credit-card-outline" size={24} color={colors.accentBlue} />}
                {selectedPaymentMethod === 'google-pay' && <MaterialCommunityIcons name="wallet-outline" size={24} color={colors.accentBlue} />}
                <Text style={[{ color: colors.textPrimary, fontWeight: '600' }]}>
                  {selectedPaymentMethod === 'card' && t('payment.card', 'Card')}
                  {selectedPaymentMethod === 'apple-pay' && t('payment.applePay', 'Apple Pay')}
                  {selectedPaymentMethod === 'paypal' && t('payment.paypal', 'PayPal')}
                  {selectedPaymentMethod === 'google-pay' && t('payment.googlePay', 'Google Pay')}
                </Text>
              </View>
            </View>
          </View>

          {/* Card Details (only shown when Card is selected) */}
          {selectedPaymentMethod === 'card' && (
            <View style={[styles.cardBox, { borderColor: colors.cardBorder }]}> 
              <Text style={[styles.cardBoxTitle, { color: colors.textPrimary }]}>{t('payment.cardTitle', 'Payment details')}</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.textPrimary }]}
                placeholder={t('payment.cardName', 'Name on card')}
                placeholderTextColor={colors.inputPlaceholder}
                value={cardName}
                onChangeText={setCardName}
              />
              <TextInput
                style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.textPrimary }]}
                placeholder={t('payment.cardNumber', 'Card number')}
                placeholderTextColor={colors.inputPlaceholder}
                keyboardType="number-pad"
                value={cardNumber}
                onChangeText={setCardNumber}
              />
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TextInput
                  style={[styles.inputHalf, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.textPrimary }]}
                  placeholder={t('payment.expiry', 'MM/YY')}
                  placeholderTextColor={colors.inputPlaceholder}
                  keyboardType="number-pad"
                  value={cardExpiry}
                  onChangeText={setCardExpiry}
                  maxLength={7}
                />
                <TextInput
                  style={[styles.inputHalf, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.textPrimary }]}
                  placeholder={t('payment.cvc', 'CVC')}
                  placeholderTextColor={colors.inputPlaceholder}
                  keyboardType="number-pad"
                  value={cardCvc}
                  onChangeText={setCardCvc}
                  maxLength={4}
                />
              </View>
              <View style={styles.totalRow}>
                <Text style={[styles.totalLabel, { color: colors.textSecondary }]}>{t('payment.totalDue', 'Total due today')}</Text>
                <Text style={[styles.totalValue, { color: colors.textPrimary }]}>${finalAmount || '—'}</Text>
              </View>
            </View>
          )}

          {/* Confirm Button */}
          <TouchableOpacity 
            style={[styles.ctaButton, { backgroundColor: cardValid() ? colors.buttonBackground : colors.inputBorder }, (!cardValid() || loading) && styles.ctaButtonDisabled]} 
            onPress={handleProcessPayment} 
            disabled={!cardValid()}
          >
            {loading ? (
              <ActivityIndicator color={colors.buttonText} />
            ) : (
              <Text style={[styles.ctaButtonText, { color: colors.buttonText }]}>
                {t('payment.payNow', `Pay $${finalAmount || ''} now`)}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

function FeatureItem({ icon, text, colors }: { icon: string; text: string; colors: any }) {
  return (
    <View style={styles.featureItem}>
      <Text style={[styles.featureIcon, { color: colors.accentBlue }]}>{icon}</Text>
      <Text style={[styles.featureText, { color: colors.textPrimary }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  backButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
  },
  cardContainer: {
    paddingHorizontal: 16,
    paddingVertical: 30,
    flex: 1,
    justifyContent: 'flex-start',
  },
  card: {
    borderRadius: 16,
    padding: 24,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  cardTitle: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  cardSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  featuresList: {
    marginBottom: 24,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  input: { borderWidth: 1, borderRadius: 8, padding: 12, marginBottom: 8 },
  inputHalf: { flex: 1, borderWidth: 1, borderRadius: 8, padding: 12, marginBottom: 8 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  totalLabel: { fontSize: 14, fontWeight: '600' },
  totalValue: { fontSize: 18, fontWeight: '800' },
  featureIcon: {
    fontSize: 18,
    marginRight: 12,
    fontWeight: '700',
  },
  featureText: {
    fontSize: 14,
    fontWeight: '500',
  },
  priceSection: {
    borderRadius: 12,
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginBottom: 24,
    borderLeftWidth: 4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  priceAmount: {
    fontSize: 48,
    fontWeight: '700',
    lineHeight: 52,
  },
  priceOld: {
    fontSize: 24,
    fontWeight: '600',
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },
  priceLabel: {
    fontSize: 16,
    marginTop: 4,
  },
  priceNote: {
    fontSize: 14,
    marginTop: 6,
    textAlign: 'center',
  },
  promoLine: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 12,
    textAlign: 'center',
  },
  btn: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  btnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  ctaButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  ctaButtonDisabled: {
    opacity: 0.7,
  },
  ctaButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  summaryBox: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: '800',
  },
  paymentMethodSection: {
    marginBottom: 24,
  },
  paymentMethodTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  paymentMethodSummary: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  paymentMethodsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12,
  },
  paymentMethodTile: {
    flex: Platform.OS === 'android' ? 0 : 1,
    minWidth: '22%',
    aspectRatio: 1,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  paymentMethodLabel: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  paymentPrompt: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
  cardBox: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    marginTop: 16,
  },
  cardBoxTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 12,
  },
});
