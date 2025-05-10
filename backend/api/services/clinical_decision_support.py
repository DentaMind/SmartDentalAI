from typing import Dict, List, Any, Optional
import os
import json
import logging
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func, desc

from ..models.diagnostic_feedback import DiagnosticFinding

logger = logging.getLogger(__name__)

class ClinicalDecisionSupportService:
    """
    Service providing clinical decision support based on diagnostic findings
    
    This service:
    1. Generates treatment recommendations based on accepted diagnoses
    2. Provides clinical references and evidence-based guidelines
    3. Calculates treatment priority scores
    4. Identifies related conditions to monitor
    5. Provides procedural guidance for recommended treatments
    """
    
    def __init__(self, db: Optional[Session] = None):
        """Initialize the clinical decision support service"""
        self.db = db
        self.guidelines_path = os.path.join("data", "knowledge", "clinical_guidelines")
        self.references_path = os.path.join("data", "knowledge", "references")
        self._ensure_directories()
        self._load_guidelines()
        
    def _ensure_directories(self):
        """Ensure necessary directories exist"""
        os.makedirs(self.guidelines_path, exist_ok=True)
        os.makedirs(self.references_path, exist_ok=True)
    
    def _load_guidelines(self):
        """Load clinical guidelines from files"""
        self.guidelines = {}
        
        # In a real implementation, this would load guidelines from files or a database
        # For now, use hardcoded guidelines for common diagnoses
        self.guidelines = {
            "dental_caries": {
                "name": "Dental Caries",
                "treatments": [
                    {
                        "name": "Fluoride Treatment",
                        "description": "Professional fluoride application to strengthen enamel and prevent progression",
                        "priority": "medium",
                        "conditions": {"severity": ["mild"]}
                    },
                    {
                        "name": "Dental Filling",
                        "description": "Removal of decay and restoration with composite or amalgam filling",
                        "priority": "high",
                        "conditions": {"severity": ["moderate"]}
                    },
                    {
                        "name": "Root Canal Treatment",
                        "description": "Endodontic treatment to remove infected pulp and seal the canal",
                        "priority": "urgent",
                        "conditions": {"severity": ["severe"]}
                    }
                ],
                "references": [
                    {
                        "title": "Management of Dental Caries",
                        "source": "Journal of the American Dental Association",
                        "year": 2023,
                        "url": "https://example.com/caries-management"
                    }
                ]
            },
            "periapical_abscess": {
                "name": "Periapical Abscess",
                "treatments": [
                    {
                        "name": "Antibiotic Therapy",
                        "description": "Prescription of antibiotics to control infection",
                        "priority": "high",
                        "conditions": {}
                    },
                    {
                        "name": "Root Canal Treatment",
                        "description": "Endodontic treatment to remove infected pulp and seal the canal",
                        "priority": "urgent",
                        "conditions": {}
                    },
                    {
                        "name": "Extraction",
                        "description": "Removal of tooth if deemed non-restorable",
                        "priority": "medium",
                        "conditions": {"non_restorable": True}
                    }
                ],
                "references": [
                    {
                        "title": "Treatment of Periapical Lesions",
                        "source": "International Endodontic Journal",
                        "year": 2022,
                        "url": "https://example.com/periapical-treatment"
                    }
                ]
            },
            "gingivitis": {
                "name": "Gingivitis",
                "treatments": [
                    {
                        "name": "Professional Dental Cleaning",
                        "description": "Removal of plaque and calculus",
                        "priority": "high",
                        "conditions": {}
                    },
                    {
                        "name": "Oral Hygiene Instruction",
                        "description": "Education on proper brushing and flossing techniques",
                        "priority": "medium",
                        "conditions": {}
                    },
                    {
                        "name": "Antimicrobial Mouthwash",
                        "description": "Prescription of antimicrobial mouthwash to reduce inflammation",
                        "priority": "low",
                        "conditions": {"severity": ["moderate", "severe"]}
                    }
                ],
                "references": [
                    {
                        "title": "Clinical Guidelines for Treatment of Gingivitis",
                        "source": "Journal of Periodontology",
                        "year": 2021,
                        "url": "https://example.com/gingivitis-guidelines"
                    }
                ]
            }
        }
    
    async def get_treatment_recommendations(self, finding_id: str) -> Dict[str, Any]:
        """
        Get treatment recommendations for a diagnostic finding
        
        Args:
            finding_id: ID of the diagnostic finding
            
        Returns:
            Treatment recommendations with references
        """
        if not self.db:
            return self._mock_treatment_recommendation(finding_id)
        
        # Get the finding from database
        finding = self.db.query(DiagnosticFinding).filter(
            DiagnosticFinding.id == finding_id
        ).first()
        
        if not finding:
            logger.error(f"Finding {finding_id} not found")
            return {"error": "Finding not found"}
        
        # Only provide recommendations for accepted or corrected findings
        if finding.status not in ["accepted", "corrected"]:
            return {
                "finding_id": finding_id,
                "status": "not_applicable",
                "message": f"No recommendations available for findings with status '{finding.status}'",
                "note": "Recommendations are only provided for accepted or corrected diagnoses"
            }
        
        # Match the diagnosis to our guidelines
        diagnosis_key = self._map_diagnosis_to_key(finding.diagnosis)
        if diagnosis_key not in self.guidelines:
            return {
                "finding_id": finding_id,
                "status": "no_guidelines",
                "diagnosis": finding.diagnosis,
                "message": "No specific guidelines available for this diagnosis",
                "general_recommendations": [
                    "Consider standard protocols for this condition",
                    "Refer to relevant specialist if uncertain"
                ]
            }
        
        # Get guidelines for this diagnosis
        guideline = self.guidelines[diagnosis_key]
        
        # Filter treatments based on conditions (like severity)
        applicable_treatments = []
        for treatment in guideline["treatments"]:
            if self._treatment_is_applicable(treatment, finding):
                applicable_treatments.append(treatment)
        
        # Prepare the response
        return {
            "finding_id": finding_id,
            "status": "recommendations_available",
            "diagnosis": finding.diagnosis,
            "tooth_number": finding.tooth_number,
            "treatments": applicable_treatments,
            "references": guideline["references"],
            "related_conditions": self._get_related_conditions(diagnosis_key),
            "notes": "Recommendations are based on clinical guidelines and should be verified by the provider"
        }
    
    def _treatment_is_applicable(self, treatment: Dict[str, Any], finding: Any) -> bool:
        """Check if a treatment is applicable based on conditions"""
        conditions = treatment.get("conditions", {})
        
        # If no conditions, treatment is always applicable
        if not conditions:
            return True
        
        # Check severity condition
        if "severity" in conditions and hasattr(finding, "severity"):
            if finding.severity not in conditions["severity"]:
                return False
        
        # Other condition checks can be added here
        
        return True
    
    def _map_diagnosis_to_key(self, diagnosis: str) -> str:
        """Map a diagnosis to a guideline key"""
        diagnosis_lower = diagnosis.lower()
        
        if "caries" in diagnosis_lower:
            return "dental_caries"
        elif "periapical" in diagnosis_lower and ("abscess" in diagnosis_lower or "lesion" in diagnosis_lower):
            return "periapical_abscess"
        elif "gingivitis" in diagnosis_lower:
            return "gingivitis"
        elif "periodontitis" in diagnosis_lower:
            return "periodontitis"
        else:
            return "unknown"
    
    def _get_related_conditions(self, diagnosis_key: str) -> List[Dict[str, Any]]:
        """Get related conditions to monitor"""
        # Map of related conditions
        related_conditions = {
            "dental_caries": [
                {"condition": "Pulpitis", "relationship": "Progression of untreated caries"},
                {"condition": "Periapical Abscess", "relationship": "End-stage complication"}
            ],
            "periapical_abscess": [
                {"condition": "Facial Cellulitis", "relationship": "Potential spread of infection"},
                {"condition": "Osteomyelitis", "relationship": "Severe complication"}
            ],
            "gingivitis": [
                {"condition": "Periodontitis", "relationship": "Progression of untreated gingivitis"},
                {"condition": "Gingival Recession", "relationship": "Common comorbidity"}
            ]
        }
        
        return related_conditions.get(diagnosis_key, [])
    
    def _mock_treatment_recommendation(self, finding_id: str) -> Dict[str, Any]:
        """Generate mock treatment recommendations for demonstration"""
        # For demo purposes, return a recommendation for a caries finding
        return {
            "finding_id": finding_id,
            "status": "recommendations_available",
            "diagnosis": "Moderate Dental Caries",
            "tooth_number": 19,
            "treatments": [
                {
                    "name": "Dental Filling",
                    "description": "Removal of decay and restoration with composite or amalgam filling",
                    "priority": "high",
                    "procedure_steps": [
                        "Administer local anesthesia",
                        "Remove decayed material with high-speed handpiece",
                        "Prepare cavity according to material requirements",
                        "Apply bonding agent if using composite",
                        "Place filling material and cure/set",
                        "Check and adjust occlusion"
                    ],
                    "estimated_time": "30-45 minutes",
                    "followup": "Evaluation in 6 months"
                }
            ],
            "references": [
                {
                    "title": "Management of Dental Caries",
                    "source": "Journal of the American Dental Association",
                    "year": 2023,
                    "url": "https://example.com/caries-management"
                }
            ],
            "related_conditions": [
                {"condition": "Pulpitis", "relationship": "Progression of untreated caries"},
                {"condition": "Periapical Abscess", "relationship": "End-stage complication"}
            ],
            "notes": "Recommendations are based on clinical guidelines and should be verified by the provider"
        }
    
    async def get_patient_treatment_plan(self, patient_id: str) -> Dict[str, Any]:
        """
        Generate a comprehensive treatment plan for a patient based on all findings
        
        Args:
            patient_id: ID of the patient
            
        Returns:
            Comprehensive treatment plan with priorities
        """
        if not self.db:
            return self._mock_patient_treatment_plan(patient_id)
        
        # Get all accepted/corrected findings for this patient
        findings = self.db.query(DiagnosticFinding).filter(
            DiagnosticFinding.patient_id == patient_id,
            DiagnosticFinding.status.in_(["accepted", "corrected"])
        ).order_by(DiagnosticFinding.created_at.desc()).all()
        
        if not findings:
            return {
                "patient_id": patient_id,
                "status": "no_findings",
                "message": "No accepted diagnoses found for this patient"
            }
        
        # Process each finding to get treatment recommendations
        treatment_items = []
        for finding in findings:
            # Get recommendations for this finding
            recommendations = await self.get_treatment_recommendations(str(finding.id))
            
            # Skip if no recommendations
            if recommendations.get("status") not in ["recommendations_available"]:
                continue
            
            # Add treatments to the list
            for treatment in recommendations.get("treatments", []):
                treatment_items.append({
                    "finding_id": str(finding.id),
                    "diagnosis": finding.diagnosis,
                    "tooth_number": finding.tooth_number,
                    "treatment": treatment["name"],
                    "description": treatment["description"],
                    "priority": treatment["priority"]
                })
        
        # Sort treatment items by priority
        priority_order = {"urgent": 0, "high": 1, "medium": 2, "low": 3}
        treatment_items.sort(key=lambda x: priority_order.get(x["priority"], 999))
        
        # Group treatments by priority
        grouped_treatments = {
            "urgent": [],
            "high": [],
            "medium": [],
            "low": []
        }
        
        for item in treatment_items:
            priority = item["priority"]
            if priority in grouped_treatments:
                grouped_treatments[priority].append(item)
        
        # Prepare the response
        return {
            "patient_id": patient_id,
            "status": "plan_available",
            "treatment_count": len(treatment_items),
            "treatment_plan": {
                "urgent_treatments": grouped_treatments["urgent"],
                "high_priority_treatments": grouped_treatments["high"],
                "medium_priority_treatments": grouped_treatments["medium"],
                "low_priority_treatments": grouped_treatments["low"]
            },
            "estimated_visits": self._estimate_visits(treatment_items),
            "notes": "Treatment plan is generated based on current diagnoses and should be reviewed by the provider"
        }
    
    def _estimate_visits(self, treatment_items: List[Dict[str, Any]]) -> int:
        """Estimate the number of visits required for a treatment plan"""
        # Very basic estimation - in a real system this would be more sophisticated
        urgent_count = sum(1 for item in treatment_items if item["priority"] == "urgent")
        high_count = sum(1 for item in treatment_items if item["priority"] == "high")
        medium_count = sum(1 for item in treatment_items if item["priority"] == "medium")
        
        # Roughly calculate visits (assuming 2 high-priority or 3 medium-priority treatments per visit)
        visits = urgent_count + (high_count // 2) + (high_count % 2)
        if medium_count > 0:
            visits += (medium_count // 3) + (1 if medium_count % 3 > 0 else 0)
        
        return max(1, visits)  # At least 1 visit
    
    def _mock_patient_treatment_plan(self, patient_id: str) -> Dict[str, Any]:
        """Generate mock patient treatment plan for demonstration"""
        return {
            "patient_id": patient_id,
            "status": "plan_available",
            "treatment_count": 5,
            "treatment_plan": {
                "urgent_treatments": [
                    {
                        "finding_id": "finding-001",
                        "diagnosis": "Periapical Abscess",
                        "tooth_number": 19,
                        "treatment": "Root Canal Treatment",
                        "description": "Endodontic treatment to remove infected pulp and seal the canal",
                        "priority": "urgent"
                    }
                ],
                "high_priority_treatments": [
                    {
                        "finding_id": "finding-002",
                        "diagnosis": "Moderate Dental Caries",
                        "tooth_number": 14,
                        "treatment": "Dental Filling",
                        "description": "Removal of decay and restoration with composite or amalgam filling",
                        "priority": "high"
                    },
                    {
                        "finding_id": "finding-003",
                        "diagnosis": "Moderate Gingivitis",
                        "tooth_number": None,
                        "treatment": "Professional Dental Cleaning",
                        "description": "Removal of plaque and calculus",
                        "priority": "high"
                    }
                ],
                "medium_priority_treatments": [
                    {
                        "finding_id": "finding-004",
                        "diagnosis": "Mild Dental Caries",
                        "tooth_number": 2,
                        "treatment": "Fluoride Treatment",
                        "description": "Professional fluoride application to strengthen enamel",
                        "priority": "medium"
                    }
                ],
                "low_priority_treatments": [
                    {
                        "finding_id": "finding-005",
                        "diagnosis": "Gingivitis",
                        "tooth_number": None,
                        "treatment": "Oral Hygiene Instruction",
                        "description": "Education on proper brushing and flossing techniques",
                        "priority": "low"
                    }
                ]
            },
            "estimated_visits": 3,
            "notes": "Treatment plan is generated based on current diagnoses and should be reviewed by the provider"
        }
    
    async def get_procedural_guidance(self, treatment_name: str) -> Dict[str, Any]:
        """
        Get detailed procedural guidance for a treatment
        
        Args:
            treatment_name: Name of the treatment
            
        Returns:
            Detailed procedural guidance
        """
        # Map of procedural guidance
        procedures = {
            "dental_filling": {
                "name": "Dental Filling",
                "equipment": [
                    "High-speed handpiece", "Low-speed handpiece", "Dental burs",
                    "Excavators", "Composite or amalgam material", "Bonding system",
                    "Curing light", "Articulating paper"
                ],
                "steps": [
                    {
                        "step": 1,
                        "description": "Administer local anesthesia",
                        "details": "Use appropriate anesthetic based on procedure length and patient history"
                    },
                    {
                        "step": 2,
                        "description": "Isolate the tooth with dental dam",
                        "details": "Ensures dry field and prevents contamination"
                    },
                    {
                        "step": 3,
                        "description": "Remove decayed material",
                        "details": "Use high-speed handpiece with appropriate bur size"
                    },
                    {
                        "step": 4,
                        "description": "Prepare cavity according to material requirements",
                        "details": "Follow material-specific preparation guidelines"
                    },
                    {
                        "step": 5,
                        "description": "Apply bonding agent if using composite",
                        "details": "Follow manufacturer's instructions for the specific bonding system"
                    },
                    {
                        "step": 6,
                        "description": "Place filling material and cure/set",
                        "details": "Apply in incremental layers if using composite"
                    },
                    {
                        "step": 7,
                        "description": "Check and adjust occlusion",
                        "details": "Use articulating paper to identify high spots"
                    },
                    {
                        "step": 8,
                        "description": "Polish the restoration",
                        "details": "Use appropriate polishing system for the material used"
                    }
                ],
                "estimated_time": "30-45 minutes",
                "references": [
                    {
                        "title": "Clinical Technique for Dental Fillings",
                        "source": "Journal of Operative Dentistry",
                        "year": 2022,
                        "url": "https://example.com/filling-technique"
                    }
                ]
            },
            "root_canal_treatment": {
                "name": "Root Canal Treatment",
                "equipment": [
                    "Endodontic files", "Apex locator", "Irrigation system",
                    "Obturation materials", "Endodontic motor", "Digital radiography"
                ],
                "steps": [
                    {
                        "step": 1,
                        "description": "Administer local anesthesia",
                        "details": "Use appropriate anesthetic based on procedure length and patient history"
                    },
                    {
                        "step": 2,
                        "description": "Isolate the tooth with dental dam",
                        "details": "Essential for preventing contamination in endodontic procedures"
                    },
                    {
                        "step": 3,
                        "description": "Create access cavity",
                        "details": "Use high-speed handpiece to create appropriate access to root canal system"
                    },
                    {
                        "step": 4,
                        "description": "Locate canal orifices",
                        "details": "Use magnification if necessary to locate all canals"
                    },
                    {
                        "step": 5,
                        "description": "Determine working length",
                        "details": "Use apex locator and confirm with radiograph"
                    },
                    {
                        "step": 6,
                        "description": "Clean and shape canals",
                        "details": "Use appropriate file sequence with irrigation between files"
                    },
                    {
                        "step": 7,
                        "description": "Final irrigation protocol",
                        "details": "Use recommended irrigation sequence and activation"
                    },
                    {
                        "step": 8,
                        "description": "Dry canals",
                        "details": "Use paper points to ensure canals are completely dry"
                    },
                    {
                        "step": 9,
                        "description": "Obturate canals",
                        "details": "Use appropriate obturation technique and materials"
                    },
                    {
                        "step": 10,
                        "description": "Place temporary or permanent restoration",
                        "details": "Ensure proper coronal seal"
                    }
                ],
                "estimated_time": "60-90 minutes",
                "references": [
                    {
                        "title": "Modern Endodontic Procedures",
                        "source": "Journal of Endodontics",
                        "year": 2023,
                        "url": "https://example.com/endodontic-procedures"
                    }
                ]
            }
        }
        
        # Normalize treatment name for lookup
        treatment_key = treatment_name.lower().replace(" ", "_")
        
        if treatment_key in procedures:
            return {
                "status": "guidance_available",
                "treatment": treatment_name,
                **procedures[treatment_key]
            }
        else:
            return {
                "status": "no_guidance",
                "treatment": treatment_name,
                "message": "No specific procedural guidance available for this treatment"
            } 