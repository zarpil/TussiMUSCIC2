'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Keyboard, X, RotateCcw, Check, Sparkles, AlertCircle, Play, SkipForward, SkipBack, Volume2, VolumeX, Compass, Disc, ListMusic, BarChart3, Search, Crown, Music, Heart, Sliders, User } from 'lucide-react';

export interface KeybindItem {
  id: string;
  label: string;
  category: 'playback' | 'navigation' | 'panels';
  defaultKey: string;
  icon: any;
}

export const DEFAULT_KEYBINDS: Record<string, string> = {
  playPause: 'Space',
  nextTrack: 'KeyN',
  prevTrack: 'KeyP',
  seekForward: 'ArrowRight',
  seekBackward: 'ArrowLeft',
  volumeUp: 'ArrowUp',
  volumeDown: 'ArrowDown',
  toggleMute: 'KeyM',
  navPlayer: 'Digit1',
  navExplore: 'Digit2',
  navPlaylists: 'Digit3',
  navOverview: 'Digit4',
  navPremium: 'Digit5',
  navExploreArtists: 'KeyA',
  navExploreLiked: 'KeyH',
  navExploreDiscover: 'KeyD',
  navExploreMoods: 'KeyG',
  toggleQueue: 'KeyQ',
  toggleSearch: 'KeyS'
};

export const KEYBIND_DEFINITIONS: KeybindItem[] = [
  { id: 'playPause', label: 'Play / Pause', category: 'playback', defaultKey: 'Space', icon: Play },
  { id: 'nextTrack', label: 'Next Track', category: 'playback', defaultKey: 'KeyN', icon: SkipForward },
  { id: 'prevTrack', label: 'Previous Track', category: 'playback', defaultKey: 'KeyP', icon: SkipBack },
  { id: 'seekForward', label: 'Seek Forward (+5s)', category: 'playback', defaultKey: 'ArrowRight', icon: SkipForward },
  { id: 'seekBackward', label: 'Seek Backward (-5s)', category: 'playback', defaultKey: 'ArrowLeft', icon: SkipBack },
  { id: 'volumeUp', label: 'Volume Up (+5%)', category: 'playback', defaultKey: 'ArrowUp', icon: Volume2 },
  { id: 'volumeDown', label: 'Volume Down (-5%)', category: 'playback', defaultKey: 'ArrowDown', icon: Volume2 },
  { id: 'toggleMute', label: 'Mute / Unmute', category: 'playback', defaultKey: 'KeyM', icon: VolumeX },
  
  { id: 'navPlayer', label: 'Go to Player View', category: 'navigation', defaultKey: 'Digit1', icon: Disc },
  { id: 'navExplore', label: 'Go to Explore View', category: 'navigation', defaultKey: 'Digit2', icon: Compass },
  { id: 'navPlaylists', label: 'Go to Playlists View', category: 'navigation', defaultKey: 'Digit3', icon: ListMusic },
  { id: 'navOverview', label: 'Go to Server Overview', category: 'navigation', defaultKey: 'Digit4', icon: BarChart3 },
  { id: 'navPremium', label: 'Go to Premium View', category: 'navigation', defaultKey: 'Digit5', icon: Crown },

  { id: 'navExploreArtists', label: 'Explore ➔ Popular Artists', category: 'navigation', defaultKey: 'KeyA', icon: Music },
  { id: 'navExploreLiked', label: 'Explore ➔ Liked Songs', category: 'navigation', defaultKey: 'KeyH', icon: Heart },
  { id: 'navExploreDiscover', label: 'Explore ➔ Discover', category: 'navigation', defaultKey: 'KeyD', icon: Compass },
  { id: 'navExploreMoods', label: 'Explore ➔ Moods & Genres', category: 'navigation', defaultKey: 'KeyG', icon: Sliders },

  { id: 'toggleQueue', label: 'Toggle Queue Panel', category: 'panels', defaultKey: 'KeyQ', icon: ListMusic },
  { id: 'toggleSearch', label: 'Open Search', category: 'panels', defaultKey: 'KeyS', icon: Search }
];

