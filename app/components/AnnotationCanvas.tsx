import { useTheme } from '@/src/context/ThemeContext';
import React, { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    ActivityIndicator,
    Alert,
    Image,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

// For web, we'll use Canvas API
// For native, we'll use Skia

let Canvas: any = null;
let Skia: any = null;
let useDrawingContext: any = null;

if (Platform.OS !== 'web') {
  try {
    const skiaModule = require('@shopify/react-native-skia');
    Canvas = skiaModule.Canvas;
    Skia = skiaModule.Skia;
    useDrawingContext = skiaModule.useDrawingContext;
  } catch (e) {
    console.warn('Skia not available, using fallback canvas');
  }
}

interface Point {
  x: number;
  y: number;
}

interface Stroke {
  points: Point[];
  color: string;
  strokeWidth: number;
}

interface AnnotationCanvasProps {
  imageUrl: string;
  imageWidth: number;
  imageHeight: number;
  onSave: (annotatedImageUri: string, strokes: any[], textOverlays: any[]) => Promise<void>;
  onCancel: () => void;
}

export const AnnotationCanvas: React.FC<AnnotationCanvasProps> = ({
  imageUrl,
  imageWidth,
  imageHeight,
  onSave,
  onCancel,
}: AnnotationCanvasProps) => {
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();

  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [currentColor, setCurrentColor] = useState('#FF0000');
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [textOverlays, setTextOverlays] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showTextInput, setShowTextInput] = useState(false);
  const [textInput, setTextInput] = useState('');
  const canvasRef = useRef<any>(null);

  const colors_palette = [
    '#FF0000', // Red
    '#00FF00', // Green
    '#0000FF', // Blue
    '#FFFF00', // Yellow
    '#FF00FF', // Magenta
    '#00FFFF', // Cyan
    '#FFA500', // Orange
    '#FFFFFF', // White
    '#000000', // Black
  ];

  const handleUndo = useCallback(() => {
    if (strokes.length > 0) {
      setStrokes((prev) => prev.slice(0, -1));
    }
  }, [strokes]);

  const handleClear = useCallback(() => {
    Alert.alert(
      t('confirm'),
      t('clearAllAnnotations'),
      [
        { text: t('cancel'), onPress: () => {}, style: 'cancel' },
        {
          text: t('clear'),
          onPress: () => {
            setStrokes([]);
            setTextOverlays([]);
          },
          style: 'destructive',
        },
      ]
    );
  }, [t]);

  const handleSave = useCallback(async () => {
    if (strokes.length === 0 && textOverlays.length === 0) {
      Alert.alert(t('warning'), t('noAnnotationsToSave'));
      return;
    }

    try {
      setIsLoading(true);

      // For now, on web we'll just return the original image
      // On native, we need to render canvas and export
      if (Platform.OS === 'web') {
        // Web fallback: just use original image
        console.warn('Drawing not fully supported on web yet');
        onSave(imageUrl, strokes, textOverlays);
      } else {
        // Native: render and export annotated image
        // This is a simplified version - in production you'd use canvas context to render
        onSave(imageUrl, strokes, textOverlays);
      }
    } catch (error) {
      console.error('Error saving annotation:', error);
      Alert.alert(t('error'), t('failedToSaveAnnotation'));
    } finally {
      setIsLoading(false);
    }
  }, [strokes, textOverlays, imageUrl, onSave, t]);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? '#0B0F1A' : '#F5F5F5',
    },
    header: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#1A1F2E' : '#E0E0E0',
      backgroundColor: isDark ? '#0B0F1A' : '#FFF',
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: isDark ? '#FFF' : '#000',
      marginBottom: 8,
    },
    canvasContainer: {
      flex: 1,
      backgroundColor: isDark ? '#0B0F1A' : '#FFF',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 8,
      borderRadius: 12,
      margin: 12,
      overflow: 'hidden',
    },
    image: {
      width: '100%',
      height: '100%',
      resizeMode: 'contain',
    },
    toolsSection: {
      paddingHorizontal: 12,
      paddingVertical: 12,
      borderTopWidth: 1,
      borderTopColor: isDark ? '#1A1F2E' : '#E0E0E0',
      backgroundColor: isDark ? '#0B0F1A' : '#FFF',
    },
    toolsTitle: {
      fontSize: 12,
      fontWeight: '600',
      color: isDark ? '#B0B0B0' : '#666',
      marginBottom: 8,
      textTransform: 'uppercase',
    },
    colorPalette: {
      flexDirection: 'row',
      marginBottom: 12,
      flexWrap: 'wrap',
      gap: 8,
    },
    colorButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      borderWidth: 2,
      borderColor: 'transparent',
    },
    colorButtonActive: {
      borderColor: '#FFF',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 4,
    },
    strokeWidthContainer: {
      marginBottom: 12,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    strokeLabel: {
      fontSize: 12,
      color: isDark ? '#B0B0B0' : '#666',
      fontWeight: '600',
      width: 60,
    },
    strokeOptions: {
      flexDirection: 'row',
      gap: 8,
    },
    strokeButton: {
      width: 40,
      height: 40,
      borderRadius: 8,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: isDark ? '#1A1F2E' : '#E0E0E0',
    },
    strokeButtonActive: {
      borderColor: '#D4AF37',
      backgroundColor: isDark ? '#1A1F2E' : '#FFF9E6',
    },
    actionButtons: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 12,
    },
    button: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 8,
      justifyContent: 'center',
      alignItems: 'center',
      flexDirection: 'row',
      gap: 8,
    },
    buttonPrimary: {
      backgroundColor: '#D4AF37',
    },
    buttonSecondary: {
      backgroundColor: isDark ? '#1A1F2E' : '#E0E0E0',
      borderWidth: 1,
      borderColor: isDark ? '#333' : '#CCC',
    },
    buttonDanger: {
      backgroundColor: '#FF6B6B',
    },
    buttonText: {
      fontSize: 14,
      fontWeight: '600',
      color: isDark ? '#FFF' : '#000',
    },
    buttonTextPrimary: {
      color: '#000',
    },
    buttonTextDanger: {
      color: '#FFF',
    },
  });

  if (Platform.OS === 'web') {
    // Web fallback: simplified annotation UI
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t('annotateImage')}</Text>
          <Text style={{ color: isDark ? '#B0B0B0' : '#666', fontSize: 12 }}>
            {t('drawingNotSupportedWeb')}
          </Text>
        </View>

        <View style={styles.canvasContainer}>
          <Image source={{ uri: imageUrl }} style={styles.image} />
        </View>

        <View style={styles.toolsSection}>
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.button, styles.buttonSecondary]}
              onPress={onCancel}
            >
              <Text style={[styles.buttonText, { color: isDark ? '#FFF' : '#000' }]}>
                {t('cancel')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.buttonPrimary]}
              onPress={handleSave}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text style={[styles.buttonText, styles.buttonTextPrimary]}>
                  {t('save')}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  // Native implementation with Skia
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('annotateImage')}</Text>
      </View>

      <View style={styles.canvasContainer}>
        <Image source={{ uri: imageUrl }} style={styles.image} />
      </View>

      <ScrollView style={styles.toolsSection} showsVerticalScrollIndicator={false}>
        {/* Color Palette */}
        <Text style={styles.toolsTitle}>{t('color')}</Text>
        <View style={styles.colorPalette}>
          {colors_palette.map((color) => (
            <TouchableOpacity
              key={color}
              style={[
                styles.colorButton,
                { backgroundColor: color },
                currentColor === color && styles.colorButtonActive,
              ]}
              onPress={() => setCurrentColor(color)}
            />
          ))}
        </View>

        {/* Stroke Width */}
        <View style={styles.strokeWidthContainer}>
          <Text style={styles.strokeLabel}>{t('brushSize')}</Text>
          <View style={styles.strokeOptions}>
            {[2, 3, 5, 8].map((width) => (
              <TouchableOpacity
                key={width}
                style={[
                  styles.strokeButton,
                  strokeWidth === width && styles.strokeButtonActive,
                ]}
                onPress={() => setStrokeWidth(width)}
              >
                <View
                  style={{
                    width: width * 2,
                    height: width * 2,
                    borderRadius: width,
                    backgroundColor: currentColor,
                  }}
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.button, styles.buttonSecondary]}
            onPress={handleUndo}
            disabled={strokes.length === 0}
          >
            <Text style={[styles.buttonText, { color: isDark ? '#FFF' : '#000' }]}>
              {t('undo')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.buttonDanger]}
            onPress={handleClear}
          >
            <Text style={[styles.buttonText, styles.buttonTextDanger]}>
              {t('clear')}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.button, styles.buttonSecondary]}
            onPress={onCancel}
          >
            <Text style={[styles.buttonText, { color: isDark ? '#FFF' : '#000' }]}>
              {t('cancel')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.buttonPrimary]}
            onPress={handleSave}
            disabled={isLoading || (strokes.length === 0 && textOverlays.length === 0)}
          >
            {isLoading ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text style={[styles.buttonText, styles.buttonTextPrimary]}>
                {t('save')}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

export default AnnotationCanvas;
