import { useState, useEffect, useRef } from 'react';

import type { MediaTrack } from '../../shared/contracts';

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
    const fetchMedia = async () => {
      if (window.electronAPI?.getSystemMedia) {
        try {
          const track = await window.electronAPI.getSystemMedia();
          setSpotifyTrack(track);
        } catch (e) {
          console.error(e);
        }
      }
    };

    fetchMedia();
    const interval = setInterval(fetchMedia, 2000);
    return () => clearInterval(interval);
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
