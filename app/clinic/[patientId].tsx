import { db } from '@/firebaseConfig';
import i18n from '@/i18n';
import { PremiumGradientBackground } from '@/src/components/PremiumGradientBackground';
import { DENTAL_SESSIONS } from '@/src/constants/sessions/dentalSessions';
import { useAuth } from '@/src/context/AuthContext';
import { useTheme } from '@/src/context/ThemeContext';
import { useClinicGuard } from '@/src/utils/navigationGuards';
import { localizeNumber } from '@/utils/localization';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { collection, doc, getDoc, onSnapshot, orderBy, query } from 'firebase/firestore';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const AVATAR_PALETTE: readonly (readonly [string, string])[] = [
  ['#4D9DFF', '#1E6BE6'],
  ['#A989FF', '#7C3AED'],
  ['#34DDB0', '#0EA37A'],
  ['#FF92B3', '#E0517E'],
  ['#FFC36B', '#F59E0B'],
  ['#7B8CFF', '#4F46E5'],
];

function hashName(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) {
    h = (h * 31 + name.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

type SessionDoc = { id: string; [k: string]: any };

function formatSessionDate(ms: number): string {
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

export default function PatientDetails() {
  useClinicGuard();
  const { patientId } = useLocalSearchParams();
  const { clinicId, userRole, loading: clinicLoading } = useAuth();
  const clinicUser = userRole === 'clinic';
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const isRTL = ['ar', 'he', 'fa', 'ur'].includes(i18n.language);

  const [patient, setPatient] = useState<any>(null);
  const [sessions, setSessions] = useState<SessionDoc[]>([]);
  const [copied, setCopied] = useState(false);

  const loadPatient = useCallback(() => {
    if (!clinicId || !patientId) return;
    const pRef = doc(db, 'clinics', clinicId, 'patients', patientId as string);
    getDoc(pRef)
      .then((snap) => {
        if (snap.exists()) setPatient({ id: snap.id, ...(snap.data() as any) });
        else setPatient(null);
      })
      .catch((e) => console.error('[patient] fetch error', e));
  }, [clinicId, patientId]);

  useFocusEffect(
    useCallback(() => {
      loadPatient();
    }, [loadPatient])
  );

  useEffect(() => {
    if (clinicLoading) return;
    if (!clinicUser) {
      router.replace('/login' as any);
      return;
    }
    if (!patientId) return;
    if (!clinicId) return;

    const q = query(
      collection(db, `clinics/${clinicId}/patients/${patientId}/sessions`),
      orderBy('date', 'desc')
    );
    const unsubSessions = onSnapshot(q, (snap) => {
      const docs = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
      setSessions(docs);
    });

    return () => {
      unsubSessions();
    };
  }, [patientId, clinicUser, clinicLoading, router, clinicId]);

  const handleBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/clinic/dashboard' as any);
  };

  const handleCopyCode = async () => {
    if (!patient?.code) return;
    await Clipboard.setStringAsync(String(patient.code));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  // Theme-derived tokens (mirror create.tsx)
  const textPrimary = colors.textPrimary;
  const textSecondary = colors.textSecondary;
  const textMuted = colors.textTertiary;
  const cardBg = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.45)';
  const cardBorder = isDark ? 'rgba(255,255,255,0.09)' : 'rgba(255,255,255,0.65)';
  const backBg = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.92)';
  const backBgPressed = isDark ? 'rgba(255,255,255,0.15)' : 'rgba(27, 37, 66, 0.1)';
  const backIconColor = isDark ? '#FFFFFF' : '#1B2542';

  const patientName = patient?.name?.trim() || 'Patient';
  const palette =
    AVATAR_PALETTE[hashName(patientName || '?') % AVATAR_PALETTE.length];

  return (
    <View style={{ flex: 1 }}>
      <Stack.Screen options={{ headerShown: false }} />
      <PremiumGradientBackground isDark={isDark} showSparkles={!isDark} />

      {/* Header */}
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
          <Text style={[styles.headerTitle, { color: textPrimary }]}>
            {t('patients.patient', { defaultValue: 'Patient' })}
          </Text>
        </View>

        <View style={styles.headerTrailing}>
          <Pressable
            onPress={() => router.push(`/clinic/patient-edit?patientId=${patientId}` as any)}
            style={({ pressed }) => [
              styles.headerBtn,
              { backgroundColor: pressed ? backBgPressed : backBg },
            ]}
          >
            <Ionicons name="settings-outline" size={20} color={backIconColor} />
          </Pressable>
          <Pressable
            onPress={() =>
              router.push(
                `/clinic/conversation?patientId=${patientId}&name=${encodeURIComponent(patientName)}` as any
              )
            }
            style={({ pressed }) => [
              styles.headerBtn,
              { backgroundColor: pressed ? backBgPressed : backBg },
            ]}
          >
            <Ionicons name="chatbubble-ellipses-outline" size={20} color={backIconColor} />
          </Pressable>
        </View>
      </View>

      {!patient ? (
        <View style={styles.center}>
          <ActivityIndicator color={textSecondary} />
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 32 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Centered patient block */}
          <View style={styles.patientBlock}>
            <LinearGradient
              colors={palette as any}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.avatar}
            >
              <Text style={styles.avatarInitials}>{initialsOf(patientName || '?')}</Text>
            </LinearGradient>

            <Text
              style={[
                styles.patientName,
                { color: textPrimary },
                isRTL && { writingDirection: 'rtl' },
              ]}
              numberOfLines={2}
            >
              {patientName}
            </Text>

            {patient.code ? (
              <View style={styles.codeRow}>
                <Text style={[styles.patientCode, { color: textSecondary }]}>
                  {t('patients.code', { defaultValue: 'Code: ' })}
                  {localizeNumber(patient.code)}
                </Text>
                <Pressable
                  onPress={handleCopyCode}
                  hitSlop={8}
                  style={({ pressed }) => [styles.copyBtn, pressed && { opacity: 0.6 }]}
                >
                  <Ionicons
                    name={copied ? 'checkmark-outline' : 'copy-outline'}
                    size={15}
                    color={copied ? '#10B981' : '#3D9EFF'}
                  />
                </Pressable>
                {copied ? (
                  <Text style={[styles.copiedLabel, { color: '#10B981' }]}>
                    {t('common.copied', { defaultValue: 'Copied' })}
                  </Text>
                ) : null}
              </View>
            ) : null}
          </View>

          {/* SESSIONS */}
          <View style={styles.eyebrowRow}>
            <Text style={[styles.eyebrow, { color: textSecondary }]}>SESSIONS</Text>
            <Text style={[styles.eyebrowCount, { color: textMuted }]}>
              {localizeNumber(String(sessions.length))}
            </Text>
          </View>
          {sessions.length === 0 ? (
            <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              <Text style={[styles.muted, { color: textMuted }]}>
                {t('patients.noSessionsYet', { defaultValue: 'No sessions yet' })}
              </Text>
            </View>
          ) : (
            <View style={{ gap: 8 }}>
              {sessions.map((s) => {
                const catalog = DENTAL_SESSIONS.find((d) => d.slug === s.templateSlug);
                const dateMs = typeof s.date === 'number' ? s.date : Number(s.date) || 0;
                const dateStr = dateMs ? formatSessionDate(dateMs) : '';
                const pill =
                  s.status === 'COMPLETED'
                    ? { label: 'Done', bg: 'rgba(16,185,129,0.12)', fg: '#0EA37A' }
                    : s.status === 'IN_PROGRESS'
                      ? { label: 'In progress', bg: 'rgba(245,158,11,0.14)', fg: '#B7791F' }
                      : { label: 'Planned', bg: 'rgba(27,37,66,0.08)', fg: textSecondary };
                return (
                  <Pressable
                    key={s.id}
                    onPress={() =>
                      router.push(
                        `/clinic/session-detail?sessionId=${encodeURIComponent(s.id)}&patientId=${encodeURIComponent(String(patientId))}&name=${encodeURIComponent(patientName)}` as any
                      )
                    }
                    style={({ pressed }) => [
                      styles.sessionRow,
                      { backgroundColor: cardBg, borderColor: cardBorder },
                      pressed && { opacity: 0.9 },
                    ]}
                  >
                    {catalog ? (
                      <Image
                        source={catalog.image}
                        style={{ width: 48, height: 48, borderRadius: 12 }}
                        resizeMode="cover"
                      />
                    ) : (
                      <View
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: 12,
                          backgroundColor: 'rgba(27,37,66,0.08)',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Ionicons name="medkit-outline" size={20} color={textMuted} />
                      </View>
                    )}
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text
                        style={[styles.sessionTitle, { color: textPrimary }]}
                        numberOfLines={1}
                      >
                        {s.title || 'Session'}
                      </Text>
                      {dateStr ? (
                        <Text
                          style={[styles.sessionDate, { color: textMuted }]}
                          numberOfLines={1}
                        >
                          {dateStr}
                        </Text>
                      ) : null}
                    </View>
                    <View style={styles.sessionRight}>
                      <Ionicons name="chevron-forward" size={18} color={textMuted} />
                      <View style={[styles.sessionPill, { backgroundColor: pill.bg }]}>
                        <Text style={[styles.sessionPillText, { color: pill.fg }]}>
                          {pill.label}
                        </Text>
                      </View>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}
        </ScrollView>
      )}

      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() =>
          router.push(
            `/clinic/sessions-dental?patientId=${patientId}&name=${encodeURIComponent(patientName)}` as any
          )
        }
        style={[styles.sessFabWrap, { bottom: insets.bottom + 24 }]}
      >
        <LinearGradient
          colors={['#3D9DFF', '#1668E3']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.sessFab}
        >
          <Ionicons name="add" size={30} color="#FFFFFF" />
        </LinearGradient>
      </TouchableOpacity>
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
  headerText: { flex: 1, paddingTop: 8 },
  headerTitle: { fontSize: 18, fontWeight: '800' },
  headerTrailing: {
    flexDirection: 'column',
    gap: 8,
  },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
    gap: 8,
  },

  patientBlock: {
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 18,
    gap: 10,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 5,
  },
  avatarInitials: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  patientName: {
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
  },
  patientCode: {
    fontSize: 13,
    fontWeight: '600',
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: 6,
  },
  copyBtn: {
    paddingHorizontal: 2,
    paddingVertical: 2,
  },
  copiedLabel: {
    fontSize: 11.5,
    fontWeight: '700',
  },

  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    marginBottom: 8,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  eyebrowCount: {
    fontSize: 12,
    fontWeight: '700',
  },

  card: {
    borderRadius: 22,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  muted: {
    fontSize: 13.5,
    textAlign: 'center',
  },

  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 18,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  sessionTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  sessionDate: {
    fontSize: 12.5,
    fontWeight: '600',
    marginTop: 2,
  },
  sessionRight: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 6,
  },
  sessionPill: {
    paddingHorizontal: 8,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sessionPillText: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.2,
  },

  sessFabWrap: {
    position: 'absolute',
    right: 20,
  },
  sessFab: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1668E3',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.45,
    shadowRadius: 18,
    elevation: 10,
  },
});
