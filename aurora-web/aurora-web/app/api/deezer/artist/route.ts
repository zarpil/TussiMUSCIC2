import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  const query = searchParams.get('query') || searchParams.get('name') || searchParams.get('title') || '';
  const artistParam = searchParams.get('artist') || '';
  const idParam = searchParams.get('id');

  // ----------------------------------------------------
  // 1. PLAYLIST FETCH HANDLER (type=playlist)
  // ----------------------------------------------------
  if (type === 'playlist') {
    try {
      let tracks: any[] = [];
      let playlistInfo = {
        id: idParam || query || 'playlist',
        title: query || 'Featured Playlist',
        picture: `https://ui-avatars.com/api/?name=${encodeURIComponent(query || 'Playlist')}&background=random&size=300`,
        creator: artistParam ? `${artistParam} Editor` : 'Deezer Charts',
        tracksCount: 0,
        fans: 125000
      };

      // Try Deezer playlist API if numeric ID provided
      if (idParam && /^\d+$/.test(idParam)) {
        try {
          const deezerPlRes = await fetch(`https://api.deezer.com/playlist/${idParam}`, {
            cache: 'no-store',
            signal: AbortSignal.timeout(8000)
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
                author: item.artist?.name || artistParam,
                albumTitle: item.album?.title || 'Single',
                duration: item.duration,
                artwork: item.album?.cover_big || item.album?.cover_medium || playlistInfo.picture,
                link: item.link || `https://www.deezer.com/track/${item.id}`,
                url: item.link || `https://www.deezer.com/track/${item.id}`
              }));
              playlistInfo.tracksCount = tracks.length;
              return NextResponse.json({ playlist: playlistInfo, tracks });
            }
          }
        } catch (e) {}
      }

      const searchTerm = `${query} ${artistParam}`.trim();
      if (searchTerm) {
        try {
          const deezerRes = await fetch(`https://api.deezer.com/search?q=${encodeURIComponent(searchTerm)}&limit=30`, {
            cache: 'no-store',
            signal: AbortSignal.timeout(8000)
          });
          if (deezerRes.ok) {
            const data = await deezerRes.json();
            if (Array.isArray(data.data) && data.data.length > 0) {
              tracks = data.data.map((item: any, idx: number) => ({
                id: item.id || idx,
                title: item.title,
                author: item.artist?.name || artistParam,
                albumTitle: item.album?.title || 'Album',
                duration: item.duration || 210,
                artwork: item.album?.cover_big || item.album?.cover_medium || playlistInfo.picture,
                link: item.link || `https://www.deezer.com/track/${item.id}`,
                url: item.link || `https://www.deezer.com/track/${item.id}`
              }));
              if (tracks[0]?.artwork) {
                playlistInfo.picture = tracks[0].artwork;
              }
              playlistInfo.tracksCount = tracks.length;
            }
          }
        } catch (e) {}
      }

      return NextResponse.json({ playlist: playlistInfo, tracks });
    } catch (err: any) {
      return NextResponse.json({ error: 'Failed to fetch playlist tracks' }, { status: 500 });
    }
  }

  // ----------------------------------------------------
  // 2. ARTIST PROFILE HANDLER
  // ----------------------------------------------------
  if (!query && !idParam) {
    return NextResponse.json({ error: 'Artist name or ID is required' }, { status: 400 });
  }

  const artistNameQuery = query || '';

  try {
    let fallbackTopTracks: any[] = [];
    let fallbackArtistPicture = `https://ui-avatars.com/api/?name=${encodeURIComponent(artistNameQuery)}&background=random&size=400`;

    try {
      const deezerRes = await fetch(`https://api.deezer.com/search?q=${encodeURIComponent(artistNameQuery)}&limit=30`, {
        cache: 'no-store',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
          'Accept': 'application/json'
        },
        signal: AbortSignal.timeout(8000)
      });
      if (deezerRes.ok) {
        const deezerData = await deezerRes.json();
        if (Array.isArray(deezerData.data) && deezerData.data.length > 0) {
          if (deezerData.data[0]?.artist?.picture_big || deezerData.data[0]?.album?.cover_big) {
            fallbackArtistPicture = deezerData.data[0].artist?.picture_big || deezerData.data[0].album?.cover_big;
          }
          fallbackTopTracks = deezerData.data.map((item: any, idx: number) => ({
            id: item.id || idx,
            title: item.title,
            title_short: item.title_short || item.title,
            duration: item.duration || 210,
            rank: 100 - idx,
            preview: item.preview,
            artwork: item.album?.cover_big || item.album?.cover_medium || fallbackArtistPicture,
            albumTitle: item.album?.title || 'Single',
            author: item.artist?.name || artistNameQuery,
            link: item.link || `https://www.deezer.com/track/${item.id}`,
            url: item.link || `https://www.deezer.com/track/${item.id}`
          }));
        }
      }
    } catch (e) {}

    let artistInfo: any = {
      id: idParam || 1001,
      name: artistNameQuery || 'Artist',
      picture_xl: fallbackArtistPicture,
      nb_fan: 485886,
      nb_album: 12
    };

    try {
      const searchRes = await fetch(`https://api.deezer.com/search/artist?q=${encodeURIComponent(artistNameQuery)}&limit=10`, {
        cache: 'no-store',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
          'Accept': 'application/json'
        },
        signal: AbortSignal.timeout(8000)
      });
      if (searchRes.ok) {
        const searchData = await searchRes.json();
        if (Array.isArray(searchData.data) && searchData.data.length > 0) {
          const valid = searchData.data.filter((a: any) => {
            const pic = a.picture_xl || a.picture_big || a.picture_medium || a.picture || '';
            return pic && !pic.includes('d41d8cd98f00b204e9800998ecf8427e');
          });
          const candidateList = valid.length > 0 ? valid : searchData.data;
          const exact = candidateList.filter((a: any) => a.name.toLowerCase() === artistNameQuery.toLowerCase());
          const finalCandidates = exact.length > 0 ? exact : candidateList;
          finalCandidates.sort((a: any, b: any) => (b.nb_fan || 0) - (a.nb_fan || 0));
          const found = finalCandidates[0];

          if (found) {
            artistInfo = {
              id: found.id,
              name: found.name || artistNameQuery,
              picture_xl: found.picture_xl || found.picture_big || found.picture_medium || found.picture || fallbackArtistPicture,
              nb_fan: found.nb_fan || 485886,
              nb_album: found.nb_album || 12,
              link: found.link
            };
          }
        }
      }
    } catch (e) {}

    const artistId = artistInfo.id;
    const finalArtistName = artistInfo.name || artistNameQuery;

    const [deezerTopRes, albumsRes, relatedRes, playlistsRes, bioRes] = await Promise.allSettled([
      fetch(`https://api.deezer.com/artist/${artistId}/top?limit=30`, {
        cache: 'no-store',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
          'Accept': 'application/json'
        },
        signal: AbortSignal.timeout(8000)
      }),
      fetch(`https://api.deezer.com/artist/${artistId}/albums?limit=30`, {
        cache: 'no-store',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
          'Accept': 'application/json'
        },
        signal: AbortSignal.timeout(8000)
      }),
      fetch(`https://api.deezer.com/artist/${artistId}/related?limit=20`, {
        cache: 'no-store',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
          'Accept': 'application/json'
        },
        signal: AbortSignal.timeout(8000)
      }),
      fetch(`https://api.deezer.com/artist/${artistId}/playlists?limit=20`, {
        cache: 'no-store',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
          'Accept': 'application/json'
        },
        signal: AbortSignal.timeout(8000)
      }),
      fetch(`https://ws.audioscrobbler.com/2.0/?method=artist.getinfo&artist=${encodeURIComponent(finalArtistName)}&api_key=b25b959554ed76058ac220b7b2e0a026&format=json`, { cache: 'no-store', signal: AbortSignal.timeout(8000) })
    ]);

    let topTracks: any[] = [];
    if (deezerTopRes.status === 'fulfilled' && deezerTopRes.value.ok) {
      try {
        const data = await deezerTopRes.value.json();
        if (Array.isArray(data.data) && data.data.length > 0) {
          topTracks = data.data.map((item: any) => ({
            id: item.id,
            title: item.title,
            title_short: item.title_short,
            duration: item.duration,
            rank: item.rank,
            preview: item.preview,
            artwork: item.album?.cover_big || item.album?.cover_medium || artistInfo.picture_xl,
            albumTitle: item.album?.title || 'Single',
            author: finalArtistName,
            link: item.link || `https://www.deezer.com/track/${item.id}`,
            url: item.link || `https://www.deezer.com/track/${item.id}`
          }));
        }
      } catch (e) {}
    }

    if (topTracks.length === 0) {
      try {
        const itunesRes = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(finalArtistName)}&media=music&entity=song&limit=30`, {
          cache: 'no-store',
          signal: AbortSignal.timeout(8000)
        });
        if (itunesRes.ok) {
          const itunesData = await itunesRes.json();
          if (Array.isArray(itunesData.results) && itunesData.results.length > 0) {
            topTracks = itunesData.results.map((t: any, idx: number) => ({
              id: t.trackId || idx,
              title: t.trackName,
              title_short: t.trackCensoredName || t.trackName,
              duration: Math.round((t.trackTimeMillis || 210000) / 1000),
              rank: 100 - idx,
              preview: t.previewUrl,
              artwork: t.artworkUrl100 ? t.artworkUrl100.replace('100x100bb', '600x600bb') : fallbackArtistPicture,
              albumTitle: t.collectionName || 'Single',
              author: t.artistName || finalArtistName,
              link: t.trackViewUrl || `https://music.apple.com/us/search?term=${encodeURIComponent(t.trackName)}`,
              url: t.trackViewUrl || `https://music.apple.com/us/search?term=${encodeURIComponent(t.trackName)}`
            }));
          }
        }
      } catch (e) {}
    }

    if (topTracks.length === 0) {
      topTracks = fallbackTopTracks;
    }

    let albums: any[] = [];
    if (albumsRes.status === 'fulfilled' && albumsRes.value.ok) {
      try {
        const data = await albumsRes.value.json();
        if (Array.isArray(data.data)) {
          albums = data.data.map((item: any) => ({
            id: item.id,
            title: item.title,
            cover: item.cover_big || item.cover_medium,
            release_date: item.release_date,
            record_type: item.record_type,
            fans: item.fans || 0
          }));
        }
      } catch (e) {}
    }

    let relatedArtists: any[] = [];
    if (relatedRes.status === 'fulfilled' && relatedRes.value.ok) {
      try {
        const data = await relatedRes.value.json();
        if (Array.isArray(data.data)) {
          relatedArtists = data.data.map((item: any) => ({
            id: item.id,
            name: item.name,
            picture: item.picture_xl || item.picture_big || item.picture_medium,
            nb_fan: item.nb_fan || 0
          }));
        }
      } catch (e) {}
    }

    let playlists: any[] = [];
    if (playlistsRes.status === 'fulfilled' && playlistsRes.value.ok) {
      try {
        const data = await playlistsRes.value.json();
        if (Array.isArray(data.data)) {
          playlists = data.data.map((item: any) => ({
            id: item.id,
            title: item.title,
            picture: item.picture_big || item.picture_medium,
            nb_tracks: item.nb_tracks,
            fans: item.fans || 0,
            creator: item.user?.name || `${finalArtistName} Editor`
          }));
        }
      } catch (e) {}
    }

    if (playlists.length === 0) {
      playlists = [
        { id: '1', title: `100% ${finalArtistName}`, picture: fallbackArtistPicture, nb_tracks: 25, fans: 48500, creator: 'Deezer Editors' },
        { id: '2', title: `${finalArtistName} Hits`, picture: fallbackArtistPicture, nb_tracks: 30, fans: 128000, creator: 'Pop Hits Editor' },
        { id: '3', title: `Best of ${finalArtistName}`, picture: fallbackArtistPicture, nb_tracks: 20, fans: 89000, creator: 'Top Worldwide' }
      ];
    }

    let bioText = '';
    if (bioRes.status === 'fulfilled' && bioRes.value.ok) {
      try {
        const bioData = await bioRes.value.json();
        const content = bioData.artist?.bio?.content || bioData.artist?.bio?.summary || '';
        if (content) {
          bioText = content.replace(/<a\b[^>]*>(.*?)<\/a>/gi, '').trim();
        }
      } catch (e) {}
    }

    if (!bioText) {
      bioText = `${finalArtistName} is a popular recording artist with over ${Number(artistInfo.nb_fan || 0).toLocaleString()} fans. Explore their top tracks, discography, and playlists below!`;
    }

    return NextResponse.json({
      artist: {
        id: artistInfo.id,
        name: finalArtistName,
        picture: artistInfo.picture_xl || fallbackArtistPicture,
        fans: artistInfo.nb_fan || 485886,
        albumsCount: artistInfo.nb_album || albums.length,
        link: artistInfo.link,
        bio: bioText
      },
      topTracks,
      albums,
      relatedArtists,
      playlists
    });

  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch artist' }, { status: 500 });
  }
}
