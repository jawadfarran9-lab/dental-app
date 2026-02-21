import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

const ACCENT = '#3D9EFF';
const RADIUS_OPTIONS = [5, 10, 25, 50] as const;

export interface RadiusSelectorProps {
  valueKm: number;
  onChangeKm: (km: number) => void;
  isDark: boolean;
}

/**
 * Horizontal pill row for selecting a distance radius.
 * Pure presentational — no side effects.
 */
function RadiusSelector({ valueKm, onChangeKm, isDark }: RadiusSelectorProps) {
  return (
    <View style={styles.row}>
      <Ionicons
        name="locate-outline"
        size={13}
        color={isDark ? '#6A7A8C' : '#8A9AAC'}
        style={styles.icon}
      />
      {RADIUS_OPTIONS.map((km) => {
        const active = km === valueKm;
        return (
          <Pressable
            key={km}
            onPress={() => onChangeKm(km)}
            style={({ pressed }) => [
              styles.chip,
              {
                backgroundColor: active
                  ? isDark
                    ? 'rgba(61,158,255,0.18)'
                    : 'rgba(61,158,255,0.10)'
                  : isDark
                    ? 'rgba(255,255,255,0.04)'
                    : 'rgba(255,255,255,0.80)',
                borderColor: active
                  ? isDark
                    ? 'rgba(61,158,255,0.50)'
                    : 'rgba(61,158,255,0.40)'
                  : isDark
                    ? 'rgba(255,255,255,0.08)'
                    : 'rgba(0,0,0,0.06)',
                transform: [{ scale: pressed ? 0.96 : 1 }],
                opacity: pressed ? 0.85 : 1,
              },
            ]}
          >
            <Text
              style={[
                styles.chipLabel,
                {
                  color: active ? ACCENT : isDark ? '#8A96A6' : '#6A7A8C',
                  fontWeight: active ? '700' : '500',
                },
              ]}
            >
              {km} km
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default React.memo(RadiusSelector);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  icon: {
    marginRight: 2,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#0D1B2A',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 2,
      },
      android: { elevation: 1 },
    }),
  },
  chipLabel: {
    fontSize: 12,
    letterSpacing: 0.2,
  },
});
