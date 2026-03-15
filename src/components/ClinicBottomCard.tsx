import { useTheme } from '@/src/context/ThemeContext';
import { useClinicDistance } from '@/src/hooks/useClinicDistance';
import { PublicClinic } from '@/src/services/publicClinics';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    Animated,
    Dimensions,
    FlatList,
    Image,
    ListRenderItemInfo,
    PanResponder,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

// ─── Types ───
type Props = {
  clinic: PublicClinic | null;
  userLocation: { lat: number; lng: number } | null;
  isDark: boolean;
  onOpen: (clinic: PublicClinic) => void;
  onClose: () => void;
};

// ─── Snap-point constants ───
const { height: SCREEN_H, width: SCREEN_W } = Dimensions.get('window');
const SNAP_HIDDEN = SCREEN_H;             // fully off-screen
const SNAP_HALF   = SCREEN_H * 0.45;      // peek / half-sheet
const SNAP_FULL   = SCREEN_H * 0.15;      // expanded full sheet

/** Velocity threshold (px/ms) — fast flick snaps to next detent */
const VELOCITY_THRESHOLD = 0.4;
/** Distance threshold — if dragged > 40 % between two detents, snap there */
const DISTANCE_RATIO = 0.4;

// ─── Carousel constants ───
const CAROUSEL_IMG_W = SCREEN_W - 32;     // 16px margin each side
const CAROUSEL_IMG_H = 200;
const MAX_CAROUSEL_IMAGES = 5;

// ─── Memoised carousel image item (avoids re-render per image) ───
const CarouselImage = React.memo(
  ({ uri, isDark }: { uri: string | null; isDark: boolean }) =>
    uri ? (
      <View style={carouselStyles.imageWrap}>
        <Image
          source={{ uri }}
          style={carouselStyles.image}
          resizeMode="cover"
        />
        {/* Subtle bottom gradient overlay */}
        <View style={carouselStyles.imageOverlay} />
      </View>
    ) : (
      <View
        style={[
          carouselStyles.placeholder,
          { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)' },
        ]}
      >
        <Ionicons name="business-outline" size={40} color={isDark ? '#5A6A7C' : '#9AAABB'} />
      </View>
    ),
);

/**
 * Expandable draggable bottom sheet — Airbnb-style.
 *
 * Three snap points: HIDDEN → HALF → FULL.
 * PanResponder on the drag handle drives translateY with spring physics.
 * Backdrop fades in/out synced to translateY via interpolation.
 * Stays mounted; pointerEvents toggled for zero parent re-renders.
 */
