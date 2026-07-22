import CountrySelect from '@/app/components/CountrySelect';
import { db } from '@/firebaseConfig';
import { PremiumGradientBackground } from '@/src/components/PremiumGradientBackground';
import StaticMapPreview from '@/src/components/StaticMapPreview';
import { useAuth } from '@/src/context/AuthContext';
import { useTheme } from '@/src/context/ThemeContext';
import { fetchClinicData } from '@/src/utils/clinicDataUtils';
import { useClinicRoleGuard } from '@/src/utils/navigationGuards';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useFocusEffect, useRouter } from 'expo-router';
import { doc, setDoc } from 'firebase/firestore';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const ACCENT = '#3D9EFF';
const ACCENT_DARK = '#1E6FD9';
const GREEN = '#10B981';

type ClinicLocation = { lat: number; lng: number; address: string };

export default function ClinicLocationScreen() {
  useClinicRoleGuard(['owner']);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { clinicId } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [countryCode, setCountryCode] = useState('');
  const [city, setCity] = useState('');
  const [location, setLocation] = useState<ClinicLocation | null>(null);

  const pendingPickRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!clinicId) {
        setLoading(false);
        return;
      }
      try {
        const data = await fetchClinicData(clinicId);
        if (cancelled || !data) return;
        setCountryCode(data.countryCode ?? '');
        setCity(data.city ?? '');
        if (
          data.location &&
          typeof data.location.lat === 'number' &&
          typeof data.location.lng === 'number'
        ) {
          setLocation({
            lat: data.location.lat,
            lng: data.location.lng,
            address: data.location.address ?? '',
          });
        }
      } catch (err) {
        console.error('[CLINIC-LOCATION] load error', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [clinicId]);

  useFocusEffect(
    useCallback(() => {
      if (!pendingPickRef.current) return;
      pendingPickRef.current = false;
      (async () => {
        try {
          const raw = await AsyncStorage.getItem('signupDraftLocation');
          if (raw) {
            const parsed = JSON.parse(raw) as Partial<ClinicLocation> & { countryCode?: string };
            if (
              typeof parsed.lat === 'number' &&
              typeof parsed.lng === 'number'
            ) {
              setLocation({
                lat: parsed.lat,
                lng: parsed.lng,
                address: parsed.address ?? '',
              });
            }
            if (parsed.countryCode) setCountryCode(String(parsed.countryCode).toUpperCase());
            await AsyncStorage.removeItem('signupDraftLocation');
          }
        } catch (err) {
          console.error('[CLINIC-LOCATION] handoff error', err);
        }
      })();
    }, [])
  );

  const handleBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/clinic/settings' as any);
  };

  const openPicker = async () => {
    try {
      await AsyncStorage.removeItem('signupDraftLocation');
    } catch {
      // ignore
    }
    pendingPickRef.current = true;
    router.push({
      pathname: '/clinic/location-picker' as any,
      params: location
        ? { lat: String(location.lat), lng: String(location.lng) }
        : {},
    });
  };

  const handleSave = async () => {
    if (saving) return;
    if (!clinicId) {
      Alert.alert("Couldn't save", 'Missing clinic session. Please reopen the page.');
      return;
    }
    if (!location?.lat || !location?.lng) {
      Alert.alert('Location Required', 'Please select your clinic location before saving.');
      return;
    }
    if (!countryCode) {
      Alert.alert('Country Required', 'Please select the clinic country before saving.');
      return;
    }
    try {
      setSaving(true);
      await setDoc(
        doc(db, 'clinics', clinicId),
        {
          countryCode: countryCode || null,
          city: city.trim() || null,
          location: location
            ? {
                lat: location.lat,
                lng: location.lng,
                address: location.address ?? '',
              }
            : null,
        },
        { merge: true }
      );
      Alert.alert('Saved', 'Your clinic location has been updated.');
    } catch (err) {
      console.error('[CLINIC-LOCATION] save error', err);
      Alert.alert("Couldn't save", 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const textPrimary = colors.textPrimary;
  const textSecondary = colors.textSecondary;
  const textMuted = colors.textTertiary;
  const cardBg = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.55)';
  const cardBorder = isDark ? 'rgba(255,255,255,0.10)' : '#EEF2F8';
  const fieldBg = isDark ? 'rgba(255,255,255,0.06)' : '#F4F7FC';
  const fieldBorder = isDark ? 'rgba(255,255,255,0.10)' : '#E6ECF6';
  const backBg = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.92)';
  const backBgPressed = isDark ? 'rgba(255,255,255,0.15)' : 'rgba(27, 37, 66, 0.1)';
  const backIconColor = isDark ? '#FFFFFF' : '#1B2542';
  const emptyBg = isDark ? 'rgba(16,185,129,0.10)' : 'rgba(16,185,129,0.06)';
  const emptyBorder = isDark ? 'rgba(16,185,129,0.30)' : 'rgba(16,185,129,0.22)';
  const mapCardBorder = isDark ? 'rgba(61,158,255,0.28)' : 'rgba(61,158,255,0.18)';

  return (
    <View style={{ flex: 1 }}>
      <Stack.Screen options={{ headerShown: false }} />
      <PremiumGradientBackground isDark={isDark} showSparkles={!isDark} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Pressable
          onPress={handleBack}
          style={({ pressed }) => [
            styles.backButton,
            { backgroundColor: pressed ? backBgPressed : backBg },
          ]}
        >
          <Ionicons name="chevron-back" size={22} color={backIconColor} />
        </Pressable>

        <View style={styles.headerText}>
          <Text style={[styles.headerTitle, { color: textPrimary }]}>
            Clinic location
          </Text>
          <Text style={[styles.headerSubtitle, { color: textSecondary }]}>
            Update your address on the map
          </Text>
        </View>

        <View
          style={[
            styles.headerPin,
            { backgroundColor: 'rgba(16,185,129,0.16)' },
          ]}
        >
          <Ionicons name="location" size={20} color={GREEN} />
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={ACCENT} />
        </View>
      ) : (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={[
              styles.scrollContent,
              { paddingBottom: insets.bottom + 32 },
            ]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Address */}
            <Text style={[styles.eyebrow, { color: textSecondary }]}>
              ADDRESS
            </Text>
            <View
              style={[
                styles.card,
                { backgroundColor: cardBg, borderColor: cardBorder },
              ]}
            >
              <View style={styles.fieldBlock}>
                <Text style={[styles.fieldLabel, { color: textSecondary }]}>
                  Country
                </Text>
                <CountrySelect
                  value={countryCode}
                  onChange={(code) => setCountryCode(code)}
                  placeholder="Select country"
                />
              </View>

              <View style={[styles.fieldBlock, { marginBottom: 0 }]}>
                <Text style={[styles.fieldLabel, { color: textSecondary }]}>
                  City
                </Text>
                <View
                  style={[
                    styles.field,
                    { backgroundColor: fieldBg, borderColor: fieldBorder },
                  ]}
                >
                  <Ionicons
                    name="location-outline"
                    size={18}
                    color={textMuted}
                    style={styles.fieldIcon}
                  />
                  <TextInput
                    value={city}
                    onChangeText={setCity}
                    placeholder="City"
                    placeholderTextColor={textMuted}
                    autoCapitalize="words"
                    autoCorrect={false}
                    style={[styles.fieldInput, { color: textPrimary }]}
                  />
                </View>
              </View>
            </View>

            {/* Map location */}
            <Text style={[styles.eyebrow, { color: textSecondary }]}>
              MAP LOCATION
            </Text>

            {location ? (
              <Pressable
                onPress={openPicker}
                style={({ pressed }) => [
                  styles.mapCard,
                  {
                    backgroundColor: cardBg,
                    borderColor: mapCardBorder,
                    opacity: pressed ? 0.92 : 1,
                  },
                ]}
              >
                <StaticMapPreview
                  lat={location.lat}
                  lng={location.lng}
                  address={location.address}
                />
                <View style={styles.mapMetaRow}>
                  <View style={styles.mapMetaTextWrap}>
                    <Text
                      style={[styles.mapAddress, { color: textPrimary }]}
                      numberOfLines={2}
                    >
                      {location.address || 'Pinned location'}
                    </Text>
                    <Text style={[styles.mapCoords, { color: textMuted }]}>
                      {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.changePill,
                      { backgroundColor: 'rgba(61,158,255,0.14)' },
                    ]}
                  >
                    <Ionicons name="create-outline" size={14} color={ACCENT} />
                    <Text style={[styles.changePillText, { color: ACCENT }]}>
                      Change
                    </Text>
                  </View>
                </View>
              </Pressable>
            ) : (
              <Pressable
                onPress={openPicker}
                style={({ pressed }) => [
                  styles.emptyCard,
                  {
                    backgroundColor: emptyBg,
                    borderColor: emptyBorder,
                    opacity: pressed ? 0.92 : 1,
                  },
                ]}
              >
                <View
                  style={[
                    styles.emptyIconTile,
                    { backgroundColor: 'rgba(16,185,129,0.18)' },
                  ]}
                >
                  <Ionicons name="map-outline" size={22} color={GREEN} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.emptyTitle, { color: textPrimary }]}>
                    No location set yet
                  </Text>
                  <Text style={[styles.emptySubtitle, { color: textSecondary }]}>
                    Tap to pin your clinic on the map
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={isDark ? '#4B5563' : '#C3CDDC'}
                />
              </Pressable>
            )}

            {/* Save button */}
            <Pressable
              onPress={handleSave}
              disabled={saving}
              style={({ pressed }) => [
                styles.primaryBtnWrap,
                {
                  transform: [{ scale: pressed && !saving ? 0.98 : 1 }],
                  opacity: saving ? 0.7 : 1,
                },
              ]}
            >
              <LinearGradient
                colors={[ACCENT, ACCENT_DARK] as any}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.primaryBtn}
              >
                {saving ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.primaryBtnText}>Save changes</Text>
                )}
              </LinearGradient>
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 21,
    fontWeight: '800',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 12.5,
  },
  headerPin: {
    width: 40,
    height: 40,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },

  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
    gap: 8,
  },

  eyebrow: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginTop: 12,
    marginBottom: 8,
  },

  card: {
    borderRadius: 22,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 10,
    elevation: 1,
  },

  fieldBlock: {
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 48,
  },
  fieldIcon: {
    marginRight: 8,
  },
  fieldInput: {
    flex: 1,
    fontSize: 14.5,
    paddingVertical: 0,
  },

  mapCard: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 12,
    elevation: 1,
  },
  mapMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 4,
    paddingTop: 4,
    paddingBottom: 2,
  },
  mapMetaTextWrap: {
    flex: 1,
  },
  mapAddress: {
    fontSize: 13.5,
    fontWeight: '700',
    lineHeight: 18,
    marginBottom: 2,
  },
  mapCoords: {
    fontSize: 11.5,
    fontWeight: '500',
  },
  changePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  changePillText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.2,
  },

  emptyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: 22,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 18,
  },
  emptyIconTile: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    marginBottom: 3,
  },
  emptySubtitle: {
    fontSize: 12.5,
    fontWeight: '500',
    lineHeight: 17,
  },

  primaryBtnWrap: {
    borderRadius: 16,
    marginTop: 18,
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 12,
    elevation: 4,
  },
  primaryBtn: {
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 15.5,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});
