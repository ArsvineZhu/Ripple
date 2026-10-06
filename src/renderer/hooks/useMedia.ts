import { useState, useEffect, useRef } from 'react';

import type { MediaTrack } from '../../shared/contracts';
import { recordRendererError } from '../lib/diagnostics';

const MEDIA_POLL_INTERVAL_MS = 5000;

function hasSameVisibleTrack(current: MediaTrack | null, next: MediaTrack | null): boolean {
  if (current === next) return true;
  if (!current || !next) return current === next;
  return (
    current.name === next.name &&
    current.artist === next.artist &&
    current.album === next.album &&
    current.state === next.state &&
    current.source === next.source &&
    Boolean(current.artwork_url) === Boolean(next.artwork_url)
  );
}

export function useMedia() {
  const [spotifyTrack, setSpotifyTrack] = useState<MediaTrack | null>(null);
  const [albumHovered, setAlbumHovered] = useState(false);
  const [albumRotation, setAlbumRotation] = useState({ x: 0, y: 0 });
  const [showPausedQuickView, setShowPausedQuickView] = useState(false);
  const pausedTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (spotifyTrack?.state === 'paused') {
      setShowPausedQuickView(true);
      if (pausedTimeout.current) clearTimeout(pausedTimeout.current);
      pausedTimeout.current = setTimeout(() => {
        setShowPausedQuickView(false);
      }, 3000);
    } else {
      setShowPausedQuickView(false);
      if (pausedTimeout.current) clearTimeout(pausedTimeout.current);
    }
  }, [spotifyTrack?.state]);
  const albumRef = useRef<HTMLImageElement | null>(null);
  useEffect(() => {
    const resetArtworkHover = () => {
      setAlbumHovered(false);
      setAlbumRotation({ x: 0, y: 0 });
    };
    window.addEventListener('blur', resetArtworkHover);
    return () => window.removeEventListener('blur', resetArtworkHover);
  }, []);
  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const pollMedia = async () => {
      try {
        const track = await window.electronAPI?.getSystemMedia();
        if (active) {
          setSpotifyTrack((current) =>
            hasSameVisibleTrack(current, track ?? null) ? current : (track ?? null),
          );
        }
      } catch (error) {
        recordRendererError('media', error);
      } finally {
        if (active) timer = setTimeout(() => void pollMedia(), MEDIA_POLL_INTERVAL_MS);
      }
    };

    void pollMedia();
    return () => {
      active = false;
      if (timer) clearTimeout(timer);
    };
  }, []);
  return {
    spotifyTrack,
    albumHovered,
    setAlbumHovered,
    albumRotation,
    setAlbumRotation,
    showPausedQuickView,
    albumRef,
  };
}
