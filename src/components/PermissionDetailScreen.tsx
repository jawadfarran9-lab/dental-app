import { useTheme } from '@/src/context/ThemeContext';
import { type PermissionInfo, type PermissionState, openDeviceSettings } from '@/src/hooks/useDevicePermissions';
import { Ionicons } from '@expo/vector-icons';
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

  const isGranted = perm.status === 'granted' || perm.status === 'limited';

  // === DIAGNOSTIC: log every render with full state ===
  console.warn(`[UI:${permissionName}] RENDER → status="${perm.status}" canAskAgain=${perm.canAskAgain} loading=${perm.loading} isGranted=${isGranted}`);

  useFocusEffect(
    useCallback(() => {
      console.warn(`[UI:${permissionName}] FOCUS → calling refresh()`);
      perm.refresh().catch(() => {});
    }, [perm.refresh])
  );

  // ALWAYS calls requestPermission() when not granted. No conditions.
  // OS decides whether to show native popup or return silently.
  const handleToggle = useCallback(async () => {
    if (isGranted) return;
    console.warn(`[UI:${permissionName}] TOGGLE PRESSED → calling request()`);
    try {
      const result = await perm.request();
      console.warn(`[UI:${permissionName}] request() returned → "${result}"`);
      await perm.refresh();
      console.warn(`[UI:${permissionName}] refresh() after request done`);
    } catch (e) {
      console.warn(`[UI:${permissionName}] TOGGLE ERROR:`, e);
    }
  }, [isGranted, perm.request, perm.refresh, permissionName]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {perm.loading ? (
        <ActivityIndicator size="large" color={colors.textPrimary} style={styles.loader} />
      ) : (
        <View style={styles.content}>
          {/* Icon */}
          <View style={[styles.iconCircle, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}>
            <Ionicons name={icon} size={40} color={isDark ? '#B0BEC5' : '#546E7A'} />
          </View>

          {/* Status Badge */}
          <View style={[styles.statusPill, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}>
            <View style={[styles.statusDot, { backgroundColor: statusColor(perm.status) }]} />
            <Text style={[styles.statusText, { color: statusColor(perm.status) }]}>
              {statusLabel(perm.status)}
            </Text>
          </View>

          {/* Description */}
          <Text style={[styles.description, { color: isDark ? '#8A96A6' : '#64748B' }]}>
            {description}
          </Text>

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
  content: { alignItems: 'center', paddingHorizontal: 32, paddingTop: 40 },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 16,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: { fontSize: 14, fontWeight: '600' },
  description: { fontSize: 15, lineHeight: 22, textAlign: 'center', marginBottom: 28 },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingVertical: 14,
    paddingHorizontal: 4,
    marginBottom: 16,
  },
  toggleLabel: { fontSize: 16, fontWeight: '500' },
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
