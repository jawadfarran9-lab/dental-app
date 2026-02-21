import ClinicMapPreviewCard from '@/src/components/ClinicMapPreviewCard';
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
import type MapView from 'react-native-maps';
import { Marker, Region } from 'react-native-maps';

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

const NEARBY_DELTA = 0.12;

/** Zoom-in threshold — latitudeDelta below this = "zoomed in" */
const ZOOMED_IN_THRESHOLD = 0.05;

// ─── Smart density: adaptive max labels based on zoom ───
function getAdaptiveMaxLabels(delta: number): number {
  if (delta < 0.02) return 12;
  if (delta < 0.05) return 10;
  if (delta < 0.08) return 8;
  return 6;
}

// ─── Collision avoidance: approximate label box in normalised viewport coords ───
const LABEL_BOX_W = 0.14; // ~14% viewport width
const LABEL_BOX_H = 0.06; // ~6% viewport height

function boxesOverlap(
  ax: number, ay: number,
  bx: number, by: number,
): boolean {
  return (
    Math.abs(ax - bx) < LABEL_BOX_W &&
    Math.abs(ay - by) < LABEL_BOX_H
  );
}

/** Custom cluster bubble renderer */
const renderCluster = (cluster: any) => {
  const { id, geometry, onPress, properties } = cluster;
  const count: number = properties?.point_count ?? 0;
  return (
    <Marker
      key={`cluster-${id}`}
      coordinate={{
        latitude: geometry.coordinates[1],
        longitude: geometry.coordinates[0],
      }}
      onPress={onPress}
      tracksViewChanges={false}
    >
      <View style={clusterStyles.bubble}>
        <Text style={clusterStyles.count}>{count}</Text>
      </View>
    </Marker>
  );
};

/**
 * Map Discover Screen
 *
 * Route: /(tabs)/clinics/map
 * Displays published clinics on a full-screen map with selectable markers.
 * Receives category + radiusKm filters from the list screen via search params.
 */
