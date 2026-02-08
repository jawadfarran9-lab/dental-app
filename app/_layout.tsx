import { DarkTheme, DefaultTheme, ThemeProvider as NavThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { I18nextProvider } from 'react-i18next';
import { I18nManager, Platform } from 'react-native';

import { useColorScheme } from '@/hooks/use-color-scheme';
import i18n from '@/i18n';
import { AuthProvider } from '@/src/context/AuthContext';
import { ClinicProvider } from '@/src/context/ClinicContext';
import { StorySettingsProvider } from '@/src/context/StorySettingsContext';
import { ThemeProvider, useTheme } from '@/src/context/ThemeContext';

function RootNavigator() {
  const { colors } = useTheme();
  
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTintColor: colors.textPrimary,
        headerTitleStyle: {
          color: colors.textPrimary,
        },
        headerBackTitle: '',
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="clinic/subscribe" options={{ title: 'Clinic Subscription', headerShown: false }} />
      <Stack.Screen name="clinic/signup" options={{ title: 'Clinic Details', headerShown: true }} />
      <Stack.Screen name="clinic/login" options={{ title: 'Clinic Login', headerShown: true }} />
      <Stack.Screen name="clinic/dashboard" options={{ headerShown: false }} />
      <Stack.Screen name="clinic/index" options={{ title: 'Patients', headerShown: true }} />
      <Stack.Screen name="clinic/create" options={{ title: 'New Patient', headerShown: true }} />
      <Stack.Screen name="clinic/messages" options={{ title: 'Messages', headerShown: true }} />
      <Stack.Screen name="clinic/team" options={{ title: 'Team', headerShown: true }} />
      <Stack.Screen name="clinic/usage" options={{ title: 'Usage & Trial', headerShown: true }} />
      <Stack.Screen name="clinic/audit" options={{ title: 'Audit Log', headerShown: true }} />
      <Stack.Screen name="clinic/[patientId]" options={{ title: 'Patient Details', headerShown: true }} />
      <Stack.Screen name="clinic/media" options={{ title: 'Patient Media', headerShown: false }} />
      <Stack.Screen name="clinic/upgrade" options={{ headerShown: false }} />
      <Stack.Screen name="patient/index" options={{ title: 'Patient Login', headerShown: false }} />
      <Stack.Screen name="patient/files" options={{ title: 'My Files', headerShown: true }} />
      <Stack.Screen name="patient/profile" options={{ title: 'Clinic Profile', headerShown: true }} />
      <Stack.Screen name="clinic/payment" options={{ title: 'Subscription Payment', headerShown: true }} />
      <Stack.Screen name="patient/[patientId]" options={{ title: 'Your Treatment', headerShown: true }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      <Stack.Screen name="settings" options={{ headerShown: false, presentation: 'modal' }} />
      <Stack.Screen name="story" options={{ headerShown: false, presentation: 'fullScreenModal' }} />
      <Stack.Screen name="public/clinics" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    // Force layout direction based on current language
    const currentLang = i18n.language;
    const shouldBeRTL = ['ar', 'he', 'fa', 'ur'].includes(currentLang);
    
    if (Platform.OS !== 'web' && I18nManager.isRTL !== shouldBeRTL) {
      I18nManager.allowRTL(shouldBeRTL);
      I18nManager.forceRTL(shouldBeRTL);
    }
  }, []);

  return (
    <I18nextProvider i18n={i18n}>
      <ThemeProvider>
        <AuthProvider>
          <ClinicProvider>
            <StorySettingsProvider>
              <NavThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
                <RootNavigator />
                <StatusBar style="auto" />
              </NavThemeProvider>
            </StorySettingsProvider>
          </ClinicProvider>
        </AuthProvider>
      </ThemeProvider>
    </I18nextProvider>
  );
}
