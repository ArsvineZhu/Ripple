import { AnimatePresence } from 'motion/react';
import { motion } from 'motion/react';
import type { IslandController } from '../hooks/useIslandController';
type Props = Pick<
  IslandController,
  'tasks' | 'removeTask' | 'taskText' | 'setTaskText' | 'addTask' | 'textColor' | 'bgColor'
>;
export function TasksTab({
  tasks,
  removeTask,
  taskText,
  setTaskText,
  addTask,
  textColor,
  bgColor,
}: Props) {
  return (
    <div id="tasks-container" style={{ animation: 'none' }}>
      <div id="task-list">
        <AnimatePresence propagate>
          {tasks.length === 0 ? (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              style={{ textAlign: 'center', marginTop: 30 }}
            >
              No tasks yet. Add one below!
            </motion.p>
          ) : (
            tasks.map((task, index) => (
              <motion.div
                className="task-row"
                key={`task-${task}-${index}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20, height: 0, marginBottom: 0, padding: 0 }}
                transition={{ duration: 0.2 }}
              >
                <input
                  type="checkbox"
                  onChange={() => {
                    removeTask(index);
                  }}
                  className="task-checkbox"
                />
                <h3 className="task-item" style={{ flex: 1, margin: 0 }}>
                  {task}
                </h3>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
      <div id="task-input-container">
        <input
          type="text"
          placeholder="New task..."
          value={taskText}
          onChange={(e) => setTaskText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') addTask();
          }}
          className="task-input"
          style={{
            backgroundColor: `color-mix(in srgb, ${textColor}, transparent 95%)`,
            color: textColor,
            border: `1px solid color-mix(in srgb, ${textColor}, transparent 90%)`,
            borderRadius: '12px',
            padding: '8px 12px',
            outline: 'none',
            flex: 1,
          }}
        />
        <button
          onClick={() => {
            addTask();
          }}
          className="task-add-btn"
          style={{
            backgroundColor: textColor,
            color: bgColor,
            border: 'none',
            borderRadius: '12px',
            padding: '8px 16px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Add
        </button>
      </div>
    </div>
  );
}
