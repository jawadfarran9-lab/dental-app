import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/src/context/ThemeContext';

type Appt = { appointmentId?: string; dateTime?: number; title?: string; status?: string; clinicName?: string | null };

function formatWhen(ms?: number): { d: string; t: string } {
  if (!ms) return { d: 'Not scheduled', t: '' };
  const dt = new Date(ms);
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  let h = dt.getHours(); const m = dt.getMinutes(); const ap = h >= 12 ? 'PM' : 'AM'; h = h % 12; if (h === 0) h = 12;
  return { d: `${days[dt.getDay()]}, ${dt.getDate()} ${months[dt.getMonth()]}`, t: `${h}:${m < 10 ? '0' + m : m} ${ap}` };
}

export default function AppointmentCard({ appointment, viewerRole, onConfirm, onDecline }: {
  appointment?: Appt;
  viewerRole: 'clinic' | 'patient';
  onConfirm?: () => void;
  onDecline?: () => void;
}) {
  const { colors, isDark } = useTheme() as any;
  const a = appointment ?? {};
  const cardBg = isDark ? '#141E2D' : '#FFFFFF';
  const faint = isDark ? '#7688A1' : '#8493AB';
  const ink = colors?.textPrimary ?? (isDark ? '#EAF1FB' : '#1B2542');
  const when = formatWhen(a.dateTime);
  const status = a.status || 'proposed';

  return (
    <View style={[styles.card, { backgroundColor: cardBg, borderColor: isDark ? 'rgba(61,157,255,0.25)' : 'rgba(22,104,227,0.18)' }]}>
      <LinearGradient colors={['#3D9DFF', '#1668E3']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.head}>
        <View style={styles.circle} />
        <View style={styles.eyebrowRow}>
          <View style={styles.badge}><Ionicons name="calendar-outline" size={13} color="#FFFFFF" /></View>
          <Text style={styles.eyebrow}>APPOINTMENT</Text>
        </View>
        <Text style={styles.when}>{when.d}{when.t ? <Text style={styles.whenSub}>{'\n'}at {when.t}</Text> : null}</Text>
      </LinearGradient>

      {a.title ? (
        <View style={styles.body}>
          <View style={styles.brow}>
            <View style={styles.ic}><Ionicons name="pricetag-outline" size={15} color="#1668E3" /></View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.k, { color: faint }]}>SESSION</Text>
              <Text style={[styles.v, { color: ink }]} numberOfLines={1}>{a.title}</Text>
            </View>
          </View>
        </View>
      ) : null}

      {status === 'confirmed' ? (
        <View style={[styles.state, { backgroundColor: 'rgba(16,185,129,0.12)' }]}>
          <Ionicons name="checkmark-circle" size={17} color="#10B981" />
          <Text style={[styles.stateTxt, { color: '#0F9D6E' }]}>Confirmed · see you then</Text>
        </View>
      ) : status === 'cancelled' ? (
        <View style={[styles.state, { backgroundColor: 'rgba(229,72,77,0.10)' }]}>
          <Ionicons name="close-circle" size={17} color="#E5484D" />
          <Text style={[styles.stateTxt, { color: '#E5484D' }]}>Declined</Text>
        </View>
      ) : status === 'requested' ? (
        viewerRole === 'clinic' ? (
          <View style={{ paddingHorizontal: 14, paddingBottom: 14, paddingTop: 4 }}>
            <Text style={[styles.ask, { color: faint }]}>Please approve this request</Text>
            <View style={styles.acts}>
              <Pressable onPress={onConfirm} style={[styles.btn, { backgroundColor: '#10B981' }]}>
                <Ionicons name="checkmark" size={16} color="#fff" />
                <Text style={styles.btnTxt}>Approve</Text>
              </Pressable>
              <Pressable onPress={onDecline} style={[styles.btn, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(27,37,66,0.06)' }]}>
                <Text style={[styles.btnTxt, { color: faint }]}>Decline</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <View style={[styles.state, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(27,37,66,0.04)' }]}>
            <Ionicons name="time-outline" size={16} color={faint} />
            <Text style={[styles.stateTxt, { color: faint }]}>Waiting for clinic to approve</Text>
          </View>
        )
      ) : viewerRole === 'patient' ? (
        <View style={{ paddingHorizontal: 14, paddingBottom: 14, paddingTop: 4 }}>
          <Text style={[styles.ask, { color: faint }]}>Please confirm this appointment</Text>
          <View style={styles.acts}>
            <Pressable onPress={onConfirm} style={[styles.btn, { backgroundColor: '#10B981' }]}>
              <Ionicons name="checkmark" size={16} color="#fff" />
              <Text style={styles.btnTxt}>Confirm</Text>
            </Pressable>
            <Pressable onPress={onDecline} style={[styles.btn, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(27,37,66,0.06)' }]}>
              <Text style={[styles.btnTxt, { color: faint }]}>Decline</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <View style={[styles.state, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(27,37,66,0.04)' }]}>
          <Ionicons name="time-outline" size={16} color={faint} />
          <Text style={[styles.stateTxt, { color: faint }]}>Waiting for patient to confirm</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { width: 268, borderRadius: 20, overflow: 'hidden', borderWidth: 1 },
  head: { position: 'relative', paddingHorizontal: 15, paddingTop: 14, paddingBottom: 14, overflow: 'hidden' },
  circle: { position: 'absolute', right: -28, top: -36, width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(255,255,255,0.12)' },
  eyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  badge: { width: 24, height: 24, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.22)', alignItems: 'center', justifyContent: 'center' },
  eyebrow: { color: 'rgba(255,255,255,0.92)', fontSize: 10.5, fontWeight: '800', letterSpacing: 1.2 },
  when: { color: '#FFFFFF', fontSize: 19, fontWeight: '800', marginTop: 9 },
  whenSub: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.85)' },
  body: { paddingHorizontal: 15 },
  brow: { flexDirection: 'row', gap: 11, paddingVertical: 11 },
  ic: { width: 30, height: 30, borderRadius: 9, backgroundColor: 'rgba(22,104,227,0.10)', alignItems: 'center', justifyContent: 'center' },
  k: { fontSize: 10, fontWeight: '800', letterSpacing: 0.8 },
  v: { fontSize: 13.5, fontWeight: '700', marginTop: 2 },
  ask: { fontSize: 12, fontWeight: '700', textAlign: 'center', marginBottom: 8 },
  acts: { flexDirection: 'row', gap: 9 },
  btn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 44, borderRadius: 13 },
  btnTxt: { color: '#fff', fontSize: 13.5, fontWeight: '800' },
  state: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, margin: 12, marginTop: 4, paddingVertical: 12, borderRadius: 13 },
  stateTxt: { fontSize: 13.5, fontWeight: '800' },
});
