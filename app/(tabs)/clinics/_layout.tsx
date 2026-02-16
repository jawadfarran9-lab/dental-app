import { Stack } from 'expo-router';

/**
 * Nested Stack navigator inside the Clinics tab.
 * Keeps the bottom tab bar visible on all child screens.
 */
export default function ClinicsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="[clinicId]" />
    </Stack>
  );
}
