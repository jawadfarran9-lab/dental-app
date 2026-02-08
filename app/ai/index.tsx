import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/src/context/ThemeContext';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n';
import { useRouter } from 'expo-router';

export default function AIAssistantScreen() {
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const isRTL = ['ar', 'he', 'fa', 'ur'].includes(i18n.language);

  const accent = isDark ? '#D4AF37' : '#0a7ea4';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}> 
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name={isRTL ? 'arrow-forward' : 'arrow-back'} size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={[styles.badge, { borderColor: accent }] }>
          <Ionicons name="sparkles" size={14} color={accent} />
          <Text style={[styles.badgeText, { color: accent }]}>{t('aiAssistant.proPlusBadge')}</Text>
        </View>
      </View>

      <View style={styles.illustration}>
        <Ionicons name="sparkles" size={88} color={accent} />
      </View>

      <Text style={[styles.title, { color: colors.textPrimary }, isRTL && { textAlign: 'right' }]}>
        {t('aiAssistant.title')}
      </Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }, isRTL && { textAlign: 'right' }]}>
        {t('aiAssistant.comingSoon')}
      </Text>

      <View style={[styles.card, { borderColor: colors.cardBorder, backgroundColor: colors.inputBackground }] }>
        <Ionicons name="information-circle" size={18} color={accent} />
        <Text style={[styles.disclaimer, { color: colors.textSecondary }, isRTL && { textAlign: 'right' }]}>
          {t('aiAssistant.disclaimer')}
        </Text>
      </View>

      <View style={styles.ctaRow}>
        <TouchableOpacity disabled style={[styles.cta, { borderColor: accent }] }>
          <Text style={[styles.ctaText, { color: accent }]}>
            {t('aiAssistant.comingSoon')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 14, borderWidth: 1 },
  badgeText: { fontSize: 12, fontWeight: '800', letterSpacing: 0.3 },
  illustration: { marginTop: 40, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 26, fontWeight: '900', marginTop: 18, textAlign: 'center' },
  subtitle: { fontSize: 16, fontWeight: '700', marginTop: 6, textAlign: 'center' },
  card: { marginTop: 24, flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 12, borderRadius: 12, borderWidth: 1 },
  disclaimer: { flex: 1, fontSize: 13, fontWeight: '600', lineHeight: 20 },
  ctaRow: { marginTop: 24, alignItems: 'center' },
  cta: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, borderWidth: 1 },
  ctaText: { fontWeight: '800' },
});
