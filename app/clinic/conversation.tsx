import { db } from '@/firebaseConfig';
import { PremiumGradientBackground } from '@/src/components/PremiumGradientBackground';
import { useAuth } from '@/src/context/AuthContext';
import { useTheme } from '@/src/context/ThemeContext';
import { consumeOpenSearch } from '@/src/state/chatSearchSignal';
import { useClinicGuard } from '@/src/utils/navigationGuards';
import { ensureThread, markThreadReadForClinic, updateThreadOnMessage } from '@/src/utils/threadsHelper';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { addDoc, collection, deleteDoc, deleteField, doc, onSnapshot, orderBy, query, updateDoc } from 'firebase/firestore';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import EmojiPicker from 'rn-emoji-keyboard';

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

type Message = {
  id: string;
  from: 'patient' | 'clinic';
  text: string;
  senderName?: string;
  createdAt?: any;
  type?: 'image' | 'album';
  imageUrl?: string;
  imageWidth?: number;
  imageHeight?: number;
  storagePath?: string;
  media?: {
    kind: 'image' | 'video';
    url: string;
    storagePath: string;
    width?: number;
    height?: number;
    posterUrl?: string;
    durationMs?: number;
  }[];
  reactionClinic?: string;
  reactionPatient?: string;
  seenAt?: number;
  starredClinic?: boolean;
};

const REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];
const RECENT_MAX = 6;
const RECENTS_KEY = 'reactions:recent:v3';

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
      {children}
    </Pressable>
  );
};

