import { auth, db } from '@/firebaseConfig';
import PremiumGradientBackground from '@/src/components/PremiumGradientBackground';
import { useAuth } from '@/src/context/AuthContext';
import { useTheme } from '@/src/context/ThemeContext';
import { ensureOwnerMembership, findUserByEmailAndPassword } from '@/src/services/clinicMembersService';
import { hasActiveSubscription } from '@/src/utils/subscriptionUtils';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import * as LocalAuthentication from 'expo-local-authentication';
import { useFocusEffect, useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, Animated, Easing, KeyboardAvoidingView, Platform, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * CLINIC LOGIN — Firebase Auth
 *
 * Signs in via Firebase Auth, then queries Firestore by ownerUid.
 *
 * PHASE A2: Uses AuthContext to update global auth state and trigger auto-redirect
 * Prevents patients from accessing this page
 */

// ========== Orbiting Stars Component (copied from app/(tabs)/_layout.tsx) ==========
const OrbitingStars: React.FC<{ active: boolean }> = ({ active }) => {
  const orbitAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (active) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        tension: 120,
        useNativeDriver: true,
      }).start();

      const orbitLoop = Animated.loop(
        Animated.timing(orbitAnim, {
          toValue: 1,
          duration: 3500,
          easing: Easing.bezier(0.4, 0.0, 0.2, 1),
          useNativeDriver: true,
        })
      );
      orbitLoop.start();

      return () => orbitLoop.stop();
    } else {
      Animated.timing(scaleAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start();
      orbitAnim.setValue(0);
    }
  }, [active]);

  const orbitRotation = orbitAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View
      style={[
        styles.orbitContainer,
        {
          transform: [{ rotate: orbitRotation }],
          opacity: scaleAnim,
        },
      ]}
    >
      <Animated.Text
        style={[
          styles.orbitStar,
          styles.star1,
          { transform: [{ scale: scaleAnim }] },
        ]}
      >
        ⭐
      </Animated.Text>
      <Animated.Text
        style={[
          styles.orbitStar,
          styles.star2,
          { transform: [{ scale: scaleAnim }] },
        ]}
      >
        ⭐
      </Animated.Text>
    </Animated.View>
  );
};

