"""
PDF Service

This module provides services for generating PDF documents like treatment plans,
consent forms, and reports.
"""

import os
import tempfile
import asyncio
from typing import Optional, List, Dict, Any
import logging
from datetime import datetime
import uuid

from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image

from ..models.treatment_plan import TreatmentPlan

logger = logging.getLogger(__name__)

class PDFService:
    """Service for generating PDF documents"""
    
    async def generate_treatment_plan_pdf(self, plan: TreatmentPlan) -> str:
        """
        Generate a PDF document for a treatment plan
        
        Args:
            plan: The treatment plan
            
        Returns:
            Path to the generated PDF file
        """
        # Create a unique temporary file
        temp_dir = tempfile.gettempdir()
        pdf_path = os.path.join(temp_dir, f"treatment_plan_{uuid.uuid4()}.pdf")
        
        # Run the PDF generation in a thread to avoid blocking
        await asyncio.to_thread(self._create_treatment_plan_pdf, plan, pdf_path)
        
        return pdf_path
    
    def _create_treatment_plan_pdf(self, plan: TreatmentPlan, pdf_path: str) -> None:
        """
        Create a treatment plan PDF document
        
        Args:
            plan: The treatment plan
            pdf_path: Path to save the PDF
        """
        try:
            # Set up the document
            doc = SimpleDocTemplate(
                pdf_path,
                pagesize=letter,
                rightMargin=72,
                leftMargin=72,
                topMargin=72,
                bottomMargin=72
            )
            
            # Get styles
            styles = getSampleStyleSheet()
            title_style = styles["Title"]
            heading_style = styles["Heading1"]
            subheading_style = styles["Heading2"]
            normal_style = styles["Normal"]
            
            # Create custom styles
            label_style = ParagraphStyle(
                "Label",
                parent=normal_style,
                fontName="Helvetica-Bold",
                fontSize=10,
                textColor=colors.darkblue
            )
            
            # Story is a list of flowables that make up the document
            story = []
            
            # Title
            story.append(Paragraph("Treatment Plan", title_style))
            story.append(Spacer(1, 0.25 * inch))
            
            # Patient information
            story.append(Paragraph("Patient Information", heading_style))
            story.append(Spacer(1, 0.1 * inch))
            
            patient_info = [
                ["Patient ID:", plan.patient_id],
                ["Date Created:", plan.created_at.strftime("%Y-%m-%d")],
                ["Status:", plan.status.upper()],
                ["Priority:", plan.priority.upper()]
            ]
            
            if plan.approved_by:
                patient_info.append(["Approved By:", plan.approved_by])
                patient_info.append(["Approved On:", plan.approved_at.strftime("%Y-%m-%d") if plan.approved_at else ""])
            
            # Create patient info table
            patient_table = Table(patient_info, colWidths=[1.5 * inch, 4 * inch])
            patient_table.setStyle(TableStyle([
                ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
                ("TEXTCOLOR", (0, 0), (0, -1), colors.darkblue),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.white)
            ]))
            
            story.append(patient_table)
            story.append(Spacer(1, 0.25 * inch))
            
            # Treatment plan details
            if plan.title:
                story.append(Paragraph(f"Plan: {plan.title}", subheading_style))
                story.append(Spacer(1, 0.1 * inch))
            
            if plan.description:
                story.append(Paragraph("Description:", label_style))
                story.append(Paragraph(plan.description, normal_style))
                story.append(Spacer(1, 0.1 * inch))
                
            if plan.notes:
                story.append(Paragraph("Notes:", label_style))
                story.append(Paragraph(plan.notes, normal_style))
                story.append(Spacer(1, 0.1 * inch))
            
            # Medical alerts
            if plan.medical_alerts and len(plan.medical_alerts) > 0:
                story.append(Paragraph("Medical Alerts:", label_style))
                for alert in plan.medical_alerts:
                    story.append(Paragraph(f"• {alert}", normal_style))
                story.append(Spacer(1, 0.1 * inch))
            
            # Procedures
            story.append(Paragraph("Procedures", heading_style))
            story.append(Spacer(1, 0.1 * inch))
            
            if not plan.procedures or len(plan.procedures) == 0:
                story.append(Paragraph("No procedures have been added to this treatment plan.", normal_style))
            else:
                # Group procedures by phase
                phases = {}
                for proc in plan.procedures:
                    phase = proc.phase
                    if phase not in phases:
                        phases[phase] = []
                    phases[phase].append(proc)
                
                # Sort phases in order: urgent, phase_1, phase_2, maintenance
                phase_order = ["urgent", "phase_1", "phase_2", "maintenance"]
                
                for phase in phase_order:
                    if phase in phases and phases[phase]:
                        # Format phase name for display
                        phase_display = phase.replace("_", " ").title()
                        if phase == "urgent":
                            phase_display = "Urgent (Immediate Treatment)"
                        
                        story.append(Paragraph(phase_display, subheading_style))
                        story.append(Spacer(1, 0.1 * inch))
                        
                        # Create procedures table header
                        procedure_data = [["Tooth", "Procedure", "CDT Code", "Status", "Fee"]]
                        
                        # Add procedures to table
                        for proc in phases[phase]:
                            tooth = proc.tooth_number or ""
                            name = proc.procedure_name
                            cdt = proc.cdt_code or ""
                            status = proc.status.replace("_", " ").title()
                            fee = f"${proc.fee:,.2f}" if proc.fee else "$0.00"
                            
                            procedure_data.append([tooth, name, cdt, status, fee])
                        
                        # Create procedures table
                        proc_table = Table(procedure_data, colWidths=[0.75 * inch, 2.5 * inch, 0.75 * inch, 1 * inch, 0.75 * inch])
                        proc_table.setStyle(TableStyle([
                            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                            ("BACKGROUND", (0, 0), (-1, 0), colors.lightgrey),
                            ("TEXTCOLOR", (0, 0), (-1, 0), colors.darkblue),
                            ("ALIGN", (0, 0), (-1, 0), "CENTER"),
                            ("ALIGN", (0, 1), (0, -1), "CENTER"),  # Tooth number centered
                            ("ALIGN", (-1, 1), (-1, -1), "RIGHT"),  # Fee right-aligned
                            ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
                            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                            ("FONTNAME", (0, 1), (-1, -1), "Helvetica")
                        ]))
                        
                        story.append(proc_table)
                        story.append(Spacer(1, 0.2 * inch))
                
                # Financial summary
                story.append(Paragraph("Financial Summary", heading_style))
                story.append(Spacer(1, 0.1 * inch))
                
                financial_data = [
                    ["Total Treatment Fee:", f"${plan.total_fee:,.2f}"],
                    ["Insurance Coverage:", f"${plan.insurance_portion:,.2f}"],
                    ["Patient Responsibility:", f"${plan.patient_portion:,.2f}"]
                ]
                
                financial_table = Table(financial_data, colWidths=[2 * inch, 1.5 * inch])
                financial_table.setStyle(TableStyle([
                    ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
                    ("ALIGN", (1, 0), (1, -1), "RIGHT"),
                    ("GRID", (0, 0), (-1, -1), 0.5, colors.white),
                    ("LINEBELOW", (0, -1), (1, -1), 1, colors.black)
                ]))
                
                story.append(financial_table)
                story.append(Spacer(1, 0.25 * inch))
            
            # Consent section
            story.append(Paragraph("Consent", heading_style))
            story.append(Spacer(1, 0.1 * inch))
            
            if plan.consent_signed:
                consent_text = f"Consent signed by {plan.consent_signed_by} on {plan.consent_signed_at.strftime('%Y-%m-%d')}."
                story.append(Paragraph(consent_text, normal_style))
            else:
                consent_text = """
                I understand the recommended treatment and associated fees. I have been given the opportunity 
                to ask questions about the nature and purpose of the treatment and have received answers to 
                my satisfaction. I understand there are risks associated with any dental treatment.
                
                I authorize the dentist to perform the treatment as presented in this plan.
                """
                story.append(Paragraph(consent_text, normal_style))
                story.append(Spacer(1, 0.25 * inch))
                
                # Signature line
                signature_data = [
                    ["Patient/Guardian Signature", "Date"],
                    ["", ""]
                ]
                
                signature_table = Table(signature_data, colWidths=[4 * inch, 1.5 * inch])
                signature_table.setStyle(TableStyle([
                    ("FONTNAME", (0, 0), (1, 0), "Helvetica-Bold"),
                    ("LINEBELOW", (0, 1), (0, 1), 1, colors.black),
                    ("LINEBELOW", (1, 1), (1, 1), 1, colors.black),
                    ("TOPPADDING", (0, 1), (1, 1), 20)
                ]))
                
                story.append(signature_table)
            
            # Build the document
            doc.build(story)
            
        except Exception as e:
            logger.error(f"Error generating treatment plan PDF: {str(e)}")
            raise
    
    async def cleanup_pdf(self, pdf_path: str) -> None:
        """
        Clean up a PDF file after it has been sent
        
        Args:
            pdf_path: Path to the PDF file
        """
        try:
            # Delete the temporary file
            if os.path.exists(pdf_path):
                os.remove(pdf_path)
        except Exception as e:
            logger.error(f"Error cleaning up PDF: {str(e)}")
    
    async def generate_consent_form_pdf(self, plan_id: str, patient_name: str, procedures: List[Dict[str, Any]]) -> str:
        """
        Generate a consent form PDF for a treatment plan
        
        Args:
            plan_id: Treatment plan ID
            patient_name: Patient name
            procedures: List of procedures
            
        Returns:
            Path to the generated PDF file
        """
        # Create a unique temporary file
        temp_dir = tempfile.gettempdir()
        pdf_path = os.path.join(temp_dir, f"consent_form_{uuid.uuid4()}.pdf")
        
        # Run the PDF generation in a thread to avoid blocking
        await asyncio.to_thread(
            self._create_consent_form_pdf, 
            plan_id,
            patient_name, 
            procedures, 
            pdf_path
        )
        
        return pdf_path
    
    def _create_consent_form_pdf(
        self, 
        plan_id: str, 
        patient_name: str, 
        procedures: List[Dict[str, Any]],
        pdf_path: str
    ) -> None:
        """
        Create a consent form PDF document
        
        Args:
            plan_id: Treatment plan ID
            patient_name: Patient name
            procedures: List of procedures
            pdf_path: Path to save the PDF
        """
        try:
            # Set up the document
            doc = SimpleDocTemplate(
                pdf_path,
                pagesize=letter,
                rightMargin=72,
                leftMargin=72,
                topMargin=72,
                bottomMargin=72
            )
            
            # Get styles
            styles = getSampleStyleSheet()
            title_style = styles["Title"]
            heading_style = styles["Heading1"]
            subheading_style = styles["Heading2"]
            normal_style = styles["Normal"]
            
            # Story is a list of flowables that make up the document
            story = []
            
            # Title
            story.append(Paragraph("Treatment Consent Form", title_style))
            story.append(Spacer(1, 0.25 * inch))
            
            # Patient information
            date_str = datetime.now().strftime("%Y-%m-%d")
            story.append(Paragraph(f"Patient: {patient_name}", subheading_style))
            story.append(Paragraph(f"Date: {date_str}", subheading_style))
            story.append(Paragraph(f"Plan ID: {plan_id}", subheading_style))
            story.append(Spacer(1, 0.25 * inch))
            
            # Introduction
            intro_text = """
            This form provides information about your dental treatment plan. Please read it carefully and ask any questions
            before signing. Your signature indicates your understanding and consent to the proposed treatment.
            """
            story.append(Paragraph(intro_text, normal_style))
            story.append(Spacer(1, 0.25 * inch))
            
            # Procedures
            story.append(Paragraph("Proposed Procedures", heading_style))
            story.append(Spacer(1, 0.1 * inch))
            
            if not procedures or len(procedures) == 0:
                story.append(Paragraph("No procedures have been proposed at this time.", normal_style))
            else:
                # Create procedures table header
                procedure_data = [["Tooth", "Procedure", "CDT Code"]]
                
                # Add procedures to table
                for proc in procedures:
                    tooth = proc.get("tooth_number", "")
                    name = proc.get("procedure_name", "")
                    cdt = proc.get("cdt_code", "")
                    
                    procedure_data.append([tooth, name, cdt])
                
                # Create procedures table
                proc_table = Table(procedure_data, colWidths=[1 * inch, 4 * inch, 1 * inch])
                proc_table.setStyle(TableStyle([
                    ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                    ("BACKGROUND", (0, 0), (-1, 0), colors.lightgrey),
                    ("ALIGN", (0, 0), (-1, 0), "CENTER"),
                    ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
                    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                    ("FONTNAME", (0, 1), (-1, -1), "Helvetica")
                ]))
                
                story.append(proc_table)
                story.append(Spacer(1, 0.25 * inch))
            
            # Consent statements
            story.append(Paragraph("Consent Statements", heading_style))
            story.append(Spacer(1, 0.1 * inch))
            
            consent_statements = [
                "I understand the recommended treatment and associated risks.",
                "I have been informed of alternative treatment options and their risks.",
                "I understand that success of treatment cannot be guaranteed and depends on my cooperation.",
                "I have been informed of potential complications and side effects.",
                "I have had the opportunity to ask questions about my treatment plan and have received answers to my satisfaction.",
                "I understand that I can withdraw this consent at any time by contacting the dental office.",
                "I consent to the use of local anesthesia if needed for my procedures."
            ]
            
            for statement in consent_statements:
                story.append(Paragraph(f"• {statement}", normal_style))
            
            story.append(Spacer(1, 0.25 * inch))
            
            # Signature lines
            story.append(Paragraph("Signatures", heading_style))
            story.append(Spacer(1, 0.2 * inch))
            
            signature_data = [
                ["Patient/Guardian Signature", "Date"],
                ["", ""],
                ["Provider Signature", "Date"],
                ["", ""]
            ]
            
            signature_table = Table(signature_data, colWidths=[4 * inch, 1.5 * inch])
            signature_table.setStyle(TableStyle([
                ("FONTNAME", (0, 0), (1, 0), "Helvetica-Bold"),
                ("FONTNAME", (0, 2), (1, 2), "Helvetica-Bold"),
                ("LINEBELOW", (0, 1), (0, 1), 1, colors.black),
                ("LINEBELOW", (1, 1), (1, 1), 1, colors.black),
                ("LINEBELOW", (0, 3), (0, 3), 1, colors.black),
                ("LINEBELOW", (1, 3), (1, 3), 1, colors.black),
                ("TOPPADDING", (0, 1), (1, 1), 20),
                ("TOPPADDING", (0, 3), (1, 3), 20)
            ]))
            
            story.append(signature_table)
            
            # Build the document
            doc.build(story)
            
        except Exception as e:
            logger.error(f"Error generating consent form PDF: {str(e)}")
            raise 