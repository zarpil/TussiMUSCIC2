import { AttachmentBuilder, MessageFlags, TextDisplayBuilder, ContainerBuilder, MediaGalleryBuilder, MediaGalleryItemBuilder, SeparatorBuilder, SeparatorSpacingSize, SectionBuilder } from "discord.js";
import { musicControlsRow1, musicControlsRow2, filterRow } from "../buttons/buttons.js";
import { music_disc_emoji } from "../emoji/emoji.js";
import mongoose from 'mongoose';

export async function send_idle_panel(client, channel) {
  try {
    let dbSettings = null;
    try {
      if (mongoose.connection && mongoose.connection.db) {
        dbSettings = await mongoose.connection.db.collection('settings').findOne({ _id: 'site_config' });
      }
    } catch (err) {
      console.error('[Idle Panel] Failed to fetch settings:', err);
    }

    const support_server_link = dbSettings?.cardSupportUrl || dbSettings?.supportServerUrl || process?.env?.SUPPORT_SERVER_LINK || "https://discord.com/";
    const web_url = dbSettings?.cardWebPlayerUrl || dbSettings?.botInviteUrl || process?.env?.WEB_DASHBOARD_URL || process?.env?.WEB_DASHBOARD_UR || "https://discord.com/";

    const container = new ContainerBuilder();

    // 1. Heading
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${music_disc_emoji} **Esperando canciones...**`));
    container.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));

    // 2. Info / Body
    const section = new SectionBuilder().addTextDisplayComponents(new TextDisplayBuilder().setContent("No hay nada reproduciéndose actualmente.\\nEscribe el nombre de una canción o un enlace en este canal para empezar a escuchar música."));
    container.addSectionComponents(section);
    container.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));

    // 3. Buttons (can reuse the standard ones)
    container.addActionRowComponents(musicControlsRow1);
    container.addActionRowComponents(musicControlsRow2);
    container.addActionRowComponents(filterRow);
    container.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));

    // 4. Links
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`[Soporte](${support_server_link})`));
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`[Panel Web](${web_url})`));

    const message = await channel.send({
      components: [container],
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
    let dbSettings = null;
    try {
      if (mongoose.connection && mongoose.connection.db) {
        dbSettings = await mongoose.connection.db.collection('settings').findOne({ _id: 'site_config' });
      }
    } catch (err) {
      console.error('[Idle Panel] Failed to fetch settings:', err);
    }

    const support_server_link = dbSettings?.cardSupportUrl || dbSettings?.supportServerUrl || process?.env?.SUPPORT_SERVER_LINK || "https://discord.com/";
    const web_url = dbSettings?.cardWebPlayerUrl || dbSettings?.botInviteUrl || process?.env?.WEB_DASHBOARD_URL || process?.env?.WEB_DASHBOARD_UR || "https://discord.com/";

    const container = new ContainerBuilder();

    // 1. Heading
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${music_disc_emoji} **Esperando canciones...**`));
    container.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));

    // 2. Info / Body
    const section = new SectionBuilder().addTextDisplayComponents(new TextDisplayBuilder().setContent("No hay nada reproduciéndose actualmente.\\nEscribe el nombre de una canción o un enlace en este canal para empezar a escuchar música."));
    container.addSectionComponents(section);
    container.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));

    // 3. Buttons (can reuse the standard ones)
    container.addActionRowComponents(musicControlsRow1);
    container.addActionRowComponents(musicControlsRow2);
    container.addActionRowComponents(filterRow);
    container.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));

    // 4. Links
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`[Soporte](${support_server_link})`));
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`[Panel Web](${web_url})`));

    await message.edit({
      content: '', // Limpiar posible contenido extra
      files: [],   // Quitar la imagen del gif
      components: [container],
      flags: [MessageFlags.IsComponentsV2, MessageFlags.SuppressNotifications]
    });
  } catch (err) {
    console.error("[Idle Panel] Error editing idle panel:", err);
  }
}
