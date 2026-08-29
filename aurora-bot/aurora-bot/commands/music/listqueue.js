import {SlashCommandBuilder,SeparatorBuilder,TextDisplayBuilder,ContainerBuilder,MessageFlags,SeparatorSpacingSize } from "discord.js";
import {cross_emoji,  music_disc_emoji, tick_emoji} from '../../emoji/emoji.js'
export const listqueuecmd = new SlashCommandBuilder()
  .setName('listqueue')
  .setDescription('Muestra la cola de reproducción actual');

export async function Track_List(client, interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const player = client.moonlink.players.get(interaction.guild.id);
    if (!player) {
      return interaction.editReply(`${cross_emoji} ¡No hay nada reproduciéndose en este servidor!`);
    }

    if (!player.current && player.queue.size === 0) {
      return interaction.editReply(`${cross_emoji} ¡No hay canciones en la cola!`);
    }

    const formatDuration = (ms) => {
      const seconds = Math.floor((ms / 1000) % 60);
      const minutes = Math.floor((ms / (1000 * 60)) % 60);
      const hours = Math.floor(ms / (1000 * 60 * 60));

      return `${hours ? `${hours}:` : ""}${minutes.toString().padStart(2, "0")}:${seconds
        .toString()
        .padStart(2, "0")}`;
    };

    const container = new ContainerBuilder()
     .addTextDisplayComponents(new TextDisplayBuilder().setContent(`${music_disc_emoji} Canciones en Cola`))

    if (player.current) {
      container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`**Reproduciendo Ahora:**\n[${player.current.title}](${player.current.uri}) | \`${formatDuration(player.current.duration)}\``));
      container.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small))
    }

    if (player.queue.size > 0) {
      const tracks = player.queue.tracks.map((track, index) => {
        return `${index + 1}. [${track.title}](${track.uri}) | \`${formatDuration(track.duration)}\``;
      });

     container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`A continuación:\n`+tracks.slice(0, 10).join("\n")))

      if (player.queue.size > 10) {
        container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`Y ${player.queue.size - 10} canciones más en la cola...`))
  
      }
    }

    return interaction.editReply({components:[container], flags: [MessageFlags.IsComponentsV2]});
}
