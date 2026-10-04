import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion } from 'motion/react';
import {
  Eye,
  EyeOff,
  GripVertical,
  ChevronUp,
  ChevronDown,
  Plus,
  Star,
  Trash2,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { storage } from '../lib/storage';
import { TABS } from '../lib/tabs';
import { Select } from '../components/Select';
import { useSettingsContext } from '../components/SettingsProvider';
import { languagePreference } from '../../shared/i18n';
import type { IslandController } from '../hooks/useIslandController';
import styles from './SettingsTab.module.css';
interface SectionProps {
  title: string;
  children: ReactNode;
}
function Section({ title, children }: SectionProps) {
  return (
    <section className={styles.section}>
      <h3 className={styles.sectionHeading}>{title}</h3>
      {children}
    </section>
  );
}
function Field({
  label,
  children,
  stacked = false,
}: {
  label: string;
  children: ReactNode;
  stacked?: boolean;
}) {
  return (
    <div className={`${styles.row} ${stacked ? styles.stacked : ''}`}>
      <span className={styles.label}>{label}</span>
      {children}
    </div>
  );
}
type Props = Pick<
  IslandController,
  | 'addQuickApp'
  | 'addWorkflow'
  | 'aiModel'
  | 'aiProvider'
  | 'appSuggestions'
  | 'autoLaunchEnabled'
  | 'batteryAlertsEnabled'
  | 'bgColor'
  | 'bgImage'
  | 'currentDisplayId'
  | 'defaultTabId'
  | 'displays'
  | 'handleAutoLaunchChange'
  | 'handleBatteryAlertsChange'
  | 'handleBgColorChange'
  | 'handleBgImageChange'
  | 'handleDisplayChange'
  | 'handleDragEndChecks'
  | 'handleHourFormatChange'
  | 'handleIslandBorderChange'
  | 'handleIslandXChange'
  | 'handleIslandYChange'
  | 'handleLargeStandbyChange'
  | 'handlePositionChange'
  | 'handleQaChange'
  | 'handleQuickAppInput'
  | 'handleShowInfoWhenIdleChange'
  | 'handleStandbyChange'
  | 'handleTextColorChange'
  | 'handleWeatherUnitChange'
  | 'handlehideNotActiveIslandChange'
  | 'hiddenTabs'
  | 'hideNotActiveIslandEnabled'
  | 'hourFormat'
  | 'isFree'
  | 'islandBorderEnabled'
  | 'islandX'
  | 'islandY'
  | 'largeStandbyEnabled'
  | 'moveTabOrder'
  | 'newQuickApp'
  | 'positionMode'
  | 'quickApps'
  | 'removeQuickApp'
  | 'removeWorkflow'
  | 'savePosition'
  | 'selectQuickApp'
  | 'setAiModel'
  | 'setAiProvider'
  | 'setDefaultTabId'
  | 'setShowSuggestions'
  | 'setTheme'
  | 'setWeatherLocation'
  | 'setWorkflowName'
  | 'setWorkflowUrls'
  | 'showInfoWhenIdleEnabled'
  | 'showSuggestions'
  | 'standbyBorderEnabled'
  | 'tabOrder'
  | 'textColor'
  | 'theme'
  | 'toggleTabVisibility'
  | 'updateDragging'
  | 'weatherLocation'
  | 'weatherUnit'
  | 'workflowName'
  | 'workflowUrls'
  | 'workflows'
>;
export function SettingsTab(p: Props) {
  const { t, i18n } = useTranslation();
  const { language, handleLanguageChange } = useSettingsContext();
  const boolOptions = [
    { value: 'true', label: t('enabled') },
    { value: 'false', label: t('disabled') },
  ];
  const positions = [
    { value: 'top-left', label: t('topLeft') },
    { value: 'top-center', label: t('topCenter') },
    { value: 'top-right', label: t('topRight') },
    { value: 'bottom-left', label: t('bottomLeft') },
    { value: 'bottom-center', label: t('bottomCenter') },
    { value: 'bottom-right', label: t('bottomRight') },
  ];
  const number = (value: number, decimals = 0) =>
    new Intl.NumberFormat(i18n.language, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value);
  return (
    <div id="settings-container" className={styles.container}>
      <Section title={t('general')}>
        <Field label={t('language')}>
          <Select
            label={t('language')}
            value={language}
            onValueChange={(value) => handleLanguageChange(languagePreference(value))}
            options={[
              { value: 'system', label: t('system') },
              { value: 'zh-CN', label: '简体中文' },
              { value: 'en', label: 'English' },
              { value: 'zh-TW', label: '繁體中文' },
              { value: 'ja', label: '日本語' },
            ]}
          />
        </Field>
        <Field label={t('hourFormat')}>
          <Select
            label={t('hourFormat')}
            value={p.hourFormat ? '12-hr' : '24-hr'}
            onValueChange={p.handleHourFormatChange}
            options={[
              { value: '12-hr', label: t('hour12') },
              { value: '24-hr', label: t('hour24') },
            ]}
          />
        </Field>
        {window.electronAPI?.platform !== 'darwin' && (
          <Field label={t('autoLaunch')}>
            <Select
              label={t('autoLaunch')}
              value={String(p.autoLaunchEnabled)}
              onValueChange={p.handleAutoLaunchChange}
              options={boolOptions}
            />
          </Field>
        )}
        {p.displays.length > 0 && (
          <Field label={t('display')}>
            <Select
              label={t('display')}
              value={p.currentDisplayId || String(p.displays[0].id)}
              onValueChange={p.handleDisplayChange}
              options={p.displays.map((display, index) => ({
                value: String(display.id),
                label:
                  display.label === `Display ${display.id}`
                    ? t('displayFallback', { number: number(index + 1) })
                    : display.label,
              }))}
            />
          </Field>
        )}
      </Section>
      <Section title={t('tabManagement')}>
        <p className={styles.hint}>{t('tabInstructions')}</p>
        <div className={styles.tabList}>
          {p.tabOrder.map((id, index) => {
            const tab = TABS.find((item) => item.id === id);
            if (!tab) return null;
            const hidden = p.hiddenTabs.includes(id);
            return (
              <div
                key={id}
                className={`${styles.tabItem} ${hidden ? styles.hidden : ''}`}
                draggable
                data-island-interactive
                onDragStart={(event) => {
                  event.dataTransfer.setData('text/plain', String(index));
                  event.currentTarget.dataset.dragging = 'true';
                }}
                onDragEnd={(event) => {
                  delete event.currentTarget.dataset.dragging;
                }}
                onDragOver={(event) => {
                  event.preventDefault();
                  event.currentTarget.dataset.dropTarget = 'true';
                }}
                onDragLeave={(event) => {
                  delete event.currentTarget.dataset.dropTarget;
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  delete event.currentTarget.dataset.dropTarget;
                  p.moveTabOrder(Number(event.dataTransfer.getData('text/plain')), index);
                }}
              >
                <GripVertical size={14} className={styles.grip} />
                {tab.icon(p.textColor)}
                <span className={styles.tabName}>{t(tab.nameKey)}</span>
                <button
                  className={styles.iconButton}
                  title={t('defaultTab')}
                  aria-label={t('defaultTab')}
                  onClick={() => {
                    p.setDefaultTabId(id);
                    storage.setItem('default-tab', id);
                  }}
                >
                  <Star
                    size={15}
                    fill={p.defaultTabId === id ? '#ffd700' : 'none'}
                    color={p.defaultTabId === id ? '#ffd700' : 'currentColor'}
                  />
                </button>
                <button
                  className={styles.iconButton}
                  title={t(hidden ? 'show' : 'hide')}
                  aria-label={t(hidden ? 'show' : 'hide')}
                  onClick={() => p.toggleTabVisibility(id)}
                >
                  {hidden ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
                <button
                  className={styles.iconButton}
                  disabled={index === 0}
                  aria-label={t('moveTabUp')}
                  onClick={() => p.moveTabOrder(index, index - 1)}
                >
                  <ChevronUp size={15} />
                </button>
                <button
                  className={styles.iconButton}
                  disabled={index === p.tabOrder.length - 1}
                  aria-label={t('moveTabDown')}
                  onClick={() => p.moveTabOrder(index, index + 1)}
                >
                  <ChevronDown size={15} />
                </button>
              </div>
            );
          })}
        </div>
      </Section>
      <Section title={t('islandStyle')}>
        <Field label={t('theme')}>
          <Select
            label={t('theme')}
            value={p.theme === 'default' ? 'none' : p.theme}
            onValueChange={p.setTheme}
            options={[
              { value: 'none', label: t('defaultTheme') },
              { value: 'sleek-black', label: t('sleekBlack') },
              { value: 'win95', label: 'Windows 95' },
            ]}
          />
        </Field>
        <div className={styles.positionCard}>
          <span className={styles.positionHeading}>{t('positionMode')}</span>
          <div className={styles.positionGrid}>
            {positions.map((position) => (
              <label key={position.value} className={styles.radioLabel}>
                <input
                  type="radio"
                  name="positionMode"
                  value={position.value}
                  checked={p.positionMode === position.value}
                  onChange={() => p.handlePositionChange(position.value)}
                />
                <span className={styles.radioCustom} />
                <span>{position.label}</span>
              </label>
            ))}
          </div>
          <div className={styles.separator} />
          <label className={styles.radioLabel}>
            <input
              type="radio"
              name="positionMode"
              value="free"
              checked={p.isFree}
              onChange={() => p.handlePositionChange('free')}
            />
            <span className={styles.radioCustom} />
            <span>{t('free')}</span>
          </label>
        </div>
        <AnimatePresence propagate>
          {p.isFree && (
            <motion.div
              className={styles.manualPosition}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.15 }}
            >
              <Field label={t('positionX', { value: number(p.islandX, 1) })}>
                <input
                  aria-label={t('positionX', { value: number(p.islandX, 1) })}
                  type="range"
                  min="0"
                  max="100"
                  step="0.1"
                  value={p.islandX}
                  onPointerDown={(event) => {
                    event.stopPropagation();
                    p.updateDragging(true);
                  }}
                  onChange={p.handleIslandXChange}
                  onPointerUp={(event) => {
                    event.stopPropagation();
                    p.savePosition();
                    p.handleDragEndChecks();
                    event.currentTarget.blur();
                  }}
                />
              </Field>
              <Field label={t('positionY', { value: number(p.islandY) })}>
                <input
                  aria-label={t('positionY', { value: number(p.islandY) })}
                  type="range"
                  min="0"
                  max="500"
                  value={p.islandY}
                  onPointerDown={(event) => {
                    event.stopPropagation();
                    p.updateDragging(true);
                  }}
                  onChange={p.handleIslandYChange}
                  onPointerUp={(event) => {
                    event.stopPropagation();
                    p.savePosition();
                    p.handleDragEndChecks();
                    event.currentTarget.blur();
                  }}
                />
              </Field>
            </motion.div>
          )}
        </AnimatePresence>
        <Field label={t('islandBorder')}>
          <Select
            label={t('islandBorder')}
            value={String(p.islandBorderEnabled)}
            onValueChange={p.handleIslandBorderChange}
            options={[
              { value: 'true', label: t('show') },
              { value: 'false', label: t('hide') },
            ]}
          />
        </Field>
        <Field label={t('hideInactive')}>
          <Select
            label={t('hideInactive')}
            value={String(p.hideNotActiveIslandEnabled)}
            onValueChange={p.handlehideNotActiveIslandChange}
            options={[
              { value: 'true', label: t('yes') },
              { value: 'false', label: t('no') },
            ]}
          />
        </Field>
      </Section>
      <Section title={t('colorsAssets')}>
        <Field label={t('islandColor')}>
          <input
            className={`${styles.input} ${styles.colorInput}`}
            aria-label={t('islandColor')}
            placeholder="#000000"
            value={p.bgColor}
            onChange={p.handleBgColorChange}
          />
        </Field>
        <Field label={t('textColor')}>
          <input
            className={`${styles.input} ${styles.colorInput}`}
            aria-label={t('textColor')}
            placeholder="#FAFAFA"
            value={p.textColor}
            onChange={p.handleTextColorChange}
          />
        </Field>
        <Field label={t('backgroundImage')} stacked>
          <input
            className={styles.input}
            aria-label={t('backgroundImage')}
            placeholder="https://..."
            value={p.bgImage}
            onChange={p.handleBgImageChange}
          />
        </Field>
      </Section>
      <Section title={t('features')}>
        <Field label={t('batteryAlerts')}>
          <Select
            label={t('batteryAlerts')}
            value={String(p.batteryAlertsEnabled)}
            onValueChange={p.handleBatteryAlertsChange}
            options={boolOptions}
          />
        </Field>
        <Field label={t('standby')}>
          <Select
            label={t('standby')}
            value={String(p.standbyBorderEnabled)}
            onValueChange={p.handleStandbyChange}
            options={boolOptions}
          />
        </Field>
        <Field label={t('largeStandby')}>
          <Select
            label={t('largeStandby')}
            value={String(p.largeStandbyEnabled)}
            onValueChange={p.handleLargeStandbyChange}
            options={boolOptions}
          />
        </Field>
        <Field label={t('idleInfo')}>
          <Select
            label={t('idleInfo')}
            value={String(p.showInfoWhenIdleEnabled)}
            onValueChange={p.handleShowInfoWhenIdleChange}
            options={boolOptions}
          />
        </Field>
      </Section>
      <Section title={t('weather')}>
        <Field label={t('location')}>
          <input
            className={styles.input}
            aria-label={t('location')}
            placeholder={t('locationHint')}
            value={p.weatherLocation}
            onChange={(event) => {
              p.setWeatherLocation(event.target.value);
              storage.setItem('location', event.target.value);
            }}
          />
        </Field>
        <Field label={t('unit')}>
          <Select
            label={t('unit')}
            value={p.weatherUnit}
            onValueChange={p.handleWeatherUnitChange}
            options={[
              { value: 'f', label: t('fahrenheit') },
              { value: 'c', label: t('celsius') },
            ]}
          />
        </Field>
      </Section>
      <Section title={t('quickApps')}>
        <div className={styles.appSearch}>
          <div className={styles.row}>
            <input
              className={styles.input}
              aria-label={t('addApp')}
              value={p.newQuickApp}
              placeholder={t('addAppHint')}
              onChange={(event) => p.handleQuickAppInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') p.addQuickApp();
                if (event.key === 'Escape') p.setShowSuggestions(false);
              }}
              onBlur={() => p.setShowSuggestions(false)}
            />
            <button
              className={styles.primaryButton}
              aria-label={t('addApp')}
              onClick={p.addQuickApp}
            >
              <Plus size={18} />
            </button>
          </div>
          {p.showSuggestions && p.appSuggestions.length > 0 && (
            <div className={styles.suggestions} data-island-interactive>
              {p.appSuggestions.map((app) => (
                <button
                  key={app.launch}
                  className={styles.suggestion}
                  onPointerDown={(event) => {
                    event.preventDefault();
                    p.selectQuickApp(app);
                  }}
                >
                  <span>{app.name}</span>
                  <span className={styles.launchHint}>{app.launch}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <div className={styles.appList}>
          <AnimatePresence propagate>
            {p.quickApps.map((app, index) => (
              <motion.div
                key={`qa-${index}`}
                className={styles.appRow}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, x: -20, height: 0, padding: 0 }}
                transition={{ duration: 0.2 }}
              >
                <input
                  className={styles.appName}
                  aria-label={t('appName')}
                  value={app.name}
                  onChange={(event) => p.handleQaChange(index, event.target.value)}
                />
                <button
                  className={styles.dangerButton}
                  aria-label={t('removeApp', { name: app.name })}
                  onClick={() => p.removeQuickApp(index)}
                >
                  <Trash2 size={16} />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </Section>
      <Section title={t('integrations')}>
        <Field label={t('aiProvider')}>
          <Select
            label={t('aiProvider')}
            value={p.aiProvider}
            onValueChange={(value) => {
              p.setAiProvider(value);
              storage.setItem('ai-provider', value);
              const model =
                value === 'groq' ? 'llama-3.3-70b-versatile' : 'meta-llama/llama-3.3-70b-instruct';
              p.setAiModel(model);
              storage.setItem('ai-model', model);
            }}
            options={[
              { value: 'groq', label: 'Groq' },
              { value: 'openrouter', label: 'OpenRouter' },
            ]}
          />
        </Field>
        <Field label={t('aiModel')} stacked>
          <input
            className={styles.input}
            aria-label={t('aiModel')}
            value={p.aiModel}
            placeholder={
              p.aiProvider === 'groq'
                ? 'llama-3.3-70b-versatile'
                : 'meta-llama/llama-3.3-70b-instruct'
            }
            onChange={(event) => {
              p.setAiModel(event.target.value);
              storage.setItem('ai-model', event.target.value);
            }}
          />
        </Field>
        <Field label={t('apiKey')} stacked>
          <input
            className={styles.input}
            aria-label={t('apiKey')}
            type="password"
            placeholder={p.aiProvider === 'groq' ? 'gsk_...' : 'sk-or-...'}
            defaultValue={storage.getItem('api-key') || ''}
            onChange={(event) => storage.setItem('api-key', event.target.value)}
          />
        </Field>
      </Section>
      <Section title={t('manageWorkflows')}>
        <div id="add-workflow-form" className={styles.workflowForm}>
          <label className={styles.label} htmlFor="workflow-name">
            {t('workflowName')}
          </label>
          <input
            id="workflow-name"
            className={styles.input}
            placeholder={t('workflowNameHint')}
            value={p.workflowName}
            onChange={(event) => p.setWorkflowName(event.target.value)}
          />
          <label className={styles.workflowLabel} htmlFor="workflow-apps">
            {t('workflowApps')}
          </label>
          <textarea
            id="workflow-apps"
            className={`${styles.input} ${styles.workflowInput}`}
            placeholder={t('workflowAppsHint')}
            value={p.workflowUrls}
            onChange={(event) => p.setWorkflowUrls(event.target.value)}
          />
          <button className={styles.primaryButton} onClick={p.addWorkflow}>
            {t('saveWorkflow')}
          </button>
        </div>
        <div id="workflows-list" className={styles.workflowList}>
          <AnimatePresence propagate>
            {p.workflows.map((workflow, index) => (
              <motion.div
                key={`wf-${workflow.name}-${index}`}
                className={styles.workflowRow}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, x: -20, height: 0, padding: 0 }}
                transition={{ duration: 0.2 }}
              >
                <div className={styles.workflowSummary}>
                  <strong>{workflow.name}</strong>
                  <span className={styles.itemCount}>
                    {t('items', { count: workflow.urls.length })}
                  </span>
                </div>
                <button className={styles.dangerButton} onClick={() => p.removeWorkflow(index)}>
                  <Trash2 size={14} />
                  <span>{t('remove')}</span>
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </Section>
    </div>
  );
}
