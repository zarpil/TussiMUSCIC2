import { botEvents } from "./botEvents.js";
import { moonlinkEvents } from "./moonlinkEvents.js";
import { voiceEvent } from "./voiceEvent.js";

export async function eventHandler(client)
{
    await botEvents(client)
    await moonlinkEvents(client)
    await voiceEvent(client)
}