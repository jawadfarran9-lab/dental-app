import ClinicBottomCard from '@/src/components/ClinicBottomCard';
import MapErrorBoundary from '@/src/components/MapErrorBoundary';
import { useTheme } from '@/src/context/ThemeContext';
import {
  PublicClinic,
  fetchPublishedClinics,
} from '@/src/services/publicClinics';
import { getDistanceBetween } from '@/src/utils/geoDistance';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import ClusteredMapView from 'react-native-map-clustering';
import MapView, { Marker, Region } from 'react-native-maps';

// ─── Same category derivation as index.tsx ───
type CategoryFilter = 'all' | 'dental' | 'laser' | 'beauty';


function deriveClinicType(specialty?: string): 'dental' | 'laser' | 'beauty' | null {
  if (!specialty) return null;
  const s = specialty.toLowerCase();
  if (
    s === 'general' ||
    s === 'orthodontics' ||
    s === 'cosmetic' ||
    s === 'pediatric' ||
    s === 'surgery' ||
    s === 'endodontics' ||
    s === 'periodontics' ||
    s === 'prosthodontics'
  )
    return 'dental';
  if (s === 'laser') return 'laser';
  if (s === 'beauty') return 'beauty';
  return null;
}

// ─── Safe fallback region (world center) ───
const DEFAULT_REGION: Region = {
  latitude: 25.276987,
  longitude: 55.296249,
  latitudeDelta: 0.5,
  longitudeDelta: 0.5,
};

// ─── Radius-to-delta mapping (single source of truth for zoom levels) ───
const RADIUS_TIERS = [5, 10, 25, 50, 100, 200] as const;
type RadiusTier = (typeof RADIUS_TIERS)[number];

const RADIUS_DELTA_MAP: Record<RadiusTier, number> = {
  5:   0.035,
  10:  0.07,
  25:  0.18,
  50:  0.40,
  100: 0.85,
  200: 1.8,
};

/** Convert radius tier to map latitudeDelta */
function radiusToDelta(km: number): number {
  // Snap to nearest radius tier for delta lookup
  let best: RadiusTier = RADIUS_TIERS[0];
  let bestDiff = Math.abs(km - best);
  for (const t of RADIUS_TIERS) {
    const diff = Math.abs(km - t);
    if (diff < bestDiff) { best = t; bestDiff = diff; }
  }
  return RADIUS_DELTA_MAP[best];
}


/**
 * Compute visible radius in km from a map region.
 * Used for the header distance display — must be called immediately
 * (not debounced) so the header stays in sync with the map viewport.
 * Returns previous value on invalid input to prevent the header from
 * showing 0 or NaN.
 */
function computeVisibleKm(region: Region, prev: number): number {
  const delta = region.latitudeDelta;
  if (!isFinite(delta) || delta <= 0) return prev;
  const km = (delta * 111) / 2;
  return Math.min(Math.max(1, Math.round(km)), 999);
}


// ─── Fixed zIndex hierarchy ───
const Z_SELECTED  = 1000;
const Z_LABEL     = 500;

/**
 * Map Discover Screen
 *
 * Route: /(tabs)/clinics/map
 * Displays published clinics on a full-screen map with selectable markers.
 * Receives category + radiusKm filters from the list screen via search params.
 */
