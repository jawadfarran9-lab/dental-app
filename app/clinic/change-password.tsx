import { auth } from '@/firebaseConfig';
import { PremiumGradientBackground } from '@/src/components/PremiumGradientBackground';
import { useAuth } from '@/src/context/AuthContext';
import { useTheme } from '@/src/context/ThemeContext';
import { fetchClinicData } from '@/src/utils/clinicDataUtils';
import { useClinicRoleGuard } from '@/src/utils/navigationGuards';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useRouter } from 'expo-router';
import {
    EmailAuthProvider,
    reauthenticateWithCredential,
    sendPasswordResetEmail,
    signInWithEmailAndPassword,
    updatePassword,
} from 'firebase/auth';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const ACCENT = '#3D9EFF';
const ACCENT_DARK = '#1E6FD9';

export default function ClinicChangePasswordScreen() {
  useClinicRoleGuard(['owner']);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { clinicId } = useAuth();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [resetting, setResetting] = useState(false);

  const [ownerEmail, setOwnerEmail] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!clinicId) {
        setLoading(false);
        return;
      }
      try {
        const data = await fetchClinicData(clinicId);
        if (cancelled || !data) return;
        setOwnerEmail(data.email ?? '');
      } catch (err) {
        console.error('[CHANGE-PASSWORD] load error', err);
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
    else router.replace('/clinic/clinic-details' as any);
  };

  const resolveEmail = (): string => {
    return auth.currentUser?.email ?? ownerEmail ?? '';
  };

  const handleForgotPassword = async () => {
    if (resetting) return;
    const email = resolveEmail();
    if (!email) {
      Alert.alert('Reset', "We couldn't find your account email.");
      return;
    }
    try {
      setResetting(true);
      await sendPasswordResetEmail(auth, email);
      Alert.alert('Reset', "We've sent a password reset link to your email.");
    } catch (err: any) {
      const code = err?.code ?? '';
      let msg = 'Could not send a reset email. Please try again.';
      if (code === 'auth/invalid-email') msg = 'The email on file is not valid.';
      else if (code === 'auth/user-not-found') msg = 'No account found for this email.';
      else if (code === 'auth/too-many-requests') msg = 'Too many attempts. Please try again later.';
      Alert.alert('Reset', msg);
    } finally {
      setResetting(false);
    }
  };

  const handleSubmit = async () => {
    if (submitting) return;
    if (!currentPassword) {
      Alert.alert('Password', 'Please enter your current password.');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Password', 'New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Password', "New passwords don't match.");
      return;
    }

    const email = resolveEmail();
    if (!email) {
      Alert.alert(
        'Password',
        'We could not verify your account email. Please go back and try again.'
      );
      return;
    }

    try {
      setSubmitting(true);
      const cred = EmailAuthProvider.credential(email, currentPassword);
      let user = auth.currentUser;
      if (user) {
        await reauthenticateWithCredential(user, cred);
      } else {
        const res = await signInWithEmailAndPassword(auth, email, currentPassword);
        user = res.user;
      }
      await updatePassword(user, newPassword);
      Alert.alert('Password', 'Your password has been updated.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err: any) {
      const code = err?.code ?? '';
      let msg = 'Could not update your password. Please try again.';
      if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        msg = 'Your current password is incorrect.';
      } else if (code === 'auth/weak-password') {
        msg = 'New password is too weak. Use at least 6 characters.';
      } else if (code === 'auth/too-many-requests') {
        msg = 'Too many attempts. Please try again later.';
      } else if (code === 'auth/requires-recent-login') {
        msg = 'Please log in again, then change your password.';
      } else if (code === 'auth/network-request-failed') {
        msg = 'Network error. Check your connection and try again.';
      }
      Alert.alert('Password', msg);
    } finally {
      setSubmitting(false);
    }
  };

  const textPrimary = colors.textPrimary;
  const textSecondary = colors.textSecondary;
  const textMuted = colors.textTertiary;
  const cardBg = isDark ? 'rgba(255,255,255,0.05)' : '#FFFFFF';
  const cardBorder = isDark ? 'rgba(255,255,255,0.10)' : '#EEF2F8';
  const fieldBg = isDark ? 'rgba(255,255,255,0.06)' : '#F4F7FC';
  const fieldBorder = isDark ? 'rgba(255,255,255,0.10)' : '#E6ECF6';
  const backBg = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.92)';
  const backBgPressed = isDark ? 'rgba(255,255,255,0.15)' : 'rgba(27, 37, 66, 0.1)';
  const backIconColor = isDark ? '#FFFFFF' : '#1B2542';
  const infoCardBg = isDark ? 'rgba(61,158,255,0.10)' : 'rgba(61,158,255,0.08)';
  const infoCardBorder = isDark ? 'rgba(61,158,255,0.28)' : 'rgba(61,158,255,0.20)';

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
            Change password
          </Text>
          <Text style={[styles.headerSubtitle, { color: textSecondary }]}>
            Confirm it's you, then set a new one
          </Text>
        </View>

        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={ACCENT} />
        </View>
      ) : (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={[
              styles.scrollContent,
              { paddingBottom: insets.bottom + 32 },
            ]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Security info card */}
            <View
              style={[
                styles.infoCard,
                { backgroundColor: infoCardBg, borderColor: infoCardBorder },
              ]}
            >
              <View
                style={[
                  styles.infoIconTile,
                  { backgroundColor: 'rgba(61,158,255,0.18)' },
                ]}
              >
                <Ionicons name="shield-checkmark" size={18} color={ACCENT} />
              </View>
              <Text style={[styles.infoText, { color: textPrimary }]}>
                For your security, enter your current password to confirm this change.
              </Text>
            </View>

            {/* Current password */}
            <View
              style={[
                styles.card,
                { backgroundColor: cardBg, borderColor: cardBorder },
              ]}
            >
              <PasswordField
                label="Current password"
                placeholder="Enter current password"
                value={currentPassword}
                onChangeText={setCurrentPassword}
                show={showCurrent}
                onToggleShow={() => setShowCurrent((v) => !v)}
                textPrimary={textPrimary}
                textSecondary={textSecondary}
                textMuted={textMuted}
                fieldBg={fieldBg}
                fieldBorder={fieldBorder}
                isLast
              />

              <Pressable
                onPress={handleForgotPassword}
                disabled={resetting}
                hitSlop={8}
                style={({ pressed }) => [
                  styles.forgotWrap,
                  { opacity: pressed || resetting ? 0.6 : 1 },
                ]}
              >
                <Text style={[styles.forgotText, { color: ACCENT }]}>
                  {resetting ? 'Sending…' : 'Forgot your password?'}
                </Text>
              </Pressable>
            </View>

            {/* New password */}
            <View
              style={[
                styles.card,
                { backgroundColor: cardBg, borderColor: cardBorder },
              ]}
            >
              <PasswordField
                label="New password"
                placeholder="Enter new password"
                value={newPassword}
                onChangeText={setNewPassword}
                show={showNew}
                onToggleShow={() => setShowNew((v) => !v)}
                textPrimary={textPrimary}
                textSecondary={textSecondary}
                textMuted={textMuted}
                fieldBg={fieldBg}
                fieldBorder={fieldBorder}
              />
              <Text style={[styles.hintText, { color: textMuted }]}>
                Use at least 6 characters.
              </Text>

              <View style={{ height: 6 }} />

              <PasswordField
                label="Confirm new password"
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                show={showConfirm}
                onToggleShow={() => setShowConfirm((v) => !v)}
                textPrimary={textPrimary}
                textSecondary={textSecondary}
                textMuted={textMuted}
                fieldBg={fieldBg}
                fieldBorder={fieldBorder}
                isLast
              />
            </View>

            {/* Update button */}
            <Pressable
              onPress={handleSubmit}
              disabled={submitting}
              style={({ pressed }) => [
                styles.primaryBtnWrap,
                {
                  transform: [{ scale: pressed && !submitting ? 0.98 : 1 }],
                  opacity: submitting ? 0.7 : 1,
                },
              ]}
            >
              <LinearGradient
                colors={[ACCENT, ACCENT_DARK] as any}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.primaryBtn}
              >
                {submitting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.primaryBtnText}>Update password</Text>
                )}
              </LinearGradient>
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </View>
  );
}

