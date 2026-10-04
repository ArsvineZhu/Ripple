import { OverlayProvider } from './components/OverlayProvider';
import { initializeI18n } from './i18n';
import { SettingsProvider } from './components/SettingsProvider';
import { createRoot } from 'react-dom/client';
import Island from './Island';
import './styles/base.css';
import './styles/tokens.css';
const container = document.getElementById('root');
if (!container) throw new Error('Root element not found');
await initializeI18n();
createRoot(container).render(
  <SettingsProvider>
    <OverlayProvider>
      <Island />
    </OverlayProvider>
  </SettingsProvider>,
);
