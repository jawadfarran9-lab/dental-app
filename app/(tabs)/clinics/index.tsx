import ClinicRow from '@/src/components/ClinicRow';
import GlassCard from '@/src/components/GlassCard';
import { PremiumGradientBackground } from '@/src/components/PremiumGradientBackground';
import RadiusSelector from '@/src/components/RadiusSelector';
import { useTheme } from '@/src/context/ThemeContext';
import { useAuth } from '@/src/hooks/useAuth';
import { useHasActiveSubscription } from '@/src/hooks/useHasActiveSubscription';
import {
  PublicClinic,
  fetchPublishedClinics,
  reverseGeocode,
} from '@/src/services/publicClinics';
import { getDistanceBetween } from '@/src/utils/geoDistance';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  FlatList,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

// ─── Animated FlatList (required for native onScroll driver) ───
const AnimatedFlatList = Animated.createAnimatedComponent(FlatList) as unknown as typeof FlatList;

// ─── Extended type with derived location ───
type ClinicListItem = PublicClinic;

// ─── Category filter type ───
type CategoryFilter = 'all' | 'dental' | 'laser' | 'beauty';

const CATEGORIES: { key: CategoryFilter; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'all', label: 'All', icon: 'apps' },
  { key: 'dental', label: 'Dental', icon: 'medical' },
  { key: 'laser', label: 'Laser', icon: 'flash' },
  { key: 'beauty', label: 'Beauty', icon: 'sparkles' },
];

// ─── Derive clinicType from specialty (module-level, stable) ───
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

// ─── Category Pill (memoised, premium capsule) ───
const CategoryPill = React.memo(
  ({
    label,
    icon,
    active,
    isDark,
    onPress,
  }: {
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
    active: boolean;
    isDark: boolean;
    onPress: () => void;
  }) => {
    const bg = active
      ? isDark
        ? 'rgba(61,158,255,0.18)'
        : 'rgba(61,158,255,0.08)'
      : isDark
        ? 'rgba(255,255,255,0.04)'
        : 'rgba(255,255,255,0.85)';
    const border = active
      ? isDark
        ? 'rgba(61,158,255,0.50)'
        : 'rgba(61,158,255,0.40)'
      : isDark
        ? 'rgba(255,255,255,0.08)'
        : 'rgba(0,0,0,0.06)';
    const fg = active
      ? '#3D9EFF'
      : isDark
        ? '#8A96A6'
        : '#6A7A8C';

    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.pill,
          {
            backgroundColor: bg,
            borderColor: border,
            transform: [{ scale: pressed ? 0.97 : 1 }],
            opacity: pressed ? 0.85 : 1,
          },
        ]}
      >
        <Ionicons name={icon} size={14} color={fg} />
        <Text style={[styles.pillLabel, { color: fg, fontWeight: active ? '700' : '500' }]}>
          {label}
        </Text>
      </Pressable>
    );
  },
);

/**
 * Clinics List Screen (inside tabs)
 *
 * Route: /(tabs)/clinics
 * Shows all published clinics with search, subscribed clinic pinned first.
 */
