import { useTranslation } from 'react-i18next';
import type { CSSProperties } from 'react';
import { SettingsTab } from './features/SettingsTab';
import { useSettingsWindowController } from './hooks/useSettingsWindowController';
import { useOverlay } from './components/OverlayProvider';
import styles from './styles/SettingsApp.module.css';

export default function SettingsApp() {
  const { t } = useTranslation();
  const controller = useSettingsWindowController();
  const { setContainer } = useOverlay();
  return (
    <div
      className={styles.app}
      data-theme={controller.theme}
      style={
        {
          '--island-text-color': controller.textColor,
          '--island-bg-color': controller.bgColor,
          color: controller.textColor,
          backgroundColor: controller.bgColor,
        } as CSSProperties
      }
    >
      <header className={styles.header}>
        <h1 className={styles.title}>{t('tabSettings')}</h1>
        <button
          type="button"
          className={styles.quit}
          onClick={() => void window.electronAPI.quitApp()}
        >
          {t('quit')}
        </button>
      </header>
      <main className={styles.main}>
        <SettingsTab {...controller} />
      </main>
      <div ref={setContainer} className={styles.overlay} />
    </div>
  );
}
