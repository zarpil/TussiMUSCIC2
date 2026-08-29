import Lyrics from '../models/Lyrics.js';

/**
 * High-Performance Lyrics Service for Moonlink v5.0.0
 * Uses player.subscribeLyrics() and Moonlink events
 * Events: lyricsFound, lyricsLine, lyricsNotFound
 */
class LyricsService {
  constructor(manager) {
    this.manager = manager;
    this.setupLyricsListeners();
  }

  /**
   * Helper to normalize raw time to SECONDS cleanly
   */
  normalizeTime(rawTime) {
    if (typeof rawTime !== 'number' || isNaN(rawTime) || rawTime <= 0) return 0;
    // If rawTime is in milliseconds (e.g. 12340 ms), convert to seconds (12.34 s)
    // If rawTime is already in seconds (e.g. 12.34 s), keep as seconds
    const seconds = rawTime > 1000 ? rawTime / 1000 : rawTime;
    return Math.round(seconds * 1000) / 1000;
  }

  /**
   * Setup Moonlink v5 lyrics event listeners
   * These events are triggered when player.subscribeLyrics() is called
   */
  setupLyricsListeners() {
    // Event: Lyrics found and ready
    this.manager.on('lyricsFound', async (player, lyrics) => {
      console.log('[Lyrics Service] ✅ lyricsFound event:', player.current?.title);
      
      try {
        const track = player.current;
        if (!track) return;

        // Parse lyrics from Moonlink format
        let parsedLyrics = this.parseMoonlinkLyrics(lyrics);
        let isSynced = parsedLyrics.some(line => typeof line.time === 'number' && line.time > 0);

        // If Moonlink lyrics are NOT synced, query LRCLIB first for guaranteed synced lyrics!
        if (!isSynced && track.title && track.author) {
          console.log('[Lyrics Service] ℹ️ Moonlink returned unsynced lyrics. Checking LRCLIB for synced lyrics...');
          const lrclibResult = await this.fetchLyricsFromLRCLIB(track.title, track.author, track.duration);
          if (lrclibResult && lrclibResult.synced && Array.isArray(lrclibResult.lyrics) && lrclibResult.lyrics.length > 0) {
            console.log('[Lyrics Service] 🎯 Successfully fetched LRCLIB synced lyrics to replace unsynced Moonlink lyrics!');
            parsedLyrics = lrclibResult.lyrics;
            isSynced = true;
          }
        }

        if (parsedLyrics.length === 0) {
          console.log('[Lyrics Service] ⚠️ No valid lyrics after parsing');
          return;
        }

        console.log(`[Lyrics Service] ✅ Emitting ${parsedLyrics.length} ${isSynced ? 'synchronized' : 'plain'} lines`);

        // Cache in MongoDB (upsert so synced lyrics overwrite any stale unsynced entries)
        await this.cacheLyrics(track, parsedLyrics);

        // Emit to Socket.io (handled by SocketHandler)
        if (this.onLyricsFound) {
          this.onLyricsFound(player.guildId, track, parsedLyrics);
        }

      } catch (error) {
        console.error('[Lyrics Service] ❌ Error processing lyricsFound:', error.message);
      }
    });

    // Event: Individual lyric line (real-time sync)
    this.manager.on('lyricsLine', (player, line) => {
      // Handled via client-side interpolation
    });

    // Event: No lyrics found
    this.manager.on('lyricsNotFound', async (player) => {
      console.log('[Lyrics Service] ⚠️ lyricsNotFound event:', player.current?.title);
      
      const track = player.current;
      if (!track) return;

      // Try LRCLIB before reporting lyricsNotFound
      const lrclibResult = await this.fetchLyricsFromLRCLIB(track.title, track.author, track.duration);
      if (lrclibResult && lrclibResult.lyrics && lrclibResult.lyrics.length > 0) {
        console.log('[Lyrics Service] 🎯 Recovered lyrics from LRCLIB after lyricsNotFound event!');
        await this.cacheLyrics(track, lrclibResult.lyrics);
        if (this.onLyricsFound) {
          this.onLyricsFound(player.guildId, track, lrclibResult.lyrics);
        }
        return;
      }

      // Emit to Socket.io (handled by SocketHandler)
      if (this.onLyricsNotFound) {
        this.onLyricsNotFound(player.guildId, track);
      }
    });

    console.log('[Lyrics Service] 🎵 Moonlink v5 lyrics listeners registered');
  }

