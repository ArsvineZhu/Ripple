import clearState from './queries/clear-state.sql?raw';
import connectionConfiguration from './connection.sql?raw';
import deleteSecret from './queries/delete-secret.sql?raw';
import hasSecret from './queries/has-secret.sql?raw';
import insertQuickApp from './queries/insert-quick-app.sql?raw';
import insertTask from './queries/insert-task.sql?raw';
import insertWorkflow from './queries/insert-workflow.sql?raw';
import selectQuickApps from './queries/select-quick-apps.sql?raw';
import selectSecret from './queries/select-secret.sql?raw';
import selectSettings from './queries/select-settings.sql?raw';
import selectStateExists from './queries/select-state-exists.sql?raw';
import selectTasks from './queries/select-tasks.sql?raw';
import selectUserVersion from './queries/select-user-version.sql?raw';
import selectWorkflows from './queries/select-workflows.sql?raw';
import upsertSecret from './queries/upsert-secret.sql?raw';
import upsertSetting from './queries/upsert-setting.sql?raw';

export const queries = {
  clearState,
  connectionConfiguration,
  deleteSecret,
  hasSecret,
  insertQuickApp,
  insertTask,
  insertWorkflow,
  selectQuickApps,
  selectSecret,
  selectSettings,
  selectStateExists,
  selectTasks,
  selectUserVersion,
  selectWorkflows,
  upsertSecret,
  upsertSetting,
} as const;
