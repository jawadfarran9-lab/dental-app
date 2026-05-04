import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Image as ExpoImage } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Dimensions, Easing, PanResponder, Platform, Pressable, ScrollView, StatusBar, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
// Phase 17.d: Reanimated UI-thread scroll (Batch 1: infrastructure, Batch 2: worklet)
import ReAnimated, {
  Easing as ReanimatedEasing,
  scrollTo,
  useAnimatedReaction,
  useAnimatedRef,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import VideoThumbnailStrip from '@/src/components/timeline/VideoThumbnailStrip';

// Phase 17.0: Timeline pixel scale — 1 second of media = 40px
// Phase 18.b Fix #G: reduced from 80 to 40 (50% density reduction)
// to match CapCut compact timeline pattern. Yields ~10s visible
// in viewport instead of ~5s. All scroll/scrub formulas use this
// constant by name — auto-propagates to 22 reference sites.
const PIXELS_PER_SECOND = 40;

type Segment = { uri: string; duration: number; trimStart?: number; trimEnd?: number; mediaType?: 'photo' | 'video' };
type TextOverlayItem = {
  id: string; text: string; x: number; y: number;
  color: string; fontSize: number;
  startTime: number; endTime: number;
  scale: number; rotation: number;
};

// ─────────────────────────────────────────────────────────────
// Phase 11 — Overlap group computation (pure, module-scope)
// ─────────────────────────────────────────────────────────────
type OverlapGroup = {
  key: string;
  memberIds: string[];
  start: number;
  end: number;
};

function computeOverlapGroups(
  overlays: TextOverlayItem[],
): { [id: string]: OverlapGroup } {
  if (overlays.length === 0) return {};

  const sorted = [...overlays].sort((a, b) => a.startTime - b.startTime);
  const groups: { memberIds: string[]; start: number; end: number }[] = [];

  for (const ov of sorted) {
    const overlapping: number[] = [];
    for (let i = 0; i < groups.length; i++) {
      const g = groups[i];
      if (ov.startTime < g.end && ov.endTime > g.start) {
        overlapping.push(i);
      }
    }

    if (overlapping.length === 0) {
      groups.push({
        memberIds: [ov.id],
        start: ov.startTime,
        end: ov.endTime,
      });
    } else {
      const merged = {
        memberIds: [
          ...overlapping.flatMap((i) => groups[i].memberIds),
          ov.id,
        ],
        start: Math.min(
          ov.startTime,
          ...overlapping.map((i) => groups[i].start),
        ),
        end: Math.max(
          ov.endTime,
          ...overlapping.map((i) => groups[i].end),
        ),
      };
      for (let j = overlapping.length - 1; j >= 0; j--) {
        groups.splice(overlapping[j], 1);
      }
      groups.push(merged);
    }
  }

  const result: { [id: string]: OverlapGroup } = {};
  for (const g of groups) {
    const sortedIds = [...g.memberIds].sort();
    const finalGroup: OverlapGroup = {
      key: sortedIds.join(':'),
      memberIds: sortedIds,
      start: g.start,
      end: g.end,
    };
    for (const id of sortedIds) {
      result[id] = finalGroup;
    }
  }
  return result;
}

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const CARD_W = Math.floor((SCREEN_W - 32 - 10) / 2);  // grid padding 16*2, gap 10
const TEP_COLLAPSED = SCREEN_H * 0.73;  // ~27% visible
const TEP_EXPANDED = SCREEN_H * 0.20;   // ~80% visible

const TEXT_EDITOR_TABS = ['Templates', 'Fonts', 'Styles', 'Effects', 'Animations', 'Bubbles', 'Presets'];

const TEMPLATE_CATEGORIES = [
  'Trending', 'Classic', 'NEW', 'Free Fire 🔥', 'Travel', 'Autumn', 'Life',
  'Makeup', 'Spark', 'Music', 'Sports', 'Festival', 'Caption', 'Message',
  'Game', 'News', 'Time', 'Technology', 'Summer', 'Food', '3D', 'Kaomoji',
  'Campus', 'Pet', 'Outro', 'Advertisement', 'Social media', 'Vlog', 'Tag',
  'Chapter', 'Daily life', 'Hits', 'Icons', 'Title', 'Retro',
];

const TEXT_TEMPLATES: { id: string; label: string; bg: string; color: string; bold?: boolean; italic?: boolean; premium?: boolean; fontSize?: number }[] = [
  { id: '1', label: 'Default', bg: '#2a2a2a', color: '#fff' },
  { id: '2', label: 'Highlight', bg: '#2a2a2a', color: '#FFD700' },
  { id: '3', label: 'SUBSCRIBE', bg: '#D32F2F', color: '#fff', bold: true, premium: true },
  { id: '4', label: 'My Story', bg: '#2a2a2a', color: '#E0E0E0', italic: true },
  { id: '5', label: 'SHOW', bg: '#1a1a3e', color: '#4FC3F7', bold: true, premium: true },
  { id: '6', label: '"Stay\npositive"', bg: '#2a2a2a', color: '#999', italic: true, fontSize: 9 },
  { id: '7', label: 'KEEP\nGOING', bg: '#2a2a2a', color: '#fff', bold: true },
  { id: '8', label: 'WELCOME\nSUMMER', bg: '#1a3a1a', color: '#81C784', bold: true, fontSize: 9 },
  { id: '9', label: 'Abc', bg: '#2a2a2a', color: '#fff' },
  { id: '10', label: '✦', bg: '#2a1a0a', color: '#FF6D00', premium: true, fontSize: 26 },
  { id: '11', label: 'WOW', bg: '#2a1a3a', color: '#CE93D8', bold: true },
  { id: '12', label: 'Keep\nshining', bg: '#2a2a1a', color: '#FFD54F', italic: true, fontSize: 9 },
  { id: '13', label: '☎ Call', bg: '#0a2a0a', color: '#69F0AE', premium: true },
  { id: '14', label: 'BAM!', bg: '#3a1a0a', color: '#FF8A65', bold: true },
  { id: '15', label: 'Daily\nlife', bg: '#2a2a2a', color: '#90A4AE' },
  { id: '16', label: '📍 HERE', bg: '#2a2a2a', color: '#FF8A65', bold: true },
];

type TabItem = { id: string; label: string; bg: string; color: string };

const TAB_FONTS: TabItem[] = [
  { id: 'f1', label: 'Roboto', bg: '#2a2a2a', color: '#fff' },
  { id: 'f2', label: 'Montserrat', bg: '#2a2a2a', color: '#E0E0E0' },
  { id: 'f3', label: 'Bold Sans', bg: '#2a2a2a', color: '#fff' },
  { id: 'f4', label: 'Mono', bg: '#1a1a2e', color: '#4FC3F7' },
  { id: 'f5', label: 'Serif', bg: '#2a2a2a', color: '#CE93D8' },
  { id: 'f6', label: 'Handwriting', bg: '#2a2a2a', color: '#FFD54F' },
  { id: 'f7', label: 'Condensed', bg: '#2a2a2a', color: '#90A4AE' },
  { id: 'f8', label: 'Display', bg: '#2a2a1a', color: '#81C784' },
  { id: 'f9', label: 'Rounded', bg: '#2a2a2a', color: '#FF8A65' },
  { id: 'f10', label: 'Slab', bg: '#2a2a2a', color: '#999' },
];

const TAB_STYLES: TabItem[] = [
  { id: 's1', label: 'Shadow', bg: '#2a2a2a', color: '#fff' },
  { id: 's2', label: 'Outline', bg: '#2a2a2a', color: '#4FC3F7' },
  { id: 's3', label: 'Neon', bg: '#1a1a2e', color: '#69F0AE' },
  { id: 's4', label: 'Gradient', bg: '#2a1a3a', color: '#CE93D8' },
  { id: 's5', label: '3D', bg: '#2a2a2a', color: '#FF8A65' },
  { id: 's6', label: 'Retro', bg: '#2a2a1a', color: '#FFD54F' },
  { id: 's7', label: 'Glitch', bg: '#2a2a2a', color: '#E040FB' },
  { id: 's8', label: 'Emboss', bg: '#2a2a2a', color: '#90A4AE' },
];

const TAB_EFFECTS: TabItem[] = [
  { id: 'e1', label: 'Glow', bg: '#2a2a1a', color: '#FFD700' },
  { id: 'e2', label: 'Blur', bg: '#2a2a2a', color: '#90A4AE' },
  { id: 'e3', label: 'Sparkle', bg: '#1a1a2e', color: '#4FC3F7' },
  { id: 'e4', label: 'Fire', bg: '#2a1a0a', color: '#FF6D00' },
  { id: 'e5', label: 'Flicker', bg: '#2a2a2a', color: '#fff' },
  { id: 'e6', label: 'Rainbow', bg: '#2a1a3a', color: '#CE93D8' },
  { id: 'e7', label: 'Noise', bg: '#2a2a2a', color: '#999' },
  { id: 'e8', label: 'Pixelate', bg: '#2a2a2a', color: '#81C784' },
];

const TAB_ANIMATIONS: TabItem[] = [
  { id: 'a1', label: 'Fade In', bg: '#2a2a2a', color: '#fff' },
  { id: 'a2', label: 'Slide Up', bg: '#2a2a2a', color: '#4FC3F7' },
  { id: 'a3', label: 'Typewriter', bg: '#1a1a2e', color: '#69F0AE' },
  { id: 'a4', label: 'Bounce', bg: '#2a2a2a', color: '#FFD54F' },
  { id: 'a5', label: 'Scale', bg: '#2a1a3a', color: '#CE93D8' },
  { id: 'a6', label: 'Rotate', bg: '#2a2a2a', color: '#FF8A65' },
  { id: 'a7', label: 'Pop', bg: '#2a2a2a', color: '#E040FB' },
  { id: 'a8', label: 'Wave', bg: '#2a2a1a', color: '#81C784' },
];

const TAB_BUBBLES: TabItem[] = [
  { id: 'b1', label: 'Speech', bg: '#2a2a2a', color: '#fff' },
  { id: 'b2', label: 'Thought', bg: '#2a2a2a', color: '#E0E0E0' },
  { id: 'b3', label: 'Shout', bg: '#D32F2F', color: '#fff' },
  { id: 'b4', label: 'Whisper', bg: '#1a1a2e', color: '#4FC3F7' },
  { id: 'b5', label: 'Comic', bg: '#2a2a1a', color: '#FFD54F' },
  { id: 'b6', label: 'Cloud', bg: '#2a2a2a', color: '#90A4AE' },
  { id: 'b7', label: 'Arrow', bg: '#2a2a2a', color: '#69F0AE' },
  { id: 'b8', label: 'Label', bg: '#2a2a2a', color: '#FF8A65' },
];

const TAB_PRESETS: TabItem[] = [
  { id: 'p1', label: 'Minimal', bg: '#2a2a2a', color: '#fff' },
  { id: 'p2', label: 'Bold', bg: '#2a2a2a', color: '#FFD700' },
  { id: 'p3', label: 'Cinematic', bg: '#1a1a2e', color: '#4FC3F7' },
  { id: 'p4', label: 'Vlog', bg: '#2a2a2a', color: '#81C784' },
  { id: 'p5', label: 'Social', bg: '#2a1a3a', color: '#CE93D8' },
  { id: 'p6', label: 'News', bg: '#2a2a2a', color: '#FF8A65' },
  { id: 'p7', label: 'Gaming', bg: '#2a1a0a', color: '#FF6D00' },
  { id: 'p8', label: 'Clean', bg: '#2a2a2a', color: '#90A4AE' },
];

const TAB_DATA: TabItem[][] = [TEXT_TEMPLATES, TAB_FONTS, TAB_STYLES, TAB_EFFECTS, TAB_ANIMATIONS, TAB_BUBBLES, TAB_PRESETS];

const FONT_CARD_W = Math.floor((SCREEN_W - 32 - 16) / 3); // 3-col: 16px padding each side, 8px gap × 2
const FONT_CATEGORIES = ['Brand fonts', 'Trending', 'Classic', 'NEW', 'Retro', 'Hits', 'Headings', 'Elegant'];
const STYLES_SUB_TABS = ['Text', 'Brand colors', 'Stroke', 'Glow', 'Background', 'Shadow', 'Curve', 'Spacing', 'Bold italic', 'Case'];
const STYLE_PRESETS = [
  { id: 's1', label: 'Aa', color: '#ffffff', fontWeight: '400' as const },
  { id: 's2', label: 'Aa', color: '#FFD700', fontWeight: '700' as const },
  { id: 's3', label: 'Aa', color: '#00FFAA', fontWeight: '600' as const },
  { id: 's4', label: 'Aa', color: '#FF4D4D', fontWeight: '800' as const },
  { id: 's5', label: 'Aa', color: '#4FC3F7', fontWeight: '700' as const },
  { id: 's6', label: 'Aa', color: '#CE93D8', fontWeight: '600' as const },
  { id: 's7', label: 'Aa', color: '#FF8A65', fontWeight: '800' as const },
  { id: 's8', label: 'Aa', color: '#69F0AE', fontWeight: '400' as const },
];
const BRAND_COLORS = ['#FFFFFF', '#000000', '#FF3B30', '#FF9500', '#FFCC00', '#34C759', '#007AFF', '#5856D6', '#AF52DE', '#FF2D55', '#A2845E', '#8E8E93'];
const COLOR_NEUTRALS = ['transparent', '#FFFFFF', '#E0E0E0', '#BDBDBD', '#9E9E9E', '#616161', '#424242', '#212121', '#000000'];
const COLOR_VIBRANT = ['#FF3B30', '#FF6B00', '#FF9500', '#FFCC00', '#34C759', '#00C7BE', '#007AFF', '#5856D6', '#AF52DE', '#FF2D55'];
const COLOR_SOFT = ['#FFB6C1', '#FFDAB9', '#FFF9C4', '#C8E6C9', '#B3E5FC', '#D1C4E9', '#F8BBD0', '#FFCCBC', '#E0F7FA', '#F3E5F5'];
const FONT_CATEGORY_DATA: Record<string, { id: string; label: string }[]> = {
  'Brand fonts': [
    { id: 'bf1', label: 'SYSTEM' }, { id: 'bf2', label: 'Studio Sans' },
    { id: 'bf3', label: 'Clean Brand' }, { id: 'bf4', label: 'Modern Pro' },
    { id: 'bf5', label: 'Identity' },
  ],
  'Trending': [
    { id: 'tr1', label: 'Mellow' }, { id: 'tr2', label: 'Kak' },
    { id: 'tr3', label: 'Starry' }, { id: 'tr4', label: 'Bungee' },
    { id: 'tr5', label: 'Flourishing' },
  ],
  'Classic': [
    { id: 'cl1', label: 'Serif' }, { id: 'cl2', label: 'Garamond' },
    { id: 'cl3', label: 'Playfair' }, { id: 'cl4', label: 'Rubik' },
    { id: 'cl5', label: 'Modern' },
  ],
  'NEW': [
    { id: 'nw1', label: 'Ribbon' }, { id: 'nw2', label: 'WearDot' },
    { id: 'nw3', label: 'Stranger' }, { id: 'nw4', label: 'Glossy' },
    { id: 'nw5', label: 'Block' },
  ],
  'Retro': [
    { id: 'rt1', label: 'Eveleth' }, { id: 'rt2', label: 'Typewriter' },
    { id: 'rt3', label: 'Stories' }, { id: 'rt4', label: 'Flowmatic' },
    { id: 'rt5', label: 'Stone' },
  ],
  'Hits': [
    { id: 'ht1', label: 'Mono' }, { id: 'ht2', label: 'Bold Sans' },
    { id: 'ht3', label: 'Condensed' }, { id: 'ht4', label: 'Rounded' },
    { id: 'ht5', label: 'Display' },
  ],
  'Headings': [
    { id: 'hd1', label: 'Headline One' }, { id: 'hd2', label: 'Poster' },
    { id: 'hd3', label: 'Impact' }, { id: 'hd4', label: 'Heavy Title' },
    { id: 'hd5', label: 'Tall Sans' },
  ],
  'Elegant': [
    { id: 'el1', label: 'Awelier' }, { id: 'el2', label: 'Lucette' },
    { id: 'el3', label: 'Neato' }, { id: 'el4', label: 'Cormorant' },
    { id: 'el5', label: 'Slender' },
  ],
};

// ─────────────────────────────────────────────────────────────
// Phase 13 — Electric Pills design tokens
// ─────────────────────────────────────────────────────────────
const PILL_BG_DEFAULT = 'rgba(255,255,255,0.06)';
const PILL_BORDER_DEFAULT = 'rgba(255,255,255,0.08)';
const PILL_LABEL_DEFAULT = '#d0d0d0';
const PILL_BG_ACTIVE_FROM = '#00E5FF';
const PILL_BG_ACTIVE_TO = '#00B8D4';
const PILL_LABEL_ACTIVE = '#000';
const PILL_GLOW_COLOR = '#00E5FF';
const PILL_BG_AI_FROM = '#9B59B6';
const PILL_BG_AI_TO = '#E040FB';
const PILL_GLOW_AI = '#E040FB';

// Phase 13.d — Danger variant (red for destructive actions)
const PILL_BG_DANGER_FROM = '#EF4444';
const PILL_BG_DANGER_TO = '#DC2626';
const PILL_GLOW_DANGER = '#EF4444';

// Phase 13.e — Brand variant (warm orange→magenta, from BeSmile logo)
const PILL_BG_BRAND_FROM = '#FF6B35';
const PILL_BG_BRAND_TO = '#F7258C';
const PILL_GLOW_BRAND = '#FF4D6D';

// Phase 14.a — Premium variant (gold with breathing shadow pulse)
const PILL_BG_PREMIUM_FROM = '#FBBF24';
const PILL_BG_PREMIUM_TO = '#F59E0B';
const PILL_GLOW_PREMIUM = '#FBBF24';
const PILL_GLOW_PREMIUM_MIN = 0.4;
const PILL_GLOW_PREMIUM_MAX = 0.75;
const PILL_GLOW_PREMIUM_DURATION = 2800;

type ToolbarPillProps = {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  active?: boolean;
  variant?: 'default' | 'ai' | 'danger' | 'brand' | 'premium';
  onPress?: () => void;
  iconSize?: number;
};

// Phase 14.b — Decorative stars for premium pill interior.
// Static (no animation). Rendered inside LinearGradient with
// pointerEvents='none'. Premium variant only.
function PremiumStars() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFillObject}>
      <Ionicons
        name="star"
        size={6}
        color="#FFFFFF"
        style={{ position: 'absolute', top: 4, right: 8, opacity: 0.22 }}
      />
      <Ionicons
        name="star"
        size={8}
        color="#FFFFFF"
        style={{ position: 'absolute', top: '42%', left: 6, opacity: 0.22 }}
      />
      <Ionicons
        name="star"
        size={5}
        color="#FFFFFF"
        style={{ position: 'absolute', bottom: 5, right: 14, opacity: 0.22 }}
      />
    </View>
  );
}

