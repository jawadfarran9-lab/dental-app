import { useStorySettings } from '@/src/context/StorySettingsContext';
import FaceDetectionService from '@/src/services/FaceDetectionService';
import { Ionicons } from '@expo/vector-icons';
import { ResizeMode, Video } from 'expo-av';
import { CameraView, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { Paths, File as FSFile } from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Dimensions, FlatList, Modal, PanResponder, Platform, Pressable, StatusBar, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { cancelAnimation, Easing, runOnJS, useAnimatedProps, useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, G, Line, Text as SvgText } from 'react-native-svg';
import BottomTabsSwitcher, { type CreateMode } from './BottomTabsSwitcher';
import PostPickerScreen from './PostPickerScreen';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Capture button dimensions
const CAPTURE_OUTER = 80;
const CAPTURE_INNER = 64;
// Side circle (gallery / effects)
const SIDE_CIRCLE = 44;

// Progress ring geometry
const MAX_DURATION = 60; // seconds
const RING_STROKE = 4;
const RING_RADIUS = (CAPTURE_OUTER - RING_STROKE) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// Zoom calibration — exact linear mapping, no approximation
const MAX_ZOOM_RATIO = 5; // device max zoom multiplier (5x)

/** Maps a user-facing zoom multiplier (e.g. 2x) to expo-camera 0–1 range.
 *  Formula: zoom = (target - 1) / (maxZoom - 1)
 *  0.5x → 0 (clamped, no ultra-wide), 1x → 0, 2x → 0.25, 5x → 1.0 */
const mapZoomToCamera = (targetZoom: number): number => {
  return safeZoom((Math.max(targetZoom, 1) - 1) / (MAX_ZOOM_RATIO - 1));
};

/** Clamp to expo-camera safe range */
const safeZoom = (z: number): number => Math.max(0, Math.min(1, z));

// Calibrated preset values — exact formula, no ultra-wide (not supported by expo-camera)
const ZOOM_PRESET_VALUES = [
  { label: '1',   value: mapZoomToCamera(1) },     // 0   — true default
  { label: '2',   value: mapZoomToCamera(2) },     // 0.25
  { label: '5',   value: mapZoomToCamera(5) },     // 1.0
] as const;

const ZOOM_1X = ZOOM_PRESET_VALUES[0].value; // default baseline (1x = index 0)

// ============================
// Arc Dial Geometry (Phase 4)
// ============================
const DIAL_WIDTH = SCREEN_WIDTH * 0.85;
const DIAL_HEIGHT = 48;
const DIAL_ARC_RADIUS = SCREEN_WIDTH * 1.2; // large radius → gentle arc curve
const DIAL_CENTER_Y = DIAL_ARC_RADIUS; // arc center is far below the visible strip

// Zoom stops for dial labels (calibrated to match presets exactly)
const DIAL_STOPS = [
  { label: '1',   zoom: mapZoomToCamera(1) },
  { label: '2',   zoom: mapZoomToCamera(2) },
  { label: '5',   zoom: mapZoomToCamera(5) },
] as const;

// Total angular sweep of the dial arc (in degrees)
const DIAL_TOTAL_ANGLE = 60; // degrees — the arc spans ±30° from center

/** Map zoom (0–1) to angle offset in degrees (0 → -DIAL_TOTAL_ANGLE/2, 1 → +DIAL_TOTAL_ANGLE/2) */
const zoomToAngle = (z: number): number => {
  return -DIAL_TOTAL_ANGLE / 2 + z * DIAL_TOTAL_ANGLE;
};

/** Map zoom (0–1) to horizontal display position (for dragging reference) */
const zoomToDisplayX = (z: number): number => {
  return z * DIAL_WIDTH;
};

// Pre-compute tick marks for the dial
type TickMark = { angle: number; height: number; isLabel: boolean; label?: string; zoom: number };

const generateDialTicks = (): TickMark[] => {
  const ticks: TickMark[] = [];
  const numTicks = 61; // total ticks across the full range

  for (let i = 0; i <= numTicks; i++) {
    const zoom = i / numTicks;
    const angle = zoomToAngle(zoom);

    // Check if this tick is near a label stop
    const matchingStop = DIAL_STOPS.find((s) => Math.abs(s.zoom - zoom) < 0.015);
    const isMajor = i % 10 === 0;

    ticks.push({
      angle,
      height: matchingStop ? 14 : isMajor ? 10 : 6,
      isLabel: !!matchingStop,
      label: matchingStop?.label,
      zoom,
    });
  }
  return ticks;
};

const DIAL_TICKS = generateDialTicks();

/** Inverse: map camera zoom (0–1) to user-facing multiplier string (e.g. "2.0x").
 *  Exact inverse of mapZoomToCamera: multiplier = cameraZoom * (maxZoom - 1) + 1
 *  Range: 1.0 (at zoom=0) to 5.0 (at zoom=1). Sub-1x is impossible. */
const zoomToDisplayLabel = (z: number): string => {
  const multiplier = Math.max(z, 0) * (MAX_ZOOM_RATIO - 1) + 1;
  if (multiplier >= 10) return Math.round(multiplier).toString();
  return multiplier.toFixed(1);
};

interface ReelsCameraScreenProps {
  onClose: () => void;
  initialMode?: 'reel' | 'post';
}

type Segment = { uri: string; duration: number; trimStart?: number; trimEnd?: number };

const formatTime = (seconds: number): string => {
  const total = Math.floor(seconds);
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const formatDuration = (seconds: number): string => {
  const total = Math.floor(seconds);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

/**
 * Reels Camera UI with live camera preview via expo-camera.
 * Reads defaultFrontCamera & cameraToolsSide from shared settings.
 */
const ReelsCameraScreen: React.FC<ReelsCameraScreenProps> = ({ onClose, initialMode = 'reel' }) => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { settings } = useStorySettings();
  const [permission, requestPermission] = useCameraPermissions();
  const [micPermission, requestMicPermission] = useMicrophonePermissions();
  const topPadding = insets.top + (Platform.OS === 'android' ? 8 : 4);
  const bottomPadding = insets.bottom + 8;

  // Camera ref for capture
  const cameraRef = useRef<CameraView>(null);

  // Camera facing — initialized from settings, flippable at runtime
  const [facing, setFacing] = useState<'front' | 'back'>(
    settings.defaultFrontCamera ? 'front' : 'back',
  );

  // Zoom level — 0 (no zoom) to 1 (max zoom), passed directly to CameraView prop
  const [zoomLevel, setZoomLevel] = useState<number>(ZOOM_1X);
  const zoomLevelRef = useRef<number>(ZOOM_1X); // mirror for sync reads from worklets/callbacks
  const zoomAtPinchStartRef = useRef(0);

  const [activePreset, setActivePreset] = useState(0); // default "1x" (index 0)

  // Keep zoomLevelRef in sync for non-render reads
  useEffect(() => {
    zoomLevelRef.current = zoomLevel;
  }, [zoomLevel]);

  // --- Phase 5: Zoom feedback animations ---
  const zoomTextScale = useSharedValue(1);
  const zoomTextOpacity = useSharedValue(1);
  const zoomUiOpacity = useSharedValue(1);
  const arrowBounce = useSharedValue(0);
  const autoHideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // --- Phase 6: Haptics + magnetic snap ---
  const lastCrossedPresetRef = useRef(-1); // index of last preset we haptic-ticked past

  /** Light haptic for preset button taps */
  const hapticTap = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  /** Soft haptic tick when crossing a preset threshold during continuous zoom */
  const hapticTickIfCrossed = useCallback((zoom: number) => {
    for (let i = 0; i < ZOOM_PRESET_VALUES.length; i++) {
      if (Math.abs(zoom - ZOOM_PRESET_VALUES[i].value) < 0.015) {
        if (lastCrossedPresetRef.current !== i) {
          lastCrossedPresetRef.current = i;
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
        return;
      }
    }
    // Also tick at max zoom
    if (zoom >= 0.99 && lastCrossedPresetRef.current !== 99) {
      lastCrossedPresetRef.current = 99;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      return;
    }
    // Clear when not near any preset
    lastCrossedPresetRef.current = -1;
  }, []);

  /** Soft magnetic attraction near presets (returns adjusted zoom) */
  const MAGNETIC_RANGE = 0.025; // range where attraction kicks in
  const MAGNETIC_STRENGTH = 0.45; // 0 = no pull, 1 = full snap
  const applyMagneticSnap = useCallback((zoom: number): number => {
    for (let i = 0; i < ZOOM_PRESET_VALUES.length; i++) {
      const dist = Math.abs(zoom - ZOOM_PRESET_VALUES[i].value);
      if (dist < MAGNETIC_RANGE && dist > 0.001) {
        // Lerp toward preset
        return zoom + (ZOOM_PRESET_VALUES[i].value - zoom) * MAGNETIC_STRENGTH;
      }
    }
    return zoom;
  }, []);

  // Snap activePreset when zoom is near a preset (tolerance in camera-zoom space)
  const PRESET_SNAP_TOLERANCE = 0.02;
  const syncPresetHighlight = useCallback((zoom: number) => {
    for (let i = 0; i < ZOOM_PRESET_VALUES.length; i++) {
      if (Math.abs(zoom - ZOOM_PRESET_VALUES[i].value) < PRESET_SNAP_TOLERANCE) {
        setActivePreset(i);
        return;
      }
    }
    setActivePreset(-1);
  }, []);

  /** Sync preset from ref — safe to call from worklet via runOnJS */
  const syncPresetFromRef = useCallback(() => {
    syncPresetHighlight(zoomLevelRef.current);
  }, [syncPresetHighlight]);

  // Fire on every zoom interaction: pulse text + bounce arrow + reset auto-hide timer
  const onZoomInteraction = useCallback(() => {
    // Instant show
    zoomUiOpacity.value = 1;
    // Scale pulse: 1 → 1.15 → 1 (fast spring)
    zoomTextScale.value = withSequence(
      withTiming(1.15, { duration: 80 }),
      withSpring(1, { damping: 12, stiffness: 200 }),
    );
    // Opacity pulse: force to 1
    zoomTextOpacity.value = withSequence(
      withTiming(1, { duration: 50 }),
      withTiming(1, { duration: 150 }),
    );
    // Arrow bounce: drop 3px then spring back
    arrowBounce.value = withSequence(
      withTiming(3, { duration: 60 }),
      withSpring(0, { damping: 10, stiffness: 300 }),
    );
    // Reset auto-hide timer
    if (autoHideTimerRef.current) clearTimeout(autoHideTimerRef.current);
    autoHideTimerRef.current = setTimeout(() => {
      zoomUiOpacity.value = withTiming(0, { duration: 400 });
    }, 1500);
  }, [zoomTextScale, zoomTextOpacity, zoomUiOpacity, arrowBounce]);

  // Animated styles for zoom text and dial container
  const zoomTextAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: zoomTextScale.value }],
    opacity: zoomTextOpacity.value,
  }));
  const zoomUiAnimatedStyle = useAnimatedStyle(() => ({
    opacity: zoomUiOpacity.value,
  }));
  const arrowAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: arrowBounce.value }],
  }));

  // Momentum state (must be before setZoomAtPinchStart which uses cancelMomentum)
  const momentumAnimRef = useRef<number | null>(null);
  const momentumZoomRef = useRef(0);

  /** Cancel any in-flight momentum animation */
  const cancelMomentum = useCallback(() => {
    if (momentumAnimRef.current !== null) {
      cancelAnimationFrame(momentumAnimRef.current);
      momentumAnimRef.current = null;
    }
  }, []);

  const setZoomAtPinchStart = useCallback(() => {
    cancelMomentum();
    zoomAtPinchStartRef.current = zoomLevel;
    lastCrossedPresetRef.current = -1; // reset so re-crossing fires haptic
  }, [zoomLevel, cancelMomentum]);
  const applyPinchZoom = useCallback((delta: number) => {
    const raw = safeZoom(zoomAtPinchStartRef.current + delta);
    const newZoom = applyMagneticSnap(raw);
    setZoomLevel(newZoom);
    hapticTickIfCrossed(newZoom);
  }, [hapticTickIfCrossed, applyMagneticSnap]);

  // Focus point state and animation
  const [focusPoint, setFocusPoint] = useState<{ x: number; y: number } | null>(null);
  const focusRingScale = useSharedValue(0.8);
  const focusRingOpacity = useSharedValue(0);

  // Focus ring animated style (must be after shared values are created)
  const focusRingAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: focusRingScale.value }],
    opacity: focusRingOpacity.value,
  }));

  // Dial drag state
  const [dialExpanded, setDialExpanded] = useState(false);
  const dialZoomAtDragStartRef = useRef(0);

  const onDialDragStart = useCallback(() => {
    cancelMomentum();
    dialZoomAtDragStartRef.current = zoomLevel;
    lastCrossedPresetRef.current = -1;
    setDialExpanded(true);
    onZoomInteraction();
  }, [zoomLevel, onZoomInteraction, cancelMomentum]);

  const onDialDragUpdate = useCallback((translationX: number) => {
    const linearDelta = translationX / DIAL_WIDTH;
    const startZoom = dialZoomAtDragStartRef.current;
    const linearTarget = startZoom + linearDelta;
    const clamped = Math.max(0, Math.min(1, linearTarget));
    const eased = clamped < startZoom
      ? clamped
      : startZoom + (clamped - startZoom) * (1 + clamped * 0.4);
    const raw = safeZoom(eased);
    const newZoom = applyMagneticSnap(raw);
    setZoomLevel(newZoom);
    hapticTickIfCrossed(newZoom);
  }, [hapticTickIfCrossed, applyMagneticSnap]);

  const onDialDragEnd = useCallback((velocityX: number) => {
    // Snap to nearest preset if close enough (before momentum)
    const SNAP_THRESHOLD = 0.03;
    for (let i = 0; i < ZOOM_PRESET_VALUES.length; i++) {
      if (Math.abs(zoomLevel - ZOOM_PRESET_VALUES[i].value) < SNAP_THRESHOLD) {
        setZoomLevel(ZOOM_PRESET_VALUES[i].value);
        setActivePreset(i);
        setTimeout(() => setDialExpanded(false), 1500);
        return; // snapped — no momentum
      }
    }

    // Momentum: convert pixel velocity to zoom-per-frame velocity
    const VELOCITY_SCALE = 0.00004; // tuned: feel heavy but responsive
    const FRICTION = 0.92; // per-frame friction (lower = stops faster)
    const MIN_VELOCITY = 0.0001; // stop threshold

    let vel = velocityX * VELOCITY_SCALE;
    momentumZoomRef.current = zoomLevel;

    const tick = () => {
      vel *= FRICTION;
      if (Math.abs(vel) < MIN_VELOCITY) {
        momentumAnimRef.current = null;
        // Final snap check
        const z = momentumZoomRef.current;
        for (let i = 0; i < ZOOM_PRESET_VALUES.length; i++) {
          if (Math.abs(z - ZOOM_PRESET_VALUES[i].value) < SNAP_THRESHOLD) {
            setZoomLevel(ZOOM_PRESET_VALUES[i].value);
            setActivePreset(i);
            setTimeout(() => setDialExpanded(false), 1500);
            return;
          }
        }
        syncPresetHighlight(z);
        setTimeout(() => setDialExpanded(false), 1500);
        return;
      }

      const next = safeZoom(momentumZoomRef.current + vel);
      momentumZoomRef.current = next;
      setZoomLevel(next);
      hapticTickIfCrossed(next);
      momentumAnimRef.current = requestAnimationFrame(tick);
    };

    // Only start momentum if velocity is meaningful
    if (Math.abs(vel) > MIN_VELOCITY) {
      momentumAnimRef.current = requestAnimationFrame(tick);
    } else {
      syncPresetHighlight(zoomLevel);
      setTimeout(() => setDialExpanded(false), 1500);
    }
  }, [zoomLevel, syncPresetHighlight, hapticTickIfCrossed]);

  // Pan gesture for the arc dial — isolated in its own GestureDetector
  const dialPanGesture = Gesture.Pan()
    .onStart(() => {
      'worklet';
      runOnJS(onDialDragStart)();
    })
    .onUpdate((event) => {
      'worklet';
      runOnJS(onDialDragUpdate)(event.translationX);
    })
    .onEnd((event) => {
      'worklet';
      runOnJS(onDialDragEnd)(event.velocityX);
    });

  // ===== RECORDING STATE =====
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [segments, setSegments] = useState<Segment[]>([]);

  // ===== CLIP PREVIEW — PLAYBACK STATE =====
  const [previewClipUri, setPreviewClipUri] = useState<string | null>(null);
  const [previewClipIndex, setPreviewClipIndex] = useState<number>(-1);
  const [pvPlaying, setPvPlaying] = useState(true);
  const [pvDuration, setPvDuration] = useState(0);
  const [pvPosition, setPvPosition] = useState(0);
  const pvVideoRef = useRef<Video>(null);
  const pvBarWidthRef = useRef(0);

  // ===== CLIP PREVIEW — TRIM STATE =====
  const [pvTrimming, setPvTrimming] = useState(false);
  const [pvTrimStart, setPvTrimStart] = useState(0);
  const [pvTrimEnd, setPvTrimEnd] = useState(0);

  // ===== CLIP PREVIEW — TIMELINE ANIMATION (Reanimated) =====
  const pvFillProgress = useSharedValue(0);
  const pvFillGlow = useSharedValue(0); // 0 = normal, 1 = active drag glow
  const pvLastFillRef = useRef(0); // tracks last set progress for backward-jump detection
  const pvPositionThrottleRef = useRef(0); // throttle setPvPosition calls
  const pvDragSeekThrottleRef = useRef(0); // throttle seeks during drag (~30fps)
  const pvDragStartTimeRef = useRef(0); // timestamp when drag began (for smart resume)
  const pvFillStyle = useAnimatedStyle(() => ({
    width: `${pvFillProgress.value * 100}%`,
    shadowOpacity: 0.4 + pvFillGlow.value * 0.5,
    shadowRadius: 4 + pvFillGlow.value * 6,
  }));

  // ===== CLIP PREVIEW — DRAG OVERLAY + MAGNIFIER BUBBLE =====
  const pvDragOverlayOpacity = useSharedValue(0);
  const pvBubbleOpacity = useSharedValue(0);
  const pvBubbleScale = useSharedValue(0.6);
  const pvBubbleX = useSharedValue(0);
  const pvBubbleTimeMsRef = useRef(0);
  const [bubbleTimeMs, setBubbleTimeMs] = useState(0);
  const pvBubbleThrottleRef = useRef(0);

  const BUBBLE_W = 56;
  const pvDragOverlayStyle = useAnimatedStyle(() => ({
    opacity: pvDragOverlayOpacity.value,
  }));
  const pvBubbleAnimStyle = useAnimatedStyle(() => ({
    opacity: pvBubbleOpacity.value,
    transform: [
      { translateX: pvBubbleX.value - BUBBLE_W / 2 },
      { scale: pvBubbleScale.value },
    ] as any,
  }));

  const clampBubbleX = (px: number) => {
    const w = pvBarWidthRef.current;
    return Math.max(BUBBLE_W / 2, Math.min(px, w - BUBBLE_W / 2));
  };

  const pvDragStart = useCallback((pxPos: number, timeMs: number) => {
    pvDragOverlayOpacity.value = withTiming(0.45, { duration: 150 });
    pvBubbleOpacity.value = withTiming(1, { duration: 120 });
    pvBubbleScale.value = withTiming(1.15, { duration: 150 });
    pvBubbleX.value = clampBubbleX(pxPos);
    pvFillGlow.value = withTiming(1, { duration: 150 });
    pvDragStartTimeRef.current = Date.now();
    setBubbleTimeMs(timeMs);
  }, [pvDragOverlayOpacity, pvBubbleOpacity, pvBubbleScale, pvBubbleX, pvFillGlow]);

  const pvDragMove = useCallback((pxPos: number, timeMs: number) => {
    pvBubbleX.value = clampBubbleX(pxPos);
    pvBubbleTimeMsRef.current = timeMs;
    const now = Date.now();
    if (now - pvBubbleThrottleRef.current > 32) {
      pvBubbleThrottleRef.current = now;
      setBubbleTimeMs(timeMs);
    }
  }, [pvBubbleX]);

  const pvDragEnd = useCallback(() => {
    pvDragOverlayOpacity.value = withTiming(0, { duration: 200 });
    pvBubbleOpacity.value = withTiming(0, { duration: 150 });
    pvBubbleScale.value = withTiming(0.6, { duration: 150 });
    pvFillGlow.value = withTiming(0, { duration: 250 });
  }, [pvDragOverlayOpacity, pvBubbleOpacity, pvBubbleScale, pvFillGlow]);

  // Stable refs for PanResponder closures
  const pvDragStartRef = useRef(pvDragStart);
  pvDragStartRef.current = pvDragStart;
  const pvDragMoveRef = useRef(pvDragMove);
  pvDragMoveRef.current = pvDragMove;
  const pvDragEndRef = useRef(pvDragEnd);
  pvDragEndRef.current = pvDragEnd;

  // ===== CLIP PREVIEW — SAFE SEEK =====
  const pvSeekingRef = useRef(false);
  const pvSafeSeek = useCallback(async (positionMs: number) => {
    if (!pvVideoRef.current || pvSeekingRef.current) return;
    try {
      pvSeekingRef.current = true;
      await pvVideoRef.current.setPositionAsync(positionMs);
    } catch {
      // ignore "Seeking interrupted"
    } finally {
      pvSeekingRef.current = false;
    }
  }, []);

  // ===== RECORDING / CAMERA REFS =====
  const isRecordingRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recordingTimeRef = useRef(0);
  const totalRecordedTimeRef = useRef(0);
  const cameraReadyRef = useRef(false);
  const isFlippingRef = useRef(false);
  const isPinchingRef = useRef(false);
  const isDetectingRef = useRef(false);
  const smartFocusPointRef = useRef<{ x: number; y: number } | null>(null);

  // Phase 300.7: Feature flag to disable real face detection in live tap-to-focus path
  // This prevents shutter sound and preview freeze during interactive taps.
  // Set to true to enable real face detection (currently disabled for UX).
  const enableRealFaceDetection = false;

  // Reset cameraReadyRef when facing changes (before new CameraView mounts)
  useEffect(() => {
    cameraReadyRef.current = false;
  }, [facing]);

  // Safety fallback: if onCameraReady never fires, unblock after 500ms
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!cameraReadyRef.current) {
        cameraReadyRef.current = true;
        isFlippingRef.current = false;
      }
    }, 500);
    return () => clearTimeout(timeout);
  }, [facing]);

  // Derived: total recorded time from segments (single source of truth)
  const totalRecordedTime = useMemo(
    () => segments.reduce((sum, s) => {
      if (s.trimStart != null && s.trimEnd != null && s.trimEnd > s.trimStart) {
        return sum + (s.trimEnd - s.trimStart) / 1000;
      }
      return sum + s.duration;
    }, 0),
    [segments],
  );

  // Keep ref in sync with derived value for synchronous reads in callbacks
  useEffect(() => {
    totalRecordedTimeRef.current = totalRecordedTime;
  }, [totalRecordedTime]);

  // Progress ring (reanimated shared value for smooth UI-thread animation)
  const progress = useSharedValue(0);

  // Sync if settings change (e.g. user changed default in settings screen)
  useEffect(() => {
    setFacing(settings.defaultFrontCamera ? 'front' : 'back');
  }, [settings.defaultFrontCamera]);

  const toolsOnLeft = settings.cameraToolsSide === 'left';

  const [mode, setMode] = useState<CreateMode>(initialMode);

  const handleSwitch = useCallback((next: CreateMode) => {
    setMode(next);
  }, []);

  // Request camera + mic permission on mount
  useEffect(() => {
    if (!permission?.granted) requestPermission();
    if (!micPermission?.granted) requestMicPermission();
  }, [permission, requestPermission, micPermission, requestMicPermission]);

  // Auto-hide zoom UI after initial mount (show briefly then fade)
  useEffect(() => {
    autoHideTimerRef.current = setTimeout(() => {
      zoomUiOpacity.value = withTiming(0, { duration: 400 });
    }, 1500);
    return () => {
      if (autoHideTimerRef.current) clearTimeout(autoHideTimerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Timer: increment every second while recording (per-segment counter)
  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingTime((t) => {
          const next = t + 1;
          recordingTimeRef.current = next;
          return next;
        });
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isRecording]);

  // Cleanup: stop recording on unmount
  useEffect(() => {
    return () => {
      if (isRecordingRef.current && cameraRef.current) {
        cameraRef.current.stopRecording();
      }
      if (autoHideTimerRef.current) clearTimeout(autoHideTimerRef.current);
      if (momentumAnimRef.current !== null) cancelAnimationFrame(momentumAnimRef.current);
    };
  }, []);

  // Progress ring animation: smooth linear fill over remaining duration
  useEffect(() => {
    if (isRecording) {
      const remaining = MAX_DURATION - totalRecordedTimeRef.current;
      if (remaining > 0) {
        progress.value = withTiming(1, {
          duration: remaining * 1000,
          easing: Easing.linear,
        });
      }
    } else {
      cancelAnimation(progress);
      // Lock ring at full when all time consumed
      if (totalRecordedTimeRef.current >= MAX_DURATION) {
        progress.value = 1;
      }
    }
  }, [isRecording, progress]);

  // Sync progress ring when segments change (removal/undo) while not recording
  useEffect(() => {
    if (!isRecording) {
      progress.value = Math.min(totalRecordedTime / MAX_DURATION, 1);
    }
  }, [totalRecordedTime, isRecording, progress]);

  // Animated SVG props for stroke offset
  const ringAnimatedProps = useAnimatedProps(() => ({
    strokeDashoffset: RING_CIRCUMFERENCE * (1 - progress.value),
  }));

  // Flip camera (used by button + double-tap gesture)
  const flipCamera = useCallback(() => {
    if (isFlippingRef.current) return;
    isFlippingRef.current = true;
    cameraReadyRef.current = false;
    setFacing((f) => (f === 'front' ? 'back' : 'front'));
    setZoomLevel(ZOOM_1X); // reset zoom to 1x baseline
    setActivePreset(0); // back to "1x" (index 0)
    onZoomInteraction(); // show zoom UI after flip
  }, [onZoomInteraction]);

  // Helper: Core autofocus reset (extracted from triggerTapToFocus)
  const performAutofocusReset = useCallback(async () => {
    if (cameraRef.current && cameraReadyRef.current && !isRecordingRef.current) {
      try {
        await cameraRef.current.pausePreview();
        await new Promise((resolve) => setTimeout(resolve, 80)); // 80ms settle time
        await cameraRef.current.resumePreview();
      } catch {
        // Expected during camera transitions — no action needed
      }
    }
  }, []);

  // Helper: Background face detection (fire-and-forget, Phase 300.2)
  // Phase 300.5: Production-hardened with complete error handling and fallback safety
  const detectFacesIfAvailable = useCallback(async (x: number, y: number) => {
    // Guard: Prevent concurrent detection attempts
    if (isDetectingRef.current) return;

    isDetectingRef.current = true;

    try {
      // STEP 1: Capture snapshot from camera
      const photo = await cameraRef.current?.takePictureAsync({
        skipProcessing: true,
      });

      // Fallback: Photo capture failed or no URI
      if (!photo?.uri) {
        smartFocusPointRef.current = null;
        return;
      }

      // STEP 2: Run face detection service
      const result = await FaceDetectionService.detectFacesFromSnapshot(photo.uri);

      // Guard: Ensure result object has expected shape
      if (!result || typeof result !== 'object') {
        smartFocusPointRef.current = null;
        return;
      }

      // Fallback: Detection did not succeed
      if (!result.success) {
        smartFocusPointRef.current = null;
        return;
      }

      // Guard: Ensure faces property exists and is an array (defend against malformed result)
      if (!Array.isArray(result.faces) || result.faces.length === 0) {
        smartFocusPointRef.current = null;
        return;
      }

      // STEP 3: Select best face candidate for this tap
      const bestFace = FaceDetectionService.getBestDetectedFace(
        result.faces,
        x,
        y,
        SCREEN_WIDTH,
        SCREEN_HEIGHT,
      );

      // Fallback: No suitable face candidate found
      if (!bestFace) {
        smartFocusPointRef.current = null;
        return;
      }

      // STEP 4: Compute optimal focus point from selected face
      const smartPoint = FaceDetectionService.getSmartFocusPointFromFace(
        bestFace,
        SCREEN_WIDTH,
        SCREEN_HEIGHT,
      );

      // Guard: Validate computed focus point before applying
      if (!FaceDetectionService.isValidFocusPoint(smartPoint)) {
        smartFocusPointRef.current = null;
        return;
      }

      // STEP 5: Success — Store and apply smart focus
      // Phase 300.4: Update ring position when detection completes
      // Progressive enhancement: ring shows at smart face location (if still visible)
      smartFocusPointRef.current = smartPoint;
      setFocusPoint({ x: smartPoint.x, y: smartPoint.y });

    } catch {
      // Fallback: Catch any unexpected error and safely clear state
      smartFocusPointRef.current = null;
    } finally {
      // Always reset detection guard to allow next detection attempt
      isDetectingRef.current = false;
    }
  }, []);

  // Trigger autofocus reset at tap location
  const triggerTapToFocus = useCallback(async (x: number, y: number) => {
    // 1. Instant UI feedback
    setFocusPoint({ x, y });

    // 2. Ring animation (UNCHANGED)
    focusRingScale.value = 0.8;
    focusRingOpacity.value = 1;
    focusRingScale.value = withSpring(1.2, { damping: 8, stiffness: 150 });

    // Fade out after animation
    focusRingOpacity.value = withSequence(
      withTiming(1, { duration: 300 }),
      withTiming(0, { duration: 500, easing: Easing.out(Easing.quad) }),
    );

    // 3. Autofocus reset (UNCHANGED behavior, now in helper)
    await performAutofocusReset();

    // 4. Phase 300.7: Conditional real face detection
    // Real detection disabled in live tap path to prevent shutter sound and preview freeze.
    // Infrastructure (Phase 300.1–300.6) is preserved for future use.
    if (enableRealFaceDetection) {
      detectFacesIfAvailable(x, y);
    }

    // 5. Clear focus point after animation (UNCHANGED)
    setTimeout(() => setFocusPoint(null), 800);
  }, [focusRingScale, focusRingOpacity, performAutofocusReset, detectFacesIfAvailable]);

  // Toggle video recording (start/stop)
  const handleRecordToggle = useCallback(async () => {
    if (!cameraRef.current || !cameraReadyRef.current || isFlippingRef.current) return;

    // STOP
    if (isRecordingRef.current) {
      cameraRef.current.stopRecording();
      return;
    }

    // START
    isRecordingRef.current = true;
    setIsRecording(true);
    setRecordingTime(0);
    recordingTimeRef.current = 0;

    try {
      const result = await cameraRef.current.recordAsync();

      if (!result || !result.uri) {
        return;
      }

      const segmentDuration = recordingTimeRef.current;
      setSegments((prev) => [...prev, { uri: result.uri, duration: segmentDuration }]);
    } catch {
    } finally {
      isRecordingRef.current = false;
      setIsRecording(false);
    }
  }, []);

  // Remove a specific segment by index (with confirmation)
  const removeSegment = useCallback((index: number) => {
    Alert.alert('Remove clip?', 'This clip will be deleted.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          setSegments((prev) => prev.filter((_, i) => i !== index));
        },
      },
    ]);
  }, []);

  // ===== CLIP PREVIEW — HANDLERS =====
  const pvFormatTime = (ms: number) => {
    const sec = Math.max(0, Math.floor(ms / 1000));
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const closePreview = useCallback(() => {
    setPreviewClipUri(null);
    setPreviewClipIndex(-1);
    setPvPlaying(true);
    setPvDuration(0);
    setPvPosition(0);
    setPvTrimming(false);
    setPvTrimStart(0);
    setPvTrimEnd(0);
    trimHistoryRef.current = [];
    trimHistoryIdxRef.current = -1;
    setTrimHistoryLen(0);
    setTrimHistoryIdx(-1);
  }, []);

  const pvTogglePlay = useCallback(async () => {
    if (!pvVideoRef.current) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (pvPlaying) {
      await pvVideoRef.current.pauseAsync();
      setPvPlaying(false);
    } else {
      const st = await pvVideoRef.current.getStatusAsync();
      if (st.isLoaded && st.didJustFinish) {
        await pvSafeSeek(pvTrimming ? pvTrimStart : 0);
      }
      await pvVideoRef.current.playAsync();
      setPvPlaying(true);
    }
  }, [pvPlaying, pvTrimming, pvTrimStart]);

  const pvToggleTrim = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (pvTrimming) {
      // "Done" — save virtual trim range to segment
      if (previewClipIndex >= 0) {
        setSegments((prev) =>
          prev.map((seg, i) =>
            i === previewClipIndex
              ? { ...seg, trimStart: pvTrimStart, trimEnd: pvTrimEnd }
              : seg
          )
        );
      }
      setPvTrimming(false);
    } else {
      setPvTrimStart(0);
      setPvTrimEnd(pvDuration);
      setPvTrimming(true);
      // Initialize history with full range
      trimHistoryRef.current = [{ start: 0, end: pvDuration }];
      trimHistoryIdxRef.current = 0;
      setTrimHistoryLen(1);
      setTrimHistoryIdx(0);
    }
  }, [pvTrimming, pvDuration, previewClipIndex, pvTrimStart, pvTrimEnd]);

  // ── Seek by delta (for double-tap) ──────────────────────────────
  const pvDurationRefSeek = useRef(pvDuration);
  pvDurationRefSeek.current = pvDuration;
  const pvSeekBy = useCallback(async (deltaMs: number) => {
    if (!pvVideoRef.current) return;
    const st = await pvVideoRef.current.getStatusAsync();
    if (!st.isLoaded) return;
    const target = Math.max(0, Math.min(pvDurationRefSeek.current, st.positionMillis + deltaMs));
    await pvSafeSeek(target);
    setPvPosition(target);
  }, [pvSafeSeek]);

  // Double-tap detection refs
  const pvLastTapRef = useRef(0);
  const pvTapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Handle drag scale state
  const pvDraggingHandleRef = useRef<'left' | 'right' | null>(null);

  // ── Trim undo/redo history ─────────────────────────────────────
  const trimHistoryRef = useRef<{ start: number; end: number }[]>([]);
  const trimHistoryIdxRef = useRef(-1);
  const [trimHistoryLen, setTrimHistoryLen] = useState(0);
  const [trimHistoryIdx, setTrimHistoryIdx] = useState(-1);

  const pushTrimHistory = useCallback((start: number, end: number) => {
    const h = trimHistoryRef.current;
    const idx = trimHistoryIdxRef.current;
    // Slice future entries if user edited after undo
    const updated = [...h.slice(0, idx + 1), { start, end }];
    trimHistoryRef.current = updated;
    trimHistoryIdxRef.current = updated.length - 1;
    setTrimHistoryLen(updated.length);
    setTrimHistoryIdx(updated.length - 1);
  }, []);

  const handleTrimUndo = useCallback(() => {
    if (trimHistoryIdxRef.current <= 0) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newIdx = trimHistoryIdxRef.current - 1;
    const prev = trimHistoryRef.current[newIdx];
    trimHistoryIdxRef.current = newIdx;
    setTrimHistoryIdx(newIdx);
    setPvTrimStart(prev.start);
    setPvTrimEnd(prev.end);
  }, []);

  const handleTrimRedo = useCallback(() => {
    if (trimHistoryIdxRef.current >= trimHistoryRef.current.length - 1) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newIdx = trimHistoryIdxRef.current + 1;
    const next = trimHistoryRef.current[newIdx];
    trimHistoryIdxRef.current = newIdx;
    setTrimHistoryIdx(newIdx);
    setPvTrimStart(next.start);
    setPvTrimEnd(next.end);
  }, []);

  const pushTrimHistoryRef = useRef(pushTrimHistory);
  pushTrimHistoryRef.current = pushTrimHistory;

  // ── Scrub / live preview refs ──────────────────────────────────
  const pvSafeSeekRef = useRef(pvSafeSeek);
  pvSafeSeekRef.current = pvSafeSeek;
  const scrubActivePxRef = useRef<number | null>(null); // null = not scrubbing
  const pvWasPlayingRef = useRef(false);
  const pvPlayingRef = useRef(pvPlaying);
  pvPlayingRef.current = pvPlaying;

  // ── Export handler ──────────────────────────────────────────────
  const [pvExporting, setPvExporting] = useState(false);
  const handleExport = useCallback(async () => {
    if (!previewClipUri || pvExporting) return;
    try {
      setPvExporting(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Allow photo library access to save videos.');
        setPvExporting(false);
        return;
      }

      const start = pvTrimStartRef.current;
      const end = pvTrimEndRef.current;
      const hasTrim = pvTrimming && end > start && (start > 0 || end < pvDurationRefSeek.current);

      if (!hasTrim) {
        // No trim — save original directly
        await MediaLibrary.saveToLibraryAsync(previewClipUri);
      } else {
        // Trim active — copy to cache then save (real trim deferred to backend)
        const srcFile = new FSFile(previewClipUri);
        const destFile = new FSFile(Paths.cache, `trimmed_${Date.now()}.mp4`);
        srcFile.copy(destFile);
        await MediaLibrary.saveToLibraryAsync(destFile.uri);
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Saved', 'Video saved to gallery.');
    } catch {
      Alert.alert('Export failed', 'Could not save video.');
    } finally {
      setPvExporting(false);
    }
  }, [previewClipUri, pvExporting, pvTrimming]);

  // ── Trim Handle Dragging ───────────────────────────────────────
  const HANDLE_WIDTH = 20;
  const MIN_TRIM_GAP_PX = 12;

  // Stable refs — avoids PanResponder recreation
  const pvDurationRef = useRef(pvDuration);
  pvDurationRef.current = pvDuration;
  const [, setDragTick] = useState(0);

  // Pixel-based refs — source of truth during drag
  const trimStartPxRef = useRef(0);
  const trimEndPxRef = useRef(0);

  const pvMsToX = useCallback((ms: number) => {
    const w = pvBarWidthRef.current;
    const d = pvDurationRef.current;
    if (w <= 0 || d <= 0) return 0;
    return (ms / d) * w;
  }, []);

  const pvXToMs = useCallback((x: number) => {
    const w = pvBarWidthRef.current;
    const d = pvDurationRef.current;
    if (w <= 0 || d <= 0) return 0;
    return Math.round(Math.max(0, Math.min(d, (x / w) * d)));
  }, []);
  const pvXToMsRef = useRef(pvXToMs);
  pvXToMsRef.current = pvXToMs;

  // Sync px refs when state changes (e.g. entering trim mode)
  const pvTrimStartRef = useRef(pvTrimStart);
  if (pvTrimStart !== pvTrimStartRef.current) {
    pvTrimStartRef.current = pvTrimStart;
    trimStartPxRef.current = pvMsToX(pvTrimStart);
  }
  const pvTrimEndRef = useRef(pvTrimEnd);
  if (pvTrimEnd !== pvTrimEndRef.current) {
    pvTrimEndRef.current = pvTrimEnd;
    trimEndPxRef.current = pvMsToX(pvTrimEnd);
  }
  const pvTrimmingRef = useRef(pvTrimming);
  pvTrimmingRef.current = pvTrimming;

  // ===== TIMELINE FEEL HELPERS =====
  const SNAP_THRESHOLD_PX = 10;
  const EDGE_ZONE_PX = 20;

  /** Magnetic snap: if x is within threshold of a key point, snap to it */
  const snapToPx = (x: number): number => {
    const w = pvBarWidthRef.current;
    const points = [0, w];
    if (pvTrimmingRef.current) {
      points.push(trimStartPxRef.current, trimEndPxRef.current);
    }
    for (const p of points) {
      if (Math.abs(x - p) < SNAP_THRESHOLD_PX) return p;
    }
    return x;
  };

  /** Velocity-based inertia factor: faster drag = slightly amplified movement */
  const velocityFactor = (vx: number): number => Math.min(1.2, 0.7 + Math.abs(vx) * 0.15);

  /** Edge resistance: dampen movement near boundaries */
  const applyEdgeResistance = (x: number, w: number): number => {
    if (x < EDGE_ZONE_PX) return x * 0.4;
    if (x > w - EDGE_ZONE_PX) return w - (w - x) * 0.4;
    return x;
  };

  /** Throttled seek during drag (~30fps) */
  const throttledDragSeek = (ms: number) => {
    const now = Date.now();
    if (now - pvDragSeekThrottleRef.current > 33) {
      pvDragSeekThrottleRef.current = now;
      pvSafeSeekRef.current(ms);
    }
  };

  /** Smart resume: only auto-resume if drag was short (<800ms) */
  const smartResume = () => {
    if (pvWasPlayingRef.current && Date.now() - pvDragStartTimeRef.current < 800) {
      pvVideoRef.current?.playAsync();
      setPvPlaying(true);
    }
  };

  const leftGrabPxRef = useRef(0);
  const leftPanResponder = useMemo(() =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        leftGrabPxRef.current = trimStartPxRef.current;
        pvDraggingHandleRef.current = 'left';
        scrubActivePxRef.current = trimStartPxRef.current;
        pvWasPlayingRef.current = pvPlayingRef.current;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        if (pvPlayingRef.current) {
          pvVideoRef.current?.pauseAsync();
          setPvPlaying(false);
        }
        pvSafeSeekRef.current(pvXToMs(trimStartPxRef.current));
        const w1 = pvBarWidthRef.current;
        if (w1 > 0) {
          cancelAnimation(pvFillProgress);
          pvFillProgress.value = trimStartPxRef.current / w1;
          pvLastFillRef.current = pvFillProgress.value;
        }
        pvDragStartRef.current(trimStartPxRef.current, pvXToMsRef.current(trimStartPxRef.current));
        setDragTick((t) => t + 1);
      },
      onPanResponderMove: (_, gesture) => {
        const maxPx = trimEndPxRef.current - MIN_TRIM_GAP_PX;
        const factor = velocityFactor(gesture.vx);
        let raw = leftGrabPxRef.current + gesture.dx * factor;
        if (raw < 8) raw = raw * 0.4; // edge resistance near 0
        const snapped = snapToPx(Math.max(0, Math.min(raw, maxPx)));
        trimStartPxRef.current = snapped;
        scrubActivePxRef.current = snapped;
        throttledDragSeek(pvXToMs(snapped));
        const wL = pvBarWidthRef.current;
        if (wL > 0) {
          cancelAnimation(pvFillProgress);
          pvFillProgress.value = snapped / wL;
          pvLastFillRef.current = pvFillProgress.value;
        }
        pvDragMoveRef.current(snapped, pvXToMsRef.current(snapped));
        setDragTick((t) => t + 1);
      },
      onPanResponderRelease: () => {
        pvDraggingHandleRef.current = null;
        scrubActivePxRef.current = null;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        const startMs = pvXToMs(trimStartPxRef.current);
        setPvTrimStart(startMs);
        pushTrimHistoryRef.current(startMs, pvTrimEndRef.current);
        smartResume();
        pvDragEndRef.current();
        setDragTick((t) => t + 1);
      },
    }),
  [pvXToMs]);

  const rightGrabPxRef = useRef(0);
  const rightPanResponder = useMemo(() =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        rightGrabPxRef.current = trimEndPxRef.current;
        pvDraggingHandleRef.current = 'right';
        scrubActivePxRef.current = trimEndPxRef.current;
        pvWasPlayingRef.current = pvPlayingRef.current;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        if (pvPlayingRef.current) {
          pvVideoRef.current?.pauseAsync();
          setPvPlaying(false);
        }
        pvSafeSeekRef.current(pvXToMs(trimEndPxRef.current));
        const w2 = pvBarWidthRef.current;
        if (w2 > 0) {
          cancelAnimation(pvFillProgress);
          pvFillProgress.value = trimEndPxRef.current / w2;
          pvLastFillRef.current = pvFillProgress.value;
        }
        pvDragStartRef.current(trimEndPxRef.current, pvXToMsRef.current(trimEndPxRef.current));
        setDragTick((t) => t + 1);
      },
      onPanResponderMove: (_, gesture) => {
        const w = pvBarWidthRef.current;
        const minPx = trimStartPxRef.current + MIN_TRIM_GAP_PX;
        const factor = velocityFactor(gesture.vx);
        let raw = rightGrabPxRef.current + gesture.dx * factor;
        if (raw > w - 8) raw = w - (w - raw) * 0.4; // edge resistance near end
        const snapped = snapToPx(Math.min(w, Math.max(raw, minPx)));
        trimEndPxRef.current = snapped;
        scrubActivePxRef.current = snapped;
        throttledDragSeek(pvXToMs(snapped));
        if (w > 0) {
          cancelAnimation(pvFillProgress);
          pvFillProgress.value = snapped / w;
          pvLastFillRef.current = pvFillProgress.value;
        }
        pvDragMoveRef.current(snapped, pvXToMsRef.current(snapped));
        setDragTick((t) => t + 1);
      },
      onPanResponderRelease: () => {
        pvDraggingHandleRef.current = null;
        scrubActivePxRef.current = null;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        const endMs = pvXToMs(trimEndPxRef.current);
        setPvTrimEnd(endMs);
        pushTrimHistoryRef.current(pvTrimStartRef.current, endMs);
        smartResume();
        pvDragEndRef.current();
        setDragTick((t) => t + 1);
      },
    }),
  [pvXToMs]);

  // ── Main timeline scrub PanResponder ───────────────────────────
  const scrubGrabXRef = useRef(0);
  const scrubPanResponder = useMemo(() =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => {
        const x = e.nativeEvent.locationX;
        scrubGrabXRef.current = x;
        scrubActivePxRef.current = Math.max(0, Math.min(x, pvBarWidthRef.current));
        pvWasPlayingRef.current = pvPlayingRef.current;
        if (pvPlayingRef.current) {
          pvVideoRef.current?.pauseAsync();
          setPvPlaying(false);
        }
        const w = pvBarWidthRef.current;
        if (w > 0) {
          cancelAnimation(pvFillProgress);
          pvFillProgress.value = scrubActivePxRef.current / w;
          pvLastFillRef.current = pvFillProgress.value;
        }
        const ms = pvXToMs(scrubActivePxRef.current);
        pvSafeSeekRef.current(ms);
        pvDragStartRef.current(scrubActivePxRef.current!, ms);
        setDragTick((t) => t + 1);
      },
      onPanResponderMove: (_, gesture) => {
        const w = pvBarWidthRef.current;
        if (w <= 0) return;
        const factor = velocityFactor(gesture.vx);
        let rawX = Math.max(0, Math.min(scrubGrabXRef.current + gesture.dx * factor, w));
        rawX = applyEdgeResistance(rawX, w);
        const x = snapToPx(Math.max(0, Math.min(rawX, w)));
        scrubActivePxRef.current = x;
        cancelAnimation(pvFillProgress);
        pvFillProgress.value = x / w;
        pvLastFillRef.current = pvFillProgress.value;
        throttledDragSeek(pvXToMs(x));
        pvDragMoveRef.current(x, pvXToMsRef.current(x));
        setDragTick((t) => t + 1);
      },
      onPanResponderRelease: () => {
        const px = scrubActivePxRef.current;
        scrubActivePxRef.current = null;
        if (px != null) {
          pvSafeSeekRef.current(pvXToMs(px));
        }
        smartResume();
        pvDragEndRef.current();
        setDragTick((t) => t + 1);
      },
    }),
  [pvXToMs]);

  // ── Undo: remove last segment (with confirmation)
  const undoLastSegment = useCallback(() => {
    Alert.alert('Remove last clip?', 'The most recent clip will be deleted.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          setSegments((prev) => prev.slice(0, -1));
        },
      },
    ]);
  }, []);

  // Navigate to edit reel with all segments
  const handleNext = useCallback(() => {
    if (segments.length === 0) return;
    router.push({
      pathname: '/reels-edit' as any,
      params: { segments: JSON.stringify(segments) },
    });
  }, [segments, router]);

  // Gesture: double tap → flip camera (blocked during pinch)
  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      'worklet';
      if (isPinchingRef.current) return;
      runOnJS(flipCamera)();
    });

  // Gesture: single tap → focus (blocked during pinch)
  const singleTap = Gesture.Tap()
    .numberOfTaps(1)
    .onEnd((event) => {
      'worklet';
      if (isPinchingRef.current) return;
      runOnJS(triggerTapToFocus)(event.x, event.y);
    });

  // Gesture: pinch → zoom (sets isPinchingRef to block taps)
  const pinchGesture = Gesture.Pinch()
    .onStart(() => {
      'worklet';
      isPinchingRef.current = true;
      runOnJS(setZoomAtPinchStart)();
      runOnJS(onZoomInteraction)();
    })
    .onUpdate((event) => {
      'worklet';
      const delta = (event.scale - 1) * 0.3;
      runOnJS(applyPinchZoom)(delta);
    })
    .onEnd(() => {
      'worklet';
      isPinchingRef.current = false;
      runOnJS(syncPresetFromRef)();
    })
    .onFinalize(() => {
      'worklet';
      isPinchingRef.current = false;
    });

  // Pinch runs simultaneously with taps; taps self-guard via isPinchingRef
  const cameraGesture = Gesture.Simultaneous(
    pinchGesture,
    Gesture.Exclusive(doubleTap, singleTap),
  );

  // Stable FlatList helpers for clips preview
  const renderClipItem = useCallback(
    ({ item, index }: { item: Segment; index: number }) => (
      <ClipThumbnail uri={item.uri} duration={item.trimStart != null && item.trimEnd != null && item.trimEnd > item.trimStart ? (item.trimEnd - item.trimStart) / 1000 : item.duration} index={index + 1} onRemove={() => removeSegment(index)} onPreview={() => { setPreviewClipUri(item.uri); setPreviewClipIndex(index); }} />
    ),
    [removeSegment],
  );
  const getClipLayout = useCallback(
    (_: unknown, index: number) => ({ length: 56, offset: 56 * index, index }),
    [],
  );

  // Derived: can start a new segment?
  const hasSegments = segments.length > 0;
  const canRecord = totalRecordedTime < MAX_DURATION;

  // ===== POST MODE → render gallery picker =====
  if (mode === 'post') {
    return (
      <View style={styles.container}>
        <PostPickerScreen onClose={onClose} />
        {/* Tab switcher overlaid at bottom */}
        <View style={[styles.bottomArea, { bottom: bottomPadding }]}>
          <BottomTabsSwitcher mode={mode} onSwitch={handleSwitch} />
        </View>
      </View>
    );
  }

  // ===== REEL MODE (default) =====
  return (
    <>
    <GestureHandlerRootView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" translucent />

      {/* ===== LIVE CAMERA PREVIEW ===== */}
      {permission?.granted && (
        <CameraView
          key={facing}
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          facing={facing}
          mode="video"
          zoom={zoomLevel}
          onCameraReady={() => {
            cameraReadyRef.current = true;
            isFlippingRef.current = false;
          }}
        />
      )}

      {/* ===== GESTURE LAYER — camera tap/double-tap only ===== */}
      {/* Stops above bottom controls so button taps are never intercepted */}
      {permission?.granted && (
        <GestureDetector gesture={cameraGesture}>
          <View style={styles.gestureLayer} />
        </GestureDetector>
      )}

      {/* ===== FOCUS RING (animated tap-to-focus indicator) ===== */}
      {focusPoint && (
        <Animated.View
          style={[
            styles.focusRing,
            focusRingAnimatedStyle,
            {
              top: focusPoint.y - 40,
              left: focusPoint.x - 40,
            },
          ]}
          pointerEvents="none"
        />
      )}

      {/* ===== TOP BAR ===== */}
      <View style={[styles.topBar, { top: topPadding }]}>
        {/* Close (X) — left */}
        <Pressable style={styles.topButton} onPress={onClose} hitSlop={12}>
          <Ionicons name="close" size={30} color="#fff" />
        </Pressable>

        {/* Spacer / Recording timer */}
        <View style={styles.flex1}>
          {isRecording && (
            <View style={styles.timerContainer}>
              <View style={styles.recordingDot} />
              <Text style={styles.timerText}>{formatTime(Math.min(totalRecordedTime + recordingTime, MAX_DURATION))}</Text>
            </View>
          )}
        </View>

        {/* Settings — right */}
        <Pressable style={styles.topButton} hitSlop={12} onPress={() => router.push('/reels-camera-settings' as any)}>
          <Ionicons name="settings-outline" size={26} color="#fff" />
        </Pressable>
      </View>

      {/* ===== ADD AUDIO BUTTON — center top ===== */}
      <View style={[styles.addAudioContainer, { top: topPadding + 56 }]}>
        <View style={styles.addAudioButton}>
          <Ionicons name="musical-notes" size={16} color="#fff" />
          <Text style={styles.addAudioText}>Add audio</Text>
        </View>
      </View>

      {/* ===== VERTICAL CONTROLS (position from settings) ===== */}
      <View style={[
        styles.sideControls,
        toolsOnLeft ? { left: 14 } : { right: 14 },
        { bottom: SCREEN_HEIGHT * 0.28 },
      ]}>
        <SideIcon icon="musical-notes" label="Music" />
        <SideIcon icon="sparkles" label="Effects" />
        <SideIcon icon="timer-outline" label="Timer" />
        <SideIcon icon="time-outline" label="60" />
        <SideIcon icon="grid-outline" label="Layout" />
        <SideIcon icon="text" label="Text" />
      </View>

      {/* ===== CAMERA FLIP (opposite side) ===== */}
      <Pressable
        style={[
          styles.flipButton,
          toolsOnLeft ? { right: 14 } : { left: 14 },
          { bottom: SCREEN_HEIGHT * 0.28 },
        ]}
        hitSlop={12}
        onPress={flipCamera}
      >
        <Ionicons name="camera-reverse-outline" size={28} color="#fff" />
        <Text style={styles.sideIconLabel}>{facing === 'front' ? 'Front' : 'Back'}</Text>
      </Pressable>

      {/* ===== ZOOM ARC DIAL ===== */}
      <Animated.View style={[styles.dialContainer, zoomUiAnimatedStyle]}>
        {/* Current zoom readout — animated scale pulse */}
        <Animated.View style={[styles.dialReadout, zoomTextAnimatedStyle]}>
          <Text style={styles.dialReadoutText}>{zoomToDisplayLabel(zoomLevel)}x</Text>
        </Animated.View>

        {/* Fixed indicator triangle — animated bounce */}
        <Animated.View style={[styles.dialIndicator, arrowAnimatedStyle]}>
          {/* Trail glow — gold line fading behind indicator */}
          <View style={styles.trailGlow} />
          <Svg width={12} height={8} viewBox="0 0 12 8">
            <Line x1={6} y1={0} x2={0} y2={8} stroke="#FFD700" strokeWidth={2} />
            <Line x1={6} y1={0} x2={12} y2={8} stroke="#FFD700" strokeWidth={2} />
          </Svg>
        </Animated.View>

        {/* The draggable arc dial */}
        <GestureDetector gesture={dialPanGesture}>
          <View style={styles.dialTrack}>
            <Svg width={DIAL_WIDTH} height={DIAL_HEIGHT} viewBox={`0 0 ${DIAL_WIDTH} ${DIAL_HEIGHT}`}>
              <G
                rotation={-zoomToAngle(zoomLevel)}
                originX={DIAL_WIDTH / 2}
                originY={DIAL_CENTER_Y}
              >
                {DIAL_TICKS.map((tick, i) => {
                  const angleRad = (tick.angle * Math.PI) / 180;
                  const x = DIAL_WIDTH / 2 + DIAL_ARC_RADIUS * Math.sin(angleRad);
                  const y = DIAL_CENTER_Y - DIAL_ARC_RADIUS * Math.cos(angleRad);
                  const yOffset = y - (DIAL_CENTER_Y - DIAL_ARC_RADIUS) + 24;

                  return (
                    <G key={i}>
                      <Line
                        x1={x}
                        y1={yOffset}
                        x2={x}
                        y2={yOffset + tick.height}
                        stroke={tick.isLabel ? '#fff' : 'rgba(255,255,255,0.35)'}
                        strokeWidth={tick.isLabel ? 1.5 : 0.8}
                      />
                      {tick.isLabel && tick.label && (
                        <SvgText
                          x={x}
                          y={yOffset + tick.height + 12}
                          fill="#fff"
                          fontSize={10}
                          fontWeight="600"
                          textAnchor="middle"
                          opacity={0.85}
                        >
                          {tick.label}
                        </SvgText>
                      )}
                    </G>
                  );
                })}
              </G>
            </Svg>
          </View>
        </GestureDetector>

        {/* Preset tap buttons below dial */}
        <View style={styles.zoomPresetsRow}>
          {ZOOM_PRESET_VALUES.map((preset, index) => (
            <Pressable
              key={preset.label}
              style={[
                styles.zoomPresetButton,
                activePreset === index && styles.zoomPresetButtonActive,
              ]}
              onPress={() => {
                cancelMomentum();
                setZoomLevel(preset.value);
                setActivePreset(index);
                hapticTap();
                onZoomInteraction();
              }}
              hitSlop={6}
            >
              <Text style={[
                styles.zoomPresetText,
                activePreset === index && styles.zoomPresetTextActive,
              ]}>
                {preset.label}x
              </Text>
            </Pressable>
          ))}
        </View>
      </Animated.View>

      {/* ===== LEFT-SIDE VERTICAL CLIPS (when segments exist) ===== */}
      {hasSegments && (
        <View style={[styles.clipsVerticalContainer, { top: topPadding + 120 }]} pointerEvents="box-none">
          <FlatList
            data={segments}
            keyExtractor={(item) => item.uri}
            renderItem={renderClipItem}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.clipsVerticalContent}
            initialNumToRender={10}
            maxToRenderPerBatch={3}
          />
        </View>
      )}

      {/* ===== BOTTOM CONTROLS ===== */}
      <View style={[styles.bottomArea, { bottom: bottomPadding }]}>
        {/* POST | REEL tab switcher — hidden when segments exist */}
        {!hasSegments && <BottomTabsSwitcher mode={mode} onSwitch={handleSwitch} />}

        {/* Capture row: left — capture — right */}
        <View style={styles.captureRow}>
          {/* Left: Gallery (no segments) or Undo (has segments) */}
          {hasSegments ? (
            <Pressable style={styles.undoButton} onPress={undoLastSegment} hitSlop={12}>
              <Ionicons name="arrow-undo" size={22} color="#fff" />
            </Pressable>
          ) : (
            <Pressable style={styles.sideCircle} onPress={() => router.push('/reels-media-picker')} hitSlop={12}>
              <Ionicons name="images" size={22} color="#fff" />
            </Pressable>
          )}

          {/* Big capture button (center) with progress ring */}
          <View style={[styles.captureButtonContainer, !canRecord && !isRecording && { opacity: 0.4 }]}>
            {/* Outer white ring — visual only, not interactive */}
            <View style={styles.captureOuter} />
            {/* SVG progress ring — visual only */}
            <Svg
              width={CAPTURE_OUTER}
              height={CAPTURE_OUTER}
              style={styles.progressRing}
              pointerEvents="none"
            >
              <AnimatedCircle
                cx={CAPTURE_OUTER / 2}
                cy={CAPTURE_OUTER / 2}
                r={RING_RADIUS}
                stroke="#FF3040"
                strokeWidth={RING_STROKE}
                fill="none"
                strokeDasharray={RING_CIRCUMFERENCE}
                animatedProps={ringAnimatedProps}
                strokeLinecap="round"
              />
            </Svg>
            {/* Inner red button — ONLY touch target */}
            <Pressable
              style={({ pressed }) => [
                styles.captureInnerButton,
                isRecording && { opacity: 0.6 },
                { transform: [{ scale: pressed ? 0.92 : 1 }] },
              ]}
              onPress={handleRecordToggle}
              disabled={!canRecord && !isRecording}
              hitSlop={15}
            />
          </View>

          {/* Right: Effects (no segments) or Next (has segments) */}
          {hasSegments ? (
            <Pressable style={styles.nextButton} onPress={handleNext} hitSlop={12}>
              <Text style={styles.nextButtonText}>Next</Text>
            </Pressable>
          ) : (
            <View style={styles.sideCircle}>
              <Ionicons name="color-wand-outline" size={22} color="#fff" />
            </View>
          )}
        </View>
      </View>
    </GestureHandlerRootView>

    {/* ===== CLIP PREVIEW MODAL ===== */}
    {previewClipUri && (
      <Modal
        visible={true}
        transparent
        animationType="fade"
        onRequestClose={closePreview}
      >
        <Pressable style={styles.previewBackdrop} onPress={closePreview} />
        <View style={styles.previewContainer} pointerEvents="box-none">

          {/* Top bar: X + time + undo/redo */}
          <View style={[styles.pvTopBar, { paddingTop: insets.top + 8 }]}>
            <Pressable style={({ pressed }) => [styles.previewCloseButton, { opacity: pressed ? 0.6 : 1 }]} onPress={closePreview} hitSlop={12}>
              <Ionicons name="close" size={24} color="#fff" />
            </Pressable>
            <Text style={styles.pvTimeText}>{pvFormatTime(pvPosition)}</Text>
            {pvTrimming ? (
              <View style={styles.pvUndoRedoPill}>
                <Pressable
                  onPress={handleTrimUndo}
                  disabled={trimHistoryIdx <= 0}
                  hitSlop={8}
                  style={({ pressed }) => ({ opacity: trimHistoryIdx <= 0 ? 0.3 : pressed ? 0.6 : 1 })}
                >
                  <Ionicons name="arrow-undo" size={20} color="#fff" />
                </Pressable>
                <View style={styles.pvUndoRedoDivider} />
                <Pressable
                  onPress={handleTrimRedo}
                  disabled={trimHistoryIdx >= trimHistoryLen - 1}
                  hitSlop={8}
                  style={({ pressed }) => ({ opacity: trimHistoryIdx >= trimHistoryLen - 1 ? 0.3 : pressed ? 0.6 : 1 })}
                >
                  <Ionicons name="arrow-redo" size={20} color="#fff" />
                </Pressable>
              </View>
            ) : (
              <View style={{ width: 38 }} />
            )}
          </View>

          {/* Video */}
          <View style={styles.previewVideoWrapper}>
            <Pressable
              style={StyleSheet.absoluteFill}
              onPress={() => {
                const now = Date.now();
                const gap = now - pvLastTapRef.current;
                pvLastTapRef.current = now;
                if (pvTapTimerRef.current) {
                  clearTimeout(pvTapTimerRef.current);
                  pvTapTimerRef.current = null;
                }
                if (gap < 250) {
                  // Double tap — handled by left/right overlays below
                  return;
                }
                // Single tap — delay to distinguish from double tap
                pvTapTimerRef.current = setTimeout(() => {
                  pvTapTimerRef.current = null;
                  pvTogglePlay();
                }, 260);
              }}
            >
              <Video
                ref={pvVideoRef}
                source={{ uri: previewClipUri }}
                style={styles.previewVideo}
                shouldPlay={pvPlaying}
                isLooping={!pvTrimming}
                resizeMode={ResizeMode.CONTAIN}
                useNativeControls={false}
                onLoad={() => {
                  if (pvTrimmingRef.current && pvTrimStartRef.current > 0) {
                    pvSafeSeek(pvTrimStartRef.current);
                  }
                }}
                onPlaybackStatusUpdate={(status) => {
                  if (!status.isLoaded) return;
                  const pos = status.positionMillis;
                  const dur = status.durationMillis ?? pvDurationRef.current;

                  // Throttle state updates for time labels (~300ms)
                  const now = Date.now();
                  if (now - pvPositionThrottleRef.current > 300) {
                    setPvPosition(pos);
                    pvPositionThrottleRef.current = now;
                  }

                  if (status.durationMillis && status.durationMillis > 0) {
                    setPvDuration(status.durationMillis);
                  }

                  // Smooth fill progress (skip if user is scrubbing/dragging)
                  if (dur > 0 && scrubActivePxRef.current == null) {
                    const trimming = pvTrimmingRef.current;
                    const clamped = trimming
                      ? Math.max(pvTrimStartRef.current, Math.min(pos, pvTrimEndRef.current))
                      : pos;
                    const progress = Math.max(0, Math.min(1, clamped / dur));
                    if (progress < pvLastFillRef.current - 0.02) {
                      // Backward jump (trim loop) — snap instantly
                      cancelAnimation(pvFillProgress);
                      pvFillProgress.value = progress;
                    } else {
                      pvFillProgress.value = withTiming(progress, { duration: 300, easing: Easing.linear });
                    }
                    pvLastFillRef.current = progress;
                  }

                  // Trim-bounded looping
                  if (pvTrimmingRef.current && pvTrimEndRef.current > pvTrimStartRef.current) {
                    if (pos >= pvTrimEndRef.current && !pvSeekingRef.current) {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      pvSafeSeek(pvTrimStartRef.current);
                      return;
                    }
                  }
                  if (status.didJustFinish) setPvPlaying(false);
                }}
              />
            </Pressable>
            {/* Double-tap seek overlays */}
            <Pressable
              style={styles.pvDoubleTapLeft}
              onPress={() => {
                const now = Date.now();
                const gap = now - pvLastTapRef.current;
                pvLastTapRef.current = now;
                if (pvTapTimerRef.current) {
                  clearTimeout(pvTapTimerRef.current);
                  pvTapTimerRef.current = null;
                }
                if (gap < 250) {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  pvSeekBy(-2000);
                } else {
                  pvTapTimerRef.current = setTimeout(() => {
                    pvTapTimerRef.current = null;
                    pvTogglePlay();
                  }, 260);
                }
              }}
            />
            <Pressable
              style={styles.pvDoubleTapRight}
              onPress={() => {
                const now = Date.now();
                const gap = now - pvLastTapRef.current;
                pvLastTapRef.current = now;
                if (pvTapTimerRef.current) {
                  clearTimeout(pvTapTimerRef.current);
                  pvTapTimerRef.current = null;
                }
                if (gap < 250) {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  pvSeekBy(2000);
                } else {
                  pvTapTimerRef.current = setTimeout(() => {
                    pvTapTimerRef.current = null;
                    pvTogglePlay();
                  }, 260);
                }
              }}
            />
            {/* Play/Pause indicator */}
            {!pvPlaying && (
              <View style={styles.pvPlayIndicator} pointerEvents="none">
                <Ionicons name="play" size={48} color="rgba(255,255,255,0.8)" />
              </View>
            )}
            {/* Drag dim overlay */}
            <Animated.View style={[styles.pvDragOverlay, pvDragOverlayStyle]} pointerEvents="none" />
          </View>

          {/* Bottom controls */}
          <View style={[styles.pvControlPanel, { paddingBottom: insets.bottom + 12 }]}>
            {/* Progress bar */}
            <View style={styles.pvTimeRow}>
              <Text style={styles.pvTimeLbl}>{pvFormatTime(pvPosition)}</Text>
              <View
                style={styles.pvTrack}
                onLayout={(e) => { pvBarWidthRef.current = e.nativeEvent.layout.width; }}
              >
                <Animated.View style={[styles.pvFill, pvFillStyle]} />
                {/* Trim handles + range overlay */}
                {pvTrimming && pvDuration > 0 && (
                  <>
                    {/* Dimmed areas */}
                    <View style={[styles.pvTrimDim, { left: 0, width: trimStartPxRef.current }]} />
                    <View style={[styles.pvTrimDim, { right: 0, width: pvBarWidthRef.current - trimEndPxRef.current }]} />
                    {/* Active range */}
                    <View style={[styles.pvTrimRange, { left: trimStartPxRef.current, width: trimEndPxRef.current - trimStartPxRef.current }]} />
                    {/* Left handle */}
                    <View
                      style={[styles.pvHandle, styles.pvHandleLeft, { left: trimStartPxRef.current - HANDLE_WIDTH / 2, transform: [{ scale: pvDraggingHandleRef.current === 'left' ? 1.3 : 1 }] }]}
                      {...leftPanResponder.panHandlers}
                    >
                      <View style={[styles.pvHandleBar, pvDraggingHandleRef.current === 'left' && styles.pvHandleBarActive]} />
                    </View>
                    {/* Right handle */}
                    <View
                      style={[styles.pvHandle, styles.pvHandleRight, { left: trimEndPxRef.current - HANDLE_WIDTH / 2, transform: [{ scale: pvDraggingHandleRef.current === 'right' ? 1.3 : 1 }] }]}
                      {...rightPanResponder.panHandlers}
                    >
                      <View style={[styles.pvHandleBar, pvDraggingHandleRef.current === 'right' && styles.pvHandleBarActive]} />
                    </View>
                  </>
                )}
                {/* Scrub touch layer (replaces simple tap Pressable) */}
                <View style={styles.pvSeekLayer} {...scrubPanResponder.panHandlers} />
                {/* Scrub indicator line */}
                {scrubActivePxRef.current != null && (
                  <View style={[styles.pvScrubLine, { left: scrubActivePxRef.current }]} pointerEvents="none" />
                )}
                {/* Magnifier time bubble — Reanimated-driven, works for scrub + trim handles */}
                <Animated.View style={[styles.pvMagnifierBubble as any, pvBubbleAnimStyle]} pointerEvents="none">
                  <Text style={styles.pvMagnifierText}>{pvFormatTime(bubbleTimeMs)}</Text>
                  <View style={styles.pvMagnifierCaret} />
                </Animated.View>
              </View>
              <Text style={styles.pvTimeLbl}>{pvFormatTime(pvDuration)}</Text>
            </View>

            {/* Buttons row */}
            <View style={styles.pvBtnRow}>
              <Pressable style={({ pressed }) => [styles.pvBtn, { transform: [{ scale: pressed ? 0.9 : 1 }] }]} onPress={pvTogglePlay} hitSlop={8}>
                <Ionicons name={pvPlaying ? 'pause' : 'play'} size={24} color="#fff" />
              </Pressable>
              <Pressable style={({ pressed }) => [styles.pvPill, pvTrimming && styles.pvPillActive, { transform: [{ scale: pressed ? 0.92 : 1 }] }]} onPress={pvToggleTrim} hitSlop={6}>
                <Ionicons name={pvTrimming ? 'checkmark' : 'cut-outline'} size={16} color="#fff" />
                <Text style={styles.pvPillText}>{pvTrimming ? 'Done' : 'Cut'}</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.pvExportBtn, { opacity: pvExporting ? 0.5 : 1, transform: [{ scale: pressed ? 0.92 : 1 }] }]}
                onPress={handleExport}
                disabled={pvExporting}
                hitSlop={6}
              >
                <Ionicons name="download-outline" size={16} color="#fff" />
                <Text style={styles.pvExportText}>{pvExporting ? 'Saving...' : 'Export'}</Text>
              </Pressable>
            </View>

            {/* Trim info */}
            {pvTrimming && (
              <Text style={styles.pvTrimInfo}>Trim: {pvFormatTime(pvTrimStartRef.current)} — {pvFormatTime(pvTrimEndRef.current)}</Text>
            )}
          </View>

        </View>
      </Modal>
    )}
    </>
  );
};

