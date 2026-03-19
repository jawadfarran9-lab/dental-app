import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { Platform, Pressable } from 'react-native';

export default function ClinicSettingsLayout() {
  const router = useRouter();

  return (
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
        headerShadowVisible: false,
        contentStyle: { backgroundColor: 'transparent' },
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
              <Ionicons name="chevron-back" size={28} color={'#1A2B3F'} />
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
              <Ionicons name="chevron-back" size={28} color={'#1A2B3F'} />
            </Pressable>
          ),
        }}
      />
      <Stack.Screen name="device-permissions" options={{ headerShown: false }} />
      <Stack.Screen name="archive-download" options={{ title: 'Archiving and Downloading', headerBackButtonDisplayMode: 'minimal' }} />
      <Stack.Screen name="like-share-counts" options={{ title: 'Like and Share Counts', headerBackButtonDisplayMode: 'minimal' }} />
      <Stack.Screen name="hide-story-live" options={{ title: 'Hide Story and Live', headerBackButtonDisplayMode: 'minimal' }} />
      <Stack.Screen name="sharing" options={{ title: 'Sharing', headerBackButtonDisplayMode: 'minimal' }} />
      <Stack.Screen name="time-management" options={{ headerShown: false }} />
    </Stack>
  );
}
