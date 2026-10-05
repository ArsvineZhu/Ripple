import styles from './BrowserSearchTab.module.css';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion } from 'motion/react';
import { InlineNotices } from '../components/InlineNotices';
import type { IslandController } from '../hooks/useIslandController';
type Props = Pick<
  IslandController,
  | 'browserSearch'
  | 'setBrowserSearch'
  | 'searchBrowser'
  | 'searchError'
  | 'setSearchError'
  | 'textColor'
>;
export function BrowserSearchTab({
  browserSearch,
  setBrowserSearch,
  searchBrowser,
  searchError,
  setSearchError,
  textColor,
}: Props) {
  const { t } = useTranslation();
  return (
    <div className={styles.container}>
      <InlineNotices area="browser-search" />
      <input
        className={styles.searchInput}
        id="browser-searchbar"
        placeholder={t('searchHint')}
        value={browserSearch}
        onChange={(e) => {
          setBrowserSearch(e.target.value);
          setSearchError(null);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            searchBrowser();
          }
        }}
        style={{ color: textColor }}
      />
      <AnimatePresence initial={false}>
        {searchError && (
          <motion.p
            className={styles.error}
            role="alert"
            initial={{ opacity: 0, filter: 'blur(10px)' }}
            animate={{ opacity: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, filter: 'blur(10px)' }}
            transition={{ duration: 0.2 }}
          >
            {t(searchError)}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
