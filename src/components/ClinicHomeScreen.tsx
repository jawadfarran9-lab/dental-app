import PremiumGradientBackground from '@/src/components/PremiumGradientBackground';
import { useAuth } from '@/src/context/AuthContext';
import { useTheme } from '@/src/context/ThemeContext';
import { useAIProStatus } from '@/src/hooks/useAIProStatus';
import {
    CLINIC_HOME_CONFIG,
    ClinicTypeKey,
} from '@/src/utils/clinicTypeConfig';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef } from 'react';
import {
    Alert,
    Animated,
    Easing,
    I18nManager,
    Pressable,
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

function HomeCard({
  action,
  index,
  isDark,
  hasAIPro,
  locked = false,
  onPress,
}: {
  action: QuickActionDef;
  index: number;
  isDark: boolean;
  hasAIPro: boolean;
  locked?: boolean;
  onPress: () => void;
}) {
  const enter = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const anim = Animated.timing(enter, {
      toValue: 1,
      duration: 460,
      delay: 120 + index * 75,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    anim.start();
    return () => anim.stop();
  }, [enter, index]);

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.96,
      useNativeDriver: true,
      speed: 40,
      bounciness: 4,
    }).start();
  };
  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 28,
      bounciness: 6,
    }).start();
  };

  const surface: readonly [string, string] = isDark
    ? ['#202C40', '#15203A']
    : ['#FFFFFF', '#F6F9FE'];
  const border = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.06)';
  const titleColor = isDark ? '#F0F2F5' : '#1B2542';
  const subColor = isDark ? '#9AA8BE' : '#8A93AC';
  const chevronColor = isDark ? '#9AA8BE' : '#8A93AC';
  const chevronBg = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(20,35,90,0.05)';
  const tintColor = action.tile[0];

  return (
    <Animated.View
      style={[
        styles.cardWrap,
        {
          shadowColor: isDark ? '#000' : '#0F172A',
          opacity: locked ? 0.5 : enter,
          transform: [
            {
              translateY: enter.interpolate({
                inputRange: [0, 1],
                outputRange: [16, 0],
              }),
            },
            { scale },
          ],
        },
      ]}
    >
      <Pressable
        onPress={locked ? () => {} : onPress}
        onPressIn={locked ? undefined : handlePressIn}
        onPressOut={locked ? undefined : handlePressOut}
        android_ripple={null}
      >
        <View style={styles.cardClip}>
          <LinearGradient
            colors={surface}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.actionCard, { borderColor: border }]}
          >
            {hasAIPro ? (
              <View
                pointerEvents="none"
                style={[styles.cardCornerTint, { backgroundColor: tintColor }]}
              />
            ) : null}

            <View style={[styles.chevronWrap, { backgroundColor: chevronBg }]}>
              <Ionicons name="chevron-forward" size={14} color={chevronColor} />
            </View>

            <LinearGradient
              colors={action.tile}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.tile, { shadowColor: action.shadow }]}
            >
              <Ionicons name={action.icon} size={26} color="#FFFFFF" />
            </LinearGradient>

            <Text
              style={[styles.cardTitle, { color: titleColor }]}
              numberOfLines={1}
            >
              {action.title}
            </Text>
            <Text
              style={[styles.cardSubtitle, { color: subColor }]}
              numberOfLines={1}
            >
              {action.subtitle}
            </Text>

            {locked && (
              <View
                style={[styles.homeLockBadge, styles.homeLockBadgeOnCard]}
                pointerEvents="none"
              >
                <Ionicons name="lock-closed" size={9} color="#FFFFFF" />
              </View>
            )}
          </LinearGradient>
        </View>
      </Pressable>
    </Animated.View>
  );
}

