import { useState, useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

interface Track {
  title: string;
  author: string;
  duration: number;
  artwork: string;
  url: string;
  position?: number;
  requester?: {
    tag: string;
    id: string | null;
    avatar: string | null;
  };
}

interface PlayerState {
  currentTrack: Track | null;
  queue: Track[];
  isPlaying: boolean;
  volume: number;
  loopMode: 'off' | 'track' | 'queue';
  autoplay: boolean;
  position: number;
  activeUsers: Array<{ id: string, tag: string, avatar: string | null }>;
  lyrics: any[];
}

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'warning';
}

let toastId = 0;

const showToast = (message: string, type: 'success' | 'error' | 'warning' = 'error') => {
  if (typeof window === 'undefined') return;

  const event = new CustomEvent('show-toast', {
    detail: { message, type }
  });
  window.dispatchEvent(event);
};

export function useMusicPlayer(guildId: string, userId: string) {
  const [state, setState] = useState<PlayerState>({
    currentTrack: null,
    queue: [],
    isPlaying: false,
    volume: 50,
    loopMode: 'off',
    autoplay: false,
    position: 0,
    activeUsers: [],
    lyrics: []
  });

  const socketRef = useRef<Socket | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const seekTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSeekValueRef = useRef<number>(0);
  const lastSkipTimeRef = useRef<number>(0);
  const skipCooldown = 4000; // 4 seconds cooldown

  useEffect(() => {
    // Get user ID from localStorage (set during Discord OAuth)
    const getUserId = () => {
      try {
        // First try localStorage
        const storedUserId = localStorage.getItem('discordUserId');
        if (storedUserId) return storedUserId;

        // Fallback to cookie parsing
        const userCookie = document.cookie
          .split('; ')
          .find(row => row.startsWith('discord_user='))
          ?.split('=')[1];

        if (userCookie) {
          const userData = JSON.parse(decodeURIComponent(userCookie));
          // Store in localStorage for future use
          localStorage.setItem('discordUserId', userData.id);
          return userData.id;
        }
      } catch (e) {
        console.error('[Socket] Failed to get user ID:', e);
      }
      return null;
    };

    const currentUserId = userId || getUserId() || '';
    const activeGuildId = guildId || (typeof window !== 'undefined' ? localStorage.getItem('aurora_active_guildId') : '') || '';
    console.log('[Socket] User ID:', currentUserId, 'Guild ID:', activeGuildId);

    // Use relative URL in browser to leverage Next.js /socket.io rewrite proxy
    const socketUrl = (typeof window !== 'undefined' && window.location.origin) ? '' : (process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001');

    // Connect to Socket.io server
    const socket = io(socketUrl as any, {
      path: '/socket.io/',
      transports: ['polling', 'websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      auth: {
        userId: currentUserId
      }
    });

    socketRef.current = socket;

    const emitJoinGuild = () => {
      const gId = guildId || (typeof window !== 'undefined' ? localStorage.getItem('aurora_active_guildId') : '') || '';
      if (gId) {
        console.log('[Socket] Joining guild room:', gId);
        socket.emit('join-guild', { guildId: gId, userId: currentUserId });
      }
    };

    socket.on('connect', () => {
      console.log('[Socket] Connected to server');
      emitJoinGuild();
    });

    if (socket.connected) {
      emitJoinGuild();
    }

    // Handle tab visibility changes - request fresh sync when tab becomes visible
    const handleVisibilityChange = () => {
      const gId = guildId || (typeof window !== 'undefined' ? localStorage.getItem('aurora_active_guildId') : '') || '';
      if (!document.hidden && socket.connected && gId) {
        console.log('[Socket] Tab visible - requesting fresh sync');
        emitJoinGuild();
        socket.emit('request-sync', { guildId: gId });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // 4-second REST polling fallback loop to guarantee player state is never out of sync
    const syncInterval = setInterval(async () => {
      const gId = guildId || (typeof window !== 'undefined' ? localStorage.getItem('aurora_active_guildId') : '') || '';
      if (!gId) return;
      
      try {
        const res = await fetch(`/api/guild/${gId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.player && data.player.connected) {
            setState(prev => {
              // Only update if currentTrack or queue actually changed to prevent unnecessary re-renders
              const currentTrackChanged = JSON.stringify(prev.currentTrack) !== JSON.stringify(data.player.current);
              const queueChanged = (prev.queue?.length || 0) !== (data.player.queue?.length || 0);
              const isPlayingChanged = prev.isPlaying !== !data.player.paused;

              if (currentTrackChanged || queueChanged || isPlayingChanged) {
                console.log('[REST Sync Fallback] Updating player state');
                return {
                  ...prev,
                  currentTrack: data.player.current ? {
                    title: data.player.current.title,
                    author: data.player.current.author,
                    duration: data.player.current.duration,
                    artwork: data.player.current.artwork,
                    url: data.player.current.url
                  } : null,
                  queue: data.player.queue || [],
                  isPlaying: !data.player.paused,
                  volume: data.player.volume ?? prev.volume,
                  loopMode: data.player.loop ?? prev.loopMode,
                  autoplay: data.player.autoplay ?? prev.autoplay
                };
              }
              return prev;
            });
          }
        }
      } catch (err) {
        // Silent catch for background polling
      }
    }, 4000);

    socket.on('current-state', (data) => {
      setState((prev) => ({
        ...prev,
        currentTrack: data.track,
        queue: data.queue || [],
        isPlaying: !data.settings.paused,
        volume: data.settings.volume,
        loopMode: data.settings.loopMode,
        autoplay: data.settings.autoplay,
        position: data.track?.position || 0,
        activeUsers: prev.activeUsers // preserve
      }));
    });

    socket.on('active-users', (users) => {
      // deduplicate users by ID
      const uniqueUsers = Array.from(new Map(users.map((u: any) => [u.id, u])).values());
      setState(prev => ({
        ...prev,
        activeUsers: uniqueUsers as any
      }));
    });

    socket.on('track-start', (trackData) => {
      setState(prev => ({
        ...prev,
        currentTrack: {
          title: trackData.title,
          author: trackData.author,
          duration: trackData.duration,
          artwork: trackData.artwork,
          url: trackData.url,
          requester: trackData.requester
        },
        isPlaying: !trackData.paused,
        position: trackData.position || 0,
        volume: trackData.volume,
        loopMode: trackData.loopMode,
        autoplay: trackData.autoplay,
        lyrics: []
      }));

      // Notify ExploreView so it can update personalized recommendations in real-time
      if (trackData.title && trackData.author) {
        window.dispatchEvent(new CustomEvent('track-playing', {
          detail: { track: { title: trackData.title, author: trackData.author, artwork: trackData.artwork } }
        }));
      }
    });

    socket.on('lyrics_data', (data: any) => {
      if (data && data.lyrics && Array.isArray(data.lyrics)) {
        setState(prev => ({
          ...prev,
          lyrics: data.lyrics
        }));
      }
    });

    socket.on('lyrics_not_found', () => {
      setState(prev => ({
        ...prev,
        lyrics: []
      }));
    });

    socket.on('queue-update', (queueData) => {
      setState(prev => ({
        ...prev,
        queue: queueData || []
      }));
    });

    socket.on('player_sync', (data: any) => {
      if (data.isDestroyed) {
        setState(prev => {
          if (prev.currentTrack !== null || prev.isPlaying) {
            console.log('[Player Sync] Bot player is stopped/destroyed, resetting client state');
            return {
              ...prev,
              currentTrack: null,
              queue: [],
              isPlaying: false,
              position: 0
            };
          }
          return prev;
        });
        return;
      }

      // High-frequency position sync for smooth playback
      if (!seekTimeoutRef.current) {
        setState(prev => {
          const isPlayingChanged = prev.isPlaying !== data.isPlaying;
          const diff = Math.abs(prev.position - data.position);
          
          // Tight alignment threshold (800ms) to ensure lyrics never jump 3-4s forward or backward
          if (isPlayingChanged || (prev.isPlaying && diff > 800)) {
            return { 
              ...prev, 
              isPlaying: data.isPlaying,
              position: data.position 
            };
          }
          return prev;
        });
      }
    });

    socket.on('position-update', (data) => {
      // Legacy position update (kept for compatibility)
      if (!seekTimeoutRef.current) {
        setState(prev => {
          if (prev.isPlaying) {
            const diff = Math.abs(prev.position - data.position);
            if (diff > 1000) {
              return { ...prev, position: data.position };
            }
          }
          return prev;
        });
      }
    });

    socket.on('track-end', () => {
      setState(prev => ({ ...prev, position: 0 }));
    });

    socket.on('player-update', (data) => {
      if (data.action === 'pause' || data.action === 'stop') {
        setState(prev => ({ 
          ...prev, 
          isPlaying: false,
          currentTrack: data.action === 'stop' ? null : prev.currentTrack,
          position: data.action === 'stop' ? 0 : prev.position
        }));
      } else if (data.action === 'resume') {
        setState(prev => ({ ...prev, isPlaying: true }));
      } else if (data.action === 'volume') {
        setState(prev => ({ ...prev, volume: data.value }));
      } else if (data.action === 'loop') {
        setState(prev => ({ ...prev, loopMode: data.value }));
      } else if (data.action === 'autoplay') {
        setState(prev => ({ ...prev, autoplay: data.value }));
      } else if (data.action === 'seek') {
        // Direct position update on confirmed seek event
        if (seekTimeoutRef.current) {
          clearTimeout(seekTimeoutRef.current);
          seekTimeoutRef.current = null;
        }
        setState(prev => ({ ...prev, position: data.value }));
      }
    });

    socket.on('queue-end', () => {
      setState(prev => ({
        ...prev,
        currentTrack: null,
        isPlaying: false,
        position: 0
      }));
    });

    socket.on('player-destroyed', () => {
      setState(prev => ({
        ...prev,
        currentTrack: null,
        queue: [],
        isPlaying: false,
        volume: 50,
        loopMode: 'off',
        autoplay: false,
        position: 0
      }));
    });

    socket.on('error', (error) => {
      console.error('[Socket] Error:', error.message);
      showToast(error.message, 'error');
    });

    socket.on('warning', (warning) => {
      console.warn('[Socket] Warning:', warning.message);
      showToast(warning.message, 'warning');
    });

    return () => {
      clearInterval(syncInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      socket.disconnect();
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [guildId]);

  // Progress bar auto-update
  useEffect(() => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }

    if (state.isPlaying && state.currentTrack) {
      progressIntervalRef.current = setInterval(() => {
        setState(prev => {
          if (!prev.currentTrack) return prev;
          const newPosition = prev.position + 1000;
          // Don't exceed track duration
          if (newPosition >= prev.currentTrack.duration) {
            return { ...prev, position: prev.currentTrack.duration };
          }
          return { ...prev, position: newPosition };
        });
      }, 1000);
    }

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [state.isPlaying, state.currentTrack?.title]); // Only restart on track change or play/pause

  const emitAction = (action: string, value?: any) => {
    const activeGuildId = guildId || (typeof window !== 'undefined' ? localStorage.getItem('aurora_active_guildId') : '') || '';
    const activeUserId = userId || (typeof window !== 'undefined' ? localStorage.getItem('discordUserId') : '') || '';

    if (!activeGuildId) {
      console.warn('[Socket] Cannot emit action: no active guildId');
      return;
    }

    if (socketRef.current) {
      socketRef.current.emit('player-action', {
        guildId: activeGuildId,
        userId: activeUserId,
        action,
        value,
        // Pass user ID in header-like field for socket authentication
        _userId: activeUserId
      });
    }
  };

  const handlePlay = () => {
    setState(prev => ({ ...prev, isPlaying: true }));
    emitAction('resume');
  };

  const handlePause = () => {
    setState(prev => ({ ...prev, isPlaying: false }));
    emitAction('pause');
  };

  const handleSkip = () => {
    const now = Date.now();
    const timeSinceLastSkip = now - lastSkipTimeRef.current;

    if (timeSinceLastSkip < skipCooldown) {
      const remainingTime = Math.ceil((skipCooldown - timeSinceLastSkip) / 1000);
      showToast(`⏳ Please wait ${remainingTime} seconds before skipping again`, 'warning');
      return;
    }

    lastSkipTimeRef.current = now;
    emitAction('skip');
  };

  const handlePrevious = () => emitAction('previous');
  const handleStop = () => {
    emitAction('stop');
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('playback-stopped'));
    }
  };
  const handleFilter = (filter: string) => emitAction('filter', filter);

  const handleSeek = useCallback((position: number, immediate: boolean = false) => {
    // Update UI immediately for smooth slider
    setState(prev => ({ ...prev, position }));
    lastSeekValueRef.current = position;

    if (seekTimeoutRef.current) {
      clearTimeout(seekTimeoutRef.current);
      seekTimeoutRef.current = null;
    }

    if (immediate) {
      emitAction('seek', position);
    } else {
      seekTimeoutRef.current = setTimeout(() => {
        emitAction('seek', lastSeekValueRef.current);
        seekTimeoutRef.current = null;
      }, 300);
    }
  }, []);

  const handleVolumeChange = (volume: number) => emitAction('volume', volume);
  const handleLoopChange = () => {
    const modes: Array<'off' | 'track' | 'queue'> = ['off', 'track', 'queue'];
    const currentIndex = modes.indexOf(state.loopMode);
    const nextMode = modes[(currentIndex + 1) % modes.length];
    emitAction('loop', nextMode);
  };
  const handleAutoplayToggle = () => emitAction('autoplay', !state.autoplay);

  return {
    ...state,
    handlePlay,
    handlePause,
    handleSkip,
    handlePrevious,
    handleStop,
    handleFilter,
    handleSeek,
    handleVolumeChange,
    handleLoopChange,
    handleAutoplayToggle
  };
}
