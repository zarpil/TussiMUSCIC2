import { SlashCommandBuilder, MessageFlags,ContainerBuilder,TextDisplayBuilder,SeparatorBuilder,SeparatorSpacingSize } from 'discord.js';
import { tick_emoji, cross_emoji } from '../../emoji/emoji.js';
import { loop_controls } from '../../buttons/buttons.js';
export const loopenablecmd = new SlashCommandBuilder()
    .setName('loop')
    .setDescription('Activa o desactiva la repetición de canciones o cola');

export default async function looptrack(client, interaction) {
    await interaction.deferReply({flags: MessageFlags.Ephemeral});
    let container = new ContainerBuilder();
    let containerExtra = new ContainerBuilder();
    const player = client.moonlink.players.get(interaction.guild.id);
    if (!player){ 
            containerExtra.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${cross_emoji} ¡No hay ningún reproductor activo!`));
            return await interaction.editReply({components:[containerExtra], flags: [MessageFlags.IsComponentsV2]});
        }

    if (interaction.member.voice.channel?.id !== player.voiceChannelId) {
      containerExtra.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${cross_emoji} ¡Debes estar en el mismo canal de voz!`));
       return await interaction.editReply({components:[containerExtra], flags: [MessageFlags.IsComponentsV2]});
    }
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`Selecciona una opción de repetición`))
    .addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small))
    .addActionRowComponents(loop_controls)
    return await interaction.editReply({components:[container], flags: [MessageFlags.IsComponentsV2]});
       
}

export async function loopOff(client,interaction)
{
    await interaction.deferReply({flags: MessageFlags.Ephemeral});
    let container = new ContainerBuilder();
    let containerExtra = new ContainerBuilder();
    const player = client.moonlink.players.get(interaction.guild.id);
    if (!player){ 
            containerExtra.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${cross_emoji} ¡No hay ningún reproductor activo!`));
            return await interaction.editReply({components:[containerExtra], flags: [MessageFlags.IsComponentsV2]});
        }

    if (interaction.member.voice.channel?.id !== player.voiceChannelId) {
      containerExtra.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${cross_emoji} ¡Debes estar en el mismo canal de voz!`));
       return await interaction.editReply({components:[containerExtra], flags: [MessageFlags.IsComponentsV2]});
    }
    if(player.loop !=="off")
    {
        player.setLoop('off');
        containerExtra.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${tick_emoji} Desactivado`))
        await interaction.editReply({components:[containerExtra], flags: [MessageFlags.IsComponentsV2]});
        if (!player.isRequestChannelPanel) {
          container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`La repetición fue desactivada por <@${interaction.user.id}>`))
          return await interaction.channel.send({components:[container], flags: [MessageFlags.IsComponentsV2]});
        }
        return;
    }
    else
    {
        containerExtra.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${cross_emoji} La repetición ya estaba desactivada`))
        return await interaction.editReply({components:[containerExtra], flags: [MessageFlags.IsComponentsV2]});
    }
}

export async function loopTrack(client,interaction)
{
    await interaction.deferReply({flags: MessageFlags.Ephemeral});
    let container = new ContainerBuilder();
    let containerExtra = new ContainerBuilder();
    const player = client.moonlink.players.get(interaction.guild.id);
    if (!player){ 
            containerExtra.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${cross_emoji} ¡No hay ningún reproductor activo!`));
            return await interaction.editReply({components:[containerExtra], flags: [MessageFlags.IsComponentsV2]});
        }

    if (interaction.member.voice.channel?.id !== player.voiceChannelId) {
      containerExtra.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${cross_emoji} ¡Debes estar en el mismo canal de voz!`));
       return await interaction.editReply({components:[containerExtra], flags: [MessageFlags.IsComponentsV2]});
    }
    if(player.loop !=="track")
    {
        player.setLoop('track');
        containerExtra.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${tick_emoji} Repetición de canción activada`))
        await interaction.editReply({components:[containerExtra], flags: [MessageFlags.IsComponentsV2]});
        if (!player.isRequestChannelPanel) {
          container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`La repetición de esta canción fue activada por <@${interaction.user.id}>`))
          return await interaction.channel.send({components:[container], flags: [MessageFlags.IsComponentsV2]});
        }
        return;
    }
    else
    {
        containerExtra.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${cross_emoji} La repetición de la canción ya está activada`))
        return await interaction.editReply({components:[containerExtra], flags: [MessageFlags.IsComponentsV2]});
    }
}
export async function loopQueue(client,interaction)
{
    await interaction.deferReply({flags: MessageFlags.Ephemeral});
    let container = new ContainerBuilder();
    let containerExtra = new ContainerBuilder();
    const player = client.moonlink.players.get(interaction.guild.id);
    if (!player){ 
            containerExtra.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${cross_emoji} ¡No hay ningún reproductor activo!`));
            return await interaction.editReply({components:[containerExtra], flags: [MessageFlags.IsComponentsV2]});
        }

    if (interaction.member.voice.channel?.id !== player.voiceChannelId) {
      containerExtra.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${cross_emoji} ¡Debes estar en el mismo canal de voz!`));
       return await interaction.editReply({components:[containerExtra], flags: [MessageFlags.IsComponentsV2]});
    }
    if(player.loop !=="queue")
    {
        player.setLoop('queue');
        containerExtra.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${tick_emoji} Repetición de cola activada`))
        await interaction.editReply({components:[containerExtra], flags: [MessageFlags.IsComponentsV2]});
        if (!player.isRequestChannelPanel) {
          container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`La repetición de toda la cola fue activada por <@${interaction.user.id}>`))
          return await interaction.channel.send({components:[container], flags: [MessageFlags.IsComponentsV2]});
        }
        return;
    }
    else
    {
        containerExtra.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${cross_emoji} La repetición de la cola ya está activada`))
        return await interaction.editReply({components:[containerExtra], flags: [MessageFlags.IsComponentsV2]});
    }
}
