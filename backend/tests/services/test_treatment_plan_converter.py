import pytest
from datetime import datetime
from api.models.claims import InsuranceClaim, ClaimStatus, ClaimProcedure
from api.models.treatment_plans import TreatmentPlan, TreatmentPlanStatus, TreatmentPlanProcedure
from api.services.treatment_plan_converter import TreatmentPlanConverter

@pytest.fixture
def sample_treatment_plan():
    """Create a sample treatment plan for testing"""
    return TreatmentPlan(
        id="tp-123",
        patient_id="patient-123",
        patient_name="John Doe",
        status=TreatmentPlanStatus.APPROVED,
        procedures=[
            TreatmentPlanProcedure(
                procedure_code="D2391",
                description="Resin-based composite - one surface, posterior",
                fee=150.00,
                insurance_covered=True
            ),
            TreatmentPlanProcedure(
                procedure_code="D1110",
                description="Prophylaxis - adult",
                fee=100.00,
                insurance_covered=True
            ),
            TreatmentPlanProcedure(
                procedure_code="D2750",
                description="Crown - porcelain fused to high noble metal",
                fee=1200.00,
                insurance_covered=False  # Not covered by insurance
            )
        ]
    )

def test_convert_to_claim_success(sample_treatment_plan):
    """Test successful conversion of a treatment plan to a claim"""
    insurance_provider_id = "ins-123"
    claim = TreatmentPlanConverter.convert_to_claim(sample_treatment_plan, insurance_provider_id)

    # Verify claim structure
    assert isinstance(claim, InsuranceClaim)
    assert claim.patient_id == sample_treatment_plan.patient_id
    assert claim.patient_name == sample_treatment_plan.patient_name
    assert claim.status == ClaimStatus.SUBMITTED
    assert claim.treatment_plan_id == sample_treatment_plan.id
    assert claim.insurance_provider_id == insurance_provider_id

    # Verify procedures (should only include insurance-covered ones)
    assert len(claim.procedures) == 2  # Only 2 procedures are insurance-covered
    assert all(isinstance(proc, ClaimProcedure) for proc in claim.procedures)
    assert all(proc.code in ["D2391", "D1110"] for proc in claim.procedures)

    # Verify total amount (should only include insurance-covered procedures)
    expected_total = 150.00 + 100.00  # Only the covered procedures
    assert claim.total_amount == expected_total

    # Verify claim number format
    assert claim.claim_number.startswith("CLM-")
    assert len(claim.claim_number.split("-")) == 3  # Format: CLM-YYYYMMDD-UUID

def test_convert_to_claim_with_custom_claim_number(sample_treatment_plan):
    """Test conversion with a custom claim number"""
    custom_claim_number = "CUSTOM-123"
    claim = TreatmentPlanConverter.convert_to_claim(
        sample_treatment_plan,
        "ins-123",
        claim_number=custom_claim_number
    )
    assert claim.claim_number == custom_claim_number

def test_convert_to_claim_invalid_status():
    """Test conversion with a non-approved treatment plan"""
    treatment_plan = TreatmentPlan(
        id="tp-123",
        patient_id="patient-123",
        patient_name="John Doe",
        status=TreatmentPlanStatus.DRAFT,  # Not approved
        procedures=[
            TreatmentPlanProcedure(
                procedure_code="D2391",
                description="Test procedure",
                fee=100.00,
                insurance_covered=True
            )
        ]
    )

    with pytest.raises(ValueError, match="Only approved treatment plans can be converted to claims"):
        TreatmentPlanConverter.convert_to_claim(treatment_plan, "ins-123")

def test_convert_to_claim_no_covered_procedures():
    """Test conversion with a treatment plan that has no insurance-covered procedures"""
    treatment_plan = TreatmentPlan(
        id="tp-123",
        patient_id="patient-123",
        patient_name="John Doe",
        status=TreatmentPlanStatus.APPROVED,
        procedures=[
            TreatmentPlanProcedure(
                procedure_code="D2750",
                description="Crown",
                fee=1200.00,
                insurance_covered=False
            )
        ]
    )

    with pytest.raises(ValueError, match="Treatment plan cannot be converted to a claim"):
        TreatmentPlanConverter.convert_to_claim(treatment_plan, "ins-123")

def test_validate_treatment_plan_for_claim(sample_treatment_plan):
    """Test treatment plan validation"""
    assert TreatmentPlanConverter.validate_treatment_plan_for_claim(sample_treatment_plan) is True

def test_validate_treatment_plan_for_claim_invalid_status():
    """Test validation with invalid treatment plan status"""
    treatment_plan = TreatmentPlan(
        id="tp-123",
        patient_id="patient-123",
        patient_name="John Doe",
        status=TreatmentPlanStatus.DRAFT,  # Not approved
        procedures=[
            TreatmentPlanProcedure(
                procedure_code="D2391",
                description="Test procedure",
                fee=100.00,
                insurance_covered=True
            )
        ]
    )
    assert TreatmentPlanConverter.validate_treatment_plan_for_claim(treatment_plan) is False

def test_validate_treatment_plan_for_claim_missing_fields():
    """Test validation with missing required fields"""
    treatment_plan = TreatmentPlan(
        id="tp-123",
        patient_id="",  # Missing patient ID
        patient_name="John Doe",
        status=TreatmentPlanStatus.APPROVED,
        procedures=[]  # Missing procedures
    )
    assert TreatmentPlanConverter.validate_treatment_plan_for_claim(treatment_plan) is False 