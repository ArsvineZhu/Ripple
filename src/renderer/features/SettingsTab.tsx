import { storage } from '../lib/storage';
import { TABS } from '../lib/tabs';
import { GripVertical } from 'lucide-react';
import { Star } from 'lucide-react';
import { EyeOff } from 'lucide-react';
import { Eye } from 'lucide-react';
import { ChevronLeft } from 'lucide-react';
import { AnimatePresence } from 'motion/react';
import { motion } from 'motion/react';
import { Plus } from 'lucide-react';
import { Trash2 } from 'lucide-react';
import type { IslandController } from '../hooks/useIslandController';
type Props = Pick<
  IslandController,
  | 'hourFormat'
  | 'handleHourFormatChange'
  | 'autoLaunchEnabled'
  | 'handleAutoLaunchChange'
  | 'displays'
  | 'currentDisplayId'
  | 'handleDisplayChange'
  | 'tabOrder'
  | 'hiddenTabs'
  | 'textColor'
  | 'moveTabOrder'
  | 'setDefaultTabId'
  | 'defaultTabId'
  | 'toggleTabVisibility'
  | 'theme'
  | 'setTheme'
  | 'positionMode'
  | 'setPositionMode'
  | 'isFree'
  | 'islandX'
  | 'updateDragging'
  | 'handleIslandXChange'
  | 'savePosition'
  | 'handleDragEndChecks'
  | 'islandY'
  | 'handleIslandYChange'
  | 'islandBorderEnabled'
  | 'handleIslandBorderChange'
  | 'hideNotActiveIslandEnabled'
  | 'handlehideNotActiveIslandChange'
  | 'bgColor'
  | 'handleBgColorChange'
  | 'handleTextColorChange'
  | 'bgImage'
  | 'handleBgImageChange'
  | 'batteryAlertsEnabled'
  | 'handleBatteryAlertsChange'
  | 'standbyBorderEnabled'
  | 'handleStandbyChange'
  | 'largeStandbyEnabled'
  | 'handleLargeStandbyChange'
  | 'showInfoWhenIdleEnabled'
  | 'handleShowInfoWhenIdleChange'
  | 'weatherLocation'
  | 'setWeatherLocation'
  | 'weatherUnit'
  | 'handleWeatherUnitChange'
  | 'newQuickApp'
  | 'handleQuickAppInput'
  | 'selectQuickApp'
  | 'setShowSuggestions'
  | 'addQuickApp'
  | 'showSuggestions'
  | 'appSuggestions'
  | 'quickApps'
  | 'handleQaChange'
  | 'removeQuickApp'
  | 'aiProvider'
  | 'setAiProvider'
  | 'setAiModel'
  | 'aiModel'
  | 'workflowName'
  | 'setWorkflowName'
  | 'workflowUrls'
  | 'setWorkflowUrls'
  | 'addWorkflow'
  | 'workflows'
  | 'removeWorkflow'
