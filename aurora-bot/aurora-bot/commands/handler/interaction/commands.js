import playmusic from "../../music/play.js";
import pause_music from "../../music/pause.js";
import stop_music from "../../music/stop.js";
import  looptrack  from "../../music/repeat.js";
import { skip_track } from "../../music/skip.js";
import { song_resume } from "../../music/resume.js";
import { Volume } from "../../music/volume.js";
import { Track_List } from "../../music/listqueue.js";
import {CreateInvite} from "../../../utils/invite.js"
import {seekModal} from "../../music/seek.js";
import { Autoplay } from "../../music/autoplay.js";
import { Shuffle } from "../../music/shuffle.js";
import weblink_execute from "../../music/weblink.js";
import { RedeemCommand } from "../../music/redeem.js";

export async function command_interactions(interaction, client) {
    switch (interaction.commandName) {
        case 'play': await playmusic(client, interaction); break;
        case 'resume': await song_resume(client, interaction); break;
        case 'pause': await pause_music(client, interaction); break;
        case 'stop': await stop_music(client, interaction); break;
        case 'loop': await looptrack(client, interaction); break;
        case 'skip': await  skip_track(client, interaction); break;
        case 'generate-invite': await CreateInvite(client,interaction); break;
        case 'seek': await seekModal(client,interaction); break;
        case 'auto-play': await Autoplay(client,interaction); break;
        case 'shuffle': await Shuffle(client,interaction); break;
        case 'listqueue': await Track_List(client,interaction); break;
        case 'volume': await Volume(interaction); break;
        case 'web-link': await weblink_execute(client, interaction); break;
        case 'redeem': await RedeemCommand(client, interaction); break;
    }


}