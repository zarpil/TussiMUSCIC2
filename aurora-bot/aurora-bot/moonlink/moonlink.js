import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { music_card } from "../music-card/card.js";
import { Manager, Track } from 'moonlink.js';
import NodelinkNode from "../models/NodelinkNode.js";
import PremiumUser from "../models/PremiumUser.js";
import PlayerState from "../models/PlayerState.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const configPath = path.join(__dirname, "../config.json");
const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));

export default async function connectMoonlink(client) {
  // Initialize nodes using config.json with environment variable overrides for Docker/Coolify support
  const nodes = (config.nodelink?.nodes || []).map(n => ({
    ...n,
    host: process.env.NODELINK_HOST || n.host || "nodelink",
    port: Number(process.env.NODELINK_PORT || n.port || 2333),
    password: process.env.NODELINK_SERVER_PASSWORD || process.env.NODELINK_PASSWORD || n.password || "youshallnotpass"
  }));

  client.moonlink = new Manager({
    nodes: nodes.length > 0 ? nodes : [{
      identifier: "tussi-nodelink",
      host: process.env.NODELINK_HOST || "nodelink",
      port: Number(process.env.NODELINK_PORT || 2333),
      password: process.env.NODELINK_SERVER_PASSWORD || process.env.NODELINK_PASSWORD || "youshallnotpass",
      secure: false,
      priority: 1
    }],
    autoLeave: false,        // Don't leave if the queue is empty or error occurs
    resume: true,            // Enable session resuming
    resumeTimeout: 300,      // Wait 300 seconds (5 mins) for reconnection before killing the player
    options: config.moonlink?.options,
    send: (guildId, payload) => {
      const guild = client.guilds.cache.get(guildId);
      if (guild) guild.shard.send(payload);
    },
  });

  // Empty premium users Set on bot initialization, will be populated on MongoDB connection
  client.premiumUsers = new Set();

  // Attach nodeCreate event listener to dynamically load metadata when nodes are added
  client.moonlink.on("nodeCreate", async (node) => {
    try {
      const dbNode = await NodelinkNode.findOne({ identifier: node.identifier });
      if (dbNode) {
        node.userType = dbNode.userType || 'all';
        node.priority = dbNode.priority || 1;
        console.log(`[Moonlink Node] Configured metadata for node ${node.identifier} (userType: ${node.userType}, priority: ${node.priority})`);
      }
    } catch (err) {
      // Catch errors silently during startup/unconnected phase
    }
  });

  // Monkey-patch players.create to route to correct node based on premium status
  const originalCreate = client.moonlink.players.create;
  client.moonlink.players.create = function (options) {
    const originalFindNode = client.moonlink.nodes.findNode;
    
    client.moonlink.nodes.findNode = function (findOptions) {
      const guildId = options.guildId;
      const guild = client.guilds.cache.get(guildId);
      const requesterId = options.requesterId;
      
      const isPremium = (requesterId && client.premiumUsers.has(requesterId)) || 
                        (guild && client.premiumUsers.has(guild.ownerId));
      
      let candidates = Array.from(this.nodes.values());
      let filtered = candidates.filter(node => {
        const type = node.userType || 'all';
        if (isPremium) {
          return type === 'premium' || type === 'all';
        } else {
          return type === 'normal' || type === 'all';
        }
      });

      if (!filtered.length) {
        filtered = candidates; // Fallback if no matching nodes are online
      }

      const originalNodes = new Map(this.nodes);
      try {
        this.nodes.clear();
        for (const node of filtered) {
          this.nodes.set(node.identifier, node);
        }
        return originalFindNode.call(this, findOptions);
      } finally {
        this.nodes.clear();
        for (const [id, node] of originalNodes) {
          this.nodes.set(id, node);
        }
      }
    };

    try {
      return originalCreate.call(client.moonlink.players, options);
    } finally {
      client.moonlink.nodes.findNode = originalFindNode;
    }
  };
}

/**
 * Reconnect all 24/7 enabled voice channels
 */
