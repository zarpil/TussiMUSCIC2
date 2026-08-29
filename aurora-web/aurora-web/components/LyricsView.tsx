'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Music2, Sparkles } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import { LyricLine, getActiveLyricIndex } from '../utils/parseLRC';
import { useSmoothTime } from '../hooks/useSmoothTime';
import { io, Socket } from 'socket.io-client';

interface LyricsViewProps {
  isOpen: boolean;
  onClose: () => void;
  trackTitle: string;
  trackAuthor: string;
  trackUrl: string;
  currentPosition: number; // in milliseconds from socket
  isPlaying: boolean;
  guildId: string;
  userId?: string;
}

export default function LyricsView({ 
  isOpen, 
  onClose, 
  trackTitle, 
  trackAuthor, 
  trackUrl,
  currentPosition, 
  isPlaying,
  guildId,
  userId
}: LyricsViewProps) {
  const [lyrics, setLyrics] = useState<LyricLine[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [synced, setSynced] = useState(false);
  const [dominantColor, setDominantColor] = useState('rgba(0, 0, 0, 0.8)');
  const containerRef = useRef<HTMLDivElement>(null);
  const activeLineRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);

  // Convert milliseconds to seconds and smooth it out at 60fps
  const smoothTime = useSmoothTime(currentPosition / 1000, isPlaying);
  
  // Get active lyric index
  const activeLyricIndex = getActiveLyricIndex(lyrics, smoothTime);

  // Setup Socket.io connection for real-time lyrics events
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

    const socketUrl = typeof window !== 'undefined' ? '' : (process.env.NEXT_PUBLIC_SOCKET_URL || 'http://bot:3001');
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

    // Listen for lyrics_data (renamed from lyrics_payload)
    socket.on('lyrics_data', (data: any) => {
      console.log('[Lyrics] ✅ Received lyrics_data:', data.title, '-', data.lyrics.length, 'lines');
      
      // Only update if it's for the current track
      if (data.title === trackTitle && data.author === trackAuthor) {
        setLyrics(data.lyrics);
        setSynced(data.synced);
        setLoading(false);
        setError(null);
      }
    });

    // Listen for lyrics_not_found
    socket.on('lyrics_not_found', (data: any) => {
      console.log('[Lyrics] ⚠️ Received lyrics_not_found:', data.title);
      
      // Only update if it's for the current track
      if (data.title === trackTitle && data.author === trackAuthor) {
        setError(data.message || 'No lyrics found on Deezer.');
        setLyrics([]);
        setSynced(false);
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

  // Set loading state when track changes
  useEffect(() => {
    if (isOpen && trackTitle && trackAuthor) {
      setLoading(true);
      setError(null);
      setLyrics([]);
    }
  }, [isOpen, trackTitle, trackAuthor]);

  // Extract dominant color from artwork URL
  useEffect(() => {
    if (!trackUrl) return;

    const img = new Image();
    img.crossOrigin = 'Anonymous';
    
    // Use the artwork from the track
    const artworkUrl = trackUrl.includes('youtube') 
      ? `https://img.youtube.com/vi/${extractYouTubeId(trackUrl)}/maxresdefault.jpg`
      : 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&q=80';
    
    img.src = artworkUrl;
    
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

        setDominantColor(`rgba(${r}, ${g}, ${b}, 0.4)`);
      } catch (error) {
        console.log('[Lyrics] Could not extract color from artwork');
      }
    };
  }, [trackUrl]);

  // Spotify-style auto-scroll: Keep active line centered with spring animation
  useEffect(() => {
    if (activeLineRef.current && containerRef.current) {
      const container = containerRef.current;
      const activeLine = activeLineRef.current;
      
      const containerHeight = container.clientHeight;
      const lineTop = activeLine.offsetTop;
      const lineHeight = activeLine.clientHeight;
      
      // Calculate scroll position to center the active line vertically
      const scrollTo = lineTop - (containerHeight / 2) + (lineHeight / 2);
      
      container.scrollTo({
        top: scrollTo,
        behavior: 'smooth'
      });
    }
  }, [activeLyricIndex]);

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
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />
          
          {/* Spotify-Style Lyrics Panel */}
          <motion.div
            initial={{ opacity: 0, x: -100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed left-0 top-0 bottom-0 w-full md:w-[28rem] backdrop-blur-xl shadow-2xl border-r border-white/20 z-50 overflow-hidden"
            style={{
              background: `linear-gradient(135deg, ${dominantColor}, rgba(15, 12, 41, 0.95))`
            }}
          >
            <div className="h-full flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-white/20 bg-gradient-to-r from-purple-500/10 to-teal-500/10">
                <div className="flex items-center gap-3">
                  <motion.div
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                  >
                    <Sparkles className="w-6 h-6 text-purple-400" />
                  </motion.div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Live Lyrics</h3>
                    {synced && (
                      <p className="text-xs text-purple-300">Synchronized • 60fps • Deezer</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>

              {/* Track Info */}
              <div className="px-6 py-4 border-b border-white/20">
                <p className="text-white font-semibold truncate">{trackTitle}</p>
                <p className="text-gray-400 text-sm truncate">{trackAuthor}</p>
              </div>

              {/* Lyrics Content */}
              <div 
                ref={containerRef}
                className="flex-1 overflow-y-auto px-6 py-8 scroll-smooth"
                style={{ scrollBehavior: 'smooth' }}
              >
                {loading && (
                  <div className="flex flex-col items-center justify-center h-full">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full mb-4"
                    />
                    <p className="text-gray-400">Fetching lyrics from Deezer...</p>
                  </div>
                )}

                {error && (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 200 }}
                    >
                      <Music2 className="w-20 h-20 text-gray-500 mb-4" />
                    </motion.div>
                    <p className="text-gray-400 text-lg font-semibold">{error}</p>
                    <p className="text-gray-500 text-sm mt-2">This song doesn't have synced lyrics on Deezer</p>
                  </div>
                )}

                {!loading && !error && lyrics.length > 0 && (
                  <div className="space-y-6">
                    {lyrics.map((line, index) => {
                      const isActive = index === activeLyricIndex;
                      const isPast = index < activeLyricIndex;
                      
                      return (
                        <motion.div
                          key={line.id}
                          ref={isActive ? activeLineRef : null}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{
                            opacity: isActive ? 1 : isPast ? 0.3 : 0.5,
                            scale: isActive ? 1.1 : 1, // Spotify-style scale
                            filter: isActive ? 'blur(0px)' : 'blur(0.5px)',
                            y: 0
                          }}
                          transition={{
                            type: 'spring',
                            stiffness: 100,
                            damping: 20,
                            opacity: { duration: 0.3 },
                            scale: { duration: 0.3 }
                          }}
                          className={`transition-all duration-300 leading-relaxed ${
                            isActive
                              ? 'text-white text-2xl md:text-3xl font-bold'
                              : isPast
                              ? 'text-gray-500 text-lg md:text-xl'
                              : 'text-gray-400 text-lg md:text-xl'
                          }`}
                          style={{
                            textShadow: isActive 
                              ? '0 0 20px rgba(168, 85, 247, 0.6), 0 0 40px rgba(168, 85, 247, 0.3)' 
                              : 'none'
                          }}
                        >
                          {line.text}
                        </motion.div>
                      );
                    })}
                    
                    {/* Spacer for better scrolling */}
                    <div className="h-64" />
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-white/20 bg-gradient-to-r from-purple-500/5 to-teal-500/5">
                <div className="flex items-center justify-between text-xs">
                  <p className="text-gray-500">
                    {synced ? '🎵 Synced from Deezer' : '📝 Plain lyrics'}
                  </p>
                  <p className="text-gray-500">
                    {lyrics.length} lines
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Helper function to extract YouTube video ID
function extractYouTubeId(url: string): string {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/);
  return match ? match[1] : '';
}
