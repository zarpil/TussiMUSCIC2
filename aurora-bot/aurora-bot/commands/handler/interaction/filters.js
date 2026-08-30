import { TextDisplayBuilder, ContainerBuilder, MessageFlags } from "discord.js";
import { tick_emoji, cross_emoji } from "../../../emoji/emoji.js";
export async function setfilter(interaction, client) {
  await interaction.deferReply({ ephemeral: true });
  let container = new ContainerBuilder();
  let containerExtra = new ContainerBuilder();
  const player = client.moonlink.players.get(interaction.guild.id);
  if (!player) {
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `${cross_emoji} There is nothing playing in this server!`,
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
        `${cross_emoji} You need to be in the same voice channel as the bot to use this command!`,
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
        `${cross_emoji} There is nothing playing right now!`,
      ),
    );
    return await interaction.editReply({
      components: [container],
      flags: [MessageFlags.IsComponentsV2],
    });
  }
  let appliedFilter;

  for (const value of interaction.values) {
    switch (value.toLowerCase()) {
      case "nightcore":
        await player.filters.enable("nightcore");
        await player.filters.apply();
        appliedFilter = "**Nightcore**";
        break;

      case "vibrato":
        player.filters.setVibrato({ frequency: 2.0, depth: 0.5 });
        await player.filters.apply();
        appliedFilter = "**Vibrato**";
        break;

      case "karaoke":
        player.filters.setKaraoke({ level: 1.0, monoLevel: 1.0 });
        await player.filters.apply();
        appliedFilter = "**Karaoke**";
        break;

      case "rotation":
        player.filters.setRotation({ rotationHz: 0.2 });
        await player.filters.apply();
        appliedFilter = "**Rotation**";

        break;
      case "eqaulizer":
        player.filters.setEqualizer([
          { band: 0, gain: 0.2 },
          { band: 1, gain: 0.15 },
        ]);
        appliedFilter = "**Eqaulizer**";

        await player.filters.apply();
        break;

      case "lowpass":
        player.filters.setLowPass({ smoothing: 20 });
        await player.filters.apply();
        appliedFilter = "**Lowpass**";

        break;
      case "distortion":
        player.filters.setDistortion({
          sinOffset: 0,
          sinScale: 1,
          cosOffset: 0,
          cosScale: 1,
          tanOffset: 0,
          tanScale: 1,
          offset: 0,
          scale: 1,
        });
        await player.filters.apply();
        appliedFilter = "**Distortion**";

        break;
      case "tremalo":
        player.filters.setTremolo({ frequency: 2.0, depth: 0.5 });
        await player.filters.apply();
        appliedFilter = "**Tremalo**";

        break;
      case "reset":
        player.filters.clear();
        await player.filters.apply();
        containerExtra.addTextDisplayComponents(
          new TextDisplayBuilder().setContent(`${tick_emoji} Done`),
        );
        await interaction.editReply({
          components: [containerExtra],
          flags: [MessageFlags.IsComponentsV2],
        });
        if (!player.isRequestChannelPanel) {
          container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
              `${tick_emoji} Filters Cleared By <@${interaction.user.id}>`,
            ),
          );
          return await interaction.channel.send({
            components: [container],
            flags: [MessageFlags.IsComponentsV2],
          });
        }
        return;

      default:
        container.addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `${cross_emoji} Unknown filter: ${value}`,
          ),
        );
        return await interaction.editReply({
          components: [container],
          flags: [MessageFlags.IsComponentsV2],
        });
    }
  }

  containerExtra.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(`${tick_emoji} Done`),
  );
  await interaction.editReply({
    components: [containerExtra],
    flags: [MessageFlags.IsComponentsV2],
  });
  if (!player.isRequestChannelPanel) {
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `${tick_emoji} Filters applied: ${appliedFilter} by <@${interaction.user.id}>`,
      ),
    );
    return await interaction.channel.send({
      components: [container],
      flags: [MessageFlags.IsComponentsV2],
    });
  }
}
}
