import { DevicePermissionsProvider } from '@/src/context/DevicePermissionsContext';
import { useTheme } from '@/src/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { Platform, Pressable } from 'react-native';

export default function DevicePermissionsLayout() {
  const { colors } = useTheme();
  const router = useRouter();

  return (
    <DevicePermissionsProvider>
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
          title: 'Device Permissions',
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
      <Stack.Screen name="camera" options={{ title: 'Camera' }} />
      <Stack.Screen name="photos" options={{ title: 'Photos' }} />
      <Stack.Screen name="location" options={{ title: 'Location' }} />
      <Stack.Screen name="notifications" options={{ title: 'Notifications' }} />
      <Stack.Screen name="microphone" options={{ title: 'Microphone' }} />
      <Stack.Screen name="contacts" options={{ title: 'Contacts' }} />
    </Stack>
    </DevicePermissionsProvider>
  );
}