function ClinicsMapScreenInner() {
  const router = useRouter();
  const { isDark } = useTheme();
  const params = useLocalSearchParams<{ category?: string; radiusKm?: string }>();

  // ─── Parse filter params ───
  const category: CategoryFilter = useMemo(() => {
    const v = params.category;
    if (v === 'dental' || v === 'laser' || v === 'beauty') return v;
    return 'all';
  }, [params.category]);

  const radiusKm: number = useMemo(() => {
    const n = Number(params.radiusKm);
    return isFinite(n) && n > 0 ? n : 25;
  }, [params.radiusKm]);

  // ─── State ───
  const [clinics, setClinics] = useState<PublicClinic[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedClinic, setSelectedClinic] = useState<PublicClinic | null>(null);
  /** Display-only visible radius — updated immediately on zoom */
  const [visibleKm, setVisibleKm] = useState(() => Math.round((radiusToDelta(radiusKm) / 2) * 111));
  /** Refresh indicator — true while debounce timer is active */
  const [isRefreshing, setIsRefreshing] = useState(false);
  const selectedId = selectedClinic?.id;
  const mapRef = useRef<MapView | null>(null);
  /** Always-current region — read inside useMemos without being a reactive dep */
  const regionRef = useRef<Region | null>(null);
  /** Refresh debounce timer */
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Animated pulse for refresh indicator */
  const refreshPulse = useRef(new Animated.Value(0)).current;

  /**
   * Region handler — debounced viewport refresh.
   * 1. Immediately stores region in ref (for viewport calculations).
   * 2. Shows refresh indicator.
   * 3. Debounces visibleKm update by 350ms (drives recompute via useMemo chain).
   * 4. Hides indicator when timer fires.
   */
  const onRegionChangeComplete = useCallback((r: Region) => {
    regionRef.current = r;

    // Cancel previous pending refresh
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
    }

    setIsRefreshing(true);

    refreshTimerRef.current = setTimeout(() => {
      refreshTimerRef.current = null;
      setVisibleKm((prev) => computeVisibleKm(r, prev));
      setIsRefreshing(false);
    }, 350);
  }, []);

  // ─── Cleanup refresh timer on unmount ───
  useEffect(() => {
    return () => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    };
  }, []);

  // ─── Pulse animation for refresh indicator ───
  useEffect(() => {
    if (isRefreshing) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(refreshPulse, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.timing(refreshPulse, { toValue: 0.3, duration: 400, useNativeDriver: true }),
        ]),
      );
      loop.start();
      return () => loop.stop();
    } else {
      refreshPulse.setValue(0);
    }
  }, [isRefreshing, refreshPulse]);

  // ─── Fetch user location ───
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted' && !cancelled) {
          const loc = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          if (!cancelled) {
            setUserLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude });
          }
        }
      } catch {
        // Location unavailable — continue without it
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // ─── Fetch clinics (same pipeline as index.tsx) ───
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const all = await fetchPublishedClinics();
        setClinics(all);
      } catch (err) {
        console.error('[CLINICS_MAP] Failed to fetch clinics:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ─── Filtered clinics with valid geo ───
  const filteredClinics = useMemo(() => {
    // 1. Only clinics with valid geo
    let result = clinics.filter(
      (c) => c.geo && isFinite(c.geo.lat) && isFinite(c.geo.lng),
    );

    // 2. Category filter
    if (category !== 'all') {
      result = result.filter((c) => deriveClinicType(c.specialty) === category);
    }

    // 3. Radius filter (immutable radiusKm from params — never changes on zoom)
    if (userLocation) {
      result = result.filter((c) => {
        if (!c.geo) return false; // already filtered above, but TS guard
        return getDistanceBetween(userLocation, c.geo) <= radiusKm;
      });
    }

    return result;
  }, [clinics, category, radiusKm, userLocation]);


  // ─── Compute initial region (derived from immutable radiusKm) ───
  const initialRegion: Region = useMemo(() => {
    const delta = radiusToDelta(radiusKm);
    if (userLocation) {
      return {
        latitude: userLocation.lat,
        longitude: userLocation.lng,
        latitudeDelta: delta,
        longitudeDelta: delta,
      };
    }
    const first = clinics.find((c) => c.geo && isFinite(c.geo.lat) && isFinite(c.geo.lng));
    if (first?.geo) {
      return {
        latitude: first.geo.lat,
        longitude: first.geo.lng,
        latitudeDelta: delta,
        longitudeDelta: delta,
      };
    }
    return DEFAULT_REGION;
  }, [userLocation, clinics, radiusKm]);

  // ─── Handlers ───
  const handleMarkerPress = useCallback((clinic: PublicClinic) => {
    setSelectedClinic(clinic);
  }, []);

  const handleOpenClinic = useCallback((clinic: PublicClinic) => {
    if (!clinic?.clinicId) return;
    router.push(`/clinics/${clinic.clinicId}` as any);
  }, [router]);

  const handleClosePreview = useCallback(() => {
    setSelectedClinic(null);
  }, []);

  const handleGoBack = useCallback(() => {
    router.back();
  }, [router]);

  // ─── Recenter to user location ───
  const handleRecenter = useCallback(() => {
    if (!userLocation || !mapRef.current) return;
    const delta = radiusToDelta(radiusKm);
    (mapRef.current as any).animateToRegion(
      { latitude: userLocation.lat, longitude: userLocation.lng, latitudeDelta: delta, longitudeDelta: delta },
      300,
    );
  }, [userLocation, radiusKm]);

  // ─── Theme colors (memoized to prevent inline object re-creation) ───
  const headerBg = isDark ? 'rgba(22,28,36,0.85)' : 'rgba(255,255,255,0.90)';
  const textColor = isDark ? '#E8EDF2' : '#1A2A3A';
  const subtitleColor = isDark ? '#7A8A9C' : '#8A9AAC';
  const topBarStyle = useMemo(() => [styles.topBar, { backgroundColor: headerBg }], [headerBg]);
  const titleStyle = useMemo(() => [styles.topTitle, { color: textColor }], [textColor]);
  const subtitleStyle = useMemo(() => [styles.topSubtitle, { color: subtitleColor }], [subtitleColor]);
  const recenterBtnStyle = useMemo(
    () => [styles.recenterBtn, { backgroundColor: isDark ? 'rgba(22,28,36,0.85)' : 'rgba(255,255,255,0.90)' }],
    [isDark],
  );

  // ─── Header label (display-only — decoupled from marker/cluster deps) ───
  const filterLabel = useMemo(() => {
    const parts: string[] = [];
    if (category !== 'all') parts.push(category.charAt(0).toUpperCase() + category.slice(1));
    parts.push(`≤ ${visibleKm} km`);
    return parts.join(' · ');
  }, [category, visibleKm]);

  // ─── Clustering Layer: all filteredClinics as <Marker> for Supercluster ───
  const clusterMarkers = useMemo(() => {
    return filteredClinics.map((clinic) => {
      let h = 0;
      for (let i = 0; i < clinic.id.length; i++) h += clinic.id.charCodeAt(i);
      const staggerPad = h % 2 === 0 ? STAGGER_EVEN_PAD : STAGGER_ODD_PAD;
      const sel = selectedId === clinic.id;
      return (
        <Marker
          key={clinic.id}
          identifier={clinic.id}
          coordinate={{ latitude: clinic.geo!.lat, longitude: clinic.geo!.lng }}
          onPress={() => handleMarkerPress(clinic)}
          tracksViewChanges={false}
          zIndex={sel ? Z_SELECTED : Z_LABEL}
          anchor={{ x: 0.5, y: 1 }}
          hitSlop={MARKER_HIT_SLOP}
        >
          <ClinicMarkerView
            name={clinic.name}
            isSelected={sel}
            isDark={isDark}
            staggerPadTop={staggerPad}
          />
        </Marker>
      );
    });
  }, [filteredClinics, selectedId, isDark, handleMarkerPress]);

  // ─── Cluster bubble renderer (custom renderCluster for Supercluster) ───
  const renderClusterMarker = useCallback(
    (cluster: any) => {
      const { id, geometry, properties, onPress } = cluster;
      const count: number = properties.point_count;
      const [lng, lat] = geometry.coordinates as [number, number];
      const color =
        count >= 16 ? '#FF8C42' : count >= 6 ? '#7B61FF' : '#3D9EFF';
      const bg = isDark
        ? 'rgba(22,28,36,0.92)'
        : 'rgba(255,255,255,0.95)';
      const textCol = isDark ? '#FFFFFF' : '#0D1B2A';
      return (
        <Marker
          key={`cluster-${id}`}
          coordinate={{ latitude: lat, longitude: lng }}
          onPress={onPress}
          tracksViewChanges={false}
          zIndex={count + 1}
        >
          <View style={clusterStyles.wrap}>
            <View
              style={[
                clusterStyles.bubble,
                { backgroundColor: bg, borderColor: color },
              ]}
            >
              <Text style={[clusterStyles.count, { color: textCol }]}>
                +{count}
              </Text>
            </View>
            <View
              style={[
                clusterStyles.dot,
                { backgroundColor: color, borderColor: '#fff' },
              ]}
            />
          </View>
        </Marker>
      );
    },
    [isDark],
  );

  return (
    <View style={styles.container}>
      {/* Map */}
      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="#3D9EFF" />
        </View>
      ) : (
        <ClusteredMapView
          ref={mapRef as any}
          style={StyleSheet.absoluteFill}
          initialRegion={initialRegion}
          showsUserLocation
          showsMyLocationButton={false}
          onPress={(e: any) => {
            if (e?.nativeEvent?.action === 'marker-press') return;
            handleClosePreview();
          }}
          onRegionChangeComplete={onRegionChangeComplete}
          clusteringEnabled
          radius={60}
          minPoints={2}
          maxZoom={16}
          renderCluster={renderClusterMarker}
          animationEnabled={Platform.OS === 'ios'}
          tracksViewChanges={false}
        >
          {clusterMarkers}
        </ClusteredMapView>
      )}

      {/* Refresh indicator */}
      {isRefreshing && (
        <View style={styles.refreshWrap}>
          <Animated.View style={[styles.refreshPill, { opacity: refreshPulse }]}>
            <Text style={styles.refreshDots}>•••</Text>
          </Animated.View>
        </View>
      )}

      {/* Top bar */}
      <SafeAreaView style={styles.topSafe}>
        <View style={topBarStyle}>
          <TouchableOpacity
            onPress={handleGoBack}
            hitSlop={HIT_SLOP_8}
            activeOpacity={0.7}
            style={styles.backBtn}
          >
            <Ionicons name="chevron-back" size={22} color={textColor} />
          </TouchableOpacity>
          <View style={styles.topBarCenter}>
            <Text style={titleStyle}>Map View</Text>
            <Text style={subtitleStyle}>
              {filterLabel} · {filteredClinics.length} clinic{filteredClinics.length !== 1 ? 's' : ''}
            </Text>
          </View>
          {/* Spacer for symmetry */}
          <View style={styles.backBtn} />
        </View>
      </SafeAreaView>

      {/* Recenter button */}
      {userLocation && (
        <TouchableOpacity
          onPress={handleRecenter}
          activeOpacity={0.7}
          style={recenterBtnStyle}
        >
          <Ionicons name="locate" size={20} color="#3D9EFF" />
        </TouchableOpacity>
      )}

      {/* Bottom Preview Card */}
      <ClinicBottomCard
        clinic={selectedClinic}
        userLocation={userLocation}
        isDark={isDark}
        onOpen={handleOpenClinic}
        onClose={handleClosePreview}
      />
    </View>
  );
}

