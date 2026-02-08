import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator, PermissionsAndroid, Platform } from 'react-native';
import { useTheme } from '@/src/context/ThemeContext';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n';
import { useRouter } from 'expo-router';
import { fetchPublishedClinics, reverseGeocode, PublicClinic, distanceKm, ensureGeohash } from '@/src/services/publicClinics';
import { isProPreviewClinic } from '@/src/utils/promoTier';

// Optional location; avoid hard dependency if not installed
let ExpoLocation: any;
try {
  ExpoLocation = require('expo-location');
} catch {}

export default function ClinicStories() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const isRTL = ['ar', 'he', 'fa', 'ur'].includes(i18n.language);
  const router = useRouter();
  const styles = React.useMemo(() => createStyles(colors), [colors]);

  const [loading, setLoading] = useState(true);
  const [clinics, setClinics] = useState<PublicClinic[]>([]);
  const [derived, setDerived] = useState<Record<string, { countryCode?: string; country?: string; city?: string }>>({});
  const [nearMe, setNearMe] = useState<{ lat: number; lng: number } | null>(null);
  const [nearEnabled, setNearEnabled] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const pubs = await fetchPublishedClinics();
      const enriched = pubs.map(ensureGeohash);
      setClinics(enriched);
      setLoading(false);
      enriched.forEach(async (c) => {
        const place = await reverseGeocode(c.geo?.lat, c.geo?.lng);
        setDerived((prev) => ({ ...prev, [c.id]: place }));
      });
    };
    load();
  }, []);

  const requestLocation = async () => {
    try {
      if (!ExpoLocation) { setNearMe(null); setNearEnabled(false); return; }
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

  const ordered = useMemo(() => {
    let list = clinics.map((c) => ({ c, d: derived[c.id] || {} }));
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
  }, [clinics, derived, nearEnabled, nearMe]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>      
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>{isRTL ? 'قصص العيادات' : 'Clinic Stories'}</Text>
        <TouchableOpacity style={[styles.nearBtn, nearEnabled && styles.nearBtnActive]} onPress={requestLocation}>
          <Text style={[styles.nearText, nearEnabled && styles.nearTextActive]}>
            {nearEnabled ? (isRTL ? 'بالقرب' : 'Near on') : (isRTL ? 'تفعيل القرب' : 'Near me')}
          </Text>
        </TouchableOpacity>
      </View>
      {!nearEnabled && (
        <Text style={styles.muted}>{isRTL ? 'فعّل الموقع لعرض الأقرب. سيعمل بدون إذن أيضاً.' : 'Enable location to sort by nearest. Works without permission too.'}</Text>
      )}

      {loading ? (
        <ActivityIndicator />
      ) : (
        <FlatList
          horizontal
          data={ordered}
          keyExtractor={({ c }) => c.id}
          renderItem={({ item }) => {
            const { c, d } = item;
            const distance = nearEnabled && nearMe && c.geo && typeof c.geo.lat === 'number' && typeof c.geo.lng === 'number'
              ? distanceKm(nearMe, { lat: c.geo.lat, lng: c.geo.lng })
              : null;
            const isPro = c.tier === 'pro' || isProPreviewClinic(c) || (c.id === 'demo-pro-1' || c.id === 'demo-pro-2'); // G1+G3: tier field or computed
            return (
              <TouchableOpacity style={styles.storyItem} onPress={() => router.push(`/public/clinic/${c.id}` as any)}>
                <View style={[styles.circleWrap, isPro && styles.circleWrapPro]}>
                  {c.heroImage ? (
                    <Image source={{ uri: c.heroImage }} style={styles.circleImage} />
                  ) : (
                    <View style={[styles.circleImage, styles.circlePlaceholder]} />
                  )}
                  {isPro && (
                    <View style={styles.proBadge}>
                      <Text style={styles.proBadgeText}>PRO</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.storyText} numberOfLines={1}>{c.name}</Text>
                {d.city ? <Text style={styles.cityText} numberOfLines={1}>{d.city}</Text> : null}
                {distance != null && isFinite(distance) ? (
                  <Text style={styles.distanceText}>{distance.toFixed(1)} km</Text>
                ) : null}
              </TouchableOpacity>
            );
          }}
          showsHorizontalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: colors.background },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  title: { fontSize: 18, fontWeight: '800', color: colors.textPrimary },
  nearBtn: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, backgroundColor: colors.inputBackground },
  nearBtnActive: { backgroundColor: colors.buttonBackground },
  nearText: { color: colors.textPrimary, fontWeight: '700' },
  nearTextActive: { color: colors.buttonText },
  muted: { color: colors.textSecondary, marginBottom: 10, fontSize: 12 },
  storyItem: { width: 100, alignItems: 'center', marginRight: 12 },
  circleWrap: { width: 86, height: 86, borderRadius: 43, padding: 3, backgroundColor: colors.buttonBackground, position: 'relative' },
  circleWrapPro: { backgroundColor: '#1a1513', borderWidth: 2, borderColor: colors.buttonBackground },
  circleImage: { width: '100%', height: '100%', borderRadius: 43 },
  circlePlaceholder: { backgroundColor: colors.cardBorder },
  proBadge: { position: 'absolute', bottom: -4, right: -4, backgroundColor: colors.buttonBackground, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8, borderWidth: 1, borderColor: '#1a1513' },
  proBadgeText: { color: '#1a1513', fontWeight: '800', fontSize: 9, letterSpacing: 0.5 },
  storyText: { marginTop: 6, fontWeight: '700', fontSize: 12, textAlign: 'center', color: colors.textPrimary },
  cityText: { color: colors.textSecondary, fontSize: 11, textAlign: 'center' },
  distanceText: { color: colors.textSecondary, fontSize: 11, fontWeight: '700', marginTop: 2 },
});
