import { usePatientGuard } from '@/src/utils/navigationGuards';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Image, KeyboardAvoidingView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function PatientCreate() {
  usePatientGuard();
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | ''>('');
  const [hasMeds, setHasMeds] = useState<boolean>(false);
  const [medsDetails, setMedsDetails] = useState('');
  const [hasAllergy, setHasAllergy] = useState<boolean>(false);
  const [allergyDetails, setAllergyDetails] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const { t } = useTranslation();

  const pickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7 });
    if (!result.canceled) {
      const uri = result.assets?.[0]?.uri ?? null;
      setPhotoUri(uri);
    }
  };

  const takePhoto = async () => {
    const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
    if (!result.canceled) {
      const uri = result.assets?.[0]?.uri ?? null;
      setPhotoUri(uri);
    }
  };

  const save = () => {
    if (!name) { Alert.alert(t('common.validation'), t('patient.validationError')); return; }
    
    // TODO: Save to Firestore instead of just showing alert
    // - Use src/services/patientService.ts createPatient(clinicId, patientData)
    // - Upload photo to Firebase Storage if photoUri exists
    // - Show success message and navigate to patient list
    // - Remove placeholder alert below
    
    Alert.alert(t('patient.savedLocallyTitle', { defaultValue: t('patient.savedLocally') }), t('patient.savedLocally'));
  };

  return (
    <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>{t('patient.createPatient')}</Text>
        <TextInput style={styles.input} placeholder={t('patient.namePlaceholder')} value={name} onChangeText={setName} />
        <TextInput style={styles.input} placeholder={t('patient.agePlaceholder')} keyboardType="numeric" value={age} onChangeText={setAge} />

        <View style={styles.row}>
          <TouchableOpacity style={[styles.toggle, gender === 'male' && styles.toggleActive]} onPress={() => setGender('male')}>
            <Text style={styles.toggleText}>{t('patient.male')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.toggle, gender === 'female' && styles.toggleActive]} onPress={() => setGender('female')}>
            <Text style={styles.toggleText}>{t('patient.female')}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('patient.medication')}</Text>
          <View style={styles.row}>
            <TouchableOpacity style={[styles.toggle, hasMeds && styles.toggleActive]} onPress={() => setHasMeds(true)}>
              <Text style={styles.toggleText}>{t('patient.medicationYes')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.toggle, !hasMeds && styles.toggleActive]} onPress={() => setHasMeds(false)}>
              <Text style={styles.toggleText}>{t('patient.medicationNo')}</Text>
            </TouchableOpacity>
          </View>
          {hasMeds && (
            <TextInput style={styles.input} placeholder={t('patient.medicationDetailsPlaceholder')} value={medsDetails} onChangeText={setMedsDetails} />
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('patient.allergy')}</Text>
          <View style={styles.row}>
            <TouchableOpacity style={[styles.toggle, hasAllergy && styles.toggleActive]} onPress={() => setHasAllergy(true)}>
              <Text style={styles.toggleText}>{t('patient.allergyYes')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.toggle, !hasAllergy && styles.toggleActive]} onPress={() => setHasAllergy(false)}>
              <Text style={styles.toggleText}>{t('patient.allergyNo')}</Text>
            </TouchableOpacity>
          </View>
          {hasAllergy && (
            <TextInput style={styles.input} placeholder={t('patient.allergyDetailsPlaceholder')} value={allergyDetails} onChangeText={setAllergyDetails} />
          )}
        </View>

        <Text style={styles.sectionTitle}>{t('patient.photos')}</Text>
        <View style={styles.row}>
          <TouchableOpacity style={styles.photoBox} onPress={pickPhoto}>
            <Text>{t('patient.photoButton')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.photoBox} onPress={takePhoto}>
            <Text>{t('patient.cameraButton')}</Text>
          </TouchableOpacity>
        </View>
        {photoUri && <Image source={{ uri: photoUri }} style={styles.preview} />}

        <TouchableOpacity style={styles.saveBtn} onPress={save}><Text style={styles.saveBtnText}>{t('patient.save')}</Text></TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 12 },
  input: { borderWidth: 1, borderColor: '#ddd', padding: 10, borderRadius: 8, marginBottom: 10 },
  row: { flexDirection: 'row', gap: 10, alignItems: 'center', marginBottom: 10 },
  toggle: { paddingVertical: 10, paddingHorizontal: 16, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, backgroundColor: '#fff' },
  toggleText: { fontWeight: '600' },
  toggleActive: { backgroundColor: '#E8F1FF', borderColor: '#2E8BFD' },
  section: { marginTop: 8, marginBottom: 8 },
  sectionTitle: { fontWeight: '700', marginBottom: 6 },
  photoBox: { flex: 1, padding: 20, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, alignItems: 'center', backgroundColor: '#fff' },
  preview: { width: '100%', height: 180, marginTop: 10, borderRadius: 8 },
  saveBtn: { backgroundColor: '#1B3C73', padding: 14, borderRadius: 10, alignItems: 'center', marginTop: 12 },
  saveBtnText: { color: '#fff', fontWeight: '700' },
});
