import GuildConfig from '../models/Guild.js';

export default async function disconnect_on_vc_empty(client, oldState, newState) {
  const guild = oldState.guild || newState.guild;
  if (!guild) return;

  const player = client.moonlink?.players?.get(guild.id);
  if (!player || !player.connected) return;

  const botVcId = player.voiceChannelId || player.voiceChannel;
  if (!botVcId) return;

  const botVc = guild.channels.cache.get(botVcId);
  if (!botVc) return;

  // Count human (non-bot) members in the bot's voice channel
  const nonBotMembers = botVc.members.filter(member => !member.user.bot);

  // Check 24/7 Mode Status
  try {
    const config = await GuildConfig.findOne({ guildId: guild.id });
    if (config && config.settings?.twentyFourSeven?.enabled) {
      if (nonBotMembers.size === 0) {
        // No human users left in VC -> Auto Pause playback (only if currently playing)
        if (player.playing && !player.paused) {
          player.pause();
          player.autoPausedBy247 = true;
          console.log(`[24/7] ⏸️ No human listeners left in VC. Auto-paused playback in ${guild.name}.`);
        }
      } else {
        // Human users present in VC -> ONLY auto-resume if song was auto-paused due to empty VC and NOT manually paused
        if (player.paused && player.autoPausedBy247 === true && !player.manuallyPaused) {
          player.resume();
          player.autoPausedBy247 = false;
          console.log(`[24/7] ▶️ Human listener joined VC. Auto-resumed playback in ${guild.name}.`);
        }
      }
      return; // Return so player is NEVER destroyed in 24/7 mode
    }
  } catch (e) {
    console.error('[24/7] Error checking 24/7 mode in disconnect_on_vc_empty:', e.message);
  }

  // Normal mode (24/7 OFF) -> Destroy player if VC is empty or bot was disconnected
  if (nonBotMembers.size === 0) {
    console.log(`[Voice] Channel empty in ${guild.name}. Waiting 60s before leaving...`);
    
    // Clear any existing timeout
    if (client.emptyVcTimeouts?.has(guild.id)) {
      clearTimeout(client.emptyVcTimeouts.get(guild.id));
    }
    
    if (!client.emptyVcTimeouts) client.emptyVcTimeouts = new Map();
    
    const timeout = setTimeout(async () => {
      const currentPlayer = client.moonlink?.players?.get(guild.id);
      if (currentPlayer && currentPlayer.connected) {
        const currentBotVc = guild.channels.cache.get(currentPlayer.voiceChannelId || currentPlayer.voiceChannel);
        if (currentBotVc) {
          const currentNonBotMembers = currentBotVc.members.filter(member => !member.user.bot);
          if (currentNonBotMembers.size === 0) {
            console.log(`[Voice] Channel still empty in ${guild.name} after 60s. Leaving...`);
            await currentPlayer.destroy("Empty channel timeout");
          }
        }
      }
      client.emptyVcTimeouts.delete(guild.id);
    }, 60000); // 60 seconds
    
    client.emptyVcTimeouts.set(guild.id, timeout);
  } else {
    // Human joined, clear timeout
    if (client.emptyVcTimeouts?.has(guild.id)) {
      console.log(`[Voice] Human joined ${guild.name}. Cancelling leave timeout.`);
      clearTimeout(client.emptyVcTimeouts.get(guild.id));
      client.emptyVcTimeouts.delete(guild.id);
    }
  }

  // Handle manual bot kick
  if (oldState.channelId &&
      !newState.channelId &&
      oldState.member.id === client.user.id
  ) {
    if (client.emptyVcTimeouts?.has(guild.id)) {
      clearTimeout(client.emptyVcTimeouts.get(guild.id));
      client.emptyVcTimeouts.delete(guild.id);
    }
    await player.destroy("Bot was disconnected");
  }
}