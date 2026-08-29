import { SlashCommandBuilder, PermissionFlagsBits, MessageFlags, ContainerBuilder, TextDisplayBuilder } from 'discord.js';
import GuildConfig from '../../models/Guild.js';
import { tick_emoji, cross_emoji } from '../../emoji/emoji.js';
import 'dotenv/config';

export const weblinkcmd = new SlashCommandBuilder()
  .setName('web-link')
  .setDescription('Vincula este canal para recibir notificaciones del panel web')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild);

export default async function weblink_execute(client, interaction) {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });
  let container = new ContainerBuilder();
  
  try {
    const guildId = interaction.guild.id;
    const channelId = interaction.channel.id;

    let guildConfig = await GuildConfig.findOne({ guildId });

    if (!guildConfig) {
      guildConfig = new GuildConfig({
        guildId,
        boundChannelId: channelId
      });
    } else {
      guildConfig.boundChannelId = channelId;
    }

    await guildConfig.save();

    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `${tick_emoji} **¡Panel Web Vinculado!**\n\nEste canal (<#${channelId}>) ahora recibirá notificaciones cuando los usuarios controlen el reproductor desde el panel web de Tussi Music.\n\n🌐 Panel: ${process.env.WEB_DASHBOARD_URL}`
      )
    );
    
    return await interaction.editReply({ components: [container], flags: [MessageFlags.IsComponentsV2] });

  } catch (error) {
    console.error('[Comando Web-Link] Error:', error);
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`${cross_emoji} Error al vincular el canal. Inténtalo de nuevo.`)
    );
    return await interaction.editReply({ components: [container], flags: [MessageFlags.IsComponentsV2] });
  }
}
