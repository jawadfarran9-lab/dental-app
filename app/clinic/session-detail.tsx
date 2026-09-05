import { db } from '@/firebaseConfig';
import { PremiumGradientBackground } from '@/src/components/PremiumGradientBackground';
import { DENTAL_SESSIONS } from '@/src/constants/sessions/dentalSessions';
import { useAuth } from '@/src/context/AuthContext';
import { useTheme } from '@/src/context/ThemeContext';
import { useClinicGuard } from '@/src/utils/navigationGuards';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { doc, onSnapshot } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const ACCENT = '#1668E3';
const DONE_GREEN = '#0EA37A';
const AMBER = '#B7791F';

function formatWhen(ms: number): string {
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
  const h = d.getHours();
  const m = d.getMinutes();
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${day} · ${h12}:${m.toString().padStart(2, '0')} ${ampm}`;
}

function formatFullDate(ms: number): string {
  const d = new Date(ms);
  return d.toLocaleString([], {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

type MainDoc = {
  id?: string;
  title?: string;
  date?: number;
  status?: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  templateSlug?: string;
  templateName?: string;
  patientSummary?: string;
  aftercare?: string;
  nextAppointmentAt?: number | null;
  toothAreas?: string[];
};

type PrivateDoc = {
  materialsUsed?: string;
  internalNotes?: string;
  doctorId?: string;
  createdBy?: string;
  createdAt?: number;
};

export default function SessionDetailScreen() {
  useClinicGuard();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { clinicId } = useAuth();
  const { sessionId, patientId, name: patientName } = useLocalSearchParams<{
    sessionId: string;
    patientId: string;
    name?: string;
  }>();

  const [main, setMain] = useState<MainDoc | null>(null);
  const [priv, setPriv] = useState<PrivateDoc | null>(null);
  const [mainLoading, setMainLoading] = useState(true);
  const [mainMissing, setMainMissing] = useState(false);

  useEffect(() => {
    if (!clinicId || !patientId || !sessionId) return;
    const mainRef = doc(
      db,
      `clinics/${clinicId}/patients/${patientId}/sessions/${sessionId}`
    );
    const unsub = onSnapshot(mainRef, (snap) => {
      if (snap.exists()) {
        setMain(snap.data() as MainDoc);
        setMainMissing(false);
      } else {
        setMain(null);
        setMainMissing(true);
      }
      setMainLoading(false);
    });
    return () => unsub();
  }, [clinicId, patientId, sessionId]);

  useEffect(() => {
    if (!clinicId || !patientId || !sessionId) return;
    const privateRef = doc(
      db,
      `clinics/${clinicId}/patients/${patientId}/sessions/${sessionId}/private/main`
    );
    const unsub = onSnapshot(
      privateRef,
      (snap) => {
        if (snap.exists()) setPriv(snap.data() as PrivateDoc);
        else setPriv(null);
      },
      () => setPriv(null)
    );
    return () => unsub();
  }, [clinicId, patientId, sessionId]);

  const textPrimary = colors.textPrimary;
  const textSecondary = colors.textSecondary;
  const muted = colors.textTertiary;
  const backBg = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.92)';
  const backBgPressed = isDark ? 'rgba(255,255,255,0.15)' : 'rgba(27, 37, 66, 0.1)';
  const backIconColor = isDark ? '#FFFFFF' : '#1B2542';
  const cardBg = isDark ? 'rgba(255,255,255,0.06)' : '#FFFFFF';
  const cardBorder = isDark ? 'rgba(255,255,255,0.09)' : 'rgba(27, 37, 66, 0.08)';
  const chipBg = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(22, 104, 227, 0.10)';
  const chipFg = ACCENT;
  const privateCardBg = isDark ? 'rgba(20, 30, 55, 0.6)' : 'rgba(240, 244, 251, 0.85)';
  const privateBorder = isDark ? 'rgba(255,255,255,0.09)' : 'rgba(27, 37, 66, 0.12)';

  const handleBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/clinic/dashboard' as any);
  };
  const handleEdit = () => {
    Alert.alert('Edit', 'Coming next');
    // TODO Stage 2b
  };

  const catalog = main?.templateSlug
    ? DENTAL_SESSIONS.find((d) => d.slug === main.templateSlug)
    : undefined;

  const status = main?.status;
  const pill =
    status === 'COMPLETED'
      ? { label: 'Done', bg: 'rgba(16,185,129,0.14)', fg: DONE_GREEN }
      : status === 'IN_PROGRESS'
        ? { label: 'In progress', bg: 'rgba(245,158,11,0.14)', fg: AMBER }
        : { label: 'Planned', bg: 'rgba(27,37,66,0.08)', fg: textSecondary };

  return (
    <View style={{ flex: 1 }}>
      <Stack.Screen options={{ headerShown: false }} />
      <PremiumGradientBackground isDark={isDark} showSparkles={!isDark} />

      <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
        <Pressable
          onPress={handleBack}
          style={({ pressed }) => [
            styles.headerBtn,
            { backgroundColor: pressed ? backBgPressed : backBg },
          ]}
        >
          <Ionicons name="chevron-back" size={22} color={backIconColor} />
        </Pressable>
        <View style={styles.headerText}>
          <Text style={[styles.headerTitle, { color: textPrimary }]}>Session</Text>
          {patientName ? (
            <Text style={[styles.headerSubtitle, { color: muted }]} numberOfLines={1}>
              for {patientName}
            </Text>
          ) : null}
        </View>
        <Pressable
          onPress={handleEdit}
          style={({ pressed }) => [
            styles.headerBtn,
            { backgroundColor: pressed ? backBgPressed : backBg },
          ]}
        >
          <Ionicons name="create-outline" size={20} color={backIconColor} />
        </Pressable>
      </View>

      {mainLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={textSecondary} />
        </View>
      ) : mainMissing || !main ? (
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={28} color={textSecondary} />
          <Text style={[styles.emptyText, { color: textSecondary }]}>
            Session not found
          </Text>
        </View>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: 4,
            paddingBottom: insets.bottom + 24,
            gap: 14,
          }}
          showsVerticalScrollIndicator={false}
        >
          {/* Top card */}
          <View
            style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}
          >
            <View style={styles.topRow}>
              {catalog ? (
                <Image
                  source={catalog.image}
                  style={{ width: 64, height: 64, borderRadius: 14 }}
                  resizeMode="cover"
                />
              ) : (
                <View
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 14,
                    backgroundColor: 'rgba(27,37,66,0.08)',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name="medkit-outline" size={22} color={muted} />
                </View>
              )}
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text
                  style={[styles.title, { color: textPrimary }]}
                  numberOfLines={2}
                >
                  {main.title || 'Session'}
                </Text>
                <View style={styles.metaRow}>
                  <View style={[styles.pill, { backgroundColor: pill.bg }]}>
                    <Text style={[styles.pillText, { color: pill.fg }]}>
                      {pill.label}
                    </Text>
                  </View>
                  {main.date ? (
                    <Text style={[styles.metaWhen, { color: muted }]} numberOfLines={1}>
                      {formatWhen(main.date)}
                    </Text>
                  ) : null}
                </View>
              </View>
            </View>
          </View>

          {/* Tooth / area */}
          {main.toothAreas && main.toothAreas.length > 0 ? (
            <View
              style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}
            >
              <Text style={[styles.cardEyebrow, { color: muted }]}>TOOTH / AREA</Text>
              <View style={styles.chipsWrap}>
                {main.toothAreas.map((v) => (
                  <View key={v} style={[styles.chip, { backgroundColor: chipBg }]}>
                    <Text style={[styles.chipText, { color: chipFg }]}>{v}</Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          {/* What was done */}
          {main.patientSummary && main.patientSummary.trim().length > 0 ? (
            <View
              style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}
            >
              <View style={styles.cardHeadRow}>
                <Text style={[styles.cardEyebrow, { color: muted }]}>WHAT WAS DONE</Text>
                <View style={[styles.tag, { backgroundColor: 'rgba(22, 104, 227, 0.10)' }]}>
                  <Ionicons name="eye-outline" size={11} color={ACCENT} />
                  <Text style={[styles.tagText, { color: ACCENT }]}>patient sees</Text>
                </View>
              </View>
              <Text style={[styles.body, { color: textPrimary }]}>
                {main.patientSummary}
              </Text>
            </View>
          ) : null}

          {/* For the patient */}
          {(main.aftercare && main.aftercare.trim().length > 0) ||
          main.nextAppointmentAt ? (
            <View
              style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}
            >
              <View style={styles.cardHeadRow}>
                <Text style={[styles.cardEyebrow, { color: muted }]}>FOR THE PATIENT</Text>
                <View style={[styles.tag, { backgroundColor: 'rgba(22, 104, 227, 0.10)' }]}>
                  <Ionicons name="eye-outline" size={11} color={ACCENT} />
                  <Text style={[styles.tagText, { color: ACCENT }]}>patient sees</Text>
                </View>
              </View>
              {main.aftercare && main.aftercare.trim().length > 0 ? (
                <>
                  <Text style={[styles.fieldLabel, { color: muted }]}>Aftercare</Text>
                  <Text style={[styles.body, { color: textPrimary }]}>{main.aftercare}</Text>
                </>
              ) : null}
              {main.nextAppointmentAt ? (
                <>
                  <Text style={[styles.fieldLabel, { color: muted, marginTop: 10 }]}>
                    Next appointment
                  </Text>
                  <Text style={[styles.body, { color: textPrimary }]}>
                    {formatWhen(main.nextAppointmentAt)}
                  </Text>
                </>
              ) : null}
            </View>
          ) : null}

          {/* Clinic only */}
          <View
            style={[
              styles.card,
              { backgroundColor: privateCardBg, borderColor: privateBorder },
            ]}
          >
            <View style={styles.cardHeadRow}>
              <Text style={[styles.cardEyebrow, { color: muted }]}>CLINIC ONLY</Text>
              <View style={[styles.tag, { backgroundColor: 'rgba(27,37,66,0.08)' }]}>
                <Ionicons name="lock-closed-outline" size={11} color={textSecondary} />
                <Text style={[styles.tagText, { color: textSecondary }]}>not shared</Text>
              </View>
            </View>
            {priv?.materialsUsed && priv.materialsUsed.trim().length > 0 ? (
              <>
                <Text style={[styles.fieldLabel, { color: muted }]}>Materials / anaesthesia</Text>
                <Text style={[styles.body, { color: textPrimary }]}>{priv.materialsUsed}</Text>
              </>
            ) : null}
            {/* TODO: show doctor name in the doctor-record stage */}
            {priv?.createdAt ? (
              <>
                <Text style={[styles.fieldLabel, { color: muted, marginTop: 10 }]}>
                  Created
                </Text>
                <Text style={[styles.body, { color: textPrimary }]}>
                  {formatFullDate(priv.createdAt)}
                </Text>
              </>
            ) : null}
            {!priv?.materialsUsed && !priv?.createdAt ? (
              <Text style={[styles.body, { color: muted }]}>No clinic-only notes.</Text>
            ) : null}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingBottom: 12,
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
  headerText: { flex: 1, paddingTop: 4 },
  headerTitle: { fontSize: 18, fontWeight: '800' },
  headerSubtitle: { fontSize: 13, marginTop: 2, fontWeight: '600' },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  emptyText: { fontSize: 14, fontWeight: '600' },

  card: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  topRow: { flexDirection: 'row', gap: 14, alignItems: 'center' },
  title: { fontSize: 18, fontWeight: '800' },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
    flexWrap: 'wrap',
  },
  metaWhen: { fontSize: 12.5, fontWeight: '600' },

  pill: {
    paddingHorizontal: 10,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.2 },

  cardHeadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  cardEyebrow: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.4,
  },
  fieldLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    marginBottom: 4,
  },
  body: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },

  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    height: 22,
    borderRadius: 11,
  },
  tagText: { fontSize: 10.5, fontWeight: '800', letterSpacing: 0.2 },

  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  chip: {
    paddingHorizontal: 12,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipText: { fontSize: 12.5, fontWeight: '800' },
});
