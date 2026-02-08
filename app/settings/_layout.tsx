import { useTheme } from '@/src/context/ThemeContext';
import { Stack } from 'expo-router';

export default function SettingsLayout() {
  const { colors } = useTheme();
  
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: colors.background,
        },
      }}
    >
      <Stack.Screen 
        name="story-settings" 
        options={{ 
          presentation: 'modal',
        }} 
      />
    </Stack>
  );
}
