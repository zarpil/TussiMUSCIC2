import { AttachmentBuilder, MessageFlags, TextDisplayBuilder, ContainerBuilder, MediaGalleryBuilder, MediaGalleryItemBuilder, SeparatorBuilder, SeparatorSpacingSize, SectionBuilder, ActionRowBuilder } from "discord.js";
import { play_button, stop_button, loopButton, skip_button, musicControlsRow2, filterRow } from "../buttons/buttons.js";
import { music_disc_emoji } from "../emoji/emoji.js";
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const idleImagePath = path.join(__dirname, '../media/idle.jpg');

export async function send_idle_panel(client, channel) {
  try {
    const attachment = new AttachmentBuilder(idleImagePath, { name: "idle.jpg" });
    const container = new ContainerBuilder();

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
    container.addActionRowComponents(dynamicRow1);
    container.addActionRowComponents(musicControlsRow2);
    container.addActionRowComponents(filterRow);

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
    container.addActionRowComponents(dynamicRow1);
    container.addActionRowComponents(musicControlsRow2);
    container.addActionRowComponents(filterRow);

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
