import axios from 'axios';

export async function sendSlackMessage(params: {
  text: string;
  channel: string;
}) {
  try {
    if (!process.env.SLACK_WEBHOOK_URL) {
      console.warn('Slack webhook URL not configured');
      return;
    }

    await axios.post(process.env.SLACK_WEBHOOK_URL, {
      text: params.text,
      channel: params.channel,
    });

    console.log('Slack notification sent successfully');
  } catch (error) {
    console.error('Failed to send Slack notification:', error);
  }
} 