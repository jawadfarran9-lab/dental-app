import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, FlatList, Dimensions, Modal, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/src/context/ThemeContext';
import { useClinicGuard } from '@/src/utils/navigationGuards';
import { useAuth } from '@/src/context/AuthContext';
import { subscribeClinicAppointments, deleteAppointment, AppointmentDoc, AppointmentStatus } from '@/src/services/appointmentsService';
import NewAppointmentSheet from '@/src/components/NewAppointmentSheet';

const WD = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const WD_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const STATUS_COLOR: Record<AppointmentStatus, string> = { confirmed: '#10B981', proposed: '#F59E0B', requested: '#7C5CFF', completed: '#10B981', cancelled: '#9AA7BD' };
const DAY = 86400000;
const SCREEN_W = Dimensions.get('window').width;
const SCREEN_H = Dimensions.get('window').height;
const WEEK_SPAN = 26;

const startOfDay = (ms: number) => { const d = new Date(ms); d.setHours(0, 0, 0, 0); return d.getTime(); };
const fmtTime = (ms: number) => { const d = new Date(ms); let h = d.getHours(); const mm = d.getMinutes(); const ap = h >= 12 ? 'PM' : 'AM'; h = h % 12; if (h === 0) h = 12; return `${h}:${mm < 10 ? '0' + mm : mm} ${ap}`; };
const hourLabel = (h: number) => { const ap = h >= 12 ? 'PM' : 'AM'; let hh = h % 12; if (hh === 0) hh = 12; return `${hh} ${ap}`; };

