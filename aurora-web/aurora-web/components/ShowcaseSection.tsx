import { Card, CardContent } from "@/components/ui/card";
import ScrollReveal from "./ScrollReveal";
import {
  Headphones,
  Zap,
  Sliders,
  Shield,
  Music2,
  Globe,
  Smartphone,
  Palette,
} from "lucide-react";

const platformIcons: Record<string, React.ReactNode> = {
  Spotify: (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
    </svg>
  ),
  "Apple Music": (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
      <path d="M23.994 6.124a9.23 9.23 0 00-.24-2.19c-.317-1.31-1.062-2.31-2.18-3.043a5.022 5.022 0 00-1.877-.726 10.496 10.496 0 00-1.564-.15c-.04-.003-.083-.01-.124-.013H5.986c-.152.01-.303.017-.455.026-.747.043-1.49.123-2.193.4-1.336.53-2.3 1.452-2.865 2.78-.192.448-.292.925-.363 1.408-.056.392-.088.785-.1 1.18 0 .032-.007.062-.01.093v12.223c.01.14.017.283.027.424.05.815.154 1.624.497 2.373.65 1.42 1.738 2.353 3.234 2.801.42.127.856.187 1.293.228.555.053 1.11.06 1.667.06h11.03a12.5 12.5 0 001.57-.1c.822-.106 1.596-.35 2.295-.81a5.046 5.046 0 001.88-2.207c.186-.42.293-.87.37-1.324.113-.675.138-1.358.137-2.04-.002-3.8 0-7.595-.003-11.393zm-6.423 3.99v5.712c0 .417-.058.827-.244 1.206-.29.59-.76.962-1.388 1.14-.35.1-.706.157-1.07.173-.95.042-1.8-.6-1.965-1.483-.18-.965.46-1.97 1.553-2.152.37-.06.748-.107 1.105-.207.262-.072.378-.252.398-.53.012-.163.004-.328.004-.492V9.562c0-.27-.07-.35-.34-.288l-4.473 1.08c-.217.052-.3.157-.31.378-.005.095 0 .19 0 .286v6.781c0 .4-.048.795-.217 1.162-.283.618-.77 1.017-1.42 1.197-.34.093-.69.15-1.04.17-.968.054-1.827-.573-2.003-1.463-.19-.96.434-1.983 1.555-2.18.377-.065.763-.112 1.13-.215.254-.07.372-.24.393-.505.008-.1.003-.2.003-.3V8.048c0-.374.104-.535.467-.625l5.834-1.422c.264-.064.537-.1.808-.092.338.01.49.177.5.516.003.087 0 .174 0 .262v3.428z"/>
    </svg>
  ),
  SoundCloud: (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
      <path d="M1.175 12.225c-.051 0-.094.046-.101.1l-.233 2.154.233 2.105c.007.058.05.098.101.098.05 0 .09-.04.099-.098l.255-2.105-.27-2.154c-.01-.057-.05-.1-.1-.1m-.899.828c-.06 0-.091.037-.104.094L0 14.479l.172 1.308c.013.06.045.094.104.094.057 0 .09-.038.104-.094l.199-1.308-.2-1.332c-.015-.057-.047-.094-.104-.094m1.8-1.07c-.066 0-.12.058-.12.127l-.2 2.37.2 2.278c0 .068.054.127.12.127.064 0 .119-.06.12-.127l.227-2.278-.228-2.37c0-.07-.056-.127-.12-.127m.947-.166c-.078 0-.14.07-.14.15L2.6 14.48l.27 2.306c0 .08.062.15.14.15.076 0 .138-.07.14-.15l.3-2.306-.3-2.64c-.003-.08-.065-.15-.14-.15m1.014.168c-.09 0-.158.08-.16.17l-.234 2.475.234 2.283c.002.09.07.168.16.168.087 0 .157-.08.16-.17l.264-2.281-.264-2.475c-.003-.09-.073-.17-.16-.17m.86-.8c-.098 0-.173.09-.176.186L4.43 14.48l.263 2.222c.004.1.08.188.177.188.097 0 .174-.09.177-.188l.3-2.222-.3-2.797c-.003-.098-.08-.186-.177-.186m1.032-.468c-.107 0-.191.098-.194.204l-.24 3.063.24 2.155c.003.108.087.204.194.204.106 0 .19-.096.194-.204l.27-2.155-.27-3.063c-.004-.106-.088-.204-.194-.204m.96.105c-.12 0-.21.11-.212.224l-.225 2.93.225 2.112c.003.115.093.222.213.222.12 0 .209-.107.212-.222l.254-2.112-.254-2.93c-.003-.114-.093-.224-.213-.224m1.015-.463c-.13 0-.226.12-.228.243l-.213 3.287.213 2.074c.002.123.098.242.228.242.13 0 .226-.12.228-.242l.242-2.074-.242-3.287c-.002-.123-.098-.243-.228-.243m.985-.251c-.14 0-.24.13-.243.26l-.2 3.423.2 2.03c.003.132.102.26.243.26.14 0 .24-.128.242-.26l.226-2.03-.226-3.424c-.003-.13-.103-.26-.243-.26m1.05.197c-.15 0-.26.14-.262.277l-.167 3.15.167 1.98c.003.138.112.277.262.277.148 0 .258-.14.26-.277l.19-1.98-.19-3.15c-.002-.137-.11-.276-.26-.276m.987-.443c-.16 0-.275.15-.277.295L11.65 14.48l.162 1.93c.002.148.117.295.277.295.16 0 .275-.148.278-.296l.183-1.93-.183-3.575c-.003-.147-.118-.295-.278-.295m1.083.258c-.17 0-.295.16-.297.312l-.135 3.003.135 1.872c.002.157.127.313.297.313.168 0 .293-.156.296-.313l.153-1.872-.153-3.003c-.003-.154-.128-.312-.296-.312m2.22 2.857c-.202 0-.387.058-.557.156a3.013 3.013 0 00-3.005-2.847c-.22 0-.435.03-.645.083-.128.032-.17.078-.17.157v5.602c.002.082.065.15.148.158h4.23a1.727 1.727 0 001.727-1.728 1.727 1.727 0 00-1.727-1.728"/>
    </svg>
  ),
  YouTube: (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
  ),
  Deezer: (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
      <path d="M18.81 4.16v3.03H24V4.16h-5.19zM6.27 8.38v3.027h5.189V8.38H6.27zm12.54 0v3.027H24V8.38h-5.19zM6.27 12.594v3.027h5.189v-3.027H6.27zm6.27 0v3.027h5.19v-3.027h-5.19zm6.27 0v3.027H24v-3.027h-5.19zM0 16.81v3.029h5.19v-3.03H0zm6.27 0v3.029h5.189v-3.03H6.27zm6.27 0v3.029h5.19v-3.03h-5.19zm6.27 0v3.029H24v-3.03h-5.19z"/>
    </svg>
  ),
  Tidal: (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
      <path d="M12.012 3.992L8.008 7.996 4.004 3.992 0 7.996 4.004 12l4.004-4.004L12.012 12l4.004-4.004L12.012 3.992zM16.016 7.996l4.004 4.004L24.024 7.996 20.02 3.992 16.016 7.996z"/>
    </svg>
  ),
};

