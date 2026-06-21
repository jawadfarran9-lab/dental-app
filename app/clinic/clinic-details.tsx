import { db } from '@/firebaseConfig';
import { PremiumGradientBackground } from '@/src/components/PremiumGradientBackground';
import { useAuth } from '@/src/context/AuthContext';
import { useTheme } from '@/src/context/ThemeContext';
import { fetchClinicData } from '@/src/utils/clinicDataUtils';
import { useClinicRoleGuard } from '@/src/utils/navigationGuards';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useRouter } from 'expo-router';
import { doc, setDoc } from 'firebase/firestore';
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

export default function ClinicDetailsScreen() {
  useClinicRoleGuard(['owner']);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { clinicId } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [clinicName, setClinicName] = useState('');
  const [clinicPhone, setClinicPhone] = useState('');
  const [businessNumber, setBusinessNumber] = useState('');
  const [email, setEmail] = useState('');

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
        setFirstName(data.firstName ?? '');
        setLastName(data.lastName ?? '');
        setPhone(data.phone ?? '');
        setClinicName(data.clinicName ?? '');
        setClinicPhone(data.clinicPhone ?? '');
        setBusinessNumber(data.businessNumber ?? '');
        setEmail(data.email ?? '');
      } catch (err) {
        console.error('[CLINIC-DETAILS] load error', err);
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
    else router.replace('/clinic/settings' as any);
  };

  const handleChangePassword = () => {
    Alert.alert('Coming soon', 'Password changes will be available soon.');
  };

  const handleSave = async () => {
    if (saving) return;
    if (!clinicId) {
      Alert.alert("Couldn't save", 'Missing clinic session. Please reopen the page.');
      return;
    }
    try {
      setSaving(true);
      await setDoc(
        doc(db, 'clinics', clinicId),
        {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phone: phone.trim(),
          clinicName: clinicName.trim(),
          clinicPhone: clinicPhone.trim(),
          businessNumber: businessNumber.trim(),
        },
        { merge: true }
      );
      Alert.alert('Saved', 'Your clinic details have been updated.');
    } catch (err) {
      console.error('[CLINIC-DETAILS] save error', err);
      Alert.alert("Couldn't save", 'Please try again.');
    } finally {
      setSaving(false);
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
            Clinic details
          </Text>
          <Text style={[styles.headerSubtitle, { color: textSecondary }]}>
            Name, phone, email & more
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
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
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
            {/* Personal information */}
            <Text style={[styles.eyebrow, { color: textSecondary }]}>
              PERSONAL INFORMATION
            </Text>
            <View
              style={[
                styles.card,
                { backgroundColor: cardBg, borderColor: cardBorder },
              ]}
            >
              <Field
                label="First name"
                icon="person-outline"
                value={firstName}
                onChangeText={setFirstName}
                placeholder="Your first name"
                autoCapitalize="words"
                textPrimary={textPrimary}
                textSecondary={textSecondary}
                textMuted={textMuted}
                fieldBg={fieldBg}
                fieldBorder={fieldBorder}
              />
              <Field
                label="Last name"
                icon="person-outline"
                value={lastName}
                onChangeText={setLastName}
                placeholder="Your last name"
                autoCapitalize="words"
                textPrimary={textPrimary}
                textSecondary={textSecondary}
                textMuted={textMuted}
                fieldBg={fieldBg}
                fieldBorder={fieldBorder}
              />
              <Field
                label="Personal phone"
                icon="call-outline"
                value={phone}
                onChangeText={setPhone}
                placeholder="Your phone number"
                keyboardType="phone-pad"
                textPrimary={textPrimary}
                textSecondary={textSecondary}
                textMuted={textMuted}
                fieldBg={fieldBg}
                fieldBorder={fieldBorder}
                isLast
              />
            </View>

            {/* Clinic information */}
            <Text style={[styles.eyebrow, { color: textSecondary }]}>
              CLINIC INFORMATION
            </Text>
            <View
              style={[
                styles.card,
                { backgroundColor: cardBg, borderColor: cardBorder },
              ]}
            >
              <Field
                label="Clinic name"
                icon="business-outline"
                value={clinicName}
                onChangeText={setClinicName}
                placeholder="Your clinic name"
                autoCapitalize="words"
                textPrimary={textPrimary}
                textSecondary={textSecondary}
                textMuted={textMuted}
                fieldBg={fieldBg}
                fieldBorder={fieldBorder}
              />
              <Field
                label="Clinic phone"
                icon="call-outline"
                value={clinicPhone}
                onChangeText={setClinicPhone}
                placeholder="Clinic phone number"
                keyboardType="phone-pad"
                textPrimary={textPrimary}
                textSecondary={textSecondary}
                textMuted={textMuted}
                fieldBg={fieldBg}
                fieldBorder={fieldBorder}
              />
              <Field
                label="Business number"
                icon="briefcase-outline"
                value={businessNumber}
                onChangeText={setBusinessNumber}
                placeholder="e.g. 51-234567-8"
                autoCapitalize="characters"
                textPrimary={textPrimary}
                textSecondary={textSecondary}
                textMuted={textMuted}
                fieldBg={fieldBg}
                fieldBorder={fieldBorder}
                isLast
              />
            </View>

            {/* Account & security */}
            <Text style={[styles.eyebrow, { color: textSecondary }]}>
              ACCOUNT & SECURITY
            </Text>
            <View
              style={[
                styles.card,
                { backgroundColor: cardBg, borderColor: cardBorder },
              ]}
            >
              {/* Read-only email */}
              <View style={styles.fieldBlock}>
                <View style={styles.labelRow}>
                  <Text style={[styles.fieldLabel, { color: textSecondary }]}>
                    Sign-in email
                  </Text>
                  <View
                    style={[
                      styles.readOnlyPill,
                      {
                        backgroundColor: isDark
                          ? 'rgba(255,255,255,0.08)'
                          : 'rgba(91,107,130,0.10)',
                      },
                    ]}
                  >
                    <Text style={[styles.readOnlyPillText, { color: textMuted }]}>
                      Read-only
                    </Text>
                  </View>
                </View>
                <View
                  style={[
                    styles.field,
                    {
                      backgroundColor: fieldBg,
                      borderColor: fieldBorder,
                      opacity: 0.85,
                    },
                  ]}
                >
                  <Ionicons
                    name="mail-outline"
                    size={18}
                    color={textMuted}
                    style={styles.fieldIcon}
                  />
                  <Text
                    style={[styles.fieldReadOnlyText, { color: textPrimary }]}
                    numberOfLines={1}
                  >
                    {email || '—'}
                  </Text>
                </View>
              </View>

              {/* Change password */}
              <Pressable
                onPress={handleChangePassword}
                style={({ pressed }) => [
                  styles.passwordRow,
                  {
                    backgroundColor: pressed
                      ? isDark
                        ? 'rgba(255,255,255,0.06)'
                        : 'rgba(100,116,139,0.05)'
                      : 'transparent',
                  },
                ]}
              >
                <View
                  style={[
                    styles.passwordIconTile,
                    { backgroundColor: 'rgba(61,158,255,0.14)' },
                  ]}
                >
                  <Ionicons name="lock-closed-outline" size={20} color={ACCENT} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.passwordTitle, { color: textPrimary }]}>
                    Change password
                  </Text>
                  <Text style={[styles.passwordSubtitle, { color: textSecondary }]}>
                    Update your account password
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={isDark ? '#4B5563' : '#C3CDDC'}
                />
              </Pressable>
            </View>

            {/* Save button */}
            <Pressable
              onPress={handleSave}
              disabled={saving}
              style={({ pressed }) => [
                styles.primaryBtnWrap,
                {
                  transform: [{ scale: pressed && !saving ? 0.98 : 1 }],
                  opacity: saving ? 0.7 : 1,
                },
              ]}
            >
              <LinearGradient
                colors={[ACCENT, ACCENT_DARK] as any}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.primaryBtn}
              >
                {saving ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.primaryBtnText}>Save changes</Text>
                )}
              </LinearGradient>
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </View>
  );
}

