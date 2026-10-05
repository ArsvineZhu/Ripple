import { OverlayProvider } from './components/OverlayProvider';
import { initializeI18n } from './i18n';
import { SettingsProvider } from './components/SettingsProvider';
import { AppStateProvider } from './components/AppStateProvider';
import { NotificationProvider } from './components/NotificationProvider';
import { createRoot } from 'react-dom/client';
import Island from './Island';
import './styles/base.css';
import './styles/tokens.css';
const container = document.getElementById('root');
if (!container) throw new Error('Root element not found');
const bootstrap = await window.electronAPI.getAppBootstrap();
await initializeI18n(bootstrap.state.settings.language);
createRoot(container).render(
  <NotificationProvider>
    <AppStateProvider initialState={bootstrap.state}>
      <SettingsProvider hasApiKey={bootstrap.hasApiKey}>
        <OverlayProvider>
          <Island />
        </OverlayProvider>
      </SettingsProvider>
    </AppStateProvider>
  </NotificationProvider>,
);
