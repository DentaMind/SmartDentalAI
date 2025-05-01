from sqlalchemy import Column, String, JSON, DateTime, Enum as SQLEnum
from sqlalchemy.sql import func
from sqlalchemy.dialects.postgresql import UUID
import uuid
import enum
from datetime import datetime
from pydantic import BaseModel, Field
from typing import Dict, Any, Optional, List

from .base import Base

class ImageModality(str, enum.Enum):
    """Enum for different imaging modalities"""
    FMX = "FMX"
    PANORAMIC = "PANORAMIC"
    CBCT = "CBCT"
    BITEWING = "BITEWING"
    PERIAPICAL = "PERIAPICAL"
    CEPHALOMETRIC = "CEPHALOMETRIC"

# SQLAlchemy ORM Model
class ImageDiagnosis(Base):
    """SQLAlchemy model for storing image diagnosis results"""
    __tablename__ = "image_diagnosis"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id = Column(String, nullable=False, index=True)
    image_id = Column(String, nullable=False, index=True)
    modality = Column(SQLEnum(ImageModality), nullable=False)
    findings = Column(JSON, nullable=False)
    summary = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

# Pydantic models for API validation
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

class ImageDiagnosisBase(BaseModel):
    """Base model for image diagnosis"""
    patient_id: str
    image_id: str
    modality: ImageModality
    findings: Dict[str, List[Any]]
    summary: Optional[str] = None

class ImageDiagnosisCreate(ImageDiagnosisBase):
    """Model for creating a new image diagnosis"""
    pass

class ImageDiagnosisResponse(ImageDiagnosisBase):
    """Model for image diagnosis API response"""
    id: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        orm_mode = True 