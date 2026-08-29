import { useState, useEffect, useRef, MouseEvent } from "react";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  Heart,
  Disc3,
  Radio,
  Headphones,
  Music2,
} from "lucide-react";
import ScrollReveal from "./ScrollReveal";

const tracks = [
  {
    title: "Midnight Aurora",
    artist: "Lunar Echoes",
    album: "Northern Lights EP",
    duration: 218,
    color: "hsl(var(--glow-green))",
  },
  {
    title: "Polar Drift",
    artist: "Arctic Pulse",
    album: "Frequencies",
    duration: 254,
    color: "hsl(var(--glow-purple))",
  },
  {
    title: "Solar Flare",
    artist: "Cosmic Rays",
    album: "Helios",
    duration: 192,
    color: "hsl(var(--glow-blue))",
  },
];

const liveStats = [
  { icon: Radio, label: "Live Servers", value: "10,482", accent: "hsl(var(--glow-green))" },
  { icon: Headphones, label: "Listening Now", value: "47.3K", accent: "hsl(var(--glow-blue))" },
  { icon: Music2, label: "Queued Tracks", value: "128.9K", accent: "hsl(var(--glow-purple))" },
];

function formatTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export default function StatsSection() {
  const [trackIndex, setTrackIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [liked, setLiked] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);

  const track = tracks[trackIndex];

  // Progress simulation
  useEffect(() => {
    if (!isPlaying) return;
    const id = setInterval(() => {
      setProgress((p) => {
        if (p >= track.duration) {
          setTrackIndex((i) => (i + 1) % tracks.length);
          return 0;
        }
        return p + 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [isPlaying, track.duration]);

  // Reset progress when track changes
  useEffect(() => {
    setProgress(0);
  }, [trackIndex]);

  const handleMove = (e: MouseEvent<HTMLDivElement>) => {
    const el = cardRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * 2 - 1;
    const py = ((e.clientY - r.top) / r.height) * 2 - 1;
    setTilt({ x: -py * 6, y: px * 8 });
  };

  const handleLeave = () => setTilt({ x: 0, y: 0 });

  const next = () => setTrackIndex((i) => (i + 1) % tracks.length);
  const prev = () => setTrackIndex((i) => (i - 1 + tracks.length) % tracks.length);

  return (
    <section id="stats" className="relative py-24 sm:py-32 px-4 sm:px-6 overflow-hidden">
      {/* Ambient glows */}
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute top-1/3 left-10 h-80 w-80 rounded-full blur-3xl opacity-25"
          style={{
            background: `radial-gradient(circle, ${track.color.replace(")", " / 0.6)")}, transparent 70%)`,
            transition: "background 1s ease",
            animation: "float-orb 16s ease-in-out infinite",
          }}
        />
        <div
          className="absolute bottom-1/4 right-10 h-72 w-72 rounded-full blur-3xl opacity-20"
          style={{
            background: "radial-gradient(circle, hsl(var(--glow-purple)), transparent 70%)",
            animation: "float-orb 18s ease-in-out infinite reverse",
          }}
        />
      </div>

      <div className="container relative mx-auto max-w-6xl">
        <ScrollReveal className="text-center mb-14">
          <span className="inline-flex items-center gap-2 rounded-full glass border border-glass-border/15 px-3 py-1 text-xs uppercase tracking-wider text-muted-foreground">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-aurora-green opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-aurora-green" />
            </span>
            Live Right Now
          </span>
          <h2 className="mt-5 font-heading text-4xl md:text-5xl font-bold text-gradient">
            The pulse of Aurora
          </h2>
          <p className="mt-4 text-muted-foreground text-base sm:text-lg max-w-xl mx-auto">
            Real-time playback across thousands of communities. Move your cursor
            over the player to feel the depth.
          </p>
        </ScrollReveal>

        <div className="grid gap-6 lg:grid-cols-5 lg:gap-8">
          {/* 3D Now Playing Card */}
          <ScrollReveal className="lg:col-span-3">
            <div style={{ perspective: "1400px" }}>
              <div
                ref={cardRef}
                onMouseMove={handleMove}
                onMouseLeave={handleLeave}
                className="relative overflow-hidden rounded-3xl glass-strong border border-glass-border/15 p-6 sm:p-8 transition-[transform,box-shadow] duration-300 ease-out will-change-transform"
                style={{
                  transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
                  transformStyle: "preserve-3d",
                  boxShadow: `0 30px 80px -30px ${track.color.replace(")", " / 0.4)")}`,
                }}
              >
                {/* Animated gradient backdrop */}
                <div
                  className="pointer-events-none absolute inset-0 opacity-40 transition-all duration-1000"
                  style={{
                    background: `radial-gradient(800px circle at 30% 20%, ${track.color.replace(")", " / 0.25)")}, transparent 60%)`,
                  }}
                />

                <div className="relative flex flex-col sm:flex-row items-center gap-6 sm:gap-8" style={{ transform: "translateZ(40px)" }}>
                  {/* Spinning vinyl */}
                  <div className="relative shrink-0">
                    <div
                      className="absolute -inset-4 rounded-full blur-2xl opacity-50 transition-all duration-1000"
                      style={{ background: track.color }}
                    />
                    <div
                      className="relative h-40 w-40 sm:h-48 sm:w-48 rounded-full overflow-hidden border-2 border-glass-border/20"
                      style={{
                        animation: isPlaying ? "spin 8s linear infinite" : "none",
                        background: `conic-gradient(from 0deg, ${track.color.replace(")", " / 0.3)")}, hsl(var(--background)), ${track.color.replace(")", " / 0.2)")}, hsl(var(--background)))`,
                      }}
                    >
                      {/* Vinyl grooves */}
                      <div className="absolute inset-0 rounded-full" style={{
                        background: "repeating-radial-gradient(circle, transparent 0, transparent 4px, hsl(0 0% 0% / 0.3) 5px, transparent 6px)",
                      }} />
                      {/* Center label */}
                      <div
                        className="absolute inset-1/3 rounded-full flex items-center justify-center border border-glass-border/30"
                        style={{ background: `linear-gradient(135deg, ${track.color.replace(")", " / 0.4)")}, hsl(var(--background)))` }}
                      >
                        <Disc3 className="h-6 w-6" style={{ color: track.color }} />
                      </div>
                    </div>
                  </div>

                  {/* Track info & controls */}
                  <div className="flex-1 w-full text-center sm:text-left">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">
                      Now playing · #music-lounge
                    </p>
                    <h3 className="mt-2 font-heading text-2xl sm:text-3xl font-bold text-foreground transition-all duration-500">
                      {track.title}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {track.artist} · <span className="text-foreground/60">{track.album}</span>
                    </p>

                    {/* Equalizer bars */}
                    <div className="mt-4 flex items-end justify-center sm:justify-start gap-1 h-8">
                      {Array.from({ length: 24 }).map((_, i) => (
                        <span
                          key={i}
                          className="w-1 rounded-full"
                          style={{
                            background: track.color,
                            height: `${20 + Math.sin(i * 0.7) * 30 + 30}%`,
                            animation: isPlaying
                              ? `eq-bounce ${0.6 + (i % 5) * 0.15}s ease-in-out ${i * 0.04}s infinite alternate`
                              : "none",
                            opacity: 0.8,
                          }}
                        />
                      ))}
                    </div>

                    {/* Progress */}
                    <div className="mt-5">
                      <div className="relative h-1.5 rounded-full bg-foreground/10 overflow-hidden">
                        <div
                          className="absolute inset-y-0 left-0 rounded-full transition-all duration-1000 ease-linear"
                          style={{
                            width: `${(progress / track.duration) * 100}%`,
                            background: `linear-gradient(90deg, ${track.color}, hsl(var(--glow-purple)))`,
                            boxShadow: `0 0 12px ${track.color.replace(")", " / 0.6)")}`,
                          }}
                        />
                      </div>
                      <div className="mt-1.5 flex justify-between text-xs font-mono text-muted-foreground">
                        <span>{formatTime(progress)}</span>
                        <span>{formatTime(track.duration)}</span>
                      </div>
                    </div>

                    {/* Controls */}
                    <div className="mt-5 flex items-center justify-center sm:justify-start gap-2">
                      <button
                        onClick={() => setLiked((l) => !l)}
                        aria-label="Like"
                        className="flex h-10 w-10 items-center justify-center rounded-full glass border border-glass-border/15 transition-all hover:scale-110"
                      >
                        <Heart
                          className={`h-4 w-4 transition-colors ${liked ? "fill-current" : ""}`}
                          style={{ color: liked ? track.color : "hsl(var(--muted-foreground))" }}
                        />
                      </button>
                      <button
                        onClick={prev}
                        aria-label="Previous"
                        className="flex h-10 w-10 items-center justify-center rounded-full glass border border-glass-border/15 transition-all hover:scale-110"
                      >
                        <SkipBack className="h-4 w-4 text-foreground" />
                      </button>
                      <button
                        onClick={() => setIsPlaying((p) => !p)}
                        aria-label={isPlaying ? "Pause" : "Play"}
                        className="relative flex h-12 w-12 items-center justify-center rounded-full transition-all hover:scale-110"
                        style={{
                          background: `linear-gradient(135deg, ${track.color}, hsl(var(--glow-purple)))`,
                          boxShadow: `0 0 30px ${track.color.replace(")", " / 0.5)")}`,
                        }}
                      >
                        {isPlaying ? (
                          <Pause className="h-5 w-5 text-background fill-background" />
                        ) : (
                          <Play className="h-5 w-5 text-background fill-background ml-0.5" />
                        )}
                      </button>
                      <button
                        onClick={next}
                        aria-label="Next"
                        className="flex h-10 w-10 items-center justify-center rounded-full glass border border-glass-border/15 transition-all hover:scale-110"
                      >
                        <SkipForward className="h-4 w-4 text-foreground" />
                      </button>
                      <div className="ml-2 hidden sm:flex items-center gap-2 rounded-full glass border border-glass-border/15 px-3 py-2">
                        <Volume2 className="h-3.5 w-3.5 text-muted-foreground" />
                        <div className="h-1 w-16 rounded-full bg-foreground/10 overflow-hidden">
                          <div className="h-full w-3/4 rounded-full" style={{ background: track.color }} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </ScrollReveal>

          {/* Live stats column */}
          <ScrollReveal className="lg:col-span-2">
            <div className="grid gap-4 h-full">
              {liveStats.map(({ icon: Icon, label, value, accent }, i) => (
                <div
                  key={label}
                  className="group relative overflow-hidden rounded-2xl glass border border-glass-border/15 p-5 transition-all duration-300 hover:-translate-y-1 hover:border-glass-border/30"
                  style={{
                    animation: `fade-in 0.5s ease-out ${i * 0.1}s both`,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = `0 20px 50px -20px ${accent.replace(")", " / 0.5)")}`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = "";
                  }}
                >
                  {/* Accent glow */}
                  <div
                    className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full blur-2xl opacity-30 transition-opacity group-hover:opacity-60"
                    style={{ background: accent }}
                  />

                  <div className="relative flex items-center gap-4">
                    <div
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-glass-border/15"
                      style={{ background: `linear-gradient(135deg, ${accent.replace(")", " / 0.2)")}, transparent)` }}
                    >
                      <Icon className="h-5 w-5" style={{ color: accent }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs uppercase tracking-wider text-muted-foreground">
                        {label}
                      </p>
                      <p className="font-heading text-2xl sm:text-3xl font-bold text-foreground tabular-nums">
                        {value}
                      </p>
                    </div>
                    {/* Mini live ticker */}
                    <div className="flex items-end gap-0.5 h-8">
                      {Array.from({ length: 5 }).map((_, j) => (
                        <span
                          key={j}
                          className="w-0.5 rounded-full"
                          style={{
                            background: accent,
                            height: `${30 + (j % 3) * 25}%`,
                            animation: `eq-bounce ${0.7 + j * 0.1}s ease-in-out ${j * 0.08}s infinite alternate`,
                            opacity: 0.7,
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
