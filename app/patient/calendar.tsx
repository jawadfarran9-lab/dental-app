import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Modal } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { collection, doc, getDoc, onSnapshot, orderBy, query } from 'firebase/firestore';
import { patientDb } from '@/firebaseConfig';
import { useTheme } from '@/src/context/ThemeContext';
import { usePatientGuard } from '@/src/utils/navigationGuards';
import { useAuth } from '@/src/context/AuthContext';
import PatientRequestSheet from '@/src/components/PatientRequestSheet';

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const STATUS_COLOR: Record<string, string> = { confirmed: '#10B981', proposed: '#F59E0B', requested: '#7C5CFF', completed: '#10B981', cancelled: '#9AA7BD' };
const DAY = 86400000;

const startOfDay = (ms: number) => { const d = new Date(ms); d.setHours(0, 0, 0, 0); return d.getTime(); };
const fmtTime = (ms: number) => { const d = new Date(ms); let h = d.getHours(); const mm = d.getMinutes(); const ap = h >= 12 ? 'PM' : 'AM'; h = h % 12; if (h === 0) h = 12; return `${h}:${mm < 10 ? '0' + mm : mm} ${ap}`; };
function buildMonths(count: number) { const now = new Date(); const out: { year: number; month: number }[] = []; let y = now.getFullYear(); let m = now.getMonth(); for (let i = 0; i < count; i++) { out.push({ year: y, month: m }); m += 1; if (m > 11) { m = 0; y += 1; } } return out; }
function monthCells(year: number, month: number): (number | null)[] { const first = new Date(year, month, 1).getDay(); const days = new Date(year, month + 1, 0).getDate(); const cells: (number | null)[] = []; for (let i = 0; i < first; i++) cells.push(null); for (let d = 1; d <= days; d++) cells.push(d); return cells; }
const dayKey = (y: number, m: number, d: number) => `${y}-${m}-${d}`;

type Appt = { id: string; dateTime: number; title?: string; status?: string };

