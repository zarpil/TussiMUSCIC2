import { SlashCommandBuilder, MessageFlags,ContainerBuilder,TextDisplayBuilder } from 'discord.js';
import { cross_emoji, tick_emoji } from '../../emoji/emoji.js';
import { music_card } from '../../music-card/card.js';

export const resumecmd = new SlashCommandBuilder()
  .setName('resume')
  .setDescription('Reanuda la canción pausada');


export async function song_resume(client, interaction) {
   await interaction.deferReply({flags: MessageFlags.Ephemeral});
   let container = new ContainerBuilder();
   let containerExtra = new ContainerBuilder();
   const player = client.moonlink.players.get(interaction.guild.id);
    if (!player) {
       container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${cross_emoji} ¡No hay nada reproduciéndose en este servidor!`));
        return await interaction.editReply({components:[container],flags: [MessageFlags.IsComponentsV2]});
    }

    if (interaction.member.voice.channel?.id !== player.voiceChannelId) {
      container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${cross_emoji} ¡Debes estar en el mismo canal de voz que el bot para usar este comando!`));
       return await interaction.editReply({components:[container],flags: [MessageFlags.IsComponentsV2]});
    }

    if (!player.paused) {
       container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${cross_emoji} ¡La reproducción no está pausada!`));
       return await interaction.editReply({components:[container],flags: [MessageFlags.IsComponentsV2]});
    }

    player.resume();
    player.manuallyPaused = false;
    player.autoPausedBy247 = false;
    if (client.webServer?.socketHandler) {
      client.webServer.socketHandler.sendQueueUpdate(player);
    }
    if (player.current) {
      await music_card(client, player, player.current);
    }
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${tick_emoji} Reanudado con éxito`));
    await interaction.editReply({components:[container],flags: [MessageFlags.IsComponentsV2]});
    if (!player.isRequestChannelPanel) {
      containerExtra.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${tick_emoji} Canción reanudada por <@${interaction.user.id}>`))
      return await interaction.channel.send({components:[containerExtra],flags: [MessageFlags.IsComponentsV2]});
    }
}

 