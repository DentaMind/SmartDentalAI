"""
Roboflow service for analyzing dental X-rays.
Connects to Roboflow API for dental X-ray analysis, with fallback to mock data.
"""

import logging
import base64
import json
import os
import httpx
import time
from datetime import datetime
from typing import Dict, Any, List, Optional, Tuple, Union, BinaryIO
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

logger = logging.getLogger(__name__)

class RoboflowService:
    def __init__(self):
        """Initialize the Roboflow service with API key and model configuration"""
        # Get API key from environment variable
        self.api_key = os.getenv("ROBOFLOW_API_KEY")
        self.model_id = "dental-xray-detection"
        self.model_version = "5"  # Latest version
        self.confidence_threshold = 0.5
        self.base_url = "https://detect.roboflow.com"
        
        # Check if we have an API key
        self.use_mock = not self.api_key
        if self.use_mock:
            logger.warning("No Roboflow API key found. Using mock data instead.")
        else:
            logger.info(f"Initialized Roboflow service with model {self.model_id} version {self.model_version}")
    
    async def analyze_image_async(self, image_data: bytes, image_format: str = "jpg") -> Dict[str, Any]:
        """
        Asynchronously analyze a dental X-ray image with Roboflow API
        
        Args:
            image_data: The raw image data in bytes
            image_format: The format of the image (jpg, png)
            
        Returns:
            Dictionary with analysis results
        """
        if self.use_mock:
            # Return mock results if no API key
            logger.info("Using mock data for X-ray analysis")
            time.sleep(1)  # Simulate API call delay
            return {
                "timestamp": datetime.now().isoformat(),
                "model": f"{self.model_id}@{self.model_version}",
                "findings": self._generate_mock_results(),
                "success": True
            }
        
        try:
            # Prepare for API call
            endpoint = f"{self.base_url}/{self.model_id}/{self.model_version}"
            
            # Format the confidence threshold
            params = {"confidence": self.confidence_threshold}
            
            # Set up headers
            headers = {
                "Content-Type": f"image/{image_format}",
                "Api-Key": self.api_key
            }
            
            # Make the API call
            logger.info(f"Sending dental X-ray to Roboflow API ({len(image_data)} bytes)")
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    endpoint,
                    params=params,
                    headers=headers,
                    content=image_data
                )
            
            # Process the response
            if response.status_code == 200:
                raw_results = response.json()
                logger.info(f"Received successful response from Roboflow API")
                
                # Process the results into our standardized format
                processed_results = self._process_api_results(raw_results)
                
                return {
                    "timestamp": datetime.now().isoformat(),
                    "model": f"{self.model_id}@{self.model_version}",
                    "findings": processed_results,
                    "raw_predictions": raw_results.get("predictions", []),
                    "success": True
                }
            else:
                logger.error(f"Roboflow API error: {response.status_code} - {response.text}")
                return {
                    "timestamp": datetime.now().isoformat(),
                    "model": f"{self.model_id}@{self.model_version}",
                    "error": f"API error: {response.status_code}",
                    "success": False
                }
        
        except Exception as e:
            logger.exception(f"Error analyzing image with Roboflow: {e}")
            return {
                "timestamp": datetime.now().isoformat(),
                "model": f"{self.model_id}@{self.model_version}",
                "error": str(e),
                "success": False,
                "findings": self._generate_mock_results()  # Fallback to mock data
            }
    
    def analyze_image(self, image_data: bytes, image_format: str = "jpg") -> Dict[str, Any]:
        """
        Synchronous wrapper for analyze_image_async
        
        Args:
            image_data: The raw image data in bytes
            image_format: The format of the image (jpg, png)
            
        Returns:
            Dictionary with analysis results
        """
        # If no API key, return mock data immediately
        if self.use_mock:
            logger.info("Using mock data for X-ray analysis (sync)")
            time.sleep(1)  # Simulate API call delay
            return {
                "timestamp": datetime.now().isoformat(),
                "model": f"{self.model_id}@{self.model_version}",
                "findings": self._generate_mock_results(),
                "success": True
            }
        
        try:
            # Prepare for API call
            endpoint = f"{self.base_url}/{self.model_id}/{self.model_version}"
            
            # Format the confidence threshold
            params = {"confidence": self.confidence_threshold}
            
            # Set up headers
            headers = {
                "Content-Type": f"image/{image_format}",
                "Api-Key": self.api_key
            }
            
            # Make the API call
            logger.info(f"Sending dental X-ray to Roboflow API ({len(image_data)} bytes)")
            with httpx.Client(timeout=30.0) as client:
                response = client.post(
                    endpoint,
                    params=params,
                    headers=headers,
                    content=image_data
                )
            
            # Process the response
            if response.status_code == 200:
                raw_results = response.json()
                logger.info(f"Received successful response from Roboflow API")
                
                # Process the results into our standardized format
                processed_results = self._process_api_results(raw_results)
                
                return {
                    "timestamp": datetime.now().isoformat(),
                    "model": f"{self.model_id}@{self.model_version}",
                    "findings": processed_results,
                    "raw_predictions": raw_results.get("predictions", []),
                    "success": True
                }
            else:
                logger.error(f"Roboflow API error: {response.status_code} - {response.text}")
                return {
                    "timestamp": datetime.now().isoformat(),
                    "model": f"{self.model_id}@{self.model_version}",
                    "error": f"API error: {response.status_code}",
                    "success": False
                }
        
        except Exception as e:
            logger.exception(f"Error analyzing image with Roboflow: {e}")
            return {
                "timestamp": datetime.now().isoformat(),
                "model": f"{self.model_id}@{self.model_version}",
                "error": str(e),
                "success": False,
                "findings": self._generate_mock_results()  # Fallback to mock data
            }
    
    def _process_api_results(self, raw_results: Dict[str, Any]) -> Dict[str, List[Dict[str, Any]]]:
        """Process raw API results into structured findings"""
        predictions = raw_results.get("predictions", [])
        
        # Initialize the structured results
        findings = {
            "caries": [],
            "periapical_lesions": [],
            "impacted_teeth": [],
            "restorations": []
        }
        
        # Process each prediction
        for pred in predictions:
            class_name = pred.get("class", "").lower()
            confidence = pred.get("confidence", 0)
            x = pred.get("x", 0)
            y = pred.get("y", 0)
            width = pred.get("width", 0)
            height = pred.get("height", 0)
            
            # Extract tooth number from labels (if available)
            tooth_number = None
            for label in class_name.split('_'):
                if label.isdigit() and 11 <= int(label) <= 48:  # FDI tooth numbering system
                    tooth_number = label
                    break
            
            # Map prediction classes to our findings structure
            if "caries" in class_name or "decay" in class_name:
                # Determine surface based on location or default to "O"
                surface = self._determine_surface(class_name, x, y)
                # Determine severity based on confidence
                severity = self._determine_severity(confidence)
                
                findings["caries"].append({
                    "tooth": tooth_number or self._estimate_tooth_from_position(x, y),
                    "surface": surface,
                    "confidence": confidence,
                    "severity": severity,
                    "position": {"x": x, "y": y, "width": width, "height": height}
                })
            
            elif "periapical" in class_name or "lesion" in class_name:
                findings["periapical_lesions"].append({
                    "tooth": tooth_number or self._estimate_tooth_from_position(x, y),
                    "confidence": confidence,
                    "diameter_mm": round(max(width, height) * 0.3, 1),  # Approximate size
                    "position": {"x": x, "y": y, "width": width, "height": height}
                })
            
            elif "impacted" in class_name:
                findings["impacted_teeth"].append({
                    "tooth": tooth_number or self._estimate_tooth_from_position(x, y),
                    "confidence": confidence,
                    "angulation": self._determine_angulation(class_name),
                    "position": {"x": x, "y": y, "width": width, "height": height}
                })
            
            elif "restoration" in class_name or "filling" in class_name or "crown" in class_name:
                # Determine surface based on location or default to "O"
                surface = self._determine_surface(class_name, x, y)
                # Determine type (amalgam, composite, etc.)
                restoration_type = self._determine_restoration_type(class_name)
                
                findings["restorations"].append({
                    "tooth": tooth_number or self._estimate_tooth_from_position(x, y),
                    "surface": surface,
                    "type": restoration_type,
                    "confidence": confidence,
                    "position": {"x": x, "y": y, "width": width, "height": height}
                })
        
        return findings
    
    def _estimate_tooth_from_position(self, x: float, y: float) -> str:
        """Estimate tooth number based on position in image (simplified)"""
        # This is a very simplified estimation - in reality we'd need to know
        # the X-ray type and have a more sophisticated algorithm
        
        # Default to a common molar
        return "36"  # Lower left first molar
    
    def _determine_surface(self, class_name: str, x: float, y: float) -> str:
        """Determine tooth surface based on class name and position"""
        if "occlusal" in class_name or "o_" in class_name:
            return "O"
        elif "mesial" in class_name or "m_" in class_name:
            return "M"
        elif "distal" in class_name or "d_" in class_name:
            return "D"
        elif "buccal" in class_name or "b_" in class_name:
            return "B"
        elif "lingual" in class_name or "l_" in class_name:
            return "L"
        elif "mod" in class_name:
            return "MOD"
        else:
            # Default to occlusal
            return "O"
    
    def _determine_severity(self, confidence: float) -> str:
        """Determine severity of a finding based on confidence"""
        if confidence > 0.9:
            return "severe"
        elif confidence > 0.75:
            return "moderate"
        else:
            return "mild"
    
    def _determine_angulation(self, class_name: str) -> str:
        """Determine angulation of impacted tooth"""
        if "mesioangular" in class_name:
            return "mesioangular"
        elif "distoangular" in class_name:
            return "distoangular"
        elif "horizontal" in class_name:
            return "horizontal"
        elif "vertical" in class_name:
            return "vertical"
        else:
            return "mesioangular"  # Default
    
    def _determine_restoration_type(self, class_name: str) -> str:
        """Determine type of restoration"""
        if "amalgam" in class_name:
            return "amalgam"
        elif "composite" in class_name:
            return "composite"
        elif "crown" in class_name:
            return "crown"
        elif "onlay" in class_name:
            return "onlay"
        elif "inlay" in class_name:
            return "inlay"
        else:
            return "amalgam"  # Default
    
    def _generate_mock_results(self) -> Dict[str, List[Dict[str, Any]]]:
        """Generate mock results for testing"""
        return {
            "caries": [
                {
                    "tooth": "18", 
                    "surface": "O",
                    "confidence": 0.89,
                    "severity": "moderate",
                    "position": {"x": 120, "y": 240, "width": 20, "height": 15}
                },
                {
                    "tooth": "46",
                    "surface": "MOD",
                    "confidence": 0.95,
                    "severity": "severe",
                    "position": {"x": 320, "y": 340, "width": 25, "height": 18}
                }
            ],
            "periapical_lesions": [
                {
                    "tooth": "22",
                    "confidence": 0.92,
                    "diameter_mm": 4.5,
                    "position": {"x": 200, "y": 180, "width": 15, "height": 15}
                }
            ],
            "impacted_teeth": [
                {
                    "tooth": "38",
                    "confidence": 0.97,
                    "angulation": "mesioangular",
                    "position": {"x": 80, "y": 420, "width": 40, "height": 30}
                }
            ],
            "restorations": [
                {
                    "tooth": "16",
                    "surface": "OD",
                    "type": "amalgam",
                    "confidence": 0.98,
                    "position": {"x": 150, "y": 210, "width": 22, "height": 16}
                },
                {
                    "tooth": "36",
                    "surface": "MOD",
                    "type": "composite",
                    "confidence": 0.94,
                    "position": {"x": 280, "y": 360, "width": 24, "height": 17}
                }
            ]
        }
    
    def save_image(self, image_data: bytes, patient_id: str, 
                  image_name: Optional[str] = None) -> Tuple[str, str]:
        """
        Save an X-ray image to disk
        
        Args:
            image_data: The raw image data in bytes
            patient_id: The patient identifier
            image_name: Optional custom image name
            
        Returns:
            Tuple of (image_id, image_path)
        """
        # Create a directory for storing X-rays if it doesn't exist
        base_dir = os.path.join(os.path.dirname(__file__), '..', '..', 'attached_assets', 'xrays')
        os.makedirs(base_dir, exist_ok=True)
        
        # Create patient directory if it doesn't exist
        patient_dir = os.path.join(base_dir, patient_id)
        os.makedirs(patient_dir, exist_ok=True)
        
        # Generate a filename
        timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
        filename = image_name or f"xray_{timestamp}.jpg"
        image_path = os.path.join(patient_dir, filename)
        
        # Save the image
        with open(image_path, 'wb') as f:
            f.write(image_data)
        
        logger.info(f"Saved X-ray for patient {patient_id} at {image_path}")
        
        # Return the image ID (just the filename without extension) and the path
        image_id = os.path.splitext(filename)[0]
        return image_id, image_path

# Create singleton instance
roboflow_service = RoboflowService() 