import React from 'react';
import { Platform, View } from 'react-native';
import Svg, { ClipPath, Defs, Path, Image as SvgImage } from 'react-native-svg';

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

    // Control point: pull slightly toward neighbours for rounding
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

type Props = {
  /** Total width & height of the avatar (including border). */
  size: number;
  /** Image URI to clip inside the star. */
  uri: string;
  /** Border width in px (default 2.5). */
  borderWidth?: number;
  /** Border color (default white). */
  borderColor?: string;
};

const SCALE_BOOST = 1.08;

const StarAvatar: React.FC<Props> = ({
  size,
  uri,
  borderWidth = 2.5,
  borderColor = '#FFFFFF',
}) => {
  // Scale boost without affecting layout
  const visualSize = size * SCALE_BOOST;
  const offset = (visualSize - size) / 2;
  const half = visualSize / 2;

  // Outer star radius for border stroke
  const outerR = half - borderWidth;
  // Clip radius fills fully — no internal padding
  const clipR = outerR - borderWidth * 0.25;

  return (
    <View
      style={{
        width: size,
        height: size,
      }}
    >
      <View
        style={{
          position: 'absolute',
          top: -offset,
          left: -offset,
          width: visualSize,
          height: visualSize,
          ...Platform.select({
            ios: {
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 3 },
              shadowOpacity: 0.25,
              shadowRadius: 6,
            },
            android: {
              elevation: 6,
            },
          }),
        }}
      >
        <Svg
          width={visualSize}
          height={visualSize}
          viewBox={`0 0 ${visualSize} ${visualSize}`}
        >
          <Defs>
            <ClipPath id="starClip">
              <Path d={smoothStarPath(half, half, clipR)} />
            </ClipPath>
          </Defs>

          {/* Border star — smooth path */}
          <Path
            d={smoothStarPath(half, half, outerR)}
            fill="none"
            stroke={borderColor}
            strokeWidth={borderWidth}
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {/* Clipped profile image — fills entire star */}
          <SvgImage
            href={{ uri }}
            x={half - clipR}
            y={half - clipR}
            width={clipR * 2}
            height={clipR * 2}
            clipPath="url(#starClip)"
            preserveAspectRatio="xMidYMid slice"
          />
        </Svg>
      </View>
    </View>
  );
};

export default React.memo(StarAvatar);