function PasswordField({
  label,
  placeholder,
  value,
  onChangeText,
  show,
  onToggleShow,
  textPrimary,
  textSecondary,
  textMuted,
  fieldBg,
  fieldBorder,
  isLast,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (v: string) => void;
  show: boolean;
  onToggleShow: () => void;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  fieldBg: string;
  fieldBorder: string;
  isLast?: boolean;
}) {
  return (
    <View style={[styles.fieldBlock, isLast && { marginBottom: 0 }]}>
      <Text style={[styles.fieldLabel, { color: textSecondary }]}>{label}</Text>
      <View
        style={[
          styles.field,
          { backgroundColor: fieldBg, borderColor: fieldBorder },
        ]}
      >
        <Ionicons
          name="lock-closed-outline"
          size={18}
          color={textMuted}
          style={styles.fieldIcon}
        />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={textMuted}
          secureTextEntry={!show}
          autoCapitalize="none"
          autoCorrect={false}
          style={[styles.fieldInput, { color: textPrimary }]}
        />
        <Pressable onPress={onToggleShow} hitSlop={8} style={styles.eyeBtn}>
          <Ionicons
            name={show ? 'eye-off-outline' : 'eye-outline'}
            size={18}
            color={textMuted}
          />
        </Pressable>
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
    gap: 12,
  },

  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  infoIconTile: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoText: {
    flex: 1,
    fontSize: 12.5,
    fontWeight: '500',
    lineHeight: 17,
  },

  card: {
    borderRadius: 22,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },

  fieldBlock: {
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 48,
  },
  fieldIcon: {
    marginRight: 8,
  },
  fieldInput: {
    flex: 1,
    fontSize: 14.5,
    paddingVertical: 0,
  },
  eyeBtn: {
    paddingLeft: 8,
    paddingVertical: 6,
  },

  hintText: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 6,
  },

  forgotWrap: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
    marginTop: 4,
  },
  forgotText: {
    fontSize: 13,
    fontWeight: '700',
  },

  primaryBtnWrap: {
    borderRadius: 16,
    marginTop: 10,
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 12,
    elevation: 4,
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
});
