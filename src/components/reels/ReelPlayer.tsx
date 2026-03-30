import { togglePostLike } from '@/services/engagementService';
import { Ionicons } from '@expo/vector-icons';
import { VideoView, useVideoPlayer } from 'expo-video';
import React, { Component, useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Easing, GestureResponderEvent, Image, StyleSheet, View } from 'react-native';
import ReelActions from './ReelActions';
import ReelCaptionSheet from './ReelCaptionSheet';
import ReelInfo from './ReelInfo';
import ReelProgressBar from './ReelProgressBar';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

const DOUBLE_TAP_DELAY = 250;

const MIN_SCALE = 1;
const MAX_SCALE = 3;
const SCALE_ELASTIC = 0.15; // how far past limits user can stretch
const MOVE_THRESHOLD = 1; // ignore sub-pixel jitter
const ZOOM_PERSIST_THRESHOLD = 1.2;

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// ---- Gesture override (which gesture currently owns the player) ----
type GestureOverride = 'none' | 'centerHold' | 'rightHold' | 'leftHold' | 'scrubbing' | 'pinchZoom';

// ---- Media type detection ----
type MediaType = 'video' | 'image' | 'none';

const IMAGE_EXT = /\.(jpe?g|png|gif|webp|heic|heif|bmp|avif)(\?|$)/i;
const VIDEO_EXT = /\.(mp4|mov|avi|mkv|webm|m4v|3gp)(\?|$)/i;

function getMediaType(url?: string): MediaType {
  if (!url) return 'none';
  if (IMAGE_EXT.test(url)) return 'image';
  if (VIDEO_EXT.test(url)) return 'video';
  // Default to video for unknown extensions (most reel content will be video)
  return 'video';
}

// ---- Error boundary — catches native view crashes like EXVideo ----
interface ErrorBoundaryState { hasError: boolean }

class MediaErrorBoundary extends Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false };
  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }
  render() {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}

// ---- Placeholder for missing / failed media ----
const MediaPlaceholder = () => (
  <View style={[styles.videoContainer, styles.placeholder]}>
    <Ionicons name="image-outline" size={48} color="rgba(255,255,255,0.18)" />
  </View>
);

interface ReelPlayerProps {
  id: string;
  clinicId: string;
  clinicName?: string;
  caption?: string;
  likeCount?: number;
  initialIsLiked?: boolean;
  mediaUrl?: string;
  isActive: boolean;
  isNext?: boolean;
  autoScroll?: boolean;
  onHide: () => void;
  onLikeChange?: (reelId: string, liked: boolean, likeCount: number) => void;
  onVideoEnd?: (reelId: string) => void;
  onAutoScrollToggle?: () => void;
  onWatchStats?: (reelId: string, stats: { watchTime: number; skipped: boolean; fullyWatched: boolean }) => void;
}

