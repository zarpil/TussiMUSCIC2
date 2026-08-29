import { MessageFlags} from "discord.js"
import { command_interactions } from "./interaction/commands.js";
import { button_interaction } from "./interaction/buttons_interaction.js";
import { setfilter } from "./interaction/filters.js";
import guild_join from "./interaction/guildjoin.js"
import { modal_interaction } from "./interaction/modal_interaction.js";
import { send_log } from "../../log/log.js";
import { cross_emoji } from "../../emoji/emoji.js";
export default async function commands_handler(client) {
  client.on('interactionCreate', async interaction => {
    try {
      //commands
      if (interaction.isCommand()) {
        command_interactions(interaction, client);
      }
      // Buttons
      if (interaction.isButton()) {
        button_interaction(interaction,client);
      }
      if (interaction.isModalSubmit()){
        modal_interaction(interaction,client)
      }
      
      // Autocomplete
      if (interaction.isAutocomplete()) {
        if (interaction.commandName === 'play') {
          const focusedValue = interaction.options.getFocused();
          if (!focusedValue) return await interaction.respond([]);
          
          try {
            const searchResult = await client.moonlink.search({
              query: focusedValue,
              requester: interaction.user.id
            });
            if (searchResult && searchResult.tracks && searchResult.tracks.length > 0) {
              const formatDuration = (ms) => {
                  if (!ms) return "0:00";
                  const minutes = Math.floor(ms / 60000);
                  const seconds = ((ms % 60000) / 1000).toFixed(0);
                  return minutes + ":" + (seconds < 10 ? '0' : '') + seconds;
              };
              const choices = searchResult.tracks.slice(0, 20).map(track => {
                const titleStr = `${track.author} - ${track.title} - ${formatDuration(track.duration)}`;
                return {
                  name: titleStr.length > 100 ? titleStr.substring(0, 97) + '...' : titleStr,
                  value: track.url || track.uri || track.title
                };
              });
              // Discord allows max 25 choices
              await interaction.respond(choices.slice(0, 25));
            } else {
              await interaction.respond([]);
            }
          } catch(e) {
            console.error('Autocomplete error:', e);
            // Must respond even on error
            try { await interaction.respond([]); } catch (err) {}
          }
        }
      }
    } catch (err) {
      console.error('❌ Interaction Error:', err);
      if (!interaction.replied && !interaction.deferred) {
        return await interaction.reply({ content: '⚠️ Something went wrong.', flags: MessageFlags.Ephemeral });
      } else {
       return  await interaction.followUp({ content: '⚠️ Something went wrong after replying.', flags: MessageFlags.Ephemeral });
      }
        return 1
    }
   if (interaction.isStringSelectMenu())
   {
    setfilter(interaction, client);
   }
  });

  
client.on('guildCreate', async (guild) => {
  guild_join(guild);
});

client.on('guildDelete', async (guild) => {
    try {
        const iconUrl = guild.iconURL({ dynamic: true, size: 256 }) || 'No Icon';
        send_log(`${cross_emoji} **Bot Left a Server!**\n**Name:** ${guild.name}\n**Members:** ${guild.memberCount}\n**ID:** ${guild.id}\n**Icon:** ${iconUrl}`);
    } catch(err) {
        console.error(`Failed to log leave for ${guild.name}:`, err);
    }
});

}
