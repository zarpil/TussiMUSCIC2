'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Music2, RefreshCw } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import { LyricLine, getActiveLyricIndex } from '../utils/parseLRC';
import { useSmoothTime } from '../hooks/useSmoothTime';
import { io, Socket } from 'socket.io-client';

interface SpotifyLyricsProps {
  isOpen: boolean;
  onClose: () => void;
  trackTitle: string;
  trackAuthor: string;
  trackUrl: string;
  currentPosition: number;
  isPlaying: boolean;
  guildId: string;
  userId?: string;
  onSeek?: (position: number) => void;
}

export default function SpotifyLyrics({ 
  isOpen, 
  onClose, 
  trackTitle, 
  trackAuthor, 
  trackUrl,
  currentPosition, 
  isPlaying,
  guildId,
  userId,
  onSeek
}: SpotifyLyricsProps) {
  const [lyrics, setLyrics] = useState<LyricLine[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAutoSync, setIsAutoSync] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const activeLineRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const isUserInteractingLyricsRef = useRef(false);
  const autoResyncTimerRef = useRef<NodeJS.Timeout | null>(null);

  const smoothTime = useSmoothTime(currentPosition / 1000, isPlaying);
  const activeLyricIndex = getActiveLyricIndex(lyrics, smoothTime);

  const handleLyricsContainerScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (!isUserInteractingLyricsRef.current) return;
    
    const container = containerRef.current;
    const activeLine = activeLineRef.current;
    if (container && activeLine) {
      const targetScroll = activeLine.offsetTop - (container.clientHeight / 2) + (activeLine.clientHeight / 2);
      const diff = Math.abs(container.scrollTop - targetScroll);
      
      if (diff > 100) {
        setIsAutoSync(false);

        if (autoResyncTimerRef.current) clearTimeout(autoResyncTimerRef.current);
        autoResyncTimerRef.current = setTimeout(() => {
          setIsAutoSync(true);
        }, 5000);
      }
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    const getUserId = () => {
      if (userId) return userId;
      try {
        const storedUserId = localStorage.getItem('discordUserId');
        if (storedUserId) return storedUserId;

        const userCookie = document.cookie
          .split('; ')
          .find(row => row.startsWith('discord_user='))
          ?.split('=')[1];

        if (userCookie) {
          const userData = JSON.parse(decodeURIComponent(userCookie));
          localStorage.setItem('discordUserId', userData.id);
          return userData.id;
        }
      } catch (e) {
        console.error('[Socket] Failed to get user ID:', e);
      }
      return null;
    };
    const currentUserId = getUserId();

    const socketUrl = (typeof window !== 'undefined' && window.self !== window.top) ? undefined : (process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001');
    const socket = io(socketUrl, {
      auth: {
        userId: currentUserId
      }
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[Lyrics] 🔌 Socket connected');
      socket.emit('join-guild', guildId);
    });

    socket.on('lyrics_data', (data: any) => {
      console.log('[Lyrics] ✅ Received lyrics_data:', data.title, '-', data.lyrics.length, 'lines');
      
      if (data.title === trackTitle && data.author === trackAuthor) {
        setLyrics(data.lyrics);
        setLoading(false);
        setError(null);
      }
    });

    socket.on('lyrics_not_found', (data: any) => {
      console.log('[Lyrics] ⚠️ Received lyrics_not_found:', data.title);
      
      if (data.title === trackTitle && data.author === trackAuthor) {
        setError(data.message || 'No lyrics found on Deezer.');
        setLyrics([]);
        setLoading(false);
      }
    });

    socket.on('disconnect', () => {
      console.log('[Lyrics] 🔌 Socket disconnected');
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [isOpen, guildId, trackTitle, trackAuthor, userId]);

  useEffect(() => {
    if (isOpen && trackTitle && trackAuthor) {
      setLoading(true);
      setError(null);
      setLyrics([]);
    }
  }, [isOpen, trackTitle, trackAuthor]);

  useEffect(() => {
    if (isAutoSync && activeLineRef.current && containerRef.current) {
      const container = containerRef.current;
      const activeLine = activeLineRef.current;
      
      const containerHeight = container.clientHeight;
      const lineTop = activeLine.offsetTop;
      const lineHeight = activeLine.clientHeight;
      
      const scrollTo = lineTop - (containerHeight / 2) + (lineHeight / 2);
      
      container.scrollTo({
        top: scrollTo,
        behavior: 'smooth'
      });
    }
  }, [activeLyricIndex, isAutoSync]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
          />
          
          {/* Lyrics Panel - Hidden Sidebars & Transparent Background */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed inset-4 md:inset-12 max-w-4xl mx-auto bg-transparent z-50 overflow-hidden flex flex-col justify-between"
          >
            <div className="h-full flex flex-col relative">
              {/* Header */}
              <div className="flex items-center justify-between p-4 bg-transparent border-b border-white/10">
                <div>
                  <h3 className="text-2xl font-bold text-white drop-shadow-md">Lyrics</h3>
                  <p className="text-xs text-white/60 mt-0.5">{trackTitle}</p>
                </div>
                <button
                  onClick={onClose}
                  className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 transition-all flex items-center justify-center text-white backdrop-blur-xl border border-white/10 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Lyrics Content - Fully Scrollable */}
              <div 
                ref={containerRef}
                onPointerDown={() => { isUserInteractingLyricsRef.current = true; }}
                onPointerUp={() => { setTimeout(() => { isUserInteractingLyricsRef.current = false; }, 300); }}
                onTouchStart={() => { isUserInteractingLyricsRef.current = true; }}
                onTouchEnd={() => { setTimeout(() => { isUserInteractingLyricsRef.current = false; }, 300); }}
                onWheel={() => {
                  isUserInteractingLyricsRef.current = true;
                  setTimeout(() => { isUserInteractingLyricsRef.current = false; }, 800);
                }}
                onScroll={handleLyricsContainerScroll}
                className="flex-1 overflow-y-auto px-6 py-10 scroll-smooth custom-scrollbar bg-transparent"
              >
                {loading && (
                  <div className="flex flex-col items-center justify-center h-full">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full mb-4"
                    />
                    <p className="text-white/60">Loading lyrics...</p>
                  </div>
                )}

                {error && (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <Music2 className="w-20 h-20 text-white/20 mb-4" />
                    <p className="text-white/70 text-lg font-semibold">{error}</p>
                    <p className="text-white/40 text-sm mt-2">Lyrics not available for this track</p>
                  </div>
                )}

                {!loading && !error && lyrics.length > 0 && (
                  <div className="space-y-8 text-center">
                    {lyrics.map((line, index) => {
                      const isActive = index === activeLyricIndex;
                      
                      return (
                        <div
                          key={line.id || index}
                          ref={isActive ? activeLineRef : null}
                          onClick={(e) => {
                            if (typeof line.time === 'number') {
                              if (onSeek) onSeek(line.time * 1000);
                              else if (socketRef.current) socketRef.current.emit('player-action', { guildId, userId, action: 'seek', value: line.time * 1000 });
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
                          className={`transition-colors duration-300 leading-relaxed cursor-pointer text-3xl md:text-4xl font-bold ${
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

              {/* Floating Glassmorphism Controls */}
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3">
                {!isAutoSync && (
                  <button
                    onClick={() => {
                      setIsAutoSync(true);
                      if (activeLineRef.current && containerRef.current) {
                        const container = containerRef.current;
                        const activeLine = activeLineRef.current;
                        const scrollTo = activeLine.offsetTop - (container.clientHeight / 2) + (activeLine.clientHeight / 2);
                        container.scrollTo({ top: Math.max(0, scrollTo), behavior: 'smooth' });
                      }
                    }}
                    className="px-4 py-2 rounded-full backdrop-blur-2xl bg-white/15 hover:bg-white/25 border border-white/20 text-white font-semibold text-xs flex items-center gap-2 shadow-[0_8px_32px_rgba(0,0,0,0.5)] transition-all cursor-pointer hover:scale-105 active:scale-95"
                  >
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '6s' }} />
                    <span>Re-Sync View</span>
                  </button>
                )}
                <button
                  title="Re-fetch fresh millisecond synced lyrics from LRCLIB"
                  onClick={() => {
                    setLoading(true);
                    setError(null);
                    if (socketRef.current) {
                      socketRef.current.emit('request-lyrics', { guildId, forceRefresh: true });
                    }
                  }}
                  className="px-4 py-2 rounded-full backdrop-blur-2xl bg-amber-400/20 hover:bg-amber-400/30 border border-amber-400/40 text-amber-300 font-semibold text-xs flex items-center gap-2 shadow-[0_8px_32px_rgba(0,0,0,0.5)] transition-all cursor-pointer hover:scale-105 active:scale-95"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Re-Fetch Synced Lyrics</span>
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
