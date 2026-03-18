import { useTheme } from '@/src/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { Platform, Pressable } from 'react-native';

export default function ClinicSettingsLayout() {
  const { colors } = useTheme();
  const router = useRouter();

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTintColor: colors.textPrimary,
        headerTitleStyle: {
          color: colors.textPrimary,
          fontSize: 17,
          fontWeight: '600',
        },
        headerTitleAlign: 'center',
        headerBackTitle: '',
        headerBackTitleVisible: false,
        headerShadowVisible: true,
        contentStyle: { backgroundColor: colors.background },
        animation: Platform.OS === 'android' ? 'slide_from_right' : 'default',
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Settings',
          headerLeft: () => (
            <Pressable
              onPress={() => router.back()}
              hitSlop={8}
              style={{ marginRight: Platform.OS === 'android' ? 16 : 0 }}
            >
              <Ionicons name="chevron-back" size={28} color={colors.textPrimary} />
            </Pressable>
          ),
        }}
      />
      <Stack.Screen
        name="clinic-status"
        options={{
          title: 'Clinic Status',
          headerLeft: () => (
            <Pressable
              onPress={() => router.back()}
              hitSlop={8}
              style={{ marginRight: Platform.OS === 'android' ? 16 : 0 }}
            >
              <Ionicons name="chevron-back" size={28} color={colors.textPrimary} />
            </Pressable>
          ),
        }}
      />
      <Stack.Screen name="device-permissions" options={{ headerShown: false }} />
      <Stack.Screen name="archive-download" options={{ title: 'Archiving and Downloading' }} />
      <Stack.Screen name="like-share-counts" options={{ title: 'Like and Share Counts' }} />
      <Stack.Screen name="hide-story-live" options={{ title: 'Hide Story and Live' }} />
      <Stack.Screen name="sharing" options={{ title: 'Sharing' }} />
      <Stack.Screen name="time-management" options={{ headerShown: false }} />
    </Stack>
  );
}
