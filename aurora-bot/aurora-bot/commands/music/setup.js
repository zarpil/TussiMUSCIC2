import { SlashCommandBuilder, MessageFlags, TextDisplayBuilder, ContainerBuilder, PermissionsBitField, ChannelType } from 'discord.js';
import { tick_emoji, cross_emoji } from "../../emoji/emoji.js";
import { send_log } from '../../log/log.js';
import GuildConfig from '../../models/Guild.js';
import { send_idle_panel } from '../../music-card/idle.js';

export const setupcmd = new SlashCommandBuilder()
  .setName('setup')
  .setDescription('Configura el canal dedicado para el bot de música')
  .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageChannels)
  .addChannelOption(option =>
    option.setName('canal')
      .setDescription('El canal de texto donde se enviará el panel de música')
      .addChannelTypes(ChannelType.GuildText)
      .setRequired(true)
  );

export default async function setupmusic(client, interaction) {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });
  
  if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageChannels) && !interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
    const container = new ContainerBuilder();
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${cross_emoji} ¡No tienes permisos para usar este comando! Necesitas **Gestionar canales** o **Administrador**.`));
    return interaction.editReply({ components: [container], flags: [MessageFlags.IsComponentsV2] });
  }

  const channel = interaction.options.getChannel('canal');
  let container = new ContainerBuilder();

  try {
    const permissions = channel.permissionsFor(interaction.guild.members.me);
    if (!permissions.has('ViewChannel') || !permissions.has('SendMessages') || !permissions.has('EmbedLinks')) {
      container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${cross_emoji} ¡No tengo permisos suficientes en <#${channel.id}>! Necesito ver el canal y enviar mensajes.`));
      return interaction.editReply({ components: [container], flags: [MessageFlags.IsComponentsV2] });
    }

    let config = await GuildConfig.findOne({ guildId: interaction.guild.id });
    if (!config) {
      config = new GuildConfig({ guildId: interaction.guild.id });
    }

    // Comprobar si ya había un panel y borrarlo si existe
    if (config.requestChannel?.channelId && config.requestChannel?.messageId) {
      try {
        const oldChannel = await client.channels.fetch(config.requestChannel.channelId).catch(() => null);
        if (oldChannel) {
          const oldMessage = await oldChannel.messages.fetch(config.requestChannel.messageId).catch(() => null);
          if (oldMessage) await oldMessage.delete();
        }
      } catch (err) {
        console.error("No se pudo borrar el mensaje del panel anterior:", err);
      }
    }

    // Enviar el nuevo panel
    const message = await send_idle_panel(client, channel);
    
    if (!message) {
      container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${cross_emoji} Ocurrió un error al enviar el panel a <#${channel.id}>.`));
      return interaction.editReply({ components: [container], flags: [MessageFlags.IsComponentsV2] });
    }

    // Guardar en la base de datos
    config.requestChannel = {
      channelId: channel.id,
      messageId: message.id
    };
    await config.save();

    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${tick_emoji} ¡Panel de música configurado correctamente en <#${channel.id}>!`));
    await interaction.editReply({ components: [container], flags: [MessageFlags.IsComponentsV2] });
    
    send_log(`${tick_emoji} Panel de música configurado en **${interaction.guild.name}** en el canal <#${channel.id}> por **${interaction.user.tag}**`);

  } catch (err) {
    console.error('❌ Error en /setup:', err);
    send_log(`${cross_emoji} Error en /setup \n Servidor: ${interaction.guild.name} \n ID: ${interaction.guild.id} ` + err);
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${cross_emoji} Algo salió mal al configurar el canal. Verifica mis permisos.`));
    return await interaction.editReply({ components: [container], flags: [MessageFlags.IsComponentsV2] });
  }
}
