import { MessageFlags, SlashCommandBuilder,ContainerBuilder,TextDisplayBuilder} from "discord.js";
import { cross_emoji, tick_emoji } from '../../emoji/emoji.js';
export const stopcmd = new SlashCommandBuilder()
    .setName('stop')
    .setDescription('Detiene la música y vacía la cola');
export default async function stop_music(client, interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
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

    player.stop();
    player.queue.clear();
    containerExtra.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${tick_emoji} Detenido con éxito`));
    await interaction.editReply({components:[containerExtra], flags: [MessageFlags.IsComponentsV2]});
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${tick_emoji} Reproducción detenida y cola limpiada por <@${interaction.user.id}>`));
    return await interaction.channel.send({components:[container], flags: [MessageFlags.IsComponentsV2]});
}