  /**
   * Parse Moonlink v5 lyrics format into our format
   * Moonlink provides lyrics in various formats depending on NodeLink version
   */
  parseMoonlinkLyrics(lyrics) {
    const parsed = [];
    let id = 0;

    try {
      if (Array.isArray(lyrics)) {
        for (const line of lyrics) {
          const text = line.line || line.text || line.content || '';
          const rawTime = line.timestamp || line.start || line.time || 0;
          
          if (text && text.trim()) {
            const trimmedText = text.trim();
            if (!trimmedText.match(/^\[.*\]$/)) {
              parsed.push({
                id: id++,
                time: this.normalizeTime(rawTime),
                text: trimmedText
              });
            }
          }
        }
      } else if (lyrics && lyrics.lyrics && lyrics.lyrics.lines && Array.isArray(lyrics.lyrics.lines)) {
        for (const line of lyrics.lyrics.lines) {
          const text = line.line || line.text || line.content || '';
          const rawTime = line.timestamp || line.start || line.time || 0;
          
          if (text && text.trim()) {
            const trimmedText = text.trim();
            if (!trimmedText.match(/^\[.*\]$/)) {
              parsed.push({
                id: id++,
                time: this.normalizeTime(rawTime),
                text: trimmedText
              });
            }
          }
        }
      } else if (lyrics && lyrics.lines && Array.isArray(lyrics.lines)) {
        for (const line of lyrics.lines) {
          const text = line.line || line.text || line.content || '';
          const rawTime = line.timestamp || line.start || line.time || 0;
          
          if (text && text.trim()) {
            const trimmedText = text.trim();
            if (!trimmedText.match(/^\[.*\]$/)) {
              parsed.push({
                id: id++,
                time: this.normalizeTime(rawTime),
                text: trimmedText
              });
            }
          }
        }
      } else if (lyrics && lyrics.data && Array.isArray(lyrics.data)) {
        for (const line of lyrics.data) {
          const text = line.line || line.text || line.content || '';
          const rawTime = line.timestamp || line.start || line.time || 0;
          
          if (text && text.trim()) {
            const trimmedText = text.trim();
            if (!trimmedText.match(/^\[.*\]$/)) {
              parsed.push({
                id: id++,
                time: this.normalizeTime(rawTime),
                text: trimmedText
              });
            }
          }
        }
      } else if (lyrics && lyrics.lyrics && typeof lyrics.lyrics.text === 'string') {
        parsed.push(...this.parseLRC(lyrics.lyrics.text));
      } else if (typeof lyrics === 'string') {
        parsed.push(...this.parseLRC(lyrics));
      } else if (lyrics && lyrics.text && typeof lyrics.text === 'string') {
        parsed.push(...this.parseLRC(lyrics.text));
      }

      // Filter out empty lines
      const filtered = parsed.filter(line => line.text);
      
      // Check if lyrics are synced (have non-zero timestamps)
      const hasSyncedTimestamps = filtered.some(line => line.time > 0);
      if (!hasSyncedTimestamps && filtered.length > 0) {
        filtered.forEach((line) => {
          line.time = -1;
        });
      }
      
      return filtered;

    } catch (error) {
      console.error('[Lyrics Service] ❌ Error parsing lyrics:', error.message);
      return [];
    }
  }

  /**
   * Parse LRC format string (fallback)
   */
  parseLRC(lrcString) {
    const lines = lrcString.split('\n');
    const lyrics = [];
    let id = 0;

    for (const line of lines) {
      const match = line.match(/\[(\d{2}):(\d{2})\.?(\d{2,3})?\](.*)/);
      
      if (match) {
        const minutes = parseInt(match[1], 10);
        const seconds = parseInt(match[2], 10);
        const centiseconds = match[3] ? parseInt(match[3].padEnd(3, '0'), 10) : 0;
        const text = match[4].trim();

        if (text) {
          const time = Math.round((minutes * 60 + seconds + centiseconds / 1000) * 1000) / 1000;
          lyrics.push({ id: id++, time, text });
        }
      }
    }

    return lyrics.sort((a, b) => a.time - b.time);
  }

