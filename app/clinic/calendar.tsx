import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Modal } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/src/context/ThemeContext';
import { useClinicGuard } from '@/src/utils/navigationGuards';
import { useAuth } from '@/src/context/AuthContext';
import { subscribeClinicAppointments, AppointmentDoc, AppointmentStatus } from '@/src/services/appointmentsService';
import NewAppointmentSheet from '@/src/components/NewAppointmentSheet';

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const STATUS_COLOR: Record<AppointmentStatus, string> = { confirmed: '#10B981', proposed: '#F59E0B', requested: '#7C5CFF', completed: '#10B981', cancelled: '#9AA7BD' };

function buildMonths(count: number) {
  const now = new Date();
  const out: { year: number; month: number }[] = [];
  let y = now.getFullYear(); let m = now.getMonth();
  for (let i = 0; i < count; i++) { out.push({ year: y, month: m }); m += 1; if (m > 11) { m = 0; y += 1; } }
  return out;
}
function monthCells(year: number, month: number): (number | null)[] {
  const first = new Date(year, month, 1).getDay();
  const days = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < first; i++) cells.push(null);
  for (let d = 1; d <= days; d++) cells.push(d);
  return cells;
}
const dayKey = (y: number, m: number, d: number) => `${y}-${m}-${d}`;
const fmtTime = (ms: number) => { const d = new Date(ms); let h = d.getHours(); const mm = d.getMinutes(); const ap = h >= 12 ? 'PM' : 'AM'; h = h % 12; if (h === 0) h = 12; return `${h}:${mm < 10 ? '0' + mm : mm} ${ap}`; };

export default function ClinicCalendarScreen() {
  useClinicGuard();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme() as any;
  const { clinicId, memberId } = useAuth();

  const today = useMemo(() => new Date(), []);
  const months = useMemo(() => buildMonths(12), []);
  const ink = colors?.textPrimary ?? (isDark ? '#EAF1FB' : '#1B2542');
  const faint = isDark ? '#7688A1' : '#8493AB';
  const hair = isDark ? '#1E2A3C' : '#EEF2F8';
  const accent = '#1668E3';

  const [appts, setAppts] = useState<AppointmentDoc[]>([]);
  const [dayOpen, setDayOpen] = useState<number | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [createDay, setCreateDay] = useState<number | null>(null);

  useEffect(() => {
    if (!clinicId) return;
    const start = new Date(); start.setDate(start.getDate() - 45); start.setHours(0, 0, 0, 0);
    const end = new Date(); end.setDate(end.getDate() + 400); end.setHours(23, 59, 59, 999);
    const unsub = subscribeClinicAppointments(clinicId, start.getTime(), end.getTime(), setAppts, (e) => console.warn('appts', e));
    return () => unsub();
  }, [clinicId]);

  const dotsByDay = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const a of appts) {
      if (a.status === 'cancelled') continue;
      const d = new Date(a.dateTime);
      const k = dayKey(d.getFullYear(), d.getMonth(), d.getDate());
      (map[k] = map[k] || []).push(STATUS_COLOR[a.status] || accent);
    }
    return map;
  }, [appts]);

  const dayList = useMemo(() => {
    if (dayOpen == null) return [];
    const s = new Date(dayOpen); const e = new Date(dayOpen); e.setHours(23, 59, 59, 999);
    return appts.filter((a) => a.dateTime >= s.getTime() && a.dateTime <= e.getTime() && a.status !== 'cancelled').sort((a, b) => a.dateTime - b.dateTime);
  }, [appts, dayOpen]);

  const openCreate = (dayMs?: number | null) => { setCreateDay(dayMs ?? null); setCreateOpen(true); };

  const fmtDayTitle = (ms: number) => { const d = new Date(ms); const dn = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][d.getDay()]; return `${dn}, ${d.getDate()} ${MONTHS[d.getMonth()].slice(0,3)}`; };

  return (
    <LinearGradient colors={isDark ? ['#0f1826', '#0b121d'] : ['#e8f3fe', '#f2f9ff', '#eaf6fd']} style={styles.root}>
      <View style={[styles.nav, { paddingTop: insets.top + 6 }]}>
        <Pressable onPress={() => router.back()} style={styles.back} hitSlop={10}>
          <Ionicons name="chevron-back" size={22} color={accent} />
          <Text style={[styles.backTxt, { color: accent }]}>Clinic</Text>
        </Pressable>
        <View style={{ flex: 1 }} />
        <Pressable style={styles.addBtn} hitSlop={10} onPress={() => openCreate()}>
          <Ionicons name="add" size={22} color={accent} />
        </Pressable>
      </View>

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
                      <View style={styles.dotRow}>
                        {dots.slice(0, 3).map((c, di) => <View key={di} style={[styles.dot, { backgroundColor: c }]} />)}
                      </View>
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
            <View style={styles.daySheetHead}>
              <Text style={[styles.daySheetTitle, { color: ink }]}>{dayOpen != null ? fmtDayTitle(dayOpen) : ''}</Text>
              <Pressable onPress={() => { const d = dayOpen; setDayOpen(null); setTimeout(() => openCreate(d ?? undefined), 250); }} style={styles.daySheetAdd}>
                <Ionicons name="add" size={16} color="#fff" /><Text style={styles.daySheetAddTxt}>New</Text>
              </Pressable>
            </View>
            {dayList.length === 0 ? (
              <Text style={[styles.empty, { color: faint }]}>No appointments this day.</Text>
            ) : dayList.map((a) => (
              <View key={a.id} style={[styles.appt, { borderColor: hair }]}>
                <View style={[styles.apptBar, { backgroundColor: STATUS_COLOR[a.status] || accent }]} />
                <Text style={[styles.apptTime, { color: ink }]}>{fmtTime(a.dateTime)}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.apptWho, { color: ink }]} numberOfLines={1}>{a.patientName || 'Patient'}</Text>
                  {!!a.title && <Text style={[styles.apptSes, { color: faint }]} numberOfLines={1}>{a.title}</Text>}
                </View>
                <Text style={[styles.apptStatus, { color: STATUS_COLOR[a.status] || accent }]}>{a.status}</Text>
              </View>
            ))}
          </View>
        </View>
      </Modal>

      <NewAppointmentSheet
        visible={createOpen}
        initialDayMs={createDay}
        clinicId={clinicId}
        memberId={memberId}
        onClose={() => setCreateOpen(false)}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  nav: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingBottom: 6 },
  back: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  backTxt: { fontSize: 16, fontWeight: '600' },
  addBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(22,104,227,0.10)', alignItems: 'center', justifyContent: 'center' },
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
  daySheetHead: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  daySheetTitle: { fontSize: 17, fontWeight: '800', flex: 1 },
  daySheetAdd: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#1668E3', paddingHorizontal: 12, height: 32, borderRadius: 999 },
  daySheetAddTxt: { color: '#fff', fontSize: 13, fontWeight: '800' },
  empty: { fontSize: 13, fontWeight: '600', paddingVertical: 18, textAlign: 'center' },
  appt: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: 14, padding: 11, marginBottom: 9, overflow: 'hidden' },
  apptBar: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4 },
  apptTime: { fontSize: 12.5, fontWeight: '800', width: 66 },
  apptWho: { fontSize: 13.5, fontWeight: '800' },
  apptSes: { fontSize: 11.5, fontWeight: '600', marginTop: 1 },
  apptStatus: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
});
