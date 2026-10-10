export const SETTINGS_CATEGORIES = [
  { id: 'general', labelKey: 'settingsNavGeneral' },
  { id: 'appearance', labelKey: 'settingsNavAppearance' },
  { id: 'behavior', labelKey: 'settingsNavBehavior' },
  { id: 'pages', labelKey: 'settingsNavPages' },
  { id: 'shortcuts', labelKey: 'settingsNavShortcuts' },
  { id: 'integrations', labelKey: 'settingsNavIntegrations' },
  { id: 'about', labelKey: 'settingsNavAbout' },
] as const;

export type SettingsCategoryId = (typeof SETTINGS_CATEGORIES)[number]['id'];
