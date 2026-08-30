import GuildConfig from '../models/Guild.js';
import PremiumUser from '../models/PremiumUser.js';
import mongoose from 'mongoose';
import { MessageFlags, ContainerBuilder, TextDisplayBuilder } from 'discord.js';
import LyricsService from '../services/lyricsService.js';
import { music_card } from '../music-card/card.js';
import { resetPanelToIdle } from '../music-card/idle.js';
import { 
  tick_emoji, 
  skip_emoji, 
  pause_emoji, 
  play_button_emoji, 
  volume_emoji, 
  seek_emoji, 
  loop_emoji, 
  autoplay_emoji, 
  stop_emoji 
} from '../emoji/emoji.js';

class SocketHandler {
  constructor(io, client, manager) {
    this.io = io;
    this.client = client;
    this.manager = manager;
    this.lyricsService = new LyricsService(manager);
    
    // Debounce timers for Discord messages
    this.messageDebounceTimers = new Map(); // guildId -> { action -> { timer, lastValue } }
    this.DEBOUNCE_DELAY = 10000; // 10 seconds
    
    // Set callbacks for lyrics events
    this.lyricsService.setOnLyricsFound((guildId, track, lyrics) => {
      this.emitLyricsData(guildId, track, lyrics);
    });
    
    this.lyricsService.setOnLyricsNotFound((guildId, track) => {
      this.emitLyricsNotFound(guildId, track);
    });
    
    this.setupSocketListeners();
    this.setupMoonlinkListeners();
  }

