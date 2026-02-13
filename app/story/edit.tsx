import { STICKER_COMPONENTS } from '@/src/components/stickers';
import { BEAUTY_STICKER_DESIGNS } from '@/src/components/stickers/BeautyStickers';
import { BEAUTY_STICKER_DESIGNS_EXTENDED } from '@/src/components/stickers/BeautyStickersExtended';
import { CLINIC_NAME_STICKER_DESIGNS } from '@/src/components/stickers/ClinicNameStickers';
import { CLINIC_NAME_STICKER_DESIGNS_EXTENDED } from '@/src/components/stickers/ClinicNameStickersExtended';
import { COMBO_STICKER_DESIGNS } from '@/src/components/stickers/ComboStickers';
import { COMBO_STICKER_DESIGNS_EXTENDED } from '@/src/components/stickers/ComboStickersExtended';
import { DENTAL_STICKER_DESIGNS } from '@/src/components/stickers/DentalStickers';
import { DENTAL_STICKER_DESIGNS_EXTENDED } from '@/src/components/stickers/DentalStickersExtended';
import { LASER_STICKER_DESIGNS } from '@/src/components/stickers/LaserStickers';
import { LASER_STICKER_DESIGNS_EXTENDED } from '@/src/components/stickers/LaserStickersExtended';
import { PHONE_STICKER_DESIGNS } from '@/src/components/stickers/PhoneStickers';
import { PHONE_STICKER_DESIGNS_EXTENDED } from '@/src/components/stickers/PhoneStickersExtended';
import { useClinic } from '@/src/context/ClinicContext';
import { useTheme } from '@/src/context/ThemeContext';
import { ClinicData, fetchClinicData } from '@/src/utils/clinicDataUtils';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Image as ExpoImage } from 'expo-image';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  Keyboard,
  KeyboardAvoidingView,
  Linking,
  Modal,
  PanResponder,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ========== Font Styles (Instagram-style) ==========
const FONT_STYLES = [
  { id: 'classic', name: 'Classic', fontFamily: undefined, style: 'classic' },
  { id: 'modern', name: 'Modern', fontFamily: Platform.OS === 'ios' ? 'Helvetica Neue' : 'sans-serif', style: 'modern' },
  { id: 'typewriter', name: 'Typewriter', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', style: 'typewriter' },
  { id: 'strong', name: 'Strong', fontFamily: undefined, style: 'strong' },
  { id: 'meme', name: 'Meme', fontFamily: undefined, style: 'meme' },
  { id: 'elegant', name: 'Elegant', fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', style: 'elegant' },
  { id: 'signature', name: 'Signature', fontFamily: Platform.OS === 'ios' ? 'Snell Roundhand' : 'cursive', style: 'signature' },
  { id: 'bubble', name: 'Bubble', fontFamily: undefined, style: 'bubble' },
  { id: 'deco', name: 'Deco', fontFamily: undefined, style: 'deco' },
  { id: 'squeeze', name: 'Squeeze', fontFamily: undefined, style: 'squeeze' },
  { id: 'directional', name: 'Directional', fontFamily: undefined, style: 'directional' },
  { id: 'literature', name: 'Literature', fontFamily: Platform.OS === 'ios' ? 'Baskerville' : 'serif', style: 'literature' },
  { id: 'editor', name: 'Editor', fontFamily: Platform.OS === 'ios' ? 'American Typewriter' : 'monospace', style: 'editor' },
  { id: 'poster', name: 'Poster', fontFamily: undefined, style: 'poster' },
];

// ========== Text Effects ==========
const TEXT_EFFECTS = [
  { id: 'none', name: 'None', icon: 'close-circle-outline' },
  { id: 'sparkle', name: 'Sparkle', icon: 'sparkles-outline' },
  { id: 'neon', name: 'Neon', icon: 'eye-outline' },
  { id: 'shimmer', name: 'Shimmer', icon: 'water-outline' },
  { id: 'pixel', name: 'Pixel', icon: 'grid-outline' },
];

// ========== Text Animations ==========
const TEXT_ANIMATIONS = [
  { id: 'none', name: 'None', icon: 'close-circle-outline' },
  { id: 'typewriter', name: 'Typewriter', icon: 'text-outline' },
  { id: 'pop', name: 'Pop', icon: 'sparkles' },
  { id: 'jump', name: 'Jump', icon: 'arrow-up-outline' },
  { id: 'slide', name: 'Slide', icon: 'swap-horizontal-outline' },
];

// ========== Color Palette ==========
const COLOR_PALETTE = [
  '#FFFFFF', '#000000', '#0095F6', '#34C759', '#FFCC00', 
  '#FF9500', '#FF3B30', '#FF2D55', '#AF52DE', '#5856D6',
  '#A2845E', '#8E8E93', '#636366', '#48484A', '#2C2C2E',
];

// ========== Sticker Categories (Instagram-style pills) ==========
const STICKER_CATEGORIES = [
  { id: 'location', name: 'Location', icon: 'location' as const, color: '#FF6B6B' },
  { id: 'music', name: 'Music', icon: 'musical-notes' as const, color: '#FF2D55' },
  { id: 'photo', name: 'Photo', icon: 'images-outline' as const, color: '#34C759' },
  { id: 'gif', name: 'GIF', icon: 'search' as const, color: '#00D4AA' },
  { id: 'addyours', name: 'Add Yours', icon: 'camera-outline' as const, color: '#FF9500' },
  { id: 'frames', name: 'Frames', icon: 'image-outline' as const, color: '#007AFF' },
  { id: 'questions', name: 'Questions', icon: 'help-circle-outline' as const, color: '#AF52DE' },
  { id: 'cutouts', name: 'Cutouts', icon: 'cut-outline' as const, color: '#5AC8FA' },
  { id: 'highlight', name: 'Highlight', icon: 'star-outline' as const, color: '#FFD60A' },
  { id: 'avatar', name: 'Avatar', icon: 'person-circle-outline' as const, color: '#FF6B6B' },
  { id: 'templates', name: 'Add Yours Templates', icon: 'add-circle-outline' as const, color: '#FF9500' },
  { id: 'poll', name: 'Poll', icon: 'stats-chart-outline' as const, color: '#FF3B30' },
  { id: 'quiz', name: 'Quiz', icon: 'checkmark-circle-outline' as const, color: '#34C759' },
  { id: 'link', name: 'Link', icon: 'link-outline' as const, color: '#5856D6' },
  { id: 'slider', name: 'Slider', icon: 'heart-outline' as const, color: '#FF2D55' },
  { id: 'hashtag', name: '#hashtag', icon: 'pricetag-outline' as const, color: '#000000' },
  { id: 'countdown', name: 'Countdown', icon: 'time-outline' as const, color: '#AF52DE' },
];

// ========== Custom Illustrated Stickers ==========
// Now using SVG components from src/components/stickers
// These are production-ready illustrated stickers with gradients and effects

// ========== Text Alignment Options ==========
type TextAlignment = 'left' | 'center' | 'right';

// ========== Location Sticker Styles (Instagram-like variants) ==========
type LocationStickerVariant = 'branded';

// ========== Clock Style Options ==========
type ClockStyle = 'digital' | 'floating' | 'analog';

const CLOCK_STYLES: { id: ClockStyle; name: string }[] = [
  { id: 'digital', name: 'Digital' },
  { id: 'floating', name: 'Floating' },
  { id: 'analog', name: 'Analog' },
];

// ========== Clock Sticker Design Styles ==========
// 8 different clock sticker visual styles - fully dynamic rendering
// Each renders the time INSIDE the design (not as overlay)
type ClockStickerStyleType = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

// ========== Photo Sticker Type ==========
type PhotoSticker = {
  id: string;
  uri: string;
  width: number;
  height: number;
  x: number;
  y: number;
  scale: number;
  rotation: number;
};

// ========== Phone Sticker on Canvas Type ==========
type PhoneStickerOnCanvas = {
  id: string;
  designId: string; // e.g. 'phone_1' .. 'phone_10'
  phoneNumber: string;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  isCallable: boolean; // false = locked (static), true = unlocked (tap-to-call for viewers)
};

// ========== Clinic Name Sticker on Canvas Type ==========
type ClinicNameStickerOnCanvas = {
  id: string;
  designId: string; // e.g. 'clinicname_1' .. 'clinicname_10'
  clinicName: string;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  isNavigable: boolean; // false = locked (static), true = unlocked (tap-to-navigate for viewers)
};

// ========== Combo Sticker on Canvas Type ==========
type ComboStickerOnCanvas = {
  id: string;
  designId: string; // e.g. 'combo_1' .. 'combo_10'
  clinicName: string;
  clinicPhoneNumber: string;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  isInteractive: boolean; // false = locked (static), true = unlocked (tap-to-call + navigate for viewers)
};

// ========== Dental Sticker on Canvas Type ==========
type DentalStickerOnCanvas = {
  id: string;
  designId: string; // e.g. 'dental_1' .. 'dental_40'
  x: number;
  y: number;
  scale: number;
  rotation: number;
};

// ========== Laser Sticker on Canvas Type ==========
type LaserStickerOnCanvas = {
  id: string;
  designId: string; // e.g. 'laser_1' .. 'laser_40'
  x: number;
  y: number;
  scale: number;
  rotation: number;
};

// ========== Beauty Sticker on Canvas Type ==========
type BeautyStickerOnCanvas = {
  id: string;
  designId: string; // e.g. 'beauty_1' .. 'beauty_40'
  x: number;
  y: number;
  scale: number;
  rotation: number;
};

// ========== Image Editing Types & Constants ==========
// Story canvas dimensions (9:16 aspect ratio like Instagram)
const STORY_ASPECT_RATIO = 9 / 16;
const STORY_WIDTH = SCREEN_WIDTH;
const STORY_HEIGHT = SCREEN_WIDTH / STORY_ASPECT_RATIO;

// Crop aspect ratio presets
type CropAspectRatio = 'story' | 'square' | '4:5' | '16:9' | 'free';
const CROP_PRESETS: { id: CropAspectRatio; name: string; ratio: number | null; icon: string }[] = [
  { id: 'story', name: 'Story', ratio: 9 / 16, icon: 'phone-portrait-outline' },
  { id: 'square', name: 'Square', ratio: 1, icon: 'square-outline' },
  { id: '4:5', name: '4:5', ratio: 4 / 5, icon: 'tablet-portrait-outline' },
  { id: '16:9', name: '16:9', ratio: 16 / 9, icon: 'tv-outline' },
  { id: 'free', name: 'Free', ratio: null, icon: 'resize-outline' },
];

// Instagram-style filter presets
type FilterPreset = {
  id: string;
  name: string;
  brightness?: number;
  contrast?: number;
  saturation?: number;
  hue?: number;
  opacity: number;
  overlay?: string; // Gradient overlay color
};

const FILTER_PRESETS: FilterPreset[] = [
  { id: 'original', name: 'Original', opacity: 1 },
  { id: 'clarendon', name: 'Clarendon', brightness: 1.1, contrast: 1.2, saturation: 1.35, opacity: 1 },
  { id: 'gingham', name: 'Gingham', brightness: 1.05, contrast: 0.95, saturation: 0.9, opacity: 1, overlay: 'rgba(230, 230, 250, 0.1)' },
  { id: 'moon', name: 'Moon', brightness: 1.1, contrast: 1.1, saturation: 0, opacity: 1 },
  { id: 'lark', name: 'Lark', brightness: 1.08, contrast: 0.95, saturation: 1.2, opacity: 1 },
  { id: 'reyes', name: 'Reyes', brightness: 1.1, contrast: 0.85, saturation: 0.75, opacity: 1, overlay: 'rgba(239, 205, 173, 0.2)' },
  { id: 'juno', name: 'Juno', brightness: 1.05, contrast: 1.15, saturation: 1.4, opacity: 1, overlay: 'rgba(255, 223, 0, 0.05)' },
  { id: 'slumber', name: 'Slumber', brightness: 1.05, contrast: 0.9, saturation: 0.85, opacity: 1, overlay: 'rgba(125, 105, 24, 0.1)' },
  { id: 'crema', name: 'Crema', brightness: 1.05, contrast: 0.95, saturation: 0.9, opacity: 1, overlay: 'rgba(255, 235, 205, 0.15)' },
  { id: 'ludwig', name: 'Ludwig', brightness: 1.05, contrast: 1.05, saturation: 0.95, opacity: 1, overlay: 'rgba(125, 78, 36, 0.1)' },
  { id: 'aden', name: 'Aden', brightness: 1.2, contrast: 0.9, saturation: 0.85, opacity: 1, overlay: 'rgba(66, 10, 14, 0.1)' },
  { id: 'perpetua', name: 'Perpetua', brightness: 1.05, contrast: 1.1, saturation: 1.1, opacity: 1, overlay: 'rgba(0, 91, 154, 0.05)' },
];

// Editing tool modes
type EditingToolMode = 'transform' | 'crop' | 'filters' | 'adjust';

// ========== Analog Clock Component (Rolex/Luxury Style) ==========
const AnalogClock = ({ time, size, variant }: { time: Date; size: number; variant: 'luxury' | 'vintage' }) => {
  const hours = time.getHours() % 12;
  const minutes = time.getMinutes();
  
  // Calculate rotation angles
  const hourRotation = (hours * 30) + (minutes * 0.5); // 30° per hour + minute adjustment
  const minuteRotation = minutes * 6; // 6° per minute
  
  const isLuxury = variant === 'luxury';
  const faceColor = isLuxury ? '#0A1628' : '#FFF8E7';
  const accentColor = isLuxury ? '#D4AF37' : '#8B4513';
  const handColor = isLuxury ? '#D4AF37' : '#1A1A1A';
  const tickColor = isLuxury ? '#D4AF37' : '#8B4513';
  
  const center = size / 2;
  const clockRadius = size * 0.42;
  
  return (
    <View style={[analogStyles.container, { width: size, height: size }]}>
      {/* Outer bezel */}
      <View style={[
        analogStyles.bezel,
        {
          width: size * 0.95,
          height: size * 0.95,
          borderRadius: size * 0.475,
          borderColor: accentColor,
          borderWidth: isLuxury ? 4 : 3,
          backgroundColor: isLuxury ? '#0D1B2A' : '#F5E6D3',
        }
      ]}>
        {/* Clock face */}
        <View style={[
          analogStyles.face,
          {
            width: size * 0.85,
            height: size * 0.85,
            borderRadius: size * 0.425,
            backgroundColor: faceColor,
          }
        ]}>
          {/* Hour markers */}
          {[...Array(12)].map((_, i) => {
            const angle = (i * 30 - 90) * (Math.PI / 180);
            const markerLength = i % 3 === 0 ? size * 0.08 : size * 0.04;
            const markerWidth = i % 3 === 0 ? 3 : 2;
            const outerRadius = clockRadius;
            const innerRadius = clockRadius - markerLength;
            
            return (
              <View
                key={i}
                style={[
                  analogStyles.hourMarker,
                  {
                    width: markerWidth,
                    height: markerLength,
                    backgroundColor: tickColor,
                    left: center - markerWidth / 2,
                    top: center - clockRadius,
                    transform: [
                      { translateY: clockRadius - markerLength / 2 },
                      { rotate: `${i * 30}deg` },
                      { translateY: -(clockRadius - markerLength / 2) },
                    ],
                  }
                ]}
              />
            );
          })}
          
          {/* Hour hand */}
          <View
            style={[
              analogStyles.hand,
              {
                width: size * 0.04,
                height: size * 0.22,
                backgroundColor: handColor,
                borderRadius: size * 0.02,
                left: center - size * 0.02,
                top: center - size * 0.18,
                transform: [
                  { translateY: size * 0.09 },
                  { rotate: `${hourRotation}deg` },
                  { translateY: -size * 0.09 },
                ],
              }
            ]}
          />
          
          {/* Minute hand */}
          <View
            style={[
              analogStyles.hand,
              {
                width: size * 0.025,
                height: size * 0.32,
                backgroundColor: handColor,
                borderRadius: size * 0.012,
                left: center - size * 0.0125,
                top: center - size * 0.28,
                transform: [
                  { translateY: size * 0.14 },
                  { rotate: `${minuteRotation}deg` },
                  { translateY: -size * 0.14 },
                ],
              }
            ]}
          />
          
          {/* Center dot */}
          <View
            style={[
              analogStyles.centerDot,
              {
                width: size * 0.06,
                height: size * 0.06,
                borderRadius: size * 0.03,
                backgroundColor: accentColor,
                left: center - size * 0.03,
                top: center - size * 0.03,
              }
            ]}
          />
          
          {/* Brand text */}
          {isLuxury && (
            <Text style={[analogStyles.brandText, { fontSize: size * 0.06, color: accentColor, top: center + size * 0.12 }]}>
              PREMIUM
            </Text>
          )}
        </View>
      </View>
    </View>
  );
};

const analogStyles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  bezel: {
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  face: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  hourMarker: {
    position: 'absolute',
  },
  hand: {
    position: 'absolute',
  },
  centerDot: {
    position: 'absolute',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  brandText: {
    position: 'absolute',
    fontWeight: '600',
    letterSpacing: 2,
  },
});

// ========== Flip Clock Component ==========
// Realistic flip clock with clearly visible top/bottom halves
const FlipClock = ({ time, size }: { time: Date; size: number }) => {
  const hours = time.getHours();
  const minutes = time.getMinutes();
  const hourStr = hours.toString().padStart(2, '0');
  const minStr = minutes.toString().padStart(2, '0');
  
  const digitWidth = size * 0.22;
  const digitHeight = size * 0.4;
  const flipGap = size * 0.025; // Visible gap between top and bottom halves
  const digitGap = size * 0.015; // Small gap between digit cards
  
  const FlipDigit = ({ digit }: { digit: string }) => (
    <View style={[flipStyles.digitContainer, { width: digitWidth, marginHorizontal: digitGap / 2 }]}>
      {/* Top half */}
      <View style={[
        flipStyles.topHalf, 
        { 
          height: digitHeight / 2, 
          borderTopLeftRadius: size * 0.03, 
          borderTopRightRadius: size * 0.03,
        }
      ]}>
        <View style={flipStyles.topHalfInner}>
          <Text style={[flipStyles.digitText, flipStyles.topText, { fontSize: digitHeight * 0.6, lineHeight: digitHeight * 1.1 }]}>{digit}</Text>
        </View>
      </View>
      
      {/* Minimal divider - thin subtle line */}
      <View style={[flipStyles.hingeGap, { height: 1 }]} />
      
      {/* Bottom half */}
      <View style={[
        flipStyles.bottomHalf, 
        { 
          height: digitHeight / 2, 
          borderBottomLeftRadius: size * 0.03, 
          borderBottomRightRadius: size * 0.03,
        }
      ]}>
        <View style={flipStyles.bottomHalfInner}>
          <Text style={[flipStyles.digitText, flipStyles.bottomText, { fontSize: digitHeight * 0.6, lineHeight: digitHeight * 1.1, marginTop: -digitHeight * 0.55 }]}>{digit}</Text>
        </View>
      </View>
    </View>
  );
  
  // Platform-specific offset for visual centering (compensates for font metrics)
  // Reduced offset to shift frame/line down, keeping digits visually centered
  const verticalOffset = Platform.OS === 'ios' ? -size * 0.02 : -size * 0.025;
  
  return (
    <View style={[flipStyles.container, { paddingHorizontal: size * 0.06, paddingVertical: size * 0.06, borderRadius: size * 0.05 }]}>
      {/* Wrapper with transform for precise vertical centering */}
      <View style={{ flexDirection: 'row', alignItems: 'center', transform: [{ translateY: verticalOffset }] }}>
        {/* Hours */}
        <View style={flipStyles.digitGroup}>
        <FlipDigit digit={hourStr[0]} />
        <FlipDigit digit={hourStr[1]} />
      </View>
      
      {/* Colon */}
      <View style={[flipStyles.colonContainer, { width: size * 0.08, marginHorizontal: size * 0.01 }]}>
        <View style={[flipStyles.colonDot, { width: size * 0.035, height: size * 0.035, borderRadius: size * 0.0175 }]} />
        <View style={{ height: size * 0.06 }} />
        <View style={[flipStyles.colonDot, { width: size * 0.035, height: size * 0.035, borderRadius: size * 0.0175 }]} />
      </View>
      
      {/* Minutes */}
      <View style={flipStyles.digitGroup}>
        <FlipDigit digit={minStr[0]} />
        <FlipDigit digit={minStr[1]} />
      </View>
      </View>
    </View>
  );
};

const flipStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111111',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 12,
  },
  digitGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  digitContainer: {
    alignItems: 'center',
  },
  topHalf: {
    backgroundColor: '#2D2D2D',
    overflow: 'hidden',
    width: '100%',
  },
  topHalfInner: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    overflow: 'hidden',
  },
  hingeGap: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    width: '100%',
  },
  bottomHalf: {
    backgroundColor: '#2D2D2D',
    overflow: 'hidden',
    width: '100%',
  },
  bottomHalfInner: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    overflow: 'hidden',
  },
  digitText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    includeFontPadding: false,
  },
  topText: {
    // Text shows bottom half in top card
  },
  bottomText: {
    // Text shows top half in bottom card
  },
  colonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  colonDot: {
    backgroundColor: '#FF6B6B',
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 3,
  },
});

// ========== Cloud/Dreamy Clock ==========
// Clean beige style - no glow, no text, just time
const CloudClock = ({ time, size }: { time: Date; size: number }) => {
  const hours = time.getHours();
  const minutes = time.getMinutes();
  const timeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  
  return (
    <View style={[cloudStyles.container, { width: size, height: size * 0.5, borderRadius: size * 0.12 }]}>
      {/* Clean beige background */}
      <View style={[cloudStyles.background, { 
        width: size * 0.95, height: size * 0.45, borderRadius: size * 0.1
      }]}>
        {/* Time display only - no extra text */}
        <Text style={[cloudStyles.timeText, { fontSize: size * 0.22 }]}>{timeStr}</Text>
      </View>
    </View>
  );
};

const cloudStyles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  background: {
    backgroundColor: '#FFF8E7',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E8DCC8',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  timeText: {
    color: '#5D4E37',
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
    letterSpacing: 3,
  },
});

// ========== Neon Clock ==========
const NeonClock = ({ time, size }: { time: Date; size: number }) => {
  const hours = time.getHours();
  const minutes = time.getMinutes();
  const timeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  
  return (
    <View style={[neonStyles.container, { width: size * 1.1, height: size * 0.5, borderRadius: size * 0.08 }]}>
      <Text style={[neonStyles.timeText, { fontSize: size * 0.28 }]}>{timeStr}</Text>
      {/* Glow layers */}
      <Text style={[neonStyles.glowText, neonStyles.glow1, { fontSize: size * 0.28 }]}>{timeStr}</Text>
      <Text style={[neonStyles.glowText, neonStyles.glow2, { fontSize: size * 0.28 }]}>{timeStr}</Text>
    </View>
  );
};

const neonStyles = StyleSheet.create({
  container: {
    backgroundColor: '#0D0D0D',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FF00FF',
    shadowColor: '#FF00FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 10,
  },
  timeText: {
    color: '#FF00FF',
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    letterSpacing: 4,
    textShadowColor: '#FF00FF',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
    zIndex: 3,
  },
  glowText: {
    position: 'absolute',
    color: '#FF00FF',
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    letterSpacing: 4,
  },
  glow1: {
    textShadowColor: '#FF00FF',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
    opacity: 0.6,
  },
  glow2: {
    textShadowColor: '#FF66FF',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 30,
    opacity: 0.4,
  },
});

// ========== Minimalist Clock ==========
// Clean cream style - time only, no AM/PM
const MinimalistClock = ({ time, size }: { time: Date; size: number }) => {
  const hours = time.getHours();
  const minutes = time.getMinutes();
  const timeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  
  return (
    <View style={[minimalStyles.container, { width: size, height: size * 0.4, borderRadius: size * 0.06 }]}>
      <Text style={[minimalStyles.timeText, { fontSize: size * 0.24 }]}>{timeStr}</Text>
    </View>
  );
};

const minimalStyles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFDF8',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  timeText: {
    color: '#333333',
    fontWeight: '300',
    fontVariant: ['tabular-nums'],
    letterSpacing: 2,
  },
});

// ========== Retro LED Clock ==========
const RetroClock = ({ time, size }: { time: Date; size: number }) => {
  const hours = time.getHours();
  const minutes = time.getMinutes();
  // Use individual digit rendering to ensure all numbers (especially 9) display correctly
  const hourStr = hours.toString().padStart(2, '0');
  const minStr = minutes.toString().padStart(2, '0');
  
  // Platform-specific offset for visual centering (compensates for font metrics)
  const verticalOffset = Platform.OS === 'ios' ? -size * 0.065 : -size * 0.075;
  
  return (
    <View style={[retroStyles.container, { width: size * 1.15, height: size * 0.5 }]}>
      <View style={[retroStyles.screen, { paddingHorizontal: size * 0.06, paddingVertical: size * 0.06 }]}>
        {/* Transform for precise vertical centering */}
        <View style={[retroStyles.timeContainer, { transform: [{ translateY: verticalOffset }] }]}>
          <Text style={[retroStyles.digitText, { fontSize: size * 0.26, lineHeight: size * 0.3 }]}>{hourStr[0]}</Text>
          <Text style={[retroStyles.digitText, { fontSize: size * 0.26, lineHeight: size * 0.3 }]}>{hourStr[1]}</Text>
          <Text style={[retroStyles.colonText, { fontSize: size * 0.26, lineHeight: size * 0.3 }]}>:</Text>
          <Text style={[retroStyles.digitText, { fontSize: size * 0.26, lineHeight: size * 0.3 }]}>{minStr[0]}</Text>
          <Text style={[retroStyles.digitText, { fontSize: size * 0.26, lineHeight: size * 0.3 }]}>{minStr[1]}</Text>
        </View>
      </View>
    </View>
  );
};

const retroStyles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 0,
    borderRadius: 0,
  },
  screen: {
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  digitText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    minWidth: 18,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  colonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    marginHorizontal: 2,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
});

// ========== Clean Digital Clock (White, Transparent) ==========
const CleanDigitalClock = ({ time, size }: { time: Date; size: number }) => {
  const hours = time.getHours();
  const minutes = time.getMinutes();
  const hourStr = hours.toString().padStart(2, '0');
  const minStr = minutes.toString().padStart(2, '0');
  
  // Platform-specific offset for visual centering (compensates for font metrics)
  const verticalOffset = Platform.OS === 'ios' ? -size * 0.065 : -size * 0.075;
  
  return (
    <View style={[cleanDigitalStyles.container, { width: size * 1.15, height: size * 0.5 }]}>
      <View style={[cleanDigitalStyles.timeContainer, { transform: [{ translateY: verticalOffset }] }]}>
        <Text style={[cleanDigitalStyles.digitText, { fontSize: size * 0.26, lineHeight: size * 0.3 }]}>{hourStr[0]}</Text>
        <Text style={[cleanDigitalStyles.digitText, { fontSize: size * 0.26, lineHeight: size * 0.3 }]}>{hourStr[1]}</Text>
        <Text style={[cleanDigitalStyles.colonText, { fontSize: size * 0.26, lineHeight: size * 0.3 }]}>:</Text>
        <Text style={[cleanDigitalStyles.digitText, { fontSize: size * 0.26, lineHeight: size * 0.3 }]}>{minStr[0]}</Text>
        <Text style={[cleanDigitalStyles.digitText, { fontSize: size * 0.26, lineHeight: size * 0.3 }]}>{minStr[1]}</Text>
      </View>
    </View>
  );
};

const cleanDigitalStyles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  digitText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    minWidth: 18,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    includeFontPadding: false,
    textAlignVertical: 'center',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  colonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    marginHorizontal: 2,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    includeFontPadding: false,
    textAlignVertical: 'center',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
});

// ========== Artistic/Hand-drawn Clock ==========
const ArtisticClock = ({ time, size }: { time: Date; size: number }) => {
  const hours = time.getHours();
  const minutes = time.getMinutes();
  const timeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  const isMorning = hours >= 6 && hours < 18;
  
  return (
    <View style={[artisticStyles.container, { width: size * 1.1, height: size * 0.6, borderRadius: size * 0.3 }]}>
      <Text style={[artisticStyles.timeText, { fontSize: size * 0.2 }]}>{timeStr}</Text>
      <Text style={[artisticStyles.label, { fontSize: size * 0.07 }]}>
        {isMorning ? '~ good morning ~' : '~ good evening ~'}
      </Text>
    </View>
  );
};

const artisticStyles = StyleSheet.create({
  container: {
    backgroundColor: '#FFF8E7',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#D4C4A8',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  timeText: {
    color: '#5D4E37',
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
    letterSpacing: 2,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  label: {
    color: '#8B7355',
    fontWeight: '400',
    marginTop: 4,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontStyle: 'italic',
  },
});

// ========== Main Clock Sticker Design Component ==========
// Renders the appropriate clock style based on the style type
const ClockStickerDesign = ({ 
  style, 
  time,
  size = 120,
}: { 
  style: ClockStickerStyleType; 
  time: Date;
  size?: number;
}) => {
  switch (style) {
    case 1: // Luxury analog (Rolex-style)
      return <AnalogClock time={time} size={size} variant="luxury" />;
    
    case 2: // Flip clock
      return <FlipClock time={time} size={size} />;
    
    case 3: // Cloudy/dreamy
      return <CloudClock time={time} size={size} />;
    
    case 4: // Vintage alarm clock (analog)
      return <AnalogClock time={time} size={size} variant="vintage" />;
    
    case 5: // Neon sign
      return <NeonClock time={time} size={size} />;
    
    case 6: // Minimalist modern
      return <MinimalistClock time={time} size={size} />;
    
    case 7: // Retro LED digital
      return <RetroClock time={time} size={size} />;
    
    case 8: // Artistic/hand-drawn
      return <ArtisticClock time={time} size={size} />;
    
    case 9: // Clean digital (white, transparent)
      return <CleanDigitalClock time={time} size={size} />;
    
    default:
      return <AnalogClock time={time} size={size} variant="luxury" />;
  }
};

// ========== Text Editor Toolbar Mode ==========
type TextToolbarMode = 'fonts' | 'colors' | 'effects' | 'animations';

// ========== Music Tracks (Empty - Licensed tracks to be added later) ==========
// NOTE: All tracks removed for legal compliance
// Licensed music from Epidemic Sound or similar will be integrated later
const MUSIC_TRACKS: { id: string; title: string; artist: string; duration: string; reelCount: string; thumbnail: string }[] = [];
const TRENDING_TRACKS: typeof MUSIC_TRACKS = [];
const ORIGINAL_AUDIO: typeof MUSIC_TRACKS = [];
const SAVED_TRACKS: typeof MUSIC_TRACKS = [];

// ========== Text Overlay Type ==========
type TextOverlay = {
  id: string;
  content: string;
  fontStyle: typeof FONT_STYLES[0];
  color: string;
  alignment: TextAlignment;
  hasBackground: boolean;
  size: number;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  effect: string;
  animation: string;
};

// ========== Get Effect Style Helper ==========
const getEffectStyle = (effect: string, color: string) => {
  switch (effect) {
    case 'neon':
      return {
        textShadowColor: color,
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 15,
      };
    case 'sparkle':
      return {
        textShadowColor: '#FFD700',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 8,
      };
    case 'shimmer':
      return {
        textShadowColor: 'rgba(255, 255, 255, 0.8)',
        textShadowOffset: { width: 2, height: 2 },
        textShadowRadius: 4,
      };
    case 'pixel':
      return {
        letterSpacing: 2,
        textShadowColor: color,
        textShadowOffset: { width: 2, height: 2 },
        textShadowRadius: 0,
      };
    default:
      return {};
  }
};

// ========== Animated Text Component for Effects ==========
const AnimatedText = ({ 
  content, 
  style, 
  effect, 
  animation,
  color,
}: { 
  content: string;
  style: any;
  effect: string;
  animation: string;
  color: string;
}) => {
  // Use separate refs for each animation to avoid native driver conflicts
  // All animations use useNativeDriver: false for consistency
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const translateXAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;
  
  // Track active animations for cleanup
  const activeAnimations = useRef<Animated.CompositeAnimation[]>([]);

  useEffect(() => {
    // Stop all previous animations before starting new ones
    activeAnimations.current.forEach(anim => anim.stop());
    activeAnimations.current = [];
    
    // Reset all animated values
    scaleAnim.setValue(1);
    translateXAnim.setValue(0);
    translateYAnim.setValue(0);
    opacityAnim.setValue(1);

    const animations: Animated.CompositeAnimation[] = [];

    // ========== Visual Effects ==========
    if (effect === 'neon') {
      // Neon glow pulse via opacity
      const neonAnim = Animated.loop(
        Animated.sequence([
          Animated.timing(opacityAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: false,
          }),
          Animated.timing(opacityAnim, {
            toValue: 0.6,
            duration: 1000,
            useNativeDriver: false,
          }),
        ])
      );
      animations.push(neonAnim);
      neonAnim.start();
    } else if (effect === 'sparkle') {
      // Sparkle twinkle effect - subtle scale pulse
      const sparkleAnim = Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.05,
            duration: 300,
            useNativeDriver: false,
          }),
          Animated.timing(scaleAnim, {
            toValue: 0.98,
            duration: 300,
            useNativeDriver: false,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: false,
          }),
        ])
      );
      animations.push(sparkleAnim);
      sparkleAnim.start();
    } else if (effect === 'shimmer') {
      // Shimmer - subtle horizontal movement
      const shimmerAnim = Animated.loop(
        Animated.sequence([
          Animated.timing(translateXAnim, {
            toValue: 3,
            duration: 800,
            useNativeDriver: false,
          }),
          Animated.timing(translateXAnim, {
            toValue: -3,
            duration: 800,
            useNativeDriver: false,
          }),
          Animated.timing(translateXAnim, {
            toValue: 0,
            duration: 400,
            useNativeDriver: false,
          }),
        ])
      );
      animations.push(shimmerAnim);
      shimmerAnim.start();
    }

    // ========== Text Animations ==========
    if (animation === 'pop') {
      // Pop scale animation
      const popAnim = Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.15,
            duration: 200,
            useNativeDriver: false,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: false,
          }),
          Animated.delay(500),
        ])
      );
      animations.push(popAnim);
      popAnim.start();
    } else if (animation === 'jump') {
      // Jump up and down
      const jumpAnim = Animated.loop(
        Animated.sequence([
          Animated.timing(translateYAnim, {
            toValue: -15,
            duration: 300,
            useNativeDriver: false,
          }),
          Animated.timing(translateYAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: false,
          }),
          Animated.delay(400),
        ])
      );
      animations.push(jumpAnim);
      jumpAnim.start();
    } else if (animation === 'slide') {
      // Slide left to right
      const slideAnim = Animated.loop(
        Animated.sequence([
          Animated.timing(translateXAnim, {
            toValue: 10,
            duration: 500,
            useNativeDriver: false,
          }),
          Animated.timing(translateXAnim, {
            toValue: -10,
            duration: 1000,
            useNativeDriver: false,
          }),
          Animated.timing(translateXAnim, {
            toValue: 0,
            duration: 500,
            useNativeDriver: false,
          }),
        ])
      );
      animations.push(slideAnim);
      slideAnim.start();
    } else if (animation === 'typewriter') {
      // Typewriter - subtle bounce
      const typeAnim = Animated.loop(
        Animated.sequence([
          Animated.timing(opacityAnim, {
            toValue: 0.7,
            duration: 500,
            useNativeDriver: false,
          }),
          Animated.timing(opacityAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: false,
          }),
        ])
      );
      animations.push(typeAnim);
      typeAnim.start();
    }

    // Store active animations for cleanup
    activeAnimations.current = animations;

    // Cleanup function - stop all animations when effect/animation changes or component unmounts
    return () => {
      animations.forEach(anim => anim.stop());
      activeAnimations.current = [];
    };
  }, [effect, animation, scaleAnim, translateXAnim, translateYAnim, opacityAnim]);

  // Get static effect styles (shadows, etc.)
  const effectStyle = getEffectStyle(effect, color);

  return (
    <Animated.Text
      style={[
        style,
        effectStyle,
        {
          transform: [
            { scale: scaleAnim },
            { translateX: translateXAnim },
            { translateY: translateYAnim },
          ],
          opacity: opacityAnim,
        },
      ]}
    >
      {content}
    </Animated.Text>
  );
};

