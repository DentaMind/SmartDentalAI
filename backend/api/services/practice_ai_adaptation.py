from typing import Dict, List, Any, Optional
import os
import uuid
import json
import logging
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, desc, func

from ..models.diagnostic_feedback import DiagnosticFeedback, DiagnosticFinding

logger = logging.getLogger(__name__)

class PracticeAIAdaptationService:
    """
    Service for adapting the global AI model to specific dental practices
    
    This service:
    1. Analyzes patterns of corrections and feedback specific to a practice
    2. Creates and manages practice-specific model adaptations
    3. Tracks practice-specific model performance
    4. Provides specialized recommendations for each practice
    """
    
    def __init__(self, db: Optional[Session] = None):
        """Initialize the practice AI adaptation service"""
        self.db = db
        self.practice_models_path = os.path.join("models", "practices")
        self._ensure_directories()
        
    def _ensure_directories(self):
        """Ensure necessary directories exist"""
        os.makedirs(self.practice_models_path, exist_ok=True)
    
    async def get_practice_correction_patterns(self, practice_id: str, limit: int = 100) -> Dict[str, Any]:
        """
        Get patterns of corrections for a specific practice
        
        Args:
            practice_id: ID of the practice
            limit: Maximum number of corrections to analyze
            
        Returns:
            Analysis of correction patterns
        """
        if not self.db:
            # Mock implementation for demonstration
            return self._get_mock_practice_patterns(practice_id)
            
        # Get corrections for this practice
        corrections = self.db.query(DiagnosticFeedback).filter(
            DiagnosticFeedback.practice_id == practice_id,
            DiagnosticFeedback.feedback_type == "correction",
            DiagnosticFeedback.correction.isnot(None),
            DiagnosticFeedback.original_diagnosis.isnot(None)
        ).order_by(desc(DiagnosticFeedback.created_at)).limit(limit).all()
        
        # Analyze correction patterns
        pattern_counts = {}
        area_corrections = {}
        provider_corrections = {}
        
        for correction in corrections:
            # Track correction patterns by original→corrected mapping
            pattern_key = f"{correction.original_diagnosis}→{correction.correction}"
            pattern_counts[pattern_key] = pattern_counts.get(pattern_key, 0) + 1
            
            # Get the finding to analyze area corrections
            finding = self.db.query(DiagnosticFinding).filter(
                DiagnosticFinding.id == correction.finding_id
            ).first()
            
            if finding and hasattr(finding, 'area'):
                area = finding.area
                if area not in area_corrections:
                    area_corrections[area] = {"total": 0, "patterns": {}}
                area_corrections[area]["total"] += 1
                area_corrections[area]["patterns"][pattern_key] = area_corrections[area]["patterns"].get(pattern_key, 0) + 1
            
            # Track by provider
            provider_id = correction.provider_id
            if provider_id not in provider_corrections:
                provider_corrections[provider_id] = {"name": correction.provider_name, "total": 0, "patterns": {}}
            provider_corrections[provider_id]["total"] += 1
            provider_corrections[provider_id]["patterns"][pattern_key] = provider_corrections[provider_id]["patterns"].get(pattern_key, 0) + 1
            
        # Convert to sorted lists for output
        patterns = [{"pattern": k, "count": v} for k, v in pattern_counts.items()]
        patterns.sort(key=lambda x: x["count"], reverse=True)
        
        areas = [{"area": k, "total": v["total"], "patterns": [{"pattern": pk, "count": pc} for pk, pc in v["patterns"].items()]} 
                for k, v in area_corrections.items()]
        areas.sort(key=lambda x: x["total"], reverse=True)
        
        providers = [{"provider_id": k, "name": v["name"], "total": v["total"], 
                     "patterns": [{"pattern": pk, "count": pc} for pk, pc in v["patterns"].items()]} 
                    for k, v in provider_corrections.items()]
        providers.sort(key=lambda x: x["total"], reverse=True)
        
        # Calculate overall statistics
        total_findings = self.db.query(func.count(DiagnosticFinding.id)).filter(
            DiagnosticFinding.patient_id.in_(
                self.db.query(DiagnosticFeedback.patient_id).filter(
                    DiagnosticFeedback.practice_id == practice_id
                ).distinct()
            )
        ).scalar() or 0
        
        total_corrections = len(corrections)
        correction_rate = (total_corrections / total_findings) * 100 if total_findings > 0 else 0
        
        return {
            "practice_id": practice_id,
            "total_findings": total_findings,
            "total_corrections": total_corrections,
            "correction_rate": correction_rate,
            "top_correction_patterns": patterns[:10],  # Top 10 patterns
            "correction_patterns_by_area": areas,
            "correction_patterns_by_provider": providers,
            "analysis_timestamp": datetime.now().isoformat()
        }
    
    def _get_mock_practice_patterns(self, practice_id: str) -> Dict[str, Any]:
        """Generate mock pattern data for demonstration"""
        areas = ["caries", "periodontal", "periapical", "orthodontic", "tmj"]
        patterns = [
            {"pattern": "Dental Caries→Incipient Caries", "count": 12},
            {"pattern": "Periapical Abscess→Periapical Granuloma", "count": 8},
            {"pattern": "Moderate Gingivitis→Mild Gingivitis", "count": 7},
            {"pattern": "Severe Periodontitis→Moderate Periodontitis", "count": 5},
            {"pattern": "TMJ Disorder→Myofascial Pain", "count": 4}
        ]
        
        area_patterns = []
        for area in areas:
            area_patterns.append({
                "area": area,
                "total": 5 + (hash(area + practice_id) % 15),  # Pseudo-random but consistent for the same practice
                "patterns": [{"pattern": p["pattern"], "count": max(1, p["count"] // 2)} for p in patterns if area in p["pattern"].lower()]
            })
        
        return {
            "practice_id": practice_id,
            "total_findings": 150,
            "total_corrections": 42,
            "correction_rate": 28.0,
            "top_correction_patterns": patterns,
            "correction_patterns_by_area": area_patterns,
            "correction_patterns_by_provider": [
                {"provider_id": "provider-1", "name": "Dr. Smith", "total": 18, 
                 "patterns": [{"pattern": "Dental Caries→Incipient Caries", "count": 6}]},
                {"provider_id": "provider-2", "name": "Dr. Johnson", "total": 14,
                 "patterns": [{"pattern": "Periapical Abscess→Periapical Granuloma", "count": 5}]},
                {"provider_id": "provider-3", "name": "Dr. Williams", "total": 10,
                 "patterns": [{"pattern": "Moderate Gingivitis→Mild Gingivitis", "count": 4}]}
            ],
            "analysis_timestamp": datetime.now().isoformat()
        }
    
    async def create_practice_adaptation(self, practice_id: str) -> Dict[str, Any]:
        """
        Create a practice-specific adaptation of the global model
        
        Args:
            practice_id: ID of the practice
            
        Returns:
            Information about the practice adaptation
        """
        # In a real implementation, this would:
        # 1. Get the base global model
        # 2. Load practice-specific correction patterns
        # 3. Adapt weights/parameters based on practice patterns
        # 4. Save the adapted model
        
        # Mock implementation for demonstration
        patterns = await self.get_practice_correction_patterns(practice_id)
        
        adaptation = {
            "practice_id": practice_id,
            "adaptation_id": str(uuid.uuid4()),
            "base_model_version": "1.2.0",
            "adaptation_version": "1.0",
            "patterns_used": len(patterns["top_correction_patterns"]),
            "total_corrections_used": patterns["total_corrections"],
            "adaptation_strength": 0.75,  # How strongly the practice patterns influence the model
            "created_at": datetime.now().isoformat(),
            "status": "active"
        }
        
        # Save practice adaptation to file
        filename = os.path.join(self.practice_models_path, f"practice_{practice_id}_adaptation.json")
        with open(filename, 'w') as f:
            json.dump(adaptation, f, indent=2)
        
        return adaptation
    
    async def get_practice_adaptation(self, practice_id: str) -> Optional[Dict[str, Any]]:
        """
        Get the current adaptation for a specific practice
        
        Args:
            practice_id: ID of the practice
            
        Returns:
            Current practice adaptation or None if no adaptation exists
        """
        # Check if there's a saved adaptation file
        filename = os.path.join(self.practice_models_path, f"practice_{practice_id}_adaptation.json")
        if os.path.exists(filename):
            with open(filename, 'r') as f:
                try:
                    return json.load(f)
                except json.JSONDecodeError:
                    logger.error(f"Error reading practice adaptation file: {filename}")
        
        # No adaptation found
        return None
    
    async def update_practice_adaptation(self, practice_id: str) -> Dict[str, Any]:
        """
        Update an existing practice adaptation with new correction patterns
        
        Args:
            practice_id: ID of the practice
            
        Returns:
            Updated practice adaptation
        """
        # Get current adaptation
        current = await self.get_practice_adaptation(practice_id)
        
        # Get new correction patterns
        patterns = await self.get_practice_correction_patterns(practice_id)
        
        if current:
            # Update existing adaptation
            current["patterns_used"] = len(patterns["top_correction_patterns"])
            current["total_corrections_used"] = patterns["total_corrections"]
            current["updated_at"] = datetime.now().isoformat()
            
            # In a real implementation, we would also:
            # 1. Load the adaptation model
            # 2. Apply new corrections to refine the model
            # 3. Save the updated model
            
            # Save updated adaptation
            filename = os.path.join(self.practice_models_path, f"practice_{practice_id}_adaptation.json")
            with open(filename, 'w') as f:
                json.dump(current, f, indent=2)
            
            return current
        else:
            # No existing adaptation, create a new one
            return await self.create_practice_adaptation(practice_id)
    
    async def get_adaptation_impact(self, practice_id: str) -> Dict[str, Any]:
        """
        Get metrics showing the impact of practice-specific adaptation
        
        Args:
            practice_id: ID of the practice
            
        Returns:
            Metrics comparing global model vs practice-adapted model
        """
        # In a real implementation, this would compute actual metrics
        # Mock implementation for demonstration
        adaptation = await self.get_practice_adaptation(practice_id)
        if not adaptation:
            return {
                "practice_id": practice_id,
                "status": "no_adaptation",
                "message": "No practice adaptation exists"
            }
        
        # Generate mock comparison metrics
        return {
            "practice_id": practice_id,
            "status": "active",
            "global_model": {
                "version": adaptation["base_model_version"],
                "accuracy": 0.92,
                "precision": 0.91,
                "recall": 0.90,
                "f1_score": 0.905
            },
            "practice_adapted": {
                "version": f"{adaptation['base_model_version']}-p{adaptation['adaptation_version']}",
                "accuracy": 0.94,
                "precision": 0.93,
                "recall": 0.92,
                "f1_score": 0.925
            },
            "improvement": {
                "accuracy": "+2.2%",
                "precision": "+2.2%",
                "recall": "+2.2%",
                "f1_score": "+2.2%"
            },
            "top_improved_areas": [
                {"area": "caries_detection", "improvement": "+3.5%"},
                {"area": "periodontal_assessment", "improvement": "+2.8%"},
                {"area": "periapical_lesions", "improvement": "+2.0%"}
            ],
            "metrics_date": datetime.now().isoformat()
        }
    
    async def get_all_practices_metrics(self, limit: int = 20) -> List[Dict[str, Any]]:
        """
        Get adaptation metrics for all practices
        
        Args:
            limit: Maximum number of practices to return
            
        Returns:
            List of practice adaptation metrics
        """
        # In a real implementation, this would query the database for all practices
        
        # Mock implementation for demonstration
        return [
            {
                "practice_id": f"practice-{i}",
                "practice_name": f"Dental Clinic {i}",
                "adaptation_status": "active" if i % 5 != 0 else "none",
                "correction_rate": 25 + (i % 10),
                "adaptation_impact": "+2.5%" if i % 5 != 0 else "n/a",
                "last_updated": (datetime.now() - timedelta(days=i % 30)).isoformat() if i % 5 != 0 else None
            }
            for i in range(1, limit + 1)
        ]
    
    async def reset_practice_adaptation(self, practice_id: str) -> Dict[str, Any]:
        """
        Reset a practice adaptation to use the global model
        
        Args:
            practice_id: ID of the practice
            
        Returns:
            Status of the operation
        """
        # Check if there's a saved adaptation file
        filename = os.path.join(self.practice_models_path, f"practice_{practice_id}_adaptation.json")
        
        if os.path.exists(filename):
            # Rename to keep as backup
            backup_filename = os.path.join(self.practice_models_path, f"practice_{practice_id}_adaptation_backup_{int(datetime.now().timestamp())}.json")
            os.rename(filename, backup_filename)
            
            return {
                "practice_id": practice_id,
                "status": "reset",
                "message": "Practice now using global model",
                "backup_created": True,
                "backup_path": backup_filename,
                "timestamp": datetime.now().isoformat()
            }
        else:
            return {
                "practice_id": practice_id,
                "status": "no_change",
                "message": "No adaptation found to reset",
                "timestamp": datetime.now().isoformat()
            } 