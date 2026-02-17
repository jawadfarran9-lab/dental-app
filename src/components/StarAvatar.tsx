import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import Svg, {
  ClipPath,
  Defs,
  LinearGradient,
  Path,
  Rect,
  Stop,
  Image as SvgImage,
} from 'react-native-svg';
import StarIconOverlay from './StarIconOverlay';

// ─── Star path generator ────────────────────────────────────────────
/**
 * Generates a smooth 5-pointed star SVG path with rounded corners
 * using quadratic Bezier curves between outer and inner points.
 * innerRatio = 0.68 for a fuller, premium look.
 */
function smoothStarPath(
  cx: number,
  cy: number,
  r: number,
  innerRatio = 0.68,
  smoothing = 0.28,
): string {
  const innerR = r * innerRatio;
  const points: { x: number; y: number }[] = [];

  for (let i = 0; i < 10; i++) {
    const angle = (Math.PI / 5) * i - Math.PI / 2;
    const radius = i % 2 === 0 ? r : innerR;
    points.push({
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle),
    });
  }

  const n = points.length;
  let d = `M ${points[0].x} ${points[0].y}`;

  for (let i = 0; i < n; i++) {
    const curr = points[i];
    const next = points[(i + 1) % n];
    const prev = points[(i - 1 + n) % n];

    const dx = next.x - prev.x;
    const dy = next.y - prev.y;

    const cpX = curr.x + dx * smoothing * 0.15;
    const cpY = curr.y + dy * smoothing * 0.15;

    const midX = (curr.x + next.x) / 2;
    const midY = (curr.y + next.y) / 2;

    d += ` Q ${cpX} ${cpY} ${midX} ${midY}`;
  }

  d += ' Z';
  return d;
}

// ─── Types ──────────────────────────────────────────────────────────

type ClinicType = 'dental' | 'laser' | 'beauty';

type StarAvatarProps = {
  /** Total width & height of the avatar (including border). */
  size?: number;
  /** Image URI to clip inside the star. */
  uri?: string | null;
  /** Fallback initials when no image (1–2 chars). */
  initials?: string;
  /** Clinic type for small overlay icon. */
  clinicType?: ClinicType | null;
  /** Show static sparkle accents (profile variant only). */
  showSparkle?: boolean;
  /** Visual variant. */
  variant?: 'profile' | 'list';
  // Legacy compat props ──
  /** Border width in px (default auto per variant). */
  borderWidth?: number;
  /** Border color (default white). */
  borderColor?: string;
};

// ─── Constants ──────────────────────────────────────────────────────

const SCALE_BOOST = 1.08;

const VARIANT_DEFAULTS = {
  profile: { size: 110, borderWidth: 3, shadow: true, glow: true },
  list: { size: 50, borderWidth: 1.5, shadow: false, glow: false },
} as const;

// ─── Component ──────────────────────────────────────────────────────