// ===== Static side icon with label =====
const SideIcon: React.FC<{
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
}> = ({ icon, label }) => (
  <View style={styles.sideIconWrapper}>
    <Ionicons name={icon} size={26} color="#fff" />
    <Text style={styles.sideIconLabel}>{label}</Text>
  </View>
);

// ===== Memoized clip thumbnail — prevents re-render on timer ticks =====

const ClipThumbnail = React.memo(({ uri, duration, index, onRemove, onPreview }: { uri: string; duration: number; index: number; onRemove: () => void; onPreview: () => void }) => (
  <View style={styles.clipWrapper}>
    <View style={styles.clipRow}>
      <View style={styles.clipThumbCol}>
        <View style={styles.clipThumbnailOuter}>
          {/* Video area — long press triggers preview */}
          <Pressable
            style={styles.clipThumbnail}
            onLongPress={onPreview}
            delayLongPress={250}
          >
            <Video
              source={{ uri }}
              style={styles.clipVideo}
              resizeMode={ResizeMode.COVER}
              shouldPlay={false}
              isMuted
            />
          </Pressable>
          {/* X button OUTSIDE Pressable — no touch conflict */}
          <Pressable style={styles.clipRemoveButton} onPress={onRemove} hitSlop={6}>
            <Ionicons name="close" size={10} color="#fff" />
          </Pressable>
        </View>
        <Text style={styles.clipDuration}>{formatDuration(duration)}</Text>
      </View>
      <Text style={styles.clipIndexText}>{index}</Text>
    </View>
  </View>
));