/** Public export — wraps the map screen in an error boundary */
export default function ClinicsMapScreen() {
  return (
    <MapErrorBoundary>
      <ClinicsMapScreenInner />
    </MapErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.03)',
  },
  topSafe: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    ...Platform.select({
      ios: {
        shadowColor: '#0D1B2A',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.10,
        shadowRadius: 10,
      },
      android: { elevation: 6 },
    }),
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarCenter: {
    flex: 1,
    alignItems: 'center',
  },
  topTitle: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.1,
  },
  topSubtitle: {
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.2,
    marginTop: 1,
  },
  recenterBtn: {
    position: 'absolute',
    bottom: 140,
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(61,158,255,0.25)',
    ...Platform.select({
      ios: {
        shadowColor: '#0D1B2A',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.12,
        shadowRadius: 6,
      },
      android: { elevation: 4 },
    }),
  },
  refreshWrap: {
    position: 'absolute',
    top: 100,
    alignSelf: 'center',
    zIndex: 20,
  },
  refreshPill: {
    backgroundColor: 'rgba(61,158,255,0.90)',
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#0D1B2A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.20,
        shadowRadius: 4,
      },
      android: { elevation: 3 },
    }),
  },
  refreshDots: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 3,
  },
});

// ─── Stable hitSlop constant (prevents inline object re-creation) ───
const HIT_SLOP_8 = { top: 8, bottom: 8, left: 8, right: 8 };
const MARKER_HIT_SLOP = { top: 24, bottom: 24, left: 24, right: 24 };