  /**
   * Cache lyrics in MongoDB (using findOneAndUpdate upsert)
   */
  async cacheLyrics(track, lyrics) {
    try {
      const trackIdentifier = track.identifier;
      const isSynced = lyrics.some(line => typeof line.time === 'number' && line.time > 0);
      
      await Lyrics.findOneAndUpdate(
        { trackIdentifier },
        {
          trackIdentifier,
          title: track.title,
          artist: track.author,
          lyrics,
          synced: isSynced,
          source: isSynced ? 'lrclib' : 'deezer',
          fetchedAt: new Date()
        },
        { upsert: true, new: true }
      );
      
      console.log(`[Lyrics Service] 💾 Saved ${isSynced ? 'synced' : 'plain'} lyrics in MongoDB: ${track.title} - ${track.author}`);
    } catch (error) {
      console.error('[Lyrics Service] ❌ Cache error:', error.message);
    }
  }

  /**
   * Fetch real synced lyrics from LRCLIB API
   */
  async fetchLyricsFromLRCLIB(title, author, duration) {
    try {
      const cleanTitle = (title || '')
        .replace(/\(official\s*(music\s*)?video\)/gi, '')
        .replace(/\[official\s*(music\s*)?video\]/gi, '')
        .replace(/\(lyric\s*video\)/gi, '')
        .replace(/\[lyric\s*video\]/gi, '')
        .replace(/\(audio\)/gi, '')
        .replace(/\[audio\]/gi, '')
        .replace(/\(remastered(\s*\d+)?\)/gi, '')
        .replace(/\[remastered(\s*\d+)?\]/gi, '')
        .replace(/\(feat\..*?\)/gi, '')
        .replace(/\[feat\..*?\]/gi, '')
        .replace(/\(ft\..*?\)/gi, '')
        .replace(/\[ft\..*?\]/gi, '')
        .trim();

      const cleanAuthor = (author || '').replace(/-\s*topic/gi, '').trim();

      console.log(`[Lyrics Service] 🌐 Fetching LRCLIB for: "${cleanTitle}" by "${cleanAuthor}"`);

      // 1. Try exact get endpoint first
      const getUrl = `https://lrclib.net/api/get?artist_name=${encodeURIComponent(cleanAuthor)}&track_name=${encodeURIComponent(cleanTitle)}${duration ? `&duration=${Math.round(duration / 1000)}` : ''}`;
      const getRes = await fetch(getUrl);
      let exactData = null;
      if (getRes.ok) {
        exactData = await getRes.json();
        if (exactData && exactData.syncedLyrics) {
          const parsed = this.parseLRC(exactData.syncedLyrics);
          if (parsed.length > 0) {
            console.log(`[Lyrics Service] ✅ Found LRCLIB exact synced lyrics (${parsed.length} lines)`);
            return { lyrics: parsed, synced: true, source: 'lrclib' };
          }
        }
      }

      // 2. Search LRCLIB fallback
      const searchQuery = `${cleanAuthor} ${cleanTitle}`.trim();
      const searchRes = await fetch(`https://lrclib.net/api/search?q=${encodeURIComponent(searchQuery)}`);
      if (searchRes.ok) {
        const results = await searchRes.json();
        if (Array.isArray(results) && results.length > 0) {
          const syncedTrack = results.find(r => r.syncedLyrics);
          if (syncedTrack && syncedTrack.syncedLyrics) {
            const parsed = this.parseLRC(syncedTrack.syncedLyrics);
            if (parsed.length > 0) {
              console.log(`[Lyrics Service] ✅ Found LRCLIB search synced lyrics (${parsed.length} lines)`);
              return { lyrics: parsed, synced: true, source: 'lrclib' };
            }
          }

          // Fallback to plain (unsynced) lyrics from search results if synced not available
          const plainTrack = results.find(r => r.plainLyrics);
          if (plainTrack && plainTrack.plainLyrics) {
            const lines = plainTrack.plainLyrics.split('\n').map((l, i) => ({
              id: i,
              time: -1,
              text: l.trim()
            })).filter(l => l.text);
            if (lines.length > 0) {
              console.log(`[Lyrics Service] ℹ️ Found LRCLIB unsynced plain lyrics (${lines.length} lines)`);
              return { lyrics: lines, synced: false, source: 'lrclib' };
            }
          }
        }
      }

      // 3. Fallback to exact plain lyrics if search had no plain lyrics
      if (exactData && exactData.plainLyrics) {
        const lines = exactData.plainLyrics.split('\n').map((l, i) => ({
          id: i,
          time: -1,
          text: l.trim()
        })).filter(l => l.text);
        if (lines.length > 0) {
          console.log(`[Lyrics Service] ℹ️ Found LRCLIB exact unsynced plain lyrics (${lines.length} lines)`);
          return { lyrics: lines, synced: false, source: 'lrclib' };
        }
      }
    } catch (err) {
      console.error('[Lyrics Service] ❌ LRCLIB fetch error:', err.message);
    }
    return null;
  }

