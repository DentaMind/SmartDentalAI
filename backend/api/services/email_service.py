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