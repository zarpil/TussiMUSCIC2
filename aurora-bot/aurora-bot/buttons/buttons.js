// buttons.js
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, MessageFlags} from 'discord.js';
import { play_button_emoji, pause_emoji, stop_emoji,loop_emoji, skip_emoji, volume_up_emoji, volume_down_emoji, off_emoji, song_emoji, queue_emoji, seek_emoji, shuffle_emoji, queuelist_emoji, lyrics_emoji, volume_emoji, autoplay_emoji } from '../emoji/emoji.js';

export const play_button = new ButtonBuilder()
  .setCustomId('play_button')
  .setStyle(ButtonStyle.Secondary)
  .setEmoji(`${play_button_emoji}`);

export const pause_button = new ButtonBuilder()
  .setCustomId('pause_button')
  .setStyle(ButtonStyle.Secondary)
  .setEmoji(`${pause_emoji}`);

export const loop_off = new ButtonBuilder()
  .setCustomId('loopoff')
  .setLabel('Stop Loop')
  .setStyle(ButtonStyle.Secondary)
  .setEmoji(`${off_emoji}`);

export const loop_track = new ButtonBuilder()
  .setCustomId('looptrack')
  .setLabel("Track Loop")
  .setStyle(ButtonStyle.Secondary)
  .setEmoji(`${song_emoji}`);

export const loop_queue = new ButtonBuilder()
  .setCustomId('loopqueue')
  .setLabel('Queue Loop')
  .setStyle(ButtonStyle.Secondary)
  .setEmoji(`${queue_emoji}`);

export const stop_button = new ButtonBuilder()
  .setCustomId('stop_button')
  .setStyle(ButtonStyle.Secondary)
  .setEmoji(`${stop_emoji}`);

export const loopButton = new ButtonBuilder()
  .setCustomId('toggle_loop')
  .setEmoji(`${loop_emoji}`)
  .setStyle(ButtonStyle.Secondary);

export const skip_button = new ButtonBuilder()
  .setCustomId('skip_button')
  .setStyle(ButtonStyle.Secondary)
  .setEmoji(`${skip_emoji}`);

export const volume_up = new ButtonBuilder()
  .setCustomId('volume_up_button')
  .setStyle(ButtonStyle.Secondary)
  .setEmoji(`${volume_up_emoji}`);

export const volume_down = new ButtonBuilder()
  .setCustomId('volume_down_button')
  .setStyle(ButtonStyle.Secondary)
  .setEmoji(`${volume_down_emoji}`);

export const autoplaybtn = new ButtonBuilder()
  .setCustomId('auto_play')
  .setStyle(ButtonStyle.Secondary)
  .setEmoji(`${autoplay_emoji}`);

export const seekbtn = new ButtonBuilder()
  .setCustomId('seek')
  .setStyle(ButtonStyle.Secondary)
  .setEmoji(`${seek_emoji}`);

export const shufflebtn = new ButtonBuilder()
  .setCustomId('shuffle')
  .setStyle(ButtonStyle.Secondary)
  .setEmoji(`${shuffle_emoji}`);

export const queuelistbtn = new ButtonBuilder()
  .setCustomId('queue_list')
  .setStyle(ButtonStyle.Secondary)
  .setEmoji(`${queuelist_emoji}`);

export const lyricsbtn = new ButtonBuilder()
  .setCustomId('lyrics')
  .setStyle(ButtonStyle.Secondary)
  .setEmoji(`${lyrics_emoji}`);

export const volumebtn = new ButtonBuilder()
  .setCustomId('volume')
  .setStyle(ButtonStyle.Secondary)
  .setEmoji(`${volume_emoji}`);

const filterSelectMenu = new StringSelectMenuBuilder()
    .setCustomId('filter-select')
    .setPlaceholder('🎚️ Choose a filter')
    .addOptions(
      new StringSelectMenuOptionBuilder().setLabel('Nightcore').setValue('nightcore'),
      new StringSelectMenuOptionBuilder().setLabel('Tremalo').setValue('tremalo'),
      new StringSelectMenuOptionBuilder().setLabel('Karaoke').setValue('karaoke'),
      new StringSelectMenuOptionBuilder().setLabel('Rotation').setValue('rotation'),
      new StringSelectMenuOptionBuilder().setLabel('Vibrato').setValue('vibrato'),
      new StringSelectMenuOptionBuilder().setLabel('Distortion').setValue('distortion'),
      new StringSelectMenuOptionBuilder().setLabel('Lowpass').setValue('lowpass'),
      new StringSelectMenuOptionBuilder().setLabel('Eqaulizer').setValue('eqaulizer'),
      new StringSelectMenuOptionBuilder().setLabel('Reset Filters').setValue('reset')
    );

export const filterRow = new ActionRowBuilder().addComponents(filterSelectMenu);

// Group into one ActionRow (max 5 buttons per row)
export const musicControlsRow1 = new ActionRowBuilder().addComponents(
  play_button,
  pause_button,
  stop_button,
  loopButton,
  skip_button
);

export const musicControlsRow2 = new ActionRowBuilder().addComponents(
   volumebtn,
   autoplaybtn,
   shufflebtn,
   queuelistbtn,
   seekbtn
);

export const loop_controls = new ActionRowBuilder().addComponents(
  loop_off,
  loop_track,
  loop_queue
);

export const volumecontrolrows = new ActionRowBuilder().addComponents(
  volume_down,
  volume_up
);
