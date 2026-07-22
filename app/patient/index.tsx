import PremiumGradientBackground from '@/src/components/PremiumGradientBackground';
import { useAuth } from '@/src/context/AuthContext';
import { useTheme } from '@/src/context/ThemeContext';
import { lookupPatientByCode } from '@/src/services/patientCodeService';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    ActivityIndicator,
    Alert,
    Animated,
    Easing,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * PATIENT LOGIN - PREMIUM REDESIGN
 *
 * Queries Firestore for patient by code
 *
 * PHASE F: Uses AuthContext to update global auth state
 * Prevents clinic users from accessing this page
 */

export default function PatientLogin() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const { setPatientAuth } = useAuth();
  const insets = useSafeAreaInsets();

  // Animations
  const entranceAnim = useRef(new Animated.Value(0)).current;
  const badgeFloat = useRef(new Animated.Value(0)).current;
  const codeFocusAnim = useRef(new Animated.Value(0)).current;

  const animateFocus = (v: Animated.Value, to: number) =>
    Animated.timing(v, {
      toValue: to,
      duration: 200,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();

  // Entrance + badge float animations
  useEffect(() => {
    Animated.timing(entranceAnim, {
      toValue: 1,
      duration: 550,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(badgeFloat, {
          toValue: 1,
          duration: 1400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(badgeFloat, {
          toValue: 0,
          duration: 1400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [entranceAnim, badgeFloat]);

  // Clear code input when navigating back
  useFocusEffect(
    React.useCallback(() => {
      return () => {
        setCode('');
      };
    }, [])
  );

  // PHASE F: Guard - prevent clinic users from accessing patient pages
  const { usePatientGuard } = require('@/src/utils/navigationGuards');
  usePatientGuard();

  const onLogin = async () => {
    const trimmed = code.trim();
    if (!trimmed) return Alert.alert(t('common.validation'), t('patient.enterCode'));

    setLoading(true);
    try {
      const result = await lookupPatientByCode(trimmed);

      if (!result) {
        Alert.alert(t('common.error'), t('patient.codeNotFound'));
        setLoading(false);
        return;
      }

      const { clinicId, patientId } = result;

      // PHASE F: Update global auth state via AuthContext
      // This will store patientId and clinicId
      await setPatientAuth(patientId, clinicId);

      // Navigate to patient detail screen
      router.push(`/patient/${patientId}` as any);
      setLoading(false);
    } catch (err: any) {
      console.error('patient login error', err);
      Alert.alert(t('common.error'), err.message || t('common.error'));
      setLoading(false);
    }
  };


  return (
    <View style={[styles.mainContainer, { backgroundColor: 'transparent' }]}>
      <PremiumGradientBackground isDark={isDark} />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.customHeader}>
          <TouchableOpacity
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/clinic' as any);
              }
            }}
            style={[styles.backBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.70)' }]}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
        >
          <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
            <Animated.View
              style={[
                styles.content,
                {
                  opacity: entranceAnim,
                  transform: [
                    {
                      translateY: entranceAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [24, 0],
                      }),
                    },
                  ],
                },
              ]}
            >
              {/* Hero: brand badge + title + subtitle */}
              <View style={styles.hero}>
                <Animated.View
                  style={[
                    styles.brandBadgeWrap,
                    {
                      transform: [
                        {
                          translateY: badgeFloat.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, -6],
                          }),
                        },
                      ],
                    },
                  ]}
                >
                  <LinearGradient
                    colors={['#5FB8FF', '#2E7CE0']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.brandBadge}
                  >
                    <Ionicons name="sparkles" size={30} color="#FFFFFF" />
                  </LinearGradient>
                </Animated.View>
                <Text style={[styles.appTitle, { color: colors.textPrimary }]}>
                  BeSmile AI
                </Text>
                <Text style={[styles.title, { color: colors.textSecondary }]}>{t('patient.login')}</Text>
              </View>

              {/* Login Form Card */}
              <View
                style={[
                  styles.formCard,
                  {
                    backgroundColor: isDark ? 'rgba(30,41,59,0.72)' : 'rgba(255,255,255,0.78)',
                    borderColor: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.90)',
                  },
                ]}
              >
                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                  {t('patient.enterCode')}
                </Text>

                <View style={[styles.inputRow, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder }]}>
                  <Ionicons name="keypad-outline" size={20} color={colors.textSecondary} />
                  <TextInput
                    style={[styles.inputFlex, { color: colors.textPrimary }]}
                    placeholder={t('patient.code')}
                    placeholderTextColor={colors.inputPlaceholder}
                    keyboardType="numeric"
                    value={code}
                    onChangeText={setCode}
                    editable={!loading}
                    onFocus={() => animateFocus(codeFocusAnim, 1)}
                    onBlur={() => animateFocus(codeFocusAnim, 0)}
                  />
                  <Animated.View pointerEvents="none" style={[styles.focusRing, { opacity: codeFocusAnim }]} />
                </View>

                <TouchableOpacity
                  style={styles.btnWrap}
                  onPress={onLogin}
                  disabled={loading}
                  activeOpacity={0.9}
                >
                  <LinearGradient
                    colors={['#54ACFF', '#1E6FD9']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.btnGradient}
                  >
                    {loading ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <Text style={styles.btnText}>{t('auth.login')}</Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  safeArea: {
    flex: 1,
  },
  customHeader: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  hero: {
    alignItems: 'center',
    marginBottom: 24,
  },
  brandBadgeWrap: {
    shadowColor: '#2E7CE0',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 13,
    elevation: 8,
    borderRadius: 21,
    marginBottom: 18,
  },
  brandBadge: {
    width: 64,
    height: 64,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appTitle: {
    fontSize: 38,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.7,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 0,
    textAlign: 'center',
  },
  formCard: {
    borderRadius: 24,
    padding: 20,
    gap: 14,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
  },
  inputFlex: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    textAlign: 'left',
  },
  focusRing: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#3D9EFF',
    shadowColor: '#3D9EFF',
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
  btnWrap: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 4,
    shadowColor: '#2E86E0',
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  btnGradient: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    fontWeight: '700',
    fontSize: 16,
    color: '#FFFFFF',
  },
});
