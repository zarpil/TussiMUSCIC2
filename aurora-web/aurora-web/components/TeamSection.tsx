import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import ScrollReveal from "./ScrollReveal";
import { useEffect, useState } from "react";

export default function TeamSection({ settings }: { settings?: any }) {
  const [avatars, setAvatars] = useState<Record<string, string>>({});

  const teamTitle = settings?.teamTitle || "Meet the Team";
  const teamSubtitle = settings?.teamSubtitle || "The passionate developers behind Aurora Music.";

  const team = [
    {
      name: settings?.teamMember1Name || "Saravanan",
      role: settings?.teamMember1Role || "Lead Developer",
      userId: settings?.teamMember1DiscordId || "775429424979378216",
      bio: settings?.teamMember1Bio || "Building the future of Discord music bots.",
      customAvatar: settings?.teamMember1Avatar || ""
    },
    {
      name: settings?.teamMember2Name || "Zilm",
      role: settings?.teamMember2Role || "Core Developer",
      userId: settings?.teamMember2DiscordId || "775015391487197206",
      bio: settings?.teamMember2Bio || "Crafting seamless audio experiences.",
      customAvatar: settings?.teamMember2Avatar || ""
    }
  ];

  useEffect(() => {
    // Fetch avatars directly from Discord CDN with fallback
    const fetchAvatars = async () => {
      const avatarMap: Record<string, string> = {};
      
      for (const member of team) {
        if (member.customAvatar) {
          avatarMap[member.userId] = member.customAvatar;
          continue;
        }

        try {
          const response = await fetch(`/api/discord/avatar/${member.userId}`);
          if (response.ok) {
            avatarMap[member.userId] = response.url;
          } else {
            const discriminator = parseInt(member.userId.slice(-4) || '0') % 5;
            avatarMap[member.userId] = `https://cdn.discordapp.com/embed/avatars/${discriminator}.png`;
          }
        } catch (error) {
          console.error(`Error fetching avatar for ${member.name}:`, error);
          const discriminator = parseInt(member.userId.slice(-4) || '0') % 5;
          avatarMap[member.userId] = `https://cdn.discordapp.com/embed/avatars/${discriminator}.png`;
        }
      }
      
      setAvatars(avatarMap);
    };

    fetchAvatars();
  }, [settings]);

  return (
    <section id="team" className="py-32 px-6">
      <div className="container mx-auto max-w-5xl">
        <ScrollReveal className="text-center mb-16">
          <h2 className="font-heading text-4xl md:text-5xl font-bold text-gradient mb-4">
            {teamTitle}
          </h2>
          <p className="text-muted-foreground text-lg">
            {teamSubtitle}
          </p>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          {team.map((member, i) => (
            <ScrollReveal key={member.userId} delay={i * 0.15}>
              <Card className="glass group hover:border-aurora-green/30 transition-all duration-300">
                <CardContent className="p-8 text-center">
                  <Avatar className="w-24 h-24 mx-auto mb-4 ring-2 ring-aurora-green/20 group-hover:ring-aurora-green/40 transition-all">
                    <AvatarImage 
                      src={avatars[member.userId] || `https://cdn.discordapp.com/embed/avatars/${parseInt(member.userId.slice(-4)) % 5}.png`}
                      alt={member.name}
                    />
                    <AvatarFallback className="bg-aurora-green/10 text-aurora-green text-2xl font-bold">
                      {member.name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <h3 className="font-heading text-xl font-semibold text-foreground mb-1">
                    {member.name}
                  </h3>
                  <p className="text-aurora-green text-sm font-medium mb-3">
                    {member.role}
                  </p>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {member.bio}
                  </p>
                </CardContent>
              </Card>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
