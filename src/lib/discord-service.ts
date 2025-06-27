
'use server';

/**
 * Sends a message to a Discord channel using an Incoming Webhook.
 * @param webhookUrl The URL of the Incoming Webhook.
 * @param message The plain text message to send.
 */
export async function sendDiscordMessage(webhookUrl: string, message: string): Promise<void> {
  if (!webhookUrl) {
    console.warn('Discord Webhook URL not configured, cannot send message.');
    return;
  }

  // A simple Discord embed format
  const payload = {
    embeds: [
      {
        title: "Chorey Notificatie",
        description: message,
        color: 3447003, // A nice blue color
        timestamp: new Date().toISOString(),
      },
    ],
  };

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error sending Discord message. Status: ${response.status}. Body: ${errorText}`);
    }
  } catch (error) {
    console.error('Failed to send message to Discord webhook:', error);
  }
}
