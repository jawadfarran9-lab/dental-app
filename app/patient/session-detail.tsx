import { patientDb } from '@/firebaseConfig';
import { DENTAL_SESSIONS } from '@/src/constants/sessions/dentalSessions';
import PremiumGradientBackground from '@/src/components/PremiumGradientBackground';
import { useTheme } from '@/src/context/ThemeContext';
import { usePatientAuthReady } from '@/src/hooks/usePatientAuthReady';
import { usePatientGuard } from '@/src/utils/navigationGuards';
import { localizeDate } from '@/utils/localization';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { doc, onSnapshot } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

const ACCENT = '#3D9EFF';
const ACCENT_BG = 'rgba(61,158,255,0.08)';

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
  return ms == null
    ? ''
    : new Date(ms).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

function formatWhen(v: any): string {
  const ms = toMillis(v);
  if (ms == null) return '';
  const d = new Date(ms);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  const y = new Date(now);
  y.setDate(now.getDate() - 1);
  const isYesterday = d.toDateString() === y.toDateString();
  let day: string;
  if (sameDay) day = 'Today';
  else if (isYesterday) day = 'Yesterday';
  else day = d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  return `${day} · ${formatTime(ms)}`;
}

function HeartPulseIcon({ size = 18, color = ACCENT }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7z" />
      <Path d="M3.2 11.5h5l1.2-2 2 4 1.3-2h6.1" />
    </Svg>
  );
}

type MainDoc = {
  title?: string;
  date?: any;
  status?: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  patientSummary?: string;
  aftercare?: string;
  nextAppointmentAt?: number | null;
  createdAt?: any;
  templateSlug?: string;
};

