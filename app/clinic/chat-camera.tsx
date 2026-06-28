import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
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
import { runOnJS } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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

  const onPinchStart = useCallback(() => {
    zoomAtPinchStartRef.current = zoomLevel;
  }, [zoomLevel]);

  const onPinchUpdate = useCallback((delta: number) => {
    setZoomLevel(safeZoom(zoomAtPinchStartRef.current + delta));
    setActivePreset(-1);
  }, []);

  const pinchGesture = useMemo(
    () =>
      Gesture.Pinch()
        .onStart(() => {
          'worklet';
          runOnJS(onPinchStart)();
        })
        .onUpdate((e) => {
          'worklet';
          runOnJS(onPinchUpdate)((e.scale - 1) * 0.3);
        })
        .onFinalize(() => {
          'worklet';
        }),
    [onPinchStart, onPinchUpdate],
  );

  useEffect(() => {
    if (!permission?.granted) requestPermission();
  }, [permission, requestPermission]);

  const flipCamera = () => {
    setFacing((f) => (f === 'front' ? 'back' : 'front'));
    setZoomLevel(ZOOM_1X);
    setActivePreset(0);
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

      <View
        style={[styles.zoomRow, { bottom: insets.bottom + 124 }]}
        pointerEvents="box-none"
      >
        {ZOOM_PRESET_VALUES.map((preset, index) => {
          const active = index === activePreset;
          return (
            <Pressable
              key={preset.label}
              onPress={() => {
                setZoomLevel(preset.value);
                setActivePreset(index);
              }}
              style={[styles.zoomPill, active && styles.zoomPillActive]}
              hitSlop={6}
            >
              <Text style={[styles.zoomPillText, active && styles.zoomPillTextActive]}>
                {preset.label}x
              </Text>
            </Pressable>
          );
        })}
      </View>

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

  zoomRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignSelf: 'center',
    justifyContent: 'center',
    gap: 8,
    zIndex: 10,
  },
  zoomPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 40,
  },
  zoomPillActive: {
    backgroundColor: 'rgba(255,255,255,0.95)',
  },
  zoomPillText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  zoomPillTextActive: {
    color: '#000000',
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
