import { db } from '@/firebaseConfig';
import { PremiumGradientBackground } from '@/src/components/PremiumGradientBackground';
import { useAuth } from '@/src/context/AuthContext';
import { useTheme } from '@/src/context/ThemeContext';
import { useClinicGuard } from '@/src/utils/navigationGuards';
import { localizeNumber } from '@/utils/localization';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useFocusEffect, useRouter } from 'expo-router';
import { collection, deleteField, doc, getDocs, limit, orderBy, query, setDoc, where } from 'firebase/firestore';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    Image,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput, useWindowDimensions, View
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

function compactPreviewLabel(m: any): string {
  if (m?.type === 'image') return 'Photo';
  if (m?.type === 'video') return '🎬 Video';
  if (m?.type === 'audio') return '🎤 Voice message';
  if (m?.type === 'album') {
    const n = Array.isArray(m.media) ? m.media.length : 0;
    const hasVideo = Array.isArray(m.media) && m.media.some((it: any) => it?.kind === 'video');
    return hasVideo ? `📷 ${n} media` : `📷 ${n} photos`;
  }
  return m?.text ?? '';
}

function formatAudioDuration(ms?: number | null): string {
  const s = Math.max(0, Math.round((ms ?? 0) / 1000));
  const mm = Math.floor(s / 60);
  const ss = String(s % 60).padStart(2, '0');
  return `${mm}:${ss}`;
}

type ThreadRow = {
  id: string;
  patientId: string;
  name: string;
  lastMessage: string;
  lastAt: any;
  unread: number;
  messageCount: number;
  favoriteClinic?: boolean;
};

