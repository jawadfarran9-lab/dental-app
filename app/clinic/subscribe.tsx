import { db } from '@/firebaseConfig';
import GlassCard from '@/src/components/GlassCard';
import { PremiumGradientBackground } from '@/src/components/PremiumGradientBackground';
import { useAuth } from '@/src/context/AuthContext';
import { useTheme } from '@/src/context/ThemeContext';
import { SUBSCRIPTION_PRICING, SUBSCRIPTION_PRICING_OLD } from '@/src/types/subscription';
import { useClinicGuard } from '@/src/utils/navigationGuards';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import { addDoc, collection, doc, getDoc } from 'firebase/firestore';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, Animated, BackHandler, KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const ACCENT = '#3D9EFF';
const ACCENT_SOFT = 'rgba(61,158,255,0.12)';
const ACCENT_BORDER = 'rgba(61,158,255,0.35)';

type PlanId = 'MONTHLY' | 'ANNUAL';

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

  // Micro-interaction: Change Plan button press scale
  const changePlanScale = useRef(new Animated.Value(1)).current;
  const onChangePlanPressIn = () => {
    Animated.timing(changePlanScale, { toValue: 0.97, duration: 120, useNativeDriver: true }).start();
  };
  const onChangePlanPressOut = () => {
    Animated.timing(changePlanScale, { toValue: 1, duration: 120, useNativeDriver: true }).start();
  };

  // Plan selection micro-interaction: animated scale 1.02, 120ms
  const monthlyScale = useRef(new Animated.Value(1)).current;
  const annualScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(monthlyScale, {
        toValue: selectedPlan === 'MONTHLY' ? 1.02 : 1,
        duration: 120,
        useNativeDriver: true,
      }),
      Animated.timing(annualScale, {
        toValue: selectedPlan === 'ANNUAL' ? 1.02 : 1,
        duration: 120,
        useNativeDriver: true,
      }),
    ]).start();
  }, [selectedPlan]);

  // Hero card subtle floating shimmer
  const heroShimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(heroShimmer, { toValue: 0.5, duration: 2800, useNativeDriver: true }),
        Animated.timing(heroShimmer, { toValue: 0, duration: 2800, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const plans = useMemo<PlanOption[]>(() => (
    [
      {
        id: 'MONTHLY',
        name: t('subscription.monthlyPlan', 'Monthly'),
        basePrice: SUBSCRIPTION_PRICING.monthly,
        oldPrice: SUBSCRIPTION_PRICING_OLD.monthly,
        billingPeriod: t('subscription.perMonth', '/month'),
        badge: t('subscription.recommended', 'Best value'),
        accent: ACCENT,
        features: [
          t('subscription.feature1', 'Unlimited staff seats'),
          t('subscription.feature2', 'AI notes & templates'),
          t('subscription.feature3', 'Priority support'),
        ],
      },
      {
        id: 'ANNUAL',
        name: t('subscription.yearlyPlan', 'Annual'),
        basePrice: SUBSCRIPTION_PRICING.yearly,
        oldPrice: SUBSCRIPTION_PRICING_OLD.yearly,
        billingPeriod: t('subscription.perYear', '/year'),
        yearlyEquivalent: `$${SUBSCRIPTION_PRICING.yearlyMonthlyEquivalent.toFixed(2)}/mo`,
        savings: `Save $${SUBSCRIPTION_PRICING.savingsAmount.toFixed(2)}`,
        badge: t('subscription.bestDeal', 'Best deal'),
        accent: ACCENT,
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
          setSelectedPlan(plan || 'MONTHLY');
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
      const aiProAddOn = plan.id === 'ANNUAL' ? SUBSCRIPTION_PRICING.aiProYearly : SUBSCRIPTION_PRICING.aiPro;
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
      }

      // Save plan selection to AsyncStorage for next steps
      const priceData: Array<[string, string]> = [
        ['pendingSubscriptionPlan', plan.id],
        ['pendingSubscriptionPlanName', plan.name],
        ['pendingSubscriptionPrice', plan.basePrice.toFixed(2)],
        ['pendingSubscriptionPriceWithAIPro', finalPrice.toFixed(2)],
        ['pendingIncludeAIPro', String(selectedAIPro)],
      ];
      
      await AsyncStorage.multiSet(priceData);

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
      const aiProAddOn = selectedPlan === 'ANNUAL' 
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
    const billingPeriod = selectedPlan === 'ANNUAL' ? '/year' : '/month';
    return `Start Subscription – $${price}${billingPeriod}`;
  };

  return (
    <View style={{ flex: 1 }}>
      {/* ── PHASE 1: Premium Gradient Background ── */}
      <PremiumGradientBackground isDark={isDark} showSparkles={!isDark} />

      <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
          style={{ flex: 1 }}
        >
          <ScrollView 
            style={styles.container} 
            contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
          >
          {/* ── Premium Header ── */}
          <View style={[styles.header, { borderBottomColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }]}>
            <TouchableOpacity style={styles.headerBackBtn} onPress={goBack}>
              <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
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

          {/* ── PHASE 2: Current Plan Hero Status Card (Glass) ── */}
          {isSubscribed && (
            <GlassCard
              intensity={58}
              tint={isDark ? 'dark' : 'light'}
              borderRadius={24}
              style={[styles.currentPlanGlass, { borderColor: isDark ? ACCENT_BORDER : 'rgba(61,158,255,0.18)' }]}
            >
              {/* Inner glass border */}
              <View style={[StyleSheet.absoluteFill, styles.heroInnerBorder]} />
              {/* Subtle top reflective overlay */}
              <LinearGradient
                colors={[
                  isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.45)',
                  isDark ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.12)',
                  'transparent',
                ]}
                locations={[0, 0.35, 1]}
                style={styles.heroReflection}
              />
              {/* Subtle floating shimmer */}
              <Animated.View style={[StyleSheet.absoluteFill, { opacity: heroShimmer, borderRadius: 24 }]} pointerEvents="none">
                <LinearGradient
                  colors={['transparent', isDark ? 'rgba(61,158,255,0.07)' : 'rgba(61,158,255,0.05)', 'transparent']}
                  start={{ x: 0, y: 0.2 }}
                  end={{ x: 1, y: 0.8 }}
                  style={[StyleSheet.absoluteFill, { borderRadius: 24 }]}
                />
              </Animated.View>
              <View style={styles.currentPlanInner}>
                <View style={[styles.currentPlanIconWrap, { backgroundColor: ACCENT_SOFT }]}>
                  <Ionicons name="shield-checkmark" size={22} color={ACCENT} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.currentPlanLabel, { color: isDark ? 'rgba(255,255,255,0.62)' : '#4B5563' }]}>
                    CURRENT PLAN
                  </Text>
                  <Text style={[styles.currentPlanValue, { color: colors.textPrimary }]}>
                    {currentPlan ? (plans.find((p) => p.id === currentPlan)?.name || t('subscription.planUnknown', 'Current plan')) : t('subscription.planUnknown', 'Current plan')}
                  </Text>
                </View>
                <Animated.View style={{ transform: [{ scale: changePlanScale }] }}>
                  <TouchableOpacity 
                    style={[styles.changePlanBtn, { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: ACCENT }]}
                    onPress={() => router.push('/clinic/upgrade' as any)}
                    onPressIn={onChangePlanPressIn}
                    onPressOut={onChangePlanPressOut}
                    activeOpacity={0.85}
                  >
                    <Text style={[styles.changePlanText, { color: ACCENT }]}>
                      {t('subscription.changePlan', 'Change Plan')}
                    </Text>
                  </TouchableOpacity>
                </Animated.View>
              </View>
            </GlassCard>
          )}

          <Text style={[styles.selectorTitle, { color: colors.textPrimary }]}>Choose Your Plan</Text>

          {/* ── PHASE 3: Plan Cards (Glass) ── */}
          <View style={styles.planGrid}>
            {plans.map((plan) => {
              const isCurrent = currentPlan === plan.id;
              const isSelected = selectedPlan === plan.id;

              return (
                <Animated.View
                  key={plan.id}
                  style={[{ width: '48%' }, { transform: [{ scale: plan.id === 'MONTHLY' ? monthlyScale : annualScale }] }]}
                >
                <TouchableOpacity
                  activeOpacity={0.88}
                  onPress={() => setSelectedPlan(plan.id)}
                >
                  <GlassCard
                    intensity={isSelected ? 55 : 35}
                    tint={isDark ? 'dark' : 'light'}
                    borderRadius={22}
                    style={[
                      styles.planCardGlass,
                      {
                        borderColor: isSelected
                          ? 'rgba(61,158,255,0.85)'
                          : isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
                        borderWidth: isSelected ? 1.5 : 0.5,
                      },
                    ]}
                  >
                    {/* Subtle accent overlay for selected */}
                    {/* Accent wash for selected */}
                    {isSelected && (
                      <View style={[StyleSheet.absoluteFill, {
                        backgroundColor: isDark ? 'rgba(61,158,255,0.03)' : 'rgba(61,158,255,0.02)',
                        borderRadius: 22,
                      }]} />
                    )}

                    {/* Glass top reflection */}
                    <LinearGradient
                      colors={[
                        isDark ? 'rgba(255,255,255,0.045)' : 'rgba(255,255,255,0.32)',
                        'transparent',
                      ]}
                      style={styles.planCardReflection}
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

                    {/* ── Price Block ── */}
                    <View style={styles.priceSection}>
                      <View style={styles.priceRow}>
                        <Text style={[styles.planPrice, { color: colors.textPrimary, flexShrink: 1 }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>${plan.basePrice.toFixed(2)}</Text>
                        <Text style={[styles.planPeriodInline, { color: isDark ? '#E5E7EB' : '#4B5563', flexShrink: 0 }]}>{plan.billingPeriod}</Text>
                      </View>
                      <Text style={[styles.oldPrice, { color: isDark ? 'rgba(255,255,255,0.22)' : 'rgba(156,163,175,0.6)' }]}>
                        <Text style={{ textDecorationLine: 'line-through' }}>${plan.oldPrice.toFixed(2)}</Text>
                      </Text>
                      {plan.yearlyEquivalent && (
                        <Text style={[styles.equivalentPrice, { color: isDark ? 'rgba(255,255,255,0.35)' : '#9CA3AF' }]}>{plan.yearlyEquivalent}</Text>
                      )}
                      {plan.savings && (
                        <Text style={[styles.savingsLabel, { color: isDark ? 'rgba(61,158,255,0.85)' : ACCENT }]}>{plan.savings}</Text>
                      )}
                    </View>

                    {/* ── Feature List ── */}
                    <View style={styles.featureList}>
                      {plan.features.map((feature) => (
                        <View key={`${plan.id}-${feature}`} style={styles.featureItemRow}>
                          <Ionicons name="checkmark-circle" size={15} color={ACCENT} />
                          <Text style={[styles.featureText, { color: isDark ? 'rgba(255,255,255,0.72)' : colors.textPrimary }]}>{feature}</Text>
                        </View>
                      ))}
                    </View>

                    {isCurrent && (
                      <View style={[styles.currentChip, { borderColor: ACCENT, backgroundColor: ACCENT_SOFT }]}>
                        <Text style={[styles.currentChipText, { color: ACCENT }]}>{t('subscription.currentPlanChip', 'Current plan')}</Text>
                      </View>
                    )}

                    {/* ── CTA Button ── */}
                    <TouchableOpacity
                      style={[
                        styles.planCta,
                        {
                          backgroundColor: isSelected ? ACCENT : isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                          borderWidth: isSelected ? 0 : StyleSheet.hairlineWidth,
                          borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                        },
                        (isCurrent || !selectedPlan) && styles.disabledPlanCta
                      ]}
                      onPress={() => handleSubscribe(plan)}
                      activeOpacity={0.8}
                      disabled={saving || isCurrent || !selectedPlan}
                    >
                      {saving && selectedPlan === plan.id ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <Text style={[styles.planCtaText, { color: isSelected ? '#fff' : isDark ? 'rgba(255,255,255,0.5)' : colors.textSecondary }]}>
                          {isCurrent 
                            ? t('subscription.currentPlanChip', 'Current plan') 
                            : selectedPlan === plan.id
                              ? t('subscription.subscribeCta', 'Subscribe')
                              : t('subscription.selectPlan', 'Select')
                          }
                        </Text>
                      )}
                    </TouchableOpacity>
                  </GlassCard>
                </TouchableOpacity>
                </Animated.View>
              );
            })}
          </View>

          {/* ── Divider + Add-ons Section Label ── */}
          <View style={[styles.sectionDivider, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' }]} />
          <Text style={[styles.sectionLabel, { color: isDark ? 'rgba(255,255,255,0.32)' : '#9CA3AF' }]}>ADD-ONS</Text>

          {/* ── PHASE 5: AI Pro Add-on (Glass) ── */}
          <Animated.View style={[selectedAIPro && { transform: [{ scale: 1.01 }] }]}>
          <GlassCard
            intensity={selectedAIPro ? 55 : 45}
            tint={isDark ? 'dark' : 'light'}
            borderRadius={22}
            style={[styles.aiProGlass, {
              borderColor: selectedAIPro ? ACCENT : isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)',
              borderWidth: selectedAIPro ? 1.5 : StyleSheet.hairlineWidth,
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
              {/* Toggle Switch */}
              <TouchableOpacity
                style={[
                  styles.aiProSwitch,
                  {
                    backgroundColor: selectedAIPro ? ACCENT : isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.16)',
                  },
                ]}
                onPress={() => setSelectedAIPro(!selectedAIPro)}
                activeOpacity={0.7}
              >
                <View style={[
                  styles.aiProSwitchKnob,
                  {
                    backgroundColor: '#fff',
                    transform: [{ translateX: selectedAIPro ? 18 : 2 }],
                  },
                ]} />
              </TouchableOpacity>
            </View>
            
            <Text style={[styles.aiProDescription, { color: isDark ? 'rgba(255,255,255,0.52)' : colors.textSecondary }]}>
              {t('subscription.aiProDescription', 'Advanced AI features for your clinic')}
            </Text>
            
            <View style={styles.aiProFeatures}>
              {[
                t('subscription.aiProFeature1', 'Intelligent note generation'),
                t('subscription.aiProFeature2', 'Patient message analysis'),
                t('subscription.aiProFeature3', 'Treatment recommendations'),
              ].map((feature, idx) => (
                <View key={idx} style={styles.aiProFeatureItem}>
                  <Ionicons name="checkmark-circle" size={15} color={ACCENT} />
                  <Text style={[styles.aiProFeatureText, { color: isDark ? 'rgba(255,255,255,0.74)' : colors.textPrimary }]}>{feature}</Text>
                </View>
              ))}
            </View>
          </GlassCard>
          </Animated.View>

          <TouchableOpacity onPress={() => router.push('/clinic/login' as any)}>
            <Text style={[styles.secondaryLink, { color: ACCENT }]}>{t('subscription.alreadyHaveAccount', 'Already have an account?')}</Text>
          </TouchableOpacity>
        </View>
        </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
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
    gap: 24,
  },
  selectorTitle: {
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
  planCardReflection: {
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
    marginBottom: 16,
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
  },
  planPeriodInline: {
    fontSize: 18,
    fontWeight: '500',
    opacity: 0.6,
    marginLeft: 6,
    marginTop: 6,
  },
  oldPrice: {
    fontSize: 12,
    fontWeight: '500',
    opacity: 0.45,
    marginBottom: 2,
  },
  equivalentPrice: {
    fontSize: 11,
    fontWeight: '500',
    opacity: 0.55,
    marginBottom: 1,
  },
  savingsLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 3,
    opacity: 0.85,
  },
  featureList: {
    gap: 6,
    marginBottom: 16,
  },
  featureItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  featureText: {
    fontSize: 12,
    fontWeight: '600',
  },
  planCta: {
    marginTop: 4,
    borderRadius: 12,
    paddingVertical: 11,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledPlanCta: {
    opacity: 0.45,
  },
  planCtaText: {
    fontWeight: '800',
    fontSize: 13,
    textAlign: 'center',
  },

  /* ── Header ── */
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

  /* ── Section Label ── */
  sectionDivider: {
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

  /* ── Current Plan (Glass Hero) ── */
  heroReflection: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 24,
    height: '50%',
  },
  heroInnerBorder: {
    borderRadius: 23,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.12)',
    margin: 1,
  },
  currentPlanGlass: {
    borderWidth: 1,
    overflow: 'hidden',
  },
  currentPlanInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    paddingVertical: 22,
    gap: 16,
  },
  currentPlanIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  currentPlanLabel: {
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 6,
    letterSpacing: 1.2,
    opacity: 0.7,
    textTransform: 'uppercase',
  },
  currentPlanValue: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 0.1,
  },
  changePlanBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
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
    fontSize: 11,
    fontWeight: '700',
  },

  /* ── AI Pro (Glass) ── */
  aiProGlass: {
  },
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
  aiProDescription: {
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

  /* ── Footer Link ── */
  secondaryLink: {
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 14,
  },
});
