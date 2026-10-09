import type {
  MediaCommand,
  MediaError,
  MediaOperationResult,
  MediaSession,
  MediaSnapshot,
} from '../../shared/contracts';
import {
  emptyMediaSnapshot,
  mediaCommandSupported,
  selectAutomaticSession,
} from '../../shared/media';
import * as windows from '../platform/windows/media';
import * as macos from '../platform/macos/media';
import * as linux from '../platform/linux/media';
import { serializeDiagnosticError } from '../../shared/diagnostics';

export interface MediaBackend {
  getMediaSessions(): Promise<{
    sessions: MediaSession[];
    failedIds: string[];
    errors?: unknown[];
  }>;
  controlSystemMedia(command: MediaCommand, session: MediaSession): Promise<void>;
  openMediaSession(session: MediaSession): Promise<void>;
  close?(): void;
}
export function createMediaService(
  backend: MediaBackend = process.platform === 'win32'
    ? {
        getMediaSessions: windows.getMediaSessions,
        controlSystemMedia: windows.controlSystemMedia,
        openMediaSession: windows.openMediaSession,
      }
    : process.platform === 'darwin'
      ? {
          getMediaSessions: macos.getMediaSessions,
          controlSystemMedia: macos.controlSystemMedia,
          openMediaSession: macos.openMediaSession,
        }
      : linux,
  reportError: (error: unknown) => void = () => {},
) {
  let snapshot: MediaSnapshot = { ...emptyMediaSnapshot };
  let pending: Promise<MediaSnapshot> | undefined;
  let closed = false;
  let queue = Promise.resolve();
  const reported = new Map<string, number>();
  function reportOnce(error: unknown) {
    const signature = JSON.stringify(serializeDiagnosticError(error));
    const now = Date.now();
    if (now - (reported.get(signature) ?? 0) < 60_000) return;
    if (reported.size >= 64) reported.delete(reported.keys().next().value!);
    reported.set(signature, now);
    reportError(error);
  }
  function enqueue<T>(operation: () => Promise<T>): Promise<T> {
    const result = queue.then(operation);
    queue = result.then(
      () => {},
      () => {},
    );
    return result;
  }
  async function read(): Promise<MediaSnapshot> {
    if (closed) return snapshot;
    try {
      const { sessions, failedIds, errors } = await backend.getMediaSessions();
      errors?.forEach(reportOnce);
      if (failedIds.length && !errors?.length)
        reportOnce(
          Object.assign(new Error('Media query incomplete'), { code: 'MEDIA_PARTIAL_READ' }),
        );
      if (!failedIds.length && !errors?.length) reported.clear();
      if (closed) return snapshot;
      const stale = snapshot.sessions
        .filter((session) => failedIds.includes(session.id))
        .map((session) => ({ ...session, stale: true }));
      const available = [...sessions, ...stale];
      const manual = available.find((session) => session.id === snapshot.manualSessionId);
      const selected = manual ?? selectAutomaticSession(available, snapshot.activeSessionId);
      const lostManual = snapshot.manualSessionId !== null && !manual;
      snapshot = {
        sessions: available,
        activeSessionId: selected?.id ?? null,
        manualSessionId: manual?.id ?? null,
        status:
          selected?.stale || (failedIds.length && !selected)
            ? 'error'
            : selected
              ? 'ready'
              : 'idle',
        lastSuccessfulReadAt:
          selected?.stale || (failedIds.length && !sessions.length)
            ? snapshot.lastSuccessfulReadAt
            : Date.now(),
        error:
          selected?.stale || (failedIds.length && !selected)
            ? 'mediaReadFailed'
            : lostManual
              ? 'mediaSessionGone'
              : null,
      };
    } catch (error) {
      if (closed) return snapshot;
      reportOnce(error);
      snapshot = {
        ...snapshot,
        sessions: snapshot.sessions.map((session) => ({ ...session, stale: true })),
        status: 'error',
        error: 'mediaReadFailed',
      };
    }
    return snapshot;
  }
  function getSnapshot() {
    if (closed) return Promise.resolve(snapshot);
    if (!pending)
      pending = enqueue(read).finally(() => {
        pending = undefined;
      });
    return pending;
  }
  async function selectSession(id: string | null): Promise<MediaOperationResult> {
    await read();
    if (id !== null && !snapshot.sessions.some((session) => session.id === id))
      return { snapshot, error: 'mediaSessionGone' };
    const selected =
      id ?? selectAutomaticSession(snapshot.sessions, snapshot.activeSessionId)?.id ?? null;
    const selectedSession = snapshot.sessions.find((session) => session.id === selected);
    snapshot = {
      ...snapshot,
      manualSessionId: id,
      activeSessionId: selected,
      status: selectedSession?.stale ? 'error' : selectedSession ? 'ready' : 'idle',
      error: selectedSession?.stale ? 'mediaReadFailed' : selectedSession ? null : snapshot.error,
    };
    return { snapshot, error: null };
  }
  async function control(command: MediaCommand, id: string): Promise<MediaOperationResult> {
    if (closed) return { snapshot, error: 'mediaReadFailed' };
    await read();
    const session = snapshot.sessions.find((item) => item.id === id);
    let error: MediaError | null = !session
      ? 'mediaSessionGone'
      : session.stale
        ? 'mediaReadFailed'
        : !mediaCommandSupported(session, command)
          ? 'mediaCommandUnsupported'
          : null;
    if (!error && session) {
      try {
        await backend.controlSystemMedia(command, session);
      } catch (failure) {
        reportOnce(failure);
        error = 'mediaCommandFailed';
      }
    }
    await read();
    return { snapshot, error };
  }
  return {
    getSnapshot,
    openSession: async (id: string): Promise<MediaOperationResult> => {
      if (closed) return { snapshot, error: 'mediaReadFailed' };
      const session = snapshot.sessions.find((item) => item.id === id);
      if (!session) return { snapshot, error: 'mediaSessionGone' };
      if (session.stale) return { snapshot, error: 'mediaReadFailed' };
      try {
        await backend.openMediaSession(session);
        return { snapshot, error: null };
      } catch (failure) {
        reportOnce(failure);
        return { snapshot, error: 'mediaOpenFailed' };
      }
    },
    selectSession: (id: string | null) => enqueue(() => selectSession(id)),
    control: (command: MediaCommand, id: string) => enqueue(() => control(command, id)),
    close: () => {
      closed = true;
      backend.close?.();
    },
  };
}
