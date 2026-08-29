'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useMusicPlayer } from '../hooks/useMusicPlayer';
import {
  Play, Pause, SkipForward, SkipBack, Repeat,
  Shuffle, Volume2, Heart, ExternalLink, Music, Search, Link as LinkIcon, Sliders, Square, ListPlus, Disc,
  Compass, ListMusic, Menu, X, Palette, Paintbrush, Settings, Pencil, Crown, RefreshCw, Info, BarChart3, PictureInPicture2, Keyboard, MoreHorizontal
} from 'lucide-react';
import { useState, useEffect, useRef, useLayoutEffect } from 'react';
import ToastContainer from './ToastContainer';
import PlaylistsView from './PlaylistsView';
import ExploreView from './ExploreView';
import PremiumView from './PremiumView';
import ServerOverviewView from './ServerOverviewView';
import MiniPlayerWindow from './MiniPlayerWindow';
import KeybindsModal, { DEFAULT_KEYBINDS } from './KeybindsModal';
import { LyricLine, getActiveLyricIndex } from '../utils/parseLRC';
import { useSmoothTime } from '../hooks/useSmoothTime';
import { io, Socket } from 'socket.io-client';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const isEmbedded = typeof window !== 'undefined' && window.self !== window.top;
const apiUrl = '';

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
const socketUrl = isEmbedded ? undefined : (process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001');

interface ToastData {
  id: number;
  message: string;
  type: 'success' | 'error' | 'warning';
}

interface QueueTrack {
  title: string;
  author: string;
  duration: number;
  artwork: string;
  id: string;
  requester?: {
    tag: string;
    id: string | null;
    avatar: string | null;
  };
}

function SortableQueueItem({ track, index, formatTime }: { track: QueueTrack; index: number; formatTime: (ms: number) => string }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: track.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="flex-shrink-0 w-40 group cursor-grab active:cursor-grabbing"
    >
      <div className="relative mb-2">
        <img
          src={track.artwork}
          alt={track.title}
          className="w-40 h-40 rounded-xl object-cover shadow-lg"
        />
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center">
          <div className="text-center">
            <span className="text-white font-bold text-3xl block">{index + 1}</span>
            <span className="text-white/80 text-xs">in queue</span>
          </div>
        </div>

        {/* Requester Avatar Badge */}
        {track.requester && (
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            {track.requester.avatar && track.requester.id ? (
              <img
                src={`https://cdn.discordapp.com/avatars/${track.requester.id}/${track.requester.avatar}.png?size=32`}
                alt={track.requester.tag}
                className="w-8 h-8 rounded-full border-2 border-white/50"
                title={`Requested by ${track.requester.tag}`}
              />
            ) : (
              <div
                className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-white text-xs font-bold border-2 border-white/50"
                title={`Requested by ${track.requester.tag}`}
              >
                {track.requester.tag?.[0]?.toUpperCase() || '?'}
              </div>
            )}
          </div>
        )}
      </div>
      <p className="text-white text-sm font-medium truncate drop-shadow-md">{track.title}</p>
      <p className="text-white/60 text-xs truncate">{track.author}</p>
      <p className="text-white/40 text-xs mt-1">{formatTime(track.duration)}</p>

      {/* Requester Tag */}
      {track.requester && (
        <p className="text-white/50 text-xs truncate mt-1">
          by {track.requester.tag}
        </p>
      )}
    </div>
  );
}

const BACKGROUND_PRESETS = [
  { id: 'auto', name: 'Auto (Song Colors)', colors: [] },
  { id: 'nebula', name: 'Cosmic Nebula', colors: ['168, 85, 247', '236, 72, 153', '10, 10, 20'] },
  { id: 'sunset', name: 'Sunset Glow', colors: ['239, 68, 68', '249, 115, 22', '15, 15, 25'] },
  { id: 'ocean', name: 'Ocean Breeze', colors: ['6, 182, 212', '16, 185, 129', '10, 15, 30'] },
  { id: 'midnight', name: 'Midnight Forest', colors: ['16, 185, 129', '75, 85, 99', '5, 10, 15'] },
  { id: 'cyberpunk', name: 'Cyberpunk Neon', colors: ['236, 72, 153', '234, 179, 8', '0, 0, 0'] },
  { id: 'eclipse', name: 'Solar Eclipse', colors: ['245, 158, 11', '0, 0, 0', '15, 15, 15'] },
  { id: 'volcanic', name: 'Volcanic Ash', colors: ['220, 38, 38', '31, 41, 55', '8, 8, 8'] },
  { id: 'glacier', name: 'Ice Glacier', colors: ['14, 165, 233', '241, 245, 249', '15, 23, 42'] },
  { id: 'velvet', name: 'Royal Velvet', colors: ['99, 102, 241', '139, 92, 246', '10, 10, 15'] },
  { id: 'toxic', name: 'Toxic Chemical', colors: ['132, 204, 22', '0, 0, 0', '10, 10, 10'] },
  { id: 'bubblegum', name: 'Bubblegum Sweet', colors: ['244, 114, 182', '56, 189, 248', '20, 20, 30'] },
  { id: 'retro', name: 'Retro Sunrise', colors: ['234, 179, 8', '249, 115, 22', '12, 10, 20'] },
  { id: 'space', name: 'Deep Space', colors: ['30, 41, 59', '15, 23, 42', '2, 6, 23'] },
  { id: 'emerald', name: 'Teal Emerald', colors: ['20, 184, 166', '4, 120, 87', '6, 10, 20'] },
  { id: 'ruby', name: 'Ruby Wine', colors: ['185, 28, 28', '127, 29, 29', '10, 5, 10'] },
  { id: 'gold', name: 'Golden Aura', colors: ['251, 191, 36', '217, 119, 6', '15, 10, 5'] },
  { id: 'synthwave', name: 'Synthwave Night', colors: ['147, 51, 234', '249, 115, 22', '17, 24, 39'] },
  { id: 'acid', name: 'Acid Green', colors: ['234, 250, 6', '0, 0, 0', '5, 5, 5'] },
  { id: 'cotton', name: 'Cotton Candy', colors: ['255, 192, 203', '173, 216, 230', '15, 15, 25'] }
];

let toastIdCounter = 0;

