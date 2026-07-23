import { db } from '@/firebaseConfig';
import PremiumGradientBackground from '@/src/components/PremiumGradientBackground';
import { useTheme } from '@/src/context/ThemeContext';
import { usePatientGuard } from '@/src/utils/navigationGuards';
import { localizeDate, localizeNumber } from '@/utils/localization';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { collection, doc, getDoc, onSnapshot, orderBy, query } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const toMillis = (v: any): number | null => {
  if (v == null) return null;
  if (typeof v === 'number') return v;
  if (typeof v?.toMillis === 'function') return v.toMillis();
  if (typeof v?.toDate === 'function') return v.toDate().getTime();
  if (typeof v?.seconds === 'number') return v.seconds * 1000;
  return null;
};

const formatTime = (v: any): string => {
  const ms = toMillis(v);
  return ms == null ? '' : new Date(ms).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export default function PatientView() {
  usePatientGuard();
  const { patientId: routePatientId } = useLocalSearchParams();
  const [patient, setPatient] = useState<any>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [authenticatedPatientId, setAuthenticatedPatientId] = useState<string | null>(null);
  const [clinicId, setClinicId] = useState<string | null>(null);
  const [clinicName, setClinicName] = useState<string>('');
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const router = useRouter();

  useEffect(() => {
    const loadPatientSession = async () => {
      try {
        const storedPatientId = await AsyncStorage.getItem('patientId');
        const storedClinicId = await AsyncStorage.getItem('patientClinicId');

        if (!storedPatientId) {
          router.replace('/patient' as any);
          return;
        }

        if (!storedClinicId) {
          router.replace('/patient' as any);
          return;
        }

        setAuthenticatedPatientId(storedPatientId);
        setClinicId(storedClinicId);

        if (routePatientId && routePatientId !== storedPatientId) {
          Alert.alert(t('common.error'), t('patient.accessDenied'));
          await AsyncStorage.removeItem('patientId');
          router.replace('/patient' as any);
          return;
        }

        const patientId = storedPatientId;

        const pRef = doc(db, 'clinics', storedClinicId, 'patients', patientId);
        const pSnap = await getDoc(pRef);
        if (pSnap.exists()) {
          const patientData = { id: pSnap.id, ...(pSnap.data() as any) };
          setPatient(patientData);

          if (patientData.clinicId) {
            try {
              const clinicRef = doc(db, 'clinics', patientData.clinicId);
              const clinicSnap = await getDoc(clinicRef);
              if (clinicSnap.exists()) {
                const clinicData = clinicSnap.data();
                setClinicName(clinicData.clinicName || '');
              }
            } catch (err) {
              console.error('Error fetching clinic name:', err);
            }
          }
        }

        setLoading(false);
      } catch (err) {
        console.error('patient view error', err);
        setLoading(false);
      }
    };

    loadPatientSession();
  }, [router, routePatientId, t]);

  useEffect(() => {
    if (!clinicId || !authenticatedPatientId) return;
    const sessionsQ = query(
      collection(db, `clinics/${clinicId}/patients/${authenticatedPatientId}/sessions`),
      orderBy('date', 'desc'),
    );
    const unsub = onSnapshot(sessionsQ, (snap) => {
      setSessions(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
    });
    return () => unsub();
  }, [clinicId, authenticatedPatientId]);

  const onLogout = async () => {
    try {
      await AsyncStorage.removeItem('patientId');
      await AsyncStorage.removeItem('patientClinicId');
      router.replace('/patient' as any);
    } catch (err) {
      console.error('logout error', err);
    }
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.accentBlue} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <PremiumGradientBackground isDark={isDark} />
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.screen}>
          <Text style={[styles.pageTitle, { color: colors.textPrimary }]}>Your Treatment</Text>

          <View style={styles.topbar}>
            <TouchableOpacity
              onPress={onLogout}
              style={[styles.logoutBtn, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
            >
              <Ionicons name="log-out-outline" size={18} color={colors.textSecondary} />
              <Text style={[styles.logoutText, { color: colors.textSecondary }]}>{t('patient.logout')}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/patient/conversation' as any)} activeOpacity={0.85}>
              <LinearGradient
                colors={['#54ACFF', '#1E6FD9']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.messagesBtn}
              >
                <Ionicons name="chatbubble-ellipses-outline" size={18} color="#fff" />
                <Text style={styles.messagesText}>{t('tabs.messages')}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <View style={[styles.idCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <View style={styles.nameRow}>
              <Text style={[styles.name, { color: colors.textPrimary }]}>{patient?.name}</Text>
              <Ionicons name="sparkles" size={16} color={colors.accentBlue} />
            </View>
            {clinicName ? (
              <View style={styles.clinicChip}>
                <Ionicons name="business-outline" size={13} color={colors.accentBlue} />
                <Text style={[styles.clinicChipText, { color: colors.accentBlue }]}>{clinicName}</Text>
              </View>
            ) : null}
            <View style={styles.metaRow}>
              <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                {t('patients.code')}
                <Text style={[styles.metaStrong, { color: colors.textPrimary }]}>{localizeNumber(patient?.code)}</Text>
              </Text>
              <Text style={[styles.metaMuted, { color: colors.textTertiary }]}>
                {'  ·  '}
                {t('patient.since', 'Patient since')} {localizeDate(patient?.createdAt)} · {formatTime(patient?.createdAt)}
              </Text>
            </View>
          </View>

          <View style={styles.secHead}>
            <Text style={[styles.secTitle, { color: colors.textPrimary }]}>{t('patient.sessions', 'Sessions')}</Text>
            <Text style={[styles.secCount, { color: colors.textSecondary }]}>{localizeNumber(sessions.length)}</Text>
          </View>

          <FlatList
            data={sessions}
            keyExtractor={(item: any) => item.id}
            contentContainerStyle={{ paddingBottom: 28 }}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <Text style={[styles.empty, { color: colors.textTertiary }]}>{t('patient.noSessions')}</Text>
            }
            renderItem={({ item }: any) => (
              <View style={[styles.sessionCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                <View style={styles.sessionBar} />
                <View style={styles.sessionIcon}>
                  <Ionicons name="document-text-outline" size={20} color={colors.accentBlue} />
                </View>
                <View style={styles.sessionMid}>
                  <Text style={[styles.sessionType, { color: colors.textPrimary }]} numberOfLines={1}>
                    {item.title}
                  </Text>
                </View>
                <View style={styles.sessionRight}>
                  <Text style={[styles.sessionDate, { color: colors.textSecondary }]}>{localizeDate(item.date)}</Text>
                  <Text style={[styles.sessionTime, { color: colors.textTertiary }]}>{formatTime(item.date)}</Text>
                </View>
              </View>
            )}
          />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  screen: { flex: 1, paddingHorizontal: 16, paddingTop: 8 },
  pageTitle: { fontSize: 22, fontWeight: '800', letterSpacing: -0.4, marginBottom: 12, paddingHorizontal: 2 },
  topbar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 14, paddingVertical: 11, paddingHorizontal: 16 },
  logoutText: { fontWeight: '700', fontSize: 15 },
  messagesBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 14, paddingVertical: 12, paddingHorizontal: 18 },
  messagesText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  idCard: { borderWidth: 1, borderRadius: 18, padding: 16 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  name: { fontSize: 21, fontWeight: '800', letterSpacing: -0.4 },
  clinicChip: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', marginTop: 8, backgroundColor: 'rgba(61,158,255,0.08)', paddingVertical: 5, paddingHorizontal: 11, borderRadius: 20 },
  clinicChipText: { fontWeight: '700', fontSize: 12.5 },
  metaRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', marginTop: 11 },
  metaText: { fontSize: 12, fontWeight: '600' },
  metaStrong: { fontWeight: '800' },
  metaMuted: { fontSize: 12, fontWeight: '700' },
  secHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 20, marginBottom: 12, paddingHorizontal: 2 },
  secTitle: { fontSize: 19, fontWeight: '800', letterSpacing: -0.3 },
  secCount: { fontSize: 12.5, fontWeight: '700' },
  empty: { textAlign: 'center', marginTop: 30, fontSize: 14, fontWeight: '600' },
  sessionCard: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: 16, padding: 14, paddingLeft: 12, marginBottom: 11 },
  sessionBar: { width: 5, alignSelf: 'stretch', borderRadius: 6, backgroundColor: '#3D9EFF' },
  sessionIcon: { width: 42, height: 42, borderRadius: 13, backgroundColor: 'rgba(61,158,255,0.08)', alignItems: 'center', justifyContent: 'center' },
  sessionMid: { flex: 1, minWidth: 0 },
  sessionType: { fontSize: 15.5, fontWeight: '800', letterSpacing: -0.2 },
  sessionRight: { alignItems: 'flex-end' },
  sessionDate: { fontSize: 13, fontWeight: '800' },
  sessionTime: { fontSize: 12, fontWeight: '700', marginTop: 2 },
});
