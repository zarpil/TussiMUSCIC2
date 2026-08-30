import {SlashCommandBuilder, MessageFlags,ContainerBuilder,TextDisplayBuilder } from "discord.js";
import { cross_emoji, tick_emoji } from '../../emoji/emoji.js';
export const skipcmd = new SlashCommandBuilder()
    .setName('skip')
    .setDescription('Salta a la siguiente canción');


export async function skip_track(client, interaction) {
    await interaction.deferReply({flags: MessageFlags.Ephemeral});
    let container = new ContainerBuilder();
    let containerExtra = new ContainerBuilder();
    const player = client.moonlink.players.get(interaction.guild.id);
    if (!player) {
       container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${cross_emoji} ¡No hay nada reproduciéndose en este servidor!`));
       return await interaction.editReply({components:[container], flags: [MessageFlags.IsComponentsV2]});
    }

    if (interaction.member.voice.channel?.id !== player.voiceChannelId) {
       container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${cross_emoji} ¡Debes estar en el mismo canal de voz que el bot para usar este comando!`));
       return await interaction.editReply({components:[container], flags: [MessageFlags.IsComponentsV2]});
    }

    if (!player.current) {
       container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${cross_emoji} ¡No hay ninguna canción reproduciéndose ahora mismo!`));
       return await interaction.editReply({components:[container], flags: [MessageFlags.IsComponentsV2]});
    }
   if (player.queue.all.length === 0 &&  !player.autoplay) {
       container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${cross_emoji} ¡La cola está vacía! Activa el modo automático (/autoplay) para continuar con canciones similares.`));
       return await interaction.editReply({components:[container], flags: [MessageFlags.IsComponentsV2]});
    }

    const currentTrack = player.current;
    player.skip();
    
    // Notify web dashboard
    if (client.webServer?.socketHandler) {
      setTimeout(() => {
        client.webServer.socketHandler.sendQueueUpdate(player);
      }, 100);
    }
    
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${tick_emoji} Saltada con éxito`))
    await interaction.editReply({components:[container], flags: [MessageFlags.IsComponentsV2]});
    if (!player.isRequestChannelPanel) {
      containerExtra.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${tick_emoji} Canción saltada: **${currentTrack.title}** por <@${interaction.user.id}>`));
      return await interaction.channel.send({components:[containerExtra], flags: [MessageFlags.IsComponentsV2]});
    }
}