const platforms = [
  { name: "Spotify", color: "#1DB954" },
  { name: "Apple Music", color: "#FC3C44" },
  { name: "SoundCloud", color: "#FF5500" },
  { name: "YouTube", color: "#FF0000" },
  { name: "Deezer", color: "#A238FF" },
  { name: "Tidal", color: "#00FFFF" },
];

const showcaseCards = [
  {
    icon: Headphones,
    accent: "aurora-green",
    title: "Studio-Grade Audio",
    subtitle: "Audio Quality",
    points: [
      "Lossless 320kbps streaming",
      "24/7 uninterrupted playback",
      "Custom filters — bassboost, nightcore, 8D, vaporwave",
      "Volume normalization across tracks",
    ],
  },
  {
    icon: Zap,
    accent: "aurora-blue",
    title: "Effortless Controls",
    subtitle: "Ease of Use",
    points: [
      "Modern slash commands with autocomplete",
      "Interactive UI buttons on every player embed",
      "Smart autoplay when the queue runs out",
      "Natural-language song search",
    ],
  },
  {
    icon: Palette,
    accent: "aurora-purple",
    title: "Your Server, Your Rules",
    subtitle: "Customization",
    points: [
      "Custom DJ roles & permission tiers",
      "Per-server default volume & filters",
      "Multi-language support (15+ languages)",
      "Configurable prefix & command aliases",
    ],
  },
];

function PlatformPill({ name, color }: { name: string; color: string }) {
  const icon = platformIcons[name];
  return (
    <div
      className="flex items-center gap-2.5 px-4 py-2.5 rounded-full glass border border-glass-border/10 transition-all duration-300 group cursor-default hover:scale-105"
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = `${color}55`;
        e.currentTarget.style.boxShadow = `0 0 20px ${color}30, 0 0 40px ${color}15, inset 0 0 12px ${color}10`;
        e.currentTarget.style.backgroundColor = `${color}0A`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = '';
        e.currentTarget.style.boxShadow = '';
        e.currentTarget.style.backgroundColor = '';
      }}
    >
      <div
        className="shrink-0 transition-all duration-300 opacity-50 group-hover:opacity-100 group-hover:scale-110 group-hover:drop-shadow-[0_0_6px_var(--c)]"
        style={{ color, "--c": `${color}88` } as React.CSSProperties}
      >
        {icon}
      </div>
      <span
        className="text-sm font-medium text-muted-foreground transition-colors duration-300"
        ref={(el) => {
          if (!el) return;
          const parent = el.closest('.group');
          parent?.addEventListener('mouseenter', () => { el.style.color = color; });
          parent?.addEventListener('mouseleave', () => { el.style.color = ''; });
        }}
      >
        {name}
      </span>
    </div>
  );
}

