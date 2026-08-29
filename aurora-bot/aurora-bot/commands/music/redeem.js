import { SlashCommandBuilder, MessageFlags, ContainerBuilder, TextDisplayBuilder } from "discord.js";
import { tick_emoji, cross_emoji } from "../../emoji/emoji.js";
import PremiumCode from "../../models/PremiumCode.js";
import PremiumUser from "../../models/PremiumUser.js";

export const redeemcmd = new SlashCommandBuilder()
  .setName("redeem")
  .setDescription("Canjea un código de activación Premium")
  .addStringOption(option =>
    option.setName("code")
      .setDescription("Tu código premium (ej. TUS-XXXX-XXXX)")
      .setRequired(true)
  );

export async function RedeemCommand(client, interaction) {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });
  let container = new ContainerBuilder();
  const code = interaction.options.getString("code").trim().toUpperCase();
  const userId = interaction.user.id;
  const username = interaction.user.username;

  try {
    const codeDoc = await PremiumCode.findOne({ code });

    if (!codeDoc) {
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`${cross_emoji} Código premium inválido. ¡Verifícalo e inténtalo de nuevo!`)
      );
      return await interaction.editReply({ components: [container], flags: [MessageFlags.IsComponentsV2] });
    }

    if (codeDoc.isRedeemed) {
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`${cross_emoji} ¡Este código ya ha sido canjeado anteriormente!`)
      );
      return await interaction.editReply({ components: [container], flags: [MessageFlags.IsComponentsV2] });
    }

    // Redeem code
    codeDoc.isRedeemed = true;
    codeDoc.redeemedBy = userId;
    codeDoc.redeemedAt = new Date();
    await codeDoc.save();

    const durationMs = codeDoc.durationDays * 24 * 60 * 60 * 1000;
    let newExpiresAt = new Date(Date.now() + durationMs);

    const existingUser = await PremiumUser.findOne({ userId });

    if (existingUser) {
      const currentExpires = existingUser.expiresAt ? new Date(existingUser.expiresAt) : null;
      if (currentExpires && currentExpires > new Date()) {
        newExpiresAt = new Date(currentExpires.getTime() + durationMs);
      }
      existingUser.expiresAt = newExpiresAt;
      existingUser.premiumCode = codeDoc.code;
      existingUser.username = username;
      await existingUser.save();
    } else {
      const newPremiumUser = new PremiumUser({
        userId,
        username,
        expiresAt: newExpiresAt,
        premiumCode: codeDoc.code,
        addedBy: 'redeem_command'
      });
      await newPremiumUser.save();
    }

    if (client.premiumUsers) {
      client.premiumUsers.add(userId);
    }

    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`${tick_emoji} ¡Éxito! Tu suscripción Premium está activa hasta el **${newExpiresAt.toLocaleDateString()}**!`)
    );
    await interaction.editReply({ components: [container], flags: [MessageFlags.IsComponentsV2] });

    // Send public message
    let containerPublic = new ContainerBuilder();
    containerPublic.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`🌟 ¡<@${userId}> ha activado el estado **Premium** con un código de canje!`)
    );
    try {
      await interaction.channel.send({ components: [containerPublic], flags: [MessageFlags.IsComponentsV2] });
    } catch (e) {
      console.log('Could not send public redeem msg:', e.message);
    }

  } catch (err) {
    console.error("Error canjeando código premium:", err);
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`${cross_emoji} Ocurrió un error al canjear el código. Contacta al soporte.`)
    );
    await interaction.editReply({ components: [container], flags: [MessageFlags.IsComponentsV2] });
  }
}
