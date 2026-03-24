import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';

const STYLES = [
  'pill-gradient',
  'pill-white',
  'pill-dark',
] as const;

export type LocationStickerStyle = (typeof STYLES)[number];

interface Props {
  name: string;
  styleVariant?: LocationStickerStyle;
  /** When true, shows a subtle lock indicator (editor only). */
  isLocked?: boolean;
}

/** Cycle to next visual variant. */
export function nextLocationStyle(current?: string): LocationStickerStyle {
  const idx = STYLES.indexOf(current as LocationStickerStyle);
  return STYLES[(idx + 1) % STYLES.length];
}

export default function LocationSticker({ name, styleVariant = 'pill-gradient', isLocked }: Props) {
  const v = useMemo(() => variantStyles(styleVariant), [styleVariant]);

  return (
    <View style={[styles.pill, v.pill]}>
      <View style={[styles.iconWrap, v.iconWrap]}>
        <Ionicons name="location-sharp" size={13} color={v.icon} />
      </View>
      <Text style={[styles.label, { color: v.text }]} numberOfLines={1}>
        {name}
      </Text>
      {isLocked && (
        <View style={styles.lockBadge}>
          <Ionicons name="lock-closed" size={8} color="rgba(255,255,255,0.85)" />
        </View>
      )}
    </View>
  );
}

function variantStyles(variant: LocationStickerStyle) {
  switch (variant) {
    case 'pill-white':
      return {
        pill: {
          backgroundColor: 'rgba(255,255,255,0.95)',
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: 'rgba(0,0,0,0.06)',
        } as const,
        iconWrap: { backgroundColor: 'rgba(225,48,108,0.12)' } as const,
        icon: '#E1306C',
        text: '#1C1C1E',
      };
    case 'pill-dark':
      return {
        pill: {
          backgroundColor: 'rgba(28,28,30,0.88)',
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: 'rgba(255,255,255,0.08)',
        } as const,
        iconWrap: { backgroundColor: 'rgba(255,107,107,0.18)' } as const,
        icon: '#FF6B6B',
        text: '#FFFFFF',
      };
    case 'pill-gradient':
    default:
      return {
        pill: { backgroundColor: '#E1306C' } as const,
        iconWrap: { backgroundColor: 'rgba(255,255,255,0.22)' } as const,
        icon: '#FFFFFF',
        text: '#FFFFFF',
      };
  }
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 6,
    paddingRight: 14,
    paddingVertical: 6,
    borderRadius: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 6,
    gap: 7,
  },
  iconWrap: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.2,
    maxWidth: 170,
    ...(Platform.OS === 'ios' ? { fontFamily: 'System' } : {}),
  },
  lockBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
