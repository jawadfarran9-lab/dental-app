import { patientDb } from '@/firebaseConfig';
import MediaViewerModal, { type ViewerPage } from '@/src/components/MediaViewerModal';
import { PremiumGradientBackground } from '@/src/components/PremiumGradientBackground';
import { useTheme } from '@/src/context/ThemeContext';
import { usePatientAuthReady } from '@/src/hooks/usePatientAuthReady';
import { requestOpenSearch } from '@/src/state/chatSearchSignal';
import { usePatientGuard } from '@/src/utils/navigationGuards';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { collection, deleteDoc, deleteField, doc, getDoc, onSnapshot, orderBy, query, updateDoc } from 'firebase/firestore';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, Image, Linking, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
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

export default function PatientYourInfoScreen() {
  usePatientGuard();
  const patientAuthReady = usePatientAuthReady();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { patientId, clinicId } = useLocalSearchParams<{ patientId: string; clinicId: string }>();

  const [patient, setPatient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [media, setMedia] = useState<{
    id: string;
    imageUrl: string;
    width?: number;
    height?: number;
    createdAt?: number;
    drawing?: any;
    texts?: any;
    from?: 'patient' | 'clinic';
    text?: string;
    reactionPatient?: string;
    reactionClinic?: string;
    starredPatient?: boolean;
  }[]>([]);
  const [starredCount, setStarredCount] = useState(0);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [stickerKbOpen, setStickerKbOpen] = useState(false);
  const [stickerTarget, setStickerTarget] = useState<{ msgId: string } | null>(null);
  const openInfoViewer = (index: number) => { setViewerIndex(index); setViewerOpen(true); };
  const openStickerForPage = (page: ViewerPage) => {
    setStickerTarget({ msgId: page.msgId });
    setStickerKbOpen(true);
  };
  const setMyReaction = async (msgId: string, emoji: string, cur?: string) => {
    if (!patientId) return;
    const isClearing = cur === emoji;
    try {
      await updateDoc(doc(patientDb, `patients/${patientId}/messages/${msgId}`), {
        reactionPatient: isClearing ? deleteField() : emoji,
      });
    } catch (e) { console.error('[your-info] set reaction', e); }
  };

  useEffect(() => {
    if (!patientAuthReady) return;
    if (!patientId) return;
    const qy = query(
      collection(patientDb, `patients/${patientId}/messages`),
      orderBy('createdAt', 'asc'),
    );
    const unsub = onSnapshot(
      qy,
      (snap) => {
        const imgs = snap.docs
          .map((d) => ({ id: d.id, ...(d.data() as any) }))
          .filter((m) => m.type === 'image' && m.imageUrl)
          .map((m) => ({
            id: m.id,
            imageUrl: m.imageUrl as string,
            width: typeof m.imageWidth === 'number' ? m.imageWidth : undefined,
            height: typeof m.imageHeight === 'number' ? m.imageHeight : undefined,
            createdAt: typeof m.createdAt === 'number' ? m.createdAt : undefined,
            drawing: m.drawing ?? null,
            texts: m.texts ?? null,
            from: m.from,
            text: m.text,
            reactionPatient: m.reactionPatient,
            reactionClinic: m.reactionClinic,
            starredPatient: m.starredPatient,
          }))
          .reverse();
        setMedia(imgs);
        setStarredCount(snap.docs.filter((d) => (d.data() as any).starredPatient === true).length);
      },
      (e) => console.error('[your-info] media sub error', e),
    );
    return () => unsub();
  }, [patientId, patientAuthReady]);

  useEffect(() => {
    if (!patientAuthReady) return;
    if (!clinicId || !patientId) {
      setLoading(false);
      return;
    }
    getDoc(doc(patientDb, 'clinics', clinicId as string, 'patients', patientId as string))
      .then((snap) => {
        if (snap.exists()) setPatient({ id: snap.id, ...(snap.data() as any) });
      })
      .catch((e) => console.error('[your-info] load error', e))
      .finally(() => setLoading(false));
  }, [clinicId, patientId, patientAuthReady]);

  const displayName = patient?.name || 'Patient';
  const code = patient?.code;
  const palette = AVATAR_PALETTE[hashName(displayName) % AVATAR_PALETTE.length];

  const handleBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/patient' as any);
  };

  const handleCopyCode = async () => {
    if (!code) return;
    await Clipboard.setStringAsync(String(code));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const textPrimary = colors.textPrimary;
  const textSecondary = colors.textSecondary;

  const backBg = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.92)';
  const backBgPressed = isDark ? 'rgba(255,255,255,0.15)' : 'rgba(27, 37, 66, 0.1)';
  const backIconColor = isDark ? '#FFFFFF' : '#1B2542';

  const pillBg = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.7)';
  const pillBorder = isDark ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.85)';

  const cardBg = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.55)';
  const cardBorder = isDark ? 'rgba(255,255,255,0.09)' : 'rgba(255,255,255,0.75)';
  const rowIconBg = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(61,158,255,0.14)';
  const rowIconColor = '#3D9EFF';
  const dividerColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(27,37,66,0.06)';
  const chevronColor = isDark ? 'rgba(255,255,255,0.35)' : 'rgba(27,37,66,0.35)';

  const phone: string | undefined = patient?.phone || undefined;
  const email: string | undefined = patient?.email || undefined;
  const address: string | undefined = patient?.address || undefined;
  const genderRaw: string | undefined = patient?.gender || undefined;
  const genderDisplay = genderRaw
    ? genderRaw.charAt(0).toUpperCase() + genderRaw.slice(1).toLowerCase()
    : undefined;
  const dob: string | undefined = patient?.dateOfBirth || undefined;

  const hasContact = !!(phone || email);
  const hasDetails = !!(dob || genderDisplay || address);

  const MEDIA_H_PADDING = 16;
  const MEDIA_GAP = 6;
  const mediaCellSize =
    (Dimensions.get('window').width - MEDIA_H_PADDING * 2 - MEDIA_GAP * 2) / 3;

  const gridItems = media.slice(0, 12);
  const pages: ViewerPage[] = useMemo(
    () => gridItems.map((m) => ({
      url: m.imageUrl,
      width: m.width,
      height: m.height,
      msgId: m.id,
      drawing: m.drawing ?? null,
      texts: m.texts ?? null,
    })),
    [gridItems],
  );

  const renderRow = (opts: {
    icon: React.ComponentProps<typeof Ionicons>['name'];
    label: string;
    value: string;
    onPress?: () => void;
    showChevron?: boolean;
    isLast?: boolean;
  }) => {
    const { icon, label, value, onPress, showChevron, isLast } = opts;
    const body = (
      <View style={styles.rowInner}>
        <View style={[styles.rowIconWrap, { backgroundColor: rowIconBg }]}>
          <Ionicons name={icon} size={18} color={rowIconColor} />
        </View>
        <View style={styles.rowBody}>
          <Text style={[styles.rowLabel, { color: textSecondary }]}>{label}</Text>
          <Text style={[styles.rowValue, { color: textPrimary }]} numberOfLines={2}>
            {value}
          </Text>
        </View>
        {showChevron ? (
          <Ionicons name="chevron-forward" size={18} color={chevronColor} />
        ) : null}
      </View>
    );
    return (
      <View>
        {onPress ? (
          <Pressable
            onPress={onPress}
            style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}
          >
            {body}
          </Pressable>
        ) : (
          <View style={styles.row}>{body}</View>
        )}
        {!isLast ? (
          <View style={[styles.divider, { backgroundColor: dividerColor }]} />
        ) : null}
      </View>
    );
  };

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
          <Text style={[styles.headerTitle, { color: textPrimary }]}>Your info</Text>
        </View>
      </View>

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
          <View style={styles.hero}>
            <LinearGradient
              colors={palette as any}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.avatar}
            >
              <Text style={styles.avatarInitials}>{initialsOf(displayName)}</Text>
            </LinearGradient>

            <Text style={[styles.name, { color: textPrimary }]} numberOfLines={2}>
              {displayName}
            </Text>

            {code ? (
              <Pressable
                onPress={handleCopyCode}
                style={({ pressed }) => [
                  styles.codePill,
                  { backgroundColor: pillBg, borderColor: pillBorder },
                  pressed && { opacity: 0.75 },
                ]}
                hitSlop={6}
              >
                <Text style={[styles.codeText, { color: textSecondary }]}>
                  Code · {String(code)}
                </Text>
                <Ionicons
                  name={copied ? 'checkmark-outline' : 'copy-outline'}
                  size={16}
                  color={copied ? '#10B981' : '#3D9EFF'}
                />
                {copied ? (
                  <Text style={[styles.copiedLabel, { color: '#10B981' }]}>Copied</Text>
                ) : null}
              </Pressable>
            ) : null}
          </View>

          {hasContact ? (
            <>
              <Text style={[styles.eyebrow, { color: textSecondary }]}>CONTACT</Text>
              <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                {phone
                  ? renderRow({
                      icon: 'call-outline',
                      label: 'Phone',
                      value: phone,
                      onPress: () => Linking.openURL(`tel:${phone}`),
                      showChevron: true,
                      isLast: !email,
                    })
                  : null}
                {email
                  ? renderRow({
                      icon: 'mail-outline',
                      label: 'Email',
                      value: email,
                      onPress: () => Linking.openURL(`mailto:${email}`),
                      showChevron: true,
                      isLast: true,
                    })
                  : null}
              </View>
            </>
          ) : null}

          {hasDetails ? (
            <>
              <Text style={[styles.eyebrow, { color: textSecondary }]}>DETAILS</Text>
              <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                {(() => {
                  const rows: { icon: React.ComponentProps<typeof Ionicons>['name']; label: string; value: string }[] = [];
                  if (dob) rows.push({ icon: 'calendar-outline', label: 'Date of birth', value: dob });
                  if (genderDisplay) rows.push({ icon: 'person-outline', label: 'Gender', value: genderDisplay });
                  if (address) rows.push({ icon: 'location-outline', label: 'Address', value: address });
                  return rows.map((r, i) => (
                    <View key={i}>
                      {renderRow({ ...r, isLast: i === rows.length - 1 })}
                    </View>
                  ));
                })()}
              </View>
            </>
          ) : null}

          <Text style={[styles.eyebrow, { color: textSecondary }]}>CHAT</Text>
          <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            {renderRow({
              icon: 'search',
              label: 'Search',
              value: 'Search in this chat',
              onPress: () => {
                requestOpenSearch();
                if (router.canGoBack()) router.back();
              },
              showChevron: true,
              isLast: true,
            })}
          </View>

          <Text style={[styles.eyebrow, { color: textSecondary }]}>STARRED</Text>
          <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            {renderRow({
              icon: 'star',
              label: 'Starred messages',
              value: starredCount > 0 ? `${starredCount} message${starredCount === 1 ? '' : 's'}` : 'None yet',
              isLast: true,
            })}
          </View>

          <View style={styles.mediaHeaderRow}>
            <Text style={[styles.eyebrow, styles.mediaEyebrow, { color: textSecondary }]}>
              MEDIA
            </Text>
            <Text style={[styles.mediaCount, { color: textSecondary }]}>
              {media.length}
            </Text>
          </View>
          {media.length === 0 ? (
            <View
              style={[
                styles.mediaEmpty,
                { backgroundColor: cardBg, borderColor: cardBorder },
              ]}
            >
              <Ionicons name="images-outline" size={22} color={chevronColor} />
              <Text style={[styles.mediaEmptyText, { color: textSecondary }]}>
                No media shared yet
              </Text>
            </View>
          ) : (
            <View style={styles.mediaGrid}>
              {gridItems.map((m, index) => (
                <Pressable
                  key={m.id}
                  onPress={() => openInfoViewer(index)}
                  style={({ pressed }) => [
                    styles.mediaCell,
                    { width: mediaCellSize, height: mediaCellSize },
                    pressed && { opacity: 0.8 },
                  ]}
                >
                  <Image
                    source={{ uri: m.imageUrl }}
                    style={styles.mediaImage}
                    resizeMode="cover"
                  />
                </Pressable>
              ))}
            </View>
          )}
        </ScrollView>
      )}

      <MediaViewerModal
        visible={viewerOpen}
        pages={pages}
        index={viewerIndex}
        onIndexChange={setViewerIndex}
        onClose={() => setViewerOpen(false)}
        title={(p) => {
          const m = media.find((it) => it.id === p.msgId);
          return m?.from === 'patient' ? 'You' : 'Clinic';
        }}
        timeLabel={(p) => {
          const m = media.find((it) => it.id === p.msgId);
          return formatInfoTime(m?.createdAt);
        }}
        ownSticker={(p) => media.find((it) => it.id === p.msgId)?.reactionPatient}
        otherSticker={(p) => media.find((it) => it.id === p.msgId)?.reactionClinic}
        onShare={(p) => {
          const m = media.find((it) => it.id === p.msgId);
          Share.share({ message: m?.text ? `${m.text}\n${p.url}` : p.url }).catch(() => {});
        }}
        starred={(p) => !!media.find((it) => it.id === p.msgId)?.starredPatient}
        onToggleStar={async (p) => {
          const m = media.find((it) => it.id === p.msgId);
          if (!m || !patientId) return;
          await updateDoc(doc(patientDb, `patients/${patientId}/messages/${m.id}`), {
            starredPatient: m.starredPatient ? deleteField() : true,
          });
        }}
        canDelete={(p) => media.find((it) => it.id === p.msgId)?.from === 'patient'}
        onDelete={(p) => {
          const m = media.find((it) => it.id === p.msgId);
          if (!m || m.from !== 'patient' || !patientId) return;
          Alert.alert(
            'Delete this message?',
            'This permanently deletes the message for both you and the clinic. This cannot be undone.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Delete', style: 'destructive', onPress: async () => {
                try { await deleteDoc(doc(patientDb, `patients/${patientId}/messages/${m.id}`)); setViewerOpen(false); }
                catch (e) { console.error('[your-info] delete error', e); }
              } },
            ],
          );
        }}
        onEditSticker={openStickerForPage}
        stickerSheet={stickerKbOpen ? (() => {
          const target = stickerTarget;
          const cur = target ? media.find((it) => it.id === target.msgId)?.reactionPatient : undefined;
          return (
            <View style={StyleSheet.absoluteFill}>
              <Pressable style={StyleSheet.absoluteFill} onPress={() => { setStickerKbOpen(false); setStickerTarget(null); }} />
              <View style={styles.stickerKbSheet}>
                <View style={styles.stickerKbHeader}>
                  {cur ? (
                    <Pressable
                      onPress={() => { if (target) setMyReaction(target.msgId, cur, cur); setStickerKbOpen(false); setStickerTarget(null); }}
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
                    if (picked && target) setMyReaction(target.msgId, picked, cur);
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

  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  hero: {
    alignItems: 'center',
    paddingTop: 20,
    paddingHorizontal: 20,
    gap: 14,
  },
  avatar: {
    width: 104,
    height: 104,
    borderRadius: 52,
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
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  name: {
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
  },
  codePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  codeText: {
    fontSize: 13,
    fontWeight: '700',
  },
  copiedLabel: {
    fontSize: 11.5,
    fontWeight: '700',
  },

  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
    gap: 8,
  },

  eyebrow: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginTop: 14,
    marginBottom: 6,
    paddingHorizontal: 4,
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  row: {
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  rowInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rowIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowBody: { flex: 1 },
  rowLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  rowValue: {
    fontSize: 15,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    marginLeft: 62,
  },

  mediaHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    marginBottom: 6,
    paddingHorizontal: 4,
  },
  mediaEyebrow: {
    marginTop: 0,
    marginBottom: 0,
    paddingHorizontal: 0,
  },
  mediaCount: {
    fontSize: 12,
    fontWeight: '700',
  },
  mediaEmpty: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  mediaEmptyText: {
    fontSize: 13.5,
    fontWeight: '600',
  },
  mediaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  mediaCell: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  mediaImage: {
    width: '100%',
    height: '100%',
  },
  stickerKbSheet: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 420, backgroundColor: '#FFFFFF', overflow: 'hidden' },
  stickerKbHeader: { height: 40, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 12 },
  stickerKbClose: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.06)', justifyContent: 'center', alignItems: 'center' },
  stickerKbCurrent: { minWidth: 32, height: 32, borderRadius: 16, paddingHorizontal: 6, backgroundColor: 'rgba(0,0,0,0.06)', justifyContent: 'center', alignItems: 'center' },
});
