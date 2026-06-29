import { db } from '@/firebaseConfig';
import { PremiumGradientBackground } from '@/src/components/PremiumGradientBackground';
import { useClinic } from '@/src/context/ClinicContext';
import { useTheme } from '@/src/context/ThemeContext';
import { useClinicGuard } from '@/src/utils/navigationGuards';
import { markThreadReadForClinic, updateThreadOnMessage } from '@/src/utils/threadsHelper';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { addDoc, collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Image,
    Keyboard,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    TouchableWithoutFeedback,
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

function formatBubbleTime(ts: any): string {
  if (!ts) return '';
  const date = typeof ts === 'number' ? new Date(ts) : ts instanceof Date ? new Date(ts) : null;
  if (!date || Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

type Message = {
  id: string;
  from: 'patient' | 'clinic';
  text: string;
  senderName?: string;
  createdAt?: any;
  type?: 'image';
  imageUrl?: string;
  imageWidth?: number;
  imageHeight?: number;
  storagePath?: string;
};

export default function ClinicConversationScreen() {
  useClinicGuard();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { clinicId, clinicUser, loading: clinicLoading } = useClinic();
  const { patientId, name } = useLocalSearchParams<{ patientId: string; name?: string }>();

  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [attachVisible, setAttachVisible] = useState(false);
  const listRef = useRef<FlatList<Message>>(null);

  const patientName = (name as string) || 'Patient';

  const openAttach = () => setAttachVisible(true);
  const closeAttach = () => setAttachVisible(false);

  useEffect(() => {
    if (clinicLoading) return;
    if (!clinicUser) {
      router.replace('/clinic/login' as any);
      return;
    }
    if (!clinicId || !patientId) {
      setLoading(false);
      return;
    }

    markThreadReadForClinic(clinicId, patientId as string);

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

  const renderItem = ({ item }: { item: Message }) => {
    const sent = item.from === 'clinic';
    const time = formatBubbleTime(item.createdAt);
    if (item.type === 'image' && item.imageUrl) {
      const BUBBLE_MAX_W = 220;
      const ratio =
        item.imageWidth && item.imageHeight
          ? item.imageHeight / item.imageWidth
          : 1;
      const imgH = Math.min(Math.max(BUBBLE_MAX_W * ratio, 120), 320);
      return (
        <View style={[styles.bubbleRow, sent ? styles.bubbleRowRight : styles.bubbleRowLeft]}>
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
        </View>
      );
    }
    if (sent) {
      return (
        <View style={[styles.bubbleRow, styles.bubbleRowRight]}>
          <LinearGradient
            colors={['#4DA3FF', '#1E6FD9']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.bubble, styles.bubbleSent]}
          >
            <Text style={styles.bubbleSentText}>{item.text}</Text>
            {!!time && <Text style={styles.bubbleSentTime}>{time}</Text>}
          </LinearGradient>
        </View>
      );
    }
    return (
      <View style={[styles.bubbleRow, styles.bubbleRowLeft]}>
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
      </View>
    );
  };

  const canSend = draft.trim().length > 0 && !sending;

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
          </View>

          {/* Body */}
          <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
            <View style={{ flex: 1 }}>
              {loading ? (
                <View style={styles.center}>
                  <ActivityIndicator color={textSecondary} />
                </View>
              ) : messages.length === 0 ? (
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
                  data={messages}
                  keyExtractor={(m) => m.id}
                  renderItem={renderItem}
                  contentContainerStyle={styles.listContent}
                  showsVerticalScrollIndicator={false}
                  keyboardDismissMode="on-drag"
                  keyboardShouldPersistTaps="handled"
                  onContentSizeChange={() =>
                    listRef.current?.scrollToEnd({ animated: false })
                  }
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
            <Pressable
              onPress={openAttach}
              style={[styles.attachBtn, { backgroundColor: attachBtnBg }]}
              hitSlop={6}
            >
              <Ionicons name="add" size={24} color={attachBtnIcon} />
            </Pressable>
            <View
              style={[
                styles.input,
                { backgroundColor: inputBg, borderColor: inputBorder },
              ]}
            >
              <TextInput
                value={draft}
                onChangeText={setDraft}
                placeholder="Type a message"
                placeholderTextColor={inputPlaceholder}
                style={[styles.inputText, { color: textPrimary }]}
                multiline
                maxLength={2000}
              />
            </View>
            <Pressable
              onPress={handleSend}
              disabled={!canSend}
              style={({ pressed }) => [
                styles.sendBtn,
                { opacity: canSend ? (pressed ? 0.85 : 1) : 0.45 },
              ]}
            >
              <LinearGradient
                colors={['#4DA3FF', '#1E6FD9']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.sendBtnInner}
              >
                <Ionicons name="send" size={18} color="#FFFFFF" />
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
              onPress={() => {}}
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

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },

  listContent: {
    paddingHorizontal: 14,
    paddingTop: 4,
    paddingBottom: 12,
    gap: 6,
  },

  bubbleRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  bubbleRowLeft: { justifyContent: 'flex-start' },
  bubbleRowRight: { justifyContent: 'flex-end' },

  bubble: {
    maxWidth: '78%',
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
    maxWidth: '78%',
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
});