export async function reconnect247Guilds(client) {
  try {
    const GuildConfig = (await import('../models/Guild.js')).default;
    const configs = await GuildConfig.find({ 'settings.twentyFourSeven.enabled': true });
    if (!configs || configs.length === 0) return;

    for (const cfg of configs) {
      try {
        const guild = client.guilds.cache.get(cfg.guildId);
        if (!guild) continue;

        const voiceChannelId = cfg.settings?.twentyFourSeven?.voiceChannelId;
        if (!voiceChannelId) continue;

        const voiceChannel = guild.channels.cache.get(voiceChannelId);
        if (!voiceChannel) {
          console.log(`[24/7 Watchdog] Voice channel ${voiceChannelId} no longer exists in ${guild.name}. Disabling 24/7 mode.`);
          cfg.settings.twentyFourSeven.enabled = false;
          cfg.settings.twentyFourSeven.voiceChannelId = null;
          await cfg.save();
          continue;
        }

        let player = client.moonlink.players.get(cfg.guildId);
        if (!player) {
          player = client.moonlink.players.create({
            guildId: cfg.guildId,
            voiceChannelId: voiceChannelId,
            textChannelId: cfg.settings?.twentyFourSeven?.textChannelId || cfg.requestChannel?.channelId || guild.channels.cache.find(c => c.isTextBased())?.id,
            autoLeave: false
          });
        }

        player.autoLeave = false;
        if (!player.connected) {
          await player.connect({ setDeaf: true });
          console.log(`[24/7 Watchdog] 🔄 Auto-reconnected to VC #${voiceChannel.name} in ${guild.name} after network drop/recovery`);
        }
      } catch (err) {
        console.error(`[24/7 Watchdog] Reconnect error for guild ${cfg.guildId}:`, err.message);
      }
    }
  } catch (err) {
    console.error('[24/7 Watchdog] Auto-reconnect check failed:', err.message);
  }
}

export async function moonlinkInit(client) {
  try {
    // Initialize moonlink connections to the initial config nodes synchronously
    client.moonlink.init(client.user.id);
    console.log("✅ Moonlink Is Initialized Successfully");

    // Initial reconnect on startup
    setTimeout(() => reconnect247Guilds(client), 4000);

    // Continuous 24/7 Network Reconnection Watchdog Timer (runs every 15 seconds)
    setInterval(() => reconnect247Guilds(client), 15000);

  } catch (err) {
    console.log("❌ Moonlink Initialization Failed:", err);
  }
}

/**
 * Initializes database-dependent features once MongoDB is connected.
 * Loaded from server/index.js post-connect hook.
 */
