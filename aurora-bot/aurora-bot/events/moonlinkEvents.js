import { music_disc_emoji } from "../emoji/emoji.js";
import setVoiceStatus from "../utils/setVoiceStatus.js";
import { music_card } from "../music-card/card.js";
import { tick_emoji } from "../emoji/emoji.js";
import { send_log } from "../log/log.js";
import { edit_idle_panel, resetPanelToIdle } from "../music-card/idle.js";
import fs from "fs";
import path from "path";

const logFile = path.join(process.cwd(), "music-debug.log");

export async function flushVcConnectedTime(guildId) {
  try {
    const GuildConfig = (await import('../models/Guild.js')).default;
    const config = await GuildConfig.findOne({ guildId });
    if (config && config.stats && config.stats.vcConnectedAt) {
      const elapsed = Date.now() - new Date(config.stats.vcConnectedAt).getTime();
      if (elapsed > 0 && elapsed < 30 * 24 * 60 * 60 * 1000) { // sanity cap 30 days max
        config.stats.totalVcMs = (config.stats.totalVcMs || 0) + elapsed;
      }
      config.stats.vcConnectedAt = null;
      await config.save();
    }
  } catch (err) {
    console.error(`[VC Hours] Error flushing VC time for ${guildId}:`, err.message);
  }
}

export async function recordTrackStart(guildId, track) {
  try {
    const GuildConfig = (await import('../models/Guild.js')).default;
    let config = await GuildConfig.findOne({ guildId });
    if (!config) {
      config = new GuildConfig({ guildId });
    }

    if (!config.stats) config.stats = { userActivity: [], topSongs: [], totalVcMs: 0 };
    if (!config.stats.userActivity) config.stats.userActivity = [];
    if (!config.stats.topSongs) config.stats.topSongs = [];

    // Track requester user activity
    const requester = track?.requester;
    if (requester && (requester.id || requester.username || requester.tag)) {
      const userId = requester.id || requester.username || 'unknown';
      const existingUser = config.stats.userActivity.find(u => u.userId === userId);
      if (existingUser) {
        existingUser.count += 1;
        if (requester.username || requester.tag) existingUser.username = requester.username || requester.tag;
        if (requester.avatar) existingUser.avatar = requester.avatar;
      } else {
        config.stats.userActivity.push({
          userId: userId,
          username: requester.username || requester.tag || 'Discord User',
          avatar: requester.avatar || '',
          count: 1
        });
      }
    }

    // Track top songs
    if (track && track.title) {
      const cleanTitle = track.title.trim();
      const existingSong = config.stats.topSongs.find(s => s.title.toLowerCase() === cleanTitle.toLowerCase());
      const artwork = (track.artwork && !track.artwork.includes('discordapp.com/embed/avatars')) ? track.artwork : '';
      const url = track.url || '';

      if (existingSong) {
        existingSong.count += 1;
        if (artwork) existingSong.artwork = artwork;
        if (url) existingSong.url = url;
      } else {
        config.stats.topSongs.push({
          title: cleanTitle,
          author: track.author || 'Unknown Artist',
          artwork: artwork,
          url: url,
          count: 1
        });
      }
    }

    if (!config.stats.vcConnectedAt) {
      config.stats.vcConnectedAt = new Date();
    }

    await config.save();
  } catch (err) {
    console.error('[Stats] Error recording track start:', err.message);
  }
}

import { reconnect247Guilds } from "../moonlink/moonlink.js";

async function savePlayerState(player) {
  try {
    const PlayerState = (await import('../models/PlayerState.js')).default;
    if (!player || !player.guildId || !player.voiceChannelId) return;

    // If player has no active current track and queue is empty, delete state document
    const queueLength = player.queue ? (player.queue.size || player.queue.all?.length || 0) : 0;
    if (!player.current && queueLength === 0) {
      await PlayerState.deleteOne({ guildId: player.guildId });
      return;
    }

    await PlayerState.updateOne(
      { guildId: player.guildId },
      {
        guildId: player.guildId,
        voiceChannelId: player.voiceChannelId,
        textChannelId: player.textChannelId,
        currentTrack: player.current ? {
          encoded: player.current.encoded,
          requester: player.current.requester,
          position: player.current.position || 0
        } : null,
        queue: player.queue ? player.queue.map(t => ({
          encoded: t.encoded,
          requester: t.requester
        })) : [],
        loop: player.loop || 'off',
        volume: player.volume || 100,
        paused: player.paused || false,
        isActive: true
      },
      { upsert: true }
    );
  } catch (err) {
    console.error(`[State Sync] Error saving player state for guild ${player.guildId}:`, err.message);
  }
}

