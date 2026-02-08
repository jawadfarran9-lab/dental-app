import { generatePostDeepLink } from '@/app/utils/deepLinking';
import { useAuth } from '@/src/context/AuthContext';
import { useTheme } from '@/src/context/ThemeContext';
import {
  getPostsLikeData,
  getSavedStatusBatch,
  togglePostLike,
  toggleSavePost
} from '@/src/services/postService';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { Image as ExpoImage } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import * as MediaLibrary from 'expo-media-library';
import { useRouter } from 'expo-router';
import * as React from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  FlatList,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import Svg, { ClipPath, Defs, G, Path, Stop, LinearGradient as SvgGradient, Image as SvgImage } from 'react-native-svg';
import ViewShot from 'react-native-view-shot';

// React 19 hook aliases
const { useState, useEffect, useCallback, useMemo, useRef, memo } = React;

const SCREEN_WIDTH = Dimensions.get('window').width;

// ========== Types ==========
interface Story {
  id: string;
  name: string;
  icon: string;
  imageUri?: string;
  isAddStory?: boolean;
}

interface Post {
  id: string;
  type: 'image' | 'video';
  title: string;
  caption: string;
  author: string;
  authorIcon: string;
  authorImage?: string;
  mediaUri?: string;
  likes: number;
  comments: number;
  timeAgo: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
  imageUri?: string;
}

interface ClinicShop {
  id: string;
  clinicName: string;
  clinicIcon: string;
  products: Product[];
}

// ========== Mock Data (English Only) ==========
const MOCK_STORIES: Story[] = [
  { id: 'add', name: 'Story', icon: '👤', isAddStory: true, imageUri: 'https://randomuser.me/api/portraits/men/32.jpg' },
  { id: '1', name: 'Smile Dental', icon: '🦷' },
  { id: '2', name: 'Happy Teeth', icon: '😁' },
  { id: '3', name: 'Care Dental', icon: '💙' },
  { id: '4', name: 'Wellness Den', icon: '✨' },
  { id: '5', name: 'Bright Smile', icon: '🌟' },
  { id: '6', name: 'Dental Plus', icon: '🏥' },
];

const MOCK_POSTS: Post[] = [
  { 
    id: '1', 
    type: 'video', 
    title: 'Dental Cleaning Tips', 
    caption: 'Learn the best techniques for dental hygiene',
    author: 'Smile Dental', 
    authorIcon: '🏥',
    likes: 890, 
    comments: 56,
    timeAgo: '2 hours ago'
  },
  { 
    id: '2', 
    type: 'image', 
    title: 'New Equipment', 
    caption: 'Latest dental technology arriving this week',
    author: 'Happy Teeth', 
    authorIcon: '😁',
    likes: 567, 
    comments: 34,
    timeAgo: '3 hours ago'
  },
  { 
    id: '3', 
    type: 'video', 
    title: 'Patient Testimonial', 
    caption: 'See what our patients say about us',
    author: 'Bright Smile', 
    authorIcon: '✨',
    likes: 1234, 
    comments: 89,
    timeAgo: '5 hours ago'
  },
  { 
    id: '4', 
    type: 'image', 
    title: 'Whitening Results', 
    caption: 'Amazing teeth whitening transformation',
    author: 'Care Dental', 
    authorIcon: '💙',
    likes: 2100, 
    comments: 156,
    timeAgo: '1 day ago'
  },
  { 
    id: '5', 
    type: 'video', 
    title: 'Orthodontics Guide', 
    caption: 'Everything you need to know about braces',
    author: 'Wellness Den', 
    authorIcon: '🌟',
    likes: 756, 
    comments: 42,
    timeAgo: '2 days ago'
  },
  { 
    id: '6', 
    type: 'image', 
    title: 'Kids Dental Care', 
    caption: 'How to make dental visits fun for children',
    author: 'Dental Plus', 
    authorIcon: '🏥',
    likes: 432, 
    comments: 28,
    timeAgo: '3 days ago'
  },
];

const MOCK_SHOPS: ClinicShop[] = [
  {
    id: '1',
    clinicName: 'Smile Dental',
    clinicIcon: '🏥',
    products: [
      { id: '1', name: 'Whitening Gel', price: 29.99 },
      { id: '2', name: 'Mouthwash', price: 14.99 },
      { id: '3', name: 'Toothpaste', price: 6.99 },
      { id: '4', name: 'Dental Kit', price: 8.99 },
      { id: '5', name: 'Premium Set', price: 99.99 },
    ],
  },
  {
    id: '2',
    clinicName: 'Happy Teeth',
    clinicIcon: '😁',
    products: [
      { id: '6', name: 'Electric Brush', price: 49.99 },
      { id: '7', name: 'Floss Set', price: 12.99 },
      { id: '8', name: 'Night Guard', price: 34.99 },
      { id: '9', name: 'Tongue Cleaner', price: 7.99 },
      { id: '10', name: 'Travel Kit', price: 24.99 },
    ],
  },
];

// ========== Animated Sparkle Particles (Optimized) ==========
// Reduced distribution: 10 dots, 4 stars, 2 cross, 2 shimmers = 18 total
// Concentrated in upper 70% of screen for dreamy effect
const SparkleParticles: React.FC = () => {
  const sparkles = useMemo(() => {
    const particles: Array<{
      id: number;
      left: number;
      top: number;
      size: number;
      delay: number;
      duration: number;
      type: 'dot' | 'star' | 'cross' | 'shimmer';
    }> = [];
    
    // 10 dots (small white circles) - scattered across upper 70%
    for (let i = 0; i < 10; i++) {
      particles.push({
        id: i,
        left: Math.random() * 100,
        top: Math.random() * 70,
        size: 2 + Math.random() * 4,
        delay: Math.random() * 4000,
        duration: 3000 + Math.random() * 2000, // 3-5 seconds
        type: 'dot',
      });
    }
    
    // 4 four-point stars (✦) - concentrated in upper areas
    for (let i = 10; i < 14; i++) {
      particles.push({
        id: i,
        left: Math.random() * 100,
        top: Math.random() * 60,
        size: 4 + Math.random() * 4,
        delay: Math.random() * 5000,
        duration: 3500 + Math.random() * 1500, // 3.5-5 seconds
        type: 'star',
      });
    }
    
    // 2 cross/plus sparkles (+) - bright accent points
    for (let i = 14; i < 16; i++) {
      particles.push({
        id: i,
        left: Math.random() * 100,
        top: Math.random() * 55,
        size: 5 + Math.random() * 5,
        delay: Math.random() * 4500,
        duration: 4000 + Math.random() * 1000, // 4-5 seconds
        type: 'cross',
      });
    }
    
    // 2 elongated shimmers - vertical light streaks
    for (let i = 16; i < 18; i++) {
      particles.push({
        id: i,
        left: Math.random() * 100,
        top: Math.random() * 50, // Even higher for shimmer effect
        size: 3 + Math.random() * 3,
        delay: Math.random() * 5000,
        duration: 4500 + Math.random() * 500, // 4.5-5 seconds
        type: 'shimmer',
      });
    }
    
    return particles;
  }, []);

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      {sparkles.map((sparkle) => (
        <SparklePoint key={sparkle.id} {...sparkle} />
      ))}
    </View>
  );
};

const SparklePoint: React.FC<{
  left: number;
  top: number;
  size: number;
  delay: number;
  duration: number;
  type: 'dot' | 'star' | 'cross' | 'shimmer';
}> = ({ left, top, size, delay, duration, type }) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    const animate = () => {
      // Reset values
      opacity.setValue(0);
      scale.setValue(0.5);
      
      // Simplified animation: fade in -> hold -> fade out
      const peakOpacity = type === 'shimmer' ? 0.35 : type === 'cross' ? 0.45 : type === 'star' ? 0.4 : 0.35;
      
      Animated.sequence([
        Animated.delay(delay),
        // Fade in
        Animated.parallel([
          Animated.timing(opacity, {
            toValue: peakOpacity,
            duration: duration * 0.3,
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 1,
            duration: duration * 0.3,
            useNativeDriver: true,
          }),
        ]),
        // Hold
        Animated.delay(duration * 0.4),
        // Fade out
        Animated.parallel([
          Animated.timing(opacity, {
            toValue: 0,
            duration: duration * 0.3,
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 0.5,
            duration: duration * 0.3,
            useNativeDriver: true,
          }),
        ]),
      ]).start(() => {
        animate(); // Loop
      });
    };
    animate();
  }, [delay, duration, type]);

  // Four-point star sparkle (✦)
  if (type === 'star') {
    return (
      <Animated.View
        style={{
          position: 'absolute',
          left: `${left}%` as any,
          top: `${top}%` as any,
          opacity,
          transform: [{ scale }],
        }}
      >
        <Text style={{ 
          fontSize: size * 3.5, 
          color: 'rgba(255,255,255,0.95)',
        }}>✦</Text>
      </Animated.View>
    );
  }

  // Cross sparkle (✧)
  if (type === 'cross') {
    return (
      <Animated.View
        style={{
          position: 'absolute',
          left: `${left}%` as any,
          top: `${top}%` as any,
          opacity,
          transform: [{ scale }],
        }}
      >
        <Text style={{ 
          fontSize: size * 3, 
          color: 'rgba(255,255,255,0.95)',
        }}>✧</Text>
      </Animated.View>
    );
  }

  // Shimmer - simple vertical line
  if (type === 'shimmer') {
    return (
      <Animated.View
        style={{
          position: 'absolute',
          left: `${left}%` as any,
          top: `${top}%` as any,
          opacity,
          transform: [{ scale }],
          alignItems: 'center',
        }}
      >
        <View style={{
          width: size * 0.5,
          height: size * 4,
          borderRadius: size * 2,
          backgroundColor: 'rgba(255,255,255,0.85)',
        }} />
      </Animated.View>
    );
  }

  // Dot (default) - simple glowing circle
  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: `${left}%` as any,
        top: `${top}%` as any,
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: 'rgba(255,255,255,0.9)',
        opacity,
        transform: [{ scale }],
      }}
    />
  );
};

// ========== Generate 5-pointed Star Path ==========
const generateStarPath = (cx: number, cy: number, outerR: number, innerR: number): string => {
  const points = 5;
  let path = '';
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const angle = (Math.PI / 2) + (i * Math.PI / points);
    const x = cx + r * Math.cos(angle);
    const y = cy - r * Math.sin(angle);
    path += i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
  }
  return path + ' Z';
};

// ========== Calculate Star Perimeter for Dash Array ==========
const calculateStarPerimeter = (outerR: number, innerR: number): number => {
  const points = 5;
  let perimeter = 0;
  for (let i = 0; i < points * 2; i++) {
    const r1 = i % 2 === 0 ? outerR : innerR;
    const r2 = (i + 1) % 2 === 0 ? outerR : innerR;
    const angle1 = (Math.PI / 2) + (i * Math.PI / points);
    const angle2 = (Math.PI / 2) + ((i + 1) * Math.PI / points);
    const x1 = r1 * Math.cos(angle1);
    const y1 = r1 * Math.sin(angle1);
    const x2 = r2 * Math.cos(angle2);
    const y2 = r2 * Math.sin(angle2);
    perimeter += Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
  }
  return perimeter;
};

