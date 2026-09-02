import { DarkTheme, DefaultTheme, ThemeProvider as NavThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo } from 'react';
import { I18nextProvider } from 'react-i18next';
import { I18nManager, Platform } from 'react-native';
import { useFonts } from 'expo-font';
import { Poppins_600SemiBold } from '@expo-google-fonts/poppins';
import { Montserrat_700Bold } from '@expo-google-fonts/montserrat';
import { PlayfairDisplay_700Bold } from '@expo-google-fonts/playfair-display';
import { Pacifico_400Regular } from '@expo-google-fonts/pacifico';
import { BebasNeue_400Regular } from '@expo-google-fonts/bebas-neue';
import { Caveat_700Bold } from '@expo-google-fonts/caveat';
import { Lobster_400Regular } from '@expo-google-fonts/lobster';
import { Oswald_600SemiBold } from '@expo-google-fonts/oswald';

import { useColorScheme } from '@/hooks/use-color-scheme';
import i18n from '@/i18n';
import UsageBlockOverlay from '@/src/components/UsageBlockOverlay';
import { AuthProvider } from '@/src/context/AuthContext';
import { LocationSelectionProvider } from '@/src/context/LocationSelectionContext';
import { SavedItemsProvider } from '@/src/context/SavedItemsContext';
import { StorySettingsProvider } from '@/src/context/StorySettingsContext';
import { ThemeProvider, useTheme } from '@/src/context/ThemeContext';
import { useAppUsageTracker } from '@/src/hooks/useAppUsageTracker';

