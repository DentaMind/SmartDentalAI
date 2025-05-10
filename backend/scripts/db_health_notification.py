#!/usr/bin/env python3
"""
Database Health Notification Script

This script checks the database health status and sends notifications for issues.
It can be run as a scheduled task to proactively monitor database health.

Usage:
  python db_health_notification.py [--slack-webhook=URL] [--email=user@example.com]
"""

import os
import sys
import json
import argparse
import logging
import smtplib
import traceback
import requests
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime
from typing import Dict, List, Any, Optional
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session

# Add the project root to Python path
script_dir = os.path.dirname(os.path.abspath(__file__))
root_dir = os.path.join(script_dir, "..")
sys.path.append(root_dir)

# Import project modules
from api.services.db_health_service import db_health_service
from api.config import settings
from api.models.base import Base

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("db_health_notification")

def get_db_session() -> Session:
    """Create a database session."""
    engine = create_engine(settings.DATABASE_URL)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    return SessionLocal()

def send_slack_notification(webhook_url: str, health_data: Dict[str, Any]) -> bool:
    """
    Send a Slack notification with database health status.
    
    Args:
        webhook_url: Slack webhook URL
        health_data: Database health data
        
    Returns:
        True if notification was sent successfully
    """
    if not webhook_url:
        logger.warning("No Slack webhook URL provided, skipping notification")
        return False
        
    try:
        # Get status emoji
        status_emoji = "✅" if health_data["status"] == "healthy" else "⚠️" if health_data["status"] == "warning" else "❌"
        
        # Format message
        message = {
            "blocks": [
                {
                    "type": "header",
                    "text": {
                        "type": "plain_text",
                        "text": f"{status_emoji} DentaMind Database Health Alert"
                    }
                },
                {
                    "type": "section",
                    "text": {
                        "type": "mrkdwn",
                        "text": f"*Status:* {health_data['status'].upper()}\n*Environment:* {os.environ.get('ENVIRONMENT', 'development')}\n*Time:* {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
                    }
                }
            ]
        }
        
        # Add issues section if there are any
        if health_data.get("issues") and len(health_data["issues"]) > 0:
            issues_text = "\n".join([f"• {issue}" for issue in health_data["issues"][:10]])
            if len(health_data["issues"]) > 10:
                issues_text += f"\n_...and {len(health_data['issues']) - 10} more issues_"
                
            message["blocks"].append({"type": "divider"})
            message["blocks"].append({
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": f"*Issues Detected:*\n{issues_text}"
                }
            })
        
        # Add details for tables, foreign keys, and indexes
        details = []
        
        if health_data.get("tables", {}).get("missing_tables"):
            missing_tables = ", ".join(health_data["tables"]["missing_tables"][:5])
            if len(health_data["tables"]["missing_tables"]) > 5:
                missing_tables += f" and {len(health_data['tables']['missing_tables']) - 5} more"
            details.append(f"*Missing Tables:* {missing_tables}")
            
        if health_data.get("foreign_keys", {}).get("broken_foreign_keys"):
            broken_count = len(health_data["foreign_keys"]["broken_foreign_keys"])
            details.append(f"*Broken Foreign Keys:* {broken_count}")
            
        if health_data.get("indexes", {}).get("missing_indexes"):
            missing_idx_count = len(health_data["indexes"]["missing_indexes"])
            details.append(f"*Missing Indexes:* {missing_idx_count}")
            
        if details:
            message["blocks"].append({
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": "\n".join(details)
                }
            })
        
        # Add footer with link to admin panel
        message["blocks"].append({"type": "divider"})
        message["blocks"].append({
            "type": "context",
            "elements": [
                {
                    "type": "mrkdwn",
                    "text": "View full details in the <https://dentamind.example.com/admin/dashboard|Admin Dashboard>"
                }
            ]
        })
        
        # Send the notification
        response = requests.post(
            webhook_url,
            json=message,
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 200:
            logger.info("Slack notification sent successfully")
            return True
        else:
            logger.error(f"Failed to send Slack notification: {response.status_code} {response.text}")
            return False
            
    except Exception as e:
        logger.error(f"Error sending Slack notification: {str(e)}")
        return False

def send_email_notification(recipient: str, health_data: Dict[str, Any]) -> bool:
    """
    Send an email notification with database health status.
    
    Args:
        recipient: Email recipient
        health_data: Database health data
        
    Returns:
        True if email was sent successfully
    """
    if not recipient:
        logger.warning("No email recipient provided, skipping notification")
        return False
        
    # Skip if SMTP settings are not configured
    if not (hasattr(settings, "SMTP_SERVER") and hasattr(settings, "SMTP_PORT") and
            hasattr(settings, "SMTP_USERNAME") and hasattr(settings, "SMTP_PASSWORD")):
        logger.warning("SMTP settings not configured, skipping email notification")
        return False
        
    try:
        # Create message
        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"DentaMind Database Health Alert: {health_data['status'].upper()}"
        msg["From"] = settings.SMTP_USERNAME
        msg["To"] = recipient
        
        # Create plain text content
        text_content = f"""
        DentaMind Database Health Alert
        ==============================
        
        Status: {health_data['status'].upper()}
        Environment: {os.environ.get('ENVIRONMENT', 'development')}
        Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
        
        """
        
        if health_data.get("issues") and len(health_data["issues"]) > 0:
            text_content += "\nIssues Detected:\n"
            for issue in health_data["issues"]:
                text_content += f"- {issue}\n"
                
        # Create HTML content
        html_content = f"""
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; margin: 0; padding: 20px; color: #333; }}
                .header {{ background-color: #f0f0f0; padding: 15px; border-bottom: 1px solid #ddd; }}
                .status {{ font-size: 18px; font-weight: bold; }}
                .status.healthy {{ color: green; }}
                .status.warning {{ color: orange; }}
                .status.error, .status.unhealthy {{ color: red; }}
                .issues {{ margin-top: 20px; }}
                .issue {{ margin-bottom: 5px; }}
                .details {{ margin-top: 20px; }}
                .footer {{ margin-top: 30px; font-size: 12px; color: #777; }}
            </style>
        </head>
        <body>
            <div class="header">
                <h1>DentaMind Database Health Alert</h1>
                <div class="status {health_data['status']}">Status: {health_data['status'].upper()}</div>
                <div>Environment: {os.environ.get('ENVIRONMENT', 'development')}</div>
                <div>Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</div>
            </div>
        """
        
        if health_data.get("issues") and len(health_data["issues"]) > 0:
            html_content += """
            <div class="issues">
                <h2>Issues Detected:</h2>
                <ul>
            """
            
            for issue in health_data["issues"]:
                html_content += f'<li class="issue">{issue}</li>\n'
                
            html_content += """
                </ul>
            </div>
            """
            
        # Add details section
        html_content += """
        <div class="details">
            <h2>Details:</h2>
            <table border="0" cellpadding="5">
        """
        
        if health_data.get("tables"):
            missing_tables_count = len(health_data["tables"].get("missing_tables", []))
            unexpected_tables_count = len(health_data["tables"].get("unexpected_tables", []))
            html_content += f"""
            <tr>
                <td><strong>Tables:</strong></td>
                <td>{len(health_data["tables"].get("actual_tables", []))} tables</td>
            </tr>
            <tr>
                <td><strong>Missing Tables:</strong></td>
                <td>{missing_tables_count} tables</td>
            </tr>
            <tr>
                <td><strong>Unexpected Tables:</strong></td>
                <td>{unexpected_tables_count} tables</td>
            </tr>
            """
            
        if health_data.get("foreign_keys"):
            fk_count = health_data["foreign_keys"].get("total_foreign_keys", 0)
            broken_fk_count = len(health_data["foreign_keys"].get("broken_foreign_keys", []))
            html_content += f"""
            <tr>
                <td><strong>Foreign Keys:</strong></td>
                <td>{fk_count} relationships</td>
            </tr>
            <tr>
                <td><strong>Broken Foreign Keys:</strong></td>
                <td>{broken_fk_count} issues</td>
            </tr>
            """
            
        if health_data.get("indexes"):
            missing_idx_count = len(health_data["indexes"].get("missing_indexes", []))
            html_content += f"""
            <tr>
                <td><strong>Missing Indexes:</strong></td>
                <td>{missing_idx_count} indexes</td>
            </tr>
            """
            
        html_content += """
            </table>
        </div>
        
        <div class="footer">
            <p>View full details in the <a href="https://dentamind.example.com/admin/dashboard">Admin Dashboard</a></p>
        </div>
        </body>
        </html>
        """
        
        # Attach parts
        part1 = MIMEText(text_content, "plain")
        part2 = MIMEText(html_content, "html")
        msg.attach(part1)
        msg.attach(part2)
        
        # Send email
        with smtplib.SMTP(settings.SMTP_SERVER, settings.SMTP_PORT) as server:
            server.starttls()
            server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
            server.sendmail(settings.SMTP_USERNAME, recipient, msg.as_string())
            
        logger.info(f"Email notification sent to {recipient}")
        return True
        
    except Exception as e:
        logger.error(f"Error sending email notification: {str(e)}")
        logger.error(traceback.format_exc())
        return False

async def check_and_notify(slack_webhook: Optional[str] = None, email_recipient: Optional[str] = None) -> None:
    """
    Check database health and send notifications if issues are found.
    
    Args:
        slack_webhook: Slack webhook URL (optional)
        email_recipient: Email recipient (optional)
    """
    try:
        logger.info("Starting database health check")
        
        # Get database session
        db = get_db_session()
        
        try:
            # Run health check
            health_data = await db_health_service.get_health_status(db, force_refresh=True)
            
            # Log results
            logger.info(f"Database health status: {health_data['status']}")
            if health_data.get("issues"):
                logger.warning(f"Found {len(health_data['issues'])} issues")
                for issue in health_data["issues"]:
                    logger.warning(f"Issue: {issue}")
            
            # Only send notifications if there are issues
            if health_data["status"] != "healthy":
                # Send Slack notification
                if slack_webhook:
                    send_slack_notification(slack_webhook, health_data)
                    
                # Send email notification
                if email_recipient:
                    send_email_notification(email_recipient, health_data)
                    
            # Output JSON result
            print(json.dumps(health_data, indent=2))
            
        finally:
            db.close()
            
    except Exception as e:
        logger.error(f"Error checking database health: {str(e)}")
        logger.error(traceback.format_exc())
        
        # Send error notification
        error_data = {
            "status": "error",
            "issues": [f"Error checking database health: {str(e)}"],
            "timestamp": datetime.now().isoformat()
        }
        
        if slack_webhook:
            send_slack_notification(slack_webhook, error_data)
            
        if email_recipient:
            send_email_notification(email_recipient, error_data)

def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(description="Check database health and send notifications")
    parser.add_argument("--slack-webhook", help="Slack webhook URL for notifications")
    parser.add_argument("--email", help="Email address for notifications")
    parser.add_argument("--environment", help="Environment name (development, staging, production)")
    args = parser.parse_args()
    
    # Set environment if provided
    if args.environment:
        os.environ["ENVIRONMENT"] = args.environment
    
    # Get webhook URL from args or environment
    webhook_url = args.slack_webhook or os.environ.get("SLACK_WEBHOOK_URL")
    
    # Get email from args or environment
    email_recipient = args.email or os.environ.get("HEALTH_EMAIL_RECIPIENT")
    
    # Run async function
    import asyncio
    asyncio.run(check_and_notify(webhook_url, email_recipient))

if __name__ == "__main__":
    main() 