>;
export function SettingsTab({
  hourFormat,
  handleHourFormatChange,
  autoLaunchEnabled,
  handleAutoLaunchChange,
  displays,
  currentDisplayId,
  handleDisplayChange,
  tabOrder,
  hiddenTabs,
  textColor,
  moveTabOrder,
  setDefaultTabId,
  defaultTabId,
  toggleTabVisibility,
  theme,
  setTheme,
  positionMode,
  setPositionMode,
  isFree,
  islandX,
  updateDragging,
  handleIslandXChange,
  savePosition,
  handleDragEndChecks,
  islandY,
  handleIslandYChange,
  islandBorderEnabled,
  handleIslandBorderChange,
  hideNotActiveIslandEnabled,
  handlehideNotActiveIslandChange,
  bgColor,
  handleBgColorChange,
  handleTextColorChange,
  bgImage,
  handleBgImageChange,
  batteryAlertsEnabled,
  handleBatteryAlertsChange,
  standbyBorderEnabled,
  handleStandbyChange,
  largeStandbyEnabled,
  handleLargeStandbyChange,
  showInfoWhenIdleEnabled,
  handleShowInfoWhenIdleChange,
  weatherLocation,
  setWeatherLocation,
  weatherUnit,
  handleWeatherUnitChange,
  newQuickApp,
  handleQuickAppInput,
  selectQuickApp,
  setShowSuggestions,
  addQuickApp,
  showSuggestions,
  appSuggestions,
  quickApps,
  handleQaChange,
  removeQuickApp,
  aiProvider,
  setAiProvider,
  setAiModel,
  aiModel,
  workflowName,
  setWorkflowName,
  workflowUrls,
  setWorkflowUrls,
  addWorkflow,
  workflows,
  removeWorkflow,
}: Props) {
  return (
    <div id="settings-container">
      <div className="settings-section">
        <h3
          style={{
            fontSize: 13,
            textTransform: 'uppercase',
            opacity: 0.5,
            letterSpacing: '0.05em',
          }}
        >
          General
        </h3>
        <div className="settings-row">
          <span className="settings-label">12/24 Hour Format</span>
          <select value={hourFormat ? '12-hr' : '24-hr'} onChange={handleHourFormatChange}>
            <option value="12-hr">12-hour</option>
            <option value="24-hr">24-hour</option>
          </select>
        </div>
        {window.electronAPI?.platform !== 'darwin' && (
          <div className="settings-row">
            <span className="settings-label">Auto Launch on Boot</span>
            <select value={autoLaunchEnabled ? 'true' : 'false'} onChange={handleAutoLaunchChange}>
              <option value="true">Enabled</option>
              <option value="false">Disabled</option>
            </select>
          </div>
        )}
        {displays.length > 0 && (
          <div className="settings-row">
            <span className="settings-label">Target Display</span>
            <select value={currentDisplayId} onChange={handleDisplayChange}>
              {displays.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
      <div className="settings-section">
        <h3
          style={{
            fontSize: 13,
            textTransform: 'uppercase',
            opacity: 0.5,
            letterSpacing: '0.05em',
            marginBottom: '4px',
          }}
        >
          Tab Management
        </h3>
        <p style={{ fontSize: 11, opacity: 0.4, marginTop: -8, marginBottom: 8 }}>
          Drag to reorder, click eye to hide.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {tabOrder.map((id, i) => {
            const tabDef = TABS.find((t) => t.id === id);
            if (!tabDef) return null;
            const isHidden = hiddenTabs.includes(id);
            return (
              <div
                key={id}
                className={`tab-order-item ${isHidden ? 'hidden' : ''}`}
                style={{ cursor: 'grab' }}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('text/plain', String(i));
                  e.currentTarget.style.opacity = '0.4';
                  e.currentTarget.style.borderStyle = 'dashed';
                }}
                onDragEnd={(e) => {
                  e.currentTarget.style.opacity = isHidden ? '0.45' : '1';
                  e.currentTarget.style.borderStyle = isHidden ? 'dashed' : 'solid';
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.currentTarget.style.background = `color-mix(in srgb, ${textColor}, transparent 90%)`;
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onDragLeave={(e) => {
                  e.currentTarget.style.background = '';
                  e.currentTarget.style.transform = '';
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.currentTarget.style.background = '';
                  e.currentTarget.style.transform = '';
                  const fromIdx = parseInt(e.dataTransfer.getData('text/plain'));
                  moveTabOrder(fromIdx, i);
                }}
              >
                <GripVertical size={16} style={{ opacity: 0.3, cursor: 'grab' }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
                  {tabDef.icon(textColor)}
                  <span style={{ fontSize: 14, fontWeight: 500 }}>{tabDef.name}</span>
                </div>
                <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                  <button
                    className="tab-order-btn"
                    onClick={() => {
                      setDefaultTabId(id);
                      storage.setItem('default-tab', id);
                    }}
                    title="Set as default"
                    style={{
                      opacity: defaultTabId === id ? 1 : 0.3,
                      color: defaultTabId === id ? '#FFD700' : textColor,
                    }}
                  >
                    <Star size={16} fill={defaultTabId === id ? '#FFD700' : 'none'} />
                  </button>
                  <div
                    style={{
                      width: 1,
                      height: 16,
                      background: textColor,
                      opacity: 0.1,
                      margin: '0 4px',
                    }}
                  />
                  <button
                    className="tab-order-btn"
                    onClick={() => toggleTabVisibility(id)}
                    title={isHidden ? 'Show' : 'Hide'}
                    style={{ opacity: isHidden ? 1 : 0.6 }}
                  >
                    {isHidden ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                  <div
                    style={{
                      width: 1,
                      height: 16,
                      background: textColor,
                      opacity: 0.1,
                      margin: '0 4px',
                    }}
                  />
                  <button
                    className="tab-order-btn"
                    disabled={i === 0}
                    onClick={() => moveTabOrder(i, i - 1)}
                  >
                    <ChevronLeft size={16} style={{ transform: 'rotate(90deg)' }} />
                  </button>
                  <button
                    className="tab-order-btn"
                    disabled={i === tabOrder.length - 1}
                    onClick={() => moveTabOrder(i, i + 1)}
                  >
                    <ChevronLeft size={16} style={{ transform: 'rotate(-90deg)' }} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="settings-section">
        <h3
          style={{
            fontSize: 13,
            textTransform: 'uppercase',
            opacity: 0.5,
            letterSpacing: '0.05em',
          }}
        >
          Island Style
        </h3>
        <div className="settings-row">
          <span className="settings-label">Theme</span>
          <select value={theme} onChange={(e) => setTheme(e.target.value)}>
            <option value="none">Default</option>
            <option value="sleek-black">Sleek Black</option>
            <option value="win95">Windows 95</option>
          </select>
        </div>
        <div
          className="settings-section"
          style={{
            alignItems: 'center',
            background: 'rgba(255,255,255,0.03)',
            padding: '15px',
            borderRadius: '18px',
            border: '1px solid rgba(255,255,255,0.05)',
          }}
        >
          <span
            className="settings-label"
            style={{ textAlign: 'center', marginBottom: '8px', opacity: 1, color: textColor }}
          >
            Position Mode
          </span>
          <div
            className="radio-group"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              width: '100%',
              gap: '15px 10px',
            }}
          >
            {[
              { val: 'top-left', label: 'Top L' },
              { val: 'top-center', label: 'Top C' },
              { val: 'top-right', label: 'Top R' },
              { val: 'bottom-left', label: 'Bot L' },
              { val: 'bottom-center', label: 'Bot C' },
              { val: 'bottom-right', label: 'Bot R' },
            ].map((mode) => (
              <label key={mode.val} className="radio-label" style={{ justifyContent: 'center' }}>
                <input
                  type="radio"
                  name="positionMode"
                  value={mode.val}
                  checked={positionMode === mode.val}
                  onChange={(e) => {
                    setPositionMode(e.target.value);
                    storage.setItem('position-mode', e.target.value);
                  }}
                />
                <span className="radio-custom"></span>
                {mode.label}
              </label>
            ))}
          </div>
          <div
            style={{
              width: '100%',
              height: '1px',
              background: 'rgba(255,255,255,0.1)',
              margin: '10px 0',
            }}
          ></div>
          <label className="radio-label" style={{ justifyContent: 'center' }}>
            <input
              type="radio"
              name="positionMode"
              value="free"
              checked={positionMode === 'free'}
              onChange={(e) => {
                setPositionMode(e.target.value);
                storage.setItem('position-mode', e.target.value);
              }}
            />
            <span className="radio-custom"></span>
            FREE (MANUAL)
          </label>
        </div>
        <AnimatePresence propagate>
          {isFree && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.15 }}
              style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: '12px' }}
            >
              <div className="settings-row">
                <span className="settings-label">Position X ({islandX.toFixed(1)}%)</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="0.1"
                  value={islandX}
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    updateDragging(true);
                  }}
                  onChange={handleIslandXChange}
                  onPointerUp={(e) => {
                    e.stopPropagation();
                    savePosition();
                    handleDragEndChecks();
                    e.currentTarget.blur();
                  }}
                  list="tickmarks"
                  style={{ flex: 1, accentColor: textColor }}
                />
                <datalist id="tickmarks">
                  <option value="50" label="50%"></option>
                </datalist>
              </div>
              <div className="settings-row">
                <span className="settings-label">Position Y ({islandY}px)</span>
                <input
                  type="range"
                  min="0"
                  max="500"
                  value={islandY}
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    updateDragging(true);
                  }}
                  onChange={handleIslandYChange}
                  onPointerUp={(e) => {
                    e.stopPropagation();
                    savePosition();
                    handleDragEndChecks();
                    e.currentTarget.blur();
                  }}
                  style={{ flex: 1, accentColor: textColor }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div className="settings-row">
          <span className="settings-label">Island Border</span>
          <select
            value={islandBorderEnabled ? 'true' : 'false'}
            onChange={handleIslandBorderChange}
          >
            <option value="true">Show</option>
            <option value="false">Hide</option>
          </select>
        </div>
        <div className="settings-row">
          <span className="settings-label">Hide When Inactive</span>
          <select
            value={hideNotActiveIslandEnabled ? 'true' : 'false'}
            onChange={handlehideNotActiveIslandChange}
          >
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
        </div>
      </div>

      <div className="settings-section">
        <h3
          style={{
            fontSize: 13,
            textTransform: 'uppercase',
            opacity: 0.5,
            letterSpacing: '0.05em',
          }}
        >
          Colors & Assets
        </h3>
        <div className="settings-row">
          <span className="settings-label">Island Color</span>
          <input
            className="select-input"
            style={{ width: '100px' }}
            placeholder="#000000"
            value={bgColor}
            onChange={handleBgColorChange}
          />
        </div>
        <div className="settings-row">
          <span className="settings-label">Text Color</span>
          <input
            className="select-input"
            style={{ width: '100px' }}
            placeholder="#FAFAFA"
            value={textColor}
            onChange={handleTextColorChange}
          />
        </div>
        <div className="settings-row" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
          <span className="settings-label">Background Image URL</span>
          <input
            className="select-input"
            placeholder="https://..."
            value={bgImage}
            onChange={handleBgImageChange}
          />
        </div>
      </div>

      <div className="settings-section">
        <h3
          style={{
            fontSize: 13,
            textTransform: 'uppercase',
            opacity: 0.5,
            letterSpacing: '0.05em',
          }}
        >
          Features
        </h3>
        <div className="settings-row">
          <span className="settings-label">Low Battery Alerts</span>
          <select
            value={batteryAlertsEnabled ? 'true' : 'false'}
            onChange={handleBatteryAlertsChange}
          >
            <option value="true">Enabled</option>
            <option value="false">Disabled</option>
          </select>
        </div>
        <div className="settings-row">
          <span className="settings-label">Standby Mode</span>
          <select value={standbyBorderEnabled ? 'true' : 'false'} onChange={handleStandbyChange}>
            <option value="true">Enabled</option>
            <option value="false">Disabled</option>
          </select>
        </div>
        <div className="settings-row">
          <span className="settings-label">Large Standby Mode</span>
          <select
            value={largeStandbyEnabled ? 'true' : 'false'}
            onChange={handleLargeStandbyChange}
          >
            <option value="true">Enabled</option>
            <option value="false">Disabled</option>
          </select>
        </div>
        <div className="settings-row">
          <span className="settings-label">Show Info when idle</span>
          <select
            value={showInfoWhenIdleEnabled ? 'true' : 'false'}
            onChange={handleShowInfoWhenIdleChange}
          >
            <option value="true">Enabled</option>
            <option value="false">Disabled</option>
          </select>
        </div>
      </div>

      <div className="settings-section">
        <h3
          style={{
            fontSize: 13,
            textTransform: 'uppercase',
            opacity: 0.5,
            letterSpacing: '0.05em',
          }}
        >
          Weather
        </h3>
        <div className="settings-row">
          <span className="settings-label">Location</span>
          <input
            className="select-input"
            placeholder="City, ST, Country"
            value={weatherLocation}
            onChange={(e) => {
              setWeatherLocation(e.target.value);
              storage.setItem('location', e.target.value);
            }}
          />
        </div>
        <div className="settings-row">
          <span className="settings-label">Unit</span>
          <select value={weatherUnit} onChange={handleWeatherUnitChange}>
            <option value="f">Fahrenheit (°F)</option>
            <option value="c">Celsius (°C)</option>
          </select>
        </div>
      </div>

      <div className="settings-section">
        <h3
          style={{
            fontSize: 13,
            textTransform: 'uppercase',
            opacity: 0.5,
            letterSpacing: '0.05em',
          }}
        >
          Quick Apps
        </h3>
        <div
          style={{
            display: 'flex',
            gap: '8px',
            marginBottom: '12px',
            position: 'relative',
            flexDirection: 'column',
          }}
        >
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              className="select-input"
              style={{ flex: 1 }}
              value={newQuickApp}
              placeholder="Add app (e.g. Apple Music)"
              onChange={(e) => handleQuickAppInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') addQuickApp();
                if (e.key === 'Escape') setShowSuggestions(false);
              }}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            />
            <button
              onClick={addQuickApp}
              style={{
                backgroundColor: textColor,
                color: bgColor,
                border: 'none',
                borderRadius: '12px',
                padding: '8px 12px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Plus size={18} />
            </button>
          </div>
          {showSuggestions && appSuggestions.length > 0 && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                zIndex: 999,
                borderRadius: '12px',
                overflow: 'hidden',
                boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                backgroundColor: bgColor,
                border: `1px solid ${textColor}22`,
                marginTop: '4px',
              }}
            >
              {appSuggestions.map((s, i) => (
                <div
                  key={i}
                  onMouseDown={() => selectQuickApp(s)}
                  style={{
                    padding: '8px 12px',
                    cursor: 'pointer',
                    color: textColor,
                    fontSize: 13,
                    borderBottom:
                      i < appSuggestions.length - 1 ? `1px solid ${textColor}11` : 'none',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = `${textColor}11`)}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <div style={{ fontWeight: 600 }}>{s.name}</div>
                  <div
                    style={{
                      opacity: 0.4,
                      fontSize: 11,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {s.launch}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <AnimatePresence propagate>
            {quickApps.map((app, idx) => (
              <motion.div
                key={`qa-${idx}`}
                className="settings-row"
                style={{ justifyContent: 'space-between', padding: '5px 0' }}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, x: -20, height: 0, padding: 0 }}
                transition={{ duration: 0.2 }}
              >
                <input
                  className="select-input"
                  style={{ flex: 1, border: 'none', background: 'transparent', padding: 0 }}
                  value={app.name}
                  onChange={(e) => handleQaChange(idx, e.target.value)}
                />
                <button
                  onClick={() => removeQuickApp(idx)}
                  style={{
                    color: '#ff4d4d',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Trash2 size={16} />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      <div className="settings-section" style={{ marginBottom: 30 }}>
        <h3
          style={{
            fontSize: 13,
            textTransform: 'uppercase',
            opacity: 0.5,
            letterSpacing: '0.05em',
          }}
        >
          Integrations
        </h3>
        <div className="settings-row">
          <span className="settings-label">AI Provider</span>
          <select
            value={aiProvider}
            onChange={(e) => {
              setAiProvider(e.target.value);
              storage.setItem('ai-provider', e.target.value);
              const model =
                e.target.value === 'groq'
                  ? 'llama-3.3-70b-versatile'
                  : 'meta-llama/llama-3.3-70b-instruct';
              setAiModel(model);
              storage.setItem('ai-model', model);
            }}
          >
            <option value="groq">Groq</option>
            <option value="openrouter">OpenRouter</option>
          </select>
        </div>
        <div className="settings-row" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
          <span className="settings-label">AI Model</span>
          <input
            className="select-input"
            value={aiModel}
            placeholder={
              aiProvider === 'groq'
                ? 'llama-3.3-70b-versatile'
                : 'meta-llama/llama-3.3-70b-instruct'
            }
            onChange={(e) => {
              setAiModel(e.target.value);
              storage.setItem('ai-model', e.target.value);
            }}
          />
        </div>
        <div className="settings-row" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
          <span className="settings-label">API Key</span>
          <input
            className="select-input"
            type="password"
            placeholder={aiProvider === 'groq' ? 'gsk_...' : 'sk-or-...'}
            onChange={(e) => storage.setItem('api-key', e.target.value)}
          />
        </div>
      </div>

      <div className="settings-section" style={{ marginBottom: 30 }}>
        <h3
          style={{
            fontSize: 13,
            textTransform: 'uppercase',
            opacity: 0.5,
            letterSpacing: '0.05em',
          }}
        >
          Manage Workflows
        </h3>

        <div
          id="add-workflow-form"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            width: '100%',
            boxSizing: 'border-box',
          }}
        >
          <span className="settings-label" style={{ opacity: 0.8 }}>
            Workflow Name
          </span>
          <input
            className="select-input"
            style={{ width: '100%', boxSizing: 'border-box' }}
            placeholder="e.g. Work Tools"
            value={workflowName}
            onChange={(e) => setWorkflowName(e.target.value)}
          />
          <span className="settings-label" style={{ marginTop: 15, opacity: 0.8 }}>
            Apps or URLs (Comma Separated)
          </span>
          <textarea
            className="select-input"
            style={{ width: '100%', minHeight: '50px', padding: '8px', boxSizing: 'border-box' }}
            placeholder="e.g. Spotify, docs.google.com"
            value={workflowUrls}
            onChange={(e) => setWorkflowUrls(e.target.value)}
          />
          <button
            onClick={() => {
              addWorkflow();
            }}
            style={{
              backgroundColor: textColor,
              color: bgColor,
              border: 'none',
              borderRadius: '12px',
              padding: '8px',
              fontWeight: 600,
              cursor: 'pointer',
              marginTop: 2,
            }}
          >
            Save Workflow
          </button>
        </div>

        <div id="workflows-list" style={{ marginTop: '15px' }}>
          <AnimatePresence propagate>
            {workflows.map((wf, idx) => (
              <motion.div
                key={`wf-${wf.name}-${idx}`}
                className="settings-row"
                style={{
                  justifyContent: 'space-between',
                  padding: '10px 0',
                  borderBottom: `1px solid color-mix(in srgb, ${textColor}, transparent 95%)`,
                }}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, x: -20, height: 0, padding: 0 }}
                transition={{ duration: 0.2 }}
              >
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    paddingRight: '10px',
                  }}
                >
                  <span style={{ fontWeight: 600 }}>{wf.name}</span>
                  <span style={{ fontSize: 11, opacity: 0.6 }}>{wf.urls.length} items</span>
                </div>
                <button
                  onClick={() => removeWorkflow(idx)}
                  style={{
                    color: '#ff4d4d',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 4,
                  }}
                >
                  <Trash2 size={14} />
                  <span style={{ fontSize: 12 }}>Remove</span>
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