  setupSocketListeners() {
    this.io.on('connection', (socket) => {
      console.log(`[Socket.io] User connected: ${socket.id}`);
      
      // Get user ID from socket auth (passed from client)
      const authenticatedUserId = socket.handshake.auth?.userId || null;
      
      if (authenticatedUserId) {
        console.log(`[Socket.io] Authenticated user: ${authenticatedUserId}`);
      } else {
        console.log(`[Socket.io] No user ID in auth - unauthenticated connection`);
      }
      
      // Store authenticated user ID on socket
      socket.authenticatedUserId = authenticatedUserId;

      socket.on('join-guild', async (data) => {
        // Handle both string (old format) and object (new format)
        const guildId = typeof data === 'string' ? data : data.guildId;
        const userId = typeof data === 'string' ? null : data.userId;
        
        socket.join(`guild:${guildId}`);
        console.log(`[Socket.io] User ${socket.id} joined guild:${guildId}`);
        socket.currentGuildId = guildId;
        
        if (userId) {
          try {
            const user = await this.client.users.fetch(userId);
            if (!this.activeUsers) this.activeUsers = new Map();
            if (!this.activeUsers.has(guildId)) this.activeUsers.set(guildId, new Map());
            
            const premiumUser = await PremiumUser.findOne({ userId });
            let isUserPremium = false;
            if (mongoose.connection && mongoose.connection.db) {
              const settings = await mongoose.connection.db.collection('settings').findOne({ _id: 'site_config' });
              const systemActive = settings && typeof settings.premiumEnabled !== 'undefined' ? settings.premiumEnabled : false;
              if (!systemActive) {
                isUserPremium = true;
              } else if (premiumUser) {
                const now = new Date();
                if (!premiumUser.expiresAt || premiumUser.expiresAt > now) {
                  isUserPremium = true;
                }
              }
            } else {
              isUserPremium = !!premiumUser;
            }

            this.activeUsers.get(guildId).set(socket.id, {
              id: user.id,
              tag: user.tag,
              avatar: user.avatar,
              isPremium: isUserPremium
            });
            
            this.io.to(`guild:${guildId}`).emit('active-users', Array.from(this.activeUsers.get(guildId).values()));
          } catch(e) {
            console.error('[Socket.io] Failed to fetch user for active tracking:', e);
          }
        }
        
        // Send current state immediately
        await this.sendCurrentState(socket, guildId);
        
        // Clean up any existing sync interval on this socket to prevent memory leak
        if (socket.syncInterval) {
          clearInterval(socket.syncInterval);
        }

        // Send player_sync every 1 second for smooth 60fps interpolation and status tracking
        socket.syncInterval = setInterval(() => {
          const player = this.manager.players.get(guildId);
          if (player && player.current) {
            const now = Date.now();
            if (!player.lastSyncTime || typeof player.estimatedPosition !== 'number') {
              player.lastSyncTime = now;
              player.estimatedPosition = typeof player.position === 'number' ? player.position : (player.current.position || 0);
            }
            if (!player.paused) {
              const delta = now - player.lastSyncTime;
              player.estimatedPosition += delta;
            }
            player.lastSyncTime = now;

            // Realign if Lavalink position updated by seek or major drift (>3000ms)
            if (typeof player.position === 'number' && Math.abs(player.estimatedPosition - player.position) > 3000) {
              player.estimatedPosition = player.position;
            }

            socket.emit('player_sync', {
              position: Math.round(player.estimatedPosition),
              isPlaying: !player.paused,
              isDestroyed: false,
              timestamp: now
            });
          } else if (player) {
            socket.emit('player_sync', {
              position: 0,
              isPlaying: false,
              isDestroyed: false,
              timestamp: Date.now()
            });
          } else {
            socket.emit('player_sync', {
              position: 0,
              isPlaying: false,
              isDestroyed: true,
              timestamp: Date.now()
            });
          }
        }, 1000);

        // Clean up interval on disconnect
        socket.on('disconnect', () => {
          if (socket.syncInterval) {
            clearInterval(socket.syncInterval);
          }
        });
      });

      socket.on('request-sync', async (data) => {
        console.log('[Socket.io] Sync requested by socket:', socket.id, 'for guild:', data.guildId);
        await this.sendCurrentState(socket, data.guildId);
      });

      socket.on('request-lyrics', async (data) => {
        console.log('[Socket.io] Lyrics requested by socket:', socket.id, 'for guild:', data.guildId, 'forceRefresh:', Boolean(data?.forceRefresh));
        const player = this.manager.players.get(data.guildId);
        if (player && player.current) {
          const cachedLyrics = await this.lyricsService.fetchLyrics(player, Boolean(data?.forceRefresh));
          
          if (cachedLyrics) {
            // Cache hit or LRCLIB hit - emit directly to requesting socket
            console.log('[Socket Handler] ✅ Sending lyrics to requesting socket:', socket.id);
            socket.emit('lyrics_data', {
              title: player.current.title,
              author: player.current.author,
              lyrics: cachedLyrics.lyrics,
              synced: true,
              source: cachedLyrics.source,
              cached: cachedLyrics.cached || false
            });
          } else {
            console.log('[Socket Handler] ⏳ Waiting for lyrics events...');
          }
        } else {
          console.log('[Socket.io] No player or track for lyrics request');
          socket.emit('lyrics_not_found', {
            title: 'Unknown',
            author: 'Unknown',
            message: 'No track currently playing'
          });
        }
      });

      socket.on('player-action', async (data) => {
        await this.handlePlayerAction(socket, data);
      });

      socket.on('disconnect', () => {
        console.log(`[Socket.io] User disconnected: ${socket.id}`);
        if (socket.syncInterval) {
          clearInterval(socket.syncInterval);
        }
        if (socket.currentGuildId && this.activeUsers && this.activeUsers.has(socket.currentGuildId)) {
          this.activeUsers.get(socket.currentGuildId).delete(socket.id);
          this.io.to(`guild:${socket.currentGuildId}`).emit('active-users', Array.from(this.activeUsers.get(socket.currentGuildId).values()));
        }
      });
    });
  }

  async sendBotMessage(channel, content) {
    if (!channel) return;
    try {
      const container = new ContainerBuilder();
      container.addTextDisplayComponents(new TextDisplayBuilder().setContent(content));
      const msg = await channel.send({ components: [container], flags: [MessageFlags.IsComponentsV2] });
      setTimeout(() => msg.delete().catch(() => {}), 5000);
    } catch (error) {
      console.error('[Socket Handler] Failed to send message:', error.message);
    }
  }

  /**
   * Send a debounced message to Discord
   * Waits 10 seconds after last interaction before sending
   * Prevents spam for volume and seek actions
   */
  async sendDebouncedBotMessage(guildId, action, channel, content, value) {
    if (!channel) return;

    // Initialize guild debounce map if not exists
    if (!this.messageDebounceTimers.has(guildId)) {
      this.messageDebounceTimers.set(guildId, new Map());
    }

    const guildTimers = this.messageDebounceTimers.get(guildId);

    // Clear existing timer for this action
    if (guildTimers.has(action)) {
      const existing = guildTimers.get(action);
      clearTimeout(existing.timer);
    }

    // Set new timer
    const timer = setTimeout(async () => {
      await this.sendBotMessage(channel, content);
      guildTimers.delete(action);
    }, this.DEBOUNCE_DELAY);

    // Store timer and value
    guildTimers.set(action, { timer, lastValue: value });
  }

