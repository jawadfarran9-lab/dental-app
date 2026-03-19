import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { Platform, Pressable } from 'react-native';

export default function TimeManagementLayout() {
  const router = useRouter();

  return (
    <Stack
      screenOptions={{
        headerTransparent: true,
        headerStyle: { backgroundColor: 'transparent' },
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
          title: 'Time Management',
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
      <Stack.Screen name="daily-limit" options={{ title: 'Daily Limit' }} />
      <Stack.Screen name="sleep-mode" options={{ title: 'Sleep Mode' }} />
    </Stack>
  );
}
