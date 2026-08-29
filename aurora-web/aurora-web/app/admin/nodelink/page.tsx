'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  Zap, Server, Activity, Plus, Trash2, Edit, 
  ShieldAlert, RefreshCw, BarChart3, Radio, HelpCircle, ArrowLeft,
  Lock, Unlock
} from 'lucide-react';
import AuroraBackground from '../../../components/AuroraBackground';
import CursorGlow from '../../../components/CursorGlow';
import ToastContainer from '../../../components/ToastContainer';
import Footer from '../../../components/Footer';

interface ToastData {
  id: number;
  message: string;
  type: 'success' | 'error' | 'warning';
}

interface NodelinkNode {
  id: string;
  identifier: string;
  host: string;
  port: number;
  password?: string;
  secure: boolean;
  userType: 'all' | 'normal' | 'premium';
  priority: number;
  isActive: boolean;
  connected: boolean;
  stats?: any; // Dynamic because Nodelink structure might vary slightly
}

const getMemoryStats = (stats: any) => {
  if (!stats || !stats.memory) {
    return { used: 0, allocated: 0, pct: 0 };
  }
  const mem = stats.memory;
  
  // Standard Lavalink format
  let used = mem.used;
  let allocated = mem.allocated || mem.total || mem.rss;

  // Node.js process.memoryUsage format
  if (used === undefined && mem.heapUsed !== undefined) {
    used = mem.heapUsed;
  }
  if (allocated === undefined && mem.heapTotal !== undefined) {
    allocated = mem.heapTotal;
  }
  
  // NodeLink / JVM memory fallbacks
  if (used === undefined) used = mem.rss || 0;
  if (allocated === undefined) allocated = mem.rss || 1024 * 1024 * 1024; // fallback to 1GB if unknown

  const pct = allocated > 0 ? Math.min(100, Math.max(0, (used / allocated) * 100)) : 0;
  return { used, allocated, pct };
};

const getCpuStats = (stats: any) => {
  if (!stats || !stats.cpu) {
    return { system: 0, process: 0 };
  }
  const cpu = stats.cpu;
  
  // Handle JVM systemLoad / lavalinkLoad or nodelinkLoad
  let system = cpu.systemLoad !== undefined ? cpu.systemLoad : 0;
  let process = cpu.lavalinkLoad !== undefined ? cpu.lavalinkLoad : (cpu.nodelinkLoad !== undefined ? cpu.nodelinkLoad : 0);

  // If system/process load is > 1 (e.g. sent as percentage out of 100 instead of 0-1 ratio), scale it down
  if (system > 1) system = system / 100;
  if (process > 1) process = process / 100;

  return { system, process };
};

