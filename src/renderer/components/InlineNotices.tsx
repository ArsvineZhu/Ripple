import { AnimatePresence, motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import type { NoticeArea, NoticeCode } from '../../shared/contracts';
import { useNotifications } from './NotificationProvider';
import styles from './InlineNotices.module.css';

export function InlineNotices({
  area,
  codes,
}: {
  area: NoticeArea;
  codes?: readonly NoticeCode[];
}) {
  const { t } = useTranslation();
  const { notices, dismiss } = useNotifications();
  const visible = notices.filter(
    (notice) => notice.area === area && (!codes || codes.includes(notice.code)),
  );
  if (visible.length === 0) return null;

  return (
    <div className={styles.list} aria-live="polite" data-island-interactive>
      <AnimatePresence initial={false}>
        {visible.map((notice) => (
          <motion.div
            key={notice.id}
            className={`${styles.notice} ${notice.severity === 'error' ? styles.error : styles.warning}`}
            initial={{ opacity: 0, filter: 'blur(10px)' }}
            animate={{ opacity: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, filter: 'blur(10px)' }}
            transition={{ duration: 0.2 }}
            role={notice.severity === 'error' ? 'alert' : 'status'}
          >
            <div className={styles.message}>
              <span>{t(notice.code)}</span>
              {notice.detail && <span className={styles.detail}>{notice.detail}</span>}
            </div>
            <button
              type="button"
              className={styles.dismiss}
              aria-label={t('dismiss')}
              onClick={() => dismiss(notice.id)}
            >
              ×
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
