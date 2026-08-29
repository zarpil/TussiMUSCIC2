import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import ScrollReveal from "./ScrollReveal";
import { ExternalLink, MessageCircle, Users } from "lucide-react";

export default function DiscordJoinSection({ settings }: { settings?: any }) {
  const joinTitle = settings?.joinTitle || "Tussi Music Community";
  const joinSubtitle = settings?.joinSubtitle || "Get support, suggest features, stay updated, and hang out with thousands of music lovers on our Discord server.";
  const supportServerUrl = settings?.supportServerUrl || "https://discord.gg/zTTMRnU9G";
  const botInviteUrl = settings?.botInviteUrl || "https://discord.com/oauth2/authorize?client_id=1310246126712127508&scope=bot&permissions=2151017536";

  return (
    <section className="py-32 px-6">
      <div className="container mx-auto max-w-3xl">
        <ScrollReveal>
          <div className="glass-strong rounded-3xl p-10 md:p-16 text-center relative overflow-hidden">
            {/* Background glow */}
            <div
              className="absolute inset-0 opacity-15 pointer-events-none"
              style={{
                background:
                  "radial-gradient(ellipse at 30% 50%, hsl(155 80% 50% / 0.4), transparent 60%), radial-gradient(ellipse at 70% 50%, hsl(270 60% 60% / 0.3), transparent 60%)",
              }}
            />

            <div className="relative z-10">
              <div className="flex justify-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-aurora-green/10 flex items-center justify-center">
                  <MessageCircle className="h-6 w-6 text-aurora-green" />
                </div>
                <div className="w-12 h-12 rounded-2xl bg-aurora-purple/10 flex items-center justify-center">
                  <Users className="h-6 w-6 text-aurora-purple" />
                </div>
              </div>

              <h2 className="font-heading text-3xl md:text-5xl font-bold mb-4">
                <span className="text-foreground">Forma parte de </span>
                <span className="text-gradient">{joinTitle}</span>
              </h2>
              <p className="text-muted-foreground text-base md:text-lg mb-10 max-w-lg mx-auto leading-relaxed">
                {joinSubtitle}
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
                  <Button
                    size="lg"
                    className="bg-[#5865F2] hover:bg-[#4752C4] text-foreground font-semibold px-8 h-12 text-base rounded-full shadow-[0_0_25px_rgba(88,101,242,0.35)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5865F2] focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    onClick={() => window.open(supportServerUrl, "_blank")}
                  >
                    <ExternalLink className="mr-2 h-5 w-5" />
                    Entrar al Servidor de Discord
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
                  <Button
                    size="lg"
                    className="bg-black hover:bg-gray-900 text-foreground font-semibold px-8 h-12 text-base rounded-full shadow-[0_0_25px_rgba(88,101,242,0.35)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5865F2] focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    onClick={() => window.open(botInviteUrl, "_blank")}
                  >
                    <ExternalLink className="mr-2 h-5 w-5" />
                    Añadir a mi Servidor
                  </Button>
                </motion.div>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
