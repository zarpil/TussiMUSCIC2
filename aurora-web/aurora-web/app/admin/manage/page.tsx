'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { UserPlus, Trash2, Shield, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';

export default function ManageAdmins() {
  const router = useRouter();
  const [admins, setAdmins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [newAdminId, setNewAdminId] = useState('');
  const [newAdminUsername, setNewAdminUsername] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const response = await fetch('/api/auth/check-admin', { credentials: 'include' });
        const data = await response.json();
        
        if (data.isAdmin) {
          setIsAdmin(true);
          fetchAdmins();
        } else {
          router.push('/?error=admin_only');
        }
      } catch (error) {
        router.push('/?error=admin_only');
      }
    };

    checkAdmin();
  }, [router]);

  const fetchAdmins = async () => {
    try {
      const socketUrl = (typeof window !== 'undefined' && window.self !== window.top) ? '' : (process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001');
      const response = await fetch(`${socketUrl}/api/admin/list`, { credentials: 'include' });
      const data = await response.json();
      setAdmins(data);
    } catch (error) {
      console.error('Failed to fetch admins:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newAdminId.trim() || !newAdminUsername.trim()) {
      setMessage({ type: 'error', text: 'Please fill in all fields' });
      return;
    }

    try {
      const socketUrl = (typeof window !== 'undefined' && window.self !== window.top) ? '' : (process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001');
      const response = await fetch(`${socketUrl}/api/admin/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          userId: newAdminId.trim(),
          username: newAdminUsername.trim(),
          addedBy: 'admin-panel'
        })
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: 'Admin added successfully!' });
        setNewAdminId('');
        setNewAdminUsername('');
        fetchAdmins();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to add admin' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to add admin' });
    }

    setTimeout(() => setMessage(null), 5000);
  };

  const handleRemoveAdmin = async (userId: string, username: string) => {
    if (!confirm(`Are you sure you want to remove ${username} as admin?`)) {
      return;
    }

    try {
      const socketUrl = (typeof window !== 'undefined' && window.self !== window.top) ? '' : (process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001');
      const response = await fetch(`${socketUrl}/api/admin/remove/${userId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: 'Admin removed successfully!' });
        fetchAdmins();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to remove admin' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to remove admin' });
    }

    setTimeout(() => setMessage(null), 5000);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8 pt-24 md:pt-28">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/admin')}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Admin Dashboard</span>
          </button>
          <h1 className="text-4xl font-bold text-white mb-2">Manage Admins</h1>
          <p className="text-gray-400">Add or remove admin users</p>
        </div>

        {/* Message */}
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mb-6 backdrop-blur-xl rounded-xl p-4 flex items-center gap-3 ${
              message.type === 'success'
                ? 'bg-green-500/20 border border-green-500/50'
                : 'bg-red-500/20 border border-red-500/50'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle className="w-6 h-6 text-green-400" />
            ) : (
              <AlertCircle className="w-6 h-6 text-red-400" />
            )}
            <p className={message.type === 'success' ? 'text-green-200' : 'text-red-200'}>
              {message.text}
            </p>
          </motion.div>
        )}

        {/* Add Admin Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="backdrop-blur-xl bg-white/10 rounded-xl p-6 border border-white/20 mb-8"
        >
          <div className="flex items-center gap-3 mb-4">
            <UserPlus className="w-6 h-6 text-purple-400" />
            <h2 className="text-xl font-bold text-white">Add New Admin</h2>
          </div>

          <form onSubmit={handleAddAdmin} className="space-y-4">
            <div>
              <label className="block text-gray-300 text-sm mb-2">Discord User ID</label>
              <input
                type="text"
                value={newAdminId}
                onChange={(e) => setNewAdminId(e.target.value)}
                placeholder="123456789012345678"
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <p className="text-gray-400 text-xs mt-1">
                Right-click user in Discord → Copy User ID
              </p>
            </div>

            <div>
              <label className="block text-gray-300 text-sm mb-2">Username</label>
              <input
                type="text"
                value={newAdminUsername}
                onChange={(e) => setNewAdminUsername(e.target.value)}
                placeholder="Username#1234"
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <button
              type="submit"
              className="w-full px-6 py-3 bg-purple-500 hover:bg-purple-600 rounded-lg text-white font-semibold transition-colors"
            >
              Add Admin
            </button>
          </form>
        </motion.div>

        {/* Admin List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="backdrop-blur-xl bg-white/10 rounded-xl border border-white/20 overflow-hidden"
        >
          <div className="p-6 border-b border-white/20">
            <div className="flex items-center gap-3">
              <Shield className="w-6 h-6 text-teal-400" />
              <h2 className="text-xl font-bold text-white">Current Admins ({admins.length})</h2>
            </div>
          </div>

          <div className="divide-y divide-white/10">
            {admins.map((admin, index) => (
              <motion.div
                key={admin.userId}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="p-6 hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center text-white font-bold">
                        {admin.username[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="text-white font-semibold">{admin.username}</p>
                        <p className="text-gray-400 text-sm">{admin.userId}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-400 ml-13">
                      <span>Added: {new Date(admin.addedAt).toLocaleDateString()}</span>
                      <span>By: {admin.addedBy}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleRemoveAdmin(admin.userId, admin.username)}
                    className="p-3 rounded-lg bg-red-500/20 hover:bg-red-500/40 text-red-400 transition-colors"
                    title="Remove admin"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </motion.div>
            ))}

            {admins.length === 0 && (
              <div className="p-12 text-center">
                <p className="text-gray-400 text-lg">No admins found</p>
                <p className="text-gray-500 text-sm mt-2">Add your first admin above</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Info Box */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mt-6 backdrop-blur-xl bg-blue-500/10 border border-blue-500/30 rounded-xl p-4"
        >
          <p className="text-blue-200 text-sm">
            <strong>💡 Tip:</strong> Admins can access the admin dashboard, view all servers, and manage bot settings. Changes take effect immediately without restarting.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
