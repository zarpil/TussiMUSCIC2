'use client';

import React, { useState, useEffect } from 'react';
import { useMusicPlayer } from '../hooks/useMusicPlayer';
import MiniPlayerWindow from './MiniPlayerWindow';
import { useSmoothTime } from '../hooks/useSmoothTime';

export default function GlobalMiniPlayer() {
  const [guildId, setGuildId] = useState<string>('');
  const [userId, setUserId] = useState<string>('');
  const [siteName, setSiteName] = useState<string>('');

  useEffect(() => {
    const getStoredGuild = () => {
      if (typeof window === 'undefined') return '';
      const fromStorage = localStorage.getItem('aurora_active_guildId');
      if (fromStorage) return fromStorage;

      const pathMatch = window.location.pathname.match(/\/dashboard\/([^\/]+)/);
      if (pathMatch && pathMatch[1]) {
        localStorage.setItem('aurora_active_guildId', pathMatch[1]);
        return pathMatch[1];
      }

      return '';
    };

    const getStoredUser = () => {
      if (typeof window === 'undefined') return '';
      return localStorage.getItem('discordUserId') || '';
    };

    setGuildId(getStoredGuild());

    const initialUser = getStoredUser();
    if (initialUser) {
      setUserId(initialUser);
    } else {
      fetch('/api/auth/user', { credentials: 'include' })
        .then((res) => res.json())
        .then((data) => {
          if (data && data.id) {
            setUserId(data.id);
            if (typeof window !== 'undefined') {
              localStorage.setItem('discordUserId', data.id);
            }
          }
        })
        .catch(() => {});
    }

    fetch('/api/admin/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.siteName) setSiteName(data.siteName);
      })
      .catch(() => {});

    const handleGuildChange = (e: Event) => {
      const customEvt = e as CustomEvent;
      const newGuild = customEvt.detail?.guildId || getStoredGuild();
      const newUser = getStoredUser();
      if (newGuild) setGuildId(newGuild);
      if (newUser) setUserId(newUser);
    };

    window.addEventListener('aurora_guild_changed', handleGuildChange);
    window.addEventListener('storage', handleGuildChange);

    return () => {
      window.removeEventListener('aurora_guild_changed', handleGuildChange);
      window.removeEventListener('storage', handleGuildChange);
    };
  }, []);

  const player = useMusicPlayer(guildId, userId);
  const smoothTime = useSmoothTime((player.position || 0) / 1000, player.isPlaying);

  if (!guildId) return null;

  return (
    <MiniPlayerWindow
      currentTrack={player.currentTrack}
      isPlaying={player.isPlaying}
      position={smoothTime}
      volume={player.volume}
      lyrics={player.lyrics}
      siteName={siteName}
      handlePlay={player.handlePlay}
      handlePause={player.handlePause}
      handleSkip={player.handleSkip}
      handlePrevious={player.handlePrevious}
      handleSeek={player.handleSeek}
      handleVolumeChange={player.handleVolumeChange}
    />
  );
}
