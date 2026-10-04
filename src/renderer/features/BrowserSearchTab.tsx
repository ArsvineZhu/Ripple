import styles from './BrowserSearchTab.module.css';
import { useTranslation } from 'react-i18next';
import type { IslandController } from '../hooks/useIslandController';
type Props = Pick<
  IslandController,
  'browserSearch' | 'setBrowserSearch' | 'searchBrowser' | 'textColor'
>;
export function BrowserSearchTab({
  browserSearch,
  setBrowserSearch,
  searchBrowser,
  textColor,
}: Props) {
  const { t } = useTranslation();
  return (
    <div className={styles.container}>
      <input
        className={styles.searchInput}
        id="browser-searchbar"
        placeholder={t('searchHint')}
        value={browserSearch}
        onChange={(e) => setBrowserSearch(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            searchBrowser();
          }
        }}
        style={{ color: textColor }}
      />
    </div>
  );
}