export default function ClinicConversationScreen() {
  useClinicGuard();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { clinicId, userRole, loading: clinicLoading } = useAuth();
  const clinicUser = userRole === 'clinic';
  const { patientId, name } = useLocalSearchParams<{ patientId: string; name?: string }>();

  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [attachVisible, setAttachVisible] = useState(false);
  const [attachBusy, setAttachBusy] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useFocusEffect(
    useCallback(() => {
      if (consumeOpenSearch()) setSearchOpen(true);
    }, []),
  );
  const [clearedForClinicAt, setClearedForClinicAt] = useState<number>(0);
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
  const closeMessageInfo = () => setMessageInfoOpen(false);
  const [recents, setRecents] = useState<string[]>([]);
  const [recentsLoaded, setRecentsLoaded] = useState(false);
  const [copiedVisible, setCopiedVisible] = useState(false);
  const copiedAnim = useRef(new Animated.Value(0)).current;
  const inputRef = useRef<TextInput>(null);
  const preEditDraftRef = useRef('');
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const listRef = useRef<FlatList<Message>>(null);

  const patientName = (name as string) || 'Patient';

  const baseMessages = useMemo(
    () => messages.filter((m) => (m.createdAt ?? 0) > (clearedForClinicAt ?? 0)),
    [messages, clearedForClinicAt],
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
    const cur = selectedMessage?.reactionClinic;
    if (cur && !REACTIONS.includes(cur) && !list.includes(cur)) list.unshift(cur);
    return list;
  }, [recents, selectedMessage]);

  const reactionSheetEntries = useMemo(() => {
    const t = reactionSheetTarget;
    if (!t) return [] as { key: string; emoji: string; name: string; me: boolean }[];
    const list: { key: string; emoji: string; name: string; me: boolean }[] = [];
    if (t.reactionClinic) list.push({ key: 'clinic', emoji: t.reactionClinic, name: 'You', me: true });
    if (t.reactionPatient) list.push({ key: 'patient', emoji: t.reactionPatient, name: patientName, me: false });
    return list;
  }, [reactionSheetTarget, patientName]);

  const reactionSheetChips = useMemo(() => {
    const m: Record<string, number> = {};
    reactionSheetEntries.forEach((e) => { m[e.emoji] = (m[e.emoji] || 0) + 1; });
    return Object.entries(m);
  }, [reactionSheetEntries]);

  const infoMsg = useMemo(
    () => (messageInfoTarget ? messages.find((m) => m.id === messageInfoTarget.id) ?? messageInfoTarget : null),
    [messageInfoTarget, messages],
  );

  const openAttach = () => setAttachVisible(true);
  const closeAttach = () => setAttachVisible(false);

  type ActionItem = {
    key: string;
    label: string;
    icon: React.ComponentProps<typeof Ionicons>['name'];
    danger?: boolean;
  };
  const getActionsFor = (m: Message | null): ActionItem[] => {
    if (!m) return [];
    const isOwn = m.from === 'clinic';
    const isImage = m.type === 'image';
    if (isOwn && isImage) {
      return [
        { key: 'forward', label: 'Forward', icon: 'arrow-redo-outline' },
        { key: 'info', label: 'Info', icon: 'information-circle-outline' },
        { key: 'star', label: 'Star', icon: 'star-outline' },
        { key: 'remove', label: 'Remove', icon: 'trash-outline', danger: true },
      ];
    }
    if (isOwn) {
      return [
        { key: 'forward', label: 'Forward', icon: 'arrow-redo-outline' },
        { key: 'copy', label: 'Copy', icon: 'copy-outline' },
        { key: 'edit', label: 'Edit', icon: 'create-outline' },
        { key: 'info', label: 'Info', icon: 'information-circle-outline' },
        { key: 'star', label: 'Star', icon: 'star-outline' },
        { key: 'remove', label: 'Remove', icon: 'trash-outline', danger: true },
      ];
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
    const own = m.from === 'clinic';
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

  const setMessageReaction = async (message: Message, emoji: string) => {
    if (!patientId) return;
    const isClearing = message.reactionClinic === emoji;
    try {
      const next = isClearing ? deleteField() : emoji;
      await updateDoc(doc(db, `patients/${patientId}/messages/${message.id}`), { reactionClinic: next });
      if (!isClearing && !REACTIONS.includes(emoji)) pushRecent(emoji);
    } catch (e) {
      console.error('[conversation] set reaction error', e);
    }
  };

  const toggleStar = async (m: Message) => {
    if (!patientId) return;
    try {
      await updateDoc(doc(db, `patients/${patientId}/messages/${m.id}`), {
        starredClinic: m.starredClinic ? deleteField() : true,
      });
    } catch (e) {
      console.error('[conversation] toggle star error', e);
    }
  };

  const removeMyReaction = () => {
    if (reactionSheetTarget?.reactionClinic) {
      setMessageReaction(reactionSheetTarget, reactionSheetTarget.reactionClinic);
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

  const pushRecent = (emoji: string) => {
    if (!recentsLoaded) return;
    setRecents((prev) => {
      const next = [emoji, ...prev.filter((x) => x !== emoji)].slice(0, RECENT_MAX);
      AsyncStorage.setItem(RECENTS_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  };

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
        allowsMultipleSelection: true,
        quality: 1,
      });
      if (result.canceled) return;
      const uris = (result.assets ?? []).map((a) => a.uri).filter(Boolean) as string[];
      if (uris.length === 0) return;
      router.push({
        pathname: '/clinic/media-preview' as any,
        params: { uris: JSON.stringify(uris), patientId, name: patientName, clinicId, senderName: 'Clinic' },
      });
    } catch (err) {
      console.error('[conversation] pick/send image error', err);
      Alert.alert('Upload failed', 'Please try again.');
    } finally {
      setAttachBusy(false);
    }
  };

  useEffect(() => {
    if (clinicLoading) return;
    if (!clinicUser) {
      router.replace('/login' as any);
      return;
    }
    if (!clinicId || !patientId) {
      setLoading(false);
      return;
    }

    markThreadReadForClinic(clinicId, patientId as string);
    ensureThread(clinicId, patientId as string, patientName);

    const q = query(
      collection(db, `patients/${patientId}/messages`),
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
        console.error('[clinic/conversation] messages error', err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [clinicId, clinicUser, clinicLoading, patientId, router]);

  useEffect(() => {
    if (!clinicId || !patientId) return;
    const unsub = onSnapshot(
      doc(db, 'threads', `${clinicId}_${patientId}`),
      (snap) => {
        const v = snap.exists() ? (snap.data() as any).clearedForClinicAt : 0;
        setClearedForClinicAt(typeof v === 'number' ? v : 0);
      },
      (e) => console.error('[conversation] thread marker sub error', e),
    );
    return () => unsub();
  }, [clinicId, patientId]);

  const handleBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/clinic/messages' as any);
  };

  const handleSend = async () => {
    const text = draft.trim();
    if (!text || sending) return;
    if (!clinicId || !patientId) return;
    setSending(true);
    setDraft('');
    try {
      await addDoc(collection(db, `patients/${patientId}/messages`), {
        from: 'clinic',
        text,
        senderName: 'Clinic',
        createdAt: Date.now(),
      });
      await updateThreadOnMessage(
        clinicId,
        patientId as string,
        patientName,
        text,
        'clinic'
      );
    } catch (err) {
      console.error('[clinic/conversation] send error', err);
      setDraft(text);
    } finally {
      setSending(false);
    }
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
      await updateDoc(doc(db, `patients/${patientId}/messages/${target.id}`), { text: newText });
      const list = messages;
      const last = list[list.length - 1];
      if (last && last.id === target.id && clinicId) {
        try {
          await updateDoc(doc(db, 'threads', `${clinicId}_${patientId}`), { lastMessageText: newText });
        } catch {
          // best-effort preview update
        }
      }
    } catch (err) {
      console.error('[clinic/conversation] edit error', err);
    }
  };

  const handleRemoveMessage = (m: Message) => {
    if (!patientId) return;
    Alert.alert(
      'Delete this message?',
      'This permanently deletes the message for both you and the patient. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const wasLast = messages.length > 0 && messages[messages.length - 1].id === m.id;
            const prev = wasLast ? messages[messages.length - 2] : undefined;
            try {
              await deleteDoc(doc(db, `patients/${patientId}/messages/${m.id}`));
              if (wasLast && clinicId) {
                const preview = prev ? (prev.type === 'image' ? 'Photo' : prev.text) : '';
                try {
                  await updateDoc(doc(db, 'threads', `${clinicId}_${patientId}`), { lastMessageText: preview });
                } catch {
                  // best-effort preview refresh
                }
              }
            } catch (err) {
              console.error('[clinic/conversation] remove error', err);
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

  const palette = AVATAR_PALETTE[hashName(patientName) % AVATAR_PALETTE.length];

  const BubbleBody = ({ item, sent, time }: { item: Message; sent: boolean; time: string }) => {
    const hasReaction = !!(item.reactionClinic || item.reactionPatient);
    const reactionBadge = hasReaction ? (
      <Pressable
        onPress={() => openReactionSheet(item)}
        hitSlop={8}
        style={[styles.reactionBadge, styles.reactionBadgeLeft]}
      >
        <Text style={styles.reactionBadgeText}>
          {[item.reactionClinic, item.reactionPatient].filter(Boolean).join(' ')}
        </Text>
      </Pressable>
    ) : null;

    const starBadge = item.starredClinic ? (
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
          <Image
            source={{ uri: media[0].url }}
            style={{ width: ALBUM_W, height: ALBUM_W, borderRadius: 14 }}
            resizeMode="cover"
          />
        );
      } else if (media.length === 2) {
        grid = (
          <View style={[styles.albumRow, { width: ALBUM_W }]}>
            <Image
              source={{ uri: media[0].url }}
              style={[styles.albumCell, { width: cellSquare, height: cellSquare, marginRight: GAP }]}
              resizeMode="cover"
            />
            <Image
              source={{ uri: media[1].url }}
              style={[styles.albumCell, { width: cellSquare, height: cellSquare }]}
              resizeMode="cover"
            />
          </View>
        );
      } else {
        grid = (
          <View style={{ width: ALBUM_W }}>
            <View style={[styles.albumRow, { marginBottom: GAP }]}>
              <Image
                source={{ uri: media[0].url }}
                style={[styles.albumCell, { width: cellSquare, height: cellSquare, marginRight: GAP }]}
                resizeMode="cover"
              />
              <Image
                source={{ uri: media[1].url }}
                style={[styles.albumCell, { width: cellSquare, height: cellSquare }]}
                resizeMode="cover"
              />
            </View>
            <View style={{ position: 'relative' }}>
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
            </View>
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
            <Image
              source={{ uri: item.imageUrl }}
              style={{ width: BUBBLE_MAX_W, height: imgH, borderRadius: 14 }}
              resizeMode="cover"
            />
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
    const sent = item.from === 'clinic';
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
                  `/clinic/contact-info?patientId=${patientId}&name=${encodeURIComponent(patientName)}` as any,
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
                <Text style={styles.headerAvatarText}>{initialsOf(patientName)}</Text>
              </LinearGradient>

              <View style={styles.headerText}>
                <Text
                  style={[styles.headerTitle, { color: textPrimary }]}
                  numberOfLines={1}
                >
                  {patientName}
                </Text>
                <Text style={[styles.headerSub, { color: textSecondary }]} numberOfLines={1}>
                  Patient
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
                onPress={() => Haptics.selectionAsync().catch(() => {})}
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
                router.push(
                  `/clinic/chat-camera?patientId=${patientId}&name=${encodeURIComponent(patientName)}&clinicId=${clinicId ?? ''}` as any,
                );
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
              sent={selectedMessage.from === 'clinic'}
              time={formatBubbleTime(selectedMessage.createdAt)}
            />
          </View>
        )}
        {rowPos && selectedMessage && (
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
                const isSelected = selectedMessage?.reactionClinic === e;
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
                const isSelected = selectedMessage?.reactionClinic === e;
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
              {infoMsg.from === 'clinic' && (
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
});
