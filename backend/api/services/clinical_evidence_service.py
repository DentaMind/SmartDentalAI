"""
Clinical Evidence Service

This service provides functionality for managing clinical evidence citations
and linking them to findings and treatment suggestions.
"""

import logging
import json
from typing import List, Dict, Any, Optional, Tuple, Union
from datetime import datetime
import uuid

from sqlalchemy.orm import Session

from ..repositories.clinical_evidence_repository import ClinicalEvidenceRepository
from ..models.clinical_evidence import (
    ClinicalEvidence,
    EvidenceType,
    EvidenceGrade,
    ClinicalEvidenceCreate,
    ClinicalEvidenceResponse,
    EvidenceCitation
)

# Configure logging
logger = logging.getLogger(__name__)

class ClinicalEvidenceService:
    """
    Service for managing clinical evidence citations and linking them to findings and treatments
    """
    
    def __init__(self, db: Session):
        self.db = db
        self.repository = ClinicalEvidenceRepository(db)
    
    async def create_evidence(self, evidence_data: ClinicalEvidenceCreate) -> ClinicalEvidence:
        """
        Create a new clinical evidence entry
        
        Args:
            evidence_data: Data for the new evidence entry
            
        Returns:
            The created evidence entry
        """
        try:
            # If DOI exists, check if this evidence is already in the database
            if evidence_data.doi:
                existing_evidence = self.repository.get_evidence_by_doi(evidence_data.doi)
                if existing_evidence:
                    logger.info(f"Evidence with DOI {evidence_data.doi} already exists, returning existing entry")
                    return existing_evidence
            
            # Create new evidence entry
            evidence = self.repository.create_evidence(evidence_data.dict())
            logger.info(f"Created new evidence entry: {evidence.id}")
            return evidence
        except Exception as e:
            logger.error(f"Error creating evidence entry: {str(e)}")
            raise
    
    async def get_evidence_by_id(self, evidence_id: str) -> Optional[ClinicalEvidence]:
        """
        Get a clinical evidence entry by ID
        
        Args:
            evidence_id: ID of the evidence entry
            
        Returns:
            The evidence entry if found, None otherwise
        """
        return self.repository.get_evidence_by_id(evidence_id)
    
    async def search_evidence(
        self,
        search_term: str = None,
        evidence_type: str = None,
        evidence_grade: str = None,
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
            List of matching evidence entries
        """
        # Convert string enum values to enum objects if provided
        evidence_type_enum = None
        if evidence_type:
            try:
                evidence_type_enum = EvidenceType(evidence_type)
            except ValueError:
                logger.warning(f"Invalid evidence type: {evidence_type}")
        
        evidence_grade_enum = None
        if evidence_grade:
            try:
                evidence_grade_enum = EvidenceGrade(evidence_grade)
            except ValueError:
                logger.warning(f"Invalid evidence grade: {evidence_grade}")
        
        return self.repository.search_evidence(
            search_term=search_term,
            evidence_type=evidence_type_enum,
            evidence_grade=evidence_grade_enum,
            specialty=specialty,
            limit=limit,
            offset=offset
        )
    
    async def update_evidence(self, evidence_id: str, update_data: Dict[str, Any]) -> Optional[ClinicalEvidence]:
        """
        Update a clinical evidence entry
        
        Args:
            evidence_id: ID of the evidence entry to update
            update_data: Data to update
            
        Returns:
            The updated evidence entry if found, None otherwise
        """
        return self.repository.update_evidence(evidence_id, update_data)
    
    async def delete_evidence(self, evidence_id: str) -> bool:
        """
        Delete a clinical evidence entry
        
        Args:
            evidence_id: ID of the evidence entry to delete
            
        Returns:
            True if deleted, False if not found
        """
        return self.repository.delete_evidence(evidence_id)
    
    async def associate_finding_with_evidence(
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
        return self.repository.associate_finding_with_evidence(
            finding_type=finding_type,
            evidence_id=evidence_id,
            relevance_score=relevance_score
        )
    
    async def associate_treatment_with_evidence(
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
        return self.repository.associate_treatment_with_evidence(
            procedure_code=procedure_code,
            evidence_id=evidence_id,
            relevance_score=relevance_score
        )
    
    async def get_evidence_for_finding(
        self,
        finding_type: str,
        specialty: str = None,
        limit: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Get evidence associated with a finding type
        
        Args:
            finding_type: Type of finding to get evidence for
            specialty: Optional specialty to filter by
            limit: Maximum number of results to return
            
        Returns:
            List of evidence entries with relevance scores
        """
        result = self.repository.get_evidence_for_finding(
            finding_type=finding_type,
            specialty=specialty,
            limit=limit
        )
        
        # Format the result
        return [
            {
                "evidence": ClinicalEvidenceResponse.from_orm(evidence).dict(),
                "relevance_score": relevance_score
            }
            for evidence, relevance_score in result
        ]
    
    async def get_evidence_for_treatment(
        self,
        procedure_code: str,
        finding_type: str = None,
        specialty: str = None,
        limit: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Get evidence associated with a treatment procedure
        
        Args:
            procedure_code: Procedure code to get evidence for
            finding_type: Optional finding type to filter by
            specialty: Optional specialty to filter by
            limit: Maximum number of results to return
            
        Returns:
            List of evidence entries with relevance scores
        """
        result = self.repository.get_evidence_for_treatment(
            procedure_code=procedure_code,
            finding_type=finding_type,
            specialty=specialty,
            limit=limit
        )
        
        # Format the result
        return [
            {
                "evidence": ClinicalEvidenceResponse.from_orm(evidence).dict(),
                "relevance_score": relevance_score
            }
            for evidence, relevance_score in result
        ]
    
    async def get_evidence_for_finding_and_treatment(
        self,
        finding_type: str,
        procedure_code: str,
        specialty: str = None,
        limit: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Get evidence that is relevant to both a finding and a treatment
        
        Args:
            finding_type: Type of finding
            procedure_code: Procedure code
            specialty: Optional specialty to filter by
            limit: Maximum number of results
            
        Returns:
            List of evidence entries with combined relevance scores
        """
        result = self.repository.get_evidence_for_finding_and_treatment(
            finding_type=finding_type,
            procedure_code=procedure_code,
            specialty=specialty,
            limit=limit
        )
        
        # Format the result
        return [
            {
                "evidence": ClinicalEvidenceResponse.from_orm(evidence).dict(),
                "combined_relevance_score": combined_score
            }
            for evidence, combined_score in result
        ]
    
    async def format_evidence_citation(self, evidence: ClinicalEvidence) -> EvidenceCitation:
        """
        Format a clinical evidence entry as a citation
        
        Args:
            evidence: The evidence entry to format
            
        Returns:
            Formatted citation
        """
        return EvidenceCitation(
            title=evidence.title,
            authors=evidence.authors,
            publication=evidence.publication,
            publication_date=evidence.publication_date,
            doi=evidence.doi,
            url=evidence.url,
            evidence_type=evidence.evidence_type,
            evidence_grade=evidence.evidence_grade,
            summary=evidence.summary
        )
    
    async def get_citations_for_suggestion(
        self,
        finding_type: str,
        procedure_code: str,
        specialty: str = None,
        limit: int = 3
    ) -> List[EvidenceCitation]:
        """
        Get formatted citations for a treatment suggestion
        
        Args:
            finding_type: Type of finding
            procedure_code: Procedure code
            specialty: Optional specialty to filter by
            limit: Maximum number of citations
            
        Returns:
            List of formatted citations
        """
        result = self.repository.get_evidence_for_finding_and_treatment(
            finding_type=finding_type,
            procedure_code=procedure_code,
            specialty=specialty,
            limit=limit
        )
        
        return [await self.format_evidence_citation(evidence) for evidence, _ in result]
    
    # Sample methods for seeding evidence data
    
    async def seed_initial_evidence(self) -> List[ClinicalEvidence]:
        """
        Seed the database with initial evidence entries
        
        Returns:
            List of created evidence entries
        """
        # Sample evidence data (this would be much more extensive in a real system)
        evidence_data = [
            {
                "title": "AAP Clinical Practice Guidelines on the Classification of Periodontal and Peri-Implant Diseases and Conditions",
                "authors": "Caton JG, Armitage G, Berglundh T, et al.",
                "publication": "Journal of Periodontology",
                "publication_date": datetime(2018, 6, 1),
                "doi": "10.1002/JPER.18-0157",
                "url": "https://aap.onlinelibrary.wiley.com/doi/10.1002/JPER.18-0157",
                "evidence_type": EvidenceType.GUIDELINE,
                "evidence_grade": EvidenceGrade.A,
                "summary": "Comprehensive system for the classification of periodontal and peri-implant diseases and conditions.",
                "recommendations": [
                    {"condition": "periodontitis", "recommendation": "Periodontitis should be classified by stage and grade."}
                ],
                "specialties": ["periodontics", "general_dentistry"],
                "conditions": ["periodontitis", "gingivitis", "peri-implantitis"],
                "procedures": ["D4341", "D4342", "D4910"],
                "keywords": ["periodontitis", "classification", "periodontal disease", "peri-implant disease"],
                "version": "2018"
            },
            {
                "title": "AAE Clinical Practice Guidelines on Endodontic Diagnosis",
                "authors": "American Association of Endodontists",
                "publication": "Journal of Endodontics",
                "publication_date": datetime(2020, 1, 15),
                "doi": "10.1016/j.joen.2019.12.005",
                "url": "https://www.aae.org/specialty/clinical-resources/guide-clinical-practice/",
                "evidence_type": EvidenceType.GUIDELINE,
                "evidence_grade": EvidenceGrade.A,
                "summary": "Guidelines for diagnosis and management of endodontic conditions.",
                "recommendations": [
                    {"condition": "periapical_lesion", "recommendation": "Root canal therapy is indicated for teeth with periapical lesions."}
                ],
                "specialties": ["endodontics", "general_dentistry"],
                "conditions": ["periapical_lesion", "pulpitis", "pulp_necrosis"],
                "procedures": ["D3310", "D3320", "D3330"],
                "keywords": ["endodontics", "root canal", "periapical lesion", "pulpitis"],
                "version": "2020"
            },
            {
                "title": "Clinical Practice Guidelines for Restorative Dentistry",
                "authors": "American Dental Association",
                "publication": "Journal of the American Dental Association",
                "publication_date": datetime(2019, 10, 1),
                "doi": "10.14219/jada.archive.2019.0133",
                "url": "https://jada.ada.org/",
                "evidence_type": EvidenceType.GUIDELINE,
                "evidence_grade": EvidenceGrade.B,
                "summary": "Guidelines for restorative procedures including composite and amalgam restorations.",
                "recommendations": [
                    {"condition": "caries", "recommendation": "Composite restorations are recommended for small to moderate carious lesions."}
                ],
                "specialties": ["restorative_dentistry", "general_dentistry"],
                "conditions": ["caries", "fractured_tooth", "restoration"],
                "procedures": ["D2140", "D2150", "D2160", "D2391", "D2392", "D2393"],
                "keywords": ["restorative", "composite", "amalgam", "caries"],
                "version": "2019"
            }
        ]
        
        created_evidence = []
        for data in evidence_data:
            evidence = self.repository.create_evidence(data)
            created_evidence.append(evidence)
            
            # Create associations
            for condition in data.get("conditions", []):
                self.repository.associate_finding_with_evidence(condition, str(evidence.id))
                
            for procedure in data.get("procedures", []):
                self.repository.associate_treatment_with_evidence(procedure, str(evidence.id))
        
        return created_evidence 