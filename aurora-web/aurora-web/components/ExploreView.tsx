'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Music, Flame, Star, Coffee, Search, Zap, Headphones, Activity, Radio, Mic, Disc, ChevronLeft, ChevronRight, User, Home, Heart, Compass, Trash2, Cloud, History } from 'lucide-react';
import { motion } from 'framer-motion';
import DeezerArtistView from './DeezerArtistView';

const getCleanArtwork = (url: string | null | undefined) => {
  const fallback = 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&q=80';
  if (!url) return fallback;
  if (
    url.includes('discordapp.com/embed/avatars') || 
    url.includes('placeholder') || 
    url.includes('d41d8cd98f00b204e9800998ecf8427e') ||
    url.includes('2a96cbd8b46e442fc41c2b86b821562f')
  ) {
    return fallback;
  }
  return url;
};

const DiscordAvatar = ({ userId, defaultAvatarUrl, username, className }: { userId?: string, defaultAvatarUrl?: string | null, username: string, className: string }) => {
  const [avatarUrl, setAvatarUrl] = useState<string>(
    defaultAvatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=random`
  );

  useEffect(() => {
    if (!defaultAvatarUrl && userId) {
      const apiUrl = '';
      fetch(`${apiUrl}/api/users/${userId}/avatar`)
        .then(res => res.json())
        .then(data => { if (data.avatar) setAvatarUrl(data.avatar); })
        .catch(() => {});
    }
  }, [userId, defaultAvatarUrl]);

  return <img src={avatarUrl} className={className} alt={username} />;
};

interface ArtistInfo {
  name: string;
  language: 'English' | 'Spanish' | 'K-Pop' | 'Hindi' | 'Tamil';
  artwork?: string;
}

const POPULAR_ARTISTS_BY_LANGUAGE: ArtistInfo[] = [
  // English
  { name: 'Taylor Swift', language: 'English' },
  { name: 'Drake', language: 'English' },
  { name: 'The Weeknd', language: 'English' },
  { name: 'Billie Eilish', language: 'English' },
  { name: 'Eminem', language: 'English' },
  { name: 'Ed Sheeran', language: 'English' },
  { name: 'Coldplay', language: 'English' },
  { name: 'Ariana Grande', language: 'English' },
  { name: 'Post Malone', language: 'English' },
  { name: 'Dua Lipa', language: 'English' },
  { name: 'Bruno Mars', language: 'English' },
  { name: 'Rihanna', language: 'English' },
  { name: 'Kanye West', language: 'English' },
  { name: 'Travis Scott', language: 'English' },
  { name: 'Justin Bieber', language: 'English' },
  { name: 'SZA', language: 'English' },
  { name: 'Olivia Rodrigo', language: 'English' },
  { name: 'Sabrina Carpenter', language: 'English' },
  { name: 'Kendrick Lamar', language: 'English' },
  { name: 'Adele', language: 'English' },
  { name: 'Lady Gaga', language: 'English' },
  { name: 'Nicki Minaj', language: 'English' },
  { name: 'Doja Cat', language: 'English' },
  { name: 'Lana Del Rey', language: 'English' },
  { name: 'Harry Styles', language: 'English' },

  // Spanish
  { name: 'Bad Bunny', language: 'Spanish' },
  { name: 'Shakira', language: 'Spanish' },
  { name: 'J Balvin', language: 'Spanish' },
  { name: 'Karol G', language: 'Spanish' },
  { name: 'Daddy Yankee', language: 'Spanish' },
  { name: 'Rosalía', language: 'Spanish' },
  { name: 'Maluma', language: 'Spanish' },
  { name: 'Peso Pluma', language: 'Spanish' },
  { name: 'Rauw Alejandro', language: 'Spanish' },
  { name: 'Feid', language: 'Spanish' },
  { name: 'Ozuna', language: 'Spanish' },
  { name: 'Bizarrap', language: 'Spanish' },

  // K-Pop
  { name: 'BTS', language: 'K-Pop' },
  { name: 'BLACKPINK', language: 'K-Pop' },
  { name: 'NewJeans', language: 'K-Pop' },
  { name: 'Stray Kids', language: 'K-Pop' },
  { name: 'TWICE', language: 'K-Pop' },
  { name: 'IU', language: 'K-Pop' },
  { name: 'PSY', language: 'K-Pop' },
  { name: 'SEVENTEEN', language: 'K-Pop' },
  { name: 'aespa', language: 'K-Pop' },
  { name: 'TXT', language: 'K-Pop' },
  { name: 'IVE', language: 'K-Pop' },

  // Hindi
  { name: 'Arijit Singh', language: 'Hindi' },
  { name: 'Diljit Dosanjh', language: 'Hindi' },
  { name: 'Pritam', language: 'Hindi' },
  { name: 'Badshah', language: 'Hindi' },
  { name: 'Sidhu Moose Wala', language: 'Hindi' },
  { name: 'Shreya Ghoshal', language: 'Hindi' },
  { name: 'Neha Kakkar', language: 'Hindi' },
  { name: 'Yo Yo Honey Singh', language: 'Hindi' },
  { name: 'Jubin Nautiyal', language: 'Hindi' },
  { name: 'Sonu Nigam', language: 'Hindi' },
  { name: 'KK', language: 'Hindi' },
  { name: 'Atif Aslam', language: 'Hindi' },

  // Tamil
  { name: 'A.R. Rahman', language: 'Tamil' },
  { name: 'Anirudh Ravichander', language: 'Tamil' },
  { name: 'Yuvan Shankar Raja', language: 'Tamil' },
  { name: 'Harris Jayaraj', language: 'Tamil' },
  { name: 'Sid Sriram', language: 'Tamil' },
  { name: 'G.V. Prakash', language: 'Tamil' },
  { name: 'Devi Sri Prasad', language: 'Tamil' },
  { name: 'Ilaiyaraaja', language: 'Tamil' },
  { name: 'Santhosh Narayanan', language: 'Tamil' },
  { name: 'Hiphop Tamizha', language: 'Tamil' },
  { name: 'Sean Roldan', language: 'Tamil' },
  { name: 'Pradeep Kumar', language: 'Tamil' }
];

interface MoodGenreCard {
  id: string;
  name: string;
  query: string;
  color: string;
  icon: any;
}

const MOODS: MoodGenreCard[] = [
  { id: 'chill', name: 'Chill y Relax', query: 'chill relaxing lofi acoustic', color: 'from-blue-600/30 to-indigo-800/30 hover:shadow-blue-500/10 border-blue-500/20', icon: Coffee },
  { id: 'focus', name: 'Concentración y Estudio', query: 'focus study deep work synthwave lofi', color: 'from-emerald-600/30 to-teal-800/30 hover:shadow-emerald-500/10 border-emerald-500/20', icon: Activity },
  { id: 'energy', name: 'Energía al Máximo', query: 'energy workout electronic high energy', color: 'from-amber-500/30 to-orange-700/30 hover:shadow-orange-500/10 border-orange-500/20', icon: Zap },
  { id: 'workout', name: 'Entrenamiento y Gimnasio', query: 'workout running motivation phonk beast mode', color: 'from-rose-600/30 to-red-800/30 hover:shadow-rose-500/10 border-rose-500/20', icon: Flame },
  { id: 'sleep', name: 'Dormir y Ambiente', query: 'sleep ambient rain white noise calm sleep', color: 'from-violet-600/30 to-fuchsia-800/30 hover:shadow-violet-500/10 border-violet-500/20', icon: Headphones },
  { id: 'romance', name: 'Romance y Amor', query: 'love songs romantic acoustic r&b love', color: 'from-pink-500/30 to-rose-700/30 hover:shadow-pink-500/10 border-pink-500/20', icon: Heart },
  { id: 'feel_good', name: 'Buen Rollo y Alegría', query: 'happy feel good upbeat pop summer vibes', color: 'from-cyan-500/30 to-blue-700/30 hover:shadow-cyan-500/10 border-cyan-500/20', icon: Star },
  { id: 'party', name: 'Fiesta y Baile', query: 'party dance club hits edm house music', color: 'from-purple-500/30 to-violet-700/30 hover:shadow-purple-500/10 border-purple-500/20', icon: Disc },
  { id: 'melancholy', name: 'Melancolía y Baladas', query: 'sad songs emotional heartbreak acoustic sad', color: 'from-slate-700/30 to-zinc-900/30 hover:shadow-slate-500/10 border-slate-500/20', icon: Cloud },
  { id: 'retro', name: 'Retro y Nostalgia', query: '80s hits synthwave retro 90s nostalgia', color: 'from-amber-600/30 to-rose-800/30 hover:shadow-amber-500/10 border-amber-500/20', icon: History },
  { id: 'adventure', name: 'Viaje y Carretera', query: 'road trip driving music upbeat rock indie', color: 'from-teal-600/30 to-emerald-800/30 hover:shadow-teal-500/10 border-teal-500/20', icon: Compass },
  { id: 'gaming', name: 'Ritmos Gaming', query: 'gaming lofi phonk speed up gaming music', color: 'from-violet-600/30 to-indigo-800/30 hover:shadow-violet-500/10 border-violet-500/20', icon: Activity }
];

const GENRES: MoodGenreCard[] = [
  { id: 'pop', name: 'Pop', query: 'pop hits billboard pop currents', color: 'from-pink-600/30 to-rose-800/30 hover:shadow-pink-500/10 border-pink-500/20', icon: Mic },
  { id: 'hiphop', name: 'Hip-Hop y Rap', query: 'hip hop rap hit rap caviar trap', color: 'from-emerald-600/30 to-green-800/30 hover:shadow-green-500/10 border-green-500/20', icon: Headphones },
  { id: 'rock', name: 'Rock y Metal', query: 'classic rock hard rock heavy metal rock hits', color: 'from-slate-600/30 to-zinc-800/30 hover:shadow-slate-500/10 border-slate-500/20', icon: Activity },
  { id: 'electronic', name: 'Electrónica y EDM', query: 'edm techno house music electro mint', color: 'from-cyan-600/30 to-blue-800/30 hover:shadow-cyan-500/10 border-cyan-500/20', icon: Zap },
  { id: 'rnb', name: 'R&B y Soul', query: 'r&b soul smooth r&b neo soul', color: 'from-indigo-600/30 to-purple-800/30 hover:shadow-indigo-500/10 border-indigo-500/20', icon: Mic },
  { id: 'lofi', name: 'Lofi y Chillhop', query: 'lofi lofi hiphop chillhop study beats', color: 'from-amber-700/30 to-yellow-900/30 hover:shadow-amber-600/10 border-amber-600/20', icon: Coffee },
  { id: 'kpop', name: 'K-Pop', query: 'kpop bts blackpink newjeans twice', color: 'from-fuchsia-600/30 to-pink-800/30 hover:shadow-fuchsia-500/10 border-fuchsia-500/20', icon: Star },
  { id: 'anime', name: 'Anime y J-Pop', query: 'anime ost anime opening jpop vocaloid', color: 'from-violet-600/30 to-purple-800/30 hover:shadow-violet-500/10 border-violet-500/20', icon: Zap },
  { id: 'latin', name: 'Latino y Reggaeton', query: 'latin hits bad bunny reggaeton salsa', color: 'from-orange-600/30 to-red-800/30 hover:shadow-orange-500/10 border-orange-500/20', icon: Disc },
  { id: 'jazz', name: 'Jazz y Blues', query: 'jazz swing blues smooth jazz classic jazz', color: 'from-yellow-700/30 to-amber-900/30 hover:shadow-yellow-600/10 border-yellow-600/20', icon: Radio },
  { id: 'classical', name: 'Clásica e Instrumental', query: 'classical piano orchestral violin chill study', color: 'from-emerald-700/30 to-teal-900/30 hover:shadow-emerald-600/10 border-emerald-600/20', icon: Music },
  { id: 'metal', name: 'Heavy Metal y Core', query: 'heavy metal slipknot metallica deathcore doom', color: 'from-stone-800/30 to-red-950/30 hover:shadow-red-950/20 border-red-950/30', icon: Flame },
  { id: 'folk', name: 'Folk y Acústico', query: 'indie folk acoustic guitar fingerstyle bon iver', color: 'from-yellow-800/30 to-amber-950/30 hover:shadow-yellow-800/10 border-yellow-800/20', icon: Heart }
];

const CATEGORIES = [
  { id: 'playlists', name: 'Listas de la Comunidad', queries: [''], icon: Disc, color: 'from-fuchsia-500 to-purple-600', isGlobalPlaylists: true },
  { id: 'foryou', name: 'Hecho Para Ti', queries: [''], icon: Star, color: 'from-blue-400 to-indigo-600', isPersonalized: true },
  { id: 'trending_podcasts', name: 'Podcasts en Tendencia', queries: ['the wild project', 'jordi wild podcast', 'lex fridman podcast', 'huberman lab podcast', 'ted radio hour'], icon: Radio, color: 'from-amber-600 to-amber-900' },
  { id: 'top_charts', name: 'Top Listas y Éxitos', queries: ['billboard top 100', 'global hits', 'spotify top 50 global', 'top 50 espana'], icon: Flame, color: 'from-purple-600 to-indigo-800' },
  { id: 'weekly_trends', name: 'Tendencias Semanales', queries: ['trending music hits 2026', 'hot hits tiktok', 'viral hits'], icon: Zap, color: 'from-teal-600 to-cyan-800' },
  { id: 'artists', name: 'Artistas Populares', queries: ['Bad Bunny', 'Rauw Alejandro', 'Quevedo', 'Feid', 'Rosalia', 'Taylor Swift', 'The Weeknd', 'Drake', 'Billie Eilish', 'Kendrick Lamar', 'Ariana Grande', 'Post Malone', 'Dua Lipa', 'Bruno Mars', 'Eminem', 'Coldplay', 'Rihanna', 'Kanye West', 'Travis Scott', 'Justin Bieber', 'Bizarrap'], icon: User, color: 'from-purple-500 to-pink-500', isArtist: true },
  { id: 'tophits', name: 'Éxitos de Hoy', queries: ['pop hits', 'billboard', 'canciones populares'], icon: Flame, color: 'from-orange-500 to-red-500' },
  { id: 'pop', name: 'Pop Actual', queries: ['latest pop', 'dance pop', 'pop rock'], icon: Mic, color: 'from-pink-400 to-rose-600' },
  { id: 'hiphop', name: 'Rap y Trap', queries: ['hip hop', 'rap hit', 'trap latino'], icon: Headphones, color: 'from-green-500 to-emerald-700' },
  { id: 'rnb', name: 'R&B y Soul', queries: ['r&b', 'soul music', 'smooth rnb'], icon: Mic, color: 'from-indigo-600 to-cyan-800' },
  { id: 'rock', name: 'Clásicos del Rock', queries: ['classic rock', 'hard rock', 'indie rock'], icon: Activity, color: 'from-gray-600 to-gray-900' },
  { id: 'workout', name: 'Modo Entrenamiento', queries: ['workout', 'gym motivation', 'pump up'], icon: Zap, color: 'from-red-600 to-black' },
  { id: 'kpop', name: 'Éxitos K-Pop', queries: ['k-pop', 'bts', 'blackpink'], icon: Star, color: 'from-pink-500 to-purple-500' },
  { id: 'electronic', name: 'Electrónica / Dance', queries: ['edm', 'house music', 'techno'], icon: Zap, color: 'from-cyan-400 to-blue-600' },
  { id: 'lofi', name: 'Ritmos Lofi', queries: ['lofi', 'chillhop', 'relaxing beats'], icon: Coffee, color: 'from-amber-700 to-orange-900' },
  { id: 'acoustic', name: 'Pistas Acústicas', queries: ['acoustic covers', 'unplugged', 'chill acoustic'], icon: Headphones, color: 'from-amber-600 to-yellow-800' },
  { id: 'anime', name: 'Anime y J-Pop', queries: ['anime ost', 'anime opening', 'j-pop'], icon: Zap, color: 'from-fuchsia-600 to-pink-700' },
];

const PROMO_QUERIES_1 = ['Bad Bunny', 'The Weeknd', 'Taylor Swift', 'Drake', 'Billie Eilish'];
const PROMO_QUERIES_2 = ['Kendrick Lamar', 'Ariana Grande', 'Post Malone', 'Dua Lipa', 'Bruno Mars'];
const PROMO_QUERIES_3 = ['Eminem', 'Coldplay', 'Imagine Dragons', 'Ed Sheeran', 'Adele'];

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Buenos días';
  if (hour < 18) return 'Buenas tardes';
  return 'Buenas noches';
};

const CarouselBanner = ({ queries, onBannerClick }: { queries: string[], onBannerClick: (q: string) => void }) => {
  const [images, setImages] = useState<{ src: string, query: string }[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const fetchArt = async () => {
      try {
        const results = await Promise.all(
          queries.map(async (q) => {
            let src = '';
            try {
              const imgRes = await fetch(`/api/artists/image?name=${encodeURIComponent(q)}`);
              if (imgRes.ok) {
                const imgData = await imgRes.json();
                if (imgData.image && !imgData.image.includes('ui-avatars.com')) {
                  src = imgData.image;
                }
              }
            } catch (e) {}

            if (!src) {
              try {
                const res = await fetch(`/api/deezer/search?type=album&q=${encodeURIComponent(q)}&limit=1`);
                const data = await res.json();
                src = data.data?.[0]?.cover_big || data.data?.[0]?.cover_xl || data.data?.[0]?.cover_medium || '';
              } catch (e) {}
            }

            if (!src) {
              src = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&q=80';
            }

            return { query: q, src };
          })
        );
        setImages(results.filter(r => r.src));
      } catch (e) {
        console.error(e);
      }
    };
    fetchArt();
  }, [queries]);

  useEffect(() => {
    if (images.length === 0) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [images.length]);

  if (images.length === 0) return null;

  return (
    <div className="w-full h-56 md:h-72 my-10 rounded-xl overflow-hidden relative shadow-2xl group cursor-pointer border border-transparent">
      {images.map((item, idx) => (
        <div 
          key={idx}
          className={`absolute inset-0 transition-opacity duration-1000 ${idx === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-[#121212] via-[#1a1a1a] to-[#282828]" />
          
          <div className="absolute inset-0 flex items-center p-4 sm:p-6 md:p-12 gap-4 sm:gap-6 md:gap-10">
             <img 
               src={item.src} 
               onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&q=80'; }}
               className="w-24 h-24 sm:w-36 sm:h-36 md:w-56 md:h-56 rounded-lg shadow-2xl object-cover shrink-0" 
               alt={item.query} 
             />
             <div className="flex flex-col min-w-0">
                <span className="text-white/60 font-bold uppercase tracking-[0.1em] text-[10px] sm:text-xs md:text-sm mb-1 sm:mb-2 truncate">Featured Artist</span>
                <h2 className="text-white font-black text-2xl sm:text-4xl md:text-6xl drop-shadow-2xl mb-2 sm:mb-6 truncate">{item.query}</h2>
                <button 
                  onClick={(e) => { e.stopPropagation(); onBannerClick(item.query); }}
                  className="bg-[#1ed760] text-black px-6 sm:px-8 py-2 sm:py-3 rounded-full font-bold w-max hover:scale-105 hover:bg-[#1fdf64] transition-all shadow-lg flex items-center gap-2 text-xs sm:text-base"
                >
                  <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-black" /> Play
                </button>
             </div>
          </div>
        </div>
      ))}
      
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
         {images.map((_, idx) => (
             <button 
               key={idx} 
               onClick={(e) => { e.stopPropagation(); setCurrentIndex(idx); }}
               className={`h-2 rounded-full transition-all duration-300 ${idx === currentIndex ? 'bg-white w-8' : 'bg-white/30 w-2 hover:bg-white/50'}`} 
             />
         ))}
      </div>
    </div>
  );
};

