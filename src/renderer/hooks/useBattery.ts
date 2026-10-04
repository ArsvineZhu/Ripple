import { useState, useEffect } from 'react';

export function useBattery() {
  const [percent, setPercent] = useState<number | string | null>(null);
  const [charging, setCharging] = useState(false);
  useEffect(() => {
    let battery: BatteryManager | undefined;
    let handler: (() => void) | undefined;
    (async () => {
      if (!('getBattery' in navigator)) return setPercent('Battery not supported');
      try {
        battery = await navigator.getBattery!();
        const update = () => {
          setPercent(Math.round(battery!.level * 100));
          setCharging(battery!.charging);
        };
        handler = update;
        update();
        battery.addEventListener('chargingchange', handler);
        battery.addEventListener('levelchange', handler);
      } catch {
        setPercent('Battery unavailable');
      }
    })();

    return () => {
      if (battery && handler) {
        battery.removeEventListener('levelchange', handler);
        battery.removeEventListener('chargingchange', handler);
      }
    };
  }, []);
  return { percent, charging };
}
