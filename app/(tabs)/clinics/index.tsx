import { db } from '@/firebaseConfig';
import ClinicRow from '@/src/components/ClinicRow';
import GlassCard from '@/src/components/GlassCard';
import { PremiumGradientBackground } from '@/src/components/PremiumGradientBackground';
import RadiusSelector from '@/src/components/RadiusSelector';
import { useTheme } from '@/src/context/ThemeContext';
import { useAuth } from '@/src/hooks/useAuth';
import {
  PublicClinic,
  fetchClinicPublicOwner,
  fetchPublishedClinics,
  reverseGeocode,
} from '@/src/services/publicClinics';
import { WeeklySchedule } from '@/src/types/clinicSchedule';
import { getDistanceBetween } from '@/src/utils/geoDistance';
import { parseWorkingHours } from '@/src/utils/parseWorkingHours';
import { getClinicOpenStatus } from '@/src/utils/workingHoursStatus';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Location from 'expo-location';
import { useFocusEffect, useRouter } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
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

// ═══════════════════════════════════════════════════════════════════
// CLINICS SCREEN — Single layout with conditional sections
// ═══════════════════════════════════════════════════════════════════

export default function ClinicsListScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { clinicId: ownClinicId, isSubscribed, loading: authLoading } = useAuth();

  // ── Section visibility ──
  // Owner + active subscription: show YOUR CLINIC section above Discover
  // Everyone always sees the full Explore Clinics page (Discover + search + filters)
  const showMyClinic = !!ownClinicId && isSubscribed === true;

  // ── Own clinic state ──
  const [ownClinic, setOwnClinic] = useState<PublicClinic | null>(null);
  const [ownClinicLoading, setOwnClinicLoading] = useState(false);
  const [ownWorkingHours, setOwnWorkingHours] = useState<WeeklySchedule | null>(null);

  // ── Explore state ──
  const [clinics, setClinics] = useState<ClinicListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('all');
  const [radiusKm, setRadiusKm] = useState(25);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const locationFetched = useRef(false);

  // ── Fetch own clinic (public profile + private workingHours) ──
  // Refetch on focus so manualClose changes from Profile are reflected
  const fetchOwnClinic = useCallback(() => {
    if (!ownClinicId) return;
    let cancelled = false;
    setOwnClinicLoading(true);
    (async () => {
      try {
        const [clinic, privateSnap] = await Promise.all([
          fetchClinicPublicOwner(ownClinicId),
          getDoc(doc(db, 'clinics', ownClinicId)),
        ]);
        if (!cancelled) {
          setOwnClinic(clinic);
          const raw = privateSnap.exists() ? privateSnap.data()?.workingHours : undefined;
          setOwnWorkingHours(parseWorkingHours(raw));
        }
      } catch {
        // Silent
      } finally {
        if (!cancelled) setOwnClinicLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [ownClinicId]);

  useFocusEffect(fetchOwnClinic);

  // ── Own clinic entry animation ──
  const entryAnim = useRef(new Animated.Value(0)).current;
  const entryRan = useRef(false);
  useEffect(() => {
    if (ownClinic && !entryRan.current) {
      entryRan.current = true;
      Animated.timing(entryAnim, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start();
    }
  }, [ownClinic, entryAnim]);

  // ── GPS auto-request ──
  const lastLocation = useRef<{ lat: number; lng: number } | null>(null);
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
        // Silent
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // ── Scroll handling ──
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

  // ── Location pulse ──
  const locPulse = useRef(new Animated.Value(1)).current;
  const prevLocationRef = useRef(userLocation);
  useEffect(() => {
    if (userLocation && !prevLocationRef.current) {
      Animated.sequence([
        Animated.timing(locPulse, { toValue: 1.25, duration: 150, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        Animated.timing(locPulse, { toValue: 1, duration: 180, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]).start();
    }
    prevLocationRef.current = userLocation;
  }, [userLocation, locPulse]);

  // ── Fetch all published clinics ──
  const initialFetchDone = useRef(false);
  const fetchClinics = useCallback(() => {
    let cancelled = false;
    (async () => {
      if (!initialFetchDone.current) setLoading(true);
      try {
        const all = await fetchPublishedClinics();
        if (cancelled) return;
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
                return c;
              }
            }
            return c;
          }),
        );
        if (!cancelled) setClinics(withLocations);
      } catch (err) {
        console.error('[CLINICS_LIST] Failed to fetch clinics:', err);
      } finally {
        if (!cancelled) {
          setLoading(false);
          initialFetchDone.current = true;
        }
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useFocusEffect(fetchClinics);

  // ── Toggle location ──
  const toggleLocation = useCallback(async () => {
    if (userLocation) {
      setUserLocation(null);
      return;
    }
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
      // Silent
    } finally {
      setLocationLoading(false);
    }
  }, [userLocation]);

  // ── Filtered + sorted clinics ──
  const filteredClinics = useMemo(() => {
    let filtered = ownClinicId
      ? clinics.filter((c) => c.clinicId !== ownClinicId)
      : clinics;

    const q = searchQuery.trim().toLowerCase();
    if (q) {
      filtered = filtered.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          (c.city && c.city.toLowerCase().includes(q)) ||
          (c.country && c.country.toLowerCase().includes(q)),
      );
    }

    if (activeCategory !== 'all') {
      filtered = filtered.filter((c) => deriveClinicType(c.specialty) === activeCategory);
    }

    if (userLocation) {
      filtered = filtered.filter((c) => {
        if (!c.geo?.lat || !c.geo?.lng) return true;
        return getDistanceBetween(userLocation, c.geo) <= radiusKm;
      });
    }

    // ── Smart weighted ranking ──
    const REVIEW_CAP = 100;

    // Pre-compute distance for each clinic once (O(n))
    const distMap = new Map<string, number>();
    let maxDist = 0;
    if (userLocation) {
      for (const c of filtered) {
        const d = c.geo ? getDistanceBetween(userLocation, c.geo) : Infinity;
        distMap.set(c.id, d);
        if (isFinite(d) && d > maxDist) maxDist = d;
      }
    }

    // Composite score: higher = better
    const PRO_BOOST = 1.12;
    const score = (c: ClinicListItem): number => {
      const r = (c.averageRating ?? 0) / 5;
      const rv = Math.min(c.totalReviews ?? 0, REVIEW_CAP) / REVIEW_CAP;
      const t = c.tier === 'pro' ? 1 : 0;

      let base: number;
      if (userLocation && maxDist > 0) {
        const dist = distMap.get(c.id) ?? Infinity;
        const ds = isFinite(dist) ? 1 - dist / maxDist : 0;
        base = ds * 0.4 + r * 0.3 + rv * 0.2 + t * 0.1;
      } else {
        // No location: redistribute weights
        base = r * 0.5 + rv * 0.3 + t * 0.2;
      }

      return c.tier === 'pro' ? base * PRO_BOOST : base;
    };

    // Pre-compute scores once (O(n))
    const scoreMap = new Map<string, number>();
    for (const c of filtered) scoreMap.set(c.id, score(c));

    return [...filtered].sort((a, b) => {
      const diff = (scoreMap.get(b.id) ?? 0) - (scoreMap.get(a.id) ?? 0);
      if (diff !== 0) return diff;
      return a.name.localeCompare(b.name);
    });
  }, [clinics, searchQuery, activeCategory, userLocation, radiusKm, ownClinicId]);

  const getDistance = useCallback(
    (geo?: { lat: number; lng: number }): number | null => {
      if (!userLocation || !geo) return null;
      return getDistanceBetween(userLocation, geo);
    },
    [userLocation],
  );

  const goToClinic = useCallback(
    (id: string) => { router.push(`/clinics/${id}` as any); },
    [router],
  );

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
        statusDot={item.status === 'open' ? 'green' : item.status === 'closed' ? 'red' : item.manualClose ? 'red' : 'green'}
        onPress={() => goToClinic(item.clinicId)}
      />
    ),
    [goToClinic, isDark, getDistance],
  );

  // ── List header (includes optional "Your Clinic" + Discover label) ──
  const listHeader = useMemo(() => (
    <>
      {showMyClinic && ownClinic && (
        <>
          <Text style={[styles.sectionHeader, { color: isDark ? 'rgba(255,255,255,0.40)' : 'rgba(0,0,0,0.32)' }]}>
            YOUR CLINIC
          </Text>
          <Animated.View style={[
            styles.sectionContent,
            {
              opacity: entryAnim,
              transform: [{ translateY: entryAnim.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }],
            },
          ]}>
            <ClinicRow
              clinicId={ownClinic.clinicId}
              name={ownClinic.name}
              city={ownClinic.city}
              country={ownClinic.country}
              imageUrl={ownClinic.heroImage}
              rating={ownClinic.averageRating ?? null}
              distanceKm={null}
              clinicType={deriveClinicType(ownClinic.specialty)}
              isOwn
              isDark={isDark}
              statusDot={
                ownClinic.status === 'open'
                  ? 'green'
                  : ownClinic.status === 'closed'
                    ? 'red'
                    : ownClinic.manualClose
                      ? 'red'
                      : ownWorkingHours
                        ? getClinicOpenStatus(ownWorkingHours).status === 'open' ? 'green' : 'red'
                        : 'green'
              }
              onPress={() => router.push(`/clinics/${ownClinic.clinicId}` as any)}
            />
          </Animated.View>
        </>
      )}
      <Text style={[styles.sectionHeader, { color: isDark ? 'rgba(255,255,255,0.40)' : 'rgba(0,0,0,0.32)' }]}>
        DISCOVER
      </Text>
    </>
  ), [showMyClinic, ownClinic, isDark, entryAnim, router]);

  const locationIconColor = userLocation
    ? '#3D9EFF'
    : isDark ? '#6A7A8C' : '#A0AAB8';

  const subtitleConfig = useMemo(() => {
    if (!userLocation) return { text: 'Enable location to discover nearby clinics', pressable: true };
    if (filteredClinics.length === 0) return { text: 'No clinics found nearby', pressable: false };
    return { text: 'Discover top-rated clinics near you', pressable: false };
  }, [userLocation, filteredClinics.length]);

  // ── Auth loading gate ──
  if (authLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  const headerTitle = 'Explore Clinics';

  return (
    <View style={styles.container}>
      <PremiumGradientBackground isDark={isDark} showSparkles={false} />
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={[styles.headerBar, { borderBottomColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}>
          <View>
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>{headerTitle}</Text>
            {subtitleConfig.text ? (
              subtitleConfig.pressable ? (
                <TouchableOpacity onPress={toggleLocation} activeOpacity={0.7}>
                  <Text style={[styles.headerSubtitle, { color: '#3D9EFF' }]}>{subtitleConfig.text}</Text>
                </TouchableOpacity>
              ) : (
                <Text style={[styles.headerSubtitle, { color: isDark ? '#6A7A8C' : '#8A9AAC' }]}>{subtitleConfig.text}</Text>
              )
            ) : null}
          </View>
          {showMyClinic && (
            <TouchableOpacity
              onPress={() => router.push(`/clinics/${ownClinicId}` as any)}
              style={[styles.profileBtn, { backgroundColor: isDark ? 'rgba(61,158,255,0.12)' : 'rgba(61,158,255,0.08)' }]}
            >
              <Ionicons name="person-circle-outline" size={18} color="#3D9EFF" />
              <Text style={styles.profileBtnText}>Profile</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Filters */}
        <View style={[styles.stickyFilterWrap, isScrolling && styles.stickyFilterShadow]}>
            <GlassCard intensity={filterIntensity} tint={isDark ? 'dark' : 'light'} style={styles.filterCard}>
              {/* Search Bar */}
              <View style={styles.searchBar}>
                <BlurView
                  intensity={Platform.OS === 'ios' ? (isDark ? 60 : 70) : 0}
                  tint={isDark ? 'dark' : 'light'}
                  style={StyleSheet.absoluteFill}
                />
                {Platform.OS === 'android' && (
                  <View style={[StyleSheet.absoluteFill, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.15)' }]} />
                )}
                <Ionicons name="search" size={17} color={isDark ? '#5A6A7C' : '#A0AAB8'} />
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
                    <Ionicons name="close-circle" size={17} color={isDark ? '#5A6A7C' : '#A0AAB8'} />
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={toggleLocation} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} activeOpacity={0.7}>
                  <Animated.View style={{ transform: [{ scale: locPulse }] }}>
                    <GlassCard intensity={isDark ? 25 : 40} tint={isDark ? 'dark' : 'light'} borderRadius={15} style={[styles.locationBtn, userLocation && styles.locationBtnActive]}>
                      {locationLoading ? (
                        <ActivityIndicator size={14} color="#3D9EFF" />
                      ) : (
                        <Ionicons name={userLocation ? 'location' : 'location-outline'} size={16} color={locationIconColor} />
                      )}
                    </GlassCard>
                  </Animated.View>
                </TouchableOpacity>
              </View>

              {/* Category Pills */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillsContent}>
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

              {/* Radius filter */}
              {userLocation && <RadiusSelector valueKm={radiusKm} onChangeKm={setRadiusKm} isDark={isDark} />}

              {/* Map View */}
              <TouchableOpacity
                onPress={() =>
                  router.push({ pathname: '/(tabs)/clinics/map', params: { category: activeCategory, radiusKm: String(radiusKm) } } as any)
                }
                activeOpacity={0.7}
                style={[styles.mapViewBtn, { backgroundColor: isDark ? 'rgba(61,158,255,0.12)' : 'rgba(61,158,255,0.08)' }]}
              >
                <Ionicons name="map-outline" size={15} color="#3D9EFF" />
                <Text style={styles.mapViewBtnText}>Map View</Text>
              </TouchableOpacity>
            </GlassCard>
          </View>

        {/* Content */}
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <AnimatedFlatList
            data={filteredClinics}
            keyExtractor={(c: ClinicListItem) => c.id}
            renderItem={renderItem}
            ListHeaderComponent={listHeader}
            ListEmptyComponent={
              <View style={{ alignItems: 'center', paddingTop: 40, gap: 12 }}>
                <Ionicons name="search-outline" size={48} color={isDark ? '#5A6A80' : '#B0BEC5'} />
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  {searchQuery || activeCategory !== 'all' ? 'No clinics match your filters' : 'No clinics available'}
                </Text>
              </View>
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
