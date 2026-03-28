import { getStaticMapUrl } from '@/src/utils/googleStaticMap';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import {
    Animated,
    Image,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';

// Platform-safe lazy imports — prevents Metro from resolving native-only
// codegenNativeCommands on web, which crashes the bundler.
let RNMapView: any;
let RNMarker: any;
if (Platform.OS !== 'web') {
  const Maps = require('react-native-maps');
  RNMapView = Maps.default;
  RNMarker = Maps.Marker;
}

type ClinicProfileMapCardProps = {
  latitude: number;
  longitude: number;
  clinicName: string;
  address?: string;
  distanceText?: string;
  driveTimeText?: string;
  onPress: () => void;
};

export default function ClinicProfileMapCard({
  latitude,
  longitude,
  clinicName,
  address,
  distanceText,
  driveTimeText,
  onPress,
}: ClinicProfileMapCardProps) {
  const region = {
    latitude,
    longitude,
    latitudeDelta: 0.006,
    longitudeDelta: 0.006,
  };

  // ─── Marker pulse animation ───
  const pulseScale = useRef(new Animated.Value(1)).current;
  const pulseOpacity = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(pulseScale, { toValue: 1.8, duration: 1000, useNativeDriver: true }),
          Animated.timing(pulseScale, { toValue: 1, duration: 1000, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(pulseOpacity, { toValue: 0, duration: 1000, useNativeDriver: true }),
          Animated.timing(pulseOpacity, { toValue: 0.5, duration: 1000, useNativeDriver: true }),
        ]),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [pulseScale, pulseOpacity]);

  // ─── Tap scale feedback ───
  const cardScale = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(() => {
    Animated.timing(cardScale, { toValue: 0.97, duration: 120, useNativeDriver: true }).start();
  }, [cardScale]);

  const handlePressOut = useCallback(() => {
    Animated.timing(cardScale, { toValue: 1, duration: 120, useNativeDriver: true }).start();
  }, [cardScale]);

  // ─── Web fallback ───
  const staticMapUri = useMemo(
    () => getStaticMapUrl({ lat: latitude, lng: longitude, width: 600, height: 300, zoom: 15, scale: 2 }),
    [latitude, longitude],
  );

  if (Platform.OS === 'web' || !RNMapView) {
    return (
      <Animated.View style={[styles.card, { transform: [{ scale: cardScale }] }]}>
        <Pressable
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={onPress}
          style={styles.touchable}
        >
          <View style={styles.mapContainer}>
            {staticMapUri ? (
              <Image source={{ uri: staticMapUri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
            ) : (
              <View style={[StyleSheet.absoluteFill, { backgroundColor: '#E8EDF2', alignItems: 'center', justifyContent: 'center' }]}>
                <Ionicons name="map-outline" size={36} color="#94A3B8" />
              </View>
            )}
          </View>

          {/* Route info panel */}
          {!!(distanceText || driveTimeText) && (
            <View style={styles.routeInfoPanel}>
              {!!distanceText && <Text style={styles.routeDistance}>📍 {distanceText}</Text>}
              {!!driveTimeText && <Text style={styles.routeTime}>🚗 {driveTimeText}</Text>}
            </View>
          )}

          {/* Bottom overlay */}
          <View style={styles.webOverlay}>
            <Text style={styles.clinicName} numberOfLines={1}>{clinicName}</Text>
            <Text style={styles.openMaps}>Click to open in Maps</Text>
          </View>
        </Pressable>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[styles.card, { transform: [{ scale: cardScale }] }]}>
      <View
        style={styles.touchable}
        onTouchStart={handlePressIn}
        onTouchEnd={() => { handlePressOut(); onPress(); }}
        onTouchCancel={handlePressOut}
      >
        <View style={styles.mapContainer} pointerEvents="none">
          <RNMapView
            style={StyleSheet.absoluteFill}
            initialRegion={region}
            scrollEnabled={false}
            zoomEnabled={false}
            rotateEnabled={false}
            pitchEnabled={false}
            toolbarEnabled={false}
            showsUserLocation={false}
            showsMyLocationButton={false}
            showsCompass={false}
            showsScale={false}
            showsTraffic={false}
            showsIndoors={false}
            loadingEnabled
            loadingIndicatorColor="#3D9EFF"
            loadingBackgroundColor="#F0F4F8"
            {...(Platform.OS === 'android' ? { liteMode: true } : {})}
          >
            <RNMarker coordinate={{ latitude, longitude }}>
              <View style={styles.markerWrapper}>
                <Animated.View
                  style={[
                    styles.pulseCircle,
                    { transform: [{ scale: pulseScale }], opacity: pulseOpacity },
                  ]}
                />
                <View style={styles.markerDot} />
              </View>
            </RNMarker>
          </RNMapView>
        </View>

        {/* Route info panel */}
        {!!(distanceText || driveTimeText) && (
          <View style={styles.routeInfoPanel}>
            {!!distanceText && <Text style={styles.routeDistance}>📍 {distanceText}</Text>}
            {!!driveTimeText && <Text style={styles.routeTime}>🚗 {driveTimeText}</Text>}
          </View>
        )}

        {/* Top gradient fade */}
        <LinearGradient
          colors={['rgba(0,0,0,0.1)', 'transparent']}
          style={styles.topGradient}
          pointerEvents="none"
        />

        {/* Bottom blur overlay */}
        <View style={styles.overlay}>
          <BlurView intensity={40} tint="dark" style={[StyleSheet.absoluteFill, { zIndex: 0 }]} />
          <View style={styles.overlayContent}>
            <Text style={styles.clinicName} numberOfLines={1}>{clinicName}</Text>
            <Text style={styles.openMaps}>Tap to open in Maps</Text>
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    height: 180,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    ...Platform.select({
      ios: {
        shadowColor: '#0D1B2A',
        shadowOpacity: 0.08,
        shadowRadius: 20,
        shadowOffset: { width: 0, height: 6 },
      },
      android: {
        elevation: 6,
      },
    }),
  },
  touchable: {
    flex: 1,
  },
  mapContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  routeInfoPanel: {
    position: 'absolute',
    left: 12,
    top: 14,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    zIndex: 10,
  },
  routeDistance: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '600',
  },
  routeTime: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    overflow: 'hidden',
    zIndex: 5,
  },
  overlayContent: {
    zIndex: 1,
    backgroundColor: 'rgba(0,0,0,0.28)',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  clinicName: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  openMaps: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },

  topGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 20,
  },

  /* ── Marker ── */
  markerWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
  },
  pulseCircle: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#3D9EFF',
  },
  markerDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#3D9EFF',
    borderWidth: 2.5,
    borderColor: '#FFF',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.25,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
      },
      android: {
        elevation: 4,
      },
    }),
  },

  /* ── Web overlay ── */
  webOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.35)',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
});
