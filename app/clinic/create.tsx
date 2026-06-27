import { db } from '@/firebaseConfig';
import i18n from '@/i18n';
import { PremiumGradientBackground } from '@/src/components/PremiumGradientBackground';
import { useClinic } from '@/src/context/ClinicContext';
import { useTheme } from '@/src/context/ThemeContext';
import { generateUniquePatientCode, reservePatientCode } from '@/src/services/patientCodeService';
import { useClinicGuard } from '@/src/utils/navigationGuards';
import { localizeNumber } from '@/utils/localization';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useRouter } from 'expo-router';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
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
const ACCENT_LIGHT = '#4DA3FF';
const ACCENT_DARK = '#1E6FD9';

export default function CreatePatientScreen() {
  useClinicGuard();
  const { clinicId, clinicUser } = useClinic();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [gender, setGender] = useState<'male' | 'female' | 'other'>('male');
  const [hasRegularMedication, setHasRegularMedication] = useState(false);
  const [regularMedicationDetails, setRegularMedicationDetails] = useState('');
  const [hasAllergy, setHasAllergy] = useState(false);
  const [allergyDetails, setAllergyDetails] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const isRTL = ['ar', 'he', 'fa', 'ur'].includes(i18n.language);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/clinic/dashboard' as any);
    }
  };

  useEffect(() => {
    if (!clinicUser) {
      router.replace('/clinic/login' as any);
    }
  }, [clinicUser, router]);

  const onSubmit = async () => {
    if (!name) {
      Alert.alert(t('common.validation'), t('createPatient.nameRequired'));
      return;
    }
    if (!clinicId) {
      Alert.alert(t('common.error'), t('createPatient.clinicIdError'));
      return;
    }

    setLoading(true);
    try {
      const code = await generateUniquePatientCode();

      const patientRef = await addDoc(collection(db, 'clinics', clinicId, 'patients'), {
        clinicId,
        code,
        name,
        phone: phone || null,
        email: email || null,
        notes: notes || null,
        dateOfBirth: dateOfBirth ? dateOfBirth.toISOString().split('T')[0] : null,
        gender,
        hasRegularMedication,
        regularMedicationDetails: hasRegularMedication ? regularMedicationDetails : null,
        hasAllergy,
        allergyDetails: hasAllergy ? allergyDetails : null,
        createdAt: serverTimestamp(),
      });

      await reservePatientCode(code, clinicId, patientRef.id);

      const localizedCode = localizeNumber(code);

      Alert.alert(
        t('createPatient.created'),
        `${t('createPatient.code')}: ${localizedCode}\n\n${t('createPatient.shareCode')}`,
        [{ text: t('common.ok'), onPress: () => router.push('/clinic/dashboard') }]
      );
    } catch (err: any) {
      console.error('createPatient error', err);
      Alert.alert(t('common.error'), err.message || t('createPatient.failed'));
    } finally {
      setLoading(false);
    }
  };

  // Theme-derived tokens (translucent — no blur)
  const textPrimary = colors.textPrimary;
  const textSecondary = colors.textSecondary;
  const textMuted = colors.textTertiary;
  const cardBg = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.45)';
  const cardBorder = isDark ? 'rgba(255,255,255,0.09)' : 'rgba(255,255,255,0.65)';
  const fieldBg = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.65)';
  const fieldBorder = isDark ? 'rgba(255,255,255,0.10)' : 'rgba(230,236,246,0.9)';
  const segmentBg = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(244,247,252,0.7)';
  const segmentBorder = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(230,236,246,0.9)';
  const backBg = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.92)';
  const backBgPressed = isDark ? 'rgba(255,255,255,0.15)' : 'rgba(27, 37, 66, 0.1)';
  const backIconColor = isDark ? '#FFFFFF' : '#1B2542';

  return (
    <View style={{ flex: 1 }}>
      <Stack.Screen options={{ headerShown: false }} />
      <PremiumGradientBackground isDark={isDark} showSparkles={!isDark} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
      >
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
              {t('createPatient.title')}
            </Text>
            <Text style={[styles.headerSubtitle, { color: textSecondary }]}>
              Add a new patient to your clinic
            </Text>
          </View>

          <View style={[styles.headerPin, { backgroundColor: 'rgba(61,158,255,0.16)' }]}>
            <Ionicons name="person-add-outline" size={20} color={ACCENT} />
          </View>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 32 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* BASIC INFORMATION */}
          <Text style={[styles.eyebrow, { color: textSecondary }]}>
            BASIC INFORMATION
          </Text>
          <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            {/* Name */}
            <View style={styles.fieldBlock}>
              <View style={styles.labelRow}>
                <Text style={[styles.fieldLabel, { color: textSecondary }]}>
                  {t('createPatient.name').replace(/\s*\*\s*$/, '')}
                </Text>
                <Text style={styles.required}> *</Text>
              </View>
              <View style={[styles.field, { backgroundColor: fieldBg, borderColor: fieldBorder }]}>
                <Ionicons name="person-outline" size={18} color={textMuted} style={styles.fieldIcon} />
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder={t('createPatient.name').replace(/\s*\*\s*$/, '')}
                  placeholderTextColor={textMuted}
                  editable={!loading}
                  style={[
                    styles.fieldInput,
                    { color: textPrimary },
                    isRTL && { textAlign: 'right', writingDirection: 'rtl' },
                  ]}
                />
              </View>
            </View>

            {/* Phone */}
            <View style={styles.fieldBlock}>
              <Text style={[styles.fieldLabel, { color: textSecondary }]}>
                {t('createPatient.phone')}
              </Text>
              <View style={[styles.field, { backgroundColor: fieldBg, borderColor: fieldBorder }]}>
                <Ionicons name="call-outline" size={18} color={textMuted} style={styles.fieldIcon} />
                <TextInput
                  value={phone}
                  onChangeText={setPhone}
                  placeholder={t('createPatient.phone')}
                  placeholderTextColor={textMuted}
                  keyboardType="phone-pad"
                  editable={!loading}
                  style={[styles.fieldInput, { color: textPrimary, textAlign: 'left', writingDirection: 'ltr' }]}
                />
              </View>
            </View>

            {/* Email */}
            <View style={styles.fieldBlock}>
              <Text style={[styles.fieldLabel, { color: textSecondary }]}>
                {t('createPatient.email')}
              </Text>
              <View style={[styles.field, { backgroundColor: fieldBg, borderColor: fieldBorder }]}>
                <Ionicons name="mail-outline" size={18} color={textMuted} style={styles.fieldIcon} />
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder={t('createPatient.email')}
                  placeholderTextColor={textMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                  style={[styles.fieldInput, { color: textPrimary, textAlign: 'left', writingDirection: 'ltr' }]}
                />
              </View>
            </View>

            {/* Date of Birth */}
            <View style={styles.fieldBlock}>
              <Text style={[styles.fieldLabel, { color: textSecondary }]}>
                {t('createPatient.dateOfBirth')}
              </Text>
              <Pressable
                onPress={() => setShowDatePicker(true)}
                disabled={loading}
                style={[styles.field, { backgroundColor: fieldBg, borderColor: fieldBorder }]}
              >
                <Ionicons name="calendar-outline" size={18} color={textMuted} style={styles.fieldIcon} />
                <Text
                  style={[
                    styles.dateText,
                    { color: dateOfBirth ? textPrimary : textMuted },
                  ]}
                >
                  {dateOfBirth
                    ? dateOfBirth.toLocaleDateString(i18n.language, { year: 'numeric', month: 'long', day: 'numeric' })
                    : t('createPatient.dateOfBirth')}
                </Text>
              </Pressable>
              {showDatePicker && (
                <DateTimePicker
                  value={dateOfBirth || new Date(2000, 0, 1)}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(event, selectedDate) => {
                    setShowDatePicker(Platform.OS === 'ios');
                    if (selectedDate) setDateOfBirth(selectedDate);
                  }}
                  maximumDate={new Date()}
                />
              )}
            </View>

            {/* Gender — segmented */}
            <View style={[styles.fieldBlock, { marginBottom: 0 }]}>
              <Text style={[styles.fieldLabel, { color: textSecondary }]}>
                {t('createPatient.gender')}
              </Text>
              <View style={[styles.segment, { backgroundColor: segmentBg, borderColor: segmentBorder }]}>
                <SegmentButton
                  label={t('createPatient.male')}
                  active={gender === 'male'}
                  onPress={() => setGender('male')}
                  disabled={loading}
                  textMuted={textMuted}
                />
                <SegmentButton
                  label={t('createPatient.female')}
                  active={gender === 'female'}
                  onPress={() => setGender('female')}
                  disabled={loading}
                  textMuted={textMuted}
                />
                <SegmentButton
                  label={t('createPatient.other')}
                  active={gender === 'other'}
                  onPress={() => setGender('other')}
                  disabled={loading}
                  textMuted={textMuted}
                />
              </View>
            </View>
          </View>

          {/* MEDICAL INFORMATION */}
          <Text style={[styles.eyebrow, { color: textSecondary }]}>
            MEDICAL INFORMATION
          </Text>
          <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            {/* Regular Medication */}
            <View style={styles.toggleRow}>
              <Text style={[styles.toggleLabel, { color: textPrimary }]}>
                {t('createPatient.regularMedication')}
              </Text>
              <YesNoPill
                value={hasRegularMedication}
                onChange={setHasRegularMedication}
                disabled={loading}
                yes={t('common.yes')}
                no={t('common.no')}
                segmentBg={segmentBg}
                segmentBorder={segmentBorder}
                textMuted={textMuted}
              />
            </View>
            {hasRegularMedication && (
              <View style={{ marginTop: 12 }}>
                <View style={[styles.field, styles.fieldTextarea, { backgroundColor: fieldBg, borderColor: fieldBorder }]}>
                  <Ionicons name="medkit-outline" size={18} color={textMuted} style={[styles.fieldIcon, styles.fieldIconTop]} />
                  <TextInput
                    value={regularMedicationDetails}
                    onChangeText={setRegularMedicationDetails}
                    placeholder={t('createPatient.medicationDetails')}
                    placeholderTextColor={textMuted}
                    multiline
                    editable={!loading}
                    style={[
                      styles.fieldInput,
                      styles.fieldInputMultiline,
                      { color: textPrimary },
                      isRTL && { textAlign: 'right', writingDirection: 'rtl' },
                    ]}
                  />
                </View>
              </View>
            )}

            {/* Allergy */}
            <View style={[styles.toggleRow, { marginTop: 14 }]}>
              <Text style={[styles.toggleLabel, { color: textPrimary }]}>
                {t('createPatient.hasAllergy')}
              </Text>
              <YesNoPill
                value={hasAllergy}
                onChange={setHasAllergy}
                disabled={loading}
                yes={t('common.yes')}
                no={t('common.no')}
                segmentBg={segmentBg}
                segmentBorder={segmentBorder}
                textMuted={textMuted}
              />
            </View>
            {hasAllergy && (
              <View style={{ marginTop: 12 }}>
                <View style={[styles.field, styles.fieldTextarea, { backgroundColor: fieldBg, borderColor: fieldBorder }]}>
                  <Ionicons name="alert-circle-outline" size={18} color={textMuted} style={[styles.fieldIcon, styles.fieldIconTop]} />
                  <TextInput
                    value={allergyDetails}
                    onChangeText={setAllergyDetails}
                    placeholder={t('createPatient.allergyDetails')}
                    placeholderTextColor={textMuted}
                    multiline
                    editable={!loading}
                    style={[
                      styles.fieldInput,
                      styles.fieldInputMultiline,
                      { color: textPrimary },
                      isRTL && { textAlign: 'right', writingDirection: 'rtl' },
                    ]}
                  />
                </View>
              </View>
            )}
          </View>

          {/* ADDITIONAL NOTES */}
          <Text style={[styles.eyebrow, { color: textSecondary }]}>
            ADDITIONAL NOTES
          </Text>
          <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <View style={[styles.field, styles.fieldTextarea, { backgroundColor: fieldBg, borderColor: fieldBorder }]}>
              <Ionicons name="document-text-outline" size={18} color={textMuted} style={[styles.fieldIcon, styles.fieldIconTop]} />
              <TextInput
                value={notes}
                onChangeText={setNotes}
                placeholder={t('createPatient.notes')}
                placeholderTextColor={textMuted}
                multiline
                editable={!loading}
                style={[
                  styles.fieldInput,
                  styles.fieldInputMultiline,
                  { color: textPrimary },
                  isRTL && { textAlign: 'right', writingDirection: 'rtl' },
                ]}
              />
            </View>
          </View>

          {/* Primary button */}
          <Pressable
            onPress={onSubmit}
            disabled={loading}
            style={({ pressed }) => [
              styles.primaryBtnWrap,
              {
                transform: [{ scale: pressed && !loading ? 0.98 : 1 }],
                opacity: loading ? 0.7 : 1,
              },
            ]}
          >
            <LinearGradient
              colors={[ACCENT, ACCENT_DARK] as any}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.primaryBtn}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryBtnText}>{t('createPatient.create')}</Text>
              )}
            </LinearGradient>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function SegmentButton({
  label,
  active,
  onPress,
  disabled,
  textMuted,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  disabled: boolean;
  textMuted: string;
}) {
  if (active) {
    return (
      <Pressable onPress={onPress} disabled={disabled} style={styles.segmentBtn}>
        <LinearGradient
          colors={[ACCENT_LIGHT, ACCENT_DARK] as any}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.segmentBtnActiveFill}
        >
          <Text style={styles.segmentBtnTextActive}>{label}</Text>
        </LinearGradient>
      </Pressable>
    );
  }
  return (
    <Pressable onPress={onPress} disabled={disabled} style={styles.segmentBtn}>
      <Text style={[styles.segmentBtnText, { color: textMuted }]}>{label}</Text>
    </Pressable>
  );
}

