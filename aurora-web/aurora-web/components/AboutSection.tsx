import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import ScrollReveal from "./ScrollReveal";
import { Sparkles, Zap, Heart } from "lucide-react";

const storyItems = [
  {
    icon: Sparkles,
    title: "Born from passion",
    text: "Tussi Music was created by music lovers who believed Discord deserved a bot that sounds as good as a dedicated music player.",
  },
  {
    icon: Zap,
    title: "Built for performance",
    text: "Every millisecond matters. We've optimized our audio pipeline for zero-lag, crystal-clear playback across thousands of servers simultaneously.",
  },
  {
    icon: Heart,
    title: "Loved by communities",
    text: "From small friend groups to massive gaming communities — Tussi Music adapts to your server's vibe and keeps the energy flowing.",
  },
];

export default function AboutSection({ settings }: { settings?: any }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  const lineHeight = useTransform(scrollYProgress, [0.1, 0.85], ["0%", "100%"]);

  const aboutTitle = settings?.aboutTitle || "La Historia Detrás de Tussi Music";
  const aboutSubtitle = settings?.aboutSubtitle || "Más que un bot — la mejor forma de disfrutar de la música en comunidad.";

  const storyItems = [
    {
      icon: Sparkles,
      title: settings?.aboutCard1Title || "Nacido de la pasión",
      text: settings?.aboutCard1Text || "Tussi Music fue creado para quienes buscan un bot en Discord con calidad de reproductor profesional.",
    },
    {
      icon: Zap,
      title: settings?.aboutCard2Title || "Máximo rendimiento",
      text: settings?.aboutCard2Text || "Cada milisegundo cuenta. Audio optimizado sin lag, con sonido ultra nítido y disponible 24/7.",
    },
    {
      icon: Heart,
      title: settings?.aboutCard3Title || "La opción favorita de tu servidor",
      text: settings?.aboutCard3Text || "Desde servidores de amigos hasta grandes comunidades gaming — Tussi Music se adapta al ambiente de tu servidor.",
    },
  ];

  return (
    <section id="about" className="py-32 px-6" ref={containerRef}>
      <div className="container mx-auto max-w-4xl">
        <ScrollReveal className="text-center mb-20">
          <h2 className="font-heading text-4xl md:text-5xl font-bold text-gradient mb-4">
            {aboutTitle}
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            {aboutSubtitle}
          </p>
        </ScrollReveal>

        <div className="relative">
          {/* Animated timeline line */}
          <div className="absolute left-6 md:left-1/2 top-0 bottom-0 w-px bg-border/30 md:-translate-x-px">
            <motion.div
              className="w-full bg-gradient-to-b from-aurora-green via-aurora-blue to-aurora-purple rounded-full"
              style={{ height: lineHeight }}
            />
          </div>

          <div className="space-y-24">
            {storyItems.map((item, i) => {
              const isLeft = i % 2 === 0;
              return (
                <ScrollReveal key={item.title} delay={0.1}>
                  <div className={`relative flex items-start gap-8 ${isLeft ? "md:flex-row" : "md:flex-row-reverse"} flex-row`}>
                    {/* Dot on timeline */}
                    <div className="absolute left-6 md:left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-aurora-green glow-green z-10 mt-2" />

                    {/* Content card */}
                    <div className={`ml-14 md:ml-0 md:w-[calc(50%-2rem)] ${isLeft ? "md:pr-8 md:text-right" : "md:pl-8 md:text-left"}`}>
                      <div className="glass rounded-2xl p-6 hover:border-aurora-green/20 transition-all duration-300">
                        <div className={`flex items-center gap-3 mb-3 ${isLeft ? "md:justify-end" : ""}`}>
                          <div className="w-10 h-10 rounded-xl bg-aurora-green/10 flex items-center justify-center">
                            <item.icon className="h-5 w-5 text-aurora-green" />
                          </div>
                          <h3 className="font-heading text-lg font-semibold text-foreground">{item.title}</h3>
                        </div>
                        <p className="text-muted-foreground text-sm leading-relaxed">{item.text}</p>
                      </div>
                    </div>
                  </div>
                </ScrollReveal>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