  async handlePlayerAction(socket, { guildId, userId, action, value }) {
    try {
      // Security: Verify userId matches authenticated session
      if (socket.authenticatedUserId && userId !== socket.authenticatedUserId) {
        console.warn(`[Socket Handler] Security: Socket ${socket.id} (auth: ${socket.authenticatedUserId}) attempted to use userId ${userId}`);
        return socket.emit('error', { message: '❌ No autorizado: El ID de usuario no coincide' });
      }
      
      if (!socket.authenticatedUserId) {
        console.warn(`[Socket Handler] Security: Unauthenticated socket ${socket.id} attempted action`);
        return socket.emit('error', { message: '❌ Por favor inicia sesión con Discord primero' });
      }
      
      const guild = this.client.guilds.cache.get(guildId);
      if (!guild) return socket.emit('error', { message: 'Servidor no encontrado' });

      const member = await guild.members.fetch(userId);
      const player = this.manager.players.get(guildId);

      if (!player) {
        return socket.emit('error', { message: '❌ ¡No hay nada reproduciéndose en este servidor!' });
      }

      // Verify user is in same voice channel as bot
      const botVoiceChannel = guild.members.me?.voice?.channel;
      
      // If player exists but bot is physically disconnected, it's a bugged state
      if (!botVoiceChannel) {
        player.destroy();
        return socket.emit('error', { message: '🔄 El estado del reproductor se desincronizó y ha sido reiniciado. Por favor añade la canción de nuevo.' });
      }

      if (!member.voice.channel || member.voice.channel.id !== botVoiceChannel.id) {
        return socket.emit('error', { message: '❌ ¡Necesitas estar en el mismo canal de voz que el bot!' });
      }

      const guildConfig = await GuildConfig.findOne({ guildId });
      const boundChannel = guildConfig?.requestChannel?.channelId 
        ? guild.channels.cache.get(guildConfig.requestChannel.channelId) 
        : null;

      const tick = tick_emoji;
      const currentTrack = player.current;

      // Execute player actions
      switch (action) {
        case 'skip':
          // Allow skip if queue has songs OR autoplay is enabled
          if (player.queue.all.length === 0 && !player.autoPlay) {
            return socket.emit('error', { message: '❌ ¡La cola está vacía! Activa la reproducción automática para saltar a canciones relacionadas.' });
          }
          player.skip();
          await this.sendBotMessage(boundChannel, `${skip_emoji} Saltada: **${currentTrack?.title}** por <@${userId}> (Control Web)`);
          
          // Send queue update after a short delay to ensure skip is processed
          setTimeout(() => {
            this.sendQueueUpdate(player);
          }, 100);
          break;

        case 'pause':
          if (player.paused) {
            return socket.emit('error', { message: '❌ ¡El reproductor ya está pausado!' });
          }
          player.pause();
          player.manuallyPaused = true;
          player.autoPausedBy247 = false;
          this.broadcastStateUpdate(guildId);
          await this.sendBotMessage(boundChannel, `${pause_emoji} Canción pausada por <@${userId}> (Control Web)`);
          this.sendQueueUpdate(player);
          if (player.current) await music_card(this.client, player, player.current);
          break;

        case 'resume':
          if (!player.paused) {
            return socket.emit('error', { message: '❌ ¡El reproductor ya se está reproduciendo!' });
          }
          player.resume();
          player.manuallyPaused = false;
          player.autoPausedBy247 = false;
          this.broadcastStateUpdate(guildId);
          await this.sendBotMessage(boundChannel, `${play_button_emoji} Canción reanudada por <@${userId}> (Control Web)`);
          this.sendQueueUpdate(player);
          if (player.current) await music_card(this.client, player, player.current);
          break;

        case 'seek':
          player.seek(value);
          this.broadcastStateUpdate(guildId);
          // Debounced message - only send after 10s of no interaction
          this.sendDebouncedBotMessage(
            guildId,
            'seek',
            boundChannel,
            `${seek_emoji} Adelantado a **${this.formatTime(value)}** por <@${userId}> (Control Web)`,
            value
          );
          break;

        case 'volume':
          if (value < 0 || value > 100) {
            return socket.emit('error', { message: '❌ ¡El volumen debe estar entre 0 y 100!' });
          }
          player.setVolume(value);
          if (guildConfig) {
            guildConfig.settings.volume = value;
            await guildConfig.save();
          }
          this.broadcastStateUpdate(guildId);
          // Debounced message - only send after 10s of no interaction
          this.sendDebouncedBotMessage(
            guildId,
            'volume',
            boundChannel,
            `${volume_emoji} Volumen establecido al **${value}%** por <@${userId}> (Control Web)`,
            value
          );
          break;

        case 'loop':
          player.setLoop(value);
          if (guildConfig) {
            guildConfig.settings.loopMode = value;
            await guildConfig.save();
          }
          this.broadcastStateUpdate(guildId);
          const loopText = value === 'off' ? 'desactivado' : value === 'track' ? 'canción' : 'cola';
          await this.sendBotMessage(boundChannel, `${loop_emoji} Modo de bucle establecido en **${loopText}** por <@${userId}> (Control Web)`);
          break;

        case 'autoplay':
          player.setAutoPlay(value);
          if (guildConfig) {
            guildConfig.settings.autoplay = value;
            await guildConfig.save();
          }
          this.broadcastStateUpdate(guildId);
          await this.sendBotMessage(boundChannel, `${autoplay_emoji} Reproducción automática **${value ? 'activada' : 'desactivada'}** por <@${userId}> (Control Web)`);
          break;

        case 'previous':
        case 'back':
          if (typeof player.back === 'function') {
            player.back();
          } else if (typeof player.previous === 'function') {
            player.previous();
          }
          await this.sendBotMessage(boundChannel, `${skip_emoji} Reproduciendo pista anterior por <@${userId}> (Control Web)`);
          
          // Send queue update after a short delay
          setTimeout(() => {
            this.sendQueueUpdate(player);
          }, 100);
          break;

        case 'stop':
          {
            const GuildConfig = (await import('../models/Guild.js')).default;
            const config = await GuildConfig.findOne({ guildId });
            const is247 = config && config.settings?.twentyFourSeven?.enabled;

            player.queue.clear();
            player.stop();
            await resetPanelToIdle(this.client, guildId, player);

            if (!is247) {
              player.destroy();
              this.io.to(`guild:${guildId}`).emit('player-destroyed');
            } else {
              console.log(`[Socket Handler] 24/7 active for ${guildId}, stopped playback & cleared queue without destroying player or leaving VC.`);
              this.sendQueueUpdate(player);
            }
            await this.sendBotMessage(boundChannel, `${stop_emoji} Reproductor detenido por <@${userId}> (Control Web)`);
          }
          break;

        case 'filter':
          // Apply audio filter
          const filterName = value.toLowerCase();
          let appliedFilter = '';

          try {
            console.log(`[Socket Handler] Applying filter: ${filterName} for guild ${guildId}`);

            switch (filterName) {
              case 'nightcore':
                await player.filters.enable('nightcore');
                await player.filters.apply();
                appliedFilter = 'Nightcore';
                break;

              case 'vibrato':
                player.filters.setVibrato({ frequency: 2.0, depth: 0.5 });
                await player.filters.apply();
                appliedFilter = 'Vibrato';
                break;

              case 'karaoke':
                player.filters.setKaraoke({ level: 1.0, monoLevel: 1.0 });
                await player.filters.apply();
                appliedFilter = 'Karaoke';
                break;

              case 'rotation':
                player.filters.setRotation({ rotationHz: 0.2 });
                await player.filters.apply();
                appliedFilter = 'Rotation';
                break;

              case 'equalizer':
                player.filters.setEqualizer([
                  { band: 0, gain: 0.2 },
                  { band: 1, gain: 0.15 },
                ]);
                await player.filters.apply();
                appliedFilter = 'Equalizer';
                break;

              case 'lowpass':
                player.filters.setLowPass({ smoothing: 20 });
                await player.filters.apply();
                appliedFilter = 'Lowpass';
                break;

              case 'distortion':
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
                appliedFilter = 'Distortion';
                break;

              case 'tremolo':
                player.filters.setTremolo({ frequency: 2.0, depth: 0.5 });
                await player.filters.apply();
                appliedFilter = 'Tremolo';
                break;

              case 'reset':
                player.filters.clear();
                await player.filters.apply();
                console.log(`[Socket Handler] Filters cleared successfully`);
                await this.sendBotMessage(boundChannel, `${tick} Filtros eliminados por <@${userId}> (Control Web)`);
                return;

              default:
                console.log(`[Socket Handler] Unknown filter: ${filterName}`);
                return socket.emit('error', { message: `❌ Filtro desconocido: ${filterName}` });
            }

            console.log(`[Socket Handler] Filter ${appliedFilter} applied successfully`);
            await this.sendBotMessage(boundChannel, `${tick} Filtro aplicado: **${appliedFilter}** por <@${userId}> (Control Web)`);
          } catch (filterError) {
            console.error(`[Socket Handler] Filter error:`, filterError);
            return socket.emit('error', { message: `❌ Error al aplicar el filtro: ${filterError.message}` });
          }
          break;
      }

      this.io.to(`guild:${guildId}`).emit('player-update', {
        action,
        value,
        timestamp: Date.now()
      });

    } catch (error) {
      console.error('[Socket Handler] Error:', error);
      socket.emit('error', { message: `❌ ${error.message}` });
    }
  }

