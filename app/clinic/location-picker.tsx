import { useTheme } from '@/src/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import MapView, { Region } from 'react-native-maps';

// ─── Constants ───
const ACCENT = '#3D9EFF';
const DEBOUNCE_MS = 500;

const DEFAULT_REGION: Region = {
  latitude: 51.5074,
  longitude: -0.1278,
  latitudeDelta: 0.01,
  longitudeDelta: 0.01,
};

// ─── Memoized fixed center pin ───
const CenterPin = React.memo(() => (
  <View style={styles.pinWrap} pointerEvents="none">
    <Ionicons name="location-sharp" size={40} color={ACCENT} />
    {/* Shadow dot at pin tip */}
    <View style={styles.pinDot} />
  </View>
));

/**
 * Full-screen clinic location picker.
 *
 * Route: /clinic/location-picker
 *
 * Incoming params (optional):
 *   lat, lng — center map on existing clinic coords
 *
 * Returns via router.back():
 *   pickedLat, pickedLng, pickedAddress
 */
export default function LocationPickerScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ lat?: string; lng?: string }>();
  const { colors, isDark } = useTheme();

  const mapRef = useRef<MapView>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ─── State ───
  const [initialRegion, setInitialRegion] = useState<Region | null>(null);
  const [center, setCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [address, setAddress] = useState<string>('');
  const [resolving, setResolving] = useState(false);
  const [loading, setLoading] = useState(true);

  // ─── Derived ───
  const canConfirm = useMemo(() => center !== null && !resolving, [center, resolving]);

  // ─── Initialize: existing coords → user location → default ───
  useEffect(() => {
    let cancelled = false;
    (async () => {
      // Pre-existing clinic coords
      if (params.lat && params.lng) {
        const lat = parseFloat(params.lat);
        const lng = parseFloat(params.lng);
        if (!isNaN(lat) && !isNaN(lng)) {
          const region: Region = {
            latitude: lat,
            longitude: lng,
            latitudeDelta: 0.005,
            longitudeDelta: 0.005,
          };
          if (!cancelled) {
            setInitialRegion(region);
            setCenter({ lat, lng });
            reverseGeocode(lat, lng);
            setLoading(false);
          }
          return;
        }
      }

      // User location
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          if (!cancelled) {
            const region: Region = {
              latitude: loc.coords.latitude,
              longitude: loc.coords.longitude,
              latitudeDelta: 0.008,
              longitudeDelta: 0.008,
            };
            setInitialRegion(region);
            setCenter({ lat: loc.coords.latitude, lng: loc.coords.longitude });
            reverseGeocode(loc.coords.latitude, loc.coords.longitude);
          }
        } else if (!cancelled) {
          setInitialRegion(DEFAULT_REGION);
        }
      } catch {
        if (!cancelled) setInitialRegion(DEFAULT_REGION);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Reverse geocode: "Name, City, CountryCode" ───
  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    setResolving(true);
    try {
      const results = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
      if (results.length > 0) {
        const r = results[0];
        // Prefer name → city → isoCountryCode with safe fallbacks
        const name = r.name || r.street || '';
        const city = r.city || r.region || '';
        const country = r.isoCountryCode || r.country || '';
        const parts = [name, city, country].filter(Boolean);
        setAddress(parts.length > 0 ? parts.join(', ') : `${lat.toFixed(5)}, ${lng.toFixed(5)}`);
      } else {
        setAddress(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
      }
    } catch {
      setAddress(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
    } finally {
      setResolving(false);
    }
  }, []);

  // ─── Debounced region change handler ───
  const onRegionChangeComplete = useCallback(
    (region: Region) => {
      // Cancel any pending debounce
      if (debounceTimer.current) clearTimeout(debounceTimer.current);

      debounceTimer.current = setTimeout(() => {
        setCenter({ lat: region.latitude, lng: region.longitude });
        reverseGeocode(region.latitude, region.longitude);
      }, DEBOUNCE_MS);
    },
    [reverseGeocode],
  );

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, []);

  // ─── Confirm: pass params back ───
  const onConfirm = useCallback(() => {
    if (!center) return;
    router.navigate({
      pathname: '..' as any,
      params: {
        pickedLat: String(center.lat),
        pickedLng: String(center.lng),
        pickedAddress: address,
      },
    });
  }, [center, address, router]);

  // ─── Loading state ───
  if (loading || !initialRegion) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={ACCENT} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          Getting your location…
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* ─── Map ─── */}
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFillObject}
        initialRegion={initialRegion}
        onRegionChangeComplete={onRegionChangeComplete}
        showsUserLocation
        showsMyLocationButton={false}
        userInterfaceStyle={isDark ? 'dark' : 'light'}
      />

      {/* ─── Fixed center pin ─── */}
      <CenterPin />

      {/* ─── Top-left back button (glass bubble) ─── */}
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.7}
          style={[
            styles.backBtn,
            {
              backgroundColor: isDark
                ? 'rgba(0,0,0,0.55)'
                : 'rgba(255,255,255,0.88)',
            },
          ]}
        >
          <Ionicons name="arrow-back" size={22} color={isDark ? '#FFF' : '#1A2B3F'} />
        </TouchableOpacity>
      </View>

      {/* ─── Bottom glass card ─── */}
      <View
        style={[
          styles.bottomCard,
          {
            backgroundColor: isDark
              ? 'rgba(20,30,50,0.92)'
              : 'rgba(255,255,255,0.95)',
            borderColor: isDark
              ? 'rgba(255,255,255,0.10)'
              : 'rgba(0,0,0,0.06)',
          },
        ]}
      >
        {/* Title */}
        <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
          Clinic Location
        </Text>

        {/* Address preview */}
        <View style={styles.addressRow}>
          <Ionicons name="location" size={18} color={ACCENT} />
          <Text
            style={[
              styles.addressText,
              { color: address && !resolving ? colors.textPrimary : colors.textSecondary },
            ]}
            numberOfLines={2}
          >
            {resolving
              ? 'Resolving address…'
              : address || 'Move the map to pick a location'}
          </Text>
        </View>

        {/* CTA */}
        <TouchableOpacity
          onPress={onConfirm}
          disabled={!canConfirm}
          activeOpacity={0.8}
          style={[styles.confirmBtn, !canConfirm && styles.confirmBtnDisabled]}
        >
          <Ionicons name="checkmark-circle" size={18} color="#FFF" />
          <Text style={styles.confirmBtnText}>Confirm Location</Text>
        </TouchableOpacity>
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

  // ── Fixed center pin ──
  pinWrap: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -20,
    marginTop: -40, // pin tip at exact center
    alignItems: 'center',
    zIndex: 5,
  },
  pinDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(0,0,0,0.18)',
    marginTop: -4,
  },

  // ── Top bar ──
  topBar: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 56 : 40,
    left: 16,
    zIndex: 10,
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.12,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
      },
      android: { elevation: 4 },
    }),
  },

  // ── Bottom card ──
  bottomCard: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 40 : 24,
    left: 16,
    right: 16,
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 20,
    gap: 12,
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
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.1,
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

  // ── CTA ──
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: ACCENT,
    borderRadius: 16,
    paddingVertical: 14,
    ...Platform.select({
      ios: {
        shadowColor: ACCENT,
        shadowOpacity: 0.3,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 3 },
      },
      android: { elevation: 4 },
    }),
  },
  confirmBtnDisabled: {
    opacity: 0.45,
  },
  confirmBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFF',
    letterSpacing: 0.2,
  },
});
