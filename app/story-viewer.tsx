import { useAuth } from '@/src/hooks/useAuth';
import { ClinicStory, getActiveStories } from '@/src/services/storyService';
import { Ionicons } from '@expo/vector-icons';
import { ResizeMode, Video } from 'expo-av';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    Dimensions,
    Platform,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const IMAGE_DURATION = 5000; // 5 seconds for images
const PROGRESS_UPDATE_INTERVAL = 50;

export default function StoryViewerScreen() {
  const router = useRouter();
  const { clinicId, userId } = useAuth();
  const { startIndex } = useLocalSearchParams<{ startIndex?: string }>();

  const [stories, setStories] = useState<ClinicStory[]>([]);
  const [currentIndex, setCurrentIndex] = useState(parseInt(startIndex || '0', 10));
  const [loading, setLoading] = useState(true);
  const [paused, setPaused] = useState(false);
  const [replyText, setReplyText] = useState('');

  // Progress bar animations — one per story
  const progressAnims = useRef<Animated.Value[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const elapsedRef = useRef(0);
  const durationRef = useRef(IMAGE_DURATION);
  const videoRef = useRef<Video>(null);

  // ========== Load Stories ==========
  useEffect(() => {
    if (!clinicId) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await getActiveStories(clinicId, userId);
        if (!cancelled && data.length > 0) {
          progressAnims.current = data.map(() => new Animated.Value(0));
          setStories(data);
          // Fix start index if out of range
          const idx = parseInt(startIndex || '0', 10);
          if (idx >= data.length) setCurrentIndex(0);
        } else if (!cancelled) {
          // No stories — go back
          router.back();
        }
      } catch (err) {
        console.error('Error loading stories:', err);
        if (!cancelled) router.back();
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [clinicId]);

  // ========== Cleanup on unmount ==========
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // ========== Start progress for current story ==========
  const startProgress = useCallback((duration: number) => {
    if (timerRef.current) clearInterval(timerRef.current);
    elapsedRef.current = 0;
    durationRef.current = duration;

    timerRef.current = setInterval(() => {
      if (paused) return;
      elapsedRef.current += PROGRESS_UPDATE_INTERVAL;
      const progress = Math.min(elapsedRef.current / durationRef.current, 1);
      progressAnims.current[currentIndex]?.setValue(progress);

      if (progress >= 1) {
        goNext();
      }
    }, PROGRESS_UPDATE_INTERVAL);
  }, [currentIndex, paused]);

  // ========== Navigate ==========
  const goNext = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    // Fill current bar
    progressAnims.current[currentIndex]?.setValue(1);

    if (currentIndex < stories.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      // End of stories
      router.back();
    }
  }, [currentIndex, stories.length, router]);

  const goPrev = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    // Reset current bar
    progressAnims.current[currentIndex]?.setValue(0);

    if (currentIndex > 0) {
      // Reset previous bar too and go to it
      progressAnims.current[currentIndex - 1]?.setValue(0);
      setCurrentIndex((i) => i - 1);
    } else {
      // Already at first — restart it
      elapsedRef.current = 0;
      progressAnims.current[0]?.setValue(0);
      startProgress(durationRef.current);
    }
  }, [currentIndex, startProgress]);

  // ========== When currentIndex changes, reset progress ==========
  useEffect(() => {
    if (stories.length === 0) return;

    // Set all bars before current to full, after to empty
    progressAnims.current.forEach((anim, i) => {
      if (i < currentIndex) anim.setValue(1);
      else if (i > currentIndex) anim.setValue(0);
      else anim.setValue(0); // current starts at 0
    });

    const story = stories[currentIndex];
    if (story.type === 'image') {
      startProgress(IMAGE_DURATION);
    }
    // For video, progress starts in onLoad callback
  }, [currentIndex, stories.length]);

  // ========== Tap Zones ==========
  const handleTap = useCallback((evt: { nativeEvent: { locationX: number } }) => {
    const x = evt.nativeEvent.locationX;
    if (x < SCREEN_WIDTH * 0.3) {
      goPrev();
    } else {
      goNext();
    }
  }, [goNext, goPrev]);

  // ========== Close ==========
  const handleClose = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    router.back();
  }, [router]);

  // ========== Video callbacks ==========
  const handleVideoLoad = useCallback((status: any) => {
    if (status.isLoaded && status.durationMillis) {
      startProgress(status.durationMillis);
    } else {
      startProgress(IMAGE_DURATION);
    }
  }, [startProgress]);

  const handleVideoEnd = useCallback(() => {
    goNext();
  }, [goNext]);

  // ========== Render ==========
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" />
        <ActivityIndicator size="large" color="#FFFFFF" />
      </View>
    );
  }

  if (stories.length === 0) return null;

  const story = stories[currentIndex];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Media */}
      <TouchableWithoutFeedback onPress={handleTap}>
        <View style={styles.mediaContainer}>
          {story.type === 'video' ? (
            <Video
              ref={videoRef}
              source={{ uri: story.mediaUrl }}
              style={styles.media}
              resizeMode={ResizeMode.COVER}
              shouldPlay={!paused}
              isLooping={false}
              onPlaybackStatusUpdate={(status) => {
                if (status.isLoaded && status.didJustFinish) {
                  handleVideoEnd();
                }
              }}
              onLoad={handleVideoLoad}
            />
          ) : (
            <Image
              source={{ uri: story.mediaUrl }}
              style={styles.media}
              contentFit="cover"
              transition={200}
            />
          )}
        </View>
      </TouchableWithoutFeedback>

      {/* Progress Bars */}
      <View style={styles.progressRow}>
        {stories.map((_, i) => (
          <View key={i} style={styles.progressBarBg}>
            <Animated.View
              style={[
                styles.progressBarFill,
                {
                  width: progressAnims.current[i]
                    ? progressAnims.current[i].interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0%', '100%'],
                      })
                    : '0%',
                },
              ]}
            />
          </View>
        ))}
      </View>

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(story.clinicName ?? 'C').charAt(0)}
            </Text>
          </View>
          <View>
            <Text style={styles.clinicName}>{story.clinicName ?? 'Clinic'}</Text>
            {story.caption ? (
              <Text style={styles.caption} numberOfLines={1}>
                {story.caption}
              </Text>
            ) : null}
          </View>
        </View>
        <TouchableOpacity onPress={handleClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Ionicons name="close" size={28} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Reply Input — shown only when allowReplies is not false */}
      {story.allowReplies !== false && (
        <View style={styles.replyBar}>
          <TextInput
            style={styles.replyInput}
            placeholder="Send a reply..."
            placeholderTextColor="rgba(255,255,255,0.5)"
            value={replyText}
            onChangeText={setReplyText}
            onFocus={() => setPaused(true)}
            onBlur={() => setPaused(false)}
            returnKeyType="send"
            onSubmitEditing={() => {
              if (replyText.trim()) setReplyText('');
            }}
          />
          {replyText.trim().length > 0 && (
            <TouchableOpacity
              style={styles.replySendBtn}
              onPress={() => setReplyText('')}
            >
              <Ionicons name="send" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mediaContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  media: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },

  // Progress
  progressRow: {
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 8,
    paddingTop: Platform.OS === 'ios' ? 56 : 16,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  progressBarBg: {
    flex: 1,
    height: 2.5,
    backgroundColor: 'rgba(255,255,255,0.35)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
  },

  // Header
  header: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 68 : 28,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    zIndex: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  clinicName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  caption: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 12,
    maxWidth: SCREEN_WIDTH * 0.6,
  },

  // Reply bar
  replyBar: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 40 : 20,
    left: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    zIndex: 10,
  },
  replyInput: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    paddingHorizontal: 16,
    color: '#FFFFFF',
    fontSize: 14,
  },
  replySendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
