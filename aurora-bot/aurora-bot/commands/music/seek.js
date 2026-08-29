import { SlashCommandBuilder,MessageFlags,ContainerBuilder,ActionRowBuilder,TextDisplayBuilder,ModalBuilder,LabelBuilder,TextInputBuilder,TextInputStyle } from "discord.js";
import { cross_emoji,tick_emoji } from "../../emoji/emoji.js";
export const seekcmd = new SlashCommandBuilder()
.setName('seek')
.setDescription('Avanza o retrocede a un minuto/segundo específico de la canción')

export async function seekModal(client,interaction)
{
  let container = new ContainerBuilder();
  const player = client.moonlink.players.get(interaction.guild.id);
    if (!player) {
       container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${cross_emoji} ¡No hay nada reproduciéndose en este servidor!`));
       return await interaction.reply({components:[container], flags: [MessageFlags.IsComponentsV2],ephemeral: true});
    }

    if (interaction.member.voice.channel?.id !== player.voiceChannelId) {
       container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${cross_emoji} ¡Debes estar en el mismo canal de voz que el bot para usar este comando!`));
       return await interaction.reply({components:[container], flags: [MessageFlags.IsComponentsV2],ephemeral: true});
    }

    if (!player.current) {
       container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${cross_emoji} ¡No hay ninguna canción reproduciéndose ahora mismo!`));
       return await interaction.reply({components:[container], flags: [MessageFlags.IsComponentsV2],ephemeral: true});
    }
const modal = new ModalBuilder()
  .setCustomId('seekmodal')
  .setTitle('Ir a posición de tiempo');

const seekInput = new TextInputBuilder()
  .setCustomId('seek_input')
  .setLabel('Posición deseada (mm:ss)')
  .setStyle(TextInputStyle.Short)
  .setRequired(true);

modal.addComponents(
  new ActionRowBuilder().addComponents(seekInput)
);

    return await interaction.showModal(modal);
}
  export async function Seek(client,interaction,)
  {
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
    const position = interaction.fields.getTextInputValue('seek_input');
    let milliseconds = 0;
    if (position.includes(":")) {
      const [minutes, seconds] = position.split(":");
      milliseconds = (parseInt(minutes) * 60 + parseInt(seconds)) * 1000;
    } else {
      milliseconds = parseInt(position) * 1000;
    }

    if (isNaN(milliseconds))
        {
       container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${cross_emoji} ¡Formato de tiempo inválido! Usa mm:ss`));
       return await interaction.editReply({components:[container], flags: [MessageFlags.IsComponentsV2]});
        } 

    if (milliseconds > player.current.duration) {
      container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${cross_emoji} ¡La pista solo dura ${formatDuration(player.current.duration)}!`));
    }

    player.seek(milliseconds);
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${tick_emoji} Posición cambiada`))
    await interaction.editReply({components:[container], flags: [MessageFlags.IsComponentsV2]});
    containerExtra.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${tick_emoji} Tiempo ajustado a: **${formatDuration(milliseconds)}** por <@${interaction.user.id}>`))
    return await interaction.channel.send({components:[containerExtra], flags: [MessageFlags.IsComponentsV2]})

  }

function formatDuration(ms) {
  const seconds = Math.floor((ms / 1000) % 60);
  const minutes = Math.floor((ms / (1000 * 60)) % 60);
  const hours = Math.floor(ms / (1000 * 60 * 60));

  return `${hours ? `${hours}:` : ""}${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}`;
}