import { db } from '@/firebaseConfig';
import i18n from '@/i18n';
import { PremiumGradientBackground } from '@/src/components/PremiumGradientBackground';
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
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
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

          {/* SESSIONS — placeholder for 7b */}
          <View style={styles.eyebrowRow}>
            <Text style={[styles.eyebrow, { color: textSecondary }]}>SESSIONS</Text>
            <Text style={[styles.eyebrowCount, { color: textMuted }]}>
              {localizeNumber(String(sessions.length))}
            </Text>
          </View>
          <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <Text style={[styles.muted, { color: textMuted }]}>
              {t('patients.noSessionsYet', { defaultValue: 'No sessions yet' })}
            </Text>
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
});
