export async function openApp(app: string): Promise<void> {
  if (!app) return;
  const trimmedApp = app.trim();

  // 1. Explicit protocol URLs — checked first so that file:// and https://
  //    aren't accidentally caught by the path-separator test below.
  if (/^(https?|file):\/\//i.test(trimmedApp)) {
    await window.electronAPI?.openExternal(trimmedApp);
    return;
  }

  // 2. Launch targets — exe paths, UNC paths, shell: URIs.
  //    Checked before any dot-based heuristic so .exe and AppID dots never
  //    trip URL detection.
  const isLaunchTarget =
    /[\\/]/.test(trimmedApp) || // path separator → exe path or UNC
    /\.exe$/i.test(trimmedApp) || // bare name ending in .exe
    trimmedApp.startsWith('shell:'); // UWP shell URI

  if (isLaunchTarget) {
    await window.electronAPI?.launchApp(trimmedApp);
    return;
  }

  // 3. IPv4 address or localhost → open in browser via http://
  //    (dev servers rarely run https)
  if (
    /^(\d{1,3}\.){3}\d{1,3}(:\d+)?(\/.*)?$/.test(trimmedApp) ||
    /^localhost(:\d+)?(\/.*)?$/i.test(trimmedApp)
  ) {
    await window.electronAPI?.openExternal(`http://${trimmedApp}`);
    return;
  }

  // 4. Bare domain — must end with 2+ alpha chars so python3.11 and
  //    192.168.1.1 are not misclassified. DO NOT use .includes('.').
  if (/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(trimmedApp)) {
    await window.electronAPI?.openExternal(`https://${trimmedApp}`);
    return;
  }

  // 5. Everything else — treat as a command or app name
  await window.electronAPI?.launchApp(trimmedApp);
}
export function openMusicPlayer(source: string): Promise<void> {
  if (!source) return Promise.resolve();
  if (window.electronAPI?.platform === 'win32' && source.includes('!')) {
    return openApp('shell:AppsFolder\\' + source);
  }

  if (source === 'Spotify') {
    return openApp('Spotify');
  } else if (source === 'Music') {
    return openApp('Music');
  } else if (source === 'music.apple.com' || source.includes('Apple')) {
    return openApp('Music');
  } else {
    // Fallback: try to open by source name
    return openApp(source);
  }
}
