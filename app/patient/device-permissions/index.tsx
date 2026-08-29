import { PremiumGradientBackground } from '@/src/components/PremiumGradientBackground';
import { useDevicePermissionsContext } from '@/src/context/DevicePermissionsContext';
import { useTheme, type ThemeColors } from '@/src/context/ThemeContext';
import { type PermissionState } from '@/src/hooks/useDevicePermissions';
import { Ionicons } from '@expo/vector-icons';
import { useHeaderHeight } from '@react-navigation/elements';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef } from 'react';
import { ActivityIndicator, Animated, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

function statusLabel(status: PermissionState): string {
  switch (status) {
    case 'granted': return 'Allowed';
    case 'limited': return 'Limited';
    case 'denied': return 'Not Allowed';
    default: return 'Not Set';
  }
}

function statusColor(status: PermissionState, c: ThemeColors): string {
  if (status === 'granted') return c.statusGreen;
  if (status === 'limited') return c.statusAmber;
  if (status === 'denied') return c.statusRed;
  return c.textHint;
}

const STAGGER_DELAY = 35;

function AnimatedPermRow({ item, idx, total, colors, onPress }: { item: { key: string; label: string; icon: any; description: string; perm: any }; idx: number; total: number; colors: any; onPress: () => void }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(8)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 250, delay: idx * STAGGER_DELAY, useNativeDriver: true }).start();
    Animated.timing(translateY, { toValue: 0, duration: 250, delay: idx * STAGGER_DELAY, useNativeDriver: true }).start();
  }, []);

  const onPressIn = () => { Animated.timing(scaleAnim, { toValue: 0.97, duration: 120, useNativeDriver: true }).start(); };
  const onPressOut = () => { Animated.timing(scaleAnim, { toValue: 1, duration: 120, useNativeDriver: true }).start(); };

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY }, { scale: scaleAnim }] }}>
      <Pressable
        style={({ pressed }) => [
          styles.row,
          {
            opacity: pressed ? 0.7 : 1,
            borderBottomColor: colors.borderTint,
            borderBottomWidth: idx < total - 1 ? StyleSheet.hairlineWidth : 0,
          },
        ]}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        onPress={onPress}
      >
        <Ionicons name={item.icon} size={22} color={colors.iconMuted} style={styles.icon} />
        <View style={styles.textWrap}>
          <Text style={[styles.label, { color: colors.textPrimary }]}>{item.label}</Text>
          <Text style={[styles.description, { color: colors.textHint }]}>{item.description}</Text>
        </View>
        {item.perm.loading ? (
          <ActivityIndicator size="small" color={'#5A6B7C'} style={styles.badge} />
        ) : (
          <Text style={[styles.statusBadge, { color: statusColor(item.perm.status, colors) }]}>
            {statusLabel(item.perm.status)}
          </Text>
        )}
        <Ionicons name="chevron-forward" size={20} color={'#1A2B3F'} />
      </Pressable>
    </Animated.View>
  );
}

export default function DevicePermissionsIndexScreen() {
  const { colors, isDark } = useTheme();
  const headerHeight = useHeaderHeight();
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
    <View style={[styles.container, { backgroundColor: 'transparent' }]}>
      <PremiumGradientBackground isDark={isDark} showSparkles={true} />
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: headerHeight }]}>
        <Text style={[styles.sectionHeader, { color: '#1A2B3F' }]}>
          Manage what this app can access on your device
        </Text>
        {permissions.map((item, idx) => (
          <AnimatedPermRow
            key={item.key}
            item={item}
            idx={idx}
            total={permissions.length}
            colors={colors}
            onPress={() => router.push(`/patient/device-permissions/${item.key}` as any)}
          />
        ))}
        <Text style={[styles.footerNote, { color: '#5A6B7C' }]}>
          Tap a permission to manage access. Some permissions may require opening device settings.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingVertical: 8 },
  sectionHeader: { fontSize: 12, fontWeight: '500', paddingHorizontal: 20, paddingTop: 4, paddingBottom: 14, lineHeight: 18 },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15, minHeight: 54 },
  icon: { marginRight: 16, width: 24, textAlign: 'center' },
  textWrap: { flex: 1, marginRight: 8 },
  label: { fontSize: 16, fontWeight: '500', marginBottom: 3 },
  description: { fontSize: 13, lineHeight: 19 },
  badge: { marginRight: 8 },
  statusBadge: { fontSize: 13, fontWeight: '600', marginRight: 8 },
  footerNote: { fontSize: 12, paddingHorizontal: 20, paddingTop: 20, lineHeight: 18 },
});
