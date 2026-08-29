export interface LyricLine {
  id: number;
  time: number; // in seconds
  text: string;
}

/**
 * Parse LRC format lyrics into a structured array
 * Converts timestamps like [00:12.34] into seconds (12.34)
 */
export function parseLRC(lrcString: string): LyricLine[] {
  if (!lrcString) return [];

  const lines = lrcString.split('\n');
  const lyrics: LyricLine[] = [];
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
        
        lyrics.push({
          id: id++,
          time,
          text
        });
      }
    }
  }

  // Sort by time to ensure correct order
  return lyrics.sort((a, b) => a.time - b.time);
}

/**
 * Find the active lyric line index based on current time
 */
export function getActiveLyricIndex(lyrics: LyricLine[], currentTime: number): number {
  if (!lyrics || !lyrics.length) return -1;

  for (let i = lyrics.length - 1; i >= 0; i--) {
    // Add small 0.15s tolerance so clicking a line at line.time matches that line exactly
    if (currentTime >= lyrics[i].time - 0.15) {
      return i;
    }
  }

  return -1;
}
