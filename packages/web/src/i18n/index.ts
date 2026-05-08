import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import en from './resources/en.json';
import zhCN from './resources/zh-CN.json';
import ja from './resources/ja.json';

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      'zh-CN': { translation: zhCN },
      ja: { translation: ja },
    },
    fallbackLng: 'en',
    supportedLngs: ['en', 'zh-CN', 'ja'],
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'archon-lang',
    },
    interpolation: { escapeValue: false },
  });

export default i18n;
