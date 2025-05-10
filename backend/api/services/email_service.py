"""
Email Service

This module provides functionality for sending email notifications,
including security alerts and other system notifications.
"""

import os
import email
import imaplib
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.application import MIMEApplication
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
import logging
from cryptography.fernet import Fernet
import boto3
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload
from sqlalchemy.orm import Session
from pathlib import Path

from api.config.email import EmailConfig
from api.utils.logger import get_logger
from ..models.email import Email, EmailTemplate
from ..schemas.email import EmailCreate, EmailStats
from ..config import settings

logger = get_logger(__name__)

class EmailService:
    def __init__(self):
        self.config = EmailConfig
        self.fernet = Fernet(self.config.ENCRYPTION_KEY.encode()) if self.config.ENCRYPTION_KEY else None
        self.storage_config = self.config.get_storage_config()
        self.setup_storage_client()
        self.attachments_dir = Path(settings.ATTACHMENTS_DIR)
        self.attachments_dir.mkdir(parents=True, exist_ok=True)
        
    def setup_storage_client(self):
        """Initialize storage client based on configuration."""
        if self.config.STORAGE_TYPE == "s3":
            self.storage_client = boto3.client(
                "s3",
                region_name=self.storage_config["region"],
                aws_access_key_id=self.storage_config["access_key"],
                aws_secret_access_key=self.storage_config["secret_key"]
            )
        elif self.config.STORAGE_TYPE == "gdrive":
            credentials = Credentials.from_authorized_user_info(
                info=self.storage_config["credentials"]
            )
            self.storage_client = build("drive", "v3", credentials=credentials)
        else:
            self.storage_client = None
            
    def connect_to_email_server(self) -> imaplib.IMAP4_SSL:
        """Connect to email server using IMAP."""
        try:
            mail = imaplib.IMAP4_SSL(self.config.SMTP_HOST)
            mail.login(self.config.SMTP_USER, self.config.SMTP_PASSWORD)
            return mail
        except Exception as e:
            logger.error(f"Failed to connect to email server: {str(e)}")
            raise
            
    def fetch_emails(self, mail: imaplib.IMAP4_SSL, batch_size: int = None) -> List[Dict[str, Any]]:
        """Fetch emails from the server."""
        batch_size = batch_size or self.config.MAX_EMAILS_PER_BATCH
        try:
            mail.select("INBOX")
            _, message_numbers = mail.search(None, "ALL")
            emails = []
            
            for num in message_numbers[0].split()[:batch_size]:
                _, msg_data = mail.fetch(num, "(RFC822)")
                email_body = msg_data[0][1]
                email_message = email.message_from_bytes(email_body)
                
                emails.append({
                    "id": num.decode(),
                    "from": email_message["from"],
                    "to": email_message["to"],
                    "subject": email_message["subject"],
                    "date": email_message["date"],
                    "body": self._get_email_body(email_message),
                    "attachments": self._get_attachments(email_message)
                })
                
            return emails
        except Exception as e:
            logger.error(f"Failed to fetch emails: {str(e)}")
            raise
            
    def _get_email_body(self, email_message: email.message.Message) -> str:
        """Extract email body from message."""
        body = ""
        if email_message.is_multipart():
            for part in email_message.walk():
                if part.get_content_type() == "text/plain":
                    body += part.get_payload(decode=True).decode()
        else:
            body = email_message.get_payload(decode=True).decode()
        return body
        
    def _get_attachments(self, email_message: email.message.Message) -> List[Dict[str, Any]]:
        """Extract attachments from email message."""
        attachments = []
        if email_message.is_multipart():
            for part in email_message.walk():
                if part.get_content_maintype() == "multipart":
                    continue
                if part.get("Content-Disposition") is None:
                    continue
                    
                filename = part.get_filename()
                if filename:
                    file_data = part.get_payload(decode=True)
                    attachments.append({
                        "filename": filename,
                        "data": file_data,
                        "content_type": part.get_content_type()
                    })
        return attachments
        
    def categorize_email(self, email_data: Dict[str, Any]) -> str:
        """Categorize email based on content and subject."""
        content = f"{email_data['subject']} {email_data['body']}".lower()
        
        for category, keywords in self.config.CATEGORIES.items():
            if any(keyword in content for keyword in keywords):
                return category
                
        return "uncategorized"
        
    def determine_priority(self, email_data: Dict[str, Any]) -> str:
        """Determine email priority based on content."""
        content = f"{email_data['subject']} {email_data['body']}".lower()
        
        for priority, keywords in self.config.PRIORITIES.items():
            if any(keyword in content for keyword in keywords):
                return priority
                
        return "low"
        
    def store_attachment(self, attachment: Dict[str, Any], patient_id: Optional[str] = None) -> str:
        """Store email attachment in configured storage."""
        try:
            if self.config.STORAGE_TYPE == "s3":
                key = f"{patient_id}/{attachment['filename']}" if patient_id else attachment['filename']
                self.storage_client.upload_fileobj(
                    attachment['data'],
                    self.storage_config['bucket'],
                    key
                )
                return f"s3://{self.storage_config['bucket']}/{key}"
                
            elif self.config.STORAGE_TYPE == "gdrive":
                file_metadata = {
                    'name': attachment['filename'],
                    'parents': [self.storage_config['folder_id']]
                }
                media = MediaFileUpload(attachment['filename'], mimetype=attachment['content_type'])
                file = self.storage_client.files().create(
                    body=file_metadata,
                    media_body=media,
                    fields='id'
                ).execute()
                return file['id']
                
            else:
                # Local storage
                os.makedirs(self.storage_config['path'], exist_ok=True)
                file_path = os.path.join(
                    self.storage_config['path'],
                    f"{patient_id}_{attachment['filename']}" if patient_id else attachment['filename']
                )
                with open(file_path, 'wb') as f:
                    f.write(attachment['data'])
                return file_path
                
        except Exception as e:
            logger.error(f"Failed to store attachment: {str(e)}")
            raise
            
    def send_email(self, db: Session, email_data: EmailCreate) -> Email:
        """Send a new email and store it in the database."""
        email = Email(
            to=email_data.to,
            subject=email_data.subject,
            body=email_data.body,
            cc=email_data.cc,
            bcc=email_data.bcc,
            priority=email_data.priority,
            category=email_data.category,
            attachments=email_data.attachments,
            date=datetime.now(),
            is_read=False,
            is_starred=False
        )
        
        db.add(email)
        db.commit()
        db.refresh(email)
        return email

    def get_emails(
        self,
        db: Session,
        page: int = 1,
        limit: int = 20
    ) -> List[Email]:
        """Get paginated list of emails."""
        offset = (page - 1) * limit
        return db.query(Email).offset(offset).limit(limit).all()

    def get_email(self, db: Session, email_id: int) -> Optional[Email]:
        """Get a single email by ID."""
        return db.query(Email).filter(Email.id == email_id).first()

    def mark_as_read(self, db: Session, email_id: int) -> bool:
        """Mark an email as read."""
        email = db.query(Email).filter(Email.id == email_id).first()
        if not email:
            return False
        
        email.is_read = True
        db.commit()
        return True

    def toggle_star(self, db: Session, email_id: int) -> bool:
        """Toggle the star status of an email."""
        email = db.query(Email).filter(Email.id == email_id).first()
        if not email:
            return False
        
        email.is_starred = not email.is_starred
        db.commit()
        return True

    def delete_email(self, db: Session, email_id: int) -> bool:
        """Delete an email and its attachments."""
        email = db.query(Email).filter(Email.id == email_id).first()
        if not email:
            return False
        
        # Delete attachments
        for attachment in email.attachments:
            try:
                os.remove(attachment)
            except OSError:
                pass
        
        db.delete(email)
        db.commit()
        return True

    def get_stats(self, db: Session) -> EmailStats:
        """Get email statistics."""
        total = db.query(Email).count()
        unread = db.query(Email).filter(Email.is_read == False).count()
        starred = db.query(Email).filter(Email.is_starred == True).count()
        
        return EmailStats(
            total=total,
            unread=unread,
            starred=starred
        )

    def search_emails(
        self,
        db: Session,
        query: str
    ) -> List[Email]:
        """Search emails by query string."""
        return db.query(Email).filter(
            (Email.subject.ilike(f"%{query}%")) |
            (Email.body.ilike(f"%{query}%")) |
            (Email.to.ilike(f"%{query}%"))
        ).all()

    def filter_emails(
        self,
        db: Session,
        category: Optional[str] = None,
        priority: Optional[str] = None
    ) -> List[Email]:
        """Filter emails by category and/or priority."""
        query = db.query(Email)
        
        if category:
            query = query.filter(Email.category == category)
        if priority:
            query = query.filter(Email.priority == priority)
            
        return query.all()

    def get_attachment_path(
        self,
        db: Session,
        email_id: int,
        attachment_id: str
    ) -> Optional[str]:
        """Get the path of an email attachment."""
        email = db.query(Email).filter(Email.id == email_id).first()
        if not email or not email.attachments:
            return None
            
        for attachment in email.attachments:
            if attachment_id in attachment:
                return attachment
        return None

    def process_emails(self) -> Dict[str, Any]:
        """Process incoming emails and return statistics."""
        try:
            mail = self.connect_to_email_server()
            emails = self.fetch_emails(mail)
            stats = {
                "total": len(emails),
                "categories": {},
                "priorities": {},
                "processed": 0,
                "errors": 0
            }
            
            for email_data in emails:
                try:
                    category = self.categorize_email(email_data)
                    priority = self.determine_priority(email_data)
                    
                    stats["categories"][category] = stats["categories"].get(category, 0) + 1
                    stats["priorities"][priority] = stats["priorities"].get(priority, 0) + 1
                    
                    # Store attachments if present
                    if email_data["attachments"]:
                        for attachment in email_data["attachments"]:
                            self.store_attachment(attachment)
                            
                    stats["processed"] += 1
                except Exception as e:
                    logger.error(f"Failed to process email: {str(e)}")
                    stats["errors"] += 1
                    
            return stats
        except Exception as e:
            logger.error(f"Failed to process emails: {str(e)}")
            raise
        finally:
            if 'mail' in locals():
                mail.logout()

