import PremiumGradientBackground from '@/src/components/PremiumGradientBackground';
import { useTheme } from '@/src/context/ThemeContext';
import { type PermissionInfo, type PermissionState, openDeviceSettings } from '@/src/hooks/useDevicePermissions';
import { Ionicons } from '@expo/vector-icons';
import { useHeaderHeight } from '@react-navigation/elements';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Switch, Text, View } from 'react-native';

interface Props {
  icon: keyof typeof Ionicons.glyphMap;
  permissionName: string;
  description: string;
  perm: PermissionInfo;
}

function statusLabel(status: PermissionState): string {
  switch (status) {
    case 'granted': return 'Allowed';
    case 'limited': return 'Limited';
    case 'denied': return 'Not Allowed';
    default: return 'Not Set';
  }
}

function statusColor(status: PermissionState): string {
  if (status === 'granted') return '#22C55E';
  if (status === 'limited') return '#F59E0B';
  if (status === 'denied') return '#EF4444';
  return '#94A3B8';
}

export default function PermissionDetailScreen({ icon, permissionName, description, perm }: Props) {
  const { colors, isDark } = useTheme();
  const headerHeight = useHeaderHeight();

  const isGranted = perm.status === 'granted' || perm.status === 'limited';

  useFocusEffect(
    useCallback(() => {
      perm.refresh().catch(() => {});
    }, [perm.refresh])
  );

  const handleToggle = useCallback(async () => {
    if (isGranted) return;
    try {
      await perm.request();
      await perm.refresh();
    } catch (_) {
      // Permission request failed silently
    }
  }, [isGranted, perm.request, perm.refresh]);

  return (
    <View style={[styles.container, { backgroundColor: 'transparent' }]}>
      <PremiumGradientBackground isDark={isDark} showSparkles={true} />
      {perm.loading ? (
        <ActivityIndicator size="large" color={colors.textPrimary} style={[styles.loader, { marginTop: headerHeight + 20 }]} />
      ) : (
        <View style={[styles.content, { paddingTop: headerHeight + 20 }]}>
          {/* Icon */}
          <View style={[styles.iconCircle, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.25)', shadowColor: '#3D9EFF' }]}>
            <Ionicons name={icon} size={40} color={isDark ? '#B0BEC5' : '#546E7A'} />
          </View>

          {/* Status Badge */}
          <View style={[styles.statusPill, { backgroundColor: perm.status === 'granted' ? 'rgba(34,197,94,0.15)' : perm.status === 'limited' ? 'rgba(245,158,11,0.15)' : perm.status === 'denied' ? 'rgba(239,68,68,0.15)' : isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}>
            <View style={[styles.statusDot, { backgroundColor: statusColor(perm.status) }]} />
            <Text style={[styles.statusText, { color: statusColor(perm.status) }]}>
              {statusLabel(perm.status)}
            </Text>
          </View>

          {/* Description */}
          <Text style={[styles.description, { color: isDark ? '#8A96A6' : '#64748B', opacity: 0.9 }]}>
            {description}
          </Text>

          <View style={[styles.switchContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.25)' }]}>
          <View style={styles.toggleRow}>
            <Text style={[styles.toggleLabel, { color: colors.textPrimary }]}>
              {permissionName} Access
            </Text>
            <Switch
              value={isGranted}
              onValueChange={handleToggle}
              disabled={isGranted}
              trackColor={{ false: isDark ? '#3A3A3C' : '#E2E8F0', true: Platform.OS === 'ios' ? '#34C759' : '#22C55E' }}
              thumbColor={Platform.OS === 'android' ? (isGranted ? '#22C55E' : '#F4F3F4') : undefined}
            />
          </View>
          </View>

          {/* Hint text */}
          <Text style={[styles.hint, { color: isDark ? '#64748B' : '#94A3B8' }]}>
            {isGranted
              ? `${permissionName} access is enabled.`
              : !perm.canAskAgain
                ? `${permissionName} access was denied. You can also enable it in your device settings.`
                : `Toggle on to allow ${permissionName.toLowerCase()} access.`}
          </Text>

          {/* Open Settings — available when OS won't show native popup */}
          {!isGranted && !perm.canAskAgain && (
            <Pressable
              style={[styles.settingsButton, { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' }]}
              onPress={openDeviceSettings}
            >
              <Ionicons name="settings-outline" size={18} color={isDark ? '#93C5FD' : '#3B82F6'} style={{ marginRight: 8 }} />
              <Text style={[styles.settingsButtonText, { color: isDark ? '#93C5FD' : '#3B82F6' }]}>
                Open Device Settings
              </Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loader: { marginTop: 60 },
  content: { alignItems: 'center', paddingHorizontal: 20, gap: 20 },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    padding: 18,
    marginTop: 20,
    marginBottom: 10,
    shadowOpacity: 0.15,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 16,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: { fontSize: 14, fontWeight: '600' },
  description: { fontSize: 15, lineHeight: 22, textAlign: 'center', paddingHorizontal: 10, marginBottom: 28 },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingVertical: 10,
    paddingHorizontal: 4,
    marginTop: 10,
    marginBottom: 16,
  },
  toggleLabel: { fontSize: 16, fontWeight: '500' },
  switchContainer: {
    marginTop: 20,
    padding: 16,
    borderRadius: 16,
    width: '100%',
  },
  hint: { fontSize: 13, lineHeight: 18, textAlign: 'center', paddingHorizontal: 12 },
  settingsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginTop: 20,
  },
  settingsButtonText: { fontSize: 15, fontWeight: '600' },
});
