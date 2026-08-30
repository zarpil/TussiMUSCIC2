import mongoose from 'mongoose';

export let tick_emoji = `✅`;
export let cross_emoji = `❌`;
export let ltr_arrow_emoji = `▶️`;
export let ltr_arrow_color_emoji = `▶️`;
export let music_disc_emoji = `🎵`;
export let play_button_emoji = `▶️`;
export let loading_emoji = `⏳`;
export let volume_down_emoji = `🔉`;
export let volume_up_emoji = `🔊`;
export let skip_emoji = `⏭️`;
export let pause_emoji = `⏸️`;
export let loop_emoji = `🔁`;
export let stop_emoji = `⏹️`;
export let autoplay_emoji = `📻`;
export let queue_emoji = `🔁`;
export let queuelist_emoji = `📜`;
export let lyrics_emoji = `📝`;
export let volume_emoji = `🔊`;
export let listqueue_emoji = `📜`;
export let off_emoji = `⏹️`;
export let song_emoji = `🎶`;
export let seek_emoji = `⏩`;
export let shuffle_emoji = `🔀`;

export async function loadEmojisFromDB() {
  try {
    if (mongoose.connection && mongoose.connection.db) {
      const config = await mongoose.connection.db.collection('settings').findOne({ _id: 'site_config' });
      if (config && config.emojis) {
        const e = config.emojis;
        if (e.tick_emoji) tick_emoji = e.tick_emoji;
        if (e.cross_emoji) cross_emoji = e.cross_emoji;
        if (e.ltr_arrow_emoji) ltr_arrow_emoji = e.ltr_arrow_emoji;
        if (e.ltr_arrow_color_emoji) ltr_arrow_color_emoji = e.ltr_arrow_color_emoji;
        if (e.music_disc_emoji) music_disc_emoji = e.music_disc_emoji;
        if (e.play_button_emoji) play_button_emoji = e.play_button_emoji;
        if (e.loading_emoji) loading_emoji = e.loading_emoji;
        if (e.volume_down_emoji) volume_down_emoji = e.volume_down_emoji;
        if (e.volume_up_emoji) volume_up_emoji = e.volume_up_emoji;
        if (e.skip_emoji) skip_emoji = e.skip_emoji;
        if (e.pause_emoji) pause_emoji = e.pause_emoji;
        if (e.loop_emoji) loop_emoji = e.loop_emoji;
        if (e.stop_emoji) stop_emoji = e.stop_emoji;
        if (e.autoplay_emoji) autoplay_emoji = e.autoplay_emoji;
        if (e.queue_emoji) queue_emoji = e.queue_emoji;
        if (e.queuelist_emoji) queuelist_emoji = e.queuelist_emoji;
        if (e.lyrics_emoji) lyrics_emoji = e.lyrics_emoji;
        if (e.volume_emoji) volume_emoji = e.volume_emoji;
        if (e.listqueue_emoji) listqueue_emoji = e.listqueue_emoji;
        if (e.off_emoji) off_emoji = e.off_emoji;
        if (e.song_emoji) song_emoji = e.song_emoji;
        if (e.seek_emoji) seek_emoji = e.seek_emoji;
        if (e.shuffle_emoji) shuffle_emoji = e.shuffle_emoji;
        console.log('[Emojis] Loaded custom emojis from database successfully');
      }
    } else {
      console.warn('[Emojis] Database not connected yet, skipping custom emojis load');
    }
  } catch (error) {
    console.error('[Emojis] Failed to load custom emojis from database:', error.message);
  }
}
