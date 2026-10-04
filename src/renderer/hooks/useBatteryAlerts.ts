import type { Dispatch, SetStateAction } from 'react';
import type { IslandMode } from '../../shared/contracts';
import { useState, useEffect } from 'react';

import { storage } from '../lib/storage';
export function useBatteryAlerts({
  percent,
  charging,
  setMode,
}: {
  percent: number | string | null;
  charging: boolean;
  setMode: Dispatch<SetStateAction<IslandMode>>;
}) {
  const [alert, setAlert] = useState<boolean | null>(null);
  const [chargingAlert, setChargingAlert] = useState(false);
  useEffect(() => {
    if (
      (percent === 20 || percent === 15 || percent === 10 || percent === 5 || percent === 3) &&
      storage.getItem('battery-alerts') === 'true'
    ) {
      setMode('quick');
      setAlert(true);
      const timerId = setTimeout(() => {
        setMode('still');
        setAlert(null);
      }, 3000);
      return () => {
        clearTimeout(timerId);
      };
    }
  }, [percent, setMode]);
  useEffect(() => {
    if (charging === true && storage.getItem('battery-alerts') === 'true') {
      setMode('quick');
      setChargingAlert(true);
      const timerId = setTimeout(() => {
        setMode('still');
        setChargingAlert(false);
      }, 1500);
      return () => {
        clearTimeout(timerId);
      };
    }
  }, [charging, setMode]);
  return { alert, chargingAlert };
}