// ========== Draggable Text Overlay Component ==========
const DraggableTextOverlay = ({ 
  overlay, 
  onEdit, 
  onTransformUpdate,
  getTextStyle,
  onDragStateChange,
}: { 
  overlay: TextOverlay;
  onEdit: (id: string) => void;
  onTransformUpdate: (id: string, updates: Partial<{ x: number; y: number; scale: number; rotation: number }>) => void;
  getTextStyle: (fontStyle: typeof FONT_STYLES[0], color: string, size: number) => any;
  onDragStateChange?: (isDragging: boolean, pageY?: number) => void;
}) => {
  const pan = useRef(new Animated.ValueXY({ x: overlay.x, y: overlay.y })).current;
  const scale = useRef(new Animated.Value(overlay.scale)).current;
  const hasMoved = useRef(false);
  const rotation = useRef(new Animated.Value(overlay.rotation)).current;
  
  const lastOffset = useRef({ x: overlay.x, y: overlay.y });
  const lastScale = useRef(overlay.scale);
  const lastRotation = useRef(overlay.rotation);
  const initialDistance = useRef(0);
  const initialAngle = useRef(0);
  const initialCenter = useRef({ x: 0, y: 0 });
  const isPinching = useRef(false);
  const lastPageY = useRef(0);
  const lastDragCallTime = useRef(0);

  const getDistance = (touches: any[]) => {
    if (touches.length < 2) return 0;
    const dx = touches[0].pageX - touches[1].pageX;
    const dy = touches[0].pageY - touches[1].pageY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const getAngle = (touches: any[]) => {
    if (touches.length < 2) return 0;
    const dx = touches[1].pageX - touches[0].pageX;
    const dy = touches[1].pageY - touches[0].pageY;
    return Math.atan2(dy, dx) * (180 / Math.PI);
  };

  const getCenter = (touches: any[]) => {
    if (touches.length < 2) return { x: touches[0]?.pageX || 0, y: touches[0]?.pageY || 0 };
    return {
      x: (touches[0].pageX + touches[1].pageX) / 2,
      y: (touches[0].pageY + touches[1].pageY) / 2,
    };
  };

  const panResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponderCapture: (_, gs) => Math.abs(gs.dx) > 1 || Math.abs(gs.dy) > 1,
    onPanResponderGrant: (evt) => {
      hasMoved.current = false;
      lastDragCallTime.current = 0;
      const touches = evt.nativeEvent.touches;
      if (touches.length >= 2) {
        isPinching.current = true;
        initialDistance.current = getDistance(touches);
        initialAngle.current = getAngle(touches);
        initialCenter.current = getCenter(touches);
      } else {
        isPinching.current = false;
      }
    },
    onPanResponderMove: (evt, gestureState) => {
      const touches = evt.nativeEvent.touches;

      if (Math.abs(gestureState.dx) > 2 || Math.abs(gestureState.dy) > 2) {
        if (!hasMoved.current) {
          hasMoved.current = true;
          onDragStateChange?.(true);
        }
      }
      
      if (touches.length >= 2) {
        if (!hasMoved.current) {
          hasMoved.current = true;
          onDragStateChange?.(true);
        }
        if (!isPinching.current) {
          isPinching.current = true;
          initialDistance.current = getDistance(touches);
          initialAngle.current = getAngle(touches);
          initialCenter.current = getCenter(touches);
        }
        
        const currentDistance = getDistance(touches);
        if (initialDistance.current > 0) {
          const scaleFactor = currentDistance / initialDistance.current;
          const newScale = Math.max(0.3, Math.min(3, lastScale.current * scaleFactor));
          scale.setValue(newScale);
        }
        
        const currentAngle = getAngle(touches);
        const angleDiff = currentAngle - initialAngle.current;
        rotation.setValue(lastRotation.current + angleDiff);
        
        const currentCenter = getCenter(touches);
        pan.setValue({
          x: lastOffset.current.x + (currentCenter.x - initialCenter.current.x),
          y: lastOffset.current.y + (currentCenter.y - initialCenter.current.y),
        });
        
      } else if (!isPinching.current) {
        pan.setValue({
          x: lastOffset.current.x + gestureState.dx,
          y: lastOffset.current.y + gestureState.dy,
        });
      }

      // Throttle pageY reporting for boundary detection
      lastPageY.current = evt.nativeEvent.pageY;
      if (hasMoved.current) {
        const now = Date.now();
        if (now - lastDragCallTime.current > 50) {
          lastDragCallTime.current = now;
          onDragStateChange?.(true, evt.nativeEvent.pageY);
        }
      }
    },
    onPanResponderRelease: () => {
      if (hasMoved.current) {
        onDragStateChange?.(false);
      }
      hasMoved.current = false;
      // @ts-ignore
      lastOffset.current = { x: pan.x._value, y: pan.y._value };
      // @ts-ignore
      lastScale.current = scale._value || lastScale.current;
      // @ts-ignore
      lastRotation.current = rotation._value || lastRotation.current;
      
      onTransformUpdate(overlay.id, {
        x: lastOffset.current.x,
        y: lastOffset.current.y,
        scale: lastScale.current,
        rotation: lastRotation.current,
      });
      
      isPinching.current = false;
      initialDistance.current = 0;
    },
  }), [overlay.id, pan, scale, rotation, onTransformUpdate, onDragStateChange]);

  const rotateInterpolate = rotation.interpolate({
    inputRange: [-360, 360],
    outputRange: ['-360deg', '360deg'],
  });

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={[
        styles.draggableTextContainer,
        {
          transform: [
            { translateX: pan.x },
            { translateY: pan.y },
            { scale: scale },
            { rotate: rotateInterpolate },
          ],
        },
      ]}
    >
      <TouchableOpacity 
        onPress={() => onEdit(overlay.id)}
        activeOpacity={0.9}
        delayPressIn={200}
      >
        <View style={[
          overlay.hasBackground && {
            backgroundColor: overlay.color === '#FFFFFF' 
              ? 'rgba(0,0,0,0.7)' 
              : 'rgba(255,255,255,0.9)',
            paddingHorizontal: 16,
            paddingVertical: 10,
            borderRadius: 8,
            overflow: 'hidden',
          }
        ]}>
          <AnimatedText
            content={overlay.content}
            style={[
              getTextStyle(overlay.fontStyle, overlay.color, overlay.size),
              overlay.hasBackground && {
                color: overlay.color === '#FFFFFF' ? '#FFFFFF' : '#000000',
              }
            ]}
            effect={overlay.effect}
            animation={overlay.animation}
            color={overlay.color}
          />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ========== Draggable Clock Sticker Component ==========
const DraggableClockSticker = ({
  sticker,
  onTransformUpdate,
  onTap,
  onDragStateChange,
}: {
  sticker: {
    id: string;
    designIndex: number;
    x: number;
    y: number;
    scale: number;
    rotation: number;
    time: Date;
  };
  onTransformUpdate: (updates: Partial<{ x: number; y: number; scale: number; rotation: number }>) => void;
  onTap: () => void;
  onDragStateChange?: (isDragging: boolean, pageY?: number) => void;
}) => {
  const pan = useRef(new Animated.ValueXY({ x: sticker.x, y: sticker.y })).current;
  const scaleAnim = useRef(new Animated.Value(sticker.scale)).current;
  const rotation = useRef(new Animated.Value(sticker.rotation)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const popAnim = useRef(new Animated.Value(0.8)).current;

  const lastOffset = useRef({ x: sticker.x, y: sticker.y });
  const lastScale = useRef(sticker.scale);
  const lastRotation = useRef(sticker.rotation);
  const initialDistance = useRef(0);
  const initialAngle = useRef(0);
  const initialCenter = useRef({ x: 0, y: 0 });
  const isPinching = useRef(false);
  const hasMoved = useRef(false);
  const gestureStartTime = useRef(0);
  const lastPageY = useRef(0);
  const lastDragCallTime = useRef(0);

  // Pre-compute combined scale
  const combinedScale = useMemo(() => Animated.multiply(scaleAnim, popAnim), [scaleAnim, popAnim]);

  const getDistance = (touches: any[]) => {
    if (touches.length < 2) return 0;
    const dx = touches[0].pageX - touches[1].pageX;
    const dy = touches[0].pageY - touches[1].pageY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const getAngle = (touches: any[]) => {
    if (touches.length < 2) return 0;
    const dx = touches[1].pageX - touches[0].pageX;
    const dy = touches[1].pageY - touches[0].pageY;
    return Math.atan2(dy, dx) * (180 / Math.PI);
  };

  const getCenter = (touches: any[]) => {
    if (touches.length < 2) return { x: touches[0]?.pageX || 0, y: touches[0]?.pageY || 0 };
    return {
      x: (touches[0].pageX + touches[1].pageX) / 2,
      y: (touches[0].pageY + touches[1].pageY) / 2,
    };
  };

  const panResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponderCapture: (_, gs) => Math.abs(gs.dx) > 1 || Math.abs(gs.dy) > 1,
    onPanResponderGrant: (evt) => {
      const touches = evt.nativeEvent.touches;
      hasMoved.current = false;
      lastDragCallTime.current = 0;
      gestureStartTime.current = Date.now();
      if (touches.length >= 2) {
        isPinching.current = true;
        initialDistance.current = getDistance(touches);
        initialAngle.current = getAngle(touches);
        initialCenter.current = getCenter(touches);
      } else {
        isPinching.current = false;
      }
    },
    onPanResponderMove: (evt, gestureState) => {
      const touches = evt.nativeEvent.touches;
      
      if (Math.abs(gestureState.dx) > 2 || Math.abs(gestureState.dy) > 2) {
        if (!hasMoved.current) {
          hasMoved.current = true;
          onDragStateChange?.(true);
        }
      }

      if (touches.length >= 2) {
        if (!hasMoved.current) {
          hasMoved.current = true;
          onDragStateChange?.(true);
        }
        if (!isPinching.current) {
          isPinching.current = true;
          initialDistance.current = getDistance(touches);
          initialAngle.current = getAngle(touches);
          initialCenter.current = getCenter(touches);
        }

        // Scale
        const currentDistance = getDistance(touches);
        if (initialDistance.current > 0) {
          const scaleFactor = currentDistance / initialDistance.current;
          const newScale = Math.max(0.5, Math.min(2.5, lastScale.current * scaleFactor));
          scaleAnim.setValue(newScale);
        }

        // Rotation
        const currentAngle = getAngle(touches);
        const angleDiff = currentAngle - initialAngle.current;
        rotation.setValue(lastRotation.current + angleDiff);

        // Move while pinching
        const currentCenter = getCenter(touches);
        const centerDx = currentCenter.x - initialCenter.current.x;
        const centerDy = currentCenter.y - initialCenter.current.y;
        pan.setValue({
          x: lastOffset.current.x + centerDx,
          y: lastOffset.current.y + centerDy,
        });
      } else if (!isPinching.current) {
        // Single finger drag
        pan.setValue({
          x: lastOffset.current.x + gestureState.dx,
          y: lastOffset.current.y + gestureState.dy,
        });
      }

      // Throttle pageY reporting for boundary detection
      lastPageY.current = evt.nativeEvent.pageY;
      if (hasMoved.current) {
        const now = Date.now();
        if (now - lastDragCallTime.current > 50) {
          lastDragCallTime.current = now;
          onDragStateChange?.(true, evt.nativeEvent.pageY);
        }
      }
    },
    onPanResponderRelease: () => {
      // @ts-ignore
      lastOffset.current = { x: pan.x._value, y: pan.y._value };
      // @ts-ignore
      lastScale.current = scaleAnim._value || lastScale.current;
      // @ts-ignore
      lastRotation.current = rotation._value || lastRotation.current;

      onTransformUpdate({
        x: lastOffset.current.x,
        y: lastOffset.current.y,
        scale: lastScale.current,
        rotation: lastRotation.current,
      });

      // Detect tap: short duration and no significant movement
      const gestureDuration = Date.now() - gestureStartTime.current;
      if (!hasMoved.current && gestureDuration < 200) {
        onTap();
      }

      if (hasMoved.current) {
        onDragStateChange?.(false);
      }
      isPinching.current = false;
      initialDistance.current = 0;
      hasMoved.current = false;
    },
  }), [pan, scaleAnim, rotation, onTransformUpdate, onTap, onDragStateChange]);

  const rotateInterpolate = rotation.interpolate({
    inputRange: [-360, 360],
    outputRange: ['-360deg', '360deg'],
  });

  // Pop-in animation on mount
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(popAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, popAnim]);

  // Get the clock style (1-8)
  const clockStyle = ((sticker.designIndex % 9) + 1) as ClockStickerStyleType;

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={[
        styles.clockStickerDraggable,
        {
          opacity: fadeAnim,
          transform: [
            { translateX: pan.x },
            { translateY: pan.y },
            { scale: combinedScale },
            { rotate: rotateInterpolate },
          ],
        },
      ]}
    >
      <ClockStickerDesign style={clockStyle} time={sticker.time} size={130} />
    </Animated.View>
  );
};

// ========== Draggable Clinic Location Sticker Component ==========
const DraggableClinicSticker = ({
  sticker,
  onTransformUpdate,
  onDragStateChange,
}: {
  sticker: {
    id: string;
    clinicName: string;
    city: string;
    x: number;
    y: number;
    scale: number;
    rotation: number;
  };
  onTransformUpdate: (updates: Partial<{ x: number; y: number; scale: number; rotation: number }>) => void;
  onDragStateChange?: (isDragging: boolean, pageY?: number) => void;
}) => {
  const pan = useRef(new Animated.ValueXY({ x: sticker.x, y: sticker.y })).current;
  const scale = useRef(new Animated.Value(sticker.scale)).current;
  const rotation = useRef(new Animated.Value(sticker.rotation)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const popAnim = useRef(new Animated.Value(0.8)).current;

  const lastOffset = useRef({ x: sticker.x, y: sticker.y });
  const lastScale = useRef(sticker.scale);
  const lastRotation = useRef(sticker.rotation);
  const initialDistance = useRef(0);
  const initialAngle = useRef(0);
  const initialCenter = useRef({ x: 0, y: 0 });
  const isPinching = useRef(false);
  const hasMoved = useRef(false);
  const lastPageY = useRef(0);
  const lastDragCallTime = useRef(0);

  // Pre-compute combined scale
  const combinedScale = useMemo(() => Animated.multiply(scale, popAnim), [scale, popAnim]);

  const getDistance = (touches: any[]) => {
    if (touches.length < 2) return 0;
    const dx = touches[0].pageX - touches[1].pageX;
    const dy = touches[0].pageY - touches[1].pageY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const getAngle = (touches: any[]) => {
    if (touches.length < 2) return 0;
    const dx = touches[1].pageX - touches[0].pageX;
    const dy = touches[1].pageY - touches[0].pageY;
    return Math.atan2(dy, dx) * (180 / Math.PI);
  };

  const getCenter = (touches: any[]) => {
    if (touches.length < 2) return { x: touches[0]?.pageX || 0, y: touches[0]?.pageY || 0 };
    return {
      x: (touches[0].pageX + touches[1].pageX) / 2,
      y: (touches[0].pageY + touches[1].pageY) / 2,
    };
  };

  const panResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponderCapture: (_, gs) => Math.abs(gs.dx) > 1 || Math.abs(gs.dy) > 1,
    onPanResponderGrant: (evt) => {
      hasMoved.current = false;
      lastDragCallTime.current = 0;
      const touches = evt.nativeEvent.touches;
      if (touches.length >= 2) {
        isPinching.current = true;
        initialDistance.current = getDistance(touches);
        initialAngle.current = getAngle(touches);
        initialCenter.current = getCenter(touches);
      } else {
        isPinching.current = false;
      }
    },
    onPanResponderMove: (evt, gestureState) => {
      const touches = evt.nativeEvent.touches;

      if (Math.abs(gestureState.dx) > 2 || Math.abs(gestureState.dy) > 2) {
        if (!hasMoved.current) {
          hasMoved.current = true;
          onDragStateChange?.(true);
        }
      }

      if (touches.length >= 2) {
        if (!hasMoved.current) {
          hasMoved.current = true;
          onDragStateChange?.(true);
        }
        if (!isPinching.current) {
          isPinching.current = true;
          initialDistance.current = getDistance(touches);
          initialAngle.current = getAngle(touches);
          initialCenter.current = getCenter(touches);
        }

        const currentDistance = getDistance(touches);
        if (initialDistance.current > 0) {
          const scaleFactor = currentDistance / initialDistance.current;
          const newScale = Math.max(0.5, Math.min(2.5, lastScale.current * scaleFactor));
          scale.setValue(newScale);
        }

        const currentAngle = getAngle(touches);
        const angleDiff = currentAngle - initialAngle.current;
        rotation.setValue(lastRotation.current + angleDiff);

        const currentCenter = getCenter(touches);
        pan.setValue({
          x: lastOffset.current.x + (currentCenter.x - initialCenter.current.x),
          y: lastOffset.current.y + (currentCenter.y - initialCenter.current.y),
        });
      } else if (!isPinching.current) {
        pan.setValue({
          x: lastOffset.current.x + gestureState.dx,
          y: lastOffset.current.y + gestureState.dy,
        });
      }

      // Throttle pageY reporting for boundary detection
      lastPageY.current = evt.nativeEvent.pageY;
      if (hasMoved.current) {
        const now = Date.now();
        if (now - lastDragCallTime.current > 50) {
          lastDragCallTime.current = now;
          onDragStateChange?.(true, evt.nativeEvent.pageY);
        }
      }
    },
    onPanResponderRelease: () => {
      if (hasMoved.current) {
        onDragStateChange?.(false);
      }
      hasMoved.current = false;
      // @ts-ignore
      lastOffset.current = { x: pan.x._value, y: pan.y._value };
      // @ts-ignore
      lastScale.current = scale._value || lastScale.current;
      // @ts-ignore
      lastRotation.current = rotation._value || lastRotation.current;

      onTransformUpdate({
        x: lastOffset.current.x,
        y: lastOffset.current.y,
        scale: lastScale.current,
        rotation: lastRotation.current,
      });

      isPinching.current = false;
      initialDistance.current = 0;
    },
  }), [pan, scale, rotation, onTransformUpdate, onDragStateChange]);

  const rotateInterpolate = rotation.interpolate({
    inputRange: [-360, 360],
    outputRange: ['-360deg', '360deg'],
  });

  // Pop-in animation on mount
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(popAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, popAnim]);

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={[
        styles.clinicStickerContainer,
        {
          opacity: fadeAnim,
          transform: [
            { translateX: pan.x },
            { translateY: pan.y },
            { scale: combinedScale },
            { rotate: rotateInterpolate },
          ],
        },
      ]}
    >
      <LinearGradient
        colors={['#833AB4', '#E91E63', '#F77737']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.clinicStickerGradient}
      >
        {/* Clinic Name - Large, bold */}
        <Text style={styles.clinicStickerName}>
          {sticker.clinicName}
        </Text>
        {/* City - Smaller, lighter */}
        <Text style={styles.clinicStickerCity}>
          {sticker.city}
        </Text>
      </LinearGradient>
    </Animated.View>
  );
};

// ========== Draggable Photo Sticker Component ==========
const DraggablePhotoSticker = ({
  sticker,
  onTransformUpdate,
  onRemove,
  onDragStateChange,
}: {
  sticker: PhotoSticker;
  onTransformUpdate: (id: string, updates: Partial<{ x: number; y: number; scale: number; rotation: number }>) => void;
  onRemove: (id: string) => void;
  onDragStateChange?: (isDragging: boolean, pageY?: number) => void;
}) => {
  const pan = useRef(new Animated.ValueXY({ x: sticker.x, y: sticker.y })).current;
  const scale = useRef(new Animated.Value(sticker.scale)).current;
  const rotation = useRef(new Animated.Value(sticker.rotation)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const popAnim = useRef(new Animated.Value(0.8)).current;

  const lastOffset = useRef({ x: sticker.x, y: sticker.y });
  const lastScale = useRef(sticker.scale);
  const lastRotation = useRef(sticker.rotation);
  const initialDistance = useRef(0);
  const initialAngle = useRef(0);
  const initialCenter = useRef({ x: 0, y: 0 });
  const isPinching = useRef(false);
  const doubleTapRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tapCount = useRef(0);
  const hasMoved = useRef(false);
  const lastPageY = useRef(0);
  const lastDragCallTime = useRef(0);

  // Pre-compute combined scale
  const combinedScale = useMemo(() => Animated.multiply(scale, popAnim), [scale, popAnim]);

  const getDistance = (touches: any[]) => {
    if (touches.length < 2) return 0;
    const dx = touches[0].pageX - touches[1].pageX;
    const dy = touches[0].pageY - touches[1].pageY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const getAngle = (touches: any[]) => {
    if (touches.length < 2) return 0;
    const dx = touches[1].pageX - touches[0].pageX;
    const dy = touches[1].pageY - touches[0].pageY;
    return Math.atan2(dy, dx) * (180 / Math.PI);
  };

  const getCenter = (touches: any[]) => {
    if (touches.length < 2) return { x: touches[0]?.pageX || 0, y: touches[0]?.pageY || 0 };
    return {
      x: (touches[0].pageX + touches[1].pageX) / 2,
      y: (touches[0].pageY + touches[1].pageY) / 2,
    };
  };

  const panResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponderCapture: (_, gs) => Math.abs(gs.dx) > 1 || Math.abs(gs.dy) > 1,
    onPanResponderGrant: (evt) => {
      hasMoved.current = false;
      lastDragCallTime.current = 0;
      const touches = evt.nativeEvent.touches;
      if (touches.length >= 2) {
        isPinching.current = true;
        initialDistance.current = getDistance(touches);
        initialAngle.current = getAngle(touches);
        initialCenter.current = getCenter(touches);
      } else {
        isPinching.current = false;
        // Handle double tap for removal
        tapCount.current += 1;
        if (tapCount.current === 1) {
          doubleTapRef.current = setTimeout(() => {
            tapCount.current = 0;
          }, 300);
        } else if (tapCount.current === 2) {
          if (doubleTapRef.current) clearTimeout(doubleTapRef.current);
          tapCount.current = 0;
          onRemove(sticker.id);
        }
      }
    },
    onPanResponderMove: (evt, gestureState) => {
      const touches = evt.nativeEvent.touches;

      if (Math.abs(gestureState.dx) > 2 || Math.abs(gestureState.dy) > 2) {
        if (!hasMoved.current) {
          hasMoved.current = true;
          onDragStateChange?.(true);
        }
      }

      if (touches.length >= 2) {
        if (!hasMoved.current) {
          hasMoved.current = true;
          onDragStateChange?.(true);
        }
        if (!isPinching.current) {
          isPinching.current = true;
          initialDistance.current = getDistance(touches);
          initialAngle.current = getAngle(touches);
          initialCenter.current = getCenter(touches);
        }

        // Scale
        const currentDistance = getDistance(touches);
        if (initialDistance.current > 0) {
          const scaleFactor = currentDistance / initialDistance.current;
          const newScale = Math.max(0.2, Math.min(4, lastScale.current * scaleFactor));
          scale.setValue(newScale);
        }

        // Rotation
        const currentAngle = getAngle(touches);
        const angleDiff = currentAngle - initialAngle.current;
        rotation.setValue(lastRotation.current + angleDiff);

        // Move while pinching
        const currentCenter = getCenter(touches);
        const centerDx = currentCenter.x - initialCenter.current.x;
        const centerDy = currentCenter.y - initialCenter.current.y;
        pan.setValue({
          x: lastOffset.current.x + centerDx,
          y: lastOffset.current.y + centerDy,
        });
      } else if (!isPinching.current) {
        // Single finger drag
        pan.setValue({
          x: lastOffset.current.x + gestureState.dx,
          y: lastOffset.current.y + gestureState.dy,
        });
      }

      // Throttle pageY reporting for boundary detection
      lastPageY.current = evt.nativeEvent.pageY;
      if (hasMoved.current) {
        const now = Date.now();
        if (now - lastDragCallTime.current > 50) {
          lastDragCallTime.current = now;
          onDragStateChange?.(true, evt.nativeEvent.pageY);
        }
      }
    },
    onPanResponderRelease: () => {
      if (hasMoved.current) {
        onDragStateChange?.(false);
      }
      hasMoved.current = false;
      // @ts-ignore
      lastOffset.current = { x: pan.x._value, y: pan.y._value };
      // @ts-ignore
      lastScale.current = scale._value || lastScale.current;
      // @ts-ignore
      lastRotation.current = rotation._value || lastRotation.current;

      onTransformUpdate(sticker.id, {
        x: lastOffset.current.x,
        y: lastOffset.current.y,
        scale: lastScale.current,
        rotation: lastRotation.current,
      });

      isPinching.current = false;
      initialDistance.current = 0;
    },
  }), [pan, scale, rotation, onTransformUpdate, onRemove, sticker.id, onDragStateChange]);

  const rotateInterpolate = rotation.interpolate({
    inputRange: [-360, 360],
    outputRange: ['-360deg', '360deg'],
  });

  // Pop-in animation on mount
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(popAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, popAnim]);

  // Calculate aspect ratio for the sticker
  const aspectRatio = sticker.width / sticker.height;
  const stickerWidth = 150;
  const stickerHeight = stickerWidth / aspectRatio;

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={[
        styles.photoStickerContainer,
        {
          opacity: fadeAnim,
          transform: [
            { translateX: pan.x },
            { translateY: pan.y },
            { scale: combinedScale },
            { rotate: rotateInterpolate },
          ],
        },
      ]}
    >
      <ExpoImage
        source={{ uri: sticker.uri }}
        style={{
          width: stickerWidth,
          height: stickerHeight,
          borderRadius: 8,
        }}
        contentFit="cover"
      />
    </Animated.View>
  );
};

// ========== Draggable Phone Sticker Component ==========
const DraggablePhoneSticker = ({
  sticker,
  onTransformUpdate,
  onRemove,
  onDragStateChange,
  onLongPress,
  isSettingsOpen,
  onToggleCallable,
  isViewerMode = false,
}: {
  sticker: PhoneStickerOnCanvas;
  onTransformUpdate: (id: string, updates: Partial<{ x: number; y: number; scale: number; rotation: number }>) => void;
  onRemove: (id: string) => void;
  onDragStateChange?: (isDragging: boolean, pageY?: number) => void;
  onLongPress?: (id: string) => void;
  isSettingsOpen?: boolean;
  onToggleCallable?: (id: string) => void;
  isViewerMode?: boolean;
}) => {
  const pan = useRef(new Animated.ValueXY({ x: sticker.x, y: sticker.y })).current;
  const scaleAnim = useRef(new Animated.Value(sticker.scale)).current;
  const rotation = useRef(new Animated.Value(sticker.rotation)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const popAnim = useRef(new Animated.Value(0.8)).current;

  const lastOffset = useRef({ x: sticker.x, y: sticker.y });
  const lastScale = useRef(sticker.scale);
  const lastRotation = useRef(sticker.rotation);
  const initialDistance = useRef(0);
  const initialAngle = useRef(0);
  const initialCenter = useRef({ x: 0, y: 0 });
  const isPinching = useRef(false);
  const hasMoved = useRef(false);
  const lastPageY = useRef(0);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastDragCallTime = useRef(0);
  const [showCallHint, setShowCallHint] = useState(false);

  // Pre-compute combined scale to avoid creating new Animated node on each render
  const combinedScale = useMemo(() => Animated.multiply(scaleAnim, popAnim), [scaleAnim, popAnim]);

  const getDistance = (touches: any[]) => {
    if (touches.length < 2) return 0;
    const dx = touches[0].pageX - touches[1].pageX;
    const dy = touches[0].pageY - touches[1].pageY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const getAngle = (touches: any[]) => {
    if (touches.length < 2) return 0;
    const dx = touches[1].pageX - touches[0].pageX;
    const dy = touches[1].pageY - touches[0].pageY;
    return Math.atan2(dy, dx) * (180 / Math.PI);
  };

  const getCenter = (touches: any[]) => {
    if (touches.length < 2) return { x: touches[0]?.pageX || 0, y: touches[0]?.pageY || 0 };
    return {
      x: (touches[0].pageX + touches[1].pageX) / 2,
      y: (touches[0].pageY + touches[1].pageY) / 2,
    };
  };

  // ── Viewer mode: tap handler ──
  const handleViewerTap = useCallback(() => {
    if (!isViewerMode || !sticker.isCallable) return;
    setShowCallHint(true);
    setTimeout(() => {
      setShowCallHint(false);
      const tel = `tel:${sticker.phoneNumber.replace(/[^0-9+]/g, '')}`;
      Linking.openURL(tel).catch(() => {
        Alert.alert('Unable to open dialer', 'Could not open the phone app.');
      });
    }, 800);
  }, [isViewerMode, sticker.isCallable, sticker.phoneNumber]);

  const panResponder = useMemo(() => {
    if (isViewerMode) {
      return PanResponder.create({
        onStartShouldSetPanResponder: () => sticker.isCallable,
        onPanResponderRelease: () => handleViewerTap(),
      });
    }

    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      // Capture phase: claim gesture immediately to reduce delay
      onMoveShouldSetPanResponderCapture: (_, gs) => Math.abs(gs.dx) > 1 || Math.abs(gs.dy) > 1,
      onPanResponderGrant: (evt) => {
        hasMoved.current = false;
        lastDragCallTime.current = 0;
        const touches = evt.nativeEvent.touches;
        if (touches.length >= 2) {
          isPinching.current = true;
          initialDistance.current = getDistance(touches);
          initialAngle.current = getAngle(touches);
          initialCenter.current = getCenter(touches);
        } else {
          isPinching.current = false;
          longPressTimer.current = setTimeout(() => {
            if (!hasMoved.current) {
              onLongPress?.(sticker.id);
            }
          }, 500);
        }
      },
      onPanResponderMove: (evt, gestureState) => {
        const touches = evt.nativeEvent.touches;

        if (Math.abs(gestureState.dx) > 2 || Math.abs(gestureState.dy) > 2) {
          if (!hasMoved.current) {
            hasMoved.current = true;
            onDragStateChange?.(true);
            if (longPressTimer.current) {
              clearTimeout(longPressTimer.current);
              longPressTimer.current = null;
            }
          }
        }

        if (touches.length >= 2) {
          hasMoved.current = true;
          if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
          }
          if (!isPinching.current) {
            isPinching.current = true;
            initialDistance.current = getDistance(touches);
            initialAngle.current = getAngle(touches);
            initialCenter.current = getCenter(touches);
          }
          const currentDistance = getDistance(touches);
          if (initialDistance.current > 0) {
            const scaleFactor = currentDistance / initialDistance.current;
            const newScale = Math.max(0.3, Math.min(3, lastScale.current * scaleFactor));
            scaleAnim.setValue(newScale);
          }
          const currentAngle = getAngle(touches);
          const angleDiff = currentAngle - initialAngle.current;
          rotation.setValue(lastRotation.current + angleDiff);

          const currentCenter = getCenter(touches);
          pan.setValue({
            x: lastOffset.current.x + (currentCenter.x - initialCenter.current.x),
            y: lastOffset.current.y + (currentCenter.y - initialCenter.current.y),
          });
        } else if (!isPinching.current) {
          pan.setValue({
            x: lastOffset.current.x + gestureState.dx,
            y: lastOffset.current.y + gestureState.dy,
          });
        }

        // Throttle trash zone detection to every 50ms (avoid setState spam)
        lastPageY.current = evt.nativeEvent.pageY;
        if (hasMoved.current) {
          const now = Date.now();
          if (now - lastDragCallTime.current > 50) {
            lastDragCallTime.current = now;
            onDragStateChange?.(true, evt.nativeEvent.pageY);
          }
        }
      },
      onPanResponderRelease: () => {
        if (longPressTimer.current) {
          clearTimeout(longPressTimer.current);
          longPressTimer.current = null;
        }

        // @ts-ignore
        lastOffset.current = { x: pan.x._value, y: pan.y._value };
        // @ts-ignore
        lastScale.current = scaleAnim._value || lastScale.current;
        // @ts-ignore
        lastRotation.current = rotation._value || lastRotation.current;

        onTransformUpdate(sticker.id, {
          x: lastOffset.current.x,
          y: lastOffset.current.y,
          scale: lastScale.current,
          rotation: lastRotation.current,
        });

        const TRASH_ZONE_TOP = SCREEN_HEIGHT - 120;
        if (hasMoved.current && lastPageY.current > TRASH_ZONE_TOP) {
          onRemove(sticker.id);
        }

        isPinching.current = false;
        initialDistance.current = 0;
        hasMoved.current = false;
        onDragStateChange?.(false);
      },
    });
  }, [pan, scaleAnim, rotation, onTransformUpdate, onRemove, onDragStateChange, sticker.id, onLongPress, isViewerMode, handleViewerTap, sticker.isCallable]);

  const rotateInterpolate = rotation.interpolate({
    inputRange: [-360, 360],
    outputRange: ['-360deg', '360deg'],
  });

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.spring(popAnim, { toValue: 1, tension: 100, friction: 8, useNativeDriver: true }),
    ]).start();
  }, [fadeAnim, popAnim]);

  const design = PHONE_STICKER_DESIGNS.find(d => d.id === sticker.designId) ?? PHONE_STICKER_DESIGNS_EXTENDED.find(d => d.id === sticker.designId);
  if (!design) return null;
  const StickerComponent = design.Component;

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={[
        styles.photoStickerContainer,
        {
          opacity: fadeAnim,
          transform: [
            { translateX: pan.x },
            { translateY: pan.y },
            { scale: combinedScale },
            { rotate: rotateInterpolate },
          ],
        },
      ]}
    >
      <StickerComponent phoneNumber={sticker.phoneNumber} size={140} />

      {/* Viewer mode: "Tap to Call" hint */}
      {isViewerMode && sticker.isCallable && showCallHint && (
        <View style={{
          position: 'absolute',
          top: -36,
          alignSelf: 'center',
          backgroundColor: 'rgba(0,0,0,0.8)',
          paddingHorizontal: 12,
          paddingVertical: 6,
          borderRadius: 16,
        }}>
          <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '600' }}>📞 Tap to Call</Text>
        </View>
      )}
    </Animated.View>
  );
};

