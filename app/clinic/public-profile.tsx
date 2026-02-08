import { db, storage } from '@/firebaseConfig';
import i18n from '@/i18n';
import { useAuth } from '@/src/context/AuthContext';
import { useClinic } from '@/src/context/ClinicContext';
import { useTheme } from '@/src/context/ThemeContext';
import { fetchClinicPublicOwner, PublicClinic, reverseGeocode } from '@/src/services/publicClinics';
import { encodeGeohash } from '@/src/utils/geohash';
import { isProPreviewClinic } from '@/src/utils/promoTier';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { doc, setDoc } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function PublicProfileSettings() {
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();
  const isRTL = ['ar', 'he', 'fa', 'ur'].includes(i18n.language);
  const router = useRouter();
  const { clinicId } = useClinic();
  const auth = useAuth();
  const isOwner = auth?.clinicRole === 'owner';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [heroImage, setHeroImage] = useState<string | undefined>(undefined);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [lat, setLat] = useState<string>('');
  const [lng, setLng] = useState<string>('');
  const [derivedCity, setDerivedCity] = useState<string>('');
  const [derivedCountry, setDerivedCountry] = useState<string>('');
  const [isPublished, setIsPublished] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!clinicId) return;
      setLoading(true);
      const docData = await fetchClinicPublicOwner(clinicId);
      if (docData) {
        setHeroImage(docData.heroImage);
        setName(docData.name || '');
        setAddress(docData.address || '');
        setPhone(docData.phone || '');
        setWhatsapp(docData.whatsapp || '');
        if (docData.geo?.lat != null) setLat(String(docData.geo.lat));
        if (docData.geo?.lng != null) setLng(String(docData.geo.lng));
        setIsPublished(!!docData.isPublished);
        const derived = await reverseGeocode(docData.geo?.lat, docData.geo?.lng);
        setDerivedCity(derived.city || '');
        setDerivedCountry(derived.country || '');
      }
      setLoading(false);
    };
    load();
  }, [clinicId]);

  const pickHero = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7 });
    if (result.canceled) return;
    const uri = result.assets?.[0]?.uri || (result as any).uri;
    if (!uri) return;
    try {
      setSaving(true);
      const resp = await fetch(uri);
      const blob = await resp.blob();
      const storageRef = ref(storage, `public/clinics/${clinicId}/hero_${Date.now()}.jpg`);
      const uploadTask = uploadBytesResumable(storageRef, blob);
      await new Promise<void>((resolve, reject) => {
        uploadTask.on('state_changed', () => {}, reject, async () => {
          const url = await getDownloadURL(storageRef);
          setHeroImage(url);
          resolve();
        });
      });
      Alert.alert(t('common.success'), t('publicProfile.heroImageUploaded'));
    } catch (err: any) {
      Alert.alert(t('common.error'), err?.message || t('publicProfile.uploadError'));
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    if (!clinicId) return;
    if (!isOwner) { Alert.alert(t('common.error'), t('publicProfile.ownerOnly')); return; }
    if (!name.trim()) { Alert.alert(t('common.error'), t('publicProfile.nameRequired')); return; }
    const ownerUid = (auth as any)?.uid || (auth as any)?.memberId || clinicId || '';
    if (!ownerUid) { Alert.alert(t('common.error'), t('publicProfile.ownerIdMissing')); return; }
    setSaving(true);
    try {
      const numLat = lat ? Number(lat) : null;
      const numLng = lng ? Number(lng) : null;
      const derived = await reverseGeocode(numLat ?? undefined, numLng ?? undefined);
      setDerivedCity(derived.city || '');
      setDerivedCountry(derived.country || '');

      const geohash = numLat != null && numLng != null ? encodeGeohash(numLat, numLng, 7) : undefined;

      const payload: PublicClinic = {
        id: clinicId,
        clinicId,
        ownerId: ownerUid,
        name: name.trim(),
        address: address.trim() || undefined,
        phone: phone.trim() || undefined,
        whatsapp: whatsapp.trim() || undefined,
        heroImage: heroImage || undefined,
        geo: numLat != null && numLng != null ? { lat: numLat, lng: numLng } : undefined,
        geohash,
        isPublished,
        country: derived.country || '',
        city: derived.city || '',
      } as any;

      const refDoc = doc(db, 'clinics_public', clinicId);
      await setDoc(refDoc, payload, { merge: true });
      Alert.alert(t('common.success'), t('publicProfile.saveSuccess'));
    } catch (err: any) {
      Alert.alert(t('common.error'), err?.message || t('publicProfile.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}><ActivityIndicator /></View>
    );
  }

  if (!isOwner) {
    return (
      <View style={styles.center}>
        <Text style={{ fontWeight: '700' }}>{t('publicProfile.ownerOnly')}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={{ padding: 16 }}>
      <Text style={[styles.title, { color: colors.textPrimary }]}>{t('publicProfile.title')}</Text>
      <Text style={styles.muted}>{t('publicProfile.description')}</Text>

      <View style={[styles.proTeaser, { backgroundColor: isDark ? '#1a1513' : '#fef9c3', borderColor: '#D4AF37' }]}>
        <View style={styles.proTeaserIcon}>
          <Ionicons name="star" size={20} color="#D4AF37" />
        </View>
        <View style={styles.proTeaserText}>
            <Text style={[styles.proTeaserTitle, { color: isDark ? '#D4AF37' : '#92400e' }]}>
              {t('publicProfile.proTeaser')}
            </Text>
            <Text style={[styles.proTeaserSubtitle, { color: isDark ? '#d4af37cc' : '#92400e' }]}>
              {t('publicProfile.proTeaserHint')}
            </Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/clinic/upgrade' as any)}>
            <Text style={styles.proTeaserLink}>{t('publicProfile.learnMore')}</Text>
        </TouchableOpacity>
      </View>

      {/* G4: Pro Readiness Card */}
      {(() => {
        const hasHero = !!heroImage;
        const hasPhone = !!phone?.trim();
        const hasAddress = !!address?.trim();
        const hasWhatsApp = !!whatsapp?.trim();
        const completed = [hasHero, hasPhone, hasAddress].filter(Boolean).length;
        const total = 3;
        const progress = Math.round((completed / total) * 100);
        const isReady = hasHero && hasPhone && hasAddress;
        const previewClinic = { heroImage, phone, address, whatsapp } as PublicClinic;
        const proPreview = isProPreviewClinic(previewClinic);

        return (
          <View style={[styles.readinessCard, { backgroundColor: isDark ? '#1f1f23' : '#f8fafc', borderColor: isDark ? '#2d2d32' : '#e5e7eb' }]}>
            <View style={styles.readinessHeader}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.readinessTitle, { color: colors.textPrimary }]}>
                  {t('publicProfile.proReadiness')}
                </Text>
                <Text style={[styles.readinessStatus, { color: isReady ? '#10b981' : '#f59e0b' }]}>
                  {isReady ? t('publicProfile.ready') : t('publicProfile.notReady')}
                </Text>
              </View>
              <View style={styles.previewCircle}>
                <View style={[styles.previewCircleInner, proPreview && styles.previewCircleInnerPro]}>
                  {heroImage ? (
                    <Image source={{ uri: heroImage }} style={styles.previewCircleImage} />
                  ) : (
                    <View style={styles.previewCirclePlaceholder} />
                  )}
                </View>
                {proPreview && (
                  <View style={styles.previewBadge}>
                    <Text style={styles.previewBadgeText}>PRO</Text>
                  </View>
                )}
              </View>
            </View>

            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${progress}%`, backgroundColor: isReady ? '#10b981' : '#f59e0b' }]} />
            </View>
            <Text style={[styles.progressText, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
              {progress}% {t('publicProfile.complete')}
            </Text>

            <View style={styles.checklistItems}>
              <View style={styles.checklistItem}>
                <Ionicons name={hasHero ? 'checkmark-circle' : 'ellipse-outline'} size={20} color={hasHero ? '#10b981' : '#9ca3af'} />
                <Text style={[styles.checklistText, { color: colors.textPrimary }]}>
                  {t('publicProfile.heroImage')}
                </Text>
              </View>
              <View style={styles.checklistItem}>
                <Ionicons name={hasPhone ? 'checkmark-circle' : 'ellipse-outline'} size={20} color={hasPhone ? '#10b981' : '#9ca3af'} />
                <Text style={[styles.checklistText, { color: colors.textPrimary }]}>
                  {t('publicProfile.phoneNumber')}
                </Text>
              </View>
              <View style={styles.checklistItem}>
                <Ionicons name={hasAddress ? 'checkmark-circle' : 'ellipse-outline'} size={20} color={hasAddress ? '#10b981' : '#9ca3af'} />
                <Text style={[styles.checklistText, { color: colors.textPrimary }]}>
                  {t('publicProfile.addressField')}
                </Text>
              </View>
              <View style={styles.checklistItem}>
                <Ionicons name={hasWhatsApp ? 'checkmark-circle' : 'ellipse-outline'} size={20} color={hasWhatsApp ? '#10b981' : '#9ca3af'} />
                <Text style={[styles.checklistText, { color: colors.textPrimary }]}>
                  {t('publicProfile.whatsapp')} <Text style={{ fontSize: 11, color: '#9ca3af' }}>({t('common.optional')})</Text>
                </Text>
              </View>
            </View>

            <View style={styles.readinessCtaRow}>
              {!isReady && (
                <TouchableOpacity
                  style={[styles.readinessBtn, { backgroundColor: '#2563eb', flex: 1, marginRight: 8 }]}
                  onPress={() => {
                    // Scroll to first incomplete field (simulated—just show alert)
                    if (!hasHero) Alert.alert(t('publicProfile.uploadHero'), t('publicProfile.uploadHeroHint'));
                    else if (!hasPhone) Alert.alert(t('publicProfile.addPhone'), t('publicProfile.addPhoneHint'));
                    else if (!hasAddress) Alert.alert(t('publicProfile.addAddress'), t('publicProfile.addAddressHint'));
                  }}
                >
                  <Text style={styles.readinessBtnText}>{t('publicProfile.completeProfile')}</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.readinessBtn, { backgroundColor: '#D4AF37', flex: isReady ? 1 : 0.5 }]}
                onPress={() => router.push('/clinic/upgrade' as any)}
              >
                <Text style={[styles.readinessBtnText, { color: '#1a1513' }]}>
                  {t('publicProfile.upgradePro')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      })()}

      <TouchableOpacity style={styles.hero} onPress={pickHero}>
        {heroImage ? (
          <Image source={{ uri: heroImage }} style={styles.heroImg} />
        ) : (
          <View style={[styles.heroImg, styles.heroPlaceholder]}>
            <Text style={styles.muted}>{t('publicProfile.uploadHeroPlaceholder')}</Text>
          </View>
        )}
      </TouchableOpacity>

      <Text style={styles.label}>{t('publicProfile.clinicName')}</Text>
      <TextInput
        value={name}
        onChangeText={setName}
        placeholder={t('publicProfile.clinicNamePlaceholder')}
        style={[styles.input, isRTL && { textAlign: 'right', writingDirection: 'rtl' }]}
      />

      <Text style={styles.label}>{t('publicProfile.addressField')}</Text>
      <TextInput
        value={address}
        onChangeText={setAddress}
        placeholder={t('publicProfile.addressPlaceholder')}
        style={[styles.input, isRTL && { textAlign: 'right', writingDirection: 'rtl' }]}
      />

      <Text style={styles.label}>{t('publicProfile.phoneLabel')}</Text>
      <TextInput
        value={phone}
        onChangeText={setPhone}
        placeholder={t('publicProfile.phonePlaceholder')}
        keyboardType="phone-pad"
        style={[styles.input, isRTL && { textAlign: 'right', writingDirection: 'rtl' }]}
      />

      <Text style={styles.label}>{t('publicProfile.whatsapp')}</Text>
      <TextInput
        value={whatsapp}
        onChangeText={setWhatsapp}
        placeholder={t('publicProfile.whatsappPlaceholder')}
        keyboardType="phone-pad"
        style={[styles.input, isRTL && { textAlign: 'right', writingDirection: 'rtl' }]}
      />

      <Text style={styles.label}>{t('publicProfile.mapLocation')}</Text>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <TextInput
          value={lat}
          onChangeText={setLat}
          placeholder={t('publicProfile.latitudePlaceholder')}
          keyboardType="numeric"
          style={[styles.input, { flex: 1 }, isRTL && { textAlign: 'right', writingDirection: 'rtl' }]}
        />
        <TextInput
          value={lng}
          onChangeText={setLng}
          placeholder={t('publicProfile.longitudePlaceholder')}
          keyboardType="numeric"
          style={[styles.input, { flex: 1 }, isRTL && { textAlign: 'right', writingDirection: 'rtl' }]}
        />
      </View>
      <Text style={styles.muted}>{t('publicProfile.geoHint')}</Text>
      {derivedCity || derivedCountry ? (
        <Text style={styles.derived}>{[derivedCity, derivedCountry].filter(Boolean).join(', ')}</Text>
      ) : null}

      <View style={styles.publishRow}>
        <Text style={[styles.label, { marginBottom: 0 }]}>{t('publicProfile.publish')}</Text>
        <Switch value={isPublished} onValueChange={setIsPublished} trackColor={{ true: '#1B3C73' }} />
      </View>

      <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.7 }]} disabled={saving} onPress={handleSave}>
      <Text style={styles.saveText}>{saving ? t('common.loading') : t('common.save')}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: '800', marginBottom: 4 },
  muted: { color: '#6b7280', marginBottom: 8 },
  proTeaser: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, borderWidth: 2, marginBottom: 16 },
  proTeaserIcon: { marginRight: 10 },
  proTeaserText: { flex: 1 },
  proTeaserTitle: { fontSize: 14, fontWeight: '700' },
  proTeaserSubtitle: { fontSize: 12, marginTop: 2 },
  proTeaserLink: { color: '#2563eb', fontWeight: '800', fontSize: 13 },
  readinessCard: { borderRadius: 14, borderWidth: 1, padding: 16, marginBottom: 16 },
  readinessHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 },
  readinessTitle: { fontSize: 18, fontWeight: '800' },
  readinessStatus: { fontSize: 14, fontWeight: '700', marginTop: 4 },
  previewCircle: { width: 64, height: 64, position: 'relative' },
  previewCircleInner: { width: 64, height: 64, borderRadius: 32, padding: 3, backgroundColor: '#D4AF37' },
  previewCircleInnerPro: { backgroundColor: '#1a1513', borderWidth: 2, borderColor: '#D4AF37' },
  previewCircleImage: { width: '100%', height: '100%', borderRadius: 32 },
  previewCirclePlaceholder: { width: '100%', height: '100%', borderRadius: 32, backgroundColor: '#e5e7eb' },
  previewBadge: { position: 'absolute', bottom: -4, right: -4, backgroundColor: '#D4AF37', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, borderWidth: 1, borderColor: '#1a1513' },
  previewBadgeText: { color: '#1a1513', fontWeight: '800', fontSize: 8, letterSpacing: 0.5 },
  progressBarBg: { height: 8, backgroundColor: '#e5e7eb', borderRadius: 4, overflow: 'hidden', marginBottom: 6 },
  progressBarFill: { height: '100%', borderRadius: 4 },
  progressText: { fontSize: 12, fontWeight: '600', marginBottom: 12 },
  checklistItems: { marginBottom: 12 },
  checklistItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  checklistText: { fontSize: 14, fontWeight: '600', marginLeft: 10 },
  readinessCtaRow: { flexDirection: 'row', marginTop: 4 },
  readinessBtn: { paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  readinessBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  hero: { marginVertical: 12 },
  heroImg: { width: '100%', height: 180, borderRadius: 12 },
  heroPlaceholder: { backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center' },
  label: { fontWeight: '700', marginTop: 12, marginBottom: 4 },
  input: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, padding: 10, backgroundColor: '#fff' },
  derived: { color: '#111827', fontWeight: '700', marginTop: 6 },
  publishRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 },
  saveBtn: { backgroundColor: '#D4AF37', paddingVertical: 12, borderRadius: 10, alignItems: 'center', marginTop: 16 },
  saveText: { color: '#000', fontWeight: '800' },
});
