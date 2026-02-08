import { useTheme } from '@/src/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

/**
 * BEAUTY CLINIC HOME PAGE
 * 
 * Main dashboard for beauty/cosmetic clinics
 * Features: Clients, Treatments, Skincare Analysis, Appointments
 */
export default function BeautyHome() {
  const router = useRouter();
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.cardBorder }]}>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
          💄 {t('clinic.beautyClinic', 'عيادة تجميل')}
        </Text>
        <TouchableOpacity 
          style={styles.settingsButton}
          onPress={() => router.push('/clinic/settings' as any)}
        >
          <Ionicons name="settings-outline" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        <View style={[styles.welcomeCard, { backgroundColor: isDark ? 'rgba(236,72,153,0.1)' : 'rgba(236,72,153,0.05)', borderColor: '#ec4899' }]}>
          <Text style={styles.welcomeEmoji}>💄</Text>
          <Text style={[styles.welcomeTitle, { color: colors.textPrimary }]}>
            {t('clinic.welcomeBeauty', 'مرحباً بك في عيادة التجميل')}
          </Text>
          <Text style={[styles.welcomeSubtitle, { color: colors.textSecondary }]}>
            {t('clinic.beautyDescription', 'إدارة العملاء، العلاجات التجميلية، تحليل البشرة والمزيد')}
          </Text>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsGrid}>
          <TouchableOpacity 
            style={[styles.actionCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
            onPress={() => router.push('/clinic/patients' as any)}
          >
            <Ionicons name="people" size={32} color="#ec4899" />
            <Text style={[styles.actionLabel, { color: colors.textPrimary }]}>
              {t('clinic.clients', 'العملاء')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
            onPress={() => router.push('/clinic/dashboard' as any)}
          >
            <Ionicons name="grid" size={32} color="#f472b6" />
            <Text style={[styles.actionLabel, { color: colors.textPrimary }]}>
              {t('clinic.dashboard', 'لوحة التحكم')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
            onPress={() => router.push('/clinic/ai' as any)}
          >
            <Ionicons name="sparkles" size={32} color="#a855f7" />
            <Text style={[styles.actionLabel, { color: colors.textPrimary }]}>
              {t('clinic.skinAnalysis', 'تحليل البشرة')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
            onPress={() => router.push('/clinic/settings' as any)}
          >
            <Ionicons name="settings" size={32} color="#6b7280" />
            <Text style={[styles.actionLabel, { color: colors.textPrimary }]}>
              {t('clinic.settings', 'الإعدادات')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
  },
  settingsButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  welcomeCard: {
    borderRadius: 16,
    borderWidth: 2,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
  },
  welcomeEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  actionCard: {
    width: '48%',
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});