function AccentIcon({ icon: Icon, accent }: { icon: typeof Headphones; accent: string }) {
  const colorMap: Record<string, string> = {
    "aurora-green": "bg-aurora-green/10 text-aurora-green group-hover:bg-aurora-green/20",
    "aurora-blue": "bg-aurora-blue/10 text-aurora-blue group-hover:bg-aurora-blue/20",
    "aurora-purple": "bg-aurora-purple/10 text-aurora-purple group-hover:bg-aurora-purple/20",
  };
  return (
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${colorMap[accent]}`}>
      <Icon className="h-6 w-6" />
    </div>
  );
}

function GlowBorder({ accent }: { accent: string }) {
  const glowMap: Record<string, string> = {
    "aurora-green": "hover:border-aurora-green/25 hover:shadow-[0_0_30px_hsl(155_80%_50%/0.08)]",
    "aurora-blue": "hover:border-aurora-blue/25 hover:shadow-[0_0_30px_hsl(200_80%_55%/0.08)]",
    "aurora-purple": "hover:border-aurora-purple/25 hover:shadow-[0_0_30px_hsl(270_60%_60%/0.08)]",
  };
  return glowMap[accent] || "";
}

export default function ShowcaseSection() {
  return (
    <section id="showcase" className="py-24 md:py-32 px-4 sm:px-6">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <ScrollReveal className="text-center mb-16 md:mb-20">
          <p className="text-sm font-medium tracking-[0.2em] uppercase text-aurora-green/70 mb-4">
            Why Aurora?
          </p>
          <h2 className="font-heading text-3xl sm:text-4xl md:text-5xl font-bold text-gradient mb-5">
            Everything Your Server Needs
          </h2>
          <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
            One bot to replace them all. Premium audio, total customization,
            and seamless controls — all free.
          </p>
        </ScrollReveal>

        {/* Supported Platforms */}
        <ScrollReveal className="mb-16 md:mb-20">
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass border border-glass-border/10 mb-4">
              <Globe className="h-4 w-4 text-aurora-blue" />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Supported Platforms
              </span>
            </div>
            <p className="text-muted-foreground text-sm">
              Play from all your favorite sources — no compromises.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {platforms.map((p) => (
              <PlatformPill key={p.name} {...p} />
            ))}
          </div>
        </ScrollReveal>

        {/* Feature Cards — bento grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {showcaseCards.map((card, i) => (
            <ScrollReveal key={card.title} delay={i * 0.12}>
              <Card
                className={`glass group h-full transition-all duration-500 ${GlowBorder({ accent: card.accent })}`}
              >
                <CardContent className="p-6 md:p-8 flex flex-col h-full">
                  <div className="flex items-center gap-4 mb-5">
                    <AccentIcon icon={card.icon} accent={card.accent} />
                    <div>
                      <p className="text-xs font-medium text-muted-foreground/60 uppercase tracking-wider mb-0.5">
                        {card.subtitle}
                      </p>
                      <h3 className="font-heading text-lg font-semibold text-foreground">
                        {card.title}
                      </h3>
                    </div>
                  </div>

                  <ul className="space-y-3 flex-1">
                    {card.points.map((point) => (
                      <li key={point} className="flex items-start gap-3">
                        <span
                          className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${
                            card.accent === "aurora-green"
                              ? "bg-aurora-green/60"
                              : card.accent === "aurora-blue"
                              ? "bg-aurora-blue/60"
                              : "bg-aurora-purple/60"
                          }`}
                        />
                        <span className="text-sm text-muted-foreground leading-relaxed">
                          {point}
                        </span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </ScrollReveal>
          ))}
        </div>

        {/* Bottom trust bar */}
        <ScrollReveal className="mt-14 md:mt-16">
          <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10 text-muted-foreground/50">
            {[
              { icon: Shield, label: "99.9% Uptime" },
              { icon: Music2, label: "5M+ Tracks Played" },
              { icon: Smartphone, label: "Web Dashboard" },
              { icon: Sliders, label: "20+ Audio Filters" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider">
                <item.icon className="h-3.5 w-3.5" />
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
