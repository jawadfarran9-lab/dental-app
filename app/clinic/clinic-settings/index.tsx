import { useTheme } from '@/src/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

type MenuItem = {
  key: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: string;
};

const MENU_ITEMS: MenuItem[] = [
  { key: 'status', title: 'Clinic Status', icon: 'pulse-outline', route: '/clinic/clinic-settings/clinic-status' },
  { key: 'device-permissions', title: 'Device Permissions', icon: 'phone-portrait-outline', route: '/clinic/clinic-settings/device-permissions' },
  { key: 'archive-download', title: 'Archiving and Downloading', icon: 'archive-outline', route: '/clinic/clinic-settings/archive-download' },
  { key: 'like-share-counts', title: 'Like and Share Counts', icon: 'heart-outline', route: '/clinic/clinic-settings/like-share-counts' },
  { key: 'hide-story-live', title: 'Hide Story and Live', icon: 'eye-off-outline', route: '/clinic/clinic-settings/hide-story-live' },
  { key: 'sharing', title: 'Sharing', icon: 'share-social-outline', route: '/clinic/clinic-settings/sharing' },
  { key: 'time-management', title: 'Time Management', icon: 'time-outline', route: '/clinic/clinic-settings/time-management' },
];

export default function ClinicSettingsIndex() {
  const router = useRouter();
  const { clinicId } = useLocalSearchParams<{ clinicId: string }>();
  const { colors, isDark } = useTheme();

  const handlePress = (item: MenuItem) => {
    router.push(`${item.route}?clinicId=${clinicId}` as any);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>  
      <ScrollView contentContainerStyle={styles.list}>
        {MENU_ITEMS.map((item, idx) => (
          <Pressable
            key={item.key}
            style={({ pressed }) => [
              styles.row,
              {
                backgroundColor: pressed
                  ? isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'
                  : 'transparent',
                borderBottomColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
                borderBottomWidth: idx < MENU_ITEMS.length - 1 ? StyleSheet.hairlineWidth : 0,
              },
            ]}
            onPress={() => handlePress(item)}
          >
            <View style={styles.rowLeft}>
              <Ionicons
                name={item.icon}
                size={22}
                color={isDark ? '#B0BEC5' : '#546E7A'}
                style={styles.rowIcon}
              />
              <Text style={[styles.rowTitle, { color: colors.textPrimary }]}>
                {item.title}
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={isDark ? '#64748B' : '#94A3B8'}
            />
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    paddingVertical: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    minHeight: 52,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  rowIcon: {
    marginRight: 14,
    width: 24,
    textAlign: 'center',
  },
  rowTitle: {
    fontSize: 16,
    fontWeight: '400',
  },
});
