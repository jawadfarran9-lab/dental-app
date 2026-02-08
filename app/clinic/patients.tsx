import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

// TODO: Replace with real Firestore data
// - Use listPatients() from src/services/patientService.ts
// - Add real-time listener for updates
// - Remove MOCK_PATIENTS array
type MockPatient = { id: string; name: string; code: number; phone?: string };

const MOCK_PATIENTS: MockPatient[] = [
  { id: 'p1', name: 'John Doe', code: 12345, phone: '+1 555-0100' },
  { id: 'p2', name: 'Jane Smith', code: 67890, phone: '+1 555-0101' },
  { id: 'p3', name: 'Ali Hassan', code: 11223, phone: '+971 55 123 4567' },
];

export default function PatientsList() {
  const router = useRouter();
  const { t } = useTranslation();
  const [query, setQuery] = useState('');

  const data = MOCK_PATIENTS.filter(
    p => p.name.toLowerCase().includes(query.toLowerCase()) || String(p.code).includes(query)
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('patients.list') || 'Patients'}</Text>
        <Text style={styles.sub}>{t('patients.searchAndSelect') || 'Search and select a patient'}</Text>
      </View>

      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder={t('patients.searchPlaceholder') || 'Search by name or code'}
        style={styles.search}
      />

      <FlatList
        data={data}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.item} onPress={() => router.push(`/clinic/patient-profile?id=${item.id}`)}>
            <View style={{ flex: 1 }}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemSub}>{t('patients.code')}{item.code}</Text>
            </View>
            <Text style={styles.itemPhone}>{item.phone ?? ''}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.empty}>{t('patients.noPatients') || 'No patients yet'}</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  header: { marginBottom: 12 },
  title: { fontSize: 22, fontWeight: '800' },
  sub: { fontSize: 12, color: '#666', marginTop: 4 },
  search: { marginBottom: 12, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10 },
  item: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  itemName: { fontSize: 16, fontWeight: '600' },
  itemSub: { color: '#666' },
  itemPhone: { color: '#777' },
  empty: { textAlign: 'center', color: '#999', marginTop: 24 },
});
