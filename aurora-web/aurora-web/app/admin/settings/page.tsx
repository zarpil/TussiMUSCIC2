'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, Layout, Globe, FileText, 
  CheckCircle2, AlertCircle, Save, RotateCcw,
  Bold, Italic, Link2, List, Quote, Code, Eye, Edit3, Upload,
  Compass, MessageSquare, Smile
} from 'lucide-react';
import AuroraBackground from '../../../components/AuroraBackground';
import CursorGlow from '../../../components/CursorGlow';
import ToastContainer from '../../../components/ToastContainer';
import { parseMarkdown } from '../../../utils/markdown';

interface ToastData {
  id: number;
  message: string;
  type: 'success' | 'error' | 'warning';
}

const COLOR_PRESETS = [
  { name: 'Aurora Green', hex: '#10b981', hsl: '155 80% 50%' },
  { name: 'Amethyst Purple', hex: '#a855f7', hsl: '270 60% 60%' },
  { name: 'Skyline Blue', hex: '#0ea5e9', hsl: '200 80% 55%' },
  { name: 'Rose Petal', hex: '#f43f5e', hsl: '346 87% 60%' },
  { name: 'Indigo Aura', hex: '#6366f1', hsl: '239 84% 67%' },
  { name: 'Amber Glow', hex: '#f59e0b', hsl: '38 92% 50%' },
  { name: 'Cyber Cyan', hex: '#06b6d4', hsl: '189 94% 43%' }
];



const hexToHslString = (hex: string) => {
  let r = 0, g = 0, b = 0;
  const cleanHex = hex.replace('#', '');
  r = parseInt(cleanHex.substring(0, 2), 16) / 255;
  g = parseInt(cleanHex.substring(2, 4), 16) / 255;
  b = parseInt(cleanHex.substring(4, 6), 16) / 255;
  
  if (isNaN(r) || isNaN(g) || isNaN(b)) {
    return '155 80% 50%';
  }
  
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
};

