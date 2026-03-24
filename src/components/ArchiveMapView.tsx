import MapErrorBoundary from '@/src/components/MapErrorBoundary';
import { ArchiveItem } from '@/src/services/archiveService';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    Animated,
    Easing,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from 'react-native';

// Platform-safe lazy imports
let ClusteredMapView: any;
let RNMapView: any;
let RNMarker: any;
let GoogleMap: any;
let GoogleMarker: any;
let GoogleAPIProvider: any;

if (Platform.OS !== 'web') {
  ClusteredMapView = require('react-native-map-clustering').default;
  const Maps = require('react-native-maps');
  RNMapView = Maps.default;
  RNMarker = Maps.Marker;
} else {
  ClusteredMapView = View;
  RNMapView = View;
  RNMarker = View;
  const GM = require('@vis.gl/react-google-maps');
  GoogleMap = GM.Map;
  GoogleMarker = GM.AdvancedMarker;
  GoogleAPIProvider = GM.APIProvider;
}

const GOOGLE_MAPS_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '';

// ─── Camera constants ───
const INITIAL_DELTA = 0.035;
const TARGET_DELTA = 0.008;
const FIT_EDGE_PADDING = { top: 60, right: 40, bottom: 100, left: 40 };
// Precision for grouping nearby stories (~11m at equator)
const COORD_PRECISION = 4;
// Stories created within this window get a pulse ring
const RECENT_MS = 24 * 60 * 60 * 1000;

type Props = {
  items: ArchiveItem[];
  clinicLocation: { lat: number; lng: number } | null;
  onMarkerPress: (items: ArchiveItem[], startIndex: number) => void;
  theme: 'light' | 'dark';
};

type MarkerGroup = {
  key: string;
  latitude: number;
  longitude: number;
  items: ArchiveItem[];
  thumbnail: string | null;
};

// ─── Dark-mode map styling ───
const DARK_MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#1d2c4d' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8ec3b9' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#1a3646' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#304a7d' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#98a5be' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0e1626' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#283d6a' }] },
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#6f9ba5' }] },
];

// ─── Grouping logic ───

/** Stable reference: build groups keyed by rounded lat,lng. */
function groupByLocation(
  items: ArchiveItem[],
  clinicLocation: { lat: number; lng: number } | null,
): MarkerGroup[] {
  const groups = new Map<string, ArchiveItem[]>();

  for (const item of items) {
    let lat: number | undefined;
    let lng: number | undefined;

    if (item.location) {
      lat = item.location.latitude;
      lng = item.location.longitude;
    } else if (clinicLocation) {
      lat = clinicLocation.lat;
      lng = clinicLocation.lng;
    }

    if (lat == null || lng == null || !isFinite(lat) || !isFinite(lng)) continue;

    const key = `${lat.toFixed(COORD_PRECISION)},${lng.toFixed(COORD_PRECISION)}`;
    const arr = groups.get(key);
    if (arr) {
      arr.push(item);
    } else {
      groups.set(key, [item]);
    }
  }

  const result: MarkerGroup[] = [];
  for (const [key, groupItems] of groups) {
    const [latStr, lngStr] = key.split(',');
    const first = groupItems[0];
    result.push({
      key,
      latitude: parseFloat(latStr),
      longitude: parseFloat(lngStr),
      items: groupItems,
      thumbnail: first.thumbnailUrl || first.mediaUrl || null,
    });
  }
  return result;
}

/** Build a stable key string from items to detect meaningful data changes. */
function itemsFingerprint(groups: MarkerGroup[]): string {
  if (groups.length === 0) return '';
  return groups.map(g => `${g.key}:${g.items.length}`).join('|');
}

// ─── Single marker sub-component (for individual groups inside the cluster layer) ───