email_service = EmailService() 

class EmailConfig:
    """Email configuration settings"""
    SMTP_SERVER = settings.SMTP_SERVER or "smtp.gmail.com"
    SMTP_PORT = settings.SMTP_PORT or 587
    SMTP_USERNAME = settings.SMTP_USERNAME or "notifications@dentamind.com"
    SMTP_PASSWORD = settings.SMTP_PASSWORD or ""
    FROM_EMAIL = settings.FROM_EMAIL or "notifications@dentamind.com"
    SECURITY_ALERTS_EMAIL = settings.SECURITY_ALERTS_EMAIL or "security@dentamind.com"
    ENABLE_EMAILS = settings.ENABLE_EMAILS or False


async def send_email_notification(
    to: str or List[str],
    subject: str,
    body: str,
    html_body: Optional[str] = None,
    cc: Optional[List[str]] = None,
    bcc: Optional[List[str]] = None
) -> bool:
    """
    Send an email notification
    
    Args:
        to: Recipient email address or list of addresses
        subject: Email subject
        body: Plain text email body
        html_body: Optional HTML email body
        cc: Optional list of CC recipients
        bcc: Optional list of BCC recipients
        
    Returns:
        True if the email was sent successfully, False otherwise
    """
    # Check if email sending is enabled
    if not EmailConfig.ENABLE_EMAILS:
        logger.info(
            f"Email sending is disabled. Would have sent email: "
            f"To: {to}, Subject: {subject}"
        )
        return True
    
    # Create message
    message = MIMEMultipart("alternative")
    message["Subject"] = subject
    message["From"] = EmailConfig.FROM_EMAIL
    
    # Handle single recipient or list
    if isinstance(to, list):
        message["To"] = ", ".join(to)
    else:
        message["To"] = to
    
    # Add CC if provided
    if cc:
        message["Cc"] = ", ".join(cc)
    
    # Add BCC if provided (not included in headers)
    recipients = []
    if isinstance(to, list):
        recipients.extend(to)
    else:
        recipients.append(to)
    if cc:
        recipients.extend(cc)
    if bcc:
        recipients.extend(bcc)
    
    # Attach plain text and html parts
    message.attach(MIMEText(body, "plain"))
    if html_body:
        message.attach(MIMEText(html_body, "html"))
    
    try:
        # Create secure connection with server and send email
        context = ssl.create_default_context()
        with smtplib.SMTP(EmailConfig.SMTP_SERVER, EmailConfig.SMTP_PORT) as server:
            server.starttls(context=context)
            server.login(EmailConfig.SMTP_USERNAME, EmailConfig.SMTP_PASSWORD)
            server.sendmail(
                EmailConfig.FROM_EMAIL, recipients, message.as_string()
            )
        logger.info(f"Email sent successfully to {to}")
        return True
    except Exception as e:
        logger.error(f"Failed to send email: {str(e)}")
        return False


