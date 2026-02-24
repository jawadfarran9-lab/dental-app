import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Platform, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

const ACCENT_COLORS = {
  blue:   { border: 'rgba(61,158,255,0.30)',  glow: 'rgba(61,158,255,0.08)',  shadow: '#3D9EFF' },
  green:  { border: 'rgba(16,185,129,0.30)',  glow: 'rgba(16,185,129,0.08)', shadow: '#10b981' },
  purple: { border: 'rgba(139,92,246,0.30)',  glow: 'rgba(139,92,246,0.08)', shadow: '#8b5cf6' },
  gold:   { border: 'rgba(245,158,11,0.30)',  glow: 'rgba(245,158,11,0.08)', shadow: '#f59e0b' },
  none:   { border: 'rgba(255,255,255,0.22)', glow: 'transparent',            shadow: '#000'    },
} as const;

type Accent = keyof typeof ACCENT_COLORS;

interface GlassCardProProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  accent?: Accent;
  intensity?: number;
  rounded?: number;
  isDark?: boolean;
}

const GlassCardPro: React.FC<GlassCardProProps> = ({
  children,
  style,
  accent = 'none',
  intensity = 40,
  rounded = 20,
  isDark = false,
}) => {
  const colors = ACCENT_COLORS[accent];

  return (
    <View
      style={[
        styles.outer,
        {
          borderRadius: rounded,
          borderColor: colors.border,
          shadowColor: colors.shadow,
          backgroundColor: isDark ? 'rgba(20,30,45,0.35)' : 'rgba(255,255,255,0.65)',
        },
        style,
      ]}
    >
      {/* Blur layer — iOS only (Android fallback is the bg color above) */}
      {Platform.OS === 'ios' && (
        <BlurView
          intensity={intensity}
          tint={isDark ? 'dark' : 'light'}
          style={[StyleSheet.absoluteFill, { borderRadius: rounded }]}
        />
      )}

      {/* Inner highlight — subtle top-to-bottom gradient for depth */}
      <LinearGradient
        colors={
          isDark
            ? (['rgba(255,255,255,0.06)', 'rgba(255,255,255,0)'] as const)
            : (['rgba(255,255,255,0.55)', 'rgba(255,255,255,0)'] as const)
        }
        style={styles.innerHighlight}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.45 }}
      />

      {/* Accent edge glow (very subtle bottom highlight) */}
      {accent !== 'none' && (
        <View
          style={[
            styles.accentEdge,
            { backgroundColor: colors.glow },
          ]}
        />
      )}

      {/* Content */}
      <View style={styles.content}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  outer: {
    overflow: 'hidden',
    borderWidth: 1,
    marginBottom: 16,
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  innerHighlight: {
    ...StyleSheet.absoluteFillObject,
    height: '50%',
  },
  accentEdge: {
    position: 'absolute',
    bottom: 0,
    left: 16,
    right: 16,
    height: 2,
    borderRadius: 1,
  },
  content: {
    padding: 16,
  },
});

export default React.memo(GlassCardPro);