const StoryMarker = React.memo(
  ({ group, onPress }: { group: MarkerGroup; onPress: (g: MarkerGroup) => void }) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const pulseAnim = useRef(new Animated.Value(0)).current;
    const count = group.items.length;

    // A7.3 — detect groups with stories created in the last 24 h
    const hasRecent = useMemo(() => {
      const now = Date.now();
      return group.items.some(i => now - i.createdAt < RECENT_MS);
    }, [group.items]);

    // Radar-pulse loop: ring expands & fades out, then resets
    useEffect(() => {
      if (!hasRecent) return;
      const loop = Animated.loop(
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      );
      loop.start();
      return () => loop.stop();
    }, [hasRecent, pulseAnim]);

    const pulseScale = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.35] });
    const pulseOpacity = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0] });

    // A7.1 — pop-up scale 1 → 1.12 → 1
    const handlePress = useCallback(() => {
      Animated.sequence([
        Animated.spring(scaleAnim, { toValue: 1.12, damping: 20, stiffness: 400, mass: 0.5, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, damping: 14, stiffness: 300, mass: 0.5, useNativeDriver: true }),
      ]).start();
      setTimeout(() => onPress(group), 120);
    }, [group, onPress, scaleAnim]);

    const isLargeCluster = count >= 10;
    const ringSize = isLargeCluster ? 62 : 54;
    const ringRadius = ringSize / 2;
    const innerRadius = isLargeCluster ? 28 : 24;

    return (
      <RNMarker
        coordinate={{ latitude: group.latitude, longitude: group.longitude }}
        onPress={handlePress}
        tracksViewChanges={false}
        anchor={{ x: 0.5, y: 1 }}
      >
        <TouchableWithoutFeedback onPress={handlePress} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Animated.View style={[styles.markerContainer, { transform: [{ scale: scaleAnim }] }]}>
            {/* A7.3 — pulse ring for recent stories */}
            {hasRecent && (
              <Animated.View
                style={[
                  styles.pulseRing,
                  {
                    width: ringSize + 16,
                    height: ringSize + 16,
                    borderRadius: (ringSize + 16) / 2,
                    transform: [{ scale: pulseScale }],
                    opacity: pulseOpacity,
                  },
                ]}
              />
            )}
            <View style={[
              styles.markerRing,
              { width: ringSize, height: ringSize, borderRadius: ringRadius },
              isLargeCluster && styles.markerRingLarge,
            ]}>
              <View style={[styles.markerInner, { borderRadius: innerRadius }]}>
                {group.thumbnail ? (
                  <Image source={{ uri: group.thumbnail }} style={styles.markerImage} contentFit="cover" />
                ) : (
                  <Ionicons name="images" size={isLargeCluster ? 22 : 18} color="#FFF" />
                )}
              </View>
            </View>
            {count > 1 && (
              <View style={[styles.countBadge, isLargeCluster && styles.countBadgeLarge]}>
                <Text style={[styles.countBadgeText, isLargeCluster && styles.countBadgeTextLarge]}>
                  {count > 99 ? '99+' : count}
                </Text>
              </View>
            )}
            <View style={[styles.markerPointer, isLargeCluster && styles.markerPointerLarge]} />
          </Animated.View>
        </TouchableWithoutFeedback>
      </RNMarker>
    );
  },
);

// ─── A7.5 — Cluster bubble with bounce feedback ───

const ClusterBubble = React.memo(
  ({ cluster, isDark }: { cluster: any; isDark: boolean }) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const { id, geometry, properties, onPress } = cluster;
    const count: number = properties.point_count;
    const [lng, lat] = geometry.coordinates as [number, number];
    const accent = count >= 16 ? '#E1306C' : count >= 6 ? '#7B61FF' : '#1A73E8';
    const bg = isDark ? 'rgba(15,23,42,0.92)' : 'rgba(255,255,255,0.95)';
    const textCol = isDark ? '#FFFFFF' : '#1A2B3F';

    const handlePress = useCallback(() => {
      Animated.sequence([
        Animated.spring(scaleAnim, { toValue: 1.1, damping: 20, stiffness: 400, mass: 0.5, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, damping: 14, stiffness: 300, mass: 0.5, useNativeDriver: true }),
      ]).start();
      onPress?.();
    }, [onPress, scaleAnim]);

    return (
      <RNMarker
        key={`cluster-${id}`}
        coordinate={{ latitude: lat, longitude: lng }}
        onPress={handlePress}
        tracksViewChanges={false}
        zIndex={count + 1}
      >
        <TouchableWithoutFeedback onPress={handlePress}>
          <Animated.View style={[clusterStyles.wrap, { transform: [{ scale: scaleAnim }] }]}>
            <View style={[clusterStyles.bubble, { backgroundColor: bg, borderColor: accent }]}>
              <Text style={[clusterStyles.count, { color: textCol }]}>{count}</Text>
            </View>
            <View style={[clusterStyles.dot, { backgroundColor: accent, borderColor: '#fff' }]} />
          </Animated.View>
        </TouchableWithoutFeedback>
      </RNMarker>
    );
  },
);

// ─── A7.2 — Floating preview card ───

