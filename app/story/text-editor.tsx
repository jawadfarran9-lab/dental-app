import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import {
    Dimensions,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Background gradient presets
const BACKGROUND_GRADIENTS = [
  { id: 'sunset', colors: ['#FF512F', '#DD2476'], name: 'Sunset' },
  { id: 'ocean', colors: ['#2193b0', '#6dd5ed'], name: 'Ocean' },
  { id: 'purple', colors: ['#834d9b', '#d04ed6'], name: 'Purple' },
  { id: 'forest', colors: ['#134E5E', '#71B280'], name: 'Forest' },
  { id: 'fire', colors: ['#f12711', '#f5af19'], name: 'Fire' },
  { id: 'night', colors: ['#0f0c29', '#302b63', '#24243e'], name: 'Night' },
  { id: 'minimal', colors: ['#000000', '#434343'], name: 'Minimal' },
  { id: 'bright', colors: ['#FFFFFF', '#ECE9E6'], name: 'Bright' },
];

// Font styles
const FONT_STYLES = [
  { id: 'modern', fontFamily: undefined, fontWeight: '700' as const, name: 'Modern' },
  { id: 'classic', fontFamily: undefined, fontWeight: '400' as const, name: 'Classic' },
  { id: 'neon', fontFamily: undefined, fontWeight: '800' as const, name: 'Neon' },
  { id: 'typewriter', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontWeight: '400' as const, name: 'Typewriter' },
  { id: 'strong', fontFamily: undefined, fontWeight: '900' as const, name: 'Strong' },
];

// Text alignment options
const TEXT_ALIGNMENTS: ('left' | 'center' | 'right')[] = ['left', 'center', 'right'];

export default function TextEditorScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const inputRef = useRef<TextInput>(null);

  // State
  const [text, setText] = useState('');
  const [selectedBackground, setSelectedBackground] = useState(BACKGROUND_GRADIENTS[0]);
  const [selectedFont, setSelectedFont] = useState(FONT_STYLES[0]);
  const [textAlignment, setTextAlignment] = useState<'left' | 'center' | 'right'>('center');
  const [fontSize, setFontSize] = useState(32);
  const [showBackgrounds, setShowBackgrounds] = useState(true);

  // Determine text color based on background
  const getTextColor = useCallback(() => {
    const darkBackgrounds = ['night', 'minimal', 'sunset', 'purple', 'fire', 'forest'];
    return darkBackgrounds.includes(selectedBackground.id) ? '#FFFFFF' : '#000000';
  }, [selectedBackground]);

  // Handle close
  const handleClose = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/story/camera');
    }
  }, [router]);

  // Handle done - navigate to edit screen
  const handleDone = useCallback(() => {
    if (!text.trim()) {
      // Show alert or just go back
      handleClose();
      return;
    }

    router.push({
      pathname: '/story/edit',
      params: {
        mediaType: 'text',
        textContent: text,
        backgroundId: selectedBackground.id,
        backgroundColors: JSON.stringify(selectedBackground.colors),
        fontId: selectedFont.id,
        textAlignment,
        fontSize: fontSize.toString(),
      },
    });
  }, [text, selectedBackground, selectedFont, textAlignment, fontSize, router, handleClose]);

  // Cycle through alignments
  const cycleAlignment = useCallback(() => {
    const currentIndex = TEXT_ALIGNMENTS.indexOf(textAlignment);
    const nextIndex = (currentIndex + 1) % TEXT_ALIGNMENTS.length;
    setTextAlignment(TEXT_ALIGNMENTS[nextIndex]);
  }, [textAlignment]);

  // Get alignment icon
  const getAlignmentIcon = useCallback((): 'reorder-three-outline' | 'reorder-two-outline' | 'reorder-four-outline' => {
    switch (textAlignment) {
      case 'left':
        return 'reorder-three-outline';
      case 'right':
        return 'reorder-four-outline';
      default:
        return 'reorder-two-outline';
    }
  }, [textAlignment]);

  // Adjust font size
  const adjustFontSize = useCallback((delta: number) => {
    setFontSize((prev) => Math.min(Math.max(prev + delta, 18), 64));
  }, []);

  const textColor = getTextColor();

  return (
    <View style={styles.container}>
      {/* Background Gradient */}
      <LinearGradient
        colors={selectedBackground.colors as [string, string, ...string[]]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Top Controls */}
      <View style={[styles.topControls, { paddingTop: insets.top + 12 }]}>
        {/* Close Button */}
        <TouchableOpacity
          style={styles.topButton}
          onPress={handleClose}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="close" size={28} color="#FFF" />
        </TouchableOpacity>

        {/* Top Right Controls */}
        <View style={styles.topRightControls}>
          {/* Font Size Controls */}
          <View style={styles.fontSizeControls}>
            <TouchableOpacity
              style={styles.fontSizeButton}
              onPress={() => adjustFontSize(-4)}
            >
              <Text style={styles.fontSizeButtonText}>A-</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.fontSizeButton}
              onPress={() => adjustFontSize(4)}
            >
              <Text style={styles.fontSizeButtonTextLarge}>A+</Text>
            </TouchableOpacity>
          </View>

          {/* Alignment Toggle */}
          <TouchableOpacity
            style={styles.topButton}
            onPress={cycleAlignment}
          >
            <Ionicons name={getAlignmentIcon()} size={24} color="#FFF" />
          </TouchableOpacity>

          {/* Done Button */}
          <TouchableOpacity
            style={[styles.doneButton, !text.trim() && styles.doneButtonDisabled]}
            onPress={handleDone}
            disabled={!text.trim()}
          >
            <Text style={styles.doneButtonText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Text Input Area */}
      <KeyboardAvoidingView
        style={styles.inputContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={100}
      >
        <TouchableOpacity
          style={styles.inputTouchArea}
          activeOpacity={1}
          onPress={() => inputRef.current?.focus()}
        >
          <TextInput
            ref={inputRef}
            style={[
              styles.textInput,
              {
                color: textColor,
                textAlign: textAlignment,
                fontSize,
                fontWeight: selectedFont.fontWeight,
                fontFamily: selectedFont.fontFamily,
              },
            ]}
            value={text}
            onChangeText={setText}
            placeholder="Start typing..."
            placeholderTextColor={`${textColor}60`}
            multiline
            autoFocus
            textAlignVertical="center"
          />
        </TouchableOpacity>
      </KeyboardAvoidingView>

      {/* Bottom Controls */}
      <View style={[styles.bottomControls, { paddingBottom: insets.bottom + 20 }]}>
        {/* Toggle between backgrounds and fonts */}
        <View style={styles.toggleRow}>
          <TouchableOpacity
            style={[styles.toggleButton, showBackgrounds && styles.toggleButtonActive]}
            onPress={() => setShowBackgrounds(true)}
          >
            <Ionicons name="color-palette-outline" size={20} color="#FFF" />
            <Text style={styles.toggleButtonText}>Colors</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleButton, !showBackgrounds && styles.toggleButtonActive]}
            onPress={() => setShowBackgrounds(false)}
          >
            <Ionicons name="text-outline" size={20} color="#FFF" />
            <Text style={styles.toggleButtonText}>Fonts</Text>
          </TouchableOpacity>
        </View>

        {/* Selector Row */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.selectorContent}
          style={styles.selectorScroll}
        >
          {showBackgrounds
            ? BACKGROUND_GRADIENTS.map((bg) => (
                <TouchableOpacity
                  key={bg.id}
                  style={[
                    styles.colorOption,
                    selectedBackground.id === bg.id && styles.colorOptionSelected,
                  ]}
                  onPress={() => setSelectedBackground(bg)}
                >
                  <LinearGradient
                    colors={bg.colors as [string, string, ...string[]]}
                    style={styles.colorPreview}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  />
                </TouchableOpacity>
              ))
            : FONT_STYLES.map((font) => (
                <TouchableOpacity
                  key={font.id}
                  style={[
                    styles.fontOption,
                    selectedFont.id === font.id && styles.fontOptionSelected,
                  ]}
                  onPress={() => setSelectedFont(font)}
                >
                  <Text
                    style={[
                      styles.fontPreviewText,
                      {
                        fontWeight: font.fontWeight,
                        fontFamily: font.fontFamily,
                      },
                    ]}
                  >
                    Aa
                  </Text>
                  <Text style={styles.fontName}>{font.name}</Text>
                </TouchableOpacity>
              ))}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
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
  topRightControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  fontSizeControls: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 22,
    overflow: 'hidden',
  },
  fontSizeButton: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  fontSizeButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  fontSizeButtonTextLarge: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  doneButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#0095F6',
    borderRadius: 20,
  },
  doneButtonDisabled: {
    opacity: 0.5,
  },
  doneButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },

  // Input area
  inputContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingTop: 100,
    paddingBottom: 180,
  },
  inputTouchArea: {
    flex: 1,
    justifyContent: 'center',
  },
  textInput: {
    fontSize: 32,
    fontWeight: '700',
    textAlign: 'center',
    padding: 20,
  },

  // Bottom controls
  bottomControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
    gap: 12,
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    gap: 6,
  },
  toggleButtonActive: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  toggleButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '500',
  },
  selectorScroll: {
    maxHeight: 80,
  },
  selectorContent: {
    paddingHorizontal: 8,
    gap: 12,
  },
  colorOption: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorOptionSelected: {
    borderColor: '#FFF',
  },
  colorPreview: {
    flex: 1,
  },
  fontOption: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 2,
    borderColor: 'transparent',
    minWidth: 70,
  },
  fontOptionSelected: {
    borderColor: '#FFF',
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  fontPreviewText: {
    color: '#FFF',
    fontSize: 24,
    marginBottom: 4,
  },
  fontName: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 10,
  },
});
