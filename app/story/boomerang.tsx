import { Ionicons } from '@expo/vector-icons';
import { CameraType, CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
    Animated,
    Dimensions,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import { runOnJS, useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BOOMERANG_DURATION = 1500; // 1.5 seconds

export default function BoomerangScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();

  // State
  const [facing, setFacing] = useState<CameraType>('back');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingProgress, setRecordingProgress] = useState(0);
  const [zoom, setZoom] = useState(0);
  const [showZoomIndicator, setShowZoomIndicator] = useState(false);

  // Zoom shared values
  const zoomValue = useSharedValue(0);
  const baseZoomValue = useSharedValue(0);
  const zoomIndicatorTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Animation
  const progressAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Update zoom state
  const updateZoomState = useCallback((newZoom: number) => {
    setZoom(newZoom);
    setShowZoomIndicator(true);
    if (zoomIndicatorTimer.current) clearTimeout(zoomIndicatorTimer.current);
    zoomIndicatorTimer.current = setTimeout(() => setShowZoomIndicator(false), 1500);
  }, []);

  // Pinch gesture for zoom
  const pinchGesture = Gesture.Pinch()
    .onStart(() => {
      baseZoomValue.value = zoomValue.value;
    })
    .onUpdate((event) => {
      const scaleDelta = (event.scale - 1) * 0.5;
      const newZoom = Math.min(Math.max(baseZoomValue.value + scaleDelta, 0), 1);
      zoomValue.value = newZoom;
      runOnJS(updateZoomState)(newZoom);
    })
    .onEnd(() => {
      baseZoomValue.value = zoomValue.value;
    });

  // Handle close
  const handleClose = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/story/camera');
    }
  }, [router]);

  // Toggle camera
  const toggleCamera = useCallback(() => {
    setFacing((prev) => (prev === 'back' ? 'front' : 'back'));
  }, []);

  // Start recording boomerang
  const startRecording = useCallback(() => {
    setIsRecording(true);
    setRecordingProgress(0);
    progressAnim.setValue(0);

    // Animate progress
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: BOOMERANG_DURATION,
      useNativeDriver: false,
    }).start(() => {
      // Recording complete
      setIsRecording(false);
      
      // Navigate to edit with placeholder
      router.push({
        pathname: '/story/edit',
        params: {
          mediaType: 'boomerang',
          uri: '', // Would be actual video URI
          duration: BOOMERANG_DURATION.toString(),
        },
      });
    });

    // Pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [progressAnim, pulseAnim, router]);

  // Stop recording
  const stopRecording = useCallback(() => {
    setIsRecording(false);
    progressAnim.stopAnimation();
    pulseAnim.stopAnimation();
    pulseAnim.setValue(1);
  }, [progressAnim, pulseAnim]);

  // Update progress state for UI
  useEffect(() => {
    const listener = progressAnim.addListener(({ value }) => {
      setRecordingProgress(value);
    });
    return () => progressAnim.removeListener(listener);
  }, [progressAnim]);

  // Permission screens
  if (!permission) {
    return (
      <View style={styles.container}>
        <View style={styles.permissionContainer}>
          <Ionicons name="infinite" size={64} color="rgba(255,255,255,0.5)" />
          <Text style={styles.permissionTitle}>Loading Camera...</Text>
        </View>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <TouchableOpacity
          style={[styles.closeButton, { top: insets.top + 12 }]}
          onPress={handleClose}
        >
          <Ionicons name="close" size={28} color="#FFF" />
        </TouchableOpacity>

        <View style={styles.permissionContainer}>
          <Ionicons name="infinite" size={64} color="rgba(255,255,255,0.5)" />
          <Text style={styles.permissionTitle}>Camera Access Required</Text>
          <Text style={styles.permissionText}>
            Allow camera access to create boomerangs.
          </Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>Allow Camera</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <GestureHandlerRootView style={styles.container}>
      <View style={styles.container}>
        {/* Camera View with Pinch-to-Zoom */}
        <GestureDetector gesture={pinchGesture}>
          <View style={StyleSheet.absoluteFill}>
            <CameraView
              ref={cameraRef}
              style={StyleSheet.absoluteFill}
              facing={facing}
              zoom={zoom}
            />
          </View>
        </GestureDetector>

        {/* Overlay gradient */}
        <View style={styles.overlay} pointerEvents="none" />

      {/* Top Controls */}
      <View style={[styles.topControls, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity style={styles.topButton} onPress={handleClose}>
          <Ionicons name="close" size={28} color="#FFF" />
        </TouchableOpacity>

        <View style={styles.titleContainer}>
          <Ionicons name="infinite" size={24} color="#FFF" />
          <Text style={styles.title}>BOOMERANG</Text>
        </View>

        <TouchableOpacity style={styles.topButton} onPress={toggleCamera}>
          <Ionicons name="camera-reverse-outline" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* Recording Progress */}
      {isRecording && (
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
          </View>
          <Text style={styles.progressText}>
            Recording... {Math.round(recordingProgress * 100)}%
          </Text>
        </View>
      )}

      {/* Instructions */}
      <View style={styles.instructionsContainer}>
        <View style={styles.instructionsBg}>
          <Text style={styles.instructionsText}>
            Tap and hold to record a short clip that plays forward and backward
          </Text>
        </View>
      </View>

      {/* Bottom Controls */}
      <View style={[styles.bottomControls, { paddingBottom: insets.bottom + 30 }]}>
        {/* Capture Button */}
        <Animated.View style={{ transform: [{ scale: isRecording ? pulseAnim : 1 }] }}>
          <TouchableOpacity
            style={[
              styles.captureButton,
              isRecording && styles.captureButtonRecording,
            ]}
            onPressIn={startRecording}
            onPressOut={stopRecording}
            activeOpacity={0.9}
          >
            <View style={styles.captureButtonInner}>
              <Ionicons
                name="infinite"
                size={32}
                color={isRecording ? '#FF3B30' : '#FFF'}
              />
            </View>
          </TouchableOpacity>
        </Animated.View>

        <Text style={styles.hintText}>Hold to record</Text>
      </View>

      {/* Zoom indicator */}
      {showZoomIndicator && (
        <View style={styles.zoomIndicator}>
          <Text style={styles.zoomText}>{(1 + zoom * 4).toFixed(1)}x</Text>
        </View>
      )}
    </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },

  // Permission
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  permissionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFF',
    marginTop: 20,
    marginBottom: 12,
  },
  permissionText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    marginBottom: 24,
  },
  permissionButton: {
    backgroundColor: '#0095F6',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  permissionButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },

  // Top controls
  topControls: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    zIndex: 10,
  },
  topButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    left: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  title: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
  },

  // Progress
  progressContainer: {
    position: 'absolute',
    top: 120,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FF3B30',
  },
  progressText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
  },

  // Instructions
  instructionsContainer: {
    position: 'absolute',
    top: '40%',
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  instructionsBg: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  instructionsText: {
    color: '#FFF',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },

  // Bottom controls
  bottomControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  captureButtonRecording: {
    borderColor: '#FF3B30',
    backgroundColor: 'rgba(255,59,48,0.2)',
  },
  captureButtonInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  hintText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    marginTop: 16,
  },
  zoomIndicator: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  zoomText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 16,
    overflow: 'hidden',
  },
});
