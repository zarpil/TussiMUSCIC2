import disconnect_on_vc_empty from "../player/player_disconnect.js"
export async function voiceEvent(client)
{
      client.on('voiceStateUpdate', async (oldState, newState) => {
    await disconnect_on_vc_empty(client,oldState ,newState);
  });
}