// ========== Draggable Clinic Name Sticker Component ==========
const DraggableClinicNameSticker = ({
  sticker,
  onTransformUpdate,
  onRemove,
  onDragStateChange,
  onLongPress,
  isSettingsOpen,
  onToggleNavigable,
  isViewerMode = false,
  clinicId,
}: {
  sticker: ClinicNameStickerOnCanvas;
  onTransformUpdate: (id: string, updates: Partial<{ x: number; y: number; scale: number; rotation: number }>) => void;
  onRemove: (id: string) => void;
  onDragStateChange?: (isDragging: boolean, pageY?: number) => void;
  onLongPress?: (id: string) => void;
  isSettingsOpen?: boolean;
  onToggleNavigable?: (id: string) => void;
  isViewerMode?: boolean;
  clinicId?: string;
}) => {
  const router = useRouter();
  const pan = useRef(new Animated.ValueXY({ x: sticker.x, y: sticker.y })).current;
  const scaleAnim = useRef(new Animated.Value(sticker.scale)).current;
  const rotation = useRef(new Animated.Value(sticker.rotation)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const popAnim = useRef(new Animated.Value(0.8)).current;

  const lastOffset = useRef({ x: sticker.x, y: sticker.y });
  const lastScale = useRef(sticker.scale);
  const lastRotation = useRef(sticker.rotation);
  const initialDistance = useRef(0);
  const initialAngle = useRef(0);
  const initialCenter = useRef({ x: 0, y: 0 });
  const isPinching = useRef(false);
  const hasMoved = useRef(false);
  const lastPageY = useRef(0);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastDragCallTime = useRef(0);
  const [showNavigateHint, setShowNavigateHint] = useState(false);

  // Pre-compute combined scale to avoid creating new Animated node on each render
  const combinedScale = useMemo(() => Animated.multiply(scaleAnim, popAnim), [scaleAnim, popAnim]);

  const getDistance = (touches: any[]) => {
    if (touches.length < 2) return 0;
    const dx = touches[0].pageX - touches[1].pageX;
    const dy = touches[0].pageY - touches[1].pageY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const getAngle = (touches: any[]) => {
    if (touches.length < 2) return 0;
    const dx = touches[1].pageX - touches[0].pageX;
    const dy = touches[1].pageY - touches[0].pageY;
    return Math.atan2(dy, dx) * (180 / Math.PI);
  };

  const getCenter = (touches: any[]) => {
    if (touches.length < 2) return { x: touches[0]?.pageX || 0, y: touches[0]?.pageY || 0 };
    return {
      x: (touches[0].pageX + touches[1].pageX) / 2,
      y: (touches[0].pageY + touches[1].pageY) / 2,
    };
  };

  // ── Viewer mode: tap handler ──
  const handleViewerTap = useCallback(() => {
    if (!isViewerMode || !sticker.isNavigable) return;
    setShowNavigateHint(true);
    setTimeout(() => {
      setShowNavigateHint(false);
      if (clinicId) {
        router.push({ pathname: '/clinic/clinic-profile-viewer', params: { clinicId } } as any);
      }
    }, 800);
  }, [isViewerMode, sticker.isNavigable, clinicId, router]);

  const panResponder = useMemo(() => {
    if (isViewerMode) {
      return PanResponder.create({
        onStartShouldSetPanResponder: () => sticker.isNavigable,
        onPanResponderRelease: () => handleViewerTap(),
      });
    }

    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      // Capture phase: claim gesture immediately to reduce delay
      onMoveShouldSetPanResponderCapture: (_, gs) => Math.abs(gs.dx) > 1 || Math.abs(gs.dy) > 1,
      onPanResponderGrant: (evt) => {
        hasMoved.current = false;
        lastDragCallTime.current = 0;
        const touches = evt.nativeEvent.touches;
        if (touches.length >= 2) {
          isPinching.current = true;
          initialDistance.current = getDistance(touches);
          initialAngle.current = getAngle(touches);
          initialCenter.current = getCenter(touches);
        } else {
          isPinching.current = false;
          longPressTimer.current = setTimeout(() => {
            if (!hasMoved.current) {
              onLongPress?.(sticker.id);
            }
          }, 500);
        }
      },
      onPanResponderMove: (evt, gestureState) => {
        const touches = evt.nativeEvent.touches;

        if (Math.abs(gestureState.dx) > 2 || Math.abs(gestureState.dy) > 2) {
          if (!hasMoved.current) {
            hasMoved.current = true;
            onDragStateChange?.(true);
            if (longPressTimer.current) {
              clearTimeout(longPressTimer.current);
              longPressTimer.current = null;
            }
          }
        }

        if (touches.length >= 2) {
          hasMoved.current = true;
          if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
          }
          if (!isPinching.current) {
            isPinching.current = true;
            initialDistance.current = getDistance(touches);
            initialAngle.current = getAngle(touches);
            initialCenter.current = getCenter(touches);
          }
          const currentDistance = getDistance(touches);
          if (initialDistance.current > 0) {
            const scaleFactor = currentDistance / initialDistance.current;
            const newScale = Math.max(0.3, Math.min(3, lastScale.current * scaleFactor));
            scaleAnim.setValue(newScale);
          }
          const currentAngle = getAngle(touches);
          const angleDiff = currentAngle - initialAngle.current;
          rotation.setValue(lastRotation.current + angleDiff);

          const currentCenter = getCenter(touches);
          pan.setValue({
            x: lastOffset.current.x + (currentCenter.x - initialCenter.current.x),
            y: lastOffset.current.y + (currentCenter.y - initialCenter.current.y),
          });
        } else if (!isPinching.current) {
          pan.setValue({
            x: lastOffset.current.x + gestureState.dx,
            y: lastOffset.current.y + gestureState.dy,
          });
        }

        // Throttle trash zone detection to every 50ms (avoid setState spam)
        lastPageY.current = evt.nativeEvent.pageY;
        if (hasMoved.current) {
          const now = Date.now();
          if (now - lastDragCallTime.current > 50) {
            lastDragCallTime.current = now;
            onDragStateChange?.(true, evt.nativeEvent.pageY);
          }
        }
      },
      onPanResponderRelease: () => {
        if (longPressTimer.current) {
          clearTimeout(longPressTimer.current);
          longPressTimer.current = null;
        }

        // @ts-ignore
        lastOffset.current = { x: pan.x._value, y: pan.y._value };
        // @ts-ignore
        lastScale.current = scaleAnim._value || lastScale.current;
        // @ts-ignore
        lastRotation.current = rotation._value || lastRotation.current;

        onTransformUpdate(sticker.id, {
          x: lastOffset.current.x,
          y: lastOffset.current.y,
          scale: lastScale.current,
          rotation: lastRotation.current,
        });

        const TRASH_ZONE_TOP = SCREEN_HEIGHT - 120;
        if (hasMoved.current && lastPageY.current > TRASH_ZONE_TOP) {
          onRemove(sticker.id);
        }

        isPinching.current = false;
        initialDistance.current = 0;
        hasMoved.current = false;
        onDragStateChange?.(false);
      },
    });
  }, [pan, scaleAnim, rotation, onTransformUpdate, onRemove, onDragStateChange, sticker.id, onLongPress, isViewerMode, handleViewerTap, sticker.isNavigable]);

  const rotateInterpolate = rotation.interpolate({
    inputRange: [-360, 360],
    outputRange: ['-360deg', '360deg'],
  });

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.spring(popAnim, { toValue: 1, tension: 100, friction: 8, useNativeDriver: true }),
    ]).start();
  }, [fadeAnim, popAnim]);

  const design = CLINIC_NAME_STICKER_DESIGNS.find(d => d.id === sticker.designId) ?? CLINIC_NAME_STICKER_DESIGNS_EXTENDED.find(d => d.id === sticker.designId);
  if (!design) return null;
  const StickerComponent = design.Component;

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={[
        styles.photoStickerContainer,
        {
          opacity: fadeAnim,
          transform: [
            { translateX: pan.x },
            { translateY: pan.y },
            { scale: combinedScale },
            { rotate: rotateInterpolate },
          ],
        },
      ]}
    >
      <StickerComponent clinicName={sticker.clinicName} size={140} />

      {/* Viewer mode: "Tap to View" hint */}
      {isViewerMode && sticker.isNavigable && showNavigateHint && (
        <View style={{
          position: 'absolute',
          top: -36,
          alignSelf: 'center',
          backgroundColor: 'rgba(0,0,0,0.8)',
          paddingHorizontal: 12,
          paddingVertical: 6,
          borderRadius: 16,
        }}>
          <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '600' }}>🏥 View Clinic</Text>
        </View>
      )}
    </Animated.View>
  );
};

// ========== Draggable Combo Sticker Component ==========
const DraggableComboSticker = ({
  sticker,
  onTransformUpdate,
  onRemove,
  onDragStateChange,
  onLongPress,
  isSettingsOpen,
  onToggleInteractive,
  isViewerMode = false,
  clinicId,
}: {
  sticker: ComboStickerOnCanvas;
  onTransformUpdate: (id: string, updates: Partial<{ x: number; y: number; scale: number; rotation: number }>) => void;
  onRemove: (id: string) => void;
  onDragStateChange?: (isDragging: boolean, pageY?: number) => void;
  onLongPress?: (id: string) => void;
  isSettingsOpen?: boolean;
  onToggleInteractive?: (id: string) => void;
  isViewerMode?: boolean;
  clinicId?: string;
}) => {
  const router = useRouter();
  const pan = useRef(new Animated.ValueXY({ x: sticker.x, y: sticker.y })).current;
  const scaleAnim = useRef(new Animated.Value(sticker.scale)).current;
  const rotation = useRef(new Animated.Value(sticker.rotation)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const popAnim = useRef(new Animated.Value(0.8)).current;

  const lastOffset = useRef({ x: sticker.x, y: sticker.y });
  const lastScale = useRef(sticker.scale);
  const lastRotation = useRef(sticker.rotation);
  const initialDistance = useRef(0);
  const initialAngle = useRef(0);
  const initialCenter = useRef({ x: 0, y: 0 });
  const isPinching = useRef(false);
  const hasMoved = useRef(false);
  const lastPageY = useRef(0);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastDragCallTime = useRef(0);
  const [showHint, setShowHint] = useState(false);

  // Pre-compute combined scale to avoid creating new Animated node on each render
  const combinedScale = useMemo(() => Animated.multiply(scaleAnim, popAnim), [scaleAnim, popAnim]);

  const getDistance = (touches: any[]) => {
    if (touches.length < 2) return 0;
    const dx = touches[0].pageX - touches[1].pageX;
    const dy = touches[0].pageY - touches[1].pageY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const getAngle = (touches: any[]) => {
    if (touches.length < 2) return 0;
    const dx = touches[1].pageX - touches[0].pageX;
    const dy = touches[1].pageY - touches[0].pageY;
    return Math.atan2(dy, dx) * (180 / Math.PI);
  };

  const getCenter = (touches: any[]) => {
    if (touches.length < 2) return { x: touches[0]?.pageX || 0, y: touches[0]?.pageY || 0 };
    return {
      x: (touches[0].pageX + touches[1].pageX) / 2,
      y: (touches[0].pageY + touches[1].pageY) / 2,
    };
  };

  // ── Viewer mode: tap handler ──
  const handleViewerTap = useCallback(() => {
    if (!isViewerMode || !sticker.isInteractive) return;
    setShowHint(true);
    setTimeout(() => {
      setShowHint(false);
      if (clinicId) {
        router.push({ pathname: '/clinic/clinic-profile-viewer', params: { clinicId } } as any);
      }
    }, 800);
  }, [isViewerMode, sticker.isInteractive, clinicId, router]);

  const panResponder = useMemo(() => {
    if (isViewerMode) {
      return PanResponder.create({
        onStartShouldSetPanResponder: () => sticker.isInteractive,
        onPanResponderRelease: () => handleViewerTap(),
      });
    }

    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      // Capture phase: claim gesture immediately to reduce delay
      onMoveShouldSetPanResponderCapture: (_, gs) => Math.abs(gs.dx) > 1 || Math.abs(gs.dy) > 1,
      onPanResponderGrant: (evt) => {
        hasMoved.current = false;
        lastDragCallTime.current = 0;
        const touches = evt.nativeEvent.touches;
        if (touches.length >= 2) {
          isPinching.current = true;
          initialDistance.current = getDistance(touches);
          initialAngle.current = getAngle(touches);
          initialCenter.current = getCenter(touches);
        } else {
          isPinching.current = false;
          longPressTimer.current = setTimeout(() => {
            if (!hasMoved.current) {
              onLongPress?.(sticker.id);
            }
          }, 500);
        }
      },
      onPanResponderMove: (evt, gestureState) => {
        const touches = evt.nativeEvent.touches;

        if (Math.abs(gestureState.dx) > 2 || Math.abs(gestureState.dy) > 2) {
          if (!hasMoved.current) {
            hasMoved.current = true;
            onDragStateChange?.(true);
            if (longPressTimer.current) {
              clearTimeout(longPressTimer.current);
              longPressTimer.current = null;
            }
          }
        }

        if (touches.length >= 2) {
          hasMoved.current = true;
          if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
          }
          if (!isPinching.current) {
            isPinching.current = true;
            initialDistance.current = getDistance(touches);
            initialAngle.current = getAngle(touches);
            initialCenter.current = getCenter(touches);
          }
          const currentDistance = getDistance(touches);
          if (initialDistance.current > 0) {
            const scaleFactor = currentDistance / initialDistance.current;
            const newScale = Math.max(0.3, Math.min(3, lastScale.current * scaleFactor));
            scaleAnim.setValue(newScale);
          }
          const currentAngle = getAngle(touches);
          const angleDiff = currentAngle - initialAngle.current;
          rotation.setValue(lastRotation.current + angleDiff);

          const currentCenter = getCenter(touches);
          pan.setValue({
            x: lastOffset.current.x + (currentCenter.x - initialCenter.current.x),
            y: lastOffset.current.y + (currentCenter.y - initialCenter.current.y),
          });
        } else if (!isPinching.current) {
          pan.setValue({
            x: lastOffset.current.x + gestureState.dx,
            y: lastOffset.current.y + gestureState.dy,
          });
        }

        // Throttle trash zone detection to every 50ms (avoid setState spam)
        lastPageY.current = evt.nativeEvent.pageY;
        if (hasMoved.current) {
          const now = Date.now();
          if (now - lastDragCallTime.current > 50) {
            lastDragCallTime.current = now;
            onDragStateChange?.(true, evt.nativeEvent.pageY);
          }
        }
      },
      onPanResponderRelease: () => {
        if (longPressTimer.current) {
          clearTimeout(longPressTimer.current);
          longPressTimer.current = null;
        }

        // @ts-ignore
        lastOffset.current = { x: pan.x._value, y: pan.y._value };
        // @ts-ignore
        lastScale.current = scaleAnim._value || lastScale.current;
        // @ts-ignore
        lastRotation.current = rotation._value || lastRotation.current;

        onTransformUpdate(sticker.id, {
          x: lastOffset.current.x,
          y: lastOffset.current.y,
          scale: lastScale.current,
          rotation: lastRotation.current,
        });

        const TRASH_ZONE_TOP = SCREEN_HEIGHT - 120;
        if (hasMoved.current && lastPageY.current > TRASH_ZONE_TOP) {
          onRemove(sticker.id);
        }

        isPinching.current = false;
        initialDistance.current = 0;
        hasMoved.current = false;
        onDragStateChange?.(false);
      },
    });
  }, [pan, scaleAnim, rotation, onTransformUpdate, onRemove, onDragStateChange, sticker.id, onLongPress, isViewerMode, handleViewerTap, sticker.isInteractive]);

  const rotateInterpolate = rotation.interpolate({
    inputRange: [-360, 360],
    outputRange: ['-360deg', '360deg'],
  });

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.spring(popAnim, { toValue: 1, tension: 100, friction: 8, useNativeDriver: true }),
    ]).start();
  }, [fadeAnim, popAnim]);

  const design = COMBO_STICKER_DESIGNS.find(d => d.id === sticker.designId) ?? COMBO_STICKER_DESIGNS_EXTENDED.find(d => d.id === sticker.designId);
  if (!design) return null;
  const StickerComponent = design.Component;

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={[
        styles.photoStickerContainer,
        {
          opacity: fadeAnim,
          transform: [
            { translateX: pan.x },
            { translateY: pan.y },
            { scale: combinedScale },
            { rotate: rotateInterpolate },
          ],
        },
      ]}
    >
      <StickerComponent clinicName={sticker.clinicName} clinicPhoneNumber={sticker.clinicPhoneNumber} size={160} />

      {/* Viewer mode: hint */}
      {isViewerMode && sticker.isInteractive && showHint && (
        <View style={{
          position: 'absolute',
          top: -36,
          alignSelf: 'center',
          backgroundColor: 'rgba(0,0,0,0.8)',
          paddingHorizontal: 12,
          paddingVertical: 6,
          borderRadius: 16,
        }}>
          <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '600' }}>🏥 View Clinic</Text>
        </View>
      )}
    </Animated.View>
  );
};

// ========== Draggable Dental Sticker Component (decorative — no interactive features) ==========
const DraggableDentalSticker = ({
  sticker,
  onTransformUpdate,
  onRemove,
  onDragStateChange,
}: {
  sticker: DentalStickerOnCanvas;
  onTransformUpdate: (id: string, updates: Partial<{ x: number; y: number; scale: number; rotation: number }>) => void;
  onRemove: (id: string) => void;
  onDragStateChange?: (isDragging: boolean, pageY?: number) => void;
}) => {
  const pan = useRef(new Animated.ValueXY({ x: sticker.x, y: sticker.y })).current;
  const scaleAnim = useRef(new Animated.Value(sticker.scale)).current;
  const rotation = useRef(new Animated.Value(sticker.rotation)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const popAnim = useRef(new Animated.Value(0.8)).current;

  const lastOffset = useRef({ x: sticker.x, y: sticker.y });
  const lastScale = useRef(sticker.scale);
  const lastRotation = useRef(sticker.rotation);
  const initialDistance = useRef(0);
  const initialAngle = useRef(0);
  const initialCenter = useRef({ x: 0, y: 0 });
  const isPinching = useRef(false);
  const hasMoved = useRef(false);
  const lastPageY = useRef(0);
  const lastDragCallTime = useRef(0);

  const combinedScale = useMemo(() => Animated.multiply(scaleAnim, popAnim), [scaleAnim, popAnim]);

  const getDistance = (touches: any[]) => {
    if (touches.length < 2) return 0;
    const dx = touches[0].pageX - touches[1].pageX;
    const dy = touches[0].pageY - touches[1].pageY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const getAngle = (touches: any[]) => {
    if (touches.length < 2) return 0;
    const dx = touches[1].pageX - touches[0].pageX;
    const dy = touches[1].pageY - touches[0].pageY;
    return Math.atan2(dy, dx) * (180 / Math.PI);
  };

  const getCenter = (touches: any[]) => {
    if (touches.length < 2) return { x: touches[0]?.pageX || 0, y: touches[0]?.pageY || 0 };
    return {
      x: (touches[0].pageX + touches[1].pageX) / 2,
      y: (touches[0].pageY + touches[1].pageY) / 2,
    };
  };

  const panResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponderCapture: (_, gs) => Math.abs(gs.dx) > 1 || Math.abs(gs.dy) > 1,
    onPanResponderGrant: (evt) => {
      hasMoved.current = false;
      lastDragCallTime.current = 0;
      const touches = evt.nativeEvent.touches;
      if (touches.length >= 2) {
        isPinching.current = true;
        initialDistance.current = getDistance(touches);
        initialAngle.current = getAngle(touches);
        initialCenter.current = getCenter(touches);
      } else {
        isPinching.current = false;
      }
    },
    onPanResponderMove: (evt, gestureState) => {
      const touches = evt.nativeEvent.touches;

      if (Math.abs(gestureState.dx) > 2 || Math.abs(gestureState.dy) > 2) {
        if (!hasMoved.current) {
          hasMoved.current = true;
          onDragStateChange?.(true);
        }
      }

      if (touches.length >= 2) {
        hasMoved.current = true;
        if (!isPinching.current) {
          isPinching.current = true;
          initialDistance.current = getDistance(touches);
          initialAngle.current = getAngle(touches);
          initialCenter.current = getCenter(touches);
        }
        const currentDistance = getDistance(touches);
        if (initialDistance.current > 0) {
          const scaleFactor = currentDistance / initialDistance.current;
          const newScale = Math.max(0.3, Math.min(3, lastScale.current * scaleFactor));
          scaleAnim.setValue(newScale);
        }
        const currentAngle = getAngle(touches);
        const angleDiff = currentAngle - initialAngle.current;
        rotation.setValue(lastRotation.current + angleDiff);

        const currentCenter = getCenter(touches);
        pan.setValue({
          x: lastOffset.current.x + (currentCenter.x - initialCenter.current.x),
          y: lastOffset.current.y + (currentCenter.y - initialCenter.current.y),
        });
      } else if (!isPinching.current) {
        pan.setValue({
          x: lastOffset.current.x + gestureState.dx,
          y: lastOffset.current.y + gestureState.dy,
        });
      }

      lastPageY.current = evt.nativeEvent.pageY;
      if (hasMoved.current) {
        const now = Date.now();
        if (now - lastDragCallTime.current > 50) {
          lastDragCallTime.current = now;
          onDragStateChange?.(true, evt.nativeEvent.pageY);
        }
      }
    },
    onPanResponderRelease: () => {
      // @ts-ignore
      lastOffset.current = { x: pan.x._value, y: pan.y._value };
      // @ts-ignore
      lastScale.current = scaleAnim._value || lastScale.current;
      // @ts-ignore
      lastRotation.current = rotation._value || lastRotation.current;

      onTransformUpdate(sticker.id, {
        x: lastOffset.current.x,
        y: lastOffset.current.y,
        scale: lastScale.current,
        rotation: lastRotation.current,
      });

      const TRASH_ZONE_TOP = SCREEN_HEIGHT - 120;
      if (hasMoved.current && lastPageY.current > TRASH_ZONE_TOP) {
        onRemove(sticker.id);
      }

      isPinching.current = false;
      initialDistance.current = 0;
      hasMoved.current = false;
      onDragStateChange?.(false);
    },
  }), [pan, scaleAnim, rotation, onTransformUpdate, onRemove, sticker.id, onDragStateChange]);

  const rotateInterpolate = rotation.interpolate({
    inputRange: [-360, 360],
    outputRange: ['-360deg', '360deg'],
  });

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.spring(popAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, popAnim]);

  // Resolve the sticker design component from the registries
  const StickerComponent = useMemo(() => {
    const allDesigns = [...DENTAL_STICKER_DESIGNS, ...(DENTAL_STICKER_DESIGNS_EXTENDED as unknown as typeof DENTAL_STICKER_DESIGNS)];
    const design = allDesigns.find(d => d.id === sticker.designId);
    return design?.Component ?? null;
  }, [sticker.designId]);

  if (!StickerComponent) return null;

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={[
        styles.photoStickerContainer,
        {
          opacity: fadeAnim,
          transform: [
            { translateX: pan.x },
            { translateY: pan.y },
            { scale: combinedScale },
            { rotate: rotateInterpolate },
          ],
        },
      ]}
    >
      <StickerComponent size={120} />
    </Animated.View>
  );
};

// ========== Draggable Laser Sticker Component ==========
const DraggableLaserSticker = ({
  sticker,
  onTransformUpdate,
  onRemove,
  onDragStateChange,
}: {
  sticker: LaserStickerOnCanvas;
  onTransformUpdate: (id: string, updates: Partial<{ x: number; y: number; scale: number; rotation: number }>) => void;
  onRemove: (id: string) => void;
  onDragStateChange?: (isDragging: boolean, pageY?: number) => void;
}) => {
  const pan = useRef(new Animated.ValueXY({ x: sticker.x, y: sticker.y })).current;
  const scaleAnim = useRef(new Animated.Value(sticker.scale)).current;
  const rotation = useRef(new Animated.Value(sticker.rotation)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const popAnim = useRef(new Animated.Value(0.8)).current;

  const lastOffset = useRef({ x: sticker.x, y: sticker.y });
  const lastScale = useRef(sticker.scale);
  const lastRotation = useRef(sticker.rotation);
  const initialDistance = useRef(0);
  const initialAngle = useRef(0);
  const initialCenter = useRef({ x: 0, y: 0 });
  const isPinching = useRef(false);
  const hasMoved = useRef(false);
  const lastPageY = useRef(0);
  const lastDragCallTime = useRef(0);

  const combinedScale = useMemo(() => Animated.multiply(scaleAnim, popAnim), [scaleAnim, popAnim]);

  const getDistance = (touches: any[]) => {
    if (touches.length < 2) return 0;
    const dx = touches[0].pageX - touches[1].pageX;
    const dy = touches[0].pageY - touches[1].pageY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const getAngle = (touches: any[]) => {
    if (touches.length < 2) return 0;
    const dx = touches[1].pageX - touches[0].pageX;
    const dy = touches[1].pageY - touches[0].pageY;
    return Math.atan2(dy, dx) * (180 / Math.PI);
  };

  const getCenter = (touches: any[]) => {
    if (touches.length < 2) return { x: touches[0]?.pageX || 0, y: touches[0]?.pageY || 0 };
    return {
      x: (touches[0].pageX + touches[1].pageX) / 2,
      y: (touches[0].pageY + touches[1].pageY) / 2,
    };
  };

  const panResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponderCapture: (_, gs) => Math.abs(gs.dx) > 1 || Math.abs(gs.dy) > 1,
    onPanResponderGrant: (evt) => {
      hasMoved.current = false;
      lastDragCallTime.current = 0;
      const touches = evt.nativeEvent.touches;
      if (touches.length >= 2) {
        isPinching.current = true;
        initialDistance.current = getDistance(touches);
        initialAngle.current = getAngle(touches);
        initialCenter.current = getCenter(touches);
      } else {
        isPinching.current = false;
      }
    },
    onPanResponderMove: (evt, gestureState) => {
      const touches = evt.nativeEvent.touches;

      if (Math.abs(gestureState.dx) > 2 || Math.abs(gestureState.dy) > 2) {
        if (!hasMoved.current) {
          hasMoved.current = true;
          onDragStateChange?.(true);
        }
      }

      if (touches.length >= 2) {
        hasMoved.current = true;
        if (!isPinching.current) {
          isPinching.current = true;
          initialDistance.current = getDistance(touches);
          initialAngle.current = getAngle(touches);
          initialCenter.current = getCenter(touches);
        }
        const currentDistance = getDistance(touches);
        if (initialDistance.current > 0) {
          const scaleFactor = currentDistance / initialDistance.current;
          const newScale = Math.max(0.3, Math.min(3, lastScale.current * scaleFactor));
          scaleAnim.setValue(newScale);
        }
        const currentAngle = getAngle(touches);
        const angleDiff = currentAngle - initialAngle.current;
        rotation.setValue(lastRotation.current + angleDiff);

        const currentCenter = getCenter(touches);
        pan.setValue({
          x: lastOffset.current.x + (currentCenter.x - initialCenter.current.x),
          y: lastOffset.current.y + (currentCenter.y - initialCenter.current.y),
        });
      } else if (!isPinching.current) {
        pan.setValue({
          x: lastOffset.current.x + gestureState.dx,
          y: lastOffset.current.y + gestureState.dy,
        });
      }

      lastPageY.current = evt.nativeEvent.pageY;
      if (hasMoved.current) {
        const now = Date.now();
        if (now - lastDragCallTime.current > 50) {
          lastDragCallTime.current = now;
          onDragStateChange?.(true, evt.nativeEvent.pageY);
        }
      }
    },
    onPanResponderRelease: () => {
      // @ts-ignore
      lastOffset.current = { x: pan.x._value, y: pan.y._value };
      // @ts-ignore
      lastScale.current = scaleAnim._value || lastScale.current;
      // @ts-ignore
      lastRotation.current = rotation._value || lastRotation.current;

      onTransformUpdate(sticker.id, {
        x: lastOffset.current.x,
        y: lastOffset.current.y,
        scale: lastScale.current,
        rotation: lastRotation.current,
      });

      const TRASH_ZONE_TOP = SCREEN_HEIGHT - 120;
      if (hasMoved.current && lastPageY.current > TRASH_ZONE_TOP) {
        onRemove(sticker.id);
      }

      isPinching.current = false;
      initialDistance.current = 0;
      hasMoved.current = false;
      onDragStateChange?.(false);
    },
  }), [pan, scaleAnim, rotation, onTransformUpdate, onRemove, onDragStateChange, sticker.id]);

  const rotateInterpolate = rotation.interpolate({
    inputRange: [-360, 360],
    outputRange: ['-360deg', '360deg'],
  });

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.spring(popAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, popAnim]);

  // Resolve the sticker design component from the registries
  const StickerComponent = useMemo(() => {
    const allDesigns = [...LASER_STICKER_DESIGNS, ...(LASER_STICKER_DESIGNS_EXTENDED as unknown as typeof LASER_STICKER_DESIGNS)];
    const design = allDesigns.find(d => d.id === sticker.designId);
    return design?.Component ?? null;
  }, [sticker.designId]);

  if (!StickerComponent) return null;

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={[
        styles.photoStickerContainer,
        {
          opacity: fadeAnim,
          transform: [
            { translateX: pan.x },
            { translateY: pan.y },
            { scale: combinedScale },
            { rotate: rotateInterpolate },
          ],
        },
      ]}
    >
      <StickerComponent size={120} />
    </Animated.View>
  );
};

