export default async function setVoiceStatus(client, channelId, text) {
  try {
    const MAX_LENGTH = 110;
    const ELLIPSIS = "...";
    let statusText = text;
    if (statusText.length > MAX_LENGTH) {
      statusText = statusText.slice(0, MAX_LENGTH - ELLIPSIS.length) + ELLIPSIS;
    }

    await client.rest.put(`/channels/${channelId}/voice-status`, {
      body: {
        status: statusText,
      },
    });
  } catch (err) {
    console.error("Voice status update failed:", err);
  }
}