const StarAvatar: React.FC<StarAvatarProps> = ({
  size: sizeProp,
  uri,
  initials,
  clinicType,
  showSparkle = false,
  variant = 'list',
  borderWidth: borderWidthProp,
  borderColor = '#FFFFFF',
}) => {
  const defaults = VARIANT_DEFAULTS[variant];
  const size = sizeProp ?? defaults.size;
  const borderWidth = borderWidthProp ?? defaults.borderWidth;
  const isProfile = variant === 'profile';

  // ── Geometry ──
  const visualSize = size * SCALE_BOOST;
  const offset = (visualSize - size) / 2;
  const half = visualSize / 2;
  const outerR = half - borderWidth;
  const clipR = outerR - borderWidth * 0.25;

  const hasImage = !!uri;
  const displayInitials = initials ? initials.slice(0, 2).toUpperCase() : '';

  // ── Shadow style per variant ──
  const shadowStyle = isProfile
    ? Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.30,
          shadowRadius: 8,
        },
        android: { elevation: 8 },
      })
    : Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.15,
          shadowRadius: 3,
        },
        android: { elevation: 4 },
      });

  // ── Initials font size ──
  const initialsFontSize = Math.round(size * 0.30);

  return (
    <View style={{ width: size, height: size }}>
      {/* Main star container */}
      <View
        style={[
          {
            position: 'absolute' as const,
            top: -offset,
            left: -offset,
            width: visualSize,
            height: visualSize,
          },
          shadowStyle,
        ]}
      >
        <Svg
          width={visualSize}
          height={visualSize}
          viewBox={`0 0 ${visualSize} ${visualSize}`}
        >
          <Defs>
            <ClipPath id={`starClip_${size}`}>
              <Path d={smoothStarPath(half, half, clipR)} />
            </ClipPath>
            {/* Soft inner glow gradient (profile only) */}
            {isProfile && (
              <LinearGradient id="innerGlow" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor="#FFFFFF" stopOpacity={0.12} />
                <Stop offset="0.5" stopColor="#FFFFFF" stopOpacity={0} />
                <Stop offset="1" stopColor="#000000" stopOpacity={0.06} />
              </LinearGradient>
            )}
            {/* Fallback gradient background */}
            <LinearGradient id="fallbackBg" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor="#4A90D9" stopOpacity={1} />
              <Stop offset="1" stopColor="#1E3A5F" stopOpacity={1} />
            </LinearGradient>
          </Defs>

          {/* Border star */}
          <Path
            d={smoothStarPath(half, half, outerR)}
            fill="none"
            stroke={borderColor}
            strokeWidth={borderWidth}
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {hasImage ? (
            /* Clipped profile image */
            <SvgImage
              href={{ uri: uri! }}
              x={half - clipR}
              y={half - clipR}
              width={clipR * 2}
              height={clipR * 2}
              clipPath={`url(#starClip_${size})`}
              preserveAspectRatio="xMidYMid slice"
            />
          ) : (
            /* Gradient fallback background */
            <Rect
              x={half - clipR}
              y={half - clipR}
              width={clipR * 2}
              height={clipR * 2}
              clipPath={`url(#starClip_${size})`}
              fill="url(#fallbackBg)"
            />
          )}

          {/* Inner glow overlay (profile only) */}
          {isProfile && (
            <Rect
              x={half - clipR}
              y={half - clipR}
              width={clipR * 2}
              height={clipR * 2}
              clipPath={`url(#starClip_${size})`}
              fill="url(#innerGlow)"
            />
          )}
        </Svg>

        {/* Initials overlay (when no image) */}
        {!hasImage && displayInitials.length > 0 && (
          <View style={styles.initialsContainer} pointerEvents="none">
            <Text
              style={[
                styles.initialsText,
                { fontSize: initialsFontSize, lineHeight: initialsFontSize * 1.15 },
              ]}
            >
              {displayInitials}
            </Text>
          </View>
        )}
      </View>

      {/* Static sparkles (profile only, no animation) */}
      {isProfile && showSparkle && (
        <>
          <View
            style={[
              styles.sparkle,
              {
                top: -size * 0.06,
                right: -size * 0.02,
                width: size * 0.10,
                height: size * 0.10,
              },
            ]}
            pointerEvents="none"
          >
            <Svg width="100%" height="100%" viewBox="0 0 16 16">
              <Path
                d="M8 0L9.5 6.5 16 8 9.5 9.5 8 16 6.5 9.5 0 8 6.5 6.5Z"
                fill="#F0C050"
                opacity={0.50}
              />
            </Svg>
          </View>
          <View
            style={[
              styles.sparkle,
              {
                top: size * 0.12,
                right: -size * 0.10,
                width: size * 0.07,
                height: size * 0.07,
              },
            ]}
            pointerEvents="none"
          >
            <Svg width="100%" height="100%" viewBox="0 0 16 16">
              <Path
                d="M8 0L9.5 6.5 16 8 9.5 9.5 8 16 6.5 9.5 0 8 6.5 6.5Z"
                fill="#F0C050"
                opacity={0.40}
              />
            </Svg>
          </View>
        </>
      )}

      {/* Clinic type icon overlay */}
      {clinicType != null && (
        <StarIconOverlay clinicType={clinicType} size={size} />
      )}
    </View>
  );
};

// ─── Static styles ──────────────────────────────────────────────────

const styles = StyleSheet.create({
  initialsContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initialsText: {
    color: '#FFFFFF',
    fontWeight: '700',
    letterSpacing: 0.5,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.25)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  sparkle: {
    position: 'absolute',
  },
});

export default React.memo(StarAvatar);