export default ReelsCameraScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },

  // ---- Gesture layer — covers camera area only, stops above bottom controls ----
  gestureLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 200,
  },

  // ---- Focus ring ----
  focusRing: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: '#fff',
    zIndex: 5,
  },

  // ---- Top bar ----
  topBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    zIndex: 10,
  },
  topButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  flex1: { flex: 1 },

  // ---- Recording timer ----
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF3040',
  },
  timerText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },

  // ---- Add audio ----
  addAudioContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  addAudioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addAudioText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },

  // ---- Side vertical controls (positioned dynamically) ----
  sideControls: {
    position: 'absolute',
    alignItems: 'center',
    gap: 24,
    zIndex: 10,
  },
  flipButton: {
    position: 'absolute',
    alignItems: 'center',
    gap: 4,
    zIndex: 10,
  },
  sideIconWrapper: {
    alignItems: 'center',
    gap: 4,
  },
  sideIconLabel: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '500',
    textAlign: 'center',
  },

  // ---- Bottom area ----
  bottomArea: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },

  // ---- Zoom arc dial ----
  dialContainer: {
    position: 'absolute',
    bottom: 190,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  dialReadout: {
    marginBottom: 4,
  },
  dialReadoutText: {
    color: '#FFD700',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
    textShadowColor: 'rgba(255,215,0,0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
  dialIndicator: {
    marginBottom: 2,
    alignItems: 'center',
  },
  trailGlow: {
    position: 'absolute',
    width: 20,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: 'rgba(255,215,0,0.3)',
    top: 6,
    shadowColor: '#FFD700',
    shadowOpacity: 0.5,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 0 },
  },
  dialTrack: {
    width: DIAL_WIDTH,
    height: DIAL_HEIGHT,
    overflow: 'hidden',
  },

  // ---- Zoom presets (below dial) ----
  zoomPresetsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    marginTop: 6,
  },
  zoomPresetButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  zoomPresetButtonActive: {
    backgroundColor: 'rgba(255,215,0,0.15)',
    borderColor: '#FFD700',
    transform: [{ scale: 1.1 }],
    shadowColor: '#FFD700',
    shadowOpacity: 0.4,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
  zoomPresetText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 11,
    fontWeight: '600',
  },
  zoomPresetTextActive: {
    color: '#FFD700',
  },

  // ---- Clips vertical left-side list ----
  clipsVerticalContainer: {
    position: 'absolute',
    left: 10,
    bottom: 220,
    width: 68,
    maxHeight: SCREEN_HEIGHT * 0.35,
    zIndex: 8,
  },
  clipsVerticalContent: {
    gap: 10,
    paddingVertical: 4,
  },
  clipWrapper: {
    overflow: 'visible',
  },
  clipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  clipThumbCol: {
    alignItems: 'center',
  },
  clipThumbnailOuter: {
    width: 44,
    height: 44,
    position: 'relative',
  },
  clipThumbnail: {
    width: 44,
    height: 44,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  clipRemoveButton: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  clipVideo: {
    width: 44,
    height: 44,
  },
  clipIndexText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '700',
  },
  clipDuration: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '600',
    opacity: 0.9,
    marginTop: 4,
    textAlign: 'center',
  },

  // ---- Capture row ----
  captureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 32,
    marginTop: 14,
  },
  captureButtonContainer: {
    width: CAPTURE_OUTER,
    height: CAPTURE_OUTER,
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureOuter: {
    position: 'absolute',
    width: CAPTURE_OUTER,
    height: CAPTURE_OUTER,
    borderRadius: CAPTURE_OUTER / 2,
    borderWidth: 4,
    borderColor: '#fff',
  },
  progressRing: {
    position: 'absolute',
    top: 0,
    left: 0,
    transform: [{ rotate: '-90deg' }],
  },
  captureInnerButton: {
    width: CAPTURE_INNER,
    height: CAPTURE_INNER,
    borderRadius: CAPTURE_INNER / 2,
    backgroundColor: '#FF3040',
    zIndex: 2,
    shadowColor: '#FF3040',
    shadowOpacity: 0.6,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
  nextButton: {
    backgroundColor: '#FF3040',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: '#FF3040',
    shadowOpacity: 0.6,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  undoButton: {
    width: SIDE_CIRCLE,
    height: SIDE_CIRCLE,
    borderRadius: SIDE_CIRCLE / 2,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  sideCircle: {
    width: SIDE_CIRCLE,
    height: SIDE_CIRCLE,
    borderRadius: SIDE_CIRCLE / 2,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.25)',
  },

  // ---- Clip Preview Modal ----
  previewBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.92)',
  },
  previewContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
  },
  pvTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
    zIndex: 10,
  },
  pvTimeText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    fontWeight: '600',
    fontVariant: ['tabular-nums' as const],
  },
  previewCloseButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pvUndoRedoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 0,
  },
  pvUndoRedoDivider: {
    width: 1,
    height: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginHorizontal: 8,
  },
  previewVideoWrapper: {
    alignSelf: 'center',
    width: '90%',
    aspectRatio: 9 / 16,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#111',
  },
  previewVideo: {
    width: '100%',
    height: '100%',
  },
  pvControlPanel: {
    paddingHorizontal: 20,
    paddingTop: 16,
    zIndex: 10,
  },
  pvTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  pvTimeLbl: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 11,
    fontWeight: '500',
    fontVariant: ['tabular-nums' as const],
    width: 34,
    textAlign: 'center',
  },
  pvTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.15)',
    overflow: 'visible',
    position: 'relative',
  },
  pvFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: '#0095F6',
    borderRadius: 3,
    shadowColor: '#0095F6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
    elevation: 4,
  },
  pvSeekLayer: {
    ...StyleSheet.absoluteFillObject,
    top: -12,
    bottom: -12,
    zIndex: 5,
  },
  pvScrubLine: {
    position: 'absolute',
    top: -16,
    bottom: -16,
    width: 2,
    marginLeft: -1,
    backgroundColor: '#fff',
    borderRadius: 1,
    zIndex: 25,
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 3,
    elevation: 5,
  },
  pvMagnifierBubble: {
    position: 'absolute',
    top: -48,
    left: 0,
    width: 56,
    paddingVertical: 5,
    paddingHorizontal: 2,
    borderRadius: 10,
    backgroundColor: 'rgba(10,10,10,0.92)',
    alignItems: 'center',
    zIndex: 35,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
  pvMagnifierText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
    fontVariant: ['tabular-nums' as const],
    letterSpacing: 0.3,
  },
  pvMagnifierCaret: {
    position: 'absolute',
    bottom: -5,
    width: 10,
    height: 10,
    backgroundColor: 'rgba(10,10,10,0.92)',
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    transform: [{ rotate: '45deg' }],
  },
  pvTrimDim: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderRadius: 3,
  },
  pvTrimRange: {
    position: 'absolute',
    top: -3,
    bottom: -3,
    backgroundColor: 'rgba(0,149,246,0.25)',
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: 'rgba(0,149,246,0.8)',
    shadowColor: '#0095F6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 4,
  },
  pvHandle: {
    position: 'absolute',
    top: -14,
    width: 20,
    height: 34,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
  },
  pvHandleLeft: {},
  pvHandleRight: {},
  pvHandleBar: {
    width: 4,
    height: 22,
    borderRadius: 2,
    backgroundColor: '#fff',
  },
  pvHandleBarActive: {
    backgroundColor: '#0095F6',
    width: 5,
    shadowColor: '#0095F6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 4,
  },
  pvBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  pvBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pvPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  pvPillActive: {
    backgroundColor: '#0095F6',
  },
  pvPillText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  pvExportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#22c55e',
    marginLeft: 'auto',
  },
  pvExportText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  pvTrimInfo: {
    marginTop: 10,
    textAlign: 'center',
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    fontWeight: '500',
    fontVariant: ['tabular-nums' as const],
  },
  pvDoubleTapLeft: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: '40%',
    zIndex: 2,
  },
  pvDoubleTapRight: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: '40%',
    zIndex: 2,
  },
  pvPlayIndicator: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  pvDragOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
    zIndex: 6,
  },
});
