'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useMusicPlayer } from '../hooks/useMusicPlayer';
import {
  Play, Pause, SkipForward, SkipBack, Repeat,
  Shuffle, Volume2, List, X, ExternalLink, Search
} from 'lucide-react';
import { useState, useEffect } from 'react';

export default function Player({ guildId, userId }: { guildId: string; userId: string }) {
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
  const [dominantColor, setDominantColor] = useState('rgba(0, 0, 0, 0.8)');
  const [searchQuery, setSearchQuery] = useState('');

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Extract dominant color from artwork
  useEffect(() => {
    if (!currentTrack?.artwork) {
      setDominantColor('rgba(0, 0, 0, 0.8)');
      return;
    }

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

        setDominantColor(`rgba(${r}, ${g}, ${b}, 0.5)`);
      } catch (error) {
        console.log('Could not extract color from image');
      }
    };
  }, [currentTrack?.artwork]);

  const getLoopIcon = () => {
    if (loopMode === 'track') {
      return (
        <div className="relative">
          <Repeat className="w-5 h-5" />
          <span className="absolute -bottom-1 -right-1 text-[10px] font-bold">1</span>
        </div>
      );
    }
    return <Repeat className="w-5 h-5" />;
  };

  const getLoopLabel = () => {
    if (loopMode === 'off') return 'Loop: Off';
    if (loopMode === 'track') return 'Loop: Track';
    return 'Loop: Queue';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] flex flex-col items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-4xl space-y-4">
        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="backdrop-blur-xl bg-white/10 rounded-xl p-4 border border-white/20"
        >
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search for songs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </motion.div>

        {/* Main Player Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="backdrop-blur-xl bg-white/10 rounded-2xl p-6 shadow-2xl border border-white/20 relative overflow-hidden"
        >
          {/* Dynamic Background Effect */}
          <motion.div
            animate={{
              background: [
                `radial-gradient(circle at 20% 50%, ${dominantColor} 0%, transparent 60%)`,
                `radial-gradient(circle at 80% 50%, ${dominantColor} 0%, transparent 60%)`,
                `radial-gradient(circle at 50% 80%, ${dominantColor} 0%, transparent 60%)`,
                `radial-gradient(circle at 20% 50%, ${dominantColor} 0%, transparent 60%)`
              ]
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 opacity-70 blur-3xl"
          />

          <div className="relative grid grid-cols-1 md:grid-cols-[auto_1fr] gap-6">
            {/* Album Art Section */}
            <div className="flex flex-col items-center justify-center">
              <AnimatePresence mode="wait">
                {currentTrack && (
                  <motion.div
                    key={currentTrack.title}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.5, ease: 'easeInOut' }}
                    className="relative"
                  >
                    {/* Glow effect behind artwork */}
                    <motion.div
                      className="absolute inset-0 blur-2xl opacity-70"
                      style={{ background: dominantColor }}
                      animate={{ scale: [1, 1.15, 1] }}
                      transition={{ duration: 3, repeat: Infinity }}
                    />
                    <img
                      src={currentTrack.artwork}
                      alt={currentTrack.title}
                      className="relative w-48 h-48 md:w-56 md:h-56 rounded-xl shadow-2xl object-cover ring-2 ring-white/30"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Controls Section */}
            <div className="flex flex-col justify-between space-y-4">
              {/* Track Info with Link */}
              <motion.div
                className="space-y-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <div className="flex items-start gap-2">
                  <h2 className="text-xl md:text-2xl font-bold text-white flex-1">
                    {currentTrack?.title || 'No track playing'}
                  </h2>
                  {currentTrack?.url && (
                    <a
                      href={currentTrack.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors flex-shrink-0"
                      title="Open in YouTube/Spotify"
                    >
                      <ExternalLink className="w-5 h-5 text-white" />
                    </a>
                  )}
                </div>
                <p className="text-gray-300 text-sm md:text-base">{currentTrack?.author || 'Unknown Artist'}</p>
              </motion.div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <input
                  type="range"
                  min="0"
                  max={currentTrack?.duration || 0}
                  value={position}
                  onChange={(e) => handleSeek(Number(e.target.value))}
                  className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
                  style={{
                    background: `linear-gradient(to right, #a855f7 0%, #a855f7 ${(position / (currentTrack?.duration || 1)) * 100}%, rgba(255,255,255,0.2) ${(position / (currentTrack?.duration || 1)) * 100}%, rgba(255,255,255,0.2) 100%)`
                  }}
                />
                <div className="flex justify-between text-sm text-gray-300">
                  <span>{formatTime(position)}</span>
                  <span>{formatTime(currentTrack?.duration || 0)}</span>
                </div>
              </div>

              {/* Main Controls */}
              <div className="flex items-center justify-center gap-3">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handlePrevious}
                  className="p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                >
                  <SkipBack className="w-5 h-5 text-white" />
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={isPlaying ? handlePause : handlePlay}
                  className="p-4 rounded-full bg-gradient-to-r from-purple-500 to-teal-500 hover:from-purple-600 hover:to-teal-600 transition-all shadow-lg"
                >
                  {isPlaying ? (
                    <Pause className="w-7 h-7 text-white" fill="white" />
                  ) : (
                    <Play className="w-7 h-7 text-white" fill="white" />
                  )}
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSkip}
                  className="p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                >
                  <SkipForward className="w-5 h-5 text-white" />
                </motion.button>
              </div>

              {/* Filter Buttons & Volume */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                {/* Loop & Autoplay Filters */}
                <div className="flex items-center gap-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleLoopChange}
                    className={`px-3 py-2 rounded-lg text-xs font-medium transition-all flex items-center gap-2 ${loopMode !== 'off'
                        ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/50'
                        : 'bg-white/10 text-gray-300 hover:bg-white/20'
                      }`}
                  >
                    {getLoopIcon()}
                    <span className="hidden sm:inline">{getLoopLabel()}</span>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleAutoplayToggle}
                    className={`px-3 py-2 rounded-lg text-xs font-medium transition-all flex items-center gap-2 ${autoplay
                        ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/50'
                        : 'bg-white/10 text-gray-300 hover:bg-white/20'
                      }`}
                  >
                    <Shuffle className="w-4 h-4" />
                    <span className="hidden sm:inline">Autoplay: {autoplay ? 'On' : 'Off'}</span>
                  </motion.button>
                </div>

                {/* Volume & Queue */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Volume2 className="w-4 h-4 text-gray-300" />
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={volume}
                      onChange={(e) => handleVolumeChange(Number(e.target.value))}
                      className="w-20 h-2 bg-white/20 rounded-lg appearance-none cursor-pointer"
                    />
                    <span className="text-xs text-gray-300 w-8">{volume}%</span>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowQueue(!showQueue)}
                    className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors relative"
                  >
                    <List className="w-5 h-5 text-white" />
                    {queue.length > 0 && (
                      <span className="absolute -top-1 -right-1 bg-purple-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {queue.length}
                      </span>
                    )}
                  </motion.button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Queue Modal */}
        <AnimatePresence>
          {showQueue && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowQueue(false)}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
              />

              {/* Queue Panel */}
              <motion.div
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 100 }}
                className="fixed right-0 top-0 bottom-0 w-full md:w-96 backdrop-blur-xl bg-gradient-to-br from-[#0f0c29]/95 via-[#302b63]/95 to-[#24243e]/95 shadow-2xl border-l border-white/20 z-50 overflow-hidden"
              >
                <div className="h-full flex flex-col">
                  {/* Header */}
                  <div className="flex items-center justify-between p-6 border-b border-white/20">
                    <h3 className="text-xl font-bold text-white">Queue ({queue.length})</h3>
                    <button
                      onClick={() => setShowQueue(false)}
                      className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                    >
                      <X className="w-5 h-5 text-white" />
                    </button>
                  </div>

                  {/* Queue List */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {queue.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-center">
                        <List className="w-16 h-16 text-gray-500 mb-4" />
                        <p className="text-gray-400 text-lg">Queue is empty</p>
                        <p className="text-gray-500 text-sm mt-2">Add songs to see them here</p>
                      </div>
                    ) : (
                      queue.map((track, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.03 }}
                          className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors group"
                        >
                          <div className="flex-shrink-0 relative">
                            <img
                              src={track.artwork}
                              alt={track.title}
                              className="w-14 h-14 rounded-lg object-cover"
                            />
                            <div className="absolute inset-0 bg-black/40 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <span className="text-white font-bold text-sm">#{index + 1}</span>
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-white font-medium truncate text-sm">{track.title}</p>
                            <p className="text-gray-400 text-xs truncate">{track.author}</p>
                          </div>
                          <span className="text-gray-400 text-xs flex-shrink-0">{formatTime(track.duration)}</span>
                        </motion.div>
                      ))
                    )}
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
