'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, FileText, CheckCircle2, AlertCircle, Save, RotateCcw,
  Bold, Italic, Link2, List, Quote, Code, Eye, Edit3, MessageSquare, 
  Smile, Sliders, Radio, Sparkles, Plus, Trash2
} from 'lucide-react';
import AuroraBackground from '../../../components/AuroraBackground';
import CursorGlow from '../../../components/CursorGlow';
import ToastContainer from '../../../components/ToastContainer';
import { parseMarkdown } from '../../../utils/markdown';
import { RichPresenceItem } from '../../../lib/settings';

interface ToastData {
  id: number;
  message: string;
  type: 'success' | 'error' | 'warning';
}

const DEFAULT_EMOJIS = {
  tick_emoji: "<a:tick:1378702853572530226>",
  cross_emoji: "<a:cross_aur:1468227655319949519>",
  ltr_arrow_emoji: "<a:arrow:1378703040156274688>",
  ltr_arrow_color_emoji: "<a:color_arrow:1378704561782394971>",
  music_disc_emoji: "<a:disc:1466446944846221457>",
  play_button_emoji: "<:aur_play:1378705660400762891>",
  loading_emoji: "<a:salesforce_load:1378703152374616104>",
  volume_down_emoji: "<:down_aur:1378700996317941770>",
  volume_up_emoji: "<:up_aur:1378700925098524742>",
  skip_emoji: "<:next_aur:1378699339316199424>",
  pause_emoji: "<:pause_aur:1378701219752575126>",
  loop_emoji: "<:loop_aur:1378701134729969734>",
  stop_emoji: "<:stop_aur:1378701066769666088>",
  autoplay_emoji: "<:autoplay_aur:1468215550688628849>",
  queue_emoji: "<:loop_aur:1468213848904564879>",
  queuelist_emoji: "<:list_aur:1468216766382608618>",
  lyrics_emoji: "<:lyrics_aur:1468216486895292531>",
  volume_emoji: "<:volume_aur:1468214753150111795>",
  listqueue_emoji: "<:list_aur:1468216766382608618>",
  off_emoji: "<:power_aur:1468214243034665203>",
  song_emoji: "<:track_aur:1468213498680053812>",
  seek_emoji: "<:seek_aur:1468216209018327070>",
  shuffle_emoji: "<:shuffle_aur:1468214974752096307>"
};

const DEFAULT_CARD = {
  cardHeading: "# {music_disc_emoji} **Now Playing**",
  cardBody: "●  **Track Title: ** **[{title} - {artist}]({track_uri})**\n●  **Source: ** {source}\n●  **Duration: ** {duration}\n● **Next Song:** {next_song}\n● **Number Of Songs:** {songs_count}\n● **Requested by: ** <@{requester_id}>",
  cardSupportLabel: "Support Server",
  cardSupportUrl: "https://discord.gg/jhag8t57eH",
  cardWebPlayerLabel: "Web Player",
  cardWebPlayerUrl: "http://localhost:3000",
  cardShowHeading: true,
  cardShowTrackImage: true,
  cardShowInfo: true,
  cardShowButtons: true,
  cardShowLinks: true,
  cardSeparatorStyle: 'divider' as const,
  cardSeparatorSize: 'small' as const
};

const EMOJI_LABELS: Record<string, string> = {
  tick_emoji: "Success Tick",
  cross_emoji: "Error Cross",
  ltr_arrow_emoji: "Navigation Arrow",
  ltr_arrow_color_emoji: "Color Navigation Arrow",
  music_disc_emoji: "Music Disc",
  play_button_emoji: "Play Button",
  loading_emoji: "Loading Spinner",
  volume_down_emoji: "Volume Down",
  volume_up_emoji: "Volume Up",
  skip_emoji: "Skip Track",
  pause_emoji: "Pause",
  loop_emoji: "Loop",
  stop_emoji: "Stop",
  autoplay_emoji: "Autoplay Mode",
  queue_emoji: "Queue (Mode)",
  queuelist_emoji: "Queue List",
  lyrics_emoji: "Sync Lyrics",
  volume_emoji: "Volume General",
  listqueue_emoji: "List Queue",
  off_emoji: "Disable/Power Off Mode",
  song_emoji: "Track/Song Detail",
  seek_emoji: "Seek/Timeline",
  shuffle_emoji: "Shuffle Mode"
};

const EMOJI_GROUPS = [
  {
    title: "General Status Emojis",
    keys: ["tick_emoji", "cross_emoji", "loading_emoji", "ltr_arrow_emoji", "ltr_arrow_color_emoji"]
  },
  {
    title: "Music Playback & Controls",
    keys: ["music_disc_emoji", "play_button_emoji", "pause_emoji", "stop_emoji", "skip_emoji", "song_emoji"]
  },
  {
    title: "Queue & Modes",
    keys: ["queue_emoji", "queuelist_emoji", "listqueue_emoji", "autoplay_emoji", "shuffle_emoji", "off_emoji"]
  },
  {
    title: "Volume & Navigation",
    keys: ["volume_emoji", "volume_up_emoji", "volume_down_emoji", "seek_emoji", "lyrics_emoji"]
  }
];

