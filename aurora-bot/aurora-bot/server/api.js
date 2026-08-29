import express from 'express';
import GuildConfig from '../models/Guild.js';
import Session from '../models/Session.js';
import { MessageFlags, ContainerBuilder, TextDisplayBuilder } from 'discord.js';
import { tick_emoji, music_disc_emoji, queuelist_emoji } from '../emoji/emoji.js';
import fetch from 'node-fetch';

// Search formatting helper removed to match Discord bot direct search behavior

// Middleware to validate authenticated user
async function validateUser(req, res, next) {
  // Try to get user ID from header first (sent by web dashboard)
  const userIdHeader = req.headers['x-user-id'];
  
  if (userIdHeader) {
    req.authenticatedUserId = userIdHeader;
    next();
    return;
  }
  
  // Try to get session ID from cookie
  const sessionCookie = req.headers.cookie?.split('; ')
    .find(row => row.startsWith('session_id='))
    ?.split('=')[1];
  
  if (!sessionCookie) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  
  try {
    // Get session from MongoDB
    const session = await Session.findOne({ sessionId: sessionCookie });
    
    if (!session) {
      return res.status(401).json({ error: 'Invalid session' });
    }
    
    req.authenticatedUserId = session.userId;
    next();
  } catch (error) {
    console.error('[API] Session validation error:', error);
    return res.status(401).json({ error: 'Invalid session' });
  }
}

