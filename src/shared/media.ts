import type { MediaCommand, MediaSession, MediaSnapshot } from './contracts';

export const emptyMediaSnapshot: MediaSnapshot = {
  sessions: [],
  activeSessionId: null,
  manualSessionId: null,
  status: 'idle',
  lastSuccessfulReadAt: null,
  error: null,
};

export function selectAutomaticSession(
  sessions: MediaSession[],
  previousId: string | null,
): MediaSession | undefined {
  const fresh = sessions.filter((session) => !session.stale);
  return (
    fresh.find((session) => session.isCurrent && session.state === 'playing') ??
    fresh.find((session) => session.id === previousId && session.state === 'playing') ??
    fresh.find((session) => session.state === 'playing') ??
    fresh.find((session) => session.id === previousId) ??
    fresh.find((session) => session.isCurrent) ??
    fresh[0]
  );
}

export function mediaCommandSupported(session: MediaSession, command: MediaCommand): boolean {
  if (session.stale) return false;
  if (command !== 'playpause') return session.capabilities[command] !== false;
  const direct =
    session.state === 'playing' ? session.capabilities.pause : session.capabilities.play;
  return direct !== false || session.capabilities.toggle !== false;
}
