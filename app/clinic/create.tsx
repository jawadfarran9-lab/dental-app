import { db } from '@/firebaseConfig';
import i18n from '@/i18n';
import { useClinic } from '@/src/context/ClinicContext';
import { useTheme } from '@/src/context/ThemeContext';
import { generateUniquePatientCode, reservePatientCode } from '@/src/services/patientCodeService';
import { useClinicGuard } from '@/src/utils/navigationGuards';
import { localizeNumber } from '@/utils/localization';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Stack, useRouter } from 'expo-router';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * CREATE PATIENT - FIRESTORE ONLY
 * 
 * Simple code generation and Firestore write
 */

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
    // Redirect if not authenticated
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
      // Generate strong unique patient code
      const code = await generateUniquePatientCode();

      // Create patient document in nested clinics/{clinicId}/patients
      const patientRef = await addDoc(collection(db, 'clinics', clinicId, 'patients'), {
        clinicId,
        code,
        name,
        phone: phone || null,
        email: email || null,
        notes: notes || null,
        dateOfBirth: dateOfBirth ? dateOfBirth.toISOString().split('T')[0] : null, // Store as YYYY-MM-DD
        gender,
        hasRegularMedication,
        regularMedicationDetails: hasRegularMedication ? regularMedicationDetails : null,
        hasAllergy,
        allergyDetails: hasAllergy ? allergyDetails : null,
        createdAt: serverTimestamp(),
      });

      // Reserve the code in the top-level patientCodes lookup
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

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
      >
        {/* Header with back button */}
        <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <Pressable
            onPress={handleBack}
            style={({ pressed }) => [
              styles.backButton,
              {
                backgroundColor: pressed
                  ? isDark
                    ? 'rgba(255, 255, 255, 0.15)'
                    : 'rgba(27, 37, 66, 0.1)'
                  : isDark
                    ? 'rgba(255, 255, 255, 0.08)'
                    : 'rgba(255, 255, 255, 0.92)',
              },
            ]}
          >
            <Ionicons
              name="chevron-back"
              size={22}
              color={isDark ? '#FFFFFF' : '#1B2542'}
            />
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>{t('createPatient.title')}</Text>

        <TextInput 
        placeholder={t('createPatient.name')} 
        style={[styles.input, isRTL && { textAlign: 'right', writingDirection: 'rtl' }]} 
        value={name} 
        onChangeText={setName} 
        editable={!loading} 
      />
      <TextInput 
        placeholder={t('createPatient.phone')} 
        style={[styles.input, { textAlign: 'left', writingDirection: 'ltr' }]} 
        value={phone} 
        onChangeText={setPhone} 
        keyboardType="phone-pad" 
        editable={!loading} 
      />
      <TextInput 
        placeholder={t('createPatient.email')} 
        style={[styles.input, { textAlign: 'left', writingDirection: 'ltr' }]} 
        value={email} 
        onChangeText={setEmail} 
        keyboardType="email-address" 
        editable={!loading}
        autoCapitalize="none"
      />
      
      {/* Date of Birth Picker */}
      <TouchableOpacity 
        style={[styles.input, styles.datePickerButton]} 
        onPress={() => setShowDatePicker(true)}
        disabled={loading}
      >
        <Text style={[dateOfBirth ? styles.dateText : styles.dateTextPlaceholder]}>
          {dateOfBirth 
            ? dateOfBirth.toLocaleDateString(i18n.language, { year: 'numeric', month: 'long', day: 'numeric' })
            : t('createPatient.dateOfBirth')}
        </Text>
      </TouchableOpacity>
      
      {showDatePicker && (
        <DateTimePicker
          value={dateOfBirth || new Date(2000, 0, 1)}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, selectedDate) => {
            setShowDatePicker(Platform.OS === 'ios');
            if (selectedDate) {
              setDateOfBirth(selectedDate);
            }
          }}
          maximumDate={new Date()}
        />
      )}
      
      <View style={styles.genderContainer}>
        <Text style={styles.label}>{t('createPatient.gender')}:</Text>
        <View style={styles.genderButtons}>
          <TouchableOpacity 
            style={[styles.genderBtn, gender === 'male' && styles.genderBtnActive]} 
            onPress={() => setGender('male')}
            disabled={loading}
          >
            <Text style={[styles.genderBtnText, gender === 'male' && styles.genderBtnTextActive]}>{t('createPatient.male')}</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.genderBtn, gender === 'female' && styles.genderBtnActive]} 
            onPress={() => setGender('female')}
            disabled={loading}
          >
            <Text style={[styles.genderBtnText, gender === 'female' && styles.genderBtnTextActive]}>{t('createPatient.female')}</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.genderBtn, gender === 'other' && styles.genderBtnActive]} 
            onPress={() => setGender('other')}
            disabled={loading}
          >
            <Text style={[styles.genderBtnText, gender === 'other' && styles.genderBtnTextActive]}>{t('createPatient.other')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.toggleContainer}>
        <Text style={styles.label}>{t('createPatient.regularMedication')}</Text>
        <TouchableOpacity 
          style={[styles.toggleBtn, hasRegularMedication && styles.toggleBtnActive]} 
          onPress={() => setHasRegularMedication(!hasRegularMedication)}
          disabled={loading}
        >
          <Text style={styles.toggleBtnText}>{hasRegularMedication ? t('common.yes') : t('common.no')}</Text>
        </TouchableOpacity>
      </View>
      
      {hasRegularMedication && (
        <TextInput 
          placeholder={t('createPatient.medicationDetails')} 
          style={[styles.input, styles.textArea, isRTL && { textAlign: 'right', writingDirection: 'rtl' }]} 
          value={regularMedicationDetails} 
          onChangeText={setRegularMedicationDetails} 
          multiline 
          editable={!loading} 
        />
      )}

      <View style={styles.toggleContainer}>
        <Text style={styles.label}>{t('createPatient.hasAllergy')}</Text>
        <TouchableOpacity 
          style={[styles.toggleBtn, hasAllergy && styles.toggleBtnActive]} 
          onPress={() => setHasAllergy(!hasAllergy)}
          disabled={loading}
        >
          <Text style={styles.toggleBtnText}>{hasAllergy ? t('common.yes') : t('common.no')}</Text>
        </TouchableOpacity>
      </View>
      
      {hasAllergy && (
        <TextInput 
          placeholder={t('createPatient.allergyDetails')} 
          style={[styles.input, styles.textArea, isRTL && { textAlign: 'right', writingDirection: 'rtl' }]} 
          value={allergyDetails} 
          onChangeText={setAllergyDetails} 
          multiline 
          editable={!loading} 
        />
      )}

      <TextInput 
        placeholder={t('createPatient.notes')} 
        style={[styles.input, styles.textArea, isRTL && { textAlign: 'right', writingDirection: 'rtl' }]} 
        value={notes} 
        onChangeText={setNotes} 
        multiline 
        editable={!loading} 
      />

      <TouchableOpacity style={styles.saveButton} onPress={onSubmit} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>{t('createPatient.create')}</Text>}
      </TouchableOpacity>
      </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 16 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 12 },
  input: { borderWidth: 1, borderColor: '#ddd', padding: 10, borderRadius: 8, marginBottom: 10, backgroundColor: '#fff' },
  textArea: { minHeight: 200, textAlignVertical: 'top' },
  datePickerButton: { justifyContent: 'center' },
  dateText: { fontSize: 16, color: '#000' },
  dateTextPlaceholder: { fontSize: 16, color: '#999' },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 6, color: '#333' },
  genderContainer: { marginBottom: 12 },
  genderButtons: { flexDirection: 'row', gap: 8 },
  genderBtn: { flex: 1, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, borderColor: '#ddd', alignItems: 'center', backgroundColor: '#fff' },
  genderBtnActive: { backgroundColor: '#D4AF37', borderColor: '#D4AF37' },
  genderBtnText: { color: '#666', fontWeight: '600' },
  genderBtnTextActive: { color: '#fff' },
  toggleContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  toggleBtn: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8, borderWidth: 1, borderColor: '#ddd', backgroundColor: '#fff' },
  toggleBtnActive: { backgroundColor: '#4CAF50', borderColor: '#4CAF50' },
  toggleBtnText: { color: '#333', fontWeight: '600' },
  saveButton: { backgroundColor: '#D4AF37', paddingVertical: 14, borderRadius: 8, alignItems: 'center', marginTop: 8 },
  saveText: { color: '#fff', fontWeight: '700', fontSize: 16 },
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
});
