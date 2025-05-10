"""
Repository for AI Treatment Suggestions
"""

from datetime import datetime
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import desc, asc, func
import uuid

from ..models.ai_treatment_suggestion import (
    AITreatmentSuggestion,
    TreatmentSuggestionGroup,
    SuggestionStatus,
    ConfidenceLevel
)

class AITreatmentSuggestionRepository:
    """Repository for AI Treatment Suggestions database operations"""
    
    def __init__(self, db: Session):
        self.db = db
    
    # Treatment Suggestion Operations
    
    def create_suggestion(self, suggestion_data: Dict[str, Any]) -> AITreatmentSuggestion:
        """
        Create a new AI treatment suggestion
        
        Args:
            suggestion_data: Dict containing treatment suggestion data
            
        Returns:
            AITreatmentSuggestion: Created suggestion object
        """
        suggestion = AITreatmentSuggestion(**suggestion_data)
        self.db.add(suggestion)
        self.db.commit()
        self.db.refresh(suggestion)
        return suggestion
    
    def get_suggestion_by_id(self, suggestion_id: str) -> Optional[AITreatmentSuggestion]:
        """
        Get an AI treatment suggestion by ID
        
        Args:
            suggestion_id: Suggestion ID
            
        Returns:
            Optional[AITreatmentSuggestion]: Found suggestion or None
        """
        return self.db.query(AITreatmentSuggestion).filter(
            AITreatmentSuggestion.id == suggestion_id
        ).first()
    
    def get_suggestions_by_patient(
        self, 
        patient_id: str,
        status: Optional[SuggestionStatus] = None,
        min_confidence: Optional[float] = None,
        priority: Optional[str] = None,
        limit: int = 100,
        offset: int = 0
    ) -> List[AITreatmentSuggestion]:
        """
        Get AI treatment suggestions for a patient
        
        Args:
            patient_id: Patient ID
            status: Filter by suggestion status
            min_confidence: Filter by minimum confidence value
            priority: Filter by priority level
            limit: Maximum number of records to return
            offset: Offset for pagination
            
        Returns:
            List[AITreatmentSuggestion]: List of suggestions
        """
        query = self.db.query(AITreatmentSuggestion).filter(
            AITreatmentSuggestion.patient_id == patient_id
        )
        
        if status:
            query = query.filter(AITreatmentSuggestion.status == status)
        
        if min_confidence:
            query = query.filter(AITreatmentSuggestion.confidence >= min_confidence)
        
        if priority:
            query = query.filter(AITreatmentSuggestion.priority == priority)
        
        return query.order_by(desc(AITreatmentSuggestion.created_at)).offset(offset).limit(limit).all()
    
    def get_suggestions_by_diagnosis(
        self,
        diagnosis_id: str,
        status: Optional[SuggestionStatus] = None,
        limit: int = 100
    ) -> List[AITreatmentSuggestion]:
        """
        Get AI treatment suggestions for a diagnosis
        
        Args:
            diagnosis_id: Diagnosis ID
            status: Filter by suggestion status
            limit: Maximum number of records to return
            
        Returns:
            List[AITreatmentSuggestion]: List of suggestions
        """
        query = self.db.query(AITreatmentSuggestion).filter(
            AITreatmentSuggestion.diagnosis_id == diagnosis_id
        )
        
        if status:
            query = query.filter(AITreatmentSuggestion.status == status)
        
        return query.order_by(desc(AITreatmentSuggestion.created_at)).limit(limit).all()
    
    def get_suggestions_by_finding(
        self,
        finding_id: str,
        status: Optional[SuggestionStatus] = None
    ) -> List[AITreatmentSuggestion]:
        """
        Get AI treatment suggestions for a specific finding
        
        Args:
            finding_id: Finding ID
            status: Filter by suggestion status
            
        Returns:
            List[AITreatmentSuggestion]: List of suggestions
        """
        query = self.db.query(AITreatmentSuggestion).filter(
            AITreatmentSuggestion.finding_id == finding_id
        )
        
        if status:
            query = query.filter(AITreatmentSuggestion.status == status)
        
        return query.order_by(desc(AITreatmentSuggestion.confidence)).all()
    
    def update_suggestion(
        self,
        suggestion_id: str,
        update_data: Dict[str, Any],
        clinician_id: Optional[str] = None
    ) -> Optional[AITreatmentSuggestion]:
        """
        Update an AI treatment suggestion
        
        Args:
            suggestion_id: Suggestion ID
            update_data: Dict containing fields to update
            clinician_id: ID of clinician making the update
            
        Returns:
            Optional[AITreatmentSuggestion]: Updated suggestion or None
        """
        suggestion = self.get_suggestion_by_id(suggestion_id)
        if not suggestion:
            return None
        
        # Update fields
        for key, value in update_data.items():
            setattr(suggestion, key, value)
        
        # Set review metadata
        if clinician_id and (suggestion.status in [SuggestionStatus.ACCEPTED, SuggestionStatus.MODIFIED, SuggestionStatus.REJECTED]):
            suggestion.reviewed_at = datetime.now()
            suggestion.reviewed_by = clinician_id
        
        self.db.commit()
        self.db.refresh(suggestion)
        return suggestion
    
    def delete_suggestion(self, suggestion_id: str) -> bool:
        """
        Delete an AI treatment suggestion
        
        Args:
            suggestion_id: Suggestion ID
            
        Returns:
            bool: True if successful, False otherwise
        """
        suggestion = self.get_suggestion_by_id(suggestion_id)
        if not suggestion:
            return False
        
        self.db.delete(suggestion)
        self.db.commit()
        return True
    
    # Suggestion Group Operations
    
    def create_suggestion_group(self, group_data: Dict[str, Any]) -> TreatmentSuggestionGroup:
        """
        Create a new treatment suggestion group
        
        Args:
            group_data: Dict containing group data
            
        Returns:
            TreatmentSuggestionGroup: Created group object
        """
        group = TreatmentSuggestionGroup(**group_data)
        self.db.add(group)
        self.db.commit()
        self.db.refresh(group)
        return group
    
    def get_suggestion_group_by_id(self, group_id: str) -> Optional[TreatmentSuggestionGroup]:
        """
        Get a treatment suggestion group by ID
        
        Args:
            group_id: Group ID
            
        Returns:
            Optional[TreatmentSuggestionGroup]: Found group or None
        """
        return self.db.query(TreatmentSuggestionGroup).filter(
            TreatmentSuggestionGroup.id == group_id
        ).first()
    
    def get_suggestion_groups_by_patient(
        self,
        patient_id: str,
        limit: int = 100,
        offset: int = 0
    ) -> List[TreatmentSuggestionGroup]:
        """
        Get treatment suggestion groups for a patient
        
        Args:
            patient_id: Patient ID
            limit: Maximum number of records to return
            offset: Offset for pagination
            
        Returns:
            List[TreatmentSuggestionGroup]: List of groups
        """
        return self.db.query(TreatmentSuggestionGroup).filter(
            TreatmentSuggestionGroup.patient_id == patient_id
        ).order_by(desc(TreatmentSuggestionGroup.created_at)).offset(offset).limit(limit).all()
    
    def update_suggestion_group(
        self,
        group_id: str,
        update_data: Dict[str, Any]
    ) -> Optional[TreatmentSuggestionGroup]:
        """
        Update a treatment suggestion group
        
        Args:
            group_id: Group ID
            update_data: Dict containing fields to update
            
        Returns:
            Optional[TreatmentSuggestionGroup]: Updated group or None
        """
        group = self.get_suggestion_group_by_id(group_id)
        if not group:
            return None
        
        # Update fields
        for key, value in update_data.items():
            setattr(group, key, value)
        
        self.db.commit()
        self.db.refresh(group)
        return group
    
    def delete_suggestion_group(self, group_id: str) -> bool:
        """
        Delete a treatment suggestion group
        
        Args:
            group_id: Group ID
            
        Returns:
            bool: True if successful, False otherwise
        """
        group = self.get_suggestion_group_by_id(group_id)
        if not group:
            return False
        
        self.db.delete(group)
        self.db.commit()
        return True
    
    # Statistics and Analytics
    
    def get_suggestion_stats_by_patient(self, patient_id: str) -> Dict[str, Any]:
        """
        Get statistics about treatment suggestions for a patient
        
        Args:
            patient_id: Patient ID
            
        Returns:
            Dict: Statistics about suggestions
        """
        # Total suggestions
        total_query = self.db.query(func.count(AITreatmentSuggestion.id)).filter(
            AITreatmentSuggestion.patient_id == patient_id
        )
        total_suggestions = total_query.scalar() or 0
        
        # Suggestions by status
        status_counts = {}
        for status in SuggestionStatus:
            count = self.db.query(func.count(AITreatmentSuggestion.id)).filter(
                AITreatmentSuggestion.patient_id == patient_id,
                AITreatmentSuggestion.status == status
            ).scalar() or 0
            status_counts[status.value] = count
        
        # High confidence suggestions
        high_confidence_count = self.db.query(func.count(AITreatmentSuggestion.id)).filter(
            AITreatmentSuggestion.patient_id == patient_id,
            AITreatmentSuggestion.confidence_level.in_([ConfidenceLevel.HIGH, ConfidenceLevel.VERY_HIGH])
        ).scalar() or 0
        
        # Suggestions by tooth (top 5)
        tooth_query = self.db.query(
            AITreatmentSuggestion.tooth_number,
            func.count(AITreatmentSuggestion.id).label('count')
        ).filter(
            AITreatmentSuggestion.patient_id == patient_id,
            AITreatmentSuggestion.tooth_number.isnot(None)
        ).group_by(
            AITreatmentSuggestion.tooth_number
        ).order_by(
            desc('count')
        ).limit(5)
        
        tooth_counts = {row.tooth_number: row.count for row in tooth_query.all()}
        
        return {
            "total_suggestions": total_suggestions,
            "by_status": status_counts,
            "high_confidence_count": high_confidence_count,
            "by_tooth": tooth_counts
        }
    
    def get_suggestion_acceptance_rate(self) -> Dict[str, Any]:
        """
        Get acceptance rate statistics for AI treatment suggestions
        
        Returns:
            Dict: Acceptance rate statistics
        """
        # Total reviewed suggestions
        reviewed_query = self.db.query(func.count(AITreatmentSuggestion.id)).filter(
            AITreatmentSuggestion.status.in_([
                SuggestionStatus.ACCEPTED,
                SuggestionStatus.MODIFIED,
                SuggestionStatus.REJECTED
            ])
        )
        total_reviewed = reviewed_query.scalar() or 0
        
        if total_reviewed == 0:
            return {
                "total_reviewed": 0,
                "acceptance_rate": 0,
                "modification_rate": 0,
                "rejection_rate": 0
            }
        
        # Accepted suggestions
        accepted_count = self.db.query(func.count(AITreatmentSuggestion.id)).filter(
            AITreatmentSuggestion.status == SuggestionStatus.ACCEPTED
        ).scalar() or 0
        
        # Modified suggestions
        modified_count = self.db.query(func.count(AITreatmentSuggestion.id)).filter(
            AITreatmentSuggestion.status == SuggestionStatus.MODIFIED
        ).scalar() or 0
        
        # Rejected suggestions
        rejected_count = self.db.query(func.count(AITreatmentSuggestion.id)).filter(
            AITreatmentSuggestion.status == SuggestionStatus.REJECTED
        ).scalar() or 0
        
        return {
            "total_reviewed": total_reviewed,
            "acceptance_rate": accepted_count / total_reviewed,
            "modification_rate": modified_count / total_reviewed,
            "rejection_rate": rejected_count / total_reviewed
        } 