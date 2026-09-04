import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const getCandidateUrls = () => {
  const urls = [
    process.env.INTERNAL_API_URL,
    'http://bot:3001',
    'http://tussi-bot:3001',
    'http://aurora-backend:3001',
    'http://backend:3001',
    'http://host.docker.internal:3001',
    process.env.NEXT_PUBLIC_SOCKET_URL,
    'http://localhost:3001',
    'http://127.0.0.1:3001'
  ].filter(Boolean) as string[];
  // Deduplicate candidate URLs
  return Array.from(new Set(urls));
};

export async function GET(
  request: Request,
  { params }: { params: { guildId: string } }
) {
  try {
    const { guildId } = params;
    const candidates = getCandidateUrls();

    for (const baseUrl of candidates) {
      try {
        const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
        const targetUrl = `${cleanBase}/api/guilds/${guildId}/overview`;
        
        const res = await fetch(targetUrl, {
          cache: 'no-store',
          signal: AbortSignal.timeout(4000)
        });

        if (res && res.ok) {
          const data = await res.json();
          if (data && data.success) {
            return NextResponse.json(data);
          }
        }
      } catch (e) {
        // Try next candidate URL
      }
    }

    // Default response if backend service cannot be reached
    return NextResponse.json({
      success: true,
      guild: {
        id: guildId,
        name: 'Aurora Audio Server',
        icon: 'https://cdn.discordapp.com/embed/avatars/0.png',
        memberCount: 0
      },
      stats: {
        totalVcMs: 0,
        totalVcHours: 0,
        userActivity: [],
        topSongs: [],
        history: []
      },
      twentyFourSeven: {
        enabled: false,
        voiceChannelId: null,
        voiceChannelName: null,
        isConnected: false
      }
    });

  } catch (error: any) {
    console.error('[API Proxy Overview] Error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
