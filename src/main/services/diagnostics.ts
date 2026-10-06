import { chmod, mkdir, readdir, rm, stat } from 'node:fs/promises';
import path from 'node:path';

import { app, crashReporter, shell } from 'electron';
import log from 'electron-log/main';

import {
  RENDERER_CONTEXT_PREFIX,
  RendererDiagnosticContextSchema,
  serializeDiagnosticError,
  type DiagnosticErrorSource,
  type DiagnosticEvent,
  type RendererDiagnosticContext,
} from '../../shared/diagnostics';
export { serializeDiagnosticError } from '../../shared/diagnostics';

const DIAGNOSTICS_DIRECTORY = 'diagnostics';
const CRASH_DIRECTORY = 'crashes';
const LOG_FILE = 'ripple-next.log';
const LOG_LIMIT_BYTES = 5 * 1024 * 1024;
const CRASH_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;
const CRASH_MAX_FILES = 10;
export interface DiagnosticsService {
  record(event: DiagnosticEvent): void;
  recordError(source: DiagnosticErrorSource, error: unknown): void;
  setRendererContext(context: RendererDiagnosticContext): void;
  getRendererContext(): RendererDiagnosticContext | undefined;
  openFolder(): Promise<void>;
}

export async function pruneCrashReports(directory: string, now: number): Promise<void> {
  let entries;
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch {
    return;
  }

  const files: Array<{ path: string; modifiedAt: number }> = [];
  for (const entry of entries) {
    if (!entry.isFile()) continue;
    const filePath = path.join(directory, entry.name);
    try {
      const file = await stat(filePath);
      if (file.isFile()) files.push({ path: filePath, modifiedAt: file.mtimeMs });
    } catch {
      // A report can disappear while the retention pass is running.
    }
  }

  const expiration = now - CRASH_MAX_AGE_MS;
  const recent: typeof files = [];
  for (const file of files) {
    if (file.modifiedAt < expiration) {
      await rm(file.path, { force: true }).catch(() => {});
    } else {
      recent.push(file);
    }
  }

  recent.sort((left, right) => right.modifiedAt - left.modifiedAt);
  for (const file of recent.slice(CRASH_MAX_FILES)) {
    await rm(file.path, { force: true }).catch(() => {});
  }
}

export async function initializeDiagnostics(userDataPath: string): Promise<DiagnosticsService> {
  const directory = path.join(userDataPath, DIAGNOSTICS_DIRECTORY);
  const crashDirectory = path.join(directory, CRASH_DIRECTORY);
  const logPath = path.join(directory, LOG_FILE);
  let loggerReady = false;
  let rendererContext: RendererDiagnosticContext | undefined;

  const write = (level: 'info' | 'warn' | 'error', value: unknown, forceStderr = false) => {
    const line =
      typeof value === 'string'
        ? value
        : JSON.stringify({
            timestamp: new Date().toISOString(),
            process: 'main',
            event: value,
          });
    if (!forceStderr && loggerReady) {
      try {
        log[level](line);
        return;
      } catch {
        // Fall through to stderr when the file logger has stopped working.
      }
    }
    process.stderr.write(`${line}\n`);
  };

  const recordError = (source: DiagnosticErrorSource, error: unknown) => {
    write('error', {
      timestamp: new Date().toISOString(),
      process: 'main',
      event: 'error',
      source,
      error: serializeDiagnosticError(error),
    });
  };

  try {
    await mkdir(directory, { recursive: true, mode: 0o700 });
    await mkdir(crashDirectory, { recursive: true, mode: 0o700 });
    if (process.platform === 'linux') {
      await chmod(directory, 0o700);
      await chmod(crashDirectory, 0o700);
    }
  } catch (error) {
    write(
      'error',
      {
        timestamp: new Date().toISOString(),
        process: 'main',
        event: 'diagnostics-directory-init-failed',
        error: serializeDiagnosticError(error),
      },
      true,
    );
  }

  try {
    log.transports.file.fileName = LOG_FILE;
    log.transports.file.maxSize = LOG_LIMIT_BYTES;
    log.transports.file.resolvePathFn = () => logPath;
    log.initialize();
    loggerReady = true;
  } catch (error) {
    write(
      'error',
      {
        timestamp: new Date().toISOString(),
        process: 'main',
        event: 'logger-init-failed',
        error: serializeDiagnosticError(error),
      },
      true,
    );
  }

  try {
    app.setPath('crashDumps', crashDirectory);
    crashReporter.start({ productName: 'Ripple Next', uploadToServer: false });
  } catch (error) {
    write('error', {
      timestamp: new Date().toISOString(),
      process: 'main',
      event: 'crash-reporter-init-failed',
      error: serializeDiagnosticError(error),
    });
  }

  try {
    await pruneCrashReports(crashDirectory, Date.now());
  } catch (error) {
    recordError('diagnostics', error);
  }

  const diagnostics: DiagnosticsService = {
    record(event) {
      write('info', event);
    },
    recordError,
    setRendererContext(context) {
      const parsed = RendererDiagnosticContextSchema.safeParse(context);
      if (!parsed.success) return;
      rendererContext = parsed.data;
    },
    getRendererContext() {
      return rendererContext ? structuredClone(rendererContext) : undefined;
    },
    async openFolder() {
      const error = await shell.openPath(directory);
      if (error) throw new Error('Could not open the diagnostics directory');
    },
  };

  log.hooks.push((message) => {
    if (message.variables?.processType !== 'renderer') return message;
    const first = message.data?.[0];
    if (typeof first !== 'string' || !first.startsWith(RENDERER_CONTEXT_PREFIX)) return message;
    try {
      const event: unknown = JSON.parse(first.slice(RENDERER_CONTEXT_PREFIX.length));
      if (!event || typeof event !== 'object' || !('context' in event)) return message;
      const parsed = RendererDiagnosticContextSchema.safeParse(event.context);
      if (parsed.success) diagnostics.setRendererContext(parsed.data);
    } catch {
      // Ignore malformed renderer context and keep the previous valid snapshot.
    }
    return message;
  });

  return diagnostics;
}
