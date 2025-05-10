from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import base64
from PIL import Image
import tempfile
import os
import logging
from io import BytesIO
import uuid

from models.xray_analysis import XRayAnalysis
from models.gpt_interpreter import GPTInterpreter
from models.report_generator import ReportGenerator
from models.staging import ClinicalStaging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="DentaMind API")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ImageUploadRequest(BaseModel):
    image_base64: str
    patient_id: Optional[str] = None
    image_type: Optional[str] = None  # e.g., "periapical", "bitewing", "panoramic"
    tooth_numbers: Optional[List[str]] = None

class BatchUploadRequest(BaseModel):
    images: List[ImageUploadRequest]
    patient_id: Optional[str] = None

class ReportRequest(BaseModel):
    analysis_id: str
    report_type: str = "clinical"  # "clinical" or "patient"
    format: str = "pdf"  # "pdf" or "html"

# Initialize services
analyzer = XRayAnalysis(use_mock=True)
interpreter = GPTInterpreter(use_mock=True)
report_generator = ReportGenerator()
clinical_staging = ClinicalStaging()

# Store analysis results temporarily
analysis_store = {}

@app.get("/")
async def home():
    """API health check endpoint"""
    return {
        "status": "healthy",
        "version": "1.0.0",
        "mode": {
            "analysis": "mock" if analyzer.use_mock else "live",
            "interpretation": "mock" if interpreter.use_mock else "live"
        }
    }

@app.post("/image/upload")
async def upload_image(request: ImageUploadRequest) -> Dict[str, Any]:
    """Process a single X-ray image with clinical interpretation"""
    image_path = None
    try:
        # Process image
        image_bytes = base64.b64decode(request.image_base64)
        image = Image.open(BytesIO(image_bytes))
        
        # Save temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix='.png') as temp_file:
            image_path = temp_file.name
            image.save(image_path, format='PNG')
            logger.info(f"Saved temporary file: {image_path}")
            
            # Analyze image
            result, confidence = analyzer.analyze_xray(image_path)
            
            # Add request metadata
            result["metadata"].update({
                "patient_id": request.patient_id,
                "image_type": request.image_type,
                "tooth_numbers": request.tooth_numbers
            })
            
            # Generate clinical staging
            clinical_assessment = clinical_staging.generate_overall_assessment(result["diagnosis"])
            result["diagnosis"]["overall_assessment"] = clinical_assessment
            
            # Generate clinical interpretation
            interpretation = interpreter.interpret_diagnosis(result["diagnosis"])
            
            # Generate unique ID for this analysis
            analysis_id = str(uuid.uuid4())
            
            # Store results for report generation
            analysis_store[analysis_id] = {
                "diagnosis": result,
                "confidence": confidence,
                "interpretation": interpretation,
                "clinical_assessment": clinical_assessment
            }
            
            return {
                "status": "success",
                "analysis_id": analysis_id,
                "diagnosis": result,
                "confidence": confidence,
                "interpretation": interpretation,
                "clinical_assessment": clinical_assessment
            }
            
    except Exception as e:
        logger.error(f"Error processing image: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
        
    finally:
        if image_path and os.path.exists(image_path):
            os.unlink(image_path)
            logger.info("Cleaned up temporary file")

@app.post("/batch/upload")
async def batch_upload(request: BatchUploadRequest) -> Dict[str, Any]:
    """Process multiple X-ray images in a batch with clinical interpretations"""
    results = []
    interpretations = []
    analysis_ids = []
    clinical_assessments = []
    
    try:
        for image_request in request.images:
            # Add patient ID from batch request if not specified per image
            if not image_request.patient_id:
                image_request.patient_id = request.patient_id
                
            # Process each image
            result = await upload_image(image_request)
            results.append(result)
            analysis_ids.append(result["analysis_id"])
            
            # Collect interpretations and assessments
            if "interpretation" in result:
                interpretations.append(result["interpretation"])
            if "clinical_assessment" in result:
                clinical_assessments.append(result["clinical_assessment"])
        
        # Generate batch summary
        batch_summary = _generate_batch_summary(interpretations, clinical_assessments)
            
        return {
            "status": "success",
            "count": len(results),
            "analysis_ids": analysis_ids,
            "results": results,
            "batch_summary": batch_summary
        }
        
    except Exception as e:
        logger.error(f"Batch processing error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

def _generate_batch_summary(
    interpretations: List[Dict[str, Any]], 
    clinical_assessments: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """Generate summary for batch of interpretations"""
    all_findings = []
    urgent_findings = []
    all_recommendations = set()
    
    # Track highest risk levels
    max_perio_stage = "Stage I"
    max_caries_risk = "Low"
    max_urgency = "Routine follow-up"
    
    for interp, assessment in zip(interpretations, clinical_assessments):
        # Collect all findings
        findings = interp.get("interpretations", [])
        all_findings.extend(findings)
        
        # Collect urgent findings
        urgent_findings.extend([
            f for f in findings 
            if f.get("urgency") == "high"
        ])
        
        # Collect unique recommendations
        recs = interp.get("recommendations", {})
        if recs:
            all_recommendations.update(recs.get("treatment", []))
            all_recommendations.update(recs.get("followup", []))
            
        # Update maximum risk levels
        perio_status = assessment.get("periodontal_status", "Stage I")
        caries_risk = assessment.get("caries_risk", "Low")
        urgency = assessment.get("urgency_level", "Routine follow-up")
        
        # Simple string comparison works here due to consistent formatting
        if perio_status > max_perio_stage:
            max_perio_stage = perio_status
        if caries_risk > max_caries_risk:
            max_caries_risk = caries_risk
        if urgency > max_urgency:
            max_urgency = urgency
    
    return {
        "total_findings": len(all_findings),
        "urgent_findings": len(urgent_findings),
        "urgent_details": urgent_findings if urgent_findings else None,
        "consolidated_recommendations": sorted(list(all_recommendations)),
        "requires_immediate_attention": bool(urgent_findings),
        "highest_periodontal_stage": max_perio_stage,
        "highest_caries_risk": max_caries_risk,
        "highest_urgency": max_urgency
    }

@app.post("/report/generate")
async def generate_report(request: ReportRequest) -> Dict[str, Any]:
    """Generate a report from analysis results"""
    try:
        # Get analysis data
        if request.analysis_id not in analysis_store:
            raise HTTPException(status_code=404, detail="Analysis not found")
            
        data = analysis_store[request.analysis_id]
        
        # Create reports directory if it doesn't exist
        os.makedirs("reports", exist_ok=True)
        
        if request.format == "pdf":
            # Generate PDF
            output_path = f"reports/{request.analysis_id}_{request.report_type}.pdf"
            report_path = report_generator.generate_pdf(
                data=data,
                output_path=output_path,
                report_type=request.report_type
            )
            
            return FileResponse(
                report_path,
                media_type="application/pdf",
                filename=f"dental_report_{request.report_type}.pdf"
            )
            
        else:  # HTML
            # Select template based on report type
            template_name = (
                "clinical_report.html" if request.report_type == "clinical"
                else "patient_report.html"
            )
            
            # Generate HTML
            output_path = f"reports/{request.analysis_id}_{request.report_type}.html"
            report_path = report_generator.generate_html(
                data=data,
                template_name=template_name,
                output_path=output_path
            )
            
            return FileResponse(
                report_path,
                media_type="text/html",
                filename=f"dental_report_{request.report_type}.html"
            )
            
    except Exception as e:
        logger.error(f"Report generation error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/reset")
async def reset():
    """Reset the analysis state"""
    analysis_store.clear()
    return {"status": "success", "message": "System reset complete"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8001, reload=True)
