from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Enum, JSON, Boolean, Text
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid
import enum
from datetime import datetime
from .base import Base

class ToothSurface(str, enum.Enum):
    """Dental surfaces for restorations"""
    MESIAL = "M"
    OCCLUSAL = "O" 
    DISTAL = "D"
    BUCCAL = "B"
    LINGUAL = "L"
    FACIAL = "F"
    INCISAL = "I"

class RestorationType(str, enum.Enum):
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

class ToothStatus(str, enum.Enum):
    """Status of a tooth"""
    PRESENT = "present"
    MISSING = "missing"
    EXTRACTED = "extracted"
    IMPACTED = "impacted"
    PLANNED_EXTRACTION = "planned_extraction"
    PLANNED_IMPLANT = "planned_implant"

class RestorationCondition(str, enum.Enum):
    """Condition of a restoration"""
    GOOD = "good"
    MARGINAL_LEAKAGE = "marginal_leakage"
    FRACTURE = "fracture"
    RECURRENT_DECAY = "recurrent_decay"
    DISCOLORATION = "discoloration"
    WEAR = "wear"

class ToothRestorationHistory(Base):
    """Model for tracking history of restorations per tooth"""
    __tablename__ = "tooth_restoration_history"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id = Column(String, nullable=False, index=True)
    tooth_number = Column(String, nullable=False)
    restoration_type = Column(Enum(RestorationType), nullable=False)
    surfaces = Column(JSON, nullable=True)  # Array of surfaces
    procedure_date = Column(DateTime, nullable=False)
    provider_id = Column(String, nullable=True)
    condition = Column(Enum(RestorationCondition), default=RestorationCondition.GOOD)
    is_current = Column(Boolean, default=True)  # Whether this is the current restoration
    replaced_by_id = Column(UUID(as_uuid=True), ForeignKey("tooth_restoration_history.id"), nullable=True)
    notes = Column(Text, nullable=True)
    xray_confirmation_id = Column(String, nullable=True)  # Link to confirming X-ray
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Self-referential relationship for tracking replacements
    replacement = relationship("ToothRestorationHistory", 
                              remote_side=[id],
                              backref="replaced_restoration")
    
    def __repr__(self):
        return f"<ToothRestoration {self.tooth_number}: {self.restoration_type}>"

class ToothChart(Base):
    """Model for the current tooth status chart"""
    __tablename__ = "tooth_chart"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id = Column(String, nullable=False, index=True)
    tooth_number = Column(String, nullable=False)
    status = Column(Enum(ToothStatus), default=ToothStatus.PRESENT)
    current_restoration_id = Column(UUID(as_uuid=True), 
                                   ForeignKey("tooth_restoration_history.id"), 
                                   nullable=True)
    last_updated = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    notes = Column(Text, nullable=True)
    
    # Relationship to current restoration
    current_restoration = relationship("ToothRestorationHistory")
    
    def __repr__(self):
        return f"<ToothChart {self.patient_id}: Tooth {self.tooth_number} - {self.status}>" 