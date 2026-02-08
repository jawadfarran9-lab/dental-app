import { db } from '@/firebaseConfig';
import { useAuth } from '@/src/context/AuthContext';
import { useTheme } from '@/src/context/ThemeContext';
import { SUBSCRIPTION_PRICING, SUBSCRIPTION_PRICING_OLD } from '@/src/types/subscription';
import { useClinicGuard } from '@/src/utils/navigationGuards';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import { addDoc, collection, doc, getDoc } from 'firebase/firestore';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, BackHandler, KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type PlanId = 'MONTHLY' | 'YEARLY';

type PlanOption = {
  id: PlanId;
  name: string;
  basePrice: number;
  oldPrice: number;
  billingPeriod: string;
  yearlyEquivalent?: string;
  savings?: string;
  badge?: string;
  features: string[];
  accent: string;
};

/**
 * CLINIC SUBSCRIPTION PAGE
 *
 * Shows available plans, mock payment, and saves subscription to Firestore.
 */
export default function ClinicSubscribeLanding() {
  const router = useRouter();
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const { userId, clinicId, userRole, clinicRole } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<PlanId | null>(null);
  const [currentPlan, setCurrentPlan] = useState<PlanId | null>(null);
  const [isSubscribed, setIsSubscribed] = useState<boolean | null>(null);
  const [effectiveClinicId, setEffectiveClinicId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [selectedAIPro, setSelectedAIPro] = useState(false);

  const plans = useMemo<PlanOption[]>(() => (
    [
      {
        id: 'MONTHLY',
        name: t('subscription.monthlyPlan', 'Monthly'),
        basePrice: SUBSCRIPTION_PRICING.monthly,
        oldPrice: SUBSCRIPTION_PRICING_OLD.monthly,
        billingPeriod: t('subscription.perMonth', '/month'),
        badge: t('subscription.recommended', 'Best value'),
        accent: '#10b981',
        features: [
          t('subscription.feature1', 'Unlimited staff seats'),
          t('subscription.feature2', 'AI notes & templates'),
          t('subscription.feature3', 'Priority support'),
        ],
      },
      {
        id: 'YEARLY',
        name: t('subscription.yearlyPlan', 'Annual'),
        basePrice: SUBSCRIPTION_PRICING.yearly,
        oldPrice: SUBSCRIPTION_PRICING_OLD.yearly,
        billingPeriod: t('subscription.perYear', '/year'),
        yearlyEquivalent: `$${SUBSCRIPTION_PRICING.yearlyMonthlyEquivalent.toFixed(2)}/mo`,
        savings: `Save $${SUBSCRIPTION_PRICING.savingsAmount.toFixed(2)}`,
        badge: t('subscription.bestDeal', 'Best deal'),
        accent: '#a855f7',
        features: [
          t('subscription.feature1', 'Unlimited staff seats'),
          t('subscription.feature2', 'AI notes & templates'),
          t('subscription.feature3', 'Priority support'),
        ],
      },
    ]
  ), [t]);

  // Prevent patients from accessing clinic subscription
  useClinicGuard();

  // Intercept hardware back button on subscribe screen
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        goBack();
        return true;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [])
  );

  // Load current subscription state on mount only (not on every focus to prevent delay)
  useEffect(() => {
    const loadSubscription = async () => {
      try {
        const storedId = clinicId
          || (await AsyncStorage.getItem('clinicId'))
          || (await AsyncStorage.getItem('clinicIdPendingSubscription'));

        setEffectiveClinicId(storedId);

        if (userRole === 'clinic' && clinicRole !== 'owner') {
          router.replace('/(tabs)/home' as any);
          return;
        }

        if (!storedId) {
          setIsSubscribed(false);
          setCurrentPlan(null);
          return;
        }

        const clinicSnap = await getDoc(doc(db, 'clinics', storedId));
        if (clinicSnap.exists()) {
          const clinicData = clinicSnap.data();
          const plan = (clinicData.subscriptionPlan as PlanId) || null;
          setCurrentPlan(plan);
          setSelectedPlan(plan || 'PRO');
          setIsSubscribed(clinicData.subscribed === true);
          if (plan) {
            await AsyncStorage.setItem('clinicSubscriptionPlan', plan);
          }
        } else {
          setIsSubscribed(false);
          setCurrentPlan(null);
        }
      } catch (error) {
        console.error('[SUBSCRIPTION CHECK ERROR]', error);
        setIsSubscribed(false);
        setCurrentPlan(null);
      }
    };

    loadSubscription();
  }, [clinicId, clinicRole, userRole]);

  const handleSubscribe = async (plan: PlanOption) => {
    if (saving || !plan) return;

    try {
      setSaving(true);
      // If already subscribed, route to upgrade/change plan flow
      if (isSubscribed) {
        setSaving(false);
        router.push('/clinic/upgrade' as any);
        return;
      }

      // Calculate final price with AI Pro add-on if selected
      const aiProAddOn = plan.id === 'YEARLY' ? SUBSCRIPTION_PRICING.aiProYearly : SUBSCRIPTION_PRICING.aiPro;
      const finalPrice = selectedAIPro ? plan.basePrice + aiProAddOn : plan.basePrice;

      // Create or get clinicId for this subscription flow
      let targetClinicId = clinicId || (await AsyncStorage.getItem('clinicId'));
      
      if (!targetClinicId) {
        // Create a minimal clinic document to track this subscription
        const newClinicRef = await addDoc(collection(db, 'clinics'), {
          subscribed: false, // Will be updated in payment step
          createdAt: Date.now(),
          status: 'pending_subscription',
        });
        targetClinicId = newClinicRef.id;
        await AsyncStorage.setItem('clinicId', targetClinicId);
        console.log(`[SUBSCRIBE] Created clinic document: ${targetClinicId}`);
      }

      // Save plan selection to AsyncStorage for next steps
      const priceData: Array<[string, string]> = [
        ['pendingSubscriptionPlan', plan.id],
        ['pendingSubscriptionPlanName', plan.name],
        ['pendingSubscriptionPrice', plan.basePrice.toFixed(2)],
        ['pendingSubscriptionPriceWithAIPro', finalPrice.toFixed(2)],
        ['pendingIncludeAIPro', String(selectedAIPro)],
      ];
      
      console.log(`[SUBSCRIBE] About to save plan:`, { planId: plan.id, basePrice: plan.basePrice, finalPrice });
      
      await AsyncStorage.multiSet(priceData);
      
      // Verify the data was saved
      const verification = await AsyncStorage.multiGet([
        'pendingSubscriptionPlan',
        'pendingSubscriptionPrice',
        'pendingSubscriptionPriceWithAIPro',
      ]);
      
      console.log(`[SUBSCRIBE] Verification - Data saved to AsyncStorage:`, {
        plan: verification[0][1],
        basePrice: verification[1][1],
        aiProPrice: verification[2][1],
      });

      setSaving(false);

      // Small delay to ensure AsyncStorage write is complete
      await new Promise(resolve => setTimeout(resolve, 100));

      // Route to account creation screen with clinicId
      router.push(`/clinic/signup?clinicId=${targetClinicId}` as any);
    } catch (error) {
      setSaving(false);
      console.error('[SUBSCRIBE ERROR]', error);
      Alert.alert(t('common.error'), t('subscription.mockPaymentFailed', 'Failed to proceed. Please try again.'));
    }
  };

  const goBack = () => {
    router.replace('/(tabs)/home' as any);
  };

  const handleRemoveSubscription = async () => {
    Alert.alert(
      'Remove Subscription',
      'This will clear your subscription state. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.multiRemove([
                'pendingSubscriptionPlan',
                'pendingSubscriptionPlanName',
                'pendingSubscriptionPrice',
                'pendingSubscriptionPriceWithAIPro',
                'pendingIncludeAIPro',
                'clinicId',
                'clinicSubscriptionPlan',
              ]);
              // Reset all UI state to allow fresh subscription
              setIsSubscribed(false);
              setCurrentPlan(null);
              setSelectedPlan('MONTHLY');
              setSelectedAIPro(false);
              setEffectiveClinicId(null);
              // Stay on same page - no navigation, no alert that blocks
            } catch (error) {
              Alert.alert('Error', 'Failed to remove subscription. Try again.');
            }
          }
        }
      ]
    );
  };

  // Calculate dynamic price based on selected plan and AI Pro
  const calculateSubscriptionPrice = (): string => {
    const selectedPlanData = plans.find(p => p.id === selectedPlan);
    if (!selectedPlanData) return '';
    
    let finalPrice = selectedPlanData.basePrice;
    if (selectedAIPro) {
      const aiProAddOn = selectedPlan === 'YEARLY' 
        ? SUBSCRIPTION_PRICING.aiProYearly 
        : SUBSCRIPTION_PRICING.aiPro;
      finalPrice += aiProAddOn;
    }
    return finalPrice.toFixed(2);
  };

  // Generate button text with proper pricing format
  const getButtonText = (plan: PlanOption): string => {
    if (selectedPlan !== plan.id) return '';
    
    const price = calculateSubscriptionPrice();
    const billingPeriod = selectedPlan === 'YEARLY' ? '/year' : '/month';
    return `Start Subscription – $${price}${billingPeriod}`;
  };

  return (
    <SafeAreaView style={[{ backgroundColor: colors.background }, { flex: 1 }]}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        style={{ flex: 1 }}
      >
        <ScrollView 
          style={[styles.container, { backgroundColor: colors.background }]} 
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
        {/* Clean Header */}
        <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.cardBorder }]}>
          <TouchableOpacity style={styles.headerBackBtn} onPress={goBack}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>BeSmile AI</Text>
          {isSubscribed ? (
            <TouchableOpacity onPress={handleRemoveSubscription} style={{ padding: 8 }}>
              <Text style={{ fontSize: 13, color: '#ef4444', fontWeight: '600' }}>Remove</Text>
            </TouchableOpacity>
          ) : (
            <View style={{ width: 44 }} />
          )}
        </View>

      <View style={styles.cardContainer}>
        {isSubscribed && (
          <View style={[
            styles.currentPlanBox,
            { backgroundColor: isDark ? '#0f172a' : '#ecfeff', borderColor: isDark ? '#1f2937' : '#67e8f9' }
          ]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.currentPlanLabel, { color: colors.textSecondary }]}>
                {t('subscription.currentPlanLabel', 'You are subscribed to:')}
              </Text>
              <Text style={[styles.currentPlanValue, { color: colors.textPrimary }]}>
                {currentPlan ? (plans.find((p) => p.id === currentPlan)?.name || t('subscription.planUnknown', 'Current plan')) : t('subscription.planUnknown', 'Current plan')}
              </Text>
            </View>
            <TouchableOpacity 
              style={[styles.changePlanBtn, { backgroundColor: colors.accentBlue }]}
              onPress={() => router.push('/clinic/upgrade' as any)}
            >
              <Text style={[styles.changePlanText, { color: '#fff' }]}>
                {t('subscription.changePlan', 'Change Plan')}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <Text style={[styles.selectorTitle, { color: colors.textPrimary }]}>Choose Your Plan</Text>

        <View style={styles.planGrid}>
          {plans.map((plan) => {
            const isCurrent = currentPlan === plan.id;
            const isSelected = selectedPlan === plan.id;

            return (
              <TouchableOpacity
                key={plan.id}
                style={[
                  styles.planCard,
                  { borderColor: isSelected ? plan.accent : colors.cardBorder, backgroundColor: colors.card },
                  isSelected && styles.planCardSelected,
                ]}
                activeOpacity={0.9}
                onPress={() => setSelectedPlan(plan.id)}
              >
                <View style={styles.planHeader}>
                  <Text style={[styles.planName, { color: colors.textPrimary }]}>{plan.name}</Text>
                  {plan.badge && (
                    <View style={[styles.badge, { backgroundColor: plan.accent }]}>
                      <Text style={styles.badgeText}>{plan.badge}</Text>
                    </View>
                  )}
                </View>

                {/* Price with old price strikethrough */}
                <View style={styles.priceSection}>
                  <View style={styles.priceRow}>
                    <Text style={[styles.planPrice, { color: colors.textPrimary }]}>${plan.basePrice.toFixed(2)}</Text>
                    <Text style={[styles.planPeriod, { color: colors.textSecondary }]}>{plan.billingPeriod}</Text>
                  </View>
                  <Text style={[styles.oldPrice, { color: colors.gray }]}>
                    <Text style={{ textDecorationLine: 'line-through' }}>${plan.oldPrice.toFixed(2)}</Text>
                  </Text>
                  {plan.yearlyEquivalent && (
                    <Text style={[styles.equivalentPrice, { color: colors.gray }]}>{plan.yearlyEquivalent}</Text>
                  )}
                  {plan.savings && (
                    <Text style={[styles.savingsLabel, { color: plan.accent }]}>{plan.savings}</Text>
                  )}
                </View>

                <View style={styles.featureList}>
                  {plan.features.map((feature) => (
                    <View key={`${plan.id}-${feature}`} style={styles.featureItemRow}>
                      <Ionicons name="checkmark-circle" size={18} color={plan.accent} />
                      <Text style={[styles.featureText, { color: colors.textPrimary }]}>{feature}</Text>
                    </View>
                  ))}
                </View>

                {isCurrent && (
                  <View style={[styles.currentChip, { borderColor: plan.accent }]}>
                    <Text style={[styles.currentChipText, { color: plan.accent }]}>{t('subscription.currentPlanChip', 'Current plan')}</Text>
                  </View>
                )}

                {/* Price Display Above Button */}
                {selectedPlan === plan.id && (
                  <View style={styles.selectedPriceDisplay}>
                    <Text style={[styles.selectedPrice, { color: plan.accent }]}>
                      ${plan.basePrice.toFixed(2)}/{selectedPlan === 'YEARLY' ? 'year' : 'month'}
                    </Text>
                  </View>
                )}

                {/* Simple Select Button */}
                <TouchableOpacity
                  style={[
                    styles.planCta,
                    { backgroundColor: plan.accent },
                    (isCurrent || !selectedPlan) && styles.disabledPlanCta
                  ]}
                  onPress={() => handleSubscribe(plan)}
                  activeOpacity={0.8}
                  disabled={saving || isCurrent || !selectedPlan}
                >
                  {saving && selectedPlan === plan.id ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.planCtaText}>
                      {isCurrent 
                        ? t('subscription.currentPlanChip', 'Current plan') 
                        : selectedPlan === plan.id
                          ? t('subscription.subscribeCta', 'Subscribe')
                          : t('subscription.selectPlan', 'Select')
                      }
                    </Text>
                  )}
                </TouchableOpacity>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* AI Pro Add-on */}
        <View style={[styles.aiProSection, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
          <View style={styles.aiProHeader}>
            <View style={styles.aiProTitleRow}>
              <Ionicons name="sparkles" size={20} color="#d946ef" style={{ marginRight: 8 }} />
              <Text style={[styles.aiProTitle, { color: colors.textPrimary }]}>
                {t('subscription.aiProAddOn', `AI Pro - $${SUBSCRIPTION_PRICING.aiPro.toFixed(2)}`)}
              </Text>
            </View>
            <TouchableOpacity
              style={[
                styles.aiProToggle,
                {
                  backgroundColor: selectedAIPro ? '#d946ef' : colors.cardBorder,
                  borderColor: selectedAIPro ? '#d946ef' : colors.textSecondary,
                },
              ]}
              onPress={() => setSelectedAIPro(!selectedAIPro)}
              activeOpacity={0.7}
            >
              {selectedAIPro && <Ionicons name="checkmark" size={16} color="#fff" />}
            </TouchableOpacity>
          </View>
          
          <Text style={[styles.aiProDescription, { color: colors.textSecondary }]}>
            {t('subscription.aiProDescription', 'Advanced AI features for your clinic')}
          </Text>
          
          <View style={styles.aiProFeatures}>
            {[
              t('subscription.aiProFeature1', 'Intelligent note generation'),
              t('subscription.aiProFeature2', 'Patient message analysis'),
              t('subscription.aiProFeature3', 'Treatment recommendations'),
            ].map((feature, idx) => (
              <View key={idx} style={styles.aiProFeatureItem}>
                <Ionicons name="checkmark-circle" size={16} color="#d946ef" />
                <Text style={[styles.aiProFeatureText, { color: colors.textPrimary }]}>{feature}</Text>
              </View>
            ))}
          </View>
        </View>

        <TouchableOpacity onPress={() => router.push('/clinic/login' as any)}>
          <Text style={[styles.secondaryLink, { color: colors.accentBlue }]}>{t('subscription.alreadyHaveAccount', 'Already have an account?')}</Text>
        </TouchableOpacity>
      </View>
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  cardContainer: {
    paddingHorizontal: 16,
    paddingVertical: 24,
    flex: 1,
    gap: 12,
  },
  cardTitle: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 6,
  },
  cardSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 12,
  },
  selectorTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginVertical: 12,
    textAlign: 'center',
  },
  planGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
  },
  planCard: {
    width: '48%',
    borderWidth: 2,
    borderRadius: 14,
    padding: 14,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  planCardSelected: {
    shadowOpacity: 0.14,
    shadowRadius: 12,
    elevation: 6,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  planName: {
    fontSize: 16,
    fontWeight: '700',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  priceSection: {
    marginBottom: 12,
    gap: 4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginBottom: 4,
  },
  planPrice: {
    fontSize: 28,
    fontWeight: '800',
  },
  planPeriod: {
    fontSize: 14,
    fontWeight: '600',
  },
  oldPrice: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  equivalentPrice: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 2,
  },
  savingsLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
  },
  featureList: {
    gap: 8,
    marginBottom: 12,
  },
  featureItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureText: {
    fontSize: 13,
    fontWeight: '600',
  },
  selectedPriceDisplay: {
    marginBottom: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  selectedPrice: {
    fontSize: 16,
    fontWeight: '700',
  },
  planCta: {
    marginTop: 6,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledPlanCta: {
    opacity: 0.6,
  },
  planCtaText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 13,
    textAlign: 'center',
  },
  secondaryLink: {
    textAlign: 'center',
    fontWeight: '600',
    marginTop: 12,
  },
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
  currentPlanBox: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  currentPlanLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
  },
  currentPlanValue: {
    fontSize: 16,
    fontWeight: '800',
  },
  changePlanBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  changePlanText: {
    fontSize: 13,
    fontWeight: '700',
  },
  currentChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  currentChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  aiProSection: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginVertical: 12,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  aiProHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  aiProTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  aiProTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  aiProToggle: {
    width: 32,
    height: 32,
    borderRadius: 999,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  aiProDescription: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 10,
  },
  aiProFeatures: {
    gap: 8,
  },
  aiProFeatureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  aiProFeatureText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