export default function ClinicsMapScreen() {
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
  const [region, setRegion] = useState<Region | null>(null);
  const mapRef = useRef<MapView | null>(null);

  /** Whether the user has zoomed in past the threshold (for Phase 3.2 use) */
  const isZoomedIn = (region?.latitudeDelta ?? NEARBY_DELTA) < ZOOMED_IN_THRESHOLD;

  /** Callback ref for ClusteredMapView's mapRef prop */
  const setMapRef = useCallback((ref: any) => {
    mapRef.current = ref;
  }, []);

  /** Track region changes for zoom intelligence */
  const onRegionChangeComplete = useCallback((r: Region) => {
    setRegion(r);
  }, []);

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

    // 3. Radius filter (only when userLocation available)
    if (userLocation) {
      result = result.filter((c) => {
        if (!c.geo) return false; // already filtered above, but TS guard
        return getDistanceBetween(userLocation, c.geo) <= radiusKm;
      });
    }

    return result;
  }, [clinics, category, radiusKm, userLocation]);

  // ─── Smart density: adaptive max from zoom level ───
  const adaptiveMax = useMemo(
    () => getAdaptiveMaxLabels(region?.latitudeDelta ?? NEARBY_DELTA),
    [region],
  );

  // ─── Label candidates with collision avoidance ───
  const labeledClinicIds: Set<string> = useMemo(() => {
    if (!isZoomedIn || !region) return new Set<string>();

    // Viewport bounds
    const latMin = region.latitude - region.latitudeDelta / 2;
    const latMax = region.latitude + region.latitudeDelta / 2;
    const lngMin = region.longitude - region.longitudeDelta / 2;
    const lngMax = region.longitude + region.longitudeDelta / 2;
    const latSpan = latMax - latMin || 1;
    const lngSpan = lngMax - lngMin || 1;

    // Clinics inside current viewport
    const visible = filteredClinics.filter((c) => {
      const { lat, lng } = c.geo!;
      return lat >= latMin && lat <= latMax && lng >= lngMin && lng <= lngMax;
    });

    // Sort by distance to user or region center
    const refPoint = userLocation ?? { lat: region.latitude, lng: region.longitude };
    const sorted = [...visible].sort(
      (a, b) => getDistanceBetween(refPoint, a.geo!) - getDistanceBetween(refPoint, b.geo!),
    );

    // Collision filter — greedy placement in normalised viewport coords
    const accepted: { id: string; nx: number; ny: number }[] = [];

    // Always place selected clinic first (force include)
    if (selectedClinic?.geo) {
      const sx = (selectedClinic.geo.lng - lngMin) / lngSpan;
      const sy = (selectedClinic.geo.lat - latMin) / latSpan;
      accepted.push({ id: selectedClinic.id, nx: sx, ny: sy });
    }

    for (const c of sorted) {
      if (accepted.length >= adaptiveMax) break;
      if (accepted.some((a) => a.id === c.id)) continue; // already placed (selected)
      const nx = (c.geo!.lng - lngMin) / lngSpan;
      const ny = (c.geo!.lat - latMin) / latSpan;
      if (accepted.some((a) => boxesOverlap(a.nx, a.ny, nx, ny))) continue; // collision
      accepted.push({ id: c.id, nx, ny });
    }

    return new Set(accepted.map((a) => a.id));
  }, [isZoomedIn, region, filteredClinics, userLocation, adaptiveMax, selectedClinic]);

  // ─── Compute initial region ───
  const initialRegion: Region = useMemo(() => {
    if (userLocation) {
      return {
        latitude: userLocation.lat,
        longitude: userLocation.lng,
        latitudeDelta: NEARBY_DELTA,
        longitudeDelta: NEARBY_DELTA,
      };
    }
    const first = clinics.find((c) => c.geo && isFinite(c.geo.lat) && isFinite(c.geo.lng));
    if (first?.geo) {
      return {
        latitude: first.geo.lat,
        longitude: first.geo.lng,
        latitudeDelta: 0.3,
        longitudeDelta: 0.3,
      };
    }
    return DEFAULT_REGION;
  }, [userLocation, clinics]);

  // ─── Handlers ───
  const handleMarkerPress = useCallback((clinic: PublicClinic) => {
    setSelectedClinic(clinic);
  }, []);

  const handleOpenClinic = useCallback(() => {
    if (!selectedClinic) return;
    router.push(`/clinics/${selectedClinic.clinicId}` as any);
  }, [router, selectedClinic]);

  const handleClosePreview = useCallback(() => {
    setSelectedClinic(null);
  }, []);

  const handleGoBack = useCallback(() => {
    router.back();
  }, [router]);

  // ─── Recenter to user location ───
  const handleRecenter = useCallback(() => {
    if (!userLocation || !mapRef.current) return;
    (mapRef.current as any).animateToRegion(
      {
        latitude: userLocation.lat,
        longitude: userLocation.lng,
        latitudeDelta: NEARBY_DELTA,
        longitudeDelta: NEARBY_DELTA,
      },
      350,
    );
  }, [userLocation]);

  // ─── Theme colors ───
  const headerBg = isDark ? 'rgba(22,28,36,0.85)' : 'rgba(255,255,255,0.90)';
  const textColor = isDark ? '#E8EDF2' : '#1A2A3A';
  const subtitleColor = isDark ? '#7A8A9C' : '#8A9AAC';

  // ─── Filter label ───
  const filterLabel = useMemo(() => {
    const parts: string[] = [];
    if (category !== 'all') parts.push(category.charAt(0).toUpperCase() + category.slice(1));
    if (userLocation) parts.push(`≤ ${radiusKm} km`);
    return parts.length > 0 ? parts.join(' · ') : 'All clinics';
  }, [category, radiusKm, userLocation]);

  return (
    <View style={styles.container}>
      {/* Map */}
      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="#3D9EFF" />
        </View>
      ) : (
        <ClusteredMapView
          mapRef={setMapRef}
          style={StyleSheet.absoluteFill}
          initialRegion={initialRegion}
          showsUserLocation
          showsMyLocationButton={false}
          onPress={() => setSelectedClinic(null)}
          onRegionChangeComplete={onRegionChangeComplete}
          clusterColor="#3D9EFF"
          clusterTextColor="#fff"
          renderCluster={renderCluster}
          radius={40}
          maxZoom={16}
          animationEnabled
        >
          {filteredClinics.map((clinic) => {
            const isLabeled =
              isZoomedIn && labeledClinicIds.has(clinic.id);
            const isSelected = selectedClinic?.id === clinic.id;
            const showLabel = isLabeled || (isZoomedIn && isSelected);

            return showLabel ? (
              <Marker
                key={clinic.id}
                coordinate={{
                  latitude: clinic.geo!.lat,
                  longitude: clinic.geo!.lng,
                }}
                onPress={() => handleMarkerPress(clinic)}
                tracksViewChanges={false}
                zIndex={isSelected ? 999 : 10}
                style={isSelected ? { zIndex: 999 } : undefined}
              >
                <LabeledMarkerView
                  name={clinic.name}
                  isSelected={isSelected}
                  isDark={isDark}
                />
              </Marker>
            ) : (
              <Marker
                key={clinic.id}
                coordinate={{
                  latitude: clinic.geo!.lat,
                  longitude: clinic.geo!.lng,
                }}
                title={clinic.name}
                onPress={() => handleMarkerPress(clinic)}
                pinColor="#3D9EFF"
                tracksViewChanges={false}
              />
            );
          })}
        </ClusteredMapView>
      )}

      {/* Top bar */}
      <SafeAreaView style={styles.topSafe}>
        <View style={[styles.topBar, { backgroundColor: headerBg }]}>
          <TouchableOpacity
            onPress={handleGoBack}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            activeOpacity={0.7}
            style={styles.backBtn}
          >
            <Ionicons name="chevron-back" size={22} color={textColor} />
          </TouchableOpacity>
          <View style={styles.topBarCenter}>
            <Text style={[styles.topTitle, { color: textColor }]}>Map View</Text>
            <Text style={[styles.topSubtitle, { color: subtitleColor }]}>
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
          style={[
            styles.recenterBtn,
            { backgroundColor: isDark ? 'rgba(22,28,36,0.85)' : 'rgba(255,255,255,0.90)' },
          ]}
        >
          <Ionicons name="locate" size={20} color="#3D9EFF" />
        </TouchableOpacity>
      )}

      {/* Preview Card */}
      {selectedClinic && (
        <ClinicMapPreviewCard
          clinic={selectedClinic}
          userLocation={userLocation}
          isDark={isDark}
          onOpen={handleOpenClinic}
          onClose={handleClosePreview}
        />
      )}
    </View>
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
});

