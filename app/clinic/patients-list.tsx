import { db } from '@/firebaseConfig';
import { PremiumGradientBackground } from '@/src/components/PremiumGradientBackground';
import { useAuth } from '@/src/context/AuthContext';
import { useTheme } from '@/src/context/ThemeContext';
import { useClinicGuard } from '@/src/utils/navigationGuards';
import { localizeNumber } from '@/utils/localization';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useFocusEffect, useRouter } from 'expo-router';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
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

type PatientRow = {
  id: string;
  name: string;
  code?: string;
};

export default function PatientsListScreen() {
  useClinicGuard();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { clinicId, userRole } = useAuth();
  const clinicUser = userRole === 'clinic';

  const [patients, setPatients] = useState<PatientRow[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPatients = useCallback(async () => {
    if (!clinicUser) {
      router.replace('/login' as any);
      return;
    }
    if (!clinicId) {
      setLoading(false);
      return;
    }
    try {
      const ref = collection(db, 'clinics', clinicId, 'patients');
      const snap = await getDocs(query(ref, orderBy('createdAt', 'desc')));
      const list: PatientRow[] = snap.docs
        .filter((d) => (d.data() as any).archived !== true)
        .map((d) => {
          const data = d.data() as any;
          return {
            id: d.id,
            name: data.name || data.patientName || 'Unnamed',
            code: data.code,
          };
        });
      setPatients(list);
    } catch (err) {
      console.error('[patients-list] fetch error', err);
    } finally {
      setLoading(false);
    }
  }, [clinicId, clinicUser, router]);

  useFocusEffect(
    useCallback(() => {
      loadPatients();
    }, [loadPatients])
  );

  const handleBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/clinic/dashboard' as any);
  };

  const textPrimary = colors.textPrimary;
  const textSecondary = colors.textSecondary;
  const textMuted = colors.textTertiary;
  const cardBg = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.45)';
  const cardBorder = isDark ? 'rgba(255,255,255,0.09)' : 'rgba(255,255,255,0.65)';
  const backBg = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.92)';
  const backBgPressed = isDark ? 'rgba(255,255,255,0.15)' : 'rgba(27, 37, 66, 0.1)';
  const backIconColor = isDark ? '#FFFFFF' : '#1B2542';
  const lockedIconColor = isDark ? 'rgba(255,255,255,0.85)' : '#1B2542';
  const countChipBg = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.65)';
  const countChipBorder = isDark ? 'rgba(255,255,255,0.10)' : 'rgba(230,236,246,0.9)';
  const rowPressedBg = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.7)';

  return (
    <View style={{ flex: 1 }}>
      <Stack.Screen options={{ headerShown: false }} />
      <PremiumGradientBackground isDark={isDark} showSparkles={!isDark} />

      <View style={{ flex: 1, paddingTop: insets.top + 6 }}>
        {/* Header */}
        <View style={styles.header}>
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
              Patient Records
            </Text>
            <Text style={[styles.headerSubtitle, { color: textSecondary }]}>
              View and manage patient data
            </Text>
          </View>

          <LockedHeaderButton
            icon="download-outline"
            backBg={backBg}
            iconColor={lockedIconColor}
          />
        </View>

        {/* Body */}
        {loading ? (
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
            <View style={styles.eyebrowRow}>
              <Text style={[styles.eyebrow, { color: textSecondary }]}>
                PATIENTS
              </Text>
              <View
                style={[
                  styles.countChip,
                  { backgroundColor: countChipBg, borderColor: countChipBorder },
                ]}
              >
                <Text style={[styles.countChipText, { color: textSecondary }]}>
                  {localizeNumber(String(patients.length))}
                </Text>
              </View>
            </View>

            {patients.length === 0 ? (
              <View
                style={[
                  styles.emptyCard,
                  { backgroundColor: cardBg, borderColor: cardBorder },
                ]}
              >
                <View
                  style={[
                    styles.emptyIconWrap,
                    { backgroundColor: 'rgba(61,158,255,0.16)' },
                  ]}
                >
                  <Ionicons name="people-outline" size={26} color="#3D9EFF" />
                </View>
                <Text style={[styles.emptyTitle, { color: textPrimary }]}>
                  No patients yet
                </Text>
                <Text style={[styles.emptySub, { color: textMuted }]}>
                  Patients you add will show up here.
                </Text>
              </View>
            ) : (
              patients.map((p) => {
                const palette =
                  AVATAR_PALETTE[hashName(p.name || '?') % AVATAR_PALETTE.length];
                return (
                  <Pressable
                    key={p.id}
                    onPress={() => router.push(`/clinic/patient-edit?patientId=${p.id}` as any)}
                    style={({ pressed }) => [
                      styles.row,
                      {
                        backgroundColor: pressed ? rowPressedBg : cardBg,
                        borderColor: cardBorder,
                      },
                    ]}
                  >
                    <LinearGradient
                      colors={palette as any}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.rowAvatar}
                    >
                      <Text style={styles.rowAvatarInitials}>
                        {initialsOf(p.name || '?')}
                      </Text>
                    </LinearGradient>

                    <View style={styles.rowText}>
                      <Text
                        style={[styles.rowName, { color: textPrimary }]}
                        numberOfLines={1}
                      >
                        {p.name}
                      </Text>
                      <View style={styles.rowCodeLine}>
                        <Ionicons
                          name="card-outline"
                          size={12}
                          color={textMuted}
                        />
                        <Text
                          style={[styles.rowCode, { color: textSecondary }]}
                          numberOfLines={1}
                        >
                          Code: {p.code ? localizeNumber(p.code) : '—'}
                        </Text>
                      </View>
                    </View>

                    <Ionicons
                      name="chevron-forward"
                      size={18}
                      color={textMuted}
                    />
                  </Pressable>
                );
              })
            )}
          </ScrollView>
        )}
      </View>
    </View>
  );
}

function LockedHeaderButton({
  icon,
  backBg,
  iconColor,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  backBg: string;
  iconColor: string;
}) {
  return (
    <Pressable
      onPress={() => {}}
      style={[styles.headerBtn, styles.headerBtnLocked, { backgroundColor: backBg }]}
    >
      <Ionicons name={icon} size={20} color={iconColor} />
      <View style={styles.lockBadge}>
        <Ionicons name="lock-closed" size={9} color="#FFFFFF" />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
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
  headerBtnLocked: {
    opacity: 0.5,
  },
  headerText: { flex: 1 },
  headerTitle: { fontSize: 21, fontWeight: '800', marginBottom: 2 },
  headerSubtitle: { fontSize: 12.5 },
  lockBadge: {
    position: 'absolute',
    top: -3,
    right: -3,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(91,107,130,0.95)',
    borderWidth: 1,
    borderColor: 'rgba(18,24,46,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
  },

  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 10,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  countChip: {
    minWidth: 28,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countChipText: {
    fontSize: 11.5,
    fontWeight: '800',
    letterSpacing: 0.4,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 11,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  rowAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowAvatarInitials: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  rowText: { flex: 1, gap: 3 },
  rowName: { fontSize: 17, fontWeight: '700' },
  rowCodeLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  rowCode: { fontSize: 12.5, fontWeight: '600' },

  emptyCard: {
    borderRadius: 22,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 22,
    alignItems: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  emptyIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  emptySub: {
    fontSize: 13,
    textAlign: 'center',
  },
});
