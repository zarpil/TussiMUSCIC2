'use client';

import { useState, useEffect } from 'react';
import { Play, Plus, Lock, Globe, Trash2, X, Music, Search, Heart, MessageSquare, Tag, CornerDownRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const getAvatarUrl = (user: any) => {
  if (!user) return 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&q=80';
  if (user.avatar) {
    if (user.avatar.startsWith('http')) return user.avatar;
    return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`;
  }
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username || 'User')}&background=random`;
};

const isEmbedded = typeof window !== 'undefined' && window.self !== window.top;
const apiUrl = '';
const socketUrl = apiUrl;

const DiscordAvatar = ({ userId, defaultAvatarUrl, username, className }: { userId: string, defaultAvatarUrl: string | null, username: string, className: string }) => {
  const [avatarUrl, setAvatarUrl] = useState(defaultAvatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=random`);

  useEffect(() => {
    if (!defaultAvatarUrl && userId) {
      fetch(`${apiUrl}/api/users/${userId}/avatar`)
        .then(res => res.json())
        .then(data => {
          if (data.avatar) setAvatarUrl(data.avatar);
        })
        .catch(() => {});
    }
  }, [userId, defaultAvatarUrl, username]);

  return <img src={avatarUrl} className={className} alt={username} />;
};

export default function PlaylistsView({ guildId, userId, isPremium, premiumSystemActive }: { guildId: string, userId: string, isPremium: boolean, premiumSystemActive: boolean }) {
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'public' | 'mine'>('public');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [newPlaylistDesc, setNewPlaylistDesc] = useState('');
  const [importUrl, setImportUrl] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  
  const [selectedPlaylist, setSelectedPlaylist] = useState<any>(null);
  const [addLinkUrl, setAddLinkUrl] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const [newTags, setNewTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  
  const [commentText, setCommentText] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  useEffect(() => {
    // Get user info
    fetch('/api/auth/user', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.id) setUser(data);
      });
  }, []);

  const fetchPlaylists = async () => {
    setLoading(true);
    try {
      const url = activeTab === 'public' 
        ? `${apiUrl}/api/playlists/public`
        : `${apiUrl}/api/playlists/user/${userId}`;
        
      const res = await fetch(url);
      const data = await res.json();
      setPlaylists(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) fetchPlaylists();
  }, [activeTab, userId]);

  useEffect(() => {
    if ((window as any).pendingPlaylistToOpen) {
      setSelectedPlaylist((window as any).pendingPlaylistToOpen);
      (window as any).pendingPlaylistToOpen = null;
    }

    const handleOpenPlaylist = (e: any) => {
      if (e.detail && e.detail.playlist) {
        setSelectedPlaylist(e.detail.playlist);
      }
    };
    window.addEventListener('open-playlist', handleOpenPlaylist);
    return () => window.removeEventListener('open-playlist', handleOpenPlaylist);
  }, []);

  const handleCreatePlaylist = async () => {
    try {
      const checkRes = await fetch(`${socketUrl}/api/premium/check/${userId}`);
      if (checkRes.ok) {
        const premData = await checkRes.json();
        if (premData.systemActive && !premData.isPremium) {
          window.dispatchEvent(new CustomEvent('show-toast', {
            detail: { message: '🔒 Playlist creation is a Premium-only feature!', type: 'warning' }
          }));
          return;
        }
      }
    } catch (e) {
      console.error('Premium check error:', e);
    }

    try {
      let importedTracks: any[] = [];
      
      if (importUrl) {
        window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: 'Loading imported media...', type: 'success' } }));
        const searchRes = await fetch(`${apiUrl}/api/search?query=${encodeURIComponent(importUrl)}&limit=all`, {
          headers: { 'X-User-Id': userId }
        });
        const searchData = await searchRes.json();
        importedTracks = searchData.tracks || [];
      }

      const res = await fetch(`${apiUrl}/api/playlists/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-User-Id': userId },
        body: JSON.stringify({
          name: newPlaylistName,
          description: newPlaylistDesc,
          isPublic,
          userId,
          creatorName: user?.username || 'Unknown',
          creatorAvatar: getAvatarUrl(user),
          tracks: importedTracks,
          coverImage: importedTracks[0]?.artwork || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&q=80',
          tags: newTags
        })
      });
      if (res.ok) {
        setShowCreateModal(false);
        setNewPlaylistName('');
        setNewPlaylistDesc('');
        setImportUrl('');
        setIsPublic(false);
        setNewTags([]);
        setTagInput('');
        fetchPlaylists();
        
        window.dispatchEvent(new CustomEvent('show-toast', {
          detail: { message: 'Playlist created!', type: 'success' }
        }));
      }
    } catch (error) {
      console.error('Failed to create playlist', error);
    }
  };

  const deletePlaylist = async (id: string) => {
    if (!confirm('Are you sure you want to delete this playlist?')) return;
    try {
      const res = await fetch(`${apiUrl}/api/playlists/${id}`, {
        method: 'DELETE',
        headers: { 'X-User-Id': userId }
      });
      if (res.ok) {
        fetchPlaylists();
        window.dispatchEvent(new CustomEvent('show-toast', {
          detail: { message: 'Playlist deleted', type: 'success' }
        }));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const playPlaylist = async (playlist: any) => {
    if (!playlist.tracks || playlist.tracks.length === 0) {
      window.dispatchEvent(new CustomEvent('show-toast', {
        detail: { message: 'Playlist is empty', type: 'warning' }
      }));
      return;
    }
    const currentPlayId = Date.now();
    (window as any).playlistPlayId = currentPlayId;

    const abortController = new AbortController();
    const stopListener = () => {
      (window as any).playlistPlayId = null;
      abortController.abort();
    };
    window.addEventListener('playback-stopped', stopListener);

    try {
      let hasError = false;
      for (let i = 0; i < playlist.tracks.length; i++) {
        if ((window as any).playlistPlayId !== currentPlayId) {
          window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: 'Playlist loading stopped', type: 'warning' } }));
          break;
        }

        const query = playlist.tracks[i].url || `${playlist.tracks[i].title} ${playlist.tracks[i].author}`;
        const response = await fetch(`${apiUrl}/api/play`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-User-Id': userId },
          body: JSON.stringify({
            guildId,
            userId,
            query,
            isBatch: true,
            batchTotal: playlist.tracks.length,
            batchIndex: i
          }),
          signal: abortController.signal
        });
        
        if (i === 0) {
          const data = await response.json();
          if (response.status === 403 && data.requiresWebLink) {
            window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: '⚠️ Please run /web-link command in Discord first to set a notification channel!', type: 'error' } }));
            break;
          }
          if (!data.success) {
            hasError = true;
          }
        }
      }
      if (!hasError && (window as any).playlistPlayId === currentPlayId) {
        window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: `✅ Playing ${playlist.name}`, type: 'success' } }));
      }
    } catch (e: any) {
      if (e.name === 'AbortError') return;
      console.error(e);
      window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: 'Network error while playing', type: 'error' } }));
    } finally {
      window.removeEventListener('playback-stopped', stopListener);
    }
  };

  const playSingleTrack = async (track: any) => {
    try {
      const query = track.url || `${track.title} ${track.author}`;
      const response = await fetch(`${apiUrl}/api/play`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-User-Id': userId },
        body: JSON.stringify({ guildId, userId, query })
      });
      const data = await response.json();
      if (response.status === 403 && data.requiresWebLink) {
        window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: '⚠️ Please run /web-link command in Discord first to set a notification channel!', type: 'error' } }));
        return;
      }
      if (data.success) {
        window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: `✅ Playing ${track.title}`, type: 'success' } }));
      } else {
        window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: data.error || 'Failed to play', type: 'error' } }));
      }
    } catch (e) {
      console.error(e);
      window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: 'Network error while playing', type: 'error' } }));
    }
  };

  const togglePrivacy = async (playlist: any) => {
    try {
      const targetId = playlist.id || playlist._id;
      const res = await fetch(`${apiUrl}/api/playlists/${targetId}/privacy`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'X-User-Id': userId },
        body: JSON.stringify({ isPublic: !playlist.isPublic })
      });
      const data = await res.json();
      if (data.success) {
        setSelectedPlaylist(data.playlist);
        fetchPlaylists();
        window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: `Visibility changed to ${data.playlist.isPublic ? 'Public 🌐' : 'Private 🔒'}`, type: 'success' }}));
      } else {
        window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: data.error || 'Failed to change visibility', type: 'error' }}));
      }
    } catch (e) {
      console.error(e);
      window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: 'Network error updating privacy', type: 'error' }}));
    }
  };

  const handleAddLink = async () => {
    if (!addLinkUrl.trim()) return;
    setIsAdding(true);
    try {
      const searchRes = await fetch(`${apiUrl}/api/search?query=${encodeURIComponent(addLinkUrl)}&limit=all`, {
        headers: { 'X-User-Id': userId }
      });
      const searchData = await searchRes.json();
      const tracksToAdd = searchData.tracks || [];
      
      if (tracksToAdd.length === 0) {
        window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: `No tracks found in link`, type: 'error' } }));
        setIsAdding(false);
        return;
      }

      for (const track of tracksToAdd) {
        await fetch(`${apiUrl}/api/playlists/${selectedPlaylist.id}/tracks`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-User-Id': userId },
          body: JSON.stringify({ track })
        });
      }

      // Refresh playlist details
      const plRes = await fetch(`${apiUrl}/api/playlists/${selectedPlaylist.id}`);
      const updatedPl = await plRes.json();
      setSelectedPlaylist(updatedPl);
      setAddLinkUrl('');
      window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: `Added tracks!`, type: 'success' } }));
      fetchPlaylists();
    } catch (e) {
      console.error(e);
    } finally {
      setIsAdding(false);
    }
  };

  const removeTrack = async (index: number) => {
    try {
      const targetId = selectedPlaylist.id || selectedPlaylist._id;
      const res = await fetch(`${apiUrl}/api/playlists/${targetId}/tracks/${index}`, {
        method: 'DELETE',
        headers: { 'X-User-Id': userId }
      });
      const data = await res.json();
      if (data.success) {
        setSelectedPlaylist(data.playlist);
        fetchPlaylists();
        window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: 'Track removed from playlist', type: 'success' }}));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const toggleLike = async () => {
    try {
      const targetId = selectedPlaylist.id || selectedPlaylist._id;
      const res = await fetch(`${apiUrl}/api/playlists/${targetId}/like`, {
        method: 'POST',
        headers: { 'X-User-Id': userId }
      });
      const data = await res.json();
      if (data.success) {
        setSelectedPlaylist({ ...selectedPlaylist, likes: data.likes });
        fetchPlaylists();
      }
    } catch (e) {}
  };

  const postComment = async () => {
    if (!commentText.trim()) return;
    try {
      const targetId = selectedPlaylist.id || selectedPlaylist._id;
      const res = await fetch(`${apiUrl}/api/playlists/${targetId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-User-Id': userId },
        body: JSON.stringify({ 
          text: commentText, 
          username: user?.username || 'Unknown',
          avatar: getAvatarUrl(user)
        })
      });
      const data = await res.json();
      if (data.success) {
        const updated = { ...selectedPlaylist };
        updated.comments = updated.comments || [];
        updated.comments.push(data.comment);
        setSelectedPlaylist(updated);
        setCommentText('');
        fetchPlaylists();
      }
    } catch (e) {}
  };

  const deleteComment = async (commentId: string) => {
    if (!confirm('Delete comment?')) return;
    try {
      const targetId = selectedPlaylist.id || selectedPlaylist._id;
      const res = await fetch(`${apiUrl}/api/playlists/${targetId}/comments/${commentId}`, {
        method: 'DELETE',
        headers: { 'X-User-Id': userId }
      });
      if (res.ok) {
        const updated = { ...selectedPlaylist };
        updated.comments = updated.comments.filter((c: any) => c.id !== commentId);
        setSelectedPlaylist(updated);
        fetchPlaylists();
      }
    } catch (e) {}
  };

  const postReply = async (commentId: string) => {
    if (!replyText.trim()) return;
    try {
      const targetId = selectedPlaylist.id || selectedPlaylist._id;
      const res = await fetch(`${apiUrl}/api/playlists/${targetId}/comments/${commentId}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-User-Id': userId },
        body: JSON.stringify({ 
          text: replyText, 
          username: user?.username || 'Unknown',
          avatar: getAvatarUrl(user)
        })
      });
      const data = await res.json();
      if (data.success) {
        const updated = { ...selectedPlaylist };
        const c = updated.comments.find((c: any) => c.id === commentId);
        if (c) {
          c.replies = c.replies || [];
          c.replies.push(data.reply);
        }
        setSelectedPlaylist(updated);
        setReplyText('');
        setReplyTo(null);
        fetchPlaylists();
      }
    } catch (e) {}
  };

  const deleteReply = async (commentId: string, replyId: string) => {
    if (!confirm('Delete reply?')) return;
    try {
      const targetId = selectedPlaylist.id || selectedPlaylist._id;
      const res = await fetch(`${apiUrl}/api/playlists/${targetId}/comments/${commentId}/reply/${replyId}`, {
        method: 'DELETE',
        headers: { 'X-User-Id': userId }
      });
      if (res.ok) {
        const updated = { ...selectedPlaylist };
        const c = updated.comments.find((c: any) => c.id === commentId);
        if (c) {
          c.replies = c.replies.filter((r: any) => r.id !== replyId);
        }
        setSelectedPlaylist(updated);
        fetchPlaylists();
      }
    } catch (e) {}
  };

  const toggleCommentLike = async (commentId: string) => {
    try {
      const targetId = selectedPlaylist.id || selectedPlaylist._id;
      const res = await fetch(`${apiUrl}/api/playlists/${targetId}/comments/${commentId}/like`, {
        method: 'POST',
        headers: { 'X-User-Id': userId }
      });
      const data = await res.json();
      if (data.success) {
        const updated = { ...selectedPlaylist };
        const c = updated.comments.find((c: any) => c.id === commentId);
        if (c) {
          c.likes = data.likes;
        }
        setSelectedPlaylist(updated);
        fetchPlaylists();
      }
    } catch (e) {}
  };

  return (
    <>
      {/* Absolute Full Screen Solid Blackout */}
      <div className="fixed inset-0 bg-[#080808] -z-10 pointer-events-none" />
      
      <div className="flex-1 w-full h-full bg-[#0a0a0a] rounded-[40px] border border-white/5 shadow-2xl relative flex flex-col overflow-hidden">
        <div className="w-full max-w-7xl mx-auto flex flex-col h-full overflow-y-auto custom-scrollbar-vertical p-6 md:p-10 pb-48 md:pb-64">
          {!selectedPlaylist && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8 w-full">
          <h2 className="text-3xl font-bold text-white drop-shadow-md">Listas de Reproducción</h2>
          
          <div className="w-full sm:flex-1 sm:max-w-md mx-0 sm:mx-4 relative">
             <input
               type="text"
               value={searchQuery}
               onChange={e => setSearchQuery(e.target.value)}
               placeholder="Buscar por nombre o creador..."
               className="w-full pl-10 pr-4 py-2.5 bg-black/40 border border-white/10 rounded-full text-white placeholder-white/40 focus:outline-none focus:border-white/30 focus:ring-1 focus:ring-white/30 transition-all text-sm"
             />
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            <div className="relative flex w-full sm:w-auto bg-black/40 backdrop-blur-xl p-1.5 rounded-full border border-white/10 shadow-inner">
              <button
                onClick={() => setActiveTab('public')}
                className={`relative px-6 py-2 rounded-full font-bold text-sm transition-colors z-10 ${
                  activeTab === 'public' ? 'text-white' : 'text-white/50 hover:text-white/80'
                }`}
              >
                {activeTab === 'public' && (
                  <motion.div
                    layoutId="playlistTabBubble"
                    className="absolute inset-0 bg-black/40 rounded-full border border-white/20 backdrop-blur-md"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <span className="relative z-20 flex items-center gap-2">
                  <Globe className="w-4 h-4" /> Públicas
                </span>
              </button>
              <button
                onClick={() => setActiveTab('mine')}
                className={`relative px-6 py-2 rounded-full font-bold text-sm transition-colors z-10 ${
                  activeTab === 'mine' ? 'text-white' : 'text-white/50 hover:text-white/80'
                }`}
              >
                {activeTab === 'mine' && (
                  <motion.div
                    layoutId="playlistTabBubble"
                    className="absolute inset-0 bg-black/40 rounded-full border border-white/20 backdrop-blur-md"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <span className="relative z-20 flex items-center gap-2">
                  <Music className="w-4 h-4" /> Tus Listas
                </span>
              </button>
            </div>
            <button
              onClick={() => {
                if (premiumSystemActive && !isPremium) {
                  window.dispatchEvent(new CustomEvent('show-toast', {
                    detail: { message: '🔒 ¡La creación de listas es una función exclusiva de Premium!', type: 'warning' }
                  }));
                  return;
                }
                setShowCreateModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-xl font-bold hover:scale-105 transition-all shadow-lg cursor-pointer"
            >
              <Plus className="w-5 h-5" /> Crear
            </button>
          </div>
        </div>
      )}

      {selectedPlaylist ? (
        <div className="flex flex-col h-full animate-fade-in relative z-20">
          <div className="flex flex-col md:flex-row gap-8 items-start">
            <div className="w-full md:w-64 flex-shrink-0 relative group rounded-2xl overflow-hidden shadow-2xl bg-black/50">
              <img 
                src={(!selectedPlaylist.coverImage || selectedPlaylist.coverImage.includes('via.placeholder.com')) && selectedPlaylist.tracks?.length > 0 
                  ? selectedPlaylist.tracks[0].artwork 
                  : (selectedPlaylist.coverImage || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&q=80')} 
                onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&q=80'; }}
                alt="Cover" 
                className="w-full aspect-square object-cover" 
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all backdrop-blur-sm">
                <button onClick={() => playPlaylist(selectedPlaylist)} className="w-16 h-16 bg-purple-500 hover:scale-110 shadow-2xl transition-all rounded-full flex items-center justify-center">
                  <Play className="w-8 h-8 text-white ml-2" fill="white" />
                </button>
              </div>
            </div>
            <div className="flex-1 w-full">
              <button onClick={() => setSelectedPlaylist(null)} className="text-white/50 hover:text-white mb-2 flex items-center gap-1 transition-colors cursor-pointer">
                ← Volver
              </button>
              <h2 className="text-4xl md:text-5xl font-black text-white drop-shadow-xl mb-4">{selectedPlaylist.name}</h2>
              <p className="text-white/70 text-lg mb-6">{selectedPlaylist.description || 'Sin descripción.'}</p>
              
              {selectedPlaylist.tags && selectedPlaylist.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {selectedPlaylist.tags.map((tag: string) => (
                    <span key={tag} className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-sm font-medium flex items-center gap-1"><Tag className="w-3 h-3" /> {tag}</span>
                  ))}
                </div>
              )}
              
              <div className="flex items-center gap-4 border-b border-white/10 pb-6 mb-6">
                <button onClick={() => playPlaylist(selectedPlaylist)} className="px-6 py-2.5 bg-white text-black font-bold rounded-xl hover:scale-105 transition-all shadow-xl flex items-center gap-2 cursor-pointer">
                  <Play className="w-4 h-4" fill="black" /> Reproducir Todo
                </button>
                <button onClick={toggleLike} className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 border cursor-pointer ${selectedPlaylist.likes?.includes(userId) ? 'bg-purple-500/20 border-purple-500/50 text-purple-400' : 'bg-white/5 border-white/10 text-white hover:bg-white/10'}`}>
                  <Heart className="w-4 h-4" fill={selectedPlaylist.likes?.includes(userId) ? 'currentColor' : 'none'} />
                  {selectedPlaylist.likes?.length || 0}
                </button>
                <button
                  onClick={() => document.getElementById('comments-section')?.scrollIntoView({ behavior: 'smooth' })}
                  className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4" />
                  {selectedPlaylist.comments?.length || 0}
                </button>
                {selectedPlaylist.userId === userId && (
                  <button onClick={() => togglePrivacy(selectedPlaylist)} className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all flex items-center gap-2 border border-white/10 cursor-pointer">
                    {selectedPlaylist.isPublic ? <Globe className="w-4 h-4 text-purple-400" /> : <Lock className="w-4 h-4" />}
                    {selectedPlaylist.isPublic ? 'Pública' : 'Privada'}
                  </button>
                )}
                <div className="flex items-center gap-3 ml-auto">
                  <DiscordAvatar 
                    userId={selectedPlaylist.userId} 
                    defaultAvatarUrl={selectedPlaylist.creatorAvatar} 
                    username={selectedPlaylist.creatorName} 
                    className="w-8 h-8 md:w-10 md:h-10 rounded-full shadow-lg" 
                  />
                  <div className="flex flex-col">
                     <span className="text-white/40 text-[10px] uppercase tracking-wider font-bold">Creado por</span>
                     <span className="text-white font-semibold text-sm md:text-base">{selectedPlaylist.creatorName}</span>
                  </div>
                </div>
              </div>
              
              {/* Import/Add Box */}
              {selectedPlaylist.userId === userId && (
                <div className="flex items-center gap-3 mb-6 bg-white/5 p-2 rounded-xl backdrop-blur-sm border border-white/10">
                  <input
                    type="text"
                    value={addLinkUrl}
                    onChange={e => setAddLinkUrl(e.target.value)}
                    placeholder="Importar URL (Spotify/YouTube/Deezer) o buscar canción..."
                    className="flex-1 bg-transparent px-4 py-2 text-white outline-none placeholder-white/40"
                  />
                  <button onClick={handleAddLink} disabled={isAdding} className="px-4 py-2 bg-purple-500 rounded-lg text-white font-bold hover:bg-purple-600 disabled:opacity-50 cursor-pointer">
                    {isAdding ? 'Añadiendo...' : 'Añadir'}
                  </button>
                </div>
              )}

              {/* Track List */}
              <div className="flex flex-col gap-2">
                {selectedPlaylist.tracks && selectedPlaylist.tracks.length > 0 ? (
                  selectedPlaylist.tracks.map((track: any, idx: number) => (
                    <div key={idx} className="group flex items-center gap-4 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl p-3 transition-colors cursor-pointer" onClick={() => playSingleTrack(track)}>
                      <span className="w-6 text-center text-white/40 font-mono text-sm">{idx + 1}</span>
                      <img src={track.artwork || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&q=80'} onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&q=80'; }} className="w-12 h-12 rounded-lg object-cover bg-black/40 shadow-md" />
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-bold text-base truncate drop-shadow-sm">{track.title}</p>
                        <p className="text-white/60 text-sm truncate">{track.author}</p>
                      </div>
                      
                      {selectedPlaylist.userId === userId && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); removeTrack(idx); }}
                          className="p-2 opacity-0 group-hover:opacity-100 hover:bg-red-500/20 text-red-400 rounded-lg transition-all cursor-pointer"
                          title="Eliminar Canción"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-10 text-white/50">Esta lista de reproducción está vacía.</div>
                )}
              </div>

              {/* Comments Section */}
              <div className="mt-12" id="comments-section">
                <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2"><MessageSquare className="w-6 h-6" /> Comentarios <span className="text-white/40 text-lg font-normal">({selectedPlaylist.comments?.length || 0})</span></h3>
                
                <div className="flex gap-4 mb-8">
                  <img src={getAvatarUrl(user)} className="w-10 h-10 rounded-full" alt="Avatar" />
                  <div className="flex-1">
                    <textarea 
                      value={commentText}
                      onChange={e => setCommentText(e.target.value)}
                      placeholder="Añade un comentario..."
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-purple-500 resize-none h-20"
                    />
                    <div className="flex justify-end mt-2">
                      <button onClick={postComment} disabled={!commentText.trim()} className="px-4 py-2 bg-purple-500 text-white rounded-lg font-bold disabled:opacity-50 cursor-pointer">Publicar</button>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  {selectedPlaylist.comments?.map((comment: any) => (
                    <div key={comment.id} className="flex gap-4">
                      <DiscordAvatar 
                        userId={comment.userId} 
                        defaultAvatarUrl={comment.avatar} 
                        username={comment.username} 
                        className="w-10 h-10 rounded-full shrink-0" 
                      />
                      <div className="flex-1">
                        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                          <div className="flex justify-between items-start mb-2">
                            <span className="font-bold text-white">{comment.username}</span>
                            {(comment.userId === userId || selectedPlaylist.userId === userId) && (
                              <button onClick={() => deleteComment(comment.id)} className="text-white/40 hover:text-red-400 cursor-pointer"><Trash2 className="w-4 h-4" /></button>
                            )}
                          </div>
                          <p className="text-white/80">{comment.text}</p>
                          <div className="flex items-center gap-4 mt-3 text-white/50 text-sm">
                            <button onClick={() => toggleCommentLike(comment.id)} className={`flex items-center gap-1 hover:text-white transition-colors cursor-pointer ${comment.likes?.includes(userId) ? 'text-purple-400' : ''}`}>
                              <Heart className="w-4 h-4" fill={comment.likes?.includes(userId) ? 'currentColor' : 'none'} /> {comment.likes?.length || 0}
                            </button>
                            <button onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)} className="hover:text-white transition-colors cursor-pointer">Responder</button>
                          </div>
                        </div>

                        {replyTo === comment.id && (
                          <div className="flex gap-3 mt-3">
                            <input 
                              type="text" 
                              value={replyText}
                              onChange={e => setReplyText(e.target.value)}
                              placeholder="Escribe una respuesta..."
                              className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500"
                            />
                            <button onClick={() => postReply(comment.id)} disabled={!replyText.trim()} className="px-3 py-2 bg-purple-500 text-white rounded-lg text-sm font-bold disabled:opacity-50 cursor-pointer">Responder</button>
                          </div>
                        )}

                        {comment.replies && comment.replies.length > 0 && (
                          <div className="mt-3 space-y-3">
                            {comment.replies.map((reply: any) => (
                              <div key={reply.id} className="flex gap-3 relative">
                                <div className="absolute -left-6 top-0 bottom-0 w-4 border-l-2 border-b-2 border-white/10 rounded-bl-xl h-6" />
                                <DiscordAvatar 
                                  userId={reply.userId} 
                                  defaultAvatarUrl={reply.avatar} 
                                  username={reply.username} 
                                  className="w-8 h-8 rounded-full shrink-0" 
                                />
                                <div className="flex-1 bg-white/5 border border-white/10 rounded-xl p-3">
                                  <div className="flex justify-between items-start mb-1">
                                    <span className="font-bold text-white text-sm">{reply.username}</span>
                                    {(reply.userId === userId || comment.userId === userId || selectedPlaylist.userId === userId) && (
                                      <button onClick={() => deleteReply(comment.id, reply.id)} className="text-white/40 hover:text-red-400 cursor-pointer"><Trash2 className="w-3 h-3" /></button>
                                    )}
                                  </div>
                                  <p className="text-white/80 text-sm">{reply.text}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : loading ? (
        <div className="flex justify-center p-12">
          <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin" />
        </div>
      ) : playlists.length === 0 ? (
        <div className="text-center py-20 bg-white/5 rounded-2xl border border-white/10">
          <Music className="w-16 h-16 text-white/30 mx-auto mb-4" />
          <h3 className="text-xl text-white font-semibold">No se encontraron listas</h3>
          <p className="text-white/50 mt-2">¡Crea una lista para comenzar o prueba con otra búsqueda!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {playlists.filter(p => {
             const q = searchQuery.toLowerCase();
             if (!q) return true;
             if (p.name?.toLowerCase().includes(q)) return true;
             if (p.creatorName?.toLowerCase().includes(q)) return true;
             if (p.tags && p.tags.some((t: string) => t.toLowerCase().includes(q))) return true;
             return false;
          }).map(playlist => (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              key={playlist.id}
              className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/10 transition-all group relative cursor-pointer flex flex-col h-full"
              onClick={() => setSelectedPlaylist(playlist)}
            >
              <div className="relative aspect-square rounded-xl overflow-hidden mb-4 bg-black/40">
                <img
                  src={(!playlist.coverImage || playlist.coverImage.includes('via.placeholder.com')) && playlist.tracks?.length > 0 
                  ? playlist.tracks[0].artwork 
                  : (playlist.coverImage || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&q=80')}
                  onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&q=80'; }}
                  alt={playlist.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                  <div className="w-14 h-14 bg-purple-500 rounded-full flex items-center justify-center shadow-2xl scale-90 group-hover:scale-100 transition-all">
                    <Play className="w-6 h-6 text-white ml-1" fill="white" />
                  </div>
                </div>
                <div className="absolute top-3 right-3 p-1.5 rounded-full bg-black/60 backdrop-blur-md">
                  {playlist.isPublic ? <Globe className="w-4 h-4 text-white" /> : <Lock className="w-4 h-4 text-white" />}
                </div>
              </div>
              <h3 className="text-lg font-bold text-white truncate">{playlist.name}</h3>
              <p className="text-white/60 text-sm truncate">{playlist.description || 'Sin descripción'}</p>
              
              <div className="mt-auto pt-4 flex items-center justify-between text-xs text-white/50">
                <div className="flex items-center gap-2">
                  <DiscordAvatar userId={playlist.userId} defaultAvatarUrl={playlist.creatorAvatar} username={playlist.creatorName} className="w-5 h-5 rounded-full shrink-0 shadow-md" />
                  <span className="truncate max-w-[100px] font-medium">{playlist.creatorName}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1"><Heart className="w-3 h-3" /> {playlist.likes?.length || 0}</span>
                  <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" /> {playlist.comments?.length || 0}</span>
                  <span>{playlist.tracks?.length || 0} canciones</span>
                </div>
              </div>
              
              {playlist.userId === userId && (
                <button
                  onClick={(e) => { e.stopPropagation(); deletePlaylist(playlist.id || playlist._id); }}
                  className="absolute top-2 left-2 p-2 rounded-full bg-black/60 text-red-400 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:text-white z-20 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 flex items-center justify-center z-[100] px-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowCreateModal(false)} />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 border border-white/20 p-6 sm:p-8 rounded-3xl w-full max-w-md relative z-10 shadow-2xl"
            >
              <button 
                onClick={() => setShowCreateModal(false)}
                className="absolute top-4 right-4 text-white/50 hover:text-white cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
              <h2 className="text-2xl font-bold text-white mb-6">Crear Lista de Reproducción</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-white/70 text-sm font-medium mb-2">Nombre de la Lista</label>
                  <input
                    type="text"
                    value={newPlaylistName}
                    onChange={e => setNewPlaylistName(e.target.value)}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Mi Mezcla Favorita"
                  />
                </div>
                <div>
                  <label className="block text-white/70 text-sm font-medium mb-2">Descripción</label>
                  <textarea
                    value={newPlaylistDesc}
                    onChange={e => setNewPlaylistDesc(e.target.value)}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none h-24"
                    placeholder="Las mejores canciones para escuchar..."
                  />
                </div>
                <div>
                  <label className="block text-white/70 text-sm font-medium mb-2">Etiquetas</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {newTags.map(tag => (
                      <span key={tag} className="px-2 py-1 bg-purple-500/30 text-purple-200 text-xs rounded-full flex items-center gap-1">
                        #{tag} <X className="w-3 h-3 cursor-pointer hover:text-white" onClick={() => setNewTags(prev => prev.filter(t => t !== tag))} />
                      </span>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (tagInput.trim() && !newTags.includes(tagInput.trim())) {
                          setNewTags([...newTags, tagInput.trim()]);
                          setTagInput('');
                        }
                      }
                    }}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Pulsa enter para añadir etiqueta..."
                  />
                </div>
                <div>
                  <label className="block text-white/70 text-sm font-medium mb-2">Importar Lista (Opcional)</label>
                  <input
                    type="text"
                    value={importUrl}
                    onChange={e => setImportUrl(e.target.value)}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Pega enlace de Spotify, YouTube o Deezer"
                  />
                </div>
                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={() => setIsPublic(!isPublic)}
                    className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${isPublic ? 'bg-purple-500' : 'bg-white/20'}`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all ${isPublic ? 'left-7' : 'left-1'}`} />
                  </button>
                  <span className="text-white font-medium flex items-center gap-2">
                    {isPublic ? <Globe className="w-4 h-4 text-purple-400" /> : <Lock className="w-4 h-4 text-white/50" />}
                    {isPublic ? 'Pública' : 'Privada'}
                  </span>
                </div>
                <button
                  disabled={!newPlaylistName}
                  onClick={handleCreatePlaylist}
                  className="w-full py-3 bg-purple-500 text-white rounded-xl font-bold text-lg mt-6 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-purple-600 transition-colors cursor-pointer"
                >
                  Crear Lista
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
        </div>
      </div>
    </>
  );
}
