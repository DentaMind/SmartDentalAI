from typing import Dict, Any
from datetime import datetime
from jinja2 import Environment, FileSystemLoader
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import logging
from pathlib import Path

class EmailService:
    def __init__(self):
        self.env = Environment(
            loader=FileSystemLoader(str(Path(__file__).parent / 'templates' / 'email')),
            autoescape=True
        )
        self.smtp_server = "smtp.gmail.com"
        self.smtp_port = 587
        self.sender_email = "notifications@dentamind.com"
        # Note: In production, use environment variables or secure storage
        self.sender_password = "your-smtp-password"

    def _send_email(self, to_email: str, subject: str, html_content: str):
        try:
            msg = MIMEMultipart()
            msg['From'] = self.sender_email
            msg['To'] = to_email
            msg['Subject'] = subject

            msg.attach(MIMEText(html_content, 'html'))

            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls()
                server.login(self.sender_email, self.sender_password)
                server.send_message(msg)
        except Exception as e:
            logging.error(f"Failed to send email: {str(e)}")
            raise

    def send_new_edit_notification(self, to_email: str, plan_id: str, editor_name: str, changes: Dict[str, Any]):
        template = self.env.get_template('new_edit.html')
        html_content = template.render(
            editor_name=editor_name,
            plan_id=plan_id,
            changes=changes,
            timestamp=datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        )
        self._send_email(
            to_email,
            f"New Edit Proposed for Treatment Plan {plan_id}",
            html_content
        )

    def send_edit_approval_notification(self, to_email: str, plan_id: str, approver_name: str, status: str):
        template = self.env.get_template('edit_approval.html')
        html_content = template.render(
            approver_name=approver_name,
            plan_id=plan_id,
            status=status,
            timestamp=datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        )
        self._send_email(
            to_email,
            f"Your Edit for Treatment Plan {plan_id} has been {status}",
            html_content
        )

    def send_financial_change_notification(self, to_email: str, plan_id: str, changer_name: str, changes: Dict[str, Any]):
        template = self.env.get_template('financial_change.html')
        html_content = template.render(
            changer_name=changer_name,
            plan_id=plan_id,
            changes=changes,
            timestamp=datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        )
        self._send_email(
            to_email,
            f"Financial Changes Made to Treatment Plan {plan_id}",
            html_content
        )

    def send_override_request_notification(self, to_email: str, plan_id: str, requester_name: str, reason: str):
        template = self.env.get_template('override_request.html')
        html_content = template.render(
            requester_name=requester_name,
            plan_id=plan_id,
            reason=reason,
            timestamp=datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        )
        self._send_email(
            to_email,
            f"Financial Override Request for Treatment Plan {plan_id}",
            html_content
        )

email_service = EmailService() 