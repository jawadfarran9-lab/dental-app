import React from 'react';
import { Platform, StyleSheet, StyleProp, View, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';

type GlassCardProps = {
  children: React.ReactNode;
  intensity?: number;
  tint?: 'light' | 'dark' | 'default';
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
};

const GlassCard: React.FC<GlassCardProps> = ({
  children,
  intensity = 45,
  tint = 'light',
  borderRadius = 22,
  style,
}) => (
  <View style={[styles.container, { borderRadius }, style]}>
    <BlurView
      intensity={Platform.OS === 'ios' ? intensity : 0}
      tint={tint}
      style={StyleSheet.absoluteFill}
    />
    {/* Fallback fill for Android (no native blur) */}
    {Platform.OS === 'android' && (
      <View style={[StyleSheet.absoluteFill, styles.androidFill]} />
    )}
    {children}
  </View>
);

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.22)',
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  androidFill: {
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
});

export default React.memo(GlassCard);
