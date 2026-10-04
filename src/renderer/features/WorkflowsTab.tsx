import styles from './WorkflowsTab.module.css';
import { useTranslation } from 'react-i18next';
import { AnimatePresence } from 'motion/react';
import { motion } from 'motion/react';
import { openApp } from '../lib/launch';
import type { IslandController } from '../hooks/useIslandController';
type Props = Pick<
  IslandController,
  'workflows' | 'openWorkflow' | 'bgColor' | 'textColor' | 'quickApps'
>;
export function WorkflowsTab({ workflows, openWorkflow, bgColor, textColor, quickApps }: Props) {
  const { t } = useTranslation();
  return (
    <div className={styles.container}>
      <div className={styles.workflowList} id="workflows">
        <AnimatePresence propagate>
          {workflows.length === 0 ? (
            <motion.p
              className={styles.emptyState}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
            >
              {t('workflowsEmpty')}
            </motion.p>
          ) : (
            workflows.map((workflow, i) => (
              <motion.button
                key={`main-wf-${workflow.name}-${i}`}
                className={styles.workflowButton}
                onClick={() => {
                  openWorkflow(workflow);
                }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, height: 0, padding: 0, marginBottom: 0 }}
                style={{ color: bgColor, backgroundColor: textColor }}
              >
                {workflow.name}{' '}
                <span className={styles.itemCount}>
                  ({t('items', { count: workflow.urls.length })})
                </span>
              </motion.button>
            ))
          )}
        </AnimatePresence>
      </div>

      <div
        className={styles.quickAppStrip}
        style={{
          borderTop: `1px solid color-mix(in srgb, ${textColor}, transparent 90%)`,
          background: `color-mix(in srgb, ${textColor}, transparent 98%)`,
        }}
      >
        <div className={styles.quickAppList} id="quick-apps">
          <AnimatePresence propagate>
            {quickApps.map((app, i) => (
              <motion.button
                key={`main-qa-${app.name}-${i}`}
                className={styles.appButton}
                onClick={() => {
                  openApp(app.launch);
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, width: 0, padding: 0, margin: 0 }}
                style={{ color: bgColor, backgroundColor: textColor }}
              >
                {app.name}
              </motion.button>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
