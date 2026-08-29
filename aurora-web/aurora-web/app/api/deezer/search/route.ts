import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') || searchParams.get('term') || searchParams.get('query') || '';
    const limit = searchParams.get('limit') || '20';
    const type = searchParams.get('type') || searchParams.get('entity') || 'track';

    if (!q.trim()) {
      return NextResponse.json({ data: [] });
    }

    let deezerEndpoint = `https://api.deezer.com/search?q=${encodeURIComponent(q.trim())}&limit=${limit}`;
    if (type === 'album') {
      deezerEndpoint = `https://api.deezer.com/search/album?q=${encodeURIComponent(q.trim())}&limit=${limit}`;
    } else if (type === 'artist') {
      deezerEndpoint = `https://api.deezer.com/search/artist?q=${encodeURIComponent(q.trim())}&limit=${limit}`;
    }

    const res = await fetch(deezerEndpoint, {
      cache: 'no-store',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
        'Accept': 'application/json'
      },
      signal: AbortSignal.timeout(6000)
    });

    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        }
      });
    }

    return NextResponse.json({ data: [], error: 'Deezer API returned non-200' }, { status: res.status });
  } catch (error: any) {
    console.error('[API Proxy Deezer Search] Error:', error);
    return NextResponse.json({ data: [], error: error.message }, { status: 500 });
  }
}
