import { useTheme } from '@/src/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

/**
 * DENTAL CLINIC HOME PAGE
 * 
 * Main dashboard for dental clinics
 * Features: Patients, Appointments, Treatment Plans, X-Ray Analysis
 */
export default function DentalHome() {
  const router = useRouter();
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.cardBorder }]}>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
          🦷 {t('clinic.dentalClinic', 'عيادة أسنان')}
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
        <View style={[styles.welcomeCard, { backgroundColor: isDark ? 'rgba(59,130,246,0.1)' : 'rgba(59,130,246,0.05)', borderColor: '#3b82f6' }]}>
          <Text style={styles.welcomeEmoji}>🦷</Text>
          <Text style={[styles.welcomeTitle, { color: colors.textPrimary }]}>
            {t('clinic.welcomeDental', 'مرحباً بك في عيادة الأسنان')}
          </Text>
          <Text style={[styles.welcomeSubtitle, { color: colors.textSecondary }]}>
            {t('clinic.dentalDescription', 'إدارة المرضى، المواعيد، تحليل الأشعة السينية والمزيد')}
          </Text>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsGrid}>
          <TouchableOpacity 
            style={[styles.actionCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
            onPress={() => router.push('/clinic/patients' as any)}
          >
            <Ionicons name="people" size={32} color="#3b82f6" />
            <Text style={[styles.actionLabel, { color: colors.textPrimary }]}>
              {t('clinic.patients', 'المرضى')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
            onPress={() => router.push('/clinic/dashboard' as any)}
          >
            <Ionicons name="grid" size={32} color="#10b981" />
            <Text style={[styles.actionLabel, { color: colors.textPrimary }]}>
              {t('clinic.dashboard', 'لوحة التحكم')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
            onPress={() => router.push('/clinic/ai' as any)}
          >
            <Ionicons name="sparkles" size={32} color="#8b5cf6" />
            <Text style={[styles.actionLabel, { color: colors.textPrimary }]}>
              {t('clinic.aiAssistant', 'مساعد AI')}
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
