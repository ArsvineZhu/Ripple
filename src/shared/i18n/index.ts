import { en } from './en';
import { zhCN } from './zh-CN';
import { zhTW } from './zh-TW';
import { ja } from './ja';
const locales = ['en', 'zh-CN', 'zh-TW', 'ja'] as const;
export type Locale = (typeof locales)[number];
export type LanguagePreference = Locale | 'system';
export const messages = { en, 'zh-CN': zhCN, 'zh-TW': zhTW, ja };
export function isLocale(value: unknown): value is Locale {
  return locales.some((locale) => locale === value);
}
export function languagePreference(value: unknown): LanguagePreference {
  return value === 'system' || isLocale(value) ? value : 'system';
}
export function resolveLocale(preference: LanguagePreference, systemLocale: string): Locale {
  if (preference !== 'system') return preference;
  const parts = systemLocale.replaceAll('_', '-').toLowerCase().split('-');
  if (parts[0] === 'ja') return 'ja';
  if (parts[0] !== 'zh') return 'en';
  if (parts.includes('hans')) return 'zh-CN';
  if (parts.includes('hant') || parts.some((part) => ['tw', 'hk', 'mo'].includes(part)))
    return 'zh-TW';
  return 'zh-CN';
}
