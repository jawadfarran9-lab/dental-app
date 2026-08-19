import { patientDb } from '@/firebaseConfig';
import { PremiumGradientBackground } from '@/src/components/PremiumGradientBackground';
import VoiceBubble from '@/src/components/VoiceBubble';
import RecordingBar from '@/src/components/RecordingBar';
import { ZoomableImage } from '@/src/components/ZoomableImage';
import { ViewerVideo } from '@/src/components/ViewerVideo';
import { BubbleTextsOverlay } from '@/src/components/BubbleTextsOverlay';
import { useTheme } from '@/src/context/ThemeContext';
import { usePatientAuthReady } from '@/src/hooks/usePatientAuthReady';
import { sendImageMessage, sendAudioMessage, TextsDoc } from '@/src/services/chatImages';
import { consumeOpenSearch } from '@/src/state/chatSearchSignal';
import { usePatientGuard } from '@/src/utils/navigationGuards';
import { ensureThread, markThreadReadForPatient, updateThreadOnMessage } from '@/src/utils/threadsHelper';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useFocusEffect, useRouter } from 'expo-router';
import { addDoc, collection, deleteDoc, deleteField, doc, getDoc, onSnapshot, orderBy, query, updateDoc } from 'firebase/firestore';
import { useCallback, useEffect, useMemo, useRef, useState, cloneElement, isValidElement } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  FlatList,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Svg, { Path } from 'react-native-svg';
import EmojiPicker, { EmojiKeyboard } from 'rn-emoji-keyboard';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

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

