import { STICKER_COMPONENTS } from '@/src/components/stickers';
import { useTheme } from '@/src/context/ThemeContext';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Image as ExpoImage } from 'expo-image';
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

// ========== Default Clinic Sticker Data ==========
const CLINIC_STICKER = {
  clinicName: 'Farran9',
  city: 'Haifa',
};

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
}: { 
  overlay: TextOverlay;
  onEdit: (id: string) => void;
  onTransformUpdate: (id: string, updates: Partial<{ x: number; y: number; scale: number; rotation: number }>) => void;
  getTextStyle: (fontStyle: typeof FONT_STYLES[0], color: string, size: number) => any;
}) => {
  const pan = useRef(new Animated.ValueXY({ x: overlay.x, y: overlay.y })).current;
  const scale = useRef(new Animated.Value(overlay.scale)).current;
  const rotation = useRef(new Animated.Value(overlay.rotation)).current;
  
  const lastOffset = useRef({ x: overlay.x, y: overlay.y });
  const lastScale = useRef(overlay.scale);
  const lastRotation = useRef(overlay.rotation);
  const initialDistance = useRef(0);
  const initialAngle = useRef(0);
  const initialCenter = useRef({ x: 0, y: 0 });
  const isPinching = useRef(false);

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
        
        // Scale
        const currentDistance = getDistance(touches);
        if (initialDistance.current > 0) {
          const scaleFactor = currentDistance / initialDistance.current;
          const newScale = Math.max(0.3, Math.min(3, lastScale.current * scaleFactor));
          scale.setValue(newScale);
        }
        
        // Rotation
        const currentAngle = getAngle(touches);
        const angleDiff = currentAngle - initialAngle.current;
        rotation.setValue(lastRotation.current + angleDiff);
        
        // Move while pinching - track center point movement
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
      
      onTransformUpdate(overlay.id, {
        x: lastOffset.current.x,
        y: lastOffset.current.y,
        scale: lastScale.current,
        rotation: lastRotation.current,
      });
      
      isPinching.current = false;
      initialDistance.current = 0;
    },
  }), [overlay.id, pan, scale, rotation, onTransformUpdate]);

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
    onPanResponderGrant: (evt) => {
      const touches = evt.nativeEvent.touches;
      hasMoved.current = false;
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
      
      // Check if there's significant movement
      if (Math.abs(gestureState.dx) > 5 || Math.abs(gestureState.dy) > 5) {
        hasMoved.current = true;
      }

      if (touches.length >= 2) {
        hasMoved.current = true; // Pinch counts as movement
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

      isPinching.current = false;
      initialDistance.current = 0;
      hasMoved.current = false;
    },
  }), [pan, scaleAnim, rotation, onTransformUpdate, onTap]);

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
            { scale: Animated.multiply(scaleAnim, popAnim) },
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

        // Scale
        const currentDistance = getDistance(touches);
        if (initialDistance.current > 0) {
          const scaleFactor = currentDistance / initialDistance.current;
          const newScale = Math.max(0.5, Math.min(2.5, lastScale.current * scaleFactor));
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
    },
    onPanResponderRelease: () => {
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
  }), [pan, scale, rotation, onTransformUpdate]);

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
            { scale: Animated.multiply(scale, popAnim) },
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
}: {
  sticker: PhotoSticker;
  onTransformUpdate: (id: string, updates: Partial<{ x: number; y: number; scale: number; rotation: number }>) => void;
  onRemove: (id: string) => void;
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
    onPanResponderGrant: (evt) => {
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

      if (touches.length >= 2) {
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
    },
    onPanResponderRelease: () => {
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
  }), [pan, scale, rotation, onTransformUpdate, onRemove, sticker.id]);

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
            { scale: Animated.multiply(scale, popAnim) },
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

export default function EditStoryScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
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
      clinicName: CLINIC_STICKER.clinicName,
      city: CLINIC_STICKER.city,
      visible: true,
      x: SCREEN_WIDTH / 2 - 70,
      y: SCREEN_HEIGHT / 2 - 40,
      scale: 1,
      rotation: -4, // Slight rotation for style
      variant: 'branded',
    });
  }, []);

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
        console.log('Processing selected photo...');
        // Add selected photo as sticker overlay
        addPhotoSticker(result.assets[0]);
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
  }, [addPhotoSticker]);

  const updatePhotoStickerTransform = useCallback((id: string, updates: Partial<{ x: number; y: number; scale: number; rotation: number }>) => {
    setPhotoStickers(prev => prev.map(sticker => 
      sticker.id === id ? { ...sticker, ...updates } : sticker
    ));
  }, []);

  const removePhotoSticker = useCallback((id: string) => {
    setPhotoStickers(prev => prev.filter(sticker => sticker.id !== id));
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
      console.log('Photo sticker selected! Closing tray...');
      closeStickerTray();
      console.log('Tray closed, will open picker in 200ms...');
      setTimeout(() => {
        console.log('Calling openPhotoPicker now!');
        openPhotoPicker();
      }, 200);
      return;
    }
    
    // TODO: Add sticker to canvas
    console.log('Selected sticker:', stickerId);
    closeStickerTray();
  }, [closeStickerTray, params, router, addClockSticker, openPhotoPicker]);

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
                  console.log('Photo button pressed!');
                  closeStickerTray();
                  setTimeout(() => openPhotoPicker(), 300);
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
            </ScrollView>
          </Animated.View>
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
                          {CLINIC_STICKER.clinicName}
                        </Text>
                        <Text style={styles.locationStickerPreviewCity}>
                          {CLINIC_STICKER.city}
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
        />
      ))}

      {/* Location Sticker */}
      {locationSticker && locationSticker.visible && (
        <DraggableClinicSticker
          sticker={locationSticker}
          onTransformUpdate={updateLocationStickerTransform}
        />
      )}

      {/* Clock Sticker */}
      {clockSticker && clockSticker.visible && (
        <DraggableClockSticker
          sticker={clockSticker}
          onTransformUpdate={updateClockStickerTransform}
          onTap={cycleClockDesign}
        />
      )}

      {/* Photo Stickers */}
      {photoStickers.map(sticker => (
        <DraggablePhotoSticker
          key={sticker.id}
          sticker={sticker}
          onTransformUpdate={updatePhotoStickerTransform}
          onRemove={removePhotoSticker}
        />
      ))}

      {/* Top Controls */}
      <SafeAreaView style={styles.topControls}>
        <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
          <Ionicons name="close" size={28} color="#FFFFFF" />
        </TouchableOpacity>
        
        {/* Undo/Redo for draw mode */}
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
      {renderAiLabelModal()}
      {renderMoreMenu()}
      {renderMusicPicker()}
      {renderLocationStickerSheet()}
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

  // Top Controls
  topControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingTop: 8,
    zIndex: 10,
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
    zIndex: 10,
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
    zIndex: 10,
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
    elevation: 8,
    zIndex: 10,
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
