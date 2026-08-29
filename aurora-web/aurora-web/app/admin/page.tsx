'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  Music, Users, Radio, Server, Activity, Clock, 
  TrendingUp, Disc, PlayCircle, PauseCircle, Search,
  RefreshCw, BarChart3, Zap
} from 'lucide-react';
import AuroraBackground from '../../components/AuroraBackground';
import CursorGlow from '../../components/CursorGlow';
import ToastContainer from '../../components/ToastContainer';
import Footer from '../../components/Footer';

interface ToastData {
  id: number;
  message: string;
  type: 'success' | 'error' | 'warning';
}

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [guilds, setGuilds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'members' | 'activity'>('members');
  const [logChannelId, setLogChannelId] = useState('');
  const [logChannelLoading, setLogChannelLoading] = useState(false);
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const addToast = (message: string, type: 'success' | 'error' | 'warning' = 'success') => {
    setToasts(prev => [...prev, { id: Date.now(), message, type }]);
  };

  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Check admin authentication
  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const response = await fetch('/api/auth/check-admin', { credentials: 'include' });
        const data = await response.json();
        
        if (data.isAdmin) {
          setIsAdmin(true);
          setCheckingAuth(false);
        } else {
          // Not admin, redirect to home
          router.push('/?error=admin_only');
        }
      } catch (error) {
        console.error('Admin check failed:', error);
        router.push('/?error=admin_only');
      }
    };

    checkAdmin();
  }, [router]);

  const fetchData = async () => {
    if (!isAdmin) return;
    setLoading(true);
    try {
      const socketUrl = (typeof window !== 'undefined' && window.self !== window.top) ? '' : (process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001');
      
      const [statsRes, guildsRes] = await Promise.all([
        fetch(`${socketUrl}/api/stats`, { credentials: 'include' }),
        fetch(`${socketUrl}/api/guilds`, { credentials: 'include' })
      ]);

      const statsData = await statsRes.json();
      const guildsData = await guildsRes.json();

      setStats(statsData);
      setGuilds(guildsData);
      if (statsData.logChannelId) setLogChannelId(statsData.logChannelId);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveLogChannel = async () => {
    setLogChannelLoading(true);
    try {
      const socketUrl = (typeof window !== 'undefined' && window.self !== window.top) ? '' : (process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001');
      const res = await fetch(`${socketUrl}/api/admin/log-channel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channelId: logChannelId }),
        credentials: 'include'
      });
      if (res.ok) {
        addToast('Log channel updated successfully!', 'success');
      } else {
        addToast('Failed to update log channel.', 'error');
      }
    } catch (err) {
      addToast('Error updating log channel', 'error');
    }
    setLogChannelLoading(false);
  };


  useEffect(() => {
    if (isAdmin) {
      fetchData();
      const interval = setInterval(fetchData, 30000); // Refresh every 30s
      return () => clearInterval(interval);
    }
  }, [isAdmin]);

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${mins}m`;
  };

  const formatMemory = (bytes: number) => {
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  };

  const filteredGuilds = guilds
    .filter(guild => {
      const matchesSearch = guild.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = 
        filterActive === 'all' ? true :
        filterActive === 'active' ? guild.hasPlayer :
        !guild.hasPlayer;
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'members':
          return b.memberCount - a.memberCount;
        case 'activity':
          return (b.hasPlayer ? 1 : 0) - (a.hasPlayer ? 1 : 0);
        default:
          return 0;
      }
    });

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center relative">
        <AuroraBackground />
        <CursorGlow />
        <div className="text-center relative z-10">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4"
            style={{ borderColor: 'hsl(155 80% 50%)' }}></div>
          <div className="text-white text-xl">Checking admin access...</div>
        </div>
      </div>
    );
  }

  if (loading && !stats) {
    return (
      <div className="min-h-screen flex items-center justify-center relative">
        <AuroraBackground />
        <CursorGlow />
        <div className="text-white text-xl relative z-10">Loading admin dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      <AuroraBackground />
      <CursorGlow />
      <div className="relative z-10 p-4 md:p-8 pt-24 md:pt-28">
        <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-1.5">Admin Dashboard</h1>
            <p className="text-gray-400 text-sm">Monitor and manage your Aurora bot system</p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
            <button
              onClick={() => router.push('/admin/nodelink')}
              className="px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-xl bg-cyan-500 hover:bg-cyan-600 transition-all text-black font-bold text-xs sm:text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 flex items-center gap-1.5 whitespace-nowrap shadow-lg shadow-cyan-500/20 active:scale-95"
            >
              <Zap className="w-4 h-4 stroke-[2.5]" /> Nodelink Admin
            </button>
            <button
              onClick={() => router.push('/admin/premium')}
              className="px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-xl bg-amber-500 hover:bg-amber-600 transition-all text-black font-bold text-xs sm:text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 whitespace-nowrap shadow-lg shadow-amber-500/20 active:scale-95"
            >
              🌟 Manage Premium
            </button>
            <button
              onClick={() => router.push('/admin/settings')}
              className="px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-xl bg-purple-500 hover:bg-purple-600 transition-all text-white font-medium text-xs sm:text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 whitespace-nowrap active:scale-95"
            >
              Website Settings
            </button>
            <button
              onClick={() => router.push('/admin/discord')}
              className="px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-xl bg-indigo-500 hover:bg-indigo-600 transition-all text-white font-medium text-xs sm:text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 whitespace-nowrap active:scale-95"
            >
              Discord Customizer
            </button>
            <button
              onClick={() => router.push('/admin/manage')}
              className="px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-xl bg-teal-500 hover:bg-teal-600 transition-all text-white font-medium text-xs sm:text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 whitespace-nowrap active:scale-95"
            >
              Manage Admins
            </button>
            <button
              onClick={async () => {
                try {
                  addToast('Refreshing developer avatars...', 'warning');
                  const devsRes = await fetch('/api/developers');
                  const devs = await devsRes.json();
                  if (Array.isArray(devs)) {
                    for (const dev of devs) {
                      if (dev.userId) {
                        await fetch('/api/developers', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ userId: dev.userId })
                        });
                      }
                    }
                  }
                  addToast('Developer avatars refreshed successfully!', 'success');
                } catch (error) {
                  addToast('Failed to refresh avatars', 'error');
                }
              }}
              className="p-2.5 sm:p-3 rounded-xl bg-green-500 hover:bg-green-600 transition-all text-white font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400 active:scale-95 flex items-center justify-center"
              title="Refresh Developer Avatars"
            >
              <Users className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <button
              onClick={fetchData}
              className="p-2.5 sm:p-3 rounded-xl bg-purple-500 hover:bg-purple-600 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 active:scale-95 flex items-center justify-center"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="backdrop-blur-xl bg-gradient-to-br from-purple-500/20 to-purple-600/20 rounded-xl p-6 border border-purple-500/30"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-500/30 rounded-lg">
                <Server className="w-6 h-6 text-purple-300" />
              </div>
              <TrendingUp className="w-5 h-5 text-purple-300" />
            </div>
            <p className="text-gray-300 text-sm mb-1">Total Servers</p>
            <p className="text-white text-3xl font-bold">{stats?.guilds || 0}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="backdrop-blur-xl bg-gradient-to-br from-teal-500/20 to-teal-600/20 rounded-xl p-6 border border-teal-500/30"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-teal-500/30 rounded-lg">
                <Radio className="w-6 h-6 text-teal-300" />
              </div>
              <Activity className="w-5 h-5 text-teal-300" />
            </div>
            <p className="text-gray-300 text-sm mb-1">Active Players</p>
            <p className="text-white text-3xl font-bold">{stats?.activePlayers || 0}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="backdrop-blur-xl bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-xl p-6 border border-blue-500/30"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-500/30 rounded-lg">
                <Users className="w-6 h-6 text-blue-300" />
              </div>
              <BarChart3 className="w-5 h-5 text-blue-300" />
            </div>
            <p className="text-gray-300 text-sm mb-1">Total Users</p>
            <p className="text-white text-3xl font-bold">
              {stats?.users?.toLocaleString() || 0}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="backdrop-blur-xl bg-gradient-to-br from-green-500/20 to-green-600/20 rounded-xl p-6 border border-green-500/30"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-500/30 rounded-lg">
                <Clock className="w-6 h-6 text-green-300" />
              </div>
              <Zap className="w-5 h-5 text-green-300" />
            </div>
            <p className="text-gray-300 text-sm mb-1">Uptime</p>
            <p className="text-white text-xl font-bold">
              {stats?.uptime ? formatUptime(stats.uptime) : '0d 0h 0m'}
            </p>
          </motion.div>
        </div>

        {/* System Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="backdrop-blur-xl bg-white/10 rounded-xl p-6 border border-white/20"
          >
            <div className="flex items-center gap-3 mb-3">
              <Activity className="w-5 h-5 text-purple-400" />
              <h3 className="text-white font-semibold">API Latency</h3>
            </div>
            <p className="text-3xl font-bold text-white">{stats?.ping || 0}ms</p>
            <p className="text-gray-400 text-sm mt-1">WebSocket ping</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="backdrop-blur-xl bg-white/10 rounded-xl p-6 border border-white/20"
          >
            <div className="flex items-center gap-3 mb-3">
              <Disc className="w-5 h-5 text-teal-400" />
              <h3 className="text-white font-semibold">Memory Usage</h3>
            </div>
            <p className="text-3xl font-bold text-white">
              {stats?.memory ? formatMemory(stats.memory.heapUsed) : '0 MB'}
            </p>
            <p className="text-gray-400 text-sm mt-1">
              of {stats?.memory ? formatMemory(stats.memory.heapTotal) : '0 MB'}
            </p>
          </motion.div>

          {/* Admin Settings Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="backdrop-blur-xl bg-white/10 rounded-xl p-6 border border-white/20"
          >
            <div className="flex items-center gap-3 mb-3">
              <Activity className="w-5 h-5 text-orange-400" />
              <h3 className="text-white font-semibold">Log Channel</h3>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <input 
                type="text" 
                value={logChannelId} 
                onChange={(e) => setLogChannelId(e.target.value)} 
                placeholder="Channel ID" 
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
              <button 
                onClick={handleSaveLogChannel} 
                disabled={logChannelLoading}
                className="bg-purple-500 hover:bg-purple-600 disabled:opacity-50 text-white px-3 py-2 rounded-lg font-medium transition"
              >
                {logChannelLoading ? 'Saving...' : 'Save'}
              </button>
            </div>
            <p className="text-gray-400 text-sm mt-2">Global activity log channel.</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="backdrop-blur-xl bg-white/10 rounded-xl p-6 border border-white/20"
          >
            <div className="flex items-center gap-3 mb-3">
              <Music className="w-5 h-5 text-blue-400" />
              <h3 className="text-white font-semibold">Activity Rate</h3>
            </div>
            <p className="text-3xl font-bold text-white">
              {stats?.guilds > 0 
                ? ((stats.activePlayers / stats.guilds) * 100).toFixed(1)
                : 0}%
            </p>
            <p className="text-gray-400 text-sm mt-1">Servers with active music</p>
          </motion.div>
        </div>

        {/* Filters and Search */}
        <div className="backdrop-blur-xl bg-white/10 rounded-xl p-6 border border-white/20 mb-6">
          <div className="flex flex-col gap-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search servers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Filters and Sort */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between">
              {/* Filter Buttons */}
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setFilterActive('all')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    filterActive === 'all'
                      ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/50'
                      : 'bg-white/10 text-gray-300 hover:bg-white/20'
                  }`}
                >
                  All ({guilds.length})
                </button>
                <button
                  onClick={() => setFilterActive('active')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    filterActive === 'active'
                      ? 'bg-green-500 text-white shadow-lg shadow-green-500/50'
                      : 'bg-white/10 text-gray-300 hover:bg-white/20'
                  }`}
                >
                  Active ({guilds.filter(g => g.hasPlayer).length})
                </button>
                <button
                  onClick={() => setFilterActive('inactive')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    filterActive === 'inactive'
                      ? 'bg-gray-500 text-white shadow-lg shadow-gray-500/50'
                      : 'bg-white/10 text-gray-300 hover:bg-white/20'
                  }`}
                >
                  Inactive ({guilds.filter(g => !g.hasPlayer).length})
                </button>
              </div>

              {/* Sort Buttons */}
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setSortBy('members')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    sortBy === 'members'
                      ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/50'
                      : 'bg-white/10 text-gray-300 hover:bg-white/20'
                  }`}
                >
                  Members
                </button>
                <button
                  onClick={() => setSortBy('name')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    sortBy === 'name'
                      ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/50'
                      : 'bg-white/10 text-gray-300 hover:bg-white/20'
                  }`}
                >
                  Name
                </button>
                <button
                  onClick={() => setSortBy('activity')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    sortBy === 'activity'
                      ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/50'
                      : 'bg-white/10 text-gray-300 hover:bg-white/20'
                  }`}
                >
                  Activity
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Servers Table */}
        <div className="backdrop-blur-xl bg-white/10 rounded-xl border border-white/20 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Server</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Members</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Voice Channel</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {filteredGuilds.map((guild, index) => (
                  <motion.tr
                    key={guild.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-white/5 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {guild.icon ? (
                          <img
                            src={guild.icon}
                            alt={guild.name}
                            className="w-10 h-10 rounded-lg"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center text-white font-bold">
                            {guild.name[0]}
                          </div>
                        )}
                        <div>
                          <p className="text-white font-medium">{guild.name}</p>
                          <p className="text-gray-400 text-xs">{guild.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-gray-400" />
                        <span className="text-white font-medium">
                          {guild.memberCount.toLocaleString()}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {guild.hasPlayer ? (
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                          <PlayCircle className="w-4 h-4 text-green-400" />
                          <span className="text-green-400 font-medium">Playing</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                          <PauseCircle className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-400">Idle</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {guild.voiceChannel ? (
                        <span className="text-white">{guild.voiceChannel}</span>
                      ) : (
                        <span className="text-gray-500">Not connected</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => router.push(`/dashboard/${guild.id}`)}
                        className="px-4 py-2 bg-purple-500 hover:bg-purple-600 rounded-lg text-white text-sm font-medium transition-colors"
                      >
                        Open Player
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredGuilds.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-400 text-lg">No servers found</p>
              <p className="text-gray-500 text-sm mt-2">
                Try adjusting your search or filter
              </p>
            </div>
          )}
        </div>

        {/* Footer Stats */}
        <div className="mt-6 text-center text-gray-400 text-sm">
          Showing {filteredGuilds.length} of {guilds.length} servers • 
          Last updated: {new Date().toLocaleTimeString()}
        </div>
        </div>
      </div>
      
      <Footer />
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
