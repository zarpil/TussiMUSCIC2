'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Server, 
  Radio, 
  Users, 
  Clock, 
  Flame, 
  CheckCircle2, 
  XCircle, 
  Trophy, 
  Play, 
  RefreshCw, 
  Zap,
  Info,
  ShieldCheck,
  Activity,
  Headphones,
  History,
  Calendar
} from 'lucide-react';

interface ServerOverviewViewProps {
  guildId: string;
  userId?: string;
  onPlayTrack?: (query: string) => void;
}

function SongArtworkImage({ song }: { song: any }) {
  const defaultMusicArt = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&auto=format&fit=crop';

  const [imgUrl, setImgUrl] = useState<string>(() => {
    if (
      song.artwork &&
      !song.artwork.includes('discordapp.com/embed/avatars') &&
      !song.artwork.includes('cdn-images.dzcdn.net/images/artist//')
    ) {
      return song.artwork;
    }
    if (song.url) {
      const match = song.url.match(/(?:v=|\/embed\/|\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
      if (match && match[1]) {
        return `https://i.ytimg.com/vi/${match[1]}/hqdefault.jpg`;
      }
    }
    return '';
  });

  useEffect(() => {
    if (imgUrl) return;

    let isMounted = true;
    const fetchArtwork = async () => {
      try {
        const rawTitle = song.title || '';
        let clean = rawTitle
          .replace(/\[.*?\]|\(.*?\)/g, '')
          .replace(/video song|official video|music video|lyric video|lyric|lyrics|full video|audio/gi, '')
          .replace(/ft\..*$/gi, '')
          .replace(/feat\..*$/gi, '')
          .trim();

        const parts = clean.split(/[|-]/);
        const searchKeyword = parts[0]?.trim() || clean;

        if (!searchKeyword) return;

        // 1. Try iTunes search API (extremely reliable for all Indian & global music)
        try {
          const itunesRes = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(searchKeyword)}&entity=song&limit=1`);
          if (itunesRes.ok) {
            const itunesData = await itunesRes.json();
            if (itunesData.results && itunesData.results[0] && itunesData.results[0].artworkUrl100) {
              const art = itunesData.results[0].artworkUrl100.replace('100x100bb', '300x300bb');
              if (isMounted) {
                setImgUrl(art);
                return;
              }
            }
          }
        } catch (e) {}

        // 2. Fallback to Deezer search API
        let res = await fetch(`/api/deezer/search?q=${encodeURIComponent(searchKeyword)}&limit=1`);
        if (res.ok) {
          let data = await res.json();
          let result = data.data && data.data[0];
          if (result && result.album && (result.album.cover_big || result.album.cover_medium)) {
            const highRes = result.album.cover_big || result.album.cover_medium;
            if (isMounted) {
              setImgUrl(highRes);
              return;
            }
          }
        }
      } catch (e) {}
    };

    fetchArtwork();

    return () => {
      isMounted = false;
    };
  }, [song.title, song.author, song.url, imgUrl]);

  return (
    <img
      src={imgUrl || defaultMusicArt}
      alt={song.title || 'Track'}
      onError={(e) => {
        (e.target as HTMLImageElement).src = defaultMusicArt;
      }}
      className="w-11 h-11 rounded-xl object-cover border border-white/10 shrink-0 group-hover:scale-105 transition shadow-sm"
    />
  );
}

export default function ServerOverviewView({
  guildId,
  userId,
  onPlayTrack
}: ServerOverviewViewProps) {
  const [overviewData, setOverviewData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [toggling247, setToggling247] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOverview = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setRefreshing(true);
    try {
      const res = await fetch(`/api/guilds/${guildId}/overview`);
      if (res && res.ok) {
        const data = await res.json();
        if (data.success) {
          setOverviewData(data);
        }
      }
    } catch (e) {
      console.error('Failed to fetch server overview:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (guildId) {
      fetchOverview();
    }
  }, [guildId]);

  const handleToggle247 = async (targetState: boolean) => {
    setToggling247(true);
    try {
      const res = await fetch(`/api/guilds/${guildId}/247`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': userId || ''
        },
        body: JSON.stringify({ enabled: targetState })
      });

      const data = await res.json();

      if (data && data.success) {
        window.dispatchEvent(new CustomEvent('show-toast', {
          detail: {
            message: data.message || (targetState ? '🟢 24/7 VC Mode enabled!' : '🔴 24/7 VC Mode disabled.'),
            type: 'success'
          }
        }));
        fetchOverview(false);
      } else {
        window.dispatchEvent(new CustomEvent('show-toast', {
          detail: {
            message: data.error || 'Failed to toggle 24/7 mode.',
            type: 'error'
          }
        }));
      }
    } catch (err: any) {
      console.error('24/7 Toggle Error:', err);
      window.dispatchEvent(new CustomEvent('show-toast', {
        detail: { message: 'Network error toggling 24/7 mode', type: 'error' }
      }));
    } finally {
      setToggling247(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full min-h-[550px] flex flex-col items-center justify-center p-8 bg-[#0b0c10] rounded-3xl border border-white/10 shadow-2xl">
        <div className="relative w-16 h-16 mb-4">
          <div className="absolute inset-0 rounded-full border-4 border-cyan-500/20 border-t-cyan-400 animate-spin" />
          <Server className="w-6 h-6 text-cyan-400 absolute inset-0 m-auto" />
        </div>
        <p className="text-cyan-300 font-bold text-sm tracking-wider uppercase animate-pulse">
          Fetching Live Server Analytics...
        </p>
      </div>
    );
  }

  const guild = overviewData?.guild || { name: 'Discord Server', memberCount: 0, icon: 'https://cdn.discordapp.com/embed/avatars/0.png' };
  const stats = overviewData?.stats || { totalVcHours: 0, userActivity: [], topSongs: [], history: [] };
  const twentyFourSeven = overviewData?.twentyFourSeven || { enabled: false, voiceChannelName: null, isConnected: false };

  const userActivity = stats.userActivity || [];
  const topSongs = stats.topSongs || [];
  const history = stats.history || [];

  const formatTimeAgo = (dateInput: any) => {
    if (!dateInput) return '';
    try {
      const diffMs = Date.now() - new Date(dateInput).getTime();
      const diffSecs = Math.floor(diffMs / 1000);
      if (diffSecs < 60) return 'Hace un momento';
      const diffMins = Math.floor(diffSecs / 60);
      if (diffMins < 60) return `Hace ${diffMins} min`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `Hace ${diffHours} h`;
      const diffDays = Math.floor(diffHours / 24);
      return `Hace ${diffDays} d`;
    } catch {
      return '';
    }
  };

  return (
    <div className="w-full space-y-8 p-4 sm:p-6 md:p-10 pt-24 md:pt-28 bg-[#090a0f] text-white rounded-3xl min-h-screen">
      {/* Top Banner & Server Header */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-[#0d1527] via-[#1a1c38] to-[#2a0e3f] p-6 sm:p-8 md:p-10 border border-cyan-500/20 shadow-[0_10px_40px_rgba(0,0,0,0.8)] flex flex-col md:flex-row items-center justify-between gap-6 group">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-cyan-500/20 transition-all duration-700" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center gap-6 min-w-0 z-10">
          <div className="relative shrink-0">
            <img
              src={guild.icon || 'https://cdn.discordapp.com/embed/avatars/0.png'}
              alt={guild.name}
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl object-cover border-2 border-cyan-400/40 shadow-[0_0_25px_rgba(6,182,212,0.4)]"
            />
            {twentyFourSeven.isConnected && (
              <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-black p-1.5 rounded-full ring-4 ring-[#0d1527] shadow-lg animate-bounce" title="Bot Connected to Voice Channel">
                <Radio className="w-4 h-4" />
              </div>
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2.5 mb-2">
              <span className="px-3 py-1 bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded-full text-xs font-black uppercase tracking-widest flex items-center gap-1.5 shadow-inner">
                <Server className="w-3.5 h-3.5 text-cyan-400" />
                SERVER OVERVIEW
              </span>
              <span className="px-3 py-1 bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
                BOT OFICIAL
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black text-white truncate tracking-tight drop-shadow-md">
              {guild.name}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-white/70 mt-2 font-medium">
              <span className="flex items-center gap-1.5 bg-white/5 px-3 py-1 rounded-xl border border-white/10">
                <Users className="w-4 h-4 text-cyan-400" />
                {guild.memberCount ? guild.memberCount.toLocaleString() : '0'} Miembros
              </span>
              <span className="flex items-center gap-1.5 bg-white/5 px-3 py-1 rounded-xl border border-white/10 text-emerald-400 font-bold">
                <Activity className="w-4 h-4 text-emerald-400" />
                {twentyFourSeven.isConnected ? 'Canal de Voz Conectado' : 'Listo para Conectar'}
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={() => fetchOverview(false)}
          disabled={refreshing}
          className="z-10 px-5 py-3 bg-white/10 hover:bg-cyan-500/20 hover:text-cyan-300 text-white rounded-2xl transition-all border border-white/10 hover:border-cyan-500/40 shrink-0 cursor-pointer disabled:opacity-50 flex items-center gap-2 font-bold text-xs uppercase tracking-wider shadow-lg active:scale-95"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          <span>Actualizar</span>
        </button>
      </div>

      {/* Grid: 24/7 VC Mode Switcher & Voice Duration Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 24/7 Voice Channel Mode Toggle Card */}
        <div className={`relative p-6 sm:p-8 rounded-3xl border transition-all duration-500 flex flex-col justify-between overflow-hidden ${
          twentyFourSeven.enabled
            ? 'bg-gradient-to-br from-emerald-950/50 via-[#0c1b17] to-[#071210] border-emerald-500/50 shadow-[0_0_35px_rgba(16,185,129,0.2)]'
            : 'bg-[#12141d] border-white/10 shadow-xl'
        }`}>
          <div>
            <div className="flex items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-4">
                <div className={`p-4 rounded-2xl border ${
                  twentyFourSeven.enabled
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.5)] animate-pulse'
                    : 'bg-white/5 text-white/40 border-white/10'
                }`}>
                  <Radio className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                    Modo 24/7 en Canal de Voz
                    {twentyFourSeven.enabled && (
                      <span className="text-[10px] bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full font-black uppercase">
                        Activo
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-white/60 mt-0.5">Mantiene el bot en el canal de voz de forma continua</p>
                </div>
              </div>

              {/* Glowing Interactive Toggle Switch */}
              <button
                onClick={() => handleToggle247(!twentyFourSeven.enabled)}
                disabled={toggling247}
                className={`w-16 h-9 rounded-full p-1 transition-all duration-300 relative cursor-pointer disabled:opacity-50 shrink-0 border ${
                  twentyFourSeven.enabled
                    ? 'bg-emerald-500 border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.6)]'
                    : 'bg-white/15 border-white/20 hover:bg-white/25'
                }`}
              >
                <div className={`w-7 h-7 rounded-full bg-white shadow-xl transform transition-transform duration-300 flex items-center justify-center ${
                  twentyFourSeven.enabled ? 'translate-x-7 text-emerald-600' : 'translate-x-0 text-gray-500'
                }`}>
                  {toggling247 ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Zap className="w-3.5 h-3.5 fill-current" />
                  )}
                </div>
              </button>
            </div>

            {/* Status Information Box */}
            <div className="bg-black/50 border border-white/10 p-4 sm:p-5 rounded-2xl space-y-3 mb-5 backdrop-blur-md">
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <span className="text-white/60 font-medium">Estado del Modo:</span>
                <span className={`font-black flex items-center gap-1.5 text-xs px-3 py-1 rounded-full uppercase tracking-wider ${
                  twentyFourSeven.enabled
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-white/10 text-white/50 border border-white/10'
                }`}>
                  {twentyFourSeven.enabled ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>MODO 24/7 ACTIVO</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 text-white/40" />
                      <span>DESACTIVADO</span>
                    </>
                  )}
                </span>
              </div>

              {twentyFourSeven.enabled && (
                <div className="flex items-center justify-between text-xs sm:text-sm pt-2 border-t border-white/10">
                  <span className="text-white/60 font-medium">Canal de Voz:</span>
                  <span className="font-bold text-cyan-300 flex items-center gap-1.5 bg-cyan-500/10 px-2.5 py-1 rounded-lg border border-cyan-500/20">
                    <Headphones className="w-3.5 h-3.5 text-cyan-400" />
                    #{twentyFourSeven.voiceChannelName || 'Canal Conectado'}
                  </span>
                </div>
              )}
            </div>

            <div className="p-4 bg-cyan-500/5 border border-cyan-500/20 rounded-2xl text-xs text-white/70 leading-relaxed flex items-start gap-2.5">
              <Info className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-white block mb-0.5">Cómo Funciona el Modo 24/7:</span>
                Al activarse, el bot se conectará a tu canal de voz y permanecerá allí incluso si la cola termina. Si el bot se reinicia, se reconectará automáticamente.
              </div>
            </div>
          </div>
        </div>

        {/* Voice Channel Listening Hours Analytics Card */}
        <div className="bg-[#12141d] border border-white/10 p-6 sm:p-8 rounded-3xl flex flex-col justify-between relative overflow-hidden group shadow-xl">
          <div className="absolute right-4 top-4 opacity-5 pointer-events-none group-hover:scale-110 transition duration-700">
            <Clock className="w-48 h-48 text-cyan-400" />
          </div>

          <div>
            <div className="flex items-center gap-4 mb-6">
              <div className="p-4 bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded-2xl shadow-[0_0_15px_rgba(6,182,212,0.3)]">
                <Clock className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white tracking-tight">Horas de Reproducción en Voz</h3>
                <p className="text-xs text-white/60 mt-0.5">Tiempo total de música reproducida en este servidor</p>
              </div>
            </div>

            <div className="my-6 p-6 bg-black/40 border border-white/10 rounded-2xl relative">
              <div className="text-4xl sm:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-blue-400 to-purple-400 tracking-tight">
                {stats.totalVcHours} <span className="text-xl sm:text-2xl text-white/70 font-bold">Horas</span>
              </div>
              <p className="text-xs text-cyan-400/80 mt-2 font-mono flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                Equivalente a {Math.round(stats.totalVcHours * 60)} minutos activos en canales de voz
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10 text-xs">
            <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
              <span className="text-white/50 block text-[10px] uppercase font-bold tracking-wider">Usuarios Activos</span>
              <span className="text-white font-black text-base mt-1 block">{userActivity.length} Miembros</span>
            </div>
            <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
              <span className="text-white/50 block text-[10px] uppercase font-bold tracking-wider">Canciones Reproducidas</span>
              <span className="text-white font-black text-base mt-1 block">{topSongs.length} Pistas</span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Top Bot Users Leaderboard & Most Played Songs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* User Activity Leaderboard */}
        <div className="bg-[#12141d] border border-white/10 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div className="flex items-center gap-3.5">
              <div className="p-3 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-2xl shadow-[0_0_15px_rgba(245,158,11,0.3)]">
                <Trophy className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white tracking-tight">Usuarios Más Activos</h3>
                <p className="text-xs text-white/50">Miembros que más canciones han pedido en el servidor</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {userActivity.length === 0 ? (
              <div className="py-12 text-center text-white/40 text-xs bg-white/5 rounded-2xl border border-dashed border-white/10 p-6">
                <Trophy className="w-10 h-10 text-white/20 mx-auto mb-2" />
                <p className="font-bold text-white/60 mb-1">Aún no hay estadísticas de usuarios</p>
                <p className="text-[11px] text-white/40">¡Pide canciones en este servidor para aparecer en el ranking!</p>
              </div>
            ) : (
              userActivity.map((user: any, index: number) => {
                const rankBadge = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`;
                return (
                  <div
                    key={user.userId || index}
                    className="flex items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-white/5 hover:bg-white/10 transition border border-white/5 hover:border-amber-500/30 group"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <span className="text-sm font-black text-amber-400/90 w-6 text-center shrink-0 font-mono">
                        {rankBadge}
                      </span>
                      {user.avatar ? (
                        <img
                          src={user.avatar.startsWith('http') ? user.avatar : `https://cdn.discordapp.com/avatars/${user.userId}/${user.avatar}.png?size=64`}
                          alt={user.username}
                          className="w-10 h-10 rounded-full object-cover border-2 border-white/10 group-hover:border-amber-400 transition shrink-0"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username || 'User')}&background=random`;
                          }}
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-purple-600/40 text-white font-black flex items-center justify-center text-sm shrink-0 border border-white/10 group-hover:border-amber-400 transition">
                          {user.username?.[0]?.toUpperCase() || 'U'}
                        </div>
                      )}
                      <span className="font-bold text-white text-xs sm:text-sm truncate group-hover:text-amber-300 transition">
                        {user.username}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="px-3.5 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full text-xs font-black">
                        {user.count} canciones
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Most Played Songs Shelf */}
        <div className="bg-[#12141d] border border-white/10 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div className="flex items-center gap-3.5">
              <div className="p-3 bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded-2xl shadow-[0_0_15px_rgba(249,115,22,0.3)]">
                <Flame className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white tracking-tight">Canciones Más Escuchadas</h3>
                <p className="text-xs text-white/50">Las pistas más reproducidas en este servidor</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {topSongs.length === 0 ? (
              <div className="py-12 text-center text-white/40 text-xs bg-white/5 rounded-2xl border border-dashed border-white/10 p-6">
                <Flame className="w-10 h-10 text-white/20 mx-auto mb-2" />
                <p className="font-bold text-white/60 mb-1">Aún no hay canciones registradas</p>
                <p className="text-[11px] text-white/40">¡Pide canciones en el servidor para ver el ranking musical!</p>
              </div>
            ) : (
              topSongs.map((song: any, index: number) => (
                <div
                  key={index}
                  onClick={() => onPlayTrack && onPlayTrack(song.url || `${song.title} ${song.author}`)}
                  className="flex items-center justify-between p-3 rounded-2xl bg-white/5 hover:bg-white/10 transition cursor-pointer group border border-white/5 hover:border-cyan-500/30"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <span className="text-xs font-mono font-bold text-white/40 w-4 text-center group-hover:hidden">
                      {index + 1}
                    </span>
                    <button className="w-4 h-4 hidden group-hover:flex items-center justify-center text-cyan-400">
                      <Play className="w-4 h-4 fill-current" />
                    </button>

                    <SongArtworkImage song={song} />

                    <div className="truncate min-w-0">
                      <h4 className="font-bold text-white text-xs sm:text-sm truncate group-hover:text-cyan-400 transition">
                        {song.title}
                      </h4>
                      <p className="text-white/50 text-[11px] truncate mt-0.5">{song.author}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="px-3 py-1 bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 rounded-full text-xs font-mono font-bold">
                      {song.count} repros
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Historial de Canciones Reproducidas (Últimos 7 Días) */}
      <div className="bg-[#12141d] border border-white/10 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded-2xl shadow-[0_0_15px_rgba(6,182,212,0.3)]">
              <History className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white tracking-tight flex items-center gap-2.5">
                Historial de Reproducción
                <span className="text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-2.5 py-0.5 rounded-full font-black uppercase">
                  Última semana
                </span>
              </h3>
              <p className="text-xs text-white/50 mt-0.5">Canciones reproducidas recientemente en este servidor</p>
            </div>
          </div>

          {history.length > 0 && (
            <div className="flex items-center gap-2 text-xs font-mono text-cyan-400/90 bg-cyan-500/10 px-3 py-1.5 rounded-xl border border-cyan-500/20 w-fit">
              <Calendar className="w-3.5 h-3.5" />
              <span>{history.length} pistas registradas</span>
            </div>
          )}
        </div>

        {history.length === 0 ? (
          <div className="py-14 text-center text-white/40 text-xs bg-white/5 rounded-2xl border border-dashed border-white/10 p-8">
            <History className="w-12 h-12 text-white/20 mx-auto mb-3" />
            <p className="font-bold text-white/70 text-sm mb-1">Aún no hay historial de reproducción reciente</p>
            <p className="text-[11px] text-white/40 max-w-sm mx-auto">
              A medida que pongas música en el bot durante la semana, aparecerán aquí las últimas canciones reproducidas y quién las pidió.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[520px] overflow-y-auto pr-1 select-none custom-scrollbar">
            {history.map((song: any, index: number) => (
              <div
                key={index}
                onClick={() => onPlayTrack && onPlayTrack(song.url || `${song.title} ${song.author}`)}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 transition cursor-pointer group border border-white/5 hover:border-cyan-500/30"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="relative shrink-0">
                    <SongArtworkImage song={song} />
                    <div className="absolute inset-0 bg-black/40 rounded-xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                      <Play className="w-4 h-4 text-cyan-400 fill-current" />
                    </div>
                  </div>

                  <div className="truncate min-w-0">
                    <h4 className="font-bold text-white text-xs sm:text-sm truncate group-hover:text-cyan-400 transition">
                      {song.title}
                    </h4>
                    <div className="flex items-center gap-2 text-white/50 text-[11px] truncate mt-0.5">
                      <span className="truncate">{song.author}</span>
                      {song.requestedBy?.username && (
                        <>
                          <span className="text-white/20">•</span>
                          <span className="text-white/40 truncate text-[10px]">
                            Por @{song.requestedBy.username}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0 pl-2 text-right">
                  {song.playedAt && (
                    <span className="text-[10px] font-medium text-white/40 group-hover:text-cyan-300 transition">
                      {formatTimeAgo(song.playedAt)}
                    </span>
                  )}
                  <button
                    className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 opacity-0 group-hover:opacity-100 transition hover:bg-cyan-500 hover:text-black shrink-0"
                    title="Reproducir de nuevo"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
