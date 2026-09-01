import { db } from '@/firebaseConfig';
import MediaViewerModal, { type ViewerPage } from '@/src/components/MediaViewerModal';
import { PremiumGradientBackground } from '@/src/components/PremiumGradientBackground';
import { useAuth } from '@/src/context/AuthContext';
import { useTheme } from '@/src/context/ThemeContext';
import { useClinicGuard } from '@/src/utils/navigationGuards';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { collection, deleteDoc, deleteField, doc, getDoc, onSnapshot, orderBy, query, updateDoc } from 'firebase/firestore';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Dimensions, FlatList, Image, Pressable, Share, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EmojiKeyboard } from 'rn-emoji-keyboard';

function formatInfoTime(ts?: number): string {
  if (!ts) return '';
  const d = new Date(ts);
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  let h = d.getHours();
  const m = d.getMinutes().toString().padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12; if (h === 0) h = 12;
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()} ${h}:${m} ${ampm}`;
}

const SCREEN_W = Dimensions.get('window').width;
const GAP = 2;
const OUTER = 2;
const CELL = Math.floor((SCREEN_W - OUTER * 2 - GAP * 2) / 3);

export default function ClinicMediaAllScreen() {
  useClinicGuard();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { clinicId } = useAuth();
  const { patientId } = useLocalSearchParams<{ patientId: string; name?: string }>();

  const [patient, setPatient] = useState<any>(null);
  const [media, setMedia] = useState<{
    id: string;
    mediaIndex?: number;
    kind: 'image' | 'video';
    url: string;
    videoUrl?: string;
    width?: number;
    height?: number;
    createdAt?: number;
    drawing?: any;
    texts?: any;
    from?: 'patient' | 'clinic';
    text?: string;
    reactionPatient?: string;
    reactionClinic?: string;
    stickerPatient?: string;
    sticker?: string;
    starredClinic?: boolean;
  }[]>([]);
  const [rawAlbums, setRawAlbums] = useState<Record<string, any[]>>({});
  const [clearedForClinicAt, setClearedForClinicAt] = useState<number>(0);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [stickerKbOpen, setStickerKbOpen] = useState(false);
  const [stickerTarget, setStickerTarget] = useState<{ msgId: string; mediaIndex?: number } | null>(null);
  const openInfoViewer = (index: number) => { setViewerIndex(index); setViewerOpen(true); };
  const openStickerForPage = (page: ViewerPage) => {
    setStickerTarget({ msgId: page.msgId, mediaIndex: page.mediaIndex });
    setStickerKbOpen(true);
  };
  const setMyReaction = async (msgId: string, emoji: string, cur?: string) => {
    if (!patientId) return;
    const isClearing = cur === emoji;
    try {
      await updateDoc(doc(db, `patients/${patientId}/messages/${msgId}`), {
        reactionClinic: isClearing ? deleteField() : emoji,
      });
    } catch (e) { console.error('[media-all] set reaction', e); }
  };

  useEffect(() => {
    if (!patientId) return;
    const qy = query(
      collection(db, `patients/${patientId}/messages`),
      orderBy('createdAt', 'asc'),
    );
    const unsub = onSnapshot(
      qy,
      (snap) => {
        const items = snap.docs.flatMap((d) => {
          const m: any = { id: d.id, ...(d.data() as any) };
          if (m.type === 'image' && m.imageUrl) {
            return [{
              id: m.id,
              kind: 'image' as const,
              url: m.imageUrl as string,
              width: typeof m.imageWidth === 'number' ? m.imageWidth : undefined,
              height: typeof m.imageHeight === 'number' ? m.imageHeight : undefined,
              createdAt: typeof m.createdAt === 'number' ? m.createdAt : undefined,
              drawing: m.drawing ?? null,
              texts: m.texts ?? null,
              from: m.from,
              text: m.text,
              reactionPatient: m.reactionPatient,
              reactionClinic: m.reactionClinic,
              starredClinic: m.starredClinic,
            }];
          }
          if (m.type === 'video' && m.videoUrl) {
            return [{
              id: m.id,
              kind: 'video' as const,
              url: (m.posterUrl as string | null) ?? '',
              videoUrl: m.videoUrl as string,
              width: typeof m.videoWidth === 'number' ? m.videoWidth : undefined,
              height: typeof m.videoHeight === 'number' ? m.videoHeight : undefined,
              createdAt: typeof m.createdAt === 'number' ? m.createdAt : undefined,
              drawing: m.drawing ?? null,
              texts: m.texts ?? null,
              from: m.from,
              text: m.text,
              reactionPatient: m.reactionPatient,
              reactionClinic: m.reactionClinic,
              starredClinic: m.starredClinic,
            }];
          }
          if (m.type === 'album' && Array.isArray(m.media)) {
            return m.media.map((it: any, i: number) => ({
              id: m.id,
              mediaIndex: i,
              kind: (it.kind === 'video' ? 'video' : 'image') as 'image' | 'video',
              url: it.kind === 'video' ? ((it.posterUrl as string | null) ?? it.url ?? '') : (it.url as string),
              videoUrl: it.kind === 'video' ? (it.videoUrl as string) : undefined,
              width: typeof it.width === 'number' ? it.width : undefined,
              height: typeof it.height === 'number' ? it.height : undefined,
              createdAt: typeof m.createdAt === 'number' ? m.createdAt : undefined,
              drawing: null,
              texts: null,
              from: m.from,
              text: m.text,
              stickerPatient: it.stickerPatient,
              sticker: it.sticker,
              starredClinic: m.starredClinic,
            }));
          }
          return [];
        }).reverse();
        setMedia(items);
        const raws: Record<string, any[]> = {};
        snap.docs.forEach((d) => {
          const m: any = d.data();
          if (m.type === 'album' && Array.isArray(m.media)) raws[d.id] = m.media;
        });
        setRawAlbums(raws);
      },
      (e) => console.error('[media-all] media sub error', e),
    );
    return () => unsub();
  }, [patientId]);

  useEffect(() => {
    if (!clinicId || !patientId) return;
    const unsub = onSnapshot(
      doc(db, 'threads', `${clinicId}_${patientId}`),
      (snap) => {
        const v = snap.exists() ? (snap.data() as any).clearedForClinicAt : 0;
        setClearedForClinicAt(typeof v === 'number' ? v : 0);
      },
      (e) => console.error('[media-all] thread marker sub error', e),
    );
    return () => unsub();
  }, [clinicId, patientId]);

  useEffect(() => {
    if (!clinicId || !patientId) return;
    getDoc(doc(db, 'clinics', clinicId as string, 'patients', patientId as string))
      .then((snap) => { if (snap.exists()) setPatient({ id: snap.id, ...(snap.data() as any) }); })
      .catch((e) => console.error('[media-all] patient load error', e));
  }, [clinicId, patientId]);

  const shownMedia = useMemo(
    () => media.filter((m) => (m.createdAt ?? 0) > (clearedForClinicAt ?? 0)),
    [media, clearedForClinicAt],
  );
  const pages: ViewerPage[] = useMemo(
    () => shownMedia.map((m) => ({
      url: m.url,
      videoUrl: m.kind === 'video' ? m.videoUrl : undefined,
      kind: m.kind,
      width: m.width,
      height: m.height,
      msgId: m.id,
      mediaIndex: m.mediaIndex,
      drawing: m.drawing ?? null,
      texts: m.texts ?? null,
    })),
    [shownMedia],
  );
  const findItem = (p: ViewerPage) =>
    shownMedia.find((it) => it.id === p.msgId && (it.mediaIndex ?? null) === (p.mediaIndex ?? null));
  const setStickerOnItem = async (msgId: string, mediaIndex: number, emoji: string) => {
    if (!patientId) return;
    const cur = rawAlbums[msgId];
    if (!cur) return;
    const newMedia = cur.map((it: any, idx: number) => {
      if (idx !== mediaIndex) return it;
      if (it.sticker === emoji) {
        const { sticker, ...rest } = it;
        return rest;
      }
      return { ...it, sticker: emoji };
    });
    try {
      await updateDoc(doc(db, `patients/${patientId}/messages/${msgId}`), { media: newMedia });
    } catch (e) { console.error('[media-all] set album sticker', e); }
  };

  const handleBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/clinic' as any);
  };

  const textPrimary = colors.textPrimary;
  const textSecondary = colors.textSecondary;
  const backBg = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.92)';
  const backBgPressed = isDark ? 'rgba(255,255,255,0.15)' : 'rgba(27, 37, 66, 0.1)';
  const backIconColor = isDark ? '#FFFFFF' : '#1B2542';

  return (
    <View style={{ flex: 1 }}>
      <Stack.Screen options={{ headerShown: false }} />
      <PremiumGradientBackground isDark={isDark} showSparkles={!isDark} />

      <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
        <Pressable
          onPress={handleBack}
          style={({ pressed }) => [styles.headerBtn, { backgroundColor: pressed ? backBgPressed : backBg }]}
        >
          <Ionicons name="chevron-back" size={22} color={backIconColor} />
        </Pressable>
        <View style={styles.headerText}>
          <Text style={[styles.headerTitle, { color: textPrimary }]}>Media</Text>
        </View>
      </View>

      {shownMedia.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="images-outline" size={28} color={textSecondary} />
          <Text style={[styles.emptyText, { color: textSecondary }]}>No media shared yet</Text>
        </View>
      ) : (
        <FlatList
          data={shownMedia}
          numColumns={3}
          keyExtractor={(m) => `${m.id}_${m.mediaIndex ?? 'x'}`}
          columnWrapperStyle={{ gap: GAP, paddingHorizontal: OUTER }}
          contentContainerStyle={{ paddingBottom: insets.bottom + 24, paddingTop: 4 }}
          ItemSeparatorComponent={() => <View style={{ height: GAP }} />}
          showsVerticalScrollIndicator={false}
          renderItem={({ item: m, index }) => (
            <Pressable
              onPress={() => openInfoViewer(index)}
              style={({ pressed }) => [styles.gCell, { width: CELL, height: CELL }, pressed && { opacity: 0.85 }]}
            >
              <Image source={{ uri: m.url }} style={styles.gImg} resizeMode="cover" />
              {m.kind === 'video' && (
                <View pointerEvents="none" style={styles.gPlay}>
                  <Ionicons name="play" size={18} color="#FFFFFF" style={{ marginLeft: 2 }} />
                </View>
              )}
            </Pressable>
          )}
        />
      )}

      <MediaViewerModal
        visible={viewerOpen}
        pages={pages}
        index={viewerIndex}
        onIndexChange={setViewerIndex}
        onClose={() => setViewerOpen(false)}
        title={(p) => {
          const m = findItem(p);
          return m?.from === 'clinic' ? 'You' : (patient?.name || 'Patient');
        }}
        timeLabel={(p) => {
          const m = findItem(p);
          return formatInfoTime(m?.createdAt);
        }}
        ownSticker={(p) => {
          const m = findItem(p);
          if (!m) return undefined;
          return p.mediaIndex != null ? m.sticker : m.reactionClinic;
        }}
        otherSticker={(p) => {
          const m = findItem(p);
          if (!m) return undefined;
          return p.mediaIndex != null ? m.stickerPatient : m.reactionPatient;
        }}
        onShare={(p) => {
          const m = findItem(p);
          const shareUrl = p.videoUrl ?? p.url;
          Share.share({ message: m?.text ? `${m.text}\n${shareUrl}` : shareUrl }).catch(() => {});
        }}
        starred={(p) => !!findItem(p)?.starredClinic}
        onToggleStar={async (p) => {
          const m = findItem(p);
          if (!m || !patientId) return;
          await updateDoc(doc(db, `patients/${patientId}/messages/${m.id}`), {
            starredClinic: m.starredClinic ? deleteField() : true,
          });
        }}
        canDelete={(p) => p.mediaIndex == null && findItem(p)?.from === 'clinic'}
        onDelete={(p) => {
          const m = findItem(p);
          if (!m || m.from !== 'clinic' || !patientId) return;
          Alert.alert(
            'Delete this message?',
            'This permanently deletes the message for both you and the patient. This cannot be undone.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Delete', style: 'destructive', onPress: async () => {
                try { await deleteDoc(doc(db, `patients/${patientId}/messages/${m.id}`)); setViewerOpen(false); }
                catch (e) { console.error('[media-all] delete error', e); }
              } },
            ],
          );
        }}
        onEditSticker={openStickerForPage}
        stickerSheet={stickerKbOpen ? (() => {
          const target = stickerTarget;
          const curItem = target
            ? shownMedia.find((it) => it.id === target.msgId && (it.mediaIndex ?? null) === (target.mediaIndex ?? null))
            : undefined;
          const cur = target
            ? (target.mediaIndex != null ? curItem?.sticker : curItem?.reactionClinic)
            : undefined;
          return (
            <View style={StyleSheet.absoluteFill}>
              <Pressable style={StyleSheet.absoluteFill} onPress={() => { setStickerKbOpen(false); setStickerTarget(null); }} />
              <View style={styles.stickerKbSheet}>
                <View style={styles.stickerKbHeader}>
                  {cur ? (
                    <Pressable
                      onPress={() => {
                        if (target) {
                          if (target.mediaIndex != null) setStickerOnItem(target.msgId, target.mediaIndex, cur);
                          else setMyReaction(target.msgId, cur, cur);
                        }
                        setStickerKbOpen(false);
                        setStickerTarget(null);
                      }}
                      style={styles.stickerKbCurrent}
                      hitSlop={8}
                    >
                      <Text style={{ fontSize: 22 }}>{cur}</Text>
                    </Pressable>
                  ) : (<View />)}
                  <Pressable
                    onPress={() => { setStickerKbOpen(false); setStickerTarget(null); }}
                    style={styles.stickerKbClose}
                    hitSlop={8}
                  >
                    <Ionicons name="close" size={20} color="#111111" />
                  </Pressable>
                </View>
                <EmojiKeyboard
                  onEmojiSelected={(e) => {
                    const picked = e?.emoji;
                    if (picked && target) {
                      if (target.mediaIndex != null) setStickerOnItem(target.msgId, target.mediaIndex, picked);
                      else setMyReaction(target.msgId, picked, cur);
                    }
                    setStickerKbOpen(false);
                    setStickerTarget(null);
                  }}
                  enableSearchBar
                  enableRecentlyUsed
                  defaultHeight={380}
                />
              </View>
            </View>
          );
        })() : null}
      />
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
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  emptyText: { fontSize: 13.5, fontWeight: '600' },
  gCell: { borderRadius: 2, overflow: 'hidden' },
  gImg: { width: '100%', height: '100%' },
  gPlay: { position: 'absolute', top: '50%', left: '50%', width: 32, height: 32, borderRadius: 16, marginTop: -16, marginLeft: -16, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  stickerKbSheet: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 420, backgroundColor: '#FFFFFF', overflow: 'hidden' },
  stickerKbHeader: { height: 40, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 12 },
  stickerKbClose: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.06)', justifyContent: 'center', alignItems: 'center' },
  stickerKbCurrent: { minWidth: 32, height: 32, borderRadius: 16, paddingHorizontal: 6, backgroundColor: 'rgba(0,0,0,0.06)', justifyContent: 'center', alignItems: 'center' },
});
