"""
Dental AI Inference Service

This service provides a unified interface for dental image analysis and treatment
suggestions using various AI models (ONNX, PyTorch, TensorFlow, etc.)
"""

import os
import logging
import json
import time
import numpy as np
from typing import Dict, Any, List, Optional, Tuple, Union, BinaryIO
from datetime import datetime
from pathlib import Path
import uuid
from sqlalchemy.orm import Session
from fastapi import UploadFile

from ..config.config import settings
from ..models.audit import DiagnosticLog, TreatmentLog
from ..services.audit_service import AuditService

# Import optional dependencies (they might not all be available)
try:
    import torch
    import torch.nn as nn
    TORCH_AVAILABLE = True
except ImportError:
    TORCH_AVAILABLE = False

try:
    import tensorflow as tf
    TF_AVAILABLE = True
except ImportError:
    TF_AVAILABLE = False

try:
    import onnxruntime as ort
    ONNX_AVAILABLE = True
except ImportError:
    ONNX_AVAILABLE = False

try:
    import cv2
    from PIL import Image
    import io
    CV2_AVAILABLE = True
except ImportError:
    CV2_AVAILABLE = False

# Configure logging
logger = logging.getLogger(__name__)

class InferenceModelType:
    """Enum of supported model types"""
    ONNX = "onnx"
    PYTORCH = "pytorch"
    TENSORFLOW = "tensorflow"
    ROBOFLOW = "roboflow"
    OPENAI = "openai"
    MOCK = "mock"

