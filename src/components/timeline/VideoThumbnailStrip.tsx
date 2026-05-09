import { Image as ExpoImage } from 'expo-image';
import * as VideoThumbnails from 'expo-video-thumbnails';
import { memo, useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withTiming,
} from 'react-native-reanimated';

/**
 * Phase 18.a Step 3 — VideoThumbnailStrip
 *
 * Renders a horizontal filmstrip of video frame thumbnails inside a
 * timeline segment, similar to CapCut/TikTok with premium polish.
 *
 * Architecture:
 * - Module-level cache (thumbnailCache) — survives editor re-mounts
 * - React.memo — prevents 30Hz re-renders during playback
 * - Promise.all parallel generation
 * - Step 3.3 polish:
 *   - Individual fade-in per thumbnail (250ms ease-out)
 *   - Shimmer loading effect on placeholders
 *   - Active segment yellow tint overlay
 */

const THUMB_SIZE = 60;
// Pixel-grid-aligned extraction interval. Invariant:
// THUMB_SECONDS === THUMB_SIZE / PIXELS_PER_SECOND (60 / 40 = 1.5).
// If PIXELS_PER_SECOND in app/reels-edit.tsx changes, update this.
const THUMB_SECONDS = 1.5;
const QUALITY = 0.7;
const FADE_DURATION = 250;
const SHIMMER_DURATION = 1200;

const thumbnailCache = new Map<string, (string | null)[]>();

interface Props {
  uri: string;
  segmentPx: number;
  duration: number;
  isActive?: boolean;
}

// ============================================================
// AnimatedThumb — single thumbnail with fade-in on mount
// ============================================================
interface AnimatedThumbProps {
  uri: string;
  width: number;
}
const AnimatedThumb = memo<AnimatedThumbProps>(({ uri, width }) => {
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withTiming(1, {
      duration: FADE_DURATION,
      easing: Easing.out(Easing.ease),
    });
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[{ width, height: THUMB_SIZE }, animatedStyle]}>
      <ExpoImage
        source={{ uri }}
        style={{ width: '100%', height: '100%' }}
        contentFit="cover"
        cachePolicy="memory-disk"
      />
    </Animated.View>
  );
});
AnimatedThumb.displayName = 'AnimatedThumb';

// ============================================================
// ShimmerPlaceholder — pulsing gray block while loading
// ============================================================
interface ShimmerPlaceholderProps {
  width: number;
}
const ShimmerPlaceholder = memo<ShimmerPlaceholderProps>(({ width }) => {
  const opacity = useSharedValue(0.5);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.85, { duration: SHIMMER_DURATION / 2, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.5, { duration: SHIMMER_DURATION / 2, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        { width, height: THUMB_SIZE, backgroundColor: '#3a3a3a' },
        animatedStyle,
      ]}
    />
  );
});
ShimmerPlaceholder.displayName = 'ShimmerPlaceholder';

// ============================================================
// Main component
// ============================================================
const VideoThumbnailStrip = memo<Props>(({ uri, segmentPx, duration, isActive }) => {
  const numThumbs = Math.max(1, Math.ceil(segmentPx / THUMB_SIZE));
  const cacheKey = `${uri}::${numThumbs}::v2`;

  const [thumbUris, setThumbUris] = useState<(string | null)[]>(() => {
    return thumbnailCache.get(cacheKey) ?? Array(numThumbs).fill(null);
  });

  const isCancelledRef = useRef(false);

  useEffect(() => {
    isCancelledRef.current = false;

    if (thumbnailCache.has(cacheKey)) {
      const cached = thumbnailCache.get(cacheKey)!;
      setThumbUris(cached);
      return;
    }

    const generateThumbnails = async () => {
      const interval = THUMB_SECONDS;
      const maxTimeMs = Math.max(0, (duration - 0.1) * 1000);

      const promises = Array.from({ length: numThumbs }, (_, i) => {
        const timeMs = Math.min(Math.round(i * interval * 1000), maxTimeMs);
        return VideoThumbnails.getThumbnailAsync(uri, {
          time: timeMs,
          quality: QUALITY,
        })
          .then((result) => result.uri)
          .catch((err) => {
            console.warn(`[VideoThumbnailStrip] Failed thumb ${i} for ${uri}:`, err);
            return null;
          });
      });

      try {
        const results = await Promise.all(promises);
        if (isCancelledRef.current) return;
        thumbnailCache.set(cacheKey, results);
        setThumbUris(results);
      } catch (err) {
        if (!isCancelledRef.current) {
          console.error(`[VideoThumbnailStrip] Generation failed for ${uri}:`, err);
        }
      }
    };

    generateThumbnails();

    return () => {
      isCancelledRef.current = true;
    };
  }, [uri, numThumbs, duration, cacheKey]);

  return (
    <View style={styles.container}>
      {thumbUris.map((thumbUri, i) => {
        const isLast = i === numThumbs - 1;
        const thumbWidth = isLast
          ? Math.max(THUMB_SIZE, segmentPx - i * THUMB_SIZE)
          : THUMB_SIZE;

        if (thumbUri) {
          return <AnimatedThumb key={`${cacheKey}-${i}`} uri={thumbUri} width={thumbWidth} />;
        }
        return <ShimmerPlaceholder key={`${cacheKey}-${i}`} width={thumbWidth} />;
      })}

      {/* Active segment yellow tint overlay */}
      {isActive && <View style={styles.activeOverlay} pointerEvents="none" />}
    </View>
  );
});

VideoThumbnailStrip.displayName = 'VideoThumbnailStrip';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: THUMB_SIZE,
    position: 'relative',
  },
  activeOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 193, 7, 0.12)',
  },
});

export default VideoThumbnailStrip;
