import { db } from '@/firebaseConfig';
import { PremiumGradientBackground } from '@/src/components/PremiumGradientBackground';
import { useAuth } from '@/src/context/AuthContext';
import { useTheme } from '@/src/context/ThemeContext';
import { useClinicGuard } from '@/src/utils/navigationGuards';
import { ensureThread } from '@/src/utils/threadsHelper';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { deleteField, doc, onSnapshot, setDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function PatientArchiveScreen() {
  useClinicGuard();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { clinicId } = useAuth();
  const { patientId, name } = useLocalSearchParams<{ patientId: string; name?: string }>();

  const [archived, setArchived] = useState(false);

  useEffect(() => {
    if (!clinicId || !patientId) return;
    const unsub = onSnapshot(
      doc(db, 'threads', `${clinicId}_${patientId}`),
      (snap) => {
        setArchived(snap.exists() && (snap.data() as any).archivedForClinic === true);
      },
      (e) => console.error('[patient-archive] snapshot', e),
    );
    return () => unsub();
  }, [clinicId, patientId]);

  const onToggle = async (next: boolean) => {
    if (!clinicId || !patientId) return;
    setArchived(next);
    const ref = doc(db, 'threads', `${clinicId}_${patientId}`);
    try {
      if (next) {
        await ensureThread(clinicId as string, patientId as string, (name as string) || 'Patient');
        await setDoc(ref, { archivedForClinic: true }, { merge: true });
      } else {
        await setDoc(ref, { archivedForClinic: deleteField() }, { merge: true });
      }
    } catch (e) {
      console.error('[patient-archive] toggle', e);
      setArchived(!next);
    }
  };

  const textPrimary = colors.textPrimary;
  const textSecondary = colors.textSecondary;
  const textMuted = colors.textTertiary;
  const cardBg = isDark ? 'rgba(255,255,255,0.015)' : 'rgba(255,255,255,0.18)';
  const cardBorder = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.45)';
  const backBg = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.92)';
  const backBgPressed = isDark ? 'rgba(255,255,255,0.15)' : 'rgba(27, 37, 66, 0.1)';
  const backIconColor = isDark ? '#FFFFFF' : '#1B2542';

  const patientName = (name as string) || 'Patient';

  return (
    <View style={{ flex: 1 }}>
      <Stack.Screen options={{ headerShown: false }} />
      <PremiumGradientBackground isDark={isDark} showSparkles={!isDark} />

      <View style={{ flex: 1, paddingTop: insets.top + 6 }}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [
              styles.headerBtn,
              { backgroundColor: pressed ? backBgPressed : backBg },
            ]}
          >
            <Ionicons name="chevron-back" size={22} color={backIconColor} />
          </Pressable>
          <View style={styles.headerText}>
            <Text style={[styles.headerTitle, { color: textPrimary }]}>Archive chat</Text>
            <Text style={[styles.headerSubtitle, { color: textSecondary }]} numberOfLines={1}>
              {patientName}
            </Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.content}>
          <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <View style={styles.row}>
              <View style={styles.iconWrap}>
                <Ionicons name="archive-outline" size={20} color={textSecondary} />
              </View>
              <View style={styles.rowBody}>
                <Text style={[styles.rowLabel, { color: textPrimary }]}>Archive this chat</Text>
                <Text style={[styles.rowSub, { color: textMuted }]}>
                  Archived chats move to the Archived folder. Turn off to bring this chat back to your list.
                </Text>
              </View>
              <Switch
                value={archived}
                onValueChange={onToggle}
                trackColor={{ false: isDark ? '#3A3F47' : '#D1D5DB', true: '#3D9EFF' }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 10,
    gap: 12,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  headerText: { flex: 1 },
  headerTitle: { fontSize: 22, fontWeight: '800' },
  headerSubtitle: { fontSize: 13, fontWeight: '600', marginTop: 1 },
  content: { paddingHorizontal: 16, paddingTop: 8 },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(120,120,120,0.10)',
  },
  rowBody: { flex: 1, gap: 2 },
  rowLabel: { fontSize: 15, fontWeight: '700' },
  rowSub: { fontSize: 12.5, lineHeight: 17 },
});
