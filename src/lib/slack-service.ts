'use server';

import { WebClient } from '@slack/web-api';

const token = process.env.SLACK_BOT_TOKEN;
const web = token ? new WebClient(token) : null;

/**
 * Sends a message to a Slack channel.
 * @param channelId The ID of the channel to post in.
 * @param text The message text to send.
 */
export async function sendSlackMessage(channelId: string, text: string): Promise<void> {
  if (!web) {
    console.warn('Slack Bot Token niet geconfigureerd, kan geen bericht verzenden.');
    return;
  }

  try {
    await web.chat.postMessage({
      channel: channelId,
      text: text,
    });
  } catch (error) {
    console.error('Fout bij verzenden van Slack-bericht:', error);
    // Do not re-throw, failing to send a notification should not crash the app
  }
}
