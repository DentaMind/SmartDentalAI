"""
Insurance coverage validation engine.
"""

from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import List, Optional, Dict
from .payer_config import InsurancePlan
from .cdt_codes import CDTCode, get_cdt_code

@dataclass
class BenefitsUsed:
    """Benefits usage tracking"""
    preventive_used: float = 0.0
    basic_used: float = 0.0
    major_used: float = 0.0
    ortho_used: float = 0.0
    deductible_met: float = 0.0
    family_deductible_met: float = 0.0

@dataclass
class ValidationResult:
    """Coverage validation result"""
    is_covered: bool
    coverage_percent: float
    insurance_portion: float
    patient_portion: float
    requires_preauth: bool
    deductible_applies: bool
    frequency_exceeded: bool
    warnings: List[str]
    requirements_missing: List[str]
    alternate_benefit_code: Optional[str] = None

class CoverageValidator:
    """Insurance coverage validation engine"""
    
    def __init__(
        self,
        plan: InsurancePlan,
        benefits_used: BenefitsUsed,
        procedure_history: List[Dict],
        effective_date: datetime
    ):
        self.plan = plan
        self.benefits_used = benefits_used
        self.procedure_history = procedure_history
        self.effective_date = effective_date
        
    def validate_coverage(
        self,
        cdt_code: str,
        procedure_cost: float,
        tooth_number: Optional[str] = None,
        surfaces: Optional[List[str]] = None,
        quadrant: Optional[int] = None,
        service_date: Optional[datetime] = None
    ) -> ValidationResult:
        """
        Validate coverage for a procedure
        
        Args:
            cdt_code: CDT procedure code
            procedure_cost: Cost of procedure
            tooth_number: Tooth number if applicable
            surfaces: Surface selections if applicable
            quadrant: Quadrant number if applicable
            service_date: Planned service date
            
        Returns:
            Validation result with coverage details
        """
        service_date = service_date or datetime.now()
        warnings = []
        requirements = []
        
        # Get CDT code details
        cdt = get_cdt_code(cdt_code)
        if not cdt:
            return ValidationResult(
                is_covered=False,
                coverage_percent=0.0,
                insurance_portion=0.0,
                patient_portion=procedure_cost,
                requires_preauth=False,
                deductible_applies=False,
                frequency_exceeded=False,
                warnings=["Invalid CDT code"],
                requirements_missing=[]
            )
            
        # Check plan coverage rules
        coverage_rule = self.plan.coverage_rules.get(cdt_code)
        if not coverage_rule:
            # Check category default
            coverage_rule = self.plan.coverage_rules.get(
                cdt.category,
                {"covered": False, "percent": 0.0}
            )
            
        if not coverage_rule["covered"]:
            return ValidationResult(
                is_covered=False,
                coverage_percent=0.0,
                insurance_portion=0.0,
                patient_portion=procedure_cost,
                requires_preauth=False,
                deductible_applies=False,
                frequency_exceeded=False,
                warnings=["Procedure not covered"],
                requirements_missing=[]
            )
            
        # Check frequency limits
        frequency = self.plan.frequency_limits.get(cdt_code)
        frequency_exceeded = False
        if frequency:
            count = 0
            lookback = service_date - timedelta(
                days=frequency["period_days"]
            )
            
            for proc in self.procedure_history:
                if (
                    proc["cdt_code"] == cdt_code
                    and proc["date_of_service"] >= lookback
                ):
                    count += 1
                    
            if count >= frequency["max_count"]:
                frequency_exceeded = True
                warnings.append(
                    f"Frequency limit exceeded: "
                    f"{frequency['max_count']} per "
                    f"{frequency['period_days'] / 365:.1f} years"
                )
                
        # Check pre-authorization requirements
        requires_preauth = False
        preauth_rule = self.plan.preauth_requirements.get(cdt_code)
        if preauth_rule:
            requires_preauth = True
            requirements.extend(preauth_rule["required_docs"])
            
        # Check alternate benefits
        alternate_code = None
        if cdt_code in self.plan.alternate_benefits:
            alternate_code = self.plan.alternate_benefits[cdt_code]
            warnings.append(
                f"May be subject to alternate benefit: {alternate_code}"
            )
            
        # Calculate coverage
        coverage_percent = coverage_rule["percent"]
        deductible_applies = coverage_rule.get(
            "deductible_applies",
            True
        )
        
        # Apply deductible if needed
        remaining_deductible = (
            self.plan.deductible_individual
            - self.benefits_used.deductible_met
        )
        
        if (
            deductible_applies
            and remaining_deductible > 0
            and not frequency_exceeded
        ):
            deductible_portion = min(
                remaining_deductible,
                procedure_cost
            )
            insurance_portion = (
                (procedure_cost - deductible_portion)
                * coverage_percent
            )
            patient_portion = (
                procedure_cost
                - insurance_portion
            )
        else:
            insurance_portion = (
                procedure_cost * coverage_percent
            )
            patient_portion = (
                procedure_cost - insurance_portion
            )
            
        # Check annual maximum
        remaining_annual = (
            self.plan.annual_maximum
            - self.benefits_used.basic_used
            - self.benefits_used.major_used
        )
        
        if insurance_portion > remaining_annual:
            excess = insurance_portion - remaining_annual
            insurance_portion = remaining_annual
            patient_portion += excess
            warnings.append(
                f"Annual maximum exceeded by ${excess:.2f}"
            )
            
        return ValidationResult(
            is_covered=coverage_rule["covered"],
            coverage_percent=coverage_percent,
            insurance_portion=insurance_portion,
            patient_portion=patient_portion,
            requires_preauth=requires_preauth,
            deductible_applies=deductible_applies,
            frequency_exceeded=frequency_exceeded,
            warnings=warnings,
            requirements_missing=requirements,
            alternate_benefit_code=alternate_code
        ) 