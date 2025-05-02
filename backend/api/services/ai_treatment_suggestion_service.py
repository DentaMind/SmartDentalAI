"""
AI Treatment Suggestion Service

This service generates treatment recommendations based on diagnostic findings
from imaging and other patient data sources.
"""

import logging
import json
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime
import uuid

from sqlalchemy.orm import Session

from ..repositories.ai_treatment_suggestion_repository import AITreatmentSuggestionRepository
from ..models.ai_treatment_suggestion import (
    AITreatmentSuggestion,
    TreatmentSuggestionGroup,
    SuggestionStatus,
    ConfidenceLevel,
    AISuggestionSource,
    AITreatmentSuggestionCreate,
    TreatmentSuggestionGroupCreate
)
from ..models.treatment_plan import PriorityLevel
from ..models.image_diagnosis import ImageDiagnosis

# Configure logging
logger = logging.getLogger(__name__)

class AITreatmentSuggestionService:
    """
    Service for generating treatment suggestions based on AI diagnostics
    """
    
    def __init__(self, db: Session):
        self.db = db
        self.repository = AITreatmentSuggestionRepository(db)
        
        # Treatment recommendation knowledge base
        # Maps finding types to potential treatments
        self.treatment_kb = {
            "caries": [
                {
                    "name": "Composite Restoration",
                    "code": "D2391",
                    "description": "Resin-based composite - one surface, posterior",
                    "priority": PriorityLevel.MEDIUM,
                    "confidence_modifier": 1.0,
                    "conditions": {
                        "severity": ["low", "medium"],
                        "surface_count": 1
                    },
                    "clinical_benefits": "Preserves tooth structure with aesthetic results",
                    "potential_complications": "Polymerization shrinkage, recurrent caries"
                },
                {
                    "name": "Amalgam Restoration",
                    "code": "D2140",
                    "description": "Amalgam - one surface, posterior",
                    "priority": PriorityLevel.MEDIUM,
                    "confidence_modifier": 0.9,
                    "conditions": {
                        "severity": ["low", "medium"],
                        "surface_count": 1
                    },
                    "clinical_benefits": "Durable, less technique-sensitive",
                    "potential_complications": "Mercury concerns, crack propagation"
                },
                {
                    "name": "Crown",
                    "code": "D2740",
                    "description": "Crown - porcelain/ceramic",
                    "priority": PriorityLevel.MEDIUM,
                    "confidence_modifier": 0.9,
                    "conditions": {
                        "severity": ["high", "critical"],
                        "surface_count": {"min": 3}
                    },
                    "clinical_benefits": "Full coverage protection for weakened tooth",
                    "potential_complications": "Requires significant tooth reduction"
                },
                {
                    "name": "Root Canal Therapy",
                    "code": "D3310",
                    "description": "Endodontic therapy, anterior tooth",
                    "priority": PriorityLevel.HIGH,
                    "confidence_modifier": 0.8,
                    "conditions": {
                        "severity": ["high", "critical"],
                        "pulp_involvement": True
                    },
                    "clinical_benefits": "Eliminates infection and preserves tooth",
                    "potential_complications": "Crown requirement, potential fracture"
                }
            ],
            "periapical_lesion": [
                {
                    "name": "Root Canal Therapy",
                    "code": "D3310",
                    "description": "Endodontic therapy, anterior tooth",
                    "priority": PriorityLevel.HIGH,
                    "confidence_modifier": 1.0,
                    "conditions": {
                        "tooth_type": "anterior"
                    },
                    "clinical_benefits": "Eliminates infection and preserves tooth",
                    "potential_complications": "Crown requirement, potential fracture"
                },
                {
                    "name": "Root Canal Therapy",
                    "code": "D3320",
                    "description": "Endodontic therapy, premolar tooth",
                    "priority": PriorityLevel.HIGH,
                    "confidence_modifier": 1.0,
                    "conditions": {
                        "tooth_type": "premolar"
                    },
                    "clinical_benefits": "Eliminates infection and preserves tooth",
                    "potential_complications": "Crown requirement, potential fracture"
                },
                {
                    "name": "Root Canal Therapy",
                    "code": "D3330",
                    "description": "Endodontic therapy, molar tooth",
                    "priority": PriorityLevel.HIGH,
                    "confidence_modifier": 0.95,
                    "conditions": {
                        "tooth_type": "molar"
                    },
                    "clinical_benefits": "Eliminates infection and preserves tooth",
                    "potential_complications": "Complex anatomy, potential missed canals"
                },
                {
                    "name": "Extraction",
                    "code": "D7140",
                    "description": "Extraction, erupted tooth or exposed root",
                    "priority": PriorityLevel.MEDIUM,
                    "confidence_modifier": 0.7,
                    "conditions": {
                        "restorability": False
                    },
                    "clinical_benefits": "Eliminates infection source",
                    "potential_complications": "Bone loss, adjacent tooth drift"
                }
            ],
            "impacted_tooth": [
                {
                    "name": "Surgical Extraction",
                    "code": "D7240",
                    "description": "Removal of impacted tooth - completely bony",
                    "priority": PriorityLevel.MEDIUM,
                    "confidence_modifier": 0.9,
                    "conditions": {
                        "position": "complete_bony"
                    },
                    "clinical_benefits": "Prevents pathology, infection, crowding",
                    "potential_complications": "Nerve damage, dry socket, infection"
                },
                {
                    "name": "Surgical Extraction",
                    "code": "D7230",
                    "description": "Removal of impacted tooth - partially bony",
                    "priority": PriorityLevel.MEDIUM,
                    "confidence_modifier": 0.9,
                    "conditions": {
                        "position": "partial_bony"
                    },
                    "clinical_benefits": "Prevents pathology, infection, crowding",
                    "potential_complications": "Nerve damage, dry socket, infection"
                },
                {
                    "name": "Orthodontic Exposure",
                    "code": "D7280",
                    "description": "Exposure of an unerupted tooth",
                    "priority": PriorityLevel.LOW,
                    "confidence_modifier": 0.6,
                    "conditions": {
                        "position": "favorable",
                        "orthodontic_treatment": True
                    },
                    "clinical_benefits": "Allows for orthodontic alignment",
                    "potential_complications": "Ankylosis, failed eruption"
                }
            ],
            "restoration": [
                {
                    "name": "Crown",
                    "code": "D2740",
                    "description": "Crown - porcelain/ceramic",
                    "priority": PriorityLevel.LOW,
                    "confidence_modifier": 0.7,
                    "conditions": {
                        "condition": "defective",
                        "size": "large"
                    },
                    "clinical_benefits": "Long term restoration with full coverage",
                    "potential_complications": "Requires significant tooth reduction"
                },
                {
                    "name": "Replace Restoration",
                    "code": "D2391",
                    "description": "Resin-based composite - one surface, posterior",
                    "priority": PriorityLevel.LOW,
                    "confidence_modifier": 0.8,
                    "conditions": {
                        "condition": "defective",
                        "size": "small"
                    },
                    "clinical_benefits": "Eliminates recurrent decay, restores function",
                    "potential_complications": "Secondary decay, short lifespan"
                }
            ],
            "fractured_tooth": [
                {
                    "name": "Crown",
                    "code": "D2740",
                    "description": "Crown - porcelain/ceramic",
                    "priority": PriorityLevel.HIGH,
                    "confidence_modifier": 0.9,
                    "conditions": {
                        "extent": ["moderate", "severe"]
                    },
                    "clinical_benefits": "Protects remaining tooth structure",
                    "potential_complications": "Pulp exposure, future root canal need"
                },
                {
                    "name": "Extraction",
                    "code": "D7140",
                    "description": "Extraction, erupted tooth or exposed root",
                    "priority": PriorityLevel.MEDIUM,
                    "confidence_modifier": 0.7,
                    "conditions": {
                        "extent": "severe",
                        "restorability": False
                    },
                    "clinical_benefits": "Eliminates pain source, prevents infection",
                    "potential_complications": "Bone loss, adjacent tooth drift"
                }
            ]
        }
    
    async def generate_suggestions_from_diagnosis(
        self,
        diagnosis_id: str,
        generate_groups: bool = True
    ) -> Dict[str, Any]:
        """
        Generate treatment suggestions from an image diagnosis
        
        Args:
            diagnosis_id: ID of the diagnosis
            generate_groups: Whether to group suggestions by condition
            
        Returns:
            Dict containing generated suggestions and groups
        """
        # Get the diagnosis
        diagnosis = self.db.query(ImageDiagnosis).filter(ImageDiagnosis.id == diagnosis_id).first()
        if not diagnosis:
            logger.error(f"Diagnosis not found: {diagnosis_id}")
            return {"error": "Diagnosis not found", "suggestions": [], "groups": []}
        
        patient_id = diagnosis.patient_id
        
        # Process findings and generate suggestions
        suggestions = []
        grouped_suggestions = {}  # Group by condition category
        
        if not diagnosis.findings:
            logger.warning(f"No findings in diagnosis: {diagnosis_id}")
            return {"suggestions": [], "groups": []}
        
        # Extract findings from the diagnosis
        findings = []
        if isinstance(diagnosis.findings, dict) and "findings" in diagnosis.findings:
            findings = diagnosis.findings["findings"]
        elif isinstance(diagnosis.findings, list):
            findings = diagnosis.findings
        
        for finding in findings:
            # Generate suggestions for this finding
            finding_suggestions = await self._generate_suggestions_for_finding(
                diagnosis, finding, patient_id
            )
            
            # Process each suggestion
            for suggestion_data in finding_suggestions:
                # Create the suggestion
                suggestion = await self._create_suggestion(suggestion_data)
                suggestions.append(suggestion)
                
                # Group by condition category
                condition = suggestion_data.get("condition_category", "General")
                if condition not in grouped_suggestions:
                    grouped_suggestions[condition] = []
                
                grouped_suggestions[condition].append(str(suggestion.id))
        
        # Create suggestion groups if requested
        groups = []
        if generate_groups and grouped_suggestions:
            for category, suggestion_ids in grouped_suggestions.items():
                group_data = TreatmentSuggestionGroupCreate(
                    patient_id=patient_id,
                    title=f"{category} Treatment Plan",
                    description=f"AI-generated treatment suggestions for {category.lower()}",
                    condition_category=category,
                    priority=self._get_group_priority(suggestion_ids),
                    suggestions=suggestion_ids
                )
                group = self.repository.create_suggestion_group(group_data.dict())
                groups.append(group)
        
        return {
            "suggestions": suggestions,
            "groups": groups
        }
    
    async def _generate_suggestions_for_finding(
        self,
        diagnosis: ImageDiagnosis,
        finding: Dict[str, Any],
        patient_id: str
    ) -> List[Dict[str, Any]]:
        """
        Generate treatment suggestions for a specific finding
        
        Args:
            diagnosis: The diagnosis object
            finding: The finding data
            patient_id: Patient ID
            
        Returns:
            List of suggestion data dictionaries
        """
        suggestions = []
        finding_type = finding.get("type", "").lower()
        
        # Skip if no finding type or not in knowledge base
        if not finding_type or finding_type not in self.treatment_kb:
            return suggestions
        
        # Get the finding ID
        finding_id = finding.get("id", str(uuid.uuid4()))
        
        # Process potential treatments for this finding type
        for treatment in self.treatment_kb[finding_type]:
            # Check if conditions match
            if not self._conditions_match(treatment, finding):
                continue
            
            # Calculate confidence
            base_confidence = finding.get("confidence", 0.7)
            confidence = base_confidence * treatment.get("confidence_modifier", 1.0)
            
            # Determine confidence level
            confidence_level = ConfidenceLevel.MEDIUM
            if confidence >= 0.9:
                confidence_level = ConfidenceLevel.VERY_HIGH
            elif confidence >= 0.75:
                confidence_level = ConfidenceLevel.HIGH
            elif confidence < 0.5:
                confidence_level = ConfidenceLevel.LOW
            
            # Get tooth information
            tooth_number = finding.get("tooth", finding.get("tooth_number"))
            surface = finding.get("surface")
            
            # Create a suggestion object
            suggestion_data = {
                "patient_id": patient_id,
                "diagnosis_id": str(diagnosis.id),
                "finding_id": finding_id,
                "procedure_code": treatment.get("code"),
                "procedure_name": treatment.get("name"),
                "procedure_description": treatment.get("description"),
                "tooth_number": tooth_number,
                "surface": surface,
                "confidence": confidence,
                "confidence_level": confidence_level,
                "reasoning": self._generate_reasoning(finding, treatment),
                "alternatives": self._get_alternative_treatments(finding_type, treatment["name"]),
                "source": AISuggestionSource.XRAY,
                "model_version": "1.0",  # Replace with actual model version
                "priority": treatment.get("priority", PriorityLevel.MEDIUM),
                "clinical_benefits": treatment.get("clinical_benefits"),
                "potential_complications": treatment.get("potential_complications"),
                "condition_category": self._get_condition_category(finding_type)
            }
            
            suggestions.append(suggestion_data)
        
        return suggestions
    
    def _conditions_match(self, treatment: Dict[str, Any], finding: Dict[str, Any]) -> bool:
        """
        Check if finding conditions match treatment criteria
        
        Args:
            treatment: Treatment data
            finding: Finding data
            
        Returns:
            bool: True if conditions match
        """
        # If no conditions specified, always match
        if "conditions" not in treatment:
            return True
        
        conditions = treatment["conditions"]
        
        # Check each condition
        for key, value in conditions.items():
            if key not in finding:
                continue
                
            finding_value = finding[key]
            
            # List conditions (OR logic)
            if isinstance(value, list):
                if finding_value not in value:
                    return False
            
            # Range conditions
            elif isinstance(value, dict) and "min" in value:
                if finding_value < value["min"]:
                    return False
            
            # Boolean conditions
            elif isinstance(value, bool):
                if finding_value != value:
                    return False
            
            # Simple equality
            elif finding_value != value:
                return False
        
        return True
    
    def _generate_reasoning(self, finding: Dict[str, Any], treatment: Dict[str, Any]) -> str:
        """
        Generate reasoning for why this treatment is suggested
        
        Args:
            finding: Finding data
            treatment: Treatment data
            
        Returns:
            str: Reasoning text
        """
        finding_type = finding.get("type", "").lower()
        severity = finding.get("severity", "moderate").lower()
        tooth = finding.get("tooth", finding.get("tooth_number", "this tooth"))
        
        if finding_type == "caries":
            if severity in ["high", "critical"]:
                return f"Based on the high severity caries detected on tooth {tooth}, a {treatment['name']} is recommended to prevent further decay and potential pulp involvement."
            else:
                return f"The {severity} caries on tooth {tooth} requires treatment with {treatment['name']} to remove the decay and restore function and aesthetics."
        
        elif finding_type == "periapical_lesion":
            return f"The periapical lesion on tooth {tooth} indicates pulp necrosis or infection. {treatment['name']} is recommended to eliminate the infection and preserve the tooth."
        
        elif finding_type == "impacted_tooth":
            return f"Tooth {tooth} is impacted and may cause pain, infection, or damage to adjacent teeth. {treatment['name']} is recommended to prevent these complications."
        
        elif finding_type == "fractured_tooth":
            return f"The fracture on tooth {tooth} has compromised its structural integrity. {treatment['name']} is recommended to protect the remaining tooth structure and restore function."
        
        # Generic reasoning
        return f"Based on the {finding_type} finding on tooth {tooth}, {treatment['name']} is recommended as an appropriate treatment."
    
    def _get_alternative_treatments(self, finding_type: str, primary_treatment: str) -> List[Dict[str, Any]]:
        """
        Get alternative treatments for a finding type
        
        Args:
            finding_type: Type of finding
            primary_treatment: The primary treatment being suggested
            
        Returns:
            List of alternative treatments
        """
        alternatives = []
        
        if finding_type not in self.treatment_kb:
            return alternatives
        
        # Get all treatments for this finding type except the primary one
        for treatment in self.treatment_kb[finding_type]:
            if treatment["name"] != primary_treatment:
                alternatives.append({
                    "name": treatment["name"],
                    "code": treatment.get("code"),
                    "description": treatment.get("description")
                })
        
        return alternatives
    
    def _get_condition_category(self, finding_type: str) -> str:
        """
        Map finding type to condition category
        
        Args:
            finding_type: Type of finding
            
        Returns:
            str: Condition category
        """
        categories = {
            "caries": "Restorative",
            "periapical_lesion": "Endodontic",
            "impacted_tooth": "Surgical",
            "fractured_tooth": "Restorative",
            "restoration": "Restorative"
        }
        
        return categories.get(finding_type, "General")
    
    def _get_group_priority(self, suggestion_ids: List[str]) -> PriorityLevel:
        """
        Determine the priority level for a group of suggestions
        
        Args:
            suggestion_ids: List of suggestion IDs
            
        Returns:
            PriorityLevel: The highest priority level in the group
        """
        priorities = []
        
        for suggestion_id in suggestion_ids:
            suggestion = self.repository.get_suggestion_by_id(suggestion_id)
            if suggestion:
                priorities.append(suggestion.priority)
        
        if PriorityLevel.URGENT in priorities:
            return PriorityLevel.URGENT
        elif PriorityLevel.HIGH in priorities:
            return PriorityLevel.HIGH
        elif PriorityLevel.MEDIUM in priorities:
            return PriorityLevel.MEDIUM
        else:
            return PriorityLevel.LOW
    
    async def _create_suggestion(self, suggestion_data: Dict[str, Any]) -> AITreatmentSuggestion:
        """
        Create a treatment suggestion in the database
        
        Args:
            suggestion_data: Dictionary of suggestion data
            
        Returns:
            AITreatmentSuggestion: Created suggestion object
        """
        # Create using repository
        suggestion = self.repository.create_suggestion(suggestion_data)
        return suggestion
    
    async def update_suggestion_status(
        self,
        suggestion_id: str,
        status: SuggestionStatus,
        clinician_id: str,
        notes: Optional[str] = None,
        modified_procedure: Optional[str] = None,
        rejection_reason: Optional[str] = None,
        clinical_override_reason: Optional[str] = None
    ) -> Optional[AITreatmentSuggestion]:
        """
        Update the status of a treatment suggestion
        
        Args:
            suggestion_id: Suggestion ID
            status: New status
            clinician_id: ID of clinician making the update
            notes: Optional clinical notes
            modified_procedure: Optional modified procedure name
            rejection_reason: Optional reason for rejection
            clinical_override_reason: Optional reason for clinical override
            
        Returns:
            Optional[AITreatmentSuggestion]: Updated suggestion or None
        """
        # Create update data
        update_data = {
            "status": status,
            "clinician_notes": notes
        }
        
        # Add specific fields based on status
        if status == SuggestionStatus.MODIFIED and modified_procedure:
            update_data["modified_procedure"] = modified_procedure
            update_data["clinical_override_reason"] = clinical_override_reason
        
        elif status == SuggestionStatus.REJECTED and rejection_reason:
            update_data["rejection_reason"] = rejection_reason
        
        # Update using repository
        return self.repository.update_suggestion(suggestion_id, update_data, clinician_id)
    
    async def convert_to_treatment_plan(
        self,
        suggestion_group_id: str,
        title: Optional[str] = None,
        description: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Convert a suggestion group to a formal treatment plan
        
        Args:
            suggestion_group_id: ID of the suggestion group
            title: Optional title for the treatment plan
            description: Optional description for the treatment plan
            
        Returns:
            Dict: Treatment plan data
        """
        from ..models.treatment_plan import TreatmentPlan, TreatmentProcedure
        
        # Get the suggestion group
        group = self.repository.get_suggestion_group_by_id(suggestion_group_id)
        if not group:
            return {"error": "Suggestion group not found"}
        
        # Get all suggestions in this group
        suggestion_ids = group.suggestions if group.suggestions else []
        suggestions = [
            self.repository.get_suggestion_by_id(suggestion_id)
            for suggestion_id in suggestion_ids
            if suggestion_id
        ]
        
        # Filter out None values
        suggestions = [s for s in suggestions if s]
        
        if not suggestions:
            return {"error": "No valid suggestions in group"}
        
        # Create a new treatment plan
        treatment_plan = TreatmentPlan(
            patient_id=group.patient_id,
            title=title or group.title,
            description=description or group.description,
            status="draft",
            priority=group.priority
        )
        
        self.db.add(treatment_plan)
        self.db.flush()  # Generate ID but don't commit yet
        
        # Create procedures for each accepted suggestion
        for suggestion in suggestions:
            # Skip rejected suggestions
            if suggestion.status == SuggestionStatus.REJECTED:
                continue
                
            procedure = TreatmentProcedure(
                treatment_plan_id=treatment_plan.id,
                tooth_number=suggestion.tooth_number,
                cdt_code=suggestion.procedure_code,
                procedure_name=suggestion.modified_procedure or suggestion.procedure_name,
                description=suggestion.procedure_description,
                status="recommended",
                priority=suggestion.priority,
                reasoning=suggestion.reasoning,
                ai_suggested=True,
                doctor_approved=suggestion.status == SuggestionStatus.ACCEPTED,
                doctor_reasoning=suggestion.clinician_notes,
                modified_by_doctor=suggestion.status == SuggestionStatus.MODIFIED
            )
            
            self.db.add(procedure)
        
        # Commit the transaction
        self.db.commit()
        self.db.refresh(treatment_plan)
        
        return {
            "treatment_plan": treatment_plan,
            "suggestion_group_id": str(group.id)
        }
    
    async def get_metrics(self) -> Dict[str, Any]:
        """
        Get metrics on AI treatment suggestions
        
        Returns:
            Dict: Metrics data
        """
        acceptance_metrics = self.repository.get_suggestion_acceptance_rate()
        
        # Add additional metrics here
        
        return {
            "acceptance_rate": acceptance_metrics["acceptance_rate"],
            "modification_rate": acceptance_metrics["modification_rate"],
            "rejection_rate": acceptance_metrics["rejection_rate"],
            "total_reviewed": acceptance_metrics["total_reviewed"]
        } 