export default function PatientCalendarScreen() {
  usePatientGuard();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme() as any;
  const params = useLocalSearchParams<{ patientId?: string }>();
  const patientId = params.patientId ? String(params.patientId) : null;
  const { clinicId } = useAuth();

  const today = useMemo(() => new Date(), []);
  const months = useMemo(() => buildMonths(12), []);
  const ink = colors?.textPrimary ?? (isDark ? '#EAF1FB' : '#1B2542');
  const faint = isDark ? '#7688A1' : '#8493AB';
  const hair = isDark ? '#1E2A3C' : '#EEF2F8';
  const accent = '#1668E3';

  const [appts, setAppts] = useState<Appt[]>([]);
  const [dayOpen, setDayOpen] = useState<number | null>(null);
  const [requestOpen, setRequestOpen] = useState(false);
  const [patientName, setPatientName] = useState<string>('Patient');

  useEffect(() => {
    if (!clinicId || !patientId) return;
    getDoc(doc(patientDb, 'clinics', clinicId, 'patients', patientId))
      .then((snap) => {
        if (!snap.exists()) return;
        const d = snap.data() as any;
        const name: string = d.name || d.patientName || 'Patient';
        setPatientName(name);
      })
      .catch(() => {});
  }, [clinicId, patientId]);

  useEffect(() => {
    if (!patientId) return;
    const qy = query(collection(patientDb, `patients/${patientId}/appointments`), orderBy('dateTime', 'asc'));
    const unsub = onSnapshot(qy, (snap) => {
      const rows: Appt[] = [];
      snap.forEach((d) => rows.push({ id: d.id, ...(d.data() as any) }));
      setAppts(rows);
    }, (e) => console.warn('patient appts', e));
    return () => unsub();
  }, [patientId]);

  const dotsByDay = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const a of appts) { if (a.status === 'cancelled') continue; const d = new Date(a.dateTime); const k = dayKey(d.getFullYear(), d.getMonth(), d.getDate()); (map[k] = map[k] || []).push(STATUS_COLOR[a.status || 'confirmed'] || accent); }
    return map;
  }, [appts]);

  const dayList = useMemo(() => {
    if (dayOpen == null) return [];
    const s = new Date(dayOpen); const e = new Date(dayOpen); e.setHours(23, 59, 59, 999);
    return appts.filter((a) => a.dateTime >= s.getTime() && a.dateTime <= e.getTime() && a.status !== 'cancelled').sort((a, b) => a.dateTime - b.dateTime);
  }, [appts, dayOpen]);

  const fmtDayTitle = (ms: number) => { const d = new Date(ms); const dn = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][d.getDay()]; return `${dn}, ${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)}`; };

  return (
    <LinearGradient colors={isDark ? ['#0f1826', '#0b121d'] : ['#e8f3fe', '#f2f9ff', '#eaf6fd']} style={styles.root}>
      <View style={[styles.nav, { paddingTop: insets.top + 6 }]}>
        <Pressable onPress={() => router.back()} style={styles.back} hitSlop={10}>
          <Ionicons name="chevron-back" size={22} color={accent} />
          <Text style={[styles.backTxt, { color: accent }]}>Back</Text>
        </Pressable>
        <View style={{ flex: 1 }} />
        {clinicId && patientId ? (
          <Pressable
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {}); setRequestOpen(true); }}
            hitSlop={10}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, backgroundColor: 'rgba(22,104,227,0.10)' }}
          >
            <Ionicons name="add-circle-outline" size={17} color={accent} />
            <Text style={{ color: accent, fontSize: 13.5, fontWeight: '800' }}>Request</Text>
          </Pressable>
        ) : null}
      </View>
      <Text style={[styles.h1, { color: ink }]}>My appointments</Text>

      <View style={[styles.wk, { borderBottomColor: hair }]}>
        {WEEKDAYS.map((w, i) => <Text key={i} style={[styles.wkTxt, { color: faint }]}>{w}</Text>)}
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 24 }} showsVerticalScrollIndicator={false}>
        {months.map(({ year, month }, idx) => {
          const cells = monthCells(year, month);
          return (
            <View key={`${year}-${month}`} style={[styles.msec, idx > 0 && { borderTopWidth: 1, borderTopColor: hair }]}>
              {(idx === 0 || month === 0) ? <Text style={[styles.yLabel, { color: accent }]}>{year}</Text> : null}
              <Text style={[styles.mLabel, { color: ink }]}>{MONTHS[month]}</Text>
              <View style={styles.grid}>
                {cells.map((d, i) => {
                  if (d === null) return <View key={i} style={styles.cell} />;
                  const isToday = year === today.getFullYear() && month === today.getMonth() && d === today.getDate();
                  const dots = dotsByDay[dayKey(year, month, d)] || [];
                  const dayMs = new Date(year, month, d, 0, 0, 0, 0).getTime();
                  return (
                    <Pressable key={i} style={styles.cell} onPress={() => setDayOpen(dayMs)}>
                      <View style={[styles.dayWrap, isToday && styles.todayWrap]}>
                        <Text style={[styles.dayTxt, { color: isToday ? '#FFFFFF' : ink }]}>{d}</Text>
                      </View>
                      <View style={styles.dotRow}>{dots.slice(0, 3).map((c, di) => <View key={di} style={[styles.dot, { backgroundColor: c }]} />)}</View>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          );
        })}
      </ScrollView>

      <Modal transparent animationType="slide" visible={dayOpen != null} onRequestClose={() => setDayOpen(null)}>
        <View style={styles.dim}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setDayOpen(null)} />
          <View style={[styles.sheet, { backgroundColor: isDark ? '#141e2d' : '#fff', paddingBottom: insets.bottom + 14 }]}>
            <View style={styles.grab} />
            <Text style={[styles.sheetTitle, { color: ink }]}>{dayOpen != null ? fmtDayTitle(dayOpen) : ''}</Text>
            {dayList.length === 0 ? (
              <Text style={[styles.empty, { color: faint }]}>No appointments this day.</Text>
            ) : dayList.map((a) => {
              const c = STATUS_COLOR[a.status || 'confirmed'] || accent;
              return (
                <View key={a.id} style={[styles.appt, { borderColor: hair }]}>
                  <View style={[styles.apptBar, { backgroundColor: c }]} />
                  <Text style={[styles.apptTime, { color: ink }]}>{fmtTime(a.dateTime)}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.apptWho, { color: ink }]} numberOfLines={1}>{a.title || 'Appointment'}</Text>
                  </View>
                  <Text style={[styles.apptStatus, { color: c }]}>{a.status || 'confirmed'}</Text>
                </View>
              );
            })}
          </View>
        </View>
      </Modal>

      {clinicId && patientId ? (
        <PatientRequestSheet
          visible={requestOpen}
          onClose={() => setRequestOpen(false)}
          clinicId={clinicId}
          patientId={patientId}
          patientName={patientName}
          onSubmitted={() => setRequestOpen(false)}
        />
      ) : null}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  nav: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingBottom: 2 },
  back: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  backTxt: { fontSize: 16, fontWeight: '600' },
  h1: { fontSize: 26, fontWeight: '800', paddingHorizontal: 18, paddingBottom: 10, letterSpacing: -0.3 },
  wk: { flexDirection: 'row', paddingHorizontal: 10, paddingVertical: 8, borderBottomWidth: 1 },
  wkTxt: { flex: 1, textAlign: 'center', fontSize: 11, fontWeight: '700' },
  msec: { paddingHorizontal: 8, paddingTop: 10, paddingBottom: 6 },
  yLabel: { fontSize: 12, fontWeight: '800', letterSpacing: 0.6, paddingHorizontal: 6, paddingTop: 4 },
  mLabel: { fontSize: 23, fontWeight: '800', paddingHorizontal: 6, paddingBottom: 8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: '14.2857%', height: 54, alignItems: 'center', justifyContent: 'flex-start', paddingTop: 6 },
  dayWrap: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  todayWrap: { backgroundColor: '#1668E3' },
  dayTxt: { fontSize: 15.5, fontWeight: '600' },
  dotRow: { flexDirection: 'row', gap: 3, marginTop: 2, height: 6 },
  dot: { width: 5, height: 5, borderRadius: 3 },
  dim: { flex: 1, backgroundColor: 'rgba(12,20,34,0.4)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 10, paddingHorizontal: 16 },
  grab: { width: 38, height: 5, borderRadius: 3, backgroundColor: 'rgba(140,150,170,0.4)', alignSelf: 'center', marginBottom: 12 },
  sheetTitle: { fontSize: 17, fontWeight: '800', marginBottom: 12 },
  empty: { fontSize: 13, fontWeight: '600', textAlign: 'center', paddingVertical: 18 },
  appt: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: 14, padding: 11, marginBottom: 9, overflow: 'hidden' },
  apptBar: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4 },
  apptTime: { fontSize: 12.5, fontWeight: '800', width: 66 },
  apptWho: { fontSize: 13.5, fontWeight: '800' },
  apptStatus: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
});