export default function DiscordCustomizerPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toasts, setToasts] = useState<ToastData[]>([]);

  // Site Configuration metadata (for preview styling context)
  const [siteName, setSiteName] = useState('Aurora');
  const [navbarIconUrl, setNavbarIconUrl] = useState('/aurora-logo.png');

  // Emojis and Card Customizer states
  const [emojis, setEmojis] = useState<Record<string, string>>({});
  const [cardHeading, setCardHeading] = useState('');
  const [cardBody, setCardBody] = useState('');
  const [cardSupportLabel, setCardSupportLabel] = useState('');
  const [cardSupportUrl, setCardSupportUrl] = useState('');
  const [cardWebPlayerLabel, setCardWebPlayerLabel] = useState('');
  const [cardWebPlayerUrl, setCardWebPlayerUrl] = useState('');
  const [cardShowHeading, setCardShowHeading] = useState(true);
  const [cardShowTrackImage, setCardShowTrackImage] = useState(true);
  const [cardShowInfo, setCardShowInfo] = useState(true);
  const [cardShowButtons, setCardShowButtons] = useState(true);
  const [cardShowLinks, setCardShowLinks] = useState(true);
  const [cardSeparatorStyle, setCardSeparatorStyle] = useState<'divider' | 'empty'>('divider');
  const [cardSeparatorSize, setCardSeparatorSize] = useState<'small' | 'medium' | 'large'>('small');
  const [activeDiscordTab, setActiveDiscordTab] = useState<'emojis' | 'card' | 'presence'>('emojis');

  // Rich Presence states
  const [presenceMode, setPresenceMode] = useState<'unset' | 'enabled' | 'disabled'>('unset');
  const [presenceName, setPresenceName] = useState('');
  const [presenceStatusesText, setPresenceStatusesText] = useState('{servers} servers\n24/7 Music Playback');
  const [presenceType, setPresenceType] = useState<'Watching' | 'Listening' | 'Playing' | 'Competing' | 'Streaming'>('Watching');
  const [presenceStatus, setPresenceStatus] = useState<'online' | 'idle' | 'dnd' | 'invisible'>('online');
  const [presenceItems, setPresenceItems] = useState<RichPresenceItem[]>([
    { id: '1', name: '{servers} servers', type: 'Watching' },
    { id: '2', name: 'High Quality Music', type: 'Listening' },
    { id: '3', name: '24/7 Playback', type: 'Playing' }
  ]);

  const addPresenceItem = () => {
    setPresenceItems(prev => [
      ...prev,
      { id: String(Date.now()), name: '', type: 'Watching' }
    ]);
  };

  const updatePresenceItem = (id: string, field: keyof RichPresenceItem, val: string) => {
    setPresenceItems(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, [field]: val };
      }
      return item;
    }));
  };

  const removePresenceItem = (id: string) => {
    setPresenceItems(prev => prev.filter(item => item.id !== id));
  };

  const addToast = (message: string, type: 'success' | 'error' | 'warning' = 'success') => {
    setToasts(prev => [...prev, { id: Date.now(), message, type }]);
  };

  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const handleEmojiChange = (key: string, val: string) => {
    setEmojis(prev => ({
      ...prev,
      [key]: val
    }));
  };

  const compileMockTemplate = (template: string) => {
    if (!template) return '';
    
    const getEmoji = (name: string) => {
      const val = emojis[name] || DEFAULT_EMOJIS[name as keyof typeof DEFAULT_EMOJIS] || '';
      if (val.startsWith('<')) {
        const match = val.match(/<a?:([^:]+):/);
        if (match) return `:${match[1]}:`;
      }
      return val || '💿';
    };

    return template
      .replace(/{music_disc_emoji}/g, getEmoji('music_disc_emoji'))
      .replace(/{title}/g, 'Lost in the City')
      .replace(/{artist}/g, 'Horizon Music')
      .replace(/{track_uri}/g, '#')
      .replace(/{source}/g, 'Spotify')
      .replace(/{duration}/g, '3:45')
      .replace(/{next_song}/g, 'Midnight Drive')
      .replace(/{songs_count}/g, '3')
      .replace(/{requester_id}/g, '775429424979378216');
  };

  const resetEmojisSection = () => {
    setEmojis(DEFAULT_EMOJIS);
    addToast('Emojis configuration reset to defaults', 'warning');
  };

  const resetCardSection = () => {
    setCardHeading(DEFAULT_CARD.cardHeading);
    setCardBody(DEFAULT_CARD.cardBody);
    setCardSupportLabel(DEFAULT_CARD.cardSupportLabel);
    setCardSupportUrl(DEFAULT_CARD.cardSupportUrl);
    setCardWebPlayerLabel(DEFAULT_CARD.cardWebPlayerLabel);
    setCardWebPlayerUrl(DEFAULT_CARD.cardWebPlayerUrl);
    setCardShowHeading(DEFAULT_CARD.cardShowHeading);
    setCardShowTrackImage(DEFAULT_CARD.cardShowTrackImage);
    setCardShowInfo(DEFAULT_CARD.cardShowInfo);
    setCardShowButtons(DEFAULT_CARD.cardShowButtons);
    setCardShowLinks(DEFAULT_CARD.cardShowLinks);
    setCardSeparatorStyle(DEFAULT_CARD.cardSeparatorStyle);
    setCardSeparatorSize(DEFAULT_CARD.cardSeparatorSize);
    addToast('Discord card layout configuration reset to defaults', 'warning');
  };

  const resetPresenceSection = () => {
    setPresenceMode('unset');
    setPresenceName('');
    setPresenceStatusesText('{servers} servers\n24/7 Music Playback');
    setPresenceType('Watching');
    setPresenceStatus('online');
    setPresenceItems([
      { id: '1', name: '{servers} servers', type: 'Watching' },
      { id: '2', name: 'High Quality Music', type: 'Listening' },
      { id: '3', name: '24/7 Playback', type: 'Playing' }
    ]);
    addToast('Rich Presence configuration reset to defaults', 'warning');
  };

  // Auth and loader
  useEffect(() => {
    const initPage = async () => {
      try {
        const authRes = await fetch('/api/auth/check-admin', { credentials: 'include' });
        const authData = await authRes.json();
        
        if (!authData.isAdmin) {
          router.push('/?error=admin_only');
          return;
        }

        setIsAdmin(true);

        const settingsRes = await fetch('/api/admin/settings');
        if (settingsRes.ok) {
          const settings = await settingsRes.json();
          setSiteName(settings.siteName || 'Aurora');
          setNavbarIconUrl(settings.navbarIconUrl || '/aurora-logo.png');

          setEmojis(settings.emojis || {});
          setCardHeading(settings.cardHeading || '');
          setCardBody(settings.cardBody || '');
          setCardSupportLabel(settings.cardSupportLabel || '');
          setCardSupportUrl(settings.cardSupportUrl || '');
          setCardWebPlayerLabel(settings.cardWebPlayerLabel || '');
          setCardWebPlayerUrl(settings.cardWebPlayerUrl || '');
          setCardShowHeading(settings.cardShowHeading !== undefined ? settings.cardShowHeading : true);
          setCardShowTrackImage(settings.cardShowTrackImage !== undefined ? settings.cardShowTrackImage : true);
          setCardShowInfo(settings.cardShowInfo !== undefined ? settings.cardShowInfo : true);
          setCardShowButtons(settings.cardShowButtons !== undefined ? settings.cardShowButtons : true);
          setCardShowLinks(settings.cardShowLinks !== undefined ? settings.cardShowLinks : true);
          setCardSeparatorStyle(settings.cardSeparatorStyle || 'divider');
          setCardSeparatorSize(settings.cardSeparatorSize || 'small');

          setPresenceMode(settings.presenceMode || 'unset');
          setPresenceName(settings.presenceName || '');
          if (settings.presenceStatusesText) {
            setPresenceStatusesText(settings.presenceStatusesText);
          } else if (Array.isArray(settings.presenceStatuses) && settings.presenceStatuses.length > 0) {
            setPresenceStatusesText(settings.presenceStatuses.join('\n'));
          } else {
            setPresenceStatusesText('{servers} servers\n24/7 Music Playback');
          }
          if (Array.isArray(settings.presenceItems) && settings.presenceItems.length > 0) {
            setPresenceItems(settings.presenceItems);
          }
          setPresenceType(settings.presenceType || 'Watching');
          setPresenceStatus(settings.presenceStatus || 'online');
        }
      } catch (error) {
        console.error('Initialization error:', error);
        router.push('/?error=admin_only');
      } finally {
        setLoading(false);
      }
    };

    initPage();
  }, [router]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const parsedStatuses = presenceStatusesText
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean);

    const validItems = presenceItems.filter(item => item.name.trim().length > 0);

    try {
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emojis: emojis,
          cardHeading: cardHeading.trim(),
          cardBody: cardBody.trim(),
          cardSupportLabel: cardSupportLabel.trim(),
          cardSupportUrl: cardSupportUrl.trim(),
          cardWebPlayerLabel: cardWebPlayerLabel.trim(),
          cardWebPlayerUrl: cardWebPlayerUrl.trim(),
          cardShowHeading: cardShowHeading,
          cardShowTrackImage: cardShowTrackImage,
          cardShowInfo: cardShowInfo,
          cardShowButtons: cardShowButtons,
          cardShowLinks: cardShowLinks,
          cardSeparatorStyle: cardSeparatorStyle,
          cardSeparatorSize: cardSeparatorSize,
          presenceMode: presenceMode,
          presenceName: presenceName.trim(),
          presenceStatusesText: presenceStatusesText,
          presenceStatuses: parsedStatuses,
          presenceItems: validItems,
          presenceType: presenceType,
          presenceStatus: presenceStatus
        })
      });

      if (response.ok) {
        addToast('Discord customizer settings saved successfully!', 'success');
      } else {
        const errorData = await response.json();
        addToast(errorData.error || 'Failed to save settings.', 'error');
      }
    } catch (error) {
      addToast('Error saving settings.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center relative">
        <AuroraBackground />
        <CursorGlow />
        <div className="text-center relative z-10 animate-fade-in">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4"
            style={{ borderColor: 'var(--glow-green, hsl(155 80% 50%))' }}></div>
          <div className="text-white text-xl">Loading Customizer settings...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      <AuroraBackground />
      <CursorGlow />
      
      <div className="relative z-10 p-4 md:p-8 pt-24 md:pt-28">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <button
                onClick={() => router.push('/admin')}
                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4 group"
              >
                <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                <span>Back to Admin Dashboard</span>
              </button>
              <h1 className="text-4xl font-bold text-white mb-2">Discord Bot Customizer</h1>
              <p className="text-gray-400">Configure dynamically loaded emojis and construct customized playing cards layouts (Components v2)</p>
            </div>
            
            <div className="flex bg-black/40 p-1 rounded-2xl border border-white/10 self-start md:self-auto gap-1">
              {(['emojis', 'card', 'presence'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveDiscordTab(tab)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
                    activeDiscordTab === tab
                      ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/25'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {tab === 'emojis' ? <Smile className="w-4 h-4" /> : tab === 'card' ? <Sliders className="w-4 h-4" /> : <Radio className="w-4 h-4" />}
                  {tab === 'emojis' ? 'Emojis Manager' : tab === 'card' ? 'Playing Card' : 'Rich Presence'}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-6">
            {/* Tab Contents: Emojis */}
            {activeDiscordTab === 'emojis' && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="backdrop-blur-xl bg-white/10 rounded-2xl p-6 border border-white/20 space-y-6"
              >
                <div className="flex justify-between items-center border-b border-white/10 pb-4">
                  <div className="flex items-center gap-3">
                    <Smile className="w-6 h-6 text-indigo-400" />
                    <div>
                      <h2 className="text-xl font-bold text-white font-heading">Emojis Manager</h2>
                      <p className="text-gray-400 text-xs mt-0.5">Customize unicode, default, or guild-specific discord emojis used by the bot</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={resetEmojisSection}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/30 text-red-400 hover:text-red-300 text-xs font-semibold transition-all"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset Emojis</span>
                  </button>
                </div>

                <p className="text-gray-300 text-sm">
                  Configure the custom emojis used by the bot in Discord messages and embeds. You can use standard emojis (e.g. 💿), Unicode characters, or custom Discord guild emojis (format: <code>&lt;:name:id&gt;</code> or animated <code>&lt;a:name:id&gt;</code>).
                </p>

                <div className="space-y-6">
                  {EMOJI_GROUPS.map((group) => (
                    <div key={group.title} className="p-4 bg-white/5 rounded-xl border border-white/5 space-y-4">
                      <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider">{group.title}</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {group.keys.map((key) => (
                          <div key={key} className="space-y-1.5">
                            <label className="block text-gray-300 text-xs font-medium">{EMOJI_LABELS[key] || key}</label>
                            <input
                              type="text"
                              value={emojis[key] || ''}
                              onChange={(e) => handleEmojiChange(key, e.target.value)}
                              placeholder={DEFAULT_EMOJIS[key as keyof typeof DEFAULT_EMOJIS] || 'e.g. 💿'}
                              className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Tab Contents: Playing Card */}
            {activeDiscordTab === 'card' && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="backdrop-blur-xl bg-white/10 rounded-2xl p-6 border border-white/20"
              >
                <div className="flex justify-between items-center border-b border-white/10 pb-4 mb-6">
                  <div className="flex items-center gap-3">
                    <MessageSquare className="w-6 h-6 text-indigo-400" />
                    <div>
                      <h2 className="text-xl font-bold text-white font-heading">Now Playing Card Layout</h2>
                      <p className="text-gray-400 text-xs mt-0.5">Customize texts, visibility fields, dividers, and URLs of Component v2 layout</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={resetCardSection}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/30 text-red-400 hover:text-red-300 text-xs font-semibold transition-all"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset Card Layout</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                  {/* Controls */}
                  <div className="lg:col-span-7 space-y-6">
                    <div className="space-y-2">
                      <label className="block text-gray-300 text-sm font-medium">Card Heading Template</label>
                      <input
                        type="text"
                        value={cardHeading}
                        onChange={(e) => setCardHeading(e.target.value)}
                        placeholder="# {music_disc_emoji} **Now Playing**"
                        className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-mono"
                      />
                      <p className="text-gray-400 text-xs">Supports Markdown headers and template tags.</p>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-gray-300 text-sm font-medium">Card Body Template</label>
                      <textarea
                        value={cardBody}
                        onChange={(e) => setCardBody(e.target.value)}
                        rows={6}
                        placeholder="Enter template..."
                        className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-mono resize-y"
                      />
                      <div className="p-3 bg-white/5 rounded-lg border border-white/5 text-xs text-gray-400 space-y-1">
                        <p className="font-semibold text-gray-300">Available Dynamic Placeholders:</p>
                        <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 font-mono text-[10px]">
                          <div>{"{music_disc_emoji}"} : Disc emoji</div>
                          <div>{"{title}"} : Track name</div>
                          <div>{"{artist}"} : Track artist</div>
                          <div>{"{track_uri}"} : Track URL</div>
                          <div>{"{source}"} : e.g. Spotify</div>
                          <div>{"{duration}"} : Playback duration</div>
                          <div>{"{next_song}"} : Next song name</div>
                          <div>{"{songs_count}"} : Active queue size</div>
                          <div>{"{requester_id}"} : Requester ID</div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="block text-gray-300 text-xs font-medium">Support Link Label</label>
                        <input
                          type="text"
                          value={cardSupportLabel}
                          onChange={(e) => setCardSupportLabel(e.target.value)}
                          placeholder="Support Server"
                          className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-gray-300 text-xs font-medium">Support Server Link URL</label>
                        <input
                          type="text"
                          value={cardSupportUrl}
                          onChange={(e) => setCardSupportUrl(e.target.value)}
                          placeholder="https://discord.gg/..."
                          className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs font-mono"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-gray-300 text-xs font-medium">Web Player Link Label</label>
                        <input
                          type="text"
                          value={cardWebPlayerLabel}
                          onChange={(e) => setCardWebPlayerLabel(e.target.value)}
                          placeholder="Web Player"
                          className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-gray-300 text-xs font-medium">Web Player / Dashboard URL</label>
                        <input
                          type="text"
                          value={cardWebPlayerUrl}
                          onChange={(e) => setCardWebPlayerUrl(e.target.value)}
                          placeholder="http://localhost:3000"
                          className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs font-mono"
                        />
                      </div>
                    </div>

                    <div className="border-t border-white/10 pt-4 space-y-4">
                      <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider">Visibility Toggles & Separators</h3>
                      
                      <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                        <label className="flex items-center gap-3 cursor-pointer text-sm text-gray-300 hover:text-white transition-colors">
                          <input
                            type="checkbox"
                            checked={cardShowHeading}
                            onChange={(e) => setCardShowHeading(e.target.checked)}
                            className="w-4 h-4 rounded border-white/10 bg-black/40 text-indigo-500 focus:ring-indigo-500"
                          />
                          <span>Show Card Heading</span>
                        </label>

                        <label className="flex items-center gap-3 cursor-pointer text-sm text-gray-300 hover:text-white transition-colors">
                          <input
                            type="checkbox"
                            checked={cardShowTrackImage}
                            onChange={(e) => setCardShowTrackImage(e.target.checked)}
                            className="w-4 h-4 rounded border-white/10 bg-black/40 text-indigo-500 focus:ring-indigo-500"
                          />
                          <span>Show Track Image</span>
                        </label>

                        <label className="flex items-center gap-3 cursor-pointer text-sm text-gray-300 hover:text-white transition-colors">
                          <input
                            type="checkbox"
                            checked={cardShowInfo}
                            onChange={(e) => setCardShowInfo(e.target.checked)}
                            className="w-4 h-4 rounded border-white/10 bg-black/40 text-indigo-500 focus:ring-indigo-500"
                          />
                          <span>Show Info Section</span>
                        </label>

                        <label className="flex items-center gap-3 cursor-pointer text-sm text-gray-300 hover:text-white transition-colors">
                          <input
                            type="checkbox"
                            checked={cardShowButtons}
                            onChange={(e) => setCardShowButtons(e.target.checked)}
                            className="w-4 h-4 rounded border-white/10 bg-black/40 text-indigo-500 focus:ring-indigo-500"
                          />
                          <span>Show Control Buttons</span>
                        </label>

                        <label className="flex items-center gap-3 cursor-pointer text-sm text-gray-300 hover:text-white transition-colors">
                          <input
                            type="checkbox"
                            checked={cardShowLinks}
                            onChange={(e) => setCardShowLinks(e.target.checked)}
                            className="w-4 h-4 rounded border-white/10 bg-black/40 text-indigo-500 focus:ring-indigo-500"
                          />
                          <span>Show Action Links</span>
                        </label>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                        <div className="space-y-1.5">
                          <label className="block text-gray-300 text-xs font-medium">Separator Style</label>
                          <select
                            value={cardSeparatorStyle}
                            onChange={(e) => setCardSeparatorStyle(e.target.value as 'divider' | 'empty')}
                            className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs"
                          >
                            <option value="divider">Divider Line</option>
                            <option value="empty">Empty Spacing</option>
                          </select>
                        </div>
                        <div className="space-y-1.5">
                          <label className="block text-gray-300 text-xs font-medium">Separator Size / Spacing</label>
                          <select
                            value={cardSeparatorSize}
                            onChange={(e) => setCardSeparatorSize(e.target.value as 'small' | 'medium' | 'large')}
                            className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs"
                          >
                            <option value="small">Small</option>
                            <option value="medium">Medium</option>
                            <option value="large">Large</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Mockup Preview */}
                  <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-3">
                    <div className="flex items-center gap-1.5 text-xs text-gray-400 font-semibold uppercase tracking-wider mb-2">
                      <Eye className="w-3.5 h-3.5" />
                      <span>Live Discord Embed Preview</span>
                    </div>

                    <div className="bg-[#313338] text-[#dbdee1] rounded-lg p-4 font-sans border border-black/20 text-[14px] shadow-2xl overflow-hidden select-none">
                      {/* Discord Message Header */}
                      <div className="flex gap-3 items-start mb-2">
                        <div className="w-8 h-8 rounded-full overflow-hidden bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                          <img src={navbarIconUrl} alt="Bot Avatar" className="w-6 h-6 rounded-full" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-semibold text-white text-xs hover:underline cursor-pointer">{siteName}</span>
                            <span className="bg-[#5865f2] text-white text-[9px] font-bold px-1 py-0.2 rounded uppercase tracking-wider">BOT</span>
                            <span className="text-gray-400 text-[10px]">Today at 12:34 PM</span>
                          </div>
                          
                          {/* Discord Components V2 Container */}
                          <div className="mt-2 bg-[#2b2d31] rounded-lg border border-[#1e1f22] p-3 flex flex-col gap-2 max-w-full">
                            {/* Render Header */}
                            {cardShowHeading && (
                              <div 
                                className="text-white text-xs leading-relaxed markdown-content font-sans" 
                                dangerouslySetInnerHTML={{ __html: parseMarkdown(compileMockTemplate(cardHeading)) }}
                              />
                            )}
                            
                            {/* Separator */}
                            {cardShowHeading && cardShowTrackImage && cardSeparatorStyle === 'divider' && (
                              <hr className={`border-[#3f4147] ${cardSeparatorSize === 'small' ? 'my-0.5' : cardSeparatorSize === 'medium' ? 'my-1.5' : 'my-3'}`} />
                            )}
                            {cardShowHeading && cardShowTrackImage && cardSeparatorStyle === 'empty' && (
                              <div className={`${cardSeparatorSize === 'small' ? 'h-1' : cardSeparatorSize === 'medium' ? 'h-2' : 'h-4'}`} />
                            )}

                            {/* Track Image Mockup */}
                            {cardShowTrackImage && (
                              <div className="relative aspect-[16/9] w-full rounded-md overflow-hidden bg-gradient-to-r from-indigo-950 to-purple-950 border border-white/5 flex flex-col justify-between p-3">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <span className="text-[9px] uppercase font-bold tracking-wider text-white/50">Now Playing</span>
                                    <h4 className="text-sm font-bold text-white mt-0.5 leading-tight">Lost in the City</h4>
                                    <p className="text-[10px] text-white/70">Horizon Music</p>
                                  </div>
                                  <div className="w-8 h-8 rounded-lg bg-black/40 border border-white/10 flex items-center justify-center text-sm">
                                    💿
                                  </div>
                                </div>
                                {/* Progress bar */}
                                <div className="space-y-1">
                                  <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden">
                                    <div className="h-full bg-indigo-400 rounded-full" style={{ width: '40%' }}></div>
                                  </div>
                                  <div className="flex justify-between text-[9px] text-white/50 font-mono">
                                    <span>1:30</span>
                                    <span>3:45</span>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Separator */}
                            {cardShowTrackImage && cardShowInfo && cardSeparatorStyle === 'divider' && (
                              <hr className={`border-[#3f4147] ${cardSeparatorSize === 'small' ? 'my-0.5' : cardSeparatorSize === 'medium' ? 'my-1.5' : 'my-3'}`} />
                            )}
                            {cardShowTrackImage && cardShowInfo && cardSeparatorStyle === 'empty' && (
                              <div className={`${cardSeparatorSize === 'small' ? 'h-1' : cardSeparatorSize === 'medium' ? 'h-2' : 'h-4'}`} />
                            )}

                            {/* Info Section with Thumbnail */}
                            {cardShowInfo && (
                              <div className="flex gap-3 justify-between items-start">
                                <div 
                                  className="flex-1 text-[#dbdee1] text-xs leading-relaxed markdown-content font-sans"
                                  dangerouslySetInnerHTML={{ __html: parseMarkdown(compileMockTemplate(cardBody)) }}
                                />
                                {/* User Avatar Accessory */}
                                <div className="w-10 h-10 rounded-full overflow-hidden border border-white/10 bg-white/5 flex-shrink-0 flex items-center justify-center">
                                  <img src="https://cdn.discordapp.com/embed/avatars/1.png" alt="User Avatar" className="w-full h-full object-cover" />
                                </div>
                              </div>
                            )}

                            {/* Separator */}
                            {cardShowInfo && cardShowButtons && cardSeparatorStyle === 'divider' && (
                              <hr className={`border-[#3f4147] ${cardSeparatorSize === 'small' ? 'my-0.5' : cardSeparatorSize === 'medium' ? 'my-1.5' : 'my-3'}`} />
                            )}
                            {cardShowInfo && cardShowButtons && cardSeparatorStyle === 'empty' && (
                              <div className={`${cardSeparatorSize === 'small' ? 'h-1' : cardSeparatorSize === 'medium' ? 'h-2' : 'h-4'}`} />
                            )}

                            {/* Buttons Mockup */}
                            {cardShowButtons && (
                              <div className="flex flex-col gap-1">
                                <div className="flex flex-wrap gap-1">
                                  <button type="button" className="bg-[#4e5058] hover:bg-[#6d6f78] text-white px-2 py-0.5 rounded text-[10px] font-medium min-w-[28px] justify-center flex">⏹️</button>
                                  <button type="button" className="bg-[#248046] hover:bg-[#1a6535] text-white px-2 py-0.5 rounded text-[10px] font-medium min-w-[28px] justify-center flex">⏸️</button>
                                  <button type="button" className="bg-[#4e5058] hover:bg-[#6d6f78] text-white px-2 py-0.5 rounded text-[10px] font-medium min-w-[28px] justify-center flex">⏭️</button>
                                  <button type="button" className="bg-[#4e5058] hover:bg-[#6d6f78] text-white px-2 py-0.5 rounded text-[10px] font-medium min-w-[28px] justify-center flex">🔁</button>
                                  <button type="button" className="bg-[#4e5058] hover:bg-[#6d6f78] text-white px-2 py-0.5 rounded text-[10px] font-medium min-w-[28px] justify-center flex">🔀</button>
                                </div>
                                <div className="flex flex-wrap gap-1">
                                  <button type="button" className="bg-[#4e5058] hover:bg-[#6d6f78] text-white px-2 py-0.5 rounded text-[10px] font-medium flex items-center gap-1">🎙️ Lyrics</button>
                                  <button type="button" className="bg-[#4e5058] hover:bg-[#6d6f78] text-white px-2 py-0.5 rounded text-[10px] font-medium flex items-center gap-1">🎶 Queue</button>
                                </div>
                              </div>
                            )}

                            {/* Separator */}
                            {cardShowButtons && cardShowLinks && cardSeparatorStyle === 'divider' && (
                              <hr className={`border-[#3f4147] ${cardSeparatorSize === 'small' ? 'my-0.5' : cardSeparatorSize === 'medium' ? 'my-1.5' : 'my-3'}`} />
                            )}
                            {cardShowButtons && cardShowLinks && cardSeparatorStyle === 'empty' && (
                              <div className={`${cardSeparatorSize === 'small' ? 'h-1' : cardSeparatorSize === 'medium' ? 'h-2' : 'h-4'}`} />
                            )}

                            {/* Link buttons mockup */}
                            {cardShowLinks && (
                              <div className="flex flex-wrap gap-2 text-xs">
                                <span className="text-[#00a8fc] hover:underline font-medium cursor-pointer">🔗 {cardSupportLabel}</span>
                                <span className="text-[#3f4147]">|</span>
                                <span className="text-[#00a8fc] hover:underline font-medium cursor-pointer">🔗 {cardWebPlayerLabel}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Tab Contents: Rich Presence */}
            {activeDiscordTab === 'presence' && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="backdrop-blur-xl bg-white/10 rounded-2xl p-6 border border-white/20"
              >
                <div className="flex justify-between items-center border-b border-white/10 pb-4 mb-6">
                  <div className="flex items-center gap-3">
                    <Radio className="w-6 h-6 text-indigo-400" />
                    <div>
                      <h2 className="text-xl font-bold text-white font-heading">Discord Rich Presence</h2>
                      <p className="text-gray-400 text-xs mt-0.5">Configure status, activity text, and priority behavior for the Discord bot profile</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={resetPresenceSection}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/30 text-red-400 hover:text-red-300 text-xs font-semibold transition-all"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset Presence</span>
                  </button>
                </div>

                {/* Priority Banner */}
                <div className="mb-6 p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-200 space-y-1">
                  <div className="flex items-center gap-2 font-bold text-indigo-300 text-sm">
                    <Sparkles className="w-4 h-4" />
                    <span>Priority Cascade: Web Dashboard &gt; Environment Variables (.env) &gt; Disabled</span>
                  </div>
                  <p className="text-gray-300 text-xs leading-relaxed">
                    Setting the Rich Presence mode to <strong>Enabled</strong> or <strong>Disabled</strong> on the Web Dashboard takes immediate priority over your <code>.env</code> file. When set to <strong>Use .env (Unset)</strong>, the bot checks <code>RICH_PRESENCE_ENABLED</code> in <code>.env</code>. By default, Rich Presence is toggled off.
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                  {/* Controls */}
                  <div className="lg:col-span-7 space-y-6">
                    {/* Presence Mode Selection */}
                    <div className="space-y-2">
                      <label className="block text-gray-300 text-sm font-medium">Rich Presence Control Mode</label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {[
                          { value: 'unset', label: 'Use .env (Unset)', desc: 'Check .env file' },
                          { value: 'enabled', label: 'Enabled', desc: 'Force ON (Web Override)' },
                          { value: 'disabled', label: 'Disabled', desc: 'Force OFF (Web Override)' }
                        ].map(opt => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => setPresenceMode(opt.value as 'unset' | 'enabled' | 'disabled')}
                            className={`p-3 rounded-xl border text-left transition-all ${
                              presenceMode === opt.value
                                ? 'bg-indigo-500/20 border-indigo-500 text-white shadow-lg shadow-indigo-500/10'
                                : 'bg-black/30 border-white/10 text-gray-400 hover:text-white hover:bg-white/5'
                            }`}
                          >
                            <div className="font-semibold text-xs text-white mb-0.5">{opt.label}</div>
                            <div className="text-[10px] text-gray-400">{opt.desc}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Multiple Statuses with Custom Activity Types */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <label className="block text-gray-300 text-sm font-medium">
                          Status Items ({presenceItems.length})
                        </label>
                        <button
                          type="button"
                          onClick={addPresenceItem}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/30 text-indigo-300 text-xs font-semibold transition-all"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Status Item</span>
                        </button>
                      </div>

                      <p className="text-gray-400 text-xs">
                        Configure multiple status messages, each with its own activity type (Watching, Listening, Playing, etc.). The bot rotates through these every 15s. Use <code>{'{servers}'}</code> for active server count.
                      </p>

                      <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1 custom-scrollbar">
                        {presenceItems.map((item, idx) => (
                          <div key={item.id || idx} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-3 bg-black/40 border border-white/10 rounded-xl">
                            <div className="flex-1">
                              <input
                                type="text"
                                value={item.name}
                                onChange={(e) => updatePresenceItem(item.id || String(idx), 'name', e.target.value)}
                                placeholder="e.g. {servers} servers or High Quality Music"
                                className="w-full px-3 py-2 bg-black/50 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs font-mono"
                              />
                            </div>

                            <div className="w-full sm:w-36">
                              <select
                                value={item.type}
                                onChange={(e) => updatePresenceItem(item.id || String(idx), 'type', e.target.value as any)}
                                className="w-full px-3 py-2 bg-black/50 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs font-semibold"
                              >
                                <option value="Watching">Watching</option>
                                <option value="Listening">Listening</option>
                                <option value="Playing">Playing</option>
                                <option value="Competing">Competing</option>
                                <option value="Streaming">Streaming</option>
                              </select>
                            </div>

                            {presenceItems.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removePresenceItem(item.id || String(idx))}
                                className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors border border-transparent hover:border-red-500/20 self-end sm:self-center"
                                title="Remove status item"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Bot Online Status */}
                    <div className="space-y-2 pt-2">
                      <label className="block text-gray-300 text-xs font-medium">Bot Online Status (Global)</label>
                      <select
                        value={presenceStatus}
                        onChange={(e) => setPresenceStatus(e.target.value as any)}
                        className="w-full px-3 py-2.5 bg-black/40 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs"
                      >
                        <option value="online">Online (Green)</option>
                        <option value="idle">Idle (Yellow)</option>
                        <option value="dnd">Do Not Disturb (Red)</option>
                        <option value="invisible">Invisible / Offline</option>
                      </select>
                    </div>
                  </div>

                  {/* Profile Mockup Preview */}
                  <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-3">
                    <div className="flex items-center gap-1.5 text-xs text-gray-400 font-semibold uppercase tracking-wider mb-2">
                      <Eye className="w-3.5 h-3.5" />
                      <span>Live Discord Profile Preview</span>
                    </div>

                    <div className="bg-[#232428] text-white rounded-xl p-5 border border-black/30 shadow-2xl overflow-hidden select-none">
                      {/* Discord User Card Banner */}
                      <div className="h-16 -mx-5 -mt-5 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 mb-10 relative">
                        <div className="absolute -bottom-6 left-5">
                          <div className="w-16 h-16 rounded-full border-4 border-[#232428] bg-[#313338] flex items-center justify-center relative">
                            <img src={navbarIconUrl} alt="Bot Avatar" className="w-10 h-10 rounded-full" />
                            {/* Status indicator dot */}
                            <span 
                              className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-[#232428] ${
                                presenceStatus === 'online' ? 'bg-emerald-500' :
                                presenceStatus === 'idle' ? 'bg-amber-500' :
                                presenceStatus === 'dnd' ? 'bg-red-500' : 'bg-gray-500'
                              }`}
                            />
                          </div>
                        </div>
                      </div>

                      {/* User Info */}
                      <div className="space-y-3">
                        <div>
                          <h3 className="font-bold text-base text-white flex items-center gap-1.5">
                            {siteName}
                            <span className="bg-[#5865f2] text-white text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">BOT</span>
                          </h3>
                          <p className="text-gray-400 text-xs font-mono">{siteName.toLowerCase()}#0000</p>
                        </div>

                        <hr className="border-white/10" />

                        {/* Rich Presence Activity Display */}
                        <div>
                          <h4 className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1.5">Activity</h4>
                          {presenceMode === 'disabled' ? (
                            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-400 flex items-center gap-2">
                              <AlertCircle className="w-4 h-4" />
                              <span>Rich Presence is Toggled OFF</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-3 bg-[#111214] p-3 rounded-lg border border-white/5">
                              <div className="w-10 h-10 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300 flex-shrink-0">
                                <Radio className="w-5 h-5 animate-pulse" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="font-bold text-xs text-white truncate">
                                  {presenceItems[0]?.type || 'Watching'} {
                                    presenceItems[0]?.name || '{servers} servers'
                                  }
                                </div>
                                <div className="text-[10px] text-gray-400 mt-0.5">
                                  {presenceMode === 'unset' ? 'Mode: Check .env file' : `Rotating ${presenceItems.length} status item(s) with custom types`}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-black/20 p-4 border border-white/10 rounded-2xl backdrop-blur-md">
              <button
                type="button"
                onClick={() => {
                  if (activeDiscordTab === 'emojis') {
                    resetEmojisSection();
                  } else if (activeDiscordTab === 'card') {
                    resetCardSection();
                  } else {
                    resetPresenceSection();
                  }
                }}
                className="flex items-center gap-2 px-5 py-3 rounded-xl border border-white/10 hover:bg-white/5 text-gray-400 hover:text-white font-semibold transition-all w-full sm:w-auto justify-center"
              >
                <RotateCcw className="w-5 h-5" />
                Reset Fields
              </button>

              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-purple-500 hover:bg-purple-600 disabled:opacity-50 text-white font-semibold transition-all shadow-lg shadow-purple-500/25 w-full sm:w-auto justify-center"
              >
                <Save className="w-5 h-5" />
                {saving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </form>
        </div>
      </div>

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
