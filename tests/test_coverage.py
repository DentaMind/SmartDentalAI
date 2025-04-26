"""
Tests for insurance coverage validation.
"""

import pytest
from datetime import datetime, timedelta

from insurance.payer_config import (
    InsurancePlan,
    CoverageRule,
    CoverageType,
    FrequencyLimit,
    FrequencyUnit,
    PreAuthRule,
    create_default_plan
)
from insurance.coverage_validator import (
    CoverageValidator,
    ProcedureHistory,
    BenefitsUsed
)

@pytest.fixture
def basic_plan():
    """Create a basic insurance plan for testing"""
    return create_default_plan(
        payer_id="TEST01",
        plan_name="Test PPO Plan",
        group_number="12345"
    )

@pytest.fixture
def validator(basic_plan):
    """Create a coverage validator with a basic plan"""
    return CoverageValidator(plan=basic_plan)

def test_preventive_coverage(validator):
    """Test coverage for preventive procedures"""
    # Test routine cleaning
    result = validator.validate_coverage(
        cdt_code="D1110",
        procedure_cost=89.00
    )
    
    assert result.is_covered
    assert result.coverage_percent == 1.0  # 100%
    assert result.insurance_portion == 89.00
    assert result.patient_portion == 0.00
    assert not result.deductible_applies
    assert not result.requires_preauth
    assert not result.warnings
    
def test_basic_coverage(validator):
    """Test coverage for basic procedures"""
    # Test two-surface filling
    result = validator.validate_coverage(
        cdt_code="D2392",
        procedure_cost=190.00,
        tooth_number="14",
        surfaces=["MO"]
    )
    
    assert result.is_covered
    assert result.coverage_percent == 0.8  # 80%
    assert result.insurance_portion == 152.00
    assert result.patient_portion == 38.00
    assert result.deductible_applies
    assert not result.requires_preauth
    
def test_major_coverage(validator):
    """Test coverage for major procedures"""
    # Test crown
    result = validator.validate_coverage(
        cdt_code="D2740",
        procedure_cost=1200.00,
        tooth_number="19"
    )
    
    assert result.is_covered
    assert result.coverage_percent == 0.5  # 50%
    assert result.insurance_portion == 600.00
    assert result.patient_portion == 600.00
    assert result.deductible_applies
    assert result.requires_preauth
    
def test_frequency_limits(validator):
    """Test procedure frequency limit validation"""
    # Add history of recent cleaning
    three_months_ago = datetime.now() - timedelta(days=90)
    validator.procedure_history.append(
        ProcedureHistory(
            cdt_code="D1110",
            date_of_service=three_months_ago
        )
    )
    
    # Try to validate another cleaning
    result = validator.validate_coverage(
        cdt_code="D1110",
        procedure_cost=89.00
    )
    
    assert result.is_covered  # Should be covered (within 2/year limit)
    
    # Add another recent cleaning
    one_month_ago = datetime.now() - timedelta(days=30)
    validator.procedure_history.append(
        ProcedureHistory(
            cdt_code="D1110",
            date_of_service=one_month_ago
        )
    )
    
    # Try to validate a third cleaning
    result = validator.validate_coverage(
        cdt_code="D1110",
        procedure_cost=89.00
    )
    
    assert not result.is_covered
    assert result.frequency_exceeded
    assert any("Frequency limit exceeded" in w for w in result.warnings)
    
def test_benefits_maximum(validator):
    """Test annual maximum validation"""
    # Set benefits used close to maximum
    validator.benefits_used.basic_used = 1400.00
    
    # Try to validate a filling
    result = validator.validate_coverage(
        cdt_code="D2392",
        procedure_cost=190.00,
        tooth_number="14",
        surfaces=["MO"]
    )
    
    assert not result.is_covered
    assert any("Annual maximum reached" in w for w in result.warnings)
    
def test_waiting_periods(validator):
    """Test waiting period validation"""
    # Set plan effective date to recent
    validator.effective_date = datetime.now() - timedelta(days=30)
    
    # Add waiting period to plan
    validator.plan.major_waiting_period = 180  # 6 months
    
    # Try to validate a crown
    result = validator.validate_coverage(
        cdt_code="D2740",
        procedure_cost=1200.00,
        tooth_number="19"
    )
    
    assert not result.is_covered
    assert any("waiting period" in w for w in result.warnings)
    
def test_alternate_benefits(basic_plan):
    """Test alternate benefit provisions"""
    # Create rule with alternate benefit
    basic_plan.add_coverage_rule(
        "D2751",  # PFM crown
        CoverageRule(
            coverage_type=CoverageType.MAJOR,
            coverage_percent=0.5,
            alternate_benefit_code="D2751",  # Downgrade to base metal
            preauth_rules=PreAuthRule(required=True)
        )
    )
    
    validator = CoverageValidator(plan=basic_plan)
    
    # Validate crown with alternate benefit
    result = validator.validate_coverage(
        cdt_code="D2750",
        procedure_cost=1200.00,
        tooth_number="19"
    )
    
    assert result.alternate_benefit_code == "D2751"
    assert any("alternate benefit" in w for w in result.warnings)
    
def test_requirements_validation(validator):
    """Test procedure requirement validation"""
    # Test missing tooth number
    result = validator.validate_coverage(
        cdt_code="D2392",
        procedure_cost=190.00,
        surfaces=["MO"]  # Missing tooth number
    )
    
    assert not result.is_covered
    assert "Tooth number required" in result.requirements_missing
    
    # Test missing surfaces
    result = validator.validate_coverage(
        cdt_code="D2392",
        procedure_cost=190.00,
        tooth_number="14"  # Missing surfaces
    )
    
    assert not result.is_covered
    assert "Surface selection required" in result.requirements_missing
    
    # Test missing quadrant
    result = validator.validate_coverage(
        cdt_code="D4341",
        procedure_cost=225.00  # Missing quadrant
    )
    
    assert not result.is_covered
    assert "Quadrant selection required" in result.requirements_missing 