  setupMoonlinkListeners() {
    // Track starts playing
    this.manager.on('trackStart', async (player, track) => {
      const guildId = player.guildId;
      
      const trackData = {
        title: track.title,
        author: track.author,
        duration: track.duration,
        artwork: track.artworkUrl || track.thumbnail || 'https://via.placeholder.com/500',
        url: track.url || track.uri,
        requester: {
          tag: track.requester?.tag || track.requester?.username || 'Unknown',
          id: track.requester?.id || null,
          avatar: track.requester?.avatar || null
        },
        position: 0,
        volume: player.volume,
        paused: player.paused,
        loopMode: player.loop || 'off',
        autoplay: player.autoPlay || false
      };

      this.io.to(`guild:${guildId}`).emit('track-start', trackData);
      this.sendQueueUpdate(player);

      // Fetch lyrics using Moonlink v5 API
      await this.fetchAndEmitLyrics(player);
    });

    // Track ends
    this.manager.on('trackEnd', (player, track) => {
      this.io.to(`guild:${player.guildId}`).emit('track-end', {
        title: track.title
      });
      this.sendQueueUpdate(player);
    });

    // Queue ends
    this.manager.on('queueEnd', (player) => {
      this.io.to(`guild:${player.guildId}`).emit('queue-end');
      this.io.to(`guild:${player.guildId}`).emit('queue-update', []);
    });

    // Live high-precision player position update from audio engine
    this.manager.on('playerUpdate', (player) => {
      if (!player || !player.guildId) return;
      const position = typeof player.position === 'number' ? player.position : (player.current?.position || 0);
      this.io.to(`guild:${player.guildId}`).emit('player_sync', {
        position,
        isPlaying: !player.paused,
        timestamp: Date.now()
      });
    });

    // Player destroyed
    this.manager.on('playerDestroy', (player) => {
      this.io.to(`guild:${player.guildId}`).emit('player-destroyed');
      this.io.to(`guild:${player.guildId}`).emit('player_sync', {
        position: 0,
        isPlaying: false,
        isDestroyed: true,
        timestamp: Date.now()
      });
    });
  }

