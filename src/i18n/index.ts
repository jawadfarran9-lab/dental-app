import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { I18nManager, Platform } from 'react-native';

import ar from '@/app/i18n/ar.json';
import de from '@/app/i18n/de.json';
import en from '@/app/i18n/en.json';
import es from '@/app/i18n/es.json';
import fr from '@/app/i18n/fr.json';
import he from '@/app/i18n/he.json';
import hi from '@/app/i18n/hi.json';
import it from '@/app/i18n/it.json';
import ja from '@/app/i18n/ja.json';
import ko from '@/app/i18n/ko.json';
import ptBR from '@/app/i18n/pt-BR.json';
import ru from '@/app/i18n/ru.json';
import tr from '@/app/i18n/tr.json';
import zhCN from '@/app/i18n/zh-CN.json';

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
  if (Platform.OS === 'web') return;
  const shouldBeRTL = isRTL(languageCode);
  const currentRTL = I18nManager.isRTL;
  if (shouldBeRTL !== currentRTL) {
    I18nManager.forceRTL(shouldBeRTL);
    await AsyncStorage.setItem('isRTL', shouldBeRTL ? 'true' : 'false');
  }
};

const initI18n = async () => {
  let savedLanguage = 'en';
  if (Platform.OS !== 'web' && typeof (globalThis as any).window === 'undefined') {
    try {
      savedLanguage = (await AsyncStorage.getItem('userLanguage')) || savedLanguage;
    } catch {}
  }
  if (!savedLanguage || savedLanguage === 'en') {
    const locales = Localization.getLocales?.() || [];
    const preferred = locales[0]?.languageCode || 'en';
    savedLanguage = Object.keys(resources).includes(preferred) ? preferred : 'en';
  }
  await applyRTL(savedLanguage);
  if (!i18n.isInitialized) {
    const options = {
      lng: savedLanguage,
      fallbackLng: 'en',
      compatibilityJSON: 'v3',
      resources,
      interpolation: { escapeValue: false },
      react: { useSuspense: false },
    } as any;
    await i18n.use(initReactI18next).init(options);
  }
};

if (typeof (globalThis as any).window !== 'undefined' || Platform.OS !== 'web') {
  void initI18n();
}

export const changeLanguage = async (lang: string) => {
  if (Platform.OS !== 'web') {
    await AsyncStorage.setItem('userLanguage', lang);
  }
  await i18n.changeLanguage(lang);
  await applyRTL(lang);
};

export default i18n;