async def send_security_alert_email(
    alert_type: str,
    severity: str,
    description: str,
    details: Optional[dict] = None,
    recipients: Optional[List[str]] = None
) -> bool:
    """
    Send a security alert email
    
    Args:
        alert_type: Type of security alert
        severity: Alert severity
        description: Alert description
        details: Optional additional details
        recipients: Optional list of recipients (defaults to security team)
        
    Returns:
        True if the email was sent successfully, False otherwise
    """
    # Default to security team if no recipients provided
    if not recipients:
        recipients = [EmailConfig.SECURITY_ALERTS_EMAIL]
    
    # Create subject line with severity
    subject = f"SECURITY ALERT: {severity.upper()} - {alert_type}"
    
    # Format the timestamp
    timestamp = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")
    
    # Build the email body
    body = f"""
SECURITY ALERT: {severity.upper()}

Type: {alert_type}
Time: {timestamp}
Description: {description}

"""
    
    # Add details if provided
    if details:
        body += "Details:\n"
        for key, value in details.items():
            body += f"- {key}: {value}\n"
    
    # Add footer
    body += "\nThis is an automated security alert from DentaMind. "
    body += "Please log in to the admin dashboard to investigate this alert."
    
    # Build HTML version
    html_body = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: {'#d32f2f' if severity == 'critical' or severity == 'high' else '#ed6c02'};">
            SECURITY ALERT: {severity.upper()}
        </h2>
        <div style="border-left: 4px solid {'#d32f2f' if severity == 'critical' or severity == 'high' else '#ed6c02'}; padding-left: 15px;">
            <p><strong>Type:</strong> {alert_type}</p>
            <p><strong>Time:</strong> {timestamp}</p>
            <p><strong>Description:</strong> {description}</p>
    """
    
    if details:
        html_body += "<p><strong>Details:</strong></p><ul>"
        for key, value in details.items():
            html_body += f"<li><strong>{key}:</strong> {value}</li>"
        html_body += "</ul>"
    
    html_body += """
        </div>
        <div style="margin-top: 20px; padding: 10px; background-color: #f5f5f5; border-radius: 4px;">
            <p style="margin: 0;">This is an automated security alert from DentaMind. 
            Please log in to the admin dashboard to investigate this alert.</p>
        </div>
    </div>
    """
    
    # Send the email
    return await send_email_notification(
        to=recipients,
        subject=subject,
        body=body,
        html_body=html_body
    )


async def send_weekly_security_digest(
    start_date: datetime,
    end_date: datetime,
    stats: dict,
    recipients: Optional[List[str]] = None
) -> bool:
    """
    Send weekly security digest email with statistics about alerts and resolutions
    
    Args:
        start_date: Start date for the report period
        end_date: End date for the report period
        stats: Dictionary containing alert statistics
        recipients: Optional list of recipients (defaults to security team)
        
    Returns:
        True if the email was sent successfully, False otherwise
    """
    # Default to security team if no recipients provided
    if not recipients:
        recipients = [EmailConfig.SECURITY_ALERTS_EMAIL]
    
    # Format the date range
    start_str = start_date.strftime("%Y-%m-%d")
    end_str = end_date.strftime("%Y-%m-%d")
    
    # Create subject line
    subject = f"Weekly Security Digest: {start_str} to {end_str}"
    
    # Build the email body
    body = f"""
