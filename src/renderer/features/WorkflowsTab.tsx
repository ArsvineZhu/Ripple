import { AnimatePresence } from 'motion/react';
import { motion } from 'motion/react';
import { openApp } from '../lib/launch';
import type { IslandController } from '../hooks/useIslandController';
type Props = Pick<
  IslandController,
  'workflows' | 'openWorkflow' | 'bgColor' | 'textColor' | 'theme' | 'quickApps'
>;
export function WorkflowsTab({
  workflows,
  openWorkflow,
  bgColor,
  textColor,
  theme,
  quickApps,
}: Props) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      <div
        id="workflows"
        style={{
          animation: 'none',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          width: '95%',
          flex: 1,
          overflowY: 'auto',
          padding: '15px 0',
          margin: '0 auto',
        }}
      >
        <AnimatePresence propagate>
          {workflows.length === 0 ? (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              style={{ textAlign: 'center', fontSize: 13, marginTop: 20 }}
            >
              No workflows yet. Add them in settings!
            </motion.p>
          ) : (
            workflows.map((workflow, i) => (
              <motion.button
                key={`main-wf-${workflow.name}-${i}`}
                className="workflow-item"
                onClick={() => {
                  openWorkflow(workflow);
                }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, height: 0, padding: 0, marginBottom: 0 }}
                style={{
                  width: '96%',
                  color: bgColor,
                  backgroundColor: textColor,
                  fontFamily: theme === 'win95' ? 'w95' : 'OpenRunde',
                  borderRadius: '12px',
                  fontSize: 14,
                  fontWeight: 600,
                  textAlign: 'left',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
                  alignSelf: 'center',
                  marginBottom: 2,
                }}
              >
                {workflow.name}{' '}
                <span style={{ opacity: 0.6, fontWeight: 400, marginLeft: 5 }}>
                  ({workflow.urls.length} sites)
                </span>
              </motion.button>
            ))
          )}
        </AnimatePresence>
      </div>

      <div
        style={{
          paddingTop: '12px',
          paddingBottom: '12px',
          borderTop: `1px solid color-mix(in srgb, ${textColor}, transparent 90%)`,
          width: '100%',
          marginTop: 'auto',
          background: `color-mix(in srgb, ${textColor}, transparent 98%)`,
          overflowX: 'auto',
        }}
      >
        <div
          id="quick-apps"
          style={{
            animation: 'none',
            margin: 0,
            display: 'flex',
            gap: '12px',
            padding: '0 15px',
            width: 'max-content',
          }}
        >
          <AnimatePresence propagate>
            {quickApps.map((app, i) => (
              <motion.button
                key={`main-qa-${app.name}-${i}`}
                className="qa-app"
                onClick={() => {
                  openApp(app.launch);
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, width: 0, padding: 0, margin: 0 }}
                style={{
                  color: bgColor,
                  backgroundColor: textColor,
                  fontFamily: theme === 'win95' ? 'w95' : 'OpenRunde',
                  flexShrink: 0,
                }}
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