function ClinicBottomCard({ clinic, userLocation, isDark, onOpen, onClose }: Props) {
  // ─── Animated values ───
  const translateY = useRef(new Animated.Value(SNAP_HIDDEN)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  /** Subtle image zoom on sheet open */
  const imageScale = useRef(new Animated.Value(1)).current;

  /** Current snap detent — tracked imperatively to avoid state-driven re-renders */
  const currentSnap = useRef(SNAP_HIDDEN);

  // ─── Carousel page indicator ───
  const [carouselIndex, setCarouselIndex] = useState(0);

  // ─── Build carousel data (max 5, always at least 1 placeholder) ───
  const carouselData = useMemo(() => {
    if (!clinic) return [{ key: 'empty', uri: null }];
    // Currently PublicClinic only has heroImage — future-proof for images[]
    const images: { key: string; uri: string | null }[] = [];
    if (clinic.heroImage) images.push({ key: 'hero', uri: clinic.heroImage });
    if (images.length === 0) images.push({ key: 'placeholder', uri: null });
    return images.slice(0, MAX_CAROUSEL_IMAGES);
  }, [clinic]);

  // ─── Spring helper ───
  const springTo = useCallback(
    (toValue: number, cb?: () => void) => {
      currentSnap.current = toValue;
      // Backdrop opacity maps: HIDDEN→0, HALF→0.15, FULL→0.3
      const opacity = toValue >= SNAP_HIDDEN ? 0 : toValue <= SNAP_FULL ? 0.3 : 0.15;

      // Haptic feedback on snap (fires once per snap, not during drag)
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});

      Animated.parallel([
        Animated.spring(translateY, {
          toValue,
          useNativeDriver: true,
          friction: 8,
          tension: 70,
        }),
        Animated.timing(backdropOpacity, {
          toValue: opacity,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start(cb ? () => cb() : undefined);
    },
    [translateY, backdropOpacity],
  );

  // ─── Animate sheet on clinic change ───
  useEffect(() => {
    if (clinic) {
      setCarouselIndex(0);
      // Subtle image zoom: 1 → 1.03
      imageScale.setValue(1);
      Animated.timing(imageScale, {
        toValue: 1.03,
        duration: 600,
        useNativeDriver: true,
      }).start();
      springTo(SNAP_HALF);
    } else {
      imageScale.setValue(1);
      springTo(SNAP_HIDDEN);
    }
  }, [clinic, springTo, imageScale]);

  // ─── PanResponder (drag handle only) ───
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 5,
      onPanResponderGrant: () => {
        // Flatten current animated value into offset for smooth drag start
        translateY.extractOffset();
      },
      onPanResponderMove: Animated.event(
        [null, { dy: translateY }],
        { useNativeDriver: false }, // offset + event combo needs JS driver
      ),
      onPanResponderRelease: (_, g) => {
        // Merge offset back so translateY is absolute again
        translateY.flattenOffset();

        const vy = g.vy; // px/ms velocity (positive = downward)
        const snapPrev = currentSnap.current;
        let target = snapPrev;

        if (Math.abs(vy) > VELOCITY_THRESHOLD) {
          // Fast flick — snap in direction of velocity
          if (vy < 0) {
            // Upward flick
            target = snapPrev <= SNAP_HALF ? SNAP_FULL : SNAP_HALF;
          } else {
            // Downward flick
            if (snapPrev <= SNAP_FULL) target = SNAP_HALF;
            else target = SNAP_HIDDEN;
          }
        } else {
          // Slow drag — use distance threshold
          const moved = g.dy;
          const halfDist = Math.abs(SNAP_HALF - SNAP_FULL);
          if (snapPrev <= SNAP_FULL) {
            // Currently full
            if (moved > halfDist * DISTANCE_RATIO) target = SNAP_HALF;
          } else if (snapPrev >= SNAP_HIDDEN) {
            // Shouldn't happen (hidden state), but safety
            target = SNAP_HIDDEN;
          } else {
            // Currently half
            if (moved < -halfDist * DISTANCE_RATIO) target = SNAP_FULL;
            else if (moved > halfDist * DISTANCE_RATIO) target = SNAP_HIDDEN;
          }
        }

        // Clamp
        if (target < SNAP_FULL) target = SNAP_FULL;
        if (target > SNAP_HIDDEN) target = SNAP_HIDDEN;

        if (target >= SNAP_HIDDEN) {
          springTo(SNAP_HIDDEN, onClose);
        } else {
          springTo(target);
        }
      },
    }),
  ).current;

  // ─── Close handler (close button) ───
  const handleClose = useCallback(() => {
    springTo(SNAP_HIDDEN, onClose);
  }, [springTo, onClose]);

  // ─── Backdrop press — dismiss ───
  const handleBackdropPress = useCallback(() => {
    springTo(SNAP_HIDDEN, onClose);
  }, [springTo, onClose]);

  // ─── Distance (Haversine → Google Directions upgrade) ───
  const { distanceText } = useClinicDistance(userLocation, clinic?.geo ?? null);

  // ─── Carousel page tracking ───
  const handleCarouselScroll = useCallback(
    (e: { nativeEvent: { contentOffset: { x: number } } }) => {
      const idx = Math.round(e.nativeEvent.contentOffset.x / CAROUSEL_IMG_W);
      setCarouselIndex(idx);
    },
    [],
  );

  const renderCarouselItem = useCallback(
    (info: ListRenderItemInfo<{ key: string; uri: string | null }>) => (
      <Animated.View style={{ transform: [{ scale: imageScale }] }}>
        <CarouselImage uri={info.item.uri} isDark={isDark} />
      </Animated.View>
    ),
    [isDark, imageScale],
  );

  const carouselKeyExtractor = useCallback(
    (item: { key: string }) => item.key,
    [],
  );

  // ─── Theme ───
  const { colors } = useTheme();
  const bg = colors.premiumSheet;
  const textPrimary = isDark ? '#E8EDF2' : '#1A2A3A';
  const textSecondary = isDark ? 'rgba(122,138,156,0.85)' : 'rgba(106,122,140,0.85)';
  const textTertiary = isDark ? 'rgba(122,138,156,0.65)' : 'rgba(106,122,140,0.65)';
  const badgeBg = isDark ? 'rgba(61,158,255,0.10)' : 'rgba(61,158,255,0.06)';

  const isVisible = !!clinic;

  return (
    <>
      {/* ─── Backdrop ─── */}
      <Animated.View
        style={[
          styles.backdrop,
          { opacity: backdropOpacity },
        ]}
        pointerEvents={isVisible ? 'auto' : 'none'}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={handleBackdropPress} />
      </Animated.View>

      {/* ─── Sheet ─── */}
      <Animated.View
        style={[
          styles.sheet,
          {
            backgroundColor: bg,
            transform: [{ translateY }],
            height: SCREEN_H,
          },
        ]}
        pointerEvents={isVisible ? 'auto' : 'none'}
      >
        {/* Top affordance indicator */}
        <View style={[styles.topIndicator, { backgroundColor: `${colors.primary}22` }]} />

        {/* Drag handle area (PanResponder target) */}
        <View {...panResponder.panHandlers} style={styles.handleZone}>
          <View style={[styles.handle, { backgroundColor: isDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.12)' }]} />
        </View>

        {/* Close button */}
        <TouchableOpacity
          style={[styles.closeBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }]}
          onPress={handleClose}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          activeOpacity={0.7}
        >
          <Ionicons name="close" size={18} color={textSecondary} />
        </TouchableOpacity>

        {/* Image carousel */}
        <FlatList
          data={carouselData}
          renderItem={renderCarouselItem}
          keyExtractor={carouselKeyExtractor}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          bounces={false}
          onMomentumScrollEnd={handleCarouselScroll}
          style={carouselStyles.list}
          getItemLayout={(_, index) => ({
            length: CAROUSEL_IMG_W,
            offset: CAROUSEL_IMG_W * index,
            index,
          })}
        />

        {/* Page dots */}
        {carouselData.length > 1 && (
          <View style={carouselStyles.dots}>
            {carouselData.map((item, i) => (
              <View
                key={item.key}
                style={[
                  carouselStyles.dot,
                  {
                    backgroundColor: i === carouselIndex ? '#3D9EFF' : isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)',
                  },
                ]}
              />
            ))}
          </View>
        )}

        {/* Content — entire area tappable for navigation */}
        <Pressable
          style={({ pressed }) => [styles.content, { opacity: pressed ? 0.85 : 1 }]}
          onPress={() => clinic && onOpen(clinic)}
        >
          {/* Clinic name */}
          <Text style={[styles.name, { color: textPrimary }]} numberOfLines={2}>
            {clinic?.name ?? ''}
          </Text>

          {/* Location */}
          {(clinic?.city || clinic?.country) && (
            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={14} color={textSecondary} />
              <Text style={[styles.infoText, { color: textSecondary, opacity: 0.7 }]} numberOfLines={1}>
                {[clinic.city, clinic.country].filter(Boolean).join(', ')}
              </Text>
            </View>
          )}

          {/* Phone */}
          {clinic?.phone && (
            <View style={styles.infoRow}>
              <Ionicons name="call-outline" size={13} color={textTertiary} />
              <Text style={[styles.infoText, { color: textTertiary }]} numberOfLines={1}>
                {clinic.phone}
              </Text>
            </View>
          )}

          {/* Rating */}
          {clinic?.averageRating != null && (
            <View style={styles.infoRow}>
              <Ionicons name="star" size={13} color="#F5A623" />
              <Text style={[styles.infoText, { color: textSecondary }]}>
                {clinic.averageRating.toFixed(1)}
                {clinic.totalReviews ? ` (${clinic.totalReviews})` : ''}
              </Text>
            </View>
          )}

          {/* Badges row */}
          <View style={styles.badgeRow}>
            {clinic?.specialty && (
              <View style={[styles.badge, { backgroundColor: badgeBg }]}>
                <Text style={styles.badgeText}>
                  {clinic.specialty.charAt(0).toUpperCase() + clinic.specialty.slice(1)}
                </Text>
              </View>
            )}
            {distanceText !== null && (
              <View style={[styles.badge, { backgroundColor: badgeBg }]}>
                <Ionicons name="navigate" size={11} color="#3D9EFF" />
                <Text style={styles.badgeText}>{distanceText}</Text>
              </View>
            )}
            {clinic?.tier === 'pro' && (
              <View style={[styles.badge, { backgroundColor: 'rgba(245,166,35,0.12)' }]}>
                <Ionicons name="diamond" size={11} color="#F5A623" />
                <Text style={[styles.badgeText, { color: '#F5A623' }]}>PRO</Text>
              </View>
            )}
          </View>

          {/* CTA — View Profile (styled View, not nested Pressable) */}
          <View
            style={[
              styles.ctaBtn,
              Platform.OS === 'ios' && {
                shadowColor: colors.primary,
                shadowOpacity: 0.30,
                shadowRadius: 14,
                shadowOffset: { width: 0, height: 8 },
              },
              { transform: [{ translateY: -1 }] },
            ]}
          >
            <Text style={styles.ctaText}>View Profile</Text>
            <Ionicons name="arrow-forward" size={15} color="#fff" />
          </View>
        </Pressable>
      </Animated.View>
    </>
  );
}

