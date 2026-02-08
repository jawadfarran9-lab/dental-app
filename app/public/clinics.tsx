import i18n from '@/i18n';
import { useTheme } from '@/src/context/ThemeContext';
import { PublicClinic, distanceKm, ensureGeohash, fetchPublishedClinics, reverseGeocode } from '@/src/services/publicClinics';
import { isProPreviewClinic } from '@/src/utils/promoTier';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, FlatList, Image, Modal, PermissionsAndroid, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
// Optional location; avoid hard dependency if not installed
let ExpoLocation: any;
try {
  // Dynamically require to prevent compile error if not present
  ExpoLocation = require('expo-location');
} catch {}

type SpecialtyFilter = 'all' | 'general' | 'orthodontics' | 'cosmetic' | 'pediatric' | 'surgery' | 'endodontics' | 'periodontics' | 'prosthodontics';

export default function PublicClinicsExplorer() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const isRTL = ['ar', 'he', 'fa', 'ur'].includes(i18n.language);
  const router = useRouter();
  const styles = React.useMemo(() => createStyles(colors, isRTL), [colors, isRTL]);

  const [loading, setLoading] = useState(true);
  const [clinics, setClinics] = useState<PublicClinic[]>([]);
  const [derived, setDerived] = useState<Record<string, { countryCode?: string; country?: string; city?: string }>>({});
  const [search, setSearch] = useState('');
  const [countryFilter, setCountryFilter] = useState<string | null>(null);
  const [specialtyFilter, setSpecialtyFilter] = useState<SpecialtyFilter>('all');
  const [nearMe, setNearMe] = useState<{ lat: number; lng: number } | null>(null);
  const [nearEnabled, setNearEnabled] = useState(false);
  const [selected, setSelected] = useState<{ c: PublicClinic; d: { countryCode?: string; country?: string; city?: string } } | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const pubs = await fetchPublishedClinics();
      setClinics(pubs.map(ensureGeohash));
      setLoading(false);
      // derive city/country from geo if present
      pubs.forEach(async (c) => {
        const place = await reverseGeocode(c.geo?.lat, c.geo?.lng);
        setDerived((prev) => ({ ...prev, [c.id]: place }));
      });
    };
    load();
  }, []);

  const requestLocation = async () => {
    try {
      if (!ExpoLocation) { setNearMe(null); return; }
      if (Platform.OS === 'android') {
        await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
      }
      const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setNearMe(null);
        setNearEnabled(false);
        return;
      }
      const loc = await ExpoLocation.getCurrentPositionAsync({});
      setNearMe({ lat: loc.coords.latitude, lng: loc.coords.longitude });
      setNearEnabled(true);
    } catch {
      setNearMe(null);
      setNearEnabled(false);
    }
  };

  const filtered = useMemo(() => {
    let list = clinics.map((c) => ({ c, d: derived[c.id] || {} }));
    if (search.trim()) {
      const needle = search.trim().toLowerCase();
      list = list.filter(({ c, d }) =>
        c.name?.toLowerCase?.().includes(needle) || d.city?.toLowerCase?.().includes(needle)
      );
    }
    if (countryFilter) {
      list = list.filter(({ d }) => d.countryCode === countryFilter);
    }
    if (specialtyFilter && specialtyFilter !== 'all') {
      list = list.filter(({ c }) => c.specialty === specialtyFilter);
    }
    // Near me sorting (optional; non-blocking)
    if (nearEnabled && nearMe) {
      list = list.sort((a, b) => {
        const da = (a.c.geo && typeof a.c.geo.lat === 'number' && typeof a.c.geo.lng === 'number')
          ? distanceKm(nearMe, { lat: a.c.geo.lat, lng: a.c.geo.lng })
          : Number.POSITIVE_INFINITY;
        const db = (b.c.geo && typeof b.c.geo.lat === 'number' && typeof b.c.geo.lng === 'number')
          ? distanceKm(nearMe, { lat: b.c.geo.lat, lng: b.c.geo.lng })
          : Number.POSITIVE_INFINITY;
        return da - db;
      });
    }
    return list;
  }, [clinics, derived, search, countryFilter, specialtyFilter, nearMe, nearEnabled]);

  const uniqueCountries = useMemo(() => {
    const set = new Set<string>();
    clinics.forEach((c) => { const d = derived[c.id]; if (d?.countryCode) set.add(d.countryCode); });
    return Array.from(set).sort();
  }, [clinics, derived]);

  const specialties: SpecialtyFilter[] = ['all', 'general', 'orthodontics', 'cosmetic', 'pediatric', 'surgery', 'endodontics', 'periodontics', 'prosthodontics'];

  const renderStars = (rating?: number, totalReviews?: number) => {
    if (!rating || rating === 0) {
      return <Text style={styles.noRating}>{t('discover.noRating')}</Text>;
    }
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<Ionicons key={i} name="star" size={12} color={colors.promo || '#FFD700'} />);
      } else if (i === fullStars && hasHalfStar) {
        stars.push(<Ionicons key={i} name="star-half" size={12} color={colors.promo || '#FFD700'} />);
      } else {
        stars.push(<Ionicons key={i} name="star-outline" size={12} color={colors.textSecondary} />);
      }
    }
    
    return (
      <View style={styles.ratingContainer}>
        <View style={styles.starsRow}>{stars}</View>
        {totalReviews ? <Text style={styles.reviewsText}>({totalReviews} {t('discover.reviews')})</Text> : null}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>      
      <View style={styles.headerRow}>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder={t('discover.searchPlaceholder')}
          placeholderTextColor={colors.textSecondary}
          style={[styles.searchInput, isRTL && { textAlign: 'right', writingDirection: 'rtl' }]}
        />
        <TouchableOpacity style={styles.nearBtn} onPress={requestLocation}>
          <Text style={styles.nearText}>{t('discover.nearMe')}</Text>
        </TouchableOpacity>
        {nearMe ? (
          <TouchableOpacity
            style={[styles.toggleBtn, nearEnabled && styles.toggleBtnActive]}
            onPress={() => setNearEnabled((p) => !p)}
          >
            <Text style={[styles.toggleText, nearEnabled && styles.toggleTextActive]}>
              {nearEnabled ? t('discover.on') : t('discover.off')}
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {!nearMe && (
        <Text style={[styles.infoText, isRTL && { textAlign: 'right' }]}>{t('discover.enableLocation')}</Text>
      )}

      {/* Specialty filter chips */}
      <View>
        <Text style={[styles.filterTitle, isRTL && { textAlign: 'right' }]}>{t('discover.filterBySpecialty')}</Text>
        <FlatList
          horizontal
          data={specialties}
          keyExtractor={(k) => k}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.chip, specialtyFilter === item && styles.chipActive]}
              onPress={() => setSpecialtyFilter(item)}
            >
              <Text style={[styles.chipText, specialtyFilter === item && styles.chipTextActive]}>
                {t(`discover.specialty.${item}`)}
              </Text>
            </TouchableOpacity>
          )}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingVertical: 4 }}
        />
      </View>

      {/* Country filter chips */}
      {uniqueCountries.length > 0 && (
        <FlatList
          horizontal
          data={uniqueCountries}
          keyExtractor={(k) => k}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.chip, countryFilter === item && styles.chipActive]}
              onPress={() => setCountryFilter(countryFilter === item ? null : item)}
            >
              <Text style={[styles.chipText, countryFilter === item && styles.chipTextActive]}>{item}</Text>
            </TouchableOpacity>
          )}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingVertical: 4 }}
        />
      )}

      <Text style={[styles.sectionTitle, isRTL && { textAlign: 'right' }]}>{t('discover.storiesTitle')}</Text>

      {/* Stories-style horizontal explorer */}
      {loading ? (
        <ActivityIndicator />
      ) : (
        <FlatList
          horizontal
          data={filtered}
          keyExtractor={({ c }) => c.id}
          renderItem={({ item }) => {
            const { c, d } = item;
            const isPro = c.tier === 'pro' || isProPreviewClinic(c);
            const distance = nearEnabled && nearMe && c.geo && typeof c.geo.lat === 'number' && typeof c.geo.lng === 'number'
              ? distanceKm(nearMe, { lat: c.geo.lat, lng: c.geo.lng })
              : null;
            const isFavorite = favorites.has(c.id);
            return (
                  <TouchableOpacity style={styles.storyItem} onPress={() => setSelected({ c, d })}>
                    <View
                      style={[
                        styles.circleWrap,
                        { borderColor: colors.accentBlue },
                        isPro && styles.circleWrapPro,
                        isPro && { borderColor: colors.promo },
                        isFavorite && { borderColor: colors.buttonBackground, borderWidth: 3 },
                      ]}
                    >
                  {c.heroImage ? (
                    <Image source={{ uri: c.heroImage }} style={styles.circleImage} />
                  ) : (
                    <Image source={require('../../assets/splash-icon.png')} style={styles.circleImage} />
                  )}
                  {isPro && (
                    <View style={styles.featuredChip}>
                      <Text style={styles.featuredChipText}>{isRTL ? 'مميزة' : 'Featured'}</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.storyText} numberOfLines={1}>{c.name}</Text>
                {d.city ? <Text style={styles.cityText} numberOfLines={1}>{d.city}</Text> : null}
                {renderStars(c.averageRating, c.totalReviews)}
                {distance != null && isFinite(distance) ? (
                  <Text style={styles.distanceText}>{distance.toFixed(1)} km</Text>
                ) : null}
              </TouchableOpacity>
            );
          }}
          showsHorizontalScrollIndicator={false}
        />
      )}

      <Modal visible={!!selected} transparent animationType="fade" onRequestClose={() => setSelected(null)}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => setSelected(null)}>
          <View style={[styles.sheet, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
            pointerEvents="box-none"
          >
            <TouchableOpacity activeOpacity={1} style={styles.sheetContent}
              onPress={(e) => e.stopPropagation()}
            >
              {selected ? (
                <>
                  <View style={styles.sheetHeader}>
                    <View style={[styles.sheetAvatar, { borderColor: colors.accentBlue }]}
                    >
                      {selected.c.heroImage ? (
                        <Image source={{ uri: selected.c.heroImage }} style={styles.sheetAvatarImage} />
                      ) : (
                        <Image source={require('../../assets/splash-icon.png')} style={styles.sheetAvatarImage} />
                      )}
                    </View>
                    <View style={[styles.sheetTitleWrap, isRTL && { alignItems: 'flex-end' }]}>
                      <Text style={[styles.sheetTitle, { color: colors.textPrimary }]} numberOfLines={1}>{selected.c.name}</Text>
                      {selected.d.city ? (
                        <Text style={[styles.sheetSubtitle, { color: colors.textSecondary }]} numberOfLines={1}>{selected.d.city}</Text>
                      ) : null}
                      {renderStars(selected.c.averageRating, selected.c.totalReviews)}
                    </View>
                  </View>

                  <TouchableOpacity
                    style={[styles.sheetBtn, { backgroundColor: favorites.has(selected.c.id) ? colors.buttonSecondaryBackground : colors.buttonBackground }]}
                    onPress={() => {
                      if (!selected) return;
                      setFavorites((prev) => {
                        const next = new Set(prev);
                        if (next.has(selected.c.id)) {
                          next.delete(selected.c.id);
                        } else {
                          next.add(selected.c.id);
                        }
                        return next;
                      });
                    }}
                  >
                    <Ionicons 
                      name={favorites.has(selected.c.id) ? 'heart' : 'heart-outline'} 
                      size={18} 
                      color={favorites.has(selected.c.id) ? (colors.buttonSecondaryText || colors.textPrimary) : colors.buttonText} 
                    />
                    <Text style={[styles.sheetBtnText, { color: favorites.has(selected.c.id) ? (colors.buttonSecondaryText || colors.textPrimary) : colors.buttonText }]}>
                      {favorites.has(selected.c.id) ? t('discover.addedFavorite') : t('discover.addFavorite')}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.sheetBtnPrimary, { backgroundColor: colors.buttonBackground }]}
                    onPress={() => {
                      if (!selected) return;
                      router.push(`/public/clinic/${selected.c.id}` as any);
                      setSelected(null);
                    }}
                  >
                    <Ionicons name="arrow-forward-circle-outline" size={18} color={colors.buttonText} />
                    <Text style={[styles.sheetBtnText, { color: colors.buttonText }]}>{t('discover.visitClinic')}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={[styles.sheetBtn, { backgroundColor: 'transparent' }]} onPress={() => setSelected(null)}>
                    <Text style={[styles.sheetCancel, { color: colors.textSecondary }]}>{t('common.cancel')}</Text>
                  </TouchableOpacity>
                </>
              ) : null}
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const createStyles = (colors: any, isRTL: boolean) => StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: colors.background },
  headerRow: { flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 8 },
  searchInput: { flex: 1, borderWidth: 1, borderColor: colors.cardBorder, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, backgroundColor: colors.inputBackground, color: colors.textPrimary },
  nearBtn: { backgroundColor: colors.buttonBackground, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 },
  nearText: { color: colors.buttonText, fontWeight: '700' },
  toggleBtn: { backgroundColor: colors.inputBackground, paddingVertical: 8, paddingHorizontal: 10, borderRadius: 8 },
  toggleBtnActive: { backgroundColor: colors.buttonBackground },
  toggleText: { color: colors.textPrimary, fontWeight: '700' },
  toggleTextActive: { color: colors.buttonText },

  filterTitle: { marginTop: 8, marginBottom: 4, fontWeight: '700', color: colors.textPrimary, fontSize: 13 },
  chip: { backgroundColor: colors.inputBackground, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, marginRight: isRTL ? 0 : 8, marginLeft: isRTL ? 8 : 0 },
  chipActive: { backgroundColor: colors.buttonBackground },
  chipText: { color: colors.textPrimary, fontWeight: '600', fontSize: 12 },
  chipTextActive: { color: colors.buttonText },

  sectionTitle: { marginTop: 12, marginBottom: 8, fontWeight: '800', color: colors.textPrimary, fontSize: 16 },

  storyItem: { width: 100, alignItems: 'center', marginRight: isRTL ? 0 : 12, marginLeft: isRTL ? 12 : 0 },
  circleWrap: { width: 80, height: 80, borderRadius: 40, padding: 3, backgroundColor: colors.card, position: 'relative', borderWidth: 2 },
  circleWrapPro: { backgroundColor: '#1a1513' },
  circleImage: { width: '100%', height: '100%', borderRadius: 40 },
  circlePlaceholder: { backgroundColor: colors.cardBorder },
  featuredChip: { position: 'absolute', bottom: -6, left: 0, right: 0, backgroundColor: colors.buttonBackground, paddingVertical: 2, borderRadius: 8, borderWidth: 1, borderColor: '#1a1513', alignItems: 'center' },
  featuredChipText: { color: '#1a1513', fontWeight: '800', fontSize: 9, letterSpacing: 0.3 },
  storyText: { marginTop: 6, fontWeight: '700', fontSize: 12, textAlign: 'center', color: colors.textPrimary },
  cityText: { color: colors.textSecondary, fontSize: 11, textAlign: 'center' },
  
  ratingContainer: { alignItems: 'center', marginTop: 2 },
  starsRow: { flexDirection: isRTL ? 'row-reverse' : 'row', gap: 2 },
  reviewsText: { color: colors.textSecondary, fontSize: 10, marginTop: 2 },
  noRating: { color: colors.textSecondary, fontSize: 10, marginTop: 2, textAlign: 'center' },
  
  distanceText: { color: colors.textSecondary, fontSize: 11, fontWeight: '700', marginTop: 2 },
  infoText: { color: colors.textSecondary, fontSize: 12, marginVertical: 6 },

  backdrop: { flex: 1, backgroundColor: colors.scrim, justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 16, borderTopRightRadius: 16, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 24, borderWidth: 1 },
  sheetContent: { gap: 12 },
  sheetHeader: { flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 12 },
  sheetAvatar: { width: 56, height: 56, borderRadius: 28, borderWidth: 2, overflow: 'hidden' },
  sheetAvatarImage: { width: '100%', height: '100%' },
  sheetTitleWrap: { flex: 1 },
  sheetTitle: { fontSize: 16, fontWeight: '800' },
  sheetSubtitle: { fontSize: 12 },
  sheetBtn: { flexDirection: isRTL ? 'row-reverse' : 'row', paddingVertical: 12, borderRadius: 12, alignItems: 'center', justifyContent: 'center', gap: 10 },
  sheetBtnPrimary: { flexDirection: isRTL ? 'row-reverse' : 'row', paddingVertical: 12, borderRadius: 12, alignItems: 'center', justifyContent: 'center', gap: 10 },
  sheetBtnText: { fontWeight: '700', fontSize: 14 },
  sheetCancel: { fontWeight: '700', fontSize: 14 },
});