function YesNoPill({
  value,
  onChange,
  disabled,
  yes,
  no,
  segmentBg,
  segmentBorder,
  textMuted,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
  disabled: boolean;
  yes: string;
  no: string;
  segmentBg: string;
  segmentBorder: string;
  textMuted: string;
}) {
  return (
    <View style={[styles.yesNoPill, { backgroundColor: segmentBg, borderColor: segmentBorder }]}>
      <YesNoSeg label={yes} active={value === true} onPress={() => onChange(true)} disabled={disabled} textMuted={textMuted} />
      <YesNoSeg label={no} active={value === false} onPress={() => onChange(false)} disabled={disabled} textMuted={textMuted} />
    </View>
  );
}

function YesNoSeg({
  label,
  active,
  onPress,
  disabled,
  textMuted,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  disabled: boolean;
  textMuted: string;
}) {
  if (active) {
    return (
      <Pressable onPress={onPress} disabled={disabled} style={styles.yesNoSeg}>
        <LinearGradient
          colors={[ACCENT_LIGHT, ACCENT_DARK] as any}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.yesNoSegActiveFill}
        >
          <Text style={styles.yesNoSegTextActive}>{label}</Text>
        </LinearGradient>
      </Pressable>
    );
  }
  return (
    <Pressable onPress={onPress} disabled={disabled} style={styles.yesNoSeg}>
      <Text style={[styles.yesNoSegText, { color: textMuted }]}>{label}</Text>
    </Pressable>
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
  headerText: { flex: 1 },
  headerTitle: { fontSize: 21, fontWeight: '800', marginBottom: 2 },
  headerSubtitle: { fontSize: 12.5 },
  headerPin: {
    width: 40,
    height: 40,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
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

  fieldBlock: { marginBottom: 14 },
  labelRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  fieldLabel: { fontSize: 12, fontWeight: '700' },
  required: { color: '#EF4444', fontWeight: '700', fontSize: 12 },

  field: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 13,
    height: 50,
  },
  fieldTextarea: {
    height: undefined,
    minHeight: 110,
    alignItems: 'flex-start',
    paddingVertical: 12,
  },
  fieldIcon: { marginRight: 8 },
  fieldIconTop: { marginTop: 2 },
  fieldInput: {
    flex: 1,
    fontSize: 14.5,
    paddingVertical: 0,
  },
  fieldInputMultiline: {
    minHeight: 86,
    textAlignVertical: 'top',
  },
  dateText: {
    flex: 1,
    fontSize: 14.5,
  },

  segment: {
    flexDirection: 'row',
    borderRadius: 14,
    borderWidth: 1,
    padding: 4,
    gap: 4,
  },
  segmentBtn: {
    flex: 1,
    height: 40,
    borderRadius: 11,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentBtnActiveFill: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 11,
  },
  segmentBtnText: { fontSize: 13, fontWeight: '700' },
  segmentBtnTextActive: { fontSize: 13, fontWeight: '800', color: '#FFFFFF' },

  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  toggleLabel: { flex: 1, fontSize: 14, fontWeight: '600' },

  yesNoPill: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    padding: 3,
    gap: 3,
  },
  yesNoSeg: {
    minWidth: 52,
    height: 32,
    borderRadius: 9,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  yesNoSegActiveFill: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9,
  },
  yesNoSegText: { fontSize: 12.5, fontWeight: '700' },
  yesNoSegTextActive: { fontSize: 12.5, fontWeight: '800', color: '#FFFFFF' },

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