export default function AdminSettings() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toasts, setToasts] = useState<ToastData[]>([]);

  // Form Fields
  const [siteName, setSiteName] = useState('Aurora');
  const [siteDescription, setSiteDescription] = useState('Control your Discord music bot from the web');
  const [metaImageUrl, setMetaImageUrl] = useState('/aurora-logo.png');
  const [metaKeywords, setMetaKeywords] = useState('aurora, discord music bot, music dashboard, discord bot');
  const [premiumEnabled, setPremiumEnabled] = useState(false);
  const [faviconUrl, setFaviconUrl] = useState('/favicon.ico');
  const [navbarIconUrl, setNavbarIconUrl] = useState('/aurora-logo.png');
  const [primaryColorHex, setPrimaryColorHex] = useState('#10b981');
  const [primaryColorHsl, setPrimaryColorHsl] = useState('155 80% 50%');
  const [privacyPolicy, setPrivacyPolicy] = useState('');
  const [termsOfService, setTermsOfService] = useState('');
  const [activePrivacyTab, setActivePrivacyTab] = useState<'edit' | 'preview'>('edit');
  const [activeTermsTab, setActiveTermsTab] = useState<'edit' | 'preview'>('edit');
  
  // Landing Page state variables
  const [heroSubtitle, setHeroSubtitle] = useState('');
  const [heroTitleLine1, setHeroTitleLine1] = useState('');
  const [heroTitleLine2, setHeroTitleLine2] = useState('');
  const [heroDescription, setHeroDescription] = useState('');
  const [botInviteUrl, setBotInviteUrl] = useState('');

  const [aboutTitle, setAboutTitle] = useState('');
  const [aboutSubtitle, setAboutSubtitle] = useState('');
  const [aboutCard1Title, setAboutCard1Title] = useState('');
  const [aboutCard1Text, setAboutCard1Text] = useState('');
  const [aboutCard2Title, setAboutCard2Title] = useState('');
  const [aboutCard2Text, setAboutCard2Text] = useState('');
  const [aboutCard3Title, setAboutCard3Title] = useState('');
  const [aboutCard3Text, setAboutCard3Text] = useState('');

  const [featuresTitle, setFeaturesTitle] = useState('');
  const [featuresSubtitle, setFeaturesSubtitle] = useState('');
  const [feature1Title, setFeature1Title] = useState('');
  const [feature1Desc, setFeature1Desc] = useState('');
  const [feature2Title, setFeature2Title] = useState('');
  const [feature2Desc, setFeature2Desc] = useState('');
  const [feature3Title, setFeature3Title] = useState('');
  const [feature3Desc, setFeature3Desc] = useState('');
  const [feature4Title, setFeature4Title] = useState('');
  const [feature4Desc, setFeature4Desc] = useState('');

  const [joinTitle, setJoinTitle] = useState('');
  const [joinSubtitle, setJoinSubtitle] = useState('');
  const [supportServerUrl, setSupportServerUrl] = useState('');
  
  const [activeLandingTab, setActiveLandingTab] = useState<'hero' | 'about' | 'features' | 'join' | 'team'>('hero');

  // Team section state variables
  const [teamTitle, setTeamTitle] = useState('');
  const [teamSubtitle, setTeamSubtitle] = useState('');
  const [teamMember1Name, setTeamMember1Name] = useState('');
  const [teamMember1Role, setTeamMember1Role] = useState('');
  const [teamMember1Bio, setTeamMember1Bio] = useState('');
  const [teamMember1DiscordId, setTeamMember1DiscordId] = useState('');
  const [teamMember1Avatar, setTeamMember1Avatar] = useState('');
  const [teamMember2Name, setTeamMember2Name] = useState('');
  const [teamMember2Role, setTeamMember2Role] = useState('');
  const [teamMember2Bio, setTeamMember2Bio] = useState('');
  const [teamMember2DiscordId, setTeamMember2DiscordId] = useState('');
  const [teamMember2Avatar, setTeamMember2Avatar] = useState('');

  const [activeMainTab, setActiveMainTab] = useState<'general' | 'landing' | 'legal'>('general');

  // Background Customization States
  const [bgType, setBgType] = useState<'aurora' | 'solid' | 'image' | 'gif'>('aurora');
  const [bgColor, setBgColor] = useState('#0a0a1a');
  const [bgUrl, setBgUrl] = useState('');
  const [auroraColor, setAuroraColor] = useState<'green' | 'purple' | 'red' | 'cyan' | 'custom'>('green');
  const [auroraCustomColor, setAuroraCustomColor] = useState('#10b981');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (tabParam === 'general' || tabParam === 'landing' || tabParam === 'legal') {
        setActiveMainTab(tabParam);
      }
    }
  }, []);

  // Section Resets
  const resetHeroSection = () => {
    setHeroSubtitle("Discord's finest music experience");
    setHeroTitleLine1("Experience Sound");
    setHeroTitleLine2("Like Never Before.");
    setHeroDescription("High-fidelity audio streaming for your Discord server. Let the music flow like the Northern Lights.");
    setBotInviteUrl("https://discord.com/oauth2/authorize?client_id=1310246126712127508&scope=bot&permissions=2151017536");
    addToast('Hero section fields reset to defaults', 'warning');
  };

  const resetAboutSection = () => {
    setAboutTitle("The Story Behind Aurora");
    setAboutSubtitle("More than a bot — a commitment to bringing people together through music.");
    setAboutCard1Title("Born from passion");
    setAboutCard1Text("Aurora Music was created by music lovers who believed Discord deserved a bot that sounds as good as a dedicated music player.");
    setAboutCard2Title("Built for performance");
    setAboutCard2Text("Every millisecond matters. We've optimized our audio pipeline for zero-lag, crystal-clear playback across thousands of servers simultaneously.");
    setAboutCard3Title("Loved by communities");
    setAboutCard3Text("From small friend groups to massive gaming communities — Aurora adapts to your server's vibe and keeps the energy flowing.");
    addToast('About section fields reset to defaults', 'warning');
  };

  const resetFeaturesSection = () => {
    setFeaturesTitle("Why Aurora Music?");
    setFeaturesSubtitle("Everything you need for the perfect listening experience.");
    setFeature1Title("High-Fidelity Audio");
    setFeature1Desc("Crystal clear streaming with lossless quality support.");
    setFeature2Title("24/7 Playback");
    setFeature2Desc("The music never stops. Always on, always ready.");
    setFeature3Title("Audio Filters");
    setFeature3Desc("Bassboost, nightcore, 8D, and many more effects.");
    setFeature4Title("Web Dashboard");
    setFeature4Desc("Manage queues and settings from any browser.");
    addToast('Features section fields reset to defaults', 'warning');
  };

  const resetJoinSection = () => {
    setJoinTitle("Join the Aurora Community");
    setJoinSubtitle("Get support, suggest features, stay updated, and hang out with thousands of music lovers on our Discord server.");
    setSupportServerUrl("https://discord.gg/jhag8t57eH");
    addToast('Join section fields reset to defaults', 'warning');
  };

  const resetTeamSection = () => {
    setTeamTitle("Meet the Team");
    setTeamSubtitle("The passionate developers behind Aurora Music.");
    setTeamMember1Name("Saravanan");
    setTeamMember1Role("Lead Developer");
    setTeamMember1Bio("Building the future of Discord music bots.");
    setTeamMember1DiscordId("775429424979378216");
    setTeamMember1Avatar("");
    setTeamMember2Name("Zilm");
    setTeamMember2Role("Core Developer");
    setTeamMember2Bio("Crafting seamless audio experiences.");
    setTeamMember2DiscordId("775015391487197206");
    setTeamMember2Avatar("");
    addToast('Team section fields reset to defaults', 'warning');
  };



  const cropToCircle = (dataUrl: string, callback: (result: string) => void) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const size = Math.min(img.width, img.height);
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        callback(dataUrl);
        return;
      }
      
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      
      ctx.drawImage(
        img,
        (img.width - size) / 2,
        (img.height - size) / 2,
        size,
        size,
        0,
        0,
        size,
        size
      );
      
      callback(canvas.toDataURL('image/png'));
    };
    img.onerror = () => {
      callback(dataUrl);
    };
    img.src = dataUrl;
  };

  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (val: string) => void,
    maxSizeKB: number = 300,
    roundImage: boolean = false
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > maxSizeKB * 1024) {
      addToast(`File is too large! Please upload an image under ${maxSizeKB}KB.`, 'error');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const resultStr = reader.result as string;
      if (roundImage) {
        cropToCircle(resultStr, (roundedResult) => {
          setter(roundedResult);
          addToast('Image uploaded and cropped to circle successfully!', 'success');
        });
      } else {
        setter(resultStr);
        addToast('Image uploaded successfully!', 'success');
      }
    };
    reader.readAsDataURL(file);
  };

  const insertMarkdown = (
    textareaId: 'privacyPolicy' | 'termsOfService',
    syntaxBefore: string,
    syntaxAfter: string = ''
  ) => {
    const textarea = document.getElementById(textareaId) as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selectedText = text.substring(start, end);
    const replacement = syntaxBefore + selectedText + syntaxAfter;

    const newValue = text.substring(0, start) + replacement + text.substring(end);
    
    if (textareaId === 'privacyPolicy') {
      setPrivacyPolicy(newValue);
    } else {
      setTermsOfService(newValue);
    }

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + syntaxBefore.length, start + syntaxBefore.length + selectedText.length);
    }, 0);
  };

  const addToast = (message: string, type: 'success' | 'error' | 'warning' = 'success') => {
    setToasts(prev => [...prev, { id: Date.now(), message, type }]);
  };

  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Hex to HSL components converter
  const convertHexToHsl = (hex: string): string => {
    hex = hex.replace(/^#/, '');
    if (hex.length === 3) {
      hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    }
    if (hex.length !== 6) return '155 80% 50%';

    let r = parseInt(hex.substring(0, 2), 16) / 255;
    let g = parseInt(hex.substring(2, 4), 16) / 255;
    let b = parseInt(hex.substring(4, 6), 16) / 255;

    let max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;

    if (max !== min) {
      let d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }

    return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
  };

  const handleColorChange = (hex: string) => {
    setPrimaryColorHex(hex);
    const hsl = convertHexToHsl(hex);
    setPrimaryColorHsl(hsl);
  };

  // Check admin access and load settings
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

        // Load settings
        const settingsRes = await fetch('/api/admin/settings');
        if (settingsRes.ok) {
          const settings = await settingsRes.json();
          setSiteName(settings.siteName || 'Aurora');
          setSiteDescription(settings.siteDescription || 'Control your Discord music bot from the web');
          setMetaImageUrl(settings.metaImageUrl || '/aurora-logo.png');
          setMetaKeywords(settings.metaKeywords || 'aurora, discord music bot, music dashboard, discord bot');
          setPremiumEnabled(settings.premiumEnabled || false);
          setFaviconUrl(settings.faviconUrl || '/favicon.ico');
          setNavbarIconUrl(settings.navbarIconUrl || '/aurora-logo.png');
          setPrimaryColorHex(settings.primaryColorHex || '#10b981');
          setPrimaryColorHsl(settings.primaryColor || '155 80% 50%');
          setPrivacyPolicy(settings.privacyPolicy || '');
          setTermsOfService(settings.termsOfService || '');
          
          setBgType(settings.bgType || 'aurora');
          setBgColor(settings.bgColor || '#0a0a1a');
          setBgUrl(settings.bgUrl || '');
          setAuroraColor(settings.auroraColor || 'green');
          setAuroraCustomColor(settings.auroraCustomColor || '#10b981');
          
          // Landing page values
          setHeroSubtitle(settings.heroSubtitle || "Discord's finest music experience");
          setHeroTitleLine1(settings.heroTitleLine1 || "Experience Sound");
          setHeroTitleLine2(settings.heroTitleLine2 || "Like Never Before.");
          setHeroDescription(settings.heroDescription || "High-fidelity audio streaming for your Discord server. Let the music flow like the Northern Lights.");
          setBotInviteUrl(settings.botInviteUrl || "https://discord.com/oauth2/authorize?client_id=1310246126712127508&scope=bot&permissions=2151017536");
          
          setAboutTitle(settings.aboutTitle || "The Story Behind Aurora");
          setAboutSubtitle(settings.aboutSubtitle || "More than a bot — a commitment to bringing people together through music.");
          setAboutCard1Title(settings.aboutCard1Title || "Born from passion");
          setAboutCard1Text(settings.aboutCard1Text || "Aurora Music was created by music lovers who believed Discord deserved a bot that sounds as good as a dedicated music player.");
          setAboutCard2Title(settings.aboutCard2Title || "Built for performance");
          setAboutCard2Text(settings.aboutCard2Text || "Every millisecond matters. We've optimized our audio pipeline for zero-lag, crystal-clear playback across thousands of servers simultaneously.");
          setAboutCard3Title(settings.aboutCard3Title || "Loved by communities");
          setAboutCard3Text(settings.aboutCard3Text || "From small friend groups to massive gaming communities — Aurora adapts to your server's vibe and keeps the energy flowing.");

          setFeaturesTitle(settings.featuresTitle || "Why Aurora Music?");
          setFeaturesSubtitle(settings.featuresSubtitle || "Everything you need for the perfect listening experience.");
          setFeature1Title(settings.feature1Title || "High-Fidelity Audio");
          setFeature1Desc(settings.feature1Desc || "Crystal clear streaming with lossless quality support.");
          setFeature2Title(settings.feature2Title || "24/7 Playback");
          setFeature2Desc(settings.feature2Desc || "The music never stops. Always on, always ready.");
          setFeature3Title(settings.feature3Title || "Audio Filters");
          setFeature3Desc(settings.feature3Desc || "Bassboost, nightcore, 8D, and many more effects.");
          setFeature4Title(settings.feature4Title || "Web Dashboard");
          setFeature4Desc(settings.feature4Desc || "Manage queues and settings from any browser.");

          setJoinTitle(settings.joinTitle || "Join the Aurora Community");
          setJoinSubtitle(settings.joinSubtitle || "Get support, suggest features, stay updated, and hang out with thousands of music lovers on our Discord server.");
          setSupportServerUrl(settings.supportServerUrl || "https://discord.gg/jhag8t57eH");

          // Team values
          setTeamTitle(settings.teamTitle || "Meet the Team");
          setTeamSubtitle(settings.teamSubtitle || "The passionate developers behind Aurora Music.");
          setTeamMember1Name(settings.teamMember1Name || "Saravanan");
          setTeamMember1Role(settings.teamMember1Role || "Lead Developer");
          setTeamMember1Bio(settings.teamMember1Bio || "Building the future of Discord music bots.");
          setTeamMember1DiscordId(settings.teamMember1DiscordId || "775429424979378216");
          setTeamMember1Avatar(settings.teamMember1Avatar || "");
          setTeamMember2Name(settings.teamMember2Name || "Zilm");
          setTeamMember2Role(settings.teamMember2Role || "Core Developer");
          setTeamMember2Bio(settings.teamMember2Bio || "Crafting seamless audio experiences.");
          setTeamMember2DiscordId(settings.teamMember2DiscordId || "775015391487197206");
          setTeamMember2Avatar(settings.teamMember2Avatar || "");


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

    // Compute primary theme color based on background/aurora settings
    let computedHex = '#10b981';
    if (bgType === 'aurora') {
      if (auroraColor === 'green') computedHex = '#10b981';
      else if (auroraColor === 'purple') computedHex = '#a855f7';
      else if (auroraColor === 'red') computedHex = '#f43f5e';
      else if (auroraColor === 'cyan') computedHex = '#06b6d4';
      else if (auroraColor === 'custom') computedHex = auroraCustomColor || '#10b981';
    } else if (bgType === 'solid') {
      computedHex = bgColor || '#10b981';
    }
    const computedHsl = hexToHslString(computedHex);

    try {
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siteName: siteName.trim(),
          siteDescription: siteDescription.trim(),
          metaImageUrl: metaImageUrl.trim(),
          metaKeywords: metaKeywords.trim(),
          premiumEnabled: premiumEnabled,
          faviconUrl: faviconUrl.trim(),
          navbarIconUrl: navbarIconUrl.trim(),
          primaryColor: computedHsl,
          primaryColorHex: computedHex,
          privacyPolicy: privacyPolicy,
          termsOfService: termsOfService,
          
          bgType: bgType,
          bgColor: bgColor,
          bgUrl: bgUrl,
          auroraColor: auroraColor,
          auroraCustomColor: auroraCustomColor,
          
          // Landing page values
          heroSubtitle: heroSubtitle.trim(),
          heroTitleLine1: heroTitleLine1.trim(),
          heroTitleLine2: heroTitleLine2.trim(),
          heroDescription: heroDescription.trim(),
          botInviteUrl: botInviteUrl.trim(),

          aboutTitle: aboutTitle.trim(),
          aboutSubtitle: aboutSubtitle.trim(),
          aboutCard1Title: aboutCard1Title.trim(),
          aboutCard1Text: aboutCard1Text.trim(),
          aboutCard2Title: aboutCard2Title.trim(),
          aboutCard2Text: aboutCard2Text.trim(),
          aboutCard3Title: aboutCard3Title.trim(),
          aboutCard3Text: aboutCard3Text.trim(),

          featuresTitle: featuresTitle.trim(),
          featuresSubtitle: featuresSubtitle.trim(),
          feature1Title: feature1Title.trim(),
          feature1Desc: feature1Desc.trim(),
          feature2Title: feature2Title.trim(),
          feature2Desc: feature2Desc.trim(),
          feature3Title: feature3Title.trim(),
          feature3Desc: feature3Desc.trim(),
          feature4Title: feature4Title.trim(),
          feature4Desc: feature4Desc.trim(),

          joinTitle: joinTitle.trim(),
          joinSubtitle: joinSubtitle.trim(),
          supportServerUrl: supportServerUrl.trim(),

          // Team values
          teamTitle: teamTitle.trim(),
          teamSubtitle: teamSubtitle.trim(),
          teamMember1Name: teamMember1Name.trim(),
          teamMember1Role: teamMember1Role.trim(),
          teamMember1Bio: teamMember1Bio.trim(),
          teamMember1DiscordId: teamMember1DiscordId.trim(),
          teamMember1Avatar: teamMember1Avatar.trim(),
          teamMember2Name: teamMember2Name.trim(),
          teamMember2Role: teamMember2Role.trim(),
          teamMember2Bio: teamMember2Bio.trim(),
          teamMember2DiscordId: teamMember2DiscordId.trim(),
          teamMember2Avatar: teamMember2Avatar.trim(),

        })
      });

      if (response.ok) {
        addToast('Site settings updated successfully!', 'success');
        
        setPrimaryColorHex(computedHex);
        setPrimaryColorHsl(computedHsl);

        // Dynamically apply primary color settings on the current page immediately
        document.documentElement.style.setProperty('--glow-green', computedHsl, 'important');
        document.documentElement.style.setProperty('--aurora-green', computedHsl, 'important');

        // Dispatch background update event to notify AuroraBackground in real-time
        window.dispatchEvent(new CustomEvent('site-settings-updated'));

        // Dynamically update document title and favicon link in real-time
        document.title = `${siteName.trim()} - Discord Music Bot Dashboard`;
        let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
        if (!link) {
          link = document.createElement('link');
          link.rel = 'icon';
          document.getElementsByTagName('head')[0].appendChild(link);
        }
        link.href = faviconUrl.trim();

        // Dispatch custom event to notify Navigation component
        window.dispatchEvent(new CustomEvent('siteSettingsUpdated', {
          detail: { 
            siteName: siteName.trim(), 
            navbarIconUrl: navbarIconUrl.trim(),
            faviconUrl: faviconUrl.trim()
          }
        }));
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

  const resetToDefault = () => {
    if (confirm('Reset form fields to default values? (Will not save until you submit)')) {
      setSiteName('Aurora');
      setFaviconUrl('/favicon.ico');
      setNavbarIconUrl('/aurora-logo.png');
      handleColorChange('#10b981');
      
      setBgType('aurora');
      setBgColor('#0a0a1a');
      setBgUrl('');
      setAuroraColor('green');
      setAuroraCustomColor('#10b981');
      
      setHeroSubtitle("Discord's finest music experience");
      setHeroTitleLine1("Experience Sound");
      setHeroTitleLine2("Like Never Before.");
      setHeroDescription("High-fidelity audio streaming for your Discord server. Let the music flow like the Northern Lights.");
      setBotInviteUrl("https://discord.com/oauth2/authorize?client_id=1310246126712127508&scope=bot&permissions=2151017536");
      
      setAboutTitle("The Story Behind Aurora");
      setAboutSubtitle("More than a bot — a commitment to bringing people together through music.");
      setAboutCard1Title("Born from passion");
      setAboutCard1Text("Aurora Music was created by music lovers who believed Discord deserved a bot that sounds as good as a dedicated music player.");
      setAboutCard2Title("Built for performance");
      setAboutCard2Text("Every millisecond matters. We've optimized our audio pipeline for zero-lag, crystal-clear playback across thousands of servers simultaneously.");
      setAboutCard3Title("Loved by communities");
      setAboutCard3Text("From small friend groups to massive gaming communities — Aurora adapts to your server's vibe and keeps the energy flowing.");

      setFeaturesTitle("Why Aurora Music?");
      setFeaturesSubtitle("Everything you need for the perfect listening experience.");
      setFeature1Title("High-Fidelity Audio");
      setFeature1Desc("Crystal clear streaming with lossless quality support.");
      setFeature2Title("24/7 Playback");
      setFeature2Desc("The music never stops. Always on, always ready.");
      setFeature3Title("Audio Filters");
      setFeature3Desc("Bassboost, nightcore, 8D, and many more effects.");
      setFeature4Title("Web Dashboard");
      setFeature4Desc("Manage queues and settings from any browser.");

      setJoinTitle("Join the Aurora Community");
      setJoinSubtitle("Get support, suggest features, stay updated, and hang out with thousands of music lovers on our Discord server.");
      setSupportServerUrl("https://discord.gg/jhag8t57eH");


 
      addToast('Fields reset to defaults', 'warning');
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
          <div className="text-white text-xl">Loading site settings...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      <AuroraBackground />
      <CursorGlow />
      
      <div className="relative z-10 p-4 md:p-8 pt-24 md:pt-28">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => router.push('/admin')}
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4 group"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              <span>Back to Admin Dashboard</span>
            </button>
            <h1 className="text-4xl font-bold text-white mb-2">Website Settings</h1>
            <p className="text-gray-400">Customize site metadata, favicon, logos, themes, and official policies</p>
          </div>

          <form onSubmit={handleSave} className="space-y-6">
            {/* Main Settings Tabs */}
            <div className="flex bg-black/45 p-1 rounded-2xl border border-white/10 mb-6 overflow-x-auto max-w-full gap-1">
              <button
                type="button"
                onClick={() => setActiveMainTab('general')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
                  activeMainTab === 'general'
                    ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/25'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Layout className="w-4 h-4" />
                General & Theme
              </button>
              <button
                type="button"
                onClick={() => setActiveMainTab('landing')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
                  activeMainTab === 'landing'
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Compass className="w-4 h-4" />
                Landing Page
              </button>

              <button
                type="button"
                onClick={() => setActiveMainTab('legal')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
                  activeMainTab === 'legal'
                    ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <FileText className="w-4 h-4" />
                Policies & Terms
              </button>
            </div>

            {activeMainTab === 'general' && (
              <>
                {/* General Settings */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="backdrop-blur-xl bg-white/10 rounded-2xl p-6 border border-white/20"
            >
              <div className="flex items-center gap-3 mb-6">
                <Layout className="w-6 h-6 text-purple-400" />
                <h2 className="text-xl font-bold text-white font-heading">General Settings</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-gray-300 text-sm font-medium">Website Name</label>
                  <input
                    type="text"
                    value={siteName}
                    onChange={(e) => setSiteName(e.target.value)}
                    required
                    placeholder="e.g. Aurora"
                    className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <p className="text-gray-400 text-xs">Used as the browser tab title and navbar text.</p>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="block text-gray-300 text-sm font-medium">Website Description (Discord & Social Embed Subtitle)</label>
                  <textarea
                    rows={2}
                    value={siteDescription}
                    onChange={(e) => setSiteDescription(e.target.value)}
                    required
                    placeholder="Control your Discord music bot from the web"
                    className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                  />
                  <p className="text-gray-400 text-xs">The description subtitle shown when your website link is shared on Discord, Google, Twitter, Facebook, or messaging apps.</p>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="block text-gray-300 text-sm font-medium">Social & Discord Link Embed Image / Banner</label>
                  <div className="flex gap-4 items-center">
                    <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0">
                      <img 
                        src={metaImageUrl || '/aurora-logo.png'} 
                        alt="Meta Image Preview" 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/aurora-logo.png';
                        }}
                      />
                    </div>
                    <div className="flex-1 flex gap-2">
                      <input
                        type="text"
                        value={metaImageUrl}
                        onChange={(e) => setMetaImageUrl(e.target.value)}
                        placeholder="e.g. /aurora-logo.png or image URL"
                        className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                      />
                      <label className="flex items-center justify-center gap-2 px-4 py-3 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 hover:border-purple-500/50 rounded-xl text-purple-300 hover:text-white font-medium cursor-pointer transition-all text-sm flex-shrink-0">
                        <Upload className="w-4 h-4" />
                        <span>Upload</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileUpload(e, setMetaImageUrl, 500, false)}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                  <p className="text-gray-400 text-xs">The preview image thumbnail or card banner displayed in Discord link embeds.</p>
                </div>

                {/* Live Discord Link Embed Preview */}
                <div className="space-y-2 md:col-span-2 bg-[#2f3136] p-4 rounded-2xl border border-white/10 shadow-lg">
                  <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span>Live Discord Embed Preview (When shared in Discord chat)</span>
                  </div>
                  <div className="bg-[#202225] border-l-4 border-purple-500 p-3.5 rounded-xl text-sm space-y-1.5 shadow-inner">
                    <div className="text-[11px] font-semibold text-gray-400">{siteName || 'Aurora'}</div>
                    <div className="text-blue-400 font-bold hover:underline cursor-pointer text-sm">
                      {siteName || 'Aurora'} - Discord Music Bot Dashboard
                    </div>
                    <div className="text-gray-300 text-xs leading-relaxed">
                      {siteDescription || 'Control your Discord music bot from the web'}
                    </div>
                    {metaImageUrl && (
                      <div className="pt-2">
                        <img 
                          src={metaImageUrl} 
                          alt="Embed Preview" 
                          className="max-h-48 max-w-full rounded-lg border border-white/5 object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }} 
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="block text-gray-300 text-sm font-medium">SEO Keywords</label>
                  <input
                    type="text"
                    value={metaKeywords}
                    onChange={(e) => setMetaKeywords(e.target.value)}
                    placeholder="e.g. aurora, discord music bot, music dashboard, discord bot"
                    className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                  />
                  <p className="text-gray-400 text-xs">Comma-separated search terms for Google and search engines.</p>
                </div>



                <div className="space-y-2">
                  <label className="block text-gray-300 text-sm font-medium">Favicon</label>
                  <div className="flex gap-4 items-center">
                    <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0">
                      <img 
                        src={faviconUrl || '/favicon.ico'} 
                        alt="Favicon Preview" 
                        className="w-8 h-8 object-cover rounded-full"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/favicon.ico';
                        }}
                      />
                    </div>
                    <div className="flex-1 flex gap-2">
                      <input
                        type="text"
                        value={faviconUrl}
                        onChange={(e) => setFaviconUrl(e.target.value)}
                        required
                        placeholder="e.g. /favicon.ico"
                        className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                      />
                      <label className="flex items-center justify-center gap-2 px-4 py-3 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 hover:border-purple-500/50 rounded-xl text-purple-300 hover:text-white font-medium cursor-pointer transition-all text-sm flex-shrink-0">
                        <Upload className="w-4 h-4" />
                        <span>Upload</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileUpload(e, setFaviconUrl, 100, true)}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                  <p className="text-gray-400 text-xs">Upload an image file (converted to a circular persistent Base64 under 100KB) or enter a URL.</p>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="block text-gray-300 text-sm font-medium">Navbar Brand Logo</label>
                  <div className="flex gap-4 items-center">
                    <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0">
                      <img 
                        src={navbarIconUrl || '/aurora-logo.png'} 
                        alt="Logo Preview" 
                        className="w-10 h-10 object-cover rounded-full"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/aurora-logo.png';
                        }}
                      />
                    </div>
                    <div className="flex-1 flex gap-2">
                      <input
                        type="text"
                        value={navbarIconUrl}
                        onChange={(e) => setNavbarIconUrl(e.target.value)}
                        required
                        placeholder="e.g. /aurora-logo.png"
                        className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                      />
                      <label className="flex items-center justify-center gap-2 px-4 py-3 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 hover:border-purple-500/50 rounded-xl text-purple-300 hover:text-white font-medium cursor-pointer transition-all text-sm flex-shrink-0">
                        <Upload className="w-4 h-4" />
                        <span>Upload</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileUpload(e, setNavbarIconUrl, 300, true)}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                  <p className="text-gray-400 text-xs mt-1">Logo image displayed at the top left of the navigation bar (converted to a circular persistent Base64 under 300KB).</p>
                </div>
              </div>
            </motion.div>



            {/* Background & Aurora Customizer */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 }}
              className="backdrop-blur-xl bg-white/10 rounded-2xl p-6 border border-white/20 animate-fade-in"
            >
              <div className="flex items-center gap-3 mb-6">
                <Globe className="w-6 h-6 text-purple-400" />
                <h2 className="text-xl font-bold text-white font-heading">Background & Aurora</h2>
              </div>

              <div className="space-y-6">
                {/* Background Type */}
                <div className="space-y-1.5">
                  <label className="block text-gray-300 text-sm font-medium">Background Backdrop Type</label>
                  <select
                    value={bgType}
                    onChange={(e) => setBgType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-purple-500 text-sm"
                  >
                    <option value="aurora">Interactive WebGL Aurora curtains</option>
                    <option value="solid">Solid Background Color</option>
                    <option value="image">Custom Static Image URL</option>
                    <option value="gif">Custom Animated GIF URL</option>
                  </select>
                </div>

                {/* Conditional Fields: Aurora colors */}
                {bgType === 'aurora' && (
                  <div className="p-4 bg-white/5 rounded-xl border border-white/5 space-y-4">
                    <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">Aurora Effect settings</span>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="block text-gray-300 text-xs font-medium">Aurora Color Palette Preset</label>
                        <select
                          value={auroraColor}
                          onChange={(e) => setAuroraColor(e.target.value as any)}
                          className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-purple-500 text-xs"
                        >
                          <option value="green">Classic Green & Teal</option>
                          <option value="purple">Cosmic Purple & Magenta</option>
                          <option value="red">Solar Red & Ember</option>
                          <option value="cyan">Cyber Cyan & Ocean</option>
                          <option value="custom">Custom Color Tint</option>
                        </select>
                      </div>

                      {auroraColor === 'custom' && (
                        <div className="space-y-1.5">
                          <label className="block text-gray-300 text-xs font-medium">Custom Tint Color</label>
                          <div className="flex gap-2">
                            <input
                              type="color"
                              value={auroraCustomColor}
                              onChange={(e) => setAuroraCustomColor(e.target.value)}
                              className="w-10 h-10 bg-transparent border-0 cursor-pointer rounded-lg overflow-hidden flex-shrink-0"
                            />
                            <input
                              type="text"
                              value={auroraCustomColor}
                              onChange={(e) => setAuroraCustomColor(e.target.value)}
                              placeholder="#10b981"
                              maxLength={7}
                              className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-purple-500 text-xs font-mono"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Conditional Fields: Solid color */}
                {bgType === 'solid' && (
                  <div className="p-4 bg-white/5 rounded-xl border border-white/5 space-y-4">
                    <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">Solid Color settings</span>
                    <div className="space-y-1.5">
                      <label className="block text-gray-300 text-xs font-medium">Select Solid Color</label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={bgColor}
                          onChange={(e) => setBgColor(e.target.value)}
                          className="w-10 h-10 bg-transparent border-0 cursor-pointer rounded-lg overflow-hidden flex-shrink-0"
                        />
                        <input
                          type="text"
                          value={bgColor}
                          onChange={(e) => setBgColor(e.target.value)}
                          placeholder="#0a0a1a"
                          maxLength={7}
                          className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-purple-500 text-xs font-mono"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Conditional Fields: Image or GIF URL */}
                {(bgType === 'image' || bgType === 'gif') && (
                  <div className="p-4 bg-white/5 rounded-xl border border-white/5 space-y-4">
                    <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">
                      {bgType === 'image' ? 'Image background settings' : 'GIF background settings'}
                    </span>
                    <div className="space-y-2">
                      <label className="block text-gray-300 text-xs font-medium">Enter backdrop URL</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={bgUrl}
                          onChange={(e) => setBgUrl(e.target.value)}
                          placeholder="https://example.com/background.jpg"
                          className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-purple-500 text-xs"
                        />
                        <label className="flex items-center justify-center gap-1 px-3 py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 hover:border-purple-500/50 rounded-lg text-purple-300 hover:text-white font-medium cursor-pointer transition-all text-xs flex-shrink-0">
                          <Upload className="w-3.5 h-3.5" />
                          <span>Upload File</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleFileUpload(e, setBgUrl, 800, false)}
                            className="hidden"
                          />
                        </label>
                      </div>
                      <p className="text-gray-400 text-[10px]">
                        Upload a file or paste a web link. High-resolution files are automatically compressed under 800KB for faster loading.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
            </>
            )}

            {activeMainTab === 'landing' && (
            /* Landing Page Customization */
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="backdrop-blur-xl bg-white/10 rounded-2xl p-6 border border-white/20"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b border-white/10 pb-5">
                <div className="flex items-center gap-3">
                  <Compass className="w-6 h-6 text-emerald-400" />
                  <div>
                    <h2 className="text-xl font-bold text-white font-heading">Landing Page Customizer</h2>
                    <p className="text-gray-400 text-xs mt-0.5">Customize texts, cards, and invite links on the public landing page</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 self-start md:self-auto">
                  {/* Sub-tabs */}
                  <div className="flex bg-black/40 p-1 rounded-xl border border-white/5 overflow-x-auto max-w-full">
                    {(['hero', 'about', 'features', 'join', 'team'] as const).map((tab) => (
                      <button
                        key={tab}
                        type="button"
                        onClick={() => setActiveLandingTab(tab)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all whitespace-nowrap ${
                          activeLandingTab === tab
                            ? 'bg-emerald-500 text-white'
                            : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>

                  {/* Reset Section Button */}
                  <button
                    type="button"
                    onClick={() => {
                      if (activeLandingTab === 'hero') resetHeroSection();
                      else if (activeLandingTab === 'about') resetAboutSection();
                      else if (activeLandingTab === 'features') resetFeaturesSection();
                      else if (activeLandingTab === 'join') resetJoinSection();
                      else if (activeLandingTab === 'team') resetTeamSection();
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/30 text-red-400 hover:text-red-300 text-[10px] font-bold uppercase tracking-wider transition-all"
                    title="Reset this section to its default templates"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset Section</span>
                  </button>
                </div>
              </div>

              {/* Tab Contents */}
              {activeLandingTab === 'hero' && (
                <div className="space-y-6 animate-fade-in">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="block text-gray-300 text-sm font-medium">Hero Subtitle</label>
                      <input
                        type="text"
                        value={heroSubtitle}
                        onChange={(e) => setHeroSubtitle(e.target.value)}
                        placeholder="e.g. Discord's finest music experience"
                        className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-gray-300 text-sm font-medium">Discord Bot Invite URL</label>
                      <input
                        type="text"
                        value={botInviteUrl}
                        onChange={(e) => setBotInviteUrl(e.target.value)}
                        placeholder="e.g. Bot OAuth invite link"
                        className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="block text-gray-300 text-sm font-medium">Hero Title Line 1</label>
                      <input
                        type="text"
                        value={heroTitleLine1}
                        onChange={(e) => setHeroTitleLine1(e.target.value)}
                        placeholder="e.g. Experience Sound"
                        className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-gray-300 text-sm font-medium">Hero Title Line 2</label>
                      <input
                        type="text"
                        value={heroTitleLine2}
                        onChange={(e) => setHeroTitleLine2(e.target.value)}
                        placeholder="e.g. Like Never Before."
                        className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-gray-300 text-sm font-medium">Hero Description</label>
                    <textarea
                      value={heroDescription}
                      onChange={(e) => setHeroDescription(e.target.value)}
                      rows={3}
                      placeholder="Enter a brief description for your bot..."
                      className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm resize-y"
                    />
                  </div>
                </div>
              )}

              {activeLandingTab === 'about' && (
                <div className="space-y-6 animate-fade-in">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="block text-gray-300 text-sm font-medium">About Section Title</label>
                      <input
                        type="text"
                        value={aboutTitle}
                        onChange={(e) => setAboutTitle(e.target.value)}
                        placeholder="e.g. The Story Behind Aurora"
                        className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-gray-300 text-sm font-medium">About Section Subtitle</label>
                      <input
                        type="text"
                        value={aboutSubtitle}
                        onChange={(e) => setAboutSubtitle(e.target.value)}
                        placeholder="Enter subtitle description..."
                        className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                      />
                    </div>
                  </div>

                  <div className="border-t border-white/10 pt-4 mt-4">
                    <h3 className="text-sm font-bold text-gray-300 mb-4 uppercase tracking-wider">About Cards (Timeline Story)</h3>
                    
                    <div className="space-y-6">
                      {/* Card 1 */}
                      <div className="p-4 bg-white/5 rounded-xl border border-white/5 space-y-4">
                        <span className="text-xs font-bold text-purple-400 uppercase">Story Point 1</span>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="md:col-span-1 space-y-2">
                            <label className="block text-gray-300 text-xs font-medium">Card Title</label>
                            <input
                              type="text"
                              value={aboutCard1Title}
                              onChange={(e) => setAboutCard1Title(e.target.value)}
                              placeholder="e.g. Born from passion"
                              className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 text-xs"
                            />
                          </div>
                          <div className="md:col-span-2 space-y-2">
                            <label className="block text-gray-300 text-xs font-medium">Card Text</label>
                            <input
                              type="text"
                              value={aboutCard1Text}
                              onChange={(e) => setAboutCard1Text(e.target.value)}
                              placeholder="Enter text..."
                              className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 text-xs"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Card 2 */}
                      <div className="p-4 bg-white/5 rounded-xl border border-white/5 space-y-4">
                        <span className="text-xs font-bold text-purple-400 uppercase">Story Point 2</span>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="md:col-span-1 space-y-2">
                            <label className="block text-gray-300 text-xs font-medium">Card Title</label>
                            <input
                              type="text"
                              value={aboutCard2Title}
                              onChange={(e) => setAboutCard2Title(e.target.value)}
                              placeholder="e.g. Built for performance"
                              className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 text-xs"
                            />
                          </div>
                          <div className="md:col-span-2 space-y-2">
                            <label className="block text-gray-300 text-xs font-medium">Card Text</label>
                            <input
                              type="text"
                              value={aboutCard2Text}
                              onChange={(e) => setAboutCard2Text(e.target.value)}
                              placeholder="Enter text..."
                              className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 text-xs"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Card 3 */}
                      <div className="p-4 bg-white/5 rounded-xl border border-white/5 space-y-4">
                        <span className="text-xs font-bold text-purple-400 uppercase">Story Point 3</span>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="md:col-span-1 space-y-2">
                            <label className="block text-gray-300 text-xs font-medium">Card Title</label>
                            <input
                              type="text"
                              value={aboutCard3Title}
                              onChange={(e) => setAboutCard3Title(e.target.value)}
                              placeholder="e.g. Loved by communities"
                              className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 text-xs"
                            />
                          </div>
                          <div className="md:col-span-2 space-y-2">
                            <label className="block text-gray-300 text-xs font-medium">Card Text</label>
                            <input
                              type="text"
                              value={aboutCard3Text}
                              onChange={(e) => setAboutCard3Text(e.target.value)}
                              placeholder="Enter text..."
                              className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 text-xs"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeLandingTab === 'features' && (
                <div className="space-y-6 animate-fade-in">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="block text-gray-300 text-sm font-medium">Features Title</label>
                      <input
                        type="text"
                        value={featuresTitle}
                        onChange={(e) => setFeaturesTitle(e.target.value)}
                        placeholder="e.g. Why Aurora Music?"
                        className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-gray-300 text-sm font-medium">Features Subtitle</label>
                      <input
                        type="text"
                        value={featuresSubtitle}
                        onChange={(e) => setFeaturesSubtitle(e.target.value)}
                        placeholder="e.g. Everything you need for the perfect listening experience."
                        className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                      />
                    </div>
                  </div>

                  <div className="border-t border-white/10 pt-4 mt-4">
                    <h3 className="text-sm font-bold text-gray-300 mb-4 uppercase tracking-wider">Features Details (4 Cards Grid)</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Feature 1 */}
                      <div className="p-4 bg-white/5 rounded-xl border border-white/5 space-y-3">
                        <span className="text-xs font-bold text-purple-400 uppercase">Feature 1</span>
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={feature1Title}
                            onChange={(e) => setFeature1Title(e.target.value)}
                            placeholder="Feature title..."
                            className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 text-xs font-semibold"
                          />
                          <input
                            type="text"
                            value={feature1Desc}
                            onChange={(e) => setFeature1Desc(e.target.value)}
                            placeholder="Feature description..."
                            className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 text-xs"
                          />
                        </div>
                      </div>

                      {/* Feature 2 */}
                      <div className="p-4 bg-white/5 rounded-xl border border-white/5 space-y-3">
                        <span className="text-xs font-bold text-purple-400 uppercase">Feature 2</span>
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={feature2Title}
                            onChange={(e) => setFeature2Title(e.target.value)}
                            placeholder="Feature title..."
                            className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 text-xs font-semibold"
                          />
                          <input
                            type="text"
                            value={feature2Desc}
                            onChange={(e) => setFeature2Desc(e.target.value)}
                            placeholder="Feature description..."
                            className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 text-xs"
                          />
                        </div>
                      </div>

                      {/* Feature 3 */}
                      <div className="p-4 bg-white/5 rounded-xl border border-white/5 space-y-3">
                        <span className="text-xs font-bold text-purple-400 uppercase">Feature 3</span>
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={feature3Title}
                            onChange={(e) => setFeature3Title(e.target.value)}
                            placeholder="Feature title..."
                            className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 text-xs font-semibold"
                          />
                          <input
                            type="text"
                            value={feature3Desc}
                            onChange={(e) => setFeature3Desc(e.target.value)}
                            placeholder="Feature description..."
                            className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 text-xs"
                          />
                        </div>
                      </div>

                      {/* Feature 4 */}
                      <div className="p-4 bg-white/5 rounded-xl border border-white/5 space-y-3">
                        <span className="text-xs font-bold text-purple-400 uppercase">Feature 4</span>
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={feature4Title}
                            onChange={(e) => setFeature4Title(e.target.value)}
                            placeholder="Feature title..."
                            className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 text-xs font-semibold"
                          />
                          <input
                            type="text"
                            value={feature4Desc}
                            onChange={(e) => setFeature4Desc(e.target.value)}
                            placeholder="Feature description..."
                            className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeLandingTab === 'join' && (
                <div className="space-y-6 animate-fade-in">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="block text-gray-300 text-sm font-medium">Join Section Title</label>
                      <input
                        type="text"
                        value={joinTitle}
                        onChange={(e) => setJoinTitle(e.target.value)}
                        placeholder="e.g. Join the Aurora Community"
                        className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-gray-300 text-sm font-medium">Support Server Invite Link</label>
                      <input
                        type="text"
                        value={supportServerUrl}
                        onChange={(e) => setSupportServerUrl(e.target.value)}
                        placeholder="e.g. https://discord.gg/inviteCode"
                        className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-gray-300 text-sm font-medium">Join Section Subtitle</label>
                    <textarea
                      value={joinSubtitle}
                      onChange={(e) => setJoinSubtitle(e.target.value)}
                      rows={3}
                      placeholder="Enter description..."
                      className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm resize-y"
                    />
                  </div>
                </div>
              )}

              {activeLandingTab === 'team' && (
                <div className="space-y-6 animate-fade-in">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="block text-gray-300 text-sm font-medium">Team Section Title</label>
                      <input
                        type="text"
                        value={teamTitle}
                        onChange={(e) => setTeamTitle(e.target.value)}
                        placeholder="e.g. Meet the Team"
                        className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-gray-300 text-sm font-medium">Team Section Subtitle</label>
                      <input
                        type="text"
                        value={teamSubtitle}
                        onChange={(e) => setTeamSubtitle(e.target.value)}
                        placeholder="e.g. The passionate developers behind Aurora Music."
                        className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                      />
                    </div>
                  </div>

                  <div className="border-t border-white/10 pt-4 mt-4">
                    <h3 className="text-sm font-bold text-gray-300 mb-4 uppercase tracking-wider">Team Members (2 Developers Cards)</h3>
                    
                    <div className="space-y-6">
                      {/* Team Member 1 */}
                      <div className="p-4 bg-white/5 rounded-xl border border-white/5 space-y-4">
                        <span className="text-xs font-bold text-emerald-400 uppercase">Team Member 1 (Lead Developer)</span>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <label className="block text-gray-300 text-xs font-medium">Name</label>
                            <input
                              type="text"
                              value={teamMember1Name}
                              onChange={(e) => setTeamMember1Name(e.target.value)}
                              placeholder="Name"
                              className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 text-xs"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="block text-gray-300 text-xs font-medium">Role</label>
                            <input
                              type="text"
                              value={teamMember1Role}
                              onChange={(e) => setTeamMember1Role(e.target.value)}
                              placeholder="Role"
                              className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 text-xs"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="block text-gray-300 text-xs font-medium">Discord User ID (For Avatar Fetch)</label>
                            <input
                              type="text"
                              value={teamMember1DiscordId}
                              onChange={(e) => setTeamMember1DiscordId(e.target.value)}
                              placeholder="Discord User ID"
                              className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 text-xs"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="md:col-span-2 space-y-2">
                            <label className="block text-gray-300 text-xs font-medium">Short Bio</label>
                            <input
                              type="text"
                              value={teamMember1Bio}
                              onChange={(e) => setTeamMember1Bio(e.target.value)}
                              placeholder="Short bio..."
                              className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 text-xs"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="block text-gray-300 text-xs font-medium">Or Custom Avatar Upload</label>
                            <div className="flex gap-2 items-center">
                              <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                                <img
                                  src={teamMember1Avatar || `https://cdn.discordapp.com/embed/avatars/${parseInt(teamMember1DiscordId.slice(-4) || '0') % 5}.png`}
                                  alt="Custom Member 1 Avatar"
                                  className="w-8 h-8 rounded-full object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = 'https://cdn.discordapp.com/embed/avatars/0.png';
                                  }}
                                />
                              </div>
                              <label className="flex items-center justify-center gap-1.5 px-3 py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 hover:border-purple-500/50 rounded-lg text-purple-300 hover:text-white font-medium cursor-pointer transition-all text-xs flex-1">
                                <Upload className="w-3.5 h-3.5" />
                                <span>Upload</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => handleFileUpload(e, setTeamMember1Avatar, 200, true)}
                                  className="hidden"
                                />
                              </label>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Team Member 2 */}
                      <div className="p-4 bg-white/5 rounded-xl border border-white/5 space-y-4">
                        <span className="text-xs font-bold text-emerald-400 uppercase">Team Member 2 (Core Developer)</span>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <label className="block text-gray-300 text-xs font-medium">Name</label>
                            <input
                              type="text"
                              value={teamMember2Name}
                              onChange={(e) => setTeamMember2Name(e.target.value)}
                              placeholder="Name"
                              className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 text-xs"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="block text-gray-300 text-xs font-medium">Role</label>
                            <input
                              type="text"
                              value={teamMember2Role}
                              onChange={(e) => setTeamMember2Role(e.target.value)}
                              placeholder="Role"
                              className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 text-xs"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="block text-gray-300 text-xs font-medium">Discord User ID (For Avatar Fetch)</label>
                            <input
                              type="text"
                              value={teamMember2DiscordId}
                              onChange={(e) => setTeamMember2DiscordId(e.target.value)}
                              placeholder="Discord User ID"
                              className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 text-xs"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="md:col-span-2 space-y-2">
                            <label className="block text-gray-300 text-xs font-medium">Short Bio</label>
                            <input
                              type="text"
                              value={teamMember2Bio}
                              onChange={(e) => setTeamMember2Bio(e.target.value)}
                              placeholder="Short bio..."
                              className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 text-xs"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="block text-gray-300 text-xs font-medium">Or Custom Avatar Upload</label>
                            <div className="flex gap-2 items-center">
                              <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                                <img
                                  src={teamMember2Avatar || `https://cdn.discordapp.com/embed/avatars/${parseInt(teamMember2DiscordId.slice(-4) || '0') % 5}.png`}
                                  alt="Custom Member 2 Avatar"
                                  className="w-8 h-8 rounded-full object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = 'https://cdn.discordapp.com/embed/avatars/0.png';
                                  }}
                                />
                              </div>
                              <label className="flex items-center justify-center gap-1.5 px-3 py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 hover:border-purple-500/50 rounded-lg text-purple-300 hover:text-white font-medium cursor-pointer transition-all text-xs flex-1">
                                <Upload className="w-3.5 h-3.5" />
                                <span>Upload</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => handleFileUpload(e, setTeamMember2Avatar, 200, true)}
                                  className="hidden"
                                />
                              </label>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
            )}

            {activeMainTab === 'legal' && (
            /* Legal Policies */
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="backdrop-blur-xl bg-white/10 rounded-2xl p-6 border border-white/20"
            >
              <div className="flex items-center gap-3 mb-6">
                <FileText className="w-6 h-6 text-blue-400" />
                <h2 className="text-xl font-bold text-white font-heading">Policies & Terms</h2>
              </div>

              <div className="space-y-8">
                {/* Privacy Policy Editor */}
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                    <label className="block text-gray-300 text-sm font-medium">Privacy Policy (Markdown)</label>
                    
                    {/* Tabs */}
                    <div className="flex bg-black/40 p-1 rounded-xl border border-white/5 self-start">
                      <button
                        type="button"
                        onClick={() => setActivePrivacyTab('edit')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                          activePrivacyTab === 'edit'
                            ? 'bg-purple-500 text-white'
                            : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setActivePrivacyTab('preview')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                          activePrivacyTab === 'preview'
                            ? 'bg-purple-500 text-white'
                            : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Preview
                      </button>
                    </div>
                  </div>

                  {activePrivacyTab === 'edit' ? (
                    <div className="space-y-2 border border-white/10 rounded-xl overflow-hidden bg-black/20">
                      {/* Markdown Toolbar */}
                      <div className="flex flex-wrap gap-1 p-2 bg-white/5 border-b border-white/10">
                        <button
                          type="button"
                          title="Bold"
                          onClick={() => insertMarkdown('privacyPolicy', '**', '**')}
                          className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                        >
                          <Bold className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          title="Italic"
                          onClick={() => insertMarkdown('privacyPolicy', '*', '*')}
                          className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                        >
                          <Italic className="w-4 h-4" />
                        </button>
                        <div className="w-[1px] h-6 bg-white/10 mx-1 self-center" />
                        <button
                          type="button"
                          title="Heading 1"
                          onClick={() => insertMarkdown('privacyPolicy', '# ')}
                          className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors font-bold text-xs"
                        >
                          H1
                        </button>
                        <button
                          type="button"
                          title="Heading 2"
                          onClick={() => insertMarkdown('privacyPolicy', '## ')}
                          className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors font-bold text-xs"
                        >
                          H2
                        </button>
                        <button
                          type="button"
                          title="Heading 3"
                          onClick={() => insertMarkdown('privacyPolicy', '### ')}
                          className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors font-bold text-xs"
                        >
                          H3
                        </button>
                        <div className="w-[1px] h-6 bg-white/10 mx-1 self-center" />
                        <button
                          type="button"
                          title="Link"
                          onClick={() => insertMarkdown('privacyPolicy', '[', '](url)')}
                          className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                        >
                          <Link2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          title="Bullet List"
                          onClick={() => insertMarkdown('privacyPolicy', '- ')}
                          className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                        >
                          <List className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          title="Quote"
                          onClick={() => insertMarkdown('privacyPolicy', '> ')}
                          className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                        >
                          <Quote className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          title="Code Block"
                          onClick={() => insertMarkdown('privacyPolicy', '\n```\n', '\n```\n')}
                          className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                        >
                          <Code className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <textarea
                        id="privacyPolicy"
                        value={privacyPolicy}
                        onChange={(e) => setPrivacyPolicy(e.target.value)}
                        rows={10}
                        placeholder="Enter custom privacy policy in Markdown... (Leave empty to use default system template)"
                        className="w-full px-4 py-3 bg-transparent border-0 rounded-b-xl text-white placeholder-gray-500 focus:outline-none focus:ring-0 font-mono text-sm leading-relaxed resize-y min-h-[150px]"
                      />
                    </div>
                  ) : (
                    <div 
                      className="w-full px-6 py-6 bg-black/40 border border-white/10 rounded-xl text-gray-300 text-sm leading-relaxed max-h-[350px] overflow-y-auto font-sans markdown-content"
                      dangerouslySetInnerHTML={{ __html: parseMarkdown(privacyPolicy) || '<p class="text-gray-500 italic">No custom privacy policy set. Default template will be displayed.</p>' }}
                    />
                  )}
                </div>

                {/* Terms of Service Editor */}
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                    <label className="block text-gray-300 text-sm font-medium">Terms of Service (Markdown)</label>
                    
                    {/* Tabs */}
                    <div className="flex bg-black/40 p-1 rounded-xl border border-white/5 self-start">
                      <button
                        type="button"
                        onClick={() => setActiveTermsTab('edit')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                          activeTermsTab === 'edit'
                            ? 'bg-purple-500 text-white'
                            : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTermsTab('preview')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                          activeTermsTab === 'preview'
                            ? 'bg-purple-500 text-white'
                            : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Preview
                      </button>
                    </div>
                  </div>

                  {activeTermsTab === 'edit' ? (
                    <div className="space-y-2 border border-white/10 rounded-xl overflow-hidden bg-black/20">
                      {/* Markdown Toolbar */}
                      <div className="flex flex-wrap gap-1 p-2 bg-white/5 border-b border-white/10">
                        <button
                          type="button"
                          title="Bold"
                          onClick={() => insertMarkdown('termsOfService', '**', '**')}
                          className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                        >
                          <Bold className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          title="Italic"
                          onClick={() => insertMarkdown('termsOfService', '*', '*')}
                          className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                        >
                          <Italic className="w-4 h-4" />
                        </button>
                        <div className="w-[1px] h-6 bg-white/10 mx-1 self-center" />
                        <button
                          type="button"
                          title="Heading 1"
                          onClick={() => insertMarkdown('termsOfService', '# ')}
                          className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors font-bold text-xs"
                        >
                          H1
                        </button>
                        <button
                          type="button"
                          title="Heading 2"
                          onClick={() => insertMarkdown('termsOfService', '## ')}
                          className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors font-bold text-xs"
                        >
                          H2
                        </button>
                        <button
                          type="button"
                          title="Heading 3"
                          onClick={() => insertMarkdown('termsOfService', '### ')}
                          className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors font-bold text-xs"
                        >
                          H3
                        </button>
                        <div className="w-[1px] h-6 bg-white/10 mx-1 self-center" />
                        <button
                          type="button"
                          title="Link"
                          onClick={() => insertMarkdown('termsOfService', '[', '](url)')}
                          className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                        >
                          <Link2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          title="Bullet List"
                          onClick={() => insertMarkdown('termsOfService', '- ')}
                          className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                        >
                          <List className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          title="Quote"
                          onClick={() => insertMarkdown('termsOfService', '> ')}
                          className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                        >
                          <Quote className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          title="Code Block"
                          onClick={() => insertMarkdown('termsOfService', '\n```\n', '\n```\n')}
                          className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                        >
                          <Code className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <textarea
                        id="termsOfService"
                        value={termsOfService}
                        onChange={(e) => setTermsOfService(e.target.value)}
                        rows={10}
                        placeholder="Enter custom terms of service in Markdown... (Leave empty to use default system template)"
                        className="w-full px-4 py-3 bg-transparent border-0 rounded-b-xl text-white placeholder-gray-500 focus:outline-none focus:ring-0 font-mono text-sm leading-relaxed resize-y min-h-[150px]"
                      />
                    </div>
                  ) : (
                    <div 
                      className="w-full px-6 py-6 bg-black/40 border border-white/10 rounded-xl text-gray-300 text-sm leading-relaxed max-h-[350px] overflow-y-auto font-sans markdown-content"
                      dangerouslySetInnerHTML={{ __html: parseMarkdown(termsOfService) || '<p class="text-gray-500 italic">No custom terms of service set. Default template will be displayed.</p>' }}
                    />
                  )}
                </div>
              </div>
            </motion.div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-black/20 p-4 border border-white/10 rounded-2xl backdrop-blur-md">
              <button
                type="button"
                onClick={resetToDefault}
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
