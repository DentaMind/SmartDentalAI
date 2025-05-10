"""
Insurance payer configuration and plan rules schema.
"""

from typing import Dict, List, Optional, Union
from dataclasses import dataclass
from datetime import timedelta, datetime
from enum import Enum

class FrequencyUnit(Enum):
    DAYS = "days"
    MONTHS = "months"
    YEARS = "years"
    LIFETIME = "lifetime"

class CoverageType(Enum):
    PREVENTIVE = "preventive"
    BASIC = "basic"
    MAJOR = "major"
    ORTHODONTIC = "orthodontic"
    NOT_COVERED = "not_covered"

@dataclass
class FrequencyLimit:
    """Defines how often a procedure can be performed"""
    count: int  # Number of times allowed
    period: int  # Time period number
    unit: FrequencyUnit  # Time period unit
    per_tooth: bool = False  # Whether limit applies per tooth
    per_quadrant: bool = False  # Whether limit applies per quadrant
    
    def to_days(self) -> int:
        """Convert frequency limit to days for comparison"""
        if self.unit == FrequencyUnit.LIFETIME:
            return float('inf')
            
        conversions = {
            FrequencyUnit.DAYS: 1,
            FrequencyUnit.MONTHS: 30,
            FrequencyUnit.YEARS: 365
        }
        return self.period * conversions[self.unit]

@dataclass
class PreAuthRule:
    """Pre-authorization requirements"""
    required: bool = False
    xrays_required: bool = False
    narrative_required: bool = False
    perio_chart_required: bool = False
    photos_required: bool = False

@dataclass
class CoverageRule:
    """Coverage rules for a procedure or category"""
    coverage_type: CoverageType
    coverage_percent: float
    deductible_applies: bool = True
    frequency_limit: Optional[FrequencyLimit] = None
    preauth_rules: Optional[PreAuthRule] = None
    requires_tooth_number: bool = False
    requires_surface: bool = False
    requires_quadrant: bool = False
    max_surfaces: Optional[int] = None
    alternate_benefit_code: Optional[str] = None  # For downgrades
    
    def validate_requirements(
        self,
        tooth_number: Optional[str] = None,
        surfaces: Optional[List[str]] = None,
        quadrant: Optional[int] = None
    ) -> List[str]:
        """Validate procedure requirements are met"""
        errors = []
        
        if self.requires_tooth_number and not tooth_number:
            errors.append("Tooth number required")
            
        if self.requires_surface and not surfaces:
            errors.append("Surface selection required")
            
        if self.requires_quadrant and quadrant is None:
            errors.append("Quadrant selection required")
            
        if self.max_surfaces and surfaces and len(surfaces) > self.max_surfaces:
            errors.append(f"Maximum {self.max_surfaces} surfaces allowed")
            
        return errors

@dataclass
class InsurancePlan:
    """Insurance plan configuration"""
    payer_id: str
    plan_name: str
    group_number: str
    effective_date: datetime
    
    annual_maximum: float
    preventive_maximum: Optional[float]
    orthodontic_lifetime_maximum: Optional[float]
    
    deductible_individual: float
    deductible_family: Optional[float]
    preventive_deductible_applies: bool
    
    coverage_rules: Dict[str, Dict]
    frequency_limits: Dict[str, Dict]
    preauth_requirements: Dict[str, Dict]
    alternate_benefits: Dict[str, str]