export default function PatientSessionDetail() {
  usePatientGuard();
  const patientAuthReady = usePatientAuthReady();
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();

  const [authenticatedPatientId, setAuthenticatedPatientId] = useState<string | null>(null);
  const [clinicId, setClinicId] = useState<string | null>(null);
  const [identityReady, setIdentityReady] = useState(false);

  const [main, setMain] = useState<MainDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!patientAuthReady) return;
    (async () => {
      try {
        const [storedPatientId, storedClinicId] = await Promise.all([
          AsyncStorage.getItem('patientId'),
          AsyncStorage.getItem('patientClinicId'),
        ]);
        if (!storedPatientId || !storedClinicId) {
          router.replace('/patient' as any);
          return;
        }
        setAuthenticatedPatientId(storedPatientId);
        setClinicId(storedClinicId);
        setIdentityReady(true);
      } catch {
        router.replace('/patient' as any);
      }
    })();
  }, [patientAuthReady, router]);

  useEffect(() => {
    if (!identityReady || !clinicId || !authenticatedPatientId || !sessionId) return;
    const ref = doc(
      patientDb,
      `clinics/${clinicId}/patients/${authenticatedPatientId}/sessions/${sessionId}`
    );
    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data() as any;
          // Whitelist patient-visible fields only.
          const whitelisted: MainDoc = {
            title: data.title,
            date: data.date,
            status: data.status,
            patientSummary: data.patientSummary,
            aftercare: data.aftercare,
            nextAppointmentAt: data.nextAppointmentAt,
            createdAt: data.createdAt,
            templateSlug: data.templateSlug,
          };
          setMain(whitelisted);
          setNotFound(false);
        } else {
          setMain(null);
          setNotFound(true);
        }
        setLoading(false);
      },
      () => {
        setLoading(false);
        setNotFound(true);
      }
    );
    return () => unsub();
  }, [identityReady, clinicId, authenticatedPatientId, sessionId]);

  const catalog = main?.templateSlug
    ? DENTAL_SESSIONS.find((s) => s.slug === main.templateSlug)
    : undefined;

  const status = main?.status;
  const pill =
    status === 'COMPLETED'
      ? { label: t('patient.session.done', 'Done'), bg: 'rgba(16,185,129,0.14)', fg: '#0EA37A' }
      : status === 'IN_PROGRESS'
        ? { label: t('patient.session.inProgress', 'In progress'), bg: 'rgba(245,158,11,0.14)', fg: '#B7791F' }
        : { label: t('patient.session.planned', 'Planned'), bg: 'rgba(27,37,66,0.08)', fg: colors.textSecondary };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <PremiumGradientBackground isDark={isDark} showSparkles={!isDark} />
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.screen}>
          <View style={styles.topbar}>
            <Pressable
              onPress={() => (router.canGoBack() ? router.back() : router.replace('/patient' as any))}
              style={({ pressed }) => [
                styles.backBtn,
                { borderColor: colors.cardBorder, backgroundColor: colors.card },
                pressed && { opacity: 0.75 },
              ]}
            >
              <Ionicons name="chevron-back" size={18} color={colors.textPrimary} />
              <Text style={[styles.backText, { color: colors.textPrimary }]}>
                {t('common.back', 'Back')}
              </Text>
            </Pressable>
          </View>

          {loading ? (
            <View style={styles.center}>
              <ActivityIndicator color={colors.textSecondary} />
            </View>
          ) : notFound || !main ? (
            <View style={styles.center}>
              <Ionicons name="alert-circle-outline" size={28} color={colors.textSecondary} />
              <Text style={[styles.empty, { color: colors.textSecondary }]}>
                {t('patient.session.notFound', 'Session not found')}
              </Text>
            </View>
          ) : (
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{ paddingBottom: 28 }}
              showsVerticalScrollIndicator={false}
            >
              {/* Hero card */}
              <View
                style={[
                  styles.card,
                  { backgroundColor: colors.card, borderColor: colors.cardBorder },
                ]}
              >
                <View style={styles.sessionBar} />
                {catalog ? (
                  <Image
                    source={catalog.image}
                    style={{ width: 58, height: 58, borderRadius: 14 }}
                    resizeMode="cover"
                  />
                ) : (
                  <View
                    style={{
                      width: 58,
                      height: 58,
                      borderRadius: 14,
                      backgroundColor: ACCENT_BG,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Ionicons name="document-text-outline" size={22} color={ACCENT} />
                  </View>
                )}
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text
                    style={[styles.title, { color: colors.textPrimary }]}
                    numberOfLines={2}
                  >
                    {main.title || t('patient.session.title', 'Session')}
                  </Text>
                  <View style={styles.metaRow}>
                    <View style={[styles.pill, { backgroundColor: pill.bg }]}>
                      <Text style={[styles.pillText, { color: pill.fg }]}>{pill.label}</Text>
                    </View>
                    {main.date ? (
                      <Text
                        style={[styles.metaWhen, { color: colors.textTertiary }]}
                        numberOfLines={1}
                      >
                        {formatWhen(main.date)}
                      </Text>
                    ) : null}
                  </View>
                </View>
              </View>

              {/* What was done */}
              {main.patientSummary && main.patientSummary.trim().length > 0 ? (
                <View
                  style={[
                    styles.card,
                    styles.cardStack,
                    { backgroundColor: colors.card, borderColor: colors.cardBorder },
                  ]}
                >
                  <View style={styles.sessionBar} />
                  <View style={styles.iconPill}>
                    <Ionicons name="checkmark-circle-outline" size={20} color={ACCENT} />
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
                      {t('patient.session.whatWasDone', 'What was done')}
                    </Text>
                    <Text style={[styles.body, { color: colors.textSecondary }]}>
                      {main.patientSummary}
                    </Text>
                  </View>
                </View>
              ) : null}

              {/* Aftercare */}
              {main.aftercare && main.aftercare.trim().length > 0 ? (
                <View
                  style={[
                    styles.card,
                    styles.cardStack,
                    { backgroundColor: colors.card, borderColor: colors.cardBorder },
                  ]}
                >
                  <View style={styles.sessionBar} />
                  <View style={styles.iconPill}>
                    <HeartPulseIcon size={18} color={ACCENT} />
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
                      {t('patient.session.aftercare', 'Aftercare')}
                    </Text>
                    <Text style={[styles.body, { color: colors.textSecondary }]}>
                      {main.aftercare}
                    </Text>
                  </View>
                </View>
              ) : null}

              {/* Next appointment */}
              {main.nextAppointmentAt != null ? (
                <View
                  style={[
                    styles.card,
                    styles.cardStack,
                    { backgroundColor: colors.card, borderColor: colors.cardBorder },
                  ]}
                >
                  <View style={styles.sessionBar} />
                  <View style={styles.iconPill}>
                    <Ionicons name="calendar-outline" size={18} color={ACCENT} />
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
                      {t('patient.session.nextAppointment', 'Next appointment')}
                    </Text>
                    <Text style={[styles.body, { color: colors.textSecondary }]}>
                      {formatWhen(main.nextAppointmentAt)}
                    </Text>
                  </View>
                </View>
              ) : null}

              {/* Booked on */}
              <View
                style={[
                  styles.card,
                  styles.cardStack,
                  { backgroundColor: colors.card, borderColor: colors.cardBorder },
                ]}
              >
                <View style={styles.sessionBar} />
                <View style={styles.iconPill}>
                  <Ionicons name="time-outline" size={18} color={ACCENT} />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
                    {t('patient.session.bookedOn', 'Booked on')}
                  </Text>
                  <Text style={[styles.body, { color: colors.textSecondary }]}>
                    {localizeDate(main.createdAt)} · {formatTime(main.createdAt)}
                  </Text>
                </View>
              </View>
            </ScrollView>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  empty: { fontSize: 14, fontWeight: '600' },
  screen: { flex: 1, paddingHorizontal: 16, paddingTop: 8 },
  topbar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 9,
    paddingLeft: 10,
    paddingRight: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  backText: { fontWeight: '700', fontSize: 14 },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    paddingLeft: 12,
  },
  cardStack: { marginTop: 11 },
  sessionBar: {
    width: 5,
    alignSelf: 'stretch',
    borderRadius: 6,
    backgroundColor: ACCENT,
  },
  iconPill: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: ACCENT_BG,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 17, fontWeight: '800', letterSpacing: -0.2 },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
    flexWrap: 'wrap',
  },
  pill: {
    paddingHorizontal: 10,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.2 },
  metaWhen: { fontSize: 12.5, fontWeight: '700' },

  cardTitle: { fontSize: 15, fontWeight: '800', marginBottom: 4 },
  body: { fontSize: 14, fontWeight: '500', lineHeight: 20 },
});