  broadcastStateUpdate(guildId) {
    const player = this.manager.players.get(guildId);
    if (!player) return;
    const position = typeof player.position === 'number' ? player.position : (player.current?.position || 0);
    this.io.to(`guild:${guildId}`).emit('player_sync', {
      position,
      isPlaying: !player.paused,
      timestamp: Date.now()
    });
    this.io.to(`guild:${guildId}`).emit('player-update', {
      paused: player.paused,
      volume: player.volume,
      loopMode: player.loop || 'off',
      autoplay: player.autoPlay || false,
      position
    });
  }

  sendQueueUpdate(player) {
    const queueTracks = player.queue.all || player.queue || [];
    const queueData = queueTracks.map(t => ({
      title: t.title,
      author: t.author,
      duration: t.duration,
      artwork: t.artworkUrl || t.thumbnail || 'https://via.placeholder.com/500',
      requester: {
        tag: t.requester?.tag || t.requester?.username || 'Unknown',
        id: t.requester?.id || null,
        avatar: t.requester?.avatar || null
      }
    }));

    console.log(`[Queue Update] Sending ${queueData.length} tracks for guild ${player.guildId}`);
    this.io.to(`guild:${player.guildId}`).emit('queue-update', queueData);
  }

  async sendCurrentState(socket, guildId) {
    const player = this.manager.players.get(guildId);
    if (!player) {
      console.log('[Socket Handler] No player active for guild:', guildId);
      socket.emit('current-state', {
        track: null,
        queue: [],
        settings: {
          volume: 100,
          paused: true,
          loopMode: 'off',
          autoplay: false
        },
        guildSettings: {}
      });
      return;
    }

    const guildConfig = await GuildConfig.findOne({ guildId });
    const queueTracks = player.queue.all || player.queue || [];
    const currentPosition = typeof player.position === 'number' ? player.position : (player.current?.position || 0);

    console.log('[Socket Handler] Sending current state to socket:', socket.id);
    socket.emit('current-state', {
      track: player.current ? {
        title: player.current.title,
        author: player.current.author,
        duration: player.current.duration,
        artwork: player.current.artworkUrl || player.current.thumbnail || 'https://via.placeholder.com/500',
        url: player.current.url || player.current.uri,
        position: currentPosition,
        requester: {
          tag: player.current.requester?.tag || player.current.requester?.username || 'Unknown',
          id: player.current.requester?.id || null,
          avatar: player.current.requester?.avatar || null
        }
      } : null,
      queue: queueTracks.map(t => ({
        title: t.title,
        author: t.author,
        duration: t.duration,
        artwork: t.artworkUrl || t.thumbnail || 'https://via.placeholder.com/500',
        requester: {
          tag: t.requester?.tag || t.requester?.username || 'Unknown',
          id: t.requester?.id || null,
          avatar: t.requester?.avatar || null
        }
      })),
      settings: {
        volume: player.volume,
        paused: player.paused,
        loopMode: player.loop || 'off',
        autoplay: player.autoPlay || false
      },
      guildSettings: guildConfig?.settings || {}
    });

    // Fetch lyrics and emit directly to this socket (not to room)
    console.log('[Socket Handler] 🎵 Fetching lyrics for socket:', socket.id);
    const cachedLyrics = await this.lyricsService.fetchLyrics(player);
    
    if (cachedLyrics) {
      // Cache hit - emit directly to this socket
      console.log('[Socket Handler] ✅ Emitting cached lyrics directly to socket:', socket.id);
      socket.emit('lyrics_data', {
        title: player.current.title,
        author: player.current.author,
        lyrics: cachedLyrics.lyrics,
        synced: true,
        source: cachedLyrics.source,
        cached: true
      });
    }
    // If no cache, the lyricsFound/lyricsNotFound events will handle it
  }

