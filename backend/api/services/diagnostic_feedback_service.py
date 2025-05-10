from typing import Dict, List, Any, Optional
from datetime import datetime
import uuid
import json
import os
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, not_

from ..models.diagnostic_feedback import (
    DiagnosticFinding,
    DiagnosticFeedback,
    FeedbackConversation,
    DiagnosisStatus,
    FeedbackType,
    UserRole
)

class DiagnosticFeedbackService:
    """
    Service for handling provider feedback on diagnostic findings and
    improving AI diagnostic accuracy through continuous learning.
    """
    
    def __init__(self, db: Optional[Session] = None):
        """Initialize the diagnostic feedback service"""
        self.db = db
        self.feedback_store_path = os.path.join("data", "feedback")
        self._ensure_feedback_directory()
    
    def _ensure_feedback_directory(self):
        """Ensure the feedback directory exists"""
        os.makedirs(self.feedback_store_path, exist_ok=True)
    
    async def get_patient_findings(self, patient_id: str) -> List[Dict[str, Any]]:
        """
        Get all diagnostic findings for a patient
        
        Args:
            patient_id: The patient's ID
            
        Returns:
            A list of the patient's diagnostic findings
        """
        if self.db:
            findings = self.db.query(DiagnosticFinding).filter(
                DiagnosticFinding.patient_id == patient_id
            ).order_by(DiagnosticFinding.created_at.desc()).all()
            return [finding.__dict__ for finding in findings]
        
        # For demo purposes, return mock data
        return [
            {
                "id": "finding-001",
                "patient_id": patient_id,
                "tooth_number": 14,
                "diagnosis": "Dental Caries",
                "confidence": 0.92,
                "ai_generated": True,
                "status": "pending",
                "area": "caries",
                "severity": "moderate",
                "created_at": datetime.now().isoformat(),
                "created_by": "AI Assistant"
            },
            {
                "id": "finding-002",
                "patient_id": patient_id,
                "tooth_number": 19,
                "diagnosis": "Periapical Abscess",
                "confidence": 0.78,
                "ai_generated": True,
                "status": "pending",
                "area": "periapical",
                "severity": "severe",
                "created_at": datetime.now().isoformat(),
                "created_by": "AI Assistant"
            },
            {
                "id": "finding-003",
                "patient_id": patient_id,
                "diagnosis": "Gingivitis - Moderate",
                "confidence": 0.85,
                "ai_generated": True,
                "status": "pending",
                "area": "periodontal",
                "severity": "moderate",
                "created_at": datetime.now().isoformat(),
                "created_by": "AI Assistant"
            }
        ]
    
    async def get_finding(self, finding_id: str) -> Optional[Dict[str, Any]]:
        """
        Get a specific diagnostic finding
        
        Args:
            finding_id: The finding's ID
            
        Returns:
            The diagnostic finding if found, None otherwise
        """
        if self.db:
            finding = self.db.query(DiagnosticFinding).filter(
                DiagnosticFinding.id == finding_id
            ).first()
            
            if finding:
                return finding.__dict__
            return None
        
        # For demo purposes, return mock data
        mock_findings = {
            "finding-001": {
                "id": "finding-001",
                "patient_id": "patient-123",
                "tooth_number": 14,
                "diagnosis": "Dental Caries",
                "confidence": 0.92,
                "ai_generated": True,
                "status": "pending",
                "area": "caries",
                "severity": "moderate",
                "created_at": datetime.now().isoformat(),
                "created_by": "AI Assistant"
            },
            "finding-002": {
                "id": "finding-002",
                "patient_id": "patient-123",
                "tooth_number": 19,
                "diagnosis": "Periapical Abscess",
                "confidence": 0.78,
                "ai_generated": True,
                "status": "pending",
                "area": "periapical",
                "severity": "severe", 
                "created_at": datetime.now().isoformat(),
                "created_by": "AI Assistant"
            },
            "finding-003": {
                "id": "finding-003",
                "patient_id": "patient-123",
                "diagnosis": "Gingivitis - Moderate",
                "confidence": 0.85,
                "ai_generated": True,
                "status": "pending",
                "area": "periodontal",
                "severity": "moderate",
                "created_at": datetime.now().isoformat(),
                "created_by": "AI Assistant"
            }
        }
        
        return mock_findings.get(finding_id)
    
    async def add_feedback(self, finding_id: str, feedback: Dict[str, Any]) -> Dict[str, Any]:
        """
        Add provider feedback to a diagnostic finding
        
        Args:
            finding_id: The finding's ID
            feedback: The feedback data
            
        Returns:
            The updated finding
        """
        # For the practice-specific database, immediately apply the provider's decision
        # But for global learning, set to pending owner review
        practice_status = feedback.get("status")
        global_status = "pending_owner_review" if practice_status == "rejected" else practice_status
        
        if self.db:
            finding = self.db.query(DiagnosticFinding).filter(
                DiagnosticFinding.id == finding_id
            ).first()
            
            if not finding:
                raise ValueError(f"Finding with ID {finding_id} not found")
            
            # Get practice info
            practice_id = feedback.get("practice_id")
            
            # Update the finding with feedback - immediate effect for the practice
            finding.status = practice_status
            finding.updated_by = feedback.get("provider_name")
            finding.updated_at = datetime.now()
            
            # Create a feedback record
            new_feedback = DiagnosticFeedback(
                finding_id=finding.id,
                feedback_type=FeedbackType.GENERAL if practice_status != "rejected" else FeedbackType.ERROR_REPORT,
                feedback_text=feedback.get("feedback", ""),
                provider_id=feedback.get("provider_id", "unknown"),
                provider_name=feedback.get("provider_name", "Unknown Provider"),
                provider_role=feedback.get("provider_role", UserRole.DENTIST),
                is_learning_case=practice_status in ["rejected", "corrected"],  # Mark rejections and corrections as learning cases
                global_status=global_status,  # Track status for global learning separately
                practice_id=practice_id
            )
            
            self.db.add(new_feedback)
            self.db.commit()
            self.db.refresh(finding)
            
            # Notify owners about significant feedback that needs review
            if practice_status in ["rejected", "corrected"]:
                await self._notify_owners_about_feedback(finding, new_feedback, feedback, "rejection" if practice_status == "rejected" else "feedback")
            
            result = finding.__dict__.copy()
            result["provider_feedback"] = feedback.get("feedback", "")  # For backward compatibility
            result["global_status"] = global_status  # Add global status to response
            return result
        
        # For demo purposes, generate a mock response
        mock_finding = await self.get_finding(finding_id)
        if not mock_finding:
            raise ValueError(f"Finding with ID {finding_id} not found")
        
        updated_finding = mock_finding.copy()
        updated_finding["status"] = practice_status  # Practice-specific status
        updated_finding["global_status"] = global_status  # Global learning status
        updated_finding["provider_feedback"] = feedback.get("feedback", "")
        updated_finding["updated_by"] = feedback.get("provider_name")
        updated_finding["updated_at"] = datetime.now().isoformat()
        
        # Save feedback for AI learning
        await self._save_feedback_for_learning(updated_finding, feedback)
        
        # Notify owners about rejection if applicable
        if practice_status in ["rejected", "corrected"]:
            await self._notify_owners_about_feedback(updated_finding, None, feedback, "rejection" if practice_status == "rejected" else "feedback")
        
        return updated_finding
    
    async def add_correction(self, finding_id: str, correction_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Add a correction to a diagnostic finding
        
        Args:
            finding_id: The finding's ID
            correction_data: The correction data
            
        Returns:
            The updated finding
        """
        # For the practice, immediately apply the correction
        # But for global learning, set to pending owner review
        if self.db:
            finding = self.db.query(DiagnosticFinding).filter(
                DiagnosticFinding.id == finding_id
            ).first()
            
            if not finding:
                raise ValueError(f"Finding with ID {finding_id} not found")
            
            # Get practice info
            practice_id = correction_data.get("practice_id")
            
            # Store original diagnosis for reference
            original_diagnosis = finding.diagnosis
            
            # Update the finding with the correction - immediate effect for practice
            finding.status = "corrected"
            finding.diagnosis = correction_data.get("correction")  # Apply correction immediately in practice
            finding.updated_by = correction_data.get("provider_name")
            finding.updated_at = datetime.now()
            
            # Create a feedback record with correction, marking the global status
            new_feedback = DiagnosticFeedback(
                finding_id=finding.id,
                feedback_type=FeedbackType.CORRECTION,
                feedback_text=f"Correction proposed: Original diagnosis '{original_diagnosis}' corrected to '{correction_data.get('correction')}'",
                correction=correction_data.get("correction"),
                provider_id=correction_data.get("provider_id", "unknown"),
                provider_name=correction_data.get("provider_name", "Unknown Provider"),
                provider_role=correction_data.get("provider_role", UserRole.DENTIST),
                is_learning_case=True,  # Always mark corrections as learning cases
                global_status="pending_owner_review",  # Needs owner review for global integration
                practice_id=practice_id,
                original_diagnosis=original_diagnosis  # Save the original diagnosis
            )
            
            self.db.add(new_feedback)
            self.db.commit()
            self.db.refresh(finding)
            
            # Notify owners about correction for global learning
            await self._notify_owners_about_feedback(finding, new_feedback, correction_data, "correction")
            
            result = finding.__dict__.copy()
            result["correction"] = correction_data.get("correction", "")  # For backward compatibility
            result["original_diagnosis"] = original_diagnosis  # Include original diagnosis
            result["global_status"] = "pending_owner_review"  # Add global status to response
            return result
        
        # For demo purposes, generate a mock response
        mock_finding = await self.get_finding(finding_id)
        if not mock_finding:
            raise ValueError(f"Finding with ID {finding_id} not found")
        
        # Store original diagnosis
        original_diagnosis = mock_finding["diagnosis"]
        
        updated_finding = mock_finding.copy()
        updated_finding["status"] = "corrected"  # Practice-specific status
        updated_finding["diagnosis"] = correction_data.get("correction")  # Update diagnosis for practice
        updated_finding["original_diagnosis"] = original_diagnosis  # Keep track of original
        updated_finding["global_status"] = "pending_owner_review"  # Global learning status
        updated_finding["correction"] = correction_data.get("correction")
        updated_finding["updated_by"] = correction_data.get("provider_name")
        updated_finding["updated_at"] = datetime.now().isoformat()
        
        # Save correction for AI learning
        await self._save_correction_for_learning(updated_finding, correction_data)
        
        # Notify owners about correction
        await self._notify_owners_about_feedback(updated_finding, None, correction_data, "correction")
        
        return updated_finding
    
    async def get_pending_owner_reviews(self, limit: int = 50, skip: int = 0) -> List[Dict[str, Any]]:
        """
        Get findings pending owner review for global integration
        
        This method is intended for the DentaMind admin/owner to review corrections and rejections
        that should be incorporated into the global AI model
        
        Args:
            limit: Maximum number of findings to return
            skip: Number of findings to skip
            
        Returns:
            List of findings pending owner review
        """
        if self.db:
            # Join with feedback to get items pending global review
            feedback_items = self.db.query(DiagnosticFeedback).filter(
                DiagnosticFeedback.global_status == "pending_owner_review"
            ).order_by(DiagnosticFeedback.created_at.desc()).offset(skip).limit(limit).all()
            
            result = []
            for feedback in feedback_items:
                # Get the associated finding
                finding = self.db.query(DiagnosticFinding).filter(
                    DiagnosticFinding.id == feedback.finding_id
                ).first()
                
                if finding:
                    finding_dict = finding.__dict__.copy()
                    
                    # Add feedback info
                    finding_dict["provider_feedback"] = feedback.feedback_text
                    finding_dict["correction"] = feedback.correction
                    finding_dict["original_diagnosis"] = feedback.original_diagnosis
                    finding_dict["feedback_type"] = feedback.feedback_type
                    finding_dict["provider_name"] = feedback.provider_name
                    finding_dict["provider_role"] = feedback.provider_role
                    finding_dict["practice_id"] = feedback.practice_id
                    finding_dict["global_status"] = feedback.global_status
                    
                    result.append(finding_dict)
            
            return result
        
        # For demo purposes, return mock data
        return [
            {
                "id": "finding-004",
                "patient_id": "patient-123",
                "tooth_number": 18,
                "diagnosis": "Incipient Caries",  # Already corrected in practice
                "original_diagnosis": "Dental Caries",
                "confidence": 0.88,
                "ai_generated": True,
                "status": "corrected",  # Local practice status
                "global_status": "pending_owner_review",  # Status for global learning
                "area": "caries",
                "severity": "mild",
                "created_at": (datetime.now().replace(hour=10)).isoformat(),
                "created_by": "AI Assistant",
                "updated_at": (datetime.now().replace(hour=11)).isoformat(),
                "updated_by": "Dr. Johnson",
                "correction": "Incipient Caries",
                "provider_feedback": "This appears to be an early stage lesion, not a full caries.",
                "provider_name": "Dr. Johnson",
                "provider_role": "dentist",
                "feedback_type": "correction",
                "practice_id": "practice-001"
            },
            {
                "id": "finding-005",
                "patient_id": "patient-456",
                "tooth_number": 30,
                "diagnosis": "Normal periapical tissues",  # Rejected in practice
                "original_diagnosis": "Periapical Abscess",
                "confidence": 0.72,
                "ai_generated": True,
                "status": "rejected",  # Local practice status
                "global_status": "pending_owner_review",  # Status for global learning
                "area": "periapical",
                "severity": "none",
                "created_at": (datetime.now().replace(hour=9)).isoformat(),
                "created_by": "AI Assistant",
                "updated_at": (datetime.now().replace(hour=10)).isoformat(),
                "updated_by": "Dr. Smith",
                "provider_feedback": "I don't see any evidence of an abscess in this image.",
                "provider_name": "Dr. Smith",
                "provider_role": "dentist",
                "feedback_type": "error_report",
                "practice_id": "practice-002"
            }
        ]
    
    async def owner_review_decision(
        self, finding_id: str, decision: str, owner_note: str = ""
    ) -> Dict[str, Any]:
        """
        Record an owner's decision on a pending review for global AI model integration
        
        Args:
            finding_id: The finding's ID
            decision: Either 'accept' (accept provider's feedback/correction for global learning), 
                    'reject' (reject provider's feedback/correction for global learning), 
                    or 'escalate' (requires further review)
            owner_note: Additional notes from the owner
            
        Returns:
            The updated finding
        """
        if self.db:
            # Find the most recent feedback for this finding that's pending owner review
            feedback = self.db.query(DiagnosticFeedback).filter(
                DiagnosticFeedback.finding_id == finding_id,
                DiagnosticFeedback.global_status == "pending_owner_review"
            ).order_by(DiagnosticFeedback.created_at.desc()).first()
            
            if not feedback:
                raise ValueError(f"No pending feedback found for finding ID {finding_id}")
            
            finding = self.db.query(DiagnosticFinding).filter(
                DiagnosticFinding.id == finding_id
            ).first()
            
            if not finding:
                raise ValueError(f"Finding with ID {finding_id} not found")
            
            # Update global status based on decision
            if decision == "accept":
                # Accept this change for global learning
                feedback.global_status = "accepted_for_global"
                
                # Mark for AI learning
                finding.model_version = finding.model_version + "_learn" if finding.model_version else "learn"
                
            elif decision == "reject":
                # Owner disagrees - don't include in global learning
                feedback.global_status = "rejected_for_global"
                
                # Note: The practice-specific correction/rejection remains in place
                # We're just not incorporating it into the global model
                
            elif decision == "escalate":
                feedback.global_status = "escalated"
            else:
                raise ValueError(f"Invalid decision: {decision}")
            
            # Record owner's decision
            owner_feedback = DiagnosticFeedback(
                finding_id=finding.id,
                feedback_type=FeedbackType.GENERAL,
                feedback_text=f"Owner review decision for global learning: {decision.upper()}. {owner_note}",
                provider_id="owner",
                provider_name="DentaMind Owner",
                provider_role=UserRole.ADMIN,
                is_learning_case=decision == "accept",  # Only if accepted for global learning
                global_status="complete"  # This feedback itself doesn't need review
            )
            
            self.db.add(owner_feedback)
            
            # Update the finding's last modified info
            finding.updated_by = "DentaMind Owner"
            finding.updated_at = datetime.now()
            
            self.db.commit()
            self.db.refresh(finding)
            self.db.refresh(feedback)
            
            result = finding.__dict__.copy()
            result["provider_feedback"] = feedback.feedback_text
            result["correction"] = feedback.correction
            result["original_diagnosis"] = feedback.original_diagnosis
            result["practice_id"] = feedback.practice_id
            result["owner_decision"] = decision
            result["owner_note"] = owner_note
            result["global_status"] = feedback.global_status
            
            return result
        
        # For demo purposes
        mock_finding = await self.get_finding(finding_id)
        if not mock_finding:
            raise ValueError(f"Finding with ID {finding_id} not found")
        
        updated_finding = mock_finding.copy()
        
        # The practice-specific status remains as is
        # Only update the global learning status
        if decision == "accept":
            updated_finding["global_status"] = "accepted_for_global"
        elif decision == "reject":
            updated_finding["global_status"] = "rejected_for_global"
        elif decision == "escalate":
            updated_finding["global_status"] = "escalated"
        
        updated_finding["updated_by"] = "DentaMind Owner"
        updated_finding["updated_at"] = datetime.now().isoformat()
        updated_finding["owner_decision"] = decision
        updated_finding["owner_note"] = owner_note
        
        # Log this decision
        decision_log = {
            "finding_id": finding_id,
            "decision": decision,
            "owner_note": owner_note,
            "timestamp": datetime.now().isoformat(),
            "for_global_learning": True
        }
        
        log_filename = os.path.join(self.feedback_store_path, f"owner_decision_{uuid.uuid4()}.json")
        with open(log_filename, 'w') as f:
            json.dump(decision_log, f, indent=2)
        
        return updated_finding
    
    async def get_ai_response(self, finding_id: str, message: str) -> str:
        """
        Get a response from the AI for a diagnostic finding
        
        Args:
            finding_id: The finding's ID
            message: The provider's message
            
        Returns:
            The AI's response
        """
        # In a real implementation, this would call an AI endpoint to get a response
        # For now, we'll simulate a response
        
        # Find the finding
        finding = await self.get_finding(finding_id)
        if not finding:
            return "I'm sorry, I couldn't find that diagnostic finding."
        
        # Based on the finding and message, generate an appropriate response
        # This would be much more sophisticated in a real implementation
        
        # Check for questions about confidence
        if "confidence" in message.lower() or "sure" in message.lower():
            return f"I assigned a confidence level of {(finding['confidence'] * 100):.0f}% to this diagnosis based on the X-ray imaging patterns. This is considered a {self._confidence_level(finding['confidence'])} confidence diagnosis. Would you like more details about the features I identified?"
        
        # Check for questions about alternatives
        if "alternative" in message.lower() or "other" in message.lower() or "differential" in message.lower():
            alternatives = {
                "Dental Caries": ["Enamel hypoplasia", "Dental fluorosis", "Staining"],
                "Periapical Abscess": ["Periapical cyst", "Granuloma", "Periapical periodontitis"],
                "Gingivitis": ["Early periodontitis", "Chemical irritation", "Allergic reaction"]
            }
            
            diagnosis = finding["diagnosis"].split(" - ")[0]  # Remove severity if present
            alt_list = alternatives.get(diagnosis, ["No specific alternatives identified"])
            
            return f"Alternative considerations for this case include: {', '.join(alt_list)}. Would you like me to explain why I favored {diagnosis} over these alternatives?"
        
        # Default response with more information about the diagnosis
        details = {
            "Dental Caries": "The X-ray shows a radiolucent area in the enamel and dentin, consistent with dental caries. The lesion appears to have penetrated the dentin but does not appear to have reached the pulp yet.",
            "Periapical Abscess": "The X-ray shows a radiolucent area around the apex of the tooth, indicating a periapical abscess. There appears to be bone loss in this region consistent with infection.",
            "Gingivitis": "Based on the clinical images, I observed gingival redness, swelling, and minor bleeding, consistent with moderate gingivitis. There doesn't appear to be significant attachment loss yet."
        }
        
        diagnosis = finding["diagnosis"].split(" - ")[0]  # Remove severity if present
        detail = details.get(diagnosis, "I based this diagnosis on patterns in the imaging and clinical data provided.")
        
        return f"{detail} Would you like me to elaborate on any specific aspect of this diagnosis?"
    
    async def _save_feedback_for_learning(self, finding: Dict[str, Any], feedback: Dict[str, Any]) -> None:
        """
        Save feedback for AI learning
        
        Args:
            finding: The finding with feedback
            feedback: The provider's feedback
        """
        # Create the feedback data to be stored
        feedback_data = {
            "feedback_id": str(uuid.uuid4()),
            "finding_id": finding["id"],
            "original_diagnosis": finding["diagnosis"],
            "confidence": finding["confidence"],
            "status": feedback["status"],
            "feedback": feedback["feedback"],
            "provider_name": feedback["provider_name"],
            "provider_role": feedback["provider_role"],
            "timestamp": datetime.now().isoformat(),
            "tooth_number": finding.get("tooth_number"),
            "patient_id": finding["patient_id"],
            "practice_id": feedback.get("practice_id", "unknown"),
            "global_status": "pending_owner_review" if feedback["status"] == "rejected" else feedback["status"]
        }
        
        # Save to disk for learning (in a real system, this would go to a database)
        filename = os.path.join(self.feedback_store_path, f"feedback_{feedback_data['feedback_id']}.json")
        with open(filename, 'w') as f:
            json.dump(feedback_data, f, indent=2)
    
    async def _save_correction_for_learning(self, finding: Dict[str, Any], correction_data: Dict[str, Any]) -> None:
        """
        Save correction for AI learning
        
        Args:
            finding: The finding with correction
            correction_data: The correction data
        """
        # Create the correction data to be stored
        correction_data_to_save = {
            "correction_id": str(uuid.uuid4()),
            "finding_id": finding["id"],
            "original_diagnosis": finding.get("original_diagnosis", finding["diagnosis"]),
            "corrected_diagnosis": correction_data["correction"],
            "confidence": finding["confidence"],
            "provider_name": correction_data["provider_name"],
            "provider_role": correction_data["provider_role"],
            "timestamp": datetime.now().isoformat(),
            "tooth_number": finding.get("tooth_number"),
            "patient_id": finding["patient_id"],
            "practice_id": correction_data.get("practice_id", "unknown"),
            "global_status": "pending_owner_review",
            "is_learning_case": True  # Flag this as a high-priority learning case
        }
        
        # Save to disk for learning (in a real system, this would go to a database)
        filename = os.path.join(self.feedback_store_path, f"correction_{correction_data_to_save['correction_id']}.json")
        with open(filename, 'w') as f:
            json.dump(correction_data_to_save, f, indent=2)
    
    async def _notify_owners_about_feedback(
        self, finding: Any, feedback: Any, feedback_data: Dict[str, Any], feedback_type: str
    ) -> None:
        """
        Notify owners about feedback that needs review for global integration
        
        Args:
            finding: The finding with feedback
            feedback: The feedback object (if using DB)
            feedback_data: The raw feedback data
            feedback_type: Type of feedback ("correction", "rejection", or "feedback")
        """
        # In a real implementation, this would send an email, create a notification, etc.
        # For now, just log to a file
        notification_data = {
            "notification_id": str(uuid.uuid4()),
            "type": f"{feedback_type}_needs_global_review",
            "finding_id": finding["id"] if isinstance(finding, dict) else str(finding.id),
            "patient_id": finding["patient_id"] if isinstance(finding, dict) else finding.patient_id,
            "diagnosis": finding["diagnosis"] if isinstance(finding, dict) else finding.diagnosis,
            "original_diagnosis": feedback.original_diagnosis if feedback and hasattr(feedback, "original_diagnosis") else None,
            "practice_id": feedback_data.get("practice_id", "unknown"),
            "provider_name": feedback_data.get("provider_name", "Unknown Provider"),
            "provider_role": feedback_data.get("provider_role", "dentist"),
            "feedback": feedback_data.get("feedback", ""),
            "correction": feedback_data.get("correction", ""),
            "timestamp": datetime.now().isoformat(),
            "tooth_number": finding.get("tooth_number") if isinstance(finding, dict) else finding.tooth_number,
            "viewed": False
        }
        
        # Save notification
        filename = os.path.join(self.feedback_store_path, f"notify_{feedback_type}_{notification_data['notification_id']}.json")
        with open(filename, 'w') as f:
            json.dump(notification_data, f, indent=2)
    
    def _confidence_level(self, confidence: float) -> str:
        """Convert numerical confidence to a descriptive level"""
        if confidence >= 0.9:
            return "high"
        elif confidence >= 0.7:
            return "moderate"
        else:
            return "low" 