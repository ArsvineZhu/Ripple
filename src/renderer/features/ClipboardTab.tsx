import { CopyButton } from '../components/CopyButton';
import styles from './ClipboardTab.module.css';
import { useTranslation } from 'react-i18next';
import type { IslandController } from '../hooks/useIslandController';
type Props = Pick<IslandController, 'clipboard' | 'copyToClipboard'>;
export function ClipboardTab({ clipboard, copyToClipboard }: Props) {
  const { t } = useTranslation();
  return (
    <div className={styles.container} id="clipboard">
      {clipboard.length === 0 ? (
        <p className={styles.emptyState}>{t('clipboardEmpty')}</p>
      ) : (
        clipboard.map((item, index) => (
          <div className={styles.row} data-island-interactive key={index}>
            <p className={styles.entryContent}>{item}</p>
            <CopyButton className={styles.copyButton} onCopy={() => copyToClipboard(item)} />
          </div>
        ))
      )}
    </div>
  );
}
