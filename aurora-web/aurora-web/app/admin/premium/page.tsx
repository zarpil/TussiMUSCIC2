'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { UserPlus, Trash2, Shield, AlertCircle, CheckCircle, ArrowLeft, Ticket, PlusCircle, RefreshCw, Key, Settings } from 'lucide-react';

export default function ManagePremium() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'users' | 'codes' | 'settings'>('users');
  const [premiumUsers, setPremiumUsers] = useState<any[]>([]);
  const [premiumCodes, setPremiumCodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // Form states - Add user
  const [newUserId, setNewUserId] = useState('');
  const [newUserTag, setNewUserTag] = useState('');
  const [newDurationDays, setNewDurationDays] = useState('30');

  // Form states - Generate Codes
  const [codeDurationDays, setCodeDurationDays] = useState('30');
  const [codeCount, setCodeCount] = useState('5');

  // Form states - Premium Settings
  const [premiumEnabled, setPremiumEnabled] = useState(false);
  const [premiumPrice, setPremiumPrice] = useState('299');
  const [premiumCurrency, setPremiumCurrency] = useState('INR');
  const [premiumCurrencySymbol, setPremiumCurrencySymbol] = useState('Rs.');
  const [razorpayKeyId, setRazorpayKeyId] = useState('');
  const [razorpayKeySecret, setRazorpayKeySecret] = useState('');
  const [premiumSupportLink, setPremiumSupportLink] = useState('https://discord.gg/zTTMRnU9G');
  const [savingSettings, setSavingSettings] = useState(false);

  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const response = await fetch('/api/auth/check-admin', { credentials: 'include' });
        const data = await response.json();

        if (data.isAdmin) {
          setIsAdmin(true);
          fetchData();
        } else {
          router.push('/?error=admin_only');
        }
      } catch (error) {
        router.push('/?error=admin_only');
      }
    };

    checkAdmin();
  }, [router]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const socketUrl = (typeof window !== 'undefined' && window.self !== window.top) ? '' : (process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001');
      const [usersRes, codesRes, settingsRes] = await Promise.all([
        fetch(`${socketUrl}/api/premium/users/list`, { credentials: 'include' }),
        fetch(`${socketUrl}/api/premium/codes/list`, { credentials: 'include' }),
        fetch('/api/admin/settings', { credentials: 'include' })
      ]);

      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setPremiumUsers(usersData);
      }
      if (codesRes.ok) {
        const codesData = await codesRes.json();
        setPremiumCodes(codesData);
      }
      if (settingsRes.ok) {
        const settingsData = await settingsRes.json();
        setPremiumEnabled(!!settingsData.premiumEnabled);
        setPremiumPrice(String(settingsData.premiumPrice ?? '299'));
        setPremiumCurrency(settingsData.premiumCurrency || 'INR');
        setPremiumCurrencySymbol(settingsData.premiumCurrencySymbol || 'Rs.');
        setRazorpayKeyId(settingsData.razorpayKeyId || '');
        setRazorpayKeySecret(settingsData.razorpayKeySecret || '');
        setPremiumSupportLink(settingsData.premiumSupportLink || 'https://discord.gg/zTTMRnU9G');
      }
    } catch (error) {
      console.error('Failed to fetch premium data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          premiumEnabled,
          premiumPrice: Number(premiumPrice) || 299,
          premiumCurrency,
          premiumCurrencySymbol: premiumCurrencySymbol.trim() || 'Rs.',
          razorpayKeyId: razorpayKeyId.trim(),
          razorpayKeySecret: razorpayKeySecret.trim(),
          premiumSupportLink: premiumSupportLink.trim(),
        })
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Premium settings saved successfully!' });
      } else {
        const data = await response.json();
        setMessage({ type: 'error', text: data.error || 'Failed to save settings' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to save settings due to a connection error' });
    } finally {
      setSavingSettings(false);
      setTimeout(() => setMessage(null), 5000);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserId.trim() || !newUserTag.trim()) {
      setMessage({ type: 'error', text: 'Please fill in all fields' });
      return;
    }

    try {
      const socketUrl = (typeof window !== 'undefined' && window.self !== window.top) ? '' : (process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001');
      const response = await fetch(`${socketUrl}/api/premium/users/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          userId: newUserId.trim(),
          username: newUserTag.trim(),
          durationDays: parseInt(newDurationDays) || 0,
          addedBy: 'admin-panel'
        })
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: 'Premium user added successfully!' });
        setNewUserId('');
        setNewUserTag('');
        fetchData();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to add premium user' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to add premium user' });
    }
    setTimeout(() => setMessage(null), 5000);
  };

  const handleRemoveUser = async (userId: string, tag: string) => {
    if (!confirm(`Are you sure you want to remove premium from ${tag}?`)) {
      return;
    }

    try {
      const socketUrl = (typeof window !== 'undefined' && window.self !== window.top) ? '' : (process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001');
      const response = await fetch(`${socketUrl}/api/premium/users/remove/${userId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Premium status removed successfully!' });
        fetchData();
      } else {
        const data = await response.json();
        setMessage({ type: 'error', text: data.error || 'Failed to remove user' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to remove user' });
    }
    setTimeout(() => setMessage(null), 5000);
  };

  const handleGenerateCodes = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const socketUrl = (typeof window !== 'undefined' && window.self !== window.top) ? '' : (process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001');
      const response = await fetch(`${socketUrl}/api/premium/codes/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          durationDays: parseInt(codeDurationDays) || 30,
          count: parseInt(codeCount) || 5,
          createdBy: 'admin-panel'
        })
      });

      if (response.ok) {
        setMessage({ type: 'success', text: `Successfully generated ${codeCount} codes!` });
        fetchData();
      } else {
        const data = await response.json();
        setMessage({ type: 'error', text: data.error || 'Failed to generate codes' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to generate codes' });
    }
    setTimeout(() => setMessage(null), 5000);
  };

  const handleRemoveCode = async (code: string) => {
    if (!confirm(`Are you sure you want to delete the code ${code}?`)) {
      return;
    }

    try {
      const socketUrl = (typeof window !== 'undefined' && window.self !== window.top) ? '' : (process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001');
      const response = await fetch(`${socketUrl}/api/premium/codes/remove/${code}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Code deleted successfully!' });
        fetchData();
      } else {
        const data = await response.json();
        setMessage({ type: 'error', text: data.error || 'Failed to delete code' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to delete code' });
    }
    setTimeout(() => setMessage(null), 5000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a1a] flex items-center justify-center">
        <div className="text-white text-xl flex items-center gap-3">
          <RefreshCw className="animate-spin text-purple-500 w-6 h-6" />
          <span>Loading premium management...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a1a] text-white p-4 md:p-8 pt-24 md:pt-28">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/admin')}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4 group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span>Back to Admin Dashboard</span>
          </button>
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 mb-2">
            Premium Management
          </h1>
          <p className="text-gray-400">Add premium users, configure activations, and generate redeemable codes</p>
        </div>

        {/* Message */}
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mb-6 rounded-xl p-4 flex items-center gap-3 border ${message.type === 'success'
                ? 'bg-green-500/10 border-green-500/30 text-green-300'
                : 'bg-red-500/10 border-red-500/30 text-red-300'
              }`}
          >
            {message.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            )}
            <p className="text-sm font-medium">{message.text}</p>
          </motion.div>
        )}

        {/* Sub Navigation Tabs */}
        <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 mb-8 max-w-md">
          <button
            onClick={() => setActiveTab('users')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${activeTab === 'users' ? 'bg-amber-500 text-black' : 'text-gray-400 hover:text-white'
              }`}
          >
            <Shield className="w-4 h-4" />
            Premium Users
          </button>
          <button
            onClick={() => setActiveTab('codes')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${activeTab === 'codes' ? 'bg-amber-500 text-black' : 'text-gray-400 hover:text-white'
              }`}
          >
            <Ticket className="w-4 h-4" />
            Redeem Codes
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${activeTab === 'settings' ? 'bg-amber-500 text-black' : 'text-gray-400 hover:text-white'
              }`}
          >
            <Settings className="w-4 h-4" />
            Settings
          </button>
        </div>

        {activeTab === 'users' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Add User Panel */}
            <div className="lg:col-span-1">
              <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 shadow-2xl">
                <div className="flex items-center gap-2 mb-4">
                  <UserPlus className="w-5 h-5 text-amber-400" />
                  <h2 className="text-lg font-bold">Add Premium User</h2>
                </div>
                <form onSubmit={handleAddUser} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs text-gray-400 font-bold uppercase tracking-wider">Discord User ID</label>
                    <input
                      type="text"
                      placeholder="e.g. 775429424979378216"
                      value={newUserId}
                      onChange={(e) => setNewUserId(e.target.value)}
                      className="w-full px-4 py-2.5 bg-black/40 border border-white/15 rounded-xl text-white focus:outline-none focus:border-amber-400 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-gray-400 font-bold uppercase tracking-wider">Username</label>
                    <input
                      type="text"
                      placeholder="e.g. saravanan"
                      value={newUserTag}
                      onChange={(e) => setNewUserTag(e.target.value)}
                      className="w-full px-4 py-2.5 bg-black/40 border border-white/15 rounded-xl text-white focus:outline-none focus:border-amber-400 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-gray-400 font-bold uppercase tracking-wider">Duration</label>
                    <select
                      value={newDurationDays}
                      onChange={(e) => setNewDurationDays(e.target.value)}
                      className="w-full px-4 py-2.5 bg-black/40 border border-white/15 rounded-xl text-white focus:outline-none focus:border-amber-400 text-sm"
                    >
                      <option value="30" className="bg-[#0a0a1a]">30 Days</option>
                      <option value="90" className="bg-[#0a0a1a]">90 Days</option>
                      <option value="365" className="bg-[#0a0a1a]">1 Year</option>
                      <option value="0" className="bg-[#0a0a1a]">Lifetime / Permanent</option>
                    </select>
                  </div>
                  <button
                    type="submit"
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-amber-500 hover:bg-amber-600 active:scale-95 text-black font-bold rounded-xl transition-all text-sm cursor-pointer shadow-lg shadow-amber-500/10"
                  >
                    <PlusCircle className="w-4 h-4" />
                    Grant Premium
                  </button>
                </form>
              </div>
            </div>

            {/* List Panel */}
            <div className="lg:col-span-2">
              <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 shadow-2xl">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold">Premium Users Directory ({premiumUsers.length})</h2>
                  <button onClick={fetchData} className="p-1.5 hover:bg-white/5 rounded-lg transition-colors">
                    <RefreshCw className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b border-white/10 text-left text-xs text-gray-400 uppercase font-bold tracking-wider">
                        <th className="py-3 px-4">User</th>
                        <th className="py-3 px-4">Discord ID</th>
                        <th className="py-3 px-4">Added On</th>
                        <th className="py-3 px-4">Expires</th>
                        <th className="py-3 px-4">Source</th>
                        <th className="py-3 px-4 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {premiumUsers.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-gray-500 text-sm">
                            No premium users found. Grant premium or redeem codes to see them here!
                          </td>
                        </tr>
                      ) : (
                        premiumUsers.map((user) => (
                          <tr key={user._id} className="border-b border-white/5 hover:bg-white/5 transition-colors text-sm">
                            <td className="py-3 px-4 font-semibold text-amber-300">{user.username}</td>
                            <td className="py-3 px-4 text-gray-400">{user.userId}</td>
                            <td className="py-3 px-4 text-gray-300">
                              {user.addedAt ? new Date(user.addedAt).toLocaleDateString() : new Date(user.createdAt).toLocaleDateString()}
                            </td>
                            <td className="py-3 px-4 text-gray-300">
                              {user.expiresAt ? new Date(user.expiresAt).toLocaleDateString() : 'Lifetime 🌟'}
                            </td>
                            <td className="py-3 px-4">
                              {user.addedBy === 'razorpay_checkout' ? (
                                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Razorpay 💳</span>
                              ) : user.addedBy === 'coupon_redeem' ? (
                                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">Coupon 🏷️</span>
                              ) : user.addedBy === 'redeem_code' ? (
                                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">Redeem Code 🎟️</span>
                              ) : (
                                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-500/10 text-gray-400 border border-gray-500/20">Manual/Admin 🛡️</span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <button
                                onClick={() => handleRemoveUser(user.userId, user.username)}
                                className="p-1.5 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                                title="Revoke Premium"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Generate Codes Panel */}
            <div className="lg:col-span-1">
              <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 shadow-2xl">
                <div className="flex items-center gap-2 mb-4">
                  <Key className="w-5 h-5 text-amber-400" />
                  <h2 className="text-lg font-bold">Generate Codes</h2>
                </div>
                <form onSubmit={handleGenerateCodes} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs text-gray-400 font-bold uppercase tracking-wider">Duration</label>
                    <select
                      value={codeDurationDays}
                      onChange={(e) => setCodeDurationDays(e.target.value)}
                      className="w-full px-4 py-2.5 bg-black/40 border border-white/15 rounded-xl text-white focus:outline-none focus:border-amber-400 text-sm"
                    >
                      <option value="30" className="bg-[#0a0a1a]">30 Days</option>
                      <option value="90" className="bg-[#0a0a1a]">90 Days</option>
                      <option value="365" className="bg-[#0a0a1a]">1 Year</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-gray-400 font-bold uppercase tracking-wider">How many codes?</label>
                    <input
                      type="number"
                      placeholder="e.g. 5"
                      min="1"
                      max="50"
                      value={codeCount}
                      onChange={(e) => setCodeCount(e.target.value)}
                      className="w-full px-4 py-2.5 bg-black/40 border border-white/15 rounded-xl text-white focus:outline-none focus:border-amber-400 text-sm"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-amber-500 hover:bg-amber-600 active:scale-95 text-black font-bold rounded-xl transition-all text-sm cursor-pointer shadow-lg shadow-amber-500/10"
                  >
                    <PlusCircle className="w-4 h-4" />
                    Generate Codes
                  </button>
                </form>
              </div>
            </div>

            {/* List Codes Panel */}
            <div className="lg:col-span-2">
              <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 shadow-2xl">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold">Generated Redeem Codes ({premiumCodes.length})</h2>
                  <button onClick={fetchData} className="p-1.5 hover:bg-white/5 rounded-lg transition-colors">
                    <RefreshCw className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
                <div className="overflow-x-auto max-h-[480px] custom-scrollbar-vertical">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b border-white/10 text-left text-xs text-gray-400 uppercase font-bold tracking-wider sticky top-0 bg-[#16162a] z-10">
                        <th className="py-3 px-4">Code</th>
                        <th className="py-3 px-4">Duration</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {premiumCodes.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-8 text-center text-gray-500 text-sm">
                            No redeem codes generated yet. Generate some on the left!
                          </td>
                        </tr>
                      ) : (
                        premiumCodes.map((codeDoc) => (
                          <tr key={codeDoc._id} className="border-b border-white/5 hover:bg-white/5 transition-colors text-sm">
                            <td className="py-3 px-4 font-mono font-bold text-gray-100 select-all">{codeDoc.code}</td>
                            <td className="py-3 px-4 text-gray-300">{codeDoc.durationDays} Days</td>
                            <td className="py-3 px-4">
                              {codeDoc.isRedeemed ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-400/10 text-red-400">
                                  Redeemed by {codeDoc.redeemedBy}
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-400/10 text-green-400">
                                  Active (Unredeemed)
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <button
                                onClick={() => handleRemoveCode(codeDoc.code)}
                                className="p-1.5 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                                title="Delete Code"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8 shadow-2xl space-y-6"
          >
            <div className="flex items-center gap-3 border-b border-white/10 pb-4">
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl">
                <Settings className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Premium Checkout Settings</h2>
                <p className="text-gray-400 text-xs mt-0.5">Configure Razorpay credentials, price details, or fallback redirect links</p>
              </div>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-6">
              {/* Toggle Switch */}
              <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-2xl">
                <div className="space-y-0.5">
                  <h3 className="text-sm font-bold text-gray-200">Enforce Premium Features</h3>
                  <p className="text-[10px] text-gray-400">If disabled, all users can use custom themes, draggable player widgets, custom playlists, and liked songs without limits.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={premiumEnabled}
                    onChange={(e) => setPremiumEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                </label>
              </div>

              <div className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Price */}
                  <div className="space-y-1.5 min-w-0">
                    <label className="text-xs text-gray-300 font-bold uppercase tracking-wider block truncate">
                      Premium Price ({premiumCurrencySymbol})
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 299"
                      value={premiumPrice}
                      onChange={(e) => setPremiumPrice(e.target.value)}
                      className="w-full px-4 py-2.5 bg-black/40 border border-white/15 rounded-xl text-white focus:outline-none focus:border-amber-400 text-sm"
                    />
                    <p className="text-[10px] text-gray-500">Amount users pay for 30-day plan.</p>
                  </div>

                  {/* Currency Preset Selector */}
                  <div className="space-y-1.5 min-w-0">
                    <label className="text-xs text-gray-300 font-bold uppercase tracking-wider block truncate">
                      Currency & Symbol
                    </label>
                    <div className="flex gap-2 min-w-0">
                      <select
                        value={premiumCurrency}
                        onChange={(e) => {
                          const code = e.target.value;
                          setPremiumCurrency(code);
                          const symbols: Record<string, string> = {
                            INR: 'Rs.',
                            USD: '$',
                            EUR: '€',
                            GBP: '£',
                            BRL: 'R$',
                            CAD: '$',
                            AUD: '$',
                            JPY: '¥'
                          };
                          if (symbols[code]) {
                            setPremiumCurrencySymbol(symbols[code]);
                          }
                        }}
                        className="bg-black/40 border border-white/15 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-amber-400 text-xs sm:text-sm flex-1 min-w-0 cursor-pointer truncate"
                      >
                        <option value="INR" className="bg-gray-900 text-white">INR (Rs.) - Indian Rupee</option>
                        <option value="USD" className="bg-gray-900 text-white">USD ($) - US Dollar</option>
                        <option value="EUR" className="bg-gray-900 text-white">EUR (€) - Euro</option>
                        <option value="GBP" className="bg-gray-900 text-white">GBP (£) - British Pound</option>
                        <option value="BRL" className="bg-gray-900 text-white">BRL (R$) - Brazilian Real</option>
                        <option value="CAD" className="bg-gray-900 text-white">CAD ($) - Canadian Dollar</option>
                        <option value="AUD" className="bg-gray-900 text-white">AUD ($) - Australian Dollar</option>
                        <option value="JPY" className="bg-gray-900 text-white">JPY (¥) - Japanese Yen</option>
                      </select>

                      <input
                        type="text"
                        placeholder="Symbol"
                        value={premiumCurrencySymbol}
                        onChange={(e) => setPremiumCurrencySymbol(e.target.value)}
                        className="w-16 sm:w-20 shrink-0 px-2 sm:px-3 py-2.5 bg-black/40 border border-white/15 rounded-xl text-white focus:outline-none focus:border-amber-400 text-xs sm:text-sm font-mono text-center"
                        title="Custom Currency Symbol"
                      />
                    </div>
                    <p className="text-[10px] text-gray-500">Select currency code or custom symbol.</p>
                  </div>
                </div>

                {/* Support Link */}
                <div className="space-y-1.5 min-w-0">
                  <label className="text-xs text-gray-300 font-bold uppercase tracking-wider block truncate">
                    Server/Invite Redirect Link
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. https://discord.gg/invite"
                    value={premiumSupportLink}
                    onChange={(e) => setPremiumSupportLink(e.target.value)}
                    className="w-full px-4 py-2.5 bg-black/40 border border-white/15 rounded-xl text-white focus:outline-none focus:border-amber-400 text-sm"
                  />
                  <p className="text-[10px] text-gray-500">Fallback server link when gateway unconfigured.</p>
                </div>
              </div>

              {/* Credentials Box */}
              <div className="bg-amber-500/5 border border-amber-500/10 rounded-2xl p-5 space-y-4">
                <h3 className="text-xs font-bold text-amber-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Key className="w-4 h-4" /> Razorpay API Credentials (Optional)
                </h3>
                <p className="text-[11px] text-gray-400 leading-relaxed">
                  Provide credentials below to enable live dashboard checkout payments. Leave blank to fallback and redirect payments to the server invite link instead.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Razorpay Key ID</label>
                    <input
                      type="text"
                      placeholder="rzp_live_..."
                      value={razorpayKeyId}
                      onChange={(e) => setRazorpayKeyId(e.target.value)}
                      className="w-full px-3 py-2 bg-black/50 border border-white/10 rounded-lg text-white font-mono focus:outline-none focus:border-amber-400 text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Razorpay Key Secret</label>
                    <input
                      type="password"
                      placeholder="••••••••••••••••"
                      value={razorpayKeySecret}
                      onChange={(e) => setRazorpayKeySecret(e.target.value)}
                      className="w-full px-3 py-2 bg-black/50 border border-white/10 rounded-lg text-white font-mono focus:outline-none focus:border-amber-400 text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2 border-t border-white/5">
                <button
                  type="submit"
                  disabled={savingSettings}
                  className="flex items-center gap-2 px-6 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:bg-gray-700 text-black font-bold rounded-xl transition-all cursor-pointer text-sm shadow-md"
                >
                  {savingSettings ? 'Saving Settings...' : 'Save Settings'}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </div>
    </div>
  );
}
