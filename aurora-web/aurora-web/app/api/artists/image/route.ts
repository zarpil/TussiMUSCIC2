import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Server-side in-memory cache to store resolved artist images
const artistImageCache = new Map<string, string>();

const ARTIST_ALIASES: Record<string, string> = {
  'txt': 'TOMORROW X TOGETHER',
  'g.v. prakash': 'G.V. Prakash Kumar',
  'gv prakash': 'G.V. Prakash Kumar'
};

function isInvalidDeezerImage(pic: string): boolean {
  if (!pic) return true;
  if (pic.includes('d41d8cd98f00b204e9800998ecf8427e')) return true;
  if (pic.includes('/artist//')) return true;
  return false;
}

async function resolveSingleArtistImage(name: string): Promise<string> {
  const queryName = ARTIST_ALIASES[name.toLowerCase().trim()] || name;
  const key = name.toLowerCase().trim();

  if (artistImageCache.has(key)) {
    const cached = artistImageCache.get(key)!;
    if (cached && !cached.includes('ui-avatars.com') && !cached.includes('placeholder.com')) {
      return cached;
    }
  }

  // 1. Deezer Artist Search (Artist portrait photos)
  try {
    const res = await fetch(`https://api.deezer.com/search/artist?q=${encodeURIComponent(queryName)}&limit=5`, {
      cache: 'no-store',
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(5000)
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.data) && data.data.length > 0) {
        const valid = data.data.filter((a: any) => {
          const pic = a.picture_xl || a.picture_big || a.picture_medium || a.picture || '';
          return !isInvalidDeezerImage(pic);
        });
        if (valid.length > 0) {
          const exact = valid.filter((a: any) => a.name.toLowerCase() === key || a.name.toLowerCase() === queryName.toLowerCase());
          const candidateList = exact.length > 0 ? exact : valid;
          candidateList.sort((a: any, b: any) => (b.nb_fan || 0) - (a.nb_fan || 0));
          const best = candidateList[0];
          const pic = best.picture_big || best.picture_xl || best.picture_medium || best.picture;
          if (pic && !isInvalidDeezerImage(pic)) {
            artistImageCache.set(key, pic);
            return pic;
          }
        }
      }
    }
  } catch (e) {}

  // 2. Deezer Track Search (Album artwork)
  try {
    const deezerRes = await fetch(`https://api.deezer.com/search?q=${encodeURIComponent(queryName)}&limit=1`, {
      cache: 'no-store',
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(5000)
    });
    if (deezerRes.ok) {
      const d = await deezerRes.json();
      const item = d.data?.[0];
      if (item && item.album && (item.album.cover_big || item.album.cover_medium)) {
        const pic = item.album.cover_big || item.album.cover_medium;
        artistImageCache.set(key, pic);
        return pic;
      }
    }
  } catch (e) {}

  // 3. iTunes API Search (100% High-res artwork fallback on server-side)
  try {
    const itunesRes = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(queryName)}&entity=song&limit=1`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(5000)
    });
    if (itunesRes.ok) {
      const d = await itunesRes.json();
      if (d.results?.[0]?.artworkUrl100) {
        const pic = d.results[0].artworkUrl100.replace('100x100bb', '600x600bb');
        artistImageCache.set(key, pic);
        return pic;
      }
    }
  } catch (e) {}

  const fallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&size=200`;
  return fallback;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const namesParam = searchParams.get('names');
  const nameParam = searchParams.get('name');

  if (namesParam) {
    const names = namesParam.split(',').map(s => s.trim()).filter(Boolean);
    const images: Record<string, string> = {};

    const chunkSize = 4;
    for (let i = 0; i < names.length; i += chunkSize) {
      const chunk = names.slice(i, i + chunkSize);
      await Promise.all(chunk.map(async (n) => {
        images[n] = await resolveSingleArtistImage(n);
      }));
      if (i + chunkSize < names.length) {
        await new Promise(r => setTimeout(r, 40));
      }
    }

    return NextResponse.json({ images });
  }

  if (!nameParam) {
    return NextResponse.json({ error: 'Name or names parameter required' }, { status: 400 });
  }

  const image = await resolveSingleArtistImage(nameParam);
  return NextResponse.json({ image });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const names: string[] = Array.isArray(body.names) ? body.names : [];
    if (names.length === 0) {
      return NextResponse.json({ error: 'Names array required' }, { status: 400 });
    }

    const images: Record<string, string> = {};
    const chunkSize = 4;
    for (let i = 0; i < names.length; i += chunkSize) {
      const chunk = names.slice(i, i + chunkSize);
      await Promise.all(chunk.map(async (n) => {
        images[n] = await resolveSingleArtistImage(n);
      }));
      if (i + chunkSize < names.length) {
        await new Promise(r => setTimeout(r, 40));
      }
    }

    return NextResponse.json({ images });
  } catch (e) {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 500 });
  }
}


