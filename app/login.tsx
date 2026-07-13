import { auth, db } from '@/firebaseConfig';
import PremiumGradientBackground from '@/src/components/PremiumGradientBackground';
import { useAuth } from '@/src/context/AuthContext';
import { useTheme } from '@/src/context/ThemeContext';
import { ensureOwnerMembership, findUserByEmailAndPassword } from '@/src/services/clinicMembersService';
import { hasActiveSubscription } from '@/src/utils/subscriptionUtils';
import { getHomeRoute } from '@/src/utils/getHomeRoute';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, Animated, Easing, KeyboardAvoidingView, Platform, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

/**
 * STANDALONE LOGIN SCREEN — reachable at /login
 *
 * Mirrors app/clinic/login.tsx visually and reuses the exact same
 * owner-first / doctor-fallback auth logic via setClinicAuth.
 * Not wired as the app entry point.
 */

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
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

  // Shared login logic — owner-first, doctor-fallback.
  // Mirrors app/clinic/login.tsx:219-368.
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
      // Firebase Auth succeeded but no clinic matched — sign out and fall
      // through to doctor branch.
      try { await signOut(auth); } catch {}
    } catch (err) {
      ownerError = err;
    }

    // Doctor fallback: Firestore-only session.
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

    if (ownerError) throw ownerError;
    Alert.alert(t('common.error'), t('auth.invalidCredentials'));
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
