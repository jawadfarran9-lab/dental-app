import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/src/context/ThemeContext';
import { getStaticMapUrl } from '@/src/utils/googleStaticMap';

const ACCENT = '#3D9EFF';

export interface StaticMapPreviewProps {
  lat: number;
  lng: number;
  /** Shown as a fallback label when the image cannot load */
  address?: string;
}

/**
 * Lightweight static map preview using Google Static Maps API.
 * No MapView instance — just an <Image> with a rounded glass container.
 *
 * Falls back to the icon placeholder if the URL cannot be generated
 * (missing API key, invalid coords, etc.).
 */
function StaticMapPreview({ lat, lng, address }: StaticMapPreviewProps) {
  const { colors, isDark } = useTheme();

  const url = useMemo(
    () => getStaticMapUrl({ lat, lng, zoom: 15, width: 400, height: 200, scale: 2 }),
    [lat, lng],
  );

  const containerStyle = [
    styles.container,
    {
      backgroundColor: isDark ? 'rgba(61,158,255,0.08)' : 'rgba(61,158,255,0.06)',
      borderColor: isDark ? 'rgba(61,158,255,0.18)' : 'rgba(61,158,255,0.14)',
    },
  ];

  if (!url) {
    // Fallback: keep same placeholder as before
    return (
      <View style={containerStyle}>
        <View style={styles.pinRing}>
          <Ionicons name="location-sharp" size={26} color={ACCENT} />
        </View>
        <Text style={[styles.label, { color: colors.textSecondary }]}>Map preview</Text>
      </View>
    );
  }

  return (
    <View style={containerStyle}>
      <Image
        source={{ uri: url }}
        style={styles.image}
        resizeMode="cover"
        // Keep placeholder visible while loading
        defaultSource={undefined}
        accessibilityLabel={address ? `Map showing ${address}` : 'Clinic location map preview'}
      />
    </View>
  );
}

export default React.memo(StaticMapPreview);

const styles = StyleSheet.create({
  container: {
    borderRadius: 18,
    borderWidth: 1,
    height: 120,
    overflow: 'hidden',
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  pinRing: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(61,158,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    opacity: 0.6,
  },
});
