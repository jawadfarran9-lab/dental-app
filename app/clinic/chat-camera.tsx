import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Pressable,
    StatusBar,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import {
    Gesture,
    GestureDetector,
    GestureHandlerRootView,
} from 'react-native-gesture-handler';
import Animated, {
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withSequence,
    withSpring,
    withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { G, Line, Text as SvgText } from 'react-native-svg';

const CAPTURE_OUTER = 80;
const CAPTURE_INNER = 64;

const MAX_ZOOM_RATIO = 5;
const MAX_CAMERA_ZOOM = 0.5; // cap so we never hit the device's extreme hardware max
const safeZoom = (z: number) => Math.max(0, Math.min(MAX_CAMERA_ZOOM, z));
const mapZoomToCamera = (t: number) =>
  safeZoom((Math.max(t, 1) - 1) / (MAX_ZOOM_RATIO - 1));
const ZOOM_PRESET_VALUES = [
  { label: '1', value: mapZoomToCamera(1) },
  { label: '2', value: mapZoomToCamera(2) },
  { label: '3', value: mapZoomToCamera(3) },
] as const;
const ZOOM_1X = ZOOM_PRESET_VALUES[0].value;

const SCREEN_WIDTH = Dimensions.get('window').width;
const DIAL_WIDTH = SCREEN_WIDTH * 0.85;
const DIAL_HEIGHT = 48;
const DIAL_ARC_RADIUS = SCREEN_WIDTH * 1.2;
const DIAL_CENTER_Y = DIAL_ARC_RADIUS;
const DIAL_STOPS = [
  { label: '1', zoom: mapZoomToCamera(1) },
  { label: '2', zoom: mapZoomToCamera(2) },
  { label: '3', zoom: mapZoomToCamera(3) },
] as const;
const DIAL_TOTAL_ANGLE = 60;
const zoomToAngle = (z: number): number =>
  -DIAL_TOTAL_ANGLE / 2 + z * DIAL_TOTAL_ANGLE;

type TickMark = {
  angle: number;
  height: number;
  isLabel: boolean;
  label?: string;
  zoom: number;
};
const generateDialTicks = (): TickMark[] => {
  const numTicks = 61;
  const step = MAX_CAMERA_ZOOM / numTicks;
  const stopIndexToLabel = new Map<number, string>();
  DIAL_STOPS.forEach((s) => {
    const bestIndex = Math.round(s.zoom / step);
    stopIndexToLabel.set(bestIndex, s.label);
  });
  const ticks: TickMark[] = [];
  for (let i = 0; i <= numTicks; i++) {
    const zoom = (i / numTicks) * MAX_CAMERA_ZOOM;
    const angle = zoomToAngle(zoom);
    const label = stopIndexToLabel.get(i);
    const isMajor = i % 10 === 0;
    ticks.push({
      angle,
      height: label ? 14 : isMajor ? 10 : 6,
      isLabel: !!label,
      label,
      zoom,
    });
  }
  return ticks;
};
const DIAL_TICKS = generateDialTicks();

const zoomToDisplayLabel = (z: number): string => {
  const multiplier = Math.max(z, 0) * (MAX_ZOOM_RATIO - 1) + 1;
  if (multiplier >= 10) return Math.round(multiplier).toString();
  return multiplier.toFixed(1);
};

export default function ChatCameraScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { patientId, name, clinicId } = useLocalSearchParams<{
    patientId: string;
    name?: string;
    clinicId?: string;
  }>();

  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [facing, setFacing] = useState<'front' | 'back'>('back');
  const [ready, setReady] = useState(false);
  const [taking, setTaking] = useState(false);
  const [zoomLevel, setZoomLevel] = useState<number>(ZOOM_1X);
  const [activePreset, setActivePreset] = useState(0);
  const zoomAtPinchStartRef = useRef(0);
  const zoomLevelRef = useRef(zoomLevel);
  useEffect(() => {
    zoomLevelRef.current = zoomLevel;
  }, [zoomLevel]);
  const dialZoomAtDragStartRef = useRef(0);

  const zoomUiOpacity = useSharedValue(1);
  const zoomTextScale = useSharedValue(1);
  const zoomTextOpacity = useSharedValue(1);
  const arrowBounce = useSharedValue(0);
  const autoHideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const zoomUiAnimatedStyle = useAnimatedStyle(() => ({
    opacity: zoomUiOpacity.value,
  }));
  const zoomTextAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: zoomTextScale.value }],
    opacity: zoomTextOpacity.value,
  }));
  const arrowAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: arrowBounce.value }],
  }));

  const isInteractingRef = useRef(false);

  const scheduleHide = useCallback(() => {
    if (autoHideTimerRef.current) clearTimeout(autoHideTimerRef.current);
    autoHideTimerRef.current = setTimeout(() => {
      if (!isInteractingRef.current) {
        zoomUiOpacity.value = withTiming(0, { duration: 400 });
      }
    }, 1500);
  }, [zoomUiOpacity]);

  const showAndHold = useCallback(() => {
    zoomUiOpacity.value = 1;
    zoomTextScale.value = withSequence(
      withTiming(1.15, { duration: 80 }),
      withSpring(1, { damping: 12, stiffness: 200 }),
    );
    arrowBounce.value = withSequence(
      withTiming(3, { duration: 60 }),
      withSpring(0, { damping: 10, stiffness: 300 }),
    );
    if (autoHideTimerRef.current) clearTimeout(autoHideTimerRef.current);
  }, [zoomUiOpacity, zoomTextScale, arrowBounce]);

  const onZoomInteraction = useCallback(() => {
    zoomUiOpacity.value = 1;
    zoomTextScale.value = withSequence(
      withTiming(1.15, { duration: 80 }),
      withSpring(1, { damping: 12, stiffness: 200 }),
    );
    zoomTextOpacity.value = withSequence(
      withTiming(1, { duration: 50 }),
      withTiming(1, { duration: 150 }),
    );
    arrowBounce.value = withSequence(
      withTiming(3, { duration: 60 }),
      withSpring(0, { damping: 10, stiffness: 300 }),
    );
    scheduleHide();
  }, [zoomUiOpacity, zoomTextScale, zoomTextOpacity, arrowBounce, scheduleHide]);

  useEffect(() => {
    autoHideTimerRef.current = setTimeout(() => {
      zoomUiOpacity.value = withTiming(0, { duration: 400 });
    }, 1500);
    return () => {
      if (autoHideTimerRef.current) clearTimeout(autoHideTimerRef.current);
      if (momentumAnimRef.current !== null) {
        cancelAnimationFrame(momentumAnimRef.current);
        momentumAnimRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const lastCrossedPresetRef = useRef(-1);
  const hapticTap = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);
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
    lastCrossedPresetRef.current = -1;
  }, []);

  const MAGNETIC_RANGE = 0.025;
  const MAGNETIC_STRENGTH = 0.45;
  const applyMagneticSnap = useCallback((zoom: number): number => {
    for (let i = 0; i < ZOOM_PRESET_VALUES.length; i++) {
      const dist = Math.abs(zoom - ZOOM_PRESET_VALUES[i].value);
      if (dist < MAGNETIC_RANGE && dist > 0.001) {
        return zoom + (ZOOM_PRESET_VALUES[i].value - zoom) * MAGNETIC_STRENGTH;
      }
    }
    return zoom;
  }, []);

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

  const momentumAnimRef = useRef<number | null>(null);
  const momentumZoomRef = useRef(0);
  const cancelMomentum = useCallback(() => {
    if (momentumAnimRef.current !== null) {
      cancelAnimationFrame(momentumAnimRef.current);
      momentumAnimRef.current = null;
    }
  }, []);

  const onPinchStart = useCallback(() => {
    zoomAtPinchStartRef.current = zoomLevel;
  }, [zoomLevel]);

  const onPinchUpdate = useCallback((delta: number) => {
    setZoomLevel(safeZoom(zoomAtPinchStartRef.current + delta));
    setActivePreset(-1);
  }, []);

  const onPinchInteractStart = useCallback(() => {
    cancelMomentum();
    isInteractingRef.current = true;
    showAndHold();
  }, [showAndHold, cancelMomentum]);

  const onPinchInteractEnd = useCallback(() => {
    isInteractingRef.current = false;
    scheduleHide();
  }, [scheduleHide]);

  const pinchGesture = useMemo(
    () =>
      Gesture.Pinch()
        .onStart(() => {
          'worklet';
          runOnJS(onPinchStart)();
          runOnJS(onPinchInteractStart)();
        })
        .onUpdate((e) => {
          'worklet';
          runOnJS(onPinchUpdate)((e.scale - 1) * 0.3);
        })
        .onFinalize(() => {
          'worklet';
          runOnJS(onPinchInteractEnd)();
        }),
    [onPinchStart, onPinchUpdate, onPinchInteractStart, onPinchInteractEnd],
  );

  const onDialDragStart = useCallback(() => {
    cancelMomentum();
    dialZoomAtDragStartRef.current = zoomLevel;
    isInteractingRef.current = true;
    showAndHold();
  }, [zoomLevel, showAndHold, cancelMomentum]);

  const onDialDragUpdate = useCallback((translationX: number) => {
    const linearDelta = translationX / DIAL_WIDTH;
    const startZoom = dialZoomAtDragStartRef.current;
    const linearTarget = startZoom + linearDelta;
    const clamped = Math.max(0, Math.min(MAX_CAMERA_ZOOM, linearTarget));
    const eased =
      clamped < startZoom
        ? clamped
        : startZoom + (clamped - startZoom) * (1 + clamped * 0.4);
    const raw = safeZoom(eased);
    const newZoom = applyMagneticSnap(raw);
    setZoomLevel(newZoom);
    hapticTickIfCrossed(newZoom);
    setActivePreset(-1);
  }, [applyMagneticSnap, hapticTickIfCrossed]);

  const onDialDragEnd = useCallback((velocityX: number) => {
    lastCrossedPresetRef.current = -1;
    const SNAP_THRESHOLD = 0.03;
    const settle = (z: number) => {
      for (let i = 0; i < ZOOM_PRESET_VALUES.length; i++) {
        if (Math.abs(z - ZOOM_PRESET_VALUES[i].value) < SNAP_THRESHOLD) {
          setZoomLevel(ZOOM_PRESET_VALUES[i].value);
          setActivePreset(i);
          isInteractingRef.current = false;
          scheduleHide();
          return;
        }
      }
      syncPresetHighlight(z);
      isInteractingRef.current = false;
      scheduleHide();
    };
    for (let i = 0; i < ZOOM_PRESET_VALUES.length; i++) {
      if (Math.abs(zoomLevelRef.current - ZOOM_PRESET_VALUES[i].value) < SNAP_THRESHOLD) {
        setZoomLevel(ZOOM_PRESET_VALUES[i].value);
        setActivePreset(i);
        isInteractingRef.current = false;
        scheduleHide();
        return;
      }
    }
    const VELOCITY_SCALE = 0.00004;
    const FRICTION = 0.92;
    const MIN_VELOCITY = 0.0001;
    let vel = velocityX * VELOCITY_SCALE;
    momentumZoomRef.current = zoomLevelRef.current;
    isInteractingRef.current = true;
    const tick = () => {
      vel *= FRICTION;
      if (Math.abs(vel) < MIN_VELOCITY) {
        momentumAnimRef.current = null;
        settle(momentumZoomRef.current);
        return;
      }
      const next = safeZoom(momentumZoomRef.current + vel);
      momentumZoomRef.current = next;
      setZoomLevel(next);
      hapticTickIfCrossed(next);
      momentumAnimRef.current = requestAnimationFrame(tick);
    };
    if (Math.abs(vel) > MIN_VELOCITY) {
      momentumAnimRef.current = requestAnimationFrame(tick);
    } else {
      settle(zoomLevelRef.current);
    }
  }, [scheduleHide, syncPresetHighlight, hapticTickIfCrossed]);

  const dialPanGesture = useMemo(
    () =>
      Gesture.Pan()
        .onStart(() => {
          'worklet';
          runOnJS(onDialDragStart)();
        })
        .onUpdate((e) => {
          'worklet';
          runOnJS(onDialDragUpdate)(e.translationX);
        })
        .onEnd((e) => {
          'worklet';
          runOnJS(onDialDragEnd)(e.velocityX);
        }),
    [onDialDragStart, onDialDragUpdate, onDialDragEnd],
  );

  useEffect(() => {
    if (!permission?.granted) requestPermission();
  }, [permission, requestPermission]);

  const flipCamera = () => {
    cancelMomentum();
    setFacing((f) => (f === 'front' ? 'back' : 'front'));
    setZoomLevel(ZOOM_1X);
    setActivePreset(0);
    onZoomInteraction();
  };

  const handleClose = () => {
    if (router.canGoBack()) router.back();
  };

  const handleTakePhoto = async () => {
    if (!cameraRef.current || !ready || taking) return;
    setTaking(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
      if (photo?.uri) {
        console.log(
          '[chat-camera] captured',
          photo.uri,
          photo.width,
          photo.height,
          'for patientId=',
          patientId,
          'name=',
          name,
          'clinicId=',
          clinicId,
        );
        Alert.alert('Photo captured', 'Upload will be wired next (cam-2).');
      }
    } catch (err) {
      console.error('[chat-camera] takePictureAsync error', err);
      Alert.alert('Error', 'Could not take the photo.');
    } finally {
      setTaking(false);
    }
  };

  if (!permission) {
    return (
      <GestureHandlerRootView style={styles.root}>
        <Stack.Screen options={{ headerShown: false }} />
        <StatusBar barStyle="light-content" />
        <View style={styles.center}>
          <ActivityIndicator color="#FFFFFF" />
        </View>
      </GestureHandlerRootView>
    );
  }

  if (!permission.granted) {
    return (
      <GestureHandlerRootView style={styles.root}>
        <Stack.Screen options={{ headerShown: false }} />
        <StatusBar barStyle="light-content" />
        <View style={styles.center}>
          <View style={styles.permCard}>
            <Ionicons name="camera" size={28} color="#FFFFFF" />
            <Text style={styles.permTitle}>Camera access required</Text>
            <Text style={styles.permSub}>
              Allow camera access to take a photo for this conversation.
            </Text>
            <Pressable style={styles.permBtn} onPress={requestPermission}>
              <Text style={styles.permBtnText}>Grant Permission</Text>
            </Pressable>
            <Pressable style={styles.permClose} onPress={handleClose}>
              <Text style={styles.permCloseText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="light-content" />

      <CameraView
        key={facing}
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing={facing}
        mode="picture"
        zoom={zoomLevel}
        onCameraReady={() => setReady(true)}
      />

      <GestureDetector gesture={pinchGesture}>
        <View style={StyleSheet.absoluteFill} pointerEvents="box-only" />
      </GestureDetector>

      <Pressable
        onPress={handleClose}
        style={[styles.closeBtn, { top: insets.top + 12 }]}
        hitSlop={10}
      >
        <Ionicons name="close" size={26} color="#FFFFFF" />
      </Pressable>

      <Pressable
        onPress={flipCamera}
        style={[styles.flipBtn, { bottom: insets.bottom + 36 }]}
        hitSlop={10}
      >
        <Ionicons name="camera-reverse" size={26} color="#FFFFFF" />
      </Pressable>

      <Animated.View
        style={[styles.dialContainer, zoomUiAnimatedStyle, { bottom: insets.bottom + 150 }]}
        pointerEvents="box-none"
      >
        <Animated.View style={[styles.dialReadout, zoomTextAnimatedStyle]}>
          <Text style={styles.dialReadoutText}>
            {zoomToDisplayLabel(zoomLevel)}x
          </Text>
        </Animated.View>

        <Animated.View style={[styles.dialIndicator, arrowAnimatedStyle]} pointerEvents="none">
          <View style={styles.trailGlow} />
          <Svg width={12} height={10} viewBox="0 0 12 10">
            <SvgText
              x={6}
              y={9}
              fontSize={10}
              fill="#FFD700"
              textAnchor="middle"
            >
              ▼
            </SvgText>
          </Svg>
        </Animated.View>

        <GestureDetector gesture={dialPanGesture}>
          <View style={styles.dialTrack}>
            <Svg
              width={DIAL_WIDTH}
              height={DIAL_ARC_RADIUS * 2}
              viewBox={`${-DIAL_WIDTH / 2} 0 ${DIAL_WIDTH} ${DIAL_ARC_RADIUS * 2}`}
              style={{ position: 'absolute', top: 0 }}
            >
              <G rotation={-zoomToAngle(zoomLevel)} origin={`0,${DIAL_CENTER_Y}`}>
                {DIAL_TICKS.map((tick, idx) => (
                  <G
                    key={idx}
                    rotation={tick.angle}
                    origin={`0,${DIAL_CENTER_Y}`}
                  >
                    <Line
                      x1={0}
                      y1={0}
                      x2={0}
                      y2={tick.height}
                      stroke={tick.isLabel ? '#FFD700' : '#FFFFFF'}
                      strokeWidth={tick.isLabel ? 2 : 1}
                      opacity={tick.isLabel ? 1 : 0.6}
                    />
                    {tick.isLabel && tick.label && (
                      <SvgText
                        x={0}
                        y={tick.height + 12}
                        fontSize={10}
                        fill="#FFD700"
                        textAnchor="middle"
                        fontWeight="700"
                      >
                        {tick.label}
                      </SvgText>
                    )}
                  </G>
                ))}
              </G>
            </Svg>
          </View>
        </GestureDetector>

        <View style={styles.zoomPresetsRow}>
          {ZOOM_PRESET_VALUES.map((preset, index) => {
            const active = index === activePreset;
            return (
              <Pressable
                key={preset.label}
                onPress={() => {
                  setZoomLevel(preset.value);
                  setActivePreset(index);
                  hapticTap();
                  onZoomInteraction();
                }}
                style={[
                  styles.zoomPresetButton,
                  active && styles.zoomPresetButtonActive,
                ]}
                hitSlop={6}
              >
                <Text
                  style={[
                    styles.zoomPresetText,
                    active && styles.zoomPresetTextActive,
                  ]}
                >
                  {preset.label}x
                </Text>
              </Pressable>
            );
          })}
        </View>
      </Animated.View>

      <View
        style={[styles.captureButtonContainer, { bottom: insets.bottom + 28 }]}
        pointerEvents="box-none"
      >
        <Pressable onPress={handleTakePhoto} disabled={!ready || taking}>
          <View style={styles.captureOuter}>
            <View style={styles.captureInnerButton} />
          </View>
        </Pressable>
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000000' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },

  closeBtn: {
    position: 'absolute',
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  flipBtn: {
    position: 'absolute',
    right: 22,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },

  captureButtonContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  captureOuter: {
    width: CAPTURE_OUTER,
    height: CAPTURE_OUTER,
    borderRadius: CAPTURE_OUTER / 2,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureInnerButton: {
    width: CAPTURE_INNER,
    height: CAPTURE_INNER,
    borderRadius: CAPTURE_INNER / 2,
    backgroundColor: '#FFFFFF',
  },

  dialContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  dialReadout: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.5)',
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dialReadoutText: {
    color: '#FFD700',
    fontWeight: '800',
    fontSize: 13,
  },
  dialIndicator: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: 14,
    marginBottom: -2,
  },
  trailGlow: {
    position: 'absolute',
    bottom: -2,
    width: 2,
    height: 8,
    borderRadius: 1,
    backgroundColor: '#FFD700',
    opacity: 0.5,
  },
  dialTrack: {
    width: DIAL_WIDTH,
    height: DIAL_HEIGHT,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  zoomPresetsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginTop: 10,
  },
  zoomPresetButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderWidth: 1.5,
    borderColor: 'transparent',
    minWidth: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoomPresetButtonActive: {
    borderColor: '#FFD700',
  },
  zoomPresetText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  zoomPresetTextActive: {
    color: '#FFD700',
  },

  permCard: {
    width: '100%',
    maxWidth: 360,
    padding: 22,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    gap: 10,
  },
  permTitle: { color: '#FFFFFF', fontSize: 17, fontWeight: '800' },
  permSub: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 13.5,
    textAlign: 'center',
    lineHeight: 19,
  },
  permBtn: {
    marginTop: 8,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#1E6FD9',
  },
  permBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  permClose: { marginTop: 4, paddingHorizontal: 12, paddingVertical: 8 },
  permCloseText: { color: 'rgba(255,255,255,0.7)', fontSize: 14, fontWeight: '600' },
});
