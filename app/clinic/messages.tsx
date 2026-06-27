import { db } from '@/firebaseConfig';
import { PremiumGradientBackground } from '@/src/components/PremiumGradientBackground';
import { useClinic } from '@/src/context/ClinicContext';
import { useTheme } from '@/src/context/ThemeContext';
import { useClinicGuard } from '@/src/utils/navigationGuards';
import { localizeNumber } from '@/utils/localization';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useFocusEffect, useRouter } from 'expo-router';
import { collection, getDocs, orderBy, query, where } from 'firebase/firestore';
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

function formatLastAt(ts: any): string {
  if (!ts) return '';
  const date =
    typeof ts?.toDate === 'function' ? ts.toDate() : ts instanceof Date ? ts : new Date(ts);
  if (!date || Number.isNaN(date.getTime())) return '';
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();
  if (sameDay) {
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  }
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return date.toLocaleDateString();
}

type ThreadRow = {
  id: string;
  patientId: string;
  name: string;
  lastMessage: string;
  lastAt: any;
  unread: number;
};

export default function ClinicMessagesScreen() {
  useClinicGuard();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { clinicId, clinicUser, loading: clinicLoading } = useClinic();

  const [tab, setTab] = useState<'patients' | 'people'>('patients');
  const [threads, setThreads] = useState<ThreadRow[]>([]);
  const [loading, setLoading] = useState(true);

  const loadThreads = useCallback(async () => {
    if (clinicLoading) return;
    if (!clinicUser) {
      router.replace('/clinic/login' as any);
      return;
    }
    if (!clinicId) {
      setLoading(false);
      return;
    }
    try {
      const ref = collection(db, 'threads');
      const snap = await getDocs(
        query(ref, where('clinicId', '==', clinicId), orderBy('lastMessageAt', 'desc'))
      );
      const list: ThreadRow[] = snap.docs.map((d) => {
        const data = d.data() as any;
        const fallbackPatientId = d.id.includes('_') ? d.id.split('_').slice(1).join('_') : d.id;
        return {
          id: d.id,
          patientId: data.patientId ?? fallbackPatientId,
          name: data.patientName ?? 'Patient',
          lastMessage: data.lastMessageText ?? '',
          lastAt: data.lastMessageAt,
          unread: data.unreadForClinic ?? 0,
        };
      });
      setThreads(list);
    } catch (err) {
      console.error('[clinic/messages] fetch error', err);
    } finally {
      setLoading(false);
    }
  }, [clinicId, clinicUser, clinicLoading, router]);

  useFocusEffect(
    useCallback(() => {
      loadThreads();
    }, [loadThreads])
  );

  const handleBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/clinic/dashboard' as any);
  };

  const textPrimary = colors.textPrimary;
  const textSecondary = colors.textSecondary;
  const textMuted = colors.textTertiary;

  const cardBg = isDark ? 'rgba(255,255,255,0.015)' : 'rgba(255,255,255,0.18)';
  const cardBorder = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.45)';
  const rowPressedBg = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.32)';

  const backBg = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.92)';
  const backBgPressed = isDark ? 'rgba(255,255,255,0.15)' : 'rgba(27, 37, 66, 0.1)';
  const backIconColor = isDark ? '#FFFFFF' : '#1B2542';

  const segBg = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.55)';
  const segBorder = isDark ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.7)';
  const segInactiveText = isDark ? 'rgba(255,255,255,0.78)' : '#1B2542';
  const segCountBg = isDark ? 'rgba(255,255,255,0.10)' : 'rgba(27,37,66,0.08)';

  const renderTab = (key: 'patients' | 'people', label: string, count: number) => {
    const active = tab === key;
    const inner = (
      <View style={styles.segRow}>
        <Text
          style={[
            styles.segLabel,
            { color: active ? '#FFFFFF' : segInactiveText },
          ]}
        >
          {label}
        </Text>
        <View
          style={[
            styles.segCount,
            {
              backgroundColor: active ? 'rgba(255,255,255,0.22)' : segCountBg,
            },
          ]}
        >
          <Text
            style={[
              styles.segCountText,
              { color: active ? '#FFFFFF' : segInactiveText },
            ]}
          >
            {localizeNumber(String(count))}
          </Text>
        </View>
      </View>
    );
    return (
      <Pressable
        key={key}
        onPress={() => setTab(key)}
        style={styles.segBtn}
      >
        {active ? (
          <LinearGradient
            colors={['#4DA3FF', '#1E6FD9']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.segBtnInner}
          >
            {inner}
          </LinearGradient>
        ) : (
          <View style={styles.segBtnInner}>{inner}</View>
        )}
      </Pressable>
    );
  };

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
            <Text style={[styles.headerTitle, { color: textPrimary }]}>Messages</Text>
          </View>
          <View style={styles.headerSpacer} />
        </View>

        {/* Tabs */}
        <View style={styles.segWrap}>
          <View
            style={[
              styles.segContainer,
              { backgroundColor: segBg, borderColor: segBorder },
            ]}
          >
            {renderTab('patients', 'Patients', threads.length)}
            {renderTab('people', 'People', 0)}
          </View>
        </View>

        {/* Body */}
        {tab === 'patients' ? (
          loading ? (
            <View style={styles.center}>
              <ActivityIndicator color={textSecondary} />
            </View>
          ) : threads.length === 0 ? (
            <View style={styles.center}>
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
                  <Ionicons name="chatbubble-ellipses-outline" size={26} color="#3D9EFF" />
                </View>
                <Text style={[styles.emptyTitle, { color: textPrimary }]}>No messages yet</Text>
                <Text style={[styles.emptySub, { color: textMuted }]}>
                  When patients message you, their conversations will appear here.
                </Text>
              </View>
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
              {threads.map((t) => {
                const palette =
                  AVATAR_PALETTE[hashName(t.name || '?') % AVATAR_PALETTE.length];
                const timeLabel = formatLastAt(t.lastAt);
                return (
                  <Pressable
                    key={t.id}
                    onPress={() =>
                      router.push(
                        `/clinic/conversation?patientId=${t.patientId}&name=${encodeURIComponent(t.name)}` as any
                      )
                    }
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
                      style={styles.avatar}
                    >
                      <Text style={styles.avatarInitials}>{initialsOf(t.name || '?')}</Text>
                    </LinearGradient>

                    <View style={styles.rowText}>
                      <View style={styles.rowTopLine}>
                        <Text
                          style={[styles.rowName, { color: textPrimary }]}
                          numberOfLines={1}
                        >
                          {t.name}
                        </Text>
                        {!!timeLabel && (
                          <Text style={[styles.rowTime, { color: textMuted }]} numberOfLines={1}>
                            {timeLabel}
                          </Text>
                        )}
                      </View>
                      <View style={styles.rowBottomLine}>
                        <Text
                          style={[styles.rowPreview, { color: textSecondary }]}
                          numberOfLines={1}
                        >
                          {t.lastMessage || ' '}
                        </Text>
                        {t.unread > 0 && (
                          <LinearGradient
                            colors={['#4DA3FF', '#1E6FD9']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.unreadBadge}
                          >
                            <Text style={styles.unreadText}>
                              {localizeNumber(String(t.unread))}
                            </Text>
                          </LinearGradient>
                        )}
                      </View>
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
          )
        ) : (
          <View style={styles.center}>
            <View
              style={[
                styles.emptyCard,
                { backgroundColor: cardBg, borderColor: cardBorder },
              ]}
            >
              <View
                style={[
                  styles.emptyIconWrap,
                  { backgroundColor: 'rgba(169,137,255,0.18)' },
                ]}
              >
                <Ionicons name="people-outline" size={26} color="#A989FF" />
              </View>
              <Text style={[styles.emptyTitle, { color: textPrimary }]}>No messages yet</Text>
              <Text style={[styles.emptySub, { color: textMuted }]}>
                When visitors message you from your public profile, they&apos;ll appear here.
              </Text>
            </View>
          </View>
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
  headerSpacer: { width: 40, height: 40 },

  segWrap: {
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 12,
  },
  segContainer: {
    flexDirection: 'row',
    borderRadius: 14,
    borderWidth: 1,
    padding: 4,
    gap: 4,
  },
  segBtn: {
    flex: 1,
    borderRadius: 11,
    overflow: 'hidden',
  },
  segBtnInner: {
    paddingVertical: 9,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  segLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  segCount: {
    minWidth: 22,
    paddingHorizontal: 7,
    paddingVertical: 1,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segCountText: {
    fontSize: 11.5,
    fontWeight: '800',
  },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },

  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 2,
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
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  rowText: { flex: 1, gap: 4 },
  rowTopLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rowName: { flex: 1, fontSize: 16, fontWeight: '700' },
  rowTime: { fontSize: 12, fontWeight: '600' },
  rowBottomLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rowPreview: { flex: 1, fontSize: 13.5 },
  unreadBadge: {
    minWidth: 22,
    height: 22,
    paddingHorizontal: 7,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '800',
  },

  emptyCard: {
    borderRadius: 22,
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingVertical: 24,
    alignItems: 'center',
    gap: 10,
    maxWidth: 360,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  emptyIconWrap: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  emptySub: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
});
