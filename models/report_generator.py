import os
from typing import Dict, Any, List, Optional
import logging
from datetime import datetime
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from jinja2 import Environment, FileSystemLoader
import json

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ReportGenerator:
    def __init__(self, templates_dir: str = "templates"):
        """
        Initialize report generator
        
        Args:
            templates_dir: Directory containing HTML templates
        """
        self.templates_dir = templates_dir
        self._setup_jinja()
        self._setup_pdf_styles()
        
    def _setup_jinja(self):
        """Setup Jinja2 environment for HTML templates"""
        self.jinja_env = Environment(
            loader=FileSystemLoader(self.templates_dir),
            autoescape=True
        )
        
    def _setup_pdf_styles(self):
        """Setup PDF styles"""
        self.styles = getSampleStyleSheet()
        self.styles.add(ParagraphStyle(
            name='CustomTitle',
            parent=self.styles['Heading1'],
            fontSize=24,
            spaceAfter=30
        ))
        self.styles.add(ParagraphStyle(
            name='SectionHeader',
            parent=self.styles['Heading2'],
            fontSize=14,
            spaceAfter=12
        ))
        
    def generate_pdf(self, 
                    data: Dict[str, Any],
                    output_path: str,
                    report_type: str = "clinical") -> str:
        """
        Generate PDF report
        
        Args:
            data: Analysis results and interpretations
            output_path: Where to save the PDF
            report_type: "clinical" or "patient"
            
        Returns:
            Path to generated PDF
        """
        try:
            doc = SimpleDocTemplate(
                output_path,
                pagesize=letter,
                rightMargin=72,
                leftMargin=72,
                topMargin=72,
                bottomMargin=72
            )
            
            # Build content
            story = []
            
            # Title
            title = "Dental X-Ray Analysis Report"
            story.append(Paragraph(title, self.styles['CustomTitle']))
            
            # Metadata
            story.append(Paragraph("Report Details", self.styles['SectionHeader']))
            metadata = [
                ["Date", datetime.now().strftime("%Y-%m-%d %H:%M")],
                ["Patient ID", data.get("metadata", {}).get("patient_id", "N/A")],
                ["Image Type", data.get("metadata", {}).get("image_type", "N/A")]
            ]
            
            t = Table(metadata)
            t.setStyle(TableStyle([
                ('GRID', (0, 0), (-1, -1), 1, colors.black),
                ('PADDING', (0, 0), (-1, -1), 6)
            ]))
            story.append(t)
            story.append(Spacer(1, 20))
            
            # Clinical Interpretation
            story.append(Paragraph("Clinical Interpretation", self.styles['SectionHeader']))
            interpretation = data.get("interpretation", {})
            
            # Summary
            if "summary" in interpretation:
                story.append(Paragraph("Summary:", self.styles['Heading3']))
                story.append(Paragraph(interpretation["summary"], self.styles['Normal']))
                story.append(Spacer(1, 12))
            
            # Detailed Findings
            if "interpretations" in interpretation:
                story.append(Paragraph("Detailed Findings:", self.styles['Heading3']))
                for finding in interpretation["interpretations"]:
                    finding_text = f"""
                    Condition: {finding['condition']}
                    Location: {finding['location']}
                    Details: {finding['interpretation']}
                    Urgency: {finding['urgency'].upper()}
                    """
                    story.append(Paragraph(finding_text, self.styles['Normal']))
                    story.append(Spacer(1, 12))
            
            # Recommendations
            if "recommendations" in interpretation:
                story.append(Paragraph("Recommendations:", self.styles['Heading3']))
                recs = interpretation["recommendations"]
                
                if report_type == "clinical":
                    # Include all recommendations for clinical report
                    all_recs = []
                    if "treatment" in recs:
                        all_recs.extend([f"Treatment: {r}" for r in recs["treatment"]])
                    if "followup" in recs:
                        all_recs.extend([f"Follow-up: {r}" for r in recs["followup"]])
                    
                    for rec in all_recs:
                        story.append(Paragraph(f"• {rec}", self.styles['Normal']))
                else:
                    # Simplified recommendations for patient report
                    if "treatment" in recs:
                        for rec in recs["treatment"]:
                            story.append(Paragraph(f"• {rec}", self.styles['Normal']))
                
            # Build PDF
            doc.build(story)
            logger.info(f"Generated PDF report: {output_path}")
            return output_path
            
        except Exception as e:
            logger.error(f"Failed to generate PDF report: {str(e)}")
            raise
            
    def generate_html(self,
                     data: Dict[str, Any],
                     template_name: str,
                     output_path: Optional[str] = None) -> str:
        """
        Generate HTML report
        
        Args:
            data: Analysis results and interpretations
            template_name: Name of HTML template to use
            output_path: Optional path to save HTML file
            
        Returns:
            HTML string or path to HTML file if output_path provided
        """
        try:
            template = self.jinja_env.get_template(template_name)
            
            # Add metadata
            context = {
                "report_date": datetime.now().strftime("%Y-%m-%d %H:%M"),
                "data": data
            }
            
            html = template.render(**context)
            
            if output_path:
                with open(output_path, 'w') as f:
                    f.write(html)
                logger.info(f"Generated HTML report: {output_path}")
                return output_path
            
            return html
            
        except Exception as e:
            logger.error(f"Failed to generate HTML report: {str(e)}")
            raise 