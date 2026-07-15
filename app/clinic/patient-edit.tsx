import { db } from '@/firebaseConfig';
import i18n from '@/i18n';
import { PremiumGradientBackground } from '@/src/components/PremiumGradientBackground';
import { useClinic } from '@/src/context/ClinicContext';
import { useTheme } from '@/src/context/ThemeContext';
import { changePatientCode } from '@/src/services/patientCodeService';
import type { BloodType } from '@/src/types/patient';
import { useClinicGuard } from '@/src/utils/navigationGuards';
import { localizeNumber } from '@/utils/localization';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Clipboard from 'expo-clipboard';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { doc, getDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
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

export default function PatientEditScreen() {
  useClinicGuard();
  const { patientId } = useLocalSearchParams();
  const { clinicId, clinicUser } = useClinic();
  const router = useRouter();
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const isRTL = ['ar', 'he', 'fa', 'ur'].includes(i18n.language);

  // Field state (mirror create.tsx names + types)
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
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [bloodType, setBloodType] = useState<BloodType>(null);
  const [hasChronicConditions, setHasChronicConditions] = useState(false);
  const [chronicConditionsDetails, setChronicConditionsDetails] = useState('');
  const [isPregnant, setIsPregnant] = useState(false);
  const [address, setAddress] = useState('');
  const [occupation, setOccupation] = useState('');
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactRelationship, setEmergencyContactRelationship] = useState('');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('');
  const [referralSource, setReferralSource] = useState('');
  const [insuranceProvider, setInsuranceProvider] = useState('');
  const [insurancePolicyNumber, setInsurancePolicyNumber] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [changingCode, setChangingCode] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!clinicUser) {
      router.replace('/login' as any);
      return;
    }
    if (!clinicId || !patientId) return;

    let cancelled = false;
    (async () => {
      try {
        const pRef = doc(db, 'clinics', clinicId, 'patients', patientId as string);
        const snap = await getDoc(pRef);
        if (!snap.exists()) {
          if (!cancelled) setLoading(false);
          return;
        }
        const p = snap.data() as any;
        if (cancelled) return;
        setName(p.name ?? '');
        setPhone(p.phone ?? '');
        setEmail(p.email ?? '');
        setNotes(p.notes ?? '');
        setDateOfBirth(p.dateOfBirth ? new Date(p.dateOfBirth + 'T00:00:00') : null);
        setGender(p.gender ?? 'male');
        setHeight(p.heightCm != null ? String(p.heightCm) : '');
        setWeight(p.weightKg != null ? String(p.weightKg) : '');
        setBloodType(p.bloodType ?? null);
        setHasRegularMedication(!!p.hasRegularMedication);
        setRegularMedicationDetails(p.regularMedicationDetails ?? '');
        setHasAllergy(!!p.hasAllergy);
        setAllergyDetails(p.allergyDetails ?? '');
        setHasChronicConditions(!!p.hasChronicConditions);
        setChronicConditionsDetails(p.chronicConditionsDetails ?? '');
        setIsPregnant(!!p.isPregnant);
        setAddress(p.address ?? '');
        setOccupation(p.occupation ?? '');
        setEmergencyContactName(p.emergencyContactName ?? '');
        setEmergencyContactRelationship(p.emergencyContactRelationship ?? '');
        setEmergencyContactPhone(p.emergencyContactPhone ?? '');
        setReferralSource(p.referralSource ?? '');
        setInsuranceProvider(p.insuranceProvider ?? '');
        setInsurancePolicyNumber(p.insurancePolicyNumber ?? '');
        setCode(p.code ?? '');
      } catch (err) {
        console.error('[patient-edit] prefill error', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [clinicId, patientId, clinicUser, router]);

  const handleBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/clinic/dashboard' as any);
  };

  const handleCopyCode = async () => {
    if (!code) return;
    await Clipboard.setStringAsync(String(code));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleChangeCode = () => {
    if (!clinicId || !patientId || changingCode) return;
    Alert.alert(
      'Generate a new code?',
      'The current code will stop working immediately. The patient must use the NEW code to log in. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Generate new code',
          style: 'destructive',
          onPress: async () => {
            try {
              setChangingCode(true);
              const newCode = await changePatientCode(clinicId, patientId as string, code);
              setCode(newCode);
              await Clipboard.setStringAsync(String(newCode));
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
              Alert.alert('Code updated', 'The new code has been generated and copied to your clipboard.');
            } catch (err: any) {
              Alert.alert('Error', err?.message ?? 'Could not change the code. Please try again.');
            } finally {
              setChangingCode(false);
            }
          },
        },
      ]
    );
  };

  const onSubmit = async () => {
    if (!name) {
      Alert.alert(t('common.validation'), t('createPatient.nameRequired'));
      return;
    }
    if (!clinicId || !patientId) {
      Alert.alert(t('common.error'), t('createPatient.clinicIdError'));
      return;
    }

    setSaving(true);
    try {
      const pRef = doc(db, 'clinics', clinicId, 'patients', patientId as string);
      await updateDoc(pRef, {
        name,
        phone: phone || null,
        email: email || null,
        notes: notes || null,
        dateOfBirth: dateOfBirth ? dateOfBirth.toISOString().split('T')[0] : null,
        gender,
        heightCm: height ? Number(height) : null,
        weightKg: weight ? Number(weight) : null,
        bloodType,
        hasRegularMedication,
        regularMedicationDetails: hasRegularMedication ? regularMedicationDetails : null,
        hasAllergy,
        allergyDetails: hasAllergy ? allergyDetails : null,
        hasChronicConditions,
        chronicConditionsDetails: hasChronicConditions ? chronicConditionsDetails : null,
        isPregnant: gender === 'female' ? isPregnant : null,
        address: address || null,
        occupation: occupation || null,
        emergencyContactName: emergencyContactName || null,
        emergencyContactRelationship: emergencyContactRelationship || null,
        emergencyContactPhone: emergencyContactPhone || null,
        referralSource: referralSource || null,
        insuranceProvider: insuranceProvider || null,
        insurancePolicyNumber: insurancePolicyNumber || null,
        updatedAt: serverTimestamp(),
      });

      Alert.alert(
        t('common.success'),
        t('patient.updated', { defaultValue: 'Patient updated' }),
        [{ text: t('common.ok'), onPress: () => router.back() }]
      );
    } catch (err: any) {
      console.error('[patient-edit] save error', err);
      Alert.alert(t('common.error'), err?.message || t('createPatient.failed'));
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = () => {
    if (!clinicId || !patientId) return;
    Alert.alert(
      t('patient.removeTitle', { defaultValue: 'Remove patient?' }),
      t('patient.removeMessage', {
        defaultValue:
          "This patient will be hidden from your clinic's lists. Their records will not be shown anywhere in the app. You can ask support to restore them later.",
      }),
      [
        { text: t('common.cancel', { defaultValue: 'Cancel' }), style: 'cancel' },
        {
          text: t('patient.remove', { defaultValue: 'Remove Patient' }),
          style: 'destructive',
          onPress: async () => {
            setArchiving(true);
            try {
              const pRef = doc(db, 'clinics', clinicId, 'patients', patientId as string);
              await updateDoc(pRef, {
                archived: true,
                archivedAt: serverTimestamp(),
              });
              router.back();
            } catch (err: any) {
              console.error('[patient-edit] archive error', err);
              Alert.alert(t('common.error'), err?.message || 'Failed to remove patient');
              setArchiving(false);
            }
          },
        },
      ]
    );
  };

  // Theme tokens (mirror create.tsx)
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
  const lockedIconColor = isDark ? 'rgba(255,255,255,0.85)' : '#1B2542';
  const codeRowBg = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(244,247,252,0.7)';

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
              {t('patient.editTitle', { defaultValue: 'Edit Patient' })}
            </Text>
            <Text style={[styles.headerSubtitle, { color: textSecondary }]}>
              Update this patient's information
            </Text>
          </View>

          <Pressable
            onPress={() => {}}
            style={[styles.backButton, styles.headerLocked, { backgroundColor: backBg }]}
          >
            <Ionicons name="download-outline" size={20} color={lockedIconColor} />
            <View style={styles.lockBadge}>
              <Ionicons name="lock-closed" size={9} color="#FFFFFF" />
            </View>
          </Pressable>
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={textSecondary} />
          </View>
        ) : (
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={[
              styles.scrollContent,
              { paddingBottom: insets.bottom + 32 },
            ]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* PATIENT CODE (read-only) */}
            <Text style={[styles.eyebrow, { color: textSecondary }]}>
              PATIENT CODE
            </Text>
            <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              <View
                style={[
                  styles.codeRow,
                  { backgroundColor: codeRowBg, borderColor: fieldBorder },
                ]}
              >
                <Ionicons name="card-outline" size={18} color={textMuted} style={styles.fieldIcon} />
                <Text style={[styles.codeText, { color: textPrimary }]} numberOfLines={1}>
                  {code ? localizeNumber(code) : '—'}
                </Text>
                <Pressable
                  onPress={handleCopyCode}
                  hitSlop={8}
                  disabled={!code || changingCode}
                  style={({ pressed }) => [styles.copyBtn, pressed && { opacity: 0.6 }]}
                >
                  <Ionicons
                    name={copied ? 'checkmark-outline' : 'copy-outline'}
                    size={16}
                    color={copied ? '#10B981' : ACCENT}
                  />
                </Pressable>
                <Pressable
                  onPress={handleChangeCode}
                  hitSlop={8}
                  disabled={changingCode}
                  style={({ pressed }) => [
                    styles.changeCodeBtn,
                    {
                      backgroundColor: isDark ? 'rgba(61,158,255,0.18)' : 'rgba(61,158,255,0.12)',
                      borderColor: ACCENT,
                      opacity: pressed && !changingCode ? 0.7 : 1,
                    },
                  ]}
                >
                  {changingCode ? (
                    <ActivityIndicator size="small" color={ACCENT} />
                  ) : (
                    <>
                      <Ionicons name="refresh-outline" size={12} color={ACCENT} />
                      <Text style={[styles.changeCodeText, { color: ACCENT }]}>Change</Text>
                    </>
                  )}
                </Pressable>
              </View>
            </View>

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
                    editable={!saving}
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
                    editable={!saving}
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
                    editable={!saving}
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
                  disabled={saving}
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

              {/* Gender */}
              <View style={styles.fieldBlock}>
                <Text style={[styles.fieldLabel, { color: textSecondary }]}>
                  {t('createPatient.gender')}
                </Text>
                <View style={[styles.segment, { backgroundColor: segmentBg, borderColor: segmentBorder }]}>
                  <SegmentButton
                    label={t('createPatient.male')}
                    active={gender === 'male'}
                    onPress={() => setGender('male')}
                    disabled={saving}
                    textMuted={textMuted}
                  />
                  <SegmentButton
                    label={t('createPatient.female')}
                    active={gender === 'female'}
                    onPress={() => setGender('female')}
                    disabled={saving}
                    textMuted={textMuted}
                  />
                  <SegmentButton
                    label={t('createPatient.other')}
                    active={gender === 'other'}
                    onPress={() => setGender('other')}
                    disabled={saving}
                    textMuted={textMuted}
                  />
                </View>
              </View>

              {/* Address */}
              <View style={styles.fieldBlock}>
                <Text style={[styles.fieldLabel, { color: textSecondary }]}>Address</Text>
                <View style={[styles.field, { backgroundColor: fieldBg, borderColor: fieldBorder }]}>
                  <Ionicons name="location-outline" size={18} color={textMuted} style={styles.fieldIcon} />
                  <TextInput
                    value={address}
                    onChangeText={setAddress}
                    placeholder="Street, city"
                    placeholderTextColor={textMuted}
                    editable={!saving}
                    style={[
                      styles.fieldInput,
                      { color: textPrimary },
                      isRTL && { textAlign: 'right', writingDirection: 'rtl' },
                    ]}
                  />
                </View>
              </View>

              {/* Occupation */}
              <View style={[styles.fieldBlock, { marginBottom: 0 }]}>
                <Text style={[styles.fieldLabel, { color: textSecondary }]}>Occupation</Text>
                <View style={[styles.field, { backgroundColor: fieldBg, borderColor: fieldBorder }]}>
                  <Ionicons name="briefcase-outline" size={18} color={textMuted} style={styles.fieldIcon} />
                  <TextInput
                    value={occupation}
                    onChangeText={setOccupation}
                    placeholder="e.g. Teacher"
                    placeholderTextColor={textMuted}
                    editable={!saving}
                    style={[
                      styles.fieldInput,
                      { color: textPrimary },
                      isRTL && { textAlign: 'right', writingDirection: 'rtl' },
                    ]}
                  />
                </View>
              </View>
            </View>

            {/* MEDICAL INFORMATION */}
            <Text style={[styles.eyebrow, { color: textSecondary }]}>
              MEDICAL INFORMATION
            </Text>
            <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              {/* Height + Weight */}
              <View style={styles.twoCol}>
                <View style={styles.twoColItem}>
                  <Text style={[styles.fieldLabel, styles.twoColLabel, { color: textSecondary }]}>
                    Height (cm)
                  </Text>
                  <View style={[styles.field, { backgroundColor: fieldBg, borderColor: fieldBorder }]}>
                    <Ionicons name="resize-outline" size={18} color={textMuted} style={styles.fieldIcon} />
                    <TextInput
                      value={height}
                      onChangeText={setHeight}
                      placeholder="e.g. 170"
                      placeholderTextColor={textMuted}
                      keyboardType="numeric"
                      editable={!saving}
                      style={[styles.fieldInput, { color: textPrimary, textAlign: 'left', writingDirection: 'ltr' }]}
                    />
                  </View>
                </View>
                <View style={styles.twoColItem}>
                  <Text style={[styles.fieldLabel, styles.twoColLabel, { color: textSecondary }]}>
                    Weight (kg)
                  </Text>
                  <View style={[styles.field, { backgroundColor: fieldBg, borderColor: fieldBorder }]}>
                    <Ionicons name="barbell-outline" size={18} color={textMuted} style={styles.fieldIcon} />
                    <TextInput
                      value={weight}
                      onChangeText={setWeight}
                      placeholder="e.g. 65"
                      placeholderTextColor={textMuted}
                      keyboardType="numeric"
                      editable={!saving}
                      style={[styles.fieldInput, { color: textPrimary, textAlign: 'left', writingDirection: 'ltr' }]}
                    />
                  </View>
                </View>
              </View>

              {/* Blood type */}
              <View style={[styles.fieldBlock, { marginTop: 14 }]}>
                <Text style={[styles.fieldLabel, { color: textSecondary }]}>Blood type</Text>
                <View style={styles.bloodChips}>
                  {(['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'] as const).map((bt) => (
                    <BloodChip
                      key={bt}
                      label={bt}
                      active={bloodType === bt}
                      onPress={() => setBloodType(bloodType === bt ? null : bt)}
                      disabled={saving}
                      fieldBg={fieldBg}
                      fieldBorder={fieldBorder}
                      textMuted={textMuted}
                    />
                  ))}
                </View>
              </View>

              {/* Medication */}
              <View style={[styles.toggleRow, { marginTop: 14 }]}>
                <Text style={[styles.toggleLabel, { color: textPrimary }]}>
                  {t('createPatient.regularMedication')}
                </Text>
                <YesNoPill
                  value={hasRegularMedication}
                  onChange={setHasRegularMedication}
                  disabled={saving}
                  yes={t('common.yes')}
                  no={t('common.no')}
                  segmentBg={segmentBg}
                  segmentBorder={segmentBorder}
                  textMuted={textMuted}
                />
              </View>
              {hasRegularMedication && (
                <View style={{ marginTop: 14 }}>
                  <View style={[styles.field, styles.fieldTextarea, { backgroundColor: fieldBg, borderColor: fieldBorder }]}>
                    <Ionicons name="medkit-outline" size={18} color={textMuted} style={[styles.fieldIcon, styles.fieldIconTop]} />
                    <TextInput
                      value={regularMedicationDetails}
                      onChangeText={setRegularMedicationDetails}
                      placeholder={t('createPatient.medicationDetails')}
                      placeholderTextColor={textMuted}
                      multiline
                      editable={!saving}
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
                  disabled={saving}
                  yes={t('common.yes')}
                  no={t('common.no')}
                  segmentBg={segmentBg}
                  segmentBorder={segmentBorder}
                  textMuted={textMuted}
                />
              </View>
              {hasAllergy && (
                <View style={{ marginTop: 14 }}>
                  <View style={[styles.field, styles.fieldTextarea, { backgroundColor: fieldBg, borderColor: fieldBorder }]}>
                    <Ionicons name="alert-circle-outline" size={18} color={textMuted} style={[styles.fieldIcon, styles.fieldIconTop]} />
                    <TextInput
                      value={allergyDetails}
                      onChangeText={setAllergyDetails}
                      placeholder={t('createPatient.allergyDetails')}
                      placeholderTextColor={textMuted}
                      multiline
                      editable={!saving}
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

              {/* Chronic */}
              <View style={[styles.toggleRow, { marginTop: 14 }]}>
                <Text style={[styles.toggleLabel, { color: textPrimary }]}>
                  Has chronic conditions?
                </Text>
                <YesNoPill
                  value={hasChronicConditions}
                  onChange={setHasChronicConditions}
                  disabled={saving}
                  yes={t('common.yes')}
                  no={t('common.no')}
                  segmentBg={segmentBg}
                  segmentBorder={segmentBorder}
                  textMuted={textMuted}
                />
              </View>
              {hasChronicConditions && (
                <View style={{ marginTop: 14 }}>
                  <View style={[styles.field, styles.fieldTextarea, { backgroundColor: fieldBg, borderColor: fieldBorder }]}>
                    <Ionicons name="pulse-outline" size={18} color={textMuted} style={[styles.fieldIcon, styles.fieldIconTop]} />
                    <TextInput
                      value={chronicConditionsDetails}
                      onChangeText={setChronicConditionsDetails}
                      placeholder="Chronic conditions details"
                      placeholderTextColor={textMuted}
                      multiline
                      editable={!saving}
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

              {/* Pregnancy — female only */}
              {gender === 'female' && (
                <View style={[styles.toggleRow, { marginTop: 14 }]}>
                  <Text style={[styles.toggleLabel, { color: textPrimary }]}>
                    Currently pregnant?
                  </Text>
                  <YesNoPill
                    value={isPregnant}
                    onChange={setIsPregnant}
                    disabled={saving}
                    yes={t('common.yes')}
                    no={t('common.no')}
                    segmentBg={segmentBg}
                    segmentBorder={segmentBorder}
                    textMuted={textMuted}
                  />
                </View>
              )}
            </View>

            {/* EMERGENCY CONTACT */}
            <Text style={[styles.eyebrow, { color: textSecondary }]}>
              EMERGENCY CONTACT
            </Text>
            <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              <View style={styles.fieldBlock}>
                <Text style={[styles.fieldLabel, { color: textSecondary }]}>Contact name</Text>
                <View style={[styles.field, { backgroundColor: fieldBg, borderColor: fieldBorder }]}>
                  <Ionicons name="person-outline" size={18} color={textMuted} style={styles.fieldIcon} />
                  <TextInput
                    value={emergencyContactName}
                    onChangeText={setEmergencyContactName}
                    placeholder="Full name"
                    placeholderTextColor={textMuted}
                    editable={!saving}
                    style={[
                      styles.fieldInput,
                      { color: textPrimary },
                      isRTL && { textAlign: 'right', writingDirection: 'rtl' },
                    ]}
                  />
                </View>
              </View>
              <View style={styles.fieldBlock}>
                <Text style={[styles.fieldLabel, { color: textSecondary }]}>Relationship</Text>
                <View style={[styles.field, { backgroundColor: fieldBg, borderColor: fieldBorder }]}>
                  <Ionicons name="people-outline" size={18} color={textMuted} style={styles.fieldIcon} />
                  <TextInput
                    value={emergencyContactRelationship}
                    onChangeText={setEmergencyContactRelationship}
                    placeholder="e.g. Spouse"
                    placeholderTextColor={textMuted}
                    editable={!saving}
                    style={[
                      styles.fieldInput,
                      { color: textPrimary },
                      isRTL && { textAlign: 'right', writingDirection: 'rtl' },
                    ]}
                  />
                </View>
              </View>
              <View style={[styles.fieldBlock, { marginBottom: 0 }]}>
                <Text style={[styles.fieldLabel, { color: textSecondary }]}>Phone</Text>
                <View style={[styles.field, { backgroundColor: fieldBg, borderColor: fieldBorder }]}>
                  <Ionicons name="call-outline" size={18} color={textMuted} style={styles.fieldIcon} />
                  <TextInput
                    value={emergencyContactPhone}
                    onChangeText={setEmergencyContactPhone}
                    placeholder="Phone"
                    placeholderTextColor={textMuted}
                    keyboardType="phone-pad"
                    editable={!saving}
                    style={[styles.fieldInput, { color: textPrimary, textAlign: 'left', writingDirection: 'ltr' }]}
                  />
                </View>
              </View>
            </View>

            {/* HOW THEY FOUND US */}
            <Text style={[styles.eyebrow, { color: textSecondary }]}>HOW THEY FOUND US</Text>
            <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              <View style={[styles.fieldBlock, { marginBottom: 0 }]}>
                <Text style={[styles.fieldLabel, { color: textSecondary }]}>Referral source</Text>
                <View style={[styles.field, { backgroundColor: fieldBg, borderColor: fieldBorder }]}>
                  <Ionicons name="megaphone-outline" size={18} color={textMuted} style={styles.fieldIcon} />
                  <TextInput
                    value={referralSource}
                    onChangeText={setReferralSource}
                    placeholder="Instagram, friend, Google…"
                    placeholderTextColor={textMuted}
                    editable={!saving}
                    style={[
                      styles.fieldInput,
                      { color: textPrimary },
                      isRTL && { textAlign: 'right', writingDirection: 'rtl' },
                    ]}
                  />
                </View>
              </View>
            </View>

            {/* INSURANCE (optional) */}
            <View style={styles.eyebrowRow}>
              <Text style={[styles.eyebrow, { color: textSecondary, marginTop: 0, marginBottom: 0 }]}>
                INSURANCE
              </Text>
              <View
                style={[
                  styles.optionalBadge,
                  {
                    backgroundColor: isDark ? 'rgba(20,184,166,0.20)' : 'rgba(20,184,166,0.14)',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.optionalBadgeText,
                    { color: isDark ? '#2DD4BF' : '#0E9384' },
                  ]}
                >
                  OPTIONAL
                </Text>
              </View>
            </View>
            <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              <View style={styles.fieldBlock}>
                <Text style={[styles.fieldLabel, { color: textSecondary }]}>Insurance provider</Text>
                <View style={[styles.field, { backgroundColor: fieldBg, borderColor: fieldBorder }]}>
                  <Ionicons name="shield-checkmark-outline" size={18} color={textMuted} style={styles.fieldIcon} />
                  <TextInput
                    value={insuranceProvider}
                    onChangeText={setInsuranceProvider}
                    placeholder="Company name (leave empty if none)"
                    placeholderTextColor={textMuted}
                    editable={!saving}
                    style={[
                      styles.fieldInput,
                      { color: textPrimary },
                      isRTL && { textAlign: 'right', writingDirection: 'rtl' },
                    ]}
                  />
                </View>
              </View>
              <View style={[styles.fieldBlock, { marginBottom: 0 }]}>
                <Text style={[styles.fieldLabel, { color: textSecondary }]}>Policy / member number</Text>
                <View style={[styles.field, { backgroundColor: fieldBg, borderColor: fieldBorder }]}>
                  <Ionicons name="card-outline" size={18} color={textMuted} style={styles.fieldIcon} />
                  <TextInput
                    value={insurancePolicyNumber}
                    onChangeText={setInsurancePolicyNumber}
                    placeholder="Policy or membership no."
                    placeholderTextColor={textMuted}
                    editable={!saving}
                    style={[
                      styles.fieldInput,
                      { color: textPrimary },
                      isRTL && { textAlign: 'right', writingDirection: 'rtl' },
                    ]}
                  />
                </View>
              </View>
            </View>

            {/* ADDITIONAL NOTES */}
            <Text style={[styles.eyebrow, { color: textSecondary }]}>ADDITIONAL NOTES</Text>
            <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              <View style={[styles.field, styles.fieldTextarea, { backgroundColor: fieldBg, borderColor: fieldBorder }]}>
                <Ionicons name="document-text-outline" size={18} color={textMuted} style={[styles.fieldIcon, styles.fieldIconTop]} />
                <TextInput
                  value={notes}
                  onChangeText={setNotes}
                  placeholder={t('createPatient.notes')}
                  placeholderTextColor={textMuted}
                  multiline
                  editable={!saving}
                  style={[
                    styles.fieldInput,
                    styles.fieldInputMultiline,
                    { color: textPrimary },
                    isRTL && { textAlign: 'right', writingDirection: 'rtl' },
                  ]}
                />
              </View>
            </View>

            {/* Save */}
            <Pressable
              onPress={onSubmit}
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
                  <Text style={styles.primaryBtnText}>
                    {t('common.saveChanges', { defaultValue: 'Save Changes' })}
                  </Text>
                )}
              </LinearGradient>
            </Pressable>

            {/* DANGER ZONE */}
            <Text style={[styles.eyebrow, styles.dangerEyebrow]}>DANGER ZONE</Text>
            <View
              style={[
                styles.dangerCard,
                {
                  backgroundColor: isDark ? 'rgba(239,68,68,0.08)' : 'rgba(239,68,68,0.06)',
                  borderColor: isDark ? 'rgba(239,68,68,0.35)' : 'rgba(239,68,68,0.30)',
                },
              ]}
            >
              <Text style={[styles.dangerDesc, { color: textSecondary }]}>
                {t('patient.removeMessage', {
                  defaultValue:
                    "This patient will be hidden from your clinic's lists. Their records will not be shown anywhere in the app. You can ask support to restore them later.",
                })}
              </Text>
              <Pressable
                onPress={handleRemove}
                disabled={archiving || saving}
                style={({ pressed }) => [
                  styles.dangerBtn,
                  {
                    backgroundColor: isDark ? 'rgba(239,68,68,0.18)' : 'rgba(239,68,68,0.12)',
                    borderColor: '#EF4444',
                    opacity: archiving || saving ? 0.6 : pressed ? 0.85 : 1,
                  },
                ]}
              >
                {archiving ? (
                  <ActivityIndicator color="#EF4444" />
                ) : (
                  <>
                    <Ionicons name="trash-outline" size={18} color="#EF4444" />
                    <Text style={styles.dangerBtnText}>
                      {t('patient.remove', { defaultValue: 'Remove Patient' })}
                    </Text>
                  </>
                )}
              </Pressable>
            </View>
          </ScrollView>
        )}
      </KeyboardAvoidingView>
    </View>
  );
}

function SegmentButton({
  label, active, onPress, disabled, textMuted,
}: {
  label: string; active: boolean; onPress: () => void; disabled: boolean; textMuted: string;
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
  value, onChange, disabled, yes, no, segmentBg, segmentBorder, textMuted,
}: {
  value: boolean; onChange: (v: boolean) => void; disabled: boolean;
  yes: string; no: string; segmentBg: string; segmentBorder: string; textMuted: string;
}) {
  return (
    <View style={[styles.yesNoPill, { backgroundColor: segmentBg, borderColor: segmentBorder }]}>
      <YesNoSeg label={yes} active={value === true} onPress={() => onChange(true)} disabled={disabled} textMuted={textMuted} />
      <YesNoSeg label={no} active={value === false} onPress={() => onChange(false)} disabled={disabled} textMuted={textMuted} />
    </View>
  );
}

function YesNoSeg({
  label, active, onPress, disabled, textMuted,
}: {
  label: string; active: boolean; onPress: () => void; disabled: boolean; textMuted: string;
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

function BloodChip({
  label, active, onPress, disabled, fieldBg, fieldBorder, textMuted,
}: {
  label: string; active: boolean; onPress: () => void; disabled: boolean;
  fieldBg: string; fieldBorder: string; textMuted: string;
}) {
  if (active) {
    return (
      <Pressable onPress={onPress} disabled={disabled} style={styles.bloodChip}>
        <LinearGradient
          colors={[ACCENT_LIGHT, ACCENT_DARK] as any}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.bloodChipActiveFill}
        >
          <Text style={styles.bloodChipTextActive}>{label}</Text>
        </LinearGradient>
      </Pressable>
    );
  }
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[styles.bloodChip, styles.bloodChipInactive, { backgroundColor: fieldBg, borderColor: fieldBorder }]}
    >
      <Text style={[styles.bloodChipText, { color: textMuted }]}>{label}</Text>
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
  headerLocked: { opacity: 0.5 },
  headerText: { flex: 1 },
  headerTitle: { fontSize: 21, fontWeight: '800', marginBottom: 2 },
  headerSubtitle: { fontSize: 12.5 },
  lockBadge: {
    position: 'absolute',
    top: -3,
    right: -3,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(91,107,130,0.95)',
    borderWidth: 1,
    borderColor: 'rgba(18,24,46,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

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
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    marginBottom: 8,
  },
  optionalBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  optionalBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.6,
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

  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 13,
    height: 50,
    gap: 6,
  },
  codeText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  copyBtn: {
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  lockedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(91,107,130,0.18)',
  },
  lockedPillText: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  changeCodeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    minWidth: 72,
    justifyContent: 'center',
  },
  changeCodeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.4,
  },

  fieldBlock: { marginBottom: 14 },
  labelRow: { flexDirection: 'row', alignItems: 'center' },
  fieldLabel: { fontSize: 12, fontWeight: '700', marginBottom: 6 },
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

  twoCol: { flexDirection: 'row', gap: 10 },
  twoColItem: { flex: 1 },
  twoColLabel: {},

  bloodChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  bloodChip: {
    minWidth: 56,
    height: 36,
    borderRadius: 10,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  bloodChipInactive: { borderWidth: 1 },
  bloodChipActiveFill: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  bloodChipText: { fontSize: 13, fontWeight: '700' },
  bloodChipTextActive: { fontSize: 13, fontWeight: '800', color: '#FFFFFF' },

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

  dangerEyebrow: { color: '#EF4444' },
  dangerCard: {
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  dangerDesc: {
    fontSize: 12.5,
    lineHeight: 18,
  },
  dangerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 12,
  },
  dangerBtnText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});
