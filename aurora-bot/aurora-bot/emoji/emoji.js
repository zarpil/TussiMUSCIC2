import mongoose from 'mongoose';

export let tick_emoji = `<a:tick:1378702853572530226>`;
export let cross_emoji = `<a:cross_aur:1468227655319949519>`;
export let ltr_arrow_emoji = `<a:arrow:1378703040156274688>`;
export let ltr_arrow_color_emoji = `<a:color_arrow:1378704561782394971>`;
export let music_disc_emoji = `<a:disc:1466446944846221457>`;
export let play_button_emoji = `<:aur_play:1378705660400762891>`;
export let loading_emoji = `<a:salesforce_load:1378703152374616104>`;
export let volume_down_emoji = `<:down_aur:1378700996317941770>`;
export let volume_up_emoji = `<:up_aur:1378700925098524742>`;
export let skip_emoji = `<:next_aur:1378699339316199424>`;
export let pause_emoji = `<:pause_aur:1378701219752575126>`;
export let loop_emoji = `<:loop_aur:1378701134729969734>`;
export let stop_emoji = `<:stop_aur:1378701066769666088>`;
export let autoplay_emoji = `<:autoplay_aur:1468215550688628849>`;
export let queue_emoji = `<:loop_aur:1468213848904564879>`;
export let queuelist_emoji = `<:list_aur:1468216766382608618>`;
export let lyrics_emoji = `<:lyrics_aur:1468216486895292531>`;
export let volume_emoji = `<:volume_aur:1468214753150111795>`;
export let listqueue_emoji = `<:list_aur:1468216766382608618>`;
export let off_emoji = `<:power_aur:1468214243034665203>`;
export let song_emoji = `<:track_aur:1468213498680053812>`;
export let seek_emoji = `<:seek_aur:1468216209018327070>`;
export let shuffle_emoji = `<:shuffle_aur:1468214974752096307>`;

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