  formatTime(ms) {
    const seconds = Math.floor(ms / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * Fetch lyrics using Moonlink v5 API
   * Uses player.subscribeLyrics() which triggers lyricsFound or lyricsNotFound events
   */
  async fetchAndEmitLyrics(player) {
    try {
      const track = player.current;
      if (!track) return;

      console.log('[Socket Handler] 🎵 Fetching lyrics for:', track.title, '-', track.author);
      
      // Check cache first
      const cachedLyrics = await this.lyricsService.fetchLyrics(player);
      
      if (cachedLyrics) {
        // Cache hit - emit immediately
        this.emitLyricsData(player.guildId, track, cachedLyrics.lyrics);
      }
      // If no cache, fetchLyrics() already called player.subscribeLyrics()
      // The lyricsFound or lyricsNotFound events will handle emitting

    } catch (error) {
      console.error('[Socket Handler] ❌ Error fetching lyrics:', error.message);
      this.emitLyricsNotFound(player.guildId, player.current);
    }
  }

  /**
   * Emit lyrics_data to clients
   */
  emitLyricsData(guildId, track, lyrics) {
    console.log('[Socket Handler] ✅ Emitting lyrics_data with', lyrics.length, 'lines to guild:', guildId);
    this.io.to(`guild:${guildId}`).emit('lyrics_data', {
      title: track.title,
      author: track.author,
      lyrics: lyrics,
      synced: true,
      source: 'deezer',
      cached: true
    });
  }

  /**
   * Emit lyrics_not_found to clients
   */
  emitLyricsNotFound(guildId, track) {
    console.log('[Socket Handler] ⚠️ Emitting lyrics_not_found to guild:', guildId);
    this.io.to(`guild:${guildId}`).emit('lyrics_not_found', {
      title: track.title,
      author: track.author,
      message: 'No lyrics found on Deezer.'
    });
  }
}

export default SocketHandler;
