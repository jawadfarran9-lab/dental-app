import { auth, db } from '@/firebaseConfig';
import { useAuth } from '@/src/context/AuthContext';
import { useTheme } from '@/src/context/ThemeContext';
import { ensureOwnerMembership } from '@/src/services/clinicMembersService';
import { useClinicGuard } from '@/src/utils/navigationGuards';
import { hasActiveSubscription } from '@/src/utils/subscriptionUtils';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';
import { useFocusEffect, useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { collection, getDocs, query, where } from 'firebase/firestore';
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

/**
 * CLINIC LOGIN — Firebase Auth
 *
 * Signs in via Firebase Auth, then queries Firestore by ownerUid.
 *
 * PHASE A2: Uses AuthContext to update global auth state and trigger auto-redirect
 * Prevents patients from accessing this page
 */

export default function ClinicLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const biometricAttempted = useRef(false);
  const router = useRouter();
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const { setClinicAuth } = useAuth();

  // PHASE F: Guard - prevent patients from accessing clinic pages
  useClinicGuard();

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

    if (snapshot.empty) {
      Alert.alert(t('common.error'), t('auth.invalidCredentials'));
      return;
    }

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
        [{ text: t('common.ok'), onPress: () => router.replace('/clinic/subscribe' as any) }]
      );
      return;
    }

    const homeRoute = getHomeRoute(clinicType);
    router.replace(homeRoute as any);
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
    <View style={[styles.mainContainer, { backgroundColor: isDark ? colors.background : '#F5F7FA' }]}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView 
          style={styles.keyboardView} 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
        >
          <View style={styles.content}>
          {/* App Title */}
          <Text style={[styles.appTitle, { color: colors.textPrimary }]}>
            BeSmile AI
          </Text>

          {/* Login Form */}
          <View style={styles.formContainer}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>{t('auth.clinicLogin')}</Text>

            <TextInput 
              style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.textPrimary }]} 
              placeholder={t('auth.email')} 
              placeholderTextColor={colors.inputPlaceholder}
              keyboardType="email-address" 
              value={email} 
              onChangeText={setEmail} 
              editable={!loading} 
              autoCapitalize="none"
            />
            
            <View style={[styles.passwordContainer, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder }]}>
              <TextInput 
                style={[styles.passwordInput, { color: colors.textPrimary }]} 
                placeholder={t('auth.password')} 
                placeholderTextColor={colors.inputPlaceholder}
                secureTextEntry={!showPassword}
                value={password} 
                onChangeText={setPassword} 
                editable={!loading} 
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
            </View>

            <TouchableOpacity 
              style={[styles.btn, { backgroundColor: '#4A90D9' }]} 
              onPress={onLogin} 
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.btnText}>{t('auth.login')}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
      
      {/* Bottom Navigation Bar - Outside SafeAreaView */}
      <View style={[styles.bottomNav, { backgroundColor: colors.background, borderTopColor: colors.inputBorder }]}>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/(tabs)/home' as any)}>
          <Ionicons name="home" size={22} color={colors.textSecondary} />
          <Text style={[styles.navText, { color: colors.textSecondary }]}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/(tabs)/clinic' as any)}>
          <Ionicons name="briefcase" size={22} color="#4A90D9" />
          <Text style={[styles.navText, { color: '#4A90D9' }]}>Clinic</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/(tabs)/subscription' as any)}>
          <Ionicons name="star" size={22} color={colors.textSecondary} />
          <Text style={[styles.navText, { color: colors.textSecondary }]}>Subscribe</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/(tabs)/ai' as any)}>
          <Ionicons name="sparkles" size={22} color={colors.textSecondary} />
          <Text style={[styles.navText, { color: colors.textSecondary }]}>AI Pro</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/(tabs)/clinics' as any)}>
          <Ionicons name="grid" size={22} color={colors.textSecondary} />
          <Text style={[styles.navText, { color: colors.textSecondary }]}>Clinics</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
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
  appTitle: {
    fontSize: 38,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 40,
    letterSpacing: -0.5,
  },
  formContainer: {
    gap: 12,
  },
  title: { 
    fontSize: 22, 
    fontWeight: '700', 
    marginBottom: 16,
    textAlign: 'center',
  },
  input: { 
    borderWidth: 1, 
    padding: 14, 
    borderRadius: 12, 
    fontSize: 16,
    textAlign: 'left',
  },
  passwordContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    borderWidth: 1, 
    borderRadius: 12,
    paddingRight: 8,
  },
  passwordInput: { 
    flex: 1, 
    padding: 14, 
    fontSize: 16,
    textAlign: 'left',
  },
  passwordToggle: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
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
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 10,
    paddingBottom: Platform.OS === 'ios' ? 34 : 10,
    borderTopWidth: 1,
  },
  navItem: {
    alignItems: 'center',
    gap: 4,
  },
  navText: {
    fontSize: 10,
    fontWeight: '600',
  },
});
