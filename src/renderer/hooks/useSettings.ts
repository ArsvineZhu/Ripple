import { languagePreference } from '../../shared/i18n';
import type { LanguagePreference } from '../../shared/i18n';
import { changeLanguagePreference } from '../i18n';
import type { ChangeEvent } from 'react';
import { useState, useEffect } from 'react';

import type { DisplayInfo } from '../../shared/contracts';

import { storage } from '../lib/storage';
export function useSettings() {
  const [language, setLanguage] = useState(() => languagePreference(storage.getItem('language')));
  const handleLanguageChange = (value: LanguagePreference) => {
    setLanguage(value);
    void changeLanguagePreference(value);
  };
  const [batteryAlertsEnabled, setBatteryAlertsEnabled] = useState(
    storage.getItem('battery-alerts') !== 'false',
  );
  const [islandBorderEnabled, setIslandBorderEnabled] = useState(
    storage.getItem('island-border') === 'true',
  );
  const [standbyBorderEnabled, setStandbyEnabled] = useState(
    storage.getItem('standby-mode') === 'true',
  );
  const [largeStandbyEnabled, setLargeStandbyEnabled] = useState(
    storage.getItem('large-standby-mode') === 'true',
  );
  const [hideNotActiveIslandEnabled, sethideNotActiveIslandEnabled] = useState(
    storage.getItem('hide-island-notactive') === 'true',
  );
  const [showInfoWhenIdleEnabled, setShowInfoWhenIdleEnabled] = useState(
    storage.getItem('show-info-when-idle') === 'true',
  );
  const [hourFormat, setHourFormat] = useState(
    (storage.getItem('hour-format') || '12-hr') === '12-hr',
  );
  const [weatherUnit, setweatherUnit] = useState(storage.getItem('weather-unit') || 'f');
  const [theme, setTheme] = useState('default');
  const [bgColor, setBgColor] = useState(storage.getItem('bg-color') || '#000000');
  const [textColor, setTextColor] = useState(storage.getItem('text-color') || '#FFFFFF');
  const [bgImage, setBgImage] = useState(storage.getItem('bg-image') || 'none');
  const [displays, setDisplays] = useState<DisplayInfo[]>([]);
  const [currentDisplayId, setCurrentDisplayId] = useState(storage.getItem('display-id') || '');
  const [weatherLocation, setWeatherLocation] = useState(storage.getItem('location') || '');
  const [autoLaunchEnabled, setAutoLaunchEnabled] = useState(
    storage.getItem('auto-launch') === 'true',
  );
  const [positionMode, setPositionMode] = useState(
    storage.getItem('position-mode') || storage.getItem('side-mode') || 'free',
  );
  const [islandX, setIslandX] = useState(() => {
    const saved = storage.getItem('island-x');
    const num = Number(saved);
    return saved !== null && !isNaN(num) ? Math.max(0, Math.min(100, num)) : 50;
  });
  const [islandY, setIslandY] = useState(() => {
    const saved = storage.getItem('island-y');
    const num = Number(saved);
    return saved !== null && !isNaN(num) ? Math.max(0, Math.min(1000, num)) : 20;
  });
  useEffect(() => {
    if (!storage.getItem('battery-alerts')) {
      storage.setItem('battery-alerts', 'true');
    }
    if (!storage.getItem('default-tab')) {
      storage.setItem('default-tab', '2');
    }
    if (!storage.getItem('island-border')) {
      storage.setItem('island-border', 'false');
    }
    if (!storage.getItem('hide-island-notactive')) {
      storage.setItem('hide-island-notactive', 'false');
    }
    if (!storage.getItem('standby-mode')) {
      storage.setItem('standby-mode', 'false');
    }
    if (!storage.getItem('hour-format')) {
      storage.setItem('hour-format', '12-hr');
    }
    if (!storage.getItem('island-x')) {
      storage.setItem('island-x', '50');
    }
    if (!storage.getItem('island-y')) {
      storage.setItem('island-y', '20');
    }
    if (!storage.getItem('bg-color')) {
      storage.setItem('bg-color', '#000000');
    }
    if (!storage.getItem('text-color')) {
      storage.setItem('text-color', '#FFFFFF');
    }
    if (!storage.getItem('weather-unit')) {
      storage.setItem('weather-unit', 'f');
    }
    if (!storage.getItem('auto-launch')) {
      storage.setItem('auto-launch', 'false');
    }
  }, []);
  const handleBatteryAlertsChange = (input: string) => {
    const value = input === 'true';
    setBatteryAlertsEnabled(value);
    storage.setItem('battery-alerts', value ? 'true' : 'false');
  };
  const handleIslandBorderChange = (input: string) => {
    const value = input === 'true';
    setIslandBorderEnabled(value);
    storage.setItem('island-border', value ? 'true' : 'false');
  };
  const handleStandbyChange = (input: string) => {
    const value = input === 'true';
    setStandbyEnabled(value);
    storage.setItem('standby-mode', value ? 'true' : 'false');
  };
  const handleLargeStandbyChange = (input: string) => {
    const value = input === 'true';
    setLargeStandbyEnabled(value);
    storage.setItem('large-standby-mode', value ? 'true' : 'false');
  };
  const handleHourFormatChange = (input: string) => {
    const value = input;
    setHourFormat(value === '12-hr');
    storage.setItem('hour-format', value);
  };
  const handleAutoLaunchChange = (input: string) => {
    const value = input === 'true';
    setAutoLaunchEnabled(value);
    storage.setItem('auto-launch', value ? 'true' : 'false');
    window.electronAPI?.setAutoLaunch(value);
  };
  const handlehideNotActiveIslandChange = (input: string) => {
    const value = input === 'true';
    sethideNotActiveIslandEnabled(value);
    storage.setItem('hide-island-notactive', value ? 'true' : 'false');
  };
  const handleShowInfoWhenIdleChange = (input: string) => {
    const value = input === 'true';
    setShowInfoWhenIdleEnabled(value);
    storage.setItem('show-info-when-idle', value ? 'true' : 'false');
  };
  const handleWeatherUnitChange = (input: string) => {
    const value = input === 'c' ? 'c' : 'f';
    setweatherUnit(value);
    storage.setItem('weather-unit', value);
  };
  const handleBgColorChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value = e.target.value;
    setBgColor(value);
    storage.setItem('bg-color', value);
  };
  const handleTextColorChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value = e.target.value;
    setTextColor(value);
    storage.setItem('text-color', value);
  };
  const handleDisplayChange = (input: string) => {
    const displayId = input;
    setCurrentDisplayId(displayId);
    storage.setItem('display-id', displayId);
    if (window.electronAPI?.setDisplay) {
      window.electronAPI.setDisplay(displayId);
    }
  };
  const handleIslandXChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value = Number(e.target.value);
    setIslandX(value);
  };
  const handleIslandYChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value = Number(e.target.value);
    setIslandY(value);
  };
  const savePosition = () => {
    storage.setItem('island-x', islandX);
    storage.setItem('island-y', islandY);
  };
  const handleBgImageChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value = e.target.value;
    setBgImage(value);
    storage.setItem('bg-image', value);
  };
  useEffect(() => {
    if (theme === 'sleek-black') {
      storage.setItem('bg-color', 'rgba(0, 0, 0, 0.64)');
      storage.setItem('text-color', 'rgba(255, 255, 255)');
      setBgColor('rgba(0, 0, 0, 0.64)');
      setTextColor('rgba(255, 255, 255)');
    } else if (theme === 'win95') {
      storage.setItem('bg-color', 'rgba(195, 195, 195)');
      storage.setItem('text-color', 'rgba(0, 0, 0)');
      setBgColor('rgba(195, 195, 195)');
      setTextColor('rgba(0, 0, 0)');
    } else if (theme === 'invisible') {
      storage.setItem('bg-image', 'none');
      setBgImage('none');
      storage.setItem('bg-color', 'rgba(255, 255, 255, 0)');
      storage.setItem('text-color', 'rgba(0, 0, 0, 0)');
      setBgColor('rgba(255, 255, 255, 0)');
      setTextColor('rgba(0, 0, 0, 0)');
    } else if (theme === 'none') {
      const defaultBg = '#000000';
      const defaultText = '#FFFFFF';
      storage.setItem('bg-color', defaultBg);
      storage.setItem('text-color', defaultText);
      setBgColor(defaultBg);
      setTextColor(defaultText);
    }
  }, [theme]);
  useEffect(() => {
    void window.electronAPI?.setAutoLaunch(autoLaunchEnabled);
  }, [autoLaunchEnabled]);
  return {
    language,
    handleLanguageChange,
    batteryAlertsEnabled,
    islandBorderEnabled,
    standbyBorderEnabled,
    largeStandbyEnabled,
    hideNotActiveIslandEnabled,
    showInfoWhenIdleEnabled,
    hourFormat,
    weatherUnit,
    theme,
    setTheme,
    bgColor,
    textColor,
    bgImage,
    displays,
    setDisplays,
    currentDisplayId,
    weatherLocation,
    setWeatherLocation,
    autoLaunchEnabled,
    positionMode,
    setPositionMode,
    islandX,
    islandY,
    handleBatteryAlertsChange,
    handleIslandBorderChange,
    handleStandbyChange,
    handleLargeStandbyChange,
    handleHourFormatChange,
    handleAutoLaunchChange,
    handlehideNotActiveIslandChange,
    handleShowInfoWhenIdleChange,
    handleWeatherUnitChange,
    handleBgColorChange,
    handleTextColorChange,
    handleDisplayChange,
    handleIslandXChange,
    handleIslandYChange,
    savePosition,
    handleBgImageChange,
  };
}
