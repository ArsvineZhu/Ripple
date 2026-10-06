import { useTranslation } from 'react-i18next';
import { formatTime } from '../lib/date';
import { useState, useEffect } from 'react';
import { fetchCurrentWeather } from '../lib/weather';
import type { WeatherReading } from '../lib/weather';
import { recordRendererError } from '../lib/diagnostics';

export function useOverview(
  hourFormat: boolean,
  timeZone: string,
  location: string,
  weatherUnit: 'f' | 'c',
) {
  const { i18n } = useTranslation();
  const [time, setTime] = useState<string | null>(null);
  const [weather, setWeather] = useState<WeatherReading | null>(null);
  useEffect(() => {
    const update = () => {
      setTime(formatTime(i18n.language, hourFormat, new Date(), timeZone));
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [hourFormat, i18n.language, timeZone]);
  useEffect(() => {
    if (!location.trim()) {
      setWeather(null);
      return;
    }
    let active = true;
    const getWeather = async () => {
      try {
        const currentWeather = await fetchCurrentWeather(location, weatherUnit);
        if (active) setWeather(currentWeather);
      } catch (error) {
        if (active) setWeather(null);
        recordRendererError('overview', error);
      }
    };
    setWeather(null);
    void getWeather();
    const interval = setInterval(getWeather, 600000); // Update every 10 mins
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [location, weatherUnit]);
  return { time, weather };
}
