import PremiumGradientBackground from '@/src/components/PremiumGradientBackground';
import { useAuth } from '@/src/context/AuthContext';
import { useTheme } from '@/src/context/ThemeContext';
import { getHomeRoute } from '@/src/utils/getHomeRoute';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import { memo, useCallback, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Animated,
  Dimensions,
  Easing,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';

const SCREEN_PADDING_H = 22;
const SHIMMER_BAND_WIDTH = 60;

type IoniconName = keyof typeof Ionicons.glyphMap;

interface RoleButtonData {
  key: string;
  icon: IoniconName;
  title: string;
  desc: string;
  gradient: readonly string[];
  shadowColor: string;
  route: string;
}

const ROLE_BUTTONS: ReadonlyArray<RoleButtonData> = [
  {
    key: 'clinic',
    icon: 'medical',
    title: 'Clinic',
    desc: 'Manage your clinic, patients & content',
    gradient: ['#54ACFF', '#1E6FD9'],
    shadowColor: '#2E86E0',
    route: '/login',
  },
  {
    key: 'patient',
    icon: 'person',
    title: 'Patient',
    desc: 'Book visits & stay connected with your clinic',
    gradient: ['#6FC0FF', '#3088E6'],
    shadowColor: '#3D9EFF',
    route: '/patient',
  },
  {
    key: 'games',
    icon: 'game-controller',
    title: 'Games',
    desc: 'Fun dental games for kids',
    gradient: ['#34D8A0', '#0FA877'],
    shadowColor: '#10B981',
    route: '/kids',
  },
];

interface RoleButtonProps extends Omit<RoleButtonData, 'key'> {
  delay: number;
  onPress: () => void;
}

const RoleButton = memo(function RoleButton({
  icon,
  title,
  desc,
  gradient,
  shadowColor,
  delay,
  onPress,
}: RoleButtonProps) {
  const shimmerValue = useRef(new Animated.Value(0)).current;
  const sweepWidth =
    Dimensions.get('window').width - SCREEN_PADDING_H * 2;

  useFocusEffect(
    useCallback(() => {
      shimmerValue.setValue(0);
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(shimmerValue, {
            toValue: 1,
            duration: 1700,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.delay(2000),
        ]),
      );
      const starter = setTimeout(() => loop.start(), delay);
      return () => {
        clearTimeout(starter);
        loop.stop();
      };
    }, [delay, shimmerValue]),
  );

  const translateX = useMemo(
    () =>
      shimmerValue.interpolate({
        inputRange: [0, 1],
        outputRange: [-SHIMMER_BAND_WIDTH, sweepWidth + SHIMMER_BAND_WIDTH],
      }),
    [shimmerValue, sweepWidth],
  );

  const shimmerOpacity = useMemo(
    () =>
      shimmerValue.interpolate({
        inputRange: [0, 0.15, 0.7, 1],
        outputRange: [0, 1, 1, 0],
      }),
    [shimmerValue],
  );

  const rippleValue = useRef(new Animated.Value(0)).current;
  const isNavigating = useRef(false);

  useFocusEffect(
    useCallback(() => {
      isNavigating.current = false;
      return undefined;
    }, []),
  );

  const handlePress = () => {
    if (isNavigating.current) return;
    isNavigating.current = true;
    rippleValue.setValue(0);
    Animated.timing(rippleValue, {
      toValue: 1,
      duration: 280,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) onPress();
    });
  };

  const rippleOpacity = useMemo(
    () =>
      rippleValue.interpolate({
        inputRange: [0, 0.6, 1],
        outputRange: [0.85, 0.5, 0],
      }),
    [rippleValue],
  );
  const rippleScale = useMemo(
    () =>
      rippleValue.interpolate({
        inputRange: [0, 1],
        outputRange: [0.2, 9],
      }),
    [rippleValue],
  );

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={handlePress}
      style={[styles.cta, { shadowColor }]}
    >
      <LinearGradient
        colors={gradient as [string, string]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.ctaFill}
      >
        <LinearGradient
          colors={['rgba(255,255,255,0.26)', 'rgba(255,255,255,0)']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.topHighlight}
          pointerEvents="none"
        />

        <View style={styles.iconBadge}>
          <Ionicons name={icon} size={25} color="#FFFFFF" />
        </View>
        <View style={styles.textBlock}>
          <Text style={styles.ctaTitle}>{title}</Text>
          <Text style={styles.ctaDesc}>{desc}</Text>
        </View>
        <Ionicons
          name="chevron-forward"
          size={22}
          color="rgba(255,255,255,0.78)"
        />

        <Animated.View
          pointerEvents="none"
          style={[
            styles.shimmer,
            {
              opacity: shimmerOpacity,
              transform: [{ translateX }, { skewX: '-18deg' }],
            },
          ]}
        >
          <LinearGradient
            colors={['transparent', 'rgba(255,255,255,0.55)', 'transparent']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>

        <Animated.View pointerEvents="none" style={styles.rippleWrap}>
          <Animated.View
            style={[
              styles.ripple,
              {
                opacity: rippleOpacity,
                transform: [{ scale: rippleScale }],
              },
            ]}
          />
        </Animated.View>
      </LinearGradient>
    </TouchableOpacity>
  );
});

