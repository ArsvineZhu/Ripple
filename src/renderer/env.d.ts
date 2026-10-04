/// <reference types="vite/client" />
import type { ElectronAPI } from '../shared/contracts';
declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
  interface Navigator {
    getBattery?(): Promise<BatteryManager>;
  }
  interface BatteryManager extends EventTarget {
    level: number;
    charging: boolean;
  }
}
