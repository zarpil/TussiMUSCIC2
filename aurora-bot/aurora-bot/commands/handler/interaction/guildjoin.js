import { send_log } from "../../../log/log.js";
import { tick_emoji } from "../../../emoji/emoji.js";

export default async function guild_join(guild) {
    try {
        const iconUrl = guild.iconURL({ dynamic: true, size: 256 }) || 'No Icon';
        send_log(`${tick_emoji} **Bot Joined a Server!**\n**Name:** ${guild.name}\n**Members:** ${guild.memberCount}\n**ID:** ${guild.id}\n**Icon:** ${iconUrl}`);
    } catch (err) {
        console.error(`Failed to log join for ${guild.name}:`, err);
    }
}