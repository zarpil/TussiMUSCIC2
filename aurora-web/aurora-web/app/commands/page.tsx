'use client';

import { useState, useEffect, useRef, MouseEvent } from 'react';
import { motion } from 'framer-motion';
import {
  Play, SkipForward, ListMusic, Sliders, Repeat, Volume2,
  Shuffle, Pause, Search, Heart
} from 'lucide-react';
import AuroraBackground from '../../components/AuroraBackground';
import CursorGlow from '../../components/CursorGlow';
import Footer from '../../components/Footer';

const defaultCommands = [
  {
    name: 'play',
    description: 'Play a song or playlist from any supported source.',
    usage: '/play <song name or URL>',
    category: 'Music',
    icon: Play,
    color: 'hsl(330 90% 60%)',
    example: '/play never gonna give you up',
  },
  {
    name: 'skip',
    description: 'Skip the currently playing track instantly.',
    usage: '/skip',
    category: 'Music',
    icon: SkipForward,
    color: 'hsl(310 85% 65%)',
    example: '/skip',
  },
  {
    name: 'queue',
    description: 'View and manage your current music queue.',
    usage: '/queue [page]',
    category: 'Music',
    icon: ListMusic,
    color: 'hsl(280 75% 65%)',
    example: '/queue page:2',
  },
  {
    name: 'filters',
    description: 'Apply audio filters: bassboost, nightcore, 8D.',
    usage: '/filters <preset>',
    category: 'Music',
    icon: Sliders,
    color: 'hsl(330 90% 60%)',
    example: '/filters preset:nightcore',
  },
  {
    name: 'loop',
    description: 'Loop the current track or the entire queue.',
    usage: '/loop <mode>',
    category: 'Music',
    icon: Repeat,
    color: 'hsl(310 85% 65%)',
    example: '/loop mode:queue',
  },
  {
    name: 'volume',
    description: 'Adjust playback volume from 0 to 200%.',
    usage: '/volume <level>',
    category: 'Music',
    icon: Volume2,
    color: 'hsl(280 75% 65%)',
    example: '/volume level:75',
  },
  {
    name: 'shuffle',
    description: 'Shuffle the queue for a fresh listening order.',
    usage: '/shuffle',
    category: 'Music',
    icon: Shuffle,
    color: 'hsl(330 90% 60%)',
    example: '/shuffle',
  },
  {
    name: 'pause',
    description: 'Pause and resume playback at any moment.',
    usage: '/pause',
    category: 'Music',
    icon: Pause,
    color: 'hsl(310 85% 65%)',
    example: '/pause',
  },
  {
    name: 'search',
    description: 'Search across platforms and pick a result.',
    usage: '/search <query>',
    category: 'Music',
    icon: Search,
    color: 'hsl(280 75% 65%)',
    example: '/search query:lofi beats',
  },
  {
    name: 'favorite',
    description: 'Save the current track to your favorites.',
    usage: '/favorite',
    category: 'Music',
    icon: Heart,
    color: 'hsl(330 90% 60%)',
    example: '/favorite',
  },
];

