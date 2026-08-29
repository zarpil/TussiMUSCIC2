import { AttachmentBuilder,ThumbnailBuilder, MessageFlags, TextDisplayBuilder,ContainerBuilder, MediaGalleryBuilder, MediaGalleryItemBuilder,SeparatorBuilder,SeparatorSpacingSize, SectionBuilder  } from "discord.js";
import {musicControlsRow1,musicControlsRow2,filterRow,} from "../buttons/buttons.js";
import {cross_emoji, music_disc_emoji} from "../emoji/emoji.js";
import {Bloom} from "aurora-music-card";
import 'dotenv/config';
import mongoose from 'mongoose';

function compileTemplate(template, data) {
  if (!template) return '';
  return template
    .replace(/{music_disc_emoji}/g, data.music_disc_emoji || '')
    .replace(/{title}/g, data.title || '')
    .replace(/{artist}/g, data.artist || '')
    .replace(/{track_uri}/g, data.track_uri || '')
    .replace(/{source}/g, data.source || '')
    .replace(/{duration}/g, data.duration || '')
    .replace(/{next_song}/g, data.next_song || '')
    .replace(/{songs_count}/g, data.songs_count || '')
    .replace(/{requester_id}/g, data.requester_id || '');
}

export async function music_card(client,player,track) {
  const channel= await client.channels.fetch(player.textChannelId);

  if(!track)
    return;
  
  const title = track.title;
  const artist = track.author;
  const source = track.sourceName;
  let duration = track.duration;
  const requester = track.requester;
  
  // Fetch settings from DB
  let dbSettings = null;
  try {
    if (mongoose.connection && mongoose.connection.db) {
      dbSettings = await mongoose.connection.db.collection('settings').findOne({ _id: 'site_config' });
    }
  } catch (err) {
    console.error('[Card] Failed to fetch settings for card:', err);
  }

  // Load links and custom labels with fallback
  const support_server_link = dbSettings?.cardSupportUrl || dbSettings?.supportServerUrl || process?.env?.SUPPORT_SERVER_LINK || "https://discord.com/";
  // Web dashboard link
  const web_url = dbSettings?.cardWebPlayerUrl || dbSettings?.botInviteUrl || process?.env?.WEB_DASHBOARD_URL || process?.env?.WEB_DASHBOARD_UR || "https://discord.com/";
  
  const trackduration = await formatDuration(duration);
  const thumbnail = track.thumbnail;
  const stream = track.isStream;
  if (stream) duration = "LIVE";
  const track_size = player.queue.all.length;
  const next_song_name = track_size === 0 ? cross_emoji : player.queue.all[0].title;

  // Custom configurations
  const cardHeading = dbSettings?.cardHeading !== undefined ? dbSettings.cardHeading : "# {music_disc_emoji} **Now Playing**";
  const cardBody = dbSettings?.cardBody !== undefined ? dbSettings.cardBody : "●  **Track Title: ** **[{title} - {artist}]({track_uri})**\n●  **Source: ** {source} \n●  **Duration: ** {duration} \n● **Next Song:** {next_song}\n● **Number Of Songs:** {songs_count} \n● **Requested by: ** <@{requester_id}>";
  const cardSupportLabel = dbSettings?.cardSupportLabel || "Support Server";
  const cardWebPlayerLabel = dbSettings?.cardWebPlayerLabel || "Web Player";
  const cardShowHeading = dbSettings?.cardShowHeading !== undefined ? dbSettings.cardShowHeading : true;
  const cardShowTrackImage = dbSettings?.cardShowTrackImage !== undefined ? dbSettings.cardShowTrackImage : true;
  const cardShowInfo = dbSettings?.cardShowInfo !== undefined ? dbSettings.cardShowInfo : true;
  const cardShowButtons = dbSettings?.cardShowButtons !== undefined ? dbSettings.cardShowButtons : true;
  const cardShowLinks = dbSettings?.cardShowLinks !== undefined ? dbSettings.cardShowLinks : true;
  const cardSeparatorStyle = dbSettings?.cardSeparatorStyle || "divider";
  const cardSeparatorSize = dbSettings?.cardSeparatorSize || "small";

  let spacingSize = SeparatorSpacingSize.Small;
  if (cardSeparatorSize === 'medium') spacingSize = SeparatorSpacingSize.Medium;
  if (cardSeparatorSize === 'large') spacingSize = SeparatorSpacingSize.Large;

  const createSeparator = () => {
    return new SeparatorBuilder()
      .setDivider(cardSeparatorStyle === 'divider')
      .setSpacing(spacingSize);
  };

  try {
    const cardImage = await Bloom({
      trackName: title,
      artistName: artist,
      albumArt: thumbnail,
      isExplicit: false,
      timeAdjust: {
        timeStart: "0:20",
        timeEnd: trackduration,
      },
      progressBar: 10,
      volumeBar: Math.min(player.volume, 100),
    });
        
    const attachment = new AttachmentBuilder(cardImage, { name: "card.gif" });
    const user = await client.users.fetch(requester.id || requester);

    const container = new ContainerBuilder();
    let needsSeparator = false;

    // 1. Heading
    if (cardShowHeading) {
      const headingText = compileTemplate(cardHeading, {
        music_disc_emoji,
        title,
        artist,
        track_uri: track.uri,
        source,
        duration: trackduration,
        next_song: next_song_name,
        songs_count: track_size,
        requester_id: requester.id || requester
      });
      container.addTextDisplayComponents(new TextDisplayBuilder().setContent(headingText));
      needsSeparator = true;
    }

    // 2. Track Image
    if (cardShowTrackImage) {
      if (needsSeparator) container.addSeparatorComponents(createSeparator());
      container.addMediaGalleryComponents(new MediaGalleryBuilder().addItems(new MediaGalleryItemBuilder().setURL("attachment://card.gif")));
      needsSeparator = true;
    }

    // 3. Info
    if (cardShowInfo) {
      if (needsSeparator) container.addSeparatorComponents(createSeparator());
      
      const bodyText = compileTemplate(cardBody, {
        music_disc_emoji,
        title,
        artist,
        track_uri: track.uri,
        source,
        duration: trackduration,
        next_song: next_song_name,
        songs_count: track_size,
        requester_id: requester.id || requester
      });

      const avatarUrl = user.displayAvatarURL({ size: 512, extension: 'png', forceStatic: true });

      const section = new SectionBuilder().addTextDisplayComponents(new TextDisplayBuilder().setContent(bodyText));
      section.setThumbnailAccessory(new ThumbnailBuilder({ 
        media: { url: avatarUrl } 
      }));
      container.addSectionComponents(section);
      needsSeparator = true;
    }

    // 4. Buttons
    if (cardShowButtons) {
      if (needsSeparator) container.addSeparatorComponents(createSeparator());
      container.addActionRowComponents(musicControlsRow1);
      container.addActionRowComponents(musicControlsRow2);
      container.addActionRowComponents(filterRow);
      needsSeparator = true;
    }

    // 5. Links
    if (cardShowLinks) {
      if (needsSeparator) container.addSeparatorComponents(createSeparator());
      container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`[${cardSupportLabel}](${support_server_link})`));
      container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`[${cardWebPlayerLabel}](${web_url})`));
    }

    player.musicCard = await channel.send({
      components: [container],
      files: [attachment],
      flags: [MessageFlags.IsComponentsV2, MessageFlags.SuppressNotifications]
    });

  } catch (err) {
    console.log(err);
  }
}

function formatDuration(ms) {
  const seconds = Math.floor((ms / 1000) % 60);
  const minutes = Math.floor((ms / (1000 * 60)) % 60);
  const hours = Math.floor(ms / (1000 * 60 * 60));

  return `${hours ? `${hours}:` : ""}${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}`;
}
