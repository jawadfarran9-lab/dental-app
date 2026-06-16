import PremiumGradientBackground from '@/src/components/PremiumGradientBackground';
import { useTheme } from '@/src/context/ThemeContext';
import {
  CLINIC_HOME_CONFIG,
  ClinicTypeKey,
} from '@/src/utils/clinicTypeConfig';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  I18nManager,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

interface QuickActionDef {
  title: string;
  subtitle: string;
  icon: IoniconName;
  tile: readonly [string, string];
  shadow: string;
  route: string;
}

interface ClinicHomeScreenProps {
  clinicType: ClinicTypeKey;
}

const HOME_FEED_ROUTE = '/(tabs)/home';

export default function ClinicHomeScreen({ clinicType }: ClinicHomeScreenProps) {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const config = CLINIC_HOME_CONFIG[clinicType];

  const heroAnim = useRef(new Animated.Value(0)).current;
  const cardsAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(heroAnim, {
        toValue: 1,
        duration: 520,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(cardsAnim, {
        toValue: 1,
        duration: 460,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [heroAnim, cardsAnim]);

  const goHome = () => router.push(HOME_FEED_ROUTE as any);
  const goSettings = () => router.push('/clinic/settings' as any);
  const goBack = () => {
    if (router.canGoBack()) router.back();
    else goHome();
  };

  const actions: QuickActionDef[] = [
    {
      title: config.patientsLabel,
      subtitle: 'Manage records',
      icon: 'people',
      tile: ['#4D9DFF', '#1E6BE6'],
      shadow: '#2E7CE0',
      route: '/clinic/patients',
    },
    {
      title: 'Records',
      subtitle: 'Patient files',
      icon: 'grid',
      tile: ['#34DDB0', '#0EA37A'],
      shadow: '#10B981',
      route: '/clinic/dashboard',
    },
    {
      title: 'AI Assistant',
      subtitle: 'Smart insights',
      icon: 'sparkles',
      tile: ['#A989FF', '#7C3AED'],
      shadow: '#7C3AED',
      route: '/clinic/ai',
    },
    {
      title: 'Settings',
      subtitle: 'Clinic & account',
      icon: 'settings',
      tile: ['#9AA8BE', '#5B6B82'],
      shadow: '#5B6B82',
      route: '/clinic/settings',
    },
  ];

  // Force LTR visual flow regardless of global I18nManager direction.
  const ltrRow: 'row' | 'row-reverse' = I18nManager.isRTL ? 'row-reverse' : 'row';

  // Dark mode card surface
  const cardBg = isDark ? 'rgba(30,42,60,0.78)' : '#FFFFFF';
  const cardBorder = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.05)';
  const cardTitleColor = isDark ? '#F0F2F5' : '#1A2B3F';
  const cardSubColor = isDark ? '#9AA8BE' : '#64748B';
  const chevronColor = isDark ? '#5B6B82' : '#C7CDD6';
  const quickActionsLabelColor = isDark ? '#9AA8BE' : '#64748B';

  return (
    <View style={[styles.root, { direction: 'ltr' }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <PremiumGradientBackground isDark={isDark} showSparkles={false} />
      <View style={styles.safe}>
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: insets.top + 12 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* ── HERO CARD ── */}
          <Animated.View
            style={{
              opacity: heroAnim,
              transform: [
                {
                  translateY: heroAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [22, 0],
                  }),
                },
              ],
            }}
          >
            <LinearGradient
              colors={['#2E5BFF', '#5546FF', '#8B5CF6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.hero}
            >
              {/* Soft depth orbs + highlight */}
              <View pointerEvents="none" style={styles.heroOrbOne} />
              <View pointerEvents="none" style={styles.heroOrbTwo} />
              <LinearGradient
                pointerEvents="none"
                colors={['rgba(255,255,255,0.18)', 'rgba(255,255,255,0)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0.9 }}
                style={styles.heroHighlight}
              />

              {/* Row 1: Back  |  Home + Settings */}
              <View style={[styles.heroRow, { flexDirection: ltrRow }]}>
                <TouchableOpacity
                  onPress={goBack}
                  style={styles.frostedIconBtn}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  activeOpacity={0.85}
                >
                  <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
                </TouchableOpacity>

                <View style={[styles.heroRightCluster, { flexDirection: ltrRow }]}>
                  <TouchableOpacity
                    onPress={goHome}
                    style={[styles.frostedIconBtn, { marginRight: 10 }]}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="home" size={20} color="#FFFFFF" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={goSettings}
                    style={styles.frostedIconBtn}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="settings" size={20} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Row 2: BeSmile AI + PRO pills */}
              <View style={[styles.pillRow, { flexDirection: ltrRow }]}>
                <View style={styles.brandPill}>
                  <Text style={styles.brandPillText}>BeSmile AI</Text>
                </View>
                <LinearGradient
                  colors={['#FFE08A', '#F5B021']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.proPill}
                >
                  <Text style={styles.proPillText}>PRO</Text>
                </LinearGradient>
              </View>

              {/* Row 3: Emoji tile + kicker + name */}
              <View style={[styles.identityRow, { flexDirection: ltrRow }]}>
                <View style={styles.emojiTile}>
                  <Text style={styles.emojiText}>{config.emoji}</Text>
                </View>
                <View style={styles.identityText}>
                  <Text style={styles.kicker}>Welcome to your</Text>
                  <Text style={styles.clinicName} numberOfLines={1}>
                    {config.name}
                  </Text>
                </View>
              </View>

              {/* Row 4: Subtitle */}
              <Text style={styles.heroSubtitle}>{config.subtitle}</Text>
            </LinearGradient>
          </Animated.View>

          {/* ── QUICK ACTIONS ── */}
          <Animated.View
            style={{
              opacity: cardsAnim,
              transform: [
                {
                  translateY: cardsAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [18, 0],
                  }),
                },
              ],
              marginTop: 22,
            }}
          >
            <Text
              style={[
                styles.quickActionsLabel,
                { color: quickActionsLabelColor },
              ]}
            >
              Quick actions
            </Text>

            <View style={styles.grid}>
              {actions.map((a) => (
                <TouchableOpacity
                  key={a.title}
                  activeOpacity={0.9}
                  onPress={() => router.push(a.route as any)}
                  style={[
                    styles.actionCard,
                    {
                      backgroundColor: cardBg,
                      borderColor: cardBorder,
                      shadowColor: isDark ? '#000' : '#0F172A',
                    },
                  ]}
                >
                  <Ionicons
                    name="chevron-forward"
                    size={18}
                    color={chevronColor}
                    style={styles.cardChevron}
                  />
                  <LinearGradient
                    colors={a.tile}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[styles.tile, { shadowColor: a.shadow }]}
                  >
                    <Ionicons name={a.icon} size={26} color="#FFFFFF" />
                  </LinearGradient>
                  <Text
                    style={[styles.cardTitle, { color: cardTitleColor }]}
                    numberOfLines={1}
                  >
                    {a.title}
                  </Text>
                  <Text
                    style={[styles.cardSubtitle, { color: cardSubColor }]}
                    numberOfLines={1}
                  >
                    {a.subtitle}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>
        </ScrollView>
      </View>
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
  scrollContent: {
    paddingHorizontal: 18,
    paddingBottom: 32,
  },

  // ── Hero ──
  hero: {
    borderRadius: 30,
    padding: 22,
    overflow: 'hidden',
    shadowColor: '#5546FF',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.35,
    shadowRadius: 28,
    elevation: 12,
  },
  heroOrbOne: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(255,255,255,0.10)',
    top: -70,
    right: -50,
  },
  heroOrbTwo: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(139,92,246,0.22)',
    bottom: -50,
    left: -40,
  },
  heroHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '55%',
  },
  heroRow: {
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroRightCluster: {
    alignItems: 'center',
  },
  frostedIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  pillRow: {
    alignItems: 'center',
    marginTop: 18,
  },
  brandPill: {
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderColor: 'rgba(255,255,255,0.32)',
    borderWidth: 1,
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 999,
    marginRight: 8,
  },
  brandPillText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  proPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  proPillText: {
    color: '#5A3A00',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },

  identityRow: {
    alignItems: 'center',
    marginTop: 16,
  },
  emojiTile: {
    width: 74,
    height: 74,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.17)',
    borderColor: 'rgba(255,255,255,0.36)',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  emojiText: {
    fontSize: 38,
    lineHeight: 44,
    textAlign: 'center',
  },
  identityText: {
    flex: 1,
  },
  kicker: {
    color: 'rgba(255,255,255,0.84)',
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'left',
    writingDirection: 'ltr',
  },
  clinicName: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.4,
    marginTop: 2,
    textAlign: 'left',
    writingDirection: 'ltr',
  },
  heroSubtitle: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 13,
    lineHeight: 20,
    marginTop: 14,
    textAlign: 'left',
    writingDirection: 'ltr',
  },

  // ── Quick actions ──
  quickActionsLabel: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 12,
    marginLeft: 2,
    textAlign: 'left',
    writingDirection: 'ltr',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 13,
  },
  actionCard: {
    width: '47.5%',
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 4,
    minHeight: 144,
  },
  cardChevron: {
    position: 'absolute',
    top: 14,
    right: 14,
    opacity: 0.85,
  },
  tile: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.32,
    shadowRadius: 12,
    elevation: 6,
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'left',
    writingDirection: 'ltr',
  },
  cardSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 3,
    textAlign: 'left',
    writingDirection: 'ltr',
  },
});
