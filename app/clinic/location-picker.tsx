import { useTheme } from '@/src/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import MapView, { MapPressEvent, Marker, Region } from 'react-native-maps';

// ─── Default fallback (London) ───
const DEFAULT_REGION: Region = {
  latitude: 51.5074,
  longitude: -0.1278,
  latitudeDelta: 0.01,
  longitudeDelta: 0.01,
};

/**
 * Location Picker Screen
 *
 * Route: /clinic/location-picker
 *
 * Params (optional):
 *   lat, lng — pre-existing clinic location to center on
 *
 * Returns via router.back() + router.setParams():
 *   pickedLat, pickedLng, pickedAddress
 */
export default function LocationPickerScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ lat?: string; lng?: string }>();
  const { colors, isDark } = useTheme();

  const mapRef = useRef<MapView>(null);
  const [region, setRegion] = useState<Region>(DEFAULT_REGION);
  const [marker, setMarker] = useState<{ latitude: number; longitude: number } | null>(null);
  const [address, setAddress] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);

  // ─── Initialize: center on existing coords or user location ───
  useEffect(() => {
    (async () => {
      // If clinic already has a location, center there
      if (params.lat && params.lng) {
        const lat = parseFloat(params.lat);
        const lng = parseFloat(params.lng);
        if (!isNaN(lat) && !isNaN(lng)) {
          const initial: Region = {
            latitude: lat,
            longitude: lng,
            latitudeDelta: 0.005,
            longitudeDelta: 0.005,
          };
          setRegion(initial);
          setMarker({ latitude: lat, longitude: lng });
          reverseGeocode(lat, lng);
          setLoading(false);
          return;
        }
      }

      // Otherwise try user's current location
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          const userRegion: Region = {
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
            latitudeDelta: 0.008,
            longitudeDelta: 0.008,
          };
          setRegion(userRegion);
        }
      } catch {
        // Silently fall back to default
      } finally {
        setLoading(false);
      }
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Reverse geocode helper ───
  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    try {
      const results = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
      if (results.length > 0) {
        const r = results[0];
        const parts = [r.name, r.street, r.city, r.region, r.country].filter(Boolean);
        setAddress(parts.join(', '));
      } else {
        setAddress(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
      }
    } catch {
      setAddress(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
    }
  }, []);

  // ─── Handle map tap ───
  const onMapPress = useCallback(
    (e: MapPressEvent) => {
      const { latitude, longitude } = e.nativeEvent.coordinate;
      setMarker({ latitude, longitude });
      reverseGeocode(latitude, longitude);
    },
    [reverseGeocode],
  );

  // ─── Confirm selection ───
  const onConfirm = useCallback(() => {
    if (!marker) return;
    setConfirming(true);

    // Pass data back via search params
    router.navigate({
      pathname: '/clinic/settings' as any,
      params: {
        pickedLat: String(marker.latitude),
        pickedLng: String(marker.longitude),
        pickedAddress: address,
      },
    });
  }, [marker, address, router]);

  // ─── Close ───
  const onClose = useCallback(() => {
    router.back();
  }, [router]);

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color="#3D9EFF" />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          Getting your location…
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Map */}
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFillObject}
        initialRegion={region}
        onPress={onMapPress}
        showsUserLocation
        showsMyLocationButton={false}
        userInterfaceStyle={isDark ? 'dark' : 'light'}
      >
        {marker && (
          <Marker
            coordinate={marker}
            draggable
            onDragEnd={(e) => {
              const { latitude, longitude } = e.nativeEvent.coordinate;
              setMarker({ latitude, longitude });
              reverseGeocode(latitude, longitude);
            }}
          />
        )}
      </MapView>

      {/* Top bar: back button */}
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={onClose}
          style={[styles.backBtn, { backgroundColor: isDark ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.9)' }]}
        >
          <Ionicons name="arrow-back" size={22} color={isDark ? '#FFF' : '#1A2B3F'} />
        </TouchableOpacity>
      </View>

      {/* Bottom card */}
      <View
        style={[
          styles.bottomCard,
          {
            backgroundColor: isDark ? 'rgba(20,30,50,0.92)' : 'rgba(255,255,255,0.95)',
            borderColor: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.06)',
          },
        ]}
      >
        {/* Instruction or address */}
        {marker ? (
          <>
            <View style={styles.addressRow}>
              <Ionicons name="location" size={18} color="#3D9EFF" />
              <Text
                style={[styles.addressText, { color: colors.textPrimary }]}
                numberOfLines={2}
              >
                {address || 'Resolving address…'}
              </Text>
            </View>
            <TouchableOpacity
              onPress={onConfirm}
              disabled={confirming}
              activeOpacity={0.8}
              style={styles.confirmBtn}
            >
              {confirming ? (
                <ActivityIndicator size={16} color="#FFF" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={18} color="#FFF" />
                  <Text style={styles.confirmBtnText}>Confirm Location</Text>
                </>
              )}
            </TouchableOpacity>
          </>
        ) : (
          <Text style={[styles.hintText, { color: colors.textSecondary }]}>
            Tap on the map to select your clinic's location
          </Text>
        )}
      </View>
    </View>
  );
}

// ─── Styles ───
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '500',
  },

  // Top bar
  topBar: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 56 : 40,
    left: 16,
    zIndex: 10,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.12,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
      },
      android: { elevation: 4 },
    }),
  },

  // Bottom card
  bottomCard: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 40 : 24,
    left: 16,
    right: 16,
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 18,
    gap: 14,
    ...Platform.select({
      ios: {
        shadowColor: '#0D1B2A',
        shadowOpacity: 0.14,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 6 },
      },
      android: { elevation: 8 },
    }),
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  addressText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
  hintText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    paddingVertical: 4,
  },

  // Confirm button
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#3D9EFF',
    borderRadius: 16,
    paddingVertical: 13,
    ...Platform.select({
      ios: {
        shadowColor: '#3D9EFF',
        shadowOpacity: 0.3,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 3 },
      },
      android: { elevation: 4 },
    }),
  },
  confirmBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFF',
    letterSpacing: 0.2,
  },
});
