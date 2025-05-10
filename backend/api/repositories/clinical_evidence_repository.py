"""
Repository for Clinical Evidence Citations
"""

from datetime import datetime
from typing import List, Dict, Any, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import desc, asc, text, and_, or_, func, select
import uuid

from ..models.clinical_evidence import (
    ClinicalEvidence,
    finding_evidence_association,
    treatment_evidence_association,
    EvidenceType,
    EvidenceGrade
)

class ClinicalEvidenceRepository:
    """Repository for Clinical Evidence database operations"""

    def __init__(self, db: Session):
        self.db = db

    # CRUD operations for clinical evidence entries

    def create_evidence(self, evidence_data: Dict[str, Any]) -> ClinicalEvidence:
        """
        Create a new clinical evidence entry
        
        Args:
            evidence_data: Data for creating the evidence entry
            
        Returns:
            The created ClinicalEvidence object
        """
        evidence = ClinicalEvidence(**evidence_data)
        self.db.add(evidence)
        self.db.commit()
        self.db.refresh(evidence)
        return evidence

    def get_evidence_by_id(self, evidence_id: str) -> Optional[ClinicalEvidence]:
        """
        Get a clinical evidence entry by ID
        
        Args:
            evidence_id: ID of the evidence entry
            
        Returns:
            The ClinicalEvidence object if found, None otherwise
        """
        return self.db.query(ClinicalEvidence).filter(ClinicalEvidence.id == evidence_id).first()

    def get_evidence_by_doi(self, doi: str) -> Optional[ClinicalEvidence]:
        """
        Get a clinical evidence entry by DOI
        
        Args:
            doi: Digital Object Identifier
            
        Returns:
            The ClinicalEvidence object if found, None otherwise
        """
        return self.db.query(ClinicalEvidence).filter(ClinicalEvidence.doi == doi).first()

    def search_evidence(
        self, 
        search_term: str = None,
        evidence_type: EvidenceType = None, 
        evidence_grade: EvidenceGrade = None,
        specialty: str = None,
        limit: int = 20, 
        offset: int = 0
    ) -> List[ClinicalEvidence]:
        """
        Search for clinical evidence based on criteria
        
        Args:
            search_term: Text to search in title, summary, and keywords
            evidence_type: Type of evidence to filter by
            evidence_grade: Grade of evidence to filter by
            specialty: Dental specialty to filter by
            limit: Maximum number of results to return
            offset: Pagination offset
            
        Returns:
            List of matching ClinicalEvidence objects
        """
        query = self.db.query(ClinicalEvidence)
        
        if search_term:
            search_pattern = f"%{search_term}%"
            query = query.filter(
                or_(
                    ClinicalEvidence.title.ilike(search_pattern),
                    ClinicalEvidence.summary.ilike(search_pattern),
                    ClinicalEvidence.authors.ilike(search_pattern),
                    ClinicalEvidence.publication.ilike(search_pattern)
                )
            )
        
        if evidence_type:
            query = query.filter(ClinicalEvidence.evidence_type == evidence_type)
        
        if evidence_grade:
            query = query.filter(ClinicalEvidence.evidence_grade == evidence_grade)
        
        if specialty:
            # JSONB containment for specialties array containing the specialty
            # This expects the specialties column to be a JSON array
            query = query.filter(
                ClinicalEvidence.specialties.op('?')("\"" + specialty + "\"")
            )
        
        # Order by grade (highest quality first) and then most recent
        query = query.order_by(
            asc(ClinicalEvidence.evidence_grade),
            desc(ClinicalEvidence.publication_date)
        )
        
        return query.offset(offset).limit(limit).all()

    def update_evidence(self, evidence_id: str, update_data: Dict[str, Any]) -> Optional[ClinicalEvidence]:
        """
        Update a clinical evidence entry
        
        Args:
            evidence_id: ID of the evidence entry to update
            update_data: Data to update
            
        Returns:
            The updated ClinicalEvidence object if found, None otherwise
        """
        evidence = self.get_evidence_by_id(evidence_id)
        if not evidence:
            return None
        
        for key, value in update_data.items():
            setattr(evidence, key, value)
        
        self.db.commit()
        self.db.refresh(evidence)
        return evidence

    def delete_evidence(self, evidence_id: str) -> bool:
        """
        Delete a clinical evidence entry
        
        Args:
            evidence_id: ID of the evidence entry to delete
            
        Returns:
            True if deleted, False if not found
        """
        evidence = self.get_evidence_by_id(evidence_id)
        if not evidence:
            return False
        
        self.db.delete(evidence)
        self.db.commit()
        return True

    # Association operations for findings and evidence

    def associate_finding_with_evidence(
        self, 
        finding_type: str, 
        evidence_id: str, 
        relevance_score: float = 0.7
    ) -> bool:
        """
        Associate a finding type with evidence
        
        Args:
            finding_type: Type of finding (e.g., "caries", "periapical_lesion")
            evidence_id: ID of the evidence entry
            relevance_score: How relevant this evidence is to the finding (0.0 to 1.0)
            
        Returns:
            True if association was created, False otherwise
        """
        # Check if evidence exists
        evidence = self.get_evidence_by_id(evidence_id)
        if not evidence:
            return False
            
        # Create association
        stmt = finding_evidence_association.insert().values(
            finding_type=finding_type,
            evidence_id=evidence_id,
            relevance_score=relevance_score
        )
        
        try:
            self.db.execute(stmt)
            self.db.commit()
            return True
        except Exception as e:
            self.db.rollback()
            return False

    def associate_treatment_with_evidence(
        self, 
        procedure_code: str, 
        evidence_id: str, 
        relevance_score: float = 0.7
    ) -> bool:
        """
        Associate a treatment procedure with evidence
        
        Args:
            procedure_code: Procedure code (e.g., "D2391", "D3310")
            evidence_id: ID of the evidence entry
            relevance_score: How relevant this evidence is to the treatment (0.0 to 1.0)
            
        Returns:
            True if association was created, False otherwise
        """
        # Check if evidence exists
        evidence = self.get_evidence_by_id(evidence_id)
        if not evidence:
            return False
            
        # Create association
        stmt = treatment_evidence_association.insert().values(
            procedure_code=procedure_code,
            evidence_id=evidence_id,
            relevance_score=relevance_score
        )
        
        try:
            self.db.execute(stmt)
            self.db.commit()
            return True
        except Exception as e:
            self.db.rollback()
            return False

    def get_evidence_for_finding(
        self, 
        finding_type: str,
        specialty: str = None,
        limit: int = 5
    ) -> List[Tuple[ClinicalEvidence, float]]:
        """
        Get evidence associated with a finding type
        
        Args:
            finding_type: Type of finding to get evidence for
            specialty: Optional specialty to filter by
            limit: Maximum number of results to return
            
        Returns:
            List of tuples containing (evidence, relevance_score)
        """
        query = self.db.query(
            ClinicalEvidence, 
            finding_evidence_association.c.relevance_score
        ).join(
            finding_evidence_association,
            ClinicalEvidence.id == finding_evidence_association.c.evidence_id
        ).filter(
            finding_evidence_association.c.finding_type == finding_type
        )
        
        if specialty:
            # JSONB containment for specialties array containing the specialty
            query = query.filter(
                ClinicalEvidence.specialties.op('?')("\"" + specialty + "\"")
            )
        
        # Order by relevance score (most relevant first)
        query = query.order_by(desc(finding_evidence_association.c.relevance_score))
        
        return query.limit(limit).all()

    def get_evidence_for_treatment(
        self, 
        procedure_code: str,
        finding_type: str = None,
        specialty: str = None,
        limit: int = 5
    ) -> List[Tuple[ClinicalEvidence, float]]:
        """
        Get evidence associated with a treatment procedure
        
        Args:
            procedure_code: Procedure code to get evidence for
            finding_type: Optional finding type to filter by
            specialty: Optional specialty to filter by
            limit: Maximum number of results to return
            
        Returns:
            List of tuples containing (evidence, relevance_score)
        """
        query = self.db.query(
            ClinicalEvidence, 
            treatment_evidence_association.c.relevance_score
        ).join(
            treatment_evidence_association,
            ClinicalEvidence.id == treatment_evidence_association.c.evidence_id
        ).filter(
            treatment_evidence_association.c.procedure_code == procedure_code
        )
        
        # If finding type is provided, get evidence that also applies to the finding
        if finding_type:
            finding_evidence = self.db.query(
                finding_evidence_association.c.evidence_id
            ).filter(
                finding_evidence_association.c.finding_type == finding_type
            ).subquery()
            
            query = query.filter(ClinicalEvidence.id.in_(finding_evidence))
        
        if specialty:
            # JSONB containment for specialties array containing the specialty
            query = query.filter(
                ClinicalEvidence.specialties.op('?')("\"" + specialty + "\"")
            )
        
        # Order by relevance score (most relevant first)
        query = query.order_by(desc(treatment_evidence_association.c.relevance_score))
        
        return query.limit(limit).all()

    def get_evidence_for_finding_and_treatment(
        self,
        finding_type: str,
        procedure_code: str,
        specialty: str = None,
        limit: int = 5
    ) -> List[ClinicalEvidence]:
        """
        Get evidence that is relevant to both a finding and a treatment
        
        Args:
            finding_type: Type of finding
            procedure_code: Procedure code
            specialty: Optional specialty to filter by
            limit: Maximum number of results
            
        Returns:
            List of ClinicalEvidence objects
        """
        # Get evidence IDs associated with the finding
        finding_evidence_subq = select([
            finding_evidence_association.c.evidence_id,
            finding_evidence_association.c.relevance_score.label("finding_score")
        ]).where(
            finding_evidence_association.c.finding_type == finding_type
        ).subquery()
        
        # Get evidence IDs associated with the treatment
        treatment_evidence_subq = select([
            treatment_evidence_association.c.evidence_id,
            treatment_evidence_association.c.relevance_score.label("treatment_score")
        ]).where(
            treatment_evidence_association.c.procedure_code == procedure_code
        ).subquery()
        
        # Join both to get evidence that matches both finding and treatment
        query = self.db.query(
            ClinicalEvidence,
            finding_evidence_subq.c.finding_score + treatment_evidence_subq.c.treatment_score
        ).join(
            finding_evidence_subq,
            ClinicalEvidence.id == finding_evidence_subq.c.evidence_id
        ).join(
            treatment_evidence_subq,
            ClinicalEvidence.id == treatment_evidence_subq.c.evidence_id
        )
        
        if specialty:
            # JSONB containment for specialties array containing the specialty
            query = query.filter(
                ClinicalEvidence.specialties.op('?')("\"" + specialty + "\"")
            )
        
        # Order by combined relevance score
        query = query.order_by(desc(finding_evidence_subq.c.finding_score + treatment_evidence_subq.c.treatment_score))
        
        return query.limit(limit).all() 