import { PremiumGradientBackground } from '@/src/components/PremiumGradientBackground';
import { useTheme } from '@/src/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useHeaderHeight } from '@react-navigation/elements';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import {
    Animated,
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
  { key: 'archive', title: 'Archive', icon: 'albums-outline', route: '/clinic/archive' },
  { key: 'status', title: 'Clinic Hours & Status', icon: 'pulse-outline', route: '/clinic/clinic-settings/clinic-status' },
  { key: 'device-permissions', title: 'Device Permissions', icon: 'phone-portrait-outline', route: '/clinic/clinic-settings/device-permissions' },
  { key: 'archive-download', title: 'Archiving and Downloading', icon: 'archive-outline', route: '/clinic/clinic-settings/archive-download' },
  { key: 'like-share-counts', title: 'Like and Share Counts', icon: 'heart-outline', route: '/clinic/clinic-settings/like-share-counts' },
  { key: 'hide-story-live', title: 'Hide Story and Live', icon: 'eye-off-outline', route: '/clinic/clinic-settings/hide-story-live' },
  { key: 'sharing', title: 'Sharing', icon: 'share-social-outline', route: '/clinic/clinic-settings/sharing' },
  { key: 'time-management', title: 'Time Management', icon: 'time-outline', route: '/clinic/clinic-settings/time-management' },
];

const STAGGER_DELAY = 30;

function AnimatedRow({ item, idx, total, colors, onPress }: { item: MenuItem; idx: number; total: number; colors: any; onPress: () => void }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(8)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 250, delay: idx * STAGGER_DELAY, useNativeDriver: true }).start();
    Animated.timing(translateY, { toValue: 0, duration: 250, delay: idx * STAGGER_DELAY, useNativeDriver: true }).start();
  }, []);

  const onPressIn = () => {
    Animated.timing(scaleAnim, { toValue: 0.97, duration: 120, useNativeDriver: true }).start();
  };
  const onPressOut = () => {
    Animated.timing(scaleAnim, { toValue: 1, duration: 120, useNativeDriver: true }).start();
  };

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY }, { scale: scaleAnim }] }}>
      <Pressable
        style={({ pressed }) => [
          styles.row,
          {
            opacity: pressed ? 0.7 : 1,
            backgroundColor: pressed ? colors.rowHighlight : 'transparent',
            borderBottomColor: colors.borderTint,
            borderBottomWidth: idx < total - 1 ? StyleSheet.hairlineWidth : 0,
          },
        ]}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        onPress={onPress}
      >
        <View style={styles.rowLeft}>
          <Ionicons
            name={item.icon}
            size={23}
            color={colors.iconMuted}
            style={styles.rowIcon}
          />
          <Text style={[styles.rowTitle, { color: colors.textPrimary }]}>
            {item.title}
          </Text>
        </View>
        <Ionicons
          name="chevron-forward"
          size={20}
          color={'#1A2B3F'}
        />
      </Pressable>
    </Animated.View>
  );
}

export default function ClinicSettingsIndex() {
  const router = useRouter();
  const { clinicId } = useLocalSearchParams<{ clinicId: string }>();
  const { colors, isDark } = useTheme();
  const headerHeight = useHeaderHeight();

  const handlePress = (item: MenuItem) => {
    router.push(`${item.route}?clinicId=${clinicId}` as any);
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerTransparent: true,
          headerTitle: 'Settings',
          headerTintColor: colors.textPrimary,
          headerShadowVisible: false,
        }}
      />
      <PremiumGradientBackground isDark={isDark} showSparkles={true} />
      <ScrollView contentContainerStyle={[styles.list, { paddingTop: headerHeight }]}>
        {MENU_ITEMS.map((item, idx) => (
          <AnimatedRow
            key={item.key}
            item={item}
            idx={idx}
            total={MENU_ITEMS.length}
            colors={colors}
            onPress={() => handlePress(item)}
          />
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
    paddingVertical: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    minHeight: 54,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  rowIcon: {
    marginRight: 16,
    width: 24,
    textAlign: 'center',
  },
  rowTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
});
