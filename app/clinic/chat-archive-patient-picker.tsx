import { db } from '@/firebaseConfig';
import { PremiumGradientBackground } from '@/src/components/PremiumGradientBackground';
import { useAuth } from '@/src/context/AuthContext';
import { useTheme } from '@/src/context/ThemeContext';
import { useClinicGuard } from '@/src/utils/navigationGuards';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useFocusEffect, useRouter } from 'expo-router';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
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
};

export default function ChatArchivePatientPickerScreen() {
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
          };
        });
      setPatients(list);
    } catch (err) {
      console.error('[chat-archive-picker] fetch error', err);
    } finally {
      setLoading(false);
    }
  }, [clinicId, clinicUser, router]);

  useFocusEffect(
    useCallback(() => {
      loadPatients();
    }, [loadPatients])
  );

  const textPrimary = colors.textPrimary;
  const textSecondary = colors.textSecondary;
  const textMuted = colors.textTertiary;
  const cardBg = isDark ? 'rgba(255,255,255,0.015)' : 'rgba(255,255,255,0.18)';
  const cardBorder = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.45)';
  const rowPressedBg = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.32)';
  const backBg = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.92)';
  const backBgPressed = isDark ? 'rgba(255,255,255,0.15)' : 'rgba(27, 37, 66, 0.1)';
  const backIconColor = isDark ? '#FFFFFF' : '#1B2542';

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
            <Text style={[styles.headerTitle, { color: textPrimary }]}>Chat archive</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={textSecondary} />
          </View>
        ) : patients.length === 0 ? (
          <View style={styles.center}>
            <Ionicons name="people-outline" size={46} color={textSecondary} />
            <Text style={[styles.emptyText, { color: textSecondary }]}>No patients yet</Text>
          </View>
        ) : (
          <FlatList
            data={patients}
            keyExtractor={(p) => p.id}
            contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 4, paddingBottom: insets.bottom + 24 }}
            renderItem={({ item: p }) => {
              const palette = AVATAR_PALETTE[hashName(p.name || '?') % AVATAR_PALETTE.length];
              return (
                <Pressable
                  onPress={() =>
                    router.push(
                      `/clinic/patient-archive?patientId=${p.id}&name=${encodeURIComponent(p.name)}` as any,
                    )
                  }
                  style={({ pressed }) => [
                    styles.row,
                    { backgroundColor: pressed ? rowPressedBg : cardBg, borderColor: cardBorder },
                  ]}
                >
                  <LinearGradient
                    colors={palette as any}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.avatar}
                  >
                    <Text style={styles.avatarInitials}>{initialsOf(p.name || '?')}</Text>
                  </LinearGradient>
                  <View style={styles.rowBody}>
                    <Text style={[styles.rowName, { color: textPrimary }]} numberOfLines={1}>
                      {p.name}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={textMuted} />
                </Pressable>
              );
            }}
          />
        )}
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
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, gap: 12 },
  emptyText: { fontSize: 15, fontWeight: '600' },
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
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  rowBody: { flex: 1 },
  rowName: { fontSize: 16, fontWeight: '700' },
});
