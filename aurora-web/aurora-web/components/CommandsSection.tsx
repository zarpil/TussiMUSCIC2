import { useState, useRef, MouseEvent } from "react";
import {
  Play,
  SkipForward,
  ListMusic,
  Sliders,
  Repeat,
  Volume2,
  Shuffle,
  Pause,
  Search,
  Heart,
} from "lucide-react";
import ScrollReveal from "./ScrollReveal";

const commands = [
  {
    cmd: "/play",
    desc: "Reproduce una canción o lista desde cualquier enlace o búsqueda.",
    icon: Play,
    example: "/play bad bunny ojitos lindos",
    color: "hsl(var(--glow-green))",
  },
  {
    cmd: "/skip",
    desc: "Salta a la siguiente canción de la cola al instante.",
    icon: SkipForward,
    example: "/skip",
    color: "hsl(var(--glow-blue))",
  },
  {
    cmd: "/listqueue",
    desc: "Consulta y gestiona la cola de reproducción actual.",
    icon: ListMusic,
    example: "/listqueue",
    color: "hsl(var(--glow-purple))",
  },
  {
    cmd: "/repeat",
    desc: "Activa el bucle para la canción actual o toda la cola.",
    icon: Repeat,
    example: "/repeat",
    color: "hsl(var(--glow-green))",
  },
  {
    cmd: "/volume",
    desc: "Ajusta el volumen de reproducción del bot de 0 a 100%.",
    icon: Volume2,
    example: "/volume 75",
    color: "hsl(var(--glow-blue))",
  },
  {
    cmd: "/shuffle",
    desc: "Mezcla aleatoriamente las canciones en la cola.",
    icon: Shuffle,
    example: "/shuffle",
    color: "hsl(var(--glow-purple))",
  },
  {
    cmd: "/pause",
    desc: "Pausa la música en cualquier momento.",
    icon: Pause,
    example: "/pause",
    color: "hsl(var(--glow-green))",
  },
  {
    cmd: "/resume",
    desc: "Reanuda la reproducción pausada.",
    icon: Play,
    example: "/resume",
    color: "hsl(var(--glow-blue))",
  },
  {
    cmd: "/stop",
    desc: "Detiene la música y vacía la cola del reproductor.",
    icon: Pause,
    example: "/stop",
    color: "hsl(var(--glow-purple))",
  },
  {
    cmd: "/autoplay",
    desc: "Activa la reproducción automática de canciones relacionadas.",
    icon: Shuffle,
    example: "/autoplay",
    color: "hsl(var(--glow-green))",
  },
];

type Command = (typeof commands)[number];

function CommandCard({ command, index }: { command: Command; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState<string>("");
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
    setTransform("perspective(900px) rotateX(0) rotateY(0) translateZ(0)");
    setGlow(null);
  };

  return (
    <div
      className="group relative animate-fade-in"
      style={{
        animationDelay: `${index * 60}ms`,
        animationFillMode: "both",
        perspective: "1200px",
      }}
    >
      <div
        ref={ref}
        onMouseMove={handleMove}
        onMouseLeave={handleLeave}
        className="relative h-full rounded-2xl glass border border-glass-border/15 p-5 transition-[transform,box-shadow,border-color] duration-300 ease-out will-change-transform"
        style={{
          transform: transform || "perspective(900px) rotateX(0) rotateY(0)",
          transformStyle: "preserve-3d",
          borderColor: glow ? `${command.color.replace(")", " / 0.4)")}` : undefined,
          boxShadow: glow
            ? `0 20px 60px -20px ${command.color.replace(")", " / 0.45)")}, 0 0 40px ${command.color.replace(")", " / 0.15)")}`
            : undefined,
        }}
      >
        {/* Cursor-follow glow */}
        {glow && (
          <div
            className="pointer-events-none absolute inset-0 rounded-2xl opacity-60 transition-opacity"
            style={{
              background: `radial-gradient(220px circle at ${glow.x}px ${glow.y}px, ${command.color.replace(")", " / 0.18)")}, transparent 70%)`,
            }}
          />
        )}

        {/* Icon */}
        <div
          className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-glass-border/15"
          style={{
            background: `linear-gradient(135deg, ${command.color.replace(")", " / 0.18)")}, transparent)`,
            transform: "translateZ(40px)",
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
        <div className="mt-5" style={{ transform: "translateZ(30px)" }}>
          <code
            className="font-mono text-lg font-semibold transition-colors"
            style={{ color: command.color }}
          >
            {command.cmd}
          </code>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            {command.desc}
          </p>
        </div>

        {/* Example pill */}
        <div
          className="mt-5 flex items-center gap-2 rounded-lg border border-glass-border/10 bg-background/40 px-3 py-2 font-mono text-xs text-muted-foreground/80 backdrop-blur"
          style={{ transform: "translateZ(20px)" }}
        >
          <span className="text-foreground/40">›</span>
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

export default function CommandsSection() {
  return (
    <section id="commands" className="relative py-24 sm:py-32 px-4 sm:px-6 overflow-hidden">
      {/* Ambient glows */}
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute top-1/4 -left-20 h-72 w-72 rounded-full blur-3xl opacity-20"
          style={{
            background: "radial-gradient(circle, hsl(var(--glow-green)), transparent 70%)",
            animation: "float-orb 14s ease-in-out infinite",
          }}
        />
        <div
          className="absolute bottom-1/4 -right-20 h-80 w-80 rounded-full blur-3xl opacity-20"
          style={{
            background: "radial-gradient(circle, hsl(var(--glow-purple)), transparent 70%)",
            animation: "float-orb 16s ease-in-out infinite reverse",
          }}
        />
      </div>

      <div className="container relative mx-auto max-w-6xl">
        <ScrollReveal className="text-center mb-14 sm:mb-20">
          <span className="inline-flex items-center gap-2 rounded-full glass border border-glass-border/15 px-3 py-1 text-xs uppercase tracking-wider text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-aurora-green animate-pulse" />
            Comandos Slash
          </span>
          <h2 className="mt-5 font-heading text-4xl md:text-5xl font-bold text-gradient">
            Un comando para cada ocasión
          </h2>
          <p className="mt-4 text-muted-foreground text-base sm:text-lg max-w-xl mx-auto">
            Comandos rápidos y fluidos diseñados para controlar tu música con facilidad desde cualquier canal de Discord.
          </p>
        </ScrollReveal>

        <ScrollReveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {commands.map((c, i) => (
              <CommandCard key={c.cmd} command={c} index={i} />
            ))}
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
