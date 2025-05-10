import os
from typing import Dict, Any
from datetime import timedelta
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class EmailConfig:
    # SMTP Configuration
    SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
    SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
    SMTP_USER = os.getenv("SMTP_USER")
    SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")
    EMAIL_FROM = os.getenv("EMAIL_FROM", "noreply@dentamind.com")
    
    # Email Processing
    EMAIL_CHECK_INTERVAL = 300  # seconds
    MAX_EMAILS_PER_BATCH = 50
    EMAIL_RETENTION_DAYS = 30
    
    # Encryption
    ENCRYPTION_KEY = os.getenv("ENCRYPTION_KEY")
    ENCRYPTION_ALGORITHM = "AES-256-GCM"
    
    # Email Categories
    CATEGORIES = {
        "patient_requests": ["appointment", "x-ray", "insurance", "prescription"],
        "insurance_billing": ["claim", "payment", "denial", "approval"],
        "lab_communications": ["case", "shipping", "arrival", "status"],
        "internal_office": ["memo", "policy", "staff", "meeting"]
    }
    
    # Priority Levels
    PRIORITIES = {
        "urgent": ["emergency", "denial", "delay", "critical"],
        "high": ["appointment", "claim", "payment"],
        "medium": ["follow-up", "reminder", "update"],
        "low": ["newsletter", "marketing", "general"]
    }
    
    # Response Templates
    TEMPLATES = {
        "appointment_confirmation": {
            "subject": "Appointment Confirmation - {patient_name}",
            "body": """Hi {patient_name},
            
This is a confirmation of your appointment on {date} at {time} with Dr. {doctor_name}.
Please arrive 10 minutes early and complete any necessary forms online.

Best regards,
DentaMind Team"""
        },
        "post_op_instructions": {
            "subject": "Post-Operative Instructions - {patient_name}",
            "body": """Hi {patient_name},
            
Thank you for your recent visit. Please find attached your post-operative instructions.
If you have any questions or concerns, please don't hesitate to contact us.

Best regards,
DentaMind Team"""
        },
        "insurance_update": {
            "subject": "Insurance Update - {patient_name}",
            "body": """Hi {patient_name},
            
We have received an update regarding your insurance coverage. Please find the details attached.
If you have any questions, please contact our billing department.

Best regards,
DentaMind Team"""
        }
    }
    
    # File Handling
    ALLOWED_ATTACHMENTS = [".pdf", ".jpg", ".jpeg", ".png", ".dcm"]
    MAX_ATTACHMENT_SIZE = 25 * 1024 * 1024  # 25MB
    
    # Storage Configuration
    STORAGE_TYPE = os.getenv("STORAGE_TYPE", "local")  # local, s3, gdrive
    STORAGE_PATH = os.getenv("STORAGE_PATH", "attachments")
    
    # Analytics
    ANALYTICS_ENABLED = True
    TRACK_OPENS = True
    TRACK_CLICKS = True
    ANALYTICS_RETENTION_DAYS = 90
    
    @classmethod
    def get_storage_config(cls) -> Dict[str, Any]:
        """Get storage configuration based on environment."""
        if cls.STORAGE_TYPE == "s3":
            return {
                "bucket": os.getenv("AWS_S3_BUCKET"),
                "region": os.getenv("AWS_REGION"),
                "access_key": os.getenv("AWS_ACCESS_KEY_ID"),
                "secret_key": os.getenv("AWS_SECRET_ACCESS_KEY")
            }
        elif cls.STORAGE_TYPE == "gdrive":
            return {
                "credentials": os.getenv("GOOGLE_DRIVE_CREDENTIALS"),
                "folder_id": os.getenv("GOOGLE_DRIVE_FOLDER_ID")
            }
        else:
            return {"path": cls.STORAGE_PATH} 