'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useMusicPlayer } from '../hooks/useMusicPlayer';
import { 
  Play, Pause, SkipForward, SkipBack, Repeat, 
  Shuffle, Volume2, List, X, ExternalLink, Music2, Heart
} from 'lucide-react';
import { useState, useEffect } from 'react';
import ToastContainer from './ToastContainer';
import SpotifyLyrics from './SpotifyLyrics';

interface ToastData {
  id: number;
  message: string;
  type: 'success' | 'error' | 'warning';
}

let toastIdCounter = 0;

export default function SpotifyPlayer({ guildId, userId }: { guildId: string; userId: string }) {
  const {
    currentTrack,
    queue,
    isPlaying,
    volume,
    loopMode,
    autoplay,
    position,
    handlePlay,
    handlePause,
    handleSkip,
    handlePrevious,
    handleSeek,
    handleVolumeChange,
    handleLoopChange,
    handleAutoplayToggle
  } = useMusicPlayer(guildId, userId);

  const [showQueue, setShowQueue] = useState(false);
  const [dominantColor, setDominantColor] = useState('30, 215, 96');
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const [showLyrics, setShowLyrics] = useState(false);
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    const handleToast = (event: CustomEvent) => {
      const { message, type } = event.detail;
      const id = toastIdCounter++;
      setToasts(prev => [...prev, { id, message, type }]);
    };

    window.addEventListener('show-toast' as any, handleToast);
    return () => window.removeEventListener('show-toast' as any, handleToast);
  }, []);

  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    if (!currentTrack?.artwork) return;

    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.src = currentTrack.artwork;
    
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        let r = 0, g = 0, b = 0;

        for (let i = 0; i < data.length; i += 4) {
          r += data[i];
          g += data[i + 1];
          b += data[i + 2];
        }

        const pixelCount = data.length / 4;
        r = Math.floor(r / pixelCount);
        g = Math.floor(g / pixelCount);
        b = Math.floor(b / pixelCount);

        setDominantColor(`${r}, ${g}, ${b}`);
      } catch (error) {
        console.log('Could not extract color');
      }
    };
  }, [currentTrack?.artwork]);

  const getLoopIcon = () => {
    if (loopMode === 'track') {
      return (
        <div className="relative">
          <Repeat className="w-4 h-4" />
          <span className="absolute -bottom-0.5 -right-0.5 text-[9px] font-bold">1</span>
        </div>
      );
    }
    return <Repeat className="w-4 h-4" />;
  };

  return (
    <div className="min-h-screen bg-black flex">
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Gradient */}
        <div 
          className="h-80 relative"
          style={{
            background: `linear-gradient(180deg, rgba(${dominantColor}, 0.6) 0%, rgba(0,0,0,0.8) 100%)`
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black" />
        </div>

        {/* Player Card - Spotify Style */}
        <div className="flex-1 -mt-60 px-6 pb-32">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row gap-8 items-start">
              {/* Album Art */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex-shrink-0"
              >
                <div className="relative group">
                  <img
                    src={currentTrack?.artwork || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&q=80'}
                    onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&q=80'; }}
                    alt={currentTrack?.title || 'No track'}
                    className="w-64 h-64 md:w-80 md:h-80 rounded-lg shadow-2xl"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                    <button
                      onClick={isPlaying ? handlePause : handlePlay}
                      className="w-16 h-16 rounded-full bg-green-500 hover:bg-green-400 hover:scale-105 transition-all flex items-center justify-center shadow-xl"
                    >
                      {isPlaying ? (
                        <Pause className="w-8 h-8 text-black" fill="black" />
                      ) : (
                        <Play className="w-8 h-8 text-black ml-1" fill="black" />
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>

              {/* Track Info */}
              <div className="flex-1 flex flex-col justify-end">
                <p className="text-sm font-semibold text-white/70 mb-2">SONG</p>
                <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 leading-tight">
                  {currentTrack?.title || 'No track playing'}
                </h1>
                <div className="flex items-center gap-4 text-white/70">
                  <p className="text-lg font-semibold">{currentTrack?.author || 'Unknown Artist'}</p>
                  <span>•</span>
                  <p>{formatTime(currentTrack?.duration || 0)}</p>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-4 mt-8">
                  <button
                    onClick={isPlaying ? handlePause : handlePlay}
                    className="w-14 h-14 rounded-full bg-green-500 hover:bg-green-400 hover:scale-105 transition-all flex items-center justify-center shadow-lg"
                  >
                    {isPlaying ? (
                      <Pause className="w-7 h-7 text-black" fill="black" />
                    ) : (
                      <Play className="w-7 h-7 text-black ml-0.5" fill="black" />
                    )}
                  </button>

                  <button
                    onClick={() => setLiked(!liked)}
                    className={`w-10 h-10 rounded-full hover:bg-white/10 transition-all flex items-center justify-center ${
                      liked ? 'text-green-500' : 'text-white/70'
                    }`}
                  >
                    <Heart className="w-6 h-6" fill={liked ? 'currentColor' : 'none'} />
                  </button>

                  {currentTrack?.url && (
                    <a
                      href={currentTrack.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-10 h-10 rounded-full hover:bg-white/10 transition-all flex items-center justify-center text-white/70"
                    >
                      <ExternalLink className="w-5 h-5" />
                    </a>
                  )}

                  <button
                    onClick={() => setShowLyrics(!showLyrics)}
                    className={`px-4 py-2 rounded-full font-semibold transition-all ${
                      showLyrics
                        ? 'bg-white/20 text-white'
                        : 'bg-white/10 text-white/70 hover:bg-white/20'
                    }`}
                  >
                    <Music2 className="w-4 h-4 inline mr-2" />
                    Lyrics
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Player Bar - Fixed */}
        <div className="fixed bottom-0 left-0 right-0 bg-black/95 backdrop-blur-xl border-t border-white/10 px-4 py-3 z-30">
          <div className="max-w-7xl mx-auto">
            {/* Progress Bar */}
            <div className="flex items-center gap-3 mb-3">
              <span className="text-xs text-white/50 w-12 text-right">{formatTime(position)}</span>
              <div className="flex-1 group">
                <input
                  type="range"
                  min="0"
                  max={currentTrack?.duration || 0}
                  value={position}
                  onChange={(e) => handleSeek(Number(e.target.value))}
                  className="w-full h-1 bg-white/20 rounded-full appearance-none cursor-pointer hover:h-1.5 transition-all"
                  style={{
                    background: `linear-gradient(to right, #1ed760 0%, #1ed760 ${(position / (currentTrack?.duration || 1)) * 100}%, rgba(255,255,255,0.2) ${(position / (currentTrack?.duration || 1)) * 100}%, rgba(255,255,255,0.2) 100%)`
                  }}
                />
              </div>
              <span className="text-xs text-white/50 w-12">{formatTime(currentTrack?.duration || 0)}</span>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between">
              {/* Left - Track Info */}
              <div className="flex items-center gap-3 flex-1">
                <img
                  src={currentTrack?.artwork || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&q=80'}
                  onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&q=80'; }}
                  alt=""
                  className="w-14 h-14 rounded object-cover"
                />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{currentTrack?.title || 'No track'}</p>
                  <p className="text-xs text-white/50 truncate">{currentTrack?.author || 'Unknown'}</p>
                </div>
                <button
                  onClick={() => setLiked(!liked)}
                  className={`ml-2 ${liked ? 'text-green-500' : 'text-white/50 hover:text-white'}`}
                >
                  <Heart className="w-4 h-4" fill={liked ? 'currentColor' : 'none'} />
                </button>
              </div>

              {/* Center - Playback Controls */}
              <div className="flex items-center gap-4">
                <button
                  onClick={handleAutoplayToggle}
                  className={`${autoplay ? 'text-green-500' : 'text-white/50'} hover:text-white transition-colors`}
                >
                  <Shuffle className="w-4 h-4" />
                </button>

                <button
                  onClick={handlePrevious}
                  className="text-white/70 hover:text-white transition-colors"
                >
                  <SkipBack className="w-5 h-5" />
                </button>

                <button
                  onClick={isPlaying ? handlePause : handlePlay}
                  className="w-8 h-8 rounded-full bg-white hover:scale-105 transition-all flex items-center justify-center"
                >
                  {isPlaying ? (
                    <Pause className="w-4 h-4 text-black" fill="black" />
                  ) : (
                    <Play className="w-4 h-4 text-black ml-0.5" fill="black" />
                  )}
                </button>

                <button
                  onClick={handleSkip}
                  className="text-white/70 hover:text-white transition-colors"
                >
                  <SkipForward className="w-5 h-5" />
                </button>

                <button
                  onClick={handleLoopChange}
                  className={`${loopMode !== 'off' ? 'text-green-500' : 'text-white/50'} hover:text-white transition-colors`}
                >
                  {getLoopIcon()}
                </button>
              </div>

              {/* Right - Volume & Queue */}
              <div className="flex items-center gap-3 flex-1 justify-end">
                <button
                  onClick={() => setShowQueue(!showQueue)}
                  className="text-white/70 hover:text-white transition-colors relative"
                >
                  <List className="w-5 h-5" />
                  {queue.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-green-500 text-black text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                      {queue.length}
                    </span>
                  )}
                </button>

                <div className="flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-white/70" />
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={volume}
                    onChange={(e) => handleVolumeChange(Number(e.target.value))}
                    className="w-24 h-1 bg-white/20 rounded-full appearance-none cursor-pointer"
                  />
                  <span className="text-xs text-white/50 w-8">{volume}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Queue Sidebar - Spotify Style */}
      <AnimatePresence>
        {showQueue && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowQueue(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            />
            
            <motion.div
              initial={{ x: 400 }}
              animate={{ x: 0 }}
              exit={{ x: 400 }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed right-0 top-0 bottom-0 w-96 bg-neutral-900 z-50 flex flex-col"
            >
              {/* Header */}
              <div className="p-6 border-b border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-2xl font-bold text-white">Queue</h2>
                  <button
                    onClick={() => setShowQueue(false)}
                    className="w-8 h-8 rounded-full hover:bg-white/10 transition-colors flex items-center justify-center text-white/70"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-sm text-white/50">{queue.length} songs</p>
              </div>

              {/* Queue List */}
              <div className="flex-1 overflow-y-auto p-4">
                {queue.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <List className="w-16 h-16 text-white/20 mb-4" />
                    <p className="text-white/50">Queue is empty</p>
                    <p className="text-white/30 text-sm mt-2">Add songs to see them here</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {queue.map((track, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors group cursor-pointer"
                      >
                        <div className="relative flex-shrink-0">
                          <img
                            src={track.artwork}
                            alt={track.title}
                            className="w-12 h-12 rounded"
                          />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded flex items-center justify-center">
                            <span className="text-white font-bold text-sm">{index + 1}</span>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-medium truncate">{track.title}</p>
                          <p className="text-white/50 text-xs truncate">{track.author}</p>
                        </div>
                        <span className="text-white/50 text-xs flex-shrink-0">{formatTime(track.duration)}</span>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <SpotifyLyrics
        isOpen={showLyrics}
        onClose={() => setShowLyrics(false)}
        trackTitle={currentTrack?.title || ''}
        trackAuthor={currentTrack?.author || ''}
        trackUrl={currentTrack?.url || ''}
        currentPosition={position}
        isPlaying={isPlaying}
        guildId={guildId}
        userId={userId}
      />
    </div>
  );
}