DENTAMIND SECURITY DIGEST
Period: {start_str} to {end_str}

SUMMARY:
- Total alerts: {stats['total_alerts']}
- Critical alerts: {stats['alerts_by_severity'].get('critical', 0)}
- High severity alerts: {stats['alerts_by_severity'].get('high', 0)}
- Medium severity alerts: {stats['alerts_by_severity'].get('medium', 0)}
- Low severity alerts: {stats['alerts_by_severity'].get('low', 0)}

RESOLUTION STATUS:
- Open: {stats['open_alerts']}
- Acknowledged: {stats['acknowledged_alerts']}
- Resolved: {stats['resolved_alerts']}
- False positives: {stats['false_positives']}
- Escalated: {stats['escalated_alerts']}

Average resolution time: {stats['avg_resolution_time_hours']:.1f} hours

TOP ALERT CATEGORIES:
"""
    
    # Add category breakdown
    sorted_categories = sorted(
        stats['alerts_by_category'].items(),
        key=lambda x: x[1],
        reverse=True
    )
    
    for category, count in sorted_categories:
        body += f"- {category}: {count}\n"
    
    # Add footer
    body += f"""
This report has been automatically generated to aid HIPAA compliance.
Please review any open alerts in the security dashboard.
"""
    
    # Build HTML version
    html_body = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px;">
            DentaMind Security Digest
        </h2>
        <p><strong>Period:</strong> {start_str} to {end_str}</p>
        
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #2c3e50;">Summary</h3>
            <table style="width: 100%; border-collapse: collapse;">
                <tr>
                    <td style="padding: 8px 0;">Total alerts:</td>
                    <td style="padding: 8px 0; text-align: right;"><strong>{stats['total_alerts']}</strong></td>
                </tr>
                <tr>
                    <td style="padding: 8px 0;">Critical alerts:</td>
                    <td style="padding: 8px 0; text-align: right; color: #e74c3c;">
                        <strong>{stats['alerts_by_severity'].get('critical', 0)}</strong>
                    </td>
                </tr>
                <tr>
                    <td style="padding: 8px 0;">High severity alerts:</td>
                    <td style="padding: 8px 0; text-align: right; color: #e67e22;">
                        <strong>{stats['alerts_by_severity'].get('high', 0)}</strong>
                    </td>
                </tr>
                <tr>
                    <td style="padding: 8px 0;">Medium severity alerts:</td>
                    <td style="padding: 8px 0; text-align: right; color: #f39c12;">
                        <strong>{stats['alerts_by_severity'].get('medium', 0)}</strong>
                    </td>
                </tr>
                <tr>
                    <td style="padding: 8px 0;">Low severity alerts:</td>
                    <td style="padding: 8px 0; text-align: right; color: #3498db;">
                        <strong>{stats['alerts_by_severity'].get('low', 0)}</strong>
                    </td>
                </tr>
            </table>
        </div>
        
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #2c3e50;">Resolution Status</h3>
            <div style="display: flex; justify-content: space-between; margin-bottom: 15px;">
                <div style="text-align: center; padding: 10px; background: #ecf0f1; border-radius: 5px; width: 18%;">
                    <div style="font-size: 24px; font-weight: bold; color: #e74c3c;">{stats['open_alerts']}</div>
                    <div style="font-size: 14px;">Open</div>
                </div>
                <div style="text-align: center; padding: 10px; background: #ecf0f1; border-radius: 5px; width: 18%;">
                    <div style="font-size: 24px; font-weight: bold; color: #3498db;">{stats['acknowledged_alerts']}</div>
                    <div style="font-size: 14px;">Acknowledged</div>
                </div>
                <div style="text-align: center; padding: 10px; background: #ecf0f1; border-radius: 5px; width: 18%;">
                    <div style="font-size: 24px; font-weight: bold; color: #2ecc71;">{stats['resolved_alerts']}</div>
                    <div style="font-size: 14px;">Resolved</div>
                </div>
                <div style="text-align: center; padding: 10px; background: #ecf0f1; border-radius: 5px; width: 18%;">
                    <div style="font-size: 24px; font-weight: bold; color: #95a5a6;">{stats['false_positives']}</div>
                    <div style="font-size: 14px;">False Positive</div>
                </div>
                <div style="text-align: center; padding: 10px; background: #ecf0f1; border-radius: 5px; width: 18%;">
                    <div style="font-size: 24px; font-weight: bold; color: #9b59b6;">{stats['escalated_alerts']}</div>
                    <div style="font-size: 14px;">Escalated</div>
                </div>
            </div>
            <p><strong>Average resolution time:</strong> {stats['avg_resolution_time_hours']:.1f} hours</p>
        </div>
        
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #2c3e50;">Top Alert Categories</h3>
            <table style="width: 100%; border-collapse: collapse;">
"""
    
    # Add category breakdown to HTML
    for category, count in sorted_categories:
        html_body += f"""
                <tr>
                    <td style="padding: 8px 0;">{category}</td>
                    <td style="padding: 8px 0; text-align: right;"><strong>{count}</strong></td>
                </tr>
"""
    
    # Finish HTML
    html_body += f"""
            </table>
        </div>
        
        <div style="margin-top: 30px; padding: 15px; background-color: #e8f4f8; border-radius: 5px; font-size: 14px;">
            <p style="margin-top: 0;">
                This report has been automatically generated to aid HIPAA compliance.
                Please review any open alerts in the <a href="/admin/security/dashboard">security dashboard</a>.
            </p>
        </div>
    </div>
"""
    
    # Send the email
    return await send_email_notification(
        to=recipients,
        subject=subject,
        body=body,
        html_body=html_body
    )