# Common procedure category mappings
DEFAULT_COVERAGE_TYPES: Dict[str, CoverageType] = {
    # Diagnostic
    "D0120": CoverageType.PREVENTIVE,  # Periodic oral eval
    "D0150": CoverageType.PREVENTIVE,  # Comprehensive oral eval
    "D0210": CoverageType.PREVENTIVE,  # Complete FMX
    "D0220": CoverageType.PREVENTIVE,  # Periapical first film
    "D0230": CoverageType.PREVENTIVE,  # Periapical each add film
    "D0274": CoverageType.PREVENTIVE,  # Bitewings four films
    
    # Preventive
    "D1110": CoverageType.PREVENTIVE,  # Adult prophy
    "D1120": CoverageType.PREVENTIVE,  # Child prophy
    "D1206": CoverageType.PREVENTIVE,  # Fluoride
    "D1351": CoverageType.PREVENTIVE,  # Sealant
    
    # Restorative
    "D2140": CoverageType.BASIC,  # Amalgam one surface
    "D2150": CoverageType.BASIC,  # Amalgam two surfaces
    "D2160": CoverageType.BASIC,  # Amalgam three surfaces
    "D2161": CoverageType.BASIC,  # Amalgam four+ surfaces
    "D2330": CoverageType.BASIC,  # Resin one surface, anterior
    "D2331": CoverageType.BASIC,  # Resin two surfaces, anterior
    "D2332": CoverageType.BASIC,  # Resin three surfaces, anterior
    "D2391": CoverageType.BASIC,  # Resin one surface, posterior
    "D2392": CoverageType.BASIC,  # Resin two surfaces, posterior
    "D2393": CoverageType.BASIC,  # Resin three surfaces, posterior
    "D2394": CoverageType.BASIC,  # Resin four+ surfaces, posterior
    
    # Crowns
    "D2740": CoverageType.MAJOR,  # Crown - porcelain/ceramic
    "D2750": CoverageType.MAJOR,  # Crown - porcelain/high noble
    "D2751": CoverageType.MAJOR,  # Crown - porcelain/base metal
    "D2752": CoverageType.MAJOR,  # Crown - porcelain/noble
    
    # Endo
    "D3310": CoverageType.MAJOR,  # RCT - anterior
    "D3320": CoverageType.MAJOR,  # RCT - premolar
    "D3330": CoverageType.MAJOR,  # RCT - molar
    
    # Perio
    "D4341": CoverageType.BASIC,  # Scaling & root planing, per quad
    "D4342": CoverageType.BASIC,  # Scaling & root planing, 1-3 teeth
    "D4910": CoverageType.BASIC,  # Perio maintenance
    
    # Prostho
    "D5110": CoverageType.MAJOR,  # Complete denture - maxillary
    "D5120": CoverageType.MAJOR,  # Complete denture - mandibular
    "D5211": CoverageType.MAJOR,  # Partial denture - maxillary
    "D5212": CoverageType.MAJOR,  # Partial denture - mandibular
    
    # Oral Surgery
    "D7140": CoverageType.BASIC,  # Extraction - erupted/exposed
    "D7210": CoverageType.BASIC,  # Surgical extraction - erupted
    "D7220": CoverageType.BASIC,  # Removal of impacted - soft tissue
    "D7230": CoverageType.BASIC,  # Removal of impacted - partially bony
    "D7240": CoverageType.BASIC,  # Removal of impacted - completely bony
}