class ModelPath:
    """Paths to AI models based on environment settings"""
    BASE_DIR = Path(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
    
    # Dental X-ray analysis models
    XRAY_ONNX = BASE_DIR / "models" / "xray" / "dental_xray_detection.onnx"
    XRAY_PYTORCH = BASE_DIR / "models" / "xray" / "dental_xray_detection.pt"
    XRAY_TENSORFLOW = BASE_DIR / "models" / "xray" / "dental_xray_detection"
    
    # Treatment suggestion models
    TREATMENT_ONNX = BASE_DIR / "models" / "treatment" / "treatment_suggestion.onnx"
    TREATMENT_PYTORCH = BASE_DIR / "models" / "treatment" / "treatment_suggestion.pt"
    TREATMENT_TENSORFLOW = BASE_DIR / "models" / "treatment" / "treatment_suggestion"

class DentalInferenceService:
    """
    Service for performing AI inference on dental images and generating treatment suggestions
    using different model types (ONNX, PyTorch, TensorFlow, OpenAI, etc.)
    """
    
    def __init__(self, db: Session = None):
        """
        Initialize the inference service
        
        Args:
            db: Database session for logging
        """
        self.db = db
        self.model_type = self._determine_model_type()
        self.xray_model = None
        self.treatment_model = None
        self.model_version = "1.0.0"  # Default version
        
        # Use mock data in development or when models aren't available
        self.use_mock = settings.USE_MOCK_AI
        
        # Model is loaded lazily on first use
        logger.info(f"Initialized DentalInferenceService with model type: {self.model_type}")
        
    def _determine_model_type(self) -> str:
        """
        Determine which model type to use based on available packages and model files
        
        Returns:
            str: The model type to use
        """
        # Check for environment override
        if settings.FORCE_MODEL_TYPE:
            return settings.FORCE_MODEL_TYPE
            
        # Check for ONNX availability (preferred for speed and compatibility)
        if ONNX_AVAILABLE and ModelPath.XRAY_ONNX.exists():
            return InferenceModelType.ONNX
            
        # Check for PyTorch availability
        if TORCH_AVAILABLE and ModelPath.XRAY_PYTORCH.exists():
            return InferenceModelType.PYTORCH
            
        # Check for TensorFlow availability
        if TF_AVAILABLE and ModelPath.XRAY_TENSORFLOW.exists():
            return InferenceModelType.TENSORFLOW
            
        # If configured to use Roboflow API
        if settings.ROBOFLOW_API_KEY:
            return InferenceModelType.ROBOFLOW
            
        # If configured to use OpenAI API
        if settings.OPENAI_API_KEY:
            return InferenceModelType.OPENAI
            
        # Fallback to mock data
        logger.warning("No valid AI model found. Using mock inference data.")
        return InferenceModelType.MOCK
        
    async def load_models(self) -> None:
        """
        Load AI models if not already loaded
        """
        if self.xray_model is not None:
            return  # Already loaded
            
        try:
            if self.model_type == InferenceModelType.ONNX:
                await self._load_onnx_models()
            elif self.model_type == InferenceModelType.PYTORCH:
                await self._load_pytorch_models()
            elif self.model_type == InferenceModelType.TENSORFLOW:
                await self._load_tensorflow_models()
            elif self.model_type in [InferenceModelType.ROBOFLOW, InferenceModelType.OPENAI]:
                # These are API-based, no local models to load
                pass
            
            # Get model version
            self.model_version = self._get_model_version()
            logger.info(f"Successfully loaded models with version {self.model_version}")
        except Exception as e:
            logger.exception(f"Error loading models: {str(e)}")
            # Fall back to mock data if model loading fails
            self.use_mock = True
            self.model_type = InferenceModelType.MOCK
            
    async def _load_onnx_models(self) -> None:
        """Load ONNX models"""
        if not ONNX_AVAILABLE:
            raise ImportError("ONNX Runtime not available")
            
        self.xray_model = ort.InferenceSession(str(ModelPath.XRAY_ONNX))
        if ModelPath.TREATMENT_ONNX.exists():
            self.treatment_model = ort.InferenceSession(str(ModelPath.TREATMENT_ONNX))
            
    async def _load_pytorch_models(self) -> None:
        """Load PyTorch models"""
        if not TORCH_AVAILABLE:
            raise ImportError("PyTorch not available")
            
        self.xray_model = torch.jit.load(str(ModelPath.XRAY_PYTORCH))
        self.xray_model.eval()
        
        if ModelPath.TREATMENT_PYTORCH.exists():
            self.treatment_model = torch.jit.load(str(ModelPath.TREATMENT_PYTORCH))
            self.treatment_model.eval()
            
    async def _load_tensorflow_models(self) -> None:
        """Load TensorFlow models"""
        if not TF_AVAILABLE:
            raise ImportError("TensorFlow not available")
            
        self.xray_model = tf.saved_model.load(str(ModelPath.XRAY_TENSORFLOW))
        
        if Path(str(ModelPath.TREATMENT_TENSORFLOW)).exists():
            self.treatment_model = tf.saved_model.load(str(ModelPath.TREATMENT_TENSORFLOW))
            
    def _get_model_version(self) -> str:
        """
        Get the current model version
        
        Returns:
            str: The model version
        """
        version_file = ModelPath.BASE_DIR / "models" / "version.json"
        if version_file.exists():
            try:
                with open(version_file, "r") as f:
                    data = json.load(f)
                return data.get("version", "1.0.0")
            except:
                pass
                
        return "1.0.0"  # Default version
        
    async def analyze_xray(
        self,
        image_data: bytes,
        patient_id: str,
        provider_id: Optional[str] = None,
        image_type: str = "bitewing",
        request_id: Optional[str] = None,
        db: Optional[Session] = None
    ) -> Dict[str, Any]:
        """
        Analyze an X-ray image to detect dental conditions
        
        Args:
            image_data: Raw image bytes
            patient_id: Patient ID
            provider_id: Provider ID (optional)
            image_type: Type of X-ray (panoramic, bitewing, periapical)
            request_id: Optional request ID for correlation
            db: Database session for logging
            
        Returns:
            Dict with analysis results
        """
        start_time = time.time()
        
        # Ensure models are loaded
        await self.load_models()
        
        # Use the provided db session or the instance's
        db_session = db or self.db
        
        # Generate analysis ID
        analysis_id = str(uuid.uuid4())
        
        try:
            if self.use_mock:
                # Use mock data for testing
                result = self._generate_mock_analysis(patient_id, image_type)
            else:
                # Process the image for the model
                processed_image = await self._preprocess_image(image_data)
                
                # Run inference based on model type
                if self.model_type == InferenceModelType.ONNX:
                    result = await self._run_onnx_inference(processed_image, image_type)
                elif self.model_type == InferenceModelType.PYTORCH:
                    result = await self._run_pytorch_inference(processed_image, image_type)
                elif self.model_type == InferenceModelType.TENSORFLOW:
                    result = await self._run_tensorflow_inference(processed_image, image_type)
                elif self.model_type == InferenceModelType.ROBOFLOW:
                    from ..services.roboflow_service import roboflow_service
                    result = await roboflow_service.analyze_image_async(image_data, "jpg")
                elif self.model_type == InferenceModelType.OPENAI:
                    result = await self._run_openai_inference(image_data, image_type)
                else:
                    # Fallback to mock
                    result = self._generate_mock_analysis(patient_id, image_type)
            
            # Calculate processing time
            processing_time_ms = int((time.time() - start_time) * 1000)
            
            # Add metadata to result
            result["analysis_id"] = analysis_id
            result["patient_id"] = patient_id
            result["image_type"] = image_type
            result["timestamp"] = datetime.utcnow().isoformat()
            result["processing_time_ms"] = processing_time_ms
            result["model_version"] = self.model_version
            
            # Extract counts and confidence for logging
            findings_count = self._count_findings(result)
            confidence_score = self._calculate_confidence(result)
            
            # Log the diagnostic event if database is available
            if db_session:
                await AuditService.log_diagnostic(
                    db=db_session,
                    patient_id=patient_id,
                    image_type=image_type,
                    analysis_id=analysis_id,
                    provider_id=provider_id,
                    ai_model_version=self.model_version,
                    confidence_score=confidence_score,
                    processing_time_ms=processing_time_ms,
                    findings_count=findings_count,
                    status="success",
                    request_id=request_id,
                    metadata={
                        "model_type": self.model_type,
                        "inference_elapsed_ms": processing_time_ms
                    }
                )
            
            return result
            
        except Exception as e:
            # Log error
            logger.exception(f"Error analyzing X-ray: {str(e)}")
            
            # Log the failure event if database is available
            if db_session:
                await AuditService.log_diagnostic(
                    db=db_session,
                    patient_id=patient_id,
                    image_type=image_type,
                    analysis_id=analysis_id,
                    provider_id=provider_id,
                    status="error",
                    error_message=str(e),
                    request_id=request_id
                )
            
            # Return error response
            return {
                "success": False,
                "error": str(e),
                "analysis_id": analysis_id,
                "timestamp": datetime.utcnow().isoformat(),
                "model_version": self.model_version
            }
            
    async def _preprocess_image(self, image_data: bytes) -> np.ndarray:
        """
        Preprocess image for model input
        
        Args:
            image_data: Raw image bytes
            
        Returns:
            Preprocessed image as numpy array
        """
        if not CV2_AVAILABLE:
            raise ImportError("OpenCV and/or PIL not available for image preprocessing")
            
        # Convert to PIL Image
        image = Image.open(io.BytesIO(image_data))
        
        # Convert to numpy array
        img_array = np.array(image)
        
        # Convert to RGB if grayscale
        if len(img_array.shape) == 2:
            img_array = cv2.cvtColor(img_array, cv2.COLOR_GRAY2RGB)
        elif img_array.shape[2] == 4:
            # Convert RGBA to RGB
            img_array = cv2.cvtColor(img_array, cv2.COLOR_RGBA2RGB)
            
        # Resize to model input size (common size for many models)
        img_array = cv2.resize(img_array, (416, 416))
        
        # Normalize pixel values
        img_array = img_array.astype(np.float32) / 255.0
        
        # Add batch dimension
        img_array = np.expand_dims(img_array, axis=0)
        
        return img_array 

    async def _run_onnx_inference(self, preprocessed_image: np.ndarray, image_type: str) -> Dict[str, Any]:
        """
        Run inference using ONNX model
        
        Args:
            preprocessed_image: Processed image array
            image_type: Type of dental X-ray
            
        Returns:
            Dict with detection results
        """
        # Get input name
        input_name = self.xray_model.get_inputs()[0].name
        
        # Run inference
        outputs = self.xray_model.run(None, {input_name: preprocessed_image})
        
        # Process outputs into standardized format
        return self._process_detection_output(outputs, image_type)
        
    async def _run_pytorch_inference(self, preprocessed_image: np.ndarray, image_type: str) -> Dict[str, Any]:
        """
        Run inference using PyTorch model
        
        Args:
            preprocessed_image: Processed image array
            image_type: Type of dental X-ray
            
        Returns:
            Dict with detection results
        """
        # Convert numpy array to PyTorch tensor
        input_tensor = torch.from_numpy(preprocessed_image).float()
        
        # Run inference (with no gradient calculation)
        with torch.no_grad():
            outputs = self.xray_model(input_tensor)
            
        # Convert PyTorch outputs to numpy
        if isinstance(outputs, tuple):
            numpy_outputs = [out.cpu().numpy() for out in outputs]
        else:
            numpy_outputs = [outputs.cpu().numpy()]
            
        # Process outputs into standardized format
        return self._process_detection_output(numpy_outputs, image_type)
        
    async def _run_tensorflow_inference(self, preprocessed_image: np.ndarray, image_type: str) -> Dict[str, Any]:
        """
        Run inference using TensorFlow model
        
        Args:
            preprocessed_image: Processed image array
            image_type: Type of dental X-ray
            
        Returns:
            Dict with detection results
        """
        # Convert to TensorFlow tensor
        input_tensor = tf.convert_to_tensor(preprocessed_image, dtype=tf.float32)
        
        # Run inference
        outputs = self.xray_model(input_tensor)
        
        # Convert TensorFlow outputs to numpy
        numpy_outputs = [output.numpy() for output in outputs]
        
        # Process outputs into standardized format
        return self._process_detection_output(numpy_outputs, image_type)
        
    async def _run_openai_inference(self, image_data: bytes, image_type: str) -> Dict[str, Any]:
        """
        Run inference using OpenAI API
        
        Args:
            image_data: Raw image bytes
            image_type: Type of dental X-ray
            
        Returns:
            Dict with detection results
        """
        try:
            import openai
            from base64 import b64encode
            
            # Configure OpenAI client
            client = openai.OpenAI(api_key=settings.OPENAI_API_KEY.get_secret_value())
            
            # Convert image to base64
            base64_image = b64encode(image_data).decode('utf-8')
            
            # Create prompt based on image type
            if image_type == "panoramic":
                instruction = "Analyze this panoramic dental X-ray for pathologies. Identify and locate caries, periodontal issues, impacted teeth, root issues, and any other notable findings. Show tooth numbers for each finding."
            elif image_type == "bitewing":
                instruction = "Analyze this bitewing dental X-ray for cavities, restorations, bone levels, and any notable issues. Provide tooth numbers for each finding."
            elif image_type == "periapical":
                instruction = "Analyze this periapical dental X-ray for root issues, periapical lesions, and any notable pathologies. Provide tooth numbers for each finding."
            else:
                instruction = "Analyze this dental X-ray for any pathologies or conditions. Identify and localize all findings with tooth numbers where relevant."
            
            # Call OpenAI API
            response = client.chat.completions.create(
                model="gpt-4-vision-preview",
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": instruction},
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/jpeg;base64,{base64_image}",
                                }
                            }
                        ]
                    }
                ],
                max_tokens=1000
            )
            
            # Process the response
            analysis_text = response.choices[0].message.content
            
            # Format OpenAI response into our standard format
            # This is a simplified version - in production, you'd parse the text more comprehensively
            return {
                "success": True,
                "model": "gpt-4-vision-preview",
                "findings": self._parse_openai_response(analysis_text, image_type),
                "raw_text_analysis": analysis_text
            }
        except Exception as e:
            logger.exception(f"Error in OpenAI inference: {str(e)}")
            return {
                "success": False,
                "error": f"OpenAI inference error: {str(e)}",
                "findings": {}
            }
    
    def _process_detection_output(self, outputs: List[np.ndarray], image_type: str) -> Dict[str, Any]:
        """
        Process model outputs into standardized format
        
        Args:
            outputs: Model output arrays
            image_type: Type of dental X-ray
            
        Returns:
            Dict with standardized results
        """
        # This is a placeholder for the actual detection processing logic
        # The specific implementation depends on model output format
        
        # For now, we'll return a mock result
        return self._generate_mock_analysis("", image_type)
    
    def _parse_openai_response(self, analysis_text: str, image_type: str) -> Dict[str, List[Dict[str, Any]]]:
        """
        Parse OpenAI's text response into structured findings
        
        Args:
            analysis_text: Text from OpenAI API
            image_type: Type of dental X-ray
            
        Returns:
            Dict with structured findings
        """
        # This is a simplified parser - in production you'd use a more robust approach
        findings = {
            "caries": [],
            "periapical_lesions": [],
            "impacted_teeth": [],
            "restorations": []
        }
        
        # Look for mentions of caries/cavities
        if "caries" in analysis_text.lower() or "cavity" in analysis_text.lower() or "cavities" in analysis_text.lower():
            # Try to extract tooth numbers using regex
            import re
            tooth_pattern = r"tooth\s+#?(\d+)"
            teeth_matches = re.finditer(tooth_pattern, analysis_text.lower())
            
            for match in teeth_matches:
                tooth_num = match.group(1)
                
                # Check if caries is mentioned near this tooth
                start_pos = max(0, match.start() - 50)
                end_pos = min(len(analysis_text), match.end() + 50)
                context = analysis_text[start_pos:end_pos].lower()
                
                if "caries" in context or "cavity" in context or "decay" in context:
                    findings["caries"].append({
                        "tooth": tooth_num,
                        "surface": "O",  # Default to occlusal
                        "confidence": 0.85,
                        "severity": "moderate"
                    })
        
        # Similar processing for other conditions would go here
        
        return findings
            
    def _generate_mock_analysis(self, patient_id: str, image_type: str) -> Dict[str, Any]:
        """
        Generate mock analysis for testing
        
        Args:
            patient_id: Patient ID (can be used to create deterministic results)
            image_type: Type of dental X-ray
            
        Returns:
            Dict with mock analysis
        """
        # Generate a deterministic but seemingly random hash from patient_id
        if patient_id:
            import hashlib
            hash_obj = hashlib.md5(patient_id.encode())
            hash_hex = hash_obj.hexdigest()
            hash_int = int(hash_hex, 16)
        else:
            import random
            hash_int = random.randint(0, 2**32)
        
        # Select teeth based on hash
        all_teeth = [str(i) for i in range(11, 19)] + [str(i) for i in range(21, 29)] + \
                    [str(i) for i in range(31, 39)] + [str(i) for i in range(41, 49)]
        
        # Number of findings based on hash
        num_caries = (hash_int % 5) + 1
        num_lesions = (hash_int % 3)
        num_restorations = (hash_int % 4) + 2
        
        # Create findings dict
        findings = {
            "caries": [],
            "periapical_lesions": [],
            "impacted_teeth": [],
            "restorations": []
        }
        
        # Generate caries findings
        for i in range(num_caries):
            tooth_idx = (hash_int + i * 17) % len(all_teeth)
            tooth = all_teeth[tooth_idx]
            severity = ["mild", "moderate", "severe"][(hash_int + i * 7) % 3]
            surface = ["M", "O", "D", "B", "L"][(hash_int + i * 13) % 5]
            
            findings["caries"].append({
                "tooth": tooth,
                "surface": surface,
                "confidence": round(0.7 + ((hash_int + i) % 25) / 100, 2),
                "severity": severity
            })
        
        # Generate lesions
        for i in range(num_lesions):
            tooth_idx = (hash_int + i * 29) % len(all_teeth)
            tooth = all_teeth[tooth_idx]
            
            findings["periapical_lesions"].append({
                "tooth": tooth,
                "confidence": round(0.75 + ((hash_int + i) % 20) / 100, 2),
                "diameter_mm": round(2 + ((hash_int + i) % 8) / 2, 1)
            })
        
        # Generate restorations
        for i in range(num_restorations):
            tooth_idx = (hash_int + i * 37) % len(all_teeth)
            tooth = all_teeth[tooth_idx]
            material = ["amalgam", "composite", "crown", "inlay"][(hash_int + i * 11) % 4]
            surface = ["M", "O", "D", "MOD", "DO", "MO"][(hash_int + i * 7) % 6]
            
            findings["restorations"].append({
                "tooth": tooth,
                "surface": surface,
                "material": material,
                "confidence": round(0.85 + ((hash_int + i) % 15) / 100, 2),
                "condition": ["good", "good", "good", "defective"][(hash_int + i * 13) % 4]
            })
        
        # Add an impacted tooth with 30% probability
        if hash_int % 10 < 3:
            wisdom_teeth = ["18", "28", "38", "48"]
            tooth = wisdom_teeth[hash_int % 4]
            
            findings["impacted_teeth"].append({
                "tooth": tooth,
                "confidence": round(0.80 + (hash_int % 15) / 100, 2),
                "angulation": ["mesioangular", "vertical", "horizontal", "distoangular"][hash_int % 4]
            })
        
        return {
            "success": True,
            "findings": findings,
            "raw_predictions_count": sum(len(v) for v in findings.values())
        }
        
    def _count_findings(self, result: Dict[str, Any]) -> int:
        """
        Count the total number of findings in the result
        
        Args:
            result: Analysis result
            
        Returns:
            int: Total number of findings
        """
        if not result.get("success", False):
            return 0
            
        findings = result.get("findings", {})
        if not findings:
            return 0
            
        total = 0
        for category, items in findings.items():
            if isinstance(items, list):
                total += len(items)
                
        return total
        
    def _calculate_confidence(self, result: Dict[str, Any]) -> float:
        """
        Calculate the overall confidence score for the analysis
        
        Args:
            result: Analysis result
            
        Returns:
            float: Average confidence score
        """
        if not result.get("success", False):
            return 0.0
            
        findings = result.get("findings", {})
        if not findings:
            return 0.0
            
        all_scores = []
        for category, items in findings.items():
            if isinstance(items, list):
                for item in items:
                    if isinstance(item, dict) and "confidence" in item:
                        all_scores.append(item["confidence"])
                        
        if not all_scores:
            return 0.0
            
        return sum(all_scores) / len(all_scores)
        
    async def suggest_treatments(
        self,
        diagnosis_id: str,
        patient_id: str,
        findings: Dict[str, Any],
        provider_id: Optional[str] = None,
        request_id: Optional[str] = None,
        db: Optional[Session] = None
    ) -> Dict[str, Any]:
        """
        Generate treatment suggestions based on diagnostic findings
        
        Args:
            diagnosis_id: ID of the diagnosis
            patient_id: Patient ID
            findings: Diagnostic findings
            provider_id: Provider ID (optional)
            request_id: Optional request ID for correlation
            db: Database session for logging
            
        Returns:
            Dict with treatment suggestions
        """
        from ..models.ai_treatment_suggestion import AITreatmentSuggestion, SuggestionStatus
        from ..services.ai_treatment_suggestion_service import AITreatmentSuggestionService
        
        start_time = time.time()
        
        # Ensure models are loaded
        await self.load_models()
        
        # Use the provided db session or the instance's
        db_session = db or self.db
        
        # Initialize treatment suggestion service
        treatment_service = AITreatmentSuggestionService(db_session)
        
        try:
            # Generate suggestions based on the diagnosis
            result = await treatment_service.generate_suggestions_from_diagnosis(
                diagnosis_id,
                generate_groups=True
            )
            
            # Calculate processing time
            processing_time_ms = int((time.time() - start_time) * 1000)
            
            # Get the confidence score from the suggestions
            confidence_scores = [s.confidence for s in result.get("suggestions", [])]
            avg_confidence = sum(confidence_scores) / len(confidence_scores) if confidence_scores else 0
            
            # Log the treatment suggestion in audit logs
            if db_session:
                await AuditService.log_treatment(
                    db=db_session,
                    patient_id=patient_id,
                    diagnostic_id=diagnosis_id,
                    provider_id=provider_id,
                    suggested_treatments=[{
                        "id": str(s.id),
                        "procedure_name": s.procedure_name,
                        "procedure_code": s.procedure_code,
                        "tooth_number": s.tooth_number,
                        "confidence": s.confidence
                    } for s in result.get("suggestions", [])],
                    ai_confidence=avg_confidence,
                    status="suggested",
                    request_id=request_id,
                    metadata={
                        "model_version": self.model_version,
                        "model_type": self.model_type,
                        "processing_time_ms": processing_time_ms,
                        "suggestion_count": len(result.get("suggestions", [])),
                        "group_count": len(result.get("groups", []))
                    }
                )
            
            # Format the response
            return {
                "success": True,
                "processing_time_ms": processing_time_ms,
                "model_version": self.model_version,
                "suggestions": result.get("suggestions", []),
                "groups": result.get("groups", []),
                "suggestion_count": len(result.get("suggestions", [])),
                "timestamp": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            # Log error
            logger.exception(f"Error generating treatment suggestions: {str(e)}")
            
            # Log the failure event
            if db_session:
                await AuditService.log_treatment(
                    db=db_session,
                    patient_id=patient_id,
                    diagnostic_id=diagnosis_id,
                    provider_id=provider_id,
                    status="error",
                    request_id=request_id,
                    metadata={
                        "error": str(e)
                    }
                )
            
            # Return error response
            return {
                "success": False,
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat()
            }

# Create a singleton instance
inference_service = DentalInferenceService() 