import { Seek } from "../../music/seek.js";

export async function modal_interaction(interaction,client)
{
switch(interaction.customId)
{
    case'seekmodal': await Seek(client,interaction); break;
}
}