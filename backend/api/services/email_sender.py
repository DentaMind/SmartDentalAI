import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.application import MIMEApplication
from typing import List, Optional
import logging
from pathlib import Path
import ssl

from ..config import settings

logger = logging.getLogger(__name__)

class EmailSender:
    def __init__(self):
        self.smtp_server = settings.SMTP_SERVER
        self.smtp_port = settings.SMTP_PORT
        self.smtp_username = settings.SMTP_USERNAME
        self.smtp_password = settings.SMTP_PASSWORD
        self.from_email = settings.FROM_EMAIL
        self.use_tls = settings.SMTP_USE_TLS

    async def send(
        self,
        to: str,
        subject: str,
        body: str,
        cc: Optional[str] = None,
        bcc: Optional[str] = None,
        attachments: Optional[List[str]] = None
    ) -> bool:
        """Send an email with optional attachments."""
        try:
            # Create message
            msg = MIMEMultipart()
            msg['From'] = self.from_email
            msg['To'] = to
            msg['Subject'] = subject
            
            if cc:
                msg['Cc'] = cc
            if bcc:
                msg['Bcc'] = bcc

            # Add body
            msg.attach(MIMEText(body, 'plain'))

            # Add attachments
            if attachments:
                for attachment_path in attachments:
                    with open(attachment_path, 'rb') as f:
                        part = MIMEApplication(
                            f.read(),
                            Name=Path(attachment_path).name
                        )
                    part['Content-Disposition'] = f'attachment; filename="{Path(attachment_path).name}"'
                    msg.attach(part)

            # Create secure SSL context
            context = ssl.create_default_context()

            # Connect to SMTP server
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                if self.use_tls:
                    server.starttls(context=context)
                
                # Login if credentials provided
                if self.smtp_username and self.smtp_password:
                    server.login(self.smtp_username, self.smtp_password)
                
                # Send email
                recipients = [to]
                if cc:
                    recipients.extend(cc.split(','))
                if bcc:
                    recipients.extend(bcc.split(','))
                
                server.send_message(msg, self.from_email, recipients)
                
                logger.info(f"Email sent successfully to {to}")
                return True

        except Exception as e:
            logger.error(f"Failed to send email: {str(e)}")
            return False

    def validate_email(self, email: str) -> bool:
        """Validate email format."""
        import re
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        return bool(re.match(pattern, email))

    def sanitize_content(self, content: str) -> str:
        """Sanitize email content to prevent injection attacks."""
        import html
        return html.escape(content)

    def check_rate_limit(self, recipient: str) -> bool:
        """Check if sending to recipient is within rate limits."""
        # TODO: Implement rate limiting logic
        return True 