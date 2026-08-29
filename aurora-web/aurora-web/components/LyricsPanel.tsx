'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Music2, RefreshCw } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';

interface LyricLine {
  time: number;
  text: string;
}

interface LyricsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  trackTitle: string;
  trackAuthor: string;
  currentPosition: number;
  onSeek?: (position: number) => void;
}

export default function LyricsPanel({ isOpen, onClose, trackTitle, trackAuthor, currentPosition, onSeek }: LyricsPanelProps) {
  const [lyrics, setLyrics] = useState<LyricLine[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAutoSync, setIsAutoSync] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const activeLineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && trackTitle && trackAuthor) {
      fetchLyrics();
    }
  }, [isOpen, trackTitle, trackAuthor]);

  const fetchLyrics = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const socketUrl = typeof window !== 'undefined' ? '' : (process.env.NEXT_PUBLIC_SOCKET_URL || 'http://bot:3001');
      const response = await fetch(
        `${socketUrl}/api/lyrics?title=${encodeURIComponent(trackTitle)}&artist=${encodeURIComponent(trackAuthor)}`
      );
      
      if (!response.ok) {
        throw new Error('Lyrics not found');
      }
      
      const data = await response.json();
      setLyrics(data.lyrics || []);
    } catch (err) {
      setError('Lyrics not available for this song');
      setLyrics([]);
    } finally {
      setLoading(false);
    }
  };

  // Find current active line
  const currentLineIndex = lyrics.findIndex((line, index) => {
    const nextLine = lyrics[index + 1];
    return currentPosition >= line.time && (!nextLine || currentPosition < nextLine.time);
  });

  // Auto-scroll to active line
  useEffect(() => {
    if (isAutoSync && currentLineIndex >= 0 && activeLineRef.current && containerRef.current) {
      const container = containerRef.current;
      const activeLine = activeLineRef.current;
      const scrollTo = activeLine.offsetTop - (container.clientHeight / 2) + (activeLine.clientHeight / 2);
      container.scrollTo({
        top: Math.max(0, scrollTo),
        behavior: 'smooth'
      });
    }
  }, [currentLineIndex, isAutoSync]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
          />
          
          {/* Lyrics Panel - Transparent & No Sidebars */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-4 md:inset-12 max-w-4xl mx-auto bg-transparent z-50 overflow-hidden flex flex-col justify-between"
          >
            <div className="h-full flex flex-col relative">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-white/10 bg-transparent">
                <div>
                  <h3 className="text-2xl font-bold text-white drop-shadow-md">Live Lyrics</h3>
                  <p className="text-xs text-white/60 mt-0.5">{trackTitle} • {trackAuthor}</p>
                </div>
                <button
                  onClick={onClose}
                  className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 transition-all flex items-center justify-center text-white backdrop-blur-xl border border-white/10 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Lyrics Content */}
              <div
                ref={containerRef}
                onWheel={() => setIsAutoSync(false)}
                onTouchMove={() => setIsAutoSync(false)}
                className="flex-1 overflow-y-auto px-6 py-10 scroll-smooth custom-scrollbar bg-transparent"
              >
                {loading && (
                  <div className="flex flex-col items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white/30 border-t-white mb-4"></div>
                    <p className="text-white/60">Loading lyrics...</p>
                  </div>
                )}

                {error && (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <Music2 className="w-16 h-16 text-white/20 mb-4" />
                    <p className="text-white/70 text-lg font-semibold">{error}</p>
                    <p className="text-white/40 text-sm mt-2">Try another song</p>
                  </div>
                )}

                {!loading && !error && lyrics.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <Music2 className="w-16 h-16 text-white/20 mb-4" />
                    <p className="text-white/70 text-lg font-semibold">No lyrics available</p>
                    <p className="text-white/40 text-sm mt-2">Lyrics not found for this song</p>
                  </div>
                )}

                {!loading && !error && lyrics.length > 0 && (
                  <div className="space-y-6 text-center">
                    {lyrics.map((line, index) => {
                      const isActive = index === currentLineIndex;
                      
                      return (
                        <div
                          key={index}
                          ref={isActive ? activeLineRef : null}
                          onClick={(e) => {
                            if (typeof line.time === 'number') {
                              if (onSeek) onSeek(line.time * 1000);
                              setIsAutoSync(true);
                              const container = containerRef.current;
                              const target = e.currentTarget;
                              if (container && target) {
                                const scrollTo = target.offsetTop - (container.clientHeight / 2) + (target.clientHeight / 2);
                                container.scrollTo({ top: Math.max(0, scrollTo), behavior: 'smooth' });
                              }
                            }
                          }}
                          style={{
                            textShadow: isActive
                              ? '0 0 25px rgba(255,255,255,0.95), 0 0 40px rgba(56,189,248,0.7), 0 2px 12px rgba(0,0,0,0.95)'
                              : '0 1px 6px rgba(0,0,0,0.85)'
                          }}
                          className={`transition-colors duration-300 cursor-pointer text-3xl md:text-4xl font-bold leading-relaxed ${
                            isActive
                              ? 'text-white opacity-100'
                              : 'text-white/60 opacity-60 hover:text-white/95 hover:opacity-95'
                          }`}
                        >
                          {line.text}
                        </div>
                      );
                    })}
                    <div className="h-48" />
                  </div>
                )}
              </div>

              {/* Floating Glassmorphism Re-Sync Button */}
              {!isAutoSync && (
                <motion.div
                  initial={{ opacity: 0, y: 15, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 15, scale: 0.9 }}
                  className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50"
                >
                  <button
                    onClick={() => {
                      setIsAutoSync(true);
                      if (activeLineRef.current && containerRef.current) {
                        const container = containerRef.current;
                        const activeLine = activeLineRef.current;
                        const scrollTo = activeLine.offsetTop - (container.clientHeight / 2) + (activeLine.clientHeight / 2);
                        container.scrollTo({ top: scrollTo, behavior: 'smooth' });
                      }
                    }}
                    className="px-5 py-2.5 rounded-full backdrop-blur-2xl bg-white/15 hover:bg-white/25 border border-white/20 text-white font-semibold text-xs flex items-center gap-2 shadow-[0_8px_32px_rgba(0,0,0,0.5)] transition-all cursor-pointer hover:scale-105 active:scale-95"
                  >
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '6s' }} />
                    <span>Re-Sync Lyrics</span>
                  </button>
                </motion.div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
