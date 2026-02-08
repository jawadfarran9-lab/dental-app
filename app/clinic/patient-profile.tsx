import { useClinicGuard } from '@/src/utils/navigationGuards';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function PatientProfile() {
  useClinicGuard();
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { t } = useTranslation();

  // TODO: Replace with real Firestore patient data
  // - Fetch from src/services/patientService.ts getPatient(clinicId, patientId)
  // - Display actual patient info (name, code, dob, phone, gender, etc.)
  // - Remove mock hardcoded data below

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('patients.profile') || 'Patient Profile'}</Text>
        <Text style={styles.sub}>{t('patients.basicInfo') || 'Basic information and quick actions'}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>{t('clinic.name') || 'Name'}</Text>
        <Text style={styles.value}>Mock Patient ({String(id) || '—'})</Text>

        <Text style={[styles.label, { marginTop: 12 }]}>{t('patients.code') || 'Code'}</Text>
        <Text style={styles.value}>12345</Text>

        <Text style={[styles.label, { marginTop: 12 }]}>{t('clinic.gender') || 'Gender'}</Text>
        <Text style={styles.value}>{t('clinic.male') || 'Male'}</Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => router.push(`/clinic/${id}?tab=timeline`)}>
          <Text style={styles.actionText}>{t('tabs.timeline') || 'Treatment Timeline'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => router.push(`/clinic/${id}?tab=chat`)}>
          <Text style={styles.actionText}>{t('tabs.chatClinic') || 'Chat with patient'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  header: { marginBottom: 12 },
  title: { fontSize: 22, fontWeight: '800' },
  sub: { fontSize: 12, color: '#666', marginTop: 4 },
  card: { backgroundColor: '#f5f5f5', padding: 16, borderRadius: 12 },
  label: { fontSize: 12, color: '#666' },
  value: { fontSize: 16, fontWeight: '600' },
  actions: { flexDirection: 'row', gap: 8, marginTop: 16 },
  actionBtn: { flex: 1, backgroundColor: '#D4AF37', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  actionText: { color: '#000', fontWeight: '700' },
});