def create_default_plan(
    payer_id: str,
    plan_name: str,
    group_number: str
) -> InsurancePlan:
    """Create a default PPO plan configuration"""
    return InsurancePlan(
        payer_id=payer_id,
        plan_name=plan_name,
        group_number=group_number,
        effective_date=datetime.now(),
        
        annual_maximum=1500.00,
        preventive_maximum=None,  # Unlimited
        orthodontic_lifetime_maximum=1500.00,
        
        deductible_individual=50.00,
        deductible_family=150.00,
        preventive_deductible_applies=False,
        
        coverage_rules={
            # Diagnostic
            "D0120": {"covered": True, "percent": 1.0, "deductible_applies": False},
            "D0150": {"covered": True, "percent": 1.0, "deductible_applies": False},
            "D0210": {"covered": True, "percent": 1.0, "deductible_applies": False},
            "D0220": {"covered": True, "percent": 1.0, "deductible_applies": False},
            "D0230": {"covered": True, "percent": 1.0, "deductible_applies": False},
            
            # Preventive
            "D1110": {"covered": True, "percent": 1.0, "deductible_applies": False},
            "D1120": {"covered": True, "percent": 1.0, "deductible_applies": False},
            
            # Restorative
            "D2140": {"covered": True, "percent": 0.8},
            "D2150": {"covered": True, "percent": 0.8},
            "D2160": {"covered": True, "percent": 0.8},
            "D2161": {"covered": True, "percent": 0.8},
            "D2330": {"covered": True, "percent": 0.8},
            "D2331": {"covered": True, "percent": 0.8},
            "D2332": {"covered": True, "percent": 0.8},
            "D2391": {"covered": True, "percent": 0.8},
            "D2392": {"covered": True, "percent": 0.8},
            "D2393": {"covered": True, "percent": 0.8},
            "D2394": {"covered": True, "percent": 0.8},
            
            # Major
            "D2750": {"covered": True, "percent": 0.5},
            "D2751": {"covered": True, "percent": 0.5},
            "D2752": {"covered": True, "percent": 0.5},
            
            # Endodontics
            "D3310": {"covered": True, "percent": 0.8},
            "D3320": {"covered": True, "percent": 0.8},
            "D3330": {"covered": True, "percent": 0.8},
            
            # Periodontal
            "D4341": {"covered": True, "percent": 0.8},
            "D4342": {"covered": True, "percent": 0.8},
            
            # Prosthodontics
            "D5110": {"covered": True, "percent": 0.5},
            "D5120": {"covered": True, "percent": 0.5},
            "D5211": {"covered": True, "percent": 0.5},
            "D5212": {"covered": True, "percent": 0.5},
            
            # Oral Surgery
            "D7140": {"covered": True, "percent": 0.8},
            "D7210": {"covered": True, "percent": 0.8},
            
            # Orthodontics
            "D8080": {"covered": True, "percent": 0.5},
            "D8090": {"covered": True, "percent": 0.5}
        },
        
        frequency_limits={
            # Exams
            "D0120": {
                "max_count": 2,
                "period_days": 365  # 2 per year
            },
            "D0150": {
                "max_count": 1,
                "period_days": 1095  # 1 per 3 years
            },
            
            # X-rays
            "D0210": {
                "max_count": 1,
                "period_days": 1825  # 1 per 5 years
            },
            
            # Cleanings
            "D1110": {
                "max_count": 2,
                "period_days": 365  # 2 per year
            },
            "D1120": {
                "max_count": 2,
                "period_days": 365  # 2 per year
            }
        },
        
        preauth_requirements={
            # Crowns
            "D2750": {
                "required_docs": ["X-rays", "Narrative"]
            },
            "D2751": {
                "required_docs": ["X-rays", "Narrative"]
            },
            "D2752": {
                "required_docs": ["X-rays", "Narrative"]
            },
            
            # Root Canals
            "D3310": {
                "required_docs": ["X-rays"]
            },
            "D3320": {
                "required_docs": ["X-rays"]
            },
            "D3330": {
                "required_docs": ["X-rays"]
            },
            
            # Periodontal
            "D4341": {
                "required_docs": ["Perio Chart", "X-rays"]
            },
            "D4342": {
                "required_docs": ["Perio Chart", "X-rays"]
            },
            
            # Dentures
            "D5110": {
                "required_docs": ["Treatment Plan", "Narrative"]
            },
            "D5120": {
                "required_docs": ["Treatment Plan", "Narrative"]
            }
        },
        
        alternate_benefits={
            # Posterior composites alternate to amalgam
            "D2391": "D2140",
            "D2392": "D2150",
            "D2393": "D2160",
            "D2394": "D2161",
            
            # PFM crowns alternate to full metal
            "D2750": "D2790",
            "D2751": "D2791",
            "D2752": "D2792"
        }
    ) 