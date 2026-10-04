import { describe, expect, it } from 'vitest';
import { createInstance } from 'i18next';
import { languagePreference, messages, resolveLocale } from '../src/shared/i18n';
import { formatDateShort, formatTime } from '../src/renderer/lib/date';
import { createStorage } from '../src/renderer/lib/storage';
describe('language selection', () => {
  it('matches Chinese script before region and maps supported system languages', () => {
    for (const language of ['zh-CN', 'zh_SG', 'zh-Hans-TW', 'zh'])
      expect(resolveLocale('system', language)).toBe('zh-CN');
    for (const language of ['zh-TW', 'zh-HK', 'zh-MO', 'zh-Hant-CN'])
      expect(resolveLocale('system', language)).toBe('zh-TW');
    expect(resolveLocale('system', 'ja-JP')).toBe('ja');
    expect(resolveLocale('system', 'en-GB')).toBe('en');
    expect(resolveLocale('system', 'de-DE')).toBe('en');
    expect(resolveLocale('en', 'zh-TW')).toBe('en');
  });
  it('defaults missing/corrupt preferences to the system and persists choices without modifying existing data', () => {
    const values = new Map([
      ['tasks', '["keep me"]'],
      ['api-key', 'existing-key'],
    ]);
    const store = createStorage({
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => values.set(key, value),
    });
    expect(languagePreference(store.getItem('language'))).toBe('system');
    expect(languagePreference('unsupported')).toBe('system');
    store.setItem('language', 'ja');
    expect(resolveLocale(languagePreference(store.getItem('language')), 'en-US')).toBe('ja');
    expect(store.read('tasks', [])).toEqual(['keep me']);
    expect(store.getItem('api-key')).toBe('existing-key');
  });
});
describe('bundled messages and formatting', () => {
  it('ships matching non-empty keys and interpolation variables in every language', () => {
    const keys = Object.keys(messages.en).sort();
    const variables = (text: string) =>
      [...text.matchAll(/{{\s*([^},]+)(?:,[^}]+)?}}/g)].map((match) => match[1]).sort();
    for (const catalog of Object.values(messages)) {
      expect(Object.keys(catalog).sort()).toEqual(keys);
      for (const key of keys) {
        const message = catalog[key as keyof typeof catalog];
        expect(message.trim().length, key).toBeGreaterThan(0);
        expect(variables(message), key).toEqual(
          variables(messages.en[key as keyof typeof messages.en]),
        );
      }
    }
  });
  it('switches dictionaries without leaking keys or interpolation markers and supports item counts', async () => {
    const instance = createInstance();
    await instance.init({
      resources: Object.fromEntries(
        Object.entries(messages).map(([locale, translation]) => [locale, { translation }]),
      ),
      lng: 'en',
      fallbackLng: 'en',
      keySeparator: false,
    });
    expect(instance.t('items', { count: 1 })).toBe('1 item');
    expect(instance.t('items', { count: 2 })).toBe('2 items');
    for (const locale of ['zh-CN', 'zh-TW', 'ja']) {
      await instance.changeLanguage(locale);
      expect(instance.t('language')).toBe(messages[locale as keyof typeof messages].language);
      expect(instance.t('positionX', { value: '50.0' })).not.toContain('{{');
      expect(instance.t('items', { count: 2 })).not.toContain('items');
    }
  });
  it('formats dates in the selected language and preserves the selected clock cycle', () => {
    const date = new Date(2026, 9, 4, 13, 5);
    expect(formatDateShort('ja', date)).not.toEqual(formatDateShort('en', date));
    expect(formatTime('en', true, date)).toBe('1:05');
    expect(formatTime('en', false, date)).toBe('13:05');
    expect(formatTime('ja', true, date)).not.toContain('午後');
  });
});
