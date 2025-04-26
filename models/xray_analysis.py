import json
import requests
import os
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from io import BytesIO
from PIL import Image
import base64
import tempfile
import logging
from typing import Tuple, Dict, Any, List
import time

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

class XRayAnalysis:
    def __init__(self, patient_chart_data=None, use_mock=True):
        """
        Initialize XRayAnalysis with optional mock mode
        
        Args:
            patient_chart_data: Optional patient chart data
            use_mock: If True, use mock responses instead of real API
        """
        self.use_mock = use_mock
        self.patient_chart_data = patient_chart_data or {}
        
        if not self.use_mock:
            # Load Roboflow configuration
            self.roboflow_api_key = os.getenv("ROBOFLOW_API_KEY")
            self.model_id = os.getenv("ROBOFLOW_MODEL_ID", "dental-xray-analysis")
            self.model_version = os.getenv("ROBOFLOW_MODEL_VERSION", "1")
            self.workspace = os.getenv("ROBOFLOW_WORKSPACE", "smartdental")
            
            if not self.roboflow_api_key:
                raise ValueError("ROBOFLOW_API_KEY not found in environment variables")
                
            self.roboflow_url = f"https://detect.roboflow.com/{self.model_id}/{self.model_version}"
            logger.info(f"Initialized XRayAnalysis with model: {self.model_id} v{self.model_version}")
        else:
            logger.info("Initialized XRayAnalysis in mock mode")

    def analyze_xray(self, image_path: str) -> Tuple[Dict[str, Any], float]:
        """Analyze an X-ray image using either mock data or Roboflow API"""
        try:
            start_time = time.time()
            logger.info(f"Starting analysis of image: {image_path}")
            
            if self.use_mock:
                result, confidence = self._get_mock_response()
            else:
                response = self.send_to_roboflow(image_path)
                result, confidence = self.parse_roboflow_response(response)
            
            # Add analysis metadata
            result = self.combine_with_chart_data(result)
            
            duration = time.time() - start_time
            logger.info(f"Analysis completed in {duration:.2f}s with confidence: {confidence}")
            
            return result, confidence

        except Exception as e:
            logger.error(f"Analysis failed: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Analysis error: {str(e)}")

    def _get_mock_response(self) -> Tuple[Dict[str, Any], float]:
        """Generate structured mock response for testing"""
        mock_findings = [
            {
                "type": "caries",
                "location": "Tooth #19 - distal",
                "confidence": 0.91,
                "severity": "moderate",
                "recommendations": ["Restoration recommended", "Monitor adjacent teeth"]
            },
            {
                "type": "bone_loss",
                "location": "Teeth #24-25",
                "confidence": 0.85,
                "severity": "early",
                "measurements": {
                    "bone_level": "3mm below CEJ",
                    "pattern": "horizontal"
                }
            }
        ]
        
        mock_response = {
            "findings": mock_findings,
            "overall_assessment": {
                "periodontal_status": "early periodontitis",
                "caries_risk": "moderate",
                "urgent_concerns": None
            },
            "image_quality": {
                "diagnostic": True,
                "issues": None
            }
        }
        
        return mock_response, 0.91

    def send_to_roboflow(self, image_path: str) -> Dict[str, Any]:
        """Send image to Roboflow API and get predictions"""
        if self.use_mock:
            raise ValueError("Cannot call Roboflow API in mock mode")
            
        try:
            with open(image_path, 'rb') as image_file:
                headers = {"Content-Type": "application/x-www-form-urlencoded"}
                params = {
                    "api_key": self.roboflow_api_key,
                    "confidence": 50,
                    "overlap": 30,
                    "format": "json"
                }
                
                response = requests.post(
                    self.roboflow_url,
                    params=params,
                    headers=headers,
                    files={"file": image_file},
                    timeout=30
                )
                
                response.raise_for_status()
                logger.info("Roboflow API response received")
                return response.json()
                
        except requests.exceptions.Timeout:
            raise HTTPException(status_code=504, detail="Roboflow API timeout")
        except requests.exceptions.RequestException as e:
            raise HTTPException(status_code=502, detail=f"Roboflow API error: {str(e)}")

    def parse_roboflow_response(self, response: Dict[str, Any]) -> Tuple[Dict[str, Any], float]:
        """Parse Roboflow response into standardized diagnosis format"""
        try:
            predictions = response.get("predictions", [])
            
            if not predictions:
                logger.warning("No predictions found in response")
                return {"findings": [], "overall_assessment": {"status": "no findings"}}, 0.0

            findings = []
            max_confidence = 0.0
            
            for pred in predictions:
                finding = {
                    "type": pred.get("class", "unknown"),
                    "location": self._get_location(pred),
                    "confidence": pred.get("confidence", 0.0),
                    "bbox": pred.get("bbox", {}),
                }
                findings.append(finding)
                max_confidence = max(max_confidence, finding["confidence"])

            result = {
                "findings": findings,
                "overall_assessment": self._generate_assessment(findings)
            }
            
            return result, max_confidence
            
        except Exception as e:
            logger.error(f"Failed to parse response: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Response parsing error: {str(e)}")

    def _get_location(self, prediction: Dict[str, Any]) -> str:
        """Extract location information from prediction"""
        try:
            bbox = prediction.get("bbox", {})
            x = bbox.get("x", 0)
            y = bbox.get("y", 0)
            
            # TODO: Implement tooth number mapping based on coordinates
            return f"Location: ({x:.1f}, {y:.1f})"
            
        except Exception:
            return "Location unknown"

    def _generate_assessment(self, findings: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Generate overall assessment from findings"""
        # TODO: Implement logic to generate overall assessment
        return {
            "status": "findings present",
            "count": len(findings)
        }

    def combine_with_chart_data(self, diagnosis: Dict[str, Any]) -> Dict[str, Any]:
        """Combine diagnosis with patient chart data and metadata"""
        return {
            "diagnosis": diagnosis,
            "chart_data": self.patient_chart_data,
            "metadata": {
                "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
                "analysis_mode": "mock" if self.use_mock else "live",
                "version": "1.0.0"
            }
        }

    def update_feedback(self, image_path: str, correct: bool, reason: str = None):
        """Store feedback for model improvement"""
        try:
            feedback = {
                "image_path": image_path,
                "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
                "correct": correct,
                "reason": reason,
                "mode": "mock" if self.use_mock else "live"
            }
            
            with open('feedback.json', 'a') as f:
                json.dump(feedback, f)
                f.write("\n")
                
            logger.info(f"Feedback recorded: {'correct' if correct else 'incorrect'}")
            
        except Exception as e:
            logger.error(f"Failed to save feedback: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Feedback update error: {str(e)}")

app = FastAPI()

class ImageUploadRequest(BaseModel):
    image_base64: str

# Initialize your analysis object (replace with real values)
analyzer = XRayAnalysis(
    patient_chart_data={}
)

@app.post("/image/upload")
async def upload_image(request: ImageUploadRequest):
    try:
        base64_str = request.image_base64
        image_data = base64.b64decode(base64_str)
        image = Image.open(BytesIO(image_data)).convert("RGB")

        # Save image temporarily to disk for Roboflow API
        with tempfile.NamedTemporaryFile(delete=False, suffix='.png') as temp_file:
            image_path = temp_file.name
            image.save(temp_file)

        # Analyze the image using XRayAnalysis
        result, confidence = analyzer.analyze_xray(image_path)

        return {
            "diagnosis": result,
            "confidence": confidence
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Image processing error: {str(e)}")

# Other endpoints and logic...