  /**
   * Fetch lyrics for a track (checks cache first, then LRCLIB, then subscribes)
   * @param {Object} player - Moonlink player object
   * @param {boolean} forceRefresh - If true, bypass cache and fetch fresh
   * @returns {Promise<Object|null>} Cached or LRCLIB lyrics or null
   */
  async fetchLyrics(player, forceRefresh = false) {
    try {
      const track = player.current;
      if (!track) {
        console.log('[Lyrics Service] ⚠️ No current track');
        return null;
      }

      const trackIdentifier = track.identifier;
      const trackTitle = track.title;
      const trackAuthor = track.author;
      
      // Check MongoDB cache first for SYNCED lyrics (unless forceRefresh)
      if (!forceRefresh) {
        const cachedLyrics = await Lyrics.findOne({ trackIdentifier });
        if (cachedLyrics && cachedLyrics.synced && Array.isArray(cachedLyrics.lyrics) && cachedLyrics.lyrics.length > 0) {
          const isFakeTiming = cachedLyrics.lyrics.every((line, idx) => line.time === idx * 3);
          const isCorruptedSync = cachedLyrics.lyrics.length > 5 && cachedLyrics.lyrics.slice(5).every(line => line.time > 0 && line.time < 2);

          if (!isFakeTiming && !isCorruptedSync) {
            console.log('[Lyrics Service] ✅ Cache hit (synced):', trackTitle, '-', trackAuthor);
            return {
              lyrics: cachedLyrics.lyrics,
              synced: true,
              source: cachedLyrics.source,
              cached: true
            };
          } else {
            console.log('[Lyrics Service] ⚠️ Cached MongoDB lyrics have corrupted timestamps. Refetching fresh synced lyrics...');
          }
        }
      }

      console.log('[Lyrics Service] 🔍 Fetching fresh synced lyrics for:', trackTitle, '-', trackAuthor);

      // 1. Fetch from LRCLIB first for guaranteed millisecond synced LRC lyrics
      const lrclibResult = await this.fetchLyricsFromLRCLIB(trackTitle, trackAuthor, track.duration);
      if (lrclibResult && lrclibResult.synced) {
        await this.cacheLyrics(track, lrclibResult.lyrics);
        return lrclibResult;
      }

      // 2. Fallback to Moonlink player.subscribeLyrics()
      try {
        const activePlayer = this.manager.players.get(player.guildId);
        if (activePlayer && activePlayer.current) {
          player.subscribeLyrics();
          console.log('[Lyrics Service] 📡 Subscribed to Moonlink lyrics for:', trackTitle);
        }
      } catch (subscribeError) {
        console.error('[Lyrics Service] ❌ Error subscribing to lyrics:', subscribeError.message);
      }
      
      // 3. If LRCLIB had unsynced lyrics as fallback, return them if no synced found
      if (lrclibResult && lrclibResult.lyrics && lrclibResult.lyrics.length > 0) {
        await this.cacheLyrics(track, lrclibResult.lyrics);
        return lrclibResult;
      }

      return null;

    } catch (error) {
      console.error('[Lyrics Service] ❌ Error fetching lyrics:', error.message);
      return null;
    }
  }

  /**
   * Set callback for when lyrics are found
   */
  setOnLyricsFound(callback) {
    this.onLyricsFound = callback;
  }

  /**
   * Set callback for when lyrics are not found
   */
  setOnLyricsNotFound(callback) {
    this.onLyricsNotFound = callback;
  }
}

export default LyricsService;
