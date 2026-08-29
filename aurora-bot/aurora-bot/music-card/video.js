import { AttachmentBuilder, EmbedBuilder } from "discord.js";
import {
  cross_emoji,
  music_disc_emoji,
  loading_emoji,
} from "../emoji/emoji.js";
import search_vid_gif from "video-to-gif/search.js";
import { access, constants } from "fs/promises";
const em = new EmbedBuilder().setColor("Red");
let gif_video_path;
const embedv = new EmbedBuilder().setColor("Blue");
const embed = new EmbedBuilder().setColor("Blue");
import { fileURLToPath } from "url";
import path from "path";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const playimg = new AttachmentBuilder("./media/play.gif", { name: "play.gif" });

export async function Video(client, interaction, guildId) {
  const player = client.musicManager.players.get(guildId);
  const track = player.queue.current;
  const title = track.title;
  const url = track.uri;

  //message
  client.editVidMessages = client.editVidMessages || {};
  embedv.setDescription(`${loading_emoji} Loading Preview`);
  const video_card_msg = await interaction.channel.send({ embeds: [embedv] });
  client.editVidMessages[guildId] = video_card_msg;

  //video fetching
  const converted_title = await convertSpacesToUnderscoreAndTruncate(title, 50);
  const gifPath = path.join(
    __dirname,
    "../gif_output",
    `${converted_title}_10s_clip.gif`
  );
  if (await fileExists(gifPath)) {
    gif_video_path = gifPath;
  } else {
    try {
      gif_video_path = await search_vid_gif(converted_title,
          {
            duration: 10,
            temp: "./vid_temp",
            output: "./gif_output",
          },
          url)
    } catch (err) {
      console.error('Error generating video preview:', err.message);
      gif_video_path = null;
    }
  }
  const footerimg = new AttachmentBuilder("./media/skyline.png", {
    name: "skyline.png",
  });
  if (gif_video_path) {
    try {
      const video_gif = new AttachmentBuilder(gif_video_path, {
        name: "video.gif",
      });
      embed.setTitle(`${music_disc_emoji} Now Playing`);
      embed.setFooter({
        text: `Powered By Skyline Devops`,
        iconURL: "attachment://skyline.png",
      });
      embed.setThumbnail("attachment://play.gif");
      embed.setDescription(`${music_disc_emoji}   **${title}**`);
      embed.setImage("attachment://video.gif");
      embed.setTimestamp();
      await client.editVidMessages[guildId].edit({
        embeds: [embed],
        files: [video_gif, footerimg, playimg],
      });
      delete client.editVidMessages[guildId];
    } catch (err) {
      console.error('Error sending video preview:', err);
      em.setDescription(`${cross_emoji} We cannot display preview of the song`);
      if (client.editVidMessages[guildId]) {
        await client.editVidMessages[guildId].edit({ embeds: [em] });
        delete client.editVidMessages[guildId];
      }
    }
  } else {
    em.setDescription(`${cross_emoji} We cannot find preview of the song`);
    if (client.editVidMessages[guildId]) {
      await client.editVidMessages[guildId].edit({ embeds: [em] });
      delete client.editVidMessages[guildId];
    }
  }
}

async function convertSpacesToUnderscoreAndTruncate(str, limit = 50) {
  if (!str || typeof str !== "string") return "video";

  return str
    // remove file extension if present
    .replace(/\.[^/.]+$/, "")

    // remove dangerous characters (Windows + ffmpeg safe)
    .replace(/[<>:"/\\|?*#,]/g, "")

    // replace spaces with underscore
    .replace(/\s+/g, "_")

    // remove multiple underscores
    .replace(/_+/g, "_")

    // trim underscores
    .replace(/^_+|_+$/g, "")

    // truncate safely
    .substring(0, limit);
}


async function fileExists(filePath) {
  try {
    await access(filePath, constants.F_OK);
    return true;
  } catch (err) {
    return false;
  }
}
