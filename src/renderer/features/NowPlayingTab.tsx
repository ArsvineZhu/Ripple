import styles from './NowPlayingTab.module.css';
import { useTranslation } from 'react-i18next';
import { AnimatePresence } from 'motion/react';
import { motion } from 'motion/react';
import { openMusicPlayer } from '../lib/launch';
import { Music } from 'lucide-react';
import { measureTextWidth } from '../lib/text';
import { SkipBackIcon } from 'lucide-react';
import { Pause } from 'lucide-react';
import { Play } from 'lucide-react';
import { SkipForwardIcon } from 'lucide-react';
import type { IslandController } from '../hooks/useIslandController';
type Props = Pick<
  IslandController,
  | 'spotifyTrack'
  | 'albumRef'
  | 'setAlbumHovered'
  | 'setAlbumRotation'
  | 'albumHovered'
  | 'albumRotation'
  | 'textColor'
>;
export function NowPlayingTab({
  spotifyTrack,
  albumRef,
  setAlbumHovered,
  setAlbumRotation,
  albumHovered,
  albumRotation,
  textColor,
}: Props) {
  const { t } = useTranslation();
  return (
    <div className={styles['container']}>
      <AnimatePresence propagate mode="wait">
        {spotifyTrack ? (
          <motion.div
            className={styles['track']}
            key={spotifyTrack.name + spotifyTrack.artist}
            initial={{ opacity: 0, filter: 'blur(10px)', scale: 0.95 }}
            animate={{ opacity: 1, filter: 'blur(0px)', scale: 1 }}
            exit={{ opacity: 0, filter: 'blur(10px)', scale: 0.95 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            style={{
              opacity: spotifyTrack.state === 'playing' ? 1 : 0.5,
              filter: spotifyTrack.state === 'playing' ? 'none' : 'grayscale(1)',
            }}
          >
            {spotifyTrack.artwork_url ? (
              <img
                className={styles['artwork']}
                ref={albumRef}
                src={spotifyTrack.artwork_url}
                onClick={() => openMusicPlayer(spotifyTrack.source)}
                onMouseEnter={() => setAlbumHovered(true)}
                onMouseLeave={() => {
                  setAlbumHovered(false);
                  setAlbumRotation({ x: 0, y: 0 });
                }}
                onMouseMove={(e) => {
                  if (albumRef.current) {
                    const rect = albumRef.current.getBoundingClientRect();
                    const centerX = rect.left + rect.width / 2;
                    const centerY = rect.top + rect.height / 2;
                    const deltaX = e.clientX - centerX;
                    const deltaY = e.clientY - centerY;
                    const maxDistance =
                      Math.sqrt(rect.width * rect.width + rect.height * rect.height) / 2;
                    const angleX = (deltaY / maxDistance) * 15;
                    const angleY = (deltaX / maxDistance) * -15;
                    setAlbumRotation({ x: angleX, y: angleY });
                  }
                }}
                style={{
                  boxShadow: albumHovered
                    ? '0 8px 24px rgba(0,0,0,0.35)'
                    : '0 4px 12px rgba(0,0,0,0.2)',
                  transform: `perspective(600px) rotateX(${albumRotation.x}deg) rotateY(${albumRotation.y}deg) scale(${albumHovered ? 1.08 : 1})`,
                }}
              />
            ) : (
              <div className={styles['artworkPlaceholder']}>
                <Music size={40} color={textColor} />
              </div>
            )}

            <div className={styles['details']}>
              <div
                className={styles['titleClip']}
                style={{
                  WebkitMaskImage:
                    measureTextWidth(spotifyTrack.name, 18) > 175
                      ? 'linear-gradient(to right, transparent, black 15px, black 160px, transparent)'
                      : 'none',
                  maskImage:
                    measureTextWidth(spotifyTrack.name, 18) > 175
                      ? 'linear-gradient(to right, transparent, black 15px, black 160px, transparent)'
                      : 'none',
                }}
              >
                <motion.h2
                  className={styles['title']}
                  animate={
                    measureTextWidth(spotifyTrack.name, 18) > 175
                      ? { x: [0, -(measureTextWidth(spotifyTrack.name, 18) + 30)] }
                      : {}
                  }
                  transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
                  style={{ color: textColor }}
                >
                  <span
                    style={{ paddingRight: measureTextWidth(spotifyTrack.name, 18) > 175 ? 30 : 0 }}
                  >
                    {spotifyTrack.name || t('unknownSong')}
                  </span>
                  {measureTextWidth(spotifyTrack.name, 18) > 175 && (
                    <span className={styles['titleRepeat']}>
                      {spotifyTrack.name || t('unknownSong')}
                    </span>
                  )}
                </motion.h2>
              </div>
              <div
                className={styles['artistClip']}
                style={{
                  WebkitMaskImage:
                    measureTextWidth(spotifyTrack.artist, 13) > 175
                      ? 'linear-gradient(to right, transparent, black 15px, black 160px, transparent)'
                      : 'none',
                  maskImage:
                    measureTextWidth(spotifyTrack.artist, 13) > 175
                      ? 'linear-gradient(to right, transparent, black 15px, black 160px, transparent)'
                      : 'none',
                }}
              >
                <motion.p
                  className={styles['artist']}
                  animate={
                    measureTextWidth(spotifyTrack.artist, 13) > 175
                      ? { x: [0, -(measureTextWidth(spotifyTrack.artist, 13) + 30)] }
                      : {}
                  }
                  transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
                  style={{ color: textColor }}
                >
                  <span
                    style={{
                      paddingRight: measureTextWidth(spotifyTrack.artist, 13) > 175 ? 30 : 0,
                    }}
                  >
                    {spotifyTrack.artist || t('unknownArtist')}
                  </span>
                  {measureTextWidth(spotifyTrack.artist, 13) > 175 && (
                    <span className={styles['artistRepeat']}>
                      {spotifyTrack.artist || t('unknownArtist')}
                    </span>
                  )}
                </motion.p>
              </div>
              <div className={styles['controls']}>
                <button
                  className={[styles['media-btn'], styles['previousButton']].join(' ')}
                  aria-label={t('previous')}
                  onClick={() => {
                    window.electronAPI.controlSystemMedia('previous');
                  }}
                  style={{ color: textColor }}
                >
                  <SkipBackIcon size={20} color={textColor} fill={textColor} />
                </button>
                <button
                  className={[styles['media-btn'], styles['playButton']].join(' ')}
                  aria-label={t('playPause')}
                  onClick={() => {
                    window.electronAPI.controlSystemMedia('playpause');
                  }}
                  style={{ color: textColor }}
                >
                  {spotifyTrack.state === 'playing' ? (
                    <Pause size={24} color={textColor} fill={textColor} />
                  ) : (
                    <Play size={24} color={textColor} fill={textColor} />
                  )}
                </button>
                <button
                  className={[styles['media-btn'], styles['nextButton']].join(' ')}
                  aria-label={t('next')}
                  onClick={() => {
                    window.electronAPI.controlSystemMedia('next');
                  }}
                  style={{ color: textColor }}
                >
                  <SkipForwardIcon size={20} color={textColor} fill={textColor} />
                </button>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            className={styles['emptyState']}
            key="nothing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ color: textColor }}
          >
            <h3 className={styles['emptyTitle']}>{t('nothingPlaying')}</h3>
            <p className={styles['emptyHint']}>{t('playMusicHint')}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