const MarkerPreviewCard = React.memo(
  ({
    group,
    onView,
    isDark,
  }: {
    group: MarkerGroup;
    onView: () => void;
    isDark: boolean;
  }) => {
    const slideAnim = useRef(new Animated.Value(70)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 0, damping: 22, stiffness: 280, mass: 0.8, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 180, useNativeDriver: true }),
      ]).start();
    }, []);

    const count = group.items.length;
    const locationName = group.items[0]?.location?.placeName;
    const bg = isDark ? 'rgba(15,23,42,0.92)' : 'rgba(255,255,255,0.95)';
    const textCol = isDark ? '#F0F2F5' : '#1A2B3F';
    const subCol = isDark ? '#8A96A6' : '#7A8A9C';

    return (
      <Animated.View
        style={[previewStyles.container, { transform: [{ translateY: slideAnim }], opacity: opacityAnim }]}
      >
        <View style={[previewStyles.card, { backgroundColor: bg }]}>
          {group.thumbnail ? (
            <Image source={{ uri: group.thumbnail }} style={previewStyles.thumb} contentFit="cover" />
          ) : (
            <View style={[previewStyles.thumbPlaceholder, { backgroundColor: isDark ? '#374151' : '#E5E7EB' }]}>
              <Ionicons name="images" size={20} color={subCol} />
            </View>
          )}
          <View style={previewStyles.info}>
            {locationName ? (
              <Text style={[previewStyles.locationText, { color: subCol }]} numberOfLines={1}>
                {locationName}
              </Text>
            ) : null}
            <Text style={[previewStyles.countText, { color: textCol }]}>
              {count} {count === 1 ? 'story' : 'stories'}
            </Text>
          </View>
          <TouchableOpacity style={previewStyles.viewBtn} onPress={onView} activeOpacity={0.8}>
            <Text style={previewStyles.viewText}>View</Text>
            <Ionicons name="chevron-forward" size={14} color="#FFF" />
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
  },
);

// ─── Main component ───

