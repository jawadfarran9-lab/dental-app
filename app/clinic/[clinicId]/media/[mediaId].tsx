import { useTheme } from '@/src/context/ThemeContext';
import { fetchClinicMediaById } from '@/src/services/clinicMediaService';
import { ClinicMedia } from '@/src/types/clinicMedia';
import { Ionicons } from '@expo/vector-icons';
import { ResizeMode, Video } from 'expo-av';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    FlatList,
    NativeScrollEvent,
    NativeSyntheticEvent,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * Media Detail Screen — Full Viewer
 *
 * Route: /clinic/[clinicId]/media/[mediaId]
 *
 * Posts:  full-width image, horizontal FlatList paging for carousel, dot indicators
 * Reels:  full-screen video with autoplay, loop, tap-to-pause
 */
export default function MediaDetailScreen() {
  const { clinicId, mediaId } = useLocalSearchParams<{ clinicId: string; mediaId: string }>();
  const router = useRouter();
  const { colors, isDark } = useTheme();

  const [media, setMedia] = useState<ClinicMedia | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSlide, setActiveSlide] = useState(0);
  const [videoPaused, setVideoPaused] = useState(false);
  const videoRef = useRef<Video>(null);

  // ─── Fetch media data ───
  useEffect(() => {
    if (!clinicId || !mediaId) return;
    (async () => {
      setLoading(true);
      const item = await fetchClinicMediaById(clinicId, mediaId);
      setMedia(item);
      setLoading(false);
    })();
  }, [clinicId, mediaId]);

  // ─── Carousel page change ───
  const onScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const page = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
      setActiveSlide(page);
    },
    [],
  );

  // ─── Format date ───
  const formattedDate = media
    ? new Date(media.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '';

  // ─── Build image list for carousel ───
  const imageList: string[] = (() => {
    if (!media) return [];
    if (media.mediaUrls && media.mediaUrls.length > 0) return media.mediaUrls;
    if (media.mediaUrl) return [media.mediaUrl];
    if (media.thumbnailUrl) return [media.thumbnailUrl];
    return [];
  })();

  // ─── Loading state ───
  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#000' : '#FFF' }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  // ─── Not found ───
  if (!media) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#000' : '#FFF' }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.textSecondary} />
          <Text style={[styles.errorText, { color: colors.textSecondary }]}>
            Media not found
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const isReel = media.type === 'reel';

  // ─── REEL VIEWER (full-screen video) ───
  if (isReel) {
    return (
      <View style={[styles.reelContainer, { backgroundColor: '#000' }]}>
        <StatusBar barStyle="light-content" />

        {/* Back button */}
        <SafeAreaView style={styles.reelOverlay}>
          <TouchableOpacity onPress={() => router.back()} style={styles.reelBackBtn}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
        </SafeAreaView>

        {/* Video */}
        <TouchableWithoutFeedback
          onPress={() => {
            setVideoPaused((p) => {
              if (!p) {
                videoRef.current?.pauseAsync();
              } else {
                videoRef.current?.playAsync();
              }
              return !p;
            });
          }}
        >
          <View style={styles.reelVideoWrapper}>
            <Video
              ref={videoRef}
              source={{ uri: media.mediaUrl || media.thumbnailUrl }}
              style={styles.reelVideo}
              resizeMode={ResizeMode.CONTAIN}
              shouldPlay
              isLooping
              isMuted={false}
              useNativeControls={false}
            />

            {/* Paused indicator */}
            {videoPaused && (
              <View style={styles.pausedOverlay}>
                <Ionicons name="play" size={56} color="rgba(255,255,255,0.8)" />
              </View>
            )}
          </View>
        </TouchableWithoutFeedback>

        {/* Caption */}
        {media.caption ? (
          <SafeAreaView style={styles.reelCaptionContainer}>
            <Text style={styles.reelCaption} numberOfLines={3}>
              {media.caption}
            </Text>
          </SafeAreaView>
        ) : null}
      </View>
    );
  }

  // ─── POST VIEWER (image / carousel) ───
  const isCarousel = imageList.length > 1;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#000' : '#FFF' }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
          {media.clinicName || 'Post'}
        </Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Image / Carousel */}
      <View style={styles.mediaWrapper}>
        {isCarousel ? (
          <FlatList
            data={imageList}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={onScrollEnd}
            keyExtractor={(_, i) => `slide-${i}`}
            renderItem={({ item: uri }) => (
              <Image
                source={{ uri }}
                style={styles.postImage}
                contentFit="contain"
                transition={200}
              />
            )}
          />
        ) : (
          <Image
            source={{ uri: imageList[0] || media.thumbnailUrl }}
            style={styles.postImage}
            contentFit="contain"
            transition={200}
          />
        )}

        {/* Dot indicators */}
        {isCarousel && (
          <View style={styles.dotsRow}>
            {imageList.map((_, i) => (
              <View
                key={`dot-${i}`}
                style={[
                  styles.dot,
                  {
                    backgroundColor:
                      i === activeSlide ? colors.primary : isDark ? '#555' : '#CCC',
                  },
                ]}
              />
            ))}
          </View>
        )}

        {/* Slide counter badge */}
        {isCarousel && (
          <View style={styles.counterBadge}>
            <Text style={styles.counterText}>
              {activeSlide + 1}/{imageList.length}
            </Text>
          </View>
        )}
      </View>

      {/* Caption & date */}
      <View style={styles.captionSection}>
        {media.caption ? (
          <Text style={[styles.caption, { color: colors.textPrimary }]}>
            {media.caption}
          </Text>
        ) : null}
        <Text style={[styles.date, { color: colors.textSecondary }]}>
          {formattedDate}
        </Text>
      </View>
    </SafeAreaView>
  );
}

// ─── Styles ───
const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  errorText: { fontSize: 15, fontWeight: '600', marginTop: 8 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 17, fontWeight: '700' },

  // Post viewer
  mediaWrapper: { position: 'relative' },
  postImage: { width: SCREEN_WIDTH, height: SCREEN_WIDTH },

  // Dots
  dotsRow: {
    flexDirection: 'row',
    alignSelf: 'center',
    marginTop: 10,
    gap: 6,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },

  // Counter badge
  counterBadge: {
    position: 'absolute',
    top: 12,
    right: 14,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  counterText: { color: '#FFF', fontSize: 12, fontWeight: '700' },

  // Caption
  captionSection: { paddingHorizontal: 16, paddingTop: 14, gap: 6 },
  caption: { fontSize: 14, lineHeight: 20 },
  date: { fontSize: 12 },

  // Reel viewer
  reelContainer: { flex: 1 },
  reelOverlay: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 },
  reelBackBtn: {
    marginLeft: 16,
    marginTop: 8,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reelVideoWrapper: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  reelVideo: { width: SCREEN_WIDTH, height: SCREEN_HEIGHT },
  pausedOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  reelCaptionContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  reelCaption: { color: '#FFF', fontSize: 14, lineHeight: 20, textShadowColor: '#000', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },
});
