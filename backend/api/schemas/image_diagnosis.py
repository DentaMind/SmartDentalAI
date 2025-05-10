from datetime import datetime
from typing import Dict, Any, Optional, List, Union
from pydantic import BaseModel, Field
from enum import Enum

class ImageModality(str, Enum):
    """Enum for different imaging modalities"""
    FMX = "FMX"
    PANORAMIC = "PANORAMIC"
    CBCT = "CBCT"
    BITEWING = "BITEWING"
    PERIAPICAL = "PERIAPICAL"
    CEPHALOMETRIC = "CEPHALOMETRIC"

class ImageFinding(BaseModel):
    """Base model for an individual finding in an image"""
    type: str
    confidence: float
    location: Optional[Dict[str, Any]] = None

class CariesFinding(ImageFinding):
    """Model for caries findings"""
    type: str = "caries"
    tooth: str
    surface: str
    severity: str
    black_classification: Optional[str] = None

class PeriapicalLesionFinding(ImageFinding):
    """Model for periapical lesion findings"""
    type: str = "periapical_lesion"
    tooth: str
    diameter_mm: float

class RestorationFinding(ImageFinding):
    """Model for restoration findings"""
    type: str = "restoration"
    tooth: str
    surface: str
    restoration_type: str

class ImpactedToothFinding(ImageFinding):
    """Model for impacted tooth findings"""
    type: str = "impacted_tooth"
    tooth: str
    angulation: str

class TMJFinding(ImageFinding):
    """Model for TMJ findings"""
    type: str = "tmj"
    side: str
    condition: str
    wilkes_classification: Optional[str] = None

class BoneMeasurement(BaseModel):
    """Model for bone measurements"""
    width_mm: float
    height_mm: float
    depth_mm: Optional[float] = None
    volume_mm3: Optional[float] = None
    density_hu: Optional[float] = None
    bone_quality: Optional[str] = None
    cortical_thickness_mm: Optional[float] = None

class AnatomicalStructure(BaseModel):
    """Model for anatomical structure proximity"""
    name: str
    distance_mm: float
    direction: str

class ImplantRecommendation(BaseModel):
    """Model for implant recommendations"""
    suitable_for_implant: bool
    augmentation_required: bool
    recommended_implant_dimensions: Optional[Dict[str, float]] = None
    surgical_approach: Optional[str] = None
    notes: List[str] = Field(default_factory=list)

class ClinicalSummary(BaseModel):
    """Model for clinical summary of findings"""
    significant_findings: List[str] = Field(default_factory=list)
    recommended_treatment: Optional[str] = None
    bone_quality: Optional[str] = None
    implant_suitability: Optional[str] = None
    bone_density: Optional[float] = None

class ImageDiagnosisBase(BaseModel):
    """Base model for image diagnosis"""
    patient_id: str
    image_id: str
    modality: ImageModality
    findings: Dict[str, List[Any]]
    summary: Optional[ClinicalSummary] = None

class FMXDiagnosisRequest(BaseModel):
    """Request model for FMX diagnosis"""
    patient_id: str
    tooth_number: Optional[str] = None
    notes: Optional[str] = None

class PanoramicDiagnosisRequest(BaseModel):
    """Request model for panoramic diagnosis"""
    patient_id: str
    notes: Optional[str] = None

class CBCTDiagnosisRequest(BaseModel):
    """Request model for CBCT diagnosis"""
    patient_id: str
    region: Optional[str] = None  # e.g., "LR_molar", "anterior_maxilla" 
    notes: Optional[str] = None

class ImageDiagnosisCreate(ImageDiagnosisBase):
    """Model for creating a new image diagnosis"""
    pass

class ImageDiagnosisUpdate(BaseModel):
    """Model for updating an image diagnosis"""
    findings: Optional[Dict[str, List[Any]]] = None
    summary: Optional[ClinicalSummary] = None

class ImageDiagnosisResponse(ImageDiagnosisBase):
    """Model for image diagnosis API response"""
    id: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        orm_mode = True

class ImageAnalysisResponse(BaseModel):
    """Response model for image analysis endpoints"""
    status: str
    image_id: str
    patient_id: str
    upload_time: datetime
    modality: str
    analysis: Dict[str, Any]
    summary: ClinicalSummary 