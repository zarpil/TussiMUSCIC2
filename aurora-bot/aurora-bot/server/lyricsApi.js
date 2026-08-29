import express from 'express';
import Lyrics from '../models/Lyrics.js';
import crypto from 'crypto';

export function setupLyricsRoutes(app) {
  const router = express.Router();

  // Get lyrics for a song
  router.get('/', async (req, res) => {
    try {
      const { title, artist, url } = req.query;
      
      if (!title || !artist) {
        return res.status(400).json({ error: 'Title and artist are required' });
      }

      // Generate unique track ID
      const trackId = generateTrackId(title, artist);

      // Check MongoDB cache first
      const cachedLyrics = await Lyrics.findOne({ trackId });
      
      if (cachedLyrics) {
        console.log('[Lyrics] Cache hit:', title, '-', artist);
        return res.json({
          lyrics: cachedLyrics.lyrics,
          synced: cachedLyrics.synced,
          cached: true
        });
      }

      console.log('[Lyrics] Cache miss, fetching from API:', title, '-', artist);

      // Fetch from lrclib.net
      const searchQuery = `${artist} ${title}`.trim();
      const response = await fetch(
        `https://lrclib.net/api/search?q=${encodeURIComponent(searchQuery)}`
      );

      if (!response.ok) {
        return res.status(404).json({ error: 'Lyrics not found' });
      }

      const results = await response.json();
      
      if (!results || results.length === 0) {
        return res.status(404).json({ error: 'Lyrics not found' });
      }

      // Get the first result
      const track = results[0];
      let lyrics = [];
      let synced = false;
      
      // Parse synced lyrics if available
      if (track.syncedLyrics) {
        lyrics = parseLRC(track.syncedLyrics);
        synced = true;
      } else if (track.plainLyrics) {
        // Fall back to plain lyrics with fake timing
        lyrics = track.plainLyrics.split('\n')
          .map((text, index) => ({
            id: index,
            time: index * 3, // 3 seconds per line
            text: text.trim()
          }))
          .filter(line => line.text);
        synced = false;
      }

      if (lyrics.length === 0) {
        return res.status(404).json({ error: 'Lyrics not found' });
      }

      // Cache in MongoDB
      try {
        await Lyrics.create({
          trackId,
          title,
          artist,
          url: url || '',
          lyrics,
          synced,
          source: 'lrclib',
          fetchedAt: new Date()
        });
        console.log('[Lyrics] Cached in MongoDB:', title, '-', artist);
      } catch (cacheError) {
        console.error('[Lyrics] Cache error:', cacheError.message);
        // Continue even if caching fails
      }

      return res.json({ lyrics, synced, cached: false });
    } catch (error) {
      console.error('[Lyrics API] Error:', error);
      res.status(500).json({ error: 'Failed to fetch lyrics' });
    }
  });

  app.use('/api/lyrics', router);
}

// Generate unique track ID from title and artist
function generateTrackId(title, artist) {
  const normalized = `${title.toLowerCase().trim()}-${artist.toLowerCase().trim()}`;
  return crypto.createHash('md5').update(normalized).digest('hex');
}

// Parse LRC format lyrics
function parseLRC(lrcString) {
  const lines = lrcString.split('\n');
  const lyrics = [];
  let id = 0;

  for (const line of lines) {
    // Match [mm:ss.xx] or [mm:ss] format
    const match = line.match(/\[(\d{2}):(\d{2})\.?(\d{2,3})?\](.*)/);
    
    if (match) {
      const minutes = parseInt(match[1], 10);
      const seconds = parseInt(match[2], 10);
      const centiseconds = match[3] ? parseInt(match[3].padEnd(3, '0'), 10) : 0;
      const text = match[4].trim();

      if (text) {
        // Convert to total seconds with millisecond precision
        const time = minutes * 60 + seconds + centiseconds / 1000;
        lyrics.push({ id: id++, time, text });
      }
    }
  }

  return lyrics.sort((a, b) => a.time - b.time);
}
