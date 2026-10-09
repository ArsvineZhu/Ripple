import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SettingsTab } from './features/SettingsTab';
import { useSettingsWindowController } from './hooks/useSettingsWindowController';
import { useOverlay } from './components/OverlayProvider';
import { SETTINGS_CATEGORIES, type SettingsCategoryId } from './lib/settingsCategories';
import styles from './styles/SettingsApp.module.css';

export default function SettingsApp() {
  const { t } = useTranslation();
  const controller = useSettingsWindowController();
  const { setContainer } = useOverlay();
  const [category, setCategory] = useState<SettingsCategoryId>('general');
  const active = SETTINGS_CATEGORIES.find((item) => item.id === category) ?? SETTINGS_CATEGORIES[0];

  return (
    <div className={styles.app} data-settings>
      <aside className={styles.sidebar} aria-label={t('tabSettings')}>
        <div className={styles.brand}>
          <p className={styles.brandTitle}>{t('tabSettings')}</p>
        </div>
        <nav className={styles.nav}>
          {SETTINGS_CATEGORIES.map((item) => {
            const selected = item.id === category;
            return (
              <button
                key={item.id}
                type="button"
                className={`${styles.navItem} ${selected ? styles.navItemActive : ''}`}
                aria-current={selected ? 'page' : undefined}
                onClick={() => setCategory(item.id)}
              >
                {t(item.labelKey)}
              </button>
            );
          })}
        </nav>
      </aside>
      <div className={styles.pane}>
        <header className={styles.header}>
          <h1 className={styles.title}>{t(active.labelKey)}</h1>
        </header>
        <main className={styles.main}>
          <SettingsTab {...controller} category={category} />
        </main>
      </div>
      <div ref={setContainer} className={styles.overlay} />
    </div>
  );
}
