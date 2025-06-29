'use server';

import { WebClient } from '@slack/web-api';
import { env } from '@/lib/env';

const token = env.SLACK_BOT_TOKEN;
const web = token ? new WebClient(token) : null;

/**
 * Sends a message to a Slack channel using Block Kit.
 * @param channelId The ID of the channel to post in.
 * @param text The message text to send.
 */
export async function sendSlackMessage(channelId: string, text: string): Promise<void> {
  if (!web) {
    console.warn('Slack Bot Token niet geconfigureerd, kan geen bericht verzenden.');
    return;
  }

  try {
    // Using Block Kit for a richer message format
    await web.chat.postMessage({
      channel: channelId,
      text: `Chorey Notificatie: ${text}`, // Fallback for notifications
      blocks: [
        {
          "type": "section",
          "text": {
            "type": "mrkdwn",
            "text": `*Chorey Notificatie*`
          }
        },
        {
          "type": "divider"
        },
        {
          "type": "section",
          "text": {
            "type": "plain_text",
            "text": text,
            "emoji": true
          }
        }
      ]
    });
  } catch (error) {
    console.error('Fout bij verzenden van Slack-bericht:', error);
    // Do not re-throw, failing to send a notification should not crash the app
  }
}