// ========== Star-Shaped Rainbow Border with Snake Animation ==========
const StarRainbowBorder: React.FC<{
  size: number;
  strokeWidth?: number;
  gap?: number;
  uniqueId: string;
}> = ({ size, strokeWidth = 3, gap = 4, uniqueId }) => {
  const dashAnim = useRef(new Animated.Value(0)).current;
  
  const cx = size / 2;
  const cy = size / 2;
  // Border is drawn at the OUTER edge of the container
  const outerR = (size / 2) - (strokeWidth / 2);
  const innerR = outerR * 0.52; // Increased from 0.42 for better profile visibility
  
  // Generate star path for the border
  const starPath = generateStarPath(cx, cy, outerR, innerR);
  
  // Calculate perimeter for dash array (75% visible = 270°, 25% gap = 90°)
  const perimeter = calculateStarPerimeter(outerR, innerR);
  const arcLength = perimeter * 0.75;
  const gapLength = perimeter * 0.25;

  useEffect(() => {
    // Slower animation (5s instead of 3s) for less CPU usage
    const animation = Animated.loop(
      Animated.timing(dashAnim, {
        toValue: perimeter,
        duration: 5000,
        useNativeDriver: false, // strokeDashoffset doesn't support native driver
      })
    );
    animation.start();
    return () => animation.stop();
  }, [perimeter]);

  // Animated dash offset to create snake movement along the path
  const AnimatedPath = Animated.createAnimatedComponent(Path);

  return (
    <View style={{ 
      position: 'absolute',
      width: size,
      height: size,
    }}>
      <Svg width={size} height={size}>
        <Defs>
          <SvgGradient id={`starBorder_${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#FF9A9E" />
            <Stop offset="25%" stopColor="#FFE4A0" />
            <Stop offset="50%" stopColor="#A8D8EA" />
            <Stop offset="75%" stopColor="#D4B5E8" />
            <Stop offset="100%" stopColor="#FF9A9E" />
          </SvgGradient>
        </Defs>
        {/* Single rainbow stroke - removed glow layer for performance */}
        <AnimatedPath
          d={starPath}
          stroke={`url(#starBorder_${uniqueId})`}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${arcLength} ${gapLength}`}
          strokeDashoffset={dashAnim}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </View>
  );
};

// ========== Star Shape with 3D Puffy Effect & Optional Image Fill ==========
const StarShape: React.FC<{
  size: number;
  fillColor: string;
  innerFillColor?: string;
  uniqueId: string;
  imageUri?: string;
  showImage?: boolean;
}> = ({ size, fillColor, innerFillColor, uniqueId, imageUri, showImage }) => {
  const cx = size / 2;
  const cy = size / 2;
  const outerR = size / 2;
  const innerR = outerR * 0.52; // Increased from 0.42 for better profile visibility
  const starPath = generateStarPath(cx, cy, outerR, innerR);
  const innerPath = generateStarPath(cx, cy, outerR * 0.85, innerR * 0.85);
  const shimmerPath = generateStarPath(cx, cy * 0.7, outerR * 0.6, innerR * 0.5);

  return (
    <View style={{ width: size, height: size, position: 'absolute' }}>
      <Svg width={size} height={size}>
        <Defs>
          <ClipPath id={`starClip_${uniqueId}`}>
            <Path d={starPath} />
          </ClipPath>
          <SvgGradient id={`starBase_${uniqueId}`} x1="30%" y1="0%" x2="70%" y2="100%">
            <Stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.98} />
            <Stop offset="20%" stopColor={fillColor} stopOpacity={0.95} />
            <Stop offset="50%" stopColor={fillColor} stopOpacity={0.9} />
            <Stop offset="100%" stopColor={fillColor} stopOpacity={0.8} />
          </SvgGradient>
          <SvgGradient id={`starInner_${uniqueId}`} x1="30%" y1="0%" x2="70%" y2="100%">
            <Stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.99} />
            <Stop offset="40%" stopColor={innerFillColor || '#FFFFFF'} stopOpacity={0.97} />
            <Stop offset="100%" stopColor={innerFillColor || '#F0F8FF'} stopOpacity={0.95} />
          </SvgGradient>
          <SvgGradient id={`starShine_${uniqueId}`} x1="20%" y1="0%" x2="50%" y2="70%">
            <Stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.85} />
            <Stop offset="40%" stopColor="#FFFFFF" stopOpacity={0.3} />
            <Stop offset="100%" stopColor="#FFFFFF" stopOpacity={0} />
          </SvgGradient>
          <SvgGradient id={`glassGlow_${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#E8F4FC" stopOpacity={0.6} />
            <Stop offset="50%" stopColor="#D4ECFA" stopOpacity={0.4} />
            <Stop offset="100%" stopColor="#C8E6F8" stopOpacity={0.3} />
          </SvgGradient>
        </Defs>

        <Path d={starPath} fill={`url(#starBase_${uniqueId})`} />
        <Path d={innerPath} fill={`url(#starInner_${uniqueId})`} />
        <Path d={starPath} fill={`url(#glassGlow_${uniqueId})`} />
        <Path d={shimmerPath} fill={`url(#starShine_${uniqueId})`} />
      </Svg>
      
      {showImage && imageUri && (
        <View style={{ position: 'absolute', width: size, height: size }}>
          <Svg width={size} height={size}>
            <Defs>
              <ClipPath id={`imgClip_${uniqueId}`}>
                <Path d={starPath} />
              </ClipPath>
              <SvgGradient id={`imgInnerShadow_${uniqueId}`} x1="50%" y1="0%" x2="50%" y2="100%">
                <Stop offset="0%" stopColor="#000000" stopOpacity={0} />
                <Stop offset="70%" stopColor="#000000" stopOpacity={0} />
                <Stop offset="100%" stopColor="#000000" stopOpacity={0.15} />
              </SvgGradient>
              <SvgGradient id={`imgTopGlow_${uniqueId}`} x1="50%" y1="0%" x2="50%" y2="60%">
                <Stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.4} />
                <Stop offset="50%" stopColor="#FFFFFF" stopOpacity={0.1} />
                <Stop offset="100%" stopColor="#FFFFFF" stopOpacity={0} />
              </SvgGradient>
            </Defs>
            {/* Profile image clipped to star shape */}
            <G clipPath={`url(#imgClip_${uniqueId})`}>
              <SvgImage
                href={{ uri: imageUri }}
                x={-size * 0.1}
                y={-size * 0.1}
                width={size * 1.2}
                height={size * 1.2}
                preserveAspectRatio="xMidYMid slice"
              />
            </G>
            {/* Inner shadow for depth */}
            <Path d={starPath} fill={`url(#imgInnerShadow_${uniqueId})`} />
            {/* Top glow for 3D effect */}
            <Path d={shimmerPath} fill={`url(#imgTopGlow_${uniqueId})`} />
            {/* Subtle highlight shimmer */}
            <Path d={shimmerPath} fill={`url(#starShine_${uniqueId})`} opacity={0.3} />
          </Svg>
        </View>
      )}
    </View>
  );
};

// ========== Plus Icon Badge (Bottom Edge of Star - Overlapping Bottom Spike) ==========
const TrianglePlusPointer: React.FC<{ isDark?: boolean; starSize?: number }> = ({ isDark, starSize = 70 }) => {
  // Button size is ~50-60% of star width
  const buttonSize = Math.round(starSize * 0.28);
  const iconSize = Math.round(buttonSize * 0.65);
  
  return (
    <View style={{
      position: 'absolute',
      bottom: -buttonSize / 2 + 4, // Overlaps bottom spike
      alignSelf: 'center',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10,
    }}>
      {/* Blue circular badge with plus - attached to bottom edge of star */}
      <View style={{
        backgroundColor: '#2C7BE5',
        borderRadius: buttonSize / 2,
        width: buttonSize,
        height: buttonSize,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2.5,
        borderColor: '#FFFFFF',
      }}>
        <Ionicons name="add" size={iconSize} color="#FFFFFF" />
      </View>
    </View>
  );
};

// ========== Animated Star Story Component (LARGER SIZE) ==========
const AnimatedStarShape: React.FC<{
  size: number;
  icon: string;
  imageUri?: string;
  isAddStory?: boolean;
  isDark?: boolean;
  showPlusIcon?: boolean;
  showProfileImage?: boolean;
  uniqueId: string;
}> = ({ size, icon, imageUri, isAddStory, isDark, showPlusIcon, showProfileImage, uniqueId }) => {
  // Gap between star and rainbow border (border is OUTSIDE)
  const borderGap = 5;
  const arcStroke = 3;
  // Total size = star size + gap on each side + stroke width
  const totalSize = size + (borderGap * 2) + arcStroke;
  // Extra space for add button overflow
  const containerHeight = isAddStory ? totalSize + 12 : totalSize;

  // Soft cyan/light blue like reference
  const bgColor = isDark ? '#1E3A5F' : '#B8E4F0';
  const contentBg = isDark ? '#2D4A6F' : '#FFFFFF';

  return (
    <View style={[starStyles.container, { width: totalSize, height: containerHeight, overflow: 'visible' }]}>
      {/* Star-Shaped Rotating Rainbow Border - positioned at outer edge */}
      <StarRainbowBorder size={totalSize} strokeWidth={arcStroke} gap={borderGap} uniqueId={uniqueId} />

      {/* Star Shape with optional profile image fill */}
      {showProfileImage && imageUri ? (
        <StarShape 
          size={size} 
          fillColor={bgColor} 
          innerFillColor={contentBg} 
          uniqueId={uniqueId}
          imageUri={imageUri}
          showImage={true}
        />
      ) : (
        <>
          <StarShape size={size} fillColor={bgColor} innerFillColor={contentBg} uniqueId={uniqueId} />
          {/* Emoji content centered */}
          <View style={{ 
            position: 'absolute',
            justifyContent: 'center',
            alignItems: 'center',
          }}>
            <Text style={{ fontSize: size * 0.38 }}>{icon}</Text>
          </View>
        </>
      )}

      {/* Plus badge at bottom edge of star - overlapping bottom spike */}
      {isAddStory && <TrianglePlusPointer isDark={isDark} starSize={totalSize} />}
    </View>
  );
};

// ========== Post Header Star Avatar (Same as Story - No Extra Circle) ==========
const PostStarAvatar: React.FC<{ 
  icon: string; 
  size?: number; 
  isDark?: boolean; 
  uniqueId: string;
  imageUri?: string;
}> = ({ icon, size = 48, isDark, uniqueId, imageUri }) => {
  const borderGap = 3;
  const arcStroke = 2.5;
  const totalSize = size + (borderGap * 2) + arcStroke;

  // Soft cyan/light blue like reference
  const bgColor = isDark ? '#1E3A5F' : '#B8E4F0';
  const contentBg = isDark ? '#2D4A6F' : '#FFFFFF';

  return (
    <View style={{ width: totalSize, height: totalSize, justifyContent: 'center', alignItems: 'center' }}>
      {/* Star-Shaped Rotating Rainbow Border - OUTSIDE the star */}
      <StarRainbowBorder size={totalSize} strokeWidth={arcStroke} gap={borderGap} uniqueId={uniqueId} />
      
      {/* Star Shape with profile image or emoji - NO extra circle */}
      {imageUri ? (
        <StarShape 
          size={size} 
          fillColor={bgColor} 
          innerFillColor={contentBg} 
          uniqueId={uniqueId}
          imageUri={imageUri}
          showImage={true}
        />
      ) : (
        <>
          <StarShape size={size} fillColor={bgColor} innerFillColor={contentBg} uniqueId={uniqueId} />
          {/* Emoji content centered - NO circular background */}
          <View style={{ 
            position: 'absolute', 
            justifyContent: 'center', 
            alignItems: 'center',
          }}>
            <Text style={{ fontSize: size * 0.38 }}>{icon}</Text>
          </View>
        </>
      )}
    </View>
  );
};