async def send_critical_security_alert_email(
    alert: Dict[str, Any],
    recipients: Optional[List[str]] = None
) -> bool:
    """
    Send an immediate notification for a critical security alert
    
    Args:
        alert: Dictionary containing alert details
        recipients: Optional list of recipients (defaults to security team)
        
    Returns:
        True if the email was sent successfully, False otherwise
    """
    # Default to security team if no recipients provided
    if not recipients:
        recipients = [EmailConfig.SECURITY_ALERTS_EMAIL]
    
    # Create subject line
    subject = f"CRITICAL SECURITY ALERT: {alert['alert_type']}"
    
    # Format the timestamp
    if isinstance(alert['timestamp'], str):
        timestamp = alert['timestamp']
    else:
        timestamp = alert['timestamp'].strftime("%Y-%m-%d %H:%M:%S UTC")
    
    # Build the email body
    body = f"""
!!! CRITICAL SECURITY ALERT !!!

Type: {alert['alert_type']}
Time: {timestamp}
Category: {alert['category']}
Description: {alert['description']}

Affected Entities:
"""
    
    # Add entity information
    if alert.get('user_id'):
        body += f"- User: {alert['user_id']}\n"
    if alert.get('ip_address'):
        body += f"- IP Address: {alert['ip_address']}\n"
    if alert.get('patient_id'):
        body += f"- Patient ID: {alert['patient_id']}\n"
    if alert.get('resource_path'):
        body += f"- Resource: {alert['resource_path']}\n"
    
    # Add details if available
    if alert.get('details'):
        body += "\nAdditional Details:\n"
        for key, value in alert['details'].items():
            if key not in ['timestamp', 'alert_type', 'category', 'description', 'user_id', 'ip_address', 'patient_id', 'resource_path']:
                body += f"- {key}: {value}\n"
    
    # Add action required
    body += f"""
ACTION REQUIRED: This alert requires immediate investigation.
Alert ID: {alert['alert_id']}

Please log in to the admin dashboard to investigate this alert:
/admin/security/alerts/{alert['alert_id']}
"""
    
    # Build HTML version with red styling for critical alert
    html_body = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #ffebee; border-left: 4px solid #d32f2f; padding: 15px; margin-bottom: 20px;">
            <h2 style="color: #d32f2f; margin-top: 0;">CRITICAL SECURITY ALERT</h2>
            <p style="font-weight: bold;">This alert requires immediate investigation</p>
        </div>
        
        <table style="width: 100%; border-collapse: collapse;">
            <tr>
                <td style="padding: 8px 0; width: 120px;"><strong>Type:</strong></td>
                <td style="padding: 8px 0;">{alert['alert_type']}</td>
            </tr>
            <tr>
                <td style="padding: 8px 0;"><strong>Time:</strong></td>
                <td style="padding: 8px 0;">{timestamp}</td>
            </tr>
            <tr>
                <td style="padding: 8px 0;"><strong>Category:</strong></td>
                <td style="padding: 8px 0;">{alert['category']}</td>
            </tr>
            <tr>
                <td style="padding: 8px 0;"><strong>Description:</strong></td>
                <td style="padding: 8px 0;">{alert['description']}</td>
            </tr>
            <tr>
                <td style="padding: 8px 0; vertical-align: top;"><strong>Alert ID:</strong></td>
                <td style="padding: 8px 0;">{alert['alert_id']}</td>
            </tr>
        </table>
        
        <h3 style="margin-top: 20px; color: #d32f2f;">Affected Entities</h3>
        <table style="width: 100%; border-collapse: collapse;">