export default React.memo(ClinicBottomCard);

// ─── Sheet styles ───
const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 37, 64, 0.14)',
    zIndex: 40,
  },
  sheet: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    overflow: 'hidden',
    zIndex: 50,
    ...Platform.select({
      ios: {
        shadowColor: '#0A2540',
        shadowOffset: { width: 0, height: -10 },
        shadowOpacity: 0.14,
        shadowRadius: 28,
      },
      android: { elevation: 24 },
    }),
  },
  handleZone: {
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 4,
  },
  topIndicator: {
    height: 4,
    width: 40,
    borderRadius: 2,
    alignSelf: 'center' as const,
    marginTop: 8,
    marginBottom: 12,
  },
  handle: {
    width: 40,
    height: 5,
    borderRadius: 2.5,
  },
  closeBtn: {
    position: 'absolute',
    top: 14,
    right: 16,
    zIndex: 5,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 28,
    gap: 8,
  },
  name: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoText: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#3D9EFF',
    letterSpacing: 0.2,
  },
  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#3D9EFF',
    paddingVertical: 14,
    borderRadius: 18,
    marginTop: 8,
  },
  ctaText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.3,
  },
});

// ─── Carousel styles ───
const carouselStyles = StyleSheet.create({
  list: {
    flexGrow: 0,
    marginHorizontal: 16,
    overflow: 'hidden',
    borderRadius: 16,
  },
  imageWrap: {
    width: CAROUSEL_IMG_W,
    height: CAROUSEL_IMG_H,
    borderRadius: 16,
    overflow: 'hidden',
  },
  image: {
    width: CAROUSEL_IMG_W,
    height: CAROUSEL_IMG_H,
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  placeholder: {
    width: CAROUSEL_IMG_W,
    height: CAROUSEL_IMG_H,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
