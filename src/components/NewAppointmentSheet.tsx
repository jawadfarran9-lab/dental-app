import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, Modal, Pressable, TextInput, Platform, ActivityIndicator, SectionList, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/firebaseConfig';
import { useTheme } from '@/src/context/ThemeContext';
import { createAppointment, updateAppointment, AppointmentDoc } from '@/src/services/appointmentsService';

type Patient = { id: string; name: string };

const fmtTime = (ms: number) => {
  const d = new Date(ms); let h = d.getHours(); const mm = d.getMinutes();
  const ap = h >= 12 ? 'PM' : 'AM'; h = h % 12; if (h === 0) h = 12;
  return `${h}:${mm < 10 ? '0' + mm : mm} ${ap}`;
};

function buildSections(patients: Patient[], query: string) {
  const q = query.trim().toLowerCase();
  const filtered = q ? patients.filter((p) => p.name.toLowerCase().includes(q)) : patients;
  const sorted = [...filtered].sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));
  const groups: Record<string, Patient[]> = {};
  for (const p of sorted) {
    const first = (p.name.trim()[0] || '#').toUpperCase();
    const key = /[A-Z]/.test(first) ? first : '#';
    (groups[key] = groups[key] || []).push(p);
  }
  return Object.keys(groups).sort().map((letter) => ({ title: letter, data: groups[letter] }));
}

