from fastapi import APIRouter, Request, HTTPException, Query
from fastapi.responses import FileResponse
from fastapi.templating import Jinja2Templates
from pathlib import Path
from utils.pdf_export import PDFExporter
from insurance.processor import InsuranceProcessor
from typing import Optional

router = APIRouter()
templates = Jinja2Templates(directory="templates")
pdf_exporter = PDFExporter()
insurance_processor = InsuranceProcessor()

@router.get("/report/{report_id}")
async def view_report(request: Request, report_id: str):
    """Render HTML report view"""
    try:
        # Your existing report data fetching logic here
        report_data = {}  # Replace with actual data
        
        # Process insurance information
        insurance_summary = insurance_processor.generate_insurance_summary(
            report_data.get("findings", [])
        )
        
        # Add insurance summary to report data
        report_data["insurance_summary"] = insurance_summary
        
        return templates.TemplateResponse(
            "clinical_report.html",
            {
                "request": request,
                "report_id": report_id,
                "data": report_data
            }
        )
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.get("/report/{report_id}/pdf")
async def download_pdf(
    request: Request,
    report_id: str,
    watermark: Optional[str] = None,
    compress: bool = Query(True, description="Enable PDF compression"),
    image_quality: int = Query(
        85,
        ge=1,
        le=100,
        description="JPEG quality for images (1-100)"
    )
):
    """
    Generate and download PDF report
    
    Args:
        request: FastAPI request
        report_id: Report identifier
        watermark: Optional watermark text
        compress: Enable PDF compression (default: True)
        image_quality: JPEG quality for images, 1-100 (default: 85)
    """
    try:
        # Your existing report data fetching logic here
        report_data = {}  # Replace with actual data
        
        # Process insurance information
        insurance_summary = insurance_processor.generate_insurance_summary(
            report_data.get("findings", [])
        )
        
        # Add insurance summary to report data
        report_data["insurance_summary"] = insurance_summary
        
        # Render HTML template to string
        html_content = templates.get_template("clinical_report.html").render({
            "request": request,
            "report_id": report_id,
            "data": report_data
        })
        
        # Generate PDF with compression options
        pdf_path = pdf_exporter.generate_pdf(
            html_content=html_content,
            metadata={
                "report_id": report_id,
                "patient_id": report_data.get("patient_id", "unknown"),
                "generated_date": report_data.get("report_date", ""),
                "insurance_total": insurance_summary["costs"]["total"],
                "insurance_coverage": insurance_summary["costs"]["insurance_pays"],
                "patient_responsibility": insurance_summary["costs"]["patient_pays"]
            },
            watermark=watermark,
            compress=compress,
            image_quality=image_quality
        )
        
        # Return PDF file
        return FileResponse(
            pdf_path,
            media_type="application/pdf",
            filename=pdf_path.name,
            headers={
                "Content-Disposition": f'attachment; filename="{pdf_path.name}"',
                "X-Compression": "enabled" if compress else "disabled",
                "X-Image-Quality": str(image_quality)
            }
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 