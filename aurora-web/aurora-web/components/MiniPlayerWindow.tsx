'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  X, 
  Music,
  FileText,
  Radio,
  Volume2,
  VolumeX
} from 'lucide-react';
import { LyricLine, getActiveLyricIndex } from '../utils/parseLRC';

const getCleanArtwork = (url: string | null | undefined) => {
  const fallback = 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&q=80';
  if (!url) return fallback;
  if (
    url.includes('discordapp.com/embed/avatars') || 
    url.includes('placeholder') || 
    url.includes('d41d8cd98f00b204e9800998ecf8427e') ||
    url.includes('2a96cbd8b46e442fc41c2b86b821562f')
  ) {
    return fallback;
  }
  return url;
};

interface MiniPlayerWindowProps {
  currentTrack: any;
  isPlaying: boolean;
  position: number; // seconds
  volume?: number; // 0 - 100
  lyrics?: LyricLine[];
  siteName?: string;
  handlePlay: () => void;
  handlePause: () => void;
  handleSkip: () => void;
  handlePrevious: () => void;
  handleSeek?: (ms: number) => void;
  handleVolumeChange?: (volume: number) => void;
  onClose?: () => void;
}

export default function MiniPlayerWindow({
  currentTrack,
  isPlaying,
  position,
  volume = 50,
  lyrics = [],
  siteName = 'Aurora',
  handlePlay,
  handlePause,
  handleSkip,
  handlePrevious,
  handleSeek,
  handleVolumeChange,
  onClose
}: MiniPlayerWindowProps) {
  const [isPipActive, setIsPipActive] = useState(false);
  const [isAutoPipEnabled] = useState(true); // Always ON by default, hidden from UI
  const [pipContainer, setPipContainer] = useState<HTMLElement | null>(null);
  const [viewMode, setViewMode] = useState<'controls' | 'lyrics'>('controls');
  const [isSeeking, setIsSeeking] = useState(false);
  const [seekPos, setSeekPos] = useState<number | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  // Robust conversion to SECONDS for duration & position
  const rawDuration = currentTrack?.duration || 180000;
  const durationSecs = Math.max(1, rawDuration > 1000 ? rawDuration / 1000 : rawDuration);

  // If position is passed in ms (> durationSecs * 2), convert to seconds; otherwise use directly
  const rawPos = position || 0;
  const currentSecs = Math.min(
    durationSecs,
    Math.max(0, rawPos > durationSecs * 2 ? rawPos / 1000 : rawPos)
  );

  const displaySecs = isSeeking && seekPos !== null ? seekPos : currentSecs;

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Find active lyric index in SECONDS using getActiveLyricIndex
  const activeLyricIndex = getActiveLyricIndex(lyrics, currentSecs);

  // 1. Register OS Level MediaSession Controls & PositionState
  useEffect(() => {
    if (!currentTrack || typeof window === 'undefined' || !('mediaSession' in navigator)) return;

    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentTrack.title || 'Unknown Track',
        artist: currentTrack.author || currentTrack.artist || `${siteName} Music`,
        album: `${siteName} Audio Player`,
        artwork: [
          {
            src: currentTrack.artwork || 'https://cdn.discordapp.com/embed/avatars/0.png',
            sizes: '512x512',
            type: 'image/jpeg'
          }
        ]
      });

      navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';

      if ('setPositionState' in navigator.mediaSession && durationSecs > 0) {
        try {
          navigator.mediaSession.setPositionState({
            duration: durationSecs,
            playbackRate: 1,
            position: Math.min(Math.max(0, currentSecs), durationSecs)
          });
        } catch (e) {}
      }

      navigator.mediaSession.setActionHandler('play', () => handlePlay());
      navigator.mediaSession.setActionHandler('pause', () => handlePause());
      navigator.mediaSession.setActionHandler('previoustrack', () => handlePrevious());
      navigator.mediaSession.setActionHandler('nexttrack', () => handleSkip());
      if (handleSeek) {
        navigator.mediaSession.setActionHandler('seekto', (details) => {
          if (details.seekTime !== undefined) handleSeek(details.seekTime * 1000);
        });
      }
    } catch (e) {
      console.error('MediaSession initialization error:', e);
    }
  }, [currentTrack, isPlaying, currentSecs, durationSecs, siteName]);

  // 2. Preload Artwork Image for Canvas Stream fallback
  useEffect(() => {
    if (!currentTrack?.artwork) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = currentTrack.artwork;
    img.onload = () => {
      imgRef.current = img;
    };
    img.onerror = () => {
      imgRef.current = null;
    };
  }, [currentTrack?.artwork]);

  // 3. Toggle Document Picture-in-Picture Window
  const togglePictureInPicture = async () => {
    try {
      if ('documentPictureInPicture' in window) {
        if (pipContainer) {
          const pipWin = (window as any).documentPictureInPicture.window;
          if (pipWin) pipWin.close();
          setPipContainer(null);
          setIsPipActive(false);
          return;
        }

        // Compact Window Size for corner placement (320x340)
        const pipWin = await (window as any).documentPictureInPicture.requestWindow({
          width: 320,
          height: 340
        });

        // Copy all stylesheets from main window head to PiP window head
        Array.from(document.head.querySelectorAll('style, link[rel="stylesheet"]')).forEach((el) => {
          try {
            pipWin.document.head.appendChild(el.cloneNode(true));
          } catch (e) {}
        });

        pipWin.document.body.style.margin = '0';
        pipWin.document.body.style.backgroundColor = '#090a0f';
        pipWin.document.body.style.fontFamily = 'sans-serif';
        pipWin.document.body.style.color = '#ffffff';

        pipWin.addEventListener('pagehide', () => {
          setPipContainer(null);
          setIsPipActive(false);
        });

        setPipContainer(pipWin.document.body);
        setIsPipActive(true);
        return;
      }

      // Fallback HTML5 Video PiP
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas) return;

      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
        setIsPipActive(false);
      } else {
        if (!video.srcObject) {
          const stream = canvas.captureStream(30);
          video.srcObject = stream;
          await video.play();
        }
        await video.requestPictureInPicture();
        setIsPipActive(true);
      }
    } catch (err) {
      console.error('Failed to toggle Picture-in-Picture:', err);
    }
  };

  // Expose global window function for player controls invocation
  useEffect(() => {
    (window as any).toggleAuroraPip = togglePictureInPicture;
    return () => {
      delete (window as any).toggleAuroraPip;
    };
  }, [pipContainer]);

  // 4. Auto Pop-out PiP when switching browser tabs or minimizing window
  useEffect(() => {
    if (!isAutoPipEnabled) return;

    const handleVisibilityChange = async () => {
      if (document.hidden && isPlaying && currentTrack && !isPipActive && !pipContainer) {
        try {
          togglePictureInPicture();
        } catch (e) {}
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isAutoPipEnabled, isPlaying, currentTrack, isPipActive, pipContainer]);

  // Player Content rendered inside Floating Desktop Window
  const PlayerContent = (
    <div id="mini-player-window" data-mini-player="true" className="w-full h-full p-3.5 flex flex-col justify-between bg-[#090a0f] text-white select-none box-border border border-cyan-500/30">
      {/* Header with Mode Switcher (Controls vs Lyrics) */}
      <div className="flex items-center justify-between text-xs text-white/60 pb-2 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-1 bg-white/10 p-0.5 rounded-lg border border-white/10">
          <button
            onClick={() => setViewMode('controls')}
            className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase transition cursor-pointer ${
              viewMode === 'controls' ? 'bg-cyan-500 text-black shadow' : 'text-white/60 hover:text-white'
            }`}
          >
            Controls
          </button>
          <button
            onClick={() => setViewMode('lyrics')}
            className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase transition cursor-pointer ${
              viewMode === 'lyrics' ? 'bg-cyan-500 text-black shadow' : 'text-white/60 hover:text-white'
            }`}
          >
            Lyrics
          </button>
        </div>

        <div className="flex items-center gap-1.5 font-bold text-[10px] text-cyan-400 uppercase tracking-wider">
          <span>{siteName}</span>
          <button
            onClick={togglePictureInPicture}
            className="p-1 bg-white/10 hover:bg-white/20 text-white/70 hover:text-white rounded-lg transition cursor-pointer ml-1"
            title="Close Floating Window"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Body */}
      {!currentTrack ? (
        /* Idle State (No Song Playing) */
        <div className="flex-1 flex flex-col items-center justify-center text-center p-4 space-y-2">
          <div className="p-3 bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded-2xl animate-pulse">
            <Radio className="w-8 h-8" />
          </div>
          <h4 className="font-bold text-white text-sm">No Song Playing</h4>
          <p className="text-white/50 text-[11px]">Play a track on {siteName} Dashboard to start streaming</p>
        </div>
      ) : viewMode === 'lyrics' ? (
        /* Synced Karaoke Lyrics View */
        <div className="flex-1 flex flex-col justify-center my-2 overflow-hidden px-2 text-center">
          {lyrics && lyrics.length > 0 ? (
            <div className="space-y-3">
              {/* Previous Line */}
              {activeLyricIndex > 0 && (
                <p className="text-white/40 text-xs truncate">
                  {lyrics[activeLyricIndex - 1]?.text}
                </p>
              )}

              {/* Active Glowing Line */}
              <div className="p-2.5 bg-cyan-500/10 border border-cyan-500/30 rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.2)]">
                <p className="font-black text-cyan-300 text-sm sm:text-base leading-snug tracking-tight drop-shadow-[0_0_10px_rgba(6,182,212,0.8)]">
                  {activeLyricIndex >= 0 ? lyrics[activeLyricIndex]?.text : '♪ Music playing...'}
                </p>
              </div>

              {/* Next Line */}
              {activeLyricIndex >= 0 && activeLyricIndex < lyrics.length - 1 && (
                <p className="text-white/40 text-xs truncate">
                  {lyrics[activeLyricIndex + 1]?.text}
                </p>
              )}
            </div>
          ) : (
            <div className="text-center text-white/50 space-y-1">
              <FileText className="w-8 h-8 text-white/30 mx-auto mb-1" />
              <p className="text-xs font-bold">No Synced Lyrics Available</p>
              <p className="text-[10px] text-white/40">{currentTrack.title}</p>
            </div>
          )}
        </div>
      ) : (
        /* Controls & Compact Album Art View */
        <div className="flex-1 flex flex-col justify-between my-2">
          {/* Track Header & Artwork */}
          <div className="flex items-center gap-3">
            <img
              src={getCleanArtwork(currentTrack.artwork)}
              alt={currentTrack.title}
              className="w-14 h-14 rounded-2xl object-cover border border-white/10 shrink-0 shadow-md"
            />
            <div className="min-w-0 flex-1">
              <h4 className="font-black text-white text-xs sm:text-sm truncate">
                {currentTrack.title || 'Untitled Track'}
              </h4>
              <p className="text-cyan-400 font-bold text-[11px] truncate mt-0.5">
                {currentTrack.author || currentTrack.artist || `${siteName} Music`}
              </p>
            </div>
          </div>

          {/* Interactive Seek Bar */}
          <div className="space-y-1 my-2">
            <div className="relative w-full flex items-center">
              <input
                type="range"
                min={0}
                max={durationSecs || 100}
                step={0.1}
                value={displaySecs}
                onMouseDown={() => setIsSeeking(true)}
                onTouchStart={() => setIsSeeking(true)}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setSeekPos(val);
                  if (handleSeek) handleSeek(val * 1000);
                }}
                onMouseUp={() => {
                  setIsSeeking(false);
                  setSeekPos(null);
                }}
                onTouchEnd={() => {
                  setIsSeeking(false);
                  setSeekPos(null);
                }}
                className="w-full h-1.5 rounded-lg appearance-none cursor-pointer accent-cyan-400 bg-white/20 focus:outline-none"
              />
            </div>
            <div className="flex items-center justify-between text-[10px] text-white/50 font-mono font-bold">
              <span>{formatTime(displaySecs)}</span>
              <span>{formatTime(durationSecs)}</span>
            </div>
          </div>

          {/* Controls Row */}
          <div className="flex items-center justify-center pt-1">
            <div className="flex items-center gap-3">
              <button
                onClick={handlePrevious}
                className="p-2.5 bg-white/5 hover:bg-white/15 text-white/80 rounded-2xl transition active:scale-95 cursor-pointer border border-white/10"
                title="Previous"
              >
                <SkipBack className="w-3.5 h-3.5 fill-current" />
              </button>

              <button
                onClick={isPlaying ? handlePause : handlePlay}
                className="p-3.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-2xl shadow-[0_0_20px_rgba(6,182,212,0.5)] transition active:scale-95 cursor-pointer"
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? (
                  <Pause className="w-4 h-4 fill-current" />
                ) : (
                  <Play className="w-4 h-4 fill-current translate-x-0.5" />
                )}
              </button>

              <button
                onClick={handleSkip}
                className="p-2.5 bg-white/5 hover:bg-white/15 text-white/80 rounded-2xl transition active:scale-95 cursor-pointer border border-white/10"
                title="Next"
              >
                <SkipForward className="w-3.5 h-3.5 fill-current" />
              </button>
            </div>
          </div>

          {/* Interactive Volume Bar */}
          <div className="flex items-center gap-2 px-1 pt-2 border-t border-white/10 mt-2">
            <button
              onClick={() => handleVolumeChange && handleVolumeChange((volume ?? 50) === 0 ? 50 : 0)}
              className="text-white/60 hover:text-white transition cursor-pointer p-0.5"
              title={(volume ?? 50) === 0 ? 'Unmute' : 'Mute'}
            >
              {(volume ?? 50) === 0 ? (
                <VolumeX className="w-3.5 h-3.5 text-red-400" />
              ) : (
                <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
              )}
            </button>
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={volume ?? 50}
              onChange={(e) => handleVolumeChange && handleVolumeChange(Number(e.target.value))}
              className="w-full h-1.5 rounded-lg appearance-none cursor-pointer accent-cyan-400 bg-white/20 focus:outline-none"
            />
            <span className="text-[10px] text-white/60 font-mono font-bold w-7 text-right">
              {volume ?? 50}%
            </span>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Hidden Canvas & Video for Video PiP fallback */}
      <div className="hidden">
        <canvas ref={canvasRef} width={400} height={400} />
        <video ref={videoRef} muted playsInline />
      </div>

      {/* Render inside Document PiP Floating Window if active */}
      {pipContainer && createPortal(PlayerContent, pipContainer)}
    </>
  );
}
