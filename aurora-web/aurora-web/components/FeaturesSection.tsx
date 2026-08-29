import { Card, CardContent } from "@/components/ui/card";
import { Headphones, Globe, SlidersHorizontal, LayoutDashboard } from "lucide-react";
import ScrollReveal from "./ScrollReveal";

const features = [
  { icon: Headphones, title: "High-Fidelity Audio", desc: "Crystal clear streaming with lossless quality support." },
  { icon: Globe, title: "24/7 Playback", desc: "The music never stops. Always on, always ready." },
  { icon: SlidersHorizontal, title: "Audio Filters", desc: "Bassboost, nightcore, 8D, and many more effects." },
  { icon: LayoutDashboard, title: "Web Dashboard", desc: "Manage queues and settings from any browser." },
];

export default function FeaturesSection({ settings }: { settings?: any }) {
  const featuresTitle = settings?.featuresTitle || "¿Por qué elegir Tussi Music?";
  const featuresSubtitle = settings?.featuresSubtitle || "Todo lo que necesitas para la mejor experiencia musical en Discord.";

  const features = [
    { 
      icon: Headphones, 
      title: settings?.feature1Title || "Audio de Alta Fidelidad", 
      desc: settings?.feature1Desc || "Streaming nítido y de calidad superior sin pérdidas." 
    },
    { 
      icon: Globe, 
      title: settings?.feature2Title || "Reproducción 24/7", 
      desc: settings?.feature2Desc || "La música nunca se detiene. Siempre activo y listo en tu canal de voz." 
    },
    { 
      icon: SlidersHorizontal, 
      title: settings?.feature3Title || "Filtros de Audio", 
      desc: settings?.feature3Desc || "Bassboost, nightcore, 8D, karaoke, ecualizador y más efectos." 
    },
    { 
      icon: LayoutDashboard, 
      title: settings?.feature4Title || "Panel Web en Directo", 
      desc: settings?.feature4Desc || "Gestiona la cola, letras sincronizadas y reproducción en tiempo real desde el navegador." 
    },
  ];

  return (
    <section id="features" className="py-32 px-6">
      <div className="container mx-auto max-w-5xl">
        <ScrollReveal className="text-center mb-16">
          <h2 className="font-heading text-4xl md:text-5xl font-bold text-gradient mb-4">
            {featuresTitle}
          </h2>
          <p className="text-muted-foreground text-lg">{featuresSubtitle}</p>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((f, i) => (
            <ScrollReveal key={f.title} delay={i * 0.1}>
              <Card className="glass group hover:border-aurora-green/30 transition-all duration-300 hover:glow-green">
                <CardContent className="p-8 flex gap-5">
                  <div className="shrink-0 w-12 h-12 rounded-lg bg-aurora-green/10 flex items-center justify-center group-hover:bg-aurora-green/20 transition-colors">
                    <f.icon className="h-6 w-6 text-aurora-green" />
                  </div>
                  <div>
                    <h3 className="font-heading text-lg font-semibold text-foreground mb-1">{f.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
                  </div>
                </CardContent>
              </Card>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
