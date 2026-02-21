import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/firebaseConfig';
import DentalCover from '../components/DentalCover';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/src/context/ThemeContext';
import { useAuth } from '@/src/context/AuthContext';
import { usePatientGuard } from '@/src/utils/navigationGuards';

/**
 * PATIENT LOGIN - FIRESTORE ONLY
 * 
 * Queries Firestore for patient by code
 * 
 * PHASE F: Uses AuthContext to update global auth state
 * Prevents clinic users from accessing this page
 */

export default function PatientLogin() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { setPatientAuth } = useAuth();

  // PHASE F: Guard - prevent clinic users from accessing patient pages
  usePatientGuard();

  // Clear code input when navigating back
  useFocusEffect(
    React.useCallback(() => {
      return () => {
        setCode('');
      };
    }, [])
  );

  const onLogin = async () => {
    const trimmed = code.trim();
    if (!trimmed) return Alert.alert(t('common.validation'), t('patient.enterCode'));

    setLoading(true);
    try {
      // Query Firestore for patient with this code (as string)
      const q = query(collection(db, 'patients'), where('code', '==', trimmed));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        Alert.alert(t('common.error'), t('patient.codeNotFound'));
        setLoading(false);
        return;
      }

      // Get the first (should be only) matching patient
      const patientDoc = snapshot.docs[0];
      const patientId = patientDoc.id;


      // PHASE F: Update global auth state via AuthContext
      // This will store patientId and clear clinicId
      await setPatientAuth(patientId);

      // Navigate to patient detail screen
      router.push(`/patient/${patientId}` as any);
      setLoading(false);
    } catch (err: any) {
      console.error('patient login error', err);
      Alert.alert(t('common.error'), err.message || t('common.error'));
      setLoading(false);
    }
  };

  const goToHome = () => router.replace('/');

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <DentalCover />

      <View style={styles.content}>
        <Text style={styles.title}>{t('patient.login')}</Text>
        <Text style={styles.subtitle}>{t('patient.enterCode')}</Text>
        <TextInput 
          style={[styles.input, { textAlign: 'left', writingDirection: 'ltr' }]} 
          placeholder={t('patient.code')} 
          keyboardType="numeric" 
          value={code} 
          onChangeText={setCode} 
          editable={!loading}
          placeholderTextColor="#999"
        />
        <TouchableOpacity 
          style={[styles.btn, loading && styles.btnDisabled, { backgroundColor: colors.buttonBackground }]} 
          onPress={onLogin} 
          disabled={loading}
        >
          {loading ? <ActivityIndicator color={colors.buttonText} /> : <Text style={[styles.btnText, { color: colors.buttonText }]}>{t('auth.login')}</Text>}
        </TouchableOpacity>
        <TouchableOpacity onPress={goToHome} disabled={loading}>
          <Text style={[styles.backBtn, { color: colors.buttonBackground }]}>← {t('common.backToHome')}</Text>
        </TouchableOpacity>
      </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#f5f7fb' },
  content: { padding: 20 },
  title: { fontSize: 28, fontWeight: '700', marginBottom: 8, color: '#1B3C73', textAlign: 'center' },
  subtitle: { fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 30 },
  input: { borderWidth: 1, borderColor: '#ddd', padding: 14, borderRadius: 8, marginBottom: 16, backgroundColor: '#fff', fontSize: 16 },
  btn: { backgroundColor: '#D4AF37', padding: 14, borderRadius: 8, alignItems: 'center', marginBottom: 16 },
  btnDisabled: { opacity: 0.7 },
  btnText: { color: '#000', fontWeight: '700', fontSize: 16 },
  backBtn: { color: '#D4AF37', textAlign: 'center', fontWeight: '600', fontSize: 14, marginTop: 16 },
});
