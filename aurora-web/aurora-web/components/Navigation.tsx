'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Home, Music, List, LogOut, Menu, X, PlayCircle, Compass, ListMusic, Sparkles, Ticket } from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { useDiscordSDK } from './DiscordSDKProvider';

interface NavigationProps {
  initialSettings?: {
    siteName?: string;
    navbarIconUrl?: string;
  };
}

export default function Navigation({ initialSettings }: NavigationProps = {}) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Premium States
  const [isPremium, setIsPremium] = useState(false);
  const [premiumSystemActive, setPremiumSystemActive] = useState(false);
  const [redeemModalOpen, setRedeemModalOpen] = useState(false);
  const [redeemCode, setRedeemCode] = useState('');
  const [redeemLoading, setRedeemLoading] = useState(false);
  const [redeemStatus, setRedeemStatus] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const [siteSettings, setSiteSettings] = useState({
    siteName: initialSettings?.siteName ? initialSettings.siteName.toUpperCase() : '',
    navbarIconUrl: initialSettings?.navbarIconUrl || ''
  });

  const { isEmbedded, user: embeddedUser } = useDiscordSDK();

  const checkPremiumStatus = async (userId: string) => {
    try {
      const socketUrl = '';
      const res = await fetch(`${socketUrl}/api/premium/check/${userId}`);
      if (res.ok) {
        const data = await res.json();
        setIsPremium(data.isPremium);
        setPremiumSystemActive(data.systemActive);
      }
    } catch (e) {
      console.error('Error checking premium:', e);
    }
  };

  useEffect(() => {
    // Fetch site settings
    fetch('/api/admin/settings')
      .then(res => res.json())
      .then(data => {
        if (data) {
          if (data.siteName) {
            setSiteSettings({
              siteName: data.siteName.toUpperCase(),
              navbarIconUrl: data.navbarIconUrl || ''
            });
          }
          if (typeof data.premiumEnabled !== 'undefined') {
            setPremiumSystemActive(data.premiumEnabled);
          }
        }
      })
      .catch(() => { });

    if (isEmbedded) {
      if (embeddedUser) {
        setUser(embeddedUser);
        checkPremiumStatus(embeddedUser.id);
        // Check admin
        fetch('/api/auth/check-admin', { credentials: 'include' })
          .then(res => res.json())
          .then(adminData => {
            if (adminData.isAdmin) setIsAdmin(true);
          })
          .catch(() => { });
      }
    } else {
      fetch('/api/auth/user', { credentials: 'include' })
        .then(res => res.json())
        .then(data => {
          if (data.id) {
            setUser(data);
            checkPremiumStatus(data.id);
            // Check if user is admin
            fetch('/api/auth/check-admin', { credentials: 'include' })
              .then(res => res.json())
              .then(adminData => {
                if (adminData.isAdmin) setIsAdmin(true);
              })
              .catch(() => { });
          }
        })
        .catch(() => { });
    }
  }, [isEmbedded, embeddedUser]);

  useEffect(() => {
    const handleSettingsUpdate = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        setSiteSettings({
          siteName: customEvent.detail.siteName.toUpperCase(),
          navbarIconUrl: customEvent.detail.navbarIconUrl || ''
        });
      }
    };

    const handlePremiumActivated = () => {
      if (user) checkPremiumStatus(user.id);
    };

    window.addEventListener('siteSettingsUpdated', handleSettingsUpdate);
    window.addEventListener('premium-activated', handlePremiumActivated);
    return () => {
      window.removeEventListener('siteSettingsUpdated', handleSettingsUpdate);
      window.removeEventListener('premium-activated', handlePremiumActivated);
    };
  }, [user]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    setIsAdmin(false);
    setIsPremium(false);
    router.push('/');
  };

  const handleRedeemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!redeemCode.trim() || !user) return;
    setRedeemLoading(true);
    setRedeemStatus(null);
    try {
      const socketUrl = '';
      const response = await fetch(`${socketUrl}/api/premium/redeem`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          username: user.username,
          code: redeemCode.trim()
        })
      });
      const data = await response.json();
      if (response.ok) {
        setRedeemStatus({ type: 'success', text: data.message });
        setIsPremium(true);
        setRedeemCode('');
        window.dispatchEvent(new CustomEvent('premium-activated'));
        setTimeout(() => {
          setRedeemModalOpen(false);
          setRedeemStatus(null);
        }, 2000);
      } else {
        setRedeemStatus({ type: 'error', text: data.error || 'Failed to redeem code' });
      }
    } catch (err) {
      setRedeemStatus({ type: 'error', text: 'Connection error' });
    } finally {
      setRedeemLoading(false);
    }
  };

  // Only show Premium Tab if premium restrictions are ON and the user is NOT premium yet
  const showPremiumTab = premiumSystemActive && !isPremium;

  const navItems = [
    { href: '/', label: 'Home', icon: Home },
    ...(showPremiumTab ? [{ href: '/premium', label: 'Premium', icon: Sparkles }] : []),
    ...(isAdmin ? [{ href: '/admin', label: 'Admin', icon: Music }] : []),
    { href: '/commands', label: 'Commands', icon: List },
  ];

  return (
    <>
      <div className="fixed top-0 w-full z-50 flex justify-center pt-4 px-4 pointer-events-none">
        <nav
          className={`pointer-events-auto w-full max-w-5xl backdrop-blur-xl bg-white/5 border border-white/10 transition-all duration-300 ${
            mobileMenuOpen ? 'rounded-3xl' : 'rounded-full'
          }`}
        >
          <div className="px-4 sm:px-8">
            <div className="flex items-center justify-between h-16">
              {/* Logo */}
              <div
                className="flex items-center gap-3 cursor-pointer group"
                onClick={() => router.push('/')}
              >
                <div className="relative w-10 h-10 transition-transform group-hover:scale-110 flex items-center justify-center">
                  {siteSettings.navbarIconUrl ? (
                    <img
                      src={siteSettings.navbarIconUrl}
                      alt={`${siteSettings.siteName || 'Site'} Logo`}
                      className="w-10 h-10 object-cover rounded-full"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center">
                      <Music className="w-5 h-5 text-cyan-400" />
                    </div>
                  )}
                </div>
                {siteSettings.siteName && (
                  <span className="text-white font-bold text-xl tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
                    {siteSettings.siteName}
                  </span>
                )}
              </div>

              {/* Desktop Navigation Links */}
              <div className="hidden md:flex items-center gap-1 p-1 bg-white/5 rounded-xl border border-white/5">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <button
                      key={item.href}
                      onClick={() => router.push(item.href)}
                      className={`relative flex items-center gap-2 px-4 py-2 rounded-lg transition-all z-10 ${isActive ? 'text-white' : 'text-gray-400 hover:text-white'
                        }`}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="nav-pill"
                          className="absolute inset-0 bg-cyan-750/30 border border-cyan-500/20 backdrop-blur-md rounded-lg -z-10"
                          transition={{ type: "spring", stiffness: 400, damping: 30 }}
                        />
                      )}
                      <Icon className="w-4 h-4 text-cyan-400" />
                      <span className="font-medium text-sm tracking-wide">{item.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* User Menu */}
              <div className="flex items-center gap-4">
                <div className="hidden md:flex items-center gap-3">
                  {user ? (
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        {user.avatar ? (
                          <img
                            src={`https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=32`}
                            alt={user.username}
                            className={`w-8 h-8 rounded-full border-2 ${
                              isPremium && premiumSystemActive
                                ? 'border-amber-400 ring-2 ring-amber-400/40 shadow-[0_0_10px_rgba(251,191,36,0.6)]'
                                : 'border-white/10'
                            }`}
                          />
                        ) : (
                          <div className={`w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-white text-xs font-bold border-2 ${
                            isPremium && premiumSystemActive
                              ? 'border-amber-400 ring-2 ring-amber-400/40 shadow-[0_0_10px_rgba(251,191,36,0.6)]'
                              : 'border-white/10'
                          }`}>
                            {user.username[0].toUpperCase()}
                          </div>
                        )}
                        <span className={`text-sm font-medium ${
                          isPremium && premiumSystemActive
                            ? "text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)] font-black animate-pulse"
                            : "text-white"
                        }`}>
                          {user.username}
                        </span>
                        {isPremium && premiumSystemActive && (
                          <span className="bg-gradient-to-r from-amber-400 to-yellow-500 text-black text-[9px] font-black uppercase px-1 py-0.5 rounded tracking-wider flex items-center gap-0.5 h-4 select-none ml-1">
                            👑 Prem
                          </span>
                        )}
                      </div>
                      


                      <button
                        onClick={handleLogout}
                        className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                        title="Logout"
                      >
                        <LogOut className="w-5 h-5 text-white" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => window.location.href = '/api/auth/discord'}
                      className="px-5 py-2 bg-white text-black hover:bg-gray-200 rounded-xl font-bold transition-all hover:scale-105"
                    >
                      Login
                    </button>
                  )}
                </div>

                {/* Mobile Menu Button */}
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="md:hidden p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-all border border-white/5"
                >
                  {mobileMenuOpen ? (
                    <X className="w-6 h-6 text-white" />
                  ) : (
                    <Menu className="w-6 h-6 text-white" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Mobile Menu */}
          <AnimatePresence>
            {mobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="md:hidden overflow-hidden border-t border-white/10 bg-black/40 backdrop-blur-3xl"
              >
                <div className="px-4 py-4 space-y-2">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;
                    return (
                      <button
                        key={item.href}
                        onClick={() => {
                          if (item.href) router.push(item.href);
                          setMobileMenuOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive
                            ? 'bg-black text-white'
                            : 'text-gray-300 hover:bg-white/10'
                          }`}
                      >
                        <Icon className="w-5 h-5 text-cyan-400" />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}

                  {user && (
                    <>
                      <div className="border-t border-white/20 my-2"></div>
                      <div className="flex items-center justify-between px-4 py-3">
                        <div className="flex items-center gap-3">
                          {user.avatar ? (
                            <img
                              src={`https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=32`}
                              alt={user.username}
                              className={`w-8 h-8 rounded-full border-2 ${
                                isPremium && premiumSystemActive
                                  ? 'border-amber-400 ring-2 ring-amber-400/40 shadow-[0_0_10px_rgba(251,191,36,0.6)]'
                                  : 'border-white/10'
                              }`}
                            />
                          ) : (
                            <div className={`w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-white text-sm font-bold border-2 ${
                              isPremium && premiumSystemActive
                                ? 'border-amber-400 ring-2 ring-amber-400/40 shadow-[0_0_10px_rgba(251,191,36,0.6)]'
                                : 'border-white/10'
                            }`}>
                              {user.username[0].toUpperCase()}
                            </div>
                          )}
                          <span className={`font-semibold ${
                            isPremium && premiumSystemActive
                              ? "text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)] font-black animate-pulse"
                              : "text-white"
                          }`}>
                            {user.username}
                          </span>
                          {isPremium && premiumSystemActive && (
                            <span className="bg-gradient-to-r from-amber-400 to-yellow-500 text-black text-[9px] font-black uppercase px-1 py-0.5 rounded tracking-wider flex items-center gap-0.5 h-4 select-none">
                              👑 Prem
                            </span>
                          )}
                        </div>

                      </div>
                      <button
                        onClick={() => {
                          handleLogout();
                          setMobileMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-white/10 transition-all font-semibold"
                      >
                        <LogOut className="w-5 h-5 text-red-400" />
                        <span>Logout</span>
                      </button>
                    </>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </nav>
      </div>


    </>
  );
}
