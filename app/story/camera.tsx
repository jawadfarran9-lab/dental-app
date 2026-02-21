import { Ionicons } from '@expo/vector-icons';
import { CameraType, CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
    Animated,
    Dimensions,
    Linking,
    Pressable,
    StyleSheet,
    Text,
    TouchableOpacity,
    useColorScheme,
    View,
} from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import { runOnJS, useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import { useStorySettings } from '../../src/context/StorySettingsContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type ContentMode = 'post' | 'story' | 'reel';
type FlashMode = 'off' | 'on' | 'auto';

export default function CameraScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { settings } = useStorySettings();

  // Camera refs and permissions
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();

  // Camera state
  const [facing, setFacing] = useState<CameraType>(
    settings.defaultFrontCamera ? 'front' : 'back'
  );
  const [flashMode, setFlashMode] = useState<FlashMode>('off');
  const [zoom, setZoom] = useState(0);
  const [showZoomIndicator, setShowZoomIndicator] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isHandsFreeMode, setIsHandsFreeMode] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false); // True when video pipeline is ready (mode="video")

  // Zoom indicator timer
  const zoomIndicatorTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Recording timer state
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordingProgress, setRecordingProgress] = useState(0); // 0 to 1
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLongPressRef = useRef(false);

  // Reanimated shared values for smooth zoom
  const zoomValue = useSharedValue(0);
  const baseZoomValue = useSharedValue(0);

  // Content mode state
  const [contentMode, setContentMode] = useState<ContentMode>(
    (settings.contentType as ContentMode) || 'story'
  );
  
  // Get max recording duration based on content mode
  const getMaxRecordingDuration = useCallback(() => {
    switch (contentMode) {
      case 'reel':
        return 60; // 60 seconds for reels
      case 'story':
        return 15; // 15 seconds for stories
      case 'post':
        return 60; // 60 seconds for posts
      default:
        return 15;
    }
  }, [contentMode]);

  // Side toolbar state
  const [isToolbarExpanded, setIsToolbarExpanded] = useState(true);
  const toolbarAnimation = useRef(new Animated.Value(1)).current;
  const toolsOnLeft = settings.cameraToolsSide === 'left';

  // Recording animation
  const recordingPulse = useRef(new Animated.Value(1)).current;

  // Colors
  const colors = {
    background: '#000',
    text: '#FFF',
    textSecondary: 'rgba(255,255,255,0.7)',
    accent: '#0095F6',
    captureRing: '#FFF',
    captureInner: '#FFF',
    recordingRed: '#FF3B30',
    toolbarBg: 'rgba(0,0,0,0.3)',
    modeActive: '#FFF',
    modeInactive: 'rgba(255,255,255,0.5)',
  };

  // Toggle toolbar expansion
  const toggleToolbar = useCallback(() => {
    const toValue = isToolbarExpanded ? 0 : 1;
    Animated.spring(toolbarAnimation, {
      toValue,
      useNativeDriver: true,
      friction: 8,
    }).start();
    setIsToolbarExpanded(!isToolbarExpanded);
  }, [isToolbarExpanded, toolbarAnimation]);

  // Start recording pulse animation
  const startRecordingAnimation = useCallback(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(recordingPulse, {
          toValue: 1.2,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(recordingPulse, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [recordingPulse]);

  // Stop recording pulse animation
  const stopRecordingAnimation = useCallback(() => {
    recordingPulse.stopAnimation();
    recordingPulse.setValue(1);
  }, [recordingPulse]);

  // Start recording timer with progress tracking
  const startRecordingTimer = useCallback(() => {
    setRecordingTime(0);
    setRecordingProgress(0);
    const maxDuration = getMaxRecordingDuration();
    const startTime = Date.now();
    
    recordingTimerRef.current = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000;
      const newProgress = Math.min(elapsed / maxDuration, 1);
      
      setRecordingTime(Math.floor(elapsed));
      setRecordingProgress(newProgress);
      
      // Auto-stop is handled by recordAsync's maxDuration
    }, 50); // Update every 50ms for smooth animation
  }, [getMaxRecordingDuration]);

  // Stop recording timer
  const stopRecordingTimer = useCallback(() => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    setRecordingTime(0);
    setRecordingProgress(0);
  }, []);

  // Format recording time as M:SS
  const formatRecordingTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
    };
  }, []);

  // Update zoom state from gesture (called from worklet)
  const updateZoomState = useCallback((newZoom: number) => {
    setZoom(newZoom);
    setShowZoomIndicator(true);
    
    // Clear existing timer
    if (zoomIndicatorTimer.current) {
      clearTimeout(zoomIndicatorTimer.current);
    }
    
    // Hide indicator after 1.5 seconds of no activity
    zoomIndicatorTimer.current = setTimeout(() => {
      setShowZoomIndicator(false);
    }, 1500);
  }, []);

  // Handle zoom gesture - isolated pinch that won't interfere with navigation
  const pinchGesture = Gesture.Pinch()
    .onStart(() => {
      baseZoomValue.value = zoomValue.value;
    })
    .onUpdate((event) => {
      // Calculate new zoom: scale of 1 = no change, >1 = zoom in, <1 = zoom out
      // Map pinch scale to zoom value (0-1 range for camera)
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
      router.replace('/(tabs)/create');
    }
  }, [router]);

  // Toggle camera facing
  const toggleCameraFacing = useCallback(() => {
    setIsCameraReady(false); // Reset ready state when switching cameras
    setFacing((current) => (current === 'back' ? 'front' : 'back'));
  }, []);

  // Toggle flash
  const toggleFlash = useCallback(() => {
    setFlashMode((current) => {
      if (current === 'off') return 'on';
      if (current === 'on') return 'auto';
      return 'off';
    });
  }, []);

  // Toggle mute
  const toggleMute = useCallback(() => {
    setIsMuted((current) => !current);
  }, []);

  // Start video recording
  const startVideoRecording = useCallback(async () => {
    if (!cameraRef.current || isRecording || isCapturing) return;
    
    // Camera must be ready (mode="video" means video pipeline is initialized)
    if (!isCameraReady) {
      return;
    }

    setIsRecording(true);
    startRecordingAnimation();
    startRecordingTimer();

    try {
      const maxDuration = getMaxRecordingDuration();
      const video = await cameraRef.current.recordAsync({
        maxDuration, // Dynamic based on content mode
      });

      // Recording stopped (either by user or max duration)
      if (video) {
        router.push({
          pathname: '/story/edit',
          params: {
            uri: video.uri,
            mediaType: 'video',
            contentMode,
            captureTime: new Date().toISOString(),
          },
        });
      }
    } catch (error) {
      console.error('Failed to record video:', error);
    } finally {
      setIsRecording(false);
      stopRecordingAnimation();
      stopRecordingTimer();
    }
  }, [contentMode, isRecording, isCapturing, isCameraReady, router, startRecordingAnimation, stopRecordingAnimation, startRecordingTimer, stopRecordingTimer, getMaxRecordingDuration]);

  // Stop video recording
  const stopVideoRecording = useCallback(() => {
    if (cameraRef.current && isRecording) {
      cameraRef.current.stopRecording();
    }
  }, [isRecording]);

  // Handle short tap (photo capture)
  const handlePhotoCapture = useCallback(async () => {
    if (!cameraRef.current || isCapturing || isRecording) return;
    
    // Wait for camera to be ready
    if (!isCameraReady) {
      return;
    }

    setIsCapturing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.9,
        skipProcessing: false,
      });

      if (photo) {
        router.push({
          pathname: '/story/edit',
          params: {
            uri: photo.uri,
            width: photo.width,
            height: photo.height,
            mediaType: 'photo',
            contentMode,
            captureTime: new Date().toISOString(),
          },
        });
      }
    } catch (error) {
      console.error('Failed to capture photo:', error);
    } finally {
      setIsCapturing(false);
    }
  }, [contentMode, isCapturing, isRecording, isCameraReady, router]);

  // Handle capture button press in
  const handleCaptureButtonPressIn = useCallback(() => {
    // For photos, just need camera ready. For video, need video ready.
    if (!isCameraReady) return;
    
    isLongPressRef.current = false;

    // For reel mode, start recording on tap (camera ready = video ready in mode="video")
    if (contentMode === 'reel') {
      if (isRecording) {
        // Already recording - will stop on release
        return;
      }
      // Start recording immediately for reels
      startVideoRecording();
      return;
    }

    // For story/post modes, start long-press timer for video
    longPressTimerRef.current = setTimeout(() => {
      isLongPressRef.current = true;
      // Start video recording after 300ms hold
      startVideoRecording();
    }, 300);
  }, [contentMode, isRecording, isCameraReady, startVideoRecording]);

  // Handle capture button press out
  const handleCaptureButtonPressOut = useCallback(() => {
    // Clear long-press timer
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    // If recording, stop it
    if (isRecording) {
      stopVideoRecording();
      return;
    }

    // If it was a short tap and not in reel mode, take photo
    if (!isLongPressRef.current && contentMode !== 'reel') {
      handlePhotoCapture();
    }
  }, [isRecording, contentMode, stopVideoRecording, handlePhotoCapture]);

  // Legacy capture handler for hands-free mode
  const handleCapture = useCallback(async () => {
    if (!cameraRef.current || isCapturing || !isCameraReady) return;

    // For video modes (reel) or when in hands-free, toggle recording
    if (contentMode === 'reel' || isHandsFreeMode) {
      if (isRecording) {
        stopVideoRecording();
      } else {
        startVideoRecording();
      }
      return;
    }

    // For photo modes (post, story)
    handlePhotoCapture();
  }, [contentMode, isCapturing, isRecording, isHandsFreeMode, isCameraReady, stopVideoRecording, startVideoRecording, handlePhotoCapture]);

  // Handle tool press
  const handleToolPress = useCallback((tool: string) => {
    switch (tool) {
      case 'create':
        // Text-only story mode - navigate to text editor
        router.push('/story/text-editor' as any);
        break;
      case 'boomerang':
        // Boomerang mode - navigate to boomerang camera
        router.push('/story/boomerang' as any);
        break;
      case 'layout':
        // Multi-photo layout mode - navigate to layout selector
        router.push('/story/layout' as any);
        break;
      case 'hands-free':
        // Hands-free recording mode - toggle and auto-start recording
        setIsHandsFreeMode((prev) => !prev);
        if (!isHandsFreeMode && contentMode === 'reel') {
          // Auto-start recording in hands-free mode
          setIsRecording(true);
          startRecordingAnimation();
        }
        break;
    }
  }, [contentMode, router, isHandsFreeMode, startRecordingAnimation]);

  // Open settings
  const openSettings = useCallback(() => {
    router.push('/settings/story-settings' as any);
  }, [router]);

  // Handle camera ready - with mode="video", this means video pipeline is ready
  // Both takePictureAsync() and recordAsync() are now available
  const handleCameraReady = useCallback(() => {
    setIsCameraReady(true);
  }, []);

  // Permission not determined yet
  if (!permission) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.permissionContainer}>
          <Ionicons name="camera" size={64} color={colors.textSecondary} />
          <Text style={[styles.permissionTitle, { color: colors.text }]}>
            Loading Camera...
          </Text>
        </View>
      </View>
    );
  }

  // Permission denied
  if (!permission.granted) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <TouchableOpacity
          style={[styles.closeButton, { top: insets.top + 12 }]}
          onPress={handleClose}
        >
          <Ionicons name="close" size={28} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.permissionContainer}>
          <Ionicons name="camera-outline" size={64} color={colors.textSecondary} />
          <Text style={[styles.permissionTitle, { color: colors.text }]}>
            Camera Access Required
          </Text>
          <Text style={[styles.permissionText, { color: colors.textSecondary }]}>
            To create stories and reels, please allow camera access.
          </Text>

          {permission.canAskAgain ? (
            <TouchableOpacity
              style={[styles.permissionButton, { backgroundColor: colors.accent }]}
              onPress={requestPermission}
            >
              <Text style={styles.permissionButtonText}>Allow Camera Access</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.permissionButton, { backgroundColor: colors.accent }]}
              onPress={() => Linking.openSettings()}
            >
              <Text style={styles.permissionButtonText}>Open Settings</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  // Flash icon based on mode
  const getFlashIcon = () => {
    switch (flashMode) {
      case 'on':
        return 'flash';
      case 'auto':
        return 'flash-outline';
      default:
        return 'flash-off';
    }
  };

  // Side toolbar tools
  const sideTools = [
    { id: 'create', icon: 'Aa', label: 'Create' },
    { id: 'boomerang', icon: '∞', label: 'Boomerang' },
    { id: 'layout', icon: '⬜', label: 'Layout' },
    { id: 'hands-free', icon: '👐', label: 'Hands-free' },
  ];

  return (
    <GestureHandlerRootView style={styles.container}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Camera View with Pinch-to-Zoom - Always in video mode for reliable recording */}
        <GestureDetector gesture={pinchGesture}>
          <View style={StyleSheet.absoluteFill}>
            <CameraView
              ref={cameraRef}
              style={StyleSheet.absoluteFill}
              facing={facing}
              flash={flashMode}
              zoom={zoom}
              mode="video"
              mute={isMuted}
              enableTorch={flashMode === 'on' && facing === 'back'}
              onCameraReady={handleCameraReady}
            />
          </View>
        </GestureDetector>

        {/* Camera loading indicator */}
        {!isCameraReady && (
          <View style={styles.cameraLoadingOverlay}>
            <View style={styles.cameraLoadingIndicator}>
              <Ionicons name="camera" size={24} color="rgba(255,255,255,0.8)" />
              <Text style={styles.cameraLoadingText}>Initializing camera...</Text>
            </View>
          </View>
        )}

        {/* Top Controls */}
        <View style={[styles.topControls, { paddingTop: insets.top + 12 }]}>
          {/* Close Button */}
          <TouchableOpacity
            style={styles.topButton}
            onPress={handleClose}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close" size={28} color={colors.text} />
          </TouchableOpacity>

          {/* Top Right Controls */}
          <View style={styles.topRightControls}>
            {/* Flash Toggle */}
            <TouchableOpacity
              style={styles.topButton}
              onPress={toggleFlash}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name={getFlashIcon()} size={24} color={colors.text} />
            </TouchableOpacity>

            {/* Settings */}
            <TouchableOpacity
              style={styles.topButton}
              onPress={openSettings}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="settings-outline" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Side Toolbar */}
        <Animated.View
          style={[
            styles.sideToolbar,
            toolsOnLeft ? styles.sideToolbarLeft : styles.sideToolbarRight,
            {
              opacity: toolbarAnimation,
              transform: [
                {
                  translateX: toolbarAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [toolsOnLeft ? -60 : 60, 0],
                  }),
                },
              ],
            },
          ]}
        >
          {sideTools.map((tool) => (
            <TouchableOpacity
              key={tool.id}
              style={styles.sideToolButton}
              onPress={() => handleToolPress(tool.id)}
            >
              <View style={[
                styles.sideToolIcon,
                tool.id === 'hands-free' && isHandsFreeMode && styles.sideToolIconActive,
              ]}>
                <Text style={styles.sideToolIconText}>{tool.icon}</Text>
              </View>
              <Text style={[
                styles.sideToolLabel,
                tool.id === 'hands-free' && isHandsFreeMode && styles.sideToolLabelActive,
              ]}>
                {tool.label}
              </Text>
            </TouchableOpacity>
          ))}

          {/* Expand/Collapse Button */}
          <TouchableOpacity
            style={styles.sideToolButton}
            onPress={toggleToolbar}
          >
            <Ionicons
              name={isToolbarExpanded ? 'chevron-up' : 'chevron-down'}
              size={20}
              color={colors.text}
            />
          </TouchableOpacity>
        </Animated.View>

        {/* Collapse indicator when toolbar is hidden */}
        {!isToolbarExpanded && (
          <TouchableOpacity
            style={[
              styles.expandButton,
              toolsOnLeft ? styles.expandButtonLeft : styles.expandButtonRight,
            ]}
            onPress={toggleToolbar}
          >
            <Ionicons name="chevron-down" size={20} color={colors.text} />
          </TouchableOpacity>
        )}

        {/* Bottom Controls */}
        <View style={[styles.bottomControls, { paddingBottom: insets.bottom + 20 }]}>
          {/* Content Mode Switcher */}
          <View style={styles.modeSwitcher}>
            {(['post', 'story', 'reel'] as ContentMode[]).map((mode) => (
              <TouchableOpacity
                key={mode}
                style={styles.modeButton}
                onPress={() => setContentMode(mode)}
              >
                <Text
                  style={[
                    styles.modeText,
                    {
                      color:
                        contentMode === mode
                          ? colors.modeActive
                          : colors.modeInactive,
                      fontWeight: contentMode === mode ? '700' : '500',
                    },
                  ]}
                >
                  {mode.toUpperCase()}
                </Text>
                {contentMode === mode && (
                  <View style={styles.modeIndicator} />
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* Capture Row */}
          <View style={styles.captureRow}>
            {/* Mute Button (left) */}
            <TouchableOpacity
              style={styles.sideActionButton}
              onPress={toggleMute}
            >
              <Ionicons
                name={isMuted ? 'volume-mute' : 'volume-high'}
                size={26}
                color={colors.text}
              />
            </TouchableOpacity>

            {/* Capture Button with Circular Progress (center) */}
            <View style={styles.captureButtonContainer}>
              {/* Circular Progress Ring - only visible when recording */}
              {isRecording && (
                <View style={styles.progressRingContainer}>
                  <Svg width={96} height={96} style={styles.progressRingSvg}>
                    {/* Background circle */}
                    <Circle
                      cx={48}
                      cy={48}
                      r={44}
                      stroke="rgba(255,255,255,0.3)"
                      strokeWidth={4}
                      fill="transparent"
                    />
                    {/* Progress circle */}
                    <Circle
                      cx={48}
                      cy={48}
                      r={44}
                      stroke={colors.recordingRed}
                      strokeWidth={4}
                      fill="transparent"
                      strokeDasharray={2 * Math.PI * 44}
                      strokeDashoffset={2 * Math.PI * 44 * (1 - recordingProgress)}
                      strokeLinecap="round"
                      transform="rotate(-90 48 48)"
                    />
                  </Svg>
                </View>
              )}
              
              <Animated.View
                style={[
                  styles.captureButtonOuter,
                  isRecording && {
                    transform: [{ scale: recordingPulse }],
                  },
                  !isCameraReady && styles.captureButtonDisabled,
                ]}
              >
                <Pressable
                  style={[
                    styles.captureButton,
                    {
                      borderColor: isRecording ? colors.recordingRed : colors.captureRing,
                      opacity: isCameraReady ? 1 : 0.5,
                    },
                  ]}
                  onPressIn={handleCaptureButtonPressIn}
                  onPressOut={handleCaptureButtonPressOut}
                  disabled={isCapturing || !isCameraReady}
                >
                  <Animated.View
                    style={[
                      styles.captureButtonInner,
                      {
                        backgroundColor: isRecording
                          ? colors.recordingRed
                          : colors.captureInner,
                        borderRadius: isRecording ? 8 : 32,
                        width: isRecording ? 32 : 64,
                        height: isRecording ? 32 : 64,
                      },
                    ]}
                  />
                </Pressable>
              </Animated.View>
            </View>

            {/* Switch Camera Button (right) */}
            <TouchableOpacity
              style={styles.sideActionButton}
              onPress={toggleCameraFacing}
            >
              <Ionicons name="camera-reverse-outline" size={28} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Mode hint */}
          <Text style={styles.modeHint}>
            {isHandsFreeMode
              ? isRecording
                ? 'Tap anywhere to stop'
                : 'Hands-free: Tap to start'
              : contentMode === 'reel'
                ? isRecording
                  ? 'Release to stop recording'
                  : 'Hold to record'
                : isRecording
                  ? 'Release to stop recording'
                  : 'Tap for photo • Hold for video'}
          </Text>
        </View>

        {/* Hands-free indicator */}
        {isHandsFreeMode && (
          <View style={[styles.handsFreeIndicator, { top: insets.top + 60 }]}>
            <Text style={styles.handsFreeText}>👐 HANDS-FREE</Text>
          </View>
        )}

        {/* Recording indicator with timer */}
        {isRecording && (
          <View style={[styles.recordingIndicator, { top: insets.top + (isHandsFreeMode ? 100 : 60) }]}>
            <View style={styles.recordingDotContainer}>
              <Animated.View style={[styles.recordingDot, { transform: [{ scale: recordingPulse }] }]} />
            </View>
            <Text style={styles.recordingText}>REC</Text>
            <View style={styles.recordingTimerContainer}>
              <Text style={styles.recordingTimer}>{formatRecordingTime(recordingTime)}</Text>
            </View>
          </View>
        )}

        {/* Zoom indicator - shows when pinching */}
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
  
  // Permission screens
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  permissionTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginTop: 20,
    marginBottom: 12,
    textAlign: 'center',
  },
  permissionText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  permissionButton: {
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
  topRightControls: {
    flexDirection: 'row',
    gap: 12,
  },

  // Side toolbar
  sideToolbar: {
    position: 'absolute',
    top: '30%',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.4)',
    gap: 8,
  },
  sideToolbarLeft: {
    left: 12,
  },
  sideToolbarRight: {
    right: 12,
  },
  sideToolButton: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  sideToolIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  sideToolIconActive: {
    backgroundColor: '#0095F6',
  },
  sideToolIconText: {
    fontSize: 18,
    color: '#FFF',
    fontWeight: '600',
  },
  sideToolLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
  },
  sideToolLabelActive: {
    color: '#0095F6',
    fontWeight: '600',
  },
  expandButton: {
    position: 'absolute',
    top: '30%',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  expandButtonLeft: {
    left: 12,
  },
  expandButtonRight: {
    right: 12,
  },

  // Bottom controls
  bottomControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 20,
  },

  // Mode switcher
  modeSwitcher: {
    flexDirection: 'row',
    marginBottom: 24,
    gap: 24,
  },
  modeButton: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  modeText: {
    fontSize: 14,
    letterSpacing: 1,
  },
  modeIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFF',
    marginTop: 6,
  },

  // Capture row
  captureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginBottom: 12,
  },
  sideActionButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 30,
  },
  captureButtonContainer: {
    position: 'relative',
    width: 96,
    height: 96,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressRingContainer: {
    position: 'absolute',
    width: 96,
    height: 96,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressRingSvg: {
    position: 'absolute',
  },
  captureButtonOuter: {
    padding: 4,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  captureButtonInner: {
    borderRadius: 32,
  },

  // Mode hint
  modeHint: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 8,
  },

  // Recording indicator
  recordingIndicator: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignSelf: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginHorizontal: 'auto',
    maxWidth: 160,
  },
  recordingDotContainer: {
    width: 14,
    height: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FF3B30',
  },
  recordingText: {
    color: '#FF3B30',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
  },
  recordingTimerContainer: {
    minWidth: 50,
    alignItems: 'flex-end',
  },
  recordingTimer: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },

  // Hands-free indicator
  handsFreeIndicator: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  handsFreeText: {
    color: '#0095F6',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
    backgroundColor: 'rgba(0,149,246,0.2)',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 16,
    overflow: 'hidden',
  },

  // Zoom indicator
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

  // Camera loading state
  cameraLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    zIndex: 5,
  },
  cameraLoadingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 24,
  },
  cameraLoadingText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    fontWeight: '500',
  },
  captureButtonDisabled: {
    opacity: 0.5,
  },
});
