'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { DiscordSDK } from '@discord/embedded-app-sdk';

interface DiscordSDKContextType {
  discordSdk: DiscordSDK | null;
  isReady: boolean;
  error: Error | null;
  isEmbedded: boolean; // True if running inside Discord Activity
  user: any | null; // Authenticated user from Discord SDK
}

const DiscordSDKContext = createContext<DiscordSDKContextType>({
  discordSdk: null,
  isReady: false,
  error: null,
  isEmbedded: false,
  user: null,
});

export function useDiscordSDK() {
  return useContext(DiscordSDKContext);
}

export default function DiscordSDKProvider({ children }: { children: React.ReactNode }) {
  const [discordSdk, setDiscordSdk] = useState<DiscordSDK | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isEmbedded, setIsEmbedded] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Determine if we're in an iframe (likely Discord embedded)
    const inIframe = window.self !== window.top;
    
    if (inIframe) {
      setIsEmbedded(true);
      const clientId = process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID;
      
      if (!clientId) {
        setError(new Error('NEXT_PUBLIC_DISCORD_CLIENT_ID is not set'));
        return;
      }

      const sdk = new DiscordSDK(clientId);
      setDiscordSdk(sdk);

      sdk.ready()
        .then(async () => {
          // Authorize with Discord
          const { code } = await sdk.commands.authorize({
            client_id: clientId,
            response_type: 'code',
            state: '',
            prompt: 'none',
            scope: ['identify', 'guilds'],
          });

          // Exchange code for access token
          const res = await fetch('/api/auth/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code }),
          });
          const { access_token } = await res.json();

          if (!access_token) {
            throw new Error('Failed to get access token');
          }

          // Authenticate with access token
          const auth = await sdk.commands.authenticate({ access_token });
          setUser(auth.user);
          setIsReady(true);
        })
        .catch((err) => {
          console.error("Failed to initialize Discord SDK", err);
          setError(err instanceof Error ? err : new Error(String(err)));
        });
    } else {
      // Not in an iframe, so fallback to web mode
      setIsReady(true);
    }
  }, []);

  return (
    <DiscordSDKContext.Provider value={{ discordSdk, isReady, error, isEmbedded, user }}>
      {children}
    </DiscordSDKContext.Provider>
  );
}
