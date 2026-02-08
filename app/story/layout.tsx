import { Ionicons } from '@expo/vector-icons';
import { CameraType, CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import ReAnimated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const PREVIEW_SIZE = SCREEN_WIDTH - 48;
const EDITOR_SIZE = SCREEN_WIDTH - 48;

// Image transform state for each cell
interface ImageTransform {
  scale: number;
  translateX: number;
  translateY: number;
}

// Photo with transform data
interface CellPhoto {
  uri: string;
  transform: ImageTransform;
}

// Layout options
const LAYOUT_OPTIONS = [
  {
    id: '2-horizontal',
    name: '2 Side',
    cells: 2,
    grid: [[0, 1]],
  },
  {
    id: '2-vertical',
    name: '2 Stack',
    cells: 2,
    grid: [[0], [1]],
  },
  {
    id: '3-top',
    name: '3 Top',
    cells: 3,
    grid: [[0], [1, 2]],
  },
  {
    id: '3-bottom',
    name: '3 Bottom',
    cells: 3,
    grid: [[0, 1], [2]],
  },
  {
    id: '3-left',
    name: '3 Left',
    cells: 3,
    isComplex: true,
  },
  {
    id: '4-grid',
    name: '4 Grid',
    cells: 4,
    grid: [[0, 1], [2, 3]],
  },
  {
    id: '6-grid',
    name: '6 Grid',
    cells: 6,
    grid: [[0, 1, 2], [3, 4, 5]],
  },
];

type LayoutOption = (typeof LAYOUT_OPTIONS)[0];

// Default transform
const DEFAULT_TRANSFORM: ImageTransform = {
  scale: 1,
  translateX: 0,
  translateY: 0,
};

// ============ Image Editor Modal ============
interface ImageEditorProps {
  visible: boolean;
  imageUri: string;
  initialTransform: ImageTransform;
  onSave: (transform: ImageTransform) => void;
  onCancel: () => void;
  cellIndex: number;
  totalCells: number;
}

function ImageEditorModal({
  visible,
  imageUri,
  initialTransform,
  onSave,
  onCancel,
  cellIndex,
  totalCells,
}: ImageEditorProps) {
  const insets = useSafeAreaInsets();

  // Shared values for gestures
  const scale = useSharedValue(initialTransform.scale);
  const savedScale = useSharedValue(initialTransform.scale);
  const translateX = useSharedValue(initialTransform.translateX);
  const translateY = useSharedValue(initialTransform.translateY);
  const savedTranslateX = useSharedValue(initialTransform.translateX);
  const savedTranslateY = useSharedValue(initialTransform.translateY);

  // Fit mode state
  const [fitMode, setFitMode] = useState<'fill' | 'fit'>('fill');

  // Reset to initial values when modal opens
  useEffect(() => {
    if (visible) {
      scale.value = initialTransform.scale;
      savedScale.value = initialTransform.scale;
      translateX.value = initialTransform.translateX;
      translateY.value = initialTransform.translateY;
      savedTranslateX.value = initialTransform.translateX;
      savedTranslateY.value = initialTransform.translateY;
    }
  }, [visible, initialTransform]);

  // Pinch gesture for zooming
  const pinchGesture = Gesture.Pinch()
    .onUpdate((event) => {
      scale.value = Math.min(Math.max(savedScale.value * event.scale, 0.5), 4);
    })
    .onEnd(() => {
      savedScale.value = scale.value;
    });

  // Pan gesture for moving
  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      translateX.value = savedTranslateX.value + event.translationX;
      translateY.value = savedTranslateY.value + event.translationY;
    })
    .onEnd(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  // Combine gestures
  const composedGesture = Gesture.Simultaneous(pinchGesture, panGesture);

  // Animated style for image - cast to avoid ViewStyle/ImageStyle overflow conflict
  const animatedImageStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value },
      ] as const,
    };
  });

  // Handle save
  const handleSave = useCallback(() => {
    onSave({
      scale: scale.value,
      translateX: translateX.value,
      translateY: translateY.value,
    });
  }, [onSave, scale, translateX, translateY]);

  // Reset transform
  const handleReset = useCallback(() => {
    scale.value = withSpring(1);
    savedScale.value = 1;
    translateX.value = withSpring(0);
    translateY.value = withSpring(0);
    savedTranslateX.value = 0;
    savedTranslateY.value = 0;
  }, [scale, savedScale, translateX, translateY, savedTranslateX, savedTranslateY]);

  // Zoom controls
  const handleZoomIn = useCallback(() => {
    const newScale = Math.min(scale.value + 0.25, 4);
    scale.value = withSpring(newScale);
    savedScale.value = newScale;
  }, [scale, savedScale]);

  const handleZoomOut = useCallback(() => {
    const newScale = Math.max(scale.value - 0.25, 0.5);
    scale.value = withSpring(newScale);
    savedScale.value = newScale;
  }, [scale, savedScale]);

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={editorStyles.overlay}>
        <View style={[editorStyles.container, { paddingTop: insets.top }]}>
          {/* Header */}
          <View style={editorStyles.header}>
            <TouchableOpacity style={editorStyles.headerButton} onPress={onCancel}>
              <Text style={editorStyles.cancelText}>Cancel</Text>
            </TouchableOpacity>

            <View style={editorStyles.headerCenter}>
              <Text style={editorStyles.headerTitle}>Adjust Photo</Text>
              <Text style={editorStyles.headerSubtitle}>
                Cell {cellIndex + 1} of {totalCells}
              </Text>
            </View>

            <TouchableOpacity style={editorStyles.headerButton} onPress={handleSave}>
              <Text style={editorStyles.doneText}>Done</Text>
            </TouchableOpacity>
          </View>

          {/* Instructions */}
          <View style={editorStyles.instructions}>
            <Text style={editorStyles.instructionsText}>
              Pinch to zoom • Drag to reposition
            </Text>
          </View>

          {/* Image Editor Area */}
          <View style={editorStyles.editorArea}>
            <GestureHandlerRootView style={editorStyles.gestureContainer}>
              <View style={editorStyles.imageContainer}>
                <GestureDetector gesture={composedGesture}>
                  <ReAnimated.View style={[editorStyles.imageWrapper, animatedImageStyle]}>
                    <Image
                      source={{ uri: imageUri }}
                      style={editorStyles.image}
                      resizeMode="cover"
                    />
                  </ReAnimated.View>
                </GestureDetector>

                {/* Grid overlay */}
                <View style={editorStyles.gridOverlay} pointerEvents="none">
                  <View style={editorStyles.gridLine} />
                  <View style={[editorStyles.gridLine, editorStyles.gridLineHorizontal]} />
                  <View style={[editorStyles.gridLine, { left: '66.66%' }]} />
                  <View
                    style={[
                      editorStyles.gridLine,
                      editorStyles.gridLineHorizontal,
                      { top: '66.66%' },
                    ]}
                  />
                </View>
              </View>
            </GestureHandlerRootView>
          </View>

          {/* Controls */}
          <View style={[editorStyles.controls, { paddingBottom: insets.bottom + 20 }]}>
            {/* Zoom Controls */}
            <View style={editorStyles.zoomControls}>
              <TouchableOpacity style={editorStyles.zoomButton} onPress={handleZoomOut}>
                <Ionicons name="remove" size={24} color="#FFF" />
              </TouchableOpacity>

              <View style={editorStyles.zoomLabel}>
                <Ionicons name="search" size={18} color="rgba(255,255,255,0.6)" />
                <Text style={editorStyles.zoomText}>Zoom</Text>
              </View>

              <TouchableOpacity style={editorStyles.zoomButton} onPress={handleZoomIn}>
                <Ionicons name="add" size={24} color="#FFF" />
              </TouchableOpacity>
            </View>

            {/* Action Buttons */}
            <View style={editorStyles.actionButtons}>
              <TouchableOpacity style={editorStyles.actionButton} onPress={handleReset}>
                <Ionicons name="refresh" size={22} color="#FFF" />
                <Text style={editorStyles.actionButtonText}>Reset</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const editorStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerButton: {
    minWidth: 60,
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFF',
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 2,
  },
  cancelText: {
    fontSize: 16,
    color: '#FFF',
  },
  doneText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0095F6',
    textAlign: 'right',
  },
  instructions: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  instructionsText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
  },
  editorArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  gestureContainer: {
    width: EDITOR_SIZE,
    height: EDITOR_SIZE,
  },
  imageContainer: {
    width: EDITOR_SIZE,
    height: EDITOR_SIZE,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#111',
  },
  imageWrapper: {
    width: '100%',
    height: '100%',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  gridOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    overflow: 'hidden',
  },
  gridLine: {
    position: 'absolute',
    left: '33.33%',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  gridLineHorizontal: {
    left: 0,
    right: 0,
    top: '33.33%',
    bottom: 'auto',
    width: 'auto',
    height: 1,
  },
  controls: {
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  zoomControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    marginBottom: 20,
  },
  zoomButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  zoomLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  zoomText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 24,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 15,
    color: '#FFF',
    fontWeight: '500',
  },
});

