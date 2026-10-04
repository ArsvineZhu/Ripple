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
  | 'theme'
>;
export function NowPlayingTab({
  spotifyTrack,
  albumRef,
  setAlbumHovered,
  setAlbumRotation,
  albumHovered,
  albumRotation,
  textColor,
  theme,
}: Props) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        width: '100%',
        height: '100%',
        userSelect: 'none',
      }}
    >
      <AnimatePresence propagate mode="wait">
        {spotifyTrack ? (
          <motion.div
            key={spotifyTrack.name + spotifyTrack.artist}
            initial={{ opacity: 0, filter: 'blur(10px)', scale: 0.95 }}
            animate={{ opacity: 1, filter: 'blur(0px)', scale: 1 }}
            exit={{ opacity: 0, filter: 'blur(10px)', scale: 0.95 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-start',
              width: '100%',
              height: '100%',
              gap: '8px',
              paddingLeft: '17px',
              opacity: spotifyTrack.state === 'playing' ? 1 : 0.5,
              filter: spotifyTrack.state === 'playing' ? 'none' : 'grayscale(1)',
              transition: 'opacity 0.3s ease, filter 0.3s ease',
            }}
          >
            {spotifyTrack.artwork_url ? (
              <img
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
                  width: 110,
                  height: 110,
                  minWidth: 110,
                  flexShrink: 0,
                  borderRadius: 13,
                  objectFit: 'cover',
                  boxShadow: albumHovered
                    ? '0 8px 24px rgba(0,0,0,0.35)'
                    : '0 4px 12px rgba(0,0,0,0.2)',
                  cursor: 'pointer',
                  transition: 'transform 0.3s ease-out, box-shadow 0.3s ease-out',
                  transform: `perspective(600px) rotateX(${albumRotation.x}deg) rotateY(${albumRotation.y}deg) scale(${albumHovered ? 1.08 : 1})`,
                  transformStyle: 'preserve-3d',
                }}
              />
            ) : (
              <div
                style={{
                  width: 110,
                  height: 110,
                  minWidth: 110,
                  flexShrink: 0,
                  borderRadius: 12,
                  background: 'rgba(255,255,255,0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 24,
                }}
              >
                <Music size={40} color={textColor} />
              </div>
            )}

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                flex: 1,
                justifyContent: 'center',
                textAlign: 'left',
                minWidth: 0,
              }}
            >
              <div
                style={{
                  width: '175px',
                  overflow: 'hidden',
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
                  animate={
                    measureTextWidth(spotifyTrack.name, 18) > 175
                      ? { x: [0, -(measureTextWidth(spotifyTrack.name, 18) + 30)] }
                      : {}
                  }
                  transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
                  style={{
                    margin: '0 0 0 5px',
                    fontSize: 18,
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                    display: 'inline-block',
                    color: textColor,
                    fontFamily: theme === 'win95' ? 'w95' : 'OpenRunde',
                  }}
                >
                  <span
                    style={{ paddingRight: measureTextWidth(spotifyTrack.name, 18) > 175 ? 30 : 0 }}
                  >
                    {spotifyTrack.name || 'Unknown Title'}
                  </span>
                  {measureTextWidth(spotifyTrack.name, 18) > 175 && (
                    <span style={{ paddingRight: 30 }}>{spotifyTrack.name || 'Unknown Title'}</span>
                  )}
                </motion.h2>
              </div>
              <div
                style={{
                  width: '175px',
                  overflow: 'hidden',
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
                  animate={
                    measureTextWidth(spotifyTrack.artist, 13) > 175
                      ? { x: [0, -(measureTextWidth(spotifyTrack.artist, 13) + 30)] }
                      : {}
                  }
                  transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
                  style={{
                    margin: '4px 0 0 5px',
                    fontSize: 13,
                    opacity: 0.8,
                    whiteSpace: 'nowrap',
                    display: 'inline-block',
                    color: textColor,
                    fontFamily: theme === 'win95' ? 'w95' : 'OpenRunde',
                  }}
                >
                  <span
                    style={{
                      paddingRight: measureTextWidth(spotifyTrack.artist, 13) > 175 ? 30 : 0,
                    }}
                  >
                    {spotifyTrack.artist || 'Unknown Artist'}
                  </span>
                  {measureTextWidth(spotifyTrack.artist, 13) > 175 && (
                    <span style={{ paddingRight: 30 }}>
                      {spotifyTrack.artist || 'Unknown Artist'}
                    </span>
                  )}
                </motion.p>
              </div>
              <div
                style={{
                  display: 'flex',
                  gap: 15,
                  marginTop: 15,
                  alignItems: 'center',
                  marginLeft: 5,
                }}
              >
                <button
                  className="media-btn"
                  onClick={() => {
                    window.electronAPI.controlSystemMedia('previous');
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: textColor,
                    cursor: 'pointer',
                    padding: 4,
                    opacity: 0.8,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <SkipBackIcon size={20} color={textColor} fill={textColor} />
                </button>
                <button
                  className="media-btn"
                  onClick={() => {
                    window.electronAPI.controlSystemMedia('playpause');
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: textColor,
                    cursor: 'pointer',
                    padding: 4,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {spotifyTrack.state === 'playing' ? (
                    <Pause size={24} color={textColor} fill={textColor} />
                  ) : (
                    <Play size={24} color={textColor} fill={textColor} />
                  )}
                </button>
                <button
                  className="media-btn"
                  onClick={() => {
                    window.electronAPI.controlSystemMedia('next');
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: textColor,
                    cursor: 'pointer',
                    padding: 4,
                    opacity: 0.8,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <SkipForwardIcon size={20} color={textColor} fill={textColor} />
                </button>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="nothing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              width: '100%',
              textAlign: 'center',
              color: textColor,
              fontFamily: theme === 'win95' ? 'w95' : 'OpenRunde',
            }}
          >
            <h3 style={{ margin: 0, fontSize: 16 }}>Nothing Playing</h3>
            <p style={{ margin: '5px 0 0 0', opacity: 0.7, fontSize: 13 }}>
              Play music on Spotify or Apple Music
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