"""
    
    # Add entity information to HTML
    if alert.get('user_id'):
        html_body += f"""
            <tr>
                <td style="padding: 8px 0; width: 120px;"><strong>User:</strong></td>
                <td style="padding: 8px 0;">{alert['user_id']}</td>
            </tr>
"""
    
    if alert.get('ip_address'):
        html_body += f"""
            <tr>
                <td style="padding: 8px 0; width: 120px;"><strong>IP Address:</strong></td>
                <td style="padding: 8px 0;">{alert['ip_address']}</td>
            </tr>
"""
    
    if alert.get('patient_id'):
        html_body += f"""
            <tr>
                <td style="padding: 8px 0; width: 120px;"><strong>Patient ID:</strong></td>
                <td style="padding: 8px 0;">{alert['patient_id']}</td>
            </tr>
"""
    
    if alert.get('resource_path'):
        html_body += f"""
            <tr>
                <td style="padding: 8px 0; width: 120px;"><strong>Resource:</strong></td>
                <td style="padding: 8px 0;">{alert['resource_path']}</td>
            </tr>
"""
    
    # Add details section to HTML if available
    if alert.get('details'):
        html_body += f"""
        </table>
        
        <h3 style="margin-top: 20px; color: #d32f2f;">Additional Details</h3>
        <table style="width: 100%; border-collapse: collapse;">
"""
        for key, value in alert['details'].items():
            if key not in ['timestamp', 'alert_type', 'category', 'description', 'user_id', 'ip_address', 'patient_id', 'resource_path']:
                html_body += f"""
            <tr>
                <td style="padding: 8px 0; width: 120px;"><strong>{key}:</strong></td>
                <td style="padding: 8px 0;">{value}</td>
            </tr>
"""
    
    # Finish HTML with action button
    html_body += f"""
        </table>
        
        <div style="margin-top: 30px; text-align: center;">
            <a href="/admin/security/alerts/{alert['alert_id']}" 
               style="display: inline-block; background-color: #d32f2f; color: white; 
                      padding: 12px 20px; text-decoration: none; border-radius: 4px; 
                      font-weight: bold;">
                Investigate Alert
            </a>
        </div>
        
        <p style="margin-top: 30px; font-size: 14px; color: #666;">
            This is an automated security alert from DentaMind. For assistance, 
            please contact the security team at {EmailConfig.SECURITY_ALERTS_EMAIL}.
        </p>
    </div>
"""
    
    # Send the email with high importance
    return await send_email_notification(
        to=recipients,
        subject=subject,
        body=body,
        html_body=html_body
    ) 