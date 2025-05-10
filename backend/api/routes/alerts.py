from fastapi import APIRouter, HTTPException
from typing import Dict, Any
from pydantic import BaseModel
import smtplib
from email.mime.text import MIMEText
from twilio.rest import Client
import os
from datetime import datetime

router = APIRouter()

class AlertConfig(BaseModel):
    email: bool
    sms: bool
    thresholds: Dict[str, float]

class AlertTestRequest(BaseModel):
    type: str

# In-memory storage for alert config (replace with database in production)
alert_config = AlertConfig(
    email=True,
    sms=False,
    thresholds={
        "cpu": 80,
        "memory": 85,
        "disk": 90
    }
)

def send_email_alert(message: str):
    """Send email alert using SMTP."""
    try:
        sender = os.getenv("ALERT_EMAIL_SENDER")
        recipient = os.getenv("ALERT_EMAIL_RECIPIENT")
        smtp_server = os.getenv("SMTP_SERVER")
        smtp_port = int(os.getenv("SMTP_PORT", "587"))
        smtp_username = os.getenv("SMTP_USERNAME")
        smtp_password = os.getenv("SMTP_PASSWORD")

        msg = MIMEText(message)
        msg["Subject"] = "System Health Alert"
        msg["From"] = sender
        msg["To"] = recipient

        with smtplib.SMTP(smtp_server, smtp_port) as server:
            server.starttls()
            server.login(smtp_username, smtp_password)
            server.send_message(msg)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to send email: {str(e)}")

def send_sms_alert(message: str):
    """Send SMS alert using Twilio."""
    try:
        account_sid = os.getenv("TWILIO_ACCOUNT_SID")
        auth_token = os.getenv("TWILIO_AUTH_TOKEN")
        from_number = os.getenv("TWILIO_FROM_NUMBER")
        to_number = os.getenv("TWILIO_TO_NUMBER")

        client = Client(account_sid, auth_token)
        client.messages.create(
            body=message,
            from_=from_number,
            to=to_number
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to send SMS: {str(e)}")

@router.get("/config")
async def get_alert_config():
    """Get current alert configuration."""
    return alert_config

@router.post("/config")
async def update_alert_config(config: AlertConfig):
    """Update alert configuration."""
    global alert_config
    alert_config = config
    return {"message": "Alert configuration updated successfully"}

@router.post("/test/{alert_type}")
async def test_alert(alert_type: str):
    """Send a test alert of the specified type."""
    message = f"Test alert sent at {datetime.utcnow().isoformat()}"
    
    if alert_type == "email":
        send_email_alert(message)
    elif alert_type == "sms":
        send_sms_alert(message)
    else:
        raise HTTPException(status_code=400, detail="Invalid alert type")
    
    return {"message": f"Test {alert_type} alert sent successfully"} 