function AIProBanner({
  hasAIPro,
  onUpgrade,
}: {
  hasAIPro: boolean;
  onUpgrade: () => void;
}) {
  const pressScale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(pressScale, {
      toValue: 0.96,
      useNativeDriver: true,
      speed: 40,
      bounciness: 4,
    }).start();
  };
  const handlePressOut = () => {
    Animated.spring(pressScale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 28,
      bounciness: 6,
    }).start();
  };

  if (hasAIPro) {
    return (
      <LinearGradient
        colors={['#FFFDF6', '#FFF6E2']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.bannerStatus}
      >
        <View style={styles.bannerHeaderRow}>
          <LinearGradient
            colors={['#FFEDA0', '#FFD24D', '#F5A300']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.bannerTile}
          >
            <Ionicons name="sparkles" size={20} color="#6B4400" />
          </LinearGradient>
          <View style={styles.bannerHeaderText}>
            <View style={styles.bannerTitleRow}>
              <Text style={styles.bannerStatusTitle}>AI PRO is active</Text>
              <View style={styles.bannerActivePill}>
                <Text style={styles.bannerActivePillText}>ACTIVE</Text>
              </View>
            </View>
            <Text style={styles.bannerStatusBody}>
              You&apos;ve unlocked the full power of BeSmile AI — every premium
              feature is open for your clinic.
            </Text>
          </View>
        </View>
      </LinearGradient>
    );
  }

  return (
    <View style={styles.bannerUpsellWrap}>
      <View style={styles.bannerUpsellClip}>
        <LinearGradient
          colors={['#2E5BFF', '#5546FF', '#8B5CF6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.bannerUpsell}
        >
          <View pointerEvents="none" style={styles.bannerGoldOrb} />
          <View style={styles.bannerHeaderRow}>
            <LinearGradient
              colors={['#FFEDA0', '#FFD24D', '#F5A300']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.bannerTile}
            >
              <Ionicons name="sparkles" size={20} color="#6B4400" />
            </LinearGradient>
            <View style={styles.bannerHeaderText}>
              <Text style={styles.bannerUpsellTitle}>Unlock AI PRO</Text>
              <Text style={styles.bannerUpsellBody}>
                Upgrade to AI PRO and supercharge your clinic — intelligent
                notes, patient message analysis, treatment recommendations &
                more.
              </Text>
            </View>
          </View>
          <Animated.View
            style={{ transform: [{ scale: pressScale }], marginTop: 14 }}
          >
            <Pressable
              onPress={onUpgrade}
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
              android_ripple={null}
            >
              <LinearGradient
                colors={['#FFEDA0', '#FFD24D', '#F5A300']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.bannerCta}
              >
                <Text style={styles.bannerCtaText}>Upgrade now →</Text>
              </LinearGradient>
            </Pressable>
          </Animated.View>
        </LinearGradient>
      </View>
    </View>
  );
}

export default function ClinicHomeScreen({ clinicType }: ClinicHomeScreenProps) {
  const router = useRouter();
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const config = CLINIC_HOME_CONFIG[clinicType];

  const { isSubscribed, clinicRole, logout } = useAuth();
  const { hasAIPro } = useAIProStatus();
  const showBadge = isSubscribed === true;
  const showAIPro = showBadge && hasAIPro === true;
  const isDoctor = clinicRole !== 'owner';

  const heroAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const waveAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(heroAnim, {
      toValue: 1,
      duration: 520,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [heroAnim]);

  useEffect(() => {
    if (!hasAIPro) {
      waveAnim.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.timing(waveAnim, {
        toValue: 1,
        duration: 3000,
        easing: Easing.inOut(Easing.sin),
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => {
      loop.stop();
      waveAnim.setValue(0);
    };
  }, [waveAnim, hasAIPro]);

  const nameLetters = useMemo(() => {
    const source = config.name || 'Clinic';
    return Array.from(source).map((ch, i) => {
      if (ch === ' ') return { ch, transform: null };
      const phase = i * 0.027;
      const value = Animated.modulo(Animated.add(waveAnim, phase), 1);
      const translateY = value.interpolate({
        inputRange: [0, 0.25, 0.5, 0.75, 1],
        outputRange: [0, -2.5, -3.5, -2.5, 0],
      });
      const rotate = value.interpolate({
        inputRange: [0, 0.25, 0.5, 0.75, 1],
        outputRange: ['0deg', '-3.2deg', '-4.5deg', '-3.2deg', '0deg'],
      });
      return { ch, transform: { translateY, rotate } };
    });
  }, [config.name, waveAnim]);

  useEffect(() => {
    if (!showAIPro) {
      glowAnim.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 1200,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 1200,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => {
      loop.stop();
      glowAnim.setValue(0);
    };
  }, [showAIPro, glowAnim]);

  const goHome = () => router.push(HOME_FEED_ROUTE as any);
  const goSettings = () => router.push('/clinic/settings' as any);
  const goBack = () => {
    if (router.canGoBack()) router.back();
    else goHome();
  };

  const handleLogout = () => {
    Alert.alert(
      'Log out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log out',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/login' as any);
          },
        },
      ]
    );
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
                {!isDoctor ? (
                  <TouchableOpacity
                    onPress={goBack}
                    style={styles.frostedIconBtn}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
                  </TouchableOpacity>
                ) : (
                  <View style={styles.frostedIconBtnPlaceholder} />
                )}

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
                    onPress={isDoctor ? () => {} : goSettings}
                    style={[styles.frostedIconBtn, isDoctor && { opacity: 0.5 }]}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    activeOpacity={isDoctor ? 1 : 0.85}
                  >
                    <Ionicons name="settings" size={20} color="#FFFFFF" />
                    {isDoctor && (
                      <View style={styles.homeLockBadge} pointerEvents="none">
                        <Ionicons name="lock-closed" size={9} color="#FFFFFF" />
                      </View>
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              {/* Row 2: BeSmile AI + PRO pills */}
              <View style={[styles.pillRow, { flexDirection: ltrRow }]}>
                <View style={styles.brandPill}>
                  <Text style={styles.brandPillText}>BeSmile AI</Text>
                </View>
                {showAIPro ? (
                  <LinearGradient
                    colors={['#FFEDA0', '#FFD24D', '#F5A300']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.aiProPill}
                  >
                    <Animated.View
                      pointerEvents="none"
                      style={[
                        styles.aiProGlow,
                        {
                          opacity: glowAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, 0.55],
                          }),
                        },
                      ]}
                    />
                    <Ionicons
                      name="sparkles"
                      size={11}
                      color="#6B4400"
                      style={styles.aiProIcon}
                    />
                    <Text style={styles.aiProPillText}>AI PRO</Text>
                  </LinearGradient>
                ) : null}
              </View>

              {/* Row 3: Emoji tile + kicker + name */}
              <View style={[styles.identityRow, { flexDirection: ltrRow }]}>
                <View style={styles.emojiTile}>
                  <Text style={styles.emojiText}>{config.emoji}</Text>
                </View>
                <View style={styles.identityText}>
                  <Text style={styles.kicker}>Welcome to your</Text>
                  {hasAIPro ? (
                    <View style={styles.clinicNameRow}>
                      {nameLetters.map((letter, i) => {
                        if (letter.ch === ' ' || !letter.transform) {
                          return (
                            <Text key={`s-${i}`} style={styles.clinicName}>
                              {letter.ch}
                            </Text>
                          );
                        }
                        return (
                          <Animated.Text
                            key={`c-${i}`}
                            style={[
                              styles.clinicName,
                              {
                                transform: [
                                  { translateY: letter.transform.translateY },
                                  { rotate: letter.transform.rotate },
                                ],
                              },
                            ]}
                          >
                            {letter.ch}
                          </Animated.Text>
                        );
                      })}
                    </View>
                  ) : (
                    <Text style={styles.clinicName} numberOfLines={1}>
                      {config.name}
                    </Text>
                  )}
                </View>
              </View>

              {/* Row 4: Subtitle */}
              <Text style={styles.heroSubtitle}>{config.subtitle}</Text>
            </LinearGradient>
          </Animated.View>

          {/* ── QUICK ACTIONS ── */}
          <View style={{ marginTop: 22 }}>
            <Text
              style={[
                styles.quickActionsLabel,
                { color: quickActionsLabelColor },
              ]}
            >
              Quick actions
            </Text>

            <View style={styles.grid}>
              {actions.map((a, idx) => (
                <HomeCard
                  key={a.title}
                  action={a}
                  index={idx}
                  isDark={isDark}
                  hasAIPro={hasAIPro === true}
                  locked={isDoctor && a.route === '/clinic/settings'}
                  onPress={() => router.push(a.route as any)}
                />
              ))}
            </View>
          </View>

          <AIProBanner
            hasAIPro={hasAIPro === true}
            onUpgrade={() => router.push('/clinic/upgrade' as any)}
          />

          {isDoctor && (
            <TouchableOpacity
              onPress={handleLogout}
              activeOpacity={0.75}
              style={[
                styles.logoutBtn,
                {
                  borderColor: isDark ? 'rgba(255,255,255,0.14)' : 'rgba(15,23,42,0.12)',
                  backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.55)',
                },
              ]}
            >
              <Ionicons
                name="log-out-outline"
                size={18}
                color={isDark ? '#E2E8F0' : '#475569'}
                style={styles.logoutIcon}
              />
              <Text
                style={[
                  styles.logoutText,
                  { color: isDark ? '#E2E8F0' : '#475569' },
                ]}
              >
                Log out
              </Text>
            </TouchableOpacity>
          )}
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
  frostedIconBtnPlaceholder: {
    width: 40,
    height: 40,
  },
  homeLockBadge: {
    position: 'absolute',
    top: -3,
    right: -3,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(91,107,130,0.95)',
    borderWidth: 1,
    borderColor: 'rgba(18,24,46,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  homeLockBadgeOnCard: {
    top: 14,
    right: undefined,
    left: 14,
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
  aiProPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    overflow: 'hidden',
    shadowColor: '#F5A300',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 8,
    elevation: 4,
  },
  aiProGlow: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.55)',
  },
  aiProIcon: {
    marginRight: 4,
  },
  aiProPillText: {
    color: '#6B4400',
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
  clinicNameRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-end',
    marginTop: 2,
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
  cardWrap: {
    width: '47.5%',
    borderRadius: 24,
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.10,
    shadowRadius: 24,
    elevation: 6,
  },
  cardClip: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  actionCard: {
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    minHeight: 150,
  },
  cardCornerTint: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 999,
    top: -60,
    right: -50,
    opacity: 0.14,
  },
  chevronWrap: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
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

  // ── AI Pro banner ──
  bannerStatus: {
    marginTop: 22,
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F3E0B4',
  },
  bannerUpsellWrap: {
    marginTop: 22,
    borderRadius: 22,
    shadowColor: '#5546FF',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.28,
    shadowRadius: 20,
    elevation: 10,
  },
  bannerUpsellClip: {
    borderRadius: 22,
    overflow: 'hidden',
  },
  bannerUpsell: {
    borderRadius: 22,
    padding: 18,
  },
  bannerGoldOrb: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 999,
    backgroundColor: 'rgba(255,210,77,0.18)',
    top: -60,
    right: -50,
  },
  bannerHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  bannerTile: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    shadowColor: '#F5A300',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
  },
  bannerHeaderText: {
    flex: 1,
  },
  bannerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  bannerStatusTitle: {
    color: '#1B2542',
    fontSize: 15,
    fontWeight: '800',
    marginRight: 8,
    textAlign: 'left',
    writingDirection: 'ltr',
  },
  bannerActivePill: {
    backgroundColor: '#F5A300',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  bannerActivePillText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  bannerStatusBody: {
    color: '#7A6A45',
    fontSize: 12.5,
    lineHeight: 18,
    textAlign: 'left',
    writingDirection: 'ltr',
  },
  bannerUpsellTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
    textAlign: 'left',
    writingDirection: 'ltr',
  },
  bannerUpsellBody: {
    color: 'rgba(255,255,255,0.88)',
    fontSize: 12.5,
    lineHeight: 18,
    textAlign: 'left',
    writingDirection: 'ltr',
  },
  bannerCta: {
    paddingVertical: 11,
    paddingHorizontal: 18,
    borderRadius: 14,
    alignSelf: 'flex-start',
    shadowColor: '#F5A300',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 4,
  },
  bannerCtaText: {
    color: '#6B4400',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.4,
  },

  // ── Log out ──
  logoutBtn: {
    marginTop: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    paddingHorizontal: 18,
    borderRadius: 14,
    borderWidth: 1,
  },
  logoutIcon: {
    marginRight: 8,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});
