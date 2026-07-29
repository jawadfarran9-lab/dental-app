import { db } from '@/firebaseConfig';
import { sendAlbumMessage, sendImageMessage } from '@/src/services/chatImages';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function MediaPreviewScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    uris: string;
    patientId: string;
    name: string;
    clinicId: string;
    senderName: string;
  }>();
  const { patientId, name, clinicId, senderName } = params;

  const uris = useMemo<string[]>(() => {
    try {
      const parsed = JSON.parse(params.uris || '[]');
      return Array.isArray(parsed) ? parsed.filter((u) => typeof u === 'string') : [];
    } catch {
      return [];
    }
  }, [params.uris]);

  const [activeIndex, setActiveIndex] = useState(0);
  const [caption, setCaption] = useState('');
  const [sending, setSending] = useState(false);

  const activeUri = uris[activeIndex];

  const handleClose = () => {
    if (router.canGoBack()) router.back();
  };

  const handleSend = async () => {
    if (sending) return;
    if (uris.length === 0 || !clinicId || !patientId) {
      Alert.alert('Missing info', 'Cannot send right now.');
      return;
    }
    try {
      setSending(true);
      if (uris.length <= 1) {
        await sendImageMessage(
          {
            clinicId: clinicId as string,
            patientId: patientId as string,
            patientName: (name as string) ?? '',
            localUri: uris[0],
            from: 'clinic',
            senderName: (senderName as string) ?? 'Clinic',
            senderType: 'clinic',
            caption: caption.trim() || undefined,
          },
          db,
        );
      } else {
        await sendAlbumMessage(
          {
            clinicId: clinicId as string,
            patientId: patientId as string,
            patientName: (name as string) ?? '',
            localUris: uris,
            from: 'clinic',
            senderName: (senderName as string) ?? 'Clinic',
            senderType: 'clinic',
            caption: caption.trim() || undefined,
          },
          db,
        );
      }
      router.back();
    } catch (e) {
      setSending(false);
      Alert.alert('Send failed', 'Could not send the image. Please try again.');
    }
  };

  return (
    <View style={styles.root}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="light-content" />

      <Pressable
        onPress={handleClose}
        style={[styles.closeBtn, { top: insets.top + 12 }]}
        hitSlop={10}
      >
        <Ionicons name="close" size={22} color="#FFFFFF" />
      </Pressable>

      <View style={styles.imageWrap}>
        {activeUri ? (
          <Image
            source={{ uri: activeUri }}
            style={styles.image}
            resizeMode="contain"
          />
        ) : null}
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
        style={styles.bottomWrap}
      >
        <View style={[styles.bottomInner, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <View style={styles.recipientBlock}>
            <Text style={styles.recipientName} numberOfLines={1}>
              {(name as string) || 'Patient'}
            </Text>
            <Text style={styles.recipientSub} numberOfLines={1}>
              Clinic
            </Text>
          </View>

          {uris.length > 1 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.strip}
            >
              {uris.map((u, i) => (
                <Pressable key={`${u}-${i}`} onPress={() => setActiveIndex(i)} hitSlop={4}>
                  <Image
                    source={{ uri: u }}
                    style={[styles.thumb, i === activeIndex && styles.thumbActive]}
                    resizeMode="cover"
                  />
                </Pressable>
              ))}
            </ScrollView>
          )}

          <View style={styles.captionRow}>
            <View style={styles.captionPill}>
              <TextInput
                style={styles.captionInput}
                placeholder="Add a caption…"
                placeholderTextColor="rgba(255,255,255,0.55)"
                value={caption}
                onChangeText={setCaption}
                editable={!sending}
                multiline
              />
            </View>

            <Pressable
              onPress={handleSend}
              disabled={sending}
              style={[styles.sendBtn, sending && styles.sendBtnDisabled]}
              hitSlop={8}
            >
              <LinearGradient
                colors={['#4DA3FF', '#1E6FD9']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.sendBtnGradient}
              >
                {sending ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Ionicons name="send" size={20} color="#FFFFFF" />
                )}
              </LinearGradient>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000000',
  },
  closeBtn: {
    position: 'absolute',
    left: 16,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  bottomWrap: {
    width: '100%',
  },
  bottomInner: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 12,
  },
  recipientBlock: {
    alignSelf: 'flex-start',
  },
  recipientName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  recipientSub: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  captionRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
  },
  captionPill: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: 44,
    justifyContent: 'center',
  },
  captionInput: {
    color: '#FFFFFF',
    fontSize: 15,
    maxHeight: 120,
    padding: 0,
  },
  sendBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    opacity: 0.6,
  },
  strip: {
    gap: 6,
    paddingVertical: 2,
  },
  thumb: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  thumbActive: {
    borderColor: '#4DA3FF',
  },
});
