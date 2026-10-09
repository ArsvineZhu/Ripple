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
  ExternalLink,
} from 'lucide-react';
import { author, bugs, license, productName, repository, version } from '../../../package.json';
import type { CSSProperties, ReactNode } from 'react';
import { useState } from 'react';
import { TABS } from '../lib/tabs';
import { Select } from '../components/Select';
import { SearchableSelect } from '../components/SearchableSelect';
import { useSettingsContext } from '../components/SettingsProvider';
import { languagePreference } from '../../shared/i18n';
import { InlineNotices } from '../components/InlineNotices';
import { ElasticScrollArea } from '../components/ElasticScrollArea';
import { supportedTimeZones } from '../lib/date';
import { SETTINGS_TAB_ID } from '../../shared/appState';
import { isValidSearchUrlTemplate } from '../lib/search';
import type { IslandController } from '../hooks/useIslandController';
import styles from './SettingsTab.module.css';

const repositoryUrl = repository.url.replace(/\.git$/, '');
const licenseUrl = `${repositoryUrl}/blob/main/LICENSE`;
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
  | 'aiBaseUrl'
  | 'aiModel'
  | 'appSuggestions'
  | 'autoLaunchEnabled'
  | 'batteryAlertsEnabled'
  | 'bgColor'
  | 'bgImage'
  | 'backgroundImageError'
  | 'currentDisplayId'
  | 'defaultTabId'
  | 'displays'
  | 'handleAutoLaunchChange'
  | 'handleApiBaseUrlChange'
  | 'handleBatteryAlertsChange'
  | 'handleBgColorChange'
  | 'handleBgImageChange'
  | 'handleDisplayChange'
  | 'handleDragEndChecks'
  | 'handleHourFormatChange'
  | 'handleAiModelChange'
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
  | 'handleLeaveDelayChange'
  | 'handlehideNotActiveIslandChange'
  | 'hiddenTabs'
  | 'hideNotActiveIslandEnabled'
  | 'hourFormat'
  | 'isFree'
  | 'islandBorderEnabled'
  | 'islandX'
  | 'islandY'
  | 'hasApiKey'
  | 'largeStandbyEnabled'
  | 'moveTabOrder'
  | 'newQuickApp'
  | 'quickAppMode'
  | 'setQuickAppMode'
  | 'executable'
  | 'setExecutable'
  | 'argumentLines'
  | 'setArgumentLines'
  | 'workingDirectory'
  | 'setWorkingDirectory'
  | 'appUrl'
  | 'setAppUrl'
  | 'leaveDelayMs'
  | 'positionMode'
  | 'quickApps'
  | 'removeQuickApp'
  | 'removeWorkflow'
  | 'savePosition'
  | 'saveApiKey'
  | 'searchUrlTemplate'
  | 'setSearchUrlTemplate'
  | 'timeZone'
  | 'handleTimeZoneChange'
  | 'selectQuickApp'
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
  const { language, handleLanguageChange, backgroundModeEnabled, handleBackgroundModeChange } =
    useSettingsContext();
  const [apiKeyDraft, setApiKeyDraft] = useState('');
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
  const timeZoneOptions = [
    { value: 'system', label: t('system'), keywords: ['system'] },
    ...supportedTimeZones.map((timeZone) => {
      const city = timeZone.split('/').at(-1)?.replaceAll('_', ' ') ?? timeZone;
      return {
        value: timeZone,
        label: timeZone,
        keywords: [timeZone.replaceAll('_', ' '), city],
      };
    }),
  ];
  const validSearchUrlTemplate = isValidSearchUrlTemplate(p.searchUrlTemplate);
  const rangeStyle = (value: number, maximum: number) =>
    ({ '--range-progress': `${(value / maximum) * 100}%` }) as CSSProperties;
  const number = (value: number, decimals = 0) =>
    new Intl.NumberFormat(i18n.language, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value);
  return (
    <ElasticScrollArea id="settings-container" className={styles.container}>
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
        <Field label={t('timeZone')}>
          <SearchableSelect
            label={t('timeZone')}
            value={p.timeZone}
            onValueChange={p.handleTimeZoneChange}
            options={timeZoneOptions}
            searchPlaceholder={t('searchTimeZones')}
            emptyLabel={t('noTimeZoneMatches')}
          />
        </Field>
        <div>
          <Field label={t('autoLaunch')}>
            <Select
              label={t('autoLaunch')}
              value={String(p.autoLaunchEnabled)}
              onValueChange={p.handleAutoLaunchChange}
              options={boolOptions}
            />
          </Field>
          <InlineNotices area="settings" codes={['autoLaunchFailed']} />
        </div>
        <div>
          <Field label={t('backgroundMode')}>
            <Select
              label={t('backgroundMode')}
              value={String(backgroundModeEnabled)}
              onValueChange={handleBackgroundModeChange}
              options={boolOptions}
            />
          </Field>
          <p className={styles.hint}>{t('backgroundModeHint')}</p>
          <InlineNotices area="settings" codes={['backgroundModeFailed']} />
        </div>
        <InlineNotices area="system" />
        <InlineNotices area="settings" codes={['stateSaveFailed']} />
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
      <Section title={t('browserSearchSettings')}>
        <Field label={t('searchEngineUrl')} stacked>
          <input
            className={`${styles.input} ${!validSearchUrlTemplate ? styles.invalidInput : ''}`}
            aria-label={t('searchEngineUrl')}
            aria-invalid={!validSearchUrlTemplate}
            value={p.searchUrlTemplate}
            onChange={(event) => p.setSearchUrlTemplate(event.target.value)}
          />
          <p className={styles.hint}>{t('searchEngineUrlHint')}</p>
          <AnimatePresence initial={false}>
            {!validSearchUrlTemplate && (
              <motion.p
                className={styles.fieldError}
                role="alert"
                initial={{ opacity: 0, filter: 'blur(10px)' }}
                animate={{ opacity: 1, filter: 'blur(0px)' }}
                exit={{ opacity: 0, filter: 'blur(10px)' }}
                transition={{ duration: 0.2 }}
              >
                {t('invalidSearchUrlTemplate')}
              </motion.p>
            )}
          </AnimatePresence>
        </Field>
      </Section>
      <Section title={t('tabManagement')}>
        <p className={styles.hint}>{t('tabInstructions')}</p>
        <div className={styles.tabList}>
          {p.tabOrder.map((id, index) => {
            const tab = TABS.find((item) => item.id === id);
            if (!tab) return null;
            const hidden = id !== SETTINGS_TAB_ID && p.hiddenTabs.includes(id);
            const visibilityLabel =
              id === SETTINGS_TAB_ID ? t('settingsAlwaysVisible') : t(hidden ? 'show' : 'hide');
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
                  disabled={id === SETTINGS_TAB_ID}
                  title={visibilityLabel}
                  aria-label={visibilityLabel}
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
                  className={styles.range}
                  aria-label={t('positionX', { value: number(p.islandX, 1) })}
                  type="range"
                  min="0"
                  max="100"
                  step="0.1"
                  value={p.islandX}
                  style={rangeStyle(p.islandX, 100)}
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
                  className={styles.range}
                  aria-label={t('positionY', { value: number(p.islandY) })}
                  type="range"
                  min="0"
                  max="500"
                  value={p.islandY}
                  style={rangeStyle(p.islandY, 500)}
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
            placeholder={t('backgroundImageHint')}
            value={p.bgImage}
            onChange={p.handleBgImageChange}
            aria-invalid={p.backgroundImageError}
            aria-describedby={p.backgroundImageError ? 'background-image-error' : undefined}
          />
          {p.backgroundImageError && (
            <p id="background-image-error" className={styles.fieldError} role="alert">
              {t('backgroundImageFailed')}
            </p>
          )}
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
        <Field label={t('mouseLeaveDelay', { value: number(p.leaveDelayMs) })} stacked>
          <input
            className={styles.range}
            aria-label={t('mouseLeaveDelay', { value: number(p.leaveDelayMs) })}
            type="range"
            min="0"
            max="2000"
            step="50"
            value={p.leaveDelayMs}
            style={rangeStyle(p.leaveDelayMs, 2000)}
            onChange={(event) => p.handleLeaveDelayChange(event.target.value)}
          />
          <p className={styles.hint}>{t('mouseLeaveDelayHint')}</p>
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
        <Field label={t('quickApps')}>
          <Select
            label={t('quickApps')}
            value={p.quickAppMode}
            onValueChange={p.setQuickAppMode}
            options={[
              { value: 'installed', label: t('installedApps') },
              { value: 'command', label: t('customCommand') },
              { value: 'url', label: t('urlShortcut') },
            ]}
          />
        </Field>
        <div className={styles.appSearch}>
          <div className={styles.row}>
            <input
              className={styles.input}
              aria-label={t('quickAppNameHint')}
              value={p.newQuickApp}
              placeholder={t('quickAppNameHint')}
              onChange={(event) => p.handleQuickAppInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') p.addQuickApp();
                if (event.key === 'Escape') p.setShowSuggestions(false);
              }}
            />
            <button
              className={styles.primaryButton}
              aria-label={t('addApp')}
              onClick={p.addQuickApp}
            >
              <Plus size={18} />
            </button>
          </div>
          {p.quickAppMode === 'installed' && p.showSuggestions && p.appSuggestions.length > 0 && (
            <div className={styles.suggestions} data-island-interactive>
              {p.appSuggestions.map((app) => (
                <button
                  key={`${app.name}-${JSON.stringify(app.target)}`}
                  className={styles.suggestion}
                  onPointerDown={(event) => {
                    event.preventDefault();
                    p.selectQuickApp(app);
                  }}
                >
                  <span>{app.name}</span>
                  <span className={styles.launchHint}>{t('installedApps')}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        {p.quickAppMode === 'command' && (
          <div className={styles.quickAppFields}>
            <input
              className={styles.input}
              aria-label={t('executablePath')}
              placeholder={t('executablePath')}
              value={p.executable}
              onChange={(event) => p.setExecutable(event.target.value)}
            />
            <textarea
              className={`${styles.input} ${styles.argumentInput}`}
              aria-label={t('arguments')}
              placeholder={t('argumentsHint')}
              value={p.argumentLines}
              onChange={(event) => p.setArgumentLines(event.target.value)}
            />
            <input
              className={styles.input}
              aria-label={t('workingDirectory')}
              placeholder={t('workingDirectory')}
              value={p.workingDirectory}
              onChange={(event) => p.setWorkingDirectory(event.target.value)}
            />
          </div>
        )}
        {p.quickAppMode === 'url' && (
          <input
            className={styles.input}
            aria-label={t('applicationUrl')}
            placeholder="https://example.com"
            value={p.appUrl}
            onChange={(event) => p.setAppUrl(event.target.value)}
          />
        )}
        <InlineNotices area="quick-apps" />
        <div className={styles.appList}>
          <AnimatePresence propagate>
            {p.quickApps.map((app, index) => (
              <motion.div
                key={app.id}
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
        <Field label={t('aiBaseUrl')} stacked>
          <input
            className={styles.input}
            aria-label={t('aiBaseUrl')}
            value={p.aiBaseUrl}
            placeholder="https://api.openai.com/v1"
            onChange={(event) => p.handleApiBaseUrlChange(event.target.value)}
          />
        </Field>
        <Field label={t('aiModel')} stacked>
          <input
            className={styles.input}
            aria-label={t('aiModel')}
            value={p.aiModel}
            placeholder="model-name"
            onChange={(event) => p.handleAiModelChange(event.target.value)}
          />
        </Field>
        <Field label={t('apiKey')} stacked>
          <div className={styles.keyRow}>
            <input
              className={[styles.input, styles.keyInput].join(' ')}
              aria-label={t('apiKey')}
              type="password"
              autoComplete="new-password"
              placeholder={t('apiKeyHint')}
              value={apiKeyDraft}
              onChange={(event) => setApiKeyDraft(event.target.value)}
            />
            <div className={styles.keyActions}>
              <button
                className={styles.primaryButton}
                disabled={!apiKeyDraft.trim()}
                onClick={() => {
                  void p.saveApiKey(apiKeyDraft).then((saved) => {
                    if (saved) setApiKeyDraft('');
                  });
                }}
              >
                {p.hasApiKey ? t('changeApiKey') : t('saveApiKey')}
              </button>
              {p.hasApiKey && (
                <button
                  className={styles.dangerButton}
                  title={t('removeApiKey')}
                  aria-label={t('removeApiKey')}
                  onClick={() => {
                    void p.saveApiKey('').then((saved) => {
                      if (saved) setApiKeyDraft('');
                    });
                  }}
                >
                  <Trash2 size={14} aria-hidden="true" />
                  <span>{t('remove')}</span>
                </button>
              )}
            </div>
          </div>
          {p.hasApiKey && <p className={styles.keyHint}>{t('apiKeyConfigured')}</p>}
          <InlineNotices area="settings" codes={['secretStorageUnavailable']} />
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
      <Section title={t('aboutSystem')}>
        <div className={styles.aboutRows}>
          <Field label={t('applicationName')}>
            <span className={styles.aboutValue}>{productName}</span>
          </Field>
          <Field label={t('appVersion')}>
            <span className={styles.aboutValue}>{version}</span>
          </Field>
          <Field label={t('developer')}>
            <span className={styles.aboutValue}>{author.name}</span>
          </Field>
          <Field label={t('license')}>
            <button
              type="button"
              className={styles.aboutLink}
              onClick={() => void window.electronAPI.openExternal(licenseUrl)}
            >
              {license}
              <ExternalLink size={13} aria-hidden="true" />
            </button>
          </Field>
          <Field label={t('repository')}>
            <button
              type="button"
              className={styles.aboutLink}
              onClick={() => void window.electronAPI.openExternal(repositoryUrl)}
            >
              {repositoryUrl.replace(/^https:\/\//, '')}
              <ExternalLink size={13} aria-hidden="true" />
            </button>
          </Field>
          <Field label={t('feedback')}>
            <button
              type="button"
              className={styles.aboutLink}
              onClick={() => void window.electronAPI.openExternal(bugs.url)}
            >
              {t('reportIssue')}
              <ExternalLink size={13} aria-hidden="true" />
            </button>
          </Field>
          <div className={styles.aboutDiagnostic}>
            <Field label={t('diagnostics')}>
              <button
                type="button"
                className={styles.primaryButton}
                onClick={() => {
                  void window.electronAPI.openDiagnosticsFolder().catch(() => {});
                }}
              >
                {t('openDiagnosticsFolder')}
              </button>
            </Field>
            <InlineNotices area="settings" codes={['diagnosticsFolderOpenFailed']} />
          </div>
        </div>
      </Section>
    </ElasticScrollArea>
  );
}
