import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import en from './locales/en.json';
import sw from './locales/sw.json';

const resources = {
  en: { translation: en },
  sw: { translation: sw }
};

// FIXED: getLocales() returns an array. We check the languageCode of the first locale.
const locales = Localization.getLocales();
const deviceLang = (locales && locales.length > 0 && locales[0].languageCode === 'sw') ? 'sw' : 'en';

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: deviceLang, 
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false 
    }
  });

export default i18n;