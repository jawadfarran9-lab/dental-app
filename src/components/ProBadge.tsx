import React from 'react';
import { StyleSheet, Text, useColorScheme, View } from 'react-native';

export type ProBadgeProps = {
  size?: 'sm' | 'md';
  label?: string;
};

export const ProBadge: React.FC<ProBadgeProps> = ({ size = 'md', label = 'PRO' }: ProBadgeProps) => {
  const isDark = useColorScheme() === 'dark';
  const bg = isDark ? '#D4AF37' : '#0a7ea4';
  const fg = isDark ? '#1a1513' : '#ffffff';
  const padH = size === 'sm' ? 6 : 8;
  const padV = size === 'sm' ? 3 : 4;
  const fontSize = size === 'sm' ? 10 : 11;

  return (
    <View style={[styles.badge, { backgroundColor: bg, paddingHorizontal: padH, paddingVertical: padV, borderRadius: 8 }]}> 
      <Text style={[styles.text, { color: fg, fontSize }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: { alignSelf: 'flex-start' },
  text: { fontWeight: '800', letterSpacing: 0.5 },
});

export default ProBadge;
