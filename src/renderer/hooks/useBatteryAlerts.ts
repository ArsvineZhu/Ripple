import type { Dispatch, SetStateAction } from 'react';
import type { IslandMode } from '../../shared/contracts';
import { useState, useEffect } from 'react';
import { enterAlertMode, leaveAlertMode } from '../lib/modes';
export function useBatteryAlerts({
  percent,
  charging,
  enabled,
  setMode,
}: {
  percent: number | string | null;
  charging: boolean;
  enabled: boolean;
  setMode: Dispatch<SetStateAction<IslandMode>>;
}) {
  const [alert, setAlert] = useState<boolean | null>(null);
  const [chargingAlert, setChargingAlert] = useState(false);
  useEffect(() => {
    if (
      (percent === 20 || percent === 15 || percent === 10 || percent === 5 || percent === 3) &&
      enabled
    ) {
      setMode(enterAlertMode);
      setAlert(true);
      const timerId = setTimeout(() => {
        setMode(leaveAlertMode);
        setAlert(null);
      }, 3000);
      return () => {
        clearTimeout(timerId);
      };
    }
  }, [percent, enabled, setMode]);
  useEffect(() => {
    if (charging === true && enabled) {
      setMode(enterAlertMode);
      setChargingAlert(true);
      const timerId = setTimeout(() => {
        setMode(leaveAlertMode);
        setChargingAlert(false);
      }, 1500);
      return () => {
        clearTimeout(timerId);
      };
    }
  }, [charging, enabled, setMode]);
  return { alert, chargingAlert };
}