// ========== Draggable Beauty Sticker Component (decorative — no interactive features) ==========
const DraggableBeautySticker = ({
  sticker,
  onTransformUpdate,
  onRemove,
  onDragStateChange,
}: {
  sticker: BeautyStickerOnCanvas;
  onTransformUpdate: (id: string, updates: Partial<{ x: number; y: number; scale: number; rotation: number }>) => void;
  onRemove: (id: string) => void;
  onDragStateChange?: (isDragging: boolean, pageY?: number) => void;
}) => {
  const pan = useRef(new Animated.ValueXY({ x: sticker.x, y: sticker.y })).current;
  const scaleAnim = useRef(new Animated.Value(sticker.scale)).current;
  const rotation = useRef(new Animated.Value(sticker.rotation)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const popAnim = useRef(new Animated.Value(0.8)).current;

  const lastOffset = useRef({ x: sticker.x, y: sticker.y });
  const lastScale = useRef(sticker.scale);
  const lastRotation = useRef(sticker.rotation);
  const initialDistance = useRef(0);
  const initialAngle = useRef(0);
  const initialCenter = useRef({ x: 0, y: 0 });
  const isPinching = useRef(false);
  const hasMoved = useRef(false);
  const lastPageY = useRef(0);
  const lastDragCallTime = useRef(0);

  const combinedScale = useMemo(() => Animated.multiply(scaleAnim, popAnim), [scaleAnim, popAnim]);

  const getDistance = (touches: any[]) => {
    if (touches.length < 2) return 0;
    const dx = touches[0].pageX - touches[1].pageX;
    const dy = touches[0].pageY - touches[1].pageY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const getAngle = (touches: any[]) => {
    if (touches.length < 2) return 0;
    const dx = touches[1].pageX - touches[0].pageX;
    const dy = touches[1].pageY - touches[0].pageY;
    return Math.atan2(dy, dx) * (180 / Math.PI);
  };

  const getCenter = (touches: any[]) => {
    if (touches.length < 2) return { x: touches[0]?.pageX || 0, y: touches[0]?.pageY || 0 };
    return {
      x: (touches[0].pageX + touches[1].pageX) / 2,
      y: (touches[0].pageY + touches[1].pageY) / 2,
    };
  };

  const panResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponderCapture: (_, gs) => Math.abs(gs.dx) > 1 || Math.abs(gs.dy) > 1,
    onPanResponderGrant: (evt) => {
      hasMoved.current = false;
      lastDragCallTime.current = 0;
      const touches = evt.nativeEvent.touches;
      if (touches.length >= 2) {
        isPinching.current = true;
        initialDistance.current = getDistance(touches);
        initialAngle.current = getAngle(touches);
        initialCenter.current = getCenter(touches);
      } else {
        isPinching.current = false;
      }
    },
    onPanResponderMove: (evt, gestureState) => {
      const touches = evt.nativeEvent.touches;

      if (Math.abs(gestureState.dx) > 2 || Math.abs(gestureState.dy) > 2) {
        if (!hasMoved.current) {
          hasMoved.current = true;
          onDragStateChange?.(true);
        }
      }

      if (touches.length >= 2) {
        hasMoved.current = true;
        if (!isPinching.current) {
          isPinching.current = true;
          initialDistance.current = getDistance(touches);
          initialAngle.current = getAngle(touches);
          initialCenter.current = getCenter(touches);
        }
        const currentDistance = getDistance(touches);
        if (initialDistance.current > 0) {
          const scaleFactor = currentDistance / initialDistance.current;
          const newScale = Math.max(0.3, Math.min(3, lastScale.current * scaleFactor));
          scaleAnim.setValue(newScale);
        }
        const currentAngle = getAngle(touches);
        const angleDiff = currentAngle - initialAngle.current;
        rotation.setValue(lastRotation.current + angleDiff);

        const currentCenter = getCenter(touches);
        pan.setValue({
          x: lastOffset.current.x + (currentCenter.x - initialCenter.current.x),
          y: lastOffset.current.y + (currentCenter.y - initialCenter.current.y),
        });
      } else if (!isPinching.current) {
        pan.setValue({
          x: lastOffset.current.x + gestureState.dx,
          y: lastOffset.current.y + gestureState.dy,
        });
      }

      lastPageY.current = evt.nativeEvent.pageY;
      if (hasMoved.current) {
        const now = Date.now();
        if (now - lastDragCallTime.current > 50) {
          lastDragCallTime.current = now;
          onDragStateChange?.(true, evt.nativeEvent.pageY);
        }
      }
    },
    onPanResponderRelease: () => {
      // @ts-ignore
      lastOffset.current = { x: pan.x._value, y: pan.y._value };
      // @ts-ignore
      lastScale.current = scaleAnim._value || lastScale.current;
      // @ts-ignore
      lastRotation.current = rotation._value || lastRotation.current;

      onTransformUpdate(sticker.id, {
        x: lastOffset.current.x,
        y: lastOffset.current.y,
        scale: lastScale.current,
        rotation: lastRotation.current,
      });

      const TRASH_ZONE_TOP = SCREEN_HEIGHT - 120;
      if (hasMoved.current && lastPageY.current > TRASH_ZONE_TOP) {
        onRemove(sticker.id);
      }

      isPinching.current = false;
      initialDistance.current = 0;
      hasMoved.current = false;
      onDragStateChange?.(false);
    },
  }), [pan, scaleAnim, rotation, onTransformUpdate, onRemove, onDragStateChange, sticker.id]);

  const rotateInterpolate = rotation.interpolate({
    inputRange: [-360, 360],
    outputRange: ['-360deg', '360deg'],
  });

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.spring(popAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, popAnim]);

  // Resolve the sticker design component from the registries
  const StickerComponent = useMemo(() => {
    const allDesigns = [...BEAUTY_STICKER_DESIGNS, ...(BEAUTY_STICKER_DESIGNS_EXTENDED as unknown as typeof BEAUTY_STICKER_DESIGNS)];
    const design = allDesigns.find(d => d.id === sticker.designId);
    return design?.Component ?? null;
  }, [sticker.designId]);

  if (!StickerComponent) return null;

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={[
        styles.photoStickerContainer,
        {
          opacity: fadeAnim,
          transform: [
            { translateX: pan.x },
            { translateY: pan.y },
            { scale: combinedScale },
            { rotate: rotateInterpolate },
          ],
        },
      ]}
    >
      <StickerComponent size={120} />
    </Animated.View>
  );
};

