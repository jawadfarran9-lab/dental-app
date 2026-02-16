import StarAvatar from '@/src/components/StarAvatar';
import { useTheme } from '@/src/context/ThemeContext';
import { useAuth } from '@/src/hooks/useAuth';
import {
  DerivedPlace,
  PublicClinic,
  fetchPublishedClinics,
  reverseGeocode,
} from '@/src/services/publicClinics';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

// ─── Extended type with derived location ───
type ClinicListItem = PublicClinic & { city?: string; country?: string };

// ─── Clinic Row (memoised) ───
const ClinicRow = React.memo(
  ({
    item,
    isOwn,
    onPress,
    colors,
    isDark,
  }: {
    item: ClinicListItem;
    isOwn: boolean;
    onPress: (id: string) => void;
    colors: any;
    isDark: boolean;
  }) => (
    <TouchableOpacity
      activeOpacity={0.7}
      style={[
        styles.row,
        {
          backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#FFF',
          borderColor: isOwn
            ? isDark
              ? 'rgba(61,158,255,0.4)'
              : 'rgba(61,158,255,0.25)'
            : isDark
              ? 'rgba(255,255,255,0.08)'
              : '#EEF2F6',
        },
      ]}
      onPress={() => onPress(item.clinicId)}
    >
      {/* Star Avatar */}
      <StarAvatar
        size={44}
        uri={item.heroImage || 'https://via.placeholder.com/100'}
        borderWidth={1.5}
      />

      {/* Info */}
      <View style={styles.rowInfo}>
        <View style={styles.nameRow}>
          <Text
            style={[styles.clinicName, { color: colors.textPrimary }]}
            numberOfLines={1}
          >
            {item.name}
          </Text>
          {isOwn && <Text style={styles.ownBadge}>⭐</Text>}
        </View>
        {(item.city || item.country) ? (
          <Text
            style={[styles.location, { color: colors.textSecondary }]}
            numberOfLines={1}
          >
            {[item.city, item.country].filter(Boolean).join(', ')}
          </Text>
        ) : item.address ? (
          <Text
            style={[styles.location, { color: colors.textSecondary }]}
            numberOfLines={1}
          >
            {item.address}
          </Text>
        ) : null}
      </View>

      {/* Chevron */}
      <Ionicons
        name="chevron-forward"
        size={18}
        color={isDark ? '#556' : '#BCC5D0'}
      />
    </TouchableOpacity>
  ),
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

  const [clinics, setClinics] = useState<ClinicListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // ─── Fetch all published clinics & reverse-geocode ───
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const all = await fetchPublishedClinics();

        // Reverse-geocode in parallel (best-effort)
        const withLocations: ClinicListItem[] = await Promise.all(
          all.map(async (c) => {
            let place: DerivedPlace = {};
            if (c.geo?.lat != null && c.geo?.lng != null) {
              try {
                place = await reverseGeocode(c.geo.lat, c.geo.lng);
              } catch {}
            }
            return { ...c, city: place.city, country: place.country };
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

  // ─── Filtered + sorted list (memoised) ───
  const filteredClinics = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    // 1. Apply search filter
    const filtered = q
      ? clinics.filter(
          (c) =>
            c.name.toLowerCase().includes(q) ||
            (c.city && c.city.toLowerCase().includes(q)) ||
            (c.country && c.country.toLowerCase().includes(q)),
        )
      : clinics;

    // 2. Sort: own clinic first, then alphabetical
    return [...filtered].sort((a, b) => {
      const aIsOwn = isSubscribed && a.clinicId === ownClinicId ? 1 : 0;
      const bIsOwn = isSubscribed && b.clinicId === ownClinicId ? 1 : 0;
      if (aIsOwn !== bIsOwn) return bIsOwn - aIsOwn; // own first
      return a.name.localeCompare(b.name);
    });
  }, [clinics, searchQuery, ownClinicId, isSubscribed]);

  // ─── Navigate to clinic profile (stays inside tabs) ───
  const goToClinic = useCallback(
    (id: string) => {
      router.push(`/clinics/${id}` as any);
    },
    [router],
  );

  // ─── Render row ───
  const renderItem = useCallback(
    ({ item }: { item: ClinicListItem }) => (
      <ClinicRow
        item={item}
        isOwn={isSubscribed === true && item.clinicId === ownClinicId}
        onPress={goToClinic}
        colors={colors}
        isDark={isDark}
      />
    ),
    [isSubscribed, ownClinicId, goToClinic, colors, isDark],
  );

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: isDark ? colors.background : '#F5F7FA' },
      ]}
    >
      {/* ─── Header Bar ─── */}
      <View style={[styles.headerBar, { borderBottomColor: isDark ? 'rgba(255,255,255,0.08)' : '#E8ECF0' }]}>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
          Explore Clinics
        </Text>
        {ownClinicId ? (
          <TouchableOpacity
            onPress={() => router.push(`/clinics/${ownClinicId}` as any)}
          >
            <Text style={{ fontWeight: '600', color: colors.textPrimary }}>Profile</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View
          style={[
            styles.searchBar,
            {
              backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#FFF',
              borderColor: isDark ? 'rgba(255,255,255,0.12)' : '#E0E6ED',
            },
          ]}
        >
          <Ionicons
            name="search"
            size={18}
            color={isDark ? '#6A7A8C' : '#A0AAB8'}
          />
          <TextInput
            style={[styles.searchInput, { color: colors.textPrimary }]}
            placeholder="Search clinics..."
            placeholderTextColor={isDark ? '#6A7A8C' : '#A0AAB8'}
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
                size={18}
                color={isDark ? '#6A7A8C' : '#A0AAB8'}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* List */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : filteredClinics.length === 0 ? (
        <View style={styles.center}>
          <Ionicons
            name="search-outline"
            size={48}
            color={isDark ? '#5A6A80' : '#B0BEC5'}
          />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            {searchQuery ? 'No clinics match your search' : 'No clinics available'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredClinics}
          keyExtractor={(c: ClinicListItem) => c.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          initialNumToRender={15}
          maxToRenderPerBatch={10}
          windowSize={7}
        />
      )}
    </SafeAreaView>
  );
}

// ─── Styles ───
const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },

  // Header
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },

  // Search
  searchContainer: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 42,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 15, paddingVertical: 0 },

  // List
  listContent: { paddingHorizontal: 16, paddingBottom: 100, gap: 8 },

  // Row
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    gap: 12,
  },
  rowInfo: { flex: 1, gap: 2 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  clinicName: { fontSize: 15, fontWeight: '600', flexShrink: 1 },
  ownBadge: { fontSize: 12 },
  location: { fontSize: 12 },
  emptyText: { fontSize: 14, textAlign: 'center' },
});
