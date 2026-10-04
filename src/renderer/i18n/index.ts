import { createInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';
import { messages, languagePreference, resolveLocale } from '../../shared/i18n';
import type { LanguagePreference } from '../../shared/i18n';
import { storage } from '../lib/storage';
const i18n = createInstance();
let systemLocale = navigator.language;
async function synchronizeLanguage(preference: LanguagePreference) {
  const locale = resolveLocale(preference, systemLocale);
  await i18n.changeLanguage(locale);
  document.documentElement.lang = locale;
  await window.electronAPI?.setUILocale(locale);
}
export async function initializeI18n() {
  systemLocale = (await window.electronAPI?.getSystemLocale()) || navigator.language;
  const preference = languagePreference(storage.getItem('language'));
  await i18n.use(initReactI18next).init({
    resources: Object.fromEntries(
      Object.entries(messages).map(([locale, translation]) => [locale, { translation }]),
    ),
    lng: resolveLocale(preference, systemLocale),
    fallbackLng: 'en',
    keySeparator: false,
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
  });
  await synchronizeLanguage(preference);
}
export async function changeLanguagePreference(preference: LanguagePreference) {
  storage.setItem('language', preference);
  await synchronizeLanguage(preference);
}
