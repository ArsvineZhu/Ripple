import { useState, useEffect } from 'react';

import { storage } from '../lib/storage';
export function useOverview(hourFormat: boolean) {
  const [time, setTime] = useState<string | null>(null);
  const [weather, setWeather] = useState<{ temp: string | number; status: string }>({
    temp: '',
    status: '',
  });
  useEffect(() => {
    const update = () => {
      const date = new Date();
      let hours = date.getHours();
      const minutes = String(date.getMinutes()).padStart(2, '0');
      if (hourFormat) hours = hours % 12 || 12;
      setTime(`${hours}:${minutes}`);
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [hourFormat]);
  useEffect(() => {
    const getWeather = async () => {
      try {
        const response = await fetch(
          `https://api.weatherapi.com/v1/current.json?key=0b18c67c443543e0a6045401250911&q=${storage.getItem(
            'location',
          )}&aqi=no`,
        );
        const data = await response.json();
        const unit = storage.getItem('weather-unit');
        const key = unit === 'f' ? 'temp_f' : 'temp_c';
        setWeather({
          temp: Math.round(data?.current?.[key]),
          status: data?.current?.condition?.text || '',
        });
      } catch (e) {
        console.error('Weather fetch failed', e);
      }
    };
    getWeather();
    const interval = setInterval(getWeather, 600000); // Update every 10 mins
    return () => clearInterval(interval);
  }, []);
  return { time, weather };
}
