import logging
from typing import Optional
from datetime import datetime
import aiohttp
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig
from models.learning_insights import Alert
from config import Settings

logger = logging.getLogger(__name__)

class NotificationService:
    def __init__(self, settings: Settings):
        self.settings = settings
        self.mail_config = ConnectionConfig(
            MAIL_USERNAME=settings.smtp_username,
            MAIL_PASSWORD=settings.smtp_password,
            MAIL_FROM=settings.smtp_from_email,
            MAIL_PORT=settings.smtp_port,
            MAIL_SERVER=settings.smtp_server,
            MAIL_SSL_TLS=settings.smtp_use_tls,
            USE_CREDENTIALS=True
        )
        self.fastmail = FastMail(self.mail_config)

    async def send_slack_alert(self, alert: Alert) -> bool:
        """Send alert to Slack channel."""
        if not self.settings.slack_webhook_url:
            return False

        color = {
            'HIGH': '#ff0000',
            'MEDIUM': '#ffa500',
            'LOW': '#ffff00'
        }.get(alert.severity, '#808080')

        message = {
            "attachments": [{
                "color": color,
                "title": f"🤖 DentaMind Learning Alert: {alert.title}",
                "text": alert.description,
                "fields": [
                    {
                        "title": "Type",
                        "value": alert.type,
                        "short": True
                    },
                    {
                        "title": "Severity",
                        "value": alert.severity,
                        "short": True
                    },
                    {
                        "title": "Metric",
                        "value": f"{alert.metric:.2f}",
                        "short": True
                    },
                    {
                        "title": "Time",
                        "value": datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC"),
                        "short": True
                    }
                ]
            }]
        }

        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(self.settings.slack_webhook_url, json=message) as response:
                    return response.status == 200
        except Exception as e:
            logger.error(f"Failed to send Slack alert: {str(e)}")
            return False

    async def send_email_alert(self, alert: Alert) -> bool:
        """Send alert via email."""
        try:
            message = MessageSchema(
                subject=f"DentaMind Learning Alert: {alert.title}",
                recipients=[self.settings.founder_email],
                body=f"""
                <h2>🤖 DentaMind Learning Alert</h2>
                <p><strong>{alert.title}</strong></p>
                <p>{alert.description}</p>
                <br>
                <table>
                    <tr>
                        <td><strong>Type:</strong></td>
                        <td>{alert.type}</td>
                    </tr>
                    <tr>
                        <td><strong>Severity:</strong></td>
                        <td>{alert.severity}</td>
                    </tr>
                    <tr>
                        <td><strong>Metric:</strong></td>
                        <td>{alert.metric:.2f}</td>
                    </tr>
                    <tr>
                        <td><strong>Time:</strong></td>
                        <td>{datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC")}</td>
                    </tr>
                </table>
                <br>
                <p>View details in your <a href="{self.settings.app_url}/founder/insights">Learning Insights Dashboard</a></p>
                """,
                subtype="html"
            )

            await self.fastmail.send_message(message)
            return True
        except Exception as e:
            logger.error(f"Failed to send email alert: {str(e)}")
            return False

    async def send_alert(self, alert: Alert) -> None:
        """Send alert through all configured channels."""
        # Always try Slack first for immediate notification
        slack_sent = await self.send_slack_alert(alert)
        
        # For high severity alerts or if Slack failed, also send email
        if alert.severity == 'HIGH' or not slack_sent:
            await self.send_email_alert(alert)
            
        # Log the alert
        logger.info(f"Alert sent - Type: {alert.type}, Severity: {alert.severity}, Title: {alert.title}") 