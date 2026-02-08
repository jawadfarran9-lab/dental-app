import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { I18nManager, Platform } from 'react-native';

import ar from './i18n/ar.json';
import de from './i18n/de.json';
import en from './i18n/en.json';
import es from './i18n/es.json';
import fr from './i18n/fr.json';
import he from './i18n/he.json';
import hi from './i18n/hi.json';
import it from './i18n/it.json';
import ja from './i18n/ja.json';
import ko from './i18n/ko.json';
import ptBR from './i18n/pt-BR.json';
import ru from './i18n/ru.json';
import tr from './i18n/tr.json';
import zhCN from './i18n/zh-CN.json';

const resources = {
  en: { translation: en },
  ar: { translation: ar },
  fr: { translation: fr },
  es: { translation: es },
  de: { translation: de },
  he: { translation: he },
  'pt-BR': { translation: ptBR },
  it: { translation: it },
  ru: { translation: ru },
  tr: { translation: tr },
  hi: { translation: hi },
  'zh-CN': { translation: zhCN },
  ko: { translation: ko },
  ja: { translation: ja },
};

const RTL_LANGUAGES = ['ar', 'he', 'fa', 'ur'];

export const isRTL = (languageCode: string) => RTL_LANGUAGES.includes(languageCode);

const applyRTL = async (languageCode: string) => {
  // Skip RTL management on web (SSR)
  if (Platform.OS === 'web') return;
  
  const shouldBeRTL = isRTL(languageCode);
  const currentRTL = I18nManager.isRTL;
  
  if (shouldBeRTL !== currentRTL) {
    I18nManager.forceRTL(shouldBeRTL);
    // Note: Full RTL change requires app restart in React Native
    // Store the preference and apply on next launch
    await AsyncStorage.setItem('isRTL', shouldBeRTL ? 'true' : 'false');
  }
};

const initI18n = async () => {
  let savedLanguage = 'en';
  
  // Only use AsyncStorage on native platforms
  if (Platform.OS !== 'web' && typeof (globalThis as any).window === 'undefined') {
    try {
      savedLanguage = await AsyncStorage.getItem('userLanguage') || savedLanguage;
    } catch (e) {
      // Ignore async storage errors during SSR
    }
  }
  
  if (!savedLanguage || savedLanguage === 'en') {
    const fallback = { languageCode: 'en' };
    const locales = Localization.getLocales?.() || [];
    const detected = locales[0] || fallback;
    savedLanguage = Object.keys(resources).includes(detected.languageCode || 'en') ? (detected.languageCode || 'en') : 'en';
  }

  // Apply RTL if needed (native only)
  await applyRTL(savedLanguage);

  if (!i18n.isInitialized) {
    await i18n
      .use(initReactI18next)
      .init({
        lng: savedLanguage,
        fallbackLng: 'en',
        compatibilityJSON: 'v4',
        resources,
        interpolation: { escapeValue: false },
        react: {
          useSuspense: false,
        },
      });
  }
};

// Only initialize on client side (not during SSR)
if (typeof (globalThis as any).window !== 'undefined' || Platform.OS !== 'web') {
  initI18n();
}

export const changeLanguage = async (lang: string) => {
  // Only save to AsyncStorage on native platforms
  if (Platform.OS !== 'web') {
    await AsyncStorage.setItem('userLanguage', lang);
  }
  await i18n.changeLanguage(lang);
  await applyRTL(lang);
};

export default i18n;