function RootNavigator() {
  const { colors } = useTheme();
  const { isBlocked, blockReason } = useAppUsageTracker();
  
  return (
    <>
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
        contentStyle: { backgroundColor: 'transparent' },
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="subscribe-choice" options={{ headerShown: false }} />
      <Stack.Screen name="clinic/subscribe" options={{ title: 'Clinic Subscription', headerShown: false }} />
      <Stack.Screen name="clinic/signup" options={{ headerShown: false }} />
      <Stack.Screen name="clinic/location-picker" options={{ headerShown: false }} />
      <Stack.Screen name="clinic/dashboard" options={{ headerShown: false }} />
      <Stack.Screen name="clinic/index" options={{ title: 'Patients', headerShown: true }} />
      <Stack.Screen name="clinic/create" options={{ title: 'New Patient', headerShown: true }} />
      <Stack.Screen name="clinic/messages" options={{ headerShown: false }} />
      <Stack.Screen name="clinic/messages-archive" options={{ headerShown: false }} />
      <Stack.Screen name="clinic/conversation" options={{ headerShown: false }} />
      <Stack.Screen name="clinic/contact-info" options={{ headerShown: false }} />
      <Stack.Screen name="clinic/media-all" options={{ headerShown: false }} />
      <Stack.Screen name="clinic/starred" options={{ headerShown: false }} />
      <Stack.Screen name="patient/starred" options={{ headerShown: false }} />
      <Stack.Screen name="clinic/chat-camera" options={{ headerShown: false, presentation: 'fullScreenModal', animation: 'slide_from_bottom' }} />
      <Stack.Screen name="clinic/media-preview" options={{ headerShown: false, presentation: 'fullScreenModal', animation: 'slide_from_bottom' }} />
      <Stack.Screen name="clinic/team" options={{ title: 'Team', headerShown: true }} />
      <Stack.Screen name="clinic/usage" options={{ title: 'Usage & Trial', headerShown: true }} />
      <Stack.Screen name="clinic/audit" options={{ title: 'Audit Log', headerShown: true }} />
      <Stack.Screen name="clinic/[patientId]" options={{ title: 'Patient Details', headerShown: true }} />
      <Stack.Screen name="clinic/patients-list" options={{ headerShown: false }} />
      <Stack.Screen name="clinic/patient-edit" options={{ headerShown: false }} />
      <Stack.Screen name="clinic/media" options={{ title: 'Patient Media', headerShown: false }} />
      <Stack.Screen name="clinic/upgrade" options={{ headerShown: false }} />
      <Stack.Screen name="clinic/archive" options={{ headerShown: false }} />
      <Stack.Screen
        name="clinic/archive-settings"
        options={{
          title: 'Archive Settings',
          headerShown: true,
          headerBackButtonDisplayMode: 'minimal',
          headerTitleAlign: 'center',
          headerShadowVisible: false,
          headerTransparent: true,
          headerStyle: { backgroundColor: 'transparent' },
        }}
      />
      <Stack.Screen name="story-viewer" options={{ headerShown: false, animation: 'fade' }} />
      <Stack.Screen name="patient/index" options={{ title: 'Patient Login', headerShown: false }} />
      <Stack.Screen name="patient/profile" options={{ title: 'Clinic Profile', headerShown: true }} />
      <Stack.Screen name="clinic/confirm-subscription" options={{ headerShown: false }} />
      <Stack.Screen name="clinic/renew-subscribe" options={{ headerShown: false }} />
      <Stack.Screen name="clinic/feedback" options={{ headerShown: false }} />
      <Stack.Screen name="clinic/clinic-settings" options={{ headerShown: false }} />
      <Stack.Screen name="patient/[patientId]" options={{ title: 'Your Treatment', headerShown: false }} />
      <Stack.Screen name="patient/conversation" options={{ headerShown: false }} />
      <Stack.Screen name="patient/your-info" options={{ headerShown: false }} />
      <Stack.Screen name="patient/media-all" options={{ headerShown: false }} />
      <Stack.Screen name="patient/chat-camera" options={{ headerShown: false, presentation: 'fullScreenModal', animation: 'slide_from_bottom' }} />
      <Stack.Screen name="patient/media-preview" options={{ headerShown: false, presentation: 'fullScreenModal', animation: 'slide_from_bottom' }} />
      <Stack.Screen name="patient/device-permissions" options={{ headerShown: false }} />

      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      <Stack.Screen name="settings" options={{ headerShown: false, presentation: 'modal' }} />
      <Stack.Screen name="story" options={{ headerShown: false, presentation: 'fullScreenModal' }} />
      <Stack.Screen name="notifications" options={{ headerShown: false }} />
      <Stack.Screen name="public/clinics" options={{ headerShown: false }} />
      <Stack.Screen name="algorithm" options={{ headerShown: false }} />
      <Stack.Screen name="reels-camera-settings" options={{ headerShown: false, presentation: 'modal' }} />
      <Stack.Screen name="create-reel" options={{ headerShown: false, animation: 'slide_from_bottom' }} />
      <Stack.Screen name="reels-media-picker" options={{ headerShown: false, animation: 'slide_from_right' }} />
      <Stack.Screen name="reels-edit" options={{ headerShown: false, animation: 'slide_from_right' }} />
      <Stack.Screen name="reels-templates" options={{ headerShown: false, animation: 'slide_from_right' }} />
      <Stack.Screen name="reels-template-preview" options={{ headerShown: false, animation: 'slide_from_right' }} />
      <Stack.Screen name="select-template-media" options={{ headerShown: false, animation: 'slide_from_right' }} />
      <Stack.Screen name="template-slots" options={{ headerShown: false, animation: 'slide_from_right' }} />
      <Stack.Screen name="post-preview" options={{ headerShown: false, animation: 'slide_from_right' }} />
    </Stack>
    {isBlocked && <UsageBlockOverlay reason={blockReason!} />}
  </>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  const navTheme = useMemo(() => {
    const base = colorScheme === 'dark' ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        background: 'transparent',
        card: 'transparent',
      },
    };
  }, [colorScheme]);

  useEffect(() => {
    // Force layout direction based on current language
    const currentLang = i18n.language;
    const shouldBeRTL = ['ar', 'he', 'fa', 'ur'].includes(currentLang);

    if (Platform.OS !== 'web' && I18nManager.isRTL !== shouldBeRTL) {
      I18nManager.allowRTL(shouldBeRTL);
      I18nManager.forceRTL(shouldBeRTL);
    }
  }, []);

  useFonts({
    Poppins_600SemiBold,
    Montserrat_700Bold,
    PlayfairDisplay_700Bold,
    Pacifico_400Regular,
    BebasNeue_400Regular,
    Caveat_700Bold,
    Lobster_400Regular,
    Oswald_600SemiBold,
  });

  return (
    <I18nextProvider i18n={i18n}>
      <ThemeProvider>
        <AuthProvider>
          <StorySettingsProvider>
            <LocationSelectionProvider>
              <SavedItemsProvider>
                <NavThemeProvider value={navTheme}>
                  <RootNavigator />
                  <StatusBar style="dark" translucent backgroundColor="transparent" />
                </NavThemeProvider>
              </SavedItemsProvider>
            </LocationSelectionProvider>
          </StorySettingsProvider>
        </AuthProvider>
      </ThemeProvider>
    </I18nextProvider>
  );
}
