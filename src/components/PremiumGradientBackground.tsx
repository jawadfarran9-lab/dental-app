import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

/**
 * PremiumGradientBackground
 * 
 * A reusable multi-layer gradient background component that provides a premium
 * light blue aesthetic for external/non-clinic screens. Supports both light and dark modes.
 * 
 * Features:
 * - Layer 1: Base gradient (light blue for light mode, dark slate for dark mode)
 * - Layer 2: Light beam overlay effects (light mode only)
 * - Layer 3: Optional animated sparkle particles (light mode only)
 * 
 * Usage:
 * ```tsx
 * <View style={styles.container}>
 *   <PremiumGradientBackground isDark={isDark} showSparkles={true} />
 *   {/* Your content here *\/}
 * </View>
 * ```
 */

interface PremiumGradientBackgroundProps {
  /** Whether dark mode is active */
  isDark: boolean;
  /** Whether to show animated sparkle particles (default: true, light mode only) */
  showSparkles?: boolean;
  /** Custom style for the container */
  style?: any;
}

// ========== Sparkle Particle Component ==========
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
    const pulseAnimation = () => {
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(opacity, {
            toValue: type === 'shimmer' ? 0.6 : 0.85,
            duration: duration * 0.4,
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: type === 'shimmer' ? 1.2 : 1,
            duration: duration * 0.4,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(opacity, {
            toValue: 0,
            duration: duration * 0.6,
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 0.5,
            duration: duration * 0.6,
            useNativeDriver: true,
          }),
        ]),
      ]).start(() => pulseAnimation());
    };
    pulseAnimation();
  }, [delay, duration, type, opacity, scale]);

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
        <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ position: 'absolute', width: size * 0.25, height: size, backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: size * 0.125 }} />
          <View style={{ position: 'absolute', width: size, height: size * 0.25, backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: size * 0.125 }} />
        </View>
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
          transform: [{ scale }, { rotate: '45deg' }],
        }}
      >
        <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ position: 'absolute', width: size * 0.2, height: size, backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: size * 0.1 }} />
          <View style={{ position: 'absolute', width: size, height: size * 0.2, backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: size * 0.1 }} />
        </View>
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
          width: size * 0.3,
          height: size * 1.5,
          backgroundColor: 'rgba(255,255,255,0.7)',
          borderRadius: size * 0.15,
          opacity,
          transform: [{ scale }, { rotate: '-15deg' }],
        }}
      />
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

// ========== Sparkle Particles Container ==========
const SparkleParticles: React.FC = () => {
  const sparkles = useMemo(() => {
    // Reduced distribution: 10 dots, 4 stars, 2 cross, 2 shimmers = 18 total
    // Concentrated in upper 70% of screen for dreamy effect
    const particles: Array<{
      id: number;
      left: number;
      top: number;
      size: number;
      delay: number;
      duration: number;
      type: 'dot' | 'star' | 'cross' | 'shimmer';
    }> = [];

    // Dots - small glowing circles scattered across upper area
    const dotPositions = [
      { left: 8, top: 12 }, { left: 25, top: 8 }, { left: 45, top: 15 },
      { left: 70, top: 10 }, { left: 88, top: 18 }, { left: 15, top: 35 },
      { left: 55, top: 40 }, { left: 80, top: 32 }, { left: 35, top: 55 },
      { left: 65, top: 60 },
    ];
    dotPositions.forEach((pos, i) => {
      particles.push({
        id: i,
        left: pos.left,
        top: pos.top,
        size: 3 + Math.random() * 3,
        delay: Math.random() * 2000,
        duration: 2000 + Math.random() * 1500,
        type: 'dot',
      });
    });

    // Stars - 4-point sparkles
    const starPositions = [
      { left: 18, top: 22 }, { left: 75, top: 25 },
      { left: 40, top: 48 }, { left: 85, top: 45 },
    ];
    starPositions.forEach((pos, i) => {
      particles.push({
        id: 100 + i,
        left: pos.left,
        top: pos.top,
        size: 12 + Math.random() * 6,
        delay: 500 + Math.random() * 2000,
        duration: 2500 + Math.random() * 1500,
        type: 'star',
      });
    });

    // Cross sparkles
    const crossPositions = [
      { left: 30, top: 18 }, { left: 60, top: 52 },
    ];
    crossPositions.forEach((pos, i) => {
      particles.push({
        id: 200 + i,
        left: pos.left,
        top: pos.top,
        size: 10 + Math.random() * 4,
        delay: 1000 + Math.random() * 1500,
        duration: 3000 + Math.random() * 1000,
        type: 'cross',
      });
    });

    // Shimmers - subtle vertical lines
    const shimmerPositions = [
      { left: 12, top: 45 }, { left: 92, top: 28 },
    ];
    shimmerPositions.forEach((pos, i) => {
      particles.push({
        id: 300 + i,
        left: pos.left,
        top: pos.top,
        size: 8 + Math.random() * 4,
        delay: Math.random() * 2500,
        duration: 3500 + Math.random() * 1500,
        type: 'shimmer',
      });
    });

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

// ========== Main Component ==========
export const PremiumGradientBackground: React.FC<PremiumGradientBackgroundProps> = ({
  isDark,
  showSparkles = true,
  style,
}) => {
  return (
    <View style={[StyleSheet.absoluteFillObject, style]} pointerEvents="none">
      {/* ========== LAYER 1: Base Gradient Background ========== */}
      {/* Multi-stop linear gradient: top-left to bottom-right */}
      {/* Light: #E0F2FE (0%) -> #E4F3FC (20%) -> #EDF8FF (40%) -> #F5FBFF (60%) -> #E4F5FC (80%) -> #E0F2FE (100%) */}
      {/* Dark: Deep slate blue gradient */}
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

      {/* ========== LAYER 2: Light Beam Effects (Light Mode Only) ========== */}
      
      {/* Top-Left Corner Glow: White beam - rgba(255,255,255,0.9) -> transparent */}
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

      {/* Top-Right Soft Blue Glow: rgba(186,230,253,0.5) -> transparent */}
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

      {/* Center Radiant Burst: rgba(255,255,255,0.55) - soft diffused glow */}
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

      {/* ========== LAYER 3: Sparkle Particles (Light Mode Only) ========== */}
      {!isDark && showSparkles && <SparkleParticles />}
    </View>
  );
};

export default PremiumGradientBackground;
