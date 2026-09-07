import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/src/context/ThemeContext';
import { useClinicGuard } from '@/src/utils/navigationGuards';

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function buildMonths(count: number) {
  const now = new Date();
  const out: { year: number; month: number }[] = [];
  let y = now.getFullYear();
  let m = now.getMonth();
  for (let i = 0; i < count; i++) {
    out.push({ year: y, month: m });
    m += 1;
    if (m > 11) { m = 0; y += 1; }
  }
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

export default function ClinicCalendarScreen() {
  useClinicGuard();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme() as any;
  const today = new Date();
  const months = buildMonths(12);

  const ink = colors?.textPrimary ?? (isDark ? '#EAF1FB' : '#1B2542');
  const faint = isDark ? '#7688A1' : '#8493AB';
  const hair = isDark ? '#1E2A3C' : '#EEF2F8';
  const accent = '#1668E3';

  return (
    <LinearGradient colors={isDark ? ['#0f1826', '#0b121d'] : ['#e8f3fe', '#f2f9ff', '#eaf6fd']} style={styles.root}>
      <View style={[styles.nav, { paddingTop: insets.top + 6 }]}>
        <Pressable onPress={() => router.back()} style={styles.back} hitSlop={10}>
          <Ionicons name="chevron-back" size={22} color={accent} />
          <Text style={[styles.backTxt, { color: accent }]}>Clinic</Text>
        </Pressable>
        <View style={{ flex: 1 }} />
        <Pressable style={styles.addBtn} hitSlop={10} onPress={() => {}}>
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
                  const isToday = d !== null && year === today.getFullYear() && month === today.getMonth() && d === today.getDate();
                  return (
                    <View key={i} style={styles.cell}>
                      {d !== null ? (
                        <View style={[styles.dayWrap, isToday && styles.todayWrap]}>
                          <Text style={[styles.dayTxt, { color: isToday ? '#FFFFFF' : ink }]}>{d}</Text>
                        </View>
                      ) : null}
                    </View>
                  );
                })}
              </View>
            </View>
          );
        })}
      </ScrollView>
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
  cell: { width: '14.2857%', height: 52, alignItems: 'center', justifyContent: 'flex-start', paddingTop: 6 },
  dayWrap: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  todayWrap: { backgroundColor: '#1668E3' },
  dayTxt: { fontSize: 15.5, fontWeight: '600' },
});
