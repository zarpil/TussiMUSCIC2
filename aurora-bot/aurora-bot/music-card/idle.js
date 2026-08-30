import { AttachmentBuilder, MessageFlags, TextDisplayBuilder, ContainerBuilder, MediaGalleryBuilder, MediaGalleryItemBuilder, SeparatorBuilder, SeparatorSpacingSize, SectionBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { play_button, stop_button, loopButton, skip_button, volumebtn, autoplaybtn, shufflebtn, queuelistbtn } from "../buttons/buttons.js";
import { music_disc_emoji } from "../emoji/emoji.js";
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const idleImagePath = path.join(__dirname, '../media/idle.jpg');

async function getWebUrl() {
  let dbSettings = null;
  try {
    if (mongoose.connection && mongoose.connection.db) {
      dbSettings = await mongoose.connection.db.collection('settings').findOne({ _id: 'site_config' });
    }
  } catch (err) {}
  return dbSettings?.cardWebPlayerUrl || dbSettings?.botInviteUrl || process?.env?.WEB_DASHBOARD_URL || process?.env?.WEB_DASHBOARD_UR || "https://tussi.zarpil.dev/";
}

export async function send_idle_panel(client, channel) {
  try {
    const attachment = new AttachmentBuilder(idleImagePath, { name: "idle.jpg" });
    const container = new ContainerBuilder();
    const web_url = await getWebUrl();

    // 1. Heading
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${music_disc_emoji} **Esperando canciones...**`));
    container.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));

    // 2. Image
    container.addMediaGalleryComponents(new MediaGalleryBuilder().addItems(new MediaGalleryItemBuilder().setURL("attachment://idle.jpg")));
    container.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));

    // 3. Info / Body
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent("No hay nada reproduciéndose actualmente.\nEscribe el nombre de una canción o un enlace en este canal para empezar a escuchar música."));
    container.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));

    // 4. Buttons
    const dynamicRow1 = new ActionRowBuilder().addComponents(
      play_button,
      stop_button,
      loopButton,
      skip_button
    );

    const webBtn = new ButtonBuilder()
      .setStyle(ButtonStyle.Link)
      .setLabel('Panel Web')
      .setURL(web_url)
      .setEmoji('🌐');

    const dynamicRow2 = new ActionRowBuilder().addComponents(
      volumebtn,
      autoplaybtn,
      shufflebtn,
      queuelistbtn,
      webBtn
    );

    container.addActionRowComponents(dynamicRow1);
    container.addActionRowComponents(dynamicRow2);

    const message = await channel.send({
      components: [container],
      files: [attachment],
      flags: [MessageFlags.IsComponentsV2, MessageFlags.SuppressNotifications]
    });

    return message;
  } catch (err) {
    console.error("[Idle Panel] Error sending idle panel:", err);
    return null;
  }
}

export async function edit_idle_panel(client, message) {
  try {
    const attachment = new AttachmentBuilder(idleImagePath, { name: "idle.jpg" });
    const container = new ContainerBuilder();
    const web_url = await getWebUrl();

    // 1. Heading
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${music_disc_emoji} **Esperando canciones...**`));
    container.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));

    // 2. Image
    container.addMediaGalleryComponents(new MediaGalleryBuilder().addItems(new MediaGalleryItemBuilder().setURL("attachment://idle.jpg")));
    container.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));

    // 3. Info / Body
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent("No hay nada reproduciéndose actualmente.\nEscribe el nombre de una canción o un enlace en este canal para empezar a escuchar música."));
    container.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));

    // 4. Buttons
    const dynamicRow1 = new ActionRowBuilder().addComponents(
      play_button,
      stop_button,
      loopButton,
      skip_button
    );

    const webBtn = new ButtonBuilder()
      .setStyle(ButtonStyle.Link)
      .setLabel('Panel Web')
      .setURL(web_url)
      .setEmoji('🌐');

    const dynamicRow2 = new ActionRowBuilder().addComponents(
      volumebtn,
      autoplaybtn,
      shufflebtn,
      queuelistbtn,
      webBtn
    );

    container.addActionRowComponents(dynamicRow1);
    container.addActionRowComponents(dynamicRow2);

    await message.edit({
      content: '', // Limpiar posible contenido extra
      files: [attachment],   // Poner la imagen oficial de Tussi Music cuando no suena nada
      components: [container],
      flags: [MessageFlags.IsComponentsV2, MessageFlags.SuppressNotifications]
    });
  } catch (err) {
    console.error("[Idle Panel] Error editing idle panel:", err);
  }
}

export async function resetPanelToIdle(client, guildId, player) {
  try {
    if (player?.musicCard) {
      await edit_idle_panel(client, player.musicCard);
      return;
    }
    const GuildConfig = (await import('../models/Guild.js')).default;
    const config = await GuildConfig.findOne({ guildId });
    if (config?.requestChannel?.channelId && config?.requestChannel?.messageId) {
      const channel = await client.channels.fetch(config.requestChannel.channelId).catch(() => null);
      if (channel) {
        const msg = await channel.messages.fetch(config.requestChannel.messageId).catch(() => null);
        if (msg) {
          await edit_idle_panel(client, msg);
        }
      }
    }
  } catch (err) {
    console.error('[Idle Reset] Error resetting panel to idle:', err);
  }
}