const ReelPlayer = React.memo(({ id, clinicId, clinicName, caption, likeCount: initialLikeCount = 0, initialIsLiked = false, mediaUrl, isActive, isNext = false, autoScroll = false, onHide, onLikeChange, onVideoEnd, onAutoScrollToggle, onWatchStats }: ReelPlayerProps) => {

  // ---- Media state ----
  const mediaType = getMediaType(mediaUrl);
  const [mediaFailed, setMediaFailed] = useState(false);

  // ---- Playback state ----
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(true);

  // ---- Gesture ownership ----
  const gestureOverride = useRef<GestureOverride>('none');

  const isActiveRef = useRef(isActive);
  isActiveRef.current = isActive;
  const pausedRef = useRef(paused);
  pausedRef.current = paused;

  // ---- Watch intelligence (all refs — zero re-renders) ----
  const watchStartRef = useRef(0);
  const onWatchStatsRef = useRef(onWatchStats);
  onWatchStatsRef.current = onWatchStats;

  // ---- Video player (expo-video) ----
  const player = useVideoPlayer(mediaType === 'video' && mediaUrl ? mediaUrl : null, (p) => {
    p.loop = true;
    p.muted = true;
    p.timeUpdateEventInterval = 0.1;
  });

  // ---- Pinch-to-zoom state ----
  const pinchScale = useRef(new Animated.Value(1)).current;
  const pinchTranslateX = useRef(new Animated.Value(0)).current;
  const pinchTranslateY = useRef(new Animated.Value(0)).current;
  const baseScale = useRef(1);
  const initialDistance = useRef(0);
  const initialMidX = useRef(0);
  const initialMidY = useRef(0);
  const baseTranslateX = useRef(0);
  const baseTranslateY = useRef(0);
  const panStartX = useRef(0);
  const panStartY = useRef(0);
  const liveScale = useRef(1);
  const liveTranslateX = useRef(0);
  const liveTranslateY = useRef(0);
  const prevTouchCount = useRef(0);

  // ---- Left-hold rewind interval ----
  const rewindInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearRewindInterval = useCallback(() => {
    if (rewindInterval.current) {
      clearInterval(rewindInterval.current);
      rewindInterval.current = null;
    }
  }, []);

  // ---- Single playback reconciliation — the ONLY place that calls play/pause/rate ----
  const reconcilePlayback = useCallback(() => {
    if (!player || mediaType !== 'video') return;

    if (gestureOverride.current === 'rightHold') {
      player.playbackRate = 2;
      player.play();
    } else if (gestureOverride.current === 'leftHold') {
      player.pause();
    } else if (gestureOverride.current === 'pinchZoom') {
      player.playbackRate = 1;
      player.pause();
    } else if (gestureOverride.current !== 'none') {
      player.playbackRate = 1;
      player.pause();
    } else if (isActiveRef.current && !pausedRef.current) {
      player.playbackRate = 1;
      player.play();
    } else {
      player.playbackRate = 1;
      player.pause();
    }
  }, [player, mediaType]);

  // Re-reconcile whenever permanent state changes
  useEffect(() => {
    reconcilePlayback();
  }, [isActive, paused, reconcilePlayback]);

  // ---- Preload next reel (brief play+pause to prime the buffer) ----
  useEffect(() => {
    if (!player || mediaType !== 'video') return;
    if (isNext && !isActive) {
      player.play();
      // Allow a tiny buffer window then pause
      const t = setTimeout(() => player.pause(), 100);
      return () => clearTimeout(t);
    }
  }, [isNext, isActive, player, mediaType]);

  // ---- Mute sync ----
  useEffect(() => {
    if (!player) return;
    player.muted = muted;
  }, [muted, player]);

  // Reset paused + gesture state on active-state change
  useEffect(() => {
    if (isActive) {
      setPaused(false);
      pausedRef.current = false;
      // Start watch timer
      watchStartRef.current = Date.now();
    } else if (watchStartRef.current > 0) {
      // Flush watch stats when leaving this reel
      const elapsed = (Date.now() - watchStartRef.current) / 1000;
      const dur = player?.duration ?? 0;
      const skipped = elapsed < 2;
      const fullyWatched = dur > 0 && elapsed >= dur * 0.8;
      onWatchStatsRef.current?.(id, { watchTime: elapsed, skipped, fullyWatched });
      watchStartRef.current = 0;
    }
    gestureOverride.current = 'none';
    lastTap.current = 0;
    clearRewindInterval();
    initialDistance.current = 0;
    initialMidX.current = 0;
    initialMidY.current = 0;
    baseScale.current = 1;
    baseTranslateX.current = 0;
    baseTranslateY.current = 0;
    liveScale.current = 1;
    liveTranslateX.current = 0;
    liveTranslateY.current = 0;
    prevTouchCount.current = 0;
    pinchScale.setValue(1);
    pinchTranslateX.setValue(0);
    pinchTranslateY.setValue(0);
    reconcilePlayback();
  }, [isActive, reconcilePlayback, clearRewindInterval]);

  // ---- Progress tracking ----
  const progressAnim = useRef(new Animated.Value(0)).current;
  const [videoDuration, setVideoDuration] = useState(0);
  const [videoCurrentTime, setVideoCurrentTime] = useState(0);

  // ---- Video end detection (for auto-scroll) ----
  const videoEndFiredRef = useRef(false);
  const onVideoEndRef = useRef(onVideoEnd);
  onVideoEndRef.current = onVideoEnd;

  useEffect(() => {
    if (!player || mediaType !== 'video') return;
    const sub = player.addListener('timeUpdate', ({ currentTime }: { currentTime: number }) => {
      const dur = player.duration;
      if (dur > 0) {
        setVideoDuration((prev) => (prev !== dur ? dur : prev));
        setVideoCurrentTime(currentTime);
        if (gestureOverride.current !== 'scrubbing') {
          progressAnim.setValue(currentTime / dur);
        }
        // Detect video reaching end (within 0.3s of duration) — fire once per loop cycle
        if (currentTime >= dur - 0.3 && !videoEndFiredRef.current && isActiveRef.current) {
          videoEndFiredRef.current = true;
          onVideoEndRef.current?.(id);
        }
        // Reset the flag when video loops back near the start
        if (currentTime < 1 && videoEndFiredRef.current) {
          videoEndFiredRef.current = false;
        }
      }
    });
    return () => sub.remove();
  }, [player, mediaType, progressAnim, id]);

  // ---- Scrub handlers ----
  const handleScrubStart = useCallback(() => {
    gestureOverride.current = 'scrubbing';
    reconcilePlayback();
  }, [reconcilePlayback]);

  const handleScrubMove = useCallback(
    (pct: number) => {
      if (player && mediaType === 'video' && player.duration > 0) {
        player.currentTime = pct * player.duration;
      }
    },
    [player, mediaType],
  );

  const handleScrubEnd = useCallback(
    (pct: number) => {
      if (player && mediaType === 'video' && player.duration > 0) {
        player.currentTime = pct * player.duration;
      }
      gestureOverride.current = 'none';
      reconcilePlayback();
    },
    [player, mediaType, reconcilePlayback],
  );

  // ---- Pause overlay icon ----
  const pauseIconOpacity = useRef(new Animated.Value(0)).current;

  // ---- Like state (owned here so double-tap + heart button share it) ----
  const [liked, setLiked] = useState(initialIsLiked);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const likedRef = useRef(initialIsLiked);
  const pendingLikeRef = useRef(false);
  const onLikeChangeRef = useRef(onLikeChange);
  onLikeChangeRef.current = onLikeChange;
  const [menuOpen, setMenuOpen] = useState(false);
  const [captionOpen, setCaptionOpen] = useState(false);

  const handleLike = useCallback(async () => {
    if (pendingLikeRef.current) return;
    const wasLiked = likedRef.current;
    const nextLiked = !wasLiked;
    likedRef.current = nextLiked;
    setLiked(nextLiked);
    setLikeCount((c) => {
      const next = wasLiked ? Math.max(0, c - 1) : c + 1;
      onLikeChangeRef.current?.(id, nextLiked, next);
      return next;
    });
    pendingLikeRef.current = true;
    try {
      const result = await togglePostLike(clinicId, id, initialLikeCount);
      // Only sync liked status from backend; keep optimistic likeCount
      // (backend count is unreliable for mock data — media docs don't exist)
      likedRef.current = result.isLiked;
      setLiked(result.isLiked);
    } catch {
      likedRef.current = wasLiked;
      setLiked(wasLiked);
      setLikeCount((c) => {
        const reverted = wasLiked ? c + 1 : Math.max(0, c - 1);
        onLikeChangeRef.current?.(id, wasLiked, reverted);
        return reverted;
      });
    } finally {
      pendingLikeRef.current = false;
    }
  }, [clinicId, id, initialLikeCount]);

  // ---- Tap detection (double-tap like + hold-to-pause) ----
  const lastTap = useRef(0);

  // ---- Big heart overlay ----
  const bigHeartScale = useRef(new Animated.Value(0)).current;
  const bigHeartOpacity = useRef(new Animated.Value(0)).current;

  const showBigHeart = useCallback(() => {
    bigHeartScale.setValue(0.5);
    bigHeartOpacity.setValue(1);
    Animated.parallel([
      Animated.spring(bigHeartScale, {
        toValue: 1,
        friction: 4,
        tension: 150,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.delay(400),
        Animated.timing(bigHeartOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      bigHeartScale.setValue(0);
    });
  }, [bigHeartScale, bigHeartOpacity]);

  // ---- Zone hold gestures: center=pause, right=2x, left=rewind, 2-finger=pinch ----
  const handleTouchStart = useCallback((e: GestureResponderEvent) => {
    const touches = e.nativeEvent.touches;
    const touchCount = touches ? touches.length : 1;
    prevTouchCount.current = touchCount;

    // 2+ fingers → pinch zoom (highest priority, overrides any active hold)
    if (touchCount >= 2) {
      if (gestureOverride.current === 'leftHold') clearRewindInterval();
      // If transitioning from one-finger pan, commit current translate
      if (gestureOverride.current === 'pinchZoom') {
        baseTranslateX.current = liveTranslateX.current;
        baseTranslateY.current = liveTranslateY.current;
        baseScale.current = liveScale.current;
      }
      initialDistance.current = 0;
      initialMidX.current = 0;
      initialMidY.current = 0;
      gestureOverride.current = 'pinchZoom';
      reconcilePlayback();
      return;
    }

    // Single finger — only claim if no gesture is active
    if (gestureOverride.current !== 'none') return;

    // Single finger while zoomed → one-finger pan mode
    if (baseScale.current > 1.05) {
      panStartX.current = e.nativeEvent.pageX;
      panStartY.current = e.nativeEvent.pageY;
      gestureOverride.current = 'pinchZoom';
      reconcilePlayback();
      return;
    }

    const ratio = e.nativeEvent.locationX / SCREEN_WIDTH;

    if (ratio >= 0.3 && ratio <= 0.7) {
      gestureOverride.current = 'centerHold';
      reconcilePlayback();
    } else if (ratio > 0.7) {
      gestureOverride.current = 'rightHold';
      reconcilePlayback();
    } else {
      // Left zone: rewind via interval
      gestureOverride.current = 'leftHold';
      reconcilePlayback();
      clearRewindInterval();
      rewindInterval.current = setInterval(() => {
        if (player && player.duration > 0) {
          player.currentTime = Math.max(0, player.currentTime - 1);
        }
      }, 200);
    }
  }, [reconcilePlayback, clearRewindInterval, player]);

  const handleTouchMove = useCallback((e: GestureResponderEvent) => {
    if (gestureOverride.current !== 'pinchZoom') return;
    const touches = e.nativeEvent.touches;
    const touchCount = touches ? touches.length : 1;

    // Detect 2→1 finger transition (pinch → pan seamlessly)
    if (touchCount < 2 && prevTouchCount.current >= 2) {
      // Commit current live state as new base so there's no jump
      baseScale.current = liveScale.current;
      baseTranslateX.current = liveTranslateX.current;
      baseTranslateY.current = liveTranslateY.current;
      initialDistance.current = 0;
      initialMidX.current = 0;
      initialMidY.current = 0;
      panStartX.current = e.nativeEvent.pageX;
      panStartY.current = e.nativeEvent.pageY;
    }
    prevTouchCount.current = touchCount;

    // One-finger pan while zoomed
    if (touchCount < 2) {
      if (liveScale.current > 1.05) {
        const deltaX = e.nativeEvent.pageX - panStartX.current;
        const deltaY = e.nativeEvent.pageY - panStartY.current;
        if (Math.abs(deltaX) < MOVE_THRESHOLD && Math.abs(deltaY) < MOVE_THRESHOLD) return;
        const scale = liveScale.current;
        const maxX = (SCREEN_WIDTH * scale - SCREEN_WIDTH) / 2;
        const maxY = (SCREEN_HEIGHT * scale - SCREEN_HEIGHT) / 2;
        const nextX = Math.min(maxX, Math.max(-maxX, baseTranslateX.current + deltaX));
        const nextY = Math.min(maxY, Math.max(-maxY, baseTranslateY.current + deltaY));
        liveTranslateX.current = nextX;
        liveTranslateY.current = nextY;
        pinchTranslateX.setValue(nextX);
        pinchTranslateY.setValue(nextY);
      }
      return;
    }

    // Two-finger pinch zoom
    const dx = touches![0].pageX - touches![1].pageX;
    const dy = touches![0].pageY - touches![1].pageY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    const midX = (touches![0].pageX + touches![1].pageX) / 2;
    const midY = (touches![0].pageY + touches![1].pageY) / 2;

    if (initialDistance.current === 0) {
      initialDistance.current = distance;
      initialMidX.current = midX;
      initialMidY.current = midY;
      return;
    }

    const factor = distance / initialDistance.current;
    const raw = baseScale.current * factor;
    const newScale = Math.min(MAX_SCALE + SCALE_ELASTIC, Math.max(MIN_SCALE - SCALE_ELASTIC, raw));
    pinchScale.setValue(newScale);
    liveScale.current = newScale;

    // Focal-point offset: accounts for existing pan position
    const scaleFactor = newScale / baseScale.current;
    const focalX = initialMidX.current - SCREEN_WIDTH / 2;
    const focalY = initialMidY.current - SCREEN_HEIGHT / 2;
    const newTranslateX = focalX * (1 - scaleFactor) + baseTranslateX.current * scaleFactor;
    const newTranslateY = focalY * (1 - scaleFactor) + baseTranslateY.current * scaleFactor;
    liveTranslateX.current = newTranslateX;
    liveTranslateY.current = newTranslateY;
    pinchTranslateX.setValue(newTranslateX);
    pinchTranslateY.setValue(newTranslateY);
  }, [pinchScale, pinchTranslateX, pinchTranslateY]);

  const handleTouchEnd = useCallback((e: GestureResponderEvent) => {
    const prev = gestureOverride.current;
    if (prev === 'none') return;

    if (prev === 'leftHold') clearRewindInterval();

    if (prev === 'pinchZoom') {
      // Check if fingers remain — if so, transition to pan instead of releasing
      const remaining = e.nativeEvent.touches ? e.nativeEvent.touches.length : 0;
      if (remaining >= 1) {
        // Commit current live values as base for seamless transition
        baseScale.current = liveScale.current;
        baseTranslateX.current = liveTranslateX.current;
        baseTranslateY.current = liveTranslateY.current;
        initialDistance.current = 0;
        initialMidX.current = 0;
        initialMidY.current = 0;
        if (remaining === 1) {
          // Transition to one-finger pan
          const touch = e.nativeEvent.touches![0];
          panStartX.current = touch.pageX;
          panStartY.current = touch.pageY;
        }
        prevTouchCount.current = remaining;
        return; // Stay in pinchZoom mode
      }

      // All fingers lifted — resolve final state
      initialDistance.current = 0;
      initialMidX.current = 0;
      initialMidY.current = 0;
      prevTouchCount.current = 0;
      const finalScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, liveScale.current));
      const resetEasing = Easing.out(Easing.cubic);

      if (finalScale >= ZOOM_PERSIST_THRESHOLD) {
        // Persist zoomed state + panned position
        baseScale.current = finalScale;
        const maxX = (SCREEN_WIDTH * finalScale - SCREEN_WIDTH) / 2;
        const maxY = (SCREEN_HEIGHT * finalScale - SCREEN_HEIGHT) / 2;
        const clampedX = Math.min(maxX, Math.max(-maxX, liveTranslateX.current));
        const clampedY = Math.min(maxY, Math.max(-maxY, liveTranslateY.current));
        baseTranslateX.current = clampedX;
        baseTranslateY.current = clampedY;
        liveScale.current = finalScale;
        liveTranslateX.current = clampedX;
        liveTranslateY.current = clampedY;
        Animated.parallel([
          Animated.timing(pinchScale, { toValue: finalScale, duration: 250, easing: resetEasing, useNativeDriver: true }),
          Animated.timing(pinchTranslateX, { toValue: clampedX, duration: 250, easing: resetEasing, useNativeDriver: true }),
          Animated.timing(pinchTranslateY, { toValue: clampedY, duration: 250, easing: resetEasing, useNativeDriver: true }),
        ]).start();
      } else {
        // Return to natural scale
        baseScale.current = 1;
        baseTranslateX.current = 0;
        baseTranslateY.current = 0;
        liveScale.current = 1;
        liveTranslateX.current = 0;
        liveTranslateY.current = 0;
        Animated.parallel([
          Animated.timing(pinchScale, { toValue: 1, duration: 250, easing: resetEasing, useNativeDriver: true }),
          Animated.timing(pinchTranslateX, { toValue: 0, duration: 250, easing: resetEasing, useNativeDriver: true }),
          Animated.timing(pinchTranslateY, { toValue: 0, duration: 250, easing: resetEasing, useNativeDriver: true }),
        ]).start();
      }
      gestureOverride.current = 'none';
      reconcilePlayback();
      return;
    }

    gestureOverride.current = 'none';
    reconcilePlayback();

    // Double-tap like detection (center zone only)
    if (prev === 'centerHold') {
      const now = Date.now();
      if (now - lastTap.current < DOUBLE_TAP_DELAY) {
        lastTap.current = 0;
        const willLike = !likedRef.current;
        handleLike();
        if (willLike) showBigHeart();
      } else {
        lastTap.current = now;
      }
    }
  }, [reconcilePlayback, clearRewindInterval, handleLike, showBigHeart]);

  const handleTouchCancel = useCallback(() => {
    if (gestureOverride.current === 'none') return;
    clearRewindInterval();
    if (gestureOverride.current === 'pinchZoom') {
      initialDistance.current = 0;
      initialMidX.current = 0;
      initialMidY.current = 0;
      baseScale.current = 1;
      baseTranslateX.current = 0;
      baseTranslateY.current = 0;
      liveScale.current = 1;
      liveTranslateX.current = 0;
      liveTranslateY.current = 0;
      prevTouchCount.current = 0;
      pinchScale.setValue(1);
      pinchTranslateX.setValue(0);
      pinchTranslateY.setValue(0);
    }
    gestureOverride.current = 'none';
    reconcilePlayback();
  }, [reconcilePlayback, clearRewindInterval, pinchScale, pinchTranslateX, pinchTranslateY]);

  return (
    <View style={styles.container}>
      {/* Media layer — video, image, or placeholder */}
      {mediaFailed || mediaType === 'none' ? (
        <MediaPlaceholder />
      ) : mediaType === 'image' ? (
        <View style={styles.videoContainer}>
          <Image
            source={{ uri: mediaUrl! }}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
            onError={() => setMediaFailed(true)}
          />
        </View>
      ) : (
        <MediaErrorBoundary fallback={<MediaPlaceholder />}>
          <Animated.View style={[
            styles.videoContainer,
            {
              overflow: 'hidden',
              transform: [
                { translateX: pinchTranslateX },
                { translateY: pinchTranslateY },
                { scale: pinchScale },
              ],
              opacity: pinchScale.interpolate({
                inputRange: [1, 2, 3],
                outputRange: [1, 0.95, 0.9],
                extrapolate: 'clamp',
              }),
            },
          ]}>
            <VideoView
              player={player}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              nativeControls={false}
              allowsFullscreen={false}
            />
          </Animated.View>
        </MediaErrorBoundary>
      )}

      {/* Tap overlay — covers video surface ABOVE progress bar zone */}
      <View
        style={[styles.tapOverlay, { bottom: 74 + 4 + 4 }]}
        pointerEvents="box-only"
        onStartShouldSetResponder={() => baseScale.current > 1.05}
        onMoveShouldSetResponder={() => baseScale.current > 1.05}
        onResponderTerminationRequest={() => baseScale.current <= 1.05}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchCancel}
      />

      {/* Big heart overlay (double-tap feedback) */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.bigHeartWrap,
          {
            opacity: bigHeartOpacity,
            transform: [{ scale: bigHeartScale }],
          },
        ]}
      >
        <Ionicons name="heart" size={100} color="#FF3040" />
      </Animated.View>

      {/* Pause / Play overlay icon */}
      <Animated.View
        pointerEvents="none"
        style={[styles.pauseIconWrap, { opacity: pauseIconOpacity }]}
      >
        <View style={styles.pauseIconBg}>
          <Ionicons name={paused ? 'pause' : 'play'} size={40} color="#fff" />
        </View>
      </Animated.View>

      {/* Overlay layer */}
      <View style={styles.overlay} pointerEvents="box-none">
        <ReelActions
          reelId={id}
          clinicId={clinicId}
          liked={liked}
          likeCount={likeCount}
          menuOpen={menuOpen}
          muted={muted}
          onLike={handleLike}
          onMenuOpen={() => setMenuOpen(true)}
          onMenuClose={() => setMenuOpen(false)}
          onMuteToggle={() => setMuted((m) => !m)}
          onHide={onHide}
          autoScroll={autoScroll}
          onAutoScrollToggle={onAutoScrollToggle}
        />
        <ReelInfo
          clinicName={clinicName}
          caption={caption}
          isActive={isActive}
          onCaptionPress={() => setCaptionOpen(true)}
          style={{ bottom: 100 }}
        />
        <ReelCaptionSheet
          visible={captionOpen}
          clinicName={clinicName}
          caption={caption}
          timestamp={`${formatTime(videoCurrentTime)} / ${formatTime(videoDuration)}`}
          onClose={() => setCaptionOpen(false)}
        />
      </View>

      {/* Progress bar */}
      <ReelProgressBar
        progress={progressAnim}
        duration={videoDuration}
        onScrubStart={handleScrubStart}
        onScrubMove={handleScrubMove}
        onScrubEnd={handleScrubEnd}
        style={{ bottom: 74 + 4 }}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: SCREEN_HEIGHT,
  },
  videoContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#111',
    zIndex: 1,
  },
  placeholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  bigHeartWrap: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
  },
  tapOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 2,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 3,
  },
  pauseIconWrap: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 4,
  },
  pauseIconBg: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ReelPlayer;
