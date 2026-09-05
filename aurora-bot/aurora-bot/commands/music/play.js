import { SlashCommandBuilder, MessageFlags,TextDisplayBuilder,ContainerBuilder } from 'discord.js';
import {tick_emoji, cross_emoji} from "../../emoji/emoji.js"
import { send_log } from '../../log/log.js';

export const playcmd = new SlashCommandBuilder()
  .setName('play')
  .setDescription('Reproduce una canción o playlist desde YouTube, Spotify, etc.')
  .addStringOption(option =>
    option.setName('query')
      .setDescription('Nombre de la canción o enlace URL')
      .setRequired(true)
      .setAutocomplete(true)
  );

export default async function playmusic(client, interaction) {
  await interaction.deferReply({flags: MessageFlags.Ephemeral});
  let query = await interaction.options.getString('query');
  let container = new ContainerBuilder();
  let containerExtra = new ContainerBuilder();
  const { channel } = interaction.member.voice;
    if (!channel) {
      container.addTextDisplayComponents( new TextDisplayBuilder().setContent(`${cross_emoji} ¡Debes unirte a un canal de voz primero!`));
      return interaction.editReply({components:[container],flags: [MessageFlags.IsComponentsV2]});
    }
    const permissions = channel.permissionsFor(interaction.guild.members.me);
    if (!permissions.has('Connect')) {
      container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${cross_emoji} ¡No tengo permiso de **Conectar** en tu canal de voz!`));
      return interaction.editReply({components:[container],flags: [MessageFlags.IsComponentsV2]});
    }
    if (!permissions.has('Speak')) {
      container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${cross_emoji} ¡No tengo permiso de **Hablar** en tu canal de voz!`));
      return interaction.editReply({components:[container],flags: [MessageFlags.IsComponentsV2]});
    }

  try {
     const player = client.moonlink.players.create({
      guildId: interaction.guild.id,
      voiceChannelId: channel.id,
      textChannelId: interaction.channel.id,
      autoPlay: false,
      volume: 100,
      requesterId: interaction.user.id
    });
    const isUrl = query.startsWith('http://') || query.startsWith('https://');
    const searchQuery = isUrl ? query : (query.startsWith('scsearch:') || query.startsWith('spsearch:') || query.startsWith('ytsearch:') || query.startsWith('ytmsearch:') ? query : `scsearch:${query}`);
    
    const searchResult = await client.moonlink.search({
      query: searchQuery,
      requester: interaction.user.id,
    });
    if (!searchResult.tracks.length) {
      container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${cross_emoji} No se encontraron resultados para tu búsqueda.`))
      return await interaction.editReply({components:[container], flags: [MessageFlags.IsComponentsV2]});
    }
    // Handle different load types
    switch (searchResult.loadType) {
      case "playlist":
        for (const track of searchResult.tracks) {
          track.requester = interaction.user;
        }
        player.queue.add(searchResult.tracks);
        container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${tick_emoji} Añadido con éxito`))
        await interaction.editReply({components:[container], flags: [MessageFlags.IsComponentsV2]});
        if (!player.isRequestChannelPanel) {
          containerExtra.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${tick_emoji} Playlist **[${searchResult.playlistInfo.name}](${searchResult.tracks[0].uri})** (${searchResult.tracks.length} canciones) añadida a la cola por <@${interaction.user.id}>.`));
          await interaction.channel.send({components:[containerExtra],flags: [MessageFlags.IsComponentsV2]});
        }
        
        send_log(`🎵 **${interaction.user.tag}** añadió la playlist **${searchResult.playlistInfo.name}** en **${interaction.guild.name}**`);
        
        // Notify web dashboard
        if (client.webServer?.socketHandler) {
          client.webServer.socketHandler.sendQueueUpdate(player);
        }
        
        if (!player.playing && !player.paused) return player.play();
        break;
      case "search":
      case "track":
        searchResult.tracks[0].requester = interaction.user;
        await player.queue.add(searchResult.tracks[0]);
        container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${tick_emoji} Añadido con éxito`))
        await interaction.editReply({components:[container], flags: [MessageFlags.IsComponentsV2]});
        if (!player.isRequestChannelPanel) {
          containerExtra.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${tick_emoji} Añadida **[${searchResult.tracks[0].title}](${searchResult.tracks[0].uri})** por <@${interaction.user.id}>`))
          await interaction.channel.send({components:[containerExtra],flags: [MessageFlags.IsComponentsV2]});
        }
        
        send_log(`🎵 **${interaction.user.tag}** reprodujo **${searchResult.tracks[0].title}** en **${interaction.guild.name}**`);
        
        // Notify web dashboard
        if (client.webServer?.socketHandler) {
          client.webServer.socketHandler.sendQueueUpdate(player);
        }
        
        if (!player.playing && !player.paused) return player.play();
        break;

      case "empty":
        container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${cross_emoji} ¡No se encontraron coincidencias para tu búsqueda!`))
        return await interaction.editReply({components:[container],flags: [MessageFlags.IsComponentsV2]});
        break;

      case "error":
        container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${cross_emoji} Ocurrió un error al cargar la pista: ${searchResult.error || "Error desconocido"}`))
        return await interaction.editReply({components:[container],flags: [MessageFlags.IsComponentsV2]});
        break;
    }

  } catch (err) {
    console.error('❌ Error en /play:', err);
       send_log(`${cross_emoji} Error en /play  \n Servidor: ${interaction.guild.name} \n ID: ${interaction.guild.id}`+ err);
       container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${cross_emoji} Algo salió mal al usar **/play**. Verifica los permisos del bot.`));
       return await interaction.editReply({components:[container],flags: [MessageFlags.IsComponentsV2]});
   
  }
}