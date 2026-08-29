import { db } from '@/firebaseConfig';
import { sendAlbumMessage, sendImageMessage, sendVideoMessage } from '@/src/services/chatImages';
import { SendingOverlay } from '@/src/components/SendingOverlay';
import { Ionicons } from '@expo/vector-icons';
import { ResizeMode, Video } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import * as VideoThumbnails from 'expo-video-thumbnails';
import { useEffect, useMemo, useState } from 'react';
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
    assets?: string;
    uris?: string;
    patientId: string;
    name: string;
    clinicId: string;
    senderName: string;
  }>();
  const { patientId, name, clinicId, senderName } = params;

  type PickAsset = { uri: string; kind: 'image' | 'video' };
  const assets = useMemo<PickAsset[]>(() => {
    try {
      if (params.assets) {
        const parsed = JSON.parse(params.assets);
        if (Array.isArray(parsed)) {
          return parsed
            .filter((a) => a && typeof a.uri === 'string')
            .map((a) => ({ uri: a.uri as string, kind: a.kind === 'video' ? 'video' as const : 'image' as const }));
        }
      }
      if (params.uris) {
        const parsed = JSON.parse(params.uris);
        if (Array.isArray(parsed)) {
          return parsed
            .filter((u) => typeof u === 'string')
            .map((u) => ({ uri: u as string, kind: 'image' as const }));
        }
      }
    } catch {}
    return [];
  }, [params.assets, params.uris]);

  const [activeIndex, setActiveIndex] = useState(0);
  const [caption, setCaption] = useState('');
  const [sending, setSending] = useState(false);
  const [sendPct, setSendPct] = useState<number | null>(null);
  const [sendLabel, setSendLabel] = useState('');
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [posters, setPosters] = useState<Record<string, string>>({});

  const activeAsset = assets[activeIndex];
  const isActiveVideo = activeAsset?.kind === 'video';

  useEffect(() => {
    setVideoPlaying(false);
  }, [activeIndex]);

  useEffect(() => {
    let cancelled = false;
    assets.forEach((a) => {
      if (a.kind !== 'video') return;
      if (posters[a.uri]) return;
      VideoThumbnails.getThumbnailAsync(a.uri, { time: 0 })
        .then(({ uri }) => {
          if (cancelled) return;
          setPosters((p) => (p[a.uri] ? p : { ...p, [a.uri]: uri }));
        })
        .catch(() => {});
    });
    return () => {
      cancelled = true;
    };
  }, [assets, posters]);

  const handleClose = () => {
    if (router.canGoBack()) router.back();
  };

  const handleSend = async () => {
    if (sending) return;
    if (assets.length === 0 || !clinicId || !patientId) {
      Alert.alert('Missing info', 'Cannot send right now.');
      return;
    }
    try {
      setSending(true);
      const hasVideo = assets.some((a) => a.kind === 'video');
      if (!hasVideo) {
        if (assets.length <= 1) {
          await sendImageMessage(
            {
              clinicId: clinicId as string,
              patientId: patientId as string,
              patientName: (name as string) ?? '',
              localUri: assets[0].uri,
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
              localUris: assets.map((a) => a.uri),
              from: 'clinic',
              senderName: (senderName as string) ?? 'Clinic',
              senderType: 'clinic',
              caption: caption.trim() || undefined,
            },
            db,
          );
        }
      } else {
        const n = assets.length;
        for (let i = 0; i < n; i++) {
          const a = assets[i];
          const cap = i === 0 ? (caption.trim() || undefined) : undefined;
          const base = n > 1 ? `Sending ${i + 1} of ${n}` : (a.kind === 'video' ? 'Sending video' : 'Sending photo');
          if (a.kind === 'video') {
            setSendPct(0);
            setSendLabel(base);
            await sendVideoMessage(
              {
                clinicId: clinicId as string,
                patientId: patientId as string,
                patientName: (name as string) ?? '',
                localUri: a.uri,
                from: 'clinic',
                senderName: (senderName as string) ?? 'Clinic',
                senderType: 'clinic',
                caption: cap,
                hd: false,
                onProgress: (p) => {
                  if (p >= 0.999) {
                    setSendPct(null);
                    setSendLabel(n > 1 ? `Uploading ${i + 1} of ${n}` : 'Uploading…');
                  } else {
                    setSendPct(p);
                  }
                },
              },
              db,
            );
          } else {
            setSendPct(null);
            setSendLabel(base);
            await sendImageMessage(
              {
                clinicId: clinicId as string,
                patientId: patientId as string,
                patientName: (name as string) ?? '',
                localUri: a.uri,
                from: 'clinic',
                senderName: (senderName as string) ?? 'Clinic',
                senderType: 'clinic',
                caption: cap,
              },
              db,
            );
          }
        }
      }
      router.back();
    } catch (e) {
      setSending(false);
      setSendPct(null);
      setSendLabel('');
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
        {activeAsset ? (
          isActiveVideo ? (
            <>
              <Video
                source={{ uri: activeAsset.uri }}
                style={styles.image}
                resizeMode={ResizeMode.CONTAIN}
                isLooping
                shouldPlay={videoPlaying}
                useNativeControls={false}
              />
              <Pressable
                onPress={() => setVideoPlaying((p) => !p)}
                style={StyleSheet.absoluteFill}
                accessibilityRole="button"
                accessibilityLabel={videoPlaying ? 'Pause video' : 'Play video'}
              />
              {!videoPlaying && (
                <View pointerEvents="none" style={styles.playBadge}>
                  <Ionicons name="play" size={34} color="#FFFFFF" style={{ marginLeft: 3 }} />
                </View>
              )}
            </>
          ) : (
            <Image
              source={{ uri: activeAsset.uri }}
              style={styles.image}
              resizeMode="contain"
            />
          )
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

          {assets.length > 1 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.strip}
            >
              {assets.map((a, i) => {
                const thumbUri = a.kind === 'video' ? (posters[a.uri] || a.uri) : a.uri;
                return (
                  <Pressable key={`${a.uri}-${i}`} onPress={() => setActiveIndex(i)} hitSlop={4} style={{ position: 'relative' }}>
                    <Image
                      source={{ uri: thumbUri }}
                      style={[styles.thumb, i === activeIndex && styles.thumbActive]}
                      resizeMode="cover"
                    />
                    {a.kind === 'video' && (
                      <View pointerEvents="none" style={styles.playBadgeSmall}>
                        <Ionicons name="play" size={12} color="#FFFFFF" style={{ marginLeft: 1 }} />
                      </View>
                    )}
                  </Pressable>
                );
              })}
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

      <SendingOverlay visible={sending} progress={sendPct} label={sendLabel} />
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
  playBadge: {
    position: 'absolute',
    alignSelf: 'center',
    top: '50%',
    marginTop: -34,
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  playBadgeSmall: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -8,
    marginLeft: -8,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
