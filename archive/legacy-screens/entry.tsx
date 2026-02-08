import i18n from '@/i18n';
import LanguagePicker from '@/src/components/LanguagePicker';
import { useTheme } from '@/src/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

/**
 * ARCHIVED: Legacy entry screen
 * 
 * This screen was removed from active navigation as:
 * - No inbound navigation found in the codebase
 * - Functionality migrated to newer flow via index.tsx → login/subscription routes
 * - Language switching now handled in main navigation structure
 * - Clinic setup and public clinics already available in main flow
 * 
 * Archived: 2025-12-27
 */

export default function Entry() {
  const router = useRouter();
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const [languageModalVisible, setLanguageModalVisible] = useState(false);
  const isRTL = ['ar', 'he', 'fa', 'ur'].includes(i18n.language);

  const accent = isDark ? '#D4AF37' : '#0a7ea4';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.headerRow, isRTL && { flexDirection: 'row-reverse' }]}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>{t('entry.title')}</Text>
        <TouchableOpacity
          style={[styles.languageButton, { borderColor: colors.cardBorder }]}
          onPress={() => setLanguageModalVisible(true)}
        >
          <Ionicons name="language" size={18} color={colors.textPrimary} />
          <Text style={[styles.languageText, { color: colors.textPrimary }]}>{t('entry.language')}</Text>
        </TouchableOpacity>
      </View>

      <Text style={[styles.subtitle, { color: colors.textSecondary }, isRTL && { textAlign: 'right' }]}>
        {t('entry.subtitle')}
      </Text>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.cta, { backgroundColor: colors.buttonBackground }]}
          activeOpacity={0.9}
          onPress={() => router.push('/clinic/setup' as any)}
        >
          <Ionicons name="medkit" size={22} color={colors.buttonText} />
          <Text style={[styles.ctaText, { color: colors.buttonText }]}>{t('entry.doctorClinic')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.cta, { borderColor: accent, borderWidth: 2, backgroundColor: colors.inputBackground }]}
          activeOpacity={0.9}
          onPress={() => router.push('/public/clinics' as any)}
        >
          <Ionicons name="person" size={22} color={accent} />
          <Text style={[styles.ctaText, { color: colors.textPrimary }]}>{t('entry.patient')}</Text>
        </TouchableOpacity>
      </View>

      <LanguagePicker
        visible={languageModalVisible}
        onClose={() => setLanguageModalVisible(false)}
        onLanguageChanged={() => setLanguageModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center', gap: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 24, fontWeight: '900' },
  subtitle: { fontSize: 16, fontWeight: '600', marginTop: 4 },
  languageButton: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1 },
  languageText: { fontSize: 14, fontWeight: '700' },
  actions: { gap: 12, marginTop: 12 },
  cta: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 14, paddingHorizontal: 16, borderRadius: 12 },
  ctaText: { fontSize: 16, fontWeight: '800' },
});
