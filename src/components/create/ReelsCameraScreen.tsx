import { useStorySettings } from '@/src/context/StorySettingsContext';
import { Ionicons } from '@expo/vector-icons';
import { ResizeMode, Video } from 'expo-av';
import { CameraView, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Dimensions, FlatList, Platform, Pressable, StatusBar, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { cancelAnimation, Easing, runOnJS, useAnimatedProps, useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, G, Line, Text as SvgText } from 'react-native-svg';
import BottomTabsSwitcher, { type CreateMode } from './BottomTabsSwitcher';
import PostPickerScreen from './PostPickerScreen';
import FaceDetectionService from '@/src/services/FaceDetectionService';

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

type Segment = { uri: string; duration: number };

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const formatDuration = (seconds: number): string => {
  const s = Math.floor(seconds % 60).toString().padStart(2, '0');
  const m = Math.floor(seconds / 60);
  return m > 0 ? `${m}:${s}` : `0:${s}`;
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

  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [segments, setSegments] = useState<Segment[]>([]);
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
    () => segments.reduce((sum, s) => sum + s.duration, 0),
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

      console.log('[FOCUS] Smart focus applied');
    } catch (e) {
      // Fallback: Catch any unexpected error and safely clear state
      smartFocusPointRef.current = null;
      console.log('[FOCUS] Detection error');
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
      console.log('[REELS-DEBUG] STOP recording');
      cameraRef.current.stopRecording();
      return;
    }

    // START
    console.log('[REELS-DEBUG] START recording');
    isRecordingRef.current = true;
    setIsRecording(true);
    setRecordingTime(0);
    recordingTimeRef.current = 0;

    try {
      const result = await cameraRef.current.recordAsync();

      if (!result || !result.uri) {
        console.log('[REELS-DEBUG] Recording failed — no URI');
        return;
      }

      const segmentDuration = recordingTimeRef.current;
      console.log('[REELS-DEBUG] Segment appended:', segmentDuration, 's');
      setSegments((prev) => [...prev, { uri: result.uri, duration: segmentDuration }]);
    } catch (error) {
      console.log('[REELS-DEBUG] Recording error:', error);
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

  // Undo: remove last segment (with confirmation)
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
    console.log('[REELS-DEBUG] NAVIGATING with segments:', segments.length);
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
      <ClipThumbnail uri={item.uri} duration={item.duration} index={index + 1} onRemove={() => removeSegment(index)} />
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

const ClipThumbnail = React.memo(({ uri, duration, index, onRemove }: { uri: string; duration: number; index: number; onRemove: () => void }) => (
  <View style={styles.clipWrapper}>
    <View style={styles.clipRow}>
      <View style={styles.clipThumbCol}>
        <View style={styles.clipThumbnail}>
          <Video
            source={{ uri }}
            style={styles.clipVideo}
            resizeMode={ResizeMode.COVER}
            shouldPlay={false}
            isMuted
          />
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
});
