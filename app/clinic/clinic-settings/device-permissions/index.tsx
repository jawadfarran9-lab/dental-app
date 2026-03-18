import { useDevicePermissionsContext } from '@/src/context/DevicePermissionsContext';
import { useTheme } from '@/src/context/ThemeContext';
import { type PermissionState } from '@/src/hooks/useDevicePermissions';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

function statusLabel(status: PermissionState): string {
  switch (status) {
    case 'granted': return 'Allowed';
    case 'limited': return 'Limited';
    case 'denied': return 'Not Allowed';
    default: return 'Not Set';
  }
}

function statusColor(status: PermissionState, isDark: boolean): string {
  if (status === 'granted') return '#22C55E';
  if (status === 'limited') return '#F59E0B';
  if (status === 'denied') return '#EF4444';
  return isDark ? '#8A96A6' : '#94A3B8';
}

export default function DevicePermissionsIndexScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const { camera, photos, location, notifications, microphone, contacts } = useDevicePermissionsContext();

  useFocusEffect(
    useCallback(() => {
      camera.refresh().catch(() => {});
      photos.refresh().catch(() => {});
      location.refresh().catch(() => {});
      notifications.refresh().catch(() => {});
      microphone.refresh().catch(() => {});
      contacts.refresh().catch(() => {});
    }, [camera.refresh, photos.refresh, location.refresh, notifications.refresh, microphone.refresh, contacts.refresh])
  );

  const permissions = [
    { key: 'camera', label: 'Camera', icon: 'camera-outline' as const, description: 'Take photos and videos', perm: camera },
    { key: 'photos', label: 'Photos', icon: 'images-outline' as const, description: 'Access photo library', perm: photos },
    { key: 'location', label: 'Location', icon: 'location-outline' as const, description: 'Distance and map features', perm: location },
    { key: 'notifications', label: 'Notifications', icon: 'notifications-outline' as const, description: 'Push notifications', perm: notifications },
    { key: 'microphone', label: 'Microphone', icon: 'mic-outline' as const, description: 'Record audio', perm: microphone },
    { key: 'contacts', label: 'Contacts', icon: 'people-outline' as const, description: 'Find people you know', perm: contacts },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.sectionHeader, { color: isDark ? '#8A96A6' : '#64748B' }]}>
          Manage what this app can access on your device
        </Text>
        {permissions.map((item, idx) => (
          <TouchableOpacity
            key={item.key}
            activeOpacity={0.7}
            onPress={() => router.push(`/clinic/clinic-settings/device-permissions/${item.key}` as any)}
            style={[
              styles.row,
              {
                borderBottomColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
                borderBottomWidth: idx < permissions.length - 1 ? StyleSheet.hairlineWidth : 0,
              },
            ]}
          >
            <Ionicons name={item.icon} size={22} color={isDark ? '#B0BEC5' : '#546E7A'} style={styles.icon} />
            <View style={styles.textWrap}>
              <Text style={[styles.label, { color: colors.textPrimary }]}>{item.label}</Text>
              <Text style={[styles.description, { color: isDark ? '#8A96A6' : '#94A3B8' }]}>{item.description}</Text>
            </View>
            {item.perm.loading ? (
              <ActivityIndicator size="small" color={isDark ? '#64748B' : '#94A3B8'} style={styles.badge} />
            ) : (
              <Text style={[styles.statusBadge, { color: statusColor(item.perm.status, isDark) }]}>
                {statusLabel(item.perm.status)}
              </Text>
            )}
            <Ionicons name="chevron-forward" size={20} color={isDark ? '#64748B' : '#94A3B8'} />
          </TouchableOpacity>
        ))}
        <Text style={[styles.footerNote, { color: isDark ? '#64748B' : '#94A3B8' }]}>
          Tap a permission to manage access. Some permissions may require opening device settings.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingVertical: 12 },
  sectionHeader: { fontSize: 13, paddingHorizontal: 20, paddingTop: 4, paddingBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, minHeight: 52 },
  icon: { marginRight: 14, width: 24, textAlign: 'center' },
  textWrap: { flex: 1, marginRight: 8 },
  label: { fontSize: 16, fontWeight: '400', marginBottom: 3 },
  description: { fontSize: 13, lineHeight: 18 },
  badge: { marginRight: 8 },
  statusBadge: { fontSize: 13, fontWeight: '500', marginRight: 8 },
  footerNote: { fontSize: 12, paddingHorizontal: 20, paddingTop: 16, lineHeight: 17 },
});
