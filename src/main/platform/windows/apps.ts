import type { AppEntry } from '../../../shared/contracts';
import { exec, spawn } from 'node:child_process';
import fs from 'node:fs';
import { shell } from 'electron';

import { parseCommand } from './commands';
interface DiscoveredApp {
  name: string;
  type: string;
  path?: string;
  appId?: string;
}
// --- App discovery providers ---

// Scans Start Menu .lnk files and resolves them to Win32 exe paths.
// Skips shortcuts targeting explorer.exe (UWP launchers) or WindowsApps.
function discoverStartMenu(): Promise<DiscoveredApp[]> {
  return new Promise<DiscoveredApp[]>((resolve) => {
    const script = `
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$shell   = New-Object -ComObject WScript.Shell
$dirs    = @("$env:ProgramData\\Microsoft\\Windows\\Start Menu\\Programs","$env:APPDATA\\Microsoft\\Windows\\Start Menu\\Programs")
$results = [System.Collections.Generic.List[object]]::new()
foreach ($dir in $dirs) {
  if (-not (Test-Path $dir)) { continue }
  Get-ChildItem $dir -Recurse -Filter '*.lnk' -EA SilentlyContinue | ForEach-Object {
    try {
      $target = $shell.CreateShortcut($_.FullName).TargetPath
      if ($target -and $target.EndsWith('.exe') -and
          $target -notlike '*\\\\explorer.exe' -and
          $target -notmatch 'WindowsApps' -and
          (Test-Path $target -EA SilentlyContinue)) {
        $results.Add([PSCustomObject]@{ name = $_.BaseName; type = 'win32'; path = $target })
      }
    } catch {}
  }
}
@($results) | ConvertTo-Json -Compress -Depth 2
`;
    const enc = Buffer.from(script, 'utf16le').toString('base64');
    exec(
      `powershell -NoProfile -EncodedCommand ${enc}`,
      { maxBuffer: 5 * 1024 * 1024 },
      (err, out) => {
        if (err || !out) return resolve([]);
        try {
          const d = JSON.parse(out.trim());
          resolve(Array.isArray(d) ? d : d ? [d] : []);
        } catch {
          resolve([]);
        }
      },
    );
  });
}

// Gets UWP / Store apps via Get-StartApps.
// UWP entries have AppID in the form PackageFamilyName!AppId (contains '!').
function discoverUWP(): Promise<DiscoveredApp[]> {
  return new Promise<DiscoveredApp[]>((resolve) => {
    const script = `
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$results = [System.Collections.Generic.List[object]]::new()
Get-StartApps -EA SilentlyContinue | ForEach-Object {
  if ($_.AppID -match '.+!.+') {
    $results.Add([PSCustomObject]@{ name = $_.Name; type = 'uwp'; appId = $_.AppID })
  }
}
@($results) | ConvertTo-Json -Compress -Depth 2
`;
    const enc = Buffer.from(script, 'utf16le').toString('base64');
    exec(
      `powershell -NoProfile -EncodedCommand ${enc}`,
      { maxBuffer: 2 * 1024 * 1024 },
      (err, out) => {
        if (err || !out) return resolve([]);
        try {
          const d = JSON.parse(out.trim());
          resolve(Array.isArray(d) ? d : d ? [d] : []);
        } catch {
          resolve([]);
        }
      },
    );
  });
}

// Converts provider-specific shapes to { name, launch } and deduplicates.
// win32: launch = exe path   |   uwp: launch = shell:AppsFolder\\appId
export async function buildCache() {
  const [startMenu, uwp] = await Promise.all([discoverStartMenu(), discoverUWP()]);
  const seen = new Set();
  const entries: AppEntry[] = [];
  for (const item of [...startMenu, ...uwp]) {
    if (!item.name || !(item.path || item.appId)) continue;
    const launch = item.type === 'uwp' ? `shell:AppsFolder\\${item.appId}` : item.path;
    const key = launch!.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      entries.push({ name: item.name, launch: launch! });
    }
  }
  return entries.sort((a, b) => a.name.localeCompare(b.name));
}

// --- Launch abstraction ---
export function launchWindows(input: string) {
  const trimmed = input.trim();

  // UWP apps and schemes
  if (trimmed.startsWith('shell:')) {
    const safe = trimmed.replace(/'/g, "''");
    exec(`powershell -NoProfile -WindowStyle Hidden -Command "Start-Process '${safe}'"`);
    return;
  }

  // Paths with slashes (ex: C:\Program Files\App.exe)
  if (/[\\/]/.test(trimmed)) {
    const { exe, args } = parseCommand(trimmed);

    // If no arguments, use native OS approach for best compatibility
    if (args.length === 0) {
      if (exe.toLowerCase().endsWith('.url')) {
        try {
          const content = fs.readFileSync(exe, 'utf8');
          const m = content.match(/^URL=(.+)$/im);
          if (m) shell.openExternal(m[1].trim());
        } catch {}
        return;
      }
      shell.openPath(exe).then((err) => {
        if (err) exec(`start "" "${exe}"`);
      });
      return;
    }

    // Arguments provided - spawn exactly to prevent execution escaping vulnerabilities
    const finalExe = /[\\/]/.test(exe) && !/\.[^\\.]+$/.test(exe) ? exe + '.exe' : exe;

    // cmd / bat scripts must run via cmd.exe
    if (/\.(cmd|bat)$/i.test(finalExe)) {
      const child = spawn('cmd.exe', ['/c', finalExe, ...args], {
        shell: false,
        detached: true,
        stdio: 'ignore',
      });
      child.on('error', () => {});
      child.unref();
      return;
    }

    // powershell scripts
    if (/\.ps1$/i.test(finalExe)) {
      const child = spawn(
        'powershell.exe',
        ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', finalExe, ...args],
        { shell: false, detached: true, stdio: 'ignore' },
      );
      child.on('error', () => {});
      child.unref();
      return;
    }

    const child = spawn(finalExe, args, {
      shell: false,
      detached: true,
      stdio: 'ignore',
    });
    child.on('error', () => {});
    child.unref();
    return;
  }

  // App Paths or raw executables
  if (trimmed.includes(' ')) {
    const safe = trimmed.replace(/'/g, "''");
    exec(`powershell -NoProfile -WindowStyle Hidden -Command "Start-Process '${safe}'"`);
  } else {
    exec(`start "" ${trimmed}`);
  }
}
