import { SlashCommandBuilder,MessageFlags,ContainerBuilder,TextDisplayBuilder } from "discord.js";
import { tick_emoji,cross_emoji } from "../../emoji/emoji.js";
export const autoplaycmd = new SlashCommandBuilder()
  .setName("auto-play")
  .setDescription("Reproducción automática continua al terminar la cola de canciones");

export async function Autoplay(client, interaction) {
  await interaction.deferReply({flags: MessageFlags.Ephemeral});
  let container = new ContainerBuilder();
  let containerExtra = new ContainerBuilder();
  const player = client.moonlink.players.get(interaction.guild.id);
  if (!player) {
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `${cross_emoji} ¡No hay nada reproduciéndose en este servidor!`,
      ),
    );
    return await interaction.editReply({
      components: [container],
      flags: [MessageFlags.IsComponentsV2],
    });
  }

  if (interaction.member.voice.channel?.id !== player.voiceChannelId) {
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `${cross_emoji} ¡Debes estar en el mismo canal de voz que el bot para usar este comando!`,
      ),
    );
    return await interaction.editReply({
      components: [container],
      flags: [MessageFlags.IsComponentsV2],
    });
  }

  if (!player.current) {
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `${cross_emoji} ¡No hay ninguna canción reproduciéndose ahora mismo!`,
      ),
    );
    return await interaction.editReply({
      components: [container],
      flags: [MessageFlags.IsComponentsV2],
    });
  }
  const isAutoplay = player.autoPlay;
  player.setAutoPlay(!isAutoplay);
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${tick_emoji} Actualizado`))
    await interaction.editReply({components:[container], flags: [MessageFlags.IsComponentsV2]});
    containerExtra.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${tick_emoji} La reproducción automática está ahora **${!isAutoplay ? "activada" : "desactivada"}** por <@${interaction.user.id}>`,));
    return await interaction.channel.send({components:[containerExtra], flags: [MessageFlags.IsComponentsV2]})

}
