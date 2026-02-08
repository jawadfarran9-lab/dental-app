import { useAuth } from '@/src/context/AuthContext';
import { useTheme } from '@/src/context/ThemeContext';
import { getClinicBranding, updateClinicBranding } from '@/src/services/brandingService';
import { useClinicRoleGuard } from '@/src/utils/navigationGuards';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, ImageBackground, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import DentalCover from '../components/DentalCover';

export default function BrandingScreen() {
  const { colors } = useTheme();
  const { clinicId, clinicRole, memberId } = useAuth();
  const { t } = useTranslation();
  useClinicRoleGuard(['owner']);

  const [heroUrl, setHeroUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!clinicId) return;
      try {
        const branding = await getClinicBranding(clinicId);
        setHeroUrl(branding.heroImageUrl || '');
      } catch (error: any) {
        console.error('[BRANDING] load error', error);
        Alert.alert(t('common.error'), error.message || t('branding.failedToLoadBranding'));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [clinicId]);

  const handleSave = async () => {
    if (!clinicId || !clinicRole) return;
    setSaving(true);
    try {
      await updateClinicBranding({
        clinicId,
        actingRole: clinicRole,
        heroImageUrl: heroUrl.trim() || undefined,
        actorId: memberId || clinicId,
        actorName: 'Owner',
      });
      Alert.alert(t('common.success'), t('branding.brandingUpdated'));
    } catch (error: any) {
      console.error('[BRANDING] save error', error);
      Alert.alert(t('common.error'), error.message || t('branding.failedToUpdateBranding'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: 16 }}>
      <DentalCover brandingUrl={heroUrl || undefined} />

      <Text style={[styles.label, { color: colors.textPrimary }]}>{t('branding.headerImageUrl')}</Text>
      <TextInput
        placeholder={t('branding.headerImagePlaceholder')}
        value={heroUrl}
        onChangeText={setHeroUrl}
        style={[styles.input, { borderColor: colors.textSecondary, color: colors.textPrimary }]}
        autoCapitalize="none"
      />
      <Text style={[styles.helper, { color: colors.textSecondary }]}>
        {t('branding.helper')}
      </Text>

      <Text style={[styles.label, { color: colors.textPrimary, marginTop: 16 }]}>{t('branding.preview')}</Text>
      <View style={[styles.previewBox, { borderColor: colors.textSecondary }]}>
        {heroUrl ? (
          <ImageBackground source={{ uri: heroUrl }} style={styles.previewImage} imageStyle={{ borderRadius: 12 }}>
            <View style={styles.previewOverlay} />
          </ImageBackground>
        ) : (
          <Text style={{ color: colors.textSecondary }}>{t('branding.noImageSet')}</Text>
        )}
      </View>

      <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.buttonBackground }]} onPress={handleSave} disabled={saving}>
        <Text style={[styles.saveText, { color: colors.buttonText }]}>
          {saving ? t('common.loading') : t('common.save')}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 16, fontWeight: '700', marginTop: 8 },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginTop: 6,
  },
  helper: {
    fontSize: 13,
    marginTop: 4,
  },
  previewBox: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 8,
    minHeight: 140,
    marginTop: 6,
    justifyContent: 'center',
  },
  previewImage: {
    width: '100%',
    height: 140,
    justifyContent: 'flex-end',
  },
  previewOverlay: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    height: 40,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  saveBtn: {
    marginTop: 18,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveText: {
    fontSize: 16,
    fontWeight: '700',
  },
});