// ========== Instagram-Style Image Editing Modal ==========
const ImageEditingModal = ({
  visible,
  imageUri,
  imageWidth,
  imageHeight,
  onCancel,
  onDone,
}: {
  visible: boolean;
  imageUri: string | null;
  imageWidth: number;
  imageHeight: number;
  onCancel: () => void;
  onDone: (editedUri: string, width: number, height: number) => void;
}) => {
  // Current editing tool mode
  const [toolMode, setToolMode] = useState<EditingToolMode>('transform');
  
  // Transform state (pan, zoom, rotation)
  const [imageTransform, setImageTransform] = useState({
    x: 0,
    y: 0,
    scale: 1,
    rotation: 0,
  });
  
  // Crop state
  const [cropAspectRatio, setCropAspectRatio] = useState<CropAspectRatio>('story');
  
  // Filter state
  const [selectedFilter, setSelectedFilter] = useState<string>('original');
  
  // Adjustment slider values
  const [adjustments, setAdjustments] = useState({
    brightness: 1,
    contrast: 1,
    saturation: 1,
  });
  
  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Animation values
  const pan = useRef(new Animated.ValueXY()).current;
  const scale = useRef(new Animated.Value(1)).current;
  const rotation = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  
  // Gesture tracking refs
  const lastOffset = useRef({ x: 0, y: 0 });
  const lastScale = useRef(1);
  const lastRotation = useRef(0);
  const initialDistance = useRef(0);
  const initialAngle = useRef(0);
  const initialCenter = useRef({ x: 0, y: 0 });
  const isPinching = useRef(false);
  
  // Reset state when modal opens with new image
  useEffect(() => {
    if (visible && imageUri) {
      // Reset all transform values
      pan.setValue({ x: 0, y: 0 });
      scale.setValue(1);
      rotation.setValue(0);
      lastOffset.current = { x: 0, y: 0 };
      lastScale.current = 1;
      lastRotation.current = 0;
      setImageTransform({ x: 0, y: 0, scale: 1, rotation: 0 });
      setCropAspectRatio('story');
      setSelectedFilter('original');
      setAdjustments({ brightness: 1, contrast: 1, saturation: 1 });
      setToolMode('transform');
      
      // Fade in animation
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    } else {
      fadeAnim.setValue(0);
    }
  }, [visible, imageUri, pan, scale, rotation, fadeAnim]);
  
  // Calculate canvas and image dimensions
  const canvasPadding = 20;
  const canvasWidth = SCREEN_WIDTH - canvasPadding * 2;
  const canvasHeight = SCREEN_HEIGHT * 0.6;
  
  // Calculate crop frame dimensions based on selected aspect ratio
  const getCropFrameDimensions = useCallback(() => {
    const preset = CROP_PRESETS.find(p => p.id === cropAspectRatio);
    const ratio = preset?.ratio || (imageWidth / imageHeight);
    
    let frameWidth: number;
    let frameHeight: number;
    
    if (ratio >= canvasWidth / canvasHeight) {
      // Width-constrained
      frameWidth = canvasWidth;
      frameHeight = canvasWidth / ratio;
    } else {
      // Height-constrained
      frameHeight = canvasHeight;
      frameWidth = canvasHeight * ratio;
    }
    
    return { frameWidth, frameHeight };
  }, [cropAspectRatio, canvasWidth, canvasHeight, imageWidth, imageHeight]);
  
  const { frameWidth, frameHeight } = getCropFrameDimensions();
  
  // Calculate initial image scale to fit within frame
  const getInitialImageScale = useCallback(() => {
    const imgAspectRatio = imageWidth / imageHeight;
    const frameAspectRatio = frameWidth / frameHeight;
    
    if (imgAspectRatio > frameAspectRatio) {
      // Image is wider - fit to width, allow vertical overflow for movement
      return (frameWidth / imageWidth) * 1.2;
    } else {
      // Image is taller - fit to height, allow horizontal overflow
      return (frameHeight / imageHeight) * 1.2;
    }
  }, [imageWidth, imageHeight, frameWidth, frameHeight]);
  
  // Calculate displayed image dimensions
  const baseScale = getInitialImageScale();
  const displayedWidth = imageWidth * baseScale;
  const displayedHeight = imageHeight * baseScale;
  
  // Gesture helpers
  const getDistance = (touches: any[]) => {
    if (touches.length < 2) return 0;
    const dx = touches[0].pageX - touches[1].pageX;
    const dy = touches[0].pageY - touches[1].pageY;
    return Math.sqrt(dx * dx + dy * dy);
  };
  
  const getAngle = (touches: any[]) => {
    if (touches.length < 2) return 0;
    const dx = touches[1].pageX - touches[0].pageX;
    const dy = touches[1].pageY - touches[0].pageY;
    return Math.atan2(dy, dx) * (180 / Math.PI);
  };
  
  const getCenter = (touches: any[]) => {
    if (touches.length < 2) return { x: touches[0]?.pageX || 0, y: touches[0]?.pageY || 0 };
    return {
      x: (touches[0].pageX + touches[1].pageX) / 2,
      y: (touches[0].pageY + touches[1].pageY) / 2,
    };
  };
  
  // PanResponder for image manipulation
  const panResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => toolMode === 'transform',
    onMoveShouldSetPanResponder: () => toolMode === 'transform',
    onPanResponderGrant: (evt) => {
      const touches = evt.nativeEvent.touches;
      if (touches.length >= 2) {
        isPinching.current = true;
        initialDistance.current = getDistance(touches);
        initialAngle.current = getAngle(touches);
        initialCenter.current = getCenter(touches);
      } else {
        isPinching.current = false;
      }
    },
    onPanResponderMove: (evt, gestureState) => {
      const touches = evt.nativeEvent.touches;
      
      if (touches.length >= 2) {
        if (!isPinching.current) {
          isPinching.current = true;
          initialDistance.current = getDistance(touches);
          initialAngle.current = getAngle(touches);
          initialCenter.current = getCenter(touches);
        }
        
        // Scale (pinch to zoom)
        const currentDistance = getDistance(touches);
        if (initialDistance.current > 0) {
          const scaleFactor = currentDistance / initialDistance.current;
          const newScale = Math.max(0.5, Math.min(5, lastScale.current * scaleFactor));
          scale.setValue(newScale);
        }
        
        // Rotation (two finger rotate)
        const currentAngle = getAngle(touches);
        const angleDiff = currentAngle - initialAngle.current;
        rotation.setValue(lastRotation.current + angleDiff);
        
        // Pan while pinching
        const currentCenter = getCenter(touches);
        const centerDx = currentCenter.x - initialCenter.current.x;
        const centerDy = currentCenter.y - initialCenter.current.y;
        pan.setValue({
          x: lastOffset.current.x + centerDx,
          y: lastOffset.current.y + centerDy,
        });
      } else if (!isPinching.current) {
        // Single finger drag
        pan.setValue({
          x: lastOffset.current.x + gestureState.dx,
          y: lastOffset.current.y + gestureState.dy,
        });
      }
    },
    onPanResponderRelease: () => {
      // @ts-ignore
      lastOffset.current = { x: pan.x._value, y: pan.y._value };
      // @ts-ignore
      lastScale.current = scale._value || lastScale.current;
      // @ts-ignore
      lastRotation.current = rotation._value || lastRotation.current;
      
      setImageTransform({
        x: lastOffset.current.x,
        y: lastOffset.current.y,
        scale: lastScale.current,
        rotation: lastRotation.current,
      });
      
      isPinching.current = false;
      initialDistance.current = 0;
    },
  }), [pan, scale, rotation, toolMode]);
  
  // Rotation interpolation
  const rotateInterpolate = rotation.interpolate({
    inputRange: [-360, 360],
    outputRange: ['-360deg', '360deg'],
  });
  
  // Quick rotation buttons (90 degrees)
  const rotateBy90 = (direction: 'left' | 'right') => {
    const delta = direction === 'left' ? -90 : 90;
    const newRotation = lastRotation.current + delta;
    rotation.setValue(newRotation);
    lastRotation.current = newRotation;
    setImageTransform(prev => ({ ...prev, rotation: newRotation }));
  };
  
  // Reset transform
  const resetTransform = () => {
    pan.setValue({ x: 0, y: 0 });
    scale.setValue(1);
    rotation.setValue(0);
    lastOffset.current = { x: 0, y: 0 };
    lastScale.current = 1;
    lastRotation.current = 0;
    setImageTransform({ x: 0, y: 0, scale: 1, rotation: 0 });
  };
  
  // Get filter style for preview
  const getFilterStyle = (filterId: string): object => {
    const filter = FILTER_PRESETS.find(f => f.id === filterId) || FILTER_PRESETS[0];
    // Note: React Native doesn't support CSS filters natively
    // We apply opacity and overlay effects as approximation
    return {
      opacity: filter.opacity,
    };
  };
  
  // Get filter overlay color
  const getFilterOverlay = (filterId: string): string | null => {
    const filter = FILTER_PRESETS.find(f => f.id === filterId);
    return filter?.overlay || null;
  };
  
  // Apply edits and export image
  const applyEditsAndExport = async () => {
    if (!imageUri) return;
    
    setIsProcessing(true);
    
    try {
      // Get crop dimensions based on selected aspect ratio
      const { frameWidth: cropWidth, frameHeight: cropHeight } = getCropFrameDimensions();
      
      // Build manipulation actions
      const actions: ImageManipulator.Action[] = [];
      
      // Apply rotation if needed
      if (Math.abs(imageTransform.rotation) > 0.1) {
        // Normalize rotation to 0-360 range
        const normalizedRotation = ((imageTransform.rotation % 360) + 360) % 360;
        // expo-image-manipulator only supports 90, 180, 270 degree rotations
        const nearestRotation = Math.round(normalizedRotation / 90) * 90;
        if (nearestRotation > 0 && nearestRotation < 360) {
          actions.push({ rotate: nearestRotation });
        }
      }
      
      // Calculate crop region based on transform
      // For now, we'll resize to fit the story dimensions
      const storyWidth = 1080; // Instagram story width
      const storyHeight = 1920; // Instagram story height (9:16)
      
      // Resize to story dimensions
      actions.push({ resize: { width: storyWidth } });
      
      // Apply manipulations
      const result = await ImageManipulator.manipulateAsync(
        imageUri,
        actions,
        {
          compress: 0.9,
          format: ImageManipulator.SaveFormat.JPEG,
        }
      );
      
      setIsProcessing(false);
      onDone(result.uri, result.width, result.height);
    } catch (error) {
      console.error('Error applying image edits:', error);
      setIsProcessing(false);
      // Fallback: return original image
      onDone(imageUri, imageWidth, imageHeight);
    }
  };
  
  // Always render the Modal but conditionally show content
  // This fixes timing issues between visible state and imageUri
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onCancel}
      statusBarTranslucent={true}
    >
      {!imageUri ? (
        // Loading state while image is being prepared
        <View style={[imageEditStyles.container, { justifyContent: 'center', alignItems: 'center' }]}>
          <Text style={{ color: '#FFFFFF', fontSize: 16 }}>Loading...</Text>
        </View>
      ) : (
      <Animated.View style={[imageEditStyles.container, { opacity: fadeAnim }]}>
        <StatusBar barStyle="light-content" backgroundColor="#000" />
        
        {/* Header */}
        <SafeAreaView style={imageEditStyles.header}>
          <TouchableOpacity onPress={onCancel} style={imageEditStyles.headerButton}>
            <Ionicons name="close" size={28} color="#FFFFFF" />
          </TouchableOpacity>
          
          <Text style={imageEditStyles.headerTitle}>Edit Photo</Text>
          
          <TouchableOpacity 
            onPress={applyEditsAndExport} 
            style={imageEditStyles.headerDoneButton}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <Text style={imageEditStyles.headerDoneText}>...</Text>
            ) : (
              <Text style={imageEditStyles.headerDoneText}>Done</Text>
            )}
          </TouchableOpacity>
        </SafeAreaView>
        
        {/* Canvas Area */}
        <View style={imageEditStyles.canvasContainer}>
          {/* Crop Frame Overlay */}
          <View style={[imageEditStyles.cropFrame, { width: frameWidth, height: frameHeight }]}>
            {/* Image with gestures */}
            <Animated.View
              {...panResponder.panHandlers}
              style={[
                imageEditStyles.imageWrapper,
                {
                  width: displayedWidth * imageTransform.scale,
                  height: displayedHeight * imageTransform.scale,
                  transform: [
                    { translateX: pan.x },
                    { translateY: pan.y },
                    { scale: scale },
                    { rotate: rotateInterpolate },
                  ],
                },
              ]}
            >
              <ExpoImage
                source={{ uri: imageUri }}
                style={[
                  imageEditStyles.image,
                  { width: displayedWidth, height: displayedHeight },
                  getFilterStyle(selectedFilter),
                ]}
                contentFit="contain"
              />
              
              {/* Filter overlay */}
              {getFilterOverlay(selectedFilter) && (
                <View
                  style={[
                    imageEditStyles.filterOverlay,
                    { backgroundColor: getFilterOverlay(selectedFilter) || 'transparent' },
                  ]}
                />
              )}
            </Animated.View>
            
            {/* Crop frame border */}
            <View style={imageEditStyles.cropBorder} pointerEvents="none">
              {/* Corner indicators */}
              <View style={[imageEditStyles.cropCorner, imageEditStyles.topLeft]} />
              <View style={[imageEditStyles.cropCorner, imageEditStyles.topRight]} />
              <View style={[imageEditStyles.cropCorner, imageEditStyles.bottomLeft]} />
              <View style={[imageEditStyles.cropCorner, imageEditStyles.bottomRight]} />
              
              {/* Grid lines (rule of thirds) */}
              {toolMode === 'transform' && (
                <>
                  <View style={[imageEditStyles.gridLineH, { top: '33.33%' }]} />
                  <View style={[imageEditStyles.gridLineH, { top: '66.66%' }]} />
                  <View style={[imageEditStyles.gridLineV, { left: '33.33%' }]} />
                  <View style={[imageEditStyles.gridLineV, { left: '66.66%' }]} />
                </>
              )}
            </View>
          </View>
          
          {/* Transform hint */}
          {toolMode === 'transform' && (
            <Text style={imageEditStyles.hintText}>
              Drag to move • Pinch to zoom • Two fingers to rotate
            </Text>
          )}
        </View>
        
        {/* Tool Tabs */}
        <View style={imageEditStyles.toolTabs}>
          <TouchableOpacity
            style={[imageEditStyles.toolTab, toolMode === 'transform' && imageEditStyles.toolTabActive]}
            onPress={() => setToolMode('transform')}
          >
            <Ionicons 
              name="move-outline" 
              size={22} 
              color={toolMode === 'transform' ? '#FFFFFF' : '#8E8E93'} 
            />
            <Text style={[imageEditStyles.toolTabText, toolMode === 'transform' && imageEditStyles.toolTabTextActive]}>
              Transform
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[imageEditStyles.toolTab, toolMode === 'crop' && imageEditStyles.toolTabActive]}
            onPress={() => setToolMode('crop')}
          >
            <Ionicons 
              name="crop-outline" 
              size={22} 
              color={toolMode === 'crop' ? '#FFFFFF' : '#8E8E93'} 
            />
            <Text style={[imageEditStyles.toolTabText, toolMode === 'crop' && imageEditStyles.toolTabTextActive]}>
              Crop
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[imageEditStyles.toolTab, toolMode === 'filters' && imageEditStyles.toolTabActive]}
            onPress={() => setToolMode('filters')}
          >
            <Ionicons 
              name="color-wand-outline" 
              size={22} 
              color={toolMode === 'filters' ? '#FFFFFF' : '#8E8E93'} 
            />
            <Text style={[imageEditStyles.toolTabText, toolMode === 'filters' && imageEditStyles.toolTabTextActive]}>
              Filters
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[imageEditStyles.toolTab, toolMode === 'adjust' && imageEditStyles.toolTabActive]}
            onPress={() => setToolMode('adjust')}
          >
            <Ionicons 
              name="options-outline" 
              size={22} 
              color={toolMode === 'adjust' ? '#FFFFFF' : '#8E8E93'} 
            />
            <Text style={[imageEditStyles.toolTabText, toolMode === 'adjust' && imageEditStyles.toolTabTextActive]}>
              Adjust
            </Text>
          </TouchableOpacity>
        </View>
        
        {/* Tool Options Panel */}
        <View style={imageEditStyles.toolPanel}>
          {/* Transform Tools */}
          {toolMode === 'transform' && (
            <View style={imageEditStyles.transformTools}>
              <TouchableOpacity 
                style={imageEditStyles.transformButton}
                onPress={() => rotateBy90('left')}
              >
                <Ionicons name="arrow-undo" size={24} color="#FFFFFF" />
                <Text style={imageEditStyles.transformButtonText}>Rotate Left</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={imageEditStyles.transformButton}
                onPress={() => rotateBy90('right')}
              >
                <Ionicons name="arrow-redo" size={24} color="#FFFFFF" />
                <Text style={imageEditStyles.transformButtonText}>Rotate Right</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={imageEditStyles.transformButton}
                onPress={resetTransform}
              >
                <Ionicons name="refresh" size={24} color="#FFFFFF" />
                <Text style={imageEditStyles.transformButtonText}>Reset</Text>
              </TouchableOpacity>
            </View>
          )}
          
          {/* Crop Aspect Ratio Options */}
          {toolMode === 'crop' && (
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={imageEditStyles.cropOptions}
            >
              {CROP_PRESETS.map((preset) => (
                <TouchableOpacity
                  key={preset.id}
                  style={[
                    imageEditStyles.cropPreset,
                    cropAspectRatio === preset.id && imageEditStyles.cropPresetActive,
                  ]}
                  onPress={() => setCropAspectRatio(preset.id)}
                >
                  <Ionicons 
                    name={preset.icon as any} 
                    size={24} 
                    color={cropAspectRatio === preset.id ? '#FFFFFF' : '#8E8E93'} 
                  />
                  <Text 
                    style={[
                      imageEditStyles.cropPresetText,
                      cropAspectRatio === preset.id && imageEditStyles.cropPresetTextActive,
                    ]}
                  >
                    {preset.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
          
          {/* Filter Options */}
          {toolMode === 'filters' && (
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={imageEditStyles.filterOptions}
            >
              {FILTER_PRESETS.map((filter) => (
                <TouchableOpacity
                  key={filter.id}
                  style={[
                    imageEditStyles.filterPreset,
                    selectedFilter === filter.id && imageEditStyles.filterPresetActive,
                  ]}
                  onPress={() => setSelectedFilter(filter.id)}
                >
                  <View style={imageEditStyles.filterPreview}>
                    <ExpoImage
                      source={{ uri: imageUri }}
                      style={[imageEditStyles.filterPreviewImage, getFilterStyle(filter.id)]}
                      contentFit="cover"
                    />
                    {filter.overlay && (
                      <View
                        style={[
                          imageEditStyles.filterPreviewOverlay,
                          { backgroundColor: filter.overlay },
                        ]}
                      />
                    )}
                  </View>
                  <Text 
                    style={[
                      imageEditStyles.filterPresetText,
                      selectedFilter === filter.id && imageEditStyles.filterPresetTextActive,
                    ]}
                  >
                    {filter.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
          
          {/* Adjustment Sliders */}
          {toolMode === 'adjust' && (
            <View style={imageEditStyles.adjustOptions}>
              {/* Brightness */}
              <View style={imageEditStyles.adjustRow}>
                <View style={imageEditStyles.adjustLabelRow}>
                  <Ionicons name="sunny-outline" size={20} color="#FFFFFF" />
                  <Text style={imageEditStyles.adjustLabel}>Brightness</Text>
                </View>
                <View style={imageEditStyles.sliderContainer}>
                  <TouchableOpacity 
                    onPress={() => setAdjustments(prev => ({ ...prev, brightness: Math.max(0.5, prev.brightness - 0.1) }))}
                    style={imageEditStyles.sliderButton}
                  >
                    <Ionicons name="remove" size={18} color="#FFFFFF" />
                  </TouchableOpacity>
                  <View style={imageEditStyles.sliderTrack}>
                    <View style={[imageEditStyles.sliderFill, { width: `${((adjustments.brightness - 0.5) / 1) * 100}%` }]} />
                  </View>
                  <TouchableOpacity 
                    onPress={() => setAdjustments(prev => ({ ...prev, brightness: Math.min(1.5, prev.brightness + 0.1) }))}
                    style={imageEditStyles.sliderButton}
                  >
                    <Ionicons name="add" size={18} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              </View>
              
              {/* Contrast */}
              <View style={imageEditStyles.adjustRow}>
                <View style={imageEditStyles.adjustLabelRow}>
                  <Ionicons name="contrast-outline" size={20} color="#FFFFFF" />
                  <Text style={imageEditStyles.adjustLabel}>Contrast</Text>
                </View>
                <View style={imageEditStyles.sliderContainer}>
                  <TouchableOpacity 
                    onPress={() => setAdjustments(prev => ({ ...prev, contrast: Math.max(0.5, prev.contrast - 0.1) }))}
                    style={imageEditStyles.sliderButton}
                  >
                    <Ionicons name="remove" size={18} color="#FFFFFF" />
                  </TouchableOpacity>
                  <View style={imageEditStyles.sliderTrack}>
                    <View style={[imageEditStyles.sliderFill, { width: `${((adjustments.contrast - 0.5) / 1) * 100}%` }]} />
                  </View>
                  <TouchableOpacity 
                    onPress={() => setAdjustments(prev => ({ ...prev, contrast: Math.min(1.5, prev.contrast + 0.1) }))}
                    style={imageEditStyles.sliderButton}
                  >
                    <Ionicons name="add" size={18} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              </View>
              
              {/* Saturation */}
              <View style={imageEditStyles.adjustRow}>
                <View style={imageEditStyles.adjustLabelRow}>
                  <Ionicons name="color-palette-outline" size={20} color="#FFFFFF" />
                  <Text style={imageEditStyles.adjustLabel}>Saturation</Text>
                </View>
                <View style={imageEditStyles.sliderContainer}>
                  <TouchableOpacity 
                    onPress={() => setAdjustments(prev => ({ ...prev, saturation: Math.max(0, prev.saturation - 0.1) }))}
                    style={imageEditStyles.sliderButton}
                  >
                    <Ionicons name="remove" size={18} color="#FFFFFF" />
                  </TouchableOpacity>
                  <View style={imageEditStyles.sliderTrack}>
                    <View style={[imageEditStyles.sliderFill, { width: `${(adjustments.saturation / 2) * 100}%` }]} />
                  </View>
                  <TouchableOpacity 
                    onPress={() => setAdjustments(prev => ({ ...prev, saturation: Math.min(2, prev.saturation + 0.1) }))}
                    style={imageEditStyles.sliderButton}
                  >
                    <Ionicons name="add" size={18} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              </View>
              
              {/* Reset button */}
              <TouchableOpacity 
                style={imageEditStyles.resetAdjustButton}
                onPress={() => setAdjustments({ brightness: 1, contrast: 1, saturation: 1 })}
              >
                <Ionicons name="refresh" size={18} color="#0095F6" />
                <Text style={imageEditStyles.resetAdjustText}>Reset Adjustments</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Animated.View>
      )}
    </Modal>
  );
};

// ========== Image Editing Modal Styles ==========
const imageEditStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#000000',
  },
  headerButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  headerDoneButton: {
    backgroundColor: '#0095F6',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  headerDoneText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  canvasContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1C1C1E',
  },
  cropFrame: {
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  imageWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    // Dimensions set dynamically
  },
  filterOverlay: {
    ...StyleSheet.absoluteFillObject,
    pointerEvents: 'none',
  },
  cropBorder: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  cropCorner: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: '#FFFFFF',
  },
  topLeft: {
    top: -1,
    left: -1,
    borderTopWidth: 3,
    borderLeftWidth: 3,
  },
  topRight: {
    top: -1,
    right: -1,
    borderTopWidth: 3,
    borderRightWidth: 3,
  },
  bottomLeft: {
    bottom: -1,
    left: -1,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
  },
  bottomRight: {
    bottom: -1,
    right: -1,
    borderBottomWidth: 3,
    borderRightWidth: 3,
  },
  gridLineH: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  gridLineV: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  hintText: {
    position: 'absolute',
    bottom: 20,
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 13,
    textAlign: 'center',
  },
  toolTabs: {
    flexDirection: 'row',
    backgroundColor: '#1C1C1E',
    borderTopWidth: 0.5,
    borderTopColor: '#2C2C2E',
    paddingVertical: 8,
  },
  toolTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  toolTabActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#0095F6',
  },
  toolTabText: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 4,
  },
  toolTabTextActive: {
    color: '#FFFFFF',
  },
  toolPanel: {
    backgroundColor: '#000000',
    paddingVertical: 16,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    minHeight: 140,
  },
  transformTools: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
  },
  transformButton: {
    alignItems: 'center',
    padding: 12,
  },
  transformButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    marginTop: 6,
  },
  cropOptions: {
    paddingHorizontal: 16,
    gap: 16,
  },
  cropPreset: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#1C1C1E',
    minWidth: 70,
  },
  cropPresetActive: {
    backgroundColor: '#0095F6',
  },
  cropPresetText: {
    color: '#8E8E93',
    fontSize: 12,
    marginTop: 6,
  },
  cropPresetTextActive: {
    color: '#FFFFFF',
  },
  filterOptions: {
    paddingHorizontal: 16,
    gap: 12,
  },
  filterPreset: {
    alignItems: 'center',
  },
  filterPresetActive: {
    // Active state handled by border
  },
  filterPreview: {
    width: 70,
    height: 70,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 6,
  },
  filterPreviewImage: {
    width: '100%',
    height: '100%',
  },
  filterPreviewOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  filterPresetText: {
    color: '#8E8E93',
    fontSize: 11,
  },
  filterPresetTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  adjustOptions: {
    paddingHorizontal: 20,
  },
  adjustRow: {
    marginBottom: 16,
  },
  adjustLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  adjustLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    marginLeft: 8,
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sliderButton: {
    padding: 8,
    backgroundColor: '#2C2C2E',
    borderRadius: 8,
  },
  sliderTrack: {
    flex: 1,
    height: 4,
    backgroundColor: '#2C2C2E',
    borderRadius: 2,
    marginHorizontal: 12,
    overflow: 'hidden',
  },
  sliderFill: {
    height: '100%',
    backgroundColor: '#0095F6',
    borderRadius: 2,
  },
  resetAdjustButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 8,
  },
  resetAdjustText: {
    color: '#0095F6',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
});

export default function EditStoryScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const { clinicId } = useClinic();
  const params = useLocalSearchParams<{
    uri: string;
    width: string;
    height: string;
    mediaType: string;
    showLocationSticker?: string;
    captureTime?: string; // ISO timestamp of when image was captured
  }>();

  // ========== Capture Time ==========
  // Use the image's capture time, fallback to current time
  const captureTime = useMemo(() => {
    if (params.captureTime) {
      const parsed = new Date(params.captureTime);
      return isNaN(parsed.getTime()) ? new Date() : parsed;
    }
    return new Date();
  }, [params.captureTime]);

  // ========== Clinic Data (dynamic from Firestore) ==========
  const [clinicData, setClinicData] = useState<ClinicData | null>(null);

  useEffect(() => {
    if (!clinicId) return;
    let cancelled = false;
    fetchClinicData(clinicId).then(data => {
      if (!cancelled && data) setClinicData(data);
    });
    return () => { cancelled = true; };
  }, [clinicId]);

  // Derived values – fall back to defaults until data loads
  const clinicName = clinicData?.clinicName ?? 'My Clinic';
  const clinicPhoneNumber = clinicData?.clinicPhone ?? clinicData?.phone ?? '';
  const clinicCity = clinicData?.city ?? '';
  const clinicType = clinicData?.clinicType ?? '';

  // ========== Tool States ==========
  const [activeMode, setActiveMode] = useState<'none' | 'text' | 'draw' | 'stickers'>('none');
  const [moreMenuVisible, setMoreMenuVisible] = useState(false);
  const [stickerTrayVisible, setStickerTrayVisible] = useState(false);
  const [aiLabelModalVisible, setAiLabelModalVisible] = useState(false);
  const [toolsExpanded, setToolsExpanded] = useState(false);
  const [locationStickerSheetVisible, setLocationStickerSheetVisible] = useState(false);
  
  // ========== Location Sticker State ==========
  const [locationSticker, setLocationSticker] = useState<{
    id: string;
    clinicName: string;
    city: string;
    visible: boolean;
    x: number;
    y: number;
    scale: number;
    rotation: number;
    variant: LocationStickerVariant;
  } | null>(null);
  
  // ========== Text Editor States ==========
  const [textEditorVisible, setTextEditorVisible] = useState(false);
  const [textContent, setTextContent] = useState('');
  const [selectedFontIndex, setSelectedFontIndex] = useState(0);
  const [selectedColorIndex, setSelectedColorIndex] = useState(0);
  const [textAlignment, setTextAlignment] = useState<TextAlignment>('center');
  const [textHasBackground, setTextHasBackground] = useState(false);
  const [textSize, setTextSize] = useState(32);
  const [textToolbarMode, setTextToolbarMode] = useState<TextToolbarMode>('fonts');
  const [selectedEffectIndex, setSelectedEffectIndex] = useState(0);
  const [selectedAnimationIndex, setSelectedAnimationIndex] = useState(0);
  
  // ========== Settings States ==========
  const [aiLabelEnabled, setAiLabelEnabled] = useState(false);
  const [commentsEnabled, setCommentsEnabled] = useState(true);
  const [caption, setCaption] = useState('');
  
  // ========== Clock States ==========
  const [clockVisible, setClockVisible] = useState(true); // Show clock by default
  const [clockStyle, setClockStyle] = useState<ClockStyle>('digital');
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // ========== Clock Sticker State ==========
  const [clockSticker, setClockSticker] = useState<{
    id: string;
    designIndex: number;
    visible: boolean;
    x: number;
    y: number;
    scale: number;
    rotation: number;
    time: Date; // The capture time to display
  } | null>(null);
  
  // ========== GIF Picker State ==========
  const [gifPickerVisible, setGifPickerVisible] = useState(false);
  const [gifSearchQuery, setGifSearchQuery] = useState('');

  // ========== Music Picker States ==========
  const [musicPickerVisible, setMusicPickerVisible] = useState(false);
  const [musicSearchQuery, setMusicSearchQuery] = useState('');
  const [selectedMusicTab, setSelectedMusicTab] = useState<'foryou' | 'trending' | 'original' | 'saved'>('foryou');
  const [selectedTrack, setSelectedTrack] = useState<{
    id: string;
    title: string;
    artist: string;
    duration: string;
    reelCount: string;
    thumbnail: string;
  } | null>(null);
  
  // ========== Text Overlays ==========
  const [textOverlays, setTextOverlays] = useState<TextOverlay[]>([]);
  
  // ========== Photo Sticker States ==========
  const [photoStickers, setPhotoStickers] = useState<PhotoSticker[]>([]);
  const [backgroundImageUri, setBackgroundImageUri] = useState<string | null>(null);
  const pendingPhotoPickerOpen = useRef(false);

  // ========== Phone Sticker States ==========
  const [phoneStickersOnCanvas, setPhoneStickersOnCanvas] = useState<PhoneStickerOnCanvas[]>([]);
  const [phoneStickerSettingsId, setPhoneStickerSettingsId] = useState<string | null>(null);

  // ========== Clinic Name Sticker States ==========
  const [clinicNameStickersOnCanvas, setClinicNameStickersOnCanvas] = useState<ClinicNameStickerOnCanvas[]>([]);
  const [clinicNameStickerSettingsId, setClinicNameStickerSettingsId] = useState<string | null>(null);

  // ========== Combo Sticker States ==========
  const [comboStickersOnCanvas, setComboStickersOnCanvas] = useState<ComboStickerOnCanvas[]>([]);
  const [comboStickerSettingsId, setComboStickerSettingsId] = useState<string | null>(null);

  // ========== Dental Sticker States ==========
  const [dentalStickersOnCanvas, setDentalStickersOnCanvas] = useState<DentalStickerOnCanvas[]>([]);

  // ========== Laser Sticker States ==========
  const [laserStickersOnCanvas, setLaserStickersOnCanvas] = useState<LaserStickerOnCanvas[]>([]);

  // ========== Beauty Sticker States ==========
  const [beautyStickersOnCanvas, setBeautyStickersOnCanvas] = useState<BeautyStickerOnCanvas[]>([]);

  // ========== Trash Zone State ==========
  const [isDraggingStickerToTrash, setIsDraggingStickerToTrash] = useState(false);
  const [isHoveringTrash, setIsHoveringTrash] = useState(false);
  const trashScaleAnim = useRef(new Animated.Value(1)).current;
  const isDraggingRef = useRef(false);
  const isHoveringRef = useRef(false);

  // ========== Top Boundary Warning State ==========
  const [isStickerAboveBoundary, setIsStickerAboveBoundary] = useState(false);
  const isAboveBoundaryRef = useRef(false);
  const boundaryFlashAnim = useRef(new Animated.Value(0)).current;
  const boundaryShakeAnim = useRef(new Animated.Value(0)).current;
  const DRAG_GUIDE_BOUNDARY_Y = Platform.OS === 'ios' ? 78 : 62; // guide top + some padding

  // ========== Image Editing Modal State ==========
  const [imageEditingVisible, setImageEditingVisible] = useState(false);
  const [pendingEditImage, setPendingEditImage] = useState<{
    uri: string;
    width: number;
    height: number;
  } | null>(null);
  
  // ========== Text Editing State ==========
  const [editingTextId, setEditingTextId] = useState<string | null>(null);

  // ========== Computed Values ==========
  const hasMedia = Boolean(params.uri) || Boolean(backgroundImageUri);
  const hasValidContent = hasMedia || textOverlays.length > 0 || photoStickers.length > 0;
  const canShare = hasValidContent;

  // ========== Clock Update Effect ==========
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // ========== Handle Return from Location Permission Screen ==========
  useEffect(() => {
    if (params.showLocationSticker === 'true') {
      // Small delay to ensure screen is fully rendered
      setTimeout(() => {
        setLocationStickerSheetVisible(true);
      }, 300);
    }
  }, [params.showLocationSticker]);

  // Animation refs
  const toolbarAnim = useRef(new Animated.Value(1)).current;
  const stickerItemScale = useRef(new Animated.Value(1)).current;
  
  // Bottom sheet swipe animation refs
  const stickerTrayTranslateY = useRef(new Animated.Value(0)).current;
  const musicPickerTranslateY = useRef(new Animated.Value(0)).current;
  const locationSheetTranslateY = useRef(new Animated.Value(0)).current;

  // ========== Memoized PanResponders for Bottom Sheets ==========
  const stickerTrayPanResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => false,
    onMoveShouldSetPanResponder: (_, gestureState) => {
      return gestureState.dy > 15 && Math.abs(gestureState.dx) < Math.abs(gestureState.dy);
    },
    onPanResponderMove: (_, gestureState) => {
      if (gestureState.dy > 0) {
        stickerTrayTranslateY.setValue(gestureState.dy);
      }
    },
    onPanResponderRelease: (_, gestureState) => {
      if (gestureState.dy > 150 || (gestureState.dy > 50 && gestureState.vy > 0.5)) {
        Animated.timing(stickerTrayTranslateY, {
          toValue: SCREEN_HEIGHT,
          duration: 250,
          useNativeDriver: true,
        }).start(() => {
          setStickerTrayVisible(false);
          setActiveMode('none');
          stickerTrayTranslateY.setValue(0);
        });
      } else {
        Animated.spring(stickerTrayTranslateY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 100,
          friction: 10,
        }).start();
      }
    },
  }), [stickerTrayTranslateY]);

  const musicPickerPanResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => false,
    onMoveShouldSetPanResponder: (_, gestureState) => {
      return gestureState.dy > 15 && Math.abs(gestureState.dx) < Math.abs(gestureState.dy);
    },
    onPanResponderMove: (_, gestureState) => {
      if (gestureState.dy > 0) {
        musicPickerTranslateY.setValue(gestureState.dy);
      }
    },
    onPanResponderRelease: (_, gestureState) => {
      if (gestureState.dy > 150 || (gestureState.dy > 50 && gestureState.vy > 0.5)) {
        Animated.timing(musicPickerTranslateY, {
          toValue: SCREEN_HEIGHT,
          duration: 250,
          useNativeDriver: true,
        }).start(() => {
          setMusicPickerVisible(false);
          setMusicSearchQuery('');
          musicPickerTranslateY.setValue(0);
        });
      } else {
        Animated.spring(musicPickerTranslateY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 100,
          friction: 10,
        }).start();
      }
    },
  }), [musicPickerTranslateY]);

  const locationSheetPanResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => false,
    onMoveShouldSetPanResponder: (_, gestureState) => {
      return gestureState.dy > 15 && Math.abs(gestureState.dx) < Math.abs(gestureState.dy);
    },
    onPanResponderMove: (_, gestureState) => {
      if (gestureState.dy > 0) {
        locationSheetTranslateY.setValue(gestureState.dy);
      }
    },
    onPanResponderRelease: (_, gestureState) => {
      if (gestureState.dy > 150 || (gestureState.dy > 50 && gestureState.vy > 0.5)) {
        Animated.timing(locationSheetTranslateY, {
          toValue: SCREEN_HEIGHT,
          duration: 250,
          useNativeDriver: true,
        }).start(() => {
          setLocationStickerSheetVisible(false);
          locationSheetTranslateY.setValue(0);
        });
      } else {
        Animated.spring(locationSheetTranslateY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 100,
          friction: 10,
        }).start();
      }
    },
  }), [locationSheetTranslateY]);

  // ========== Media Transform State ==========
  const mediaScale = useRef(new Animated.Value(1)).current;
  const mediaTranslateX = useRef(new Animated.Value(0)).current;
  const mediaTranslateY = useRef(new Animated.Value(0)).current;
  const mediaRotation = useRef(new Animated.Value(0)).current;
  
  // Track gesture state
  const lastScale = useRef(1);
  const lastTranslateX = useRef(0);
  const lastTranslateY = useRef(0);
  const lastRotation = useRef(0);
  const initialDistance = useRef(0);
  const initialAngle = useRef(0);
  const isPinching = useRef(false);
  const pinchCenterX = useRef(0);
  const pinchCenterY = useRef(0);
  const pinchStartTranslateX = useRef(0);
  const pinchStartTranslateY = useRef(0);

  // Calculate distance between two touch points
  const getDistance = (touches: any[]) => {
    if (touches.length < 2) return 0;
    const dx = touches[0].pageX - touches[1].pageX;
    const dy = touches[0].pageY - touches[1].pageY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // Calculate center point between two touches
  const getCenter = (touches: any[]) => {
    if (touches.length < 2) return { x: 0, y: 0 };
    return {
      x: (touches[0].pageX + touches[1].pageX) / 2,
      y: (touches[0].pageY + touches[1].pageY) / 2,
    };
  };

  // Calculate angle between two touch points (in degrees)
  const getAngle = (touches: any[]) => {
    if (touches.length < 2) return 0;
    const dx = touches[1].pageX - touches[0].pageX;
    const dy = touches[1].pageY - touches[0].pageY;
    return Math.atan2(dy, dx) * (180 / Math.PI);
  };

  // ========== Pan Responder for Gestures ==========
  const mediaPanResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: (evt) => {
      // Only respond to two-finger gestures to prevent accidental image movement
      return evt.nativeEvent.touches.length >= 2;
    },
    onMoveShouldSetPanResponder: (evt, gestureState) => {
      // Only respond to two-finger gestures
      const touches = evt.nativeEvent.touches;
      if (touches.length < 2) return false;
      return Math.abs(gestureState.dx) > 2 || Math.abs(gestureState.dy) > 2;
    },
    onPanResponderGrant: (evt) => {
      const touches = evt.nativeEvent.touches;
      if (touches.length >= 2) {
        isPinching.current = true;
        initialDistance.current = getDistance(touches);
        initialAngle.current = getAngle(touches);
        const center = getCenter(touches);
        pinchCenterX.current = center.x;
        pinchCenterY.current = center.y;
        pinchStartTranslateX.current = lastTranslateX.current;
        pinchStartTranslateY.current = lastTranslateY.current;
      }
    },
    onPanResponderMove: (evt, gestureState) => {
      const touches = evt.nativeEvent.touches;
      
      // Only process two-finger gestures
      if (touches.length < 2) return;
      
      if (touches.length >= 2) {
        // Initialize pinch if just started
        if (!isPinching.current) {
          isPinching.current = true;
          initialDistance.current = getDistance(touches);
          initialAngle.current = getAngle(touches);
          const center = getCenter(touches);
          pinchCenterX.current = center.x;
          pinchCenterY.current = center.y;
          pinchStartTranslateX.current = lastTranslateX.current;
          pinchStartTranslateY.current = lastTranslateY.current;
        }
        
        // Calculate scale (min 0.1 for significant zoom out)
        const currentDistance = getDistance(touches);
        if (initialDistance.current > 0) {
          const scaleFactor = currentDistance / initialDistance.current;
          const newScale = Math.max(0.1, Math.min(4, lastScale.current * scaleFactor));
          mediaScale.setValue(newScale);
        }
        
        // Calculate rotation
        const currentAngle = getAngle(touches);
        const angleDiff = currentAngle - initialAngle.current;
        const newRotation = lastRotation.current + angleDiff;
        mediaRotation.setValue(newRotation);
        
        // Simultaneous pan - track center point movement
        const currentCenter = getCenter(touches);
        const centerDx = currentCenter.x - pinchCenterX.current;
        const centerDy = currentCenter.y - pinchCenterY.current;
        
        const newX = pinchStartTranslateX.current + centerDx;
        const newY = pinchStartTranslateY.current + centerDy;
        
        // Increased movement range for smaller scaled images
        const maxOffset = SCREEN_WIDTH;
        const clampedX = Math.max(-maxOffset, Math.min(maxOffset, newX));
        const clampedY = Math.max(-maxOffset, Math.min(maxOffset, newY));
        
        mediaTranslateX.setValue(clampedX);
        mediaTranslateY.setValue(clampedY);
      }
    },
    onPanResponderRelease: () => {
      // Always save the current scale, position, and rotation
      // @ts-ignore - _value exists on Animated.Value
      lastScale.current = mediaScale._value || lastScale.current;
      // @ts-ignore - _value exists on Animated.Value
      lastTranslateX.current = mediaTranslateX._value || lastTranslateX.current;
      // @ts-ignore - _value exists on Animated.Value
      lastTranslateY.current = mediaTranslateY._value || lastTranslateY.current;
      // @ts-ignore - _value exists on Animated.Value
      lastRotation.current = mediaRotation._value || lastRotation.current;
      
      isPinching.current = false;
      initialDistance.current = 0;
      initialAngle.current = 0;
    },
    onPanResponderTerminate: () => {
      isPinching.current = false;
    },
  }), [mediaScale, mediaTranslateX, mediaTranslateY]);

  // Reset media transform
  const resetMediaTransform = useCallback(() => {
    Animated.parallel([
      Animated.spring(mediaScale, { toValue: 1, useNativeDriver: true }),
      Animated.spring(mediaTranslateX, { toValue: 0, useNativeDriver: true }),
      Animated.spring(mediaTranslateY, { toValue: 0, useNativeDriver: true }),
      Animated.spring(mediaRotation, { toValue: 0, useNativeDriver: true }),
    ]).start();
    lastScale.current = 1;
    lastTranslateX.current = 0;
    lastTranslateY.current = 0;
    lastRotation.current = 0;
  }, [mediaScale, mediaTranslateX, mediaTranslateY, mediaRotation]);

  // ========== Handlers ==========
  const handleClose = useCallback(() => {
    router.back();
  }, [router]);

  const handleDiscard = useCallback(() => {
    router.dismissAll();
    router.replace('/(tabs)/create');
  }, [router]);

  const handleShare = useCallback(() => {
    // TODO: Implement story sharing with all overlays
    console.log('Sharing story with media:', params.uri);
    console.log('AI Label:', aiLabelEnabled);
    console.log('Comments:', commentsEnabled);
    console.log('Text overlays:', textOverlays);
  }, [params.uri, aiLabelEnabled, commentsEnabled, textOverlays]);

  const handleDownload = useCallback(() => {
    // TODO: Implement download functionality
    console.log('Downloading story...');
  }, []);

  // ========== Location Sticker Handlers ==========
  const updateLocationStickerTransform = useCallback((updates: Partial<{ x: number; y: number; scale: number; rotation: number }>) => {
    setLocationSticker(prev => prev ? { ...prev, ...updates } : null);
  }, []);

  // Add clinic sticker directly (no selection screen needed)
  const addClinicSticker = useCallback(() => {
    setLocationSticker({
      id: 'clinic-sticker',
      clinicName: clinicName,
      city: clinicCity,
      visible: true,
      x: SCREEN_WIDTH / 2 - 70,
      y: SCREEN_HEIGHT / 2 - 40,
      scale: 1,
      rotation: -4, // Slight rotation for style
      variant: 'branded',
    });
  }, [clinicName, clinicCity]);

  // ========== Clock Sticker Handlers ==========
  const updateClockStickerTransform = useCallback((updates: Partial<{ x: number; y: number; scale: number; rotation: number }>) => {
    setClockSticker(prev => prev ? { ...prev, ...updates } : null);
  }, []);

  // Add clock sticker to canvas (starts with Style 7 = index 6)
  const addClockSticker = useCallback(() => {
    setClockSticker({
      id: 'clock-sticker',
      designIndex: 6, // Style 7 as default
      visible: true,
      x: SCREEN_WIDTH / 2 - 60,
      y: SCREEN_HEIGHT / 2 - 60,
      scale: 1,
      rotation: 0,
      time: captureTime, // Use image capture time
    });
  }, [captureTime]);

  // Cycle to next clock design when tapped (8 styles total)
  const cycleClockDesign = useCallback(() => {
    setClockSticker(prev => {
      if (!prev) return null;
      return {
        ...prev,
        designIndex: (prev.designIndex + 1) % 8,
      };
    });
  }, []);

  // ========== Photo Sticker Handlers ==========
  const addPhotoSticker = useCallback((asset: ImagePicker.ImagePickerAsset) => {
    const newSticker: PhotoSticker = {
      id: `photo-${Date.now()}`,
      uri: asset.uri,
      width: asset.width || 300,
      height: asset.height || 300,
      x: SCREEN_WIDTH / 2 - 75,
      y: SCREEN_HEIGHT / 2 - 75,
      scale: 1,
      rotation: 0,
    };
    
    setPhotoStickers(prev => [...prev, newSticker]);
  }, []);

  const openPhotoPicker = useCallback(async () => {
    console.log('=== openPhotoPicker START ===');
    // Determine if we already have a background image
    const alreadyHasBackground = Boolean(params.uri) || Boolean(backgroundImageUri);
    console.log('Already has background:', alreadyHasBackground);
    try {
      // Request permission using the direct expo-image-picker method
      // This ensures proper native picker is launched
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      console.log('Permission result:', JSON.stringify(permissionResult));
      
      if (!permissionResult.granted) {
        console.log('Permission denied');
        Alert.alert(
          'Permission Required',
          'Photo library access is required to use this feature. Please enable it in your device settings.',
          [{ text: 'OK' }]
        );
        return;
      }
      
      console.log('Permission OK! Launching native image picker...');
      
      // Launch the native image picker directly
      // Using single selection mode for maximum compatibility across iOS versions
      // This ensures we get the proper native photo picker, not a share sheet
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: false,
        quality: 1,
        allowsEditing: false,
        exif: false,
        base64: false,
      });
      
      console.log('Picker result canceled:', result.canceled);
      console.log('Picker result assets count:', result.assets?.length || 0);
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        console.log('Selected photo URI:', asset.uri);
        console.log('Selected photo dimensions:', asset.width, 'x', asset.height);
        
        if (alreadyHasBackground) {
          // Background already exists — add new photo as a draggable sticker on top
          console.log('Adding photo as sticker layer on top of background');
          addPhotoSticker(asset);
        } else {
          // No background yet — open editing modal, first photo becomes background
          const imageData = {
            uri: asset.uri,
            width: asset.width || 1080,
            height: asset.height || 1920,
          };
          
          console.log('Setting pendingEditImage:', JSON.stringify(imageData));
          setPendingEditImage(imageData);
          
          // Then show the modal (with a small delay to ensure state is set)
          console.log('Opening editing modal...');
          setTimeout(() => {
            console.log('Setting imageEditingVisible to true');
            setImageEditingVisible(true);
          }, 100);
        }
      } else {
        console.log('User cancelled or no photo selected');
      }
    } catch (error) {
      console.error('=== ERROR in openPhotoPicker ===', error);
      Alert.alert(
        'Error',
        'Failed to open photo library. Please try again.',
        [{ text: 'OK' }]
      );
    }
    console.log('=== openPhotoPicker END ===');
  }, [params.uri, backgroundImageUri, addPhotoSticker]);

  // Handler for when image editing is complete
  const handleImageEditingDone = useCallback((editedUri: string, width: number, height: number) => {
    const alreadyHasBackground = Boolean(params.uri) || Boolean(backgroundImageUri);
    
    if (!alreadyHasBackground) {
      // First photo — set as the main background canvas
      console.log('Image editing done, setting as background...');
      setBackgroundImageUri(editedUri);
    } else {
      // Subsequent photos — add as draggable sticker layer
      console.log('Image editing done, adding as sticker layer...');
      const newSticker: PhotoSticker = {
        id: `photo-${Date.now()}`,
        uri: editedUri,
        width: width,
        height: height,
        x: SCREEN_WIDTH / 2 - 75,
        y: SCREEN_HEIGHT / 2 - 75,
        scale: 1,
        rotation: 0,
      };
      setPhotoStickers(prev => [...prev, newSticker]);
    }
    
    setImageEditingVisible(false);
    setPendingEditImage(null);
  }, [params.uri, backgroundImageUri]);

  // Handler for canceling image editing
  const handleImageEditingCancel = useCallback(() => {
    console.log('Image editing cancelled');
    setImageEditingVisible(false);
    setPendingEditImage(null);
  }, []);

  const updatePhotoStickerTransform = useCallback((id: string, updates: Partial<{ x: number; y: number; scale: number; rotation: number }>) => {
    setPhotoStickers(prev => prev.map(sticker => 
      sticker.id === id ? { ...sticker, ...updates } : sticker
    ));
  }, []);

  const removePhotoSticker = useCallback((id: string) => {
    setPhotoStickers(prev => prev.filter(sticker => sticker.id !== id));
  }, []);

  // ========== Phone Sticker Handlers ==========
  const addPhoneStickerToCanvas = useCallback((designId: string) => {
    const newSticker: PhoneStickerOnCanvas = {
      id: `phone-${Date.now()}`,
      designId,
      phoneNumber: clinicPhoneNumber,
      x: SCREEN_WIDTH / 2 - 70,
      y: SCREEN_HEIGHT / 2 - 40,
      scale: 1,
      rotation: 0,
      isCallable: true, // unlocked (tap-to-call) by default
    };
    setPhoneStickersOnCanvas(prev => [...prev, newSticker]);
  }, [clinicPhoneNumber]);

  const updatePhoneStickerTransform = useCallback((id: string, updates: Partial<{ x: number; y: number; scale: number; rotation: number }>) => {
    setPhoneStickersOnCanvas(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  }, []);

  const removePhoneStickerFromCanvas = useCallback((id: string) => {
    setPhoneStickersOnCanvas(prev => prev.filter(s => s.id !== id));
    // Close settings panel if this sticker was showing it
    setPhoneStickerSettingsId(prev => prev === id ? null : prev);
  }, []);

  const togglePhoneStickerCallable = useCallback((id: string) => {
    setPhoneStickersOnCanvas(prev => prev.map(s =>
      s.id === id ? { ...s, isCallable: !s.isCallable } : s
    ));
  }, []);

  // ========== Clinic Name Sticker Handlers ==========
  const addClinicNameStickerToCanvas = useCallback((designId: string) => {
    const newSticker: ClinicNameStickerOnCanvas = {
      id: `clinicname-${Date.now()}`,
      designId,
      clinicName,
      x: SCREEN_WIDTH / 2 - 70,
      y: SCREEN_HEIGHT / 2 - 40,
      scale: 1,
      rotation: 0,
      isNavigable: true, // default: unlocked (tap navigates to clinic profile)
    };
    setClinicNameStickersOnCanvas(prev => [...prev, newSticker]);
  }, [clinicName]);

  const updateClinicNameStickerTransform = useCallback((id: string, updates: Partial<{ x: number; y: number; scale: number; rotation: number }>) => {
    setClinicNameStickersOnCanvas(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  }, []);

  const removeClinicNameStickerFromCanvas = useCallback((id: string) => {
    setClinicNameStickersOnCanvas(prev => prev.filter(s => s.id !== id));
  }, []);

  const toggleClinicNameStickerNavigable = useCallback((id: string) => {
    setClinicNameStickersOnCanvas(prev => prev.map(s =>
      s.id === id ? { ...s, isNavigable: !s.isNavigable } : s
    ));
  }, []);

  // ========== Combo Sticker Handlers ==========
  const addComboStickerToCanvas = useCallback((designId: string) => {
    const newSticker: ComboStickerOnCanvas = {
      id: `combo-${Date.now()}`,
      designId,
      clinicName,
      clinicPhoneNumber,
      x: SCREEN_WIDTH / 2 - 80,
      y: SCREEN_HEIGHT / 2 - 50,
      scale: 1,
      rotation: 0,
      isInteractive: true, // default: unlocked
    };
    setComboStickersOnCanvas(prev => [...prev, newSticker]);
  }, [clinicName, clinicPhoneNumber]);

  const updateComboStickerTransform = useCallback((id: string, updates: Partial<{ x: number; y: number; scale: number; rotation: number }>) => {
    setComboStickersOnCanvas(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  }, []);

  const removeComboStickerFromCanvas = useCallback((id: string) => {
    setComboStickersOnCanvas(prev => prev.filter(s => s.id !== id));
  }, []);

  const toggleComboStickerInteractive = useCallback((id: string) => {
    setComboStickersOnCanvas(prev => prev.map(s =>
      s.id === id ? { ...s, isInteractive: !s.isInteractive } : s
    ));
  }, []);

  // ========== Dental Sticker Handlers ==========
  const addDentalStickerToCanvas = useCallback((designId: string) => {
    const newSticker: DentalStickerOnCanvas = {
      id: `dental-${Date.now()}`,
      designId,
      x: SCREEN_WIDTH / 2 - 60,
      y: SCREEN_HEIGHT / 2 - 60,
      scale: 1,
      rotation: 0,
    };
    setDentalStickersOnCanvas(prev => [...prev, newSticker]);
  }, []);

  const updateDentalStickerTransform = useCallback((id: string, updates: Partial<{ x: number; y: number; scale: number; rotation: number }>) => {
    setDentalStickersOnCanvas(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  }, []);

  const removeDentalStickerFromCanvas = useCallback((id: string) => {
    setDentalStickersOnCanvas(prev => prev.filter(s => s.id !== id));
  }, []);

  // ========== Laser Sticker Handlers ==========
  const addLaserStickerToCanvas = useCallback((designId: string) => {
    const newSticker: LaserStickerOnCanvas = {
      id: `laser-${Date.now()}`,
      designId,
      x: SCREEN_WIDTH / 2 - 60,
      y: SCREEN_HEIGHT / 2 - 60,
      scale: 1,
      rotation: 0,
    };
    setLaserStickersOnCanvas(prev => [...prev, newSticker]);
  }, []);

  const updateLaserStickerTransform = useCallback((id: string, updates: Partial<{ x: number; y: number; scale: number; rotation: number }>) => {
    setLaserStickersOnCanvas(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  }, []);

  const removeLaserStickerFromCanvas = useCallback((id: string) => {
    setLaserStickersOnCanvas(prev => prev.filter(s => s.id !== id));
  }, []);

  // ========== Beauty Sticker Handlers ==========
  const addBeautyStickerToCanvas = useCallback((designId: string) => {
    const newSticker: BeautyStickerOnCanvas = {
      id: `beauty-${Date.now()}`,
      designId,
      x: SCREEN_WIDTH / 2 - 60,
      y: SCREEN_HEIGHT / 2 - 60,
      scale: 1,
      rotation: 0,
    };
    setBeautyStickersOnCanvas(prev => [...prev, newSticker]);
  }, []);

  const updateBeautyStickerTransform = useCallback((id: string, updates: Partial<{ x: number; y: number; scale: number; rotation: number }>) => {
    setBeautyStickersOnCanvas(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  }, []);

  const removeBeautyStickerFromCanvas = useCallback((id: string) => {
    setBeautyStickersOnCanvas(prev => prev.filter(s => s.id !== id));
  }, []);

  // ========== Trash Zone Handler (optimized — only setState on actual transitions) ==========
  const handlePhoneStickerDragState = useCallback((isDragging: boolean, pageY?: number) => {
    // Only update dragging state when it actually changes
    if (isDraggingRef.current !== isDragging) {
      isDraggingRef.current = isDragging;
      setIsDraggingStickerToTrash(isDragging);
      // Close settings panel when dragging starts
      if (isDragging) {
        setPhoneStickerSettingsId(null);
        setClinicNameStickerSettingsId(null);
        setComboStickerSettingsId(null);
      }
    }
    if (!isDragging) {
      if (isHoveringRef.current) {
        isHoveringRef.current = false;
        setIsHoveringTrash(false);
        Animated.spring(trashScaleAnim, { toValue: 1, useNativeDriver: true, tension: 200, friction: 15 }).start();
      }
      // Reset boundary warning on drag end
      if (isAboveBoundaryRef.current) {
        isAboveBoundaryRef.current = false;
        setIsStickerAboveBoundary(false);
        boundaryFlashAnim.setValue(0);
        boundaryShakeAnim.setValue(0);
      }
      return;
    }
    if (pageY !== undefined) {
      const TRASH_ZONE_TOP = SCREEN_HEIGHT - 120;
      const hovering = pageY > TRASH_ZONE_TOP;
      // Only update hover state & animate on actual transition
      if (isHoveringRef.current !== hovering) {
        isHoveringRef.current = hovering;
        setIsHoveringTrash(hovering);
        Animated.spring(trashScaleAnim, {
          toValue: hovering ? 1.35 : 1,
          useNativeDriver: true,
          tension: 200,
          friction: 15,
        }).start();
      }

      // ── Top boundary detection ──
      const aboveBoundary = pageY < DRAG_GUIDE_BOUNDARY_Y;
      if (isAboveBoundaryRef.current !== aboveBoundary) {
        isAboveBoundaryRef.current = aboveBoundary;
        setIsStickerAboveBoundary(aboveBoundary);
        if (aboveBoundary) {
          // Flash red + shake animation
          Animated.sequence([
            Animated.timing(boundaryFlashAnim, { toValue: 1, duration: 150, useNativeDriver: false }),
            Animated.timing(boundaryFlashAnim, { toValue: 0.6, duration: 150, useNativeDriver: false }),
            Animated.timing(boundaryFlashAnim, { toValue: 1, duration: 150, useNativeDriver: false }),
          ]).start();
          Animated.sequence([
            Animated.timing(boundaryShakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
            Animated.timing(boundaryShakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
            Animated.timing(boundaryShakeAnim, { toValue: 6, duration: 60, useNativeDriver: true }),
            Animated.timing(boundaryShakeAnim, { toValue: -6, duration: 60, useNativeDriver: true }),
            Animated.timing(boundaryShakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
          ]).start();
        } else {
          boundaryFlashAnim.setValue(0);
          boundaryShakeAnim.setValue(0);
        }
      }
    }
  }, [trashScaleAnim, boundaryFlashAnim, boundaryShakeAnim, DRAG_GUIDE_BOUNDARY_Y]);

  // ========== Memoized Long-Press Handlers (prevents PanResponder re-creation) ==========
  const handlePhoneStickerLongPress = useCallback((id: string) => {
    setPhoneStickerSettingsId(prev => prev === id ? null : id);
  }, []);
  const handleClinicNameStickerLongPress = useCallback((id: string) => {
    setClinicNameStickerSettingsId(prev => prev === id ? null : id);
  }, []);
  const handleComboStickerLongPress = useCallback((id: string) => {
    setComboStickerSettingsId(prev => prev === id ? null : id);
  }, []);

  // ========== Text Editor ==========
  const openTextEditor = useCallback((existingId?: string) => {
    if (existingId) {
      // Editing existing text
      const existing = textOverlays.find(t => t.id === existingId);
      if (existing) {
        setEditingTextId(existingId);
        setTextContent(existing.content);
        setSelectedFontIndex(FONT_STYLES.findIndex(f => f.id === existing.fontStyle.id) || 0);
        setSelectedColorIndex(COLOR_PALETTE.indexOf(existing.color) || 0);
        setTextAlignment(existing.alignment);
        setTextHasBackground(existing.hasBackground);
        setTextSize(existing.size);
        setSelectedEffectIndex(TEXT_EFFECTS.findIndex(e => e.id === existing.effect) || 0);
        setSelectedAnimationIndex(TEXT_ANIMATIONS.findIndex(a => a.id === existing.animation) || 0);
      }
    } else {
      // New text
      setEditingTextId(null);
      setTextContent('');
      setSelectedFontIndex(2); // Default to Typewriter
      setSelectedColorIndex(0); // Default to white
      setTextAlignment('center');
      setTextHasBackground(false);
      setTextSize(32);
      setSelectedEffectIndex(0);
      setSelectedAnimationIndex(0);
      setTextToolbarMode('fonts');
    }
    setTextEditorVisible(true);
    setActiveMode('text');
  }, [textOverlays]);

  const closeTextEditor = useCallback(() => {
    setTextEditorVisible(false);
    setActiveMode('none');
    setEditingTextId(null);
    setTextToolbarMode('fonts');
  }, []);

  const addTextOverlay = useCallback(() => {
    if (textContent.trim()) {
      if (editingTextId) {
        // Update existing text
        setTextOverlays(prev => prev.map(overlay => 
          overlay.id === editingTextId 
            ? {
                ...overlay,
                content: textContent,
                fontStyle: FONT_STYLES[selectedFontIndex],
                color: COLOR_PALETTE[selectedColorIndex],
                alignment: textAlignment,
                hasBackground: textHasBackground,
                size: textSize,
                effect: TEXT_EFFECTS[selectedEffectIndex].id,
                animation: TEXT_ANIMATIONS[selectedAnimationIndex].id,
              }
            : overlay
        ));
      } else {
        // Add new text
        const newOverlay: TextOverlay = {
          id: Date.now().toString(),
          content: textContent,
          fontStyle: FONT_STYLES[selectedFontIndex],
          color: COLOR_PALETTE[selectedColorIndex],
          alignment: textAlignment,
          hasBackground: textHasBackground,
          size: textSize,
          x: SCREEN_WIDTH / 2,
          y: SCREEN_HEIGHT / 2,
          scale: 1,
          rotation: 0,
          effect: TEXT_EFFECTS[selectedEffectIndex].id,
          animation: TEXT_ANIMATIONS[selectedAnimationIndex].id,
        };
        setTextOverlays(prev => [...prev, newOverlay]);
      }
    } else if (editingTextId) {
      // Delete text if content is empty when editing
      setTextOverlays(prev => prev.filter(t => t.id !== editingTextId));
    }
    closeTextEditor();
  }, [textContent, selectedFontIndex, selectedColorIndex, textAlignment, textHasBackground, textSize, selectedEffectIndex, selectedAnimationIndex, editingTextId, closeTextEditor]);

  const deleteTextOverlay = useCallback((id: string) => {
    setTextOverlays(prev => prev.filter(t => t.id !== id));
  }, []);

  // Update text overlay transform (position, scale, rotation)
  const updateTextOverlayTransform = useCallback((id: string, updates: Partial<{ x: number; y: number; scale: number; rotation: number }>) => {
    setTextOverlays(prev => prev.map(overlay => 
      overlay.id === id ? { ...overlay, ...updates } : overlay
    ));
  }, []);

  const cycleFontStyle = useCallback(() => {
    setSelectedFontIndex(prev => (prev + 1) % FONT_STYLES.length);
  }, []);

  const cycleAlignment = useCallback(() => {
    setTextAlignment(prev => {
      if (prev === 'left') return 'center';
      if (prev === 'center') return 'right';
      return 'left';
    });
  }, []);

  // ========== Stickers ==========
  const openStickerTray = useCallback(() => {
    setStickerTrayVisible(true);
    setActiveMode('stickers');
  }, []);

  const closeStickerTray = useCallback(() => {
    setStickerTrayVisible(false);
    setActiveMode('none');
  }, []);

  // Called when the sticker tray Modal finishes its dismiss animation (iOS only)
  const handleStickerTrayDismiss = useCallback(() => {
    if (pendingPhotoPickerOpen.current) {
      pendingPhotoPickerOpen.current = false;
      // Small delay to ensure the native modal system is fully clear
      setTimeout(() => {
        openPhotoPicker();
      }, 150);
    }
  }, [openPhotoPicker]);

  // Android fallback: onDismiss doesn't fire on Android, so use useEffect
  useEffect(() => {
    if (!stickerTrayVisible && pendingPhotoPickerOpen.current && Platform.OS === 'android') {
      pendingPhotoPickerOpen.current = false;
      setTimeout(() => {
        openPhotoPicker();
      }, 300);
    }
  }, [stickerTrayVisible, openPhotoPicker]);

  // Close location sticker sheet
  const closeLocationStickerSheet = useCallback(() => {
    Animated.timing(locationSheetTranslateY, {
      toValue: SCREEN_HEIGHT,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setLocationStickerSheetVisible(false);
      locationSheetTranslateY.setValue(0);
    });
  }, [locationSheetTranslateY]);

  // Handle selecting a location sticker style from the sheet
  const handleLocationStickerSelect = useCallback((styleVariant: string) => {
    closeLocationStickerSheet();
    // Add clinic sticker after animation completes
    setTimeout(() => addClinicSticker(), 250);
  }, [closeLocationStickerSheet, addClinicSticker]);

  const handleStickerSelect = useCallback(async (stickerId: string) => {
    // Handle location sticker - check permission first
    if (stickerId === 'location') {
      closeStickerTray();
      
      try {
        // Check if location permission is already granted
        const { status } = await Location.getForegroundPermissionsAsync();
        
        if (status === 'granted') {
          // Permission already granted - show sticker style selector directly
          setTimeout(() => setLocationStickerSheetVisible(true), 200);
        } else {
          // Permission not granted - navigate to permission screen
          // Build the return URL with current params plus the showLocationSticker flag
          const returnParams = new URLSearchParams();
          if (params.uri) returnParams.set('uri', params.uri);
          if (params.width) returnParams.set('width', params.width);
          if (params.height) returnParams.set('height', params.height);
          if (params.mediaType) returnParams.set('mediaType', params.mediaType);
          returnParams.set('showLocationSticker', 'true');
          
          router.push({
            pathname: '/story/location-permission',
            params: { returnTo: `/story/edit?${returnParams.toString()}` }
          });
        }
      } catch (error) {
        console.error('Error checking location permission:', error);
        // On error, navigate to permission screen anyway
        router.push('/story/location-permission');
      }
      return;
    }
    
    // Handle clock sticker - add directly to canvas
    if (stickerId === 'clock') {
      closeStickerTray();
      setTimeout(() => addClockSticker(), 200);
      return;
    }
    
    // Handle photo sticker - open image picker
    if (stickerId === 'photo') {
      console.log('Photo sticker selected! Setting pending flag and closing tray...');
      pendingPhotoPickerOpen.current = true;
      closeStickerTray();
      return;
    }
    
    // Handle GIF picker
    if (stickerId === 'gif') {
      closeStickerTray();
      setTimeout(() => setGifPickerVisible(true), 300);
      return;
    }

    // Handle phone stickers – add to canvas
    if (stickerId.startsWith('phone_')) {
      closeStickerTray();
      setTimeout(() => addPhoneStickerToCanvas(stickerId), 200);
      return;
    }

    // Handle clinic name stickers – add to canvas
    if (stickerId.startsWith('clinicname_')) {
      closeStickerTray();
      setTimeout(() => addClinicNameStickerToCanvas(stickerId), 200);
      return;
    }

    // Handle combo stickers – add to canvas
    if (stickerId.startsWith('combo_')) {
      closeStickerTray();
      setTimeout(() => addComboStickerToCanvas(stickerId), 200);
      return;
    }

    // Handle dental stickers – add to canvas (decorative, no data props)
    if (stickerId.startsWith('dental_')) {
      closeStickerTray();
      setTimeout(() => addDentalStickerToCanvas(stickerId), 200);
      return;
    }

    // Handle laser stickers – add to canvas (decorative, no data props)
    if (stickerId.startsWith('laser_')) {
      closeStickerTray();
      setTimeout(() => addLaserStickerToCanvas(stickerId), 200);
      return;
    }

    // Handle beauty stickers – add to canvas (decorative, no data props)
    if (stickerId.startsWith('beauty_')) {
      closeStickerTray();
      setTimeout(() => addBeautyStickerToCanvas(stickerId), 200);
      return;
    }

    // TODO: Add sticker to canvas
    console.log('Selected sticker:', stickerId);
    closeStickerTray();
  }, [closeStickerTray, params, router, addClockSticker, openPhotoPicker, addPhoneStickerToCanvas, addClinicNameStickerToCanvas, addComboStickerToCanvas, addDentalStickerToCanvas, addLaserStickerToCanvas, addBeautyStickerToCanvas]);

  // ========== Draw Mode ==========
  const toggleDrawMode = useCallback(() => {
    setActiveMode(prev => prev === 'draw' ? 'none' : 'draw');
  }, []);

  // ========== Audio ==========
  const handleAudioPress = useCallback(() => {
    setMusicPickerVisible(true);
  }, []);

  // ========== Music Track Selection ==========
  const handleTrackSelect = useCallback((track: typeof MUSIC_TRACKS[0]) => {
    setSelectedTrack(track);
    setMusicPickerVisible(false);
    // Note: Music is for in-app preview only, not exported
  }, []);

  const closeMusicPicker = useCallback(() => {
    setMusicPickerVisible(false);
    setMusicSearchQuery('');
  }, []);

  // ========== Get Font Style ==========
  const getTextStyle = useCallback((fontStyle: typeof FONT_STYLES[0], color: string, size: number) => {
    const baseStyle: any = {
      fontSize: size,
      color: color,
      textAlign: textAlignment,
      textShadowColor: 'rgba(0, 0, 0, 0.3)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 2,
    };

    if (fontStyle.fontFamily) {
      baseStyle.fontFamily = fontStyle.fontFamily;
    }

    switch (fontStyle.style) {
      case 'classic':
        baseStyle.fontWeight = '400';
        break;
      case 'modern':
        baseStyle.fontWeight = '300';
        baseStyle.letterSpacing = 1;
        break;
      case 'strong':
        baseStyle.fontWeight = '900';
        baseStyle.letterSpacing = 2;
        break;
      case 'meme':
        baseStyle.fontWeight = '900';
        baseStyle.textTransform = 'uppercase';
        baseStyle.letterSpacing = 1;
        break;
      case 'elegant':
        baseStyle.fontWeight = '400';
        baseStyle.fontStyle = 'italic';
        break;
      case 'signature':
        baseStyle.fontWeight = '400';
        baseStyle.fontStyle = 'italic';
        break;
      case 'bubble':
        baseStyle.fontWeight = '700';
        baseStyle.letterSpacing = 2;
        break;
      case 'deco':
        baseStyle.fontWeight = '700';
        baseStyle.letterSpacing = 3;
        baseStyle.textTransform = 'uppercase';
        break;
      case 'squeeze':
        baseStyle.fontWeight = '800';
        baseStyle.fontStyle = 'italic';
        baseStyle.letterSpacing = -1;
        break;
      case 'directional':
        baseStyle.fontWeight = '600';
        baseStyle.letterSpacing = 4;
        break;
      case 'literature':
        baseStyle.fontWeight = '400';
        baseStyle.lineHeight = size * 1.4;
        break;
      case 'editor':
        baseStyle.fontWeight = '400';
        baseStyle.letterSpacing = 0.5;
        break;
      case 'poster':
        baseStyle.fontWeight = '900';
        baseStyle.letterSpacing = 4;
        baseStyle.textTransform = 'uppercase';
        break;
      case 'typewriter':
        baseStyle.letterSpacing = 1;
        break;
      default:
        baseStyle.fontWeight = '500';
    }

    return baseStyle;
  }, [textAlignment]);

  // ========== Render Text Editor Modal ==========
  const renderTextEditor = () => {
    // Get selector content based on toolbar mode
    const renderSelectorContent = () => {
      switch (textToolbarMode) {
        case 'fonts':
          return (
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.fontStyleScroller}
              contentContainerStyle={styles.fontStyleContent}
            >
              {FONT_STYLES.map((font, index) => (
                <TouchableOpacity
                  key={font.id}
                  style={[
                    styles.fontStyleBtn,
                    selectedFontIndex === index && styles.fontStyleBtnActive
                  ]}
                  onPress={() => setSelectedFontIndex(index)}
                >
                  <Text style={[
                    styles.fontStyleText,
                    selectedFontIndex === index && styles.fontStyleTextActive,
                    font.fontFamily && { fontFamily: font.fontFamily },
                    font.style === 'strong' && { fontWeight: '900' },
                    font.style === 'squeeze' && { fontStyle: 'italic' },
                    font.style === 'signature' && { fontStyle: 'italic' },
                    font.style === 'poster' && { fontWeight: '900', letterSpacing: 2 },
                  ]}>
                    {font.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          );
        
        case 'colors':
          return (
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.colorSwatchScroller}
              contentContainerStyle={styles.colorSwatchContent}
            >
              {/* Eyedropper */}
              <TouchableOpacity style={styles.eyedropperBtn}>
                <Ionicons name="eyedrop-outline" size={20} color="#FFFFFF" />
              </TouchableOpacity>
              {COLOR_PALETTE.map((color, index) => (
                <TouchableOpacity
                  key={`color-${index}`}
                  style={[
                    styles.colorSwatch,
                    { backgroundColor: color },
                    color === '#FFFFFF' && styles.colorSwatchWhite,
                    selectedColorIndex === index && styles.colorSwatchActive
                  ]}
                  onPress={() => setSelectedColorIndex(index)}
                />
              ))}
            </ScrollView>
          );
        
        case 'effects':
          return (
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.fontStyleScroller}
              contentContainerStyle={styles.fontStyleContent}
            >
              {TEXT_EFFECTS.map((effect, index) => (
                <TouchableOpacity
                  key={effect.id}
                  style={[
                    styles.effectBtn,
                    selectedEffectIndex === index && styles.effectBtnActive
                  ]}
                  onPress={() => setSelectedEffectIndex(index)}
                >
                  <Ionicons 
                    name={effect.icon as any} 
                    size={16} 
                    color={selectedEffectIndex === index ? '#000000' : '#FFFFFF'} 
                  />
                  <Text style={[
                    styles.effectBtnText,
                    selectedEffectIndex === index && styles.effectBtnTextActive,
                  ]}>
                    {effect.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          );
        
        case 'animations':
          return (
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.fontStyleScroller}
              contentContainerStyle={styles.fontStyleContent}
            >
              {TEXT_ANIMATIONS.map((anim, index) => (
                <TouchableOpacity
                  key={anim.id}
                  style={[
                    styles.effectBtn,
                    selectedAnimationIndex === index && styles.effectBtnActive
                  ]}
                  onPress={() => setSelectedAnimationIndex(index)}
                >
                  <Ionicons 
                    name={anim.icon as any} 
                    size={16} 
                    color={selectedAnimationIndex === index ? '#000000' : '#FFFFFF'} 
                  />
                  <Text style={[
                    styles.effectBtnText,
                    selectedAnimationIndex === index && styles.effectBtnTextActive,
                  ]}>
                    {anim.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          );
        
        default:
          return null;
      }
    };

    return (
      <Modal
        visible={textEditorVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={closeTextEditor}
      >
        <KeyboardAvoidingView 
          style={styles.textEditorOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.textEditorContainer}>
              {/* Header - Only Done button on right */}
              <SafeAreaView>
                <View style={styles.textEditorHeader}>
                  <View style={{ width: 60 }} />
                  <TouchableOpacity onPress={addTextOverlay} style={styles.textEditorHeaderBtn}>
                    <Text style={[styles.textEditorHeaderText, styles.textEditorDoneText]}>Done</Text>
                  </TouchableOpacity>
                </View>
              </SafeAreaView>

              {/* Text Input Area - Center of screen with cursor */}
              <View style={styles.textInputContainer}>
                <View style={styles.textInputWrapper}>
                  {/* Cursor indicator when empty */}
                  {!textContent && (
                    <View style={styles.cursorIndicator} />
                  )}
                  {/* Animated Preview Overlay - shows animation effect */}
                  {textContent && TEXT_ANIMATIONS[selectedAnimationIndex].id !== 'none' && (
                    <View style={styles.animatedPreviewOverlay} pointerEvents="none">
                      <AnimatedText
                        content={textContent}
                        style={[
                          styles.textInput,
                          getTextStyle(FONT_STYLES[selectedFontIndex], COLOR_PALETTE[selectedColorIndex], textSize),
                          getEffectStyle(TEXT_EFFECTS[selectedEffectIndex].id, COLOR_PALETTE[selectedColorIndex]),
                          textHasBackground && {
                            backgroundColor: COLOR_PALETTE[selectedColorIndex] === '#FFFFFF' 
                              ? 'rgba(0,0,0,0.7)' 
                              : 'rgba(255,255,255,0.9)',
                            color: COLOR_PALETTE[selectedColorIndex] === '#FFFFFF' ? '#FFFFFF' : '#000000',
                            paddingHorizontal: 16,
                            paddingVertical: 10,
                            borderRadius: 8,
                          },
                          { textAlign: textAlignment }
                        ]}
                        effect={TEXT_EFFECTS[selectedEffectIndex].id}
                        animation={TEXT_ANIMATIONS[selectedAnimationIndex].id}
                        color={COLOR_PALETTE[selectedColorIndex]}
                      />
                    </View>
                  )}
                  <TextInput
                    style={[
                      styles.textInput,
                      getTextStyle(FONT_STYLES[selectedFontIndex], COLOR_PALETTE[selectedColorIndex], textSize),
                      getEffectStyle(TEXT_EFFECTS[selectedEffectIndex].id, COLOR_PALETTE[selectedColorIndex]),
                      textHasBackground && {
                        backgroundColor: COLOR_PALETTE[selectedColorIndex] === '#FFFFFF' 
                          ? 'rgba(0,0,0,0.7)' 
                          : 'rgba(255,255,255,0.9)',
                        color: COLOR_PALETTE[selectedColorIndex] === '#FFFFFF' ? '#FFFFFF' : '#000000',
                        paddingHorizontal: 16,
                        paddingVertical: 10,
                        borderRadius: 8,
                      },
                      { textAlign: textAlignment },
                      // Hide text when showing animated preview
                      textContent && TEXT_ANIMATIONS[selectedAnimationIndex].id !== 'none' && { color: 'transparent' }
                    ]}
                    value={textContent}
                    onChangeText={setTextContent}
                    placeholder=""
                    placeholderTextColor="transparent"
                    multiline
                    autoFocus
                    textAlignVertical="center"
                    selectionColor="#0095F6"
                  />
                </View>
              </View>

              {/* Bottom Controls */}
              <View style={styles.textEditorBottomControls}>
                {/* Dynamic Selector Content */}
                {renderSelectorContent()}

                {/* Tool Bar Row */}
                <View style={styles.textToolbar}>
                  {/* Font Style Button (Aa) */}
                  <TouchableOpacity 
                    style={[styles.textToolBtn, textToolbarMode === 'fonts' && styles.textToolBtnActive]} 
                    onPress={() => setTextToolbarMode('fonts')}
                  >
                    <View style={[styles.textToolBtnInner, textToolbarMode === 'fonts' && styles.textToolBtnInnerActive]}>
                      <Text style={[styles.textToolBtnAa, textToolbarMode === 'fonts' && { color: '#000000' }]}>Aa</Text>
                    </View>
                  </TouchableOpacity>

                  {/* Color Picker Button */}
                  <TouchableOpacity 
                    style={[styles.textToolBtn, textToolbarMode === 'colors' && styles.textToolBtnActive]}
                    onPress={() => setTextToolbarMode(textToolbarMode === 'colors' ? 'fonts' : 'colors')}
                  >
                    <View style={styles.colorPickerBtn}>
                      <LinearGradient
                        colors={['#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#0000FF', '#8B00FF']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.rainbowGradient}
                      />
                    </View>
                  </TouchableOpacity>

                  {/* Text Effects (//A) */}
                  <TouchableOpacity 
                    style={[styles.textToolBtn, textToolbarMode === 'animations' && styles.textToolBtnActive]}
                    onPress={() => setTextToolbarMode(textToolbarMode === 'animations' ? 'fonts' : 'animations')}
                  >
                    <Text style={[styles.textToolBtnText, textToolbarMode === 'animations' && { color: '#000000' }]}>//A</Text>
                  </TouchableOpacity>

                  {/* Animation/Sparkle Effects */}
                  <TouchableOpacity 
                    style={[styles.textToolBtn, textToolbarMode === 'effects' && styles.textToolBtnActive]}
                    onPress={() => setTextToolbarMode(textToolbarMode === 'effects' ? 'fonts' : 'effects')}
                  >
                    <Ionicons 
                      name="sparkles-outline" 
                      size={22} 
                      color={textToolbarMode === 'effects' ? '#000000' : '#FFFFFF'} 
                    />
                  </TouchableOpacity>

                  {/* Alignment */}
                  <TouchableOpacity style={styles.textToolBtn} onPress={cycleAlignment}>
                    <Ionicons 
                      name={textAlignment === 'left' ? 'reorder-two-outline' : textAlignment === 'center' ? 'reorder-three-outline' : 'reorder-two-outline'} 
                      size={22} 
                      color="#FFFFFF" 
                    />
                  </TouchableOpacity>

                  {/* Background Toggle */}
                  <TouchableOpacity 
                    style={[styles.textToolBtn, textHasBackground && styles.textToolBtnActive]} 
                    onPress={() => setTextHasBackground(prev => !prev)}
                  >
                    <View style={[styles.backgroundToggleIcon, textHasBackground && styles.backgroundToggleIconActive]}>
                      <Text style={[styles.backgroundToggleText, textHasBackground && { color: '#000000' }]}>A</Text>
                    </View>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>
    );
  };

  // ========== Sticker Item Press Animation ==========
  const animateStickerPress = useCallback((callback: () => void) => {
    Animated.sequence([
      Animated.timing(stickerItemScale, {
        toValue: 0.9,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.timing(stickerItemScale, {
        toValue: 1,
        duration: 80,
        useNativeDriver: true,
      }),
    ]).start(() => callback());
  }, [stickerItemScale]);

  // ========== Render Sticker Tray (Instagram-style) ==========
  const renderStickerTray = () => {
    return (
      <Modal
        visible={stickerTrayVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={closeStickerTray}
        onDismiss={handleStickerTrayDismiss}
      >
        <View style={styles.stickerOverlay}>
          {/* Tap outside to close - wraps background blur and gradient */}
          <TouchableOpacity 
            style={styles.stickerOverlayDismiss} 
            activeOpacity={1} 
            onPress={closeStickerTray}
          >
            {/* Blurred background */}
            <BlurView
              intensity={50}
              tint="dark"
              style={StyleSheet.absoluteFillObject}
            />
            
            {/* Blue-to-dark gradient overlay (Instagram style) */}
            <LinearGradient
              colors={['rgba(30,40,80,0.7)', 'rgba(20,20,30,0.9)', 'rgba(15,12,10,0.95)']}
              locations={[0, 0.4, 1]}
              style={StyleSheet.absoluteFillObject}
            />
          </TouchableOpacity>
          
          {/* Sticker Panel - Now with swipe gesture */}
          <Animated.View 
            style={[
              styles.stickerTray,
              { transform: [{ translateY: stickerTrayTranslateY }] }
            ]}
            {...stickerTrayPanResponder.panHandlers}
            onLayout={() => stickerTrayTranslateY.setValue(0)}
          >
            {/* Handle */}
            <View style={styles.stickerTrayHandle} />
            
            {/* Search Bar */}
            <View style={styles.stickerSearchContainer}>
              <Ionicons name="search" size={16} color="#98989F" />
              <TextInput
                style={styles.stickerSearchInput}
                placeholder="Search"
                placeholderTextColor="#98989F"
              />
            </View>

            {/* Scrollable Content */}
            <ScrollView 
              style={styles.stickerCategoriesScroll}
              contentContainerStyle={styles.stickerCategoriesContent}
              showsVerticalScrollIndicator={false}
              bounces={true}
            >
              {/* Feature Buttons Section */}
              <View style={styles.featureButtonsGrid}>
                {/* Row 1: Location, Music */}
                <TouchableOpacity style={[styles.featurePill, { transform: [{ rotate: '-4deg' }] }]} onPress={() => handleStickerSelect('location')}>
                  <Ionicons name="location" size={14} color="#A855F7" />
                  <Text style={styles.featurePillText}>Location</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={[styles.featurePill, { transform: [{ rotate: '-6deg' }] }]} onPress={() => {
                  closeStickerTray();
                  setTimeout(() => setMusicPickerVisible(true), 300);
                }}>
                  <Ionicons name="musical-notes" size={14} color="#EC4899" />
                  <Text style={styles.featurePillText}>Music</Text>
                </TouchableOpacity>

                {/* Row 2: Photo, GIF, Add Yours */}
                <TouchableOpacity style={[styles.featurePill, { transform: [{ rotate: '-5deg' }] }]} onPress={() => {
                  console.log('Photo button pressed! Setting pending flag and closing tray...');
                  pendingPhotoPickerOpen.current = true;
                  closeStickerTray();
                }}>
                  <Ionicons name="images-outline" size={14} color="#22C55E" />
                  <Text style={styles.featurePillText}>Photo</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={[styles.featurePill, { transform: [{ rotate: '-7deg' }] }]} onPress={() => handleStickerSelect('gif')}>
                  <Ionicons name="search" size={12} color="#10B981" />
                  <Text style={[styles.featurePillText, { color: '#10B981', fontWeight: '700' }]}>GIF</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={[styles.featurePill, { transform: [{ rotate: '-4deg' }] }]} onPress={() => handleStickerSelect('addyours')}>
                  <Ionicons name="camera-outline" size={14} color="#F97316" />
                  <Text style={styles.featurePillText}>Add Yours</Text>
                </TouchableOpacity>

                {/* Row 3: Frames, Questions, Cutouts */}
                <TouchableOpacity style={[styles.featurePillWithImage, { transform: [{ rotate: '-6deg' }] }]} onPress={() => handleStickerSelect('frames')}>
                  <View style={styles.featurePillImageFrame}>
                    <Ionicons name="image" size={10} color="#FFFFFF" />
                  </View>
                  <Text style={styles.featurePillText}>Frames</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={[styles.featurePill, { transform: [{ rotate: '-5deg' }] }]} onPress={() => handleStickerSelect('questions')}>
                  <Text style={styles.featurePillEmoji}>❓</Text>
                  <Text style={styles.featurePillText}>Questions</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={[styles.featurePill, { transform: [{ rotate: '-7deg' }] }]} onPress={() => handleStickerSelect('cutouts')}>
                  <Ionicons name="cut-outline" size={14} color="#22D3EE" />
                  <Text style={styles.featurePillText}>Cutouts</Text>
                </TouchableOpacity>

                {/* Row 4: Highlight, Avatar */}
                <TouchableOpacity style={[styles.featurePill, { transform: [{ rotate: '-4deg' }] }]} onPress={() => handleStickerSelect('highlight')}>
                  <Ionicons name="heart-outline" size={14} color="#EC4899" />
                  <Text style={styles.featurePillText}>Highlight</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={[styles.featurePillWithImage, { transform: [{ rotate: '-6deg' }] }]} onPress={() => handleStickerSelect('avatar')}>
                  <View style={styles.featurePillImageAvatar}>
                    <Ionicons name="person" size={10} color="#FFFFFF" />
                  </View>
                  <Text style={styles.featurePillText}>Avatar</Text>
                </TouchableOpacity>

                {/* Row 5: Templates, Emoji, Poll */}
                <TouchableOpacity style={[styles.featurePill, { transform: [{ rotate: '-5deg' }] }]} onPress={() => handleStickerSelect('templates')}>
                  <Ionicons name="add-circle-outline" size={14} color="#F97316" />
                  <Text style={styles.featurePillText}>Add Yours Templates</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={[styles.featurePillRound, { transform: [{ rotate: '-3deg' }] }]} onPress={() => handleStickerSelect('emoji')}>
                  <Text style={styles.featurePillEmojiLarge}>😍</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={[styles.featurePill, { transform: [{ rotate: '-7deg' }] }]} onPress={() => handleStickerSelect('poll')}>
                  <Ionicons name="reorder-three" size={14} color="#EF4444" />
                  <Text style={styles.featurePillText}>Poll</Text>
                </TouchableOpacity>

                {/* Row 6: Quiz, Link, Slider, Hashtag */}
                <TouchableOpacity style={[styles.featurePill, { transform: [{ rotate: '-4deg' }] }]} onPress={() => handleStickerSelect('quiz')}>
                  <Ionicons name="checkmark-circle-outline" size={14} color="#22C55E" />
                  <Text style={styles.featurePillText}>Quiz</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={[styles.featurePill, { transform: [{ rotate: '-6deg' }] }]} onPress={() => handleStickerSelect('link')}>
                  <Ionicons name="link" size={14} color="#3B82F6" />
                  <Text style={styles.featurePillText}>Link</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={[styles.featurePillSlider, { transform: [{ rotate: '-5deg' }] }]} onPress={() => handleStickerSelect('slider')}>
                  <Text style={styles.featurePillEmoji}>😍</Text>
                  <View style={styles.sliderLine} />
                </TouchableOpacity>
                
                <TouchableOpacity style={[styles.featurePill, { transform: [{ rotate: '-7deg' }] }]} onPress={() => handleStickerSelect('hashtag')}>
                  <Text style={styles.featurePillTextHashtag}>#hashtag</Text>
                </TouchableOpacity>

                {/* Row 7: Countdown */}
                <TouchableOpacity style={[styles.featurePill, { transform: [{ rotate: '-5deg' }] }]} onPress={() => handleStickerSelect('countdown')}>
                  <Ionicons name="time-outline" size={14} color="#A855F7" />
                  <Text style={styles.featurePillText}>Countdown</Text>
                </TouchableOpacity>
                
              </View>

              {/* Custom Illustrated Stickers Section - Instagram Style */}
              <View style={styles.stickerGridSection}>
                <Text style={styles.stickerSectionTitle}>Stickers</Text>
                
                {/* ROW-BASED GRID: Guaranteed 4 items per row */}
                {(() => {
                  // Constants for grid layout
                  const COLUMNS = 4;
                  const GRID_PADDING = 16; // 16px on each side
                  const ITEM_SPACING = 8; // 8px between items
                  const AVAILABLE_WIDTH = SCREEN_WIDTH - (GRID_PADDING * 2);
                  const ITEM_WIDTH = Math.floor((AVAILABLE_WIDTH - (ITEM_SPACING * (COLUMNS - 1))) / COLUMNS);
                  const STICKER_SIZE = Math.floor(ITEM_WIDTH * 0.75);
                  
                  // Build all items array: Clock first, then all stickers
                  const allItems = [
                    { id: 'clock', type: 'clock' },
                    ...STICKER_COMPONENTS.map(s => ({ id: s.id, type: 'sticker', Component: s.Component }))
                  ];
                  
                  // Chunk into rows of 4
                  const rows: typeof allItems[] = [];
                  for (let i = 0; i < allItems.length; i += COLUMNS) {
                    rows.push(allItems.slice(i, i + COLUMNS));
                  }
                  
                  return rows.map((row, rowIndex) => (
                    <View key={`row-${rowIndex}`} style={styles.stickerRow}>
                      {row.map((item, itemIndex) => {
                        const isLastInRow = itemIndex === COLUMNS - 1;
                        const itemStyle = [
                          styles.stickerGridItem4Col,
                          { width: ITEM_WIDTH },
                          !isLastInRow && { marginRight: ITEM_SPACING }
                        ];
                        
                        if (item.type === 'clock') {
                          return (
                            <TouchableOpacity 
                              key={item.id}
                              style={[itemStyle, { justifyContent: 'center', alignItems: 'center' }]}
                              onPress={() => handleStickerSelect('clock')}
                              activeOpacity={0.8}
                            >
                              <ClockStickerDesign style={7} time={captureTime} size={70} />
                            </TouchableOpacity>
                          );
                        } else {
                          const { Component } = item as { id: string; type: string; Component: React.FC<{ size: number }> };
                          return (
                            <TouchableOpacity 
                              key={item.id}
                              style={itemStyle}
                              onPress={() => handleStickerSelect(item.id)}
                              activeOpacity={0.8}
                            >
                              <Component size={STICKER_SIZE} />
                            </TouchableOpacity>
                          );
                        }
                      })}
                    </View>
                  ));
                })()}
              </View>

              {/* Phone Number Stickers Section */}
              {clinicPhoneNumber ? (
                <View style={styles.stickerGridSection}>
                  <Text style={styles.stickerSectionTitle}>📞 Phone</Text>
                  {(() => {
                    const COLUMNS = 3;
                    const GRID_PADDING = 10;
                    const ITEM_SPACING = 8;
                    const AVAILABLE_WIDTH = SCREEN_WIDTH - (GRID_PADDING * 2);
                    const ITEM_WIDTH = Math.floor((AVAILABLE_WIDTH - (ITEM_SPACING * (COLUMNS - 1))) / COLUMNS);

                    const rows: (typeof PHONE_STICKER_DESIGNS[number])[][] = [];
                    for (let i = 0; i < PHONE_STICKER_DESIGNS.length; i += COLUMNS) {
                      rows.push(PHONE_STICKER_DESIGNS.slice(i, i + COLUMNS) as any);
                    }

                    return rows.map((row, rowIndex) => (
                      <View key={`phone-row-${rowIndex}`} style={[styles.stickerRow, { justifyContent: 'flex-start' }]}>
                        {row.map((item, itemIndex) => {
                          const isLastInRow = itemIndex === COLUMNS - 1;
                          return (
                            <TouchableOpacity
                              key={item.id}
                              style={[
                                styles.stickerGridItem4Col,
                                { width: ITEM_WIDTH, height: 90, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
                                !isLastInRow && { marginRight: ITEM_SPACING },
                              ]}
                              onPress={() => handleStickerSelect(item.id)}
                              activeOpacity={0.8}
                            >
                              <item.Component phoneNumber={clinicPhoneNumber} size={ITEM_WIDTH + 10} />
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    ));
                  })()}
                </View>
              ) : null}
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>
    );
  };

  // ========== Render GIF Picker Modal ==========
  const renderGifPicker = () => {
    return (
      <Modal
        visible={gifPickerVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => { setGifPickerVisible(false); setGifSearchQuery(''); }}
      >
        <View style={styles.stickerOverlay}>
          {/* Tap outside to close */}
          <TouchableOpacity 
            style={styles.stickerOverlayDismiss} 
            activeOpacity={1} 
            onPress={() => { setGifPickerVisible(false); setGifSearchQuery(''); }}
          >
            <BlurView
              intensity={50}
              tint="dark"
              style={StyleSheet.absoluteFillObject}
            />
            <LinearGradient
              colors={['rgba(30,40,80,0.7)', 'rgba(20,20,30,0.9)', 'rgba(15,12,10,0.95)']}
              locations={[0, 0.4, 1]}
              style={StyleSheet.absoluteFillObject}
            />
          </TouchableOpacity>
          
          {/* GIF Picker Panel */}
          <View style={styles.stickerTray}>
            {/* Handle */}
            <View style={styles.stickerTrayHandle} />
            
            {/* Title */}
            <Text style={{ color: '#FFFFFF', fontSize: 17, fontWeight: '700', textAlign: 'center', marginBottom: 12 }}>GIFs</Text>
            
            {/* Search Bar */}
            <View style={styles.stickerSearchContainer}>
              <Ionicons name="search" size={16} color="#98989F" />
              <TextInput
                style={styles.stickerSearchInput}
                placeholder="Search GIPHY…"
                placeholderTextColor="#98989F"
                value={gifSearchQuery}
                onChangeText={setGifSearchQuery}
                returnKeyType="search"
              />
              {gifSearchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setGifSearchQuery('')}>
                  <Ionicons name="close-circle" size={18} color="#98989F" />
                </TouchableOpacity>
              )}
            </View>

            {/* Scrollable content */}
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{ paddingBottom: 40 }}
              showsVerticalScrollIndicator={false}
              bounces={true}
              keyboardShouldPersistTaps="handled"
            >
              {/* Phone Number Stickers */}
              {clinicPhoneNumber ? (
                <View style={{ paddingHorizontal: 10 }}>
                  <Text style={styles.stickerSectionTitle}>📞 Phone Stickers</Text>
                  {(() => {
                    const COLUMNS = 3;
                    const ITEM_SPACING = 8;
                    const CONTAINER_WIDTH = SCREEN_WIDTH - 20;
                    const ITEM_W = Math.floor((CONTAINER_WIDTH - (ITEM_SPACING * (COLUMNS - 1))) / COLUMNS);

                    // Filter featured by clinicType + search-matched extended (label + tags, partial)
                    const q = gifSearchQuery.trim().toLowerCase();
                    const featuredFiltered = (PHONE_STICKER_DESIGNS as unknown as any[]).filter((d: any) =>
                      !d.clinicTypes || !clinicType || d.clinicTypes.includes(clinicType)
                    );
                    const extMatched = q.length > 0
                      ? (PHONE_STICKER_DESIGNS_EXTENDED as unknown as any[]).filter((d: any) =>
                          (!d.clinicTypes || !clinicType || d.clinicTypes.includes(clinicType)) &&
                          (d.label.toLowerCase().includes(q) ||
                          (d.tags && d.tags.some((t: string) => t.toLowerCase().includes(q))))
                        )
                      : [];
                    const allItems = [...featuredFiltered, ...extMatched];

                    const rows: (typeof PHONE_STICKER_DESIGNS[number])[][] = [];
                    for (let i = 0; i < allItems.length; i += COLUMNS) {
                      rows.push(allItems.slice(i, i + COLUMNS) as any);
                    }

                    return rows.map((row, ri) => (
                      <View key={`gp-row-${ri}`} style={[styles.stickerRow, { justifyContent: 'center' }]}>
                        {row.map((item, ci) => (
                          <TouchableOpacity
                            key={item.id}
                            style={[
                              styles.stickerGridItem4Col,
                              { width: ITEM_W, height: 90, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
                              ci < COLUMNS - 1 && { marginRight: ITEM_SPACING },
                            ]}
                            onPress={() => {
                              setGifPickerVisible(false);
                              setGifSearchQuery('');
                              handleStickerSelect(item.id);
                            }}
                            activeOpacity={0.8}
                          >
                            <item.Component phoneNumber={clinicPhoneNumber} size={ITEM_W + 10} />
                          </TouchableOpacity>
                        ))}
                      </View>
                    ));
                  })()}
                </View>
              ) : null}

              {/* Clinic Name Stickers */}
              {clinicName ? (
                <View style={{ paddingHorizontal: 10 }}>
                  <Text style={styles.stickerSectionTitle}>🏷️ Name Stickers</Text>
                  {(() => {
                    const COLUMNS = 3;
                    const ITEM_SPACING = 8;
                    const CONTAINER_WIDTH = SCREEN_WIDTH - 20;
                    const ITEM_W = Math.floor((CONTAINER_WIDTH - (ITEM_SPACING * (COLUMNS - 1))) / COLUMNS);

                    const q = gifSearchQuery.trim().toLowerCase();
                    const featuredFiltered = (CLINIC_NAME_STICKER_DESIGNS as unknown as any[]).filter((d: any) =>
                      !d.clinicTypes || !clinicType || d.clinicTypes.includes(clinicType)
                    );
                    const extMatched = q.length > 0
                      ? (CLINIC_NAME_STICKER_DESIGNS_EXTENDED as unknown as any[]).filter((d: any) =>
                          (!d.clinicTypes || !clinicType || d.clinicTypes.includes(clinicType)) &&
                          (d.label.toLowerCase().includes(q) ||
                          (d.tags && d.tags.some((t: string) => t.toLowerCase().includes(q))))
                        )
                      : [];
                    const allItems = [...featuredFiltered, ...extMatched];

                    const rows: (typeof CLINIC_NAME_STICKER_DESIGNS[number])[][] = [];
                    for (let i = 0; i < allItems.length; i += COLUMNS) {
                      rows.push(allItems.slice(i, i + COLUMNS) as any);
                    }

                    return rows.map((row, ri) => (
                      <View key={`gn-row-${ri}`} style={[styles.stickerRow, { justifyContent: 'center' }]}>
                        {row.map((item, ci) => (
                          <TouchableOpacity
                            key={item.id}
                            style={[
                              styles.stickerGridItem4Col,
                              { width: ITEM_W, height: 90, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
                              ci < COLUMNS - 1 && { marginRight: ITEM_SPACING },
                            ]}
                            onPress={() => {
                              setGifPickerVisible(false);
                              setGifSearchQuery('');
                              handleStickerSelect(item.id);
                            }}
                            activeOpacity={0.8}
                          >
                            <item.Component clinicName={clinicName} size={ITEM_W + 10} />
                          </TouchableOpacity>
                        ))}
                      </View>
                    ));
                  })()}
                </View>
              ) : null}

              {/* Combo Stickers */}
              {clinicName && clinicPhoneNumber ? (
                <View style={{ paddingHorizontal: 10 }}>
                  <Text style={styles.stickerSectionTitle}>✨ Combo Stickers</Text>
                  {(() => {
                    const COLUMNS = 3;
                    const ITEM_SPACING = 8;
                    const CONTAINER_WIDTH = SCREEN_WIDTH - 20;
                    const ITEM_W = Math.floor((CONTAINER_WIDTH - (ITEM_SPACING * (COLUMNS - 1))) / COLUMNS);

                    // Combo stickers: filter by clinicType + match label, tags, clinicName, or clinicPhoneNumber
                    const q = gifSearchQuery.trim().toLowerCase();
                    const featuredFiltered = (COMBO_STICKER_DESIGNS as unknown as any[]).filter((d: any) =>
                      !d.clinicTypes || !clinicType || d.clinicTypes.includes(clinicType)
                    );
                    const comboQueryMatch = q.length > 0 && (
                      clinicName.toLowerCase().includes(q) ||
                      clinicPhoneNumber.toLowerCase().includes(q)
                    );
                    const extMatched = q.length > 0
                      ? (COMBO_STICKER_DESIGNS_EXTENDED as unknown as any[]).filter((d: any) =>
                          (!d.clinicTypes || !clinicType || d.clinicTypes.includes(clinicType)) &&
                          (comboQueryMatch ||
                          d.label.toLowerCase().includes(q) ||
                          (d.tags && d.tags.some((t: string) => t.toLowerCase().includes(q))))
                        )
                      : [];
                    const allItems = [...featuredFiltered, ...extMatched];

                    const rows: (typeof COMBO_STICKER_DESIGNS[number])[][] = [];
                    for (let i = 0; i < allItems.length; i += COLUMNS) {
                      rows.push(allItems.slice(i, i + COLUMNS) as any);
                    }

                    return rows.map((row, ri) => (
                      <View key={`gc-row-${ri}`} style={[styles.stickerRow, { justifyContent: 'center' }]}>
                        {row.map((item, ci) => (
                          <TouchableOpacity
                            key={item.id}
                            style={[
                              styles.stickerGridItem4Col,
                              { width: ITEM_W, height: 100, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
                              ci < COLUMNS - 1 && { marginRight: ITEM_SPACING },
                            ]}
                            onPress={() => {
                              setGifPickerVisible(false);
                              setGifSearchQuery('');
                              handleStickerSelect(item.id);
                            }}
                            activeOpacity={0.8}
                          >
                            <item.Component clinicName={clinicName} clinicPhoneNumber={clinicPhoneNumber} size={ITEM_W + 10} />
                          </TouchableOpacity>
                        ))}
                      </View>
                    ));
                  })()}
                </View>
              ) : null}

              {/* Dental Stickers — only for dental clinics */}
              {clinicType === 'dental' ? (
                <View style={{ paddingHorizontal: 10 }}>
                  <Text style={styles.stickerSectionTitle}>🦷 Dental Stickers</Text>
                  {(() => {
                    const COLUMNS = 3;
                    const ITEM_SPACING = 8;
                    const CONTAINER_WIDTH = SCREEN_WIDTH - 20;
                    const ITEM_W = Math.floor((CONTAINER_WIDTH - (ITEM_SPACING * (COLUMNS - 1))) / COLUMNS);

                    const q = gifSearchQuery.trim().toLowerCase();
                    const extMatched = q.length > 0
                      ? (DENTAL_STICKER_DESIGNS_EXTENDED as unknown as any[]).filter((d: any) =>
                          d.label.toLowerCase().includes(q) ||
                          (d.tags && d.tags.some((t: string) => t.toLowerCase().includes(q)))
                        )
                      : [];
                    const allItems = [...DENTAL_STICKER_DESIGNS, ...extMatched];

                    const rows: (typeof DENTAL_STICKER_DESIGNS[number])[][] = [];
                    for (let i = 0; i < allItems.length; i += COLUMNS) {
                      rows.push(allItems.slice(i, i + COLUMNS) as any);
                    }

                    return rows.map((row, ri) => (
                      <View key={`gd-row-${ri}`} style={[styles.stickerRow, { justifyContent: 'center' }]}>
                        {row.map((item, ci) => (
                          <TouchableOpacity
                            key={item.id}
                            style={[
                              styles.stickerGridItem4Col,
                              { width: ITEM_W, height: 90, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
                              ci < COLUMNS - 1 && { marginRight: ITEM_SPACING },
                            ]}
                            onPress={() => {
                              setGifPickerVisible(false);
                              setGifSearchQuery('');
                              handleStickerSelect(item.id);
                            }}
                            activeOpacity={0.8}
                          >
                            <item.Component size={ITEM_W + 10} />
                          </TouchableOpacity>
                        ))}
                      </View>
                    ));
                  })()}
                </View>
              ) : null}

              {/* Laser Stickers — only for laser clinics */}
              {clinicType === 'laser' ? (
                <View style={{ paddingHorizontal: 10 }}>
                  <Text style={styles.stickerSectionTitle}>✨ Laser Stickers</Text>
                  {(() => {
                    const COLUMNS = 3;
                    const ITEM_SPACING = 8;
                    const CONTAINER_WIDTH = SCREEN_WIDTH - 20;
                    const ITEM_W = Math.floor((CONTAINER_WIDTH - (ITEM_SPACING * (COLUMNS - 1))) / COLUMNS);

                    const q = gifSearchQuery.trim().toLowerCase();
                    const extMatched = q.length > 0
                      ? (LASER_STICKER_DESIGNS_EXTENDED as unknown as any[]).filter((d: any) =>
                          d.label.toLowerCase().includes(q) ||
                          (d.tags && d.tags.some((t: string) => t.toLowerCase().includes(q)))
                        )
                      : [];
                    const allItems = [...LASER_STICKER_DESIGNS, ...extMatched];

                    const rows: (typeof LASER_STICKER_DESIGNS[number])[][] = [];
                    for (let i = 0; i < allItems.length; i += COLUMNS) {
                      rows.push(allItems.slice(i, i + COLUMNS) as any);
                    }

                    return rows.map((row, ri) => (
                      <View key={`gl-row-${ri}`} style={[styles.stickerRow, { justifyContent: 'center' }]}>
                        {row.map((item, ci) => (
                          <TouchableOpacity
                            key={item.id}
                            style={[
                              styles.stickerGridItem4Col,
                              { width: ITEM_W, height: 90, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
                              ci < COLUMNS - 1 && { marginRight: ITEM_SPACING },
                            ]}
                            onPress={() => {
                              setGifPickerVisible(false);
                              setGifSearchQuery('');
                              handleStickerSelect(item.id);
                            }}
                            activeOpacity={0.8}
                          >
                            <item.Component size={ITEM_W + 10} />
                          </TouchableOpacity>
                        ))}
                      </View>
                    ));
                  })()}
                </View>
              ) : null}

              {/* Beauty Stickers — only for beauty/aesthetic clinics */}
              {clinicType === 'beauty' ? (
                <View style={{ paddingHorizontal: 10 }}>
                  <Text style={styles.stickerSectionTitle}>💎 Beauty Stickers</Text>
                  {(() => {
                    const COLUMNS = 3;
                    const ITEM_SPACING = 8;
                    const CONTAINER_WIDTH = SCREEN_WIDTH - 20;
                    const ITEM_W = Math.floor((CONTAINER_WIDTH - (ITEM_SPACING * (COLUMNS - 1))) / COLUMNS);

                    const q = gifSearchQuery.trim().toLowerCase();
                    const extMatched = q.length > 0
                      ? (BEAUTY_STICKER_DESIGNS_EXTENDED as unknown as any[]).filter((d: any) =>
                          d.label.toLowerCase().includes(q) ||
                          (d.tags && d.tags.some((t: string) => t.toLowerCase().includes(q)))
                        )
                      : [];
                    const allItems = [...BEAUTY_STICKER_DESIGNS, ...extMatched];

                    const rows: (typeof BEAUTY_STICKER_DESIGNS[number])[][] = [];
                    for (let i = 0; i < allItems.length; i += COLUMNS) {
                      rows.push(allItems.slice(i, i + COLUMNS) as any);
                    }

                    return rows.map((row, ri) => (
                      <View key={`gb-row-${ri}`} style={[styles.stickerRow, { justifyContent: 'center' }]}>
                        {row.map((item, ci) => (
                          <TouchableOpacity
                            key={item.id}
                            style={[
                              styles.stickerGridItem4Col,
                              { width: ITEM_W, height: 90, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
                              ci < COLUMNS - 1 && { marginRight: ITEM_SPACING },
                            ]}
                            onPress={() => {
                              setGifPickerVisible(false);
                              setGifSearchQuery('');
                              handleStickerSelect(item.id);
                            }}
                            activeOpacity={0.8}
                          >
                            <item.Component size={ITEM_W + 10} />
                          </TouchableOpacity>
                        ))}
                      </View>
                    ));
                  })()}
                </View>
              ) : null}
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  // ========== Render AI Label Modal (Instagram-style bottom sheet) ==========
  const renderAiLabelModal = () => (
    <Modal
      visible={aiLabelModalVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setAiLabelModalVisible(false)}
    >
      <TouchableOpacity 
        style={styles.aiLabelOverlay} 
        activeOpacity={1} 
        onPress={() => setAiLabelModalVisible(false)}
      >
        <View style={styles.aiLabelSheet}>
          <View style={styles.aiLabelSheetHandle} />
          <Text style={styles.aiLabelSheetTitle}>AI label</Text>
          
          <View style={styles.aiLabelSheetContent}>
            <View style={styles.aiLabelSheetRow}>
              <View style={styles.aiLabelSheetRowText}>
                <Text style={styles.aiLabelSheetRowTitle}>Add AI Label</Text>
                <Text style={styles.aiLabelSheetRowDesc}>
                  We require you to label certain realistic content that's made with AI.{' '}
                  <Text style={styles.aiLabelLink}>Learn more</Text>
                </Text>
              </View>
              <Switch
                value={aiLabelEnabled}
                onValueChange={setAiLabelEnabled}
                trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  // ========== Render Location Sticker Sheet ==========
  const renderLocationStickerSheet = () => {
    if (!locationStickerSheetVisible) return null;

    // Different style previews for the same clinic sticker
    const stickerStyles = [
      { id: 'normal', rotation: 0, label: 'Classic' },
      { id: 'tilted', rotation: -8, label: 'Tilted' },
      { id: 'bold', rotation: 4, label: 'Bold' },
      { id: 'glow', rotation: -3, label: 'Glow' },
    ];

    return (
      <Modal
        visible={locationStickerSheetVisible}
        transparent
        animationType="none"
        statusBarTranslucent
        onRequestClose={closeLocationStickerSheet}
      >
        {/* Transparent backdrop - tap to close */}
        <TouchableOpacity
          style={styles.locationSheetBackdrop}
          activeOpacity={1}
          onPress={closeLocationStickerSheet}
        >
          {/* Bottom sheet */}
          <Animated.View
            style={[
              styles.locationSheetContainer,
              { transform: [{ translateY: locationSheetTranslateY }] },
            ]}
            {...locationSheetPanResponder.panHandlers}
          >
            <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
              {/* Handle bar */}
              <View style={styles.locationSheetHandle}>
                <View style={styles.locationSheetHandleBar} />
              </View>

              {/* Title */}
              <Text style={styles.locationSheetTitle}>Location Sticker</Text>
              <Text style={styles.locationSheetSubtitle}>Tap a style to add</Text>

              {/* Sticker style options */}
              <View style={styles.locationStickerGrid}>
                {stickerStyles.map((style) => (
                  <TouchableOpacity
                    key={style.id}
                    style={styles.locationStickerOption}
                    onPress={() => handleLocationStickerSelect(style.id)}
                    activeOpacity={0.8}
                  >
                    <View style={[
                      styles.locationStickerPreviewContainer,
                      style.id === 'glow' && styles.locationStickerGlowEffect,
                    ]}>
                      <LinearGradient
                        colors={['#833AB4', '#E91E63', '#F77737']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={[
                          styles.locationStickerPreview,
                          { transform: [{ rotate: `${style.rotation}deg` }] },
                          style.id === 'bold' && styles.locationStickerPreviewBold,
                        ]}
                      >
                        <Text style={[
                          styles.locationStickerPreviewName,
                          style.id === 'bold' && styles.locationStickerPreviewNameBold,
                        ]}>
                          {clinicName}
                        </Text>
                        <Text style={styles.locationStickerPreviewCity}>
                          {clinicCity}
                        </Text>
                      </LinearGradient>
                    </View>
                    <Text style={styles.locationStickerStyleLabel}>{style.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Info text */}
              <Text style={styles.locationSheetInfo}>
                Your clinic location will be added to the story
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      </Modal>
    );
  };

  // ========== Render Music Picker ==========
  const renderMusicPicker = () => {
    const tabs = [
      { id: 'foryou' as const, label: 'For You' },
      { id: 'trending' as const, label: 'Trending' },
      { id: 'original' as const, label: 'Original Audio' },
      { id: 'saved' as const, label: 'Saved' },
    ];

    const getTracksForTab = () => {
      switch (selectedMusicTab) {
        case 'foryou': return MUSIC_TRACKS;
        case 'trending': return TRENDING_TRACKS;
        case 'original': return ORIGINAL_AUDIO;
        case 'saved': return SAVED_TRACKS;
        default: return MUSIC_TRACKS;
      }
    };

    const filteredTracks = getTracksForTab().filter(track => 
      musicSearchQuery === '' || 
      track.title.toLowerCase().includes(musicSearchQuery.toLowerCase()) ||
      track.artist.toLowerCase().includes(musicSearchQuery.toLowerCase())
    );

    return (
      <Modal
        visible={musicPickerVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={closeMusicPicker}
      >
        {/* Background overlay - tap to close */}
        <TouchableOpacity 
          style={styles.musicPickerOverlay}
          activeOpacity={1}
          onPress={closeMusicPicker}
        >
          <BlurView
            intensity={30}
            tint="dark"
            style={StyleSheet.absoluteFillObject}
          />
        </TouchableOpacity>

        {/* Bottom Sheet - Now with animated swipe */}
        <Animated.View 
          style={[
            styles.musicPickerSheet, 
            { transform: [{ translateY: musicPickerTranslateY }] }
          ]} 
          {...musicPickerPanResponder.panHandlers}
          onLayout={() => musicPickerTranslateY.setValue(0)}
        >
          {/* Handle bar for swipe indication */}
          <View style={styles.musicPickerHandle} />

          {/* Header */}
          <View style={styles.musicPickerHeader}>
            <View style={{ width: 40 }} />
            <Text style={styles.musicPickerTitle}>Add Music</Text>
            <TouchableOpacity onPress={closeMusicPicker} style={styles.musicPickerCloseButton}>
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <View style={styles.musicSearchContainer}>
            <Ionicons name="search" size={18} color="#8E8E93" />
            <TextInput
              style={styles.musicSearchInput}
              placeholder="Search songs or artists"
              placeholderTextColor="#8E8E93"
              value={musicSearchQuery}
              onChangeText={setMusicSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {musicSearchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setMusicSearchQuery('')}>
                <Ionicons name="close-circle" size={18} color="#8E8E93" />
              </TouchableOpacity>
            )}
          </View>

          {/* Tabs */}
          <View style={styles.musicTabsContainer}>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.musicTabsContent}
            >
              {tabs.map((tab) => (
                <TouchableOpacity
                  key={tab.id}
                  style={[
                    styles.musicTab,
                    selectedMusicTab === tab.id && styles.musicTabActive
                  ]}
                  onPress={() => setSelectedMusicTab(tab.id)}
                >
                  <Text style={[
                    styles.musicTabText,
                    selectedMusicTab === tab.id && styles.musicTabTextActive
                  ]}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Selected Track Preview (if any) */}
          {selectedTrack && (
            <View style={styles.selectedTrackBanner}>
              <View style={styles.selectedTrackInfo}>
                <Text style={styles.selectedTrackThumb}>{selectedTrack.thumbnail}</Text>
                <View style={styles.selectedTrackDetails}>
                  <Text style={styles.selectedTrackTitle} numberOfLines={1}>{selectedTrack.title}</Text>
                  <Text style={styles.selectedTrackArtist} numberOfLines={1}>{selectedTrack.artist}</Text>
                </View>
              </View>
              <TouchableOpacity 
                style={styles.selectedTrackRemove}
                onPress={() => setSelectedTrack(null)}
              >
                <Ionicons name="close" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          )}

          {/* Track List or Empty State */}
          <ScrollView 
            style={styles.musicTrackList}
            showsVerticalScrollIndicator={false}
          >
            {filteredTracks.length > 0 ? (
              filteredTracks.map((track) => (
                <TouchableOpacity
                  key={track.id}
                  style={[
                    styles.musicTrackItem,
                    selectedTrack?.id === track.id && styles.musicTrackItemSelected
                  ]}
                  onPress={() => handleTrackSelect(track)}
                  activeOpacity={0.7}
                >
                  {/* Thumbnail */}
                  <View style={styles.musicTrackThumbnail}>
                    <Text style={styles.musicTrackThumbEmoji}>{track.thumbnail}</Text>
                  </View>

                  {/* Track Info */}
                  <View style={styles.musicTrackInfo}>
                    <Text style={styles.musicTrackTitle} numberOfLines={1}>{track.title}</Text>
                    <Text style={styles.musicTrackArtist} numberOfLines={1}>{track.artist}</Text>
                    <Text style={styles.musicTrackStats}>{track.reelCount} reels</Text>
                  </View>

                  {/* Duration */}
                  <Text style={styles.musicTrackDuration}>{track.duration}</Text>
                </TouchableOpacity>
              ))
            ) : (
              /* Empty State - No tracks available */
              <View style={styles.musicEmptyState}>
                <View style={styles.musicEmptyIcon}>
                  <Ionicons name="musical-notes" size={48} color="#3A3A3C" />
                </View>
                <Text style={styles.musicEmptyTitle}>Coming Soon</Text>
                <Text style={styles.musicEmptySubtitle}>
                  Licensed music tracks will be{"\n"}available in a future update
                </Text>
                <View style={styles.musicEmptyBadge}>
                  <Ionicons name="shield-checkmark" size={14} color="#34C759" />
                  <Text style={styles.musicEmptyBadgeText}>Licensed & Legal</Text>
                </View>
              </View>
            )}

            {/* Bottom padding */}
            <View style={{ height: 40 }} />
          </ScrollView>

          {/* In-App Only Notice */}
          <View style={styles.musicNotice}>
            <Ionicons name="information-circle-outline" size={16} color="#8E8E93" />
            <Text style={styles.musicNoticeText}>Music is for in-app preview only</Text>
          </View>
        </Animated.View>
      </Modal>
    );
  };

  // ========== Render More Menu ==========
  const renderMoreMenu = () => (
    <Modal
      visible={moreMenuVisible}
      animationType="fade"
      transparent={true}
      onRequestClose={() => setMoreMenuVisible(false)}
    >
      <TouchableOpacity 
        style={styles.moreMenuOverlay} 
        activeOpacity={1} 
        onPress={() => setMoreMenuVisible(false)}
      >
        <View style={styles.moreMenuContainer}>
          {/* AI Label Toggle */}
          <TouchableOpacity 
            style={styles.moreMenuItem}
            onPress={() => {
              setMoreMenuVisible(false);
              setAiLabelModalVisible(true);
            }}
          >
            <View style={styles.moreMenuItemLeft}>
              <MaterialCommunityIcons name="image-filter-frames" size={22} color="#FFFFFF" />
              <Text style={styles.moreMenuItemText}>Label AI</Text>
            </View>
          </TouchableOpacity>

          {/* Comments Toggle */}
          <TouchableOpacity style={styles.moreMenuItem} onPress={() => setCommentsEnabled(prev => !prev)}>
            <View style={styles.moreMenuItemLeft}>
              <Ionicons name={commentsEnabled ? "chatbubble-outline" : "chatbubble"} size={22} color="#FFFFFF" />
              <Text style={styles.moreMenuItemText}>Turn off commenting</Text>
            </View>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Instagram-style Background - black base with soft white glow at edges */}
      <View style={styles.backgroundGradient}>
        {/* Top soft glow */}
        <LinearGradient
          colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.03)', 'transparent']}
          locations={[0, 0.3, 1]}
          style={styles.backgroundGlowTop}
        />
        {/* Bottom soft glow */}
        <LinearGradient
          colors={['transparent', 'rgba(255,255,255,0.03)', 'rgba(255,255,255,0.06)']}
          locations={[0, 0.7, 1]}
          style={styles.backgroundGlowBottom}
        />
      </View>
      
      {/* Media Preview with Gesture Support */}
      {(params.uri || backgroundImageUri) && (
        <Animated.View
          {...mediaPanResponder.panHandlers}
          style={[
            styles.mediaContainer,
            {
              transform: [
                { translateX: mediaTranslateX },
                { translateY: mediaTranslateY },
                { scale: mediaScale },
                { rotate: mediaRotation.interpolate({
                    inputRange: [-360, 360],
                    outputRange: ['-360deg', '360deg'],
                  })
                },
              ],
            },
          ]}
        >
          <ExpoImage
            source={{ uri: backgroundImageUri || params.uri }}
            style={styles.mediaPreview}
            contentFit="cover"
          />
        </Animated.View>
      )}

      {/* Overlay gradient for visibility - pointerEvents none to allow gestures through */}
      <LinearGradient
        colors={['rgba(0,0,0,0.4)', 'transparent', 'transparent', 'rgba(0,0,0,0.4)']}
        style={styles.gradientOverlay}
        pointerEvents="none"
      />

      {/* Draggable Text Overlays */}
      {textOverlays.map(overlay => (
        <DraggableTextOverlay
          key={overlay.id}
          overlay={overlay}
          onEdit={openTextEditor}
          onTransformUpdate={updateTextOverlayTransform}
          getTextStyle={getTextStyle}
          onDragStateChange={handlePhoneStickerDragState}
        />
      ))}

      {/* Location Sticker */}
      {locationSticker && locationSticker.visible && (
        <DraggableClinicSticker
          sticker={locationSticker}
          onTransformUpdate={updateLocationStickerTransform}
          onDragStateChange={handlePhoneStickerDragState}
        />
      )}

      {/* Clock Sticker */}
      {clockSticker && clockSticker.visible && (
        <DraggableClockSticker
          sticker={clockSticker}
          onTransformUpdate={updateClockStickerTransform}
          onTap={cycleClockDesign}
          onDragStateChange={handlePhoneStickerDragState}
        />
      )}

      {/* Photo Stickers */}
      {photoStickers.map(sticker => (
        <DraggablePhotoSticker
          key={sticker.id}
          sticker={sticker}
          onTransformUpdate={updatePhotoStickerTransform}
          onRemove={removePhotoSticker}
          onDragStateChange={handlePhoneStickerDragState}
        />
      ))}

      {/* Phone Stickers */}
      {phoneStickersOnCanvas.map(sticker => (
        <DraggablePhoneSticker
          key={sticker.id}
          sticker={sticker}
          onTransformUpdate={updatePhoneStickerTransform}
          onRemove={removePhoneStickerFromCanvas}
          onDragStateChange={handlePhoneStickerDragState}
          onLongPress={handlePhoneStickerLongPress}
          isSettingsOpen={phoneStickerSettingsId === sticker.id}
          onToggleCallable={togglePhoneStickerCallable}
        />
      ))}

      {/* Phone Sticker Settings Panel — fixed left-center of screen */}
      {phoneStickerSettingsId && (() => {
        const activeSticker = phoneStickersOnCanvas.find(s => s.id === phoneStickerSettingsId);
        if (!activeSticker) return null;
        return (
          <View style={{
            position: 'absolute',
            left: 16,
            top: SCREEN_HEIGHT / 2 - 70,
            width: 56,
            backgroundColor: 'rgba(15, 23, 42, 0.92)',
            borderRadius: 18,
            paddingVertical: 10,
            paddingHorizontal: 6,
            alignItems: 'center',
            zIndex: 30,
            elevation: 30,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.35,
            shadowRadius: 10,
          }}>
            {/* Unlock button */}
            <TouchableOpacity
              onPress={() => {
                setPhoneStickersOnCanvas(prev => prev.map(s =>
                  s.id === phoneStickerSettingsId ? { ...s, isCallable: true } : s
                ));
              }}
              activeOpacity={0.7}
              style={{
                width: 42,
                height: 42,
                borderRadius: 14,
                backgroundColor: activeSticker.isCallable ? 'rgba(34,197,94,0.25)' : 'rgba(255,255,255,0.06)',
                justifyContent: 'center',
                alignItems: 'center',
                borderWidth: 1.5,
                borderColor: activeSticker.isCallable ? '#22C55E' : 'transparent',
                marginBottom: 8,
              }}
            >
              <Ionicons name="lock-open" size={20} color={activeSticker.isCallable ? '#22C55E' : '#64748B'} />
            </TouchableOpacity>

            {/* Lock button */}
            <TouchableOpacity
              onPress={() => {
                setPhoneStickersOnCanvas(prev => prev.map(s =>
                  s.id === phoneStickerSettingsId ? { ...s, isCallable: false } : s
                ));
              }}
              activeOpacity={0.7}
              style={{
                width: 42,
                height: 42,
                borderRadius: 14,
                backgroundColor: !activeSticker.isCallable ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.06)',
                justifyContent: 'center',
                alignItems: 'center',
                borderWidth: 1.5,
                borderColor: !activeSticker.isCallable ? '#EF4444' : 'transparent',
              }}
            >
              <Ionicons name="lock-closed" size={20} color={!activeSticker.isCallable ? '#EF4444' : '#64748B'} />
            </TouchableOpacity>
          </View>
        );
      })()}

      {/* Clinic Name Stickers */}
      {clinicNameStickersOnCanvas.map(sticker => (
        <DraggableClinicNameSticker
          key={sticker.id}
          sticker={sticker}
          onTransformUpdate={updateClinicNameStickerTransform}
          onRemove={removeClinicNameStickerFromCanvas}
          onDragStateChange={handlePhoneStickerDragState}
          onLongPress={handleClinicNameStickerLongPress}
          isSettingsOpen={clinicNameStickerSettingsId === sticker.id}
          onToggleNavigable={toggleClinicNameStickerNavigable}
          clinicId={clinicId}
        />
      ))}

      {/* Clinic Name Sticker Settings Panel — fixed left-center of screen */}
      {clinicNameStickerSettingsId && (() => {
        const activeSticker = clinicNameStickersOnCanvas.find(s => s.id === clinicNameStickerSettingsId);
        if (!activeSticker) return null;
        return (
          <View style={{
            position: 'absolute',
            left: 16,
            top: SCREEN_HEIGHT / 2 - 70,
            width: 56,
            backgroundColor: 'rgba(15, 23, 42, 0.92)',
            borderRadius: 18,
            paddingVertical: 10,
            paddingHorizontal: 6,
            alignItems: 'center',
            zIndex: 30,
            elevation: 30,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.35,
            shadowRadius: 10,
          }}>
            {/* Unlock button (navigable) */}
            <TouchableOpacity
              onPress={() => {
                setClinicNameStickersOnCanvas(prev => prev.map(s =>
                  s.id === clinicNameStickerSettingsId ? { ...s, isNavigable: true } : s
                ));
              }}
              activeOpacity={0.7}
              style={{
                width: 42,
                height: 42,
                borderRadius: 14,
                backgroundColor: activeSticker.isNavigable ? 'rgba(34,197,94,0.25)' : 'rgba(255,255,255,0.06)',
                justifyContent: 'center',
                alignItems: 'center',
                borderWidth: 1.5,
                borderColor: activeSticker.isNavigable ? '#22C55E' : 'transparent',
                marginBottom: 8,
              }}
            >
              <Ionicons name="lock-open" size={20} color={activeSticker.isNavigable ? '#22C55E' : '#64748B'} />
            </TouchableOpacity>

            {/* Lock button (static) */}
            <TouchableOpacity
              onPress={() => {
                setClinicNameStickersOnCanvas(prev => prev.map(s =>
                  s.id === clinicNameStickerSettingsId ? { ...s, isNavigable: false } : s
                ));
              }}
              activeOpacity={0.7}
              style={{
                width: 42,
                height: 42,
                borderRadius: 14,
                backgroundColor: !activeSticker.isNavigable ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.06)',
                justifyContent: 'center',
                alignItems: 'center',
                borderWidth: 1.5,
                borderColor: !activeSticker.isNavigable ? '#EF4444' : 'transparent',
              }}
            >
              <Ionicons name="lock-closed" size={20} color={!activeSticker.isNavigable ? '#EF4444' : '#64748B'} />
            </TouchableOpacity>
          </View>
        );
      })()}

      {/* Combo Stickers */}
      {comboStickersOnCanvas.map(sticker => (
        <DraggableComboSticker
          key={sticker.id}
          sticker={sticker}
          onTransformUpdate={updateComboStickerTransform}
          onRemove={removeComboStickerFromCanvas}
          onDragStateChange={handlePhoneStickerDragState}
          onLongPress={handleComboStickerLongPress}
          isSettingsOpen={comboStickerSettingsId === sticker.id}
          onToggleInteractive={toggleComboStickerInteractive}
          clinicId={clinicId}
        />
      ))}

      {/* Combo Sticker Settings Panel — fixed left-center of screen */}
      {comboStickerSettingsId && (() => {
        const activeSticker = comboStickersOnCanvas.find(s => s.id === comboStickerSettingsId);
        if (!activeSticker) return null;
        return (
          <View style={{
            position: 'absolute',
            left: 16,
            top: SCREEN_HEIGHT / 2 + 50,
            width: 56,
            backgroundColor: 'rgba(15, 23, 42, 0.92)',
            borderRadius: 18,
            paddingVertical: 10,
            paddingHorizontal: 6,
            alignItems: 'center',
            zIndex: 30,
            elevation: 30,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.35,
            shadowRadius: 10,
          }}>
            {/* Unlock button (interactive) */}
            <TouchableOpacity
              onPress={() => {
                setComboStickersOnCanvas(prev => prev.map(s =>
                  s.id === comboStickerSettingsId ? { ...s, isInteractive: true } : s
                ));
              }}
              activeOpacity={0.7}
              style={{
                width: 42,
                height: 42,
                borderRadius: 14,
                backgroundColor: activeSticker.isInteractive ? 'rgba(34,197,94,0.25)' : 'rgba(255,255,255,0.06)',
                justifyContent: 'center',
                alignItems: 'center',
                borderWidth: 1.5,
                borderColor: activeSticker.isInteractive ? '#22C55E' : 'transparent',
                marginBottom: 8,
              }}
            >
              <Ionicons name="lock-open" size={20} color={activeSticker.isInteractive ? '#22C55E' : '#64748B'} />
            </TouchableOpacity>

            {/* Lock button (static) */}
            <TouchableOpacity
              onPress={() => {
                setComboStickersOnCanvas(prev => prev.map(s =>
                  s.id === comboStickerSettingsId ? { ...s, isInteractive: false } : s
                ));
              }}
              activeOpacity={0.7}
              style={{
                width: 42,
                height: 42,
                borderRadius: 14,
                backgroundColor: !activeSticker.isInteractive ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.06)',
                justifyContent: 'center',
                alignItems: 'center',
                borderWidth: 1.5,
                borderColor: !activeSticker.isInteractive ? '#EF4444' : 'transparent',
              }}
            >
              <Ionicons name="lock-closed" size={20} color={!activeSticker.isInteractive ? '#EF4444' : '#64748B'} />
            </TouchableOpacity>
          </View>
        );
      })()}

      {/* Dental Stickers */}
      {dentalStickersOnCanvas.map(sticker => (
        <DraggableDentalSticker
          key={sticker.id}
          sticker={sticker}
          onTransformUpdate={updateDentalStickerTransform}
          onRemove={removeDentalStickerFromCanvas}
          onDragStateChange={handlePhoneStickerDragState}
        />
      ))}

      {/* Laser Stickers */}
      {laserStickersOnCanvas.map(sticker => (
        <DraggableLaserSticker
          key={sticker.id}
          sticker={sticker}
          onTransformUpdate={updateLaserStickerTransform}
          onRemove={removeLaserStickerFromCanvas}
          onDragStateChange={handlePhoneStickerDragState}
        />
      ))}

      {/* Beauty Stickers */}
      {beautyStickersOnCanvas.map(sticker => (
        <DraggableBeautySticker
          key={sticker.id}
          sticker={sticker}
          onTransformUpdate={updateBeautyStickerTransform}
          onRemove={removeBeautyStickerFromCanvas}
          onDragStateChange={handlePhoneStickerDragState}
        />
      ))}

      {/* Trash Zone — visible while dragging a phone sticker */}
      {isDraggingStickerToTrash && (
        <View style={{
          position: 'absolute',
          bottom: 40,
          alignSelf: 'center',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 25,
          elevation: 25,
        }} pointerEvents="none">
          <Animated.View style={{
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: isHoveringTrash ? 'rgba(239,68,68,0.85)' : 'rgba(255,255,255,0.18)',
            justifyContent: 'center',
            alignItems: 'center',
            borderWidth: 2,
            borderColor: isHoveringTrash ? '#EF4444' : 'rgba(255,255,255,0.4)',
            transform: [{ scale: trashScaleAnim }],
          }}>
            <Ionicons name="trash" size={24} color={isHoveringTrash ? '#FFFFFF' : 'rgba(255,255,255,0.7)'} />
          </Animated.View>
          <Text style={{
            color: isHoveringTrash ? '#EF4444' : 'rgba(255,255,255,0.5)',
            fontSize: 11,
            fontWeight: '600',
            marginTop: 6,
          }}>
            {isHoveringTrash ? 'Release to delete' : 'Drag here to delete'}
          </Text>
        </View>
      )}

      {/* ========== Top Controls (always visible) ========== */}
      <SafeAreaView style={styles.topControlsBar} pointerEvents="box-none">
        <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
          <Ionicons name="close" size={28} color="#FFFFFF" />
        </TouchableOpacity>

        {activeMode === 'draw' && (
          <View style={styles.drawControls}>
            <TouchableOpacity style={styles.topButton}>
              <Ionicons name="arrow-undo" size={22} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.topButton}>
              <Ionicons name="arrow-redo" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>

      {/* ========== Drag Guide: Clinic Name + Dashed Line (only while dragging) ========== */}
      {isDraggingStickerToTrash && (
        <Animated.View
          style={[
            styles.dragGuideContainer,
            { transform: [{ translateX: boundaryShakeAnim }] },
          ]}
          pointerEvents="none"
        >
          <Text
            style={[
              styles.dragGuideClinicName,
              isStickerAboveBoundary && { color: 'rgba(239, 68, 68, 0.9)' },
            ]}
            numberOfLines={1}
          >
            {clinicName}
          </Text>
          <Animated.View
            style={[
              styles.dragGuideDashedLine,
              isStickerAboveBoundary && {
                borderBottomColor: 'rgba(239, 68, 68, 0.85)',
                borderBottomWidth: 2.5,
              },
            ]}
          />
          {isStickerAboveBoundary && (
            <Text style={styles.dragGuideWarningText}>
              Too high — move down
            </Text>
          )}
        </Animated.View>
      )}

      {/* Right Side Tool Stack - Only show when media is selected */}
      {hasMedia && (
        <Animated.View style={[styles.rightToolStack, { opacity: toolbarAnim }]}>
          {/* === Primary Tools (Always Visible) === */}
          
          {/* Text Tool */}
          <View style={styles.toolRow}>
            {toolsExpanded && <Text style={styles.toolLabel}>Text</Text>}
            <TouchableOpacity 
              style={[styles.toolButton, activeMode === 'text' && styles.toolButtonActive]} 
              onPress={() => openTextEditor()}
            >
              <Text style={styles.toolButtonTextIcon}>Aa</Text>
            </TouchableOpacity>
          </View>

          {/* Stickers */}
          <View style={styles.toolRow}>
            {toolsExpanded && <Text style={styles.toolLabel}>Stickers</Text>}
            <TouchableOpacity 
              style={[styles.toolButton, activeMode === 'stickers' && styles.toolButtonActive]} 
              onPress={openStickerTray}
            >
              <Ionicons name="happy-outline" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Audio */}
          <View style={styles.toolRow}>
            {toolsExpanded && <Text style={styles.toolLabel}>Audio</Text>}
            <TouchableOpacity style={styles.toolButton} onPress={handleAudioPress}>
              <Ionicons name="musical-notes-outline" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Expand Button (when collapsed) */}
          {!toolsExpanded && (
            <TouchableOpacity 
              style={styles.toolExpandButton} 
              onPress={() => setToolsExpanded(true)}
            >
              <Ionicons name="chevron-down" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          )}

          {/* === Extended Tools (Only when expanded) === */}
          {toolsExpanded && (
            <>
              {/* Partnerships */}
              <View style={styles.toolRow}>
                <Text style={styles.toolLabel}>Collab</Text>
                <TouchableOpacity style={styles.toolButton} onPress={() => {}}>
                  <Ionicons name="people-outline" size={22} color="#FFFFFF" />
                </TouchableOpacity>
              </View>

              {/* Effects */}
              <View style={styles.toolRow}>
                <Text style={styles.toolLabel}>Effects</Text>
                <TouchableOpacity style={styles.toolButton} onPress={() => {}}>
                  <Ionicons name="sparkles-outline" size={22} color="#FFFFFF" />
                </TouchableOpacity>
              </View>

              {/* Draw */}
              <View style={styles.toolRow}>
                <Text style={styles.toolLabel}>Draw</Text>
                <TouchableOpacity 
                  style={[styles.toolButton, activeMode === 'draw' && styles.toolButtonActive]} 
                  onPress={toggleDrawMode}
                >
                  <MaterialCommunityIcons name="draw" size={22} color="#FFFFFF" />
                </TouchableOpacity>
              </View>

              {/* Save/Download */}
              <View style={styles.toolRow}>
                <Text style={styles.toolLabel}>Save</Text>
                <TouchableOpacity style={styles.toolButton} onPress={handleDownload}>
                  <Ionicons name="download-outline" size={22} color="#FFFFFF" />
                </TouchableOpacity>
              </View>

              {/* More */}
              <View style={styles.toolRow}>
                <Text style={styles.toolLabel}>More</Text>
                <TouchableOpacity style={styles.toolButton} onPress={() => setMoreMenuVisible(true)}>
                  <Ionicons name="ellipsis-horizontal" size={22} color="#FFFFFF" />
                </TouchableOpacity>
              </View>

              {/* Collapse Button (when expanded) */}
              <TouchableOpacity 
                style={styles.toolExpandButton} 
                onPress={() => setToolsExpanded(false)}
              >
                <Ionicons name="chevron-up" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </>
          )}
        </Animated.View>
      )}

      {/* Caption Input with Keyboard Handling */}
      {hasMedia && (
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.captionKeyboardAvoid}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 20 : 0}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.captionContainer}>
              <TextInput
                style={styles.captionInput}
                placeholder="Add a caption..."
                placeholderTextColor="rgba(255,255,255,0.6)"
                value={caption}
                onChangeText={setCaption}
                multiline={false}
              />
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      )}

      {/* Floating Share Button - Bottom Right */}
      {hasMedia && (
        <TouchableOpacity 
          style={[styles.floatingShareButton, !canShare && styles.floatingShareButtonDisabled]}
          onPress={handleShare}
          disabled={!canShare}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={canShare ? ['#0095F6', '#0077E6'] : ['#3A3A3C', '#2C2C2E']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.floatingShareGradient}
          >
            <Ionicons name="arrow-forward" size={22} color="#FFFFFF" />
          </LinearGradient>
        </TouchableOpacity>
      )}

      {/* Placeholder message */}
      {!params.uri && !backgroundImageUri && (
        <View style={styles.placeholderContainer}>
          <Ionicons name="image-outline" size={64} color="rgba(255,255,255,0.5)" />
          <Text style={styles.placeholderText}>Story Editor</Text>
          <Text style={styles.placeholderSubtext}>Select media to edit</Text>
        </View>
      )}

      {/* Modals */}
      {renderTextEditor()}
      {renderStickerTray()}
      {renderGifPicker()}
      {renderAiLabelModal()}
      {renderMoreMenu()}
      {renderMusicPicker()}
      {renderLocationStickerSheet()}
      
      {/* Image Editing Modal */}
      <ImageEditingModal
        visible={imageEditingVisible}
        imageUri={pendingEditImage?.uri || null}
        imageWidth={pendingEditImage?.width || 1080}
        imageHeight={pendingEditImage?.height || 1920}
        onCancel={handleImageEditingCancel}
        onDone={handleImageEditingDone}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  backgroundGradient: {
    ...StyleSheet.absoluteFillObject,
    zIndex: -1,
    backgroundColor: '#000000',
  },
  backgroundGlowTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '35%',
  },
  backgroundGlowBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '35%',
  },
  mediaContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 0,
    borderRadius: 24,
    overflow: 'hidden',
  },
  mediaPreview: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    borderRadius: 24,
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
  },

  // ========== Clinic Location Sticker Styles ==========
  clinicStickerContainer: {
    position: 'absolute',
    zIndex: 15,
  },
  clinicStickerGradient: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 10,
    minWidth: 140,
  },
  clinicStickerName: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    letterSpacing: 0.5,
  },
  clinicStickerCity: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },

  // ========== Photo Sticker Styles ==========
  photoStickerContainer: {
    position: 'absolute',
    zIndex: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },

  // ========== Clock Sticker Draggable Styles ==========
  clockStickerDraggable: {
    position: 'absolute',
    zIndex: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ========== Location Sticker Sheet Styles ==========
  locationSheetBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  locationSheetContainer: {
    backgroundColor: '#1C1C1E',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
    height: SCREEN_HEIGHT * 0.75, // Exactly 3/4 of screen height
  },
  locationSheetHandle: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  locationSheetHandleBar: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
  },
  locationSheetTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 4,
  },
  locationSheetSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    marginBottom: 24,
  },
  locationStickerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    paddingHorizontal: 16,
    gap: 16,
  },
  locationStickerOption: {
    alignItems: 'center',
    width: (SCREEN_WIDTH - 64) / 2,
    marginBottom: 16,
  },
  locationStickerPreviewContainer: {
    padding: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  locationStickerGlowEffect: {
    shadowColor: '#E91E63',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 16,
    elevation: 12,
  },
  locationStickerPreview: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    minWidth: 100,
  },
  locationStickerPreviewBold: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 14,
  },
  locationStickerPreviewName: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  locationStickerPreviewNameBold: {
    fontSize: 22,
    fontWeight: '900',
  },
  locationStickerPreviewCity: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 2,
  },
  locationStickerStyleLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 8,
    fontWeight: '500',
  },
  locationSheetInfo: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
    marginTop: 16,
    paddingHorizontal: 32,
  },

  // Top Controls (always visible)
  topControlsBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingTop: 8,
    zIndex: 20,
    elevation: 20,
  },
  // Drag Guide (only while dragging)
  dragGuideContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 58 : 42,
    left: 0,
    right: 0,
    zIndex: 19,
    elevation: 19,
    paddingHorizontal: 16,
  },
  dragGuideClinicName: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.65)',
    marginBottom: 6,
    letterSpacing: 0.3,
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  dragGuideDashedLine: {
    height: 2,
    borderBottomWidth: 1.5,
    borderBottomColor: 'rgba(77, 163, 255, 0.5)',
    borderStyle: 'dashed' as const,
  },
  dragGuideWarningText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: 'rgba(239, 68, 68, 0.95)',
    textAlign: 'center' as const,
    marginTop: 6,
    letterSpacing: 0.4,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  topButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  drawControls: {
    flexDirection: 'row',
    gap: 8,
  },

  // Right Tool Stack
  rightToolStack: {
    position: 'absolute',
    right: 12,
    top: 100,
    alignItems: 'flex-end',
    gap: 12,
    zIndex: 20,
    elevation: 20,
  },
  toolRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  toolLabel: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 13,
    fontWeight: '500',
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  toolButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    // Shadow for depth
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  toolButtonActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  toolButtonTextIcon: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  toolExpandButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },

  // Bottom Controls
  bottomControls: {
    position: 'absolute',
    bottom: 50,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 20,
    elevation: 20,
  },
  bottomLeftSection: {
    flex: 1,
  },
  aiLabelToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    alignSelf: 'flex-start',
    gap: 6,
  },
  aiLabelText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '500',
  },
  aiLabelTextActive: {
    color: '#34C759',
  },
  aiLabelSwitch: {
    transform: [{ scale: 0.75 }],
    marginLeft: 2,
  },
  shareButton: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  shareButtonDisabled: {
    opacity: 0.7,
  },
  shareButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  shareText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  shareTextDisabled: {
    color: '#8E8E93',
  },

  // Text Overlay
  textOverlayContainer: {
    position: 'absolute',
    zIndex: 10,
  },
  
  // Draggable Text Overlay
  draggableTextContainer: {
    position: 'absolute',
    zIndex: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Text Editor Modal
  textEditorOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
  },
  textEditorContainer: {
    flex: 1,
  },
  textEditorHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  textEditorHeaderBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  textEditorHeaderText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
  textEditorDoneText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  textInputContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  textInputWrapper: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  animatedPreviewOverlay: {
    position: 'absolute',
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  cursorIndicator: {
    position: 'absolute',
    width: 3,
    height: 40,
    backgroundColor: '#0095F6',
    borderRadius: 2,
  },
  textInput: {
    color: '#FFFFFF',
    fontSize: 32,
    textAlign: 'center',
    width: '100%',
    minHeight: 50,
    maxHeight: 300,
  },
  textEditorBottomControls: {
    paddingBottom: Platform.OS === 'ios' ? 20 : 16,
  },
  fontStyleScroller: {
    maxHeight: 50,
    marginBottom: 12,
  },
  fontStyleContent: {
    paddingHorizontal: 16,
    gap: 8,
    alignItems: 'center',
  },
  fontStyleBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  fontStyleBtnActive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
  },
  fontStyleText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '500',
  },
  fontStyleTextActive: {
    color: '#000000',
  },
  
  // Color Selector
  colorSwatchScroller: {
    maxHeight: 50,
  },
  colorSwatchContent: {
    paddingHorizontal: 16,
    gap: 8,
    alignItems: 'center',
  },
  eyedropperBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 4,
  },
  colorSwatch: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 0,
  },
  colorSwatchWhite: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  colorSwatchActive: {
    borderWidth: 3,
    borderColor: '#FFFFFF',
    transform: [{ scale: 1.1 }],
  },
  
  // Effect Buttons
  effectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  effectBtnActive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
  },
  effectBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  effectBtnTextActive: {
    color: '#000000',
  },
  
  textToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(50, 50, 50, 0.9)',
    marginHorizontal: 0,
    borderRadius: 0,
  },
  textToolBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textToolBtnActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
  },
  textToolBtnInner: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textToolBtnInnerActive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
  },
  textToolBtnAa: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  textToolBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  colorPickerBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    overflow: 'hidden',
  },
  rainbowGradient: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 12,
  },
  backgroundToggleIcon: {
    width: 28,
    height: 28,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backgroundToggleIconActive: {
    backgroundColor: '#FFFFFF',
  },
  backgroundToggleText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  colorPicker: {
    flex: 1,
  },
  colorPickerContent: {
    gap: 8,
    paddingRight: 8,
  },
  colorDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorDotActive: {
    borderColor: '#FFFFFF',
    transform: [{ scale: 1.15 }],
  },

  // Caption Input with Keyboard Handling
  captionKeyboardAvoid: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 80,
    zIndex: 20,
    elevation: 20,
  },
  captionContainer: {
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    paddingHorizontal: 16,
  },
  captionInput: {
    color: '#FFFFFF',
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 24,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },

  // Floating Share Button
  floatingShareButton: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 40 : 24,
    right: 16,
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#0095F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 20,
    zIndex: 20,
  },
  floatingShareButtonDisabled: {
    shadowColor: '#000',
    shadowOpacity: 0.2,
  },
  floatingShareGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Sticker Tray (Instagram-style Dark Theme)
  stickerOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  stickerOverlayDismiss: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  stickerTray: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(38, 39, 43, 0.98)',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
    height: SCREEN_HEIGHT * 0.75,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 30,
  },
  stickerTrayHandle: {
    width: 36,
    height: 4,
    backgroundColor: 'rgba(142, 142, 147, 0.6)',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 12,
  },
  stickerSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3A3A3C',
    marginHorizontal: 16,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    marginBottom: 16,
    gap: 6,
  },
  stickerSearchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '400',
  },
  stickerCategoriesScroll: {
    flex: 1,
  },
  stickerCategoriesContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  
  // Feature Buttons Grid - Instagram Style pills with shadows
  featureButtonsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 28,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  featurePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 50,
    gap: 6,
    // Subtle shadow for depth
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 4,
    // Extra margin to prevent overlap from rotation
    marginVertical: 2,
  },
  featurePillText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: -0.2,
  },
  featurePillTextBold: {
    color: '#10B981',
    fontSize: 14,
    fontWeight: '700',
  },
  featurePillTextHashtag: {
    color: '#3B82F6',
    fontSize: 14,
    fontWeight: '600',
  },
  featurePillEmoji: {
    fontSize: 15,
  },
  featurePillEmojiLarge: {
    fontSize: 22,
  },
  featurePillRound: {
    backgroundColor: '#FFFFFF',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 4,
    marginVertical: 2,
  },
  featurePillWithImage: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 5,
    paddingLeft: 5,
    paddingRight: 14,
    borderRadius: 50,
    gap: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 4,
    marginVertical: 2,
  },
  featurePillImageFrame: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: '#22C55E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  featurePillImageAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#EC4899',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  featurePillSlider: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 50,
    gap: 6,
    minWidth: 110,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 4,
    marginVertical: 2,
  },
  sliderLine: {
    flex: 1,
    height: 3,
    backgroundColor: '#E5E7EB',
    borderRadius: 1.5,
  },
  
  // Sticker Grid Section - Instagram Style stickers with backgrounds
  stickerGridSection: {
    marginTop: 12,
    paddingTop: 20,
  },
  // Clock row inside sticker tray
  stickerClockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 20,
    gap: 12,
  },
  stickerClockContainer: {
    // No absolute positioning - flows in the layout
  },
  stickerClockLabel: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
    fontWeight: '500',
  },
  stickerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  stickerGridItem: {
    width: (SCREEN_WIDTH - 48) / 4,
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    padding: 6,
  },
  // Clean sticker item with NO background - just floating stickers
  stickerGridItemClean: {
    width: (SCREEN_WIDTH - 56) / 4,
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  // Large floating sticker emoji (placeholder for actual images)
  floatingSticker: {
    fontSize: 50,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  
  // Custom Illustrated Sticker Styles
  stickerSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  // Row-based grid for guaranteed 4 items per row
  stickerRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  stickerGridItem4Col: {
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Legacy styles kept for compatibility
  customStickerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
  },
  customStickerItem: {
    width: Math.floor((SCREEN_WIDTH - 32 - 24) / 4),
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
  },
  customStickerImage: {
    width: '100%',
    height: '100%',
  },
  // PNG sticker component wrapper
  stickerComponentWrapper: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'visible',
  },
  // Styled placeholder for stickers (used when PNG assets aren't available)
  stickerPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    // Shadow for floating effect
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  stickerPlaceholderGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  stickerPlaceholderEmoji: {
    fontSize: 28,
    marginBottom: 2,
  },
  stickerPlaceholderText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    letterSpacing: -0.5,
  },
  
  // Illustrated sticker styles (legacy - keeping for compatibility)
  combinedSticker: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  illustratedEmoji: {
    fontSize: 42,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  illustratedText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#000000',
    textAlign: 'center',
    lineHeight: 14,
    letterSpacing: -0.3,
  },
  stickerEmoji: {
    fontSize: 24,
  },
  stickerTextSmall: {
    fontSize: 10,
    fontWeight: '800',
    color: '#000000',
    textAlign: 'center',
    marginTop: 2,
  },

  // AI Label Modal (Instagram-style bottom sheet)
  aiLabelOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  aiLabelSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  aiLabelSheetHandle: {
    width: 36,
    height: 4,
    backgroundColor: '#E5E5EA',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  aiLabelSheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 24,
  },
  aiLabelSheetContent: {
    paddingHorizontal: 20,
  },
  aiLabelSheetRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 16,
  },
  aiLabelSheetRowText: {
    flex: 1,
  },
  aiLabelSheetRowTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  aiLabelSheetRowDesc: {
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 20,
  },
  aiLabelLink: {
    color: '#0095F6',
    fontWeight: '500',
  },

  // More Menu
  moreMenuOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  moreMenuContainer: {
    backgroundColor: '#2C2C2E',
    borderRadius: 16,
    width: SCREEN_WIDTH - 48,
    overflow: 'hidden',
  },
  moreMenuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  moreMenuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  moreMenuItemText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  moreMenuDivider: {
    height: 1,
    backgroundColor: '#3A3A3C',
    marginHorizontal: 20,
  },

  // Placeholder
  placeholderContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  placeholderText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
  },
  placeholderSubtext: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 16,
  },

  // ========== Clock Styles ==========
  clockContainer: {
    position: 'absolute',
    left: 70,
    top: Platform.OS === 'ios' ? 55 : 16,
    zIndex: 999, // Very high z-index to ensure visibility
    elevation: 999, // Android elevation
  },
  // Style 1: Clean Digital
  clockDigital: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  // Style 2: Floating White Background
  clockFloating: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  clockFloatingText: {
    color: '#000000',
    fontSize: 18,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  // Style 3: Elegant Analog (Rolex-inspired)
  clockAnalog: {
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clockFace: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#C9A962', // Gold bezel
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  clockMarker: {
    position: 'absolute',
    width: 2,
    height: 4,
    backgroundColor: '#333333',
    borderRadius: 1,
  },
  clockHandHour: {
    position: 'absolute',
    width: 3,
    height: 14,
    backgroundColor: '#1A1A1A',
    borderRadius: 2,
    bottom: '50%',
    transformOrigin: 'bottom',
  },
  clockHandMinute: {
    position: 'absolute',
    width: 2,
    height: 18,
    backgroundColor: '#333333',
    borderRadius: 1,
    bottom: '50%',
    transformOrigin: 'bottom',
  },
  clockHandSecond: {
    position: 'absolute',
    width: 1,
    height: 20,
    backgroundColor: '#C9A962', // Gold second hand
    borderRadius: 0.5,
    bottom: '50%',
    transformOrigin: 'bottom',
  },
  clockCenter: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#C9A962', // Gold center
  },

  // ========== Music Picker Styles (Bottom Sheet) ==========
  musicPickerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  musicPickerSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: SCREEN_HEIGHT * 0.75, // 3/4 of screen
    backgroundColor: '#000000',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  musicPickerHandle: {
    width: 36,
    height: 5,
    backgroundColor: '#3A3A3C',
    borderRadius: 3,
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 4,
  },
  musicPickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  musicPickerCloseButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  musicPickerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  musicSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  musicSearchInput: {
    flex: 1,
    fontSize: 16,
    color: '#FFFFFF',
    marginLeft: 8,
    paddingVertical: 0,
  },
  musicTabsContainer: {
    borderBottomWidth: 0.5,
    borderBottomColor: '#2C2C2E',
  },
  musicTabsContent: {
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  musicTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 20,
    backgroundColor: '#1C1C1E',
  },
  musicTabActive: {
    backgroundColor: '#FFFFFF',
  },
  musicTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8E8E93',
  },
  musicTabTextActive: {
    color: '#000000',
    fontWeight: '600',
  },
  selectedTrackBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1C1C1E',
    marginHorizontal: 16,
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FF2D55',
  },
  selectedTrackInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  selectedTrackThumb: {
    fontSize: 24,
    marginRight: 12,
  },
  selectedTrackDetails: {
    flex: 1,
  },
  selectedTrackTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  selectedTrackArtist: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },
  selectedTrackRemove: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#3A3A3C',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  musicTrackList: {
    flex: 1,
    paddingTop: 8,
  },
  musicTrackItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  musicTrackItemSelected: {
    backgroundColor: 'rgba(255, 45, 85, 0.1)',
  },
  musicTrackThumbnail: {
    width: 56,
    height: 56,
    borderRadius: 8,
    backgroundColor: '#1C1C1E',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  musicTrackThumbEmoji: {
    fontSize: 28,
  },
  musicTrackInfo: {
    flex: 1,
    marginRight: 12,
  },
  musicTrackTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  musicTrackArtist: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 2,
  },
  musicTrackStats: {
    fontSize: 12,
    color: '#636366',
  },
  musicTrackDuration: {
    fontSize: 14,
    color: '#8E8E93',
    fontVariant: ['tabular-nums'],
  },
  musicNoResults: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 80,
  },
  musicNoResultsText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 16,
  },
  musicNoResultsSubtext: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 4,
  },
  musicNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#1C1C1E',
    borderTopWidth: 0.5,
    borderTopColor: '#2C2C2E',
  },
  musicNoticeText: {
    fontSize: 12,
    color: '#8E8E93',
    marginLeft: 6,
  },
  // Empty state for music picker
  musicEmptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 40,
  },
  musicEmptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#1C1C1E',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  musicEmptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  musicEmptySubtitle: {
    fontSize: 15,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  musicEmptyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(52, 199, 89, 0.15)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  musicEmptyBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#34C759',
    marginLeft: 6,
  },

});


