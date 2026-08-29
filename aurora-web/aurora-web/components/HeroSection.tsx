import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ExternalLink, LogIn } from "lucide-react";

export default function HeroSection({ settings }: { settings?: any }) {
  const siteName = settings?.siteName || "TUSSI MUSIC";
  const heroSubtitle = settings?.heroSubtitle || "La mejor experiencia musical en Discord";
  const heroTitleLine1 = settings?.heroTitleLine1 || "Vive la Música";
  const heroTitleLine2 = settings?.heroTitleLine2 || "Con Tussi Music.";
  const heroDescription = settings?.heroDescription || "Música en alta fidelidad para tu servidor de Discord. Deja que el ritmo fluya con sonido nítido y vibrante.";
  const botInviteUrl = settings?.botInviteUrl || "https://discord.com/oauth2/authorize?client_id=1310246126712127508&scope=bot&permissions=2151017536";

  return (
    <section className="relative min-h-screen flex items-center justify-center px-6 pt-20 overflow-hidden">
      {/* Giant translucent backdrop wordmark */}
      <motion.div
        aria-hidden
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.4, ease: "easeOut" }}
        className="pointer-events-none absolute inset-0 flex items-center justify-center z-0 select-none"
        style={{ perspective: 1200 }}
      >
        <motion.span
          animate={{
            rotateX: [4, -4, 4],
            rotateY: [-6, 6, -6],
            y: [0, -8, 0],
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          className="font-heading font-black uppercase whitespace-nowrap tracking-[-0.02em] leading-none text-[20vw] md:text-[16vw]"
          style={{
            transformStyle: "preserve-3d",
            background:
              "linear-gradient(120deg, hsl(330 90% 60% / 0.2), hsl(300 80% 60% / 0.25), hsl(270 70% 65% / 0.2))",
            backgroundSize: "200% 100%",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            WebkitTextFillColor: "transparent",
            WebkitTextStroke: "1px hsl(0 0% 100% / 0.08)",
            filter: "blur(0.5px)",
            animation: "aurora-flow 10s linear infinite",
          }}
        >
          {siteName.toUpperCase()}
        </motion.span>
      </motion.div>


      <div className="text-center max-w-4xl mx-auto relative z-10">
        {/* Ambient glow behind text */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full opacity-25 blur-[100px] pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse, hsl(330 90% 60% / 0.5), hsl(280 75% 65% / 0.35), transparent 70%)",
          }}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: "easeOut" }}
        >
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-sm md:text-base font-medium tracking-[0.2em] uppercase text-aurora-green/80 mb-6"
          >
            {heroSubtitle}
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.35 }}
            className="font-heading text-5xl sm:text-6xl md:text-8xl font-bold leading-[0.95] tracking-tight mb-8"
          >
            <span className="block text-foreground/90">{heroTitleLine1}</span>
            <span className="block text-gradient mt-1">{heroTitleLine2}</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.55 }}
            className="text-base md:text-lg text-muted-foreground/80 mb-12 max-w-xl mx-auto leading-relaxed"
          >
            {heroDescription}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.75 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Button
              size="lg"
              className=" inline-flex items-center justify-center gap-2 border border-glass-border/15 text-foreground/80 hover:text-foreground hover:bg-black 0 h-12 text-base rounded-full px-8 font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aurora-green focus-visible:ring-offset-2 focus-visible:ring-offset-background cursor-pointer"
              onClick={() => window.open(botInviteUrl, "_blank")}
            >
              <ExternalLink className="mr-2 h-5 w-5" />
              Añadir a Discord
            </Button>
            <button
              onClick={() => {
                console.log('Dashboard Login clicked');
                window.location.href = '/api/auth/discord';
              }}
              className="inline-flex items-center justify-center gap-2 border border-glass-border/15 text-foreground/80 hover:text-foreground hover:bg-black h-12 text-base rounded-full px-8 font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aurora-green focus-visible:ring-offset-2 focus-visible:ring-offset-background cursor-pointer"
            >
              <LogIn className="h-5 w-5" />
              Entrar al Panel
            </button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
