import { storage } from '@/firebaseConfig';
import { STICKER_COMPONENTS } from '@/src/components/stickers';
import StickerCanvas, { nextLocationStyle } from '@/src/components/stickers/StickerCanvas';
import { StickerItem, stickersToSnapshots } from '@/src/components/stickers/types';
import { useLocationSelection } from '@/src/context/LocationSelectionContext';
import { useTheme } from '@/src/context/ThemeContext';
import { useAuth } from '@/src/hooks/useAuth';
import { createStory, StoryLocation } from '@/src/services/storyService';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Image as ExpoImage } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    Alert, Animated,
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

// ========== Clock Style Options ==========
type ClockStyle = 'digital' | 'floating' | 'analog';

const CLOCK_STYLES: { id: ClockStyle; name: string }[] = [
  { id: 'digital', name: 'Digital' },
  { id: 'floating', name: 'Floating' },
  { id: 'analog', name: 'Analog' },
];

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

export default function EditStoryScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const { clinicId } = useAuth();
  const { selectedLocation, clearLocation } = useLocationSelection();
  const params = useLocalSearchParams<{
    uri: string;
    width: string;
    height: string;
    mediaType: string;
  }>();

  // ========== Tool States ==========
  const [activeMode, setActiveMode] = useState<'none' | 'text' | 'draw' | 'stickers'>('none');
  const [moreMenuVisible, setMoreMenuVisible] = useState(false);
  const [stickerTrayVisible, setStickerTrayVisible] = useState(false);
  const [aiLabelModalVisible, setAiLabelModalVisible] = useState(false);
  const [toolsExpanded, setToolsExpanded] = useState(false);
  
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
  
  // ========== Sticker Canvas State ==========
  const [stickers, setStickers] = useState<StickerItem[]>([]);
  const locationStickerAddedRef = useRef(false);
  const [activeStickerId, setActiveStickerId] = useState<string | null>(null);

  // ========== Text Editing State ==========
  const [editingTextId, setEditingTextId] = useState<string | null>(null);

  // ========== Publishing State ==========
  const [isPublishing, setIsPublishing] = useState(false);

  // ========== Computed Values ==========
  const hasMedia = Boolean(params.uri);
  const hasValidContent = hasMedia || textOverlays.length > 0;
  const canShare = hasValidContent;

  // ========== Clock Update Effect ==========
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // ========== Auto-inject location sticker on return from picker ==========
  useEffect(() => {
    if (selectedLocation && !locationStickerAddedRef.current) {
      locationStickerAddedRef.current = true;
      setStickers(prev => [
        ...prev,
        {
          id: `loc-${Date.now()}`,
          type: 'location',
          x: 0,
          y: SCREEN_HEIGHT * 0.32,
          scale: 1,
          rotation: 0,
          data: {
            name: selectedLocation.name,
            lat: selectedLocation.lat,
            lng: selectedLocation.lng,
            id: selectedLocation.id,
            address: selectedLocation.address,
            styleVariant: 'pill-gradient',
          },
        },
      ]);
    }
    if (!selectedLocation) {
      locationStickerAddedRef.current = false;
    }
  }, [selectedLocation]);

  // ========== Sticker CRUD ==========
  const addSticker = useCallback((item: StickerItem) => {
    setStickers(prev => [...prev, item]);
  }, []);

  const updateStickerTransform = useCallback(
    (id: string, updates: { x: number; y: number; scale: number; rotation: number }) => {
      setStickers(prev => prev.map(s => (s.id === id ? { ...s, ...updates } : s)));
    },
    [],
  );

  const handleStickerTap = useCallback((id: string) => {
    setStickers(prev =>
      prev.map(s => {
        if (s.id !== id) return s;
        if (s.type === 'location') {
          return { ...s, data: { ...s.data, styleVariant: nextLocationStyle(s.data.styleVariant) } };
        }
        return s;
      }),
    );
  }, []);

  // ========== S2 — Active sticker management ==========
  const selectSticker = useCallback((id: string) => {
    setActiveStickerId(prev => prev === id ? prev : id);
  }, []);

  const deleteSticker = useCallback((id: string) => {
    setStickers(prev => prev.filter(s => s.id !== id));
    setActiveStickerId(null);
  }, []);

  const duplicateSticker = useCallback((id: string) => {
    setStickers(prev => {
      const source = prev.find(s => s.id === id);
      if (!source) return prev;
      const clone: StickerItem = {
        ...source,
        id: `${source.type}-${Date.now()}`,
        x: source.x + 20,
        y: source.y + 20,
      };
      return [...prev, clone];
    });
  }, []);

  const bringToFront = useCallback((id: string) => {
    setStickers(prev => {
      const target = prev.find(s => s.id === id);
      if (!target) return prev;
      return [...prev.filter(s => s.id !== id), target];
    });
  }, []);

  // ========== L1-L3 — Long-press lock/unlock ==========
  const handleStickerLongPress = useCallback((_id: string) => {
    // StickerCanvas handles selector display; no extra state needed here
  }, []);

  const toggleStickerLock = useCallback((id: string, locked: boolean) => {
    setStickers(prev =>
      prev.map(s =>
        s.id === id ? { ...s, data: { ...s.data, isLocked: locked } } : s,
      ),
    );
  }, []);

  // Animation refs
  const toolbarAnim = useRef(new Animated.Value(1)).current;
  const stickerItemScale = useRef(new Animated.Value(1)).current;
  
  // Bottom sheet swipe animation refs
  const stickerTrayTranslateY = useRef(new Animated.Value(0)).current;
  const musicPickerTranslateY = useRef(new Animated.Value(0)).current;

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
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (_, gestureState) => {
      // Respond to any movement
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
      } else {
        isPinching.current = false;
      }
    },
    onPanResponderMove: (evt, gestureState) => {
      const touches = evt.nativeEvent.touches;
      
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
        
      } else if (touches.length === 1 && !isPinching.current) {
        // Single finger pan
        const newX = lastTranslateX.current + gestureState.dx;
        const newY = lastTranslateY.current + gestureState.dy;
        
        // Increased movement range
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

  const handleShare = useCallback(async () => {
    if (!clinicId || !params.uri || isPublishing) return;

    setIsPublishing(true);
    try {
      // ── 1. Upload media to Firebase Storage ──
      const blob: Blob = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve(xhr.response);
          else reject(new Error(`Upload blob failed: ${xhr.status}`));
        };
        xhr.onerror = () => reject(new Error('Failed to read media file'));
        xhr.responseType = 'blob';
        xhr.timeout = 30000;
        xhr.open('GET', params.uri, true);
        xhr.send(null);
      });

      const isVideo = params.mediaType === 'video';
      const ext = isVideo ? 'mp4' : 'jpg';
      const contentType = isVideo ? 'video/mp4' : 'image/jpeg';
      const filename = `${Date.now()}.${ext}`;
      const storageRef = ref(storage, `clinics/${clinicId}/stories/${filename}`);

      const downloadURL: string = await new Promise((resolve, reject) => {
        const uploadTask = uploadBytesResumable(storageRef, blob, { contentType });
        uploadTask.on(
          'state_changed',
          null,
          (err) => reject(err),
          async () => {
            const url = await getDownloadURL(uploadTask.snapshot.ref);
            resolve(url);
          },
        );
      });

      // ── 2. Build optional location from context ──
      let storyLocation: StoryLocation | undefined;
      if (
        selectedLocation?.lat != null &&
        selectedLocation?.lng != null &&
        isFinite(selectedLocation.lat) &&
        isFinite(selectedLocation.lng)
      ) {
        storyLocation = {
          latitude: selectedLocation.lat,
          longitude: selectedLocation.lng,
          ...(selectedLocation.name ? { placeName: selectedLocation.name } : {}),
          ...(selectedLocation.id ? { placeId: selectedLocation.id } : {}),
          ...(selectedLocation.address ? { address: selectedLocation.address } : {}),
        };
      }

      // ── 3. Create story in Firestore ──
      await createStory(clinicId, {
        mediaUrl: downloadURL,
        caption: caption || undefined,
        type: isVideo ? 'video' : 'image',
        allowReplies: commentsEnabled,
        location: storyLocation,
        stickers: stickersToSnapshots(stickers),
      });

      // ── 4. Clean up and navigate back ──
      clearLocation();
      router.dismissAll();
      router.replace('/(tabs)/create');
    } catch (error: any) {
      console.error('[Story] Publish failed:', error);
      Alert.alert('Publish Failed', error?.message || 'Something went wrong. Please try again.');
    } finally {
      setIsPublishing(false);
    }
  }, [clinicId, params.uri, params.mediaType, isPublishing, selectedLocation, caption, commentsEnabled, clearLocation, router, stickers]);

  const handleDownload = useCallback(() => {
    // TODO: Implement download functionality
    console.log('Downloading story...');
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
    setActiveStickerId(null);
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
    setActiveStickerId(null);
  }, []);

  const closeStickerTray = useCallback(() => {
    setStickerTrayVisible(false);
    setActiveMode('none');
  }, []);

  const handleStickerSelect = useCallback((stickerId: string) => {
    if (stickerId === 'location') {
      closeStickerTray();
      setTimeout(() => router.push('/story/location-list' as any), 300);
      return;
    }
    if (stickerId === 'emoji') {
      addSticker({
        id: `emoji-${Date.now()}`,
        type: 'emoji',
        x: 0,
        y: SCREEN_HEIGHT * 0.25,
        scale: 1,
        rotation: 0,
        data: { emoji: '😊', size: 48 },
      });
      closeStickerTray();
      return;
    }
    if (stickerId === 'hashtag') {
      addSticker({
        id: `tag-${Date.now()}`,
        type: 'hashtag',
        x: 0,
        y: SCREEN_HEIGHT * 0.3,
        scale: 1,
        rotation: 0,
        data: { tag: 'dental' },
      });
      closeStickerTray();
      return;
    }
    if (stickerId === 'poll') {
      addSticker({
        id: `poll-${Date.now()}`,
        type: 'poll',
        x: 0,
        y: SCREEN_HEIGHT * 0.22,
        scale: 1,
        rotation: 0,
        data: { question: 'Yes or No?', optionA: 'Yes', optionB: 'No' },
      });
      closeStickerTray();
      return;
    }
    if (stickerId === 'countdown') {
      addSticker({
        id: `time-${Date.now()}`,
        type: 'time',
        x: 0,
        y: SCREEN_HEIGHT * 0.12,
        scale: 1,
        rotation: 0,
        data: {},
      });
      closeStickerTray();
      return;
    }
    if (stickerId === 'slider') {
      addSticker({
        id: `music-${Date.now()}`,
        type: 'music',
        x: 0,
        y: SCREEN_HEIGHT * 0.35,
        scale: 1,
        rotation: 0,
        data: { title: 'Now Playing', artist: 'Artist' },
      });
      closeStickerTray();
      return;
    }
    // Default: log unhandled sticker
    console.log('Selected sticker:', stickerId);
    closeStickerTray();
  }, [closeStickerTray, router, addSticker]);

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
                  <Text style={styles.featurePillText} numberOfLines={1}>
                    {selectedLocation ? selectedLocation.name : 'Location'}
                  </Text>
                  {selectedLocation && (
                    <Ionicons name="checkmark-circle" size={12} color="#34C759" />
                  )}
                </TouchableOpacity>
                
                <TouchableOpacity style={[styles.featurePill, { transform: [{ rotate: '-6deg' }] }]} onPress={() => {
                  closeStickerTray();
                  setTimeout(() => setMusicPickerVisible(true), 300);
                }}>
                  <Ionicons name="musical-notes" size={14} color="#EC4899" />
                  <Text style={styles.featurePillText}>Music</Text>
                </TouchableOpacity>

                {/* Row 2: Photo, GIF, Add Yours */}
                <TouchableOpacity style={[styles.featurePill, { transform: [{ rotate: '-5deg' }] }]} onPress={() => handleStickerSelect('photo')}>
                  <Ionicons name="checkbox-outline" size={14} color="#22C55E" />
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
                              style={itemStyle}
                              onPress={() => handleStickerSelect('clock')}
                              activeOpacity={0.8}
                            >
                              <View style={[
                                styles.clockStickerContainer,
                                currentTime.getHours() >= 6 && currentTime.getHours() < 18 
                                  ? styles.clockStickerMorning 
                                  : styles.clockStickerNight
                              ]}>
                                <Text style={[
                                  styles.clockStickerTime,
                                  currentTime.getHours() >= 6 && currentTime.getHours() < 18 
                                    ? styles.clockTimeMorning 
                                    : styles.clockTimeNight
                                ]}>
                                  {currentTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                                </Text>
                                <Text style={[
                                  styles.clockStickerLabel,
                                  currentTime.getHours() >= 6 && currentTime.getHours() < 18 
                                    ? styles.clockLabelMorning 
                                    : styles.clockLabelNight
                                ]}>
                                  {currentTime.getHours() >= 6 && currentTime.getHours() < 18 ? '☀️ morning' : '🌙 evening'}
                                </Text>
                              </View>
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
      {params.uri && (
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
            source={{ uri: params.uri }}
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

      {/* Draggable Sticker Overlays */}
      {stickers.length > 0 && (
        <StickerCanvas
          stickers={stickers}
          activeStickerId={activeStickerId}
          onTransformEnd={updateStickerTransform}
          onStickerTap={handleStickerTap}
          onSelectSticker={selectSticker}
          onDeleteSticker={deleteSticker}
          onDuplicateSticker={duplicateSticker}
          onBringToFront={bringToFront}
          onStickerLongPress={handleStickerLongPress}
          onToggleStickerLock={toggleStickerLock}
        />
      )}

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
          style={[styles.floatingShareButton, (!canShare || isPublishing) && styles.floatingShareButtonDisabled]}
          onPress={handleShare}
          disabled={!canShare || isPublishing}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={canShare && !isPublishing ? ['#0095F6', '#0077E6'] : ['#3A3A3C', '#2C2C2E']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.floatingShareGradient}
          >
            {isPublishing ? (
              <Animated.View style={{ transform: [{ rotate: '0deg' }] }}>
                <Ionicons name="hourglass-outline" size={22} color="#FFFFFF" />
              </Animated.View>
            ) : (
              <Ionicons name="arrow-forward" size={22} color="#FFFFFF" />
            )}
          </LinearGradient>
        </TouchableOpacity>
      )}

      {/* Placeholder message */}
      {!params.uri && (
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
  },
  mediaPreview: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
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
  // Dynamic Clock Sticker Styles - Styled like other stickers with background
  clockStickerContainer: {
    width: '90%',
    height: '90%',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  clockStickerMorning: {
    backgroundColor: '#FFF7ED', // Warm cream/orange tint
    borderWidth: 2,
    borderColor: '#FB923C', // Orange border
  },
  clockStickerNight: {
    backgroundColor: '#1E1B4B', // Deep indigo/purple
    borderWidth: 2,
    borderColor: '#8B5CF6', // Purple border
  },
  clockStickerTime: {
    fontSize: 14,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  clockTimeMorning: {
    color: '#C2410C', // Dark orange for morning
  },
  clockTimeNight: {
    color: '#FFFFFF', // White for night
  },
  clockStickerLabel: {
    fontSize: 8,
    fontWeight: '600',
    marginTop: 2,
  },
  clockLabelMorning: {
    color: '#EA580C', // Orange for morning
  },
  clockLabelNight: {
    color: '#C4B5FD', // Light purple for night
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
