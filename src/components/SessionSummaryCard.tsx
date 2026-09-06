import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/src/context/ThemeContext';

type Summary = {
  title?: string;
  aftercare?: string;
  nextAppointmentAt?: number | null;
  sessionDate?: number | null;
  clinicName?: string | null;
  sessionId?: string;
};

function formatWhen(ms?: number | null): string {
  if (!ms) return 'Not scheduled yet';
  const d = new Date(ms);
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  let h = d.getHours();
  const m = d.getMinutes();
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  if (h === 0) h = 12;
  const mm = m < 10 ? '0' + m : '' + m;
  return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} · ${h}:${mm} ${ampm}`;
}

export default function SessionSummaryCard({ summary }: { summary?: Summary }) {
  const { colors, isDark } = useTheme() as any;
  const s = summary ?? {};
  const cardBg = isDark ? '#141E2D' : '#FFFFFF';
  const line = isDark ? 'rgba(255,255,255,0.08)' : '#E7EEF6';
  const faint = isDark ? '#7688A1' : '#8493AB';
  const ink = colors?.textPrimary ?? (isDark ? '#EAF1FB' : '#1B2542');
  const hasAftercare = !!(s.aftercare && s.aftercare.trim());
  const clinicName = s.clinicName || 'Clinic';
  const initial = (clinicName.trim()[0] || 'C').toUpperCase();

  return (
    <View style={[styles.card, { backgroundColor: cardBg, borderColor: isDark ? 'rgba(61,157,255,0.25)' : 'rgba(22,104,227,0.18)' }]}>
      <LinearGradient colors={['#3D9DFF', '#1668E3']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.head}>
        <View style={styles.circle} />
        <View style={styles.eyebrowRow}>
          <View style={styles.hbadge}><Ionicons name="sparkles" size={13} color="#FFFFFF" /></View>
          <Text style={styles.eyebrow}>SESSION SUMMARY</Text>
        </View>
        <Text style={styles.title} numberOfLines={2}>{s.title || 'Session'}</Text>
        {s.sessionDate ? <Text style={styles.headSub}>{formatWhen(s.sessionDate)}</Text> : null}
      </LinearGradient>

      <View style={styles.body}>
        {hasAftercare ? (
          <View style={styles.block}>
            <View style={styles.ic}><Ionicons name="medkit-outline" size={16} color="#1668E3" /></View>
            <View style={styles.blockText}>
              <Text style={[styles.k, { color: faint }]}>AFTERCARE</Text>
              <Text style={[styles.v, { color: ink }]}>{s.aftercare!.trim()}</Text>
            </View>
          </View>
        ) : null}

        <View style={[styles.block, hasAftercare ? { borderTopWidth: 1, borderTopColor: line } : null]}>
          <View style={styles.ic}><Ionicons name="calendar-outline" size={16} color="#1668E3" /></View>
          <View style={styles.blockText}>
            <Text style={[styles.k, { color: faint }]}>NEXT APPOINTMENT</Text>
            <Text style={styles.vAppt}>{formatWhen(s.nextAppointmentAt)}</Text>
          </View>
        </View>
      </View>

      <View style={[styles.foot, { borderTopColor: line, backgroundColor: isDark ? 'rgba(61,157,255,0.06)' : 'rgba(22,104,227,0.05)' }]}>
        <View style={styles.cava}><Text style={styles.cavaText}>{initial}</Text></View>
        <Text style={[styles.cname, { color: ink }]} numberOfLines={1}>{clinicName}</Text>
        <View style={styles.sent}>
          <Ionicons name="checkmark" size={12} color="#10B981" />
          <Text style={styles.sentText}>Sent</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { width: 272, borderRadius: 20, overflow: 'hidden', borderWidth: 1 },
  head: { position: 'relative', paddingHorizontal: 15, paddingTop: 14, paddingBottom: 14, overflow: 'hidden' },
  circle: { position: 'absolute', right: -28, top: -36, width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(255,255,255,0.12)' },
  eyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  hbadge: { width: 24, height: 24, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.22)', alignItems: 'center', justifyContent: 'center' },
  eyebrow: { color: 'rgba(255,255,255,0.92)', fontSize: 10.5, fontWeight: '800', letterSpacing: 1.2 },
  title: { color: '#FFFFFF', fontSize: 18, fontWeight: '800', marginTop: 9 },
  headSub: { color: 'rgba(255,255,255,0.82)', fontSize: 11.5, fontWeight: '600', marginTop: 3 },
  body: { paddingHorizontal: 15 },
  block: { flexDirection: 'row', gap: 11, paddingVertical: 12 },
  ic: { width: 32, height: 32, borderRadius: 10, backgroundColor: 'rgba(22,104,227,0.10)', alignItems: 'center', justifyContent: 'center' },
  blockText: { flex: 1 },
  k: { fontSize: 10.5, fontWeight: '800', letterSpacing: 0.8 },
  v: { fontSize: 13.5, marginTop: 3, lineHeight: 20, fontWeight: '500' },
  vAppt: { fontSize: 14, marginTop: 3, fontWeight: '800', color: '#1668E3' },
  foot: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 15, paddingVertical: 11, borderTopWidth: 1 },
  cava: { width: 22, height: 22, borderRadius: 7, backgroundColor: '#1668E3', alignItems: 'center', justifyContent: 'center' },
  cavaText: { color: '#FFFFFF', fontSize: 10, fontWeight: '800' },
  cname: { fontSize: 11.5, fontWeight: '800', flex: 1 },
  sent: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  sentText: { color: '#0F9D6E', fontSize: 11, fontWeight: '700' },
});
