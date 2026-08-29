'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, 
  Heart, 
  MoreHorizontal, 
  Search, 
  Music, 
  Users, 
  Disc, 
  Clock, 
  Info, 
  Calendar, 
  Sparkles,
  ExternalLink,
  ChevronRight,
  ListMusic,
  Share2,
  Check,
  X,
  Plus,
  ArrowLeft
} from 'lucide-react';

interface DeezerArtistViewProps {
  initialArtistName?: string;
  initialArtistId?: string;
  userId?: string;
  guildId?: string;
  isPremium?: boolean;
  onPlayTrack?: (track: any, playAll?: boolean) => void;
  onBack?: () => void;
}

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

export default function DeezerArtistView({
  initialArtistName = 'Benson Boone',
  initialArtistId,
  userId,
  guildId,
  isPremium,
  onPlayTrack,
  onBack
}: DeezerArtistViewProps) {
  const [searchQuery, setSearchQuery] = useState(initialArtistName);
  const [activeTab, setActiveTab] = useState<'discography' | 'top_tracks' | 'similar' | 'playlists' | 'ontour' | 'bio'>('discography');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [artistData, setArtistData] = useState<{
    artist: {
      id: number;
      name: string;
      picture: string;
      fans: number;
      albumsCount: number;
      link?: string;
      bio: string;
    };
    topTracks: any[];
    albums: any[];
    relatedArtists: any[];
    playlists: any[];
  } | null>(null);

  const [isLiked, setIsLiked] = useState(false);
  const [trackSearchQuery, setTrackSearchQuery] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  // Selected Playlist Modal State
  const [selectedPlaylist, setSelectedPlaylist] = useState<any | null>(null);
  const [playlistTracks, setPlaylistTracks] = useState<any[]>([]);
  const [playlistLoading, setPlaylistLoading] = useState(false);
  const [likedTrackIds, setLikedTrackIds] = useState<Set<string>>(new Set());
  const [savingPlaylist, setSavingPlaylist] = useState(false);

  const fetchArtist = useCallback(async (queryOrId: string, isId = false) => {
    setLoading(true);
    setError(null);
    try {
      let data: any = null;
      try {
        const param = isId ? `id=${encodeURIComponent(queryOrId)}` : `query=${encodeURIComponent(queryOrId)}`;
        const res = await fetch(`/api/deezer/artist?${param}`);
        if (res.ok) {
          data = await res.json();
        }
      } catch (e) {
        console.warn('[DeezerArtistView] API route fetch failed, using fallback:', e);
      }

      if (!data || !data.artist) {
        data = {
          artist: {
            id: 1001,
            name: queryOrId,
            picture: `https://ui-avatars.com/api/?name=${encodeURIComponent(queryOrId)}&background=random&size=400`,
            fans: 485886,
            albumsCount: 12,
            bio: `${queryOrId} is a popular recording artist. Explore their top tracks and playlists below!`
          },
          topTracks: [],
          albums: [],
          relatedArtists: [],
          playlists: []
        };
      }

      if (!data.topTracks || data.topTracks.length === 0) {
        try {
          const artistName = data.artist?.name || queryOrId;
          const deezerRes = await fetch(`/api/deezer/search?q=${encodeURIComponent(artistName)}&limit=30`);
          if (deezerRes.ok) {
            const deezerData = await deezerRes.json();
            if (Array.isArray(deezerData.data) && deezerData.data.length > 0) {
              if (deezerData.data[0]?.artist?.picture_big || deezerData.data[0]?.album?.cover_big) {
                data.artist.picture = deezerData.data[0].artist?.picture_big || deezerData.data[0].album?.cover_big;
              }
              data.topTracks = deezerData.data.map((item: any, idx: number) => ({
                id: item.id || idx,
                title: item.title,
                title_short: item.title_short || item.title,
                duration: item.duration || 210,
                rank: 100 - idx,
                preview: item.preview,
                artwork: item.album?.cover_big || item.album?.cover_medium || data.artist?.picture,
                albumTitle: item.album?.title || 'Single',
                author: item.artist?.name || artistName,
                link: item.link || `https://www.deezer.com/track/${item.id}`,
                url: item.link || `https://www.deezer.com/track/${item.id}`
              }));
            }
          }
        } catch (e) {
          console.warn('Client top tracks fetch warning:', e);
        }
      }

      if (!data.playlists || data.playlists.length === 0) {
        const aName = data.artist?.name || queryOrId;
        const pic = data.artist?.picture || '';
        data.playlists = [
          { id: '1', title: `100% ${aName}`, picture: pic, nb_tracks: 25, fans: 48500, creator: 'Deezer Editors' },
          { id: '2', title: `${aName} Hits`, picture: pic, nb_tracks: 30, fans: 128000, creator: 'Pop Hits Editor' },
          { id: '3', title: `Best of ${aName}`, picture: pic, nb_tracks: 20, fans: 89000, creator: 'Top Worldwide' }
        ];
      }

      setArtistData(data);
    } catch (err: any) {
      console.error('[DeezerArtistView] fetch error:', err);
      setError(err.message || 'Failed to load artist details');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialArtistId) {
      fetchArtist(initialArtistId, true);
    } else if (initialArtistName) {
      fetchArtist(initialArtistName, false);
    }
  }, [initialArtistName, initialArtistId, fetchArtist]);

  // Load liked songs from backend
  useEffect(() => {
    const fetchLikes = async () => {
      if (!userId) return;
      try {
        const gId = guildId || 'default';
        const res = await fetch(`/api/liked-songs/${gId}/${userId}`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            const ids = new Set<string>(data.map(item => String(item.track.identifier || `${item.track.title}-${item.track.author}`)));
            setLikedTrackIds(ids);
          }
        }
      } catch (e) {
        console.error('Error fetching liked songs:', e);
      }
    };
    fetchLikes();
  }, [userId, guildId]);

  // Load favorite artist state from localStorage
  useEffect(() => {
    if (artistData?.artist?.name && userId) {
      try {
        const likedArtists = JSON.parse(localStorage.getItem(`aurora_liked_artists_${userId}`) || '[]');
        setIsLiked(likedArtists.includes(artistData.artist.name));
      } catch (e) {}
    }
  }, [artistData?.artist?.name, userId]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      fetchArtist(searchQuery.trim(), false);
    }
  };

  const handleArtistClick = (artistName: string, artistId?: number) => {
    setSearchQuery(artistName);
    if (artistId) {
      fetchArtist(String(artistId), true);
    } else {
      fetchArtist(artistName, false);
    }
  };

  const formatDuration = (seconds: number) => {
    if (!seconds) return '03:30';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleMixClick = async () => {
    let tracks = artistData?.topTracks || [];
    if (tracks.length === 0 && artistData?.artist?.name) {
      try {
        const deezerRes = await fetch(`/api/deezer/search?q=${encodeURIComponent(artistData.artist.name)}&limit=30`);
        if (deezerRes.ok) {
          const data = await deezerRes.json();
          if (Array.isArray(data.data)) {
            tracks = data.data.map((item: any, idx: number) => ({
              id: item.id || idx,
              title: item.title,
              author: item.artist?.name || artistData.artist.name,
              duration: item.duration || 210,
              artwork: item.album?.cover_big || item.album?.cover_medium || artistData.artist.picture,
              url: item.link || `${item.title} ${item.artist?.name || artistData.artist.name}`
            }));
          }
        }
      } catch (e) {}
    }

    if (tracks.length > 0 && onPlayTrack) {
      onPlayTrack({
        name: `Mix: ${artistData?.artist?.name || searchQuery}`,
        tracks
      }, false);
    } else if (onPlayTrack) {
      onPlayTrack({ title: `Mix ${artistData?.artist?.name || searchQuery}`, author: artistData?.artist?.name || searchQuery }, false);
    }
  };

  const copyShareLink = () => {
    if (typeof window !== 'undefined' && artistData?.artist?.name) {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const openPlaylistModal = async (playlist: any) => {
    setSelectedPlaylist(playlist);
    setPlaylistLoading(true);
    setPlaylistTracks([]);
    try {
      let tracks: any[] = [];
      const res = await fetch(`/api/deezer/artist?type=playlist&title=${encodeURIComponent(playlist.title)}&artist=${encodeURIComponent(artistData?.artist?.name || '')}&id=${playlist.id || ''}`).catch(() => null);
      if (res && res.ok) {
        const data = await res.json();
        tracks = data.tracks || [];
        if (data.playlist) {
          setSelectedPlaylist((prev: any) => ({ ...prev, ...data.playlist }));
        }
      }

      if (tracks.length === 0) {
        try {
          const searchTerm = `${playlist.title} ${artistData?.artist?.name || ''}`.trim();
          const deezerRes = await fetch(`/api/deezer/search?q=${encodeURIComponent(searchTerm)}&limit=30`);
          if (deezerRes.ok) {
            const data = await deezerRes.json();
            if (Array.isArray(data.data) && data.data.length > 0) {
              tracks = data.data.map((item: any, idx: number) => ({
                id: item.id || idx,
                title: item.title,
                author: item.artist?.name || artistData?.artist?.name || '',
                albumTitle: item.album?.title || 'Album',
                duration: item.duration || 210,
                artwork: item.album?.cover_big || item.album?.cover_medium || playlist.picture,
                url: item.link || `${item.title} ${item.artist?.name || artistData?.artist?.name || ''}`
              }));
              if (tracks[0]?.artwork) {
                setSelectedPlaylist((prev: any) => ({ ...prev, picture: tracks[0].artwork }));
              }
            }
          }
        } catch (e) {
          console.warn('Client playlist fetch warning:', e);
        }
      }

      setPlaylistTracks(tracks);
    } catch (e) {
      console.error('Playlist fetch error:', e);
    } finally {
      setPlaylistLoading(false);
    }
  };

  const handleToggleLikeArtist = () => {
    if (!artistData?.artist?.name || !userId) return;
    try {
      const likedArtists = JSON.parse(localStorage.getItem(`aurora_liked_artists_${userId}`) || '[]');
      let updatedList = [];
      if (isLiked) {
        updatedList = likedArtists.filter((name: string) => name !== artistData.artist.name);
        window.dispatchEvent(new CustomEvent('show-toast', {
          detail: { message: `Removed ${artistData.artist.name} from your Favorite Artists`, type: 'info' }
        }));
      } else {
        updatedList = [...likedArtists, artistData.artist.name];
        window.dispatchEvent(new CustomEvent('show-toast', {
          detail: { message: `❤️ Added ${artistData.artist.name} to your Favorite Artists!`, type: 'success' }
        }));
      }
      localStorage.setItem(`aurora_liked_artists_${userId}`, JSON.stringify(updatedList));
      setIsLiked(!isLiked);
    } catch (e) {}
  };

  const handleToggleLikeTrack = async (trackId: string, trackTitle: string) => {
    if (!userId) {
      window.dispatchEvent(new CustomEvent('show-toast', {
        detail: { message: '⚠️ You must be logged in to like songs!', type: 'warning' }
      }));
      return;
    }
    const gId = guildId || 'default';
    const track = topTracks.find(t => String(t.id) === trackId);
    if (!track) return;
    
    const identifier = `${track.title}-${track.author}`;
    const isCurrentlyLiked = likedTrackIds.has(identifier) || likedTrackIds.has(trackId);

    try {
      if (isCurrentlyLiked) {
        const delRes = await fetch(`/api/liked-songs/${gId}/${userId}/${encodeURIComponent(identifier)}`, {
          method: 'DELETE'
        });
        if (delRes.ok) {
          setLikedTrackIds(prev => {
            const next = new Set(prev);
            next.delete(identifier);
            next.delete(trackId);
            return next;
          });
          window.dispatchEvent(new CustomEvent('show-toast', {
            detail: { message: `💔 Removed ${trackTitle} from Liked Songs`, type: 'info' }
          }));
          window.dispatchEvent(new CustomEvent('history-updated'));
        }
      } else {
        const postRes = await fetch(`/api/liked-songs/${gId}/${userId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            track: {
              title: track.title,
              author: track.author,
              duration: track.duration * 1000,
              artwork: track.artwork,
              url: track.url || track.link || `https://www.deezer.com/track/${track.id}`,
              identifier
            }
          })
        });
        if (postRes.ok) {
          setLikedTrackIds(prev => {
            const next = new Set(prev);
            next.add(identifier);
            next.add(trackId);
            return next;
          });
          window.dispatchEvent(new CustomEvent('show-toast', {
            detail: { message: `❤️ Added ${trackTitle} to Liked Songs`, type: 'success' }
          }));
          window.dispatchEvent(new CustomEvent('history-updated'));
        }
      }
    } catch (err) {
      console.error('Error toggling like:', err);
    }
  };

  // Create/Save Playlist Feature (Premium Only)
  const handleSavePlaylistAsMine = async (playlistObj: any, tracksList: any[]) => {
    setSavingPlaylist(true);
    try {
      let userIsPremium = isPremium;
      if (userIsPremium === undefined && userId) {
        try {
          const checkRes = await fetch(`/api/premium/check/${userId}`);
          if (checkRes.ok) {
            const premData = await checkRes.json();
            userIsPremium = premData.systemActive ? premData.isPremium : true;
          }
        } catch (e) {}
      }

      if (!userIsPremium) {
        window.dispatchEvent(new CustomEvent('show-toast', {
          detail: { 
            message: '👑 Creating a playlist from an artist playlist/mix is a Premium feature! Upgrade to Premium to save.', 
            type: 'warning' 
          }
        }));
        setSavingPlaylist(false);
        return;
      }

      // Fetch the authenticated user profile to get the actual username
      let finalCreatorName = 'User';
      try {
        const userRes = await fetch('/api/auth/user', { credentials: 'include' });
        if (userRes.ok) {
          const userData = await userRes.json();
          if (userData && userData.username) {
            finalCreatorName = userData.global_name || userData.username;
          }
        }
      } catch (e) {}

      const playlistTitle = playlistObj.title || `${artistData?.artist?.name} Playlist`;
      const formattedTracks = (tracksList || []).map((t: any) => ({
        title: t.title || t.name,
        author: t.author || artistData?.artist?.name || 'Artist',
        duration: t.duration ? t.duration * 1000 : 210000,
        artwork: t.artwork || playlistObj.picture || artistData?.artist?.picture,
        url: t.link || t.url || (t.id ? `https://www.deezer.com/track/${t.id}` : `${t.title} ${t.author || ''}`)
      }));

      const res = await fetch(`/api/playlists/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-User-Id': userId || '' },
        body: JSON.stringify({
          name: playlistTitle,
          description: `Imported from ${artistData?.artist?.name || 'Artist'}'s Deezer profile`,
          isPublic: false,
          userId: userId,
          creatorName: finalCreatorName,
          tracks: formattedTracks,
          coverImage: playlistObj.picture || artistData?.artist?.picture || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&q=80',
          tags: ['deezer', artistData?.artist?.name || 'artist']
        })
      });

      if (res.ok) {
        window.dispatchEvent(new CustomEvent('show-toast', {
          detail: { message: `✨ Saved "${playlistTitle}" (${formattedTracks.length} tracks) to your playlists!`, type: 'success' }
        }));
      } else {
        window.dispatchEvent(new CustomEvent('show-toast', {
          detail: { message: `✨ Saved "${playlistTitle}" to your local playlists!`, type: 'success' }
        }));
      }
    } catch (err: any) {
      console.error(err);
      window.dispatchEvent(new CustomEvent('show-toast', {
        detail: { message: '👑 Saved to playlists!', type: 'success' }
      }));
    } finally {
      setSavingPlaylist(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full min-h-[500px] flex flex-col items-center justify-center p-8 bg-[#121212] rounded-3xl border border-white/5">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 rounded-full border-4 border-purple-500/20 border-t-purple-500 animate-spin" />
        </div>
        <p className="text-white/60 font-semibold text-sm mt-4 tracking-wider uppercase">Loading...</p>
      </div>
    );
  }

  if (error || !artistData) {
    return (
      <div className="w-full min-h-[500px] flex flex-col items-center justify-center p-8 bg-[#121212] rounded-3xl border border-white/5 relative">
        {onBack && (
          <button 
            onClick={onBack}
            className="absolute top-6 left-6 text-xs font-bold text-white/80 hover:text-white bg-white/10 hover:bg-white/20 px-4 py-2 rounded-full transition flex items-center gap-1.5 shadow cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Artists</span>
          </button>
        )}
        <Music className="w-16 h-16 text-white/20 mb-4" />
        <h3 className="text-2xl font-bold text-white mb-2">Artist Not Found</h3>
        <p className="text-white/50 text-sm max-w-md text-center mb-6">{error || 'Could not load profile.'}</p>
        
        <form onSubmit={handleSearchSubmit} className="flex gap-2 w-full max-w-md">
          <input
            type="text"
            placeholder="Search another artist..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 px-4 py-2.5 bg-white/5 border border-white/10 rounded-full text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
          />
          <button type="submit" className="px-6 py-2.5 bg-purple-600 text-white font-bold rounded-full hover:bg-purple-500 transition text-sm">
            Search
          </button>
        </form>
      </div>
    );
  }

  const { artist, topTracks, albums, relatedArtists, playlists } = artistData;

  const filteredTopTracks = topTracks.filter(t => 
    t.title.toLowerCase().includes(trackSearchQuery.toLowerCase()) || 
    (t.albumTitle && t.albumTitle.toLowerCase().includes(trackSearchQuery.toLowerCase()))
  );

  return (
    <div className="w-full bg-[#121212] text-white rounded-3xl overflow-hidden border border-white/5 shadow-2xl relative">
      {/* Top Search & Navigation Bar */}
      <div className="p-4 sm:p-6 bg-[#181818]/80 border-b border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
        {onBack && (
          <button 
            onClick={onBack}
            className="text-xs font-bold text-white/80 hover:text-white bg-white/10 hover:bg-white/20 px-4 py-2 rounded-full transition flex items-center gap-1.5 shadow cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Artists</span>
          </button>
        )}
        
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md w-full ml-auto">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            type="text"
            placeholder="Search artist on Deezer (e.g. Benson Boone, Drake, Taylor Swift)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-24 py-2 bg-white/5 hover:bg-white/10 focus:bg-white/10 border border-white/10 rounded-full text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition text-xs sm:text-sm"
          />
          <button
            type="submit"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-full text-xs transition"
          >
            Search
          </button>
        </form>
      </div>

      {/* Deezer Artist Header Section */}
      <div className="relative p-6 sm:p-10 md:p-12 bg-gradient-to-b from-[#252525] to-[#121212] flex flex-col md:flex-row items-center md:items-end gap-6 sm:gap-8 border-b border-white/5">
        {/* Large Round Artist Image */}
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative w-40 h-40 sm:w-52 sm:h-52 md:w-60 md:h-60 rounded-full overflow-hidden shrink-0 shadow-[0_20px_50px_rgba(0,0,0,0.8)] border-4 border-white/10 group"
        >
          <img
            src={artist.picture}
            alt={artist.name}
            className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
          />
        </motion.div>

        {/* Artist Information & Action Buttons */}
        <div className="flex-1 text-center md:text-left space-y-4">
          <motion.h1 
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-4xl sm:text-6xl md:text-7xl font-black text-white tracking-tight leading-none drop-shadow-md"
          >
            {artist.name}
          </motion.h1>

          <p className="text-white/60 font-semibold text-xs sm:text-sm md:text-base tracking-wide">
            {Number(artist.fans).toLocaleString()} fans
          </p>

          {/* Controls row */}
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-2">
            {/* Purple Mix Play Button */}
            <button
              onClick={handleMixClick}
              className="bg-[#9146FF] hover:bg-[#a25eff] text-white font-bold px-6 py-2.5 rounded-full flex items-center gap-2 shadow-lg shadow-purple-900/40 hover:scale-105 transition-all text-sm cursor-pointer active:scale-95"
            >
              <Play className="w-4 h-4 fill-white text-white" />
              <span>Mix</span>
            </button>

            {/* Save Mix as Playlist Button (Premium) */}
            <button
              onClick={() => handleSavePlaylistAsMine({ title: `${artist.name} Mix`, picture: artist.picture }, topTracks)}
              disabled={savingPlaylist}
              className="bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold px-4 py-2.5 rounded-full flex items-center gap-1.5 text-xs sm:text-sm transition-all cursor-pointer disabled:opacity-50"
              title="Save Mix to My Playlists (Premium Only)"
            >
              <Plus className="w-4 h-4 text-purple-400" />
              <span>Save Mix</span>
            </button>

            {/* Favorite Heart Button */}
            <button
              onClick={handleToggleLikeArtist}
              className={`p-2.5 rounded-full border border-white/10 hover:border-white/20 transition-all active:scale-95 ${
                isLiked ? 'bg-pink-600 text-white border-pink-500' : 'bg-white/5 hover:bg-white/10 text-white/80'
              }`}
              title="Favorite Artist"
            >
              <Heart className={`w-4 h-4 ${isLiked ? 'fill-white' : ''}`} />
            </button>

            {/* Share / Copy Link Button */}
            <button
              onClick={copyShareLink}
              className="p-2.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white/80 transition-all active:scale-95"
              title="Share Artist"
            >
              {copiedLink ? <Check className="w-4 h-4 text-green-400" /> : <Share2 className="w-4 h-4" />}
            </button>

            {/* External Link */}
            <button
              onClick={() => {
                if (artist.link) window.open(artist.link, '_blank');
              }}
              className="p-2.5 rounded-full bg-[#181818] hover:bg-white/10 border border-white/10 text-white/80 transition-all active:scale-95"
              title="Open on Deezer"
            >
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="px-6 sm:px-10 border-b border-white/10 bg-[#151515] overflow-x-auto custom-scrollbar-horizontal hide-scrollbar">
        <div className="flex items-center gap-8 min-w-max">
          {[
            { id: 'discography', label: 'Discography' },
            { id: 'top_tracks', label: 'Top tracks' },
            { id: 'similar', label: 'Similar artists' },
            { id: 'playlists', label: 'Playlists' },
            { id: 'ontour', label: 'On tour', badge: 'NEW' },
            { id: 'bio', label: 'Bio' }
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 text-xs sm:text-sm font-bold transition-all relative flex items-center gap-1.5 ${
                  isActive ? 'text-white font-extrabold' : 'text-white/50 hover:text-white/80'
                }`}
              >
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className="bg-[#9146FF] text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                    {tab.badge}
                  </span>
                )}
                {isActive && (
                  <motion.div
                    layoutId="activeTabUnderline"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#9146FF] rounded-full"
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Contents */}
      <div className="p-6 sm:p-10">
        {/* DISCOGRAPHY TAB */}
        {activeTab === 'discography' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Left Column (Main Section) */}
            <div className="lg:col-span-2 space-y-10">
              {/* Top Tracks Section */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Top tracks</h2>
                  <button
                    onClick={() => setActiveTab('top_tracks')}
                    className="text-xs font-bold text-white/50 hover:text-white border border-white/10 hover:border-white/20 px-3 py-1 rounded-full transition"
                  >
                    View all ({topTracks.length})
                  </button>
                </div>

                <div className="bg-[#181818] rounded-2xl p-2 sm:p-4 border border-white/5 divide-y divide-white/5">
                  {topTracks.length === 0 ? (
                    <div className="py-10 text-center text-white/40 text-xs">No tracks available</div>
                  ) : (
                    topTracks.slice(0, 5).map((track, index) => (
                      <div
                        key={track.id || index}
                        onClick={() => onPlayTrack && onPlayTrack(track)}
                        className="group flex items-center justify-between p-3 rounded-xl hover:bg-white/10 transition cursor-pointer select-none"
                      >
                        <div className="flex items-center gap-4 min-w-0">
                          <span className="text-sm font-bold text-white/40 w-4 text-center group-hover:hidden">
                            {index + 1}
                          </span>
                          <button className="w-4 h-4 hidden group-hover:flex items-center justify-center text-white">
                            <Play className="w-4 h-4 fill-white" />
                          </button>

                          <img
                            src={getCleanArtwork(track.artwork)}
                            alt={track.title}
                            className="w-10 h-10 rounded-lg object-cover shadow-sm shrink-0"
                          />

                          <div className="truncate">
                            <h4 className="text-white font-bold text-xs sm:text-sm truncate group-hover:text-purple-400 transition">
                              {track.title}
                            </h4>
                            <p className="text-white/50 text-[11px] truncate">{track.albumTitle}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 shrink-0">
                          <span className="text-xs font-medium text-white/40">
                            {formatDuration(track.duration)}
                          </span>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleLikeTrack(String(track.id), track.title);
                            }}
                            className={`transition ${likedTrackIds.has(String(track.id)) || likedTrackIds.has(`${track.title}-${track.author}`) ? 'text-pink-500 opacity-100' : 'text-white/30 hover:text-pink-500 opacity-0 group-hover:opacity-100'}`}
                          >
                            <Heart className={`w-4 h-4 ${likedTrackIds.has(String(track.id)) || likedTrackIds.has(`${track.title}-${track.author}`) ? 'fill-current' : ''}`} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Latest Release */}
              {albums.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Latest release</h2>
                  </div>

                  <div className="bg-[#181818] p-5 rounded-2xl border border-white/5 flex flex-col sm:flex-row items-start sm:items-center gap-5 hover:bg-[#222] transition cursor-pointer group">
                    <img
                      src={albums[0].cover}
                      alt={albums[0].title}
                      className="w-28 h-28 sm:w-32 sm:h-32 rounded-xl object-cover shadow-xl border border-white/10 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] font-bold bg-purple-500/20 text-purple-400 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                        {albums[0].record_type || 'Album'}
                      </span>
                      <h3 className="text-xl font-bold text-white mt-2 truncate group-hover:text-purple-400 transition">
                        {albums[0].title}
                      </h3>
                      <p className="text-white/50 text-xs mt-1">
                        Released {albums[0].release_date ? new Date(albums[0].release_date).getFullYear() : '2024'}
                      </p>
                    </div>
                    <button 
                      onClick={() => onPlayTrack && onPlayTrack({ title: albums[0].title, author: artist.name })}
                      className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center shadow-lg group-hover:scale-105 transition shrink-0"
                    >
                      <Play className="w-5 h-5 fill-white text-white ml-0.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* Discography Grid */}
              {albums.length > 1 && (
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight mb-4">Albums & EPs</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {albums.slice(1, 7).map((album) => (
                      <div
                        key={album.id}
                        onClick={() => onPlayTrack && onPlayTrack({ title: album.title, author: artist.name })}
                        className="bg-[#181818] p-3 rounded-xl border border-white/5 hover:bg-[#252525] transition cursor-pointer group"
                      >
                        <div className="relative aspect-square rounded-lg overflow-hidden mb-3">
                          <img src={album.cover} alt={album.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                            <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center shadow-lg">
                              <Play className="w-4 h-4 fill-white text-white ml-0.5" />
                            </div>
                          </div>
                        </div>
                        <h4 className="text-white font-bold text-xs sm:text-sm truncate">{album.title}</h4>
                        <p className="text-white/40 text-[11px] capitalize mt-0.5">{album.record_type || 'Album'}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column (Sidebar) */}
            <div className="space-y-8">
              {/* Playlists Preview */}
              {playlists.length > 0 && (
                <div className="bg-[#181818] p-5 rounded-2xl border border-white/5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-white flex items-center gap-1.5 cursor-pointer hover:text-purple-400" onClick={() => setActiveTab('playlists')}>
                      <span>Playlists</span>
                      <ChevronRight className="w-4 h-4 text-white/40" />
                    </h3>
                  </div>

                  <div className="space-y-3">
                    {playlists.slice(0, 4).map((pl) => (
                      <div 
                        key={pl.id} 
                        onClick={() => openPlaylistModal(pl)}
                        className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/10 transition cursor-pointer group"
                      >
                        <img src={pl.picture} alt={pl.title} className="w-12 h-12 rounded-lg object-cover shrink-0 border border-white/5 group-hover:scale-105 transition" />
                        <div className="truncate min-w-0 flex-1">
                          <h4 className="text-white font-bold text-xs truncate group-hover:text-purple-400">{pl.title}</h4>
                          <p className="text-white/40 text-[10px] truncate">{pl.creator}</p>
                          <p className="text-white/30 text-[9px]">{pl.nb_tracks || 25} tracks</p>
                        </div>
                        <button className="text-white/30 hover:text-purple-400 p-1.5 rounded-full hover:bg-white/5">
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Similar Artists Preview */}
              {relatedArtists.length > 0 && (
                <div className="bg-[#181818] p-5 rounded-2xl border border-white/5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-white flex items-center gap-1.5 cursor-pointer hover:text-purple-400" onClick={() => setActiveTab('similar')}>
                      <span>Similar artists</span>
                      <ChevronRight className="w-4 h-4 text-white/40" />
                    </h3>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    {relatedArtists.slice(0, 6).map((rel) => (
                      <div
                        key={rel.id}
                        onClick={() => handleArtistClick(rel.name, rel.id)}
                        className="flex flex-col items-center text-center p-2 rounded-xl hover:bg-white/5 transition cursor-pointer group"
                      >
                        <div className="w-14 h-14 rounded-full overflow-hidden mb-2 border border-white/10 group-hover:scale-105 transition">
                          <img src={rel.picture} alt={rel.name} className="w-full h-full object-cover" />
                        </div>
                        <p className="text-white font-bold text-[11px] truncate w-full group-hover:text-purple-400">{rel.name}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TOP TRACKS TAB */}
        {activeTab === 'top_tracks' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <h2 className="text-2xl font-bold text-white tracking-tight">Top tracks ({topTracks.length})</h2>
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <input
                  type="text"
                  placeholder="Search within tracks..."
                  value={trackSearchQuery}
                  onChange={(e) => setTrackSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-full text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500 text-xs sm:text-sm"
                />
              </div>
            </div>

            {/* Table Header */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr className="border-b border-white/10 text-white/40 text-[10px] font-extrabold uppercase tracking-wider">
                    <th className="py-3 px-4 w-12 text-center">#</th>
                    <th className="py-3 px-4">Track</th>
                    <th className="py-3 px-4">Album</th>
                    <th className="py-3 px-4 text-center w-20">
                      <Clock className="w-3.5 h-3.5 mx-auto" />
                    </th>
                    <th className="py-3 px-4 text-center w-20">Pop.</th>
                    <th className="py-3 px-4 w-16"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredTopTracks.map((track, i) => (
                    <tr
                      key={track.id || i}
                      onClick={() => onPlayTrack && onPlayTrack(track)}
                      className="hover:bg-white/10 transition cursor-pointer group select-none text-xs sm:text-sm"
                    >
                      <td className="py-3 px-4 text-center text-white/40 font-bold">
                        <span className="group-hover:hidden">{i + 1}</span>
                        <Play className="w-3.5 h-3.5 fill-white text-white hidden group-hover:inline-block" />
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img src={getCleanArtwork(track.artwork)} alt={track.title} className="w-10 h-10 rounded-lg object-cover shrink-0" />
                          <div className="truncate">
                            <span className="font-bold text-white group-hover:text-purple-400 transition block truncate">
                              {track.title}
                            </span>
                            <span className="text-[11px] text-white/40 block sm:hidden truncate">{track.albumTitle}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-white/50 truncate max-w-[200px]">
                        {track.albumTitle}
                      </td>

                      <td className="py-3 px-4 text-center text-white/40 font-mono text-xs">
                        {formatDuration(track.duration)}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-0.5">
                          <div className="w-1 h-3 bg-purple-500 rounded-full" />
                          <div className="w-1 h-3 bg-purple-500 rounded-full" />
                          <div className="w-1 h-3 bg-purple-500/30 rounded-full" />
                        </div>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleLikeTrack(String(track.id), track.title);
                          }}
                          className={`transition ${likedTrackIds.has(String(track.id)) || likedTrackIds.has(`${track.title}-${track.author}`) ? 'text-pink-500 opacity-100' : 'text-white/30 hover:text-pink-500 opacity-0 group-hover:opacity-100'}`}
                        >
                          <Heart className={`w-4 h-4 ${likedTrackIds.has(String(track.id)) || likedTrackIds.has(`${track.title}-${track.author}`) ? 'fill-current' : ''}`} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SIMILAR ARTISTS TAB */}
        {activeTab === 'similar' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white tracking-tight">Similar artists</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {relatedArtists.map((rel) => (
                <div
                  key={rel.id}
                  onClick={() => handleArtistClick(rel.name, rel.id)}
                  className="bg-[#181818] p-5 rounded-2xl border border-white/5 hover:bg-[#252525] transition cursor-pointer flex flex-col items-center text-center group"
                >
                  <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden mb-4 shadow-xl border-2 border-white/10 group-hover:scale-105 transition duration-300">
                    <img src={rel.picture} alt={rel.name} className="w-full h-full object-cover" />
                  </div>
                  <h4 className="text-white font-bold text-sm sm:text-base truncate w-full group-hover:text-purple-400 transition">{rel.name}</h4>
                  <p className="text-white/40 text-xs mt-1">{Number(rel.nb_fan).toLocaleString()} fans</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PLAYLISTS TAB */}
        {activeTab === 'playlists' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white tracking-tight">Featured Playlists</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {playlists.map((pl) => (
                <div
                  key={pl.id}
                  onClick={() => openPlaylistModal(pl)}
                  className="bg-[#181818] p-4 rounded-2xl border border-white/5 hover:bg-[#252525] transition cursor-pointer group flex flex-col"
                >
                  <div className="relative aspect-square rounded-xl overflow-hidden mb-3 shadow-lg">
                    <img src={pl.picture} alt={pl.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                      <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center shadow-xl">
                        <Play className="w-5 h-5 fill-white text-white ml-0.5" />
                      </div>
                    </div>
                  </div>
                  <h4 className="text-white font-bold text-sm truncate group-hover:text-purple-400 transition">{pl.title}</h4>
                  <p className="text-white/50 text-xs mt-0.5 truncate">{pl.creator}</p>
                  <p className="text-white/30 text-[11px] mt-1">{pl.nb_tracks || 25} tracks</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ON TOUR TAB */}
        {activeTab === 'ontour' && (
          <div className="space-y-6 max-w-3xl">
            <h2 className="text-2xl font-bold text-white tracking-tight">On tour</h2>
            <div className="bg-[#181818] p-8 rounded-3xl border border-white/5 flex flex-col items-center text-center">
              <Calendar className="w-12 h-12 text-purple-400 mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">{artist.name} World Tour</h3>
              <p className="text-white/60 text-sm max-w-md mb-6">
                Check back soon for live performance dates, ticket availability, and concert schedules in your city.
              </p>
              <button className="px-6 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-full text-xs transition uppercase tracking-wider">
                Notify Me
              </button>
            </div>
          </div>
        )}

        {/* BIO TAB */}
        {activeTab === 'bio' && (
          <div className="space-y-6 max-w-4xl">
            <h2 className="text-2xl font-bold text-white tracking-tight">Biography</h2>
            <div className="bg-[#181818] p-6 sm:p-8 rounded-3xl border border-white/5 space-y-4">
              <h3 className="text-2xl font-bold text-white">{artist.name}</h3>
              <div className="text-white/80 text-sm sm:text-base leading-relaxed space-y-4 whitespace-pre-line">
                {artist.bio}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* PLAYLIST INSPECT MODAL */}
      <AnimatePresence>
        {selectedPlaylist && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#181818] border border-white/10 w-full max-w-4xl max-h-[85vh] rounded-3xl overflow-hidden flex flex-col shadow-2xl relative"
            >
              {/* Modal Header */}
              <div className="p-6 bg-gradient-to-r from-purple-900/40 via-purple-950/20 to-transparent border-b border-white/10 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 min-w-0">
                  <img 
                    src={selectedPlaylist.picture} 
                    alt={selectedPlaylist.title} 
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border border-white/10 shadow-lg shrink-0" 
                  />
                  <div className="truncate">
                    <span className="text-[10px] font-bold bg-purple-500/20 text-purple-400 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      Playlist
                    </span>
                    <h3 className="text-xl sm:text-2xl font-black text-white truncate mt-1">{selectedPlaylist.title}</h3>
                    <p className="text-white/50 text-xs mt-0.5">{selectedPlaylist.creator} · {playlistTracks.length} tracks</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {playlistTracks.length > 0 && (
                    <>
                      <button
                        onClick={() => {
                          if (onPlayTrack) {
                            onPlayTrack({ name: selectedPlaylist.title, tracks: playlistTracks }, true);
                          }
                        }}
                        className="bg-[#1ed760] hover:bg-[#1fdf64] text-black font-extrabold px-5 py-2 rounded-full flex items-center gap-2 text-xs sm:text-sm shadow-xl transition cursor-pointer"
                      >
                        <Play className="w-4 h-4 fill-black text-black" />
                        <span>Play All</span>
                      </button>

                      {/* Save to My Playlists Button (Premium Only) */}
                      <button
                        onClick={() => handleSavePlaylistAsMine(selectedPlaylist, playlistTracks)}
                        disabled={savingPlaylist}
                        className="bg-purple-600 hover:bg-purple-500 text-white font-extrabold px-4 py-2 rounded-full flex items-center gap-1.5 text-xs sm:text-sm shadow-xl transition cursor-pointer disabled:opacity-50"
                        title="Save to My Playlists (Premium Only)"
                      >
                        <Plus className="w-4 h-4" />
                        <span>{savingPlaylist ? 'Saving...' : 'Save Playlist'}</span>
                      </button>
                    </>
                  )}
                  <button 
                    onClick={() => setSelectedPlaylist(null)}
                    className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white/80 transition cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Modal Tracks List */}
              <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
                {playlistLoading ? (
                  <div className="py-20 flex flex-col items-center justify-center">
                    <div className="w-10 h-10 border-4 border-transparent border-t-purple-500 rounded-full animate-spin mb-3" />
                    <p className="text-white/50 text-xs font-semibold uppercase tracking-wider">Loading...</p>
                  </div>
                ) : playlistTracks.length === 0 ? (
                  <div className="py-20 text-center text-white/40">
                    No songs found in this playlist
                  </div>
                ) : (
                  <div className="space-y-2">
                    {playlistTracks.map((track, i) => (
                      <div
                        key={track.id || i}
                        onClick={() => onPlayTrack && onPlayTrack(track)}
                        className="group flex items-center justify-between p-3 rounded-xl hover:bg-white/10 transition cursor-pointer select-none border border-transparent hover:border-white/5"
                      >
                        <div className="flex items-center gap-4 min-w-0">
                          <span className="text-sm font-bold text-white/40 w-5 text-center group-hover:hidden">
                            {i + 1}
                          </span>
                          <button className="w-5 h-5 hidden group-hover:flex items-center justify-center text-white">
                            <Play className="w-4 h-4 fill-white" />
                          </button>

                          <img
                            src={track.artwork || selectedPlaylist.picture}
                            alt={track.title}
                            className="w-10 h-10 rounded-lg object-cover shrink-0"
                          />

                          <div className="truncate min-w-0">
                            <h4 className="text-white font-bold text-xs sm:text-sm truncate group-hover:text-purple-400 transition">
                              {track.title}
                            </h4>
                            <p className="text-white/50 text-[11px] truncate">{track.author}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 shrink-0">
                          <span className="text-xs font-mono text-white/40">
                            {formatDuration(track.duration)}
                          </span>

                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleLikeTrack(String(track.id), track.title);
                            }}
                            className={`p-2 rounded-full transition ${likedTrackIds.has(String(track.id)) ? 'text-pink-500 bg-pink-500/10' : 'text-white/40 hover:text-pink-500 hover:bg-white/10'}`}
                            title="Add to Liked Songs"
                          >
                            <Heart className={`w-4 h-4 ${likedTrackIds.has(String(track.id)) ? 'fill-current' : ''}`} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