export default function ClinicLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const biometricAttempted = useRef(false);
  const entranceAnim = useRef(new Animated.Value(0)).current;
  const badgeFloat = useRef(new Animated.Value(0)).current;
  const emailFocusAnim = useRef(new Animated.Value(0)).current;
  const passwordFocusAnim = useRef(new Animated.Value(0)).current;
  const animateFocus = (v: Animated.Value, to: number) =>
    Animated.timing(v, {
      toValue: to,
      duration: 200,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  const router = useRouter();
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const { setClinicAuth } = useAuth();
  const insets = useSafeAreaInsets();

  // ✅ Helper function to get home route based on clinic type
  const getHomeRoute = (clinicType: string | null | undefined): string => {
    switch (clinicType) {
      case 'dental':
        return '/clinic/dental-home';
      case 'beauty':
        return '/clinic/beauty-home';
      case 'laser':
        return '/clinic/laser-home';
      default:
        return '/clinic/dashboard';  // Fallback to dashboard
    }
  };

  // ── Presentation: entrance + badge float (native driver) ──
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
  }, []);

  // Clear sensitive inputs when navigating back
  useFocusEffect(
    React.useCallback(() => {
      return () => {
        setEmail('');
        setPassword('');
        setShowPassword(false);
      };
    }, [])
  );

  // ── Biometric auto-login on mount (opt-in only) ──
  useEffect(() => {
    const checkBiometricLogin = async () => {
      if (biometricAttempted.current) return;
      biometricAttempted.current = true;

      // Only prompt if user explicitly opted in
      const enabled = await SecureStore.getItemAsync('biometric_enabled');
      if (enabled !== 'true') return;

      const stored = await SecureStore.getItemAsync('clinic_credentials');
      if (!stored) return;

      const biometricAvailable = await LocalAuthentication.hasHardwareAsync();
      if (!biometricAvailable) return;

      const enrolled = await LocalAuthentication.isEnrolledAsync();
      if (!enrolled) return;

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Login with Face ID',
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
      });

      if (!result.success) return;

      try {
        const { email: savedEmail, password: savedPassword } = JSON.parse(stored);
        await onLoginAuto(savedEmail, savedPassword);
      } catch {
        // Silently fail — user can login manually
      }
    };

    checkBiometricLogin();
  }, []);

  // ── Shared login logic (used by manual + biometric flows) ──
  const performLogin = async (loginEmail: string, loginPassword: string) => {
    // Try OWNER first (Firebase Auth + ownerUid lookup). If this path fails
    // (auth error OR no clinic matched), fall through to the DOCTOR branch
    // before surfacing any error.
    let ownerError: any = null;

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        loginEmail,
        loginPassword
      );
      const firebaseUid = userCredential.user.uid;

      const q = query(
        collection(db, 'clinics'),
        where('ownerUid', '==', firebaseUid)
      );
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        const clinicDoc = snapshot.docs[0];
        const clinicId = clinicDoc.id;
        const clinicData = clinicDoc.data();
        const isSubscribed = hasActiveSubscription(clinicData);
        const clinicPlan = clinicData.subscriptionPlan || '';
        const clinicType = clinicData.clinicType || null;

        const ownerMember = await ensureOwnerMembership(clinicId, loginEmail);

        await AsyncStorage.setItem('clinicUserEmail', loginEmail);
        await AsyncStorage.setItem('clinicSubscriptionPlan', clinicPlan ? String(clinicPlan) : '');

        await setClinicAuth({
          clinicId,
          memberId: ownerMember.id,
          role: ownerMember.role,
          status: ownerMember.status,
        });

        // Biometric opt-in: prompt user after first successful login
        const biometricFlag = await SecureStore.getItemAsync('biometric_enabled');
        if (biometricFlag === null) {
          // First login — check if device supports biometrics before asking
          const hasHw = await LocalAuthentication.hasHardwareAsync();
          const isEnrolled = await LocalAuthentication.isEnrolledAsync();
          if (hasHw && isEnrolled) {
            await new Promise<void>((resolve) => {
              Alert.alert(
                'Enable Face ID',
                'Enable Face ID / Fingerprint for faster login?',
                [
                  {
                    text: 'Not now',
                    style: 'cancel',
                    onPress: async () => {
                      await SecureStore.setItemAsync('biometric_enabled', 'false');
                      resolve();
                    },
                  },
                  {
                    text: 'Enable',
                    onPress: async () => {
                      await SecureStore.setItemAsync('biometric_enabled', 'true');
                      await SecureStore.setItemAsync(
                        'clinic_credentials',
                        JSON.stringify({ email: loginEmail, password: loginPassword })
                      );
                      resolve();
                    },
                  },
                ],
                { cancelable: false }
              );
            });
          }
        } else if (biometricFlag === 'true') {
          // Already opted in — update stored credentials
          await SecureStore.setItemAsync(
            'clinic_credentials',
            JSON.stringify({ email: loginEmail, password: loginPassword })
          );
        }

        if (!isSubscribed) {
          Alert.alert(
            t('common.attention'),
            t('common.subscriptionInactive'),
            [{ text: t('common.ok'), onPress: () => router.replace('/clinic/subscribe?reason=cancelled' as any) }]
          );
          return;
        }

        const homeRoute = getHomeRoute(clinicType);
        router.replace(homeRoute as any);
        return;
      }
      // Firebase Auth succeeded but no clinic matched ownerUid — fall through
      // to the doctor branch. Sign out so the unrelated Firebase Auth user
      // does not linger as auth.currentUser.
      try { await signOut(auth); } catch {}
    } catch (err) {
      // Owner Firebase Auth failed — try doctor before surfacing this error.
      ownerError = err;
    }

    // ── DOCTOR fallback (Firestore-only session, no Firebase Auth) ──
    const doctorRecord = await findUserByEmailAndPassword(loginEmail, loginPassword);
    if (doctorRecord && doctorRecord.profile.role === 'doctor') {
      const { memberId, profile } = doctorRecord;

      if (profile.status !== 'ACTIVE') {
        Alert.alert(
          t('common.attention'),
          'This account has been disabled. Please contact the clinic owner.'
        );
        return;
      }

      // Resolve clinic data for routing + subscription gate.
      const clinicSnap = await getDoc(doc(db, 'clinics', profile.clinicId));
      const clinicData = clinicSnap.exists() ? clinicSnap.data() : null;
      const clinicType = clinicData?.clinicType || null;
      const isSubscribed = clinicData ? hasActiveSubscription(clinicData) : false;

      await setClinicAuth({
        clinicId: profile.clinicId,
        memberId,
        role: 'doctor',
        status: profile.status,
      });

      if (!isSubscribed) {
        Alert.alert(
          t('common.attention'),
          t('common.subscriptionInactive'),
          [{ text: t('common.ok'), onPress: () => router.replace('/clinic/subscribe?reason=cancelled' as any) }]
        );
        return;
      }

      const homeRoute = getHomeRoute(clinicType);
      router.replace(homeRoute as any);
      return;
    }

    // Neither owner nor doctor matched.
    if (ownerError) throw ownerError;
    Alert.alert(t('common.error'), t('auth.invalidCredentials'));
  };

  // ── Biometric auto-login handler ──
  const onLoginAuto = async (autoEmail: string, autoPassword: string) => {
    setLoading(true);
    try {
      await performLogin(autoEmail, autoPassword);
    } catch (err: any) {
      // Clear stored credentials if they're invalid
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        await SecureStore.deleteItemAsync('clinic_credentials');
        await SecureStore.deleteItemAsync('biometric_enabled');
      }
    } finally {
      setLoading(false);
    }
  };

  const onLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Login Error', 'Please enter both email and password.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert('Login Error', 'Please enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      const normalizedEmail = email.trim().toLowerCase();
      await performLogin(normalizedEmail, password);
    } catch (err: any) {
      const code = err?.code ?? '';
      let msg = 'Login failed. Please try again.';

      if (code === 'auth/invalid-email') msg = 'Invalid email format.';
      else if (code === 'auth/user-not-found') msg = 'No account found for this email.';
      else if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') msg = 'Incorrect password.';
      else if (code === 'auth/too-many-requests') msg = 'Too many attempts. Try again later.';

      Alert.alert('Login Error', msg);
    } finally {
      setLoading(false);
    }
  };

  const goToSignup = () => router.replace('/clinic/subscribe' as any);

  return (
    <View style={[styles.mainContainer, { backgroundColor: 'transparent' }]}>
      <PremiumGradientBackground isDark={isDark} />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.customHeader}>
          <TouchableOpacity
            onPress={() => router.back()}
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
            <Text style={[styles.title, { color: colors.textSecondary }]}>{t('auth.clinicLogin')}</Text>
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
            <View style={[styles.inputRow, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder }]}>
              <Ionicons name="mail-outline" size={20} color={colors.textSecondary} />
              <TextInput
                style={[styles.inputFlex, { color: colors.textPrimary }]}
                placeholder={t('auth.email')}
                placeholderTextColor={colors.inputPlaceholder}
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
                editable={!loading}
                autoCapitalize="none"
                onFocus={() => animateFocus(emailFocusAnim, 1)}
                onBlur={() => animateFocus(emailFocusAnim, 0)}
              />
              <Animated.View pointerEvents="none" style={[styles.focusRing, { opacity: emailFocusAnim }]} />
            </View>

            <View style={[styles.passwordContainer, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder }]}>
              <Ionicons name="lock-closed-outline" size={20} color={colors.textSecondary} />
              <TextInput
                style={[styles.passwordInput, { color: colors.textPrimary }]}
                placeholder={t('auth.password')}
                placeholderTextColor={colors.inputPlaceholder}
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
                editable={!loading}
                onFocus={() => animateFocus(passwordFocusAnim, 1)}
                onBlur={() => animateFocus(passwordFocusAnim, 0)}
              />
              <TouchableOpacity
                style={styles.passwordToggle}
                onPress={() => setShowPassword(!showPassword)}
                disabled={loading}
              >
                <Ionicons
                  name={showPassword ? 'eye-off' : 'eye'}
                  size={20}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
              <Animated.View pointerEvents="none" style={[styles.focusRing, { opacity: passwordFocusAnim }]} />
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

          <View
            style={[
              styles.reassuranceCard,
              {
                backgroundColor: isDark ? 'rgba(61,158,255,0.08)' : 'rgba(61,158,255,0.06)',
                borderColor: isDark ? 'rgba(61,158,255,0.22)' : 'rgba(61,158,255,0.18)',
              },
            ]}
          >
            <LinearGradient
              colors={['#54ACFF', '#1E6FD9']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.reassuranceIconTile}
            >
              <Ionicons name="shield-checkmark" size={20} color="#FFFFFF" />
            </LinearGradient>
            <View style={styles.reassuranceTextWrap}>
              <Text style={[styles.reassuranceTitle, { color: colors.textPrimary }]}>
                Your subscription is safe with your account
              </Text>
              <Text style={[styles.reassuranceBody, { color: colors.textSecondary }]}>
                Switch devices or reinstall anytime.{'\n'}Sign in to restore your plan instantly — no new payment.
              </Text>
            </View>
          </View>
          </Animated.View>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* Bottom Tab Bar — edge-to-edge flush, mirrors app/(tabs)/_layout.tsx styling */}
      <View style={[styles.bottomNav, { paddingBottom: Math.max(insets.bottom - 8, 8) }]}>
        {/* Floating chrome: blur + translucent fill + hairline border */}
        <View style={styles.tabBarBackground} pointerEvents="none">
          <BlurView
            intensity={Platform.OS === 'ios' ? (isDark ? 55 : 65) : 0}
            tint={isDark ? 'dark' : 'light'}
            style={StyleSheet.absoluteFillObject}
          />
          <View
            style={[
              StyleSheet.absoluteFillObject,
              {
                backgroundColor: isDark
                  ? 'rgba(25, 40, 65, 0.82)'
                  : 'rgba(235, 245, 255, 0.78)',
              },
            ]}
          />
          <View
            style={[
              styles.tabBarBorder,
              {
                borderColor: isDark
                  ? 'rgba(255,255,255,0.12)'
                  : 'rgba(255,255,255,0.50)',
              },
            ]}
          />
        </View>

        {/* 1. Home */}
        <TouchableOpacity style={styles.navItem} onPress={() => { Haptics.selectionAsync().catch(() => {}); router.push('/(tabs)/home' as any); }} activeOpacity={0.7}>
          <View style={[styles.iconContainer, { transform: [{ scale: 0.95 }] }]}>
            <Ionicons name="home-outline" size={24} color={isDark ? '#64748B' : '#94A3B8'} />
          </View>
          <Text style={[styles.navLabel, { color: isDark ? '#64748B' : '#94A3B8' }]}>Home</Text>
        </TouchableOpacity>

        {/* 2. Reels */}
        <TouchableOpacity style={styles.navItem} onPress={() => { Haptics.selectionAsync().catch(() => {}); router.push('/(tabs)/reels' as any); }} activeOpacity={0.7}>
          <View style={[styles.iconContainer, { transform: [{ scale: 0.95 }] }]}>
            <Ionicons name="play-circle-outline" size={24} color={isDark ? '#64748B' : '#94A3B8'} />
          </View>
          <Text style={[styles.navLabel, { color: isDark ? '#64748B' : '#94A3B8' }]}>Reels</Text>
        </TouchableOpacity>

        {/* 3. Subscribe */}
        <TouchableOpacity style={styles.navItem} onPress={() => { Haptics.selectionAsync().catch(() => {}); router.push('/(tabs)/subscription' as any); }} activeOpacity={0.7}>
          <View style={[styles.iconContainer, { transform: [{ scale: 0.95 }] }]}>
            <Ionicons name="star-outline" size={24} color={isDark ? '#64748B' : '#94A3B8'} />
          </View>
          <Text style={[styles.navLabel, { color: isDark ? '#64748B' : '#94A3B8' }]}>Subscribe</Text>
        </TouchableOpacity>

        {/* 4. AI Pro */}
        <TouchableOpacity style={styles.navItem} onPress={() => { Haptics.selectionAsync().catch(() => {}); router.push('/(tabs)/ai' as any); }} activeOpacity={0.7}>
          <View style={[styles.iconContainer, { transform: [{ scale: 0.95 }] }]}>
            <Ionicons name="sparkles-outline" size={24} color={isDark ? '#64748B' : '#94A3B8'} />
          </View>
          <Text style={[styles.navLabel, { color: isDark ? '#64748B' : '#94A3B8' }]}>AI Pro</Text>
        </TouchableOpacity>

        {/* 5. Clinic — ACTIVE */}
        <TouchableOpacity style={styles.navItem} onPress={() => { Haptics.selectionAsync().catch(() => {}); router.push('/(tabs)/clinic' as any); }} activeOpacity={0.7}>
          <View style={[styles.iconContainer, { transform: [{ scale: 1.05 }] }]}>
            <View
              style={[
                styles.iconGlow,
                {
                  backgroundColor: isDark
                    ? 'rgba(61, 158, 255, 0.3)'
                    : 'rgba(61, 158, 255, 0.18)',
                },
              ]}
            />
            <OrbitingStars active={true} />
            <Ionicons name="briefcase" size={26} color="#3D9EFF" style={styles.iconShadow} />
          </View>
          <Text style={[styles.navLabel, { color: '#3D9EFF' }]}>Clinic</Text>
        </TouchableOpacity>

        {/* 6. Clinics */}
        <TouchableOpacity style={styles.navItem} onPress={() => { Haptics.selectionAsync().catch(() => {}); router.replace('/(tabs)/clinics' as any); }} activeOpacity={0.7}>
          <View style={[styles.iconContainer, { transform: [{ scale: 0.95 }] }]}>
            <Ionicons name="medical-outline" size={24} color={isDark ? '#64748B' : '#94A3B8'} />
          </View>
          <Text style={[styles.navLabel, { color: isDark ? '#64748B' : '#94A3B8' }]}>Clinics</Text>
        </TouchableOpacity>
      </View>
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
  formContainer: {
    gap: 12,
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
  reassuranceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 16,
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  reassuranceIconTile: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2E7CE0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 3,
  },
  reassuranceTextWrap: {
    flex: 1,
  },
  reassuranceTitle: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: -0.1,
    marginBottom: 3,
  },
  reassuranceBody: {
    fontSize: 12.5,
    lineHeight: 17,
    fontWeight: '400',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 0,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    padding: 14,
    borderRadius: 12,
    fontSize: 16,
    textAlign: 'left',
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
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingRight: 8,
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    textAlign: 'left',
  },
  passwordToggle: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
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
  btn: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  btnText: {
    fontWeight: '700',
    fontSize: 16,
    color: '#FFFFFF',
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderRadius: 0,
    paddingTop: 4,
    paddingHorizontal: 8,
    flexDirection: 'row',
    backgroundColor: 'transparent',
    borderTopWidth: 0,
  },
  tabBarBackground: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 0,
    overflow: 'hidden',
  },
  tabBarBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 0,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingVertical: 2,
    minHeight: 44,
  },
  iconContainer: {
    width: 56,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'visible',
    marginBottom: -8,
  },
  iconGlow: {
    position: 'absolute',
    top: 0,
    width: 58,
    height: 56,
    borderRadius: 20,
    shadowColor: '#3D9EFF',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
  iconShadow: {
    textShadowColor: '#3D9EFF',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 7,
  },
  orbitContainer: {
    position: 'absolute',
    width: 50,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  orbitStar: {
    position: 'absolute',
    fontSize: 7,
    color: '#3D9EFF',
    textShadowColor: '#3D9EFF',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 4,
  },
  star1: {
    bottom: 2,
    right: 2,
  },
  star2: {
    top: 2,
    right: 6,
  },
  navLabel: {
    fontSize: 10.5,
    fontWeight: '600',
    marginTop: 0,
    letterSpacing: 0.2,
  },
});