export function setupAPIRoutes(app, client, manager, getSocketHandler = null) {
  const router = express.Router();

  // Get user avatar
  router.get('/users/:userId/avatar', async (req, res) => {
    try {
      const { userId } = req.params;
      const user = await client.users.fetch(userId);
      if (user && user.avatar) {
        return res.json({ avatar: `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png` });
      }
      res.json({ avatar: null });
    } catch (error) {
      res.json({ avatar: null });
    }
  });

  // Get all guilds the bot is in
  router.get('/guilds', async (req, res) => {
    try {
      console.log('[API] /api/guilds endpoint hit');
      console.log('[API] Client guilds cache size:', client.guilds.cache.size);
      
      const guilds = client.guilds.cache.map(guild => ({
        id: guild.id,
        name: guild.name,
        icon: guild.iconURL(),
        memberCount: guild.memberCount,
        hasPlayer: manager.players.has(guild.id),
        voiceChannel: guild.members.me.voice.channel?.name || null
      }));
      
      console.log('[API] Returning', guilds.length, 'guilds');
      res.json(guilds);
    } catch (error) {
      console.error('[API] Error in /api/guilds:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get specific guild info
  router.get('/guild/:guildId', async (req, res) => {
    try {
      const { guildId } = req.params;
      const guild = client.guilds.cache.get(guildId);
      
      if (!guild) {
        return res.status(404).json({ error: 'Guild not found' });
      }

      const player = manager.players.get(guildId);
      const config = await GuildConfig.findOne({ guildId });
      
      res.json({
        guild: {
          id: guild.id,
          name: guild.name,
          icon: guild.iconURL(),
          memberCount: guild.memberCount,
          channels: guild.channels.cache
            .filter(c => c.type === 2) // Voice channels
            .map(c => ({ id: c.id, name: c.name }))
        },
        player: player ? {
          connected: true,
          voiceChannel: guild.members.me.voice.channel?.name,
          current: player.current ? {
            title: player.current.title,
            author: player.current.author,
            duration: player.current.duration,
            artwork: player.current.artworkUrl || player.current.thumbnail,
            url: player.current.url
          } : null,
          queue: player.queue.map(t => ({
            title: t.title,
            author: t.author,
            duration: t.duration,
            artwork: t.artworkUrl || t.thumbnail
          })),
          volume: player.volume,
          paused: player.paused,
          position: player.current?.position || 0,
          loop: player.loop || 'off',
          autoplay: player.autoplay || false
        } : { connected: false },
        config: config || null
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get bot stats
  router.get('/stats', async (req, res) => {
    try {
      const stats = {
        guilds: client.guilds.cache.size,
        users: client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0),
        activePlayers: manager.players.size,
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        ping: client.ws.ping,
        logChannelId: process.env.LOG_CHANNEL_ID || ''
      };
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get commands list
  router.get('/commands', (req, res) => {
    const commands = [
      {
        name: 'play',
        description: 'Play a song or playlist',
        usage: '/play <song name or URL>',
        category: 'Music'
      },
      {
        name: 'pause',
        description: 'Pause the current song',
        usage: '/pause',
        category: 'Music'
      },
      {
        name: 'resume',
        description: 'Resume the paused song',
        usage: '/resume',
        category: 'Music'
      },
      {
        name: 'skip',
        description: 'Skip the current song',
        usage: '/skip',
        category: 'Music'
      },
      {
        name: 'stop',
        description: 'Stop the player and clear queue',
        usage: '/stop',
        category: 'Music'
      },
      {
        name: 'volume',
        description: 'Set the player volume',
        usage: '/volume <0-100>',
        category: 'Music'
      },
      {
        name: 'loop',
        description: 'Set loop mode',
        usage: '/loop',
        category: 'Music'
      },
      {
        name: 'auto-play',
        description: 'Toggle autoplay',
        usage: '/auto-play',
        category: 'Music'
      },
      {
        name: 'shuffle',
        description: 'Shuffle the queue',
        usage: '/shuffle',
        category: 'Music'
      },
      {
        name: 'listqueue',
        description: 'Show the current queue',
        usage: '/listqueue',
        category: 'Music'
      },
      {
        name: 'seek',
        description: 'Seek to a position in the song',
        usage: '/seek',
        category: 'Music'
      },
      {
        name: 'web-link',
        description: 'Link channel for web notifications',
        usage: '/web-link',
        category: 'Settings'
      }
    ];
    res.json(commands);
  });

  // Search for songs (Using Official Music Platform APIs: iTunes, Deezer, SoundCloud)
  router.get('/search', validateUser, async (req, res) => {
    try {
      const { query, source } = req.query;
      if (!query) {
        return res.status(400).json({ error: 'Query required' });
      }

      const reqLimit = req.query.limit ? (req.query.limit === 'all' ? 100 : parseInt(req.query.limit)) : 60;
      const targetLimit = isNaN(reqLimit) ? 60 : reqLimit;

      // Clean all existing search prefixes to prevent NodeLink double-prefix bugs
      const cleanQuery = query.replace(/^(ytmsearch:|scsearch:|spsearch:|ytsearch:)+/gi, '').trim();

      // Keywords that indicate non-music YouTube vlogs or real estate videos
      const nonMusicKeywords = ['renovate', 'real estate', 'vlog', 'tutorial', 'how to', 'podcast', 'unboxing', 'gameplay', 'walkthrough', 'review', 'reaction', 'episode', 'charleston', 'selling', 'house tour'];

      // Words from user query for strict relevance checking
      const queryWords = cleanQuery.toLowerCase().split(/\s+/).filter(w => w.length > 1);

      const isMusicTrack = (track) => {
        if (!track || !track.title) return false;
        const titleLower = track.title.toLowerCase();
        const authorLower = (track.author || '').toLowerCase();

        // 1. Exclude explicit non-music keywords
        if (nonMusicKeywords.some(kw => titleLower.includes(kw))) return false;
        if (track.duration && track.duration > 900000) return false; // Exclude > 15 min long vlogs/podcasts

        // 2. Strict query relevance filter: at least 1 search term MUST match title or artist
        if (queryWords.length > 0) {
          const hasKeywordMatch = queryWords.some(word => titleLower.includes(word) || authorLower.includes(word));
          if (!hasKeywordMatch) return false; // Discard random videos like "Hammett Grove" or "[Exclusive Scoop]"
        }
        return true;
      };

      let allTracks = [];
      const uniqueKeys = new Set();
      const trackUrls = new Set();

      const addTrack = (track) => {
        if (!track || !track.title || !track.author) return;
        
        // Filter out tracks that contain the star/placeholder artwork
        const art = (track.artwork || '').toLowerCase();
        if (
          art.includes('discordapp.com/embed/avatars') ||
          art.includes('placeholder') ||
          art.includes('d41d8cd98f00b204e9800998ecf8427e') ||
          art.includes('2a96cbd8b46e442fc41c2b86b821562f')
        ) {
          return; // Skip/filter this track out completely!
        }

        const key = `${track.title.toLowerCase().trim()} - ${track.author.toLowerCase().trim()}`;
        if (!uniqueKeys.has(key)) {
          uniqueKeys.add(key);
          allTracks.push(track);
        }
      };

      if (source === 'explorer') {
        // EXPLORER SEARCH: Fetch Official Music Platform APIs (Deezer, iTunes, Last.fm) FIRST, then SoundCloud & YTM
        const lastfmApiKey = process.env.LASTFM_API_KEY;
        const [deezerSettled, itunesSettled, lastfmSettled, scSettled, ytmSettled] = await Promise.allSettled([
          fetch(`https://api.deezer.com/search?q=${encodeURIComponent(cleanQuery)}&limit=40`, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
              'Accept': 'application/json'
            }
          }).then(r => r.json()),
          fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(cleanQuery)}&media=music&entity=song&limit=30`).then(r => r.json()),
          lastfmApiKey ? fetch(`https://ws.audioscrobbler.com/2.0/?method=track.search&track=${encodeURIComponent(cleanQuery)}&api_key=${lastfmApiKey}&format=json`).then(r => r.json()) : Promise.resolve(null),
          manager.search({ query: `scsearch:${cleanQuery}`, requester: 'web-dashboard' }),
          manager.search({ query: `ytmsearch:${cleanQuery}`, requester: 'web-dashboard' })
        ]);

        // 1. Process Deezer Music API results (100% official song platform)
        if (deezerSettled.status === 'fulfilled' && deezerSettled.value?.data) {
          deezerSettled.value.data.forEach(t => {
            if (isMusicTrack({ title: t.title, author: t.artist?.name, duration: t.duration * 1000 })) {
              addTrack({
                title: t.title,
                author: t.artist?.name,
                duration: t.duration * 1000,
                artwork: t.album?.cover_big || t.album?.cover_medium,
                url: `${t.title} ${t.artist?.name}`
              });
            }
          });
        }

        // 2. Process iTunes results (100% reliable high-res artwork)
        if (itunesSettled.status === 'fulfilled' && itunesSettled.value?.results) {
          itunesSettled.value.results.forEach(t => {
            if (isMusicTrack({ title: t.trackName, author: t.artistName, duration: t.trackTimeMillis })) {
              const art = t.artworkUrl100 ? t.artworkUrl100.replace('100x100bb', '600x600bb') : undefined;
              addTrack({
                title: t.trackName,
                author: t.artistName,
                duration: t.trackTimeMillis,
                artwork: art,
                url: `${t.trackName} ${t.artistName}`
              });
            }
          });
        }

        // 3. Process Last.fm API results if available
        if (lastfmSettled.status === 'fulfilled' && lastfmSettled.value?.results?.trackmatches?.track) {
          lastfmSettled.value.results.trackmatches.track.forEach(t => {
            if (isMusicTrack({ title: t.name, author: t.artist })) {
              const art = Array.isArray(t.image) ? t.image.find(img => img.size === 'extralarge' || img.size === 'large')?.['#text'] : null;
              addTrack({
                title: t.name,
                author: t.artist,
                duration: 210000,
                artwork: art || undefined,
                url: `${t.name} ${t.artist}`
              });
            }
          });
        }

        // 4. Process SoundCloud results
        if (scSettled.status === 'fulfilled' && scSettled.value?.tracks) {
          scSettled.value.tracks.filter(isMusicTrack).forEach(track => {
            const u = track.url || track.uri;
            if (u) {
              addTrack({
                title: track.title,
                author: track.author,
                duration: track.duration,
                artwork: track.artworkUrl || track.thumbnail,
                url: u
              });
            }
          });
        }

        // 5. Process YTM results (filtered for query relevance)
        if (ytmSettled.status === 'fulfilled' && ytmSettled.value?.tracks) {
          ytmSettled.value.tracks.filter(isMusicTrack).forEach(track => {
            const u = track.url || track.uri;
            if (u) {
              addTrack({
                title: track.title,
                author: track.author,
                duration: track.duration,
                artwork: track.artworkUrl || track.thumbnail,
                url: u
              });
            }
          });
        }

        // Prioritize tracks with valid photos to the top of the search explorer
        allTracks.sort((a, b) => {
          const hasA = a.artwork && !a.artwork.includes('placeholder') && !a.artwork.includes('discordapp');
          const hasB = b.artwork && !b.artwork.includes('placeholder') && !b.artwork.includes('discordapp');
          return hasA === hasB ? 0 : hasA ? -1 : 1;
        });
      } else {
        // WEBPLAYER SEARCH: Direct Moonlink search matching Discord /play autocomplete
        let directResult = null;
        try {
          directResult = await manager.search({ query: cleanQuery, requester: 'web-dashboard' });
        } catch (err) {}

        if (directResult && directResult.tracks && directResult.tracks.length > 0) {
          directResult.tracks.filter(isMusicTrack).forEach(track => {
            const u = track.url || track.uri;
            if (u && !trackUrls.has(u)) {
              trackUrls.add(u);
              allTracks.push({
                title: track.title,
                author: track.author,
                duration: track.duration,
                artwork: track.artworkUrl || track.thumbnail,
                url: u
              });
            }
          });
        }

        // Fallback to Deezer if direct search returns empty
        if (allTracks.length === 0) {
          try {
            const deezerRes = await fetch(`https://api.deezer.com/search?q=${encodeURIComponent(cleanQuery)}&limit=20`).then(r => r.json());
            if (deezerRes && deezerRes.data) {
              deezerRes.data.forEach(t => {
                const searchStr = `${t.title} ${t.artist?.name}`;
                if (!trackUrls.has(searchStr)) {
                  trackUrls.add(searchStr);
                  allTracks.push({
                    title: t.title,
                    author: t.artist?.name,
                    duration: (t.duration || 210) * 1000,
                    artwork: t.album?.cover_big || t.album?.cover_medium,
                    url: searchStr
                  });
                }
              });
            }
          } catch (e) {}
        }
      }

      res.json({ tracks: allTracks.slice(0, targetLimit) });
    } catch (error) {
      console.error('[API Search] Error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Proxy image to bypass CORS
  router.get('/proxy-image', async (req, res) => {
    try {
      const { url } = req.query;
      if (!url) return res.status(400).json({ error: 'URL required' });
      
      const response = await fetch(decodeURIComponent(url));
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      res.set('Content-Type', response.headers.get('content-type') || 'image/jpeg');
      res.set('Cache-Control', 'public, max-age=86400');
      res.set('Access-Control-Allow-Origin', '*');
      
      res.send(buffer);
    } catch (error) {
      console.error('[API] Proxy image error:', error);
      res.status(500).json({ error: 'Failed to proxy image' });
    }
  });

  // Play a song (Aligned directly with Discord /play command)
  router.post('/play', validateUser, async (req, res) => {
    try {
      const { guildId, userId, query, isBatch, batchTotal, batchIndex } = req.body;
      
      if (!userId || !query) {
        return res.json({ success: false, error: 'Missing required user ID or query' });
      }

      // Security: Verify userId matches authenticated session
      if (userId !== req.authenticatedUserId) {
        console.warn(`[API] Security: User ${req.authenticatedUserId} attempted to use userId ${userId}`);
        return res.json({ success: false, error: 'Unauthorized: User ID mismatch' });
      }

      // Determine guild: use requested guildId or fallback to first available guild
      let targetGuildId = guildId;
      if (!targetGuildId || targetGuildId === 'undefined') {
        const firstGuild = client.guilds.cache.first();
        if (firstGuild) targetGuildId = firstGuild.id;
      }

      let guild = client.guilds.cache.get(targetGuildId);
      if (!guild) {
        const firstGuild = client.guilds.cache.first();
        if (firstGuild) guild = firstGuild;
      }

      if (!guild) {
        return res.json({ success: false, error: 'Server not found. Please select a active Discord server from the header.' });
      }

      targetGuildId = guild.id;

      // Check if bound channel is set BEFORE allowing any operations
      const guildConfig = await GuildConfig.findOne({ guildId: targetGuildId });
      const textChannelId = guildConfig?.boundChannelId || null;
      
      if (!textChannelId) {
        return res.json({ 
          success: false,
          error: 'Please set a notification channel first using /web-link command in Discord',
          requiresWebLink: true
        });
      }

      let member;
      try {
        member = await guild.members.fetch(userId);
      } catch (e) {}

      if (!member || !member.voice || !member.voice.channel) {
        return res.json({ success: false, error: 'You need to join a voice channel first!' });
      }

      let player = manager.players.get(targetGuildId);
      
      if (!player) {
        player = manager.players.create({
          guildId: targetGuildId,
          voiceChannelId: member.voice.channel.id,
          textChannelId: textChannelId,
          autoPlay: false,
          volume: 100,
          requesterId: userId
        });
      }

      // 1. Direct search (identical to Discord /play command)
      let searchResult = await manager.search({
        query: query,
        requester: userId
      });

      // 2. If no tracks found and query is plain text, try ytmsearch, scsearch, spsearch fallbacks
      if (!searchResult || !searchResult.tracks || searchResult.tracks.length === 0) {
        if (!query.startsWith('http://') && !query.startsWith('https://')) {
          const cleanQuery = query.replace(/^(ytmsearch:|scsearch:|spsearch:|ytsearch:)+/gi, '').trim();
          
          searchResult = await manager.search({
            query: `ytmsearch:${cleanQuery}`,
            requester: userId
          });

          if (!searchResult || !searchResult.tracks || searchResult.tracks.length === 0) {
            searchResult = await manager.search({
              query: `scsearch:${cleanQuery}`,
              requester: userId
            });
          }

          if (!searchResult || !searchResult.tracks || searchResult.tracks.length === 0) {
            searchResult = await manager.search({
              query: `spsearch:${cleanQuery}`,
              requester: userId
            });
          }
        }
      }

      if (!searchResult || !searchResult.tracks || searchResult.tracks.length === 0) {
        return res.json({ success: false, error: 'No results found for your query.' });
      }

      const boundChannel = guild.channels.cache.get(textChannelId);

      if (searchResult.loadType === 'playlist') {
        for (const track of searchResult.tracks) {
          track.requester = member.user;
          player.queue.add(track);
        }
        if (!player.playing && !player.paused) player.play();
        
        // Send Discord notification
        if (boundChannel) {
          try {
            const container = new ContainerBuilder();
            container.addTextDisplayComponents(
              new TextDisplayBuilder().setContent(
                `${queuelist_emoji} Added **${searchResult.tracks.length}** songs to queue by <@${userId}> (Web Control)`
              )
            );
            await boundChannel.send({ 
              components: [container], 
              flags: [MessageFlags.IsComponentsV2] 
            });
          } catch (error) {
            console.error('[API] Failed to send playlist message:', error.message);
          }
        }
        
        // Emit real-time queue update
        const socketHandler = typeof getSocketHandler === 'function' ? getSocketHandler() : getSocketHandler;
        if (socketHandler) {
          socketHandler.sendQueueUpdate(player);
        }
        
        return res.json({ 
          success: true, 
          message: `Added ${searchResult.tracks.length} songs to queue`
        });
      } else {
        const track = searchResult.tracks[0];
        track.requester = member.user;
        player.queue.add(track);
        if (!player.playing && !player.paused) player.play();
        
        // Send Discord notification
        // For batch operations (liked songs), only send message for first track
        if (boundChannel && (!isBatch || batchIndex === 0)) {
          try {
            const container = new ContainerBuilder();
            if (isBatch && batchTotal) {
              // Batch operation - show playlist message
              container.addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                  `${queuelist_emoji} Added **${batchTotal}** favorite songs to queue by <@${userId}> (Web Control)`
                )
              );
            } else {
              // Single track
              container.addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                  `${music_disc_emoji} Added to queue: **${track.title}** by <@${userId}> (Web Control)`
                )
              );
            }
            await boundChannel.send({ 
              components: [container], 
              flags: [MessageFlags.IsComponentsV2] 
            });
          } catch (error) {
            console.error('[API] Failed to send track message:', error.message);
          }
        }
        
        // Dynamic import to avoid circular dependencies if any
        import('../log/log.js').then(logger => {
          if (isBatch && batchTotal) {
             if (batchIndex === 0) logger.send_log(`🎵 **${member.user.tag}** added **${batchTotal}** favorite songs to queue in **${guild.name}** (Web Dashboard)`);
          } else {
             logger.send_log(`🎵 **${member.user.tag}** played **${track.title}** in **${guild.name}** (Web Dashboard)`);
          }
        }).catch(err => console.error(err));

        
        // Emit real-time queue update
        const socketHandler = typeof getSocketHandler === 'function' ? getSocketHandler() : getSocketHandler;
        if (socketHandler) {
          console.log('[API] Sending immediate queue update for track:', track.title);
          // Send immediately
          socketHandler.sendQueueUpdate(player);
        } else {
          console.log('[API] ⚠️ No socketHandler available for queue update');
        }
        
        return res.json({ 
          success: true, 
          message: 'Added to queue'
        });
      }
    } catch (error) {
      console.error('[API] Play error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Update LOG_CHANNEL_ID
  router.post('/admin/log-channel', async (req, res) => {
    try {
      const { channelId } = req.body;
      if (!channelId) return res.status(400).json({ error: 'Channel ID required' });
      
      const fs = await import('fs');
      const path = await import('path');
      const envPath = path.resolve(process.cwd(), '.env');
      
      let envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
      
      if (envContent.includes('LOG_CHANNEL_ID=')) {
        envContent = envContent.replace(/LOG_CHANNEL_ID=.*/, `LOG_CHANNEL_ID=${channelId}`);
      } else {
        envContent += `\nLOG_CHANNEL_ID=${channelId}\n`;
      }
      
      fs.writeFileSync(envPath, envContent);
      process.env.LOG_CHANNEL_ID = channelId;
      
      res.json({ success: true, channelId });
    } catch (error) {
      console.error('[API] Error updating log channel:', error);
      res.status(500).json({ error: 'Failed to update log channel' });
    }
  });

  // GET Server Overview Stats & 24/7 Mode Status
  router.get('/guilds/:guildId/overview', async (req, res) => {
    try {
      const { guildId } = req.params;
      let guild = client.guilds.cache.get(guildId);
      if (!guild && client.guilds.fetch) {
        guild = await client.guilds.fetch({ guild: guildId, withCounts: true }).catch(() => null);
      }
      
      const GuildConfig = (await import('../models/Guild.js')).default;
      let config = await GuildConfig.findOne({ guildId });
      if (!config) {
        config = new GuildConfig({ guildId });
        await config.save();
      }

      const player = client.moonlink?.players?.get(guildId);
      let activeVcName = null;
      if (player && player.connected && player.voiceChannel) {
        const vc = guild?.channels?.cache?.get(player.voiceChannel);
        if (vc) activeVcName = vc.name;
      }

      // Calculate VC Hours
      let totalVcMs = config.stats?.totalVcMs || 0;
      if (config.stats?.vcConnectedAt && player && player.connected) {
        totalVcMs += (Date.now() - new Date(config.stats.vcConnectedAt).getTime());
      }
      const totalVcHours = (totalVcMs / (1000 * 60 * 60)).toFixed(1);

      // Sort userActivity and topSongs
      const sortedUsers = [...(config.stats?.userActivity || [])]
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      const sortedSongs = [...(config.stats?.topSongs || [])]
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      const twentyFourSeven = {
        enabled: !!config.settings?.twentyFourSeven?.enabled,
        voiceChannelId: config.settings?.twentyFourSeven?.voiceChannelId || null,
        voiceChannelName: activeVcName || (config.settings?.twentyFourSeven?.voiceChannelId ? guild?.channels?.cache?.get(config.settings.twentyFourSeven.voiceChannelId)?.name : null),
        isConnected: !!(player && player.connected)
      };

      const iconUrl = guild
        ? (guild.iconURL ? guild.iconURL({ size: 256 }) : (guild.icon ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png?size=256` : null))
        : null;

      const memberCount = guild
        ? (guild.memberCount || guild.approximateMemberCount || (guild.members?.cache?.size || 0))
        : 0;

      res.json({
        success: true,
        guild: {
          id: guildId,
          name: guild ? guild.name : 'Tussi Music Server',
          icon: iconUrl || 'https://cdn.discordapp.com/embed/avatars/0.png',
          memberCount: memberCount
        },
        stats: {
          totalVcMs,
          totalVcHours: parseFloat(totalVcHours),
          userActivity: sortedUsers,
          topSongs: sortedSongs
        },
        twentyFourSeven
      });

    } catch (error) {
      console.error('[API] Overview error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // POST Toggle 24/7 VC Mode
  router.post('/guilds/:guildId/247', async (req, res) => {
    try {
      const { guildId } = req.params;
      const { enabled } = req.body;
      const userId = req.headers['x-user-id'];

      const guild = client.guilds.cache.get(guildId);
      if (!guild) {
        return res.status(404).json({ success: false, error: 'Guild not found on Discord' });
      }

      const GuildConfig = (await import('../models/Guild.js')).default;
      let config = await GuildConfig.findOne({ guildId });
      if (!config) config = new GuildConfig({ guildId });

      let player = client.moonlink?.players?.get(guildId);

      if (enabled) {
        // Find target Voice Channel (bot's current VC or user's current VC)
        let targetVcId = player?.voiceChannelId || player?.voiceChannel;
        let member = null;
        if (userId) {
          try {
            member = await guild.members.fetch(userId).catch(() => null);
          } catch (e) {}
        }

        if (!targetVcId && member?.voice?.channelId) {
          targetVcId = member.voice.channelId;
        }

        if (!targetVcId) {
          return res.status(400).json({
            success: false,
            error: 'You or the bot must be in a Voice Channel to enable 24/7 mode!'
          });
        }

        const voiceChannel = guild.channels.cache.get(targetVcId);
        if (!voiceChannel) {
          return res.status(400).json({ success: false, error: 'Target Voice Channel not found' });
        }

        const textChannelId = config.boundChannelId || (member?.voice?.channelId ? voiceChannel.id : (guild.channels.cache.find(c => c.isTextBased())?.id));

        // Connect or update player
        if (!player) {
          player = client.moonlink.players.create({
            guildId: guildId,
            voiceChannelId: targetVcId,
            textChannelId: textChannelId,
            autoLeave: false
          });
        }

        player.autoLeave = false;
        if (!player.connected) {
          await player.connect({ setDeaf: true });
        }

        // Save 24/7 mode configuration in DB
        config.settings.twentyFourSeven = {
          enabled: true,
          voiceChannelId: targetVcId,
          textChannelId: textChannelId
        };

        if (!config.stats.vcConnectedAt) {
          config.stats.vcConnectedAt = new Date();
        }

        await config.save();

        console.log(`[24/7] 🟢 24/7 Mode Enabled in #${voiceChannel.name} for ${guild.name}`);

        return res.json({
          success: true,
          enabled: true,
          voiceChannelName: voiceChannel.name,
          message: `🟢 24/7 VC Mode enabled in #${voiceChannel.name}!`
        });

      } else {
        // Disable 24/7 mode
        config.settings.twentyFourSeven = {
          enabled: false,
          voiceChannelId: null,
          textChannelId: null
        };

        // Update total VC hours before clearing
        if (config.stats?.vcConnectedAt) {
          const elapsed = Date.now() - new Date(config.stats.vcConnectedAt).getTime();
          config.stats.totalVcMs = (config.stats.totalVcMs || 0) + elapsed;
          config.stats.vcConnectedAt = null;
        }

        await config.save();

        if (player && !player.playing && !player.paused) {
          player.destroy();
        }

        console.log(`[24/7] 🔴 24/7 Mode Disabled for ${guild.name}`);

        return res.json({
          success: true,
          enabled: false,
          message: '🔴 24/7 VC Mode disabled.'
        });
      }

    } catch (error) {
      console.error('[API] 24/7 Toggle Error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.use('/api', router);
}

