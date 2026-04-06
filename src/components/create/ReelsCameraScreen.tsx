import { useStorySettings } from '@/src/context/StorySettingsContext';
import { Ionicons } from '@expo/vector-icons';
import { ResizeMode, Video } from 'expo-av';
import { CameraView, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Dimensions, FlatList, Platform, Pressable, StatusBar, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { cancelAnimation, Easing, runOnJS, useAnimatedProps, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import BottomTabsSwitcher, { type CreateMode } from './BottomTabsSwitcher';
import PostPickerScreen from './PostPickerScreen';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

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
    setTimeout(() => {
      if (!cameraReadyRef.current) {
        cameraReadyRef.current = true;
        isFlippingRef.current = false;
      }
    }, 800);
  }, []);

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

  // Gesture: double tap → flip camera
  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      'worklet';
      runOnJS(flipCamera)();
    });

  // Gesture: single tap → focus (expo-camera has no point-of-interest focus API; no-op)
  const singleTap = Gesture.Tap()
    .numberOfTaps(1)
    .onEnd(() => {
      'worklet';
      // expo-camera CameraView does not expose focus(x, y).
      // Continuous autofocus is active by default.
    });

  // Double tap takes priority; single tap fires only if no second tap arrives
  const cameraGesture = Gesture.Exclusive(doubleTap, singleTap);

  // Stable FlatList helpers for clips preview
  const renderClipItem = useCallback(
    ({ item, index }: { item: Segment; index: number }) => (
      <ClipThumbnail uri={item.uri} duration={item.duration} onRemove={() => removeSegment(index)} />
    ),
    [removeSegment],
  );
  const getClipLayout = useCallback(
    (_: unknown, index: number) => ({ length: CLIP_ITEM_WIDTH, offset: CLIP_ITEM_WIDTH * index, index }),
    [],
  );

  // Derived: can start a new segment?
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

      {/* ===== BOTTOM CONTROLS ===== */}
      <View style={[styles.bottomArea, { bottom: bottomPadding }]}>
        {/* Clips preview row */}
        {segments.length > 0 && (
          <FlatList
            data={segments}
            horizontal
            keyExtractor={(item) => item.uri}
            renderItem={renderClipItem}
            getItemLayout={getClipLayout}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.clipsContainer}
            style={styles.clipsList}
            initialNumToRender={10}
            maxToRenderPerBatch={3}
          />
        )}

        {/* POST | REEL tab switcher */}
        <BottomTabsSwitcher mode={mode} onSwitch={handleSwitch} />

        {/* Capture row: left — capture — right */}
        <View style={styles.captureRow}>
          {/* Left: Gallery (no segments) or Undo (has segments) */}
          {segments.length > 0 ? (
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
          {segments.length > 0 ? (
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
const CLIP_ITEM_WIDTH = 44 + 6; // thumbnail + marginRight

const ClipThumbnail = React.memo(({ uri, duration, onRemove }: { uri: string; duration: number; onRemove: () => void }) => (
  <View style={styles.clipWrapper}>
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
    bottom: 200, // stops above bottom controls so gestures don't steal button taps
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

  // ---- Clips preview ----
  clipsList: {
    alignSelf: 'stretch',
  },
  clipsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 12,
    marginBottom: 10,
  },
  clipWrapper: {
    alignItems: 'center',
    marginRight: 6,
    overflow: 'visible',
  },
  clipThumbnail: {
    width: 44,
    height: 44,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
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
  clipDuration: {
    fontSize: 11,
    color: '#fff',
    marginTop: 3,
    fontWeight: '600',
    opacity: 0.9,
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
