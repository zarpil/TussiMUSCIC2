import pause_music from "../../music/pause.js";
import stop_music from "../../music/stop.js";
import  looptrack, { loopOff, loopQueue, loopTrack }  from "../../music/repeat.js"
import { MessageFlags } from "discord.js"
import { skip_track } from "../../music/skip.js";
import { song_resume } from "../../music/resume.js";
import { Volume, volume_down, volume_up } from "../../music/volume.js";
import { Autoplay } from "../../music/autoplay.js";
import { seekModal } from "../../music/seek.js";
import { Shuffle } from "../../music/shuffle.js";
import { Track_List } from "../../music/listqueue.js";
export async function button_interaction(interaction, client)
{
    switch (interaction.customId) {
              case 'toggle_loop': await looptrack(client, interaction); break;
              case 'play_button':  await song_resume(client ,interaction); break;
              case 'pause_button': await pause_music(client, interaction); break;
              case 'stop_button': await stop_music(client, interaction); break;
              case "skip_button": await skip_track(client, interaction);break;
              case "volume_up_button": await volume_up(client, interaction);break;
              case "volume_down_button": await volume_down(client, interaction);break;
              case "loopoff": await loopOff(client,interaction); break;
              case "looptrack": await loopTrack(client,interaction); break;
              case "loopqueue": await loopQueue(client,interaction); break;
              case "auto_play": await Autoplay(client,interaction); break;
              case "seek": await seekModal(client,interaction); break;
              case "shuffle": await Shuffle(client,interaction); break;
              case "queue_list": await Track_List(client,interaction); break;
              case "volume": await Volume(interaction); break;
              default:
                await interaction.reply({ content: '❓ Unknown button.', flags: MessageFlags.Ephemeral });
                break;
            }
        
        
}