function CommandCard({ command, index }: { command: any; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState<string>('');
  const [glow, setGlow] = useState<{ x: number; y: number } | null>(null);
  const Icon = command.icon;

  const handleMove = (e: MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const px = (x / rect.width) * 2 - 1;
    const py = (y / rect.height) * 2 - 1;
    const rotateY = px * 10;
    const rotateX = -py * 10;
    setTransform(
      `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(20px)`
    );
    setGlow({ x, y });
  };

  const handleLeave = () => {
    setTransform('perspective(900px) rotateX(0) rotateY(0) translateZ(0)');
    setGlow(null);
  };

  return (
    <div
      className="group relative animate-fade-in"
      style={{
        animationDelay: `${index * 60}ms`,
        animationFillMode: 'both',
        perspective: '1200px',
      }}
    >
      <div
        ref={ref}
        onMouseMove={handleMove}
        onMouseLeave={handleLeave}
        className="relative h-full rounded-2xl glass p-5 transition-[transform,box-shadow,border-color] duration-300 ease-out will-change-transform"
        style={{
          transform: transform || 'perspective(900px) rotateX(0) rotateY(0)',
          transformStyle: 'preserve-3d',
          borderColor: glow ? `${command.color.replace(')', ' / 0.4)')}` : undefined,
          boxShadow: glow
            ? `0 20px 60px -20px ${command.color.replace(')', ' / 0.45)')}, 0 0 40px ${command.color.replace(')', ' / 0.15)')}`
            : undefined,
        }}
      >
        {/* Cursor-follow glow */}
        {glow && (
          <div
            className="pointer-events-none absolute inset-0 rounded-2xl opacity-60 transition-opacity"
            style={{
              background: `radial-gradient(220px circle at ${glow.x}px ${glow.y}px, ${command.color.replace(')', ' / 0.18)')}, transparent 70%)`,
            }}
          />
        )}

        {/* Icon */}
        <div
          className="relative flex h-11 w-11 items-center justify-center rounded-xl"
          style={{
            background: `linear-gradient(135deg, ${command.color.replace(')', ' / 0.18)')}, transparent)`,
            border: '1px solid rgba(255, 255, 255, 0.15)',
            transform: 'translateZ(40px)',
          }}
        >
          <Icon
            className="h-5 w-5 transition-transform duration-300 group-hover:scale-110"
            style={{ color: command.color }}
          />
          <div
            className="absolute inset-0 rounded-xl blur-xl opacity-0 transition-opacity duration-300 group-hover:opacity-60"
            style={{ background: command.color }}
          />
        </div>

        {/* Command text */}
        <div className="mt-5" style={{ transform: 'translateZ(30px)' }}>
          <code
            className="font-mono text-lg font-semibold transition-colors"
            style={{ color: command.color }}
          >
            /{command.name}
          </code>
          <p className="mt-2 text-sm text-gray-400 leading-relaxed">
            {command.description}
          </p>
        </div>

        {/* Example pill */}
        <div
          className="mt-5 flex items-center gap-2 rounded-lg glass px-3 py-2 font-mono text-xs text-gray-500"
          style={{ transform: 'translateZ(20px)' }}
        >
          <span className="text-gray-600">›</span>
          <span className="truncate">{command.example}</span>
        </div>

        {/* Animated bottom border */}
        <div
          className="pointer-events-none absolute bottom-0 left-1/2 h-px w-0 -translate-x-1/2 transition-all duration-500 group-hover:w-3/4"
          style={{
            background: `linear-gradient(90deg, transparent, ${command.color}, transparent)`,
          }}
        />
      </div>
    </div>
  );
}

export default function CommandsPage() {
  const [commands, setCommands] = useState<any[]>([]);
  const [filter, setFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const socketUrl = (typeof window !== 'undefined' && window.self !== window.top) ? '' : (process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001');
    fetch(`${socketUrl}/api/commands`, { credentials: 'include' })
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch commands');
        return res.json();
      })
      .then(data => {
        const enrichedCommands = data.map((cmd: any) => {
          const defaultCmd = defaultCommands.find(d => d.name === cmd.name);
          return {
            ...cmd,
            icon: defaultCmd?.icon || Play,
            color: defaultCmd?.color || 'hsl(155 80% 50%)',
            example: defaultCmd?.example || `/${cmd.name}`,
          };
        });
        setCommands(enrichedCommands);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch commands:', err);
        setCommands(defaultCommands);
        setLoading(false);
      });
  }, []);

  const categories = ['All', ...Array.from(new Set(commands.map(cmd => cmd.category)))];
  
  const filteredCommands = commands.filter(cmd => {
    const matchesCategory = filter === 'All' || cmd.category === filter;
    const matchesSearch = cmd.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         cmd.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden">
      <AuroraBackground />
      <CursorGlow />
      
      <section className="relative py-24 sm:py-32 px-4 sm:px-6 overflow-hidden">
        {/* Ambient glows */}
        <div className="pointer-events-none absolute inset-0">
          <div
            className="absolute top-1/4 -left-20 h-72 w-72 rounded-full blur-3xl opacity-20"
            style={{
              background: 'radial-gradient(circle, hsl(155 80% 50%), transparent 70%)',
              animation: 'float-orb 14s ease-in-out infinite',
            }}
          />
          <div
            className="absolute bottom-1/4 -right-20 h-80 w-80 rounded-full blur-3xl opacity-20"
            style={{
              background: 'radial-gradient(circle, hsl(270 60% 60%), transparent 70%)',
              animation: 'float-orb 16s ease-in-out infinite reverse',
            }}
          />
        </div>

        <div className="container relative mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-14 sm:mb-20"
          >
            <span className="inline-flex items-center gap-2 rounded-full glass px-3 py-1 text-xs uppercase tracking-wider text-gray-400 mb-5">
              <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: 'hsl(330 90% 60%)' }} />
              Comandos Slash
            </span>
            <h2 className="mt-5 font-heading text-4xl md:text-5xl font-bold text-gradient">
              Un comando para cada ocasión
            </h2>
            <p className="mt-4 text-gray-400 text-base sm:text-lg max-w-xl mx-auto">
              Descubre y utiliza todos los comandos disponibles en Tussi Music para controlar tu experiencia musical.
            </p>
          </motion.div>

          {/* Search and Filter */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-6 flex flex-col md:flex-row gap-4"
          >
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar comandos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 glass rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-tussi-pink transition-all"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto">
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => setFilter(category)}
                  className={`px-4 py-2 rounded-xl font-medium whitespace-nowrap transition-all ${
                    filter === category
                      ? 'text-white'
                      : 'glass text-gray-300 hover:bg-white/10'
                  }`}
                  style={filter === category ? {
                    background: 'hsl(330 90% 60%)',
                    color: 'white',
                  } : {}}
                >
                  {category === 'All' ? 'Todos' : category}
                </button>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
              {filteredCommands.map((c, i) => (
                <CommandCard key={c.name} command={c} index={i} />
              ))}
            </div>
          </motion.div>

          {filteredCommands.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-400 text-lg">No se encontraron comandos</p>
              <p className="text-gray-500 text-sm mt-2">
                Prueba ajustando tu búsqueda o filtro
              </p>
            </div>
          )}
        </div>
      </section>
      
      <Footer />
    </div>
  );
}