/**
 * CLINIC ENTRY PAGE
 *
 * Main entry point with navigation buttons:
 * - "Clinic" → logged-in clinic user goes straight to their clinic home
 *              via getHomeRoute(clinicType); everyone else → /login
 * - "Patient" → /patient
 * - "Games" → /kids
 * - "Back" → /(tabs)/home
 */
export default function ClinicTab() {
  const router = useRouter();
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const { logout, userRole, clinicType } = useAuth();

  const backPillStyle = useMemo<ViewStyle>(
    () => ({
      backgroundColor: isDark ? 'rgba(30,42,60,0.5)' : 'rgba(255,255,255,0.62)',
      borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.8)',
    }),
    [isDark],
  );
  const backTextColor = isDark ? '#E2E8F0' : '#1E3A5F';

  return (
    <View style={styles.root}>
      <PremiumGradientBackground isDark={isDark} />
      <SafeAreaView style={styles.safe}>
        <TouchableOpacity
          style={[styles.backPill, backPillStyle]}
          onPress={() => router.push('/(tabs)/home' as any)}
        >
          <Ionicons name="arrow-back" size={16} color={backTextColor} />
          <Text style={[styles.backText, { color: backTextColor }]}>Back</Text>
        </TouchableOpacity>

        <View style={styles.hero}>
          <View style={styles.brandBadgeWrap}>
            <LinearGradient
              colors={['#5FB8FF', '#2E7CE0']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.brandBadge}
            >
              <Ionicons name="sparkles" size={30} color="#FFFFFF" />
            </LinearGradient>
          </View>
          <Text style={[styles.title, { color: colors.textHeading }]}>
            BeSmile AI
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Select your role to continue
          </Text>
        </View>

        <View style={styles.actions}>
          {ROLE_BUTTONS.map(({ key, ...rest }, i) => (
            <RoleButton
              key={key}
              {...rest}
              delay={i * 700}
              onPress={async () => {
                if (key === 'clinic' && userRole === 'clinic') {
                  router.push(getHomeRoute(clinicType) as any);
                  return;
                }
                if (key === 'patient') {
                  await logout();
                }
                router.push(rest.route as any);
              }}
            />
          ))}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  } as ViewStyle,
  safe: {
    flex: 1,
    paddingHorizontal: 22,
    paddingTop: Platform.OS === 'android' ? 40 : 10,
  } as ViewStyle,
  backPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 999,
    borderWidth: 1,
    alignSelf: 'flex-start',
    marginTop: 2,
  } as ViewStyle,
  backText: {
    fontSize: 14,
    fontWeight: '600',
  } as TextStyle,

  hero: {
    alignItems: 'center',
    marginTop: 26,
  } as ViewStyle,
  brandBadgeWrap: {
    shadowColor: '#2E7CE0',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 13,
    elevation: 8,
    borderRadius: 21,
  } as ViewStyle,
  brandBadge: {
    width: 64,
    height: 64,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  title: {
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -0.7,
    marginTop: 16,
    textAlign: 'center',
  } as TextStyle,
  subtitle: {
    fontSize: 15,
    fontWeight: '500',
    marginTop: 8,
    textAlign: 'center',
  } as TextStyle,

  actions: {
    marginTop: 30,
    gap: 15,
  } as ViewStyle,
  cta: {
    borderRadius: 22,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  } as ViewStyle,
  ctaFill: {
    borderRadius: 22,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 18,
  } as ViewStyle,
  topHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '45%',
  } as ViewStyle,
  shimmer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 60,
  } as ViewStyle,
  rippleWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  ripple: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.95)',
  } as ViewStyle,
  iconBadge: {
    width: 50,
    height: 50,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    marginEnd: 13,
  } as ViewStyle,
  textBlock: {
    flex: 1,
  } as ViewStyle,
  ctaTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  } as TextStyle,
  ctaDesc: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.86)',
    lineHeight: 16,
    marginTop: 3,
  } as TextStyle,
});