// ========== Main Home Screen ==========
export default function HomeScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const { clinicId, memberId, isSubscribed } = useAuth();

  // ========== Pro Feature Access Check ==========
  const isProUser = isSubscribed === true && clinicId !== null;
  
  const showProOnlyAlert = useCallback((featureName?: string) => {
    Alert.alert(
      'BeSmile AI',
      `${featureName ? featureName + ' is' : 'This feature is'} available for BeSmile AI Pro members only. Please subscribe to continue.`,
      [
        { text: 'Maybe Later', style: 'cancel' },
        { text: 'Subscribe', onPress: () => router.push('/clinic/subscribe' as any) }
      ]
    );
  }, [router]);

  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [storyViewerVisible, setStoryViewerVisible] = useState(false);
  const [menuModalVisible, setMenuModalVisible] = useState(false);
  
  // ========== Like, Save State Management ==========
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});
  const [savedPosts, setSavedPosts] = useState<Set<string>>(new Set());
  const [loadingLike, setLoadingLike] = useState<string | null>(null);
  const [loadingSave, setLoadingSave] = useState<string | null>(null);

  // ========== Post Options Menu State ==========
  const [postMenuVisible, setPostMenuVisible] = useState(false);
  const [selectedPostForMenu, setSelectedPostForMenu] = useState<Post | null>(null);
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [qrColorIndex, setQrColorIndex] = useState(0);
  const [isSavingQr, setIsSavingQr] = useState(false);
  const qrViewShotRef = useRef<ViewShot>(null);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [hiddenPosts, setHiddenPosts] = useState<Set<string>>(new Set());
  const [reportedPosts, setReportedPosts] = useState<Set<string>>(new Set());
  const [selectedReportReason, setSelectedReportReason] = useState<string | null>(null);

  // ========== Share & Story Creator State ==========
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [selectedPostForShare, setSelectedPostForShare] = useState<Post | null>(null);
  const [storyCreatorVisible, setStoryCreatorVisible] = useState(false);
  const [storyCaption, setStoryCaption] = useState('');
  const [selectedStoryAudience, setSelectedStoryAudience] = useState<'everyone' | 'close-friends'>('everyone');

  // ========== Pull-to-Refresh State ==========
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [posts, setPosts] = useState<Post[]>(MOCK_POSTS);

  // QR Code color themes (like Instagram)
  const qrColors = [
    { bg: 'linear-gradient(135deg, #FF6B35, #F7931E)', primary: '#FF6B35', name: 'Orange' },
    { bg: 'linear-gradient(135deg, #E040FB, #7C4DFF)', primary: '#E040FB', name: 'Purple' },
    { bg: 'linear-gradient(135deg, #448AFF, #2979FF)', primary: '#448AFF', name: 'Blue' },
    { bg: 'linear-gradient(135deg, #1DE9B6, #00BFA5)', primary: '#1DE9B6', name: 'Teal' },
    { bg: 'linear-gradient(135deg, #212121, #424242)', primary: '#212121', name: 'Black' },
  ];

  // Report reasons
  const reportReasons = [
    { id: 'spam', label: "It's spam", icon: 'alert-circle-outline' },
    { id: 'inappropriate', label: 'Inappropriate content', icon: 'eye-off-outline' },
    { id: 'misleading', label: 'False or misleading information', icon: 'information-circle-outline' },
    { id: 'harassment', label: 'Bullying or harassment', icon: 'hand-left-outline' },
    { id: 'violence', label: 'Violence or dangerous content', icon: 'warning-outline' },
    { id: 'intellectual', label: 'Intellectual property violation', icon: 'shield-outline' },
    { id: 'other', label: 'Something else', icon: 'ellipsis-horizontal-outline' },
  ];

  // Animated values for button feedback
  const likeAnimations = useRef<Record<string, Animated.Value>>({});
  const saveAnimations = useRef<Record<string, Animated.Value>>({});

  // Memoized data
  const stories = useMemo(() => MOCK_STORIES, []);
  // posts is now stateful for pull-to-refresh
  const shops = useMemo(() => MOCK_SHOPS, []);

  // ========== Pull-to-Refresh Handler ==========
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      // Simulate API call delay - replace with actual fetch when API is ready
      await new Promise(resolve => setTimeout(resolve, 1200));
      
      // Reload posts - currently using mock data
      // TODO: Replace with actual API call: const newPosts = await fetchPosts();
      setPosts([...MOCK_POSTS]);
      
      // Reload interaction data (likes, saves)
      const postIds = MOCK_POSTS.map(p => p.id);
      const fallbackCounts: Record<string, number> = {};
      MOCK_POSTS.forEach(p => { fallbackCounts[p.id] = p.likes; });
      
      const likeData = await getPostsLikeData(postIds, fallbackCounts);
      const likedSet = new Set<string>();
      const counts: Record<string, number> = {};
      
      Object.entries(likeData).forEach(([postId, data]) => {
        if (data.isLiked) likedSet.add(postId);
        counts[postId] = data.likeCount;
      });
      
      setLikedPosts(likedSet);
      setLikeCounts(counts);
      
      const savedData = await getSavedStatusBatch(postIds);
      const savedSet = new Set<string>();
      Object.entries(savedData).forEach(([postId, isSaved]) => {
        if (isSaved) savedSet.add(postId);
      });
      setSavedPosts(savedSet);
    } catch (error) {
      console.error('Error refreshing feed:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  // ========== Load Initial Like & Save Data from Firebase/Storage ==========
  useEffect(() => {
    const loadPostInteractionData = async () => {
      try {
        const postIds = posts.map(p => p.id);
        const fallbackCounts: Record<string, number> = {};
        posts.forEach(p => { fallbackCounts[p.id] = p.likes; });
        
        // Load like data from Firebase
        const likeData = await getPostsLikeData(postIds, fallbackCounts);
        const likedSet = new Set<string>();
        const counts: Record<string, number> = {};
        
        Object.entries(likeData).forEach(([postId, data]) => {
          if (data.isLiked) likedSet.add(postId);
          counts[postId] = data.likeCount;
        });
        
        setLikedPosts(likedSet);
        setLikeCounts(counts);
        
        // Load saved status from local storage
        const savedData = await getSavedStatusBatch(postIds);
        const savedSet = new Set<string>();
        Object.entries(savedData).forEach(([postId, isSaved]) => {
          if (isSaved) savedSet.add(postId);
        });
        setSavedPosts(savedSet);
        
      } catch (error) {
        console.error('Error loading post interaction data:', error);
        // Use mock data as fallback
        const counts: Record<string, number> = {};
        posts.forEach(p => { counts[p.id] = p.likes; });
        setLikeCounts(counts);
      }
    };
    
    loadPostInteractionData();
  }, [posts]);

  const handleStoryPress = useCallback((story: Story) => {
    if (story.isAddStory) {
      // PRO FEATURE: Add Story
      if (!isProUser) {
        showProOnlyAlert('Adding stories');
        return;
      }
      router.push('/(tabs)/create' as any);
    } else {
      setSelectedStory(story);
      setStoryViewerVisible(true);
    }
  }, [router, isProUser, showProOnlyAlert]);

  // ========== LIKE Handler - Firebase Firestore ==========
  const toggleLike = useCallback(async (postId: string, initialLikes: number) => {
    if (loadingLike) return; // Prevent double-tap
    
    setLoadingLike(postId);
    
    // Animate the button
    if (!likeAnimations.current[postId]) {
      likeAnimations.current[postId] = new Animated.Value(1);
    }
    Animated.sequence([
      Animated.timing(likeAnimations.current[postId], {
        toValue: 1.3,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(likeAnimations.current[postId], {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
    
    // Optimistic update
    const wasLiked = likedPosts.has(postId);
    setLikedPosts(prev => {
      const newSet = new Set(prev);
      if (wasLiked) newSet.delete(postId);
      else newSet.add(postId);
      return newSet;
    });
    setLikeCounts(prev => ({
      ...prev,
      [postId]: wasLiked ? (prev[postId] || initialLikes) - 1 : (prev[postId] || initialLikes) + 1,
    }));
    
    try {
      // Sync with Firebase
      const result = await togglePostLike(postId, initialLikes);
      // Update with actual server values
      setLikedPosts(prev => {
        const newSet = new Set(prev);
        if (result.isLiked) newSet.add(postId);
        else newSet.delete(postId);
        return newSet;
      });
      setLikeCounts(prev => ({ ...prev, [postId]: result.likeCount }));
    } catch (error) {
      console.error('Error toggling like:', error);
      // Revert optimistic update on error
      setLikedPosts(prev => {
        const newSet = new Set(prev);
        if (wasLiked) newSet.add(postId);
        else newSet.delete(postId);
        return newSet;
      });
      setLikeCounts(prev => ({
        ...prev,
        [postId]: wasLiked ? (prev[postId] || initialLikes) + 1 : (prev[postId] || initialLikes) - 1,
      }));
    } finally {
      setLoadingLike(null);
    }
  }, [likedPosts, loadingLike]);

  // ========== SHARE Handler - Opens Share Options Modal ==========
  const handleShare = useCallback((post: Post) => {
    setSelectedPostForShare(post);
    setShareModalVisible(true);
  }, []);

  // ========== Native Share Handler ==========
  const handleNativeShare = useCallback(async () => {
    console.log('🔵 handleNativeShare called');
    
    if (!selectedPostForShare) {
      console.log('❌ No selectedPostForShare - returning early');
      return;
    }
    
    const postId = selectedPostForShare.id;
    const title = selectedPostForShare.title;
    const author = selectedPostForShare.author;
    const postUrl = `https://besmile.ai/post/${postId}`;
    const shareMessage = `Check out "${title}" by ${author} on BeSmile AI!\n\n${postUrl}`;
    
    console.log('🔵 Share message:', shareMessage);
    
    // Try calling Share.share() FIRST, before closing the modal
    try {
      console.log('🔵 Calling Share.share() NOW...');
      const result = await Share.share({
        message: shareMessage,
      });
      console.log('✅ Share result:', result);
      
      // Close modal AFTER share completes or is dismissed
      setShareModalVisible(false);
      setSelectedPostForShare(null);
    } catch (error: any) {
      console.error('❌ Share error:', error);
      Alert.alert('Share Error', error?.message || String(error));
    }
  }, [selectedPostForShare]);

  // ========== Add to Story Handler (PRO FEATURE) ==========
  const handleAddToStory = useCallback(() => {
    // PRO FEATURE: Add to Story
    if (!isProUser) {
      setShareModalVisible(false);
      showProOnlyAlert('Adding to story');
      return;
    }
    setShareModalVisible(false);
    setStoryCaption('');
    setSelectedStoryAudience('everyone');
    setTimeout(() => setStoryCreatorVisible(true), 300);
  }, [isProUser, showProOnlyAlert]);

  // ========== Publish Story Handler ==========
  const handlePublishStory = useCallback(() => {
    if (!selectedPostForShare) return;
    
    // Here you would typically upload the story to your backend
    // For now, we'll just show a success message
    const audienceText = selectedStoryAudience === 'close-friends' ? 'Close Friends' : 'Your Story';
    
    setStoryCreatorVisible(false);
    setSelectedPostForShare(null);
    setStoryCaption('');
    
    Alert.alert(
      'Story Published! 🎉',
      `Your story has been shared to ${audienceText}.`,
      [{ text: 'OK' }]
    );
  }, [selectedPostForShare, selectedStoryAudience]);

  // ========== Close Story Creator ==========
  const closeStoryCreator = useCallback(() => {
    setStoryCreatorVisible(false);
    setSelectedPostForShare(null);
    setStoryCaption('');
  }, []);

  // ========== Copy Link Handler ==========
  const handleCopyLink = useCallback(async () => {
    if (!selectedPostForShare) return;
    
    const postUrl = `https://besmile.ai/post/${selectedPostForShare.id}`;
    await Clipboard.setStringAsync(postUrl);
    
    setShareModalVisible(false);
    Alert.alert('Post link copied!', postUrl);
  }, [selectedPostForShare]);

  // ========== SAVE Handler - AsyncStorage (PRO FEATURE) ==========
  const toggleSave = useCallback(async (postId: string) => {
    // PRO FEATURE: Save Posts
    if (!isProUser) {
      showProOnlyAlert('Saving posts');
      return;
    }
    
    if (loadingSave) return; // Prevent double-tap
    
    setLoadingSave(postId);
    
    // Animate the button
    if (!saveAnimations.current[postId]) {
      saveAnimations.current[postId] = new Animated.Value(1);
    }
    Animated.sequence([
      Animated.timing(saveAnimations.current[postId], {
        toValue: 1.2,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(saveAnimations.current[postId], {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
    
    // Optimistic update
    const wasSaved = savedPosts.has(postId);
    setSavedPosts(prev => {
      const newSet = new Set(prev);
      if (wasSaved) newSet.delete(postId);
      else newSet.add(postId);
      return newSet;
    });
    
    try {
      const isSaved = await toggleSavePost(postId);
      setSavedPosts(prev => {
        const newSet = new Set(prev);
        if (isSaved) newSet.add(postId);
        else newSet.delete(postId);
        return newSet;
      });
    } catch (error) {
      console.error('Error toggling save:', error);
      // Revert on error
      setSavedPosts(prev => {
        const newSet = new Set(prev);
        if (wasSaved) newSet.add(postId);
        else newSet.delete(postId);
        return newSet;
      });
      Alert.alert('Error', 'Failed to save post. Please try again.');
    } finally {
      setLoadingSave(null);
    }
  }, [savedPosts, loadingSave, isProUser, showProOnlyAlert]);

  // ========== Post Menu Handlers (PRO FEATURE) ==========
  const openPostMenu = useCallback((post: Post) => {
    // PRO FEATURE: Post Menu (edit/report/QR/hide)
    if (!isProUser) {
      showProOnlyAlert('Post options');
      return;
    }
    setSelectedPostForMenu(post);
    setPostMenuVisible(true);
  }, [isProUser, showProOnlyAlert]);

  const closePostMenu = useCallback(() => {
    setPostMenuVisible(false);
    setSelectedPostForMenu(null);
  }, []);

  const handleSaveFromMenu = useCallback(async () => {
    if (!selectedPostForMenu) return;
    await toggleSave(selectedPostForMenu.id);
    closePostMenu();
  }, [selectedPostForMenu, toggleSave, closePostMenu]);

  const handleQrCode = useCallback(() => {
    // PRO FEATURE: Generate QR Code (already gated by post menu, but double-check)
    if (!isProUser) {
      showProOnlyAlert('QR code generation');
      return;
    }
    setPostMenuVisible(false);
    setTimeout(() => setQrModalVisible(true), 300);
  }, [isProUser, showProOnlyAlert]);

  // ========== Save QR Code to Camera Roll (PRO FEATURE) ==========
  const handleSaveQrToGallery = useCallback(async () => {
    // PRO FEATURE: Save QR to Gallery
    if (!isProUser) {
      showProOnlyAlert('Saving QR codes');
      return;
    }
    
    if (isSavingQr) return;
    
    setIsSavingQr(true);
    
    try {
      // Request permissions
      const { status } = await MediaLibrary.requestPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please allow access to your photo library to save the QR code.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Settings', onPress: () => {
              // On iOS, this would open settings. For now just inform user.
              Alert.alert('Permission Needed', 'Please enable photo library access in your device settings.');
            }}
          ]
        );
        return;
      }
      
      // Capture the QR card as an image
      if (qrViewShotRef.current?.capture) {
        const uri = await qrViewShotRef.current.capture();
        
        // Save to media library
        const asset = await MediaLibrary.createAssetAsync(uri);
        await MediaLibrary.createAlbumAsync('BeSmile AI', asset, false);
        
        Alert.alert('Saved to Camera Roll ✅', 'Your QR code has been saved to your photo library.');
      }
    } catch (error) {
      console.error('Error saving QR code:', error);
      Alert.alert('Save Failed', 'Could not save the QR code. Please try again.');
    } finally {
      setIsSavingQr(false);
    }
  }, [isSavingQr, isProUser, showProOnlyAlert]);

  // ========== Hide Post Handler (PRO FEATURE) ==========
  const handleHidePost = useCallback(() => {
    // PRO FEATURE: Hide Posts
    if (!isProUser) {
      showProOnlyAlert('Hiding posts');
      closePostMenu();
      return;
    }
    if (!selectedPostForMenu) return;
    setHiddenPosts(prev => new Set(prev).add(selectedPostForMenu.id));
    closePostMenu();
    Alert.alert('Post Hidden', 'This post has been hidden from your feed.');
  }, [selectedPostForMenu, closePostMenu, isProUser, showProOnlyAlert]);

  const handleReportPost = useCallback(() => {
    setPostMenuVisible(false);
    setSelectedReportReason(null);
    setTimeout(() => setReportModalVisible(true), 300);
  }, []);

  const submitReport = useCallback(() => {
    if (!selectedPostForMenu || !selectedReportReason) return;
    setReportedPosts(prev => new Set(prev).add(selectedPostForMenu.id));
    setReportModalVisible(false);
    setSelectedReportReason(null);
    Alert.alert('Report Submitted', 'Thank you for your report. We will review this post.');
  }, [selectedPostForMenu, selectedReportReason]);

  // ========== Story Item Props Interface ==========
  interface StoryItemProps {
    story: Story;
    index: number;
    isDark: boolean;
    textColor: string;
    onPress: () => void;
    isProUser: boolean;
  }

  // ========== Story Item Component (Optimized) ==========
  const StoryItem = memo(({ story, index, isDark: storyIsDark, textColor, onPress, isProUser: storyIsProUser }: StoryItemProps) => {
    const isFirst = index === 0;
    // LARGER sizes for better visibility and click area
    const starSize = isFirst ? 66 : 74;
    const showLock = story.isAddStory && !storyIsProUser;
    
    return (
      <TouchableOpacity
        style={styles.storyItem}
        onPress={onPress}
        activeOpacity={0.8}
      >
        <View>
          <AnimatedStarShape 
            size={starSize} 
            icon={story.icon} 
            imageUri={story.imageUri}
            isAddStory={story.isAddStory}
            isDark={storyIsDark}
            showPlusIcon={story.isAddStory}
            showProfileImage={story.isAddStory}
            uniqueId={`story_${story.id}`}
          />
          {/* Lock badge for Pro feature */}
          {showLock && (
            <View style={{
              position: 'absolute',
              bottom: -2,
              right: -2,
              backgroundColor: '#F59E0B',
              borderRadius: 10,
              width: 20,
              height: 20,
              justifyContent: 'center',
              alignItems: 'center',
              borderWidth: 2,
              borderColor: '#FFFFFF',
            }}>
              <Ionicons name="lock-closed" size={10} color="#FFFFFF" />
            </View>
          )}
        </View>
        <Text 
          style={[
            styles.storyName, 
            { color: textColor },
            isFirst && styles.storyNameSmall
          ]} 
          numberOfLines={1}
        >
          {story.isAddStory ? 'Story' : story.name}
        </Text>
      </TouchableOpacity>
    );
  }, (prevProps, nextProps) => {
    return (
      prevProps.story.id === nextProps.story.id &&
      prevProps.index === nextProps.index &&
      prevProps.isDark === nextProps.isDark
    );
  });

  // ========== Post Component Props Interface ==========
  interface PostItemProps {
    post: Post;
    isLiked: boolean;
    isSaved: boolean;
    likeCount: number;
    isLoadingLike: boolean;
    isLoadingSave: boolean;
    isDark: boolean;
    textColor: string;
    likeAnimation: Animated.Value;
    saveAnimation: Animated.Value;
    onLike: () => void;
    onSave: () => void;
    onShare: () => void;
    onMenu: () => void;
    isProUser: boolean;
  }

  // ========== Post Component - Instagram-like (Optimized) ==========
  const PostItem = memo(({ 
    post, 
    isLiked, 
    isSaved, 
    likeCount,
    isLoadingLike,
    isLoadingSave,
    isDark: postIsDark,
    textColor,
    likeAnimation,
    saveAnimation,
    onLike,
    onSave,
    onShare,
    onMenu,
    isProUser: postIsProUser,
  }: PostItemProps) => {
    return (
      <View style={[styles.postCard, { 
        backgroundColor: postIsDark ? 'rgba(30,41,59,0.9)' : 'rgba(255,255,255,0.88)',
        borderColor: postIsDark ? 'rgba(71,85,105,0.4)' : 'rgba(180,215,245,0.7)',
        borderWidth: 1.5,
      }]}>
        {/* Outer glow effect */}
        {!postIsDark && (
          <View style={{ position: 'absolute', top: -2, left: -2, right: -2, bottom: -2, borderRadius: 20, backgroundColor: 'transparent', shadowColor: '#5DA8E8', shadowOpacity: 0.15, shadowRadius: 15, shadowOffset: { width: 0, height: 4 }, zIndex: -1 }} />
        )}

        {/* Post Media - Full width, stretched to top with overlaid header */}
        <View style={[styles.postMedia, { backgroundColor: postIsDark ? '#1E293B' : '#E8F4FD' }]}>
          <ExpoImage 
            source={{ uri: 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=800' }}
            style={styles.mediaImage}
            contentFit="cover"
            transition={0}
            cachePolicy="memory-disk"
            placeholder={postIsDark ? '#1E293B' : '#E8F4FD'}
          />
          
          {/* Gradient overlay for header readability */}
          <LinearGradient
            colors={['rgba(0,0,0,0.5)', 'rgba(0,0,0,0.25)', 'rgba(0,0,0,0)']}
            locations={[0, 0.5, 1]}
            style={styles.mediaHeaderGradient}
          />
          
          {/* Post Header - Overlaid inside image, top-left */}
          <View style={styles.postHeaderOverlay}>
            <View style={styles.postAuthorRow}>
              <PostStarAvatar 
                icon={post.authorIcon} 
                size={44} 
                isDark={false} 
                uniqueId={`post_${post.id}`}
                imageUri={post.authorImage || 'https://randomuser.me/api/portraits/men/32.jpg'}
              />
              <View style={styles.postAuthorInfo}>
                <Text style={[styles.postAuthorName, { color: '#FFFFFF' }]}>
                  {post.author}
                </Text>
                <Text style={[styles.postTime, { color: 'rgba(255,255,255,0.85)' }]}>
                  {post.timeAgo}
                </Text>
              </View>
            </View>
            <TouchableOpacity style={styles.moreButtonOverlay} onPress={onMenu}>
              <Ionicons name="ellipsis-horizontal" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          
          {post.type === 'video' && (
            <TouchableOpacity style={styles.playButton}>
              <View style={styles.playCircle}>
                <Ionicons name="play" size={32} color="#FFFFFF" />
              </View>
            </TouchableOpacity>
          )}
        </View>

        {/* Post Actions - Instagram Layout: Like/Share left, Save right */}
        <View style={styles.postActions}>
          {/* Left side: Like + Share */}
          <View style={styles.actionsLeft}>
            {/* LIKE Button with Animation */}
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={onLike}
              disabled={isLoadingLike}
              activeOpacity={0.7}
            >
              <Animated.View style={{ transform: [{ scale: likeAnimation }] }}>
                {isLoadingLike ? (
                  <ActivityIndicator size="small" color={textColor} />
                ) : (
                  <Ionicons 
                    name={isLiked ? 'heart' : 'heart-outline'} 
                    size={26} 
                    color={isLiked ? '#FF6B6B' : textColor} 
                  />
                )}
              </Animated.View>
            </TouchableOpacity>
            
            {/* SHARE Button */}
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={onShare}
              activeOpacity={0.7}
            >
              <Ionicons name="paper-plane-outline" size={24} color={textColor} />
            </TouchableOpacity>
          </View>
          
          {/* Right side: SAVE Button with Animation (PRO feature) */}
          <View style={{ position: 'relative' }}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={onSave}
              disabled={isLoadingSave}
              activeOpacity={0.7}
            >
              <Animated.View style={{ transform: [{ scale: saveAnimation }] }}>
                {isLoadingSave ? (
                  <ActivityIndicator size="small" color={textColor} />
                ) : (
                  <Ionicons 
                    name="bookmark-outline" 
                    size={24} 
                    color={!postIsProUser ? '#9CA3AF' : textColor} 
                  />
                )}
              </Animated.View>
            </TouchableOpacity>
            {/* Lock badge for non-Pro users */}
            {!postIsProUser && (
              <View style={{
                position: 'absolute',
                bottom: -2,
                right: -2,
                backgroundColor: '#F59E0B',
                borderRadius: 8,
                width: 16,
                height: 16,
                justifyContent: 'center',
                alignItems: 'center',
              }}>
                <Ionicons name="lock-closed" size={8} color="#FFFFFF" />
              </View>
            )}
          </View>
        </View>

        {/* Like count - positioned below actions */}
        <View style={styles.likeCount}>
          <Text style={[styles.likeCountText, { color: textColor }]}>
            {likeCount.toLocaleString()} likes
          </Text>
        </View>
      </View>
    );
  }, (prevProps, nextProps) => {
    // Custom comparison for memo - only re-render when these specific props change
    return (
      prevProps.post.id === nextProps.post.id &&
      prevProps.isLiked === nextProps.isLiked &&
      prevProps.isSaved === nextProps.isSaved &&
      prevProps.likeCount === nextProps.likeCount &&
      prevProps.isLoadingLike === nextProps.isLoadingLike &&
      prevProps.isLoadingSave === nextProps.isLoadingSave &&
      prevProps.isDark === nextProps.isDark &&
      prevProps.isProUser === nextProps.isProUser
    );
  });

  // ========== Shop Section Props Interface ==========
  interface ShopSectionProps {
    shop: ClinicShop;
    isDark: boolean;
    textPrimary: string;
    textSecondary: string;
    accentBlue: string;
  }

  // ========== Shop Section Component - Enhanced Glassmorphism (Optimized) ==========
  const ShopSection = memo(({ shop, isDark: shopIsDark, textPrimary, textSecondary, accentBlue }: ShopSectionProps) => {
    return (
      <View style={[styles.shopCard, { 
        backgroundColor: shopIsDark ? 'rgba(30,41,59,0.9)' : 'rgba(232,244,253,0.92)',
        borderColor: shopIsDark ? 'rgba(71,85,105,0.4)' : 'rgba(180,215,245,0.7)',
      }]}>
        {/* Frosted glass effect with soft white-blue shimmer */}
        {!shopIsDark && (
          <>
            {/* Base gradient - soft sky blue glass */}
            <LinearGradient
              colors={['rgba(232,244,253,0.98)', 'rgba(220,240,252,0.95)', 'rgba(214,239,255,0.9)']}
              locations={[0, 0.5, 1]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 22 }}
            />
            {/* White shimmer overlay at top */}
            <LinearGradient
              colors={['rgba(255,255,255,0.75)', 'rgba(255,255,255,0.35)', 'rgba(255,255,255,0)']}
              locations={[0, 0.4, 1]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 85, borderTopLeftRadius: 22, borderTopRightRadius: 22, zIndex: 1 }}
            />
            {/* Soft outer glow */}
            <View style={{ position: 'absolute', top: -3, left: -3, right: -3, bottom: -3, borderRadius: 25, backgroundColor: 'transparent', shadowColor: '#87CEEB', shadowOpacity: 0.22, shadowRadius: 18, shadowOffset: { width: 0, height: 5 }, zIndex: -1 }} />
          </>
        )}
        {/* Shop Header */}
        <View style={styles.shopHeader}>
          <View style={styles.shopTitleRow}>
            {/* Star-shaped clinic avatar - matches story design */}
            <PostStarAvatar 
              icon="🏥" 
              size={42} 
              isDark={shopIsDark} 
              uniqueId={`shop-avatar-${shop.id}`}
            />
            <View>
              <Text style={[styles.shopTitle, { color: textSecondary }]}>
                Clinic Products
              </Text>
              <Text style={[styles.shopClinicName, { color: shopIsDark ? '#F8FAFC' : '#1E3A5F' }]}>
                {shop.clinicName}
              </Text>
            </View>
          </View>
          <TouchableOpacity>
            <Ionicons name="grid" size={22} color={textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Products List - Instagram Reels style horizontal scroll */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.productsContainer}
        >
          {shop.products.map((product) => (
            <TouchableOpacity key={product.id} style={styles.productItem}>
              <View style={[styles.productImage, { 
                backgroundColor: shopIsDark ? 'rgba(71,85,105,0.5)' : 'rgba(232,244,253,0.9)',
                borderColor: shopIsDark ? 'rgba(100,116,139,0.3)' : 'rgba(200,220,240,0.6)',
              }]}>
                <Ionicons name="cube-outline" size={36} color={accentBlue} />
              </View>
              <Text style={[styles.productPrice, { color: textPrimary }]}>
                ${product.price.toFixed(2)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  }, (prevProps, nextProps) => {
    // Custom comparison for memo
    return (
      prevProps.shop.id === nextProps.shop.id &&
      prevProps.isDark === nextProps.isDark
    );
  });

  // ========== Build Feed Data with Posts and Shops (every 3 posts) ==========
  type FeedItem = { type: 'post'; data: Post } | { type: 'shop'; data: ClinicShop };
  
  const feedData = useMemo((): FeedItem[] => {
    const feed: FeedItem[] = [];
    let shopIndex = 0;

    // Filter out hidden posts
    const visiblePosts = posts.filter(post => !hiddenPosts.has(post.id));

    visiblePosts.forEach((post, index) => {
      feed.push({ type: 'post', data: post });
      
      // Add shop after every 3 posts
      if ((index + 1) % 3 === 0 && shopIndex < shops.length) {
        feed.push({ type: 'shop', data: shops[shopIndex] });
        shopIndex++;
      }
    });

    return feed;
  }, [posts, shops, hiddenPosts]);

  // Initialize animation values for all posts (outside render)
  useEffect(() => {
    posts.forEach(post => {
      if (!likeAnimations.current[post.id]) {
        likeAnimations.current[post.id] = new Animated.Value(1);
      }
      if (!saveAnimations.current[post.id]) {
        saveAnimations.current[post.id] = new Animated.Value(1);
      }
    });
  }, [posts]);

  // Feed item renderer for FlatList - now with proper props
  const renderFeedItem = useCallback(({ item }: { item: FeedItem }) => {
    if (item.type === 'post') {
      const post = item.data;
      const postId = post.id;
      return (
        <PostItem 
          post={post}
          isLiked={likedPosts.has(postId)}
          isSaved={savedPosts.has(postId)}
          likeCount={likeCounts[postId] ?? post.likes}
          isLoadingLike={loadingLike === postId}
          isLoadingSave={loadingSave === postId}
          isDark={isDark}
          textColor={colors.textPrimary}
          likeAnimation={likeAnimations.current[postId] || new Animated.Value(1)}
          saveAnimation={saveAnimations.current[postId] || new Animated.Value(1)}
          onLike={() => toggleLike(postId, post.likes)}
          onSave={() => toggleSave(postId)}
          onShare={() => handleShare(post)}
          onMenu={() => openPostMenu(post)}
          isProUser={isProUser}
        />
      );
    }
    return (
      <ShopSection 
        shop={item.data} 
        isDark={isDark}
        textPrimary={colors.textPrimary}
        textSecondary={colors.textSecondary}
        accentBlue={colors.accentBlue}
      />
    );
  }, [likedPosts, savedPosts, likeCounts, loadingLike, loadingSave, isDark, colors, toggleLike, toggleSave, handleShare, openPostMenu, isProUser]);

  // Key extractor for feed items
  const feedKeyExtractor = useCallback((item: FeedItem) => {
    return item.type === 'post' ? `post-${item.data.id}` : `shop-${item.data.id}`;
  }, []);

  // Estimate item heights for getItemLayout (Post ~440, Shop ~220)
  const POST_HEIGHT = 440;
  const SHOP_HEIGHT = 220;
  
  const getItemLayout = useCallback((data: FeedItem[] | null | undefined, index: number) => {
    if (!data || index < 0) return { length: POST_HEIGHT, offset: 0, index };
    
    let offset = 0;
    for (let i = 0; i < index; i++) {
      offset += data[i]?.type === 'post' ? POST_HEIGHT : SHOP_HEIGHT;
    }
    const length = data[index]?.type === 'post' ? POST_HEIGHT : SHOP_HEIGHT;
    
    return { length, offset, index };
  }, []);

  // ========== Memoized Story renderItem for horizontal list ==========
  const renderStoryItem = useCallback(({ item, index }: { item: Story; index: number }) => (
    <StoryItem 
      story={item} 
      index={index} 
      isDark={isDark}
      textColor={colors.textPrimary}
      onPress={() => handleStoryPress(item)}
      isProUser={isProUser}
    />
  ), [isDark, colors.textPrimary, handleStoryPress, isProUser]);

  // ========== Memoized List Header Component ==========
  const ListHeader = useMemo(() => (
    <View style={[styles.storiesSection, { 
      borderBottomColor: isDark ? 'rgba(71,85,105,0.3)' : 'rgba(180,210,240,0.3)',
      backgroundColor: 'transparent',
    }]}>
      <FlatList
        data={stories}
        keyExtractor={(item) => item.id}
        renderItem={renderStoryItem}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.storiesList}
        removeClippedSubviews={true}
        maxToRenderPerBatch={5}
        windowSize={5}
        initialNumToRender={5}
        getItemLayout={(data, index) => ({ length: 80, offset: 80 * index, index })}
      />
    </View>
  ), [isDark, stories, renderStoryItem]);

  // ========== Memoized List Footer Component ==========
  const ListFooter = useMemo(() => (
    <>
      {/* Bottom CTA with glassmorphism */}
      <View style={[styles.bottomCTAWrapper, { marginHorizontal: 16, marginTop: 12 }]}>
        <LinearGradient
          colors={['#3B8DF8', '#2C7BE5', '#1E6FD9']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.bottomCTA}
        >
          <Ionicons name="star" size={20} color="#fff" />
          <Text style={styles.bottomCTAText}>
            Subscribe to BeSmile AI Pro
          </Text>
          <Ionicons name="arrow-forward" size={18} color="#fff" />
        </LinearGradient>
      </View>
      {/* Extra padding for bottom nav */}
      <View style={{ height: 120 }} />
    </>
  ), []);

  // ========== Story Viewer Modal ==========
  const StoryViewer = () => {
    if (!selectedStory) return null;

    return (
      <Modal 
        visible={storyViewerVisible} 
        animationType="fade" 
        transparent={false}
        onRequestClose={() => setStoryViewerVisible(false)}
      >
        <LinearGradient
          colors={isDark ? ['#0F172A', '#1E293B'] : ['#E8F4FD', '#FFFFFF']}
          style={styles.storyViewerContainer}
        >
          <TouchableOpacity 
            style={styles.storyCloseBtn} 
            onPress={() => setStoryViewerVisible(false)}
          >
            <Ionicons name="close" size={28} color={colors.textPrimary} />
          </TouchableOpacity>

          <View style={styles.storyViewerContent}>
            <AnimatedStarShape 
              size={160} 
              icon={selectedStory.icon} 
              isDark={isDark}
              uniqueId={`viewer_${selectedStory.id}`}
            />
            <Text style={[styles.storyViewerName, { color: colors.textPrimary }]}>
              {selectedStory.name}
            </Text>
          </View>

          <View style={styles.storyViewerActions}>
            <TouchableOpacity style={[styles.storyActionBtn, { backgroundColor: colors.accentBlue }]}>
              <Ionicons name="play" size={18} color="#fff" />
              <Text style={styles.storyActionText}>Replay</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.storyActionBtnOutline, { borderColor: colors.cardBorder }]}
              onPress={() => setStoryViewerVisible(false)}
            >
              <Text style={[styles.storyActionTextOutline, { color: colors.textPrimary }]}>
                Watch more
              </Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </Modal>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* ========== LAYER 1: Base Gradient Background ========== */}
      {/* Multi-stop linear gradient: top-left to bottom-right */}
      {/* Colors: #E0F2FE (0%) -> #E4F3FC (20%) -> #EDF8FF (40%) -> #F5FBFF (60%) -> #E4F5FC (80%) -> #E0F2FE (100%) */}
      <LinearGradient
        colors={isDark 
          ? ['#0F172A', '#1E293B', '#162033', '#1E293B', '#0F172A'] 
          : ['#E0F2FE', '#E4F3FC', '#EDF8FF', '#F5FBFF', '#E4F5FC', '#E0F2FE']
        }
        locations={isDark ? [0, 0.25, 0.5, 0.75, 1] : [0, 0.2, 0.4, 0.6, 0.8, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      {/* ========== LAYER 2: Light Beam Effects (Glow Overlays) ========== */}
      
      {/* Top-Left Corner Glow: White beam - rgba(255,255,255,0.85) -> transparent */}
      {!isDark && (
        <LinearGradient
          colors={[
            'rgba(255,255,255,0.9)', 
            'rgba(255,255,255,0.7)', 
            'rgba(255,255,255,0.45)', 
            'rgba(255,255,255,0.2)',
            'rgba(255,255,255,0.05)',
            'rgba(255,255,255,0)'
          ]}
          locations={[0, 0.15, 0.3, 0.5, 0.7, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.7, y: 0.7 }}
          style={StyleSheet.absoluteFillObject}
        />
      )}

      {/* Top-Right Soft Blue Glow: rgba(186,230,253,0.4) -> transparent */}
      {!isDark && (
        <LinearGradient
          colors={[
            'rgba(186,230,253,0.5)', 
            'rgba(186,230,253,0.35)', 
            'rgba(186,230,253,0.2)',
            'rgba(186,230,253,0.08)',
            'rgba(255,255,255,0)'
          ]}
          locations={[0, 0.2, 0.45, 0.7, 1]}
          start={{ x: 1, y: 0 }}
          end={{ x: 0.15, y: 0.55 }}
          style={StyleSheet.absoluteFillObject}
        />
      )}

      {/* Center Radiant Burst: rgba(255,255,255,0.5) - soft diffused glow */}
      {!isDark && (
        <LinearGradient
          colors={[
            'rgba(255,255,255,0)', 
            'rgba(255,255,255,0.2)', 
            'rgba(255,255,255,0.55)', 
            'rgba(255,255,255,0.55)', 
            'rgba(255,255,255,0.2)', 
            'rgba(255,255,255,0)'
          ]}
          locations={[0, 0.2, 0.4, 0.6, 0.8, 1]}
          start={{ x: 0.5, y: 0.1 }}
          end={{ x: 0.5, y: 0.65 }}
          style={StyleSheet.absoluteFillObject}
        />
      )}

      {/* Bottom-Center Soft Uplighting - blends naturally */}
      {!isDark && (
        <LinearGradient
          colors={[
            'rgba(255,255,255,0)',
            'rgba(232,244,253,0.3)',
            'rgba(224,242,254,0.4)'
          ]}
          locations={[0, 0.6, 1]}
          start={{ x: 0.5, y: 0.5 }}
          end={{ x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
      )}

      {/* ========== LAYER 3: Sparkle Particles (top 70%) ========== */}
      {/* Optimized: 18 particles (10 dots, 4 stars, 2 cross, 2 shimmers) */}
      {!isDark && <SparkleParticles />}

      {/* Diagonal shimmer wave overlay - dreamy light band */}
      {!isDark && (
        <View style={styles.sparkleOverlay} pointerEvents="none">
          <LinearGradient
            colors={[
              'rgba(255,255,255,0)',
              'rgba(255,255,255,0.08)',
              'rgba(255,255,255,0.2)',
              'rgba(255,255,255,0.25)',
              'rgba(255,255,255,0.2)',
              'rgba(255,255,255,0.08)',
              'rgba(255,255,255,0)'
            ]}
            locations={[0, 0.15, 0.35, 0.5, 0.65, 0.85, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0.8 }}
            style={StyleSheet.absoluteFillObject}
          />
        </View>
      )}

      {/* Extra soft vignette for depth */}
      {!isDark && (
        <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
          <LinearGradient
            colors={[
              'rgba(224,242,254,0)',
              'rgba(224,242,254,0)',
              'rgba(224,242,254,0.15)',
              'rgba(224,242,254,0.25)'
            ]}
            locations={[0, 0.5, 0.8, 1]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />
        </View>
      )}

      {/* Header - transparent to blend with gradient */}
      <View style={[
        styles.header, 
        { 
          borderBottomColor: isDark ? 'rgba(71,85,105,0.3)' : 'rgba(180,210,240,0.3)',
          backgroundColor: 'transparent',
        }
      ]}>
        {/* Left spacer for balance */}
        <View style={styles.headerLeftSpacer} />
        {/* Right: Three-dots menu */}
        <TouchableOpacity 
          style={styles.headerMenuBtn}
          onPress={() => setMenuModalVisible(true)}
        >
          <Ionicons name="ellipsis-vertical" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        {/* Title - Absolutely centered (rendered last for proper z-order) */}
        <View style={styles.headerTitleContainer}>
          <Text style={[styles.headerTitle, { color: isDark ? '#F8FAFC' : '#1E3A5F' }]}>
            BeSmile AI
          </Text>
        </View>
      </View>

      {/* Main Content - Optimized FlatList */}
      <FlatList
        data={feedData}
        keyExtractor={feedKeyExtractor}
        renderItem={renderFeedItem}
        getItemLayout={getItemLayout}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        // Pull-to-Refresh
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={isDark ? '#3D9EFF' : '#1E66FF'}
            colors={['#1E66FF', '#3D9EFF']} // Android
            progressBackgroundColor={isDark ? '#1E293B' : '#FFFFFF'}
            title="Refreshing..."
            titleColor={isDark ? '#94A3B8' : '#64748B'}
          />
        }
        // Performance optimizations
        removeClippedSubviews={Platform.OS === 'android'}
        maxToRenderPerBatch={4}
        updateCellsBatchingPeriod={30}
        windowSize={7}
        initialNumToRender={4}
        // Additional optimizations for smooth scrolling
        maintainVisibleContentPosition={undefined}
        disableVirtualization={false}
        scrollEventThrottle={16}
        // Memoized Header & Footer
        ListHeaderComponent={ListHeader}
        ListFooterComponent={ListFooter}
      />

      {/* Menu Modal */}
      <Modal
        visible={menuModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setMenuModalVisible(false)}
      >
        <TouchableOpacity 
          style={styles.menuOverlay}
          onPress={() => setMenuModalVisible(false)}
          activeOpacity={1}
        >
          <View style={[styles.menuPanel, { backgroundColor: isDark ? '#1E293B' : '#FFFFFF' }]}>
            {/* Saved Posts - Primary Action (PRO FEATURE) */}
            <TouchableOpacity 
              style={[styles.menuItem, styles.menuItemHighlight]}
              onPress={() => {
                if (!isProUser) {
                  setMenuModalVisible(false);
                  showProOnlyAlert('Saved posts');
                  return;
                }
                setMenuModalVisible(false);
                router.push('/saved-posts' as any);
              }}
            >
              <View style={styles.menuItemIconWrap}>
                <Ionicons 
                  name="bookmark-outline" 
                  size={20} 
                  color={isProUser ? colors.textPrimary : colors.textSecondary} 
                />
              </View>
              <Text style={[styles.menuItemText, { color: isProUser ? colors.textPrimary : colors.textSecondary }]}>
                Saved Posts {!isProUser && '🔒'}
              </Text>
            </TouchableOpacity>

            {/* Divider */}
            <View style={[styles.menuDivider, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }]} />

            {/* Settings (PRO FEATURE) */}
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => {
                if (!isProUser) {
                  setMenuModalVisible(false);
                  showProOnlyAlert('Settings');
                  return;
                }
                setMenuModalVisible(false);
                // Navigate to settings when implemented
              }}
            >
              <View style={styles.menuItemIconWrap}>
                <Ionicons name="settings-outline" size={20} color={isProUser ? colors.textPrimary : colors.textSecondary} />
              </View>
              <Text style={[styles.menuItemText, { color: isProUser ? colors.textPrimary : colors.textSecondary }]}>
                Settings {!isProUser && '🔒'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem}>
              <View style={styles.menuItemIconWrap}>
                <Ionicons name="help-circle-outline" size={20} color={colors.textPrimary} />
              </View>
              <Text style={[styles.menuItemText, { color: colors.textPrimary }]}>Help</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem}>
              <View style={styles.menuItemIconWrap}>
                <Ionicons name="information-circle-outline" size={20} color={colors.textPrimary} />
              </View>
              <Text style={[styles.menuItemText, { color: colors.textPrimary }]}>About</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ========== Post Options Menu Modal ========== */}
      <Modal
        visible={postMenuVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={closePostMenu}
      >
        <TouchableOpacity 
          style={styles.postMenuOverlay} 
          activeOpacity={1} 
          onPress={closePostMenu}
        >
          <View style={styles.postMenuContainer}>
            {/* Handle bar */}
            <View style={styles.postMenuHandle} />
            
            {/* Menu Items */}
            <View style={styles.postMenuContent}>
              {/* Save Button */}
              <TouchableOpacity 
                style={styles.postMenuItem} 
                onPress={handleSaveFromMenu}
                activeOpacity={0.7}
              >
                <View style={styles.postMenuIconBox}>
                  <Ionicons 
                    name="bookmark-outline" 
                    size={24} 
                    color="#1E3A5F" 
                  />
                </View>
                <Text style={styles.postMenuLabel}>Save</Text>
              </TouchableOpacity>

              {/* About This Account - Disabled */}
              <TouchableOpacity 
                style={[styles.postMenuItem, styles.postMenuItemDisabled]} 
                disabled={true}
                activeOpacity={1}
              >
                <View style={[styles.postMenuIconBox, { opacity: 0.4 }]}>
                  <Ionicons name="person-circle-outline" size={24} color="#9CA3AF" />
                </View>
                <Text style={[styles.postMenuLabel, { color: '#9CA3AF' }]}>About this account</Text>
              </TouchableOpacity>

              {/* QR Code */}
              <TouchableOpacity 
                style={styles.postMenuItem} 
                onPress={handleQrCode}
                activeOpacity={0.7}
              >
                <View style={styles.postMenuIconBox}>
                  <Ionicons name="qr-code-outline" size={24} color="#1E3A5F" />
                </View>
                <Text style={styles.postMenuLabel}>QR code</Text>
              </TouchableOpacity>

              {/* Hide */}
              <TouchableOpacity 
                style={styles.postMenuItem} 
                onPress={handleHidePost}
                activeOpacity={0.7}
              >
                <View style={styles.postMenuIconBox}>
                  <Ionicons name="eye-off-outline" size={24} color="#1E3A5F" />
                </View>
                <Text style={styles.postMenuLabel}>Hide</Text>
              </TouchableOpacity>

              {/* Report */}
              <TouchableOpacity 
                style={styles.postMenuItem} 
                onPress={handleReportPost}
                activeOpacity={0.7}
              >
                <View style={styles.postMenuIconBox}>
                  <Ionicons name="alert-circle-outline" size={24} color="#EF4444" />
                </View>
                <Text style={[styles.postMenuLabel, { color: '#EF4444' }]}>Report</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ========== QR Code Modal ========== */}
      <Modal
        visible={qrModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setQrModalVisible(false)}
      >
        <View style={styles.qrModalOverlay}>
          <View style={styles.qrModalContainer}>
            {/* QR Card - Wrapped in ViewShot for saving */}
            <ViewShot 
              ref={qrViewShotRef} 
              options={{ format: 'png', quality: 1, result: 'tmpfile' }}
              style={{ backgroundColor: 'transparent' }}
            >
              <View style={styles.qrCard}>
                {/* Real QR Code Display */}
                <View style={styles.qrCodeWrapper}>
                  <View style={styles.qrCodeBox}>
                    {selectedPostForMenu && (
                      <QRCode
                        value={generatePostDeepLink(selectedPostForMenu.id)}
                        size={180}
                        color={qrColors[qrColorIndex].primary}
                        backgroundColor="#FFFFFF"
                        quietZone={10}
                        enableLinearGradient={false}
                        ecl="M"
                      />
                    )}
                  </View>
                </View>
              
              {/* Post Meta Info - Instagram Typography */}
              <View style={styles.qrMetaInfo}>
                <Text style={styles.qrDateText}>
                  POST SHARED ON {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' }).toUpperCase()}
                </Text>
                <Text style={styles.qrByText}>
                  BY {selectedPostForMenu?.author?.toUpperCase() || 'BESMILE AI'}
                </Text>
                {/* Show Post ID for verification */}
                <Text style={styles.qrPostIdText}>
                  ID: {selectedPostForMenu?.id || 'N/A'}
                </Text>
              </View>
            </View>
          </ViewShot>

            {/* Color Theme Picker - Instagram Style */}
            <View style={styles.qrThemePicker}>
              {qrColors.map((color, index) => (
                <TouchableOpacity 
                  key={index}
                  style={[
                    styles.qrThemeBubble,
                    qrColorIndex === index && {
                      borderColor: color.primary,
                      shadowColor: color.primary,
                      shadowOpacity: 0.5,
                      shadowRadius: 8,
                      shadowOffset: { width: 0, height: 0 },
                      elevation: 6,
                    }
                  ]}
                  onPress={() => setQrColorIndex(index)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.qrThemeInner, { backgroundColor: color.primary }]} />
                </TouchableOpacity>
              ))}
            </View>

            {/* QR URL Preview */}
            <Text style={styles.qrUrlPreview}>
              {selectedPostForMenu ? generatePostDeepLink(selectedPostForMenu.id) : ''}
            </Text>

            {/* Action Buttons */}
            <View style={styles.qrButtonsContainer}>
              <TouchableOpacity 
                style={[
                  styles.qrSaveBtn, 
                  { backgroundColor: qrColors[qrColorIndex].primary },
                  isSavingQr && { opacity: 0.7 }
                ]} 
                onPress={handleSaveQrToGallery}
                activeOpacity={0.9}
                disabled={isSavingQr}
              >
                {isSavingQr ? (
                  <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 8 }} />
                ) : (
                  <Ionicons name="download-outline" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                )}
                <Text style={styles.qrSaveBtnText}>
                  {isSavingQr ? 'Saving...' : 'Save to Camera Roll'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.qrShareBtn} 
                onPress={() => {
                  if (selectedPostForMenu) {
                    const deepLink = generatePostDeepLink(selectedPostForMenu.id);
                    Share.share({
                      message: `Check out this post on BeSmile AI: ${deepLink}`,
                      url: deepLink,
                      title: selectedPostForMenu.title,
                    });
                  }
                }}
                activeOpacity={0.8}
              >
                <Ionicons name="share-outline" size={16} color={qrColors[qrColorIndex].primary} style={{ marginRight: 6 }} />
                <Text style={[styles.qrShareBtnText, { color: qrColors[qrColorIndex].primary }]}>Share Link</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.qrDoneBtn} 
                onPress={() => setQrModalVisible(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.qrDoneBtnText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ========== Report Modal ========== */}
      <Modal
        visible={reportModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setReportModalVisible(false)}
      >
        <View style={styles.reportModalOverlay}>
          <View style={styles.reportModalContainer}>
            {/* Header */}
            <View style={styles.reportHeader}>
              <TouchableOpacity onPress={() => setReportModalVisible(false)}>
                <Ionicons name="close" size={24} color="#1E3A5F" />
              </TouchableOpacity>
              <Text style={styles.reportTitle}>Report</Text>
              <View style={{ width: 24 }} />
            </View>

            <Text style={styles.reportSubtitle}>Why are you reporting this post?</Text>
            <Text style={styles.reportDescription}>
              Your report is anonymous. If someone is in immediate danger, call local emergency services.
            </Text>

            {/* Report Reasons */}
            <ScrollView style={styles.reportReasonsList}>
              {reportReasons.map((reason) => (
                <TouchableOpacity 
                  key={reason.id}
                  style={[
                    styles.reportReasonItem,
                    selectedReportReason === reason.id && styles.reportReasonSelected
                  ]}
                  onPress={() => setSelectedReportReason(reason.id)}
                >
                  <View style={styles.reportReasonLeft}>
                    <Ionicons 
                      name={reason.icon as any} 
                      size={22} 
                      color={selectedReportReason === reason.id ? '#2C7BE5' : '#64748B'} 
                    />
                    <Text style={[
                      styles.reportReasonText,
                      selectedReportReason === reason.id && { color: '#2C7BE5' }
                    ]}>
                      {reason.label}
                    </Text>
                  </View>
                  <View style={[
                    styles.reportRadio,
                    selectedReportReason === reason.id && styles.reportRadioSelected
                  ]}>
                    {selectedReportReason === reason.id && (
                      <View style={styles.reportRadioInner} />
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Submit Button */}
            <TouchableOpacity 
              style={[
                styles.reportSubmitButton,
                !selectedReportReason && styles.reportSubmitButtonDisabled
              ]}
              onPress={submitReport}
              disabled={!selectedReportReason}
            >
              <Text style={[
                styles.reportSubmitButtonText,
                !selectedReportReason && { color: '#9CA3AF' }
              ]}>
                Submit Report
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ========== Share Options Modal ========== */}
      <Modal
        visible={shareModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShareModalVisible(false)}
      >
        <TouchableOpacity 
          style={styles.shareModalOverlay}
          activeOpacity={1}
          onPress={() => setShareModalVisible(false)}
        >
          <View 
            style={[styles.shareModalContainer, { backgroundColor: isDark ? '#1E293B' : '#FFFFFF' }]}
            onStartShouldSetResponder={() => true}
          >
            <View style={styles.shareModalHandle} />
            
            {/* Header */}
            <View style={styles.shareModalHeader}>
              <Text style={[styles.shareModalTitle, { color: colors.textPrimary }]}>
                Share
              </Text>
              <TouchableOpacity onPress={() => setShareModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Post Preview */}
            {selectedPostForShare && (
              <View style={[styles.sharePostPreview, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
                <View style={styles.sharePostImage}>
                  <ExpoImage 
                    source={{ uri: 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=200' }}
                    style={{ width: '100%', height: '100%' }}
                    contentFit="cover"
                  />
                </View>
                <View style={styles.sharePostInfo}>
                  <Text style={[styles.sharePostTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                    {selectedPostForShare.title}
                  </Text>
                  <Text style={[styles.sharePostAuthor, { color: colors.textSecondary }]} numberOfLines={1}>
                    by {selectedPostForShare.author}
                  </Text>
                </View>
              </View>
            )}

            {/* Share Options */}
            <View style={styles.shareOptionsContainer}>
              {/* Add to Story - PRO Feature */}
              <TouchableOpacity 
                style={styles.shareOption}
                onPress={handleAddToStory}
              >
                <View style={[styles.shareOptionIcon, { backgroundColor: '#E040FB' }]}>
                  <Ionicons name="add-circle" size={24} color="#FFFFFF" />
                </View>
                <View style={styles.shareOptionTextContainer}>
                  <Text style={[styles.shareOptionLabel, { color: colors.textPrimary }]}>
                    Add to Story {!isProUser && '🔒'}
                  </Text>
                  <Text style={[styles.shareOptionSublabel, { color: colors.textSecondary }]}>
                    Share to your story
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
              </TouchableOpacity>

              {/* Share Externally */}
              <TouchableOpacity 
                style={styles.shareOption}
                onPress={handleNativeShare}
              >
                <View style={[styles.shareOptionIcon, { backgroundColor: '#2C7BE5' }]}>
                  <Ionicons name="share-outline" size={24} color="#FFFFFF" />
                </View>
                <View style={styles.shareOptionTextContainer}>
                  <Text style={[styles.shareOptionLabel, { color: colors.textPrimary }]}>
                    Share to...
                  </Text>
                  <Text style={[styles.shareOptionSublabel, { color: colors.textSecondary }]}>
                    Messages, social media, etc.
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
              </TouchableOpacity>

              {/* Copy Link */}
              <TouchableOpacity 
                style={styles.shareOption}
                onPress={handleCopyLink}
              >
                <View style={[styles.shareOptionIcon, { backgroundColor: '#10B981' }]}>
                  <Ionicons name="link" size={24} color="#FFFFFF" />
                </View>
                <View style={styles.shareOptionTextContainer}>
                  <Text style={[styles.shareOptionLabel, { color: colors.textPrimary }]}>
                    Copy Link
                  </Text>
                  <Text style={[styles.shareOptionSublabel, { color: colors.textSecondary }]}>
                    Copy post URL to clipboard
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Cancel Button */}
            <TouchableOpacity 
              style={[styles.shareCancelButton, { borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]}
              onPress={() => setShareModalVisible(false)}
            >
              <Text style={[styles.shareCancelText, { color: colors.textSecondary }]}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ========== Story Creator Modal ========== */}
      <Modal
        visible={storyCreatorVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={closeStoryCreator}
      >
        <View style={[styles.storyCreatorContainer, { backgroundColor: isDark ? '#0F172A' : '#F8FAFC' }]}>
          {/* Header */}
          <View style={[styles.storyCreatorHeader, { borderBottomColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }]}>
            <TouchableOpacity onPress={closeStoryCreator} style={styles.storyCreatorCloseBtn}>
              <Ionicons name="close" size={28} color={colors.textPrimary} />
            </TouchableOpacity>
            <Text style={[styles.storyCreatorTitle, { color: colors.textPrimary }]}>
              Create Story
            </Text>
            <View style={{ width: 44 }} />
          </View>

          {/* Story Preview Area */}
          <View style={styles.storyPreviewArea}>
            <View style={[styles.storyPreviewCard, { backgroundColor: isDark ? '#1E293B' : '#FFFFFF' }]}>
              {/* Background Gradient */}
              <LinearGradient
                colors={isDark ? ['#1E3A5F', '#0F172A'] : ['#E0F2FE', '#DBEAFE']}
                style={StyleSheet.absoluteFillObject}
              />
              
              {/* Post Card inside Story */}
              {selectedPostForShare && (
                <View style={styles.storyPostCard}>
                  <View style={styles.storyPostImageContainer}>
                    <ExpoImage 
                      source={{ uri: 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=400' }}
                      style={styles.storyPostImage}
                      contentFit="cover"
                    />
                    {/* Post overlay info */}
                    <LinearGradient
                      colors={['transparent', 'rgba(0,0,0,0.7)']}
                      style={styles.storyPostOverlay}
                    >
                      <View style={styles.storyPostInfo}>
                        <Text style={styles.storyPostTitle} numberOfLines={1}>
                          {selectedPostForShare.title}
                        </Text>
                        <Text style={styles.storyPostAuthor}>
                          {selectedPostForShare.author}
                        </Text>
                      </View>
                    </LinearGradient>
                  </View>
                  
                  {/* BeSmile AI branding */}
                  <View style={styles.storyBrandingBadge}>
                    <Text style={styles.storyBrandingText}>🦷 BeSmile AI</Text>
                  </View>
                </View>
              )}

              {/* Caption Input */}
              {storyCaption !== '' && (
                <View style={styles.storyCaptionPreview}>
                  <Text style={styles.storyCaptionText}>{storyCaption}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Caption Input Area */}
          <View style={[styles.captionInputArea, { backgroundColor: isDark ? '#1E293B' : '#FFFFFF' }]}>
            <TextInput
              style={[styles.captionInput, { color: colors.textPrimary }]}
              placeholder="Add a caption..."
              placeholderTextColor={colors.textSecondary}
              value={storyCaption}
              onChangeText={setStoryCaption}
              multiline
              maxLength={150}
            />
            <Text style={[styles.captionCounter, { color: colors.textSecondary }]}>
              {storyCaption.length}/150
            </Text>
          </View>

          {/* Audience Selection */}
          <View style={styles.audienceContainer}>
            <Text style={[styles.audienceLabel, { color: colors.textSecondary }]}>
              Share to:
            </Text>
            <View style={styles.audienceOptions}>
              <TouchableOpacity 
                style={[
                  styles.audienceOption,
                  selectedStoryAudience === 'everyone' && styles.audienceOptionSelected,
                  { borderColor: selectedStoryAudience === 'everyone' ? '#2C7BE5' : (isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)') }
                ]}
                onPress={() => setSelectedStoryAudience('everyone')}
              >
                <Ionicons 
                  name="earth" 
                  size={20} 
                  color={selectedStoryAudience === 'everyone' ? '#2C7BE5' : colors.textSecondary} 
                />
                <Text style={[
                  styles.audienceOptionText,
                  { color: selectedStoryAudience === 'everyone' ? '#2C7BE5' : colors.textPrimary }
                ]}>
                  Your Story
                </Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[
                  styles.audienceOption,
                  selectedStoryAudience === 'close-friends' && styles.audienceOptionSelected,
                  { borderColor: selectedStoryAudience === 'close-friends' ? '#10B981' : (isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)') }
                ]}
                onPress={() => setSelectedStoryAudience('close-friends')}
              >
                <Ionicons 
                  name="star" 
                  size={20} 
                  color={selectedStoryAudience === 'close-friends' ? '#10B981' : colors.textSecondary} 
                />
                <Text style={[
                  styles.audienceOptionText,
                  { color: selectedStoryAudience === 'close-friends' ? '#10B981' : colors.textPrimary }
                ]}>
                  Close Friends
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Publish Button */}
          <View style={styles.publishButtonContainer}>
            <TouchableOpacity 
              style={styles.publishButton}
              onPress={handlePublishStory}
            >
              <LinearGradient
                colors={['#2C7BE5', '#1E5BB0']}
                style={styles.publishButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Ionicons name="paper-plane" size={20} color="#FFFFFF" />
                <Text style={styles.publishButtonText}>Share to Story</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Story Viewer */}
      <StoryViewer />
    </View>
  );
}

// ========== Star Shape Styles ==========
const starStyles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  innerCircle: {
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  contentCircle: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  plusBadge: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
});

// ========== Main Styles ==========
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  sparkleOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.7,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 56 : 20,
    paddingBottom: 14,
    borderBottomWidth: 0.5,
  },
  headerTitleContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 56 : 20,
    paddingBottom: 14,
    pointerEvents: 'none',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  headerLeftSpacer: {
    width: 44,
    height: 44,
  },
  headerMenuBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  menuBadge: {
    position: 'absolute',
    top: 6,
    right: 4,
    backgroundColor: '#FF6B6B',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  menuBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
  },

  scrollContent: {
    paddingBottom: 20,
  },

  // Stories Section with glassmorphism
  storiesSection: {
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderBottomWidth: 0,
    marginHorizontal: 8,
    borderRadius: 20,
    marginTop: 4,
  },
  storiesList: {
    paddingHorizontal: 12,
    gap: 8,
  },
  storyItem: {
    alignItems: 'center',
    marginHorizontal: 4,
    width: 78,
  },
  storyName: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 6,
    textAlign: 'center',
  },
  storyNameSmall: {
    fontSize: 10,
  },

  // Feed Section
  feedSection: {
    paddingTop: 8,
  },

  // Post Card - Instagram-like with Premium Glassmorphism
  postCard: {
    marginBottom: 16,
    borderRadius: 18,
    marginHorizontal: 12,
    overflow: 'hidden',
    shadowColor: '#4A90D9',
    shadowOpacity: 0.15,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  postHeaderOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 16,
    zIndex: 10,
  },
  mediaHeaderGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 90,
    zIndex: 5,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
  },
  moreButtonOverlay: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  postAuthorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  postAuthorInfo: {
    gap: 1,
  },
  postAuthorName: {
    fontSize: 15,
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  postTime: {
    fontSize: 12,
    fontWeight: '500',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  postMedia: {
    width: '100%',
    aspectRatio: 4 / 5, // Taller media for more visual impact
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
  },
  mediaImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  playButton: {
    position: 'absolute',
    zIndex: 10,
  },
  playCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(44, 123, 229, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  postActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 8,
  },
  actionsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  actionButton: {
    padding: 4,
  },
  likeCount: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    paddingTop: 2,
  },
  likeCountText: {
    fontSize: 14,
    fontWeight: '700',
  },
  actionCount: {
    fontSize: 14,
    fontWeight: '600',
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  postCaption: {
    paddingHorizontal: 14,
    paddingBottom: 14,
  },
  captionAuthor: {
    fontSize: 14,
    fontWeight: '700',
  },
  captionText: {
    fontSize: 14,
    fontWeight: '400',
    marginTop: 3,
  },

  // Shop Section - Frosted Glass with Soft Blue Shimmer
  shopCard: {
    marginHorizontal: 12,
    marginVertical: 12,
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#87CEEB',
    shadowOpacity: 0.25,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  shopHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  shopTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  shopIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shopTitle: {
    fontSize: 12,
    fontWeight: '500',
  },
  shopClinicName: {
    fontSize: 17,
    fontWeight: '700',
  },
  productsContainer: {
    gap: 14,
    paddingRight: 8,
  },
  productItem: {
    alignItems: 'center',
    width: 100,
  },
  productImage: {
    width: 88,
    height: 88,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#5DA8E8',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E3A5F',
  },

  // Bottom CTA with gradient
  bottomCTAWrapper: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#2C7BE5',
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  bottomCTA: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 10,
  },
  bottomCTAText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },

  // Story Viewer
  storyViewerContainer: {
    flex: 1,
    paddingTop: 50,
    paddingBottom: 40,
  },
  storyCloseBtn: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 20,
    right: 20,
    zIndex: 10,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  storyViewerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
  },
  storyViewerName: {
    fontSize: 24,
    fontWeight: '700',
  },
  storyViewerActions: {
    paddingHorizontal: 20,
    gap: 12,
  },
  storyActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  storyActionText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  storyActionBtnOutline: {
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  storyActionTextOutline: {
    fontSize: 16,
    fontWeight: '600',
  },

  // Menu Modal
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: Platform.OS === 'ios' ? 100 : 60,
    paddingRight: 16,
  },
  menuPanel: {
    borderRadius: 16,
    paddingVertical: 8,
    minWidth: 200,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 15,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  menuItemHighlight: {
    backgroundColor: 'rgba(44, 123, 229, 0.08)',
  },
  menuItemIconWrap: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuItemText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
  },
  menuItemBadge: {
    backgroundColor: '#2C7BE5',
    borderRadius: 10,
    minWidth: 22,
    height: 22,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  menuItemBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  menuDivider: {
    height: 1,
    marginVertical: 6,
    marginHorizontal: 16,
  },

  // ========== Post Options Menu Styles ==========
  postMenuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  postMenuContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  postMenuHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  postMenuContent: {
    paddingHorizontal: 16,
  },
  postMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 14,
  },
  postMenuItemDisabled: {
    opacity: 0.5,
  },
  postMenuIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  postMenuLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1E3A5F',
  },

  // ========== QR Code Modal Styles - Instagram Exact ==========
  qrModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  qrModalContainer: {
    backgroundColor: 'rgba(255,255,255,0.97)',
    borderRadius: 28,
    paddingVertical: 32,
    paddingHorizontal: 24,
    width: '100%',
    maxWidth: 350,
    alignItems: 'center',
    // Soft diffused shadow
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 10 },
    elevation: 20,
  },
  qrCard: {
    backgroundColor: 'rgba(248,250,252,0.9)',
    borderRadius: 22,
    paddingTop: 28,
    paddingHorizontal: 20,
    paddingBottom: 24,
    alignItems: 'center',
    marginBottom: 28,
    width: '100%',
    // Subtle frosted effect
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  qrCodeWrapper: {
    marginBottom: 24,
  },
  qrCodeBox: {
    width: 220,
    height: 220,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    // Subtle soft shadow
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  qrPatternArea: {
    width: 200,
    height: 200,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Instagram-Style Finder Patterns (Soft Circular Corners)
  qrFinderWrapper: {
    position: 'absolute',
    width: 40,
    height: 40,
  },
  qrFinderOuter: {
    width: 40,
    height: 40,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrFinderCutout: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrFinderCore: {
    width: 14,
    height: 14,
    borderRadius: 6,
  },
  qrFinderTL: {
    top: 8,
    left: 8,
  },
  qrFinderTR: {
    top: 8,
    right: 8,
  },
  qrFinderBL: {
    bottom: 8,
    left: 8,
  },
  // QR Module Grid - Rounded Dots
  qrModuleGrid: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrModuleRow: {
    flexDirection: 'row',
  },
  qrModule: {
    width: 8,
    height: 8,
    margin: 0.5,
    borderRadius: 4,
    backgroundColor: 'transparent',
  },
  // Center Logo Embed - Slightly Smaller
  qrLogoWrapper: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    padding: 6,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  qrLogoCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrLogoIcon: {
    fontSize: 20,
  },
  // Meta Info - Instagram Typography (Airy Spacing)
  qrMetaInfo: {
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  qrDateText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1F2937',
    letterSpacing: 1.8,
    textAlign: 'center',
  },
  qrByText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#9CA3AF',
    letterSpacing: 0.8,
    textAlign: 'center',
  },
  qrPostIdText: {
    fontSize: 9,
    fontWeight: '400',
    color: '#CBD5E1',
    letterSpacing: 0.5,
    textAlign: 'center',
    marginTop: 4,
  },
  qrUrlPreview: {
    fontSize: 10,
    fontWeight: '500',
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: '#F1F5F9',
    paddingVertical: 8,
    borderRadius: 8,
    overflow: 'hidden',
  },
  // Color Theme Picker - Instagram Style (More Spacing)
  qrThemePicker: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 14,
    marginBottom: 32,
    paddingTop: 4,
  },
  qrThemeBubble: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  qrThemeInner: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  // Action Buttons (Polished)
  qrButtonsContainer: {
    width: '100%',
    alignItems: 'center',
    gap: 14,
  },
  qrSaveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    width: '100%',
    borderRadius: 14,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  qrSaveBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  qrDoneBtn: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  qrDoneBtnText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#9CA3AF',
  },
  qrShareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    width: '100%',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  qrShareBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },

  // ========== Report Modal Styles ==========
  reportModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  reportModalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  reportTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E3A5F',
  },
  reportSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E3A5F',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 8,
  },
  reportDescription: {
    fontSize: 13,
    color: '#64748B',
    paddingHorizontal: 16,
    paddingBottom: 16,
    lineHeight: 18,
  },
  reportReasonsList: {
    maxHeight: 350,
  },
  reportReasonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  reportReasonSelected: {
    backgroundColor: 'rgba(44, 123, 229, 0.05)',
  },
  reportReasonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  reportReasonText: {
    fontSize: 15,
    color: '#1E3A5F',
    fontWeight: '500',
  },
  reportRadio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reportRadioSelected: {
    borderColor: '#2C7BE5',
  },
  reportRadioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#2C7BE5',
  },
  reportSubmitButton: {
    backgroundColor: '#2C7BE5',
    marginHorizontal: 16,
    marginTop: 16,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  reportSubmitButtonDisabled: {
    backgroundColor: '#E5E7EB',
  },
  reportSubmitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // ========== Share Modal Styles ==========
  shareModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  shareModalContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  shareModalHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  shareModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.08)',
  },
  shareModalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  sharePostPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 16,
    padding: 12,
    borderRadius: 12,
  },
  sharePostImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    overflow: 'hidden',
  },
  sharePostInfo: {
    flex: 1,
    marginLeft: 12,
  },
  sharePostTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  sharePostAuthor: {
    fontSize: 12,
    marginTop: 2,
  },
  shareOptionsContainer: {
    paddingHorizontal: 16,
  },
  shareOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 14,
  },
  shareOptionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareOptionTextContainer: {
    flex: 1,
  },
  shareOptionLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  shareOptionSublabel: {
    fontSize: 12,
    marginTop: 2,
  },
  shareCancelButton: {
    marginHorizontal: 16,
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  shareCancelText: {
    fontSize: 16,
    fontWeight: '600',
  },

  // ========== Story Creator Styles ==========
  storyCreatorContainer: {
    flex: 1,
  },
  storyCreatorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 56 : 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  storyCreatorCloseBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  storyCreatorTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  storyPreviewArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 20,
  },
  storyPreviewCard: {
    width: '100%',
    aspectRatio: 9 / 16,
    borderRadius: 20,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  storyPostCard: {
    width: '85%',
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 5,
  },
  storyPostImageContainer: {
    width: '100%',
    aspectRatio: 4 / 3,
    position: 'relative',
  },
  storyPostImage: {
    width: '100%',
    height: '100%',
  },
  storyPostOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 12,
    paddingVertical: 10,
    paddingTop: 30,
  },
  storyPostInfo: {
    gap: 2,
  },
  storyPostTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  storyPostAuthor: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
  },
  storyBrandingBadge: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(44, 123, 229, 0.1)',
  },
  storyBrandingText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#2C7BE5',
    textAlign: 'center',
  },
  storyCaptionPreview: {
    position: 'absolute',
    bottom: 60,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  storyCaptionText: {
    fontSize: 14,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  captionInputArea: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  captionInput: {
    flex: 1,
    fontSize: 15,
    maxHeight: 80,
  },
  captionCounter: {
    fontSize: 12,
    marginLeft: 8,
  },
  audienceContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  audienceLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 10,
  },
  audienceOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  audienceOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    gap: 8,
  },
  audienceOptionSelected: {
    backgroundColor: 'rgba(44, 123, 229, 0.05)',
  },
  audienceOptionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  publishButtonContainer: {
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  publishButton: {
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#2C7BE5',
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  publishButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  publishButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
