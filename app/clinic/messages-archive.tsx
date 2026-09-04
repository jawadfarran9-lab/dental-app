import { db } from '@/firebaseConfig';
import { PremiumGradientBackground } from '@/src/components/PremiumGradientBackground';
import { useAuth } from '@/src/context/AuthContext';
import { useTheme } from '@/src/context/ThemeContext';
import { deleteChatForClinic } from '@/src/services/chatClear';
import { useClinicGuard } from '@/src/utils/navigationGuards';
import { localizeNumber } from '@/utils/localization';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useFocusEffect, useRouter } from 'expo-router';
import { collection, deleteField, doc, getDocs, orderBy, query, setDoc, where } from 'firebase/firestore';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
  Modal,
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

type ArchivedRow = {
  id: string;
  patientId: string;
  name: string;
  lastMessage: string;
  lastAt: any;
  unread: number;
};

export default function ClinicMessagesArchiveScreen() {
  useClinicGuard();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { clinicId, userRole, loading: clinicLoading } = useAuth();
  const clinicUser = userRole === 'clinic';

  const [archivedThreads, setArchivedThreads] = useState<ArchivedRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [menuThread, setMenuThread] = useState<ArchivedRow | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuScale = useRef(new Animated.Value(0.92)).current;
  const menuFade = useRef(new Animated.Value(0)).current;

  const [editMenuOpen, setEditMenuOpen] = useState(false);
  const [selecting, setSelecting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const textPrimary = colors.textPrimary;
  const textSecondary = colors.textSecondary;
  const textMuted = colors.textTertiary;
  const cardBg = isDark ? 'rgba(255,255,255,0.015)' : 'rgba(255,255,255,0.18)';
  const cardBorder = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.45)';
  const rowPressedBg = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.32)';
  const backBg = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.92)';
  const backBgPressed = isDark ? 'rgba(255,255,255,0.15)' : 'rgba(27, 37, 66, 0.1)';
  const backIconColor = isDark ? '#FFFFFF' : '#1B2542';
  const sheetBg = isDark ? '#141C2F' : '#F7FAFF';
  const sheetDivider = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(27,37,66,0.06)';
  const sheetBackdropColor = 'rgba(0,0,0,0.45)';

  const loadArchived = useCallback(async () => {
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
      const snap = await getDocs(
        query(collection(db, 'threads'), where('clinicId', '==', clinicId), orderBy('lastMessageAt', 'desc'))
      );
      const list: ArchivedRow[] = snap.docs
        .map((d) => {
          const data = d.data() as any;
          const fallbackPatientId = d.id.includes('_') ? d.id.split('_').slice(1).join('_') : d.id;
          return {
            id: d.id,
            patientId: data.patientId ?? fallbackPatientId,
            name: String(data.patientName ?? '').trim() || 'Patient',
            lastMessage: data.lastMessageText ?? '',
            lastAt: data.lastMessageAt,
            unread: data.unreadForClinic ?? 0,
            archivedForClinic: data.archivedForClinic === true,
            deletedForClinic: data.deletedForClinic === true,
          };
        })
        .filter((t: any) => t.archivedForClinic === true && t.deletedForClinic !== true)
        .map(({ archivedForClinic: _a, deletedForClinic: _d, ...rest }: any) => rest);
      setArchivedThreads(list);
    } catch (err) {
      console.error('[messages-archive] fetch error', err);
    } finally {
      setLoading(false);
    }
  }, [clinicId, clinicUser, clinicLoading, router]);

  useFocusEffect(
    useCallback(() => {
      loadArchived();
    }, [loadArchived])
  );

  const openUnarchiveMenu = (t: ArchivedRow) => {
    setMenuThread(t);
    setMenuOpen(true);
  };
  const closeUnarchiveMenu = () => setMenuOpen(false);

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

  const unarchive = async (t: ArchivedRow) => {
    setArchivedThreads((prev) => prev.filter((r) => r.id !== t.id));
    closeUnarchiveMenu();
    try {
      await setDoc(doc(db, 'threads', t.id), { archivedForClinic: deleteField() }, { merge: true });
    } catch (e) {
      console.error('[messages-archive] unarchive', e);
    }
  };

  const exitSelectMode = () => {
    setSelecting(false);
    setSelectedIds(new Set());
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedIds.size === archivedThreads.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(archivedThreads.map((t) => t.id)));
    }
  };

  const batchUnarchive = async () => {
    if (selectedIds.size === 0) return;
    const ids = Array.from(selectedIds);
    setArchivedThreads((prev) => prev.filter((r) => !selectedIds.has(r.id)));
    exitSelectMode();
    try {
      await Promise.all(
        ids.map((id) =>
          setDoc(doc(db, 'threads', id), { archivedForClinic: deleteField() }, { merge: true }),
        ),
      );
    } catch (e) {
      console.error('[messages-archive] batch unarchive', e);
    }
  };

  const batchDelete = () => {
    if (selectedIds.size === 0 || !clinicId) return;
    const rows = archivedThreads.filter((t) => selectedIds.has(t.id));
    if (rows.length === 0) return;
    Alert.alert(
      `Delete ${rows.length} ${rows.length === 1 ? 'chat' : 'chats'}?`,
      'This removes the chats from your list and clears them on your side. The patient keeps their copy. A chat returns (starting fresh) if either side sends a new message.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setArchivedThreads((prev) => prev.filter((r) => !selectedIds.has(r.id)));
            exitSelectMode();
            try {
              await Promise.all(
                rows.map((r) =>
                  deleteChatForClinic({ clinicId: clinicId as string, patientId: r.patientId }),
                ),
              );
            } catch (e) {
              console.error('[messages-archive] batch delete', e);
              Alert.alert('Could not delete', 'Please try again.');
            }
          },
        },
      ],
    );
  };

  const handleBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/clinic/messages' as any);
  };

  return (
    <View style={{ flex: 1 }}>
      <Stack.Screen options={{ headerShown: false }} />
      <PremiumGradientBackground isDark={isDark} showSparkles={!isDark} />

      <View style={{ flex: 1, paddingTop: insets.top + 6 }}>
        {/* Header */}
        <View style={styles.header}>
          {selecting ? (
            <Pressable
              onPress={exitSelectMode}
              hitSlop={8}
              style={styles.editBtn}
            >
              <Text style={[styles.editText, { color: textPrimary }]}>Cancel</Text>
            </Pressable>
          ) : (
            <Pressable
              onPress={handleBack}
              style={({ pressed }) => [
                styles.headerBtn,
                { backgroundColor: pressed ? backBgPressed : backBg },
              ]}
            >
              <Ionicons name="chevron-back" size={22} color={backIconColor} />
            </Pressable>
          )}
          <View style={styles.headerText}>
            <Text style={[styles.headerTitle, { color: textPrimary }]}>
              {selecting ? `${selectedIds.size} selected` : 'Archived'}
            </Text>
          </View>
          {selecting ? (
            <Pressable
              onPress={selectAll}
              hitSlop={8}
              style={styles.editBtn}
            >
              <Text style={[styles.editText, { color: textPrimary }]}>
                {selectedIds.size === archivedThreads.length && archivedThreads.length > 0 ? 'None' : 'All'}
              </Text>
            </Pressable>
          ) : (
            <Pressable
              onPress={() => setEditMenuOpen(true)}
              hitSlop={8}
              style={styles.editBtn}
            >
              <Text style={[styles.editText, { color: textPrimary }]}>Edit</Text>
            </Pressable>
          )}
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={textSecondary} />
          </View>
        ) : archivedThreads.length === 0 ? (
          <View style={styles.center}>
            <Ionicons name="archive-outline" size={46} color={textSecondary} />
            <Text style={[styles.emptyText, { color: textSecondary }]}>No archived chats</Text>
          </View>
        ) : (
          <FlatList
            data={archivedThreads}
            keyExtractor={(t) => t.id}
            contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 2, paddingBottom: insets.bottom + 24 }}
            renderItem={({ item: t }) => {
              const palette = AVATAR_PALETTE[hashName(t.name || '?') % AVATAR_PALETTE.length];
              const timeLabel = formatLastAt(t.lastAt);
              const isSelected = selectedIds.has(t.id);
              return (
                <Pressable
                  onPress={() => {
                    if (selecting) {
                      toggleSelect(t.id);
                    } else {
                      router.push(`/clinic/conversation?patientId=${t.patientId}&name=${encodeURIComponent(t.name)}` as any);
                    }
                  }}
                  onLongPress={selecting ? undefined : () => openUnarchiveMenu(t)}
                  delayLongPress={350}
                  style={({ pressed }) => [
                    styles.row,
                    { backgroundColor: pressed ? rowPressedBg : cardBg, borderColor: cardBorder },
                  ]}
                >
                  {selecting ? (
                    <View style={styles.checkboxWrap}>
                      <Ionicons
                        name={isSelected ? 'checkmark-circle' : 'ellipse-outline'}
                        size={26}
                        color={isSelected ? '#1E6FD9' : textSecondary}
                      />
                    </View>
                  ) : null}
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
                      </View>
                      <Text style={[styles.rowPreview, { color: textSecondary }]} numberOfLines={1}>
                        {t.lastMessage || ' '}
                      </Text>
                    </View>
                    <View style={styles.rowRightCol}>
                      {!!timeLabel && (
                        <Text style={[styles.rowTime, { color: textMuted }, t.unread > 0 && styles.rowTimeUnread]} numberOfLines={1}>
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
                          <Text style={styles.unreadText}>{localizeNumber(String(t.unread))}</Text>
                        </LinearGradient>
                      )}
                    </View>
                  </View>
                </Pressable>
              );
            }}
          />
        )}
      </View>

      {/* Long-press: Unarchive card */}
      <Modal
        visible={menuOpen}
        transparent
        animationType="fade"
        onRequestClose={closeUnarchiveMenu}
      >
        <Pressable style={[StyleSheet.absoluteFillObject, { backgroundColor: sheetBackdropColor }]} onPress={closeUnarchiveMenu} />
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
                  <Text style={[styles.rowTime, { color: textMuted }]}>{formatLastAt(menuThread.lastAt)}</Text>
                </View>
                <View style={[styles.menuDivider, { backgroundColor: sheetDivider }]} />
                <Pressable
                  onPress={() => menuThread && unarchive(menuThread)}
                  style={({ pressed }) => [styles.menuRow, pressed && { backgroundColor: rowPressedBg }]}
                >
                  <Ionicons name="archive" size={22} color={textPrimary} />
                  <Text style={[styles.menuRowText, { color: textPrimary }]}>Unarchive</Text>
                </Pressable>
              </>
            )}
          </Animated.View>
        </View>
      </Modal>

      {/* Edit popover (top-right) */}
      <Modal
        visible={editMenuOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setEditMenuOpen(false)}
      >
        <Pressable style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(0,0,0,0.35)' }]} onPress={() => setEditMenuOpen(false)} />
        <View
          style={[
            styles.editPopover,
            { top: insets.top + 52, backgroundColor: sheetBg },
          ]}
        >
          <Pressable
            onPress={() => {
              setEditMenuOpen(false);
              setSelecting(true);
            }}
            style={({ pressed }) => [styles.menuRow, pressed && { backgroundColor: rowPressedBg }]}
          >
            <Ionicons name="checkmark-circle-outline" size={22} color={textPrimary} />
            <Text style={[styles.menuRowText, { color: textPrimary, flexShrink: 1 }]}>Select chats</Text>
          </Pressable>
          <View style={[styles.menuDivider, { backgroundColor: sheetDivider }]} />
          <Pressable
            onPress={() => {
              setEditMenuOpen(false);
              router.push('/clinic/chat-archive-patient-picker' as any);
            }}
            style={({ pressed }) => [styles.menuRow, pressed && { backgroundColor: rowPressedBg }]}
          >
            <Ionicons name="settings-outline" size={22} color={textPrimary} />
            <Text style={[styles.menuRowText, { color: textPrimary, flexShrink: 1 }]}>Edit archive settings</Text>
          </Pressable>
        </View>
      </Modal>

      {/* Bottom action bar (select mode) */}
      {selecting ? (
        <View style={[styles.actionBar, { paddingBottom: insets.bottom + 10, backgroundColor: sheetBg, borderTopColor: sheetDivider }]}>
          <Pressable
            onPress={batchUnarchive}
            disabled={selectedIds.size === 0}
            style={({ pressed }) => [
              styles.actionBtn,
              selectedIds.size === 0 && { opacity: 0.35 },
              pressed && selectedIds.size > 0 && { opacity: 0.7 },
            ]}
          >
            <Ionicons name="archive" size={22} color="#1E6FD9" />
            <Text style={[styles.actionBtnText, { color: '#1E6FD9' }]}>Unarchive</Text>
          </Pressable>
          <Pressable
            onPress={batchDelete}
            disabled={selectedIds.size === 0}
            style={({ pressed }) => [
              styles.actionBtn,
              selectedIds.size === 0 && { opacity: 0.35 },
              pressed && selectedIds.size > 0 && { opacity: 0.7 },
            ]}
          >
            <Ionicons name="trash-outline" size={22} color="#EF4444" />
            <Text style={[styles.actionBtnText, { color: '#EF4444' }]}>Delete</Text>
          </Pressable>
        </View>
      ) : null}
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
  editBtn: { paddingHorizontal: 8, paddingVertical: 6 },
  editText: { fontSize: 15, fontWeight: '700' },

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
  avatar: { width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center' },
  avatarInitials: { color: '#FFFFFF', fontSize: 16, fontWeight: '800', letterSpacing: 0.3 },
  rowText: { flex: 1, flexDirection: 'row', alignItems: 'stretch', gap: 4 },
  rowMainCol: { flex: 1, justifyContent: 'center', gap: 3 },
  rowRightCol: { marginLeft: 10, minWidth: 52, alignItems: 'flex-end', justifyContent: 'space-between', paddingVertical: 1 },
  rowTopLine: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rowName: { flex: 1, fontSize: 16, fontWeight: '700' },
  rowNameUnread: { fontWeight: '700' },
  rowTime: { fontSize: 12, fontWeight: '600' },
  rowTimeUnread: { color: '#4DA3FF', fontWeight: '700' },
  rowPreview: { flex: 1, fontSize: 13.5 },
  unreadBadge: { minWidth: 22, height: 22, paddingHorizontal: 7, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  unreadText: { color: '#FFFFFF', fontSize: 11.5, fontWeight: '800' },

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
  editPopover: {
    position: 'absolute',
    right: 12,
    width: 250,
    borderRadius: 16,
    paddingVertical: 6,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 14,
    elevation: 14,
  },
  checkboxWrap: {
    width: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
  },
  actionBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: 10,
    paddingHorizontal: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 12,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  actionBtnText: {
    fontSize: 15,
    fontWeight: '700',
  },
});
