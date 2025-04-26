"""
DentaMind core integration module.
"""

from typing import List, Optional, Dict
from datetime import datetime
import httpx
from fastapi import HTTPException
from pydantic import BaseModel

from ..api.models import (
    ValidationRequest,
    ValidationResponse,
    ProcedureRequest,
    BenefitsSnapshot
)

class DentaMindPatient(BaseModel):
    """DentaMind patient information"""
    id: str
    insurance_id: Optional[str]
    insurance_subscriber_id: Optional[str]
    insurance_group: Optional[str]

class DentaMindProcedure(BaseModel):
    """DentaMind procedure information"""
    cdt_code: str
    tooth_number: Optional[str]
    surfaces: Optional[List[str]]
    quadrant: Optional[int]
    fee: float
    diagnosis: Optional[str]
    notes: Optional[str]

class InsuranceIntegration:
    """Integration with DentaMind core for insurance functionality"""
    
    def __init__(
        self,
        dentamind_api_url: str,
        dentamind_api_key: str,
        cache_client = None
    ):
        self.api_url = dentamind_api_url
        self.api_key = dentamind_api_key
        self.cache = cache_client
        self.client = httpx.AsyncClient(
            base_url=dentamind_api_url,
            headers={"Authorization": f"Bearer {dentamind_api_key}"}
        )
        
    async def get_active_patient(self) -> Optional[DentaMindPatient]:
        """Get currently active patient in DentaMind"""
        try:
            response = await self.client.get("/api/active-patient")
            if response.status_code == 404:
                return None
            response.raise_for_status()
            return DentaMindPatient(**response.json())
        except httpx.HTTPError as e:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to get active patient: {str(e)}"
            )
            
    async def get_treatment_plan(
        self,
        patient_id: str
    ) -> List[DentaMindProcedure]:
        """Get patient's treatment plan"""
        cache_key = f"treatment_plan:{patient_id}"
        
        # Check cache first
        if self.cache:
            cached = await self.cache.get(cache_key)
            if cached:
                return [DentaMindProcedure(**p) for p in cached]
        
        try:
            response = await self.client.get(
                f"/api/patients/{patient_id}/treatment-plan"
            )
            response.raise_for_status()
            procedures = [
                DentaMindProcedure(**p)
                for p in response.json()["procedures"]
            ]
            
            # Cache the result
            if self.cache:
                await self.cache.set(
                    cache_key,
                    [p.dict() for p in procedures],
                    expire=300  # 5 minutes
                )
                
            return procedures
        except httpx.HTTPError as e:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to get treatment plan: {str(e)}"
            )
            
    async def validate_treatment_plan(
        self,
        patient_id: str,
        procedures: List[DentaMindProcedure]
    ) -> ValidationResponse:
        """Validate insurance coverage for treatment plan"""
        # Convert to insurance API format
        procedure_requests = [
            ProcedureRequest(
                cdt_code=proc.cdt_code,
                tooth_number=proc.tooth_number,
                surfaces=proc.surfaces,
                quadrant=proc.quadrant,
                procedure_cost=proc.fee
            )
            for proc in procedures
        ]
        
        request = ValidationRequest(
            patient_id=patient_id,
            procedures=procedure_requests,
            service_date=datetime.now()
        )
        
        try:
            response = await self.client.post(
                "/insurance/validate",
                json=request.dict()
            )
            response.raise_for_status()
            return ValidationResponse(**response.json())
        except httpx.HTTPError as e:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to validate coverage: {str(e)}"
            )
            
    async def trigger_preauth(
        self,
        patient_id: str,
        procedures: List[str],  # List of CDT codes
        diagnosis: Optional[str] = None
    ) -> Dict[str, str]:
        """Trigger pre-authorization workflow"""
        try:
            response = await self.client.post(
                "/api/preauth/generate",
                json={
                    "patient_id": patient_id,
                    "procedures": procedures,
                    "diagnosis": diagnosis
                }
            )
            response.raise_for_status()
            return response.json()
        except httpx.HTTPError as e:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to trigger pre-auth: {str(e)}"
            )
            
    async def update_treatment_plan_coverage(
        self,
        patient_id: str,
        validation: ValidationResponse
    ):
        """Update treatment plan with coverage information"""
        try:
            # Map coverage results to procedures
            coverage_map = {
                proc.cdt_code: {
                    "is_covered": proc.is_covered,
                    "coverage_percent": proc.coverage_percent,
                    "estimated_insurance": proc.estimated_insurance,
                    "estimated_patient": proc.estimated_patient,
                    "requires_preauth": proc.requires_preauth,
                    "warnings": proc.warnings
                }
                for proc in validation.procedures
            }
            
            response = await self.client.patch(
                f"/api/patients/{patient_id}/treatment-plan",
                json={"coverage": coverage_map}
            )
            response.raise_for_status()
        except httpx.HTTPError as e:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to update treatment plan: {str(e)}"
            )
            
    async def get_benefits_widget_data(
        self,
        patient_id: str
    ) -> Dict[str, any]:
        """Get data for benefits widget"""
        try:
            # Get benefits snapshot
            benefits_response = await self.client.get(
                f"/insurance/benefits/{patient_id}"
            )
            benefits_response.raise_for_status()
            benefits = BenefitsSnapshot(**benefits_response.json())
            
            # Get claim history
            history_response = await self.client.get(
                f"/insurance/history/{patient_id}"
            )
            history_response.raise_for_status()
            history = history_response.json()
            
            return {
                "benefits": benefits.dict(),
                "history": history,
                "warnings": []  # Add any relevant warnings
            }
        except httpx.HTTPError as e:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to get benefits data: {str(e)}"
            ) 