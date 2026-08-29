import {SlashCommandBuilder,PermissionFlagsBits} from "discord.js";

export const invitecmd = new SlashCommandBuilder()
  .setName("generate-invite")
  .setDescription(" get invite link")
  .addStringOption((s) =>s
  .setName("guild").setDescription("guild id").setRequired(true)
  )
export async function CreateInvite(client,interaction)
{
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
    return interaction.reply({
      content: "❌ Admins only.",
      ephemeral: true
    });
  }
 await interaction.deferReply();
const guildId = interaction.options.getString("guild"); // your guild ID
  const guild = client.guilds.cache.get(guildId);

  if (!guild) {
    await interaction.editReply({content:"❌ Bot is not in this guild"})
    return;
  }

  const channel = guild.channels.cache.find(
    c =>
      c.isTextBased() &&
      c.permissionsFor(guild.members.me)?.has("CreateInstantInvite")
  );

  if (!channel) {
      await interaction.editReply({content:"❌ No channel with invite permission"})
    return;
  }

  const invite = await channel.createInvite({
    maxAge: 0, // never expire
    maxUses: 0, // unlimited uses
    unique: true
  });
    await interaction.editReply({content:`🔗 Invite link: https://discord.gg/${invite.code}`})

}