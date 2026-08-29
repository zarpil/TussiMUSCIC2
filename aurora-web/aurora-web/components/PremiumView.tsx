'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, Check, X, Shield, ArrowRight, Paintbrush, Sliders, Heart, 
  ListMusic, Move, Ticket, Play, Pause, SkipForward, SkipBack, Repeat, 
  Shuffle, Disc, Keyboard, Music, Eye, RefreshCw, Volume2, Crown, Zap, 
  PictureInPicture2, Radio, CheckCircle2, Lock, Flame
} from 'lucide-react';
import ToastContainer from './ToastContainer';

interface ToastData {
  id: number;
  message: string;
  type: 'success' | 'error' | 'warning';
}

export const PREMIUM_THEMES = [
  { id: 'aurora', name: 'Aurora Emerald', color: '#10b981', gradient: 'radial-gradient(circle at 50% 30%, rgba(16, 185, 129, 0.45) 0%, rgba(168, 85, 247, 0.15) 50%, rgba(5, 5, 12, 0.95) 100%)' },
  { id: 'cosmic', name: 'Cosmic Nebula', color: '#a855f7', gradient: 'radial-gradient(circle at 50% 30%, rgba(168, 85, 247, 0.45) 0%, rgba(59, 130, 246, 0.2) 50%, rgba(5, 5, 12, 0.95) 100%)' },
  { id: 'sunset', name: 'Vaporwave Sunset', color: '#f97316', gradient: 'radial-gradient(circle at 50% 30%, rgba(249, 115, 22, 0.45) 0%, rgba(236, 72, 153, 0.2) 50%, rgba(5, 5, 12, 0.95) 100%)' },
  { id: 'ocean', name: 'Electric Sapphire', color: '#06b6d4', gradient: 'radial-gradient(circle at 50% 30%, rgba(6, 182, 212, 0.45) 0%, rgba(59, 130, 246, 0.2) 50%, rgba(5, 5, 12, 0.95) 100%)' },
  { id: 'forest', name: 'Deep Oasis', color: '#059669', gradient: 'radial-gradient(circle at 50% 30%, rgba(5, 150, 105, 0.45) 0%, rgba(16, 185, 129, 0.15) 50%, rgba(5, 5, 12, 0.95) 100%)' },
  { id: 'gold', name: 'Golden Aura', color: '#fbbf24', gradient: 'radial-gradient(circle at 50% 30%, rgba(251, 191, 36, 0.5) 0%, rgba(217, 119, 6, 0.25) 50%, rgba(5, 5, 12, 0.95) 100%)' },
  { id: 'synthwave', name: 'Synthwave Night', color: '#ec4899', gradient: 'radial-gradient(circle at 50% 30%, rgba(236, 72, 153, 0.45) 0%, rgba(147, 51, 234, 0.2) 50%, rgba(5, 5, 12, 0.95) 100%)' },
  { id: 'acid', name: 'Acid Cyberpunk', color: '#eab308', gradient: 'radial-gradient(circle at 50% 30%, rgba(234, 250, 6, 0.45) 0%, rgba(34, 197, 94, 0.2) 50%, rgba(5, 5, 12, 0.95) 100%)' },
  { id: 'cotton', name: 'Cotton Candy', color: '#f472b6', gradient: 'radial-gradient(circle at 50% 30%, rgba(244, 114, 182, 0.45) 0%, rgba(56, 189, 248, 0.25) 50%, rgba(5, 5, 12, 0.95) 100%)' },
  { id: 'tokyo', name: 'Tokyo Neon', color: '#818cf8', gradient: 'radial-gradient(circle at 50% 30%, rgba(129, 140, 248, 0.45) 0%, rgba(236, 72, 153, 0.2) 50%, rgba(5, 5, 12, 0.95) 100%)' },
  { id: 'ruby', name: 'Ruby Passion', color: '#ef4444', gradient: 'radial-gradient(circle at 50% 30%, rgba(239, 68, 68, 0.45) 0%, rgba(185, 28, 28, 0.2) 50%, rgba(5, 5, 12, 0.95) 100%)' },
  { id: 'emerald', name: 'Emerald Velvet', color: '#10b981', gradient: 'radial-gradient(circle at 50% 30%, rgba(16, 185, 129, 0.4) 0%, rgba(4, 120, 87, 0.2) 50%, rgba(5, 5, 12, 0.95) 100%)' },
  { id: 'midnight', name: 'Midnight Violet', color: '#6366f1', gradient: 'radial-gradient(circle at 50% 30%, rgba(99, 102, 241, 0.45) 0%, rgba(30, 27, 75, 0.3) 50%, rgba(5, 5, 12, 0.95) 100%)' },
  { id: 'solar', name: 'Solar Flare', color: '#f59e0b', gradient: 'radial-gradient(circle at 50% 30%, rgba(245, 158, 11, 0.5) 0%, rgba(239, 68, 68, 0.2) 50%, rgba(5, 5, 12, 0.95) 100%)' },
  { id: 'glacier', name: 'Glacier Cyan', color: '#38bdf8', gradient: 'radial-gradient(circle at 50% 30%, rgba(56, 189, 248, 0.45) 0%, rgba(14, 165, 233, 0.2) 50%, rgba(5, 5, 12, 0.95) 100%)' },
  { id: 'amethyst', name: 'Royal Amethyst', color: '#c084fc', gradient: 'radial-gradient(circle at 50% 30%, rgba(192, 132, 252, 0.45) 0%, rgba(126, 34, 206, 0.2) 50%, rgba(5, 5, 12, 0.95) 100%)' },
  { id: 'obsidian', name: 'Obsidian Stealth', color: '#9ca3af', gradient: 'radial-gradient(circle at 50% 30%, rgba(156, 163, 175, 0.35) 0%, rgba(31, 41, 55, 0.3) 50%, rgba(5, 5, 12, 0.95) 100%)' },
  { id: 'rose', name: 'Rose Gold', color: '#fb7185', gradient: 'radial-gradient(circle at 50% 30%, rgba(251, 113, 133, 0.45) 0%, rgba(244, 63, 94, 0.2) 50%, rgba(5, 5, 12, 0.95) 100%)' },
  { id: 'lime', name: 'Electric Lime', color: '#84cc16', gradient: 'radial-gradient(circle at 50% 30%, rgba(132, 204, 22, 0.45) 0%, rgba(101, 163, 13, 0.2) 50%, rgba(5, 5, 12, 0.95) 100%)' },
  { id: 'magma', name: 'Magma Glow', color: '#dc2626', gradient: 'radial-gradient(circle at 50% 30%, rgba(220, 38, 38, 0.45) 0%, rgba(249, 115, 22, 0.25) 50%, rgba(5, 5, 12, 0.95) 100%)' }
];

