"""
CDT (Code on Dental Procedures) mapping and utilities.
"""

from typing import Dict, Any, List, Optional
from dataclasses import dataclass
from enum import Enum

class ToothSurface(Enum):
    MESIAL = "M"
    OCCLUSAL = "O"
    DISTAL = "D"
    FACIAL = "F"
    LINGUAL = "L"
    BUCCAL = "B"
    INCISAL = "I"

class ProcedureCategory(Enum):
    DIAGNOSTIC = "diagnostic"
    PREVENTIVE = "preventive"
    RESTORATIVE = "restorative"
    ENDODONTICS = "endodontics"
    PERIODONTICS = "periodontics"
    PROSTHODONTICS = "prosthodontics"
    ORAL_SURGERY = "oral_surgery"
    ORTHODONTICS = "orthodontics"
    
@dataclass
class CDTCode:
    """CDT procedure code information"""
    code: str
    description: str
    category: str
    base_fee: float
    requires_tooth: bool = False
    requires_surface: bool = False
    requires_quadrant: bool = False
    requires_preauth: bool = False
    requires_xray: bool = False
    requires_narrative: bool = False
    surface_dependent: bool = False
    quadrant_dependent: bool = False
    tooth_dependent: bool = True
    max_surfaces: Optional[int] = None
    typical_coverage: float = 0.80  # 80% coverage by default
    
    def calculate_fee(
        self,
        surfaces: Optional[List[ToothSurface]] = None,
        quadrant: Optional[int] = None
    ) -> float:
        """Calculate procedure fee based on surfaces/quadrant"""
        fee = self.base_fee
        
        # Add surface multiplier
        if self.surface_dependent and surfaces:
            surface_count = len(surfaces)
            if self.max_surfaces and surface_count > self.max_surfaces:
                surface_count = self.max_surfaces
            fee *= (1 + (surface_count - 1) * 0.25)  # 25% increase per surface
            
        return round(fee, 2)