export default function ClinicDayScreen() {
  useClinicGuard();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme() as any;
  const { clinicId, memberId } = useAuth();
  const params = useLocalSearchParams<{ dayMs?: string }>();

  const initialMs = useMemo(() => startOfDay(params.dayMs ? Number(params.dayMs) : Date.now()), [params.dayMs]);
  const [selectedMs, setSelectedMs] = useState<number>(initialMs);
  const [appts, setAppts] = useState<AppointmentDoc[]>([]);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingAppt, setEditingAppt] = useState<AppointmentDoc | null>(null);
  const [expandedHour, setExpandedHour] = useState<number | null>(null);
  const [menuFor, setMenuFor] = useState<AppointmentDoc | null>(null);
  const [menuPos, setMenuPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const ink = colors?.textPrimary ?? (isDark ? '#EAF1FB' : '#1B2542');
  const faint = isDark ? '#7688A1' : '#8493AB';
  const hair = isDark ? '#1E2A3C' : '#EEF2F8';
  const cardBg = isDark ? 'rgba(255,255,255,0.05)' : '#ffffff';
  const cardSolid = isDark ? '#141e2d' : '#ffffff';
  const accent = '#1668E3';
  const danger = '#E5484D';

  useEffect(() => {
    if (!clinicId) return;
    const from = initialMs - (WEEK_SPAN + 1) * 7 * DAY;
    const to = initialMs + (WEEK_SPAN + 1) * 7 * DAY;
    const unsub = subscribeClinicAppointments(clinicId, from, to, setAppts, (e) => console.warn('appts', e));
    return () => unsub();
  }, [clinicId, initialMs]);

  useEffect(() => { setExpandedHour(null); }, [selectedMs]);

  const weeks = useMemo(() => {
    const dow = new Date(initialMs).getDay();
    const sun0 = initialMs - dow * DAY;
    return Array.from({ length: WEEK_SPAN * 2 + 1 }, (_, i) => sun0 + (i - WEEK_SPAN) * 7 * DAY);
  }, [initialMs]);

  const hasApptByDay = useMemo(() => {
    const set = new Set<number>();
    for (const a of appts) { if (a.status === 'cancelled') continue; set.add(startOfDay(a.dateTime)); }
    return set;
  }, [appts]);

  const dayAppts = useMemo(() => {
    const s = selectedMs; const e = selectedMs + DAY;
    return appts.filter((a) => a.dateTime >= s && a.dateTime < e && a.status !== 'cancelled').sort((a, b) => a.dateTime - b.dateTime);
  }, [appts, selectedMs]);

  const byHour = useMemo(() => {
    const m: Record<number, AppointmentDoc[]> = {};
    for (const a of dayAppts) { const h = new Date(a.dateTime).getHours(); (m[h] = m[h] || []).push(a); }
    Object.keys(m).forEach((k) => m[Number(k)].sort((a, b) => a.dateTime - b.dateTime));
    return m;
  }, [dayAppts]);

  const { startHour, endHour } = useMemo(() => {
    let mn = 8; let mx = 19;
    for (const a of dayAppts) { const h = new Date(a.dateTime).getHours(); if (h < mn) mn = h; if (h + 1 > mx) mx = h + 1; }
    return { startHour: Math.max(0, mn), endHour: Math.min(23, mx) };
  }, [dayAppts]);
  const hours: number[] = []; for (let h = startHour; h <= endHour; h++) hours.push(h);

  const sel = new Date(selectedMs);

  const openCreate = () => { setEditingAppt(null); setSheetOpen(true); };
  const onEdit = () => { const a = menuFor; setMenuFor(null); if (a) setTimeout(() => { setEditingAppt(a); setSheetOpen(true); }, 250); };
  const onDelete = () => {
    const a = menuFor; if (!a) return;
    Alert.alert('Delete appointment?', 'This removes it from the calendar and the patient side.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { setMenuFor(null); try { await deleteAppointment(a.patientId, a.id); } catch (e) { console.warn('delete', e); } } },
    ]);
  };

  const ApptCard = (a: AppointmentDoc) => {
    const c = STATUS_COLOR[a.status] || accent;
    return (
      <Pressable key={a.id} onLongPress={(e) => { setMenuPos({ x: e.nativeEvent.pageX, y: e.nativeEvent.pageY }); setMenuFor(a); }} delayLongPress={350} style={[styles.appt, { backgroundColor: cardBg, borderColor: hair }]}>
        <View style={[styles.apptBar, { backgroundColor: c }]} />
        <View style={{ flex: 1 }}>
          <Text style={[styles.evTime, { color: c }]}>{fmtTime(a.dateTime)}</Text>
          <Text style={[styles.evWho, { color: ink }]} numberOfLines={1}>{a.patientName || 'Patient'}</Text>
          {!!a.title && <Text style={[styles.evSes, { color: faint }]} numberOfLines={1}>{a.title}</Text>}
        </View>
        <Text style={[styles.evTag, { color: c }]}>{a.status}</Text>
      </Pressable>
    );
  };

  const renderWeek = ({ item: weekStart }: { item: number }) => (
    <View style={{ width: SCREEN_W, flexDirection: 'row', paddingHorizontal: 8 }}>
      {Array.from({ length: 7 }, (_, i) => weekStart + i * DAY).map((ms) => {
        const d = new Date(ms); const on = ms === selectedMs; const hasA = hasApptByDay.has(ms);
        return (
          <Pressable key={ms} style={styles.wd} onPress={() => setSelectedMs(ms)}>
            <Text style={[styles.wdL, { color: faint }]}>{WD[d.getDay()]}</Text>
            <View style={[styles.wdD, on && { backgroundColor: accent }]}>
              <Text style={[styles.wdDT, { color: on ? '#fff' : ink }]}>{d.getDate()}</Text>
            </View>
            <View style={[styles.wdDot, hasA && !on && { backgroundColor: accent }]} />
          </Pressable>
        );
      })}
    </View>
  );

  return (
    <LinearGradient colors={isDark ? ['#0f1826', '#0b121d'] : ['#e8f3fe', '#f2f9ff', '#eaf6fd']} style={styles.root}>
      <View style={[styles.nav, { paddingTop: insets.top + 6 }]}>
        <Pressable onPress={() => router.back()} style={styles.back} hitSlop={10}>
          <Ionicons name="chevron-back" size={22} color={accent} />
          <Text style={[styles.backTxt, { color: accent }]}>Calendar</Text>
        </Pressable>
        <View style={{ flex: 1 }} />
        <Pressable style={styles.addBtn} hitSlop={10} onPress={openCreate}>
          <Ionicons name="add" size={22} color={accent} />
        </Pressable>
      </View>

      <View style={[styles.weekWrap, { borderBottomColor: hair }]}>
        <FlatList
          data={weeks}
          keyExtractor={(ms) => String(ms)}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          initialScrollIndex={WEEK_SPAN}
          getItemLayout={(_, i) => ({ length: SCREEN_W, offset: SCREEN_W * i, index: i })}
          onScrollToIndexFailed={() => {}}
          renderItem={renderWeek}
        />
      </View>

      <View style={styles.dayHead}>
        <Text style={[styles.dayBig, { color: ink }]}>{WD_FULL[sel.getDay()]} {sel.getDate()}</Text>
        <Text style={[styles.daySub, { color: faint }]}>{MONTHS[sel.getMonth()]} {sel.getFullYear()} · {dayAppts.length} {dayAppts.length === 1 ? 'appointment' : 'appointments'}</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 28, paddingHorizontal: 12 }} showsVerticalScrollIndicator={false}>
        {hours.map((h) => {
          const list = byHour[h] || [];
          const expanded = expandedHour === h;
          return (
            <View key={h} style={[styles.slot, { borderTopColor: hair }]}>
              <Text style={[styles.hourLbl, { color: faint }]}>{hourLabel(h)}</Text>
              <View style={styles.slotContent}>
                {list.length === 0 ? (
                  <View style={{ height: 40 }} />
                ) : list.length === 1 ? (
                  ApptCard(list[0])
                ) : !expanded ? (
                  <Pressable onPress={() => setExpandedHour(h)} style={[styles.multi, { backgroundColor: cardBg, borderColor: 'rgba(22,104,227,0.35)' }]}>
                    <View style={styles.countBadge}><Text style={styles.countTxt}>{list.length}</Text></View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.multiTitle, { color: ink }]}>{list.length} appointments</Text>
                      <Text style={[styles.multiSub, { color: faint }]} numberOfLines={1}>{list.map((x) => fmtTime(x.dateTime)).join('  ·  ')}</Text>
                    </View>
                    <Ionicons name="chevron-down" size={18} color={faint} />
                  </Pressable>
                ) : (
                  <View>
                    <View style={styles.expHead}>
                      <Text style={[styles.expTitle, { color: ink }]}>{list.length} appointments</Text>
                      <Pressable onPress={() => setExpandedHour(null)} style={styles.backPill}>
                        <Ionicons name="chevron-up" size={14} color="#fff" />
                        <Text style={styles.backPillTxt}>Back</Text>
                      </Pressable>
                    </View>
                    {list.map((a) => ApptCard(a))}
                  </View>
                )}
              </View>
            </View>
          );
        })}
        {dayAppts.length === 0 ? (
          <Text style={[styles.empty, { color: faint }]}>No appointments · tap + to book</Text>
        ) : null}
      </ScrollView>

      <Modal transparent animationType="fade" visible={menuFor != null} onRequestClose={() => setMenuFor(null)}>
        <Pressable style={styles.menuDim} onPress={() => setMenuFor(null)}>
          <View style={[styles.menuPop, { left: Math.min(Math.max(12, menuPos.x - 24), SCREEN_W - 222), top: Math.min(menuPos.y + 4, SCREEN_H - 220) }]}>
            {menuFor && (
              <View style={[styles.previewCard, { backgroundColor: cardSolid }]}>
                <View style={[styles.apptBar, { backgroundColor: STATUS_COLOR[menuFor.status] || accent }]} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.evTime, { color: STATUS_COLOR[menuFor.status] || accent }]}>{fmtTime(menuFor.dateTime)}</Text>
                  <Text style={[styles.evWho, { color: ink }]} numberOfLines={1}>{menuFor.patientName || 'Patient'}</Text>
                  {!!menuFor.title && <Text style={[styles.evSes, { color: faint }]} numberOfLines={1}>{menuFor.title}</Text>}
                </View>
              </View>
            )}
            <Pressable onPress={onEdit} style={[styles.menuBtn, { backgroundColor: accent }]}>
              <Ionicons name="create-outline" size={15} color="#fff" />
              <Text style={styles.menuBtnTxt}>Edit</Text>
            </Pressable>
            <Pressable onPress={onDelete} style={[styles.menuBtn, { backgroundColor: cardSolid, marginTop: 8 }]}>
              <Ionicons name="trash-outline" size={15} color={danger} />
              <Text style={[styles.menuBtnTxt, { color: danger }]}>Delete</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      <NewAppointmentSheet
        visible={sheetOpen}
        initialDayMs={selectedMs}
        editing={editingAppt}
        clinicId={clinicId}
        memberId={memberId}
        onClose={() => { setSheetOpen(false); setEditingAppt(null); }}
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
  weekWrap: { height: 74, borderBottomWidth: 1 },
  wd: { flex: 1, alignItems: 'center', gap: 5, paddingTop: 4 },
  wdL: { fontSize: 10.5, fontWeight: '700' },
  wdD: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  wdDT: { fontSize: 15, fontWeight: '700' },
  wdDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: 'transparent' },
  dayHead: { paddingHorizontal: 18, paddingTop: 12, paddingBottom: 4 },
  dayBig: { fontSize: 22, fontWeight: '800', letterSpacing: -0.2 },
  daySub: { fontSize: 12.5, fontWeight: '600', marginTop: 1 },
  slot: { flexDirection: 'row', borderTopWidth: 1, paddingTop: 10, paddingBottom: 4, minHeight: 58 },
  hourLbl: { width: 52, fontSize: 11, fontWeight: '700', paddingTop: 2 },
  slotContent: { flex: 1, paddingLeft: 6 },
  appt: { flexDirection: 'row', borderWidth: 1, borderRadius: 13, padding: 11, gap: 8, marginBottom: 8, overflow: 'hidden' },
  apptBar: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4 },
  evTime: { fontSize: 11, fontWeight: '800' },
  evWho: { fontSize: 13.5, fontWeight: '800', marginTop: 1 },
  evSes: { fontSize: 11.5, fontWeight: '600', marginTop: 1 },
  evTag: { fontSize: 9, fontWeight: '800', textTransform: 'uppercase' },
  multi: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: 14, paddingVertical: 13, paddingHorizontal: 13, marginBottom: 8, marginTop: 4 },
  countBadge: { position: 'absolute', top: -8, left: -8, minWidth: 24, height: 24, paddingHorizontal: 6, borderRadius: 12, backgroundColor: '#1668E3', alignItems: 'center', justifyContent: 'center', shadowColor: '#1668E3', shadowOpacity: 0.5, shadowRadius: 6, shadowOffset: { width: 0, height: 3 } },
  countTxt: { color: '#fff', fontSize: 12, fontWeight: '800' },
  multiTitle: { fontSize: 14, fontWeight: '800' },
  multiSub: { fontSize: 11.5, fontWeight: '600', marginTop: 2 },
  expHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, marginTop: 2 },
  expTitle: { fontSize: 13, fontWeight: '800' },
  backPill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#1668E3', paddingHorizontal: 11, height: 30, borderRadius: 999 },
  backPillTxt: { color: '#fff', fontSize: 12.5, fontWeight: '800' },
  empty: { fontSize: 13, fontWeight: '600', textAlign: 'center', marginTop: 24 },
  menuDim: { flex: 1, backgroundColor: 'rgba(20,28,44,0.4)' },
  menuPop: { position: 'absolute', width: 210 },
  previewCard: { flexDirection: 'row', gap: 8, borderRadius: 14, padding: 10, marginBottom: 10, overflow: 'hidden', shadowColor: '#0b1220', shadowOpacity: 0.3, shadowRadius: 14, shadowOffset: { width: 0, height: 10 }, elevation: 10 },
  menuBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, height: 42, borderRadius: 13, shadowColor: '#0b1220', shadowOpacity: 0.28, shadowRadius: 12, shadowOffset: { width: 0, height: 8 }, elevation: 8 },
  menuBtnTxt: { color: '#fff', fontSize: 14, fontWeight: '800' },
});
