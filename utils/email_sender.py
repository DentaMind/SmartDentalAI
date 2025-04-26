"""
Email sender utility using SendGrid for sending reports and notifications.
"""

import os
from typing import List, Optional, Dict, Any
from pathlib import Path
import sendgrid
from sendgrid.helpers.mail import (
    Mail, Attachment, FileContent, FileName,
    FileType, Disposition, ContentId
)
import base64
import json
from datetime import datetime

class EmailSender:
    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize SendGrid email sender
        
        Args:
            api_key: SendGrid API key (defaults to SENDGRID_API_KEY env var)
        """
        self.api_key = api_key or os.getenv("SENDGRID_API_KEY")
        if not self.api_key:
            raise ValueError(
                "SendGrid API key not found. Set SENDGRID_API_KEY environment variable."
            )
        self.sg = sendgrid.SendGridAPIClient(api_key=self.api_key)
        
    def _create_attachment(
        self,
        file_path: Path,
        filename: Optional[str] = None
    ) -> Attachment:
        """Create a SendGrid attachment from a file"""
        if not file_path.exists():
            raise FileNotFoundError(f"File not found: {file_path}")
            
        with open(file_path, "rb") as f:
            data = base64.b64encode(f.read()).decode()
            
        attachment = Attachment()
        attachment.file_content = FileContent(data)
        attachment.file_name = FileName(filename or file_path.name)
        attachment.file_type = FileType(
            "application/pdf" if file_path.suffix == ".pdf"
            else "text/csv" if file_path.suffix == ".csv"
            else "application/octet-stream"
        )
        attachment.disposition = Disposition("attachment")
        attachment.content_id = ContentId(str(file_path))
        
        return attachment
        
    def send_report(
        self,
        to_email: str,
        report_id: str,
        report_data: Dict[str, Any],
        pdf_path: Optional[Path] = None,
        csv_path: Optional[Path] = None,
        cc: Optional[List[str]] = None,
        bcc: Optional[List[str]] = None
    ) -> bool:
        """
        Send a dental report via email
        
        Args:
            to_email: Recipient email address
            report_id: Report identifier
            report_data: Report data dictionary
            pdf_path: Optional path to PDF attachment
            csv_path: Optional path to CSV attachment
            cc: Optional list of CC recipients
            bcc: Optional list of BCC recipients
            
        Returns:
            True if email sent successfully
        """
        try:
            # Format email content
            patient_name = report_data.get("patient_name", "Patient")
            report_date = report_data.get(
                "report_date",
                datetime.now().strftime("%Y-%m-%d")
            )
            
            # Create email
            message = Mail(
                from_email=os.getenv("SENDGRID_FROM_EMAIL", "noreply@smartdental.ai"),
                to_emails=to_email,
                subject=f"Dental Assessment Report - {patient_name} - {report_date}",
                html_content=self._generate_email_body(report_data)
            )
            
            # Add CC/BCC recipients
            if cc:
                message.cc = cc
            if bcc:
                message.bcc = bcc
            
            # Add attachments
            if pdf_path:
                message.attachment = self._create_attachment(pdf_path)
                
            if csv_path:
                message.attachment = self._create_attachment(csv_path)
            
            # Send email
            response = self.sg.send(message)
            return response.status_code == 202
            
        except Exception as e:
            print(f"Error sending email: {str(e)}")
            return False
            
    def _generate_email_body(self, report_data: Dict[str, Any]) -> str:
        """Generate HTML email body from report data"""
        patient_name = report_data.get("patient_name", "Patient")
        report_date = report_data.get(
            "report_date",
            datetime.now().strftime("%Y-%m-%d")
        )
        
        # Get insurance summary
        insurance = report_data.get("insurance_summary", {})
        costs = insurance.get("costs", {})
        
        # Format HTML email
        return f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #2d3748;">Dental Assessment Report</h1>
            <p>Report generated on {report_date} for {patient_name}</p>
            
            <div style="margin: 20px 0; padding: 15px; background: #f7fafc; border-radius: 8px;">
                <h2 style="color: #4a5568; margin-top: 0;">Cost Summary</h2>
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 8px 0;">Total Treatment Cost:</td>
                        <td style="text-align: right; font-weight: bold;">
                            ${costs.get("total", 0):.2f}
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0;">Insurance Coverage:</td>
                        <td style="text-align: right; color: #48bb78;">
                            ${costs.get("insurance_pays", 0):.2f}
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0;">Patient Responsibility:</td>
                        <td style="text-align: right; color: #ed8936;">
                            ${costs.get("patient_pays", 0):.2f}
                        </td>
                    </tr>
                </table>
            </div>
            
            <div style="margin: 20px 0;">
                <p>Please find your detailed assessment report attached.</p>
                <p>
                    If you have any questions about your treatment plan or insurance coverage,
                    please don't hesitate to contact our office.
                </p>
            </div>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 0.875rem; color: #718096;">
                <p>
                    This is an automated message from SmartDental AI.
                    Please do not reply to this email.
                </p>
            </div>
        </div>
        """
        
    def send_notification(
        self,
        to_email: str,
        subject: str,
        message: str,
        data: Optional[Dict[str, Any]] = None
    ) -> bool:
        """
        Send a notification email
        
        Args:
            to_email: Recipient email address
            subject: Email subject
            message: Notification message
            data: Optional data to include in JSON attachment
            
        Returns:
            True if email sent successfully
        """
        try:
            # Create email
            email = Mail(
                from_email=os.getenv("SENDGRID_FROM_EMAIL", "noreply@smartdental.ai"),
                to_emails=to_email,
                subject=subject,
                html_content=f"""
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="margin: 20px 0;">
                        {message}
                    </div>
                </div>
                """
            )
            
            # Add data attachment if provided
            if data:
                attachment = Attachment()
                attachment.file_content = FileContent(
                    base64.b64encode(
                        json.dumps(data, indent=2).encode()
                    ).decode()
                )
                attachment.file_name = FileName("data.json")
                attachment.file_type = FileType("application/json")
                attachment.disposition = Disposition("attachment")
                email.attachment = attachment
            
            # Send email
            response = self.sg.send(email)
            return response.status_code == 202
            
        except Exception as e:
            print(f"Error sending notification: {str(e)}")
            return False 