export default function ClinicMessagesScreen() {
  useClinicGuard();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { clinicId, userRole, loading: clinicLoading } = useAuth();
  const clinicUser = userRole === 'clinic';
  const { height: windowHeight } = useWindowDimensions();
  const SHEET_HEIGHT = Math.round(windowHeight * 0.75);

  const [tab, setTab] = useState<'patients' | 'people'>('patients');
  const [chip, setChip] = useState<'all' | 'unread' | 'favourites'>('all');
  const [menuThread, setMenuThread] = useState<ThreadRow | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuMessages, setMenuMessages] = useState<any[] | null>(null);
  const [menuMessagesLoading, setMenuMessagesLoading] = useState(false);
  const menuScale = useRef(new Animated.Value(0.9)).current;
  const menuFade = useRef(new Animated.Value(0)).current;
  const [threads, setThreads] = useState<ThreadRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [allPatients, setAllPatients] = useState<{ id: string; name: string }[]>([]);
  const [patientsLoading, setPatientsLoading] = useState(false);
  const [search, setSearch] = useState('');

  const loadThreads = useCallback(async () => {
    if (clinicLoading) return;
    if (!clinicUser) {
      router.replace('/login' as any);
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
          name: String(data.patientName ?? '').trim() || 'Patient',
          lastMessage: data.lastMessageText ?? '',
          lastAt: data.lastMessageAt,
          unread: data.unreadForClinic ?? 0,
          messageCount: data.messageCount ?? 0,
          favoriteClinic: (data.favoriteClinic === true),
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

  const openThreadMenu = (t: ThreadRow) => {
    setMenuThread(t);
    setMenuMessages(null);
    setMenuMessagesLoading(true);
    setMenuOpen(true);
    getDocs(query(
      collection(db, `patients/${t.patientId}/messages`),
      orderBy('createdAt', 'desc'),
      limit(6),
    ))
      .then((snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })).reverse();
        setMenuMessages(list);
      })
      .catch((e) => { console.error('[messages] mini preview', e); setMenuMessages([]); })
      .finally(() => setMenuMessagesLoading(false));
  };
  const closeMenu = () => {
    setMenuOpen(false);
    setMenuMessages(null);
    setMenuMessagesLoading(false);
  };

  const toggleFavorite = async (t: ThreadRow) => {
    const next = !t.favoriteClinic;
    setThreads((prev) => prev.map((row) => (row.id === t.id ? { ...row, favoriteClinic: next } : row)));
    setMenuThread((cur) => (cur && cur.id === t.id ? { ...cur, favoriteClinic: next } : cur));
    try {
      await setDoc(
        doc(db, 'threads', t.id),
        { favoriteClinic: next ? true : deleteField() },
        { merge: true },
      );
    } catch (e) {
      console.error('[messages] toggleFavorite', e);
      setThreads((prev) => prev.map((row) => (row.id === t.id ? { ...row, favoriteClinic: !next } : row)));
      setMenuThread((cur) => (cur && cur.id === t.id ? { ...cur, favoriteClinic: !next } : cur));
    }
  };

  useEffect(() => {
    if (menuOpen) {
      menuScale.setValue(0.92);
      menuFade.setValue(0);
      Animated.parallel([
        Animated.spring(menuScale, { toValue: 1, useNativeDriver: true, friction: 7, tension: 80 }),
        Animated.timing(menuFade, { toValue: 1, duration: 150, useNativeDriver: true }),
      ]).start();
    }
  }, [menuOpen]);

  const handleBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/clinic/dashboard' as any);
  };

  const loadAllPatients = useCallback(async () => {
    if (!clinicId) return;
    try {
      setPatientsLoading(true);
      const ref = collection(db, 'clinics', clinicId, 'patients');
      const snap = await getDocs(query(ref, orderBy('createdAt', 'desc')));
      const list = snap.docs
        .filter((d) => (d.data() as any).archived !== true)
        .map((d) => {
          const data = d.data() as any;
          return { id: d.id, name: data.name || data.patientName || 'Unnamed' };
        });
      setAllPatients(list);
    } catch (e) {
      console.error('[messages] loadAllPatients error', e);
    } finally {
      setPatientsLoading(false);
    }
  }, [clinicId]);

  const openPicker = () => { setSearch(''); setPickerVisible(true); loadAllPatients(); };
  const closePicker = () => { setPickerVisible(false); setSearch(''); };

  const pickPatient = (p: { id: string; name: string }) => {
    closePicker();
    router.push(`/clinic/conversation?patientId=${p.id}&name=${encodeURIComponent(p.name)}` as any);
  };

  const textPrimary = colors.textPrimary;
  const textSecondary = colors.textSecondary;
  const textMuted = colors.textTertiary;

  const cardBg = isDark ? 'rgba(255,255,255,0.015)' : 'rgba(255,255,255,0.18)';
  const cardBorder = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.45)';
  const rowPressedBg = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.32)';
  const recvMiniBg = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)';
  const recvMiniBorder = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)';

  const backBg = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.92)';
  const backBgPressed = isDark ? 'rgba(255,255,255,0.15)' : 'rgba(27, 37, 66, 0.1)';
  const backIconColor = isDark ? '#FFFFFF' : '#1B2542';

  const segBg = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.55)';
  const segBorder = isDark ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.7)';
  const segInactiveText = isDark ? 'rgba(255,255,255,0.78)' : '#1B2542';
  const segCountBg = isDark ? 'rgba(255,255,255,0.10)' : 'rgba(27,37,66,0.08)';

  const sheetBg = isDark ? '#141C2F' : '#F7FAFF';
  const sheetHandleColor = isDark ? 'rgba(255,255,255,0.15)' : 'rgba(27,37,66,0.12)';
  const sheetSearchBg = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)';
  const sheetSearchBorder = isDark ? 'rgba(255,255,255,0.10)' : 'rgba(27,37,66,0.08)';
  const sheetInputPlaceholder = isDark ? 'rgba(255,255,255,0.40)' : 'rgba(27,37,66,0.35)';
  const sheetDivider = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(27,37,66,0.06)';

  const filteredPatients = search.trim()
    ? allPatients.filter((p) => p.name.toLowerCase().includes(search.trim().toLowerCase()))
    : allPatients;

  const patientThreads = threads;
  const unreadCount = patientThreads.filter((t) => (t.unread ?? 0) > 0).length;
  const favCount = patientThreads.filter((t) => t.favoriteClinic === true).length;
  const filteredThreads =
    chip === 'unread' ? patientThreads.filter((t) => (t.unread ?? 0) > 0)
    : chip === 'favourites' ? patientThreads.filter((t) => t.favoriteClinic === true)
    : patientThreads;

  const renderChip = (key: 'all' | 'unread' | 'favourites', label: string, count?: number) => {
    const active = chip === key;
    const inner = (
      <View style={styles.chipInner}>
        <Text style={[styles.chipText, { color: active ? '#FFFFFF' : segInactiveText }]}>
          {label}
        </Text>
        {typeof count === 'number' && count > 0 ? (
          <View style={[styles.chipCount, { backgroundColor: active ? 'rgba(255,255,255,0.22)' : segCountBg }]}>
            <Text style={[styles.chipCountText, { color: active ? '#FFFFFF' : segInactiveText }]}>
              {localizeNumber(String(count))}
            </Text>
          </View>
        ) : null}
      </View>
    );
    return (
      <Pressable key={key} onPress={() => setChip(key)} style={styles.chip}>
        {active ? (
          <LinearGradient
            colors={['#4DA3FF', '#1E6FD9']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.chipPill}
          >
            {inner}
          </LinearGradient>
        ) : (
          <View style={[styles.chipPill, { backgroundColor: segBg, borderColor: segBorder, borderWidth: 1 }]}>
            {inner}
          </View>
        )}
      </Pressable>
    );
  };

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
          <Pressable
            onPress={openPicker}
            style={({ pressed }) => [
              styles.headerBtn,
              { backgroundColor: pressed ? backBgPressed : backBg },
            ]}
          >
            <Ionicons name="create-outline" size={22} color={backIconColor} />
          </Pressable>
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

        {/* Filter chips (Patients only) */}
        {tab === 'patients' ? (
          <View style={styles.chipRow}>
            {renderChip('all', 'All')}
            {renderChip('unread', 'Unread', unreadCount)}
            {renderChip('favourites', 'Favourites', favCount)}
          </View>
        ) : null}

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
          ) : filteredThreads.length === 0 ? (
            <View style={styles.filteredEmpty}>
              <Text style={[styles.filteredEmptyText, { color: textSecondary }]}>
                {chip === 'unread' ? 'No unread chats' : 'No favourites yet'}
              </Text>
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
              {filteredThreads.map((t) => {
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
                    onLongPress={() => openThreadMenu(t)}
                    delayLongPress={350}
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
                      <View style={styles.rowMainCol}>
                        <View style={styles.rowTopLine}>
                          <Text
                            style={[styles.rowName, { color: textPrimary }, t.unread > 0 && styles.rowNameUnread]}
                            numberOfLines={1}
                          >
                            {t.name}
                          </Text>
                          {t.messageCount > 0 && (
                            <View style={styles.rowCountWrap}>
                              <Ionicons name="chatbubble-ellipses-outline" size={11} color={textMuted} />
                              <Text style={[styles.rowCount, { color: textMuted }]} numberOfLines={1}>
                                {localizeNumber(String(t.messageCount))}
                              </Text>
                            </View>
                          )}
                        </View>
                        <Text
                          style={[styles.rowPreview, { color: textSecondary }]}
                          numberOfLines={1}
                        >
                          {t.lastMessage || ' '}
                        </Text>
                      </View>

                      <View style={styles.rowRightCol}>
                        {!!timeLabel && (
                          <Text
                            style={[styles.rowTime, { color: textMuted }, t.unread > 0 && styles.rowTimeUnread]}
                            numberOfLines={1}
                          >
                            {timeLabel}
                          </Text>
                        )}
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

      {/* New conversation picker */}
      <Modal
        visible={pickerVisible}
        transparent
        animationType="slide"
        onRequestClose={closePicker}
      >
        <Pressable style={styles.sheetBackdrop} onPress={closePicker} />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.sheetKav}
          pointerEvents="box-none"
        >
          <View style={[styles.sheet, { height: SHEET_HEIGHT, backgroundColor: sheetBg, paddingBottom: insets.bottom + 16 }]}>
            <View style={[styles.sheetHandle, { backgroundColor: sheetHandleColor }]} />
            <Text style={[styles.sheetTitle, { color: textPrimary }]}>New conversation</Text>

            <View style={[styles.searchBox, { backgroundColor: sheetSearchBg, borderColor: sheetSearchBorder }]}>
              <Ionicons name="search-outline" size={18} color={textSecondary} />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search patients…"
                placeholderTextColor={sheetInputPlaceholder}
                style={[styles.searchInput, { color: textPrimary }]}
                autoCorrect={false}
              />
            </View>

            <ScrollView style={styles.sheetList} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              {patientsLoading ? (
                <ActivityIndicator style={{ marginTop: 24 }} color={textSecondary} />
              ) : filteredPatients.length === 0 ? (
                <Text style={[styles.sheetEmpty, { color: textSecondary }]}>
                  {allPatients.length === 0 ? 'No patients yet' : 'No patients found'}
                </Text>
              ) : (
                filteredPatients.map((p) => {
                  const pal = AVATAR_PALETTE[hashName(p.name) % AVATAR_PALETTE.length];
                  return (
                    <Pressable
                      key={p.id}
                      onPress={() => pickPatient(p)}
                      style={({ pressed }) => [
                        styles.pickRow,
                        { borderBottomColor: sheetDivider, opacity: pressed ? 0.75 : 1 },
                      ]}
                    >
                      <LinearGradient
                        colors={pal as any}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.pickAvatar}
                      >
                        <Text style={styles.pickAvatarText}>{initialsOf(p.name)}</Text>
                      </LinearGradient>
                      <Text style={[styles.pickName, { color: textPrimary }]} numberOfLines={1}>
                        {p.name}
                      </Text>
                    </Pressable>
                  );
                })
              )}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Long-press context menu (Phase 2 shell — actions inert) */}
      <Modal
        visible={menuOpen}
        transparent
        animationType="fade"
        onRequestClose={closeMenu}
      >
        <Pressable style={styles.sheetBackdrop} onPress={closeMenu} />
        <View style={styles.menuCenterWrap} pointerEvents="box-none">
          <Animated.View
            style={[
              styles.menuCard,
              { backgroundColor: sheetBg, opacity: menuFade, transform: [{ scale: menuScale }] },
            ]}
          >
            {menuThread && (
              <>
                <View style={styles.menuHeader}>
                  <LinearGradient
                    colors={AVATAR_PALETTE[hashName(menuThread.name) % AVATAR_PALETTE.length] as any}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.avatar}
                  >
                    <Text style={styles.avatarInitials}>{initialsOf(menuThread.name)}</Text>
                  </LinearGradient>
                  <Text style={[styles.rowName, { color: textPrimary, flex: 1, minWidth: 0 }]} numberOfLines={1}>
                    {menuThread.name}
                  </Text>
                  <Text style={[styles.rowTime, { color: textMuted }]}>
                    {formatLastAt(menuThread.lastAt)}
                  </Text>
                </View>
                <View style={[styles.menuDivider, { backgroundColor: sheetDivider }]} />
                <ScrollView
                  style={styles.miniPreview}
                  contentContainerStyle={styles.miniPreviewContent}
                  showsVerticalScrollIndicator={false}
                  nestedScrollEnabled
                >
                  {menuMessagesLoading ? (
                    <View style={styles.miniLoading}><ActivityIndicator color={textSecondary} /></View>
                  ) : (menuMessages && menuMessages.length > 0) ? (
                    menuMessages.map((m) => {
                      const isClinic = m.from === 'clinic';
                      let content: any;
                      if (m.type === 'album' && Array.isArray(m.media) && m.media.length > 0) {
                        const first = m.media[0];
                        const isVid = first?.kind === 'video';
                        const uri = isVid ? (first?.posterUrl ?? first?.url) : first?.url;
                        const hasUri = typeof uri === 'string' && uri.length > 0;
                        const extra = m.media.length - 1;
                        content = (
                          <View style={styles.miniMediaTile}>
                            {hasUri ? (
                              <Image source={{ uri: uri as string }} style={styles.miniMediaImage} resizeMode="cover" />
                            ) : (
                              <View style={styles.miniMediaPlaceholder}>
                                <Ionicons name="videocam" size={26} color="#fff" />
                              </View>
                            )}
                            {isVid ? (
                              <View style={styles.miniPlayBadgeSm} pointerEvents="none">
                                <Ionicons name="play" size={14} color="#fff" />
                              </View>
                            ) : null}
                            {extra > 0 ? (
                              <View style={styles.miniMoreChip} pointerEvents="none">
                                <Text style={styles.miniMoreChipText}>{`+${extra}`}</Text>
                              </View>
                            ) : null}
                          </View>
                        );
                      } else if (m.type === 'video') {
                        content = (
                          <View style={styles.miniMediaTile}>
                            {m.posterUrl ? (
                              <Image source={{ uri: m.posterUrl }} style={styles.miniMediaImage} resizeMode="cover" />
                            ) : (
                              <View style={styles.miniMediaPlaceholder}>
                                <Ionicons name="videocam" size={26} color="#fff" />
                              </View>
                            )}
                            <View style={styles.miniPlayBadgeLg} pointerEvents="none">
                              <Ionicons name="play" size={16} color="#fff" />
                            </View>
                          </View>
                        );
                      } else if (m.type === 'image' && m.imageUrl) {
                        content = (
                          <View style={styles.miniMediaTile}>
                            <Image source={{ uri: m.imageUrl }} style={styles.miniMediaImage} resizeMode="cover" />
                          </View>
                        );
                      } else if (m.type === 'audio' && m.audioUrl) {
                        const fg = isClinic ? '#FFFFFF' : textPrimary;
                        const barColor = isClinic ? 'rgba(255,255,255,0.65)' : textSecondary;
                        content = (
                          <View style={[
                            styles.miniAudioPill,
                            isClinic
                              ? styles.miniBubbleSent
                              : [styles.miniBubbleRecv, { backgroundColor: recvMiniBg, borderColor: recvMiniBorder }],
                          ]}>
                            <View style={[styles.miniAudioPlay, { borderColor: fg }]}>
                              <Ionicons name="play" size={14} color={fg} />
                            </View>
                            <View style={styles.miniAudioWave}>
                              {(Array.isArray(m.waveform) && m.waveform.length > 0
                                ? (() => {
                                    const src = m.waveform as number[];
                                    const N = 14;
                                    const step = Math.max(1, Math.floor(src.length / N));
                                    const bars: number[] = [];
                                    for (let i = 0; i < src.length && bars.length < N; i += step) bars.push(src[i]);
                                    const max = Math.max(1, ...bars);
                                    return bars.map((v, i) => (
                                      <View key={i} style={[styles.miniAudioBar, { height: Math.max(3, Math.round((v / max) * 14)), backgroundColor: barColor }]} />
                                    ));
                                  })()
                                : Array.from({ length: 14 }).map((_, i) => (
                                    <View key={i} style={[styles.miniAudioBar, { height: 4, backgroundColor: barColor }]} />
                                  )))}
                            </View>
                            <Text style={[styles.miniAudioTime, { color: fg }]}>{formatAudioDuration(m.durationMs)}</Text>
                          </View>
                        );
                      } else {
                        content = (
                          <View style={[
                            styles.miniBubbleBase,
                            isClinic
                              ? styles.miniBubbleSent
                              : [styles.miniBubbleRecv, { backgroundColor: recvMiniBg, borderColor: recvMiniBorder }],
                          ]}>
                            <Text numberOfLines={2} style={[styles.miniBubbleText, { color: isClinic ? '#FFFFFF' : textPrimary }]}>
                              {compactPreviewLabel(m)}
                            </Text>
                          </View>
                        );
                      }
                      return (
                        <View key={m.id} style={[styles.miniRow, { justifyContent: isClinic ? 'flex-end' : 'flex-start' }]}>
                          {content}
                        </View>
                      );
                    })
                  ) : (
                    <View style={styles.miniEmpty}><Text style={[styles.miniEmptyText, { color: textMuted }]}>No messages yet</Text></View>
                  )}
                </ScrollView>
                <View style={[styles.menuDivider, { backgroundColor: sheetDivider }]} />
                <Pressable
                  onPress={closeMenu}
                  style={({ pressed }) => [styles.menuRow, pressed && { backgroundColor: rowPressedBg }]}
                >
                  <Ionicons name="archive-outline" size={22} color={textPrimary} />
                  <Text style={[styles.menuRowText, { color: textPrimary }]}>Archive</Text>
                </Pressable>
                <Pressable
                  onPress={() => menuThread && toggleFavorite(menuThread)}
                  style={({ pressed }) => [styles.menuRow, pressed && { backgroundColor: rowPressedBg }]}
                >
                  <Ionicons
                    name={menuThread?.favoriteClinic ? 'heart' : 'heart-outline'}
                    size={22}
                    color={menuThread?.favoriteClinic ? '#EF4444' : textPrimary}
                  />
                  <Text style={[styles.menuRowText, { color: textPrimary }]}>
                    {menuThread?.favoriteClinic ? 'Remove from Favourites' : 'Add to Favourites'}
                  </Text>
                </Pressable>
                <View style={[styles.menuRow, { opacity: 0.4 }]}>
                  <Ionicons name="close-circle-outline" size={22} color={textPrimary} />
                  <Text style={[styles.menuRowText, { color: textPrimary }]}>Clear chat</Text>
                </View>
                <View style={[styles.menuRow, { opacity: 0.4 }]}>
                  <Ionicons name="trash-outline" size={22} color="#EF4444" />
                  <Text style={[styles.menuRowText, { color: '#EF4444', fontWeight: '700' }]}>
                    Delete chat
                  </Text>
                </View>
              </>
            )}
          </Animated.View>
        </View>
      </Modal>
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
  rowText: { flex: 1, flexDirection: 'row', alignItems: 'stretch', gap: 4 },
  rowMainCol: { flex: 1, justifyContent: 'center', gap: 3 },
  rowRightCol: {
    marginLeft: 10,
    minWidth: 52,
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingVertical: 1,
  },
  rowTopLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rowName: { flex: 1, fontSize: 16, fontWeight: '700' },
  rowNameUnread: { fontWeight: '700' },
  rowTime: { fontSize: 12, fontWeight: '600' },
  rowTimeUnread: { color: '#4DA3FF', fontWeight: '700' },
  rowBottomLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rowPreview: { flex: 1, fontSize: 13.5 },
  rowCount: { fontSize: 11.5, fontWeight: '700' },
  rowCountWrap: { flexDirection: 'row', alignItems: 'center', gap: 3 },
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

  sheetBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheetKav: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 12,
  },
  sheetHandle: {
    width: 38,
    height: 5,
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 12,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '800',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    height: 48,
    marginHorizontal: 16,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    padding: 0,
    margin: 0,
  },
  sheetList: {
    flex: 1,
    paddingHorizontal: 8,
  },
  pickRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    paddingVertical: 11,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
  },
  pickAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickAvatarText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 16,
    letterSpacing: 0.3,
  },
  pickName: {
    flex: 1,
    fontSize: 15.5,
    fontWeight: '700',
  },
  sheetEmpty: {
    textAlign: 'center',
    marginTop: 24,
    fontSize: 14,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    marginTop: 10,
    marginBottom: 2,
  },
  chip: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  chipPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '700',
  },
  chipCount: {
    minWidth: 20,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipCountText: {
    fontSize: 11,
    fontWeight: '800',
  },
  filteredEmpty: {
    alignItems: 'center',
    marginTop: 40,
    paddingHorizontal: 24,
  },
  filteredEmptyText: {
    fontSize: 14,
    fontWeight: '600',
  },
  menuCenterWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
  menuCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 20,
    paddingVertical: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 16,
  },
  menuHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14 },
  menuDivider: { height: StyleSheet.hairlineWidth, marginHorizontal: 12, marginBottom: 4 },
  menuRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingVertical: 14 },
  menuRowText: { fontSize: 15.5, fontWeight: '600' },
  miniPreview: { maxHeight: 320 },
  miniPreviewContent: { paddingHorizontal: 14, paddingTop: 8, paddingBottom: 10, gap: 6 },
  miniLoading: { height: 90, alignItems: 'center', justifyContent: 'center' },
  miniEmpty: { height: 64, alignItems: 'center', justifyContent: 'center' },
  miniEmptyText: { fontSize: 13, fontWeight: '500' },
  miniRow: { flexDirection: 'row', width: '100%' },
  miniBubbleBase: { maxWidth: '78%', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  miniBubbleSent: { backgroundColor: '#1E6FD9' },
  miniBubbleRecv: { borderWidth: 1 },
  miniBubbleText: { fontSize: 13.5, lineHeight: 18, fontWeight: '500' },
  miniMediaTile: { width: 130, height: 130, borderRadius: 12, overflow: 'hidden', backgroundColor: '#111', position: 'relative' },
  miniMediaImage: { width: '100%', height: '100%' },
  miniMediaPlaceholder: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', backgroundColor: '#111' },
  miniPlayBadgeLg: { position: 'absolute', top: '50%', left: '50%', width: 28, height: 28, marginTop: -14, marginLeft: -14, borderRadius: 14, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center' },
  miniPlayBadgeSm: { position: 'absolute', top: '50%', left: '50%', width: 24, height: 24, marginTop: -12, marginLeft: -12, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center' },
  miniMoreChip: { position: 'absolute', right: 6, bottom: 6, paddingHorizontal: 6, paddingVertical: 3, borderRadius: 8, backgroundColor: 'rgba(0,0,0,0.55)' },
  miniMoreChipText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  miniAudioPill: { width: 180, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 14 },
  miniAudioPlay: { width: 22, height: 22, borderRadius: 11, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  miniAudioWave: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 2, height: 18 },
  miniAudioBar: { width: 2, borderRadius: 1 },
  miniAudioTime: { fontSize: 11, fontWeight: '600' },
});