function ArchiveMapViewInner({ items, clinicLocation, onMarkerPress, theme }: Props) {
  const isDark = theme === 'dark';
  const subtextColor = isDark ? '#8A96A6' : '#7A8A9C';
  const textColor = isDark ? '#F0F2F5' : '#1A2B3F';

  const mapRef = useRef<any>(null);
  const hintOpacity = useRef(new Animated.Value(1)).current;
  const lastFitFingerprintRef = useRef('');

  // A7.2: selected marker group for preview card
  const [selectedGroup, setSelectedGroup] = useState<MarkerGroup | null>(null);

  // A7.7: empty-state float
  const emptyFloatAnim = useRef(new Animated.Value(0)).current;

  // ── Build marker groups ──
  const markerGroups = useMemo(
    () => groupByLocation(items, clinicLocation),
    [items, clinicLocation],
  );

  const hasLocatedItems = markerGroups.length > 0;

  // ── Camera: fit once per meaningful data change, don't fight user gestures ──
  useEffect(() => {
    if (!mapRef.current || !clinicLocation) return;
    const fp = itemsFingerprint(markerGroups);
    // Skip if data hasn't meaningfully changed
    if (fp === lastFitFingerprintRef.current) return;
    lastFitFingerprintRef.current = fp;

    const timer = setTimeout(() => {
      if (markerGroups.length > 1) {
        // Multiple markers → fitToCoordinates with padding
        const coords = markerGroups.map(g => ({
          latitude: g.latitude,
          longitude: g.longitude,
        }));
        mapRef.current?.fitToCoordinates?.(coords, {
          edgePadding: FIT_EDGE_PADDING,
          animated: true,
        });
      } else {
        // 0 or 1 marker → smooth zoom to target
        const target = markerGroups.length === 1
          ? { latitude: markerGroups[0].latitude, longitude: markerGroups[0].longitude, latitudeDelta: TARGET_DELTA, longitudeDelta: TARGET_DELTA }
          : { latitude: clinicLocation.lat, longitude: clinicLocation.lng, latitudeDelta: TARGET_DELTA, longitudeDelta: TARGET_DELTA };
        mapRef.current?.animateToRegion?.(target, 800);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [clinicLocation, markerGroups]);

  // ── Auto-fade hint after 4s ──
  useEffect(() => {
    if (!hasLocatedItems) return;
    const timer = setTimeout(() => {
      Animated.timing(hintOpacity, { toValue: 0, duration: 600, useNativeDriver: true }).start();
    }, 4000);
    return () => clearTimeout(timer);
  }, [hasLocatedItems, hintOpacity]);

  // A7.7: gentle float loop for the empty-state pill
  useEffect(() => {
    if (hasLocatedItems) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(emptyFloatAnim, { toValue: 1, duration: 3000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(emptyFloatAnim, { toValue: 0, duration: 3000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [hasLocatedItems, emptyFloatAnim]);

  const emptyFloat = emptyFloatAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -8] });

  // ── Marker press → show preview card + camera focus (A7.2 / A7.4) ──
  const handleGroupPress = useCallback(
    (group: MarkerGroup) => {
      setSelectedGroup(group);
      // A7.4: smooth camera center without overriding user zoom
      mapRef.current?.animateCamera?.(
        { center: { latitude: group.latitude, longitude: group.longitude } },
        { duration: 600 },
      );
    },
    [],
  );

  // Preview card "View" → open viewer + dismiss card
  const handlePreviewView = useCallback(() => {
    if (!selectedGroup) return;
    onMarkerPress(selectedGroup.items, 0);
    setSelectedGroup(null);
  }, [selectedGroup, onMarkerPress]);

  // Tap map background → dismiss preview card
  const handleMapPress = useCallback(() => {
    setSelectedGroup(null);
  }, []);

  // ── Cluster renderer — delegates to ClusterBubble for A7.5 bounce ──
  const renderClusterBubble = useCallback(
    (cluster: any) => <ClusterBubble cluster={cluster} isDark={isDark} />,
    [isDark],
  );

  // ── No clinic location at all: empty state ──
  if (!clinicLocation) {
    return (
      <View style={styles.emptyContainer}>
        <View style={[styles.emptyIconCircle, { borderColor: subtextColor }]}>
          <Ionicons name="location-outline" size={36} color={subtextColor} />
        </View>
        <Text style={[styles.emptyTitle, { color: textColor }]}>Location not set</Text>
        <Text style={[styles.emptySubtext, { color: subtextColor }]}>
          Set your clinic location in settings to use Map view
        </Text>
      </View>
    );
  }

  // Start slightly zoomed-out for arrival effect
  const initialRegion = {
    latitude: clinicLocation.lat,
    longitude: clinicLocation.lng,
    latitudeDelta: INITIAL_DELTA,
    longitudeDelta: INITIAL_DELTA,
  };

  // ── Web: Google Maps ──
  if (Platform.OS === 'web' && GoogleAPIProvider && GoogleMap) {
    return (
      <View style={styles.mapContainer}>
        <GoogleAPIProvider apiKey={GOOGLE_MAPS_KEY}>
          <GoogleMap
            defaultCenter={{ lat: clinicLocation.lat, lng: clinicLocation.lng }}
            defaultZoom={15}
            style={{ width: '100%', height: '100%' }}
          >
            {markerGroups.map((g) => (
              <GoogleMarker
                key={g.key}
                position={{ lat: g.latitude, lng: g.longitude }}
                onClick={() => handleGroupPress(g)}
              />
            ))}
          </GoogleMap>
        </GoogleAPIProvider>
        {!hasLocatedItems && (
          <View style={styles.mapEmptyOverlay}>
            <View style={[styles.glassPill, { backgroundColor: isDark ? 'rgba(15,23,42,0.80)' : 'rgba(255,255,255,0.88)' }]}>
              <Ionicons name="location-outline" size={15} color={subtextColor} />
              <Text style={[styles.glassPillText, { color: subtextColor }]}>No story locations yet</Text>
            </View>
          </View>
        )}
      </View>
    );
  }

  // ── Native: Clustered map (same library as clinics/map.tsx) ──
  return (
    <View style={styles.mapContainer}>
      <ClusteredMapView
        ref={mapRef}
        style={styles.map}
        initialRegion={initialRegion}
        customMapStyle={isDark ? DARK_MAP_STYLE : undefined}
        showsUserLocation={false}
        showsMyLocationButton={false}
        toolbarEnabled={false}
        pitchEnabled={false}
        rotateEnabled={false}
        mapPadding={{ top: 0, right: 0, bottom: 0, left: 0 }}
        clusteringEnabled={markerGroups.length > 1}
        radius={50}
        minPoints={2}
        maxZoom={18}
        renderCluster={renderClusterBubble}
        animationEnabled={Platform.OS === 'ios'}
        tracksViewChanges={false}
        onPress={handleMapPress}
      >
        {markerGroups.map((g) => (
          <StoryMarker key={g.key} group={g} onPress={handleGroupPress} />
        ))}
      </ClusteredMapView>

      {/* A7.7: Glass pill when no located stories — floats gently */}
      {!hasLocatedItems && (
        <View style={styles.mapEmptyOverlay}>
          <Animated.View style={{ transform: [{ translateY: emptyFloat }] }}>
            <View style={[styles.glassPill, { backgroundColor: isDark ? 'rgba(15,23,42,0.80)' : 'rgba(255,255,255,0.88)' }]}>
              <Ionicons name="location-outline" size={15} color={subtextColor} />
              <Text style={[styles.glassPillText, { color: subtextColor }]}>No story locations yet</Text>
            </View>
          </Animated.View>
        </View>
      )}

      {/* Tap hint — auto-fades after 4s */}
      {hasLocatedItems && (
        <Animated.View style={[styles.hintContainer, { opacity: hintOpacity }]} pointerEvents="none">
          <View style={[styles.hintPill, { backgroundColor: isDark ? 'rgba(15,23,42,0.85)' : 'rgba(255,255,255,0.92)' }]}>
            <Ionicons name="hand-left-outline" size={13} color={subtextColor} />
            <Text style={[styles.hintText, { color: subtextColor }]}>Tap marker to view stories</Text>
          </View>
        </Animated.View>
      )}

      {/* A7.2: Floating preview card */}
      {selectedGroup && (
        <MarkerPreviewCard
          key={selectedGroup.key}
          group={selectedGroup}
          onView={handlePreviewView}
          isDark={isDark}
        />
      )}
    </View>
  );
}

export default function ArchiveMapView(props: Props) {
  return (
    <MapErrorBoundary>
      <ArchiveMapViewInner {...props} />
    </MapErrorBoundary>
  );
}

const styles = StyleSheet.create({
  mapContainer: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  map: {
    flex: 1,
  },

  // ── Marker ──
  markerContainer: {
    alignItems: 'center',
    padding: 8,
  },
  pulseRing: {
    position: 'absolute',
    top: 0,
    alignSelf: 'center',
    backgroundColor: '#E1306C',
  },
  markerRing: {
    width: 54,
    height: 54,
    borderRadius: 27,
    padding: 3,
    backgroundColor: '#E1306C',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  markerRingLarge: {
    backgroundColor: '#C1105C',
    shadowOpacity: 0.30,
    shadowRadius: 10,
    elevation: 10,
  },
  markerInner: {
    flex: 1,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#2C2C2C',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: '#FFF',
  },
  markerImage: {
    width: '100%',
    height: '100%',
  },
  countBadge: {
    position: 'absolute',
    top: -3,
    right: -6,
    backgroundColor: '#1A73E8',
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 3,
  },
  countBadgeLarge: {
    backgroundColor: '#C1105C',
    minWidth: 24,
    height: 22,
    borderRadius: 11,
    paddingHorizontal: 5,
  },
  countBadgeText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  countBadgeTextLarge: {
    fontSize: 11,
  },
  markerPointer: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 7,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#E1306C',
    marginTop: -1,
  },
  markerPointerLarge: {
    borderTopColor: '#C1105C',
    borderLeftWidth: 7,
    borderRightWidth: 7,
    borderTopWidth: 8,
  },

  // ── Empty states ──
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    gap: 12,
    paddingBottom: 60,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  emptySubtext: {
    fontSize: 14,
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 20,
  },

  // ── Glass pill overlay ──
  mapEmptyOverlay: {
    position: 'absolute',
    top: '40%',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  glassPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 10,
    elevation: 4,
  },
  glassPillText: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: -0.2,
  },

  // ── Hint pill ──
  hintContainer: {
    position: 'absolute',
    bottom: 28,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  hintPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  hintText: {
    fontSize: 12,
    fontWeight: '500',
  },
});

// ── Cluster bubble styles ──
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 5,
    elevation: 4,
  },
  count: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 3,
    elevation: 3,
  },
});

// ── Preview card styles ──
const previewStyles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    alignItems: 'center',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    padding: 10,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 8,
    maxWidth: 380,
    width: '100%',
  },
  thumb: {
    width: 48,
    height: 48,
    borderRadius: 12,
  },
  thumbPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    gap: 2,
  },
  locationText: {
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: -0.1,
  },
  countText: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  viewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#E1306C',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  viewText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