/**
 * Stagger: even markers get less top padding (label closer to dot),
 * odd markers get more top padding (label further from dot).
 * All padding is INSIDE the wrapper — nothing escapes Marker bounds.
 */
const STAGGER_EVEN_PAD = 12;
const STAGGER_ODD_PAD = 0;
/** Wrapper height must contain: stagger pad + bubble (~26) + gap (3) + dot (14) */
const MARKER_WRAP_H = 58;

// ─── Clinic marker view — DOT + NAME always together (atomic) ───
const ClinicMarkerView = React.memo(
  ({ name, isSelected, isDark, staggerPadTop = 0 }: {
    name: string;
    isSelected: boolean;
    isDark: boolean;
    staggerPadTop?: number;
  }) => {
    const bg = isSelected
      ? (isDark ? 'rgba(30,40,55,0.95)' : 'rgba(255,255,255,0.98)')
      : (isDark ? 'rgba(22,28,36,0.88)' : 'rgba(255,255,255,0.92)');
    const border = isSelected
      ? '#3D9EFF'
      : isDark
        ? 'rgba(61,158,255,0.25)'
        : 'rgba(61,158,255,0.18)';
    const textColor = isSelected
      ? (isDark ? '#FFFFFF' : '#0D1B2A')
      : (isDark ? '#E8EDF2' : '#1A2A3A');
    const dotBg = isSelected ? '#2B8AE8' : '#3D9EFF';
    const dotBorder = isSelected ? '#E8EDF2' : '#fff';

    return (
      <View style={[markerStyles.wrap, { paddingTop: staggerPadTop }]}>
        <View
          style={[
            markerStyles.bubble,
            { backgroundColor: bg, borderColor: border },
          ]}
        >
          <Text
            style={[markerStyles.name, { color: textColor }]}
            numberOfLines={1}
          >
            {name}
          </Text>
        </View>
        <View style={[markerStyles.dot, { backgroundColor: dotBg, borderColor: dotBorder }]} />
      </View>
    );
  },
);

// ─── Marker styles ───
const markerStyles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    minHeight: MARKER_WRAP_H,
    minWidth: 50,
  },
  bubble: {
    maxWidth: 140,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 3,
    ...Platform.select({
      ios: {
        shadowColor: '#0D1B2A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
      },
      android: { elevation: 3 },
    }),
  },
  name: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#3D9EFF',
    borderWidth: 2,
    borderColor: '#fff',
    ...Platform.select({
      ios: {
        shadowColor: '#0D1B2A',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.20,
        shadowRadius: 3,
      },
      android: { elevation: 2 },
    }),
  },
});

// ─── Cluster marker styles ───
const clusterStyles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    minHeight: 48,
    minWidth: 44,
  },
  bubble: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1.5,
    marginBottom: 3,
    ...Platform.select({
      ios: {
        shadowColor: '#0D1B2A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.18,
        shadowRadius: 5,
      },
      android: { elevation: 4 },
    }),
  },
  count: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    ...Platform.select({
      ios: {
        shadowColor: '#0D1B2A',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.22,
        shadowRadius: 3,
      },
      android: { elevation: 3 },
    }),
  },
});
