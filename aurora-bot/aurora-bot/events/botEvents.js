import GuildConfig from '../models/Guild.js';
import { tick_emoji, cross_emoji } from '../emoji/emoji.js';

export async function botEvents(client) {
    
client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.guild) return;

  try {
    const config = await GuildConfig.findOne({ guildId: message.guild.id });
    if (!config || !config.requestChannel || !config.requestChannel.channelId) return;

    if (message.channel.id === config.requestChannel.channelId) {
      // 1. Delete message
      if (message.deletable) {
        await message.delete().catch(() => {});
      }

      // 2. Play music logic
      const query = message.content;
      if (!query) return;

      const { channel } = message.member.voice;
      if (!channel) {
        const msg = await message.channel.send(`${cross_emoji} <@${message.author.id}>, ¡Debes unirte a un canal de voz primero!`);
        setTimeout(() => msg.delete().catch(() => {}), 5000);
        return;
      }

      const permissions = channel.permissionsFor(message.guild.members.me);
      if (!permissions.has('Connect') || !permissions.has('Speak')) {
        const msg = await message.channel.send(`${cross_emoji} <@${message.author.id}>, ¡No tengo permisos de **Conectar** o **Hablar** en tu canal de voz!`);
        setTimeout(() => msg.delete().catch(() => {}), 5000);
        return;
      }

      const player = client.moonlink.players.create({
        guildId: message.guild.id,
        voiceChannelId: channel.id,
        textChannelId: message.channel.id,
        autoPlay: false,
        volume: 100,
        requesterId: message.author.id
      });

      const isUrl = query.startsWith('http://') || query.startsWith('https://');
      const searchQuery = isUrl ? query : (query.startsWith('scsearch:') || query.startsWith('spsearch:') || query.startsWith('ytsearch:') || query.startsWith('ytmsearch:') ? query : `scsearch:${query}`);
      
      const searchResult = await client.moonlink.search({
        query: searchQuery,
        requester: message.author.id,
      });

      if (!searchResult.tracks.length) {
        const msg = await message.channel.send(`${cross_emoji} <@${message.author.id}>, no se encontraron resultados.`);
        setTimeout(() => msg.delete().catch(() => {}), 5000);
        return;
      }

      switch (searchResult.loadType) {
        case "playlist":
          for (const track of searchResult.tracks) {
            track.requester = message.author;
          }
          player.queue.add(searchResult.tracks);
          if (client.webServer?.socketHandler) {
            client.webServer.socketHandler.sendQueueUpdate(player);
          }
          if (!player.playing && !player.paused) player.play();
          break;
        case "search":
        case "track":
          searchResult.tracks[0].requester = message.author;
          player.queue.add(searchResult.tracks[0]);
          if (client.webServer?.socketHandler) {
            client.webServer.socketHandler.sendQueueUpdate(player);
          }
          if (!player.playing && !player.paused) player.play();
          break;
        case "empty":
        case "error":
          const msg = await message.channel.send(`${cross_emoji} <@${message.author.id}>, ocurrió un error o no hay resultados.`);
          setTimeout(() => msg.delete().catch(() => {}), 5000);
          break;
      }
    }
  } catch (err) {
    console.error("Error in messageCreate:", err);
  }
});

client.on('error', (error) => {
  console.error('❌ Client error:', error);
});

client.on('shardError', (error) => {
  console.error('❌ Shard error:', error);
});

client.on('disconnect', (event) => {
  console.warn('⚠️ Bot disconnected:', event);
});

client.on('reconnecting', () => {
  console.log('🔄 Bot is reconnecting...');
});

process.on('unhandledRejection', (reason, promise) => {
  if (
    reason instanceof TypeError &&
    reason.message.includes("reading 'options'")
  ) {
    // Silently ignore this specific error
    return;
  }
  console.error('🚨 Unhandled promise rejection:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('🔥 Uncaught exception:', err);
});
}