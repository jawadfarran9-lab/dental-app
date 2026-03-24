import ViewerStickerCanvas from '@/src/components/stickers/ViewerStickerCanvas';
import { ArchiveItem } from '@/src/services/archiveService';
import { ClinicPreferences } from '@/src/services/clinicPreferencesService';
import {
    getPostsLikeData,
    getSavedStatusBatch,
    togglePostLike,
    toggleSavePost,
} from '@/src/services/engagementService';
import { Ionicons } from '@expo/vector-icons';
import { ResizeMode, Video } from 'expo-av';
import { Image } from 'expo-image';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
    Alert,
    Animated,
    Dimensions,
    Modal,
    Platform,
    Share,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const IMAGE_DURATION = 5000;
const PROGRESS_INTERVAL = 50;

interface Props {
  visible: boolean;
  items: ArchiveItem[];
  startIndex: number;
  clinicId: string;
  prefs: ClinicPreferences;
  onClose: () => void;
}

export default function ArchiveViewerModal({ visible, items, startIndex, clinicId, prefs, onClose }: Props) {
  const [currentIndex, setCurrentIndex] = useState(startIndex);

  const progressAnims = useRef<Animated.Value[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const elapsedRef = useRef(0);
  const durationRef = useRef(IMAGE_DURATION);
  const videoRef = useRef<Video>(null);

  // Engagement state
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});
  const [savedPosts, setSavedPosts] = useState<Set<string>>(new Set());

  // Load engagement data when modal opens
  useEffect(() => {
    if (!visible || items.length === 0 || !clinicId) return;
    (async () => {
      try {
        const postIds = items.map(i => i.id);
        const [likeData, savedData] = await Promise.all([
          getPostsLikeData(clinicId, postIds),
          getSavedStatusBatch(postIds),
        ]);
        const likedSet = new Set<string>();
        const counts: Record<string, number> = {};
        Object.entries(likeData).forEach(([pid, d]) => {
          if (d.isLiked) likedSet.add(pid);
          counts[pid] = d.likeCount;
        });
        setLikedPosts(likedSet);
        setLikeCounts(counts);
        const savedSet = new Set<string>();
        Object.entries(savedData).forEach(([pid, s]) => { if (s) savedSet.add(pid); });
        setSavedPosts(savedSet);
      } catch { /* ignore */ }
    })();
  }, [visible, items.length, clinicId]);

  const handleLike = useCallback(async () => {
    if (!clinicId) return;
    const postId = items[currentIndex]?.id;
    if (!postId) return;
    const wasLiked = likedPosts.has(postId);
    // Optimistic
    setLikedPosts(prev => { const s = new Set(prev); wasLiked ? s.delete(postId) : s.add(postId); return s; });
    setLikeCounts(prev => ({ ...prev, [postId]: (prev[postId] || 0) + (wasLiked ? -1 : 1) }));
    try {
      const result = await togglePostLike(clinicId, postId);
      setLikedPosts(prev => { const s = new Set(prev); result.isLiked ? s.add(postId) : s.delete(postId); return s; });
      setLikeCounts(prev => ({ ...prev, [postId]: result.likeCount }));
    } catch {
      // Revert
      setLikedPosts(prev => { const s = new Set(prev); wasLiked ? s.add(postId) : s.delete(postId); return s; });
      setLikeCounts(prev => ({ ...prev, [postId]: (prev[postId] || 0) + (wasLiked ? 1 : -1) }));
    }
  }, [clinicId, items, currentIndex, likedPosts]);

  const handleSave = useCallback(async () => {
    const postId = items[currentIndex]?.id;
    if (!postId) return;
    const wasSaved = savedPosts.has(postId);
    setSavedPosts(prev => { const s = new Set(prev); wasSaved ? s.delete(postId) : s.add(postId); return s; });
    try {
      const isSaved = await toggleSavePost(postId);
      setSavedPosts(prev => { const s = new Set(prev); isSaved ? s.add(postId) : s.delete(postId); return s; });
    } catch {
      setSavedPosts(prev => { const s = new Set(prev); wasSaved ? s.add(postId) : s.delete(postId); return s; });
    }
  }, [items, currentIndex, savedPosts]);

  const handleShare = useCallback(async () => {
    const postId = items[currentIndex]?.id;
    if (!postId) return;
    if (!prefs.shareToOtherApps) {
      Alert.alert('Sharing Disabled', 'The clinic has disabled external sharing.');
      return;
    }
    try {
      await Share.share({ message: `Check out this on BeSmile AI!\n\nhttps://besmile.ai/post/${postId}` });
    } catch { /* user cancelled */ }
  }, [items, currentIndex, prefs]);

  // Reset when opened with new startIndex
  useEffect(() => {
    if (visible) {
      progressAnims.current = items.map(() => new Animated.Value(0));
      setCurrentIndex(startIndex);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, [visible, startIndex]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // ========== Progress Timer ==========
  const startProgress = useCallback((duration: number) => {
    if (timerRef.current) clearInterval(timerRef.current);
    elapsedRef.current = 0;
    durationRef.current = duration;

    timerRef.current = setInterval(() => {
      elapsedRef.current += PROGRESS_INTERVAL;
      const progress = Math.min(elapsedRef.current / durationRef.current, 1);
      progressAnims.current[currentIndex]?.setValue(progress);
      if (progress >= 1) goNext();
    }, PROGRESS_INTERVAL);
  }, [currentIndex]);

  // ========== Navigation ==========
  const goNext = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    progressAnims.current[currentIndex]?.setValue(1);

    if (currentIndex < items.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      onClose();
    }
  }, [currentIndex, items.length, onClose]);

  const goPrev = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    progressAnims.current[currentIndex]?.setValue(0);

    if (currentIndex > 0) {
      progressAnims.current[currentIndex - 1]?.setValue(0);
      setCurrentIndex((i) => i - 1);
    } else {
      elapsedRef.current = 0;
      progressAnims.current[0]?.setValue(0);
      startProgress(durationRef.current);
    }
  }, [currentIndex, startProgress]);

  // ========== Index change → reset bars + start timer ==========
  useEffect(() => {
    if (!visible || items.length === 0) return;

    progressAnims.current.forEach((anim, i) => {
      if (i < currentIndex) anim.setValue(1);
      else anim.setValue(0);
    });

    const item = items[currentIndex];
    if (item?.type === 'image') {
      startProgress(IMAGE_DURATION);
    }
    // Video: progress starts via onLoad
  }, [currentIndex, visible, items.length]);

  // ========== Tap zones ==========
  const handleTap = useCallback((evt: { nativeEvent: { locationX: number } }) => {
    if (evt.nativeEvent.locationX < SCREEN_WIDTH * 0.3) {
      goPrev();
    } else {
      goNext();
    }
  }, [goNext, goPrev]);

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

  const handleClose = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    onClose();
  }, [onClose]);

  if (!visible || items.length === 0) return null;

  const item = items[currentIndex];
  if (!item) return null;

  return (
    <Modal visible animationType="fade" transparent={false} onRequestClose={handleClose}>
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />

        {/* Media */}
        <TouchableWithoutFeedback onPress={handleTap}>
          <View style={styles.mediaContainer}>
            {item.type === 'video' ? (
              <Video
                ref={videoRef}
                source={{ uri: item.mediaUrl }}
                style={styles.media}
                resizeMode={ResizeMode.COVER}
                shouldPlay
                isLooping={false}
                onPlaybackStatusUpdate={(status) => {
                  if (status.isLoaded && status.didJustFinish) handleVideoEnd();
                }}
                onLoad={handleVideoLoad}
              />
            ) : (
              <Image
                source={{ uri: item.mediaUrl }}
                style={styles.media}
                contentFit="cover"
                transition={200}
              />
            )}
          </View>
        </TouchableWithoutFeedback>

        {/* Sticker overlays (read-only) */}
        <ViewerStickerCanvas stickers={item.stickers} />

        {/* Progress Bars */}
        <View style={styles.progressRow}>
          {items.map((_, i) => (
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
                {(item.clinicName || 'C').charAt(0)}
              </Text>
            </View>
            <View>
              <Text style={styles.clinicName}>{item.clinicName || 'Clinic'}</Text>
              {item.caption ? (
                <Text style={styles.caption} numberOfLines={1}>{item.caption}</Text>
              ) : null}
            </View>
          </View>
          <TouchableOpacity onPress={handleClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Ionicons name="close" size={28} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Counter */}
        <View style={styles.counter}>
          <Text style={styles.counterText}>{currentIndex + 1} / {items.length}</Text>
        </View>

        {/* Engagement Actions */}
        <View style={styles.engagementRow}>
          <TouchableOpacity onPress={handleLike} style={styles.engagementBtn}>
            <Ionicons
              name={likedPosts.has(item.id) ? 'heart' : 'heart-outline'}
              size={28}
              color={likedPosts.has(item.id) ? '#FF6B6B' : '#FFFFFF'}
            />
            {!prefs.hideLikeCounts && (likeCounts[item.id] ?? 0) > 0 && (
              <Text style={styles.engagementCount}>{likeCounts[item.id]}</Text>
            )}
          </TouchableOpacity>
          {(prefs.shareToOtherApps || prefs.shareableLink) && (
            <TouchableOpacity onPress={handleShare} style={styles.engagementBtn}>
              <Ionicons name="paper-plane-outline" size={26} color="#FFFFFF" />
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={handleSave} style={styles.engagementBtn}>
            <Ionicons
              name={savedPosts.has(item.id) ? 'bookmark' : 'bookmark-outline'}
              size={26}
              color='#FFFFFF'
            />
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  mediaContainer: { ...StyleSheet.absoluteFillObject },
  media: { width: SCREEN_WIDTH, height: SCREEN_HEIGHT },

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
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  clinicName: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  caption: { color: 'rgba(255,255,255,0.75)', fontSize: 12, maxWidth: SCREEN_WIDTH * 0.6 },

  counter: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 50 : 30,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    zIndex: 10,
  },
  counterText: { color: '#FFFFFF', fontSize: 13, fontWeight: '600' },

  engagementRow: {
    position: 'absolute',
    right: 12,
    bottom: Platform.OS === 'ios' ? 100 : 80,
    alignItems: 'center',
    gap: 20,
    zIndex: 10,
  },
  engagementBtn: {
    alignItems: 'center',
    gap: 4,
  },
  engagementCount: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
});
