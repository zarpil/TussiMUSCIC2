import {MessageFlags, SlashCommandBuilder,ContainerBuilder,TextDisplayBuilder,SeparatorBuilder,SeparatorSpacingSize } from "discord.js";
import { tick_emoji, cross_emoji } from "../../emoji/emoji.js";
import { volumecontrolrows } from "../../buttons/buttons.js";
export const volume_cmd= new SlashCommandBuilder()
    .setName('volume')
    .setDescription('Controla el volumen de reproducción');


export async function Volume(interaction){
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    let container = new ContainerBuilder();
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`Selecciona una opción de volumen`))
    .addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small))
    .addActionRowComponents(volumecontrolrows)
    return await interaction.editReply({components:[container], flags: [MessageFlags.IsComponentsV2]});
}
export async function volume_up(client, interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
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
    let volume = player.volume;
    const requester = interaction.user.id

    if (volume === 20) 
        player.setVolume(40);
    if (volume === 40) 
        player.setVolume(60);
    if (volume === 60) 
        player.setVolume(80);
    if (volume === 80) 
        player.setVolume(100);
    if (volume === 100) {
        containerExtra.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${cross_emoji} El volumen ya está al máximo:** ${player.volume}%**`));
        return await interaction.editReply({components:[containerExtra], flags: [MessageFlags.IsComponentsV2]});
    }
        containerExtra.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${tick_emoji} Ajustado con éxito`));
        container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${tick_emoji} Volumen ajustado a:** ${player.volume}%** por <@${requester}>`));
        await interaction.editReply({components:[containerExtra], flags: [MessageFlags.IsComponentsV2]});
        return await interaction.channel.send({components:[container], flags: [MessageFlags.IsComponentsV2]})

}

export async function volume_down(client, interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
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
    const requester = interaction.user.id;
    let volume = player.volume;
    if (volume === 100) 
        player.setVolume(80);
    if (volume === 80) 
        player.setVolume(60);
    if (volume === 60) 
        player.setVolume(40);
    if (volume === 40) 
        player.setVolume(20);
    if (volume === 20) {
        containerExtra.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${cross_emoji} El volumen ya está al mínimo:** ${player.volume}%**`));
        return await interaction.editReply({components:[containerExtra], flags: [MessageFlags.IsComponentsV2]});
    }
        containerExtra.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${tick_emoji} Ajustado con éxito`));
        container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${tick_emoji} Volumen ajustado a:** ${player.volume}%** por <@${requester}>`));
        await interaction.editReply({components:[containerExtra], flags: [MessageFlags.IsComponentsV2]});
        return await interaction.channel.send({components:[container], flags: [MessageFlags.IsComponentsV2]})
}
