import { Stack } from 'expo-router';

export default function StoryLayout() {
  return (
    <Stack
      initialRouteName="layout"
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_bottom',
      }}
    >
      <Stack.Screen name="layout" />
      <Stack.Screen name="camera" />
      <Stack.Screen name="edit" />
      <Stack.Screen name="text-editor" />
      <Stack.Screen name="frame-editor" />
      <Stack.Screen name="boomerang" />
    </Stack>
  );
}