async function deletePlayerState(guildId) {
  try {
    const PlayerState = (await import('../models/PlayerState.js')).default;
    await PlayerState.deleteOne({ guildId });
  } catch (err) {
    console.error(`[State Sync] Error deleting player state for guild ${guildId}:`, err.message);
  }
}

export async function moonlinkEvents(client) {
  // Start 10-second active player position sync loop
  setInterval(async () => {
    try {
      if (!client.moonlink || !client.moonlink.players) return;
      for (const player of client.moonlink.players.all) {
        if (player.connected && player.current) {
          await savePlayerState(player);
        }
      }
    } catch (err) {
      console.error('[State Sync Loop] Error:', err.message);
    }
  }, 10000);

  if (client.config?.debug) {
    client.moonlink.on("debug", (msg) => console.log(`[Moonlink] ${msg}`));
  }

  client.moonlink.on("nodeConnect", (node) => {
    console.log(`Node ${node.identifier} connected`);
    reconnect247Guilds(client);
  });

  client.moonlink.on("nodeDisconnect", (node) => {
    console.log(`Node ${node.identifier} disconnected`);
  });

  client.moonlink.on("nodeError", (node, error) => {
    console.error(`Node ${node.identifier} error:`, error);
  });

  client.moonlink.on("trackStart", async (player, track) => {
    // Reset consecutive error counter when a track successfully starts playing
    player.consecutiveErrors = 0;

    console.log(`[Moonlink Events] trackStart fired for guild ${player.guildId}, track: ${track.title}`);
    console.log(`[Moonlink Events] Voice Channel ID: ${player.voiceChannelId}`);
    
    // Check 24/7 Empty Voice Channel Auto-Pause
    try {
      const guild = client.guilds.cache.get(player.guildId);
      if (guild) {
        const botVcId = player.voiceChannelId || player.voiceChannel;
        if (botVcId) {
          const botVc = guild.channels.cache.get(botVcId);
          if (botVc) {
            const nonBotMembers = botVc.members.filter(member => !member.user.bot);
            const GuildConfig = (await import('../models/Guild.js')).default;
            const config = await GuildConfig.findOne({ guildId: player.guildId });
            if (config && config.settings?.twentyFourSeven?.enabled && nonBotMembers.size === 0 && !player.manuallyPaused) {
              player.pause();
              player.autoPausedBy247 = true;
              console.log(`[24/7] ⏸️ No human listeners present in VC. Auto-paused track "${track.title}" in ${guild.name}.`);
              return; // Skip setting active voice status/music card for empty channel
            }
          }
        }
      }
    } catch (e) {
      console.error('[24/7] Error checking empty VC on trackStart:', e.message);
    }

    // Record playback statistics
    recordTrackStart(player.guildId, track);

    // Save player state to DB
    await savePlayerState(player);

    try {
      await setVoiceStatus(
        client,
        player.voiceChannelId,
        `${music_disc_emoji} ` + track.title,
      );
      console.log(`[Moonlink Events] Voice status set successfully`);
    } catch (error) {
      console.error(`[Moonlink Events] Error setting voice status:`, error);
    }
    await music_card(client, player, track);
  });

  client.moonlink.on("queueEnd", async (player) => {
    player.consecutiveErrors = 0;
    if (player.autoPlay) return;

    // Always delete saved player state when queue finishes so ended tracks are never restored on restart
    await deletePlayerState(player.guildId);

    // Reset panel to idle as soon as queue ends
    await resetPanelToIdle(client, player.guildId, player);

    // Check if 24/7 mode is enabled for this guild
    try {
      const GuildConfig = (await import('../models/Guild.js')).default;
      const config = await GuildConfig.findOne({ guildId: player.guildId });
      if (config && config.settings?.twentyFourSeven?.enabled) {
        console.log(`[Moonlink Events] 24/7 Mode active for guild ${player.guildId}. Keeping player connected.`);
        return;
      }
    } catch (e) {
      console.error('[Moonlink Events] Error checking 24/7 mode on queueEnd:', e.message);
    }

    await player.destroy("Finished playing");
  });

  client.moonlink.on("trackEnd", async (player, track, reason) => {
    console.log(`[Moonlink Events] trackEnd fired for guild ${player?.guildId}, reason: ${reason}`);
    
    if (reason === "loadFailed" || reason === "LOAD_FAILED" || reason === "load_failed") {
      player.consecutiveErrors = (player.consecutiveErrors || 0) + 1;
      console.warn(`[Moonlink Events] ⚠️ Track "${track?.title || 'Unknown'}" load failed in guild ${player?.guildId}. Consecutive errors: ${player.consecutiveErrors}`);

      if (player.consecutiveErrors > 4) {
        console.error(`[Moonlink Events] ⛔ Stopped skip cascade for guild ${player?.guildId}: ${player.consecutiveErrors} consecutive load failures.`);
        player.consecutiveErrors = 0;
        return;
      }
    }

    try {
      if (player?.musicCard) {
        const card = player.musicCard;
        if (!player.isRequestChannelPanel) {
          player.musicCard = null;
          await card.delete().catch(() => {});
          console.log(`[Moonlink Events] Music card deleted`);
        } else {
          console.log(`[Moonlink Events] Kept music card (is RequestChannel panel)`);
        }
      }
      
      if (reason !== "replaced") {
        await setVoiceStatus(client, player.voiceChannelId, "");
        console.log(`[Moonlink Events] Voice status cleared successfully`);
      } else {
        console.log(`[Moonlink Events] Track was replaced, keeping voice status`);
      }
    } catch (error) {
      console.error(`[Moonlink Events] Error in trackEnd:`, error);
    }

    // Check if queue has ended or no upcoming tracks
    const queueLength = player?.queue ? (player.queue.size || player.queue.all?.length || 0) : 0;
    if (queueLength === 0 && reason !== "replaced") {
      await deletePlayerState(player?.guildId);
    } else {
      await savePlayerState(player);
    }

    if (client.webServer?.socketHandler) {
      client.webServer.socketHandler.sendQueueUpdate(player);
    }
  });

  client.moonlink.on("trackError", async (player, track, payload) => {
    console.warn(`[Moonlink Events] ⚠️ trackError for guild ${player?.guildId}, track: ${track?.title || 'Unknown'}, payload:`, payload);
    player.consecutiveErrors = (player.consecutiveErrors || 0) + 1;

    if (player.consecutiveErrors > 3) {
      console.error(`[Moonlink Events] ⛔ Stopped skip cascade for guild ${player?.guildId}: ${player.consecutiveErrors} consecutive errors.`);
      player.consecutiveErrors = 0;
      await deletePlayerState(player?.guildId);
      if (client.webServer?.socketHandler) {
        client.webServer.socketHandler.io.to(`guild:${player.guildId}`).emit('player-destroyed');
        client.webServer.socketHandler.sendQueueUpdate(player);
      }
      return;
    }

    if (client.webServer?.socketHandler) {
      client.webServer.socketHandler.sendQueueUpdate(player);
    }

    if (player.queue && (player.queue.size > 0 || player.queue.all?.length > 0)) {
      setTimeout(() => {
        try {
          if (player.connected) player.skip();
        } catch (e) {
          console.error('[Moonlink Events] Error auto-skipping failed track:', e.message);
        }
      }, 1000);
    } else {
      // Queue empty and track failed - clean state immediately so dashboard resets smoothly
      await deletePlayerState(player?.guildId);
      if (client.webServer?.socketHandler) {
        client.webServer.socketHandler.io.to(`guild:${player.guildId}`).emit('queue-end');
        client.webServer.socketHandler.io.to(`guild:${player.guildId}`).emit('queue-update', []);
      }
    }
  });

  client.moonlink.on("trackException", async (player, track, payload) => {
    console.warn(`[Moonlink Events] ⚠️ trackException for guild ${player?.guildId}, track: ${track?.title || 'Unknown'}, payload:`, payload);
    player.consecutiveErrors = (player.consecutiveErrors || 0) + 1;

    if (player.consecutiveErrors > 3) {
      console.error(`[Moonlink Events] ⛔ Stopped skip cascade for guild ${player?.guildId}: ${player.consecutiveErrors} consecutive exceptions.`);
      player.consecutiveErrors = 0;
      await deletePlayerState(player?.guildId);
      if (client.webServer?.socketHandler) {
        client.webServer.socketHandler.io.to(`guild:${player.guildId}`).emit('player-destroyed');
        client.webServer.socketHandler.sendQueueUpdate(player);
      }
      return;
    }

    if (client.webServer?.socketHandler) {
      client.webServer.socketHandler.sendQueueUpdate(player);
    }

    if (player.queue && (player.queue.size > 0 || player.queue.all?.length > 0)) {
      setTimeout(() => {
        try {
          if (player.connected) player.skip();
        } catch (e) {
          console.error('[Moonlink Events] Error auto-skipping exception track:', e.message);
        }
      }, 1000);
    } else {
      // Queue empty and track had exception - clean state immediately
      await deletePlayerState(player?.guildId);
      if (client.webServer?.socketHandler) {
        client.webServer.socketHandler.io.to(`guild:${player.guildId}`).emit('queue-end');
        client.webServer.socketHandler.io.to(`guild:${player.guildId}`).emit('queue-update', []);
      }
    }
  });

  client.moonlink.on("debug", (message) => {
    const time = new Date().toISOString();
    const log = `[${time}] ${message}\n`;

    fs.appendFile(logFile, log, (err) => {
      if (err) console.error("Failed to write debug log:", err);
    });
  });

  client.moonlink.on("trackStuck", async (player, track, payload) => {
    console.warn(`[Moonlink Events] ⚠️ trackStuck for guild ${player?.guildId}, track: ${track?.title || 'Unknown'}`);
    player.consecutiveErrors = (player.consecutiveErrors || 0) + 1;

    if (player.consecutiveErrors > 3) {
      console.error(`[Moonlink Events] ⛔ Stopped skip cascade for guild ${player?.guildId}: ${player.consecutiveErrors} consecutive stuck tracks.`);
      player.consecutiveErrors = 0;
      await deletePlayerState(player?.guildId);
      if (client.webServer?.socketHandler) {
        client.webServer.socketHandler.io.to(`guild:${player.guildId}`).emit('player-destroyed');
        client.webServer.socketHandler.sendQueueUpdate(player);
      }
      return;
    }

    if (client.webServer?.socketHandler) {
      client.webServer.socketHandler.sendQueueUpdate(player);
    }

    if (player.queue && (player.queue.size > 0 || player.queue.all?.length > 0)) {
      setTimeout(() => {
        try {
          if (player.connected) player.skip();
        } catch (e) {
          console.error('[Moonlink Events] Error skipping stuck track:', e.message);
        }
      }, 1000);
    } else {
      // Queue empty and track stuck - clean state immediately
      await deletePlayerState(player?.guildId);
      if (client.webServer?.socketHandler) {
        client.webServer.socketHandler.io.to(`guild:${player.guildId}`).emit('queue-end');
        client.webServer.socketHandler.io.to(`guild:${player.guildId}`).emit('queue-update', []);
      }
    }
  });

  client.moonlink.on("playerDestroyed", async (player) => {
    await deletePlayerState(player.guildId);
    await flushVcConnectedTime(player.guildId);
    if (client.webServer?.socketHandler) {
      client.webServer.socketHandler.io.to(`guild:${player.guildId}`).emit('player-destroyed');
      client.webServer.socketHandler.io.to(`guild:${player.guildId}`).emit('player_sync', {
        position: 0,
        isPlaying: false,
        isDestroyed: true,
        timestamp: Date.now()
      });
    }
    
    // Reset the panel to idle if it was a request channel panel
    await resetPanelToIdle(client, player.guildId, player);
    
    console.log(`[State Sync] Deleted player state and flushed VC time for guild ${player.guildId} due to playerDestroyed event`);
  });

  client.moonlink.on("playerCreate", (player) => {
    const guildid = player.guildId;
    const guild = client.guilds.cache.get(guildid);
    send_log(`${tick_emoji} created player \n Server: ${guild ? guild.name : guildid} \n ID: ${guildid}`);
  });

  client.on("raw", (packet) => client.moonlink.packetUpdate(packet));
}