const fetchDeezerArtistImage = async (name: string): Promise<string> => {
  try {
    const res = await fetch(`/api/artists/image?name=${encodeURIComponent(name)}`);
    if (res.ok) {
      const data = await res.json();
      if (data.image) return data.image;
    }
  } catch (e) {}

  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&size=200`;
};

function CategoryRow({ category, userId, guildId, playItem, onHoverTrack, onToggleLike, likedSongsList }: { category: any, userId: string, guildId: string, playItem: (item: any, isPlaylist?: boolean) => void, onHoverTrack?: (artworkUrl: string | null) => void, onToggleLike?: (track: any, e?: React.MouseEvent) => void, likedSongsList?: any[] }) {
  const [items, setItems] = useState<any[]>([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const observer = useRef<IntersectionObserver | null>(null);

  const lastElementRef = useCallback((node: any) => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prev => prev + 1);
      }
    }, { rootMargin: '200px', threshold: 0.1 });
    
    if (node) observer.current.observe(node);
  }, [loading, hasMore]);

  const queriesStr = category.queries ? category.queries.join(',') : '';
  const initialFetchDone = useRef(false);

  useEffect(() => {
    setItems([]);
    setPage(0);
    setHasMore(true);
    initialFetchDone.current = false;
  }, [queriesStr]);

  const fetchData = async (pageNum: number, isReset = false) => {
    if (!hasMore && !isReset) return;
    setLoading(true);

    try {
      const apiUrl = '';
      let fetchedItems: any[] = [];

      if (category.isArtist) {
        if (pageNum === 0) {
           const names: string[] = category.queries || [];
           let imageMap: Record<string, string> = {};
           try {
             const res = await fetch('/api/artists/image', {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify({ names })
             });
             if (res.ok) {
               const data = await res.json();
               imageMap = data.images || {};
             }
           } catch (e) {}

           fetchedItems = names.map((q: string) => ({
             title: q,
             author: 'Artist',
             artwork: imageMap[q] || `https://ui-avatars.com/api/?name=${encodeURIComponent(q)}&background=random&size=200`,
             url: q,
             isArtist: true
           }));
        }
        setHasMore(false);
      } else if (category.isGlobalPlaylists) {
        if (pageNum === 0) {
          const res = await fetch(`${apiUrl}/api/playlists/public`);
          const data = await res.json();
          fetchedItems = Array.isArray(data) ? data.map((p: any) => ({
            ...p,
            title: p.name,
            subtitle: p.description || 'Community Playlist',
            artwork: (!p.coverImage || p.coverImage.includes('via.placeholder.com')) && p.tracks?.length > 0 
                  ? p.tracks[0].artwork 
                  : (p.coverImage || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&q=80')
          })) : [];
          setHasMore(false);
        }
      } else {
        let q = '';

        if (category.isPersonalized) {
          let likedData: any[] = [];
          try {
            const likedRes = await fetch(`${apiUrl}/api/liked-songs/${guildId}/${userId}`, { headers: { 'X-User-Id': userId } });
            if (likedRes.ok) {
              likedData = await likedRes.json();
            }
          } catch {
            // silently fall back to generic queries
          }

          if (likedData && likedData.length > 0) {
            const randomSong = likedData[(pageNum + Math.floor(Math.random() * likedData.length)) % likedData.length];
            q = `${randomSong.track.author} hit`;
            if (pageNum > 0) q += ` ${pageNum}`;
          } else {
            const fallbacks = ['pop hits', 'top hits', 'viral 50'];
            q = fallbacks[pageNum % fallbacks.length];
          }
        } else {
          const queryList = category.queries;
          q = queryList[pageNum % queryList.length];
          if (pageNum > 0) {
            const suffixes = ['music', 'song', 'track', 'artist'];
            q += ` ${suffixes[pageNum % suffixes.length]}`;
          }
        }

        let searchSuccess = false;
        try {
          const socketUrl = '';
          const botRes = await fetch(`${socketUrl}/api/search?query=${encodeURIComponent(q)}&limit=15&source=ytm`, {
            headers: { 'X-User-Id': userId }
          });
          if (botRes.ok) {
            const botData = await botRes.json();
            if (botData && botData.tracks && botData.tracks.length > 0) {
              fetchedItems = botData.tracks.map((t: any) => ({
                title: t.title,
                author: t.author,
                artwork: t.artwork || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&q=80',
                url: t.url || t.uri,
                duration: t.duration
              }));
              searchSuccess = true;
            }
          }
        } catch (e) {
          console.warn('[ExploreView] Bot search failed, falling back to Deezer:', e);
        }

        if (!searchSuccess) {
          const response = await fetch(`/api/deezer/search?q=${encodeURIComponent(q)}&limit=25`);
          const data = await response.json();
          
          fetchedItems = data.data?.map((t: any) => ({
            title: t.title,
            author: t.artist?.name,
            artwork: t.album?.cover_big || t.album?.cover_medium,
            url: `${t.title} ${t.artist?.name}`,
            duration: (t.duration || 0) * 1000
          })) || [];
        }
        
        if (fetchedItems.length === 0 && pageNum > 5) setHasMore(false);
      }

      setItems(prev => {
        if (category.isGlobalPlaylists) return fetchedItems;
        const existingIds = new Set(prev.map((t: any) => t.url || t._id));
        const uniqueNew = fetchedItems.filter((t: any) => !existingIds.has(t.url || t._id));
        
        if (uniqueNew.length === 0 && pageNum < 20) {
          setHasMore(false);
        }
        
        return [...prev, ...uniqueNew];
      });
    } catch (e) {
      console.error(e);
      if (pageNum === 0) setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!initialFetchDone.current) {
      fetchData(0, true);
      initialFetchDone.current = true;
    } else {
      fetchData(page);
    }
  }, [page, queriesStr]);

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -600, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 600, behavior: 'smooth' });
    }
  };

  if (items.length === 0 && !loading) return null;

  return (
    <div className="mb-8 w-full relative group/row">
      <div className="flex items-center justify-between mb-4 px-2">
        <div className="flex items-center gap-4">
          <h3 className="text-2xl font-bold text-white hover:underline cursor-pointer">{category.name}</h3>
          {category.isGlobalPlaylists && (
            <button 
              onClick={() => window.dispatchEvent(new CustomEvent('change-view', { detail: 'playlists' }))}
              className="text-xs font-bold text-white/70 hover:text-white mt-1 bg-white/10 hover:bg-white/20 px-4 py-1.5 rounded-full transition-all"
            >
              More
            </button>
          )}
        </div>
        {/* Scroll Buttons */}
        <div className="hidden md:flex items-center gap-2 opacity-0 group-hover/row:opacity-100 transition-opacity">
          <button onClick={scrollLeft} className="w-8 h-8 rounded-full bg-black/40 flex items-center justify-center hover:bg-white/10 hover:scale-105 transition-all text-white">
             <ChevronLeft className="w-5 h-5" />
          </button>
          <button onClick={scrollRight} className="w-8 h-8 rounded-full bg-black/40 flex items-center justify-center hover:bg-white/10 hover:scale-105 transition-all text-white">
             <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div 
        ref={scrollContainerRef}
        className="flex overflow-x-auto gap-4 pb-4 px-2 custom-scrollbar-horizontal scroll-smooth hide-scrollbar"
      >
        {items.map((item, i) => {
          const isLast = i === items.length - 1;
          const isPlaylist = category.isGlobalPlaylists;
          const title = item.title || item.name;
          const subtitle = item.subtitle || item.author;
          const artwork = item.artwork || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&q=80';
          const isLiked = !item.isArtist && !isPlaylist && Array.isArray(likedSongsList) && likedSongsList.some(s => s.track?.identifier === (item.identifier || `${title}-${subtitle}`) || (s.track?.title === title && s.track?.author === subtitle));

          return (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              key={`${item.url || item._id}-${i}`}
              onClick={() => playItem(item, isPlaylist)}
              onMouseEnter={() => onHoverTrack?.(artwork)}
              onMouseLeave={() => onHoverTrack?.(null)}
              className="group min-w-[150px] md:min-w-[180px] max-w-[150px] md:max-w-[180px] bg-[#181818] rounded-md p-3 md:p-4 hover:bg-[#282828] transition-all duration-300 cursor-pointer flex flex-col relative flex-shrink-0"
            >
              <div className={`relative w-full aspect-square ${item.isArtist ? 'rounded-full' : 'rounded-md'} overflow-hidden mb-4 shadow-[0_8px_24px_rgba(0,0,0,0.5)]`}>
                <img
                  src={artwork}
                  alt={title}
                  className="w-full h-full object-cover"
                />
                {!item.isArtist && !isPlaylist && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleLike?.({ title, author: subtitle, artwork, url: item.url, identifier: item.identifier || `${title}-${subtitle}` }, e);
                    }}
                    className="absolute top-2 right-2 p-2 bg-black/70 hover:bg-black/90 rounded-full text-white transition-all opacity-0 group-hover:opacity-100 z-20 shadow-lg cursor-pointer hover:scale-110"
                    title={isLiked ? "Eliminar de favoritas" : "Añadir a favoritas"}
                  >
                    <Heart className={`w-4 h-4 ${isLiked ? 'text-pink-500 fill-pink-500' : 'text-white'}`} />
                  </button>
                )}
                <div className="absolute bottom-2 right-2 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 z-10">
                  <button className="w-10 h-10 md:w-12 md:h-12 bg-[#1ed760] rounded-full flex items-center justify-center shadow-xl hover:scale-105 hover:bg-[#1fdf64]">
                    <Play className="w-5 h-5 md:w-6 md:h-6 text-black ml-1" fill="black" />
                  </button>
                </div>
              </div>
              <h4 className="text-white font-bold text-sm md:text-base truncate w-full">{title}</h4>
              {item.creatorName ? (
                <div className="flex items-center gap-2 mt-1 w-full">
                  <DiscordAvatar
                    userId={item.userId}
                    defaultAvatarUrl={item.creatorAvatar || null}
                    username={item.creatorName}
                    className="w-5 h-5 rounded-full shrink-0"
                  />
                  <p className="text-[#a7a7a7] text-xs md:text-sm truncate font-medium">{item.creatorName}</p>
                </div>
              ) : (
                <p className="text-[#a7a7a7] text-xs md:text-sm line-clamp-2 w-full mt-1 font-medium leading-tight">{subtitle}</p>
              )}
            </motion.div>
          );
        })}
        
        {loading && (
          <div className="min-w-[150px] max-w-[150px] flex items-center justify-center flex-shrink-0">
            <div className="w-8 h-8 border-4 border-transparent border-t-[#1ed760] rounded-full animate-spin" />
          </div>
        )}
      </div>
    </div>
  );
}

