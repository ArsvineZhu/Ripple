import { useState, useEffect, useRef, useCallback } from 'react';
import type { MediaCommand, MediaError, MediaSnapshot } from '../../shared/contracts';
import { emptyMediaSnapshot } from '../../shared/media';
import { recordRendererError } from '../lib/diagnostics';

export function useMedia() {
  const [mediaSnapshot, setMediaSnapshot] = useState<MediaSnapshot>(emptyMediaSnapshot);
  const [mediaActionError, setMediaActionError] = useState<MediaError | null>(null);
  const [mediaBusy, setMediaBusy] = useState(false);
  const [albumHovered, setAlbumHovered] = useState(false);
  const [albumRotation, setAlbumRotation] = useState({ x: 0, y: 0 });
  const [showPausedQuickView, setShowPausedQuickView] = useState(false);
  const mounted = useRef(false);
  const busy = useRef(false);
  const requestVersion = useRef(0);
  const mediaTrack =
    mediaSnapshot.sessions.find((session) => session.id === mediaSnapshot.activeSessionId) ?? null;
  const albumRef = useRef<HTMLImageElement | null>(null);
  useEffect(() => {
    setShowPausedQuickView(mediaTrack?.state === 'paused');
    const timer = setTimeout(() => setShowPausedQuickView(false), 3000);
    return () => clearTimeout(timer);
  }, [mediaTrack?.state, mediaTrack?.id]);
  useEffect(() => {
    const reset = () => {
      setAlbumHovered(false);
      setAlbumRotation({ x: 0, y: 0 });
    };
    window.addEventListener('blur', reset);
    return () => window.removeEventListener('blur', reset);
  }, []);
  useEffect(() => {
    mounted.current = true;
    let active = true;
    let timer: ReturnType<typeof setTimeout>;
    const poll = async () => {
      if (!busy.current) {
        const version = requestVersion.current;
        try {
          const snapshot = await window.electronAPI.getSystemMedia();
          if (active && version === requestVersion.current) setMediaSnapshot(snapshot);
        } catch (error) {
          recordRendererError('media', error);
          if (active && version === requestVersion.current)
            setMediaSnapshot((current) => ({
              ...current,
              status: 'error',
              error: 'mediaReadFailed',
              sessions: current.sessions.map((session) => ({ ...session, stale: true })),
            }));
        }
      }
      if (active) timer = setTimeout(() => void poll(), 5000);
    };
    void poll();
    return () => {
      mounted.current = false;
      active = false;
      clearTimeout(timer);
    };
  }, []);
  const perform = useCallback(
    async (operation: () => ReturnType<typeof window.electronAPI.selectMediaSession>) => {
      if (busy.current) return;
      busy.current = true;
      requestVersion.current++;
      setMediaBusy(true);
      setMediaActionError(null);
      try {
        const result = await operation();
        if (mounted.current) {
          setMediaSnapshot(result.snapshot);
          setMediaActionError(result.error);
        }
      } catch (error) {
        recordRendererError('media', error);
        if (mounted.current) setMediaActionError('mediaCommandFailed');
      } finally {
        busy.current = false;
        if (mounted.current) setMediaBusy(false);
      }
    },
    [],
  );
  const controlMedia = useCallback(
    (command: MediaCommand, id: string) =>
      perform(() => window.electronAPI.controlSystemMedia(command, id)),
    [perform],
  );
  const selectMediaSession = useCallback(
    (id: string | null) => perform(() => window.electronAPI.selectMediaSession(id)),
    [perform],
  );
  const openMediaSession = useCallback(
    (id: string) => perform(() => window.electronAPI.openMediaSession(id)),
    [perform],
  );
  return {
    mediaTrack,
    mediaSnapshot,
    mediaActionError,
    mediaBusy,
    controlMedia,
    selectMediaSession,
    openMediaSession,
    albumHovered,
    setAlbumHovered,
    albumRotation,
    setAlbumRotation,
    showPausedQuickView,
    albumRef,
  };
}
