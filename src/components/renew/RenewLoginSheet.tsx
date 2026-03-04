/**
 * RenewLoginSheet
 *
 * Bottom-sheet overlay for the Renew Subscription flow.
 * Phase R1 — Firebase Auth sign-in + password reset.
 *
 * Props:
 *   visible         – controlled visibility
 *   onClose         – close handler (password is cleared automatically)
 *   onAuthSuccess   – called after successful Firebase sign-in; parent navigates
 *
 * Security:
 *   • Password is NEVER stored outside local component state.
 *   • Password state is cleared on success, failure, and close.
 *   • No AsyncStorage, no SecureStore, no global state.
 */

import { auth, db } from '@/firebaseConfig';
import { PremiumGradientBackground } from '@/src/components/PremiumGradientBackground';
import { useAuth } from '@/src/context/AuthContext';
import { useTheme } from '@/src/context/ThemeContext';
import { ensureOwnerMembership } from '@/src/services/clinicMembersService';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { sendPasswordResetEmail, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Keyboard,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

// ── Types ────────────────────────────────────────────────────────────────

export interface RenewLoginSheetProps {
  visible: boolean;
  onClose: () => void;
  onAuthSuccess: () => void;
}

// ── Constants ────────────────────────────────────────────────────────────

const ACCENT = '#3D9EFF';

// ── Helpers ──────────────────────────────────────────────────────────────

/** Map Firebase Auth error codes to user-friendly messages. */
function friendlyAuthError(code: string): string {
  switch (code) {
    case 'auth/invalid-email':
      return 'The email address is not valid.';
    case 'auth/user-disabled':
      return 'This account has been disabled.';
    case 'auth/user-not-found':
      return 'No account found with this email.';
    case 'auth/wrong-password':
      return 'Incorrect password. Please try again.';
    case 'auth/invalid-credential':
      return 'Invalid email or password. Please try again.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait and try again.';
    case 'auth/network-request-failed':
      return 'Network error. Check your connection.';
    default:
      return 'Sign-in failed. Please try again.';
  }
}

// ── Component ────────────────────────────────────────────────────────────

export default function RenewLoginSheet({ visible, onClose, onAuthSuccess }: RenewLoginSheetProps) {
  const { colors, isDark } = useTheme();
  const { setClinicAuth } = useAuth();

  const [clinicName, setClinicName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  // Clear ALL fields every time the sheet closes
  useEffect(() => {
    if (!visible) {
      setClinicName('');
      setEmail('');
      setPassword('');
      setError(null);
      setInfo(null);
      setIsSubmitting(false);
    }
  }, [visible]);

  // ── Continue (Firebase sign-in) ──────────────────────────────────────
  const handleContinue = async () => {
    Keyboard.dismiss();
    setError(null);
    setInfo(null);

    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password.');
      return;
    }

    try {
      setIsSubmitting(true);

      // Normalize email only (match login.tsx exactly — raw password)
      const normalizedEmail = email.trim().toLowerCase();

      // Force clean auth state to avoid session conflict
      if (auth.currentUser) {
        await signOut(auth);
      }

      // Sign-in is the single authority (no preflight)
      const userCredential = await signInWithEmailAndPassword(auth, normalizedEmail, password);
      const firebaseUid = userCredential.user.uid;

      // Query clinic by ownerUid (same pattern as login.tsx)
      const q = query(
        collection(db, 'clinics'),
        where('ownerUid', '==', firebaseUid)
      );
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        setError('No clinic found for this account.');
        setPassword('');
        return;
      }

      const clinicDoc = snapshot.docs[0];
      const clinicId = clinicDoc.id;

      // Ensure owner membership exists
      const ownerMember = await ensureOwnerMembership(clinicId, normalizedEmail);

      // Store email for future reference
      await AsyncStorage.setItem('clinicUserEmail', normalizedEmail);

      // Set clinic auth context (triggers subscription check in background)
      await setClinicAuth({
        clinicId,
        memberId: ownerMember.id,
        role: ownerMember.role,
        status: ownerMember.status,
      });

      // Success — clear password, then notify parent
      setPassword('');
      setError(null);
      onAuthSuccess();
    } catch (err: any) {
      const code: string = err?.code ?? '';
      console.error('[RENEW SIGNIN ERROR]', err?.code, err?.message);
      setError(friendlyAuthError(code));
      // Clear password on failure as well (security best practice)
      setPassword('');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Forgot Password ─────────────────────────────────────────────────
  const handleForgotPassword = async () => {
    Keyboard.dismiss();
    setError(null);
    setInfo(null);

    if (!email.trim()) {
      setError('Enter your email address first, then tap "Forgot password?"');
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email.trim());
      setInfo('Password reset email sent. Check your inbox.');
    } catch (err: any) {
      const code: string = err?.code ?? '';
      if (code === 'auth/user-not-found') {
        setError('No account found with this email.');
      } else if (code === 'auth/invalid-email') {
        setError('The email address is not valid.');
      } else {
        setError('Failed to send reset email. Please try again.');
      }
    }
  };

  const handleClose = () => {
    Keyboard.dismiss();
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      {/* Scrim / backdrop */}
      <Pressable style={[styles.overlay, { backgroundColor: colors.scrim }]} onPress={handleClose}>
        {/* Prevent press-through */}
        <View />
      </Pressable>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.sheetWrapper}
        pointerEvents="box-none"
      >
        <View
          style={[
            styles.sheet,
            {
              borderColor: colors.cardBorder,
              overflow: 'hidden',
            },
          ]}
        >
          <PremiumGradientBackground isDark={isDark} showSparkles={false} />
          {/* ── Header ── */}
          <View style={styles.headerRow}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>Renew Subscription</Text>
            <TouchableOpacity onPress={handleClose} hitSlop={12} accessibilityLabel="Close">
              <Ionicons name="close" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* ── Error / Info banners ── */}
          {error && (
            <View style={[styles.banner, styles.errorBanner]}>
              <Ionicons name="alert-circle" size={16} color="#ef4444" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
          {info && (
            <View style={[styles.banner, styles.infoBanner]}>
              <Ionicons name="checkmark-circle" size={16} color="#22c55e" />
              <Text style={styles.infoText}>{info}</Text>
            </View>
          )}

          {/* ── Clinic Name ── */}
          <Text style={[styles.label, { color: colors.textSecondary }]}>Clinic Name</Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.inputBackground,
                borderColor: colors.inputBorder,
                color: colors.textPrimary,
              },
            ]}
            value={clinicName}
            onChangeText={setClinicName}
            placeholder="Your clinic name"
            placeholderTextColor={isDark ? 'rgba(255,255,255,0.3)' : '#9CA3AF'}
            autoCapitalize="words"
            returnKeyType="next"
            editable={!isSubmitting}
          />

          {/* ── Email ── */}
          <Text style={[styles.label, { color: colors.textSecondary }]}>Email</Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.inputBackground,
                borderColor: colors.inputBorder,
                color: colors.textPrimary,
              },
            ]}
            value={email}
            onChangeText={setEmail}
            placeholder="clinic@example.com"
            placeholderTextColor={isDark ? 'rgba(255,255,255,0.3)' : '#9CA3AF'}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="next"
            editable={!isSubmitting}
          />

          {/* ── Password ── */}
          <Text style={[styles.label, { color: colors.textSecondary }]}>Password</Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.inputBackground,
                borderColor: colors.inputBorder,
                color: colors.textPrimary,
              },
            ]}
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            placeholderTextColor={isDark ? 'rgba(255,255,255,0.3)' : '#9CA3AF'}
            secureTextEntry
            autoCapitalize="none"
            returnKeyType="done"
            onSubmitEditing={handleContinue}
            editable={!isSubmitting}
          />

          {/* ── Forgot Password ── */}
          <TouchableOpacity
            onPress={handleForgotPassword}
            style={styles.forgotRow}
            disabled={isSubmitting}
          >
            <Text style={[styles.forgotText, { color: ACCENT, opacity: isSubmitting ? 0.5 : 1 }]}>
              Forgot password?
            </Text>
          </TouchableOpacity>

          {/* ── Continue Button ── */}
          <TouchableOpacity
            style={[styles.continueBtn, { backgroundColor: ACCENT, opacity: isSubmitting ? 0.7 : 1 }]}
            onPress={handleContinue}
            activeOpacity={0.85}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.continueBtnText}>Continue</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  sheetWrapper: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: 0,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 28,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 12,
  },
  errorBanner: {
    backgroundColor: 'rgba(239,68,68,0.1)',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  infoBanner: {
    backgroundColor: 'rgba(34,197,94,0.1)',
  },
  infoText: {
    color: '#22c55e',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 14 : 10,
    fontSize: 15,
    fontWeight: '500',
  },
  forgotRow: {
    alignSelf: 'flex-end',
    marginTop: 8,
    marginBottom: 4,
  },
  forgotText: {
    fontSize: 13,
    fontWeight: '600',
  },
  continueBtn: {
    marginTop: 16,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});
