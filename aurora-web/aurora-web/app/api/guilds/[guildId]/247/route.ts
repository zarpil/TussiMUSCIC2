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
  return Array.from(new Set(urls));
};

export async function POST(
  request: Request,
  { params }: { params: { guildId: string } }
) {
  try {
    const { guildId } = params;
    const body = await request.json().catch(() => ({}));
    const userId = request.headers.get('x-user-id') || '';
    const candidates = getCandidateUrls();

    const fetchOptions: RequestInit = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': userId
      },
      body: JSON.stringify(body),
      cache: 'no-store',
      signal: AbortSignal.timeout(6000)
    };

    for (const baseUrl of candidates) {
      try {
        const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
        const targetUrl = `${cleanBase}/api/guilds/${guildId}/247`;
        const res = await fetch(targetUrl, fetchOptions);

        if (res && res.status < 500) {
          const data = await res.json().catch(() => null);
          if (data) {
            return NextResponse.json(data, { status: res.status });
          }
        }
      } catch (e) {
        // Try next candidate URL
      }
    }

    return NextResponse.json({
      success: false,
      error: 'Backend bot server is currently unreachable. Make sure aurora-bot is running.'
    }, { status: 503 });

  } catch (error: any) {
    console.error('[API Proxy 24/7] Error:', error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
