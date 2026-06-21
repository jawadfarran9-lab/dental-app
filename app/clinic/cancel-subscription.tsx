import { db } from '@/firebaseConfig';
import { PremiumGradientBackground } from '@/src/components/PremiumGradientBackground';
import { useAuth } from '@/src/context/AuthContext';
import { useTheme } from '@/src/context/ThemeContext';
import { useClinicRoleGuard } from '@/src/utils/navigationGuards';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useRouter } from 'expo-router';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type PlanPeriod = 'MONTHLY' | 'ANNUAL';

interface ClinicSubscriptionSnapshot {
  subscriptionPlan: PlanPeriod | null;
  subscriptionPlanName: string | null;
  finalPrice: number | null;
  subscriptionPrice: number | null;
  includeAIPro: boolean;
}

const ACCENT = '#3D9EFF';
const ROSE = '#F43F5E';
const ROSE_DARK = '#E11D48';
const GREEN = '#10B981';
const GOLD = '#F5A300';

export default function ClinicCancelSubscriptionScreen() {
  useClinicRoleGuard(['owner']);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { clinicId, checkAuthState } = useAuth();

  const [loading, setLoading] = useState(true);
  const [snap, setSnap] = useState<ClinicSubscriptionSnapshot | null>(null);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!clinicId) {
        setLoading(false);
        return;
      }
      try {
        const clinicSnap = await getDoc(doc(db, 'clinics', clinicId));
        if (cancelled) return;
        if (clinicSnap.exists()) {
          const data = clinicSnap.data();
          setSnap({
            subscriptionPlan:
              data.subscriptionPlan === 'MONTHLY' || data.subscriptionPlan === 'ANNUAL'
                ? (data.subscriptionPlan as PlanPeriod)
                : null,
            subscriptionPlanName:
              typeof data.subscriptionPlanName === 'string' ? data.subscriptionPlanName : null,
            finalPrice: typeof data.finalPrice === 'number' ? data.finalPrice : null,
            subscriptionPrice:
              typeof data.subscriptionPrice === 'number' ? data.subscriptionPrice : null,
            includeAIPro: data.includeAIPro === true,
          });
        }
      } catch (err) {
        console.error('[CANCEL-SUB] load error', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [clinicId]);

  const handleBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/clinic/settings' as any);
  };

  const performCancellation = async () => {
    if (!clinicId) {
      Alert.alert("Couldn't cancel", 'Missing clinic session. Please reopen the page.');
      return;
    }
    try {
      setCancelling(true);
      await setDoc(
        doc(db, 'clinics', clinicId),
        {
          status: 'cancelled',
          subscribed: false,
          subscriptionPlan: null,
          includeAIPro: false,
          subscriptionCancelledAt: serverTimestamp(),
          subscriptionUpdatedAt: Date.now(),
        },
        { merge: true }
      );
      await setDoc(
        doc(db, 'clinics_public', clinicId),
        { isPublished: false },
        { merge: true }
      );
      await checkAuthState();
      router.replace('/clinic/subscribe?reason=cancelled' as any);
    } catch (err) {
      console.error('[CANCEL-SUB] cancel error', err);
      Alert.alert("Couldn't cancel", 'Please try again.');
    } finally {
      setCancelling(false);
    }
  };

  const handleCancelPress = () => {
    if (cancelling) return;
    Alert.alert(
      'Cancel subscription?',
      'Your access ends immediately. You can re-subscribe anytime — your data is never deleted.',
      [
        { text: 'Keep plan', style: 'cancel' },
        {
          text: 'Cancel subscription',
          style: 'destructive',
          onPress: () => {
            performCancellation();
          },
        },
      ]
    );
  };

  const planLabel = (() => {
    if (snap?.subscriptionPlanName && snap.subscriptionPlanName.trim().length > 0) {
      return snap.subscriptionPlanName.trim();
    }
    if (snap?.subscriptionPlan === 'MONTHLY') return 'Monthly';
    if (snap?.subscriptionPlan === 'ANNUAL') return 'Annual';
    return 'Your plan';
  })();

  const priceText = (() => {
    const amount =
      typeof snap?.finalPrice === 'number'
        ? snap.finalPrice
        : typeof snap?.subscriptionPrice === 'number'
          ? snap.subscriptionPrice
          : null;
    if (amount === null || !snap?.subscriptionPlan) return null;
    const period = snap.subscriptionPlan === 'ANNUAL' ? 'year' : 'month';
    return `$${amount.toFixed(2)} / ${period}`;
  })();

  const textPrimary = colors.textPrimary;
  const textSecondary = colors.textSecondary;
  const cardBg = isDark ? 'rgba(255,255,255,0.05)' : '#FFFFFF';
  const cardBorder = isDark ? 'rgba(255,255,255,0.10)' : '#EEF2F8';
  const backBg = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.92)';
  const backBgPressed = isDark ? 'rgba(255,255,255,0.15)' : 'rgba(27, 37, 66, 0.1)';
  const backIconColor = isDark ? '#FFFFFF' : '#1B2542';

  return (
    <View style={{ flex: 1 }}>
      <Stack.Screen options={{ headerShown: false }} />
      <PremiumGradientBackground isDark={isDark} showSparkles={!isDark} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Pressable
          onPress={handleBack}
          style={({ pressed }) => [
            styles.backButton,
            { backgroundColor: pressed ? backBgPressed : backBg },
          ]}
        >
          <Ionicons name="chevron-back" size={22} color={backIconColor} />
        </Pressable>

        <View style={styles.headerText}>
          <Text style={[styles.headerTitle, { color: textPrimary }]}>
            Cancel subscription
          </Text>
          <Text style={[styles.headerSubtitle, { color: textSecondary }]}>
            Manage your BeSmile AI plan
          </Text>
        </View>

        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={ACCENT} />
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 32 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Current plan card */}
          <View
            style={[
              styles.planCard,
              { backgroundColor: cardBg, borderColor: cardBorder },
            ]}
          >
            {/* Animated premium gradient + sparkles (clipped by card overflow:hidden) */}
            <PremiumGradientBackground
              isDark={isDark}
              showSparkles
              style={StyleSheet.absoluteFill}
            />
            {/* Readability scrim — translucent veil over the gradient */}
            <View
              pointerEvents="none"
              style={[
                StyleSheet.absoluteFill,
                {
                  backgroundColor: isDark
                    ? 'rgba(11, 15, 26, 0.55)'
                    : 'rgba(255, 255, 255, 0.55)',
                },
              ]}
            />
            <LinearGradient
              colors={[ACCENT, '#1E6FD9'] as any}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.planAccentStrip}
            />
            <View style={styles.planTopRow}>
              <Text style={[styles.planEyebrow, { color: textSecondary }]}>
                CURRENT PLAN
              </Text>
              <View style={styles.activePill}>
                <View style={styles.activeDot} />
                <Text style={styles.activePillText}>Active</Text>
              </View>
            </View>

            <Text style={[styles.planName, { color: textPrimary }]}>{planLabel}</Text>
            {priceText && (
              <Text style={[styles.planPrice, { color: textSecondary }]}>
                {priceText}
              </Text>
            )}

            {snap?.includeAIPro && (
              <View style={styles.aiProPill}>
                <Ionicons name="sparkles" size={12} color="#B97900" />
                <Text style={styles.aiProPillText}>AI Pro included</Text>
              </View>
            )}
          </View>

          {/* What happens card */}
          <View
            style={[
              styles.infoCard,
              { backgroundColor: cardBg, borderColor: cardBorder },
            ]}
          >
            <InfoRow
              icon="power"
              iconColor={ROSE}
              tintBg="rgba(244,63,94,0.12)"
              title="Your access ends right away"
              subtitle="Premium features turn off as soon as you confirm."
              titleColor={textPrimary}
              subtitleColor={textSecondary}
              showDivider={false}
              dividerColor={cardBorder}
            />
            <InfoRow
              icon="refresh"
              iconColor={ACCENT}
              tintBg="rgba(61,158,255,0.12)"
              title="Re-subscribe anytime"
              subtitle="Come back whenever — your plan restarts in seconds."
              titleColor={textPrimary}
              subtitleColor={textSecondary}
              showDivider
              dividerColor={cardBorder}
            />
            <InfoRow
              icon="shield-checkmark"
              iconColor={GREEN}
              tintBg="rgba(16,185,129,0.12)"
              title="Your data stays safe"
              subtitle="Patients, records, and settings are never deleted."
              titleColor={textPrimary}
              subtitleColor={textSecondary}
              showDivider
              dividerColor={cardBorder}
            />
          </View>

          {/* Primary destructive */}
          <Pressable
            onPress={handleCancelPress}
            disabled={cancelling}
            style={({ pressed }) => [
              styles.primaryBtnWrap,
              { transform: [{ scale: pressed && !cancelling ? 0.98 : 1 }], opacity: cancelling ? 0.7 : 1 },
            ]}
          >
            <LinearGradient
              colors={[ROSE, ROSE_DARK] as any}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.primaryBtn}
            >
              {cancelling ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryBtnText}>Cancel subscription</Text>
              )}
            </LinearGradient>
          </Pressable>

          {/* Secondary keep */}
          <Pressable
            onPress={() => {
              if (cancelling) return;
              if (router.canGoBack()) router.back();
              else router.replace('/clinic/settings' as any);
            }}
            disabled={cancelling}
            style={({ pressed }) => [
              styles.secondaryBtn,
              {
                backgroundColor: isDark
                  ? 'rgba(61,158,255,0.14)'
                  : 'rgba(61,158,255,0.10)',
                borderColor: isDark
                  ? 'rgba(61,158,255,0.35)'
                  : 'rgba(61,158,255,0.22)',
                opacity: pressed ? 0.85 : 1,
              },
            ]}
          >
            <Text style={[styles.secondaryBtnText, { color: ACCENT }]}>
              Keep my subscription
            </Text>
          </Pressable>

          <Text style={[styles.footerNote, { color: textSecondary }]}>
            You can restart your plan at any time from this same account.
          </Text>
        </ScrollView>
      )}
    </View>
  );
}

