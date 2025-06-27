
'use server';

/**
 * Sends a message to a Microsoft Teams channel using an Incoming Webhook.
 * @param webhookUrl The URL of the Incoming Webhook.
 * @param message The plain text message to send.
 */
export async function sendTeamsMessage(webhookUrl: string, message: string): Promise<void> {
  if (!webhookUrl) {
    console.warn('Microsoft Teams Webhook URL not configured, cannot send message.');
    return;
  }

  // A simple adaptive card format for the message
  const payload = {
    "@type": "MessageCard",
    "@context": "http://schema.org/extensions",
    "themeColor": "0076D7", // Blue
    "summary": "Notification from Chorey",
    "sections": [{
        "activityTitle": "Chorey Notificatie",
        "text": message
    }]
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
      // Teams webhooks often return a text response on failure.
      const errorText = await response.text();
      console.error(`Error sending Teams message. Status: ${response.status}. Body: ${errorText}`);
    }
  } catch (error) {
    console.error('Failed to send message to Teams webhook:', error);
  }
}