export default function ModernPlayer({ guildId, userId }: { guildId: string; userId: string }) {
  const {
    currentTrack,
    queue,
    isPlaying,
    volume,
    loopMode,
    autoplay,
    position,
    activeUsers,
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
  } = useMusicPlayer(guildId, userId);

  const [view, setView] = useState<'player' | 'explore' | 'playlists' | 'overview' | 'premium'>('player');
  const [siteName, setSiteName] = useState('');
  const [showMiniPlayer, setShowMiniPlayer] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    if (guildId) {
      localStorage.setItem('aurora_active_guildId', guildId);
      if (userId) localStorage.setItem('discordUserId', userId);
      window.dispatchEvent(new CustomEvent('aurora_guild_changed', { detail: { guildId } }));
    }
  }, [guildId, userId]);

  useEffect(() => {
    fetch('/api/admin/settings')
      .then(res => res.json())
      .then(data => {
        if (data && data.siteName) {
          setSiteName(data.siteName);
        }
      })
      .catch(() => {});

    const handleSettingsUpdate = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail && customEvent.detail.siteName) {
        setSiteName(customEvent.detail.siteName);
      }
    };

    window.addEventListener('siteSettingsUpdated', handleSettingsUpdate);
    return () => {
      window.removeEventListener('siteSettingsUpdated', handleSettingsUpdate);
    };
  }, []);
  const [hoverPosition, setHoverPosition] = useState<number | null>(null);
  const [hoverTime, setHoverTime] = useState<string>('');
  const [hoverX, setHoverX] = useState<number>(0);
  const [dominantColor, setDominantColor] = useState('0, 0, 0');
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const [liked, setLiked] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isRequesterPremium, setIsRequesterPremium] = useState(false);

  // Premium & Customizer States
  const [isPremium, setIsPremium] = useState(false);
  const [premiumSystemActive, setPremiumSystemActive] = useState(false);
  const [activePreset, setActivePreset] = useState('auto');
  const [showBgCustomizer, setShowBgCustomizer] = useState(false);
  const [lyricsFontSize, setLyricsFontSize] = useState('text-3xl lg:text-4xl');
  const [lyricsColor, setLyricsColor] = useState('text-white');
  const [lyricsGlow, setLyricsGlow] = useState(false);
  const [showLyricsCustomizer, setShowLyricsCustomizer] = useState(false);
  const [showMobileMoreMenu, setShowMobileMoreMenu] = useState(false);

  // Keybinds States
  const [keybinds, setKeybinds] = useState<Record<string, string>>(DEFAULT_KEYBINDS);
  const [keybindsEnabled, setKeybindsEnabled] = useState<boolean>(false);
  const [showKeybindsModal, setShowKeybindsModal] = useState(false);

  // Layout Draggable & Editor States
  const [isEditMode, setIsEditMode] = useState(false);
  const [albumArtOffset, setAlbumArtOffset] = useState({ x: 0, y: 0 });
  const [metadataOffset, setMetadataOffset] = useState({ x: 0, y: 0 });
  const [controlsOffset, setControlsOffset] = useState({ x: 0, y: 0 });
  const [lyricsOffset, setLyricsOffset] = useState({ x: 0, y: 0 });

  const [albumArtScale, setAlbumArtScale] = useState(1);
  const [metadataScale, setMetadataScale] = useState(1);
  const [controlsScale, setControlsScale] = useState(1);

  // Backup states for Layout Cancel/Rollback
  const [tempAlbumArtPos, setTempAlbumArtPos] = useState({ x: 0, y: 0 });
  const [tempMetadataPos, setTempMetadataPos] = useState({ x: 0, y: 0 });
  const [tempControlsPos, setTempControlsPos] = useState({ x: 0, y: 0 });
  const [tempLyricsPos, setTempLyricsPos] = useState({ x: 0, y: 0 });

  const [tempAlbumArtScale, setTempAlbumArtScale] = useState(1);
  const [tempMetadataScale, setTempMetadataScale] = useState(1);
  const [tempControlsScale, setTempControlsScale] = useState(1);
  const [lyrics, setLyrics] = useState<LyricLine[]>([]);
  const [lyricsLoading, setLyricsLoading] = useState(false);
  const [lyricsError, setLyricsError] = useState<string | null>(null);
  const [localQueue, setLocalQueue] = useState<QueueTrack[]>([]);
  const [showLikedSongs, setShowLikedSongs] = useState(false);
  const [likedSongs, setLikedSongs] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string>('none');
  const [showPlaylistAdd, setShowPlaylistAdd] = useState(false);
  const [userPlaylists, setUserPlaylists] = useState<any[]>([]);
  const [isAutoSync, setIsAutoSync] = useState(true);
  const [isLyricsSynced, setIsLyricsSynced] = useState(true);
  const lyricsContainerRef = useRef<HTMLDivElement>(null);
  const activeLineRef = useRef<HTMLDivElement>(null);
  const lyricsSocketRef = useRef<Socket | null>(null);
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const seekRef = useRef<HTMLDivElement>(null);
  const isUserInteractingLyricsRef = useRef(false);
  const autoResyncTimerRef = useRef<NodeJS.Timeout | null>(null);

  const smoothTime = useSmoothTime(position / 1000, isPlaying);
  const activeLyricIndex = isLyricsSynced ? getActiveLyricIndex(lyrics, smoothTime) : -1;

  const handleLyricsContainerScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (!isUserInteractingLyricsRef.current || !isLyricsSynced) return;
    
    const container = lyricsContainerRef.current;
    const activeLine = activeLineRef.current;
    if (container && activeLine) {
      const targetScroll = activeLine.offsetTop - (container.clientHeight / 2) + (activeLine.clientHeight / 2);
      const diff = Math.abs(container.scrollTop - targetScroll);
      
      // Only pause auto-sync if user manually scrolled >100px away from centered active line
      if (diff > 100) {
        setIsAutoSync(false);

        // Auto-resync after 5 seconds of idle time
        if (autoResyncTimerRef.current) clearTimeout(autoResyncTimerRef.current);
        autoResyncTimerRef.current = setTimeout(() => {
          setIsAutoSync(true);
        }, 5000);
      }
    }
  };

  useEffect(() => {
    // DO NOT auto-scroll or move lyrics automatically if lyrics are unsynced!
    if (!isLyricsSynced) return;

    if (isAutoSync && activeLyricIndex >= 0 && activeLineRef.current && lyricsContainerRef.current) {
      const container = lyricsContainerRef.current;
      const activeLine = activeLineRef.current;
      const scrollTo = activeLine.offsetTop - (container.clientHeight / 2) + (activeLine.clientHeight / 2);
      
      container.scrollTo({
        top: Math.max(0, scrollTo),
        behavior: 'smooth'
      });
    }
  }, [activeLyricIndex, isAutoSync, isLyricsSynced]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Sync queue with local state
  useEffect(() => {
    setLocalQueue(queue.map((track, idx) => ({
      ...track,
      id: `${track.title}-${track.author}-${idx}`
    })));
  }, [queue]);

  useEffect(() => {
    const handleToast = (event: CustomEvent) => {
      const { message, type } = event.detail;
      const id = toastIdCounter++;
      setToasts(prev => [...prev, { id, message, type }]);
    };

    const handleViewChange = (event: CustomEvent) => {
      if (event.detail && (event.detail === 'player' || event.detail === 'explore' || event.detail === 'playlists' || event.detail === 'premium')) {
        setView(event.detail);
      }
    };

    window.addEventListener('show-toast' as any, handleToast);
    window.addEventListener('change-view' as any, handleViewChange);
    return () => {
      window.removeEventListener('show-toast' as any, handleToast);
      window.removeEventListener('change-view' as any, handleViewChange);
    };
  }, []);

  // Check premium and preferences
  useEffect(() => {
    const initPremiumAndPrefs = async () => {
      if (!userId) return;
      try {
        const res = await fetch(`${socketUrl}/api/premium/check/${userId}`);
        if (res.ok) {
          const data = await res.json();
          setIsPremium(data.isPremium);
          setPremiumSystemActive(data.systemActive);
        }
      } catch (err) {
        console.error('Error fetching premium status:', err);
      }

      const savedPreset = localStorage.getItem(`aurora_preset_${userId}`);
      // Migrate old 'default' key to 'auto'
      if (savedPreset === 'default') {
        setActivePreset('auto');
        localStorage.setItem(`aurora_preset_${userId}`, 'auto');
      } else if (savedPreset) {
        setActivePreset(savedPreset);
      }

      const savedFontSize = localStorage.getItem(`aurora_lyrics_sz_${userId}`);
      if (savedFontSize) setLyricsFontSize(savedFontSize);

      const savedColor = localStorage.getItem(`aurora_lyrics_clr_${userId}`);
      if (savedColor) setLyricsColor(savedColor);

      const savedGlow = localStorage.getItem(`aurora_lyrics_glw_${userId}`);
      if (savedGlow) setLyricsGlow(savedGlow === 'true');

      // Load draggable offsets
      const artX = localStorage.getItem(`aurora_art_x_${userId}`);
      const artY = localStorage.getItem(`aurora_art_y_${userId}`);
      if (artX && artY) setAlbumArtOffset({ x: Number(artX), y: Number(artY) });

      const metaX = localStorage.getItem(`aurora_meta_x_${userId}`);
      const metaY = localStorage.getItem(`aurora_meta_y_${userId}`);
      if (metaX && metaY) setMetadataOffset({ x: Number(metaX), y: Number(metaY) });

      const ctrlX = localStorage.getItem(`aurora_ctrl_x_${userId}`);
      const ctrlY = localStorage.getItem(`aurora_ctrl_y_${userId}`);
      if (ctrlX && ctrlY) setControlsOffset({ x: Number(ctrlX), y: Number(ctrlY) });

      // Load component scales
      const artS = localStorage.getItem(`aurora_art_s_${userId}`);
      if (artS) setAlbumArtScale(Number(artS));

      const metaS = localStorage.getItem(`aurora_meta_s_${userId}`);
      if (metaS) setMetadataScale(Number(metaS));

      const ctrlS = localStorage.getItem(`aurora_ctrl_s_${userId}`);
      if (ctrlS) setControlsScale(Number(ctrlS));

      // Load keybinds & keybindsEnabled (Default is OFF!)
      const keybindsEnabledKey = userId ? `aurora_keybinds_enabled_${userId}` : 'aurora_keybinds_enabled';
      const savedEnabled = localStorage.getItem(keybindsEnabledKey);
      setKeybindsEnabled(savedEnabled === 'true');

      const savedKeybinds = localStorage.getItem(`aurora_keybinds_${userId}`);
      if (savedKeybinds) {
        try {
          const parsed = JSON.parse(savedKeybinds);
          setKeybinds(prev => ({ ...prev, ...parsed }));
        } catch (e) {}
      }
    };

    initPremiumAndPrefs();

    const handlePremiumActivated = () => {
      initPremiumAndPrefs();
    };

    window.addEventListener('premium-activated', handlePremiumActivated);
    return () => {
      window.removeEventListener('premium-activated', handlePremiumActivated);
    };
  }, [userId]);

  // Handle Save / Reset Keybinds & Toggle Enabled
  const handleToggleKeybindsEnabled = (enabled: boolean) => {
    setKeybindsEnabled(enabled);
    const storageKey = userId ? `aurora_keybinds_enabled_${userId}` : 'aurora_keybinds_enabled';
    localStorage.setItem(storageKey, String(enabled));
    window.dispatchEvent(new CustomEvent('show-toast', {
      detail: { 
        message: enabled ? '⌨️ Keyboard shortcuts Enabled' : '⌨️ Keyboard shortcuts Disabled', 
        type: 'info' 
      }
    }));
  };

  const handleSaveKeybinds = (newKeybinds: Record<string, string>) => {
    setKeybinds(newKeybinds);
    if (userId) {
      localStorage.setItem(`aurora_keybinds_${userId}`, JSON.stringify(newKeybinds));
    }
    window.dispatchEvent(new CustomEvent('show-toast', {
      detail: { message: '⌨️ Keybinds updated!', type: 'success' }
    }));
  };

  const handleResetKeybinds = () => {
    setKeybinds(DEFAULT_KEYBINDS);
    if (userId) {
      localStorage.removeItem(`aurora_keybinds_${userId}`);
    }
  };

  const liveRef = useRef({
    isPremium,
    keybinds,
    keybindsEnabled,
    isPlaying,
    volume,
    smoothTime,
    currentTrack,
    handlePlay,
    handlePause,
    handleSkip,
    handlePrevious,
    handleVolumeChange,
    handleSeek,
    setView,
    setShowLikedSongs,
    setShowSearch
  });

  useLayoutEffect(() => {
    liveRef.current = {
      isPremium,
      keybinds,
      keybindsEnabled,
      isPlaying,
      volume,
      smoothTime,
      currentTrack,
      handlePlay,
      handlePause,
      handleSkip,
      handlePrevious,
      handleVolumeChange,
      handleSeek,
      setView,
      setShowLikedSongs,
      setShowSearch
    };
  });

  // Global Keyboard Shortcuts Event Listener (Premium Only, Enabled Toggle Safe, Active Tab Focused & Input Safe)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const live = liveRef.current;
      if (!live.isPremium || !live.keybindsEnabled) return;

      // Active Website Tab Guard: Only work when active in the website tab!
      if (typeof document !== 'undefined') {
        if (document.visibilityState !== 'visible' || !document.hasFocus()) {
          return;
        }
      }

      // Input & Scope Safety: Never trigger keybinds inside searchboxes, text inputs, or MiniPlayer!
      const target = e.target as HTMLElement;
      const activeEl = typeof document !== 'undefined' ? (document.activeElement as HTMLElement) : null;

      const isInsideInputOrMiniPlayer = (el: HTMLElement | null) => {
        if (!el) return false;
        return (
          el.tagName === 'INPUT' ||
          el.tagName === 'TEXTAREA' ||
          el.tagName === 'SELECT' ||
          el.isContentEditable ||
          Boolean(el.closest('input, textarea, select, [contenteditable="true"]')) ||
          Boolean(el.closest('#mini-player-window')) ||
          Boolean(el.closest('[data-mini-player]'))
        );
      };

      if (isInsideInputOrMiniPlayer(target) || isInsideInputOrMiniPlayer(activeEl)) {
        return;
      }

      const code = e.code || '';
      const key = e.key || '';

      const matches = (actionId: string, defaultKeys: string[]) => {
        const customKey = live.keybinds[actionId];
        const possibleTargets = [
          ...(customKey ? [customKey] : []),
          ...defaultKeys
        ];

        return possibleTargets.some(tStr => {
          if (!tStr) return false;
          const t = tStr.trim();

          // 1. Direct code equality
          if (code === t) return true;

          // 2. Direct key equality case-insensitive
          if (key.toLowerCase() === t.toLowerCase()) return true;
          if ((key === ' ' || key === 'Spacebar') && (t.toLowerCase() === 'space' || t.toLowerCase() === 'spacebar')) return true;

          // 3. Stripped 'Key' or 'Digit' prefixes (e.g. 'KeyN' -> 'n', 'Digit1' -> '1')
          const strippedTarget = t.replace(/^(Key|Digit|Numpad)/i, '').toLowerCase();
          const strippedCode = code.replace(/^(Key|Digit|Numpad)/i, '').toLowerCase();

          if (strippedCode && strippedCode === strippedTarget) return true;
          if (key.toLowerCase() === strippedTarget) return true;

          return false;
        });
      };

      // Play / Pause
      if (matches('playPause', ['Space', 'KeyK', ' '])) {
        e.preventDefault();
        if (live.isPlaying) {
          live.handlePause();
        } else {
          live.handlePlay();
        }
        return;
      }

      // Next Track
      if (matches('nextTrack', ['KeyN', 'n', 'N'])) {
        e.preventDefault();
        live.handleSkip();
        return;
      }

      // Previous Track
      if (matches('prevTrack', ['KeyP', 'p', 'P'])) {
        e.preventDefault();
        live.handlePrevious();
        return;
      }

      // Seek Forward (+5s)
      if (matches('seekForward', ['ArrowRight', 'KeyL', 'l', 'L'])) {
        e.preventDefault();
        live.handleSeek(Math.min(live.currentTrack?.duration || 9999, live.smoothTime + 5));
        return;
      }

      // Seek Backward (-5s)
      if (matches('seekBackward', ['ArrowLeft', 'KeyJ', 'j', 'J'])) {
        e.preventDefault();
        live.handleSeek(Math.max(0, live.smoothTime - 5));
        return;
      }

      // Volume Up (+5%)
      if (matches('volumeUp', ['ArrowUp', '='])) {
        e.preventDefault();
        live.handleVolumeChange(Math.min(100, live.volume + 5));
        return;
      }

      // Volume Down (-5%)
      if (matches('volumeDown', ['ArrowDown', '-'])) {
        e.preventDefault();
        live.handleVolumeChange(Math.max(0, live.volume - 5));
        return;
      }

      // Mute / Unmute
      if (matches('toggleMute', ['KeyM', 'm', 'M'])) {
        e.preventDefault();
        live.handleVolumeChange(live.volume === 0 ? 50 : 0);
        return;
      }

      // Navigation - Go to Player View
      if (matches('navPlayer', ['Digit1', 'Numpad1', '1'])) {
        e.preventDefault();
        live.setView('player');
        return;
      }

      // Navigation - Go to Explore View
      if (matches('navExplore', ['Digit2', 'Numpad2', '2'])) {
        e.preventDefault();
        live.setView('explore');
        return;
      }

      // Navigation - Go to Playlists View
      if (matches('navPlaylists', ['Digit3', 'Numpad3', '3'])) {
        e.preventDefault();
        live.setView('playlists');
        return;
      }

      // Navigation - Go to Server Overview
      if (matches('navOverview', ['Digit4', 'Numpad4', '4'])) {
        e.preventDefault();
        live.setView('overview');
        return;
      }

      // Navigation - Go to Premium View
      if (matches('navPremium', ['Digit5', 'Numpad5', '5'])) {
        e.preventDefault();
        live.setView('premium');
        return;
      }

      // Navigation - Go to Popular Artists Sub-Tab (Key A)
      if (matches('navExploreArtists', ['KeyA', 'a', 'A'])) {
        e.preventDefault();
        live.setView('explore');
        window.dispatchEvent(new CustomEvent('change-explore-tab', { detail: 'artists' }));
        return;
      }

      // Navigation - Go to Liked Songs Sub-Tab (Key H)
      if (matches('navExploreLiked', ['KeyH', 'h', 'H'])) {
        e.preventDefault();
        live.setView('explore');
        window.dispatchEvent(new CustomEvent('change-explore-tab', { detail: 'liked' }));
        return;
      }

      // Navigation - Go to Discover Sub-Tab (Key D)
      if (matches('navExploreDiscover', ['KeyD', 'd', 'D'])) {
        e.preventDefault();
        live.setView('explore');
        window.dispatchEvent(new CustomEvent('change-explore-tab', { detail: 'discover' }));
        return;
      }

      // Navigation - Go to Moods & Genres Sub-Tab (Key G)
      if (matches('navExploreMoods', ['KeyG', 'g', 'G'])) {
        e.preventDefault();
        live.setView('explore');
        window.dispatchEvent(new CustomEvent('change-explore-tab', { detail: 'moods_genres' }));
        return;
      }

      // Toggle Queue / Liked Songs (Key Q)
      if (matches('toggleQueue', ['KeyQ', 'q', 'Q'])) {
        e.preventDefault();
        live.setView('explore');
        window.dispatchEvent(new CustomEvent('change-explore-tab', { detail: 'liked' }));
        return;
      }

      // Open Search (Key S or /)
      if (matches('toggleSearch', ['KeyS', 's', 'S', '/'])) {
        e.preventDefault();
        live.setView('explore');
        window.dispatchEvent(new CustomEvent('focus-explore-search'));
        return;
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, []);

  // Load current logged in user details
  useEffect(() => {
    fetch('/api/auth/user')
      .then(res => res.json())
      .then(data => {
        if (data && data.id) setCurrentUser(data);
      })
      .catch(() => {});
  }, []);

  // Check premium status of current track requester
  useEffect(() => {
    const requesterId = currentTrack?.requester?.id;
    if (!requesterId) {
      setIsRequesterPremium(false);
      return;
    }
    const checkRequester = async () => {
      try {
        const res = await fetch(`${socketUrl}/api/premium/check/${requesterId}`);
        if (res.ok) {
          const data = await res.json();
          setIsRequesterPremium(data.isPremium);
        }
      } catch (e) {
        setIsRequesterPremium(false);
      }
    };
    checkRequester();
  }, [currentTrack?.requester?.id, socketUrl]);

  // Layout Configuration Helpers
  const handleToggleEditMode = () => {
    if (isEditMode) {
      handleCancelLayout();
    } else {
      setTempAlbumArtPos(albumArtOffset);
      setTempMetadataPos(metadataOffset);
      setTempControlsPos(controlsOffset);
      setTempLyricsPos(lyricsOffset);
      setTempAlbumArtScale(albumArtScale);
      setTempMetadataScale(metadataScale);
      setTempControlsScale(controlsScale);
      setIsEditMode(true);
      window.dispatchEvent(new CustomEvent('show-toast', {
        detail: { message: '✏️ Layout Edit Mode Enabled! Drag components and configure sizes/presets below.', type: 'success' }
      }));
    }
  };

  const handleSaveLayout = () => {
    if (userId) {
      localStorage.setItem(`aurora_art_x_${userId}`, String(albumArtOffset.x));
      localStorage.setItem(`aurora_art_y_${userId}`, String(albumArtOffset.y));
      localStorage.setItem(`aurora_meta_x_${userId}`, String(metadataOffset.x));
      localStorage.setItem(`aurora_meta_y_${userId}`, String(metadataOffset.y));
      localStorage.setItem(`aurora_ctrl_x_${userId}`, String(controlsOffset.x));
      localStorage.setItem(`aurora_ctrl_y_${userId}`, String(controlsOffset.y));
      localStorage.setItem(`aurora_lyr_x_${userId}`, String(lyricsOffset.x));
      localStorage.setItem(`aurora_lyr_y_${userId}`, String(lyricsOffset.y));
      localStorage.setItem(`aurora_art_s_${userId}`, String(albumArtScale));
      localStorage.setItem(`aurora_meta_s_${userId}`, String(metadataScale));
      localStorage.setItem(`aurora_ctrl_s_${userId}`, String(controlsScale));
    }
    setIsEditMode(false);
    window.dispatchEvent(new CustomEvent('show-toast', {
      detail: { message: '✅ Layout configuration saved successfully!', type: 'success' }
    }));
  };

  const handleCancelLayout = () => {
    setAlbumArtOffset(tempAlbumArtPos);
    setMetadataOffset(tempMetadataPos);
    setControlsOffset(tempControlsPos);
    setLyricsOffset(tempLyricsPos);
    setAlbumArtScale(tempAlbumArtScale);
    setMetadataScale(tempMetadataScale);
    setControlsScale(tempControlsScale);
    setIsEditMode(false);
    window.dispatchEvent(new CustomEvent('show-toast', {
      detail: { message: '❌ Layout edits cancelled.', type: 'warning' }
    }));
  };

  const handleResetLayout = () => {
    setAlbumArtOffset({ x: 0, y: 0 });
    setMetadataOffset({ x: 0, y: 0 });
    setControlsOffset({ x: 0, y: 0 });
    setLyricsOffset({ x: 0, y: 0 });
    setAlbumArtScale(1);
    setMetadataScale(1);
    setControlsScale(1);
    window.dispatchEvent(new CustomEvent('show-toast', {
      detail: { message: '🔄 Layout reset to defaults.', type: 'success' }
    }));
  };

  const handleLyricsDragEnd = (event: any, info: any) => {
    setLyricsOffset(prev => ({
      x: prev.x + info.offset.x,
      y: prev.y + info.offset.y
    }));
  };

  const handleAlbumArtDragEnd = (event: any, info: any) => {
    setAlbumArtOffset(prev => ({
      x: prev.x + info.offset.x,
      y: prev.y + info.offset.y
    }));
  };

  const handleMetadataDragEnd = (event: any, info: any) => {
    setMetadataOffset(prev => ({
      x: prev.x + info.offset.x,
      y: prev.y + info.offset.y
    }));
  };

  const handleControlsDragEnd = (event: any, info: any) => {
    setControlsOffset(prev => ({
      x: prev.x + info.offset.x,
      y: prev.y + info.offset.y
    }));
  };

  // Check if current track is liked
  useEffect(() => {
    if (!currentTrack) {
      setLiked(false);
      return;
    }

    const checkLiked = async () => {
      try {
        const identifier = encodeURIComponent(`${currentTrack.title}-${currentTrack.author}`);
        const response = await fetch(
          `${apiUrl}/api/liked-songs/${guildId}/${userId}/check/${identifier}`
        );
        const data = await response.json();
        setLiked(data.liked);
      } catch (error) {
        console.error('Error checking liked status:', error);
      }
    };

    checkLiked();
  }, [currentTrack?.title, currentTrack?.author, guildId, userId]);

  // Fetch liked songs
  const fetchLikedSongs = async () => {
    try {
      const response = await fetch(
        `${apiUrl}/api/liked-songs/${guildId}/${userId}`
      );
      if (!response.ok) {
        console.error('[LikedSongs] Fetch failed:', response.status, await response.text());
        return;
      }
      const data = await response.json();
      setLikedSongs(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('[LikedSongs] Error fetching:', error);
    }
  };

  // Toggle like
  const toggleLike = async () => {
    if (!currentTrack) return;

    if (premiumSystemActive && !isPremium) {
      const event = new CustomEvent('show-toast', {
        detail: { message: '🔒 Liking songs is a Premium-only feature!', type: 'warning' }
      });
      window.dispatchEvent(event);
      return;
    }

    try {
      const identifier = `${currentTrack.title}-${currentTrack.author}`;
      if (liked) {
        // Unlike
        await fetch(
          `${apiUrl}/api/liked-songs/${guildId}/${userId}/${encodeURIComponent(identifier)}`,
          { method: 'DELETE' }
        );
        setLiked(false);
        // Update liked songs list
        setLikedSongs(prev => prev.filter(item => item.track.identifier !== identifier));
      } else {
        // Like
        const response = await fetch(
          `${apiUrl}/api/liked-songs/${guildId}/${userId}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              track: {
                title: currentTrack.title,
                author: currentTrack.author,
                duration: currentTrack.duration,
                artwork: currentTrack.artwork,
                url: currentTrack.url,
                identifier
              }
            })
          }
        );
        const data = await response.json();
        setLiked(true);
        // Add to liked songs list
        if (data.likedSong) {
          setLikedSongs(prev => [data.likedSong, ...prev]);
        }
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  // Play a single liked song
  const playLikedSong = async (track: any) => {
    try {
      const query = track.url || `${track.title} ${track.author}`;
      const response = await fetch(`${apiUrl}/api/play`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': userId
        },
        body: JSON.stringify({
          guildId,
          userId,
          query
        })
      });

      const data = await response.json();

      if (response.status === 403 && data.requiresWebLink) {
        // Channel not set - show error
        const event = new CustomEvent('show-toast', {
          detail: {
            message: '⚠️ Please run /web-link command in Discord first to set a notification channel!',
            type: 'error'
          }
        });
        window.dispatchEvent(event);
        return;
      }

      if (data.success) {
        const event = new CustomEvent('show-toast', {
          detail: { message: '✅ Added to queue!', type: 'success' }
        });
        window.dispatchEvent(event);
        // Queue will update via socket event from server
      } else {
        const event = new CustomEvent('show-toast', {
          detail: { message: data.error || 'Failed to play', type: 'error' }
        });
        window.dispatchEvent(event);
      }
    } catch (error) {
      console.error('Error playing liked song:', error);
      const event = new CustomEvent('show-toast', {
        detail: { message: 'Failed to add to queue', type: 'error' }
      });
      window.dispatchEvent(event);
    }
  };

  // Play all liked songs
  const playAllLikedSongs = async () => {
    if (likedSongs.length === 0) return;

    try {
      // Add all songs with batch flags
      for (let i = 0; i < likedSongs.length; i++) {
        const query = likedSongs[i].track.url || `${likedSongs[i].track.title} ${likedSongs[i].track.author}`;
        const response = await fetch(`${apiUrl}/api/play`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-User-Id': userId
          },
          body: JSON.stringify({
            guildId,
            userId,
            query,
            isBatch: true,
            batchTotal: likedSongs.length,
            batchIndex: i
          })
        });

        // Check first request for errors
        if (i === 0) {
          const data = await response.json();

          if (response.status === 403 && data.requiresWebLink) {
            // Channel not set - show error
            const event = new CustomEvent('show-toast', {
              detail: {
                message: '⚠️ Please run /web-link command in Discord first to set a notification channel!',
                type: 'error'
              }
            });
            window.dispatchEvent(event);
            return;
          }
        }
      }

      const event = new CustomEvent('show-toast', {
        detail: { message: `✅ Added ${likedSongs.length} songs to queue!`, type: 'success' }
      });
      window.dispatchEvent(event);
      setShowLikedSongs(false);
      // Queue will update via socket events from server
    } catch (error) {
      console.error('Error playing all liked songs:', error);
      const event = new CustomEvent('show-toast', {
        detail: { message: 'Failed to add songs to queue', type: 'error' }
      });
      window.dispatchEvent(event);
    }
  };

  // Socket.io for lyrics - single persistent connection
  useEffect(() => {
    const socketUrl = (typeof window !== 'undefined' && window.self !== window.top) ? undefined : (process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001');
    const socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      auth: {
        userId
      }
    });
    lyricsSocketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('join-guild', guildId);
    });

    socket.on('lyrics_data', (data: any) => {
      // Always accept lyrics data without strict matching
      if (data.lyrics && Array.isArray(data.lyrics) && data.lyrics.length > 0) {
        setLyrics(data.lyrics);
        const isFakeTiming = data.lyrics.every((l: any, idx: number) => l.time === idx * 3 || l.time <= 0);
        const hasValidSyncedTimestamps = data.synced !== false && !isFakeTiming && data.lyrics.some((l: any) => typeof l.time === 'number' && l.time > 0);
        setIsLyricsSynced(hasValidSyncedTimestamps);
        setLyricsLoading(false);
        setLyricsError(null);

        // Clear timeout
        if (loadingTimeoutRef.current) {
          clearTimeout(loadingTimeoutRef.current);
          loadingTimeoutRef.current = null;
        }
      }
    });

    socket.on('lyrics_not_found', (data: any) => {
      setLyricsError('No lyrics available');
      setLyrics([]);
      setLyricsLoading(false);

      // Clear timeout
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }
    });

    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
      socket.offAny();
      socket.disconnect();
    };
  }, [guildId, userId]); // Only reconnect when guildId or userId changes

  // Handle track changes
  useEffect(() => {
    if (currentTrack?.title) {
      // Clear any existing timeout
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }

      // Reset state
      setLyricsLoading(true);
      setLyricsError(null);
      setLyrics([]);

      // Request lyrics from server
      if (lyricsSocketRef.current?.connected) {
        lyricsSocketRef.current.emit('request-lyrics', { guildId });
      }

      // Set timeout to prevent infinite loading
      loadingTimeoutRef.current = setTimeout(() => {
        setLyricsLoading(false);
        setLyricsError('No lyrics available');
        setLyrics([]);
      }, 8000);
    } else {
      // No track playing
      setLyricsLoading(false);
      setLyricsError(null);
      setLyrics([]);

      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }
    }
  }, [currentTrack?.title, currentTrack?.author, guildId]);

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
    if (!currentTrack?.artwork) {
      setDominantColor('0, 0, 0');
      return;
    }

    const img = new Image();
    img.crossOrigin = 'Anonymous';

    // Add timestamp to bypass cache and CORS issues
    const imageUrl = currentTrack.artwork.includes('?')
      ? `${currentTrack.artwork}&t=${Date.now()}`
      : `${currentTrack.artwork}?t=${Date.now()}`;

    const proxyUrl = `${process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001'}/api/proxy-image?url=${encodeURIComponent(imageUrl)}`;
    img.src = proxyUrl;

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) {
          console.log('[Color Extraction] Failed to get canvas context');
          setDominantColor('0, 0, 0');
          return;
        }

        // Scale down for faster processing
        const maxSize = 100;
        const scale = Math.min(maxSize / img.width, maxSize / img.height);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Get ALL pixels from the entire image
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // Use color quantization - find most common colors
        const colorMap = new Map();

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const brightness = (r + g + b) / 3;

          // Skip very dark (< 30) and very bright (> 225) pixels
          if (brightness > 30 && brightness < 225) {
            // Round to nearest 10 to group similar colors
            const rKey = Math.round(r / 10) * 10;
            const gKey = Math.round(g / 10) * 10;
            const bKey = Math.round(b / 10) * 10;
            const key = `${rKey},${gKey},${bKey}`;

            colorMap.set(key, (colorMap.get(key) || 0) + 1);
          }
        }

        if (colorMap.size === 0) {
          console.log('[Color Extraction] No valid colors found');
          setDominantColor('0, 0, 0');
          return;
        }

        // Find the most common color
        let maxCount = 0;
        let dominantColorKey = '';

        colorMap.forEach((count, color) => {
          if (count > maxCount) {
            maxCount = count;
            dominantColorKey = color;
          }
        });

        if (dominantColorKey) {
          const [r, g, b] = dominantColorKey.split(',').map(Number);

          // Boost saturation for more vibrant colors
          const max = Math.max(r, g, b);
          const min = Math.min(r, g, b);
          const saturation = max === 0 ? 0 : (max - min) / max;

          let finalR = r, finalG = g, finalB = b;

          if (saturation < 0.25) {
            // Boost colors if too gray
            const boost = 1.6;
            finalR = Math.min(255, Math.floor(r * boost));
            finalG = Math.min(255, Math.floor(g * boost));
            finalB = Math.min(255, Math.floor(b * boost));
          }

          console.log(`[Color Extraction] Dominant color: rgb(${finalR}, ${finalG}, ${finalB})`);
          setDominantColor(`${finalR}, ${finalG}, ${finalB}`);
        } else {
          setDominantColor('0, 0, 0');
        }
      } catch (error) {
        console.error('[Color Extraction] Error:', error);
        // Fallback to black glow
        setDominantColor('0, 0, 0');
      }
    };

    img.onerror = (error) => {
      console.error('[Color Extraction] Image load error:', error);
      setDominantColor('0, 0, 0');
    };
  }, [currentTrack?.artwork]);

  const getLoopIcon = () => {
    if (loopMode === 'track') {
      return (
        <div className="relative">
          <Repeat className="w-5 h-5" />
          <span className="absolute -bottom-0.5 -right-0.5 text-[9px] font-bold">1</span>
        </div>
      );
    }
    return <Repeat className="w-5 h-5" />;
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setLocalQueue((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
      // TODO: Emit queue reorder to server
    }
  };

  // Handle search/play
  const handleSearchChange = async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(`${apiUrl}/api/search?query=${encodeURIComponent(query)}`, {
        headers: { 'X-User-Id': userId }
      });
      const data = await response.json();
      setSearchResults(data.tracks || []);
    } catch (error) {
      console.error('Auto search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const executeSearch = async (queryToPlay: string = searchQuery) => {
    if (!queryToPlay.trim()) return;

    try {
      const response = await fetch(`${apiUrl}/api/play`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': userId
        },
        body: JSON.stringify({
          guildId,
          userId,
          query: queryToPlay
        })
      });

      const data = await response.json();

      if (response.status === 403 && data.requiresWebLink) {
        // Channel not set - show error
        const event = new CustomEvent('show-toast', {
          detail: {
            message: '⚠️ Please run /web-link command in Discord first to set a notification channel!',
            type: 'error'
          }
        });
        window.dispatchEvent(event);
        return;
      }

      if (data.success) {
        setSearchQuery('');
        setSearchResults([]);
        setShowSearch(false);
        const event = new CustomEvent('show-toast', {
          detail: { message: '✅ Added to queue!', type: 'success' }
        });
        window.dispatchEvent(event);
      } else {
        const event = new CustomEvent('show-toast', {
          detail: { message: data.error || 'Failed to play', type: 'error' }
        });
        window.dispatchEvent(event);
      }
    } catch (error) {
      console.error('Search error:', error);
      const event = new CustomEvent('show-toast', {
        detail: { message: 'Failed to search', type: 'error' }
      });
      window.dispatchEvent(event);
    }
  };

  // Handle filter selection
  const handleFilterChange = (filter: string) => {
    handleFilter(filter);

    setActiveFilter(filter === 'reset' ? 'none' : filter);
    setShowFilters(false);

    const filterNames: { [key: string]: string } = {
      'nightcore': 'Nightcore',
      'vibrato': 'Vibrato',
      'karaoke': 'Karaoke',
      'rotation': 'Rotation',
      'equalizer': 'Equalizer',
      'lowpass': 'Lowpass',
      'distortion': 'Distortion',
      'tremolo': 'Tremolo',
      'reset': 'None'
    };

    const event = new CustomEvent('show-toast', {
      detail: {
        message: filter === 'reset' ? '🎵 Filters cleared' : `🎵 ${filterNames[filter]} filter applied`,
        type: 'success'
      }
    });
    window.dispatchEvent(event);
  };

  const handlePlaylistAddClick = async () => {
    if (!currentTrack) return;

    if (premiumSystemActive && !isPremium) {
      const event = new CustomEvent('show-toast', {
        detail: { message: '🔒 Playlists is a Premium-only feature!', type: 'warning' }
      });
      window.dispatchEvent(event);
      return;
    }

    try {
      const res = await fetch(`${apiUrl}/api/playlists/user/${userId}`);
      const data = await res.json();
      setUserPlaylists(data || []);
      setShowPlaylistAdd(true);
    } catch (e) {
      console.error(e);
    }
  };

  const confirmAddToPlaylist = async (playlistId: string) => {
    if (!currentTrack) return;
    try {
      const res = await fetch(`${apiUrl}/api/playlists/${playlistId}/tracks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': userId
        },
        body: JSON.stringify({ track: currentTrack })
      });
      const data = await res.json();

      const event = new CustomEvent('show-toast', {
        detail: {
          message: data.success ? '✅ Added to Playlist!' : '⚠️ Failed to add',
          type: data.success ? 'success' : 'error'
        }
      });
      window.dispatchEvent(event);
    } catch (e) {
      console.error(e);
    } finally {
      setShowPlaylistAdd(false);
    }
  };



  // Find preset details
  const preset = BACKGROUND_PRESETS.find(p => p.id === activePreset) || BACKGROUND_PRESETS[0];
  const isAutoTheme = preset.id === 'auto';
  const primaryColor = isAutoTheme ? dominantColor : preset.colors[0];
  const secondaryColor = isAutoTheme ? `rgba(${dominantColor}, 0.4)` : `rgba(${preset.colors[1]}, 0.4)`;
  const tertiaryColor = isAutoTheme ? `rgba(0, 0, 0, 0.9)` : `rgba(${preset.colors[2]}, 0.95)`;

  return (
    <div
      className="min-h-screen relative overflow-hidden"
    >
      {/* Animated gradient background */}
      <motion.div
        className="absolute inset-0"
        animate={{
          background: [
            `radial-gradient(circle at 20% 50%, rgba(${primaryColor}, 0.85) 0%, ${secondaryColor} 40%, ${tertiaryColor} 100%)`,
            `radial-gradient(circle at 80% 50%, rgba(${primaryColor}, 0.85) 0%, ${secondaryColor} 40%, ${tertiaryColor} 100%)`,
            `radial-gradient(circle at 50% 80%, rgba(${primaryColor}, 0.85) 0%, ${secondaryColor} 40%, ${tertiaryColor} 100%)`,
            `radial-gradient(circle at 20% 50%, rgba(${primaryColor}, 0.85) 0%, ${secondaryColor} 40%, ${tertiaryColor} 100%)`
          ]
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "linear"
        }}
      />

      {/* Base overlay for smooth contrast */}
      <div className="absolute inset-0 bg-black/30" />

      {/* Glassmorphism blur overlay */}
      <div className="absolute inset-0 backdrop-blur-[80px]" />

      {/* Animated orbs */}
      <motion.div
        className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-30 blur-3xl"
        style={{ background: `rgba(${primaryColor}, 0.6)` }}
        animate={{
          scale: [1, 1.2, 1],
          x: [0, 50, 0],
          y: [0, 30, 0]
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      <motion.div
        className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full opacity-20 blur-3xl"
        style={{ background: `rgba(${primaryColor}, 0.5)` }}
        animate={{
          scale: [1.2, 1, 1.2],
          x: [0, -50, 0],
          y: [0, -30, 0]
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      {/* Active Viewers (Desktop Live Status Pill) */}
      {activeUsers && activeUsers.length > 0 && (
        <div className="fixed top-24 right-6 z-40 hidden md:flex items-center gap-2 bg-black/60 backdrop-blur-2xl px-4 py-2 rounded-full border border-white/10 shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-xs text-white/70 font-semibold tracking-wide">Listening Live ({activeUsers.length}):</span>
          <div className="flex items-center">
            {activeUsers.slice(0, 5).map((u: any, idx: number) => (
              <div key={u.id} className="relative group -ml-2 first:ml-0 hover:z-10 transition-all duration-200">
                {u.avatar ? (
                  <img
                    src={`https://cdn.discordapp.com/avatars/${u.id}/${u.avatar}.png?size=32`}
                    alt={u.tag}
                    className={`w-7 h-7 rounded-full border-2 hover:scale-110 transition-transform object-cover ${
                      u.isPremium
                        ? 'border-amber-400 ring-1 ring-amber-400/40 shadow-[0_0_8px_rgba(251,191,36,0.6)]'
                        : 'border-black/80'
                    }`}
                  />
                ) : (
                  <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-white text-[10px] font-bold hover:scale-110 transition-transform ${
                    u.isPremium
                      ? 'border-amber-400 bg-amber-500/20 text-amber-300 ring-1 ring-amber-400/40 shadow-[0_0_8px_rgba(251,191,36,0.6)]'
                      : 'border-black/80 bg-purple-500'
                  }`}>
                    {u.tag?.[0]?.toUpperCase()}
                  </div>
                )}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1 bg-black/95 border border-white/10 rounded-xl text-[10px] text-white opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none transition-opacity shadow-md flex items-center gap-1">
                  {u.tag} {u.isPremium && <span className="text-amber-400 text-[9px]">👑</span>}
                </div>
              </div>
            ))}
            {activeUsers.length > 5 && (
              <div className="w-7 h-7 rounded-full bg-white/10 border-2 border-black/80 flex items-center justify-center text-white text-[10px] font-bold backdrop-blur-md -ml-2">
                +{activeUsers.length - 5}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Floating Menu Button for Side Drawer (Mobile) */}
      <button
        onClick={() => setIsSidebarOpen(true)}
        className="md:hidden fixed top-4 left-4 z-40 p-2.5 bg-black/70 backdrop-blur-xl border border-white/15 rounded-full text-white shadow-lg cursor-pointer active:scale-95 flex items-center justify-center"
        title="Open Navigation Menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Left Side Floating Icons Navigation (Desktop Only) */}
      <div className="hidden md:flex fixed left-6 top-1/2 -translate-y-1/2 z-50 flex-col gap-6 items-center bg-transparent border-none p-2 rounded-full">
        {/* Menu open trigger button */}
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all hover:scale-115 hover:rotate-6 shadow-lg cursor-pointer border border-white/10"
          title="Open Menu"
        >
          <Menu className="w-6 h-6" />
        </button>

        {/* Floating view icons */}
        <button
          onClick={() => setView('player')}
          className={`group relative p-3 rounded-full transition-all cursor-pointer ${view === 'player'
              ? 'bg-cyan-500 text-white shadow-[0_0_15px_rgba(6,182,212,0.5)] border border-cyan-400'
              : 'bg-white/5 text-white/50 hover:text-white hover:bg-white/10 border border-white/5'
            }`}
        >
          <Disc className="w-6 h-6 animate-pulse-slow transition-transform duration-200 group-hover:scale-125 group-hover:rotate-12" />
          {/* Hover Tooltip */}
          <div className="absolute left-full ml-4 px-2.5 py-1.5 bg-black/90 border border-white/10 rounded-xl text-xs font-bold text-white opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none whitespace-nowrap z-50 shadow-xl translate-x-2 group-hover:translate-x-0">
            Player
          </div>
        </button>

        <button
          onClick={() => setView('explore')}
          className={`group relative p-3 rounded-full transition-all cursor-pointer ${view === 'explore'
              ? 'bg-cyan-500 text-white shadow-[0_0_15px_rgba(6,182,212,0.5)] border border-cyan-400'
              : 'bg-white/5 text-white/50 hover:text-white hover:bg-white/10 border border-white/5'
            }`}
        >
          <Compass className="w-6 h-6 transition-transform duration-200 group-hover:scale-125 group-hover:rotate-12" />
          {/* Hover Tooltip */}
          <div className="absolute left-full ml-4 px-2.5 py-1.5 bg-black/90 border border-white/10 rounded-xl text-xs font-bold text-white opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none whitespace-nowrap z-50 shadow-xl translate-x-2 group-hover:translate-x-0">
            Explore
          </div>
        </button>

        <button
          onClick={() => setView('playlists')}
          className={`group relative p-3 rounded-full transition-all cursor-pointer ${view === 'playlists'
              ? 'bg-cyan-500 text-white shadow-[0_0_15px_rgba(6,182,212,0.5)] border border-cyan-400'
              : 'bg-white/5 text-white/50 hover:text-white hover:bg-white/10 border border-white/5'
            }`}
        >
          <ListMusic className="w-6 h-6 transition-transform duration-200 group-hover:scale-125 group-hover:rotate-12" />
          {/* Hover Tooltip */}
          <div className="absolute left-full ml-4 px-2.5 py-1.5 bg-black/90 border border-white/10 rounded-xl text-xs font-bold text-white opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none whitespace-nowrap z-50 shadow-xl translate-x-2 group-hover:translate-x-0">
            Playlists
          </div>
        </button>

        <button
          onClick={() => setView('overview')}
          className={`group relative p-3 rounded-full transition-all cursor-pointer ${view === 'overview'
              ? 'bg-cyan-500 text-white shadow-[0_0_15px_rgba(6,182,212,0.5)] border border-cyan-400'
              : 'bg-white/5 text-white/50 hover:text-white hover:bg-white/10 border border-white/5'
            }`}
        >
          <BarChart3 className="w-6 h-6 transition-transform duration-200 group-hover:scale-125 group-hover:rotate-12" />
          {/* Hover Tooltip */}
          <div className="absolute left-full ml-4 px-2.5 py-1.5 bg-black/90 border border-white/10 rounded-xl text-xs font-bold text-white opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none whitespace-nowrap z-50 shadow-xl translate-x-2 group-hover:translate-x-0">
            Server Overview
          </div>
        </button>

        {premiumSystemActive && !isPremium && (
          <button
            onClick={() => setView('premium')}
            className={`group relative p-3 rounded-full transition-all cursor-pointer ${view === 'premium'
                ? 'bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.5)] border border-amber-400'
                : 'bg-amber-500/10 text-amber-300 hover:text-white hover:bg-amber-500/20 border border-amber-500/20'
              }`}
          >
            <Crown className="w-6 h-6 transition-transform duration-200 group-hover:scale-125 group-hover:rotate-12" />
            {/* Hover Tooltip */}
            <div className="absolute left-full ml-4 px-2.5 py-1.5 bg-black/90 border border-white/10 rounded-xl text-xs font-bold text-white opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none whitespace-nowrap z-50 shadow-xl translate-x-2 group-hover:translate-x-0">
              Upgrade Premium
            </div>
          </button>
        )}

        {isPremium && view === 'player' && (
          <>
            {/* Themes Preset Selector Button */}
            <button
              onClick={() => {
                setShowBgCustomizer(!showBgCustomizer);
                setShowLyricsCustomizer(false);
                setIsEditMode(false);
              }}
              className={`group relative p-3 rounded-full transition-all cursor-pointer ${showBgCustomizer
                  ? 'bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.5)] border border-amber-400'
                  : 'bg-white/5 text-white/50 hover:text-white hover:bg-white/10 border border-white/5'
                }`}
            >
              <Paintbrush className="w-6 h-6 transition-transform duration-200 group-hover:scale-125 group-hover:rotate-12" />
              <div className="absolute left-full ml-4 px-2.5 py-1.5 bg-black/90 border border-white/10 rounded-xl text-xs font-bold text-white opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none whitespace-nowrap z-50 shadow-xl translate-x-2 group-hover:translate-x-0">
                Themes Customizer
              </div>
            </button>

            {/* Lyrics Style Customizer Button */}
            <button
              onClick={() => {
                setShowLyricsCustomizer(!showLyricsCustomizer);
                setShowBgCustomizer(false);
                setIsEditMode(false);
              }}
              className={`group relative p-3 rounded-full transition-all cursor-pointer ${showLyricsCustomizer
                  ? 'bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.5)] border border-amber-400'
                  : 'bg-white/5 text-white/50 hover:text-white hover:bg-white/10 border border-white/5'
                }`}
            >
              <Palette className="w-6 h-6 transition-transform duration-200 group-hover:scale-125 group-hover:rotate-12" />
              <div className="absolute left-full ml-4 px-2.5 py-1.5 bg-black/90 border border-white/10 rounded-xl text-xs font-bold text-white opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none whitespace-nowrap z-50 shadow-xl translate-x-2 group-hover:translate-x-0">
                Lyrics Customizer
              </div>
            </button>

            {/* Edit Layout Pencil Button */}
            <button
              onClick={() => {
                handleToggleEditMode();
                setShowBgCustomizer(false);
                setShowLyricsCustomizer(false);
              }}
              className={`group relative p-3 rounded-full transition-all cursor-pointer ${isEditMode
                  ? 'bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.5)] border border-amber-400'
                  : 'bg-white/5 text-white/50 hover:text-white hover:bg-white/10 border border-white/5'
                }`}
            >
              <Pencil className="w-6 h-6 transition-transform duration-200 group-hover:scale-125 group-hover:rotate-12" />
              <div className="absolute left-full ml-4 px-2.5 py-1.5 bg-black/90 border border-white/10 rounded-xl text-xs font-bold text-white opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none whitespace-nowrap z-50 shadow-xl translate-x-2 group-hover:translate-x-0">
                {isEditMode ? 'Exit Edit Mode' : 'Edit Layout'}
              </div>
            </button>
          </>
        )}
      </div>

      {/* Side Navigation Sliding Drawer Panel overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            {/* Backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-black/45 backdrop-blur-sm z-[90] pointer-events-auto"
            />

            {/* Sliding Panel */}
            <motion.div
              initial={{ x: '-100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '-100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="fixed left-0 top-0 bottom-0 w-80 bg-black/65 backdrop-blur-3xl border-r border-white/10 shadow-2xl z-[100] flex flex-col p-6 pt-28 justify-between pointer-events-auto rounded-r-3xl"
            >
              {/* Header & Menu Items */}
              <div className="space-y-8 flex-1 flex flex-col min-h-0">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <span className="text-white font-bold text-base tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
                    {siteName.toUpperCase()} NAVIGATION
                  </span>
                  <button
                    onClick={() => setIsSidebarOpen(false)}
                    className="p-1.5 hover:bg-white/10 rounded-full text-white/60 hover:text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Scrollable list containing navigation selections */}
                <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar-vertical min-h-0">
                  <button
                    onClick={() => { setView('player'); setIsSidebarOpen(false); }}
                    className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all border text-left ${view === 'player'
                        ? 'bg-cyan-700/35 border-cyan-500/40 text-cyan-200'
                        : 'bg-white/5 border-transparent text-white/70 hover:bg-white/10 hover:text-white'
                      }`}
                  >
                    <Disc className="w-6 h-6 shrink-0" />
                    <div>
                      <div className="font-bold text-sm">Music Player</div>
                      <div className="text-[10px] text-white/40">View currently playing song & lyrics</div>
                    </div>
                  </button>

                  <button
                    onClick={() => { setView('explore'); setIsSidebarOpen(false); }}
                    className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all border text-left ${view === 'explore'
                        ? 'bg-cyan-700/35 border-cyan-500/40 text-cyan-200'
                        : 'bg-white/5 border-transparent text-white/70 hover:bg-white/10 hover:text-white'
                      }`}
                  >
                    <Compass className="w-6 h-6 shrink-0" />
                    <div>
                      <div className="font-bold text-sm">Explore</div>
                      <div className="text-[10px] text-white/40">Discover songs and load streams</div>
                    </div>
                  </button>

                  <button
                    onClick={() => { setView('playlists'); setIsSidebarOpen(false); }}
                    className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all border text-left ${view === 'playlists'
                        ? 'bg-cyan-700/35 border-cyan-500/40 text-cyan-200'
                        : 'bg-white/5 border-transparent text-white/70 hover:bg-white/10 hover:text-white'
                      }`}
                  >
                    <ListMusic className="w-6 h-6 shrink-0" />
                    <div>
                      <div className="font-bold text-sm">Playlists</div>
                      <div className="text-[10px] text-white/40">Access curated &amp; custom playlists</div>
                    </div>
                  </button>

                  <button
                    onClick={() => { setView('overview'); setIsSidebarOpen(false); }}
                    className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all border text-left ${view === 'overview'
                        ? 'bg-cyan-700/35 border-cyan-500/40 text-cyan-200'
                        : 'bg-white/5 border-transparent text-white/70 hover:bg-white/10 hover:text-white'
                      }`}
                  >
                    <BarChart3 className="w-6 h-6 shrink-0 text-cyan-400" />
                    <div>
                      <div className="font-bold text-sm">Server Overview</div>
                      <div className="text-[10px] text-white/40">VC hours, leaderboard & 24/7 VC mode</div>
                    </div>
                  </button>

                  {/* Premium tab — only for non-premium users */}
                  {premiumSystemActive && !isPremium && (
                    <button
                      onClick={() => { setView('premium'); setIsSidebarOpen(false); }}
                      className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all border text-left ${view === 'premium'
                          ? 'bg-amber-500/20 border-amber-500/50 text-amber-200'
                          : 'bg-amber-500/5 border-amber-500/20 text-amber-300 hover:bg-amber-500/15 hover:text-amber-100'
                        }`}
                    >
                      <Crown className="w-6 h-6 shrink-0" />
                      <div>
                        <div className="font-bold text-sm flex items-center gap-1.5">
                          Upgrade to Premium
                          <span className="text-[9px] px-1.5 py-0.5 bg-amber-500/30 text-amber-300 rounded-full font-bold">PRO</span>
                        </div>
                        <div className="text-[10px] text-amber-400/60">Unlock playlists, likes &amp; themes</div>
                      </div>
                    </button>
                  )}
                </div>
              </div>

              {/* Premium Player Tools in drawer */}
              {isPremium && (
                <div className="border-t border-white/10 pt-4 space-y-2">
                  <div className="text-[10px] font-bold text-amber-400/70 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                    <span>⭐</span> Premium Tools
                  </div>
                  <button
                    onClick={() => { setShowKeybindsModal(true); setIsSidebarOpen(false); }}
                    className={`w-full flex items-center gap-4 p-3 rounded-2xl transition-all border text-left ${showKeybindsModal ? 'bg-amber-500/20 border-amber-500/40 text-amber-300' : 'bg-white/5 border-transparent text-white/70 hover:bg-white/10 hover:text-white'}`}
                  >
                    <Keyboard className="w-5 h-5 shrink-0 text-amber-400" />
                    <div>
                      <div className="font-bold text-sm flex items-center gap-1.5">
                        Key Shortcuts
                        <span className="text-[9px] px-1.5 py-0.5 bg-amber-500/30 text-amber-300 rounded-full font-bold">PRO</span>
                      </div>
                      <div className="text-[10px] text-white/40">Custom shortcuts for controls &amp; nav</div>
                    </div>
                  </button>

                  {view === 'player' && (
                    <>
                      <button
                        onClick={() => { setShowBgCustomizer(!showBgCustomizer); setShowLyricsCustomizer(false); setIsEditMode(false); setIsSidebarOpen(false); }}
                        className={`w-full flex items-center gap-4 p-3 rounded-2xl transition-all border text-left ${showBgCustomizer ? 'bg-amber-500/20 border-amber-500/40 text-amber-300' : 'bg-white/5 border-transparent text-white/70 hover:bg-white/10 hover:text-white'}`}
                      >
                        <Paintbrush className="w-5 h-5 shrink-0" />
                        <div>
                          <div className="font-bold text-sm">Themes Customizer</div>
                          <div className="text-[10px] text-white/40">Change background preset theme</div>
                        </div>
                      </button>
                      <button
                        onClick={() => { setShowLyricsCustomizer(!showLyricsCustomizer); setShowBgCustomizer(false); setIsEditMode(false); setIsSidebarOpen(false); }}
                        className={`w-full flex items-center gap-4 p-3 rounded-2xl transition-all border text-left ${showLyricsCustomizer ? 'bg-amber-500/20 border-amber-500/40 text-amber-300' : 'bg-white/5 border-transparent text-white/70 hover:bg-white/10 hover:text-white'}`}
                      >
                        <Palette className="w-5 h-5 shrink-0" />
                        <div>
                          <div className="font-bold text-sm">Lyrics Style</div>
                          <div className="text-[10px] text-white/40">Customize font, color &amp; glow</div>
                        </div>
                      </button>
                      <button
                        onClick={() => { handleToggleEditMode(); setShowBgCustomizer(false); setShowLyricsCustomizer(false); setIsSidebarOpen(false); }}
                        className={`w-full flex items-center gap-4 p-3 rounded-2xl transition-all border text-left ${isEditMode ? 'bg-amber-500/20 border-amber-500/40 text-amber-300' : 'bg-white/5 border-transparent text-white/70 hover:bg-white/10 hover:text-white'}`}
                      >
                        <Pencil className="w-5 h-5 shrink-0" />
                        <div>
                          <div className="font-bold text-sm">{isEditMode ? 'Exit Edit Mode' : 'Edit Layout'}</div>
                          <div className="text-[10px] text-white/40">Drag &amp; resize player components</div>
                        </div>
                      </button>
                    </>
                  )}
                </div>
              )}

              {/* Voice Channel Activity Listeners list at drawer bottom */}
              {activeUsers && activeUsers.length > 0 && (
                <div className="border-t border-white/10 pt-4 mt-auto">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[11px] font-bold text-white/40 tracking-wider uppercase">Voice Listeners</span>
                  </div>
                  <div className="space-y-2 max-h-44 overflow-y-auto custom-scrollbar-vertical pr-1">
                    {activeUsers.map((u: any) => (
                      <div key={u.id} className="flex items-center gap-3 p-1.5 hover:bg-white/5 rounded-xl transition-colors">
                        {u.avatar ? (
                          <img
                            src={`https://cdn.discordapp.com/avatars/${u.id}/${u.avatar}.png?size=32`}
                            alt={u.tag}
                            className={`w-6 h-6 rounded-full border object-cover ${
                              u.isPremium
                                ? 'border-amber-400 ring-1 ring-amber-400/40 shadow-[0_0_8px_rgba(251,191,36,0.5)]'
                                : 'border-white/10'
                            }`}
                          />
                        ) : (
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-[9px] font-bold border ${
                            u.isPremium
                              ? 'border-amber-400 bg-amber-500/20 text-amber-300 ring-1 ring-amber-400/40 shadow-[0_0_8px_rgba(251,191,36,0.5)]'
                              : 'border-white/10 bg-purple-500'
                          }`}>
                            {u.tag?.[0]?.toUpperCase()}
                          </div>
                        )}
                        <span className={`text-xs truncate flex items-center gap-1 ${u.isPremium
                            ? "text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 font-bold drop-shadow-[0_0_8px_rgba(251,191,36,0.6)] animate-pulse"
                            : "text-white/70"
                          }`}>
                          {u.tag} {u.isPremium && <span className="text-amber-400 text-[10px]">👑</span>}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Current Logged In User Profile Card at drawer bottom */}
              {currentUser && (
                <div className="border-t border-white/10 pt-4 mt-auto flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    {currentUser.avatar ? (
                      <img
                        src={`https://cdn.discordapp.com/avatars/${currentUser.id}/${currentUser.avatar}.png?size=32`}
                        alt={currentUser.username}
                        className={`w-8 h-8 rounded-full border-2 ${
                          isPremium && premiumSystemActive
                            ? 'border-amber-400 ring-2 ring-amber-400/40 shadow-[0_0_10px_rgba(251,191,36,0.6)] animate-pulse'
                            : 'border-white/10'
                        }`}
                      />
                    ) : (
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold border-2 ${
                        isPremium && premiumSystemActive
                          ? 'border-amber-400 bg-amber-500/20 text-amber-300 ring-2 ring-amber-400/40 shadow-[0_0_10px_rgba(251,191,36,0.6)]'
                          : 'border-white/10 bg-purple-500'
                      }`}>
                        {currentUser.username?.[0]?.toUpperCase()}
                      </div>
                    )}
                    <div>
                      <div className={`text-xs font-bold flex items-center gap-1 ${
                        isPremium && premiumSystemActive
                          ? "text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 font-black animate-pulse"
                          : "text-white"
                      }`}>
                        {currentUser.username}
                        {isPremium && premiumSystemActive && (
                          <span className="bg-gradient-to-r from-amber-400 to-yellow-500 text-black text-[8px] font-black uppercase px-1 py-0.2 rounded tracking-wider select-none h-3.5 flex items-center">
                            👑
                          </span>
                        )}
                      </div>
                      <div className="text-[9px] text-white/40">Logged In</div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Mobile Navigation Bottom Tab Bar (Mobile Only) */}
      <div className="flex md:hidden fixed bottom-0 left-0 right-0 z-[60] bg-black/95 backdrop-blur-2xl border-t border-white/10 shadow-[0_-5px_25px_rgba(0,0,0,0.7)]">
        {/* Main tabs row - scrollable container */}
        <div className="flex items-center justify-start sm:justify-around px-2 h-16 w-full overflow-x-auto custom-scrollbar-horizontal scroll-smooth gap-1 min-w-0">
          <button
            onClick={() => { setView('player'); setShowMobileMoreMenu(false); }}
            className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all shrink-0 min-w-[64px] ${view === 'player' ? 'text-cyan-400 font-bold' : 'text-white/50 hover:text-white'
              }`}
          >
            <Disc className="w-5 h-5" />
            <span className="text-[10px] mt-1">Player</span>
          </button>

          <button
            onClick={() => { setView('explore'); setShowMobileMoreMenu(false); }}
            className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all shrink-0 min-w-[64px] ${view === 'explore' ? 'text-cyan-400 font-bold' : 'text-white/50 hover:text-white'
              }`}
          >
            <Compass className="w-5 h-5" />
            <span className="text-[10px] mt-1">Explore</span>
          </button>

          <button
            onClick={() => { setView('playlists'); setShowMobileMoreMenu(false); }}
            className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all shrink-0 min-w-[64px] ${view === 'playlists' ? 'text-cyan-400 font-bold' : 'text-white/50 hover:text-white'
              }`}
          >
            <ListMusic className="w-5 h-5" />
            <span className="text-[10px] mt-1">Playlists</span>
          </button>

          <button
            onClick={() => { setView('overview'); setShowMobileMoreMenu(false); }}
            className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all shrink-0 min-w-[64px] ${view === 'overview' ? 'text-cyan-400 font-bold' : 'text-white/50 hover:text-white'
              }`}
          >
            <BarChart3 className="w-5 h-5" />
            <span className="text-[10px] mt-1">Overview</span>
          </button>

          {premiumSystemActive && !isPremium && (
            <button
              onClick={() => { setView('premium'); setShowMobileMoreMenu(false); }}
              className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all shrink-0 min-w-[64px] ${view === 'premium' ? 'text-amber-400 font-bold' : 'text-amber-300 hover:text-white'
                }`}
            >
              <Crown className="w-5 h-5" />
              <span className="text-[10px] mt-1">Premium</span>
            </button>
          )}

          {/* Premium tools - only in player tab */}
          {isPremium && view === 'player' && (
            <>
              <button
                onClick={() => { setShowBgCustomizer(!showBgCustomizer); setShowLyricsCustomizer(false); setIsEditMode(false); setShowMobileMoreMenu(false); }}
                className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all shrink-0 min-w-[64px] ${showBgCustomizer ? 'text-amber-400 font-bold' : 'text-white/50 hover:text-white'
                  }`}
              >
                <Paintbrush className="w-5 h-5" />
                <span className="text-[10px] mt-1">Themes</span>
              </button>

              <button
                onClick={() => { setShowLyricsCustomizer(!showLyricsCustomizer); setShowBgCustomizer(false); setIsEditMode(false); setShowMobileMoreMenu(false); }}
                className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all shrink-0 min-w-[64px] ${showLyricsCustomizer ? 'text-amber-400 font-bold' : 'text-white/50 hover:text-white'
                  }`}
              >
                <Palette className="w-5 h-5" />
                <span className="text-[10px] mt-1">Lyrics</span>
              </button>

              <button
                onClick={() => { handleToggleEditMode(); setShowBgCustomizer(false); setShowLyricsCustomizer(false); setShowMobileMoreMenu(false); }}
                className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all shrink-0 min-w-[64px] ${isEditMode ? 'text-amber-400 font-bold' : 'text-white/50 hover:text-white'
                  }`}
              >
                <Pencil className="w-5 h-5" />
                <span className="text-[10px] mt-1">Edit</span>
              </button>
            </>
          )}

          {/* Dedicated "More Menu" Tab Button */}
          <button
            onClick={() => setShowMobileMoreMenu(!showMobileMoreMenu)}
            className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all shrink-0 min-w-[64px] ${showMobileMoreMenu ? 'text-amber-400 font-bold bg-white/10' : 'text-white/70 hover:text-white'
              }`}
          >
            <MoreHorizontal className="w-5 h-5" />
            <span className="text-[10px] mt-1">More</span>
          </button>
        </div>
      </div>

      {/* Mobile "More" Menu Slide-Up Sheet */}
      <AnimatePresence>
        {showMobileMoreMenu && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMobileMoreMenu(false)}
              className="md:hidden fixed inset-0 bg-black/70 backdrop-blur-md z-[70]"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="md:hidden fixed bottom-16 left-0 right-0 z-[80] bg-[#121226]/98 backdrop-blur-3xl border-t border-white/20 rounded-t-3xl p-5 shadow-2xl space-y-4 max-h-[80vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2 text-white font-bold text-sm">
                  <MoreHorizontal className="w-4 h-4 text-cyan-400" />
                  <span>More Menu & Tools</span>
                </div>
                <button
                  onClick={() => setShowMobileMoreMenu(false)}
                  className="p-1 rounded-full text-white/60 hover:text-white bg-white/10 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  onClick={() => { setView('player'); setShowMobileMoreMenu(false); }}
                  className={`p-3 rounded-2xl border flex items-center gap-3 text-left transition-all cursor-pointer ${view === 'player' ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200' : 'bg-white/5 border-white/10 text-white/80'
                    }`}
                >
                  <Disc className="w-5 h-5 text-cyan-400 shrink-0" />
                  <div>
                    <div className="text-xs font-bold">Player</div>
                    <div className="text-[9px] text-white/40">Music Controls</div>
                  </div>
                </button>

                <button
                  onClick={() => { setView('explore'); setShowMobileMoreMenu(false); }}
                  className={`p-3 rounded-2xl border flex items-center gap-3 text-left transition-all cursor-pointer ${view === 'explore' ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200' : 'bg-white/5 border-white/10 text-white/80'
                    }`}
                >
                  <Compass className="w-5 h-5 text-cyan-400 shrink-0" />
                  <div>
                    <div className="text-xs font-bold">Explore</div>
                    <div className="text-[9px] text-white/40">Search Music</div>
                  </div>
                </button>

                <button
                  onClick={() => { setView('playlists'); setShowMobileMoreMenu(false); }}
                  className={`p-3 rounded-2xl border flex items-center gap-3 text-left transition-all cursor-pointer ${view === 'playlists' ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200' : 'bg-white/5 border-white/10 text-white/80'
                    }`}
                >
                  <ListMusic className="w-5 h-5 text-cyan-400 shrink-0" />
                  <div>
                    <div className="text-xs font-bold">Playlists</div>
                    <div className="text-[9px] text-white/40">Your Collections</div>
                  </div>
                </button>

                <button
                  onClick={() => { setView('overview'); setShowMobileMoreMenu(false); }}
                  className={`p-3 rounded-2xl border flex items-center gap-3 text-left transition-all cursor-pointer ${view === 'overview' ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200' : 'bg-white/5 border-white/10 text-white/80'
                    }`}
                >
                  <BarChart3 className="w-5 h-5 text-cyan-400 shrink-0" />
                  <div>
                    <div className="text-xs font-bold">Overview</div>
                    <div className="text-[9px] text-white/40">VC & Leaderboard</div>
                  </div>
                </button>

                {premiumSystemActive && !isPremium && (
                  <button
                    onClick={() => { setView('premium'); setShowMobileMoreMenu(false); }}
                    className="col-span-2 p-3 rounded-2xl bg-amber-500/20 border border-amber-400/50 flex items-center gap-3 text-left text-amber-300 cursor-pointer"
                  >
                    <Crown className="w-5 h-5 shrink-0 text-amber-400" />
                    <div>
                      <div className="text-xs font-bold">Upgrade to Premium 👑</div>
                      <div className="text-[9px] text-amber-400/70">Unlock themes, likes & layout customization</div>
                    </div>
                  </button>
                )}

                {isPremium && (
                  <>
                    <button
                      onClick={() => { setShowBgCustomizer(!showBgCustomizer); setShowLyricsCustomizer(false); setIsEditMode(false); setShowMobileMoreMenu(false); }}
                      className={`p-3 rounded-2xl border flex items-center gap-3 text-left transition-all cursor-pointer ${showBgCustomizer ? 'bg-amber-500/20 border-amber-400 text-amber-300' : 'bg-white/5 border-white/10 text-white/80'
                        }`}
                    >
                      <Paintbrush className="w-5 h-5 text-amber-400 shrink-0" />
                      <div>
                        <div className="text-xs font-bold">Themes</div>
                        <div className="text-[9px] text-white/40">Background HSL</div>
                      </div>
                    </button>

                    <button
                      onClick={() => { setShowLyricsCustomizer(!showLyricsCustomizer); setShowBgCustomizer(false); setIsEditMode(false); setShowMobileMoreMenu(false); }}
                      className={`p-3 rounded-2xl border flex items-center gap-3 text-left transition-all cursor-pointer ${showLyricsCustomizer ? 'bg-amber-500/20 border-amber-400 text-amber-300' : 'bg-white/5 border-white/10 text-white/80'
                        }`}
                    >
                      <Palette className="w-5 h-5 text-amber-400 shrink-0" />
                      <div>
                        <div className="text-xs font-bold">Lyrics Style</div>
                        <div className="text-[9px] text-white/40">Glow & Font</div>
                      </div>
                    </button>

                    <button
                      onClick={() => { handleToggleEditMode(); setShowBgCustomizer(false); setShowLyricsCustomizer(false); setShowMobileMoreMenu(false); }}
                      className={`p-3 rounded-2xl border flex items-center gap-3 text-left transition-all cursor-pointer ${isEditMode ? 'bg-amber-500/20 border-amber-400 text-amber-300' : 'bg-white/5 border-white/10 text-white/80'
                        }`}
                    >
                      <Pencil className="w-5 h-5 text-amber-400 shrink-0" />
                      <div>
                        <div className="text-xs font-bold">{isEditMode ? 'Exit Edit' : 'Edit Layout'}</div>
                        <div className="text-[9px] text-white/40">Drag Widgets</div>
                      </div>
                    </button>

                    <button
                      onClick={() => { setShowKeybindsModal(true); setShowMobileMoreMenu(false); }}
                      className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3 text-left text-white/80 cursor-pointer"
                    >
                      <Keyboard className="w-5 h-5 text-amber-400 shrink-0" />
                      <div>
                        <div className="text-xs font-bold">Shortcuts</div>
                        <div className="text-[9px] text-white/40">Keybinds Manager</div>
                      </div>
                    </button>
                  </>
                )}

                <button
                  onClick={() => { setIsSidebarOpen(true); setShowMobileMoreMenu(false); }}
                  className="col-span-2 p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-between text-cyan-300 text-xs font-bold cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Menu className="w-4 h-4" />
                    <span>Open Side Navigation Drawer</span>
                  </div>
                  <span className="text-[10px] text-cyan-400/60">Full Menu & Profile</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className={`relative z-10 min-h-[calc(100vh-140px)] flex flex-col outline-none w-full max-w-[100vw] overflow-x-hidden ${view === 'player'
          ? 'p-2 sm:p-4 md:p-6 pt-28 md:pt-32 md:pl-24 gap-4'
          : 'p-0 pt-20 md:pl-24 gap-0'
        } ${view !== 'player' && currentTrack ? 'pb-32 md:pb-6' : 'pb-20 md:pb-6'}`}>
        <div className={view === 'playlists' ? 'block w-full' : 'hidden'}>
          <PlaylistsView guildId={guildId} userId={userId} isPremium={isPremium} premiumSystemActive={premiumSystemActive} />
        </div>

        <div className={view === 'explore' ? 'block w-full' : 'hidden'}>
          <ExploreView guildId={guildId} userId={userId} isPremium={isPremium} />
        </div>

        <div className={view === 'overview' ? 'block w-full' : 'hidden'}>
          <ServerOverviewView guildId={guildId} userId={userId} onPlayTrack={(query) => executeSearch(query)} />
        </div>

        <div className={view === 'premium' ? 'p-4 sm:p-6 md:p-10 pt-24 md:pt-28 flex flex-col w-full max-w-full' : 'hidden'}>
          <PremiumView
            guildId={guildId}
            userId={userId}
            currentTrack={currentTrack}
            isPlaying={isPlaying}
            handlePlay={handlePlay}
            handlePause={handlePause}
            handleSkip={handleSkip}
            handlePrevious={handlePrevious}
            handleVolumeChange={handleVolumeChange}
            handleSeek={handleSeek}
            volume={volume}
            smoothTime={smoothTime}
            lyrics={lyrics}
          />
        </div>

        {view === 'player' && (
          <>
            {/* Main Content - Player and Lyrics */}
            <div className="flex-1 flex flex-col lg:flex-row gap-4 lg:gap-8">
              {/* Left Side - Player */}
              <div className="lg:w-1/2 flex flex-col justify-center items-center space-y-4 md:space-y-6 w-full max-w-full">

                {/* Persistent Search Bar in Player */}
                <div className="w-full max-w-md relative z-[45] mb-2 px-1">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/50 w-5 h-5" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => handleSearchChange(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && executeSearch()}
                      placeholder="Search songs or paste link..."
                      className="w-full pl-12 pr-20 py-3 bg-white/5 hover:bg-white/10 focus:bg-white/10 border border-white/10 rounded-full text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all text-sm shadow-[0_4px_12px_rgba(0,0,0,0.2)]"
                    />
                    <button
                      onClick={() => executeSearch()}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 px-4 py-1.5 bg-cyan-500 hover:bg-cyan-600 text-white rounded-full font-bold text-xs transition-all shadow-md cursor-pointer"
                    >
                      Play
                    </button>
                  </div>

                  {/* Search Results Dropdown inline */}
                  {searchResults.length > 0 && searchQuery.trim() !== '' && (
                    <div className="absolute top-full left-0 right-0 mt-2 max-h-60 overflow-y-auto custom-scrollbar-vertical rounded-2xl bg-black/90 backdrop-blur-3xl border border-white/10 z-[60] shadow-2xl">
                      {searchResults.map((track, idx) => (
                        <div
                          key={idx}
                          onClick={() => {
                            executeSearch(track.url || `${track.title} ${track.author}`);
                            setSearchQuery('');
                            setSearchResults([]);
                          }}
                          className="flex items-center gap-3 p-3 hover:bg-white/10 cursor-pointer transition-colors border-b border-white/5 last:border-0"
                        >
                          {track.artwork && !track.artwork.includes('placeholder') ? (
                            <img
                              src={track.artwork}
                              onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=100&q=80'; }}
                              alt=""
                              className="w-8 h-8 rounded-md object-cover"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-md bg-white/10 flex items-center justify-center">
                              <Music className="w-4 h-4 text-white/40" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-xs font-semibold truncate">{track.title}</p>
                            <p className="text-white/60 text-[10px] truncate">{track.author}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {isSearching && searchQuery.trim() !== '' && searchResults.length === 0 && (
                    <div className="absolute top-full left-0 right-0 mt-2 p-3 text-center text-xs text-white/50 bg-black/85 rounded-2xl border border-white/10">
                      Searching...
                    </div>
                  )}
                </div>

                {/* Active Viewers (Mobile) */}
                {activeUsers && activeUsers.length > 0 && (
                  <div className="flex md:hidden -space-x-3 items-center z-30 mb-2">
                    <div className="mr-4 text-sm font-medium text-white/70">Watching now:</div>
                    {activeUsers.slice(0, 5).map((u: any, i: number) => (
                      <div key={u.id} className="relative group" style={{ zIndex: 10 - i }}>
                        {u.avatar ? (
                          <img
                            src={`https://cdn.discordapp.com/avatars/${u.id}/${u.avatar}.png?size=32`}
                            alt={u.tag}
                            className={`w-8 h-8 rounded-full border-2 shadow-lg object-cover ${
                              u.isPremium
                                ? 'border-amber-400 ring-1 ring-amber-400/40 shadow-[0_0_8px_rgba(251,191,36,0.6)]'
                                : 'border-black/50 bg-white/10'
                            }`}
                          />
                        ) : (
                          <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-white text-[10px] font-bold ${
                            u.isPremium
                              ? 'border-amber-400 bg-amber-500/20 text-amber-300 ring-1 ring-amber-400/40 shadow-[0_0_8px_rgba(251,191,36,0.6)]'
                              : 'border-black/50 bg-purple-500'
                          }`}>
                            {u.tag?.[0]?.toUpperCase()}
                          </div>
                        )}
                        {u.isPremium && (
                          <span className="absolute -top-1 -right-1 bg-gradient-to-r from-amber-400 to-yellow-500 text-black text-[7px] w-3 h-3 rounded-full flex items-center justify-center font-black select-none border border-black/50">
                            👑
                          </span>
                        )}
                      </div>
                    ))}
                    {activeUsers.length > 5 && (
                      <div className="w-8 h-8 rounded-full bg-white/20 border-2 border-black/50 flex items-center justify-center text-white text-[10px] font-bold relative z-0 left-2">
                        +{activeUsers.length - 5}
                      </div>
                    )}
                  </div>
                )}

                {/* Album Art (Draggable only in Edit Mode) */}
                <motion.div
                  drag={isEditMode}
                  dragMomentum={false}
                  onDragEnd={handleAlbumArtDragEnd}
                  animate={{
                    x: albumArtOffset.x,
                    y: albumArtOffset.y,
                    scale: albumArtScale
                  }}
                  transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                  whileDrag={{ scale: albumArtScale * 1.05, cursor: 'grabbing' }}
                  className={`relative shrink-0 select-none transition-shadow duration-300 ${isEditMode ? 'cursor-grab border-2 border-dashed border-amber-400 rounded-3xl p-2 bg-amber-500/5 shadow-[0_0_15px_rgba(245,158,11,0.25)] z-40' : ''
                    }`}
                >
                  {isPremium && (
                    <div className="absolute top-2 right-2 bg-amber-500/20 backdrop-blur-md border border-amber-500/30 px-2 py-0.5 rounded-full text-[8px] text-amber-300 font-bold z-40 opacity-0 group-hover:opacity-100 transition-opacity">
                      DRAGGABLE
                    </div>
                  )}

                  {/* Pulsing glow effect */}
                  <motion.div
                    className="absolute -inset-12 rounded-3xl blur-3xl"
                    style={{ background: `rgba(${primaryColor}, 0.8)` }}
                    animate={{
                      opacity: [0.4, 0.7, 0.4],
                      scale: [1, 1.1, 1]
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  />

                  {/* Static glow */}
                  <div
                    className="absolute -inset-8 rounded-3xl opacity-50 blur-2xl"
                    style={{ background: `rgba(${primaryColor}, 0.9)` }}
                  />

                  <div className="relative w-64 h-64 lg:w-80 lg:h-80 rounded-2xl shadow-2xl ring-4 ring-white/10 overflow-hidden bg-white/5 flex items-center justify-center backdrop-blur-md">
                    {currentTrack ? (
                      <img
                        src={getCleanArtwork(currentTrack.artwork)}
                        alt={currentTrack.title}
                        className="w-full h-full object-cover pointer-events-none select-none"
                        draggable={false}
                        style={{
                          transform: currentTrack.artwork?.includes('ytimg.com') ? 'scale(1.35)' : 'scale(1)'
                        }}
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-4 text-white/20">
                        <Music className="w-16 h-16 animate-pulse" />
                        <span className="text-xs uppercase tracking-widest font-bold text-white/30">No Track Playing</span>
                      </div>
                    )}

                    {/* Source Platform Badge - SVG Icons */}
                    {currentTrack?.url && (() => {
                      const url = currentTrack.url;
                      let platform = '';
                      let icon: React.ReactNode = null;
                      if (url.includes('youtube.com') || url.includes('youtu.be') || url.includes('ytimg.com')) {
                        platform = 'YouTube';
                        icon = (
                          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="currentColor">
                            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                          </svg>
                        );
                      } else if (url.includes('spotify.com')) {
                        platform = 'Spotify';
                        icon = (
                          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="currentColor">
                            <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
                          </svg>
                        );
                      } else if (url.includes('apple.com') || url.includes('music.apple')) {
                        platform = 'Apple Music';
                        icon = (
                          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="currentColor">
                            <path d="M23.994 6.124a9.23 9.23 0 0 0-.24-2.19c-.317-1.31-1.062-2.31-2.18-3.043a5.022 5.022 0 0 0-1.877-.726 10.496 10.496 0 0 0-1.564-.15c-.04-.003-.083-.01-.124-.013H5.986c-.152.01-.303.017-.455.026C4.786.07 4.043.15 3.34.428 2.004.958 1.04 1.88.475 3.208a4.98 4.98 0 0 0-.362 1.476c-.065.594-.098 1.19-.108 1.79-.006.15-.003.3-.003.45v10.152c0 .15-.003.3.003.45.01.6.043 1.196.108 1.79.066.592.183 1.17.362 1.476.565 1.328 1.529 2.25 2.865 2.78.703.278 1.446.358 2.191.414.152.01.303.016.455.026h12.01c.04-.003.083-.01.124-.013.52-.034 1.04-.077 1.564-.15a5.022 5.022 0 0 0 1.877-.726c1.118-.733 1.863-1.733 2.18-3.043.065-.293.114-.59.143-.89.048-.445.074-.894.085-1.343.003-.08.007-.16.007-.24V6.124zm-6.354 3.286h-1.694V15.5a2.27 2.27 0 0 1-.274 1.07 2.2 2.2 0 0 1-.743.793 2.127 2.127 0 0 1-1.073.306 2.19 2.19 0 0 1-2.19-2.19 2.19 2.19 0 0 1 2.19-2.19c.37 0 .718.093 1.021.257V7.725h2.763v1.685z" />
                          </svg>
                        );
                      } else if (url.includes('jiosaavn.com') || url.includes('saavn.com')) {
                        platform = 'JioSaavn';
                        icon = (
                          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="currentColor">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z" />
                          </svg>
                        );
                      } else if (url.includes('soundcloud.com')) {
                        platform = 'SoundCloud';
                        icon = (
                          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="currentColor">
                            <path d="M1.175 12.225c-.016 0-.016.016-.016.016l-.016.128c0 .064.048.112.112.112H1.4c.064 0 .112-.048.112-.112v-.128c0-.064-.048-.112-.112-.112h-.225zm-.784.032c-.016 0-.016 0-.016.016v.24c0 .064.048.112.112.112h.064c.064 0 .112-.048.112-.112v-.24c0-.016-.016-.016-.016-.016h-.256zm1.6-.08c-.016 0-.016 0-.016.016v.32c0 .064.048.112.112.112h.064c.064 0 .112-.048.112-.112v-.32c0-.016-.016-.016-.016-.016h-.256zm.784-.32c-.016 0-.016 0-.016.016v.64c0 .064.048.112.112.112h.064c.064 0 .112-.048.112-.112v-.64c0-.016-.016-.016-.016-.016h-.256zm.784-.64c-.016 0-.016 0-.016.016v1.28c0 .064.048.112.112.112h.064c.064 0 .112-.048.112-.112v-1.28c0-.016-.016-.016-.016-.016h-.256zm.784-1.12c-.016 0-.016 0-.016.016v2.4c0 .064.048.112.112.112h.064c.064 0 .112-.048.112-.112v-2.4c0-.016-.016-.016-.016-.016h-.256zm.784.384c-.016 0-.016 0-.016.016v2.016c0 .064.048.112.112.112h.064c.064 0 .112-.048.112-.112V10.5c0-.016-.016-.016-.016-.016h-.256zm.784-.784c-.016 0-.016 0-.016.016v2.8c0 .064.048.112.112.112h.064c.064 0 .112-.048.112-.112v-2.8c0-.016-.016-.016-.016-.016h-.256zm.784-.8c-.016 0-.016 0-.016.016v3.6c0 .064.048.112.112.112h.064c.064 0 .112-.048.112-.112V9.1c0-.016-.016-.016-.016-.016h-.256zm5.616-1.12c-.464 0-.896.112-1.28.304a3.84 3.84 0 0 0-3.84-3.84 3.84 3.84 0 0 0-1.28.224V14.4h6.4a2.4 2.4 0 0 0 2.4-2.4 2.4 2.4 0 0 0-2.4-2.4z" />
                          </svg>
                        );
                      } else if (url.includes('deezer.com')) {
                        platform = 'Deezer';
                        icon = (
                          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="currentColor">
                            <path d="M18.81 11.647H24v2.117h-5.19zM18.81 8.28H24v2.117h-5.19zM18.81 15.014H24v2.117h-5.19zM12.857 15.014h5.19v2.117h-5.19zM6.903 15.014h5.19v2.117h-5.19zM.95 15.014h5.19v2.117H.95zM12.857 11.647h5.19v2.117h-5.19zM6.903 11.647h5.19v2.117h-5.19z" />
                          </svg>
                        );
                      }
                      if (!platform) return null;
                      return (
                        <div className="absolute bottom-2 right-2 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md border border-white/10 text-white text-[10px] font-bold shadow-lg pointer-events-none select-none">
                          {icon}
                          <span>{platform}</span>
                        </div>
                      );
                    })()}
                  </div>
                </motion.div>

                {/* Track Metadata (Draggable only in Edit Mode) */}
                <motion.div
                  drag={isEditMode}
                  dragMomentum={false}
                  onDragEnd={handleMetadataDragEnd}
                  animate={{
                    x: metadataOffset.x,
                    y: metadataOffset.y,
                    scale: metadataScale
                  }}
                  transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                  whileDrag={{ scale: metadataScale * 1.05, cursor: 'grabbing' }}
                  className={`text-center space-y-2 w-full max-w-md relative px-4 select-none ${isEditMode ? 'cursor-grab border-2 border-dashed border-amber-400 rounded-2xl p-2 bg-amber-500/5 shadow-[0_0_15px_rgba(245,158,11,0.25)] z-40' : ''
                    }`}
                >
                  <div className="flex items-center justify-center gap-3 w-full">
                    <h1 className="text-xl lg:text-2xl font-bold text-white drop-shadow-lg truncate min-w-0">
                      {currentTrack?.title || 'No track playing'}
                    </h1>
                    {currentTrack && (
                      <div className="relative shrink-0">
                        <button
                          onClick={handlePlaylistAddClick}
                          className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-all text-white/70 hover:text-white cursor-pointer"
                          title="Add to Playlist"
                        >
                          <ListPlus className="w-5 h-5" />
                        </button>

                        <AnimatePresence>
                          {showPlaylistAdd && (
                            <motion.div
                              initial={{ opacity: 0, y: 10, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: 10, scale: 0.95 }}
                              className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-48 bg-black/90 backdrop-blur-3xl border border-white/20 rounded-xl shadow-2xl p-2 z-[100]"
                            >
                              <div className="text-xs font-bold text-white/50 mb-2 px-2 uppercase text-left">Your Playlists</div>
                              {userPlaylists.length === 0 ? (
                                <div className="px-2 pb-2 text-xs text-white/60 text-left">No playlists found.</div>
                              ) : (
                                <div className="max-h-40 overflow-y-auto custom-scrollbar-vertical">
                                  {userPlaylists.map(pl => (
                                    <button
                                      key={pl.id}
                                      onClick={() => confirmAddToPlaylist(pl.id)}
                                      className="w-full text-left px-3 py-2 text-xs text-white hover:bg-white/10 rounded-lg transition-colors truncate cursor-pointer"
                                    >
                                      {pl.name}
                                    </button>
                                  ))}
                                </div>
                              )}
                              <button
                                onClick={() => setShowPlaylistAdd(false)}
                                className="w-full text-center mt-2 pt-2 border-t border-white/10 text-[10px] text-white/50 hover:text-white cursor-pointer"
                              >
                                Cancel
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )}
                  </div>

                  <p className="text-lg text-white/80 drop-shadow-md">
                    {currentTrack?.author || 'Unknown Artist'}
                  </p>

                  {/* Requester Info */}
                  {currentTrack?.requester && (
                    <div className="flex items-center justify-center gap-2 mt-3 px-4 py-2 backdrop-blur-xl bg-white/10 rounded-full inline-flex">
                      {currentTrack.requester.avatar && currentTrack.requester.id ? (
                        <img
                          src={`https://cdn.discordapp.com/avatars/${currentTrack.requester.id}/${currentTrack.requester.avatar}.png?size=32`}
                          alt=""
                          className={`w-5 h-5 rounded-full object-cover ${
                            isRequesterPremium
                              ? 'border border-amber-400 ring-1 ring-amber-400/35 shadow-[0_0_6px_rgba(251,191,36,0.5)]'
                              : ''
                          }`}
                        />
                      ) : (
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-white text-[8px] font-bold ${
                          isRequesterPremium
                            ? 'border border-amber-400 bg-amber-500/20 text-amber-300 ring-1 ring-amber-400/35 shadow-[0_0_6px_rgba(251,191,36,0.5)]'
                            : 'bg-cyan-500'
                        }`}>
                          {currentTrack.requester.tag?.[0]?.toUpperCase()}
                        </div>
                      )}
                      <span className={`text-xs flex items-center gap-1 ${
                        isRequesterPremium
                          ? 'text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 font-bold drop-shadow-[0_0_6px_rgba(251,191,36,0.4)] animate-pulse'
                          : 'text-white/70'
                      }`}>
                        Requested by {currentTrack.requester.tag || 'Unknown'}
                        {isRequesterPremium && <span className="text-amber-400 text-[10px]">👑</span>}
                      </span>
                    </div>
                  )}
                </motion.div>

                {/* Playback Controls Card (Draggable only in Edit Mode) */}
                <motion.div
                  drag={isEditMode}
                  dragMomentum={false}
                  onDragEnd={handleControlsDragEnd}
                  animate={{
                    x: controlsOffset.x,
                    y: controlsOffset.y,
                    scale: controlsScale
                  }}
                  transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                  whileDrag={{ scale: controlsScale * 1.02, cursor: 'grabbing' }}
                  className={`w-full max-w-md flex flex-col space-y-5 items-center select-none ${isEditMode ? 'cursor-grab border-2 border-dashed border-amber-400 rounded-3xl p-3 bg-amber-500/5 shadow-[0_0_15px_rgba(245,158,11,0.25)] z-40' : ''
                    }`}
                >
                  {/* Horizontal Progress Bar with Hover Preview Tooltip */}
                  <div className="w-full space-y-2 group relative z-30">
                    <div
                      onMouseMove={(e) => {
                        if (!currentTrack) return;
                        const rect = e.currentTarget.getBoundingClientRect();
                        const clickX = e.clientX - rect.left;
                        const percentage = Math.max(0, Math.min(1, clickX / rect.width));
                        const targetMs = percentage * currentTrack.duration;
                        setHoverPosition(percentage);
                        setHoverTime(formatTime(targetMs));
                        setHoverX(clickX);
                      }}
                      onMouseLeave={() => {
                        setHoverPosition(null);
                      }}
                      className="relative h-1.5 bg-white/20 rounded-full transition-all duration-300 hover:h-2.5 cursor-pointer flex items-center"
                    >
                      {/* Floating Tooltip */}
                      {hoverPosition !== null && (
                        <div
                          className="absolute bottom-full mb-2.5 bg-black/90 text-white text-[10px] font-bold py-1 px-2 rounded border border-white/10 pointer-events-none -translate-x-1/2 shadow-lg transition-all z-50 whitespace-nowrap"
                          style={{ left: `${hoverX}px` }}
                        >
                          {hoverTime}
                        </div>
                      )}

                      {/* Progress Container */}
                      <div className="absolute inset-0 rounded-full overflow-hidden bg-black/10">
                        {/* Animated Progress Fill */}
                        <motion.div
                          className="absolute inset-y-0 left-0 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-full"
                          style={{
                            width: `${((smoothTime * 1000) / (currentTrack?.duration || 1)) * 100}%`
                          }}
                        />
                      </div>

                      {/* Glowing Knob */}
                      <motion.div
                        className="absolute w-3.5 h-3.5 bg-white rounded-full shadow-[0_0_15px_rgba(255,255,255,1)] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-20"
                        style={{
                          left: `calc(${((smoothTime * 1000) / (currentTrack?.duration || 1)) * 100}% - 7px)`
                        }}
                      />

                      <input
                        type="range"
                        min="0"
                        max={currentTrack?.duration || 0}
                        value={position}
                        onChange={(e) => handleSeek(Number(e.target.value))}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-30"
                      />
                    </div>
                    <div className="flex justify-between text-xs text-white/50 drop-shadow-md font-medium px-1 transition-colors group-hover:text-white/90">
                      <span>{formatTime(smoothTime * 1000)}</span>
                      <span>{formatTime(currentTrack?.duration || 0)}</span>
                    </div>
                  </div>

                  {/* Playback Controls */}
                  <div className="flex items-center justify-center gap-4 relative z-20">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleAutoplayToggle();
                      }}
                      className={`p-3 rounded-full backdrop-blur-xl transition-all cursor-pointer ${autoplay ? 'bg-white/30 text-white' : 'bg-white/10 text-white/60 hover:bg-white/20'
                        }`}
                      title={`Autoplay: ${autoplay ? 'On' : 'Off'}`}
                    >
                      <Shuffle className="w-5 h-5" />
                    </button>

                    <button
                      onClick={handlePrevious}
                      className="p-3 rounded-full backdrop-blur-xl bg-white/10 text-white hover:bg-white/20 transition-all cursor-pointer"
                    >
                      <SkipBack className="w-6 h-6" />
                    </button>

                    <button
                      onClick={isPlaying ? handlePause : handlePlay}
                      className="p-5 rounded-full backdrop-blur-xl bg-white text-black hover:scale-105 transition-all shadow-2xl cursor-pointer"
                    >
                      {isPlaying ? (
                        <Pause className="w-8 h-8" fill="black" />
                      ) : (
                        <Play className="w-8 h-8 ml-1" fill="black" />
                      )}
                    </button>

                    <button
                      onClick={handleSkip}
                      className="p-3 rounded-full backdrop-blur-xl bg-white/10 text-white hover:bg-white/20 transition-all cursor-pointer"
                    >
                      <SkipForward className="w-6 h-6" />
                    </button>

                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleLoopChange();
                      }}
                      className={`p-3 rounded-full backdrop-blur-xl transition-all cursor-pointer ${loopMode !== 'off' ? 'bg-white/30 text-white' : 'bg-white/10 text-white/60 hover:bg-white/20'
                        }`}
                      title={`Loop: ${loopMode === 'off' ? 'Off' : loopMode === 'track' ? 'Track' : 'Queue'}`}
                    >
                      {getLoopIcon()}
                    </button>
                  </div>

                  {/* Secondary Controls */}
                  <div className="flex flex-wrap items-center justify-center gap-3 w-full px-2">
                    <div className="relative z-50">
                      <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`p-3 rounded-full backdrop-blur-xl transition-all cursor-pointer ${activeFilter !== 'none' ? 'bg-purple-500/30 text-purple-300' : 'bg-white/10 text-white/60 hover:bg-white/20'
                          }`}
                        title="Audio Filters"
                      >
                        <Sliders className="w-5 h-5" />
                      </button>

                      {showFilters && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 backdrop-blur-2xl bg-white/10 rounded-xl p-3 shadow-2xl border border-white/20 min-w-[200px] z-[100]"
                        >
                          <div className="space-y-2">
                            <button
                              onClick={() => handleFilterChange('nightcore')}
                              className="w-full text-left px-4 py-2 rounded-lg text-white hover:bg-white/20 transition-all text-sm cursor-pointer"
                            >
                              🎵 Nightcore
                            </button>
                            <button
                              onClick={() => handleFilterChange('vibrato')}
                              className="w-full text-left px-4 py-2 rounded-lg text-white hover:bg-white/20 transition-all text-sm cursor-pointer"
                            >
                              🎸 Vibrato
                            </button>
                            <button
                              onClick={() => handleFilterChange('karaoke')}
                              className="w-full text-left px-4 py-2 rounded-lg text-white hover:bg-white/20 transition-all text-sm cursor-pointer"
                            >
                              🎤 Karaoke
                            </button>
                            <button
                              onClick={() => handleFilterChange('rotation')}
                              className="w-full text-left px-4 py-2 rounded-lg text-white hover:bg-white/20 transition-all text-sm cursor-pointer"
                            >
                              🔄 Rotation
                            </button>
                            <button
                              onClick={() => handleFilterChange('equalizer')}
                              className="w-full text-left px-4 py-2 rounded-lg text-white hover:bg-white/20 transition-all text-sm cursor-pointer"
                            >
                              🎚️ Equalizer
                            </button>
                            <button
                              onClick={() => handleFilterChange('lowpass')}
                              className="w-full text-left px-4 py-2 rounded-lg text-white hover:bg-white/20 transition-all text-sm cursor-pointer"
                            >
                              🔉 Lowpass
                            </button>
                            <button
                              onClick={() => handleFilterChange('distortion')}
                              className="w-full text-left px-4 py-2 rounded-lg text-white hover:bg-white/20 transition-all text-sm cursor-pointer"
                            >
                              🎛️ Distortion
                            </button>
                            <button
                              onClick={() => handleFilterChange('tremolo')}
                              className="w-full text-left px-4 py-2 rounded-lg text-white hover:bg-white/20 transition-all text-sm cursor-pointer"
                            >
                              🌊 Tremolo
                            </button>
                            <div className="border-t border-white/20 my-2"></div>
                            <button
                              onClick={() => handleFilterChange('reset')}
                              className="w-full text-left px-4 py-2 rounded-lg text-red-300 hover:bg-red-500/20 transition-all text-sm cursor-pointer"
                            >
                              ❌ Clear Filters
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </div>

                    <button
                      onClick={() => {
                        if (typeof window !== 'undefined' && (window as any).toggleAuroraPip) {
                          (window as any).toggleAuroraPip();
                        }
                      }}
                      className="p-3 rounded-full backdrop-blur-xl bg-white/10 text-white/60 hover:text-cyan-300 hover:bg-cyan-500/20 border border-transparent hover:border-cyan-500/30 transition-all cursor-pointer"
                      title="Pop out Floating Desktop Player (PiP Window)"
                    >
                      <PictureInPicture2 className="w-5 h-5" />
                    </button>

                    <button
                      onClick={handleStop}
                      className="p-3 rounded-full backdrop-blur-xl bg-white/10 text-white/60 hover:bg-red-500/30 hover:text-red-300 transition-all cursor-pointer"
                      title="Stop Player"
                    >
                      <Square className="w-5 h-5" />
                    </button>

                    <button
                      onClick={toggleLike}
                      className={`p-3 rounded-full backdrop-blur-xl transition-all cursor-pointer ${liked ? 'bg-pink-500/30 text-pink-300' : 'bg-white/10 text-white/60 hover:bg-white/20'
                        }`}
                    >
                      <Heart className="w-5 h-5" fill={liked ? 'currentColor' : 'none'} />
                    </button>

                    <button
                      onClick={() => {
                        setShowLikedSongs(!showLikedSongs);
                        if (!showLikedSongs) fetchLikedSongs();
                      }}
                      className="p-3 rounded-full backdrop-blur-xl bg-white/10 text-white/60 hover:bg-white/20 transition-all cursor-pointer"
                      title="View Liked Songs"
                    >
                      <Music className="w-5 h-5" />
                    </button>

                    {currentTrack?.url && (
                      <a
                        href={currentTrack.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-3 rounded-full backdrop-blur-xl bg-white/10 text-white/60 hover:bg-white/20 transition-all"
                      >
                        <ExternalLink className="w-5 h-5" />
                      </a>
                    )}

                    <div className="flex items-center gap-3 px-4 py-2 rounded-full backdrop-blur-xl bg-white/10 group relative z-30 cursor-pointer hover:bg-white/20 transition-colors">
                      <Volume2 className="w-5 h-5 text-white/70 group-hover:text-white transition-colors" />
                      <div className="w-28 relative h-2 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="absolute inset-y-0 left-0 bg-gradient-to-r from-teal-400 to-white rounded-full shadow-[0_0_10px_rgba(45,212,191,0.5)] transition-[width] duration-100"
                          style={{ width: `${volume}%` }}
                        />
                        <div
                          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,1)] opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-20"
                          style={{ left: `calc(${volume}% - 6px)` }}
                        />
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={volume}
                          onChange={(e) => handleVolumeChange(Number(e.target.value))}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-30"
                        />
                      </div>
                      <span className="text-xs font-medium text-white/70 w-8 text-right group-hover:text-white transition-colors">{volume}%</span>
                    </div>
                  </div>

                  {/* Mode Indicators */}
                  <div className="flex flex-wrap items-center justify-center gap-3">
                    <div className="flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-xl bg-white/10">
                      <Shuffle className={`w-4 h-4 ${autoplay ? 'text-white' : 'text-white/40'}`} />
                      <span className="text-sm text-white/70">Autoplay: {autoplay ? 'On' : 'Off'}</span>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-xl bg-white/10">
                      <Repeat className={`w-4 h-4 ${loopMode !== 'off' ? 'text-white' : 'text-white/40'}`} />
                      <span className="text-sm text-white/70">
                        Loop: {loopMode === 'off' ? 'Off' : loopMode === 'track' ? 'Track' : 'Queue'}
                      </span>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Right Side - Lyrics displaying (with Customizable styles) */}
              <div className="lg:w-1/2 flex flex-col justify-center items-center px-4 lg:px-12 relative z-30">
                <motion.div
                  drag={isEditMode}
                  dragMomentum={false}
                  onDragEnd={handleLyricsDragEnd}
                  animate={{
                    x: lyricsOffset.x,
                    y: lyricsOffset.y
                  }}
                  transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                  whileDrag={{ cursor: 'grabbing' }}
                  className={`w-full max-w-3xl flex flex-col justify-center min-h-[520px] transition-all select-none ${isEditMode ? 'cursor-grab border-2 border-dashed border-amber-400 rounded-3xl p-3 bg-amber-500/5 shadow-[0_0_15px_rgba(245,158,11,0.25)] z-40' : ''
                    }`}
                >





                  {lyricsLoading && (
                    <div className="flex flex-col items-center justify-center h-96">
                      <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin mb-4" />
                      <p className="text-white/60 text-lg">Loading lyrics...</p>
                    </div>
                  )}

                  {lyricsError && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex flex-col items-center justify-center h-96 text-center gap-4"
                    >
                      <motion.div
                        animate={{ rotate: [0, -8, 8, -8, 0], y: [0, -5, 0] }}
                        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                        className="relative"
                      >
                        <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center backdrop-blur-md">
                          <Music className="w-10 h-10 text-white/30" />
                        </div>
                        <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500/80 flex items-center justify-center">
                          <X className="w-3 h-3 text-white" />
                        </div>
                      </motion.div>
                      <div>
                        <p className="text-white/50 text-base font-semibold">{lyricsError}</p>
                        <p className="text-white/25 text-xs mt-1">No synced lyrics found for this track</p>
                      </div>
                    </motion.div>
                  )}

                  {!lyricsLoading && !lyricsError && lyrics.length > 0 && (
                    <div className="relative w-full flex flex-col items-center">
                      {!isLyricsSynced && (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold mb-3 shadow-sm select-none">
                          <Info className="w-3.5 h-3.5" />
                          <span>Unsynced Lyrics</span>
                        </div>
                      )}

                      <div
                        ref={lyricsContainerRef}
                        onPointerDown={() => { isUserInteractingLyricsRef.current = true; }}
                        onPointerUp={() => { setTimeout(() => { isUserInteractingLyricsRef.current = false; }, 300); }}
                        onTouchStart={() => { isUserInteractingLyricsRef.current = true; }}
                        onTouchEnd={() => { setTimeout(() => { isUserInteractingLyricsRef.current = false; }, 300); }}
                        onWheel={() => {
                          isUserInteractingLyricsRef.current = true;
                          setTimeout(() => { isUserInteractingLyricsRef.current = false; }, 800);
                        }}
                        onScroll={handleLyricsContainerScroll}
                        className="w-full max-h-[480px] lg:max-h-[540px] overflow-y-auto px-4 py-12 space-y-6 scroll-smooth custom-scrollbar bg-transparent border-0 select-none text-center"
                      >
                        {lyrics.map((line, index) => {
                          const isActive = isLyricsSynced && index === activeLyricIndex;
                          const isAutoColor = lyricsColor === 'auto';
                          
                          // Luminance boosting for dynamic auto color
                          let brightColor = '#38bdf8';
                          let glowColorStr = 'rgba(56, 189, 248, 0.95)';
                          if (dominantColor && dominantColor !== '0, 0, 0' && dominantColor !== '0,0,0') {
                            const parts = dominantColor.split(',').map(n => parseInt(n.trim(), 10) || 0);
                            let [r, g, b] = parts.length === 3 ? parts : [56, 189, 248];
                            const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
                            if (luminance < 140) {
                              const boost = (140 - luminance) / 1.5;
                              r = Math.min(255, Math.round(r + boost + 50));
                              g = Math.min(255, Math.round(g + boost + 50));
                              b = Math.min(255, Math.round(b + boost + 50));
                            }
                            brightColor = `rgb(${r}, ${g}, ${b})`;
                            glowColorStr = `rgba(${r}, ${g}, ${b}, 0.95)`;
                          }

                          return (
                            <div
                              key={line.id || index}
                              ref={isActive ? activeLineRef : null}
                              onClick={(e) => {
                                if (isLyricsSynced && typeof line.time === 'number' && line.time >= 0) {
                                  handleSeek(line.time * 1000, true);
                                  setIsAutoSync(true);
                                  const container = lyricsContainerRef.current;
                                  const target = e.currentTarget;
                                  if (container && target) {
                                    const scrollTo = target.offsetTop - (container.clientHeight / 2) + (target.clientHeight / 2);
                                    container.scrollTo({
                                      top: Math.max(0, scrollTo),
                                      behavior: 'smooth'
                                    });
                                  }
                                }
                              }}
                              style={{
                                color: isActive ? (isAutoColor ? brightColor : undefined) : undefined,
                                textShadow: isActive
                                  ? isAutoColor
                                    ? `0 0 25px ${glowColorStr}, 0 2px 12px rgba(0,0,0,0.95)`
                                    : '0 0 25px rgba(255,255,255,0.95), 0 2px 12px rgba(0,0,0,0.95)'
                                  : '0 1px 6px rgba(0,0,0,0.85)'
                              }}
                              className={`transition-colors duration-300 leading-relaxed text-2xl lg:text-3xl font-bold ${
                                !isLyricsSynced
                                  ? 'text-white/85 opacity-90'
                                  : isActive
                                  ? `${
                                      isAutoColor
                                        ? ""
                                        : lyricsColor === 'text-white'
                                        ? "text-white"
                                        : lyricsColor
                                    } opacity-100 ${lyricsGlow ? "animate-pulse" : ""}`
                                  : 'text-white/60 opacity-60 hover:text-white/95 hover:opacity-95 cursor-pointer'
                              }`}
                            >
                              {line.text}
                            </div>
                          );
                        })}
                        <div className="h-40" />
                      </div>

                      {/* Glassmorphism Controls Floating Bar */}
                      <div className="absolute bottom-3 z-50 flex items-center gap-3">
                        {isLyricsSynced && !isAutoSync && (
                          <button
                            onClick={() => {
                              setIsAutoSync(true);
                              if (activeLineRef.current && lyricsContainerRef.current) {
                                const container = lyricsContainerRef.current;
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
                            setLyricsLoading(true);
                            setLyricsError(null);
                            lyricsSocketRef.current?.emit('request-lyrics', { guildId, forceRefresh: true });
                          }}
                          className="px-4 py-2 rounded-full backdrop-blur-2xl bg-amber-400/20 hover:bg-amber-400/30 border border-amber-400/40 text-amber-300 font-semibold text-xs flex items-center gap-2 shadow-[0_8px_32px_rgba(0,0,0,0.5)] transition-all cursor-pointer hover:scale-105 active:scale-95"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>Re-Fetch Synced Lyrics</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {!lyricsLoading && !lyricsError && lyrics.length === 0 && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex flex-col items-center justify-center h-96 text-center gap-4"
                    >
                      <motion.div
                        animate={{ scale: [1, 1.08, 1], opacity: [0.4, 0.7, 0.4] }}
                        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                        className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center backdrop-blur-md"
                      >
                        <Music className="w-10 h-10 text-white/30" />
                      </motion.div>
                      <div>
                        <p className="text-white/50 text-base font-semibold">No lyrics available</p>
                        <p className="text-white/25 text-xs mt-1">Lyrics not found for this track</p>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              </div>
            </div>

            {/* Queue Card - Bottom Section */}
            {!showLikedSongs ? (
              <motion.div
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="w-full"
              >
                <div className="backdrop-blur-2xl bg-white/10 rounded-2xl p-6 shadow-2xl border border-white/20">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-white font-bold text-xl drop-shadow-md">Up Next</h3>
                    <span className="text-white/60 text-sm">{localQueue.length} songs</span>
                  </div>

                  {localQueue.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-white/50">Queue is empty</p>
                    </div>
                  ) : (
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={handleDragEnd}
                    >
                      <SortableContext
                        items={localQueue.map(t => t.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        <div className="flex gap-4 overflow-x-auto pb-2 custom-scrollbar-horizontal">
                          {localQueue.slice(0, 15).map((track, index) => (
                            <SortableQueueItem
                              key={track.id}
                              track={track}
                              index={index}
                              formatTime={formatTime}
                            />
                          ))}
                        </div>
                      </SortableContext>
                    </DndContext>
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="w-full"
              >
                <div className="backdrop-blur-2xl bg-white/10 rounded-2xl p-6 shadow-2xl border border-white/20">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-white font-bold text-xl drop-shadow-md">Liked Songs</h3>
                    <div className="flex items-center gap-3">
                      <span className="text-white/60 text-sm">{likedSongs.length} songs</span>
                      {likedSongs.length > 0 && (
                        <button
                          onClick={playAllLikedSongs}
                          className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg text-sm font-semibold transition-all"
                        >
                          Play All
                        </button>
                      )}
                    </div>
                  </div>

                  {likedSongs.length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center py-12 flex flex-col items-center gap-3"
                    >
                      <Heart className="w-10 h-10 text-white/20" />
                      <p className="text-white/50 text-sm">No liked songs yet</p>
                      <p className="text-white/25 text-xs">Like a song using the ♥ button while it plays</p>
                    </motion.div>
                  ) : (
                    <div className="flex gap-4 overflow-x-auto pb-2 custom-scrollbar-horizontal">
                      {likedSongs.map((item, index) => (
                        <div
                          key={item._id || index}
                          className="flex-shrink-0 w-40 group cursor-pointer"
                          onClick={() => playLikedSong(item.track)}
                        >
                          <div className="relative mb-2">
                            <img
                              src={item.track.artwork}
                              alt={item.track.title}
                              className="w-40 h-40 rounded-xl object-cover shadow-lg"
                              draggable={false}
                            />
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center">
                              <Play className="w-12 h-12 text-white" fill="white" />
                            </div>
                          </div>
                          <p className="text-white text-sm font-medium truncate drop-shadow-md">{item.track.title}</p>
                          <p className="text-white/60 text-xs truncate">{item.track.author}</p>
                          <p className="text-white/40 text-xs mt-1">{formatTime(item.track.duration)}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </>
        )}
      </div>

      <AnimatePresence>
        {view !== 'player' && currentTrack && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="md:hidden fixed bottom-16 left-0 right-0 z-[60] px-3 pb-1"
          >
            <div className="bg-black/90 backdrop-blur-2xl border border-white/10 rounded-2xl px-4 py-2.5 flex items-center gap-3 shadow-[0_-4px_30px_rgba(0,0,0,0.6)]">
              <div className="w-9 h-9 rounded-xl overflow-hidden shrink-0 bg-white/10">
                {currentTrack.artwork && !currentTrack.artwork.includes('placeholder.com') ? (
                  <img src={currentTrack.artwork} alt="" className="w-full h-full object-cover" draggable={false} />
                ) : (
                  <Disc className="w-full h-full text-white/30 p-1.5" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-white text-xs font-bold truncate">{currentTrack.title}</p>
                <div className="relative h-1 bg-white/15 rounded-full mt-1.5 cursor-pointer"
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                    handleSeek(pct * currentTrack.duration);
                  }}
                >
                  <div
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-full transition-[width] duration-300 ease-linear"
                    style={{ width: `${Math.min(100, ((smoothTime * 1000) / (currentTrack.duration || 1)) * 100)}%` }}
                  />
                </div>
              </div>

              <button
                onClick={() => isPlaying ? handlePause() : handlePlay()}
                className="w-8 h-8 bg-white rounded-full flex items-center justify-center shrink-0 shadow-md"
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5 fill-black text-black" /> : <Play className="w-3.5 h-3.5 fill-black text-black ml-0.5" />}
              </button>

              <button
                onClick={() => setView('player')}
                className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0 text-white/70 hover:text-white hover:bg-white/20 transition-all"
                title="Expand player"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                </svg>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {view !== 'player' && currentTrack && (
          <motion.div
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 100, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            onClick={() => setView('player')}
            className="hidden md:flex fixed right-4 top-1/2 -translate-y-1/2 w-14 hover:w-36 bg-black/85 backdrop-blur-3xl border border-white/10 rounded-2xl p-2.5 flex-col items-center justify-between shadow-[0_10px_40px_rgba(0,0,0,0.6)] transition-all duration-300 group z-50 cursor-pointer h-[320px] hover:h-[360px]"
          >
            <div className="relative w-9 h-9 rounded-full overflow-hidden shrink-0 border border-white/20 shadow-md">
              {currentTrack.artwork && !currentTrack.artwork.includes('placeholder.com') ? (
                <img
                  src={currentTrack.artwork}
                  alt="Mini Cover"
                  className="w-full h-full object-cover"
                  draggable={false}
                />
              ) : (
                <Disc className={`w-full h-full text-white/40 ${isPlaying ? 'animate-spin' : ''}`} style={{ animationDuration: '6s' }} />
              )}
            </div>

            <div className="hidden group-hover:flex flex-col items-center text-center w-full max-w-[120px] overflow-hidden px-1 my-0.5">
              <span className="text-white font-bold text-[10px] line-clamp-1 w-full">{currentTrack.title}</span>
              <span className="text-white/60 text-[8px] line-clamp-1 w-full">{currentTrack.author}</span>
            </div>

            <div className="flex flex-col items-center gap-1 w-full justify-center">
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  if (!seekRef.current) return;
                  const rect = seekRef.current.getBoundingClientRect();
                  const clickY = e.clientY - rect.top;
                  const percentage = 1 - (clickY / rect.height);
                  handleSeek(Math.max(0, Math.min(currentTrack.duration, percentage * currentTrack.duration)));
                }}
                ref={seekRef}
                className="h-16 w-1 bg-white/15 rounded-full relative cursor-pointer group-hover:h-20 transition-all"
                title="Seek"
              >
                <div
                  className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-cyan-400 to-purple-500 rounded-full shadow-[0_0_10px_rgba(168,85,247,0.5)]"
                  style={{ height: `${(position / (currentTrack?.duration || 1)) * 100}%` }}
                />
              </div>
              <span className="text-[8px] font-bold text-white/50 hidden group-hover:inline">
                {formatTime(smoothTime * 1000)} / {formatTime(currentTrack.duration)}
              </span>
            </div>

            <div className="flex flex-col items-center gap-2" onClick={e => e.stopPropagation()}>
              <button
                onClick={() => {
                  if (isPlaying) handlePause();
                  else handlePlay();
                }}
                className="w-8 h-8 bg-white rounded-full flex items-center justify-center hover:scale-105 transition shadow-lg text-black"
              >
                {isPlaying ? <Pause className="w-3 h-3 fill-black text-black" /> : <Play className="w-3 h-3 fill-black text-black ml-0.5" />}
              </button>
              <button
                onClick={handleSkip}
                className="text-white/60 hover:text-white transition"
                title="Next"
              >
                <SkipForward className="w-4 h-4" />
              </button>
            </div>

            <div
              onWheel={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const delta = e.deltaY;
                let newVolume = volume;
                if (delta > 0) {
                  newVolume = Math.max(0, volume - 5);
                } else if (delta < 0) {
                  newVolume = Math.min(100, volume + 5);
                }
                handleVolumeChange(newVolume);
              }}
              onClick={e => e.stopPropagation()}
              className="flex flex-col items-center gap-0.5 p-1 rounded-lg bg-white/5 hover:bg-white/15 transition-all text-white/70 hover:text-white cursor-ns-resize w-full"
              title="Scroll to change volume"
            >
              <Volume2 className="w-4 h-4" />
              <span className="text-[9px] font-bold">{volume}%</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grid overlay shown in Edit Mode */}
      {isEditMode && (
        <div className="fixed inset-0 pointer-events-none z-20 bg-[linear-gradient(rgba(251,191,36,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(251,191,36,0.03)_1px,transparent_1px)] bg-[size:30px_30px]" />
      )}

      {/* Layout Editor Floating Options panel */}
      <AnimatePresence>
        {isEditMode && (
          <motion.div
            initial={{ y: 150, opacity: 0, x: '-50%' }}
            animate={{ y: 0, opacity: 1, x: '-50%' }}
            exit={{ y: 150, opacity: 0, x: '-50%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-20 md:bottom-6 left-1/2 w-full max-w-4xl z-[90] px-4"
          >
            <div className="backdrop-blur-3xl bg-[#121226]/95 border border-amber-500/35 rounded-3xl p-6 shadow-2xl flex flex-col md:flex-row gap-6 justify-between items-center text-white">

              {/* Sliders to Scale Components */}
              <div className="flex-1 w-full space-y-4">
                <div className="text-xs font-black text-amber-400 uppercase tracking-widest flex items-center gap-1.5 mb-1">
                  <Pencil className="w-4 h-4 animate-bounce-slow" />
                  <span>Premium Component Resizer</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Album Art Slider */}
                  <div className="space-y-1 bg-white/5 p-3 rounded-2xl border border-white/5">
                    <div className="flex justify-between text-[10px] font-bold text-white/50 uppercase">
                      <span>Album Art Size</span>
                      <span className="text-amber-400">{Math.round(albumArtScale * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="1.5"
                      step="0.05"
                      value={albumArtScale}
                      onChange={(e) => setAlbumArtScale(Number(e.target.value))}
                      className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-amber-500 focus:outline-none"
                    />
                  </div>

                  {/* Metadata Slider */}
                  <div className="space-y-1 bg-white/5 p-3 rounded-2xl border border-white/5">
                    <div className="flex justify-between text-[10px] font-bold text-white/50 uppercase">
                      <span>Metadata Size</span>
                      <span className="text-amber-400">{Math.round(metadataScale * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="1.5"
                      step="0.05"
                      value={metadataScale}
                      onChange={(e) => setMetadataScale(Number(e.target.value))}
                      className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-amber-500 focus:outline-none"
                    />
                  </div>

                  {/* Controls Slider */}
                  <div className="space-y-1 bg-white/5 p-3 rounded-2xl border border-white/5">
                    <div className="flex justify-between text-[10px] font-bold text-white/50 uppercase">
                      <span>Controls Size</span>
                      <span className="text-amber-400">{Math.round(controlsScale * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="1.5"
                      step="0.05"
                      value={controlsScale}
                      onChange={(e) => setControlsScale(Number(e.target.value))}
                      className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-amber-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>


              {/* Action Buttons */}
              <div className="w-full md:w-auto flex flex-col gap-2 shrink-0">
                <button
                  onClick={handleSaveLayout}
                  className="w-full py-2.5 px-4 bg-green-500 hover:bg-green-600 active:scale-98 transition-all text-xs font-black uppercase tracking-wider rounded-xl text-black cursor-pointer text-center"
                >
                  Save Settings
                </button>
                <button
                  onClick={handleCancelLayout}
                  className="w-full py-2.5 px-4 bg-red-500 hover:bg-red-600 active:scale-98 transition-all text-xs font-black uppercase tracking-wider rounded-xl text-white cursor-pointer text-center"
                >
                  Cancel
                </button>
                <button
                  onClick={handleResetLayout}
                  className="w-full py-2.5 px-4 bg-white/10 hover:bg-white/20 active:scale-98 transition-all text-xs font-black uppercase tracking-wider rounded-xl text-white cursor-pointer text-center"
                >
                  Reset Layout
                </button>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Themes Customizer Floating Panel */}
      <AnimatePresence>
        {showBgCustomizer && isPremium && (
          <>
            {/* Backdrop click dismisser */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowBgCustomizer(false)}
              className="fixed inset-0 bg-black/60 z-[80] backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: 150, opacity: 0, x: '-50%' }}
              animate={{ y: 0, opacity: 1, x: '-50%' }}
              exit={{ y: 150, opacity: 0, x: '-50%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed bottom-20 md:bottom-6 left-1/2 w-full max-w-xl z-[90] px-4"
            >
              <div className="backdrop-blur-3xl bg-[#121226]/95 border border-amber-500/35 rounded-3xl p-6 shadow-2xl space-y-4 text-white">
                <div className="flex justify-between items-center border-b border-white/10 pb-2">
                  <div className="text-xs font-black text-amber-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Paintbrush className="w-4 h-4" />
                    <span>Choose Theme Preset (20 Options)</span>
                  </div>
                  <button
                    onClick={() => setShowBgCustomizer(false)}
                    className="text-white/60 hover:text-white text-xs font-bold transition cursor-pointer"
                  >
                    Close
                  </button>
                </div>
                <div className="grid grid-cols-5 sm:grid-cols-10 gap-3 max-h-36 overflow-y-auto custom-scrollbar-vertical pr-1 py-1">
                  {BACKGROUND_PRESETS.map((p) => (
                    <div key={p.id} className="flex flex-col items-center gap-1">
                      <button
                        onClick={() => {
                          setActivePreset(p.id);
                          localStorage.setItem(`aurora_preset_${userId}`, p.id);
                        }}
                        className={`w-9 h-9 rounded-full border transition-all cursor-pointer relative overflow-hidden ${activePreset === p.id ? 'ring-2 ring-amber-400 scale-110 border-white shadow-lg' : 'border-white/25 hover:scale-105'
                          }`}
                        style={{
                          background: p.id === 'auto'
                            ? `radial-gradient(circle, rgba(${dominantColor}, 0.9) 0%, rgba(0,0,0,0.7) 100%)`
                            : `radial-gradient(circle, rgba(${p.colors[0]}, 0.8) 0%, rgba(${p.colors[1] || '0,0,0'}, 0.4) 60%, rgba(0,0,0,0.9) 100%)`
                        }}
                        title={p.name}
                      >
                        {p.id === 'auto' && (
                          <span className="absolute inset-0 flex items-center justify-center text-[9px] font-black text-white/90 drop-shadow select-none">AUTO</span>
                        )}
                      </button>
                      {p.id === 'auto' && (
                        <span className="text-[7px] text-amber-400 font-bold leading-none">Default</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Lyrics Style Customizer Floating Panel */}
      <AnimatePresence>
        {showLyricsCustomizer && isPremium && (
          <>
            {/* Backdrop click dismisser */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLyricsCustomizer(false)}
              className="fixed inset-0 bg-black/60 z-[80] backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: 150, opacity: 0, x: '-50%' }}
              animate={{ y: 0, opacity: 1, x: '-50%' }}
              exit={{ y: 150, opacity: 0, x: '-50%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed bottom-20 md:bottom-6 left-1/2 w-full max-w-2xl z-[90] px-4"
            >
              <div className="backdrop-blur-3xl bg-[#121226]/95 border border-amber-500/35 rounded-3xl p-6 shadow-2xl space-y-4 text-white">
                <div className="flex justify-between items-center border-b border-white/10 pb-2">
                  <div className="text-xs font-black text-amber-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Palette className="w-4 h-4" />
                    <span>Customize Lyrics style font and neon glow</span>
                  </div>
                  <button
                    onClick={() => setShowLyricsCustomizer(false)}
                    className="text-white/60 hover:text-white text-xs font-bold transition cursor-pointer"
                  >
                    Close
                  </button>
                </div>
                <div className="flex flex-wrap gap-6 items-center justify-between">
                  {/* Font Size */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest block">Font Size</label>
                    <select
                      value={lyricsFontSize}
                      onChange={(e) => {
                        setLyricsFontSize(e.target.value);
                        localStorage.setItem(`aurora_lyrics_sz_${userId}`, e.target.value);
                      }}
                      className="bg-black/60 border border-white/15 px-3 py-1.5 rounded-lg text-xs text-white font-semibold cursor-pointer focus:outline-none"
                    >
                      <option value="text-xl lg:text-2xl">Small</option>
                      <option value="text-2xl lg:text-3xl">Medium</option>
                      <option value="text-3xl lg:text-4xl">Large</option>
                      <option value="text-4xl lg:text-5xl">X-Large</option>
                    </select>
                  </div>

                  {/* Color Palette */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest block">Text Color</label>
                    <div className="flex gap-2 items-center flex-wrap">
                      {[
                        { class: 'auto', name: 'AUTO', isAuto: true },
                        { class: 'text-white', color: '#ffffff' },
                        { class: 'text-cyan-400', color: '#22d3ee' },
                        { class: 'text-purple-400', color: '#c084fc' },
                        { class: 'text-pink-400', color: '#f472b6' },
                        { class: 'text-amber-400', color: '#fbbf24' },
                        { class: 'text-emerald-400', color: '#34d399' }
                      ].map((c) => (
                        <button
                          key={c.class}
                          title={c.isAuto ? "Auto (Changes color dynamically with background theme)" : c.class}
                          onClick={() => {
                            setLyricsColor(c.class);
                            localStorage.setItem(`aurora_lyrics_clr_${userId}`, c.class);
                          }}
                          className={`transition-all cursor-pointer flex items-center justify-center ${
                            c.isAuto
                              ? `px-2.5 h-6 rounded-full border text-[9px] font-black tracking-wider ${
                                  lyricsColor === 'auto'
                                    ? 'ring-2 ring-amber-400 border-white scale-110'
                                    : 'border-white/30 hover:scale-105'
                                }`
                              : `w-6 h-6 rounded-full border ${
                                  lyricsColor === c.class
                                    ? 'scale-115 ring-2 ring-amber-400 border-white'
                                    : 'border-white/20 hover:scale-105'
                                }`
                          }`}
                          style={{
                            backgroundColor: c.isAuto
                              ? (dominantColor && dominantColor !== '0, 0, 0' ? `rgb(${dominantColor})` : '#38bdf8')
                              : c.color,
                            color: c.isAuto ? '#000000' : 'transparent'
                          }}
                        >
                          {c.isAuto ? 'AUTO' : ''}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Neon Glow Toggle */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest block">Neon Glow</label>
                    <button
                      onClick={() => {
                        const newVal = !lyricsGlow;
                        setLyricsGlow(newVal);
                        localStorage.setItem(`aurora_lyrics_glw_${userId}`, String(newVal));
                      }}
                      className={`px-4 py-1.5 rounded-lg border font-bold text-xs transition-colors cursor-pointer ${lyricsGlow ? 'bg-amber-400/20 border-amber-400 text-amber-300' : 'border-white/10 text-white/60 hover:bg-white/5'
                        }`}
                    >
                      {lyricsGlow ? 'ON' : 'OFF'}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <KeybindsModal
        isOpen={showKeybindsModal}
        onClose={() => setShowKeybindsModal(false)}
        isPremium={isPremium}
        userId={userId}
        currentKeybinds={keybinds}
        keybindsEnabled={keybindsEnabled}
        onToggleKeybindsEnabled={handleToggleKeybindsEnabled}
        onSave={handleSaveKeybinds}
        onReset={handleResetKeybinds}
      />

      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.3);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.5);
        }
        .custom-scrollbar-horizontal::-webkit-scrollbar {
          height: 6px;
        }
        .custom-scrollbar-horizontal::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar-horizontal::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.3);
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
}
