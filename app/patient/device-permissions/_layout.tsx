import { DevicePermissionsProvider } from '@/src/context/DevicePermissionsContext';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { Platform, Pressable } from 'react-native';

export default function DevicePermissionsLayout() {
  const router = useRouter();

  return (
    <DevicePermissionsProvider>
    <Stack
      screenOptions={{
        headerTransparent: true,
        headerStyle: {
          backgroundColor: 'transparent',
        },
        headerTintColor: '#1A2B3F',
        headerTitleStyle: {
          color: '#1A2B3F',
          fontSize: 17,
          fontWeight: '600',
        },
        headerTitleAlign: 'center',
        headerBackTitle: '',
        headerBackButtonDisplayMode: 'minimal',
        headerShadowVisible: false,
        contentStyle: { backgroundColor: 'transparent' },
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
              <Ionicons name="chevron-back" size={28} color={'#1A2B3F'} />
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
