import { WebClient } from '@slack/web-api';

const slack = new WebClient(process.env.SLACK_BOT_TOKEN);

interface SlackMessageOptions {
  channel: string;
  text: string;
  blocks?: any[];
}

export async function sendSlackMessage(options: SlackMessageOptions): Promise<void> {
  await slack.chat.postMessage({
    channel: options.channel,
    text: options.text,
    blocks: options.blocks
  });
} 