export async function initializeDbFeatures(client) {
  try {
    console.log('[Moonlink] Initializing database-dependent features...');

    // 1. Populate premium users in-memory Set cache
    client.premiumUsers.clear();
    const pUsers = await PremiumUser.find();
    for (const u of pUsers) {
      client.premiumUsers.add(u.userId);
    }
    console.log(`[Premium Cache] Loaded ${client.premiumUsers.size} premium users.`);

    // 2. Load active nodes from DB and config.json, merging them
    const dbNodes = await NodelinkNode.find({ isActive: true });
    
    // Start with config.json nodes
    const mergedNodes = new Map();
    if (config.nodelink?.nodes) {
      for (const n of config.nodelink.nodes) {
        mergedNodes.set(n.identifier, {
          identifier: n.identifier,
          host: process.env.NODELINK_HOST || n.host || 'nodelink',
          port: Number(process.env.NODELINK_PORT || n.port || 2333),
          password: process.env.NODELINK_SERVER_PASSWORD || process.env.NODELINK_PASSWORD || n.password || 'youshallnotpass',
          secure: n.secure ?? false,
          userType: 'all',
          priority: n.priority ?? 1
        });
      }
    }

    // Override or add with database nodes configured via the Web Dashboard
    for (const n of dbNodes) {
      mergedNodes.set(n.identifier, {
        identifier: n.identifier,
        host: n.host,
        port: Number(n.port),
        password: n.password,
        secure: n.secure ?? false,
        userType: n.userType || 'all',
        priority: n.priority ?? 1
      });
    }

    console.log(`[Moonlink DB] Overwriting node configurations with ${mergedNodes.size} merged nodes (DB + config.json).`);

    // Synchronize merged nodes with Moonlink NodeManager
    for (const n of mergedNodes.values()) {
      try {
        let node = client.moonlink.nodes.nodes.get(n.identifier);
        if (!node) {
          client.moonlink.nodes.add({
            identifier: n.identifier,
            host: n.host,
            port: n.port,
            password: n.password,
            secure: n.secure,
            priority: n.priority
          });
          node = client.moonlink.nodes.nodes.get(n.identifier);
        }
        if (node) {
          node.userType = n.userType;
          node.priority = n.priority;
          if (!node.connected) {
            await node.connect();
          }
        }
      } catch (err) {
        console.error(`[Moonlink DB] Error loading node ${n.identifier}:`, err.message);
      }
    }

    // Wait for at least one node to be connected and ready before state restoration
    let waitedMs = 0;
    while (waitedMs < 5000) {
      const activeOnlineNodes = Array.from(client.moonlink.nodes.nodes.values()).filter(n => n.connected);
      if (activeOnlineNodes.length > 0) {
        console.log(`[Moonlink DB] Node connection verified online: ${activeOnlineNodes[0].identifier}`);
        break;
      }
      await new Promise(resolve => setTimeout(resolve, 250));
      waitedMs += 250;
    }

    // 3. Restore saved player states (preserves queues and song positions)
    try {
      const savedStates = await PlayerState.find({ isActive: true });
      console.log(`[State Restoration] Found ${savedStates.length} saved player states to restore.`);
      
      const twoHoursAgo = Date.now() - (2 * 60 * 60 * 1000);

      for (const state of savedStates) {
        try {
          // Delete stale states or empty state records where there is no current track and no queue
          const updatedAtTime = state.updatedAt ? new Date(state.updatedAt).getTime() : 0;
          if ((updatedAtTime > 0 && updatedAtTime < twoHoursAgo) || (!state.currentTrack && (!state.queue || state.queue.length === 0))) {
            console.log(`[State Restoration] Deleting finished/empty player state for guild ${state.guildId}`);
            await PlayerState.deleteOne({ _id: state._id });
            continue;
          }

          const guild = client.guilds.cache.get(state.guildId);
          if (!guild) continue;

          const voiceChannel = guild.channels.cache.get(state.voiceChannelId);
          if (!voiceChannel) continue;

          // Recreate player
          const player = client.moonlink.players.create({
            guildId: state.guildId,
            voiceChannelId: state.voiceChannelId,
            textChannelId: state.textChannelId,
            volume: state.volume,
            autoLeave: false
          });

          player.autoLeave = false;

          // Connect
          await player.connect({ setDeaf: true });

          // Restore settings
          player.setLoop(state.loop);
          player.setVolume(state.volume);

          // Restore queue
          if (state.queue && state.queue.length > 0) {
            for (const qTrack of state.queue) {
              try {
                const decoded = client.moonlink.decodeTrack(qTrack.encoded);
                player.queue.add(new Track(decoded, qTrack.requester));
              } catch (e) {
                console.error(`[State Restoration] Error decoding queue track:`, e.message);
              }
            }
          }

          // Restore and play current track
          if (state.currentTrack) {
            try {
              const decoded = client.moonlink.decodeTrack(state.currentTrack.encoded);
              const track = new Track(decoded, state.currentTrack.requester);
              
              await player.play({ track });

              if (state.paused) {
                player.pause();
                player.manuallyPaused = true;
              }
              
              console.log(`[State Restoration] Successfully restored playback in ${guild.name}.`);
            } catch (e) {
              console.error(`[State Restoration] Error playing current track:`, e.message);
              await PlayerState.deleteOne({ _id: state._id });
            }
          }
        } catch (err) {
          console.error(`[State Restoration] Failed to restore state for guild ${state.guildId}:`, err.message);
        }
      }
    } catch (err) {
      console.error('[State Restoration] Error fetching saved states:', err.message);
    }

  } catch (err) {
    console.error('[Moonlink DB Features] Initialization failed:', err.message);
  }
}