# Common CDT codes with typical fees
CDT_CODES: Dict[str, CDTCode] = {
    # Diagnostic
    "D0120": CDTCode(
        code="D0120",
        description="Periodic oral evaluation",
        category="diagnostic",
        base_fee=52.00,
        requires_tooth=False
    ),
    "D0150": CDTCode(
        code="D0150",
        description="Comprehensive oral evaluation",
        category="diagnostic",
        base_fee=93.00,
        requires_tooth=False
    ),
    "D0220": CDTCode(
        code="D0220",
        description="Intraoral periapical - first film",
        category="diagnostic",
        base_fee=31.00,
        requires_tooth=True
    ),
    "D0230": CDTCode(
        code="D0230",
        description="Intraoral periapical - each add. film",
        category="diagnostic",
        base_fee=27.00,
        requires_tooth=True
    ),
    
    # Preventive
    "D1110": CDTCode(
        code="D1110",
        description="Prophylaxis - adult",
        category="preventive",
        base_fee=89.00,
        requires_tooth=False
    ),
    "D1120": CDTCode(
        code="D1120",
        description="Prophylaxis - child",
        category="preventive",
        base_fee=63.00,
        requires_tooth=False
    ),
    
    # Restorative
    "D2140": CDTCode(
        code="D2140",
        description="Amalgam - one surface",
        category="restorative",
        base_fee=128.00,
        requires_tooth=True,
        requires_surface=True,
        max_surfaces=1
    ),
    "D2150": CDTCode(
        code="D2150",
        description="Amalgam - two surfaces",
        category="restorative",
        base_fee=163.00,
        requires_tooth=True,
        requires_surface=True,
        max_surfaces=2
    ),
    "D2160": CDTCode(
        code="D2160",
        description="Amalgam - three surfaces",
        category="restorative",
        base_fee=198.00,
        requires_tooth=True,
        requires_surface=True,
        max_surfaces=3
    ),
    "D2161": CDTCode(
        code="D2161",
        description="Amalgam - four+ surfaces",
        category="restorative",
        base_fee=237.00,
        requires_tooth=True,
        requires_surface=True,
        max_surfaces=4
    ),
    
    # Composite Resins
    "D2330": CDTCode(
        code="D2330",
        description="Resin - one surface, anterior",
        category="restorative",
        base_fee=155.00,
        requires_tooth=True,
        requires_surface=True,
        max_surfaces=1
    ),
    "D2331": CDTCode(
        code="D2331",
        description="Resin - two surfaces, anterior",
        category="restorative",
        base_fee=190.00,
        requires_tooth=True,
        requires_surface=True,
        max_surfaces=2
    ),
    "D2332": CDTCode(
        code="D2332",
        description="Resin - three surfaces, anterior",
        category="restorative",
        base_fee=232.00,
        requires_tooth=True,
        requires_surface=True,
        max_surfaces=3
    ),
    
    # Endodontics
    "D3310": CDTCode(
        code="D3310",
        description="Root canal - anterior",
        category="endodontics",
        base_fee=845.00,
        requires_tooth=True,
        requires_xray=True
    ),
    "D3320": CDTCode(
        code="D3320",
        description="Root canal - premolar",
        category="endodontics",
        base_fee=970.00,
        requires_tooth=True,
        requires_xray=True
    ),
    "D3330": CDTCode(
        code="D3330",
        description="Root canal - molar",
        category="endodontics",
        base_fee=1185.00,
        requires_tooth=True,
        requires_xray=True
    ),
    
    # Periodontics
    "D4341": CDTCode(
        code="D4341",
        description="Periodontal scaling & root planing",
        category="periodontics",
        base_fee=225.00,
        requires_quadrant=True
    ),
    
    # Prosthodontics
    "D5110": CDTCode(
        code="D5110",
        description="Complete denture - maxillary",
        category="prosthodontics",
        base_fee=1685.00,
        requires_tooth=False,
        requires_narrative=True
    ),
    "D5120": CDTCode(
        code="D5120",
        description="Complete denture - mandibular",
        category="prosthodontics",
        base_fee=1685.00,
        requires_tooth=False,
        requires_narrative=True
    ),
    
    # Oral Surgery
    "D7140": CDTCode(
        code="D7140",
        description="Extraction - erupted/exposed root",
        category="oral_surgery",
        base_fee=160.00,
        requires_xray=True
    ),
    "D7210": CDTCode(
        code="D7210",
        description="Surgical extraction - erupted tooth",
        category="oral_surgery",
        base_fee=270.00,
        requires_preauth=True,
        requires_xray=True
    ),
}

def get_cdt_code(code: str) -> Optional[CDTCode]:
    """Get CDT code details by code number"""
    return CDT_CODES.get(code)
    
def get_codes_by_category(category: ProcedureCategory) -> List[CDTCode]:
    """Get all CDT codes in a specific category"""
    return [
        code for code in CDT_CODES.values()
        if code.category == category
    ]
    
def calculate_procedure_fee(
    code: str,
    surfaces: Optional[List[ToothSurface]] = None,
    quadrant: Optional[int] = None
) -> Optional[float]:
    """Calculate procedure fee based on CDT code and modifiers"""
    cdt_code = get_cdt_code(code)
    if not cdt_code:
        return None
        
    return cdt_code.calculate_fee(surfaces, quadrant)
    
def get_preauth_requirements(code: str) -> Dict[str, bool]:
    """Get pre-authorization requirements for a CDT code"""
    cdt_code = get_cdt_code(code)
    if not cdt_code:
        return {}
        
    return {
        "requires_preauth": cdt_code.requires_preauth,
        "requires_xray": cdt_code.requires_xray,
        "requires_narrative": cdt_code.requires_narrative
    }
    
def estimate_insurance_coverage(
    code: str,
    total_fee: float
) -> Dict[str, float]:
    """Estimate insurance coverage for a procedure"""
    cdt_code = get_cdt_code(code)
    if not cdt_code:
        return {
            "total": total_fee,
            "insurance_pays": 0.0,
            "patient_pays": total_fee
        }
        
    insurance_portion = round(total_fee * cdt_code.typical_coverage, 2)
    return {
        "total": total_fee,
        "insurance_pays": insurance_portion,
        "patient_pays": round(total_fee - insurance_portion, 2)
    } 