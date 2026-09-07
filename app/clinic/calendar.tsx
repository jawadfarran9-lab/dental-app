import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
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
  const [createOpen, setCreateOpen] = useState(false);

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

  return (
    <LinearGradient colors={isDark ? ['#0f1826', '#0b121d'] : ['#e8f3fe', '#f2f9ff', '#eaf6fd']} style={styles.root}>
      <View style={[styles.nav, { paddingTop: insets.top + 6 }]}>
        <Pressable onPress={() => router.back()} style={styles.back} hitSlop={10}>
          <Ionicons name="chevron-back" size={22} color={accent} />
          <Text style={[styles.backTxt, { color: accent }]}>Clinic</Text>
        </Pressable>
        <View style={{ flex: 1 }} />
        <Pressable style={styles.addBtn} hitSlop={10} onPress={() => setCreateOpen(true)}>
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
                    <Pressable key={i} style={styles.cell} onPress={() => router.push(`/clinic/calendar-day?dayMs=${dayMs}` as any)}>
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

      <NewAppointmentSheet
        visible={createOpen}
        initialDayMs={null}
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
});
