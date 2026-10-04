import { SettingsProvider } from './components/SettingsProvider';
import { createRoot } from 'react-dom/client';
import Island from './Island';
import './App.css';
const container = document.getElementById('root');
if (!container) throw new Error('Root element not found');
createRoot(container).render(
  <SettingsProvider>
    <Island />
  </SettingsProvider>,
);
