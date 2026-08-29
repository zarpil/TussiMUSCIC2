import { client } from "../aurora.js";
import dotenv from 'dotenv';
import { EmbedBuilder } from 'discord.js';
import { ltr_arrow_color_emoji } from "../emoji/emoji.js";

dotenv.config();

let logBuffer = [];
let logTimer = null;

async function flushLogs() {
  if (logBuffer.length === 0) return;
  
  // To respect limits, we'll process up to 20 logs per flush, and combine them
  const logsToSend = logBuffer.splice(0, 20);
  
  try {
    if (!process.env.LOG_CHANNEL_ID) return;
    const channel = await client.channels.fetch(process.env.LOG_CHANNEL_ID).catch(() => null);
    
    if (channel) {
      let description = logsToSend.join('\n\n');
      if (description.length > 4096) {
        description = description.substring(0, 4093) + '...';
      }
      
      const embed = new EmbedBuilder()
        .setTitle(`${ltr_arrow_color_emoji} Bot Activity Log`)
        .setDescription(description)
        .setColor(0x00AE86)
        .setTimestamp();

      await channel.send({ embeds: [embed] }).catch(() => null);
    }
  } catch (error) {
    // Ignore logging errors so it doesn't crash the server
  }

  // If there are still logs, schedule another flush
  if (logBuffer.length > 0) {
    logTimer = setTimeout(flushLogs, 5000);
  } else {
    logTimer = null;
  }
}

export function send_log(msg) {
  logBuffer.push(msg);
  if (!logTimer) {
    logTimer = setTimeout(flushLogs, 5000);
  }
}