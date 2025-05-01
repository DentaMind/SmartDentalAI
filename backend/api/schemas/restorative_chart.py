from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any, Union
from datetime import datetime
from enum import Enum

class ToothSurface(str, Enum):
    """Dental surfaces for restorations"""
    MESIAL = "M"
    OCCLUSAL = "O" 
    DISTAL = "D"
    BUCCAL = "B"
    LINGUAL = "L"
    FACIAL = "F"
    INCISAL = "I"

class RestorationType(str, Enum):
    """Types of dental restorations"""
    COMPOSITE = "composite"
    AMALGAM = "amalgam"
    CROWN_PFM = "crown_pfm"
    CROWN_ZIRCONIA = "crown_zirconia"
    CROWN_EMAX = "crown_emax"
    VENEER = "veneer"
    INLAY = "inlay"
    ONLAY = "onlay"
    BRIDGE_PONTIC = "bridge_pontic"
    BRIDGE_RETAINER = "bridge_retainer"
    POST_CORE = "post_core"
    IMPLANT = "implant"
    IMPLANT_CROWN = "implant_crown"
    DENTURE = "denture"
    ROOT_CANAL = "root_canal"
    SEALANT = "sealant"

class ToothStatus(str, Enum):
    """Status of a tooth"""
    PRESENT = "present"
    MISSING = "missing"
    EXTRACTED = "extracted"
    IMPACTED = "impacted"
    PLANNED_EXTRACTION = "planned_extraction"
    PLANNED_IMPLANT = "planned_implant"

class RestorationCondition(str, Enum):
    """Condition of a restoration"""
    GOOD = "good"
    MARGINAL_LEAKAGE = "marginal_leakage"
    FRACTURE = "fracture"
    RECURRENT_DECAY = "recurrent_decay"
    DISCOLORATION = "discoloration"
    WEAR = "wear"

class RestorationBase(BaseModel):
    """Base model for restoration data"""
    tooth_number: str
    restoration_type: RestorationType
    surfaces: Optional[List[ToothSurface]] = None
    procedure_date: datetime
    provider_id: Optional[str] = None
    condition: RestorationCondition = RestorationCondition.GOOD
    notes: Optional[str] = None
    xray_confirmation_id: Optional[str] = None

class RestorationCreate(RestorationBase):
    """Model for creating a new restoration"""
    patient_id: str

class RestorationUpdate(BaseModel):
    """Model for updating an existing restoration"""
    restoration_type: Optional[RestorationType] = None
    surfaces: Optional[List[ToothSurface]] = None
    condition: Optional[RestorationCondition] = None
    notes: Optional[str] = None
    is_current: Optional[bool] = None

class RestorationResponse(RestorationBase):
    """Model for restoration response"""
    id: str
    patient_id: str
    is_current: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    replaced_by_id: Optional[str] = None

    class Config:
        orm_mode = True

class ToothChartBase(BaseModel):
    """Base model for tooth chart data"""
    tooth_number: str
    status: ToothStatus = ToothStatus.PRESENT
    notes: Optional[str] = None

class ToothChartCreate(ToothChartBase):
    """Model for creating a new tooth chart entry"""
    patient_id: str
    current_restoration_id: Optional[str] = None

class ToothChartUpdate(BaseModel):
    """Model for updating an existing tooth chart entry"""
    status: Optional[ToothStatus] = None
    current_restoration_id: Optional[str] = None
    notes: Optional[str] = None

class ToothChartResponse(ToothChartBase):
    """Model for tooth chart response"""
    id: str
    patient_id: str
    current_restoration_id: Optional[str] = None
    last_updated: datetime
    current_restoration: Optional[RestorationResponse] = None

    class Config:
        orm_mode = True

class CompleteDentalChart(BaseModel):
    """Complete dental chart with all teeth"""
    patient_id: str
    teeth: Dict[str, ToothChartResponse]  # Tooth number to tooth chart mapping

    class Config:
        orm_mode = True

class RestorationHistoryResponse(BaseModel):
    """Model for tooth restoration history"""
    tooth_number: str
    history: List[RestorationResponse]

    class Config:
        orm_mode = True 