export default function NodelinkAdmin() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [nodes, setNodes] = useState<NodelinkNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState<ToastData[]>([]);
  
  // Form modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedNode, setSelectedNode] = useState<NodelinkNode | null>(null);
  
  // Add/Edit Form Fields
  const [identifier, setIdentifier] = useState('');
  const [host, setHost] = useState('');
  const [port, setPort] = useState('3008');
  const [password, setPassword] = useState('');
  const [secure, setSecure] = useState(false);
  const [userType, setUserType] = useState<'all' | 'normal' | 'premium'>('all');
  const [priority, setPriority] = useState('1');
  const [isActive, setIsActive] = useState(true);
  
  const addToast = (message: string, type: 'success' | 'error' | 'warning' = 'success') => {
    setToasts(prev => [...prev, { id: Date.now(), message, type }]);
  };

  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Auth Verification
  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const response = await fetch('/api/auth/check-admin', { credentials: 'include' });
        const data = await response.json();
        
        if (data.isAdmin) {
          setIsAdmin(true);
          setCheckingAuth(false);
        } else {
          router.push('/?error=admin_only');
        }
      } catch (error) {
        console.error('Admin check failed:', error);
        router.push('/?error=admin_only');
      }
    };
    checkAdmin();
  }, [router]);

  // Fetch Nodes
  const fetchNodes = async () => {
    if (!isAdmin) return;
    try {
      const socketUrl = (typeof window !== 'undefined' && window.self !== window.top) ? '' : (process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001');
      const res = await fetch(`${socketUrl}/api/admin/nodelink/nodes`, { credentials: 'include' });
      const data = await res.json();
      if (Array.isArray(data)) {
        setNodes(data);
      }
    } catch (error) {
      console.error('Failed to fetch nodelink nodes:', error);
      addToast('Failed to fetch Nodelink nodes statistics.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchNodes();
      const interval = setInterval(fetchNodes, 10000); // Refresh every 10s
      return () => clearInterval(interval);
    }
  }, [isAdmin]);

  const handleOpenAddModal = () => {
    setIdentifier('');
    setHost('');
    setPort('3008');
    setPassword('youshallnotpass');
    setSecure(false);
    setUserType('all');
    setPriority('1');
    setIsActive(true);
    setShowAddModal(true);
  };

  const handleOpenEditModal = (node: NodelinkNode) => {
    setSelectedNode(node);
    setIdentifier(node.identifier);
    setHost(node.host);
    setPort(node.port.toString());
    setPassword(node.password || '');
    setSecure(node.secure);
    setUserType(node.userType);
    setPriority(node.priority.toString());
    setIsActive(node.isActive);
    setShowEditModal(true);
  };

  const handleAddNode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier || !host || !port || !password) {
      addToast('Please fill out all required fields.', 'error');
      return;
    }
    
    try {
      const socketUrl = (typeof window !== 'undefined' && window.self !== window.top) ? '' : (process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001');
      const res = await fetch(`${socketUrl}/api/admin/nodelink/nodes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier,
          host,
          port: Number(port),
          password,
          secure,
          userType,
          priority: Number(priority)
        }),
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success) {
        addToast('Nodelink Node added and initialized successfully!', 'success');
        setShowAddModal(false);
        fetchNodes();
      } else {
        addToast(data.error || 'Failed to add node.', 'error');
      }
    } catch (err) {
      addToast('Error communicating with backend API', 'error');
    }
  };

  const handleEditNode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedNode) return;
    
    try {
      const socketUrl = (typeof window !== 'undefined' && window.self !== window.top) ? '' : (process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001');
      const res = await fetch(`${socketUrl}/api/admin/nodelink/nodes/${selectedNode.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier,
          host,
          port: Number(port),
          password,
          secure,
          userType,
          priority: Number(priority),
          isActive
        }),
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success) {
        addToast('Nodelink Node configurations updated successfully!', 'success');
        setShowEditModal(false);
        fetchNodes();
      } else {
        addToast(data.error || 'Failed to update node configurations.', 'error');
      }
    } catch (err) {
      addToast('Error communicating with backend API', 'error');
    }
  };

  const handleDeleteNode = async (id: string) => {
    if (!confirm('Are you sure you want to delete this Nodelink Node? This will sever all connections routing through it.')) {
      return;
    }
    
    try {
      const socketUrl = (typeof window !== 'undefined' && window.self !== window.top) ? '' : (process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001');
      const res = await fetch(`${socketUrl}/api/admin/nodelink/nodes/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success) {
        addToast('Nodelink Node deleted and connections cleaned up.', 'success');
        fetchNodes();
      } else {
        addToast(data.error || 'Failed to delete node.', 'error');
      }
    } catch (err) {
      addToast('Error communicating with backend API', 'error');
    }
  };

  const formatUptime = (ms: number) => {
    if (!ms) return '0s';
    const totalSecs = Math.floor(ms / 1000);
    const days = Math.floor(totalSecs / 86400);
    const hours = Math.floor((totalSecs % 86400) / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    return `${days > 0 ? `${days}d ` : ''}${hours > 0 ? `${hours}h ` : ''}${mins}m`;
  };

  const formatMemory = (bytes?: number) => {
    if (!bytes || isNaN(bytes)) return '0 MB';
    return `${(bytes / 1024 / 1024).toFixed(0)} MB`;
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center relative">
        <AuroraBackground />
        <CursorGlow />
        <div className="text-center relative z-10">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4"
            style={{ borderColor: 'hsl(195 80% 50%)' }}></div>
          <div className="text-white text-xl">Verifying admin credentials...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative flex flex-col justify-between">
      <AuroraBackground />
      <CursorGlow />
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      
      <div className="relative z-10 p-4 md:p-8 pt-24 md:pt-28 flex-1">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/admin')}
                className="p-3 rounded-full bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all hover:scale-105 active:scale-95 flex items-center justify-center"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
                  <Zap className="w-8 h-8 text-cyan-400" /> Nodelink Admin
                </h1>
                <p className="text-gray-400 text-sm">Manage dynamic Nodelink nodes and routing priorities</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={fetchNodes}
                className="p-3.5 rounded-xl bg-white/5 border border-white/15 text-white hover:bg-white/10 transition-all flex items-center justify-center"
                title="Refresh stats"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button
                onClick={handleOpenAddModal}
                className="px-5 py-3.5 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-black font-bold transition-all duration-300 flex items-center gap-2 hover:shadow-lg hover:shadow-cyan-500/20 active:scale-95"
              >
                <Plus className="w-4 h-4 stroke-[3]" /> Add Nodelink Node
              </button>
            </div>
          </div>

          {/* Quick Stats Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-[#1c1c1e]/60 border border-white/5 backdrop-blur-md rounded-2xl p-5">
              <div className="text-gray-400 text-xs font-semibold mb-1 uppercase tracking-wider">Total Voice Nodes</div>
              <div className="text-3xl font-extrabold text-white">{nodes.length}</div>
            </div>
            <div className="bg-[#1c1c1e]/60 border border-white/5 backdrop-blur-md rounded-2xl p-5">
              <div className="text-gray-400 text-xs font-semibold mb-1 uppercase tracking-wider">Connected Nodes</div>
              <div className="text-3xl font-extrabold text-emerald-400">
                {nodes.filter(n => n.connected && n.isActive).length} <span className="text-sm font-normal text-gray-500">/ {nodes.length}</span>
              </div>
            </div>
            <div className="bg-[#1c1c1e]/60 border border-white/5 backdrop-blur-md rounded-2xl p-5">
              <div className="text-gray-400 text-xs font-semibold mb-1 uppercase tracking-wider">Active Playbacks</div>
              <div className="text-3xl font-extrabold text-white">
                {nodes.reduce((sum, n) => sum + (n.stats?.playingPlayers || 0), 0)}
              </div>
            </div>
            <div className="bg-[#1c1c1e]/60 border border-white/5 backdrop-blur-md rounded-2xl p-5">
              <div className="text-gray-400 text-xs font-semibold mb-1 uppercase tracking-wider">Overall Player Count</div>
              <div className="text-3xl font-extrabold text-white">
                {nodes.reduce((sum, n) => sum + (n.stats?.players || 0), 0)}
              </div>
            </div>
          </div>

          {/* Nodes Grid */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white/5 rounded-2xl border border-white/5">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400 mb-4"></div>
              <p className="text-gray-400">Loading nodes details...</p>
            </div>
          ) : nodes.length === 0 ? (
            <div className="text-center py-16 bg-white/5 rounded-2xl border border-white/5 p-6">
              <Server className="w-12 h-12 text-gray-500 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-white mb-2">No Voice Nodes Configured</h3>
              <p className="text-gray-400 text-sm max-w-md mx-auto mb-6">Create and configure your first Nodelink node to start streaming high-fidelity audio streams to users.</p>
              <button
                onClick={handleOpenAddModal}
                className="px-5 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-black font-bold transition-all"
              >
                Add Your First Node
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {nodes.map(node => {
                const mem = getMemoryStats(node.stats);
                const cpu = getCpuStats(node.stats);
                
                return (
                  <div 
                    key={node.id} 
                    className={`bg-[#18181b]/50 border border-white/5 backdrop-blur-md rounded-3xl p-6 relative overflow-hidden transition-all duration-300 hover:border-white/10 hover:shadow-xl ${
                      !node.isActive ? 'opacity-60' : ''
                    }`}
                  >
                    {/* Status Indicator Bar */}
                    <div className={`absolute top-0 left-0 w-full h-[3px] ${
                      !node.isActive ? 'bg-gray-500' :
                      node.connected ? 'bg-emerald-500' : 'bg-rose-500'
                    }`} />

                    {/* Node Identity and Quick Actions */}
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <h3 className="text-xl font-bold text-white flex items-center gap-2.5">
                          <Server className={`w-5 h-5 ${node.connected && node.isActive ? 'text-emerald-400' : 'text-gray-400'}`} />
                          {node.identifier}
                        </h3>
                        <p className="text-gray-400 text-xs font-medium mt-1 font-mono">{node.host}:{node.port}</p>
                      </div>

                      <div className="flex items-center gap-1.5 bg-white/5 border border-white/5 p-1 rounded-xl">
                        <button
                          onClick={() => handleOpenEditModal(node)}
                          className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all flex items-center justify-center"
                          title="Edit Node"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteNode(node.id)}
                          className="p-2 rounded-lg text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all flex items-center justify-center"
                          title="Delete Node"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Routing Badges */}
                    <div className="flex flex-wrap gap-2 mb-6">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        node.userType === 'premium' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                        node.userType === 'normal' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                        'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                      }`}>
                        👑 Routing: {node.userType.toUpperCase()}
                      </span>
                      <span className="px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-[10px] font-bold uppercase tracking-wider">
                        🎯 Priority: {node.priority}
                      </span>
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        !node.isActive ? 'bg-gray-500/10 text-gray-400 border border-gray-500/20' :
                        node.connected ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                        'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}>
                        ● {!node.isActive ? 'DISABLED' : node.connected ? 'ONLINE' : 'OFFLINE'}
                      </span>
                    </div>

                    {/* Active Performance Stats */}
                    {node.connected && node.stats ? (
                      <div className="space-y-4 pt-4 border-t border-white/5">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <div className="text-gray-500 text-xs mb-0.5">Players (Playing)</div>
                            <div className="font-bold text-white">
                              {node.stats.players} <span className="text-xs font-normal text-gray-400">({node.stats.playingPlayers} active)</span>
                            </div>
                          </div>
                          <div>
                            <div className="text-gray-500 text-xs mb-0.5">Uptime</div>
                            <div className="font-bold text-white">{formatUptime(node.stats.uptime)}</div>
                          </div>
                        </div>

                        {/* Memory Bar */}
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-gray-500">Memory Usage</span>
                            <span className="text-gray-300 font-medium">
                              {formatMemory(mem.used)} / {formatMemory(mem.allocated)}
                            </span>
                          </div>
                          <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                            <div 
                              className="bg-cyan-500 h-full rounded-full transition-all duration-300"
                              style={{ width: `${mem.pct}%` }}
                            />
                          </div>
                        </div>

                        {/* CPU System & Nodelink Load */}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-gray-500">System CPU</span>
                              <span className="text-gray-300 font-bold">{(cpu.system * 100).toFixed(1)}%</span>
                            </div>
                            <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                              <div 
                                className="bg-indigo-400 h-full rounded-full transition-all duration-300"
                                style={{ width: `${cpu.system * 100}%` }}
                              />
                            </div>
                          </div>
                          <div>
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-gray-500">Nodelink CPU</span>
                              <span className="text-gray-300 font-bold">{(cpu.process * 100).toFixed(1)}%</span>
                            </div>
                            <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                              <div 
                                className="bg-purple-400 h-full rounded-full transition-all duration-300"
                                style={{ width: `${cpu.process * 100}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="py-6 flex flex-col items-center justify-center bg-black/10 border border-white/5 rounded-2xl text-center">
                        <ShieldAlert className="w-7 h-7 text-rose-500/70 mb-2 animate-bounce" />
                        <p className="text-gray-400 text-sm font-semibold">
                          {!node.isActive ? 'Node Administratively Disabled' : 'No connection established with Nodelink service'}
                        </p>
                        <p className="text-gray-600 text-xs mt-1 px-4">Ensure target host and port are online and correct authorization credentials are matching.</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-[#121214] border border-white/10 p-5 md:p-6 rounded-3xl w-full max-w-lg shadow-2xl relative max-h-[90vh] overflow-y-auto"
          >
            <h2 className="text-2xl font-bold text-white mb-5 flex items-center gap-2">
              <Plus className="w-5 h-5 text-cyan-400" /> Add Nodelink Voice Node
            </h2>
            
            <form onSubmit={handleAddNode} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 text-xs font-semibold mb-1 uppercase tracking-wider">Identifier</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Node-US-East"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-cyan-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 text-xs font-semibold mb-1 uppercase tracking-wider">Priority Weight</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    required
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-cyan-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-400 text-xs font-semibold mb-1 uppercase tracking-wider">Host URL / IP Address</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 127.0.0.1 or nodelink.myserver.com"
                  value={host}
                  onChange={(e) => setHost(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-cyan-500 transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 text-xs font-semibold mb-1 uppercase tracking-wider">Port</label>
                  <input
                    type="number"
                    required
                    placeholder="3008"
                    value={port}
                    onChange={(e) => setPort(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-cyan-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 text-xs font-semibold mb-1 uppercase tracking-wider">SSL (Secure WS)</label>
                  <div className="flex items-center h-[46px] px-3 bg-white/5 border border-white/10 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setSecure(!secure)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        secure ? 'bg-cyan-500 text-black' : 'bg-white/5 text-gray-400'
                      }`}
                    >
                      {secure ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                      {secure ? 'Enabled (wss)' : 'Disabled (ws)'}
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-gray-400 text-xs font-semibold mb-1 uppercase tracking-wider">Authorization Password</label>
                <input
                  type="password"
                  required
                  placeholder="youshallnotpass"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-cyan-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-gray-400 text-xs font-semibold mb-1 uppercase tracking-wider">Target User Group</label>
                <select
                  value={userType}
                  onChange={(e) => setUserType(e.target.value as any)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-cyan-500 transition-colors"
                >
                  <option value="all" className="bg-[#121214]">All Users (Shared Node)</option>
                  <option value="normal" className="bg-[#121214]">Standard/Normal Users Only</option>
                  <option value="premium" className="bg-[#121214]">👑 Premium Tier Users Only</option>
                </select>
              </div>

              <div className="flex gap-3 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-5 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-black font-bold transition-all"
                >
                  Add Node
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-[#121214] border border-white/10 p-5 md:p-6 rounded-3xl w-full max-w-lg shadow-2xl relative max-h-[90vh] overflow-y-auto"
          >
            <h2 className="text-2xl font-bold text-white mb-5 flex items-center gap-2">
              <Edit className="w-5 h-5 text-cyan-400" /> Edit Nodelink Node Configurations
            </h2>
            
            <form onSubmit={handleEditNode} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 text-xs font-semibold mb-1 uppercase tracking-wider">Identifier</label>
                  <input
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-cyan-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 text-xs font-semibold mb-1 uppercase tracking-wider">Priority Weight</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    required
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-cyan-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-400 text-xs font-semibold mb-1 uppercase tracking-wider">Host URL / IP Address</label>
                <input
                  type="text"
                  required
                  value={host}
                  onChange={(e) => setHost(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-cyan-500 transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 text-xs font-semibold mb-1 uppercase tracking-wider">Port</label>
                  <input
                    type="number"
                    required
                    value={port}
                    onChange={(e) => setPort(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-cyan-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 text-xs font-semibold mb-1 uppercase tracking-wider">SSL (Secure WS)</label>
                  <div className="flex items-center h-[46px] px-3 bg-white/5 border border-white/10 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setSecure(!secure)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        secure ? 'bg-cyan-500 text-black' : 'bg-white/5 text-gray-400'
                      }`}
                    >
                      {secure ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                      {secure ? 'Enabled (wss)' : 'Disabled (ws)'}
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-gray-400 text-xs font-semibold mb-1 uppercase tracking-wider">Authorization Password</label>
                <input
                  type="password"
                  placeholder="Enter password (leave as is if no changes)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-cyan-500 transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 text-xs font-semibold mb-1 uppercase tracking-wider">Target User Group</label>
                  <select
                    value={userType}
                    onChange={(e) => setUserType(e.target.value as any)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-cyan-500 transition-colors"
                  >
                    <option value="all">All Users (Shared)</option>
                    <option value="normal">Standard Users Only</option>
                    <option value="premium">👑 Premium Only</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-400 text-xs font-semibold mb-1 uppercase tracking-wider">Administrative Status</label>
                  <select
                    value={isActive ? 'true' : 'false'}
                    onChange={(e) => setIsActive(e.target.value === 'true')}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-cyan-500 transition-colors"
                  >
                    <option value="true">Active (Enabled)</option>
                    <option value="false">Inactive (Disabled)</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-5 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-black font-bold transition-all"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      <Footer />
    </div>
  );
}
