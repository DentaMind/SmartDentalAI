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
import hashlib
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional, Tuple, Union, BinaryIO
from functools import lru_cache
from ..config.settings import settings

# Configure logging
logger = logging.getLogger(__name__)

class RoboflowService:
    """Service for interacting with Roboflow API for dental X-ray analysis"""
    
    def __init__(self):
        """Initialize the Roboflow service with API key and model configuration"""
        # Get configuration from settings
        self.api_key = settings.ROBOFLOW_API_KEY.get_secret_value() if settings.ROBOFLOW_API_KEY else None
        self.model_id = settings.ROBOFLOW_MODEL_ID
        self.model_version = settings.ROBOFLOW_MODEL_VERSION
        self.confidence_threshold = 0.5
        self.base_url = "https://detect.roboflow.com"
        
        # Set up client with appropriate timeouts
        self.client = httpx.AsyncClient(timeout=30.0)
        
        # Initialize cache
        self._cache = {}
        self._cache_ttl = timedelta(minutes=30)
        
        # Stats for monitoring
        self.request_count = 0
        self.error_count = 0
        self.cache_hits = 0
        self.avg_response_time = 0
        
        # Check if we have an API key or should use mock mode
        self.use_mock = settings.USE_MOCK_AI or not self.api_key
        if self.use_mock:
            logger.warning("No Roboflow API key found or USE_MOCK_AI set to True. Using mock data.")
        else:
            logger.info(f"Initialized Roboflow service with model {self.model_id} version {self.model_version}")
    
    async def analyze_image_async(self, image_data: bytes, format: str) -> Dict[str, Any]:
        """
        Analyze an image using the Roboflow API
        
        Args:
            image_data: Raw image bytes
            format: Image format (jpg, png, etc.)
            
        Returns:
            Analysis results with findings and confidence scores
        """
        start_time = time.time()
        self.request_count += 1
        
        # Calculate hash for caching
        image_hash = hashlib.md5(image_data).hexdigest()
        cache_key = f"{image_hash}_{format}_{self.model_id}_{self.model_version}"
        
        # Check cache first
        if cache_key in self._cache:
            cache_entry = self._cache[cache_key]
            if datetime.now() < cache_entry["expires"]:
                self.cache_hits += 1
                logger.info(f"Cache hit for image hash {image_hash[:8]}")
                return cache_entry["data"]
            else:
                # Expired entry
                del self._cache[cache_key]
        
        # Use mock data if configured or no API key
        if self.use_mock:
            result = self._get_mock_analysis_result(image_hash)
            
            # Update monitoring stats
            elapsed = time.time() - start_time
            self._update_stats(elapsed)
            
            # Cache the result
            self._add_to_cache(cache_key, result)
            
            return result
        
        # Real API call
        try:
            # Build API URL
            api_url = f"{self.base_url}/{self.model_id}/{self.model_version}?api_key={self.api_key}"
            
            # Prepare form data
            form = {"file": (f"image.{format}", image_data, f"image/{format}")}
            
            # Make the request
            logger.info(f"Sending request to Roboflow API for model {self.model_id}")
            async with self.client.stream("POST", api_url, files=form) as response:
                if response.status_code != 200:
                    error_msg = await response.text()
                    logger.error(f"Roboflow API error: {response.status_code}, {error_msg}")
                    self.error_count += 1
                    
                    # Return error response
                    return {
                        "success": False,
                        "error": f"API returned status code {response.status_code}",
                        "timestamp": datetime.now().isoformat(),
                        "model": f"{self.model_id}@{self.model_version}"
                    }
                
                # Parse the JSON response
                json_response = await response.json()
                
            # Process the predictions and convert to standardized format
            result = self._process_api_response(json_response)
            
            # Update monitoring stats
            elapsed = time.time() - start_time
            self._update_stats(elapsed)
            
            # Cache the result
            self._add_to_cache(cache_key, result)
            
            return result
            
        except Exception as e:
            logger.exception(f"Error analyzing image with Roboflow: {str(e)}")
            self.error_count += 1
            
            # Return error response
            return {
                "success": False, 
                "error": str(e),
                "timestamp": datetime.now().isoformat(),
                "model": f"{self.model_id}@{self.model_version}"
            }
    
    def _process_api_response(self, response: Dict[str, Any]) -> Dict[str, Any]:
        """Process raw API response into standardized format"""
        try:
            predictions = response.get("predictions", [])
            findings = {
                "caries": [],
                "periapical_lesions": [],
                "impacted_teeth": [],
                "restorations": []
            }
            
            # Process each prediction
            for pred in predictions:
                confidence = pred.get("confidence", 0)
                if confidence < self.confidence_threshold:
                    continue
                    
                class_name = pred.get("class", "")
                box = {
                    "x": pred.get("x", 0),
                    "y": pred.get("y", 0),
                    "width": pred.get("width", 0),
                    "height": pred.get("height", 0)
                }
                
                # Map class names to appropriate categories
                if "caries" in class_name:
                    # Extract tooth number and surface from class
                    parts = class_name.split("_")
                    tooth = parts[1] if len(parts) > 1 else "unknown"
                    surface = parts[2] if len(parts) > 2 else "O"
                    severity = "moderate"
                    
                    findings["caries"].append({
                        "tooth": tooth,
                        "surface": surface,
                        "confidence": confidence,
                        "severity": severity,
                        "position": box
                    })
                elif "lesion" in class_name:
                    parts = class_name.split("_")
                    tooth = parts[1] if len(parts) > 1 else "unknown"
                    
                    findings["periapical_lesions"].append({
                        "tooth": tooth,
                        "confidence": confidence,
                        "diameter_mm": round(box["width"] * 3.4, 1),  # Estimate size
                        "position": box
                    })
                elif "impacted" in class_name:
                    parts = class_name.split("_")
                    tooth = parts[1] if len(parts) > 1 else "unknown"
                    
                    findings["impacted_teeth"].append({
                        "tooth": tooth,
                        "confidence": confidence,
                        "angulation": "mesioangular",  # Default
                        "position": box
                    })
                elif "restoration" in class_name:
                    parts = class_name.split("_")
                    tooth = parts[1] if len(parts) > 1 else "unknown"
                    material = parts[2] if len(parts) > 2 else "unknown"
                    surface = parts[3] if len(parts) > 3 else "O"
                    
                    findings["restorations"].append({
                        "tooth": tooth,
                        "surface": surface,
                        "material": material,
                        "condition": "good",
                        "confidence": confidence,
                        "position": box
                    })
            
            return {
                "success": True,
                "timestamp": datetime.now().isoformat(),
                "model": f"{self.model_id}@{self.model_version}",
                "findings": findings,
                "raw_predictions_count": len(predictions)
            }
            
        except Exception as e:
            logger.exception(f"Error processing API response: {str(e)}")
            return {
                "success": False,
                "error": f"Error processing API response: {str(e)}",
                "timestamp": datetime.now().isoformat(),
                "model": f"{self.model_id}@{self.model_version}"
            }
    
    def _get_mock_analysis_result(self, image_hash: str) -> Dict[str, Any]:
        """Generate mock analysis results for testing without API"""
        # Use the hash to create deterministic but different results
        hash_int = int(image_hash[:8], 16)
        
        # Generate some findings based on the hash
        tooth_numbers = ["18", "17", "16", "15", "14", "13", "12", "11", 
                         "21", "22", "23", "24", "25", "26", "27", "28",
                         "48", "47", "46", "45", "44", "43", "42", "41",
                         "31", "32", "33", "34", "35", "36", "37", "38"]
                         
        surfaces = ["M", "O", "D", "B", "L", "F", "MOD", "DO", "MO"]
        
        # Select teeth based on hash
        selected_teeth = [tooth_numbers[i % len(tooth_numbers)] 
                          for i in range(hash_int % 5 + 1)]
        
        # Create mock findings
        findings = {
            "caries": [],
            "periapical_lesions": [],
            "impacted_teeth": [],
            "restorations": []
        }
        
        # Add some caries findings
        for i, tooth in enumerate(selected_teeth):
            if i % 3 == 0:
                surface = surfaces[hash_int % len(surfaces)]
                findings["caries"].append({
                    "tooth": tooth,
                    "surface": surface,
                    "confidence": round(0.75 + (hash_int % 20) / 100, 2),
                    "severity": "moderate",
                    "position": {
                        "x": 100 + (hash_int % 300),
                        "y": 150 + (hash_int % 200),
                        "width": 20,
                        "height": 15
                    }
                })
            elif i % 3 == 1:
                findings["periapical_lesions"].append({
                    "tooth": tooth,
                    "confidence": round(0.80 + (hash_int % 15) / 100, 2),
                    "diameter_mm": round(2 + (hash_int % 5), 1),
                    "position": {
                        "x": 200 + (hash_int % 100),
                        "y": 180 + (hash_int % 150),
                        "width": 15,
                        "height": 15
                    }
                })
            else:
                findings["restorations"].append({
                    "tooth": tooth,
                    "surface": "MOD",
                    "material": "amalgam" if hash_int % 2 == 0 else "composite",
                    "condition": "good",
                    "confidence": round(0.90 + (hash_int % 10) / 100, 2),
                    "position": {
                        "x": 150 + (hash_int % 200),
                        "y": 120 + (hash_int % 250),
                        "width": 25,
                        "height": 20
                    }
                })
        
        # Add impacted teeth if hash is even
        if hash_int % 2 == 0:
            impacted_tooth = tooth_numbers[hash_int % 4 + 4]  # Usually wisdom teeth
            findings["impacted_teeth"].append({
                "tooth": impacted_tooth,
                "confidence": round(0.85 + (hash_int % 15) / 100, 2),
                "angulation": "mesioangular" if hash_int % 2 == 0 else "horizontal",
                "position": {
                    "x": 300 + (hash_int % 50),
                    "y": 200 + (hash_int % 50),
                    "width": 30,
                    "height": 25
                }
            })
        
        return {
            "success": True,
            "timestamp": datetime.now().isoformat(),
            "model": f"{self.model_id}@{self.model_version}-mock",
            "findings": findings,
            "raw_predictions_count": len(findings["caries"]) + len(findings["periapical_lesions"]) + 
                                    len(findings["impacted_teeth"]) + len(findings["restorations"])
        }
    
    def _add_to_cache(self, key: str, data: Dict[str, Any]) -> None:
        """Add result to cache with expiration"""
        self._cache[key] = {
            "data": data,
            "expires": datetime.now() + self._cache_ttl
        }
        
        # Clean expired entries if cache is getting large
        if len(self._cache) > 100:
            self._clean_cache()
    
    def _clean_cache(self) -> None:
        """Remove expired entries from cache"""
        now = datetime.now()
        expired_keys = [k for k, v in self._cache.items() if v["expires"] < now]
        for key in expired_keys:
            del self._cache[key]
    
    def _update_stats(self, elapsed_time: float) -> None:
        """Update monitoring statistics"""
        # Update average response time using a simple moving average
        if self.request_count == 1:
            self.avg_response_time = elapsed_time
        else:
            self.avg_response_time = (self.avg_response_time * 0.95) + (elapsed_time * 0.05)
    
    def get_stats(self) -> Dict[str, Any]:
        """Get statistics for monitoring"""
        return {
            "request_count": self.request_count,
            "error_count": self.error_count,
            "cache_hits": self.cache_hits,
            "cache_size": len(self._cache),
            "avg_response_time": round(self.avg_response_time, 3),
            "error_rate": round(self.error_count / max(self.request_count, 1), 3),
            "cache_hit_rate": round(self.cache_hits / max(self.request_count, 1), 3),
            "model": f"{self.model_id}@{self.model_version}",
            "using_mock": self.use_mock
        }

# Create a singleton instance
roboflow_service = RoboflowService() 