// ─── Cluster bubble styles ───
const clusterStyles = StyleSheet.create({
  bubble: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(61,158,255,0.85)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.60)',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#0D1B2A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 6,
      },
      android: { elevation: 4 },
    }),
  },
  count: {
    fontSize: 13,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.2,
  },
});

// ─── Labeled marker sub-component (memo'd, with selected animation) ───
const LabeledMarkerView = React.memo(
  ({ name, isSelected, isDark }: { name: string; isSelected: boolean; isDark: boolean }) => {
    const anim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
      Animated.timing(anim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }).start();
    }, []); // run once on mount

    const bg = isDark ? 'rgba(22,28,36,0.88)' : 'rgba(255,255,255,0.92)';
    const border = isSelected
      ? '#3D9EFF'
      : isDark
        ? 'rgba(61,158,255,0.40)'
        : 'rgba(61,158,255,0.30)';
    const textColor = isDark ? '#E8EDF2' : '#1A2A3A';

    return (
      <Animated.View
        style={[
          labelStyles.wrap,
          {
            opacity: anim,
            transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }) }],
          },
        ]}
      >
        <View
          style={[
            labelStyles.bubble,
            isSelected && labelStyles.bubbleSelected,
            { backgroundColor: bg, borderColor: border },
          ]}
        >
          <Text
            style={[
              labelStyles.name,
              isSelected && labelStyles.nameSelected,
              { color: textColor },
            ]}
            numberOfLines={1}
          >
            {name}
          </Text>
        </View>
        <View style={[labelStyles.dot, isSelected && labelStyles.dotSelected]} />
      </Animated.View>
    );
  },
);

// ─── Labeled marker styles ───
const labelStyles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
  },
  bubble: {
    maxWidth: 140,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
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
  bubbleSelected: {
    maxWidth: 180,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderWidth: 1.5,
    ...Platform.select({
      ios: {
        shadowOpacity: 0.30,
        shadowRadius: 8,
      },
      android: { elevation: 6 },
    }),
  },
  name: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  nameSelected: {
    fontSize: 12,
    fontWeight: '800',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3D9EFF',
    marginTop: 3,
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  dotSelected: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
  },
});