export function formatKeyDisplay(code: string): string {
  if (!code) return 'None';
  if (code === 'Space' || code === ' ') return 'Spacebar';
  if (code === 'ArrowUp') return '↑ Up';
  if (code === 'ArrowDown') return '↓ Down';
  if (code === 'ArrowLeft') return '← Left';
  if (code === 'ArrowRight') return '→ Right';
  if (code.startsWith('Key')) return code.replace('Key', '');
  if (code.startsWith('Digit')) return code.replace('Digit', '');
  return code;
}

interface KeybindsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isPremium: boolean;
  userId: string;
  currentKeybinds: Record<string, string>;
  keybindsEnabled: boolean;
  onToggleKeybindsEnabled: (enabled: boolean) => void;
  onSave: (newKeybinds: Record<string, string>) => void;
  onReset: () => void;
}

export default function KeybindsModal({
  isOpen,
  onClose,
  isPremium,
  userId,
  currentKeybinds,
  keybindsEnabled,
  onToggleKeybindsEnabled,
  onSave,
  onReset
}: KeybindsModalProps) {
  const [keybinds, setKeybinds] = useState<Record<string, string>>({ ...DEFAULT_KEYBINDS, ...currentKeybinds });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<'all' | 'playback' | 'navigation' | 'panels'>('all');
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    setKeybinds({ ...DEFAULT_KEYBINDS, ...currentKeybinds });
  }, [currentKeybinds, isOpen]);

  useEffect(() => {
    if (!editingId) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();

      // Cancel edit on Escape
      if (e.code === 'Escape') {
        setEditingId(null);
        return;
      }

      const newCode = e.code || e.key;
      setKeybinds(prev => ({
        ...prev,
        [editingId]: newCode
      }));
      setEditingId(null);
    };

    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => {
      window.removeEventListener('keydown', handleKeyDown, { capture: true });
    };
  }, [editingId]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(keybinds);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 800);
  };

  const handleReset = () => {
    setKeybinds(DEFAULT_KEYBINDS);
    onReset();
  };

  const filteredDefinitions = KEYBIND_DEFINITIONS.filter(
    item => activeCategory === 'all' || item.category === activeCategory
  );

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/70 backdrop-blur-md"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-2xl bg-[#141417] border border-amber-500/30 rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col max-h-[85vh]"
        >
          {/* Top Bar Header */}
          <div className="p-6 bg-gradient-to-r from-amber-950/40 via-purple-950/30 to-[#141417] border-b border-white/10 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.3)]">
                <Keyboard className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-white font-black text-lg tracking-wide">Custom Keybinds</h3>
                  <span className="bg-gradient-to-r from-amber-400 to-yellow-500 text-black text-[10px] font-black uppercase px-2 py-0.5 rounded-full tracking-wider flex items-center gap-1 shadow-md">
                    <Sparkles className="w-3 h-3 fill-black" /> PRO FEATURE
                  </span>
                </div>
                <p className="text-white/40 text-xs mt-0.5">Customize shortcuts for instant playback control and navigation</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white/60 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {!isPremium ? (
            /* Non-Premium Locked State */
            <div className="p-10 text-center flex flex-col items-center justify-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Crown className="w-8 h-8" />
              </div>
              <h4 className="text-white font-bold text-xl">Unlock Custom Keybinds</h4>
              <p className="text-white/60 text-sm max-w-md">
                Custom keyboard shortcuts & hotkeys are an exclusive Premium feature. Upgrade to Aurora Premium to customize playback & navigation keybinds!
              </p>
              <button
                onClick={() => {
                  onClose();
                  window.dispatchEvent(new CustomEvent('change-view', { detail: 'premium' }));
                }}
                className="mt-2 px-8 py-3 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-black rounded-full shadow-xl hover:scale-105 transition duration-300"
              >
                Upgrade to Premium
              </button>
            </div>
          ) : (
            /* Premium Keybind Editor */
            <>
              {/* Toggle Enable / Disable Keyboard Shortcuts */}
              <div className="mx-6 mt-4 p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                    keybindsEnabled ? 'bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.4)]' : 'bg-white/10 text-white/40'
                  }`}>
                    <Keyboard className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-white font-bold text-sm flex items-center gap-2">
                      <span>Enable Keyboard Shortcuts</span>
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                        keybindsEnabled ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      }`}>
                        {keybindsEnabled ? 'ON' : 'OFF (DEFAULT)'}
                      </span>
                    </div>
                    <p className="text-white/40 text-xs mt-0.5">
                      Shortcuts will only work when this website tab is active and focused
                    </p>
                  </div>
                </div>

                {/* Toggle Switch */}
                <button
                  type="button"
                  onClick={() => onToggleKeybindsEnabled(!keybindsEnabled)}
                  className={`relative w-14 h-8 rounded-full transition-all duration-300 p-1 cursor-pointer ${
                    keybindsEnabled
                      ? 'bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.4)]'
                      : 'bg-white/15'
                  }`}
                >
                  <motion.div
                    layout
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    className={`w-6 h-6 rounded-full bg-white shadow-md flex items-center justify-center ${
                      keybindsEnabled ? 'ml-6' : 'ml-0'
                    }`}
                  >
                    {keybindsEnabled ? (
                      <Check className="w-3.5 h-3.5 text-amber-600 stroke-[3]" />
                    ) : (
                      <X className="w-3.5 h-3.5 text-black/40 stroke-[3]" />
                    )}
                  </motion.div>
                </button>
              </div>

              {/* Category Filter Tabs */}
              <div className="px-6 py-3 bg-white/5 border-b border-white/5 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  {[
                    { id: 'all', label: 'All Keybinds' },
                    { id: 'playback', label: 'Playback' },
                    { id: 'navigation', label: 'Navigation' },
                    { id: 'panels', label: 'Panels' }
                  ].map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setActiveCategory(cat.id as any)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold transition ${
                        activeCategory === cat.id
                          ? 'bg-amber-500 text-black shadow-md'
                          : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                <button
                  onClick={handleReset}
                  className="flex items-center gap-1.5 text-xs text-white/50 hover:text-white transition px-3 py-1 rounded-lg hover:bg-white/5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Defaults</span>
                </button>
              </div>

              {/* Keybinds Table / List */}
              <div className="flex-1 overflow-y-auto p-6 space-y-2 custom-scrollbar-vertical">
                {filteredDefinitions.map(def => {
                  const Icon = def.icon;
                  const currentCode = keybinds[def.id] || def.defaultKey;
                  const isEditing = editingId === def.id;

                  return (
                    <div
                      key={def.id}
                      className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                        isEditing
                          ? 'bg-amber-500/20 border-amber-500/60 shadow-[0_0_20px_rgba(245,158,11,0.2)]'
                          : 'bg-white/5 border-white/5 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-white/80">
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-white font-bold text-sm">{def.label}</div>
                          <div className="text-white/40 text-[11px] capitalize">{def.category}</div>
                        </div>
                      </div>

                      {/* Key Box */}
                      <div>
                        {isEditing ? (
                          <span className="px-4 py-2 bg-amber-500 text-black font-black text-xs rounded-xl animate-pulse shadow-lg">
                            Press any key... (Esc to cancel)
                          </span>
                        ) : (
                          <button
                            onClick={() => setEditingId(def.id)}
                            className="px-4 py-2 bg-white/10 hover:bg-amber-500/20 border border-white/15 hover:border-amber-500/50 rounded-xl text-amber-300 font-mono font-bold text-xs transition flex items-center gap-2 group cursor-pointer"
                          >
                            <span>{formatKeyDisplay(currentCode)}</span>
                            <span className="text-[10px] text-white/30 group-hover:text-amber-300 transition">Edit</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Footer Actions */}
              <div className="p-5 bg-white/5 border-t border-white/10 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2 text-xs text-white/40">
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Shortcuts are automatically paused while typing in any search box or input field.</span>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={onClose}
                    className="px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    className="px-6 py-2.5 rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-black text-xs shadow-lg hover:scale-105 transition flex items-center gap-1.5"
                  >
                    {savedSuccess ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Saved!</span>
                      </>
                    ) : (
                      <span>Save Keybinds</span>
                    )}
                  </button>
                </div>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
