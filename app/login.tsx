import { auth, db, functions } from '@/firebaseConfig';
import PremiumGradientBackground from '@/src/components/PremiumGradientBackground';
import { useAuth } from '@/src/context/AuthContext';
import { useClinic } from '@/src/context/ClinicContext';
import { useTheme } from '@/src/context/ThemeContext';
import { ensureOwnerMembership } from '@/src/services/clinicMembersService';
import { getHomeRoute } from '@/src/utils/getHomeRoute';
import { hasActiveSubscription } from '@/src/utils/subscriptionUtils';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import * as LocalAuthentication from 'expo-local-authentication';
import { useFocusEffect, useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, Animated, Easing, KeyboardAvoidingView, Platform, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

/**
 * STANDALONE LOGIN SCREEN — reachable at /login
 *
 * Owner-first / doctor-fallback auth via setClinicAuth.
 */

export default function LoginScreen() {
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
  const { setClinicSession } = useClinic();

  // Entrance + badge float animations.
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

  // Clear sensitive inputs when navigating away.
  useFocusEffect(
    React.useCallback(() => {
      return () => {
        setEmail('');
        setPassword('');
        setShowPassword(false);
      };
    }, [])
  );

  // Biometric auto-login on mount (opt-in only)
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

  // Shared login logic — owner-first, doctor-fallback.
  const performLogin = async (loginEmail: string, loginPassword: string) => {
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

        // Ensure owner custom claims (role + clinicId) are present on the token.
        // Idempotent: only assigns if missing; never blocks login on failure.
        try {
          const tokenResult = await userCredential.user.getIdTokenResult();
          const hasOwnerClaims =
            tokenResult.claims.role === 'owner' &&
            tokenResult.claims.clinicId === clinicId;
          if (!hasOwnerClaims) {
            const assignOwnerClaims = httpsCallable(functions, 'assignOwnerClaims');
            await assignOwnerClaims();
            await userCredential.user.getIdToken(true); // force refresh so new claims land
            console.log('[auth] owner claims assigned + token refreshed');
          } else {
            console.log('[auth] owner claims already present — skipped');
          }
        } catch (e) {
          console.warn('[auth] claims assignment skipped (non-blocking):', e);
        }

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
        await setClinicSession(clinicId, ownerMember.id, ownerMember.role, ownerMember.status);

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
      } else {
        // Phase 4.2 — doctor with a real Firebase Auth account.
        // If the token carries doctor claims, log in as doctor (do NOT sign out).
        // Legacy doctors (no claims) fall through to the Firestore-only fallback.
        try {
          const tokenResult = await userCredential.user.getIdTokenResult();
          const claimRole = tokenResult.claims.role;
          const claimClinicId = tokenResult.claims.clinicId;
          if (claimRole === 'doctor' && claimClinicId) {
            const clinicIdStr = String(claimClinicId);
            const memberSnap = await getDoc(doc(db, `clinics/${clinicIdStr}/members/${firebaseUid}`));
            const memberData = memberSnap.exists() ? memberSnap.data() : null;
            const status = (memberData && memberData.status) ? memberData.status : 'ACTIVE';
            if (status !== 'ACTIVE') {
              try { await signOut(auth); } catch {}
              Alert.alert(
                t('common.attention'),
                'This account has been disabled. Please contact the clinic owner.'
              );
              return;
            }
            const clinicSnap = await getDoc(doc(db, 'clinics', clinicIdStr));
            const clinicData = clinicSnap.exists() ? clinicSnap.data() : null;
            const clinicType = clinicData?.clinicType || null;
            const isSubscribed = clinicData ? hasActiveSubscription(clinicData) : false;
            await setClinicAuth({
              clinicId: clinicIdStr,
              memberId: firebaseUid,
              role: 'doctor',
              status,
            });
            await setClinicSession(clinicIdStr, firebaseUid, 'doctor', status);
            console.log('[auth] doctor logged in via real Firebase Auth');
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
        } catch (e) {
          console.warn('[auth] doctor-claims path skipped (non-blocking):', e);
          // fall through to signOut + Firestore-only fallback below
        }
      }
      // Firebase Auth succeeded but no clinic matched — sign out and fall
      // through to doctor branch.
      try { await signOut(auth); } catch {}
    } catch (err) {
      ownerError = err;
    }

    if (ownerError) throw ownerError;
    Alert.alert(t('common.error'), t('auth.invalidCredentials'));
  };

  // Biometric auto-login handler
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

  // Placeholder — wire up in a future step.
  const onForgotPassword = () => {};

  // Navigates to the subscription-type chooser screen.
  const onSubscribe = () => {
    router.push('/subscribe-choice' as any);
  };

  return (
    <View style={[styles.mainContainer, { backgroundColor: 'transparent' }]}>
      <PremiumGradientBackground isDark={isDark} />
      <SafeAreaView style={styles.safeArea}>
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
            {/* Hero */}
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
              <Text style={[styles.title, { color: colors.textSecondary }]}>
                {t('auth.clinicLogin')}
              </Text>
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

              {/* Placeholder — wire up in a future step. */}
              <TouchableOpacity
                style={styles.forgotWrap}
                onPress={onForgotPassword}
                disabled={loading}
                activeOpacity={0.7}
              >
                <Text style={[styles.forgotText, { color: colors.textSecondary }]}>
                  Forgot password?
                </Text>
              </TouchableOpacity>
            </View>

            {/* Placeholder — wire up in a future step. */}
            <TouchableOpacity
              style={[
                styles.subscribeBtn,
                {
                  backgroundColor: isDark ? 'rgba(61,158,255,0.10)' : 'rgba(61,158,255,0.08)',
                  borderColor: isDark ? 'rgba(61,158,255,0.28)' : 'rgba(61,158,255,0.22)',
                },
              ]}
              onPress={onSubscribe}
              disabled={loading}
              activeOpacity={0.85}
            >
              <Ionicons name="sparkles" size={18} color="#3D9EFF" />
              <Text style={[styles.subscribeText, { color: '#3D9EFF' }]}>
                Subscribe
              </Text>
            </TouchableOpacity>
          </Animated.View>
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
  btnText: {
    fontWeight: '700',
    fontSize: 16,
    color: '#FFFFFF',
  },
  forgotWrap: {
    alignSelf: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginTop: 2,
  },
  forgotText: {
    fontSize: 13.5,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  subscribeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  subscribeText: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