function InfoRow({
  icon,
  iconColor,
  tintBg,
  title,
  subtitle,
  titleColor,
  subtitleColor,
  showDivider,
  dividerColor,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  tintBg: string;
  title: string;
  subtitle: string;
  titleColor: string;
  subtitleColor: string;
  showDivider: boolean;
  dividerColor: string;
}) {
  return (
    <View>
      {showDivider && (
        <View style={[styles.divider, { backgroundColor: dividerColor }]} />
      )}
      <View style={styles.infoRow}>
        <View style={[styles.infoIconTile, { backgroundColor: tintBg }]}>
          <Ionicons name={icon} size={20} color={iconColor} />
        </View>
        <View style={styles.infoTextWrap}>
          <Text style={[styles.infoTitle, { color: titleColor }]}>{title}</Text>
          <Text style={[styles.infoSubtitle, { color: subtitleColor }]}>
            {subtitle}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 21,
    fontWeight: '800',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 12.5,
  },

  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
    gap: 16,
  },

  /* Current plan card */
  planCard: {
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingTop: 22,
    paddingBottom: 18,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 3,
  },
  planAccentStrip: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
  },
  planTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  planEyebrow: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  activePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(16,185,129,0.14)',
  },
  activeDot: {
    width: 7,
    height: 7,
    borderRadius: 999,
    backgroundColor: GREEN,
  },
  activePillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0B815E',
    letterSpacing: 0.3,
  },
  planName: {
    fontSize: 21,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  planPrice: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
  aiProPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    marginTop: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(245,163,0,0.16)',
  },
  aiProPillText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#B97900',
    letterSpacing: 0.3,
  },

  /* Info card */
  infoCard: {
    borderRadius: 22,
    borderWidth: 1,
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  divider: {
    height: 1,
    marginHorizontal: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  infoIconTile: {
    width: 40,
    height: 40,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoTextWrap: {
    flex: 1,
    paddingTop: 2,
  },
  infoTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    marginBottom: 3,
  },
  infoSubtitle: {
    fontSize: 12.5,
    lineHeight: 17,
    fontWeight: '500',
  },

  /* Primary destructive */
  primaryBtnWrap: {
    borderRadius: 16,
    marginTop: 4,
    shadowColor: ROSE,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 16,
    elevation: 6,
  },
  primaryBtn: {
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 15.5,
    fontWeight: '800',
    letterSpacing: 0.3,
  },

  /* Secondary keep */
  secondaryBtn: {
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  secondaryBtnText: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.2,
  },

  footerNote: {
    fontSize: 12.5,
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: 16,
    lineHeight: 17,
  },
});