function ToolbarPill({
  icon,
  label,
  active = false,
  variant = 'default',
  onPress,
  iconSize = 20,
}: ToolbarPillProps) {
  const scale = React.useRef(new Animated.Value(1)).current;
  const shadowPulse = React.useRef(new Animated.Value(PILL_GLOW_PREMIUM_MIN)).current;
  const loopRef = React.useRef<Animated.CompositeAnimation | null>(null);

  const handlePressIn = () => {
    Animated.timing(scale, {
      toValue: 0.96,
      duration: 90,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.timing(scale, {
      toValue: 1,
      duration: 110,
      useNativeDriver: true,
    }).start();
  };

  const handlePress = () => {
    if (!onPress) return;
    Haptics.selectionAsync().catch(() => {});
    onPress();
  };

  const isAi = variant === 'ai';
  const isDanger = variant === 'danger';
  const isBrand = variant === 'brand';
  const isPremium = variant === 'premium';
  const showFeatured = active || isAi || isDanger || isBrand || isPremium;
  const gradientColors: [string, string] = isDanger
    ? [PILL_BG_DANGER_FROM, PILL_BG_DANGER_TO]
    : isPremium
    ? [PILL_BG_PREMIUM_FROM, PILL_BG_PREMIUM_TO]
    : isBrand
    ? [PILL_BG_BRAND_FROM, PILL_BG_BRAND_TO]
    : active
    ? [PILL_BG_ACTIVE_FROM, PILL_BG_ACTIVE_TO]
    : [PILL_BG_AI_FROM, PILL_BG_AI_TO];
  const iconColor = showFeatured ? PILL_LABEL_ACTIVE : '#ccc';
  const labelColor = showFeatured ? PILL_LABEL_ACTIVE : PILL_LABEL_DEFAULT;

  useEffect(() => {
    if (!isPremium) return;
    loopRef.current = Animated.loop(
      Animated.sequence([
        Animated.timing(shadowPulse, {
          toValue: PILL_GLOW_PREMIUM_MAX,
          duration: PILL_GLOW_PREMIUM_DURATION / 2,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(shadowPulse, {
          toValue: PILL_GLOW_PREMIUM_MIN,
          duration: PILL_GLOW_PREMIUM_DURATION / 2,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    loopRef.current.start();
    return () => {
      loopRef.current?.stop();
    };
  }, [isPremium]);

  return (
    <Animated.View
      style={[
        pillStyles.pillShadow,
        active && pillStyles.pillShadowActive,
        isAi && !active && pillStyles.pillShadowAi,
        isDanger && !active && pillStyles.pillShadowDanger,
        isBrand && !active && pillStyles.pillShadowBrand,
        isPremium && !active && {
          shadowColor: PILL_GLOW_PREMIUM,
          shadowOpacity: shadowPulse,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 0 },
          elevation: 8,
        },
        { transform: [{ scale }] },
      ]}
    >
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={pillStyles.pillOuter}
      >
        {showFeatured ? (
          <LinearGradient
            colors={gradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={pillStyles.pillInner}
          >
            {isPremium && <PremiumStars />}
            <Ionicons name={icon} size={iconSize} color={iconColor} />
            <Text
              style={[pillStyles.pillLabel, { color: labelColor }]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {label}
            </Text>
          </LinearGradient>
        ) : (
          <View style={pillStyles.pillInnerDefault}>
            <Ionicons name={icon} size={iconSize} color={iconColor} />
            <Text
              style={[pillStyles.pillLabel, { color: labelColor }]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {label}
            </Text>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

const pillStyles = StyleSheet.create({
  pillShadow: {
    borderRadius: 18,
  },
  pillShadowActive: {
    shadowColor: PILL_GLOW_COLOR,
    shadowOpacity: 0.5,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
  pillShadowAi: {
    shadowColor: PILL_GLOW_AI,
    shadowOpacity: 0.5,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
  pillShadowDanger: {
    shadowColor: PILL_GLOW_DANGER,
    shadowOpacity: 0.5,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
  pillShadowBrand: {
    shadowColor: PILL_GLOW_BRAND,
    shadowOpacity: 0.5,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
  pillOuter: {
    borderRadius: 18,
    overflow: 'hidden',
  },
  pillInnerDefault: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: PILL_BORDER_DEFAULT,
    backgroundColor: PILL_BG_DEFAULT,
    minWidth: 64,
  },
  pillInner: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    minWidth: 64,
  },
  pillLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.2,
    marginTop: 4,
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  /* ── Header ── */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  headerButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  nextText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  /* ── State A: normal preview ── */
  normalPreview: {
    flex: 1,
    backgroundColor: '#111',
  },
  /* ── State B: raised edit mode ── */
  content: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 100,
  },
  previewWrapper: {
    width: '85%',
    aspectRatio: 9 / 16,
    maxHeight: '55%',
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 10,
    borderRadius: 16,
    backgroundColor: '#111',
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '85%',
    marginTop: 8,
    marginBottom: 6,
  },
  controlsRight: {
    flexDirection: 'row',
    gap: 16,
  },
  // Phase 17.c.1: tabular-nums prevents container width-shift
  // on every digit change. Ruler labels already have this from
  // Phase 17.a polish; counter was missing it.
  timeText: {
    color: '#ccc',
    fontSize: 12,
    fontVariant: ['tabular-nums'],
  },
  timelineWrapper: {
    width: '90%',
    marginTop: 8,
    position: 'relative',
    flexDirection: 'row', // Phase 17.f: counter column + scroll column
  },
  // Phase 17.f: Fixed-width counter column — left of ruler in same row
  timelineCounterCol: {
    width: 60, // Phase 17.f.2: narrower since only "MM:SS" shown
    justifyContent: 'flex-start',
    paddingTop: 4,
    paddingLeft: 6, // Phase 17.f.2: tighter padding
  },
  timelineCounterText: {
    color: '#fff',
    fontSize: 14, // Phase 17.f.2: restored — fits since "/ XX:XX" removed
    fontVariant: ['tabular-nums'],
  },
  // Phase 17.f: Scroll column — fills remaining width; playhead relative to this
  timelineScrollCol: {
    flex: 1,
    position: 'relative',
  },
  timelineSegmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  videoTrack: {
    flex: 1,
    height: 60,
    flexDirection: 'row',
    // Phase 18.c Fix #K: required so absolute-positioned separators anchor here
    position: 'relative',
  },
  segmentBar: {
    height: 60,
    backgroundColor: '#444',
    overflow: 'hidden',
  },
  segmentFirst: {
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
  },
  segmentLast: {
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
    marginRight: 0,
  },
  segmentSeparator: {
    width: 2,
    height: '100%',
    backgroundColor: '#fff',
  },
  separatorHitbox: {
    // Phase 18.c Fix #K: removed from flex flow via position:'absolute' in JSX;
    // width/height here are unused in layout but kept for reference
    width: 12,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playhead: {
    position: 'absolute',
    width: 2,
    top: 0,
    bottom: 0,
    backgroundColor: '#fff',
    zIndex: 10,
  },
  segmentEmpty: {
    flex: 1,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  segmentEmptyText: {
    color: '#888',
    fontSize: 13,
  },
  track: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '100%',
    height: 36,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginTop: 4,
  },
  trackText: {
    color: '#aaa',
    fontSize: 13,
  },
  /* ── Text track lane ── */
  textTrackLane: {
    minHeight: 36,
    marginTop: 4,
    position: 'relative',
  },
  textTrackBg: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '100%',
    height: 36,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  textTrackClips: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  textClipBlock: {
    position: 'absolute',
    top: 4,
    height: 28,
    backgroundColor: '#ff8c00',
    borderRadius: 6,
    paddingHorizontal: 6,
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    overflow: 'visible',
  },
  textClipLabel: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  timelineTrimHandle: {
    position: 'absolute',
    top: -2,
    bottom: -2,
    width: 12,
    backgroundColor: '#fff',
    borderRadius: 3,
    zIndex: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timelineTrimHandleLeft: {
    left: -6,
  },
  timelineTrimHandleRight: {
    right: -6,
  },
  timelineTrimHandleGrip: {
    width: 2,
    height: 12,
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderRadius: 1,
  },
  /* ── Shared toolbar ── */
  bottomDock: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#000',
    borderTopWidth: 1,
    borderTopColor: '#111',
    paddingTop: 12,
  },
  toolRowContent: {
    paddingHorizontal: 16,
    gap: 16,
    alignItems: 'center',
  },
  ctxBackBtn: {
    width: 40,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
    marginRight: 4,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  ctxScrollContent: {
    alignItems: 'center',
    paddingHorizontal: 8,
    gap: 12,
  },
  /* ── Transition bottom sheet ── */
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: '80%',
    backgroundColor: '#111',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    zIndex: 30,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#555',
    alignSelf: 'center',
    marginVertical: 8,
    borderRadius: 2,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#222',
    borderRadius: 8,
    padding: 10,
    color: '#fff',
    fontSize: 14,
  },
  check: {
    marginLeft: 10,
    color: '#0af',
    fontSize: 18,
  },
  sheetTabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  sheetTabActive: {
    color: '#fff',
    fontWeight: '600',
    marginRight: 16,
    fontSize: 13,
  },
  sheetTab: {
    color: '#777',
    marginRight: 16,
    fontSize: 13,
  },
  sheetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  sheetGridItem: {
    width: '30%',
    height: 80,
    backgroundColor: '#333',
    borderRadius: 10,
    marginBottom: 12,
  },
  /* ── Overlay layer ── */
  videoInner: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    borderRadius: 16,
  },
  overlayLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
    elevation: 10,
  },
  overlayLayerRounded: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  overlayItem: {
    position: 'absolute' as const,
    alignItems: 'center',
  },
  overlayText: {
    fontWeight: '700' as const,
    textShadowColor: 'rgba(0,0,0,0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  textFrame: {
    borderWidth: 1,
    borderStyle: 'dashed' as const,
    borderColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  overlayHandle: {
    position: 'absolute' as const,
    right: -14,
    bottom: -14,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.95)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 3,
  },
  overlayHandleIcon: {
    color: '#111',
  },
  cornerBtnTopLeft: {
    position: 'absolute' as const,
    top: -14,
    left: -14,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  cornerBtnTopRight: {
    position: 'absolute' as const,
    top: -14,
    right: -14,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  cornerBtnBottomLeft: {
    position: 'absolute' as const,
    bottom: -14,
    left: -14,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  /* ── Text editor panel ── */
  tepPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: SCREEN_H,
    backgroundColor: '#111',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    zIndex: 20,
    justifyContent: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 24,
  },
  /* — Drag handle zone — */
  tepDragZone: {
    paddingTop: 10,
    paddingBottom: 8,
    alignItems: 'center',
    flexGrow: 0,
    flexShrink: 0,
  },
  tepHandle: {
    width: 36,
    height: 4,
    backgroundColor: '#555',
    borderRadius: 2,
  },
  /* — Section 1: Input bar — */
  tepInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
    flexGrow: 0,
    flexShrink: 0,
  },
  tepInput: {
    flex: 1,
    backgroundColor: '#1c1c1e',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#fff',
    fontSize: 14,
  },
  tepInputBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#1c1c1e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tepCheckBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#2979FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  /* — Section 2: Primary tabs — */
  tepTabRow: {
    paddingHorizontal: 12,
    paddingBottom: 10,
    flexGrow: 0,
    flexShrink: 0,
  },
  tepTabContent: {
    gap: 2,
    paddingHorizontal: 4,
  },
  tepTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  tepTabActive: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderBottomWidth: 2,
    borderBottomColor: '#fff',
  },
  tepTabText: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 13,
    fontWeight: '600',
  },
  tepTabTextActive: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  /* — Section 3: Category chips — */
  tepCatRow: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    flexGrow: 0,
    flexShrink: 0,
  },
  tepCatContent: {
    gap: 6,
    paddingHorizontal: 4,
    alignItems: 'center',
  },
  tepSearchChip: {
    width: 30,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#1c1c1e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tepCatChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 13,
    backgroundColor: '#1c1c1e',
  },
  tepCatText: {
    color: '#777',
    fontSize: 11,
    fontWeight: '500',
  },
  /* — Section 4: Template grid — */
  tepGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 10,
    paddingBottom: 60,
  },
  tepCard: {
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  tepCardSelected: {
    borderWidth: 2,
    borderColor: '#4FC3F7',
  },
  tepCardLabel: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  tepPremium: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Phase 17.a: Ruler styles — CapCut-grade polish
  // Phase 17.a polish: Subtle background + hairline separator for presence
  rulerContainer: {
    height: 24,
    position: 'relative',
    // Phase 18.b Fix #C: removed overflow:'hidden' so boundary
    // tick labels (e.g. "0:00" at x=0) render fully instead of
    // being half-clipped by the container edge.
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.06)',
    marginBottom: 4,
  },
  rulerTickWrap: {
    // Phase 18.b Fix #C: width: 0 + alignItems center makes
    // children overflow symmetrically around the declared left,
    // so both Text label and dot center at T * PIXELS_PER_SECOND
    // exactly. Fixes major:minor tick asymmetry (28:52 → 40:40).
    position: 'absolute',
    bottom: 0,
    width: 0,
    alignItems: 'center',
  },
  // Phase 17.a polish: Bolder, clearer, with tabular-nums for stable width
  rulerLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.75)',
    fontWeight: '600',
    // Phase 18.c Fix #N: removed letterSpacing:0.3 — caused
    // 0.6 logical px (1.8 physical px at 3×) optical leftward
    // shift of label ink center vs geometric box center.
    // textAlign:'center' centers the full text block including
    // trailing letter-spacing, displacing visible glyphs from
    // box center. This produced the 2-4px perceived ruler-vs-
    // separator misalignment that Fix #M (Math.round) could not
    // resolve because the offset was optical, not data-driven.
    // tabular-nums already provides consistent digit widths.
    marginBottom: 2,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
    // Phase 18.b Fix #C-Fix: explicit width gives Text a
    // non-zero layout box. Without this, parent rulerTickWrap's
    // width:0 propagates availableWidth=0 to Text via Yoga,
    // and iOS Core Text refuses to render glyphs in a 0-width
    // box. Width 50 fits up to "0:00.0" (~44px) with safety
    // margin.
    width: 50,
  },
  // Phase 18.c Fix #O: width 1 → 2 eliminates sub-pixel rounding
  // at 3× density. Yoga centering of width:1 in width:0 parent
  // produces left = -0.5 logical → -1.5 physical → rounds to -2,
  // shifting dot center 0.5 physical px left of T×PPS. width:2
  // produces left = -1.0 logical → -3.0 physical (exact integer),
  // placing dot center at T×PPS exactly. Bonus: dot now matches
  // segmentSeparator width (both 2px) for continuous vertical line.
  rulerMajorDot: { width: 2, height: 8, backgroundColor: 'rgba(255,255,255,0.55)' },
  // Phase 17.a polish: More visible minor ticks for density perception
  rulerMinorDot: { width: 1, height: 4, backgroundColor: 'rgba(255,255,255,0.4)' },
  // Phase 19 Step 3: Sub-mini tick. Half the height of minor (2px),
  // 60% the opacity (0.25). Provides eye with closer spatial reference
  // during playback motion — reduces perceived inter-tick gap from
  // 40px to 20px (Tier 1&2) or 80px to 40px (Tier 3). Geometric
  // hierarchy: Major (8px/0.55) → Minor (4px/0.4) → SubMini (2px/0.25).
  rulerSubMiniDot: { width: 1, height: 2, backgroundColor: 'rgba(255,255,255,0.25)' },
});

export default function ReelsEditScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const topPadding = insets.top + (Platform.OS === 'android' ? 8 : 4);
  const params = useLocalSearchParams<{ segments?: string }>();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [globalTime, setGlobalTime] = useState(0);
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0);
  const [selectedSeparatorIndex, setSelectedSeparatorIndex] = useState<number | null>(null);
  const segmentIndexRef = useRef(0);
  const isScrubbingRef = useRef(false);
  const wasPlayingBeforeScrubRef = useRef<boolean>(false);
  const timelineWidthRef = useRef(0);
  // Phase 16.b — Photo clock interval ID, used to advance
  // globalTime during photo clip playback (expo-video's
  // timeUpdate event never fires for photo segments).
  const photoClockRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Phase 17.d Batch 1: useAnimatedRef for UI-thread scroll access
  const scrollViewRef = useAnimatedRef<ReAnimated.ScrollView>();
  // Phase 17.0: Guard flag to prevent onScroll ↔ setGlobalTime feedback loop
  const isProgrammaticScrollRef = useRef(false);
  // Phase 17.b.11 (HYBRID-1): Track last known scroll target.
  // If a new programmaticScrollTo target is BACKWARD (x < this
  // ref), we force animated:false to avoid UIKit animation
  // overlap that produces visible rewind jitter. Forward targets
  // honor the caller's requested animated value.
  const lastScrollXRef = useRef<number>(0);
  // Phase 17.c Batch 1: Track photo clock localTime via ref so
  // Batch 2's RAF loop can read it without closure capture issues.
  const localTimeRef = useRef<number>(0);
  // Phase 17.c Batch 2: Mirror native player time (avoid bridge
  // saturation from reading player.currentTime per RAF frame).
  // Updated by timeUpdate listener at 10Hz; RAF interpolates.
  const nativeTimeRef = useRef<number>(0);
  // Phase 17.c Batch 2: Ref mirror of elapsedBefore for RAF closure.
  // Updated synchronously at render time (similar to globalTimeRef).
  const elapsedBeforeRef = useRef<number>(0);
  // Phase 17.c Batch 2: RAF frame ID for cancelAnimationFrame cleanup.
  const rafIdRef = useRef<number | null>(null);
  // Phase 17.c Batch 2: Frame counter for 30Hz setGlobalTime throttle.
  const frameCountRef = useRef<number>(0);
  // Phase 17.c.6 (Mitigation A): Track last masterTime read by
  // RAF tick. Used to clamp out backward jumps caused by the
  // segmentIndexRef → elapsedBeforeRef race window at segment
  // transitions. Reset to 0 at RAF loop start so legitimate
  // loop-back to t=0 (end of playlist → restart) is not blocked.
  const lastMasterTimeRef = useRef<number>(0);
  // Phase 17.d Batch 3 v2: tracks last masterTime that triggered
  // withTiming. Prevents 60Hz cancellation of 100ms animations.
  const lastAnimatedMasterTimeRef = useRef<number>(-1);
  // Phase 17.d Batch 2: Shared values for UI-thread scroll
  const masterTimeShared = useSharedValue<number>(0);
  const isScrubbingShared = useSharedValue<boolean>(false);

  // Phase 17.d Batch 2: UI-thread scroll worklet
  // Reads masterTimeShared, calls scrollTo on UI thread
  // Eliminates JS→native bridge latency
  useAnimatedReaction(
    () => masterTimeShared.value,
    (masterTime) => {
      'worklet';
      if (isScrubbingShared.value) return;
      scrollTo(scrollViewRef, masterTime * PIXELS_PER_SECOND, 0, false);
    },
  );

  // Phase 17.0: Reactive viewport width for contentContainerStyle padding and playhead centering
  const [viewportWidth, setViewportWidth] = useState(0);

  // Phase 17.0: Programmatic scroll helper with feedback loop guard.
  // Sets the guard flag before calling scrollTo, clears it after
  // the scroll completes (via setTimeout for animated:false which
  // may or may not fire onScroll depending on platform).
  const programmaticScrollTo = useCallback((x: number, animated: boolean) => {
    if (!scrollViewRef.current) return;
    // Phase 17.b.11 (HYBRID-1): Force animated:false for backward
    // targets to prevent UIKit animation overlap (rewind jitter).
    // Forward targets keep caller's animated value — preserves the
    // 60fps UIKit interpolation that makes forward playback smooth.
    const isBackward = x < lastScrollXRef.current;
    const useAnimated = animated && !isBackward;
    lastScrollXRef.current = x;
    isProgrammaticScrollRef.current = true;
    scrollViewRef.current.scrollTo({ x, animated: useAnimated });
    if (!useAnimated) {
      // Clear the flag after the scroll event has had a chance to fire
      setTimeout(() => { isProgrammaticScrollRef.current = false; }, 0);
    } else {
      // Safety net for animated:true — cleared in onMomentumScrollEnd (Batch 3)
      setTimeout(() => { isProgrammaticScrollRef.current = false; }, 400);
    }
  }, []);

  // ── Text overlay state ──
  const [textOverlays, setTextOverlays] = useState<TextOverlayItem[]>([]);
  const [selectedOverlayId, setSelectedOverlayId] = useState<string | null>(null);
  const [textModeActive, setTextModeActive] = useState(false);
  const [addTextPanelOpen, setAddTextPanelOpen] = useState(false);
  const [draftText, setDraftText] = useState('');
  const [activeTextTab, setActiveTextTab] = useState(0);
  const [activeFontCategory, setActiveFontCategory] = useState(0);
  const [activeStyleTab, setActiveStyleTab] = useState(0);
  const [selectedStyleId, setSelectedStyleId] = useState<string | null>('s1');
  const [selectedBrandColor, setSelectedBrandColor] = useState(0);
  const [fakeSizeVal, setFakeSizeVal] = useState(24);
  const [fakeOpacityVal, setFakeOpacityVal] = useState(100);

  // ── Text editor panel sheet animation ──
  const tepSheetY = useRef(new Animated.Value(SCREEN_H)).current;
  const tepSnapRef = useRef(SCREEN_H);

  const tepSnapTo = (target: number) => {
    tepSnapRef.current = target;
    Animated.spring(tepSheetY, {
      toValue: target,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start();
  };

  const tepPan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 6,
      onPanResponderMove: (_, g) => {
        const next = tepSnapRef.current + g.dy;
        if (next >= TEP_EXPANDED) {
          tepSheetY.setValue(next);
        }
      },
      onPanResponderRelease: (_, g) => {
        const current = tepSnapRef.current + g.dy;
        let target: number;
        if (g.vy > 0.5 || g.dy > 80) {
          // fast swipe down or big drag down → collapse (or close if already collapsed)
          target = tepSnapRef.current <= TEP_COLLAPSED ? SCREEN_H : TEP_COLLAPSED;
        } else if (g.vy < -0.5 || g.dy < -80) {
          // fast swipe up or big drag up → expand
          target = TEP_EXPANDED;
        } else {
          // snap to nearest
          const mid = (TEP_COLLAPSED + TEP_EXPANDED) / 2;
          target = current < mid ? TEP_EXPANDED : TEP_COLLAPSED;
        }
        if (target >= SCREEN_H) {
          setAddTextPanelOpen(false);
        }
        tepSnapTo(target);
      },
    }),
  ).current;

  // Animate in when panel opens, reset when it closes
  useEffect(() => {
    if (addTextPanelOpen) {
      tepSheetY.setValue(SCREEN_H);
      tepSnapTo(TEP_COLLAPSED);
    } else {
      tepSnapRef.current = SCREEN_H;
      tepSheetY.setValue(SCREEN_H);
    }
  }, [addTextPanelOpen]);

  const addTextOverlay = () => {
    const label = draftText.trim() || 'New Text';
    const start = globalTime;
    const end = Math.min(start + 3, totalDuration > 0 ? totalDuration : 3);
    const newId = Date.now().toString();
    setTextOverlays(prev => [...prev, {
      id: newId,
      text: label,
      x: 50,
      y: 50,
      color: '#FFFFFF',
      fontSize: 24,
      startTime: start,
      endTime: end,
      scale: 1,
      rotation: 0,
    }]);
    setSelectedOverlayId(newId);
    setDraftText('');
  };

  const [editingOverlayId, setEditingOverlayId] = useState<string | null>(null);

  const deleteOverlay = (id: string) => {
    setTextOverlays(prev => prev.filter(o => o.id !== id));
    delete dragResponderCacheRef.current[id];
    delete dragStartRef.current[id];
  };

  const duplicateOverlay = (id: string) => {
    const src = textOverlays.find(o => o.id === id);
    if (!src) return;
    const dur = src.endTime - src.startTime;
    const start = globalTime;
    const end = Math.min(start + dur, totalDuration > 0 ? totalDuration : start + dur);
    setTextOverlays(prev => [...prev, {
      ...src,
      id: Date.now().toString(),
      startTime: start,
      endTime: end,
    }]);
  };

  const editOverlay = (id: string) => {
    const item = textOverlays.find(o => o.id === id);
    if (!item) return;
    setEditingOverlayId(id);
    setDraftText(item.text);
    setAddTextPanelOpen(true);
  };

  const transformOverlay = (id: string, nextRotation: number, nextScale: number) => {
    setTextOverlays(prev => prev.map(o =>
      o.id === id ? { ...o, rotation: nextRotation, scale: nextScale } : o
    ));
  };

  const moveOverlay = (id: string, nextX: number, nextY: number) => {
    setTextOverlays(prev => prev.map(o =>
      o.id === id ? { ...o, x: nextX, y: nextY } : o
    ));
  };

  const trimOverlay = (id: string, newStart: number, newEnd: number) => {
    if (newStart >= newEnd) return;
    setTextOverlays(prev => prev.map(o =>
      o.id === id ? { ...o, startTime: newStart, endTime: newEnd } : o
    ));
  };

  const selectOverlayFromTimeline = (id: string) => {
    const target = textOverlaysRef.current.find(o => o.id === id);
    if (!target) return;
    isScrubbingRef.current = true;
    player.pause();
    setIsPlaying(false);
    setGlobalTime(target.startTime);
    // Phase 17.0: Scroll timeline to seeked position
    programmaticScrollTo(target.startTime * PIXELS_PER_SECOND, true);
    setSelectedOverlayId(id);
    setTimeout(() => {
      isScrubbingRef.current = false;
    }, 100);
  };

  const player = useVideoPlayer(null, (p) => {
    p.loop = false;
    // Phase 17.b.9: Reverted to 10Hz — animated:true delegates
    // 60fps interpolation to UIKit native thread (smoother than
    // 20Hz discrete updates). Reanimated UI-thread approach
    // planned as Phase 17.d.
    p.timeUpdateEventInterval = 0.1; // Phase 17.d Batch 3 v3: revert from 0.05 (caused animation overlap with 95ms withTiming)
  });

  const formatTime = (t: number) => {
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Phase 17.c Batch 1: Format with one-decimal precision (e.g., "0:07.3")
  function formatTimePrecise(t: number): string {
    const total = Math.max(0, t);
    const m = Math.floor(total / 60);
    const s = Math.floor(total % 60);
    const decisecond = Math.floor((total % 1) * 10);
    return `${m}:${s.toString().padStart(2, '0')}.${decisecond}`;
  }

  // Phase 17.f: Counter format — whole seconds, padded minutes
  function formatTimeCounter(t: number): string {
    const mm = Math.floor(Math.max(0, t) / 60).toString().padStart(2, '0');
    const ss = Math.floor(Math.max(0, t) % 60).toString().padStart(2, '0');
    return `${mm}:${ss}`;
  }

  const previewPan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 10,
      onPanResponderRelease: (_, g) => {
        if (g.dy < -50) setIsFullscreen(true);
        else if (g.dy > 50) setIsFullscreen(false);
      },
    }),
  ).current;

  // Phase 17.0: playheadPan PanResponder retired — ScrollView is now the scrub surface.
  // wasPlayingBeforeScrubRef is preserved for onScrollBeginDrag (Batch 3).

  const segments: Segment[] = useMemo(() => {
    try {
      return params.segments ? JSON.parse(params.segments) : [];
    } catch {
      return [];
    }
  }, [params.segments]);

  // Phase 16.b — Shared segment-advancement logic, reused by
  // both the video playToEnd listener and the photo clock.
  // Advances segmentIndexRef + currentSegmentIndex, then:
  //   • If next is a video → player.replaceAsync + play
  //   • If next is a photo → return (photo clock useEffect
  //     will auto-start on the segment change)
  //   • If past end → loop back to index 0, stop playback
  const advanceToNextSegment = () => {
    const nextIndex = segmentIndexRef.current + 1;
    if (nextIndex < segments.length) {
      segmentIndexRef.current = nextIndex;
      // Phase 17.c.6 (Mitigation C): Zero nativeTimeRef synchronously
      // at segment flip. Prevents the race window where RAF sees
      // NEW segmentIndexRef + OLD nativeTimeRef + STALE elapsedBeforeRef,
      // producing a forward spike in masterTime. Combined with the
      // monotonic clamp (Mitigation A), eliminates all backward AND
      // forward jumps at transitions.
      nativeTimeRef.current = 0;
      // Phase 18.b Fix #1: sync elapsedBeforeRef immediately to
      // close the React-render race window (H1). Prevents RAF
      // backward-clamp from freezing scroll at segment boundaries.
      elapsedBeforeRef.current = segments
        .slice(0, nextIndex)
        .reduce((sum, s) => sum + (s.duration || 0), 0);
      setCurrentSegmentIndex(nextIndex);
      const next = segments[nextIndex];
      if (next.mediaType === 'photo') {
        // Phase 17.c.7 Fix A: Reset localTimeRef before early-return.
        // Photo clock useEffect overwrites this when it fires (16-50ms),
        // but until then RAF would read stale photo-time from a prior
        // photo segment, producing a forward-spike past timeline end
        // that is NOT caught by the monotonic clamp (which only catches
        // backward jumps). Setting to 0 ensures masterTime stays sane
        // during the brief race window.
        localTimeRef.current = 0;
        return;
      }
      player.replaceAsync(next.uri).then(() => {
        player.play();
      }).catch(() => {});
    } else {
      segmentIndexRef.current = 0;
      // Phase 17.c.6 (Mitigation C): Reset nativeTimeRef on loop-back.
      nativeTimeRef.current = 0;
      // Phase 18.b Fix #1: sync elapsedBeforeRef to 0 immediately
      // for loop-back consistency (matches forward-branch pattern).
      elapsedBeforeRef.current = 0;
      setCurrentSegmentIndex(0);
      setIsPlaying(false);
      // Phase 17.0: Scroll back to t=0 on loop
      programmaticScrollTo(0, false);
      const first = segments[0];
      if (first.mediaType !== 'photo') {
        player.replace(first.uri);
      }
    }
  };

  // Load source and autoplay on mount
  useEffect(() => {
    if (!player) return;
    if (!segments.length) return;
    const current = segments[segmentIndexRef.current];
    if (!current?.uri) return;
    // Phase 16.a — Do NOT feed photo URIs to the native video
    // player. expo-video's AVFoundation/ExoPlayer backend will
    // crash the native module on non-video sources. Photo
    // rendering comes in Phase 16.b.
    if (current.mediaType === 'photo') return;
    player.replaceAsync(current.uri).then(() => {
      if (isPlaying) {
        player.play();
      }
    }).catch(() => {});
  }, [player, segments]);

  // Segment end listener — advance to next or loop back
  useEffect(() => {
    const sub = player.addListener('playToEnd', () => {
      // Phase 16.b.1 — Empty/photo-mode native player emits
      // a spurious playToEnd on .play(). Guard against
      // advancing segments from this event when the current
      // segment is a photo — the photo clock useEffect owns
      // advancement for photos via its setInterval tick.
      if (segments[segmentIndexRef.current]?.mediaType === 'photo') return;
      advanceToNextSegment();
    });
    return () => sub.remove();
  }, [player, segments]);


  const totalDuration = useMemo(
    () => segments.reduce((sum, s) => sum + (s.duration || 0), 0),
    [segments],
  );

  // Phase 17.a: Adaptive tick intervals — matches CapCut density curve.
  // Phase 19 Step 3: Added subMini tier — provides eye with closer
  // spatial references during playback motion (halves perceptual gap).
  const rulerIntervals = useMemo(() => {
    if (totalDuration <= 15) return { major: 2, minor: 1, subMini: 0.5 };
    if (totalDuration <= 60) return { major: 5, minor: 1, subMini: 0.5 };
    return { major: 10, minor: 2, subMini: 1 };
  }, [totalDuration]);

  // Phase 17.c.3 Priority 2: Memoize ruler ticks. Pure function of
  // rulerIntervals and totalDuration — both stable during playback.
  // Eliminates ~30 element allocations per 4Hz render, reducing
  // reconciliation cost by ~3ms per render. Frees RAF frame budget.
  // formatTime and PIXELS_PER_SECOND are module-level constants/pure
  // functions with no state captures — safe to omit from deps.
  const rulerTicks = useMemo(() => {
    const ticks: React.ReactNode[] = [];
    const { major, minor, subMini } = rulerIntervals;

    // Phase 19 Step 3: Sub-mini ticks rendered FIRST (lowest z-order).
    // Provides eye with closer spatial references during playback —
    // halves the perceptual inter-tick gap. Excludes positions that
    // coincide with minor or major ticks.
    for (let t = 0; t <= totalDuration + 0.0001; t += subMini) {
      const tRounded = Math.round(t * 1000) / 1000;
      const isMajor = Math.abs(tRounded % major) < 0.0001
                      || Math.abs(tRounded % major - major) < 0.0001;
      const isMinor = Math.abs(tRounded % minor) < 0.0001
                      || Math.abs(tRounded % minor - minor) < 0.0001;
      if (isMajor || isMinor) continue;
      ticks.push(
        <View
          key={`submini-${tRounded}`}
          style={[styles.rulerTickWrap, { left: tRounded * PIXELS_PER_SECOND }]}
          pointerEvents="none"
        >
          <View style={styles.rulerSubMiniDot} />
        </View>
      );
    }

    // Minor ticks: every `minor` seconds (excluding major positions)
    for (let t = 0; t <= totalDuration + 0.0001; t += minor) {
      const tRounded = Math.round(t * 1000) / 1000;
      const isMajor = Math.abs(tRounded % major) < 0.0001
                      || Math.abs(tRounded % major - major) < 0.0001;
      if (isMajor) continue; // major ticks rendered in second pass
      ticks.push(
        <View
          key={`minor-${tRounded}`}
          style={[styles.rulerTickWrap, { left: tRounded * PIXELS_PER_SECOND }]}
          pointerEvents="none"
        >
          <View style={styles.rulerMinorDot} />
        </View>
      );
    }

    // Major ticks: every `major` seconds, with label
    for (let t = 0; t <= totalDuration + 0.0001; t += major) {
      const tRounded = Math.round(t * 1000) / 1000;
      ticks.push(
        <View
          key={`major-${tRounded}`}
          style={[styles.rulerTickWrap, { left: tRounded * PIXELS_PER_SECOND }]}
          pointerEvents="none"
        >
          <Text style={styles.rulerLabel}>{formatTime(tRounded)}</Text>
          <View style={styles.rulerMajorDot} />
        </View>
      );
    }
    return ticks;
  }, [rulerIntervals, totalDuration]);

  // Map globalTime → segment index + local offset
  const getSegmentFromGlobalTime = (time: number) => {
    let acc = 0;
    for (let i = 0; i < segments.length; i++) {
      const segDuration = segments[i].duration || 0;
      if (time >= acc && time < acc + segDuration) {
        return { index: i, localTime: time - acc };
      }
      acc += segDuration;
    }
    return { index: 0, localTime: 0 };
  };

  const elapsedBefore = useMemo(
    () => segments.slice(0, currentSegmentIndex).reduce((sum, s) => sum + (s.duration || 0), 0),
    [segments, currentSegmentIndex],
  );

  // Time update listener
  useEffect(() => {
    const sub = player.addListener('timeUpdate', (payload) => {
      if (isScrubbingRef.current) return;
      if (segments[segmentIndexRef.current]?.mediaType === 'photo') return;
      // Phase 17.c Batch 2: Update ref only. RAF loop reads it at 60Hz
      // and drives both setGlobalTime (30Hz) and scrollTo (60Hz).
      // Eliminates bridge read of player.currentTime per RAF frame.
      nativeTimeRef.current = payload.currentTime;
    });
    return () => sub.remove();
  // Phase 19 Step 2: Removed `elapsedBefore` from dep array.
  // The listener closure only reads `segments[segmentIndexRef.current]`
  // (via ref, not value) and writes nativeTimeRef. It does NOT
  // use elapsedBefore. The spurious dep caused the listener to
  // be torn down + recreated on every segment transition,
  // creating a 0-2ms window where no listener was registered
  // and native timeUpdate events were silently dropped.
  }, [player, segments]);

  // Phase 16.b — Photo clock: drives globalTime for photo
  // segments. expo-video's timeUpdate event only fires for
  // video sources, so photos need an independent clock.
  // Runs only when the current segment is a photo AND
  // isPlaying is true. Ticks at 100ms (matches
  // player.timeUpdateEventInterval = 0.1 for consistent
  // granularity). Fires clip-ended via the shared
  // advanceToNextSegment helper when localTime reaches the
  // segment's effective duration.
  useEffect(() => {
    // Clear any stale interval on every dep change
    if (photoClockRef.current) {
      clearInterval(photoClockRef.current);
      photoClockRef.current = null;
    }
    if (!isPlaying) return;
    const current = segments[currentSegmentIndex];
    if (!current || current.mediaType !== 'photo') return;
    const effectiveDuration =
      (current.trimEnd ?? current.duration ?? 5) - (current.trimStart ?? 0);
    // Phase 17.b.5 (BUG 1 fix): Resume from current globalTime offset
    // within segment, not from segment start. Read via ref to avoid
    // adding globalTime to deps (which would restart clock on every tick).
    // Phase 17.c Batch 1: Store in localTimeRef instead of let-variable so
    // Batch 2's RAF loop can read current photo time without closure capture.
    localTimeRef.current = Math.max(0, globalTimeRef.current - elapsedBefore);
    // Phase 17.b.9: Reverted to 100ms — matches video timeUpdate
    // 10Hz cadence. Reanimated approach in Phase 17.d.
    const TICK_MS = 100;
    photoClockRef.current = setInterval(() => {
      // Defer to user scrubbing — don't fight the pan gesture
      if (isScrubbingRef.current) return;
      localTimeRef.current += TICK_MS / 1000;
      if (localTimeRef.current >= effectiveDuration) {
        if (photoClockRef.current) {
          clearInterval(photoClockRef.current);
          photoClockRef.current = null;
        }
        advanceToNextSegment();
        return;
      }
      // Phase 17.c Batch 2: setGlobalTime + scrollTo are now handled
      // by the RAF loop at 30Hz/60Hz. Photo clock only tracks localTime
      // and detects clip-end (RAF cannot detect clip-end).
    }, TICK_MS);
    return () => {
      if (photoClockRef.current) {
        clearInterval(photoClockRef.current);
        photoClockRef.current = null;
      }
    };
  }, [isPlaying, currentSegmentIndex, segments, elapsedBefore]);

  // Phase 17.c Batch 2: RAF master clock loop.
  //
  // Drives unified time sync at display refresh rate:
  //   - Reads master clock per frame (60Hz)
  //       * Photo segment: elapsedBeforeRef + localTimeRef
  //       * Video segment: elapsedBeforeRef + nativeTimeRef
  //   - Calls scrollViewRef.scrollTo at 60Hz (smooth ruler)
  //   - Calls setGlobalTime every 2nd frame (30Hz counter — fluid digits)
  //   - Updates lastScrollXRef so HYBRID-1 stays accurate
  //   - Manages isProgrammaticScrollRef across the playback session
  //
  // Lifecycle:
  //   isPlaying false → true:  loop starts, flag goes high
  //   isPlaying true → false:  loop stops, flag goes low (allows
  //                            onScroll feedback for scrub)
  //   Component unmount:        cancelAnimationFrame in cleanup
  useEffect(() => {
    if (!isPlaying) return;
    isProgrammaticScrollRef.current = true;
    frameCountRef.current = 0;
    // Phase 17.c.6 (Mitigation A): Reset clamp baseline so loop-back
    // restarts and play-from-zero scenarios begin cleanly.
    lastMasterTimeRef.current = 0;
    lastAnimatedMasterTimeRef.current = -1; // Phase 17.d Batch 3 v2
    const tick = () => {
      if (!isScrubbingRef.current) {
        const seg = segments[segmentIndexRef.current];
        const localT = seg?.mediaType === 'photo'
          ? localTimeRef.current
          : nativeTimeRef.current;
        const masterTime = elapsedBeforeRef.current + localT;
        // Phase 17.c.6 (Mitigation A): Backward jump guard.
        // 100ms epsilon tolerates measurement noise in native player
        // currentTime. If masterTime is meaningfully behind the last
        // good frame, this is the segment-transition race — skip
        // this frame and re-queue. Next tick reads consistent refs.
        if (masterTime < lastMasterTimeRef.current - 0.1) {
          rafIdRef.current = requestAnimationFrame(tick);
          return;
        }
        lastMasterTimeRef.current = masterTime;
        // Phase 17.d: UI-thread scroll via worklet; throttled withTiming
        // writes only when masterTime changes (~10Hz sample rate),
        // giving the 95ms animation its full window before each update.
        const targetX = masterTime * PIXELS_PER_SECOND;
        if (masterTime !== lastAnimatedMasterTimeRef.current) {
          lastAnimatedMasterTimeRef.current = masterTime;
          masterTimeShared.value = withTiming(masterTime, {
            // Phase 19 Fix #J: 95ms → 100ms exactly matches
            // timeUpdateEventInterval=0.1 (100ms). Eliminates the 5ms
            // structural stationary gap per cycle. Reanimated handles
            // 1-2ms early re-targets via interpolation from current
            // position.
            duration: 100,
            easing: ReanimatedEasing.linear,
          });
        }
        lastScrollXRef.current = targetX;
        // Phase 17.c.9: Throttle to 10Hz (every 6th frame at 60fps).
        // Matches nativeTimeRef update cadence — counter and scroll
        // now read the same source value within 1 frame of each
        // other. Max counter-scroll divergence: 1.3px at PIXELS_PER_SECOND=80
        // (sub-perceptible, vs 18.7px at the prior 4Hz throttle).
        // formatTimePrecise's decisecond floor caps visible changes
        // to ≤10/sec regardless, so no readability regression.
        // VideoView memoization (Phase 17.c.3) prevents the original
        // 30Hz RAF starvation that motivated the 4Hz fallback.
        // Phase 19 Fix #J: setGlobalTime throttled 10Hz → 5Hz.
        // React reconciliation on the ~3100-line component costs
        // 5-15ms per pass. At 10Hz this blocked JS thread enough
        // to delay timeUpdate event delivery and cause subtle
        // scroll judder. Counter still updates at 5Hz (200ms) —
        // imperceptible difference for whole-second display.
        if (frameCountRef.current % 12 === 0) {
          setGlobalTime(masterTime);
        }
        frameCountRef.current++;
      }
      rafIdRef.current = requestAnimationFrame(tick);
    };
    rafIdRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      isProgrammaticScrollRef.current = false;
    };
  }, [isPlaying, segments]);

  // Seek video when scrubbing
  useEffect(() => {
    if (!isScrubbingRef.current) return;
    if (!segments.length) return;
    const { index, localTime } = getSegmentFromGlobalTime(globalTime);
    const targetSegment = segments[index];
    if (!targetSegment) return;
    if (index !== segmentIndexRef.current) {
      segmentIndexRef.current = index;
      setCurrentSegmentIndex(index);
      // Phase 16.b — Only touch the native video player when
      // the target segment is a video. Photo segments are
      // handled by the photo clock useEffect, which reads
      // currentSegmentIndex and restarts automatically.
      if (targetSegment.mediaType !== 'photo') {
        player.replaceAsync(targetSegment.uri).then(() => {
          player.currentTime = localTime;
        }).catch(() => {});
      }
    } else if (targetSegment.mediaType !== 'photo') {
      player.currentTime = localTime;
    }
  }, [globalTime]);

  const onSeparatorPress = (index: number) => {
    setSelectedSeparatorIndex(index);
    openSheet();
  };

  // Phase 16.b — Render <ExpoImage> for photo segments and
  // <VideoView> for video segments. The preview container is
  // agnostic; both render at 100% width/height with cover fit.
  // Phase 17.c.3 Priority 3: Memoize videoElement to prevent
  // re-allocation on every 4Hz render. Deps are all values the
  // IIFE reads; player ref is stable from useVideoPlayer.
  const videoElement = useMemo(() => {
    if (!segments.length) return null;
    const current = segments[currentSegmentIndex];
    if (!current?.uri) return null;
    if (current.mediaType === 'photo') {
      return (
        <ExpoImage
          source={{ uri: current.uri }}
          style={{ width: '100%', height: '100%' }}
          contentFit="cover"
        />
      );
    }
    return (
      <VideoView
        player={player}
        style={{ width: '100%', height: '100%' }}
        contentFit="cover"
        nativeControls={false}
      />
    );
  }, [segments, currentSegmentIndex, player]);

  const activeStyle = STYLE_PRESETS.find(s => s.id === selectedStyleId);
  const activeSegmentIndex = getSegmentFromGlobalTime(globalTime).index;

  const gestureStartRef = useRef<{
    [id: string]: {
      startScale: number;
      startRotation: number;
      centerX: number;
      centerY: number;
      startDistance: number;
      startAngle: number;
    } | undefined;
  }>({});
  const overlayRefs = useRef<{ [id: string]: View | null }>({});
  const canvasSizeRef = useRef<{ w: number; h: number }>({ w: 0, h: 0 });
  const dragStartRef = useRef<{
    [id: string]: { startX: number; startY: number } | undefined;
  }>({});
  const dragResponderCacheRef = useRef<{ [id: string]: any }>({});
  const trimHandleCacheRef = useRef<{ [key: string]: any }>({});
  const trimStartRef = useRef<{ [key: string]: { startTime: number; endTime: number } }>({});
  const textOverlaysRef = useRef(textOverlays);
  textOverlaysRef.current = textOverlays;
  const selectedOverlayIdRef = useRef<string | null>(null);
  selectedOverlayIdRef.current = selectedOverlayId;
  const globalTimeRef = useRef<number>(0);
  globalTimeRef.current = globalTime;
  // Phase 17.c Batch 2: Sync elapsedBefore for RAF closure access
  elapsedBeforeRef.current = elapsedBefore;
  const deselectTouchRef = useRef<{ startTime: number; startX: number; startY: number } | null>(null);

  const overlayItems = textOverlays
    .filter(item => globalTime >= item.startTime && globalTime <= item.endTime)
    .map(item => {
      const handleResponder = PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (_e, g) => {
          overlayRefs.current[item.id]?.measureInWindow((x: number, y: number, w: number, h: number) => {
            const centerX = x + w / 2;
            const centerY = y + h / 2;
            const dx = g.x0 - centerX;
            const dy = g.y0 - centerY;
            gestureStartRef.current[item.id] = {
              startScale: item.scale,
              startRotation: item.rotation,
              centerX,
              centerY,
              startDistance: Math.max(Math.hypot(dx, dy), 1),
              startAngle: Math.atan2(dy, dx),
            };
          });
        },
        onPanResponderMove: (_e, g) => {
          const start = gestureStartRef.current[item.id];
          if (!start) return;
          const dx = g.moveX - start.centerX;
          const dy = g.moveY - start.centerY;
          const currentDistance = Math.max(Math.hypot(dx, dy), 1);
          const currentAngle = Math.atan2(dy, dx);
          const angleDeltaDeg = (currentAngle - start.startAngle) * (180 / Math.PI);
          const nextRotation = start.startRotation + angleDeltaDeg;
          const rawScale = start.startScale * (currentDistance / start.startDistance);
          const nextScale = Math.max(0.3, Math.min(rawScale, 4));
          transformOverlay(item.id, nextRotation, nextScale);
        },
        onPanResponderRelease: () => {
          delete gestureStartRef.current[item.id];
        },
        onPanResponderTerminate: () => {
          delete gestureStartRef.current[item.id];
        },
      });

      if (!dragResponderCacheRef.current[item.id]) {
        dragResponderCacheRef.current[item.id] = PanResponder.create({
          onStartShouldSetPanResponder: () => selectedOverlayIdRef.current === item.id,
          onMoveShouldSetPanResponder: () => selectedOverlayIdRef.current === item.id,
          onPanResponderGrant: () => {
            const latest = textOverlaysRef.current.find(o => o.id === item.id);
            if (!latest) return;
            dragStartRef.current[item.id] = { startX: latest.x, startY: latest.y };
          },
          onPanResponderMove: (_e, g) => {
            const start = dragStartRef.current[item.id];
            const { w, h } = canvasSizeRef.current;
            if (!start || w <= 0 || h <= 0) return;
            const dxPct = (g.dx / w) * 100;
            const dyPct = (g.dy / h) * 100;
            const nextX = Math.max(5, Math.min(95, start.startX + dxPct));
            const nextY = Math.max(5, Math.min(95, start.startY + dyPct));
            moveOverlay(item.id, nextX, nextY);
          },
          onPanResponderRelease: () => { delete dragStartRef.current[item.id]; },
          onPanResponderTerminate: () => { delete dragStartRef.current[item.id]; },
        });
      }
      const dragResponder = dragResponderCacheRef.current[item.id];
      const isSelected = selectedOverlayId === item.id;

      return (
        <View
          key={item.id}
          ref={(r) => { overlayRefs.current[item.id] = r; }}
          style={[styles.overlayItem, {
            top: `${item.y}%`,
            left: `${item.x}%`,
            transform: [
              { translateX: -50 },
              { translateY: -50 },
              { scale: item.scale },
              { rotate: `${item.rotation}deg` },
            ],
          } as any]}
        >
          {/* Text */}
          <View style={[styles.textFrame, !isSelected && { borderWidth: 0 }]} {...dragResponder.panHandlers}>
            <Text style={[styles.overlayText, {
              color: activeStyle?.color || item.color,
              fontSize: item.fontSize,
              fontWeight: (activeStyle?.fontWeight || '400') as any,
            }]}>
              {item.text}
            </Text>
          </View>
          {/* Corner buttons */}
          {isSelected && (
            <Pressable style={styles.cornerBtnTopLeft} onPress={() => deleteOverlay(item.id)} hitSlop={8}>
              <Ionicons name="close" size={14} color="#fff" />
            </Pressable>
          )}
          {isSelected && (
            <Pressable style={styles.cornerBtnTopRight} onPress={() => editOverlay(item.id)} hitSlop={8}>
              <Ionicons name="pencil" size={14} color="#fff" />
            </Pressable>
          )}
          {isSelected && (
            <Pressable style={styles.cornerBtnBottomLeft} onPress={() => duplicateOverlay(item.id)} hitSlop={8}>
              <Ionicons name="copy-outline" size={14} color="#fff" />
            </Pressable>
          )}
          {/* Rotate + Scale handle */}
          {isSelected && (
            <View
              style={styles.overlayHandle}
              {...handleResponder.panHandlers}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="sync" size={14} style={styles.overlayHandleIcon} />
            </View>
          )}
        </View>
      );
    });

  const toolbar = (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.toolRowContent}
    >
      <ToolbarPill key="text" icon="text" label="Text" onPress={() => setTextModeActive(true)} />
      <ToolbarPill key="sticker" icon="happy-outline" label="Sticker" />
      <ToolbarPill key="audio" icon="musical-notes" label="Audio" />
      <ToolbarPill key="addclips" icon="add-circle-outline" label="Add Clips" />
      <ToolbarPill key="effects" icon="sparkles-outline" label="Effects" variant="premium" />
      <ToolbarPill key="photo" icon="image-outline" label="Photo" />
      <ToolbarPill key="overlay" icon="layers-outline" label="Overlay" />
      <ToolbarPill key="captions" icon="text-outline" label="Captions" />
      <ToolbarPill key="voice" icon="mic-outline" label="Voice" />
      <ToolbarPill key="filter" icon="color-filter-outline" label="Filter" />
      <ToolbarPill key="import" icon="download-outline" label="Import" />
      <ToolbarPill key="save" icon="save-outline" label="Save" />
    </ScrollView>
  );

  const textModeToolbar = (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <Pressable
        style={{ width: 44, height: 52, alignItems: 'center', justifyContent: 'center', marginLeft: 4 }}
        onPress={() => { setTextModeActive(false); setAddTextPanelOpen(false); }}
        hitSlop={8}
      >
        <Ionicons name="chevron-back" size={24} color="#fff" />
      </Pressable>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 8, paddingRight: 20, gap: 10, alignItems: 'center' }}>
        <ToolbarPill key="addtext" icon="add" label="Add text" active={true} onPress={() => setAddTextPanelOpen(true)} />
        <ToolbarPill key="captions" icon="chatbox-outline" label="Auto Caption" variant="ai" />
        <ToolbarPill key="stickers" icon="happy-outline" label="Stickers" />
        <ToolbarPill key="draw" icon="brush-outline" label="Draw" />
        <ToolbarPill key="templates" icon="document-text-outline" label="Templates" />
        <ToolbarPill key="autolyrics" icon="musical-notes-outline" label="AutoLyrics" />
      </ScrollView>
    </View>
  );

  const contextualToolbar = (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <Pressable
        style={styles.ctxBackBtn}
        onPress={() => setSelectedOverlayId(null)}
        hitSlop={8}
      >
        <Ionicons name="chevron-back" size={24} color="#fff" />
      </Pressable>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.ctxScrollContent}
      >
        <ToolbarPill key="split" icon="cut-outline" label="Split" />
        <ToolbarPill
          key="style"
          icon="color-palette-outline"
          label="Style"
          variant="brand"
          onPress={() => {
            if (!selectedOverlayId) return;
            const item = textOverlays.find(o => o.id === selectedOverlayId);
            if (!item) return;
            setEditingOverlayId(selectedOverlayId);
            setDraftText(item.text);
            setActiveTextTab(2);
            setAddTextPanelOpen(true);
          }}
        />
        <ToolbarPill key="captions" icon="create-outline" label="Captions" />
        <ToolbarPill key="duplicate" icon="copy-outline" label="Duplicate" />
        <ToolbarPill
          key="delete"
          icon="trash-outline"
          label="Delete"
          variant="danger"
          onPress={() => {
            if (selectedOverlayId) {
              deleteOverlay(selectedOverlayId);
              setSelectedOverlayId(null);
            }
          }}
        />
        <ToolbarPill key="removefiller" icon="remove-circle-outline" label="Remove filler" />
        <ToolbarPill key="tts" icon="volume-high-outline" label="TTS" />
        <ToolbarPill key="avatars" icon="person-outline" label="AI avatars" variant="ai" />
        <ToolbarPill key="basic" icon="square-outline" label="Basic" />
        <ToolbarPill key="layers" icon="layers-outline" label="Layers" />
      </ScrollView>
    </View>
  );

  const textEditor = (
    <Animated.View style={[styles.tepPanel, { paddingBottom: insets.bottom || 16, transform: [{ translateY: tepSheetY }] }]}>
      {/* Drag handle zone */}
      <View style={styles.tepDragZone} {...tepPan.panHandlers}>
        <View style={styles.tepHandle} />
      </View>

      {/* Input row */}
      <View style={styles.tepInputRow}>
        <TextInput
          style={styles.tepInput}
          placeholder="Enter text"
          placeholderTextColor="#555"
          value={draftText}
          onChangeText={setDraftText}
        />
        <Pressable style={styles.tepInputBtn} onPress={() => tepSnapTo(tepSnapRef.current <= TEP_COLLAPSED ? TEP_EXPANDED : TEP_COLLAPSED)} hitSlop={6}>
          <Ionicons name="expand-outline" size={18} color="#999" />
        </Pressable>
        <Pressable style={styles.tepCheckBtn} onPress={() => {
          if (editingOverlayId) {
            setTextOverlays(prev => prev.map(o => o.id === editingOverlayId ? { ...o, text: draftText.trim() || o.text } : o));
            setEditingOverlayId(null);
          } else if (draftText.trim()) {
            addTextOverlay();
          }
          setAddTextPanelOpen(false);
        }} hitSlop={6}>
          <Ionicons name="checkmark" size={20} color="#fff" />
        </Pressable>
      </View>

      {/* Primary tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tepTabRow} contentContainerStyle={styles.tepTabContent}>
        {TEXT_EDITOR_TABS.map((tab, i) => (
          <Pressable key={tab} style={i === activeTextTab ? styles.tepTabActive : styles.tepTab} onPress={() => setActiveTextTab(i)}>
            <Text style={i === activeTextTab ? styles.tepTabTextActive : styles.tepTabText}>{tab}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* ── Templates tab: category strip + template grid ── */}
      {activeTextTab === 0 && (
        <>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tepCatRow} contentContainerStyle={styles.tepCatContent}>
            <View style={styles.tepSearchChip}>
              <Ionicons name="search" size={14} color="#777" />
            </View>
            {TEMPLATE_CATEGORIES.map(cat => (
              <View key={cat} style={styles.tepCatChip}>
                <Text style={styles.tepCatText} numberOfLines={1}>{cat}</Text>
              </View>
            ))}
          </ScrollView>
          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
            <View style={styles.tepGrid}>
              {(TAB_DATA[0] ?? []).map((t: any, i: number) => (
                <View
                  key={t.id}
                  style={[
                    styles.tepCard,
                    { backgroundColor: t.bg, width: CARD_W, height: 90 },
                    i === 0 && styles.tepCardSelected,
                  ]}
                >
                  {t.premium && (
                    <View style={styles.tepPremium}>
                      <Ionicons name="star" size={9} color="#FFD700" />
                    </View>
                  )}
                  <Text
                    style={[
                      styles.tepCardLabel,
                      { color: t.color },
                      t.bold ? { fontWeight: '800' } : undefined,
                      t.italic ? { fontStyle: 'italic' } : undefined,
                      t.fontSize ? { fontSize: t.fontSize } : undefined,
                    ]}
                    numberOfLines={2}
                  >
                    {t.label}
                  </Text>
                </View>
              ))}
            </View>
          </ScrollView>
        </>
      )}

      {/* ── Fonts tab: font category row + per-category font grid ── */}
      {activeTextTab === 1 && (
        <>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tepCatRow} contentContainerStyle={styles.tepCatContent}>
            {FONT_CATEGORIES.map((cat, i) => (
              <Pressable
                key={cat}
                style={[styles.tepCatChip, i === activeFontCategory && { backgroundColor: '#333' }]}
                onPress={() => setActiveFontCategory(i)}
              >
                <Text style={[styles.tepCatText, i === activeFontCategory && { color: '#fff' }]} numberOfLines={1}>{cat}</Text>
              </Pressable>
            ))}
          </ScrollView>
          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 8, paddingBottom: 60 }}>
              {(FONT_CATEGORY_DATA[FONT_CATEGORIES[activeFontCategory]] ?? []).map((f) => (
                <View
                  key={f.id}
                  style={{
                    width: FONT_CARD_W,
                    height: 68,
                    backgroundColor: '#1e1e1e',
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: '#2a2a2a',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ color: '#ccc', fontSize: 12, fontWeight: '500', textAlign: 'center' }} numberOfLines={1}>{f.label}</Text>
                </View>
              ))}
            </View>
          </ScrollView>
        </>
      )}

      {/* ── Styles tab: preview row → control chips → dynamic content ── */}
      {activeTextTab === 2 && (
        <>
          {/* 1. Preview row (style presets) */}
          <View style={{ flexShrink: 0, marginTop: 8, marginBottom: 12 }}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}>
              {STYLE_PRESETS.map((preset) => (
                <Pressable
                  key={preset.id}
                  onPress={() => setSelectedStyleId(preset.id)}
                  style={{
                    width: 52,
                    height: 48,
                    borderRadius: 10,
                    backgroundColor: '#1e1e1e',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 1.5,
                    borderColor: selectedStyleId === preset.id ? '#4FC3F7' : '#2a2a2a',
                  }}
                >
                  <Text style={{ color: preset.color, fontSize: 15, fontWeight: preset.fontWeight }}>{preset.label}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          {/* 2. Control chips (secondary tabs) */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tepCatRow} contentContainerStyle={styles.tepCatContent}>
            {STYLES_SUB_TABS.map((tab, i) => (
              <Pressable
                key={tab}
                style={[styles.tepCatChip, i === activeStyleTab && { backgroundColor: '#333' }]}
                onPress={() => setActiveStyleTab(i)}
              >
                <Text style={[styles.tepCatText, i === activeStyleTab && { color: '#fff' }]} numberOfLines={1}>{tab}</Text>
              </Pressable>
            ))}
          </ScrollView>

          {/* 3. Dynamic content per control tab */}
          <View style={{ marginTop: 16 }}>
            {/* Text sub-tab */}
            {activeStyleTab === 0 && (
              <View style={{ paddingHorizontal: 16 }}>
                {/* Color palette — Row 1: Neutrals */}
                <View style={{ marginTop: 12 }}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
                    {COLOR_NEUTRALS.map((color, i) => (
                      <Pressable
                        key={'n' + i}
                        onPress={() => setSelectedBrandColor(i)}
                        style={{
                          width: 30,
                          height: 30,
                          borderRadius: 15,
                          backgroundColor: color === 'transparent' ? '#1e1e1e' : color,
                          borderWidth: selectedBrandColor === i ? 2.5 : 1,
                          borderColor: selectedBrandColor === i ? '#4FC3F7' : '#333',
                          transform: [{ scale: selectedBrandColor === i ? 1.1 : 1 }],
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {color === 'transparent' && <Text style={{ color: '#999', fontSize: 14 }}>⊘</Text>}
                      </Pressable>
                    ))}
                  </ScrollView>
                </View>
                {/* Row 2: Vibrant */}
                <View style={{ marginTop: 10 }}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
                    {COLOR_VIBRANT.map((color, i) => {
                      const idx = COLOR_NEUTRALS.length + i;
                      return (
                        <Pressable
                          key={'v' + i}
                          onPress={() => setSelectedBrandColor(idx)}
                          style={{
                            width: 30,
                            height: 30,
                            borderRadius: 15,
                            backgroundColor: color,
                            borderWidth: selectedBrandColor === idx ? 2.5 : 1,
                            borderColor: selectedBrandColor === idx ? '#4FC3F7' : '#333',
                            transform: [{ scale: selectedBrandColor === idx ? 1.1 : 1 }],
                          }}
                        />
                      );
                    })}
                  </ScrollView>
                </View>
                {/* Row 3: Soft / aesthetic */}
                <View style={{ marginTop: 10, marginBottom: 16 }}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
                    {COLOR_SOFT.map((color, i) => {
                      const idx = COLOR_NEUTRALS.length + COLOR_VIBRANT.length + i;
                      return (
                        <Pressable
                          key={'s' + i}
                          onPress={() => setSelectedBrandColor(idx)}
                          style={{
                            width: 30,
                            height: 30,
                            borderRadius: 15,
                            backgroundColor: color,
                            borderWidth: selectedBrandColor === idx ? 2.5 : 1,
                            borderColor: selectedBrandColor === idx ? '#4FC3F7' : '#333',
                            transform: [{ scale: selectedBrandColor === idx ? 1.1 : 1 }],
                          }}
                        />
                      );
                    })}
                  </ScrollView>
                </View>
                {/* Size control */}
                <View style={{ marginBottom: 20 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <Text style={{ color: '#aaa', fontSize: 13, fontWeight: '500' }}>Size</Text>
                    <Text style={{ color: '#fff', fontSize: 13, fontWeight: '600' }}>{fakeSizeVal}</Text>
                  </View>
                  <View style={{ height: 32, justifyContent: 'center' }}>
                    <View style={{ height: 4, backgroundColor: '#2a2a2a', borderRadius: 2 }} />
                    <View style={{ position: 'absolute', left: 0, height: 4, width: `${((fakeSizeVal - 8) / (72 - 8)) * 100}%` as any, backgroundColor: '#4FC3F7', borderRadius: 2 }} />
                    <Pressable
                      style={{
                        position: 'absolute',
                        left: `${((fakeSizeVal - 8) / (72 - 8)) * 100}%` as any,
                        width: 20,
                        height: 20,
                        borderRadius: 10,
                        backgroundColor: '#fff',
                        marginLeft: -10,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: 0.3,
                        shadowRadius: 2,
                        elevation: 3,
                      }}
                    />
                  </View>
                </View>
                {/* Opacity control */}
                <View style={{ marginBottom: 8 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <Text style={{ color: '#aaa', fontSize: 13, fontWeight: '500' }}>Opacity</Text>
                    <Text style={{ color: '#fff', fontSize: 13, fontWeight: '600' }}>{fakeOpacityVal}%</Text>
                  </View>
                  <View style={{ height: 32, justifyContent: 'center' }}>
                    <View style={{ height: 4, backgroundColor: '#2a2a2a', borderRadius: 2 }} />
                    <View style={{ position: 'absolute', left: 0, height: 4, width: `${fakeOpacityVal}%` as any, backgroundColor: '#4FC3F7', borderRadius: 2 }} />
                    <Pressable
                      style={{
                        position: 'absolute',
                        left: `${fakeOpacityVal}%` as any,
                        width: 20,
                        height: 20,
                        borderRadius: 10,
                        backgroundColor: '#fff',
                        marginLeft: -10,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: 0.3,
                        shadowRadius: 2,
                        elevation: 3,
                      }}
                    />
                  </View>
                </View>
              </View>
            )}

            {/* Brand colors sub-tab */}
            {activeStyleTab === 1 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 12, alignItems: 'center' }}>
                {BRAND_COLORS.map((color, i) => (
                  <Pressable
                    key={color}
                    onPress={() => setSelectedBrandColor(i)}
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 17,
                      backgroundColor: color,
                      borderWidth: i === selectedBrandColor ? 2.5 : 1,
                      borderColor: i === selectedBrandColor ? '#fff' : '#333',
                    }}
                  />
                ))}
              </ScrollView>
            )}

            {/* Other sub-tabs: placeholder */}
            {activeStyleTab >= 2 && (
              <Text style={{ color: '#444', fontSize: 13, textAlign: 'center', marginTop: 40 }}>Coming soon</Text>
            )}
          </View>
        </>
      )}

      {/* ── Other tabs: generic grid ── */}
      {activeTextTab >= 3 && (
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
          <View style={styles.tepGrid}>
            {(TAB_DATA[activeTextTab] ?? []).map((t: any, i: number) => (
              <View
                key={t.id}
                style={[
                  styles.tepCard,
                  { backgroundColor: t.bg, width: CARD_W, height: 90 },
                  i === 0 && styles.tepCardSelected,
                ]}
              >
                <Text
                  style={[
                    styles.tepCardLabel,
                    { color: t.color },
                  ]}
                  numberOfLines={2}
                >
                  {t.label}
                </Text>
              </View>
            ))}
          </View>
        </ScrollView>
      )}
    </Animated.View>
  );

  const screenHeight = Dimensions.get('window').height;
  const sheetHidden = screenHeight;
  const sheetMid = screenHeight * 0.6;
  const sheetFull = screenHeight * 0.2;
  const sheetTranslateY = useRef(new Animated.Value(sheetHidden)).current;
  const sheetSnapRef = useRef(sheetHidden);

  const openSheet = () => {
    sheetSnapRef.current = sheetMid;
    Animated.spring(sheetTranslateY, { toValue: sheetMid, useNativeDriver: true }).start();
  };

  const sheetPan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 5,
      onPanResponderMove: (_, g) => {
        const next = sheetSnapRef.current + g.dy;
        if (next >= sheetFull) {
          sheetTranslateY.setValue(next);
        }
      },
      onPanResponderRelease: (_, g) => {
        const current = sheetSnapRef.current + g.dy;
        let target: number;
        if (g.dy < -50) {
          target = sheetSnapRef.current === sheetMid ? sheetFull : sheetMid;
        } else if (g.dy > 50) {
          target = sheetSnapRef.current === sheetFull ? sheetMid : sheetHidden;
        } else {
          target = current < (sheetMid + sheetFull) / 2 ? sheetFull : sheetMid;
        }
        sheetSnapRef.current = target;
        Animated.spring(sheetTranslateY, { toValue: target, useNativeDriver: true }).start();
        if (target === sheetHidden) setSelectedSeparatorIndex(null);
      },
    }),
  ).current;

  const transitionPanel = selectedSeparatorIndex !== null && (
    <Animated.View style={[styles.sheet, { transform: [{ translateY: sheetTranslateY }] }]} {...sheetPan.panHandlers}>
      {/* Handle */}
      <View style={styles.handle} />

      {/* Search row */}
      <View style={styles.searchRow}>
        <TextInput placeholder="Search..." placeholderTextColor="#666" style={styles.searchInput} />
        <Text style={styles.check}>✔</Text>
      </View>

      {/* Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sheetTabs}>
        {['AI transition', 'Trending', 'Classic', 'New', 'Camera', 'Blur', 'Basic', 'Mask', 'Slide', 'Glitch', 'Distortion', 'Light', 'Overlay'].map((tab, i) => (
          <Text key={tab} style={i === 0 ? styles.sheetTabActive : styles.sheetTab}>{tab}</Text>
        ))}
      </ScrollView>

      {/* Grid */}
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.sheetGrid}>
          {Array.from({ length: 20 }).map((_, i) => (
            <View key={i} style={styles.sheetGridItem} />
          ))}
        </View>
      </ScrollView>
    </Animated.View>
  );

  /* ── STATE B: Raised / advanced edit mode ── */
  if (isFullscreen) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#000" translucent />

        {/* Header */}
        <View style={[styles.header, { paddingTop: topPadding }]}>
          <Pressable style={styles.headerButton} onPress={() => setIsFullscreen(false)} hitSlop={12}>
            <Ionicons name="chevron-back" size={28} color="#fff" />
          </Pressable>
          <Text style={styles.headerTitle}>Edit</Text>
          <Pressable style={styles.headerButton} hitSlop={8}>
            <Text style={styles.nextText}>Next</Text>
          </Pressable>
        </View>

        {/* Content — static vertical flow */}
        <View style={styles.content}>
          {/* Preview */}
          <View style={styles.previewWrapper}>
            <View style={styles.videoInner}>
              {videoElement}
            </View>
            {textOverlays.length > 0 && (
              <View style={[styles.overlayLayer, styles.overlayLayerRounded]} onLayout={(e) => { const { width, height } = e.nativeEvent.layout; canvasSizeRef.current = { w: width, h: height }; }}
                onStartShouldSetResponder={() => true}
                onMoveShouldSetResponder={() => false}
                onResponderGrant={(e) => {
                  deselectTouchRef.current = {
                    startTime: Date.now(),
                    startX: e.nativeEvent.pageX,
                    startY: e.nativeEvent.pageY,
                  };
                }}
                onResponderRelease={(e) => {
                  const start = deselectTouchRef.current;
                  deselectTouchRef.current = null;
                  if (!start) return;
                  const dt = Date.now() - start.startTime;
                  const dx = e.nativeEvent.pageX - start.startX;
                  const dy = e.nativeEvent.pageY - start.startY;
                  const moved = Math.hypot(dx, dy);
                  if (dt < 300 && moved < 10) {
                    setSelectedOverlayId(null);
                  }
                }}
                onResponderTerminate={() => {
                  deselectTouchRef.current = null;
                }}
              >
                {overlayItems}
              </View>
            )}
          </View>

          {/* Controls row */}
          <View style={styles.controlsRow}>
            <Pressable onPress={() => {
              if (isPlaying) { player.pause(); } else {
                // Phase 16.b.1 — Do not call player.play() on a
                // photo segment: the native player has no source
                // loaded and emits a spurious playToEnd that
                // resets isPlaying. The photo clock picks up
                // playback via the isPlaying state change below.
                const current = segments[segmentIndexRef.current];
                if (current && current.mediaType !== 'photo') player.play();
              }
              setIsPlaying(prev => !prev);
            }} hitSlop={8}>
              <Ionicons name={isPlaying ? 'pause' : 'play'} size={18} color="#fff" />
            </Pressable>
            {/* Phase 17.f: Counter moved to timelineCounterCol */}
            <View style={{ flex: 1 }} />
            <View style={styles.controlsRight}>
              <Ionicons name="arrow-undo-outline" size={18} color="#fff" />
              <Ionicons name="arrow-redo-outline" size={18} color="#fff" />
            </View>
          </View>

          {/* Video track — proportional segment strip */}
          <View style={styles.timelineWrapper}>
            {/* Phase 17.f: Fixed counter column — left of scroll column */}
            <View style={styles.timelineCounterCol}>
              <Text style={styles.timelineCounterText}>
                {formatTime(globalTime)}
              </Text>
            </View>
            {/* Phase 17.f: Scroll column — onLayout measures THIS width for scroll math */}
            <View
              style={styles.timelineScrollCol}
              onLayout={(e) => {
                const w = e.nativeEvent.layout.width;
                timelineWidthRef.current = w;
                // Phase 17.0: Update reactive state if viewport changed
                if (w !== viewportWidth) setViewportWidth(w);
              }}
            >
              {/* Phase 17.0: Fixed centered playhead overlay */}
              {totalDuration > 0 && (
                <View
                  style={[
                    styles.playhead,
                    { left: viewportWidth ? viewportWidth / 2 - 1 : 0 },
                  ]}
                />
              )}
              {/* Phase 17.d Batch 1: Animated.ScrollView for UI-thread scroll */}
              <ReAnimated.ScrollView
                ref={scrollViewRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                scrollEventThrottle={16}
                decelerationRate="fast"
                bounces={false}
              alwaysBounceHorizontal={false}
              // Phase 17.0: Half-viewport padding so t=0 and t=totalDuration can reach center
              contentContainerStyle={{ paddingHorizontal: viewportWidth / 2 }}
              // Phase 17.0: Start at t=0 with content centered on playhead
              contentOffset={{ x: 0, y: 0 }}
              // Phase 17.0: Scroll-driven scrub with dual guard (flag + 0.05s tolerance)
              // Safety clamp prevents negative time from momentary platform over-scroll
              onScroll={(e) => {
                const offsetX = e.nativeEvent.contentOffset.x;
                // Phase 17.b.11 (HYBRID-1): Track user-driven scroll position
                // so programmaticScrollTo's backward-detection sees the latest
                // value when the user scrubs and then plays.
                lastScrollXRef.current = offsetX;
                if (isProgrammaticScrollRef.current) return;
                const rawTime = offsetX / PIXELS_PER_SECOND;
                const newTime = Math.max(0, Math.min(totalDuration, rawTime));
                if (Math.abs(newTime - globalTime) < 0.05) return;
                setGlobalTime(newTime);
              }}
              // Phase 17.0: Pause playback when user begins manual scrub
              onScrollBeginDrag={() => {
                // Phase 17.0.1: Enable seek effect gate for user-driven scrub
                isScrubbingRef.current = true;
                isScrubbingShared.value = true; // Phase 17.d Batch 2: gate UI worklet
                // Phase 17.c.7 Fix B: Clear isProgrammaticScrollRef immediately.
                // Otherwise the RAF cleanup (which clears it) runs only after
                // setIsPlaying(false) commits a render, leaving a 16-50ms gap
                // where onScroll suppresses setGlobalTime via the guard.
                // Counter would freeze during user drag, then snap to final
                // position when the flag finally clears.
                isProgrammaticScrollRef.current = false;
                wasPlayingBeforeScrubRef.current = isPlaying;
                if (isPlaying) {
                  player.pause();
                  clearInterval(photoClockRef.current ?? undefined);
                  photoClockRef.current = null;
                  setIsPlaying(false);
                }
              }}
              // Phase 17.0: Resume playback after scroll ends (momentum)
              onMomentumScrollEnd={() => {
                // Phase 17.0.1: Disable seek gate after deceleration completes
                isScrubbingRef.current = false;
                isScrubbingShared.value = false; // Phase 17.d Batch 2
                isProgrammaticScrollRef.current = false;
                // Phase 17.e: Pause-on-Scrub UX. Always prime refs from final
                // scroll position. Do NOT auto-resume playback — user must
                // press Play to continue. This matches CapCut/Premiere
                // behavior and eliminates the snap-back race.
                const finalGlobalTime = lastScrollXRef.current / PIXELS_PER_SECOND;
                const { localTime: primedLocalT } = getSegmentFromGlobalTime(finalGlobalTime);
                nativeTimeRef.current = primedLocalT;
                localTimeRef.current = primedLocalT;
                // Phase 17.d Batch 3 v4: Sync shared value to scrubbed position.
                // Cancels any in-flight withTiming and prevents the worklet from
                // calling scrollTo with the stale pre-scrub value.
                masterTimeShared.value = finalGlobalTime;
                lastAnimatedMasterTimeRef.current = finalGlobalTime;
                wasPlayingBeforeScrubRef.current = false;
              }}
              // Phase 17.0: Resume playback after scroll ends (drag without momentum)
              onScrollEndDrag={() => {
                // Phase 17.0.1: Clear seek gate on drag release (covers slow-release
                //               case that does not enter momentum deceleration)
                isScrubbingRef.current = false;
                isScrubbingShared.value = false; // Phase 17.d Batch 2
                // Phase 17.e: Pause-on-Scrub UX. Always prime refs from final
                // scroll position. Do NOT auto-resume playback.
                const finalGlobalTime = lastScrollXRef.current / PIXELS_PER_SECOND;
                const { localTime: primedLocalT } = getSegmentFromGlobalTime(finalGlobalTime);
                nativeTimeRef.current = primedLocalT;
                localTimeRef.current = primedLocalT;
                // Phase 17.d Batch 3 v4: Sync shared value to scrubbed position.
                masterTimeShared.value = finalGlobalTime;
                lastAnimatedMasterTimeRef.current = finalGlobalTime;
                wasPlayingBeforeScrubRef.current = false;
              }}
            >
            {/* Phase 17.0: Inner content wrapper */}
            <View style={{ width: totalDuration * PIXELS_PER_SECOND }}>
            {/* Phase 17.a: Time ruler — CapCut-grade */}
            <View style={styles.rulerContainer}>
              {rulerTicks}
            </View>
            {/* Segment row */}
            <View style={styles.timelineSegmentRow}>
              <View style={styles.videoTrack}>
                {segments.length > 0 ? (
                  (() => {
                    let cumulativeOffset = 0;
                    return segments.map((seg, index) => {
                      // Phase 17.0: Pixel-based segment width
                      const segmentPx = (seg.duration || 1) * PIXELS_PER_SECOND;
                      cumulativeOffset += segmentPx;
                      const isLast = index === segments.length - 1;
                      return (
                        <React.Fragment key={index}>
                          <View
                            style={[
                              styles.segmentBar,
                              { width: segmentPx },
                              index === 0 && styles.segmentFirst,
                              isLast && styles.segmentLast,
                              index === activeSegmentIndex && { backgroundColor: '#666' },
                            ]}
                          >
                            {/* Phase 17.b.1: Photo thumbnail — explicit % size matches working Phase 16.b preview pattern */}
                            {seg.mediaType === 'photo' && seg.uri && (
                              <ExpoImage
                                source={{ uri: seg.uri }}
                                style={{ width: '100%', height: '100%' }}
                                contentFit="cover"
                              />
                            )}
                            {/* Phase 18.a Step 3: Video thumbnail filmstrip */}
                            {seg.mediaType === 'video' && seg.uri && (
                              <VideoThumbnailStrip
                                uri={seg.uri}
                                segmentPx={segmentPx}
                                duration={seg.duration || 1}
                                isActive={index === activeSegmentIndex}
                              />
                            )}
                          </View>
                          {!isLast && (
                            <Pressable
                              onPress={() => onSeparatorPress(index)}
                              style={[styles.separatorHitbox, { position: 'absolute', left: cumulativeOffset - 6, top: 0 }]}
                              hitSlop={10}
                            >
                              <View style={styles.segmentSeparator} />
                            </Pressable>
                          )}
                        </React.Fragment>
                      );
                    });
                  })()
                ) : (
                  <View style={styles.segmentEmpty}>
                    <Text style={styles.segmentEmptyText}>No segments</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Audio track */}
            {/* Phase 17.0: Pixel-based width matches inner content wrapper */}
            <View style={[styles.track, { width: totalDuration * PIXELS_PER_SECOND }]}>
              <Ionicons name="musical-notes" size={14} color="rgba(255,255,255,0.4)" />
              <Text style={styles.trackText}>Tap to add audio</Text>
            </View>

            {/* Text track — timeline clips */}
            {(() => {
              // ─────────────────────────────────────────────────────────────
              // Phase 11 — Greedy lane assignment with collapsible groups.
              // Multi-member groups collapse to one lane by default.
              // The group containing selectedOverlayId expands: each member
              // receives its own lane via the normal greedy pass.
              // ─────────────────────────────────────────────────────────────
              const groupByOverlayId = computeOverlapGroups(textOverlays);
              const expandedGroupKey: string | null = (() => {
                if (!selectedOverlayId) return null;
                const g = groupByOverlayId[selectedOverlayId];
                return g && g.memberIds.length >= 2 ? g.key : null;
              })();

              const sortedOverlays = [...textOverlays].sort((a, b) => a.startTime - b.startTime);
              const laneEndTimes: number[] = [];
              const overlayLane: { [id: string]: number } = {};
              const groupLaneAssignment: { [groupKey: string]: number } = {};

              for (const ov of sortedOverlays) {
                const group = groupByOverlayId[ov.id];
                const isCollapsedGroup =
                  group.memberIds.length >= 2 && group.key !== expandedGroupKey;

                // Collapsed multi-member group: reuse its single pre-assigned lane
                if (isCollapsedGroup && groupLaneAssignment[group.key] !== undefined) {
                  overlayLane[ov.id] = groupLaneAssignment[group.key];
                  continue;
                }

                // Time range driving lane pick: group span if collapsed, else own
                const useStart = isCollapsedGroup ? group.start : ov.startTime;
                const useEnd = isCollapsedGroup ? group.end : ov.endTime;

                let assigned = -1;
                for (let i = 0; i < laneEndTimes.length; i++) {
                  if (useStart >= laneEndTimes[i]) {
                    assigned = i;
                    laneEndTimes[i] = useEnd;
                    break;
                  }
                }
                if (assigned === -1) {
                  assigned = laneEndTimes.length;
                  laneEndTimes.push(useEnd);
                }
                overlayLane[ov.id] = assigned;

                if (isCollapsedGroup) {
                  groupLaneAssignment[group.key] = assigned;
                }
              }
              const laneCount = Math.max(laneEndTimes.length, 1);
              const LANE_HEIGHT = 28;
              const LANE_GAP = 4;
              const LANE_TOP_PADDING = 4;
              const LANE_MAX_VISIBLE = 3;
              const LANE_VIEWPORT_HEIGHT = LANE_TOP_PADDING * 2 + LANE_MAX_VISIBLE * LANE_HEIGHT + Math.max(0, LANE_MAX_VISIBLE - 1) * LANE_GAP;
              const trackDynamicHeight = LANE_TOP_PADDING * 2 + laneCount * LANE_HEIGHT + Math.max(0, laneCount - 1) * LANE_GAP;

              return (
                <View style={[styles.textTrackLane, { height: LANE_VIEWPORT_HEIGHT }]}>
                  <ScrollView
                    style={{ flex: 1 }}
                    contentContainerStyle={{ height: trackDynamicHeight }}
                    showsVerticalScrollIndicator={true}
                    nestedScrollEnabled={true}
                    scrollEnabled={trackDynamicHeight > LANE_VIEWPORT_HEIGHT}
                  >
                  {/* Background / placeholder layer */}
                  {/* Phase 17.0: Pixel-based width matches inner content wrapper */}
                  <View style={[styles.textTrackBg, { width: totalDuration * PIXELS_PER_SECOND, height: trackDynamicHeight }]}>
                    {textOverlays.length === 0 && (
                      <>
                        <Ionicons name="text" size={14} color="rgba(255,255,255,0.4)" />
                        <Text style={styles.trackText}>Tap to add text</Text>
                      </>
                    )}
                  </View>
                  {/* Clips layer — same coordinate system as segments/playhead */}
                  <View style={styles.textTrackClips} pointerEvents="box-none">
                    {textOverlays.map((item) => {
                      // Phase 17.0: Pixel-based position and width with 24px min
                      const leftPx = item.startTime * PIXELS_PER_SECOND;
                      const widthPx = Math.max((item.endTime - item.startTime) * PIXELS_PER_SECOND, 24);
                      const laneIndex = overlayLane[item.id] ?? 0;
                      const topPx = LANE_TOP_PADDING + laneIndex * (LANE_HEIGHT + LANE_GAP);
                      const rightHandleKey = `${item.id}-right`;
                      if (!trimHandleCacheRef.current[rightHandleKey]) {
                        trimHandleCacheRef.current[rightHandleKey] = PanResponder.create({
                          onStartShouldSetPanResponder: () => true,
                          onMoveShouldSetPanResponder: () => true,
                          onPanResponderGrant: () => {
                            const latest = textOverlaysRef.current.find(o => o.id === item.id);
                            if (!latest) return;
                            // Phase 17.0: Lock horizontal ScrollView while trim handle is active
                            scrollViewRef.current?.setNativeProps({ scrollEnabled: false });
                            isScrubbingRef.current = true;
                            trimStartRef.current[rightHandleKey] = {
                              startTime: latest.startTime,
                              endTime: latest.endTime,
                            };
                          },
                          onPanResponderMove: (_, gesture) => {
                            const startData = trimStartRef.current[rightHandleKey];
                            if (!startData) return;
                            // Phase 17.0: Fixed pixel scale
                            if (totalDuration <= 0) return;
                            const pxPerSecond = PIXELS_PER_SECOND;
                            const timeDelta = gesture.dx / pxPerSecond;
                            const newEnd = startData.endTime + timeDelta;
                            trimOverlay(item.id, startData.startTime, newEnd);
                          },
                          onPanResponderRelease: () => {
                            const latest = textOverlaysRef.current.find(o => o.id === item.id);
                            // Phase 17.0: Re-enable horizontal ScrollView
                            scrollViewRef.current?.setNativeProps({ scrollEnabled: true });
                            isScrubbingRef.current = false;
                            if (latest) {
                              setGlobalTime(latest.endTime);
                              // Phase 17.0: Sync scroll to new playhead position
                              programmaticScrollTo(latest.endTime * PIXELS_PER_SECOND, true);
                            }
                            delete trimStartRef.current[rightHandleKey];
                          },
                          onPanResponderTerminate: () => {
                            // Phase 17.0: Re-enable horizontal ScrollView on cancel
                            scrollViewRef.current?.setNativeProps({ scrollEnabled: true });
                            isScrubbingRef.current = false;
                            delete trimStartRef.current[rightHandleKey];
                          },
                        });
                      }
                      const rightHandleResponder = trimHandleCacheRef.current[rightHandleKey];
                      const leftHandleKey = `${item.id}-left`;
                      if (!trimHandleCacheRef.current[leftHandleKey]) {
                        trimHandleCacheRef.current[leftHandleKey] = PanResponder.create({
                          onStartShouldSetPanResponder: () => true,
                          onMoveShouldSetPanResponder: () => true,
                          onPanResponderGrant: () => {
                            const latest = textOverlaysRef.current.find(o => o.id === item.id);
                            if (!latest) return;
                            // Phase 17.0: Lock horizontal ScrollView while trim handle is active
                            scrollViewRef.current?.setNativeProps({ scrollEnabled: false });
                            isScrubbingRef.current = true;
                            trimStartRef.current[leftHandleKey] = {
                              startTime: latest.startTime,
                              endTime: latest.endTime,
                            };
                          },
                          onPanResponderMove: (_, gesture) => {
                            const startData = trimStartRef.current[leftHandleKey];
                            if (!startData) return;
                            // Phase 17.0: Fixed pixel scale
                            if (totalDuration <= 0) return;
                            const pxPerSecond = PIXELS_PER_SECOND;
                            const timeDelta = gesture.dx / pxPerSecond;
                            const newStart = startData.startTime + timeDelta;
                            trimOverlay(item.id, newStart, startData.endTime);
                          },
                          onPanResponderRelease: () => {
                            const latest = textOverlaysRef.current.find(o => o.id === item.id);
                            // Phase 17.0: Re-enable horizontal ScrollView
                            scrollViewRef.current?.setNativeProps({ scrollEnabled: true });
                            isScrubbingRef.current = false;
                            if (latest) {
                              setGlobalTime(latest.startTime);
                              // Phase 17.0: Sync scroll to new playhead position
                              programmaticScrollTo(latest.startTime * PIXELS_PER_SECOND, true);
                            }
                            delete trimStartRef.current[leftHandleKey];
                          },
                          onPanResponderTerminate: () => {
                            // Phase 17.0: Re-enable horizontal ScrollView on cancel
                            scrollViewRef.current?.setNativeProps({ scrollEnabled: true });
                            isScrubbingRef.current = false;
                            delete trimStartRef.current[leftHandleKey];
                          },
                        });
                      }
                      const leftHandleResponder = trimHandleCacheRef.current[leftHandleKey];
                      return (
                        <Pressable
                          key={item.id}
                          onPress={() => selectOverlayFromTimeline(item.id)}
                          style={[
                            styles.textClipBlock,
                            { left: leftPx, width: widthPx, top: topPx },
                            selectedOverlayId === item.id && { borderColor: '#fff' },
                          ]}
                          hitSlop={{ top: 4, bottom: 4, left: 2, right: 2 }}
                        >
                          <Text style={styles.textClipLabel} numberOfLines={1}>{item.text}</Text>
                          {selectedOverlayId === item.id && (
                            <>
                              <View
                                style={[styles.timelineTrimHandle, styles.timelineTrimHandleLeft]}
                                hitSlop={{ top: 6, bottom: 6, left: 8, right: 8 }}
                                {...leftHandleResponder.panHandlers}
                              >
                                <View style={styles.timelineTrimHandleGrip} pointerEvents="none" />
                              </View>
                              <View
                                style={[styles.timelineTrimHandle, styles.timelineTrimHandleRight]}
                                hitSlop={{ top: 6, bottom: 6, left: 8, right: 8 }}
                                {...rightHandleResponder.panHandlers}
                              >
                                <View style={styles.timelineTrimHandleGrip} pointerEvents="none" />
                              </View>
                            </>
                          )}
                        </Pressable>
                      );
                    })}
                  </View>
                  </ScrollView>
                </View>
              );
            })()}
            </View>
            </ReAnimated.ScrollView>
            </View>{/* timelineScrollCol */}
          </View>
        </View>

        {/* Toolbar — absolute bottom */}
        {addTextPanelOpen ? textEditor : (
          <View style={[styles.bottomDock, { paddingBottom: insets.bottom || 16 }]}>
            {selectedOverlayId !== null ? contextualToolbar : textModeActive ? textModeToolbar : toolbar}
          </View>
        )}
        {transitionPanel}
      </View>
    );
  }

  /* ── STATE A: Normal screen ── */
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" translucent />

      {/* Header */}
      <View style={[styles.header, { paddingTop: topPadding }]}>
        <Pressable style={styles.headerButton} onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={28} color="#fff" />
        </Pressable>
        <Text style={styles.headerTitle}>Edit</Text>
        <Pressable style={styles.headerButton} hitSlop={8}>
          <Text style={styles.nextText}>Next</Text>
        </Pressable>
      </View>

      {/* Full preview */}
      <View style={{ flex: 1 }}>
        <View style={styles.normalPreview} {...previewPan.panHandlers}>
          {videoElement}
        </View>
        {textOverlays.length > 0 && (
          <View style={styles.overlayLayer} onLayout={(e) => { const { width, height } = e.nativeEvent.layout; canvasSizeRef.current = { w: width, h: height }; }}
            onStartShouldSetResponder={() => true}
            onMoveShouldSetResponder={() => false}
            onResponderGrant={(e) => {
              deselectTouchRef.current = {
                startTime: Date.now(),
                startX: e.nativeEvent.pageX,
                startY: e.nativeEvent.pageY,
              };
            }}
            onResponderRelease={(e) => {
              const start = deselectTouchRef.current;
              deselectTouchRef.current = null;
              if (!start) return;
              const dt = Date.now() - start.startTime;
              const dx = e.nativeEvent.pageX - start.startX;
              const dy = e.nativeEvent.pageY - start.startY;
              const moved = Math.hypot(dx, dy);
              if (dt < 300 && moved < 10) {
                setSelectedOverlayId(null);
              }
            }}
            onResponderTerminate={() => {
              deselectTouchRef.current = null;
            }}
          >
            {overlayItems}
          </View>
        )}
      </View>

      {/* Toolbar */}
      {addTextPanelOpen ? textEditor : (
        <View style={[styles.bottomDock, { paddingBottom: insets.bottom || 16 }]}>
          {selectedOverlayId !== null ? contextualToolbar : textModeActive ? textModeToolbar : toolbar}
        </View>
      )}
      {transitionPanel}
    </View>
  );
}
