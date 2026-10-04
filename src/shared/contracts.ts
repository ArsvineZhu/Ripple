export interface MediaTrack {
  name: string;
  artist: string;
  album?: string;
  artwork_url?: string | null;
  state: string;
  source: string;
}
export interface AppEntry {
  name: string;
  launch: string;
}
export interface Workflow {
  name: string;
  urls: string[];
}
export interface DisplayInfo {
  id: number;
  label: string;
  bounds: { x: number; y: number; width: number; height: number };
}
export interface InputRect {
  x: number;
  y: number;
  width: number;
  height: number;
  scaleFactor: number;
}
export type MediaCommand = 'previous' | 'playpause' | 'next';
export type IslandMode = 'still' | 'quick' | 'large';
export interface InvokeMap {
  'set-ignore-mouse-events': { args: [ignore: boolean, forward: boolean]; result: void };
  'get-system-media': { args: []; result: MediaTrack | null };
  'get-bluetooth-status': { args: []; result: boolean };
  'get-camera-status': { args: []; result: boolean };
  'get-microphone-status': { args: []; result: boolean };
  'control-system-media': { args: [command: MediaCommand]; result: void };
  'open-external': { args: [url: string]; result: void };
  'launch-app': { args: [name: string]; result: void };
  'build-app-cache': { args: []; result: void };
  'search-apps': { args: [query: string]; result: AppEntry[] };
  'get-displays': { args: []; result: DisplayInfo[] };
  'set-display': { args: [id: string | number]; result: void };
  'set-auto-launch': { args: [enable: boolean]; result: void };
  'focus-window': { args: []; result: void };
}
export interface ElectronAPI {
  platform: string;
  setIgnoreMouseEvents(ignore: boolean, forward: boolean): Promise<void>;
  setWindowInputShape(rect: InputRect): void;
  getSystemMedia(): Promise<MediaTrack | null>;
  getBluetoothStatus(): Promise<boolean>;
  getCameraStatus(): Promise<boolean>;
  getMicrophoneStatus(): Promise<boolean>;
  controlSystemMedia(command: MediaCommand): Promise<void>;
  openExternal(url: string): Promise<void>;
  launchApp(name: string): Promise<void>;
  buildAppCache(): Promise<void>;
  searchApps(query: string): Promise<AppEntry[]>;
  getDisplays(): Promise<DisplayInfo[]>;
  setDisplay(id: string | number): Promise<void>;
  setAutoLaunch(enable: boolean): Promise<void>;
  focusWindow(): Promise<void>;
}