export default function ExploreView({ guildId, userId, isPremium }: { guildId: string, userId: string, isPremium?: boolean }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [recentPicks, setRecentPicks] = useState<any[]>([]);

  const [dynamicCategories, setDynamicCategories] = useState<any[]>(CATEGORIES);
  const [categoriesVersion, setCategoriesVersion] = useState(0);

  const [activeSubTab, setActiveSubTab] = useState<'discover' | 'liked' | 'artists' | 'moods_genres'>('discover');
  const [selectedArtistName, setSelectedArtistName] = useState<string | null>(null);
  const [likedSongsList, setLikedSongsList] = useState<any[]>([]);
  const [likedLoading, setLikedLoading] = useState(false);
  const [likedSearchQuery, setLikedSearchQuery] = useState('');
  const [artistsList, setArtistsList] = useState<any[]>([]);
  const [artistsLoading, setArtistsLoading] = useState(false);
  const [artistSearchQuery, setArtistSearchQuery] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState<'All' | 'English' | 'Spanish' | 'K-Pop' | 'Hindi' | 'Tamil'>('All');
  const [hoveredArtwork, setHoveredArtwork] = useState<string | null>(null);
  const [displayedArtwork, setDisplayedArtwork] = useState<string | null>(null);
  const [backdropVisible, setBackdropVisible] = useState(false);
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean>(true);
  const [prefLangs, setPrefLangs] = useState<string[]>([]);
  const [prefGenres, setPrefGenres] = useState<string[]>([]);
  const [siteName, setSiteName] = useState<string>('');

  // Cross-fade backdrop when hovering different songs
  useEffect(() => {
    if (hoveredArtwork) {
      setDisplayedArtwork(hoveredArtwork);
      setBackdropVisible(true);
    } else {
      setBackdropVisible(false);
    }
  }, [hoveredArtwork]);

  useEffect(() => {
    if (userId) {
      const completed = localStorage.getItem(`aurora_onboarding_completed_${userId}`);
      if (completed !== 'true') {
        setOnboardingCompleted(false);
      }
    }
    fetch('/api/admin/settings')
      .then(res => res.json())
      .then(data => {
        if (data && data.siteName) {
          setSiteName(data.siteName);
        }
      })
      .catch(() => {});

    const handleSettingsUpdate = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail && customEvent.detail.siteName) {
        setSiteName(customEvent.detail.siteName);
      }
    };

    window.addEventListener('siteSettingsUpdated', handleSettingsUpdate);
    return () => {
      window.removeEventListener('siteSettingsUpdated', handleSettingsUpdate);
    };
  }, [userId]);

  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleExploreTabChange = (e: CustomEvent) => {
      if (e.detail && ['discover', 'liked', 'artists', 'moods_genres'].includes(e.detail)) {
        setActiveSubTab(e.detail);
        setSelectedArtistName(null);
      }
    };

    const handleFocusSearch = () => {
      if (searchInputRef.current) {
        searchInputRef.current.focus();
        searchInputRef.current.select();
      }
    };

    window.addEventListener('change-explore-tab' as any, handleExploreTabChange);
    window.addEventListener('focus-explore-search' as any, handleFocusSearch);
    return () => {
      window.removeEventListener('change-explore-tab' as any, handleExploreTabChange);
      window.removeEventListener('focus-explore-search' as any, handleFocusSearch);
    };
  }, []);

  const fetchAllLikedSongs = useCallback(async () => {
    if (!guildId || !userId) return;
    setLikedLoading(true);
    try {
      const apiUrl = '';
      const res = await fetch(`${apiUrl}/api/liked-songs/${guildId}/${userId}`);
      if (res.ok) {
        const data = await res.json();
        setLikedSongsList(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error('[ExploreView] fetchLikedSongs error:', e);
    } finally {
      setLikedLoading(false);
    }
  }, [guildId, userId]);

  const handleUnlikeSong = async (identifier: string, title: string) => {
    try {
      const apiUrl = '';
      const response = await fetch(`${apiUrl}/api/liked-songs/${guildId}/${userId}/${encodeURIComponent(identifier)}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        setLikedSongsList(prev => prev.filter(item => item.track.identifier !== identifier));
        window.dispatchEvent(new CustomEvent('show-toast', {
          detail: { message: `💔 Removed ${title} from Liked Songs`, type: 'success' }
        }));
        window.dispatchEvent(new CustomEvent('history-updated'));
      } else {
        const errorData = await response.json();
        window.dispatchEvent(new CustomEvent('show-toast', {
          detail: { message: errorData.error || 'Failed to unlike song', type: 'error' }
        }));
      }
    } catch (e) {
      console.error(e);
      window.dispatchEvent(new CustomEvent('show-toast', {
        detail: { message: 'Network error', type: 'error' }
      }));
    }
  };

  const handleToggleLikeSong = async (track: any, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!guildId || !userId) return;

    const title = track.title || track.name || 'Canción';
    const author = track.author || track.creatorName || 'Desconocido';
    const identifier = track.identifier || `${title}-${author}`;
    const artwork = track.artwork || track.thumbnail || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&q=80';
    const url = track.url || track.link || `https://www.youtube.com/results?search_query=${encodeURIComponent(`${title} ${author}`)}`;

    const isCurrentlyLiked = likedSongsList.some(
      item => item.track?.identifier === identifier || (item.track?.title === title && item.track?.author === author)
    );

    try {
      const apiUrl = '';
      if (isCurrentlyLiked) {
        const res = await fetch(`${apiUrl}/api/liked-songs/${guildId}/${userId}/${encodeURIComponent(identifier)}`, {
          method: 'DELETE'
        });
        if (res.ok) {
          setLikedSongsList(prev => prev.filter(item => item.track?.identifier !== identifier && (item.track?.title !== title || item.track?.author !== author)));
          window.dispatchEvent(new CustomEvent('show-toast', {
            detail: { message: `💔 Eliminada de Canciones Favoritas: ${title}`, type: 'info' }
          }));
          window.dispatchEvent(new CustomEvent('history-updated'));
        }
      } else {
        const res = await fetch(`${apiUrl}/api/liked-songs/${guildId}/${userId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            track: {
              title,
              author,
              duration: track.duration || 0,
              artwork,
              url,
              identifier
            }
          })
        });
        if (res.ok) {
          const newLikedItem = {
            track: { title, author, duration: track.duration || 0, artwork, url, identifier }
          };
          setLikedSongsList(prev => [newLikedItem, ...prev]);
          window.dispatchEvent(new CustomEvent('show-toast', {
            detail: { message: `❤️ Añadida a Canciones Favoritas: ${title}`, type: 'success' }
          }));
          window.dispatchEvent(new CustomEvent('history-updated'));
        }
      }
    } catch (err) {
      console.error('[ExploreView] handleToggleLikeSong error:', err);
    }
  };

  const isSongLiked = (title: string, author?: string, identifier?: string) => {
    if (!likedSongsList || likedSongsList.length === 0) return false;
    return likedSongsList.some(item => {
      if (identifier && item.track?.identifier === identifier) return true;
      if (item.track?.title === title && (!author || item.track?.author === author)) return true;
      return false;
    });
  };

  const playAllLikedSongs = async () => {
    if (likedSongsList.length === 0) return;
    try {
      const apiUrl = '';
      
      const res = await fetch(`${apiUrl}/api/liked-songs/${guildId}/${userId}`);
      let songs = likedSongsList;
      if (res.ok) {
        const data = await res.json();
        songs = Array.isArray(data) ? data : likedSongsList;
        setLikedSongsList(songs);
      }

      if (songs.length === 0) return;

      for (let i = 0; i < songs.length; i++) {
        const query = songs[i].track.url || `${songs[i].track.title} ${songs[i].track.author}`;
        const response = await fetch(`${apiUrl}/api/play`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-User-Id': userId
          },
          body: JSON.stringify({
            guildId,
            userId,
            query,
            isBatch: true,
            batchTotal: songs.length,
            batchIndex: i
          })
        });

        if (i === 0) {
          const data = await response.json();
          if (response.status === 403 && data.requiresWebLink) {
            window.dispatchEvent(new CustomEvent('show-toast', {
              detail: {
                message: '⚠️ ¡Por favor, ejecuta el comando /setup en Discord primero para crear el panel de música!',
                type: 'error'
              }
            }));
            return;
          }
        }
      }

      window.dispatchEvent(new CustomEvent('show-toast', {
        detail: { message: `✅ Added ${songs.length} songs to queue!`, type: 'success' }
      }));
    } catch (error) {
      console.error('Error playing all liked songs:', error);
      window.dispatchEvent(new CustomEvent('show-toast', {
        detail: { message: 'Failed to play all liked songs', type: 'error' }
      }));
    }
  };

  const fetchArtistsData = useCallback(async () => {
    const hasFallbackAvatars = artistsList.some(a => !a.artwork || a.artwork.includes('ui-avatars.com'));
    if (artistsList.length > 0 && !hasFallbackAvatars) return;
    setArtistsLoading(true);
    try {
      const allNames = POPULAR_ARTISTS_BY_LANGUAGE.map(a => a.name);
      let imageMap: Record<string, string> = {};
      try {
        const res = await fetch('/api/artists/image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ names: allNames })
        });
        if (res.ok) {
          const data = await res.json();
          imageMap = data.images || {};
        }
      } catch (e) {
        console.warn('Batch artist image fetch warning:', e);
      }

      const results = POPULAR_ARTISTS_BY_LANGUAGE.map((art) => {
        const artwork = imageMap[art.name] || `https://ui-avatars.com/api/?name=${encodeURIComponent(art.name)}&background=random&size=200`;
        return {
          title: art.name,
          author: 'Artist',
          artwork,
          url: art.name,
          isArtist: true,
          language: art.language
        };
      });
      setArtistsList(results);
    } catch (err) {
      console.error(err);
    } finally {
      setArtistsLoading(false);
    }
  }, [artistsList.length]);

  useEffect(() => {
    fetchAllLikedSongs();
    window.addEventListener('history-updated', fetchAllLikedSongs);
    return () => {
      window.removeEventListener('history-updated', fetchAllLikedSongs);
    };
  }, [fetchAllLikedSongs]);

  useEffect(() => {
    if (activeSubTab === 'artists') {
      fetchArtistsData();
    }
  }, [activeSubTab, fetchArtistsData]);

  useEffect(() => {
    const fetchRecentPicks = async () => {
      try {
        const apiUrl = '';

        // Correct API path: /api/liked-songs/:guildId/:userId
        let recent: any[] = [];
        if (guildId && userId) {
          try {
            const res = await fetch(`${apiUrl}/api/liked-songs/${guildId}/${userId}`);
            const data = await res.json();
            if (Array.isArray(data) && data.length > 0) {
              recent = data.slice(0, 20);
              setRecentPicks(recent.slice(0, 8));
            }
          } catch (e) {}
        }

        let localHistory: any[] = [];
        try {
           localHistory = JSON.parse(localStorage.getItem(`aurora_history_${userId}`) || '[]');
        } catch (e) {}
        
        const combinedHistory = [...recent, ...localHistory];

        let savedLangs: string[] = [];
        let savedGenres: string[] = [];
        try {
          savedLangs = JSON.parse(localStorage.getItem(`aurora_pref_langs_${userId}`) || '[]');
          savedGenres = JSON.parse(localStorage.getItem(`aurora_pref_genres_${userId}`) || '[]');
        } catch (e) {}

        let finalCats = [...CATEGORIES];
        
        // Re-order based on genre preferences
        if (savedGenres.length > 0) {
          const matchingCats: any[] = [];
          const otherCats: any[] = [];
          
          finalCats.forEach((c) => {
            if (c.id === 'playlists' || c.id === 'foryou') {
              matchingCats.push(c);
              return;
            }
            
            const matches = savedGenres.some(g => {
              const genreId = g.toLowerCase().replace(/[^a-z0-9]/g, '');
              const categoryId = c.id.toLowerCase();
              return categoryId.includes(genreId) || genreId.includes(categoryId);
            });
            
            if (matches) {
              matchingCats.push(c);
            } else {
              otherCats.push(c);
            }
          });
          
          finalCats = [...matchingCats, ...otherCats];
        }

        // Inject preferred language categories
        const preferenceCategories: any[] = [];
        savedLangs.forEach((lang) => {
          if (lang === 'Tamil') {
            preferenceCategories.push({
              id: 'tamil_hits_pref',
              name: 'Tamil Hits For You',
              queries: ['latest tamil songs', 'tamil hits 2026', 'kollywood popular'],
              icon: Music,
              color: 'from-orange-500 to-amber-700'
            });
          } else if (lang === 'Hindi') {
            preferenceCategories.push({
              id: 'hindi_hits_pref',
              name: 'Hindi Hits For You',
              queries: ['latest hindi songs', 'bollywood popular', 'arijit singh hits'],
              icon: Music,
              color: 'from-red-500 to-rose-700'
            });
          } else if (lang === 'Telugu') {
            preferenceCategories.push({
              id: 'telugu_hits_pref',
              name: 'Telugu Hits For You',
              queries: ['latest telugu songs', 'tollywood hits', 'telugu popular'],
              icon: Music,
              color: 'from-emerald-500 to-teal-700'
            });
          } else if (lang === 'Punjabi') {
            preferenceCategories.push({
              id: 'punjabi_beats_pref',
              name: 'Punjabi Beats For You',
              queries: ['punjabi songs hits', 'latest punjabi music', 'punjabi pop'],
              icon: Music,
              color: 'from-blue-500 to-indigo-700'
            });
          } else if (lang === 'Spanish') {
            preferenceCategories.push({
              id: 'spanish_hits_pref',
              name: 'Latin & Spanish Hits',
              queries: ['latin hits bad bunny', 'spanish billboard songs', 'reggaeton popular'],
              icon: Music,
              color: 'from-pink-500 to-rose-700'
            });
          } else if (lang === 'K-Pop') {
            preferenceCategories.push({
              id: 'kpop_hits_pref',
              name: 'K-Pop Hits For You',
              queries: ['kpop hits bts', 'blackpink newjeans twice', 'popular kpop'],
              icon: Star,
              color: 'from-fuchsia-500 to-purple-700'
            });
          }
        });

        if (preferenceCategories.length > 0) {
          const insertIdx = finalCats.findIndex(c => c.id !== 'playlists' && c.id !== 'foryou');
          const insertPos = insertIdx !== -1 ? insertIdx : 2;
          finalCats.splice(insertPos, 0, ...preferenceCategories);
        }

        let baseCats = [...finalCats];

        if (combinedHistory.length > 0) {
          const authorCounts: Record<string, number> = {};
          combinedHistory.forEach((p: any) => {
             const author = p.track?.author || p.author;
             if (author && author !== 'Unknown artist' && author.length > 1) {
                authorCounts[author] = (authorCounts[author] || 0) + 1;
             }
          });
          const sortedAuthors = Object.entries(authorCounts)
            .sort((a,b) => b[1] - a[1])
            .map(e => e[0])
            .filter(a => a.length > 1)
            .slice(0, 10);

          if (sortedAuthors.length > 0) {
            const newCats = [...baseCats];
            
            const artistsCatIndex = newCats.findIndex(c => c.id === 'artists');
            if (artistsCatIndex !== -1) {
              const artistsCat = { ...newCats[artistsCatIndex] };
              artistsCat.queries = Array.from(new Set([...sortedAuthors, ...artistsCat.queries])).slice(0, 15);
              newCats[artistsCatIndex] = artistsCat;
            }
             
            const dynamicRows = sortedAuthors.slice(0, 3).map((author, idx) => ({
               id: `dynamic_${idx}`,
               name: `More like ${author}`,
               queries: [`${author} songs`, `${author} popular`, `${author} best`],
               icon: Headphones,
               color: idx === 0 ? 'from-violet-500 to-purple-700' : idx === 1 ? 'from-teal-500 to-cyan-700' : 'from-rose-500 to-pink-700'
            }));
             
            const insertAt = artistsCatIndex !== -1 ? artistsCatIndex + 1 : 2;
            newCats.splice(insertAt, 0, ...dynamicRows);
            
            setDynamicCategories(newCats);
            setCategoriesVersion(v => v + 1);
            return;
          }
        }

        setDynamicCategories(baseCats);
        setCategoriesVersion(v => v + 1);
      } catch (e) { console.error('[ExploreView] fetchRecentPicks error:', e); }
    };

    fetchRecentPicks();

    // Listen for manual history-updated events (from search/play clicks)
    window.addEventListener('history-updated', fetchRecentPicks);

    // Listen for real-time socket track changes
    // When a new song plays, save the artist to history and update the explore tab
    const handleTrackUpdate = (e: any) => {
      const track = e.detail?.currentTrack || e.detail?.track;
      if (!track) return;
      const author = track.author || track.artistName;
      const title = track.title || track.trackName;
      if (!author || author === 'Unknown artist') return;
      try {
        const history = JSON.parse(localStorage.getItem(`aurora_history_${userId}`) || '[]');
        // Avoid duplicate consecutive entries
        const last = history[history.length - 1];
        if (last?.track?.author === author && last?.track?.title === title) return;
        history.push({ track: { title, author, artwork: track.artwork }, timestamp: Date.now() });
        localStorage.setItem(`aurora_history_${userId}`, JSON.stringify(history.slice(-100)));
        fetchRecentPicks();
      } catch (e) {}
    };

    window.addEventListener('track-playing', handleTrackUpdate);
    window.addEventListener('history-updated', fetchRecentPicks);

    return () => {
      window.removeEventListener('history-updated', fetchRecentPicks);
      window.removeEventListener('track-playing', handleTrackUpdate);
    };
  }, [userId]);

  const executeSearch = async (queryToSearch: string) => {
    if (!queryToSearch.trim()) {
      setSearchResults(null);
      return;
    }
    setSearchQuery(queryToSearch);
    setIsSearching(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    try {
      const apiUrl = '';
      const response = await fetch(`${apiUrl}/api/search?query=${encodeURIComponent(queryToSearch)}&source=explorer&limit=60`, {
        headers: { 'X-User-Id': userId }
      });
      const data = await response.json();
      const filtered = (data.tracks || []).filter((track: any) => {
        if (!track.artwork) return true;
        const art = track.artwork.toLowerCase();
        return !(
          art.includes('discordapp.com/embed/avatars') ||
          art.includes('placeholder') ||
          art.includes('d41d8cd98f00b204e9800998ecf8427e') ||
          art.includes('2a96cbd8b46e442fc41c2b86b821562f')
        );
      });
      setSearchResults(filtered);
      
      try {
        const history = JSON.parse(localStorage.getItem(`aurora_history_${userId}`) || '[]');
        history.push({
          track: { title: queryToSearch, author: queryToSearch },
          timestamp: Date.now()
        });
        localStorage.setItem(`aurora_history_${userId}`, JSON.stringify(history.slice(-50)));
        window.dispatchEvent(new CustomEvent('history-updated'));
      } catch (e) {}
    } catch (e) {
      console.error(e);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    executeSearch(searchQuery);
  };

  const playItem = async (item: any, isPlaylist = false) => {
    if (item.isArtist) {
      setSelectedArtistName(item.title || item.author || item.name);
      setActiveSubTab('artists');
      return;
    }

    try {
      if (!isPlaylist && (item.author || item.track?.author)) {
        try {
          const history = JSON.parse(localStorage.getItem(`aurora_history_${userId}`) || '[]');
          history.push({
            track: item.track || item,
            timestamp: Date.now()
          });
          localStorage.setItem(`aurora_history_${userId}`, JSON.stringify(history.slice(-50)));
          window.dispatchEvent(new CustomEvent('history-updated'));
        } catch (e) {}
      }

      const apiUrl = '';
      
      if (item.tracks && Array.isArray(item.tracks) && item.tracks.length > 0) {
        const firstTrack = item.tracks[0];
        const playQuery = firstTrack.link || firstTrack.url || (firstTrack.id && /^\d+$/.test(String(firstTrack.id)) ? `https://www.deezer.com/track/${firstTrack.id}` : `${firstTrack.title} ${firstTrack.author || ''}`.trim());
        const response = await fetch(`${apiUrl}/api/play`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-User-Id': userId },
          body: JSON.stringify({ guildId, userId, query: playQuery })
        });
        const data = await response.json();
        if (data.requiresWebLink) {
          window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: '⚠️ ¡Por favor, ejecuta el comando /setup en Discord primero para crear el panel de música!', type: 'error' } }));
          return;
        }
        if (data.success || (response.ok && !data.error)) {
          window.dispatchEvent(new CustomEvent('show-toast', {
            detail: { message: `▶️ Playing ${item.name || item.title || firstTrack.title}`, type: 'success' }
          }));

          // Queue remaining tracks sequentially
          for (let i = 1; i < Math.min(item.tracks.length, 10); i++) {
            const nextTrack = item.tracks[i];
            const nextQuery = nextTrack.link || nextTrack.url || (nextTrack.id && /^\d+$/.test(String(nextTrack.id)) ? `https://www.deezer.com/track/${nextTrack.id}` : `${nextTrack.title} ${nextTrack.author || ''}`.trim());
            fetch(`${apiUrl}/api/play`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'X-User-Id': userId },
              body: JSON.stringify({ guildId, userId, query: nextQuery })
            }).catch(() => {});
          }
        } else {
          window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: data.error || 'Failed to play mix', type: 'error' } }));
        }
      } else if (isPlaylist) {
        (window as any).pendingPlaylistToOpen = item;
        window.dispatchEvent(new CustomEvent('change-view', { detail: 'playlists' }));
      } else {
        const playQuery = item.link || item.url || item.query || (item.id && /^\d+$/.test(String(item.id)) ? `https://www.deezer.com/track/${item.id}` : (item.track ? (item.track.url || item.track.link || `${item.track.title} ${item.track.author}`) : `${item.title} ${item.author || ''}`.trim()));
        const response = await fetch(`${apiUrl}/api/play`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-User-Id': userId },
          body: JSON.stringify({ guildId, userId, query: playQuery })
        });
        const data = await response.json();
        if (data.requiresWebLink) {
          window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: '⚠️ ¡Por favor, ejecuta el comando /setup en Discord primero para crear el panel de música!', type: 'error' } }));
          return;
        }
        if (data.success || (response.ok && !data.error)) {
          window.dispatchEvent(new CustomEvent('show-toast', {
            detail: { message: `✅ Playing ${item.title || item.track?.title}`, type: 'success' }
          }));
        } else {
          window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: data.error || 'Failed to play', type: 'error' } }));
        }
      }
    } catch (e: any) {
      if (e.name === 'AbortError') return;
      console.error(e);
      window.dispatchEvent(new CustomEvent('show-toast', {
        detail: { message: 'Network error while playing', type: 'error' }
      }));
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-[#121212] -z-10 pointer-events-none" />
      
      <div className="w-full h-full bg-gradient-to-b from-[#212121] to-[#121212] rounded-none md:rounded-tl-lg relative flex flex-col overflow-hidden">
      <div className="w-full flex flex-col h-full">
        <div className="flex items-center justify-between gap-6 p-4 md:p-6 bg-[#121212]/80 backdrop-blur-md border-b border-white/5 sticky top-0 z-20">
          <div className="hidden md:flex gap-2">
            <button className="w-8 h-8 rounded-full bg-black/60 flex items-center justify-center text-white/70 hover:text-white transition">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button className="w-8 h-8 rounded-full bg-black/60 flex items-center justify-center text-white/70 hover:text-white transition">
              <ChevronRight className="w-5 h-5" />
            </button>
            <button 
              onClick={() => {
                setSearchQuery('');
                setSearchResults(null);
                setActiveSubTab('discover');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }} 
              className="ml-2 px-4 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-sm font-bold flex items-center gap-2 transition cursor-pointer"
              title="Volver al Inicio de Explorar"
            >
               <Home className="w-4 h-4" /> Inicio
            </button>
          </div>
          
          <form onSubmit={handleSearch} className="w-full max-w-xs md:max-w-sm relative ml-auto mr-44 sm:mr-48 md:mr-56">
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="¿Qué te apetece escuchar?"
              className="w-full pl-10 pr-4 py-3 bg-[#242424] hover:bg-[#2a2a2a] border border-transparent hover:border-white/20 rounded-full text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white transition-all text-sm font-medium"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60 w-5 h-5" />
            <button type="submit" className="hidden" />
          </form>
        </div>

        <div className="flex-1 overflow-y-auto px-4 md:px-8 pb-32 custom-scrollbar-vertical">
          
          {/* Sub-tabs for Explore View */}
          <div className="flex items-center gap-2 mb-6 mt-2 pb-3 border-b border-white/5">
            <button
              onClick={() => {
                setActiveSubTab('discover');
                setSearchResults(null);
                setSearchQuery('');
              }}
              className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs sm:text-sm font-bold transition-all duration-300 cursor-pointer ${
                activeSubTab === 'discover' && !searchResults
                  ? 'bg-white text-black shadow-lg shadow-white/10 scale-105'
                  : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
              }`}
            >
              <Compass className="w-4 h-4" />
              Descubrir
            </button>
            <button
              onClick={() => {
                setActiveSubTab('liked');
                setSearchResults(null);
                setSearchQuery('');
              }}
              className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs sm:text-sm font-bold transition-all duration-300 cursor-pointer ${
                activeSubTab === 'liked' && !searchResults
                  ? 'bg-pink-500 text-white shadow-lg shadow-pink-500/20 scale-105'
                  : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
              }`}
            >
              <Heart className="w-4 h-4 fill-current text-pink-300" />
              Favoritas
            </button>
            <button
              onClick={() => {
                setActiveSubTab('artists');
                setSearchResults(null);
                setSearchQuery('');
              }}
              className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs sm:text-sm font-bold transition-all duration-300 cursor-pointer ${
                activeSubTab === 'artists' && !searchResults
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20 scale-105'
                  : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
              }`}
            >
              <User className="w-4 h-4" />
              Artistas Populares
            </button>
            <button
              onClick={() => {
                setActiveSubTab('moods_genres');
                setSearchResults(null);
                setSearchQuery('');
              }}
              className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs sm:text-sm font-bold transition-all duration-300 cursor-pointer ${
                activeSubTab === 'moods_genres' && !searchResults
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20 scale-105'
                  : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
              }`}
            >
              <Zap className="w-4 h-4 text-purple-400 fill-current animate-pulse" />
              Géneros y Estados de Ánimo
            </button>
          </div>

          {!isSearching && !searchResults && activeSubTab === 'discover' && (
            <>
              {/* Auto-moving Marquee Section */}
              <div className="mb-10 w-full overflow-hidden relative rounded-2xl bg-white/5 border border-white/5 py-4">
                <div className="flex items-center gap-2 mb-3 px-6">
                  <Flame className="w-5 h-5 text-orange-500 animate-bounce" />
                  <h3 className="text-lg font-bold text-white tracking-tight">Tendencias Actuales</h3>
                </div>
                <div className="relative w-full overflow-hidden flex">
                  <div className="flex gap-4 animate-marquee whitespace-nowrap">
                    {[
                      { title: 'Espresso', author: 'Sabrina Carpenter', artwork: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&q=80', query: 'Sabrina Carpenter Espresso' },
                      { title: 'Not Like Us', author: 'Kendrick Lamar', artwork: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&q=80', query: 'Kendrick Lamar Not Like Us' },
                      { title: 'Million Dollar Baby', author: 'Tommy Richman', artwork: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&q=80', query: 'Tommy Richman Million Dollar Baby' },
                      { title: 'Birds of a Feather', author: 'Billie Eilish', artwork: 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=300&q=80', query: 'Billie Eilish Birds of a Feather' },
                      { title: 'A Bar Song (Tipsy)', author: 'Shaboozey', artwork: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=300&q=80', query: 'Shaboozey A Bar Song Tipsy' },
                      { title: 'Houdini', author: 'Eminem', artwork: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=300&q=80', query: 'Eminem Houdini' },
                      { title: 'I Like The Way You Kiss Me', author: 'Artemas', artwork: 'https://images.unsplash.com/photo-1511735111819-9a3f7709049c?w=300&q=80', query: 'Artemas I Like The Way You Kiss Me' },
                      { title: 'Too Sweet', author: 'Hozier', artwork: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=300&q=80', query: 'Hozier Too Sweet' },
                      { title: 'Espresso', author: 'Sabrina Carpenter', artwork: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&q=80', query: 'Sabrina Carpenter Espresso' },
                      { title: 'Not Like Us', author: 'Kendrick Lamar', artwork: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&q=80', query: 'Kendrick Lamar Not Like Us' },
                      { title: 'Million Dollar Baby', author: 'Tommy Richman', artwork: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&q=80', query: 'Tommy Richman Million Dollar Baby' },
                      { title: 'Birds of a Feather', author: 'Billie Eilish', artwork: 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=300&q=80', query: 'Billie Eilish Birds of a Feather' },
                      { title: 'A Bar Song (Tipsy)', author: 'Shaboozey', artwork: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=300&q=80', query: 'Shaboozey A Bar Song Tipsy' },
                      { title: 'Houdini', author: 'Eminem', artwork: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=300&q=80', query: 'Eminem Houdini' },
                      { title: 'I Like The Way You Kiss Me', author: 'Artemas', artwork: 'https://images.unsplash.com/photo-1511735111819-9a3f7709049c?w=300&q=80', query: 'Artemas I Like The Way You Kiss Me' },
                      { title: 'Too Sweet', author: 'Hozier', artwork: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=300&q=80', query: 'Hozier Too Sweet' }
                    ].map((song, i) => (
                      <div 
                        key={i} 
                        onClick={() => playItem(song, false)}
                        onMouseEnter={() => setHoveredArtwork(song.artwork)}
                        onMouseLeave={() => setHoveredArtwork(null)}
                        className="inline-flex items-center gap-3 bg-[#181818]/60 hover:bg-[#282828] border border-white/5 p-3 rounded-xl cursor-pointer transition-all duration-300 min-w-[240px] select-none hover:scale-[1.02]"
                      >
                        <img 
                          src={song.artwork} 
                          alt={song.title} 
                          className="w-12 h-12 rounded-lg object-cover pointer-events-none" 
                        />
                        <div className="truncate">
                          <h4 className="text-white font-bold text-xs truncate">{song.title}</h4>
                          <p className="text-white/60 text-[10px] truncate">{song.author}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              {recentPicks.length > 0 && (
                <div className="mb-8 mt-2">
                  <h2 className="text-3xl font-bold text-white mb-6 tracking-tight">{getGreeting()}</h2>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                    {recentPicks.map((pick, i) => {
                      const pTrack = pick.track || pick;
                      const isLiked = isSongLiked(pTrack.title, pTrack.author, pTrack.identifier);
                      return (
                        <div 
                          key={i} 
                          onClick={() => playItem(pick, false)}
                          onMouseEnter={() => setHoveredArtwork(pTrack.artwork || null)}
                          onMouseLeave={() => setHoveredArtwork(null)}
                          className="group flex items-center bg-white/5 hover:bg-white/20 transition-all rounded-md overflow-hidden cursor-pointer shadow-sm relative"
                        >
                          <img 
                            src={pTrack.artwork || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&q=80'} 
                            onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&q=80'; }}
                            alt={pTrack.title} 
                            className="w-12 h-12 md:w-16 md:h-16 object-cover shadow-[0_0_10px_rgba(0,0,0,0.5)]" 
                          />
                          <div className="p-3 pr-16 md:p-4 truncate">
                            <h4 className="text-white font-bold text-sm md:text-base truncate">{pTrack.title}</h4>
                          </div>
                          <div className="absolute right-3 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 z-10">
                            <button
                              onClick={(e) => handleToggleLikeSong(pTrack, e)}
                              className="w-8 h-8 bg-black/70 hover:bg-black/90 rounded-full flex items-center justify-center text-white transition-all hover:scale-105 shadow-xl cursor-pointer"
                              title={isLiked ? "Eliminar de favoritas" : "Añadir a favoritas"}
                            >
                              <Heart className={`w-4 h-4 ${isLiked ? 'text-pink-500 fill-pink-500' : 'text-white'}`} />
                            </button>
                            <button className="w-10 h-10 bg-[#1ed760] rounded-full flex items-center justify-center shadow-xl hover:scale-105 hover:bg-[#1fdf64]">
                              <Play className="w-5 h-5 text-black ml-1" fill="black" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}

          {isSearching ? (
            <div className="flex justify-center py-20">
              <div className="w-12 h-12 border-4 border-transparent border-t-[#1ed760] rounded-full animate-spin" />
            </div>
          ) : searchResults ? (
            <div>
              <div className="flex items-center gap-2 mb-6 mt-4">
                <Search className="w-6 h-6 text-white" />
                <h3 className="text-2xl font-bold text-white">Resultados de Búsqueda ({searchResults.length})</h3>
                
                {searchResults.length > 0 && (
                  <button 
                    onClick={() => playItem({ name: `Búsqueda: ${searchQuery}`, tracks: searchResults }, true)}
                    className="ml-4 px-4 py-2 bg-[#1ed760] text-black font-bold rounded-full hover:scale-105 transition-all flex items-center gap-2 text-sm shadow-xl cursor-pointer"
                  >
                    <Play className="w-4 h-4" fill="black" /> Reproducir Todo ({searchResults.length})
                  </button>
                )}

                <button 
                  onClick={() => setSearchResults(null)}
                  className="ml-auto text-sm text-white/50 hover:text-white bg-white/5 px-4 py-2 rounded-full font-bold transition cursor-pointer"
                >
                  Limpiar
                </button>
              </div>

              {searchResults.length === 0 ? (
                <div className="text-center py-20">
                  <Music className="w-16 h-16 text-white/20 mx-auto mb-4" />
                  <p className="text-white/50 text-lg">No se encontraron resultados para "{searchQuery}"</p>
                  <p className="text-white/40 text-sm mt-2">Comprueba que las palabras estén bien escritas o prueba con otros términos.</p>
                </div>
              ) : (
                <div className="space-y-8">
                  {/* Top Result Card (Spotify Style) */}
                  {searchResults.length > 0 && (() => {
                    const topTrack = searchResults[0];
                    const isTopLiked = isSongLiked(topTrack.title, topTrack.author, topTrack.identifier);
                    return (
                      <div>
                        <h4 className="text-[#a7a7a7] text-xs font-bold uppercase tracking-wider mb-3">Resultado Principal</h4>
                        <div
                          onClick={() => playItem(topTrack, false)}
                          onMouseEnter={() => setHoveredArtwork(topTrack.artwork || null)}
                          onMouseLeave={() => setHoveredArtwork(null)}
                          className="group relative bg-[#181818] hover:bg-[#282828] p-5 rounded-2xl cursor-pointer transition-all duration-300 max-w-xl border border-white/5 hover:border-white/10 flex flex-col md:flex-row items-start md:items-center gap-5 shadow-2xl"
                        >
                          <img
                            src={getCleanArtwork(topTrack.artwork)}
                            onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&q=80'; }}
                            alt={topTrack.title}
                            className="w-24 h-24 md:w-28 md:h-28 rounded-xl object-cover shadow-lg border border-white/10 shrink-0"
                          />
                          <div className="flex-1 min-w-0 pr-12">
                            <h2 className="text-2xl font-black text-white truncate drop-shadow-sm">{topTrack.title}</h2>
                            <div className="flex items-center gap-2 mt-2">
                              <span className="text-[10px] font-extrabold bg-[#1ed760]/20 text-[#1ed760] px-2.5 py-0.5 rounded-full uppercase tracking-wider">Mejor Coincidencia</span>
                              <span className="text-sm font-semibold text-[#a7a7a7] truncate">{topTrack.author}</span>
                            </div>
                          </div>
                          <div className="absolute right-5 bottom-5 md:static opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 flex items-center gap-2 z-10">
                            <button
                              onClick={(e) => handleToggleLikeSong(topTrack, e)}
                              className="w-10 h-10 bg-black/70 hover:bg-black/90 rounded-full flex items-center justify-center text-white transition-all hover:scale-105 shadow-2xl cursor-pointer"
                              title={isTopLiked ? "Eliminar de favoritas" : "Añadir a favoritas"}
                            >
                              <Heart className={`w-5 h-5 ${isTopLiked ? 'text-pink-500 fill-pink-500' : 'text-white'}`} />
                            </button>
                            <button className="w-12 h-12 bg-[#1ed760] rounded-full flex items-center justify-center shadow-2xl hover:scale-105 hover:bg-[#1fdf64] transition-all">
                              <Play className="w-6 h-6 text-black ml-0.5" fill="black" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Songs Grid (Spotify 6-Column Responsive Card Grid) */}
                  <div>
                    <h4 className="text-[#a7a7a7] text-xs font-bold uppercase tracking-wider mb-3">Todas las Canciones ({searchResults.length})</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
                      {searchResults.map((track, i) => {
                        const isLiked = isSongLiked(track.title, track.author, track.identifier);
                        return (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: Math.min(i * 0.02, 0.4) }}
                            key={i}
                            onClick={() => playItem(track, false)}
                            onMouseEnter={() => setHoveredArtwork(track.artwork || null)}
                            onMouseLeave={() => setHoveredArtwork(null)}
                            className="group bg-[#181818] rounded-2xl p-3.5 md:p-4 hover:bg-[#282828] transition-all duration-300 cursor-pointer flex flex-col relative border border-white/5 hover:border-white/10 hover:shadow-2xl"
                          >
                            <div className="relative w-full aspect-square rounded-xl overflow-hidden mb-3 shadow-[0_8px_24px_rgba(0,0,0,0.6)] border border-white/5">
                              <img
                                src={getCleanArtwork(track.artwork)}
                                onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&q=80'; }}
                                alt={track.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              />
                              <button
                                onClick={(e) => handleToggleLikeSong(track, e)}
                                className="absolute top-2 right-2 p-2 bg-black/70 hover:bg-black/90 rounded-full text-white transition-all opacity-0 group-hover:opacity-100 z-20 shadow-lg cursor-pointer hover:scale-110"
                                title={isLiked ? "Eliminar de favoritas" : "Añadir a favoritas"}
                              >
                                <Heart className={`w-4 h-4 ${isLiked ? 'text-pink-500 fill-pink-500' : 'text-white'}`} />
                              </button>
                              <div className="absolute bottom-2 right-2 translate-y-3 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 z-10">
                                <button className="w-10 h-10 md:w-11 md:h-11 bg-[#1ed760] rounded-full flex items-center justify-center shadow-xl hover:scale-105 hover:bg-[#1fdf64] transition-all">
                                  <Play className="w-5 h-5 text-black ml-0.5" fill="black" />
                                </button>
                              </div>
                            </div>
                            <h3 className="text-white font-bold text-sm truncate w-full">{track.title}</h3>
                            <p className="text-[#a7a7a7] text-xs truncate w-full mt-1 font-medium">{track.author}</p>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : activeSubTab === 'liked' ? (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-pink-900/30 via-purple-950/20 to-transparent p-6 rounded-2xl border border-pink-500/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Canciones Favoritas</h2>
                  <p className="text-white/60 text-sm mt-0.5">{likedSongsList.length} {likedSongsList.length === 1 ? 'canción guardada' : 'canciones guardadas'}</p>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-white/40 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Buscar canciones guardadas..."
                      value={likedSearchQuery}
                      onChange={(e) => setLikedSearchQuery(e.target.value)}
                      className="w-full sm:w-60 pl-10 pr-4 py-2.5 bg-white/5 hover:bg-white/10 focus:bg-white/10 border border-white/10 rounded-full text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-pink-500/30 transition-all text-sm"
                    />
                  </div>
                  {likedSongsList.length > 0 && (
                    <button
                      onClick={playAllLikedSongs}
                      className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-green-600 text-black font-black rounded-full hover:scale-105 transition-all flex items-center justify-center gap-2 text-sm shadow-xl shadow-green-900/20 cursor-pointer"
                    >
                      <Play className="w-4 h-4 fill-black text-black" /> Reproducir Todo
                    </button>
                  )}
                </div>
              </div>

              {likedLoading && likedSongsList.length === 0 ? (
                <div className="flex justify-center py-20">
                  <div className="w-10 h-10 border-4 border-transparent border-t-pink-500 rounded-full animate-spin" />
                </div>
              ) : likedSongsList.length === 0 ? (
                <div className="text-center py-20 bg-white/5 rounded-2xl border border-white/5 flex flex-col items-center justify-center p-6">
                  <Heart className="w-16 h-16 text-white/10 mb-4 animate-pulse" />
                  <h3 className="text-white font-bold text-lg">Aún no tienes canciones favoritas</h3>
                  <p className="text-white/40 text-sm mt-1 max-w-sm">Las canciones que guardes con el botón ♥ aparecerán aquí automáticamente.</p>
                  <button
                    onClick={() => setActiveSubTab('discover')}
                    className="mt-6 px-6 py-2 bg-white text-black font-bold rounded-full text-sm hover:scale-105 transition-all shadow-md cursor-pointer"
                  >
                    Descubrir Música
                  </button>
                </div>
              ) : (
                (() => {
                  const filtered = likedSongsList.filter(item => {
                    const title = item.track?.title?.toLowerCase() || '';
                    const author = item.track?.author?.toLowerCase() || '';
                    const query = likedSearchQuery.toLowerCase();
                    return title.includes(query) || author.includes(query);
                  });

                  if (filtered.length === 0) {
                    return (
                      <div className="text-center py-20 text-white/50">
                        <Music className="w-12 h-12 text-white/20 mx-auto mb-3" />
                        No se encontraron resultados para "{likedSearchQuery}"
                      </div>
                    );
                  }

                  return (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
                      {filtered.map((item, i) => {
                        const track = item.track;
                        return (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: Math.min(i * 0.03, 0.5) }}
                            key={item._id || i}
                            onClick={() => playItem(track, false)}
                            className="group bg-[#181818] rounded-xl p-3 md:p-4 hover:bg-[#282828] transition-all duration-300 cursor-pointer flex flex-col relative border border-transparent hover:border-white/5"
                          >
                            <div className="relative w-full aspect-square rounded-lg overflow-hidden mb-4 shadow-[0_8px_24px_rgba(0,0,0,0.5)]">
                              <img
                                src={getCleanArtwork(track.artwork)}
                                onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&q=80'; }}
                                alt={track.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                              <div className="absolute bottom-2 right-2 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 z-10">
                                <button className="w-10 h-10 bg-[#1ed760] rounded-full flex items-center justify-center shadow-xl hover:scale-105 hover:bg-[#1fdf64]">
                                  <Play className="w-5 h-5 text-black ml-0.5" fill="black" />
                                </button>
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleUnlikeSong(track.identifier, track.title);
                                }}
                                className="absolute top-2 right-2 p-2 bg-black/60 hover:bg-red-600/80 rounded-full text-white/80 hover:text-white transition-all opacity-0 group-hover:opacity-100 z-20 shadow-lg cursor-pointer"
                                title="Eliminar de Favoritas"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <h4 className="text-white font-bold text-sm md:text-base truncate w-full">{track.title}</h4>
                            <p className="text-[#a7a7a7] text-xs md:text-sm truncate w-full mt-1 font-medium leading-tight">{track.author}</p>
                          </motion.div>
                        );
                      })}
                    </div>
                  );
                })()
              )}
            </div>
          ) : activeSubTab === 'artists' ? (
            selectedArtistName ? (
              <DeezerArtistView
                initialArtistName={selectedArtistName}
                userId={userId}
                guildId={guildId}
                isPremium={isPremium}
                onPlayTrack={(track, playAll) => playItem(track, playAll)}
                onBack={() => setSelectedArtistName(null)}
              />
            ) : (
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-purple-900/30 via-pink-950/20 to-transparent p-6 rounded-2xl border border-purple-500/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Artistas Populares</h2>
                    <p className="text-white/60 text-sm mt-0.5">Explora música y perfiles completos de artistas de todo el mundo</p>
                  </div>

                  <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-white/40 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Buscar artistas..."
                      value={artistSearchQuery}
                      onChange={(e) => setArtistSearchQuery(e.target.value)}
                      className="w-full sm:w-60 pl-10 pr-4 py-2.5 bg-white/5 hover:bg-white/10 focus:bg-white/10 border border-white/10 rounded-full text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500/30 transition-all text-sm"
                    />
                  </div>
                </div>

                {/* Language Filter Pills for Artists */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 mb-2 custom-scrollbar-horizontal hide-scrollbar">
                  {(['All', 'English', 'Spanish', 'K-Pop', 'Hindi', 'Tamil'] as const).map((lang) => {
                    const label = lang === 'All' ? 'Todos' : lang === 'Spanish' ? 'Español' : lang === 'English' ? 'Inglés' : lang;
                    return (
                      <button
                        key={lang}
                        onClick={() => setSelectedLanguage(lang)}
                        className={`px-5 py-2 rounded-full text-xs font-bold transition-all duration-300 cursor-pointer ${
                          selectedLanguage === lang
                            ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20 scale-105'
                            : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>

                {artistsLoading && artistsList.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20">
                    <div className="w-10 h-10 border-4 border-transparent border-t-purple-500 rounded-full animate-spin mb-3" />
                    <p className="text-white/50 text-xs font-semibold uppercase tracking-wider">Cargando...</p>
                  </div>
                ) : (
                  (() => {
                    const filtered = artistsList.filter(artist => {
                      const matchesSearch = artist.title.toLowerCase().includes(artistSearchQuery.toLowerCase());
                      const matchesLanguage = selectedLanguage === 'All' || artist.language === selectedLanguage;
                      return matchesSearch && matchesLanguage;
                    });

                    if (filtered.length === 0) {
                      return (
                        <div className="text-center py-20 text-white/50">
                          <Music className="w-12 h-12 text-white/20 mx-auto mb-3" />
                          No se encontraron artistas {selectedLanguage !== 'All' ? `en ${selectedLanguage}` : ''} {artistSearchQuery ? `coincidentes con "${artistSearchQuery}"` : ''}
                        </div>
                      );
                    }

                    return (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                        {filtered.map((artist, i) => (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: Math.min(i * 0.03, 0.5) }}
                            key={i}
                            onClick={() => setSelectedArtistName(artist.title || artist.url)}
                            onMouseEnter={() => setHoveredArtwork(artist.artwork)}
                            onMouseLeave={() => setHoveredArtwork(null)}
                            className="group flex flex-col items-center bg-[#151515] hover:bg-[#222] p-4 rounded-2xl cursor-pointer transition-all duration-300 text-center border border-white/5 hover:border-white/10 hover:shadow-xl relative"
                          >
                            <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden mb-4 shadow-lg group-hover:scale-105 transition-transform duration-300 border border-white/10">
                              <img
                                src={artist.artwork}
                                alt={artist.title}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  const target = e.currentTarget;
                                  if (!target.dataset.failed) {
                                    target.dataset.failed = 'true';
                                    fetch(`/api/artists/image?name=${encodeURIComponent(artist.title)}`)
                                      .then(res => res.json())
                                      .then(data => {
                                        if (data.image && !data.image.includes('ui-avatars.com')) {
                                          target.src = data.image;
                                        }
                                      }).catch(() => {});
                                  }
                                }}
                              />
                              <div className="absolute inset-0 bg-purple-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <span className="px-3 py-1 bg-purple-600 text-white text-xs font-bold rounded-full shadow-lg scale-95 group-hover:scale-100 transition">
                                  Ver Perfil
                                </span>
                              </div>
                            </div>
                            <h4 className="text-white font-bold text-sm sm:text-base truncate w-full group-hover:text-purple-400 transition">{artist.title}</h4>
                            <p className="text-[#a7a7a7] text-xs mt-1 font-medium">{artist.language || 'Artista'}</p>
                          </motion.div>
                        ))}
                      </div>
                    );
                  })()
                )}
              </div>
            )
          ) : activeSubTab === 'moods_genres' ? (
            <div className="space-y-10">
              {/* Header Banner */}
              <div className="bg-gradient-to-r from-indigo-900/30 via-purple-950/20 to-transparent p-8 rounded-3xl border border-indigo-500/10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <h2 className="text-3xl font-black text-white tracking-tight">Géneros y Estados de Ánimo</h2>
                  <p className="text-white/60 text-sm mt-0.5">Encuentra la música perfecta para cualquier momento o estilo</p>
                </div>
              </div>

              {/* Moods Section */}
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <Heart className="w-5 h-5 text-purple-400" />
                  <h3 className="text-xl font-bold text-white tracking-tight">Momentos y Estados de Ánimo</h3>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {MOODS.map((mood, i) => {
                    const IconComponent = mood.icon;
                    return (
                      <motion.div
                        key={mood.id}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.04 }}
                        onClick={() => executeSearch(mood.query)}
                        className={`group relative overflow-hidden p-6 rounded-2xl border bg-gradient-to-br ${mood.color} cursor-pointer transition-all duration-300 hover:scale-[1.03] hover:border-white/10`}
                      >
                        <div className="flex flex-col justify-between h-24 relative z-10">
                          <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/5 group-hover:scale-110 transition-transform duration-300">
                            <IconComponent className="w-5 h-5 text-white" />
                          </div>
                          <span className="text-white font-bold text-base tracking-tight">{mood.name}</span>
                        </div>
                        <div className="absolute -right-8 -bottom-8 w-24 h-24 bg-white/5 rounded-full blur-xl group-hover:bg-white/10 transition-all duration-300" />
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              {/* Genres Section */}
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <Disc className="w-5 h-5 text-purple-400" />
                  <h3 className="text-xl font-bold text-white tracking-tight">Géneros Populares</h3>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {GENRES.map((genre, i) => {
                    const IconComponent = genre.icon;
                    return (
                      <motion.div
                        key={genre.id}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: (i + MOODS.length) * 0.04 }}
                        onClick={() => executeSearch(genre.query)}
                        className={`group relative overflow-hidden p-6 rounded-2xl border bg-gradient-to-br ${genre.color} cursor-pointer transition-all duration-300 hover:scale-[1.03] hover:border-white/10`}
                      >
                        <div className="flex flex-col justify-between h-24 relative z-10">
                          <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/5 group-hover:scale-110 transition-transform duration-300">
                            <IconComponent className="w-5 h-5 text-white" />
                          </div>
                          <span className="text-white font-bold text-base tracking-tight">{genre.name}</span>
                        </div>
                        <div className="absolute -right-8 -bottom-8 w-24 h-24 bg-white/5 rounded-full blur-xl group-hover:bg-white/10 transition-all duration-300" />
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {recentPicks.length === 0 && (
                <div className="mt-8 mb-4">
                  <h2 className="text-3xl font-bold text-white mb-6 tracking-tight">{getGreeting()}</h2>
                </div>
              )}
              {dynamicCategories.map((cat, idx) => (
                <div key={cat.id}>
                  <CategoryRow
                    category={cat}
                    userId={userId}
                    guildId={guildId}
                    playItem={playItem}
                    onHoverTrack={setHoveredArtwork}
                    onToggleLike={handleToggleLikeSong}
                    likedSongsList={likedSongsList}
                  />
                  {idx === 1 && <CarouselBanner queries={PROMO_QUERIES_1} onBannerClick={executeSearch} />}
                  {idx === 4 && <CarouselBanner queries={PROMO_QUERIES_2} onBannerClick={executeSearch} />}
                  {idx === 7 && <CarouselBanner queries={PROMO_QUERIES_3} onBannerClick={executeSearch} />}
                </div>
              ))}
            </div>
          )}
        </div>

        <style jsx global>{`
          .hide-scrollbar::-webkit-scrollbar {
            display: none;
          }
          .hide-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
          .custom-scrollbar-vertical::-webkit-scrollbar {
            width: 12px;
          }
          .custom-scrollbar-vertical::-webkit-scrollbar-track {
            background: transparent;
          }
          .custom-scrollbar-vertical::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.3);
            border-radius: 0px;
          }
          .custom-scrollbar-vertical::-webkit-scrollbar-thumb:hover {
            background: rgba(255, 255, 255, 0.5);
          }
          .animate-marquee {
            display: inline-flex;
            animation: marquee-scroll 35s linear infinite;
            will-change: transform;
            transform: translate3d(0, 0, 0);
          }
          .animate-marquee:hover {
            animation-play-state: paused;
          }
          @keyframes marquee-scroll {
            0% {
              transform: translate3d(0, 0, 0);
            }
            100% {
              transform: translate3d(-50%, 0, 0);
            }
          }
        `}</style>
      </div>
      </div>

      {/* Ambient Blurred Hover Backdrop - cross-fade on song hover */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{ opacity: backdropVisible ? 1 : 0, transition: 'opacity 600ms ease-in-out' }}
      >
        <div
          className="absolute inset-0 blur-[20px] saturate-[1.5]"
          style={{
            backgroundImage: displayedArtwork ? `url(${displayedArtwork})` : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: 0.10,
            transform: 'translate3d(0,0,0)',
            willChange: 'opacity'
          }}
        />
      </div>

      {/* Onboarding Preferences Overlay (First Time Welcome) */}
      {!onboardingCompleted && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-[#121212] border border-white/10 p-5 sm:p-6 md:p-8 rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl relative z-50 overflow-hidden"
          >
            {/* Modal Header */}
            <div className="shrink-0 mb-4">
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-2">Bienvenido a Explorar en {siteName}</h2>
              <p className="text-white/60 text-xs sm:text-sm">Selecciona tus idiomas y géneros musicales favoritos para personalizar tu panel. Puedes elegir varios o continuar con la configuración por defecto.</p>
            </div>
            
            {/* Modal Scrollable Body */}
            <div className="flex-1 overflow-y-auto custom-scrollbar-vertical pr-1 space-y-6">
              {/* Languages Selection */}
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white mb-3">Idiomas Favoritos</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {['Spanish', 'English', 'French', 'Japanese', 'German', 'Korean', 'Italian', 'Portuguese'].map((lang) => {
                    const label = lang === 'Spanish' ? 'Español' : lang === 'English' ? 'Inglés' : lang === 'French' ? 'Francés' : lang === 'Japanese' ? 'Japonés' : lang === 'German' ? 'Alemán' : lang === 'Korean' ? 'Coreano' : lang === 'Italian' ? 'Italiano' : 'Portugués';
                    const selected = prefLangs.includes(lang);
                    return (
                      <button
                        key={lang}
                        onClick={() => {
                          setPrefLangs(prev => 
                            prev.includes(lang) ? prev.filter(l => l !== lang) : [...prev, lang]
                          );
                        }}
                        className={`py-2 px-3 sm:px-4 rounded-xl text-xs font-bold border transition-all duration-300 cursor-pointer ${
                          selected 
                            ? 'bg-purple-600 text-white border-purple-500 shadow-md shadow-purple-500/20' 
                            : 'bg-white/5 text-white/70 border-white/5 hover:bg-white/10 hover:border-white/10'
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Genres Selection */}
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white mb-3">Géneros Favoritos</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {['Pop', 'Hip-Hop', 'Rock', 'Electronic', 'R&B', 'Lofi', 'Classical', 'J-Pop/Anime', 'Metal', 'Jazz', 'K-Pop', 'Blues', 'Folk'].map((genre) => {
                    const selected = prefGenres.includes(genre);
                    return (
                      <button
                        key={genre}
                        onClick={() => {
                          setPrefGenres(prev => 
                            prev.includes(genre) ? prev.filter(g => g !== genre) : [...prev, genre]
                          );
                        }}
                        className={`py-2 px-3 sm:px-4 rounded-xl text-xs font-bold border transition-all duration-300 cursor-pointer ${
                          selected 
                            ? 'bg-purple-600 text-white border-purple-500 shadow-md shadow-purple-500/20' 
                            : 'bg-white/5 text-white/70 border-white/5 hover:bg-white/10 hover:border-white/10'
                        }`}
                      >
                        {genre}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Sticky Actions Footer */}
            <div className="shrink-0 pt-4 border-t border-white/10 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3 bg-[#121212] z-20 mt-2">
              <button
                onClick={() => {
                  localStorage.setItem(`aurora_onboarding_completed_${userId}`, 'true');
                  setOnboardingCompleted(true);
                }}
                className="w-full sm:w-auto px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold text-white/60 hover:text-white hover:bg-white/5 transition-all text-center cursor-pointer"
              >
                Omitir y Usar por Defecto
              </button>
              <button
                onClick={() => {
                  localStorage.setItem(`aurora_onboarding_completed_${userId}`, 'true');
                  localStorage.setItem(`aurora_pref_langs_${userId}`, JSON.stringify(prefLangs));
                  localStorage.setItem(`aurora_pref_genres_${userId}`, JSON.stringify(prefGenres));
                  setOnboardingCompleted(true);
                  window.dispatchEvent(new CustomEvent('history-updated'));
                }}
                className="w-full sm:w-auto px-6 py-2.5 rounded-full text-xs sm:text-sm font-bold bg-[#1ed760] text-black hover:scale-105 transition-all shadow-lg text-center cursor-pointer"
              >
                Guardar Preferencias
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
}