function Field({
  label,
  icon,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  autoCapitalize,
  textPrimary,
  textSecondary,
  textMuted,
  fieldBg,
  fieldBorder,
  isLast,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
  keyboardType?: 'default' | 'phone-pad' | 'email-address';
  autoCapitalize?: 'none' | 'words' | 'characters' | 'sentences';
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
          name={icon}
          size={18}
          color={textMuted}
          style={styles.fieldIcon}
        />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={textMuted}
          keyboardType={keyboardType ?? 'default'}
          autoCapitalize={autoCapitalize ?? 'none'}
          autoCorrect={false}
          style={[styles.fieldInput, { color: textPrimary }]}
        />
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
    gap: 8,
  },

  eyebrow: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginTop: 12,
    marginBottom: 8,
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
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
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
  fieldReadOnlyText: {
    flex: 1,
    fontSize: 14.5,
    fontWeight: '600',
  },

  readOnlyPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  readOnlyPillText: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 4,
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: 12,
  },
  passwordIconTile: {
    width: 40,
    height: 40,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },
  passwordTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    marginBottom: 2,
  },
  passwordSubtitle: {
    fontSize: 12,
    fontWeight: '500',
  },

  primaryBtnWrap: {
    borderRadius: 16,
    marginTop: 18,
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
