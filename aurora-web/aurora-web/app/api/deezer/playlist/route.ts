import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get('title') || searchParams.get('query') || '';
  const artist = searchParams.get('artist') || '';
  const playlistId = searchParams.get('id');

  try {
    let tracks: any[] = [];
    let playlistInfo = {
      id: playlistId || title,
      title: title || 'Featured Playlist',
      picture: `https://ui-avatars.com/api/?name=${encodeURIComponent(title || 'Playlist')}&background=random&size=300`,
      creator: artist ? `${artist} Editor` : 'Deezer Charts',
      tracksCount: 0,
      fans: 125000
    };

    // First try fetching Deezer playlist endpoint directly if playlistId is numeric
    if (playlistId && /^\d+$/.test(playlistId)) {
      try {
        const deezerPlRes = await fetch(`https://api.deezer.com/playlist/${playlistId}`, {
          cache: 'no-store',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
            'Accept': 'application/json'
          },
          signal: AbortSignal.timeout(4000)
        });
        if (deezerPlRes.ok) {
          const deezerPlData = await deezerPlRes.json();
          if (deezerPlData && deezerPlData.tracks?.data?.length > 0) {
            playlistInfo.title = deezerPlData.title || playlistInfo.title;
            playlistInfo.picture = deezerPlData.picture_big || deezerPlData.picture_medium || playlistInfo.picture;
            playlistInfo.creator = deezerPlData.user?.name || playlistInfo.creator;
            playlistInfo.fans = deezerPlData.fans || playlistInfo.fans;

            tracks = deezerPlData.tracks.data.map((item: any) => ({
              id: item.id,
              title: item.title,
              author: item.artist?.name || artist,
              albumTitle: item.album?.title || 'Single',
              duration: item.duration,
              artwork: item.album?.cover_big || item.album?.cover_medium || playlistInfo.picture,
              url: `${item.title} ${item.artist?.name || artist}`
            }));
            playlistInfo.tracksCount = tracks.length;
            return NextResponse.json({ playlist: playlistInfo, tracks });
          }
        }
      } catch (e) {
        console.warn('Deezer playlist direct fetch error:', e);
      }
    }

    // High-reliability Deezer fallback search for playlist songs
    const searchTerm = `${title} ${artist}`.trim();
    if (searchTerm) {
      const deezerRes = await fetch(`https://api.deezer.com/search?q=${encodeURIComponent(searchTerm)}&limit=30`, {
        cache: 'no-store',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
          'Accept': 'application/json'
        },
        signal: AbortSignal.timeout(4000)
      });
      if (deezerRes.ok) {
        const data = await deezerRes.json();
        if (Array.isArray(data.data) && data.data.length > 0) {
          tracks = data.data.map((item: any, idx: number) => ({
            id: item.id || idx,
            title: item.title,
            author: item.artist?.name || artist,
            albumTitle: item.album?.title || 'Album',
            duration: item.duration || 210,
            artwork: item.album?.cover_big || item.album?.cover_medium || playlistInfo.picture,
            url: item.link || `${item.title} ${item.artist?.name || artist}`
          }));
          if (tracks[0]?.artwork) {
            playlistInfo.picture = tracks[0].artwork;
          }
          playlistInfo.tracksCount = tracks.length;
        }
      }
    }

    return NextResponse.json({
      playlist: playlistInfo,
      tracks
    });
  } catch (err: any) {
    console.error('[Playlist API Error]:', err);
    return NextResponse.json({ error: 'Failed to fetch playlist tracks' }, { status: 500 });
  }
}