export default function ClinicsListScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { clinicId: ownClinicId, isSubscribed } = useAuth();
  const hasSubscription = useHasActiveSubscription();

  const [clinics, setClinics] = useState<ClinicListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('all');
  const [radiusKm, setRadiusKm] = useState(25);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const locationFetched = useRef(false);

  // ─── Auto-request user GPS on mount (graceful, non-blocking) ───
  useEffect(() => {
    if (locationFetched.current) return;
    let cancelled = false;
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted' && !cancelled) {
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          if (!cancelled) {
            const coords = { lat: loc.coords.latitude, lng: loc.coords.longitude };
            lastLocation.current = coords;
            setUserLocation(coords);
            locationFetched.current = true;
          }
        }
      } catch {
        // Permission denied or GPS unavailable — silent fallback
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // ─── Micro-motion: scroll-based filter depth ───
  const scrollY = useRef(new Animated.Value(0)).current;
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onScrollEvent = useMemo(
    () => Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true }),
    [scrollY],
  );

  const onScrollBegin = useCallback(() => {
    if (scrollTimer.current) clearTimeout(scrollTimer.current);
    setIsScrolling(true);
  }, []);

  const onScrollEnd = useCallback(() => {
    scrollTimer.current = setTimeout(() => setIsScrolling(false), 200);
  }, []);

  const filterIntensity = isScrolling
    ? isDark ? 45 : 65
    : isDark ? 30 : 50;

  // ─── Micro-motion: location button pulse ───
  const locPulse = useRef(new Animated.Value(1)).current;
  const prevLocationRef = useRef(userLocation);

  useEffect(() => {
    // Fire once when location transitions from null → non-null
    if (userLocation && !prevLocationRef.current) {
      Animated.sequence([
        Animated.timing(locPulse, { toValue: 1.25, duration: 150, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        Animated.timing(locPulse, { toValue: 1, duration: 180, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]).start();
    }
    prevLocationRef.current = userLocation;
  }, [userLocation, locPulse]);

  // ─── Fetch all published clinics & enrich with reverse-geocode ───
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const all = await fetchPublishedClinics();

        // Reverse-geocode in parallel (best-effort).
        // Only overwrite city/country if geocode succeeds AND the
        // document didn't already have values from directory sync.
        const withLocations: ClinicListItem[] = await Promise.all(
          all.map(async (c) => {
            if (c.geo?.lat != null && c.geo?.lng != null) {
              try {
                const place = await reverseGeocode(c.geo.lat, c.geo.lng);
                return {
                  ...c,
                  city: place.city || c.city || '',
                  country: place.country || c.country || '',
                };
              } catch {
                return c; // keep Firestore values
              }
            }
            return c; // no geo — keep Firestore city/country as-is
          }),
        );

        setClinics(withLocations);
      } catch (err) {
        console.error('[CLINICS_LIST] Failed to fetch clinics:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ─── Request user location (on tap) ───
  const lastLocation = useRef<{ lat: number; lng: number } | null>(null);
  const toggleLocation = useCallback(async () => {
    if (userLocation) {
      // Turn off location sorting (keep cached coords for re-enable)
      setUserLocation(null);
      return;
    }

    // Re-enable from cache if we already fetched once
    if (locationFetched.current && lastLocation.current) {
      setUserLocation(lastLocation.current);
      return;
    }

    setLocationLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        const coords = { lat: loc.coords.latitude, lng: loc.coords.longitude };
        lastLocation.current = coords;
        setUserLocation(coords);
        locationFetched.current = true;
      }
    } catch {
      // Silently fail — no location available
    } finally {
      setLocationLoading(false);
    }
  }, [userLocation]);

  // ─── Filtered + sorted list (memoised) ───
  const filteredClinics = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    // 1. Apply search filter
    let filtered = q
      ? clinics.filter(
          (c) =>
            c.name.toLowerCase().includes(q) ||
            (c.city && c.city.toLowerCase().includes(q)) ||
            (c.country && c.country.toLowerCase().includes(q)),
        )
      : clinics;

    // 2. Apply category filter
    if (activeCategory !== 'all') {
      filtered = filtered.filter((c) => deriveClinicType(c.specialty) === activeCategory);
    }

    // 3. Apply radius filter (only when user location is available)
    if (userLocation) {
      filtered = filtered.filter((c) => {
        if (!c.geo?.lat || !c.geo?.lng) return true; // keep clinics without geo
        return getDistanceBetween(userLocation, c.geo) <= radiusKm;
      });
    }

    // 4. Sort: own clinic first, then by distance (if available) or alphabetical
    return [...filtered].sort((a, b) => {
      const aIsOwn = isSubscribed && a.clinicId === ownClinicId ? 1 : 0;
      const bIsOwn = isSubscribed && b.clinicId === ownClinicId ? 1 : 0;
      if (aIsOwn !== bIsOwn) return bIsOwn - aIsOwn; // own first

      // Distance sort when location available
      if (userLocation) {
        const aDist = a.geo ? getDistanceBetween(userLocation, a.geo) : Infinity;
        const bDist = b.geo ? getDistanceBetween(userLocation, b.geo) : Infinity;
        if (aDist !== bDist) return aDist - bDist;
      }

      return a.name.localeCompare(b.name);
    });
  }, [clinics, searchQuery, ownClinicId, isSubscribed, activeCategory, userLocation, radiusKm]);

  // ─── Split into sections (memoised) ───
  const ownClinicItem = useMemo(
    () => (isSubscribed && ownClinicId
      ? filteredClinics.find((c) => c.clinicId === ownClinicId) ?? null
      : null),
    [filteredClinics, isSubscribed, ownClinicId],
  );

  const discoverClinics = useMemo(
    () => (ownClinicItem
      ? filteredClinics.filter((c) => c.clinicId !== ownClinicId)
      : filteredClinics),
    [filteredClinics, ownClinicItem, ownClinicId],
  );

  // ─── Navigate to clinic profile (stays inside tabs) ───
  const goToClinic = useCallback(
    (id: string) => {
      router.push(`/clinics/${id}` as any);
    },
    [router],
  );

  // ─── Compute distance for a clinic ───
  const getDistance = useCallback(
    (geo?: { lat: number; lng: number }): number | null => {
      if (!userLocation || !geo) return null;
      return getDistanceBetween(userLocation, geo);
    },
    [userLocation],
  );

  // ─── Render row ───
  const renderItem = useCallback(
    ({ item }: { item: ClinicListItem }) => (
      <ClinicRow
        clinicId={item.clinicId}
        name={item.name}
        city={item.city}
        country={item.country}
        imageUrl={item.heroImage}
        rating={item.averageRating ?? null}
        distanceKm={getDistance(item.geo)}
        clinicType={deriveClinicType(item.specialty)}
        isOwn={false}
        isDark={isDark}
        onPress={() => goToClinic(item.clinicId)}
      />
    ),
    [goToClinic, isDark, getDistance],
  );

  // ─── Section header for list ───
  const sectionHeaderColor = isDark ? 'rgba(255,255,255,0.40)' : 'rgba(0,0,0,0.32)';

  // ─── Confidence entry animation (once on mount) ───
  const ownEntryAnim = useRef(new Animated.Value(0)).current;
  const entryRan = useRef(false);

  useEffect(() => {
    if (ownClinicItem && !entryRan.current) {
      entryRan.current = true;
      Animated.timing(ownEntryAnim, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start();
    }
  }, [ownClinicItem, ownEntryAnim]);

  const listHeader = useMemo(() => (
    <View>
      {/* YOUR CLINIC section */}
      {ownClinicItem && (
        <>
          <Text style={[styles.sectionHeader, { color: sectionHeaderColor }]}>
            YOUR CLINIC
          </Text>
          <Animated.View style={[
            styles.sectionContent,
            {
              opacity: ownEntryAnim,
              transform: [{ translateY: ownEntryAnim.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }],
            },
          ]}>
            <ClinicRow
              clinicId={ownClinicItem.clinicId}
              name={ownClinicItem.name}
              city={ownClinicItem.city}
              country={ownClinicItem.country}
              imageUrl={ownClinicItem.heroImage}
              rating={ownClinicItem.averageRating ?? null}
              distanceKm={getDistance(ownClinicItem.geo)}
              clinicType={deriveClinicType(ownClinicItem.specialty)}
              isOwn
              isDark={isDark}
              onPress={() => goToClinic(ownClinicItem.clinicId)}
            />
          </Animated.View>
        </>
      )}
      {/* DISCOVER section label */}
      <Text style={[styles.sectionHeader, { color: sectionHeaderColor }]}>
        DISCOVER
      </Text>
    </View>
  ), [ownClinicItem, isDark, sectionHeaderColor, getDistance, goToClinic]);

  // ─── Location icon color ───
  const locationIconColor = userLocation
    ? '#3D9EFF'
    : isDark
      ? '#6A7A8C'
      : '#A0AAB8';

  // ─── Adaptive header subtitle ───
  const subtitleConfig = useMemo(() => {
    if (!userLocation) {
      return { text: 'Enable location to discover nearby clinics', pressable: true };
    }
    if (discoverClinics.length === 0) {
      return { text: 'No clinics found nearby', pressable: false };
    }
    return { text: 'Discover top-rated clinics near you', pressable: false };
  }, [userLocation, discoverClinics.length]);

  return (
    <View style={styles.container}>
      {/* Premium gradient background layer */}
      <PremiumGradientBackground isDark={isDark} showSparkles={false} />

      <SafeAreaView style={styles.safeArea}>
        {/* ─── Header Bar ─── */}
        <View style={[styles.headerBar, { borderBottomColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}>
          <View>
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
              Explore Clinics
            </Text>
            {subtitleConfig.pressable ? (
              <TouchableOpacity onPress={toggleLocation} activeOpacity={0.7}>
                <Text style={[styles.headerSubtitle, { color: '#3D9EFF' }]}>
                  {subtitleConfig.text}
                </Text>
              </TouchableOpacity>
            ) : (
              <Text style={[styles.headerSubtitle, { color: isDark ? '#6A7A8C' : '#8A9AAC' }]}>
                {subtitleConfig.text}
              </Text>
            )}
          </View>
          {hasSubscription && ownClinicId ? (
            <TouchableOpacity
              onPress={() => router.push(`/clinics/${ownClinicId}` as any)}
              style={[styles.profileBtn, { backgroundColor: isDark ? 'rgba(61,158,255,0.12)' : 'rgba(61,158,255,0.08)' }]}
            >
              <Ionicons name="person-circle-outline" size={18} color="#3D9EFF" />
              <Text style={styles.profileBtnText}>Profile</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* ─── Sticky Floating Search + Filters Card ─── */}
        <View style={[styles.stickyFilterWrap, isScrolling && styles.stickyFilterShadow]}>
          <GlassCard
            intensity={filterIntensity}
            tint={isDark ? 'dark' : 'light'}
            style={styles.filterCard}
          >
          {/* Search Bar — Ultra Glass */}
          <View style={styles.searchBar}>
            <BlurView
              intensity={Platform.OS === 'ios' ? (isDark ? 60 : 70) : 0}
              tint={isDark ? 'dark' : 'light'}
              style={StyleSheet.absoluteFill}
            />
            {Platform.OS === 'android' && (
              <View style={[
                StyleSheet.absoluteFill,
                { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.15)' },
              ]} />
            )}
            <Ionicons
              name="search"
              size={17}
              color={isDark ? '#5A6A7C' : '#A0AAB8'}
            />
            <TextInput
              style={[styles.searchInput, { color: colors.textPrimary }]}
              placeholder="Search clinics..."
              placeholderTextColor={isDark ? '#5A6A7C' : '#A8B4C0'}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons
                  name="close-circle"
                  size={17}
                  color={isDark ? '#5A6A7C' : '#A0AAB8'}
                />
              </TouchableOpacity>
            )}
            {/* Location toggle — glass bubble */}
            <TouchableOpacity
              onPress={toggleLocation}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              activeOpacity={0.7}
            >
              <Animated.View style={{ transform: [{ scale: locPulse }] }}>
                <GlassCard
                  intensity={isDark ? 25 : 40}
                  tint={isDark ? 'dark' : 'light'}
                  borderRadius={15}
                  style={[
                    styles.locationBtn,
                    userLocation && styles.locationBtnActive,
                  ]}
                >
                  {locationLoading ? (
                    <ActivityIndicator size={14} color="#3D9EFF" />
                  ) : (
                    <Ionicons
                      name={userLocation ? 'location' : 'location-outline'}
                      size={16}
                      color={locationIconColor}
                    />
                  )}
                </GlassCard>
              </Animated.View>
            </TouchableOpacity>
          </View>

          {/* Category Pills */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.pillsContent}
          >
            {CATEGORIES.map((cat) => (
              <CategoryPill
                key={cat.key}
                label={cat.label}
                icon={cat.icon}
                active={activeCategory === cat.key}
                isDark={isDark}
                onPress={() => setActiveCategory(cat.key)}
              />
            ))}
          </ScrollView>
          {/* Radius filter — visible only when location is active */}
          {userLocation && (
            <RadiusSelector valueKm={radiusKm} onChangeKm={setRadiusKm} isDark={isDark} />
          )}
          {/* Map View button */}
          <TouchableOpacity
            onPress={() =>
              router.push({
                pathname: '/(tabs)/clinics/map',
                params: { category: activeCategory, radiusKm: String(radiusKm) },
              } as any)
            }
            activeOpacity={0.7}
            style={[
              styles.mapViewBtn,
              { backgroundColor: isDark ? 'rgba(61,158,255,0.12)' : 'rgba(61,158,255,0.08)' },
            ]}
          >
            <Ionicons name="map-outline" size={15} color="#3D9EFF" />
            <Text style={styles.mapViewBtnText}>Map View</Text>
          </TouchableOpacity>
          </GlassCard>
        </View>

        {/* List */}
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : filteredClinics.length === 0 && !ownClinicItem ? (
          <View style={styles.center}>
            <Ionicons
              name="search-outline"
              size={48}
              color={isDark ? '#5A6A80' : '#B0BEC5'}
            />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {searchQuery || activeCategory !== 'all'
                ? 'No clinics match your filters'
                : 'No clinics available'}
            </Text>
          </View>
        ) : (
          <AnimatedFlatList
            data={discoverClinics}
            keyExtractor={(c: ClinicListItem) => c.id}
            renderItem={renderItem}
            ListHeaderComponent={listHeader}
            ListEmptyComponent={
              <GlassCard
                intensity={isDark ? 25 : 40}
                tint={isDark ? 'dark' : 'light'}
                borderRadius={20}
                style={styles.discoverPrompt}
              >
                <Ionicons
                  name="compass-outline"
                  size={32}
                  color={isDark ? '#5A7A9A' : '#A0B8D0'}
                  style={styles.discoverPromptIcon}
                />
                <Text style={[styles.discoverPromptTitle, { color: isDark ? '#E0E6EC' : '#2A3A4C' }]}>
                  Find more clinics near you
                </Text>
                <Text style={[styles.discoverPromptSub, { color: isDark ? '#6A7A8C' : '#8A9AAC' }]}>
                  Enable location to expand results
                </Text>
                {!userLocation && (
                  <TouchableOpacity
                    onPress={toggleLocation}
                    activeOpacity={0.8}
                    style={[styles.discoverPromptBtn, { backgroundColor: isDark ? 'rgba(61,158,255,0.15)' : 'rgba(61,158,255,0.10)' }]}
                  >
                    {locationLoading ? (
                      <ActivityIndicator size={14} color="#3D9EFF" />
                    ) : (
                      <>
                        <Ionicons name="location" size={14} color="#3D9EFF" />
                        <Text style={styles.discoverPromptBtnText}>Enable Location</Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
              </GlassCard>
            }
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            initialNumToRender={15}
            maxToRenderPerBatch={10}
            windowSize={7}
            onScroll={onScrollEvent}
            onScrollBeginDrag={onScrollBegin}
            onMomentumScrollEnd={onScrollEnd}
            onScrollEndDrag={onScrollEnd}
            scrollEventThrottle={16}
          />
        )}
      </SafeAreaView>
    </View>
  );
}

// ─── Styles ───
const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, backgroundColor: 'transparent' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },

  // Header
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    backgroundColor: 'transparent',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 13,
    fontWeight: '400',
    marginTop: 1,
    letterSpacing: 0.1,
  },
  profileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
  },
  profileBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3D9EFF',
    letterSpacing: 0.1,
  },

  // Floating filter card + sticky wrapper
  stickyFilterWrap: {
    zIndex: 10,
    position: 'relative',
  },
  stickyFilterShadow: {
    ...Platform.select({
      ios: {
        shadowColor: '#0D1B2A',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.10,
        shadowRadius: 14,
      },
      android: { elevation: 6 },
    }),
  },
  filterCard: {
    marginHorizontal: 14,
    marginTop: 10,
    marginBottom: 8,
    paddingTop: 10,
    paddingBottom: 10,
    paddingHorizontal: 12,
    gap: 10,
  },

  // Search — Ultra Glass
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 28,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.30)',
    backgroundColor: 'rgba(255,255,255,0.15)',
    overflow: 'hidden',
    paddingHorizontal: 12,
    height: 42,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 15, paddingVertical: 0 },
  locationBtn: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  locationBtnActive: {
    backgroundColor: 'rgba(61,158,255,0.10)',
  },

  // Category pills
  pillsContent: { gap: 8 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 24,
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#0D1B2A',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
      },
      android: { elevation: 1 },
    }),
  },
  pillLabel: {
    fontSize: 13,
    letterSpacing: 0.2,
  },

  // List
  listContent: { paddingHorizontal: 16, paddingBottom: 100, gap: 10 },

  // Section headers
  sectionHeader: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    marginTop: 14,
    marginBottom: 8,
    marginLeft: 2,
  },
  sectionContent: {
    marginBottom: 4,
  },
  // Smart discover prompt
  discoverPrompt: {
    alignItems: 'center',
    paddingVertical: 28,
    paddingHorizontal: 24,
    marginTop: 12,
  },
  discoverPromptIcon: {
    marginBottom: 10,
    opacity: 0.6,
  },
  discoverPromptTitle: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.1,
    marginBottom: 4,
  },
  discoverPromptSub: {
    fontSize: 13,
    fontWeight: '400',
    letterSpacing: 0.1,
    marginBottom: 16,
  },
  discoverPromptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  discoverPromptBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3D9EFF',
    letterSpacing: 0.2,
  },

  emptyText: { fontSize: 14, textAlign: 'center' },

  // Map View button
  mapViewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
  },
  mapViewBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3D9EFF',
    letterSpacing: 0.2,
  },
});
