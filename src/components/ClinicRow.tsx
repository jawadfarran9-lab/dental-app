import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useRef } from 'react';
import {
    Animated,
    Easing,
    StyleSheet,
    Text,
    TouchableWithoutFeedback,
    View,
} from 'react-native';
import GlassCard from './GlassCard';
import StarAvatar from './StarAvatar';

// ─── Types ──────────────────────────────────────────────────────────

type ClinicRowProps = {
  clinicId: string;
  name: string;
  city?: string;
  country?: string;
  imageUrl?: string | null;
  rating?: number | null;
  distanceKm?: number | null;
  clinicType?: 'dental' | 'laser' | 'beauty' | null;
  isOwn?: boolean;
  isDark?: boolean;
  onPress: () => void;
};

// ─── Component ──────────────────────────────────────────────────────

const ClinicRow: React.FC<ClinicRowProps> = ({
  name,
  city,
  country,
  imageUrl,
  rating,
  distanceKm,
  clinicType,
  isOwn = false,
  isDark = false,
  onPress,
}) => {
  // Derive initials from clinic name
  const initials = name
    ? name
        .split(/\s+/)
        .slice(0, 2)
        .map((w) => w[0])
        .join('')
        .toUpperCase()
    : '';

  const locationText = [city, country].filter(Boolean).join(', ');

  const hasRating = rating != null && rating > 0;

  const distanceLabel =
    distanceKm != null
      ? distanceKm < 1
        ? `${Math.round(distanceKm * 1000)} m`
        : `${distanceKm.toFixed(1)} km`
      : null;

  // ── Colors (theme-aware) ──
  const accentClr = isDark ? '#3D9EFF' : '#2B7FD4';
  const nameFg = isDark ? '#F0F2F5' : '#1A2B3F';
  const subtextFg = isDark ? '#8A96A6' : '#7A8A9C';
  const mutedFg = isDark ? '#5A6878' : '#B0BAC5';
  const ratingGold = isDark ? '#E8C94A' : '#C8960F';
  const chevronClr = isDark ? '#454F5C' : '#C8D0D8';

  // ── Micro-motion: Animated press feedback ──
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const onPressIn = useCallback(() => {
    Animated.timing(scaleAnim, {
      toValue: 0.985,
      duration: 120,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, [scaleAnim]);

  const onPressOut = useCallback(() => {
    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: 120,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, [scaleAnim]);

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <GlassCard
        intensity={isOwn ? 45 : 30}
        tint={isDark ? 'dark' : 'light'}
        borderRadius={18}
        style={rowStyles.glassOuter}
      >
        <TouchableWithoutFeedback
          onPress={onPress}
          onPressIn={onPressIn}
          onPressOut={onPressOut}
        >
          <View style={rowStyles.card}>
        {/* ── Left accent bar for owned clinic ── */}
        {isOwn && <View style={[rowStyles.accentBar, { backgroundColor: accentClr }]} />}

        {/* ── Left: Star Avatar ── */}
        <View style={rowStyles.avatarWrap}>
          <StarAvatar
            size={52}
            uri={imageUrl}
            initials={initials}
            variant="list"
            clinicType={clinicType ?? undefined}
            borderWidth={1.5}
          />
        </View>

        {/* ── Center: Text Stack ── */}
        <View style={rowStyles.center}>
          {/* YOUR CLINIC label */}
          {isOwn && (
            <Text style={[rowStyles.ownLabel, { color: accentClr }]}>
              YOUR CLINIC
            </Text>
          )}
          {/* Line 1: Name + Rating inline */}
          <View style={rowStyles.line1}>
            <Text style={[rowStyles.name, { color: nameFg }]} numberOfLines={1}>
              {name}
            </Text>
            {hasRating && (
              <Text style={[rowStyles.ratingInline, { color: ratingGold }]}>
                ★ {rating!.toFixed(1)}
              </Text>
            )}
          </View>

          {/* Line 2: Location + Distance */}
          <View style={rowStyles.line2}>
            {locationText.length > 0 && (
              <>
                <Ionicons name="location-outline" size={11} color={subtextFg} />
                <Text
                  style={[rowStyles.location, { color: subtextFg }]}
                  numberOfLines={1}
                >
                  {locationText}
                </Text>
              </>
            )}
            {distanceLabel != null && (
              <View style={[rowStyles.distancePill, { backgroundColor: isDark ? 'rgba(61,158,255,0.12)' : 'rgba(61,158,255,0.08)' }]}>
                <Ionicons name="navigate-outline" size={10} color={accentClr} />
                <Text style={[rowStyles.distancePillText, { color: accentClr }]}>
                  {distanceLabel}
                </Text>
              </View>
            )}
          </View>
        </View>

          {/* ── Right: Chevron ── */}
          <Ionicons name="chevron-forward" size={15} color={chevronClr} />
          </View>
        </TouchableWithoutFeedback>
      </GlassCard>
    </Animated.View>
  );
};

// ─── Styles ─────────────────────────────────────────────────────────

const rowStyles = StyleSheet.create({
  glassOuter: {
    // spacing handled by FlatList gap; no shadow here — GlassCard owns borders
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingLeft: 12,
    paddingRight: 14,
    gap: 12,
  },
  accentBar: {
    position: 'absolute',
    left: 0,
    top: 8,
    bottom: 8,
    width: 3,
    borderRadius: 2,
  },
  avatarWrap: {
    // keep wrapper for layout; no shadow — GlassCard owns visual surface
  },
  center: {
    flex: 1,
    gap: 2,
  },
  ownLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    opacity: 0.7,
    marginBottom: 1,
  },
  line1: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.1,
    flexShrink: 1,
  },
  ratingInline: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.2,
    marginLeft: 2,
  },
  line2: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  location: {
    fontSize: 13,
    fontWeight: '400',
    letterSpacing: 0.05,
    flexShrink: 1,
  },
  dot: {
    fontSize: 10,
  },
  distancePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
  },
  distancePillText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
});

export default React.memo(ClinicRow);
