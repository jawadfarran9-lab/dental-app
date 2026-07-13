import PremiumGradientBackground from '@/src/components/PremiumGradientBackground';
import { useTheme } from '@/src/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const ACCENT = '#3D9EFF';
const ACCENT_SOFT = 'rgba(61,158,255,0.12)';
const ACCENT_BORDER = 'rgba(61,158,255,0.35)';

/**
 * SUBSCRIBE CHOICE — reachable at /subscribe-choice
 *
 * Landing that lets the user pick between the Clinic subscription
 * flow and an App subscription flow. Both options are disabled
 * placeholders in this step.
 */
export default function SubscribeChoiceScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();

  // Placeholder — wire up in a future step.
  const onClinicSubscription = () => {};

  // Placeholder — wire up in a future step.
  const onAppSubscription = () => {};

  return (
    <View style={styles.root}>
      <PremiumGradientBackground isDark={isDark} showSparkles={!isDark} />
      <SafeAreaView style={styles.safe}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerBackBtn}
            onPress={() => router.replace('/login' as any)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
            BeSmile AI
          </Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.content}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>
            Choose Subscription
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Select the plan type that fits you best
          </Text>

          <View style={styles.options}>
            {/* Placeholder — wire up in a future step. */}
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={onClinicSubscription}
              disabled
              style={[
                styles.card,
                {
                  backgroundColor: 'rgba(255,255,255,0.18)',
                  borderColor: isDark ? 'rgba(255,255,255,0.10)' : ACCENT_BORDER,
                },
              ]}
            >
              <LinearGradient
                colors={['#54ACFF', '#1E6FD9']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardIconTile}
              >
                <Ionicons name="shield-checkmark-outline" size={30} color="#FFFFFF" />
              </LinearGradient>
              <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
                Clinic Subscription
              </Text>
              <Text style={[styles.cardDesc, { color: colors.textSecondary }]}>
                Manage your clinic, patients & content
              </Text>
            </TouchableOpacity>

            {/* Placeholder — wire up in a future step. */}
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={onAppSubscription}
              disabled
              style={[
                styles.card,
                {
                  backgroundColor: 'rgba(255,255,255,0.18)',
                  borderColor: isDark ? 'rgba(255,255,255,0.10)' : ACCENT_BORDER,
                },
              ]}
            >
              <LinearGradient
                colors={['#54ACFF', '#1E6FD9']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardIconTile}
              >
                <Ionicons name="sparkles" size={30} color="#FFFFFF" />
              </LinearGradient>
              <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
                App Subscription
              </Text>
              <Text style={[styles.cardDesc, { color: colors.textSecondary }]}>
                Unlock premium features across the app
              </Text>
            </TouchableOpacity>
          </View>

          <View
            style={[
              styles.hintCard,
              {
                backgroundColor: isDark ? 'rgba(61,158,255,0.08)' : ACCENT_SOFT,
                borderColor: isDark ? 'rgba(61,158,255,0.22)' : 'rgba(61,158,255,0.18)',
              },
            ]}
          >
            <Ionicons name="information-circle" size={18} color={ACCENT} />
            <Text style={[styles.hintText, { color: colors.textSecondary }]}>
              Subscription options coming soon.
            </Text>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  safe: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  headerBackBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  headerSpacer: {
    width: 44,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.5,
    marginTop: 12,
  },
  subtitle: {
    fontSize: 14.5,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 28,
  },
  options: {
    gap: 18,
  },
  card: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    borderRadius: 20,
    borderWidth: 1,
    paddingVertical: 30,
    paddingHorizontal: 20,
    minHeight: 195,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  cardIconTile: {
    width: 64,
    height: 64,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2E7CE0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTextWrap: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.1,
    textAlign: 'center',
  },
  cardDesc: {
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 2,
  },
  hintCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 24,
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignSelf: 'center',
  },
  hintText: {
    fontSize: 13,
    fontWeight: '500',
  },
});