// ============ Mini Layout Preview ============
function LayoutPreviewMini({
  layout,
  isSelected,
  onPress,
}: {
  layout: LayoutOption;
  isSelected: boolean;
  onPress: () => void;
}) {
  const size = 60;

  const renderCells = () => {
    if (layout.isComplex) {
      return (
        <View style={miniStyles.complexLayout}>
          <View style={[miniStyles.complexLeft, miniStyles.cell]} />
          <View style={miniStyles.complexRight}>
            <View style={[miniStyles.complexRightTop, miniStyles.cell]} />
            <View style={[miniStyles.complexRightBottom, miniStyles.cell]} />
          </View>
        </View>
      );
    }

    return (
      <View style={miniStyles.gridContainer}>
        {layout.grid?.map((row, rowIndex) => (
          <View key={rowIndex} style={miniStyles.gridRow}>
            {row.map((_, cellIndex) => (
              <View key={cellIndex} style={miniStyles.cell} />
            ))}
          </View>
        ))}
      </View>
    );
  };

  return (
    <TouchableOpacity
      style={[
        miniStyles.container,
        { width: size, height: size },
        isSelected && miniStyles.selected,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {renderCells()}
      {isSelected && (
        <View style={miniStyles.checkmark}>
          <Ionicons name="checkmark" size={12} color="#FFF" />
        </View>
      )}
    </TouchableOpacity>
  );
}

const miniStyles = StyleSheet.create({
  container: {
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 6,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selected: {
    borderColor: '#0095F6',
    backgroundColor: 'rgba(0,149,246,0.2)',
  },
  gridContainer: {
    flex: 1,
    gap: 2,
  },
  gridRow: {
    flex: 1,
    flexDirection: 'row',
    gap: 2,
  },
  cell: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 4,
  },
  complexLayout: {
    flex: 1,
    flexDirection: 'row',
    gap: 2,
  },
  complexLeft: {
    flex: 1.5,
  },
  complexRight: {
    flex: 1,
    gap: 2,
  },
  complexRightTop: {
    flex: 1,
  },
  complexRightBottom: {
    flex: 1,
  },
  checkmark: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#0095F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

// ============ Main Layout Screen ============
export default function LayoutScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const cameraRef = useRef<CameraView>(null);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();

  // State
  const [selectedLayout, setSelectedLayout] = useState(LAYOUT_OPTIONS[0]);
  const [photos, setPhotos] = useState<(CellPhoto | null)[]>([]);
  const [activeCellIndex, setActiveCellIndex] = useState<number | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [editingCellIndex, setEditingCellIndex] = useState<number | null>(null);
  const [cameraFacing, setCameraFacing] = useState<CameraType>('back');
  const [isCapturing, setIsCapturing] = useState(false);

  // Animation refs for cells
  const cellAnimations = useRef<Animated.Value[]>([]);

  // Initialize photos array when layout changes
  useEffect(() => {
    const newPhotos = Array(selectedLayout.cells).fill(null);
    setPhotos(newPhotos);
    cellAnimations.current = Array(selectedLayout.cells)
      .fill(null)
      .map(() => new Animated.Value(1));
  }, [selectedLayout]);

  // Animate cell when photo is added
  const animateCell = useCallback((index: number) => {
    const anim = cellAnimations.current[index];
    if (anim) {
      anim.setValue(0.8);
      Animated.spring(anim, {
        toValue: 1,
        friction: 5,
        tension: 100,
        useNativeDriver: true,
      }).start();
    }
  }, []);

  // Handle close
  const handleClose = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/story/camera');
    }
  }, [router]);

  // Calculate filled count
  const filledCount = photos.filter((p) => p !== null).length;
  const totalCount = selectedLayout.cells;
  const isComplete = filledCount === totalCount;

  // Handle next - go to edit with all photos
  const handleNext = useCallback(() => {
    if (!isComplete) {
      Alert.alert(
        'Incomplete Layout',
        `Please add ${totalCount - filledCount} more photo${
          totalCount - filledCount > 1 ? 's' : ''
        } to complete your layout.`
      );
      return;
    }

    router.push({
      pathname: '/story/edit',
      params: {
        mediaType: 'layout',
        layoutId: selectedLayout.id,
        photos: JSON.stringify(photos),
      },
    });
  }, [isComplete, totalCount, filledCount, photos, selectedLayout, router]);

  // Handle cell press - show options or open editor
  const handleCellPress = useCallback(
    (index: number) => {
      const existingPhoto = photos[index];

      if (existingPhoto) {
        // Photo exists - open editor to adjust
        setEditingCellIndex(index);
        setShowEditor(true);
      } else {
        // No photo - show add options
        setActiveCellIndex(index);

        Alert.alert('Add Photo', 'Choose how to add a photo to this cell', [
          {
            text: 'Take Photo',
            onPress: () => {
              if (!cameraPermission?.granted) {
                requestCameraPermission();
                return;
              }
              setShowCamera(true);
            },
          },
          {
            text: 'Choose from Gallery',
            onPress: async () => {
              const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                quality: 1, // Full quality
                allowsEditing: false, // We'll handle editing ourselves
              });

              if (!result.canceled && result.assets[0]) {
                const newPhotos = [...photos];
                newPhotos[index] = {
                  uri: result.assets[0].uri,
                  transform: { ...DEFAULT_TRANSFORM },
                };
                setPhotos(newPhotos);
                animateCell(index);

                // Open editor immediately
                setEditingCellIndex(index);
                setShowEditor(true);
              }
              setActiveCellIndex(null);
            },
          },
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => setActiveCellIndex(null),
          },
        ]);
      }
    },
    [photos, cameraPermission, requestCameraPermission, animateCell]
  );

  // Handle camera capture
  const handleCameraCapture = useCallback(async () => {
    if (!cameraRef.current || isCapturing || activeCellIndex === null) return;

    setIsCapturing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 1, // Full quality
      });

      if (photo) {
        const newPhotos = [...photos];
        newPhotos[activeCellIndex] = {
          uri: photo.uri,
          transform: { ...DEFAULT_TRANSFORM },
        };
        setPhotos(newPhotos);
        animateCell(activeCellIndex);
        setShowCamera(false);

        // Open editor immediately
        setEditingCellIndex(activeCellIndex);
        setShowEditor(true);
        setActiveCellIndex(null);
      }
    } catch (error) {
      console.error('Failed to capture:', error);
    } finally {
      setIsCapturing(false);
    }
  }, [activeCellIndex, photos, isCapturing, animateCell]);

  // Handle editor save
  const handleEditorSave = useCallback(
    (transform: ImageTransform) => {
      if (editingCellIndex === null) return;

      const newPhotos = [...photos];
      const currentPhoto = newPhotos[editingCellIndex];
      if (currentPhoto) {
        newPhotos[editingCellIndex] = {
          ...currentPhoto,
          transform,
        };
        setPhotos(newPhotos);
      }

      setShowEditor(false);
      setEditingCellIndex(null);
    },
    [editingCellIndex, photos]
  );

  // Handle editor cancel
  const handleEditorCancel = useCallback(() => {
    setShowEditor(false);
    setEditingCellIndex(null);
  }, []);

  // Remove photo from cell
  const handleRemovePhoto = useCallback(
    (index: number) => {
      Alert.alert('Remove Photo', 'Are you sure you want to remove this photo?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            const newPhotos = [...photos];
            newPhotos[index] = null;
            setPhotos(newPhotos);
          },
        },
      ]);
    },
    [photos]
  );

  // Render a single cell in the large preview
  const renderCell = (cellIndex: number, style: any) => {
    const photo = photos[cellIndex];
    const isActive = activeCellIndex === cellIndex;
    const animation = cellAnimations.current[cellIndex];

    return (
      <TouchableOpacity
        key={cellIndex}
        style={[styles.cell, style, isActive && styles.cellActive]}
        onPress={() => handleCellPress(cellIndex)}
        onLongPress={() => photo && handleRemovePhoto(cellIndex)}
        activeOpacity={0.8}
      >
        {photo ? (
          <Animated.View
            style={[
              styles.cellImageContainer,
              animation ? { transform: [{ scale: animation }] } : undefined,
            ].filter(Boolean)}
          >
            <View style={styles.cellImageWrapper}>
              <Image
                source={{ uri: photo.uri }}
                style={[
                  styles.cellImage,
                  {
                    transform: [
                      { translateX: photo.transform.translateX * 0.3 }, // Scale down for preview
                      { translateY: photo.transform.translateY * 0.3 },
                      { scale: photo.transform.scale },
                    ],
                  },
                ]}
              />
            </View>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => {
                setEditingCellIndex(cellIndex);
                setShowEditor(true);
              }}
            >
              <Ionicons name="expand-outline" size={16} color="#FFF" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => handleRemovePhoto(cellIndex)}
            >
              <Ionicons name="close" size={16} color="#FFF" />
            </TouchableOpacity>
          </Animated.View>
        ) : (
          <View style={styles.cellEmpty}>
            <View style={styles.cellAddIcon}>
              <Ionicons name="add" size={28} color="#FFF" />
            </View>
            <Text style={styles.cellNumber}>{cellIndex + 1}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  // Render the large preview grid
  const renderLargePreview = () => {
    if (selectedLayout.isComplex) {
      return (
        <View style={styles.complexLayoutLarge}>
          {renderCell(0, styles.complexLeftCell)}
          <View style={styles.complexRightContainer}>
            {renderCell(1, styles.complexRightTopCell)}
            {renderCell(2, styles.complexRightBottomCell)}
          </View>
        </View>
      );
    }

    let cellCounter = 0;
    return (
      <View style={styles.gridContainerLarge}>
        {selectedLayout.grid?.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.gridRowLarge}>
            {row.map((_, colIndex) => {
              const currentIndex = cellCounter++;
              return renderCell(currentIndex, styles.gridCellLarge);
            })}
          </View>
        ))}
      </View>
    );
  };

  // Get current editing photo
  const editingPhoto =
    editingCellIndex !== null ? photos[editingCellIndex] : null;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={handleClose}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="close" size={28} color="#FFF" />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Layout</Text>
          <Text style={styles.photoCounter}>
            {filledCount} of {totalCount} photos
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.nextButton, !isComplete && styles.nextButtonDisabled]}
          onPress={handleNext}
        >
          <Text
            style={[
              styles.nextButtonText,
              !isComplete && styles.nextButtonTextDisabled,
            ]}
          >
            Next
          </Text>
        </TouchableOpacity>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              { width: `${(filledCount / totalCount) * 100}%` },
            ]}
          />
        </View>
      </View>

      {/* Large Preview */}
      <View style={styles.previewArea}>
        <View style={styles.previewContainer}>{renderLargePreview()}</View>
        <Text style={styles.previewHint}>
          {filledCount === 0
            ? 'Tap a cell to add a photo'
            : filledCount < totalCount
            ? 'Tap empty cells to add • Tap photos to adjust'
            : 'Tap any photo to adjust position'}
        </Text>
      </View>

      {/* Layout Selector */}
      <View style={[styles.bottomSection, { paddingBottom: insets.bottom + 16 }]}>
        <Text style={styles.sectionTitle}>Choose Layout</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.layoutsScroll}
        >
          {LAYOUT_OPTIONS.map((layout) => (
            <LayoutPreviewMini
              key={layout.id}
              layout={layout}
              isSelected={selectedLayout.id === layout.id}
              onPress={() => setSelectedLayout(layout)}
            />
          ))}
        </ScrollView>
      </View>

      {/* Camera Modal */}
      <Modal visible={showCamera} animationType="slide" presentationStyle="fullScreen">
        <View style={[styles.cameraContainer, { paddingTop: insets.top }]}>
          <CameraView ref={cameraRef} style={styles.camera} facing={cameraFacing} />

          {/* Camera Header */}
          <View style={[styles.cameraHeader, { paddingTop: insets.top + 12 }]}>
            <TouchableOpacity
              style={styles.cameraButton}
              onPress={() => {
                setShowCamera(false);
                setActiveCellIndex(null);
              }}
            >
              <Ionicons name="close" size={28} color="#FFF" />
            </TouchableOpacity>

            <Text style={styles.cameraTitle}>
              Photo {(activeCellIndex ?? 0) + 1} of {totalCount}
            </Text>

            <TouchableOpacity
              style={styles.cameraButton}
              onPress={() =>
                setCameraFacing((f) => (f === 'back' ? 'front' : 'back'))
              }
            >
              <Ionicons name="camera-reverse-outline" size={24} color="#FFF" />
            </TouchableOpacity>
          </View>

          {/* Camera Controls */}
          <View
            style={[styles.cameraControls, { paddingBottom: insets.bottom + 30 }]}
          >
            <TouchableOpacity
              style={styles.captureButton}
              onPress={handleCameraCapture}
              disabled={isCapturing}
            >
              <View style={styles.captureButtonInner} />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Image Editor Modal */}
      {editingPhoto && (
        <ImageEditorModal
          visible={showEditor}
          imageUri={editingPhoto.uri}
          initialTransform={editingPhoto.transform}
          onSave={handleEditorSave}
          onCancel={handleEditorCancel}
          cellIndex={editingCellIndex ?? 0}
          totalCells={totalCount}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
  },
  photoCounter: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 2,
  },
  nextButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#0095F6',
    borderRadius: 20,
  },
  nextButtonDisabled: {
    backgroundColor: 'rgba(0,149,246,0.4)',
  },
  nextButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  nextButtonTextDisabled: {
    opacity: 0.6,
  },

  // Progress
  progressContainer: {
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  progressTrack: {
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#0095F6',
    borderRadius: 2,
  },

  // Preview
  previewArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  previewContainer: {
    width: PREVIEW_SIZE,
    height: PREVIEW_SIZE,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  previewHint: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 16,
    textAlign: 'center',
  },

  // Grid layouts
  gridContainerLarge: {
    flex: 1,
    padding: 4,
    gap: 4,
  },
  gridRowLarge: {
    flex: 1,
    flexDirection: 'row',
    gap: 4,
  },
  gridCellLarge: {
    flex: 1,
  },

  // Complex layout (3-left)
  complexLayoutLarge: {
    flex: 1,
    flexDirection: 'row',
    padding: 4,
    gap: 4,
  },
  complexLeftCell: {
    flex: 1.5,
  },
  complexRightContainer: {
    flex: 1,
    gap: 4,
  },
  complexRightTopCell: {
    flex: 1,
  },
  complexRightBottomCell: {
    flex: 1,
  },

  // Cell styles
  cell: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.15)',
    borderStyle: 'dashed',
  },
  cellActive: {
    borderColor: '#0095F6',
    borderStyle: 'solid',
  },
  cellEmpty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cellAddIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  cellNumber: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
    fontWeight: '600',
  },
  cellImageContainer: {
    flex: 1,
  },
  cellImageWrapper: {
    flex: 1,
    overflow: 'hidden',
  },
  cellImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  editButton: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,59,48,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Bottom section
  bottomSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  layoutsScroll: {
    paddingHorizontal: 8,
    gap: 12,
  },

  // Camera modal
  cameraContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    ...StyleSheet.absoluteFillObject,
  },
  cameraHeader: {
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
  cameraButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  cameraControls: {
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
  },
  captureButtonInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFF',
  },
});
