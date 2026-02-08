import { useAuth } from '@/src/context/AuthContext';
import { useTheme } from '@/src/context/ThemeContext';
import { getTrial } from '@/src/services/trialService';
import { getUsagePercentage, isNearLimit, recalculateUsageStats } from '@/src/services/usageService';
import { SOFT_LIMIT_MESSAGES, SOFT_LIMIT_PATIENTS, SOFT_LIMIT_SESSIONS, TrialStatus, UsageStats } from '@/src/types/trial';
import { useClinicRoleGuard } from '@/src/utils/navigationGuards';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

/**
 * PHASE AA-2: Owner Usage Dashboard
 * - Trial status (days remaining, active/expired)
 * - Usage statistics (patients, sessions, messages)
 * - Soft limit warnings (UI only, no blocking)
 * - Owner-only visibility
 */
export default function UsageScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const { userId } = useAuth();

  // Guard: Owner-only
  useClinicRoleGuard(['owner']);

  const [trial, setTrial] = useState<TrialStatus | null>(null);
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const clinicId = await AsyncStorage.getItem('clinicId');
      if (!clinicId) return;

      setLoading(true);

      // Get trial status
      const trialData = await getTrial(clinicId);
      setTrial(trialData);

      // Recalculate and get usage stats
      const statsData = await recalculateUsageStats(clinicId);
      setStats(statsData);

      setLoading(false);
    } catch (err) {
      console.error('[USAGE SCREEN] Load error', err);
      Alert.alert(t('common.error'), t('common.loadError'));
      setLoading(false);
    }
  };

  const formatDate = (timestamp: number | undefined) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleDateString();
  };

  const getTrialStatusColor = () => {
    if (!trial) return colors.textSecondary;
    if (trial.trialDaysRemaining && trial.trialDaysRemaining <= 7) return '#ef4444'; // red
    if (trial.trialDaysRemaining && trial.trialDaysRemaining <= 14) return '#f97316'; // orange
    return '#10b981'; // green
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.accentBlue} />
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Back Button */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>{t('usage.title')}</Text>
        <TouchableOpacity onPress={loadData}>
          <Ionicons name="refresh" size={24} color={colors.accentBlue} />
        </TouchableOpacity>
      </View>

      {/* Trial Status Card */}
      {trial && (
        <View style={[styles.card, { backgroundColor: isDark ? '#1a1a1a' : '#f9fafb', borderColor: getTrialStatusColor() }]}>
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>{t('usage.trialStatus')}</Text>
          <View style={styles.trialContent}>
            <View style={styles.trialItem}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>{t('usage.status')}</Text>
              <Text style={[styles.value, { color: trial.trialActive ? '#10b981' : '#ef4444' }]}>
                {trial.trialActive ? t('usage.active') : t('usage.expired')}
              </Text>
            </View>
            {trial.trialActive && trial.trialDaysRemaining !== undefined && (
              <View style={styles.trialItem}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>{t('usage.daysRemaining')}</Text>
                <Text style={[styles.value, { color: getTrialStatusColor() }]}>
                  {trial.trialDaysRemaining} {t('usage.days')}
                </Text>
              </View>
            )}
            {trial.trialStartedAt && (
              <View style={styles.trialItem}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>{t('usage.startedAt')}</Text>
                <Text style={[styles.value, { color: colors.textPrimary }]}>{formatDate(trial.trialStartedAt)}</Text>
              </View>
            )}
            {trial.trialEndsAt && (
              <View style={styles.trialItem}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>{t('usage.endsAt')}</Text>
                <Text style={[styles.value, { color: colors.textPrimary }]}>{formatDate(trial.trialEndsAt)}</Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Usage Stats Card */}
      {stats && (
        <View style={[styles.card, { backgroundColor: isDark ? '#1a1a1a' : '#f9fafb' }]}>
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>{t('usage.usageStatistics')}</Text>

          {/* Patients */}
          <UsageItem
            label={t('usage.patients')}
            current={stats.patientsCount}
            limit={SOFT_LIMIT_PATIENTS}
            colors={colors}
            isDark={isDark}
          />

          {/* Sessions */}
          <UsageItem
            label={t('usage.sessions')}
            current={stats.sessionsCount}
            limit={SOFT_LIMIT_SESSIONS}
            colors={colors}
            isDark={isDark}
          />

          {/* Messages */}
          <UsageItem
            label={t('usage.messages')}
            current={stats.messagesCount}
            limit={SOFT_LIMIT_MESSAGES}
            colors={colors}
            isDark={isDark}
          />

          <Text style={[styles.lastUpdated, { color: colors.textSecondary }]}>
            {t('usage.lastUpdated')}: {formatDate(stats.lastUpdatedAt)}
          </Text>
        </View>
      )}

      {/* Soft Limits Info */}
      <View style={[styles.infoCard, { backgroundColor: isDark ? '#fef3c7' : '#fef08a' }]}>
        <Ionicons name="information-circle" size={20} color="#92400e" />
        <Text style={[styles.infoText, { color: '#92400e' }]}>
          {t('usage.softLimitsInfo')}
        </Text>
      </View>
    </ScrollView>
  );
}

function UsageItem({
  label,
  current,
  limit,
  colors,
  isDark,
}: {
  label: string;
  current: number;
  limit: number;
  colors: any;
  isDark: boolean;
}) {
  const percentage = getUsagePercentage(current, limit);
  const isWarning = isNearLimit(current, limit);
  const warningColor = isWarning ? '#f97316' : '#10b981';

  return (
    <View style={styles.usageItem}>
      <View style={styles.usageHeader}>
        <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
        <Text style={[styles.count, { color: isWarning ? '#f97316' : colors.textPrimary }]}>
          {current} / {limit}
        </Text>
      </View>
      <View style={[styles.progressBar, { backgroundColor: isDark ? '#333' : '#e5e7eb' }]}>
        <View
          style={[styles.progressFill, { width: `${Math.min(percentage, 100)}%`, backgroundColor: warningColor }]}
        />
      </View>
      {isWarning && (
        <Text style={[styles.warningText, { color: '#f97316' }]}>
          {percentage}% of soft limit
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 20,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  trialContent: {
    gap: 12,
  },
  trialItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
  },
  value: {
    fontSize: 14,
    fontWeight: '700',
  },
  usageItem: {
    marginBottom: 16,
  },
  usageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  count: {
    fontSize: 14,
    fontWeight: '600',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  warningText: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
  lastUpdated: {
    fontSize: 12,
    marginTop: 12,
    textAlign: 'center',
  },
  infoCard: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 8,
    marginVertical: 16,
    gap: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
  },
});
