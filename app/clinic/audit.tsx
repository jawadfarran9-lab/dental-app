import { useAuth } from '@/src/context/AuthContext';
import { useTheme } from '@/src/context/ThemeContext';
import { fetchRecentAuditLogs } from '@/src/services/auditLogService';
import type { AuditLogEntry } from '@/src/types/auditLog';
import { useClinicRoleGuard } from '@/src/utils/navigationGuards';
import { localizeDate } from '@/utils/localization';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    ActivityIndicator,
    FlatList,
    StyleSheet,
    Text,
    View
} from 'react-native';

function actionLabel(action: string) {
  switch (action) {
    case 'INVITE_CREATED':
      return 'Invited';
    case 'INVITE_ACCEPTED':
      return 'Accepted invite';
    case 'INVITE_REVOKED':
      return 'Revoked invite';
    case 'ROLE_CHANGED':
      return 'Changed role';
    case 'MEMBER_STATUS_CHANGED':
      return 'Changed status';
    case 'MEMBER_REMOVED':  // PHASE T
      return 'Removed member';
    case 'BRANDING_UPDATED':  // PHASE X
      return 'Updated branding';
    case 'CHECKOUT_PLACEHOLDER_CONFIRMED':  // PHASE X
      return 'Checkout placeholder confirmed';
    case 'EMAIL_TEMPLATE_SENT':  // PHASE X
      return 'Email template prepared';
    case 'SESSION_EDITED':  // PHASE U
      return 'Edited session';
    case 'LOGIN':
      return 'Logged in';
    case 'LOGIN_BLOCKED':
      return 'Login blocked';
    case 'SESSION_INVALIDATED':
      return 'Session invalidated';
    case 'IMPERSONATION_PREVENTED':
      return 'Impersonation prevented';
    case 'PLAN_SELECTED':
      return 'Selected subscription plan';
    case 'TRIAL_STARTED':
      return 'Trial started';
    case 'TRIAL_EXPIRED':
      return 'Trial expired';
    case 'USAGE_LIMIT_WARNING':
      return 'Usage limit warning';
    default:
      return action;
  }
}

export default function AuditLogScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { clinicId } = useAuth();

  useClinicRoleGuard(['owner']);

  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const styles = React.useMemo(() =>
    StyleSheet.create({
      container: { flex: 1 },
      title: { fontSize: 24, fontWeight: '700', paddingHorizontal: 16, paddingTop: 16, marginBottom: 4 },
      subtitle: { fontSize: 14, paddingHorizontal: 16, marginBottom: 16 },
      card: { borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 12 },
      header: { flexDirection: 'row', justifyContent: 'space-between' },
      action: { fontSize: 16, fontWeight: '700' },
      actor: { fontSize: 13, marginTop: 2 },
      target: { fontSize: 13, marginTop: 2 },
      time: { fontSize: 12, textAlign: 'right' },
      details: { marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.cardBorder },
      detail: { fontSize: 12, marginTop: 4 },
      empty: { textAlign: 'center', marginTop: 24 },
    }),
    [colors]
  );

  const loadLogs = async () => {
    if (!clinicId) return;
    setLoading(true);
    try {
      const data = await fetchRecentAuditLogs(clinicId, 50);
      setLogs(data);
    } catch (error: any) {
      console.error('[AUDIT] Load error', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [clinicId]);

  const renderLog = ({ item }: { item: AuditLogEntry }) => (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.action, { color: colors.textPrimary }]}>{actionLabel(item.action)}</Text>
          {item.actorName && (
            <Text style={[styles.actor, { color: colors.textSecondary }]}>
              by {item.actorName}
            </Text>
          )}
          {item.targetName && (
            <Text style={[styles.target, { color: colors.textSecondary }]}>
              {item.targetName}
            </Text>
          )}
        </View>
        <Text style={[styles.time, { color: colors.textSecondary }]}>
          {item.createdAt ? localizeDate(item.createdAt, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
        </Text>
      </View>
      {item.details && Object.keys(item.details).length > 0 && (
        <View style={styles.details}>
          {Object.entries(item.details).map(([key, val]) => (
            <Text key={key} style={[styles.detail, { color: colors.textSecondary }]}>
              {key}: {String(val)}
            </Text>
          ))}
        </View>
      )}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.textPrimary }]}>{t('audit.title')}</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{t('audit.subtitle')}</Text>

      {loading ? (
        <ActivityIndicator size="large" style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={logs}
          keyExtractor={(item) => item.id || Math.random().toString()}
          renderItem={renderLog}
          ListEmptyComponent={<Text style={[styles.empty, { color: colors.textSecondary }]}>{t('audit.noLogs')}</Text>}
          scrollEnabled={true}
          contentContainerStyle={{ padding: 16 }}
        />
      )}
    </View>
  );
}