function formatBubbleTime(ts: any): string {
  if (!ts) return '';
  const date = typeof ts === 'number' ? new Date(ts) : ts instanceof Date ? new Date(ts) : null;
  if (!date || Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function formatInfoTime(ts?: number): string {
  if (!ts) return '';
  const d = new Date(ts);
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  let h = d.getHours();
  const m = d.getMinutes().toString().padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()} · ${h}:${m} ${ampm}`;
}

const formatVoiceDuration = (ms: number) => { const s = Math.floor(ms / 1000); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };

type Message = {
  id: string;
  from: 'patient' | 'clinic';
  text: string;
  senderName?: string;
  createdAt?: any;
  type?: 'image' | 'audio' | 'album' | 'video';
  imageUrl?: string;
  imageWidth?: number;
  imageHeight?: number;
  storagePath?: string;
  videoUrl?: string;
  posterUrl?: string | null;
  posterPath?: string | null;
  videoWidth?: number | null;
  videoHeight?: number | null;
  audioUrl?: string;
  durationMs?: number | null;
  waveform?: number[];
  mimeType?: string;
  media?: {
    kind: 'image' | 'video';
    url: string;
    storagePath: string;
    width?: number;
    height?: number;
    posterUrl?: string;
    durationMs?: number;
    sticker?: string;
    stickerPatient?: string;
  }[];
  reactionClinic?: string;
  reactionPatient?: string;
  seenAt?: number;
  starredPatient?: boolean;
  drawing?: { vb: [number, number]; strokes: Array<{ color: string; width: number; d: string }> } | null;
  texts?: TextsDoc | null;
};

type ViewerPage = { url: string; width?: number; height?: number; msgId: string; mediaIndex?: number; videoUrl?: string; kind?: 'image' | 'video'; drawing?: { vb: [number, number]; strokes: Array<{ color: string; width: number; d: string }> } | null; texts?: TextsDoc | null };

const REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];
const RECENT_MAX = 6;
const RECENTS_KEY = 'reactions:recent:v3';
const STICKER_QUICKS = ['⭐', '❤️', '💯', '👍', '👏', '🔥'];
const STICKER_RECENTS_KEY = 'stickers:recent:v1';

type MessageBubbleProps = {
  item: Message;
  children: React.ReactNode;
  onOpen: (item: Message, rect: { x: number; y: number; w: number; h: number }) => void;
};
const MessageBubble = ({ item, children, onOpen }: MessageBubbleProps) => {
  const ref = useRef<View>(null);
  const handleLongPress = () => {
    Keyboard.dismiss();
    requestAnimationFrame(() => {
      ref.current?.measureInWindow((x, y, w, h) => {
        onOpen(item, { x, y, w, h });
      });
    });
  };
  return (
    <Pressable ref={ref} onLongPress={handleLongPress} delayLongPress={350} style={{ maxWidth: '78%' }}>
      {isValidElement(children)
        ? cloneElement(children as any, { onLongPress: handleLongPress })
        : children}
    </Pressable>
  );
};

export default function ClinicConversationScreen() {
  usePatientGuard();
  const patientAuthReady = usePatientAuthReady();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const [patientId, setPatientId] = useState<string | null>(null);
  const [clinicId, setClinicId] = useState<string | null>(null);
  const [clinicName, setClinicName] = useState<string>('');
  const [patientName, setPatientName] = useState<string>('Patient');
  const [sessionLoading, setSessionLoading] = useState(true);

  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [voiceSending, setVoiceSending] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerPages, setViewerPages] = useState<ViewerPage[]>([]);
  const [viewerIndex, setViewerIndex] = useState(0);
  const viewerListRef = useRef<FlatList<ViewerPage>>(null);
  const stripRef = useRef<ScrollView>(null);
  const [viewerZoomed, setViewerZoomed] = useState(false);
  const [scrubbing, setScrubbing] = useState(false);
  const [stickerKbOpen, setStickerKbOpen] = useState(false);
  const [stickerTarget, setStickerTarget] = useState<{ msgId: string; mediaIndex?: number } | null>(null);
  const [stickerSheetOpen, setStickerSheetOpen] = useState(false);
  const [stickerSheetTarget, setStickerSheetTarget] = useState<Message | null>(null);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryMessage, setGalleryMessage] = useState<Message | null>(null);
  const [galStickerTarget, setGalStickerTarget] = useState<{ msgId: string; mediaIndex: number } | null>(null);
  const [galKbOpen, setGalKbOpen] = useState(false);
  const [attachVisible, setAttachVisible] = useState(false);
  const [attachBusy, setAttachBusy] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useFocusEffect(
    useCallback(() => {
      if (consumeOpenSearch()) setSearchOpen(true);
    }, []),
  );
  const [clearedForPatientAt, setClearedForPatientAt] = useState<number>(0);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [actionMenuOpen, setActionMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);
  const [anchorRect, setAnchorRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [rowPos, setRowPos] = useState<{ top: number; left: number } | null>(null);
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const [reactionTarget, setReactionTarget] = useState<Message | null>(null);
  const [reactionSheetOpen, setReactionSheetOpen] = useState(false);
  const [reactionSheetTarget, setReactionSheetTarget] = useState<Message | null>(null);
  const [messageInfoOpen, setMessageInfoOpen] = useState(false);
  const [messageInfoTarget, setMessageInfoTarget] = useState<Message | null>(null);
  const openMessageInfo = (m: Message) => { setMessageInfoTarget(m); setMessageInfoOpen(true); };
  const buildAllChatImages = (): ViewerPage[] => {
    const out: ViewerPage[] = [];
    for (const m of messages) {
      if (m.type === 'image' && m.imageUrl) {
        out.push({ url: m.imageUrl, width: m.imageWidth, height: m.imageHeight, msgId: m.id, drawing: m.drawing ?? null, texts: m.texts ?? null });
      } else if (m.type === 'album' && Array.isArray(m.media)) {
        m.media.forEach((it, idx) => {
          out.push({ url: it.url, width: it.width, height: it.height, msgId: m.id, mediaIndex: idx });
        });
      } else if (m.type === 'video' && (m.videoUrl || m.posterUrl)) {
        out.push({
          url: m.posterUrl ?? '',
          videoUrl: m.videoUrl,
          width: m.videoWidth ?? undefined,
          height: m.videoHeight ?? undefined,
          msgId: m.id,
          kind: 'video',
          drawing: m.drawing ?? null,
          texts: m.texts ?? null,
        });
      }
    }
    return out;
  };
  const openViewerSingle = (m: Message) => {
    const pages = buildAllChatImages();
    const start = Math.max(0, pages.findIndex((p) => p.msgId === m.id));
    setViewerPages(pages);
    setViewerIndex(start);
    setViewerZoomed(false);
    setViewerOpen(true);
  };
  const openViewerFromGallery = (albumMsg: Message, mediaIndex: number) => {
    const pages = buildAllChatImages();
    const albumStart = pages.findIndex((p) => p.msgId === albumMsg.id);
    const start = albumStart >= 0 ? albumStart + mediaIndex : 0;
    setGalleryOpen(false);
    setGalleryMessage(null);
    setViewerPages(pages);
    setViewerIndex(Math.max(0, start));
    setViewerZoomed(false);
    setViewerOpen(true);
  };
  const closeViewer = () => { setViewerOpen(false); setViewerPages([]); setViewerIndex(0); };
  const openStickerForPage = (page: ViewerPage) => {
    setStickerTarget({ msgId: page.msgId, mediaIndex: page.mediaIndex });
    setStickerKbOpen(true);
  };
  const openAlbumGallery = (m: Message) => { setGalleryMessage(m); setGalleryOpen(true); };
  const closeGallery = () => { setGalleryOpen(false); setGalleryMessage(null); };
  const shareViewerCurrent = async (url?: string, caption?: string) => {
    if (!url) return;
    try {
      await Share.share({ message: caption ? `${caption}\n${url}` : url });
    } catch {
      // user cancelled or share failed — no-op
    }
  };

  useEffect(() => {
    if (!viewerOpen) return;
    const cur = viewerPages[viewerIndex];
    if (cur && !messages.some((m) => m.id === cur.msgId)) {
      closeViewer();
    }
  }, [messages, viewerOpen, viewerPages, viewerIndex]);

  useEffect(() => {
    if (!viewerOpen || viewerPages.length <= 1) return;
    const SCREEN_W = Dimensions.get('window').width;
    const contentWidth = 32 + viewerPages.length * 40 + (viewerPages.length - 1) * 8;
    const maxX = Math.max(0, contentWidth - SCREEN_W);
    const targetX = Math.min(maxX, Math.max(0, 36 + viewerIndex * 48 - SCREEN_W / 2));
    const t = setTimeout(() => {
      stripRef.current?.scrollTo({ x: targetX, animated: true });
    }, 60);
    return () => clearTimeout(t);
  }, [viewerOpen, viewerIndex, viewerPages.length]);

  useEffect(() => {
    if (!galleryOpen || !galleryMessage) return;
    if (!messages.some((m) => m.id === galleryMessage.id)) {
      closeGallery();
    }
  }, [messages, galleryOpen, galleryMessage]);
  const closeMessageInfo = () => setMessageInfoOpen(false);
  const [recents, setRecents] = useState<string[]>([]);
  const [recentsLoaded, setRecentsLoaded] = useState(false);
  const [stickerRecents, setStickerRecents] = useState<string[]>([]);
  const [stickerRecentsLoaded, setStickerRecentsLoaded] = useState(false);
  const [copiedVisible, setCopiedVisible] = useState(false);
  const copiedAnim = useRef(new Animated.Value(0)).current;
  const inputRef = useRef<TextInput>(null);
  const preEditDraftRef = useRef('');
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const listRef = useRef<FlatList<Message>>(null);

  const baseMessages = useMemo(
    () => messages.filter((m) => (m.createdAt ?? 0) > (clearedForPatientAt ?? 0)),
    [messages, clearedForPatientAt],
  );

  // Search navigates instead of filtering: all messages stay visible.
  const displayedMessages = baseMessages;

  const [matchIndex, setMatchIndex] = useState(0);

  const searchMatches = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!searchOpen || !q) return [] as number[];
    const idxs: number[] = [];
    baseMessages.forEach((m, i) => {
      if ((m.text || '').toLowerCase().includes(q)) idxs.push(i);
    });
    return idxs;
  }, [baseMessages, searchOpen, searchQuery]);

  const currentMatchId =
    searchMatches.length > 0 ? baseMessages[searchMatches[matchIndex]]?.id ?? null : null;

  const scrollToMatch = (listIndex: number) => {
    try {
      listRef.current?.scrollToIndex({ index: listIndex, animated: true, viewPosition: 0.4 });
    } catch {}
  };

  useEffect(() => {
    if (searchMatches.length > 0) {
      const last = searchMatches.length - 1;
      setMatchIndex(last);
      setTimeout(() => scrollToMatch(searchMatches[last]), 50);
    }
  }, [searchMatches]);

  const goOlderMatch = () => {
    if (searchMatches.length === 0) return;
    const next = Math.max(0, matchIndex - 1);
    setMatchIndex(next);
    scrollToMatch(searchMatches[next]);
  };
  const goNewerMatch = () => {
    if (searchMatches.length === 0) return;
    const next = Math.min(searchMatches.length - 1, matchIndex + 1);
    setMatchIndex(next);
    scrollToMatch(searchMatches[next]);
  };

  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [pickedDate, setPickedDate] = useState<Date>(() => new Date());

  const jumpToDate = () => {
    const target = new Date(pickedDate.getFullYear(), pickedDate.getMonth(), pickedDate.getDate(), 0, 0, 0).getTime();
    setDatePickerOpen(false);
    const idx = baseMessages.findIndex((m) => (m.createdAt ?? 0) >= target);
    const targetIdx = idx >= 0 ? idx : baseMessages.length - 1;
    if (targetIdx >= 0) setTimeout(() => scrollToMatch(targetIdx), 250);
  };

  const strip = useMemo(() => {
    const list = [...recents];
    const cur = selectedMessage?.reactionPatient;
    if (cur && !REACTIONS.includes(cur) && !list.includes(cur)) list.unshift(cur);
    return list;
  }, [recents, selectedMessage]);

  const reactionSheetEntries = useMemo(() => {
    const t = reactionSheetTarget;
    if (!t) return [] as { key: string; emoji: string; name: string; me: boolean }[];
    const list: { key: string; emoji: string; name: string; me: boolean }[] = [];
    if (t.reactionPatient) list.push({ key: 'patient', emoji: t.reactionPatient, name: 'You', me: true });
    if (t.reactionClinic) list.push({ key: 'clinic', emoji: t.reactionClinic, name: clinicName || 'Clinic', me: false });
    return list;
  }, [reactionSheetTarget, clinicName]);

  const reactionSheetChips = useMemo(() => {
    const m: Record<string, number> = {};
    reactionSheetEntries.forEach((e) => { m[e.emoji] = (m[e.emoji] || 0) + 1; });
    return Object.entries(m);
  }, [reactionSheetEntries]);

  const stickerSheetEntries = useMemo(() => {
    const t = stickerSheetTarget;
    if (!t) return { clinic: [] as Array<{ index: number; url: string; sticker: string }>, patient: [] as Array<{ index: number; url: string; sticker: string }> };
    const m = messages.find((x) => x.id === t.id) ?? t;
    if (m.type !== 'album' || !Array.isArray(m.media)) return { clinic: [] as Array<{ index: number; url: string; sticker: string }>, patient: [] as Array<{ index: number; url: string; sticker: string }> };
    const clinic: Array<{ index: number; url: string; sticker: string }> = [];
    const patient: Array<{ index: number; url: string; sticker: string }> = [];
    m.media.forEach((mm, idx) => {
      if (mm.sticker) clinic.push({ index: idx, url: mm.url, sticker: mm.sticker });
      if (mm.stickerPatient) patient.push({ index: idx, url: mm.url, sticker: mm.stickerPatient });
    });
    return { clinic, patient };
  }, [stickerSheetTarget, messages]);

  const infoMsg = useMemo(
    () => (messageInfoTarget ? messages.find((m) => m.id === messageInfoTarget.id) ?? messageInfoTarget : null),
    [messageInfoTarget, messages],
  );

  type ActionItem = {
    key: string;
    label: string;
    icon: React.ComponentProps<typeof Ionicons>['name'];
    danger?: boolean;
  };
  const getActionsFor = (m: Message | null): ActionItem[] => {
    if (!m) return [];
    const isOwn = m.from === 'patient';
    const isImage = m.type === 'image';
    const isAudio = m.type === 'audio';
    const isAlbum = m.type === 'album';
    if (isOwn && isImage) {
      return [
        { key: 'forward', label: 'Forward', icon: 'arrow-redo-outline' },
        { key: 'info', label: 'Info', icon: 'information-circle-outline' },
        { key: 'star', label: 'Star', icon: 'star-outline' },
        { key: 'remove', label: 'Remove', icon: 'trash-outline', danger: true },
      ];
    }
    if (isOwn) {
      const items: ActionItem[] = [
        { key: 'forward', label: 'Forward', icon: 'arrow-redo-outline' },
        { key: 'copy', label: 'Copy', icon: 'copy-outline' },
        { key: 'edit', label: 'Edit', icon: 'create-outline' },
        { key: 'info', label: 'Info', icon: 'information-circle-outline' },
        { key: 'star', label: 'Star', icon: 'star-outline' },
        { key: 'remove', label: 'Remove', icon: 'trash-outline', danger: true },
      ];
      return items.filter((a) => !(isAudio && (a.key === 'copy' || a.key === 'edit')));
    }
    if (isImage) {
      return [
        { key: 'forward', label: 'Forward', icon: 'arrow-redo-outline' },
        { key: 'info', label: 'Info', icon: 'information-circle-outline' },
        { key: 'star', label: 'Star', icon: 'star-outline' },
      ];
    }
    return [
      { key: 'forward', label: 'Forward', icon: 'arrow-redo-outline' },
      { key: 'copy', label: 'Copy', icon: 'copy-outline' },
      { key: 'info', label: 'Info', icon: 'information-circle-outline' },
      { key: 'star', label: 'Star', icon: 'star-outline' },
    ];
  };

  const openActionMenu = (m: Message, rect: { x: number; y: number; w: number; h: number }) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    const { height: screenH, width: screenW } = Dimensions.get('window');
    const rows = getActionsFor(m).length;
    const ROW_H = 48;
    const LIST_PAD = 12;
    const MENU_W = 240;
    const MARGIN = 8;
    const menuH = rows * ROW_H + LIST_PAD;
    const spaceBelow = (screenH - insets.bottom) - (rect.y + rect.h);
    const spaceAbove = rect.y - insets.top;
    let top: number;
    let placedBelow: boolean;
    if (spaceBelow >= menuH + MARGIN) {
      top = rect.y + rect.h + MARGIN;
      placedBelow = true;
    } else if (spaceAbove >= menuH + MARGIN) {
      top = rect.y - menuH - MARGIN;
      placedBelow = false;
    } else {
      top = Math.min(
        Math.max(rect.y + rect.h + MARGIN, insets.top + 8),
        screenH - insets.bottom - menuH - 8,
      );
      placedBelow = true;
    }
    const own = m.from === 'patient';
    let left = own ? rect.x + rect.w - MENU_W : rect.x;
    left = Math.min(Math.max(left, 12), screenW - MENU_W - 12);

    const ROW_W = 360;
    const ROW_H_REACT = 52;
    const ROW_MARGIN = 8;
    let rowTop: number;
    if (placedBelow) {
      rowTop = rect.y - ROW_H_REACT - ROW_MARGIN;
      if (rowTop < insets.top + 8) rowTop = insets.top + 8;
    } else {
      rowTop = rect.y + rect.h + ROW_MARGIN;
      const maxTop = screenH - insets.bottom - ROW_H_REACT - 8;
      if (rowTop > maxTop) rowTop = maxTop;
    }
    let rowLeft = own ? rect.x + rect.w - ROW_W : rect.x;
    rowLeft = Math.min(Math.max(rowLeft, 12), screenW - ROW_W - 12);

    setSelectedMessage(m);
    setMenuPos({ top, left });
    setAnchorRect(rect);
    setRowPos({ top: rowTop, left: rowLeft });
    setActionMenuOpen(true);
  };
  const closeActionMenu = () => setActionMenuOpen(false);

  const openReactionSheet = (m: Message) => {
    Haptics.selectionAsync().catch(() => {});
    setReactionSheetTarget(m);
    setReactionSheetOpen(true);
  };
  const closeReactionSheet = () => setReactionSheetOpen(false);

  const openStickerSheet = (m: Message) => {
    Haptics.selectionAsync().catch(() => {});
    setStickerSheetTarget(m);
    setStickerSheetOpen(true);
  };
  const closeStickerSheet = () => setStickerSheetOpen(false);

  const removeSticker = (entry: { index: number; sticker?: string }) => {
    if (!stickerSheetTarget || !entry.sticker) return;
    setImageSticker({ msgId: stickerSheetTarget.id, mediaIndex: entry.index }, entry.sticker);
  };

  const setMessageReaction = async (message: Message, emoji: string) => {
    if (!patientId) return;
    const isClearing = message.reactionPatient === emoji;
    try {
      const next = isClearing ? deleteField() : emoji;
      await updateDoc(doc(patientDb, `patients/${patientId}/messages/${message.id}`), { reactionPatient: next });
      if (!isClearing && !REACTIONS.includes(emoji)) pushRecent(emoji);
    } catch (e) {
      console.error('[conversation] set reaction error', e);
    }
  };

  const setImageSticker = async (target: { msgId: string; mediaIndex?: number }, emoji: string) => {
    if (!patientId) return;
    const msg = messages.find((m) => m.id === target.msgId);
    if (!msg) return;
    if (msg.type === 'album' && typeof target.mediaIndex === 'number' && Array.isArray(msg.media)) {
      const mi = target.mediaIndex;
      const newMedia = msg.media.map((it, idx) => {
        if (idx !== mi) return it;
        if (it.stickerPatient === emoji) {
          const { stickerPatient, ...rest } = it;
          return rest;
        }
        return { ...it, stickerPatient: emoji };
      });
      try {
        await updateDoc(doc(patientDb, `patients/${patientId}/messages/${target.msgId}`), { media: newMedia });
      } catch (e) {
        console.error('[conversation] set sticker error', e);
      }
    }
  };

  const toggleStar = async (m: Message) => {
    if (!patientId) return;
    try {
      await updateDoc(doc(patientDb, `patients/${patientId}/messages/${m.id}`), {
        starredPatient: m.starredPatient ? deleteField() : true,
      });
    } catch (e) {
      console.error('[conversation] toggle star error', e);
    }
  };

  const removeMyReaction = () => {
    if (reactionSheetTarget?.reactionPatient) {
      setMessageReaction(reactionSheetTarget, reactionSheetTarget.reactionPatient);
    }
    closeReactionSheet();
  };
  const openPickerFromSheet = () => {
    if (reactionSheetTarget) setReactionTarget(reactionSheetTarget);
    closeReactionSheet();
    setEmojiPickerOpen(true);
  };

  const handleShareMessage = async (m: Message) => {
    const body: string[] = [];
    if (m.text) body.push(m.text);
    if (m.type === 'image' && m.imageUrl) body.push(m.imageUrl);
    const content = body.join('\n');
    const message = content ? `${content}\n\nShared via BeSmile AI` : 'Shared via BeSmile AI';
    try {
      await Share.share({ message });
    } catch {
      // user cancelled or share failed — no-op
    }
  };

  const flashCopied = () => {
    setCopiedVisible(true);
    copiedAnim.stopAnimation();
    copiedAnim.setValue(0);
    Animated.sequence([
      Animated.timing(copiedAnim, { toValue: 1, duration: 180, useNativeDriver: true }),
      Animated.delay(1100),
      Animated.timing(copiedAnim, { toValue: 0, duration: 220, useNativeDriver: true }),
    ]).start(() => setCopiedVisible(false));
  };

  const handleCopyMessage = async (m: Message) => {
    const text = m.text?.trim();
    if (!text) return;
    try {
      await Clipboard.setStringAsync(text);
      Haptics.selectionAsync().catch(() => {});
      flashCopied();
    } catch (e) {
      console.error('[conversation] copy error', e);
    }
  };

  useEffect(() => {
    AsyncStorage.getItem(RECENTS_KEY)
      .then((raw) => {
        if (raw) {
          try {
            const arr = JSON.parse(raw);
            if (Array.isArray(arr)) setRecents(arr.filter((x) => typeof x === 'string'));
          } catch {}
        }
        setRecentsLoaded(true);
      })
      .catch(() => setRecentsLoaded(true));
  }, []);

  useEffect(() => {
    AsyncStorage.getItem(STICKER_RECENTS_KEY)
      .then((raw) => {
        if (raw) {
          try {
            const arr = JSON.parse(raw);
            if (Array.isArray(arr)) setStickerRecents(arr.filter((x) => typeof x === 'string'));
          } catch {}
        }
        setStickerRecentsLoaded(true);
      })
      .catch(() => setStickerRecentsLoaded(true));
  }, []);

  const pushRecent = (emoji: string) => {
    if (!recentsLoaded) return;
    setRecents((prev) => {
      const next = [emoji, ...prev.filter((x) => x !== emoji)].slice(0, RECENT_MAX);
      AsyncStorage.setItem(RECENTS_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  };

  const pushStickerRecent = (emoji: string) => {
    if (!stickerRecentsLoaded) return;
    setStickerRecents((prev) => {
      const next = [emoji, ...prev.filter((x) => x !== emoji)].slice(0, RECENT_MAX);
      AsyncStorage.setItem(STICKER_RECENTS_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  };

  useEffect(() => {
    if (!patientAuthReady) return;
    let cancelled = false;
    (async () => {
      try {
        const pid = await AsyncStorage.getItem('patientId');
        const cid = await AsyncStorage.getItem('patientClinicId');
        if (!pid || !cid) {
          router.replace('/patient' as any);
          return;
        }
        if (cancelled) return;
        setPatientId(pid);
        setClinicId(cid);
        try {
          const pSnap = await getDoc(doc(patientDb, 'clinics', cid, 'patients', pid));
          if (!cancelled && pSnap.exists()) {
            const pData = pSnap.data() as any;
            if (pData?.name) setPatientName(String(pData.name));
          }
        } catch (err) {
          console.error('[patient/conversation] load patient error', err);
        }
        try {
          const cSnap = await getDoc(doc(patientDb, 'clinics', cid));
          if (!cancelled && cSnap.exists()) {
            const cData = cSnap.data() as any;
            setClinicName(cData?.clinicName || '');
          }
        } catch (err) {
          console.error('[patient/conversation] load clinic name error', err);
        }
      } finally {
        if (!cancelled) setSessionLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [router, patientAuthReady]);

  useEffect(() => {
    if (!patientAuthReady) return;
    if (sessionLoading) return;
    if (!clinicId || !patientId) {
      setLoading(false);
      return;
    }

    markThreadReadForPatient(clinicId, patientId, patientDb);
    ensureThread(clinicId, patientId, patientName, patientDb);

    const q = query(
      collection(patientDb, `patients/${patientId}/messages`),
      orderBy('createdAt', 'asc')
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        const list: Message[] = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as any),
        }));
        setMessages(list);
        setLoading(false);
        setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 120);
      },
      (err) => {
        console.error('[patient/conversation] messages error', err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [sessionLoading, clinicId, patientId, patientName, patientAuthReady]);

  useEffect(() => {
    if (!patientAuthReady) return;
    if (!clinicId || !patientId) return;
    const unsub = onSnapshot(
      doc(patientDb, 'threads', `${clinicId}_${patientId}`),
      (snap) => {
        const v = snap.exists() ? (snap.data() as any).clearedForPatientAt : 0;
        setClearedForPatientAt(typeof v === 'number' ? v : 0);
      },
      (e) => console.error('[conversation] thread marker sub error', e),
    );
    return () => unsub();
  }, [clinicId, patientId, patientAuthReady]);

  const handleBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/patient' as any);
  };

  const openAttach = () => setAttachVisible(true);
  const closeAttach = () => setAttachVisible(false);

  const handlePickAndSendImage = async () => {
    if (!clinicId || !patientId) {
      Alert.alert('Missing info', 'Cannot send right now.');
      return;
    }
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please allow photo access to send an image.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 1,
      });
      if (result.canceled) return;
      const uri = result.assets?.[0]?.uri;
      if (!uri) return;
      setAttachBusy(true);
      await sendImageMessage({
        clinicId,
        patientId,
        patientName: patientName ?? '',
        localUri: uri,
        from: 'patient',
        senderName: 'Patient',
        senderType: 'patient',
      }, patientDb);
    } catch (err) {
      console.error('[patient-conversation] pick/send image error', err);
      Alert.alert('Upload failed', 'Please try again.');
    } finally {
      setAttachBusy(false);
    }
  };

  const handleSend = async () => {
    const text = draft.trim();
    if (!text || sending) return;
    if (!clinicId || !patientId) return;
    setSending(true);
    setDraft('');
    try {
      await addDoc(collection(patientDb, `patients/${patientId}/messages`), {
        from: 'patient',
        text,
        senderName: 'Patient',
        createdAt: Date.now(),
      });
      await updateThreadOnMessage(
        clinicId,
        patientId,
        patientName,
        text,
        'patient',
        patientDb,
      );
    } catch (err) {
      console.error('[patient/conversation] send error', err);
      setDraft(text);
    } finally {
      setSending(false);
    }
  };

  const onStartVoice = () => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {}); setIsRecording(true); };
  const onSendVoice = async (r: { uri: string; durationMs: number; waveform: number[] }) => {
    if (voiceSending) return;
    setVoiceSending(true);
    try {
      if (r.durationMs > 500 && clinicId && patientId) {
        await sendAudioMessage({
          clinicId,
          patientId,
          patientName: patientName ?? '',
          localUri: r.uri,
          durationMs: r.durationMs,
          waveform: r.waveform,
          from: 'patient',
          senderName: 'Patient',
          senderType: 'patient',
        }, patientDb);
      }
    } catch (e) { console.error('[patient/conversation] voice send', e); }
    finally { setVoiceSending(false); setIsRecording(false); }
  };

  const startEditMessage = (m: Message) => {
    preEditDraftRef.current = draft;
    setEditingMessage(m);
    setDraft(m.text);
    setTimeout(() => inputRef.current?.focus(), 150);
  };

  const cancelEdit = () => {
    setEditingMessage(null);
    setDraft(preEditDraftRef.current);
    preEditDraftRef.current = '';
    Keyboard.dismiss();
  };

  const handleConfirmEdit = async () => {
    if (!editingMessage || !patientId) return;
    const newText = draft.trim();
    if (!newText || newText === editingMessage.text.trim()) return;
    const target = editingMessage;
    setEditingMessage(null);
    setDraft(preEditDraftRef.current);
    preEditDraftRef.current = '';
    try {
      await updateDoc(doc(patientDb, `patients/${patientId}/messages/${target.id}`), { text: newText });
      const list = messages;
      const last = list[list.length - 1];
      if (last && last.id === target.id && clinicId) {
        try {
          await updateDoc(doc(patientDb, 'threads', `${clinicId}_${patientId}`), { lastMessageText: newText });
        } catch {
          // best-effort preview update
        }
      }
    } catch (err) {
      console.error('[patient/conversation] edit error', err);
    }
  };

  const handleRemoveMessage = (m: Message) => {
    if (!patientId) return;
    Alert.alert(
      'Delete this message?',
      'This permanently deletes the message for both you and the clinic. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const wasLast = messages.length > 0 && messages[messages.length - 1].id === m.id;
            const prev = wasLast ? messages[messages.length - 2] : undefined;
            try {
              await deleteDoc(doc(patientDb, `patients/${patientId}/messages/${m.id}`));
              if (wasLast && clinicId) {
                const preview = prev ? (prev.type === 'image' ? 'Photo' : prev.type === 'audio' ? '🎤 Voice message' : prev.text) : '';
                try {
                  await updateDoc(doc(patientDb, 'threads', `${clinicId}_${patientId}`), { lastMessageText: preview });
                } catch {
                  // best-effort preview refresh
                }
              }
            } catch (err) {
              console.error('[patient/conversation] remove error', err);
            }
          },
        },
      ],
    );
  };

  const textPrimary = colors.textPrimary;
  const textSecondary = colors.textSecondary;
  const textMuted = colors.textTertiary;

  const backBg = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.92)';
  const backBgPressed = isDark ? 'rgba(255,255,255,0.15)' : 'rgba(27, 37, 66, 0.1)';
  const backIconColor = isDark ? '#FFFFFF' : '#1B2542';

  const recvBubbleBg = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.55)';
  const recvBubbleBorder = isDark ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.75)';
  const recvText = textPrimary;

  const composerBg = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.7)';
  const composerBorder = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.85)';
  const inputBg = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.95)';
  const inputBorder = isDark ? 'rgba(255,255,255,0.10)' : 'rgba(27,37,66,0.08)';
  const inputPlaceholder = isDark ? 'rgba(255,255,255,0.45)' : 'rgba(27,37,66,0.42)';

  const attachBtnBg = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(120,140,170,0.12)';
  const attachBtnIcon = isDark ? '#FFFFFF' : '#1B2542';
  const sheetDivider = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(27,37,66,0.08)';
  const tileBg = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.7)';
  const tileBorder = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.85)';

  const palette = AVATAR_PALETTE[hashName(clinicName || 'Clinic') % AVATAR_PALETTE.length];

  const BubbleBody = ({ item, sent, time, onLongPress }: { item: Message; sent: boolean; time: string; onLongPress?: () => void }) => {
    const hasReaction = !!(item.reactionClinic || item.reactionPatient);
    const stickerList = item.type === 'album' && Array.isArray(item.media)
      ? item.media.flatMap((mm) => [mm.sticker, mm.stickerPatient]).filter(Boolean) as string[]
      : [];
    const hasSticker = stickerList.length > 0;
    const stickerBadge = hasSticker ? (
      <Pressable
        onPress={() => openStickerSheet(item)}
        hitSlop={8}
        style={[styles.reactionBadge, styles.reactionBadgeLeft]}
      >
        <Text style={styles.reactionBadgeText}>
          {stickerList.slice(0, 2).join(' ')}{stickerList.length > 2 ? ` +${stickerList.length - 2}` : ''}
        </Text>
      </Pressable>
    ) : null;
    const reactionBadge = hasReaction ? (
      <Pressable
        onPress={() => openReactionSheet(item)}
        hitSlop={8}
        style={[styles.reactionBadge, hasSticker ? styles.reactionBadgeRight : styles.reactionBadgeLeft]}
      >
        <Text style={styles.reactionBadgeText}>
          {[item.reactionClinic, item.reactionPatient].filter(Boolean).join(' ')}
        </Text>
      </Pressable>
    ) : null;

    const starBadge = item.starredPatient ? (
      <View style={styles.starBadge}>
        <Ionicons name="star" size={10} color="#F5A623" />
      </View>
    ) : null;

    if (item.type === 'album' && Array.isArray(item.media) && item.media.length > 0) {
      const ALBUM_W = 220;
      const GAP = 3;
      const cellSquare = Math.floor((ALBUM_W - GAP) / 2);
      const wideH = 130;
      const media = item.media;
      const extra = media.length - 3;
      let grid: React.ReactNode = null;
      if (media.length === 1) {
        grid = (
          <Pressable onPress={() => openAlbumGallery(item)} onLongPress={onLongPress} delayLongPress={350}>
            <Image
              source={{ uri: media[0].url }}
              style={{ width: ALBUM_W, height: ALBUM_W, borderRadius: 14 }}
              resizeMode="cover"
            />
          </Pressable>
        );
      } else if (media.length === 2) {
        grid = (
          <View style={[styles.albumRow, { width: ALBUM_W }]}>
            <Pressable onPress={() => openAlbumGallery(item)} onLongPress={onLongPress} delayLongPress={350} style={{ marginRight: GAP }}>
              <Image
                source={{ uri: media[0].url }}
                style={[styles.albumCell, { width: cellSquare, height: cellSquare }]}
                resizeMode="cover"
              />
            </Pressable>
            <Pressable onPress={() => openAlbumGallery(item)} onLongPress={onLongPress} delayLongPress={350}>
              <Image
                source={{ uri: media[1].url }}
                style={[styles.albumCell, { width: cellSquare, height: cellSquare }]}
                resizeMode="cover"
              />
            </Pressable>
          </View>
        );
      } else {
        grid = (
          <View style={{ width: ALBUM_W }}>
            <View style={[styles.albumRow, { marginBottom: GAP }]}>
              <Pressable onPress={() => openAlbumGallery(item)} onLongPress={onLongPress} delayLongPress={350} style={{ marginRight: GAP }}>
                <Image
                  source={{ uri: media[0].url }}
                  style={[styles.albumCell, { width: cellSquare, height: cellSquare }]}
                  resizeMode="cover"
                />
              </Pressable>
              <Pressable onPress={() => openAlbumGallery(item)} onLongPress={onLongPress} delayLongPress={350}>
                <Image
                  source={{ uri: media[1].url }}
                  style={[styles.albumCell, { width: cellSquare, height: cellSquare }]}
                  resizeMode="cover"
                />
              </Pressable>
            </View>
            <Pressable onPress={() => openAlbumGallery(item)} onLongPress={onLongPress} delayLongPress={350} style={{ position: 'relative' }}>
              <Image
                source={{ uri: media[2].url }}
                style={[styles.albumCellWide, { width: ALBUM_W, height: wideH }]}
                resizeMode="cover"
              />
              {extra > 0 && (
                <View style={styles.albumMore}>
                  <Text style={styles.albumMoreText}>+{extra}</Text>
                </View>
              )}
            </Pressable>
          </View>
        );
      }
      return (
        <View style={{ position: 'relative' }}>
          <View
            style={[
              styles.imageBubble,
              sent ? styles.imageBubbleSent : styles.imageBubbleRecv,
              !sent && { backgroundColor: recvBubbleBg, borderColor: recvBubbleBorder, borderWidth: 1 },
            ]}
          >
            <View style={styles.albumWrap}>{grid}</View>
            {!!item.text && (
              <Text
                style={[
                  styles.albumCaption,
                  sent ? styles.bubbleSentText : [styles.bubbleRecvText, { color: recvText }],
                ]}
              >
                {item.text}
              </Text>
            )}
            {!!time && (
              <Text
                style={[
                  styles.imageBubbleTime,
                  { color: sent ? 'rgba(255,255,255,0.78)' : textMuted },
                ]}
              >
                {time}
              </Text>
            )}
          </View>
          {stickerBadge}
          {reactionBadge}
          {starBadge}
        </View>
      );
    }
    if (item.type === 'image' && item.imageUrl) {
      const BUBBLE_MAX_W = 220;
      const ratio =
        item.imageWidth && item.imageHeight
          ? item.imageHeight / item.imageWidth
          : 1;
      const imgH = Math.min(Math.max(BUBBLE_MAX_W * ratio, 120), 320);
      return (
        <View style={{ position: 'relative' }}>
          <View
            style={[
              styles.imageBubble,
              sent ? styles.imageBubbleSent : styles.imageBubbleRecv,
              !sent && { backgroundColor: recvBubbleBg, borderColor: recvBubbleBorder, borderWidth: 1 },
            ]}
          >
            <Pressable onPress={() => openViewerSingle(item)} onLongPress={onLongPress} delayLongPress={350}>
              <Image
                source={{ uri: item.imageUrl }}
                style={{ width: BUBBLE_MAX_W, height: imgH, borderRadius: 14 }}
                resizeMode="cover"
              />
            </Pressable>
            {!!time && (
              <Text
                style={[
                  styles.imageBubbleTime,
                  { color: sent ? 'rgba(255,255,255,0.78)' : textMuted },
                ]}
              >
                {time}
              </Text>
            )}
          </View>
          {reactionBadge}
          {starBadge}
        </View>
      );
    }
    if (item.type === 'video' && (item.videoUrl || item.posterUrl)) {
      const BUBBLE_MAX_W = 220;
      const ratio =
        item.videoWidth && item.videoHeight
          ? item.videoHeight / item.videoWidth
          : 1;
      const vidH = Math.min(Math.max(BUBBLE_MAX_W * ratio, 120), 320);
      let durStr: string | null = null;
      if (item.durationMs && item.durationMs > 0) {
        const s = Math.round(item.durationMs / 1000);
        durStr = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
      }
      return (
        <View style={{ position: 'relative' }}>
          <View
            style={[
              styles.imageBubble,
              sent ? styles.imageBubbleSent : styles.imageBubbleRecv,
              !sent && { backgroundColor: recvBubbleBg, borderColor: recvBubbleBorder, borderWidth: 1 },
            ]}
          >
            <Pressable onPress={() => openViewerSingle(item)} onLongPress={onLongPress} delayLongPress={350}>
              {item.posterUrl ? (
                <Image
                  source={{ uri: item.posterUrl }}
                  style={{ width: BUBBLE_MAX_W, height: vidH, borderRadius: 14 }}
                  resizeMode="cover"
                />
              ) : (
                <View style={{ width: BUBBLE_MAX_W, height: vidH, borderRadius: 14, backgroundColor: '#0B1220' }} />
              )}
              {item.drawing && item.drawing.strokes.length > 0 ? (
                <Svg
                  pointerEvents="none"
                  viewBox={`0 0 ${item.drawing.vb[0]} ${item.drawing.vb[1]}`}
                  preserveAspectRatio="xMidYMid slice"
                  style={{ position: 'absolute', left: 0, top: 0, width: BUBBLE_MAX_W, height: vidH, borderRadius: 14 }}
                >
                  {item.drawing.strokes.map((s, i) => (
                    <Path key={`bd_${i}`} d={s.d} stroke={s.color} strokeWidth={s.width} fill="none" strokeLinecap="round" strokeLinejoin="round" />
                  ))}
                </Svg>
              ) : null}
              <BubbleTextsOverlay items={item.texts?.items} mediaW={item.videoWidth} mediaH={item.videoHeight} boxW={BUBBLE_MAX_W} boxH={vidH} radius={14} />
              <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}>
                <View style={{ width: 54, height: 54, borderRadius: 27, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="play" size={28} color="#FFFFFF" style={{ marginLeft: 3 }} />
                </View>
              </View>
              {durStr && (
                <View style={{ position: 'absolute', left: 8, bottom: 8, backgroundColor: 'rgba(0,0,0,0.55)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                  <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '600' }}>{durStr}</Text>
                </View>
              )}
            </Pressable>
            {!!time && (
              <Text
                style={[
                  styles.imageBubbleTime,
                  { color: sent ? 'rgba(255,255,255,0.78)' : textMuted },
                ]}
              >
                {time}
              </Text>
            )}
          </View>
          {reactionBadge}
          {starBadge}
        </View>
      );
    }
    if (item.type === 'audio' && item.audioUrl) {
      if (sent) {
        return (
          <View style={{ position: 'relative' }}>
            <LinearGradient colors={['#4DA3FF', '#1E6FD9']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.bubble, styles.bubbleSent]}>
              <VoiceBubble audioUrl={item.audioUrl} durationMs={item.durationMs ?? 0} waveform={item.waveform} timeLabel={time} sent />
            </LinearGradient>
            {reactionBadge}
            {starBadge}
          </View>
        );
      }
      return (
        <View style={{ position: 'relative' }}>
          <View style={[styles.bubble, styles.bubbleRecv, { backgroundColor: recvBubbleBg, borderColor: recvBubbleBorder }]}>
            <VoiceBubble audioUrl={item.audioUrl} durationMs={item.durationMs ?? 0} waveform={item.waveform} timeLabel={time} sent={false} />
          </View>
          {reactionBadge}
          {starBadge}
        </View>
      );
    }
    if (sent) {
      return (
        <View style={{ position: 'relative' }}>
          <LinearGradient
            colors={['#4DA3FF', '#1E6FD9']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.bubble, styles.bubbleSent]}
          >
            <Text style={styles.bubbleSentText}>{item.text}</Text>
            {!!time && <Text style={styles.bubbleSentTime}>{time}</Text>}
          </LinearGradient>
          {reactionBadge}
          {starBadge}
        </View>
      );
    }
    return (
      <View style={{ position: 'relative' }}>
        <View
          style={[
            styles.bubble,
            styles.bubbleRecv,
            { backgroundColor: recvBubbleBg, borderColor: recvBubbleBorder },
          ]}
        >
          <Text style={[styles.bubbleRecvText, { color: recvText }]}>{item.text}</Text>
          {!!time && (
            <Text style={[styles.bubbleRecvTime, { color: textMuted }]}>{time}</Text>
          )}
        </View>
        {reactionBadge}
        {starBadge}
      </View>
    );
  };

  const renderItem = ({ item }: { item: Message }) => {
    const sent = item.from === 'patient';
    const time = formatBubbleTime(item.createdAt);
    const align = sent ? styles.bubbleRowRight : styles.bubbleRowLeft;
    const hasReaction = !!(item.reactionClinic || item.reactionPatient);
    return (
      <View style={[styles.bubbleRow, align, hasReaction && styles.bubbleRowReacted, item.id === currentMatchId && styles.searchMatchRow]}>
        <MessageBubble item={item} onOpen={openActionMenu}>
          <BubbleBody item={item} sent={sent} time={time} />
        </MessageBubble>
      </View>
    );
  };

  const canSend = draft.trim().length > 0 && !sending;
  const canConfirmEdit =
    !!editingMessage &&
    draft.trim().length > 0 &&
    draft.trim() !== editingMessage.text.trim();

  return (
    <View style={{ flex: 1 }}>
      <Stack.Screen options={{ headerShown: false }} />
      <PremiumGradientBackground isDark={isDark} showSparkles={!isDark} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
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

            <Pressable
              onPress={() =>
                router.push(
                  `/patient/your-info?patientId=${patientId ?? ''}&clinicId=${clinicId ?? ''}` as any,
                )
              }
              style={styles.headerTapArea}
              hitSlop={4}
            >
              <LinearGradient
                colors={palette as any}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.headerAvatar}
              >
                <Text style={styles.headerAvatarText}>{initialsOf(clinicName || 'Clinic')}</Text>
              </LinearGradient>

              <View style={styles.headerText}>
                <Text
                  style={[styles.headerTitle, { color: textPrimary }]}
                  numberOfLines={1}
                >
                  {clinicName || 'Clinic'}
                </Text>
                <Text style={[styles.headerSub, { color: textSecondary }]} numberOfLines={1}>
                  Tap for your info
                </Text>
              </View>
            </Pressable>
            <View style={styles.headerActions}>
              <Pressable
                onPress={() => Haptics.selectionAsync().catch(() => {})}
                style={({ pressed }) => [styles.headerBtn, { backgroundColor: pressed ? backBgPressed : backBg }]}
              >
                <Ionicons name="call-outline" size={20} color={backIconColor} />
              </Pressable>
              <Pressable
                onPress={() => Haptics.selectionAsync().catch(() => {})}
                style={({ pressed }) => [styles.headerBtn, { backgroundColor: pressed ? backBgPressed : backBg }]}
              >
                <Ionicons name="videocam-outline" size={22} color={backIconColor} />
              </Pressable>
            </View>
          </View>

          {searchOpen && (
            <View style={styles.searchBarRow}>
              <View
                style={[
                  styles.searchBar,
                  { backgroundColor: inputBg, borderColor: inputBorder },
                ]}
              >
                <Ionicons name="search" size={16} color={inputPlaceholder} />
                <TextInput
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Search in chat"
                  placeholderTextColor={inputPlaceholder}
                  style={[styles.searchInput, { color: textPrimary }]}
                  autoFocus
                  returnKeyType="search"
                />
                {searchQuery.length > 0 && (
                  <Pressable onPress={() => setSearchQuery('')} hitSlop={6}>
                    <Ionicons name="close-circle" size={18} color={inputPlaceholder} />
                  </Pressable>
                )}
              </View>
              <Pressable onPress={() => setDatePickerOpen(true)} hitSlop={6} style={styles.searchCalBtn}>
                <Ionicons name="calendar-outline" size={20} color={textSecondary} />
              </Pressable>
              {searchQuery.trim().length > 0 && (
                <View style={styles.searchNav}>
                  <Text style={[styles.searchCount, { color: textSecondary }]}>
                    {searchMatches.length > 0 ? `${matchIndex + 1}/${searchMatches.length}` : '0'}
                  </Text>
                  <Pressable onPress={goOlderMatch} disabled={searchMatches.length === 0} hitSlop={6} style={styles.searchNavBtn}>
                    <Ionicons name="chevron-up" size={20} color={searchMatches.length === 0 ? inputPlaceholder : textPrimary} />
                  </Pressable>
                  <Pressable onPress={goNewerMatch} disabled={searchMatches.length === 0} hitSlop={6} style={styles.searchNavBtn}>
                    <Ionicons name="chevron-down" size={20} color={searchMatches.length === 0 ? inputPlaceholder : textPrimary} />
                  </Pressable>
                </View>
              )}
              <Pressable
                onPress={() => {
                  setSearchOpen(false);
                  setSearchQuery('');
                }}
                hitSlop={6}
              >
                <Text style={[styles.searchCancel, { color: textSecondary }]}>Cancel</Text>
              </Pressable>
            </View>
          )}

          {/* Body */}
          <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
            <View style={{ flex: 1 }}>
              {loading ? (
                <View style={styles.center}>
                  <ActivityIndicator color={textSecondary} />
                </View>
              ) : searchOpen && searchQuery.trim() !== '' && displayedMessages.length === 0 ? (
                <View style={styles.center}>
                  <View
                    style={[
                      styles.emptyCard,
                      {
                        backgroundColor: isDark
                          ? 'rgba(255,255,255,0.015)'
                          : 'rgba(255,255,255,0.18)',
                        borderColor: isDark
                          ? 'rgba(255,255,255,0.06)'
                          : 'rgba(255,255,255,0.45)',
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.emptyIconWrap,
                        { backgroundColor: 'rgba(61,158,255,0.16)' },
                      ]}
                    >
                      <Ionicons name="search-outline" size={26} color="#3D9EFF" />
                    </View>
                    <Text style={[styles.emptyTitle, { color: textPrimary }]}>
                      No matches
                    </Text>
                    <Text style={[styles.emptySub, { color: textMuted }]}>
                      No messages yet
                    </Text>
                  </View>
                </View>
              ) : baseMessages.length === 0 ? (
                <View style={styles.center}>
                  <View
                    style={[
                      styles.emptyCard,
                      {
                        backgroundColor: isDark
                          ? 'rgba(255,255,255,0.015)'
                          : 'rgba(255,255,255,0.18)',
                        borderColor: isDark
                          ? 'rgba(255,255,255,0.06)'
                          : 'rgba(255,255,255,0.45)',
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.emptyIconWrap,
                        { backgroundColor: 'rgba(61,158,255,0.16)' },
                      ]}
                    >
                      <Ionicons
                        name="chatbubble-ellipses-outline"
                        size={26}
                        color="#3D9EFF"
                      />
                    </View>
                    <Text style={[styles.emptyTitle, { color: textPrimary }]}>
                      No messages yet
                    </Text>
                    <Text style={[styles.emptySub, { color: textMuted }]}>
                      Send the first message to start the conversation.
                    </Text>
                  </View>
                </View>
              ) : (
                <FlatList
                  ref={listRef}
                  data={displayedMessages}
                  keyExtractor={(m) => m.id}
                  renderItem={renderItem}
                  contentContainerStyle={styles.listContent}
                  showsVerticalScrollIndicator={false}
                  keyboardDismissMode="on-drag"
                  keyboardShouldPersistTaps="handled"
                  onContentSizeChange={() => {
                    if (!searchOpen) listRef.current?.scrollToEnd({ animated: false });
                  }}
                  onScrollToIndexFailed={(info) => {
                    listRef.current?.scrollToOffset({ offset: Math.max(0, info.averageItemLength * info.index), animated: false });
                    setTimeout(() => { try { listRef.current?.scrollToIndex({ index: info.index, animated: true, viewPosition: 0.4 }); } catch {} }, 250);
                  }}
                />
              )}
            </View>
          </TouchableWithoutFeedback>

          {/* Composer */}
          <View
            style={[
              styles.composerWrap,
              {
                backgroundColor: composerBg,
                borderColor: composerBorder,
                paddingBottom: Math.max(insets.bottom, 10),
              },
            ]}
          >
            {isRecording ? (
              <RecordingBar
                attachBtnBg={attachBtnBg}
                textPrimary={textPrimary}
                attachBtnStyle={styles.attachBtn}
                sendBtnStyle={styles.sendBtn}
                sendBtnInnerStyle={styles.sendBtnInner}
                formatDuration={formatVoiceDuration}
                sending={voiceSending}
                onCancel={() => setIsRecording(false)}
                onSend={onSendVoice}
              />
            ) : (
              <>
            {editingMessage ? (
              <Pressable
                onPress={cancelEdit}
                style={[styles.attachBtn, { backgroundColor: attachBtnBg }]}
                hitSlop={6}
              >
                <Ionicons name="close" size={24} color={attachBtnIcon} />
              </Pressable>
            ) : (
              <Pressable
                onPress={openAttach}
                style={[styles.attachBtn, { backgroundColor: attachBtnBg }]}
                hitSlop={6}
              >
                <Ionicons name="add" size={24} color={attachBtnIcon} />
              </Pressable>
            )}
            <View
              style={[
                styles.input,
                { backgroundColor: inputBg, borderColor: inputBorder },
              ]}
            >
              <TextInput
                ref={inputRef}
                value={draft}
                onChangeText={setDraft}
                placeholder="Type a message"
                placeholderTextColor={inputPlaceholder}
                style={[styles.inputText, { color: textPrimary }]}
                multiline
                maxLength={2000}
              />
            </View>
            {!editingMessage && (
              <Pressable
                onPress={onStartVoice}
                style={[styles.attachBtn, { backgroundColor: attachBtnBg }]}
                hitSlop={6}
              >
                <Ionicons name="mic-outline" size={22} color={attachBtnIcon} />
              </Pressable>
            )}
            <Pressable
              onPress={editingMessage ? handleConfirmEdit : handleSend}
              disabled={editingMessage ? !canConfirmEdit : !canSend}
              style={({ pressed }) => [
                styles.sendBtn,
                { opacity: (editingMessage ? canConfirmEdit : canSend) ? (pressed ? 0.85 : 1) : 0.45 },
              ]}
            >
              <LinearGradient
                colors={['#4DA3FF', '#1E6FD9']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.sendBtnInner}
              >
                <Ionicons name={editingMessage ? 'checkmark' : 'send'} size={18} color="#FFFFFF" />
              </LinearGradient>
            </Pressable>
              </>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>

      <Modal
        visible={attachVisible}
        transparent
        animationType="slide"
        onRequestClose={closeAttach}
      >
        <Pressable style={styles.attachBackdrop} onPress={closeAttach} />
        <View
          style={[
            styles.attachSheet,
            { paddingBottom: insets.bottom + 20 },
          ]}
        >
          <View style={StyleSheet.absoluteFill}>
            <PremiumGradientBackground isDark={isDark} showSparkles={false} />
          </View>
          <View style={styles.attachHandle} />
          <View style={[styles.attachHead, { borderBottomColor: sheetDivider }]}>
            <Text style={[styles.attachTitle, { color: textPrimary }]}>
              Send attachment
            </Text>
          </View>
          <View style={styles.attachOpts}>
            <Pressable
              style={[
                styles.attachOpt,
                { backgroundColor: tileBg, borderColor: tileBorder },
              ]}
              onPress={() => {
                closeAttach();
                setTimeout(handlePickAndSendImage, 250);
              }}
            >
              <LinearGradient
                colors={['#4DA3FF', '#1668E3']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.attachOptIco}
              >
                <Ionicons name="image" size={26} color="#fff" />
              </LinearGradient>
              <Text style={[styles.attachOptLabel, { color: textPrimary }]}>
                Photo
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.attachOpt,
                { backgroundColor: tileBg, borderColor: tileBorder },
              ]}
              onPress={() => {
                closeAttach();
                router.push('/patient/chat-camera' as any);
              }}
            >
              <LinearGradient
                colors={['#A989FF', '#7C3AED']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.attachOptIco}
              >
                <Ionicons name="camera" size={26} color="#fff" />
              </LinearGradient>
              <Text style={[styles.attachOptLabel, { color: textPrimary }]}>
                Camera
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.attachOpt,
                { backgroundColor: tileBg, borderColor: tileBorder },
              ]}
              onPress={() => {}}
            >
              <LinearGradient
                colors={['#34DDB0', '#0EA37A']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.attachOptIco}
              >
                <Ionicons name="document" size={26} color="#fff" />
              </LinearGradient>
              <Text style={[styles.attachOptLabel, { color: textPrimary }]}>
                Files
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal
        visible={actionMenuOpen}
        transparent
        animationType="fade"
        onRequestClose={closeActionMenu}
      >
        <Pressable style={styles.actionBackdrop} onPress={closeActionMenu} />
        {anchorRect && selectedMessage && (
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              top: anchorRect.y,
              left: anchorRect.x,
              width: anchorRect.w,
            }}
          >
            <BubbleBody
              item={selectedMessage}
              sent={selectedMessage.from === 'patient'}
              time={formatBubbleTime(selectedMessage.createdAt)}
            />
          </View>
        )}
        {rowPos && selectedMessage && selectedMessage.type !== 'album' && (
          <View
            style={[
              styles.reactionRow,
              {
                top: rowPos.top,
                left: rowPos.left,
                backgroundColor: isDark ? '#1D2233' : '#FFFFFF',
                borderColor: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(27,37,66,0.08)',
              },
            ]}
          >
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              style={styles.reactionStripScroll}
              contentContainerStyle={styles.reactionRowContent}
            >
              {REACTIONS.map((e) => {
                const isSelected = selectedMessage?.reactionPatient === e;
                return (
                  <Pressable
                    key={e}
                    onPress={() => {
                      setMessageReaction(selectedMessage, e);
                      closeActionMenu();
                    }}
                    style={({ pressed }) => [
                      styles.reactionChip,
                      isSelected && styles.reactionChipSelected,
                      pressed && { opacity: 0.5 },
                    ]}
                  >
                    <Text style={styles.reactionEmoji}>{e}</Text>
                  </Pressable>
                );
              })}
              {selectedMessage && strip.map((e) => {
                const isSelected = selectedMessage?.reactionPatient === e;
                return (
                  <Pressable
                    key={`strip-${e}`}
                    onPress={() => {
                      setMessageReaction(selectedMessage, e);
                      closeActionMenu();
                    }}
                    style={({ pressed }) => [
                      styles.reactionChip,
                      isSelected && styles.reactionChipSelected,
                      pressed && { opacity: 0.5 },
                    ]}
                  >
                    <Text style={styles.reactionEmoji}>{e}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
            <Pressable
              key="add-emoji"
              onPress={() => {
                setReactionTarget(selectedMessage);
                closeActionMenu();
                setEmojiPickerOpen(true);
              }}
              style={({ pressed }) => [styles.reactionChip, pressed && { opacity: 0.5 }]}
            >
              <Ionicons name="add" size={22} color={isDark ? '#FFFFFF' : '#1B2542'} />
            </Pressable>
          </View>
        )}
        {menuPos && (
          <View
            style={[
              styles.actionCard,
              {
                top: menuPos.top,
                left: menuPos.left,
                backgroundColor: isDark ? '#1D2233' : '#FFFFFF',
                borderColor: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(27,37,66,0.08)',
              },
            ]}
          >
            {getActionsFor(selectedMessage).map((a) => {
              const color = a.danger ? '#EF4444' : textPrimary;
              return (
                <Pressable
                  key={a.key}
                  onPress={() => {
                    if (a.key === 'forward') {
                      const target = selectedMessage;
                      Haptics.selectionAsync().catch(() => {});
                      closeActionMenu();
                      if (target) setTimeout(() => handleShareMessage(target), 250);
                    } else if (a.key === 'copy') {
                      const target = selectedMessage;
                      closeActionMenu();
                      if (target) setTimeout(() => handleCopyMessage(target), 250);
                    } else if (a.key === 'edit') {
                      const target = selectedMessage;
                      closeActionMenu();
                      if (target) startEditMessage(target);
                    } else if (a.key === 'info') {
                      const target = selectedMessage;
                      closeActionMenu();
                      if (target) setTimeout(() => openMessageInfo(target), 220);
                    } else if (a.key === 'star') {
                      const target = selectedMessage;
                      Haptics.selectionAsync().catch(() => {});
                      closeActionMenu();
                      if (target) toggleStar(target);
                    } else if (a.key === 'remove') {
                      const target = selectedMessage;
                      closeActionMenu();
                      if (target) setTimeout(() => handleRemoveMessage(target), 250);
                    } else {
                      closeActionMenu();
                    }
                  }}
                  style={({ pressed }) => [
                    styles.actionRow,
                    pressed && { opacity: 0.6 },
                  ]}
                >
                  <Ionicons name={a.icon} size={20} color={color} />
                  <Text style={[styles.actionLabel, { color }]}>{a.label}</Text>
                </Pressable>
              );
            })}
          </View>
        )}
      </Modal>

      <EmojiPicker
        open={emojiPickerOpen}
        onClose={() => setEmojiPickerOpen(false)}
        onEmojiSelected={(e) => {
          const picked = e?.emoji;
          if (picked && reactionTarget) {
            setMessageReaction(reactionTarget, picked);
          }
          setEmojiPickerOpen(false);
        }}
        enableSearchBar
        enableRecentlyUsed
        theme={
          isDark
            ? {
                backdrop: 'rgba(0,0,0,0.55)',
                knob: '#3D9EFF',
                container: '#121A2E',
                header: '#F2F5FB',
                skinTonesContainer: '#1D2233',
                category: {
                  icon: '#8593AE',
                  iconActive: '#FFFFFF',
                  container: '#1D2233',
                  containerActive: '#3D9EFF',
                },
                search: {
                  background: '#1D2233',
                  text: '#F2F5FB',
                  placeholder: '#8593AE',
                  icon: '#8593AE',
                },
                emoji: { selected: 'rgba(61,158,255,0.20)' },
              }
            : {
                backdrop: 'rgba(0,0,0,0.35)',
                knob: '#1E6FD9',
                container: '#FFFFFF',
                header: '#1B2542',
                skinTonesContainer: '#EEF2FB',
                category: {
                  icon: '#8290AB',
                  iconActive: '#1E6FD9',
                  container: '#FFFFFF',
                  containerActive: 'rgba(61,158,255,0.15)',
                },
                search: {
                  background: '#EEF2FB',
                  text: '#1B2542',
                  placeholder: '#8290AB',
                  icon: '#8290AB',
                },
                emoji: { selected: 'rgba(30,111,217,0.15)' },
              }
        }
      />

      <Modal
        visible={reactionSheetOpen}
        transparent
        animationType="slide"
        onRequestClose={closeReactionSheet}
      >
        <Pressable style={styles.reactionSheetBackdrop} onPress={closeReactionSheet} />
        <View
          style={[
            styles.reactionSheet,
            { paddingBottom: insets.bottom + 20 },
          ]}
        >
          <View style={StyleSheet.absoluteFill}>
            <PremiumGradientBackground isDark={isDark} showSparkles={false} />
          </View>
          <View style={styles.reactionSheetKnob} />
          <Text style={[styles.reactionSheetTitle, { color: textPrimary }]}>
            {reactionSheetEntries.length} Reaction{reactionSheetEntries.length === 1 ? '' : 's'}
          </Text>

          <View style={styles.reactionSheetChipsRow}>
            <Pressable onPress={openPickerFromSheet} style={styles.reactionSheetAddBtn}>
              <Ionicons name="happy-outline" size={22} color={textPrimary} />
            </Pressable>
            {reactionSheetChips.map(([emoji, n]) => (
              <View key={emoji} style={styles.reactionSheetChip}>
                <Text style={styles.reactionSheetChipEmoji}>{emoji}</Text>
                <Text style={[styles.reactionSheetChipCount, { color: textSecondary }]}>{n}</Text>
              </View>
            ))}
          </View>

          {reactionSheetEntries.map((e) => (
            <Pressable
              key={e.key}
              disabled={!e.me}
              onPress={e.me ? removeMyReaction : undefined}
              style={styles.reactionSheetRow}
            >
              {e.me ? (
                <LinearGradient
                  colors={['#3D9EFF', '#1E6FD9']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.reactionSheetAvatar}
                >
                  <Ionicons name="person" size={20} color="#FFFFFF" />
                </LinearGradient>
              ) : (
                <LinearGradient
                  colors={AVATAR_PALETTE[hashName(e.name) % AVATAR_PALETTE.length] as any}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.reactionSheetAvatar}
                >
                  <Text style={styles.reactionSheetAvatarText}>{initialsOf(e.name)}</Text>
                </LinearGradient>
              )}
              <View style={{ flex: 1 }}>
                <Text style={[styles.reactionSheetRowName, { color: textPrimary }]}>{e.name}</Text>
                {e.me && (
                  <Text style={[styles.reactionSheetRowSub, { color: textSecondary }]}>Tap to remove</Text>
                )}
              </View>
              <Text style={styles.reactionSheetRowEmoji}>{e.emoji}</Text>
            </Pressable>
          ))}
        </View>
      </Modal>

      <Modal
        visible={stickerSheetOpen}
        transparent
        animationType="slide"
        onRequestClose={closeStickerSheet}
      >
        <Pressable style={styles.reactionSheetBackdrop} onPress={closeStickerSheet} />
        <View style={[styles.reactionSheet, { paddingBottom: insets.bottom + 20 }]}>
          <View style={StyleSheet.absoluteFill}>
            <PremiumGradientBackground isDark={isDark} showSparkles={false} />
          </View>
          <View style={styles.reactionSheetKnob} />
          <Text style={[styles.reactionSheetTitle, { color: textPrimary }]}>
            {stickerSheetEntries.clinic.length + stickerSheetEntries.patient.length} Sticker{stickerSheetEntries.clinic.length + stickerSheetEntries.patient.length === 1 ? '' : 's'}
          </Text>
          {stickerSheetEntries.clinic.length > 0 && (
            <>
              <Text style={{ fontSize: 13, fontWeight: '700', color: textSecondary, marginLeft: 4, marginTop: 2, marginBottom: 8 }}>
                {clinicName || 'Clinic'}
              </Text>
              {stickerSheetEntries.clinic.map((e) => (
                <View key={`stc-${e.index}`} style={[styles.reactionSheetRow, { opacity: 0.7 }]}>
                  <Image source={{ uri: e.url }} style={{ width: 44, height: 44, borderRadius: 10 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.reactionSheetRowName, { color: textPrimary }]}>Photo {e.index + 1}</Text>
                  </View>
                  <Text style={styles.reactionSheetRowEmoji}>{e.sticker}</Text>
                </View>
              ))}
            </>
          )}
          {stickerSheetEntries.patient.length > 0 && (
            <>
              <Text style={{ fontSize: 13, fontWeight: '700', color: textSecondary, marginLeft: 4, marginTop: 8, marginBottom: 8 }}>
                You
              </Text>
              {stickerSheetEntries.patient.map((e) => (
                <Pressable key={`stp-${e.index}`} onPress={() => removeSticker(e)} style={styles.reactionSheetRow}>
                  <Image source={{ uri: e.url }} style={{ width: 44, height: 44, borderRadius: 10 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.reactionSheetRowName, { color: textPrimary }]}>Photo {e.index + 1}</Text>
                    <Text style={[styles.reactionSheetRowSub, { color: textSecondary }]}>Tap to remove</Text>
                  </View>
                  <Text style={styles.reactionSheetRowEmoji}>{e.sticker}</Text>
                </Pressable>
              ))}
            </>
          )}
        </View>
      </Modal>

      <Modal visible={messageInfoOpen} transparent animationType="slide" onRequestClose={closeMessageInfo}>
        <Pressable style={styles.reactionSheetBackdrop} onPress={closeMessageInfo} />
        <View style={[styles.reactionSheet, { paddingBottom: insets.bottom + 20 }]}>
          <View style={StyleSheet.absoluteFill}>
            <PremiumGradientBackground isDark={isDark} showSparkles={false} />
          </View>
          <View style={styles.reactionSheetKnob} />
          <Text style={[styles.infoTitle, { color: textPrimary }]}>Message info</Text>
          {infoMsg && (
            <>
              <View style={[styles.infoPreview, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}>
                <Text style={[styles.infoPreviewText, { color: textSecondary }]} numberOfLines={2}>
                  {infoMsg.type === 'image' ? 'Photo' : infoMsg.text}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <View style={[styles.infoIcon, { backgroundColor: 'rgba(61,158,255,0.14)' }]}>
                  <Ionicons name="arrow-up-circle" size={20} color="#3D9EFF" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.infoRowLabel, { color: textPrimary }]}>Sent</Text>
                  <Text style={[styles.infoRowValue, { color: textSecondary }]}>{formatInfoTime(infoMsg.createdAt)}</Text>
                </View>
              </View>
              {infoMsg.from === 'patient' && (
                <View style={styles.infoRow}>
                  <View style={[styles.infoIcon, { backgroundColor: infoMsg.seenAt ? 'rgba(16,185,129,0.14)' : 'rgba(128,128,128,0.14)' }]}>
                    <Ionicons name="checkmark-done" size={20} color={infoMsg.seenAt ? '#10B981' : (isDark ? '#8A93A6' : '#98A2B3')} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.infoRowLabel, { color: textPrimary }]}>Seen</Text>
                    <Text style={[styles.infoRowValue, { color: textSecondary }]}>
                      {infoMsg.seenAt ? formatInfoTime(infoMsg.seenAt) : 'Not seen yet'}
                    </Text>
                  </View>
                </View>
              )}
            </>
          )}
        </View>
      </Modal>

      <Modal visible={viewerOpen} transparent={false} animationType="fade" onRequestClose={closeViewer} statusBarTranslucent>
        {viewerOpen && viewerPages.length > 0 ? (() => {
          const SCREEN_W = Dimensions.get('window').width;
          const SCREEN_H = Dimensions.get('window').height;
          const pages = viewerPages;
          const current = pages[viewerIndex] ?? pages[0];
          const curMsg = messages.find((m) => m.id === current?.msgId) ?? null;
          const isOwn = curMsg?.from === 'patient';
          const isStarred = !!curMsg?.starredPatient;
          const curMediaIndex = current?.mediaIndex;
          const isAlbumPageForCurrent = !!(curMsg && curMsg.type === 'album' && typeof curMediaIndex === 'number' && Array.isArray(curMsg.media));
          const isImagePageForCurrent = curMsg?.type === 'image';
          const isVideo = current?.kind === 'video';
          const curSticker = curMsg
            ? (curMsg.type === 'album' && typeof curMediaIndex === 'number'
                ? curMsg.media?.[curMediaIndex]?.stickerPatient
                : curMsg.reactionPatient)
            : undefined;
          return (
            <GestureHandlerRootView style={{ flex: 1 }}>
            <View style={{ flex: 1, backgroundColor: '#000' }}>
              <FlatList
                ref={viewerListRef}
                data={pages}
                keyExtractor={(_, i) => `viewer_${i}`}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                initialScrollIndex={viewerIndex}
                scrollEnabled={!(viewerZoomed || scrubbing)}
                getItemLayout={(_, i) => ({ length: SCREEN_W, offset: SCREEN_W * i, index: i })}
                onMomentumScrollEnd={(e) => {
                  const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
                  setViewerIndex(idx);
                  setViewerZoomed(false);
                }}
                renderItem={({ item: page, index: i }) => {
                  const pmsg = messages.find((m) => m.id === page.msgId) ?? null;
                  const isAlbumPage = typeof page.mediaIndex === 'number' && pmsg?.type === 'album' && Array.isArray(pmsg.media);
                  const isImagePage = typeof page.mediaIndex !== 'number' && pmsg?.type === 'image';
                  const mItem = isAlbumPage ? pmsg!.media![page.mediaIndex!] : null;
                  const own = isAlbumPage ? mItem?.stickerPatient : (isImagePage ? pmsg?.reactionPatient : undefined);
                  const other = isAlbumPage ? mItem?.sticker : (isImagePage ? pmsg?.reactionClinic : undefined);
                  const pAspect = page.width && page.height ? page.width / page.height : SCREEN_W / SCREEN_H;
                  const cAspect = SCREEN_W / SCREEN_H;
                  let baseW = SCREEN_W;
                  let baseH = SCREEN_H;
                  if (pAspect >= cAspect) { baseW = SCREEN_W; baseH = SCREEN_W / pAspect; }
                  else { baseH = SCREEN_H; baseW = SCREEN_H * pAspect; }
                  const offX = (SCREEN_W - baseW) / 2;
                  const offY = (SCREEN_H - baseH) / 2;
                  return (
                    <View style={[styles.viewerPage, { width: SCREEN_W }]}>
                      {page.kind === 'video' && page.videoUrl ? (
                        <ViewerVideo uri={page.videoUrl} width={SCREEN_W} height={SCREEN_H} isActive={i === viewerIndex} topInset={insets.top} bottomInset={insets.bottom} videoW={page.width} videoH={page.height} drawing={page.drawing} texts={page.texts} onScrubbingChange={setScrubbing} onZoomChange={setViewerZoomed} />
                      ) : (
                        <ZoomableImage uri={page.url} width={SCREEN_W} height={SCREEN_H} imgW={page.width} imgH={page.height} drawing={page.drawing} texts={page.texts} onZoomChange={setViewerZoomed} />
                      )}
                      {(isAlbumPage || isImagePage) ? (
                        <View pointerEvents="box-none" style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}>
                          {own ? (
                            <Pressable onPress={() => openStickerForPage(page)} hitSlop={8} style={[styles.viewerStickerLeft, { top: undefined, bottom: insets.bottom + 200, left: 20 }]}>
                              <Text style={styles.galStickerText}>{own}</Text>
                            </Pressable>
                          ) : (
                            <Pressable onPress={() => openStickerForPage(page)} hitSlop={8} style={[styles.viewerStickerLeft, { top: undefined, bottom: insets.bottom + 200, left: 20 }]}>
                              <Ionicons name="happy-outline" size={18} color="#1E6FD9" />
                            </Pressable>
                          )}
                          {other ? (
                            <View style={[styles.viewerStickerRight, { top: undefined, bottom: insets.bottom + 200, right: 20 }]}>
                              <Text style={styles.galStickerText}>{other}</Text>
                            </View>
                          ) : null}
                        </View>
                      ) : null}
                    </View>
                  );
                }}
              />
              <View style={[styles.viewerHeader, { top: insets.top + 8 }]} pointerEvents="box-none">
                <Pressable onPress={closeViewer} style={styles.viewerClose} hitSlop={8}>
                  <Ionicons name="close" size={22} color="#FFFFFF" />
                </Pressable>
                <View style={styles.viewerWho}>
                  <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '700' }}>
                    {isOwn ? 'You' : (clinicName || 'Clinic')}
                  </Text>
                  <Text style={{ color: 'rgba(255,255,255,0.72)', fontSize: 12, marginTop: 2 }}>
                    {formatInfoTime(curMsg?.createdAt)}
                  </Text>
                </View>
                <View style={{ width: 40 }} />
              </View>
              {!isAlbumPageForCurrent && !isImagePageForCurrent && (
                <View style={[styles.viewerBottomActions, { bottom: insets.bottom + (isVideo ? 228 : 200) }]} pointerEvents="box-none">
                  <Pressable
                    onPress={() => {
                      if (!current) return;
                      setStickerTarget({ msgId: current.msgId });
                      setStickerKbOpen(true);
                    }}
                    style={styles.viewerClose}
                    hitSlop={8}
                  >
                    {curSticker ? (
                      <Text style={{ fontSize: 22 }}>{curSticker}</Text>
                    ) : (
                      <Ionicons name="happy-outline" size={22} color="#FFFFFF" />
                    )}
                  </Pressable>
                </View>
              )}
              {pages.length > 1 && (
                <View style={[styles.viewerStrip, { bottom: insets.bottom + (isVideo ? 162 : 132) }]}>
                  <ScrollView
                    ref={stripRef}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.viewerStripContent}
                  >
                    {pages.map((thumb, i) => (
                      <Pressable
                        key={`thumb_${i}`}
                        onPress={() => {
                          setViewerIndex(i);
                          viewerListRef.current?.scrollToIndex({ index: i, animated: true });
                        }}
                        style={[styles.viewerThumb, i === viewerIndex && styles.viewerThumbActive]}
                      >
                        <Image source={{ uri: thumb.url }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                      </Pressable>
                    ))}
                  </ScrollView>
                </View>
              )}
              <View style={[styles.viewerBar, { paddingBottom: insets.bottom + (isVideo ? 72 : 14) }]} pointerEvents="box-none">
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.92)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                  style={StyleSheet.absoluteFill}
                  pointerEvents="none"
                />
                <View style={styles.viewerBarRow}>
                  <Pressable onPress={() => shareViewerCurrent(current?.url, curMsg?.text)} hitSlop={8} style={styles.viewerBarBtn}>
                    <View style={styles.viewerBarIcon}>
                      <Ionicons name="share-outline" size={24} color="#FFFFFF" />
                    </View>
                    <Text style={styles.viewerBarLabel}>Share</Text>
                  </Pressable>
                  <Pressable onPress={() => { if (curMsg) toggleStar(curMsg); }} hitSlop={8} style={styles.viewerBarBtn}>
                    <View style={[styles.viewerBarIcon, isStarred && styles.viewerBarIconStar]}>
                      <Ionicons name={isStarred ? 'star' : 'star-outline'} size={24} color={isStarred ? '#F5A623' : '#FFFFFF'} />
                    </View>
                    <Text style={styles.viewerBarLabel}>Star</Text>
                  </Pressable>
                  {isOwn && curMsg && (
                    <Pressable onPress={() => handleRemoveMessage(curMsg)} hitSlop={8} style={styles.viewerBarBtn}>
                      <View style={[styles.viewerBarIcon, styles.viewerBarIconDanger]}>
                        <Ionicons name="trash-outline" size={24} color="#FF8A80" />
                      </View>
                      <Text style={[styles.viewerBarLabel, styles.viewerBarLabelDanger]}>Delete</Text>
                    </Pressable>
                  )}
                </View>
              </View>
            </View>
              {stickerKbOpen ? (
                <View style={StyleSheet.absoluteFill}>
                  <Pressable
                    style={StyleSheet.absoluteFill}
                    onPress={() => { setStickerKbOpen(false); setStickerTarget(null); }}
                  />
                  <View style={styles.stickerKbSheet}>
                    <View style={styles.stickerKbHeader}>
                      {curSticker ? (
                        <Pressable
                          onPress={() => {
                            if (!stickerTarget || !curSticker) return;
                            const tmsg = messages.find((m) => m.id === stickerTarget.msgId);
                            if (tmsg?.type === 'album' && typeof stickerTarget.mediaIndex === 'number') {
                              setImageSticker(stickerTarget, curSticker);
                            } else if (tmsg) {
                              setMessageReaction(tmsg, curSticker);
                            }
                          }}
                          style={styles.stickerKbCurrent}
                          hitSlop={8}
                        >
                          <Text style={{ fontSize: 22 }}>{curSticker}</Text>
                        </Pressable>
                      ) : (
                        <View />
                      )}
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
                        if (picked && stickerTarget) {
                          const tmsg = messages.find((m) => m.id === stickerTarget.msgId);
                          if (tmsg?.type === 'album' && typeof stickerTarget.mediaIndex === 'number') {
                            setImageSticker(stickerTarget, picked);
                          } else if (tmsg) {
                            setMessageReaction(tmsg, picked);
                          }
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
              ) : null}
            </GestureHandlerRootView>
          );
        })() : null}
      </Modal>

      <Modal visible={galleryOpen} transparent={false} animationType="slide" onRequestClose={closeGallery} statusBarTranslucent>
        {galleryOpen && galleryMessage ? (() => {
          const SCREEN_W = Dimensions.get('window').width;
          const gm = messages.find((m) => m.id === galleryMessage.id) ?? galleryMessage;
          const gMedia = gm?.media ?? [];
          const isOwn = gm?.from === 'patient';
          const GAP = 10;
          return (
            <View style={{ flex: 1 }}>
              <PremiumGradientBackground isDark={isDark} showSparkles={!isDark} />
              <ScrollView
                contentContainerStyle={{ paddingTop: insets.top + 60, paddingBottom: insets.bottom + 24 }}
                showsVerticalScrollIndicator={false}
              >
                {gMedia.map((it, i) => {
                  const imgW = SCREEN_W - 16;
                  const aspect = it.width && it.height ? it.width / it.height : 1;
                  const h = imgW / aspect;
                  return (
                    <Pressable
                      key={`galimg_${i}`}
                      onPress={() => { if (gm) openViewerFromGallery(gm, i); }}
                      onLongPress={() => { if (gm) setGalStickerTarget({ msgId: gm.id, mediaIndex: i }); }}
                      delayLongPress={350}
                      style={{ marginBottom: i === gMedia.length - 1 ? 0 : GAP, marginHorizontal: 8, position: 'relative' }}
                    >
                      <Image source={{ uri: it.url }} style={{ width: imgW, height: h, borderRadius: 14 }} resizeMode="cover" />
                      {it.sticker ? (
                        <Pressable
                          style={styles.galStickerBadge}
                          hitSlop={8}
                          onPress={() => { if (gm) setGalStickerTarget({ msgId: gm.id, mediaIndex: i }); }}
                        >
                          <Text style={styles.galStickerText}>{it.sticker}</Text>
                        </Pressable>
                      ) : null}
                      {it.stickerPatient ? (
                        <Pressable
                          style={styles.galStickerBadgeRight}
                          hitSlop={8}
                          onPress={() => { if (gm) setGalStickerTarget({ msgId: gm.id, mediaIndex: i }); }}
                        >
                          <Text style={styles.galStickerText}>{it.stickerPatient}</Text>
                        </Pressable>
                      ) : null}
                    </Pressable>
                  );
                })}
              </ScrollView>
              <View style={[styles.galleryHeader, { paddingTop: insets.top + 8 }]}>
                <LinearGradient
                  colors={isDark ? ['rgba(0,0,0,0.75)', 'transparent'] : ['rgba(224,242,254,0.95)', 'rgba(224,242,254,0)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                  style={StyleSheet.absoluteFill}
                  pointerEvents="none"
                />
                <Pressable onPress={closeGallery} style={[styles.viewerClose, !isDark && { backgroundColor: '#FFFFFF' }]} hitSlop={8}>
                  <Ionicons name="close" size={22} color={isDark ? '#FFFFFF' : textPrimary} />
                </Pressable>
                <View style={styles.viewerWho}>
                  <Text style={{ color: isDark ? '#FFFFFF' : textPrimary, fontSize: 14, fontWeight: '700' }}>
                    {isOwn ? 'You' : (clinicName || 'Clinic')}
                  </Text>
                  <Text style={{ color: isDark ? 'rgba(255,255,255,0.72)' : textSecondary, fontSize: 12, marginTop: 2 }}>
                    {gMedia.length} photos
                  </Text>
                </View>
                <View style={{ width: 40 }} />
              </View>
              {galStickerTarget ? (
                <View style={StyleSheet.absoluteFill}>
                  <Pressable style={StyleSheet.absoluteFill} onPress={() => setGalStickerTarget(null)} />
                  <View
                    style={[
                      styles.reactionRow,
                      {
                        bottom: insets.bottom + 24,
                        left: Math.max(8, (SCREEN_W - 360) / 2),
                        backgroundColor: isDark ? '#1D2233' : '#FFFFFF',
                        borderColor: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(27,37,66,0.08)',
                      },
                    ]}
                  >
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.reactionStripScroll} contentContainerStyle={styles.reactionRowContent}>
                      {STICKER_QUICKS.map((e) => {
                        const cur = gMedia[galStickerTarget.mediaIndex]?.stickerPatient;
                        const isSelected = cur === e;
                        return (
                          <Pressable
                            key={e}
                            onPress={() => { if (galStickerTarget) setImageSticker(galStickerTarget, e); setGalStickerTarget(null); }}
                            style={({ pressed }) => [
                              styles.reactionChip,
                              isSelected && styles.reactionChipSelected,
                              pressed && { opacity: 0.5 },
                            ]}
                          >
                            <Text style={styles.reactionEmoji}>{e}</Text>
                          </Pressable>
                        );
                      })}
                      {stickerRecents.filter((e) => !STICKER_QUICKS.includes(e)).map((e) => {
                        const cur = gMedia[galStickerTarget.mediaIndex]?.stickerPatient;
                        const isSelected = cur === e;
                        return (
                          <Pressable
                            key={`strip-${e}`}
                            onPress={() => { if (galStickerTarget) setImageSticker(galStickerTarget, e); setGalStickerTarget(null); }}
                            style={({ pressed }) => [
                              styles.reactionChip,
                              isSelected && styles.reactionChipSelected,
                              pressed && { opacity: 0.5 },
                            ]}
                          >
                            <Text style={styles.reactionEmoji}>{e}</Text>
                          </Pressable>
                        );
                      })}
                    </ScrollView>
                    <Pressable
                      onPress={() => setGalKbOpen(true)}
                      style={({ pressed }) => [styles.reactionChip, pressed && { opacity: 0.5 }]}
                    >
                      <Ionicons name="add" size={22} color={isDark ? '#FFFFFF' : '#1B2542'} />
                    </Pressable>
                  </View>
                </View>
              ) : null}
              {galKbOpen ? (
                <View style={StyleSheet.absoluteFill}>
                  <Pressable
                    style={StyleSheet.absoluteFill}
                    onPress={() => { setGalKbOpen(false); setGalStickerTarget(null); }}
                  />
                  <View style={styles.stickerKbSheet}>
                    <View style={styles.stickerKbHeader}>
                      <View />
                      <Pressable
                        onPress={() => { setGalKbOpen(false); setGalStickerTarget(null); }}
                        style={styles.stickerKbClose}
                        hitSlop={8}
                      >
                        <Ionicons name="close" size={20} color="#111111" />
                      </Pressable>
                    </View>
                    <EmojiKeyboard
                      onEmojiSelected={(e) => {
                        const picked = e?.emoji;
                        if (picked && galStickerTarget) {
                          setImageSticker(galStickerTarget, picked);
                          if (!STICKER_QUICKS.includes(picked)) pushStickerRecent(picked);
                        }
                        setGalKbOpen(false);
                        setGalStickerTarget(null);
                      }}
                      enableSearchBar
                      enableRecentlyUsed
                      defaultHeight={380}
                    />
                  </View>
                </View>
              ) : null}
            </View>
          );
        })() : null}
      </Modal>

      <Modal visible={datePickerOpen} transparent animationType="slide" onRequestClose={() => setDatePickerOpen(false)}>
        <Pressable style={styles.reactionSheetBackdrop} onPress={() => setDatePickerOpen(false)} />
        <View style={[styles.reactionSheet, { paddingBottom: insets.bottom + 20 }]}>
          <View style={StyleSheet.absoluteFill}>
            <PremiumGradientBackground isDark={isDark} showSparkles={false} />
          </View>
          <View style={styles.reactionSheetKnob} />
          <Text style={[styles.infoTitle, { color: textPrimary }]}>Jump to date</Text>
          <DateTimePicker
            value={pickedDate}
            mode="date"
            display="spinner"
            maximumDate={new Date()}
            minimumDate={baseMessages[0]?.createdAt ? new Date(baseMessages[0].createdAt) : undefined}
            onChange={(_e, d) => { if (d) setPickedDate(d); }}
            style={styles.datePicker}
          />
          <Pressable onPress={jumpToDate} style={styles.jumpBtn}>
            <LinearGradient colors={['#3D9EFF', '#1E6FD9']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.jumpBtnInner}>
              <Text style={styles.jumpBtnText}>Jump to date</Text>
            </LinearGradient>
          </Pressable>
        </View>
      </Modal>

      {copiedVisible && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.copiedPillWrap,
            {
              opacity: copiedAnim,
              transform: [{ translateY: copiedAnim.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }],
              bottom: insets.bottom + 90,
            },
          ]}
        >
          <LinearGradient
            colors={['#3D9EFF', '#1E6FD9']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.copiedPill}
          >
            <Ionicons name="checkmark-circle" size={18} color="#10B981" />
            <Text style={styles.copiedPillText}>Copied</Text>
          </LinearGradient>
        </Animated.View>
      )}
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
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAvatarText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  headerText: { flex: 1 },
  headerTitle: { fontSize: 17, fontWeight: '800' },
  headerSub: { fontSize: 12, fontWeight: '600', marginTop: 1 },
  headerTapArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  searchBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 10,
    gap: 10,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 22,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 10 : 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    padding: 0,
    margin: 0,
  },
  searchCancel: {
    fontSize: 14,
    fontWeight: '600',
  },
  searchNav: { flexDirection: 'row', alignItems: 'center', gap: 2, marginLeft: 6 },
  searchNavBtn: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  searchCount: { fontSize: 13, fontWeight: '700', minWidth: 30, textAlign: 'center' },
  searchMatchRow: { backgroundColor: 'rgba(61,158,255,0.10)', borderRadius: 14 },
  searchCalBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center', marginLeft: 4 },
  datePicker: { alignSelf: 'center', marginVertical: 8 },
  jumpBtn: { marginTop: 8, borderRadius: 16, overflow: 'hidden' },
  jumpBtnInner: { paddingVertical: 14, alignItems: 'center', borderRadius: 16 },
  jumpBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },

  listContent: {
    paddingHorizontal: 14,
    paddingTop: 4,
    paddingBottom: 20,
    gap: 6,
  },

  bubbleRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  bubbleRowLeft: { justifyContent: 'flex-start' },
  bubbleRowRight: { justifyContent: 'flex-end' },
  bubbleRowReacted: { marginBottom: 20 },

  bubble: {
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 18,
  },
  bubbleSent: {
    borderBottomRightRadius: 6,
    shadowColor: '#1E6FD9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 3,
  },
  bubbleRecv: {
    borderBottomLeftRadius: 6,
    borderWidth: 1,
  },
  bubbleSentText: {
    color: '#FFFFFF',
    fontSize: 15,
    lineHeight: 20,
  },
  bubbleSentTime: {
    color: 'rgba(255,255,255,0.78)',
    fontSize: 10.5,
    fontWeight: '600',
    marginTop: 3,
    alignSelf: 'flex-end',
  },
  bubbleRecvText: {
    fontSize: 15,
    lineHeight: 20,
  },
  bubbleRecvTime: {
    fontSize: 10.5,
    fontWeight: '600',
    marginTop: 3,
    alignSelf: 'flex-end',
  },

  imageBubble: {
    padding: 4,
    borderRadius: 18,
  },
  imageBubbleSent: {
    backgroundColor: 'rgba(30,111,217,0.18)',
    borderBottomRightRadius: 6,
  },
  imageBubbleRecv: {
    borderBottomLeftRadius: 6,
  },
  imageBubbleTime: {
    fontSize: 10.5,
    fontWeight: '600',
    marginTop: 4,
    marginRight: 4,
    alignSelf: 'flex-end',
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
  emptyTitle: { fontSize: 16, fontWeight: '800' },
  emptySub: { fontSize: 13, textAlign: 'center', lineHeight: 18 },

  composerWrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingTop: 10,
    gap: 10,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    borderRadius: 22,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 10 : 6,
    minHeight: 44,
    maxHeight: 120,
    justifyContent: 'center',
  },
  inputText: {
    fontSize: 15,
    lineHeight: 20,
    padding: 0,
    margin: 0,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
  },
  sendBtnInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  attachBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  attachBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  attachSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingTop: 0,
    overflow: 'hidden',
  },
  attachHandle: {
    width: 38,
    height: 5,
    borderRadius: 3,
    alignSelf: 'center',
    marginTop: 10,
    backgroundColor: 'rgba(150,150,150,0.4)',
  },
  attachHead: {
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  attachTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  attachOpts: {
    flexDirection: 'row',
    gap: 12,
    padding: 18,
  },
  attachOpt: {
    flex: 1,
    alignItems: 'center',
    gap: 11,
    borderRadius: 20,
    borderWidth: 1,
    paddingVertical: 20,
    paddingHorizontal: 8,
  },
  attachOptIco: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  attachOptLabel: {
    fontSize: 14.5,
    fontWeight: '700',
  },
  actionBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  actionCard: {
    position: 'absolute',
    width: 240,
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 6,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
    overflow: 'hidden',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  actionLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  reactionRow: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    width: 360,
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 6,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  reactionRowContent: {
    alignItems: 'center',
  },
  reactionStripScroll: {
    flex: 1,
    minWidth: 0,
  },
  reactionChip: {
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  reactionChipSelected: {
    backgroundColor: 'rgba(61,158,255,0.18)',
    borderRadius: 999,
  },
  reactionEmoji: {
    fontSize: 24,
  },
  reactionBadge: {
    position: 'absolute',
    bottom: -14,
    borderRadius: 999,
    paddingHorizontal: 5,
    paddingVertical: 2,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    shadowColor: '#000',
    shadowOpacity: 0.20,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  reactionBadgeRight: { right: 6 },
  reactionBadgeLeft: { left: 10 },
  reactionBadgeText: {
    fontSize: 13,
  },
  reactionSheetBackdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.45)' },
  reactionSheet: { position: 'absolute', left: 0, right: 0, bottom: 0, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 10, paddingHorizontal: 16, overflow: 'hidden' },
  reactionSheetKnob: { alignSelf: 'center', width: 40, height: 5, borderRadius: 3, backgroundColor: 'rgba(128,128,128,0.35)', marginBottom: 12 },
  reactionSheetTitle: { fontSize: 17, fontWeight: '800', marginBottom: 14, marginLeft: 4 },
  reactionSheetChipsRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12, marginLeft: 4 },
  reactionSheetAddBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(128,128,128,0.30)' },
  reactionSheetChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, height: 36, borderRadius: 18, backgroundColor: 'rgba(61,158,255,0.12)' },
  reactionSheetChipEmoji: { fontSize: 17 },
  reactionSheetChipCount: { fontSize: 14, fontWeight: '700' },
  reactionSheetRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, paddingHorizontal: 4 },
  reactionSheetAvatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  reactionSheetAvatarText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800', letterSpacing: 0.3 },
  reactionSheetRowName: { fontSize: 16, fontWeight: '700' },
  reactionSheetRowSub: { fontSize: 13, marginTop: 1 },
  reactionSheetRowEmoji: { fontSize: 22 },
  infoTitle: { fontSize: 17, fontWeight: '800', marginBottom: 14, marginLeft: 4 },
  infoPreview: { borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 16 },
  infoPreviewText: { fontSize: 14, lineHeight: 20 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  infoIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  infoRowLabel: { fontSize: 15, fontWeight: '700' },
  infoRowValue: { fontSize: 13, marginTop: 1 },
  starBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 3,
  },
  copiedPillWrap: {
    position: 'absolute',
    alignSelf: 'center',
    borderRadius: 22,
    backgroundColor: '#1E6FD9',
    shadowColor: '#1E6FD9',
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
    zIndex: 50,
  },
  copiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 22,
  },
  copiedPillText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  viewerClose: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewerHeader: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    zIndex: 10,
  },
  viewerWho: {
    flex: 1,
    alignItems: 'center',
  },
  viewerPage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewerStrip: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
  viewerStripContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
  },
  viewerThumb: {
    width: 40,
    height: 54,
    borderRadius: 6,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  viewerThumbActive: {
    borderColor: '#4DA3FF',
    backgroundColor: '#FFFFFF',
    padding: 2,
  },
  viewerBar: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingTop: 18 },
  viewerBarRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 40 },
  viewerBarBtn: { alignItems: 'center', justifyContent: 'center' },
  viewerBarIcon: { width: 54, height: 54, borderRadius: 27, backgroundColor: 'rgba(255,255,255,0.12)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  viewerBarIconStar: { backgroundColor: 'rgba(245,166,35,0.18)', borderColor: 'rgba(245,166,35,0.55)' },
  viewerBarIconDanger: { backgroundColor: 'rgba(239,68,68,0.16)', borderColor: 'rgba(239,68,68,0.5)' },
  viewerBarLabel: { fontSize: 11, marginTop: 7, color: '#FFFFFF', fontWeight: '600' },
  viewerBarLabelDanger: { color: '#FF8A80' },
  viewerBottomActions: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  stickerKbSheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 420,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  stickerKbHeader: {
    height: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  stickerKbClose: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stickerKbCurrent: {
    minWidth: 32,
    height: 32,
    borderRadius: 16,
    paddingHorizontal: 6,
    backgroundColor: 'rgba(0,0,0,0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  albumWrap: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  albumRow: {
    flexDirection: 'row',
  },
  albumCell: {
    borderRadius: 6,
    backgroundColor: 'rgba(0,0,0,0.06)',
  },
  albumCellWide: {
    borderRadius: 6,
    backgroundColor: 'rgba(0,0,0,0.06)',
  },
  albumMore: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
  },
  albumMoreText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  albumCaption: {
    marginTop: 6,
    marginHorizontal: 4,
  },
  galleryHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 12,
    zIndex: 10,
  },
  galStickerBadge: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    borderRadius: 999,
    paddingHorizontal: 6,
    paddingVertical: 3,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 3,
  },
  galStickerBadgeRight: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    borderRadius: 999,
    paddingHorizontal: 6,
    paddingVertical: 3,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 3,
  },
  galStickerText: { fontSize: 18 },
  viewerStickerRight: {
    position: 'absolute',
    top: 10,
    right: 10,
    borderRadius: 999,
    paddingHorizontal: 6,
    paddingVertical: 3,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 3,
    opacity: 0.9,
  },
  viewerStickerLeft: {
    position: 'absolute',
    top: 10,
    left: 10,
    borderRadius: 999,
    paddingHorizontal: 6,
    paddingVertical: 3,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 3,
  },
});
