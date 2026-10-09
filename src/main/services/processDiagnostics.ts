import type { DiagnosticsService } from './diagnostics';
import { serializeDiagnosticError } from '../../shared/diagnostics';

interface ChildProcessEventSource {
  on(event: 'child-process-gone', listener: (event: unknown, details: unknown) => void): unknown;
  removeListener(
    event: 'child-process-gone',
    listener: (event: unknown, details: unknown) => void,
  ): unknown;
}

const rendererExitReasons = new Set([
  'clean-exit',
  'abnormal-exit',
  'killed',
  'crashed',
  'oom',
  'launch-failed',
  'integrity-failure',
]);

export function installFatalErrorMonitor(diagnostics: DiagnosticsService): () => void {
  const monitor = (error: Error, origin: 'uncaughtException' | 'unhandledRejection') => {
    diagnostics.record({
      kind: 'main-exception',
      origin,
      error: serializeDiagnosticError(error),
    });
  };
  process.on('uncaughtExceptionMonitor', monitor);
  return () => process.removeListener('uncaughtExceptionMonitor', monitor);
}

function recordChildProcessExit(diagnostics: DiagnosticsService, details: unknown): void {
  if (!details || typeof details !== 'object') return;
  const data = details as { type?: unknown; reason?: unknown; exitCode?: unknown };
  const processTypes = new Set(['GPU', 'Utility', 'Renderer', 'Network Service', 'Zygote']);
  const processType =
    typeof data.type === 'string' && processTypes.has(data.type) ? data.type : 'Other';
  const reason =
    typeof data.reason === 'string' && rendererExitReasons.has(data.reason)
      ? data.reason
      : 'unknown';
  const exitCode = Number.isInteger(data.exitCode) ? (data.exitCode as number) : 0;
  diagnostics.record({ kind: 'child-process-exit', processType, reason, exitCode });
}

export function installChildProcessDiagnostics(
  app: ChildProcessEventSource,
  diagnostics: DiagnosticsService,
): () => void {
  const listener = (_event: unknown, details: unknown) =>
    recordChildProcessExit(diagnostics, details);
  app.on('child-process-gone', listener);
  return () => app.removeListener('child-process-gone', listener);
}
