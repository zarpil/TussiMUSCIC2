import { SlashCommandBuilder,MessageFlags,ContainerBuilder,TextDisplayBuilder } from "discord.js";
import { tick_emoji } from "../../emoji/emoji.js";
export const shufflecmd = new SlashCommandBuilder()
.setName('shuffle')
.setDescription('Mezcla aleatoriamente las canciones en la cola actual')

export async function Shuffle(client,interaction)
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
        player.shuffle();
        container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${tick_emoji} Cola mezclada`))
        await interaction.editReply({components:[container], flags: [MessageFlags.IsComponentsV2]});
        if (!player.isRequestChannelPanel) {
          containerExtra.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${tick_emoji} La cola actual fue mezclada por <@${interaction.user.id}>`))
          return await interaction.channel.send({components:[containerExtra], flags: [MessageFlags.IsComponentsV2]});
        }
}