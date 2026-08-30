'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AuroraBackground from '../components/AuroraBackground';
import CursorGlow from '../components/CursorGlow';
import HeroSection from '../components/HeroSection';
import AboutSection from '../components/AboutSection';
import FeaturesSection from '../components/FeaturesSection';
import CommandsSection from '../components/CommandsSection';
import DiscordJoinSection from '../components/DiscordJoinSection';
import Footer from '../components/Footer';

export default function Home() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    const initPage = async () => {
      try {
        const userRes = await fetch('/api/auth/user', {
          credentials: 'include',
          headers: { 'Cache-Control': 'no-cache' }
        });
        const userData = await userRes.json();
        if (userData.id) {
          // User is logged in, redirect immediately
          router.replace('/guilds');
          return;
        }

        // Fetch settings
        const settingsRes = await fetch('/api/admin/settings', { cache: 'no-store' });
        if (settingsRes.ok) {
          const settingsData = await settingsRes.json();
          setSettings(settingsData);
        }
        setChecking(false);
      } catch (error) {
        console.error('Error loading landing page settings:', error);
        setChecking(false);
      }
    };
    initPage();
  }, [router]);

  // Show nothing while checking auth - seamless transition
  if (checking) {
    return null;
  }

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden">
      <AuroraBackground />
      <CursorGlow />
      <main>
        <HeroSection settings={settings} />
        <AboutSection settings={settings} />
        <FeaturesSection settings={settings} />
        <CommandsSection />
        <DiscordJoinSection settings={settings} />
      </main>
      <Footer />
    </div>
  );
}

