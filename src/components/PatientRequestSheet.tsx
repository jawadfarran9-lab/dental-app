import React, { useEffect, useState } from 'react';
import { View, Text, Modal, Pressable, TextInput, Platform, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '@/src/context/ThemeContext';
import { requestAppointmentAsPatient } from '@/src/services/appointmentsService';

const fmtTime = (ms: number) => {
  const d = new Date(ms); let h = d.getHours(); const mm = d.getMinutes();
  const ap = h >= 12 ? 'PM' : 'AM'; h = h % 12; if (h === 0) h = 12;
  return `${h}:${mm < 10 ? '0' + mm : mm} ${ap}`;
};

export default function PatientRequestSheet({ visible, onClose, clinicId, patientId, patientName, clinicName, onSubmitted }: {
  visible: boolean;
  onClose: () => void;
  clinicId: string;
  patientId: string;
  patientName: string;
  clinicName?: string;
  onSubmitted?: () => void;
}) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme() as any;
  const ink = colors?.textPrimary ?? (isDark ? '#EAF1FB' : '#1B2542');
  const faint = isDark ? '#7688A1' : '#8493AB';
  const hair = isDark ? '#1E2A3C' : '#EEF2F8';
  const cardBg = isDark ? '#141e2d' : '#ffffff';
  const accent = '#1668E3';

  const [apptDate, setApptDate] = useState<Date>(new Date());
  const [reason, setReason] = useState('');
  const [pickerMode, setPickerMode] = useState<null | 'date' | 'time'>(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setPickerMode(null);
    setReason('');
    const base = new Date();
    base.setHours(base.getHours() + 1, 0, 0, 0);
    setApptDate(base);
  }, [visible]);

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

  const canSend = !sending && reason.trim().length > 0 && apptDate.getTime() > Date.now();

  const doSend = async () => {
    if (!canSend) return;
    try {
      setSending(true);
      await requestAppointmentAsPatient({
        clinicId,
        patientId,
        patientName,
        dateTime: apptDate.getTime(),
        title: reason.trim(),
        clinicName,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      onSubmitted?.();
      onClose();
    } catch (e) {
      console.warn('request appt', e);
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal transparent animationType="slide" visible={visible} onRequestClose={onClose}>
      <View style={styles.dim}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[styles.sheet, { backgroundColor: cardBg, paddingBottom: insets.bottom + 14 }]}>
          <View style={styles.grab} />
          <Text style={[styles.title, { color: ink }]}>Request appointment</Text>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
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

            <Text style={[styles.fldLabel, { color: faint, marginTop: 10 }]}>REASON / SESSION</Text>
            <TextInput
              value={reason}
              onChangeText={setReason}
              placeholder="e.g. Cleaning, follow-up, tooth pain"
              placeholderTextColor={faint}
              style={[styles.input, { borderColor: hair, color: ink }]}
              multiline
              returnKeyType="default"
              blurOnSubmit={false}
              maxLength={280}
            />

            <Text style={[styles.note, { color: faint }]}>Your request will be sent to the clinic for approval.</Text>

            <Pressable onPress={doSend} disabled={!canSend} style={{ opacity: canSend ? 1 : 0.5, marginTop: 6 }}>
              <LinearGradient colors={['#3D9DFF', '#1668E3']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.cta}>
                <Ionicons name="paper-plane" size={17} color="#fff" />
                <Text style={styles.ctaTxt}>{sending ? 'Sending…' : 'Send request'}</Text>
              </LinearGradient>
            </Pressable>
          </ScrollView>

          {pickerMode && Platform.OS === 'ios' && (
            <View style={[styles.dtOverlay, { backgroundColor: cardBg, paddingBottom: insets.bottom + 10 }]}>
              <DateTimePicker value={apptDate} mode={pickerMode} display="spinner" onChange={onPick} minimumDate={new Date()} />
              <Pressable onPress={() => setPickerMode(null)} style={styles.done}><Text style={styles.doneTxt}>Done</Text></Pressable>
            </View>
          )}
        </View>
      </View>

      {pickerMode && Platform.OS !== 'ios' && (
        <DateTimePicker value={apptDate} mode={pickerMode} onChange={onPick} minimumDate={new Date()} />
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  dim: { flex: 1, backgroundColor: 'rgba(12,20,34,0.4)', justifyContent: 'flex-end' },
  sheet: { height: '82%', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 10, paddingHorizontal: 16, overflow: 'hidden' },
  grab: { width: 38, height: 5, borderRadius: 3, backgroundColor: 'rgba(140,150,170,0.4)', alignSelf: 'center', marginBottom: 12 },
  title: { fontSize: 17, fontWeight: '800', marginBottom: 12 },
  field: { borderWidth: 1, borderRadius: 13, paddingHorizontal: 12, paddingVertical: 9 },
  row2: { flexDirection: 'row', gap: 10, marginBottom: 4 },
  fldLabel: { fontSize: 10.5, fontWeight: '800', letterSpacing: 0.6 },
  fldVal: { fontSize: 14.5, fontWeight: '700', marginTop: 3 },
  input: { borderWidth: 1, borderRadius: 13, paddingHorizontal: 13, paddingVertical: 11, fontSize: 14.5, fontWeight: '600', marginTop: 8, minHeight: 96, maxHeight: 180, textAlignVertical: 'top' },
  note: { fontSize: 11.5, fontWeight: '600', marginTop: 12, marginBottom: 6 },
  cta: { height: 52, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  ctaTxt: { color: '#fff', fontSize: 15.5, fontWeight: '800' },
  dtOverlay: { position: 'absolute', left: 0, right: 0, bottom: 0, borderTopLeftRadius: 22, borderTopRightRadius: 22, paddingTop: 8, alignItems: 'center', borderTopWidth: 1, borderTopColor: 'rgba(140,150,170,0.2)' },
  done: { alignSelf: 'stretch', marginHorizontal: 16, marginTop: 8, height: 46, borderRadius: 14, backgroundColor: '#1668E3', alignItems: 'center', justifyContent: 'center' },
  doneTxt: { color: '#fff', fontSize: 15, fontWeight: '800' },
});
