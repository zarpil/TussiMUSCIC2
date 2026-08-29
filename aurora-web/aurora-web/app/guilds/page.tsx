'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Music, Users, Radio, AlertCircle, LogOut } from 'lucide-react';
import AuroraBackground from '../../components/AuroraBackground';
import CursorGlow from '../../components/CursorGlow';
import Footer from '../../components/Footer';

export default function GuildsPage() {
  const router = useRouter();
  const [guilds, setGuilds] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        // Check authentication
        const userRes = await fetch('/api/auth/user', {
          credentials: 'include',
          headers: { 'Cache-Control': 'no-cache' }
        });
        
        const userData = await userRes.json();
        
        if (userData.id) {
          setUser(userData);
          localStorage.setItem('discordUserId', userData.id);
          await fetchFilteredGuilds(userData.id);
        } else {
          // Not logged in, redirect to home
          router.push('/');
        }
      } catch (error) {
        console.error('Error loading data:', error);
        setError('Failed to load data');
        setLoading(false);
      }
    };

    loadData();
  }, [router]);

  const fetchFilteredGuilds = async (userId: string) => {
    try {
      const socketUrl = (typeof window !== 'undefined' && window.self !== window.top) ? '' : (process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001');
      
      const userGuildsRes = await fetch(`${socketUrl}/api/user-guilds/${userId}`, {
        credentials: 'include'
      });
      
      if (userGuildsRes.ok) {
        const userGuilds = await userGuildsRes.json();
        
        if (userGuilds.length === 0) {
          setGuilds([]);
          setLoading(false);
          return;
        }
        
        const guildsWithInfo = await Promise.all(
          userGuilds.map(async (guild: any) => {
            try {
              const guildInfoRes = await fetch(`${socketUrl}/api/guild/${guild.id}`, {
                credentials: 'include'
              });
              if (guildInfoRes.ok) {
                const guildInfo = await guildInfoRes.json();
                return {
                  ...guild,
                  memberCount: guildInfo.guild?.memberCount || guildInfo.memberCount || 0,
                  hasPlayer: guildInfo.player?.connected || false,
                  voiceChannel: guildInfo.player?.voiceChannel || null
                };
              }
              return {
                ...guild,
                memberCount: 0,
                hasPlayer: false,
                voiceChannel: null
              };
            } catch (err) {
              return {
                ...guild,
                memberCount: 0,
                hasPlayer: false,
                voiceChannel: null
              };
            }
          })
        );
        
        setGuilds(guildsWithInfo);
      } else {
        setError('Failed to fetch user servers');
        setLoading(false);
        return;
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch guilds:', error);
      setError('Failed to connect to bot');
      setLoading(false);
    }
  };

  const handleGuildClick = (guildId: string) => {
    if (!user) {
      setError('Please login to access the dashboard');
      return;
    }
    router.push(`/dashboard/${guildId}`);
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center relative">
        <AuroraBackground />
        <div className="text-white text-xl relative z-10">Cargando servidores...</div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden">
      <AuroraBackground />
      <CursorGlow />
      
      <div className="relative z-10 p-4 md:p-8 pt-24 md:pt-28">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <motion.h1 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl md:text-5xl font-bold mb-2"
            >
              <span className="text-gradient">Tus Servidores</span>
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-gray-400"
            >
              Selecciona un servidor para gestionar el reproductor de música
            </motion.p>
          </div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mb-6 glass-strong bg-red-500/10 border border-red-500/50 rounded-2xl p-4 flex items-center gap-3"
            >
              <AlertCircle className="w-6 h-6 text-red-400" />
              <p className="text-red-200">{error}</p>
            </motion.div>
          )}

          {/* Stats */}
          {guilds.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-strong rounded-2xl p-6"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl glow-purple"
                    style={{ background: 'hsl(270 60% 60% / 0.2)' }}>
                    <Music className="w-6 h-6" style={{ color: 'hsl(270 60% 60%)' }} />
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Servidores Disponibles</p>
                    <p className="text-white text-2xl font-bold">{guilds.length}</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="glass-strong rounded-2xl p-6"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl glow-pink"
                    style={{ background: 'hsl(330 90% 60% / 0.2)' }}>
                    <Radio className="w-6 h-6" style={{ color: 'hsl(330 90% 60%)' }} />
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Reproductores Activos</p>
                    <p className="text-white text-2xl font-bold">
                      {guilds.filter(g => g.hasPlayer).length}
                    </p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="glass-strong rounded-2xl p-6"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl glow-blue"
                    style={{ background: 'hsl(310 85% 55% / 0.2)' }}>
                    <Users className="w-6 h-6" style={{ color: 'hsl(310 85% 55%)' }} />
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Total de Miembros</p>
                    <p className="text-white text-2xl font-bold">
                      {guilds.reduce((acc, g) => acc + g.memberCount, 0).toLocaleString()}
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>
          )}

          {/* Guilds Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {guilds.map((guild, index) => (
              <motion.div
                key={guild.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => handleGuildClick(guild.id)}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleGuildClick(guild.id);
                  }
                }}
                className="glass-strong rounded-2xl p-6 hover:bg-white/15 transition-all cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tussi-pink"
              >
                <div className="flex items-start gap-4">
                  {guild.icon ? (
                    <img
                      src={guild.icon}
                      alt={guild.name}
                      className="w-16 h-16 rounded-xl"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-xl flex items-center justify-center text-white text-2xl font-bold"
                      style={{ background: 'hsl(270 60% 60% / 0.2)' }}>
                      {guild.name[0]}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-semibold text-lg truncate transition-colors"
                      style={{ 
                        color: 'white',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.color = 'hsl(330 90% 60%)'}
                      onMouseLeave={(e) => e.currentTarget.style.color = 'white'}
                    >
                      {guild.name}
                    </h3>
                    <p className="text-gray-400 text-sm">
                      {guild.memberCount.toLocaleString()} miembros
                    </p>
                    {guild.hasPlayer && (
                      <div className="mt-2 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full animate-pulse"
                          style={{ background: 'hsl(330 90% 60%)' }}></div>
                        <span className="text-xs" style={{ color: 'hsl(330 90% 60%)' }}>
                          Reproduciendo en {guild.voiceChannel}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {guilds.length === 0 && !error && (
            <div className="text-center py-12 glass-strong rounded-2xl">
              <p className="text-gray-400 text-lg">No se encontraron servidores</p>
              <p className="text-gray-500 text-sm mt-2">
                Asegúrate de haber añadido el bot a tus servidores y que el backend esté conectado
              </p>
            </div>
          )}
        </div>
      </div>
      
      <Footer />
    </div>
  );
}
