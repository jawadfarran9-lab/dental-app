import { PublicClinic } from '@/src/services/publicClinics';
import { getDistanceBetween } from '@/src/utils/geoDistance';
import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import {
    Image,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

type Props = {
  clinic: PublicClinic;
  userLocation: { lat: number; lng: number } | null;
  isDark: boolean;
  onOpen: () => void;
  onClose: () => void;
};

/**
 * Floating preview card shown when a map marker is tapped.
 * Displays clinic hero image, name, distance pill, and Open button.
 */
function ClinicMapPreviewCard({ clinic, userLocation, isDark, onOpen, onClose }: Props) {
  const distanceKm = useMemo(() => {
    if (!userLocation || !clinic.geo?.lat || !clinic.geo?.lng) return null;
    return getDistanceBetween(userLocation, clinic.geo);
  }, [userLocation, clinic.geo]);

  const bg = isDark ? 'rgba(22,28,36,0.92)' : 'rgba(255,255,255,0.95)';
  const textPrimary = isDark ? '#E8EDF2' : '#1A2A3A';
  const textSecondary = isDark ? '#7A8A9C' : '#6A7A8C';
  const borderColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';

  return (
    <View style={[styles.card, { backgroundColor: bg, borderColor }]}>
      {/* Close button */}
      <TouchableOpacity
        style={styles.closeBtn}
        onPress={onClose}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        activeOpacity={0.7}
      >
        <Ionicons name="close" size={18} color={textSecondary} />
      </TouchableOpacity>

      <View style={styles.row}>
        {/* Hero image or placeholder */}
        {clinic.heroImage ? (
          <Image source={{ uri: clinic.heroImage }} style={styles.heroImage} />
        ) : (
          <View style={[styles.heroPlaceholder, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}>
            <Ionicons name="business-outline" size={24} color={textSecondary} />
          </View>
        )}

        {/* Details */}
        <View style={styles.details}>
          <Text style={[styles.name, { color: textPrimary }]} numberOfLines={1}>
            {clinic.name}
          </Text>

          {/* Distance pill */}
          {distanceKm !== null && (
            <View style={[styles.distancePill, { backgroundColor: isDark ? 'rgba(61,158,255,0.12)' : 'rgba(61,158,255,0.08)' }]}>
              <Ionicons name="location" size={11} color="#3D9EFF" />
              <Text style={styles.distanceText}>
                {distanceKm < 1 ? `${Math.round(distanceKm * 1000)} m` : `${distanceKm.toFixed(1)} km`}
              </Text>
            </View>
          )}

          {/* Open Clinic button */}
          <Pressable
            onPress={onOpen}
            style={({ pressed }) => [
              styles.openBtn,
              { opacity: pressed ? 0.8 : 1 },
            ]}
          >
            <Ionicons name="open-outline" size={13} color="#fff" />
            <Text style={styles.openBtnText}>Open Clinic</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

export default React.memo(ClinicMapPreviewCard);

const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    ...Platform.select({
      ios: {
        shadowColor: '#0D1B2A',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.18,
        shadowRadius: 16,
      },
      android: { elevation: 10 },
    }),
  },
  closeBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 2,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  heroImage: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  heroPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  details: {
    flex: 1,
    gap: 6,
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.1,
    paddingRight: 24, // space for close button
  },
  distancePill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  distanceText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#3D9EFF',
    letterSpacing: 0.1,
  },
  openBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 5,
    backgroundColor: '#3D9EFF',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 14,
  },
  openBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.2,
  },
});
