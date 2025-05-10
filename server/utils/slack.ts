import axios from 'axios';

interface SlackMessage {
  text: string;
  color?: 'good' | 'warning' | 'danger';
}

export const sendSlackNotification = async (message: SlackMessage) => {
  if (!process.env.SLACK_WEBHOOK_URL) {
    console.warn('Slack webhook URL not configured, skipping notification');
    return;
  }

  try {
    const response = await fetch(process.env.SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        attachments: [{
          color: message.color || 'good',
          text: message.text,
          ts: Math.floor(Date.now() / 1000)
        }]
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to send Slack notification: ${response.statusText}`);
    }

    console.log('Slack notification sent successfully');
  } catch (error) {
    console.error('Error sending Slack notification:', error);
    throw error;
  }
}; 