/**
 * STEP G - Image Viewer with Annotations
 * 
 * Fullscreen image viewer with annotation tools
 * - Draw, text, eraser
 * - Undo/redo
 * - Save annotations to Firestore
 * - Load and display saved annotations
 */

import AnnotatorToolbar, { AnnotationTool } from '@/src/components/Imaging/AnnotatorToolbar';
import { useClinic } from '@/src/context/ClinicContext';
import { useTheme } from '@/src/context/ThemeContext';
import { fetchPatientImage, saveImageAnnotations } from '@/src/services/patientImages';
import { ImageAnnotations, ImageStroke, ImageText, PatientImage } from '@/src/types/imaging';
import { useClinicGuard } from '@/src/utils/navigationGuards';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, Dimensions, Image, PanResponder, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Path, Text as SvgText } from 'react-native-svg';

const SCREEN_WIDTH = Dimensions.get('window').width;
const STROKE_WIDTH = 3;

export default function ImageViewerScreen() {
  useClinicGuard(); // 🔐 حماية الصفحة - clinic members only
  
  const { patientId, imageId } = useLocalSearchParams();
  const { clinicId, clinicUser } = useClinic();
  const router = useRouter();
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();

  const [image, setImage] = useState<PatientImage | null>(null);
  const [loading, setLoading] = useState(true);
  const [annotating, setAnnotating] = useState(false);
  const [currentTool, setCurrentTool] = useState<AnnotationTool>('pen');
  const [saving, setSaving] = useState(false);

  // Annotation state
  const [annotations, setAnnotations] = useState<ImageAnnotations>({
    version: 1,
    strokes: [],
    texts: [],
  });
  const [currentStroke, setCurrentStroke] = useState<ImageStroke | null>(null);
  const [history, setHistory] = useState<ImageAnnotations[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Display dimensions
  const [displayWidth, setDisplayWidth] = useState(SCREEN_WIDTH);
  const [displayHeight, setDisplayHeight] = useState(SCREEN_WIDTH);

  const strokeColor = colors.accentBlue;

  useEffect(() => {
    if (!clinicUser || !clinicId || !patientId || !imageId) {
      router.replace('/clinic/login' as any);
      return;
    }

    loadImage();
  }, [clinicId, patientId, imageId, clinicUser]);

  useEffect(() => {
    if (image) {
      const aspectRatio = image.height / image.width;
      setDisplayWidth(SCREEN_WIDTH);
      setDisplayHeight(SCREEN_WIDTH * aspectRatio);

      setAnnotations(image.annotations || { version: 1, strokes: [], texts: [] });
      setHistory([image.annotations || { version: 1, strokes: [], texts: [] }]);
      setHistoryIndex(0);
    }
  }, [image]);

  const loadImage = async () => {
    if (!clinicId || !patientId || !imageId) return;

    try {
      setLoading(true);
      const fetchedImage = await fetchPatientImage(clinicId, patientId as string, imageId as string);

      if (!fetchedImage) {
        Alert.alert(t('common.error'), t('imageViewer.errorNotFound'));
        router.back();
        return;
      }

      setImage(fetchedImage);
    } catch (error: any) {
      console.error('[LOAD IMAGE ERROR]', error);
      Alert.alert(t('common.error'), t('imageViewer.failedToLoadImage'));
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => annotating && currentTool !== 'text',
      onMoveShouldSetPanResponder: () => annotating && currentTool !== 'text',
      onPanResponderGrant: (evt) => {
        if (annotating && currentTool === 'pen') {
          const { locationX, locationY } = evt.nativeEvent;
          const normalizedX = locationX / displayWidth;
          const normalizedY = locationY / displayHeight;

          const newStroke: ImageStroke = {
            id: `stroke_${Date.now()}`,
            color: strokeColor,
            width: STROKE_WIDTH,
            points: [{ x: normalizedX, y: normalizedY }],
          };

          setCurrentStroke(newStroke);
        }
      },
      onPanResponderMove: (evt) => {
        if (annotating && currentTool === 'pen' && currentStroke) {
          const { locationX, locationY } = evt.nativeEvent;
          const normalizedX = locationX / displayWidth;
          const normalizedY = locationY / displayHeight;

          setCurrentStroke({
            ...currentStroke,
            points: [...currentStroke.points, { x: normalizedX, y: normalizedY }],
          });
        }
      },
      onPanResponderRelease: () => {
        if (annotating && currentTool === 'pen' && currentStroke) {
          const newAnnotations: ImageAnnotations = {
            ...annotations,
            strokes: [...annotations.strokes, currentStroke],
          };

          addToHistory(newAnnotations);
          setCurrentStroke(null);
        } else if (annotating && currentTool === 'eraser') {
          // Remove last stroke
          if (annotations.strokes.length > 0) {
            const newAnnotations: ImageAnnotations = {
              ...annotations,
              strokes: annotations.strokes.slice(0, -1),
            };
            addToHistory(newAnnotations);
          }
        }
      },
    })
  ).current;

  const handleCanvasPress = (evt: any) => {
    if (annotating && currentTool === 'text') {
      const { locationX, locationY } = evt.nativeEvent;
      const normalizedX = locationX / displayWidth;
      const normalizedY = locationY / displayHeight;

      Alert.prompt(
        t('imageViewer.addTextTitle'),
        t('imageViewer.addTextMessage'),
        (text) => {
          if (text && text.trim()) {
            const newText: ImageText = {
              id: `text_${Date.now()}`,
              text: text.trim(),
              x: normalizedX,
              y: normalizedY,
                color: strokeColor,
            };

            const newAnnotations: ImageAnnotations = {
              ...annotations,
              texts: [...annotations.texts, newText],
            };

            addToHistory(newAnnotations);
          }
        },
        'plain-text'
      );
    }
  };

  const addToHistory = (newAnnotations: ImageAnnotations) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newAnnotations);

    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    setAnnotations(newAnnotations);
  };

  const undo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      const prevAnnotations = history[newIndex];

      setHistoryIndex(newIndex);
      setAnnotations(prevAnnotations);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      const nextAnnotations = history[newIndex];

      setHistoryIndex(newIndex);
      setAnnotations(nextAnnotations);
    }
  };

  const clearAll = () => {
    const emptyAnnotations: ImageAnnotations = {
      version: 1,
      strokes: [],
      texts: [],
    };

    addToHistory(emptyAnnotations);
  };

  const handleSave = async () => {
    if (!clinicId || !patientId || !imageId) return;

    try {
      setSaving(true);
      await saveImageAnnotations(clinicId, patientId as string, imageId as string, annotations);

      Alert.alert(t('common.success'), t('imageViewer.annotationsSaved'));
      setAnnotating(false);
    } catch (error: any) {
      console.error('[SAVE ANNOTATIONS ERROR]', error);
      Alert.alert(t('common.error'), t('imageViewer.failedToSaveAnnotations'));
    } finally {
      setSaving(false);
    }
  };

  const strokeToPath = (stroke: ImageStroke): string => {
    if (stroke.points.length === 0) return '';

    const pathData = stroke.points
      .map((point, index) => {
        const x = point.x * displayWidth;
        const y = point.y * displayHeight;
        return index === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
      })
      .join(' ');

    return pathData;
  };

  if (loading || !image) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.accentBlue} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card }]}> 
        <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>{t('imageViewer.headerTitle')}</Text>
        {!annotating && (
          <TouchableOpacity onPress={() => setAnnotating(true)} style={[styles.annotateButton, { backgroundColor: colors.buttonBackground }]}>
            <Text style={[styles.annotateButtonText, { color: colors.buttonText }]}>{t('imageViewer.annotateButtonText')}</Text>
          </TouchableOpacity>
        )}
        {annotating && (
          <TouchableOpacity onPress={() => setAnnotating(false)} style={styles.headerButton}>
            <Text style={[styles.cancelButtonText, { color: colors.textPrimary }]}>{t('imageViewer.cancelButtonText')}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Image with Annotations */}
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: image.downloadUrlOriginal }}
          style={{ width: displayWidth, height: displayHeight }}
          resizeMode="contain"
        />

        {/* Annotation Canvas */}
        <View
          style={[styles.canvas, { width: displayWidth, height: displayHeight }]}
          {...panResponder.panHandlers}
          onTouchEnd={handleCanvasPress}
        >
          <Svg width={displayWidth} height={displayHeight}>
            {/* Render saved strokes */}
            {annotations.strokes.map((stroke) => (
              <Path
                key={stroke.id}
                d={strokeToPath(stroke)}
                stroke={stroke.color}
                strokeWidth={stroke.width}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ))}

            {/* Render current stroke (being drawn) */}
            {currentStroke && (
              <Path
                d={strokeToPath(currentStroke)}
                stroke={currentStroke.color}
                strokeWidth={currentStroke.width}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* Render text annotations */}
            {annotations.texts.map((text) => (
              <SvgText
                key={text.id}
                x={text.x * displayWidth}
                y={text.y * displayHeight}
                fill={text.color}
                fontSize="20"
                fontWeight="bold"
              >
                {text.text}
              </SvgText>
            ))}
          </Svg>
        </View>
      </View>

      {/* Toolbar */}
      {annotating && (
        <AnnotatorToolbar
          currentTool={currentTool}
          onToolChange={setCurrentTool}
          onUndo={undo}
          onRedo={redo}
          onClearAll={clearAll}
          onSave={handleSave}
          canUndo={historyIndex > 0}
          canRedo={historyIndex < history.length - 1}
          isSaving={saving}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  annotateButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  annotateButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  imageContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  canvas: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
});