const SIMULATED_LYRICS = [
  "Fever dream high in the quiet of the night",
  "You know that I caught it",
  "Bad, bad boy, shiny toy with a price",
  "You know that I bought it",
  "Killing me slow, out the window",
  "I'm always waiting for you to be waiting below",
  "Devils roll the dice, angels roll their eyes",
  "What doesn't kill me makes me want you more",
  "And it's new, the shape of your body",
  "It's blue, the feeling I've got",
  "And it's ooh, whoa, oh...",
  "It's a cruel summer with you!"
];

const DEFAULT_FALLBACK_ART = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80';

function LiveSandboxAlbumArt({ track }: { track: any }) {
  const [imgUrl, setImgUrl] = useState<string>(() => {
    if (
      track?.artwork &&
      !track.artwork.includes('placeholder.com') &&
      !track.artwork.includes('discordapp.com/embed/avatars') &&
      !track.artwork.includes('cdn-images.dzcdn.net/images/artist//')
    ) {
      return track.artwork;
    }
    if (track?.url) {
      const match = track.url.match(/(?:v=|\/embed\/|\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
      if (match && match[1]) {
        return `https://i.ytimg.com/vi/${match[1]}/hqdefault.jpg`;
      }
    }
    return DEFAULT_FALLBACK_ART;
  });

  useEffect(() => {
    let isMounted = true;
    if (
      track?.artwork &&
      !track.artwork.includes('placeholder.com') &&
      !track.artwork.includes('discordapp.com/embed/avatars') &&
      !track.artwork.includes('cdn-images.dzcdn.net/images/artist//')
    ) {
      setImgUrl(track.artwork);
      return;
    }

    const titleToSearch = track?.title || 'Cruel Summer Taylor Swift';
    const cleanTitle = titleToSearch
      .split('|')[0]
      .replace(/\(official.*?\)|lyric video|official video|music video|lyric|lyrics|ft\..*$/gi, '')
      .trim();

    fetch(`/api/deezer/search?q=${encodeURIComponent(cleanTitle)}&limit=1`)
      .then(res => res.json())
      .then(data => {
        const item = data.data && data.data[0];
        if (item && item.album && (item.album.cover_big || item.album.cover_medium || item.album.cover_xl)) {
          const highRes = item.album.cover_big || item.album.cover_xl || item.album.cover_medium;
          if (isMounted) setImgUrl(highRes);
        }
      })
      .catch(() => {
        if (isMounted) setImgUrl(DEFAULT_FALLBACK_ART);
      });

    return () => {
      isMounted = false;
    };
  }, [track?.title, track?.artwork]);

  return (
    <img
      src={imgUrl}
      alt={track?.title || 'Track Artwork'}
      onError={(e) => {
        (e.target as HTMLImageElement).src = DEFAULT_FALLBACK_ART;
      }}
      className="w-full h-full object-cover transition-all duration-700"
    />
  );
}

interface PremiumViewProps {
  guildId: string;
  userId: string;
  currentTrack?: any;
  isPlaying?: boolean;
  handlePlay?: () => void;
  handlePause?: () => void;
  handleSkip?: () => void;
  handlePrevious?: () => void;
  handleVolumeChange?: (v: number) => void;
  handleSeek?: (pos: number) => void;
  volume?: number;
  smoothTime?: number;
  lyrics?: any[];
}

export default function PremiumView({ 
  guildId, 
  userId,
  currentTrack,
  isPlaying,
  handlePlay,
  handlePause,
  handleSkip,
  handlePrevious,
  handleVolumeChange,
  handleSeek,
  volume,
  smoothTime,
  lyrics
}: PremiumViewProps) {
  const [user, setUser] = useState<any>(null);
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState<ToastData[]>([]);

  // Pricing & Coupon states
  const [price, setPrice] = useState(299);
  const [currencySymbol, setCurrencySymbol] = useState('Rs.');
  const [currencyCode, setCurrencyCode] = useState('INR');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [couponSuccess, setCouponSuccess] = useState('');
  const [couponError, setCouponError] = useState('');
  const [redeemCode, setRedeemCode] = useState('');
  const [redeemLoading, setRedeemLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  // Live Simulated Player Sandbox State
  const [simulatedPlaying, setSimulatedPlaying] = useState(true);
  const [selectedTheme, setSelectedTheme] = useState(PREMIUM_THEMES[5]); // Golden Aura default
  const [lyricsColor, setLyricsColor] = useState('text-amber-300');
  const [lyricsSize, setLyricsSize] = useState('text-sm');
  const [lyricsGlow, setLyricsGlow] = useState(true);
  const [lyricIndex, setLyricIndex] = useState(0);
  const [simulatedVolume, setSimulatedVolume] = useState(85);
  const [liked, setLiked] = useState(true);
  const [activeTab, setActiveTab] = useState<'sandbox' | 'features' | 'pricing'>('sandbox');

  const addToast = (message: string, type: 'success' | 'error' | 'warning' = 'success') => {
    setToasts(prev => [...prev, { id: Date.now(), message, type }]);
  };

  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Moving Lyrics Auto-scroll Interval for fallback demo
  useEffect(() => {
    if (!simulatedPlaying && !isPlaying) return;
    const interval = setInterval(() => {
      setLyricIndex(prev => (prev + 1) % SIMULATED_LYRICS.length);
    }, 2800);
    return () => clearInterval(interval);
  }, [simulatedPlaying, isPlaying]);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userRes = await fetch('/api/auth/user', { credentials: 'include' });
        if (userRes.ok) {
          const userData = await userRes.json();
          setUser(userData);
          checkPremium(userData.id);
        } else {
          setLoading(false);
        }
      } catch (err) {
        setLoading(false);
      }
    };

    const checkPremium = async (id: string) => {
      try {
        const res = await fetch(`/api/premium/check/${id}`);
        if (res.ok) {
          const data = await res.json();
          setIsPremium(data.isPremium);
        }
      } catch (err) {
        console.error('Error checking premium:', err);
      } finally {
        setLoading(false);
      }
    };

    fetch('/api/admin/settings')
      .then(res => res.json())
      .then(data => {
        if (data) {
          if (typeof data.premiumPrice !== 'undefined') setPrice(Number(data.premiumPrice));
          if (data.premiumCurrencySymbol) setCurrencySymbol(data.premiumCurrencySymbol);
          if (data.premiumCurrency) setCurrencyCode(data.premiumCurrency);
        }
      })
      .catch(() => {});

    fetchUser();
  }, []);

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError('');
    setCouponSuccess('');

    const clean = couponCode.toUpperCase().trim();
    if (!clean) {
      setCouponError('Please enter a coupon code');
      return;
    }

    if (clean === 'AURORA50') {
      setDiscountPercent(50);
      setAppliedCoupon(clean);
      setCouponSuccess('Coupon AURORA50 applied! 50% discount.');
    } else if (clean === 'AURORA100' || clean === 'FREEPREM') {
      setDiscountPercent(100);
      setAppliedCoupon(clean);
      setCouponSuccess('100% OFF Coupon applied! Click claim below to activate instantly.');
    } else {
      setCouponError('Invalid coupon code. Try "AURORA50" or "FREEPREM".');
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon('');
    setDiscountPercent(0);
    setCouponSuccess('');
    setCouponError('');
    setCouponCode('');
  };

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!redeemCode.trim()) {
      addToast('Please enter a premium code', 'error');
      return;
    }
    if (!user) {
      addToast('Please login to redeem premium', 'error');
      return;
    }

    setRedeemLoading(true);
    try {
      const response = await fetch('/api/premium/redeem', {
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
        addToast(data.message || '🎉 Premium status activated!', 'success');
        setIsPremium(true);
        setRedeemCode('');
        window.dispatchEvent(new CustomEvent('premium-activated'));
      } else {
        addToast(data.error || 'Failed to redeem code', 'error');
      }
    } catch (error) {
      addToast('Connection failed', 'error');
    } finally {
      setRedeemLoading(false);
    }
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePurchase = async () => {
    if (!user) {
      addToast('Please login before buying Premium!', 'warning');
      window.location.href = '/api/auth/discord';
      return;
    }

    setCheckoutLoading(true);
    try {
      const res = await fetch('/api/premium/checkout/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coupon: appliedCoupon,
          userId: user.id,
          username: user.username
        })
      });

      const orderData = await res.json();

      if (orderData.activated) {
        addToast('🎉 Welcome to Premium! Activated via coupon.', 'success');
        setIsPremium(true);
        window.dispatchEvent(new CustomEvent('premium-activated'));
        setCheckoutLoading(false);
        return;
      }

      if (orderData.requiresSupportLink) {
        addToast('Redirecting to Support Server to get Premium...', 'warning');
        setTimeout(() => {
          window.open(orderData.supportLink, '_blank');
        }, 1500);
        setCheckoutLoading(false);
        return;
      }

      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        addToast('Failed to load payment gateway script.', 'error');
        setCheckoutLoading(false);
        return;
      }

      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: 'INR',
        name: 'Aurora Premium',
        description: 'Upgrade your Discord Music Experience',
        order_id: orderData.orderId,
        handler: async function (response: any) {
          try {
            const verifyRes = await fetch('/api/premium/checkout/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                userId: user.id,
                username: user.username,
                paymentId: response.razorpay_payment_id,
                orderId: response.razorpay_order_id,
                signature: response.razorpay_signature
              })
            });

            const verifyData = await verifyRes.json();
            if (verifyData.success) {
              addToast('🎉 Welcome to Premium! Payment confirmed.', 'success');
              setIsPremium(true);
              window.dispatchEvent(new CustomEvent('premium-activated'));
            } else {
              addToast('Payment signature verification failed.', 'error');
            }
          } catch (e) {
            addToast('Error verifying payment.', 'error');
          }
        },
        prefill: {
          name: user.username
        },
        theme: {
          color: '#fbbf24'
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();

    } catch (err) {
      addToast('An error occurred during checkout setup.', 'error');
    } finally {
      setCheckoutLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-20">
        <div className="text-white text-xl flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
          <span>Syncing Premium details...</span>
        </div>
      </div>
    );
  }

  const activeTrack = currentTrack || {
    title: 'Cruel Summer',
    author: 'Taylor Swift',
    duration: 178,
    artwork: 'https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/7e/76/89/7e7689dd-07f2-1a22-eb14-38605eb82c89/19UMGIM70020.rgb.jpg/600x600bb.jpg',
    url: 'https://www.youtube.com/watch?v=ic8j13U_FS8'
  };

  const isRealPlaying = typeof isPlaying === 'boolean' ? isPlaying : simulatedPlaying;
  const togglePlayHandler = currentTrack 
    ? (isPlaying ? handlePause : handlePlay)
    : () => setSimulatedPlaying(!simulatedPlaying);

  const skipNextHandler = currentTrack ? handleSkip : () => addToast('Simulated Next Track', 'warning');
  const skipPrevHandler = currentTrack ? handlePrevious : () => addToast('Simulated Previous Track', 'warning');

  const activeVolume = typeof volume === 'number' ? volume : simulatedVolume;
  const activeTime = typeof smoothTime === 'number' ? Math.floor(smoothTime) : 84;
  const activeDuration = activeTrack.duration || 178;

  const finalPrice = Math.max(0, price - (price * discountPercent / 100));

  return (
    <div className="relative text-white w-full max-w-6xl mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-8 space-y-6 sm:space-y-12 overflow-x-hidden">
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* Hero Header */}
      <div className="text-center max-w-3xl mx-auto relative px-2">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="inline-flex items-center gap-1.5 sm:gap-2 bg-gradient-to-r from-amber-400/20 via-yellow-500/20 to-amber-400/20 border border-amber-400/40 px-3 sm:px-5 py-1.5 sm:py-2 rounded-full text-amber-300 text-[10px] sm:text-xs font-black tracking-widest uppercase mb-3 sm:mb-4 shadow-[0_0_20px_rgba(245,158,11,0.25)]"
        >
          <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-pulse text-amber-400 shrink-0" />
          <span>AURORA PRO AUDIO UNIVERSE</span>
        </motion.div>
        
        <h1 className="text-2xl sm:text-4xl md:text-6xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white via-amber-200 to-yellow-400 mb-3 sm:mb-4 tracking-tight leading-tight">
          Live Experience & Feature Showcase
        </h1>
        <p className="text-gray-300 text-xs sm:text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
          Test real interactive widgets, customize glowing moving lyrics, switch 20 HSL color themes, and re-bind hotkeys live in the sandbox below.
        </p>

        {/* Tab Switcher */}
        <div className="flex flex-wrap sm:flex-nowrap justify-center items-center gap-2 sm:gap-3 mt-6 sm:mt-8 px-1 w-full">
          <button
            onClick={() => setActiveTab('sandbox')}
            className={`px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-full text-[11px] sm:text-xs font-bold transition-all flex items-center gap-1.5 sm:gap-2 cursor-pointer ${
              activeTab === 'sandbox'
                ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-black shadow-lg shadow-amber-500/20 scale-102 sm:scale-105'
                : 'bg-white/10 text-white/70 hover:text-white hover:bg-white/15'
            }`}
          >
            <Radio className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" /> Live Interactive Sandbox
          </button>
          <button
            onClick={() => setActiveTab('features')}
            className={`px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-full text-[11px] sm:text-xs font-bold transition-all flex items-center gap-1.5 sm:gap-2 cursor-pointer ${
              activeTab === 'features'
                ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-black shadow-lg shadow-amber-500/20 scale-102 sm:scale-105'
                : 'bg-white/10 text-white/70 hover:text-white hover:bg-white/15'
            }`}
          >
            <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" /> 8 Premium Superpowers
          </button>
          <button
            onClick={() => setActiveTab('pricing')}
            className={`px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-full text-[11px] sm:text-xs font-bold transition-all flex items-center gap-1.5 sm:gap-2 cursor-pointer ${
              activeTab === 'pricing'
                ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-black shadow-lg shadow-amber-500/20 scale-102 sm:scale-105'
                : 'bg-white/10 text-white/70 hover:text-white hover:bg-white/15'
            }`}
          >
            <Ticket className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" /> Pricing & Redeem
          </button>
        </div>
      </div>

      {/* Active Premium Member Banner */}
      {isPremium && (
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="max-w-2xl mx-auto bg-gradient-to-r from-amber-500/20 via-yellow-500/10 to-amber-500/20 border border-amber-400/40 rounded-2xl sm:rounded-3xl p-4 sm:p-6 text-center shadow-2xl backdrop-blur-xl relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />
          <Crown className="w-10 h-10 sm:w-12 sm:h-12 text-amber-400 mx-auto mb-2 sm:mb-3 animate-bounce-slow" />
          <h3 className="text-xl sm:text-2xl font-black text-amber-300">You are an Active Premium VIP! 👑</h3>
          <p className="text-gray-300 text-xs mt-1 max-w-md mx-auto">
            All 20 themes, hotkeys manager, dragging layout resizer, and unlimited song likes are active for your account across all servers.
          </p>
        </motion.div>
      )}

      {/* SECTION 1: LIVE INTERACTIVE SANDBOX DEMO */}
      {(activeTab === 'sandbox' || activeTab === 'features') && (
        <div className="space-y-6 sm:space-y-8">
          <div className="text-center px-2">
            <h2 className="text-xl sm:text-2xl font-black text-white flex items-center justify-center gap-2">
              <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400 animate-spin shrink-0" style={{ animationDuration: '8s' }} />
              Live Interactive Player Experience
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              {currentTrack ? '🎵 Real Song Connected Live!' : 'Drag any widget (Art, Track Info, Controls, Moving Lyrics) to test real player layout editing.'}
            </p>
          </div>

          {/* MAIN PLAYER SANDBOX WINDOW */}
          <div 
            className="relative w-full rounded-2xl sm:rounded-3xl border border-white/20 p-4 sm:p-6 md:p-8 min-h-[420px] shadow-2xl transition-all duration-700 overflow-hidden flex flex-col justify-between"
            style={{ background: selectedTheme.gradient }}
          >
            {/* Background Glow Overlay */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-md pointer-events-none" />

            {/* Top Toolbar Inside Sandbox */}
            <div className="relative z-20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 sm:pb-4 border-b border-white/10 w-full">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-red-500 shrink-0" />
                <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-yellow-500 shrink-0" />
                <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-green-500 shrink-0" />
                <span className="text-[11px] sm:text-xs font-bold text-white/70 ml-1 sm:ml-2 flex items-center gap-1.5 truncate">
                  <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="truncate">Aurora Live Preview — {selectedTheme.name}</span>
                </span>
              </div>

              {/* Theme Swatch Quick Bar */}
              <div className="flex items-center gap-1.5 bg-black/60 p-1.5 rounded-full border border-white/10 backdrop-blur-md overflow-x-auto max-w-full no-scrollbar shrink-0 w-full sm:w-auto">
                <span className="text-[9px] sm:text-[10px] text-amber-400 font-bold px-1.5 shrink-0">THEMES:</span>
                {PREMIUM_THEMES.slice(0, 8).map((theme) => (
                  <button
                    key={theme.id}
                    onClick={() => setSelectedTheme(theme)}
                    className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full border transition-all cursor-pointer shrink-0 ${
                      selectedTheme.id === theme.id ? 'scale-115 border-white ring-2 ring-amber-400' : 'border-white/20 hover:scale-110 opacity-70 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: theme.color }}
                    title={theme.name}
                  />
                ))}
              </div>
            </div>

            {/* DRAGGABLE REAL COMPONENTS GRID AREA */}
            <div className="relative z-20 my-4 sm:my-6 grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 items-center">
              
              {/* 1. Draggable Album Artwork with High-Res Fallback */}
              <motion.div
                drag
                dragMomentum={false}
                dragConstraints={{ left: -20, right: 80, top: -20, bottom: 80 }}
                whileDrag={{ scale: 1.05, cursor: 'grabbing', zIndex: 50 }}
                className="cursor-grab select-none w-fit mx-auto md:mx-0 group"
              >
                <div className="relative w-44 h-44 rounded-2xl shadow-2xl border-2 border-white/20 overflow-hidden bg-black/60 group-hover:border-amber-400 transition-all">
                  <LiveSandboxAlbumArt track={activeTrack} />
                  
                  <div className="absolute top-2 left-2 bg-black/80 backdrop-blur-md px-2 py-0.5 rounded-full text-[9px] font-bold text-amber-300 flex items-center gap-1 z-10">
                    <Move className="w-3 h-3 animate-pulse" /> Drag Art
                  </div>
                  {isRealPlaying && (
                    <div className="absolute bottom-2 right-2 bg-emerald-500/90 text-black px-2 py-0.5 rounded-full text-[9px] font-black uppercase flex items-center gap-1 shadow-lg z-10">
                      <span className="w-1.5 h-1.5 rounded-full bg-black animate-ping" /> PLAYING
                    </div>
                  )}
                </div>
              </motion.div>

              {/* 2. Live Moving Synced Karaoke Lyrics Component */}
              <motion.div
                drag
                dragMomentum={false}
                dragConstraints={{ left: -40, right: 40, top: -20, bottom: 40 }}
                whileDrag={{ scale: 1.03, cursor: 'grabbing', zIndex: 50 }}
                className="cursor-grab select-none bg-black/60 backdrop-blur-2xl border border-white/15 p-5 rounded-2xl shadow-2xl h-52 flex flex-col justify-between relative overflow-hidden"
              >
                <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-2">
                  <span className="text-[10px] font-bold text-amber-400 tracking-wider uppercase flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Live Moving Lyrics
                  </span>
                  <div className="flex items-center gap-1">
                    {['text-white', 'text-amber-300', 'text-cyan-300', 'text-purple-300'].map(c => (
                      <button
                        key={c}
                        onClick={() => setLyricsColor(c)}
                        className={`w-3.5 h-3.5 rounded-full border border-white/20 ${c === lyricsColor ? 'ring-2 ring-white scale-125' : ''}`}
                        style={{ backgroundColor: c.includes('amber') ? '#fbbf24' : c.includes('cyan') ? '#38bdf8' : c.includes('purple') ? '#c084fc' : '#ffffff' }}
                      />
                    ))}
                  </div>
                </div>

                {/* Moving Lyrics Lines */}
                <div className="flex-1 overflow-hidden flex flex-col justify-center space-y-2 py-2">
                  {lyrics && lyrics.length > 0 ? (
                    lyrics.slice(0, 4).map((lineItem: any, idx: number) => (
                      <motion.p
                        key={idx}
                        className={`font-bold transition-all duration-300 ${lyricsSize} ${
                          idx === 0
                            ? `${lyricsColor} ${lyricsGlow ? 'drop-shadow-[0_0_12px_rgba(251,191,36,0.9)]' : ''}` 
                            : 'text-white/40'
                        }`}
                      >
                        {lineItem.text || lineItem}
                      </motion.p>
                    ))
                  ) : (
                    SIMULATED_LYRICS.slice(Math.max(0, lyricIndex - 1), lyricIndex + 3).map((line) => {
                      const isActive = line === SIMULATED_LYRICS[lyricIndex];
                      return (
                        <motion.p
                          key={line}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: isActive ? 1 : 0.4, scale: isActive ? 1.04 : 0.96 }}
                          transition={{ duration: 0.4 }}
                          className={`font-bold transition-all duration-300 ${lyricsSize} ${
                            isActive 
                              ? `${lyricsColor} ${lyricsGlow ? 'drop-shadow-[0_0_12px_rgba(251,191,36,0.9)]' : ''}` 
                              : 'text-white/40'
                          }`}
                        >
                          {line}
                        </motion.p>
                      );
                    })
                  )}
                </div>

                <div className="flex items-center justify-between text-[9px] text-white/50 border-t border-white/10 pt-2">
                  <span>LRCLIB Synced</span>
                  <button 
                    onClick={() => setLyricsGlow(!lyricsGlow)}
                    className={`px-2 py-0.5 rounded font-bold transition-colors ${lyricsGlow ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40' : 'bg-white/10 text-white/40'}`}
                  >
                    Glow: {lyricsGlow ? 'ON' : 'OFF'}
                  </button>
                </div>
              </motion.div>

              {/* 3. Draggable Controls & Track Metadata Component */}
              <motion.div
                drag
                dragMomentum={false}
                dragConstraints={{ left: -50, right: 30, top: -20, bottom: 50 }}
                whileDrag={{ scale: 1.03, cursor: 'grabbing', zIndex: 50 }}
                className="cursor-grab select-none bg-black/60 backdrop-blur-2xl border border-white/15 p-5 rounded-2xl shadow-2xl flex flex-col justify-between h-52"
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-black text-white text-base truncate max-w-[170px]">
                      {activeTrack.title}
                    </h3>
                    <button 
                      onClick={() => {
                        setLiked(!liked);
                        addToast(liked ? 'Removed from Liked Songs' : '❤️ Saved to Liked Songs!', liked ? 'warning' : 'success');
                      }}
                      className="text-pink-400 hover:scale-125 transition-all cursor-pointer"
                    >
                      <Heart className={`w-5 h-5 ${liked ? 'fill-pink-500 text-pink-500' : ''}`} />
                    </button>
                  </div>
                  <p className="text-gray-400 text-xs font-semibold truncate">{activeTrack.author || 'Unknown Artist'}</p>

                  <div className="flex items-center gap-2 mt-2">
                    <span className="px-2 py-0.5 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-300 text-[9px] font-mono font-bold">
                      FLAC 24-bit 96kHz
                    </span>
                    {activeTrack.requester && (
                      <span className="px-2 py-0.5 rounded-full bg-purple-500/20 border border-purple-500/40 text-purple-300 text-[9px] font-bold truncate max-w-[110px]">
                        By {activeTrack.requester.tag || 'saravanan'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Progress Bar & Buttons */}
                <div className="space-y-3">
                  <div className="space-y-1">
                    <div className="w-full bg-white/20 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 h-full rounded-full transition-all"
                        style={{ width: `${Math.min(100, (activeTime / activeDuration) * 100)}%` }} 
                      />
                    </div>
                    <div className="flex justify-between text-[9px] text-white/50 font-mono">
                      <span>{Math.floor(activeTime / 60)}:{String(activeTime % 60).padStart(2, '0')}</span>
                      <span>{Math.floor(activeDuration / 60)}:{String(activeDuration % 60).padStart(2, '0')}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <Shuffle className="w-4 h-4 text-white/40 hover:text-white cursor-pointer" />
                    <button onClick={skipPrevHandler} className="text-white/70 hover:text-white cursor-pointer">
                      <SkipBack className="w-4 h-4" />
                    </button>
                    <button
                      onClick={togglePlayHandler}
                      className="w-10 h-10 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 hover:scale-105 active:scale-95 text-black flex items-center justify-center shadow-lg cursor-pointer transition-all"
                    >
                      {isRealPlaying ? <Pause className="w-5 h-5 fill-black" /> : <Play className="w-5 h-5 fill-black ml-0.5" />}
                    </button>
                    <button onClick={skipNextHandler} className="text-white/70 hover:text-white cursor-pointer">
                      <SkipForward className="w-4 h-4" />
                    </button>
                    <Repeat className="w-4 h-4 text-white/40 hover:text-white cursor-pointer" />
                  </div>
                </div>
              </motion.div>

            </div>

            {/* Bottom Controls Bar inside Sandbox */}
            <div className="relative z-20 flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-white/10 text-xs">
              <div className="flex items-center gap-2">
                <Crown className="w-4 h-4 text-amber-400" />
                <span className="font-bold text-gray-200">20 Color Presets Available in Settings Panel</span>
              </div>
              
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedTheme(PREMIUM_THEMES[Math.floor(Math.random() * PREMIUM_THEMES.length)])}
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-[11px] flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Random Theme Swatch
                </button>
                <button
                  onClick={() => addToast('⌨️ Shortcut rebind editor opened!', 'success')}
                  className="px-3 py-1.5 rounded-xl bg-amber-400/20 border border-amber-400/40 text-amber-300 font-bold text-[11px] flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Keyboard className="w-3.5 h-3.5" /> Keybind Editor Demo
                </button>
              </div>
            </div>
          </div>

          {/* ALL 20 COLOR THEMES FULL CATALOG GRID */}
          <div className="bg-[#12141d] border border-white/10 rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6 shadow-2xl">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 sm:pb-4 border-b border-white/10">
              <div className="flex items-center gap-2.5 sm:gap-3">
                <div className="p-2.5 sm:p-3 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-xl sm:rounded-2xl shrink-0">
                  <Paintbrush className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-white">20 HSL Color Theme Presets</h3>
                  <p className="text-[11px] sm:text-xs text-gray-400">Click any preset swatch below to test it on the live sandbox player</p>
                </div>
              </div>
              <span className="px-3 py-1 bg-amber-400/10 text-amber-300 border border-amber-400/30 rounded-full text-[10px] sm:text-xs font-mono font-bold shrink-0 self-start sm:self-auto">
                20 / 20 Unlocked
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-3">
              {PREMIUM_THEMES.map((theme) => {
                const isSelected = selectedTheme.id === theme.id;
                return (
                  <button
                    key={theme.id}
                    onClick={() => setSelectedTheme(theme)}
                    className={`p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border transition-all duration-300 flex items-center gap-2 sm:gap-3 text-left cursor-pointer group ${
                      isSelected 
                        ? 'bg-amber-500/20 border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.2)] scale-102 sm:scale-105' 
                        : 'bg-white/5 border-white/10 hover:border-white/30 hover:bg-white/10'
                    }`}
                  >
                    <div 
                      className="w-6 h-6 sm:w-8 sm:h-8 rounded-full border border-white/30 shadow-md shrink-0 group-hover:scale-110 transition-transform" 
                      style={{ backgroundColor: theme.color }}
                    />
                    <div className="truncate min-w-0">
                      <p className="text-[11px] sm:text-xs font-bold text-white truncate">{theme.name}</p>
                      <p className="text-[8px] sm:text-[9px] text-gray-400 font-mono truncate">{theme.color}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: 8 PREMIUM SUPERPOWERS GRID */}
      {(activeTab === 'features' || activeTab === 'sandbox') && (
        <div className="space-y-6 sm:space-y-8 border-t border-white/10 pt-8 sm:pt-10">
          <div className="text-center px-2">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white">8 Exclusive Premium Superpowers</h2>
            <p className="text-xs text-gray-400 mt-1 max-w-md mx-auto">
              Everything built and ready to level up your server's music dashboard experience.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {/* Feature 1 */}
            <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-5 hover:border-amber-400/50 transition-all space-y-2 sm:space-y-3 group">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-400/20 text-amber-400 flex items-center justify-center border border-amber-400/30 group-hover:scale-110 transition-transform">
                <Paintbrush className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <h3 className="font-bold text-white text-xs sm:text-sm">20 Theme Color Presets</h3>
              <p className="text-[11px] sm:text-xs text-gray-400 leading-relaxed">
                Access 20 custom HSL neon gradients including Tokyo Neon, Golden Aura, and Acid Cyberpunk.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-5 hover:border-amber-400/50 transition-all space-y-2 sm:space-y-3 group">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-400/20 text-amber-400 flex items-center justify-center border border-amber-400/30 group-hover:scale-110 transition-transform">
                <Keyboard className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <h3 className="font-bold text-white text-xs sm:text-sm">Custom Keybinds & Shortcuts</h3>
              <p className="text-[11px] sm:text-xs text-gray-400 leading-relaxed">
                Full customizable hotkey manager (`Space`, `N`, `P`, `Q`, `S`, `1-5`) with input searchbox safety.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-5 hover:border-amber-400/50 transition-all space-y-2 sm:space-y-3 group">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-400/20 text-amber-400 flex items-center justify-center border border-amber-400/30 group-hover:scale-110 transition-transform">
                <Move className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <h3 className="font-bold text-white text-xs sm:text-sm">Layout Drag & Resizer</h3>
              <p className="text-[11px] sm:text-xs text-gray-400 leading-relaxed">
                Drag album artwork, controls, or metadata widgets anywhere on screen with custom scaling sliders.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-5 hover:border-amber-400/50 transition-all space-y-2 sm:space-y-3 group">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-400/20 text-amber-400 flex items-center justify-center border border-amber-400/30 group-hover:scale-110 transition-transform">
                <Sliders className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <h3 className="font-bold text-white text-xs sm:text-sm">Karaoke Lyrics & Neon Glow</h3>
              <p className="text-[11px] sm:text-xs text-gray-400 leading-relaxed">
                Millisecond LRCLIB synced lyrics with custom font sizes, text colors, and neon pulsating shadows.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-5 hover:border-amber-400/50 transition-all space-y-2 sm:space-y-3 group">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-400/20 text-amber-400 flex items-center justify-center border border-amber-400/30 group-hover:scale-110 transition-transform">
                <Heart className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <h3 className="font-bold text-white text-xs sm:text-sm">Unlimited Song Likes</h3>
              <p className="text-[11px] sm:text-xs text-gray-400 leading-relaxed">
                Save unlimited tracks to your personal Liked Songs library and access them across all Discord servers.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-5 hover:border-amber-400/50 transition-all space-y-2 sm:space-y-3 group">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-400/20 text-amber-400 flex items-center justify-center border border-amber-400/30 group-hover:scale-110 transition-transform">
                <PictureInPicture2 className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <h3 className="font-bold text-white text-xs sm:text-sm">Picture-in-Picture Mini-Player</h3>
              <p className="text-[11px] sm:text-xs text-gray-400 leading-relaxed">
                Float player controls over any window or browser tab while working or gaming.
              </p>
            </div>

            {/* Feature 7 */}
            <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-5 hover:border-amber-400/50 transition-all space-y-2 sm:space-y-3 group">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-400/20 text-amber-400 flex items-center justify-center border border-amber-400/30 group-hover:scale-110 transition-transform">
                <Radio className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <h3 className="font-bold text-white text-xs sm:text-sm">24/7 VC Mode & Equalizers</h3>
              <p className="text-[11px] sm:text-xs text-gray-400 leading-relaxed">
                Keep bot online 24/7 in your Voice Channel with BassBoost, Nightcore, and 8D audio filters.
              </p>
            </div>

            {/* Feature 8 */}
            <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-5 hover:border-amber-400/50 transition-all space-y-2 sm:space-y-3 group">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-400/20 text-amber-400 flex items-center justify-center border border-amber-400/30 group-hover:scale-110 transition-transform">
                <Crown className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <h3 className="font-bold text-white text-xs sm:text-sm">Golden Profile Aura & Badge</h3>
              <p className="text-[11px] sm:text-xs text-gray-400 leading-relaxed">
                Exclusive VIP golden badge on side navigation, leaderboard cards, and Discord server views.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3: PRICING, COUPONS & CODE REDEEM */}
      {(activeTab === 'pricing' || activeTab === 'sandbox') && (
        <div className="space-y-6 sm:space-y-8 border-t border-white/10 pt-8 sm:pt-10">
          <div className="text-center px-2">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white">Upgrade to Aurora Premium</h2>
            <p className="text-xs text-gray-400 mt-1 max-w-md mx-auto">
              Select a plan, apply coupon codes (`AURORA50` or `FREEPREM`), or redeem a key code below.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8 max-w-4xl mx-auto">
            {/* Free Tier Card */}
            <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl sm:rounded-3xl p-5 sm:p-6 md:p-8 flex flex-col justify-between hover:border-white/20 transition-all space-y-5 sm:space-y-6">
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-200">Free Aurora</h3>
                <p className="text-gray-400 text-xs mt-1">High-quality bot streaming for your server.</p>
                <div className="mt-4 sm:mt-6 space-y-2.5 sm:space-y-3 text-xs">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-400 shrink-0" />
                    <span className="text-gray-300">High Quality Audio Streams</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-400 shrink-0" />
                    <span className="text-gray-300">Interactive Web Control Board</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <X className="w-4 h-4 text-red-400 shrink-0" />
                    <span className="text-gray-500 line-through">Liking songs to library</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <X className="w-4 h-4 text-red-400 shrink-0" />
                    <span className="text-gray-500 line-through">Custom keybinds editor</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <X className="w-4 h-4 text-red-400 shrink-0" />
                    <span className="text-gray-500 line-through">20 Custom Color Theme Presets</span>
                  </div>
                </div>
              </div>

              <div className="border-t border-white/10 pt-4 text-center">
                <span className="text-2xl font-black text-gray-400">$0</span>
                <span className="text-gray-500 text-xs"> / forever</span>
              </div>
            </div>

            {/* Premium Tier Card */}
            <div className="backdrop-blur-xl bg-gradient-to-b from-amber-500/10 via-yellow-500/5 to-black border-2 border-amber-400/50 rounded-2xl sm:rounded-3xl p-5 sm:p-6 md:p-8 relative overflow-hidden flex flex-col justify-between shadow-[0_0_35px_rgba(245,158,11,0.15)] space-y-5 sm:space-y-6">
              <div className="absolute top-0 right-0 bg-amber-400 text-black font-black text-[8px] sm:text-[9px] tracking-wider uppercase px-3 sm:px-4 py-1 sm:py-1.5 rounded-bl-xl sm:rounded-bl-2xl shadow-lg">
                MOST POPULAR
              </div>

              <div>
                <h3 className="text-xl sm:text-2xl font-black text-amber-300 flex items-center gap-2">
                  Aurora Premium
                  <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 animate-pulse shrink-0" />
                </h3>
                <p className="text-amber-100/70 text-xs mt-1">Unlock all 8 superpowers instantly for your Discord account.</p>

                <div className="mt-4 sm:mt-6 space-y-2.5 sm:space-y-3 text-xs">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-amber-400 shrink-0" />
                    <span className="text-white font-bold">20 Custom Theme Color Presets</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-amber-400 shrink-0" />
                    <span className="text-white font-bold">Custom Hotkeys & Shortcuts Manager</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-amber-400 shrink-0" />
                    <span className="text-white font-bold">Interactive Player Layout Drags</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-amber-400 shrink-0" />
                    <span className="text-white font-bold">Karaoke Synced Moving Lyrics</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-amber-400 shrink-0" />
                    <span className="text-white font-bold">Unlimited Song Likes & Playlists</span>
                  </div>
                </div>
              </div>

              <div className="border-t border-amber-500/20 pt-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    {discountPercent > 0 ? (
                      <div>
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                          <span className="line-through">{currencySymbol} {price}</span>
                          <span className="text-[10px] text-green-400 font-bold bg-green-500/20 px-2 py-0.5 rounded">-{discountPercent}% OFF</span>
                        </div>
                        <span className="text-2xl sm:text-3xl font-black text-amber-300">{currencySymbol} {finalPrice}</span>
                      </div>
                    ) : (
                      <span className="text-2xl sm:text-3xl font-black text-white">{currencySymbol} {price}</span>
                    )}
                    <span className="text-gray-400 text-xs"> / 30 Days</span>
                  </div>
                </div>

                {/* Coupon Form */}
                {!isPremium && (
                  <div className="space-y-2">
                    {appliedCoupon ? (
                      <div className="flex items-center justify-between bg-green-500/20 border border-green-500/40 px-3 py-2 rounded-xl text-xs">
                        <span className="text-green-300 font-bold font-mono">🎟️ {appliedCoupon} APPLIED</span>
                        <button
                          onClick={handleRemoveCoupon}
                          className="text-red-400 hover:text-white font-bold cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <form onSubmit={handleApplyCoupon} className="flex flex-col sm:flex-row gap-2">
                        <input
                          type="text"
                          placeholder="Coupon Code"
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value)}
                          className="flex-1 px-3 py-2 bg-black/60 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-amber-400 uppercase text-center font-mono text-xs"
                        />
                        <button
                          type="submit"
                          className="px-4 py-2 bg-amber-400 text-black font-black hover:bg-amber-300 rounded-xl cursor-pointer text-xs transition-all shrink-0"
                        >
                          Apply
                        </button>
                      </form>
                    )}

                    {couponError && <p className="text-[11px] text-red-400 font-medium">{couponError}</p>}
                    {couponSuccess && <p className="text-[11px] text-green-300 font-medium">{couponSuccess}</p>}
                  </div>
                )}

                {/* Purchase / Claim Button */}
                {!isPremium ? (
                  <button
                    onClick={handlePurchase}
                    disabled={checkoutLoading}
                    className="w-full flex items-center justify-center gap-2 py-3 sm:py-3.5 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-black font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-xl hover:scale-102 active:scale-98 cursor-pointer"
                  >
                    {checkoutLoading ? 'Processing...' : discountPercent === 100 ? 'Claim Free Premium' : 'Upgrade Now'}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    disabled
                    className="w-full py-3 sm:py-3.5 bg-white/10 text-white/50 border border-white/10 font-black text-xs uppercase tracking-wider rounded-xl cursor-default flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4 text-green-400" /> Active Membership
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Key Redeem Form */}
          {!isPremium && (
            <div className="max-w-md mx-auto bg-black/40 border border-white/10 rounded-2xl p-4 sm:p-6 space-y-3 backdrop-blur-md">
              <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                <Ticket className="w-4 h-4 text-amber-400 shrink-0" /> Have a Key Code?
              </h3>
              <form onSubmit={handleRedeem} className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  placeholder="Enter 16-character code"
                  value={redeemCode}
                  onChange={(e) => setRedeemCode(e.target.value)}
                  className="flex-1 px-3 py-2 bg-black/60 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-amber-400 uppercase font-mono text-xs"
                />
                <button
                  type="submit"
                  disabled={redeemLoading}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl cursor-pointer text-xs transition-all shrink-0"
                >
                  {redeemLoading ? '...' : 'Redeem'}
                </button>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