export default function NewAppointmentSheet({ visible, initialDayMs, editing, clinicId, memberId, onClose }: {
  visible: boolean;
  initialDayMs?: number | null;
  editing?: AppointmentDoc | null;
  clinicId?: string | null;
  memberId?: string | null;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme() as any;
  const ink = colors?.textPrimary ?? (isDark ? '#EAF1FB' : '#1B2542');
  const faint = isDark ? '#7688A1' : '#8493AB';
  const hair = isDark ? '#1E2A3C' : '#EEF2F8';
  const cardBg = isDark ? '#141e2d' : '#ffffff';
  const accent = '#1668E3';

  const [patients, setPatients] = useState<Patient[]>([]);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [selPatient, setSelPatient] = useState<Patient | null>(null);
  const [apptDate, setApptDate] = useState<Date>(new Date());
  const [title, setTitle] = useState('');
  const [pickerMode, setPickerMode] = useState<null | 'date' | 'time'>(null);
  const [saving, setSaving] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!visible) return;
    setQuery(''); setPickerOpen(false); setPickerMode(null);
    if (editing) {
      setSelPatient({ id: editing.patientId, name: editing.patientName || 'Patient' });
      setApptDate(new Date(editing.dateTime));
      setTitle(editing.title || '');
      return;
    }
    const base = initialDayMs != null ? new Date(initialDayMs) : new Date();
    const now = new Date();
    base.setHours(now.getHours() + 1, 0, 0, 0);
    setApptDate(base); setSelPatient(null); setTitle('');
    if (clinicId) {
      setLoadingPatients(true);
      getDocs(collection(db, `clinics/${clinicId}/patients`))
        .then((snap) => {
          const rows: Patient[] = [];
          snap.forEach((d) => { const x = d.data() as any; rows.push({ id: d.id, name: x.name || x.patientName || 'Patient' }); });
          setPatients(rows);
        })
        .catch((e) => console.warn('patients', e))
        .finally(() => setLoadingPatients(false));
    }
  }, [visible, initialDayMs, clinicId, editing]);

  const sections = useMemo(() => buildSections(patients, query), [patients, query]);

  const onPick = (_: any, picked?: Date) => {
    if (Platform.OS !== 'ios') setPickerMode(null);
    if (!picked) return;
    setApptDate((prev) => {
      const d = new Date(prev);
      if (pickerMode === 'date') d.setFullYear(picked.getFullYear(), picked.getMonth(), picked.getDate());
      else d.setHours(picked.getHours(), picked.getMinutes(), 0, 0);
      return d;
    });
  };

  const doSave = async () => {
    if (saving || !clinicId || !selPatient) return;
    try {
      setSaving(true);
      if (editing) {
        await updateAppointment(editing.patientId, editing.id, { dateTime: apptDate.getTime(), title: title.trim() });
      } else {
        await createAppointment({
          clinicId, patientId: selPatient.id, patientName: selPatient.name,
          dateTime: apptDate.getTime(), title: title.trim(), status: 'confirmed', source: 'clinic',
          createdBy: memberId || 'clinic',
        });
      }
      onClose();
    } catch (e) { console.warn('save appt', e); }
    finally { setSaving(false); }
  };

  return (
    <Modal transparent animationType="slide" visible={visible} onRequestClose={onClose}>
      <View style={styles.dim}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[styles.sheet, { backgroundColor: cardBg, paddingBottom: insets.bottom + 14 }]}>
          <View style={styles.grab} />
          <Text style={[styles.title, { color: ink }]}>{editing ? 'Edit appointment' : 'New appointment'}</Text>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <Pressable onPress={editing ? undefined : () => setPickerOpen(true)} style={[styles.field, { borderColor: hair, marginBottom: 10, flexDirection: 'row', alignItems: 'center', opacity: editing ? 0.7 : 1 }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.fldLabel, { color: faint }]}>PATIENT</Text>
                <Text style={[styles.fldVal, { color: selPatient ? ink : faint }]}>{selPatient ? selPatient.name : 'Choose patient'}</Text>
              </View>
              {!editing ? <Ionicons name="chevron-forward" size={18} color={faint} /> : null}
            </Pressable>

            <View style={styles.row2}>
              <Pressable onPress={() => setPickerMode('date')} style={[styles.field, { borderColor: hair, flex: 1 }]}>
                <Text style={[styles.fldLabel, { color: faint }]}>DATE</Text>
                <Text style={[styles.fldVal, { color: ink }]}>{apptDate.toDateString()}</Text>
              </Pressable>
              <Pressable onPress={() => setPickerMode('time')} style={[styles.field, { borderColor: hair, flex: 1 }]}>
                <Text style={[styles.fldLabel, { color: faint }]}>TIME</Text>
                <Text style={[styles.fldVal, { color: ink }]}>{fmtTime(apptDate.getTime())}</Text>
              </Pressable>
            </View>

            <Text style={[styles.fldLabel, { color: faint, marginTop: 6 }]}>SESSION (optional)</Text>
            <TextInput value={title} onChangeText={setTitle} placeholder="e.g. Teeth Cleaning" placeholderTextColor={faint}
              style={[styles.input, { borderColor: hair, color: ink }]} />

            <Text style={[styles.note, { color: faint }]}>{editing ? 'Editing this appointment.' : 'Booked in clinic · confirmed immediately.'}</Text>

            <Pressable onPress={doSave} disabled={!selPatient || saving} style={{ opacity: !selPatient || saving ? 0.5 : 1, marginTop: 6 }}>
              <LinearGradient colors={['#3D9DFF', '#1668E3']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.cta}>
                <Ionicons name="checkmark" size={18} color="#fff" />
                <Text style={styles.ctaTxt}>{saving ? 'Saving…' : editing ? 'Save changes' : 'Create appointment'}</Text>
              </LinearGradient>
            </Pressable>
          </ScrollView>

          {pickerOpen && (
            <View style={[styles.overlay, { backgroundColor: cardBg, paddingBottom: insets.bottom + 10 }]}>
              <View style={styles.pHead}>
                <Pressable onPress={() => setPickerOpen(false)} hitSlop={10} style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="chevron-back" size={22} color={accent} />
                  <Text style={[styles.pBack, { color: accent }]}>Back</Text>
                </Pressable>
                <Text style={[styles.title, { color: ink, marginBottom: 0 }]}>Choose patient</Text>
                <View style={{ width: 54 }} />
              </View>
              <View style={[styles.search, { borderColor: hair }]}>
                <Ionicons name="search" size={16} color={faint} />
                <TextInput value={query} onChangeText={setQuery} placeholder="Search patients" placeholderTextColor={faint}
                  autoCorrect={false} autoCapitalize="none" style={[styles.searchInput, { color: ink }]} />
                {query.length > 0 ? <Pressable onPress={() => setQuery('')} hitSlop={8}><Ionicons name="close-circle" size={16} color={faint} /></Pressable> : null}
              </View>
              {loadingPatients ? (
                <ActivityIndicator color={accent} style={{ marginTop: 20 }} />
              ) : (
                <SectionList
                  style={{ flex: 1 }}
                  sections={sections}
                  keyExtractor={(it) => it.id}
                  keyboardShouldPersistTaps="handled"
                  stickySectionHeadersEnabled
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
                  renderSectionHeader={({ section }) => (
                    <Text style={[styles.secHeader, { color: faint, backgroundColor: cardBg }]}>{section.title}</Text>
                  )}
                  renderItem={({ item }) => (
                    <Pressable onPress={() => { setSelPatient(item); setPickerOpen(false); }} style={[styles.prow, { borderBottomColor: hair }]}>
                      <Text style={[styles.prowTxt, { color: ink }]} numberOfLines={1}>{item.name}</Text>
                      {selPatient?.id === item.id ? <Ionicons name="checkmark-circle" size={18} color={accent} /> : null}
                    </Pressable>
                  )}
                  ListEmptyComponent={<Text style={[styles.empty, { color: faint }]}>No patients found.</Text>}
                />
              )}
            </View>
          )}

          {pickerMode && Platform.OS === 'ios' && (
            <View style={[styles.dtOverlay, { backgroundColor: cardBg, paddingBottom: insets.bottom + 10 }]}>
              <DateTimePicker value={apptDate} mode={pickerMode} display="spinner" onChange={onPick} />
              <Pressable onPress={() => setPickerMode(null)} style={styles.done}><Text style={styles.doneTxt}>Done</Text></Pressable>
            </View>
          )}
        </View>
      </View>

      {pickerMode && Platform.OS !== 'ios' && (
        <DateTimePicker value={apptDate} mode={pickerMode} onChange={onPick} />
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  dim: { flex: 1, backgroundColor: 'rgba(12,20,34,0.4)', justifyContent: 'flex-end' },
  sheet: { height: '90%', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 10, paddingHorizontal: 16, overflow: 'hidden' },
  grab: { width: 38, height: 5, borderRadius: 3, backgroundColor: 'rgba(140,150,170,0.4)', alignSelf: 'center', marginBottom: 12 },
  title: { fontSize: 17, fontWeight: '800', marginBottom: 12 },
  overlay: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 12, paddingHorizontal: 16 },
  pHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  pBack: { fontSize: 15, fontWeight: '600' },
  search: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 13, paddingHorizontal: 12, height: 44, marginBottom: 8 },
  searchInput: { flex: 1, fontSize: 15, fontWeight: '600' },
  secHeader: { fontSize: 12, fontWeight: '800', letterSpacing: 0.5, paddingVertical: 6, paddingHorizontal: 2 },
  prow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 13, borderBottomWidth: 1 },
  prowTxt: { fontSize: 15, fontWeight: '700', flex: 1, paddingRight: 10 },
  empty: { fontSize: 13, fontWeight: '600', textAlign: 'center', marginTop: 24 },
  field: { borderWidth: 1, borderRadius: 13, paddingHorizontal: 12, paddingVertical: 9 },
  row2: { flexDirection: 'row', gap: 10, marginBottom: 4 },
  fldLabel: { fontSize: 10.5, fontWeight: '800', letterSpacing: 0.6 },
  fldVal: { fontSize: 14.5, fontWeight: '700', marginTop: 3 },
  input: { borderWidth: 1, borderRadius: 13, paddingHorizontal: 13, paddingVertical: 11, fontSize: 14.5, fontWeight: '600', marginTop: 8 },
  note: { fontSize: 11.5, fontWeight: '600', marginTop: 12, marginBottom: 6 },
  cta: { height: 52, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  ctaTxt: { color: '#fff', fontSize: 15.5, fontWeight: '800' },
  dtOverlay: { position: 'absolute', left: 0, right: 0, bottom: 0, borderTopLeftRadius: 22, borderTopRightRadius: 22, paddingTop: 8, alignItems: 'center', borderTopWidth: 1, borderTopColor: 'rgba(140,150,170,0.2)' },
  done: { alignSelf: 'stretch', marginHorizontal: 16, marginTop: 8, height: 46, borderRadius: 14, backgroundColor: '#1668E3', alignItems: 'center', justifyContent: 'center' },
  doneTxt: { color: '#fff', fontSize: 15, fontWeight: '800' },
});
